# Rubric — Residential Moving deep-data package (staged, residential deep program)

Page (EXISTING — no new slug): Residential Moving.
Slug: `residential-moving`. Canonical: https://theflatratemovers.com/residential-moving/
Service node (NEW, staged): https://theflatratemovers.com/#service-residential
Research doc: ~/workspace/theflatratemovers/residential-deep-datasets-2026-10-29.md (D1–D8, full depth)
Staged: 2026-10-29. Status: READY pending deploy-time R7 re-check (see R7). Go-live bar: R1–R5 = 3, R6–R7 ≥ 2.
This is a NODE + DATASETS package, not a new page: the residential page exists (620 words, FAQ section, 1,997 GSC impressions at position 78.5) and its problem is position, not existence. The package fixes the graph defect (machine graphs contain ZERO "service-residential" occurrences; the head graph holds only a thin node) and supplies the full D1–D8 datasets.

## Scores

| Rubric | Score | Basis |
|---|---|---|
| R1 Audience & topic | 3 | Audiences named per persona with triggers: renters (apartment access), first-home buyers, growing families, downsizers, job relocators, closing-driven movers. Sources: GSC queries ("movers near me" 246 @ 5.0, 11 clicks — best click source; Winchester cluster 727/424/408/131/129 @ 9.0–23.7; "moving" 146 @ 1.0; "moving and storage" 85 @ 1.0) + research doc §2 + §6/D6, 2026-10-29. One intent, one existing hub page — no duplicate page created, with evidence (see content-note.md). |
| R2 Node chain | 3 | Service #service-residential → provider Organization #organization → Places #winchester + #martinsburg → PostalAddress → GeoCoordinates → OpeningHoursSpecification → areaServed. areaServed is carried on each Place node (GBP lists 16/14 in this staged draft; merge expands to the full footprint 31/35 per the full-build authorization) and referenced from the Service via branch @ids. No merged list, no shared areaServed, no org-level rating. serviceType set ("Residential Moving"). Fixes the machine-graph defect: 0 occurrences in entity-graph.json and best-json-entity-graph.json today; the thin head node is upgraded to this chain at merge (same @id, no duplicate). |
| R3 Graph & visible match | 3 | Every schema claim has a visible sentence on the EXISTING residential page: service name/description (hero + "Houses & apartments"), provider/org (tagline + phone), packing options ("Packing, your way"), heavy pieces (conditional SIR), one price in writing ("One price, in writing"), branch card, FAQ section ("Residential questions, answered"). No schema-only claim. Dataset fields trace to page sentences or to labeled domain facts (research doc §6). |
| R4 Attestation | 3 | Every fact in the fact table below carries source + date. No fact without a source. Domain facts are labeled domain in the research doc and cite web research 2026-10-29. |
| R5 No invented data | 3 | Gaps are named, not filled (see Gaps). No price beyond flat-rate-in-writing, no discount, no deposit, no move count, no testimonial, no certification, clearance, contract, or facility claim anywhere in schema or datasets. No USDOT/MC. No license details. No storage service invented from the "moving and storage" query. No valuation offering claimed (domain explainer only). No apartment-specific capability claimed. SIR mentioned only conditionally for 1,500–3,500 lb assets, exactly as the existing page frames it. |
| R6 Images, honest & beautiful | 3 | Logo approved as brand image (assets/img-01-9c77693ba66b.png, caption "company brand image, not a job photo"). The existing residential page's photos are style examples, honestly captioned with credits (A Ray of Sunlight, Bright Mover) — verified in the live div extract 2026-10-29; never company work, never mislabeled. No residential job photo has been supplied, so no job photo is claimed. Precedent: Phase 3 full build and Phase B/C packages scored logo pages R6 = 3. |
| R7 Quote path | 2 | Pattern verified from the live page and form: CTA wording "Get My Flat Rate Quote" (main) / "Get a flat rate quote" (pill), Short (Quick Quote) default / Detailed Project toggle switching in place with From/To/What's moving preserved, film-only survey room with human-made estimate. Live-form re-check is required at deploy time (no test post ever sent; verification is by page/syntax check only). Hence 2, not 3, until that re-check happens. |

## Fact table (every fact, source + date)

