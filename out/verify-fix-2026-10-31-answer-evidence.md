# Verify re-expression — Retrieval Machine Build B2 (answer-evidence dataset), 2026-10-31

## What changed in intended state

`datasets-answer-evidence.json` shipped as a published dataset file (the
Retrieval Machine's answer-engine evidence element, Dossier 02 §5) with
its landing page `/datasets/answer-evidence/` (registry 206 → 207
pages), its per-page JSON `dataset-answer-evidence.json`, its generated
route document, and its generator `scripts/build-answer-evidence.js` as
a sealed code distribution. Sealed distributions move 474 → 478
(43 → 44 data, 206 → 207 per-page JSONs, 206 → 207 route documents,
18 → 19 shell/code, llms-full.txt unchanged at 1).

## Checks re-expressed (stricter or extended, never waived)

- **P-5** — exact counts updated: 207 per-page JSONs, 478 distributions;
  `scripts/build-answer-evidence.js` added to `P2_CODE_URLS`. The
  assertion stays exact-count.
- **D-2** — Dataset-node instance pin 314 → 323 (the new landing embeds
  the dataset file's nine Dataset nodes) and route-document count
  206 → 207. `scripts/build-routes.js` carries the same pin (its own
  generation assertion).
- **§19 AE-1..AE-4 (new)** — the answer-evidence dataset's own gates:
  - AE-1: all nine tables exist; question count equals the live rubric
    database count; fragment/profile/observation/snapshot/gap totals
    reconcile with the file's totals node; the coverage node reconciles
    three ways (totals node, per-service sums, recomputed binding
    states).
  - AE-2 (the honesty gate): every citation observation carries
    method + era + verbatim prompt; the count of observations with any
    method other than `search-surface` is exactly zero; the totals
    node's panel state reads zero panel runs and zero UI observations
    (citation standing on the actual answer-engine interfaces is
    UNMEASURED — a manufactured prompt-panel row fails the suite); the
    dataset regenerates byte-identical from the live estate
    (`build-answer-evidence.js --check`).
  - AE-3: every fragment's SHA-256 text hash recomputes from its text;
    every fragment evidence-link digest equals the served signed
    index's digest for that file; every exactly-bound question resolves
    to a fragment that lists the question's rubric row.
  - AE-4: no review snapshot carries any claim field; every
    competitor-namespace snapshot is labeled as such; namespace counts
    reconcile with the totals node.

## Notes

- The sitemap page div carries a pre-existing stale sentence ("205
  canonical pages … 106 mapped tag URLs") alongside the maintained
  totals sentence; B1 left it untouched and B2 does the same (the
  maintained sentence moved 206/33 → 207/34). Recorded here so the
  inconsistency is on the record for a future consistency sweep.
- During pass A, the new pageMeta entries were first written with
  head-data field names (t/d/c); `build-routes.js` rejected them (no
  `canonical`), and they were corrected to the pageMeta field names
  (name/svc/canonical/desc) in the shell and route-assets/main.js
  before generation. The generator gate caught the error pre-deploy —
  the pipeline working as designed.
- Suite count: 114 → 118 checks.
