#!/usr/bin/env python3
"""pack-intent-parts.py — ship the rubric's intent rows as sealed
dataset part files for the estate API (Geo Batch, 2026-11-21).

Why this exists: the API bundle (api-worker/data/bundle-index.js)
used to embed the rubric's packed intent columns. At ~292k rows the
packed block alone was ~32 MB of the bundle; the geo pass takes the
rubric past ~500k rows and the packed block breaches the 60 MiB
bundle gate (refresh-bundle.py) and approaches Cloudflare's 63.9 MiB
worker cap. The columns now ship the way the answer-evidence
questions ship: as published dataset part files the worker fetches
at runtime through the datasetRemote fetch-through path (edge
cache), while the bundle carries only the row count + part names.

This packer is spawned by build-intent-rubric.js in the seal's build
phase, right after the rubric DB is written. It re-exports the rows
from the DB with refresh-bundle.py's exact export semantics
(per-row GSC evidence join incl. the normalized fallback, outcome
reshape, JSON-parsed fields), packs them with refresh-bundle's exact
dictionary encoding, and writes one schema.org Dataset document per
part into the Pages public tree:

  datasets-intent-rows.json    (part 1)
  datasets-intent-rows-2.json  (part 2)
  ...

Each part's Dataset node carries the packed columns on the node as
`intentColumns` {keyOrder, tables, columns} — global dictionary
tables (identical in every part) plus that part's column slice.
Estate machine vocabulary on a machine dataset file, by design (the
Schema.org validator gates served page markup, not dataset files).
Deterministic: the same DB produces byte-identical parts, so a
re-seal whose rows did not change leaves the parts untouched, and
the outcome-evidence ingest chain (which re-runs the generator
outside a seal) re-emits identical bytes for identical rows.

Stale parts from a larger earlier split are removed from the output
directory, so the published part set always matches the DB.
"""
import argparse
import json
import re
import sqlite3
import sys
from pathlib import Path

SITE = "https://theflatratemovers.com"
PART_ID = SITE + "/#dataset-intent-rows"
LANDING = SITE + "/datasets/intent-coverage/"
MAX_PART_BYTES = 19_500_000  # under the 25 MiB Pages per-file cap

# Dictionary-encoded fields, in refresh-bundle.py's DICT_FIELDS
# order. Every encoded field is TEXT (or a parsed JSON array/object)
# in the source rows — never a bare number — so the rehydration
# typeof guard in the worker/tests is unambiguous.
DICT_FIELDS = [
    "outcome",
    "cert_dataset_digests",
    "cert_target_json_sha256",
    "dataset_ids",
    "target_json",
    "target_url",
    "graph_node",
    "service_id",
    "area",
    "intent_class",
    "source",
    "generated_at",
    "generator_version",
]

ORG = {
    "@id": SITE + "/#organization",
    "@type": "Organization",
    "name": "The Flat Rate Movers",
    "foundingDate": "2010-06",
    "sameAs": [
        "https://www.instagram.com/theflatratemoversllc/",
        "https://www.threads.com/@theflatratemoversllc",
        "https://x.com/ratemovers",
        "https://www.youtube.com/@theflatratemovers",
        "https://github.com/TheFlatRateMovers",
        "https://medium.com/@ratemovers",
    ],
    "url": SITE + "/",
}

SPATIAL = [
    {"@type": "Place", "@id": SITE + "/#winchester",
     "name": "The Flat Rate Movers — Winchester",
     "geo": {"@type": "GeoCoordinates", "latitude": 39.18711576,
             "longitude": -78.1668352}},
    {"@type": "Place", "@id": SITE + "/#martinsburg",
     "name": "Flat Rate Movers Martinsburg WV",
     "geo": {"@type": "GeoCoordinates", "latitude": 39.48319665,
             "longitude": -77.94760443}},
]

CATALOG = {
    "@type": "DataCatalog",
    "@id": SITE + "/datasets/#collection",
    "name": "The Flat Rate Movers — AI Authority Estate Datasets",
    "url": SITE + "/datasets/",
}


