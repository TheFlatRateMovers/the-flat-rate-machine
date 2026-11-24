#!/usr/bin/env python3
"""predict.py — Component A1: the pre-seal prediction pass (rig build).

Batch step 0: run BEFORE the first seal of a batch. It extends
audit-preflight.py — its 13 live checks are the base layer, imported,
not re-written — with the classes the 2026-11-19/20 Potomac tail close
paid for (A-DESIGN §1):

  A1.1 pins          — every census pin seat in code read and compared
                       (verify.js P-5 + D-2, build-routes.js D-2, the
                       API test pins, data/pages.json, services.json
                       pageCounts) against the expected census.
  A1.2 dates-delta   — for every file in the batch's DECLARED change
                       set, data/lastmod-ledger.json's entry must
                       already equal the batch date (the
                       midnight-crossing / stamps-fed generator rule),
                       checked from the declaration, not from mtimes.
  A1.3 embeds-whole  — the graph-embed sweep over EVERY PUB JSON
                       (recursive: per-page JSONs in subdirectories
                       included), not only the root seat the base
                       layer scans. DC-2 samples; this enumerates.
  A1.4 beacon        — P-3 prediction: the tree's route documents
                       must carry the baked Web Analytics beacon
                       (Henry's 2026-11-20 ruling); if absent, warn in
                       plain words that the alias verify will read
                       +367 B per HTML document from edge injection.
  A1.5 windowed      — the A6 windowed-build step's gate: every
                       builder in scripts/windowed-builds.json (the
                       governed-builder registry — builders whose
                       emit scales with a full estate table) must be
                       the exact build its recorded rig proof covers
                       (sha256), carry the windowed actions in code
                       (ORDER BY window reads, streamed writes,
                       streaming digests, release-before-emit), keep
                       all seats byte-identical, carry a recorded
                       peak-RSS bound the proof respected, and stay
                       fingerprint-gated in seal.py. An unproven edit
                       to a governed builder is RED here, before a
                       seal is spent — never discovered as an OOM
                       mid-seal (A5 install batch, 2026-11-22).
  A1.6 discovery     — the discovery seats (ai-catalog.json in
                       every seat, catalog.json) and llms.txt's
                       headline discovery figures agree with the
                       installed index + the on-disk surface files
                       (service-area.geojson, src-index.js TOOLS):
                       catalog surface set + embedded counts, the
                       DCAT catalog's set/digests/sizes, the API
                       bullet's dataset figure, the MCP tool list,
                       the catalog resource count, the OpenAPI URL.

Production seat (per A-DESIGN §1): scripts/predict.py, single seat.
This rig build takes --root explicitly and loads audit-preflight.py
from the TARGET tree's scripts/, so the base layer that runs is the
target tree's own audit code against the target tree.

Input:  --delta  flat {metric: expected} JSON (audit-preflight format;
                 audit-counts metric keys) — the batch's expected census.
        --spec   {"changed_files": [tree-relative paths],
                  "pin_expectations": {seat_metric: expected}}
                 (seat metrics: dataset_instances, services_pagecount_sum)
Output: <batch-dir>/prediction-<batch>.json + .txt; exit 0/1.
        Any RED stops the batch before a seal is spent. The pass
        never waives a check and never edits the tree.
"""
import argparse
import hashlib
import importlib.util
import json
import os
import re
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

SITE = "https://theflatratemovers.com"
MAX_LIST = 60


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def sha256_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def cap(lst):
    return lst[:MAX_LIST], len(lst)


# ------------------------------------------------------------------
# A1.1 — census pins, swept whole from the files.
# A pin seat is the EXECUTABLE literal a check compares against,
# plus the same figure carried in that check's own name string.
# Patterns are therefore scoped: (metric, line_filter, regex) —
# only lines containing line_filter are read (None = every line,
# used only for expressions unique enough to stand alone, like
# `shellCountD ===`). Unscoped number-matching is how a sweep
# drowns in chain-note history: verify.js's comments carry every
# prior census, and generic expressions (j.count ===) serve many
# endpoints. Calibrated on the sealed tree, 2026-11-20.
# ------------------------------------------------------------------

def _pin_seats(root, flat):
    verify = os.path.join(root, "verify.js")
    routes = os.path.join(root, "scripts", "build-routes.js")
    runtests = os.path.join(flat, "api-worker", "test", "run-tests.mjs")
    return [
        ("verify.js P-5 (certificate census)", verify, [
            ("page_files", "certificate covers all",
             re.compile(r"(\d+) per-page JSONs")),
            ("route_documents", "certificate covers all",
             re.compile(r"all (\d+) route documents")),
            ("distributions", "certificate covers all",
             re.compile(r"\((\d+) distributions\)")),
            ("distributions", None, re.compile(
                r"\(servedIndex\.distribution \|\| \[\]\)\.length === (\d+)")),
            ("page_files", None, re.compile(
                r"pageFiles\.length === (\d+)")),
        ]),
        ("verify.js D-2 (dataset instances)", verify, [
            ("dataset_instances", None,
             re.compile(r"shellCountD === (\d+)")),
            ("route_documents", None,
             re.compile(r"routeDocsD\.length === (\d+)")),
        ]),
        ("build-routes.js D-2", routes, [
            ("dataset_instances", None,
             re.compile(r"d2Instances !== (\d+)")),
        ]),
        ("api-worker run-tests.mjs pins", runtests, [
            ("distributions", "/v1/index",
             re.compile(r"distribution\.length === (\d+)")),
            ("route_documents", "/v1/page-data",
             re.compile(r"j\.count === (\d+)")),
            ("route_documents", "/v1/page-data",
             re.compile(r"j\.pages\.length === (\d+)")),
        ]),
    ]


