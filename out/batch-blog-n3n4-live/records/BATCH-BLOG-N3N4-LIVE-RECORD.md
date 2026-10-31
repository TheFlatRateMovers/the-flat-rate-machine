# BATCH BLOG N3N4 LIVE — RECORD

Date: 2026-10-31. Authorization: Henry's standing blog authorization
of 2026-10-31 — blog posts Mira creates are pre-approved; publish
without per-post sign-off. Pattern: the Blog N1N2 live batch of
2026-10-30, identical discipline.

## Shipped

Two posts of the blog guide series, published EARLY (superseding their
November schedule slots, N1/N2 precedent):

- #3 Crating: "When an item needs a custom crate and when padding is
  enough" — https://theflatratemovers.com/when-an-item-needs-a-custom-crate/
  (2,180 words, 6 FAQs, about #service-crating; slot was 2026-11-24)
- #4 Corridors: "I-81 through the Shenandoah Valley: what it means for
  move timing" — https://theflatratemovers.com/i-81-shenandoah-valley-move-timing/
  (1,976 words, 6 FAQs, about #service-route81; slot was 2026-11-25)

Each post: root-level page in the shell (hero + visible CTAs: hero
button, mid-article bridge, closing "Get your flat rate" block,
Start-here card, byline "By Henry Pitts Jr. — Reviewed by Henry
Pitts"), BlogPosting datePublished/dateModified finalized to the
publish date 2026-10-31, per-page JSON (Organization + BlogPosting +
BreadcrumbList + FAQPage), blog hub card (hub now 29 articles),
all-pages chip, sitemap-page Article row, pageMeta + router entries.

## Counts (before -> after)

- pages 200 -> 202 (pages.json; last pre-batch slug 'datasets', posts appended after)
- signed distributions 253 -> 255 (seal passes 1 + 2, see below)
- sitemap.xml 232 -> 234 locs (blog hub lastmod -> 2026-10-31)
- STATIC_FILES 305 -> 307; router == pageMeta == 202 (sets equal)
- blog.json CollectionPage hasPart 27 -> 29; Organization node byte-unchanged
- services.json pageCounts: service-crating 3 -> 4, service-route81 4 -> 5
- ai-sitemap hasPart 200 -> 202 (public + phase-a copies, dateModified 2026-10-31)
- intent rubric: 1,218 rows, 0 excluded (rows unchanged; the dataset's
  two registry description strings moved 200 -> 202 pages with
  pages.json; new dataset SHA-256
  5764d637a812bb95d348d090d343bb61e06591376c25ade62166ea33d2af2b12;
  the intent landing page's embed + certificate SHA were synced)
- verify.js 93 checks; P-5 extended 200/253 -> 202/255 in this same
  motion (out/verify-fix-2026-10-31-blog-n3n4.md)

## Signed-index label correction (addition task, riding this re-seal)

- Old label: "Entity Graph — Full (92 nodes)" on the distribution
  whose contentUrl is https://theflatratemovers.com/entity-graph.json
- New label: "Entity Graph — Site (38 nodes)"
- True count: 38 @graph nodes, measured 2026-10-31 from the live
  public/entity-graph.json (the best graph, a separate entry, holds 97
  and was already correctly named).
- Source: no generator rebuilds the index's distribution list —
  digest-index.py only fills license/dateModified/digest on the index
  handed to it, and every batch's seal starts from the current
  published index, so the name lives in the index lineage itself. The
  P1 record (out/batchP1-provenance/DEPLOY-REPORT.md, step 2) shows
  "(92 nodes)" was set deliberately at P1 (2026-10-29) before signing.
  Grep confirmed the stale string existed only in the live index
  lineage + old batch dirs — no other live public file carries it.
  The fix was therefore applied to the working index BEFORE digest +
  sign in seal pass 1 and asserted as the batch's single allowed
  non-digest field change; the corrected sealed index is what shipped
  to the site and the ai repo, so every future batch inherits it.
  The entry's digest was NOT changed by the correction (the file it
  serves never changed).

## Seal set-diffs (asserted in work/seal.py)

- Pass 1: added = the 2 post JSON distributions; removed = 0;
  digest-changed = {ai-sitemap.json, llms.txt, blog.json, repo shell
  index.html, code _middleware.js, code head-data.js, verify.js}
  (7, exactly as expected); non-digest changes = ONLY the entry-4
  name correction; gaps = 0.
- Pass 2 (after intent regeneration): digest-changed =
  {datasets-intent-coverage.json, repo shell} exactly; non-digest
  changes = none; label persisted.
- Standalone verify-provenance over the sealed tree: JWS verified,
  255 match / 0 mismatch / 0 unresolved — PROVENANCE OK. The live
  index + JWS are byte-identical to the sealed copies (sha256-checked
  after deploy), so the verdict carries to the live estate.

## Gates

- Pre-deploy verify.js: 89/93 — the only failures were the 4 expected
  live-comparison checks (live sitemap missing the 2 new URLs; live
  sitemap count 232 vs 234; P-5 vs the still-served 253 index; S-4
  live lastmod range ending 2026-10-30). An earlier noisy run showed
  extra transient live-fetch failures; the full captured run
  (records/verify-predeploy.log) is the reliable read: all local
  checks pass.
- Middleware suite: 53/53 (4 cases added for the new routes/JSONs).
  gen-head-data: 202 entries, 0 problems.
- node --check: all executable inline scripts OK. Quote-form segment
  md5 4d8d49f05b22b129eac623a41370d9cb unchanged before AND after
  every shell edit. No quote test posts. No 'kerb'. Blog hub visible
  cards (29) == blog.json hasPart (29).
- Pre-push key-content grep across both push trees: 0.
- Sitemap-page card body prose ("71 rebuilt pages, 24 articles...")
  was left byte-identical per the N1N2 precedent: its composition
  figures are era prose that no longer decomposes arithmetically
  against the live registry; the headline counts it presents
  (canonical pages, accounted URLs, Canonical pages — N) were all
  moved 200 -> 202 / 342 -> 344 in this batch.

## Coordinates

- Pages deploy: 4c50b7cf.the-flat-rate-movers.pages.dev (11 files
  uploaded, 307 total).
- Live verification: both post URLs 200 with own titles + full CTA
  set in the served divs; both post JSONs 200 application/json;
  sitemap live 234 locs; hub live 29 cards; recent routes (P1, P2,
  N1, N2, guarantee, datasets) all 200; 10/10 changed files
  byte-identical live vs deploy tree.
- GitHub ai: 4769b945 -> be5bbac82d8ca9a1a54f51c92fe8cc7fdf456733
  (8 files: 2 schemas, llms.txt, ai-sitemap.json, data txt,
  data/ai-master-index.json + .jws, data/datasets-intent-coverage.json).
- GitHub machine: b9a2cd3e -> (this push; HEAD verified by read-back
  in the completion report).
- Gist-based ai-repo data/entity-graph.json NOT in either push tree;
  blob re-confirmed cda897e61319a0f52172ef1365402e4d7179cddf at
  read-back.
- ledger.csv rows 3 + 4 appended (published 2026-10-31, standing
  authorization noted).

## Indexing queue (next GSC pass)

These two join the FOLLOWING Search Console pass (today's 09:40 cron
was NOT edited):

- https://theflatratemovers.com/when-an-item-needs-a-custom-crate/
- https://theflatratemovers.com/i-81-shenandoah-valley-move-timing/
