# Content note — Commercial Moving deep-data package (staged, all-categories deep program)

Existing page (NO new slug, NO new page): `commercial-moving`
Title: "Commercial Moving"
Canonical: https://theflatratemovers.com/commercial-moving/
Confirmed live 2026-10-29: present in the live sitemap (153 URLs) and in live index.html pageMeta + page div id="page-commercial".
Ranking evidence: commercial-moving page 2,013 impressions at average position 53.4, AI-feature 34 (GSC 3-month pull to 2026-10-27) — the top service page by impressions and one of the weakest by position. Adjacent: "corporate movers winchester va" 123 @ 32.1 (worst top-30 position); "business moving companies near me" 1.0; "virginia flat rate office moving company" 1.0.

## What the existing page already says (extracted from the live div 2026-10-29)

- Hero: "Business moves, planned around your operation. Commercial relocations quoted flat and agreed in writing before move day — planned around your hours, your site and your equipment, with our own warehouse and transload operation behind the job."
- Scope: "Business relocations — Shops, professional offices and commercial spaces moved with a plan that keeps downtime short: what moves first, what moves last, and what your team needs working on day one."
- Office cross-ref: "Offices, specifically — Workstations, files and office equipment are a discipline of their own. Office moves — including industrial offices inside plants and warehouses — have their own page and their own plan."
- Freight behind the move: "Container loading and unloading, transloading between truck, container and warehouse, and final-mile delivery — the logistics chain that supports bigger commercial jobs end to end."
- Heavy & high-value: "Commercial equipment, safes and sensitive devices up to 3,500 lbs move under SIR and the KIM-GS Protocol — route surveyed, floor checked to L/360, load spread and protected."
- Government & military cross-ref: "We also move government offices and military households across the Valley and the Panhandle, on the same flat-rate-in-writing basis."
- "What a commercial move includes": business relocations planned around the operation (first/last/day-one), plus the freight chain and warehouse/transload staging behind the job.
- "Who commercial moving is for": business owners, office managers, and operations teams relocating a shop, office, or commercial space, including industrial offices, government offices, and military households — all on the same flat-rate-in-writing basis.
- "Where we serve commercial moves": from Winchester, VA and Martinsburg, WV across the Shenandoah Valley and Eastern Panhandle, with long-distance and freight work on I-81, I-66, and I-70, and export and port work through the Virginia Inland Port and Port of Virginia chain.
- "Commercial questions, answered" FAQ section: how downtime is kept short (plan the order up front); freight as well as offices (same logistics chain, warehouse/transload-backed); flat price (quoted flat, agreed in writing before move day).
- Branch card ("Service area, published data & quote"): hours by location — Winchester Mon–Fri 8–6, Sat 8–4, Sun 9–4; Martinsburg Mon–Fri 9–6, Sat 9–4, Sun 9–4; phone +1-540-422-2153; quote CTA "Get My Flat Rate Quote".
- Photos: credited Downtown Winchester photo (Sarah Stierch, CC BY 4.0, via Wikimedia Commons) and a company-supplied warehouse/transload staging photo (boxes on a dolly, equipment on a pallet) — honestly described, never mislabeled.
- Live pageMeta desc (verbatim, used as the basis for the schema description): "Flat-rate commercial moving from Winchester, VA and Martinsburg, WV — business relocations planned around your operation, with warehouse-backed staging, loading, transloading and final-mile delivery."

## What this package ADDS (no visible page copy changes by this package itself)

