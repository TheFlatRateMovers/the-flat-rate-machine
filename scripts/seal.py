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

# A4 sliced drivers (Component A4 - changed-slice rebuilds): the
# phase-2 derived loop, the consumer settle loops, the incr
# cluster's search-index / answer-evidence steps and the phase-4.5
# page-data step invoke the SLICED drivers by default. A4_CLASSIC=1
# in the seal's environment re-points every one of them at the
# classic driver (the fallback oracle) for this invocation. The
# phase-1 coverage seat needs no re-point: build-intent-rubric.js
# slices its coverage emit internally and reads the same
# A4_CLASSIC opt-out itself (see the settle_intent marker).
# predict.py A1.6 gates these markers at batch step 0.
A4_CLASSIC = os.environ.get("A4_CLASSIC") == "1"
AE_DRIVER = "build-answer-evidence.js" if A4_CLASSIC else "build-answer-evidence-sliced.js"
SI_DRIVER = "build-search-index.js" if A4_CLASSIC else "build-search-index-sliced.js"
PD_DRIVER = "build-page-data.js" if A4_CLASSIC else "build-page-data-sliced.js"

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
    pin-sync the landing seat's description + dateModified (the I-10
    pair). The date pin rides the same sync (Wave 4 finish,
    2026-11-13): the jf is a batch-authored artifact with no standing
    generator, and the first post-rollover seal left its @graph[0]
    dateModified one day behind the dataset file's — I-10 asserts
    the copy is no older than its source, so the pin carries both
    fields the gate reads."""
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
    if ds["@graph"][0].get("dateModified"):
        pp["@graph"][0]["dateModified"] = ds["@graph"][0]["dateModified"]
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
        # A4-SLICED: coverage - build-intent-rubric.js slices its coverage-document aggregates per service (A4_CLASSIC=1 = classic emit)
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


def discovery_args(index_p):
    """argv for scripts/build-discovery.js (AI-to-AI signal batch,
    2026-11-23). The generator derives every discovery fact from
    these inputs at run time: index membership + dataset digests,
    the API worker source (MCP tools, KID, OpenAPI version), the
    geojson feature count, the service registry, the intent totals
    node, the page registry (DCAT landing verification) and the
    signing-keys seat (kid + fingerprint, cross-checked)."""
    return ["node", "scripts/build-discovery.js",
            "--index", index_p,
            "--worker", os.path.join(REPO, "src-index.js"),
            "--geojson", os.path.join(PUB, "service-area.geojson"),
            "--services", os.path.join(ROOT, "data", "services.json"),
            "--pages", os.path.join(ROOT, "data", "pages.json"),
            "--intent", os.path.join(PUB, "datasets-intent-coverage.json"),
            "--signing-keys", os.path.join(PUB, ".well-known",
                                           "signing-keys.json"),
            "--out", PUB,
            "--mirror-root", REPO]


def run_discovery(index_p, tag):
    run(discovery_args(index_p))
    print(f"    discovery files regenerated ({tag})")


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
        os.path.join(PUB, "catalog.json"),
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
        for gen in (SI_DRIVER, AE_DRIVER):
            run(["node", f"scripts/{gen}"], env_extra=stamps_env)
        run(["node", "scripts/build-catalog-registry.js"],
            env_extra={"CATALOG_DATE": RUBRIC_DATE})
        # DC-2 permanent fix (2026-11-07): the resyncs above can
        # rewrite dataset files, which stales the sha256 embeds the
        # page-data pool carries for them. Refresh the pool's embeds
        # from live bytes inside the round, so the settle's
        # byte-stability check covers the pool too.
        run(["node", "scripts/refresh-pool-digests.js"])
        # Discovery settle (AI-to-AI signal batch, 2026-11-23): the
        # same class as the pool fix, one seat over — catalog.json
        # embeds every dataset file's signed digest, and the resyncs
        # and consumer generators above can rewrite dataset files
        # inside the round. Regenerate the discovery files inside
        # the round so the settle's byte-stability check covers
        # catalog.json too; the phase-5.5 re-run (from index-pre)
        # is what guarantees the FINAL digests — see the 5.5 seat.
        run_discovery(os.path.join(PUB, "ai-master-index.json"),
                      f"{tag} round {rnd}")
        # Answer-evidence landing reconciliation (Outside-Copies
        # micro-batch, 2026-11-11): the same class, one seat over —
        # the AE landing embed + pageMeta figures + singular jf date
        # derive from the AE dataset file, which the consumer
        # generators above can rewrite. Re-glue the landing inside
        # the round; verify.js AE-5 gates the result.
        run(["node", "scripts/sync-ae-landing.js"])
        h1 = {p: sha(p) for p in consumer_files}
        for gen in (SI_DRIVER, AE_DRIVER):
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
    # Territory Matrix P4 (2026-11-09): build-coverage.js runs HERE too.
    # The coverage dataset backs no rubric rows; it derives from the
    # geojson + registry + data/coverage-alias-map.json. Running it in
    # phase 0.5 keeps its outputs inside the same pass as every other
    # generator-owned dataset file (FB-3 stamps consumed the same way).
    run(["node", "scripts/build-coverage.js"],
        env_extra={"FB3_STAMPS": os.path.join(WORK, "stamps.json")})
    # Money Trio-6 (2026-11-16): build-logistics-dataset.js runs HERE
    # too — the logistics dataset file backs intent-rubric rows (the
    # category rows bind it), so it precedes phase 1 like ports; it
    # derives from data/ports.json + data/services.json and takes its
    # dates from the lastmod ledger (no stamps input).
    run(["node", "scripts/build-logistics-dataset.js"])
    # W30 Machine repair (2026-11-10): the shell's inline router script
    # is a hand-kept reduced copy of the router; its data literals
    # (pages / redirects / pageMeta) drifted from repo-dir/main.js
    # invisibly (10 slugs lost, Nov 4–7 batches). The syncer splices
    # the three literals from main.js verbatim, here in phase 0.5,
    # before any phase digests the shell; check-twins TW-7 gates the
    # same comparison at publish preflight.
    run(["node", "scripts/sync-shell-inline-router.js"])
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
    for gen in (SI_DRIVER, AE_DRIVER,
                "build-local-graph.js", "build-archive-registry.js"):
        # Q124 (2026-11-03): all four derived-dataset generators now
        # consume FB3_STAMPS for their file-level dateModified stamps
        # (Q2=A); search-index and answer-evidence previously derived
        # theirs from evidence dates — their DATE_MOD keeps only its
        # evidence roles (validation, evidence prose).
        run(["node", f"scripts/{gen}"],
            env_extra=stamps_env if gen in (
                "build-local-graph.js", "build-archive-registry.js",
                SI_DRIVER, AE_DRIVER)
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
    # Answer-evidence landing reconciliation (2026-11-11): the same
    # unconditional post-4c run for the AE landing seats — phase 4
    # can move the AE file's bytes (root-digest embeds), and the
    # landing must be glued to the final file before routes bake it
    # (phase 5) and the digest pass signs the tree (phase 6).
    run(["node", "scripts/sync-ae-landing.js"])

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
    run(["node", "scripts/" + PD_DRIVER,
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
        # AI-to-AI batch (2026-11-23), companion: the figure sync
        # now also owns the API bullet's discovery seats — the
        # dataset-file label, the MCP tool parenthetical
        # (regenerated from the worker source's own TOOLS order),
        # the OpenAPI mention, and the agent-catalog resource
        # count (derived from the ai-catalog.json installed in
        # PUB, never a literal). Every rewrite is seat-scoped and
        # idempotent: a second seal over synced bytes changes
        # nothing, and no other byte of llms.txt is touched.
        # predict.py A1.6 gates all four seats at batch step 0.
        _t = _re.sub(r"\[the \d+ dataset files\]",
                     f"[the {_ds_count} dataset files]", _t)
        _tools = []
        _src = os.path.join(REPO, "src-index.js")
        if os.path.isfile(_src):
            _st = open(_src, encoding="utf-8").read()
            _tb = _st[_st.index("const TOOLS = ["):]
            _tb = _tb[:_tb.index("];")]
            _tools = _re.findall(r"name:\s*'([a-z_]+)'", _tb)
        if _tools:
            _t = _re.sub(r"\(tools: [^)]*\)",
                         "(tools: " + ", ".join(_tools) + ")", _t,
                         count=1)
        if "https://api.theflatratemovers.com/openapi.json" not in _t:
            _t = _t.replace(
                "and an MCP server at "
                "https://api.theflatratemovers.com/mcp",
                "[the OpenAPI spec](https://api.theflatratemovers.com"
                "/openapi.json), and an MCP server at "
                "https://api.theflatratemovers.com/mcp", 1)
        _cat = os.path.join(PUB, "ai-catalog.json")
        if os.path.isfile(_cat):
            _ncat = len(json.load(open(_cat, encoding="utf-8"))
                        .get("entries", []))
            _t = _re.sub(r"\d+ real data resources",
                         f"{_ncat} real data resources", _t)
        with open(_seat, "w", encoding="utf-8") as f:
            f.write(_t)
        print(f"    llms.txt figures synced ({os.path.basename(_seat)}"
              f"): {len(_dist)} distributions, {_ds_count} dataset "
              f"files, {_per_page} per-page, {_rows} rows, "
              f"{_targeted} targeted")

    # Outside-Copies micro-batch (2026-11-11): the AI ingestion card
    # regenerates HERE — after page-data registration and the llms
    # figure sync, so the membership it reads is this seal's final
    # membership, and before routes/digest, so phase 5's middleware
    # manifest picks the file up as a static seat and phase 6 digests
    # its final bytes. The card stamps the PRIOR seal (the phase-0
    # snapshot's SHA) as its "estate seal at generation" — it never
    # claims the seal that contains itself. A card failure fails the
    # seal loud, like every other generator.
    run(["node", "scripts/build-ai-card.js"],
        env_extra={"AI_CARD_PRIOR_INDEX":
                   os.path.join(WORK, "prior-index.json"),
                   "AI_CARD_DATE": RUBRIC_DATE})
    print("    ai ingestion card regenerated (prior-seal stamped)")

    # AI discovery files (AI-to-AI signal batch, 2026-11-23): the
    # same seat as the AI card — after page-data registration and
    # the llms figure sync, so the membership the generator reads
    # is this seal's final membership, and before routes/digest,
    # so phase 5's middleware manifest picks catalog.json up as a
    # static seat and phase 6 digests the signed seats' final
    # bytes. The phase-5.5 re-run below re-derives catalog.json
    # from index-pre (fresh digests from live bytes), which is
    # what guarantees its embedded dataset digests are this
    # seal's final digests. A discovery failure fails the seal
    # loud, like every other generator.
    run_discovery(index_path, "ai-card seat — final membership")

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

    # Discovery settle re-run (AI-to-AI signal batch, 2026-11-23):
    # index-pre carries digest-index's fresh digests, computed
    # from live bytes in this same phase — the first moment in
    # the seal when every dataset digest is final (nothing after
    # this point rewrites a dataset file; phase 6 only digests).
    # Rebuilding catalog.json from it makes its embedded SHA-256
    # set this seal's signed set. Following the refresh-pool-
    # digests pattern: the refresher re-runs at the last point
    # where its inputs can still move, so the embeds converge to
    # the same seal's final digests instead of the prior seal's.
    run_discovery(pre, "phase 5.5 settle — index-pre digests")

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

    phase("6c. sitemap rebuild from the stamped ledger (S-4 fix)")
    # JK Family-1 batch (2026-11-20), S-4 rider: phase 2b built the
    # sitemaps from the ledger as of seal start; 6b has since stamped
    # this seal's changed URLs to RUBRIC_DATE, so the shipped sitemaps
    # lagged the ledger by one pass for exactly the files changed
    # in-seal (verify S-4: datasets-search-index-clusters.json, -2, -3
    # at the Potomac tail close). Rebuild the sitemaps from the stamped
    # ledger and re-run the digest pass BEFORE signing, so the signed
    # index, the shipped sitemaps and the ledger agree in one pass.
    run(["node", "scripts/build-sitemap.js"])
    run([VENV_PY, os.path.join(REPO, "digest-index.py"),
         "--index", index_path, "--public-dir", PUB,
         "--repo-dir", REPO, "--out", digested,
         "--audit", os.path.join(WORK, "digest-audit-6c.json"),
         "--hash-cache", os.path.join(WORK, "hash-cache.json")])
    with open(os.path.join(WORK, "digest-audit-6c.json"),
              encoding="utf-8") as f:
        audit6c = json.load(f)
    totals6c = audit6c["totals"]
    if totals6c.get("gaps") != 0 or \
            totals6c.get("distributions") != count:
        fail(f"6c re-digest audit: {totals6c}")
    frozen = {}
    for e in audit6c.get("entries", []):
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
    # The ledger's seal anchor must name the index that ships.
    ledger["lastSeal"] = {"date": RUBRIC_DATE,
                          "indexSha256": sha(digested)}
    with open(ledger_path, "w", encoding="utf-8") as f:
        json.dump(ledger, f, indent=1, ensure_ascii=False, sort_keys=True)
        f.write("\n")
    print(f"    6c: sitemaps rebuilt post-stamp; re-digest totals "
          f"{totals6c}; ledger anchor updated")

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




# ============================================================
# OPTION A — INCREMENTAL SEAL (Henry's decision, 2026-11-18:
# "Faster seal, same shape"). THE DEFAULT since the flip of
# 2026-11-19 (see the flip note at the end of this block):
#
#     python3 scripts/seal.py                    (this path)
#     SEAL_INCREMENTAL=0 python3 scripts/seal.py  (legacy main())
#
# This path changes ONLY the generation phase (everything
# before the phase-5.5 digest pass): the digest passes, signing,
# ledger and proof round are the same code in the same order.
#
# Design:
#   * Every generation step declares its INPUTS (file sets derived
#     from what the step's program actually reads — registries,
#     public-tree seats, the shell, stamps — plus its own code)
#     and its OUTPUTS. A step is skipped only when (a) the
#     fingerprint of its inputs equals the fingerprint recorded
#     when the step last produced the sealed outputs, AND (b)
#     every recorded output is still present with its recorded
#     fingerprint. State is committed to out/seal-work/
#     incr-state.json ONLY after the proof round passes, so the
#     state always describes the last SEALED run.
#   * Dependency order: content producers run first; the steps
#     that embed other files' digests (graph syncs, catalog
#     registry, pool digest refresh, AE landing sync, derived
#     copies) run after them inside one cluster whose passes
#     repeat until a full pass runs zero gated steps — the
#     fixpoint the old seal reached by regenerating everything
#     up to 10 times, reached here by fingerprint comparison.
#     Each digest-embedding step reads the CURRENT bytes of its
#     inputs at decision time, so the digests it embeds are
#     computed from the settled tree (the frozen digest map in
#     effect).
#   * rubric.db fingerprints are semantic, never bytewise (the
#     file's bytes are unstable across identical rewrites —
#     SQLite change counters): exact streamed dumps of the small
#     tables the generators read (gsc_observed_queries,
#     gsc_observed_pages, intent_row_outcome), the COUNT of
#     intent_outcome_evidence (the only value any seal-path
#     generator reads from it), and the generator-published
#     rows_digest in intent_meta as the content fingerprint of
#     the projection tables (intent_query, intent_row_outcome,
#     intent_row_gsc_evidence are dropped and rebuilt by the
#     generator in the same run that publishes the digest).
#   * Always-run steps: build-catalog-registry.js (its inputs
#     include live external reads — the estate API, a git fetch
#     of the mirror clone, the Hugging Face API, a Zenodo record
#     + zip download — which cannot be fingerprinted), the
#     digest-refresh propagation scan, page-data registration,
#     the llms.txt figure sync, and the whole digest/sign/proof
#     tail. Each is named again in the batch report.
#   * Recorded input AND output fingerprints are re-captured
#     at commit time from the sealed tree (fin_final/outs_final):
#     the always-run tail rewrites public-root JSONs after the
#     generation steps execute (their outputs) and rewrites the
#     lastmod ledger + pages registry inside the shared data/
#     input bundle (their inputs), so execution-time
#     fingerprints would fail every skip test on the next seal.
#     The skip rule itself is unchanged — inputs must match the
#     last sealed run AND outputs must still match their sealed
#     fingerprints.
#   * Audit-layer handover (2026-11-18): this path also persists
#     four metadata artifacts to out/seal-state/ (fingerprint
#     map, frozen digest map, step graph, seal-state marker)
#     for the audit layer's Phase 2. Metadata only: no sealed
#     byte depends on them, and the old path writes none.
#   * Incr-4 levers (2026-11-19; Henry's approved sequence —
#     levers, then the equivalence re-proof): (a) the 4c
#     check-gate — in the contingent cluster, intent is first
#     offered the generator's own --check; a pass settles it
#     without a regeneration (the old seal's 4c settle fired
#     on exactly that condition); (b) precise bundles — the
#     append-class observation files leave the shared data/
#     bundle of every step that does not read them; (c)
#     intent's public-root bundle narrowed to its true cert
#     set (see _intent_cert_specs). The skip rule, the tail,
#     and every sealed byte's provenance are unchanged.
#   * Incr-5, speed round 2 (2026-11-19; Henry delegated the
#     call: "whatever makes this process perfect without
#     excuses, you do it"): (d) the check-gate generalized —
#     the main cluster offers intent the same --check before
#     a regeneration as the contingent cluster does (the 4c
#     call site is unchanged); (e) page-data's public-tree
#     bundle narrowed to its true cert set (see
#     _page_data_specs): the pool, the answer-evidence file,
#     the per-page JSONs the head registry names, and the
#     registry pages' route documents — the files
#     build-page-data.js actually reads, derived from its
#     own code and verified against an fs-trace of a full
#     generation. The skip rule, the tail, and every sealed
#     byte's provenance are unchanged.
#   * THE FLIP (2026-11-19; Henry delegated the call
#     2026-11-19 07:11 EST — "whatever makes this process
#     perfect without excuses, you do it"): after the Option A
#     proof, the levers proof (incr-4) and the speed round-2
#     proof (incr-5) all passed equivalence — identical signed
#     index, zero seal-controlled byte differences — this path
#     becomes the default for a bare invocation. The legacy
#     main() above is byte-for-byte untouched and stays
#     reachable as the explicit opt-out SEAL_INCREMENTAL=0;
#     the flip changes the INCR dispatch expression only.
#     This path also refreshes the audit layer's tree-state
#     stamp (piece 4) at seal end — metadata only, non-fatal.
# ============================================================

# THE FLIP (2026-11-19): the incremental path is the default.
# SEAL_INCREMENTAL=0 is the explicit opt-out to the legacy
# main(); any other value (including unset) selects this path.
# The legacy code above is untouched — dispatch only.
INCR = os.environ.get("SEAL_INCREMENTAL", "1") != "0"
PLAN_VERSION = "incr-5"
FLAT_DIR = os.path.join(os.path.dirname(ROOT), "theflatratemovers")
DB_PATH = REG["rubric_db"]

from datetime import datetime as _datetime, timezone as _timezone


def _now_iso():
    return _datetime.now(_timezone.utc).isoformat()


def _rel(p):
    """Path relative to the tree parent (the convention the
    estate's tooling uses: the-flat-rate-machine/...,
    the-flat-rate-movers-pages/public/..., theflatratemovers/...)
    when the path lives under it; the absolute path otherwise."""
    base = os.path.dirname(ROOT)
    try:
        r = os.path.relpath(p, base)
    except ValueError:
        return p
    return p if r.startswith("..") else r


class Incr:
    def __init__(self):
        self.state_path = os.path.join(WORK, "incr-state.json")
        self.cache_path = os.path.join(WORK, "incr-hash-cache.json")
        self.state = {}
        if os.path.isfile(self.state_path):
            try:
                with open(self.state_path, encoding="utf-8") as f:
                    self.state = json.load(f)
            except Exception:
                self.state = {}
        self.pending = dict(self.state.get("steps", {}))
        self.hcache = {}
        if os.path.isfile(self.cache_path):
            try:
                with open(self.cache_path, encoding="utf-8") as f:
                    raw = json.load(f)
                for k, v in raw.items():
                    self.hcache[k] = (v["size"], v["mtimeNs"], v["sha256"])
            except Exception:
                self.hcache = {}
        self.ran = []
        self.skipped = []
        self._db_fp_cache = {}
        self.graph = {}
        self.ss_dir = os.path.join(ROOT, "out", "seal-state")

    # ---- file hashing (size+mtimeNs cache, digest-index's model)
    def fsha(self, p):
        try:
            st = os.stat(p)
        except OSError:
            return None
        key = os.path.abspath(p)
        ent = self.hcache.get(key)
        if ent and ent[0] == st.st_size and ent[1] == st.st_mtime_ns:
            return ent[2]
        h = sha(p)
        self.hcache[key] = (st.st_size, st.st_mtime_ns, h)
        return h

    # ---- spec resolution -------------------------------------
    # specs: ("f", path) | ("d", dir, suffixes|None, recursive)
    #        | ("g", globpattern) | ("-", path)  (minus, exact)
    def resolve(self, specs):
        out = set()
        minus = set()
        import glob as _glob
        for spec in specs:
            kind = spec[0]
            if kind == "f":
                out.add(os.path.abspath(spec[1]))
            elif kind == "-":
                minus.add(os.path.abspath(spec[1]))
            elif kind == "-g":
                for p in _glob.glob(spec[1]):
                    if os.path.isfile(p):
                        minus.add(os.path.abspath(p))
            elif kind == "g":
                for p in _glob.glob(spec[1]):
                    if os.path.isfile(p):
                        out.add(os.path.abspath(p))
            elif kind == "d":
                _, d, suffixes, recursive = spec
                if not os.path.isdir(d):
                    continue
                if recursive:
                    for base, _dirs, files in os.walk(d):
                        for fn in files:
                            if suffixes is None or fn.endswith(suffixes):
                                out.add(os.path.abspath(
                                    os.path.join(base, fn)))
                else:
                    for fn in os.listdir(d):
                        p = os.path.join(d, fn)
                        if os.path.isfile(p) and (
                                suffixes is None or fn.endswith(suffixes)):
                            out.add(os.path.abspath(p))
        return sorted(out - minus)

    def fp_of(self, specs):
        h = hashlib.sha256()
        for p in self.resolve(specs):
            s = self.fsha(p)
            if s is None:
                h.update(f"{p}|MISSING\n".encode())
            else:
                h.update(f"{p}|{s}\n".encode())
        return h.hexdigest()

    def outs_of(self, specs):
        return {p: self.fsha(p) for p in self.resolve(specs)}

    # ---- rubric.db semantic fingerprints ---------------------
    def _db_stat_key(self):
        try:
            st = os.stat(DB_PATH)
            return (st.st_size, st.st_mtime_ns)
        except OSError:
            return None

    def _sqlite_dump_fp_hex(self, tables):
        """A5 hex-stream fingerprint (installed 2026-11-22, A5
        adoption batch; A5-DESIGN §8.5): the table dump rides
        sqlite3 -list with per-value hex encoding instead of the
        -json escaper (quadratic in value length). Per value:
        NULL -> char(30); a REAL -> hex(printf('%!.20g', c)) — the
        rendering sqlite itself uses for -json (CAST AS TEXT loses
        float precision, which would blind the fingerprint to
        real-valued cell changes); else hex(CAST(c AS TEXT)).
        Fields joined by char(31). The fingerprint's contract is
        determinism + sensitivity, not a specific byte value: the
        fp values differ from the -json era by design, so the
        first post-install seal re-runs the DB-gated steps once.
        Proven at install: gate §2.3 — determinism x2 on all three
        fp sets; a text plant and a float-epsilon plant (invisible
        to CAST AS TEXT) both move the fp."""
        key = ("dump-hex", tuple(tables), self._db_stat_key())
        if key in self._db_fp_cache:
            return self._db_fp_cache[key]
        h = hashlib.sha256()
        for t in tables:
            h.update(f"TABLE {t}\n".encode())
            out = subprocess.run(
                ["sqlite3", "-readonly", "-list", "-noheader", DB_PATH,
                 f"PRAGMA table_info({t});"],
                capture_output=True, text=True)
            if out.returncode != 0:
                fail(f"incr: sqlite pragma failed for table {t}")
            cols = [line.split("|")[1]
                    for line in out.stdout.strip().split("\n") if line]
            fields = " || char(31) || ".join(
                f"CASE WHEN {c} IS NULL THEN char(30) "
                f"WHEN typeof({c}) = 'real' THEN hex(printf('%!.20g', {c})) "
                f"ELSE hex(CAST({c} AS TEXT)) END" for c in cols)
            proc = subprocess.Popen(
                ["sqlite3", "-readonly", "-list", "-noheader", DB_PATH,
                 f"SELECT {fields} FROM {t} ORDER BY rowid;"],
                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
            while True:
                chunk = proc.stdout.read(1 << 20)
                if not chunk:
                    break
                h.update(chunk)
            proc.wait()
            if proc.returncode != 0:
                fail(f"incr: sqlite hex dump failed for table {t}")
            h.update(b"\n")
        val = h.hexdigest()
        self._db_fp_cache[key] = val
        return val

    def _sqlite_scalar(self, sql):
        out = subprocess.run(
            ["sqlite3", "-readonly", DB_PATH, sql],
            capture_output=True, text=True)
        if out.returncode != 0:
            fail(f"incr: sqlite scalar failed: {sql}")
        return (out.stdout or "").strip()

    def db_fp_intent(self):
        """What build-intent-rubric.js's GENERATION reads from the
        db: the two GSC observation tables, the prior outcome
        projection (loadPriorOutcomes), and the evidence COUNT
        (its only read of intent_outcome_evidence). intent_meta is
        deliberately excluded: the generator rebuilds it; it is an
        output-side artifact, read only by --check."""
        key = ("intent", self._db_stat_key())
        if key in self._db_fp_cache:
            return self._db_fp_cache[key]
        val = "|".join([
            self._sqlite_dump_fp_hex(
                ["gsc_observed_queries", "gsc_observed_pages",
                 "intent_row_outcome"]),
            "evidence_count=" + self._sqlite_scalar(
                "SELECT COUNT(*) FROM intent_outcome_evidence;"),
        ])
        self._db_fp_cache[key] = val
        return val

    def db_fp_rows(self):
        """Content fingerprint of the generator's projection
        tables (intent_query et al.) for the steps that read them
        through SQL (search-index, answer-evidence, page-data):
        the intent_meta dump carries the generator-published
        rows_digest + counts of the run that built the tables."""
        key = ("rows", self._db_stat_key())
        if key in self._db_fp_cache:
            return self._db_fp_cache[key]
        val = "|".join([
            self._sqlite_dump_fp_hex(["intent_meta"]),
            "intent_query_count=" + self._sqlite_scalar(
                "SELECT COUNT(*) FROM intent_query;"),
        ])
        self._db_fp_cache[key] = val
        return val

    def db_fp_gsc(self):
        return self._sqlite_dump_fp_hex(["gsc_observed_queries"])

    # ---- the step runner --------------------------------------
    def env_fp(self, extra=""):
        return (f"plan={PLAN_VERSION}|sealpy="
                f"{self.fsha(os.path.abspath(__file__))}"
                f"|date={RUBRIC_DATE}|{extra}")

    def step(self, sid, in_specs, out_specs, fn, env_extra="",
             always=False, embedding=False, note=""):
        if sid not in self.graph:
            ent = {"step": sid,
                   "inputs": [_rel(p) for p in self.resolve(in_specs)],
                   "outputs": [],
                   "digest_embedding": bool(embedding),
                   "always_run": bool(always)}
            if note:
                ent["note"] = note
            self.graph[sid] = ent
        fin = self.fp_of(in_specs) + "|" + self.env_fp(env_extra)
        rec = self.pending.get(sid)
        if not always and rec and rec.get("fin") == fin:
            recorded = rec.get("outs") or {}
            current = self.outs_of(out_specs)
            if current == recorded:
                self.graph[sid]["outputs"] = [
                    _rel(p) for p in sorted(current)]
                if "ospecs" not in rec:
                    rec["ospecs"] = [list(s) for s in out_specs]
                if "ispecs" not in rec:
                    rec["ispecs"] = [list(s) for s in in_specs]
                    rec["env"] = env_extra
                self.skipped.append(sid)
                print(f"    [incr] skip {sid} (inputs + outputs "
                      f"match the last sealed run)")
                return False
        fn()
        outs_now = self.outs_of(out_specs)
        self.graph[sid]["outputs"] = [_rel(p) for p in sorted(outs_now)]
        self.pending[sid] = {"fin": fin, "outs": outs_now,
                             "ospecs": [list(s) for s in out_specs],
                             "ispecs": [list(s) for s in in_specs],
                             "env": env_extra}
        self.ran.append(sid)
        return True

    def commit(self, sealed_index_sha):
        # fin_final + outs_final: re-capture every step's input
        # and output fingerprints NOW, from the sealed tree. The
        # always-run tail mutates both sides after the generation
        # steps execute — phase-4 digest-refresh rewrites
        # public-root JSONs and the shell (outputs), and phase-6b
        # rewrites the lastmod ledger + pages registry, which sit
        # inside the shared data/ input bundle (inputs) — so
        # execution-time fingerprints never match the next seal's
        # live tree and every skip test fails. Recording the
        # post-tail fingerprints is what lets the next seal tell
        # "unchanged" apart from "changed" without re-running
        # the web every time. The env component (semantic db
        # fingerprints, dates) is kept from execution time: it
        # describes the sealed db state, which only an ingest
        # changes — and an ingest SHOULD invalidate the steps.
        def _restore(specs):
            out = []
            for s in specs:
                s = list(s)
                if s[0] == "d" and isinstance(s[2], list):
                    s[2] = tuple(s[2])
                out.append(tuple(s))
            return out
        for sid, rec in self.pending.items():
            if rec.get("ospecs"):
                rec["outs"] = self.outs_of(_restore(rec["ospecs"]))
            if rec.get("ispecs"):
                rec["fin"] = self.fp_of(_restore(rec["ispecs"])) \
                    + "|" + self.env_fp(rec.get("env", ""))
        doc = {"plan": PLAN_VERSION, "sealed_index": sealed_index_sha,
               "steps": self.pending}
        tmp = self.state_path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=1, sort_keys=True)
            f.write("\n")
        os.replace(tmp, self.state_path)
        cache = {k: {"size": v[0], "mtimeNs": v[1], "sha256": v[2]}
                 for k, v in self.hcache.items()}
        tmp = self.cache_path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(cache, f)
            f.write("\n")
        os.replace(tmp, self.cache_path)
        print(f"    [incr] state committed ({len(self.pending)} steps; "
              f"ran {len(self.ran)}, skipped {len(self.skipped)})")

    # ---- audit-layer seal-state artifacts (Phase 2 handover,
    # 2026-11-18): persist what this path already computes, in
    # out/seal-state/. Metadata only — no sealed byte depends on
    # these writes, and the old path writes none of them.
    def ss_write(self, name, doc):
        os.makedirs(self.ss_dir, exist_ok=True)
        p = os.path.join(self.ss_dir, name)
        tmp = p + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=1, sort_keys=True)
            f.write("\n")
        os.replace(tmp, p)
        print(f"    [incr] seal-state: {name} written")

    def ss_sealing(self, prior_seal):
        self.ss_write("seal-state.json", {
            "state": "sealing", "prior_seal": prior_seal,
            "started_at": _now_iso(), "mode": "incremental",
            "plan": PLAN_VERSION})

    def ss_frozen(self, frozen):
        """The frozen digest map, projected to {contentUrl:
        sha256} — written at the phase-6 freeze, the moment the
        seal's digest map exists in final form."""
        self.ss_write("frozen-digest-map.json",
                      {u: e.get("sha256") for u, e in frozen.items()})

    def ss_finish(self, new_seal, frozen, tail_entries):
        """Seal end: the fingerprint map (per-file triple hashes
        from the phase-6 digest pass, keyed by resolved seat),
        a per-seal copy of it, the step graph (this run's gated
        steps in registration order + the always-run tail), and
        the seal-state marker flipped to sealed."""
        files = {}
        for u, e in frozen.items():
            key = (e.get("resolved") or u).split("@")[0]
            if key.endswith("/"):
                key += "index.html"
            files[key] = {"sha256": e.get("sha256"),
                          "git_sha1": e.get("gitBlobSha1"),
                          "blake3": e.get("pagesBlake3"),
                          "bytes": e.get("byteSize")}
        doc = {"seal_id": new_seal, "sealed_at": _now_iso(),
               "files": files}
        self.ss_write("fingerprint-map.json", doc)
        self.ss_write(f"fingerprint-map-{new_seal[:8]}.json", doc)
        self.ss_write("step-graph.json",
                      list(self.graph.values()) + tail_entries)
        self.ss_write("seal-state.json", {
            "state": "sealed", "seal_id": new_seal,
            "sealed_at": doc["sealed_at"], "mode": "incremental",
            "plan": PLAN_VERSION})


