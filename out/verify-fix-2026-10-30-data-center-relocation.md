# verify.js extension — Batch Data Center Relocation (2026-10-30)

Takeover category #4 (Data Center Relocation — Physical Layer) ships one
new per-page JSON (`data-center-relocation.json`) and one new dataset
file (`datasets-data-center-relocation.json`), and regenerates +
re-seals `datasets-intent-coverage.json` with the new service's rows.

Per the stale-check rule (checks encode era premises; when an approved
batch changes intended state, the check is rewritten stricter in the
same motion — never waived), verify.js was extended in this batch:

- P-5 assertion: `pageFiles.length === 165` → `=== 166`;
  `(servedIndex.distribution || []).length === 216` → `=== 218`;
  check name updated to match (166 per-page JSONs, 218 distributions =
  41 data + 166 pages + 11 shell/code).
- I-4 check name: "totals node + 26 coverage nodes" → "+ 27 coverage
  nodes" (the intent dataset gains one coverage node for
  #service-data-center-relocation; the underlying covNodes.length === 27
  assertion in §13 already derives from the registry).
- A dated comment recording this extension was appended to the P-5
  comment chain in verify.js itself.

Suite size unchanged: 88 checks. No check was removed, weakened, or
waived.
