# Warehouse Relocation — Deep Datasets (2026-10-29)

**Status: full ocean-method deep treatment for a LIVE page + node.** This document does NOT create warehouse relocation. The page and node already exist and are live (deployed 2026-10-29). This package adds what the Phase C lock package deliberately did not: the full database (D1–D8), the full datasets, the large rubric, and a node refresh — the same full treatment the residential, commercial, gun-safe, office, local-regional, and long-distance categories received.

## Record correction (verified live 2026-10-29 — supersedes the Phase C staged record)

- The Phase C package files (content.md, meta.json, schema.json, rubric.md, backlinks.md, merge-note.md in `out/pages/warehouse-relocation/`) describe a STAGED page. That page is now LIVE: div `page-warehouse-relocation` present in the served index (1,686 words, 11 headings, FAQ section, branch sections, "Service area, published data & quote" card, "Sources & attestation" section), sitemap 153 URLs including `warehouse-relocation/`, per-page JSON `warehouse-relocation.json` returning 200 + `application/json`.
- The Phase C merge-note counts are STALE and must not be used at merge: it proposes pages 150 → 151 and services 18 → 19. Current live state is 153 pages and 22 services; `service-warehouse-relocation` already exists in the registry and `warehouse-relocation` already exists in pages.json with status live. This deep package proposes NO new services.json entry and NO new pages.json entry. Sitemap stays 153; services stay 22.
- The staged content.md (967 words) is SHORTER than the live div (1,686 words). The live div carries fuller branch sections (full-footprint area lists), the standard "Service area, published data & quote" card, and a "Sources & attestation" section added at deploy. This deep package builds on the LIVE page, not on the staged draft — page-mapping in §5 is scored against the live div.
- The live graph nodes EXIST in both machine graphs (entity 39 nodes, best 74 nodes, one `#service-warehouse-relocation` each) — unlike the senior-era absence this package family was built to fix. The defect this package fixes is DEPTH, not existence: the live entity-graph node carries keys `@id/@type/areaServed/description/name/provider/serviceType` with NO `url`; the live head-graph node carries the same keys with NO `url` and NO Place chain (areaServed = 7 flat strings: Winchester, VA / Martinsburg, WV / Shenandoah Valley / Eastern Panhandle / I-81 corridor / I-66 corridor / I-70 corridor). The best-graph node DOES carry `url`. The refresh in this package gives every node the full chain + `url` under the same @id — no duplicate, no new @id.
- The Phase C dataset-status.md is explicit: the light dataset node was REMOVED under the never-light rule ("No Dataset node ships with this package… built only by the full ocean-method treatment"). This document IS that treatment. No light node file exists in the new package dir by design.
- The SERP evidence stands: "warehouse relocation services Virginia" ranked #1 via the industrial page at the 2026-10-29 SERP check, and the dedicated page now locks that intent with its own node. There is NO standalone GSC query row for the phrase yet (Phase C gap 1, still open) — the SERP position is the evidence, not a GSC number, and Phase H re-pull is the first GSC read on it.

## License and attribution (stands — researched and decided, not a light version)

All datasets in §6 are published under **CC BY 4.0** (`https://creativecommons.org/licenses/by/4.0/`), attribution to "The Flat Rate Movers, https://theflatratemovers.com/". Creator = `https://theflatratemovers.com/#organization` with the 6 verified social sameAs. Temporal coverage 2010/2026. Spatial coverage = the two branch @ids, never merged. The SIR/KIM-GS method internals are NOT in any dataset beyond the published conditional scope (1,500–3,500 lbs, L/360). Dataset markup does not change organic rankings (Google docs) — value = Dataset Search discoverability + AI reuse with attribution.

## §1 — What warehouse relocation is

**Published scope (live page + industrial page, verified 2026-10-29).** Warehouse relocation from The Flat Rate Movers is the movement of warehouse and distribution operations: warehouse and distribution moves, warehouse load-outs and inbound unloads, transload staging, and restacking — carried out by supervised warehouse teams and planned around the site itself: access, floor space, staging, and equipment handling. A warehouse load-out is the loading out of a warehouse; an inbound unload is the unloading of inbound freight on arrival. Work is quoted flat per job, agreed before dispatch, with no required contract duration. If a warehouse move involves a very heavy item (a high-mass asset in the 1,500–3,500 lb range), that item moves under Structural Integrity Relocation (SIR), with floor deflection analysis to L/360, as part of the same flat-rate job. SIR is NOT claimed for warehouse moves generally — only where such an asset is actually involved.

**Domain definition (labeled domain, web research 2026-10-29).** In the wider industry, warehouse relocation is the transfer of a logistics facility from one site to another: inventory plus storage systems, equipment, and technology, while maintaining service continuity and safeguarding goods during the changeover (Mecalux). The work divides into three layers that must all move coherently: (a) the inventory itself — pallets, cases, SKUs, staged and counted; (b) the storage systems — pallet racking and shelving, dismantled, transported, re-erected, and structurally validated; (c) the operation — receiving and shipping lanes, packing stations, offices, yard assets, and the systems (WMS locations, IT) that tell the operation where everything is. The industry's central lesson, repeated across every source, is that the phasing IS the product: a warehouse move fails not on lifting but on sequencing — what moves when, which lines stay live, and how the count reconciles at the new building.

