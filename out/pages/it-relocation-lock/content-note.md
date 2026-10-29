# Content note — IT Relocation & Setup lock package (staged, Phase C)

Existing page (NO new slug, NO new page): `it-equipment-moving-data-center-logistics-services-virginia`
Title: "IT Equipment Moving & Data Center Logistics — Virginia"
Canonical: https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia/
Confirmed live 2026-10-29: present in the live sitemap (150 URLs) and in live index.html pageMeta + page div.
Ranking evidence: SERP #1 "IT equipment moving setup Winchester VA" (2026-10-29); GSC adjacent "business moving companies near me" at 1.0 (3-month pull to 2026-10-27).

## What the existing page already says (407 words, extracted from the live page div 2026-10-29)

- Audience: IT managers, offices, and facilities teams in Virginia moving technology that cannot be treated like furniture.
- Equipment classes: servers, racks, workstations, network equipment, peripherals. No named systems, platforms, or vendors.
- Method: planned, labelled sequence — equipment inventoried and labelled before anything is unplugged, so items arrive in the order the team needs them; packed and protected piece by piece; transported strapped and padded; placed and verified at the destination. The plan — not the truck — is agreed first, in the Detailed Project form.
- Handling: sensitive equipment travels padded, wrapped, and strapped, with custom crating for the pieces that need it.
- Heavy IT assets: racks and cabinets in the 1,500–3,500 lb band are surveyed under SIR/KIM-GS with an L/360 floor check, like any high-mass asset. SIR is framed conditionally (heavy racks only), not as a general IT claim.
- Context: data center and IT moves usually ride inside a wider office or industrial-office relocation; the page points to the Office Moving and Data Center Logistics docs.
- Branch card ("Service area, published data & quote"): both branches distinct — Winchester (The Flat Rate Movers, 116 W Piccadilly St Suite 11, Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google 5.0/1) and Martinsburg (Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google 4.7/6), ratings per branch never blended; phone +1-540-422-2153; GeoJSON 52 features cited; tagline; CTA "Get My Flat Rate Quote" with Short (Quick Quote) default / Detailed Project toggle preserving From, To, and What's moving.
- Live pageMeta desc: "IT equipment moving and data center logistics services in Virginia — servers, racks and office technology moved as a planned sequence, with careful handling, protected transport and verified placement."

## What this package ADDS (nothing visible changes on the page itself)

1. **Dedicated Service node** `#service-it-relocation` (schema.json in this package dir) with serviceType "IT Relocation & Setup", provider → Organization → both Places, areaServed via branch @ids, per-branch ratings only. This replaces the page's current borrowed pageMeta pointer: live pageMeta today points at `#service-commercial` for this page. The merge note proposes flipping that svc pointer to the new node at merge (commercial node itself stays for commercial pages).
2. **Dataset node** (dataset-node.json in this package dir): "The Flat Rate Movers — IT Relocation Dataset", CC BY 4.0, creator organization @id, keywords from the datasets doc (IT equipment moving, IT relocation winchester va, data center logistics virginia, server rack movers, office IT relocation), distribution = ai-sitemap / GeoJSON / entity graph.
3. **Per-page JSON** at merge (schema.json deployed to the verified new-page JSON serving path — see merge note §5; old-page `.json` URLs return SPA fallback HTML and do not count).
4. **Graph + machine-file entries at merge**: one Service node in both entity graphs, one services.json entry, llms.txt / data txt IT section, ai-sitemap service entry + keyword. No new pages.json entry (the page already exists) and NO sitemap count change (the page is already one of the 150).

## Content gaps found on the existing page (named, not filled)

1. **No visible FAQ block.** The page has hero + two content sections + branch/quote card only. IT query-matched FAQs (day-one planning, labelled sequence, heavy-rack SIR) are a Phase E depth item for this page, not added by this lock package.
2. **No downtime commitment, SLA, or IT-specific pricing.** Only flat rate in writing. Nothing added here.
3. **No named systems, platforms, certifications, clearances, or data-center facilities.** Equipment classes only. Nothing added here.
4. **No branch-specific IT dispatch detail.** Virginia-general coverage with a two-branch card. Nothing added here.
5. **No image block called out on the page.** R6 for this package is the approved logo as brand image; no IT job photo has been supplied.
6. **Related docs exist but are not graph-linked to IT:** `docs/data-center-logistics/` is in the sitemap and referenced from the page copy. Whether it gains an IT node link is a merge-time graph decision, not a content claim made here.
