# Full-Site Redo — Audit + Staged Rewrite Report — 2026-10-29

**STAGED ONLY. Nothing live was edited, nothing deployed, nothing pushed, no quote test.**
Deploy source audited: `~/workspace/the-flat-rate-movers-pages/public/` (index.html,
38 public JSON files at task start), `~/workspace/the-flat-rate-machine/data/`,
`~/workspace/theflatratemovers/rubric.db` (read-only source).
Staging root: `~/workspace/the-flat-rate-machine/out/full-site-redo-2026-10-29/`
(subdirs graphs/, jsons/, visibility/, db/, sweep/, report/).
Checklist: `~/workspace/theflatratemovers/new-thought-process-checklist-2026-10-29.md`
(rules + per-file checklist, statuses filled from the five area audits below).

**Sequence rule (do not break): this redo deploys AFTER the gun-safe full-page hub update
batch closes, because shared files (index, graphs, sitemap, DB) must never be edited by two
batches at once. The gun-safe batch landed DURING this redo (see §7), so the deploy steps
in §8 start with re-baselining live before applying anything.**

## 1. The new thought process applied (owner, 2026-10-29)

- POWER, not hedging: published copy states how work is done with authority, backed by
  industry research, optimized to industry standards. Research sources live in the area
  research appendices, never as hedging in published copy.
- "Attested" / "self-attested" / "owner-attested" is internal provenance ONLY and never
  appears in customer-facing copy, dataset descriptions, or schema descriptions. Internal
  field keys (e.g. `attestations`, `attested` keys in services/locations/pages registries)
  were deliberately NOT renamed, because renaming breaks builders/consumers; only
  published-facing VALUES were rewritten. Internal-note occurrences are listed separately
  in each area report.
- Reviews: never a judgment, never an apology, never a gap to chase. Ratings stated
  factually as Google ratings, always distinct, never blended, never aggregator-substituted:
  Winchester 5.0 / 1 review; Martinsburg 4.7 / 6 reviews. No "only" hedging, no volume apology.
- Highest level, JK standard for structure, depth, and JSON — never JK's ratings, claims,
  or content, never a competitor comparison. No placeholders, no light versions.
- Client privacy absolute: no private client identities, names, or job details anywhere.
  No private examples were sought or used in this task.
- Hard rules (protect, do not gate): never invent prices, move counts, testimonials,
  credentials, contracts, clearances, or authority; USDOT/MC unconfirmed, never publish
  (one permitted USDOT negation retained in GeoJSON rubric R5: "USDOT omitted" — a negation,
  not a claim); branches always distinct; phone +1-540-422-2153; founding June 2010;
  tagline "Guaranteed Flat Rate or Your Move is Free!"; CTAs "Get My Flat Rate Quote" /
  "Get a flat rate quote"; no Spearman Group / Around Town Movers; no crew/temp-labor language;
  face-blur rule for supplied crew photos; gist graph never touched.

## 2. Audit violations by file (exact wording quoted)

### 2A. Graphs + registries (Area A)

- Head graph (index.html, first ld+json block, 24 nodes): 7 services with NO areaServed at
  all (packing, SIR heavy, piano-antique, ISPM 15, crating, transloading, final-mile); all
  other services used plain strings ("Winchester, VA", "Shenandoah Valley") instead of Place
  @ids (only commercial and gun-safe used Place refs); Industrial & Commercial Services had
  NO serviceType; serviceType casing inconsistent ("Local moving", "Long-distance moving",
  "Packing services", "Specialty moving", "Export packing", "Custom crating", "Office moving",
  "Industrial office moving", "Government moving", "Military moving"); nested branch locations
  carried no footprint (addresses/geo/hours/ratings but no areaServed).
