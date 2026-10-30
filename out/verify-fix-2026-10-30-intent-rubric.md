# verify.js change record — Batch Intent Rubric (2026-10-30)

Same-motion check changes for the batch that ships the generative
intent-coverage rubric (Henry's order 2026-10-30: a live,
certificate-sealed, database-style rubric mapping the query strings
customers and AI assistants use to the page, per-page JSON, dataset and
graph node that answer each one). Per the stale-check rule, checks
were EXTENDED stricter in the same motion as the state they assert;
nothing was waived or weakened.

## P-5 extended (exact-count, as before)

- Totals move 209 -> **210 distributions** (37 data + 162 per-page
  JSONs + 11 shell/code): the new datasets-intent-coverage.json joins
  the data set as a sealed distribution. Page-file count stays 162
  (the dataset is not a per-page JSON).
- The comment chain in P-5 records this batch alongside the P2,
  junk-removal, blog-foundation, pilots and N1N2 extensions.

## New section 13 — intent-coverage rubric (I-1..I-5), suite 83 -> 88

- **I-1** The generator re-run is byte-identical to the database:
  `scripts/build-intent-rubric.js --check` regenerates all rows from
  the registries + the deployed signed index and compares the
  canonical row serialization (and its SHA-256 digest) against
  rubric.db `intent_query` / `intent_meta`.
- **I-2** Every `intent_query.target_url` is a pages.json URL and all
  three per-row coverage gates (page in registry, target in signed
  index, datasets in signed index) are 1.
- **I-3** Every row's target JSON and every backing dataset file is a
  distribution in the SERVED signed index, and the rubric's own
  dataset file is a distribution there too.
- **I-4** The published datasets-intent-coverage.json agrees with the
  database: totals-node row digest == `intent_meta.rows_digest`,
  `row_count` == live row count, and all 24 per-service coverage
  nodes' `queryRows` equal the DB per-service counts.
- **I-5** The live dataset URL serves application/json (not the SPA
  fallback) whose totals node carries the database's row digest.

Expected pre-deploy state: I-1, I-2 and I-4 pass locally; I-3, I-5 and
P-5 fail against the still-old live estate (209-entry served index, no
live dataset file) and are cured by the deploy + index-pair push; P-6
additionally waits on the machine-repo push carrying the new verify.js
bytes. Final gate = full suite green post-deploy + post-push.
