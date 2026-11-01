# Verify-fix record — 2026-11-01 — Archive Registry (Retrieval Machine E6-B1)

Batch: E6-B1 (archives registry + local BagIt archive). No check was
weakened, deleted, or waived. Every change below is same-motion
maintenance for state this batch intentionally changed, plus one new
section pinning the new dataset's gates.

## Re-expressed (stricter, exact-count discipline kept)

- **P-5** — per-page JSON files 209 → 210 and signed distributions
  486 → 491 (the batch adds the archive-registry dataset file, its
  per-page JSON, its landing route document, its generator, and the
  signed verification report). Label updated in the same motion.
  `P2_CODE_URLS` gains
  `scripts/build-archive-registry.js` — the new sealed generator joins
  the certificate-covered code set its batch seals.
- **D-2** — Dataset-node instances across route documents 343 → 353
  (+10 = the Dataset-typed nodes of datasets-archive-registry.json)
  and route documents 209 → 210. The same re-expression was applied
  to the generator-side assertion in `scripts/build-routes.js`
  (343 → 353, with a dated comment).
- **§21 comment** — the DC corpus description now reads 37 dataset
  files / 37 per-page dataset JSONs (comment text; the corpus itself
  is computed from the filesystem).

## Added

- **§23 AR-1..AR-6** — the archive registry's gates: totals reconcile
  with rows; A5 capture-record fields complete and the five
  no-longer-served captures pinned as missing with their re-check
  trail; deposit MD5/count reconciliation and the exact exception
  classes (9 deposit-divergent + 2 different-artifact + 5
  capture-not-verifiable = 16); the local-archive record re-read
  against the BagIt bag on disk (Payload-Oxum, manifest count,
  sampled re-hash); the signed verification report's bytes and JWS
  verified against the published JWKS inside the suite; gaps A1–A6
  complete and the dataset regenerating byte-identical.

Suite: 133 → 139 checks.