**What warehouse relocation is NOT (published scope discipline).** It is not household storage: the industrial warehouse floor used for freight staging and transloading is related but distinct, and the leased household/commercial storage service (owner-attested 2026-10-29: leased, any item type, 30-day minimum, customer access yes, leases vary) belongs to the moving-and-storage package, never blurred into this one. It is neither a labor-listing page nor day-hire labor: the published framing is trained, supervised, self-managed moving/warehouse teams supporting contractors and project managers — B2B industrial/commercial project support, dynamic, priced per job. It is not a racking-installation service on published scope: teardown/reinstall of racking is domain practice (see §3), but the company's published warehouse scope is moves, load-outs, inbound unloads, staging, and restacking — racking install/reinstall scope is gated (§8 Q6), never assumed.

## §2 — Who needs it (personas with evidence)

| Persona | Buying logic | Evidence |
|---|---|---|
| Warehouse operators / warehouse managers | Downtime first: every hour the operation is down is an hour of unshipped orders. They buy a sequence, not a truck — a plan that keeps receiving and shipping alive while the building changes. | Live page "Who it is for" + industrial page audience (warehouse managers listed); domain: phased-vs-big-bang literature, downtime-cost framing |
| Distribution and 3PL operations | Inventory continuity: thousands of SKUs must cross town and reconcile at the new building. They buy count protection — labeled, tracked waves mapped old-location → new-location, so the first cycle count reconciles. | Live page audience (distribution and 3PL operations); domain: "a warehouse move is an inventory-accuracy stress test with forklifts" (Royalty); tracked-wave practice |
| Manufacturers | Production continuity: lines and material-handling equipment must move without breaking the production calendar. They buy coordination — teardown, transport, reinstall, commission — around production windows. | Live page audience (manufacturers); domain: phased-zone practice (one zone moves while another keeps running) |
| Project managers, contractors, operations buyers | One accountable plan: scope, sequence, and a flat price agreed before dispatch, with no required contract duration. They buy the industrial-commercial project-support model: planned, overflow, peak, weekend, vacation, emergency deployment. | Live page audience + industrial page (project managers, contractors, operations buyers; deployment needs incl. planned/overflow/peak/weekend/vacation/emergency) |
| Distributors and retail/e-commerce fulfillment | Fulfillment continuity: orders keep shipping while the building changes. They buy waves that protect the count and the shipping promise — highest-velocity storage moved first so receiving/shipping restart before the last truck unloads. | Domain: e-commerce/3PL fulfillment literature; live industrial markets list (warehousing, manufacturing, transportation/logistics, retail distribution, 3PL, healthcare, commercial furniture dealers, corporate offices, general contractors, educational, hospitality/hotel renovations) |

**Trigger events (domain, labeled).** Lease ends; expansion into a bigger building (new racking plan, different clear height, go-live tied to peak-season commitments); consolidation of multiple sites into one; new premises with a layout problem to fix rather than copy; 3PL changes; renovation or re-slotting of an existing facility. The published scope does not tie warehouse relocation to any single trigger — triggers are domain context for the datasets, never company claims.

## §3 — Process chain (8 steps; published vs domain labeled per step)

