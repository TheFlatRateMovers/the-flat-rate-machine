#!/usr/bin/env python3
"""Ingest outcome evidence into the intent rubric (Intent Rubric v2).

THE LIVING-CERTIFICATE INGEST PATH. The v2 generator never writes a
non-unknown outcome state; states change only when evidence is
recorded against them. This tool is that recorder. It appends to the
append-only evidence log (intent_outcome_evidence) and updates the
per-row outcome summaries (intent_row_outcome) under three evidence
kinds, then — in the same motion — republishes: it re-runs the
generator (the dataset file is rebuilt with the new outcome roll-ups),
re-seals the signed master index (digest + sign), and re-proves
provenance. The remaining estate steps (Pages deploy of the resealed
files, API bundle refresh + worker redeploy, GitHub pushes) are the
estate's standard batch motion; run them in the same sitting — the
exact commands are printed at the end of a chained run and recorded
in the batch record.

INPUT — one JSON verdict file per ingest:

  Indexing-pass verdicts (the GSC indexing pass's per-URL report,
  transcribed verbatim into this shape):
    {"kind": "indexing", "source": "gsc-indexing-pass",
     "observed_at": "2026-10-31",
     "verdicts": [{"url": "https://theflatratemovers.com/<page>/",
                   "coverage": "Submitted and indexed",
                   "crawled": true, "indexed": true,
                   "detail": "optional note"}]}
    Mapping: indexed true -> crawled=passed, indexed=passed;
    crawled true + indexed false -> crawled=passed, indexed=failed;
    crawled false -> crawled=failed. Without booleans, the coverage
    string decides: "Submitted and indexed" / "URL is on Google" ->
    both passed; "Crawled - currently not indexed" -> crawled passed,
    indexed failed; "Discovered - currently not indexed" and "URL is
    unknown to Google" are recorded as observations only (no gate
    state is claimed from them).

  Fresh GSC performance windows (after the export itself has been
  imported with scripts/import-gsc-export.py and the generator re-run):
    {"kind": "performance", "source": "gsc-performance-window",
     "observed_at": "2026-11-30",
     "window_start": "2026-10-31", "window_end": "2026-11-29",
     "pages": ["https://theflatratemovers.com/<page>/", ...]}
    A page present in a CURRENT-era window's Pages aggregate was
    served in results in that window: indexed=passed with the window
    as the evidence reference. No other gate is claimed from it.

  Backlink / citation audit results:
    {"kind": "citations", "source": "backlink-audit",
     "observed_at": "2026-11-15",
     "citations": [{"url": "https://theflatratemovers.com/<page>/",
                    "detail": "live listing at <source>"}]}
    Each cited page's rows gain corroborated=passed.

RULES (the honesty contract, enforced here):
  - Evidence is append-only: this tool only INSERTs into
    intent_outcome_evidence; it has no delete or rewrite path.
  - A gate state is never downgraded: 'passed' is terminal; a later
    'failed' never overwrites it. 'failed' may be superseded by a
    later 'passed' (the newer observation wins, both stay in the log).
  - Every non-unknown gate state carries checked_at (the evidence's
    observed_at) and evidence_source (the ingest's source label).
  - outcome_status is recomputed, never asserted: all five gates
    passed -> 'complete'; at least one passed -> 'partial'; at least
    one failed and none passed -> 'blocked'; a row whose only change
    is an observation graduates from 'awaiting-observation' to
    'unknown' (it has now been looked at; nothing is claimed).
  - highest_gate_passed is the longest passed prefix of the gate
    chain crawled -> indexed -> understood -> corroborated ->
    cited-maintained: a later gate never claims the chain past a
    gate that has not passed.
  - Verdict URLs that match no rubric row target are reported and
    write nothing.
  - Ingests are idempotent and checkpointed (reliability design D3):
    every evidence row carries a dedupe_key (SHA-256 over its
    identity fields) under a UNIQUE index, inserts are OR IGNORE,
    and each run is ledgered in intent_ingest_runs with two
    checkpoints (db_committed_at written in the same transaction as
    the evidence append; chain_completed_at after the chain proves
    provenance). Any invocation, after any failure at any point, is
    safely re-runnable end-to-end; a re-run after full success is a
    verified no-op.

PATHS (reliability design D1): this tool carries NO compiled-in path
defaults. Every estate path resolves through the loader below:
CLI flag > env override > the paths registry (paths.json at the repo
root, anchored on this file's location) > hard error. Env overrides:
INGEST_DB, INGEST_PUBLIC_DIR, INGEST_REPO_DIR, INGEST_TOOLS_DIR,
INGEST_VENV_PY, INGEST_RUBRIC_WORK_DIR.

USAGE:
  python3 scripts/ingest-outcome-evidence.py verdicts.json
      [--db <rubric.db>]        (default: registry rubric_db)
      [--no-chain]              DB writes only (testing / scratch DBs)
      [--repo-dir <dir>]        repo mirror for the seal (digest tool)
      [--public-dir <dir>]      deployed public tree
Chain (default): generator build -> copy dataset to public -> seal
(digest + sign, tools from the registry tools_dir) ->
verify-provenance. Then deploy + refresh + push per the runbook.
"""
import argparse, hashlib, json, os, sqlite3, subprocess, sys
from datetime import datetime, timezone

