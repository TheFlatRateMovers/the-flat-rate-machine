# Verify fix — Batch FF&E Logistics — 2026-10-30

Takeover category #2 (FF&E Logistics) ships a new service and page in this
batch, so the exact totals verify.js asserts move in the same motion, per
the stale-check rule (rewrite the check stricter with the change, never
waive a gate):

- P-5: per-page JSON files 163 → 164 (the new ffe-logistics.json joins the
  page set) and signed distributions 212 → 214 (39 data + 164 pages + 11
  shell/code — the new datasets-ffe-logistics.json joins the data set; the
  intent-coverage dataset is regenerated and re-sealed in the same batch
  with the new service's rows, digest-only). The P-5 assertion stays
  exact-count, and its check name is updated to the new totals.
- §13 I-4: the check NAME's coverage-node count moves 25 → 26 (the
  assertion itself was already dynamic: coverage nodes == services count,
  per-service row counts equal to rubric.db).

No check was removed, loosened, or waived. Suite size stays 88 checks.
