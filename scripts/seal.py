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

FB-3 phase (Schema Timestamp Truth, 2026-11-03): phase 0 also
snapshots the lastmod ledger (work/ledger-prior.json) and builds the
stamps map (work/stamps.json) — per-page dateModified from the
seal-start ledger, datePublished from the News Formula manifest
(articles) or the prior index's route-document lineage. Phase 2 runs
the dataset graph sync with --resync (a seal that changes dataset
source nodes re-derives graph citizenship in the same pass) and
mirrors the data/ graphs to the flat workspace copies; the wired
dataset generators read their file-level stamp from the map
(FB3_STAMPS). Phase 5 passes --stamps to build-routes.js, whose
transform stamps the head-data page nodes at generation time; a
stamps-less tree generation fails loud.

Ledger phase (6b, Crawl Demand batch 2026-11-02): after the digest
pass, the new index is diffed against the phase-0 prior snapshot and
every sitemap-union URL whose own distribution changed (or is new) is
stamped with the seal date in data/lastmod-ledger.json — the single
source build-sitemap.js reads for every <lastmod> (phase 2b). The
ledger records the seal's index SHA as its anchor and mirrors the
union dates back into data/pages.json. Because phase 2b runs before
6b, a change reaches the sitemap on the NEXT pass — the estate's
standing second-pass convergence absorbs the one-phase lag.

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

S3 paragraph (Speed Batch S3, 2026-11-03 — the pipeline transport
standard, correction 3): the digest pass is now a triple-hash
one-read pass. digest-index.py computes SHA-256 + the git blob
SHA-1 + the Cloudflare Pages BLAKE3 in ONE read per file; the
SHA-256 still lands in the signed index exactly as before, while
the git and Pages hashes ride in the digest audit and in the
frozen digest map (below), ready for the git-push and Pages
transports to consume without re-reading or re-hashing anything.
The phase-5.5 and phase-6 digest invocations share a hash cache
(out/seal-work/hash-cache.json): a file whose size and mtimeNs
match its cache entry reuses all three hashes without a read, so
the second digest pass of a seal is nearly free; the phase-8
PROOF invocation instead passes --fresh — it ignores the cache,
never writes it, and stays a full recompute over the sealed tree,
so the proof's byte-for-byte reproduction is not weakened.
Immediately after phase 6, the seal writes the frozen digest map
(out/seal-work/frozen-digest-map.json) from the phase-6 audit —
{contentUrl: {sha256, gitBlobSha1, pagesBlake3, byteSize,
resolved}} for every entry — the frozen per-file hash record the
rest of this invocation (and the close-out transports) read from,
instead of hashing any file a second time.
"""
import hashlib
import json
import os
import re
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


def install_intent():
    """Install the generated intent dataset into the public tree and
    pin-sync the landing seat's description (the I-10 pair)."""
    shutil.copyfile(
        os.path.join(ROOT, "out", "batch-intent-rubric", "work",
                     "datasets-intent-coverage.json"),
        os.path.join(PUB, "datasets-intent-coverage.json"))
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


def settle_intent(tag):
    """Fixpoint settle for the intent rubric (Copy-Integrity batch,
    2026-11-04): generate, install, then assert the generator's own
    --check — a full regeneration from the same inputs, compared by
    rows digest — passes. If it fails, the inputs moved under the
    generation: generate once more and re-assert; a second failure
    fails the seal. The one-generation lag is thus healed and proven
    at the settle point instead of surfacing at the phase-8 proof
    round (which still runs the same --check as the final arbiter).
    The rows digest is the invariant because rubric.db's bytes are
    not stable across identical rewrites (SQLite change counters) —
    measured in this batch's break tests; the generated dataset file
    is byte-stable and is covered by the digest pass."""
    chk_env = {**os.environ, "RUBRIC_DATE": RUBRIC_DATE}
    for attempt in (1, 2):
        run(["node", "scripts/build-intent-rubric.js"],
            env_extra={"RUBRIC_DATE": RUBRIC_DATE})
        install_intent()
        chk = subprocess.run(
            ["node", "scripts/build-intent-rubric.js", "--check"],
            cwd=ROOT, env=chk_env, capture_output=True, text=True)
        if chk.returncode == 0:
            line = (chk.stdout or "").strip().split("\n")[-1]
            print(f"    intent settled ({tag}, attempt {attempt}): "
                  f"{line[:130]}")
            m = re.search(r"digest ([0-9a-f]{64})", line)
            return m.group(1) if m else None
        print(f"    intent settle ({tag}, attempt {attempt}): "
              f"--check still one generation behind — regenerating")
    fail(f"intent fixpoint ({tag}): --check failed after two "
         f"generations — inputs are still moving inside the seal")


