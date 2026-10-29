# Rubric — Commercial Moving deep-data package (staged, all-categories deep program)

Page (EXISTING — no new slug): Commercial Moving.
Slug: `commercial-moving`. Canonical: https://theflatratemovers.com/commercial-moving/
Service node (FULL, staged): https://theflatratemovers.com/#service-commercial
Research doc: ~/workspace/theflatratemovers/commercial-deep-datasets-2026-10-29.md (D1–D8, full depth)
Staged: 2026-10-29. Status: READY pending deploy-time R7 re-check (see R7). Go-live bar: R1–R5 = 3, R6–R7 ≥ 2.
This is a NODE + DATASETS package, not a new page: the commercial-moving page exists, carries 2,013 GSC impressions at position 53.4 with AI-feature 34, and its problem is position, not existence. The package fixes the graph fragmentation (thin head node + string-area fragment node + page-slug nodes, no single full chain) and supplies the full D1–D8 datasets.

## Scores

| Rubric | Score | Basis |
|---|---|---|
| R1 Audience & topic | 3 | Audiences named per persona with triggers and buying criteria: business owners, operations managers, facility managers, project managers, office managers; triggers lease end/renewal, expansion, consolidation, renovation/build-out gap, new premises; criteria downtime first, hidden-cost fear second, coordination gaps third, price certainty fourth. Sources: live commercial page ("Who commercial moving is for") + GSC (commercial-moving 2,013 @ 53.4, AI 34; "corporate movers winchester va" 123 @ 32.1; "business moving companies near me" 1.0) + research doc §2 + §6/D6, 2026-10-29. One intent, one existing hub page — no duplicate page created, with evidence (see content-note.md). |
| R2 Node chain | 3 | Service #service-commercial → provider Organization #organization → Places #winchester + #martinsburg → PostalAddress → GeoCoordinates → OpeningHoursSpecification → areaServed. areaServed is carried on each Place node (GBP lists 16/14 in this staged draft; merge expands to the full footprint 31/35 per the full-build authorization) and referenced from the Service via branch @ids — correcting the current fragment node's 31 flat strings (GBP + extended + ports + corridors mixed). No merged list, no shared areaServed, no org-level rating. serviceType set ("Commercial Moving"). Fixes the fragmentation: thin head node upgraded to this chain at merge (same @id, no duplicate); best graph gains the fragment node it lacks; entity-graph string-area node upgraded to this chain. |
| R3 Graph & visible match | 3 | Every schema claim has a visible sentence on the EXISTING commercial page: service name/description (hero "Business moves, planned around your operation"), provider/org (tagline + phone), freight chain (container loading, transloading, final-mile, warehouse/transload staging), heavy pieces (SIR/KIM-GS conditional, to 3,500 lbs, L/360), branch card (hours by location), FAQ section ("Commercial questions, answered"), quote CTA. No schema-only claim. Dataset fields trace to page sentences, labeled cross-refs, or labeled domain facts (research doc §6). |
| R4 Attestation | 3 | Every fact in the fact table below carries source + date. No fact without a source. Domain facts are labeled domain in the research doc and cite web research 2026-10-29. |
| R5 No invented data | 3 | Gaps are named, not filled (see Gaps). No price beyond flat-rate-in-writing, no hourly rate as a company rate, no discount, no deposit, no move count, no testimonial, no client name, no contract, clearance, downtime guarantee, SLA, certification, or facility claim anywhere in schema or datasets. No USDOT/MC. No license details. No CWT pricing inside commercial datasets (CWT lives in industrial-commercial only, cross-referenced). No after-hours/weekend offering, COI issuance, coordinator, IT scope, installation scope, crew-size rule, or coverage offering claimed. SIR mentioned only conditionally for high-mass assets, exactly as the existing page frames it. |
| R6 Images, honest & beautiful | 3 | Logo approved as brand image (assets/img-01-9c77693ba66b.png, caption "company brand image, not a job photo"). The existing commercial page's photos are honestly described: a credited Downtown Winchester photo (Sarah Stierch, CC BY 4.0, via Wikimedia Commons) and a company-supplied warehouse/transload staging photo — verified in the live div extract 2026-10-29; never mislabeled as job photos they are not. No commercial job photo beyond the staging photo has been supplied, so no job photo is claimed for the node package. Precedent: Phase 3 full build and Phase B/C packages scored logo pages R6 = 3. |
| R7 Quote path | 2 | Pattern verified from the live page and form: CTA wording "Get My Flat Rate Quote" (main) / "Get a flat rate quote" (pill), Short (Quick Quote) default / Detailed Project toggle switching in place with From/To/What's moving preserved, film-only survey room with human-made estimate where applicable. Live-form re-check is required at deploy time (no test post ever sent; verification is by page/syntax check only). Hence 2, not 3, until that re-check happens. |

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
| Commercial service registry entry: "Commercial and Office Moving", "Flat-rate commercial and office relocation.", pageCount 6 | Machine data/services.json, attested 2026-10-28 |
| 6 pages carry service-commercial (hub + branch page + category index + docs/data-center-logistics + IT page + Martinsburg guide) | Machine data/pages.json + live sitemap 153 URLs, fetched 2026-10-29 |
| Commercial page content: hero "Business moves, planned around your operation"; planning sentence (first/last/day-one); freight chain; SIR to 3,500 lbs L/360; government/military cross-ref; FAQs (downtime, freight, flat price); branch hours card; quote CTA | Live index.html div id="page-commercial", extracted 2026-10-29 |
| Commercial pageMeta: svc #service-commercial, canonical commercial-moving/, desc "Flat-rate commercial moving from Winchester, VA and Martinsburg, WV — business relocations planned around your operation, with warehouse-backed staging, loading, transloading and final-mile…" | Live index.html pageMeta, fetched 2026-10-29 |
| Head graph node: #service-commercial, name "Commercial and Office Moving", serviceType "Commercial moving", provider @id, 7 broad areaServed strings, description "Flat-rate commercial and office relocation." — no Place chain, no url | Live index.html head JSON-LD, extracted 2026-10-29 |
| Entity-graph nodes: #service-commercial fragment (string areas, url = commercial-movers-winchester-va) + commercial-moving/#service page-slug node | Machine data/entity-graph.json, inspected 2026-10-29 |
| Best graph: NO #service-commercial fragment node; commercial coverage only as page-slug nodes (commercial-moving/#service, commercial-office-moving-2/#service, commercial-movers-winchester-va/#service) | Machine data/best-json-entity-graph.json, inspected 2026-10-29 |
| GSC commercial demand: commercial-moving 2,013 imp @ 53.4, AI-feature 34; "corporate movers winchester va" 123 @ 32.1; "business moving companies near me" 1.0; "virginia flat rate office moving company" 1.0 | GSC 3-month pull to 2026-10-27, read 2026-10-29 |
| Commercial page photos: credited Downtown Winchester photo (Sarah Stierch, CC BY 4.0, via Wikimedia Commons); company-supplied warehouse/transload staging photo | Live commercial page div, extracted 2026-10-29 |
| Quote toggle: Short (Quick Quote) default / Detailed Project, in-place switch, preserved inputs; CTA wording; survey room film-only, human-made estimate | Live form implementation, verified 2026-10-27/28; quote-test rule (no test posts) 2026-10-28 |
| Logo file assets/img-01-9c77693ba66b.png, approved as brand image | Logo approval 2026-10-28 |
| Dataset license CC BY 4.0, attribution to The Flat Rate Movers | Datasets research doc §1, 2026-10-29; never-light rule 2026-10-29 |
| Domain facts (phasing models, downtime math, building/COI practice, IT coordination checklist, market hourly rates, booking windows, coverage education) | Web research 2026-10-29 (Safe Ship; American Van Lines downtime guide; BTI worksheet; ITIC/Gartner via relocation guides; mover cost guides) — all labeled domain in the research doc, none presented as company facts |
| Industrial Standard Job Pricing (Unload $8.00/CWT, Load $10.00/CWT, APU $12.00/CWT, Residential/Driver Meet $400–$425 per man) | Industrial-commercial page, verified 2026-10-28/29 — cross-referenced ONLY; never commercial-moving pricing |

