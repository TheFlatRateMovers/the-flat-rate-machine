# Batch Blog Foundation — record (2026-10-30)

Henry's order 2026-10-30: "create the blog when you are done" (updates
queue complete). Sources: blog-project master brief + template +
schedule + question bank, with RECONCILIATION.md governing conflicts.

## Shipped live

1. **Blog hub rebuilt** (/blog/): hero intro rewritten (the internal
   "Batch 3" wording removed from the div, the pageMeta description and
   blog.json); an 11-category guide-series section added (Packing &
   Unpacking; ISPM 15 & Export Packing; Custom Crating; Pianos,
   Antiques & White-Glove; Final-Mile Delivery; Industrial Offices;
   Government Moves; Military Moves; Corridors I-81/I-66/I-70;
   Transloading & Warehouse Work; The Company & Our Areas), each card
   linking to a real existing page (targets resolved programmatically
   through pages.json + pageMeta canonicals); a flat-rate-guarantee
   cross-link card; the 23 published article cards kept byte-identical
   under a new "Published articles & guides" heading. blog.json:
   CollectionPage description rewritten, WebPage dateModified
   2026-10-30, and a Blog node added
   (https://theflatratemovers.com/blog/#blog) so post graphs' isPartOf
   resolves. hasPart verified equal to the hub's article set (23 == 23).
2. **Flat-Rate Guarantee page** (/flat-rate-guarantee/, slug chosen per
   registry conventions — privacy-policy-style non-service page):
   full estate treatment — div before <footer>, pageMeta + router
   entry (ROUTER GATE 158 == 158 locally and on live HTML), per-page
   JSON (privacy-policy shape: Organization + WebPage + BreadcrumbList),
   sitemap +1, ai-sitemap/llms/data-txt/Developer-card/all-pages/
   sitemap-page/footer propagation, estate-in-numbers strings ×13.
   Copy sources: Henry's stated terms 2026-10-29 (quoted verbatim in
   the page's terms section) + the estate's published copy (home hero
   "one flat price in writing before we lift a thing"; junk-removal
   page's review steps; quote page's no-obligation line; the survey
   walkthrough's film-only, human-made model). The logo tagline appears
   as the tagline only; no free-move mechanics invented. No head-graph
   node (non-service page, per architecture); no dataset (none exists
   for this page); no ratings on the page. Pages 157 → 158; services
   stay 24; datasets stay 26.
3. **Genuine 404** (Phase 0.2 closed): functions/_middleware.js — a
   GET/HEAD path that is not a known page (HEAD map), not a file in the
   deployed public/ tree (STATIC_FILES manifest, 250 files, generated
   from the tree at build time), and not /api/ or /cdn-cgi/ returns the
   on-brand 404 body (noindex; home + quote + all-pages links; phone;
   both branch addresses). Non-GET/HEAD passes through untouched
   (quote POST safe); www→apex 301 runs first; the head-transform tail
   and the www block are byte-identical to before (asserted at build).
   Case variants 404 deliberately (canonical paths are lowercase).
   12-case unit test green; live matrix green (unknown → 404, unknown
   .json → 404, /BLOG/ → 404, HEAD unknown → 404, three known paths →
   200, www → 301, asset → 200, guarantee.json → 200 application/json,
   OPTIONS /api/quote → 405 from the function layer = passthrough).
4. **Rubric**: +3 attestation rows (247 → 250): the guarantee terms
   (owner statement), the guarantee page publication, the blog hub
   rebuild. integrity_check ok.
5. **Seal**: distributions 204 → 205 (the guarantee per-page JSON
   joins). Digest set-diff = exactly 7 changed (site shell,
   _middleware.js, head-data.js, verify.js, blog.json, ai-sitemap.json,
   llms.txt) + 1 added; zero non-digest changes; top-level index fields
   unchanged. PROVENANCE OK 205/205 locally and against live-fetched
   index/JWS/JWKS. Note: the-flat-rate-movers-data.txt is NOT a signed
   distribution (only llms.txt + service-area.geojson are non-JSON site
   entries) — recorded so no future batch expects its digest to move.
6. **verify.js**: P-5 extended stricter in the same motion (158 page
   files / 205 distributions, exact counts; comment history extended;
   record out/verify-fix-2026-10-30-blog-foundation.md). Suite: 83/83
   VERIFY OK at final state. Phase 0.1 spot re-check on 5 URLs
   (/, /blog/, /junk-removal/, /gun-safe-movers/, /videos/): unique
   titles, self-canonicals, JSON-LD present.

## Caught and fixed inside the batch

- First seal run fetched the ai repo's capabilities-matrix.json from
  the repo ROOT instead of data/ and sealed a 14-byte 404 body.
  verify.js P-6 caught it before the ai-repo push ("served 3043B vs
  index 14B"); the true file's SHA-256 was verified identical to the
  previously sealed digest (no drift had ever existed), the seal was
  re-run from the correct path, and the corrected index was redeployed
  before any repo push of the index pair.
- The first registry entry for the new page lacked the `status` and
  `attested` fields the registry check requires; completed to the
  privacy-policy entry shape and re-pushed (machine bd054214).

## Post pipeline pattern (step 4) + pilots (step 5) — staged, NOT published

- Pattern documented in work/pilot-staging/PATTERN.md, including the
  URL decision: posts publish at root-level slugs (the hash router's
  keys are flat; all 23 existing articles are root-level), joining the
  Blog node via isPartOf. The brief's /blog/{slug}/ sketch yields to
  the estate architecture per the reconciliation rule.
- P1 "Do movers pack for you?" (slot Tue 2026-11-10) and P2 "Reading
  an ISPM 15 mark" (slot Thu 2026-11-12): full draft packages under
  ~/workspace/theflatratemovers/blog-project/drafts/ (post.md,
  post.jsonld with FAQ text program-generated from the markdown,
  sources.json, links.json, gap-table.md, qa-report.md G1–G9) +
  staged page builds in work/pilot-staging/. Ledger:
  blog-project/ledger.csv — both "draft — awaiting Henry's sign-off".
- USDA APHIS's ISPM page returned 403 to the research fetch; it is
  honestly excluded from P2's verified sources (the standard + the
  Swedish Board of Agriculture carry the authoritative floor).

## Coordinates

- Deploys: fffb2adf (initial) → 53b49b91 (final, corrected seal).
- GitHub: the-flat-rate-machine a5d83046 → c097396b (code) → 567b259f
  (data) → bd054214 (registry completion). theflatratemovers-ai
  47ec3641 → 52473981 (content) → 7549c8d1 (index pair, last).
- Gist data/entity-graph.json SHA re-confirmed:
  cda897e61319a0f52172ef1365402e4d7179cddf (untouched).
- Quote-form segment md5 unchanged: 4d8d49f05b22b129eac623a41370d9cb
  (extraction includes the <form> tag — noted for future batches).