def export_rows(db_path):
    """Byte-for-byte the refresh-bundle.py export: SELECT * FROM
    intent_query ORDER BY id, JSON-parse the three text fields,
    join GSC evidence (exact key, then normalized fallback) and the
    outcome reshape."""
    con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    evidence = {}
    try:
        for e in con.execute("SELECT * FROM intent_row_gsc_evidence"):
            evidence.setdefault((e["query_text"], e["service_id"]), []).append({
                "observation_id": e["observation_id"],
                "clicks": e["clicks"], "impressions": e["impressions"],
                "ctr": e["ctr"], "avg_position": e["avg_position"],
                "window_start": e["window_start"], "window_end": e["window_end"],
                "era": e["era"]})
    except sqlite3.OperationalError:
        evidence = {}
    outcomes = {}
    GATE_COLS = ("crawled", "indexed", "understood", "corroborated",
                 "cited_maintained")
    try:
        for o in con.execute("SELECT * FROM intent_row_outcome"):
            outcomes[(o["query_text"], o["service_id"])] = {
                "status": o["outcome_status"],
                "highest_gate_passed": o["highest_gate_passed"],
                "basis": o["outcome_basis"],
                "gates": {g: {"state": o[g + "_state"],
                              "checked_at": o[g + "_checked_at"],
                              "evidence_source": o[g + "_evidence_source"]}
                          for g in GATE_COLS}}
    except sqlite3.OperationalError:
        outcomes = {}

    def _norm(t):
        return re.sub(r"[^a-z0-9 ]", "", str(t).lower()).replace("  ", " ").strip()

    evidence_norm = {}
    for (qt, sid), evs in evidence.items():
        bucket = evidence_norm.setdefault((_norm(qt), sid), [])
        seen_ids = {e["observation_id"] for e in bucket}
        for e in evs:
            if e["observation_id"] not in seen_ids:
                bucket.append(e)
                seen_ids.add(e["observation_id"])
    rows = []
    for r in con.execute("SELECT * FROM intent_query ORDER BY id"):
        d = dict(r)
        for k in ("dataset_ids", "cert_dataset_digests", "observation_ids"):
            try:
                d[k] = json.loads(d[k])
            except (TypeError, json.JSONDecodeError):
                pass
        key = (d["query_text"], d["service_id"])
        d["gsc_evidence"] = evidence.get(key, []) or evidence_norm.get(
            (_norm(d["query_text"]), d["service_id"]), [])
        d["outcome"] = outcomes.get(key)
        rows.append(d)
    con.close()
    return rows


def dict_encode(rows, field):
    """refresh-bundle.py's _dict_encode, column-wise: returns
    (table, [cell indices]) preserving first-seen table order."""
    table, idx, cells = [], {}, []
    for r in rows:
        key = json.dumps(r[field], sort_keys=True)
        if key not in idx:
            idx[key] = len(table)
            table.append(r[field])
        cells.append(idx[key])
    return table, cells


def pack(rows):
    if not rows:
        raise SystemExit("pack-intent-parts: no rows in intent_query")
    key_order = list(rows[0].keys())
    key_set = set(key_order)
    for r in rows:
        if set(r.keys()) != key_set:
            raise SystemExit(
                "columnar packing requires uniform intent-row key sets; "
                f"row id {r.get('id')} differs")
    tables, columns = {}, {}
    for field in DICT_FIELDS:
        table, cells = dict_encode(rows, field)
        tables[field] = table
        columns[field] = cells
    for k in key_order:
        if k not in columns:
            columns[k] = [r[k] for r in rows]
    return key_order, tables, columns


def part_name(k):
    return "datasets-intent-rows.json" if k == 1 else f"datasets-intent-rows-{k}.json"


