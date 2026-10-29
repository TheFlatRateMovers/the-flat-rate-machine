# Videos page — deploy batch report (2026-10-29)

**Result: DEPLOYED + LIVE-VERIFIED.** Deploy URL: https://6cdc97d3.the-flat-rate-movers.pages.dev (custom domain https://theflatratemovers.com verified serving the same build). Wrangler uploaded exactly the 7 changed public files (96 already uploaded).

## Pre-flight (recomputed from current live state, post-local-regional)
- Baseline confirmed before edits: pages 153 / services 22 / sitemap 153; head 24 / entity 32 / best 78; ai-sitemap 22 services / 153 hasPart / 40 keywords (public) — staged phase-a copy 22 keywords by design; public JSON files 43; DB service 31 / attestation 73 / edge 40 / opening_hours 14 / service_area 66 / rubric_check 7, integrity ok; verify.js 71/71.
- oEmbed spot re-fetch (merge-note pre-flight): 29L981tzn5E + _W6wheqTGIE — titles unchanged, author "The Flat Rate Movers", channel https://www.youtube.com/@theflatratemovers. No card/schema updates needed.
- Gist graph BEFORE: data/entity-graph.json SHA cda897e61319a0f52172ef1365402e4d7179cddf (2,486 bytes).

## Reconciliation (merge-note step → disposition)
| Step | Disposition |
|---|---|
| 1. Backups | (a) Done — out/videos-deploy/backup-2026-10-29/ (index.html, sitemap.xml, ai-sitemap.json, llms.txt, data txt, pages.json, rubric.db), never pushed |
| 2. Page div before `<footer>` | (a) Done as written — draft inserted byte-for-byte (incl. in-div JSON-LD); page divs 153 → 154 |
| 3. pageMeta entry | (a) Done — `videos:{name, svc:null, canonical, desc}` in the single-quoted format; apostrophes escaped per file convention (`Movers\'`, `company\'s`); entry inserted at the object close (anchor: the `};` before `setPageLD`) after a brace-scan approach proved unreliable against mixed quote styles in the object — node evaluation confirms the object parses, 154 keys, svc null |
| 4. Router/registry | (a) Confirmed — router toggles `page-<key>` divs from the page key set; `#/videos` → `page-videos` by the standard mechanism |
| 5. videos.json + datasets-videos.json | (a) Done — byte copies of package schema.json / datasets-videos.json. Neither file carries a dateModified (checked), so nothing was stamped and no date was invented |
| 6. sitemap.xml +1 | (a) Done — one line added before `</urlset>`, lastmod 2026-10-29; 153 → 154 locs |
| 7. ai-sitemap hasPart +1 | (a) Done — entry in the established form appended; services 22 unchanged; keywords unchanged (public 40, staged 22); the description's current-state clause updated 153 → 154 clean canonical URLs (verify.js asserts this clause equals the registry total) |
| 8. llms.txt page line + dated entry | (a) Done — merge-note's line verbatim after the Transloading Services line; dated `## Update — 2026-10-29 (videos page)` section appended; sitemap clause count 153 → 154; all earlier dated history byte-identical |
| 9. Data txt dated entry | (a/c) Done + two current-state count lines updated (live-site line + "Sitemap now …" line, 153 → 154); dated history sections untouched |
| 10. Developer card + backlinks | (a) Done — "Videos data" card after the Local & Regional card (6 VideoObjects, 0 Dataset / 0 Service / 0 Article, files videos.json + datasets-videos.json); all-pages chip added beside Developer/Docs collection entries; the five hub links inserted with backlinks.md's exact anchors |
| 11. pages.json registry | (a) Done — entry per merge-note (type "page", services []), count 153 → 154 |
| 12. Rubric DB rows | (a) Done — 8 attestation rows (page publication; one per video with ID + verified title + channel + scope; one recording the duration/upload-date omission). No rubric_check rows, no edge rows. Attestation 73 → 81; integrity ok. DB edited in place (backup taken first) |
| 13. Head/entity/best graphs | (a) NO change, as specified — live counts re-verified after deploy: head 24, entity 32, best 78 |
| Sitemap page (site page, not in merge-note) | (c) Reconciled — the sitemap *page* is a current-state index: its counts updated (153 → 154 canonical pages; 263 → 264 live URLs accounted) and a Videos row added after the Browse All Pages row, so the page's own list matches the sitemap it describes |
| Phase-A staged copies (out/phase-a/) | (c) Mirrored for verify.js parity — staged ai-sitemap.json got the same hasPart entry + description count; staged llms.txt got the count clause (154). The staged files are verify artifacts, maintained separately from the public files by design |