| Step | What happens | Status |
|---|---|---|
| 1. Survey / quote | Job scoped around the site — access, floor space, staging, equipment handling — and quoted flat per job, agreed before dispatch. Quote toggle: Short (Quick Quote) default / Detailed Project, in place, From/To/What's moving preserved. | PUBLISHED (live page "How it works" + quote path) |
| 2. Phased plan | Written sequence: what moves when, which lines stay live, how nights/weekends/overlapping shifts keep orders shipping. Zones move while others keep running; highest-velocity storage first so receiving/shipping restart early. | DOMAIN practice (Flood Brothers, ADSI, Royalty, lifestyle-moving) — the live page says work is "planned around the site" but does NOT publish a phased-plan offering; phasing as a named offering is gated (§8 Q7). The Phase E depth brief stages phasing as an explainer, not a promise. |
| 3. Inventory audit, label, count | Full inventory audit before the move (purge dead/slow stock via WMS — domain); every item tagged and counted, components labeled for the exact bay they return to; counts tracked by zone and destination area. | DOMAIN practice — the live page does not publish an inventory-audit offering; inventory discipline is a Phase E depth topic, not a company claim. |
| 4. Teardown and stage | Racking and systems come down in a documented sequence; stock palletized/cartoned and labeled by location; non-critical inventory staged for early transport; staging area or overflow buffer absorbs congestion. | DOMAIN practice — teardown/reinstall scope gated (§8 Q6); staging IS published (transload staging, restacking). |
| 5. Sequenced move | Move in waves: non-critical → core SKUs → equipment last (domain wave order); trucks, loads, and delivery windows coordinated so material arrives in the order the receiving crew needs it; dock times and access arranged at both facilities. | DOMAIN practice — the live page publishes load-outs, inbound unloads, staging, restacking; wave sequencing is depth material, not a published promise. |
| 6. Install / place | Racking re-erected and leveled to plan (domain: plumb, level, anchor checks); stock placed to the new layout (domain: layout optimized, not copy-pasted — high-velocity SKUs near docks, aisle widths for equipment); packing stations and offices placed. | DOMAIN practice — install scope gated (§8 Q6); placement IS published for the company's moves generally (verified placement in SIR context) but racking reinstall is not published for warehouse relocation. |
| 7. Verify / reconcile | Walk the floor with the operations team; level and anchor-check racking; confirm equipment runs; validate inventory locations and run spot checks; WMS locations updated wave by wave; first cycle count at the new building reconciles. | DOMAIN practice — verification-as-discipline is depth material; the live page publishes no warehouse verification offering. |
| 8. Close-out / go-live | Receiving + shipping lanes live early; pack/ship workflow confirmed clean; bottlenecks addressed; fast movers re-slotted; SOPs finalized; post-move review. | DOMAIN practice — close-out is a depth topic; the live page publishes no close-out offering. Debris handling after a warehouse move is gated (§8 Q10). |

**The two move models (domain).** Phased relocation: the facility is divided into operational zones; Zone A moves while Zone B keeps running; revenue generation continues throughout. "Big bang": the entire facility shuts down (classically Friday) and restarts Monday — the model every domain source warns against, because a single slip costs the whole restart. The company's published scope does not name either model; the datasets carry both as domain models, and the Phase E brief explains phasing without promising it.

## §4 — Taxonomy tables

### Facility types (domain context; company scope is warehouses and distribution operations generally)

| Facility type | What moves | Domain note |
|---|---|---|
| Distribution center / 3PL warehouse | Palletized inventory, racking, packing stations, shipping lanes | Highest inventory-accuracy stakes; WMS locations update wave by wave |
| Manufacturing warehouse / plant store | Raw materials, work-in-progress, finished goods, material-handling equipment | Production-calendar coordination; zones move while lines run |
| Retail / e-commerce fulfillment center | SKUs by velocity, pick faces, pack stations, returns area | Highest-velocity storage first; fulfillment continuity is the buying logic |
| Cold / climate-controlled warehouse | Temperature-sensitive inventory, refrigerated equipment | Climate scope is GATED for the company (§8 Q4) — domain type only, never a company claim |
| Records / FF&E / project staging warehouse | Files, fixtures, equipment, project material | Cross-ref: FF&E installation & project support is its own service; records chain-of-custody is domain practice |

### Move types (published scope in bold; the rest domain)

| Move type | Published? | Note |
|---|---|---|
| **Full warehouse/distribution move** | PUBLISHED (live page) | Whole operation moves site to site |
| **Warehouse load-out** | PUBLISHED (live page + GBP product both branches) | Loading out of a warehouse |
| **Inbound unload** | PUBLISHED (live page + GBP product both branches) | Unloading inbound freight on arrival |
| **Transload staging** | PUBLISHED (live page) | Freight staged, sorted, reloaded — cross-ref the transloading category, never duplicated |
| **Restacking** | PUBLISHED (live page) | Restacking into domestic trailers / staged positions |
| Phased zone move | DOMAIN model (gated as named offering, §8 Q7) | Zones move while others keep running |
| Overflow / peak / emergency deployment | PUBLISHED as deployment needs (industrial page) | Planned, overflow, peak, weekend, vacation, emergency — for project support generally |
| Racking teardown + reinstall | DOMAIN practice (gated scope, §8 Q6) | Not published warehouse-relocation scope |

### Load and staging classes (domain; company load classes are the published scope terms)

| Class | Meaning | Status |
|---|---|---|
| Palletized inventory | Goods on pallets, moved by pallet position | DOMAIN (industry standard unit; 3PL pricing per pallet/month is domain data in D5) |
| Cased / cartoned goods | Goods in cartons, labeled by location | DOMAIN |
| Racking / shelving systems | Beams, uprights, decking — dismantled, labeled by bay, re-erected | DOMAIN (install scope gated) |
| Material-handling equipment | Pallet jacks, forklifts, conveyors (domain equipment list) | DOMAIN inventory only — equipment actually deployed is gated (§8 Q1); forklifts/track loaders appear in industrial-page photo captions, not as a claimed inventory |
| High-mass assets 1,500–3,500 lbs | SIR conditional scope | PUBLISHED, conditional only (live page + company thesis) |
| Hazard-classified goods | Goods requiring specialized carriers / own rules | DOMAIN — never a company acceptance claim; haz scope gated (§8 Q5) |