# ---- shared input bundles (specs for the Incr resolver) ----
def _S(*names):
    return [("f", os.path.join(ROOT, "scripts", n)) for n in names]


_LIBS = [("f", os.path.join(ROOT, "scripts", "lib.js")),
         ("f", os.path.join(ROOT, "scripts", "lib-constants.js"))]
_DATA = [("d", os.path.join(ROOT, "data"), None, True)]
_STAMPS = [("f", os.path.join(WORK, "stamps.json"))]
_PUB_JSON = [("d", PUB, (".json",), False)]
_SHELL = [("f", os.path.join(REPO, "index.html"))]
_HEAD_FN = [("f", os.path.join(PAGES, "functions", "head-data.js"))]
_HEAD_REPO = [("f", os.path.join(REPO, "head-data.js"))]
_QB = [("f", os.path.join(FLAT_DIR, "blog-project",
                          "04-question-bank.md"))]
_STAMPS_ENV = None  # set in main_incr (needs WORK, a global — see below)

# Lever (b) — precise bundles (incr-4, 2026-11-19): the shared
# data/ bundle carried two append-class files that almost no
# step reads. data/catalog-observations.json is read and
# appended ONLY by build-catalog-registry.js (its storePath);
# data/panel-observations.json is read ONLY by
# build-answer-evidence.js (paths.json panel_observations_file)
# and appended by out-of-seal ingests. Readership was proven
# from the generators' own code (a grep across scripts/*.js
# finds no other reader of either file, no seal-path generator
# enumerates data/, and none spawns a child generator). Inside
# the shared bundle, the catalog store's per-run append
# re-invalidated every data-consuming step on every cluster
# pass. _DATA_X excludes both files; _DATA_AE excludes only
# the catalog store (answer-evidence keeps the panel file it
# truly reads). The catalog step itself is always-run with no
# fingerprint, so its own read/write needs no bundle entry.
_DATA_X = _DATA + [
    ("-", os.path.join(ROOT, "data", "catalog-observations.json")),
    ("-", os.path.join(ROOT, "data", "panel-observations.json"))]
