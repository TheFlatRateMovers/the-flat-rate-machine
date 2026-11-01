# Verify fix — 2026-11-01 — Parseability Sweep batch

Suite 140 → 144 checks. No check weakened, deleted, or waived.

## Added — §24 Parseability (PS-1..PS-4)

- **PS-1** — every `application/ld+json` block in the source shell
  (repo-dir/index.html) parses as JSON, and the `#page-jsonld` slot
  carries the seeded document `{"@context":"https://schema.org","@graph":[]}`.
  Pins batch finding G1: the slot previously stood EMPTY in the shell,
  the one unparseable ld+json block in the estate's sealed set
  (80/81). The generator (build-routes.js, both copies) now asserts
  the seeded slot and replaces it per route; regenerated routes are
  byte-identical to the prior tree (210/210).
- **PS-2** — every ld+json block in every route document in the
  deploy tree parses (docs enumerated from the deploy tree's own
  sitemap.xml; count pinned >= 210).
- **PS-3** — every .json/.jsonld/.geojson file in the deploy tree
  parses (count pinned >= 250).
- **PS-4** — llms.txt represents every sitemap page URL.

Batch record: out/batch-parseability-sweep-2026-11-01/records/
BATCH-PARSEABILITY-SWEEP-RECORD.md.
