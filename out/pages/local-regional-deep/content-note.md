# Content note — Local and Regional Moving deep-data package (staged, all-categories deep program)

Existing pages (NO new slug, NO new page): `local-regional-moving` (hub) + `local-regional-movers-winchester-va` + `local-regional-movers-martinsburg-wv` (branch pages).
Hub title: "Local & Regional Moving". Canonical: https://theflatratemovers.com/local-regional-moving/
Branch canonicals: https://theflatratemovers.com/local-regional-movers-winchester-va/ , https://theflatratemovers.com/local-regional-movers-martinsburg-wv/
Confirmed live 2026-10-29: all 3 present in the live sitemap (153 URLs) and in live index.html pageMeta + page divs (ids page-local-regional-moving, page-local-regional-movers-winchester-va, page-local-regional-movers-martinsburg-wv).
Ranking evidence: "movers near me" 246 @ 5.0 with 11 clicks (site's best click source); "movers winchester va" 424 @ 12.9; "winchester movers" 408 @ 18.0; "winchester local moving company" 181 @ 20.0; "local moving" 4 @ 1.0; Winchester cluster 727/316/199/172/168/131/129/118/117 @ 9.0–23.7; "movers martinsburg wv" 123 @ 8.9 (GSC 3-month pull to 2026-10-27).

## What the existing pages already say (extracted from the live divs 2026-10-29)

Hub (586 words, 10 headings):
- Hero: "Local & regional moving, at one flat rate. Local and regional moves along the I-81, I-66 and I-70 corridors, from our two home bases in Winchester, VA and Martinsburg, WV — homes and businesses, at a flat rate agreed in writing before move day. No hourly clock, ever."
- "What it includes": residential and commercial moves within the local and regional area, packing and unpacking, loading and unloading, and — where the job includes a high-mass piece — SIR Structural Integrity Relocation under the KIM-GS Protocol for assets of 1,500 to 3,500 lbs, with L/360 floor-deflection analysis. "One standard, one price in writing, whether the move is across town or across the region."
- "Who it is for": households moving within the Shenandoah Valley and the Eastern Panhandle, and businesses relocating offices or operations locally or regionally — anyone who wants the price settled before the truck is loaded, not metered by the hour.
- "Where we serve": the full GBP area lists (Winchester 16, Martinsburg 14) + GeoJSON note (52 features, per branch, verified 2026-10-28).
- FAQ "Questions, answered": (1) "Is the price really flat, even for a short local move?" — Yes, price by the job not by the hour, tagline as guarantee. (2) "Which base serves my move?" — both bases dispatch across the region; Winchester serves the Valley side, Martinsburg the Eastern Panhandle side, overlap at Moorefield, quote form settles crew/route. (3) "What if my move includes a gun safe, piano or medical device?" — SIR/KIM-GS conditional, L/360. (4) "How do I get the quote?" — Get My Flat Rate Quote, Short default / Detailed toggle, preserved inputs.
- Branch card ("Service area, published data & quote"): both branches with addresses, hours, per-branch ratings (5.0/1, 4.7/6, never blended), phone, GeoJSON note, SIR conditional line.

Winchester branch page (918 words, 8 headings): "Local & Regional Movers — Winchester VA", audience homeowners/renters/families/seniors, corridor scope, flat price in writing, logo as brand image, "What it includes" / "Who it is for" / "Where we serve" / "Related pages" / FAQ / branch card / "Sources & attestation".

Martinsburg branch page (990 words, 8 headings): same structure for Martinsburg WV, from Flat Rate Movers Martinsburg WV, logo as brand image, FAQ / branch card / "Sources & attestation".

Live pageMeta descs (verbatim, hub): "Local & regional moving along the I-81, I-66 and I-70 corridors from Winchester, VA and Martinsburg, WV — homes and businesses at one flat rate in writing, no hourly clock, with SIR/KIM-GS handling for high-mass…" (branch descs mirror the same corridor + flat-rate framing per branch).

## What this package ADDS (no visible page copy changes by this package itself)

1. **One canonical Service node** `#service-local-regional` (schema.json in this package dir) with serviceType "Local and Regional Moving", provider → Organization → both Places, areaServed via branch @ids, per-branch ratings only, url = the existing hub URL, plus BreadcrumbList. This node REPLACES both duplicate entity-graph fragments at merge and is ADDED to the best graph (currently 0 fragment occurrences), and upgrades the thin head node to the same chain (same @id, no duplicate).
2. **D1–D8 full datasets** (research doc, not a light node file — see dataset-status.md): operations, sizes/access, taxonomy, dispatch network, commercial terms, personas/triggers, protection/compliance, areas/quote path. Converted to Dataset JSON-LD at merge (page-level markup on local-regional-moving + Developer-page collection entry), CC BY 4.0, dateModified = deploy date.
3. **Graph + machine-file entries at merge**: canonical node in both entity graphs (duplicates deleted), llms.txt / data txt local-regional section refreshed from D1–D8, ai-sitemap local-regional service entry refreshed (it already exists — refresh, don't duplicate), rubric DB rows (canonical service row + attestations + rubric_check row; opening_hours and service_area rows already exist — verify only, do not duplicate). No new pages.json entry (the pages already exist) and NO sitemap count change for this package alone.

## Page-mechanism decision: NO new page, with evidence

- The hub EXISTS (586 words, FAQ section, corridor + area + flat-rate scope) and both branch pages EXIST (918/990 words, FAQ + sources & attestation sections), and the 3 pages carry the service (pages.json pageCount 3, verified).
- The problem is position + graph, not existence: Winchester cluster at 9.0–23.7, "winchester local moving company" at 20.0, "movers near me" at 5.0 with the site's best 11 clicks to defend — plus the duplicate-@id graph defect, the thin head node, and the absent best-graph fragment.
- A second local hub would split the near-me/click-engine intent and cannibalize the pages that already carry it — the same reasoning as the residential, commercial, gun-safe, and office packages.
- The thin #1s ("local moving" 4 @ 1.0; "movers near me for small jobs" 2 @ 1.0) are generic/home-page intents, not missing-page intents — they need node + dataset + depth on existing pages, per the plan's Phase B prescription (fold small-job depth into local-regional + residential pages via FAQ + llms lines, no new pages).
- Therefore this package stages NO content.md, meta.json, or backlinks.md for a new page — deliberately. The depth work for the existing pages is staged below as a Phase E brief, and the same-day/Bristow/small-job-product pages are separate follow-up packages gated on §8 answers (research doc §9).

## Phase E depth brief for the existing hub + branch pages (NOT a live edit — staged guidance only)

Add sections the pages lack, each tracing to D1–D8 or to an attestation answer — no new claims:
(a) Local-vs-regional explainer, domain-labeled, ending on the company's corridors + areas framing (D3/D4).
(b) Flat-rate vs hourly explainer, domain-labeled, ending on the company's flat-rate-in-writing — sharpest on short local moves, where the market norm is hourly (D5).
(c) Small-job FAQ material, domain-labeled (studio/partial-load shapes, no minimum claimed) (D2).
(d) Seasonal booking guidance, domain-labeled (local 2–4 weeks off-peak, 4–8 weeks peak; May–September peak, month-end/weekends tightest) with NO availability promise (D6).
(e) Apartment access block — stairs, elevators, parking, building rules as planning inputs (D2).
(f) Valuation explainer pointer, domain-labeled, with NO company coverage claim until research doc §8 Q4 is answered (D5/D7).
(g) Cross-links to the residential hub, the packing pages, the corridor pages, and the senior page (audience split, not duplication).

## Content gaps found on the existing pages (named, not filled)

1. No local-vs-regional explainer section (brief item (a) above; boundary gated on §8 Q2).
2. No flat-rate vs hourly explainer section (brief item (b) above) — the hub FAQ answers "is the price really flat?" but does not explain the market hourly norm it differentiates from.
3. No small-job FAQ material (brief item (c) above; "small job" and "studio" are 0 mentions site-wide).
4. No seasonal booking guidance (brief item (d) above; no availability promise).
5. No apartment access section (brief item (e) above; apartment depth belongs to the residential program's follow-up).
6. No valuation explainer (brief item (f) above; gated on §8 Q4).
7. No same-day/next-day availability section — correctly absent, since availability is unattested (gated on §8 Q1).
8. No Bristow content — correctly absent, since Bristow is unassigned (gated on §8 Q10).
9. No image block of company work — branch pages carry the logo as brand image; no company local-move job photo supplied.
