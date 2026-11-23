#!/usr/bin/env python3
"""publish.py — S3 close driver: the freeze -> deploy sequence as a tool.

    python3 scripts/publish.py --message "<batch commit message>"

Spec (out/speed-batch-s3-spec-2026-11-03.md, FREEZE -> DEPLOY): once
seal.py has frozen + signed the estate, ONE invocation carries the
batch the rest of the way, in this order:

  0. Preflight (Reconciliation batch, 2026-11-03; local verify added
     in the Day-3 drift fix, 2026-11-04): the twin-identity gate
     (scripts/check-twins.js) + the full local verification
     (verify.js --local) + a live probe of both GitHub push routes
     (git ls-remote through each clone). Audit Layer Phase 2
     (2026-11-19): the estate pre-flight registry
     (scripts/audit-preflight.py — the 13 permanent checks of
     DESIGN.md piece 2) runs FIRST inside step 0, the tree-state
     stamp (piece 4) is refreshed, and a verify failure here emits
     a diagnosis pack (piece 3) per failed check class. Suite A1
     (installed 2026-11-21): the prediction pass
     (scripts/predict.py) also runs inside step 0, as the batch
     step-0 gate's enforcement backstop — it re-proves the sealed
     tree against the batch folder's declared delta/spec before
     anything ships. The Page Data Pool close
     discovered a stale twin and a dead push route only AFTER
     deploying, and the Day-3 close deployed a figure-drifted tree
     that only the post-deploy verify caught; preflight stops the
     close BEFORE anything ships, with a plain-words reason.
     --preflight-only runs just this step; --skip-preflight skips
     it (printed, never silent).
  1. Pages deploy + GitHub pushes IN PARALLEL (neither waits on the
     other; both are attempted even if one fails).
  2. Full live verify — deployment-unique URL first (verify.js
     --base-url), then the production alias run as the closing gate.
  3. API refresh (bundle -> tests -> worker deploy).
  4. Sitemap re-submission (Search Console API, added 2026-11-11):
     the six sitemap files are re-submitted via
     scripts/submit-sitemaps.py so Google re-reads the maps at the
     new seal without waiting for its own refetch schedule.
     WARN-ONLY: a Google-side failure prints loudly and is named,
     but never fails the close — the deploy is already verified
     live by this point in the sequence.
  4b. WebSub publish ping (AI-to-AI signal batch, 2026-11-23):
     scripts/ping-websub.py announces the changed estate feeds to
     the WebSub hub (https://pubsubhubbub.appspot.com/, declared by
     both feeds via <atom:link rel="hub">) so subscribers fetch the
     new feed immediately. Runs beside step 4, AFTER step 2 has
     proven the changed feeds live (ping-websub.py's standing
     fire-order rule). Only feeds whose signed-index distribution
     digest changed in this batch are pinged (prior index = the
     --pulse-prior index, else the seal's phase-0 snapshot; an
     indeterminate changed-set pings BOTH feeds). WARN-ONLY, same
     contract as step 4: a hub failure prints loudly and never
     fails the close.
  5. Pulse seal mode (IndexNow from the signed-index diff; the prior
     is the seal's own phase-0 snapshot, out/seal-work/prior-index.json).

A failure at any step exits nonzero and stops the sequence — a batch
that stops between sign and deploy is FAILED, never "sealed". The
deploy uses the standing Cloudflare surrogate route (dynamic_
credentials, child env only, never printed); the push uses
scripts/push-mirrors.py (persistent clones, one commit per repo;
git push over the SSH deploy-key route since 2026-11-03, the
connector one-shot only as a reported fallback when git fails).
Timings print per step. Steps can be skipped individually for repair
runs (--skip-deploy/--skip-push/--skip-verify/--skip-api/
--skip-sitemaps/--skip-websub/--skip-pulse);
a skipped step is printed as SKIPPED, never silently.
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import threading
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(ROOT, "paths.json"), encoding="utf-8") as f:
    REG = json.load(f)
PUB = REG["public_dir"]
PAGES = REG["pages_dir"]
API_DIR = REG["api_worker_dir"]
WORK = os.path.join(ROOT, "out", "seal-work")
sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import close_state  # VF6 gate: shared close-state + lane-lock


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
    CLOSE_CTX["reason"] = msg
    write_close_state("FAILED-CLOSED")
    print(f"PUBLISH FAILED: {msg}")
    sys.exit(1)


# --- VF6 permanent gate (2026-11-23; design:
# out/vf6-divergence-fix-2026-11-23/BATCH-RECORD.md §3) ---------
# G-1 step-2 verify settle + re-run once; G-2 close-state on every
# exit; G-3 lane-lock at entry; G-4 mirror proof between push and
# deploy. The close-state writer + lane-lock live in the shared
# module scripts/close_state.py (one seat; close-batch.py and
# seal.py use the same code).

CLOSE_CTX = {
    "armed": False, "batch": None, "batch_dir": None,
    "message": None, "step": "init", "reason": None,
    "failed_checks": [], "verify_transients": [],
    "superseded": None, "deployment_url": None, "written": False,
}


def _index_fingerprint():
    try:
        with open(os.path.join(PUB, "ai-master-index.json"),
                  "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except Exception:
        return None


def _failed_checks(verdicts_path):
    try:
        with open(verdicts_path, encoding="utf-8") as f:
            d = json.load(f)
        return [c.get("name", "?") for c in d
                if isinstance(c, dict) and c.get("ok") is False]
    except Exception:
        return []


def write_close_state(state):
    if CLOSE_CTX["written"] or not CLOSE_CTX["armed"]:
        return
    CLOSE_CTX["written"] = True
    close_state.write(
        state, batch=CLOSE_CTX["batch"],
        batch_dir=CLOSE_CTX["batch_dir"], step=CLOSE_CTX["step"],
        reason=CLOSE_CTX["reason"],
        failed_checks=CLOSE_CTX["failed_checks"],
        verify_transients=CLOSE_CTX["verify_transients"],
        superseded=CLOSE_CTX["superseded"],
        deployment_url=CLOSE_CTX["deployment_url"],
        message=CLOSE_CTX["message"],
        index_sha256=_index_fingerprint(),
        tool="publish.py")


def verify_gate(cmd, label, verdicts_name, step_label):
    """One live-verify gate with the settle + re-run the VF6
    close lacked: a failed live verify is re-run ONCE after a
    settle wait (default 240 s; PUBLISH_VERIFY_SETTLE_S) before
    it may fail the publish — the estate's P-3 propagation
    protocol, generalized to every live-fetch check. A pass on
    the re-run records the first run's failed checks as
    transients in the close-state; a second failure fails the
    publish on the re-run's verdicts."""
    verdicts_path = os.path.join(WORK, verdicts_name)
    rc, out, dt = run(cmd, label=label)
    print("\n".join(out.strip().splitlines()[-4:]))
    if rc == 0:
        return dt
    first_failed = _failed_checks(verdicts_path)
    settle = int(os.environ.get("PUBLISH_VERIFY_SETTLE_S", "240"))
    print(f"    {step_label}: live verify failed "
          f"({', '.join(first_failed) or 'no verdicts file'}) — "
          f"settling {settle}s, then re-running the SAME verify "
          f"once (edge-propagation protocol; VF6 gate G-1)",
          flush=True)
    if settle > 0:
        time.sleep(settle)
    retry_path = os.path.join(
        WORK, verdicts_name.replace(".json", "-retry.json"))
    cmd2 = [retry_path if c == verdicts_path else c for c in cmd]
    rc2, out2, dt2 = run(cmd2, label=label + " (settle re-run)")
    print("\n".join(out2.strip().splitlines()[-4:]))
    if rc2 == 0:
        CLOSE_CTX["verify_transients"].append(
            {"gate": step_label, "first_run_failed": first_failed})
        print(f"    {step_label}: re-run PASSED — first-run "
              f"failures recorded as propagation transients: "
              f"{', '.join(first_failed)}")
        return dt + dt2
    CLOSE_CTX["failed_checks"] = _failed_checks(retry_path)
    fail(f"{step_label} failed after the settle re-run "
         f"(failed: {', '.join(CLOSE_CTX['failed_checks'])})")


