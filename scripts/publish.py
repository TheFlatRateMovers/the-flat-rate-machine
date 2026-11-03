#!/usr/bin/env python3
"""publish.py — S3 close driver: the freeze -> deploy sequence as a tool.

    python3 scripts/publish.py --message "<batch commit message>"

Spec (out/speed-batch-s3-spec-2026-11-03.md, FREEZE -> DEPLOY): once
seal.py has frozen + signed the estate, ONE invocation carries the
batch the rest of the way, in this order:

  1. Pages deploy + GitHub pushes IN PARALLEL (neither waits on the
     other; both are attempted even if one fails).
  2. Full live verify — deployment-unique URL first (verify.js
     --base-url), then the production alias run as the closing gate.
  3. API refresh (bundle -> tests -> worker deploy).
  4. Pulse seal mode (IndexNow from the signed-index diff; the prior
     is the seal's own phase-0 snapshot, out/seal-work/prior-index.json).

A failure at any step exits nonzero and stops the sequence — a batch
that stops between sign and deploy is FAILED, never "sealed". The
deploy uses the standing Cloudflare surrogate route (dynamic_
credentials, child env only, never printed); the push uses
scripts/push-mirrors.py (persistent clones, one commit per repo;
git push over the SSH deploy-key route since 2026-11-03, the
connector one-shot only as a reported fallback when git fails).
Timings print per step. Steps can be skipped individually for repair
runs (--skip-deploy/--skip-push/--skip-verify/--skip-api/--skip-pulse);
a skipped step is printed as SKIPPED, never silently.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import threading
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(ROOT, "paths.json"), encoding="utf-8") as f:
    REG = json.load(f)
PUB = REG["public_dir"]
PAGES = REG["pages_dir"]
API_DIR = REG["api_worker_dir"]
WORK = os.path.join(ROOT, "out", "seal-work")
sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")


def cf_env():
    from dynamic_credentials import dynamic_credential_entry
    env = dict(os.environ)
    env["CLOUDFLARE_API_TOKEN"] = dynamic_credential_entry(
        "custom.cloudflare")["surrogate"]
    return env


def run(cmd, cwd=ROOT, env=None, label=""):
    t = time.time()
    p = subprocess.run(cmd, cwd=cwd, env=env, stdout=subprocess.PIPE,
                       stderr=subprocess.STDOUT, text=True)
    dt = time.time() - t
    print(f"    [{dt:5.1f}s] {label or ' '.join(cmd[:3])} -> exit "
          f"{p.returncode}", flush=True)
    return p.returncode, p.stdout or "", dt


def fail(msg):
    print(f"PUBLISH FAILED: {msg}")
    sys.exit(1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--message", required=True)
    ap.add_argument("--skip-deploy", action="store_true")
    ap.add_argument("--skip-push", action="store_true")
    ap.add_argument("--skip-verify", action="store_true")
    ap.add_argument("--skip-api", action="store_true")
    ap.add_argument("--skip-pulse", action="store_true")
    ap.add_argument("--pulse-prior", default=None,
                    help="index JSON to diff Pulse against (default: "
                         "the seal's phase-0 snapshot)")
    ap.add_argument("--extra-map-ai", action="append", default=[],
                    help="push-mirrors extra map for the ai repo "
                         "(REL=ABS_SRC, repeatable)")
    ap.add_argument("--extra-map-machine", action="append", default=[],
                    help="push-mirrors extra map for the machine repo "
                         "(REL=ABS_SRC, repeatable)")
    args = ap.parse_args()
    t0 = time.time()
    timings = {}

    # 1. deploy + push in parallel
    results = {}

    def do_deploy():
        if args.skip_deploy:
            results["deploy"] = (0, "", 0.0, None)
            return
        rc, out, dt = run(
            ["npx", "wrangler", "pages", "deploy", "public",
             "--project-name=the-flat-rate-movers"],
            cwd=PAGES, env=cf_env(), label="wrangler pages deploy")
        m = re.search(r"https://[a-z0-9]+\.the-flat-rate-movers"
                      r"\.pages\.dev", out)
        results["deploy"] = (rc, out, dt, m.group(0) if m else None)

    def do_push():
        if args.skip_push:
            results["push"] = (0, "", 0.0, "SKIPPED")
            return
        # One push-mirrors call per repo (one commit each); extra maps
        # are per-repo, so the calls are split by repo.
        outs, rcs, t = [], [], time.time()
        for repo, extras in (("ai", args.extra_map_ai),
                             ("machine", args.extra_map_machine)):
            cmd = [sys.executable, os.path.join(ROOT, "scripts",
                                                "push-mirrors.py"),
                   "--message", args.message, "--repo", repo]
            for em in extras:
                cmd += ["--extra-map", em]
            rc1, out1, _ = run(cmd, label=f"push-mirrors {repo}")
            rcs.append(rc1)
            outs.append(f"[{repo}] {out1[-1200:]}")
        results["push"] = (0 if all(r == 0 for r in rcs) else 1,
                           "\n".join(outs), time.time() - t, None)

    print("--- 1. Pages deploy + GitHub push (parallel)", flush=True)
    threads = [threading.Thread(target=do_deploy),
               threading.Thread(target=do_push)]
    for th in threads:
        th.start()
    for th in threads:
        th.join()
    for name in ("deploy", "push"):
        rc, out, dt, extra = results[name]
        timings[name] = dt
        print(f"    {name}: exit {rc}"
              + (f", deployment {extra}" if extra else ""))
        if rc != 0:
            print(out[-3000:])
            fail(f"step 1 {name} failed")
    deployment_url = results["deploy"][3]

    # 2. verify: deployment-unique URL first, alias closing gate last
    if args.skip_verify:
        print("--- 2. live verify SKIPPED")
    else:
        print("--- 2. live verify (deployment URL first, alias last)",
              flush=True)
        if deployment_url:
            rc, out, dt = run(
                ["node", "verify.js", "--base-url", deployment_url,
                 "--verdicts-out", os.path.join(
                     WORK, "verdicts-deployment.json")],
                label="verify vs deployment URL")
            timings["verify-deployment"] = dt
            print("\n".join(out.strip().splitlines()[-4:]))
            if rc != 0:
                fail("deployment-URL verify failed")
        else:
            print("    no deployment URL captured (deploy skipped?) — "
                  "alias run is the only gate")
        rc, out, dt = run(
            ["node", "verify.js", "--verdicts-out",
             os.path.join(WORK, "verdicts-alias.json")],
            label="verify vs production alias (closing gate)")
        timings["verify-alias"] = dt
        print("\n".join(out.strip().splitlines()[-4:]))
        if rc != 0:
            fail("alias verify failed (closing gate)")

    # 3. API refresh: bundle -> tests -> deploy
    if args.skip_api:
        print("--- 3. API refresh SKIPPED")
    else:
        print("--- 3. API refresh", flush=True)
        rc, out, dt = run([sys.executable, os.path.join(
            API_DIR, "scripts", "refresh-bundle.py")], cwd=API_DIR,
            label="refresh-bundle")
        if rc != 0:
            print(out[-3000:])
            fail("API refresh-bundle failed")
        rc, out, dt = run(["node", "test/run-tests.mjs"], cwd=API_DIR,
                          label="API tests")
        print("\n".join(out.strip().splitlines()[-3:]))
        if rc != 0:
            fail("API tests failed")
        rc, out, dt = run(["npx", "wrangler", "deploy"], cwd=API_DIR,
                          env=cf_env(), label="API worker deploy")
        timings["api"] = dt
        if rc != 0:
            print(out[-3000:])
            fail("API worker deploy failed")

    # 4. Pulse (seal mode; prior defaults to the seal's phase-0
    # snapshot — a batch that sealed more than once passes the
    # PRE-BATCH index via --pulse-prior, since the last seal's
    # snapshot is its own predecessor, not the batch's baseline)
    if args.skip_pulse:
        print("--- 4. Pulse SKIPPED")
    else:
        print("--- 4. Pulse (seal mode)", flush=True)
        prior = args.pulse_prior or os.path.join(WORK,
                                                 "prior-index.json")
        if not os.path.exists(prior):
            fail(f"pulse prior snapshot missing: {prior}")
        pulse_dir = os.path.join(ROOT, "out", "pulse")
        os.makedirs(pulse_dir, exist_ok=True)
        # IndexNow key: PUBLIC by design (served as <key>.txt from
        # both hosts' roots); pulse.mjs also accepts INDEXNOW_KEY env.
        pulse_env = dict(os.environ)
        pulse_env.setdefault(
            "INDEXNOW_KEY",
            "bbf7b7d5281876c13897f6e1498f6cc56abb3487f12603698128f7b08bae3a6d")
        rc, out, dt = run(
            ["node", "scripts/pulse.mjs", "--mode", "seal",
             "--index", os.path.join(PUB, "ai-master-index.json"),
             "--prior-index", prior,
             "--sitemap-dir", PUB,
             "--rubric-db", REG["rubric_db"],
             "--state", os.path.join(pulse_dir, "state.json"),
             "--receipts", os.path.join(pulse_dir, "receipts.ndjson")],
            env=pulse_env, label="pulse seal")
        timings["pulse"] = dt
        print("\n".join(out.strip().splitlines()[-6:]))
        if rc != 0:
            fail(f"pulse exited {rc}")

    total = time.time() - t0
    print(f"\nPUBLISH OK — {total:.1f}s total; timings: " +
          ", ".join(f"{k} {v:.1f}s" for k, v in timings.items()))
    if deployment_url:
        print(f"  deployment: {deployment_url}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
