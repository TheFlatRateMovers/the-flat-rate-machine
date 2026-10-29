# Content note — Office Moving deep-data package (staged, all-categories deep program)

Existing pages (NO new slug, NO new page):
- Hub: `commercial-office-moving-2` — Title: "Office Moving". Canonical: https://theflatratemovers.com/commercial-office-moving-2/
- Branch: `office-moving-movers-winchester-va` — Title: "Office Moving — Winchester VA". Canonical: https://theflatratemovers.com/office-moving-movers-winchester-va/
- Branch: `office-moving-movers-martinsburg-wv` — Title: "Office Moving — Martinsburg WV". Canonical: https://theflatratemovers.com/office-moving-movers-martinsburg-wv/
Confirmed live 2026-10-29: all three present in the live sitemap (153 URLs) and in live index.html pageMeta + page divs (hub div id="page-office"; branch divs with full branch sections).
Ranking evidence: "corporate movers winchester va" 123 impressions at position 32.1 (worst top-30 position in the catalog); "virginia flat rate office moving company" at 1.0; "business moving companies near me" at 1.0; office pack 3rd (places result for "office moving company Winchester VA"). Vocabulary evidence: "corporate" 2 mentions, "downtime" 3, "phased" 0, "cubicle" 0, "department" 0 across live index.html.

## What the existing pages already say (extracted from the live divs 2026-10-29)

