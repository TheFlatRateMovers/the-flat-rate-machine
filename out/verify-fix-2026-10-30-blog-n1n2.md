# verify.js fix record — Batch Blog N1N2 Live, 2026-10-30

## What changed and why

Batch Blog N1N2 Live ships the next two guide posts of the blog guide
series — Moving a piano: what drives cost and risk
(https://theflatratemovers.com/moving-a-piano/) and Curbside vs inside
vs white-glove delivery: what to confirm before you book
(https://theflatratemovers.com/curbside-vs-inside-vs-white-glove-delivery/)
— each with a new per-page JSON (moving-a-piano.json,
curbside-vs-inside-vs-white-glove-delivery.json) and no new dataset.
The posts were scheduled for Nov 17 / Nov 19 and published early on
2026-10-30 at the owner's order, after his sign-off on both texts.
Under the Batch P2 certificate rule the new JSONs join the signed
ai-master-index in the same batch, so the sealed totals move:

- per-page JSON files: 160 → 162
- signed distributions: 207 → 209 (36 data + 162 pages + 11 shell/code)

verify.js P-5 asserted the old exact totals (160 / 207). Per the
standing stale-check rule — when an approved batch changes intended
state, rewrite the check stricter in the same motion, never waive it —
P-5 now asserts exactly 162 page files and exactly 209 distributions.
The check's label text and its comment block were updated in the same
edit; the comment block keeps the full extension history (P2 → Junk
Removal → Blog Foundation → Blog Pilots Live → Blog N1N2 Live). The
suite stays at 83 checks; no check was removed or loosened — both
numbers moved only because the estate grew by the two pages this batch
ships, and the assertion remains an exact count, never a floor.

The batch also moves services.json pageCounts in the same motion
(service-piano-antique 4 → 5, service-final-mile 4 → 5), matching the
two new service-referencing pages in pages.json — the same forward fix
the pilots batch applied after its first verify run caught the drift,
applied here up front.

## Also in this batch (context)

- index.html gains the two post page divs (before </main>), their
  pageMeta entries and router slugs (router gate 162 == 162), two hub
  article cards (blog hub visible set == blog.json hasPart, 27 == 27),
  all-pages chips, sitemap-page Article rows and count strings, the
  Developer-card seal statement (162 files / 209 distributions) and the
  estate-in-numbers strings (×13).
- functions/head-data.js regenerated (162 entries, 0 problems);
  functions/_middleware.js changes only inside its STATIC_FILES
  manifest (252 → 254 files — the two new per-page JSONs), every other
  byte identical; the middleware unit test passes 20/20, including both
  new post routes with their own titles and both new JSON files passing
  through instead of 404ing.
- sitemap.xml 160 → 162 URLs (lastmod 2026-10-30); ai-sitemap, llms.txt
  (dated blog section) and the data txt propagate the counts; the
  editorial ledger records both posts as published 2026-10-30.
- Owner spelling correction in the same batch (Henry, 2026-10-30:
  "curb, not kerb"): American curb/curbside replaces the British
  kerb/kerbside at 27 occurrences across index.html (23), the final-mile
  dataset, the transloading dataset, and the final-mile hub and
  white-glove Winchester per-page JSONs (1 each); head-data.js
  regenerated from the swept shell (its 4 occurrences cleared). Every
  occurrence was context-reviewed first — all plain final-mile /
  white-glove prose; no quoted titles or proper nouns, zero exclusions.
  The swept datasets' ai-repo mirrors carry the identical swept bytes.
