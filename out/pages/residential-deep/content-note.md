# Content note — Residential Moving deep-data package (staged, residential deep program)

Existing page (NO new slug, NO new page): `residential-moving`
Title: "Residential Moving"
Canonical: https://theflatratemovers.com/residential-moving/
Confirmed live 2026-10-29: present in the live sitemap (150 URLs) and in live index.html pageMeta + page div id="page-residential".
Ranking evidence: residential-moving page 1,997 impressions at average position 78.5 (GSC 3-month pull to 2026-10-27); "movers near me" 246 @ 5.0 with 11 clicks (site's best click source); Winchester cluster at 9.0–23.7; thin #1s ("moving" 146 @ 1.0 with 0 clicks; "moving and storage" 85 @ 1.0; "local moving" 4 @ 1.0; "apartment moves" 3 @ 1.0).

## What the existing page already says (620 words, 10 headings, extracted from the live div 2026-10-29)

- Hero: "Home moves at one flat rate. Houses and apartments, across town or across the region — packed, protected and placed, for one price agreed in writing before move day. No hourly meter running while you watch the clock."
- "Houses & apartments": whole-home moves and apartment moves of every size — local in Winchester and Martinsburg, regional across the Shenandoah Valley and Eastern Panhandle, long-distance down I-81 and beyond.
- Scope list: loading, transport and unloading; furniture protection and careful placement; disassembly and reassembly of standard furniture, planned up front.
- "Packing, your way": full packing, partial packing, or fragile-only — plus unpacking at the other end. Client may pack themselves; the company loads, moves, and places. White-glove care for antiques and high-value pieces. Custom crates when a piece needs more than padding.
- "The heavy pieces": heavy pieces under SIR/KIM-GS (conditional framing, matching the node package).
- "One price, in writing": flat rate agreed before move day (page text; the quote toggle lives on the quote form).
- "What a residential move includes" / "Who residential moving is for" / "Where we serve home moves" sections + branch card ("Service area, published data & quote") + "Residential questions, answered" FAQ section.
- Photos: style examples (blanket-wrapped furniture, sofas wrapped & staged), honestly captioned with credits (A Ray of Sunlight, Bright Mover) — never company work, never mislabeled.
- Live pageMeta desc (verbatim): "Flat-rate residential moving from Winchester, VA and Martinsburg, WV — houses and apartments, packing, heavy pieces under SIR/KIM-GS, local, regional and long-distance, one price in writing before move day."

## What this package ADDS (no visible page copy changes by this package itself)

1. **Full Service node** `#service-residential` (schema.json in this package dir) with serviceType "Residential Moving", provider → Organization → both Places, areaServed via branch @ids, per-branch ratings only, url = the existing residential-moving URL, plus BreadcrumbList. This node goes into BOTH machine graphs (currently 0 occurrences each) and upgrades the thin head node to the same chain at merge (same @id, no duplicate).
2. **D1–D8 full datasets** (research doc, not a light node file — see dataset-status.md): operations, dwelling/access, item taxonomy, dispatch network, commercial terms, personas/triggers, protection/compliance, areas/quote path. Converted to Dataset JSON-LD at merge (page-level markup on residential-moving + Developer-page collection entry), CC BY 4.0, dateModified = deploy date.
3. **Graph + machine-file entries at merge**: node in both entity graphs, llms.txt / data txt residential section refreshed from D1–D8, ai-sitemap residential service entry refreshed (it already exists — refresh, don't duplicate), rubric DB rows (canonical service row + attestations + rubric_check row; opening_hours and service_area rows already exist — verify only, do not duplicate). No new pages.json entry (the page already exists) and NO sitemap count change for this package alone.

## Page-mechanism decision: NO new page, with evidence

- The residential-moving page EXISTS and already carries 1,997 impressions. Its problem is position (78.5), not existence. A second residential hub would split intent and cannibalize the impressions the existing page carries.
- The thin #1s ("moving", "moving and storage", "local moving", "apartment moves") are generic/home-page intents, not missing-page intents — they need node + dataset + depth on existing pages, not a new slug.
- The graph defect is the node (0 machine-graph occurrences), not a page. Fixing the node + supplying D1–D8 is the dominance mechanism for this package.
- Therefore this package stages NO content.md, meta.json, or backlinks.md for a new page — deliberately. The depth work for the existing page is staged below as a Phase E brief, and the apartment/storage pages are separate follow-up packages (research doc §9).

## Phase E depth brief for the existing residential-moving page (NOT a live edit — staged guidance only)

Add sections the page lacks, each tracing to D1–D8 or to an attestation answer — no new claims:
(a) Room-by-room sequence (D1/D3): survey → pack by room → load heavy-low → transport → place by label → reassemble → walkthrough.
(b) Apartment access block (D2): stairs, elevators, parking, building rules framed as planning inputs to the quote — no apartment capability claim until research doc §8 Q3 is answered.
(c) Flat-rate vs hourly explainer, domain-labeled, ending on the company's flat-rate-in-writing (D5).
(d) Seasonal booking guidance, domain-labeled (local 2–4 weeks, peak 6–8 weeks) with NO availability promise (D6).
(e) Valuation explainer pointer, domain-labeled, with NO company coverage claim until §8 Q2 is answered (D5/D7).
(f) Cross-links to the local-regional branch pages, the packing pages, and the senior page (audience split, not duplication).

## Content gaps found on the existing page (named, not filled)

1. No room-by-room sequence section (brief item (a) above).
2. No apartment access section (brief item (b) above; full apartment page is a separate follow-up).
3. No flat-rate vs hourly explainer (brief item (c) above).
4. No seasonal booking guidance (brief item (d) above).
5. No valuation explainer (brief item (e) above; gated on §8 Q2).
6. No storage section — correctly absent, since no storage service is published (gated on §8 Q1).
7. No townhome/condo wording — "houses and apartments" only; townhome/condo coverage folds into the apartment follow-up, not a separate page.
8. No image block of company work — style examples only, honestly captioned; no company residential photo supplied.