## Counts before → after
- Pages 153 → 154; services 22 → 22; sitemap locs 153 → 154; ai-sitemap hasPart 153 → 154; keywords 40 → 40 (public), 22 → 22 (staged); public JSON files 43 → 45; page divs 153 → 154; pageMeta keys 153 → 154.
- DB: attestation 73 → 81 (+8); service 31, edge 40, opening_hours 14, service_area 66, rubric_check 7 — all unchanged; integrity ok.
- Graphs: head 24, entity 32, best 78 — unchanged.

## Gate (pre-deploy)
- node --check BOTH inline scripts: OK (885 + 123,395 chars; growth = the pageMeta entry only). All 8 ld+json blocks in index.html parse. pageMeta evaluated in node: 154 keys, videos svc null.
- Forbidden scans (new vs backup): zero delta for uploadDate, "duration" key, viewCount tokens, USDOT, Spearman, Around Town, DESIGN 6, bare "flat quote", attest*, subcontract, "crew page", gated — in index.html, llms.txt, data txt, ai-sitemap.json, sitemap.xml; videos.json + datasets-videos.json scan all-zero. (One apparent delta explained: the word "reviews" in the div's closing card matches a naive `views` substring scan; actual viewCount tokens = 0.)
- In-div JSON-LD parse-equal to datasets-videos.json (asserted pre-deploy on the merged files, re-verified live).
- verify.js pre-deploy: 69/71 — the only two failures were the live-sitemap set-equality checks naming exactly the videos URL (live 153 vs registry 154), the expected state before the deploy flips them. No check was weakened. Post-deploy: **71/71 PASS**.

## Live verification (every changed URL + regression set, no sampling)
- https://theflatratemovers.com/videos/ → 200 text/html; served index carries page-videos with 6 youtube-nocookie embeds, hero "Videos — real moves, on video.", tagline, "Get My Flat Rate Quote"; 154 page divs; 0 "DESIGN 6"; quote markers heroQuote/quoteForm/hqWalk/qWalk intact.
- https://theflatratemovers.com/videos.json → 200 + application/json, 8 graph nodes (WebPage/CollectionPage, 6 VideoObjects, BreadcrumbList); zero uploadDate/duration/viewCount keys.
- https://theflatratemovers.com/datasets-videos.json → 200 + application/json, 6 VideoObject nodes; in-div JSON-LD parse-equal to the live file.
- Sitemap live: 154 locs, /videos/ present once. ai-sitemap live: 22 services / 154 hasPart / 40 keywords.
- Regression set, all 200 + application/json with unchanged node counts: datasets-residential (8), datasets-commercial (8), datasets-gun-safe (18), datasets-office (8), datasets-local-regional (8), residential-moving.json (5), commercial-moving.json (5), gun-safe-movers.json (5), commercial-office-moving-2.json (5), local-regional-moving.json (5), entity-graph.json (32), best-json-entity-graph.json (78).
- llms.txt + the-flat-rate-movers-data.txt live with the videos page sections.
- DB after: attestation 81, integrity ok (local working copy, as deployed batches record it).

## GitHub (same motion, read-back verified)
- theflatratemovers-ai: llms.txt, ai-sitemap.json, the-flat-rate-movers-data.txt (root), schemas/videos.json, data/datasets-videos.json. Commit hash reported in the batch handoff.
- the-flat-rate-machine: data/pages.json, out/phase-a/ai-sitemap.json, out/phase-a/llms.txt, out/pages/videos-page/ (complete package, 9 files), out/videos-deploy/ (build script, this report, research-doc copy). Backups + rubric.db binary NOT pushed.
- Gist graph data/entity-graph.json: SHA verified after the pushes — unchanged (see handoff).

## Indexing target (for Mira's Search Console pass — not done by this batch)
- https://theflatratemovers.com/videos/

## Deviations / incidents
- (c) items above only: sitemap-page count reconciliation + row (not in the merge-note, required by "counts reconciled everywhere"); phase-a staged mirrors; data-txt current-state count lines. No failed runs; the first merge-script run aborted safely on a pageMeta brace-scan assertion before any file was written, and the anchor-based insert replaced it. No quote test post. No other package touched.
