# Rubric — Transloading Services — Winchester VA (staged, Phase C)

Page: Transloading Services — Winchester VA. Slug: `transloading-winchester-va`. Canonical: https://theflatratemovers.com/transloading-winchester-va/
Staged: 2026-10-29. Status: READY pending deploy-time R7 re-check (see R7). Go-live bar: R1–R5 = 3, R6–R7 ≥ 2.

## Scores

| Rubric | Score | Basis |
|---|---|---|
| R1 Audience & topic | 3 | Audience named and sourced: importers and distributors, retail and e-commerce, 3PLs/forwarders/brokers, manufacturers, warehouses and DCs, project cargo owners — operations buyers (warehouse/DC managers, logistics managers, project managers) buying on dock reliability, pace, sequencing, and communication. Source: ocean container datasets doc §2 (buyer personas, researched 2026-10-29) + SERP #3 organic "transloading services Virginia port container" (first mover), 2026-10-29. Topic is one page per intent: Winchester transloading gets its own new-format page (the Martinsburg page exists separately; the six container pages cover the topic but no Winchester branch page existed). |
| R2 Node chain | 3 | Service #service-transloading-winchester-va (new stable @id) → provider Organization #organization → Places #winchester + #martinsburg → PostalAddress → GeoCoordinates → OpeningHoursSpecification → areaServed. areaServed is carried on each Place node (GBP lists, distinct) and referenced from the Service via branch @ids. No merged list, no shared areaServed, no org-level rating. serviceType set ("Transloading"). The pre-existing generic #service-transloading node is left untouched by this package; the merge note flags the relationship decision (see Gaps). |
| R3 Graph & visible match | 3 | Every schema claim has a visible content.md sentence: service name/description (intro), provider/org (tagline + phone), both Place records (branch sections with address, hours, rating, areas), BreadcrumbList (Home › Transloading Services — Winchester VA). No schema-only claim. Domain definitions (devanning, cross-dock, decon, drayage, demurrage, detention, chassis) appear as visible text with no performer or capability claim attached. |
| R4 Attestation | 3 | Every fact in the fact table below carries source + date. No fact without a source. Domain facts are labeled as industry terms from the ocean research, not company claims. |
| R5 No invented data | 3 | Gaps are named, not filled (see Gaps). No terminal or ramp name, no drayage-performer claim, no chassis claim, no reefer/bonded/FTZ/customs claim, no container rate (per-container or per-CWT), no facility name or size, no move count anywhere in content, meta, schema, or dataset node. No USDOT/MC. No license details. SIR mentioned only conditionally (see fact table). Container jobs are priced "quoted per job" only. |
| R6 Images, honest & beautiful | 3 | Logo approved as brand image (assets/img-01-9c77693ba66b.png, caption "company brand image, not a job photo"). No transloading job photo has been supplied, so no job photo is claimed. Precedent: Phase 3 full build and Phase B senior package scored logo pages R6 = 3. |
| R7 Quote path | 2 | Pattern verified: CTA wording "Get My Flat Rate Quote" (main) / "Get a flat rate quote" (pill), Short (Quick Quote) default / Detailed Project toggle switching in place with From/To/What's moving preserved — the live form pattern. Container jobs route via the job-details path on the quote form. Live-form re-check is required at deploy time (no test post ever sent; verification is by page/syntax check only). Hence 2, not 3, until that re-check happens. |

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
| Transloading SERP #3 organic "transloading services Virginia port container" (first mover, behind a port specialist and a government directory) | Live SERP check 2026-10-29; datasets research doc §4 (Transloading) |
| "Container moving" emerging in GSC Insights (previously 0); emergency port container recovery page 11 AI-feature impressions | GSC 3-month pull to 2026-10-27, read 2026-10-29 |
| Six dedicated container pages + docs pages + Martinsburg transloading page exist; no Winchester transloading page existed | Ocean container datasets doc §5 (verified live 2026-10-29) + live sitemap check 2026-10-29 (150 URLs) |
| Transloading definition; devanning/destuffing; cross-dock; deconsolidation; drayage (≤100 miles); IPI vs transload; free time/LFD; demurrage; detention/per-diem; chassis/tri-axle; overweight→transload alternative; 40ft ≈ 20 pallet positions, 20ft ≈ 10 | Ocean container datasets doc §§1, 3, 6 (D1, D2, D5), researched 2026-10-29 — domain facts, labeled as such in content |
| Verified company process steps: receive → unload → count → sort by destination → stage → build outbound; quoted → surveyed → packed → loaded → transloaded → delivered → verified placement | Ocean container datasets doc §3 (docs-container-deconsolidation + docs-logistics-event-protocol, published pages) |
| Port chain phrase "Virginia Inland Port and Port of Virginia chain"; three-corridor dispatch I-81/I-66/I-70; final-mile delivery service | Published site content, inventoried 2026-10-29 (ocean doc §§5–6, D4, D8) |
| Container jobs quoted per job, flat rate agreed in writing before dispatch | Company pricing pattern (ocean doc D5, D8); industrial-commercial per-job pattern published 2026-10-28 |
| SIR applies to high-mass assets 1,500–3,500 lbs, floor deflection L/360 | Company thesis, verified 2026-10-27; used here ONLY conditionally (see Gaps) |
| Quote toggle: Short (Quick Quote) default / Detailed Project, in-place switch, preserved inputs; CTA wording | Live form implementation, verified 2026-10-27/28; quote-test rule (no test posts) 2026-10-28 |
| Logo file assets/img-01-9c77693ba66b.png, approved as brand image | Logo approval 2026-10-28 |
| Dataset license CC BY 4.0, attribution to The Flat Rate Movers | Datasets research doc §1, 2026-10-29 |