def settle_consumers(tag):
    """Settle the intent rubric AND its in-seal consumers
    (Copy-Integrity batch, 2026-11-04). Two couplings make a bare
    intent settle insufficient: the graph citizenship derives from
    the installed intent file, and the search-index / answer-evidence
    datasets embed the rubric rows digest in their prose — any
    settle that moves the rows digest after those datasets were
    generated leaves them one generation behind (their SI-2/AE-2
    regeneration gates fail). This loop re-derives every consumer
    after each settle and exits only when a full round is stable:
    the intent --check passes AFTER the consumers re-ran, and the
    consumer files are byte-identical across a second regeneration
    from the settled rubric. Bounded at 10 rounds (raised from 3 in
    the Day-3 drift fix, 2026-11-04: each round advances the coupled
    generation by one step, so a seal starting more than one
    generation behind could not converge inside the old cap and the
    drift surfaced downstream instead); a non-converging round
    fails the seal loud."""
    stamps_env = {"FB3_STAMPS": os.path.join(WORK, "stamps.json")}
    flat_dir = os.path.join(os.path.dirname(ROOT), "theflatratemovers")
    consumer_files = [
        os.path.join(PUB, "datasets-search-index.json"),
        os.path.join(PUB, "datasets-answer-evidence.json"),
        os.path.join(PUB, "datasets-intent-coverage.json"),
        os.path.join(PUB, "datasets-page-data-pool.json"),
    ]
    chk_env = {**os.environ, "RUBRIC_DATE": RUBRIC_DATE}
    for rnd in range(1, 11):
        settle_intent(f"{tag} round {rnd}")
        run(["node", "scripts/sync-dataset-graph-nodes.js",
             "--resync"], env_extra={"FRM_SEAL_DATE": RUBRIC_DATE})
        run(["node", "scripts/sync-variant-graph-nodes.js",
             "--resync"], env_extra={"FRM_SEAL_DATE": RUBRIC_DATE})
        for g in ("entity-graph.json", "best-json-entity-graph.json"):
            src_p = os.path.join(ROOT, "data", g)
            dst_p = os.path.join(flat_dir, g)
            shutil.copyfile(src_p, dst_p)
            if sha(src_p) != sha(dst_p):
                fail(f"FB-3 graph copy mismatch ({tag}): {g}")
        for gen in ("build-search-index.js", "build-answer-evidence.js"):
            run(["node", f"scripts/{gen}"], env_extra=stamps_env)
        run(["node", "scripts/build-catalog-registry.js"],
            env_extra={"CATALOG_DATE": RUBRIC_DATE})
        # DC-2 permanent fix (2026-11-07): the resyncs above can
        # rewrite dataset files, which stales the sha256 embeds the
        # page-data pool carries for them. Refresh the pool's embeds
        # from live bytes inside the round, so the settle's
        # byte-stability check covers the pool too.
        run(["node", "scripts/refresh-pool-digests.js"])
        h1 = {p: sha(p) for p in consumer_files}
        for gen in ("build-search-index.js", "build-answer-evidence.js"):
            run(["node", f"scripts/{gen}"], env_extra=stamps_env)
        h2 = {p: sha(p) for p in consumer_files}
        chk = subprocess.run(
            ["node", "scripts/build-intent-rubric.js", "--check"],
            cwd=ROOT, env=chk_env, capture_output=True, text=True)
        if h1 == h2 and chk.returncode == 0:
            print(f"    consumers settled ({tag}, round {rnd}): "
                  f"intent --check clean after consumer regeneration; "
                  f"consumer files byte-stable")
            return
        print(f"    consumer settle ({tag}, round {rnd}): still "
              f"moving (files stable: {h1 == h2}, intent --check: "
              f"{chk.returncode}) — another round")
    fail(f"consumer settle ({tag}): not converged after 10 rounds")


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

    # FB-3 (Schema Timestamp Truth, 2026-11-03): snapshot the ledger
    # BEFORE any phase mutates it and build the stamps map the route
    # transform (phase 5) and the dataset generator wires consume.
    # dm := the ledger value at seal start (the value the sitemap
    # publishes for the URL in this pass); dp := the News Formula
    # manifest date for articles (the manifest wins disagreements —
    # they are printed below, never smoothed), else the route
    # document's signed-index lineage date from the phase-0 prior
    # snapshot, else RUBRIC_DATE for a page first sealed by this seal.
    # A page with no dm source fails the seal loud.
    ledger_path0 = os.path.join(ROOT, "data", "lastmod-ledger.json")
    with open(ledger_path0, encoding="utf-8") as f:
        ledger_doc = json.load(f)
    shutil.copyfile(ledger_path0, os.path.join(WORK, "ledger-prior.json"))
    ledger_urls = ledger_doc.get("urls", {})
    with open(os.path.join(WORK, "prior-index.json"),
              encoding="utf-8") as f:
        prior_index = json.load(f)
    lineage = {}
    for e in prior_index.get("distribution", []):
        if e.get("encodingFormat") == "text/html" and e.get("dateModified"):
            lineage.setdefault(e.get("contentUrl", ""), e["dateModified"])
    with open(os.path.join(ROOT, "data", "news-formula.json"),
              encoding="utf-8") as f:
        manifest = json.load(f)
    article_dates = {}
    for post in manifest.get("posts", []):
        d = (post.get("instant") or post.get("ledgerDate") or "")[:10]
        if d:
            article_dates["https://theflatratemovers.com/" +
                          post["slug"] + "/"] = d
    with open(os.path.join(ROOT, "data", "pages.json"),
              encoding="utf-8") as f:
        registry_pages = json.load(f).get("pages", [])
    stamps_pages = {}
    disagreements = []
    for p in registry_pages:
        u = p.get("url", "")
        dm = ledger_urls.get(u) or p.get("lastmod")
        if not dm:
            fail(f"FB-3 stamps: no ledger/registry dateModified for {u}")
        if u in article_dates:
            dp = article_dates[u]
            if lineage.get(u) and lineage[u] != dp:
                disagreements.append(
                    f"{u}: lineage {lineage[u]} vs manifest {dp} "
                    f"(manifest wins)")
        elif u in lineage:
            dp = lineage[u]
        else:
            dp = RUBRIC_DATE
            disagreements.append(
                f"{u}: no prior-index lineage; datePublished := seal "
                f"date (page first sealed by this seal)")
        stamps_pages[u] = {"dm": dm, "dp": dp}
    stamps_files = {}
    # FB-3 wired the first three files; the re-audit fix batch
    # (2026-11-03) extends the wiring to datasets-ports.json — the
    # one file whose unwired in-file stamp measured stale against
    # the ledger (re-audit root cause RC-T2). Its generator
    # (build-ports.js) consumes the entry in phase 0.5, before the
    # rubric (see the ordering note there).
    # Q124 (2026-11-03, Henry's Q2=A ruling): the wiring generalizes
    # to EVERY dataset file — stamps.files covers all datasets-*.json
    # in the public tree, so generator-owned files consume their
    # ledger stamp via FB3_STAMPS and scripts/stamp-dataset-files.js
    # stamps the rest textually (phase 0.5). verify.js S-7f asserts
    # every in-file dateModified == ledger estate-wide. Fail loud on
    # any dataset file without a ledger entry, as the original
    # four-file wiring did.
    for stem in sorted(os.listdir(PUB)):
        if not (stem.startswith("datasets-") and stem.endswith(".json")):
            continue
        fu = "https://theflatratemovers.com/" + stem
        if fu not in ledger_urls:
            fail(f"Q124 stamps: no ledger entry for dataset file {fu}")
        stamps_files[fu] = ledger_urls[fu]
    with open(os.path.join(WORK, "stamps.json"), "w",
              encoding="utf-8") as f:
        json.dump({"sealDate": RUBRIC_DATE, "pages": stamps_pages,
                   "files": stamps_files}, f, indent=1, sort_keys=True)
        f.write("\n")
    print(f"    FB-3 stamps: {len(stamps_pages)} pages, "
          f"{len(stamps_files)} dataset files; "
          f"{len(disagreements)} lineage note(s)")
    for d in disagreements:
        print(f"      stamps note: {d}")

    # Re-audit fix batch (2026-11-03): build-ports.js runs HERE, not
    # in phase 2. The ports dataset file backs intent-rubric rows and
    # phase 1 computes cert digests from the files themselves (S2);
    # regenerating the file in phase 2 — after the rubric was built —
    # leaves the sealed rubric digesting the pre-regeneration file,
    # and the phase-8 intent --check fails (observed on this batch's
    # first seal attempt, before this ordering fix). Any generator
    # that can change a rubric-backing dataset file must precede
    # phase 1; the stamps map it consumes is complete at this point.
    phase("0.5. ports dataset (stamps-wired; precedes the rubric)")
    run(["node", "scripts/build-ports.js"],
        env_extra={"FB3_STAMPS": os.path.join(WORK, "stamps.json")})
    # Q124 (2026-11-03): textual dateModified stamping for every
    # dataset file NOT regenerated by a seal-phase generator
    # (generator-owned files — ports here, intent-coverage in
    # phase 1, search-index / answer-evidence / local-graph /
    # archive-registry in phase 2 — consume FB3_STAMPS themselves).
    # Runs before phase 1 because the intent rubric digests the
    # dataset files.
    run(["node", "scripts/stamp-dataset-files.js"],
        env_extra={"FB3_STAMPS": os.path.join(WORK, "stamps.json")})

    phase("1. intent rubric (cert digests are file-sourced, S2; "
          "fixpoint settle, Copy-Integrity 2026-11-04)")
    settle_intent("phase 1")

    phase("2. derived datasets (rubric.db / file readers, in order)")
    stamps_env = {"FB3_STAMPS": os.path.join(WORK, "stamps.json")}
    for gen in ("build-search-index.js", "build-answer-evidence.js",
                "build-local-graph.js", "build-archive-registry.js"):
        # Q124 (2026-11-03): all four derived-dataset generators now
        # consume FB3_STAMPS for their file-level dateModified stamps
        # (Q2=A); search-index and answer-evidence previously derived
        # theirs from evidence dates — their DATE_MOD keeps only its
        # evidence roles (validation, evidence prose).
        run(["node", f"scripts/{gen}"],
            env_extra=stamps_env if gen in (
                "build-local-graph.js", "build-archive-registry.js",
                "build-search-index.js", "build-answer-evidence.js")
            else None)
    # FB-3 standing consequence (the FB-2 lesson): the dataset graph
    # sync runs INSIDE the seal with --resync — a seal that changes a
    # dataset source node (FB-3's stamp wiring does) must re-derive
    # the graph citizenship nodes in the same pass; DG-3 enforces it.
    run(["node", "scripts/sync-dataset-graph-nodes.js", "--resync"],
        env_extra={"FRM_SEAL_DATE": RUBRIC_DATE})
    # Q3 standing consequence (Batch Q3, 2026-11-03): the variant /
    # hub graph citizenship sync runs INSIDE the seal with --resync,
    # appended AFTER the dataset sync so every phase-2 builder above
    # sees the pre-Q3 graphs in Q3's own seal (deterministic; the
    # citizens land last, then phases 4/6 digest them). QC-1..QC-3
    # (verify.js §37) enforce the citizenship permanently.
    run(["node", "scripts/sync-variant-graph-nodes.js", "--resync"],
        env_extra={"FRM_SEAL_DATE": RUBRIC_DATE})
    # Graph copies: the sync writes PUB + data/ (four targets); the
    # flat workspace copies mirror data/ byte-for-byte (six files in
    # all). A mismatch fails the seal loud.
    flat_dir = os.path.join(os.path.dirname(ROOT), "theflatratemovers")
    for g in ("entity-graph.json", "best-json-entity-graph.json"):
        src_p = os.path.join(ROOT, "data", g)
        dst_p = os.path.join(flat_dir, g)
        shutil.copyfile(src_p, dst_p)
        if sha(src_p) != sha(dst_p):
            fail(f"FB-3 graph copy mismatch: {g}")
    print("    dataset graph sync (--resync) done; flat graph copies "
          "mirrored from data/")

    # Copy-Integrity batch (2026-11-04): derived copies settle INSIDE
    # the seal, in dependency order. (1) The catalog registry
    # regenerates whenever a dataset file's bytes moved since the
    # pre-seal index — its embedded digests are copies of the dataset
    # files (the reconciliation regenerated it by hand, repeatedly).
    # (2) The intent fixpoint re-settles against the final phase-2
    # files (the derived datasets feed its rows). (3) The graph
    # citizenship re-derives from the settled intent file. (4) Every
    # date copy — per-page JSONs, dataset seats, shell landing
    # embeds — aligns via sync-derived-copies.js. After this phase,
    # no hand-run regeneration or alignment step exists.
    phase("2c. copy integrity (registry regen, intent re-settle, "
          "graph re-derive, derived-copy sync)")
    prior_dists = {}
    for e in prior_index.get("distribution", []):
        if e.get("contentUrl"):
            prior_dists[e["contentUrl"]] = e.get("sha256")
    ds_changed = []
    for stem in sorted(os.listdir(PUB)):
        if stem.startswith("datasets-") and stem.endswith(".json"):
            u = "https://theflatratemovers.com/" + stem
            if prior_dists.get(u) != sha(os.path.join(PUB, stem)):
                ds_changed.append(stem)
    if ds_changed:
        print(f"    dataset files changed vs pre-seal index: "
              f"{len(ds_changed)} — the consumer settle regenerates "
              f"the catalog registry")
    else:
        print("    no dataset file changed vs pre-seal index; "
              "catalog registry regeneration is a byte-stable no-op "
              "inside the consumer settle")
    settle_consumers("phase 2c")
    run(["node", "scripts/sync-derived-copies.js"])

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

    # Copy-Integrity contingency (2026-11-04): phase 4 propagates
    # root digests into the public root JSONs — files the intent
    # rubric digests. If it rewrote any of them, the phase-2c settle
    # is stale. Detect with the generator's own --check; on failure,
    # re-settle ONCE (intent fixpoint, graph re-derive, catalog
    # registry regen) and require the check to pass. When phase 4
    # moved nothing — the common case — this is a single no-op check.
    phase("4c. copy-integrity contingency (intent still settled "
          "after digest-refresh?)")
    chk_env = {**os.environ, "RUBRIC_DATE": RUBRIC_DATE}
    chk = subprocess.run(
        ["node", "scripts/build-intent-rubric.js", "--check"],
        cwd=ROOT, env=chk_env, capture_output=True, text=True)
    if chk.returncode == 0:
        print("    intent --check clean after digest-refresh; "
              "no re-settle needed")
    else:
        print("    digest-refresh moved rubric inputs; running the "
              "consumer settle")
        settle_consumers("phase 4c")
        chk2 = subprocess.run(
            ["node", "scripts/build-intent-rubric.js", "--check"],
            cwd=ROOT, env=chk_env, capture_output=True, text=True)
        if chk2.returncode != 0:
            fail("intent --check still failing after the 4c "
                 "consumer settle: " + (chk2.stdout or "")[-300:])
        print("    consumer settle complete; intent --check clean")

    # DC-2 permanent fix (2026-11-07): phase 4's digest-refresh
    # string-replaces root digests inside every PUB-root JSON —
    # dataset files included — which can move a dataset file's
    # bytes without moving the intent rubric, so the 4c contingency
    # above does not fire. Refresh the pool's dataset embeds from
    # final bytes here, unconditionally, before phase 4.5 draws
    # from the pool and before the digest pass signs it.
    run(["node", "scripts/refresh-pool-digests.js"])

    # Page Data wave (2026-11-03): the per-page data files are drawn
    # from the pool AFTER digest-refresh (phase 4 can rewrite root
    # digests inside the per-page JSONs the generator reads) and
    # BEFORE routes (phase 5): build-routes computes the files'
    # SHA-256 digests into the head blocks from the generator's
    # manifest, so the files must exist — final — before route
    # generation. The generator fails loud on any page under 100
    # (gate PG-4), which fails the seal.
    phase("4.5. page data (pool draw -> per-page data.json/data.txt "
          "+ scores + head-block manifest)")
    run(["node", "scripts/build-page-data.js",
         "--manifest", os.path.join(WORK, "page-data-manifest.json")],
        env_extra={"FB3_STAMPS": os.path.join(WORK, "stamps.json")})

    # Day-3 drift fix (2026-11-04): index membership for a page's
    # two PAGE-DATA distributions (data.json, data.txt) is
    # registered HERE, by the seal, for every registry page —
    # previously each batch's apply script hand-appended them, and
    # the Day-3 apply appended only the route + per-page JSON for
    # its two new posts, so their page-data files were generated,
    # sealed on disk, and yet absent from the signed index (PG-2
    # failed at verify, after deploy). digest-index.py only
    # re-digests existing membership; it never adds. Registration is
    # mechanical (names derive from the registry title), so the seal
    # owns it: any missing entry is appended with the standing
    # shape; the phase-6 digest pass fills its digest. Scope is the
    # page-data pair only: their URLs follow the uniform rule for
    # all 246 pages, while route documents are registered by the
    # batch applies and per-page JSONs include the nested-taxonomy
    # filename scheme (author-*.json, category-*.json) that does
    # not map from the page URL — both classes stay backstopped by
    # the publish preflight's local verify (P-5 / PG-1).
    with open(index_path, encoding="utf-8") as f:
        working_index = json.load(f)
    have_urls = {e.get("contentUrl")
                 for e in working_index.get("distribution", [])}
    registered = 0
    for p in registry_pages:
        u = p.get("url", "")
        if not u.startswith("https://theflatratemovers.com/"):
            continue
        title = p.get("title") or u
        dm = ledger_urls.get(u) or RUBRIC_DATE
        want = [
            (u + "data.json", "application/json",
             f"{title} — page data (JSON)"),
            (u + "data.txt", "text/plain",
             f"{title} — page data (text)"),
        ]
        for cu, fmt, nm in want:
            if cu not in have_urls:
                working_index["distribution"].append({
                    "@type": "DataDownload", "contentUrl": cu,
                    "encodingFormat": fmt, "name": nm,
                    "license":
                        "https://creativecommons.org/licenses/by/4.0/",
                    "dateModified": dm})
                have_urls.add(cu)
                registered += 1
    if registered:
        with open(index_path, "w", encoding="utf-8") as f:
            json.dump(working_index, f, indent=1, ensure_ascii=False)
            f.write("\n")
        count = len(working_index["distribution"])
    print(f"    page distributions registered: {registered} new "
          f"(membership {count})")

    # Day-3 drift fix (2026-11-04), companion: llms.txt's certificate
    # figures state this seal's own totals (distribution count,
    # dataset-file count, per-page JSON count, rubric rows, targeted
    # pages) — numbers that only become final once registration
    # above has run, so hand-maintained copies drifted one
    # generation behind on every count-changing batch (CV-3 caught
    # them only at verify). The seal now rewrites those figure
    # seats from the final membership + the settled intent file, in
    # both llms.txt seats, before the digest pass. The computation
    # mirrors verify.js CV-3 exactly.
    import re as _re
    _dist = working_index.get("distribution", [])
    _urls = [e.get("contentUrl") or "" for e in _dist]
    _root = "https://theflatratemovers.com/"
    _excl = {"ai-sitemap.json", "ai-master-index.json",
             "entity-graph.json", "best-json-entity-graph.json",
             "ai-license.json",
             "ai-verification-report-2026-11-01.json",
             "ai-verification-report-2026-11-01-e6b2.json"}
    _root_json = [u[len(_root):] for u in _urls
                  if u.startswith(_root) and "/" not in u[len(_root):]
                  and u.endswith(".json")]
    _per_page = len([n for n in _root_json
                     if not n.startswith("datasets-")
                     and not n.startswith("dataset-")
                     and n not in _excl])
    _ds_count = len([u for u in _urls
                     if _re.search(r"/datasets-[^/]+\.json$", u)])
    with open(os.path.join(PUB, "datasets-intent-coverage.json"),
              encoding="utf-8") as f:
        _intent = json.load(f)
    _totals = next(n for n in _intent.get("@graph", [])
                   if str(n.get("@id", "")).endswith(
                       "#dataset-intent-coverage-totals"))
    _rows = _totals["rowSources"]["estateGenerated"]
    _targeted = _totals["pageCoverage"]["pagesTargeted"]
    _pages_total = _totals["pageCoverage"]["pagesTotal"]
    _fmt = lambda n: f"{n:,}"
    for _seat in [os.path.join(PUB, "llms.txt"),
                  os.path.join(ROOT, "out", "phase-a", "llms.txt")]:
        if not os.path.isfile(_seat):
            continue
        with open(_seat, encoding="utf-8") as f:
            _t = f.read()
        _t, _n1 = _re.subn(
            r"lists \d+ distributions: the \d+ published dataset "
            r"files([\s\S]{0,300}?all )\d+( per-page JSON files)",
            f"lists {len(_dist)} distributions: the {_ds_count} "
            f"published dataset files\\g<1>{_per_page}\\g<2>", _t)
        _t = _t.replace(
            _re.search(r"the [\d,]+-row search-intent rubric",
                       _t).group(0),
            f"the {_fmt(_rows)}-row search-intent rubric")
        _t = _t.replace(
            _re.search(r"[\d,]+ generated query rows", _t).group(0),
            f"{_fmt(_rows)} generated query rows")
        _t = _t.replace(
            _re.search(r"every one of the site's \d+ pages is a "
                       r"rubric target", _t).group(0),
            f"every one of the site's {_targeted} pages is a "
            f"rubric target")
        _t = _re.sub(r"every one of the \d+ pages",
                     f"every one of the {_pages_total} pages", _t)
        with open(_seat, "w", encoding="utf-8") as f:
            f.write(_t)
        print(f"    llms.txt figures synced ({os.path.basename(_seat)}"
              f"): {len(_dist)} distributions, {_ds_count} dataset "
              f"files, {_per_page} per-page, {_rows} rows, "
              f"{_targeted} targeted")

    phase("5. routes (shell -> public/index.html, route docs, middleware)")
    shutil.copyfile(os.path.join(REPO, "index.html"),
                    os.path.join(PUB, "index.html"))
    routes_dir = os.path.join(WORK, "routes")
    shutil.rmtree(routes_dir, ignore_errors=True)
    run(["node", "scripts/build-routes.js", "--out-dir", routes_dir,
         "--stamps", os.path.join(WORK, "stamps.json"),
         "--page-data", os.path.join(WORK, "page-data-manifest.json")])
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
         "--audit", os.path.join(WORK, "pre-digest-audit.json"),
         "--hash-cache", os.path.join(WORK, "hash-cache.json")])
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
               "--audit", os.path.join(WORK, "digest-audit.json"),
               "--hash-cache", os.path.join(WORK, "hash-cache.json")])
    with open(os.path.join(WORK, "digest-audit.json"),
              encoding="utf-8") as f:
        totals = json.load(f)["totals"]
    if totals.get("gaps") != 0 or totals.get("distributions") != count:
        fail(f"digest audit: {totals}")
    print(f"    digest totals: {totals}")

    # S3 frozen digest map: the phase-6 audit's triple hashes,
    # frozen for the rest of this invocation — derived consumers
    # read hashes from here, never by re-reading a distribution.
    with open(os.path.join(WORK, "digest-audit.json"),
              encoding="utf-8") as f:
        digest_audit = json.load(f)
    frozen = {}
    for e in digest_audit.get("entries", []):
        d = e.get("digest") or {}
        if not d.get("value"):
            continue
        frozen[e.get("contentUrl", "")] = {
            "sha256": d.get("value"),
            "gitBlobSha1": e.get("gitBlobSha1"),
            "pagesBlake3": e.get("pagesBlake3"),
            "byteSize": d.get("byteSize"),
            "resolved": e.get("resolved"),
        }
    with open(os.path.join(WORK, "frozen-digest-map.json"), "w",
              encoding="utf-8") as f:
        json.dump(frozen, f, indent=1, sort_keys=True)
        f.write("\n")
    print(f"    frozen digest map: {len(frozen)} entries "
          f"-> frozen-digest-map.json")

    phase("6b. lastmod ledger (diff-stamp vs prior index + registry mirror)")
    ledger_path = os.path.join(ROOT, "data", "lastmod-ledger.json")
    if os.path.exists(ledger_path):
        with open(ledger_path, encoding="utf-8") as f:
            ledger = json.load(f)
    else:
        ledger = {"version": 1, "urls": {}}
    with open(os.path.join(WORK, "prior-index.json"),
              encoding="utf-8") as f:
        prior_map = {e.get("contentUrl", ""):
                     (e.get("digest") or {}).get("value")
                     for e in json.load(f).get("distribution", [])}
    with open(digested, encoding="utf-8") as f:
        new_map = {e.get("contentUrl", ""):
                   (e.get("digest") or {}).get("value")
                   for e in json.load(f).get("distribution", [])}
    # The sitemap union exactly as phase 2b built it in THIS pass.
    union = {}
    for sec in ("pages", "datasets", "blog"):
        sx = os.path.join(PUB, "sitemaps", sec + ".xml")
        if not os.path.exists(sx):
            continue
        with open(sx, encoding="utf-8") as f:
            sx_text = f.read()
        for block in re.findall(r"<url>(.*?)</url>", sx_text, re.S):
            lm_loc = re.search(r"<loc>(.*?)</loc>", block)
            lm_mod = re.search(r"<lastmod>(.*?)</lastmod>", block)
            if lm_loc and lm_mod:
                union[lm_loc.group(1)] = lm_mod.group(1)
    if not union:
        fail("ledger phase: sitemap union parsed empty — phase 2b output missing")
    urls = ledger.setdefault("urls", {})
    stamped = backfilled = 0
    for u in sorted(union):
        if u in new_map and new_map[u] != prior_map.get(u) \
                and urls.get(u) != RUBRIC_DATE:
            urls[u] = RUBRIC_DATE
            stamped += 1
        if u not in urls:
            urls[u] = union[u]
            backfilled += 1
    pruned = 0
    for u in sorted(set(urls) - set(union)):
        del urls[u]
        pruned += 1
    ledger["lastSeal"] = {"date": RUBRIC_DATE,
                          "indexSha256": sha(digested)}
    with open(ledger_path, "w", encoding="utf-8") as f:
        json.dump(ledger, f, indent=1, ensure_ascii=False, sort_keys=True)
        f.write("\n")
    # Mirror the union dates into the registry so every other consumer of
    # the registry lastmod (search-index dataset, gates) reads the same
    # truth the sitemap publishes. pages.json round-trips byte-identically
    # under this dump format (verified at the batch that built this phase).
    pages_path = os.path.join(ROOT, "data", "pages.json")
    with open(pages_path, encoding="utf-8") as f:
        registry = json.load(f)
    mirrored = 0
    for p in registry.get("pages", []):
        d = urls.get(p.get("url", ""))
        if d and p.get("lastmod") != d:
            p["lastmod"] = d
            mirrored += 1
    if mirrored:
        with open(pages_path, "w", encoding="utf-8") as f:
            json.dump(registry, f, indent=1, ensure_ascii=False,
                      sort_keys=True)
            f.write("\n")
    print(f"    ledger: {len(urls)} URLs; stamped {stamped}, "
          f"backfilled {backfilled}, pruned {pruned}; "
          f"registry mirrored {mirrored}")

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
         "--audit", os.path.join(WORK, "proof-audit.json"),
         "--fresh"])
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
    # S3 closing timing split, from the TIMINGS phase stamps:
    # hashing = the phases carrying a digest-index pass (5.5
    # pre-index, 6 digest, 8 proof recompute); sign = phase 7;
    # everything else (including 6b) is generation.
    split = {"generation": 0.0, "hashing": 0.0, "sign": 0.0}
    ends = [t for _, t in TIMINGS[1:]] + [time.time()]
    for (pname, pstart), pend in zip(TIMINGS, ends):
        if pname.startswith("7."):
            bucket = "sign"
        elif pname.startswith(("5.5.", "6.", "8.")):
            bucket = "hashing"
        else:
            bucket = "generation"
        split[bucket] += pend - pstart
    print(f"  timing split:    generation {split['generation']:.1f}s | "
          f"hashing {split['hashing']:.1f}s | "
          f"sign {split['sign']:.1f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
