# verify.js fix — 2026-10-31 — Batch Blog N3N4 Live

**Motion:** In the same batch that publishes guide posts #3 and #4
(when-an-item-needs-a-custom-crate, i-81-shenandoah-valley-move-timing,
under the owner's standing blog authorization of 2026-10-31), check P-5
in verify.js is extended — never waived — and its dated comment chain
gains this batch's entry.

**Change (P-5 only):**
- `pageFiles.length === 200` → `=== 202` (the two new per-page JSONs
  join the page set).
- `(servedIndex.distribution || []).length === 253` → `=== 255`
  (255 = 42 data + 202 pages + 11 shell/code).
- Check label updated to "P-5 certificate covers all 202 per-page
  JSONs + the site shell + the deployed code sets (255
  distributions)".

**Batch rider (recorded here because it rides the same re-seal):** the
signed ai-master-index entry for https://theflatratemovers.com/entity-graph.json
carried the stale label "Entity Graph — Full (92 nodes)". The file it
serves holds 38 @graph nodes (measured 2026-10-31); the label is
corrected at its durable source — the index lineage itself, which each
batch's seal carries forward (no generator rebuilds the list; the name
was set at P1 on 2026-10-29 per out/batchP1-provenance/DEPLOY-REPORT.md)
— to "Entity Graph — Site (38 nodes)" before digest + sign, asserted in
the seal script as the batch's single allowed non-digest change.

**Rule reaffirmed:** checks encode era premises; when an approved batch
changes intended state, the check moves stricter in the same motion
with a dated record. No gate is waived.
