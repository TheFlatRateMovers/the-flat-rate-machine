# Batch Blog N1N2 Live — record (2026-10-30)

Publishes the next two guide posts of the blog guide series, signed
off by Henry on 2026-10-30 ("publish"). Both were scheduled for
Nov 17 / Nov 19 and published early at his order, with datePublished
2026-10-30. The same batch carried his spelling correction of the
same morning ("curb, not kerb") as a folded-in sweep — one deploy
sequence, two deploys total (the second carried only the reworded
changelog notes + re-sealed index pair, see Kerb sweep below).

## What shipped

- **N1 — Moving a piano: what drives cost and risk**
  https://theflatratemovers.com/moving-a-piano/
  (registry service: service-piano-antique; byline Henry Pitts Jr.)
- **N2 — Curbside vs inside vs white-glove delivery: what to confirm**
  https://theflatratemovers.com/curbside-vs-inside-vs-white-glove-delivery/
  (registry service: service-final-mile; byline Henry Pitts Jr.)
- Each post: root-level page div (before </main>), pageMeta + router
  entry, per-page JSON (Organization + BlogPosting + BreadcrumbList +
  FAQPage; FAQ text byte-equal to the draft markdown, program-checked,
  6 Q&A pairs each), blog hub article card, and the full CTA set —
  hero "Get My Flat Rate Quote" button, mid-article "Get a flat rate
  quote" bridge, closing "Get your flat rate" block ("One flat price
  in writing before move day — never hourly." + "Get My Flat Rate
  Quote →" + "Or call +1-540-422-2153"), and the pattern's Start-here
  card. All CTA elements verified present in each post's own div in
  the LIVE served pages.
- Blog hub visible article set == blog.json hasPart: **27 == 27**
  (program-checked locally and against the live shell).

## Counts (before → after)

- Pages 160 → **162**; sitemap URLs 160 → **162** (lastmod 2026-10-30)
- Per-page JSONs 160 → **162**; signed distributions 207 → **209**
- Services 24 (unchanged); datasets 26 (unchanged)
- STATIC_FILES manifest 252 → **254** files
- services.json pageCounts moved in the same motion (the forward fix
  the pilots batch needed after its first verify run):
  service-piano-antique 4 → 5, service-final-mile 4 → 5

## Propagation

- index.html: 2 post divs, 2 pageMeta entries, router +2 (gate
  162 == 162), 2 hub cards appended to the articles grid, 2 all-pages
  chips, 2 sitemap-page Article rows + count strings (160 → 162 files,
  270 → 272 links), Developer-card seal statement (162 files / 209
  distributions), estate-in-numbers strings ×13 → 162 / 209.
- functions/head-data.js regenerated: 162 entries, 0 problems.
- functions/_middleware.js: manifest only (252 → 254); every byte
  outside the manifest markers identical (asserted programmatically).
- sitemap.xml, ai-sitemap.json (site + phase-a copy), llms.txt (dated
  blog section appended; phase-a copy count-only — its standing count
  line updated, the pilots batch's dated historical line left as
  written), data txt (3 count strings + 2 post index lines + dated
  entry), blog.json hasPart 25 → 27, pages.json registry 160 → 162,
  slug-file-map 160 → 162.

## Kerb sweep (owner correction, folded into this batch)

American spelling, word-boundary, case-preserving ("kerbside"→
"curbside", "kerb"→"curb"), applied BEFORE the builds so every surface
inherited the corrected text. Every occurrence was context-reviewed
first: all are plain final-mile / white-glove customer-facing prose;
NO occurrence sits inside a quoted publication/source title or a
proper noun — **zero exclusions**. Per-file counts (before → after):

- public/index.html: 23 → 0 (8 kerbside, 15 kerb)
- public/datasets-final-mile.json: 1 → 0
- public/datasets-transloading.json: 1 → 0
- public/commercial-freight-handling-white-glove-final-mile-services.json: 1 → 0
- public/white-glove-delivery-winchester-va.json: 1 → 0
- functions/head-data.js: 4 → 0 (generated file; cleared by its
  regeneration from the swept shell in this batch)
- Machine-repo data/ and out/phase-a copies: 0 occurrences (scanned,
  nothing to sweep). verify.js: 0 occurrences (nothing user-facing to
  report). Blog drafts N1/N2: already clean (0).
- ai-repo mirrors: the two swept datasets' twins in the ai repo
  (data/datasets-final-mile.json, data/datasets-transloading.json)
  were byte-identical to the public files and were pushed with the
  identical swept bytes. The two swept per-page JSONs have no twin in
  the ai repo's schemas/ folder (checked: HTTP 404), so no mirror
  edit existed to make. The gist-based ai-repo data/entity-graph.json
  carries 0 occurrences and was not touched (blob SHA re-confirmed
  cda897e61319a0f52172ef1365402e4d7179cddf).
