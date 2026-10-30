# verify.js fix record — Batch Junk Removal (2026-10-30)

**Change:** P-5 (certificate coverage) totals extended in the same motion as
the junk-removal category shipped: per-page JSON files 156 → 157 and signed
distributions 202 → 204 (36 data distributions — the new
datasets-junk-removal.json joins the 35 — plus 157 per-page JSONs — the new
junk-removal.json joins the 156 — plus the 11 shell/code entries, unchanged).

**Why:** the check encodes the estate's exact sealed totals as literals.
Adding a page and a dataset file moves the true totals; leaving the literals
at 156/202 would fail a correct estate. This is the standing stale-check
rule: when an approved batch changes intended state, the check is rewritten
to the new state in the same motion — stricter, never waived.

**Strictness:** unchanged in kind and strengthened in coverage — the
assertion remains exact-count equality on BOTH numbers (never a floor or a
range), and the covered set now includes two more real files whose digests
P-3/P-6 verify against live bytes. No other check was edited; the suite
stays at 83 checks.

**Batch:** out/batch-junk-removal/ (build, gates, seal, deploy, pushes).
verify.js is itself a sealed code distribution; its new digest is sealed in
the same batch (re-digest + re-sign), per the widened P2 rule.
