# Rubric — Office Moving deep-data package (staged, all-categories deep program)

Page (EXISTING — no new slug): Office Moving.
Slug: `commercial-office-moving-2` (hub; div `page-office`). Canonical: https://theflatratemovers.com/commercial-office-moving-2/
Branch pages (EXISTING): office-moving-movers-winchester-va, office-moving-movers-martinsburg-wv.
Service node (REFRESHED, staged): https://theflatratemovers.com/#service-office-moving — replaces TWO duplicate branch-flavored nodes in entity-graph.json and is ADDED to best-json-entity-graph.json (currently zero occurrences).
Research doc: ~/workspace/theflatratemovers/office-deep-datasets-2026-10-29.md (D1–D8, full depth)
Staged: 2026-10-29. Status: READY pending deploy-time R7 re-check (see R7). Go-live bar: R1–R5 = 3, R6–R7 ≥ 2.
This is a NODE REFRESH + DATASETS package, not a new page: the hub page exists (full content, FAQ section, company-supplied photo) and both branch pages exist; the problem is position (corporate query @ 32.1) + vocabulary (corporate 2, department 0, phased 0, cubicle 0) + graph defect (duplicate @id / absent canonical node) — not existence.

## Scores

| Rubric | Score | Basis |
|---|---|---|
| R1 Audience & topic | 3 | Audiences named per persona with triggers: office managers (floor plans, seating charts, labeling, Day-1 checklist), business owners (hidden-costs fear + downtime bill), facility/building managers (elevator, dock, parking, badging), IT coordinators (cutover, cross-ref only), operations teams/department heads (continuity, phasing). Sources: GSC ("corporate movers winchester va" 123 @ 32.1; "virginia flat rate office moving company" @ 1.0; "business moving companies near me" @ 1.0) + research doc §2 + §6/D6, 2026-10-29. One intent, one existing hub page + 2 branch pages — no duplicate page created, with evidence (see content-note.md). |
| R2 Node chain | 3 | Service #service-office-moving (ONE canonical node after dedup) → provider Organization #organization → Places #winchester + #martinsburg → PostalAddress → GeoCoordinates → OpeningHoursSpecification → areaServed. areaServed is carried on each Place node (GBP lists 16/14 in this staged draft; merge expands to the full footprint 31/35 per the full-build authorization) and referenced from the Service via branch @ids. No merged list, no shared areaServed, no org-level rating. serviceType set ("Office Moving"). Fixes the graph defect: entity-graph.json goes from 2 duplicate @id nodes (branch-flavored, no Place chain) to 1 canonical node; best-json-entity-graph.json goes from 0 canonical occurrences to 1. |
| R3 Graph & visible match | 3 | Every schema claim has a visible sentence on the EXISTING hub/branch pages: service name/description (hub hero + "What an office move includes"), provider/org (tagline + phone), both Place records (branch sections with address, hours, rating, areas), BreadcrumbList (Home › Office Moving). No schema-only claim. Dataset fields trace to page sentences or to labeled domain facts (research doc §6). |
| R4 Attestation | 3 | Every fact in the fact table below carries source + date. No fact without a source. Domain facts are labeled domain in the research doc and cite web research 2026-10-29. |
| R5 No invented data | 3 | Gaps are named, not filled (see Gaps). No price beyond flat-rate-in-writing, no discount, no deposit, no move count, no testimonial, no client name, no building name, no contract, clearance, certification, downtime guarantee, SLA, or availability promise anywhere in schema or datasets. No USDOT/MC. No license details. No COI, coordinator, size-scope, confidential-handling, cubicle-scope, debris-scope, or enterprise-program claim. SIR mentioned only conditionally for 1,500–3,500 lb assets, exactly as the commercial hub frames it. IT appears only as a cross-reference to the IT node. |
| R6 Images, honest & beautiful | 3 | Hub page carries a company-supplied warehouse/transload staging photo, honestly captioned ("Photo supplied by The Flat Rate Movers") — verified in the live div extract 2026-10-29. Branch pages carry the approved logo as brand image (assets/img-01-9c77693ba66b.png, caption "company brand image, not a job photo"). No office job photo beyond the hub staging photo is claimed. Precedent: Phase 3 full build and Phase B/C packages scored logo pages R6 = 3. |
| R7 Quote path | 2 | Pattern verified from the live pages and form: CTA wording "Get My Flat Rate Quote" (main) / "Get a flat rate quote" (pill), Short (Quick Quote) default / Detailed Project toggle switching in place with From/To/What's moving preserved, Detailed Project form captures rooms/facility size. Live-form re-check is required at deploy time (no test post ever sent; verification is by page/syntax check only). Hence 2, not 3, until that re-check happens. |

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
| Office service registry entry: "Office Moving", "Complete office relocations — workstations, files and office equipment — planned and quoted flat.", pageCount 3 | Machine data/services.json, attested 2026-10-28 |
| Office pages: hub commercial-office-moving-2 (div page-office) + office-moving-movers-winchester-va + office-moving-movers-martinsburg-wv | Machine data/pages.json + live sitemap 153 URLs, fetched 2026-10-29 |
| Hub page published scope: complete office relocations — desks and workstations, files and records runs, office equipment — planned order; full/partial packing; warehouse staging when dates do not line up; placement in the order the team needs it; flat rate in writing; "no hourly meter running over a weekend move"; Detailed Project form captures rooms/facility size; FAQ section "Office questions, answered" | Live index.html div id="page-office", extracted 2026-10-29 |
| Commercial hub published spine: "what moves first, what moves last, and what your team needs working on day one"; downtime-short framing; onward link to Office Moving; Downtown Winchester photo credited Sarah Stierch, CC BY 4.0 | Live index.html div id="page-commercial", extracted 2026-10-29 |
| Graph defect: entity-graph.json (38 nodes) holds #service-office-moving TWICE (same @id; one url = Martinsburg page + Martinsburg areas, one url = Winchester page + Winchester areas; keys only @id/@type/areaServed/name/provider/serviceType/url; no Place chain) | Machine data/entity-graph.json, grep 2026-10-29 |
| Graph absence: best-json-entity-graph.json (73 nodes) holds ZERO #service-office-moving (page-scoped nodes only, e.g. office-moving-movers-winchester-va/#service) | Machine data/best-json-entity-graph.json, grep 2026-10-29 |
| pageMeta svc pointers: #service-office-moving ×5, #service-commercial ×7, #service-industrial-offices ×5, #service-it-relocation ×3 in live index.html | Live index.html, counted 2026-10-29 |
| Vocabulary counts (live index.html): office 417, workstation 30, corporate 2, downtime 3, phased 0, cubicle 0, department 0 | Live index.html, counted 2026-10-29 |
| GSC office demand: "corporate movers winchester va" 123 @ 32.1 (worst top-30 position); "virginia flat rate office moving company" @ 1.0; "business moving companies near me" @ 1.0; office pack 3rd | GSC 3-month pull to 2026-10-27, read 2026-10-29; SERP check 2026-10-29 |
| Quote toggle: Short (Quick Quote) default / Detailed Project, in-place switch, preserved inputs; CTA wording; Detailed Project scope input (rooms/facility size) | Live form implementation, verified 2026-10-27/28; quote-test rule (no test posts) 2026-10-28 |
| Logo file assets/img-01-9c77693ba66b.png, approved as brand image; hub staging photo company-supplied, captioned | Logo approval 2026-10-28; live hub div 2026-10-29 |
| Dataset license CC BY 4.0, attribution to The Flat Rate Movers | Datasets research doc §1, 2026-10-29; never-light rule 2026-10-29 |
| Domain facts (phasing models, size bands, downtime math, access rules, planning windows, market price ranges) | Web research 2026-10-29 (American Van Lines commercial guide; Safe Ship; Gorilla Movers; Lugg/ITIC 2024; Gartner; Enterprise World; Safebound; Cloudswitched; Element Moving) — all labeled domain in the research doc, none presented as company facts |

