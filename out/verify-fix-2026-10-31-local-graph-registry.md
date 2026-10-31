# Verify re-expression — Local Graph Registry (Retrieval Machine Build B3)

Date: 2026-10-31. Batch: `out/batch-local-graph-registry-2026-10-31/`.
Patch script: `work/patch-verify.py` in that batch folder.

## What changed and why

Retrieval Machine Build B3 ships `datasets-local-graph-registry.json`
(Element 3: local-business graph, per Dossier 03 §5) as a published
dataset file with its landing page `/datasets/local-graph-registry/`,
its per-page JSON `dataset-local-graph-registry.json`, its generated
route document and its generator `scripts/build-local-graph.js` as a
sealed code distribution. The registry page joins `data/pages.json`
(207 → 208 pages), so every page-count premise in the suite moves by
exactly the batch's delta; the signed index moves 478 → 482
distributions; the route-document Dataset-instance population (D-2)
moves by exactly the instances the new route document carries.

## Re-expressions (each STRICTER or exact-count-preserving)

- **P-5** (certificate coverage): exact counts move 207 → 208
  per-page JSONs, 207 → 208 route documents, 478 → 482
  distributions; the code set gains
  `scripts/build-local-graph.js`. The assertion stays exact-count.
- **D-2** (Dataset-node hygiene): the route-document instance pin
  moves 323 → 332 — the measured delta of the new route document:
  its embedded dataset script contributes the registry file's nine
  Dataset-typed `@graph` nodes (scope, branches, records, coverage,
  reviews, collisions, gaps, owner-steps, totals), counted by the
  generator's own D-2 population rule (head scripts excluded). The
  route-document count moves 207 → 208. `build-routes.js`'s internal
  D-2 pin moved in the same motion (323 → 332).
- **Section 20 added (LG-1..LG-4)** — the registry's gates:
  LG-1 record discipline (controlled status vocabulary;
  lastVerified date + method vocabulary; evidence reference;
  non-empty observed/correct values; totals reconcile with the
  rows). LG-2 the honesty gates: `corrected-live` only on
  direct-fetch proof; every propagation parent resolves; the
  coverage matrix is complete (sources × 2 branches, no blank
  cells); the two branch entities are present with distinct names,
  hours and addresses (parity is structural, never blended).
  LG-3 the generated owner list equals the set the record rows
  generate — exactly the six designed steps, each blocking exactly
  its rows; collisions are all DO-NOT-TOUCH with event lists;
  every gap L1–L11 carries its designed solution. LG-4 the review
  snapshots hold the shared schema bar (no claim fields; competitor
  records namespaced and labeled) and the dataset regenerates
  byte-identical (`build-local-graph.js --check`).

## No check was removed, waived or loosened

The suite grows 118 → 122 checks. Every prior check keeps its
assertion; the two count premises (P-5, D-2) moved by exactly the
batch's measured delta, in the same motion as the change that
caused it, per the standing stale-check rule.
