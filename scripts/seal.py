#!/usr/bin/env python3
"""seal.py — dependency-ordered SINGLE-PASS seal for The Flat Rate Machine.

    python3 scripts/seal.py

Replaces the per-batch reseal-round loop (sign/install -> generators ->
refresh -> routes -> digest, repeated until the index SHA repeated).
That loop was a fixpoint because build-intent-rubric.js copied cert
digests OUT of the installed index: the rows it generated were one
index generation stale, so the seal needed 2-3+ rounds to converge
(measured in Batch Speed-S2, 2026-11-01: 3 rounds / 46 s for one
dataset file's content change; 5 rounds in the worst batch on record).

The fix has two parts:

  1. build-intent-rubric.js now computes cert digest VALUES from the
     target files' own bytes (its pubFileDigest helper); the signed
     index is still read for distribution MEMBERSHIP (row gates
     unchanged). The one backwards edge (index -> intent -> index) is
     gone, so a topological generation order seals in ONE pass.

  2. This orchestrator runs the seal phases in dependency order:
       intent rubric (+ dataset install + landing-description sync)
       -> search-index -> answer-evidence -> local-graph
       -> archive-registry            (all read rubric.db / files)
       -> llms-full                   (reads every dataset file; the
                                       distribution count is taken from
                                       the installed index, never
                                       passed by hand)
       -> digest-refresh              (the five root files' digests
                                       propagated into the shell and
                                       the public root JSONs; the map
                                       is pre-seal sealed digest ->
                                       current file digest)
       -> routes                      (shell -> public/index.html,
                                       route documents, middleware)
       -> update feed                 (phase 5.5: one scratch
                                       digest-index pass produces the
                                       seal's pre-index; the estate
                                       update feed (updates.xml) is
                                       rebuilt from the phase-0 index
                                       snapshot vs that pre-index, so
                                       phase 6 digests it in the SAME
                                       seal it describes)
       -> digest-index -> sign-index -> install index + JWS

Phase 0 also snapshots the installed index (and the installed
updates.xml, when present) into the seal work dir. The snapshot is
the "prior" for the phase-5.5 feed diff and for the close-out
seal-pulse (scripts/pulse.mjs) — the Machine archives no prior index
anywhere else. The feed cites the pre-index SHA as its seal
identity: the final signed index differs from the pre-index only in
the updates.xml entry itself (the feed cannot cite a hash that
contains its own digest — that fixpoint does not exist).

PROOF ROUND (mandatory, fail-loud — it is a proof, not a loop):
after installing, digest-index is re-run over the sealed tree and
must reproduce the installed index BYTE-FOR-BYTE; verify-provenance.py
must print PROVENANCE OK; the intent generator's --check must pass
(rows digest == rubric.db). Any mismatch exits nonzero and NOTHING is
re-run — a failed proof fails the batch loudly.

Interfaces: digest-index.py / sign-index.py / verify-provenance.py are
called with their standing flags, unchanged. All locations come from
paths.json (the paths registry); no per-batch paths appear here.
RUBRIC_DATE: the environment value if set, else today's date in
America/New_York (the value content batches have always used).
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(ROOT, "paths.json"), encoding="utf-8") as f:
    REG = json.load(f)
PUB = REG["public_dir"]
REPO = REG["repo_dir"]
PAGES = REG["pages_dir"]
VENV_PY = REG["venv_py"]
WORK = os.path.join(ROOT, "out", "seal-work")
ROOT_FILES = ["ai-sitemap.json", "entity-graph.json",
              "best-json-entity-graph.json", "llms.txt", "llms-full.txt"]
RUBRIC_DATE = os.environ.get("RUBRIC_DATE") or \
    datetime.now(ZoneInfo("America/New_York")).strftime("%Y-%m-%d")

TIMINGS = []


def phase(name):
    TIMINGS.append((name, time.time()))
    print(f"--- {name}", flush=True)


def run(cmd, env_extra=None, ok_codes=(0,)):
    env = dict(os.environ)
    if env_extra:
        env.update(env_extra)
    t = time.time()
    p = subprocess.run(cmd, cwd=ROOT, env=env,
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                       text=True)
    dt = time.time() - t
    tail = "\n".join((p.stdout or "").strip().splitlines()[-3:])
    print(f"    [{dt:5.1f}s] {' '.join(cmd[:3])}... -> exit {p.returncode}")
    if tail:
        for line in tail.splitlines():
            print(f"           {line}")
    if p.returncode not in ok_codes:
        print(f"SEAL FAILED at: {' '.join(cmd)}\n{p.stdout}")
        sys.exit(1)
    return p.stdout


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fail(msg):
    print(f"SEAL PROOF FAILED: {msg}")
    sys.exit(3)


def main():
    t0 = time.time()
    os.makedirs(WORK, exist_ok=True)

    phase("0. preflight — installed index, count, sealed root digests")
    index_path = os.path.join(PUB, "ai-master-index.json")
    with open(index_path, encoding="utf-8") as f:
        installed = json.load(f)
    count = len(installed.get("distribution", []))
    old_seal = sha(index_path)
    sealed_root = {}
    for e in installed.get("distribution", []):
        u = e.get("contentUrl", "")
        for r in ROOT_FILES:
            if u == "https://theflatratemovers.com/" + r:
                sealed_root[r] = (e.get("digest") or {}).get("value")
    if len(sealed_root) != len(ROOT_FILES):
        fail(f"pre-seal index lacks digests for roots: "
             f"{sorted(set(ROOT_FILES) - set(sealed_root))}")
    print(f"    distributions: {count}; pre-seal index sha: {old_seal}")
    print(f"    RUBRIC_DATE={RUBRIC_DATE}")
    # Pulse (batch-pulse-2026-11-02): snapshot the installed index and
    # updates.xml BEFORE any phase mutates the tree — the diff priors
    # for phase 5.5 and for the close-out seal-pulse.
    shutil.copyfile(index_path, os.path.join(WORK, "prior-index.json"))
    upd_path = os.path.join(PUB, "updates.xml")
    if os.path.exists(upd_path):
        shutil.copyfile(upd_path, os.path.join(WORK, "prior-updates.xml"))
    print("    pulse snapshots: prior-index.json"
          " (+ prior-updates.xml if present)")

    phase("1. intent rubric (cert digests are file-sourced, S2)")
    run(["node", "scripts/build-intent-rubric.js"],
        env_extra={"RUBRIC_DATE": RUBRIC_DATE})
    shutil.copyfile(
        os.path.join(ROOT, "out", "batch-intent-rubric", "work",
                     "datasets-intent-coverage.json"),
        os.path.join(PUB, "datasets-intent-coverage.json"))
    # Landing sync: the per-page JSON's description is pinned to the
    # dataset file's (verify.js I-10) — same transform as the rounds ran.
    with open(os.path.join(PUB, "datasets-intent-coverage.json"),
              encoding="utf-8") as f:
        ds = json.load(f)
    land_p = os.path.join(PUB, "dataset-intent-coverage.json")
    with open(land_p, encoding="utf-8") as f:
        pp = json.load(f)
    pp["@graph"][0]["description"] = ds["@graph"][0]["description"]
    with open(land_p, "w", encoding="utf-8") as f:
        json.dump(pp, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print("    intent dataset installed; landing description synced")

    phase("2. derived datasets (rubric.db / file readers, in order)")
    for gen in ("build-search-index.js", "build-answer-evidence.js",
                "build-local-graph.js", "build-archive-registry.js"):
        run(["node", f"scripts/{gen}"])

    phase("2b. sitemap sections + index, the Google News sitemap and "
          "the article feed (registry/ledger-driven; before "
          "routes/middleware and the digest phase so the sealed "
          "estate carries the architecture)")
    run(["node", "scripts/build-sitemap.js"])
    run(["node", "scripts/build-news-sitemap.js"])
    run(["node", "scripts/build-feed.js"])

    phase("3. llms-full (reads every dataset file; count from index)")
    run(["node", "scripts/build-llms-full.js",
         "--shell", os.path.join(REPO, "index.html"),
         "--distributions", str(count),
         "--out", os.path.join(PUB, "llms-full.txt")])

    phase("4. digest-refresh (root digests -> shell + public root JSONs)")
    pairs = {}
    for r in ROOT_FILES:
        cur = sha(os.path.join(PUB, r))
        old = sealed_root[r]
        if old and old != cur:
            pairs[old] = cur
    if not pairs:
        print("    no stale root digests")
    else:
        import glob
        targets = sorted(glob.glob(os.path.join(PUB, "*.json"))) + \
            [os.path.join(REPO, "index.html")]
        total = 0
        for t in targets:
            with open(t, encoding="utf-8") as f:
                s = f.read()
            n0 = s
            for o, n in pairs.items():
                c = s.count(o)
                if c:
                    s = s.replace(o, n)
                    total += c
            if s != n0:
                with open(t, "w", encoding="utf-8") as f:
                    f.write(s)
        print(f"    refresh replacements: {total} "
              f"across {len(targets)} targets")

    phase("5. routes (shell -> public/index.html, route docs, middleware)")
    shutil.copyfile(os.path.join(REPO, "index.html"),
                    os.path.join(PUB, "index.html"))
    routes_dir = os.path.join(WORK, "routes")
    shutil.rmtree(routes_dir, ignore_errors=True)
    run(["node", "scripts/build-routes.js", "--out-dir", routes_dir])
    subprocess.run(["rsync", "-a", routes_dir + "/", PUB + "/"],
                   check=True)
    stray = os.path.join(PUB, "routes-manifest.json")
    if os.path.exists(stray):
        os.remove(stray)
    run(["node", "scripts/build-routes.js", "--update-middleware",
         os.path.join(PAGES, "functions", "_middleware.js"),
         "--tree", PUB])

    phase("5.5. estate update feed (pre-index diff -> updates.xml)")
    pre = os.path.join(WORK, "index-pre.json")
    run([VENV_PY, os.path.join(REPO, "digest-index.py"),
         "--index", index_path, "--public-dir", PUB,
         "--repo-dir", REPO, "--out", pre,
         "--audit", os.path.join(WORK, "pre-digest-audit.json")])
    with open(os.path.join(WORK, "pre-digest-audit.json"),
              encoding="utf-8") as f:
        pre_totals = json.load(f)["totals"]
    if pre_totals.get("gaps") != 0 or \
            pre_totals.get("distributions") != count:
        fail(f"pre-digest audit: {pre_totals}")
    pre_sha = sha(pre)
    feed_args = ["node", "scripts/build-update-feed.js",
                 "--prior-index", os.path.join(WORK, "prior-index.json"),
                 "--index", pre,
                 "--seal-date", RUBRIC_DATE,
                 "--seal-sha", pre_sha,
                 "--out", os.path.join(PUB, "updates.xml")]
    prior_upd = os.path.join(WORK, "prior-updates.xml")
    if os.path.exists(prior_upd):
        feed_args += ["--existing", prior_upd]
    run(feed_args)
    print(f"    update feed rebuilt (pre-index sha: {pre_sha})")

    phase("6. digest-index (the single digest pass)")
    digested = os.path.join(WORK, "index-digested.json")
    out = run([VENV_PY, os.path.join(REPO, "digest-index.py"),
               "--index", index_path, "--public-dir", PUB,
               "--repo-dir", REPO, "--out", digested,
               "--audit", os.path.join(WORK, "digest-audit.json")])
    with open(os.path.join(WORK, "digest-audit.json"),
              encoding="utf-8") as f:
        totals = json.load(f)["totals"]
    if totals.get("gaps") != 0 or totals.get("distributions") != count:
        fail(f"digest audit: {totals}")
    print(f"    digest totals: {totals}")

    phase("7. sign + install")
    jws_out = os.path.join(WORK, "ai-master-index.jws")
    run([VENV_PY, os.path.join(REPO, "sign-index.py"),
         "--index", digested, "--out", jws_out])
    shutil.copyfile(digested, index_path)
    shutil.copyfile(jws_out, os.path.join(PUB, "ai-master-index.jws"))
    new_seal = sha(index_path)
    print(f"    new seal: {new_seal}")

    phase("8. PROOF ROUND (recompute + provenance + intent --check)")
    proof = os.path.join(WORK, "index-proof.json")
    run([VENV_PY, os.path.join(REPO, "digest-index.py"),
         "--index", index_path, "--public-dir", PUB,
         "--repo-dir", REPO, "--out", proof,
         "--audit", os.path.join(WORK, "proof-audit.json")])
    if sha(proof) != new_seal:
        fail("proof digest-index output != installed index "
             f"({sha(proof)} != {new_seal}) — a file moved after the "
             "digest pass; the seal is NOT single-pass-clean")
    print("    proof: digest recompute reproduces the installed index "
          "byte-for-byte (zero changes)")
    out = run([VENV_PY, os.path.join(REPO, "verify-provenance.py"),
               "--jwks", os.path.join(PUB, ".well-known",
                                      "signing-keys.json"),
               "--index", index_path,
               "--jws", os.path.join(PUB, "ai-master-index.jws"),
               "--public-dir", PUB, "--repo-dir", REPO])
    if "PROVENANCE OK" not in out:
        fail("verify-provenance.py did not print PROVENANCE OK")
    run(["node", "scripts/build-intent-rubric.js", "--check"],
        env_extra={"RUBRIC_DATE": RUBRIC_DATE})
    print("    proof: intent --check passes (rows digest == rubric.db)")

    total = time.time() - t0
    print(f"\nSEAL OK — one pass + proof round, {total:.1f}s total")
    print(f"  pre-seal index:  {old_seal}")
    print(f"  final seal:      {new_seal}")
    print(f"  distributions:   {count}, gaps 0")
    return 0


if __name__ == "__main__":
    sys.exit(main())