### Phasing models (domain; the sharpest vocabulary gap on the live page)

| Model | How it works | Company status |
|---|---|---|
| Phased zone move | Zones move in sequence; unmoved zones keep operating | DOMAIN — live page says "planned around the site", never "phased"; "phased" = 0 mentions site-wide |
| Big-bang move | Whole facility shuts down, moves, restarts | DOMAIN — warned against by every source; never recommended in company copy |
| Wave move (non-critical → core → equipment) | Inventory waves by criticality; core SKUs stay accessible longest, equipment moves last | DOMAIN — depth material for Phase E |
| Velocity-first move | Highest-velocity storage moved first so receiving/shipping restart before the last truck unloads | DOMAIN — depth material for Phase E |
| After-hours / weekend move | Heavy work scheduled nights/weekends so day-shift operations run undisturbed | DOMAIN — after-hours as a named offering gated (§8 Q7); the CWT schedule already prices after-hours as an adjustment "agreed before dispatch" (published) |

## §5 — Live page mapping (scored against the LIVE div + live graphs, 2026-10-29)

| Page / node | Score | Evidence |
|---|---|---|
| warehouse-relocation (live page, 1,686 words, 11 headings, FAQ, branch sections, sources & attestation, per-page JSON application/json) | STRONG | Own node, own schema, own per-page JSON; SERP #1 intent locked; CWT schedule verbatim; SIR conditional; quote path; branch sections distinct. Gaps: no phasing vocabulary, no continuity workstream, no inventory-accuracy block, no downtime framing — all Phase E depth, not existence gaps. |
| industrial-commercial-services (parent page, 928 words) | STRONG (parent, not the intent page) | Carries the original SERP #1 content; links to the dedicated warehouse page (parent link added at deploy); markets, capabilities, CWT schedule, deployment needs. Its role is parent + project-support spine, not the warehouse intent page. |
| industrial-commercial-movers-winchester-va / -martinsburg-wv (branch industrial pages) | PARTIAL | Branch industrial hubs; warehouse relocation is carried as industrial content, not as a dedicated branch warehouse page. No branch warehouse page is proposed — the SERP query is Virginia-wide, one two-branch page (Phase C rationale stands). |
| transloading pages (incl. transloading-winchester-va, transloading-movers-martinsburg-wv, container pages) | PARTIAL (cross-ref) | Transload staging overlaps warehouse staging; the ocean D1–D8 datasets cover container/transload depth. This package cross-references transloading, never duplicates it. |
| FF&E installation & project support (industrial serviceType string) | GAP (string only) | FF&E appears as a serviceType string on the industrial node, not as a named node/page. FF&E depth belongs to its own category treatment; this package cross-references it only. |
| Storage (moving-and-storage, owner-attested leased service) | GAP by design (separate category) | Leased storage (any item type, 30-day minimum, customer access yes, leases vary; pricing basis pending; SIT not claimed) is a separate service with its own activation package. Warehouse staging/transload floor is NOT household storage — never blurred. |
| Head-graph node #service-warehouse-relocation | PARTIAL | Exists, typed, named — but NO url, NO Place chain (7 flat areaServed strings). Refresh target in this package. |
| Entity-graph node #service-warehouse-relocation | PARTIAL | Exists, typed, named — but NO url. Refresh target in this package. |
| Best-graph node #service-warehouse-relocation | PARTIAL | Exists, typed, named, WITH url — but NO Place chain. Refresh target in this package. |
| Live index.html vocabulary | GAP (vocabulary, not existence) | warehouse 367, relocation 430, staging 49, restack 21, CWT 49, forklift 47 (photo-caption driven), inventory 27, load-out 12, downtime 3, phased 0. "Phased" at zero while phasing is the industry's core product is the single sharpest vocabulary gap in this category. |

**Page-mechanism decision: NO new page — with evidence.** The warehouse-relocation page exists live (1,686 words, FAQ, branch sections, sources & attestation, per-page JSON, node in both graphs + head graph). Its problem is depth + node depth (no url on two of three nodes, no Place chains anywhere) + vocabulary (phased 0, downtime 3), not existence. A second warehouse hub would split the SERP #1 intent the page was built to lock. Dominance comes from the node refresh + D1–D8 datasets + the Phase E depth brief in content-note.md (phasing-models explainer; continuity workstream block; inventory-accuracy block; downtime-math explainer, domain-labeled; cross-links to industrial, transloading, FF&E/workforce, SIR conditional). No content.md / meta.json / backlinks.md staged in this package, deliberately — the live page already carries them; backlinks were verified 8/8 at Phase C and the live sitemap (153) re-verified at deploy.

## §6 — D1–D8 full datasets (CC BY 4.0; creator organization @id + 6 social sameAs; temporalCoverage 2010/2026; spatialCoverage = two branch @ids, never merged)

