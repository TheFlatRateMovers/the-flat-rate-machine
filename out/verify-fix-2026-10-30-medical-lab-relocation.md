# verify.js extension — Batch Medical & Laboratory Equipment Relocation (2026-10-30)

Takeover category #5 (Medical & Laboratory Equipment Relocation
Logistics) ships one new per-page JSON
(`medical-lab-equipment-relocation.json`) and one new dataset file
(`datasets-medical-lab-relocation.json`), and regenerates + re-seals
`datasets-intent-coverage.json` with the new service's rows.

Per the stale-check rule (checks encode era premises; when an approved
batch changes intended state, the check is rewritten stricter in the
same motion — never waived), verify.js was extended in this batch:

- P-5 assertion: `pageFiles.length === 166` → `=== 167`;
  `(servedIndex.distribution || []).length === 218` → `=== 220`;
  check name updated to match (167 per-page JSONs, 220 distributions =
  42 data + 167 pages + 11 shell/code).
- I-4 check name: "totals node + 27 coverage nodes" → "+ 28 coverage
  nodes" (the intent dataset gains one coverage node for
  #service-medical-lab-relocation; the underlying covNodes.length === 28
  assertion in §13 already derives from the registry).
- A dated comment recording this extension was appended to the P-5
  comment chain in verify.js itself.

Suite size unchanged: 88 checks. No check was removed, weakened, or
waived.
