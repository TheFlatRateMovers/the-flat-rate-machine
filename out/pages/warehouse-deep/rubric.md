# Rubric — Warehouse Relocation deep-data package (staged build, all-categories deep program)

Page (EXISTING, LIVE — no new slug): Warehouse Relocation — Winchester VA & Martinsburg WV.
Slug: `warehouse-relocation`. Canonical: https://theflatratemovers.com/warehouse-relocation/
Service node (REFRESHED, staged): https://theflatratemovers.com/#service-warehouse-relocation
Research doc: ~/workspace/theflatratemovers/warehouse-deep-datasets-2026-10-29.md (D1–D8, full depth)
Prior package: ~/workspace/the-flat-rate-machine/out/pages/warehouse-relocation/ (Phase C lock package — page + node, now LIVE; this package builds ON it, does not duplicate it)
Staged: 2026-10-29. Status: READY pending deploy-time R7 re-check (see R7). Go-live bar: R1–R5 = 3, R6–R7 ≥ 2.
This is a NODE REFRESH + DATASETS package for a live page, not a new page: the warehouse-relocation page exists live (1,686 words, 11 headings, FAQ, branch sections, sources & attestation, per-page JSON application/json) and the node exists in both machine graphs + the head graph. The problem is node depth (no url on the entity + head nodes, no Place chains anywhere) + vocabulary (phased 0, downtime 3) + missing D1–D8 datasets (Phase C dataset node was removed under the never-light rule) — not existence.

## Scores

| Rubric | Score | Basis |
|---|---|---|
| R1 Audience & topic | 3 | Audiences named per persona with buying logic: warehouse operators/managers (downtime first), distribution + 3PL operations (inventory continuity), manufacturers (production continuity), project managers/contractors/operations buyers (one plan, one flat price, no required contract duration). Sources: live warehouse page "Who it is for" + industrial page audience + SERP #1 "warehouse relocation services Virginia" via the industrial page (SERP check 2026-10-29) + research doc §2 + §6/D6, 2026-10-29. One intent, one existing live page — no duplicate page created, with evidence (see content-note.md). |
| R2 Node chain | 3 | Service #service-warehouse-relocation → provider Organization #organization → Places #winchester + #martinsburg → PostalAddress → GeoCoordinates → OpeningHoursSpecification → areaServed. areaServed is carried on each Place node (GBP lists 16/14 in this staged draft; merge expands to the full footprint 31/35 per the full-build authorization) and referenced from the Service via branch @ids. No merged list, no shared areaServed, no org-level rating. serviceType set ("Warehouse Relocation"). Fixes the live defects: entity-graph node gains `url` (currently absent); head node gains `url` + the full Place chain (currently 7 flat areaServed strings, no chain); best-graph node gains the Place chain (currently url but no chain). Same @id throughout, no duplicate, no new @id. |
| R3 Graph & visible match | 3 | Every schema claim has a visible sentence on the EXISTING live page: service name/description (hero + intro), provider/org (tagline + phone), scope (load-outs, inbound unloads, staging, restacking), CWT schedule verbatim (Standard Job Pricing section), SIR conditional (live page FAQ + scope section), both Place records (branch sections with address, hours, rating, areas), BreadcrumbList (Home › Warehouse Relocation). No schema-only claim. Dataset fields trace to page sentences, labeled cross-refs, or labeled domain facts (research doc §6). |
| R4 Attestation | 3 | Every fact in the fact table below carries source + date. No fact without a source. Domain facts are labeled domain in the research doc and cite web research 2026-10-29. |
| R5 No invented data | 3 | Gaps are named, not filled (see Gaps). No price beyond the verbatim Standard Job Pricing, no discount, no deposit, no move count, no testimonial, no client name, no facility size/location, no equipment deployment claim, no drayage/chassis/bonded/FTZ/reefer/customs claim, no racking-install claim, no phasing promise, no WMS claim, no permit/engineering claim, no debris/close-out claim, no contract, clearance, or certification claim anywhere in schema or datasets. No USDOT/MC. No license details. No household-storage claim (separate package). SIR mentioned only conditionally for 1,500–3,500 lb assets, exactly as the live page frames it. No day-hire-labor or labor-listing language anywhere. |
| R6 Images, honest & beautiful | 3 | Logo approved as brand image (assets/img-01-9c77693ba66b.png, caption "company brand image, not a job photo") — the live warehouse page's image. No warehouse job photo beyond the logo is claimed for this package. Face-blurred warehouse photos (assets/img-18-blurred-warehouse-1.jpg, img-19-blurred-warehouse-2.jpg) live on the industrial page and may attach to the warehouse page at Phase E only if the filenames check out — not claimed here. Precedent: Phase 3 full build and Phase B/C + deep packages scored logo pages R6 = 3. |
| R7 Quote path | 2 | Pattern verified from the live page and form: CTA wording "Get My Flat Rate Quote" (main) / "Get a flat rate quote" (pill), Short (Quick Quote) default / Detailed Project toggle switching in place with From/To/What's moving preserved, film-only survey room with human-made estimate where a walkthrough fits. Live-form re-check is required at deploy time (no test post ever sent; verification is by page/syntax check only). Hence 2, not 3, until that re-check happens. |