Conventions for every dataset below: `company` = verified published fact (source + date in the rubric fact table). `domain` = labeled domain fact from web research 2026-10-29 (source named, never presented as a company fact). `gated` = named gap, value null, never filled. The ONLY company dollar figures anywhere in this document are the verbatim CWT schedule; every other dollar figure is labeled domain.

### D1 — Warehouse Relocation Operations

| Field | Value | Status |
|---|---|---|
| service_id | service-warehouse-relocation | company |
| service_name | Warehouse Relocation | company |
| service_type | Warehouse Relocation | company |
| page_url | https://theflatratemovers.com/warehouse-relocation/ | company (live) |
| page_words_live | 1,686 words, 11 headings, FAQ, branch sections, sources & attestation | company (live div extract 2026-10-29) |
| scope_includes | Warehouse and distribution moves; warehouse load-outs; inbound unloads; transload staging; restacking | company (live page) |
| team_model | Trained, supervised, self-managed moving/warehouse teams supporting contractors/project managers; NOT day-hire labor, NOT a labor-listing page | company (industrial page + owner rule 2026-10-28) |
| pricing_basis | Quoted per job, agreed before dispatch; no required contract duration; adjustable for scope, equipment, travel, after-hours agreed before dispatch | company (live page) |
| standard_job_pricing | Unload $8.00/CWT; Load $10.00/CWT; APU $12.00/CWT; Residential/Driver Meet $400–$425 per man | company (verbatim, industrial page 2026-10-28/29) |
| sir_conditional | High-mass assets 1,500–3,500 lbs move under SIR with L/360 floor deflection analysis, as part of the same flat-rate job, ONLY where such an asset is actually involved | company (live page + thesis 2026-10-27) |
| process_steps | Survey/quote → phased plan → label/count → teardown/stage → sequenced move → install/place → verify/reconcile → close-out | §3 (published step 1; steps 2–8 domain) |
| deployment_needs | Planned, overflow, peak, weekend, vacation, emergency | company (industrial page) |
| markets | Warehousing, manufacturing, transportation/logistics, retail distribution, 3PL, healthcare, commercial furniture dealers, corporate offices, general contractors, educational, hospitality/hotel renovations | company (industrial page) |
| equipment_deployed | null | gated (§8 Q1) |
| drayage_scope | null | gated (§8 Q2) |
| bonded_ftz_scope | null | gated (§8 Q3) |
| reefer_scope | null | gated (§8 Q4) |
| customs_scope | null | gated (§8 Q5) |
| racking_install_scope | null | gated (§8 Q6) |
| phasing_offering | null | gated (§8 Q7) |
| wms_integration_scope | null | gated (§8 Q8) |
| permits_engineering_scope | null | gated (§8 Q9) |
| debris_scope | null | gated (§8 Q10) |
| keywords (real queries) | warehouse relocation services Virginia; warehouse relocation; warehouse load-outs; inbound unloads; warehouse moving company Virginia; industrial warehouse relocation | SERP evidence + domain query shapes (no standalone GSC row yet — Phase H re-pull) |
| target_queries | "warehouse relocation services Virginia" (defend #1); warehouse relocation Virginia; warehouse load-out services; warehouse inbound unloading | — |

### D2 — Facility & Access Operations

| Field | Value | Status |
|---|---|---|
| site_inputs_published | Access, floor space, staging, equipment handling — the job is scoped around the site itself | company (live page) |
| dispatch_network | Winchester VA + Martinsburg WV branches; I-81 / I-66 / I-70 corridors; Shenandoah Valley + Eastern Panhandle | company (live page + corridor pages) |
| facility_types_domain | Distribution center / 3PL; manufacturing warehouse; retail/e-commerce fulfillment; cold/climate-controlled; records/FF&E/project staging | domain (§4) |
| access_inputs_domain | Dock times and access at both facilities; gate/security coordination; clearances; floor-loading realities; ceiling heights; power points; aisle widths for equipment; WMS internet on day 1 | domain (Flood Brothers, Royal Moving, businessmoving checklist) |
| access_claims_company | null beyond the published site inputs (access, floor space, staging, equipment handling) | gated — dock scheduling, gate coordination, and clearance surveys are domain inputs, not published company offerings |
| building_compliance_domain | High-piled storage permits; seismic permits (CA example); fire-code compliance on reinstall; anchor patterns around post-tension slab mapping (domain example); ESFR sprinkler / flue-space constraints (domain example) | domain — permits/engineering scope gated (§8 Q9) |
| keywords | warehouse site survey; warehouse dock access; warehouse floor loading; warehouse move planning | domain query shapes |

### D3 — Warehouse & Load Taxonomy

| Field | Value | Status |
|---|---|---|
| load_classes_published | Warehouse/distribution moves; load-outs; inbound unloads; transload staging; restacking | company (live page) |
| load_classes_domain | Palletized inventory; cased/cartoned goods; racking/shelving systems; material-handling equipment; high-mass assets; haz-classified goods (specialized carriers) | domain (§4) |
| move_types_published | Full move; load-out; inbound unload; transload staging; restack; overflow/peak/emergency deployment | company (live + industrial pages) |
| move_types_domain | Phased zone move; big-bang move; wave move; velocity-first move; after-hours/weekend move | domain (§4) |
| staging_models_domain | Staging area / overflow buffer between buildings; transload staging; wave staging by zone and destination area | domain — staging IS published; staging MODELS are domain |
| sir_band | 1,500–3,500 lbs; L/360 floor deflection; conditional only | company (thesis + live page) |
| cross_references_only | Transloading (own category + ocean D1–D8); FF&E installation (own category treatment); SIR method (own category treatment); storage (moving-and-storage activation package) | never duplicated |
| keywords | warehouse load-out; warehouse restacking; transload staging; pallet racking relocation; warehouse equipment moving | domain + published query shapes |

### D4 — Phasing Models & Continuity Operations

| Field | Value | Status |
|---|---|---|
| phasing_models_domain | Phased zone move; big-bang (warned against); wave move (non-critical → core SKUs → equipment last); velocity-first move; after-hours/weekend move | domain (§4) |
| continuity_workstream_domain | Customer communication (proactive, specific, early); phased schedule around busiest shipping days; temporary storage/overflow buffer; backup procedures (alternate carriers, manual pick lists, fallback windows); daily check-ins during move week; predictability over perfection | domain (lifestyle-moving continuity section) |
| inventory_continuity_domain | Pre-move full audit + dead-stock purge via WMS; tagged + counted waves mapped old-location → new-location; WMS locations updated wave by wave; post-move validation (spot checks, first cycle count reconciles, re-slot fast movers, SOPs, post-move review) | domain — inventory-accuracy block is Phase E depth, not a published offering |
| downtime_framing_domain | Unplanned downtime averages $260,000/hour across manufacturing sectors (ADSI 2026 guide claim — attributed to that source, domain, never a company figure); one delayed shift can exceed the entire moving invoice (same source's framing) | domain, attributed — used ONLY in the downtime-math explainer, labeled domain |
| timeline_domain | Heavy equipment/racking scheduling 3–6 months out (businessmoving protocol); move week in waves; week +1 stabilize; week +2 optimize | domain — timeline guidance, never a company lead-time promise |
| company_phasing_claim | null | gated (§8 Q7) — live page says "planned around the site", never "phased"; phased = 0 site-wide |
| keywords | phased warehouse move; warehouse move without downtime; warehouse inventory continuity; warehouse move checklist; minimize warehouse downtime | domain query shapes |

### D5 — Commercial Terms & Cost Drivers

| Field | Value | Status |
|---|---|---|
| company_pricing | Standard Job Pricing VERBATIM: Unload $8.00/CWT; Load $10.00/CWT; APU $12.00/CWT; Residential/Driver Meet $400–$425 per man. Quoted per job; adjustable for scope, equipment, travel, after-hours agreed before dispatch. No required contract duration. | company (industrial page verbatim 2026-10-28/29) — the ONLY company dollar figures in this document |
| company_quote_path | Get My Flat Rate Quote (main) / Get a flat rate quote (pill); Short (Quick Quote) default / Detailed Project toggle, in place, From/To/What's moving preserved | company (live form pattern) |
| flat_rate_framing | One flat price agreed before dispatch, no hourly clock, ever; "Guaranteed Flat Rate or Your Move is Free!" | company (live page + tagline) |
| domain_3pl_storage_rates | 2026 averages: $19.37/pallet/month ($18–$25 typical); $0.45–$0.46/cu ft/month; $1.26–$1.73/sq ft/month; pallet-in/out $3.50–$12; case pick $0.40–$1.50 | domain (Fulfillment Advisor 2026 survey; Buske 3PL guide) — STORAGE rates, NOT relocation project rates; never company prices |
| domain_racking_costs | $50–$120 per pallet position installed (standard selective racking, incl. engineering/permits/anchoring); 1,000-position warehouse ≈ $50,000–$120,000 installed; used rack 40–60% less material cost | domain (Lehigh Valley racking guide) — racking install costs, NOT company prices; install scope gated |
| domain_downtime_math | $260,000/hour average unplanned downtime (ADSI claim, attributed); geography is the single biggest warehousing pricing lever (Buske); relocation quotes fixed in writing after site visit (domain practice) | domain, attributed |
| domain_cost_drivers | Volume/weight or cubic footage; climate control; duration; location/geography; labor rates; real-estate rates; scope (scope/equipment/travel/after-hours — the same four adjusters the company publishes for its own schedule) | domain — the four adjusters overlap the published schedule wording; the overlap is noted, not stretched into a price model |
| company_pricing_basis_storage | null | gated — storage pricing basis is the moving-and-storage package's single open gap, not this package's |
| keywords | warehouse relocation cost; warehouse moving pricing; flat rate warehouse move; warehouse load-out pricing; CWT warehouse pricing | domain + published query shapes |

### D6 — Buyer Personas & Trigger Events

| Field | Value | Status |
|---|---|---|
| personas | Warehouse operators/managers; distribution + 3PL operations; manufacturers; project managers; contractors; operations buyers; distributors; retail/e-commerce fulfillment | company audience (live + industrial pages) + domain (§2) |
| buying_criteria_ranked_domain | 1. Downtime/continuity (orders keep shipping); 2. Inventory accuracy (count reconciles); 3. Sequence accountability (one plan, one price, agreed before dispatch); 4. Price certainty (flat, not hourly) | domain ranking synthesized from §2 sources — criteria order is domain analysis, not a company claim |
| triggers_domain | Lease ends; expansion (bigger building, new racking plan, peak-tied go-live); consolidation; new premises (fix layout, don't copy it); 3PL changes; renovation/re-slotting | domain |
| triggers_company | null tied to warehouse relocation specifically | gated — published scope names no trigger; triggers stay domain context |
| markets_company | Warehousing, manufacturing, transportation/logistics, retail distribution, 3PL, healthcare, commercial furniture dealers, corporate offices, general contractors, educational, hospitality/hotel renovations | company (industrial page) |
| keywords | warehouse relocation company Virginia; warehouse move project manager; 3PL warehouse relocation; warehouse consolidation move | domain + published query shapes |

### D7 — Inventory, Protection & Building Compliance

| Field | Value | Status |
|---|---|---|
| published_protection | Supervised warehouse teams; planned around the site (access, floor space, staging, equipment handling); SIR conditional for high-mass assets (L/360) | company (live page) |
| domain_protection | Blanket-wrap furniture/equipment; mirrors/art boxed; mattresses/upholstery covered; palletize/carton + label by location; racking dismantled in documented sequence, labeled by bay; plumb/level/anchor checks on reinstall; structural validation per current regulations/safety standards | domain — protection practice, not a published company offering for warehouse relocation |
| domain_inventory_discipline | Numbered tags + condition noted at load-in; counts by zone and destination area; WMS location updates wave by wave; release checked against the same inventory; post-move cycle count + spot checks | domain — Phase E inventory-accuracy block, not a published offering |
| domain_building_compliance | Dock scheduling at both buildings; floor-loading realities surveyed before pricing; high-piled storage permits; seismic/fire-code compliance on reinstall; anchor patterns around post-tension mapping; ESFR/flue-space constraints | domain — permits/engineering scope gated (§8 Q9) |
| domain_haz_rule | Hazard-classified goods follow their own rules and may require specialized carriers; survey states plainly what rides and what requires a specialist | domain (Royalty) — haz acceptance gated (§8 Q5), never a company claim |
| company_compliance_claims | null beyond published scope | gated — no compliance, permit, or certification claim |
| keywords | warehouse inventory accuracy move; warehouse racking reinstall; warehouse move safety; warehouse floor loading | domain query shapes |

### D8 — Service Areas, Dispatch & Quote Path

| Field | Value | Status |
|---|---|---|
| branches_distinct | Winchester: The Flat Rate Movers, 116 W Piccadilly St Suite 11, 22601, geo 39.18711576/-78.1668352, Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google 5.0/1. Martinsburg: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, 25404, geo 39.48319665/-77.94760443, Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google 4.7/6. | company (Places 2026-10-27; GBP 2026-10-28) |
| gbp_areas_staged_draft | Winchester 16; Martinsburg 14 (lists in the Phase C schema + live branch sections) | company (GBP screenshots 2026-10-27, confirmed 2026-10-28) |
| full_footprint_at_merge | Winchester 31; Martinsburg 35; shared 14; total 52 GeoJSON features | company (footprint/GeoJSON, full-build authorization 2026-10-28) — merge expands staged GBP lists to this footprint, branches distinct |
| dispatch | I-81 / I-66 / I-70 corridors from both branches; Shenandoah Valley + Eastern Panhandle | company (live page + corridor pages) |
| overlap | Moorefield 26836 served by both branches | company (both GBP lists) |
| quote_path | Get My Flat Rate Quote (main) / Get a flat rate quote (pill); Short default / Detailed toggle in place; survey room film-only, human-made estimate where a walkthrough fits | company (live form pattern) |
| no_new_page | Sitemap stays 153; services stay 22; pages.json + services.json UNCHANGED by this package (entries already live) | merge rule for this package |
| keywords | warehouse relocation Winchester VA; warehouse relocation Martinsburg WV; warehouse movers Shenandoah Valley; warehouse movers Eastern Panhandle | published + domain query shapes |

## §7 — Rubric positioning

The full rubric is `out/pages/warehouse-deep/rubric.md`. Summary: R1 = 3 (audience + intent precisely named, SERP #1 evidence, one page per intent); R2 = 3 (full chain node refresh, same @id, Place chains added, url added where missing); R3 = 3 (every schema claim traces to a live-page sentence; dataset fields trace to page sentences, labeled cross-refs, or labeled domain facts); R4 = 3 (every fact source + date); R5 = 3 (gaps named, not filled; only verbatim CWT figures as company prices); R6 = 3 (logo as approved brand image; live page carries no claimed job photo beyond the logo — face-blurred warehouse photos live on the industrial page and may attach at Phase E only if filenames check out); R7 = 2 (quote-toggle pattern verified; live-form re-check at deploy, no test post). Verdict: READY pending deploy-time R7 re-check. This package is a NODE REFRESH + DATASETS package for a live page — the deploy gate is the same as every other deep package (verify.js green, node --check on both scripts, live verification of changed URLs, GitHub both repos), and per the owner's verified = live rule it deploys immediately once the parent verifies it, without staging delay.

## §8 — Attestation questions (nothing ships on these until answered)

1. **Equipment actually deployed.** Forklifts and track loaders appear in industrial-page photo captions. Is there a deployed-equipment list for warehouse relocation (forklifts, pallet jacks, track loaders, trucks)? Until answered: domain equipment inventory only, no deployment claim.
2. **Drayage scope.** Company trucks, partner carriers, or buyer-arranged? Chassis owned or sourced? (Ocean doc pattern — stays gated here.)
3. **Bonded / FTZ scope.** Operated, partnered, or neither? (Ocean doc pattern — stays gated here.)
4. **Reefer / cold-chain scope.** Any temperature-controlled warehouse capability? (Domain facility type only until answered.)
5. **Hazard-classified goods.** Accepted, referred to specialized carriers, or excluded? (Domain rule only until answered.)
6. **Racking teardown + reinstall scope.** Is racking dismantling/re-erection part of the company's warehouse service, or is published scope limited to moves, load-outs, inbound unloads, staging, and restacking? (Domain practice only until answered.)
7. **Phasing as a named offering.** Is phased/zone/wave sequencing a named company offering, or does published scope stay at "planned around the site"? (Phase E depth brief stages phasing as an explainer either way; a promise needs this answer.)
8. **WMS / inventory-system integration.** Does the company integrate with client WMS locations, or is inventory discipline a client-side function? (Domain practice only until answered.)
9. **Permits / engineering scope.** High-piled storage permits, seismic/fire-code sign-off, stamped engineering — offered, coordinated, or client responsibility? (Domain only until answered.)
10. **Debris scope + close-out.** Debris handling and close-out services for warehouse moves — offered or not? (Domain close-out step only until answered.)
11. **Merge decisions (not claims).** (a) Add `url` to the entity-graph node (best node already has it). (b) Upgrade the head node to the full Place chain under the same @id. (c) Refresh the ai-sitemap warehouse entry with the D1–D8 summary (not duplicated). (d) Refresh the live per-page JSON to the refreshed node (verify serving path — already application/json, so this is a content refresh, not a path fix).
12. **GSC read.** No standalone GSC query row for "warehouse relocation services Virginia" yet — Phase H re-pull is the first read; nothing is claimed about GSC until it returns.

## §9 — Merge + follow-ups

**Merge (proposal only — parent deploy agent applies).** Node refresh into both machine graphs (same @id; add `url` to entity node; full Place chains in both; head node upgraded to the same chain, same @id); D1–D8 converted to Dataset JSON-LD at merge (page-level markup on warehouse-relocation + Developer-page collection entry, dateModified = deploy date, CC BY 4.0); llms.txt + data txt warehouse section refreshed with the D1–D8 summary (not duplicated); ai-sitemap warehouse entry refreshed (not duplicated); rubric DB rows verified (canonical row exists — verify, don't duplicate; attestation rows for the new deep facts; rubric_check row shape verified against the table before adding — the residential batch found that table is a checks catalog, not per-service scores, so do NOT force a row that doesn't fit); live per-page JSON refreshed to the refreshed node; areas expanded to the full footprint at merge (Winchester 31, Martinsburg 35, shared 14), branches distinct. NO services.json change, NO pages.json change, sitemap stays 153, services stay 22.

**Follow-ups (separate packages, not built here).** Phase E depth sections on the live page (phasing-models explainer; continuity workstream block; inventory-accuracy block; downtime-math explainer, domain-labeled; cross-links) — staged as a brief in content-note.md, not a live edit. GBP warehouse service addition (Phase G, owner-approved, 2 profiles only). GSC re-pull for the warehouse phrase (Phase H). Real per-page JSON refresh is IN this merge (already application/json), not a follow-up.

**NOT proposed.** Any new warehouse page or branch warehouse page; any facility size/location/client claim; any equipment deployment claim; any drayage/chassis/bonded/FTZ/reefer/customs claim; any racking-install claim; any phasing promise; any WMS-integration claim; any permit/engineering claim; any debris/close-out claim; any price beyond the verbatim CWT schedule; any discount, move count, testimonial, certification, clearance, contract, USDOT/MC, or license claim; any household-storage claim (separate package); any day-hire-labor or labor-listing language.