## Gaps (named, not filled)

1. **After-hours / weekend scheduling scope — GATED.** Hub phrase "no hourly meter running over a weekend move" is published text; a dedicated scheduling offer (windows, availability, conditions) is not published and not claimed (research doc §8 Q1).
2. **COI issuance — GATED.** No company COI claim exists anywhere (research doc §8 Q2).
3. **Dedicated move coordinator — GATED.** No company coordinator claim exists (research doc §8 Q3).
4. **Office size scope — GATED.** No workstation/headcount/square-footage band is published; Detailed Project form captures rooms/facility size only (research doc §8 Q4).
5. **IT coordination scope beyond the IT page — GATED.** IT appears only as a cross-reference to the IT node (research doc §8 Q5).
6. **Confidential files handling — GATED.** "Files and records runs" is published scope; sealed/numbered handling is domain practice only (research doc §8 Q6).
7. **Cubicle / systems-furniture scope — GATED.** Hub publishes "desks and workstations"; "cubicle" is 0 mentions site-wide (research doc §8 Q7).
8. **Debris removal scope for office moves — GATED.** Domain close-out step only (research doc §8 Q8).
9. **Corporate depth vs dedicated page — MERGE/PHASE E DECISION.** Depth brief targets "corporate movers winchester va" on existing pages first; a dedicated corporate page only if the query stays stuck after a Phase H re-pull (research doc §8 Q9).
10. **Enterprise / multi-site program scope — GATED.** Domain band only, never company scope (research doc §8 Q10).
11. **Extended footprint not in staged schema Place nodes.** Staged draft uses GBP lists only (16/14), matching the senior/warehouse/transloading/residential pattern. Merge expands to the full footprint (Winchester 31, Martinsburg 35, shared 14) per the full-build authorization, keeping branches distinct.
12. **Head-graph office node — VERIFY AT MERGE.** This package verified the machine graphs and the pageMeta svc pointers; the head-graph JSON-LD office node (if any) must be checked at merge and upgraded to the canonical chain under the same @id — do not create a second #service-office-moving node anywhere.
13. **R7 live re-check pending.** Quote-toggle behavior must be re-checked on the live form at deploy time (pattern verified, live re-check outstanding). No test post will be sent.
14. **GBP office service addition is Phase G, not this package.** No GBP edit is made or claimed here.
15. **Per-page JSON for the office hub + branch pages is a merge-time item.** Verify the new-page JSON serving path at merge (old .json URLs return SPA fallback HTML and do not count).


## FULL-SITE REDO SWEEP NOTE — 2026-10-29 (Area E, staged-package sweep)

FLAGGED, NOT REWRITTEN (internal provenance only): this file and the other internal notes in this dir (content-note.md, merge-note.md, dataset-status.md) still contain the words "attested"/"attestation" and "GATED" as internal research/provenance language. That language was deliberately NOT edited out of the internal history and MUST NOT be carried into published-facing copy. Published-facing drafts in this dir (schema.json, plus content.md/meta.json where present) were swept clean in place: zero "attested", zero gated/pending/staged-build framing, zero blended branches, zero private client data. The full footprint expansion (Winchester 31 / Martinsburg 35) remains a merge-step per this package's merge-note; the staged schema keeps the GBP lists (16/14) as its draft baseline and was not expanded in place. No live file, deploy, or push was touched by this sweep.
