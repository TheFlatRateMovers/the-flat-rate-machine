# Content Note — Winchester Transloading Deep Package

**Date:** 2026-10-29. **Status:** STAGED BUILD ONLY.

## What the live Winchester page already says (verified live 2026-10-29)

- **Page:** `transloading-winchester-va`, in the 153-URL sitemap, live div with 11 sections: Who it is for; What transloading is; How a transload runs; The cost-avoidance terms; Winchester branch; Martinsburg branch; Where we serve; Related pages; Questions answered (FAQ); Service area, published data & quote (standard card); Sources & attestation.
- **Source text:** Phase C content.md, 1,765 words. The live div carries the same sections plus the standard branch/quote/attestation cards.
- **Definitions:** devanning/destuffing, cross-docking, deconsolidation, drayage (chain step only), IPI contrast, restacking into 53ft trailers (40ft ≈ 20 pallet positions; 20ft ≈ 10), split delivery.
- **Process:** the published 8-step chain — pre-arrival planning → port release + short move in free time → devan + count/inspect/photograph + same-day exception reporting → rework → restack → inland dispatch → empty return → final mile.
- **Commercial terms:** cost-avoidance as domain facts — free time / LFD, demurrage at terminal, detention/per-diem outside terminal, chassis (pool-managed, shortages, tri-axle as variables), overweight alternative. Company claim: "quoted per job" ONLY (5 occurrences in the page's own text); no per-container or per-CWT rate; no dollar figures.
- **Branch sections:** Winchester full footprint 31 (GBP 16 + extended 15, split shown); Martinsburg section distinct (own hours, own areas, own rating). Sources & attestation section cites GBP check 2026-10-28, Places 2026-10-27, full-footprint owner decision 2026-10-28, and lists reefer/bonded/FTZ/customs as gated claims NOT claimed.
- **FAQ negations:** "Does this page cover reefer, bonded, or customs work? No." — the page's honesty mechanism, kept as-is.
- **Per-page JSON:** transloading-winchester-va.json live — 200, application/json, 5,872 bytes, 5 nodes (Service + Organization + both Places + BreadcrumbList).
- **Backlinks:** 17/17 resolve, 0 dead (Phase C backlinks.md, verified at deploy batch 1).
- **Node:** live in entity graph (39 nodes, no url), best graph (74 nodes, with url), head graph (24 nodes, thin: no url, 7 string areas).

## What this package adds (nothing the page already says, duplicated)

1. **W-D1–W-D8 full datasets** (research doc §6, CC BY 4.0) EXTENDING ocean D1–D8: Winchester-branch operations depth, cross-dock/decon/restack operations, equipment reference (domain-only, handled-types gated), port chain + corridor dispatch (system level only, no terminals/ramps), commercial terms + cost avoidance (FMC 2024 rule, port storage, causes, avoidance discipline — all domain), buyer personas + trigger events, handling/protection/compliance boundaries (with empty gated fields), service areas/dispatch/quote path (full footprint 31/35, branches distinct).
2. **Node refresh** (schema.json): full-chain Service node with url, full staged description, provider → Organization → both Places (machine `-place` convention), GBP areas staged, full footprint at merge. Repairs: entity node missing url; head node missing url + thin description; machine Place lists GBP-only.
3. **Vocabulary layer:** demurrage/detention/drayage/chassis/devan/destuff counts now present (4/3/4/4/3/2) thanks to the Winchester page — the package documents the counts honestly (reefer/bonded/FTZ are negations, flat rack 0) instead of inflating them into coverage claims.
4. **Corrections to the record** (research doc, top section): ocean datasets live-serving correction (ai-repo machine files only, NOT live-domain JSON); Place @id convention differences flagged; CWT-slice contamination warning (a naive whole-file slice attributes industrial-commercial dollar figures to the Winchester page — they are not on it).
5. **15 named gaps** (rubric.md) with §8 questions — nothing filled, nothing guessed.

## Page-mechanism decision: NO new page — with evidence

- **The page exists and is live** (153-URL sitemap, own div, FAQ, attestation, full footprint, per-page JSON, 17/17 backlinks). A second Winchester transloading page would split the intent the SERP #3 already serves ("transloading services Virginia port container", first mover) and cannibalize the live page.
- **The problem is depth + node refinement, not existence.** The live node is thin (head) or url-less (entity); the machine Place lists lag the live page's full footprint; the datasets are the ocean-level ones, not Winchester-level ones. All three are fixed by this package's node refresh + W-D1–W-D8 + merge proposals — no new slug needed.
- **The generic cluster is separate and stays separate.** Six container pages + docs + the generic node already cover the topic generally; the Winchester node stands alone (Phase C merge decision, confirmed by the parent brief). No merge, rename, or removal of the generic node.
- **What WOULD justify a new page (deferred, gated):** a drayage page (needs Q4 performer + chassis), a container types/sizes reference page (needs Q9 handled types), a demurrage/detention cost-avoidance page (from W-D5, ungated except the page itself), a reefer page (needs Q5), a flat-rack/OOG page (needs Q8). Each is a separate package, not this one.

## Phase E depth brief (STAGED GUIDANCE ONLY — not a live edit)

1. **Demurrage/detention explainer expansion (domain-labeled):** add the W-D5 domain layer to the page's cost-avoidance section — port storage as a separate terminal charge; causes (late/incomplete documents, duty delays, customs exams, transport not arranged, slow offload, late empty return); avoidance discipline (documents before arrival, know free time at booking, negotiate extra free time, pre-clear, coordinate clearance + transport, site ready, prompt empty return, devan into a warehouse when premises are not ready); FMC 2024 billing-rule context (invoice window, required details, dispute timeframe). Company claim stays "quoted per job" only — no dollar figure added.
2. **Drayage-role explainer (definition only):** clarify drayage as the ≤100-mile short move in the chain WITHOUT naming a performer (gated Q4). No fleet, carrier, or chassis claim.
3. **Vocabulary deepening (already present — deepen, don't duplicate):** devanning/destuffing (live counts 3/2 — still thin), IPI contrast, chassis/tri-axle variables. Keep the FAQ negation ("Does this page cover reefer, bonded, or customs work? No.") verbatim.
4. **Branch clarity (already present — keep):** Winchester full footprint 31 with GBP/extended split; Martinsburg distinct. Do not re-unify or re-blend.
5. **Cross-links (already present — verify, don't duplicate):** the 6 container pages, docs assets, industrial-commercial, final-mile, emergency recovery. Verify at merge that all 17 backlinks still resolve; do not add links to gated pages (drayage, reefer, flat rack) that do not exist.
6. **SIR-conditional block (already present — verify, don't duplicate):** heavy assets 1,500–3,500 lbs under SIR (L/360) as part of the same flat-rate job, conditional only.