- Entity graph (39 nodes, only 32 unique @ids): 7 duplicate @ids (government,
  industrial-commercial, industrial-offices, route81, local-regional, military, office-moving
  — branch-page variants sharing one fragment @id); published "attest" wording in Dataset
  name/description/rubric ("The Flat Rate Movers — Entity Graph, Nodes, Chains, and
  Attestations"; "every fact carries an attestation with source and verification date";
  rubric "does it chain, does it cite, does it attestate?"); stale gated rating claim
  ("not in this graph's Organization node pending Henry's approval to add per-branch
  aggregateRating" — false now, head and best already carry ratings); published claim
  "License details are private and are NOT attested publicly in this graph"; Place nodes had
  NO aggregateRating while the description claimed no rating was included; ~20 service nodes
  with empty descriptions plus 2 page-slug nodes empty; string areas not Place chains
  (GBP 16/14); ISPM page node with NO areaServed at all; route81 nodes used the wrong scheme
  (#winchester/#martinsburg instead of #winchester-place/#martinsburg-place); stale chain
  entries ("Winchester GBP service area list, 16 towns/counties").
- Best graph (76 nodes, 76 unique @ids): 30 #area-* City nodes orphaned (30 occurrences =
  definitions only, 0 inbound references); false _humanSummary claims ("each Place chained
  to its GBP service-area City nodes" — false, strings not refs; "each Service chained to the
  Organization and to both Places" — false, 24 branch-page services used string areas);
  published "attest" wording in _machineNotes ("See entity-graph.json attestations for source
  and date for every fact"; rubric "every fact must attest"); gating/negation copy in a
  published Service description (military-government: "No contracts, clearances, or discounts
  are claimed in this schema"); Org areaServed was 30 GBP strings, not Place refs; gun-safe
  fragment description empty. Commercial fragment node was already correct (hub url + both
  Place refs) and was untouched.
- Registries: descriptions.json — 2 published "attest" values (entity-authority-layer
  "chained by stable @id and attested to named sources"; knowledge-entities "attestation for
  each published fact"), stale sitemap count "all 150 canonical pages" (now 153), GBP-only
  framing without the full footprint; service-area.geojson — gated/internal rubric wording
  in published values ("3 = GBP area or branch, fully attested"; ~8 feature rubric_note values
  "it has no dedicated page yet — so R3 visible-match and R4 GBP attestation cannot yet be 3";
  R4 "new 2026-10-28 attestations added"); locations.json — footprint missing (GBP 16/14 only).
  Audited-clean: pages.json (153 pages, 154 attest hits are internal field keys only);
  corridors.json (4 attest hits are internal field keys only).

### 2B. Per-page JSONs + datasets (Area B)

- Datasets, gated/hedging framing (core violations). Gun-safe pre-deploy 8-node version
  (3 attest hits, 9 gated hits): "Sub-band handling for safes below 1,500 lbs, stairs policy
  limits, emptying instruction, equipment deployment, re-anchoring, vault installation scope,
  calibration classes, wider long-distance safe scope, and locksmith services are gated
  attestation questions and are omitted, not guessed."; "the company stairs policy limits are
  gated and not stated here."; "equipment actually deployed is a gated attestation question.";
  "Gated and omitted: the emptying instruction (domain practice empties the safe completely
  before move day … the company instruction is unattested) …". Commercial (4 gated, 0 attest):
  "Gated and omitted, not guessed: after-hours or weekend as a named offering, a dedicated
  coordinator, crew sizing or minimums, debris scope, and client proof."; "Whether the company
  issues building paperwork is gated and not stated."; "any company coverage offering is gated
  and NOT claimed." Residential (1 attest, 2 gated): "the valuation offering is gated and
  unclaimed."; "Storage bridge: gated — no storage page, product, or terms are published in
  this dataset; storage terms are attested separately and ship in their own later batch.";
  apartment hedging ("no apartment-specific crew, equipment, or access capability is claimed
  beyond the published house/apartment scope …").
- Per-page JSONs, systematic (all 31 audited): missing serviceType in 24 of 31 files (all
  branch files); thin descriptions (branch Services 43–469 chars, most under 120), e.g.
  commercial-movers-winchester-va "Flat-rate commercial and office relocation.",
  government-movers-* "Moving services for government offices and public-sector relocations.",
  packing-movers-martinsburg-wv "Full, partial and fragile-only packing and unpacking,
  including loading and unloading."; areaServed as plain string lists instead of Place @id
  chains (footprint itself was present 31/35 in sibling LocalBusiness nodes — a chaining gap,
  not a missing-footprint gap); industrial-commercial-services.json crew/temp-labor language
  (real violation): name "Industrial & Commercial Services — Trained, Supervised Moving and
  Warehouse Teams", serviceType "Flexible Workforce Deployment", APU "Crew provided when
  additional service labor is needed.", "Self-managed teams — not individual temp labor;
  in-house trained moving and warehouse crews", Workflow "confirm crew, scope and rate",
  "Training & Crew Standards"; plus empty Service description (0 chars) and no in-file Place
  nodes (areaServed pointed only at service-area.geojson).
- Checked and NOT violations: no review-volume apology anywhere in Area B files; no blended
  branches; zero Spearman / Around Town / subcontract / USDOT claims / bare "flat quote".
  Benign matches left: "boxes staged by room", "film only", domain "local hourly crews".

### 2C. Visibility files + visible page-div copy (Area C)

- Visible div copy (script/style stripped, JSON-LD never counted as visible copy):
  38 attest* hits (27 are the "Sources & attestation" heading); 8 review-volume-apology
  sentences; 6 staged-package lines; 1 real gated-claims paragraph; 24 stale checklist
  parentheticals. Zero pending / omitted / not-yet / bare "flat quote" / Spearman / Around
  Town / subcontract in visible copy.
- Developer cluster (7 divs): "with rubric scores and attestations."; "with a new attestation,
  never in one format only."; "with each fact attested to a named source and date.";
  "<h3>Attestation, not assertion</h3>… Google ratings are attested per branch — Winchester
  5.0/1, Martinsburg 4.7/6 — and are never merged."; "against attested facts only.";
  "and the attestation each fact carries — source and verification date.";
  "carrying only attested facts:"; card heading "Attestation"; "Facts only from attested sources:".
- Review apologies (8 divs, figures untouched): gun-safe hub "Safe moves are handled
  discreetly, and many safe clients choose not to review us publicly — we respect that.";
  service-areas page "many high-value clients, whose safes and valuable items we move, choose
  not to review at all."; FAQ "Many high-value clients choose not to review, which we respect.";
  three guide divs (identical sentence); top-rated-mid-atlantic "<h3>Why the counts are
  small</h3><p>Many of our clients move gun safes and high-value items and choose not to
  review at all — privacy we respect. Judge us instead …"; Winchester gun-safe branch
  "many of our safe clients choose not to review us at all — we respect that. Judge the method:".
- Branch Sources sections (24 divs, identical 2 replacements each): "<h3>Sources &amp;
  attestation</h3>" plus the stale internal note "NOT from GBP screenshots (the GeoJSON source
  label claiming GBP origin for those towns is incorrect and is on the publish checklist to
  fix)." — the correction it referred to was already made 2026-10-28, so the note itself was
  stale; no area/count/branch change.
- Unpublished-work framing (3 divs): senior-moving + warehouse-relocation "Service name and
  description — staged package 2026-10-29 (content, meta, schema verified READY)" and
  "Slug — staged package 2026-10-29 (zero collisions in the registry)"; transloading-winchester-va
  staged-package lines plus "No Port of Virginia terminal or Virginia Inland Port ramp is named
  on this page — none is attested." plus a whole paragraph deleting gated claims (terminals,
  drayage performer, chassis, reefer, bonded/FTZ, customs, equipment, OOG, handled types,
  container rates) — deleted, not replaced with any claim.
- Visibility files: ai-sitemap.json description only ("No USDOT/MC number is listed
  (unconfirmed)."); data txt 4 fixes (ratings self-contradiction "No ratings … are published"
  — ratings ARE published per branch; city-license note; heading "NOT INCLUDED — DELIBERATELY,
  UNTIL VERIFIED"; "USDOT / MC number and interstate authorization: unconfirmed, not listed
  here."). Audited-clean: robots.txt, sitemap.xml (153 locs, 0 duplicates, 0 hash URLs, URL
  set = ai-sitemap hasPart), service-area.geojson counts (52 Point features: 17 + 14 = 31,
  21 + 14 = 35), 111 clean page divs (listed in PATCH-INDEX.md).
- Domain "staged" deliberately left (41 contexts, legitimate vocabulary, not unpublished work):
  "containers are staged", "staged cleanly in the room", "Planned, staged, placed",
  "Staged through our own floor", "Freight is staged on our warehouse floor", etc. (full list
  in PATCH-INDEX.md). Also kept: industrial-commercial-services "Self-managed teams — not
  individual temp labor" (a negation distinguishing the published model, not an offering);
  factual ratings sentences ("5.0 with/from 1 review", "4.7 from/with 6 reviews",
  "per branch, never blended/averaged/merged").
- History preserved verbatim (NOT rewritten): llms.txt / data txt 2026-10-28 lines including
  "sitemap.xml rebuilt to 126 clean URLs", entity-graphs line "(89 @ids, rubric +
  attestations)" / "(141 @ids)", ocean-container staged line, three "Gated fields omitted,
  not guessed" lines, and the commercial-batch "attestations untouched" record. The redo's own
  new 2026-10-29 changelog entries contain none of the retired tokens.

### 2D. Rubric database (Area D, read-only source, staged copy only)

- CLEAN: entity (1), place (2 — both rows match standing facts exactly), opening_hours (14),
  service_area (66 — GBP base 16/14 present, extras sourced as footprint expansion, shared 14),
  rubric_check (7 — checks catalog, untouched; sole USDOT mention is R5's internal negation
  "license/USDOT omitted").
- service — 2 fixes: #service-commercial url was the stale fragment
  "https://theflatratemovers.com/#service-commercial" → Q10a-approved hub
  "https://theflatratemovers.com/commercial-moving/"; #service-senior-moving description
  "…video-walkthrough survey room with a human-made estimate." → "…video-walkthrough survey,
  with a human-made estimate." (copy cleanup, no fact changed).
- attestation — 9 fixes (rowids 12, 15, 41, 42, 43, 44, 45, 49-evidence, 50): superseded
  unified-hours note → distinct-hours statement; one row containing forbidden third-party
  names → redacted (names not republished here or in staged files, per owner instruction);
  "thin head node upgraded to the same chain" → "head node carries the same two-branch chain";
  "gated fields (…) omitted" → "fields without a verified company term (…) not published"
  (×2); Martinsburg-skewed node wording → hub-chain wording; commercial fragmentation
  finding → "one canonical hub node now carried in all three graphs (head, entity, best)".
  Table NOT renamed, no rows deleted. Rows 5/6/46 ratings are factual per-branch statements
  (no apology) and were left alone; row 9 states only that license details are private and
  contains none.
- edge — DOCUMENTED DISCREPANCY, deliberately NOT changed: 40 rows = 2 location + 16
  Winchester areaServed + 14 Martinsburg areaServed + 8 page-slug provider edges. The 16/14
  areaServed edges are the GBP base, not the 31/35 footprint in service_area. Expanding edge
  by 36 rows would be a graph-model change, flagged for the graph owner; 0 fragment-service
  edge rows exist, none added.
- 31-vs-22 reconciliation (no rows deleted): services.json declares 22 ids; DB 31 =
  22 canonical …/#service-* rows (exact match to services.json ids/names/descriptions) +
  8 page-slug rows (commercial-moving, commercial-office-moving-2, container-loading,
  gun-safe-movers, international-export-packing, long-distance, military-government,
  residential-moving) + 1 true duplicate SPA row (…/#/industrial-commercial-services#service,
  "Industrial & Commercial Project Support", duplicating canonical
  #service-industrial-commercial) — left in place, flagged as the merge candidate for a future
  model-consolidation batch, not deleted here. No storage service row added (separate batch).
- Private client data: none found (surname scans 0 rows in every table; nothing private copied
  into the report or SQL log).

### 2E. Staged-package sweep (Area E, in-place staged rewrites)

All ten packages had published-facing drafts with the same classes of violation (attested
wording, gated/pending framing, thin descriptions); all were rewritten in place (see §4).
Notable per-package points: office — thin description expanded to full phased-sequence copy;
local-regional — expanded with valley/panhandle + price-by-job + SIR conditional;
long-distance — expanded with I-81/I-66 dispatch, NO authority claim added, authorization
tension internal only, no delivery-window/valuation/tracking terms added (uncorroborated);
moving-and-storage — pricing-basis update applied (see §4) plus gated/SIT/facility wording
removed; senior — expanded with family/out-of-town coordination, keepsake packing,
video-walkthrough survey, SIR conditional (never general); warehouse — owner CWT/per-man
rates kept verbatim, corroborated terms only added; IT — expanded with peripherals,
inventory/label before unplugging, padded/wrapped/strapped transport, placed/verified,
custom crating, no named systems/vendors; transloading-Winchester — biggest fix (deleted
negation paragraph + trailing "conditionally"; Place chain corrected — see §6 flag);
packing — deleted "No published packing price list.", added white-glove/custom-crate + ISPM 15
scope, no price invented; SIR-heavy — expanded with the corroborated published 6-step
protocol (assess → survey route/clearances/L/360 → spread/protect load path → match
crew/rigging → controlled supervised move → place/level/verify).
Deliberately left (internally noted, not published as hedging): long-distance authority /
delivery window / valuation / tracking; SIR engineer involvement/stamp, crane/hoist/air-bearing,
valuation-as-insurance, crew-size rule; transloading reefer/bonded/FTZ/customs (unclaimed by
omission, not by negation); storage climate control and facility name/lessor/address
(no source); industry pricing/access figures stay labeled as industry only.
Internal "attested"/"GATED" language in research docs, merge-notes, and rubrics (e.g.
moving-and-storage merge-note 17, rubric 19; senior rubric 17; long-distance rubric 13 incl.
the internal authorization record) was NOT rewritten — it is internal, flagged in a sweep note
appended to each dir's rubric.md, with full per-file counts in the sweep log.

## 3. Staged rewrite file list + change summary

All paths below are under the staging root unless stated. Nothing here is live.

### Graphs (graphs/) — 8 files + builder
- head-graph.json (24 nodes / 22 services): all services now areaServed [{#winchester},
  {#martinsburg}]; nested branch locations gained full-footprint areaServed (31/35, copied
  from entity Places); Org areaServed prepended with both Place refs; serviceType added for
  industrial-commercial and standardized to Title Case matching service names; thin
  descriptions replaced with powerful industry-standard versions (survey, written flat rate,
  protection, planned sequence, verified placement — no new facts); @ids and urls unchanged.
- entity-graph.json (39 → 32 nodes, unique @ids unchanged at 32): name → "…Entity Graph,
  Nodes and Chains"; description rewritten (source + date wording, per-branch ratings on
  Place nodes, license details "not published"); rubric checks/purpose de-attested; rating
  claim de-gated; license claim → "not published in this graph"; GBP chain entries →
  full-footprint entries; 7 duplicate pairs merged into single service nodes (branch-page
  urls remain in best graph + pages.json); all Services → both Place refs (route81 scheme
  fixed to -place); all empty descriptions filled from head/services copy; Places gained
  per-branch aggregateRating (5.0/1, 4.7/6, distinct).
- best-json-entity-graph.json (76 nodes, 76 unique @ids, unchanged count): _humanSummary
  rewritten (Places carry 31/35; GBP 16/14 carried as City nodes; services chained to branch
  Place(s); USDOT word removed entirely); _machineNotes attestation/rubric values de-attested;
  military-government description de-gated; branch-page string areas → single branch Place ref
  by page slug (Martinsburg → martinsburg-place, Winchester → winchester-place, corridors →
  both); Place areas converted to City @id refs where a City node exists (Winchester 16 refs +
  15 strings = 31; Martinsburg 14 refs + 21 strings = 35; City nodes now referenced 30 times,
  60 #area- occurrences total); Org areaServed → both Place refs; gun-safe fragment description
  filled. Commercial fragment node was already correct and untouched.
- services.json (22, pageCounts verified 22/22 against pages.json references): thin
  descriptions on 15 services replaced with the same powerful versions as head;
  owner-supplied industrial/warehouse/IT/transloading-Winchester/senior/SIR/gun-safe
  descriptions kept verbatim, including CWT rates.
- locations.json: added serviceAreaFull (31/35 lists) + serviceAreaFullCount per branch; GBP
  serviceArea, names, addresses, geo, hours, ratings unchanged.
- descriptions.json: 2 attest values rewritten ("sourced to named sources" / "a named
  source"); sitemap 150 → 153; areas-served / knowledge-locations / service-areas-moving-company
  reframed as GBP subset within full footprint (16 within 31; 14 within 35).
- service-area.geojson (52 features, branches block, geometry, dateModified unchanged):
  rubric note rewritten ("verified", "without a dedicated page", "R4 source-check score 2",
  "served as part of the branch footprint"); all feature rubric_note "yet/cannot yet" sentences
  rewritten the same way; R4 "attestations added" → "source notes added". One retained string:
  R5 rubric negation "USDOT omitted" (permitted negation, not a claim).
- build-graphs-redo.py (staging root): reproducible builder for the graph rewrites.
- Audited-clean, no copy: pages.json, corridors.json (attest hits are internal field keys only).

### Per-page JSONs + datasets (jsons/) — 34 staged JSON files, 190 nodes + appendix
- All 31 per-page JSONs: serviceType added where missing (set to the service name); Service
  description expanded to a full industry-standard description (now 489–992 chars) built only
  from verified company facts + already-published process/domain framing (flat rate in writing,
  tagline, Short/Detailed toggle, film-only walkthrough, I-81/I-66/I-70 corridors, SIR
  1,500–3,500 lbs + L/360, ISPM 15 56 °C/30 min treatment + IPPC mark, published CWT pricing);
  Service areaServed converted to Place @id chains (branch-only for branch pages, both for
  hubs/corridors); all @ids, urls, providers, addresses, geo, hours, ratings, BreadcrumbLists
  preserved (field-preservation check passed on every file). Branch files (24): Winchester-only
  chain for the 7 Winchester branch files, Martinsburg-only for the 15 Martinsburg files,
  both-chain for the 2 corridor files. Hub files (7): commercial-moving, residential-moving,
  senior-moving, warehouse-relocation, it-equipment-…-virginia, transloading-winchester-va
  (both Place @ids kept; description Winchester-focused), industrial-commercial-services.
- industrial-commercial-services.json additionally: renamed to "Industrial & Commercial
  Project Support"; serviceType "Flexible Workforce Deployment" → "Flexible Project Support
  Deployment"; APU → "Additional project-support service for warehouse, household-goods, and
  distribution jobs, quoted per job."; "How We Operate" → supervised project teams wording with
  temp-labor/crew wording removed; Workflow "crew" → "team"; "Training & Crew Standards" →
  "Training & Team Standards"; full description added; both Place nodes appended so the @id
  chain resolves in-file (nodes 2 → 4). DEPLOY NOTE: check this name against graphs/registry
  names at deploy time (Area A kept owner-supplied industrial descriptions verbatim) — see §6.
- gun-safe-movers-martinsburg-wv.json: staged description aligned to the new gun-safe hub's
  approved wording (sub-band same careful way, safe emptied first always, stairs up/down,
  equipment matched to project, re-anchoring on request, vault any size, standard classes,
  no locksmith services) plus the Martinsburg branch sentence — so the redo does not ship
  weaker branch copy next to the new hub.
- Datasets (3, all nodes CC BY 4.0): datasets-commercial.json (8 nodes, 4 changed — gated
  sentences → confident operation chain / building-inputs-confirmed-at-quote framing, or
  deleted; no new offering claimed); datasets-residential.json (8 nodes, 3 changed —
  valuation → domain education FVP vs RVP $0.60/lb, valuation is not insurance; storage
  sentence DELETED outright, storage not activated; apartment hedging → published operation
  sentence); datasets-gun-safe.json (18 nodes — staged copy byte-identical to current live;
  deploying it is a no-op; see §7). All dataset nodes keep CC BY 4.0; dateModified kept at
  2026-10-29 in staged copies — parent re-stamps to the deploy date at deploy time.
- Audited-clean, no copy: gun-safe-movers.json (new live hub, 5 nodes, serviceType "Gun Safe
  Moving", both Place @ids, full 31/35 footprint, 630-char confident description, 0 forbidden
  hits) — parent deploys the live file as-is for this one, or confirms it is already live.
- Research appendix: jsons/research-appendix-jsons.md (industry sources; 0 attest/gated strings).
- NOT in this directory (by design): ocean datasets D1–D8 (ai-repo machine files only — see §5);
  ai-catalog.json (flagged, not rewritten — see §6); entity/best/ai-sitemap graphs (Area A/C).

### Visibility (visibility/) — 5 files + 42 patches + indexes
- ai-sitemap.json: parses; ONE in-place description change only (USDOT line → branch ratings
  stated factually); services 22, about 22, hasPart 153 (0 duplicates, URL set exactly equal to
  sitemap.xml's 153 locs), Winchester 31, Martinsburg 35. Keywords 36 (drift vs brief 32 — see §6).
- llms.txt: original + one new 2026-10-29 redo changelog entry at the end; all earlier entries
  verbatim (including the gun-safe full-page hub update entry, which confirms the staged llms
  was built from current live, not a stale copy).
- the-flat-rate-movers-data.txt: 4 current-section fixes + one new 2026-10-29 changelog entry;
  all earlier entries verbatim.
- developer-card-patch.md: readable old/new Developer card record (anchor
  `<div class="page" id="page-developer">`, https://theflatratemovers.com/developer/).
- research-appendix-visibility.md: internal research note only (L/360, ISPM 15, FMCSA valuation
  vocabulary, per-branch ratings); authorizes no new company claim.
- PATCH-INDEX.md: full index — patch table, clean-div list (111 divs), history lines,
  domain-"staged" list (41 contexts), referrals, open flags.
- patches/ (42 files, one per changed div): each with exact anchor snippet + old snippet +
  new snippet; every old snippet verified by Area C to occur exactly once inside its div
  (re-verified against the CURRENT index.html after the concurrent-write drift — but the
  deploy agent must STILL re-verify anchors at apply time, see §6).
- NOT shipped (audited-clean): robots.txt, sitemap.xml, service-area.geojson (counts-only scope).
- Builder script kept at ~/workspace/build_visibility.py for reproducibility (outside the
  staging root; noted here so it is not lost).

### Database (db/) — staged copy + SQL log + audit
- db/rubric.db: staged copy (sqlite3 .backup; integrity_check = ok; pre-change dump of source
  vs copy identical). Post-change counts identical to source: attestation 50, edge 40,
  entity 1, opening_hours 14, place 2, rubric_check 7, service 31, service_area 66.
- db/rubric-changes.sql: 11 UPDATEs, 0 INSERT/DELETE, each with a reason comment (9 attestation
  wording fixes + commercial hub URL + senior description fix). Changed-row forbidden scans = 0
  (forbidden third-party names, temp labor, crew page, bare "flat quote", subcontract, gated,
  pending, staged).
- db/db-audit.md: full table-by-table audit, 31-vs-22 reconciliation, pre/post counts.
- Source untouched: source md5 97e422f6da56d255b679a617857b4e90 verified by the coordinator
  after Area D completed.

### Staged-package sweep (sweep/) — in-place rewrites + log
- sweep/sweep-log.md: 157 lines, every file changed with exact old/new quotes, per package.
- All ten dirs rewritten in place (schema.json in each; plus content.md/meta.json in
  moving-and-storage-deep): office-deep, local-regional-deep, long-distance-deep,
  moving-and-storage-deep, senior-deep, warehouse-deep, it-deep, transloading-winchester-deep,
  packing-deep, sir-heavy-deep. All 10 schema.json + storage meta.json parse. Published-facing
  drafts: "attested" = 0; Spearman = 0; Around Town = 0; temp labor = 0; crew page = 0;
  subcontract = 0; USDOT = 0; bare "flat quote" = 0; gated/pending/staged-build/not-claimed/
  not-stated/unstated = 0 (one checked false positive: "depending" in the storage
  industry-pricing paragraph). Branches distinct in all 10; @ids unique per schema; no private
  client data.
- Storage pricing-basis update CONFIRMED: "Storage is quoted per job, monthly, or by volume"
  in schema.json (1×), content.md (4×), meta.json desc/description (1×), no rates stated,
  zero "attested" in all three files (coordinator spot-checked all three: 0 each). Meta key
  "attested" renamed to "confirmed" (same 2026-10-29 value) — merge tooling must map the old
  key name to "confirmed" (see §6). Lease-terms-vary retained as a stated term. Pages/services
  counts (153/22) not changed; storage activation still deploys as its own separate batch.
- No dataset JSON files exist in these ten dirs (only internal dataset-status.md notes), so
  there was no dataset draft to stamp CC BY 4.0; no dateModified field exists in any staged
  schema, and meta.json dates were left unchanged for the parent to re-stamp at deploy time.
- Staged schemas deliberately left at GBP footprints (16/14), NOT expanded to 31/35 in place,
  because every package's merge-note assigns that expansion to the merge step — the merge must
  still perform it (see §8).

## 4. Missing-file plan (a plan, not silent new files in this task)

Computed 2026-10-29 from live sitemap.xml: 153 locs minus 32 public JSON filenames
(31 original per-page + new gun-safe-movers.json) = **121 URLs without a standalone
per-page JSON**. Full list: report/missing-jsons-2026-10-29.txt (121 URLs).
Home (root URL) is counted in the 121 but is covered by the head graph; a standalone home
JSON is optional, not priority. Category/docs/guide pages do not all need Service JSONs —
the tiers below separate Service JSONs (needed) from Article/FAQ/Place JSONs (needed in a
different form) and from index pages (lowest priority).

### Tier 1 — Service JSONs, GSC-impression order (GSC window Jul 28–Oct 27, 2026, as reported
### to the owner; positions are as reported, not re-pulled here)
1. moving-company-winchester-va — 3,799 imp @ 49.9, 0 clicks. Largest untapped service pool
   after the interstate page. Service JSON first.
2. interstate-moving-winchester-va — 2,900 imp @ 71.7. Largest position gap in the top 30.
   Service JSON first (no authority claim added — see long-distance tension).
3. long-distance-movers-winchester-va (hub) — 1,984 imp @ 49.4. Only the Martinsburg branch
   has a JSON today; the hub needs one. No authority claim added.
4. gun-safe-movers-winchester-va — 73 imp @ 5.0, 4 clicks (best-positioned service page).
   Low impressions, highest click efficiency — defend the position with a branch JSON.
5. commercial-office-moving-2 (office hub) — no top-30 GSC number in the reported pull, but
   the office deploy is next in sequence after gun-safe; its hub JSON should ride the office
   deploy (branch office JSONs already exist), not wait for this plan.
6. moving-company-martinsburg-wv — 646 imp @ 37.0. Branch Service JSON.
7. military-government-moving (hub) — 354 imp @ 40.1. Only branch military files exist today;
   the hub needs one. No contract/clearance claim added (standing position unchanged).
8. moving-cost-guide-winchester-va — 1,593 imp @ 66.5. Guide, not a service: FAQ/Article JSON,
   not a Service JSON; price intent lives here, so depth (not a competing packing page) is the
   fix, per the packing package.
9. flat-rate-moving-quote-winchester — 1,539 imp @ 76.7. Quote-path page: WebPage + FAQ JSON
   (quote toggle, Short/Detailed, what to tell us), not a Service JSON.
10. online-estimate — 901 imp (www) @ 12.2 + 350 imp (non-www) @ 73.9. Same treatment as (9);
    www/non-www authority split is an OPEN decision (Phase F), not decided here.
11. areas-served — 509 imp @ 57.5. Place/area JSON (both branches, distinct), not a Service JSON.
12. packing-cost-winchester-va — 332 imp @ 78.4. Cost-guide FAQ/Article JSON, not a Service JSON.
13. how-to-pack-for-interstate-move — 199 imp @ 42.8. Article/FAQ JSON.
14. emergency-port-container-recovery-twic-labor-virginia — 130 imp @ 35.3. Service JSON
    (transloading family; TWIC wording stays as page URLs/chips only — no credential claim
    added without owner confirmation).
15. All other service/category pages in missing-jsons-2026-10-29.txt, in sitemap order after
    the above, EXCEPT docs/category/tag index pages (tier 3).

### Tier 2 — Public dataset files (services with no public datasets-*.json today)
Public datasets today: residential, gun-safe (18 nodes), commercial (3 files). Missing for the
other 19 services. Order: senior, warehouse, IT, transloading-Winchester (live pages, deep
staged — datasets ride their deploys, not this redo); then office, local-regional,
long-distance, packing, SIR-heavy (deep staged, deploys in sequence); then piano-antique,
ISPM 15, crating, generic transloading, final-mile, industrial-offices, government, military,
route81/corridors, industrial-commercial (deep builds still to come, datasets built with them).
Ocean datasets D1–D8: ai-repo machine files only today — live-domain serving belongs to the
transloading-Winchester merge (Q15 family), not to this redo; do not silently ship an ocean
file here and do not expect one in jsons/.

### Tier 3 — Lowest priority / explicitly not Service JSONs
Docs pages (docs-*, knowledge-*), category/tag index pages (category-*, blog, all-pages,
sitemap, developer, entities, faq as an index), case/guide pages without a service node.
These get WebPage/Breadcrumb JSONs only if a deploy batch justifies them; they do not block
the service tiers above. The 124-without-JSON figure from the last audit is superseded:
121 today (153 − 32), because the gun-safe hub JSON landed during this task.

## 5. Coordinator verification (what I checked myself vs agent-reported)

Checked by the coordinator directly (not taken on agent word alone):
- Staged graphs parse: head 24, entity 32, best 76, services/locations/descriptions/geojson
  all parse. Staged jsons parse: 34/34, 190 nodes claimed (parse verified; node total not
  independently recounted file-by-file). Staged ai-sitemap parses: services 22, hasPart 153,
  keywords 36. Staged visibility: 42 patch files present; sample patch format verified
  (anchor + OLD exact + NEW exact). Staged DB: copy integrity ok, counts match source
  (50/40/1/14/2/7/31/66); source md5 97e422f6da56d255b679a617857b4e90 unchanged after Area D.
  Sweep: sweep-log present (157 lines); storage schema/content/meta "attested" = 0 by my own
  grep; transloading Place @id change (#winchester) confirmed on disk.
- Value-level scans (JSON string values only, keys excluded) across staged graphs/*.json +
  jsons/*.json: attest / Spearman / Around Town / temp labor / crew page / subcontract /
  USDOT = 0 in every file. NOTE: this scan's glob (*.json) missed service-area.geojson
  (*.geojson); a direct grep then confirmed exactly one USDOT string there — the permitted
  R5 negation "USDOT omitted" (see §1). Raw-grep "attest" counts in staged files are NOT zero
  and must not be quoted as zero without qualification: (a) internal field KEYS retained
  deliberately (attestations/attested keys in services/locations/pages/corridors/graphs);
  (b) staged llms.txt contains 4 attest-containing lines and staged data txt 1, ALL in
  preserved historical/changelog entries (2026-10-28 history + commercial-batch record),
  while the redo's own new changelog entries contain 0 retired tokens; (c) patch files quote
  OLD snippets (with attest wording) alongside NEW snippets (clean) by design — new snippets
  scan 0 per Area C (agent-verified; coordinator verified patch format, not all 42 new
  snippets individually).
- Live gun-safe landing verified by the coordinator: gun-safe-movers.json 200
  application/json, 5 nodes; datasets-gun-safe.json 200 application/json, 18 nodes,
  0 gated / 0 attest hits; public JSON total 39 (was 38 at redo start).
- NOT independently re-verified by the coordinator (agent-verified, stated as such):
  all 42 patch anchors against current index (Area C re-verified after drift; deploy must
  re-verify at apply time); every DB row change beyond counts/integrity (Area D's SQL log
  is the record); every per-page field-preservation check (Area B); every staged schema
  parse beyond the 10 schema.json + storage meta.json the coordinator spot-checked via
  Area E's report (Area E verified all 10 + meta parse).
- Failed exec results noted in agent handoffs (Area A: 1, Area B: 1, both exitCode 1): both
  are consistent with zero-match grep exits, not build failures — staged files verify clean
  independently above. No failed result indicated a broken file.

## 6. Open decisions and flags (resolve BEFORE or AT deploy — never silently)

1. PLACE @ID SCHEME (highest-risk): head uses #winchester/#martinsburg; entity/best use
   #winchester-place/#martinsburg-place. Each file is internally consistent after this rewrite,
   but head refs do not resolve to graph Place nodes and vice versa. Area A kept both schemes
   (renaming either would break live page references); Area E changed transloading staged
   schema to #winchester/#martinsburg (per-page/head convention). PARENT DECISION REQUIRED:
   choose ONE canonical scheme at deploy time and sweep it everywhere at once (graphs, head,
   per-page JSONs, staged schemas). Do not deploy the redo with mixed schemes unexamined.
2. ENTITY COUNT 39 → 32: the dedupe is correct (unique @ids unchanged at 32), but the deploy
   gate must expect 32, not 39. Update verify.js expectations (or the deploy check) BEFORE
   running the gate, or a correct deploy will fail its own check. Verify.js itself was NOT
   touched in this task (forbidden) and must be updated by the deploy batch.
3. GRAPH-COUNT PROSE CONFLICT (unresolved, no number invented): Developer card says entity
   37 / best 89; llms.txt and data txt say 89 / 141 for the same graphs. Those older figures
   are @id OCCURRENCE counts from earlier graphs, not node counts (current: entity 32 nodes,
   best 76 nodes). The deploy must rewrite the Developer prose to current node counts (and,
   if occurrence counts are kept, recompute them from the deployed files and label them as
   occurrence counts, not node counts). Do not ship the 37/89 vs 89/141 contradiction.
4. KEYWORDS DRIFT: staged ai-sitemap has 36 keywords; the redo brief said 32 (commercial
   batch landed at 32). The extra keywords came from the concurrent gun-safe deploy. At deploy,
   recompute keywords from the CURRENT live ai-sitemap and confirm 36 is intended — do not
   hardcode 32 and do not silently drop keywords.
5. BUILDER ALIGNMENT (deploy-time, do not ignore): scripts/build-graph.js regenerates Place
   areas from GBP lists (16/14). Running it over staged files would revert the live 31/35
   expansion (entity/best Places, head nested locations, locations.json serviceAreaFull,
   best-graph City-ref mapping) and reintroduce string areas. Deploy staged files AS FILES;
   do not regenerate them until the builder is fixed to use the full footprint. Builder NOT
   touched in this task.
6. EDGE LAG (graph-owner decision, not in this deploy): edge areaServed rows reflect GBP base
   16/14, not the 31/35 footprint in service_area. Expanding edge by 36 rows is a graph-model
   change — flagged, not done.
7. FRAGMENT-URL SCOPE: commercial's Q10a (hub everywhere) does NOT cover residential or
   gun-safe. Their fragment urls still point at #service-* while page-slug rows carry hub urls.
   Hub-everywhere for those two needs their own batch approvals — do not extend Q10a silently
   in this deploy.
8. INDUSTRIAL NAME ALIGNMENT: Area B renamed the per-page industrial file to "Industrial &
   Commercial Project Support" and changed its serviceType; Area A kept owner-supplied
   industrial descriptions verbatim in graphs/registries. At deploy, check the service name
   reads consistently across graphs, registry, per-page JSON, and page copy — or log the
   deliberate difference. Do not silently rename the registry to match, or vice versa.
9. AI-CATALOG OPEN (not fixed by any area): ai-catalog.json still contains 2 attest hits
   ("with rubric scores and attestations" in GeoJSON + entity-graph entries). Area B flagged
   it, Area C did not ship it. Parent must fix it as a small follow-up (one description change
   each, same pattern as the Developer fix) or explicitly accept it as machine-catalog internal
   text. Do not silently drop it.
10. STORAGE META KEY: moving-and-storage-deep meta.json key "attested" → "confirmed" (same
    value). Merge tooling must map the old key name to "confirmed", or the merge will read a
    missing key. This is staged-only until the storage batch deploys; it does not ride the
    redo deploy.
11. STAGED FOOTPRINT: staged package schemas were left at GBP 16/14 by design; every merge
    must still expand them to 31/35 at merge time. The redo deploy (deployed files only) does
    NOT include staged package changes — staged packages ship with their own deploys in
    sequence after the redo.
12. DUPLICATE SPA ROW: DB service row …/#/industrial-commercial-services#service duplicates
    canonical #service-industrial-commercial. Left in place, flagged as the future
    model-consolidation merge candidate — do not delete it in this deploy.
13. DATE STAMPS: all staged dataset dateModified values are carried over (2026-10-29), NOT
    stamped with a deploy date. The deploy MUST re-stamp them to the actual deploy date, or
    the redo will ship stale dates as if current.

## 7. Concurrent-write drift during this task (why re-baselining is mandatory)

Live files changed underfoot while this staged redo ran, because the separate gun-safe
full-page hub update batch deployed in parallel (its own agent, not this task):
- Public JSON total 38 → 39 (new gun-safe-movers.json, 5 nodes, audited-clean by Area B).
- datasets-gun-safe.json 8 → 18 nodes, 0 gated / 0 attest (coordinator-verified live).
- index.html 1,146,259 → 1,214,860 bytes and ai-sitemap.json 39,189 → 39,724 bytes
  (Area C observation); live entity-graph.json mtimes bumped to 11:37 with content still
  reading 39 nodes (Area A observation, coordinator re-checked: still 39 nodes).
- Area B's staged gun-safe dataset was therefore rebuilt to mirror current live byte-for-byte
  (deploy no-op for that file). Area C re-verified all 42 patch anchors against the CURRENT
  index.html afterward (every old snippet still occurs exactly once in its div) and confirmed
  its staged ai-sitemap differs from the CURRENT source by the description sentence only.
- CONCLUSION: no staged file in this redo was built from a stale gun-safe source EXCEPT where
  noted (Area A graphs predate the gun-safe deploy's description-only graph refresh — the
  deploy must diff Area A graph rewrites against CURRENT live graphs and carry forward any
  gun-safe description refresh the gun-safe batch made, rather than overwriting it with the
  pre-deploy text). This diff-and-carry-forward step is mandatory, not optional.

## 8. Exact deploy steps for the parent (in order, after the gun-safe batch closes)

Do NOT start until step 1 passes. Do NOT run any step out of order. No quote tests at any step.

1. CONFIRM GUN-SAFE CLOSED: no gun-safe agent running; live gun-safe-movers.json returns
   200 application/json; live datasets-gun-safe.json returns 200 application/json with 18
   nodes; live gun-safe hub page renders its own div (not home fallback). If any check fails,
   stop — the redo waits.
2. RE-BASELINE LIVE: record current sitemap count (expect 153), public JSON total (expect 39
   with the gun-safe hub), ai-sitemap services/hasPart/keywords (expect 22/153/36 — confirm
   keywords per §6.4), live entity/best node counts, live index byte size, and live
   gun-safe dataset node count (expect 18). Save this baseline in the deploy report; every
   later count is compared against it, not against this redo report's task-start counts.
3. DECIDE THE OPEN ITEMS IN §6.1–6.4 FIRST: canonical Place @id scheme (sweep everywhere at
   once); entity count expectation (32) for the gate; Developer graph-count prose (rewrite to
   current node counts, occurrence counts recomputed and labeled if kept); keywords count
   (confirm 36). Record each decision in the deploy report with the decider and date.
4. DIFF-AND-CARRY-FORWARD (mandatory, §7): diff Area A graph rewrites against CURRENT live
   graphs; carry forward any gun-safe description refresh the gun-safe batch made into the
   staged graphs before applying them. Diff Area C visibility files against CURRENT live
   llms/data/ai-sitemap; carry forward any post-redo-start live changes the same way. If a
   diff cannot be reconciled cleanly, stop and report the conflict — do not overwrite.
5. APPLY STAGED FILES (deployed files only — staged packages do NOT ride this deploy):
   a. Graphs: head-graph.json → head ld+json block in index.html (same block position, node
      count still 24); entity-graph.json + best-json-entity-graph.json → public/ + machine
      data/ new-path files (gist graph untouched — verify before and after); services.json,
      locations.json, descriptions.json, service-area.geojson → machine data/ (and public/
      for geojson, matching the live layout).
   b. Per-page JSONs + datasets: jsons/*.json → public/ (same filenames; gun-safe dataset
      copy is a no-op vs current live — verify it is identical before copying, and skip it if
      live is newer); gun-safe-movers.json is already live — do not overwrite it with a
      staged copy (none exists).
   c. Visibility: ai-sitemap.json, llms.txt, data txt → public/ (llms/data: staged files
      already include the gun-safe update entries + redo entry — verify the carried-forward
      entries are present before copying); Developer card patch → page-developer div.
   d. Page-div patches: apply the 42 patches in visibility/patches/ to their divs (anchor
      first, old snippet must occur exactly once in its div or STOP for that div and report
      it — do not fuzzy-apply). New page divs, if any are ever added by a later batch, go
      before <footer>, never before <script>.
   e. Database: back up the live rubric.db first (dated backup, kept out of pushes), then
      replace it with db/rubric.db (staged copy) and apply db/rubric-changes.sql as the
      audit trail (the copy already contains the changes; the SQL log is the record, not a
      second application — do not apply the UPDATEs twice).
   f. RE-STAMP dateModified to the actual deploy date on every dataset node being deployed
      (residential, commercial, gun-safe if touched). Do not ship 2026-10-29 dates as if current.
   g. DO NOT run scripts/build-graph.js (see §6.5). DO NOT regenerate any staged file.
   h. DO NOT touch ai-catalog.json in this deploy except for the §6.9 follow-up if the parent
      explicitly adds it — otherwise it stays as-is and stays flagged.
6. SYNTAX + VERIFY GATE (all must pass or do NOT deploy): node --check on BOTH inline scripts
   in index.html after every index edit; verify.js green with UPDATED expectations (entity 32
   nodes, best 76, head 24, pages 153, services 22, sitemap 153, ai-sitemap 22/153, keywords
   as decided in step 3, GeoJSON 52). If verify.js still expects entity 39, update the check
   first (that is a check update, not a data fudge — record it) and re-run green.
7. WRANGLER DEPLOY from the project root (~/workspace/the-flat-rate-movers-pages, public/
   directory, --project-name=the-flat-rate-movers). Deploying from anywhere else breaks
   Functions. Note the deploy URL.
8. LIVE VERIFICATION (every changed URL, no sampling): sitemap 153; ai-sitemap 22/153/
   keywords-as-decided; head graph exactly one node per service with hub urls + Place chains
   where the redo provides them; entity 32 / best 76 nodes with exactly one fragment per
   service where applicable; all deployed per-page JSONs 200 application/json; all deployed
   dataset files 200 application/json with all nodes CC BY 4.0 and dateModified = deploy date;
   all 42 patched divs render their new snippets (spot-check by div id, plus full grep that
   no patched OLD snippet survives in its div); tagline + "Get My Flat Rate Quote" present;
   0 "DESIGN 6"; quote markers heroQuote/quoteForm/hqWalk/qWalk intact; branches distinct
   everywhere (spot-check Winchester vs Martinsburg hours/names/ratings on two patched divs
   and two JSONs). No quote test posts.
9. GITHUB (both repos, read-back verified, same motion as the deploy): push the deployed
   files to TheFlatRateMovers/theflatratemovers-ai (new-path graphs, schemas, datasets,
   llms, data txt, ai-sitemap) and TheFlatRateMovers/the-flat-rate-machine (graphs, jsons,
   visibility, db copy + SQL log, sweep log, this report, checklist). Verify each push by
   read-back at HEAD. Gist graph data/entity-graph.json untouched — verify before and after.
   Report both commit hashes.
10. REPORT + SEQUENCE: report the deploy URL, both commits, live verification results, and any
    deviation from this plan with its reason. Then continue the sequence: staged packages
    deploy in their own order (office, local-regional, long-distance, storage activation,
    senior/warehouse/IT/transloading-Winchester, packing/SIR-heavy), each with its merge-time
    footprint expansion (16/14 → 31/35), Place @id scheme as decided in step 3, and dateModified
    re-stamping. The missing-file plan in §4 follows after those deploys, in tier order.
    The ai-catalog follow-up (§6.9), edge lag (§6.6), fragment-url scope (§6.7), and duplicate
    SPA row (§6.12) stay flagged until their own batches — none of them blocks this deploy
    unless step 4's diff finds an unreconcilable conflict.

## 9. What this task deliberately did NOT do

- No live file edited, no wrangler deploy, no GitHub push, no quote test (all five areas +
  coordinator verified this by scope, and the coordinator verified live counts/files only
  by read-only curl/grep).
- No storage activation (pages/services counts unchanged at 153/22 in every staged file).
- No gun-safe attestation-update dir touched (owned by another agent; its hub update deployed
  separately during this task and is treated as live baseline, not redo output).
- No new pages, no new slugs, no /gun-safe-moving/ page (GSC label only, never a page).
- No private client data anywhere (none sought, none found in DB scans, none in any staged
  file or report).
- No builder fixes (build-graph.js alignment, ai-sitemap generator alignment) — flagged as
  deploy-time warnings, not silently fixed.
- No verify.js updates (forbidden in this task) — the deploy batch must update expectations
  per §8 step 6 and record it.
