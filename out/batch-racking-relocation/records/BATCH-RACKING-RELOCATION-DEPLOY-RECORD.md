# Batch record — Warehouse Racking Relocation deploy (takeover category #1)
Date: 2026-10-30. Staged package: out/batch-racking-relocation/ (page-div.html,
datasets-warehouse-racking-relocation.json, warehouse-racking-relocation.json,
rubric-inserts.json, propagation-manifest.md — 27 steps, gap-table.md).
Manifest followed with the deploy-brief REBASELINE (the manifest was written
against pre-intent-rubric totals).

## Live result
- NEW page https://theflatratemovers.com/warehouse-racking-relocation/ — 200,
  own title ("The Flat Rate Movers — Warehouse Racking Relocation — Winchester
  VA & Martinsburg WV", served with &amp;), racking div present in served shell.
- Per-page JSON + dataset: 200 + application/json (5 + 8 nodes).
- Route tests post-deploy: /warehouse-racking-relocation/ own page;
/moving-a-piano/, /blog/, /curbside-vs-inside-vs-white-glove-delivery/,
/junk-removal/ each serve their own titles.
- PROVENANCE OK over live bytes: 212/212 digests recompute, JWS verified
  (kid theflatratemovers-2026-10-29-1), canonical payload 91,472 B.
- verify.js post-deploy: 88/88 PASS ("VERIFY OK").
- Pages deployment: https://a5e105bd.the-flat-rate-movers.pages.dev
  (257 files, 12 uploaded + Functions bundle).

## Counts before -> after
- pages 162 -> 163 | sitemap locs 162 -> 163 | router 162==162 -> 163==163
- services 24 -> 25 | category dataset files 26 -> 27 (28 dataset files total at root incl. intent-coverage)
- signed distributions 210 -> 212 | STATIC_FILES 255 -> 257
- best graph (site) 93 -> 94 | site entity graph 34 -> 35 | machine best 90 -> 91 | machine entity 34 -> 35
- ai mirrors: entity-graph-full 34 -> 35 | best-json-entity-graph-full 93 -> 94
- rubric.db attestations 250 -> 263 (11 staged rows + 2 gate rows — see deviations)
- rubric.db canonical services 24 -> 25 (total service rows 33 -> 34), edges +1
- intent rubric rows 1,134 -> 1,155 (+21 racking rows, 0 excluded; rows digest
  38c84749... -> 16804152ad85230951b8313c005c073a2093c51f27dc6ef50cbe6cf996cbb128)
- intent dataset 32 -> 33 nodes (25 coverage nodes)
- quote-form segment md5 UNCHANGED: 4d8d49f05b22b129eac623a41370d9cb

## Materials enrichment (Henry's 2026-10-30 ruling, applied BEFORE insert)
Actual install materials named at the process steps that use them, framed as
purchased per project, in the page and the dataset: wedge anchors / anchor
bolts, beam safety clips and pins, leveling shims, wire decking and pallet
supports, row spacers, column protectors and end-of-aisle guards, load
plaques, bay-and-level labels, stretch wrap and pallet banding. Work record:
work/enrich.py (deterministic string edits over the staged files; semantic
diff = only those description edits). All hard flags held: no rack
engineering / seismic / permit-approval claims; install to manufacturer spec
+ ANSI MH16.1-2023 / MH16.3 / MH26.2 guidance against the customer's LARC
drawings and permits; damaged components never re-erected; market figures
labeled market context only; company price = flat rate quoted per job;
workforce CWT schedule untouched on its own service; equipment publishes as
varies by project (no equipment list).

## Seal (digest -> sign, same batch, two passes)
- Pass 1: added == exactly the 2 new distributions (page JSON + dataset);
  digest-only changes == exactly 9 (ai-sitemap.json, llms.txt, site
  entity-graph.json, site best-json-entity-graph.json, shell, _middleware.js,
  head-data.js, verify.js, gen-head-data.js); 0 removed, 0 gaps.
- Generator re-run (v1.1.0, racking config rows) -> intent dataset refreshed.
- Pass 2: ONLY datasets-intent-coverage.json's digest changed. Final 212.
- Key read ONLY from ~/workspace/theflatratemovers/keys/ by sign-index.py
  itself; pre-push private-key grep across all push trees = 0 hits.

## Gates
- verify.js pre-deploy: 81 pass / 7 fail — every failure live-state only
  (old live sitemap/index/intent dataset + P-6 vs the already-pushed code).
- Middleware unit suite: 24/24 (21 prior + page own-title, page-JSON and
  dataset passthrough for the new files).
- head-data regen: 163 entries, 0 problems, diff vs deployed = exactly the
  one added /warehouse-racking-relocation entry.
- node --check: both executable inline scripts OK; all 40 ld+json blocks
  parse except the pre-existing empty #page-jsonld placeholder (pre-batch).
- GitHub: 21/21 pushed files read back byte-identical at the new HEADs;
  gist ai-repo data/entity-graph.json blob SHA re-confirmed
  cda897e61319a0f52172ef1365402e4d7179cddf (never overwritten).

## GitHub HEADs
- machine: 779d02d1 -> d1559538 (code) -> f40d3569 (data) -> records chunk (this record)
- ai: bc59f014 -> 49656990 (surfaces) -> 0b7ad9db (data) -> c6a475d1 (index pair, last)

## Deviations / notes (all fixed forward, none waived)
(a) Rubric total is 263, not the brief's 261: verify.js S-6 + the rubric
    check require per-service crawlability + provenance gate rows for EVERY
    services.json entry, so the 2 gate rows were added alongside the staged
    11 (junk-removal inserts precedent — its package included them).
(b) pageMeta description's apostrophe (manufacturer's) escaped in the JS
    string at build time; syntax proven by evaluating pageMeta.
(c) Middleware test case-22 expectation corrected to the served &amp; title
    form (the live estate escapes & in titles; proven against a live page).
(d) work/slug-file-map.json rebuilt from the LIVE head-data.js (162 entries);
    the junk-era copy (157) was stale for the five blog/foundation pages.
(e) Developer-card seal statement re-based 209 -> 212 distributions,
    absorbing the intent batch's +1 which that sentence had lagged.
(f) verify.js §13 I-4 check NAME updated 24 -> 25 coverage nodes (the
    assertion was already dynamic); recorded in
    out/verify-fix-2026-10-30-racking-relocation.md.
(g) Generator (build-intent-rubric.js v1.1.0): hardcoded "24 services /
    162 pages" prose counts in the intent dataset made dynamic, so the
    regenerated dataset publishes true counts (25 / 163).
(h) Pre-existing observation (not this batch's change): the ai repo's
    best-json-entity-graph-full.json node 0 areaServed lags the Bristow
    addition carried by the site graph; the mirror was extended append-only
    per the junk precedent. Flagged for a future reconciliation.
(i) One push attempt (ai surfaces) was interrupted by a service restart;
    HEAD was verified unchanged (bc59f014) before the single re-issue,
    which landed as 49656990. No duplicate commit.

## Follow-ons (NOT in this batch, per brief)
- GBP: add "Warehouse Racking Relocation" as a product/service on both
  profiles (post-deploy corroboration wave).
- GSC: /warehouse-racking-relocation/ joins the indexing pass AFTER the
  booked 2026-10-31 pass.