GATES = ["crawled", "indexed", "understood", "corroborated", "cited_maintained"]
GATE_LABEL = {"cited_maintained": "cited-maintained"}

# --- Paths registry loader (design D1). The repo root is the parent
# of this script's directory; the registry is the ONLY place estate
# paths live. There is deliberately no compiled-in fallback: a missing
# registry is a hard error here, in testing, never mid-chain.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _fatal(msg):
    print("FATAL: " + msg, file=sys.stderr)
    raise SystemExit(2)


def load_registry():
    reg_path = os.path.join(ROOT, "paths.json")
    if not os.path.isfile(reg_path):
        _fatal("paths registry missing: " + reg_path + " — this tool "
               "carries no compiled-in path fallback (design D1).")
    with open(reg_path, encoding="utf-8") as f:
        return json.load(f)


REGISTRY = load_registry()


def cfg(key, cli_value=None, env_name=None):
    """Resolve one estate path: CLI flag > env > registry > hard error."""
    if cli_value:
        return cli_value
    if env_name and os.environ.get(env_name):
        return os.environ[env_name]
    value = REGISTRY.get(key)
    if not value:
        _fatal(f"path {key!r} unresolved: no CLI flag, no env override, "
               "and no value in the paths registry.")
    return value


def dedupe_key(query_text, service_id, gate, state, evidence_source,
               evidence_ref, observed_at):
    """D3 row identity: lowercase hex SHA-256 of the UTF-8 string
    formed by joining with U+001F: query_text, service_id, gate,
    state, evidence_source, evidence_ref (empty when NULL),
    observed_at. detail is annotation, not identity; recorded_at is
    arrival time, not identity — both are excluded."""
    parts = [query_text, service_id, gate, state, evidence_source,
             evidence_ref if evidence_ref is not None else "", observed_at]
    return hashlib.sha256("\x1f".join(parts).encode("utf-8")).hexdigest()


def migrate(con):
    """D3 migration, itself idempotent: dedupe_key column + backfill,
    the unique index, and the run-ledger table. A duplicate key among
    existing rows aborts loudly as a finding. Returns
    {'backfilled': n}."""
    cols = [r[1] for r in con.execute("PRAGMA table_info(intent_outcome_evidence)")]
    if "dedupe_key" not in cols:
        con.execute("ALTER TABLE intent_outcome_evidence ADD COLUMN dedupe_key TEXT")
    pending = con.execute(
        "SELECT id, query_text, service_id, gate, state, evidence_source,"
        " evidence_ref, observed_at FROM intent_outcome_evidence"
        " WHERE dedupe_key IS NULL").fetchall()
    for r in pending:
        con.execute("UPDATE intent_outcome_evidence SET dedupe_key=? WHERE id=?",
                    (dedupe_key(r[1], r[2], r[3], r[4], r[5], r[6], r[7]), r[0]))
    dups = con.execute(
        "SELECT dedupe_key, COUNT(*) AS c FROM intent_outcome_evidence"
        " GROUP BY dedupe_key HAVING c > 1").fetchall()
    if dups:
        _fatal(f"{len(dups)} duplicate dedupe keys among existing evidence "
               "rows — a migration finding (the log itself is duplicated); "
               "not patching over it.")
    con.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_dedupe"
                " ON intent_outcome_evidence(dedupe_key)")
    con.execute("CREATE TABLE IF NOT EXISTS intent_ingest_runs ("
                "run_key TEXT PRIMARY KEY, verdicts_sha256 TEXT, source TEXT,"
                " observed_at TEXT, started_at TEXT, db_committed_at TEXT,"
                " chain_completed_at TEXT, stats_json TEXT)")
    return {"backfilled": len(pending)}