- Changelog wording: the batch's own dated notes in llms.txt and the
  data txt initially quoted the old spelling while recording the
  correction; they were reworded before the final deploy so the
  literal strings appear nowhere in the estate (after-count 0
  estate-wide, no exclusions). llms.txt is signed, so the index was
  re-sealed over the reworded bytes inside the same asserted set-diff
  and the corrected files went out in the second deploy (e1199c7f).

## Gates

- Quote-form segment md5 unchanged: 4d8d49f05b22b129eac623a41370d9cb.
- Router gate (local + live shell): 162 == 162, sets equal, both post
  divs resolve before <footer>; hub visible set == hasPart (27).
- Middleware unit test: **20/20** (16 prior cases + both new post
  routes with their own titles + both new JSON files passing through
  instead of 404ing).
- node --check on all inline executable scripts: clean.
- verify.js P-5 extended stricter in the same motion (162 page files /
  209 distributions) with dated record
  out/verify-fix-2026-10-30-blog-n1n2.md; services.json pageCounts
  moved in the same motion (above). **Pre-deploy run: 79/83** — the
  four failures were exactly the live-comparison checks reading the
  still-old live site (live sitemap count, pages.json URLs in the live
  sitemap, P-5 against the served 207-entry index, S-4 lastmod count).
  **Post-deploy + post-push run: 83/83 — VERIFY OK.**
- Seal set-diff (asserted before signing; two labeled groups):
  exactly 2 added distributions (the two post JSONs, CC BY 4.0,
  dateModified 2026-10-30) + exactly 11 digest-only changes —
  POSTS group (7): site shell index.html, _middleware.js, head-data.js,
  verify.js, blog.json, ai-sitemap.json, llms.txt; KERB group (4):
  datasets-final-mile.json, datasets-transloading.json,
  commercial-freight-handling-white-glove-final-mile-services.json,
  white-glove-delivery-winchester-va.json. (index.html and
  head-data.js sit in the posts group and were ALSO kerb-swept.)
  0 gaps; top-level index fields unchanged. The data txt is not a
  signed distribution and correctly shows no digest change.
- PROVENANCE OK over live bytes: **209 match / 0 mismatch /
  0 unresolved** (live-fetched JWKS + index + JWS; repo files fetched
  live from raw).
- Live checks: both post URLs 200 with their own titles; both post
  divs verified in the live pages to carry the hero CTA, the bridge
  link, the closing block, the Start-here card and the byline; both
  JSONs 200 application/json; /blog/ 200 and lists both posts; live
  sitemap contains both URLs (162 total); /do-movers-pack-for-you/,
  /reading-an-ispm-15-mark/, /flat-rate-guarantee/ and /junk-removal/
  still 200. Live bytes sha256-equal to the deploy tree for all 14
  changed/new site files (the shell itself is middleware-generated —
  a direct /index.html fetch returns an empty body by design; the
  shell is verified via the live routecheck on the served home page
  and via its repo copy's digest in P-6). All 18 pushed repo files
  read back byte-identical.

## Coordinates

- Pages deploys: **413f03cb** (254 files; posts + sweep + seal) then
  **e1199c7f** (4 files: llms.txt, data txt, ai-master-index pair after
  the changelog rewording + re-seal).
- the-flat-rate-machine: 26b49c53 → 3615a6a6 (code) → 1b03c601 (data).
  (The first code-chunk attempt hit a transient MCP 503; HEAD was
  verified unchanged before the identical chunk was re-issued and
  landed.)
- theflatratemovers-ai: 79804eb1 → b10b33b6 (content + schemas + swept
  datasets) → eecd41ad (signed index pair, pushed last).
- Gist-based ai-repo data/entity-graph.json blob SHA re-confirmed
  untouched: cda897e61319a0f52172ef1365402e4d7179cddf.
- Editorial ledger (blog-project/ledger.csv): posts 1 and 2 marked
  published 2026-10-30 with the early-publication notes and sign-off
  recorded (Henry, 2026-10-30); word counts stand as drafted
  (N1 2066, N2 1945).

## Indexing queue (next GSC pass)

Both new URLs are queued for the NEXT indexing pass — tomorrow's
2026-10-31 pass is already booked with a fixed list and was NOT
edited; these queue behind it:

- https://theflatratemovers.com/moving-a-piano/
- https://theflatratemovers.com/curbside-vs-inside-vs-white-glove-delivery/