## Gaps (named, not filled)

1. **After-hours / weekend commercial offering — EXCLUDED.** Page says "planned around your hours" only; no named weekend/after-hours offering is claimed (§8 Q1).
2. **COI issuance — EXCLUDED.** Domain-common, not published; no COI claim (§8 Q2).
3. **Dedicated move coordinator — EXCLUDED.** Domain pattern, not published; no coordinator claim (§8 Q3).
4. **IT scope boundary — EXCLUDED.** IT is its own category; no IT disconnect/reconnect scope claimed for commercial generally (§8 Q4).
5. **FF&E / installation boundary — EXCLUDED.** Installation scope unattested for commercial; FF&E is its own service (§8 Q5).
6. **Crew sizing / minimum job size — EXCLUDED.** None published; none stated (§8 Q6).
7. **Coverage / valuation offering for commercial — EXCLUDED.** Domain FVP/RVP education only; no company coverage claimed (§8 Q7).
8. **Phasing as a named offering — EXCLUDED.** Phasing models are domain options; the planning sentence stays the only phasing language until §8 Q8 is answered.
9. **Client proof — EXCLUDED.** No client name, case study, or testimonial published for commercial; none invented (§8 Q9).
10. **Merge decisions (not claims).** (a) Fragment node url moves from commercial-movers-winchester-va to the commercial-moving hub — needs §8 Q10a approval. (b) Registry entry "Commercial and Office Moving" renamed to "Commercial Moving" — needs §8 Q10b approval. (c) Page-slug nodes left untouched vs consolidated — recommendation: leave alone (§8 Q10c). (d) Downtime-cost explainer page as a Phase E follow-up — needs §8 Q10d approval.
11. **Extended footprint not in staged schema Place nodes.** Staged draft uses GBP lists only (16/14), matching the senior/warehouse/transloading/residential pattern. Merge expands to the full footprint (Winchester 31, Martinsburg 35, shared 14) per the full-build authorization, keeping branches distinct.
12. **R7 live re-check pending.** Quote-toggle behavior must be re-checked on the live form at deploy time (pattern verified, live re-check outstanding). No test post will be sent.
13. **GBP commercial service addition is Phase G, not this package.** No GBP edit is made or claimed here.
14. **Per-page JSON for commercial-moving is a merge-time item.** Verify the new-page JSON serving path at merge (old .json URLs return SPA fallback HTML and do not count).
15. **Legacy commercial-office-moving-2 page content not inventoried.** Sitemap-listed; this package verifies its svc pointer at merge but does not rewrite or claim its content.
