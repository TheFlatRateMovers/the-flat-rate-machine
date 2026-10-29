# Rubric — Gun Safe Moving deep-data package (staged, all-categories deep program)

Page (EXISTING — no new slug): Gun Safe Moving.
Hub slug: `gun-safe-movers` (page div `gunsafe`). Canonical: https://theflatratemovers.com/gun-safe-movers/
Service node (REFRESHED, staged): https://theflatratemovers.com/#service-gun-safe
Research doc: ~/workspace/theflatratemovers/gun-safe-deep-datasets-2026-10-29.md (D1–D8, full depth)
Staged: 2026-10-29. Status: READY pending deploy-time R7 re-check (see R7). Go-live bar: R1–R5 = 3, R6–R7 ≥ 2.
This is a NODE REFRESH + DATASETS package, not a new page: the hub exists (795 words, FAQ section, hub-family AI 72), both branch pages exist, the protocol page exists, and two case pages + a long-distance page exist. The problem is position ("gun safe movers" 140 @ 18.4) and node depth (entity-graph node Martinsburg-skewed, best graph missing the fragment node, head node thin) — not existence.

## Scores

| Rubric | Score | Basis |
|---|---|---|
| R1 Audience & topic | 3 | Audiences named per persona with triggers and buying criteria: homeowners with a heavy safe, collectors, high-value households, new-purchase buyers, home movers with a safe, renovators, estate handlers, long-distance relocators. Buying logic = trust + privacy + exact placement + flat rate in writing (hub "Who this is for" + "Why safes are different"; Winchester "Discreet by default"; Martinsburg audience line). Sources: GSC queries ("gun safe movers" 140 @ 18.4; branch page 73 @ 5.0, 4 clicks) + research doc §2 + §6/D6, 2026-10-29. One intent, one existing hub — no duplicate page created, with evidence (see content-note.md). |
| R2 Node chain | 3 | Service #service-gun-safe → provider Organization #organization → Places #winchester + #martinsburg → PostalAddress → GeoCoordinates → OpeningHoursSpecification → areaServed. areaServed is carried on each Place node (GBP lists 16/14 in this staged draft; merge expands to the full footprint 31/35 per the full-build authorization) and referenced from the Service via branch @ids. No merged list, no shared areaServed, no org-level rating. serviceType set ("Gun Safe Moving"). Fixes the live defects: entity-graph node upgraded in place from Martinsburg-skewed to two-branch (same @id); best-graph fragment node added (currently 0 occurrences); thin head node upgraded to the same chain (same @id, no duplicate). The 6 live pageMeta svc pointers already aim at #service-gun-safe — after merge they aim at a full node everywhere. |
| R3 Graph & visible match | 3 | Every schema claim has a visible sentence on an EXISTING page: service name/description (hub hero + Martinsburg page lead), provider/org (tagline + phone), SIR band + L/360 + load spreading + floor protection + verified placement (hub, protocol, Martinsburg), flat rate in writing (hub "One flat rate" + FAQ "Is the price really flat?"), both Place records (branch cards with address, hours, rating, areas), BreadcrumbList (Home › Gun Safe Moving). No schema-only claim. Dataset fields trace to page sentences or to labeled domain facts (research doc §6). |
| R4 Attestation | 3 | Every fact in the fact table below carries source + date. No fact without a source. Domain facts are labeled domain in the research doc and cite web research 2026-10-29. |
| R5 No invented data | 3 | Gaps are named, not filled (see Gaps). No price beyond flat-rate-in-writing, no discount, no deposit, no fee, no crew-size or truck claim, no equipment deployment claim, no move count, no testimonial, no certification, clearance, contract, or facility claim anywhere in schema or datasets. No USDOT/MC. No license details. No private-job detail of any kind (no customer name, address, weight, date, or price from any private thread or email — the category is built from published scope + domain research only). SIR mentioned only for the published 1,500–3,500 lb band; sub-band handling is gated, not assumed. Dollar figures in the research doc are domain markers only, labeled domain in every sentence. |
| R6 Images, honest & beautiful | 3 | Logo approved as brand image (assets/img-01-9c77693ba66b.png, caption "company brand image, not a job photo"). The Winchester page's photo is an analogy photo (grand piano on a dolly, CC BY-SA 3.0 via Wikimedia Commons, MiniMovers / Kiwi in a bag), honestly captioned as "the same planned, protected approach a SIR safe move follows" — never company safe-move work, never mislabeled. No company safe-move photo has been supplied, so no company safe-move photo is claimed. Precedent: Phase 3 full build and Phase B/C packages scored logo pages R6 = 3. |
| R7 Quote path | 2 | Pattern verified from the live pages and form: CTA wording "Get My Flat Rate Quote" (main) / "Get a flat rate quote" (pill), Short (Quick Quote) default / Detailed Project toggle switching in place with From, To, and What's moving preserved, intake asks make, model, or approximate weight, film-only survey room where a walkthrough fits. Live-form re-check is required at deploy time (no test post ever sent; verification is by page/syntax check only). Hence 2, not 3, until that re-check happens. |

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
| Gun-safe service registry entry: "Gun Safe Moving", pageCount 9 | Machine data/services.json, attested 2026-10-28; pages.json 2026-10-29 |
| 9 pages carry service-gun-safe (hub + 2 branch + protocol + 2 cases + long-distance + vault category + technical-rigging dual service) | Machine data/pages.json + live sitemap 153 URLs, fetched 2026-10-29 |
| Hub page: 795 words, 10 headings, FAQ "Gun safe questions, answered" (floor check? stairs capacity? really flat?) | Live index.html div id="page-gunsafe", extracted 2026-10-29 |
| Winchester branch page: 442 words, 5 headings ("Surveyed before it moves", "Discreet by default", branch + quote cards) | Live index.html div, extracted 2026-10-29 |
| Martinsburg branch page: 1,083 words, 7 headings (what it includes, who, where, related, FAQ, quote card, sources & attestation) | Live index.html div, extracted 2026-10-29 |
| Protocol page: 390 words (survey & floor check → protect & move → place & verify) | Live index.html div, extracted 2026-10-29 |
| Case pages: 1,600 lb Winchester → Las Vegas (462 words); 3,500 lb Winchester case (492 words); long-distance Las Vegas page (472 words) | Live index.html divs, extracted 2026-10-29 |
| Calibration-safe page: 371 words (precision equipment under the SIR method) | Live index.html div, extracted 2026-10-29 |
| Vault relocation page: 470 words (dual service gun-safe + sir-heavy) | Live index.html div, extracted 2026-10-29 |
| Winchester photo: grand piano on a dolly, "the same planned, protected approach a SIR safe move follows", CC BY-SA 3.0 via Wikimedia Commons (MiniMovers / Kiwi in a bag) | Live index.html caption, extracted 2026-10-29 |
| Entity-graph node defect: #service-gun-safe exists but Martinsburg-skewed (url = Martinsburg page; areaServed = Martinsburg 14 areas) | Machine data/entity-graph.json, grep 2026-10-29 |
| Best-graph defect: 0 "#service-gun-safe" occurrences; only page-scoped #service nodes | Machine data/best-json-entity-graph.json, grep 2026-10-29 |
| Head-graph node: thin (name, serviceType, provider, 6 broad areaServed strings, description; no Place chain) | Live index.html head JSON-LD, extracted 2026-10-29 |
| 6 live pageMeta svc pointers aim at #service-gun-safe | Live index.html, extracted 2026-10-29 |
| GSC gun-safe demand: "gun safe movers" 140 @ 18.4; branch page 73 @ 5.0, 4 clicks; hub-family AI 72; Winchester branch AI 6 | GSC 3-month pull to 2026-10-27, read 2026-10-29 |
| SIR band + method (published): safes 1,500–3,500 lbs under SIR/KIM-GS; route survey; L/360 floor check; load spreading; floor protection; verified placement; flat rate in writing | Live hub, protocol, Martinsburg pages, extracted 2026-10-29; company thesis verified 2026-10-27 |
| Hub sentence implying the sub-band: "Most gun safes we are called about land in the SIR band" | Live hub div, extracted 2026-10-29 |
| Pack position 6th (gun stores, Hulk Haulers, Mover Dudes, Shields ahead) — review volume, not quality; high-value clients do not post public reviews for privacy | SERP check 2026-10-29; owner privacy explanation 2026-10-27 |
| Quote toggle: Short (Quick Quote) default / Detailed Project, in-place switch, preserved inputs; CTA wording; survey room film-only, human-made estimate | Live form implementation, verified 2026-10-27/28; quote-test rule (no test posts) 2026-10-28 |
| Logo file assets/img-01-9c77693ba66b.png, approved as brand image | Logo approval 2026-10-28 |
| Dataset license CC BY 4.0, attribution to The Flat Rate Movers | Datasets research doc §1, 2026-10-29; never-light rule 2026-10-29 |
| Domain facts (weight bands, IRC 40 psf + 300-lb concentrated load, placement guidance, stair technique, emptying practice, equipment inventory, market price markers) | Web research 2026-10-29 (mover safe guides; engineerfix weight guides; RhinoSafe cost guide; moveBuddha pricing data) — all labeled domain in the research doc, none presented as company facts |