_DATA_AE = _DATA + [
    ("-", os.path.join(ROOT, "data", "catalog-observations.json"))]


def _intent_cert_specs():
    """Lever (c) — intent's public-root inputs narrowed to the
    cert set: the files build-intent-rubric.js actually reads,
    derived from the generator's own code and verified against
    an fs-trace of a full generation on the sealed tree (see
    the Option A record's levers section):
      * ai-master-index.json — loadAll() reads it (the
        distByUrl membership gates);
      * every root *.json NOT starting with "datasets-" and
        not the index — resolveJsonFile() content-parses
        exactly this set to resolve each page's JSON by its
        WebPage @id, and emit() digests the resolved file's
        bytes into every row's certificate. The landing seat
        dataset-intent-coverage.json is filtered out of the
        scan: it is one of the step's own output seats
        (install_intent pin-syncs it), excluded exactly as
        the old whole-root bundle excluded it, so the step
        cannot invalidate itself;
      * the DATASETS map's files — emit() digests each one's
        bytes per row; the map is parsed out of the generator
        source at seal time, so the set tracks the generator,
        never a hand copy;
      * service-area.geojson — a CORE_DIST target whose bytes
        the generator digests into every base node's
        distribution (entity-graph.json, best-json-entity
        -graph.json and ai-sitemap.json ride the scan set
        above; the generator's datasets-intent-coverage.json
        output seat starts with "datasets-" and is out of
        the scan by the same filter);
      * the resolveJsonFile() fallback files — pages the
        @id scan does not resolve uniquely fall back to the
        slug-derived name, which for 'datasets/<x>' pages is
        the dataset file itself (see the replication at the
        end of this function).
    One traced read stays deliberately OUT: the scan parses
    dataset-intent-coverage.json (the landing seat) like any
    per-page JSON, but that file is the step's own output
    seat — install_intent pin-syncs it from the generated
    dataset file — so fingerprinting it would let the step
    invalidate itself; the old bundle excluded it for the
    same reason, and its @id seat is policed by the index
    gates.
    The scan is enumerated file-by-file (never glob-minus:
    the resolver's minus specs subtract globally, which
    would also remove the DATASETS re-adds below). If the
    DATASETS map cannot be parsed, fall back to the whole
    public root (correct, just slower) with a loud log
    line — never a silent narrowing."""
    specs = [("f", os.path.join(PUB, "ai-master-index.json")),
             ("f", os.path.join(PUB, "service-area.geojson"))]
    try:
        names = os.listdir(PUB)
    except OSError:
        names = []
    for fn in sorted(names):
        if fn.endswith(".json") and not fn.startswith("datasets-") \
                and fn not in ("ai-master-index.json",
                               "dataset-intent-coverage.json"):
            p = os.path.join(PUB, fn)
            if os.path.isfile(p):
                specs.append(("f", p))
    try:
        with open(os.path.join(ROOT, "scripts",
                               "build-intent-rubric.js"),
                  encoding="utf-8") as f:
            src = f.read()
        m = re.search(r"const DATASETS = \{(.*?)\n\};", src, re.S)
        if not m:
            raise ValueError("DATASETS map not found in generator")
        files = sorted(set(re.findall(r"'([A-Za-z0-9._-]+\.json)'",
                                      m.group(1))))
        if len(files) < 30:
            raise ValueError(
                f"only {len(files)} dataset files parsed")
        specs += [("f", os.path.join(PUB, fn)) for fn in files]
    except Exception as e:
        print(f"    [incr] WARNING: intent cert-set derivation "
              f"failed ({e}) — falling back to the whole public "
              f"root for intent's inputs")
        return [("d", PUB, None, False),
                ("-", os.path.join(PUB,
                                   "datasets-intent-coverage.json")),
                ("-", os.path.join(PUB,
                                   "dataset-intent-coverage.json"))]
    # The resolveJsonFile() fallback, replicated: a page whose
    # URL the WebPage-@id scan resolves to other than exactly
    # one file falls back to its slug-derived filename, which
    # emit() then digests and a lane content-reads. For
    # 'datasets/<x>' slugs the derived name is the dataset
    # file itself — outside the scan set — so those files
    # join the cert set. (An fs-trace of a full generation
    # caught four: the archive-registry, b2b-specialty
    # -rubric, catalog-registry and crawl-presence dataset
    # files.) The scan replication below mirrors the
    # generator's own filter and @id collection exactly.
    try:
        with open(os.path.join(ROOT, "data", "pages.json"),
                  encoding="utf-8") as f:
            pages = json.load(f).get("pages", [])
        idmap = {}
        for fn in names:
            if not fn.endswith(".json") \
                    or fn.startswith("datasets-") \
                    or fn == "ai-master-index.json":
                continue
            try:
                with open(os.path.join(PUB, fn),
                          encoding="utf-8") as f:
                    doc = json.load(f)
            except Exception:
                continue
            nodes = doc.get("@graph") if isinstance(doc, dict) \
                else None
            if not isinstance(nodes, list):
                nodes = [doc]
            for n in nodes:
                if isinstance(n, dict) \
                        and n.get("@type") == "WebPage" \
                        and isinstance(n.get("@id"), str):
                    idmap.setdefault(n["@id"], []).append(fn)
        for pg in pages:
            if len(idmap.get(pg.get("url", ""), [])) == 1:
                continue
            derived = pg.get("slug", "").replace("/", "-") \
                + ".json"
            p = os.path.join(PUB, derived)
            if derived.startswith("datasets-") \
                    and derived != "datasets-intent-coverage.json" \
                    and os.path.isfile(p):
                specs.append(("f", p))
    except Exception as e:
        print(f"    [incr] WARNING: intent cert-set derivation "
              f"failed at the resolution fallback ({e}) — "
              f"falling back to the whole public root for "
              f"intent's inputs")
        return [("d", PUB, None, False),
                ("-", os.path.join(PUB,
                                   "datasets-intent-coverage.json")),
                ("-", os.path.join(PUB,
                                   "dataset-intent-coverage.json"))]
    return specs


