# verify.js fix record — Batch Blog Foundation, 2026-10-30

## What changed and why

Batch Blog Foundation ships one new page (Flat-Rate Guarantee,
https://theflatratemovers.com/flat-rate-guarantee/) with a new per-page
JSON (flat-rate-guarantee.json) and no new dataset. Under the Batch P2
certificate rule the new JSON joins the signed ai-master-index in the
same batch, so the sealed totals move:

- per-page JSON files: 157 → 158
- signed distributions: 204 → 205 (36 data + 158 pages + 11 shell/code)

verify.js P-5 asserted the old exact totals (157 / 204). Per the
standing stale-check rule — when an approved batch changes intended
state, rewrite the check stricter in the same motion, never waive it —
P-5 now asserts exactly 158 page files and exactly 205 distributions.
The check's label text and its comment block were updated in the same
edit; the comment block keeps the full extension history (P2 → Junk
Removal → Blog Foundation). The suite stays at 83 checks; no check was
removed or loosened — both numbers moved only because the estate grew
by the one page this batch ships, and the assertion remains an exact
count, never a floor.

## Also in this batch (context)

- functions/_middleware.js gains a genuine-404 branch: a GET/HEAD path
  that is not a known page (HEAD map), not a file in the deployed
  public/ tree (STATIC_FILES manifest, 250 files), and not /api/ or
  /cdn-cgi/ returns the on-brand 404 body. Non-GET/HEAD traffic passes
  through untouched; the www→apex 301 and the head-transform tail are
  byte-identical to before (asserted at build time; 12-case unit test
  green in the batch staging).
- functions/head-data.js regenerated for 158 pages (the guarantee
  entry added; the blog entry's description and JSON-LD refreshed).
- Both code files are sealed distributions; their digests are
  refreshed in the same batch (P-3/P-6 verify them against live bytes).