def check_pins(ctx, root, flat, expected):
    failing = []
    read_seats = 0
    for label, path, pats in _pin_seats(root, flat):
        if not os.path.exists(path):
            failing.append(f"{label}: seat file missing ({path})")
            continue
        lines = open(path, encoding="utf-8", errors="replace").read().splitlines()
        for metric, line_filter, pat in pats:
            exp = expected.get(metric)
            if exp is None:
                continue
            for i, line in enumerate(lines, 1):
                if line_filter is not None and line_filter not in line:
                    continue
                for m in pat.finditer(line):
                    read_seats += 1
                    got = int(m.group(1))
                    if got != exp:
                        failing.append(
                            f"{os.path.relpath(path, root)}:{i} {label} — "
                            f"{metric} pin is {got}, expected {exp}")
    # data seats: pages.json count/list, services.json pageCount sum.
    pj = os.path.join(root, "data", "pages.json")
    if os.path.exists(pj) and expected.get("route_documents") is not None:
        doc = json.load(open(pj, encoding="utf-8"))
        exp = expected["route_documents"]
        if doc.get("count") != exp:
            failing.append(f"data/pages.json: count is {doc.get('count')}, "
                           f"expected {exp}")
        if len(doc.get("pages", [])) != exp:
            failing.append(f"data/pages.json: pages list is "
                           f"{len(doc.get('pages', []))}, expected {exp}")
        read_seats += 2
    sj = os.path.join(root, "data", "services.json")
    if os.path.exists(sj) and expected.get("services_pagecount_sum") is not None:
        doc = json.load(open(sj, encoding="utf-8"))
        total = sum(s.get("pageCount", 0) for s in doc.get("services", []))
        exp = expected["services_pagecount_sum"]
        if total != exp:
            failing.append(f"data/services.json: pageCount sum is {total}, "
                           f"expected {exp}")
        read_seats += 1
    if failing:
        shown, total = cap(failing)
        return ("fail", f"{total} stale census pin(s) — re-express every "
                f"pin seat in one pass before sealing", shown)
    return ("pass", f"{read_seats} pin seat value(s) across verify.js, "
            f"build-routes.js, run-tests.mjs, pages.json, services.json "
            f"all carry the expected census", [])


# ------------------------------------------------------------------
# A1.2 — ledger dates on the batch's declared change set.
# ------------------------------------------------------------------

def _url_for_pub_rel(rel):
    rel = rel.replace(os.sep, "/")
    if os.path.basename(rel) == "index.html":
        d = os.path.dirname(rel)
        return SITE + "/" + (d + "/" if d else "")
    return SITE + "/" + rel


def check_dates_delta(ctx, root, pub, spec, batch_date):
    changed = (spec or {}).get("changed_files")
    if changed is None:
        return ("skip", "no batch spec (--spec) — the declared change "
                "set is unknown, so ledger dates cannot be swept "
                "against it", [])
    ledger = json.load(open(os.path.join(root, "data",
                                         "lastmod-ledger.json"),
                            encoding="utf-8"))
    urls = ledger.get("urls", {})
    failing = []
    checked = 0
    for rel in changed:
        p = os.path.join(pub, rel)
        if not os.path.exists(p):
            failing.append(f"{rel}: declared changed file not in PUB")
            continue
        url = _url_for_pub_rel(rel)
        entry = urls.get(url)
        checked += 1
        if entry is None:
            failing.append(f"{rel}: no lastmod-ledger entry for {url} — "
                           f"a changed file must carry the batch date "
                           f"({batch_date}) before the first seal")
        elif entry != batch_date:
            failing.append(f"{rel}: ledger entry is {entry}, expected "
                           f"the batch date {batch_date}")
    if failing:
        shown, total = cap(failing)
        return ("fail", f"{total} ledger-date violation(s) on the "
                f"declared change set", shown)
    return ("pass", f"all {checked} declared changed file(s) carry the "
            f"batch date {batch_date} in the lastmod ledger", [])


# ------------------------------------------------------------------
# A1.3 — graph embeds swept whole (every PUB JSON, recursive).
# Same pattern + superseded-fixity exemption as audit-preflight
# check 3, extended from the PUB root to the whole tree.
# ------------------------------------------------------------------

GRAPH_URLS = [SITE + "/entity-graph.json",
              SITE + "/best-json-entity-graph.json"]
EMBED_PAT = {u: re.compile(r'("contentUrl":\s*"' + re.escape(u) +
                           r'"[^}]*?"sha256":\s*")([0-9a-f]{64})(")')
             for u in GRAPH_URLS}
GRAPH_NAMES = {"entity-graph.json", "best-json-entity-graph.json",
               "ai-master-index.json"}


