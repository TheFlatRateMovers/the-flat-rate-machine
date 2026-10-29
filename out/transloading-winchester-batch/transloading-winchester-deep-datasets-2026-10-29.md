# Winchester Transloading — Deep Datasets (Full-Data Treatment, Extending the Ocean Datasets)

**Date:** 2026-10-29. **Authorized by:** Henry Pitts, 2026-10-29 (senior, warehouse, IT, and transloading all need full data + deployment, like the other categories; verified nodes deploy and go live immediately — this package is the STAGED BUILD, the parent deploys it in sequence once verified).
**Basis:** Web research 2026-10-29 (cited generally) + live-site inventory 2026-10-29 (curl with browser user-agent: sitemap 153 URLs; live index 1,121,344 bytes; transloading-winchester-va.json 200 + application/json, 5,872 bytes; entity-graph.json 39 nodes; best-json-entity-graph.json 74 nodes) + the ocean container datasets doc 2026-10-29 (D1–D8, already live as ai-repo machine files) + the Phase C Winchester transloading package 2026-10-29 (content.md 1,765 words, meta.json, schema.json, rubric.md, backlinks.md 17/17, merge-note.md).
**Status:** STAGED BUILD ONLY. Nothing here is live. Company claims use only verified facts; domain facts are researched general knowledge, labeled as such. Anything unverified is an attestation question, never a claim. The generic `#service-transloading` node is left untouched throughout.

## Correction and refinement of the record (owned plainly)

