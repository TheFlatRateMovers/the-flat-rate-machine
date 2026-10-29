# Merge note — Videos page deploy (follow-on deploy batch)

**This package is STAGED ONLY.** The building batch touched no live file, deployed nothing, and pushed nothing (the office batch was editing the shared live files). This note is the exact recipe for the follow-on deploy, which runs in sequence right after the office batch closes — shared live files are never edited by two batches at once.

**Pre-flight (mandatory, before any edit):** re-read CURRENT live state — the office batch (and any batch after it) may have moved counts and files since this package was staged on 2026-10-29. Recompute every count below from live at merge time; never apply staged numbers blindly (the redo/office reconciliation lesson). Confirm first: live sitemap count N (153 at staging), ai-sitemap hasPart = N, `videos` still collision-free in sitemap + data/pages.json, the six oEmbed titles unchanged (spot re-fetch one oEmbed record — if any title changed on YouTube, update the card heading, schema name, and content.md together before merging).

## What deploys

New page: **Videos — Moving & Heavy-Asset Work on Video**, slug `videos`, canonical https://theflatratemovers.com/videos/, div `page-videos`. Six embedded videos, all verified as the company's own channel content (research doc). **Pages N → N+1; services stay 22.**

## Steps, in order

1. **Backups first** (dated, never pushed): public/index.html, public/sitemap.xml, public/ai-sitemap.json, public/llms.txt, the data txt, data/pages.json, rubric.db.
2. **index.html — page div:** insert `page-div-draft.html` (this package) into public/index.html **before `<footer>`**, never before `<script>` (standing placement rule). The draft is complete: hero, logo figure, six video cards with youtube-nocookie embeds, scope/related chips, FAQ, standard closing card, sources card, and the in-div JSON-LD block (parse-equal to datasets-videos.json — keep it byte-for-byte the datasets content).
3. **index.html — pageMeta:** add the entry from meta.json (`pageMetaEntry`), in the established single-quoted format:
   `videos:{name:'Videos — Moving & Heavy-Asset Work on Video', svc:null, canonical:'https://theflatratemovers.com/videos/', desc:'…'}` — svc:null per the non-service-page precedent (all-pages, services, quote, developer, knowledge-*, docs). The sitewide breadcrumb (`nav#crumb`) picks the page up from this entry automatically; no div change needed.
4. **Router/registry check:** confirm the SPA resolves `#/videos` to `page-videos` from the pageMeta key (same mechanism as every other page); the all-pages index gets its visible entry (backlinks.md).
5. **New public files:**
   - `public/videos.json` ← `schema.json` (this package): the per-page graph (WebPage/CollectionPage + 6 VideoObjects + BreadcrumbList).
   - `public/datasets-videos.json` ← `datasets-videos.json` (this package): the VideoObject set; must remain parse-equal to the in-div JSON-LD block.
6. **sitemap.xml:** add one `<loc>https://theflatratemovers.com/videos/</loc>` entry with lastmod = deploy date. Count N → N+1.
7. **ai-sitemap.json:** hasPart += `{"@type":"WebPage","name":"Videos — Moving & Heavy-Asset Work on Video","url":"https://theflatratemovers.com/videos/"}` (the established hasPart entry form). hasPart count N → N+1. Services list unchanged (22); keywords unchanged unless the deploy batch adds a verbatim GSC query — none is claimed for this page, so add none.
8. **llms.txt:** add the page line in the established form (pattern: `- [Videos — Moving & Heavy-Asset Work on Video](https://theflatratemovers.com/videos/): Videos from The Flat Rate Movers' own YouTube channel (@theflatratemovers) — household moving in Winchester and the DMV, heavy gun safe moves in Northern Virginia, a final-mile white-glove locker safe installation, and a medical tank relocation, embedded from YouTube.`) plus a dated changelog entry for the deploy, following the file's existing convention.
9. **Data txt:** append a dated entry recording the new page, its six verified videos (IDs + titles), the two machine files, and the UNVERIFIED duration/upload-date omission, following the file's existing convention.
10. **Developer page:** add the "Videos data" card (pattern of the residential/commercial/gun-safe/office data cards): 6 VideoObjects, 0 Dataset / 0 Service / 0 Article nodes, files `videos.json` + `datasets-videos.json`. Apply backlinks.md inbound links in the same edit pass (Developer listing, all-pages entry, gun-safe hub, residential hub, commercial hub, final-mile/white-glove page, heavy hub).
11. **Machine registry (data/pages.json):** add the entry `{"slug":"videos","url":"https://theflatratemovers.com/videos/","title":"Videos — Moving & Heavy-Asset Work on Video","type":"page","services":[],"lastmod":"<deploy date>","status":"live","source":"live sitemap.xml + pageMeta in live site source","attested":"<deploy date>"}` and set the registry `count` to N+1. (verify.js reconciles registry ↔ sitemap ↔ site, so registry, sitemap, and index must land in the same deploy.)
12. **Rubric DB** (working copy `~/workspace/theflatratemovers/rubric.db` — the path verify.js reads): add attestation rows for the newly published facts, source = "Videos page package 2026-10-29; YouTube oEmbed + YouTube video pages fetched 2026-10-29", dated the deploy date:
    - the videos page itself (slug, canonical, collection page, svc null);
    - one row per included video: YouTube ID + verified title + channel (@theflatratemovers, company channel) + scope (household / gun safe ×3 / commercial final-mile white-glove / medical heavy-asset);
    - one row recording that duration and upload date are unpublished because unverified (the omission is itself a fact of record).
    NO rubric_check row (that table is a checks catalog), NO edge rows (no fragment-service edges, per standing pattern).
