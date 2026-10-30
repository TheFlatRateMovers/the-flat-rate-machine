# Batch Blog Pilots Live — record (2026-10-30)

Publishes the first two guide posts of the blog guide series, signed off
by Henry on 2026-10-30 ("make them live, deploy and feed the matrix
with them"). Both were scheduled for Nov 10 / Nov 12 and published
early at his order, with datePublished 2026-10-30. His CTA amendment
of the same morning (mid-article bridge + closing "Get your flat rate"
block in both drafts) landed BEFORE the deploy, so both posts shipped
with the full CTA set in a single deploy — no follow-on amendment
deploy was needed.

## What shipped

- **P1 — Do movers pack for you?**
  https://theflatratemovers.com/do-movers-pack-for-you/
  (registry service: service-packing; byline Henry Pitts Jr.)
- **P2 — Reading an ISPM 15 mark**
  https://theflatratemovers.com/reading-an-ispm-15-mark/
  (registry service: service-ispm15; byline Henry Pitts Jr.)
- Each post: root-level page div (before </main>), pageMeta + router
  entry, per-page JSON (Organization + BlogPosting + BreadcrumbList +
  FAQPage; FAQ text byte-equal to the draft markdown, program-checked),
  blog hub article card, and the full CTA set — hero "Get My Flat Rate
  Quote" button, mid-article "Get a flat rate quote" bridge, closing
  "Get your flat rate" block ("One flat price in writing before move
  day — never hourly." + "Get My Flat Rate Quote →" + "Or call
  +1-540-422-2153"), and the pattern's Start-here card.
- Blog hub visible article set == blog.json hasPart: **25 == 25**
  (program-checked locally and against the live shell).

## Counts (before → after)

- Pages 158 → **160**; sitemap URLs 158 → **160** (lastmod 2026-10-30)
- Per-page JSONs 158 → **160**; signed distributions 205 → **207**
- Services 24 (unchanged); datasets 26 (unchanged)
- STATIC_FILES manifest 250 → **252** files
- services.json pageCounts corrected by the verify run (below):
  service-packing 9 → 10, service-ispm15 5 → 6

## Propagation

- index.html: 2 post divs, 2 pageMeta entries, router +2 (gate
  160 == 160), 2 hub cards appended to the articles grid, 2 all-pages
  chips, 2 sitemap-page Article rows + count strings (158 → 160 files,
  268 → 270 links), Developer-card seal statement (160 files / 207
  distributions), estate-in-numbers strings ×13 → 160 / 207.
- functions/head-data.js regenerated: 160 entries, 0 problems.
- functions/_middleware.js: manifest only (250 → 252); every byte
  outside the manifest markers identical (asserted programmatically).
- sitemap.xml, ai-sitemap.json (site + phase-a copy), llms.txt (dated
  blog section appended; phase-a copy count-only), data txt (3 count
  strings + 2 post index lines + dated entry), blog.json hasPart
  23 → 25, pages.json registry 158 → 160, slug-file-map 158 → 160.

## Gates

- Quote-form segment md5 unchanged: 4d8d49f05b22b129eac623a41370d9cb.
- Router gate (local + live shell): 160 == 160, sets equal, both post
  divs resolve before <footer>; hub visible set == hasPart (25).
- Middleware unit test: **16/16** (12 foundation cases + both new post
  routes with their own titles + both new JSON files passing through
  instead of 404ing).
- node --check on all inline executable scripts: clean.
- verify.js P-5 extended stricter in the same motion (160 page files /
  207 distributions) with dated record
  out/verify-fix-2026-10-30-blog-pilots.md. **First full run: 82/83** —
  the one failure was real: services.json pageCounts had not moved with
  the two new service-referencing pages. Fixed forward the same batch
  (registry data/services.json only; the site-served services.json is a
  JSON-LD graph carrying no pageCounts, so the seal was unaffected and
  no redeploy was needed) and pushed (machine HEAD d1dd18ad).
  **Re-run: 83/83 — VERIFY OK.**
- Seal set-diff (asserted before signing): exactly 2 added
  distributions (the two post JSONs) + exactly 7 digest-only changes
  (site shell index.html, _middleware.js, head-data.js, verify.js,
  blog.json, ai-sitemap.json, llms.txt); 0 gaps; top-level index fields
  unchanged. The data txt is not a signed distribution and correctly
  shows no digest change.
- PROVENANCE OK over live bytes: 207 match / 0 mismatch / 0 unresolved
  (live-fetched JWKS + index + JWS; repo files fetched live from raw).
- Live checks: both post URLs 200 with their own titles; both post
  divs verified in the live shell to carry the hero CTA, the bridge
  link, the closing block and the byline; both JSONs 200
  application/json; /blog/ 200 and lists both posts; live sitemap
  contains both URLs (160 total); /flat-rate-guarantee/ and
  /junk-removal/ still 200. Live bytes sha256-equal to the deploy tree
  for all 8 changed/new site files; all 16 pushed repo files read back
  byte-identical.

## Coordinates

- Pages deploy: **accf906a** (252 files; 10 uploaded).
- the-flat-rate-machine: d6e2b3ac → 9e56d360 (code) → 5e8fe4f6 (data)
  → d1dd18ad (services.json pageCount fix).
- theflatratemovers-ai: 7549c8d1 → 9e5a2c8f (content + schemas) →
  79804eb1 (signed index pair, pushed last).
- Gist-based ai-repo data/entity-graph.json blob SHA re-confirmed
  untouched: cda897e61319a0f52172ef1365402e4d7179cddf.
- Editorial ledger (blog-project/ledger.csv): P1/P2 marked published
  2026-10-30 with the early-publication note, sign-off recorded, word
  counts updated to the amended drafts (P1 1761, P2 1733).

## Indexing queue (next GSC pass)

Both new URLs are queued for the NEXT indexing pass — today's 09:00
cron pass carries a fixed 22-item list and was NOT edited:

- https://theflatratemovers.com/do-movers-pack-for-you/
- https://theflatratemovers.com/reading-an-ispm-15-mark/
