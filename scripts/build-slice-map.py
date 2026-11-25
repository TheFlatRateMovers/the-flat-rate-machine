#!/usr/bin/env python3
"""build-slice-map.py — Component A4: the production slice map,
GENERATED from the page registry + DB metadata (never hand-listed),
following the twin-gate section-39 completeness pattern.

Slice definitions (INSTALL-BRIEF section 2):
  answer-evidence  slice key = target page URL
                   owned: the page's rubric rows (intent_query rows
                   with that target_url), its jf file, its shell div
                   span. Shared: panel questions designating the page
                   + panel-present flag, cited dataset files' digests
                   (row-derived at driver runtime), llms-full probe
                   results, the driver code hash.
  search-index     slice key = target page URL
                   owned: the page's rubric rows.
  page-data        slice key = page slug
                   owned: the page's jf file + its pool row.
  coverage         slice key = service id
                   owned: the service's row set in intent_query +
                   intent_row_outcome (fingerprinted at driver
                   runtime by the A5 hex-dump aggregate, never
                   materialized here). Shared: the cited dataset
                   files' digests + the builder hash.

Inputs are registry/metadata reads ONLY: data/pages.json,
data/services.json, and aggregate queries over rubric.db
(intent_meta + GROUP BY counts). No table is materialized.

Roots resolve TREE-RELATIVELY (the sibling layout: <parent>/
the-flat-rate-machine, <parent>/the-flat-rate-movers-pages/public,
<parent>/theflatratemovers/rubric.db) — paths.json's absolute seats
are production's and are deliberately NOT read here, so a rig run
can never touch a production seat. Overrides: --pub, --db.

Checks (the A1.6 gate's item 6 consumes exactly these):
  partition — within each generator, no owned input is claimed by
              two slices (cross-generator sharing is by design: the
              AE and search-index slices of one page both own that
              page's rows, in different generators);
  coverage  — every registry page carries an AE slice, a
              search-index slice and a page-data slice; every
              registry service carries a coverage slice. No page
              without a slice = no uncovered change can exist by
              construction.

CLI: build-slice-map.py [--root DIR] [--pub DIR] [--db FILE]
     [--out FILE] [--quiet]
Exit 0 when the map builds clean (partition + coverage pass), 1 on
any violation. The map dict is also importable: build_slice_map().
"""
import argparse
import json
import os
import sqlite3
import sys

SITE = "https://theflatratemovers.com"


def jf_name(slug):
    """The estate's slug-derived per-page JSON filename
    (build-intent-rubric.js jsonFileFor). Five pages publish under
    earlier short names; those resolve at driver runtime via the
    file's own WebPage @id (resolveJsonFile) — the map records the
    derived name and flags the seats it cannot find on disk."""
    return slug.replace("/", "-") + ".json"


def _ro_db(db_path):
    uri = "file:" + db_path + "?mode=ro"
    return sqlite3.connect(uri, uri=True)