def build_doc(k, n_parts, total, lo, hi, key_order, tables, columns_slice,
              rubric_date):
    names = [part_name(i) for i in range(1, n_parts + 1)]
    node = {
        "@id": PART_ID,
        "@type": "Dataset",
        "name": f"Search Intent Rows (Part {k})",
        "description": (
            f"Every row of the buyer-intent rubric — {total} rows generated "
            "from the rubric database, never hand-kept — packed as "
            "dictionary-encoded columns for the estate API. This file "
            f"carries part {k} of {n_parts} of the column set: rows "
            f"{lo + 1}–{hi} of {total} in rubric order. The API worker "
            "fetches the parts through the dataset distribution path and "
            "materializes rows on demand; the bundle no longer embeds the "
            "columns. The same rows are published as questions in the "
            "answer-evidence dataset and totaled in the intent-coverage "
            "dataset. Companion files: " + ", ".join(names) + ". The "
            "packed columns ride on this node as intentColumns (keyOrder, "
            "tables, columns) — estate machine vocabulary on a machine "
            "dataset file, by design."
        ),
        "keywords": ["search intent", "buyer intent rubric", "intent rows",
                     "API distribution", "retrieval machine"],
        "about": [{"@id": SITE + "/#organization"}],
        "spatialCoverage": SPATIAL,
        "temporalCoverage": "2010/2026",
        "dateModified": rubric_date,
        "creator": ORG,
        "publisher": ORG,
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "distribution": [
            {"@type": "DataDownload",
             "contentUrl": SITE + "/" + part_name(k),
             "encodingFormat": "application/json"},
            {"@type": "DataDownload",
             "contentUrl": SITE + "/ai-master-index.json",
             "encodingFormat": "application/json"}
        ],
        "sameAs": LANDING,
        "url": LANDING,
        "identifier": LANDING,
        "isAccessibleForFree": True,
        "intentColumns": {
            "keyOrder": key_order,
            "tables": tables,
            "columns": columns_slice,
            "rowRange": [lo, hi],
        },
        "datePublished": "2026-11-21",
        "includedInDataCatalog": CATALOG,
    }
    return {"@context": "https://schema.org", "@graph": [node]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--rubric-date", default=None,
                    help="dateModified for the part nodes; defaults to the "
                         "intent_query generated_at value in the DB")
    ap.add_argument("--max-part-bytes", type=int, default=MAX_PART_BYTES)
    args = ap.parse_args()

    rows = export_rows(args.db)
    total = len(rows)
    rubric_date = args.rubric_date or rows[0]["generated_at"]
    key_order, tables, columns = pack(rows)

    # Per-row serialized cost estimate (cells only; the shared tables
    # and the document envelope are charged to every part in full).
    tables_json = json.dumps(tables, ensure_ascii=False,
                             separators=(",", ":"))
    overhead = len(tables_json.encode("utf-8")) + 8192
    costs = []
    for i in range(total):
        c = 16
        for k in key_order:
            c += len(json.dumps(columns[k][i], ensure_ascii=False,
                                separators=(",", ":")).encode("utf-8")) + 2
        costs.append(c)

    # Greedy split into parts under the byte budget.
    ranges, lo, acc = [], 0, overhead
    for i in range(total):
        if i > lo and acc + costs[i] > args.max_part_bytes:
            ranges.append((lo, i))
            lo, acc = i, overhead
        acc += costs[i]
    ranges.append((lo, total))
    n_parts = len(ranges)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for k, (a, b) in enumerate(ranges, start=1):
        slice_cols = {kk: columns[kk][a:b] for kk in key_order}
        doc = build_doc(k, n_parts, total, a, b, key_order, tables,
                        slice_cols, rubric_date)
        text = json.dumps(doc, ensure_ascii=False, separators=(",", ":"))
        data = text.encode("utf-8")
        if len(data) > 25 * 1024 * 1024:
            raise SystemExit(
                f"pack-intent-parts: part {k} is {len(data)} bytes — over "
                "the 25 MiB Pages per-file cap; lower --max-part-bytes")
        (out_dir / part_name(k)).write_bytes(data)
        written.append({"name": part_name(k), "rows": b - a,
                        "bytes": len(data)})
    # Remove stale parts from a larger earlier split.
    keep = {w["name"] for w in written}
    for f in out_dir.glob("datasets-intent-rows*.json"):
        if f.name not in keep:
            f.unlink()
    print(json.dumps({"total_rows": total, "parts": written}))


if __name__ == "__main__":
    main()