def _page_data_specs():
    """Speed round 2 (incr-5, 2026-11-19) — page-data's
    public-tree inputs narrowed to the cert set: the files
    build-page-data.js actually reads under PUB, derived from
    the generator's own code (the scripts/ and repo-dir twins
    are byte-identical) and verified against an fs-trace of a
    full generation on the sealed tree (see the speed round 2
    record):
      * datasets-page-data-pool.json — the pool draw: the
        generator's page model IS the pool's @graph slices;
      * datasets-answer-evidence.json — its answerFragments
        are DR-4's fragment answer source;
      * the per-page JSONs — perPageJson() reads PUB/<jf> for
        every registry page whose head entry names one
        (declared services + the FAQ source). The jf set is
        derived by parsing functions/head-data.js exactly as
        the generator parses it and replicating its
        headEntryFor() lookup over data/pages.json, so the
        set tracks the head registry, never a hand copy;
      * the registry pages' route documents — routeText()
        reads PUB/<page path>/index.html (PUB/index.html for
        the home page) for the parity lint; derived from the
        same registry by the generator's own path rule.
    Deliberately OUT: page-data-scores.json (the step's own
    output seat), the manifest (a WORK seat, already an input
    of the routes step), and every other root JSON and route
    document — the generator never opens them. The rubric
    rows arrive through sqlite (fingerprinted semantically
    by the step's dbrows env component); the pages registry,
    stamps and head source ride the step's data/stamps/head
    inputs. If a derivation fails, fall back to the old
    whole-root bundle (correct, just slower) with a loud log
    line — never a silent narrowing."""
    specs = [("f", os.path.join(PUB, "datasets-page-data-pool.json")),
             ("f", os.path.join(PUB, "datasets-answer-evidence.json"))]
    try:
        with open(os.path.join(ROOT, "data", "pages.json"),
                  encoding="utf-8") as f:
            pages = json.load(f).get("pages", [])
        with open(os.path.join(PAGES, "functions", "head-data.js"),
                  encoding="utf-8") as f:
            head_src = f.read()
        head = json.loads(
            re.sub(r";\s*$", "",
                   re.sub(r"^//[^\n]*\n", "", head_src, flags=re.M)
                   .replace("export const HEAD = ", "", 1)))
        site = "https://theflatratemovers.com"
        jfs = set()
        seen = set()
        for pg in pages:
            url = pg.get("url", "")
            if not url.startswith(site + "/"):
                continue
            # headEntryFor(), replicated: the entry for the
            # page's path (or the path minus one trailing slash)
            pth = url[len(site):] or "/"
            entry = head.get(pth) or head.get(
                pth[:-1] if pth.endswith("/") else pth)
            if isinstance(entry, dict) and entry.get("jf"):
                jfs.add(entry["jf"])
            # routeText()'s path rule, replicated
            rel = url[len(site + "/"):]
            if rel.endswith("/"):
                rel = rel[:-1]
            p = os.path.join(PUB, "index.html") if rel == "" \
                else os.path.join(PUB, rel, "index.html")
            if p not in seen:
                seen.add(p)
                specs.append(("f", p))
        if len(jfs) < 100:
            raise ValueError(
                f"only {len(jfs)} jf files derived from the head "
                f"registry")
        if len(seen) < 100:
            raise ValueError(
                f"only {len(seen)} route documents derived from "
                f"the pages registry")
        specs += [("f", os.path.join(PUB, jf)) for jf in sorted(jfs)]
    except Exception as e:
        print(f"    [incr] WARNING: page-data cert-set derivation "
              f"failed ({e}) — falling back to the whole public "
              f"root for page-data's inputs")
        return list(_PUB_JSON) + [("d", PUB, ("index.html",), True)]
    return specs