13. **Head graph / machine entity graphs:** NO change. The page claims no service node (svc:null precedent — developer and knowledge pages are likewise absent from the head graph's service set), and the Organization node already carries the YouTube sameAs. Do not add a `#service-videos` node.

## Gate (all must pass or the batch does not deploy)

- `node --check` on BOTH inline scripts of the edited index.html.
- `node verify.js` green (report the actual count) in ~/workspace/the-flat-rate-machine.
- Counts reconciled live: pages N+1 everywhere (sitemap, ai-sitemap hasPart, pages.json registry + count field), services 22 unchanged.
- Forbidden scans on the new/edited content: no "flat quote" without "rate" (the approved forms are "Get My Flat Rate Quote" / "Get a flat rate quote"), no USDOT/MC number or claim, no client names, no duration or upload-date figure for any video, no view counts, no hedging words ("attested"/"gated") in published copy, no Spearman / Around Town, no "crew page" / subcontract wording.
- Branches distinct in the closing card (Winchester 5.0/1 + its hours; Martinsburg 4.7/6 + its hours; never blended).
- JSON validity: videos.json, datasets-videos.json, ai-sitemap.json all parse; the in-div block parses and equals datasets-videos.json.
- No quote test post (standing rule — verify by page/syntax checks only).

## Live verification (after deploy, every changed URL — no sampling)

- https://theflatratemovers.com/videos/ → 200, own slug content (hero "Videos — real moves, on video."), six embeds present, tagline + "Get My Flat Rate Quote" present, 0 "DESIGN 6", quote markers intact sitewide.
- https://theflatratemovers.com/videos.json → 200 + application/json, 8 graph nodes (1 WebPage/CollectionPage, 6 VideoObject, 1 BreadcrumbList).
- https://theflatratemovers.com/datasets-videos.json → 200 + application/json, 6 VideoObject nodes, no uploadDate/duration fields.
- Sitemap count = N+1 with the videos loc present; ai-sitemap hasPart = N+1.
- Inbound links from backlinks.md resolve and render (Developer card, all-pages entry, the five hub links).
- Prior live files undisturbed: datasets-residential/commercial/gun-safe/office still application/json; graphs at their post-office counts (recompute — do not assume staging numbers).

## GitHub (same motion as deploy, read-back verified)

- **theflatratemovers-ai:** public/videos.json (as schemas/videos.json per repo layout), public/datasets-videos.json (as data/datasets-videos.json per repo layout), llms.txt, data txt, ai-sitemap.json. Gist graph `data/entity-graph.json` NEVER overwritten — verify its byte size before and after.
- **the-flat-rate-machine:** this package (out/pages/videos-page/ complete), the research doc copy, data/pages.json (updated registry), and the deploy report. Backups and the rubric.db binary are NOT pushed (established pattern).

## Indexing target (for Mira's Search Console pass — the deploy batch does not do GSC)

- **https://theflatratemovers.com/videos/** — the single new URL. (Plus, only if not already submitted by the office/local-regional passes: their recorded targets stand separately; do not bundle.)

## Deviations to expect / decide at merge

- If the live page count moved past 153 before this deploy (e.g. storage activation landed first), all N figures above recompute; the videos page still adds exactly +1 page and +0 services.
- If any YouTube title changed since 2026-10-29, the oEmbed spot-check in pre-flight catches it; update div + schema + datasets + content.md together or hold that one card — never ship a heading that differs from the video's current published title.