## Fact table (every fact, source + date)

| Fact | Source + date |
|---|---|
| Company: The Flat Rate Movers LLC; tagline "Guaranteed Flat Rate or Your Move is Free!"; founded June 2010 (no day) | Owner confirmation 2026-10-27; machine data/locations.json attested 2026-10-28 |
| Phone +1-540-422-2153 (both branches); email ratemovers@gmail.com (schema only) | Places verification 2026-10-27; Gmail connected 2026-10-28 |
| Winchester: The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601, geo 39.18711576, -78.1668352, Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google 5.0/1 | Places 2026-10-27; GBP check 2026-10-28; locations.json attested 2026-10-28 |
| Martinsburg: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg WV 25404, geo 39.48319665, -77.94760443, Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google 4.7/6 (4×5★, 2×4★) | Places 2026-10-27; GBP check 2026-10-28; locations.json attested 2026-10-28 |
| Winchester GBP areas (16, in staged schema Place node; full footprint 31 at merge) | GBP Business information screenshots supplied by owner 2026-10-27, confirmed 2026-10-28; footprint.json / GeoJSON 52 features |
| Martinsburg GBP areas (14, in staged schema Place node; full footprint 35 at merge) | GBP Business information screenshots supplied by owner 2026-10-27, confirmed 2026-10-28; footprint.json / GeoJSON 52 features |
| Moorefield 26836 served by both branches | Both GBP area lists above (appears in both) |
| Warehouse service registry entry: "Warehouse Relocation", pageCount 1 | Machine data/services.json, live state 2026-10-29 (22 services total) |
| Warehouse page live: slug warehouse-relocation, 1,686 words, 11 headings, FAQ, branch sections, sources & attestation, per-page JSON application/json | Live index.html div id="page-warehouse-relocation" + live JSON check, 2026-10-29 |
| Live graph state: entity 39 nodes, best 74 nodes, one #service-warehouse-relocation each; entity node keys @id/@type/areaServed/description/name/provider/serviceType (NO url); best node same + url; head node same keys as entity (NO url, 7 flat areaServed strings, NO Place chain) | Live entity-graph.json + best-json-entity-graph.json + live head JSON-LD, fetched 2026-10-29 |
| SERP #1 "warehouse relocation services Virginia" via industrial page | Live SERP check 2026-10-29 (Phase C evidence; datasets research doc §4) |
| Warehouse & Distribution capability; Warehouse Load-Outs & Inbound Unloads GBP products (both branches); supervised warehouse teams; priced per job, no required contract duration | Industrial page live content + GBP products 2026-10-28; plan per-category verified facts 2026-10-29 |
| Standard Job Pricing VERBATIM: Unload $8.00/CWT, Load $10.00/CWT, APU $12.00/CWT, Residential/Driver Meet $400–$425 per man; adjustable for scope, equipment, travel, after-hours agreed before dispatch | Industrial page live content, verified 2026-10-28/29 (quoted verbatim) |
| Warehouse moves "planned around the site itself — access, floor space, staging and equipment handling"; transload staging; restacking | Live warehouse + industrial page content, fetched 2026-10-29 |
| Dispatch on I-81/I-66/I-70 from both branches; Shenandoah Valley + Eastern Panhandle | Corridor pages + full-build authorization 2026-10-28; live warehouse page |
| SIR applies to high-mass assets 1,500–3,500 lbs, floor deflection L/360, conditional only | Company thesis, verified 2026-10-27; used here ONLY conditionally |
| Live vocabulary counts (index.html): warehouse 367, relocation 430, staging 49, restack 21, CWT 49, forklift 47 (photo-caption driven), inventory 27, load-out 12, downtime 3, phased 0 | Live index.html, counted 2026-10-29 |
| Phase C merge-note counts STALE (150→151, 18→19) — superseded by live state 153 pages / 22 services | Live sitemap 153 + registry state, verified 2026-10-29 |
| Phase C dataset node REMOVED under never-light rule; this package is the full ocean-method replacement | out/pages/warehouse-relocation/dataset-status.md, 2026-10-29 |
| Quote toggle: Short (Quick Quote) default / Detailed Project, in-place switch, preserved inputs; CTA wording; survey room film-only, human-made estimate | Live form implementation, verified 2026-10-27/28; quote-test rule (no test posts) 2026-10-28 |
| Logo file assets/img-01-9c77693ba66b.png, approved as brand image; face-blurred warehouse photos img-18/img-19 on industrial page | Logo approval 2026-10-28; face-blur work 2026-10-28 |
| Dataset license CC BY 4.0, attribution to The Flat Rate Movers | Datasets research doc §1, 2026-10-29; never-light rule 2026-10-29 |
| Domain facts (phasing models, continuity workstream, inventory discipline, 3PL/pallet rates, racking costs, downtime-math $260,000/hr ADSI claim, timeline guidance, building-compliance inputs) | Web research 2026-10-29 (Flood Brothers; ADSI; Royal Moving/Royalty; Mecalux; businessmoving; lifestyle-moving; Fulfillment Advisor; Buske; Lehigh Valley racking) — all labeled domain in the research doc, none presented as company facts |

