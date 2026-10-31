# Batch record — Retrieval Machine Build B1: search-index dataset (2026-10-31)

Batch dir: `out/batch-search-index-2026-10-31/` (backup/, records/, work/).
Order: the Retrieval Machine mandate (owner, 2026-10-31) — build phase
B1 per Dossier 01 §5 (dataset design) + §7 (build sketch; B6 removed
by owner ruling, G1's solution is the evidence-asset version).
Standing deploy-after-check authorization; pipeline standard
(research → test → fix → deploy → verify live).

## What shipped

`datasets-search-index.json` — the standing dataset of the search-index
element, generated from the live estate by the new sealed generator
`scripts/build-search-index.js` (registry-driven via paths.json; no
compiled-in batch paths). 14 nodes in the D1–D8 frame (operations
Service with the certificate block, scope / taxonomy / clusters /
supply / standing / windows / competitors / third-party / gaps /
totals Datasets, method + sources Articles, boundaries Service):

- **query_cluster: 2,122 clusters** grouping all **2,794** rubric rows
  by (service, intent class, geo scope, target URL), plus 8
  observation-defined sampled money clusters (owner priority classes
  P1–P3; generated clusters carry "standard").
- **url_supply: 206 rows** (one per registry page): type, served
  title, schema @types, word count, internal inlinks + top anchor
  texts, lastmod, per-page JSON digest (SHA-256 of the public file —
  the value the seal records; SI-3 proves equality against the served
  index), indexation state with source + date.
- **standing_observation: 19** — 6 serp-sample + 2 places-sample
  (Dossier 01 live sampling, 2026-10-31) + 11 gsc-inspection verdicts
  (the 2026-10-31 indexing pass; 1 indexed, 9 not-indexed + requested,
  1 not-indexed with the request failed on Google's daily quota).
  Every row carries method + era + source; nothing invented, nothing
  zero-filled; unmeasured clusters carry no standing row.
- **engine_window: 15 queries** — the pre-rebuild Search Console
  window (2026-07-29 → 2026-10-28) attached to 98 rubric rows,
  era-tagged, metrics verbatim, never presented as current.
- **competitor_asset: 23** benchmark records of other companies'
  supply from the same sampling. Schema bar enforced in the
  generator (refuses claim fields) and re-proven by SI-4.
- **third_party_record: 17** records (Dossier 03 re-verified
  2026-10-31 + backlink wave-1 statuses).
- **gap_record: 9** (Dossier 01 G1–G8 + the stale legacy page), each
  with its designed solution and resolving batch.

## Two-pass seal (the estate's JOB1 pattern)

The rubric generator excludes rows whose per-page JSON is not yet in
the signed index, so the seal ran in two passes. Pass 1 added the 4
new distributions (dataset file, per-page JSON
dataset-search-index.json, route document /datasets/search-index/,
generator code) at 470 → 474 and sealed all pass-A changes;
PROVENANCE OK 474/474. The rubric then regenerated: **2,738 → 2,794
rows** (+56, exactly the new page's roll-up rows; ROLLUP_ALL gained
'datasets/search-index'), the intent dataset resealed in the same
motion, and its landing re-synced from the new file (hero, node
table, presentation sections, certificate SHA 25d43a9b…). Pass 2:
added 0, digest-changed 213 (all 206 route documents + head-data.js,
shell mirror, main.js, both dataset files, llms.txt, llms-full.txt);
three surgical fixes re-sealed inside the pass (verify.js SI site
constant ×1 digest, head-data slug ×1, head-data ld compaction ×1).
Final local index SHA-256 `9358ebe7…`; PROVENANCE OK 474/474.

## Surfaces moved in the same motion

Registry pages.json (206, new page after datasets/route81); source
shell (new landing div built from the dataset file — hero, node
table, evidence/clusters/supply/window/benchmark/ledger/gaps
sections, Facts & download, CTA, certificate card, exact-bytes
embed — plus datasets hub row + count 33, sitemap-page totals
349 URLs + row, pageMeta + pages array); route-assets/main.js
mirrored; head-data.js (new entry + intent counts); datasets.json
hasPart 33; ai-sitemap.json + phase-a copy (hasPart 206, counts);
sitemap.xml rebuilt (239 locs); llms.txt + phase-a copy (counts,
datasets list, new entry); llms-full.txt regenerated (474
distributions); the data txt gained the dated B1 entry (the data txt
is an ai-repo file, not a sealed distribution — pre-existing estate
state, unchanged); build-routes D-2 pin 304 → 314; routes generated
(206 documents, D-2 instances 314 asserted by the generator).
routes-manifest.json (build-routes metadata) was removed from the
public tree after generation — P-5's green history proves the tree
never carries it.

## Verify

Suite 110 → **114** (P-5/D-2 re-expressed exact-count stricter; new
§18 SI-1..SI-4; record `out/verify-fix-2026-10-31-search-index.md`).
Pre-deploy run: **106/114**, all 8 failures pure live-lag (served
index/sitemap/intent file still at the pre-batch seal). Failures
absorbed inside the loop before deploy: verdicts-file field mapping
(coverage/detail, derived not assumed), per-page JSON resolution via
head-data jf, a pageMeta insertion comma, a head-data slug, the ld
compact-JSON form S-1 asserts, the SI site constant, the phase-a
staged llms sitemap line, and the routes-manifest tree hygiene.

## Deploy + live verification

Pages deploy `0a5c5c87` (217 files uploaded). Live:
`datasets-search-index.json` 200 + application/json, served SHA-256
`430edf2799ac…` == sealed digest; landing `/datasets/search-index/`
200 with its own title and CTA; served ai-master-index.json
SHA-256 == local sealed index (`9358ebe7…`); live sitemap 239 locs
with both new URLs. API cadence: refresh gate `signed-index digest
matches: 38/38 compared`; tests re-expressed to current counts
(33 datasets / 474 distributions) **34 passed, 0 failed**; worker
redeployed, Current Version ID `b28f1b0c-40de-47b0-be0d-4e7ba143406d`;
live `/v1/verify?file=datasets-search-index.json` → match:true
(live SHA == signed digest), `/v1/datasets` count 33,
`/v1/index` 474 distributions.

## Estate totals after B1

Pages **206** · dataset files **33** · signed distributions **474** ·
intent rows **2,794** · sitemap **239 locs** · verify suite **114**.

## Cadence note

The dataset regenerates in every batch that changes pages, rubric
rows or standing evidence (SI-2 makes staleness a suite failure).
The next Search Console pass replaces
`out/batch-intent-rubric/work/gsc-verdicts-latest.json` and B1's
dataset + the intent evidence ingest run in that batch's motion.
`/datasets/search-index/` joins the following pass's request queue;
the dataset file itself is never an indexing-request target.
