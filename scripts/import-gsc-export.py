#!/usr/bin/env python3
"""GSC Performance export importer for Intent Rubric v2 (STAGING tool).

ROLE (owner correction 2026-10-31): EVIDENCE-OVERLAY importer. The export
in hand describes the PRE-REBUILD website (window 2026-07-29 to
2026-10-28). Its metrics are historical evidence only: the v2 generator
attaches them, era-tagged 'pre-rebuild', solely to rubric rows whose
target page existed in the window and is still live at the same URL.
This importer creates NO rubric rows and NO outcome states.

Ingests the standard Google Search Console Performance download layout:
  Queries.csv          columns: Query (or Top queries), Clicks, Impressions, CTR, Position
  Pages.csv            columns: Page (or Top pages), Clicks, Impressions, CTR, Position
  optional combined    any CSV whose header carries BOTH a query column and a
                       page column (for example "Query pages.csv" produced by a
                       query+page dimension export): Query, Page, Clicks,
                       Impressions, CTR, Position
  optional metadata    metadata.csv / Filters.csv may carry the window; the
                       --window-start/--window-end flags are the fallback and
                       are recorded as window_source='import-parameter'.

The standard Queries.csv and Pages.csv are SEPARATE aggregates: the export
does not encode which page served which query. This importer therefore
never invents a query->page pair. linked_page_url is populated only from a
combined query+page file (link_method='gsc-export-pair'); otherwise it is
NULL with link_method='rubric-resolution-pending' and the v2 generator
resolves the target under the rubric's own inclusion gates.

CTR is stored as a ratio (12.34% -> 0.1234). The raw export files are
hashed into the batch record. Nothing here writes intent_query: the v2
generator owns row creation, enrichment and exclusions.
"""
import argparse, csv, hashlib, io, json, os, re, sqlite3, sys, zipfile
from datetime import datetime, timezone

SCHEMA = """
CREATE TABLE IF NOT EXISTS gsc_import_batches (
  id INTEGER PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_format TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  window_start TEXT,
  window_end TEXT,
  window_source TEXT,
  imported_at TEXT NOT NULL,
  files TEXT NOT NULL,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS gsc_observed_queries (
  id INTEGER PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES gsc_import_batches(id),
  query_text_raw TEXT NOT NULL,
  query_text_normalized TEXT NOT NULL,
  linked_page_url TEXT,
  link_method TEXT NOT NULL,
  link_evidence TEXT,
  clicks INTEGER NOT NULL,
  impressions INTEGER NOT NULL,
  ctr REAL NOT NULL,
  avg_position REAL NOT NULL,
  window_start TEXT,
  window_end TEXT,
  source TEXT NOT NULL DEFAULT 'gsc-observed',
  imported_at TEXT NOT NULL,
  resolution_status TEXT NOT NULL DEFAULT 'pending',
  resolution_reason TEXT,
  resolved_service_id TEXT,
  resolved_target_url TEXT,
  UNIQUE(batch_id, query_text_normalized, linked_page_url)
);
CREATE INDEX IF NOT EXISTS idx_gsc_obs_norm ON gsc_observed_queries(query_text_normalized);
CREATE TABLE IF NOT EXISTS gsc_observed_pages (
  id INTEGER PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES gsc_import_batches(id),
  page_url TEXT NOT NULL,
  clicks INTEGER NOT NULL,
  impressions INTEGER NOT NULL,
  ctr REAL NOT NULL,
  avg_position REAL NOT NULL,
  window_start TEXT,
  window_end TEXT,
  source TEXT NOT NULL DEFAULT 'gsc-observed',
  imported_at TEXT NOT NULL,
  UNIQUE(batch_id, page_url)
);
CREATE TABLE IF NOT EXISTS gsc_observation_links (
  observation_id INTEGER NOT NULL REFERENCES gsc_observed_queries(id),
  service_id TEXT NOT NULL,
  query_text TEXT NOT NULL,
  link_type TEXT NOT NULL CHECK(link_type IN ('enriched','new','excluded')),
  exclusion_reason TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY(observation_id, service_id, query_text, link_type)
);
CREATE TABLE IF NOT EXISTS gsc_import_exclusions (
  id INTEGER PRIMARY KEY,
  observation_id INTEGER REFERENCES gsc_observed_queries(id),
  stage TEXT NOT NULL,
  reason TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL
);
"""

def norm_query(q):
    return re.sub(r"\s+", " ", (q or "").strip().lower())

def parse_int(v):
    return int(float(str(v).replace(",", "").strip() or 0))

def parse_float(v):
    return float(str(v).replace(",", "").strip() or 0)

def parse_ctr(v):
    s = str(v).strip()
    if s.endswith("%"):
        return float(s[:-1].replace(",", "")) / 100.0
    f = float(s.replace(",", "") or 0)
    return f / 100.0 if f > 1.5 else f  # tolerate a bare percent number

def pick(row, *names):
    lower = {k.strip().lower(): v for k, v in row.items() if k}
    for n in names:
        if n.lower() in lower and str(lower[n.lower()]).strip() != "":
            return lower[n.lower()]
    return None