1. **Full Service node** `#service-commercial` (schema.json in this package dir) with serviceType "Commercial Moving", name "Commercial and Office Moving" (registry match) + alternateName "Commercial Moving" (hub title match), provider → Organization → both Places, areaServed via branch @ids, per-branch ratings only, url = the existing commercial-moving URL, plus BreadcrumbList. This node goes into BOTH machine graphs (entity-graph: upgrade the string-area node to this chain; best-graph: add the fragment node, absent today) and upgrades the thin head node to the same chain at merge (same @id, no duplicate). Page-slug nodes are left untouched pending the §8 merge decision.
2. **D1–D8 full datasets** (research doc, not a light node file — see dataset-status.md): operations, premises/access, asset taxonomy, dispatch network, commercial terms, personas/triggers, protection/IT-coordination/compliance, areas/quote path. Converted to Dataset JSON-LD at merge (page-level markup on commercial-moving + Developer-page collection entry), CC BY 4.0, dateModified = deploy date.
3. **Graph + machine-file entries at merge**: node in both entity graphs (see above), fragment url corrected to the hub (only with §8 Q10a approval), llms.txt / data txt commercial section refreshed from D1–D8, ai-sitemap commercial service entry refreshed (it already exists — refresh, don't duplicate), rubric DB rows (canonical service row + attestations + rubric_check row; opening_hours and service_area rows already exist — verify only, do not duplicate). No new pages.json entry (the page already exists) and NO sitemap count change for this package alone.

## Page-mechanism decision: NO new page, with evidence

- The commercial-moving page EXISTS and already carries 2,013 impressions with AI-feature 34. Its problem is position (53.4), not existence. A second commercial hub would split intent and cannibalize the impressions the existing page carries.
- The fat queries (commercial-moving page, "corporate movers winchester va" 123 @ 32.1) need node + dataset + depth on the existing page, not a new slug. The thin #1s ("business moving companies near me", "virginia flat rate office moving company") need defending with the same node + dataset.
- The graph defect is fragmentation (thin head node + string-area fragment node + page-slug nodes, no single full chain), not a missing page. Fixing the node + supplying D1–D8 is the dominance mechanism for this package.
- Therefore this package stages NO content.md, meta.json, or backlinks.md for a new page — deliberately. The depth work for the existing page is staged below as a Phase E brief, and the downtime-cost explainer is a separate follow-up proposal (research doc §9).

## Phase E depth brief for the existing commercial-moving page (NOT a live edit — staged guidance only)

Add sections the page lacks, each tracing to D1–D8 or to an attestation answer — no new claims:
(a) The planning sentence expanded into the 8-step chain (D1/§3) with the day-one acceptance test ("what your team needs working on day one" as the close-out check).
(b) Downtime-math explainer, domain-labeled (D5 figures: the 80-employee / $32,000-day example, the after-hours premium arithmetic), ending on flat-rate-in-writing as the price-certainty answer — never as a company cost promise, never as a downtime guarantee.
(c) Two-building coordination block (D2): freight elevators, docks, security, move windows as planning inputs to the quote — with COI/coordinator language ONLY if research doc §8 Q2/Q3 are answered.
(d) Phasing-models explainer, domain-labeled (department-by-department, non-essentials first, IT-first, staggered delivery, hybrid cover), with no named offering until §8 Q8 is answered.
(e) Freight-chain section — already partially present; deepen with the transload/final-mile staging sequence, cross-linked to the transloading and final-mile categories, not duplicated.
(f) Cross-links to the office-moving, industrial-offices, IT, warehouse, and industrial-commercial pages (audience split, not duplication).

## Content gaps found on the existing page (named, not filled)

1. No step-by-step chain section — the planning sentence is present but the 8-step chain is not (brief item (a) above).
2. No downtime-math explainer — downtime is named (3 mentions site-wide, all on this page) but never quantified, even as domain education (brief item (b) above).
3. No two-building coordination block — elevators, docks, security, and move windows are not spelled out (brief item (c) above; COI/coordinator language gated).
4. No phasing-models section — phasing is implied by "what moves first/last" but no model is named (brief item (d) above; named offering gated).
5. No IT-boundary statement — IT is cross-referenced via the IT page but the commercial/IT scope boundary is not stated (gated on §8 Q4).
6. No coverage/valuation statement — correctly absent, since no commercial coverage offering is published (gated on §8 Q7).
7. No client proof — correctly absent, since no commercial client, case study, or testimonial is published (gated on §8 Q9).
8. No after-hours/weekend statement beyond "planned around your hours" — correctly unexpanded, since no named offering is published (gated on §8 Q1).
