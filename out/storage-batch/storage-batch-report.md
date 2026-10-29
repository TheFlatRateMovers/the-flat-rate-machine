# Moving-and-Storage Activation Batch — Report (2026-10-29)

**Deploy:** https://0a95cf96.the-flat-rate-movers.pages.dev (Cloudflare Pages, project the-flat-rate-movers, from project root)
**Package:** `out/pages/moving-and-storage-deep/` + research doc `moving-and-storage-deep-datasets-2026-10-29.md` (incl. §10/§11 addenda)
**Baseline merged against:** post-long-distance live state (pages 154, services 22, sitemap 154, head 24, entity 32, best 79, ai-sitemap 22/154/44, DB attestation 86, verify.js 71/71)

## What shipped

- **NEW page** `/moving-and-storage/` (slug `moving-and-storage`): full page built from the package `content.md` — hero with tagline + "Get My Flat Rate Quote" CTA, owner-confirmed terms section, who-it-is-for, what-it-includes, 6-step how-it-works, the labeled industry-background section ("Storage, explained") with the not-our-terms disclaimer, per-branch cards (Winchester + Martinsburg, GBP area lists 16/14, hours and ratings distinct), where-we-serve, related-pages chips, all 12 package Q&As, closing service-area card, sources card, and the datasets JSON-LD block as the div's last element (parse-equal to the served datasets file). Div inserted before `<footer>`, exactly once.
- **NEW canonical service node** `#service-moving-and-storage` ("Moving and Storage", hub url https://theflatratemovers.com/moving-and-storage/, package description verbatim, Place chain #winchester/#martinsburg) added to all three graphs — head 24 → 25, entity 32 → 33, best 79 → 80; core fields identical across the three.
- **NEW per-page JSON** `moving-and-storage.json` (5 nodes: Service + Organization + both Places at the full 31/35 footprint with per-branch hours/ratings + BreadcrumbList).
- **NEW datasets file** `datasets-moving-and-storage.json` (8 nodes, all dateModified 2026-10-29; Dataset nodes CC BY 4.0) + matching in-page markup + Developer-page "Moving & Storage data" card with truthful type counts.
- **Registries:** services.json 22 → 23, pages.json 154 → 155. **Sitemap** 154 → 155 (storage URL once). **ai-sitemap** (public + staged): services 23, hasPart 155; public keywords 44 → 47 (service name inserted at registry position + "moving and storage" + "flat rate moving and storage"; none dropped); staged keywords 22 → 23. **llms.txt** (public): Moving & Storage service line + sitemap clause 155 + dated entry; staged llms: clause 155 + registry-description line. **Data txt:** count lines 155 + dated entry appended (history untouched). **Sitemap page:** counts 154 → 155 / 264 → 265 + storage row. **All-pages:** storage chip. **Residential page:** link-in to the new page. **pageMeta:** new entry, svc → #service-moving-and-storage.
- **Rubric DB** (backed up first, edited in place): canonical service row +1 (31 → 32 total, canonical 22 → 23); +7 attestation rows (86 → 93) for the facts this batch newly publishes; edge 40 / opening_hours 14 / service_area 66 / rubric_check 7 unchanged; integrity ok.

## Company terms published (owner-confirmed 2026-10-29, exactly these)

Storage is **leased** (no facility name, location, or lessor; no owned-warehouse claim anywhere); item scope is **any type of items** (owner examples: containers, household goods, machines including robotic arms — item types only, no client named); **30-day minimum** stay; **customers can access** stored items (no notice/hours/attendant rules published — none were stated); **lease terms vary**; pricing basis **per job, monthly, or by volume** — basis only, no rates/ranges/fees. Storage-in-transit is **not claimed**: SIT appears only inside the labeled industry-education section with the explicit not-our-terms framing and the sentence "We describe our storage as leased storage." Industry figures (other movers' vault/SIT pricing) are labeled domain education, never company prices.

## Datasets retype mapping (RETYPE RULE)

| Dataset | Final @type | Title |
|---|---|---|
| D1 operations | Service | Combined Move-and-Store Operations |
| D2 interval-access | Dataset | Storage Interval & Access Operations |
| D3 taxonomy | Dataset | Storage Taxonomy & Item Suitability |
| D4 dispatch-network | Dataset | Dispatch Network & Warehouse Chain |
| D5 terms | Article | Commercial Terms & Cost Drivers |
| D6 personas | Article | Buyer Personas & Trigger Events |
| D7 protection-compliance | Service | Protection, Inventory & Compliance |
| D8 areas-quote | Dataset | Service Areas, Dispatch & Quote Path |

Totals: **Dataset 4 / Service 2 / Article 2**, no FAQPage.

## Reconciliation (merge-note step → disposition)

| Merge-note step | Disposition |
|---|---|
| §1 services.json entry | (c) Description = merge-note text + the confirmed pricing-basis sentence inserted ("Storage is quoted per job, monthly, or by volume.") — §1 predates Henry's pricing answer; source line records the owner terms |
| §2 pages.json entry | (a) As drafted; title from meta.json |
| §3 canonical node → entity + best graphs | (a) Appended — genuinely new service, no pre-existing node to upgrade; also appended to the head graph per the full-propagation rule (one node per graph, identical core fields) |
| §3 per-page JSON | (a) Created (5 nodes); Place areaServed expanded from GBP areas to the full live footprint 31/35 per the standing merge rule |
| §4 DB rows | (c) Service row as written; attestation = 7 rows for facts this batch newly publishes; **no rubric_check row and no edge rows** — standing batch rules supersede the merge-note's proposals |
| §5 datasets file | (a) Built with the retype mapping above; D5's industry figures carry per-figure sources and the domain-only label; SIT not-claimed lines in D2/D5 |
| §6 page build | (a) From content.md in the established page pattern; (c) **router repair**: the `pages` array was missing the `videos` key from the videos batch (proven pre-batch by a stubbed-DOM route test: /videos/ → page-home). This batch adds both `'videos'` and `'moving-and-storage'` at the array tail; post-deploy live route test shows both resolving correctly |
| §7 propagation (ai-sitemap, llms, data txt, Developer, sitemap page, chips) | (a/c) All surfaces updated; llms/data-txt follow the batch convention (service line + dated entry) rather than a pasted D1–D8 section |
| Backlinks | (c) Placed where verified anchors exist: residential page link-in, related-pages chips with verified keys, Developer card; no link targets invented |
| Pricing gate in merge-note | (c) Superseded by Henry's later confirmed answer; basis published, no rates |

## Counts before → after

Pages 154 → 155 · services 22 → 23 · sitemap 154 → 155 · ai-sitemap 22/154/44 → 23/155/47 (staged keywords 22 → 23) · head 24 → 25 · entity 32 → 33 · best 79 → 80 · public JSON files 47 → 49 · DB service 31 → 32 (canonical 22 → 23) · attestation 86 → 93 · edge/opening_hours/service_area/rubric_check unchanged (40/14/66/7), integrity ok · verify.js 71/71 post-deploy.

## Gate + live verification (no sampling)

- node --check on BOTH inline scripts OK. Stubbed-DOM route test on the LIVE-fetched index: /moving-and-storage/ → page-moving-and-storage, /videos/ → page-videos (repair proof), /senior-moving/ regression OK.
- verify.js: pre-deploy 69/71 with exactly the two expected live-sitemap failures; post-deploy **71/71 PASS**.
- /moving-and-storage/ → 200, body carries the div once, hero + tagline present. moving-and-storage.json → 200 + application/json, 5 nodes. datasets-moving-and-storage.json → 200 + application/json, 8 nodes (4 Dataset / 2 Service / 2 Article).
- Live head/entity/best: exactly one storage node each (25/33/80), core fields identical, hub url. Live sitemap 155 locs, storage once. Live ai-sitemap 23/155/47.
- ALL 49 public JSON files → 200 + application/json (full sweep). Index: 0 "DESIGN 6", tagline present, CTA present, quote markers heroQuote/quoteForm/hqWalk/qWalk intact.
- Forbidden scans zero in all new published blocks (bare "flat quote", USDOT, Spearman, Around Town, DESIGN 6, "attest" in new prose, SIT-as-offering patterns, owned-facility patterns). Legacy whole-file counts unchanged: llms "attest" 2 (dated history only), data txt "USDOT" 1 (pre-existing line), index USDOT 0, Bristow 0.
- No quote test posts. Branches distinct everywhere (names, hours 8–6/9–4/9–4 vs 9–6/9–4/9–4, ratings 5.0/1 vs 4.7/6 never blended).

## GitHub (same motion, read-back verified)

- **theflatratemovers-ai:** 7 files — llms.txt, ai-sitemap.json, the-flat-rate-movers-data.txt, data/entity-graph-full.json, data/best-json-entity-graph-full.json, data/datasets-moving-and-storage.json, schemas/moving-and-storage.json. Commit hash in the batch handoff.
- **the-flat-rate-machine:** data/entity-graph.json, data/best-json-entity-graph.json, data/services.json, data/pages.json, out/phase-a/ai-sitemap.json, out/phase-a/llms.txt, out/pages/moving-and-storage-deep/ (8 package files), out/storage-batch/ (build script, this report, research-doc copy). Rubric DB binary and backups NOT pushed.
- **Gist-based ai-repo data/entity-graph.json:** SHA cda897e61319a0f52172ef1365402e4d7179cddf before AND after. Untouched (2,486 bytes).

## Incidents (honest)

1. The first build run failed at the head-graph step — the script assumed a newline after the head `ld+json` tag; the block has none — after the graph/registry sections had written. Every touched file was restored from the run's own backups before re-running (the public ai-sitemap backup had been overwritten by a same-name PHASEA backup copy, so the public ai-sitemap was restored from the live served copy and verified byte-stable at 22/154/44; the script's backup step now uses unique per-path names). The corrected script then ran end-to-end; no partial state was ever deployed.
2. The build's final forbidden-scan pass flagged the package's own FAQ sentence "Our own storage is quoted per job, monthly, or by volume" against an over-broad owned-facility pattern. The sentence distinguishes the company's storage terms from industry figures and claims no facility; the pattern was narrowed to facility-claim forms and the package copy kept verbatim. Final scans: zero.

## Indexing target (recorded only — today's GSC quota queue is full)

- https://theflatratemovers.com/moving-and-storage/ — already #2 in the booked 2026-10-30 09:00 EDT pass queue.