def read_members(source):
    """Return (members{name->text}, source_format, source_bytes_for_hash)."""
    if os.path.isdir(source):
        members = {}
        for root, _dirs, files in os.walk(source):
            for f in files:
                if f.lower().endswith((".csv", ".tsv")):
                    p = os.path.join(root, f)
                    with open(p, "rb") as fh:
                        members[f] = fh.read().decode("utf-8-sig")
        blob = b"".join(members[k].encode() for k in sorted(members))
        return members, "directory", blob
    with open(source, "rb") as fh:
        blob = fh.read()
    if zipfile.is_zipfile(source):
        members = {}
        with zipfile.ZipFile(source) as z:
            for info in z.infolist():
                if info.filename.lower().endswith((".csv", ".tsv")):
                    members[os.path.basename(info.filename)] = z.read(info).decode("utf-8-sig")
        return members, "zip", blob
    with open(source, encoding="utf-8-sig") as fh:
        return {os.path.basename(source): fh.read()}, "csv", blob

def rows_of(text):
    delim = "\t" if "\t" in text.splitlines()[0] else ","
    return list(csv.DictReader(io.StringIO(text), delimiter=delim))

def header_of(text):
    first = text.splitlines()[0].lower() if text.splitlines() else ""
    return first

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source", help="GSC export .zip, directory, or single CSV")
    ap.add_argument("--db", required=True, help="Target rubric DB (staging copy)")
    ap.add_argument("--window-start"); ap.add_argument("--window-end")
    ap.add_argument("--notes", default="")
    args = ap.parse_args()

    members, fmt, blob = read_members(args.source)
    if not members:
        sys.exit("no CSV members found in source")
    sha = hashlib.sha256(blob).hexdigest()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Window: explicit flags win; else try metadata/Filters members.
    ws = args.window_start; we = args.window_end
    wsrc = "import-parameter" if (ws or we) else None
    if not ws:
        for name, text in members.items():
            if "metadata" in name.lower() or "filter" in name.lower():
                m1 = re.search(r"(20\d\d-\d\d-\d\d)", text)
                dates = re.findall(r"(20\d\d-\d\d-\d\d)", text)
                if len(dates) >= 2:
                    ws, we, wsrc = dates[0], dates[1], name
                elif m1:
                    ws, wsrc = m1.group(1), name

    qname = next((n for n in members if n.lower().startswith("queries")), None)
    pname = next((n for n in members if n.lower().startswith("pages")), None)
    combined = []
    for n, text in members.items():
        h = header_of(text)
        if n not in (qname, pname) and ("quer" in h) and ("page" in h or "landing" in h):
            combined.append(n)
    if not qname and not combined:
        sys.exit("no Queries.csv (or combined query+page CSV) member found")

    con = sqlite3.connect(args.db)
    con.executescript(SCHEMA)
    cur = con.execute(
        "INSERT INTO gsc_import_batches(source_name,source_format,source_sha256,window_start,window_end,window_source,imported_at,files,notes) VALUES (?,?,?,?,?,?,?,?,?)",
        (os.path.basename(os.path.abspath(args.source)), fmt, sha, ws, we, wsrc, now,
         json.dumps(sorted(members)), args.notes))
    batch = cur.lastrowid

    nq = np_ = ncomb = 0
    def add_query(raw_q, page, method, evidence, row):
        nonlocal nq
        con.execute(
            """INSERT OR IGNORE INTO gsc_observed_queries
               (batch_id,query_text_raw,query_text_normalized,linked_page_url,link_method,link_evidence,
                clicks,impressions,ctr,avg_position,window_start,window_end,imported_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (batch, raw_q, norm_query(raw_q), page, method, evidence,
             parse_int(pick(row, "Clicks")), parse_int(pick(row, "Impressions")),
             parse_ctr(pick(row, "CTR")), parse_float(pick(row, "Position", "Average position")),
             ws, we, now))
        nq += 1

    if qname:
        for row in rows_of(members[qname]):
            q = pick(row, "Query", "Top queries", "Queries")
            if q:
                add_query(q, None, "rubric-resolution-pending",
                          "Queries.csv is a query-only aggregate; the standard export carries no query->page pair", row)
    for name in combined:
        for row in rows_of(members[name]):
            q = pick(row, "Query", "Top queries", "Queries")
            p = pick(row, "Page", "Top pages", "Landing page", "URL")
            if q and p:
                add_query(q, p, "gsc-export-pair", name, row); ncomb += 1
    if pname:
        for row in rows_of(members[pname]):
            p = pick(row, "Page", "Top pages", "Landing page", "URL")
            if p:
                con.execute(
                    """INSERT OR IGNORE INTO gsc_observed_pages
                       (batch_id,page_url,clicks,impressions,ctr,avg_position,window_start,window_end,imported_at)
                       VALUES (?,?,?,?,?,?,?,?,?)""",
                    (batch, p, parse_int(pick(row, "Clicks")), parse_int(pick(row, "Impressions")),
                     parse_ctr(pick(row, "CTR")), parse_float(pick(row, "Position", "Average position")), ws, we, now))
                np_ += 1
    con.commit()
    out = {"batch_id": batch, "source_format": fmt, "source_sha256": sha,
           "window": [ws, we], "window_source": wsrc,
           "query_rows_seen": nq, "combined_pair_rows": ncomb, "page_rows_seen": np_,
           "observed_queries_total": con.execute("SELECT COUNT(*) FROM gsc_observed_queries").fetchone()[0],
           "observed_pages_total": con.execute("SELECT COUNT(*) FROM gsc_observed_pages").fetchone()[0]}
    print(json.dumps(out, indent=2))

if __name__ == "__main__":
    main()
