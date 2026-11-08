// Flat Rate Machine — Generative Intent-Coverage Rubric builder (2026-10-30).
//   node scripts/build-intent-rubric.js            (build: DB + dataset + audit rows)
//   node scripts/build-intent-rubric.js --check    (regenerate in memory; compare to DB)
// Run from the-flat-rate-machine/. No dependencies beyond Node itself.
//
// WHAT THIS IS
// The intent-coverage rubric: one row per query string a customer or an
// AI assistant can use to find a company service, each row resolved to
// the exact estate surface that answers it — canonical page, per-page
// JSON, backing dataset file(s), and entity-graph Service node — with
// the SHA-256 certificate digests of the target JSON and datasets,
// computed over the files' own bytes at generation time — the values
// the signed ai-master-index.json seals (membership in that index is
// a row gate) — so every row inherits the estate's provenance seal
// (kid theflatratemovers-2026-10-29-1).
//
// Rows are GENERATED from the registries, never hand-typed:
//   data/services.json, data/pages.json, data/locations.json,
//   data/corridors.json, data/service-area.geojson, and the blog
//   question bank (../theflatratemovers/blog-project/04-question-bank.md,
//   10 categories x top-10 real question phrasings, compiled 2026-10-30).
// The configuration tables below (hub slugs, branch-page slugs, query
// phrases, the GeoJSON-capability -> service map, the question-bank map)
// are generator configuration, validated against the registries at run
// time; the ROWS are computed from them plus the registry data.
//
// GENERATION RULES (bounded; the batch record restates them):
//   R1 Footprint. A service's place strings come from its real
//      footprint: the GeoJSON features (branch/city/county types) whose
//      capability list includes one of the service's mapped capability
//      slugs. Services with no GeoJSON capability mapping generate
//      place strings for their branch base cities only (Winchester, VA
//      and Martinsburg, WV; the Winchester-only transloading service
//      for Winchester only) — no wider per-area capability record
//      exists in the estate data, and none is invented here.
//   R2 Place pattern (intent navigational-local): "{phrase} {Area}"
//      for every (service, footprint area). Target: the serving
//      branch's branch page for the service when one exists
//      (Winchester areas -> Winchester branch page, Martinsburg areas
//      -> Martinsburg branch page), else the service hub page.
//   R3 Near-me pattern (navigational-local): "{phrase} near me",
//      target the hub page, area null.
//   R4 Corridor pattern (navigational-local): "{phrase} {I-81|I-66|
//      I-70}" for corridor-applicable services (capability slugs named
//      on a corridor feature, plus the corridor, long-distance and
//      local-regional services). Target: the corridor's own page when
//      it belongs to the service's page set, else the hub page.
//   R5 Cost patterns (intent cost), per service x 3 scopes (Winchester,
//      VA / Martinsburg, WV / the Shenandoah Valley): "how much
//      {do|does} {phrase} cost in {scope}" and "{phrase} cost in
//      {scope}". Branch scopes target the branch page when one exists,
//      else the hub; the Valley scope targets the hub. Rows carry NO
//      prices — they map the question to the page that answers it.
//   R6 How patterns (intent how-process): "how to hire {phrase} in
//      {scope}" per scope (same targets as R5) and "how to book
//      {phrase}" (hub, area null).
//   R7 Best patterns (intent best-choice): "best {phrase} in {scope}"
//      and "top rated {phrase} in {scope}" per scope (targets as R5).
//   R8 AI questions (intent ai-question): the question bank's 100
//      phrasings, mapped to services by the QB_MAP below (category 9
//      splits per question: transloading vs workforce), target the
//      service hub — except when the question's own slug matches a
//      page in the service's page set, which is then the target (e.g.
//      "Do movers pack for you?" -> /do-movers-pack-for-you/). Plus
//      one generated phrasing per service: "what should I ask before
//      hiring {phrase}" (hub). British spellings in the bank are
//      normalized to American spellings in the generated strings.
//   R9 Bare phrase (navigational-local): "{phrase}" alone, hub target.
//   R10 Gates. A row is emitted only if ALL gates pass: its target page
//      is in pages.json; the target page's per-page JSON file exists in
//      the deployed public/ tree; the target JSON and every backing
//      dataset file carry a distribution entry in the signed master
//      index (their digests, computed over the files' bytes, are
//      carried into the row); the service has
//      a Service node in best-json-entity-graph.json. Rows that fail
//      any gate are EXCLUDED and counted with reasons — never pointed
//      at a fallback page.
//   R11 Dedupe on (query_text, service_id); first pattern wins in the
//      fixed class order below.
//   R16 Area families (Rubric Full-Depth, 2026-11-05): the R5/R6/R7
//      cost / best / how families at EVERY footprint area of the
//      service, not only the three scopes — "how much {do|does}
//      {phrase} cost in {Area}", "{phrase} cost in {Area}", "best
//      {phrase} in {Area}", "top rated {phrase} in {Area}", "how to
//      hire {phrase} in {Area}" per (service, footprint feature),
//      targeted by the R2 branch rule. Scope rows emit first, so
//      dedupe keeps the scope binding for the branch cities.
//   R17 Near-me depth (2026-11-05): "best {phrase} near me",
//      "{phrase} cost near me" and "how much {do|does} {phrase} cost
//      near me" per service, hub target, area null.
//   R18 Corridor forms (2026-11-05): "{phrase} {I-81|I-66|I-70}
//      corridor" (navigational-local) and "best {phrase} {corridor}
//      corridor" (best-choice) for corridor-applicable services,
//      targets as R4.
//   R19 Question bank v2 (2026-11-05): the researched per-service
//      question bank (data/question-bank-v2.json) — real customer and
//      buyer questions per service, mined from the estate's own
//      category datasets and page FAQs and completed by live search.
//      Unbound questions target the hub (or the page whose slug the
//      question matches, as R8); questions flagged local carry an
//      {area} slot and emit once per footprint area under the R2
//      branch rule.
//   R20 Flagship binding (Visibility Fix, 2026-11-06): the long-
//      distance high-value flagship page gets its own cost / best /
//      how / navigational families at state and region scope, bound
//      to the flagship itself — the Nov 6 AIO probe found the exact
//      money query absent everywhere while the flagship carried 2
//      rows and the branch pages carried the service's intent mass.
//   R21 Generic-local families (Visibility Fix, 2026-11-06): the
//      generic mover queries ("movers {town}", "best movers
//      {town}", "moving companies {town}", cost and hire forms) for
//      every footprint city and county, bound to the town's own
//      guide or company page where one exists, else its local-
//      regional spoke — the probe found the generic Martinsburg
//      query at position 9.6 with zero exact rubric rows.
//      Bank entries may also carry an explicit page binding (q.page),
//      honored by R19 ahead of the slug-match and hub fallbacks.
//
// The signed index is read from the deployed public/ tree for
// distribution membership. Cert digest values are computed from the
// row-target files themselves (Speed Program S2, 2026-11-01), so the
// rows are correct in the same pass that re-seals the estate — no
// fixpoint iteration; verify.js section 13 cross-checks every cert
// digest against the sealed index.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { SITE, fail, load } = require('./lib');
const { CATALOG } = require('./lib-constants.js');