def norm_url(u):
    return str(u or "").replace("://www.", "://")


def recompute(cur):
    """cur: dict gate->state. Returns (highest_gate_passed, status)."""
    highest = "none"
    for g in GATES:
        if cur.get(g) == "passed":
            highest = GATE_LABEL.get(g, g)
        else:
            break
    states = [cur.get(g) for g in GATES]
    if all(s == "passed" for s in states):
        status = "complete"
    elif any(s == "passed" for s in states):
        status = "partial"
    elif any(s == "failed" for s in states):
        status = "blocked"
    else:
        status = None  # caller keeps prior / graduates awaiting->unknown
    return highest, status


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("verdicts", help="JSON verdict file (shape in the header)")
    ap.add_argument("--db", default=None)
    ap.add_argument("--no-chain", action="store_true")
    ap.add_argument("--repo-dir", default=None)
    ap.add_argument("--public-dir", default=None)
    args = ap.parse_args()

    db_path = cfg("rubric_db", args.db, "INGEST_DB")
    public_dir = cfg("public_dir", args.public_dir, "INGEST_PUBLIC_DIR")
    repo_dir = cfg("repo_dir", args.repo_dir, "INGEST_REPO_DIR")
    tools_dir = cfg("tools_dir", None, "INGEST_TOOLS_DIR")
    venv_py = cfg("venv_py", None, "INGEST_VENV_PY")
    work_dir = cfg("rubric_work_dir", None, "INGEST_RUBRIC_WORK_DIR")

    with open(args.verdicts, "rb") as f:
        raw_verdicts = f.read()
    run_key = hashlib.sha256(raw_verdicts).hexdigest()
    spec = json.loads(raw_verdicts.decode("utf-8"))
    kind = spec.get("kind") or spec.get("source", "")
    source = spec.get("source") or kind
    observed_at = spec.get("observed_at") or datetime.now(timezone.utc).date().isoformat()
    recorded_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    started_at = recorded_at
    src_label = f"{source} {observed_at}"

    # Normalize the three input shapes into (url, gate_updates, log_rows)
    # gate_updates: {gate: new_state}; log_rows: [(gate, state, ref, detail)]
    items = []
    if kind == "indexing" or "indexing" in source:
        for v in spec.get("verdicts", []):
            url = v["url"]
            cov = v.get("coverage") or ""
            updates, logs = {}, []
            crawled, indexed = v.get("crawled"), v.get("indexed")
            if indexed is True:
                updates = {"crawled": "passed", "indexed": "passed"}
            elif crawled is True and indexed is False:
                updates = {"crawled": "passed", "indexed": "failed"}
            elif crawled is False:
                updates = {"crawled": "failed"}
            elif "Submitted and indexed" in cov or "URL is on Google" in cov:
                updates = {"crawled": "passed", "indexed": "passed"}
            elif "Crawled - currently not indexed" in cov:
                updates = {"crawled": "passed", "indexed": "failed"}
            if updates:
                for g, st in updates.items():
                    logs.append((g, st, cov or None, v.get("detail")))
            else:
                logs.append(("indexed", "observed", cov or None,
                             v.get("detail") or "inspection verdict recorded; no gate state claimed"))
            items.append((url, updates, logs))
    elif kind == "performance" or "performance" in source:
        window = f"{spec.get('window_start')}/{spec.get('window_end')}"
        for url in spec.get("pages", []) or [v["url"] for v in spec.get("verdicts", [])]:
            items.append((url, {"indexed": "passed"},
                          [("indexed", "passed", "GSC performance window " + window,
                            "page present in the window's Pages aggregate (served in results)")]))
    elif kind == "citations" or "citation" in source or "backlink" in source:
        for c in spec.get("citations", []) or spec.get("verdicts", []):
            items.append((c["url"], {"corroborated": "passed"},
                          [("corroborated", "passed", None, c.get("detail"))]))
    else:
        print(f"FATAL: unrecognized verdict kind/source: kind={kind!r} source={source!r}")
        return 1

    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    tables = {r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    for t in ("intent_query", "intent_row_outcome", "intent_outcome_evidence"):
        if t not in tables:
            print(f"FATAL: {t} missing in {db_path} — run the v2 generator first.")
            return 1
    with con:
        mig = migrate(con)
    print(f"migration: dedupe_key backfilled on {mig['backfilled']} rows; "
          "unique index + run ledger armed.")

    rows_by_url = {}
    for r in con.execute("SELECT query_text, service_id, target_url FROM intent_query"):
        rows_by_url.setdefault(norm_url(r["target_url"]), []).append(r)

    stats = {"verdicts": len(items), "urls_matched": 0, "urls_unmatched": [],
             "rows_updated": 0, "evidence_appended": 0,
             "evidence_skipped_duplicates": 0, "gate_changes": 0}
    with con:
        for url, updates, logs in items:
            targets = rows_by_url.get(norm_url(url))
            if not targets:
                stats["urls_unmatched"].append(url)
                continue
            stats["urls_matched"] += 1
            for r in targets:
                key = (r["query_text"], r["service_id"])
                oc = con.execute("SELECT * FROM intent_row_outcome WHERE query_text=? AND service_id=?",
                                 key).fetchone()
                if oc is None:
                    continue
                cur = {g: oc[f"{g}_state"] for g in GATES}
                changed = {}
                for g, st in updates.items():
                    if cur[g] == "passed":
                        continue  # never downgrade a passed gate
                    if cur[g] != st:
                        changed[g] = st
                        cur[g] = st
                inserted_here = 0
                for (g, st, ref, detail) in logs:
                    cur_ins = con.execute(
                        "INSERT OR IGNORE INTO intent_outcome_evidence (query_text, service_id, gate, state,"
                        " evidence_source, evidence_ref, detail, observed_at, recorded_at, dedupe_key)"
                        " VALUES (?,?,?,?,?,?,?,?,?,?)",
                        (key[0], key[1], g, st, src_label, ref, detail, observed_at, recorded_at,
                         dedupe_key(key[0], key[1], g, st, src_label, ref, observed_at)))
                    if cur_ins.rowcount == 1:
                        stats["evidence_appended"] += 1
                        inserted_here += 1
                    else:
                        stats["evidence_skipped_duplicates"] += 1
                highest, status = recompute(cur)
                if status is None:
                    status = "unknown" if oc["outcome_status"] == "awaiting-observation" else oc["outcome_status"]
                basis = f"evidence ingested {recorded_at} from {src_label}"
                if changed or inserted_here:
                    sets = []
                    for g, st in changed.items():
                        sets.append(f"{g}_state='{st}', {g}_checked_at='{observed_at}',"
                                    f" {g}_evidence_source='{src_label}'")
                    sets.append(f"highest_gate_passed='{highest}'")
                    sets.append(f"outcome_status='{status}'")
                    sets.append(f"outcome_basis='{basis}'")
                    sets.append(f"updated_at='{observed_at}'")
                    con.execute(f"UPDATE intent_row_outcome SET {', '.join(sets)}"
                                " WHERE query_text=? AND service_id=?", key)
                    stats["rows_updated"] += 1
                    stats["gate_changes"] += len(changed)
        # Run ledger, checkpoint 1: written in the SAME transaction as
        # the evidence append (design D3). chain_completed_at is set
        # only after the republish chain proves provenance.
        con.execute(
            "INSERT INTO intent_ingest_runs (run_key, verdicts_sha256, source,"
            " observed_at, started_at, db_committed_at, stats_json)"
            " VALUES (?,?,?,?,?,?,?)"
            " ON CONFLICT(run_key) DO UPDATE SET"
            " db_committed_at=excluded.db_committed_at,"
            " stats_json=excluded.stats_json",
            (run_key, run_key, source, observed_at, started_at, recorded_at,
             json.dumps(stats)))
    print(json.dumps(stats, indent=2))
    if stats["urls_unmatched"]:
        print("UNMATCHED verdict URLs (nothing written for these):")
        for u in stats["urls_unmatched"]:
            print("  -", u)

    if args.no_chain:
        print("(--no-chain: DB writes only; no republish performed.)")
        return 0

    # --- Republish chain: regenerate dataset, reseal, prove. ---
    gen = subprocess.run(["node", os.path.join(ROOT, "scripts", "build-intent-rubric.js")],
                         cwd=ROOT, capture_output=True, text=True)
    print(gen.stdout[-800:])
    if gen.returncode != 0:
        print(gen.stderr[-1500:], file=sys.stderr)
        return 1
    work_ds = os.path.join(work_dir, "datasets-intent-coverage.json")
    pub_ds = os.path.join(public_dir, "datasets-intent-coverage.json")
    with open(work_ds, "rb") as f:
        data = f.read()
    with open(pub_ds, "wb") as f:
        f.write(data)
    print(f"dataset republished to public/ ({len(data)} bytes)")

    idx_path = os.path.join(public_dir, "ai-master-index.json")
    dig = os.path.join(public_dir, "..", "ai-master-index.digested.json")
    audit = os.path.join(public_dir, "..", "ai-master-index.audit.json")
    r = subprocess.run([venv_py, os.path.join(tools_dir, "digest-index.py"),
                        "--index", idx_path, "--public-dir", public_dir,
                        "--repo-dir", repo_dir, "--out", dig, "--audit", audit],
                       capture_output=True, text=True)
    print(r.stdout.strip()[-300:])
    if r.returncode != 0:
        print(r.stderr[-1500:], file=sys.stderr)
        return 1
    aud = json.load(open(audit, encoding="utf-8"))
    assert aud["gaps"] == [], ("seal gaps", aud["gaps"])
    jws_tmp = dig + ".jws"
    r = subprocess.run([venv_py, os.path.join(tools_dir, "sign-index.py"),
                        "--index", dig, "--out", jws_tmp], capture_output=True, text=True)
    print(r.stdout.strip()[-200:])
    if r.returncode != 0:
        print(r.stderr[-1500:], file=sys.stderr)
        return 1
    with open(dig, "rb") as f:
        sealed = f.read()
    with open(idx_path, "wb") as f:
        f.write(sealed)
    with open(jws_tmp, "rb") as f:
        sig = f.read()
    with open(os.path.join(public_dir, "ai-master-index.jws"), "wb") as f:
        f.write(sig)
    r = subprocess.run([venv_py, os.path.join(tools_dir, "verify-provenance.py"),
                        "--jwks", os.path.join(public_dir, ".well-known", "signing-keys.json"),
                        "--index", idx_path,
                        "--jws", os.path.join(public_dir, "ai-master-index.jws"),
                        "--public-dir", public_dir, "--repo-dir", repo_dir],
                       capture_output=True, text=True)
    print(r.stdout.strip()[-400:])
    if r.returncode != 0:
        print(r.stderr[-1500:], file=sys.stderr)
        return 1
    # Run ledger, checkpoint 2: the chain completed and proved
    # provenance, so the run is fully republished.
    done_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    con2 = sqlite3.connect(db_path)
    with con2:
        con2.execute("UPDATE intent_ingest_runs SET chain_completed_at=?"
                     " WHERE run_key=?", (done_at, run_key))
    con2.close()
    print(f"run ledger: chain_completed_at set for run {run_key[:12]}…")
    print("CHAIN COMPLETE: evidence ingested, dataset regenerated, index resealed, provenance proven.")
    print("REMAINING (same motion, estate batch discipline):")
    print("  1. Deploy Pages from the registered pages_dir (wrangler pages deploy public).")
    print("  2. Refresh the API from the registered api_worker_dir (refresh-bundle, tests, wrangler deploy).")
    print("  3. Push GitHub: one push per repo (ai: dataset + index + jws; machine: batch record).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
