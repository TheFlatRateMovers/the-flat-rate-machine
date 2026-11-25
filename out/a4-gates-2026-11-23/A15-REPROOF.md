# A1.5 Re-proof — build-intent-rubric.js (A4 fix cycle, 2026-11-24)

Pair (CURRENT):
- classic (control / oracle seat): scripts/build-intent-rubric-classic.js
  sha256 569c894fb1740c3b6a21dd7070d12952820ffc47394283f9cabaf1f661c47940
- modified (windowed + A4 coverage slices): scripts/build-intent-rubric.js
  (+ repo-dir twin, cmp clean)
  sha256 1fc86efc85ced24b90872ca3bd3f6de6585c2e2a9b6ad2126bfd774c9ff269e6
  (re-derived from the 569c894f classic: the A4 coverage-slice block
  anchored at MODULE TOP LEVEL; replaces defective 3dc6ecf9..., whose
  block sat inside datasetAggregates() and threw
  "ReferenceError: A4_CLASSIC is not defined" in main())

Method: three full runs on the rig copy, pristine DB snapshot
(gates/rebase/rubric-pristine.db, 518,217 rows) restored before
EVERY arm; runs under gates/run-gate.sh (NODE_OPTIONS heap 6144).

| Arm | Exit | Wall | Peak RSS |
|---|---|---|---|
| oracle classic (569c894f) | 0 | 1045.2 s | 2,615,796 KB (2.62 GB) |
| modified A4_CLASSIC=1 | 0 | 1019.5 s | 2,615,492 KB (2.62 GB) |
| modified sliced, cold (coverage cache cleared) | 0 | 1489.8 s | 2,584,960 KB (2.58 GB) |

Peak bound 3.0 GB: PASS both modified arms.
Sliced arm log line: A4-COVERAGE-SLICES: cached=0 rebuilt=34.

Byte-identity (sha256, identical across all three arms):
- intent-rubric.sql f95e5db4be0eec6bcac1d6d19a8b6d4f9488bc7d294e194354cb15f75b44a425
- intent-rows.json 2ec2658aa408b13b023fb43a968728c64f5d63e5c20f07f7c47a6605a9f52f13
- rows parts 59adbdfa... / b516b2b1... / f9f451bd... / 737ee693...
- datasets-intent-coverage.json b44599b327e433f0a8ad4af4675cc20b11f363fa5f94fbe193c7ed3a3e3cf4b9
  (single hash across oracle / modclassic / sliced captures)

DB meta equal across arms: row_count 518203 generated rows
(pristine snapshot 518,217 incl. pre-existing), rows_digest
eac69c6b293825a06d9666cd4848e26065d8152a1a60561f330a4c450529571f,
outcome_digest 96c8f5ef9905de8dbc358231880748e774282a23f582bab4e109280deb7f7535,
all 29 intent_meta keys equal (capture files:
install-rig/gates/arms/intent-{oracle,modclassic,sliced}.txt —
diff-clean; coverage captures cmp-clean).

Logs: install-rig/gates/logs/arm-oracle.log,
arm-modclassic.log (2026-11-24T21:24 section), arm-sliced2.log.