def _graph_syncs_and_copies():
    """The two graph citizenship syncs + the flat-workspace mirror
    copies, exactly as phases 2/2c run them."""
    run(["node", "scripts/sync-dataset-graph-nodes.js", "--resync"],
        env_extra={"FRM_SEAL_DATE": RUBRIC_DATE})
    run(["node", "scripts/sync-variant-graph-nodes.js", "--resync"],
        env_extra={"FRM_SEAL_DATE": RUBRIC_DATE})
    for g in ("entity-graph.json", "best-json-entity-graph.json"):
        src_p = os.path.join(ROOT, "data", g)
        dst_p = os.path.join(FLAT_DIR, g)
        shutil.copyfile(src_p, dst_p)
        if sha(src_p) != sha(dst_p):
            fail(f"FB-3 graph copy mismatch (incr): {g}")
    print("    dataset graph sync (--resync) done; flat graph copies "
          "mirrored from data/")


def _intent_gate(ix, in_specs, out_specs, env_extra,
                 label="check-gate"):
    """Lever (a) — the check-gate (incr-4, 2026-11-19, built
    for the 4c contingent cluster; incr-5 generalizes it to
    the main cluster's settle passes — same gate, both call
    sites). Returns True when intent is proven settled WITHOUT
    regenerating: a recorded state exists, the fingerprint
    skip does not already govern (fin moved), the recorded
    outputs still match the tree byte-for-byte, and the
    generator's own --check — a full regeneration from the
    current inputs, compared by rows digest — passes. The
    recorded input fingerprint is then advanced to the
    current one: the check is a strictly stronger settledness
    proof than the fingerprint (it regenerates from whatever
    the inputs now are), so the step is settled for exactly
    the inputs the advanced fingerprint names. When the check
    fails, returns False and the caller runs the step exactly
    as before — the gate can only ever save work the
    generator itself proves unnecessary."""
    rec = ix.pending.get("intent")
    if not rec:
        return False
    fin = ix.fp_of(in_specs) + "|" + ix.env_fp(env_extra)
    if rec.get("fin") == fin:
        return False  # the plain fingerprint skip governs
    if (rec.get("outs") or {}) != ix.outs_of(out_specs):
        return False  # installed artifacts moved: regenerate
    chk_env = {**os.environ, "RUBRIC_DATE": RUBRIC_DATE}
    chk = subprocess.run(
        ["node", "scripts/build-intent-rubric.js", "--check"],
        cwd=ROOT, env=chk_env, capture_output=True, text=True)
    if chk.returncode != 0:
        print(f"    [incr] {label}: intent --check failed "
              f"— regenerating")
        return False
    line = (chk.stdout or "").strip().split("\n")[-1]
    print(f"    [incr] {label}: intent settled by "
          f"--check ({line[:110]})")
    m = re.search(r"digest ([0-9a-f]{64})", line)
    if m:
        ix.last_rows_digest = m.group(1)
    rec["fin"] = fin
    if "ospecs" not in rec:
        rec["ospecs"] = [list(s) for s in out_specs]
    if "ispecs" not in rec:
        rec["ispecs"] = [list(s) for s in in_specs]
        rec["env"] = env_extra
    ix.skipped.append("intent")
    if "intent" in ix.graph:
        ix.graph["intent"]["outputs"] = [
            _rel(p) for p in sorted(ix.outs_of(out_specs))]
    return True


