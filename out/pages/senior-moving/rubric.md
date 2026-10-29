# Rubric — Senior Moving (staged, Phase B)

Page: Senior Moving — Winchester VA & Martinsburg WV. Slug: `senior-moving`. Canonical: https://theflatratemovers.com/senior-moving/
Staged: 2026-10-29. Status: READY pending deploy-time R7 re-check (see R7). Go-live bar: R1–R5 = 3, R6–R7 ≥ 2.

## Scores

| Rubric | Score | Basis |
|---|---|---|
| R1 Audience & topic | 3 | Audience named and sourced: seniors downsizing, transitioning to assisted/independent living, or relocating closer to family, plus families coordinating (incl. adult children from out of town). Source: GSC queries "senior moving" (75 impressions, position 1.0) and "senior movers near me" (position 1.0), 3-month pull to 2026-10-27; datasets research doc §4 (Senior moving), 2026-10-29. Topic is one page per intent: generic "senior moving" gets one two-branch page (not two branch pages), matching the generic query. |
| R2 Node chain | 3 | Service #service-senior-moving → provider Organization #organization → Places #winchester + #martinsburg → PostalAddress → GeoCoordinates → OpeningHoursSpecification → areaServed. areaServed is carried on each Place node (GBP lists, distinct) and referenced from the Service via branch @ids. No merged list, no shared areaServed, no org-level rating. serviceType set ("Senior Moving"). |
| R3 Graph & visible match | 3 | Every schema claim has a visible content.md sentence: service name/description (intro), provider/org (tagline + phone), both Place records (branch sections with address, hours, rating, areas), BreadcrumbList (Home › Senior Moving). No schema-only claim. |
| R4 Attestation | 3 | Every fact in the fact table below carries source + date. No fact without a source. |
| R5 No invented data | 3 | Gaps are named, not filled (see Gaps). No price, discount, certification, clearance, medical/care credential, facility claim, or move count anywhere in content, meta, schema, or dataset node. No USDOT/MC. No license details. SIR mentioned only conditionally (see fact table). |
| R6 Images, honest & beautiful | 3 | Logo approved as brand image (assets/img-01-9c77693ba66b.png, caption "company brand image, not a job photo"). No senior job photo has been supplied, so no job photo is claimed. Precedent: Phase 3 full build scored logo pages R6 = 3. |
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
| "Senior moving" 75 impressions, position 1.0; "senior movers near me" position 1.0 | GSC 3-month pull to 2026-10-27, read 2026-10-29 |
| Survey-room Senior category exists (main living areas, bedroom & personal rooms, keepsakes & fragile items); survey room is film-only with human-made estimate; clips auto-delete after 24h | Survey room build + live verification 2026-10-28 |
| "Senior Advocacy Logistics" is a listed service mention | Seizure plan per-category verified facts, 2026-10-29 |
| SIR applies to high-mass assets 1,500–3,500 lbs, floor deflection L/360 | Company thesis, verified 2026-10-27; used here ONLY conditionally (see Gaps) |
| Quote toggle: Short (Quick Quote) default / Detailed Project, in-place switch, preserved inputs; CTA wording | Live form implementation, verified 2026-10-27/28; quote-test rule (no test posts) 2026-10-28 |
| Logo file assets/img-01-9c77693ba66b.png, approved as brand image | Logo approval 2026-10-28 |
| Dataset license CC BY 4.0, attribution to The Flat Rate Movers | Datasets research doc §1, 2026-10-29 |

## Gaps (named, not filled)

1. **Single-provider claim — EXCLUDED.** Whether every senior move is performed by the company's own supervised teams with no subcontracted crew swap is an open attestation question (datasets doc §4). No such sentence appears in content, schema, or dataset node. If Henry attests it, it joins all three files at merge.
2. **No senior pricing, discount, or special offer** — none verified; none stated. The FAQ answers this directly ("No price, discount, or special offer is stated").
3. **No certification, clearance, or medical/care credential** — none verified; none claimed.
4. **No facility claims** (no assisted-living facility, community, or partner named) — none verified; none claimed.
5. **SIR conditional only.** SIR/KIM-GS is a high-mass method (1,500–3,500 lbs). Content and schema mention it only for senior moves that actually involve such an asset. No general "senior moves use SIR" claim.
6. **Extended footprint not included.** Content + schema use the GBP area lists only (Winchester 16, Martinsburg 14). The extended footprint (Winchester +15, Martinsburg +21 per footprint.json / GeoJSON) is NOT in this staged draft; the merge agent must decide whether to add it for consistency with the other new pages or keep this defend page GBP-only. Either choice must keep the two branches' lists distinct.
7. **R7 live re-check pending.** Quote-toggle behavior must be re-checked on the live form at deploy time (pattern verified, live re-check outstanding). No test post will be sent.
8. **GBP senior service addition is Phase G, not this package.** No GBP edit is made or claimed here.