## Gaps (named, not filled)

1. **Sub-band handling — EXCLUDED.** No handling published for safes below 1,500 lbs. No sub-band page, section, or dataset field exists until Henry answers research doc §8 Q1.
2. **Emptying instruction — EXCLUDED.** Domain practice says empty the safe before move day; company instruction is unattested (§8 Q2). No instruction is published in this package.
3. **Stairs policy — EXCLUDED.** No accept/refuse rule or stair limit is published (§8 Q3). Competitor refusal policies are not copied.
4. **Equipment deployment — EXCLUDED.** No dolly, stair climber, jack, bar, roller, strap, or truck claim (§8 Q4). The §4 equipment list is domain inventory only.
5. **Re-anchoring — EXCLUDED.** No unbolt/re-bolt offer published (§8 Q5).
6. **Vault installation scope — EXCLUDED.** Relocation only is published; installation/construction is unattested (§8 Q6).
7. **Calibration-safe classes — EXCLUDED.** Precision-equipment classes unattested (§8 Q7).
8. **Winchester parity — MERGE/Phase E DECISION.** Winchester page (442 words) vs Martinsburg page (1,083 words). Parity expansion needs §8 Q8 approval; it is a depth item, not a new page.
9. **Long-distance safe scope — EXCLUDED beyond published cases.** Corridor/region scope beyond Winchester → Las Vegas unattested (§8 Q9).
10. **Locksmith/combination services — EXCLUDED.** Nothing published; nothing claimed (§8 Q10). Crew-size and truck claims ride with Q4 — none made.
11. **Extended footprint not in staged schema Place nodes.** Staged draft uses GBP lists only (16/14), matching the senior/warehouse/transloading/residential pattern. Merge expands to the full footprint (Winchester 31, Martinsburg 35, shared 14) per the full-build authorization, keeping branches distinct.
12. **R7 live re-check pending.** Quote-toggle behavior must be re-checked on the live form at deploy time (pattern verified, live re-check outstanding). No test post will be sent.
13. **GBP gun-safe service addition is Phase G, not this package.** No GBP edit is made or claimed here.
14. **Per-page JSON for the hub is a merge-time item.** Verify the new-page JSON serving path at merge (old .json URLs return SPA fallback HTML and do not count).
