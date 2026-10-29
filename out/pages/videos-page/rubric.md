# Rubric — Videos page (NEW page, staged)

Page: Videos — Moving & Heavy-Asset Work on Video.
Slug: `videos` (collision-free in the live sitemap's 153 URLs and in data/pages.json's 153 slugs, checked 2026-10-29). Canonical: https://theflatratemovers.com/videos/. Div: `page-videos`.
Service node: **none** — collection page; pageMeta `svc: null` by the non-service-page precedent (all-pages, services, quote, developer, knowledge-*, docs index), registry type `page`, services `[]`.
Research doc: ~/workspace/theflatratemovers/videos-page-research-2026-10-29.md (per-video verification table with per-field sources).
Staged: 2026-10-29. Status: READY pending deploy-time R7 re-check (see R7). Go-live bar: R1–R5 = 3, R6–R7 ≥ 2.

## Scores

| Rubric | Score | Basis |
|---|---|---|
| R1 Audience & topic | 3 | One intent: show the company's real work on video. Audience = prospective customers verifying the mover before requesting a quote (the page Henry directed on 2026-10-29: "make and published the page with full json, html and descriptions llms txt files, all"). Six videos, each verified as the company's own published work, grouped by verified scope (household ×1, gun safe ×3, commercial final-mile/white-glove ×1, medical heavy-asset ×1). No competing page exists (no "video" URL among the 153 live URLs), so no cannibalization. |
| R2 Node chain | 3 | WebPage/CollectionPage `#webpage` → publisher Organization `#organization` → hasPart → 6 × VideoObject, each with publisher + provider = `#organization`; BreadcrumbList Home › Videos. No service node is claimed (collection page, svc:null precedent), no Place chain is duplicated onto the page (branch facts live in the standard closing card, as on all pages), no org-level rating, branches never blended. Every VideoObject @id is stable: canonical page URL + `#video-<youtube id>`. |
| R3 Graph & visible match | 3 | Each VideoObject `name` is the card heading verbatim (the video's own published title); each VideoObject `description` is the card paragraph verbatim (content.md is extracted from the div draft for exactly this diff). The in-div JSON-LD block is parse-equal to datasets-videos.json, and its VideoObjects are node-identical to schema.json's. The WebPage description equals the pageMeta desc. No schema-only claim exists. |
| R4 Attestation | 3 | Every fact carries a source + date (fact table below; full per-field sourcing in the research doc). Video facts come from YouTube's own oEmbed endpoint and the videos' own YouTube pages, both fetched 2026-10-29. Branch facts carry the standing GBP/Places sources. The owner's flat-rate terms line is dated 2026-10-29. |
| R5 No invented data | 3 | Duration and upload date are UNVERIFIED for all six videos and are **omitted**, not estimated (Shorts are not assumed to be ≤60s or any other length). No view counts anywhere. No client is named (the one commercial-client video names none in its verified description). No price beyond the owner's stated flat-rate terms; no discount, testimonial, contract, clearance, or availability claim; no USDOT/MC number; no license details. Scopes are assigned only from verified titles/descriptions. |
| R6 Images / media, honest | 2 | Embeds are the company's own public YouTube videos, played through YouTube's own (nocookie) player, each captioned in the page as the company's own published video — never presented as anything else. All six thumbnails verified as real images (HTTP 200, image/jpeg, 2026-10-29). The page header image is the owner-approved logo, captioned as a brand image, not a job photo. **Why 2, not 3:** faces and on-camera content inside the videos cannot be assessed from metadata — no tool used in this build inspects frames. The videos are the company's own public posts, so embedding republishes the company's own public content, but the face/content check is a human watch-through, not something this package can verify or score away. Meets the ≥2 bar; flagged in the research doc as the standing privacy flag. |
| R7 Quote path | 2 | Pattern follows the live pages exactly: hero CTA "Get My Flat Rate Quote" → #/quote; closing-card quote line with the Short (Quick Quote) default / Detailed Project toggle described; FAQ quote answer with the pill wording "Get a flat rate quote"; the toggle itself is the sitewide quote-form implementation (Short/Detailed switching in place, From/To/What's moving preserved). Scored 2, not 3, until the deploy-time live re-check (page/syntax check only — no test post is ever sent). |

## Fact table (every fact, source + date)

| Fact | Source + date |
|---|---|
| All six videos are published by "The Flat Rate Movers" on https://www.youtube.com/@theflatratemovers | YouTube oEmbed responses (`author_name`, `author_url`) for all six IDs, fetched 2026-10-29 |
| Each video's title (verbatim, used as card heading + VideoObject name) | oEmbed + the video's YouTube page, 2026-10-29 (identical in both sources) |
| Each video's description (basis of card copy) | The video's own published description on its YouTube page, fetched 2026-10-29 (full text in research doc) |
| Scopes: household (29L981tzn5E); gun safe (Z7Im5nR--AQ, HLGSTQ5byxM, _W6wheqTGIE); commercial final-mile/white-glove installation (1S5Tux0-4lM); medical/sensitive equipment (AX4oWENjxJo) | Verified titles + descriptions, 2026-10-29 |
| Weights stated in copy: 1,500 lb safe (Z7Im5nR--AQ), 900 lb Browning ProSteel 1878 Series safe (_W6wheqTGIE), 1,800 lb locker system in 5 crates (1S5Tux0-4lM) | The videos' own titles/descriptions, 2026-10-29 |
| Thumbnails https://i.ytimg.com/vi/<id>/hqdefault.jpg return images | Direct HTTP check (200, image/jpeg) + oEmbed thumbnail_url, 2026-10-29 |
| Duration / upload date | **UNVERIFIED for all six** — oEmbed does not provide them; YouTube page fetches did not state them; ID/title searches returned no stating source (2026-10-29). Omitted everywhere. |
| Company: The Flat Rate Movers LLC; tagline "Guaranteed Flat Rate or Your Move is Free!"; founded June 2010 (no day) | Owner confirmation 2026-10-27; machine data/locations.json attested 2026-10-28 |
| Phone +1-540-422-2153 (both branches) | Places verification 2026-10-27 |
| Winchester: The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601, geo 39.18711576, -78.1668352, Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google 5.0/1 | Places 2026-10-27; GBP check 2026-10-28 |
| Martinsburg: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg WV 25404, geo 39.48319665, -77.94760443, Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google 4.7/6 | Places 2026-10-27; GBP check 2026-10-28 |
| Flat-rate terms line ("review the full scope of each job — distance, manpower, equipment — and give a flat rate as opposed to an hourly rate") | Henry, stated 2026-10-29 |
| Logo assets/img-01-9c77693ba66b.png approved as page image (brand image, not a job photo) | Logo approval 2026-10-28 |
| Slug `videos` free | Live sitemap (153 URLs) + data/pages.json (153 slugs) read 2026-10-29 |
| svc:null precedent for non-service pages | Live pageMeta entries (all-pages, services, quote, developer, knowledge-*, docs) + data/pages.json types, read 2026-10-29 |
| Breadcrumb: sitewide nav#crumb renders "Home › <pageMeta name>" | Live index.html chrome, read 2026-10-29 |

## Gaps (named, not filled)

1. **Duration — UNVERIFIED, omitted.** No source states any of the six durations. Schema carries no `duration`; copy states none. Revisit only if a named source states them.
2. **Upload date — UNVERIFIED, omitted.** Same handling; schema carries no `uploadDate`.
3. **Frame-level content (faces, client property) — unassessable from metadata.** Standing privacy flag (research doc). The videos are the company's own public posts; no verified description names a client. A human watch-through is the only way to close this gap, and it is Henry's call, not a build blocker under the company-channel gate.
4. **GSC demand for a videos page — none measured.** No query data exists for this page (it did not exist in the GSC window). The page is owner-directed; no demand figure is claimed for it anywhere in the package.