1. **This is a depth package, not a page-creation package.** The Phase C Winchester transloading page is LIVE (slug `transloading-winchester-va`, in the 153-URL sitemap, per-page JSON live at 5,872 bytes, FAQ section, Sources & attestation section). The ocean doc §5 listed a Winchester page as a GAP — that gap is closed. What remains is depth: full Winchester datasets (W-D1–W-D8 below, extending ocean D1–D8, not duplicating them), a node refresh, and a rubric.
2. **The machine-graph node state is refined, not absent.** Both machine graphs already hold `#service-transloading-winchester-va` (entity 39 nodes, best 74 nodes). The defects are narrower than "missing node": the entity-graph node has NO url (the best-graph node has one); both nodes carry areaServed as `#winchester-place` / `#martinsburg-place` @ids; and both graphs' Place nodes still carry GBP lists only (16/14) even though the LIVE page already displays the full footprint (31/35). The refresh therefore: add url to the entity node, expand machine Place areaServed to the full footprint at merge (with name-format reconciliation — see item 4), and upgrade the thin head node (see item 3).
3. **The head node is thin, not absent.** The 24-node head graph holds exactly one `#service-transloading-winchester-va` node: serviceType "Transloading", NO url, areaServed as 7 broad strings (Winchester, VA / Martinsburg, WV / Shenandoah Valley / Eastern Panhandle / I-81 corridor / I-66 corridor / I-70 corridor). The merge upgrades it with url + the full staged description; the 7 corridor-inclusive strings are KEPT (they are accurate for a transloading node, not a defect).
4. **Place @id conventions differ by file — flagged, not silently fixed.** Machine graphs use `#winchester-place` / `#martinsburg-place`; the live per-page JSON uses `#winchester` / `#martinsburg`; the head graph holds NO Place nodes at all (Organization + WebSite + 22 Service nodes). This package's schema.json follows the MACHINE convention (`-place`) for graph merge. The merge agent reconciles the page-JSON convention without renaming either file's @ids silently, and never creates duplicate Place nodes.
5. **Vocabulary moved since the ocean doc — but reefer/bonded/FTZ are negations, not coverage.** Live index counts 2026-10-29: transload 431, deconsolid 159, demurrage 4, detention 3, drayage 4, chassis 4, devan 3, destuff 2, twic 16, reefer 3, bonded 3, FTZ 1, flat rack 0. Against the ocean doc's morning baseline (demurrage 0, detention 0, chassis 0, reefer 0, devan 0, twic 15), the Winchester page ADDED demurrage, detention, drayage, chassis, devanning, and destuffing vocabulary. But reefer (3), bonded (3), and FTZ (1) occur ONLY as negations: the page FAQ "Does this page cover reefer, bonded, or customs work? No." and the Sources & attestation gate line listing them as NOT claimed. They must never be counted as coverage. Flat rack remains 0. TWIC's 16 mentions are emergency-page URLs, chips, and pageMeta — the Winchester page's prose makes NO credential claim, and that stays as-is.
6. **Ocean datasets serving correction.** `datasets-ocean-container.json` returns HTTP 200 with Content-Type `text/html` on the live domain (verified 2026-10-29) — it is the SPA fallback, NOT a JSON file. The ocean D1–D8 therefore live as ai-repo machine files only, not as a live-domain JSON file. `datasets-residential.json`, by contrast, returns 200 + application/json — the verified pattern this package's proposed `datasets-transloading-winchester.json` follows. `datasets-transloading-winchester.json` does NOT exist yet (SPA HTML) — it is proposed in §9, not claimed.
7. **Phase C gap 11 is RESOLVED live.** The Phase C rubric listed the extended footprint as not included in the staged draft. The LIVE Winchester page now displays "Winchester service areas (full footprint, 31)" with the GBP 16 + extended 15 split, and a Sources & attestation line citing the full footprint. The deep package's merge note accounts for this instead of re-proposing it.
8. **The CWT schedule is NOT on this page — and a crude slice can mislead.** A naive slice of the live index around the Winchester div returns the industrial-commercial CWT schedule figures — but those come from the industrial-commercial sections elsewhere in the single-file SPA, NOT from the Winchester transloading page, whose content.md carries ZERO dollar figures and states "quoted per job" only (5 occurrences in the page's own text). Any future count must scope to the page's own div, not the whole file. This package keeps CWT off the Winchester page; the schedule lives on industrial-commercial only, cross-referenced at most, and its figures are NOT repeated in this package.

## 1. What Winchester transloading IS (domain facts, researched + company facts, verified)

- **Transloading** = unloading an ocean container PLUS immediate reload into domestic equipment — typically a 40ft ocean container's cargo restacked into 53ft domestic trailers — so the ocean box returns near the port and the domestic trailer carries the inland leg. It gives the shipper control over routing, speed to multiple markets, and capacity use. (Published on the Winchester page; ocean doc §1.)
- **Unloading (devanning / destuffing)** = removing cargo from an ocean container at a warehouse or container freight station, then sorting and staging it for delivery. "Destuffing" is the same operation; the word is standard on Asian and UK trade documents. (Published on the Winchester page.)
- **Cross-docking** = freight that never enters storage: it touches the dock floor for hours, not days, then leaves on outbound LTL or FTL the same shift. A transload is often done as a cross-dock move, but it can also include a few days of storage between legs. (Published.)
- **Deconsolidation (decon)** = breaking a consolidated container apart by destination, purchase order, or SKU — the step that turns one inbound box into many outbound loads. (Published.)
- **Drayage** = the short-range move, usually 100 miles or less, carrying a released container from its port of arrival to a nearby warehouse or storage facility. On the Winchester page it is a CHAIN STEP ONLY — the page does not state who performs it (see §8 Q2). (Published as definition; performer gated.)
- **IPI vs transload** = under IPI (inland point intermodal), the original ocean container continues inland to the destination. Under transloading, cargo transfers to domestic equipment in the first mile, adding control and visibility and making it easier to pivot between rail and truck. (Published.)
- **Winchester transloading, specifically** = the above operations executed from the Winchester branch through the Virginia Inland Port and Port of Virginia chain, dispatched on I-81, I-66, and I-70, with Martinsburg as the distinct sister branch (own page, own hours, own areas, own rating — never blended). The Winchester page is the new-format branch page; the six container pages cover the topic generally; the Martinsburg page covers its branch. One page per intent. (Published.)

## 2. Who needs it (buyer personas, researched + SERP/GSC evidence)

- **Importers and distributors** receiving regular overseas shipments — the core buyer. They need the box out of the terminal inside free time, counted, photographed, and either stored or reloaded. (Published audience; ocean doc §2.)
- **Retail and e-commerce businesses** turning stock over fast — replenishment speed, sortation by store/SKU, retail routing compliance. (Published audience.)
- **3PLs, freight forwarders, and brokers** needing a reliable local partner for the warehouse workflow: devanning, transload, cross-dock, labeling, sortation. (Published audience.)
- **Manufacturers** receiving components and raw materials — inbound reliability for production. (Published audience.)
- **Warehouses and distribution centers** facing floor-loaded arrivals, multi-container days, and overflow or surge. (Published audience.)
- **Project cargo owners** with heavy or oversized loads — with the SIR conditional: a high-mass asset in the 1,500–3,500 lb range moves under SIR (L/360) as part of the same flat-rate job; SIR is NOT claimed for transloading generally. (Published, conditional only.)
- **The actual searcher** is usually an operations person — a warehouse or logistics manager, a project manager — buying on dock reliability, pace, sequencing, and communication, not on brand. (Published; ocean doc §2.)
- **Demand evidence (verified):** SERP #3 organic for "transloading services Virginia port container" (first mover, behind a port specialist and a government directory — live SERP check 2026-10-29); emergency port container recovery page 11 AI-feature impressions (GSC 3-month pull to 2026-10-27); "container moving" emerging in GSC Insights (previously 0). The Winchester page exists to LOCK the SERP #3 and grow it — it is a defense + growth page, not a discovery page.

## 3. How it is done (the process chain, researched + matched to published company steps)

1. **Pre-arrival planning** — outbound routing, destination addresses, load plan, and equipment count confirmed before the vessel arrives; the transload appointment booked before the container leaves the terminal. (Published.)
2. **Port release and the short move in** — the container is picked up at the terminal as soon as it is released and delivered to the transload and warehouse facility inside the ocean carrier's free time. (Published; performer of the short move gated — §8 Q2.)
3. **Devanning, count, and inspection** — the container is unloaded, floor-loaded or palletized; freight is counted and inspected; damage is photographed and reported the same day, in writing, so the buyer sees actual cargo condition before it travels inland. (Published.)
4. **Rework** — cargo is palletized if needed, shrink-wrapped, labeled, sorted by purchase order, SKU, or destination, and segregated for multi-destination loads. (Published.)
5. **Restacking into domestic equipment** — cargo is restacked into 53ft trailers (a 40ft container becomes about 20 pallet positions; a 20ft about 10) or staged for storage. (Published.)
6. **Inland dispatch** — trailers depart same-day or next-morning for warehouses, distribution centers, retail partners, or final customers, as FTL, LTL, or split delivery. (Published.)
7. **Empty return** — the ocean container returns to the terminal immediately after devanning, before per-diem charges start. (Published.)
8. **Final mile** — last-leg delivery to stores, offices, homes, and job sites by appointment, through the company's verified final-mile delivery service. (Published.)
- The company's own published steps sit inside this chain: receive → unload → count → sort by destination → stage → build outbound (container deconsolidation reference) and quoted → surveyed → packed → loaded → transloaded → delivered → verified placement (logistics event protocol). The datasets below attach industry vocabulary to that verified chain instead of inventing a new one. (Published docs pages.)

## 4. Taxonomy (domain facts, researched — typical values; the job governs each load)

### 4a. Operations vocabulary (domain definitions; published on the Winchester page unless noted)

| Term | Meaning (domain) | Winchester page status |
|---|---|---|
| Devanning / destuffing | Unloading an ocean container at a warehouse/CFS | Published (definitions + chain step) |
| Cross-docking | Freight never enters storage; leaves same shift | Published |
| Deconsolidation (decon) | Break a consolidated container by destination/PO/SKU | Published |
| Drayage | Short move, usually ≤100 miles, port → warehouse | Published as chain step ONLY; performer gated |
| IPI | Original ocean container continues inland | Published (contrast only) |
| Restacking | Reload into 53ft domestic trailers (40ft ≈ 20 pallet positions; 20ft ≈ 10) | Published |
| Split delivery | One inbound container fans out to several destinations | Published (inland dispatch) |
| Floor-loaded | Cargo loaded without pallets, unloaded by hand sequence | Published (devan step) |
| Palletized | Cargo on pallets, handled by equipment | Published |

### 4b. Commercial-terms vocabulary (domain education; NEVER company terms)

| Term | Meaning (domain) | Winchester page status |
|---|---|---|
| Free time / last free day (LFD) | Window before charges start; LFD ends it | Published as domain facts |
| Demurrage | Charge for a box sitting AT the terminal past free time; accrues per container per day, typically escalating the longer it sits | Published as domain facts; fresh research 2026-10-29: free-time windows vary by carrier/terminal (commonly a few working days to two weeks); published market markers (domain only) run $75–150/day escalating to $350+/day after two weeks |
| Detention (per-diem) | Charge for a box kept OUTSIDE the terminal past free time; clock stops when the empty is returned | Published as domain facts |
| Port storage | Separate terminal charge, distinct from the line's demurrage, payable on top of it | Domain education (new in this package) |
| Chassis | Wheeled frame a container rides on for the short move; pool-managed; split fees when container and chassis come from different locations (domain markers $20–75/day) | Published as domain facts (sourcing/shortages/tri-axle as variables) |
| Tri-axle chassis | Chassis variant for overweight boxes | Published as domain variable |
| Overweight alternative | Transloading removes container weight from the permitting equation; for some lanes cheaper than permitting even when a permit is available | Published as domain fact |
| FMC billing rule (2024) | US Federal Maritime Commission rule: demurrage/detention invoices must be issued within a set window with required details (dates, basis); late or detail-free invoices may be challenged within a set dispute timeframe | Domain regulatory context (new in this package; never a company claim) |
| Causes of charges (domain) | Late/incomplete documents, duty delays, customs exams, transport not arranged after release, slow offload, late empty return | Domain education (new in this package) |
| Avoidance discipline (domain) | Documents before arrival; know free time at booking; negotiate extra free time where possible; pre-clear; coordinate clearance + transport; site ready to offload; prompt empty return; devan into a warehouse when premises are not ready | Domain education (new in this package) |

### 4c. Container equipment reference (DOMAIN ONLY — handled types are gated, §8 Q9)

The ocean doc §4 taxonomy stands (20GP ~33 m³ ~28,200 kg; 40GP ~67 m³ ~26,700 kg; 40HC ~76 m³ ~26,580 kg; reefers −30°C to +30°C; open top; flat rack 20ft ~40 t / 40ft ~45 t; platform; tank 20,000L+; max gross most dry 30,480 kg; CSC plate governs each box). This package does NOT re-list the table as company scope: NO container type is claimed as handled by the Winchester operation until attested. The taxonomy's role here is query vocabulary (buyers search sizes and types) and a gated checklist, not a capability claim. Flat rack remains 0 mentions site-wide — the OOG gap is open, not filled.

## 5. Our pages and categories matched to the topics (verified live 2026-10-29)

| Topic / subject | Our page(s) | Node | Status |
|---|---|---|---|
| Winchester transloading (new format) | transloading-winchester-va | transloading-winchester-va | STRONG page (content.md 1,765 words; live div + FAQ + Sources & attestation + full footprint 31); per-page JSON LIVE (5,872 bytes, application/json); node in both machine graphs + head graph (refresh proposed — see §6/§9) |
| Martinsburg transloading | transloading-movers-martinsburg-wv | transloading (generic) | STRONG branch page; kept distinct, never merged |
| Generic transloading / container services | service-transloading registry entry (pageCount 16) + 6 container pages + docs pages | transloading | STRONG topic cluster; generic node in entity graph ONLY (Martinsburg-pointed, string areas); ZERO generic nodes in best graph — left untouched by this package |
| Container loading & unloading, port transload | container-loading-unloading-services-port-transload-virginia | transloading | STRONG page; no standalone JSON (Phase D item) |
| Port of Virginia container & logistics | port-of-virginia-container-loading-unloading-logistics-services | transloading | STRONG page; no standalone JSON (Phase D item) |
| Virginia Inland Port freight & transloading | virginia-inland-port-freight-transloading-operations | transloading | STRONG page; no standalone JSON (Phase D item) |
| Emergency port container recovery | emergency-port-container-recovery-twic-labor-virginia | transloading | STRONG page; AI 11; twic in URL/chips/pageMeta only — no credential claim in prose; no standalone JSON (Phase D item) |
| Deconsolidation + cross-docking + transloading | container-deconsolidation-cross-docking-transloading-services-virginia | transloading | STRONG page; no standalone JSON (Phase D item) |
| Deconsolidation, Virginia & Mid-Atlantic | container-deconsolidation-services-virginia-mid-atlantic | transloading | STRONG page; no standalone JSON (Phase D item) |
| Deconsolidation reference (receive→unload→count→sort→stage→build) | docs-container-deconsolidation | transloading | STRONG docs asset — live SPA `#/` route (verified in the live index), NOT a sitemap loc; no standalone JSON (Phase D item) |
| Logistics event protocol (quote→transload→deliver→verified placement) | docs-logistics-event-protocol | — | STRONG docs asset — live SPA `#/` route (verified in the live index), NOT a sitemap loc |
| Final-mile leg | commercial-freight-handling-white-glove-final-mile-services | final-mile + transloading | STRONG; final leg of the transload chain |
| Industrial-commercial project support (Ocean Container Handling, Transloading, Restacking as serviceTypes; CWT schedule) | industrial-commercial-services | industrial-commercial | STRONG; CWT schedule lives HERE ONLY — never copied onto the Winchester page |
| Heavy assets in transloads (conditional SIR) | sir-heavy pages + Winchester FAQ | sir-heavy (conditional) | STRONG conditional only (1,500–3,500 lbs, L/360) |
| ISPM 15 export packing + custom crating (adjacent, not transloading) | ispm15 + crating pages | ispm15, crating | STRONG adjacent; cross-ref only |
| Ocean datasets (machine files) | ai-repo data/datasets-ocean-container.json | — | LIVE as ai-repo machine files; NOT served as JSON on the live domain (SPA HTML — see Correction 6); Winchester datasets file proposed following the residential pattern |
| GBP products (both branches) | Ocean Container Handling, PODS Handling, Transloading, Restacking, ISPM 15 Export Packing, Custom Crating, Industrial & Commercial Project Support, Warehouse Load-Outs & Inbound Unloads | — | STRONG (Phase G re-check item for any still-pending products) |
| Drayage (standalone) | none | — | GAP — vocabulary present (4 mentions), no page, no node, performer gated |
| Demurrage/detention/free-time cost-avoidance (standalone) | Winchester cost-avoidance section only | — | PARTIAL — section exists on the Winchester page; no standalone page (Phase D item) |
| Container types/sizes reference | none | — | GAP — taxonomy is domain reference only; handled types gated |
| Reefer / cold chain | none (negation contexts only) | — | GAP — no page, node, or claim (attestation required) |
| Flat rack / out-of-gauge | none (0 mentions) | — | GAP — no page, node, or claim (attestation required) |
| Bonded / FTZ / customs brokerage | none (negation contexts only) | — | GAP — no page, node, or claim (attestation required) |
| Terminals / ramps (named) | none (0 codes) | — | GAP — no terminal or ramp named (attestation required; competitor terminal names never copied) |

## 6. The full datasets — Winchester extensions of ocean D1–D8 (CC BY 4.0, attribution to The Flat Rate Movers, https://theflatratemovers.com/)

Each dataset below EXTENDS the ocean dataset of the same number; it does not duplicate it. Where the ocean dataset already states a field, the Winchester dataset adds the Winchester-branch depth and the query vocabulary. Every field traces to a verified company fact (marked **C**) or a labeled domain fact (marked **D**); anything else is a §8 question, not a field.

### W-D1 — Winchester Transload Operations (extends ocean D1 — transload operation dataset)

- **What it is:** The Winchester-branch execution of a single transload job, from appointment to empty return, as a field-level dataset. **C:** appointment booked before the container leaves the terminal; devan + count + inspect + photograph with same-day written exception reporting; rework (palletize, wrap, label, sort by destination/PO/SKU); restack into 53ft trailers (40ft ≈ 20 pallet positions; 20ft ≈ 10); inland dispatch same-day or next-morning; empty returned immediately after devanning; final mile by appointment. **D:** devanning is at a warehouse or container freight station; floor-loaded vs palletized handling modes; cross-dock dwell measured in hours vs storage-between-legs measured in days.
- **Fields:** job_id (internal), origin_port_chain (Virginia Inland Port / Port of Virginia — NO terminal names), inbound_container (size class as domain reference only, never a handled-type claim), appointment_status, devan_date, count_status, inspection_photos (yes/no — existence only, no photo content published), exceptions_reported_same_day (yes/no), rework_steps (palletize / wrap / label / sort / segregate), outbound_equipment (53ft trailer class), outbound_destinations (count, not names), dispatch_window (same-day / next-morning), empty_returned_before_per_diem (yes/no), final_mile_appointment (yes/no), service_node (`#service-transloading-winchester-va`), branch (`#winchester-place`), license `CC BY 4.0`, dateModified (deploy date at merge).
- **Keywords (real queries, evidenced):** transloading winchester va, transloading services virginia, transloading virginia port container, container unloading winchester va, virginia inland port transloading, port of virginia container services.
- **Target queries:** "transloading winchester va", "container devanning virginia", "cross-dock transload winchester".
- **Rubric mapping:** R1 (Winchester transload job, fully specified), R2 (node → organization → both Places), R3 (page + node + dataset match — no field the page contradicts), R4 (every C field sourced + dated in the rubric fact table), R5 (no gated field present).

### W-D2 — Cross-Dock, Decon & Restack Operations (extends ocean D2 — container handling taxonomy dataset)

- **What it is:** The three dwell models and the restack arithmetic, as a field-level dataset. **C:** cross-dock = freight never enters storage, leaves same shift; decon = break by destination/PO/SKU; restack into 53ft trailers; split delivery across destinations. **D:** 40ft ≈ 20 pallet positions, 20ft ≈ 10 (typical, governed by load plan); storage-between-legs = a few days; IPI contrast (original box continues inland) is vocabulary, not a Winchester claim.
- **Fields:** operation_type (cross-dock / decon / restack / storage-between-legs), dwell_model (hours / days), sort_key (destination / purchase_order / sku), inbound_containers (count), outbound_loads (count), pallet_positions (20 per 40ft / 10 per 20ft, typical), split_destinations (count), outbound_mode (FTL / LTL / split), service_node, branch, license, dateModified.
- **Keywords:** container deconsolidation virginia, cross-docking virginia, container restacking virginia, deconsolidation services virginia mid-atlantic.
- **Target queries:** "container deconsolidation virginia", "cross-dock transloading virginia", "restack 40ft container into 53ft trailer".
- **Rubric mapping:** R1 (operations taxonomy, fully specified), R2 (node chain), R3 (page definitions match dataset), R4 (published page + ocean doc), R5 (no invented dwell times or rates).

### W-D3 — Winchester Container Equipment Reference (extends ocean D3 — container taxonomy dataset)

- **What it is:** The equipment vocabulary buyers search, held STRICTLY as domain reference. **D (ocean doc §4 stands):** 20GP ~33 m³ ~28,200 kg; 40GP ~67 m³ ~26,700 kg; 40HC ~76 m³ ~26,580 kg; reefers −30°C to +30°C; open top; flat rack 20ft ~40 t / 40ft ~45 t; platform; tank 20,000L+; max gross most dry 30,480 kg; CSC plate governs each box. **C:** NOTHING in this dataset claims any type is handled by Winchester — handled_types is an empty-gated field, filled only by §8 Q9.
- **Fields:** container_type (domain list), size_class, typical_volume_m3 (D), typical_max_payload_kg (D), csc_plate_governs (D, always true), handled_by_winchester (GATED — empty until attested), reefer_capability (GATED — empty; page negation stands), flat_rack_oog_scope (GATED — empty; 0 mentions), service_node, license, dateModified.
- **Keywords:** container sizes virginia, 40ft container capacity, reefer container virginia (vocabulary only — no reefer claim), flat rack container virginia (vocabulary only — no OOG claim).
- **Target queries:** "what size container transloading virginia", "40hc container transload virginia" (vocabulary match only).
- **Rubric mapping:** R1 (equipment reference, clearly domain-labeled), R2 (node chain), R3 (page does NOT contradict — it claims no types), R4 (ocean doc §4 + web research 2026-10-29), R5 (gated fields empty — the honesty test of this dataset).

### W-D4 — Winchester Port Chain & Corridor Dispatch (extends ocean D4 — dispatch network dataset)

- **What it is:** The port chain and corridor network a Winchester transload travels, without a single named terminal or ramp. **C:** Virginia Inland Port + Port of Virginia chain (both named at that level ONLY — they are the port system, not terminal codes); dispatch on I-81, I-66, I-70 from the Winchester branch; Martinsburg branch cross-referenced, never blended; final-mile leg by appointment. **D:** drayage usually ≤100 miles; IPI vs transload contrast; port storage as a separate terminal charge.
- **Fields:** port_system (Virginia Inland Port / Port of Virginia), terminal_names (GATED — empty; NIT/VIG/PMT/RMT stay zero), ramp_names (GATED — empty), dispatch_branch (`#winchester-place`), sister_branch (`#martinsburg-place`, cross-ref only), corridors (I-81 / I-66 / I-70), drayage_performer (GATED — empty), chassis_source (GATED — empty), final_mile_leg (yes, by appointment), service_node, license, dateModified.
- **Keywords:** virginia inland port transloading, port of virginia container services, transloading virginia port container, i-81 corridor transloading virginia.
- **Target queries:** "virginia inland port transload", "port of virginia transloading services", "transloading i-81 virginia".
- **Rubric mapping:** R1 (port chain + corridors, fully specified at the attested level), R2 (node → Places → corridors), R3 (page chain matches dataset), R4 (published page + GBP/GSC evidence), R5 (no terminal, ramp, drayage, or chassis claim).

### W-D5 — Winchester Commercial Terms & Cost Avoidance (extends ocean D5 — commercial terms dataset)

- **What it is:** The money dataset — the one with the strictest gate. **C (the ONLY company pricing claim on this page):** "Container transloading jobs are quoted per job, agreed in writing before dispatch. No per-container or per-CWT container rate is stated on this page." **D (domain education, never company terms):** free time / LFD; demurrage at terminal (per container per day, escalating; domain markers $75–150/day rising to $350+/day after two weeks); detention/per-diem outside terminal (clock stops on empty return); port storage as a separate terminal charge; chassis split fees (domain markers $20–75/day); FMC 2024 billing rule (invoice window, required details, dispute timeframe); causes (late/incomplete documents, duty delays, customs exams, transport not arranged, slow offload, late empty return); avoidance discipline (documents before arrival, know free time at booking, negotiate extra free time, pre-clear, coordinate clearance + transport, site ready, prompt empty return, devan into a warehouse when premises are not ready). **NOT in this dataset, by design:** any CWT figure (they live on industrial-commercial only), any per-container rate, any standalone-container rate, any minimum, any fee, any discount.
- **Fields:** company_pricing_basis (quoted per job, agreed in writing before dispatch — C), per_container_rate (none stated — C), per_cwt_rate (none stated — C), free_time_window (D: varies by carrier/terminal, commonly a few working days to two weeks), demurrage_basis (D: per container per day at terminal, escalating), detention_basis (D: per container per day outside terminal, ends on empty return), chassis_fee_basis (D: pool-managed, split fees possible), fmc_rule_2024 (D: invoice window + details + dispute timeframe), avoidance_steps (D list above), service_node, license, dateModified.
- **Keywords:** demurrage charges importers, detention charges container, demurrage vs detention, free time container terminal, container demurrage avoidance, port storage charges.
- **Target queries:** "how to avoid demurrage charges", "demurrage vs detention container", "container free time demurrage virginia".
- **Rubric mapping:** R1 (cost-avoidance, fully specified), R2 (node chain), R3 (page cost-avoidance section matches dataset — same domain facts), R4 (published page + web research 2026-10-29), R5 (the strictest test: zero dollar figures attributed to the company; domain markers labeled domain).

### W-D6 — Winchester Buyer Personas & Trigger Events (extends ocean D6 — buyer persona dataset)

- **What it is:** Who buys a Winchester transload and what pushes them to call. **C (published audiences):** importers/distributors (core), retail/e-commerce, 3PLs/forwarders/brokers, manufacturers, warehouses/DCs, project cargo owners (SIR conditional). **D (trigger events, domain):** port congestion and terminal dwell pressure; free-time expiry approaching; a consolidated box splitting to multiple destinations; an overweight box where transloading beats permitting; surge/overflow volume; an emergency shift or container tip requiring same-day recovery (emergency page: 11 AI impressions). **C (job-route facts):** quote toggle Short (default) / Detailed; job details agreed before dispatch; no required contract duration (industrial-commercial terms, cross-referenced only).
- **Fields:** persona (importer/distributor / retail-ecommerce / 3pl-forwarder-broker / manufacturer / warehouse-dc / project-cargo), trigger_event (congestion / free-time expiry / multi-destination split / overweight / surge-overflow / emergency), pain (demurrage exposure / dwell / split complexity / permitting cost), entry_route (quote form, Short/Detailed toggle), service_node, license, dateModified.
- **Keywords:** transloading services virginia port container, emergency port container recovery, container moving virginia, warehouse transloading virginia.
- **Target queries:** "emergency container recovery virginia", "transloading for importers virginia", "container overflow warehouse virginia".
- **Rubric mapping:** R1 (personas + triggers, fully specified), R2 (node chain), R3 (page audience matches dataset), R4 (published page + GSC/SERP evidence 2026-10-29), R5 (no client names, no testimonials, no contract claims).

### W-D7 — Handling, Protection & Compliance Boundaries (extends ocean D7 — compliance dataset)

- **What it is:** What a Winchester transload does to cargo, and what it explicitly does NOT claim. **C:** count + inspect + photograph, damage reported same day in writing; palletize if needed, shrink-wrap, label, sort, segregate; SIR conditional for high-mass assets 1,500–3,500 lbs (L/360 floor deflection) as part of the same flat-rate job; ISPM 15 export packing and custom crating as adjacent services (cross-ref, never duplicated). **D:** TWIC = a port-access credential (Transportation Worker Identification Credential) — the page states the definition-domain only; the company's TWIC credential status is GATED (§8 Q2) and the page makes no claim. **NOT claimed (negation contexts on the page, kept as negations):** reefer/cold-chain handling, bonded warehouse operation, foreign-trade zone operation, customs brokerage, drayage fleet ownership, chassis ownership, named equipment (forklifts, pallet jacks, dollies, cranes) — equipment is GATED (§8 Q7), never listed.
- **Fields:** handling_steps (count / inspect / photograph / palletize / wrap / label / sort / segregate), exception_reporting (same day, in writing), sir_conditional (1,500–3,500 lbs, L/360 — C, conditional), ispm15_crossref (yes), crating_crossref (yes), twic_definition (D), twic_company_status (GATED — empty), reefer_claim (none — negation stands), bonded_claim (none — negation stands), ftz_claim (none — negation stands), customs_brokerage_claim (none — negation stands), equipment_list (GATED — empty), service_node, license, dateModified.
- **Keywords:** container inspection virginia, transload damage reporting, ispm 15 export packing virginia, custom crating virginia.
- **Target queries:** "container transload inspection process", "transloading with heavy equipment virginia" (SIR conditional only).
- **Rubric mapping:** R1 (handling + boundaries, fully specified), R2 (node chain), R3 (page handling section + FAQ negations match dataset), R4 (published page + ocean doc), R5 (gated fields empty — the dataset's honesty is in what it refuses to fill).

### W-D8 — Winchester Service Areas, Dispatch & Quote Path (extends ocean D8 — areas/dispatch/quote dataset)

- **What it is:** Where Winchester transloads dispatch from, and how a buyer starts one. **C:** Winchester branch — The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601, geo 39.18711576, -78.1668352, hours Mon–Fri 8–6, Sat 8–4, Sun 9–4, phone +1-540-422-2153, Google 5.0 from 1 review, GBP areas 16, full footprint 31. Martinsburg branch — Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg WV 25404, geo 39.48319665, -77.94760443, hours Mon–Fri 9–6, Sat 9–4, Sun 9–4, Google 4.7 from 6 reviews, GBP areas 14, full footprint 35. Shared footprint 14. Founded June 2010. Tagline "Guaranteed Flat Rate or Your Move is Free!". **C (quote path):** quote form, Short (default) / Detailed toggle, preserves From/To/What's moving; CTA "Get My Flat Rate Quote" / pill "Get a flat rate quote"; video-walkthrough checkbox is a household-survey route, NOT a container-job route — container jobs use the job-details quote path (never conflated). **C (dispatch):** I-81 / I-66 / I-70 corridors from the Winchester branch; Virginia Inland Port + Port of Virginia chain; final-mile leg by appointment.
- **Fields:** branch_winchester (address, geo, hours, rating, gbp_areas[16], footprint_areas[31]), branch_martinsburg (address, geo, hours, rating, gbp_areas[14], footprint_areas[35]), shared_areas[14], corridors[3], port_chain[2], quote_toggle (Short default / Detailed), cta_main ("Get My Flat Rate Quote"), cta_pill ("Get a flat rate quote"), survey_room_route (household only — excluded for container jobs), service_node, license, dateModified.
- **Keywords:** transloading winchester va, moving company winchester va, movers winchester va, winchester moving company, transloading martinsburg wv (cross-ref).
- **Target queries:** "transloading winchester va", "container services winchester virginia", "movers winchester va" (shared intent, defended not claimed alone).
- **Rubric mapping:** R1 (areas + dispatch + quote, fully specified), R2 (node → Places → areas, branches distinct), R3 (page branch sections match dataset — page already shows full footprint 31), R4 (GBP check 2026-10-28 + Places 2026-10-27 + live page 2026-10-29), R5 (no blended ratings, no unified hours, no guessed areas).

## 7. Rubric positioning (full rubric in the package dir; summary here)

- **R1 Audience & topic — 3.** Winchester transload buyers (importers, distributors, 3PLs, manufacturers, warehouses/DCs) are named, the topic is fully specified at the Winchester-branch level, and the generic-container cluster is cross-referenced, never duplicated.
- **R2 Node chain — 3 (staged).** Service `#service-transloading-winchester-va` → provider Organization → both Places (`#winchester-place` / `#martinsburg-place` in machine convention) → Address → Geo → Hours → areaServed (GBP lists staged, full footprint at merge). The live defects it repairs: entity node missing url; head node missing url + thin description; machine Place lists still GBP-only.
- **R3 Graph & visible match — 3 (staged).** Page sections (who it is for, what transloading is, how a transload runs, cost-avoidance terms, branch sections, related pages, FAQ, attestation) match the datasets field for field; the negation contexts (reefer/bonded/FTZ/customs) match the datasets' empty gated fields.
- **R4 Attestation — 3.** Every company fact in the rubric fact table carries source + date (live page 2026-10-29, GBP check 2026-10-28, Places 2026-10-27, GSC/SERP 2026-10-29, web research 2026-10-29 for domain facts only).
- **R5 No invented data — 3.** Zero gated claims in any publishable file: no terminals/ramps, no TWIC credential status, no CWT or per-container rate, no reefer/bonded/FTZ/customs claim, no drayage performer, no chassis ownership, no equipment list, no handled-type list, no USDOT/MC, no license detail, no client name, no testimonial, no move count, no discount.
- **R6 Images — 3 (logo precedent).** The live page carries the approved logo as its page image; no crew photos are attached (face-blur rule — no verified blurred transload photo exists for this page). A verified face-blurred warehouse photo may attach at merge only if filenames check out — logo only in this package.
- **R7 Quote path — 2.** Page quote markers intact (toggle + both CTAs verified in the live index); deploy-time live-form re-check required (no test post — quote-test rule stands).
- **Go-live bar:** R1–R5 = 3, R6–R7 ≥ 2 — MET on the staged package.

## 8. Attestation questions (nothing claimed until Henry answers)

Carried from ocean §8 + Phase C gaps, updated to the live state. Each question states what is gated until answered.

1. **Terminals / ramps:** Which Port of Virginia terminals and Virginia Inland Port ramps are actually served? (Gates W-D4 terminal_names/ramp_names; NIT/VIG/PMT/RMT stay zero.)
2. **TWIC credential status:** Do the teams hold TWIC cards, and what wording is approved? (Gates W-D7 twic_company_status; page prose stays claim-free.)
3. **Container pricing basis:** Does the industrial CWT schedule extend to standalone container unloads, or is the basis per-job / per-container? (Page says quoted per job ONLY; gates any rate on W-D5.)
4. **Drayage performer + chassis:** Company trucks, partner carriers, or buyer-arranged — and are chassis owned or sourced? (Gates W-D4 drayage_performer/chassis_source; the drayage page proposal stays gated on this.)
5. **Reefer / cold chain:** Is reefer or cold-chain handling actually offered? (Gates W-D3 reefer_capability; the reefer page proposal stays gated on this; page negation stands until answered yes with scope.)
6. **Bonded / FTZ / customs:** Bonded warehouse operated, partnered, or neither? FTZ operated, partnered, or neither? Customs brokerage offered? (Gates W-D7 claims; page negations stand until answered.)
7. **Equipment:** What equipment is actually deployed (forklifts, pallet jacks, dollies, cranes, other)? (Gates W-D7 equipment_list; no equipment is listed until answered.)
8. **Flat rack / OOG:** Is flat-rack or out-of-gauge scope actually offered? (Gates W-D3 flat_rack_oog_scope; 0 mentions stand until answered.)
9. **Handled container types:** Which container types are actually handled (dry, reefer, open top, flat rack, tank, other)? (Gates W-D3 handled_by_winchester; taxonomy stays domain-only until answered.)
10. **Winchester page approval — CLOSED.** The page is LIVE (deploy batch 1) — no approval needed.
11. **Generic-node relationship — CONFIRMED.** The Winchester node stands ALONE; the generic `#service-transloading` node is untouched (Phase C merge decision + parent brief). No question.
12. **Datasets file approval (NEW):** Approve `public/datasets-transloading-winchester.json` + page-level Dataset markup + Developer-page collection entry at merge, CC BY 4.0, dateModified = deploy date? (Follows the residential pattern; file does not exist yet.)
13. **Place @id reconciliation (NEW):** Approve the merge agent reconciling machine `-place` @ids vs page-JSON `#winchester`/`#martinsburg` @ids without renaming either file's @ids silently? (Flagged in §9; no duplicate Place nodes.)
14. **Machine Place footprint expansion (NEW):** Approve expanding machine Place areaServed from GBP lists (16/14) to the full footprint (31/35) at merge, with name-format reconciliation (GBP ZIP-suffixed names vs GeoJSON comma names)? (Live page already shows full footprint; graphs lag it.)
15. **Ocean datasets live-serving (NEW):** Note — `datasets-ocean-container.json` is NOT served as JSON on the live domain (SPA HTML). Should its live-domain serving be fixed in the same merge, or tracked separately? (No claim made either way; file is NOT claimed live.)

## 9. Merge + follow-ups

### Merge proposals (PROPOSAL ONLY — the parent deploys; this package changes nothing)

- **NO services.json change.** Entry `service-transloading-winchester-va` already exists (pageCount 1); verify only. Generic `service-transloading` (pageCount 16) untouched.
- **NO pages.json change.** Entry `transloading-winchester-va` already live; verify only.
- **Graph node upgrades (same @id, no duplicates):** entity-graph.json — Winchester node gains url + full staged description; best-json-entity-graph.json — Winchester node gains full staged description (url already present); head graph — Winchester node gains url + full staged description (7 corridor-inclusive areaServed strings kept). Generic `#service-transloading` untouched in every graph.
- **Machine Place expansion (per Q14):** `#winchester-place` areaServed 16 → 31, `#martinsburg-place` 14 → 35, with name-format reconciliation; zero normalized duplicates; branches distinct.
- **Rubric DB rows:** verify shapes; attestations for new facts (live page 2026-10-29, GSC/SERP 2026-10-29, web research 2026-10-29); rubric_check row for the Winchester node; NO duplicate opening_hours / service_area rows (dedupe by normalized name, per the deploy-batch-1 lesson).
- **llms.txt + data txt:** Winchester transloading section refreshed from W-D1–W-D8 (definitions, chain, cost-avoidance domain facts, port chain at system level only, quote path); no new page entry (page already listed); counts recomputed at merge, never hand-edited.
- **ai-sitemap.json:** transloading already listed — refresh its entry from W-D1–W-D8, do NOT duplicate it; hasPart unchanged (no new page); services count unchanged.
- **ARD:** entry refreshed if the builder supports per-category entries; otherwise left as-is (no builder change in this package).
- **Dataset JSON-LD conversion at merge (per Q12):** `public/datasets-transloading-winchester.json` (W-D1–W-D8, CC BY 4.0, dateModified = deploy date) + page-level Dataset markup on the Winchester page + Developer-page collection entry — following the residential pattern (datasets-residential.json, verified live as application/json).
- **Per-page JSON already live — verify, don't duplicate.** transloading-winchester-va.json (5,872 bytes, application/json) verified 2026-10-29; merge re-verifies it serves JSON after deploy; the Place @id difference (page JSON vs machine graphs) is reconciled per Q13, not by overwriting the file.
- **GBP:** Phase G only, owner-approved — no edit here. (Transloading service addition to both profiles is a Phase G item.)

### Follow-ups (separate packages, NOT this one)

- **Drayage page** — gated on Q4 (performer + chassis). Definition-only vocabulary exists; a page needs the performer claim.
- **Container types/sizes reference page** — gated on Q9 (handled types). Taxonomy exists as domain reference; a reference page needs the handled list.
- **Demurrage/detention/free-time cost-avoidance page** — from W-D5; highest commercial intent of the follow-ups; no gate except the page itself (domain facts only, company claim = quoted per job).
- **Reefer page** — only if Q5 attested yes with scope.
- **Flat-rack / OOG page** — only if Q8 attested yes with scope.
- **Real per-page JSONs for the 6 existing container pages** — Phase D item; Winchester + Martinsburg transloading JSONs already live and real.
- **Ocean datasets live-domain serving** — per Q15; verify whether `datasets-ocean-container.json` should be served as a real file or tracked separately.
- **Phase E depth brief** — see content-note.md (staged guidance only, not a live edit).