def build_slice_map(machine_root, pub_dir=None, db_path=None):
    root = os.path.abspath(machine_root)
    parent = os.path.dirname(root)
    pub = pub_dir or os.path.join(parent, "the-flat-rate-movers-pages",
                                  "public")
    db = db_path or os.path.join(parent, "theflatratemovers",
                                 "rubric.db")
    pages_doc = json.load(open(os.path.join(root, "data", "pages.json"),
                               encoding="utf-8"))
    services_doc = json.load(open(os.path.join(root, "data",
                                               "services.json"),
                                  encoding="utf-8"))
    pages = pages_doc.get("pages", [])
    services = services_doc.get("services", [])

    # DB metadata: aggregate reads only (counts), never row dumps.
    meta = {}
    rows_by_target = {}
    rows_by_service = {}
    if os.path.exists(db):
        con = _ro_db(db)
        try:
            for k, v in con.execute(
                    "SELECT key, value FROM intent_meta"):
                meta[k] = v
            for url, n in con.execute(
                    "SELECT target_url, COUNT(*) FROM intent_query "
                    "GROUP BY target_url"):
                rows_by_target[url] = n
            for sid, n in con.execute(
                    "SELECT service_id, COUNT(*) FROM intent_query "
                    "GROUP BY service_id"):
                rows_by_service[sid] = n
        finally:
            con.close()

    slices = []
    jf_unresolved = []
    for p in pages:
        url, slug = p.get("url"), p.get("slug")
        jf = jf_name(slug)
        if not os.path.exists(os.path.join(pub, jf)):
            jf_unresolved.append({"slug": slug, "derived_jf": jf})
        n = rows_by_target.get(url, 0)
        slices.append({
            "generator": "answer-evidence",
            "key": url,
            "owned": [f"intent_query:target_url={url}",
                      f"jf:{jf}",
                      f"shell-div:{slug}"],
            "shared": ["panel-observations:designated-questions",
                       "panel-present-flag",
                       "cited-dataset-digests (row-derived)",
                       "llms-full-probes",
                       "driver:build-answer-evidence-sliced.js"],
            "rows": n,
        })
        slices.append({
            "generator": "search-index",
            "key": url,
            "owned": [f"intent_query:target_url={url}"],
            "shared": ["driver:build-search-index-sliced.js"],
            "rows": n,
        })
        slices.append({
            "generator": "page-data",
            "key": slug,
            "owned": [f"jf:{jf}", f"pool-row:{slug}"],
            "shared": ["pool:datasets-page-data-pool.json",
                       "driver:build-page-data-sliced.js"],
        })
    for s in services:
        sid = s.get("id")
        slices.append({
            "generator": "coverage",
            "key": sid,
            "owned": [f"intent_query:service_id={sid}",
                      f"intent_row_outcome:service_id={sid}"],
            "shared": ["cited-dataset-digests (DATASETS registry in "
                       "build-intent-rubric.js)",
                       "builder:build-intent-rubric.js"],
            "rows": rows_by_service.get(sid, 0),
        })

    # Partition check: per generator, an owned input claimed twice
    # is a build error (a change could be rebuilt twice / skipped
    # ambiguously).
    partition_errors = []
    by_gen = {}
    for sl in slices:
        by_gen.setdefault(sl["generator"], []).append(sl)
    for gen, gen_slices in sorted(by_gen.items()):
        claimed = {}
        for sl in gen_slices:
            for inp in sl["owned"]:
                if inp in claimed:
                    partition_errors.append(
                        f"{gen}: owned input claimed twice: {inp} "
                        f"(slices {claimed[inp]!r} and {sl['key']!r})")
                claimed.setdefault(inp, sl["key"])

    # Coverage check: every registry page / service carries a slice.
    coverage_errors = []
    page_urls = [p.get("url") for p in pages]
    page_slugs = [p.get("slug") for p in pages]
    svc_ids = [s.get("id") for s in services]
    keys = {(sl["generator"], sl["key"]) for sl in slices}
    for u in page_urls:
        if ("answer-evidence", u) not in keys:
            coverage_errors.append(f"page without an AE slice: {u}")
        if ("search-index", u) not in keys:
            coverage_errors.append(
                f"page without a search-index slice: {u}")
    for s in page_slugs:
        if ("page-data", s) not in keys:
            coverage_errors.append(f"page without a page-data slice: {s}")
    for sid in svc_ids:
        if ("coverage", sid) not in keys:
            coverage_errors.append(f"service without a coverage slice: "
                                   f"{sid}")
    if len(page_urls) != len(set(page_urls)):
        coverage_errors.append("pages.json carries duplicate page URLs")
    if len(page_slugs) != len(set(page_slugs)):
        coverage_errors.append("pages.json carries duplicate page slugs")
    if len(svc_ids) != len(set(svc_ids)):
        coverage_errors.append("services.json carries duplicate "
                               "service ids")

    counts = {g: len(v) for g, v in sorted(by_gen.items())}
    return {
        "tool": "build-slice-map.py (Machine Software Suite, "
                "Component A4)",
        "machine_root": root,
        "pub_dir": pub,
        "db_path": db,
        "registry": {"pages": len(pages), "services": len(services)},
        "db_meta": {"row_count": meta.get("row_count"),
                    "rows_digest": meta.get("rows_digest"),
                    "targets_with_rows": len(rows_by_target),
                    "services_with_rows": len(rows_by_service)},
        "counts": counts,
        "jf_unresolved": jf_unresolved,
        "partition_errors": partition_errors,
        "coverage_errors": coverage_errors,
        "slices": slices,
    }


def main():
    ap = argparse.ArgumentParser(
        description="A4 production slice map (generated, never "
                    "hand-listed)")
    ap.add_argument("--root", default=None,
                    help="machine root (default: parent of this "
                         "script's scripts/ dir)")
    ap.add_argument("--pub", default=None, help="public dir override")
    ap.add_argument("--db", default=None, help="rubric.db override")
    ap.add_argument("--out", default=None,
                    help="write the full map JSON here")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()
    root = args.root or os.path.dirname(os.path.dirname(
        os.path.abspath(__file__)))
    m = build_slice_map(root, args.pub, args.db)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(m, f, indent=1)
            f.write("\n")
    if not args.quiet:
        print(f"slice map: registry {m['registry']['pages']} pages, "
              f"{m['registry']['services']} services; db row_count "
              f"{m['db_meta']['row_count']}")
        for g, n in m["counts"].items():
            print(f"  {g}: {n} slices")
        print(f"  jf seats unresolved by derived name: "
              f"{len(m['jf_unresolved'])} (short-name seats resolve "
              f"at driver runtime via WebPage @id)")
        print(f"  partition errors: {len(m['partition_errors'])}; "
              f"coverage errors: {len(m['coverage_errors'])}")
    for e in m["partition_errors"] + m["coverage_errors"]:
        print(f"  VIOLATION: {e}")
    ok = not m["partition_errors"] and not m["coverage_errors"]
    print("slice map: " + ("OK" if ok else "FAILED"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