def _incr_cluster(ix, tag, catalog_mode, check_gate=False):
    """One dependency-ordered pass structure over the coupled
    intent/graph/consumer web, repeated until a full pass runs
    zero gated steps (the fixpoint), bounded at 10 passes like
    the old settle. Digest-embedding steps sit after the content
    producers in every pass and read current bytes at decision
    time, so their embeds come from the settled tree."""
    stamps_env = {"FB3_STAMPS": os.path.join(WORK, "stamps.json")}
    intent_work = os.path.join(
        REG["rubric_work_dir"], "datasets-intent-coverage.json")
    intent_outs = [("f", intent_work),
                   ("f", os.path.join(PUB, "datasets-intent-coverage.json")),
                   ("f", os.path.join(PUB, "dataset-intent-coverage.json"))]
    # The rubric digests, from live bytes, every file its rows
    # and dataset nodes cite (~421 distinct files: the per-page
    # JSONs, the dataset files, the root seats). Incr-4 lever
    # (c): the input set is that cert set exactly
    # (_intent_cert_specs), not the whole public root — the
    # whole-root bundle made every root-file rewrite anywhere
    # in the seal (llms-full.txt, the search-index splits, the
    # pool) a false intent invalidation.
    intent_in = (_S("build-intent-rubric.js") + _LIBS + _DATA_X + _STAMPS
                 + _intent_cert_specs()
                 + _QB
                 + [("f", os.path.join(
                        ROOT, "out", "external-rubric-intake-2026-11-12",
                        "staging-external-rows.jsonl")),
                    ("d", os.path.join(
                        ROOT, "out",
                        "external-rubric-intake-3pl-gemini-2026-11-12"),
                     None, False),
                    ("f", os.path.join(
                        ROOT, "out",
                        "external-rubric-intake-ports3pl-bridge-2026-11-14",
                        "staging-bridge-rows.jsonl")),
                    ("f", os.path.join(
                        ROOT, "out", "batch-ports-full-2026-11-15",
                        "external-bank-staged.jsonl")),
                    ("f", os.path.join(
                        ROOT, "out", "batch-ports-full-2026-11-15",
                        "external-bank-staged-2.jsonl"))])
    graph_in = (_S("sync-dataset-graph-nodes.js",
                   "sync-variant-graph-nodes.js",
                   "graph-citizenship-population.js")
                + _LIBS + _DATA_X + _PUB_JSON
                + [("-", os.path.join(PUB, "entity-graph.json")),
                   ("-", os.path.join(PUB, "best-json-entity-graph.json"))]
                + _HEAD_REPO + _HEAD_FN)
    graph_outs = [("f", os.path.join(PUB, "entity-graph.json")),
                  ("f", os.path.join(PUB, "best-json-entity-graph.json")),
                  ("f", os.path.join(ROOT, "data", "entity-graph.json")),
                  ("f", os.path.join(ROOT, "data",
                                     "best-json-entity-graph.json")),
                  ("f", os.path.join(FLAT_DIR, "entity-graph.json")),
                  ("f", os.path.join(FLAT_DIR,
                                     "best-json-entity-graph.json"))]
    si_outs = [("f", os.path.join(PUB, "datasets-search-index.json")),
               ("g", os.path.join(PUB, "datasets-search-index-clusters*.json"))]
    si_in = (_S(SI_DRIVER) + _LIBS + _DATA_X + _STAMPS
             + _SHELL + _HEAD_FN + _PUB_JSON
             + [("-g", os.path.join(PUB, "datasets-search-index*.json")),
                ("f", os.path.join(PUB, "service-area.geojson")),
                ("f", os.path.join(REG["rubric_work_dir"],
                                   "gsc-verdicts-latest.json"))])
    ae_outs = [("f", os.path.join(PUB, "datasets-answer-evidence.json")),
               ("g", os.path.join(
                   PUB, "datasets-answer-evidence-questions*.json"))]
    ae_in = (_S(AE_DRIVER) + _LIBS + _DATA_AE + _STAMPS
             + _SHELL + _HEAD_FN
             + [("f", os.path.join(PUB, "llms-full.txt"))]
             + _PUB_JSON
             + [("-g", os.path.join(PUB, "datasets-answer-evidence*.json"))])
    for p in range(1, 11):
        gated = 0
        gated += ix.step(
            "local-graph",
            _S("build-local-graph.js") + _LIBS + _DATA_X + _STAMPS,
            [("g", os.path.join(PUB, "datasets-local-graph*.json"))],
            lambda: run(["node", "scripts/build-local-graph.js"],
                        env_extra=stamps_env))
        def _intent():
            ix.last_rows_digest = settle_intent(f"incr {tag} pass {p}")
        intent_env = "dbintent=" + ix.db_fp_intent()
        if check_gate and _intent_gate(ix, intent_in, intent_outs,
                                       intent_env,
                                       label=f"{tag} check-gate"):
            intent_ran = False
        else:
            intent_ran = ix.step("intent", intent_in, intent_outs,
                                 _intent, env_extra=intent_env)
        gated += intent_ran
        gated += ix.step("graph-syncs", graph_in, graph_outs,
                         _graph_syncs_and_copies, embedding=True)
        gated += ix.step(
            "archive-registry",
            _S("build-archive-registry.js") + _LIBS + _DATA_X + _PUB_JSON
            + [("-", os.path.join(PUB, "datasets-archive-registry.json"))],
            [("g", os.path.join(PUB, "datasets-archive-registry*.json"))],
            lambda: run(["node", "scripts/build-archive-registry.js"],
                        env_extra=stamps_env))
        gated += ix.step("search-index", si_in, si_outs,
                         lambda: run(["node", "scripts/" + SI_DRIVER],
                                     env_extra=stamps_env),
                         env_extra="dbrows=" + ix.db_fp_rows()
                         + "|dbgsc=" + ix.db_fp_gsc())
        gated += ix.step("answer-evidence", ae_in, ae_outs,
                         lambda: run(["node",
                                      "scripts/" + AE_DRIVER],
                                     env_extra=stamps_env),
                         env_extra="dbrows=" + ix.db_fp_rows())
        # Catalog registry: ALWAYS-RUN when due (live external
        # inputs cannot be fingerprinted). Main cluster: due in
        # pass 1, and in any later pass where a gated step ahead
        # of it moved (the old settle re-ran it every round).
        # Contingent re-entry (the old 4c): due only in a pass
        # where the intent step itself re-ran — the old 4c settle
        # fired only when the intent --check failed.
        due = (catalog_mode == "main" and (p == 1 or gated > 0)) or \
            (catalog_mode == "contingent" and intent_ran)
        if due:
            ix.step("catalog-registry", [], [(
                "f", os.path.join(PUB, "datasets-catalog-registry.json"))],
                lambda: run(["node", "scripts/build-catalog-registry.js"],
                            env_extra={"CATALOG_DATE": RUBRIC_DATE}),
                always=True, embedding=True,
                note="inputs are live external reads (estate API, "
                     "git fetch of the mirror clone, Hugging Face "
                     "API, Zenodo record + zip) — not "
                     "fingerprintable")
        gated += ix.step(
            "pool-digests",
            _S("refresh-pool-digests.js")
            + [("g", os.path.join(PUB, "datasets-*.json")),
               ("-", os.path.join(PUB, "datasets-page-data-pool.json"))],
            [("f", os.path.join(PUB, "datasets-page-data-pool.json"))],
            lambda: run(["node", "scripts/refresh-pool-digests.js"]),
            embedding=True)
        gated += ix.step(
            "discovery-digests",
            _S("build-discovery.js")
            + [("f", os.path.join(PUB, "ai-master-index.json")),
               ("f", os.path.join(REPO, "src-index.js")),
               ("f", os.path.join(PUB, "service-area.geojson")),
               ("f", os.path.join(ROOT, "data", "services.json")),
               ("f", os.path.join(ROOT, "data", "pages.json")),
               ("f", os.path.join(PUB,
                                  "datasets-intent-coverage.json")),
               ("f", os.path.join(PUB, ".well-known",
                                  "signing-keys.json")),
               ("g", os.path.join(PUB, "datasets-*.json"))],
            [("f", os.path.join(PUB, ".well-known",
                                "ai-catalog.json")),
             ("f", os.path.join(PUB, ".well-known", "ard.json")),
             ("f", os.path.join(PUB, "ai-catalog.json")),
             ("f", os.path.join(REPO, "ai-catalog.json")),
             ("f", os.path.join(PUB, "catalog.json"))],
            lambda: run_discovery(
                os.path.join(PUB, "ai-master-index.json"),
                f"incr {tag} pass {p}"),
            embedding=True)
        gated += ix.step(
            "ae-landing",
            _S("sync-ae-landing.js") + _LIBS
            + [("f", os.path.join(PUB, "datasets-answer-evidence.json"))],
            [("f", os.path.join(PUB, "dataset-answer-evidence.json"))]
            + _SHELL,
            lambda: run(["node", "scripts/sync-ae-landing.js"]),
            embedding=True)
        gated += ix.step(
            "derived-copies",
            _S("sync-derived-copies.js") + _LIBS + _DATA_X + _STAMPS,
            _PUB_JSON + _SHELL,
            lambda: run(["node", "scripts/sync-derived-copies.js"]),
            embedding=True)
        if gated == 0:
            print(f"    [incr] cluster settled ({tag}, pass {p}): "
                  f"zero gated steps ran — fixpoint proven by "
                  f"fingerprints")
            return
        print(f"    [incr] cluster ({tag}, pass {p}): {gated} gated "
              f"step(s) ran — another pass")
    fail(f"incr cluster ({tag}): not converged after 10 passes")


def _pub_listing_fp():
    h = hashlib.sha256()
    for base, dirs, files in os.walk(PUB):
        dirs.sort()
        for fn in sorted(files):
            h.update((os.path.relpath(os.path.join(base, fn), PUB)
                      + "\n").encode())
    return h.hexdigest()