## Gaps (named, not filled)

1. **Equipment actually deployed — GATED.** Forklifts/track loaders appear in industrial-page photo captions; no deployed-equipment list is claimed (§8 Q1).
2. **Drayage / chassis — GATED.** No company-truck, partner-carrier, or chassis claim (§8 Q2).
3. **Bonded / FTZ — GATED.** No operated/partnered/neither claim (§8 Q3).
4. **Reefer / cold-chain — GATED.** No temperature-controlled capability claim (§8 Q4).
5. **Customs / haz-classified goods — GATED.** No brokerage or haz-acceptance claim (§8 Q5).
6. **Racking teardown + reinstall scope — GATED.** Published scope is moves, load-outs, inbound unloads, staging, restacking; install scope is domain practice only (§8 Q6).
7. **Phasing as a named offering — GATED.** Live page says "planned around the site", never "phased"; phased = 0 site-wide (§8 Q7). Phase E brief stages phasing as an explainer, not a promise.
8. **WMS / inventory-system integration — GATED.** No integration claim; inventory discipline is domain practice only (§8 Q8).
9. **Permits / engineering scope — GATED.** No high-piled/seismic/fire-code/engineering claim (§8 Q9).
10. **Debris / close-out scope — GATED.** No debris-handling or close-out claim (§8 Q10).
11. **No standalone GSC query row yet.** SERP #1 is the evidence; Phase H re-pull is the first GSC read (§8 Q12).
12. **Merge decisions (not claims).** (a) Add `url` to the entity-graph node. (b) Upgrade the head node to the full Place chain, same @id. (c) Refresh the ai-sitemap warehouse entry with the D1–D8 summary (not duplicated). (d) Refresh the live per-page JSON to the refreshed node (serving path already application/json).
13. **Extended footprint not in staged schema Place nodes.** Staged draft uses GBP lists only (16/14), matching every other deep package. Merge expands to the full footprint (Winchester 31, Martinsburg 35, shared 14) per the full-build authorization, keeping branches distinct.
14. **R7 live re-check pending.** Quote-toggle behavior must be re-checked on the live form at deploy time (pattern verified, live re-check outstanding). No test post will be sent.
15. **GBP warehouse service addition is Phase G, not this package.** Warehouse Load-Outs & Inbound Unloads already exist as GBP products on both branches (2026-10-28). No GBP edit is made or claimed here.
16. **Storage is out of scope for this package.** Leased storage terms belong to the moving-and-storage activation package (owner-attested 2026-10-29); nothing storage is claimed or duplicated here. The freight staging/transload floor is related but distinct — never blurred into household storage.


## FULL-SITE REDO SWEEP NOTE — 2026-10-29 (Area E, staged-package sweep)

FLAGGED, NOT REWRITTEN (internal provenance only): this file and the other internal notes in this dir (content-note.md, merge-note.md, dataset-status.md) still contain the words "attested"/"attestation" and "GATED" as internal research/provenance language. That language was deliberately NOT edited out of the internal history and MUST NOT be carried into published-facing copy. Published-facing drafts in this dir (schema.json, plus content.md/meta.json where present) were swept clean in place: zero "attested", zero gated/pending/staged-build framing, zero blended branches, zero private client data. The full footprint expansion (Winchester 31 / Martinsburg 35) remains a merge-step per this package's merge-note; the staged schema keeps the GBP lists (16/14) as its draft baseline and was not expanded in place. No live file, deploy, or push was touched by this sweep.
