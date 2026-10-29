# Rubric — Warehouse Relocation (staged, Phase C)

Page: Warehouse Relocation — Winchester VA & Martinsburg WV. Slug: `warehouse-relocation`. Canonical: https://theflatratemovers.com/warehouse-relocation/
Staged: 2026-10-29. Status: READY pending deploy-time R7 re-check (see R7). Go-live bar: R1–R5 = 3, R6–R7 ≥ 2.

## Scores

| Rubric | Score | Basis |
|---|---|---|
| R1 Audience & topic | 3 | Audience named and sourced: warehouse operators, distribution and 3PL operations, manufacturers, and project managers, contractors, and operations buyers. Evidence: SERP #1 "warehouse relocation services Virginia" via the industrial page (SERP check 2026-10-29); one page per intent — this dedicated page locks a position currently borrowed from industrial-page content. No standalone GSC query exists yet for this phrase (datasets doc §4 states this honestly); the SERP position is the evidence, not a GSC number. |
| R2 Node chain | 3 | Service #service-warehouse-relocation → provider Organization #organization → Places #winchester + #martinsburg → PostalAddress → GeoCoordinates → OpeningHoursSpecification → areaServed. areaServed is carried on each Place node (GBP lists, distinct) and referenced from the Service via branch @ids. No merged list, no shared areaServed, no org-level rating. serviceType set ("Warehouse Relocation"). |
| R3 Graph & visible match | 3 | Every schema claim has a visible content.md sentence: service name/description (intro), pricing (Standard Job Pricing section), provider/org (tagline + phone), both Place records (branch sections with address, hours, rating, areas), BreadcrumbList (Home › Warehouse Relocation). No schema-only claim. |
| R4 Attestation | 3 | Every fact in the fact table below carries source + date. No fact without a source. |
| R5 No invented data | 3 | Gaps are named, not filled (see Gaps). No price beyond the verified Standard Job Pricing, no discount, no certification, clearance, contract, facility size/location, terminal, drayage-truck, chassis, bonded/FTZ, reefer, or customs-brokerage claim anywhere in content, meta, schema, or dataset node. No USDOT/MC. No license details. SIR mentioned only conditionally (see fact table). |
| R6 Images, honest & beautiful | 3 | Logo approved as brand image (assets/img-01-9c77693ba66b.png, caption "company brand image, not a job photo"). Warehouse photos exist on the industrial page, but this package does not claim them as its own page image; the merge agent may attach a verified face-blurred warehouse photo at merge time if the blurred filenames check out. Precedent: Phase 3 full build and Phase B senior package scored logo pages R6 = 3. |
| R7 Quote path | 2 | Pattern verified: CTA wording "Get My Flat Rate Quote" (main) / "Get a flat rate quote" (pill), Short (Quick Quote) default / Detailed Project toggle switching in place with From/To/What's moving preserved — the live form pattern. Live-form re-check is required at deploy time (no test post ever sent; verification is by page/syntax check only). Hence 2, not 3, until that re-check happens. |

## Fact table (every fact, source + date)

| Fact | Source + date |
|---|---|
| Company: The Flat Rate Movers LLC; tagline "Guaranteed Flat Rate or Your Move is Free!"; founded June 2010 (no day) | Owner confirmation 2026-10-27; machine data/locations.json attested 2026-10-28 |
| Phone +1-540-422-2153 (both branches); email ratemovers@gmail.com (schema only) | Places verification 2026-10-27; Gmail connected 2026-10-28 |
| Winchester: The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601, geo 39.18711576, -78.1668352, Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google 5.0/1 | Places 2026-10-27; GBP check 2026-10-28; locations.json attested 2026-10-28 |
| Martinsburg: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg WV 25404, geo 39.48319665, -77.94760443, Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google 4.7/6 (4×5★, 2×4★) | Places 2026-10-27; GBP check 2026-10-28; locations.json attested 2026-10-28 |
| Winchester GBP areas (16, listed in content + schema) | GBP Business information screenshots supplied by owner 2026-10-27, confirmed 2026-10-28 |
| Martinsburg GBP areas (14, listed in content + schema) | GBP Business information screenshots supplied by owner 2026-10-27, confirmed 2026-10-28 |
| Moorefield 26836 served by both branches | Both GBP area lists above (appears in both) |
| "warehouse relocation services Virginia" SERP #1 via industrial page | Live SERP check 2026-10-29 (plan Phase C evidence; datasets doc §4) |
| Warehouse & Distribution capability; Warehouse Load-Outs & Inbound Unloads GBP product (both branches); supervised warehouse teams; priced per job, no required contract duration | Industrial page live content + GBP products 2026-10-28; plan per-category verified facts 2026-10-29 |
| Standard Job Pricing: Unload $8.00/CWT, Load $10.00/CWT, APU $12.00/CWT, Residential/Driver Meet $400–$425 per man; adjustable for scope, equipment, travel, after-hours agreed before dispatch | Industrial page live content, verified 2026-10-28/29 (quoted verbatim) |
| Warehouse moves "planned around the site itself — access, floor space, staging and equipment handling"; transload staging; restacking | Live industrial page content, fetched 2026-10-29 |
| Dispatch on I-81/I-66/I-70 from both branches | Corridor pages + full-build authorization 2026-10-28 |
| SIR applies to high-mass assets 1,500–3,500 lbs, floor deflection L/360 | Company thesis, verified 2026-10-27; used here ONLY conditionally (see Gaps) |
| Quote toggle: Short (Quick Quote) default / Detailed Project, in-place switch, preserved inputs; CTA wording | Live form implementation, verified 2026-10-27/28; quote-test rule (no test posts) 2026-10-28 |
| Logo file assets/img-01-9c77693ba66b.png, approved as brand image | Logo approval 2026-10-28 |
| Dataset license CC BY 4.0, attribution to The Flat Rate Movers | Datasets research doc §1, 2026-10-29 |

## Gaps (named, not filled)

1. **No standalone GSC query yet.** The position evidence is the SERP check, not a GSC query row. GSC re-pull after deploy (Phase H) is the first read on this phrase.
2. **No facility size, location, or client claim** — none verified; none stated. No warehouse square footage, no named facility, no client or case study.
3. **No equipment inventory claimed.** Forklifts and track loaders appear in industrial-page photo captions, but no equipment list is claimed for warehouse relocation; equipment actually deployed is an open attestation question (ocean doc pattern).
4. **No drayage, chassis, bonded/FTZ, reefer, or customs claim** — none verified; none stated. Drayage/chassis/bonded/FTZ questions are gated in the ocean doc and stay gated here.
5. **SIR conditional only.** SIR/KIM-GS is a high-mass method (1,500–3,500 lbs). Content and schema mention it only for warehouse moves that actually involve such an asset. No general "warehouse moves use SIR" claim.
6. **Extended footprint not included.** Content + schema use the GBP area lists only (Winchester 16, Martinsburg 14), matching the Phase B senior package pattern. The extended footprint (Winchester +15, Martinsburg +21 per footprint.json / GeoJSON) is NOT in this staged draft; the merge agent expands to the full footprint per the full-build authorization, keeping the two branches' lists distinct.
7. **R7 live re-check pending.** Quote-toggle behavior must be re-checked on the live form at deploy time (pattern verified, live re-check outstanding). No test post will be sent.
8. **GBP warehouse service addition is Phase G, not this package.** Warehouse Load-Outs & Inbound Unloads already exist as GBP products on both branches (2026-10-28); any further GBP warehouse service addition waits for the Phase G batch. No GBP edit is made or claimed here.