| Fact | Source + date |
|---|---|
| Company: The Flat Rate Movers LLC; tagline "Guaranteed Flat Rate or Your Move is Free!"; founded June 2010 (no day) | Owner confirmation 2026-10-27; machine data/locations.json attested 2026-10-28 |
| Phone +1-540-422-2153 (both branches); email ratemovers@gmail.com (schema only) | Places verification 2026-10-27; Gmail connected 2026-10-28 |
| Winchester: The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601, geo 39.18711576, -78.1668352, Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google 5.0/1 | Places 2026-10-27; GBP check 2026-10-28; locations.json attested 2026-10-28 |
| Martinsburg: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg WV 25404, geo 39.48319665, -77.94760443, Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google 4.7/6 (4×5★, 2×4★) | Places 2026-10-27; GBP check 2026-10-28; locations.json attested 2026-10-28 |
| Winchester GBP areas (16, in schema Place node; full footprint 31 at merge) | GBP Business information screenshots supplied by owner 2026-10-27, confirmed 2026-10-28; footprint.json / GeoJSON 52 features |
| Martinsburg GBP areas (14, in schema Place node; full footprint 35 at merge) | GBP Business information screenshots supplied by owner 2026-10-27, confirmed 2026-10-28; footprint.json / GeoJSON 52 features |
| Moorefield 26836 served by both branches | Both GBP area lists above (appears in both) |
| Residential service registry entry: "Residential Moving", "Flat-rate house and apartment moving, local, regional and long-distance.", pageCount 11 | Machine data/services.json, attested 2026-10-28 |
| 11 pages carry service-residential (hub + 4 category pages + 6 guide pages) | Machine data/pages.json + live sitemap 150 URLs, fetched 2026-10-29 |
| Residential page: 620 words, 10 headings, FAQ section "Residential questions, answered", style-example photos with credits | Live index.html div id="page-residential", extracted 2026-10-29 |
| Residential pageMeta desc (verbatim, used as schema description) | Live index.html pageMeta, fetched 2026-10-29 |
| Head graph thin node: name, serviceType "Residential moving", provider @id, 6 broad areaServed strings, description — no Place chain | Live index.html head JSON-LD, extracted 2026-10-29 |
| Machine graphs: 0 "service-residential" occurrences in entity-graph.json AND best-json-entity-graph.json | Machine data files, grep 2026-10-29 |
| GSC residential demand: residential-moving 1,997 imp @ 78.5; "moving" 146 @ 1.0, 0 clicks; "moving and storage" 85 @ 1.0; "movers near me" 246 @ 5.0, 11 clicks; "local moving" 4 @ 1.0; "apartment moves" 3 @ 1.0; Winchester cluster 727 @ 11.6 (5 clicks), 424 @ 12.9, 408 @ 18.0, 131 @ 9.0, 129 @ 23.7; "movers martinsburg wv" 123 @ 8.9 | GSC 3-month pull to 2026-10-27, read 2026-10-29 |
| Residential page published scope: whole-home + apartment moves every size; loading/transport/unloading; furniture protection + careful placement; disassembly/reassembly of standard furniture planned up front; full/partial/fragile-only packing + unpacking; white-glove antiques/high-value; custom crates; heavy pieces under SIR/KIM-GS; one price in writing; no hourly meter | Live residential page div, extracted 2026-10-29 |
| Quote toggle: Short (Quick Quote) default / Detailed Project, in-place switch, preserved inputs; CTA wording; survey room film-only, human-made estimate | Live form implementation, verified 2026-10-27/28; quote-test rule (no test posts) 2026-10-28 |
| Logo file assets/img-01-9c77693ba66b.png, approved as brand image | Logo approval 2026-10-28 |
| Dataset license CC BY 4.0, attribution to The Flat Rate Movers | Datasets research doc §1, 2026-10-29; never-light rule 2026-10-29 |
| Domain facts (process chain, taxonomy, flat-vs-hourly, binding/non-binding/not-to-exceed, FVP vs RVP $0.60/lb, local under 50–100 miles, booking windows, peak season May–Sep ~60–70%, apartment access) | Web research 2026-10-29 (mover process guides; American Van Lines flat-vs-hourly; FMCSA Your Rights and Responsibilities; moveBuddha peak-season statistics) — all labeled domain in the research doc, none presented as company facts |

## Gaps (named, not filled)

1. **Storage service — EXCLUDED.** "Moving and storage" (85 @ 1.0) has no published storage service behind it (4 "storage" mentions, no page/product/terms). No storage page, node, or dataset field exists until Henry answers research doc §8 Q1.
2. **Valuation offering — EXCLUDED.** D5/D7 explain Full Value vs Released Value as domain education only. The company offers no stated valuation product in any dataset until Henry answers §8 Q2. Valuation is never called "insurance" in company copy.
3. **Apartment-specific capability — EXCLUDED.** No apartment crew, equipment, or access capability claimed. The apartment follow-up page needs §8 Q3 before claiming anything beyond published house/apartment scope.
4. **Same-day / next-day local availability — EXCLUDED.** Domain pattern says local moves are typically one-day jobs; company availability is not claimed (§8 Q4).
5. **Debris removal scope for residential — EXCLUDED.** Debris removal exists as a GBP category and industrial pattern; residential scope is unattested (§8 Q5).
6. **Estate-move attachment — MERGE DECISION.** estate-relocation sits under the packing service. Recommendation: cross-link from the residential node, do not re-parent the page (§8 Q6).
7. **Prohibited-items list — EXCLUDED.** None published; none invented (§8 Q7).
8. **Residential pricing beyond flat-rate-in-writing — EXCLUDED.** No price, minimum, deposit, or discount stated (§8 Q8).
9. **Extended footprint not in staged schema Place nodes.** Staged draft uses GBP lists only (16/14), matching the senior/warehouse/transloading pattern. Merge expands to the full footprint (Winchester 31, Martinsburg 35, shared 14) per the full-build authorization, keeping branches distinct.
10. **R7 live re-check pending.** Quote-toggle behavior must be re-checked on the live form at deploy time (pattern verified, live re-check outstanding). No test post will be sent.
11. **GBP residential service addition is Phase G, not this package.** No GBP edit is made or claimed here.
12. **Per-page JSON for residential-moving is a merge-time item.** Verify the new-page JSON serving path at merge (old .json URLs return SPA fallback HTML and do not count).
