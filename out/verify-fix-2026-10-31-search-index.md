# Verify re-expression — Retrieval Machine Build B1, search-index dataset (2026-10-31)

Batch: `out/batch-search-index-2026-10-31/` (record:
`out/batch-search-index-2026-10-31/records/BATCH-RECORD.md`). The batch
ships datasets-search-index.json (Retrieval Machine Dossier 01 §5)
with its landing page /datasets/search-index/, taking the registry
205 → 206 pages, dataset files 32 → 33, and signed distributions
470 → 474. Suite: 110 → 114 checks. No check was waived; every change
below is exact-count or stricter, made in the same motion as the
state it asserts.

## P-5 — counts extended (same assertion, new totals)

pageFiles 205 → 206, distributions 470 → 474, label updated.
`P2_CODE_URLS` gains the new sealed code distribution
`scripts/build-search-index.js` (the dataset's generator), so the
P-5/P-6 repo-served coverage now also proves the generator's bytes
against the seal after every push.

## D-2 — pins extended (same assertion, new totals)

Dataset instances across route documents 304 → 314 (the new landing
embeds its file's 10 Dataset nodes, the established exact-bytes embed
pattern) and route documents 205 → 206. The generator
`scripts/build-routes.js` carries the same 314 pin (updated in this
batch, its digest re-sealed).

## §18 — SI-1..SI-4 (new section, the dataset's own gates)

- **SI-1** the dataset parses and carries all seven design tables
  (query_cluster, url_supply, standing_observation, engine_window,
  competitor_asset, third_party_record, gap_record); its totals node
  reconciles with the live arrays, and the rubric-derived clusters'
  row references sum exactly to the rubric database's row count.
- **SI-2** every standing observation carries method + era + source
  (the design's admission gate), AND the dataset regenerates
  byte-identical from the live estate (`build-search-index.js
  --check`, fully registry-driven; the console verdicts input is the
  standing latest-verdicts file in the rubric work dir). Like I-1 for
  the intent dataset, this makes a stale search-index dataset a suite
  failure: any batch that changes pages, rubric rows or standing
  evidence regenerates and reseals this dataset in the same motion.
- **SI-3** url_supply reconciles 1:1 with the page registry (set
  equality, no duplicates), and every supply row's digest equals the
  SERVED signed index's digest for that page's per-page JSON — the
  dataset's digest semantics (SHA-256 of the per-page JSON as sealed)
  made a standing proof.
- **SI-4** every cluster's target URL is null (sampled absence) or a
  registry URL, and the competitor schema bar holds in the published
  file: no competitor_asset record carries a claim field (rating,
  aggregateRating, reviewCount, price, discount, endorsement, award,
  certification). The generator refuses to emit such a file; SI-4
  proves the refusal can never silently lapse.

Derived checks that moved with the data (no edits needed): §1/§2
(sitemap = registry ∪ dataset files), §10 phase-a staged copies,
S-1/S-4 (head-data count, sitemap lastmod reconciliation), D-1/D-3,
I-2/I-6/I-9 (page coverage follows the registry), L-2 (llms-full
distribution count follows the served index).