def mirror_proof():
    """Step 1b (VF6 gate G-4): after push-mirrors, BEFORE the
    Pages deploy, prove the GitHub seats carry the sealed bytes:
    every GitHub-seat distribution in the sealed index must exist
    in its clone's NEW committed tree with matching SHA-256 +
    byteSize, and the commit-pinned raw.githubusercontent bytes
    must match the index. A miss fails the publish HERE, naming
    the files — the untracked-file / unpushed-commit divergence
    can never again surface as a post-deploy verify failure."""
    print("--- 1b. mirror proof (sealed index vs committed + "
          "served bytes)", flush=True)
    with open(os.path.join(PUB, "ai-master-index.json"),
              encoding="utf-8") as f:
        idx = json.load(f)
    heads, problems, checked = {}, [], 0
    for repo, clone in CLONES.items():
        rc, out, _ = run(["git", "-C", clone, "rev-parse", "HEAD"],
                         label=f"git HEAD {repo}")
        if rc != 0:
            fail(f"mirror proof: cannot read {repo} clone HEAD")
        heads[repo] = out.strip()
    for e in idx.get("distribution") or []:
        url = e.get("contentUrl") or ""
        if "raw.githubusercontent.com" not in url:
            continue
        checked += 1
        parts = url.split("raw.githubusercontent.com/", 1)[1] \
            .split("/")
        owner_repo, path = parts[1], "/".join(parts[3:])
        repo = "ai" if owner_repo == "theflatratemovers-ai" \
            else "machine"
        dig = e.get("digest") or {}
        want_sha, want_size = dig.get("value"), dig.get("byteSize")
        # Byte-exact read of the committed blob (binary pipe —
        # the text-mode run() helper could translate newlines).
        gp = subprocess.run(
            ["git", "-C", CLONES[repo], "show", f"HEAD:{path}"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if gp.returncode != 0:
            problems.append(f"{repo}:{path} MISSING from the "
                            f"committed tree")
            continue
        raw = gp.stdout
        got_sha = hashlib.sha256(raw).hexdigest()
        if got_sha != want_sha or len(raw) != want_size:
            problems.append(
                f"{repo}:{path} committed bytes diverge "
                f"(sha {got_sha[:12]}… vs sealed "
                f"{str(want_sha)[:12]}…, {len(raw)}B vs "
                f"{want_size}B)")
            continue
        pin = (f"https://raw.githubusercontent.com/"
               f"{parts[0]}/{owner_repo}/{heads[repo]}/{path}")
        try:
            req = urllib.request.Request(pin, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; "
                "Win64; x64) AppleWebKit/537.36 (KHTML, like "
                "Gecko) Chrome/126.0 Safari/537.36"})
            with urllib.request.urlopen(req, timeout=60) as r:
                served = r.read()
            if hashlib.sha256(served).hexdigest() != want_sha \
                    or len(served) != want_size:
                problems.append(
                    f"{repo}:{path} served bytes diverge from "
                    f"the sealed index")
        except Exception as ex:
            problems.append(f"{repo}:{path} served-bytes fetch "
                            f"failed: {ex}")
    if problems:
        fail("mirror proof failed — the GitHub seats do not "
             "carry the sealed bytes; nothing deployed. "
             + "; ".join(problems[:10])
             + (f" (+{len(problems) - 10} more)"
                if len(problems) > 10 else ""))
    print(f"    mirror proof OK — {checked} GitHub-seat "
          f"distributions match the sealed index (committed + "
          f"served)")


CLONES = {"ai": os.path.expanduser("~/workspace/git-mirrors/ai"),
          "machine": os.path.expanduser("~/workspace/git-mirrors/machine")}


def preflight(probe_push=True, batch_dir=None):
    """Step 0 (Reconciliation batch, 2026-11-03; local verify added
    2026-11-04; Audit Layer Phase 2 wired 2026-11-19): prove,
    BEFORE any deploy, that (a) the estate audit pre-flight
    registry (13 permanent checks) is green, (b) every duplicated
    file in the estate agrees with its twin, (c) the sealed local
    estate passes the full local verification, and (d) both
    GitHub push routes answer. Any failure stops the close here —
    nothing deployed, nothing pushed — with the reason in plain
    words."""
    batch_dir = batch_dir or WORK
    print("--- 0. preflight (audit registry + twin identity + "
          "local verify + GitHub push route)", flush=True)
    # Audit Layer piece 2: the 13 permanent checks run first. A
    # red check stops the close before the twin gate, the verify
    # and any deploy — with a diagnosis pack per red class in the
    # batch folder (piece 3, emitted by the pre-flight itself).
    rc, out, _ = run([sys.executable, os.path.join(
        ROOT, "scripts", "audit-preflight.py"),
        "--batch-dir", batch_dir], label="audit-preflight (13 checks)")
    print("\n".join(out.strip().splitlines()[-16:]))
    if rc != 0:
        fail("preflight: the estate audit pre-flight is red (the "
             "failing checks are named above, and a diagnosis "
             "pack for each red class is in the batch folder). "
             "Nothing was deployed or pushed. Fix the class at "
             "its source, re-seal, and publish again.")
    # A1 prediction pass (Machine Software Suite Component A1):
    # the batch step-0 gate's enforcement backstop. predict.py
    # imports this same audit registry as its base layer and adds
    # the A1 classes (census pins swept whole, ledger dates on
    # the batch's declared change set, graph embeds swept whole,
    # beacon / P-3 prediction) against the tree being closed,
    # reading the batch folder's expected-delta.json (predict's
    # default delta seat) and batch-spec.json when present; a
    # batch_date in the spec pins A1.2's expectation to the
    # seal's date across a midnight straddle. A red prediction
    # stops the close here, before any deploy.
    predict_args = [sys.executable, os.path.join(
        ROOT, "scripts", "predict.py"),
        "--batch-dir", batch_dir,
        "--batch", os.path.basename(os.path.normpath(batch_dir))]
    _spec_path = os.path.join(batch_dir, "batch-spec.json")
    if os.path.exists(_spec_path):
        predict_args += ["--spec", _spec_path]
        try:
            _spec_doc = json.load(open(_spec_path,
                                       encoding="utf-8"))
        except Exception:
            _spec_doc = {}
        if _spec_doc.get("batch_date"):
            predict_args += ["--batch-date",
                             str(_spec_doc["batch_date"])]
    rc, out, _ = run(predict_args,
                     label="predict (A1 prediction pass)")
    print("\n".join(out.strip().splitlines()[-8:]))
    if rc != 0:
        fail("preflight: the A1 prediction pass is red (the "
             "failing classes are named above and in the batch "
             "folder's prediction report). Nothing was deployed "
             "or pushed. Fix the class at its source, re-seal, "
             "and publish again.")
    # Audit Layer piece 4: refresh the tree-state stamp so its
    # consumers (the GSC ingest guard, coordinators) read current
    # state. Metadata only — a stamp failure never stops a close.
    rc, out, _ = run([sys.executable, os.path.join(
        ROOT, "scripts", "audit-stamp.py"), "--quiet"],
        label="audit-stamp refresh")
    if rc != 0:
        print("    WARNING: tree-stamp refresh failed (metadata "
              "only; the close continues)")
    rc, out, _ = run(["node", os.path.join(ROOT, "scripts",
                                           "check-twins.js")],
                     label="check-twins")
    print("\n".join(out.strip().splitlines()[-2:]))
    if rc != 0:
        print(out[-3000:])
        fail("preflight: duplicated files in the estate disagree "
             "(twin check failed — the divergent pair is named "
             "above). Nothing was deployed or pushed. Fix the pair "
             "at its canonical source, re-seal, and publish again.")
    # Pages per-file size gate (2026-11-07, WV-3 close): Cloudflare
    # Pages refuses any file over 25 MiB mid-deploy — the Nov 4
    # shell incident, and datasets-answer-evidence.json crossing at
    # 30,209 rubric rows the same day this gate was coded. Scan the
    # whole PUB tree here so the close stops BEFORE any deploy with
    # the oversized file named, never at Wrangler.
    oversize = []
    for dirpath, _dirs, names in os.walk(PUB):
        for name in names:
            fp = os.path.join(dirpath, name)
            sz = os.path.getsize(fp)
            if sz > 25 * 1024 * 1024:
                oversize.append((fp, sz))
    if oversize:
        named = "; ".join(
            f"{os.path.relpath(fp, PUB)} is {sz / 1048576:.1f} MiB"
            for fp, sz in oversize)
        fail("preflight: file(s) over the 25 MiB Cloudflare Pages "
             f"per-file limit: {named}. Nothing was deployed or "
             "pushed. Shrink the file at its generator (compact "
             "serialization or a designed split), re-seal, and "
             "publish again.")
    print("    PUB size scan: no file over the 25 MiB Pages limit")
    # Day-3 drift fix (2026-11-04): the full local verification runs
    # HERE, before anything ships. The figure-drift class (llms.txt
    # and landing figures a generation behind the sealed data,
    # per-page data digests off the signed index) previously passed
    # the seal and only failed at the post-deploy live verify —
    # after the drifted tree was already deployed. Every check that
    # can run against the local sealed tree now gates the close at
    # this step; the post-deploy live verify remains the closing
    # gate for the live-only evidence.
    verdicts_path = os.path.join(WORK, "verdicts-preflight.json")
    rc, out, _ = run(["node", os.path.join(ROOT, "verify.js"),
                      "--local", "--verdicts-out", verdicts_path],
                     label="verify --local")
    print("\n".join(out.strip().splitlines()[-2:]))
    if rc != 0:
        print(out[-4000:])
        # Audit Layer piece 3: one diagnosis pack per failed check
        # class (last-good state + the full class sweep + the
        # standing fix), so the failure arrives diagnosed instead
        # of sending a human into the logs. The close stops either
        # way; a pack failure is a warning, never a second failure.
        try:
            _rc, out3, _ = run([sys.executable, os.path.join(
                ROOT, "scripts", "audit-diagnose.py"),
                "--from-verdicts", verdicts_path,
                "--batch-dir", batch_dir], label="audit-diagnose")
            print("\n".join(out3.strip().splitlines()[-4:]))
        except Exception as e:
            print(f"    WARNING: diagnosis pack generation failed "
                  f"({e})")
        fail("preflight: the sealed local estate fails "
             "verification (the failing checks are named above). "
             "Nothing was deployed or pushed. Fix the data at its "
             "source — figures re-derive from the sealed files, "
             "never by waiving a check — re-seal, and publish "
             "again.")
    if probe_push:
        for repo, clone in CLONES.items():
            if not os.path.isdir(clone):
                fail(f"preflight: the {repo} mirror clone is missing "
                     f"at {clone}. Nothing was deployed or pushed.")
            try:
                p = subprocess.run(
                    ["git", "-C", clone, "ls-remote", "origin", "HEAD"],
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                    text=True, timeout=90)
                ok = p.returncode == 0 and \
                    re.search(r"^[0-9a-f]{40}\s+HEAD", p.stdout or "")
            except subprocess.TimeoutExpired:
                p, ok = None, False
            if not ok:
                tail = ((p.stdout if p else "") or "").strip() \
                    .splitlines()
                fail(f"preflight: the GitHub push route for the "
                     f"{repo} repo does not answer "
                     f"({tail[-1] if tail else 'no response'}). "
                     f"Nothing was deployed or pushed. The usual "
                     f"cause is the SSH host-key file or the egress "
                     f"proxy — see AGENTS.md (GitHub SSH push "
                     f"transport) — then publish again.")
            print(f"    push route {repo}: answers "
                  f"({(p.stdout or '').split()[0][:8]} HEAD)")
    print("    preflight OK", flush=True)


FEED_URLS = ["https://theflatratemovers.com/feed.xml",
             "https://theflatratemovers.com/updates.xml"]


def _feed_digests(index_path):
    """{feed_url: digest value} from a signed index's distribution
    list, or None when the index cannot be read/parsed. The feeds
    are DataDownload entries keyed by contentUrl, digest at
    digest.value (SHA-256; see ai-master-index.json)."""
    try:
        with open(index_path, encoding="utf-8") as f:
            doc = json.load(f)
        out = {}
        for entry in doc.get("distribution", []):
            url = entry.get("contentUrl", "")
            if url in FEED_URLS:
                out[url] = (entry.get("digest") or {}).get("value")
        return out or None
    except Exception:
        return None


def changed_feeds(prior_path, new_path):
    """Feeds whose distribution digest changed prior -> new.
    Returns None when the changed-set is indeterminate (either
    index unreadable, or a feed missing from either index) — the
    caller then pings BOTH feeds, per the step spec."""
    prior, new = _feed_digests(prior_path), _feed_digests(new_path)
    if prior is None or new is None:
        return None
    if any(u not in prior or u not in new for u in FEED_URLS):
        return None
    return [u for u in FEED_URLS if prior[u] != new[u]]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--message", required=True)
    ap.add_argument("--skip-preflight", action="store_true")
    ap.add_argument("--preflight-only", action="store_true",
                    help="run preflight (step 0) and exit; no deploy, "
                         "push, verify, API or Pulse step runs")
    ap.add_argument("--skip-deploy", action="store_true")
    ap.add_argument("--skip-push", action="store_true")
    ap.add_argument("--skip-verify", action="store_true")
    ap.add_argument("--skip-api", action="store_true")
    ap.add_argument("--skip-sitemaps", action="store_true")
    ap.add_argument("--skip-websub", action="store_true")
    ap.add_argument("--skip-pulse", action="store_true")
    ap.add_argument("--batch-dir", default=None,
                    help="batch folder for the audit pre-flight "
                         "report + diagnosis packs (default: "
                         "out/seal-work)")
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

    # 0. preflight (Reconciliation batch, 2026-11-03)
    if args.preflight_only:
        preflight(probe_push=not args.skip_push,
                  batch_dir=args.batch_dir)
        print("\nPREFLIGHT ONLY — OK; no deploy performed.")
        return 0
    # VF6 gate G-2/G-3: arm the close-state (never for
    # --preflight-only, which returned above) and take the lane.
    CLOSE_CTX.update(
        armed=True,
        batch=(os.path.basename(os.path.normpath(args.batch_dir))
               if args.batch_dir else None),
        batch_dir=args.batch_dir, message=args.message,
        step="0 preflight")
    CLOSE_CTX["superseded"] = close_state.lane_lock(
        args.batch_dir, tool="publish")
    if args.skip_preflight:
        print("--- 0. preflight SKIPPED")
    else:
        preflight(probe_push=not args.skip_push,
                  batch_dir=args.batch_dir)

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

    # VF6 gate G-4: step 1 runs SEQUENTIALLY — push, then the
    # mirror proof, then deploy — so a mirror divergence stops
    # the close BEFORE the deploy, not after it. (The parallel
    # form could not hold the proof between push and deploy.)
    print("--- 1. GitHub push -> mirror proof -> Pages deploy",
          flush=True)
    deployment_url = None
    CLOSE_CTX["step"] = "1 push"
    do_push()
    rc, out, dt, _ = results["push"]
    timings["push"] = dt
    print(f"    push: exit {rc}")
    if rc != 0:
        print(out[-3000:])
        fail("step 1 push failed")
    if not args.skip_push:
        CLOSE_CTX["step"] = "1 mirror proof"
        mirror_proof()
    CLOSE_CTX["step"] = "1 deploy"
    do_deploy()
    rc, out, dt, extra = results["deploy"]
    timings["deploy"] = dt
    print(f"    deploy: exit {rc}"
          + (f", deployment {extra}" if extra else ""))
    if rc != 0:
        print(out[-3000:])
        fail("step 1 deploy failed")
    deployment_url = results["deploy"][3]
    CLOSE_CTX["deployment_url"] = deployment_url

    # 2. verify: deployment-unique URL first, alias closing gate last
    if args.skip_verify:
        print("--- 2. live verify SKIPPED")
    else:
        print("--- 2. live verify (deployment URL first, alias last)",
              flush=True)
        if deployment_url:
            CLOSE_CTX["step"] = "2 verify (deployment)"
            timings["verify-deployment"] = verify_gate(
                ["node", "verify.js", "--base-url", deployment_url,
                 "--verdicts-out", os.path.join(
                     WORK, "verdicts-deployment.json")],
                "verify vs deployment URL",
                "verdicts-deployment.json",
                "deployment-URL verify")
        else:
            print("    no deployment URL captured (deploy skipped?) — "
                  "alias run is the only gate")
        CLOSE_CTX["step"] = "2 verify (alias)"
        timings["verify-alias"] = verify_gate(
            ["node", "verify.js", "--verdicts-out",
             os.path.join(WORK, "verdicts-alias.json")],
            "verify vs production alias (closing gate)",
            "verdicts-alias.json",
            "alias verify (closing gate)")

    # 3. API refresh: bundle -> tests -> deploy
    CLOSE_CTX["step"] = "3 API"
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

    # 4. Sitemap re-submission (Search Console API, 2026-11-11):
    # the six sitemap files, live at the new seal since step 1 and
    # proven by step 2, are re-submitted so Google re-reads them
    # now. WARN-ONLY by design: Google being unreachable cannot be
    # allowed to fail a close — a failure prints loudly here, the
    # close completes, and scripts/submit-sitemaps.py re-runs by
    # hand once Google answers again.
    CLOSE_CTX["step"] = "4 sitemaps"
    if args.skip_sitemaps:
        print("--- 4. sitemap re-submission SKIPPED")
    else:
        print("--- 4. sitemap re-submission (Search Console API)",
              flush=True)
        rc, out, dt = run([sys.executable, os.path.join(
            ROOT, "scripts", "submit-sitemaps.py")],
            label="submit-sitemaps")
        timings["sitemaps"] = dt
        print("\n".join(out.strip().splitlines()))
        if rc != 0:
            print("    WARNING: sitemap re-submission FAILED "
                  "(the failing file(s) are named above) — the "
                  "close continues; re-run "
                  "scripts/submit-sitemaps.py by hand to retry.")

    # 4b. WebSub publish ping (AI-to-AI signal batch, 2026-11-23):
    # both feeds declare the hub, step 2 has just proven the deployed
    # feeds live, and ping-websub.py's fire-order rule is therefore
    # satisfied. Ping ONLY the feeds whose signed distribution
    # digest changed in this batch (prior = --pulse-prior when
    # given, else the seal's phase-0 snapshot — the same prior
    # step 5 diffs against); an indeterminate changed-set pings
    # both. WARN-ONLY, step 4's contract: the hub being unreachable
    # cannot fail a verified close — failure prints loudly, the
    # close continues, and ping-websub.py re-runs by hand.
    CLOSE_CTX["step"] = "4b websub"
    if args.skip_websub:
        print("--- 4b. WebSub publish ping SKIPPED")
    else:
        print("--- 4b. WebSub publish ping (WebSub hub)", flush=True)
        ws_prior = args.pulse_prior or os.path.join(
            WORK, "prior-index.json")
        feeds = changed_feeds(ws_prior, os.path.join(
            PUB, "ai-master-index.json"))
        if feeds is None:
            print("    changed-feed set indeterminate (prior or "
                  "new signed index unreadable, or a feed entry "
                  "missing) — pinging BOTH feeds")
            feeds = list(FEED_URLS)
        if not feeds:
            print("    no feed digest changed in this batch — "
                  "nothing to ping")
            timings["websub"] = 0.0
        else:
            ws_log = os.path.join(ROOT, "out", "websub-publish.log")
            os.makedirs(os.path.dirname(ws_log), exist_ok=True)
            rc, out, dt = run([sys.executable, os.path.join(
                ROOT, "scripts", "ping-websub.py"), ws_log] + feeds,
                label="ping-websub")
            timings["websub"] = dt
            print("\n".join(out.strip().splitlines()))
            if rc != 0:
                print("    WARNING: WebSub publish ping FAILED "
                      "(feeds named above did not all return 204) "
                      "— the close continues; re-run "
                      "scripts/ping-websub.py by hand to retry.")

    # 5. Pulse (seal mode; prior defaults to the seal's phase-0
    # snapshot — a batch that sealed more than once passes the
    # PRE-BATCH index via --pulse-prior, since the last seal's
    # snapshot is its own predecessor, not the batch's baseline)
    CLOSE_CTX["step"] = "5 pulse"
    if args.skip_pulse:
        print("--- 5. Pulse SKIPPED")
    else:
        print("--- 5. Pulse (seal mode)", flush=True)
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
    CLOSE_CTX["step"] = "done"
    write_close_state("CLOSED")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        CLOSE_CTX["reason"] = "interrupted (KeyboardInterrupt)"
        write_close_state("FAILED-CLOSED")
        raise
    except SystemExit:
        raise
    except Exception:
        CLOSE_CTX["reason"] = "unexpected exception (see traceback)"
        write_close_state("FAILED-CLOSED")
        raise
