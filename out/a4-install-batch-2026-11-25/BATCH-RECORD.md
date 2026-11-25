# A4 INSTALL BATCH — 2026-11-25 (Component A4, changed-slice rebuilds)

Batch: a4-install-batch-2026-11-24 · spec: batch-spec.json (machinery only, census delta NONE)
Brief: ~/workspace/seal-test/suite-adopt/a4-slices/INSTALL-BRIEF.md
Rig gates record: out/a4-gates-2026-11-23/GATES-REPORT.md (gates 2–6 PASS, fix cycle 2026-11-24/25)

AC-1: API bundle gate acknowledged — the governed builders re-emitted the
API-served dataset seats byte-identical on the live tree (15/15 governed
outputs hash-equal to the sealed files after cold sliced maintains); the
API bundle stays within the 60 MiB gate.

## Flip (2026-11-24, coordinator)
- Seats placed at gate-proven hashes (scripts/ + repo-dir/ twins):
  build-answer-evidence-sliced.js 0f13286b…, build-search-index-sliced.js
  148255866b…, build-page-data-sliced.js 8c128347…, build-intent-rubric.js
  1fc86efc… (classic 569c894f… preserved at scripts/build-intent-rubric-classic.js).
- Registries: scripts/slice-builds.json (new, real proofs), scripts/windowed-builds.json
  intent proof re-recorded (gate 6), scripts/build-slice-map.py (new).
- seal.py: A4 marker patch applied clean (both main() and main_incr() paths).
- predict.py: check_slice_builds ported, registered as A1.8 (A1.6 discovery-freshness,
  A1.7 splice-seats were already taken).
- Cold sliced maintains on the live tree: AE/SI/PD rebuilt=369 (cold caches),
  all 15 governed PUB outputs byte-identical to the sealed files.
- Ledger: the 9 AE questions entries the maintains re-emitted set to the
  batch date 2026-11-25 before the first seal (date-readiness lifecycle).
