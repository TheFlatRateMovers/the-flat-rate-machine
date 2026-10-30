# verify.js fix record — Batch Blog Pilots Live, 2026-10-30

## What changed and why

Batch Blog Pilots Live ships the first two guide posts of the blog
guide series — Do movers pack for you?
(https://theflatratemovers.com/do-movers-pack-for-you/) and Reading an
ISPM 15 mark (https://theflatratemovers.com/reading-an-ispm-15-mark/) —
each with a new per-page JSON (do-movers-pack-for-you.json,
reading-an-ispm-15-mark.json) and no new dataset. The posts were
scheduled for Nov 10 / Nov 12 and published early on 2026-10-30 at the
owner's order, after his sign-off on both texts. Under the Batch P2
certificate rule the new JSONs join the signed ai-master-index in the
same batch, so the sealed totals move:

- per-page JSON files: 158 → 160
- signed distributions: 205 → 207 (36 data + 160 pages + 11 shell/code)

verify.js P-5 asserted the old exact totals (158 / 205). Per the
standing stale-check rule — when an approved batch changes intended
state, rewrite the check stricter in the same motion, never waive it —
P-5 now asserts exactly 160 page files and exactly 207 distributions.
The check's label text and its comment block were updated in the same
edit; the comment block keeps the full extension history (P2 → Junk
Removal → Blog Foundation → Blog Pilots Live). The suite stays at 83
checks; no check was removed or loosened — both numbers moved only
because the estate grew by the two pages this batch ships, and the
assertion remains an exact count, never a floor.

## Also in this batch (context)

- index.html gains the two post page divs (before </main>), their
  pageMeta entries and router slugs (router gate 160 == 160), two hub
  article cards (blog hub visible set == blog.json hasPart, 25 == 25),
  all-pages chips, sitemap-page Article rows and count strings, the
  Developer-card seal statement (160 files / 207 distributions) and the
  estate-in-numbers strings (×13).
- functions/head-data.js regenerated (160 entries, 0 problems);
  functions/_middleware.js changes only inside its STATIC_FILES
  manifest (250 → 252 files — the two new per-page JSONs), every other
  byte identical; the 16-case middleware unit test passes, including
  both new post routes with their own titles and both new JSON files
  passing through instead of 404ing.
- sitemap.xml 158 → 160 URLs (lastmod 2026-10-30); ai-sitemap,
  llms.txt (dated blog section) and the data txt propagate the counts;
  the editorial ledger records both posts as published 2026-10-30.