def _audit_stamp_hook():
    """Audit Layer piece 4: refresh the tree-state stamp at seal
    end, from the artifacts ss_finish just persisted. Metadata
    only — a stamp failure never fails a seal."""
    try:
        p = subprocess.run(
            [sys.executable,
             os.path.join(ROOT, "scripts", "audit-stamp.py"),
             "--quiet"],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, timeout=1200)
        if p.returncode == 0:
            print("    [incr] seal-state: tree-stamp.json written")
        else:
            print("    [incr] WARNING: tree-stamp refresh failed "
                  f"(exit {p.returncode}) — seal unaffected")
    except Exception as e:
        print(f"    [incr] WARNING: tree-stamp refresh failed "
              f"({e}) — seal unaffected")


def main_incr():
    """The Option A seal: identical phases and tail to main(),
    with the generation steps fingerprint-gated (see the Option A
    design note above). The default since the 2026-11-19 flip;
    SEAL_INCREMENTAL=0 opts out to the legacy main()."""
    t0 = time.time()
    os.makedirs(WORK, exist_ok=True)
    ix = Incr()
    stamps_env = {"FB3_STAMPS": os.path.join(WORK, "stamps.json")}

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
    ix.ss_sealing(old_seal)
    print(f"    RUBRIC_DATE={RUBRIC_DATE}")
    if ix.state.get("sealed_index") not in (None, old_seal):
        print(f"    [incr] note: recorded state belongs to seal "
              f"{ix.state.get('sealed_index')}; the installed index "
              f"is {old_seal} — content fingerprints still govern "
              f"every skip decision")
    shutil.copyfile(index_path, os.path.join(WORK, "prior-index.json"))
    upd_path = os.path.join(PUB, "updates.xml")
    if os.path.exists(upd_path):
        shutil.copyfile(upd_path, os.path.join(WORK, "prior-updates.xml"))
    print("    pulse snapshots: prior-index.json"
          " (+ prior-updates.xml if present)")
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

    phase("0.5. ports dataset (stamps-wired; precedes the rubric)")
    ix.step("ports",
            _S("build-ports.js") + _LIBS + _DATA_X + _STAMPS,
            [("f", os.path.join(PUB, "datasets-ports.json")),
             ("f", os.path.join(PUB, "dataset-ports.json"))],
            lambda: run(["node", "scripts/build-ports.js"],
                        env_extra=stamps_env))
    ix.step("coverage",
            _S("build-coverage.js") + _LIBS + _DATA_X + _STAMPS,
            [("f", os.path.join(PUB, "datasets-coverage.json")),
             ("d", os.path.join(PUB, "datasets", "coverage"),
              (".json",), False)],
            lambda: run(["node", "scripts/build-coverage.js"],
                        env_extra=stamps_env))
    ix.step("logistics",
            _S("build-logistics-dataset.js") + _LIBS + _DATA_X,
            [("g", os.path.join(PUB, "datasets-logistics*.json"))],
            lambda: run(["node", "scripts/build-logistics-dataset.js"]))
    ix.step("shell-router",
            _S("sync-shell-inline-router.js")
            + [("f", os.path.join(REPO, "main.js"))],
            _SHELL,
            lambda: run(["node", "scripts/sync-shell-inline-router.js"]))
    ix.step("stamp-datasets",
            _S("stamp-dataset-files.js") + _STAMPS,
            [("g", os.path.join(PUB, "datasets-*.json"))],
            lambda: run(["node", "scripts/stamp-dataset-files.js"],
                        env_extra=stamps_env))

    phase("2c. copy integrity (incr cluster: dependency-ordered, "
          "fingerprint-gated)")
    # Incr-5: the main cluster offers intent the check-gate too
    # (round 2, item 2) — a pass whose inputs moved but whose
    # rows did not settles by the generator's own --check
    # instead of a full settle_intent regeneration.
    _incr_cluster(ix, "main", "main", check_gate=True)

    phase("2b. sitemap sections + index, the Google News sitemap and "
          "the article feed (registry/ledger-driven; before "
          "routes/middleware and the digest phase so the sealed "
          "estate carries the architecture)")
    ix.step("sitemap",
            _S("build-sitemap.js") + _LIBS + _DATA_X
            + [("f", os.path.join(FLAT_DIR, "blog-project",
                                  "ledger.csv"))],
            [("f", os.path.join(PUB, "sitemap.xml")),
             ("d", os.path.join(PUB, "sitemaps"), (".xml",), False)],
            lambda: run(["node", "scripts/build-sitemap.js"]))
    ix.step("news-sitemap",
            _S("build-news-sitemap.js") + _LIBS + _DATA_X
            + [("f", os.path.join(FLAT_DIR, "blog-project",
                                  "ledger.csv"))],
            [("f", os.path.join(PUB, "news-sitemap.xml"))],
            lambda: run(["node", "scripts/build-news-sitemap.js"]))
    ix.step("feed",
            _S("build-feed.js") + _LIBS + _DATA_X + _SHELL
            + [("f", os.path.join(PUB, "blog.json")),
               ("f", os.path.join(FLAT_DIR, "blog-project",
                                  "ledger.csv"))],
            [("f", os.path.join(PUB, "feed.xml"))],
            lambda: run(["node", "scripts/build-feed.js"]))

    phase("3. llms-full (reads every dataset file; count from index)")
    ix.step("llms-full",
            _S("build-llms-full.js") + _LIBS + _DATA_X + _SHELL
            + [("d", PUB, None, False),
               ("-", os.path.join(PUB, "llms-full.txt")),
               ("f", os.path.join(PUB, ".well-known",
                                  "signing-keys.json")),
               ("f", os.path.join(REPO, "webmcp.js"))],
            [("f", os.path.join(PUB, "llms-full.txt"))],
            lambda: run(["node", "scripts/build-llms-full.js",
                         "--shell", os.path.join(REPO, "index.html"),
                         "--distributions", str(count),
                         "--out", os.path.join(PUB, "llms-full.txt")]),
            env_extra=f"count={count}")

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

    phase("4c. copy-integrity contingency (incr cluster re-entry)")
    _incr_cluster(ix, "4c", "contingent", check_gate=True)

    phase("4.5. page data (pool draw -> per-page data.json/data.txt "
          "+ scores + head-block manifest)")
    route_docs = [("d", PUB, ("index.html",), True)]
    # Incr-5 (round 2, item 1): page-data's public-tree inputs
    # are its cert set (_page_data_specs) — the whole-root
    # bundle made every root rewrite anywhere in the seal a
    # false page-data invalidation.
    ix.step("page-data",
            _S(PD_DRIVER) + _LIBS + _DATA_X + _STAMPS + _HEAD_FN
            + _page_data_specs(),
            [("d", PUB, ("data.json", "data.txt"), True),
             ("f", os.path.join(PUB, "page-data-scores.json")),
             ("f", os.path.join(WORK, "page-data-manifest.json"))],
            lambda: run(["node", "scripts/" + PD_DRIVER,
                         "--manifest",
                         os.path.join(WORK, "page-data-manifest.json")],
                        env_extra=stamps_env),
            env_extra="dbrows=" + ix.db_fp_rows())
    # Registration: always-run (the seal owns page-data membership;
    # a mechanical append, identical to main()).
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
    # llms.txt figure sync: always-run (identical to main()).
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
        # AI-to-AI batch (2026-11-23), companion: the figure sync
        # now also owns the API bullet's discovery seats — the
        # dataset-file label, the MCP tool parenthetical
        # (regenerated from the worker source's own TOOLS order),
        # the OpenAPI mention, and the agent-catalog resource
        # count (derived from the ai-catalog.json installed in
        # PUB, never a literal). Every rewrite is seat-scoped and
        # idempotent: a second seal over synced bytes changes
        # nothing, and no other byte of llms.txt is touched.
        # predict.py A1.6 gates all four seats at batch step 0.
        _t = _re.sub(r"\[the \d+ dataset files\]",
                     f"[the {_ds_count} dataset files]", _t)
        _tools = []
        _src = os.path.join(REPO, "src-index.js")
        if os.path.isfile(_src):
            _st = open(_src, encoding="utf-8").read()
            _tb = _st[_st.index("const TOOLS = ["):]
            _tb = _tb[:_tb.index("];")]
            _tools = _re.findall(r"name:\s*'([a-z_]+)'", _tb)
        if _tools:
            _t = _re.sub(r"\(tools: [^)]*\)",
                         "(tools: " + ", ".join(_tools) + ")", _t,
                         count=1)
        if "https://api.theflatratemovers.com/openapi.json" not in _t:
            _t = _t.replace(
                "and an MCP server at "
                "https://api.theflatratemovers.com/mcp",
                "[the OpenAPI spec](https://api.theflatratemovers.com"
                "/openapi.json), and an MCP server at "
                "https://api.theflatratemovers.com/mcp", 1)
        _cat = os.path.join(PUB, "ai-catalog.json")
        if os.path.isfile(_cat):
            _ncat = len(json.load(open(_cat, encoding="utf-8"))
                        .get("entries", []))
            _t = _re.sub(r"\d+ real data resources",
                         f"{_ncat} real data resources", _t)
        with open(_seat, "w", encoding="utf-8") as f:
            f.write(_t)
        print(f"    llms.txt figures synced ({os.path.basename(_seat)}"
              f"): {len(_dist)} distributions, {_ds_count} dataset "
              f"files, {_per_page} per-page, {_rows} rows, "
              f"{_targeted} targeted")
    ix.step("ai-card",
            _S("build-ai-card.js") + _LIBS + _DATA_X
            + [("f", os.path.join(WORK, "prior-index.json")),
               ("f", index_path),
               ("f", os.path.join(PUB, "datasets-intent-coverage.json"))],
            [("f", os.path.join(PUB, "ai-ingestion-card.html"))],
            lambda: run(["node", "scripts/build-ai-card.js"],
                        env_extra={"AI_CARD_PRIOR_INDEX":
                                   os.path.join(WORK, "prior-index.json"),
                                   "AI_CARD_DATE": RUBRIC_DATE}))
    print("    ai ingestion card regenerated (prior-seal stamped)")

    # AI discovery files (AI-to-AI signal batch, 2026-11-23): the
    # ai-card seat — after page-data registration + the llms figure
    # sync (final membership), before routes/digest. Fingerprint
    # inputs are the generator's full input set; outputs are the
    # four PUB seats plus the root seat's repo-dir mirror. The
    # phase-5.5 step below re-runs it from index-pre for the
    # final-digest guarantee (see the legacy seat's comment).
    ix.step("discovery",
            _S("build-discovery.js")
            + [("f", index_path),
               ("f", os.path.join(REPO, "src-index.js")),
               ("f", os.path.join(PUB, "service-area.geojson")),
               ("f", os.path.join(ROOT, "data", "services.json")),
               ("f", os.path.join(ROOT, "data", "pages.json")),
               ("f", os.path.join(PUB,
                                  "datasets-intent-coverage.json")),
               ("f", os.path.join(PUB, ".well-known",
                                  "signing-keys.json"))],
            [("f", os.path.join(PUB, ".well-known",
                                "ai-catalog.json")),
             ("f", os.path.join(PUB, ".well-known", "ard.json")),
             ("f", os.path.join(PUB, "ai-catalog.json")),
             ("f", os.path.join(REPO, "ai-catalog.json")),
             ("f", os.path.join(PUB, "catalog.json"))],
            lambda: run_discovery(index_path,
                                  "ai-card seat — final membership"))
    print("    ai discovery files regenerated (final membership)")

    phase("5. routes (shell -> public/index.html, route docs, middleware)")
    def _routes():
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
    ix.step("routes",
            _S("build-routes.js") + _LIBS + _SHELL + _HEAD_REPO + _HEAD_FN
            + [("d", os.path.join(ROOT, "scripts", "route-assets"),
               None, False),
               ("f", os.path.join(REPO, "main.js")),
               ("f", os.path.join(REPO, "webmcp.js"))]
            + _DATA_X + _STAMPS
            + [("f", os.path.join(WORK, "page-data-manifest.json"))]
            + _PUB_JSON
            + [("d", PUB, ("data.json", "data.txt"), True)],
            route_docs
            + [("f", os.path.join(PAGES, "functions",
                                  "_middleware.js"))],
            _routes,
            env_extra="listing=" + _pub_listing_fp())

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
    feed_in = (_S("build-update-feed.js")
               + [("f", os.path.join(WORK, "prior-index.json")),
                  ("f", pre)]
               + ([("f", prior_upd)] if os.path.exists(prior_upd)
                  else []))
    ix.step("update-feed", feed_in,
            [("f", os.path.join(PUB, "updates.xml"))],
            lambda: run(feed_args))
    print(f"    update feed rebuilt (pre-index sha: {pre_sha})")

    # Discovery settle re-run (AI-to-AI signal batch, 2026-11-23):
    # from index-pre, whose digests digest-index computed from
    # live bytes in this phase — the guarantee seat for
    # catalog.json's embedded dataset digests (see legacy 5.5).
    ix.step("discovery-settle",
            _S("build-discovery.js")
            + [("f", pre),
               ("f", os.path.join(REPO, "src-index.js")),
               ("f", os.path.join(PUB, "service-area.geojson")),
               ("f", os.path.join(ROOT, "data", "services.json")),
               ("f", os.path.join(ROOT, "data", "pages.json")),
               ("f", os.path.join(PUB,
                                  "datasets-intent-coverage.json")),
               ("f", os.path.join(PUB, ".well-known",
                                  "signing-keys.json"))],
            [("f", os.path.join(PUB, ".well-known",
                                "ai-catalog.json")),
             ("f", os.path.join(PUB, ".well-known", "ard.json")),
             ("f", os.path.join(PUB, "ai-catalog.json")),
             ("f", os.path.join(REPO, "ai-catalog.json")),
             ("f", os.path.join(PUB, "catalog.json"))],
            lambda: run_discovery(pre,
                                  "phase 5.5 settle — index-pre digests"))
    print("    ai discovery files settled (index-pre digests)")

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
    ix.ss_frozen(frozen)

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

    phase("6c. sitemap rebuild from the stamped ledger (S-4 fix)")
    # JK Family-1 batch (2026-11-20), S-4 rider: phase 2b built the
    # sitemaps from the ledger as of seal start; 6b has since stamped
    # this seal's changed URLs to RUBRIC_DATE, so the shipped sitemaps
    # lagged the ledger by one pass for exactly the files changed
    # in-seal (verify S-4: datasets-search-index-clusters.json, -2, -3
    # at the Potomac tail close). Rebuild the sitemaps from the stamped
    # ledger and re-run the digest pass BEFORE signing, so the signed
    # index, the shipped sitemaps and the ledger agree in one pass.
    run(["node", "scripts/build-sitemap.js"])
    run([VENV_PY, os.path.join(REPO, "digest-index.py"),
         "--index", index_path, "--public-dir", PUB,
         "--repo-dir", REPO, "--out", digested,
         "--audit", os.path.join(WORK, "digest-audit-6c.json"),
         "--hash-cache", os.path.join(WORK, "hash-cache.json")])
    with open(os.path.join(WORK, "digest-audit-6c.json"),
              encoding="utf-8") as f:
        audit6c = json.load(f)
    totals6c = audit6c["totals"]
    if totals6c.get("gaps") != 0 or \
            totals6c.get("distributions") != count:
        fail(f"6c re-digest audit: {totals6c}")
    frozen = {}
    for e in audit6c.get("entries", []):
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
    ix.ss_frozen(frozen)
    # The ledger's seal anchor must name the index that ships.
    ledger["lastSeal"] = {"date": RUBRIC_DATE,
                          "indexSha256": sha(digested)}
    with open(ledger_path, "w", encoding="utf-8") as f:
        json.dump(ledger, f, indent=1, ensure_ascii=False, sort_keys=True)
        f.write("\n")
    print(f"    6c: sitemaps rebuilt post-stamp; re-digest totals "
          f"{totals6c}; ledger anchor updated")

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

    ix.commit(new_seal)
    _tail_graph = [
        {"step": "stamps", "inputs": [
            _rel(os.path.join(ROOT, "data", "lastmod-ledger.json")),
            _rel(os.path.join(ROOT, "data", "pages.json")),
            _rel(os.path.join(ROOT, "data", "news-formula.json")),
            _rel(index_path)],
         "outputs": [_rel(os.path.join(WORK, "stamps.json"))],
         "digest_embedding": False, "always_run": True},
        {"step": "digest-refresh", "inputs": [_rel(PUB),
                                              _rel(os.path.join(
                                                  REPO, "index.html"))],
         "outputs": [_rel(PUB), _rel(os.path.join(REPO, "index.html"))],
         "digest_embedding": True, "always_run": True,
         "note": "phase 4: rewrites stale root digests across the "
                 "public root JSONs + the shell (seat-level entry; "
                 "the scan is over every root *.json)"},
        {"step": "registration", "inputs": [
            _rel(index_path),
            _rel(os.path.join(ROOT, "data", "pages.json"))],
         "outputs": [_rel(index_path)],
         "digest_embedding": False, "always_run": True},
        {"step": "llms-figures", "inputs": [
            _rel(index_path),
            _rel(os.path.join(PUB, "datasets-intent-coverage.json"))],
         "outputs": [_rel(os.path.join(PUB, "llms.txt")),
                     _rel(os.path.join(ROOT, "out", "phase-a",
                                       "llms.txt"))],
         "digest_embedding": False, "always_run": True},
        {"step": "digest-index", "inputs": [_rel(index_path),
                                            _rel(PUB)],
         "outputs": [_rel(os.path.join(WORK, "index-digested.json")),
                     _rel(os.path.join(WORK,
                                       "frozen-digest-map.json"))],
         "digest_embedding": False, "always_run": True},
        {"step": "ledger", "inputs": [
            _rel(os.path.join(WORK, "index-digested.json")),
            _rel(os.path.join(PUB, "sitemaps"))],
         "outputs": [_rel(os.path.join(ROOT, "data",
                                       "lastmod-ledger.json")),
                     _rel(os.path.join(ROOT, "data", "pages.json"))],
         "digest_embedding": False, "always_run": True},
        {"step": "sign", "inputs": [
            _rel(os.path.join(WORK, "index-digested.json"))],
         "outputs": [_rel(index_path),
                     _rel(os.path.join(PUB, "ai-master-index.jws"))],
         "digest_embedding": False, "always_run": True},
        {"step": "proof", "inputs": [_rel(index_path), _rel(PUB)],
         "outputs": [_rel(os.path.join(WORK, "index-proof.json"))],
         "digest_embedding": False, "always_run": True},
    ]
    ix.ss_finish(new_seal, frozen, _tail_graph)
    total = time.time() - t0
    print(f"\nSEAL OK (incr) — one pass + proof round, {total:.1f}s total")
    print(f"  pre-seal index:  {old_seal}")
    print(f"  final seal:      {new_seal}")
    print(f"  distributions:   {count}, gaps 0")
    print(f"  [incr] steps ran: {', '.join(ix.ran) or 'none'}")
    print(f"  [incr] steps skipped: {', '.join(ix.skipped) or 'none'}")
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
    _audit_stamp_hook()
    return 0


if __name__ == "__main__":
    # VF6 gate G-3 lane-lock (2026-11-23): never seal over a
    # FAILED-CLOSED batch. Shared module: scripts/close_state.py.
    import close_state as _close_state
    _close_state.lane_lock(None, tool="SEAL")
    sys.exit(main_incr() if INCR else main())
