# Rubric — IT Relocation & Setup lock package (staged, Phase C)

Page (EXISTING — no new slug): IT Equipment Moving & Data Center Logistics — Virginia.
Slug: `it-equipment-moving-data-center-logistics-services-virginia`.
Canonical: https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia/
Service node (NEW, staged): https://theflatratemovers.com/#service-it-relocation
Staged: 2026-10-29. Status: READY pending deploy-time R7 re-check (see R7). Go-live bar: R1–R5 = 3, R6–R7 ≥ 2.
This is a LOCK package, not a new page: the page already ranks #1 for "IT equipment moving setup Winchester VA" on content alone. The package adds the dedicated Service node, the Dataset node, and the per-page JSON the page lacks.

## Scores

| Rubric | Score | Basis |
|---|---|---|
| R1 Audience & topic | 3 | Audience named and sourced: IT managers, offices, and facilities teams in Virginia moving technology that cannot be treated like furniture. Source: live page hero text (fetched 2026-10-29) + SERP #1 "IT equipment moving setup Winchester VA" (2026-10-29) + datasets research doc §4 (IT relocation & setup), 2026-10-29. Topic is one intent, one existing page — no duplicate page created. |
| R2 Node chain | 3 | Service #service-it-relocation → provider Organization #organization → Places #winchester + #martinsburg → PostalAddress → GeoCoordinates → OpeningHoursSpecification → areaServed. areaServed is carried on each Place node (GBP lists, distinct) and referenced from the Service via branch @ids. No merged list, no shared areaServed, no org-level rating. serviceType set ("IT Relocation & Setup"). Fixes the live pageMeta defect: the page currently points at the borrowed #service-commercial node. |
| R3 Graph & visible match | 3 | Every schema claim has a visible sentence on the EXISTING page: service name/description (hero + "Planned as a sequence" + "Handled as high-value" sections), provider/org (tagline + phone), both Place records (branch card with address, hours, rating, areas), BreadcrumbList (Home › IT page). No schema-only claim. The Dataset node restates only page + datasets-doc wording. |
| R4 Attestation | 3 | Every fact in the fact table below carries source + date. No fact without a source. |
| R5 No invented data | 3 | Gaps are named, not filled (see Gaps). No named system, platform, certification, clearance, data-center facility, or IT-specific price anywhere in schema or dataset node. No USDOT/MC. No license details. SIR mentioned only conditionally for 1,500–3,500 lb racks/cabinets, exactly as the existing page already frames it. |
| R6 Images, honest & beautiful | 3 | Logo approved as brand image (assets/img-01-9c77693ba66b.png, caption "company brand image, not a job photo"). No IT job photo has been supplied, so no job photo is claimed. Precedent: Phase 3 full build scored logo pages R6 = 3. |
| R7 Quote path | 2 | Pattern verified from the live page text: CTA wording "Get My Flat Rate Quote" (main), Short (Quick Quote) default / Detailed Project toggle switching in place with From/To/What's moving preserved — stated verbatim in the page's own "Service area, published data & quote" card. Live-form re-check is required at deploy time (no test post ever sent; verification is by page/syntax check only). Hence 2, not 3, until that re-check happens. |

## Fact table (every fact, source + date)

| Fact | Source + date |
|---|---|
| Company: The Flat Rate Movers LLC; tagline "Guaranteed Flat Rate or Your Move is Free!"; founded June 2010 (no day) | Owner confirmation 2026-10-27; machine data/locations.json attested 2026-10-28 |
| Phone +1-540-422-2153 (both branches); email ratemovers@gmail.com (schema only) | Places verification 2026-10-27; Gmail connected 2026-10-28 |
| Winchester: The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601, geo 39.18711576, -78.1668352, Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google 5.0/1 | Places 2026-10-27; GBP check 2026-10-28; locations.json attested 2026-10-28 |
| Martinsburg: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg WV 25404, geo 39.48319665, -77.94760443, Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google 4.7/6 (4×5★, 2×4★) | Places 2026-10-27; GBP check 2026-10-28; locations.json attested 2026-10-28 |
| Winchester GBP areas (16, in schema Place node) | GBP Business information screenshots supplied by owner 2026-10-27, confirmed 2026-10-28 |
| Martinsburg GBP areas (14, in schema Place node) | GBP Business information screenshots supplied by owner 2026-10-27, confirmed 2026-10-28 |
| Moorefield 26836 served by both branches | Both GBP area lists above (appears in both) |
| IT page slug, title, pageMeta desc, canonical | Live index.html fetched 2026-10-29 (pageMeta entry + page div `page-it-equipment-moving-data-center-logistics-services-virginia`); live sitemap 150 URLs fetched 2026-10-29 |
| IT page currently points at borrowed #service-commercial; NO dedicated IT node exists in either graph | Live pageMeta (svc field) + graph scan 2026-10-29: 0 IT hits across entity-graph.json (34 nodes) and best-json-entity-graph.json (69 nodes) |
| SERP #1 "IT equipment moving setup Winchester VA" via this page; GSC adjacent "business moving companies near me" at 1.0 | SERP check 2026-10-29; GSC 3-month pull to 2026-10-27, read 2026-10-29 |
| IT buyer logic: damage/disconnection → system failure + data-access loss; downtime; coordination gaps; wants planned labelled sequence + systems working day one | Datasets research doc §4 (IT relocation & setup), 2026-10-29 |
| Existing page content (407 words): planned labelled sequence, inventory/label before unplug, padded/wrapped/strapped, custom crating, SIR/KIM-GS L/360 for 1,500–3,500 lb racks, office-move context, branch card, GeoJSON 52 features | Live page div text extracted 2026-10-29 |
| Quote toggle: Short (Quick Quote) default / Detailed Project, in-place switch, preserved inputs; CTA wording | Live form implementation, verified 2026-10-27/28; quote-test rule (no test posts) 2026-10-28 |
| Logo file assets/img-01-9c77693ba66b.png, approved as brand image | Logo approval 2026-10-28 |
| Dataset license CC BY 4.0, attribution to The Flat Rate Movers | Datasets research doc §1, 2026-10-29 |

## Gaps (named, not filled)

1. **No named systems, platforms, certifications, clearances, or data-center facilities** — none verified; none claimed. The page names equipment classes only (servers, racks, workstations, network equipment, peripherals).
2. **No IT-specific pricing, SLA, or downtime commitment** — none verified; none stated. Flat rate in writing is the only pricing claim, matching the existing page.
3. **No branch-specific IT dispatch detail** — the page covers Virginia generally with a two-branch card; no claim that a specific branch handles a specific IT job type.
4. **No visible FAQ block on the existing page** — the page has hero + two content sections + branch/quote card only. FAQ entries for IT queries are a Phase E depth item for this page, not added here (this package changes no visible page copy).
5. **Extended footprint not in schema Place nodes** — schema uses the GBP area lists only (Winchester 16, Martinsburg 14), matching the Phase B senior pattern. The page's own card cites the 52-feature GeoJSON. The merge agent may expand Place areaServed to the full footprint per the full-build rule, keeping branches distinct — or keep GBP-only for consistency with the senior package. Either choice must keep the two branches' lists distinct.
6. **R7 live re-check pending.** Quote-toggle behavior must be re-checked on the live form at deploy time (pattern verified from page text, live re-check outstanding). No test post will be sent.
7. **GBP IT service addition is Phase G, not this package.** No GBP edit is made or claimed here.
