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