## Gaps (named, not filled)

1. **Port terminals and ramps — EXCLUDED.** No Port of Virginia terminal and no Virginia Inland Port ramp is named anywhere in content, schema, or dataset node. Competitor pages name terminals; this package does not copy them. Ocean doc attestation question 1.
2. **Drayage performer and chassis — EXCLUDED.** Drayage is defined as a chain step only; this package does not state company trucks, partner carriers, buyer-arranged transport, chassis ownership, or chassis sourcing. Ocean doc attestation question 4.
3. **Container pricing basis — EXCLUDED.** Container jobs are "quoted per job" only. The industrial CWT schedule (Unload $8.00/CWT, Load $10.00/CWT, APU $12.00/CWT, Residential/Driver Meet $400–$425 per man) applies to industrial-commercial project support work; whether it extends to standalone container unloads is an open attestation question and is NOT assumed here. Ocean doc attestation question 3.
4. **Reefer / cold chain — EXCLUDED.** No reefer capability is claimed (0 site mentions). Ocean doc attestation question 5.
5. **Bonded warehouse / FTZ / customs brokerage — EXCLUDED.** None claimed (0 site mentions). Ocean doc attestation question 6.
6. **Equipment actually deployed — EXCLUDED.** No forklift, pallet jack, dolly, or crane claim for container jobs. Ocean doc attestation question 7.
7. **Flat-rack / out-of-gauge scope — EXCLUDED.** No OOG container claim; SIR covers heavy assets only, conditionally. Ocean doc attestation question 8.
8. **Container types actually handled — EXCLUDED.** No handled-type claim from the equipment taxonomy. Ocean doc attestation question 9.
9. **Credential wording — EXCLUDED.** No credential claim is made on this page. The emergency-page URL (which contains a credential-adjacent word) is linked by URL only, with neutral link text; the credential-status question itself is ocean doc attestation question 2 and stays out of publishable files.
10. **Generic transloading node relationship — MERGE DECISION.** The pre-existing #service-transloading node (backing the six container pages + Martinsburg page) is untouched by this package. The merge agent decides whether the new Winchester node stands alone (recommended — one page per intent, matching the senior precedent) or is cross-referenced from the generic node. Do not merge, rename, or remove either @id without that decision.
11. **Extended footprint not included.** Content + schema use the GBP area lists only (Winchester 16, Martinsburg 14). The extended footprint (Winchester +15, Martinsburg +21 per footprint.json / GeoJSON) is NOT in this staged draft; per the senior-package precedent, the merge expands to the full footprint, keeping the two branches' lists distinct.
12. **R7 live re-check pending.** Quote-toggle behavior must be re-checked on the live form at deploy time (pattern verified, live re-check outstanding). No test post will be sent.
13. **GBP transloading service addition is Phase G, not this package.** No GBP edit is made or claimed here.
14. **Separate Phase D pages are NOT this package.** Drayage, container types/sizes reference, demurrage/detention/free-time cost-avoidance, reefer (if attested), and flat-rack/OOG (if attested) pages remain their own staged packages; this Winchester page does not replace them. Real per-page JSON files for the six existing container pages are also a separate Phase D item.
