# verify.js fix record — Batch Inland Port Transloading (2026-10-30)

Takeover category #3 (Virginia Inland Port transloading hub) ships in this
batch: one new page + per-page JSON (virginia-inland-port-transloading),
one new dataset file (datasets-transloading-inland-port.json). The hub
attaches to the EXISTING transloading service, so the canonical service
count stays 26 and no graph gains a node.

P-5 (certificate coverage) is extended in the same motion, exact-count as
always, never a floor and never waived:

- per-page JSON files: 164 -> 165
- signed distributions: 214 -> 216 (40 data + 165 pages + 11 shell/code)

datasets-intent-coverage.json is regenerated in the same batch
(build-intent-rubric.js v1.2.1: the transloading rows are now backed by
the new inland-port dataset file as well) and re-sealed in the same seal
motion (pass 2), so I-1..I-5 stay consistent with the published dataset.
