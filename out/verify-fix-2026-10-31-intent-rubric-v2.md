# Verify fix record — Intent Rubric v2 (2026-10-31)

Batch: Intent Rubric v2 Live. Batch record:
`out/batch-intent-rubric-v2-live/records/BATCH-RECORD.md`. This file
records the verify.js changes made in the same motion, per the
standing rule (rewrite a check stricter with a dated record; never
waive a gate).

## §13 gains I-6..I-9 (new block §13b), applying the staged patch

The staged patch (`rubric-v2-staging/verify-section-13-v2.patch.md`)
was applied as checks I-6..I-9 in a new §13b block. All four fail
closed: a missing v2 table, meta key, or dataset field is a FAIL.

Vocabulary reconciliation (the one deliberate adaptation): the
patch's draft gate-state words were `{unknown, observed, verified,
blocked}`; the generator as built (and approved in the staged
results) uses gate states `{unknown, passed, failed, not-applicable}`
— a gate passes only on recorded evidence, so the patch's "observed /
verified" both map to the system's single state `passed`, and
"blocked" exists only at the row level (`outcome_status`), whose
vocabulary `{unknown, awaiting-observation, partial, blocked,
complete}` matches the patch exactly. The checks are written against
the system's vocabulary; the semantics are the patch's:

- **I-6** — generator_version 2.0.0 + schema_version 2; meta row
  count == live `intent_query` count == generation summary rows;
  page-derived rows == summary R13 count and > 0; roll-up rows ==
  summary R14 count; **target coverage == the full page registry
  (202/202) with zero uncovered pages** (the owner's full-coverage
  completion bar, made permanent); evidence era == pre-rebuild;
  evidence window == the newest `gsc_import_batches` window;
  attached-query count == `COUNT(DISTINCT observation_id)` over
  `intent_row_gsc_evidence`.
- **I-7** — every evidence row's era is `pre-rebuild`; its window and
  metrics equal its `gsc_observed_queries` source row exactly; rows
  carrying observations target only pages present in the window's
  Pages aggregate AND in the live registry; the
  `observation_ids` ↔ evidence-row link has no dangling side in
  either direction.
- **I-8** — `intent_row_outcome` is exactly 1:1 with `intent_query`
  (no orphans either way); every gate state is in the legal
  vocabulary; every non-unknown gate state carries `checked_at` +
  `evidence_source`; `complete` ⇒ all five gates passed; `partial` ⇒
  at least one gate passed; every `awaiting-observation` row's basis
  names the evidence window and its target is absent from the
  window's Pages aggregate; the append-only evidence log's count
  equals the generator-stamped baseline `intent_meta.
  outcome_evidence_count` (the generator stamps the count it read at
  build time, so any shrink or tamper between build and check fails).
  The patch's scratch leg — a fresh evidence-free regeneration yields
  all gates unknown — was run at deploy time on a scratch copy
  (2,732/2,732 rows unknown) and is recorded in the batch record; it
  is a deploy-time proof, not a per-run check, because verify.js runs
  against the live DB by design.
- **I-9** — the locally published `datasets-intent-coverage.json`
  keeps the 36-node frame; D8 `generatedBy` is the v2 generator;
  `rowSources` reconciles with the DB (estateGenerated == row count,
  pageDerived == meta, **gscObservedRows == 0**); the `gscEvidence`
  block reconciles with the import tables (imported / attached /
  enriched / pages split); `outcomeDigest` == meta; the published
  `outcomeRollup` (rows, byStatus, byHighestGate, byGateState) equals
  the roll-up recomputed from `intent_row_outcome`; `pageCoverage`
  asserts the full registry with no uncovered pages; `rowsByArea`
  covers all 53 GeoJSON features and, with `rowsByNonFeatureArea`,
  sums to the count of area-tagged rows; every per-service coverage
  node reconciles (generated == queryRows, enriched == DB count,
  outcome roll-up rows == queryRows); D6's description carries the
  pre-rebuild era tag.

## P-5 extended 255 → 257 distributions (same motion)

Per the owner's certificate directive (2026-10-30: every page,
signal, code and script carries the seal), the two v2 code files join
the sealed code set: `scripts/build-intent-rubric.js` (the generative
builder whose output is itself a sealed dataset) and
`scripts/ingest-outcome-evidence.py` (the outcome-evidence ingest
tool). P-5's code-URL list gains both raw.githubusercontent URLs and
the exact total moves 255 → 257 (42 data + 202 pages + 13
shell/code). The page-set assertion (202 per-page JSONs) is
unchanged — this batch adds no page. The assertion stays exact-count,
never a floor, as in every prior extension.

## What did NOT change

I-1..I-5 are untouched (the v1 invariants remain the floor v2 builds
on). No check was weakened, removed, or waived in this batch.

## Addendum (same batch, deploy-time): two corrections found by the gates themselves

1. **I-1 caught a resolution collision; the generator was fixed,
   not the check.** The intent landing page's slug-derived JSON name
   is `datasets-intent-coverage.json` — the dataset file itself —
   while its per-page JSON is `dataset-intent-coverage.json`, which
   declares the page's WebPage @id. With the derived name preferred,
   the 56 roll-up rows targeting that page carried the dataset file's
   digest as their target-JSON certificate, which also changed when
   the dataset was re-sealed (I-1 instability). `resolveJsonFile` now
   prefers a unique WebPage-@id match over the derived filename in
   both directions; all other resolutions are unchanged (the five
   label-named JSONs resolve identically under either order).
2. **I-9's roll-up comparison was serialization-fragile.** The
   published roll-ups zero-fill their full vocabularies; a recompute
   that only materializes occurring states failed `JSON.stringify`
   equality on missing zero keys despite identical values. The check
   now compares vocabulary-complete (every vocabulary key equal,
   zero-filled on both sides, no keys outside the vocabulary) — the
   same semantics, stated exactly.
