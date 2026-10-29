# IT Relocation — Deep Datasets (Full-Data Treatment)

Staged build: 2026-10-29. Status: STAGED BUILD ONLY — no live edit, no deploy, no GitHub push by this package (the parent deploys immediately in sequence once this package is verified, per the owner's verified = live rule).
License for all datasets below: CC BY 4.0 (`https://creativecommons.org/licenses/by/4.0/`), attribution to "The Flat Rate Movers, https://theflatratemovers.com/".
Creator for every dataset: `https://theflatratemovers.com/#organization` with the 6 verified social sameAs.
Temporal coverage: 2010/2026. Spatial coverage: the two branch areas, never merged.

This package builds ON the Phase C IT-relocation lock package (staged 2026-10-29, deployed 2026-10-29):
the dedicated node `#service-it-relocation` and the pageMeta svc flip are already live. What was missing —
and what this package supplies — is the full database, the full datasets, and the full rubric. The lock
package's light dataset-node file was removed under the never-light rule; nothing light ships here either.
The D1–D8 below ARE the datasets. There is no dataset-node.json in this package dir, by design.

## Correction and refinement of the record (owned plainly)

- The Phase C lock package recorded the IT page at 407 words. My fresh extract of the live div
  (2026-10-29) counts 406 words. One-word extract variance, not a content change: the page text is
  unchanged (hero + "Planned as a sequence" + "Handled as high-value" + branch/quote card, no FAQ block).
- The lock package recorded "no dedicated IT node in either graph." That was true when staged. It is no
  longer true: the deploy batch put `#service-it-relocation` into the head graph and both machine
  graphs, and flipped the pageMeta svc pointer from `#service-commercial` to `#service-it-relocation`
  (verified live 2026-10-29: pageMeta svc = `#service-it-relocation`, exactly 1 svc pointer).
  The graph defect for THIS package is therefore not absence but refinement: the live entity-graph
  node carries no url field (observed 2026-10-29), while the best-graph node does; the head node
  likewise showed no url in my extract. The merge refresh adds url where missing and expands Place
  areaServed to the full footprint — it does not create a second node.
- The lock package recorded services.json pageCount 1 for IT. Verified still 1 in machine data
  (2026-10-29): exactly one pages.json entry carries `service-it-relocation` (the IT page itself).
  No new services.json entry is proposed by this package — the entry exists; the merge verifies it.
- The lock package recorded "no llms category" for IT. Whether the deploy batch added the IT section
  to llms.txt / data txt / ai-sitemap is NOT assumed here: the merge agent verifies at merge and
  refreshes from D1–D8 where missing, never duplicating an existing entry.
- GSC evidence is thinner than the SERP evidence, stated openly: the 3-month GSC pull to 2026-10-27
  carries no standalone "IT relocation" query row for this site. The ranking evidence is the SERP #1
  for "IT equipment moving setup Winchester VA" (2026-10-29) plus adjacent thin #1s ("business moving
  companies near me" at 1.0). No GSC number is invented for IT itself.
- The page's "Data Center Logistics docs" link target, `docs/data-center-logistics/`, IS in the live
  sitemap (verified 2026-10-29). It is a cross-reference, not a graph-linked IT node — the merge
  agent decides the graph link; this package claims no link.

## 1. What IT relocation IS (domain facts, researched + company facts, verified)

IT relocation is the physical move of technology that cannot be treated like furniture (published page
hero, live 2026-10-29): servers, racks, workstations, network equipment, and peripherals, moved as a
planned, labelled sequence — packed and protected piece by piece, transported strapped and padded,
and placed and verified at the destination. The plan, not the truck, is agreed first, in the Detailed
Project form (published page text). Data-center and IT moves usually ride inside a wider office or
industrial-office relocation (published page text); IT is its own workstream inside that wider move
(domain practice: IT cutover runs on its own sequence while furniture runs on another, coordinated
under one plan).

What makes IT relocation different from general moving (domain, researched 2026-10-29):
- **Sequence is the product.** Equipment is inventoried and labelled before anything is unplugged, so
  racks, workstations, and peripherals arrive in the order the team needs them (published). Domain
  guides add: photograph and label every cable, shut down in order, de-rack, and log every handoff.
- **Disconnection is the risk.** Damage or disconnection becomes system failure and data-access loss
  (datasets research doc §4, 2026-10-29). The buying logic is therefore downtime and damage risk,
  not price alone: the buyer wants systems working on day one, in order.
- **Heavy IT is high-mass work.** Racks and cabinets in the 1,500–3,500 lb band are surveyed under
  SIR/KIM-GS with an L/360 floor check, like any high-mass asset (published, conditional framing:
  heavy racks only, not a general IT claim).
- **The destination must be ready.** Domain practice: destination power, cooling, network
  connectivity, and rack space confirmed before move day; rack diagrams for both locations; floor
  loading limits, lift and doorway clearances, and staging-area conditions checked against the
  widest rack and the heaviest populated cabinet — not the average.
- **Cutover is phased, not big-bang, wherever possible** (domain): move in waves starting with the
  least critical systems, run old and new in parallel where possible, test each wave before the
  next, and cut over routing and DNS last in a low-traffic window, with a rollback plan if a
  critical service fails to come back up on schedule.

Company facts (verified, published): equipment classes = servers, racks, workstations, network
equipment, peripherals. Handling = padded, wrapped, strapped, with custom crating for the pieces
that need it. SIR conditional = 1,500–3,500 lb racks/cabinets only, L/360. Pricing = flat rate quoted
in writing before move day — the ONLY company pricing claim. No named system, platform,
certification, clearance, data-center facility, IT price, or SLA is published, and none is claimed
anywhere in this package.

## 2. Who needs it (buyer personas, researched + GSC/SERP evidence)

| Persona | Trigger | Buying criteria (in order) | Evidence |
|---|---|---|---|
| IT managers | Data-center move, server-room move, IT refresh, consolidation | Labelled sequence; systems back up in order; no disconnection damage; day-one working | Published audience ("IT managers, offices and facilities teams"); SERP #1 "IT equipment moving setup Winchester VA" |
| Facilities managers | Office relocation carrying IT; building change; floor/space change | Coordinated plan (IT + furniture on one schedule); building access handled; heavy-rack floor check | Published audience; page context (IT rides inside office/industrial-office moves) |
| Operations managers | Business relocation with technology dependence; new premises | Downtime minimized; day-one operations; one plan, one accountable sequence | Datasets doc §4 buyer logic (downtime, coordination gaps); commercial/office cross-ref |
| Office managers / business owners | Office move with workstations, network, phones | Workstations working Monday morning; no lost peripherals; flat price in writing | Adjacent GSC #1s ("business moving companies near me" @ 1.0; "virginia flat rate office moving company" @ 1.0); office cross-ref |
| Project managers (commercial/industrial) | Industrial-office relocation with IT scope | IT workstream inside the wider project; heavy-rack handling; phased sequence | Page context (industrial-office relocation); industrial-commercial cross-ref |

Buying logic, stated as mechanism: the buyer is not buying transport; they are buying the sequence.
A rack moved without its labels is a Monday-morning outage. A workstation moved without its cables
bagged and labelled to its desk number is an hour of guesswork per desk. The published page sells
exactly this ("planned, labelled sequence… arrive in the order your team needs them"), and the
datasets below encode it as the category's core field, not as decoration.

## 3. How it is done (the process chain, researched + matched to published company steps)

Each step marks its source: PUBLISHED (live page text 2026-10-29) or DOMAIN (researched guides,
labeled domain — industry practice, never a company claim). The company's published chain is short;
the domain chain around it is what buyers compare against, and the gaps between them are the
attestation questions in §8, not silent additions.

| Step | What happens | Source |
|---|---|---|
| 1. Survey / quote | Scope surveyed; plan agreed first in the Detailed Project form; flat rate quoted in writing before move day. | PUBLISHED (plan agreed first; flat rate in writing) + DOMAIN (inventory scope, dependency mapping, destination readiness checks) |
| 2. Inventory / label before unplug | Every item inventoried and labelled before anything is unplugged, so pieces arrive in the order the team needs them. | PUBLISHED. DOMAIN adds: serial numbers, rack U positions, PDU assignments, cable photographs, dependency maps, rack diagrams for both locations |
| 3. Protect | Sensitive equipment travels padded, wrapped, and strapped; custom crating for the pieces that need it. | PUBLISHED. DOMAIN adds: anti-static wrap for servers, individual boxing for rack units, rails labelled, toner/ink removed from printers, UPS upright |
| 4. Heavy-rack survey (conditional) | Racks/cabinets in the 1,500–3,500 lb band surveyed under SIR/KIM-GS with an L/360 floor check. | PUBLISHED, conditional (heavy racks only) |
| 5. Sequenced move | Transported strapped and padded, in the planned labelled sequence. | PUBLISHED. DOMAIN adds: waves least-critical first; network/server equipment first at destination; handoff logging |
| 6. Install / place | Placed at the destination in the labelled order; racks re-racked, workstations placed by desk/rack position. | PUBLISHED ("placed and verified"). DOMAIN adds: re-rack in order, cable reconnection by label, cold-equipment acclimation time |
| 7. Systems check | Placed AND verified at the destination. | PUBLISHED. DOMAIN adds: power up in order; internet, phones, and remote access confirmed before workstations; desk tests (power, network, dock, monitors, phone, printer); conference-room end-to-end call; engineer on site the first morning |
| 8. Close-out | Documentation updated; old space closed out. | DOMAIN only: network diagrams, circuit IDs, vendor contacts, asset inventory updated; old circuits cancelled after new ones proven; retired devices sanitized/destroyed to a documented standard (domain example: NIST SP 800-88) with certificates. Company close-out scope is UNATTESTED — see §8 Q7. |

Two scope boundaries the chain deliberately does NOT cross (both gated, §8):
- **Who unplugs / reconnects.** The page says equipment is inventoried and labelled before anything
  is unplugged. It does not say whether the company's crew or the client's IT team performs the
  unplug, shutdown, and reconnection. Nothing in this package assigns that work to either side.
- **Who owns backup / rollback.** Domain practice puts tested backups and a rollback plan on the
  client IT side before move day. The company's role in backup verification or rollback is
  UNPUBLISHED and unclaimed here.

## 4. Equipment, phase, and protection taxonomy (domain facts, researched — typical values; the survey governs each job)

### Equipment classes (PUBLISHED — the only classes the company names)

| Class | Published handling | Domain risk note (labeled domain) |
|---|---|---|
| Servers | Padded, wrapped, strapped; inventoried/labelled before unplug | Racks emptied, units boxed individually, rails labelled; rail damage and bent chassis; loss of rack mapping |
| Racks / cabinets | Same; SIR survey if 1,500–3,500 lbs, L/360 | Heaviest populated cabinet governs lift/floor checks; widest rack governs door/lift clearance |
| Workstations | Same sequence; placed by order the team needs | Monitor/CPU/dock bundled as a labelled set with serials; cables bagged and labelled per desk number |
| Network equipment | Same sequence | Dependency mapping governs order; network/server equipment brought online first at destination |
| Peripherals | Same sequence | Small, easily separated from their workstation — labelling to desk number is the control |

### Move phases (DOMAIN — industry phase models, never company promises)

| Phase | Content (domain) |
|---|---|
| Planning / assessment | Scope, inventory, dependencies, destination readiness (power, cooling, space, network), timeline, roles, rollback plan |
| Design / preparation | Rack diagrams both locations, labelling scheme, wave plan, backup verification, staging plan |
| Testing (pre-move) | Backup restore tested; destination circuits proven; dry runs where the schedule allows |
| Migration execution | Waves least-critical first; parallel running where possible; handoff logging; cutover routing/DNS last in a low-traffic window |
| Post-migration validation | Power-up in order; connectivity, application, and desk tests; monitoring; documentation updates; decommissioning |

### Protection classes (PUBLISHED + DOMAIN, labeled per row)

| Protection | Source |
|---|---|
| Padded, wrapped, strapped transport | PUBLISHED |
| Custom crating for pieces that need it | PUBLISHED |
| Anti-static wrap for servers and sensitive electronics | DOMAIN |
| Individual boxing for rack units; rails labelled | DOMAIN |
| Blanket wrap + sealed vaults for staged pieces (warehouse staging context) | DOMAIN (warehouse practice; NOT a claim about the company's leased storage — see moving-and-storage package) |
| SIR survey + L/360 floor check for 1,500–3,500 lb racks | PUBLISHED, conditional |

### Access taxonomy (DOMAIN considerations that change quote scope — planning inputs, never capability claims)

Building rules, elevator booking, dock access, parking, access windows, after-hours windows,
staging-area conditions (including climate control if equipment sits overnight), lift weight limits,
door widths, raised-floor load limits. None of these is published as a company capability; all are
framed in the datasets as inputs to the survey/quote, exactly as the residential D2/D7 pattern does.

## 5. Our pages and categories matched to the topics (verified live 2026-10-29)

| Topic | Page / node status | Score |
|---|---|---|
| IT equipment moving & data center logistics (the hub intent) | Page live: `it-equipment-moving-data-center-logistics-services-virginia` (406 words by my extract; hero + 2 sections + branch/quote card; NO FAQ block). Node live in head + both machine graphs (`#service-it-relocation`, serviceType "IT Relocation & Setup"). pageMeta svc flipped to the IT node (verified). services.json entry exists, pageCount 1. | STRONG on node + page existence; PARTIAL on depth (no FAQ, thin buyer vocabulary for cutover/waves/rollback queries) |
| Office IT coordination (IT inside office moves) | Office hub + branch pages exist (separate category, cross-ref only). IT page itself states IT moves usually ride inside wider office relocations. | STRONG as cross-ref; NOT duplicated here |
| Commercial IT coordination (IT inside commercial moves) | Commercial hub exists (separate category, cross-ref only). IT node description itself frames IT as part of commercial and office relocations. | STRONG as cross-ref; NOT duplicated here |
| Data center logistics docs | `docs/data-center-logistics/` IS in the live sitemap; referenced from the IT page copy. No graph link to the IT node claimed. | PARTIAL — graph link is a merge-time decision (§8 Q11), not a content claim |
| Heavy-rack SIR handling | SIR conditional published on the IT page (1,500–3,500 lbs, L/360); SIR category is separate (cross-ref only). | STRONG as cross-ref; NOT duplicated here |
| Custom crating for IT pieces | Custom crating published on the IT page as handling ("custom crating for the pieces that need it"); crating category is separate (cross-ref only). | STRONG as cross-ref; NOT duplicated here |
| IT FAQ / buyer-question depth | NO visible FAQ block on the IT page (verified: no "questions, answered" section, no FAQ text in the div). Buyer questions (day-one order, labelling, heavy racks, disconnect scope, backup scope) have no matched visible answers beyond the two sections. | GAP — Phase E depth brief in content-note.md proposes the FAQ block as staged guidance only |
| IT pricing / SLA / downtime commitment | None published anywhere on the page or in the node. Flat rate in writing is the only pricing claim. | GAP by design — gated (§8 Q5), never filled from domain |
| Named systems / platforms / certifications / facilities | None published. Equipment classes only. | GAP by design — gated (§8 Q1–Q3), never filled |
| Branch-specific IT dispatch | None published. Page covers Virginia generally with a two-branch card. | GAP by design — gated (§8 Q4) |

## 6. Deep database-style datasets (full depth — license CC BY 4.0, attribution to The Flat Rate Movers, creator organization @id, temporalCoverage 2010/2026, spatialCoverage branch areas, never merged)

Conventions for every dataset below: fields list the data model; `company` rows carry verified
published facts with sources; `domain` rows carry researched industry practice, labeled domain, never
presented as company facts; `gated` rows name the attestation question that must be answered before
the field may carry a company value. Keywords are real queries (SERP/GSC-adjacent), not invented
phrases. Target queries are the queries each dataset is built to defend or win.

### D1 — IT Relocation Operations

Fields: operation_id, step, step_name, company_action (published or null), domain_practice (labeled
domain), inputs, outputs, verification, source, attestation_status.
Relationships: D1.step → D3.phase; D1.step → D7.protection; D1.operation → D8.quote_path.
Rows (summary; full field rows are the table above in §3): survey/quote (company: plan agreed
first in Detailed Project form; flat rate in writing); inventory/label before unplug (company);
protect (company: padded/wrapped/strapped + custom crating); heavy-rack SIR survey, conditional
(company: 1,500–3,500 lbs, L/360); sequenced move (company); install/place (company); systems
check (company: placed and verified; domain: power-up order, desk tests, first-morning engineer);
close-out (domain only; company scope gated §8 Q7).
Keywords: IT equipment moving, IT relocation winchester va, data center logistics virginia,
server rack movers, office IT relocation, IT equipment moving setup Winchester VA.
Target queries: "IT equipment moving setup Winchester VA" (defend SERP #1); "server rack movers
Virginia"; "data center logistics Virginia"; "office IT relocation".
Rubric mapping: R1 (sequence as the topic), R3 (every company row traces to a page sentence),
R5 (gated rows stay null).

### D2 — Equipment & Site Operations

Fields: class_or_input, published_scope, domain_detail (labeled domain), quote_impact, source,
attestation_status.
Equipment rows: servers, racks/cabinets, workstations, network equipment, peripherals — published
classes with published handling; domain risk notes from §4.
Site-input rows (all domain planning inputs, none a company capability claim): destination power,
cooling, network connectivity, rack space, rack diagrams both locations, floor loading limits,
lift weight limits, doorway widths (widest rack governs), raised-floor limits (heaviest cabinet
governs), staging-area conditions including climate control for overnight staging, elevator
booking, dock access, parking, access windows.
Relationships: D2.class → D3.equipment_class; D2.site_input → D1.step (survey/quote).
Keywords: server rack move, IT equipment moving, data center move planning, rack relocation.
Target queries: "how to move server racks"; "IT equipment move planning"; "data center relocation
checklist".
Rubric mapping: R1 (buyer's site worries named), R5 (site inputs framed as inputs, never claims).

### D3 — Equipment & Workstream Taxonomy

Fields: taxonomy_level, term, definition, published_or_domain, cross_reference, source.
Levels:
- Equipment: servers / racks-cabinets / workstations / network-equipment / peripherals (all
  PUBLISHED classes; no vendor, system, or platform term appears — gated §8 Q1).
- Phases: planning-assessment / design-preparation / pre-move-testing / migration-execution /
  post-migration-validation (all DOMAIN phase models).
- Protection: padded / wrapped / strapped (PUBLISHED); custom-crating (PUBLISHED); anti-static-wrap /
  individual-boxing / rails-labelled (DOMAIN).
- Workstreams: physical-move (company scope, published) / IT-cutover-coordination (client-IT
  coordination, DOMAIN practice; company role gated §8 Q6) / furniture-move (cross-ref: commercial,
  office — never duplicated) / heavy-rack-SIR (cross-ref: SIR category, conditional only).
- Move patterns: single-wave / phased-waves-least-critical-first / parallel-running (all DOMAIN).
Relationships: D3.workstream → D1.step; D3.equipment → D2.class; D3.phase → D6.trigger.
Keywords: IT relocation phases, server move workstream, data center migration phases.
Target queries: "data center migration phases"; "IT relocation workstream"; "phased server migration".
Rubric mapping: R2 (taxonomy feeds the node description fields), R5 (no invented system terms).

### D4 — Dispatch Network & Corridor Chain

Fields: branch, gbp_areas (draft), full_footprint_at_merge, corridors, dispatch_note, source.
Rows: Winchester — GBP 16 areas in draft; full footprint 31 at merge; corridors I-81/I-66/I-70;
dispatch note: page covers Virginia generally with a two-branch card; NO branch-specific IT
dispatch claimed (gated §8 Q4). Martinsburg — GBP 14 areas in draft; full footprint 35 at merge;
same corridors; same no-branch-specific-claim rule. Shared: Moorefield 26836 (both branches,
correct overlap). Total footprint: 52 GeoJSON features (verified live 2026-10-28; cited on the page
card). Corridor disclaimer (carried from the corridor pages): areas are the audience/coverage pool,
NOT a claim that a listed town sits on a particular highway.
Relationships: D4.branch → D8.service_area; D4.corridor → commercial/office corridor chain
(cross-ref, never duplicated).
Keywords: IT equipment moving Winchester VA, IT relocation Martinsburg WV, data center logistics
Virginia, Shenandoah Valley IT moving, Eastern Panhandle IT relocation.
Target queries: "IT equipment moving Winchester VA"; "data center logistics Virginia".
Rubric mapping: R2 (Place chain via branch @ids), R5 (no branch-specific dispatch invented).

### D5 — Commercial Terms & Cost Drivers

Fields: term, company_value (published or null), domain_value (labeled domain), source,
attestation_status.
Rows:
- Company pricing claim: flat rate quoted in writing before move day (PUBLISHED — the ONLY company
  pricing term). No IT-specific price, no hourly rate, no per-rack/per-server price, no deposit,
  no surcharge, no discount anywhere in this package.
- Estimate form: "flat rate in writing" is the published claim. Which formal estimate type that
  maps to is UNATTESTED (no mapping claimed; compare long-distance D5, where estimate-type mapping
  is likewise gated).
- SLA / downtime commitment: NULL (company). Domain: cutover windows, wave plans, and rollback
  plans are how the industry bounds downtime — presented as domain practice, never as a company
  commitment (gated §8 Q5).
- Cost drivers (ALL domain, labeled domain): planning horizon and wave count; equipment count and
  rack weight; access conditions (elevator, dock, stairs, distance); heavy-rack SIR survey scope;
  destination readiness work (circuits, power, cooling — typically client-side); staging duration.
  None is priced here; no dollar figure appears in this dataset.
- Valuation: NULL (company). Domain education only: valuation is not insurance; inventory + bill
  of lading discipline governs claims; Released Value vs Full Value is domain education, never a
  company offering (compare residential/long-distance D5/D7 — same rule).
Relationships: D5.term → D1.step (survey/quote); D5.valuation → D7.compliance.
Keywords: flat rate IT moving, IT relocation quote, server move cost drivers (domain education).
Target queries: "flat rate IT moving Virginia"; "IT relocation quote Winchester VA".
Rubric mapping: R5 (the dataset's discipline is visible: one company term, everything else domain
or null).

### D6 — Buyer Personas & Trigger Events

Fields: persona, trigger, buying_criteria_ranked, content_hook, source.
Rows (from §2, expanded with triggers): IT managers — data-center move / server-room move /
consolidation / refresh; criteria: labelled sequence first, day-one order second, damage avoidance
third, flat price fourth. Facilities managers — office relocation carrying IT / building change;
criteria: one coordinated schedule first, building access second, heavy-rack floor check third.
Operations managers — business relocation / new premises; criteria: downtime first, day-one
operations second, one plan third. Office managers / owners — office move with workstations;
criteria: Monday-morning working desks first, no lost peripherals second, flat price third.
Project managers — industrial-office relocation with IT scope; criteria: IT workstream inside the
wider project first, phased sequence second, heavy handling third.
Seasonality/trigger notes (domain): office-move weekends (Friday-out / Monday-in pattern) and
lease-end/expansion/consolidation cycles drive IT-move timing; no company booking-window promise
is made (compare local-regional D6: booking windows are domain, never availability promises).
Relationships: D6.persona → D1.step; D6.trigger → D8.quote_path.
Keywords: IT manager server move, office IT relocation, data center move planning.
Target queries: "IT manager server room move"; "office IT relocation checklist".
Rubric mapping: R1 (audiences named with triggers and criteria, sourced).

### D7 — Protection, Handling & Building Compliance

Fields: control, published_or_domain, scope_note, source, attestation_status.
Rows: padded/wrapped/strapped transport (PUBLISHED); custom crating (PUBLISHED); anti-static wrap
(DOMAIN); individual boxing + rails labelled (DOMAIN); inventory + labels before unplug
(PUBLISHED); cable photographs + dependency maps (DOMAIN); SIR survey + L/360 for 1,500–3,500 lb
racks (PUBLISHED, conditional); destination power/cooling/network verification (DOMAIN);
power-up in order + desk tests + first-morning engineer (DOMAIN); building rules / elevator
booking / dock / parking / access windows (DOMAIN planning inputs, never capability claims);
security controls — access control both sites, audit trails, chain-of-custody for sensitive assets,
restoring cybersecurity controls relaxed for the move (DOMAIN); media sanitization to a documented
standard at decommissioning (DOMAIN example: NIST SP 800-88, certificates — never a company
service claim).
Valuation rule (carried across all deep packages): valuation is never called "insurance" in
company copy; no company coverage offering is claimed here.
Relationships: D7.control → D1.step; D7.sir → SIR category (cross-ref, conditional only).
Keywords: server rack protection, IT equipment handling, data center move security.
Target queries: "how to protect servers during a move"; "IT equipment handling best practices".
Rubric mapping: R3 (every published row traces to a page sentence), R5 (domain rows labeled).

### D8 — Service Areas, Dispatch & Quote Path

Fields: branch, areas_draft, areas_at_merge, corridors, quote_path, source.
Rows: Winchester — draft GBP 16; merge expands to full footprint 31; corridors I-81/I-66/I-70.
Martinsburg — draft GBP 14; merge expands to full footprint 35; same corridors. Shared 14;
total 52 GeoJSON features. Branches distinct in every row; no merged list; no org-level rating.
Quote path (PUBLISHED pattern): main CTA "Get My Flat Rate Quote"; pill "Get a flat rate quote";
Short (Quick Quote) default / Detailed Project toggle switching in place, preserving From, To,
and What's moving; the plan itself is agreed in the Detailed Project form (published page text).
Survey room: film-only walkthrough with a human-made estimate where a walkthrough fits the job
(site-wide pattern; the IT page's own plan-agreement point is the Detailed Project form — the two
are not conflated).
Relationships: D8.branch → D4.branch; D8.quote_path → D1.step (survey/quote).
Keywords: IT equipment moving Winchester VA, IT relocation Martinsburg WV, get flat rate IT quote.
Target queries: "IT equipment moving quote Winchester VA"; "flat rate IT relocation".
Rubric mapping: R7 (quote path verified as pattern; live-form re-check at deploy, no test post).

## 7. Rubric positioning — how these datasets move rankings

- The node is LIVE, so this package does not win by creating a node — it wins by DEEPENING one.
  The live node carries the lock description; the D1–D8 give that node a dataset body (page-level
  Dataset markup + Developer-page collection entry at merge, same pattern as residential) and a
  keyword field drawn from real queries instead of the lock's five hand-picked keywords.
- The page is THIN (406 words, no FAQ) and already ranks #1 for its head query on content alone.
  Depth is therefore high-leverage and low-risk: the Phase E brief adds buyer-question blocks
  (FAQ + day-one + labelling + heavy-rack) to the existing page without changing its intent, slug,
  or node — no cannibalization, because no second page is created.
- The vocabulary gap is the position risk to watch: the page's own words cover sequence, handling,
  and SIR-conditional, but buyer comparison queries (waves, cutover, rollback, backup, disconnect
  scope, valuation) have no matched visible answers. The depth brief targets exactly those words,
  each traced to D1–D8 or to a §8 answer — never invented as company scope.
- The small node-shape refinements (url on head/entity nodes; full-footprint Place areaServed)
  close the last structural gaps between the lock deploy and the deep standard the residential
  batch set (entity 39 / best 74 nodes at residential deploy; IT refresh keeps counts unchanged —
  no new node is added by this package).

## 8. Attestation questions for Henry (nothing below is claimed until he answers)

1. **Named systems / platforms scope.** Does the company handle particular vendor systems, platforms,
   or equipment families beyond the published classes (servers, racks, workstations, network
   equipment, peripherals)? None published; none claimed until answered.
2. **Certifications / clearances.** Does the company hold, or claim, any IT certification, clearance,
   or standards-body credential? None published; the lock package's "no invented certifications"
   rule stands until answered.
3. **Data-center facility scope.** Are particular data-center facilities, colocation sites, or
   facility partnerships in scope — or is "data center logistics" Virginia-general only, as the
   page currently frames it? No facility named until answered.
4. **Branch-specific IT dispatch.** Does a specific branch handle IT jobs, or do both branches
   dispatch IT work Virginia-wide as the page card implies? No branch-specific claim until answered.
5. **IT pricing / SLA / downtime commitment.** Beyond flat rate in writing, is there an IT-specific
   price basis, an SLA, or a downtime commitment? None published; none claimed until answered.
6. **Disconnect / reconnect scope.** Does the company's crew perform shutdown, unplug, and
   reconnection — or does the client's IT team, with the company handling inventory, labelling,
   protection, and transport? The page says equipment is inventoried and labelled before anything
   is unplugged; it does not assign the unplug itself. Unassigned until answered.
7. **Backup / rollback / close-out scope.** Does the company verify backups, own the rollback plan,
   or perform close-out documentation — or are those client-IT responsibilities? Domain practice
   puts them client-side; company scope unattested until answered.
8. **FAQ block approval (Phase E).** Approve the proposed FAQ entries in content-note.md (day-one
   order, labelling, heavy-rack SIR, disconnect scope gated on Q6, backup scope gated on Q7)?
   Questions whose answers depend on Q6/Q7 stay out until those answers land.
9. **Sub-band rack handling.** Racks below 1,500 lbs: same method, separate handling, or different
   service? (Parallel to the gun-safe sub-band gate; hub implies lighter IT pieces move under the
   same sequence, but handling is unpublished.)
10. **Per-page JSON + node refresh approval at merge.** Confirm the merge refreshes the live IT node
    from this schema (url fields, full-footprint Place areas, description unchanged) and ships the
    per-page JSON via the verified new-page JSON serving path (old .json URLs return SPA fallback
    HTML and do not count).
11. **docs/data-center-logistics graph link.** Should the docs page gain a graph link to the IT node
    at merge, or stay a copy cross-reference only? Merge-time decision; no link claimed here.

## 9. What goes to merge + follow-ups

**To merge (proposal, merge-note.md):** node REFRESH (not add) in both machine graphs + head graph
(url fields added where missing; Place areaServed expanded to full footprint 31/35; description
unchanged from the deployed lock node); D1–D8 converted to Dataset JSON-LD at merge (page-level
markup on the IT page + Developer-page collection entry, CC BY 4.0, dateModified = deploy date);
llms.txt / data txt IT section verified and refreshed from D1–D8 where missing (never duplicated);
ai-sitemap IT entry verified and refreshed (keywords from real queries); rubric DB rows (verify
existing IT rows from the lock deploy first — add only what is missing, never duplicate);
services.json entry VERIFIED (exists, pageCount 1 — no new entry); pages.json entry VERIFIED (no
new entry). NO sitemap count change (no new page). NO services count change (entry exists).

**Follow-ups (separate packages, not built here):** Phase E depth sections for the IT page (FAQ
block + day-one + labelling + heavy-rack blocks, staged as content-note.md guidance only; live
copy changes only on §8 answers where gated); real per-page JSON for the IT page (verify the
new-page JSON serving path at merge); GBP IT service addition (Phase G, owner-approved);
disconnect/reconnect scope section (only if Q6 answered); backup/rollback scope section (only
if Q7 answered). NOT proposed: any named system, platform, certification, clearance, facility,
IT price, SLA, downtime commitment, crew-size or truck claim, testimonial, client name, contract,
or facility claim — all gated or unverified, never built on assumption.