def check_graph_embeds_whole(ctx, pub, repo):
    stale = []
    scanned = 0
    targets = []
    for dirpath, _dirs, names in os.walk(pub):
        for n in names:
            if n.endswith(".json") and n not in GRAPH_NAMES:
                targets.append(os.path.join(dirpath, n))
    shell = os.path.join(repo, "index.html")
    if os.path.exists(shell):
        targets.append(shell)
    expected = {u: ctx.expected_digest(u, os.path.basename(u))
                for u in GRAPH_URLS}
    for path in targets:
        try:
            text = open(path, encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        scanned += 1
        for url in GRAPH_URLS:
            exp = expected[url]
            if exp is None:
                continue
            for m in EMBED_PAT[url].finditer(text):
                tail = text[m.end():text.find('}', m.end())]
                if '"currentSeal": "superseded"' in tail or \
                   '"fixityStatus": "superseded"' in tail:
                    continue
                if m.group(2) != exp:
                    stale.append(
                        f"{os.path.relpath(path, pub)}: embed of "
                        f"{os.path.basename(url)} is {m.group(2)[:8]}…, "
                        f"expected {exp[:8]}…")
    if stale:
        shown, total = cap(stale)
        return ("fail", f"{total} stale graph embed(s) in the whole-tree "
                f"sweep ({scanned} files scanned) — run "
                f"refresh-graph-embeds.py before sealing", shown)
    return ("pass", f"every graph embed in {scanned} scanned file(s) "
            f"(whole PUB tree + shell) matches the current graph digest",
            [])


# ------------------------------------------------------------------
# A1.4 — baked beacon / P-3 prediction.
# ------------------------------------------------------------------

def check_beacon(ctx, pub):
    docs = []
    for dirpath, _dirs, names in os.walk(pub):
        for n in names:
            if n == "index.html":
                docs.append(os.path.join(dirpath, n))
    carrying = 0
    missing = []
    for p in docs:
        try:
            text = open(p, encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        if "cloudflareinsights" in text and "beacon" in text:
            carrying += 1
        else:
            missing.append(os.path.relpath(p, pub))
    if docs and carrying == 0:
        return ("warn", "NO route document carries the baked Web "
                "Analytics beacon — Cloudflare edge injection will add "
                "+367 B to every HTML response and the alias verify's "
                "P-3 will fail structurally (Henry's 2026-11-20 ruling: "
                "the baked beacon stays)", missing[:MAX_LIST])
    if missing:
        shown, total = cap(missing)
        return ("warn", f"{total} of {len(docs)} route document(s) do "
                f"not carry the baked beacon — those pages will read "
                f"+367 B on the alias from edge injection and fail P-3",
                shown)
    return ("pass", f"all {len(docs)} route documents carry the baked "
            f"Web Analytics beacon — no edge injection, P-3 clean", [])


# ------------------------------------------------------------------
# A1.5 — windowed builds (Component A, step A6): governed builders
# are proven, windowed, twin-identical, peak-bounded, and
# fingerprint-gated. The registry (scripts/windowed-builds.json)
# declares, per builder: seats, the code markers of each windowed
# action, the rig proof (builder + control sha256, byte-identical
# output hashes, measured peaks + bound, batch record), and the
# seal.py fingerprint-gate markers. The installed builder must be
# byte-identical to the build the proof covers — an edit without a
# fresh rig proof fails here, at batch step 0, not mid-seal.
# ------------------------------------------------------------------

def check_windowed_builds(root):
    reg_path = os.path.join(root, "scripts", "windowed-builds.json")
    if not os.path.exists(reg_path):
        return ("fail", "governed-builder registry missing "
                "(scripts/windowed-builds.json) — the A6 windowed-build "
                "step is not installed on this tree", [])
    reg = json.load(open(reg_path, encoding="utf-8"))
    builders = reg.get("builders", [])
    if not builders:
        return ("fail", "windowed-builds registry names no governed "
                "builders — the A6 step governs nothing", [])
    failing = []
    notes = []
    for b in builders:
        bid = b.get("id", "?")
        seats = b.get("seats", [])
        if len(seats) < 1:
            failing.append(f"{bid}: registry declares no seats")
            continue
        hashes = {}
        texts = {}
        for rel in seats:
            p = os.path.join(root, rel)
            if not os.path.exists(p):
                failing.append(f"{bid}: seat missing ({rel})")
                continue
            hashes[rel] = sha256_file(p)
            texts[rel] = open(p, encoding="utf-8",
                              errors="replace").read()
        if len(set(hashes.values())) > 1:
            hs = ", ".join(f"{r}={h[:8]}…"
                           for r, h in sorted(hashes.items()))
            failing.append(f"{bid}: seats diverge ({hs}) — a governed "
                           f"builder changes in every seat in the "
                           f"same pass (twin sweep)")
            continue
        if not hashes:
            continue
        installed = next(iter(hashes.values()))
        proof = b.get("proof", {})
        if proof.get("builder_sha256") != installed:
            failing.append(
                f"{bid}: installed builder sha256 {installed[:12]}… "
                f"!= the rig-proven build "
                f"{(proof.get('builder_sha256') or '?')[:12]}… — an "
                f"edit to a governed builder needs a fresh byte-"
                f"identical rig proof recorded in "
                f"scripts/windowed-builds.json before it may seal")
        for group, markers in sorted(b.get("markers", {}).items()):
            for m in markers:
                if not any(m in t for t in texts.values()):
                    failing.append(f"{bid}: windowed action "
                                   f"'{group}' marker missing from "
                                   f"the installed builder: {m!r}")
        if not proof.get("control_builder_sha256"):
            failing.append(f"{bid}: proof records no classic "
                           f"(un-windowed) control builder sha256")
        if not proof.get("outputs_byte_identical"):
            failing.append(f"{bid}: proof records no byte-identical "
                           f"output hashes")
        record = proof.get("record")
        if not record or not os.path.exists(os.path.join(root,
                                                          record)):
            failing.append(f"{bid}: proof record not found "
                           f"({record})")
        peak = b.get("peak_rss_gb", {})
        w, bound = peak.get("windowed_measured"), peak.get("bound")
        if w is None or bound is None:
            failing.append(f"{bid}: no recorded peak-RSS bound "
                           f"(peak_rss_gb.windowed_measured / bound)")
        elif w > bound:
            failing.append(f"{bid}: proven windowed peak {w} GB "
                           f"exceeds the recorded bound {bound} GB")
        fp = b.get("fingerprint_skip", {})
        seal_rel = fp.get("seal_file", "scripts/seal.py")
        seal_path = os.path.join(root, seal_rel)
        if not os.path.exists(seal_path):
            failing.append(f"{bid}: seal file missing ({seal_rel})")
        else:
            seal_text = open(seal_path, encoding="utf-8",
                             errors="replace").read()
            for m in fp.get("seal_markers", []):
                if m not in seal_text:
                    failing.append(f"{bid}: fingerprint skip unwired "
                                   f"— seal marker missing from "
                                   f"{seal_rel}: {m!r}")
        notes.append(f"{bid}: seats byte-identical at "
                     f"{installed[:8]}…, proof {proof.get('rig', '?')}, "
                     f"peak {w} GB ≤ bound {bound} GB")
    if failing:
        shown, total = cap(failing)
        return ("fail", f"{total} windowed-build violation(s) — a "
                f"governed builder is unproven, un-windowed, "
                f"diverged, unbounded, or ungated; fix at the step, "
                f"not mid-seal", shown)
    return ("pass", f"{len(builders)} governed builder(s) proven + "
            f"windowed + twin-identical + peak-bounded + "
            f"fingerprint-gated ({'; '.join(notes)})", [])


# ------------------------------------------------------------------
# A1.6 — discovery freshness: the discovery seats (the ai-catalog
# files in every seat, the DCAT catalog.json) and llms.txt's
# headline discovery figures must agree with the INSTALLED index
# (PUB/ai-master-index.json) + the on-disk surface files
# (PUB/service-area.geojson, repo-dir/src-index.js). Post-seal this
# holds by construction — the seal syncs llms.txt (seal.py's figure
# sync, extended by the AI-to-AI batch) and the batch installs the
# catalogs — so a RED here means a hand edit drifted a seat or a
# source fix was missed, caught at step 0 before a seal is spent.
# The llms.txt certificate-paragraph distribution figure is NOT
# gated here: the seal's existing figure sync + verify.js CV-3 own
# it, and it legitimately changes during a seal.
# ------------------------------------------------------------------

OPENAPI_URL = "https://api.theflatratemovers.com/openapi.json"
# The estate's declared discovery surface (AI-to-AI batch,
# 2026-11-23; DISCOVERY-AUDIT §4): the identifier suffixes every
# ai-catalog seat must carry. A new discovery surface is added
# here, in the same pass that adds its catalog entry — the same
# re-expression discipline as the A1.1 census pins.
REQUIRED_CATALOG_IDS = [
    "ai-sitemap", "service-area-geojson", "entity-graph",
    "best-json-entity-graph", "llms", "rest-api", "openapi-spec",
    "mcp-server", "signed-master-index", "index-signature",
    "signing-keys", "datasets-catalog", "dcat-catalog",
    "catalog-registry-dataset", "catalog-registry-api",
    "updates-feed", "article-feed", "coverage-dataset",
    "answer-evidence-dataset",
]


def _mcp_tool_names(repo):
    """The MCP tool names in the worker source's own order
    (repo-dir/src-index.js, the TOOLS array)."""
    src_path = os.path.join(repo, "src-index.js")
    text = open(src_path, encoding="utf-8", errors="replace").read()
    block = text[text.index("const TOOLS = ["):]
    block = block[:block.index("];")]
    return re.findall(r"name:\s*'([a-z_]+)'", block)


def check_discovery_freshness(root, pub, repo):
    failing = []

    def fail(msg):
        failing.append(msg)

    # Derived truth: the installed index + the surface files.
    index_path = os.path.join(pub, "ai-master-index.json")
    if not os.path.exists(index_path):
        return ("fail", "installed index missing "
                "(PUB/ai-master-index.json) — discovery truth cannot "
                "be derived", [f"ai-master-index.json: seat missing "
                                f"({index_path})"])
    index = json.load(open(index_path, encoding="utf-8"))
    dist = index.get("distribution", [])
    index_by_url = {e.get("contentUrl"): e for e in dist}
    ds_urls = {u for u in index_by_url
               if u and re.search(r"/datasets-[^/]+\.json$", u)}
    ds_count = len(ds_urls)
    geo_path = os.path.join(pub, "service-area.geojson")
    if not os.path.exists(geo_path):
        return ("fail", "service-area.geojson missing — discovery "
                "truth cannot be derived",
                [f"service-area.geojson: seat missing ({geo_path})"])
    geo_count = len(json.load(open(geo_path, encoding="utf-8"))
                    .get("features", []))
    try:
        tools = _mcp_tool_names(repo)
    except Exception as e:
        return ("fail", f"MCP tool list cannot be parsed from "
                f"repo-dir/src-index.js: {e!r}",
                [f"repo-dir/src-index.js: TOOLS parse failed ({e})"])
    if not tools:
        fail("repo-dir/src-index.js: TOOLS array parsed to zero "
             "tool names — the llms.txt tool gate has no truth")

    # (a) ai-catalog seats: present, parseable, the .well-known
    # pair byte-identical, the root seats' content equal to the
    # .well-known content, the required surface set present, and
    # every description-embedded geo / dataset-file count true.
    cat_seats = [
        ("PUB/.well-known/ai-catalog.json",
         os.path.join(pub, ".well-known", "ai-catalog.json")),
        ("PUB/.well-known/ard.json",
         os.path.join(pub, ".well-known", "ard.json")),
        ("PUB/ai-catalog.json", os.path.join(pub, "ai-catalog.json")),
        ("repo-dir/ai-catalog.json",
         os.path.join(repo, "ai-catalog.json")),
    ]
    docs = {}
    raws = {}
    for label, path in cat_seats:
        if not os.path.exists(path):
            fail(f"{label}: ai-catalog seat missing ({path})")
            continue
        raws[label] = open(path, "rb").read()
        try:
            docs[label] = json.loads(raws[label].decode("utf-8"))
        except Exception as e:
            fail(f"{label}: ai-catalog does not parse as JSON ({e})")
    wk_a, wk_b = ("PUB/.well-known/ai-catalog.json",
                  "PUB/.well-known/ard.json")
    if wk_a in raws and wk_b in raws and raws[wk_a] != raws[wk_b]:
        fail(f"{wk_b}: .well-known pair not byte-identical — "
             f"ard.json sha256 "
             f"{hashlib.sha256(raws[wk_b]).hexdigest()[:12]}… != "
             f"ai-catalog.json sha256 "
             f"{hashlib.sha256(raws[wk_a]).hexdigest()[:12]}…")
    wk_doc = docs.get(wk_a)
    if wk_doc is not None:
        for label in ("PUB/ai-catalog.json", "repo-dir/ai-catalog.json"):
            if label in docs and docs[label] != wk_doc:
                fail(f"{label}: root ai-catalog content differs from "
                     f"the .well-known ai-catalog content "
                     f"({len(docs[label].get('entries', []))} entries "
                     f"vs {len(wk_doc.get('entries', []))})")
    for label, doc in docs.items():
        ids = [(e.get("identifier") or "").rsplit(":", 1)[-1]
               for e in doc.get("entries", [])]
        missing = [s for s in REQUIRED_CATALOG_IDS if s not in ids]
        if missing:
            fail(f"{label}: ai-catalog is missing required discovery "
                 f"surface entr{'y' if len(missing) == 1 else 'ies'}: "
                 f"{', '.join(missing)} (catalog carries "
                 f"{len(ids)} entries, the declared surface has "
                 f"{len(REQUIRED_CATALOG_IDS)})")
        for e in doc.get("entries", []):
            desc = e.get("description") or ""
            eid = (e.get("identifier") or "?").rsplit(":", 1)[-1]
            for m in re.finditer(r"(\d[\d,]*) features\b", desc):
                got = int(m.group(1).replace(",", ""))
                if got != geo_count:
                    fail(f"{label}: entry {eid} description says "
                         f"{got} features, expected {geo_count} "
                         f"(service-area.geojson features[])")
            for m in re.finditer(r"(\d[\d,]*) dataset files\b", desc):
                got = int(m.group(1).replace(",", ""))
                if got != ds_count:
                    fail(f"{label}: entry {eid} description says "
                         f"{got} dataset files, expected {ds_count} "
                         f"(index datasets-*.json contentUrls)")
            for m in re.finditer(
                    r"per published dataset file \((\d[\d,]*)\)", desc):
                got = int(m.group(1).replace(",", ""))
                if got != ds_count:
                    fail(f"{label}: entry {eid} description says "
                         f"({got}) per published dataset file, "
                         f"expected ({ds_count})")

    # (b) catalog.json (DCAT): the dataset set is exactly the
    # index's datasets-*.json contentUrl set, and every entry's
    # SHA-256 + byte size equals the index entry's digest + size.
    for label, path in [("PUB/catalog.json",
                         os.path.join(pub, "catalog.json")),
                        ("repo-dir/catalog.json",
                         os.path.join(repo, "catalog.json"))]:
        if not os.path.exists(path):
            fail(f"{label}: catalog.json seat missing ({path}) — "
                 f"the DCAT catalog created by the AI-to-AI batch "
                 f"must exist in both seats")
            continue
        try:
            cat = json.load(open(path, encoding="utf-8"))
        except Exception as e:
            fail(f"{label}: catalog.json does not parse as JSON ({e})")
            continue
        entries = cat.get("dataset", [])
        urls = [e.get("identifier") for e in entries]
        if set(urls) != ds_urls:
            extra = sorted(set(urls) - ds_urls)
            absent = sorted(ds_urls - set(urls))
            fail(f"{label}: catalog dataset set != the index "
                 f"datasets-*.json set ({len(urls)} entries vs "
                 f"{ds_count} expected)"
                 + (f"; not in the index: {', '.join(extra[:5])}"
                    if extra else "")
                 + (f"; missing from the catalog: "
                    f"{', '.join(absent[:5])}" if absent else ""))
        if len(urls) != len(set(urls)):
            fail(f"{label}: catalog carries duplicate dataset "
                 f"identifiers ({len(urls)} entries, "
                 f"{len(set(urls))} distinct)")
        for e in entries:
            url = e.get("identifier")
            idx = index_by_url.get(url)
            if idx is None:
                continue
            d0 = (e.get("distribution") or [{}])[0]
            chk = ((d0.get("spdx:checksum") or {})
                   .get("spdx:checksumValue"))
            size = d0.get("dcat:byteSize")
            dig = idx.get("digest") or {}
            if chk != dig.get("value"):
                fail(f"{label}: entry {url.rsplit('/', 1)[-1]} "
                     f"sha256 is {str(chk)[:12]}…, expected "
                     f"{str(dig.get('value'))[:12]}… (index digest)")
            if size != dig.get("byteSize"):
                fail(f"{label}: entry {url.rsplit('/', 1)[-1]} "
                     f"byteSize is {size}, expected "
                     f"{dig.get('byteSize')} (index digest)")

    # (c) llms.txt, both seats: the API bullet's dataset-file
    # figure, the MCP tool list (every worker tool named), the
    # agent-catalog resource count, and the OpenAPI URL.
    cat_truth = len(REQUIRED_CATALOG_IDS)
    if wk_doc is not None:
        cat_truth = max(cat_truth, len(wk_doc.get("entries", [])))
    for label, path in [("PUB/llms.txt",
                         os.path.join(pub, "llms.txt")),
                        ("out/phase-a/llms.txt",
                         os.path.join(root, "out", "phase-a",
                                      "llms.txt"))]:
        if not os.path.exists(path):
            fail(f"{label}: llms.txt seat missing ({path})")
            continue
        text = open(path, encoding="utf-8", errors="replace").read()
        m = re.search(r"\[the (\d+) dataset files\]", text)
        if m is None:
            fail(f"{label}: llms.txt API bullet carries no "
                 f"'[the N dataset files]' label to gate")
        elif int(m.group(1)) != ds_count:
            fail(f"{label}: llms.txt API bullet says the "
                 f"{m.group(1)} dataset files, expected "
                 f"{ds_count} (index datasets-*.json contentUrls)")
        m = re.search(r"\(tools: ([^)]*)\)", text)
        if m is None:
            fail(f"{label}: llms.txt carries no MCP '(tools: …)' "
                 f"list to gate")
        else:
            listed = [t.strip() for t in m.group(1).split(",")]
            for t in tools:
                if t not in listed:
                    fail(f"{label}: llms.txt MCP tool list is "
                         f"missing {t} (worker TOOLS in "
                         f"repo-dir/src-index.js: "
                         f"{', '.join(tools)})")
        m = re.search(r"(\d+) real data resources", text)
        if m is None:
            fail(f"{label}: llms.txt agent-catalog line carries no "
                 f"'N real data resources' figure to gate")
        elif int(m.group(1)) != cat_truth:
            fail(f"{label}: llms.txt agent-catalog line says "
                 f"{m.group(1)} real data resources, expected "
                 f"{cat_truth} (ai-catalog entry count)")
        if OPENAPI_URL not in text:
            fail(f"{label}: llms.txt does not name the OpenAPI "
                 f"spec — {OPENAPI_URL} is absent")

    if failing:
        shown, total = cap(failing)
        return ("fail", f"{total} discovery-freshness violation(s) "
                f"— a discovery seat or llms.txt headline figure "
                f"disagrees with the installed index + surface "
                f"files; fix at the source seat (the seal syncs "
                f"llms.txt; the batch installs the catalogs), "
                f"never by hand-waving the gate", shown)
    return ("pass", f"discovery seats + llms.txt agree with the "
            f"installed index + surfaces ({ds_count} dataset "
            f"files, {geo_count} geo features, {len(tools)} MCP "
            f"tools, {cat_truth} catalog entries, OpenAPI named)",
            [])
# ------------------------------------------------------------------

# ------------------------------------------------------------------
# A1.7 — splice-seat freshness: the seats no generator rebuilds
# (llms.txt, ai-sitemap.json, the intent landing body, and every
# shell div's duplicate-@id dates) must already carry the current
# census before the first seal. Mirrors verify.js's staged llms /
# ai-sitemap checks, PS-4, CV-5 and S-7e against the PRE-SEAL
# source seats (phase-a + PUB discovery files, the shell divs), so
# a batch that adds a page or moves a total fails here — while a
# splice still costs minutes — instead of at publish, after the
# seal. (Ranking-fix batch, 2026-11-24: the +1 page / +2 rows
# delta missed exactly these seats and cost a full re-seal cycle
# plus a failed publish; this class is gated here permanently.)
# ------------------------------------------------------------------

def check_splice_seats(ctx, root, pub, repo):
    failing = []
    pages = json.load(open(os.path.join(root, "data", "pages.json"),
                           encoding="utf-8"))["pages"]
    page_urls = [p["url"] for p in pages]
    n_pages = len(pages)
    # 1. ai-sitemap seats (PUB + phase-a staging)
    for seat in [os.path.join(pub, "ai-sitemap.json"),
                 os.path.join(root, "out", "phase-a",
                              "ai-sitemap.json")]:
        rel = os.path.relpath(seat, root)
        try:
            ai = json.load(open(seat, encoding="utf-8"))
        except Exception as e:
            failing.append(f"{rel}: unreadable ({e})")
            continue
        arr = ai.get("pages") or []
        if len(arr) != n_pages:
            failing.append(f"{rel}: ai-sitemap pages {len(arr)} "
                           f"!= pages.json {n_pages}")
        have = {p.get("url") for p in arr if isinstance(p, dict)}
        for u in page_urls:
            if u not in have:
                failing.append(f"{rel}: ai-sitemap missing page {u}")
        m = re.search(r"(\d+) clean canonical URLs",
                      ai.get("description", ""))
        if m and int(m.group(1)) != n_pages:
            failing.append(f"{rel}: ai-sitemap description states "
                           f"{m.group(1)} clean canonical URLs, "
                           f"expected {n_pages}")
    # 2. llms.txt seats (PUB + phase-a staging)
    for seat in [os.path.join(pub, "llms.txt"),
                 os.path.join(root, "out", "phase-a", "llms.txt")]:
        rel = os.path.relpath(seat, root)
        try:
            txt = open(seat, encoding="utf-8").read()
        except Exception as e:
            failing.append(f"{rel}: unreadable ({e})")
            continue
        m = re.search(r"(\d+) clean canonical URLs", txt)
        if not m:
            failing.append(f"{rel}: llms.txt states no clean "
                           f"canonical URL total")
        elif int(m.group(1)) != n_pages:
            failing.append(f"{rel}: llms.txt states {m.group(1)} "
                           f"clean canonical URLs, expected "
                           f"{n_pages}")
        for u in page_urls:
            if u not in txt:
                failing.append(f"{rel}: llms.txt does not "
                               f"represent {u}")
    # 3 + 4 read the shell once
    shell = open(os.path.join(repo, "index.html"),
                 encoding="utf-8").read()
    # 3. intent landing body figures vs the dataset file totals
    intent = json.load(open(os.path.join(
        pub, "datasets-intent-coverage.json"), encoding="utf-8"))
    graph = intent.get("@graph") or []
    totals = next((n for n in graph if (n.get("@id") or "")
                   .endswith("#dataset-intent-coverage-totals")),
                  None)
    if totals is None:
        failing.append("datasets-intent-coverage.json: no totals "
                       "node")
    else:
        i0 = shell.find('id="page-datasets-intent-coverage"')
        i1 = shell.find('id="page-', i0 + 10) if i0 >= 0 else -1
        seg = shell[i0:i1] if i0 >= 0 else ""
        if not seg:
            failing.append("shell: page-datasets-intent-coverage "
                           "div not found")
        else:
            want = {
                "Rubric rows":
                    totals["rowSources"]["estateGenerated"],
                "Services covered": len([n for n in graph
                    if (n.get("name") or "").startswith(
                        "Intent Coverage —")]),
                "Registry pages":
                    totals["pageCoverage"]["pagesTotal"],
                "Pages targeted":
                    totals["pageCoverage"]["pagesTargeted"],
                "Nodes in this file": len(graph),
            }
            for label, v in want.items():
                m = re.search(r"<b>" + re.escape(label) +
                              r"</b></td><td>([\d,]+)</td>", seg)
                got = int(m.group(1).replace(",", "")) if m else None
                if got != v:
                    failing.append(f"intent landing body: {label} "
                                   f"{got} != dataset file {v}")
            m = re.search(r"(\d[\d,]*) generated rows", seg)
            got = int(m.group(1).replace(",", "")) if m else None
            if got != want["Rubric rows"]:
                failing.append(f"intent landing hero: {got} "
                               f"generated rows != dataset file "
                               f"{want['Rubric rows']}")
    # 4. dataset landing embeds: where a shell div's embed carries
    #    the dataset file's MAIN Dataset node, its dates must equal
    #    the file's — the route doc also embeds the file's node, so
    #    a stale embed date is exactly verify.js's S-7e divergence,
    #    caught here at the source seat. (Sub-node embeds are dated
    #    snapshots by design and are not gated.)
    for divm in re.finditer(r'id="page-datasets-([a-z0-9-]+)"',
                            shell):
        slug = divm.group(1)
        fpath = os.path.join(pub, f"datasets-{slug}.json")
        if not os.path.exists(fpath):
            continue
        fdoc = json.load(open(fpath, encoding="utf-8"))
        landing = SITE + f"/datasets/{slug}/"
        main_ids = {landing + "#dataset-" + slug,
                    landing + "#dataset"}
        fmain = {}
        stack = [fdoc]
        while stack:
            n = stack.pop()
            if isinstance(n, dict):
                if n.get("@id") in main_ids and \
                        n.get("@type") == "Dataset":
                    fmain[n["@id"]] = n
                stack.extend(n.values())
            elif isinstance(n, list):
                stack.extend(n)
        if not fmain:
            continue
        seg_end = shell.find('id="page-', divm.start() + 10)
        seg = shell[divm.start():seg_end if seg_end > 0
                    else divm.start() + 500000]
        for lm in re.finditer(
                r'<script type="application/ld\+json">(.*?)</script>',
                seg, re.S):
            try:
                doc = json.loads(lm.group(1))
            except Exception:
                continue
            stack = [doc]
            while stack:
                n = stack.pop()
                if isinstance(n, dict):
                    fn = fmain.get(n.get("@id"))
                    if fn is not None and len(n) > 1:
                        for f in ("dateModified", "datePublished"):
                            if f in n and f in fn and \
                                    n[f] != fn[f]:
                                failing.append(
                                    f"shell embed {slug}: "
                                    f"{n['@id']} {f} {n[f]} != "
                                    f"dataset file {fn[f]} "
                                    f"(S-7e class)")
                    stack.extend(n.values())
                elif isinstance(n, list):
                    stack.extend(n)
    if failing:
        shown, total = cap(failing)
        return ("fail", f"{total} splice-seat staleness item(s) — "
                f"discovery files, the intent landing or shell div "
                f"dates lag the registries", shown)
    return ("pass", f"llms + ai-sitemap carry all {n_pages} "
            f"pages, intent landing figures equal the dataset "
            f"file, every landing embed's main-node dates equal "
            f"its dataset file", [])


def main():
    ap = argparse.ArgumentParser(
        description="A1 pre-seal prediction pass (Component A)")
    ap.add_argument("--root", default=None,
                    help="machine root of the target tree (default: "
                         "walk up from this script, then from cwd)")
    ap.add_argument("--batch", default="batch",
                    help="batch name for the report file")
    ap.add_argument("--batch-dir", default=None,
                    help="report folder (default: <root>/out/seal-work)")
    ap.add_argument("--delta", default=None,
                    help="expected-census JSON (flat audit-counts "
                         "metric keys)")
    ap.add_argument("--spec", default=None,
                    help="batch spec JSON (changed_files, "
                         "pin_expectations)")
    ap.add_argument("--batch-date", default=None,
                    help="batch date YYYY-MM-DD (default: today, "
                         "America/New_York)")
    args = ap.parse_args()

    root = args.root
    if root is None:
        for base in (os.path.dirname(os.path.abspath(__file__)),
                     os.getcwd()):
            cand = base
            for _ in range(4):
                if os.path.exists(os.path.join(cand, "paths.json")):
                    root = cand
                    break
                cand = os.path.dirname(cand)
            if root:
                break
    if root is None:
        raise SystemExit("predict: --root not given and no paths.json "
                         "found above the script or cwd")
    root = os.path.abspath(root)
    batch_dir = args.batch_dir or os.path.join(root, "out", "seal-work")
    batch_date = args.batch_date or \
        datetime.now(ZoneInfo("America/New_York")).strftime("%Y-%m-%d")
    delta = args.delta or os.path.join(batch_dir, "expected-delta.json")

    preflight = load_module("audit_preflight",
                            os.path.join(root, "scripts",
                                         "audit-preflight.py"))
    ctx = preflight.Ctx(batch_dir, delta, batch_date)
    pub = preflight.PUB
    repo = preflight.REPO
    flat = os.path.join(os.path.dirname(root), "theflatratemovers")

    expected = {}
    if os.path.exists(delta):
        expected.update(json.load(open(delta, encoding="utf-8")))
    spec = {}
    if args.spec and os.path.exists(args.spec):
        spec = json.load(open(args.spec, encoding="utf-8"))
        expected.update(spec.get("pin_expectations", {}))

    results = []
    red = []

    def run(cid, name, fn):
        try:
            status, detail, failing = fn()
        except Exception as e:
            status, detail, failing = "fail", f"check errored: {e!r}", \
                [f"{cid}: {e}"]
        results.append({"id": cid, "name": name, "status": status,
                        "detail": detail, "failing_files": failing})
        mark = {"pass": "OK  ", "fail": "RED ", "warn": "WARN",
                "skip": "SKIP"}[status]
        print(f"  [{mark}] {name} — {detail}", flush=True)
        if status == "fail":
            red.append(cid)

    print(f"prediction pass — batch {args.batch} — tree {root}")
    print("base layer (audit-preflight registry):")
    for cid, name, fn in preflight.REGISTRY:
        run(cid, name, lambda fn=fn: fn(ctx))
    print("A1 extension classes:")
    run("pins", "A1.1 Census pins swept whole",
        lambda: check_pins(ctx, root, flat, expected))
    run("dates-delta", "A1.2 Ledger dates on the declared change set",
        lambda: check_dates_delta(ctx, root, pub, spec, batch_date))
    run("graph-embeds-whole", "A1.3 Graph embeds swept whole",
        lambda: check_graph_embeds_whole(ctx, pub, repo))
    run("beacon-p3", "A1.4 Baked beacon / P-3 prediction",
        lambda: check_beacon(ctx, pub))
    run("windowed-builds",
        "A1.5 Windowed builds (A6) — governed builders proven + gated",
        lambda: check_windowed_builds(root))
    run("discovery-freshness",
        "A1.6 Discovery freshness — catalogs + llms.txt vs the "
        "installed index + surface files",
        lambda: check_discovery_freshness(root, pub, repo))
    run("splice-seats",
        "A1.7 Splice-seat freshness — llms/ai-sitemap census, "
        "intent landing figures, shell div duplicate-@id dates",
        lambda: check_splice_seats(ctx, root, pub, repo))

    report = {
        "tool": "predict.py (Machine Software Suite, Component A1)",
        "generated_at": datetime.now(
            ZoneInfo("America/New_York")).isoformat(),
        "batch": args.batch,
        "batch_date": batch_date,
        "tree_root": root,
        "tree_index_sha256": ctx.index_sha,
        "checks": results,
        "red": red,
        "verdict": "RED" if red else "GREEN",
    }
    os.makedirs(batch_dir, exist_ok=True)
    jp = os.path.join(batch_dir, f"prediction-{args.batch}.json")
    with open(jp, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=1)
        f.write("\n")
    lines = [f"PREDICTION PASS — batch {args.batch} — "
             f"{report['generated_at']} — verdict {report['verdict']}",
             f"Tree index: {ctx.index_sha[:8]}…  batch date: {batch_date}",
             ""]
    for r in results:
        lines.append(f"[{r['status'].upper():4}] {r['name']} — {r['detail']}")
        for ff in r["failing_files"]:
            lines.append(f"       - {ff}")
    tp = os.path.join(batch_dir, f"prediction-{args.batch}.txt")
    with open(tp, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"prediction verdict: {report['verdict']}"
          + (f" — red: {', '.join(red)}" if red else ""))
    print(f"report: {jp}")
    return 1 if red else 0


if __name__ == "__main__":
    sys.exit(main())