const ROOT = path.resolve(__dirname, '..');
const FLAT = path.resolve(ROOT, '..', 'theflatratemovers');
// v2.0.0 staging overrides: production defaults are the v1 paths; the
// RUBRIC_* env vars exist so a staged copy can be built and dry-run
// against a snapshot without touching the live estate. Deploy day runs
// with no overrides.
const PUB = process.env.RUBRIC_PUBLIC_ROOT || path.resolve(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const DATA_ROOT = process.env.RUBRIC_DATA_ROOT || path.join(ROOT, 'data');
const DB_PATH = process.env.RUBRIC_DB_PATH || path.join(FLAT, 'rubric.db');
const QB_PATH = process.env.RUBRIC_QB_PATH || path.join(FLAT, 'blog-project', '04-question-bank.md');
const WORK_DIR = process.env.RUBRIC_WORK_DIR || path.resolve(ROOT, 'out', 'batch-intent-rubric', 'work');
const RUBRIC_DATE = process.env.RUBRIC_DATE || '2026-10-31';
const GENERATOR = 'build-intent-rubric.js';
// 2026-10-30 (Batch Inland Port Transloading): service-transloading rows gain the
// Virginia Inland Port datasets file as backing data (the new hub's own rows
// resolve through the existing transloading patterns; no pattern changes).
// 2026-10-30 (Batch Data Center Relocation): new service
// service-data-center-relocation added to HUB / PHRASE / DATASETS /
// BASE_ONLY / BRANCH (hub data-center-relocation; base-only 'both', like
// IT relocation — no GeoJSON capability mapping for this service).
// 2026-11-01 (Batch Freight Rework & Transloading): new service
// service-freight-rework-transloading added to HUB / PHRASE /
// DATASETS / BASE_ONLY / BRANCH (hub freight-rework-transloading;
// base-only 'both' — no GeoJSON capability mapping for this service).
// 2026-10-30 (Batch Medical & Laboratory Equipment Relocation): new
// service service-medical-lab-relocation added to HUB / PHRASE /
// DATASETS / BASE_ONLY / BRANCH (hub medical-lab-equipment-relocation;
// base-only 'both' — no GeoJSON capability mapping for this service).
// 2026-10-30 (Batch Dataset Discoverability, v1.3.2): the published
// dataset gains the Dataset Search discoverability fields — every
// distribution entry typed DataDownload with a self-referencing entry
// for datasets-intent-coverage.json, and every Dataset-typed node
// carrying url + sameAs = the dataset's canonical landing page
// (https://theflatratemovers.com/datasets/intent-coverage/), an
// identifier (the estate's Zenodo concept DOI 10.5281/zenodo.23818766
// as a PropertyValue on the four collection nodes; the landing URL on
// the per-service coverage nodes) and isAccessibleForFree. Rows are
// unaffected (the row set and gates do not change).
// 2026-10-31 (Intent Rubric v2.0.0, APPROVED by Henry 2026-10-31):
// two additions, both additive to the v1 row model.
// (1) LIVE-ESTATE ROWS + GSC EVIDENCE OVERLAY (owner correction
// 2026-10-31, superseding the seed-first framing). The GSC export in
// hand covers 2026-07-29 to 2026-10-28 — the PRE-REBUILD website.
// It is historical evidence, never a row source and never current
// performance. Item 1 therefore has two halves:
// R13 PAGE-DERIVED ROWS (primary): for every page carrying a service
// association, bounded query rows derived from what the page is for —
// its slug, its registry title, and the serviceType its per-page JSON
// publishes — targeting the page itself under the same R10 gates.
// R12' EVIDENCE OVERLAY: an imported GSC query's metrics attach to an
// existing row only on an exact normalized text match AND only when
// the row's target page appears in the export's Pages aggregate
// (existed in the window) and is still live at the same URL. Every
// attachment is stored in intent_row_gsc_evidence with its window
// and an era derived from its import window (eraForWindow).
// Unattached queries remain evidence only.
// Rows for pages with no presence in the evidence window carry the
// outcome status 'awaiting-observation' — unmeasured, not failing.
// (2) PER-ROW OUTCOME STATE. Every row carries an outcome summary
// across the gates crawled / indexed / understood / corroborated /
// cited-maintained (table intent_row_outcome), each gate state one of
// unknown / passed / failed / not-applicable with checked_at and
// evidence source columns, defaulting to unknown — a state is only
// ever written from recorded evidence (intent_outcome_evidence), never
// inferred by the generator. Outcome summaries survive regeneration
// by (query_text, service_id) key. The published dataset gains
// per-service queryRowsBySource + outcomeRollup fields and totals-node
// rowSources / observedQueries / outcomeRollup fields; the D1-D8 frame
// and node set are unchanged.
// 2026-10-31 (Intent Rubric v2 DEPLOY — the certificate-fix
// completion bar, Henry's no-gating directive): three additions ride
// the deploy. (a) Per-page JSON RESOLUTION: the five pages published
// under Batch 3 short names resolve to their real per-page JSON (the
// file whose own WebPage @id is the page's canonical URL) instead of
// failing the R10 gate on the slug-derived guess — the gate itself is
// unchanged and applies to the resolved file. (b) R14 ESTATE ROLL-UP
// rows: every registry page becomes a rubric target; hub, category
// and estate pages gain bounded rows derived from the services they
// group (ROLLUP_ALL / ROLLUP_SETS / registry-derived children /
// branch location pages), targeting the page itself under the same
// gates. (c) The totals node gains pageCoverage, the R14 roll-up
// accounting, and rowsByArea — per-area row counts for all 53
// GeoJSON footprint features, zeros published. Generator version
// stays 2.0.0 (schema 2); the additions are recorded in intent_meta
// (rollup_rows, rollup_pages, target_pages_covered/total).
const GENERATOR_VERSION = '3.1.2';
const KID = 'theflatratemovers-2026-10-29-1';

// --- Generator configuration (validated against the registries) ---
// Hub page slug per service: the service's canonical hub in the estate
// (the page its datasets lead with / its graph Service node anchors to).
const HUB = {
  'service-residential': 'residential-moving',
  'service-commercial': 'commercial-moving',
  'service-local-regional': 'local-regional-moving',
  'service-long-distance': 'long-distance-moving',
  'service-packing': 'packing',
  'service-sir-heavy': 'heavy',
  'service-gun-safe': 'gun-safe-movers',
  'service-piano-antique': 'piano-antique-white-glove-moving',
  'service-ispm15': 'export',
  'service-crating': 'custom-crating',
  'service-transloading': 'transloading',
  'service-final-mile': 'final-mile-delivery',
  'service-white-glove': 'white-glove-delivery', // first-class service (30th) — owner decision 2026-11-02
  'service-office-moving': 'office-moving',
  'service-industrial-offices': 'industrial-offices-moving',
  'service-government': 'government-moving',
  'service-military': 'military-moving',
  'service-route81': 'route81',
  'service-industrial-commercial': 'industrial-commercial-services',
  'service-senior-moving': 'senior-moving',
  'service-warehouse-relocation': 'warehouse-relocation',
  'service-it-relocation': 'it-equipment-moving-data-center-logistics-services-virginia',
  'service-transloading-winchester-va': 'transloading-winchester-va',
  'service-moving-and-storage': 'moving-and-storage',
  'service-junk-removal': 'junk-removal',
  'service-freight-rework-transloading': 'freight-rework-transloading',
  'service-warehouse-racking-relocation': 'warehouse-racking-relocation',
  'service-ffe-logistics': 'ffe-logistics',
  'service-data-center-relocation': 'data-center-relocation',
  'service-medical-lab-relocation': 'medical-lab-equipment-relocation',
  'service-logistics-project-management': 'logistics-project-management',
  'service-3pl-support': '3pl-support-services',
  'service-vault-door': 'vault-doors', // Vault V1 (Wave 1) 2026-11-04 — service #33
  'service-hoarding-cleanup': 'hoarding-cleanup', // Hoarding V1 2026-11-05 — service #34
};
// Query phrase per service (the string customers type), as a lowercase
// noun phrase; plural=true selects "do" in the cost template.
const PHRASE = {
  'service-residential': ['residential movers', true],
  'service-commercial': ['commercial movers', true],
  'service-local-regional': ['local movers', true],
  'service-long-distance': ['long distance movers', true],
  'service-packing': ['packing services', true],
  'service-sir-heavy': ['heavy asset movers', true],
  'service-gun-safe': ['gun safe movers', true],
  'service-piano-antique': ['piano movers', true],
  'service-ispm15': ['ISPM 15 export packing', false],
  'service-crating': ['custom crating', false],
  'service-transloading': ['transloading services', true],
  'service-final-mile': ['final mile delivery', false],
  'service-white-glove': ['white glove delivery', false],
  'service-office-moving': ['office movers', true],
  'service-industrial-offices': ['industrial movers', true],
  'service-government': ['government movers', true],
  'service-military': ['military movers', true],
  'service-route81': ['I-81 movers', true],
  'service-industrial-commercial': ['industrial and commercial moving services', true],
  'service-senior-moving': ['senior movers', true],
  'service-warehouse-relocation': ['warehouse relocation services', true],
  'service-it-relocation': ['IT equipment movers', true],
  'service-transloading-winchester-va': ['transloading', false],
  'service-moving-and-storage': ['moving and storage', false],
  'service-junk-removal': ['junk removal', false],
  'service-freight-rework-transloading': ['freight rework', false],
  'service-warehouse-racking-relocation': ['warehouse racking relocation', false],
  'service-ffe-logistics': ['FF&E logistics', false],
  'service-data-center-relocation': ['data center movers', true],
  'service-medical-lab-relocation': ['medical equipment movers', true],
  'service-logistics-project-management': ['logistics project management', false],
  'service-3pl-support': ['3PL support services', false],
  'service-vault-door': ['vault door movers', true], // Vault V1 2026-11-04
  'service-hoarding-cleanup': ['hoarding cleanup', false], // Hoarding V1 2026-11-05
};
// Backing dataset file(s) per service (the estate's D1-D8 files at the
// site root). Validated: file exists in public/ AND is a distribution
// in the signed index.
const DATASETS = {
  'service-residential': ['datasets-residential.json'],
  'service-commercial': ['datasets-commercial.json'],
  'service-local-regional': ['datasets-local-regional.json'],
  'service-long-distance': ['datasets-long-distance.json'],
  'service-packing': ['datasets-packing.json'],
  'service-sir-heavy': ['datasets-sir-heavy.json'],
  'service-gun-safe': ['datasets-gun-safe.json', 'datasets-vault-door-case-study.json'],
  'service-piano-antique': ['datasets-piano-antique.json'],
  'service-ispm15': ['datasets-ispm15.json'],
  'service-crating': ['datasets-crating.json'],
  'service-transloading': ['datasets-transloading.json', 'datasets-transloading-inland-port.json', 'datasets-ocean-container.json', 'datasets-ports.json', 'datasets-port-of-virginia.json', 'datasets-port-of-huntington.json'], // + datasets-port-of-huntington.json in WV-2 2026-11-07 (per-port dataset seat for the Huntington river district) // + datasets-port-of-virginia.json in Ports P3 2026-11-03 (per-port dataset seat; gives the /datasets/port-of-virginia/ landing its R13 rows + full coverage)
  'service-final-mile': ['datasets-final-mile.json'],
  'service-white-glove': ['datasets-white-glove.json', 'datasets-luxury-estate-relocation.json'],
  'service-office-moving': ['datasets-office.json'],
  'service-industrial-offices': ['datasets-industrial-offices.json'],
  'service-government': ['datasets-government.json'],
  'service-military': ['datasets-military.json'],
  'service-route81': ['datasets-route81.json'],
  'service-industrial-commercial': ['datasets-industrial-commercial.json', 'datasets-warehouse.json'],
  'service-senior-moving': ['datasets-senior.json'],
  'service-warehouse-relocation': ['datasets-warehouse.json'],
  'service-it-relocation': ['datasets-it.json'],
  'service-transloading-winchester-va': ['datasets-transloading-winchester.json'],
  'service-moving-and-storage': ['datasets-moving-and-storage.json'],
  'service-junk-removal': ['datasets-junk-removal.json'],
  'service-freight-rework-transloading': ['datasets-freight-rework.json'],
  'service-warehouse-racking-relocation': ['datasets-warehouse-racking-relocation.json'],
  'service-ffe-logistics': ['datasets-ffe-logistics.json'],
  'service-data-center-relocation': ['datasets-data-center-relocation.json'],
  'service-medical-lab-relocation': ['datasets-medical-lab-relocation.json'],
  'service-logistics-project-management': ['datasets-ports.json'],
  'service-3pl-support': ['datasets-ports.json'],
  'service-vault-door': ['datasets-vault-security.json', 'datasets-vault-doors.json', 'datasets-gun-safe.json'], // Vault V1 2026-11-04
  'service-hoarding-cleanup': ['datasets-hoarding-cleanup.json', 'datasets-junk-removal.json'], // Hoarding V1 2026-11-05
};
// GeoJSON capability slug -> registry service id (the geojson uses a
// capability vocabulary; services not reachable from it fall back to
// rule R1's branch-base footprint).
const GEO_MAP = {
  'residential-moving': 'service-residential',
  'commercial-moving': 'service-commercial',
  'office-moving': 'service-office-moving',
  'industrial-offices': 'service-industrial-offices',
  'government-moving': 'service-government',
  'military-moving': 'service-military',
  'packing': 'service-packing',
  'custom-crating': 'service-crating',
  'ispm15-export-packing': 'service-ispm15',
  'loading': 'service-transloading',
  'transloading': 'service-transloading',
  'ocean-container': 'service-transloading',
  'pods': 'service-transloading',
  'restacking': 'service-transloading',
  'final-mile': 'service-final-mile',
  'warehouse-distribution': 'service-industrial-commercial',
  'commercial-relocation': 'service-industrial-commercial',
  'ffe-installation': 'service-industrial-commercial',
  'flexible-deployment': 'service-industrial-commercial',
  // Territory upgrade (2026-11-05, owner-directed): EVERY service now
  // carries a GeoJSON capability token — BASE_ONLY is retired. The
  // footprint grew 53 -> 71 features (18 expansion towns added with map-
  // geocoded coordinates; branch by real OSRM road routing from both
  // branches). Specialty tokens (freight-rework, data-center-relocation,
  // it-relocation, vault-door, industrial-rigging) follow the researched
  // per-service town mapping; all other tokens ride the full town set.
  // This supersedes the 2026-11-02/2026-11-04/2026-11-05 no-token notes
  // formerly recorded under BASE_ONLY for white-glove, vault-door and
  // hoarding-cleanup: the geojson digest change those notes avoided is
  // paid once here, estate-wide, by this batch's seal.
  'industrial-rigging': 'service-sir-heavy',
  'gun-safe': 'service-gun-safe',
  'piano-antique': 'service-piano-antique',
  'long-distance': 'service-long-distance',
  'local-regional': 'service-local-regional',
  'route-81': 'service-route81',
  'senior-moving': 'service-senior-moving',
  'warehouse-relocation': 'service-warehouse-relocation',
  'it-relocation': 'service-it-relocation',
  'moving-and-storage': 'service-moving-and-storage',
  'junk-removal': 'service-junk-removal',
  'freight-rework': 'service-freight-rework-transloading',
  'warehouse-racking': 'service-warehouse-racking-relocation',
  'ffe-logistics': 'service-ffe-logistics',
  'data-center-relocation': 'service-data-center-relocation',
  'medical-lab': 'service-medical-lab-relocation',
  'logistics-project-management': 'service-logistics-project-management',
  '3pl-support': 'service-3pl-support',
  'transloading-winchester': 'service-transloading-winchester-va',
  'vault-door': 'service-vault-door',
  'white-glove': 'service-white-glove',
  'hoarding-cleanup': 'service-hoarding-cleanup',
};
// Services with no GeoJSON capability mapping: NONE since the
// 2026-11-05 territory upgrade — every service carries a capability
// token in GEO_MAP above (owner-directed: territories expand for all
// rubrics). BASE_ONLY remains as an empty map so the R1 fallback and
// the validateConfig XOR stay well-formed for any future service
// registered before its token is assigned.
const BASE_ONLY = {};
// EXTRA_PATTERNS (Head-Hub Programme / F4, 2026-11-02): explicit bound
// rows for money phrasings the template families do not generate — the
// exact screenshot queries, the singular "transload" forms, localized
// cross-docking, container+city, the rail-to-truck family (previously
// zero "rail" rows estate-wide) and the exact-name Inland Port phrase
// (F4d: emitted here, before R13 page-derived rows, so dedupe keeps the
// exact-name page as owner). Targets must be pages whose per-page JSON
// is a signed distribution at regeneration time (the emit gates apply).
const EXTRA_PATTERNS = {
  'service-transloading': [
    ['transloading services Winchester, VA', 'navigational-local', 'scope-winchester', 'transloading-winchester-va'],
    ['transloading services Martinsburg, WV', 'navigational-local', 'scope-martinsburg', 'transloading-movers-martinsburg-wv'],
    ['transload services near Winchester, VA', 'navigational-local', 'scope-winchester', 'transloading-winchester-va'],
    ['transload services near Martinsburg, WV', 'navigational-local', 'scope-martinsburg', 'transloading-movers-martinsburg-wv'],
    ['cross-docking Winchester, VA', 'navigational-local', 'scope-winchester', 'transloading-winchester-va'],
    ['cross-docking Martinsburg, WV', 'navigational-local', 'scope-martinsburg', 'transloading-movers-martinsburg-wv'],
    ['cross-docking services Winchester, VA', 'navigational-local', 'scope-winchester', 'transloading-winchester-va'],
    ['cross-docking services Martinsburg, WV', 'navigational-local', 'scope-martinsburg', 'transloading-movers-martinsburg-wv'],
    ['container transloading Winchester, VA', 'navigational-local', 'scope-winchester', 'transloading-winchester-va'],
    ['container transloading Martinsburg, WV', 'navigational-local', 'scope-martinsburg', 'transloading-movers-martinsburg-wv'],
    ['rail-to-truck transloading', 'navigational-local', null, 'virginia-inland-port-transloading'],
    ['rail-to-truck transloading Virginia', 'navigational-local', null, 'virginia-inland-port-transloading'],
    ['rail-to-truck transloading services', 'navigational-local', null, 'virginia-inland-port-transloading'],
    ['Virginia Inland Port transloading', 'navigational-local', null, 'virginia-inland-port-transloading'],
    // Ports P1 foundation tranche (2026-11-02): dossier section 5 master
    // templates instantiated per port against the ports dataset landing
    // (the only ports target at P1; P2-P6 re-target to hubs and spokes).
    ['transloading near Virginia Inland Port', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['transloading services Front Royal Virginia', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['Virginia Inland Port transload services', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['container unloading labor Front Royal Virginia', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['container devanning Virginia Inland Port', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['cross docking services Front Royal Virginia', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['warehouse labor near Virginia Inland Port', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['freight rework near Virginia Inland Port', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['who can unload containers at Virginia Inland Port', 'ai-question', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['who does transloading at Virginia Inland Port', 'ai-question', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['lumper services Front Royal Virginia', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['Virginia Inland Port warehouse and logistics services from Winchester VA', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['rail to truck transloading Front Royal Virginia', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    // Ports P2 VIP family (batch P2, 2026-11-02): the spoke's own rows
    // plus the hub's project-management section rows.
    ['3pl project support Virginia Inland Port', 'navigational-local', 'scope-winchester', 'virginia-inland-port-3pl-project-support'],
    ['overflow labor for 3pl Front Royal Virginia', 'navigational-local', 'scope-winchester', 'virginia-inland-port-3pl-project-support'],
    ['overflow labor for 3pl Virginia', 'navigational-local', 'scope-winchester', 'virginia-inland-port-3pl-project-support'],
    ['surge labor for warehouses Front Royal Virginia', 'navigational-local', 'scope-winchester', 'virginia-inland-port-3pl-project-support'],
    ['container crews for 3pl Virginia Inland Port', 'navigational-local', 'scope-winchester', 'virginia-inland-port-3pl-project-support'],
    ['warehouse project crew Front Royal Virginia', 'navigational-local', 'scope-winchester', 'virginia-inland-port-3pl-project-support'],
    ['warehouse project management Front Royal Virginia', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['transloading near Port of Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['transloading services Norfolk Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['Port of Virginia transload services', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['container unloading labor Norfolk Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['container devanning Norfolk Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['cross docking services Norfolk Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['warehouse labor near Port of Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['freight rework near Port of Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['who can unload containers at Port of Virginia', 'ai-question', 'scope-winchester', 'port-of-virginia-logistics'],
    ['who does transloading at Port of Virginia', 'ai-question', 'scope-winchester', 'port-of-virginia-logistics'],
    ['lumper services Norfolk Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['Port of Virginia warehouse and logistics services from Winchester VA', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['ro-ro project cargo support Norfolk Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    // WV-2 (2026-11-07): Port of Huntington Tri-State family — the river
    // district binds Winchester on miles (312.8 vs 357.7-360.4).
    ['transloading near Port of Huntington', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['transloading services Huntington West Virginia', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['Port of Huntington Tri-State transload services', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['barge freight unloading labor Huntington West Virginia', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['river port container devanning Huntington', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['cross docking services Huntington West Virginia', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['warehouse labor near Port of Huntington', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['freight rework near Port of Huntington', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['who can unload freight at Port of Huntington', 'ai-question', 'scope-winchester', 'port-of-huntington-logistics'],
    ['who does transloading at Port of Huntington Tri-State', 'ai-question', 'scope-winchester', 'port-of-huntington-logistics'],
    ['lumper services Huntington West Virginia', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['Port of Huntington warehouse and logistics services from Winchester VA', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['Ohio River port logistics support Winchester VA', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['ocean container packing and unpacking services Virginia', 'navigational-local', 'scope-winchester', 'datasets/ports'],
    ['transloading near Richmond Marine Terminal', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['transloading services Richmond Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['Richmond Marine Terminal transload services', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['container unloading labor Richmond Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['container devanning Richmond Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['cross docking services Richmond Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['warehouse labor near Richmond Marine Terminal', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['freight rework near Richmond Marine Terminal', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['who can unload containers at Richmond Marine Terminal', 'ai-question', 'scope-winchester', 'port-of-virginia-logistics'],
    ['who does transloading at Richmond Marine Terminal', 'ai-question', 'scope-winchester', 'port-of-virginia-logistics'],
    ['lumper services Richmond Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['Richmond Marine Terminal warehouse and logistics services from Winchester VA', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['barge transloading Richmond Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['transloading near Port of Baltimore', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['transloading services Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['Port of Baltimore transload services', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['container unloading labor Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['container devanning Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['cross docking services Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['warehouse labor near Port of Baltimore', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['freight rework near Port of Baltimore', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['who can unload containers at Port of Baltimore', 'ai-question', 'scope-martinsburg', 'datasets/ports'],
    ['who does transloading at Port of Baltimore', 'ai-question', 'scope-martinsburg', 'datasets/ports'],
    ['lumper services Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['Port of Baltimore warehouse and logistics services from Martinsburg WV', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['forest products handling support Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['ocean container packing and unpacking services Maryland', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['transloading near Port of Wilmington', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['transloading services Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['Port of Wilmington transload services', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['container unloading labor Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['container devanning Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['warehouse labor near Port of Wilmington', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['freight rework near Port of Wilmington', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['who can unload containers at Port of Wilmington', 'ai-question', 'scope-martinsburg', 'datasets/ports'],
    ['who does transloading at Port of Wilmington', 'ai-question', 'scope-martinsburg', 'datasets/ports'],
    ['lumper services Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['Port of Wilmington warehouse and logistics services from Martinsburg WV', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['fruit and banana container handling Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['reefer container labor Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['transloading near PhilaPort', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['transloading services Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['PhilaPort transload services', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['container unloading labor Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['container devanning Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['cross docking services Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['warehouse labor near PhilaPort', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['freight rework near PhilaPort', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['who can unload containers at PhilaPort', 'ai-question', 'scope-martinsburg', 'datasets/ports'],
    ['who does transloading at PhilaPort', 'ai-question', 'scope-martinsburg', 'datasets/ports'],
    ['lumper services Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['PhilaPort warehouse and logistics services from Martinsburg WV', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['reefer container labor Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['ocean container packing and unpacking services Pennsylvania', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['transloading I-70 Maryland', 'navigational-local', null, 'datasets/ports'],
    ['cross docking I-64 Virginia', 'navigational-local', null, 'datasets/ports'],
    ['container services I-81 corridor', 'navigational-local', null, 'datasets/ports'],
      // Ports P3 Norfolk + Richmond families (2026-11-03)
    ['container labor Port of Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['container packing and unpacking Norfolk Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['devanning services Norfolk Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['port logistics support Norfolk Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['who provides transloading and container labor near the Port of Virginia', 'ai-question', 'scope-winchester', 'port-of-virginia-logistics'],
    ['who unloads containers at the Port of Virginia', 'ai-question', 'scope-winchester', 'port-of-virginia-logistics'],
    ['barge container transloading Richmond Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    // Ports P4 cross-docking family (2026-11-03): XD rows ride
    // service-transloading (dossier §2.3 — XD registers nothing).
    ['cross-docking services', 'navigational-local', null, 'cross-docking-services'],
    ['cross docking services Virginia', 'navigational-local', 'scope-winchester', 'cross-docking-services'],
    ['cross-docking services Virginia', 'navigational-local', 'scope-winchester', 'cross-docking-services'],
    ['cross docking services West Virginia', 'navigational-local', 'scope-martinsburg', 'cross-docking-services'],
    ['cross-dock warehouse labor Virginia', 'navigational-local', 'scope-winchester', 'cross-docking-services'],
    ['cross docking near Port of Virginia', 'navigational-local', 'scope-winchester', 'cross-docking-services'],
    ['cross docking near Port of Baltimore', 'navigational-local', 'scope-martinsburg', 'cross-docking-services'],
    ['cross docking near Virginia Inland Port', 'navigational-local', 'scope-winchester', 'cross-docking-services'],
    ['who does cross-docking in Virginia', 'ai-question', 'scope-winchester', 'cross-docking-services'],
    ['who provides cross-docking services near PhilaPort', 'ai-question', 'scope-martinsburg', 'cross-docking-services'],
    // WV Luxury Estate Program (2026-11-07): LERSI families per DOSSIER S6 —
    // community-direct, place-anchored luxury, service-led (offered LERSI
    // only), situation-led, FAQ-shaped. Market-context services generate no
    // offer-intent rows. Target: the destination hub page.
    ['movers to The Greenbrier Sporting Club', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['moving company for Greenbrier Sporting Club homes', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['Glade Springs movers', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['movers near Glade Springs WV', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['White Rock Mountain movers', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['moving to The Retreat Caldwell WV', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['luxury movers Lewisburg WV', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['white glove movers White Sulphur Springs WV', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['estate movers Greenbrier County WV', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['high-end moving company Beckley WV area', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['luxury home movers Daniels WV', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['white glove packing and unpacking West Virginia estates', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['custom crating chandeliers movers WV', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['piano movers Greenbrier County', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['gun safe movers Lewisburg WV', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['fine art movers West Virginia', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['new construction furniture delivery gated community WV', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['moving into a gated community West Virginia', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['HOA moving rules gated community delivery', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['delivering furniture to a new build in the mountains WV', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['long distance movers to West Virginia resort communities', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['movers from Virginia to Greenbrier WV', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['can movers get into the Greenbrier Sporting Club gate', 'ai-question', null, 'luxury-estate-relocation-west-virginia'],
    ['how are deliveries handled at gated communities in WV', 'ai-question', null, 'luxury-estate-relocation-west-virginia'],
    ['who moves grand pianos into mountain homes in West Virginia', 'ai-question', null, 'luxury-estate-relocation-west-virginia'],
    ['luxury estate relocation West Virginia', 'navigational-local', null, 'luxury-estate-relocation-west-virginia'],
    ['estate relocation services index LERSI', 'navigational-local', null, 'datasets/luxury-estate-relocation'],
  ],
  'service-freight-rework-transloading': [
    // Ports P3 Norfolk + Richmond families (2026-11-03)
    ['cross docking near Port of Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['cross docking services Hampton Roads Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['freight rework Hampton Roads Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['shifted load rework I-64 Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['cross docking near Richmond Marine Terminal', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    // Ports P4 (2026-11-03): cross-docking joins the rework family.
    ['cross docking and freight rework Virginia', 'navigational-local', 'scope-winchester', 'cross-docking-services'],
  ],
  'service-logistics-project-management': [
    // Ports P4 service families (2026-11-03): 6 rows re-keyed from
    // service-transloading (§A) + the new hub family (§B) + §C.
    ['logistics project management Front Royal Virginia', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['logistics project management Virginia Inland Port', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['logistics project management Norfolk Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['logistics project management Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['logistics project management Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['logistics project management Port of Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['logistics project management services', 'navigational-local', null, 'logistics-project-management'],
    ['logistics project management for warehouse projects', 'navigational-local', null, 'logistics-project-management'],
    ['warehouse project management services Virginia', 'navigational-local', 'scope-winchester', 'logistics-project-management'],
    ['port project management services', 'navigational-local', null, 'logistics-project-management'],
    ['logistics project manager for hire Virginia', 'navigational-local', 'scope-winchester', 'logistics-project-management'],
    ['logistics project manager for hire West Virginia', 'navigational-local', 'scope-martinsburg', 'logistics-project-management'],
    ['container program management Virginia', 'navigational-local', 'scope-winchester', 'logistics-project-management'],
    ['warehouse reset project management', 'navigational-local', null, 'logistics-project-management'],
    ['who can manage a warehouse project in Virginia', 'ai-question', 'scope-winchester', 'logistics-project-management'],
    ['who provides logistics project management near the Port of Virginia', 'ai-question', 'scope-winchester', 'logistics-project-management'],
    ['who provides logistics project management near the Port of Baltimore', 'ai-question', 'scope-martinsburg', 'logistics-project-management'],
    ['What does logistics project management include?', 'ai-question', null, 'logistics-project-management'],
  ],
  // Vault V1 seed + hub family (2026-11-04, registration spec §6): seed rows
  // target the two dataset landings; hub rows target /vault-doors/. Model
  // questions regenerate from the admitted door rows (8 at V1).
  'service-vault-door': [
    ['vault door standards', 'navigational-local', null, 'datasets/vault-security'],
    ['UL 608 classes', 'navigational-local', null, 'datasets/vault-security'],
    ['GSA Class 5-V', 'navigational-local', null, 'datasets/vault-security'],
    ['vault door classes explained', 'navigational-local', null, 'datasets/vault-security'],
    ['AA-D-600D classes', 'navigational-local', null, 'datasets/vault-security'],
    ['vault door security standards', 'navigational-local', null, 'datasets/vault-security'],
    ['vault door models', 'navigational-local', null, 'datasets/vault-doors'],
    ['vault door weights', 'navigational-local', null, 'datasets/vault-doors'],
    ['vault door specifications', 'navigational-local', null, 'datasets/vault-doors'],
    ['vault door model weights', 'navigational-local', null, 'datasets/vault-doors'],
    ['how much do vault doors weigh', 'ai-question', null, 'datasets/vault-doors'],
    ['What are the UL 608 vault door classes and how long does each resist attack?', 'ai-question', null, 'datasets/vault-security'],
    ['Is a GSA Class 5-V vault door bulletproof?', 'ai-question', null, 'datasets/vault-security'],
    ['What does Class 5-V resist — and for how long?', 'ai-question', null, 'datasets/vault-security'],
    ['What is the difference between Class 5-V, 5-A, and 5-B?', 'ai-question', null, 'datasets/vault-security'],
    ['What lock does a Class 5-V vault door use?', 'ai-question', null, 'datasets/vault-security'],
    ['What is FF-L-2740B?', 'ai-question', null, 'datasets/vault-security'],
    ['What is a UL 768 Group 1 lock?', 'ai-question', null, 'datasets/vault-security'],
    ['How long does a Group 1R lock resist radiological attack?', 'ai-question', null, 'datasets/vault-security'],
    ['How many hours is a UL 768 Group 2 lock rated for?', 'ai-question', null, 'datasets/vault-security'],
    ['Does UL 608 protect against explosives?', 'ai-question', null, 'datasets/vault-security'],
    ['What is a time lock — UL 768 or UL 887?', 'ai-question', null, 'datasets/vault-security'],
    ['Can anyone buy an FF-L-2740B lock?', 'ai-question', null, 'datasets/vault-security'],
    ["What does 'built to UL 608' mean without the UL Mark?", 'ai-question', null, 'datasets/vault-security'],
    ['What is the difference between UL 608 and UL 687?', 'ai-question', null, 'datasets/vault-security'],
    ['Which GSA vault door class is ballistic rated?', 'ai-question', null, 'datasets/vault-security'],
    ['What does net working time mean in UL 608?', 'ai-question', null, 'datasets/vault-security'],
    ['What lock does a Class 5-A vault door use?', 'ai-question', null, 'datasets/vault-security'],
    ['What is QPL-AA-D-600-12?', 'ai-question', null, 'datasets/vault-security'],
    ['How long does a UL 608 Class 2 vault door resist attack?', 'ai-question', null, 'datasets/vault-security'],
    ['What is a UL 608 Class M vault door?', 'ai-question', null, 'datasets/vault-security'],
    ['How much does the Liberty Beast vault door weigh?', 'ai-question', null, 'datasets/vault-doors'],
    ['What does the Liberty Beast vault door cost?', 'ai-question', null, 'datasets/vault-doors'],
    ['How much does a Liberty Beast inswing vault door weigh?', 'ai-question', null, 'datasets/vault-doors'],
    ['Liberty Beast inswing vault door specifications', 'ai-question', null, 'datasets/vault-doors'],
    ['How much does a Fort Knox 8240 vault door weigh?', 'ai-question', null, 'datasets/vault-doors'],
    ['Fort Knox 8240 out-swing vault door specifications', 'ai-question', null, 'datasets/vault-doors'],
    ['How much does a Fort Knox 8248 vault door weigh?', 'ai-question', null, 'datasets/vault-doors'],
    ['Is the Fort Knox 8248 vault door in the SIR weight band?', 'ai-question', null, 'datasets/vault-doors'],
    ['How much does a Fort Knox 8240 in-swing vault door weigh?', 'ai-question', null, 'datasets/vault-doors'],
    ['Fort Knox 8240 in-swing vault door specifications', 'ai-question', null, 'datasets/vault-doors'],
    ['How much does a Fort Knox 8248 in-swing vault door weigh?', 'ai-question', null, 'datasets/vault-doors'],
    ['Fort Knox 8248 in-swing vault door specifications', 'ai-question', null, 'datasets/vault-doors'],
    ['How much does a GSA Class 5-V vault door weigh?', 'ai-question', null, 'datasets/vault-doors'],
    ['What is the clear opening of an Overly Class 5-V vault door?', 'ai-question', null, 'datasets/vault-doors'],
    ['How much does a Class 5-B vault door weigh?', 'ai-question', null, 'datasets/vault-doors'],
    ['What lock does an Overly Class 5-B vault door use?', 'ai-question', null, 'datasets/vault-doors'],
    ['Which vault doors fall in the 1,500 to 3,500 lb range?', 'ai-question', null, 'datasets/vault-doors'],
    ['vault door movers', 'navigational-local', null, 'vault-doors'],
    ['vault door moving', 'navigational-local', null, 'vault-doors'],
    ['vault door installation', 'navigational-local', null, 'vault-doors'],
    ['vault door relocation', 'navigational-local', null, 'vault-doors'],
    ['vault door delivery', 'navigational-local', null, 'vault-doors'],
    ['vault door movers near me', 'navigational-local', null, 'vault-doors'],
    ['move a vault door', 'navigational-local', null, 'vault-doors'],
    ['install a vault door', 'navigational-local', null, 'vault-doors'],
    ['What is a Class 5-V vault door?', 'ai-question', null, 'vault-doors'],
    ['Are vault doors bulletproof?', 'ai-question', null, 'vault-doors'],
    ['Can a vault door be moved?', 'ai-question', null, 'vault-doors'],
    ['Do movers install vault doors?', 'ai-question', null, 'vault-doors'],
    ['How is a vault door installed?', 'ai-question', null, 'vault-doors'],
    ['What should I tell a mover before a vault door quote?', 'ai-question', null, 'vault-doors'],
    ['Does a vault door need a floor check before installation?', 'ai-question', null, 'vault-doors'],
    ['Can an antique vault door be relocated?', 'ai-question', null, 'vault-doors'],
    ['Who moves vault doors in Virginia?', 'ai-question', null, 'vault-doors'],
    ['Who installs vault doors in West Virginia?', 'ai-question', null, 'vault-doors'],
  ],
  // Hoarding V1 seed + situation family (2026-11-05): the package's 18
  // buyer-intent terms bound explicitly — situation rows target the hub,
  // city rows the branch pages, research rows the dataset landing.
  'service-hoarding-cleanup': [
    ['hoarding cleanup near me', 'navigational-local', null, 'hoarding-cleanup'],
    ['hoarder house cleanout services', 'navigational-local', null, 'hoarding-cleanup'],
    ['professional hoarding cleanup service', 'navigational-local', null, 'hoarding-cleanup'],
    ['hoarding and biohazard cleanup', 'navigational-local', null, 'hoarding-cleanup'],
    ['emergency hoarding cleanup same day', 'navigational-local', null, 'hoarding-cleanup'],
    ['hoarding cleanup cost', 'navigational-local', null, 'hoarding-cleanup'],
    ['clean out hoarder house after death of parent', 'navigational-local', null, 'hoarding-cleanup'],
    ['hoarding cleanup code enforcement condemned house', 'navigational-local', null, 'hoarding-cleanup'],
    ['hoarder house cleanout before selling', 'navigational-local', null, 'hoarding-cleanup'],
    ['sell hoarder house as is', 'navigational-local', null, 'hoarding-cleanup'],
    ['hoarding cleanup for landlords', 'navigational-local', null, 'hoarding-cleanup'],
    ['hoarder tenant cleanout', 'navigational-local', null, 'hoarding-cleanup'],
    ['how to hire a hoarding cleanup company', 'navigational-local', null, 'hoarding-cleanup'],
    ['how to help a hoarder clean out their house', 'navigational-local', null, 'hoarding-cleanup'],
    ['hoarding cleanup winchester va', 'navigational-local', null, 'hoarding-cleanup-winchester-va'],
    ['hoarding cleanup martinsburg wv', 'navigational-local', null, 'hoarding-cleanup-martinsburg-wv'],
    ['hoarding cleanup chantilly va', 'navigational-local', null, 'hoarding-cleanup-winchester-va'],
    ['hoarding cleanout winchester va', 'navigational-local', null, 'hoarding-cleanup-winchester-va'],
    ['hoarding cleanout martinsburg wv', 'navigational-local', null, 'hoarding-cleanup-martinsburg-wv'],
    ['hoarding cleanup dataset', 'navigational-local', null, 'datasets/hoarding-cleanup'],
    ['hoarding cleanout process', 'navigational-local', null, 'datasets/hoarding-cleanup'],
    ['hoarding disorder prevalence', 'navigational-local', null, 'datasets/hoarding-cleanup'],
    ['hoarding cleanup research', 'navigational-local', null, 'datasets/hoarding-cleanup'],
    ['How much does it cost to clean out a hoarder house?', 'ai-question', null, 'hoarding-cleanup'],
    ['Does homeowners insurance cover hoarding cleanup?', 'ai-question', null, 'hoarding-cleanup'],
    ['How do I clean out a hoarder house after a parent dies?', 'ai-question', null, 'hoarding-cleanup'],
    ['What happens if a hoarded house is condemned?', 'ai-question', null, 'hoarding-cleanup'],
    ['Is hoarding a fire hazard?', 'ai-question', null, 'datasets/hoarding-cleanup'],
    ['How common is hoarding disorder?', 'ai-question', null, 'datasets/hoarding-cleanup'],
    ['What does NFPA say about hoarding and fire risk?', 'ai-question', null, 'datasets/hoarding-cleanup'],
    ['How does code enforcement work for a hoarded house in Martinsburg WV?', 'ai-question', null, 'hoarding-cleanup-martinsburg-wv'],
    // Visibility terms (Henry, 2026-11-08): the declutter family and the
    // professional / heavy-duty phrasing for both branch cities.
    ['decluttering services winchester va', 'navigational-local', null, 'hoarding-cleanup-winchester-va'],
    ['decluttering services martinsburg wv', 'navigational-local', null, 'hoarding-cleanup-martinsburg-wv'],
    ['declutter hoarded house', 'navigational-local', null, 'hoarding-cleanup'],
    ['hoarding decluttering service', 'navigational-local', null, 'hoarding-cleanup'],
    ['heavy duty hoarding cleanout', 'navigational-local', null, 'hoarding-cleanup'],
    ['professional hoarding cleanup martinsburg wv', 'navigational-local', null, 'hoarding-cleanup-martinsburg-wv'],
    ['professional hoarding cleanup winchester va', 'navigational-local', null, 'hoarding-cleanup-winchester-va'],
    ['heavy-duty cleanout services martinsburg wv', 'navigational-local', null, 'hoarding-cleanup-martinsburg-wv'],
    ['heavy-duty cleanout services winchester va', 'navigational-local', null, 'hoarding-cleanup-winchester-va'],
    ['Are professional hoarding cleanup and heavy-duty cleanout services available in and around Martinsburg, West Virginia?', 'ai-question', null, 'hoarding-cleanup-martinsburg-wv'],
    ['Are professional hoarding cleanup and heavy-duty cleanout services available in and around Winchester, Virginia?', 'ai-question', null, 'hoarding-cleanup-winchester-va'],
    ['Who can declutter a hoarded house?', 'ai-question', null, 'hoarding-cleanup'],
    ['Can a hoarding cleanout include decluttering the whole house?', 'ai-question', null, 'hoarding-cleanup'],
  ],
  'service-3pl-support': [
    // Ports P4 service families (2026-11-03): 7 rows re-keyed from
    // service-transloading (§A) + the new hub family (§B) + §C.
    ['3pl support services Virginia Inland Port', 'navigational-local', 'scope-winchester', 'virginia-inland-port-3pl-project-support'],
    ['3pl support services Front Royal Virginia', 'navigational-local', 'scope-winchester', 'virginia-inland-port-3pl-project-support'],
    ['who provides 3pl support at Virginia Inland Port', 'ai-question', 'scope-winchester', 'virginia-inland-port-3pl-project-support'],
    ['3pl support services Norfolk Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['3pl support services Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['3pl support services Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'datasets/ports'],
    ['3pl support services Hampton Roads Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['3pl support services', 'navigational-local', null, '3pl-support-services'],
    ['3pl support services Virginia', 'navigational-local', 'scope-winchester', '3pl-support-services'],
    ['3pl support services West Virginia', 'navigational-local', 'scope-martinsburg', '3pl-support-services'],
    ['overflow labor for 3pl', 'navigational-local', null, '3pl-support-services'],
    ['overflow labor for 3pl Virginia', 'navigational-local', 'scope-winchester', '3pl-support-services'],
    ['3pl surge labor services', 'navigational-local', null, '3pl-support-services'],
    ['warehouse labor support for 3pl operations', 'navigational-local', null, '3pl-support-services'],
    ['container crews for 3pl', 'navigational-local', null, '3pl-support-services'],
    ['3pl project support services Hampton Roads', 'navigational-local', 'scope-winchester', '3pl-support-services'],
    ['who provides support labor for 3pl warehouses', 'ai-question', null, '3pl-support-services'],
    ['who can staff a 3pl surge in Virginia', 'ai-question', 'scope-winchester', '3pl-support-services'],
    ['What do 3PL support services include?', 'ai-question', null, '3pl-support-services'],
  ],
  // B2B Specialty (2026-11-05): the 24 researched buyer-intent terms
  // from the program dossier, bound to the two hubs (E6 to the IT-VA
  // spearhead). Spoke-targeted rows arrive with the spoke pages.
  'service-medical-lab-relocation': [
    ['lab equipment movers near me', 'navigational-local', null, 'medical-lab-equipment-relocation'],
    ['cleanroom equipment relocation services', 'ai-question', null, 'cleanroom-relocation'],
    ['cleanroom relocation services', 'ai-question', null, 'cleanroom-relocation'],
    ['MRI machine moving company price', 'ai-question', null, 'medical-lab-equipment-relocation'],
    ['certified medical equipment relocation specialists', 'ai-question', null, 'medical-lab-equipment-relocation'],
    ['pharmaceutical lab relocation contract', 'ai-question', null, 'medical-lab-equipment-relocation'],
    ['centrifuge moving services chain of custody', 'ai-question', null, 'centrifuge-and-analyzer-moving'],
    ['centrifuge moving services', 'ai-question', null, 'centrifuge-and-analyzer-moving'],
    ['analyzer moving services calibration', 'ai-question', null, 'centrifuge-and-analyzer-moving'],
    ['cryogenic sample transport movers', 'ai-question', null, 'medical-lab-equipment-relocation'],
    ['hospital equipment moving RFQ template', 'ai-question', null, 'hospital-equipment-moving-rfq-guide'],
    ['hospital equipment moving rfq guide', 'ai-question', null, 'hospital-equipment-moving-rfq-guide'],
    ['medical equipment vendor scoring criteria', 'ai-question', null, 'hospital-equipment-moving-rfq-guide'],
    ['medical equipment movers winchester va', 'navigational-local', null, 'medical-equipment-movers-winchester-va'],
    ['medical equipment movers martinsburg wv', 'navigational-local', null, 'medical-equipment-movers-martinsburg-wv'],
    ['lab equipment movers winchester va', 'navigational-local', null, 'medical-equipment-movers-winchester-va'],
    ['lab equipment movers martinsburg wv', 'navigational-local', null, 'medical-equipment-movers-martinsburg-wv'],
    ['medical equipment movers near me', 'navigational-local', null, 'medical-lab-equipment-relocation'],
    ['laboratory relocation services', 'ai-question', null, 'medical-lab-equipment-relocation'],
    ['ultra-low freezer moving', 'ai-question', null, 'medical-lab-equipment-relocation'],
    ['lab relocation cost', 'ai-question', null, 'medical-lab-equipment-relocation'],
    ['how to evaluate a medical equipment moving company', 'ai-question', null, 'datasets/b2b-specialty-rubric'],
    ['laboratory relocation rfq requirements', 'ai-question', null, 'datasets/b2b-specialty-rubric'],
    ['medical equipment mover selection criteria', 'ai-question', null, 'datasets/b2b-specialty-rubric'],
  ],
  'service-data-center-relocation': [
    ['data center relocation services quote', 'cost', null, 'data-center-relocation'],
    ['server rack migration contractor', 'ai-question', null, 'data-center-relocation'],
    ['turnkey server room relocation company', 'cost', null, 'data-center-relocation'],
    ['secure IT asset relocation white glove', 'ai-question', null, 'data-center-relocation'],
    ['data center white space migration services', 'ai-question', null, 'data-center-relocation'],
    ['enterprise server moving insurance coverage', 'ai-question', null, 'data-center-relocation'],
    ['mainframe relocation specialists', 'ai-question', null, 'data-center-relocation'],
    ['disaster recovery data center moving emergency', 'cost', null, 'emergency-data-center-relocation'],
    ['emergency data center relocation', 'cost', null, 'emergency-data-center-relocation'],
    ['data center movers near me', 'navigational-local', null, 'data-center-relocation'],
    ['server movers', 'cost', null, 'it-equipment-moving-data-center-logistics-services-virginia'],
    ['data center decommissioning services', 'ai-question', null, 'data-center-decommissioning'],
    ['data center decommissioning', 'ai-question', null, 'data-center-decommissioning'],
    ['data center movers winchester va', 'navigational-local', null, 'data-center-movers-winchester-va'],
    ['data center movers martinsburg wv', 'navigational-local', null, 'data-center-movers-martinsburg-wv'],
    ['server movers winchester va', 'navigational-local', null, 'data-center-movers-winchester-va'],
    ['server movers martinsburg wv', 'navigational-local', null, 'data-center-movers-martinsburg-wv'],
    ['colocation migration services', 'ai-question', null, 'data-center-relocation'],
    ['how to evaluate a data center moving company', 'ai-question', null, 'datasets/b2b-specialty-rubric'],
    ['data center relocation rfp requirements', 'ai-question', null, 'datasets/b2b-specialty-rubric'],
    ['data center mover selection criteria', 'ai-question', null, 'datasets/b2b-specialty-rubric'],
    // DC domination batch 2 (2026-11-08): the server-relocation family
    // (0 rows estate-wide before this batch; the dossier's highest-volume
    // head terms — server relocation services 1,300/mo, IT equipment
    // moving 1,600/mo, data center decommissioning 2,400/mo) plus the
    // Ashburn-corridor geo clusters as explicit bound rows. Corridor
    // rows record demand against facilities the branches serve by road
    // (Ashburn ~45 mi from Winchester); they are never a local-presence
    // claim. The 8 dossier seed questions close the block, targeted at
    // the pages that answer them.
    ['server relocation services', 'cost', null, 'data-center-relocation'],
    ['server relocation company', 'cost', null, 'data-center-relocation'],
    ['server relocation services virginia', 'cost', null, 'data-center-relocation'],
    ['server relocation services northern virginia', 'cost', null, 'data-center-relocation'],
    ['server relocation services near me', 'navigational-local', null, 'data-center-relocation'],
    ['server movers near me', 'navigational-local', null, 'data-center-relocation'],
    ['IT equipment moving services', 'cost', null, 'it-equipment-moving-data-center-logistics-services-virginia'],
    ['IT equipment movers', 'cost', null, 'it-equipment-moving-data-center-logistics-services-virginia'],
    ['IT equipment moving company virginia', 'cost', null, 'it-equipment-moving-data-center-logistics-services-virginia'],
    ['server rack relocation services', 'cost', null, 'data-center-relocation'],
    ['populated rack moving services', 'ai-question', null, 'data-center-relocation'],
    ['how to transport a fully populated server rack without de-racking', 'how-process', null, 'data-center-relocation'],
    ['data center decommissioning services near me', 'navigational-local', null, 'data-center-decommissioning'],
    ['data center decommissioning company virginia', 'cost', null, 'data-center-decommissioning'],
    ['server decommissioning and ITAD haul out services', 'ai-question', null, 'data-center-decommissioning'],
    ['what is the difference between ITAD decommissioning and physical server moving', 'ai-question', null, 'data-center-decommissioning'],
    ['server relocation services ashburn va', 'navigational-local', null, 'data-center-relocation'],
    ['server movers ashburn va', 'navigational-local', null, 'data-center-relocation'],
    ['data center movers ashburn va', 'navigational-local', null, 'data-center-relocation'],
    ['server relocation services loudoun county', 'navigational-local', null, 'data-center-relocation'],
    ['which movers handle server transport in loudoun county ashburn data center alley', 'ai-question', null, 'data-center-relocation'],
    ['server relocation services sterling va', 'navigational-local', null, 'data-center-relocation'],
    ['data center movers sterling va', 'navigational-local', null, 'data-center-relocation'],
    ['server relocation services manassas va', 'navigational-local', null, 'data-center-relocation'],
    ['data center decommissioning manassas va', 'navigational-local', null, 'data-center-decommissioning'],
    ['server relocation services reston va', 'navigational-local', null, 'data-center-relocation'],
    ['server relocation services herndon va', 'navigational-local', null, 'data-center-relocation'],
    ['data center movers dulles corridor', 'navigational-local', null, 'data-center-relocation'],
    ['how much does it cost to move a data center server rack in northern virginia', 'cost', null, 'data-center-relocation'],
    ['what standard governs environmental conditions during data center hardware transport', 'ai-question', null, 'datasets/data-center-relocation'],
    ['how is chain of custody maintained when moving high-security government server equipment', 'ai-question', null, 'data-center-relocation'],
    ['how to prevent static damage esd when packing servers for migration', 'how-process', null, 'data-center-relocation'],
    ['what factors increase the cost of emergency weekend data center moves', 'cost', null, 'emergency-data-center-relocation'],
  ],
  'service-long-distance': [
    // Demand corridors (Review + Demand-Geography batch, 2026-11-05):
    // Cloudflare top-metro demand signals (24h, 2026-11-05). Corridor
    // rows record demand, never a local service claim; interstate
    // fulfillment rides the contractor model (owner-settled).
    ['long distance movers to Seattle', 'research', null, 'long-distance-cross-country-moving'],
    ['long distance movers to San Jose', 'research', null, 'long-distance-cross-country-moving'],
    ['long distance movers to Newark NJ', 'research', null, 'long-distance-cross-country-moving'],
    ['long distance movers to Denver', 'research', null, 'long-distance-cross-country-moving'],
    ['long distance movers to Paris', 'research', null, 'long-distance-cross-country-moving'],
    ['long distance movers to Miami', 'research', null, 'long-distance-movers-miami'],
    ['long distance movers to Dallas', 'research', null, 'long-distance-cross-country-moving'],
    ['long distance movers to Los Angeles', 'research', null, 'long-distance-cross-country-moving'],
    ['long distance movers to Ashburn VA', 'research', null, 'long-distance-cross-country-moving'],
    ['interstate movers for high value items', 'navigational-local', null, 'long-distance-moving-for-high-value-items'],
    ['long distance movers for antiques', 'navigational-local', null, 'long-distance-moving-for-high-value-items'],
    ['long distance movers for fine art', 'navigational-local', null, 'long-distance-moving-for-high-value-items'],
    ['movers with full value protection', 'navigational-local', null, 'long-distance-moving-for-high-value-items'],
    ['long distance movers with declared value coverage', 'navigational-local', null, 'long-distance-moving-for-high-value-items'],
    ['fine art long distance movers virginia', 'navigational-local', null, 'long-distance-moving-for-high-value-items'],
    ['grand piano long distance movers', 'navigational-local', null, 'long-distance-moving-for-high-value-items'],
    ['best interstate movers for antiques', 'best-choice', null, 'long-distance-moving-for-high-value-items'],
    ['best long distance movers for pianos', 'best-choice', null, 'long-distance-moving-for-high-value-items'],
    ['how does full value protection work on a long distance move', 'how-process', null, 'long-distance-moving-for-high-value-items'],
    ['how to declare high value items to movers', 'how-process', null, 'long-distance-moving-for-high-value-items'],
    ['how to file a claim against a long distance mover', 'how-process', null, 'long-distance-moving-for-high-value-items'],
    ['what is the high value inventory form for movers', 'ai-question', null, 'long-distance-moving-for-high-value-items'],
    ['what is released value on a moving estimate', 'ai-question', null, 'long-distance-moving-for-high-value-items'],
    ['how long do i have to file a moving claim', 'ai-question', null, 'long-distance-moving-for-high-value-items'],
    ['what is a delivery spread for long distance movers', 'ai-question', null, 'long-distance-moving-for-high-value-items'],
    ['what does reasonable dispatch mean for movers', 'ai-question', null, 'long-distance-moving-for-high-value-items'],
    ['how is a grand piano prepared for a long distance move', 'ai-question', null, 'long-distance-moving-for-high-value-items'],
    ['when should a piano be tuned after a long distance move', 'ai-question', null, 'long-distance-moving-for-high-value-items'],
    ['how are antiques protected on a long distance move', 'ai-question', null, 'long-distance-moving-for-high-value-items'],
    ['long distance moving valuation vs insurance', 'research', null, 'long-distance-moving-for-high-value-items'],
    ['49 cfr 375 household goods rights', 'research', null, 'long-distance-moving-for-high-value-items'],
  ],
  'service-white-glove': [
    ['white glove delivery Winchester, VA', 'navigational-local', 'scope-winchester', 'white-glove-delivery-winchester-va'],
    ['white glove delivery service', 'navigational-local', null, 'white-glove-delivery'],
    ['what does white glove delivery include', 'ai-question', null, 'white-glove-delivery'],
    ['difference between threshold room of choice and white glove delivery', 'ai-question', null, 'datasets/white-glove'],
    ['does white glove delivery include assembly', 'ai-question', null, 'white-glove-delivery'],
    ['do white glove movers take the packaging away', 'ai-question', null, 'white-glove-delivery'],
    ['how are high value items protected during delivery valuation', 'ai-question', null, 'datasets/white-glove'],
    ['what is full value protection for a furniture delivery', 'ai-question', null, 'datasets/white-glove'],
    ['white glove delivery how it works appointment window', 'ai-question', null, 'white-glove-delivery'],
    ['how much does white glove delivery cost', 'cost', null, 'white-glove-delivery'],
    ['is white glove delivery worth it for furniture', 'cost', null, 'white-glove-delivery'],
    ['flat rate white glove delivery', 'cost', null, 'white-glove-delivery'],
    ['white glove furniture delivery near me', 'navigational-local', null, 'white-glove-delivery'],
    ['designer furniture receiving and delivery virginia', 'navigational-local', null, 'white-glove-delivery'],
    ['white glove delivery partner for manufacturers', 'navigational-local', null, 'white-glove-delivery'],
    ['final mile delivery partner near me', 'navigational-local', null, 'white-glove-delivery'],
    ['furniture brand delivery service virginia', 'navigational-local', null, 'white-glove-delivery'],
    ['safe delivery and placement service', 'navigational-local', null, 'white-glove-delivery'],
    ['appliance delivery with hookup and haul away', 'navigational-local', null, 'white-glove-delivery'],
    ['delivery service that assembles the furniture', 'navigational-local', null, 'white-glove-delivery'],
    ['receiving and delivery service for interior designers', 'navigational-local', null, 'white-glove-delivery'],
    ['carrier terminal pickup and delivery service', 'navigational-local', null, 'white-glove-delivery'],
    ['white glove delivery for big box retailers', 'navigational-local', null, 'white-glove-delivery'],
    ['last mile delivery company shenandoah valley', 'navigational-local', null, 'white-glove-delivery'],
    ['white glove shipping partner for brands', 'navigational-local', null, 'white-glove-delivery'],
    ['high value furniture delivery service', 'navigational-local', null, 'white-glove-delivery'],
    ['white glove delivery rates for retailers and brands', 'cost', null, 'white-glove-delivery'],
    ['final mile delivery pricing per job', 'cost', null, 'white-glove-delivery'],
    ['appliance haul away cost with delivery', 'cost', null, 'white-glove-delivery'],
    // Demand corridors (Review + Demand-Geography batch, 2026-11-05):
    // Cloudflare top-metro demand signals (24h, 2026-11-05) as buyer
    // questions. Corridor rows record demand, never a local service
    // claim; fulfillment outside the home area rides vetted partners.
    ['white glove delivery Seattle', 'research', null, 'white-glove-delivery'],
    ['white glove delivery San Jose', 'research', null, 'white-glove-delivery'],
    ['white glove delivery Newark NJ', 'research', null, 'white-glove-delivery'],
    ['white glove delivery Denver', 'research', null, 'white-glove-delivery'],
    ['white glove delivery Paris', 'research', null, 'white-glove-delivery'],
    ['white glove delivery Miami', 'research', null, 'white-glove-delivery'],
    ['white glove delivery Dallas', 'research', null, 'white-glove-delivery'],
    ['white glove delivery Los Angeles', 'research', null, 'white-glove-delivery'],
    ['white glove delivery Ashburn VA', 'research', null, 'white-glove-delivery'],
    ['white glove furniture assembly service cost', 'cost', null, 'white-glove-delivery'],
    ['receiving inspection and storage for designers cost', 'cost', null, 'white-glove-delivery'],
    ['flat rate final mile delivery quote', 'cost', null, 'white-glove-delivery'],
    ['what is a receiving inspection report for delivered furniture', 'ai-question', null, 'datasets/white-glove'],
    ['does white glove delivery include appliance hookups', 'ai-question', null, 'datasets/white-glove'],
    ['can you book threshold delivery by itself', 'ai-question', null, 'datasets/white-glove'],
    ['how does carrier terminal pickup work for furniture delivery', 'ai-question', null, 'datasets/white-glove'],
    ['what is three stage photo documentation for delivery', 'ai-question', null, 'datasets/white-glove'],
    ['how long has the flat rate movers been in business', 'ai-question', null, 'white-glove-delivery'],
    ['who delivers high value items for manufacturers and brands', 'ai-question', null, 'white-glove-delivery'],
  ],
  // Head-hubs batch repair (2026-11-02): the combined government +
  // military DEPTH page (military-government-moving) lost every
  // targeting row when both services' hubs repointed to their own
  // pages — it is bound to both services and carries the combined
  // offer, so combined phrasings target it directly and the page
  // keeps full rubric coverage (I-6).
  'service-government': [
    ['military and government moving', 'navigational-local', null, 'military-government-moving'],
  ],
  'service-military': [
    ['government and military moving services', 'navigational-local', null, 'military-government-moving'],
  ],
  // Fragment-binding wave 1 + panel join (Element 2, 2026-11-02):
  // panel prompts Q4/Q5 and the five thinnest services' bound-fragment
  // questions become rubric rows so panel membership is a join, not a
  // hard-coded flag. Panel prompts Q1/Q2/Q3 are NOT here: their targets
  // (/moving-company-winchester-va/, /developer/, /datasets/) are
  // roll-up pages, and a row emitted this early would mark the page
  // targeted and silently displace its 90 R14 roll-up rows (measured
  // 2026-11-02: exactly -3 rows x 30 services). They emit in the
  // PANEL_LATE_ROWS lane after R14 instead — same rows, zero
  // displacement. The doubled-target texts (industrial-commercial,
  // office-moving) emit ONE row each — the dedupe key and the DB
  // UNIQUE(query_text, service_id) admit exactly one; the fragment
  // still publishes on both pages (see the batch record for the target
  // choices and the Q1 target substitution:
  // /moving-services-in-winchester-va/ does not exist on the estate).
  'service-residential': [
    ['What does a residential move with The Flat Rate Movers include, and how is it priced?', 'ai-question', null, 'residential-moving'],
  ],
  'service-gun-safe': [
    ['Who should I call to move a 2,000 lb gun safe in northern Virginia?', 'ai-question', null, 'gun-safe-movers'],
    // The panel's Q4 prompt VERBATIM (fragment-binding Defect 5,
    // 2026-11-02): the design's panel join is normalized-text equality
    // with the prompt as asked, and the prompt as asked is the
    // first-person form — so the verbatim prompt is its own rubric row
    // beside the answer-shaped question above (which is the one that
    // binds exactly to the bound fragment). Both rows are real: the
    // verbatim row carries panel membership; the question-form row
    // carries the exact binding.
    ['I need to move a 2,000 lb gun safe in northern Virginia. Who should I call, and why?', 'ai-question', null, 'gun-safe-movers'],
    // VC-1 vault-door case-study family (2026-11-03): the Manassas
    // freight-recovery job story + its dataset landing, Winchester scope.
    ['vault door delivery northern Virginia', 'navigational-local', 'scope-winchester', '1475-lb-vault-door-freight-recovery-manassas-va'],
    ['vault door delivery Manassas VA', 'navigational-local', 'scope-winchester', '1475-lb-vault-door-freight-recovery-manassas-va'],
    ['vault door movers Manassas Virginia', 'navigational-local', 'scope-winchester', '1475-lb-vault-door-freight-recovery-manassas-va'],
    ['vault door freight recovery', 'navigational-local', 'scope-winchester', '1475-lb-vault-door-freight-recovery-manassas-va'],
    ['freight terminal will-call pickup vault door', 'navigational-local', 'scope-winchester', '1475-lb-vault-door-freight-recovery-manassas-va'],
    ['who can pick up a vault door from a freight terminal', 'ai-question', 'scope-winchester', '1475-lb-vault-door-freight-recovery-manassas-va'],
    ['vault door final mile delivery Virginia', 'navigational-local', 'scope-winchester', '1475-lb-vault-door-freight-recovery-manassas-va'],
    ['white-glove vault door delivery', 'navigational-local', 'scope-winchester', '1475-lb-vault-door-freight-recovery-manassas-va'],
    ['white glove vault door placement Virginia', 'navigational-local', 'scope-winchester', '1475-lb-vault-door-freight-recovery-manassas-va'],
    ['project-managed vault door delivery', 'navigational-local', 'scope-winchester', '1475-lb-vault-door-freight-recovery-manassas-va'],
    ['heavy vault door movers northern Virginia', 'navigational-local', 'scope-winchester', '1475-lb-vault-door-freight-recovery-manassas-va'],
    ['how does a vault door ship by freight', 'ai-question', null, '1475-lb-vault-door-freight-recovery-manassas-va'],
    ['vault door freight recovery case study', 'navigational-local', 'scope-winchester', 'datasets/vault-door-case-study'],
    ['vault door shipping weight freight class', 'ai-question', null, 'datasets/vault-door-case-study'],
  ],
  'service-sir-heavy': [
    ['What is the SIR protocol, and which company uses it?', 'ai-question', null, 'heavy'],
  ],
  'service-industrial-commercial': [
    ['What does the Industrial & Commercial service provide, and how is it priced?', 'ai-question', null, 'industrial-commercial-services'],
      // Ports P3 Norfolk + Richmond families (2026-11-03)
    ['warehouse labor Hampton Roads Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
  ],
  'service-industrial-offices': [
    ['What is an industrial offices move?', 'ai-question', null, 'industrial-offices-moving'],
  ],
  'service-commercial': [
    ['What does a commercial move with The Flat Rate Movers include?', 'ai-question', null, 'commercial-moving'],
    ['commercial movers winchester va', 'navigational-local', null, 'commercial-moving'],
    ['office relocation company martinsburg wv', 'navigational-local', null, 'commercial-moving'],
    ['business moving services near me', 'navigational-local', null, 'commercial-moving'],
    ['weekend office movers virginia', 'navigational-local', null, 'commercial-moving'],
    ['after hours commercial moving company', 'navigational-local', null, 'commercial-moving'],
    ['corporate relocation movers shenandoah valley', 'navigational-local', null, 'commercial-moving'],
    ['warehouse office combined move virginia', 'navigational-local', null, 'commercial-moving'],
    ['commercial movers that provide coi', 'navigational-local', null, 'commercial-moving'],
    ['office move project management virginia', 'navigational-local', null, 'commercial-moving'],
    ['phased office relocation services', 'navigational-local', null, 'commercial-moving'],
    ['lease end office decommission moving', 'navigational-local', null, 'commercial-moving'],
    ['retail store movers winchester va', 'navigational-local', null, 'commercial-moving'],
    ['how much does it cost to move an office', 'cost', null, 'commercial-moving'],
    ['commercial moving cost per square foot', 'cost', null, 'commercial-moving'],
    ['office relocation budget estimate', 'cost', null, 'commercial-moving'],
    ['flat rate commercial moving quote', 'cost', null, 'commercial-moving'],
    ['cost of downtime during an office move', 'cost', null, 'commercial-moving'],
    ['office movers quote winchester va', 'cost', null, 'commercial-moving'],
    ['what is a certificate of insurance for an office move', 'ai-question', null, 'datasets/commercial'],
    ['how far in advance should you plan an office move', 'ai-question', null, 'datasets/commercial'],
    ['what do commercial movers need from building management', 'ai-question', null, 'datasets/commercial'],
    ['how are office moving estimates calculated man hours', 'ai-question', null, 'datasets/commercial'],
    ['office move checklist for facility managers', 'ai-question', null, 'commercial-moving'],
    ['how to dispose of old office electronics during a move', 'ai-question', null, 'datasets/commercial'],
    ['difference between commercial and residential moving', 'ai-question', null, 'datasets/commercial'],
  ],
  'service-office-moving': [
    ['What does Office Moving include?', 'ai-question', null, 'office-moving-movers-martinsburg-wv'],
    ['office movers winchester va', 'navigational-local', null, 'office-moving'],
    ['office moving company martinsburg wv', 'navigational-local', null, 'office-moving'],
    ['small office movers near me', 'navigational-local', null, 'office-moving'],
    ['cubicle disassembly and reassembly service', 'navigational-local', null, 'office-moving'],
    ['weekend office moving company virginia', 'navigational-local', null, 'office-moving'],
    ['office movers that work after hours', 'navigational-local', null, 'office-moving'],
    ['workstation moving services', 'navigational-local', null, 'office-moving'],
    ['office furniture movers winchester', 'navigational-local', null, 'office-moving'],
    ['law firm office movers virginia', 'navigational-local', null, 'office-moving'],
    ['office restack and reconfiguration movers', 'navigational-local', null, 'office-moving'],
    ['single floor office relocation', 'navigational-local', null, 'office-moving'],
    ['office move within the same building', 'navigational-local', null, 'office-moving'],
    ['how much do office movers cost', 'cost', null, 'office-moving'],
    ['office moving cost per employee', 'cost', null, 'office-moving'],
    ['cubicle moving cost per workstation', 'cost', null, 'office-moving'],
    ['flat rate office moving quote', 'cost', null, 'office-moving'],
    ['weekend office move cost', 'cost', null, 'office-moving'],
    ['office movers price winchester va', 'cost', null, 'office-moving'],
    ['how long does it take to disassemble a cubicle', 'ai-question', null, 'datasets/office'],
    ['how are cubicle systems wired power whip', 'ai-question', null, 'datasets/office'],
    ['how do movers label workstations for an office move', 'ai-question', null, 'datasets/office'],
    ['office move timeline how to plan', 'ai-question', null, 'office-moving'],
    ['what order do you disassemble office cubicles', 'ai-question', null, 'datasets/office'],
    ['do office movers reassemble furniture at the new office', 'ai-question', null, 'datasets/office'],
    ['how to move an office over a weekend', 'ai-question', null, 'office-moving'],
  ],
  // B1 deepening (2026-11-05, RESEARCH-B1 Part 3): situation, cost
  // and research phrasings for the local & regional family, paired with
  // the new Virginia/WV/federal Layer-2 entries in the pool.
  'service-local-regional': [
    ['movers to move furniture within the same house', 'navigational-local', null, 'local-regional-moving'],
    ['apartment movers with stairs winchester va', 'navigational-local', null, 'local-regional-movers-winchester-va'],
    ['townhouse movers martinsburg wv', 'navigational-local', null, 'local-regional-movers-martinsburg-wv'],
    ['same day local movers winchester va', 'navigational-local', null, 'local-regional-movers-winchester-va'],
    ['movers after a house closing', 'navigational-local', null, 'local-regional-moving'],
    ['local movers for seniors downsizing martinsburg wv', 'navigational-local', null, 'local-regional-movers-martinsburg-wv'],
    ['movers from winchester va to martinsburg wv', 'navigational-local', null, 'local-regional-moving'],
    ['movers winchester va to stephens city and strasburg', 'navigational-local', null, 'local-regional-movers-winchester-va'],
    ['movers martinsburg wv to inwood and charles town', 'navigational-local', null, 'local-regional-movers-martinsburg-wv'],
    ['storage unit cleanout movers near me', 'navigational-local', null, 'local-regional-moving'],
    ['movers for one heavy item across town', 'navigational-local', null, 'local-regional-moving'],
    ['weekend local movers eastern panhandle', 'navigational-local', null, 'local-regional-movers-martinsburg-wv'],
    ['how much do local movers cost in winchester va', 'cost', null, 'local-regional-movers-winchester-va'],
    ['cost to move a three bedroom house locally in west virginia', 'cost', null, 'local-regional-movers-martinsburg-wv'],
    ['flat rate local movers winchester va', 'cost', null, 'local-regional-movers-winchester-va'],
    ['local movers hourly vs flat rate virginia', 'cost', null, 'local-regional-moving'],
    ['how much does it cost to move a one bedroom apartment locally', 'cost', null, 'local-regional-moving'],
    ['movers that charge a flat rate instead of hourly', 'cost', null, 'local-regional-moving'],
    ['are local movers licensed in virginia', 'ai-question', null, 'local-regional-moving'],
    ['how to verify a virginia movers certificate of fitness', 'ai-question', null, 'local-regional-moving'],
    ['is a flat rate moving estimate binding in virginia', 'ai-question', null, 'local-regional-moving'],
    ['do i need a bill of lading for a local move', 'ai-question', null, 'local-regional-moving'],
    ['how many movers do i need for a two bedroom apartment', 'ai-question', null, 'local-regional-moving'],
    ['how long does a local move take', 'ai-question', null, 'local-regional-moving'],
    ['what size moving truck do i need for a local move', 'ai-question', null, 'local-regional-moving'],
  ],
  // Premiere upgrade (2026-11-05): the Winchester transloading family
  // had NO EXTRA_PATTERNS — its 25 researched buyer-intent terms
  // (situation / cost / research) now carry explicit bound rows,
  // paired with the new Layer-2 entries in the pool.
  'service-transloading-winchester-va': [
    ['transloading services winchester va', 'navigational-local', null, 'transloading-winchester-va'],
    ['container unloading winchester va', 'navigational-local', null, 'transloading-winchester-va'],
    ['transloading near virginia inland port', 'navigational-local', null, 'virginia-inland-port-transloading'],
    ['cross docking front royal va', 'navigational-local', null, 'transloading-winchester-va'],
    ['container devanning services virginia', 'navigational-local', null, 'transloading-winchester-va'],
    ['ocean container to truck transloading shenandoah valley', 'navigational-local', null, 'transloading'],
    ['container unloading labor winchester va', 'navigational-local', null, 'transloading-winchester-va'],
    ['inland port container services front royal', 'navigational-local', null, 'virginia-inland-port-transloading'],
    ['palletizing and restacking services winchester', 'navigational-local', null, 'transloading-winchester-va'],
    ['53 foot container transload to 53 foot trailer', 'navigational-local', null, 'transloading'],
    ['freight rework winchester va', 'navigational-local', null, 'transloading-winchester-va'],
    ['floor loaded container unloading service', 'navigational-local', null, 'transloading-winchester-va'],
    ['how much does transloading cost per container', 'cost', null, 'transloading-winchester-va'],
    ['container unloading cost per container virginia', 'cost', null, 'transloading-winchester-va'],
    ['cross docking rates near me', 'cost', null, 'transloading-winchester-va'],
    ['transloading quote winchester va', 'cost', null, 'transloading-winchester-va'],
    ['devanning cost per container', 'cost', null, 'transloading'],
    ['per job transloading pricing virginia', 'cost', null, 'transloading-winchester-va'],
    ['what is the difference between transloading and intermodal', 'ai-question', null, 'datasets/transloading-winchester'],
    ['transloading vs cross docking what is the difference', 'ai-question', null, 'datasets/transloading-winchester'],
    ['what is the virginia inland port', 'ai-question', null, 'datasets/transloading-winchester'],
    ['how does freight move from norfolk to front royal virginia', 'ai-question', null, 'datasets/transloading-winchester'],
    ['what is devanning a container', 'ai-question', null, 'transloading'],
    ['how long does cross docking take', 'ai-question', null, 'datasets/transloading-winchester'],
    ['virginia inland port ftz 20 site 7 what it means', 'ai-question', null, 'virginia-inland-port-transloading'],
  ],
};

// Fragment-binding wave 1, late lane (Element 2, 2026-11-02): panel
// prompts Q1/Q2/Q3. Emitted AFTER the R14 roll-up (see the emission
// site) so the roll-up pages they target keep their service-grouped
// rows; the panel rows then add the panel question itself on top.
// Service assignment for the ROLLUP_ALL targets (30-way ties in the
// brief's majority rule) is recorded in the batch record: Q1 ->
// service-local-regional (Winchester-local question; the branch page
// groups every service at the branch); Q2/Q3 -> service-residential
// (deterministic tie-break: the registry's lead service; the developer
// and datasets surfaces are estate-level, owned by no single service).
const PANEL_LATE_ROWS = [
  ['service-local-regional', 'Main services of The Flat Rate Movers in Winchester, Virginia?', 'moving-company-winchester-va'],
  ['service-residential', 'GitHub presence — what do they publish there?', 'developer'],
  ['service-residential', 'What machine-readable data, datasets, or APIs does The Flat Rate Movers publish for AI systems?', 'datasets'],
];

// Launch batch late rows (2026-11-03): the Spec C announcement story
// (flat-rate-movers-dataset-estate-citable-doi) is an estate-level
// news surface owned by no single service; it joins the rubric
// through this late lane with the questions its own FAQ answers,
// seated under service-residential — the recorded tie-break for
// estate-level data questions (see PANEL_LATE_ROWS). Emitted with
// the panel rows, after R14, through the same R10 gates.
const NEWS_LATE_ROWS = [
  ['service-residential', 'Does The Flat Rate Movers publish its datasets with a DOI?', 'flat-rate-movers-dataset-estate-citable-doi'],
  ['service-residential', 'How can I verify that The Flat Rate Movers published data is really theirs?', 'flat-rate-movers-dataset-estate-citable-doi'],
  ['service-residential', 'Is The Flat Rate Movers listed on Wikidata and OpenStreetMap?', 'flat-rate-movers-dataset-estate-citable-doi'],
];

// Question bank category -> service (category 9 splits per question).
const QB_MAP = {
  1: 'service-piano-antique',
  2: 'service-ispm15',
  3: 'service-crating',
  4: 'service-final-mile',
  5: 'service-industrial-offices',
  6: 'service-government',
  7: 'service-military',
  8: 'service-route81',
  10: 'service-packing',
};
const QB9 = { // question number -> service, within category 9
  1: 'service-transloading', 2: 'service-transloading', 3: 'service-transloading',
  4: 'service-transloading', 5: 'service-transloading', 6: 'service-industrial-commercial',
  7: 'service-industrial-commercial', 8: 'service-transloading',
  9: 'service-industrial-commercial', 10: 'service-transloading',
};
const CORRIDOR_SHORT = { 'i-81': 'I-81', 'i-66': 'I-66', 'i-70': 'I-70' };
const CLASS_ORDER = ['navigational-local', 'cost', 'how-process', 'best-choice', 'ai-question'];

// R14 ESTATE ROLL-UP configuration (v2 deploy, 2026-10-31 — the
// certificate-fix completion bar: EVERY registry page must be a rubric
// target). Pages that carry no service of their own still group
// services: a category page groups the services of the pages under it
// (derived from the registry at run time, no table needed); a branch
// location page groups every service at its branch; the pages below
// group either the whole estate (ROLLUP_ALL — indexes, hubs, the
// quote/guarantee surfaces, the knowledge and developer surfaces that
// describe the whole estate) or a named subject set (ROLLUP_SETS,
// taken from each page's own published description of what it
// collects). Grouping is validated against the registries at run
// time; a page matched by no rule and targeted by no row is reported
// by slug in the run summary — never silently skipped. News Formula
// batch (2026-11-02): author/henry-pitts-jr joins ROLLUP_ALL — the
// byline's author page is an estate-level knowledge surface of the
// same class as the archive author page it sits beside.
const ROLLUP_SETS = {
  // "freight, transloading, data and corridor logistics ... I-81, I-66,
  // I-70 network" (the page's own head description).
  'category/logistics': ['service-transloading', 'service-final-mile', 'service-industrial-commercial', 'service-warehouse-relocation', 'service-long-distance', 'service-route81', 'service-logistics-project-management', 'service-3pl-support'],
  // Ports P4 (2026-11-03): the program hub collects the 8 matrix
  // columns, which resolve to these 5 registry ids.
  'port-logistics': ['service-transloading', 'service-freight-rework-transloading', 'service-industrial-commercial', 'service-logistics-project-management', 'service-3pl-support'],
  // "Valley freight, warehousing, transloading and moving logistics
  // run from Winchester on I-81" (the page's own head description).
  'category/shenandoah-valley-logistics': ['service-transloading', 'service-transloading-winchester-va', 'service-warehouse-relocation', 'service-industrial-commercial', 'service-local-regional'],
  // The videos the page/dataset publish: household moving, heavy gun
  // safe moves, a final-mile white-glove installation (the page's own
  // head description + the dataset's VideoObject subjects).
  'videos': ['service-residential', 'service-gun-safe', 'service-sir-heavy', 'service-final-mile', 'service-commercial', 'service-transloading'],
  'datasets/videos': ['service-residential', 'service-gun-safe', 'service-sir-heavy', 'service-final-mile', 'service-commercial', 'service-transloading'],
};
const ROLLUP_ALL = new Set([
  'home', 'services', 'all-pages', 'sitemap', 'blog', 'datasets',
  'datasets/intent-coverage', 'datasets/search-index', 'datasets/answer-evidence', 'datasets/local-graph-registry', 'datasets/crawl-presence', 'datasets/archive-registry', 'datasets/quote-tool', 'datasets/page-data-pool', 'datasets/catalog-registry', 'faq', 'moving-questions-answers', // +'datasets/catalog-registry' 2026-11-03 (Catalog Registry batch): the catalog landing carries the full 32-service roll-up, like the other registry landings
  'quote', 'quote-tool', 'online-estimate', 'flat-rate-moving-quote-winchester', // +'quote-tool' +'datasets/quote-tool' 2026-11-03 (Quote Tool batch): the estate-level guide + its dataset landing carry the full 30-service roll-up, like 'quote' and 'faq' // +'datasets/page-data-pool' 2026-11-03 (Page Data Pool batch): the pool landing carries the full 30-service roll-up on the same pattern
  'flat-rate-guarantee', 'areas-served', 'service-areas-moving-company',
  'find-us', 'moving-cost-guide-winchester-va', 'developer', 'entities',
  'entity-authority-layer', 'knowledge-entities', 'knowledge-equipment',
  'knowledge-events', 'knowledge-locations', 'knowledge-services',
  'logistics-data-engineering-center', 'recursive-indexing-layer',
  'the-flat-rate-logistics-data-hub', 'ai-license', 'docs',
  'docs/logistics-event-protocol', 'docs/logistics-ontology',
  'author/ratemoversgmail-com', 'author/henry-pitts-jr', 'privacy-policy',
]);

// --- Registry loading + validation ---
function loadData(rel) {
  return JSON.parse(fs.readFileSync(path.join(DATA_ROOT, path.basename(rel)), 'utf8'));
}
function loadAll() {
  const services = loadData('data/services.json');
  const pages = loadData('data/pages.json');
  const locations = loadData('data/locations.json');
  const corridors = loadData('data/corridors.json');
  const geo = loadData('data/service-area.geojson');
  const best = loadData('data/best-json-entity-graph.json');
  const index = JSON.parse(fs.readFileSync(path.join(PUB, 'ai-master-index.json'), 'utf8'));
  return { services, pages, locations, corridors, geo, best, index };
}

function validateConfig(R) {
  const svcIds = new Set(R.services.services.map((s) => s.id));
  const pageBySlug = new Map(R.pages.pages.map((p) => [p.slug, p]));
  const svcPages = new Map();
  for (const p of R.pages.pages) for (const s of p.services || []) {
    if (!svcPages.has(s)) svcPages.set(s, []);
    svcPages.get(s).push(p.slug);
  }
  for (const id of svcIds) {
    if (!HUB[id]) fail('no HUB configured for ' + id);
    if (!pageBySlug.has(HUB[id])) fail('hub slug not in pages.json: ' + id + ' -> ' + HUB[id]);
    if (!(svcPages.get(id) || []).includes(HUB[id])) fail('hub slug not in the page set of ' + id + ': ' + HUB[id]);
    if (!PHRASE[id]) fail('no PHRASE configured for ' + id);
    if (!DATASETS[id] || !DATASETS[id].length) fail('no DATASETS configured for ' + id);
    for (const f of DATASETS[id]) {
      if (!fs.existsSync(path.join(PUB, f))) fail('dataset file missing in public/: ' + f);
    }
    const inGeo = Object.values(GEO_MAP).includes(id);
    if (!inGeo && !BASE_ONLY[id]) fail('service has neither a GeoJSON mapping nor a BASE_ONLY rule: ' + id);
    if (inGeo && BASE_ONLY[id]) fail('service has both a GeoJSON mapping and a BASE_ONLY rule: ' + id);
  }
  for (const id of Object.keys(HUB)) if (!svcIds.has(id)) fail('HUB configured for unknown service ' + id);
  return { svcIds, pageBySlug, svcPages };
}

// Branch page per service (generator configuration, validated against
// the service's pages.json page set): the dedicated branch service
// pages built in the estate's branch expansion. Null where the estate
// has no dedicated branch page for the service — scoped rows then
// target the hub, never an article or guide that merely names the city.
const BRANCH = {
  'service-residential': [null, null],
  'service-commercial': ['commercial-movers-winchester-va', null],
  'service-local-regional': ['local-regional-movers-winchester-va', 'local-regional-movers-martinsburg-wv'],
  'service-long-distance': ['long-distance-movers-winchester-va', 'long-distance-movers-martinsburg-wv'],
  'service-packing': ['packing-services-winchester-va', 'packing-movers-martinsburg-wv'],
  'service-sir-heavy': ['industrial-rigging-high-mass-logistics-hub-winchester-va', 'sir-heavy-movers-martinsburg-wv'],
  'service-gun-safe': ['gun-safe-movers-winchester-va', 'gun-safe-movers-martinsburg-wv'],
  'service-piano-antique': [null, 'piano-antique-movers-martinsburg-wv'],
  'service-ispm15': ['international-export-packing-crating-winchester-va', 'ispm15-movers-martinsburg-wv'],
  'service-crating': ['international-export-packing-crating-winchester-va', 'crating-movers-martinsburg-wv'],
  'service-transloading': ['transloading-winchester-va', 'transloading-movers-martinsburg-wv'],
  'service-final-mile': ['white-glove-delivery-winchester-va', 'final-mile-movers-martinsburg-wv'],
  'service-white-glove': ['white-glove-delivery-winchester-va', null],
  'service-office-moving': ['office-moving-movers-winchester-va', 'office-moving-movers-martinsburg-wv'],
  'service-industrial-offices': ['industrial-offices-movers-winchester-va', 'industrial-offices-movers-martinsburg-wv'],
  'service-government': ['government-movers-winchester-va', 'government-movers-martinsburg-wv'],
  'service-military': ['military-movers-winchester-va', 'military-movers-martinsburg-wv'],
  'service-route81': [null, null],
  'service-industrial-commercial': ['industrial-commercial-movers-winchester-va', 'industrial-commercial-movers-martinsburg-wv'],
  'service-senior-moving': [null, null],
  'service-warehouse-relocation': [null, null],
  'service-it-relocation': [null, null],
  'service-transloading-winchester-va': [null, null],
  'service-moving-and-storage': [null, null],
  'service-junk-removal': [null, null],
  'service-freight-rework-transloading': [null, null],
  'service-warehouse-racking-relocation': [null, null],
  'service-ffe-logistics': [null, null],
  'service-data-center-relocation': [null, null],
  'service-medical-lab-relocation': [null, null],
  // Vault door (2026-11-04): hub-only at V1; the branch spokes
  // (/vault-door-movers-winchester-va/, /vault-door-movers-martinsburg-wv/)
  // are V3 pages — the pair fills in when they land.
  'service-vault-door': [null, null],
  // Hoarding cleanup (2026-11-05): branch pages ship WITH the hub at V1
  // (/hoarding-cleanup-winchester-va/, /hoarding-cleanup-martinsburg-wv/).
  'service-hoarding-cleanup': ['hoarding-cleanup-winchester-va', 'hoarding-cleanup-martinsburg-wv'],
  'service-logistics-project-management': [null, null],
  'service-3pl-support': [null, null],
};
function branchPage(R, V, serviceId, branch) {
  const pair = BRANCH[serviceId];
  if (!pair) fail('no BRANCH configured for ' + serviceId);
  const slug = branch === 'winchester' ? pair[0] : pair[1];
  if (slug && !(V.svcPages.get(serviceId) || []).includes(slug)) {
    fail('branch page not in the page set of ' + serviceId + ': ' + slug);
  }
  return slug;
}

// Graph Service node for a service: the canonical root-fragment @id
// (#service-*) when the best graph carries it, else a Service node on
// the service's hub page, else a Service node carrying the service's
// exact registry name (first in sorted @id order). Null when none.
function graphNode(R, service) {
  const nodes = (R.best['@graph'] || []).filter((n) =>
    n['@type'] === 'Service' || (Array.isArray(n['@type']) && n['@type'].includes('Service')));
  const rootId = SITE + '/#' + service.id;
  if (nodes.some((n) => n['@id'] === rootId)) return rootId;
  const hubId = R.pages.pages.find((p) => p.slug === HUB[service.id]).url + '#service';
  if (nodes.some((n) => n['@id'] === hubId)) return hubId;
  const byName = nodes.filter((n) => n.name === service.name).map((n) => n['@id']).sort();
  return byName.length ? byName[0] : null;
}

function jsonFileFor(slug) { return slug.replace(/\//g, '-') + '.json'; }

// Per-page JSON resolution (v2 deploy, 2026-10-31). The slug-derived
// filename is the estate's convention, but five pages were published
// under short names in the Batch 3 transloading build and are still
// served under those names (the estate's own llms.txt publishes the
// same mapping: category/freight-services -> freight-services.json,
// category/port-logistics -> port-logistics.json,
// docs/container-deconsolidation -> container-deconsolidation.json,
// the Winchester museum-logistics index -> category-museum-logistics.json,
// its logistics-transportation child -> logistics-transportation.json).
// Resolution: the slug-derived file when it exists; else the unique
// root JSON whose own WebPage node names the page's canonical URL —
// the file's own declaration is the proof. The R10 gates (file
// present, distribution in the signed index, digest computed over
// the file's bytes) apply unchanged to whichever file resolves; a page whose
// JSON cannot be resolved uniquely still fails the gate honestly.
// Resolution order (corrected 2026-10-31, v2 deploy): a UNIQUE
// WebPage-@id match wins over the slug-derived filename. The derived
// name can collide with a different published file — the intent
// landing page's derived name is datasets-intent-coverage.json, the
// dataset file itself, while its per-page JSON is
// dataset-intent-coverage.json (which declares the page's @id). The
// file's own declaration outranks the filename guess in both
// directions.
let _jsonResolutionCache = null;
function resolveJsonFile(page) {
  const derived = jsonFileFor(page.slug);
  if (!_jsonResolutionCache) {
    _jsonResolutionCache = new Map();
    for (const f of fs.readdirSync(PUB)) {
      if (!f.endsWith('.json') || f.startsWith('datasets-') || f === 'ai-master-index.json') continue;
      let doc;
      try { doc = JSON.parse(fs.readFileSync(path.join(PUB, f), 'utf8')); } catch (e) { continue; }
      const nodes = (doc && doc['@graph']) || [doc];
      for (const n of nodes) {
        if (n && n['@type'] === 'WebPage' && typeof n['@id'] === 'string') {
          if (!_jsonResolutionCache.has(n['@id'])) _jsonResolutionCache.set(n['@id'], []);
          _jsonResolutionCache.get(n['@id']).push(f);
        }
      }
    }
  }
  const hits = _jsonResolutionCache.get(page.url) || [];
  if (hits.length === 1) return hits[0];
  if (fs.existsSync(path.join(PUB, derived))) return derived;
  return derived;
}

function americanize(q) {
  return q.replace(/\bkerbside\b/gi, 'curbside').replace(/\bkerb\b/gi, 'curb')
    .replace(/\blabelled\b/gi, 'labeled').replace(/\blabelling\b/gi, 'labeling')
    .replace(/\bspecialised\b/gi, 'specialized').replace(/\bcentre\b/gi, 'center')
    .replace(/\s+/g, ' ').trim();
}
function slugifyQuestion(q) {
  return q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Question bank parsing: sections "## N. Title", then a "Questions:"
// run of "1) ... 2) ..." items ending at the next paragraph break.
function parseQuestionBank() {
  const text = fs.readFileSync(QB_PATH, 'utf8');
  const out = []; // {category, n, text}
  const sections = text.split(/^## /m).slice(1);
  for (const sec of sections) {
    const m = sec.match(/^(\d+)\.\s/);
    if (!m) continue;
    const category = parseInt(m[1], 10);
    const qi = sec.indexOf('Questions:');
    if (qi < 0) continue;
    let run = sec.slice(qi + 'Questions:'.length);
    const cut = run.search(/\n\s*\n|\nAnswer angle:|\nCompany actions|\n\[CONFIRM\]|\nSources/);
    if (cut >= 0) run = run.slice(0, cut);
    const parts = run.split(/\s(\d+)\)\s/).slice(1);
    let expect = 1;
    for (let i = 0; i < parts.length; i += 2) {
      const n = parseInt(parts[i], 10);
      if (n !== expect) break; // stop at the first non-sequential number
      const qtext = americanize(parts[i + 1] || '');
      if (qtext) out.push({ category, n, text: qtext });
      expect++;
    }
  }
  return out;
}

// --- v2: observed queries + outcome state ---
// Matching normalization for the GSC feed-in: case, punctuation and
// whitespace differences in real query strings must still enrich the
// generated row they belong to ("best office movers in Winchester VA"
// enriches "best office movers in Winchester, VA").
function normMatch(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9\s&+]/g, ' ').replace(/\s+/g, ' ').trim();
}
const OUTCOME_GATES = ['crawled', 'indexed', 'understood', 'corroborated', 'cited_maintained'];
const OUTCOME_GATE_LABEL = { crawled: 'crawled', indexed: 'indexed', understood: 'understood', corroborated: 'corroborated', cited_maintained: 'cited-maintained' };
function defaultOutcome() {
  const o = { highest_gate_passed: 'none', outcome_status: 'unknown', outcome_basis: 'no evidence recorded yet', updated_at: RUBRIC_DATE };
  for (const g of OUTCOME_GATES) { o[g + '_state'] = 'unknown'; o[g + '_checked_at'] = null; o[g + '_evidence_source'] = null; }
  return o;
}
function sqliteJson(sql) {
  try {
    // maxBuffer raised for v2: the 1,651-row intent_query JSON exceeds
    // the 1 MB execFileSync default (the v1.3.2 row set sat just under
    // it; the v2 dry run's --check hit ENOBUFS without this).
    const out = execFileSync('sqlite3', ['-json', DB_PATH, sql], { maxBuffer: 64 * 1024 * 1024 }).toString();
    return JSON.parse(out || '[]');
  } catch (e) { return null; }
}
function loadObservedQueries() {
  if (!fs.existsSync(DB_PATH)) return [];
  const rows = sqliteJson('SELECT id, query_text_raw, query_text_normalized, linked_page_url, link_method, clicks, impressions, ctr, avg_position, window_start, window_end FROM gsc_observed_queries ORDER BY id;');
  return rows || [];
}
// Era derivation (2026-11-02, Ports batch P2): an import batch's era
// derives from its window against the 2026-10-29 estate rebuild
// cutover — a window ending on or before 2026-10-28 is 'pre-rebuild';
// a window starting on or after 2026-10-29 is 'current'; a window
// straddling the cutover is 'transition'. (Before P2 every attachment
// was stamped 'pre-rebuild' regardless of its window.)
const ERA_CUTOVER = '2026-10-29';
function eraForWindow(windowStart, windowEnd) {
  if (windowEnd && windowEnd < ERA_CUTOVER) return 'pre-rebuild';
  if (windowStart && windowStart >= ERA_CUTOVER) return 'current';
  return 'transition';
}

function loadObservedPages() {
  if (!fs.existsSync(DB_PATH)) return [];
  const rows = sqliteJson('SELECT id, page_url, clicks, impressions, ctr, avg_position, window_start, window_end FROM gsc_observed_pages ORDER BY id;');
  return rows || [];
}
function loadPriorOutcomes() {
  const map = new Map();
  if (!fs.existsSync(DB_PATH)) return map;
  const rows = sqliteJson('SELECT * FROM intent_row_outcome;');
  if (!rows) return map;
  for (const r of rows) map.set(r.query_text + '|' + r.service_id, r);
  return map;
}
// The outcome evidence log is append-only and written only by the
// evidence-ingest tooling (scripts/ingest-outcome-evidence.py); the
// generator never writes it. Its count is carried into intent_meta at
// every build so verify.js I-8 can prove the log never shrinks
// between the recorded build and the live table.
function loadEvidenceLogCount() {
  if (!fs.existsSync(DB_PATH)) return 0;
  const rows = sqliteJson('SELECT COUNT(*) AS n FROM intent_outcome_evidence;');
  return rows && rows[0] ? rows[0].n : 0;
}
function outcomeRollup(rows) {
  const byHighestGate = { none: 0, crawled: 0, indexed: 0, understood: 0, corroborated: 0, 'cited-maintained': 0 };
  const byStatus = { unknown: 0, 'awaiting-observation': 0, partial: 0, blocked: 0, complete: 0 };
  const byGateState = {};
  for (const g of OUTCOME_GATES) byGateState[OUTCOME_GATE_LABEL[g]] = { unknown: 0, passed: 0, failed: 0, 'not-applicable': 0 };
  for (const r of rows) {
    const o = r.outcome || defaultOutcome();
    byHighestGate[o.highest_gate_passed] = (byHighestGate[o.highest_gate_passed] || 0) + 1;
    byStatus[o.outcome_status] = (byStatus[o.outcome_status] || 0) + 1;
    for (const g of OUTCOME_GATES) {
      const st = o[g + '_state'] || 'unknown';
      byGateState[OUTCOME_GATE_LABEL[g]][st] = (byGateState[OUTCOME_GATE_LABEL[g]][st] || 0) + 1;
    }
  }
  return { rows: rows.length, byHighestGate, byStatus, byGateState };
}

// --- Row generation ---
function generate() {
  const R = loadAll();
  const V = validateConfig(R);
  const distByUrl = new Map((R.index.distribution || []).map((d) => [d.contentUrl, d]));
  const features = R.geo.features || [];
  const placeFeatures = features.filter((f) => ['branch', 'city', 'county'].includes(f.properties.type));

  // Footprint per service (R1).
  const footprint = new Map(); // serviceId -> [feature]
  for (const s of R.services.services) {
    const caps = Object.keys(GEO_MAP).filter((g) => GEO_MAP[g] === s.id);
    if (caps.length) {
      footprint.set(s.id, placeFeatures.filter((f) => (f.properties.services || []).some((c) => caps.includes(c))));
    } else {
      const base = BASE_ONLY[s.id];
      footprint.set(s.id, placeFeatures.filter((f) =>
        f.properties.type === 'branch' && (base === 'both' || f.properties.branch === base)));
    }
  }
  // Corridor applicability (R4): capability slugs named on corridor
  // features, mapped to services, plus the three named services.
  const corridorCaps = new Set();
  for (const f of features.filter((x) => x.properties.type === 'corridor')) {
    for (const c of f.properties.services || []) corridorCaps.add(c);
  }
  const corridorServices = new Set([...corridorCaps].map((c) => GEO_MAP[c]).filter(Boolean));
  corridorServices.add('service-route81');
  corridorServices.add('service-long-distance');
  corridorServices.add('service-local-regional');

  const rows = [];
  const excluded = [];
  const seen = new Set();
  const svcById = new Map(R.services.services.map((s) => [s.id, s]));

  function emit(serviceId, intentClass, queryText, area, targetSlug, pattern, opts) {
    opts = opts || {};
    const svc = svcById.get(serviceId);
    const key = serviceId + '|' + queryText;
    if (seen.has(key)) { excluded.push({ reason: 'duplicate', serviceId, queryText, pattern }); return false; }
    const page = V.pageBySlug.get(targetSlug);
    if (!page) { excluded.push({ reason: 'target-not-in-pages.json', serviceId, queryText, pattern }); return false; }
    const jf = resolveJsonFile(page);
    if (!fs.existsSync(path.join(PUB, jf))) { excluded.push({ reason: 'per-page-json-missing', serviceId, queryText, pattern }); return false; }
    const targetJsonUrl = SITE + '/' + jf;
    const tjEntry = distByUrl.get(targetJsonUrl);
    if (!tjEntry || !tjEntry.digest) { excluded.push({ reason: 'target-json-not-in-signed-index', serviceId, queryText, pattern }); return false; }
    // S2 (2026-11-01): cert digest VALUES are computed from the target
    // files' own bytes (pubFileDigest), not copied from the installed
    // index. Membership in the signed index stays a gate (above); the
    // values are the digests the index seals over these exact bytes,
    // so a re-seal is correct in a single pass — the old copy-from-
    // index read made every re-seal iterate to a fixpoint.
    const tjDigest = pubFileDigest(targetJsonUrl);
    if (!tjDigest) { excluded.push({ reason: 'target-json-digest-unreadable', serviceId, queryText, pattern }); return false; }
    const dsDigests = {};
    for (const f of DATASETS[serviceId]) {
      const e = distByUrl.get(SITE + '/' + f);
      if (!e || !e.digest) { excluded.push({ reason: 'dataset-not-in-signed-index', serviceId, queryText, pattern, file: f }); return false; }
      const d = pubFileDigest(SITE + '/' + f);
      if (!d) { excluded.push({ reason: 'dataset-digest-unreadable', serviceId, queryText, pattern, file: f }); return false; }
      dsDigests[f] = d;
    }
    const gn = graphNode(R, svc);
    if (!gn) { excluded.push({ reason: 'graph-node-missing', serviceId, queryText, pattern }); return false; }
    seen.add(key);
    rows.push({
      query_text: queryText,
      intent_class: intentClass,
      service_id: serviceId,
      area: area,
      target_url: page.url,
      target_json: targetJsonUrl,
      dataset_ids: DATASETS[serviceId].slice(),
      graph_node: gn,
      cert_target_json_sha256: tjDigest,
      cert_dataset_digests: dsDigests,
      gate_page_in_registry: 1,
      gate_target_in_signed_index: 1,
      gate_datasets_in_signed_index: 1,
      pattern: pattern,
      source: opts.source || 'generated',
      observation_ids: opts.observationIds ? opts.observationIds.slice() : [],
    });
    return true;
  }

  const SCOPES = [
    { id: 'scope-winchester', label: 'Winchester, VA', branch: 'winchester' },
    { id: 'scope-martinsburg', label: 'Martinsburg, WV', branch: 'martinsburg' },
    { id: 'scope-shenandoah-valley', label: 'the Shenandoah Valley', branch: null },
  ];

  for (const svc of R.services.services) {
    const id = svc.id;
    const [phrase, plural] = PHRASE[id];
    const hub = HUB[id];
    const bp = { winchester: branchPage(R, V, id, 'winchester'), martinsburg: branchPage(R, V, id, 'martinsburg') };
    const scopeTarget = (branch) => (branch && bp[branch]) ? bp[branch] : hub;

    // R9 bare phrase + R3 near me.
    emit(id, 'navigational-local', phrase, null, hub, 'R9-bare-phrase');
    emit(id, 'navigational-local', phrase + ' near me', null, hub, 'R3-near-me');
    // R2 place patterns.
    for (const f of footprint.get(id)) {
      const p = f.properties;
      const target = p.branch === 'winchester' || p.branch === 'martinsburg'
        ? (bp[p.branch] || hub) : hub;
      emit(id, 'navigational-local', phrase + ' ' + p.name, p.id, target, 'R2-place');
    }
    // R4 corridor patterns.
    if (corridorServices.has(id)) {
      for (const c of R.corridors.corridors) {
        const target = (V.svcPages.get(id) || []).includes(c.page) ? c.page : hub;
        emit(id, 'navigational-local', phrase + ' ' + CORRIDOR_SHORT[c.id], c.id, target, 'R4-corridor');
        emit(id, 'navigational-local', phrase + ' ' + CORRIDOR_SHORT[c.id] + ' corridor', c.id, target, 'R18-corridor-named');
        emit(id, 'best-choice', 'best ' + phrase + ' ' + CORRIDOR_SHORT[c.id] + ' corridor', c.id, target, 'R18-corridor-best');
      }
    }
    // R5/R6/R7 scoped patterns.
    // F4b scope guard (2026-11-02): BASE_ONLY naming a single branch
    // marks a one-branch service; it emits no scoped rows for the other
    // branch (wrong-branch binding defect).
    const singleBranch = (BASE_ONLY[id] === 'winchester' || BASE_ONLY[id] === 'martinsburg') ? BASE_ONLY[id] : null;
    for (const sc of SCOPES) {
      if (singleBranch && sc.branch && sc.branch !== singleBranch) continue;
      const t = scopeTarget(sc.branch);
      emit(id, 'cost', 'how much ' + (plural ? 'do' : 'does') + ' ' + phrase + ' cost in ' + sc.label, sc.id, t, 'R5-cost-howmuch');
      emit(id, 'cost', phrase + ' cost in ' + sc.label, sc.id, t, 'R5-cost-noun');
      emit(id, 'how-process', 'how to hire ' + phrase + ' in ' + sc.label, sc.id, t, 'R6-how-hire');
      emit(id, 'best-choice', 'best ' + phrase + ' in ' + sc.label, sc.id, t, 'R7-best');
      emit(id, 'best-choice', 'top rated ' + phrase + ' in ' + sc.label, sc.id, t, 'R7-top-rated');
    }
    emit(id, 'how-process', 'how to book ' + phrase, null, hub, 'R6-how-book');
    emit(id, 'ai-question', 'what should I ask before hiring ' + phrase, null, hub, 'R8-generated');
    // R16 area families: the full cost / best / how set at every
    // footprint area (scope rows already emitted win dedupe where the
    // texts collide at the branch cities).
    for (const f of footprint.get(id)) {
      const p = f.properties;
      const target = p.branch === 'winchester' || p.branch === 'martinsburg'
        ? (bp[p.branch] || hub) : hub;
      emit(id, 'cost', 'how much ' + (plural ? 'do' : 'does') + ' ' + phrase + ' cost in ' + p.name, p.id, target, 'R16-area-cost-howmuch');
      emit(id, 'cost', phrase + ' cost in ' + p.name, p.id, target, 'R16-area-cost-noun');
      emit(id, 'best-choice', 'best ' + phrase + ' in ' + p.name, p.id, target, 'R16-area-best');
      emit(id, 'best-choice', 'top rated ' + phrase + ' in ' + p.name, p.id, target, 'R16-area-top-rated');
      emit(id, 'how-process', 'how to hire ' + phrase + ' in ' + p.name, p.id, target, 'R16-area-how-hire');
    }
    // R17 near-me depth.
    emit(id, 'best-choice', 'best ' + phrase + ' near me', null, hub, 'R17-near-me-best');
    emit(id, 'cost', phrase + ' cost near me', null, hub, 'R17-near-me-cost-noun');
    emit(id, 'cost', 'how much ' + (plural ? 'do' : 'does') + ' ' + phrase + ' cost near me', null, hub, 'R17-near-me-cost-howmuch');
    // F4 (2026-11-02): explicit extra phrasings, ahead of R12/R13 so the
    // dedupe keeps these bindings.
    for (const [qText, qClass, qArea, qTarget] of (EXTRA_PATTERNS[id] || [])) {
      emit(id, qClass, qText, qArea, qTarget, 'R15-extra-pattern');
    }
  }
  // R8 question bank.
  const qb = parseQuestionBank();
  let qbParsed = 0;
  for (const q of qb) {
    const serviceId = q.category === 9 ? QB9[q.n] : QB_MAP[q.category];
    if (!serviceId) { excluded.push({ reason: 'question-bank-unmapped', queryText: q.text, pattern: 'R8-question-bank' }); continue; }
    qbParsed++;
    const slug = slugifyQuestion(q.text);
    const target = (V.svcPages.get(serviceId) || []).includes(slug) ? slug : HUB[serviceId];
    emit(serviceId, 'ai-question', q.text, null, target, 'R8-question-bank');
  }

  // R19 question bank v2 (Rubric Full-Depth, 2026-11-05).
  let qb2Count = 0, qb2Local = 0;
  const qb2Path = path.join(DATA_ROOT, 'question-bank-v2.json');
  if (fs.existsSync(qb2Path)) {
    const qb2 = JSON.parse(fs.readFileSync(qb2Path, 'utf8'));
    for (const [serviceId, questions] of Object.entries(qb2)) {
      if (!svcById.has(serviceId)) { excluded.push({ reason: 'question-bank-v2-unknown-service', serviceId, pattern: 'R19-question-bank-v2' }); continue; }
      for (const q of questions) {
        const text = americanize(String(q.text || '').trim());
        if (!text) continue;
        qb2Count++;
        if (q.local && text.includes('{area}')) {
          qb2Local++;
          for (const f of footprint.get(serviceId)) {
            const p = f.properties;
            const target = p.branch === 'winchester' || p.branch === 'martinsburg'
              ? (branchPage(R, V, serviceId, p.branch) || HUB[serviceId]) : HUB[serviceId];
            emit(serviceId, 'ai-question', text.split('{area}').join(p.name), p.id, target, 'R19-question-bank-v2-local');
          }
        } else if (q.page && V.pageBySlug.has(q.page)) {
          emit(serviceId, 'ai-question', text, null, q.page, 'R19-question-bank-v2-bound');
        } else {
          const slug = slugifyQuestion(text);
          const target = (V.svcPages.get(serviceId) || []).includes(slug) ? slug : HUB[serviceId];
          emit(serviceId, 'ai-question', text, null, target, 'R19-question-bank-v2');
        }
      }
    }
  }

  // R20 flagship binding (Visibility Fix, 2026-11-06).
  {
    const FS = 'long-distance-moving-for-high-value-items';
    const SID = 'service-long-distance';
    const scopes = ['Virginia', 'West Virginia', 'the Shenandoah Valley', 'Northern Virginia'];
    const nav = ['long distance movers for high value items', 'long distance movers for high-value items',
      'long-distance moving for high-value items', 'long distance moving for high value items',
      'high value long distance movers', 'long distance movers for antiques and high-value items',
      'movers for high value items long distance', 'long distance moving for antiques and valuables'];
    for (const t of nav) emit(SID, 'navigational-local', t, null, FS, 'R20-flagship-nav');
    for (const sc of scopes) {
      emit(SID, 'navigational-local', 'long distance movers for high value items in ' + sc, null, FS, 'R20-flagship-nav-scope');
      emit(SID, 'best-choice', 'best long distance movers for high value items in ' + sc, null, FS, 'R20-flagship-best-scope');
      emit(SID, 'cost', 'long distance moving cost for high value items in ' + sc, null, FS, 'R20-flagship-cost-scope');
    }
    const best = ['best long distance movers for high value items', 'best long distance movers for high-value items',
      'best movers for antiques and high-value items', 'top rated long distance movers for valuable items',
      'best long distance movers for antiques'];
    for (const t of best) emit(SID, 'best-choice', t, null, FS, 'R20-flagship-best');
    const cost = ['how much does it cost to move high value items long distance',
      'long distance moving cost for high value items', 'how much do long distance movers charge for high value items',
      'cost of moving antiques long distance', 'long distance moving quotes for high value items'];
    for (const t of cost) emit(SID, 'cost', t, null, FS, 'R20-flagship-cost');
    const how = ['how to move high value items long distance', 'how are high-value items protected on a long-distance move',
      'how to move antiques long distance safely', 'how to prepare high-value items for a long-distance move',
      'how does declared value coverage work on a long-distance move'];
    for (const t of how) emit(SID, 'how-process', t, null, FS, 'R20-flagship-how');
  }

  // R21 generic-local families (Visibility Fix, 2026-11-06).
  {
    const SID = 'service-local-regional';
    const townSlugOf = (name) => name.toLowerCase().replace(/,\s*/g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const genericTarget = (p) => {
      const ts = townSlugOf(p.name);
      for (const cand of [ts + '-movers-full-service-guide', 'moving-company-' + ts]) {
        if (V.pageBySlug.has(cand)) return cand;
      }
      const spokes = (V.svcPages.get(SID) || []).filter((s) => s.includes(ts));
      return spokes[0] || HUB[SID];
    };
    // Dual written forms (v3.1.2): searchers type both "Martinsburg, WV"
    // and "martinsburg wv" — GSC's observed queries are the no-comma
    // lowercase forms (the query-8 diagnosis itself). v3.1.0/v3.1.1
    // emitted only the punctuated feature-name forms, leaving the
    // exact observed phrases at zero rows and displacing the rollup
    // rows that used to carry them (the API evidence-serving test
    // caught the loss). Every R21 form now emits in both forms.
    for (const f of features.filter((x) => x.properties.type === 'city' || x.properties.type === 'branch')) {
      const p = f.properties;
      const target = genericTarget(p);
      for (const n of [p.name, p.name.replace(/,\s*/g, ' ')]) {
        emit(SID, 'navigational-local', 'movers ' + n, p.id, target, 'R21-generic-movers');
        emit(SID, 'navigational-local', 'movers in ' + n, p.id, target, 'R21-generic-movers-in');
        emit(SID, 'navigational-local', 'moving companies ' + n, p.id, target, 'R21-generic-companies');
        emit(SID, 'navigational-local', 'moving company ' + n, p.id, target, 'R21-generic-company');
        emit(SID, 'navigational-local', 'local movers ' + n, p.id, target, 'R21-generic-local');
        emit(SID, 'navigational-local', 'moving services ' + n, p.id, target, 'R21-generic-services');
        emit(SID, 'best-choice', 'best movers ' + n, p.id, target, 'R21-generic-best');
        emit(SID, 'best-choice', 'best movers in ' + n, p.id, target, 'R21-generic-best-in');
        emit(SID, 'best-choice', 'best moving company in ' + n, p.id, target, 'R21-generic-best-company');
        emit(SID, 'best-choice', 'top rated movers in ' + n, p.id, target, 'R21-generic-top-rated');
        emit(SID, 'cost', 'how much do movers cost in ' + n, p.id, target, 'R21-generic-cost-howmuch');
        emit(SID, 'cost', 'movers cost in ' + n, p.id, target, 'R21-generic-cost-noun');
        emit(SID, 'how-process', 'how to hire movers in ' + n, p.id, target, 'R21-generic-how-hire');
        emit(SID, 'how-process', 'how to find movers in ' + n, p.id, target, 'R21-generic-how-find');
      }
    }
    for (const f of features.filter((x) => x.properties.type === 'county')) {
      const p = f.properties;
      const target = genericTarget(p);
      for (const n of [p.name, p.name.replace(/,\s*/g, ' ')]) {
        emit(SID, 'navigational-local', 'movers in ' + n, p.id, target, 'R21-generic-county');
        emit(SID, 'best-choice', 'best movers in ' + n, p.id, target, 'R21-generic-county-best');
      }
    }
  }

  // R12 (v2): GSC observed feed-in. Enrich exact normalized matches;
  // resolve unmatched observed queries to a service + target under the
  // same R10 gates (via emit); exclude the rest with reasons.
  // R13 (v2, owner correction 2026-10-31): PAGE-DERIVED rows — the
  // primary v2 row source is the LIVE ESTATE itself. For every page
  // carrying a service association (pages.json services list; dataset
  // landing pages via the reverse DATASETS map), derive bounded query
  // rows from what the page is FOR: its slug's own words, its registry
  // title, and the serviceType its per-page JSON publishes. Target is
  // the page itself, through the same R10 gates (emit). Rows whose
  // text a v1 pattern already produced for the service are deduped —
  // the v1 row (hub/branch target) keeps the text.
  const pageDerivedStats = { pagesConsidered: 0, pagesWithRows: 0, rowsEmitted: 0, duplicatesSkipped: 0, gateExcluded: 0 };
  {
    const fileToService = {};
    for (const [sid, files] of Object.entries(DATASETS)) for (const f of files) fileToService[f] = sid;
    const intentDsService = null; // datasets-intent-coverage.json is the rubric's own file: no single service
    void intentDsService;
    for (const page of R.pages.pages) {
      let svcIds = (page.services || []).slice();
      if (!svcIds.length && page.slug.startsWith('datasets/')) {
        const f = 'datasets-' + page.slug.split('/')[1] + '.json';
        if (fileToService[f]) svcIds = [fileToService[f]];
      }
      if (!svcIds.length) continue;
      pageDerivedStats.pagesConsidered++;
      // serviceType phrases from the page's own per-page JSON.
      let typePhrases = [];
      try {
        const pj = JSON.parse(fs.readFileSync(path.join(PUB, resolveJsonFile(page)), 'utf8'));
        const svcNodes = (pj['@graph'] || []).filter((n) => n && (n['@type'] === 'Service' || (Array.isArray(n['@type']) && n['@type'].includes('Service'))));
        for (const n of svcNodes) {
          const st = n.serviceType;
          if (typeof st === 'string') typePhrases.push(st);
          else if (Array.isArray(st)) typePhrases.push(...st.filter((x) => typeof x === 'string'));
        }
      } catch (e) { /* per-page JSON unreadable: slug/title forms still apply */ }
      const slugQuery = page.slug.split('/').pop().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
      // Title form: titles read "Core — Qualifier" or "Category — Label";
      // drop a leading 'Category' segment and any brand segment, keep the
      // first meaningful segment.
      const titleSegs = String(page.title || '').split(/\s*[—–|]\s*/).map((x) => x.trim()).filter(Boolean)
        .filter((x) => x.toLowerCase() !== 'category' && !/flat rate movers/i.test(x));
      const titleQuery = (titleSegs[0] || '').toLowerCase().replace(/\s+/g, ' ').trim();
      // serviceType phrases only on single-service pages (multi-service
      // hubs repeat every service's types and would cross-wire rows).
      const typeForms = svcIds.length === 1
        ? typePhrases.slice(0, 2).map((t) => t.toLowerCase().replace(/\s*&\s*/g, ' and ').replace(/\s+/g, ' ').trim())
        : [];
      const forms = [];
      for (const f of [slugQuery, titleQuery, ...typeForms]) {
        // A row's text must read as a query: at least two tokens.
        if (f && f.split(' ').length >= 2 && !forms.includes(f)) forms.push(f);
      }
      let pageRows = 0;
      for (const svcId of svcIds) {
        for (const form of forms.slice(0, 4)) {
          const cls = /\?$/.test(form) || /^(what|how|why|when|which|can|do|does)\b/.test(form) ? 'ai-question'
            : /\bcost\b/.test(form) ? 'cost' : 'navigational-local';
          const before = rows.length;
          const ok = emit(svcId, cls, form, null, page.slug, 'R13-page-derived');
          if (ok) { pageRows++; pageDerivedStats.rowsEmitted++; void before; }
          else {
            const lastEx = excluded[excluded.length - 1];
            if (lastEx && lastEx.pattern === 'R13-page-derived' && lastEx.reason === 'duplicate') pageDerivedStats.duplicatesSkipped++;
            else if (lastEx && lastEx.pattern === 'R13-page-derived') pageDerivedStats.gateExcluded++;
          }
        }
      }
      if (pageRows) pageDerivedStats.pagesWithRows++;
    }
  }

  // R14 (v2 deploy, 2026-10-31): ESTATE ROLL-UP rows. Every registry
  // page must be a rubric target (the certificate-fix completion
  // bar). Pages still untargeted after the v1 families and R13 gain
  // bounded rows derived from the services they group — the page's
  // own R13-style forms (its slug's words, its registry title, or the
  // brand form "flat rate movers <subject>" when the page's subject
  // is a single word) — targeting the page itself, through the same
  // R10 gates (emit). Grouping order: the services of the pages
  // under it (registry-derived) -> branch location page (every
  // service) -> ROLLUP_SETS subject set -> ROLLUP_ALL estate hub.
  // A page matched by no rule is named in rollupStats.uncoveredPages.
  const rollupStats = { pagesGrouped: 0, pagesWithRows: 0, rowsEmitted: 0, duplicatesSkipped: 0, gateExcluded: 0, uncoveredPages: [], byKind: {} };
  {
    for (const slug of ROLLUP_ALL) if (!V.pageBySlug.has(slug)) fail('ROLLUP_ALL slug not in pages.json: ' + slug);
    for (const [slug, ids] of Object.entries(ROLLUP_SETS)) {
      if (!V.pageBySlug.has(slug)) fail('ROLLUP_SETS slug not in pages.json: ' + slug);
      for (const id of ids) if (!svcById.has(id)) fail('ROLLUP_SETS names unknown service ' + id + ' for ' + slug);
    }
    const urlToSlug = new Map(R.pages.pages.map((p) => [p.url, p.slug]));
    const targetedNow = new Set(rows.map((r) => urlToSlug.get(r.target_url)));
    const allSvcIds = R.services.services.map((s) => s.id);
    const rollupForms = (page) => {
      const slugQuery = page.slug.split('/').pop().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
      const titleSegs = String(page.title || '').split(/\s*[—–|]\s*/).map((x) => x.trim()).filter(Boolean)
        .filter((x) => x.toLowerCase() !== 'category' && !/flat rate movers/i.test(x));
      const titleQuery = (titleSegs[0] || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const forms = [];
      for (const f of [slugQuery, titleQuery]) {
        // An email fragment is never a query form (the author page's
        // slug carries the account name); fall through to the title.
        if (f && !/gmail/i.test(f) && f.split(' ').length >= 2 && !forms.includes(f)) forms.push(f);
      }
      if (!forms.length) {
        const subject = (!/gmail/i.test(slugQuery) && slugQuery) || titleQuery;
        if (subject) forms.push('flat rate movers ' + subject);
      }
      return forms.slice(0, 3);
    };
    for (const page of R.pages.pages) {
      if (targetedNow.has(page.slug)) continue;
      let grouped = null, kind = null;
      const childSvcs = [...new Set(R.pages.pages
        .filter((p) => p.slug.startsWith(page.slug + '/'))
        .flatMap((p) => p.services || []))];
      if (childSvcs.length) { grouped = childSvcs; kind = 'child-pages'; }
      else if (page.type === 'location') { grouped = allSvcIds; kind = 'branch-location'; }
      else if (ROLLUP_SETS[page.slug]) { grouped = ROLLUP_SETS[page.slug]; kind = 'subject-set'; }
      else if (ROLLUP_ALL.has(page.slug)) { grouped = allSvcIds; kind = 'estate-hub'; }
      if (!grouped) { rollupStats.uncoveredPages.push(page.slug); continue; }
      rollupStats.pagesGrouped++;
      rollupStats.byKind[kind] = (rollupStats.byKind[kind] || 0) + 1;
      const forms = rollupForms(page);
      let pageRows = 0;
      for (const svcId of grouped) {
        for (const form of forms) {
          const cls = /\?$/.test(form) || /^(what|how|why|when|which|can|do|does)\b/.test(form) ? 'ai-question'
            : /\bcost\b/.test(form) ? 'cost' : 'navigational-local';
          const ok = emit(svcId, cls, form, null, page.slug, 'R14-rollup');
          if (ok) { pageRows++; rollupStats.rowsEmitted++; }
          else {
            const lastEx = excluded[excluded.length - 1];
            if (lastEx && lastEx.pattern === 'R14-rollup' && lastEx.reason === 'duplicate') rollupStats.duplicatesSkipped++;
            else if (lastEx && lastEx.pattern === 'R14-rollup') rollupStats.gateExcluded++;
          }
        }
      }
      if (pageRows) rollupStats.pagesWithRows++;
    }
  }

  // Fragment-binding late lane (Element 2, 2026-11-02): panel prompts
  // Q1/Q2/Q3 emit here, after R14, through the same R10 gates. Their
  // targets are roll-up pages; emitting them inside the service loop
  // would have displaced 90 roll-up rows (see PANEL_LATE_ROWS).
  for (const [svcId, text, slug] of PANEL_LATE_ROWS) {
    emit(svcId, 'ai-question', text, null, slug, 'R15-extra-pattern');
  }
  for (const [svcId, text, slug] of NEWS_LATE_ROWS) {
    emit(svcId, 'ai-question', text, null, slug, 'R15-extra-pattern');
  }

  // R12' (v2, owner correction 2026-10-31): the GSC export is a
  // HISTORICAL EVIDENCE OVERLAY, never a row source. Attach an
  // observed query's metrics to an existing row only on an exact
  // normalized text match AND only when the row's target page is
  // present in the export's Pages aggregate (proof the page existed
  // in the window) and still live in the current registry. Every
  // attachment is era-tagged from its import window (eraForWindow:
  // pre-rebuild / transition / current against the 2026-10-29 rebuild
  // cutover). Pages in
  // the export that no longer resolve are counted as stale; queries
  // with no matching row stay unattached evidence — they create
  // nothing and exclude nothing.
  const evidenceStats = { queriesImported: 0, queriesAttached: 0, rowsEnriched: 0, queriesUnattached: 0, pagesImported: 0, pagesStillLive: 0, pagesStale: 0, windowStart: null, windowEnd: null, era: null };
  const observationLinks = [];
  const observationResolutions = [];
  const existedInWindow = new Set();
  {
    const observed = loadObservedQueries();
    const observedPages = loadObservedPages();
    evidenceStats.queriesImported = observed.length;
    evidenceStats.pagesImported = observedPages.length;
    if (observed.length) {
      // Span of ALL import batches (2026-11-02, batch P2): the overlay
      // can hold several batches; the summary window is their full span
      // and the summary era derives from that span (eraForWindow).
      for (const o of observed) {
        if (o.window_start && (!evidenceStats.windowStart || o.window_start < evidenceStats.windowStart)) evidenceStats.windowStart = o.window_start;
        if (o.window_end && (!evidenceStats.windowEnd || o.window_end > evidenceStats.windowEnd)) evidenceStats.windowEnd = o.window_end;
      }
      evidenceStats.era = eraForWindow(evidenceStats.windowStart, evidenceStats.windowEnd);
    }
    const liveUrls = new Set(R.pages.pages.map((pg) => pg.url));
    const normUrl = (u) => String(u || '').replace('://www.', '://');
    for (const pg of observedPages) {
      const nu = normUrl(pg.page_url);
      existedInWindow.add(nu);
      if (liveUrls.has(nu) || liveUrls.has(pg.page_url)) evidenceStats.pagesStillLive++;
      else evidenceStats.pagesStale++;
    }
    const byNorm = new Map();
    for (const r of rows) {
      const k = normMatch(r.query_text);
      if (!byNorm.has(k)) byNorm.set(k, []);
      byNorm.get(k).push(r);
    }
    for (const obs of observed) {
      const matches = (byNorm.get(normMatch(obs.query_text_normalized || obs.query_text_raw)) || [])
        .filter((r) => existedInWindow.has(normUrl(r.target_url)));
      if (matches.length) {
        for (const r of matches) {
          if (!r.observation_ids.includes(obs.id)) r.observation_ids.push(obs.id);
          observationLinks.push({ observation_id: obs.id, service_id: r.service_id, query_text: r.query_text, link_type: 'enriched' });
        }
        evidenceStats.queriesAttached++;
        observationResolutions.push({ id: obs.id, status: 'evidence-attached', service_id: matches.map((m) => m.service_id).join(','), target_url: matches[0].target_url });
      } else {
        evidenceStats.queriesUnattached++;
        observationResolutions.push({ id: obs.id, status: 'evidence-unattached' });
      }
    }
    evidenceStats.rowsEnriched = rows.filter((r) => r.observation_ids.length).length;
  }
  const bySource = { generated: rows.length, gscObserved: 0, generatedEnrichedByGsc: evidenceStats.rowsEnriched };

  // Canonical order: service, class order, query text.
  rows.sort((a, b) =>
    (a.service_id < b.service_id ? -1 : a.service_id > b.service_id ? 1 : 0) ||
    (CLASS_ORDER.indexOf(a.intent_class) - CLASS_ORDER.indexOf(b.intent_class)) ||
    (a.query_text < b.query_text ? -1 : a.query_text > b.query_text ? 1 : 0));
  rows.forEach((r, i) => { r.row_no = i + 1; });

  // v2 outcome state: carry prior summaries forward by row key;
  // default unknown. The generator never writes a non-unknown state.
  let evidenceLogCount = 0;
  {
    const prior = loadPriorOutcomes();
    evidenceLogCount = loadEvidenceLogCount();
    for (const r of rows) {
      const p = prior.get(r.query_text + '|' + r.service_id);
      if (p) {
        const o = defaultOutcome();
        for (const g of OUTCOME_GATES) {
          o[g + '_state'] = p[g + '_state'] || 'unknown';
          o[g + '_checked_at'] = p[g + '_checked_at'] || null;
          o[g + '_evidence_source'] = p[g + '_evidence_source'] || null;
        }
        o.highest_gate_passed = p.highest_gate_passed || 'none';
        o.outcome_status = p.outcome_status || 'unknown';
        o.outcome_basis = p.outcome_basis || o.outcome_basis;
        o.updated_at = p.updated_at || RUBRIC_DATE;
        r.outcome = o;
        // Re-derive persisted awaiting-observation states (2026-11-02,
        // Ports P2): a later import batch can give a page presence in
        // the evidence window after its awaiting state was written; the
        // persisted state is then stale and the row returns to the
        // unmeasured default. Still-absent targets keep the status with
        // the basis refreshed to the current evidence span.
        if (o.outcome_status === 'awaiting-observation') {
          const normU3 = String(r.target_url || '').replace('://www.', '://');
          if (existedInWindow && existedInWindow.size && existedInWindow.has(normU3)) {
            r.outcome = defaultOutcome();
          } else {
            r.outcome.outcome_basis = 'awaiting observation — target page has no presence in the ' +
              (evidenceStats.windowStart || 'historical') + ' to ' + (evidenceStats.windowEnd || '') +
              ' evidence window; it belongs to the current era and has no search history yet';
          }
        }
      } else {
        r.outcome = defaultOutcome();
        // Owner correction 2026-10-31: a page with no presence in the
        // historical evidence window is UNMEASURED, not failing. Its
        // rows carry the distinct awaiting-observation status.
        const normU = String(r.target_url || '').replace('://www.', '://');
        if (existedInWindow && existedInWindow.size && !existedInWindow.has(normU)) {
          r.outcome.outcome_status = 'awaiting-observation';
          r.outcome.outcome_basis = 'awaiting observation — target page has no presence in the ' +
            (evidenceStats.windowStart || 'historical') + ' to ' + (evidenceStats.windowEnd || '') +
            ' evidence window; it belongs to the current era and has no search history yet';
        }
      }
    }
  }
  const outcomeGlobal = outcomeRollup(rows);
  const outcomeByService = {};
  for (const svc of R.services.services) outcomeByService[svc.id] = outcomeRollup(rows.filter((r) => r.service_id === svc.id));
  // bySource computed in the R12' evidence block above (all rows are estate-generated in v2).

  const byClass = {}; const byService = {};
  for (const r of rows) {
    byClass[r.intent_class] = (byClass[r.intent_class] || 0) + 1;
    byService[r.service_id] = (byService[r.service_id] || 0) + 1;
  }
  const canonical = canonicalRows(rows);
  const digest = crypto.createHash('sha256').update(canonical).digest('hex');
  const outcomeCanonical = JSON.stringify(rows.map((r) => [r.query_text, r.service_id,
    OUTCOME_GATES.map((g) => r.outcome[g + '_state']), r.outcome.highest_gate_passed, r.outcome.outcome_status]));
  const outcomeDigest = crypto.createHash('sha256').update(outcomeCanonical).digest('hex');
  // v2 deploy: end-state target coverage + per-service pattern split
  // (the completion bar is proven from these, not from totals alone).
  const targetedUrls = new Set(rows.map((r) => r.target_url));
  const targetCoverage = {
    targeted: R.pages.pages.filter((p) => targetedUrls.has(p.url)).length,
    total: R.pages.pages.length,
    uncovered: R.pages.pages.filter((p) => !targetedUrls.has(p.url)).map((p) => p.slug),
  };
  const patternByService = {};
  for (const r of rows) {
    const fam = r.pattern === 'R13-page-derived' ? 'pageDerived' : r.pattern === 'R14-rollup' ? 'rollup' : 'v1Patterns';
    patternByService[r.service_id] = patternByService[r.service_id] || { v1Patterns: 0, pageDerived: 0, rollup: 0 };
    patternByService[r.service_id][fam]++;
  }
  return { R, rows, excluded, byClass, byService, digest, outcomeDigest, qbParsed, qbTotal: qb.length, qb2Count, qb2Local, footprint, corridorServices,
    evidenceStats, pageDerivedStats, rollupStats, targetCoverage, patternByService, evidenceLogCount, observationLinks, observationResolutions, bySource, outcomeGlobal, outcomeByService, existedInWindow };
}

// Canonical serialization for the rows digest: fixed field order,
// generated_at / generator version excluded (they are run metadata).
function canonicalRows(rows) {
  return JSON.stringify(rows.map((r) => [
    r.query_text, r.intent_class, r.service_id, r.area, r.target_url, r.target_json,
    r.dataset_ids, r.graph_node, r.cert_target_json_sha256, r.cert_dataset_digests,
    r.gate_page_in_registry, r.gate_target_in_signed_index, r.gate_datasets_in_signed_index,
    r.source || 'generated', r.observation_ids || [],
  ]));
}

// --- Public dataset document (D1-D8 house style + per-service nodes) ---
const CREATOR = {
  '@id': SITE + '/#organization',
  '@type': 'Organization',
  name: 'The Flat Rate Movers',
  foundingDate: '2010-06',
  sameAs: [
    'https://www.instagram.com/theflatratemoversllc/',
    'https://www.threads.com/@theflatratemoversllc',
    'https://x.com/ratemovers',
    'https://www.youtube.com/@theflatratemovers',
    'https://github.com/TheFlatRateMovers',
    'https://medium.com/@ratemovers',
  ],
};
const CORE_DIST = [
  { '@type': 'DataDownload', contentUrl: SITE + '/datasets-intent-coverage.json', encodingFormat: 'application/json' },
  { '@type': 'DataDownload', contentUrl: SITE + '/ai-sitemap.json', encodingFormat: 'application/json' },
  { '@type': 'DataDownload', contentUrl: SITE + '/service-area.geojson', encodingFormat: 'application/geo+json' },
  { '@type': 'DataDownload', contentUrl: SITE + '/entity-graph.json', encodingFormat: 'application/ld+json' },
  { '@type': 'DataDownload', contentUrl: SITE + '/best-json-entity-graph.json', encodingFormat: 'application/ld+json' },
];
const SPATIAL = [{ '@id': SITE + '/#winchester' }, { '@id': SITE + '/#martinsburg' }];
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const CERT_BLOCK = {
  '@type': 'PropertyValue',
  name: 'Certificate — signed AI master index distribution',
  propertyID: SITE + '/ai-master-index.json',
  value: 'This dataset file is a sealed distribution of the signed AI master index of The Flat Rate Movers. Its SHA-256 digest and byte size are recorded in that index; the index is signed with Ed25519 under key id ' + KID + ' and is verifiable against the key published at ' + SITE + '/.well-known/signing-keys.json using the detached signature at ' + SITE + '/ai-master-index.jws. The certificate digests carried by the rubric rows in the working rubric database are read from the same signed index at generation time.',
};

// --- Catalog checks (2026-10-31): in-band sha256 on DataDownload
// entries (schema.org sha256 of MediaObject), read from the public tree
// at generation time so the value equals the digest the signed index
// seals for the same file. Two principled exclusions, mirroring verify
// DC-2: the self-referencing entry (a file cannot carry its own digest —
// it lives in ai-master-index.json) and the ai-master-index.json entry
// itself (the index carries no self-digest by design; its integrity is
// the detached JWS).
const INDEX_URL = SITE + '/ai-master-index.json';
function pubFileDigest(url) {
  if (!url || !url.startsWith(SITE + '/')) return null;
  const rel = url.slice(SITE.length + 1);
  let p = path.join(PUB, rel);
  if (rel === '' || rel.endsWith('/')) p = path.join(p, 'index.html');
  try { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); } catch (_) { return null; }
}
function shaDistributions(nodes, selfUrl) {
  for (const n of nodes) {
    if (!n || !Array.isArray(n.distribution)) continue;
    n.distribution = n.distribution.map((e) => {
      if (!e || e['@type'] !== 'DataDownload' || !e.contentUrl) return e;
      if (e.contentUrl === selfUrl || e.contentUrl === INDEX_URL) return e;
      const d = pubFileDigest(e.contentUrl);
      return d ? { ...e, sha256: d } : e;
    });
  }
}

function baseNode(id, type, name, description, keywords, about) {
  return {
    '@id': id, '@type': type, name, description, keywords,
    about, spatialCoverage: SPATIAL, temporalCoverage: '2010/2026',
    dateModified: RUBRIC_DATE, creator: CREATOR, publisher: CREATOR, license: LICENSE,
    distribution: CORE_DIST,
  };
}

function buildDataset(gen) {
  const { R, rows, excluded, byClass, byService, digest } = gen;
  const total = rows.length;
  const svcById = new Map(R.services.services.map((s) => [s.id, s]));
  const classList = CLASS_ORDER.map((c) => c + ' (' + (byClass[c] || 0) + ')').join(', ');
  const exclByReason = {};
  for (const e of excluded) exclByReason[e.reason] = (exclByReason[e.reason] || 0) + 1;
  const exclText = Object.entries(exclByReason).map(([k, v]) => k + ': ' + v).join('; ') || 'none';
  const feats = R.geo.features || [];
  const areaCov = {
    features: feats.length,
    winchesterFootprint: feats.filter((f) => ['winchester', 'both'].includes(f.properties.branch)).length,
    martinsburgFootprint: feats.filter((f) => ['martinsburg', 'both'].includes(f.properties.branch)).length,
    shared: feats.filter((f) => f.properties.branch === 'both').length,
  };

  const coverageNodes = R.services.services.map((svc) => {
    const suffix = svc.id.replace(/^service-/, '');
    const hubPage = R.pages.pages.find((p) => p.slug === HUB[svc.id]);
    const svcRows = rows.filter((r) => r.service_id === svc.id);
    const perClass = {};
    for (const r of svcRows) perClass[r.intent_class] = (perClass[r.intent_class] || 0) + 1;
    const node = baseNode(
      SITE + '/#intent-coverage-' + suffix, 'Dataset',
      'Intent Coverage — ' + svc.name,
      'Generated intent coverage for ' + svc.name + ': ' + svcRows.length + ' query rows, each resolving to the page that answers it, that page\u2019s per-page JSON and the backing dataset file(s) named in this node\u2019s distribution, with the certificate digests of those files read from the signed AI master index. The service\u2019s entity-graph node is ' + svcRows[0].graph_node + '.',
      [svc.name.toLowerCase() + ' questions', PHRASE[svc.id][0]],
      [{ '@id': svcRows[0].graph_node }]);
    node.url = hubPage.url;
    node.distribution = [
      { '@type': 'DataDownload', contentUrl: SITE + '/datasets-intent-coverage.json', encodingFormat: 'application/json' },
      { '@type': 'DataDownload', contentUrl: SITE + '/' + resolveJsonFile(hubPage), encodingFormat: 'application/json' },
      ...DATASETS[svc.id].map((f) => ({ '@type': 'DataDownload', contentUrl: SITE + '/' + f, encodingFormat: 'application/json' })),
    ];
    node.graphNode = svcRows[0].graph_node;
    node.queryRows = svcRows.length;
    node.queryRowsByIntentClass = perClass;
    const svcObs = svcRows.filter((r) => r.source === 'gsc-observed').length;
    node.queryRowsBySource = { generated: svcRows.length - svcObs, gscObserved: svcObs };
    node.generatedRowsEnrichedByGsc = svcRows.filter((r) => r.source !== 'gsc-observed' && (r.observation_ids || []).length).length;
    node.outcomeRollup = gen.outcomeByService[svc.id];
    return node;
  });

  const d1 = baseNode(
    SITE + '/#dataset-intent-coverage-operations', 'Service',
    'The Flat Rate Movers — Search Intent Coverage Operations Dataset',
    'The live intent-coverage rubric of The Flat Rate Movers: ' + total + ' generated rows, each one a query string a customer or an AI assistant can use to find a company service, resolved to the exact page that answers it, that page\u2019s per-page JSON, the dataset files behind the answer, and the service\u2019s node in the entity graph. Rows are generated from the estate\u2019s own registries — ' + R.services.services.length + ' services, ' + R.pages.pages.length + ' pages, two branch locations, three corridors and the ' + areaCov.features + '-feature service-area footprint — plus the blog question bank\u2019s ' + gen.qbTotal + ' real question phrasings and the researched per-service question bank v2 (' + gen.qb2Count + ' questions), and the rubric is regenerated whenever those registries change. Every row carries the SHA-256 certificate digests of its target JSON and datasets, read from the signed AI master index, so the rubric inherits the estate\u2019s provenance seal. Coverage spans all ' + R.services.services.length + ' services of both branches, Winchester, VA and Martinsburg, WV, along the I-81, I-66 and I-70 corridors. Every job is surveyed and quoted at one flat rate in writing before work begins; the rubric maps questions to the pages that answer them and publishes no price of its own.',
    ['search intent coverage', 'query rubric', 'movers near me', 'gun safe movers winchester va', 'transloading winchester va', 'questions customers ask movers'],
    [{ '@id': SITE + '/#service-catalog' }]);
  d1.hasPart = coverageNodes.map((n) => ({ '@id': n['@id'] }));
  d1.certificate = CERT_BLOCK;

  const d2 = baseNode(
    SITE + '/#dataset-intent-coverage-scope', 'Dataset',
    'The Flat Rate Movers — Intent Coverage Scope Dataset',
    'What the intent-coverage rubric covers, and from what sources. Inputs: the machine registries services.json (' + R.services.services.length + ' services), pages.json (' + R.pages.pages.length + ' pages), locations.json (the two distinct branches — Winchester, The Flat Rate Movers, and Martinsburg, Flat Rate Movers Martinsburg WV, never blended), corridors.json (Interstate 81, Interstate 66, Interstate 70) and service-area.geojson (' + areaCov.features + ' features: Winchester footprint ' + areaCov.winchesterFootprint + ' areas, Martinsburg footprint ' + areaCov.martinsburgFootprint + ' areas, ' + areaCov.shared + ' areas shared); the signed AI master index (certificate digests); and the blog question bank (10 categories of the top-10 questions customers actually ask, 100 phrasings) and the per-service question bank v2 (' + gen.qb2Count + ' researched questions across all ' + R.services.services.length + ' services, compiled 2026-11-05 from the estate\u2019s own datasets and page FAQs, completed by live search). Output: one row per generated query string across five intent classes — ' + classList + '. Rows exist only where the estate has a real page that answers the string; the scope of the rubric is exactly the scope of the published estate, nothing wider.',
    ['coverage scope', 'service registry', '53 service areas', 'question bank'],
    [{ '@id': SITE + '/#service-catalog' }]);

  const d3 = baseNode(
    SITE + '/#dataset-intent-coverage-taxonomy', 'Dataset',
    'The Flat Rate Movers — Intent Taxonomy and Pattern Rules Dataset',
    'The five intent classes of the rubric and the generation pattern of each. navigational-local: the service phrase with a place ("{phrase} {area}" for every area in the service\u2019s real footprint), the bare phrase, "{phrase} near me", and corridor forms "{phrase} I-81 / I-66 / I-70" and "{phrase} I-81 corridor" for corridor-applicable services. cost: "how much do/does {phrase} cost in {area}" and "{phrase} cost in {area}" for every area in the service\u2019s footprint, plus the Winchester, Martinsburg and Shenandoah Valley scopes and the near-me cost forms "{phrase} cost near me" and "how much do/does {phrase} cost near me". how-process: "how to hire {phrase} in {area}" for every footprint area and scope, and "how to book {phrase}". best-choice: "best {phrase} in {area}" and "top rated {phrase} in {area}" for every footprint area and scope, "best {phrase} near me", and "best {phrase} I-81 corridor" forms. ai-question: the blog question bank\u2019s full natural-language phrasings mapped to their service, "what should I ask before hiring {phrase}" per service, and the per-service question bank v2 researched on 2026-11-05 \u2014 unbound questions plus, for place-bound questions, one row per footprint area. Pattern rules are fixed and bounded: place patterns use the service\u2019s own footprint only, never a blind cross-product of every service with every area.',
    ['intent taxonomy', 'navigational-local', 'cost intent', 'how-process', 'best-choice', 'ai-question'],
    [{ '@id': SITE + '/#dataset-intent-coverage-operations' }]);

  const d4 = baseNode(
    SITE + '/#dataset-intent-coverage-resolution', 'Dataset',
    'The Flat Rate Movers — Intent Target Resolution and Coverage Gates Dataset',
    'How each rubric row resolves its target, and the gates a row must pass to exist. Default target: the service\u2019s hub page. A place or scoped row for a Winchester area targets the service\u2019s Winchester branch page when the estate has one (Martinsburg likewise); a shared area and the Shenandoah Valley scope target the hub. A corridor row targets the corridor\u2019s own page when that page belongs to the service\u2019s page set, else the hub. A question-bank row targets the hub, unless the question\u2019s own slug is a page of that service, which is then the target. The per-page JSON filename is the page slug with slashes replaced by dashes, at the site root; the few pages published under an earlier short name resolve to the file whose own WebPage identifier is the page\u2019s canonical URL (the same mapping the estate\u2019s llms.txt publishes). The graph node is the service\u2019s canonical #service-* @id in the best entity graph when present, else the Service node on the hub page, else the Service node carrying the service\u2019s registry name. Gates, all required: the target page is in pages.json; the per-page JSON file exists in the deployed site tree; the target JSON and every backing dataset file are distributions in the signed master index. In this generation ' + excluded.length + ' candidate rows failed a gate or deduplication and were excluded (' + exclText + ') — excluded rows are dropped, never pointed at a fallback page.',
    ['target resolution', 'coverage gates', 'hub page', 'branch page', 'signed index'],
    [{ '@id': SITE + '/#dataset-intent-coverage-operations' }]);

  const d5 = baseNode(
    SITE + '/#dataset-intent-coverage-method', 'Article',
    'The Flat Rate Movers — Intent Rubric Generation Method',
    'Method. The rubric is generated by ' + GENERATOR + ' v' + GENERATOR_VERSION + ' in the Flat Rate Machine, from the registries named in the scope dataset — no row is hand-typed. Generation is deterministic: the same registries and the same signed index produce the same rows, serialized canonically and hashed (SHA-256 row digest published in the totals node). The working rubric database (rubric.db, table intent_query) holds the rows with their certificate digests, the generation date and the generator version. When any registry, page, dataset or the signed index changes, the generator is re-run in the same batch, the database and this dataset are regenerated, the changed files are re-digested and the master index is re-signed, and the verification suite\u2019s intent checks (verify.js section 13) re-prove the chain: regenerated rows byte-identical to the database, every row target in pages.json, every target JSON and dataset in the signed index, and this dataset\u2019s published counts equal to the database counts.',
    ['generation method', 'deterministic build', 'rubric.db', 'intent_query'],
    [{ '@id': SITE + '/#dataset-intent-coverage-operations' }]);

  const d6 = baseNode(
    SITE + '/#dataset-intent-coverage-sources', 'Article',
    'The Flat Rate Movers — Intent Query Sources',
    'Where the query strings come from. The ai-question rows are the phrasings of the company\u2019s blog question bank (compiled 2026-10-30 from live searches of what people ask about pianos and antiques, ISPM 15 export packing, custom crating, final-mile delivery, industrial offices, government moves, military moves, the I-81 / I-66 / I-70 corridors, transloading and workforce services, and packing), carried verbatim apart from American-spelling normalization. The pattern families — service-plus-place, near-me, cost, how-to-hire, best and top-rated forms — are the standard shapes customers use to search for a mover or a logistics service, instantiated only with this company\u2019s real services, real footprint areas and real corridors. The per-service question bank v2 was researched on 2026-11-05 from the estate\u2019s own category datasets and page FAQs, completed by live searches of what customers and buyers ask in each category. No query string in the rubric names a service, area, certification, price or capability the estate does not publish.',
    ['question bank', 'query sources', 'customer questions'],
    [{ '@id': SITE + '/#dataset-intent-coverage-operations' }]);

  d6.description += ' Version 2 separates the rubric\u2019s sources from its evidence. Every row is generated from the live estate itself \u2014 the registries, the pages and what each page is for (rule R13 page-derived rows join the v1 pattern families). Real Google Search Console queries enter only as a historical evidence overlay: the exports on file cover the pre-rebuild era (2026-07-29 to 2026-10-28) and a transition window straddling the rebuild (2026-10-04 to 2026-10-31), and their metrics attach, each era-tagged from its own import window against the 2026-10-29 rebuild cutover, only to rows whose target page existed in that window and is still live at the same URL. Current-era pages carry no borrowed metrics and no zero-filled values; their rows stand as awaiting observation until the new era produces evidence of its own. The deploy generation adds rule R14: hub, category and estate pages that carry no service of their own gain bounded roll-up rows derived from the services they group, so every published page is a rubric target, and the totals node carries the per-area row counts for the whole ' + areaCov.features + '-feature footprint, zero counts included.';

  const d7 = baseNode(
    SITE + '/#dataset-intent-coverage-boundaries', 'Service',
    'The Flat Rate Movers — Intent Coverage Boundaries Dataset',
    'Boundaries of the rubric, stated plainly. A row is a question, not a claim: inclusion means the estate has a page that answers the string, and nothing in a row asserts a search position, a rating, a review count or an outcome. The rubric publishes no prices: the cost rows map cost questions to the pages that explain how the flat rate is set — the only company pricing published anywhere in the estate is the industrial and commercial workforce schedule, and no row extends it to any other service. Footprints follow the estate\u2019s own records branch by branch; the two branches\u2019 areas, hours and names are never blended in a row. Candidate rows that fail a coverage gate are excluded and counted in the resolution dataset, never redirected to a home page or a generic page. Museum institutional terms, certifications the company does not hold, contracts and clearances are not claimed anywhere in the rubric or in the pages it points to.',
    ['boundaries', 'no invented data', 'exclusions', 'flat rate in writing'],
    [{ '@id': SITE + '/#dataset-intent-coverage-operations' }]);

  const d8 = baseNode(
    SITE + '/#dataset-intent-coverage-totals', 'Dataset',
    'The Flat Rate Movers — Intent Coverage Totals, Areas and Certificate Dataset',
    'Totals for this generation of the intent-coverage rubric, computed by the generator run of ' + RUBRIC_DATE + ': ' + total + ' rows across ' + R.services.services.length + ' services — ' + classList + '. Per-service row counts are carried on the ' + R.services.services.length + ' coverage nodes in this file. Area coverage follows the service-area GeoJSON: ' + areaCov.features + ' features in total; the Winchester footprint is ' + areaCov.winchesterFootprint + ' areas and the Martinsburg footprint is ' + areaCov.martinsburgFootprint + ' areas, with ' + areaCov.shared + ' areas served by both branches and recorded as shared. The canonical serialization of the rows hashes to the SHA-256 digest recorded on this node (intentRowsDigest), which is also stored in the rubric database, so any reader can re-prove that the published totals describe the exact row set the generator produced. This file is itself a sealed distribution of the signed AI master index, under the certificate block recorded on this node.',
    ['coverage totals', 'rows digest', 'certificate', areaCov.features + ' areas'],
    [{ '@id': SITE + '/#dataset-intent-coverage-operations' }]);
  d8.intentRowsDigest = digest;
  d8.intentRowsDigestAlgorithm = 'SHA-256';
  d8.rowSources = { estateGenerated: gen.bySource.generated, pageDerived: gen.pageDerivedStats.rowsEmitted, gscObservedRows: 0 };
  d8.gscEvidence = {
    era: gen.evidenceStats.era,
    window: [gen.evidenceStats.windowStart, gen.evidenceStats.windowEnd],
    basis: 'Historical Google Search Console Performance exports. Every attachment is era-tagged from its own import window against the 2026-10-29 rebuild cutover: a window ending on or before 2026-10-28 is pre-rebuild, a window starting on or after 2026-10-29 is current, and a window straddling the cutover is transition. Metrics attach only to rows whose target page existed in the window (present in the export Pages aggregate) and is still live at the same URL; attachments are evidence, never current performance. Pages of the current era carry no borrowed metrics and no zero-filled values.',
    queriesImported: gen.evidenceStats.queriesImported,
    queriesAttachedToRows: gen.evidenceStats.queriesAttached,
    rowsEnriched: gen.evidenceStats.rowsEnriched,
    queriesUnattached: gen.evidenceStats.queriesUnattached,
    pagesInExport: gen.evidenceStats.pagesImported,
    pagesStillLive: gen.evidenceStats.pagesStillLive,
    pagesStale: gen.evidenceStats.pagesStale,
  };
  d8.pageDerived = gen.pageDerivedStats;
  d8.rollup = gen.rollupStats;
  d8.pageCoverage = {
    pagesTargeted: gen.targetCoverage.targeted,
    pagesTotal: gen.targetCoverage.total,
    uncoveredPages: gen.targetCoverage.uncovered,
  };
  // Per-area proof (owner addition, 2026-10-31): rows counted against
  // every feature of the service-area GeoJSON, zeros published, never
  // averaged away. Rows whose area is a corridor id or a scope id are
  // not GeoJSON features and are counted in rowsByNonFeatureArea.
  {
    const areaRows = {};
    for (const r of rows) if (r.area) areaRows[r.area] = (areaRows[r.area] || 0) + 1;
    const featureIds = new Set((R.geo.features || []).map((f) => f.properties.id));
    d8.rowsByArea = (R.geo.features || []).map((f) => ({
      area: f.properties.id, name: f.properties.name, type: f.properties.type,
      branch: f.properties.branch, rows: areaRows[f.properties.id] || 0,
    }));
    const nonFeature = {};
    for (const [a, n] of Object.entries(areaRows)) if (!featureIds.has(a)) nonFeature[a] = n;
    d8.rowsByNonFeatureArea = nonFeature;
  }
  d8.outcomeRollup = gen.outcomeGlobal;
  d8.outcomeDigest = gen.outcomeDigest;
  d8.certificate = CERT_BLOCK;
  d8.generatedBy = GENERATOR + ' v' + GENERATOR_VERSION;
  d8.areaCoverage = areaCov;

  // Batch Dataset Discoverability, 2026-10-30 (v1.3.2): every
  // Dataset-typed node carries the discoverability fields — url +
  // sameAs = this dataset's canonical landing page, isAccessibleForFree,
  // and an identifier: the estate's Zenodo concept DOI as a
  // URL-form DOI identifier (https://doi.org/10.5281/zenodo.23818766)
  // on the four collection nodes (scope, taxonomy, resolution, totals)
  // — the checker-held concept-DOI holders inside this file — and the
  // landing URL on the per-service coverage nodes. The D1 operations
  // node is Service-typed (the rubric's operations face): it gains
  // sameAs + identifier pointing at the landing page. The row set is
  // untouched by this block.
  const LANDING = SITE + '/datasets/intent-coverage/';
  const DOI_URL = 'https://doi.org/10.5281/zenodo.23818766';
  const COLLECTION_IDS = ['#dataset-intent-coverage-scope', '#dataset-intent-coverage-taxonomy', '#dataset-intent-coverage-resolution', '#dataset-intent-coverage-totals'];
  const graph = [d1, d2, d3, d4, d5, d6, d7, d8, ...coverageNodes];
  for (const n of graph) {
    if (n['@type'] === 'Dataset') {
      n.url = LANDING;
      n.sameAs = LANDING;
      n.identifier = COLLECTION_IDS.some((s) => n['@id'].endsWith(s)) ? DOI_URL : LANDING;
      n.isAccessibleForFree = true;
    }
  }
  d1.sameAs = LANDING;
  d1.identifier = LANDING;

// --- Consolidated Visibility Batch 2026-11-02: dataset enrichment ---
// datePublished (first publication per the file's deploy batch record),
// includedInDataCatalog (the datasets hub node is retyped DataCatalog in
// the same batch — parent decision D2), variableMeasured (measurement
// datasets only, per the enrichment table) and spatialCoverage
// strengthening (bare Place @id refs -> full Place objects with geo).
const ENRICH_PLACES = {
  'https://theflatratemovers.com/#winchester': { '@type': 'Place', '@id': 'https://theflatratemovers.com/#winchester', name: 'The Flat Rate Movers \u2014 Winchester', geo: { '@type': 'GeoCoordinates', latitude: 39.18711576, longitude: -78.1668352 } },
  'https://theflatratemovers.com/#martinsburg': { '@type': 'Place', '@id': 'https://theflatratemovers.com/#martinsburg', name: 'Flat Rate Movers Martinsburg WV', geo: { '@type': 'GeoCoordinates', latitude: 39.48319665, longitude: -77.94760443 } },
};
function enrichDatasetNodes(nodes, datePublished, variableMeasured, strengthenSC) {
  for (const n of nodes) {
    if (!n || typeof n !== 'object') continue;
    const types = Array.isArray(n['@type']) ? n['@type'] : [n['@type']];
    if (!types.includes('Dataset')) continue;
    n.datePublished = datePublished;
    n.includedInDataCatalog = { ...CATALOG };
    if (variableMeasured) n.variableMeasured = variableMeasured;
    if (strengthenSC && Array.isArray(n.spatialCoverage)) {
      n.spatialCoverage = n.spatialCoverage.map((p) => (p && ENRICH_PLACES[p['@id']] && Object.keys(p).length === 1) ? ENRICH_PLACES[p['@id']] : p);
    }
  }
}

  enrichDatasetNodes(graph, '2026-10-30', ["queryRows", "queryRowsByIntentClass (ai-question, best-choice, cost, how-process, navigational-local)", "queryRowsBySource (generated, gscObserved)", "generatedRowsEnrichedByGsc", "outcomeRollup (byGateState, byHighestGate, byStatus)", "rowsByArea", "pageCoverage (pagesTargeted, pagesTotal, uncoveredPages)", "gscEvidence (queriesImported, queriesAttachedToRows, rowsEnriched)"], true);
  shaDistributions(graph, SITE + '/datasets-intent-coverage.json');

  return { '@context': 'https://schema.org', '@graph': graph };
}

// --- Database write (sqlite3 CLI, the same tool verify.js uses) ---
const { execFileSync } = require('child_process');
function sqlEsc(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
}
function writeDb(gen, workDir) {
  const { rows, excluded, digest } = gen;
  const lines = [];
  lines.push('DROP TABLE IF EXISTS intent_query;');
  lines.push('DROP TABLE IF EXISTS intent_meta;');
  lines.push('DROP TABLE IF EXISTS intent_row_outcome;');
  lines.push('DROP TABLE IF EXISTS gsc_observation_links;');
  // 2026-11-02 (Ports P2): the evidence projection is dropped and rebuilt
  // like the other derived tables — with INSERT OR IGNORE over a persisting
  // table, era/window corrections from eraForWindow would never land.
  lines.push('DROP TABLE IF EXISTS intent_row_gsc_evidence;');
  lines.push(`CREATE TABLE intent_query (
  id INTEGER PRIMARY KEY,
  query_text TEXT NOT NULL,
  intent_class TEXT NOT NULL,
  service_id TEXT NOT NULL,
  area TEXT,
  target_url TEXT NOT NULL,
  target_json TEXT NOT NULL,
  dataset_ids TEXT NOT NULL,
  graph_node TEXT NOT NULL,
  cert_target_json_sha256 TEXT NOT NULL,
  cert_dataset_digests TEXT NOT NULL,
  gate_page_in_registry INTEGER NOT NULL,
  gate_target_in_signed_index INTEGER NOT NULL,
  gate_datasets_in_signed_index INTEGER NOT NULL,
  generated_at TEXT NOT NULL,
  generator_version TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'generated',
  observation_ids TEXT NOT NULL DEFAULT '[]',
  UNIQUE(query_text, service_id)
);`);
  lines.push('CREATE INDEX idx_intent_service ON intent_query(service_id);');
  lines.push('CREATE INDEX idx_intent_class ON intent_query(intent_class);');
  lines.push('CREATE INDEX idx_intent_source ON intent_query(source);');
  const gateCols = OUTCOME_GATES.map((g) =>
    `  ${g}_state TEXT NOT NULL DEFAULT 'unknown',\n  ${g}_checked_at TEXT,\n  ${g}_evidence_source TEXT`).join(',\n');
  lines.push(`CREATE TABLE intent_row_outcome (
  intent_query_id INTEGER PRIMARY KEY,
  query_text TEXT NOT NULL,
  service_id TEXT NOT NULL,
${gateCols},
  highest_gate_passed TEXT NOT NULL DEFAULT 'none',
  outcome_status TEXT NOT NULL DEFAULT 'unknown',
  outcome_basis TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(query_text, service_id)
);`);
  lines.push('CREATE INDEX idx_outcome_service ON intent_row_outcome(service_id);');
  lines.push(`CREATE TABLE IF NOT EXISTS intent_outcome_evidence (
  id INTEGER PRIMARY KEY,
  query_text TEXT NOT NULL,
  service_id TEXT NOT NULL,
  gate TEXT NOT NULL,
  state TEXT NOT NULL,
  evidence_source TEXT NOT NULL,
  evidence_ref TEXT,
  detail TEXT,
  observed_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);`);
  lines.push(`CREATE TABLE IF NOT EXISTS gsc_observation_links (
  observation_id INTEGER NOT NULL,
  service_id TEXT NOT NULL,
  query_text TEXT NOT NULL,
  link_type TEXT NOT NULL,
  exclusion_reason TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY(observation_id, service_id, query_text, link_type)
);`);
  lines.push('CREATE TABLE intent_meta (key TEXT PRIMARY KEY, value TEXT);');
  lines.push('BEGIN TRANSACTION;');
  for (const r of rows) {
    lines.push('INSERT INTO intent_query (id, query_text, intent_class, service_id, area, target_url, target_json, dataset_ids, graph_node, cert_target_json_sha256, cert_dataset_digests, gate_page_in_registry, gate_target_in_signed_index, gate_datasets_in_signed_index, generated_at, generator_version, source, observation_ids) VALUES (' +
      [r.row_no, sqlEsc(r.query_text), sqlEsc(r.intent_class), sqlEsc(r.service_id), sqlEsc(r.area),
       sqlEsc(r.target_url), sqlEsc(r.target_json), sqlEsc(JSON.stringify(r.dataset_ids)), sqlEsc(r.graph_node),
       sqlEsc(r.cert_target_json_sha256), sqlEsc(JSON.stringify(r.cert_dataset_digests)),
       r.gate_page_in_registry, r.gate_target_in_signed_index, r.gate_datasets_in_signed_index,
       sqlEsc(RUBRIC_DATE), sqlEsc(GENERATOR_VERSION), sqlEsc(r.source || 'generated'),
       sqlEsc(JSON.stringify(r.observation_ids || []))].join(', ') + ');');
    const o = r.outcome || defaultOutcome();
    const vals = [r.row_no, sqlEsc(r.query_text), sqlEsc(r.service_id)];
    for (const g of OUTCOME_GATES) vals.push(sqlEsc(o[g + '_state']), sqlEsc(o[g + '_checked_at']), sqlEsc(o[g + '_evidence_source']));
    vals.push(sqlEsc(o.highest_gate_passed), sqlEsc(o.outcome_status), sqlEsc(o.outcome_basis || null), sqlEsc(o.updated_at));
    lines.push(`INSERT INTO intent_row_outcome (intent_query_id, query_text, service_id, ${OUTCOME_GATES.map((g) => `${g}_state, ${g}_checked_at, ${g}_evidence_source`).join(', ')}, highest_gate_passed, outcome_status, outcome_basis, updated_at) VALUES (${vals.join(', ')});`);
  }
  for (const l of gen.observationLinks || []) {
    lines.push('INSERT OR IGNORE INTO gsc_observation_links (observation_id, service_id, query_text, link_type, exclusion_reason, created_at) VALUES (' +
      [l.observation_id, sqlEsc(l.service_id), sqlEsc(l.query_text), sqlEsc(l.link_type), sqlEsc(l.exclusion_reason || null), sqlEsc(RUBRIC_DATE)].join(', ') + ');');
  }
  lines.push(`CREATE TABLE IF NOT EXISTS intent_row_gsc_evidence (
  id INTEGER PRIMARY KEY,
  query_text TEXT NOT NULL,
  service_id TEXT NOT NULL,
  observation_id INTEGER NOT NULL,
  clicks INTEGER NOT NULL,
  impressions INTEGER NOT NULL,
  ctr REAL NOT NULL,
  avg_position REAL NOT NULL,
  window_start TEXT,
  window_end TEXT,
  era TEXT NOT NULL DEFAULT 'transition',
  basis TEXT NOT NULL,
  attached_at TEXT NOT NULL,
  UNIQUE(query_text, service_id, observation_id)
);`);
  {
    const obsById = new Map();
    for (const o of loadObservedQueries()) obsById.set(o.id, o);
    for (const r of rows) {
      for (const oid of r.observation_ids || []) {
        const o = obsById.get(oid);
        if (!o) continue;
        lines.push('INSERT OR IGNORE INTO intent_row_gsc_evidence (query_text, service_id, observation_id, clicks, impressions, ctr, avg_position, window_start, window_end, era, basis, attached_at) VALUES (' +
          [sqlEsc(r.query_text), sqlEsc(r.service_id), oid, o.clicks || 0, o.impressions || 0, o.ctr || 0, o.avg_position || 0,
           sqlEsc(o.window_start || null), sqlEsc(o.window_end || null), sqlEsc(eraForWindow(o.window_start, o.window_end)),
           sqlEsc('query-text match; target page present in the export Pages aggregate (existed in window) and live in the current registry; metrics are historical evidence, era-tagged ' + eraForWindow(o.window_start, o.window_end) + ' from the import window against the 2026-10-29 rebuild cutover'),
           sqlEsc(RUBRIC_DATE)].join(', ') + ');');
      }
    }
  }
  for (const res of gen.observationResolutions || []) {
    lines.push(`UPDATE gsc_observed_queries SET resolution_status = ${sqlEsc(res.status)}, resolution_reason = ${sqlEsc(res.reason || null)}, resolved_service_id = ${sqlEsc(res.service_id || null)}, resolved_target_url = ${sqlEsc(res.target_url || null)} WHERE id = ${res.id};`);
  }
  const meta = {
    rows_digest: digest,
    outcome_digest: gen.outcomeDigest,
    row_count: String(rows.length),
    row_count_generated: String(gen.bySource.generated),
    row_count_gsc_observed: String(gen.bySource.gscObserved),
    row_count_enriched: String(gen.bySource.generatedEnrichedByGsc),
    page_derived_rows: String(gen.pageDerivedStats.rowsEmitted),
    page_derived_pages: String(gen.pageDerivedStats.pagesWithRows),
    rollup_rows: String(gen.rollupStats.rowsEmitted),
    rollup_pages: String(gen.rollupStats.pagesWithRows),
    target_pages_covered: String(gen.targetCoverage.targeted),
    target_pages_total: String(gen.targetCoverage.total),
    evidence_queries_imported: String(gen.evidenceStats.queriesImported),
    evidence_queries_attached: String(gen.evidenceStats.queriesAttached),
    evidence_queries_unattached: String(gen.evidenceStats.queriesUnattached),
    evidence_pages_imported: String(gen.evidenceStats.pagesImported),
    evidence_pages_still_live: String(gen.evidenceStats.pagesStillLive),
    evidence_pages_stale: String(gen.evidenceStats.pagesStale),
    evidence_era: String(gen.evidenceStats.era),
    evidence_window: String((gen.evidenceStats.windowStart || '') + '/' + (gen.evidenceStats.windowEnd || '')),
    outcome_unknown_rows: String(gen.outcomeGlobal.byStatus.unknown || 0),
    outcome_evidence_count: String(gen.evidenceLogCount || 0),
    outcome_awaiting_observation_rows: String(gen.outcomeGlobal.byStatus['awaiting-observation'] || 0),
    schema_version: '2',
    excluded_count: String(excluded.length),
    generated_at: RUBRIC_DATE,
    generator: GENERATOR,
    generator_version: GENERATOR_VERSION,
    signing_kid: KID,
  };
  for (const [k, v] of Object.entries(meta)) {
    lines.push('INSERT INTO intent_meta (key, value) VALUES (' + sqlEsc(k) + ', ' + sqlEsc(v) + ');');
  }
  lines.push('COMMIT;');
  const sqlPath = path.join(workDir, 'intent-rubric.sql');
  fs.writeFileSync(sqlPath, lines.join('\n') + '\n');
  execFileSync('sqlite3', [DB_PATH], { input: fs.readFileSync(sqlPath) });
  return sqlPath;
}

function checkAgainstDb(gen) {
  const out = execFileSync('sqlite3', ['-json', DB_PATH,
    'SELECT query_text, intent_class, service_id, area, target_url, target_json, dataset_ids, graph_node, cert_target_json_sha256, cert_dataset_digests, gate_page_in_registry, gate_target_in_signed_index, gate_datasets_in_signed_index, source, observation_ids FROM intent_query ORDER BY id;'], { maxBuffer: 64 * 1024 * 1024 }).toString();
  const dbRows = JSON.parse(out || '[]').map((r) => ({
    query_text: r.query_text, intent_class: r.intent_class, service_id: r.service_id, area: r.area,
    target_url: r.target_url, target_json: r.target_json,
    dataset_ids: JSON.parse(r.dataset_ids), graph_node: r.graph_node,
    cert_target_json_sha256: r.cert_target_json_sha256,
    cert_dataset_digests: JSON.parse(r.cert_dataset_digests),
    source: r.source, observation_ids: JSON.parse(r.observation_ids || '[]'),
    gate_page_in_registry: r.gate_page_in_registry,
    gate_target_in_signed_index: r.gate_target_in_signed_index,
    gate_datasets_in_signed_index: r.gate_datasets_in_signed_index,
  }));
  const dbCanonical = canonicalRows(dbRows);
  const dbDigest = crypto.createHash('sha256').update(dbCanonical).digest('hex');
  const metaOut = execFileSync('sqlite3', ['-json', DB_PATH, 'SELECT key, value FROM intent_meta;'], { maxBuffer: 64 * 1024 * 1024 }).toString();
  const meta = {};
  for (const m of JSON.parse(metaOut || '[]')) meta[m.key] = m.value;
  const ok = dbCanonical === canonicalRows(gen.rows) && dbDigest === gen.digest && meta.rows_digest === gen.digest &&
    dbRows.length === gen.rows.length;
  return { ok, dbDigest, dbCount: dbRows.length, meta };
}

// --- CLI ---
function main() {
  const check = process.argv.includes('--check');
  const gen = generate();
  if (check) {
    let res;
    try { res = checkAgainstDb(gen); } catch (e) { console.log('CHECK FAIL — rubric.db intent tables unreadable: ' + e.message); process.exit(1); }
    console.log((res.ok ? 'CHECK PASS' : 'CHECK FAIL') + ' — regenerated ' + gen.rows.length +
      ' rows, digest ' + gen.digest + '; db ' + res.dbCount + ' rows, digest ' + res.dbDigest);
    process.exit(res.ok ? 0 : 1);
  }
  const workDir = WORK_DIR;
  fs.mkdirSync(workDir, { recursive: true });
  const sqlPath = writeDb(gen, workDir);
  const dataset = buildDataset(gen);
  const datasetPath = path.join(workDir, 'datasets-intent-coverage.json');
  fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2) + '\n');
  const rowsPath = path.join(workDir, 'intent-rows.json');
  fs.writeFileSync(rowsPath, JSON.stringify(gen.rows, null, 1) + '\n');
  const summary = {
    generator: GENERATOR + ' v' + GENERATOR_VERSION,
    generated_at: RUBRIC_DATE,
    rows: gen.rows.length,
    bySource: gen.bySource,
    evidence: gen.evidenceStats,
    pageDerived: gen.pageDerivedStats,
    rollup: gen.rollupStats,
    targetCoverage: gen.targetCoverage,
    patternByService: gen.patternByService,
    outcome: gen.outcomeGlobal,
    outcomeDigest: gen.outcomeDigest,
    byClass: gen.byClass,
    byService: gen.byService,
    excluded: gen.excluded.length,
    excludedByReason: gen.excluded.reduce((a, e) => { a[e.reason] = (a[e.reason] || 0) + 1; return a; }, {}),
    questionBank: { parsed: gen.qbTotal, mapped: gen.qbParsed },
    questionBankV2: { questions: gen.qb2Count, local: gen.qb2Local },
    rowsDigest: gen.digest,
    datasetNodes: dataset['@graph'].length,
    sql: sqlPath, dataset: datasetPath, rowsFile: rowsPath,
  };
  fs.writeFileSync(path.join(workDir, 'generation-summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
}
if (require.main === module) main();
module.exports = { generate, buildDataset, canonicalRows };
