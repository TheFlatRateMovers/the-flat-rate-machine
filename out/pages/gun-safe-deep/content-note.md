# Content note — Gun Safe Moving deep-data package (staged, all-categories deep program)

Existing hub (NO new slug, NO new page): `gun-safe-movers` (page div `gunsafe`)
Title: "Gun Safe Moving"
Canonical: https://theflatratemovers.com/gun-safe-movers/
Confirmed live 2026-10-29: present in the live sitemap (153 URLs) and in live index.html page div id="page-gunsafe".
Ranking evidence: "gun safe movers" 140 impressions at 18.4 (GSC 3-month pull to 2026-10-27); branch page 73 @ 5.0 with 4 clicks (best-positioned service page in the account); hub-family AI impressions 72; Winchester branch AI 6. Pack position 6th in Winchester (review volume, not quality — high-value clients do not post public reviews for privacy).

## What the existing pages already say (extracted from the live divs 2026-10-29)

- Hub (795 words, 10 headings): "Gun safe moving, engineered — not muscled." Safes of 1,500–3,500 lbs under SIR/KIM-GS; route, stairs, and floor checked before the safe moves an inch; one flat rate in writing. Sections: "The SIR weight bands" ("Most gun safes we are called about land in the SIR band. Tell us the make, model or approximate weight when you ask for a quote"), "Why safes are different", "Stairs & tight turns", "One flat rate", "What we move", "Who this is for", "What to tell us for a quote", "Where we serve safe moves", FAQ "Gun safe questions, answered" (floor check? stairs capacity? really flat?), CTA "Ask about a safe move".
- Winchester branch (442 words, 5 headings): "Gun safe movers — Winchester, VA… with a method, not just muscle." SIR band + KIM-GS, route surveyed, floor checked to L/360 before anything lifts, one flat rate in writing. Sections: "Surveyed before it moves", "Discreet by default", "Winchester branch", "Start here", "Service area, published data & quote". Photo: grand piano on a dolly, captioned as "the same planned, protected approach a SIR safe move follows", CC BY-SA 3.0 via Wikimedia Commons (MiniMovers / Kiwi in a bag) — an analogy photo, honestly captioned, never company safe-move work.
- Martinsburg branch (1,083 words, 7 headings): full-format page — what it includes, who it is for, where we serve, related pages, "Questions, answered", "Service area, published data & quote", "Sources & attestation". Lead: gun safe and high-mass safe moving under SIR/KIM-GS for 1,500–3,500 lbs — route and clearance survey, floor deflection analysis to L/360, load spreading, floor protection, verified placement, one flat rate in writing.
- Protocol (390 words): five steps — survey & floor check (doors, turns, stairs, clearances measured at both ends; floor deflection assessed against L/360, load spreading planned) → protect & move → place & verify.
- Cases: 1,600 lb Winchester → Las Vegas (462 words); 3,500 lb Winchester case (492 words, "the heaviest job in the house… at the top of our 1,500–3,500 lb SIR band"); long-distance Winchester → Las Vegas page (472 words).
- Adjacent: calibration-safe-moving (371 words, precision equipment under the SIR method); technical-rigging vault relocation (470 words, dual service gun-safe + sir-heavy); vault-moving category (scaffolding); SIR method docs + heavy hub (authority cross-refs).

## What this package ADDS (no visible page copy changes by this package itself)

1. **Refreshed full Service node** `#service-gun-safe` (schema.json in this package dir) with serviceType "Gun Safe Moving", provider → Organization → both Places, areaServed via branch @ids, per-branch ratings only, url = the hub URL, plus BreadcrumbList. This node goes into BOTH machine graphs (upgrading the Martinsburg-skewed entity-graph node in place; adding the missing best-graph fragment node) and upgrades the thin head node to the same chain at merge (same @id, no duplicate).
2. **D1–D8 full datasets** (research doc, not a light node file — see dataset-status.md): operations, weight bands & access, taxonomy, branch dispatch network, commercial terms (domain-labeled; no company dollars), personas & triggers, floor/protection/handling compliance, areas/dispatch/quote path. Converted to Dataset JSON-LD at merge (page-level markup on the hub + Developer-page collection entry), CC BY 4.0, dateModified = deploy date.
3. **Graph + machine-file entries at merge**: node refresh in both entity graphs, llms.txt / data txt gun-safe section refreshed from D1–D8, ai-sitemap service entry refreshed (it already exists — refresh, don't duplicate), rubric DB rows. No new services.json entry (service-gun-safe exists, pageCount 9) and NO sitemap count change (no new page).

## Page-mechanism decision: NO new page, with evidence

- The hub EXISTS (795 words, FAQ section, hub-family AI 72) and carries the fat query's intent. Both branch pages exist. The protocol page exists. Two case pages and a long-distance page exist. Nine pages carry the service.
- The problem is position (18.4) and node depth (skewed/thin/absent), not existence. A second gun-safe hub would split intent and cannibalize the hub that already carries the AI impressions.
- Pack position 6th cannot be fixed with a page at all: it trails on review volume, and review volume is privacy-gated for this category by the owner's own standing explanation.
- Therefore this package stages NO content.md, meta.json, or backlinks.md for a new page — deliberately. The depth work for the existing pages is staged below as a Phase E brief, and the sub-band/stairs follow-ups are separate gated packages (research doc §9).

## Phase E depth brief for the existing pages (NOT a live edit — staged guidance only)

Add sections the pages lack, each tracing to D1–D8 or to an attestation answer — no new claims:
(a) Winchester parity (needs research doc §8 Q8 approval): expand the Winchester page toward the Martinsburg shape (what it includes, who, where, FAQ, attestation) — same verified facts, branch-swapped. The 442-vs-1,083-word gap is the largest branch asymmetry in this category.
(b) Stairs & tight-turns section depth on the hub, from D2 — access types, quote inputs, and the hub FAQ answers — with NO policy claim until §8 Q3 is answered.
(c) Sub-band explainer section, ONLY once §8 Q1 is answered (how safes below 1,500 lbs are handled).
(d) Emptying guidance section, ONLY once §8 Q2 is answered.
(e) Privacy/discretion section depth (Winchester "Discreet by default" as the seed) — discretion as a buying criterion, never a testimonial, never a review solicitation.
(f) Cross-links hub ↔ branch ↔ protocol ↔ cases ↔ sir-heavy docs ↔ calibration page ↔ vault page (method authority + adjacent scope, not duplication).

## Content gaps found on the existing pages (named, not filled)

1. No sub-band handling section (gated on §8 Q1).
2. No stairs accept/refuse rule or stair limit (gated on §8 Q3).
3. No emptying instruction (gated on §8 Q2).
4. No re-anchoring offer or guidance (gated on §8 Q5).
5. No equipment deployment list (gated on §8 Q4).
6. No Winchester-depth parity (gated on §8 Q8; see brief item (a)).
7. No long-distance safe scope beyond the Las Vegas cases (gated on §8 Q9).
8. No locksmith/combination service statement (gated on §8 Q10).
9. No company safe-move photo — analogy photo only on the Winchester page, honestly captioned; no company photo supplied, none claimed.