Hub page (commercial-office-moving-2):
- Hero: "Office moving — workstations, files & equipment. Complete office relocations, quoted flat and agreed in writing: desks and workstations, files and office equipment, moved in a planned order so your team can sit down and work at the new address."
- "Planned, staged, placed": "An office move is a sequence, not a pile. We plan the order with you — what leaves first, what arrives first, and where each workstation, file run and piece of equipment lands." Warehouse and transload operation as the staging base behind office and industrial moves.
- Sections: Workstations & furniture; Files & records runs; Office equipment; Industrial offices (cross-ref); Packing & staging (full or partial packing; staging at the warehouse when the dates don't line up neatly; placement at the new site in the order the team needs it).
- "Flat rate, in writing": "One agreed price before move day — no hourly meter running over a weekend move. Tell us the rooms or facility size in the Detailed Project form and we quote from the real scope."
- "Who office moving is for": office managers, business owners, and facility teams moving a professional office, a shop office, or an industrial office inside a plant, warehouse, or industrial facility — where access, floor space, staging, and equipment handling must be planned around the site itself.
- "Where we serve office moves": from Winchester, VA and Martinsburg, WV across the Shenandoah Valley and Eastern Panhandle, with warehouse and transload staging between truck, container, and warehouse on the same job.
- FAQ section: "Office questions, answered" — including "Do you move in a sequence, or all at once? In a sequence."
- Photo: warehouse/transload staging photo, captioned "Photo supplied by The Flat Rate Movers."

Branch pages (Winchester + Martinsburg):
- Same core scope ("Complete office relocations — workstations, files and office equipment — planned and quoted flat"), flat-rate terms verbatim, logo as brand image, "Get My Flat Rate Quote" CTA.
- Full branch sections: Winchester GBP 16 + extended 15 (hours Mon-Fri 8-6, Sat 8-4, Sun 9-4); Martinsburg GBP 14 + extended 21 (hours Mon-Fri 9-6, Sat 9-4, Sun 9-4); phone +1-540-422-2153; branches never blended.

Commercial hub (commercial-moving, div page-commercial — cross-ref, not this package):
- "Business moves, planned around your operation... what moves first, what moves last, and what your team needs working on day one."
- "How do you keep downtime short? By planning the order with you..." (downtime-short rule).
- Onward link to Office Moving; Downtown Winchester photo credited Sarah Stierch, CC BY 4.0.
- Government & military cross-ref; SIR to 3,500 lbs with L/360 for commercial equipment, safes, and sensitive devices (conditional, commercial hub's claim — cross-referenced here, not duplicated).

## What this package ADDS (no visible page copy changes by this package itself)

1. **Refreshed canonical Service node** `#service-office-moving` (schema.json in this package dir) with serviceType "Office Moving", provider → Organization → both Places, areaServed via branch @ids, per-branch ratings only, url = the hub URL, plus BreadcrumbList. This node REPLACES the two duplicate branch-flavored nodes in entity-graph.json (same @id — dedup, not a new node) and is ADDED to best-json-entity-graph.json (currently zero canonical occurrences). The 5 existing pageMeta svc pointers already aim at `#service-office-moving`; after merge they aim at a node that exists exactly once in each graph.
2. **D1–D8 full datasets** (research doc, not a light node file — see dataset-status.md): operations, office types & size bands, item taxonomy, phasing models & day-one planning, commercial terms, personas/triggers, building access & compliance, areas/quote path. Converted to Dataset JSON-LD at merge (page-level markup on the hub page + Developer-page collection entry), CC BY 4.0, dateModified = deploy date.
3. **Graph + machine-file entries at merge**: canonical node in both entity graphs (dedup in entity graph, addition in best graph); llms.txt / data txt office section refreshed from D1–D8; ai-sitemap office service entry refreshed (it already exists — refresh, don't duplicate); rubric DB rows (verify canonical service row exists from Phase A sync; add attestations + rubric_check row; opening_hours and service_area rows already exist — verify only, do not duplicate). No new pages.json entry (the pages already exist) and NO sitemap count change for this package alone.

## Page-mechanism decision: NO new page, with evidence

- The hub page EXISTS with full content, an FAQ section, and a company-supplied photo. Both branch pages EXIST with full branch sections. The commercial hub EXISTS and links onward to Office Moving.
- The problem is position + vocabulary + graph, not existence: corporate query @ 32.1 with 123 impressions; corporate 2 / department 0 / phased 0 / cubicle 0 mentions; duplicate @id in one graph and absent canonical node in the other.
- A second office hub would split intent and cannibalize pages that already carry the queries — the same reasoning as the residential package (residential-moving exists at 1,997 imp @ 78.5; no duplicate hub built).
- Therefore this package stages NO content.md, meta.json, or backlinks.md for a new page — deliberately. The depth work for the existing pages is staged below as a Phase E brief, and the corporate dedicated page is a follow-up proposal only (research doc §9).

## Phase E depth brief for the existing office pages (NOT a live edit — staged guidance only)

Add sections the pages lack, each tracing to D1–D8 or to an attestation answer — no new claims:
(a) Corporate vocabulary block (D2/D6): "corporate movers" phrasing, department heads, business continuity framing, aimed at the 123 @ 32.1 query — with no corporate practice invented.
(b) Phased/department sequence block (D4): phase by function and risk, department sequencing, blackout periods, swing space/remote safety valves — all domain-labeled, ending on the company's published sequence rule ("in a sequence").
(c) Workstation/cubicle taxonomy block (D3): desks, workstations, meeting furniture, filing, records runs (published) + cubicle/systems furniture as domain vocabulary only, never a company scope claim until research doc §8 Q7 is answered.
(d) Day-one working-order checklist block (D4): what the team needs working on day one, from the commercial hub rule, with IT items cross-referenced to the IT node, never duplicated.
(e) Building-access planning block (D7): elevator/dock/parking/badging as quote inputs; COI mentioned only as a domain item until §8 Q2 is answered.
(f) Flat-rate vs hourly explainer (D5): domain-labeled (hourly risk transfer, market ranges, downtime math), ending on the company's flat-rate-in-writing.
(g) Cross-links to the commercial hub, industrial-offices pages, IT page, and packing pages (audience split, not duplication).

## Content gaps found on the existing pages (named, not filled)

1. No corporate vocabulary section — "corporate" 2 mentions site-wide; the 123 @ 32.1 query has no matching section (brief item (a) above).
2. No phased/department sequence section — "phased" 0, "department" 0 mentions; sequence is published but phasing vocabulary is absent (brief item (b) above).
3. No cubicle/systems-furniture vocabulary — "cubicle" 0 mentions (brief item (c) above; scope gated on §8 Q7).
4. No day-one checklist section — the day-one rule exists on the commercial hub but not as an office-page checklist (brief item (d) above).
5. No building-access planning section — elevator/dock/parking/badging appear only as industrial-office site-planning phrasing (brief item (e) above; COI gated on §8 Q2).
6. No flat-rate vs hourly explainer — flat-rate-in-writing is published but the contrast that sells it to a corporate buyer is not (brief item (f) above).
7. No after-hours/weekend scheduling section — hub phrase only ("no hourly meter running over a weekend move"); scheduling scope gated on §8 Q1.
8. No size-band section — Detailed Project form captures rooms/facility size; no band published (scope gated on §8 Q4).
9. No image block of company office work beyond the hub staging photo — branch pages use the logo; no office job photo supplied beyond the hub photo, none claimed.
