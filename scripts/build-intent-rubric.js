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
// RUBRIC_DATE fallback (fixed 2026-11-13): the lastmod ledger is the date
// authority for the intent file (S-7f, Q124 Q2=A wiring), so a standalone
// rebuild (e.g. the outcome-evidence ingest chain, which passes no env)
// must reproduce the sealed date exactly. The old hardcoded '2026-10-31'
// default silently re-dated the sealed file on an out-of-seal ingest and
// broke S-7f + CI-7. Fallback chain: env -> ledger entry -> today.
function ledgerRubricDate() {
  try {
    const led = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'lastmod-ledger.json'), 'utf8'));
    const d = led && led.urls && led.urls[SITE + '/datasets-intent-coverage.json'];
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  } catch (e) { /* fall through to today */ }
  return new Date().toISOString().slice(0, 10);
}
const RUBRIC_DATE = process.env.RUBRIC_DATE || ledgerRubricDate();
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
// identifier (the estate's Zenodo concept DOI 10.5281/zenodo.23879048
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
// 2026-11-21 (Geo Batch, v3.2.0): the geo pass (the estate's 335
// places read from data/geo-enriched.json — verified ZIP sets,
// radius rings, neighbors, route pairs — emitting the proximity /
// locality / radius / ZIP / relation / ai-question / neighbor /
// route-pair families estate-wide), the depth-bank ingest (4,326
// screened buyer-language rows; depth-1 parent links resolved into
// intent_row_lineage), and the intent-rows part files
// (scripts/pack-intent-parts.py, spawned after writeDb) that take
// the packed intent columns out of the API bundle.
const GENERATOR_VERSION = '3.2.0';
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
  'service-commercial': ['datasets-commercial.json', 'datasets-office-decommissioning.json'],
  'service-local-regional': ['datasets-local-regional.json'],
  'service-long-distance': ['datasets-long-distance.json'],
  'service-packing': ['datasets-packing.json'],
  'service-sir-heavy': ['datasets-sir-heavy.json'],
  'service-gun-safe': ['datasets-gun-safe.json', 'datasets-vault-door-case-study.json'],
  'service-piano-antique': ['datasets-piano-antique.json'],
  'service-ispm15': ['datasets-ispm15.json'],
  'service-crating': ['datasets-crating.json'],
  'service-transloading': ['datasets-transloading.json', 'datasets-warehouse-racking.json', 'datasets-transloading-inland-port.json', 'datasets-ocean-container.json', 'datasets-ports.json', 'datasets-port-of-virginia.json', 'datasets-port-of-huntington.json', 'datasets-port-of-new-york-new-jersey.json', 'datasets-port-of-baltimore.json', 'datasets-philaport.json', 'datasets-port-of-wilmington.json', 'datasets-richmond-marine-terminal.json'], // + the four ports-completion files in Ports Completion 2026-11-10 (per-port dataset seats for Baltimore, PhilaPort, Wilmington, Richmond) // + datasets-port-of-new-york-new-jersey.json in Port #8 2026-11-10 (per-port dataset seat for the Port of New York and New Jersey) // + datasets-port-of-huntington.json in WV-2 2026-11-07 (per-port dataset seat for the Huntington river district) // + datasets-port-of-virginia.json in Ports P3 2026-11-03 (per-port dataset seat; gives the /datasets/port-of-virginia/ landing its R13 rows + full coverage)
  'service-final-mile': ['datasets-final-mile.json'],
  'service-white-glove': ['datasets-white-glove.json', 'datasets-luxury-estate-relocation.json'],
  'service-office-moving': ['datasets-office.json', 'datasets-office-decommissioning.json'],
  'service-industrial-offices': ['datasets-industrial-offices.json', 'datasets-office-decommissioning.json'],
  'service-government': ['datasets-government.json', 'datasets-office-decommissioning.json'],
  'service-military': ['datasets-military.json'],
  'service-route81': ['datasets-route81.json'],
  'service-industrial-commercial': ['datasets-industrial-commercial.json', 'datasets-warehouse.json', 'datasets-warehouse-racking.json'],
  'service-senior-moving': ['datasets-senior.json'],
  'service-warehouse-relocation': ['datasets-warehouse.json', 'datasets-warehouse-racking.json'],
  'service-it-relocation': ['datasets-it.json', 'datasets-office-decommissioning.json'],
  'service-transloading-winchester-va': ['datasets-transloading-winchester.json'],
  'service-moving-and-storage': ['datasets-moving-and-storage.json'],
  'service-junk-removal': ['datasets-junk-removal.json'],
  'service-freight-rework-transloading': ['datasets-freight-rework.json'],
  'service-warehouse-racking-relocation': ['datasets-warehouse-racking-relocation.json', 'datasets-warehouse-racking.json'],
  'service-ffe-logistics': ['datasets-ffe-logistics.json'],
  'service-data-center-relocation': ['datasets-data-center-relocation.json'],
  'service-medical-lab-relocation': ['datasets-medical-lab-relocation.json'],
  'service-logistics-project-management': ['datasets-logistics-project-management.json'],
  'service-3pl-support': ['datasets-ports.json', 'datasets-warehouse-racking.json'],
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
    // Port #8 (2026-11-10): Port of New York and New Jersey family — the
    // port binds Martinsburg on miles (251.1 vs 275.6, OSRM 2026-11-10).
    ['transloading near Port of New York and New Jersey', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['transloading services Port Newark New Jersey', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['Port of New York and New Jersey transload services', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['container unloading labor Port Newark', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['container devanning Elizabeth New Jersey', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['cross docking services Port Newark New Jersey', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['warehouse labor near Port of New York and New Jersey', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['freight rework near Port of New York and New Jersey', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['who can unload containers at Port of New York and New Jersey', 'ai-question', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['who does transloading at Port Newark', 'ai-question', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['lumper services Elizabeth New Jersey', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['Port of New York and New Jersey warehouse and logistics services from Martinsburg WV', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['ExpressRail container terminal logistics support Martinsburg WV', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['ocean container packing and unpacking services Virginia', 'navigational-local', 'scope-winchester', 'datasets/ports'],
    ['transloading near Richmond Marine Terminal', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['transloading services Richmond Virginia', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['Richmond Marine Terminal transload services', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['container unloading labor Richmond Virginia', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['container devanning Richmond Virginia', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['cross docking services Richmond Virginia', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['warehouse labor near Richmond Marine Terminal', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['freight rework near Richmond Marine Terminal', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['who can unload containers at Richmond Marine Terminal', 'ai-question', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['who does transloading at Richmond Marine Terminal', 'ai-question', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['lumper services Richmond Virginia', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['Richmond Marine Terminal warehouse and logistics services from Winchester VA', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['barge transloading Richmond Virginia', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['transloading near Port of Baltimore', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['transloading services Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['Port of Baltimore transload services', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['container unloading labor Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['container devanning Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['cross docking services Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['warehouse labor near Port of Baltimore', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['freight rework near Port of Baltimore', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['who can unload containers at Port of Baltimore', 'ai-question', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['who does transloading at Port of Baltimore', 'ai-question', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['lumper services Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['Port of Baltimore warehouse and logistics services from Martinsburg WV', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['forest products handling support Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['ocean container packing and unpacking services Maryland', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['transloading near Port of Wilmington', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['transloading services Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['Port of Wilmington transload services', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['container unloading labor Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['container devanning Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['warehouse labor near Port of Wilmington', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['freight rework near Port of Wilmington', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['who can unload containers at Port of Wilmington', 'ai-question', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['who does transloading at Port of Wilmington', 'ai-question', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['lumper services Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['Port of Wilmington warehouse and logistics services from Martinsburg WV', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['fruit and banana container handling Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['reefer container labor Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['transloading near PhilaPort', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['transloading services Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['PhilaPort transload services', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['container unloading labor Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['container devanning Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['cross docking services Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['warehouse labor near PhilaPort', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['freight rework near PhilaPort', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['who can unload containers at PhilaPort', 'ai-question', 'scope-martinsburg', 'philaport-logistics'],
    ['who does transloading at PhilaPort', 'ai-question', 'scope-martinsburg', 'philaport-logistics'],
    ['lumper services Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['PhilaPort warehouse and logistics services from Martinsburg WV', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['reefer container labor Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['ocean container packing and unpacking services Pennsylvania', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    // Ports Completion (2026-11-10): landscape bindings — Baltimore who-forms first (attack order 1).
    ['who unloads containers at the Port of Baltimore', 'ai-question', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['container unloading services Baltimore MD', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['transloading services Baltimore MD', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['cross docking services Baltimore MD', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['lumper services Baltimore MD', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['who unloads containers at Seagirt Marine Terminal', 'ai-question', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['container unloading at Seagirt Marine Terminal', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['ro-ro freight handling labor Baltimore MD', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['freight rework services Baltimore MD', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['TWIC labor Baltimore MD port', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    // Ports Completion: Wilmington who + reefer/fruit (attack order 2).
    ['who unloads containers at the Port of Wilmington Delaware', 'ai-question', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['container unloading services Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['reefer container handling services Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['cold storage container unloading Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['perishable cargo handling labor Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['cross docking services Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['freight rework services Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    // Ports Completion: Norfolk hub-surface breadth (attack order 3/9) + the TWIC seat.
    ['who unloads containers at Norfolk International Terminals', 'ai-question', 'scope-winchester', 'port-of-virginia-logistics'],
    ['who unloads containers at Virginia International Gateway', 'ai-question', 'scope-winchester', 'port-of-virginia-logistics'],
    ['container devanning services Norfolk VA', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['container unloading services Norfolk VA', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['transloading services Norfolk VA', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['freight rework services Norfolk VA', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['TWIC labor Port of Virginia', 'navigational-local', 'scope-winchester', 'emergency-port-container-recovery-twic-labor-virginia'],
    // Ports Completion: VIP near forms (attack order 4 companion rows).
    ['container unloading labor Virginia Inland Port', 'navigational-local', 'scope-winchester', 'who-unloads-containers-at-the-virginia-inland-port'],
    ['transloading companies near Front Royal VA', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['cross docking services Front Royal VA', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    // Ports Completion: NY/NJ flanks — transloading + terminal-named, then who-form (attack order 5).
    ['transloading services near Port Newark Elizabeth NJ', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['transloading services New Jersey port', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['container unloading labor Port Newark', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['container unloading labor Elizabeth Marine Terminal', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['container labor Maher Terminals', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['container labor APM Terminals Elizabeth', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['container devanning services New Jersey', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['container de-vanning services New Jersey', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['container de-stuffing services New Jersey', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['container unloading services New Jersey port', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['cross docking services New Jersey', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['lumper services New Jersey', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['lumper services Port Newark Elizabeth', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['freight rework services New Jersey port', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['warehouse labor near Port Newark', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['TWIC labor Port of New York New Jersey', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['who unloads containers at the Port of New York and New Jersey', 'ai-question', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    ['who unloads containers at Port Newark', 'ai-question', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
    // Ports Completion: PhilaPort who + reefer (attack order 6).
    ['who unloads containers at PhilaPort', 'ai-question', 'scope-martinsburg', 'philaport-logistics'],
    ['who unloads containers at the Port of Philadelphia', 'ai-question', 'scope-martinsburg', 'philaport-logistics'],
    ['container unloading services Philadelphia PA', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['container unloading services PhilaPort', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['transloading services Philadelphia PA', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['lumper services Philadelphia PA', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['container unloading at Packer Avenue Marine Terminal', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['container labor Tioga Marine Terminal', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['reefer container labor Philadelphia PA', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['cross docking services Philadelphia PA', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['freight rework PhilaPort', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    // Ports Completion: Richmond hub set (attack order 7), incl. the landscape's exact RMT-named forms.
    ['who unloads containers at Richmond Marine Terminal', 'ai-question', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['container unloading labor Richmond Marine Terminal', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['container unloading services Richmond VA', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['transloading services Richmond VA', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['cross docking services Richmond VA', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['barge container services Richmond Marine Terminal', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['freight rework Richmond VA', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['warehouse labor Richmond VA port', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    // Ports Completion: Huntington moat extensions (attack order 10).
    ['who unloads barges at the Port of Huntington Tri-State', 'ai-question', 'scope-winchester', 'port-of-huntington-logistics'],
    ['barge unloading services Huntington WV', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['transloading services Huntington WV', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['river freight transloading Huntington WV', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['freight unloading labor Huntington West Virginia', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['rail transload labor Huntington WV', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    ['project cargo handling labor Huntington WV', 'navigational-local', 'scope-winchester', 'port-of-huntington-logistics'],
    // Ports Completion: cross-port TWIC family (attack order 11).
    ['TWIC labor services Virginia ports', 'navigational-local', 'scope-winchester', 'emergency-port-container-recovery-twic-labor-virginia'],
    ['emergency container recovery labor port', 'navigational-local', 'scope-winchester', 'emergency-port-container-recovery-twic-labor-virginia'],
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
    ['barge container transloading Richmond Virginia', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
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
    ['cross docking near Richmond Marine Terminal', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    // Ports P4 (2026-11-03): cross-docking joins the rework family.
    ['cross docking and freight rework Virginia', 'navigational-local', 'scope-winchester', 'cross-docking-services'],
  ],
  'service-logistics-project-management': [
    // Ports P4 service families (2026-11-03): 6 rows re-keyed from
    // service-transloading (§A) + the new hub family (§B) + §C.
    ['logistics project management Front Royal Virginia', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['logistics project management Virginia Inland Port', 'navigational-local', 'scope-winchester', 'virginia-inland-port-transloading'],
    ['logistics project management Norfolk Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    ['logistics project management Baltimore Maryland', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['logistics project management Philadelphia Pennsylvania', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['logistics project management Port of Virginia', 'navigational-local', 'scope-winchester', 'port-of-virginia-logistics'],
    // Ports Completion (2026-11-10): PM rows for the two hubs the P4 family missed.
    ['logistics project management Richmond Marine Terminal', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['logistics project management Port of New York and New Jersey', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
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
    // Ports Completion (2026-11-10): VIP 3PL set vs InterChange (attack order 4) + per-hub 3PL rows.
    ['who provides 3PL project support at the Virginia Inland Port', 'ai-question', 'scope-winchester', '3pl-support-services'],
    ['3PL project support Virginia Inland Port', 'navigational-local', 'scope-winchester', '3pl-support-services'],
    ['who offers 3PL support near Front Royal Virginia', 'ai-question', 'scope-winchester', '3pl-support-services'],
    ['3PL support services Richmond VA', 'navigational-local', 'scope-winchester', 'richmond-marine-terminal-logistics'],
    ['3PL support services Baltimore MD', 'navigational-local', 'scope-martinsburg', 'port-of-baltimore-logistics'],
    ['3PL support services Wilmington Delaware', 'navigational-local', 'scope-martinsburg', 'port-of-wilmington-logistics'],
    ['3PL support services Philadelphia port', 'navigational-local', 'scope-martinsburg', 'philaport-logistics'],
    ['3PL support services New Jersey port', 'navigational-local', 'scope-martinsburg', 'port-of-new-york-new-jersey-logistics'],
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
    // R36 (Money Spot 1, 2026-11-13): the Ashburn/Leesburg head terms
    // bind to the dedicated place pages (the winchester/martinsburg
    // pattern above), not the hub — the place pages own the money
    // intent for the spot.
    ['server relocation services ashburn va', 'navigational-local', null, 'data-center-movers-ashburn-va'],
    ['server movers ashburn va', 'navigational-local', null, 'data-center-movers-ashburn-va'],
    ['data center movers ashburn va', 'navigational-local', null, 'data-center-movers-ashburn-va'],
    ['data center relocation ashburn va', 'navigational-local', null, 'data-center-movers-ashburn-va'],
    ['data center movers leesburg va', 'navigational-local', null, 'data-center-movers-leesburg-va'],
    ['server movers leesburg va', 'navigational-local', null, 'data-center-movers-leesburg-va'],
    ['data center relocation leesburg va', 'navigational-local', null, 'data-center-movers-leesburg-va'],
    ['server relocation services leesburg va', 'navigational-local', null, 'data-center-movers-leesburg-va'],
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
    // R39 (Ranking-Push, 2026-11-13): the question doors for the Spot 1
    // head terms. A1/A2 audit: the place cells' scenario mass binds to
    // the place pages in every door (R36 via the modal cascade), but the
    // HEAD-TERM question forms were missing, and the Northern Virginia
    // region phrasing carried exactly ONE row bank-wide (a cost row).
    // AI Overviews answer question-form queries — these tuples put the
    // ai-question / how-process / best-choice / cost head rows on the
    // same owners R36 set for the navigational heads.
    ['Who are the best data center movers in Ashburn VA?', 'ai-question', null, 'data-center-movers-ashburn-va'],
    ['Who moves data centers in Ashburn VA?', 'ai-question', null, 'data-center-movers-ashburn-va'],
    ['how does a data center move in ashburn va work', 'how-process', null, 'data-center-movers-ashburn-va'],
    ['how to hire data center movers in ashburn va', 'how-process', null, 'data-center-movers-ashburn-va'],
    ['best data center movers ashburn va', 'best-choice', null, 'data-center-movers-ashburn-va'],
    ['how much do data center movers charge in ashburn va', 'cost', null, 'data-center-movers-ashburn-va'],
    ['Who are the best data center movers in Leesburg VA?', 'ai-question', null, 'data-center-movers-leesburg-va'],
    ['Who moves data centers in Leesburg VA?', 'ai-question', null, 'data-center-movers-leesburg-va'],
    ['how does a data center move in leesburg va work', 'how-process', null, 'data-center-movers-leesburg-va'],
    ['how to hire data center movers in leesburg va', 'how-process', null, 'data-center-movers-leesburg-va'],
    ['best data center movers leesburg va', 'best-choice', null, 'data-center-movers-leesburg-va'],
    ['how much do data center movers charge in leesburg va', 'cost', null, 'data-center-movers-leesburg-va'],
    ['data center movers northern virginia', 'navigational-local', null, 'data-center-relocation'],
    ['Who are the best data center movers in Northern Virginia?', 'ai-question', null, 'data-center-relocation'],
    ['Who moves data centers in Northern Virginia?', 'ai-question', null, 'data-center-relocation'],
    ['best data center movers northern virginia', 'best-choice', null, 'data-center-relocation'],
    ['how does a data center move in northern virginia work', 'how-process', null, 'data-center-relocation'],
    ['how to hire data center movers in northern virginia', 'how-process', null, 'data-center-relocation'],
    ['how much do data center movers charge in northern virginia', 'cost', null, 'data-center-relocation'],
  ],
  'service-it-relocation': [
    // R36 (Money Spot 1, 2026-11-13): the spot's IT head terms bind to
    // the dedicated Ashburn/Leesburg place pages (which carry both
    // services), not the Virginia IT hub page.
    ['IT equipment movers ashburn va', 'navigational-local', null, 'data-center-movers-ashburn-va'],
    ['IT equipment movers leesburg va', 'navigational-local', null, 'data-center-movers-leesburg-va'],
    ['IT movers ashburn va', 'navigational-local', null, 'data-center-movers-ashburn-va'],
    ['IT movers leesburg va', 'navigational-local', null, 'data-center-movers-leesburg-va'],
    // R39 (Ranking-Push, 2026-11-13): the IT head terms' question doors
    // (A1: "IT equipment movers Leesburg VA" carried ZERO ai-question
    // rows on its owner — the token matches were medical-lab and
    // SIR-heavy rows, different services correctly bound elsewhere).
    ['Who moves IT equipment in Ashburn VA?', 'ai-question', null, 'data-center-movers-ashburn-va'],
    ['Who are the best IT equipment movers in Leesburg VA?', 'ai-question', null, 'data-center-movers-leesburg-va'],
    ['how to hire IT equipment movers in ashburn va', 'how-process', null, 'data-center-movers-ashburn-va'],
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
    // R38 (Money Spot 3, 2026-11-13): the Middleburg / The Plains /
    // Upperville estate head terms bind to the dedicated estate place
    // pages (the winchester/martinsburg branch pattern), not the
    // Winchester branch white-glove page — the estate place pages own
    // the money intent for the spot. The antique heads ride the
    // service-piano-antique array below.
    ['estate movers middleburg va', 'navigational-local', null, 'estate-movers-middleburg-va'],
    ['estate movers in middleburg va', 'navigational-local', null, 'estate-movers-middleburg-va'],
    ['estate moving middleburg va', 'navigational-local', null, 'estate-movers-middleburg-va'],
    ['white glove movers middleburg va', 'navigational-local', null, 'estate-movers-middleburg-va'],
    ['white glove movers in middleburg va', 'navigational-local', null, 'estate-movers-middleburg-va'],
    ['luxury movers middleburg va', 'navigational-local', null, 'estate-movers-middleburg-va'],
    ['estate movers the plains va', 'navigational-local', null, 'estate-movers-the-plains-va'],
    ['estate movers in the plains va', 'navigational-local', null, 'estate-movers-the-plains-va'],
    ['white glove movers the plains va', 'navigational-local', null, 'estate-movers-the-plains-va'],
    ['estate movers upperville va', 'navigational-local', null, 'estate-movers-upperville-va'],
    ['estate movers in upperville va', 'navigational-local', null, 'estate-movers-upperville-va'],
    ['white glove movers upperville va', 'navigational-local', null, 'estate-movers-upperville-va'],
    // R39 (Ranking-Push, 2026-11-13): the question doors for the Spot 3
    // head terms. A1/A2 audit: the estate cells' scenario mass binds to
    // the estate pages in every door (R38 via the modal cascade), but
    // the word "estate" barely exists inside the cells (white-glove x
    // Middleburg: 0/35 rows carry it), ZERO who/best/which head rows
    // existed for any estate term, "luxury movers middleburg va"
    // carried exactly ONE row bank-wide (the R38 navigational tuple),
    // and the head-shaped estate-RELOCATION questions ("Do estate
    // movers near <town> work with executors…", "How do movers handle
    // an estate move in <town>") exist only under service-senior-moving
    // for a different buyer. These tuples build the estate pages' own
    // question doors under the estate family's services; the
    // senior-moving / junk-removal rows stay untouched.
    ['Who are the best estate movers in Middleburg VA?', 'ai-question', null, 'estate-movers-middleburg-va'],
    ['Who moves estates in Middleburg VA?', 'ai-question', null, 'estate-movers-middleburg-va'],
    ['how do movers handle an estate move in middleburg va', 'how-process', null, 'estate-movers-middleburg-va'],
    ['best estate movers middleburg va', 'best-choice', null, 'estate-movers-middleburg-va'],
    ['how much do estate movers charge in middleburg va', 'cost', null, 'estate-movers-middleburg-va'],
    ['Who are the best white glove movers in Middleburg VA?', 'ai-question', null, 'estate-movers-middleburg-va'],
    ['Who are the best luxury movers in Middleburg VA?', 'ai-question', null, 'estate-movers-middleburg-va'],
    ['best luxury movers middleburg va', 'best-choice', null, 'estate-movers-middleburg-va'],
    ['how does a luxury estate move in middleburg va work', 'how-process', null, 'estate-movers-middleburg-va'],
    ['how much do luxury movers charge in middleburg va', 'cost', null, 'estate-movers-middleburg-va'],
    ['Who are the best estate movers in The Plains VA?', 'ai-question', null, 'estate-movers-the-plains-va'],
    ['how do movers handle an estate move in the plains va', 'how-process', null, 'estate-movers-the-plains-va'],
    ['best estate movers the plains va', 'best-choice', null, 'estate-movers-the-plains-va'],
    ['how much do estate movers charge in the plains va', 'cost', null, 'estate-movers-the-plains-va'],
    ['Who are the best estate movers in Upperville VA?', 'ai-question', null, 'estate-movers-upperville-va'],
    ['how do movers handle an estate move in upperville va', 'how-process', null, 'estate-movers-upperville-va'],
    ['best estate movers upperville va', 'best-choice', null, 'estate-movers-upperville-va'],
    ['how much do estate movers charge in upperville va', 'cost', null, 'estate-movers-upperville-va'],
  ],
  // R38 (Money Spot 3, 2026-11-13): service-piano-antique had NO
  // EXTRA_PATTERNS array before this lane — the Middleburg-corridor
  // antique head terms bind to the dedicated estate place pages,
  // which carry the piano-antique service alongside white-glove and
  // crating (the estate family's composite registration).
  'service-piano-antique': [
    ['antique movers middleburg va', 'navigational-local', null, 'estate-movers-middleburg-va'],
    ['antique movers in middleburg va', 'navigational-local', null, 'estate-movers-middleburg-va'],
    ['antique movers the plains va', 'navigational-local', null, 'estate-movers-the-plains-va'],
    ['antique movers upperville va', 'navigational-local', null, 'estate-movers-upperville-va'],
    // R39 (Ranking-Push, 2026-11-13): the antique head term's question
    // doors for Middleburg (the AIO pack on this term is antique
    // STORES, not movers — the mover answer has to exist to be cited).
    ['Who are the best antique movers in Middleburg VA?', 'ai-question', null, 'estate-movers-middleburg-va'],
    ['best antique movers middleburg va', 'best-choice', null, 'estate-movers-middleburg-va'],
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
    // R37 (Money Spot 2, 2026-11-13): the DC head terms and the McLean
    // seat bind to the dedicated place pages (the winchester/martinsburg
    // branch pattern), not the branch page — the place pages own the
    // money intent for the spot.
    ['gun safe movers washington dc', 'navigational-local', null, 'gun-safe-movers-washington-dc'],
    ['safe movers washington dc', 'navigational-local', null, 'gun-safe-movers-washington-dc'],
    ['gun safe movers in washington dc', 'navigational-local', null, 'gun-safe-movers-washington-dc'],
    ['safe movers in washington dc', 'navigational-local', null, 'gun-safe-movers-washington-dc'],
    ['gun safe movers mclean va', 'navigational-local', null, 'gun-safe-movers-mclean-va'],
    ['safe movers mclean va', 'navigational-local', null, 'gun-safe-movers-mclean-va'],
    ['gun safe movers in mclean va', 'navigational-local', null, 'gun-safe-movers-mclean-va'],
    ['safe movers in mclean va', 'navigational-local', null, 'gun-safe-movers-mclean-va'],
    ['Who should I call to move a 2,000 lb gun safe in northern Virginia?', 'ai-question', null, 'gun-safe-movers'],
    // R39 (Ranking-Push, 2026-11-13): the question doors for the Spot 2
    // head terms. A1/A2 audit: the DC/McLean place cells bind their
    // scenario mass to the place pages in every door (R37 via the modal
    // cascade), but the head-term question forms were missing, and the
    // held Northern Virginia term carried only TWO ai-question rows in
    // its own phrasing bank-wide. These tuples complete the doors on the
    // R37 owners + the hub for the region term.
    ['Who are the best gun safe movers in Washington DC?', 'ai-question', null, 'gun-safe-movers-washington-dc'],
    ['Who are the best safe movers in Washington DC?', 'ai-question', null, 'gun-safe-movers-washington-dc'],
    ['how does gun safe moving work in washington dc', 'how-process', null, 'gun-safe-movers-washington-dc'],
    ['best gun safe movers washington dc', 'best-choice', null, 'gun-safe-movers-washington-dc'],
    ['Who are the best gun safe movers in McLean VA?', 'ai-question', null, 'gun-safe-movers-mclean-va'],
    ['Who are the best safe movers in McLean VA?', 'ai-question', null, 'gun-safe-movers-mclean-va'],
    ['how does gun safe moving work in mclean va', 'how-process', null, 'gun-safe-movers-mclean-va'],
    ['best gun safe movers mclean va', 'best-choice', null, 'gun-safe-movers-mclean-va'],
    ['gun safe movers northern virginia', 'navigational-local', null, 'gun-safe-movers'],
    ['Who are the best gun safe movers in Northern Virginia?', 'ai-question', null, 'gun-safe-movers'],
    ['best gun safe movers northern virginia', 'best-choice', null, 'gun-safe-movers'],
    ['how does gun safe moving work in northern virginia', 'how-process', null, 'gun-safe-movers'],
    ['how much do gun safe movers charge in northern virginia', 'cost', null, 'gun-safe-movers'],
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
  'datasets/intent-coverage', 'datasets/search-index', 'datasets/answer-evidence', 'datasets/local-graph-registry', 'datasets/crawl-presence', 'datasets/archive-registry', 'datasets/quote-tool', 'datasets/page-data-pool', 'datasets/catalog-registry', 'datasets/coverage', 'faq', 'moving-questions-answers', // +'datasets/coverage' 2026-11-09 (Territory Matrix P4): the coverage landing carries the full roll-up, like the other estate dataset landings // +'datasets/catalog-registry' 2026-11-03 (Catalog Registry batch): the catalog landing carries the full 32-service roll-up, like the other registry landings
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

// R36 (Money Spot 1 Category Takeover, 2026-11-13): dedicated place
// pages own their (service, place) cells outright. Where a place has
// its own page for a service, the place family binds to that page
// instead of the branch/hub fallback — and because the R30 modal
// binding is computed from the rows these base lanes emit, the modal
// cascade (R30 ingest, R31 build-up, R32 money cells) follows the
// same binding with no per-lane change. Guarded by svcPages exactly
// like branchPage: an unregistered slug falls through to the
// standing resolution, never a hard fail mid-generation.
const PLACE_SERVICE_PAGE = {
  'service-data-center-relocation|place-ashburn-va': 'data-center-movers-ashburn-va',
  'service-data-center-relocation|place-leesburg-va': 'data-center-movers-leesburg-va',
  'service-it-relocation|place-ashburn-va': 'data-center-movers-ashburn-va',
  'service-it-relocation|place-leesburg-va': 'data-center-movers-leesburg-va',
  // R37 (Money Spot 2, 2026-11-13): the gun-safe place pages for the
  // Washington DC head term and the McLean seat own their cells.
  'service-gun-safe|place-washington-dc': 'gun-safe-movers-washington-dc',
  'service-gun-safe|place-mclean-va': 'gun-safe-movers-mclean-va',
  // R38 (Money Spot 3, 2026-11-13): the estate place pages for
  // Middleburg, The Plains and Upperville own their cells across the
  // estate family's three category services — white-glove,
  // piano-antique and crating (the pages are registered under all
  // three services in pages.json, the luxury-estate composite
  // pattern). sir-heavy / long-distance / senior-moving cells for
  // these places stay with their own lanes.
  'service-white-glove|place-middleburg-va': 'estate-movers-middleburg-va',
  'service-white-glove|place-the-plains-va': 'estate-movers-the-plains-va',
  'service-white-glove|place-upperville-va': 'estate-movers-upperville-va',
  'service-piano-antique|place-middleburg-va': 'estate-movers-middleburg-va',
  'service-piano-antique|place-the-plains-va': 'estate-movers-the-plains-va',
  'service-piano-antique|place-upperville-va': 'estate-movers-upperville-va',
  'service-crating|place-middleburg-va': 'estate-movers-middleburg-va',
  'service-crating|place-the-plains-va': 'estate-movers-the-plains-va',
  'service-crating|place-upperville-va': 'estate-movers-upperville-va',
  // R54 (Potomac Flagship Attack, 2026-11-19): the 26 Potomac
  // town pages own their (service, place-potomac-md) cells
  // outright — the flagship hub owns the local-regional cell,
  // the office page also owns the commercial cell, and the
  // industrial page also owns the industrial-commercial cell.
  'service-vault-door|place-potomac-md': 'vault-door-movers-potomac-md',
  'service-sir-heavy|place-potomac-md': 'sir-heavy-movers-potomac-md',
  'service-data-center-relocation|place-potomac-md': 'data-center-movers-potomac-md',
  'service-ispm15|place-potomac-md': 'ispm15-movers-potomac-md',
  'service-crating|place-potomac-md': 'crating-movers-potomac-md',
  'service-warehouse-racking-relocation|place-potomac-md': 'warehouse-racking-relocation-potomac-md',
  'service-warehouse-relocation|place-potomac-md': 'warehouse-relocation-potomac-md',
  'service-it-relocation|place-potomac-md': 'it-equipment-movers-potomac-md',
  'service-ffe-logistics|place-potomac-md': 'ffe-logistics-potomac-md',
  'service-final-mile|place-potomac-md': 'final-mile-movers-potomac-md',
  'service-local-regional|place-potomac-md': 'movers-potomac-md',
  'service-residential|place-potomac-md': 'estate-movers-potomac-md',
  'service-gun-safe|place-potomac-md': 'gun-safe-movers-potomac-md',
  'service-white-glove|place-potomac-md': 'white-glove-delivery-potomac-md',
  'service-piano-antique|place-potomac-md': 'piano-antique-movers-potomac-md',
  'service-senior-moving|place-potomac-md': 'senior-moving-potomac-md',
  'service-packing|place-potomac-md': 'packing-movers-potomac-md',
  'service-moving-and-storage|place-potomac-md': 'moving-and-storage-potomac-md',
  'service-junk-removal|place-potomac-md': 'junk-removal-potomac-md',
  'service-long-distance|place-potomac-md': 'long-distance-movers-potomac-md',
  'service-office-moving|place-potomac-md': 'office-moving-movers-potomac-md',
  'service-commercial|place-potomac-md': 'office-moving-movers-potomac-md',
  'service-industrial-offices|place-potomac-md': 'industrial-offices-movers-potomac-md',
  'service-industrial-commercial|place-potomac-md': 'industrial-offices-movers-potomac-md',
  'service-medical-lab-relocation|place-potomac-md': 'medical-equipment-movers-potomac-md',
  'service-military|place-potomac-md': 'military-movers-potomac-md',
  'service-government|place-potomac-md': 'government-movers-potomac-md',
  'service-hoarding-cleanup|place-potomac-md': 'hoarding-cleanup-potomac-md',
};
function placeServicePage(V, serviceId, placeId) {
  const slug = PLACE_SERVICE_PAGE[serviceId + '|' + placeId];
  return slug && (V.svcPages.get(serviceId) || []).includes(slug) ? slug : null;
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
// --- A5 hex transport (installed 2026-11-22, A5 adoption batch;
// A5-DESIGN §8.5): bulk reads never ride the sqlite3 CLI's -json
// escaper (quadratic in value length, and its output string can
// exceed V8's max string length at the 518k-row census). Values
// ride hex through -list mode: NULL -> char(30); a REAL value ->
// hex(printf('%!.20g', c)) — the rendering sqlite itself uses for
// -json (CAST AS TEXT loses float precision: 0.024399999999999998
// renders as 0.0244); anything else -> hex(CAST(c AS TEXT)).
// Fields are joined by char(31); hex output is [0-9A-F] only, so
// the control-char separators can never collide with data.
// Decoded rows are the same objects JSON.parse(-json output)
// returns (numbers restored per declared column affinity).
// Proven equivalent to the -json path on every production read
// (proof/proof-reads.mjs, 13/13 cases, 2026-11-22). Returns null
// when the query is not a simple single-table SELECT — aggregates
// and joins keep the caller's existing path.
const _sqlHexInfo = new Map();
function _sqlHexTableInfo(dbPath, table) {
  if (!_sqlHexInfo.has(table)) {
    const out = execFileSync('sqlite3', ['-list', '-noheader', dbPath, 'PRAGMA table_info(' + table + ');']).toString();
    const m = new Map();
    for (const line of out.trim().split('\n')) {
      if (!line) continue;
      const p = line.split('|');
      m.set(p[1], (p[2] || '').toUpperCase());
    }
    _sqlHexInfo.set(table, m);
  }
  return _sqlHexInfo.get(table);
}
function sqlHex(dbPath, sql) {
  const m = /^\s*SELECT\s+(.+?)\s+FROM\s+([A-Za-z_][A-Za-z0-9_]*)\s*(.*?)\s*;?\s*$/is.exec(sql);
  if (!m) return null;
  const listRaw = m[1], table = m[2], tail = m[3];
  if (listRaw.indexOf('(') >= 0) return null;
  const info = _sqlHexTableInfo(dbPath, table);
  const items = [];
  for (const part of listRaw.split(',')) {
    const p = part.trim();
    if (p === '*') {
      for (const name of info.keys()) items.push({ col: name, key: name });
      continue;
    }
    const im = /^([A-Za-z_][A-Za-z0-9_]*)(?:\s+(?:AS\s+)?([A-Za-z_][A-Za-z0-9_]*))?$/i.exec(p);
    if (!im) return null;
    items.push({ col: im[1], key: im[2] || im[1] });
  }
  if (!items.length) return null;
  const fields = items.map((it) =>
    'CASE WHEN ' + it.col + ' IS NULL THEN char(30) WHEN typeof(' + it.col + ") = 'real' THEN hex(printf('%!.20g', " + it.col + ')) ELSE hex(CAST(' + it.col + ' AS TEXT)) END'
  ).join(' || char(31) || ');
  const buf = execFileSync('sqlite3', ['-list', '-noheader', dbPath,
    'SELECT ' + fields + ' FROM ' + table + (tail ? ' ' + tail : '') + ';'],
    { maxBuffer: 1536 * 1024 * 1024 });
  // Buffer-native line split: a full-table hex payload exceeds
  // V8's max string length, so lines are sliced as bytes and each
  // field decoded from hex directly.
  const rows = [];
  const decodeLine = (line) => {
    const f = line.split('\x1f');
    const o = {};
    items.forEach((it, i) => {
      const v = f[i];
      if (v === '\x1e' || v === undefined) { o[it.key] = null; return; }
      const s = Buffer.from(v, 'hex').toString('utf8');
      const t = info.get(it.col) || '';
      if (/INT/.test(t) || /REAL|FLOA|DOUB/.test(t)) o[it.key] = s === '' ? null : Number(s);
      else o[it.key] = s;
    });
    rows.push(o);
  };
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0a) { decodeLine(buf.toString('latin1', start, i)); start = i + 1; }
  }
  if (start < buf.length) decodeLine(buf.toString('latin1', start));
  return rows;
}
function sqliteJson(sql) {
  try {
    // A5: simple single-table selects ride the hex transport; the
    // -json path remains for aggregates (COUNT) and anything the
    // hex parser declines.
    const hexRows = sqlHex(DB_PATH, sql);
    if (hexRows) return hexRows;
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

  // ── GEO RECORD — the generator's canonical geo input (Geo
  // Batch 2026-11-21, GEO-BATCH-SPEC step 3): ONE loader reads
  // data/geo-enriched.json and every ZIP lane below takes its
  // ZIPs from the record's verified zip_set — never from the
  // geojson postal_code or a registry mirror. Six record ZIPs
  // were corrected in the 2026-11-21 screen (Capon Springs
  // 26823→26808, Arkansas 26755→26801, Lost River 26801→26810,
  // Peru 26836→26838, Rawley Springs 22802→22831, Parkins Mills
  // 22602→22663); the mirrors still carry the old values by
  // design, and lanes reading them minted stale ZIP rows — the
  // defect this loader removes at source.
  const GEO_REC = (() => {
    const gp = path.join(DATA_ROOT, 'geo-enriched.json');
    if (!fs.existsSync(gp)) throw new Error('geo record: data/geo-enriched.json missing — the geo record is the generator canonical input (Geo Batch 2026-11-21)');
    return JSON.parse(fs.readFileSync(gp, 'utf8'));
  })();
  const GEO_BY_ID = new Map((GEO_REC.features || []).map((f) => [f.id, f]));
  const geoZipSet = (placeId) => {
    const rec = GEO_BY_ID.get(placeId);
    return rec && Array.isArray(rec.zip_set) ? rec.zip_set.map((z) => z.zip) : [];
  };
  const geoZipPrimary = (placeId) => geoZipSet(placeId)[0] || null;
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
      const target = placeServicePage(V, id, p.id) || (p.branch === 'winchester' || p.branch === 'martinsburg'
        ? (bp[p.branch] || hub) : hub);
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
      const target = placeServicePage(V, id, p.id) || (p.branch === 'winchester' || p.branch === 'martinsburg'
        ? (bp[p.branch] || hub) : hub);
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
            const target = placeServicePage(V, serviceId, p.id) || (p.branch === 'winchester' || p.branch === 'martinsburg'
              ? (branchPage(R, V, serviceId, p.branch) || HUB[serviceId]) : HUB[serviceId]);
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
      // R26 (2026-11-11): branch places resolve to their branch hub
      // FIRST — the hubs own the head family (Branch Head-Term
      // Seizure). Before R26, Martinsburg's generic-local rows bound
      // to /martinsburg-wv-movers-full-service-guide/ because the
      // guide candidate was tried first; the guide keeps its own
      // guide-intent rows (R13/R14) but no longer carries the branch
      // head signal. Winchester already resolved to its hub (no guide
      // page exists there), so the reorder changes Martinsburg only.
      const cands = p.type === 'branch'
        ? ['moving-company-' + ts, ts + '-movers-full-service-guide']
        : [ts + '-movers-full-service-guide', 'moving-company-' + ts];
      for (const cand of cands) {
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

  // R22 Near-me domination (2026-11-10): the GSC-observed head phrasings
  // of the two money query families sat at evidence-unattached — no
  // service phrase in PHRASE generates them ("movers" bare belongs to no
  // service), so the exact strings searchers type had no row at all:
  // "movers near me" (368 impressions, position ~4.6), "moving companies
  // near me" (128), "safe moving company near me" (67), "moving company
  // near me" (62), "winchester movers near me" (47), "safe movers near
  // me" (Trends' #2 related query for "safe movers", index 79). Bound
  // here, in generator config, to the owning services — the bindings the
  // attached sibling rows already carry ('local movers near me' ->
  // service-local-regional, 'best movers near me' ->
  // service-residential, 'gun safe movers near me' -> service-gun-safe)
  // — at full near-me depth (bare / best / cost forms, R17's shape) plus
  // the one observed place form. Rows remain generated, gated and
  // deduped by the same emit() path as every other pattern.
  {
    const NM = [
      // service-local-regional owns the generic movers family (R21).
      ['service-local-regional', 'navigational-local', 'movers near me', 'local-regional-moving'],
      ['service-local-regional', 'navigational-local', 'moving companies near me', 'local-regional-moving'],
      ['service-local-regional', 'navigational-local', 'moving company near me', 'local-regional-moving'],
      ['service-local-regional', 'navigational-local', 'local moving companies near me', 'local-regional-moving'],
      ['service-local-regional', 'navigational-local', 'local moving company near me', 'local-regional-moving'],
      ['service-local-regional', 'navigational-local', 'moving services near me', 'local-regional-moving'],
      ['service-local-regional', 'navigational-local', 'flat rate movers near me', 'local-regional-moving'],
      ['service-local-regional', 'navigational-local', 'moving near me', 'local-regional-moving'],
      ['service-local-regional', 'navigational-local', 'furniture movers near me', 'local-regional-moving'],
      ['service-local-regional', 'best-choice', 'best movers near me', 'local-regional-moving'],
      ['service-local-regional', 'best-choice', 'best moving companies near me', 'local-regional-moving'],
      ['service-local-regional', 'cost', 'movers cost near me', 'local-regional-moving'],
      ['service-local-regional', 'cost', 'how much do movers cost near me', 'local-regional-moving'],
      ['service-local-regional', 'cost', 'cost of movers near me', 'local-regional-moving'],
      // service-residential: second binding for the head phrase.
      ['service-residential', 'navigational-local', 'movers near me', 'residential-moving'],
      // service-gun-safe owns the safe near-me family.
      ['service-gun-safe', 'navigational-local', 'safe movers near me', 'gun-safe-movers'],
      ['service-gun-safe', 'navigational-local', 'safe moving company near me', 'gun-safe-movers'],
      ['service-gun-safe', 'navigational-local', 'gun safe moving company near me', 'gun-safe-movers'],
      ['service-gun-safe', 'navigational-local', 'professional gun safe movers near me', 'gun-safe-movers'],
      ['service-gun-safe', 'best-choice', 'best safe movers near me', 'gun-safe-movers'],
      ['service-gun-safe', 'cost', 'safe movers near me prices', 'gun-safe-movers'],
      ['service-gun-safe', 'cost', 'safe movers cost near me', 'gun-safe-movers'],
      ['service-gun-safe', 'cost', 'how much do safe movers cost near me', 'gun-safe-movers'],
      // service-sir-heavy: the protocol behind safe moving answers too.
      ['service-sir-heavy', 'navigational-local', 'safe movers near me', 'heavy'],
    ];
    for (const [sid, cls, text, target] of NM) emit(sid, cls, text, null, target, 'R22-near-me-domination');
    emit('service-local-regional', 'navigational-local', 'winchester movers near me', 'place-winchester-va', 'local-regional-movers-winchester-va', 'R22-near-me-domination-place');
  }

  // R22 extension — White-Glove Wave 1 (2026-11-10): the audit found R22
  // minted ZERO white-glove rows — the service phrase is "delivery", so
  // the movers/moving phrasings people actually type ("white glove movers
  // near me", "white glove movers winchester va", "white glove movers
  // martinsburg wv") had no row under any service, and the Martinsburg
  // branch page did not exist. Bound here through the same gated emit()
  // path, at R17/R22 depth (bare / best / cost) for the near-me family,
  // plus the town forms to their branch pages.
  {
    const WG = [
      ['navigational-local', 'white glove movers near me', null, 'white-glove-delivery'],
      ['navigational-local', 'white glove moving near me', null, 'white-glove-delivery'],
      ['navigational-local', 'white glove moving company near me', null, 'white-glove-delivery'],
      ['best-choice', 'best white glove movers near me', null, 'white-glove-delivery'],
      ['cost', 'white glove movers near me prices', null, 'white-glove-delivery'],
      ['cost', 'white glove movers cost near me', null, 'white-glove-delivery'],
      ['cost', 'how much do white glove movers cost near me', null, 'white-glove-delivery'],
      ['navigational-local', 'white glove movers winchester va', 'place-winchester-va', 'white-glove-delivery-winchester-va'],
      ['navigational-local', 'white glove delivery martinsburg wv', 'place-martinsburg-wv', 'white-glove-delivery-martinsburg-wv'],
      ['navigational-local', 'white glove movers martinsburg wv', 'place-martinsburg-wv', 'white-glove-delivery-martinsburg-wv'],
    ];
    for (const [cls, text, place, target] of WG) emit('service-white-glove', cls, text, place, target, 'R22-white-glove-wave1');
  }

  // R23 Pack Claim (2026-11-10): the ten scouted map packs. The exact
  // lowercase strings searchers type for the satellite towns ("movers
  // in strasburg va", "moving company charles town wv") had no row at
  // all — the generic family mints mixed-case forms bound to the
  // service hubs. Bound here, through the same gated emit() path, to
  // the new town landing pages built for the pack claims (owner order
  // 2026-11-10: all ten packs). Hub-bound mixed-case rows are NOT
  // re-pointed; the matrix keeps its bindings. Martinsburg gun-safe
  // already carries its exact row (R-family) to its branch page — no
  // R23 row needed there.
  {
    const TOWNS = [
      ['place-strasburg-va', 'strasburg va', 'movers-in-strasburg-va'],
      ['place-woodstock-va', 'woodstock va', 'movers-in-woodstock-va'],
      ['place-new-market-va', 'new market va', 'movers-in-new-market-va'],
      ['place-berryville-va', 'berryville va', 'movers-in-berryville-va'],
      ['place-berkeley-springs-wv', 'berkeley springs wv', 'moving-company-berkeley-springs-wv'],
      ['place-charles-town-wv', 'charles town wv', 'moving-company-charles-town-wv'],
      ['place-shepherdstown-wv', 'shepherdstown wv', 'movers-in-shepherdstown-wv'],
      ['place-inwood-wv', 'inwood wv', 'moving-company-inwood-wv'],
      // Three-Town Authority (2026-11-12): Front Royal was a pack
      // target in R23's own batch, but only its white-glove page was
      // built then — the movers forms had no page to bind. The town
      // page now exists; the same seven forms bind to it here.
      ['place-front-royal-va', 'front royal va', 'movers-in-front-royal-va'],
    ];
    for (const [place, n, target] of TOWNS) {
      emit('service-local-regional', 'navigational-local', 'movers in ' + n, place, target, 'R23-pack-claim');
      emit('service-local-regional', 'navigational-local', 'moving company ' + n, place, target, 'R23-pack-claim');
      emit('service-local-regional', 'navigational-local', 'movers ' + n, place, target, 'R23-pack-claim');
      emit('service-local-regional', 'navigational-local', n + ' movers', place, target, 'R23-pack-claim');
      emit('service-local-regional', 'best-choice', 'best movers in ' + n, place, target, 'R23-pack-claim');
      emit('service-local-regional', 'cost', 'movers cost in ' + n, place, target, 'R23-pack-claim');
      emit('service-local-regional', 'cost', 'how much do movers cost in ' + n, place, target, 'R23-pack-claim');
    }
    const WGF = [
      ['navigational-local', 'white glove delivery front royal va'],
      ['navigational-local', 'white glove delivery in front royal va'],
      ['navigational-local', 'white glove movers front royal va'],
      ['navigational-local', 'white glove movers in front royal va'],
      ['best-choice', 'best white glove delivery front royal va'],
      ['cost', 'white glove delivery cost in front royal va'],
    ];
    for (const [cls, text] of WGF) emit('service-white-glove', cls, text, 'place-front-royal-va', 'white-glove-delivery-front-royal-va', 'R23-pack-claim-white-glove');
  }

  // R24 Washington VA Seize (2026-11-10): the competitive audit of
  // Washington VA / Rappahannock County (24 queries: 7 empty, 14 weak,
  // 3 defended) found exactly one FRM presence — 'gun safe movers
  // washington va' at #1 on the general hub — and no row at all for
  // the town, the county, or Sperryville. Bound here, through the same
  // gated emit() path, to the new town landing page built for the
  // seize (owner order 2026-11-10). The town was then outside the
  // published footprint (New Market precedent: page + bindings, no
  // geojson change — New Market itself joined the footprint on
  // 2026-11-12 in batch-six-town-follow-on-2026-11-12); on
  // 2026-11-12 Washington joined the published
  // footprint as place-washington-va (Winchester branch) in
  // service-area.geojson, with the full build (geo + matrix +
  // rubric) in batch-washington-va-full-build-2026-11-12. Defended
  // families (senior movers, junk removal) are bound
  // on their real-service forms — the flank, not a frontal assault.
  {
    const T = 'movers-in-washington-va';
    const W = 'place-washington-va', C = 'place-rappahannock-county-va', S = 'place-sperryville-va';
    // Town core — the R23 forms plus the audited near/local/long-
    // distance empties and the two weak commercial-side seats.
    for (const [sid, cls, text] of [
      ['service-local-regional', 'navigational-local', 'movers in washington va'],
      ['service-local-regional', 'navigational-local', 'moving company washington va'],
      ['service-local-regional', 'navigational-local', 'movers washington va'],
      ['service-local-regional', 'navigational-local', 'washington va movers'],
      ['service-local-regional', 'navigational-local', 'movers near washington va'],
      ['service-local-regional', 'navigational-local', 'local movers washington va'],
      ['service-local-regional', 'best-choice', 'best movers in washington va'],
      ['service-local-regional', 'best-choice', 'best movers washington va'],
      ['service-local-regional', 'cost', 'movers cost in washington va'],
      ['service-local-regional', 'cost', 'how much do movers cost in washington va'],
      ['service-long-distance', 'navigational-local', 'long distance movers washington va'],
      ['service-office-moving', 'navigational-local', 'office movers washington va'],
      ['service-moving-and-storage', 'navigational-local', 'storage washington va'],
    ]) emit(sid, cls, text, W, T, 'R24-washington-va-seize');
    // County forms — the audit's empty county queries.
    for (const [sid, cls, text] of [
      ['service-local-regional', 'navigational-local', 'moving company rappahannock county va'],
      ['service-local-regional', 'navigational-local', 'movers in rappahannock county va'],
      ['service-local-regional', 'navigational-local', 'movers rappahannock county va'],
      ['service-gun-safe', 'navigational-local', 'safe movers rappahannock county va'],
      ['service-gun-safe', 'navigational-local', 'gun safe movers rappahannock county va'],
      ['service-commercial', 'navigational-local', 'commercial moving company rappahannock county va'],
      ['service-commercial', 'navigational-local', 'commercial movers rappahannock county va'],
      ['service-hoarding-cleanup', 'navigational-local', 'hoarding cleanup rappahannock county va'],
      ['service-junk-removal', 'navigational-local', 'estate cleanout rappahannock county va'],
    ]) emit(sid, cls, text, C, T, 'R24-washington-va-seize-county');
    // Specialty forms bound to the town page — gun safe extends the
    // existing #1; white-glove takes the empty seat; the cleanout
    // family binds the real-service phrasings.
    for (const [sid, cls, text] of [
      ['service-gun-safe', 'navigational-local', 'gun safe movers washington va'],
      ['service-gun-safe', 'navigational-local', 'gun safe moving washington va'],
      ['service-gun-safe', 'navigational-local', 'safe movers washington va'],
      ['service-piano-antique', 'navigational-local', 'piano movers washington va'],
      ['service-piano-antique', 'navigational-local', 'piano moving washington va'],
      ['service-piano-antique', 'navigational-local', 'antique movers washington va'],
      ['service-piano-antique', 'navigational-local', 'antique moving washington va'],
      ['service-packing', 'navigational-local', 'packing services washington va'],
      ['service-sir-heavy', 'navigational-local', 'heavy item movers washington va'],
      ['service-sir-heavy', 'navigational-local', 'heavy item moving washington va'],
      ['service-senior-moving', 'navigational-local', 'senior movers washington va'],
      ['service-senior-moving', 'navigational-local', 'senior moving washington va'],
      ['service-white-glove', 'navigational-local', 'white glove delivery washington va'],
      ['service-white-glove', 'navigational-local', 'white glove delivery in washington va'],
      ['service-white-glove', 'navigational-local', 'white glove movers washington va'],
      ['service-junk-removal', 'navigational-local', 'junk removal washington va'],
      ['service-junk-removal', 'navigational-local', 'junk removal services washington va'],
      ['service-junk-removal', 'navigational-local', 'estate cleanout washington va'],
      ['service-junk-removal', 'navigational-local', 'estate cleanouts washington va'],
      ['service-hoarding-cleanup', 'navigational-local', 'hoarding cleanup washington va'],
      ['service-hoarding-cleanup', 'navigational-local', 'hoarding cleanout washington va'],
    ]) emit(sid, cls, text, W, T, 'R24-washington-va-seize-specialty');
    // Sperryville — the satellite door: bindings to the county-seat
    // page (same county, same branch, same facts; no separate page).
    for (const [sid, cls, text] of [
      ['service-local-regional', 'navigational-local', 'movers sperryville va'],
      ['service-local-regional', 'navigational-local', 'movers in sperryville va'],
      ['service-local-regional', 'navigational-local', 'moving company sperryville va'],
      ['service-local-regional', 'navigational-local', 'sperryville va movers'],
      ['service-local-regional', 'best-choice', 'best movers in sperryville va'],
      ['service-local-regional', 'cost', 'how much do movers cost in sperryville va'],
      ['service-gun-safe', 'navigational-local', 'gun safe movers sperryville va'],
      ['service-white-glove', 'navigational-local', 'white glove delivery sperryville va'],
    ]) emit(sid, cls, text, S, T, 'R24-washington-va-seize-sperryville');
  }

  // R25 White-Glove Wave 2 — Freight / Pad Wrap (2026-11-11): the
  // pad-wrap / blanket-wrap terminology family from the owner's
  // research package (queries Q11-Q16, Q18) had ZERO rows under any
  // service — the freight-side phrasings shippers and brokers type
  // ("pad wrap shipping", "blanket wrap carriers near me") were
  // unbound while the consumer white-glove family (R22 wave 1) was
  // bound. Bound here, through the same gated emit() path, to the new
  // freight-facing page /pad-wrap-blanket-wrap-shipping/, plus the two
  // white-glove-led terminology forms to the hub. Q17 ("air ride
  // blanket wrap trucking") is deliberately NOT bound and NOT
  // answered: air-ride is a quarantined vendor spec, never a company
  // claim (wave-1 adjudication of the same package).
  {
    const P = 'pad-wrap-blanket-wrap-shipping';
    for (const [cls, text] of [
      // Terminology core — the bridge itself (Q11-Q13).
      ['ai-question', 'what is pad wrap shipping'],
      ['ai-question', 'what is blanket wrap shipping'],
      ['ai-question', 'are pad wrap and blanket wrap the same thing'],
      ['ai-question', 'difference between pad wrap and blanket wrap'],
      ['navigational-local', 'pad wrap shipping'],
      ['navigational-local', 'blanket wrap shipping'],
      // Service forms — how the freight audience names the work.
      ['navigational-local', 'pad wrap movers'],
      ['navigational-local', 'pad wrapped movers'],
      ['navigational-local', 'blanket wrap movers'],
      ['navigational-local', 'pad wrap freight'],
      ['navigational-local', 'blanket wrapped freight'],
      ['navigational-local', 'pad wrap furniture shipping'],
      ['navigational-local', 'blanket wrap furniture shipping'],
      ['navigational-local', 'blanket wrap delivery service'],
      // Comparisons (Q14-Q15) — bare forms, estate convention.
      ['navigational-local', 'pad wrap vs ltl freight for furniture'],
      ['navigational-local', 'blanket wrap vs crating'],
      ['navigational-local', 'pad wrap vs crating'],
      // Cost family (Q16) — priced per job; no figures published.
      ['cost', 'blanket wrap shipping cost'],
      ['cost', 'pad wrap shipping cost'],
      ['cost', 'how much does blanket wrap shipping cost'],
      // Carrier / near-me family (Q18) + the regional forms.
      ['navigational-local', 'blanket wrap carriers near me'],
      ['navigational-local', 'blanket wrap shipping near me'],
      ['navigational-local', 'pad wrap shipping near me'],
      ['best-choice', 'best blanket wrap carriers near me'],
      ['navigational-local', 'blanket wrap shipping virginia'],
      ['navigational-local', 'pad wrap shipping virginia'],
      ['navigational-local', 'blanket wrap shipping west virginia'],
    ]) emit('service-white-glove', cls, text, null, P, 'R25-white-glove-wave2-padwrap');
    // White-glove-led terminology forms — the consumer side of the
    // bridge, bound to the hub that carries the written scope matrix.
    for (const [cls, text] of [
      ['navigational-local', 'white glove pad wrap'],
      ['navigational-local', 'white glove blanket wrap'],
    ]) emit('service-white-glove', cls, text, null, 'white-glove-delivery', 'R25-white-glove-wave2-hub');
  }

  // R26 Branch Head-Term Seizure (2026-11-11): the Wave-1 live probe
  // (52 place-anchored searches) plus GSC showed the two branch
  // cities' head terms split and thin — the homepage outranks the
  // branch pages in GSC while the rubric's head family was a sliver
  // (one service row per form for Winchester; the Martinsburg forms
  // bound to a guide page; reversed and near forms at zero rows).
  // The order is redefined here: ONE owner per query family.
  // (a) The 12 head forms x both branch cities x all 34 services
  // bind to the branch hub pages — the same shape 'moving company
  // martinsburg wv' already carried — in the lowercase forms
  // searchers type (GSC-observed). Reversed and near forms included.
  // (b) The R21 generic Martinsburg rows rebind from the guide to
  // the branch hub via the genericTarget reorder above.
  // (c) The Wave-1 service misses bind, for both cities, to their
  // existing owner pages (DESIGN ownership map); head-adjacent
  // services (senior, junk, storage, commercial) also gain a
  // branch-hub row under service-local-regional, the generic-local
  // owner (R21/R22 precedent).
  // (d) Deep local/residential forms seat on the local-regional
  // branch pages. No homepage rows exist for these forms and none
  // are emitted — the hubs are the only bindings.
  {
    // LANE SPLIT (measured on this batch's first regen): the branch
    // hubs are R14 roll-up pages (type 'location', no registry
    // services) — R14 skips any page an earlier row already targets,
    // so emitting hub-bound rows here displaced the hubs' 68 R14
    // roll-up rows (the 'moving company' title form x 34 among
    // them). The estate's standing answer is the late lane
    // (PANEL_LATE_ROWS precedent): everything bound for the two
    // branch hubs emits in the R26 late lane AFTER R14 (below);
    // this early lane carries only the owner-page rows.
    const CITIES = [
      { place: 'place-winchester-va', city: 'winchester va', lr: 'local-regional-movers-winchester-va' },
      { place: 'place-martinsburg-wv', city: 'martinsburg wv', lr: 'local-regional-movers-martinsburg-wv' },
    ];
    for (const c of CITIES) {
      for (const [sid, cls, form] of [
        ['service-local-regional', 'navigational-local', 'local movers in {c}'],
        ['service-local-regional', 'navigational-local', 'residential movers in {c}'],
        ['service-residential', 'navigational-local', 'residential movers in {c}'],
        ['service-residential', 'navigational-local', 'residential moving {c}'],
        ['service-local-regional', 'navigational-local', 'local moving {c}'],
      ]) emit(sid, cls, form.split('{c}').join(c.city), c.place, c.lr, 'R26-branch-head-deep');
    }
    // Service-miss forms — Winchester.
    for (const [sid, cls, text, target] of [
      ['service-packing', 'navigational-local', 'packing services winchester va', 'packing-services-winchester-va'],
      ['service-white-glove', 'navigational-local', 'white glove delivery winchester va', 'white-glove-delivery-winchester-va'],
      ['service-white-glove', 'navigational-local', 'white glove movers winchester va', 'white-glove-delivery-winchester-va'],
      ['service-hoarding-cleanup', 'navigational-local', 'hoarding cleanup winchester va', 'hoarding-cleanup-winchester-va'],
      ['service-medical-lab-relocation', 'navigational-local', 'medical equipment movers winchester va', 'medical-equipment-movers-winchester-va'],
      ['service-medical-lab-relocation', 'navigational-local', 'medical equipment movers in winchester va', 'medical-equipment-movers-winchester-va'],
      ['service-long-distance', 'navigational-local', 'long distance movers winchester va', 'long-distance-movers-winchester-va'],
      ['service-senior-moving', 'navigational-local', 'senior movers winchester va', 'senior-moving'],
      ['service-piano-antique', 'navigational-local', 'piano movers winchester va', 'piano-antique-white-glove-moving'],
      ['service-junk-removal', 'navigational-local', 'junk removal winchester va', 'junk-removal'],
      ['service-moving-and-storage', 'navigational-local', 'moving and storage winchester va', 'moving-and-storage'],
      ['service-sir-heavy', 'navigational-local', 'heavy item movers winchester va', 'heavy'],
      ['service-final-mile', 'navigational-local', 'final mile delivery winchester va', 'final-mile-delivery'],
    ]) emit(sid, cls, text, 'place-winchester-va', target, 'R26-service-miss-winchester');
    // Service-miss forms — Martinsburg.
    for (const [sid, cls, text, target] of [
      ['service-packing', 'navigational-local', 'packing services martinsburg wv', 'packing-movers-martinsburg-wv'],
      ['service-commercial', 'navigational-local', 'commercial movers martinsburg wv', 'commercial-moving'],
      ['service-gun-safe', 'navigational-local', 'gun safe movers martinsburg wv', 'gun-safe-movers-martinsburg-wv'],
      ['service-sir-heavy', 'navigational-local', 'gun safe movers martinsburg wv', 'gun-safe-movers-martinsburg-wv'],
      ['service-white-glove', 'navigational-local', 'white glove delivery martinsburg wv', 'white-glove-delivery-martinsburg-wv'],
      ['service-senior-moving', 'navigational-local', 'senior movers martinsburg wv', 'senior-moving'],
      ['service-junk-removal', 'navigational-local', 'junk removal martinsburg wv', 'junk-removal'],
      ['service-moving-and-storage', 'navigational-local', 'moving and storage martinsburg wv', 'moving-and-storage'],
    ]) emit(sid, cls, text, 'place-martinsburg-wv', target, 'R26-service-miss-martinsburg');
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

  // R26 late lane (Branch Head-Term Seizure, 2026-11-11): the head
  // family for the two branch cities, emitted AFTER R14 so the
  // branch hubs keep their roll-up rows (lane-split note at the R26
  // early lane). The DESIGN's 12 forms x 2 cities x all 34 services,
  // target = the branch hub, in the lowercase forms searchers type;
  // the two reversed forms emit in BOTH typed spellings ('winchester
  // movers' — the GSC-observed form — and 'winchester va movers'),
  // making 14 forms. Plus the branch-hub rows for the head-adjacent
  // service misses, under service-local-regional (the generic-local
  // owner, R21/R22 precedent).
  {
    const CITIES = [
      { place: 'place-winchester-va', city: 'winchester va', town: 'winchester', hub: 'moving-company-winchester-va' },
      { place: 'place-martinsburg-wv', city: 'martinsburg wv', town: 'martinsburg', hub: 'moving-company-martinsburg-wv' },
    ];
    const HEADS = [
      ['navigational-local', 'movers {c}'],
      ['navigational-local', '{c} movers'],
      ['navigational-local', '{t} movers'],
      ['navigational-local', 'moving company {c}'],
      ['navigational-local', '{c} moving company'],
      ['navigational-local', '{t} moving company'],
      ['navigational-local', 'moving companies {c}'],
      ['navigational-local', 'local movers {c}'],
      ['best-choice', 'best movers {c}'],
      ['navigational-local', 'movers in {c}'],
      ['navigational-local', 'movers near {c}'],
      ['navigational-local', 'moving companies near {c}'],
      ['navigational-local', 'moving services {c}'],
      ['navigational-local', 'residential movers {c}'],
    ];
    for (const c of CITIES) {
      for (const svc of R.services.services) {
        for (const [cls, form] of HEADS) {
          emit(svc.id, cls, form.split('{c}').join(c.city).split('{t}').join(c.town), c.place, c.hub, 'R26-branch-head-family');
        }
      }
    }
    for (const [sid, text, place, target] of [
      ['service-local-regional', 'senior movers winchester va', 'place-winchester-va', 'moving-company-winchester-va'],
      ['service-local-regional', 'junk removal winchester va', 'place-winchester-va', 'moving-company-winchester-va'],
      ['service-local-regional', 'moving and storage winchester va', 'place-winchester-va', 'moving-company-winchester-va'],
      ['service-local-regional', 'commercial movers martinsburg wv', 'place-martinsburg-wv', 'moving-company-martinsburg-wv'],
      ['service-local-regional', 'senior movers martinsburg wv', 'place-martinsburg-wv', 'moving-company-martinsburg-wv'],
      ['service-local-regional', 'junk removal martinsburg wv', 'place-martinsburg-wv', 'moving-company-martinsburg-wv'],
      ['service-local-regional', 'moving and storage martinsburg wv', 'place-martinsburg-wv', 'moving-company-martinsburg-wv'],
    ]) emit(sid, 'navigational-local', text, place, target, 'R26-branch-head-hubrows');
    // Roll-up restore: the R21 reorder makes Martinsburg's generic
    // forms target the hub, which marks the hub targeted before R14
    // — R14 then skips it, and its title-form roll-up rows
    // ('moving company' x 34 services) would silently vanish (the
    // displacement the R14 header itself warns about; measured on
    // this batch's second regen: exactly -34). Re-emitted here in
    // the late lane, identical in text, class, service set and
    // target to the rows R14 produced before the reorder.
    // Winchester's hub was already R21-targeted before R26, so it
    // never carried these rows and needs no restore.
    for (const svc of R.services.services) {
      emit(svc.id, 'navigational-local', 'moving company', null, 'moving-company-martinsburg-wv', 'R26-rollup-restore');
    }
  }

  // R27 Head-Form Completion (2026-11-12): the full-estate audit of
  // all 83 geojson features (case-insensitive exact reads of
  // rubric.db; batch record: out/batch-head-form-rubric-buildup-
  // 2026-11-12) found the generic head family still missing its
  // exact lowercase forms. For all 62 cities: "<town> movers",
  // "moving company in <town> <st>", "residential movers
  // <town> <st>" and "moving companies in <town> <st>" sat at zero
  // rows in any case, and "movers near <town> <st>" existed only
  // for Washington (R24). The two branch hubs already carried
  // "<town> movers", "residential movers <town> <st>" and "movers
  // near <town> <st>" via the R26 late lane, but lacked the two
  // "in" forms. The 12 county families lacked all six forms in
  // their state-suffixed spellings (their stateless spellings are
  // R21's county lane and stay untouched). "best movers in
  // <town> <st>" audited PRESENT in every city and branch family
  // (R21 written forms; lowercase via R23 for the pack towns) and
  // is NOT emitted for towns. Emitted here — in the late lane,
  // after R14 and the R26 branch lane, so no roll-up row can be
  // displaced — through the same gated emit() path, under
  // service-local-regional (the generic-local owner, R21/R23
  // precedent), bound by the R21 genericTarget resolution
  // (headTarget below is that function, carried verbatim) so each
  // place's new rows land on the exact page its family already
  // targets: the town page where one exists, the owning spoke or
  // hub where none does, the branch hub for branch places.
  // Dedupe keeps every pre-existing binding — Washington's R24
  // "movers near washington va" row stands, and the branch hubs'
  // R26 rows are not re-minted. The 7 landmark / region /
  // corridor features carry no rubric family (zero rows) and are
  // out of scope.
  // Name collision (measured on this batch's first regen): the
  // bare "<town> movers" string is unique per service in the bank,
  // and two features share the town name Washington — Washington,
  // VA (own movers page, the seized town) and Washington, DC (no
  // page of its own; its family binds the local-regional hub).
  // F1 therefore emits dedicated-target places BEFORE hub-bound
  // ones: the place with its own page owns the bare string, and a
  // hub-bound same-name place's F1 emit dedupes against it. Every
  // other form carries the state suffix and cannot collide.
  {
    const SID = 'service-local-regional';
    const townSlugOf = (name) => name.toLowerCase().replace(/,\s*/g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const headTarget = (p) => {
      const ts = townSlugOf(p.name);
      const cands = p.type === 'branch'
        ? ['moving-company-' + ts, ts + '-movers-full-service-guide']
        : [ts + '-movers-full-service-guide', 'moving-company-' + ts];
      for (const cand of cands) {
        if (V.pageBySlug.has(cand)) return cand;
      }
      const spokes = (V.svcPages.get(SID) || []).filter((s) => s.includes(ts));
      return spokes[0] || HUB[SID];
    };
    const townPlaces = features
      .filter((x) => x.properties.type === 'city' || x.properties.type === 'branch')
      .map((f) => ({ p: f.properties, target: headTarget(f.properties) }));
    const f1Order = townPlaces.slice().sort((a, b) =>
      (a.target === HUB[SID] ? 1 : 0) - (b.target === HUB[SID] ? 1 : 0));
    for (const { p, target } of f1Order) {
      const town = p.name.split(',')[0].trim().toLowerCase();
      emit(SID, 'navigational-local', town + ' movers', p.id, target, 'R27-head-town-movers');
    }
    for (const { p, target } of townPlaces) {
      const townst = p.name.replace(/,\s*/g, ' ').toLowerCase();
      emit(SID, 'navigational-local', 'moving company in ' + townst, p.id, target, 'R27-head-company-in');
      emit(SID, 'navigational-local', 'residential movers ' + townst, p.id, target, 'R27-head-residential');
      emit(SID, 'navigational-local', 'movers near ' + townst, p.id, target, 'R27-head-near');
      emit(SID, 'navigational-local', 'moving companies in ' + townst, p.id, target, 'R27-head-companies-in');
    }
    for (const f of features.filter((x) => x.properties.type === 'county')) {
      const p = f.properties;
      const target = headTarget(p);
      const town = p.name.trim().toLowerCase();
      const townst = town + ' ' + (p.state || '').toLowerCase();
      emit(SID, 'navigational-local', town + ' movers', p.id, target, 'R27-head-county-movers');
      emit(SID, 'navigational-local', 'moving company in ' + townst, p.id, target, 'R27-head-county-company-in');
      emit(SID, 'navigational-local', 'residential movers ' + townst, p.id, target, 'R27-head-county-residential');
      emit(SID, 'navigational-local', 'movers near ' + townst, p.id, target, 'R27-head-county-near');
      emit(SID, 'navigational-local', 'moving companies in ' + townst, p.id, target, 'R27-head-county-companies-in');
      emit(SID, 'best-choice', 'best movers in ' + townst, p.id, target, 'R27-head-county-best-in');
    }
  }

  // R28 Stub-Family Completion (Scope B, 2026-11-12): the two
  // geo-less place families — place-sperryville-va (8 rows, 3/34
  // services) and place-rappahannock-county-va (9 rows, 5/34) —
  // exist only as R24 seize rows. They have NO service-area.geojson
  // feature (the footprint stays 83 features in this batch), so the
  // footprint-gated lanes (R2/R16/R19-local, R21, R27) can never
  // reach them. This lane emits, for both families, exactly what
  // those lanes would have emitted had the features existed: the
  // per-service town template (the R2 place form + the five R16
  // cost/best/how forms + the service's question-bank-v2 local
  // ai-questions, instantiated with the family's own area name
  // through the same americanize + {area} substitution R19 uses)
  // and the generic head family under service-local-regional
  // (R21's 14 forms in both written forms for the Sperryville city
  // shape; R21's 2 effective county forms + R27's 6 state-suffixed
  // county forms for Rappahannock County; R27's 5 lowercase head
  // forms for Sperryville). BINDING EXCEPTION, by established
  // doctrine (R24): every R28 row binds the Washington town page
  // 'movers-in-washington-va' — the page documented as serving
  // Washington VA and Rappahannock County, and Sperryville's
  // county-seat page — never a branch variant or service hub, so
  // the families stay single-headed like their R24 rows.
  // PLACEMENT (the two late-lane laws): this block sits AFTER R14
  // (and after R26-late/R27), so no row it emits can displace an
  // R14 roll-up row — its target is in any case already R24-targeted
  // before R14 and is not a roll-up page; and it sits BEFORE the
  // panel/news late rows, the only later generic lanes. The generic
  // lanes proper (R21/R27) iterate geojson features only, so they
  // cannot mint stub texts at all — there is no earlier lane for
  // R28 to pre-empt, and dedupe (global, first-wins) resolves the
  // one internal overlap ('local movers Sperryville, VA', the R2
  // form inside R21's set) in favour of the template emit above it
  // in this same block. Generator version stays 3.1.2 for this
  // batch; the --check digest is the proof of the row-set change.
  {
    const T = 'movers-in-washington-va';
    const SIDL = 'service-local-regional';
    const qb2PathR28 = path.join(DATA_ROOT, 'question-bank-v2.json');
    const qb2R28 = fs.existsSync(qb2PathR28) ? JSON.parse(fs.readFileSync(qb2PathR28, 'utf8')) : {};
    const localQs = (sid) => (qb2R28[sid] || [])
      .filter((q) => q && q.local && String(q.text || '').includes('{area}'))
      .map((q) => americanize(String(q.text || '').trim()))
      .filter(Boolean);
    const STUBS = [
      { id: 'place-sperryville-va', name: 'Sperryville, VA', kind: 'city' },
      { id: 'place-rappahannock-county-va', name: 'Rappahannock County', kind: 'county' },
    ];
    for (const st of STUBS) {
      // Per-service town template — R2 + R16 + R19-local shapes,
      // verbatim, bound to the Washington page (binding exception).
      for (const svc of R.services.services) {
        const sid = svc.id;
        const [phrase, plural] = PHRASE[sid];
        emit(sid, 'navigational-local', phrase + ' ' + st.name, st.id, T, 'R28-stub-place');
        emit(sid, 'cost', 'how much ' + (plural ? 'do' : 'does') + ' ' + phrase + ' cost in ' + st.name, st.id, T, 'R28-stub-cost');
        emit(sid, 'cost', phrase + ' cost in ' + st.name, st.id, T, 'R28-stub-cost');
        emit(sid, 'best-choice', 'best ' + phrase + ' in ' + st.name, st.id, T, 'R28-stub-best');
        emit(sid, 'best-choice', 'top rated ' + phrase + ' in ' + st.name, st.id, T, 'R28-stub-best');
        emit(sid, 'how-process', 'how to hire ' + phrase + ' in ' + st.name, st.id, T, 'R28-stub-how');
        for (const q of localQs(sid)) {
          emit(sid, 'ai-question', q.split('{area}').join(st.name), st.id, T, 'R28-stub-ai');
        }
      }
      // Generic head family — service-local-regional, R21/R27 shapes.
      if (st.kind === 'city') {
        for (const n of [st.name, st.name.replace(/,\s*/g, ' ')]) {
          emit(SIDL, 'navigational-local', 'movers ' + n, st.id, T, 'R28-stub-generic-movers');
          emit(SIDL, 'navigational-local', 'movers in ' + n, st.id, T, 'R28-stub-generic-movers-in');
          emit(SIDL, 'navigational-local', 'moving companies ' + n, st.id, T, 'R28-stub-generic-companies');
          emit(SIDL, 'navigational-local', 'moving company ' + n, st.id, T, 'R28-stub-generic-company');
          emit(SIDL, 'navigational-local', 'local movers ' + n, st.id, T, 'R28-stub-generic-local');
          emit(SIDL, 'navigational-local', 'moving services ' + n, st.id, T, 'R28-stub-generic-services');
          emit(SIDL, 'best-choice', 'best movers ' + n, st.id, T, 'R28-stub-generic-best');
          emit(SIDL, 'best-choice', 'best movers in ' + n, st.id, T, 'R28-stub-generic-best-in');
          emit(SIDL, 'best-choice', 'best moving company in ' + n, st.id, T, 'R28-stub-generic-best-company');
          emit(SIDL, 'best-choice', 'top rated movers in ' + n, st.id, T, 'R28-stub-generic-top-rated');
          emit(SIDL, 'cost', 'how much do movers cost in ' + n, st.id, T, 'R28-stub-generic-cost-howmuch');
          emit(SIDL, 'cost', 'movers cost in ' + n, st.id, T, 'R28-stub-generic-cost-noun');
          emit(SIDL, 'how-process', 'how to hire movers in ' + n, st.id, T, 'R28-stub-generic-how-hire');
          emit(SIDL, 'how-process', 'how to find movers in ' + n, st.id, T, 'R28-stub-generic-how-find');
        }
        const town = st.name.split(',')[0].trim().toLowerCase();
        const townst = st.name.replace(/,\s*/g, ' ').toLowerCase();
        emit(SIDL, 'navigational-local', town + ' movers', st.id, T, 'R28-stub-head-town-movers');
        emit(SIDL, 'navigational-local', 'moving company in ' + townst, st.id, T, 'R28-stub-head-company-in');
        emit(SIDL, 'navigational-local', 'residential movers ' + townst, st.id, T, 'R28-stub-head-residential');
        emit(SIDL, 'navigational-local', 'movers near ' + townst, st.id, T, 'R28-stub-head-near');
        emit(SIDL, 'navigational-local', 'moving companies in ' + townst, st.id, T, 'R28-stub-head-companies-in');
      } else {
        // County shape: R21's county lane carries 2 effective forms
        // on the stateless county name; R27's county lane adds the
        // 6 state-suffixed forms (state from the family key: VA).
        emit(SIDL, 'navigational-local', 'movers in ' + st.name, st.id, T, 'R28-stub-generic-county');
        emit(SIDL, 'best-choice', 'best movers in ' + st.name, st.id, T, 'R28-stub-generic-county-best');
        const town = st.name.trim().toLowerCase();
        const townst = town + ' va';
        emit(SIDL, 'navigational-local', town + ' movers', st.id, T, 'R28-stub-head-county-movers');
        emit(SIDL, 'navigational-local', 'moving company in ' + townst, st.id, T, 'R28-stub-head-county-company-in');
        emit(SIDL, 'navigational-local', 'residential movers ' + townst, st.id, T, 'R28-stub-head-county-residential');
        emit(SIDL, 'navigational-local', 'movers near ' + townst, st.id, T, 'R28-stub-head-county-near');
        emit(SIDL, 'navigational-local', 'moving companies in ' + townst, st.id, T, 'R28-stub-head-county-companies-in');
        emit(SIDL, 'best-choice', 'best movers in ' + townst, st.id, T, 'R28-stub-head-county-best-in');
      }
    }
  }

  // R29 Town Dataset Landings (Town Datasets batch heal, 2026-11-12):
  // the twelve town dataset landings (datasets/<town-stem>/, backing
  // files datasets-<town-stem>.json) entered the registry with no
  // service association (pages.json services=[]), so R13's reverse
  // DATASETS map cannot reach them without extending
  // DATASETS['service-local-regional'] — rejected here: R13 hardwires
  // area=null (this lane must bind place-<stem>), its fileToService
  // binding is last-wins over the DATASETS map (datasets-gun-safe.json
  // binds service-vault-door, not service-gun-safe), and extending the
  // map would rewrite dataset_ids on all 3,311 existing
  // service-local-regional rows. This gated late lane instead emits
  // exactly the two rows per landing that R13's form rules produce
  // for a dataset landing whose per-page JSON carries no Service node
  // (typeForms empty — measured on all twelve singular
  // dataset-<stem>.json seats): the slug form (last slug segment,
  // dashes to spaces) and the title form (registry title's first
  // segment, lowercased — R13's title rule verbatim), both
  // navigational-local under R13's class rule, under
  // service-local-regional (the landings' backing service), bound to
  // the landing itself with area place-<stem>. All 24 (form, service)
  // pairs audited absent from the bank before this lane, so dedupe
  // takes nothing. PLACEMENT (the late-lane laws): AFTER R14 (and
  // after R26-late/R27/R28), so no roll-up row can be displaced, and
  // BEFORE the panel/news late rows, the only later generic lanes.
  // Generator version stays 3.1.2; the --check digest is the proof of
  // the row-set change.
  {
    const R29_STEMS = [
      'winchester-va', 'martinsburg-wv', 'berryville-va', 'inwood-wv',
      'shepherdstown-wv', 'charles-town-wv', 'front-royal-va',
      'strasburg-va', 'woodstock-va', 'berkeley-springs-wv',
      'washington-va', 'new-market-va',
    ];
    for (const stem of R29_STEMS) {
      const slug = 'datasets/' + stem;
      const page = V.pageBySlug.get(slug);
      if (!page) { excluded.push({ reason: 'r29-page-not-in-registry', serviceId: 'service-local-regional', queryText: slug, pattern: 'R29-town-dataset' }); continue; }
      const slugQuery = page.slug.split('/').pop().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
      const titleSegs = String(page.title || '').split(/\s*[—–|]\s*/).map((x) => x.trim()).filter(Boolean)
        .filter((x) => x.toLowerCase() !== 'category' && !/flat rate movers/i.test(x));
      const titleQuery = (titleSegs[0] || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const forms = [];
      for (const f of [slugQuery, titleQuery]) {
        if (f && f.split(' ').length >= 2 && !forms.includes(f)) forms.push(f);
      }
      for (const form of forms) {
        emit('service-local-regional', 'navigational-local', form, 'place-' + stem, slug,
          form === slugQuery ? 'R29-town-dataset-slug' : 'R29-town-dataset-title');
      }
    }
  }

  // R30 External-Ingest Lane + R31 Data-Center Build-Up (Wave 0 of the
  // Complete Dynamic Cell-Rubric Build, 2026-11-12; spec:
  // out/cell-rubric-build-2026-11-12/BUILD-SPEC.md, Wave 0 — the spec
  // numbers these lanes R29/R30; the town-dataset lane above took R29
  // in the town-completion batch after the spec was written, so they
  // land here as R30/R31).
  //
  // R30: the 4,138 externally researched rows staged at
  // out/external-rubric-intake-2026-11-12/staging-external-rows.jsonl
  // (provenance: that directory's INTAKE-REPORT.md) enter the bank
  // through the same emit() R10 gates, source 'external-ingest'.
  // DETERMINISM LAW: the lane reads NOTHING from rubric.db. Its
  // dedupe/binding reference is this run's own rows array at this
  // point — the live bank's exact regenerated equivalent (the prior
  // close's intent --check PASS proves bank == generator output) —
  // so build and --check runs see identical inputs.
  // COLLISIONS: dedupe against the bank is case-insensitive on
  // (normalized query_text, service_id); normalization = lowercase +
  // whitespace collapse + trailing [?.!] strip (the intake rule). On
  // a collision the BANK seat wins and the staged row is dropped and
  // counted: exact-text collisions are the same row; case/punctuation-
  // only variants carry no extra exact-match signal (engines match
  // case-insensitively) while the bank seat additionally carries the
  // deliberate lane bindings and the outcome/GSC evidence keyed to
  // its exact text — the stronger seat under Henry's advantage-
  // weighting rule (2026-11-12), so kept-theirs measures 0, it is not
  // assumed: the lane scores every collision and reports both counts
  // in the accounting file below.
  // BINDING (never a guessed slug): (1) the modal target the bank
  // itself uses for (service, area), per pair, first-emitted wins
  // ties; (2) for the four staged places with no bank area and no
  // geojson feature (Charlottesville VA, Great Falls VA, McLean VA,
  // The Plains VA — the census's city-staged-only units), the service
  // hub, area = the census slug. PLACEMENT (the late-lane laws):
  // after R29-town, before the panel/news late rows.
  // TRUTH SCREEN at the gate: a staged row is refused (counted, with
  // reason) if it states a price figure, a rating/review count, or a
  // locksmith claim, or asks the MOVER to perform the workload/logical
  // migration layer. Buyer-side scope-split statements are the
  // correct scope and pass — "while we handle the workloads",
  // "leaves migration to our team" (the intake's 9 keyword-flagged
  // data-center rows all state it this way and were adjudicated clean
  // in INTAKE-REPORT.md; a first-cut subject-blind regex refused 5 of
  // them in the Wave 0 dry run and was corrected to provider-side
  // attribution only, recorded in the batch record). The one
  // climate-controlled storage row STAYS (Henry, 2026-11-12:
  // climate-controlled space is offerable).
  const R30_STATS = { staged: 0, landed: 0, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0, boundModal: 0, boundHubFallback: 0 };
  const r30Norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim().replace(/[?.!]+$/, '');
  const r30NormSeen = new Map(); // service|normalized -> bank query_text
  const r30Bind = new Map(); // service|area -> Map(target_url -> count), insertion-ordered
  const r30UrlToSlug = new Map(R.pages.pages.map((p) => [p.url, p.slug]));
  for (const r of rows) {
    const nk = r.service_id + '|' + r30Norm(r.query_text);
    if (!r30NormSeen.has(nk)) r30NormSeen.set(nk, r.query_text);
    if (r.area) {
      const bk = r.service_id + '|' + r.area;
      if (!r30Bind.has(bk)) r30Bind.set(bk, new Map());
      const m = r30Bind.get(bk);
      m.set(r.target_url, (m.get(r.target_url) || 0) + 1);
    }
  }
  // R55 (Ranking-Fix Batch, 2026-11-23): page-ownership override.
  // Ownership beats the modal tally for cells with a dedicated page:
  // R53's five Hampton Roads cities bind to their R53 gun-safe
  // targets, and Leesburg local-regional binds to /movers-leesburg-va/
  // (built in the same batch). Without this, the tally amplifies the
  // early lanes' branch fallback and splits each family across two
  // target pages.
  const R55_OWNER = new Map([
    ['service-gun-safe|place-virginia-beach-va', 'gun-safe-movers-virginia-beach-va'],
    ['service-gun-safe|place-norfolk-va', 'gun-safe-movers-norfolk-va'],
    ['service-gun-safe|place-chesapeake-va', 'gun-safe-movers-virginia-beach-va'],
    ['service-gun-safe|place-hampton-va', 'gun-safe-movers-virginia-beach-va'],
    ['service-gun-safe|place-newport-news-va', 'gun-safe-movers-virginia-beach-va'],
    ['service-local-regional|place-leesburg-va', 'movers-leesburg-va'],
  ]);
  const r30ModalSlug = (serviceId, area) => {
    const own = R55_OWNER.get(serviceId + '|' + area);
    if (own) return own;
    const m = r30Bind.get(serviceId + '|' + area);
    if (!m) return null;
    let best = null, bestN = -1;
    for (const [url, n] of m) { if (n > bestN) { best = url; bestN = n; } }
    return best ? (r30UrlToSlug.get(best) || null) : null;
  };
  const r30PlaceArea = new Map();
  for (const f of features) {
    const p = f.properties;
    if (p && (p.type === 'branch' || p.type === 'city') && p.name) r30PlaceArea.set(p.name, p.id);
  }
  r30PlaceArea.set('Sperryville, VA', 'place-sperryville-va');
  const r30AreaFor = (place) => r30PlaceArea.get(place) ||
    ('place-' + String(place).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
  const R30_TRUTH_REFUSE = [
    { re: /\$\s*\d|\b\d[\d,]*\s*(?:dollars|usd)\b/i, why: 'price-figure' },
    { re: /\b\d+(?:\.\d)?\s*stars?\b|\b\d[\d,]*\s+reviews?\b/i, why: 'rating-or-review-count' },
    { re: /\blocksmith\b/i, why: 'locksmith-claim' },
    { re: /\b(?:do|does|can)\s+(?:you|movers?|a mover|the company)\b[^.]{0,40}\b(?:perform|provide|offer|handle|manage|do)\b[^.]{0,30}\b(?:workload|migration|cutover|dns)\b/i, why: 'logical-layer-claim' },
    { re: /\b(?:movers?|the company|provider|crews?)\s+(?:that\s+|who\s+)?(?:performs?|provides?|offers?|handles?|manages?)\b[^.]{0,30}\b(?:workload|migration)\b/i, why: 'logical-layer-claim' },
  ];
  {
    const stagingPath = path.join(ROOT, 'out', 'external-rubric-intake-2026-11-12', 'staging-external-rows.jsonl');
    if (fs.existsSync(stagingPath)) {
      const stagedLines = fs.readFileSync(stagingPath, 'utf8').split('\n').map((x) => x.trim()).filter(Boolean);
      for (const line of stagedLines) {
        let o = null;
        try { o = JSON.parse(line); } catch (e) { o = null; }
        R30_STATS.staged++;
        if (!o) { R30_STATS.truthRefused++; excluded.push({ reason: 'r30-unparseable-row', serviceId: null, queryText: line.slice(0, 80), pattern: 'R30-external-ingest' }); continue; }
        const serviceId = o.service, intentClass = o.intent;
        const q = americanize(String(o.q || '').trim());
        const place = String(o.place || '').trim();
        if (!svcById.has(serviceId) || !CLASS_ORDER.includes(intentClass) || !q || !place) {
          R30_STATS.truthRefused++;
          excluded.push({ reason: 'r30-malformed-row', serviceId, queryText: q, pattern: 'R30-external-ingest' });
          continue;
        }
        const bad = R30_TRUTH_REFUSE.find((t) => t.re.test(q));
        if (bad) {
          R30_STATS.truthRefused++;
          excluded.push({ reason: 'r30-truth-' + bad.why, serviceId, queryText: q, pattern: 'R30-external-ingest' });
          continue;
        }
        const nk = serviceId + '|' + r30Norm(q);
        if (r30NormSeen.has(nk)) {
          if (r30NormSeen.get(nk) === q) R30_STATS.collisionExact++; else R30_STATS.collisionNormalized++;
          excluded.push({ reason: 'r30-collision-bank-kept', serviceId, queryText: q, pattern: 'R30-external-ingest' });
          continue;
        }
        const area = r30AreaFor(place);
        let target = r30ModalSlug(serviceId, area);
        const bound = target ? 'modal' : 'hub';
        if (!target) target = HUB[serviceId];
        const ok = emit(serviceId, intentClass, q, area, target, 'R30-external-ingest', { source: 'external-ingest' });
        if (ok) {
          R30_STATS.landed++;
          if (bound === 'modal') R30_STATS.boundModal++; else R30_STATS.boundHubFallback++;
          r30NormSeen.set(nk, q);
        } else {
          R30_STATS.gateExcluded++;
        }
      }
    }
  }

  // R31 Data-Center Build-Up (Wave 0, 2026-11-12; Henry: "use more
  // rubric style to signal keywords and phrases for the data center
  // rows, we need to own that"): the generator emits the full
  // rubric-style block for service-data-center-relocation +
  // service-it-relocation across the corridor — the nine NoVA corridor
  // towns named in the brief plus the tri-state core (Winchester VA,
  // Martinsburg WV, Hagerstown MD). Per (service, place): the R16
  // five-form family, service head forms, and aspect questions built
  // ONLY from confirmed scope — background-checked, escort-compliant
  // crews; de-rack / re-rack / re-cable / power-up of the physical
  // layer; 24/7 emergency response; any contract size with additional
  // coverage obtainable. The logical/workload layer is NEVER claimed:
  // aspect forms ask for the physical layer explicitly, in the
  // buyer's own split (their team keeps workloads). Emissions pass
  // the R30 normalized-collision guard (r30NormSeen, already updated
  // with R30's landed rows) plus emit()'s exact dedupe and R10 gates;
  // targets resolve through the same per-pair modal binding the bank
  // carries for these cells.
  const R31_STATS = { emitted: 0, skippedNormalized: 0, gateOrDup: 0, byServicePlace: {} };
  {
    const R31_PLACES = ['Ashburn, VA', 'Leesburg, VA', 'Sterling, VA', 'Reston, VA', 'Herndon, VA',
      'Tysons, VA', 'Chantilly, VA', 'Manassas, VA', 'Gainesville, VA',
      'Winchester, VA', 'Martinsburg, WV', 'Hagerstown, MD'];
    const R31_SERVICES = [
      {
        id: 'service-data-center-relocation', phrase: 'data center movers',
        extras: (P) => [
          ['navigational-local', 'data center movers in ' + P],
          ['navigational-local', 'data center relocation services in ' + P],
          ['best-choice', 'best data center relocation company in ' + P],
          ['cost', 'data center relocation cost in ' + P],
          ['ai-question', 'can data center movers de-rack and re-rack servers in ' + P],
          ['ai-question', 'do data center movers re-cable and power up racks in ' + P],
          ['ai-question', 'who provides the physical layer of a data center move in ' + P + ' while our team handles the workloads'],
          ['navigational-local', 'data center movers with background-checked crews in ' + P],
          ['navigational-local', 'data center movers that follow escort rules in ' + P],
          ['navigational-local', '24/7 emergency data center movers in ' + P],
          ['how-process', 'how do data center movers sequence a rack move in ' + P],
          ['ai-question', 'can a data center mover add insurance coverage for a large relocation contract in ' + P],
          ['navigational-local', 'data center movers for multi-site relocation contracts in ' + P],
        ],
      },
      {
        id: 'service-it-relocation', phrase: 'IT equipment movers',
        extras: (P) => [
          ['navigational-local', 'IT movers ' + P],
          ['navigational-local', 'IT movers in ' + P],
          ['navigational-local', 'IT relocation services in ' + P],
          ['best-choice', 'best IT relocation company in ' + P],
          ['cost', 'IT relocation cost in ' + P],
          ['ai-question', 'can IT movers de-rack and re-rack servers in ' + P],
          ['ai-question', 'do IT movers label and sequence workstations during an office move in ' + P],
          ['ai-question', 'how do IT movers keep chain of custody on laptops and drives in ' + P],
          ['navigational-local', 'IT equipment movers with background-checked crews in ' + P],
          ['navigational-local', 'IT equipment movers that follow escort rules in ' + P],
          ['navigational-local', '24/7 emergency IT equipment movers in ' + P],
          ['how-process', 'how do IT movers sequence an office technology move in ' + P],
          ['ai-question', 'can an IT relocation company add insurance coverage for a large contract in ' + P],
        ],
      },
    ];
    for (const svc of R31_SERVICES) {
      const [phrase, plural] = PHRASE[svc.id];
      void phrase;
      for (const P of R31_PLACES) {
        const area = r30AreaFor(P);
        const target = r30ModalSlug(svc.id, area) || HUB[svc.id];
        const forms = [
          ['navigational-local', svc.phrase + ' ' + P],
          ['cost', 'how much ' + (plural ? 'do' : 'does') + ' ' + svc.phrase + ' cost in ' + P],
          ['cost', svc.phrase + ' cost in ' + P],
          ['best-choice', 'best ' + svc.phrase + ' in ' + P],
          ['best-choice', 'top rated ' + svc.phrase + ' in ' + P],
          ['how-process', 'how to hire ' + svc.phrase + ' in ' + P],
          ...svc.extras(P),
        ];
        let landedHere = 0;
        for (const [cls, text] of forms) {
          const nk = svc.id + '|' + r30Norm(text);
          if (r30NormSeen.has(nk)) { R31_STATS.skippedNormalized++; continue; }
          const ok = emit(svc.id, cls, text, area, target, 'R31-data-center-buildup');
          if (ok) {
            R31_STATS.emitted++;
            landedHere++;
            r30NormSeen.set(nk, text);
          } else {
            R31_STATS.gateOrDup++;
          }
        }
        R31_STATS.byServicePlace[svc.id + '|' + P] = landedHere;
      }
    }
  }
  try {
    fs.mkdirSync(WORK_DIR, { recursive: true });
    fs.writeFileSync(path.join(WORK_DIR, 'r30-r31-accounting.json'),
      JSON.stringify({ r30: R30_STATS, r31: R31_STATS }, null, 2) + '\n');
  } catch (e) { /* accounting is diagnostic; generation never fails on it */ }

  // R32 Money-Cell Completion (Wave 1 of the Complete Dynamic
  // Cell-Rubric Build, 2026-11-12; spec:
  // out/cell-rubric-build-2026-11-12/BUILD-SPEC.md, Wave 1 — the
  // spec numbers this lane R31; the Wave 0 data-center block took
  // R31 after the town-dataset lane took R29, so it lands here as
  // R32, and later waves shift +1 likewise).
  //
  // Scope: the nine money places (Ashburn, Leesburg, Washington DC,
  // McLean, Great Falls, Charlottesville, Middleburg, The Plains,
  // Upperville) x all 34 services, completed to the place depth
  // standard (12) on CURRENT rows. The branch head layer is already
  // COMPLETE (170/170 at the post-Wave-0 census) and is verification
  // only — this lane emits nothing for head cells.
  // DETERMINISM LAW (the R30 pattern): the lane reads NOTHING from
  // rubric.db. Cell counts come from this run's own rows array at
  // this point — the live bank's exact regenerated equivalent — so
  // build and --check runs see identical inputs.
  // BINDING (never a guessed slug): the modal target the bank itself
  // uses for (service, area) at this point in the run (r30ModalSlug,
  // R30's map, which now also carries R30's own landed bindings);
  // for pairs with no bank seat — the EMPTY cells of the four
  // money-spot places wired into service-area.geojson in this batch
  // (Charlottesville, Great Falls, McLean, The Plains) — the service
  // hub, the Wave 0 hub-fallback pattern.
  // FORMS: the R16/R28 core family first (the estate's proven place
  // shapes), then per-service ADVANTAGE forms built only from the
  // confirmed anchors in out/cell-rubric-build-2026-11-12/
  // ADVANTAGE-MAP.md (flat rate in writing; SIR 1,500-3,500 lb band;
  // white-glove full bundle in writing; the published industrial
  // CWT schedule; screening/escort physical-layer scope for data
  // center + IT — the logical layer is never claimed), then the
  // R19 question-bank local ai-questions. Emission stops per cell
  // at the standard (12); every candidate passes the R30 normalized
  // guard plus emit()'s exact dedupe and R10 gates.
  const R32_STATS = { emitted: 0, skippedNormalized: 0, gateOrDup: 0, cellsCompleted: 0, cellsAlreadyComplete: 0, cellsShort: [], byPlace: {} };
  {
    const R32_MIN = 12;
    const R32_PLACES = ['Ashburn, VA', 'Leesburg, VA', 'Washington, DC', 'McLean, VA',
      'Great Falls, VA', 'Charlottesville, VA', 'Middleburg, VA', 'The Plains, VA', 'Upperville, VA'];
    const R32_ASPECT = {
      'service-residential': [
        ['best-choice', 'flat rate movers in {P}'],
        ['ai-question', 'do movers in {P} give a flat rate quote in writing'],
        ['navigational-local', 'full service movers in {P}'],
      ],
      'service-commercial': [
        ['ai-question', 'can a commercial mover in {P} price the whole job at one flat rate'],
        ['how-process', 'how does a full scope commercial relocation in {P} work'],
        ['best-choice', 'commercial movers with a flat rate guarantee in {P}'],
      ],
      'service-local-regional': [
        ['best-choice', 'best local movers in {P}'],
        ['ai-question', 'which local movers in {P} quote a flat rate in writing'],
        ['navigational-local', 'local moving company in {P}'],
      ],
      'service-long-distance': [
        ['ai-question', 'who does long distance moves from {P} with a flat rate in writing'],
        ['navigational-local', 'long distance moving company in {P}'],
        ['best-choice', 'best long distance movers from {P}'],
      ],
      'service-packing': [
        ['ai-question', 'do packing services in {P} include export packing'],
        ['navigational-local', 'full packing services in {P}'],
        ['how-process', 'how do packers prepare fragile items in {P}'],
      ],
      'service-sir-heavy': [
        ['ai-question', 'who moves heavy equipment in the 1500 to 3500 lb range in {P}'],
        ['ai-question', 'what is SIR for heavy asset moves in {P}'],
        ['navigational-local', 'heavy equipment movers in {P}'],
      ],
      'service-gun-safe': [
        ['ai-question', 'who moves gun safes up and down stairs in {P}'],
        ['ai-question', 'can a gun safe mover re-anchor a safe in {P}'],
        ['navigational-local', 'gun safe moving company in {P}'],
      ],
      'service-piano-antique': [
        ['ai-question', 'who moves museum items in {P}'],
        ['navigational-local', 'antique movers in {P}'],
        ['ai-question', 'who moves pianos and antiques in {P} with white glove handling'],
      ],
      'service-ispm15': [
        ['ai-question', 'who performs ISPM 15 export packing in {P}'],
        ['navigational-local', 'export packing services in {P}'],
        ['how-process', 'how does ISPM 15 export packing work in {P}'],
      ],
      'service-crating': [
        ['ai-question', 'who builds custom crates for high value items in {P}'],
        ['navigational-local', 'custom crating services in {P}'],
        ['ai-question', 'can crating in {P} handle museum items'],
      ],
      'service-transloading': [
        ['navigational-local', 'transloading services in {P} for freight professionals'],
        ['ai-question', 'who does transloading quoted per job in {P}'],
        ['how-process', 'how does transloading work in {P}'],
      ],
      'service-final-mile': [
        ['ai-question', 'who does carrier terminal pickup for final mile delivery in {P}'],
        ['ai-question', 'what is the difference between final mile delivery and white glove delivery in {P}'],
        ['navigational-local', 'final mile delivery services in {P}'],
      ],
      'service-white-glove': [
        ['ai-question', 'who does white glove delivery with full assembly and no exclusions in {P}'],
        ['ai-question', 'which white glove movers take three stage photos in {P}'],
        ['navigational-local', 'white glove movers in {P}'],
      ],
      'service-office-moving': [
        ['how-process', 'how is an office move in {P} sequenced'],
        ['ai-question', 'who does office moves in {P} at one flat rate'],
        ['navigational-local', 'office moving company in {P}'],
      ],
      'service-industrial-offices': [
        ['ai-question', 'who moves industrial offices in {P} under one engagement'],
        ['navigational-local', 'industrial office movers in {P}'],
        ['how-process', 'how does an industrial office relocation in {P} work'],
      ],
      'service-government': [
        ['ai-question', 'who does government moving in {P} for federal agencies'],
        ['navigational-local', 'government moving company in {P}'],
        ['best-choice', 'best government movers in {P}'],
      ],
      'service-military': [
        ['navigational-local', 'military moving company in {P}'],
        ['ai-question', 'who does military moves in {P}'],
        ['best-choice', 'best military movers in {P}'],
      ],
      'service-route81': [
        ['navigational-local', 'movers on the I-81 corridor near {P}'],
        ['ai-question', 'who is the Route 81 moving company for {P}'],
        ['best-choice', 'best I-81 corridor movers for {P}'],
      ],
      'service-industrial-commercial': [
        ['ai-question', 'what is the CWT rate for unloading freight in {P}'],
        ['navigational-local', 'industrial moving services in {P}'],
        ['how-process', 'how do industrial movers price freight handling in {P}'],
      ],
      'service-senior-moving': [
        ['ai-question', 'who does estate moves for seniors in {P}'],
        ['navigational-local', 'senior moving company in {P}'],
        ['best-choice', 'best senior movers in {P}'],
      ],
      'service-warehouse-relocation': [
        ['ai-question', 'what is the standard CWT pricing for a warehouse move in {P}'],
        ['how-process', 'how are warehouse moves planned around the site in {P}'],
        ['navigational-local', 'warehouse movers in {P}'],
      ],
      'service-it-relocation': [
        ['ai-question', 'how do IT movers keep chain of custody on laptops and drives in {P}'],
        ['navigational-local', 'IT equipment movers with background-checked crews in {P}'],
        ['ai-question', 'can IT movers de-rack and re-rack servers in {P}'],
      ],
      'service-transloading-winchester-va': [
        ['ai-question', 'who does transloading near the Virginia Inland Port for freight from {P}'],
        ['navigational-local', 'Winchester VA transloading services for {P} freight'],
        ['how-process', 'how does Winchester transloading work for freight from {P}'],
      ],
      'service-moving-and-storage': [
        ['ai-question', 'is climate controlled storage space available in {P}'],
        ['ai-question', 'who offers storage with a 30 day minimum in {P}'],
        ['navigational-local', 'moving and storage company in {P}'],
      ],
      'service-junk-removal': [
        ['ai-question', 'who gives a flat rate junk removal quote in writing in {P}'],
        ['how-process', 'how does junk removal sorting and routing work in {P}'],
        ['navigational-local', 'junk removal company in {P}'],
      ],
      'service-warehouse-racking-relocation': [
        ['ai-question', 'who reinstalls pallet racking to ANSI MH16.1 in {P}'],
        ['ai-question', 'who does racking teardown labeled bay by bay in {P}'],
        ['navigational-local', 'pallet racking movers in {P}'],
      ],
      'service-ffe-logistics': [
        ['ai-question', 'who does FF&E receiving and installation support in {P}'],
        ['how-process', 'how does FF&E dock inventory and condition documentation work in {P}'],
        ['navigational-local', 'FF&E movers in {P}'],
      ],
      'service-data-center-relocation': [
        ['ai-question', 'can data center movers de-rack and re-rack servers in {P}'],
        ['navigational-local', 'data center movers with background-checked crews in {P}'],
        ['ai-question', 'who provides the physical layer of a data center move in {P} while our team handles the workloads'],
      ],
      'service-medical-lab-relocation': [
        ['ai-question', 'who moves commercial lab and medical equipment in {P}'],
        ['navigational-local', 'medical equipment movers in {P}'],
        ['how-process', 'how are lab equipment moves in {P} handled under one engagement'],
      ],
      'service-freight-rework-transloading': [
        ['ai-question', 'who does freight rework and transloading in {P} for freight professionals'],
        ['navigational-local', 'freight rework services in {P}'],
        ['how-process', 'how does freight rework work in {P}'],
      ],
      'service-logistics-project-management': [
        ['ai-question', 'who manages logistics projects with a single project lead in {P}'],
        ['how-process', 'how does a logistics project survey work in {P}'],
        ['navigational-local', 'logistics project managers in {P}'],
      ],
      'service-3pl-support': [
        ['ai-question', 'who provides 3PL labor support in {P}'],
        ['ai-question', 'can a 3PL support company in {P} handle any size contract'],
        ['navigational-local', '3PL support services in {P}'],
      ],
      'service-vault-door': [
        ['ai-question', 'who installs vault doors of any size in {P}'],
        ['navigational-local', 'vault door moving company in {P}'],
        ['ai-question', 'can a vault door mover re-anchor a vault in {P}'],
      ],
      'service-hoarding-cleanup': [
        ['ai-question', 'who does discreet hoarding cleanouts in {P}'],
        ['ai-question', 'who does emergency hoarding cleanup in {P}'],
        ['navigational-local', 'hoarding cleanup services in {P}'],
      ],
    };
    const qb2R32Path = path.join(DATA_ROOT, 'question-bank-v2.json');
    const qb2R32 = fs.existsSync(qb2R32Path) ? JSON.parse(fs.readFileSync(qb2R32Path, 'utf8')) : {};
    const localQsR32 = (sid) => (qb2R32[sid] || [])
      .filter((q) => q && q.local && String(q.text || '').includes('{area}'))
      .map((q) => americanize(String(q.text || '').trim()))
      .filter(Boolean);
    // Cell counts from this run's own rows array (R30 determinism law).
    const r32Count = new Map();
    for (const r of rows) {
      if (!r.area) continue;
      const k = r.service_id + '|' + r.area;
      r32Count.set(k, (r32Count.get(k) || 0) + 1);
    }
    for (const P of R32_PLACES) {
      const area = r30AreaFor(P);
      R32_STATS.byPlace[P] = 0;
      for (const svc of R.services.services) {
        const sid = svc.id;
        const [phrase, plural] = PHRASE[sid];
        const key = sid + '|' + area;
        let count = r32Count.get(key) || 0;
        if (count >= R32_MIN) { R32_STATS.cellsAlreadyComplete++; continue; }
        const target = r30ModalSlug(sid, area) || HUB[sid];
        const candidates = [
          ['navigational-local', phrase + ' ' + P],
          ['navigational-local', phrase + ' in ' + P],
          ['cost', 'how much ' + (plural ? 'do' : 'does') + ' ' + phrase + ' cost in ' + P],
          ['cost', phrase + ' cost in ' + P],
          ['best-choice', 'best ' + phrase + ' in ' + P],
          ['best-choice', 'top rated ' + phrase + ' in ' + P],
          ['how-process', 'how to hire ' + phrase + ' in ' + P],
          ['how-process', 'how to find ' + phrase + ' in ' + P],
          ...(R32_ASPECT[sid] || []).map(([cls, tpl]) => [cls, tpl.split('{P}').join(P)]),
          ...localQsR32(sid).slice(0, 3).map((q) => ['ai-question', q.split('{area}').join(P)]),
          ['navigational-local', phrase + ' near ' + P],
          ['best-choice', 'best ' + phrase + ' near ' + P],
        ];
        for (const [cls, text] of candidates) {
          if (count >= R32_MIN) break;
          const nk = sid + '|' + r30Norm(text);
          if (r30NormSeen.has(nk)) { R32_STATS.skippedNormalized++; continue; }
          const ok = emit(sid, cls, text, area, target, 'R32-money-cell');
          if (ok) {
            R32_STATS.emitted++;
            R32_STATS.byPlace[P]++;
            count++;
            r32Count.set(key, count);
            r30NormSeen.set(nk, text);
          } else {
            R32_STATS.gateOrDup++;
          }
        }
        if (count >= R32_MIN) R32_STATS.cellsCompleted++;
        else R32_STATS.cellsShort.push({ service: sid, place: P, count });
      }
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r32-accounting.json'),
        JSON.stringify({ r32: R32_STATS }, null, 2) + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }

  // R33 Full-Grid Place Completion (Wave 2 of the Complete Dynamic
  // Cell-Rubric Build, 2026-11-12; spec:
  // out/cell-rubric-build-2026-11-12/BUILD-SPEC.md, Wave 2 — the
  // spec numbers this lane R32; the Wave 1 money lane took R32, so
  // it lands here as R33, and later waves shift +1 likewise).
  //
  // Scope: every city/town cell in the footprint outside the Wave 1
  // money set (2,006 cells = 59 units x 34 services), completed to
  // the place depth standards on CURRENT rows (city 12; the
  // bank-only county family 11). The work order is the census gap
  // list made literal: the unit set is derived from
  // service-area.geojson in this run (every type=city feature the
  // Wave 1 money set does not claim) plus the two geo-less bank-only
  // families (Sperryville, Rappahannock County). County FEATURES,
  // corridors, regions and landmark ports are Wave 3 scope and are
  // not touched here; the branch head layer is Wave 1 scope.
  // DETERMINISM LAW (the R30 pattern): the lane reads NOTHING from
  // rubric.db and nothing from the census file. Cell counts come
  // from this run's own rows array at this point — the live bank's
  // exact regenerated equivalent — so build and --check runs see
  // identical inputs.
  // BINDING (never a guessed slug): the modal target the bank itself
  // uses for (service, area) at this point in the run (r30ModalSlug),
  // else the service hub — EXCEPT the two bank-only families, which
  // keep the R28 binding exception: every row binds the Washington
  // town page 'movers-in-washington-va', so those families stay
  // single-headed like their R24/R28 rows.
  // FORMS: the R32 candidate stack verbatim — the R16/R28 core family
  // first (the estate's proven place shapes), then the per-service
  // ADVANTAGE forms built only from the confirmed anchors in
  // out/cell-rubric-build-2026-11-12/ADVANTAGE-MAP.md, then the R19
  // question-bank local ai-questions, then the two near forms.
  // Emission stops per cell at its standard; every candidate passes
  // the R30 normalized guard plus emit()'s exact dedupe and R10
  // gates.
  const R33_STATS = { emitted: 0, skippedNormalized: 0, gateOrDup: 0, cellsCompleted: 0, cellsAlreadyComplete: 0, cellsShort: [], byUnit: {} };
  {
    const R33_MONEY = new Set(['place-ashburn-va', 'place-leesburg-va', 'place-washington-dc',
      'place-mclean-va', 'place-great-falls-va', 'place-charlottesville-va', 'place-middleburg-va',
      'place-the-plains-va', 'place-upperville-va']);
    const R33_UNITS = [];
    for (const f of features) {
      const p = f.properties;
      if (p.type !== 'city') continue;
      if (R33_MONEY.has(p.id)) continue;
      R33_UNITS.push({ area: p.id, name: p.name, min: 12, stub: false });
    }
    R33_UNITS.push({ area: 'place-sperryville-va', name: 'Sperryville, VA', min: 12, stub: true });
    R33_UNITS.push({ area: 'place-rappahannock-county-va', name: 'Rappahannock County', min: 11, stub: true });
    const R33_ASPECT = {
      'service-residential': [
        ['best-choice', 'flat rate movers in {P}'],
        ['ai-question', 'do movers in {P} give a flat rate quote in writing'],
        ['navigational-local', 'full service movers in {P}'],
      ],
      'service-commercial': [
        ['ai-question', 'can a commercial mover in {P} price the whole job at one flat rate'],
        ['how-process', 'how does a full scope commercial relocation in {P} work'],
        ['best-choice', 'commercial movers with a flat rate guarantee in {P}'],
      ],
      'service-local-regional': [
        ['best-choice', 'best local movers in {P}'],
        ['ai-question', 'which local movers in {P} quote a flat rate in writing'],
        ['navigational-local', 'local moving company in {P}'],
      ],
      'service-long-distance': [
        ['ai-question', 'who does long distance moves from {P} with a flat rate in writing'],
        ['navigational-local', 'long distance moving company in {P}'],
        ['best-choice', 'best long distance movers from {P}'],
      ],
      'service-packing': [
        ['ai-question', 'do packing services in {P} include export packing'],
        ['navigational-local', 'full packing services in {P}'],
        ['how-process', 'how do packers prepare fragile items in {P}'],
      ],
      'service-sir-heavy': [
        ['ai-question', 'who moves heavy equipment in the 1500 to 3500 lb range in {P}'],
        ['ai-question', 'what is SIR for heavy asset moves in {P}'],
        ['navigational-local', 'heavy equipment movers in {P}'],
      ],
      'service-gun-safe': [
        ['ai-question', 'who moves gun safes up and down stairs in {P}'],
        ['ai-question', 'can a gun safe mover re-anchor a safe in {P}'],
        ['navigational-local', 'gun safe moving company in {P}'],
      ],
      'service-piano-antique': [
        ['ai-question', 'who moves museum items in {P}'],
        ['navigational-local', 'antique movers in {P}'],
        ['ai-question', 'who moves pianos and antiques in {P} with white glove handling'],
      ],
      'service-ispm15': [
        ['ai-question', 'who performs ISPM 15 export packing in {P}'],
        ['navigational-local', 'export packing services in {P}'],
        ['how-process', 'how does ISPM 15 export packing work in {P}'],
      ],
      'service-crating': [
        ['ai-question', 'who builds custom crates for high value items in {P}'],
        ['navigational-local', 'custom crating services in {P}'],
        ['ai-question', 'can crating in {P} handle museum items'],
      ],
      'service-transloading': [
        ['navigational-local', 'transloading services in {P} for freight professionals'],
        ['ai-question', 'who does transloading quoted per job in {P}'],
        ['how-process', 'how does transloading work in {P}'],
      ],
      'service-final-mile': [
        ['ai-question', 'who does carrier terminal pickup for final mile delivery in {P}'],
        ['ai-question', 'what is the difference between final mile delivery and white glove delivery in {P}'],
        ['navigational-local', 'final mile delivery services in {P}'],
      ],
      'service-white-glove': [
        ['ai-question', 'who does white glove delivery with full assembly and no exclusions in {P}'],
        ['ai-question', 'which white glove movers take three stage photos in {P}'],
        ['navigational-local', 'white glove movers in {P}'],
      ],
      'service-office-moving': [
        ['how-process', 'how is an office move in {P} sequenced'],
        ['ai-question', 'who does office moves in {P} at one flat rate'],
        ['navigational-local', 'office moving company in {P}'],
      ],
      'service-industrial-offices': [
        ['ai-question', 'who moves industrial offices in {P} under one engagement'],
        ['navigational-local', 'industrial office movers in {P}'],
        ['how-process', 'how does an industrial office relocation in {P} work'],
      ],
      'service-government': [
        ['ai-question', 'who does government moving in {P} for federal agencies'],
        ['navigational-local', 'government moving company in {P}'],
        ['best-choice', 'best government movers in {P}'],
      ],
      'service-military': [
        ['navigational-local', 'military moving company in {P}'],
        ['ai-question', 'who does military moves in {P}'],
        ['best-choice', 'best military movers in {P}'],
      ],
      'service-route81': [
        ['navigational-local', 'movers on the I-81 corridor near {P}'],
        ['ai-question', 'who is the Route 81 moving company for {P}'],
        ['best-choice', 'best I-81 corridor movers for {P}'],
      ],
      'service-industrial-commercial': [
        ['ai-question', 'what is the CWT rate for unloading freight in {P}'],
        ['navigational-local', 'industrial moving services in {P}'],
        ['how-process', 'how do industrial movers price freight handling in {P}'],
      ],
      'service-senior-moving': [
        ['ai-question', 'who does estate moves for seniors in {P}'],
        ['navigational-local', 'senior moving company in {P}'],
        ['best-choice', 'best senior movers in {P}'],
      ],
      'service-warehouse-relocation': [
        ['ai-question', 'what is the standard CWT pricing for a warehouse move in {P}'],
        ['how-process', 'how are warehouse moves planned around the site in {P}'],
        ['navigational-local', 'warehouse movers in {P}'],
      ],
      'service-it-relocation': [
        ['ai-question', 'how do IT movers keep chain of custody on laptops and drives in {P}'],
        ['navigational-local', 'IT equipment movers with background-checked crews in {P}'],
        ['ai-question', 'can IT movers de-rack and re-rack servers in {P}'],
      ],
      'service-transloading-winchester-va': [
        ['ai-question', 'who does transloading near the Virginia Inland Port for freight from {P}'],
        ['navigational-local', 'Winchester VA transloading services for {P} freight'],
        ['how-process', 'how does Winchester transloading work for freight from {P}'],
      ],
      'service-moving-and-storage': [
        ['ai-question', 'is climate controlled storage space available in {P}'],
        ['ai-question', 'who offers storage with a 30 day minimum in {P}'],
        ['navigational-local', 'moving and storage company in {P}'],
      ],
      'service-junk-removal': [
        ['ai-question', 'who gives a flat rate junk removal quote in writing in {P}'],
        ['how-process', 'how does junk removal sorting and routing work in {P}'],
        ['navigational-local', 'junk removal company in {P}'],
      ],
      'service-warehouse-racking-relocation': [
        ['ai-question', 'who reinstalls pallet racking to ANSI MH16.1 in {P}'],
        ['ai-question', 'who does racking teardown labeled bay by bay in {P}'],
        ['navigational-local', 'pallet racking movers in {P}'],
      ],
      'service-ffe-logistics': [
        ['ai-question', 'who does FF&E receiving and installation support in {P}'],
        ['how-process', 'how does FF&E dock inventory and condition documentation work in {P}'],
        ['navigational-local', 'FF&E movers in {P}'],
      ],
      'service-data-center-relocation': [
        ['ai-question', 'can data center movers de-rack and re-rack servers in {P}'],
        ['navigational-local', 'data center movers with background-checked crews in {P}'],
        ['ai-question', 'who provides the physical layer of a data center move in {P} while our team handles the workloads'],
      ],
      'service-medical-lab-relocation': [
        ['ai-question', 'who moves commercial lab and medical equipment in {P}'],
        ['navigational-local', 'medical equipment movers in {P}'],
        ['how-process', 'how are lab equipment moves in {P} handled under one engagement'],
      ],
      'service-freight-rework-transloading': [
        ['ai-question', 'who does freight rework and transloading in {P} for freight professionals'],
        ['navigational-local', 'freight rework services in {P}'],
        ['how-process', 'how does freight rework work in {P}'],
      ],
      'service-logistics-project-management': [
        ['ai-question', 'who manages logistics projects with a single project lead in {P}'],
        ['how-process', 'how does a logistics project survey work in {P}'],
        ['navigational-local', 'logistics project managers in {P}'],
      ],
      'service-3pl-support': [
        ['ai-question', 'who provides 3PL labor support in {P}'],
        ['ai-question', 'can a 3PL support company in {P} handle any size contract'],
        ['navigational-local', '3PL support services in {P}'],
      ],
      'service-vault-door': [
        ['ai-question', 'who installs vault doors of any size in {P}'],
        ['navigational-local', 'vault door moving company in {P}'],
        ['ai-question', 'can a vault door mover re-anchor a vault in {P}'],
      ],
      'service-hoarding-cleanup': [
        ['ai-question', 'who does discreet hoarding cleanouts in {P}'],
        ['ai-question', 'who does emergency hoarding cleanup in {P}'],
        ['navigational-local', 'hoarding cleanup services in {P}'],
      ],
    };
    const qb2R33Path = path.join(DATA_ROOT, 'question-bank-v2.json');
    const qb2R33 = fs.existsSync(qb2R33Path) ? JSON.parse(fs.readFileSync(qb2R33Path, 'utf8')) : {};
    const localQsR33 = (sid) => (qb2R33[sid] || [])
      .filter((q) => q && q.local && String(q.text || '').includes('{area}'))
      .map((q) => americanize(String(q.text || '').trim()))
      .filter(Boolean);
    // Cell counts from this run's own rows array (R30 determinism law).
    const r33Count = new Map();
    for (const r of rows) {
      if (!r.area) continue;
      const k = r.service_id + '|' + r.area;
      r33Count.set(k, (r33Count.get(k) || 0) + 1);
    }
    for (const U of R33_UNITS) {
      const P = U.name;
      R33_STATS.byUnit[U.area] = 0;
      for (const svc of R.services.services) {
        const sid = svc.id;
        const [phrase, plural] = PHRASE[sid];
        const key = sid + '|' + U.area;
        let count = r33Count.get(key) || 0;
        if (count >= U.min) { R33_STATS.cellsAlreadyComplete++; continue; }
        const target = U.stub ? 'movers-in-washington-va' : (r30ModalSlug(sid, U.area) || HUB[sid]);
        const candidates = [
          ['navigational-local', phrase + ' ' + P],
          ['navigational-local', phrase + ' in ' + P],
          ['cost', 'how much ' + (plural ? 'do' : 'does') + ' ' + phrase + ' cost in ' + P],
          ['cost', phrase + ' cost in ' + P],
          ['best-choice', 'best ' + phrase + ' in ' + P],
          ['best-choice', 'top rated ' + phrase + ' in ' + P],
          ['how-process', 'how to hire ' + phrase + ' in ' + P],
          ['how-process', 'how to find ' + phrase + ' in ' + P],
          ...(R33_ASPECT[sid] || []).map(([cls, tpl]) => [cls, tpl.split('{P}').join(P)]),
          ...localQsR33(sid).slice(0, 3).map((q) => ['ai-question', q.split('{area}').join(P)]),
          ['navigational-local', phrase + ' near ' + P],
          ['best-choice', 'best ' + phrase + ' near ' + P],
        ];
        for (const [cls, text] of candidates) {
          if (count >= U.min) break;
          const nk = sid + '|' + r30Norm(text);
          if (r30NormSeen.has(nk)) { R33_STATS.skippedNormalized++; continue; }
          const ok = emit(sid, cls, text, U.area, target, 'R33-place-grid');
          if (ok) {
            R33_STATS.emitted++;
            R33_STATS.byUnit[U.area]++;
            count++;
            r33Count.set(key, count);
            r30NormSeen.set(nk, text);
          } else {
            R33_STATS.gateOrDup++;
          }
        }
        if (count >= U.min) R33_STATS.cellsCompleted++;
        else R33_STATS.cellsShort.push({ service: sid, place: P, count });
      }
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r33-accounting.json'),
        JSON.stringify({ r33: R33_STATS }, null, 2) + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }

  // R34 Scope-Layer Completion (Wave 3 of the Complete Dynamic
  // Cell-Rubric Build, 2026-11-12; spec:
  // out/cell-rubric-build-2026-11-12/BUILD-SPEC.md, Wave 3 — the
  // spec numbers this lane R33; the Wave 2 place-grid lane took R33,
  // so it lands here as R34, and Wave 4 shifts to R35 likewise).
  //
  // Scope: every non-place, non-B2B cell in the grid (2,312 cells):
  // the 12 county FEATURES to the county standard (11), the three
  // interstate corridors to the all-intents corridor standard (6),
  // the two regions to the region standard (7), the two landmark
  // ports to the port standard (5), and the national layer — the
  // FULL 34-service registry x 49 states — to the national standard
  // (6). The work order is derived in-run from the machine data
  // alone (service-area.geojson county / landmark-port features,
  // data/corridors.json, data/national-scope.json), per the R30
  // determinism law: the lane reads NOTHING from rubric.db and
  // nothing from the census file; cell counts come from this run's
  // own rows array at this point — the live bank's exact regenerated
  // equivalent — so build and --check runs see identical inputs.
  // BANK AREA KEYS follow the bank's own conventions, which the
  // census maps to its units: counties and landmark ports carry
  // their geojson feature ids; corridors carry the corridors.json
  // ids (i-81 / i-66 / i-70); Shenandoah Valley carries the standing
  // scope key scope-shenandoah-valley; the Eastern Panhandle carries
  // its geojson feature id; national rows carry state-<abbr> from
  // national-scope.json (the binding registry for the state set —
  // TM-6: exactly the 49 states, Hawaii excluded).
  // BINDING (never a guessed slug): the modal target the bank itself
  // uses for (service, area) at this point in the run (r30ModalSlug);
  // else, per layer — county: the county branch's branch page for
  // the service, else the hub (the R2/R16 rule); corridor: the
  // corridor page when the service owns it, else the hub (the R4
  // rule); Eastern Panhandle: the Martinsburg branch page, else the
  // hub (the scope rule — the Panhandle is Martinsburg's ground);
  // Shenandoah Valley, ports and the national layer: the service
  // hub. Layer discipline (spec, Wave 3): the rubric layer's
  // coverage standard is the full registry; the PUBLISHED national
  // dataset keeps its per-state performed-service floor as
  // published fact — this lane does not touch the published record.
  // FORMS: the proven set per layer — county: the R33 candidate
  // stack verbatim at the county name; corridor: the R4/R18 three
  // forms plus the missing cost / how / ai forms, so the cell
  // carries all five intents; region: the R5/R6/R7 scope set plus
  // the nav + ai forms the region standard adds; port: the scope
  // set at the port door; national: the scope set plus one state
  // nav form. Aspect ai forms bind only confirmed ADVANTAGE-MAP
  // anchors — the R34 aspect map below is the R33 map verbatim —
  // filtered at scope layers to forms that read at a scope phrase
  // (no 'near {P}' forms, no place-nav forms). Emission stops per
  // cell at its standard; every candidate passes the R30 normalized
  // guard plus emit()'s exact dedupe and R10 gates.
  const R34_STATS = { emitted: 0, skippedNormalized: 0, gateOrDup: 0, cellsCompleted: 0, cellsAlreadyComplete: 0, cellsShort: [], byLayer: {}, cellsByLayer: {} };
  {
    const R34_ASPECT = {
      'service-residential': [
        ['best-choice', 'flat rate movers in {P}'],
        ['ai-question', 'do movers in {P} give a flat rate quote in writing'],
        ['navigational-local', 'full service movers in {P}'],
      ],
      'service-commercial': [
        ['ai-question', 'can a commercial mover in {P} price the whole job at one flat rate'],
        ['how-process', 'how does a full scope commercial relocation in {P} work'],
        ['best-choice', 'commercial movers with a flat rate guarantee in {P}'],
      ],
      'service-local-regional': [
        ['best-choice', 'best local movers in {P}'],
        ['ai-question', 'which local movers in {P} quote a flat rate in writing'],
        ['navigational-local', 'local moving company in {P}'],
      ],
      'service-long-distance': [
        ['ai-question', 'who does long distance moves from {P} with a flat rate in writing'],
        ['navigational-local', 'long distance moving company in {P}'],
        ['best-choice', 'best long distance movers from {P}'],
      ],
      'service-packing': [
        ['ai-question', 'do packing services in {P} include export packing'],
        ['navigational-local', 'full packing services in {P}'],
        ['how-process', 'how do packers prepare fragile items in {P}'],
      ],
      'service-sir-heavy': [
        ['ai-question', 'who moves heavy equipment in the 1500 to 3500 lb range in {P}'],
        ['ai-question', 'what is SIR for heavy asset moves in {P}'],
        ['navigational-local', 'heavy equipment movers in {P}'],
      ],
      'service-gun-safe': [
        ['ai-question', 'who moves gun safes up and down stairs in {P}'],
        ['ai-question', 'can a gun safe mover re-anchor a safe in {P}'],
        ['navigational-local', 'gun safe moving company in {P}'],
      ],
      'service-piano-antique': [
        ['ai-question', 'who moves museum items in {P}'],
        ['navigational-local', 'antique movers in {P}'],
        ['ai-question', 'who moves pianos and antiques in {P} with white glove handling'],
      ],
      'service-ispm15': [
        ['ai-question', 'who performs ISPM 15 export packing in {P}'],
        ['navigational-local', 'export packing services in {P}'],
        ['how-process', 'how does ISPM 15 export packing work in {P}'],
      ],
      'service-crating': [
        ['ai-question', 'who builds custom crates for high value items in {P}'],
        ['navigational-local', 'custom crating services in {P}'],
        ['ai-question', 'can crating in {P} handle museum items'],
      ],
      'service-transloading': [
        ['navigational-local', 'transloading services in {P} for freight professionals'],
        ['ai-question', 'who does transloading quoted per job in {P}'],
        ['how-process', 'how does transloading work in {P}'],
      ],
      'service-final-mile': [
        ['ai-question', 'who does carrier terminal pickup for final mile delivery in {P}'],
        ['ai-question', 'what is the difference between final mile delivery and white glove delivery in {P}'],
        ['navigational-local', 'final mile delivery services in {P}'],
      ],
      'service-white-glove': [
        ['ai-question', 'who does white glove delivery with full assembly and no exclusions in {P}'],
        ['ai-question', 'which white glove movers take three stage photos in {P}'],
        ['navigational-local', 'white glove movers in {P}'],
      ],
      'service-office-moving': [
        ['how-process', 'how is an office move in {P} sequenced'],
        ['ai-question', 'who does office moves in {P} at one flat rate'],
        ['navigational-local', 'office moving company in {P}'],
      ],
      'service-industrial-offices': [
        ['ai-question', 'who moves industrial offices in {P} under one engagement'],
        ['navigational-local', 'industrial office movers in {P}'],
        ['how-process', 'how does an industrial office relocation in {P} work'],
      ],
      'service-government': [
        ['ai-question', 'who does government moving in {P} for federal agencies'],
        ['navigational-local', 'government moving company in {P}'],
        ['best-choice', 'best government movers in {P}'],
      ],
      'service-military': [
        ['navigational-local', 'military moving company in {P}'],
        ['ai-question', 'who does military moves in {P}'],
        ['best-choice', 'best military movers in {P}'],
      ],
      'service-route81': [
        ['navigational-local', 'movers on the I-81 corridor near {P}'],
        ['ai-question', 'who is the Route 81 moving company for {P}'],
        ['best-choice', 'best I-81 corridor movers for {P}'],
      ],
      'service-industrial-commercial': [
        ['ai-question', 'what is the CWT rate for unloading freight in {P}'],
        ['navigational-local', 'industrial moving services in {P}'],
        ['how-process', 'how do industrial movers price freight handling in {P}'],
      ],
      'service-senior-moving': [
        ['ai-question', 'who does estate moves for seniors in {P}'],
        ['navigational-local', 'senior moving company in {P}'],
        ['best-choice', 'best senior movers in {P}'],
      ],
      'service-warehouse-relocation': [
        ['ai-question', 'what is the standard CWT pricing for a warehouse move in {P}'],
        ['how-process', 'how are warehouse moves planned around the site in {P}'],
        ['navigational-local', 'warehouse movers in {P}'],
      ],
      'service-it-relocation': [
        ['ai-question', 'how do IT movers keep chain of custody on laptops and drives in {P}'],
        ['navigational-local', 'IT equipment movers with background-checked crews in {P}'],
        ['ai-question', 'can IT movers de-rack and re-rack servers in {P}'],
      ],
      'service-transloading-winchester-va': [
        ['ai-question', 'who does transloading near the Virginia Inland Port for freight from {P}'],
        ['navigational-local', 'Winchester VA transloading services for {P} freight'],
        ['how-process', 'how does Winchester transloading work for freight from {P}'],
      ],
      'service-moving-and-storage': [
        ['ai-question', 'is climate controlled storage space available in {P}'],
        ['ai-question', 'who offers storage with a 30 day minimum in {P}'],
        ['navigational-local', 'moving and storage company in {P}'],
      ],
      'service-junk-removal': [
        ['ai-question', 'who gives a flat rate junk removal quote in writing in {P}'],
        ['how-process', 'how does junk removal sorting and routing work in {P}'],
        ['navigational-local', 'junk removal company in {P}'],
      ],
      'service-warehouse-racking-relocation': [
        ['ai-question', 'who reinstalls pallet racking to ANSI MH16.1 in {P}'],
        ['ai-question', 'who does racking teardown labeled bay by bay in {P}'],
        ['navigational-local', 'pallet racking movers in {P}'],
      ],
      'service-ffe-logistics': [
        ['ai-question', 'who does FF&E receiving and installation support in {P}'],
        ['how-process', 'how does FF&E dock inventory and condition documentation work in {P}'],
        ['navigational-local', 'FF&E movers in {P}'],
      ],
      'service-data-center-relocation': [
        ['ai-question', 'can data center movers de-rack and re-rack servers in {P}'],
        ['navigational-local', 'data center movers with background-checked crews in {P}'],
        ['ai-question', 'who provides the physical layer of a data center move in {P} while our team handles the workloads'],
      ],
      'service-medical-lab-relocation': [
        ['ai-question', 'who moves commercial lab and medical equipment in {P}'],
        ['navigational-local', 'medical equipment movers in {P}'],
        ['how-process', 'how are lab equipment moves in {P} handled under one engagement'],
      ],
      'service-freight-rework-transloading': [
        ['ai-question', 'who does freight rework and transloading in {P} for freight professionals'],
        ['navigational-local', 'freight rework services in {P}'],
        ['how-process', 'how does freight rework work in {P}'],
      ],
      'service-logistics-project-management': [
        ['ai-question', 'who manages logistics projects with a single project lead in {P}'],
        ['how-process', 'how does a logistics project survey work in {P}'],
        ['navigational-local', 'logistics project managers in {P}'],
      ],
      'service-3pl-support': [
        ['ai-question', 'who provides 3PL labor support in {P}'],
        ['ai-question', 'can a 3PL support company in {P} handle any size contract'],
        ['navigational-local', '3PL support services in {P}'],
      ],
      'service-vault-door': [
        ['ai-question', 'who installs vault doors of any size in {P}'],
        ['navigational-local', 'vault door moving company in {P}'],
        ['ai-question', 'can a vault door mover re-anchor a vault in {P}'],
      ],
      'service-hoarding-cleanup': [
        ['ai-question', 'who does discreet hoarding cleanouts in {P}'],
        ['ai-question', 'who does emergency hoarding cleanup in {P}'],
        ['navigational-local', 'hoarding cleanup services in {P}'],
      ],
    };
    // question-bank-v2 local ai-questions (county lane), as R33.
    const qb2R34Path = path.join(DATA_ROOT, 'question-bank-v2.json');
    const qb2R34 = fs.existsSync(qb2R34Path) ? JSON.parse(fs.readFileSync(qb2R34Path, 'utf8')) : {};
    const localQsR34 = (sid) => (qb2R34[sid] || [])
      .filter((q) => q && q.local && String(q.text || '').includes('{area}'))
      .map((q) => americanize(String(q.text || '').trim()))
      .filter(Boolean);
    // Aspect forms at a scope phrase P: drop the forms that only
    // read at a place ('near {P}' forms; the route81 place-nav).
    const aspectFor = (sid, P) => (R34_ASPECT[sid] || [])
      .filter(([cls, tpl]) => !tpl.includes('near {P}') && !tpl.startsWith('movers on the'))
      .map(([cls, tpl]) => [cls, tpl.split('{P}').join(P)]);
    // Cell counts from this run's own rows array (R30 determinism law).
    const r34Count = new Map();
    for (const r of rows) {
      if (!r.area) continue;
      const k = r.service_id + '|' + r.area;
      r34Count.set(k, (r34Count.get(k) || 0) + 1);
    }
    const r34Cell = (layer, area, min, sid, target, pattern, candidates) => {
      const key = sid + '|' + area;
      let count = r34Count.get(key) || 0;
      if (!R34_STATS.cellsByLayer[layer]) R34_STATS.cellsByLayer[layer] = { completed: 0, alreadyComplete: 0, short: 0 };
      if (count >= min) { R34_STATS.cellsAlreadyComplete++; R34_STATS.cellsByLayer[layer].alreadyComplete++; return; }
      for (const [cls, text] of candidates) {
        if (count >= min) break;
        const nk = sid + '|' + r30Norm(text);
        if (r30NormSeen.has(nk)) { R34_STATS.skippedNormalized++; continue; }
        const ok = emit(sid, cls, text, area, target, pattern);
        if (ok) {
          R34_STATS.emitted++;
          R34_STATS.byLayer[layer] = (R34_STATS.byLayer[layer] || 0) + 1;
          count++;
          r34Count.set(key, count);
          r30NormSeen.set(nk, text);
        } else {
          R34_STATS.gateOrDup++;
        }
      }
      if (count >= min) { R34_STATS.cellsCompleted++; R34_STATS.cellsByLayer[layer].completed++; }
      else { R34_STATS.cellsShort.push({ layer, service: sid, area, count }); R34_STATS.cellsByLayer[layer].short++; }
    };
    // --- County features (standard 11): the R33 stack verbatim ---
    for (const f of features) {
      const p = f.properties;
      if (p.type !== 'county') continue;
      for (const svc of R.services.services) {
        const sid = svc.id;
        const [phrase, plural] = PHRASE[sid];
        const P = p.name;
        const target = r30ModalSlug(sid, p.id) || branchPage(R, V, sid, p.branch) || HUB[sid];
        r34Cell('county', p.id, 11, sid, target, 'R34-county', [
          ['navigational-local', phrase + ' ' + P],
          ['navigational-local', phrase + ' in ' + P],
          ['cost', 'how much ' + (plural ? 'do' : 'does') + ' ' + phrase + ' cost in ' + P],
          ['cost', phrase + ' cost in ' + P],
          ['best-choice', 'best ' + phrase + ' in ' + P],
          ['best-choice', 'top rated ' + phrase + ' in ' + P],
          ['how-process', 'how to hire ' + phrase + ' in ' + P],
          ['how-process', 'how to find ' + phrase + ' in ' + P],
          ...(R34_ASPECT[sid] || []).map(([cls, tpl]) => [cls, tpl.split('{P}').join(P)]),
          ...localQsR34(sid).slice(0, 3).map((q) => ['ai-question', q.split('{area}').join(P)]),
          ['navigational-local', phrase + ' near ' + P],
          ['best-choice', 'best ' + phrase + ' near ' + P],
        ]);
      }
    }
    // --- Corridors (standard 6): R4/R18 forms + the missing intents ---
    for (const c of R.corridors.corridors) {
      const S = CORRIDOR_SHORT[c.id];
      const C = 'the ' + S + ' corridor';
      for (const svc of R.services.services) {
        const sid = svc.id;
        const [phrase, plural] = PHRASE[sid];
        const target = r30ModalSlug(sid, c.id) || ((V.svcPages.get(sid) || []).includes(c.page) ? c.page : HUB[sid]);
        r34Cell('corridor', c.id, 6, sid, target, 'R34-corridor', [
          ['navigational-local', phrase + ' ' + S],
          ['navigational-local', phrase + ' ' + S + ' corridor'],
          ['best-choice', 'best ' + phrase + ' ' + S + ' corridor'],
          ['cost', 'how much ' + (plural ? 'do' : 'does') + ' ' + phrase + ' cost on ' + C],
          ['how-process', 'how to hire ' + phrase + ' on ' + C],
          ...aspectFor(sid, C),
          ['ai-question', 'who provides ' + phrase + ' on ' + C + ' with a flat rate in writing'],
          ['cost', phrase + ' cost on ' + C],
          ['best-choice', 'top rated ' + phrase + ' ' + S + ' corridor'],
          ['navigational-local', phrase + ' along ' + S],
        ]);
      }
    }
    // --- Regions (standard 7): the scope set + nav + ai ---
    const R34_REGIONS = [
      { area: 'scope-shenandoah-valley', label: 'the Shenandoah Valley', branch: null },
      { area: 'landmark-eastern-panhandle-of-west-virginia', label: 'the Eastern Panhandle', branch: 'martinsburg' },
    ];
    for (const U of R34_REGIONS) {
      for (const svc of R.services.services) {
        const sid = svc.id;
        const [phrase, plural] = PHRASE[sid];
        const L = U.label;
        const target = r30ModalSlug(sid, U.area) || (U.branch ? branchPage(R, V, sid, U.branch) : null) || HUB[sid];
        r34Cell('region', U.area, 7, sid, target, 'R34-region', [
          ['navigational-local', phrase + ' in ' + L],
          ['cost', 'how much ' + (plural ? 'do' : 'does') + ' ' + phrase + ' cost in ' + L],
          ['cost', phrase + ' cost in ' + L],
          ['best-choice', 'best ' + phrase + ' in ' + L],
          ['best-choice', 'top rated ' + phrase + ' in ' + L],
          ['how-process', 'how to hire ' + phrase + ' in ' + L],
          ...aspectFor(sid, L),
          ['ai-question', 'who provides ' + phrase + ' in ' + L + ' with a flat rate in writing'],
          ['how-process', 'how to find ' + phrase + ' in ' + L],
        ]);
      }
    }
    // --- Landmark ports (standard 5): the scope set at the port door ---
    const R34_PORT_FRAG = {
      'landmark-port-of-virginia': { frag: 'in the Port of Virginia', P: 'the Port of Virginia' },
      'landmark-virginia-inland-port': { frag: 'at Virginia Inland Port', P: 'Virginia Inland Port' },
    };
    for (const f of features) {
      const p = f.properties;
      if (p.type !== 'landmark-port') continue;
      const pf = R34_PORT_FRAG[p.id];
      if (!pf) continue;
      for (const svc of R.services.services) {
        const sid = svc.id;
        const [phrase, plural] = PHRASE[sid];
        const target = r30ModalSlug(sid, p.id) || HUB[sid];
        r34Cell('port', p.id, 5, sid, target, 'R34-port', [
          ['cost', 'how much ' + (plural ? 'do' : 'does') + ' ' + phrase + ' cost ' + pf.frag],
          ['cost', phrase + ' cost ' + pf.frag],
          ['best-choice', 'best ' + phrase + ' ' + pf.frag],
          ['best-choice', 'top rated ' + phrase + ' ' + pf.frag],
          ['how-process', 'how to hire ' + phrase + ' ' + pf.frag],
          ...aspectFor(sid, pf.P),
          ['navigational-local', phrase + ' ' + pf.frag],
          ['how-process', 'how to find ' + phrase + ' ' + pf.frag],
        ]);
      }
    }
    // --- National layer (standard 6): the FULL registry x 49 states,
    // bound to data/national-scope.json (scope set + one state nav form) ---
    const natScope = loadData('data/national-scope.json');
    for (const st of natScope.states || []) {
      const area = 'state-' + String(st.abbr || '').toLowerCase();
      const ST = st.state;
      if (!st.abbr || !ST) continue;
      for (const svc of R.services.services) {
        const sid = svc.id;
        const [phrase, plural] = PHRASE[sid];
        r34Cell('national', area, 6, sid, HUB[sid], 'R34-national', [
          ['navigational-local', phrase + ' in ' + ST],
          ['cost', 'how much ' + (plural ? 'do' : 'does') + ' ' + phrase + ' cost in ' + ST],
          ['cost', phrase + ' cost in ' + ST],
          ['best-choice', 'best ' + phrase + ' in ' + ST],
          ['best-choice', 'top rated ' + phrase + ' in ' + ST],
          ['how-process', 'how to hire ' + phrase + ' in ' + ST],
          ...aspectFor(sid, ST),
          ['ai-question', 'who provides ' + phrase + ' in ' + ST + ' with a flat rate in writing'],
          ['navigational-local', phrase + ' ' + ST],
          ['how-process', 'how to find ' + phrase + ' in ' + ST],
        ]);
      }
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r34-accounting.json'),
        JSON.stringify({ r34: R34_STATS }, null, 2) + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }

  // R35 B2B / 3PL Entry-Point Ingest (Wave 4 of the Complete Dynamic
  // Cell-Rubric Build, 2026-11-13; spec:
  // out/cell-rubric-build-2026-11-12/BUILD-SPEC.md, Wave 4 + the 3PL
  // research: out/3pl-labor-coverage-research-2026-11-12/REPORT.md
  // §F/§G — the spec numbers this lane R34; the Wave 3 scope-layer
  // block took R34 in this file, so it lands here as R35).
  //
  // R35: the combined 1,080-row B2B buyer-inquiry bank staged at
  // out/external-rubric-intake-3pl-gemini-2026-11-12/ — 325 screened
  // Gemini rows (INTAKE-REPORT.md there) + 755 in-house completion
  // rows (COMPLETION-REPORT.md there, validation PASS) — enters the
  // bank in ONE pass on the R30 ingest pattern, through the same
  // emit() R10 gates, source '3pl-intake'. Every staged row carries
  // a measured entry_point_id (the 28 doors F-1.1..F-4.5 of research
  // §F; §G-1: a row that cannot name its door does not exist).
  // DETERMINISM LAW (the R30 pattern): the lane reads NOTHING from
  // rubric.db. Its dedupe/binding reference is this run's own rows
  // array at this point — the live bank's exact regenerated
  // equivalent — so build and --check runs see identical inputs.
  // AREA KEY: the census counts B2B cells by (service_id, area) with
  // the door id as the area key (census.py's B2B units are the door
  // ids themselves), so the row's area IS its entry_point_id — the
  // bank's standing non-feature-area convention (corridor ids, scope
  // keys, state keys); the intent dataset's totals node publishes
  // these counts in rowsByNonFeatureArea like the corridor counts.
  // The entry_point_id ALSO rides the pattern seat ('R35-F-1.12')
  // per the spec's lightweight rule; the remaining §G-2 fields
  // (buyer_role, aspect, fit, proof_anchor) live in the lane's
  // source record (r35-source-rows.jsonl in the work dir), never as
  // new bank columns.
  // SERVICE ASSIGNMENT (the staged rows carry no service_id — the
  // door bank is a program bank): the census minimums bind per
  // (service, door) for the 10-service logistics cluster (§G-3:
  // door totals / 10 — F-1.1..F-1.9: 4, F-1.10..F-1.14: 9, F-2: 2,
  // F-3: 3, F-4: 1), so each row is dealt to exactly one cluster
  // service: candidates are ordered by affinity (service-tier
  // primary — final-mile-standalone -> service-final-mile,
  // white-glove-full -> service-white-glove, receiving-inspection ->
  // white-glove then 3pl-support, partner-program ->
  // service-3pl-support — then keyword/door/role boosts for the
  // transloading, freight-rework, warehouse and corridor services,
  // ties broken by a per-door rotation), and the row lands on the
  // first candidate that (a) still needs rows to reach the door
  // minimum and (b) passes the R30 normalized-collision guard; if
  // every needy candidate collides, the first non-colliding
  // candidate overall (over-minimum — the F-4 doors carry 12 rows
  // against 10 minimums, the taxonomy-floor remainder of §G-3); if
  // all ten collide, the bank seat wins and the row is counted
  // dropped (collisions keep ours, per Henry's advantage rule).
  // BINDING (never a guessed slug): (1) the modal target the bank
  // itself uses for (service, area), per pair, first-emitted wins
  // ties — no bank row carries a door area before this lane, so the
  // expected seat is (2) the service hub (HUB), the registry seat
  // the spec's Wave 4 estate side names for the F-door targets.
  // FIT FIXES AT BINDING (INTAKE-REPORT.md, the Gemini screen):
  // aspect 1.4 is dual in the taxonomy — STRONG for performed-work
  // HISTORY framing, PARTIAL for going-forward PROGRAM framing.
  // Seven Gemini rows are program-framed but staged STRONG; they
  // land as PARTIAL here (asserted in-lane: aspect 1.4 + STRONG +
  // the exact staged line numbers 39 / 136 / 162 / 200 / 290 / 303 /
  // 315). The one history-framed 1.4 row (line 243, F-3.2) stays
  // STRONG; lines 9 and 67 already carry PARTIAL and pass through.
  // The fix lands in the lane's source record + accounting — the
  // staged files are never rewritten.
  // TRUTH SCREEN at the gate (Wave 0 calibration; this bank passed
  // two independent pre-screens with 0 hard violations — the intake
  // error hunt and the completion forbidden-content scanner — and
  // the lane screen is the landing backstop): the R30 set verbatim
  // (price figure, rating/review count, locksmith, provider-side
  // logical-layer attribution — buyer-side scope-split statements
  // pass), plus the §G NEVER list in figure form: DOT/MC numbers,
  // percent figures, per-period capacity figures. Capability
  // attribution (EDI/API/TMS/portal/tracking, drug screening,
  // returns program) is refused ONLY as a provider-side assertion
  // and never on GAP-fit rows — GAP rows are process questions by
  // taxonomy ('what is your process for discussing EDI...'), the
  // §G-2 honest form, and every such row in this bank is one.
  // TIER LAW: a final-mile-standalone row that ASSERTS assembly or
  // haul-away as included is refused; the bank's standalone rows
  // that mention them are 5.20 boundary/separation forms and F-1.9
  // definition questions (interrogative or boundary-worded) and
  // pass — the boundary is the selling distinction, never blurred.
  // The climate-controlled storage rows STAY (Henry, 2026-11-12:
  // climate-controlled storage SPACE is offerable — the rows frame
  // storage/holding space on the published 30-day-minimum leased
  // basis; no row claims climate-controlled transit).
  const R35_STATS = { staged: 0, landed: 0, collisionExact: 0, collisionNormalized: 0, collisionDropped: 0, collisionRedealt: 0, truthRefused: 0, gateExcluded: 0, boundModal: 0, boundHubFallback: 0, fitFixesApplied: [], cellsShort: [], byDoor: {}, byService: {} };
  const R35_CLUSTER = ['service-3pl-support', 'service-final-mile', 'service-white-glove', 'service-transloading', 'service-transloading-winchester-va', 'service-freight-rework-transloading', 'service-warehouse-relocation', 'service-warehouse-racking-relocation', 'service-logistics-project-management', 'service-route81'];
  const R35_DOOR_MIN = (door) => {
    const m = /^F-(\d)\.(\d+)$/.exec(door || '');
    if (!m) return -1;
    const g = +m[1], n = +m[2];
    if (g === 1 && n >= 1 && n <= 14) return n <= 9 ? 4 : 9;
    if (g === 2 && n >= 1 && n <= 6) return 2;
    if (g === 3 && n >= 1 && n <= 3) return 3;
    if (g === 4 && n >= 1 && n <= 5) return 1;
    return -1;
  };
  const R35_FIT_FIX_LINES = new Set([39, 136, 162, 200, 290, 303, 315]);
  const R35_TRUTH_REFUSE = [
    { re: /\$\s*\d|\b\d[\d,]*\s*(?:dollars|usd)\b/i, why: 'price-figure' },
    { re: /\b\d+(?:\.\d)?\s*stars?\b|\b\d[\d,]*\s+reviews?\b/i, why: 'rating-or-review-count' },
    { re: /\blocksmith\b/i, why: 'locksmith-claim' },
    { re: /\b(?:do|does|can)\s+(?:you|movers?|a mover|the company)\b[^.]{0,40}\b(?:perform|provide|offer|handle|manage|do)\b[^.]{0,30}\b(?:workload|migration|cutover|dns)\b/i, why: 'logical-layer-claim' },
    { re: /\b(?:movers?|the company|provider|crews?)\s+(?:that\s+|who\s+)?(?:performs?|provides?|offers?|handles?|manages?)\b[^.]{0,30}\b(?:workload|migration)\b/i, why: 'logical-layer-claim' },
    { re: /\b(?:usdot|dot|mc)\s*(?:#|number|no\.?)\s*\d{4,}\b/i, why: 'dot-mc-number' },
    { re: /\b\d+(?:\.\d+)?\s*%/, why: 'percent-figure' },
    { re: /\b\d[\d,]*\s*(?:loads?|deliveries|trucks?|crews?|teams?)\s+(?:per|a)\s+(?:day|week|month)\b/i, why: 'capacity-figure' },
  ];
  const R35_CAPABILITY_REFUSE = [
    { re: /\b(?:we|the company|our crews?|the provider)\s+(?:offer|provide|support|include|feature|deliver|guarantee)s?\b[^.]{0,40}\b(?:edi|api|tms|portal|live tracking|real-time tracking)\b/i, why: 'tech-capability-claim' },
    { re: /\b(?:edi|api)\s+integration\s+(?:is\s+)?(?:included|provided|offered|available)\b/i, why: 'tech-capability-claim' },
    { re: /\bdrug screening\s+(?:is\s+)?(?:performed|provided|included|completed)\b/i, why: 'drug-screen-claim' },
    { re: /\bw-?2\s+(?:employees?|crews?|staff|teams?|workforce)\b[^.]{0,20}\b(?:only|all|every)\b/i, why: 'w2-status-claim' },
    { re: /\b(?:we|the company|our crews?|the provider)\s+(?:offer|provide|include|run|operate)s?\b[^.]{0,30}\breturns?\s+(?:program|management|processing)\b/i, why: 'returns-program-claim' },
  ];
  const R35_SOURCE_ROWS = [];
  {
    // Binding reference from this run's own rows (determinism law).
    const r35Bind = new Map();
    for (const r of rows) {
      if (!r.area) continue;
      const bk = r.service_id + '|' + r.area;
      if (!r35Bind.has(bk)) r35Bind.set(bk, new Map());
      const mm = r35Bind.get(bk);
      mm.set(r.target_url, (mm.get(r.target_url) || 0) + 1);
    }
    const r35ModalSlug = (serviceId, area) => {
      const mm = r35Bind.get(serviceId + '|' + area);
      if (!mm) return null;
      let best = null, bestN = -1;
      for (const [url, n] of mm) { if (n > bestN) { best = url; bestN = n; } }
      return best ? (r30UrlToSlug.get(best) || null) : null;
    };
    // Pre-lane cell counts per (service, door) from the run's rows.
    const r35CellCount = new Map();
    for (const r of rows) {
      if (r.area && /^F-\d\.\d+$/.test(r.area)) {
        const ck = r.service_id + '|' + r.area;
        r35CellCount.set(ck, (r35CellCount.get(ck) || 0) + 1);
      }
    }
    const r35Affinity = (o) => {
      const score = new Map(R35_CLUSTER.map((s) => [s, 0]));
      const add = (s, n) => score.set(s, (score.get(s) || 0) + n);
      const q = String(o.q || '').toLowerCase();
      if (o.service_tier === 'final-mile-standalone') add('service-final-mile', 100);
      else if (o.service_tier === 'white-glove-full') add('service-white-glove', 100);
      else if (o.service_tier === 'receiving-inspection') { add('service-white-glove', 70); add('service-3pl-support', 50); add('service-final-mile', 20); }
      else if (o.service_tier === 'partner-program') add('service-3pl-support', 100);
      if (q.includes('terminal')) { add('service-transloading', 60); add('service-freight-rework-transloading', 50); add('service-final-mile', 30); if (o.geography === 'Winchester VA') add('service-transloading-winchester-va', 55); }
      if (q.includes('transload')) { add('service-transloading', 80); if (o.geography === 'Winchester VA') add('service-transloading-winchester-va', 75); }
      if (q.includes('warehouse')) { add('service-warehouse-relocation', 60); add('service-warehouse-racking-relocation', 30); }
      if (q.includes('racking')) add('service-warehouse-racking-relocation', 80);
      if (q.includes('rework')) add('service-freight-rework-transloading', 70);
      if (o.entry_point_id === 'F-4.5') { add('service-transloading', 40); add('service-freight-rework-transloading', 30); }
      if (o.entry_point_id === 'F-1.14' || String(o.entry_point_id || '').startsWith('F-4.')) { add('service-route81', 25); add('service-logistics-project-management', 15); }
      if (o.buyer_role === 'carrier-network') { add('service-transloading', 20); add('service-freight-rework-transloading', 15); }
      if (o.buyer_role === 'forwarder') add('service-transloading', 20);
      return score;
    };
    const intakeDir = path.join(ROOT, 'out', 'external-rubric-intake-3pl-gemini-2026-11-12');
    const stagedAll = [];
    for (const [srcTag, file] of [['gemini', 'staging-3pl-gemini-rows.jsonl'], ['completion', 'staging-3pl-completion-rows.jsonl']]) {
      const p = path.join(intakeDir, file);
      if (!fs.existsSync(p)) continue;
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      lines.forEach((line, i) => {
        const t = line.trim();
        if (!t) return;
        let o = null;
        try { o = JSON.parse(t); } catch (e) { o = null; }
        stagedAll.push({ srcTag, lineNo: i + 1, raw: t, o });
      });
    }
    // Doors in canonical order; within a door, staged order (the
    // Gemini file first, then the completion file — the read order
    // above), so the dealing is a pure function of the staged files.
    const doorOrder = (d) => { const m = /^F-(\d)\.(\d+)$/.exec(d || ''); return m ? (+m[1]) * 100 + (+m[2]) : 9999; };
    const doorsPresent = [...new Set(stagedAll.map((s) => (s.o && s.o.entry_point_id) || ''))].sort((a, b) => doorOrder(a) - doorOrder(b));
    let doorIdx = 0;
    for (const door of doorsPresent) {
      doorIdx++;
      const min = R35_DOOR_MIN(door);
      const needs = new Map(R35_CLUSTER.map((s) => [s, Math.max(0, min - (r35CellCount.get(s + '|' + door) || 0))]));
      R35_STATS.byDoor[door] = 0;
      for (const item of stagedAll.filter((s) => s.o && s.o.entry_point_id === door)) {
        R35_STATS.staged++;
        const o = item.o;
        if (min < 0 || !CLASS_ORDER.includes(o.intent) || !o.q || !o.aspect || !o.service_tier || !o.fit) {
          R35_STATS.truthRefused++;
          excluded.push({ reason: 'r35-malformed-row', serviceId: null, queryText: String((o && o.q) || item.raw).slice(0, 80), pattern: 'R35-b2b-ingest' });
          continue;
        }
        // The 7 aspect-1.4 fit fixes, applied at binding (asserted).
        let fit = o.fit;
        if (item.srcTag === 'gemini' && R35_FIT_FIX_LINES.has(item.lineNo)) {
          if (o.aspect === '1.4' && o.fit === 'STRONG') {
            fit = 'PARTIAL';
            R35_STATS.fitFixesApplied.push({ line: item.lineNo, door, aspect: o.aspect, from: 'STRONG', to: 'PARTIAL' });
          } else {
            R35_STATS.truthRefused++;
            excluded.push({ reason: 'r35-fitfix-assert-failed', serviceId: null, queryText: String(o.q).slice(0, 80), pattern: 'R35-b2b-ingest' });
            continue;
          }
        }
        const q = americanize(String(o.q || '').trim());
        const badBase = R35_TRUTH_REFUSE.find((t) => t.re.test(q));
        const badCap = (!badBase && fit !== 'GAP') ? R35_CAPABILITY_REFUSE.find((t) => t.re.test(q)) : null;
        let badTier = null;
        if (!badBase && !badCap && o.service_tier === 'final-mile-standalone' &&
            /\binclude[sd]?\b[^.]{0,30}\b(?:assembly|haul-?away)\b/i.test(q) &&
            !/^(?:who|what|how|why|which|when|where|do|does|is|are|can|should|would)\b/i.test(q) &&
            !/\?/.test(q) &&
            !/\b(?:without|exclud\w*|separat\w*|vs\.?|versus|differ\w*|boundar\w*|only|not\s+includ\w*)\b/i.test(q)) {
          badTier = { why: 'tier-blur-standalone-includes-assembly' };
        }
        const bad = badBase || badCap || badTier;
        if (bad) {
          R35_STATS.truthRefused++;
          excluded.push({ reason: 'r35-truth-' + bad.why, serviceId: null, queryText: q, pattern: 'R35-b2b-ingest' });
          continue;
        }
        const score = r35Affinity(o);
        const candidates = R35_CLUSTER.slice().sort((a, b) => {
          const d = score.get(b) - score.get(a);
          if (d) return d;
          const ra = (R35_CLUSTER.indexOf(a) - doorIdx * 3 % 10 + 10) % 10;
          const rb = (R35_CLUSTER.indexOf(b) - doorIdx * 3 % 10 + 10) % 10;
          return ra - rb;
        });
        const nk0 = r30Norm(q);
        let landedSvc = null, landedBound = null, sawCollision = false, sawGate = false, topCollided = false;
        for (const pass of [1, 2]) {
          for (const svcId of candidates) {
            if (pass === 1 && (needs.get(svcId) || 0) <= 0) continue;
            const nk = svcId + '|' + nk0;
            if (r30NormSeen.has(nk)) {
              sawCollision = true;
              if (svcId === candidates[0]) topCollided = true;
              continue;
            }
            let target = r35ModalSlug(svcId, door);
            const bound = target ? 'modal' : 'hub';
            if (!target) target = HUB[svcId];
            const ok = emit(svcId, o.intent, q, door, target, 'R35-' + door, { source: '3pl-intake' });
            if (ok) {
              landedSvc = svcId; landedBound = bound;
              r30NormSeen.set(nk, q);
              if ((needs.get(svcId) || 0) > 0) needs.set(svcId, needs.get(svcId) - 1);
              break;
            }
            sawGate = true;
          }
          if (landedSvc) break;
        }
        if (!landedSvc) {
          if (sawCollision && !sawGate) {
            R35_STATS.collisionDropped++;
            const first = r30NormSeen.get(candidates[0] + '|' + nk0);
            if (first === q) R35_STATS.collisionExact++; else R35_STATS.collisionNormalized++;
            excluded.push({ reason: 'r35-collision-bank-kept', serviceId: null, queryText: q, pattern: 'R35-b2b-ingest' });
          } else {
            R35_STATS.gateExcluded++;
            excluded.push({ reason: 'r35-gate-excluded', serviceId: null, queryText: q, pattern: 'R35-b2b-ingest' });
          }
          continue;
        }
        R35_STATS.landed++;
        if (topCollided) R35_STATS.collisionRedealt++;
        if (landedBound === 'modal') R35_STATS.boundModal++; else R35_STATS.boundHubFallback++;
        R35_STATS.byDoor[door]++;
        R35_STATS.byService[landedSvc] = (R35_STATS.byService[landedSvc] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R35_SOURCE_ROWS.push({
          entry_point_id: door, buyer_role: o.buyer_role, q, geography: o.geography,
          service_tier: o.service_tier, aspect: o.aspect, fit, proof_anchor: o.proof_anchor,
          intent: o.intent, service_id: landedSvc, area: door,
          target_url: landedRow.target_url, source_file: item.srcTag, source_line: item.lineNo,
        });
      }
      for (const svcId of R35_CLUSTER) {
        const finalCount = (r35CellCount.get(svcId + '|' + door) || 0) + R35_SOURCE_ROWS.filter((r) => r.entry_point_id === door && r.service_id === svcId).length;
        if (min > 0 && finalCount < min) R35_STATS.cellsShort.push({ door, service: svcId, count: finalCount, min });
      }
    }
    // Rows in the staged files whose door did not parse (counted,
    // never silently dropped): staged total must reconcile.
    for (const item of stagedAll) {
      if (!item.o) {
        R35_STATS.staged++;
        R35_STATS.truthRefused++;
        excluded.push({ reason: 'r35-unparseable-row', serviceId: null, queryText: item.raw.slice(0, 80), pattern: 'R35-b2b-ingest' });
      }
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r35-accounting.json'),
        JSON.stringify({ r35: R35_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r35-source-rows.jsonl'),
        R35_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }

  // R40 (Ports × 3PL Takeover Wave 1, 2026-11-14): the ports × 3PL
  // bridge bank (580 screened rows, INTAKE at
  // out/external-rubric-intake-ports3pl-bridge-2026-11-14/) enters the
  // bank on the R30/R35 ingest pattern, plus this lane's own
  // generator-emitted cell rows. DETERMINISM LAW: the lane reads
  // data/ports.json (machine registry) and the staged bank file only
  // — never rubric.db; dedupe/binding reference is this run's rows.
  // SCOPE (BUILD-PLAN.md step 4): P-1 rows for the five wave-1 ports
  // (Norfolk, Richmond, Wilmington DE, NY/NJ, Front Royal — 30/port =
  // 150) bind to the ports' NEW dedicated labor pages; the three
  // wave-2 ports' P-1 rows (90) are counted deferred, never dropped
  // silently. P-2 bridge rows (150) bind to the wave-1 port page they
  // name in their question text, else to the 3PL support hub. Cell
  // rows are emitted per (port × coverage column) from ports.json —
  // the census port layer — one row per question type plus a rotating
  // advantage aspect (TWIC-carded crews, 24/7 dispatch, 1,000-crew
  // contract scale, flat rate in writing). AREA KEY: the port id
  // (the bank's standing non-feature-area convention, like door ids);
  // hub-bound bridge rows carry 'bridge-ports-3pl'.
  // INTENT: the bank's intent_class is re-derived at binding per the
  // intake rule — the rubric's five classes are fixed, so 'research'
  // lands as 'ai-question'; the other five pass through.
  // SERVICE ASSIGNMENT for P-1 rows is a deterministic aspect/keyword
  // affinity (rework → freight-rework; transloading family →
  // transloading; program/both-ends/storage → 3pl-support), in the
  // R35 dealing spirit. TRUTH SCREEN: the R35 base refuse set is the
  // backstop, plus two port assertions refused outright — a drayage
  // OFFER (the definition/clarity questions are interrogative and
  // pass; the company never offers drayage) and a TWIC-certification
  // assertion about the company (the truthful-distinction questions
  // are interrogative and pass; published form is TWIC-carded crews).
  const R40_STATS = { stagedP1: 0, landedP1: 0, deferredWave2: 0, stagedP2: 0, landedP2: 0, cellsAttempted: 0, cellsLanded: 0, headAttempted: 0, headLanded: 0, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0, byPort: {}, byService: {} };
  const R40_SOURCE_ROWS = [];
  {
    const portsDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ports.json'), 'utf8'));
    const R40_PAGE = {
      'port-virginia-inland-port': 'container-unloading-labor-front-royal-va',
      'port-of-virginia-norfolk': 'container-unloading-labor-norfolk-va',
      'port-richmond-marine-terminal': 'container-unloading-labor-richmond-va',
      'port-of-wilmington-de': 'container-unloading-labor-wilmington-de',
      'port-of-new-york-new-jersey': 'container-unloading-labor-newark-nj',
      'port-of-baltimore': 'container-unloading-labor-baltimore-md',
      'port-philaport': 'container-unloading-labor-philadelphia-pa',
      'port-of-huntington-tri-state': 'container-unloading-labor-huntington-wv',
    };
    const R40_BANK_PORT = {
      'Virginia Inland Port': 'port-virginia-inland-port',
      'Port of Virginia \u2014 Norfolk Harbor': 'port-of-virginia-norfolk',
      'Richmond Marine Terminal': 'port-richmond-marine-terminal',
      'Port of Wilmington (Delaware)': 'port-of-wilmington-de',
      'Port of New York and New Jersey': 'port-of-new-york-new-jersey',
      'Port of Baltimore': 'port-of-baltimore',
      'Helen Delich Bentley Port of Baltimore': 'port-of-baltimore',
      'PhilaPort \u2014 Port of Philadelphia': 'port-philaport',
      'Port of Huntington Tri-State (West Virginia river port)': 'port-of-huntington-tri-state',
    };
    const R40_PLACE = {
      'port-virginia-inland-port': 'Front Royal VA', 'port-of-virginia-norfolk': 'Norfolk VA',
      'port-richmond-marine-terminal': 'Richmond VA', 'port-of-wilmington-de': 'Wilmington DE',
      'port-of-new-york-new-jersey': 'Newark NJ',
      'port-of-baltimore': 'Baltimore MD', 'port-philaport': 'Philadelphia PA',
      'port-of-huntington-tri-state': 'Huntington WV',
    };
    const R40_PORTQ = {
      'port-virginia-inland-port': 'the Virginia Inland Port', 'port-of-virginia-norfolk': 'the Port of Virginia',
      'port-richmond-marine-terminal': 'Richmond Marine Terminal', 'port-of-wilmington-de': 'the Port of Wilmington',
      'port-of-new-york-new-jersey': 'the Port of New York and New Jersey',
      'port-of-baltimore': 'the Helen Delich Bentley Port of Baltimore', 'port-philaport': 'PhilaPort',
      'port-of-huntington-tri-state': 'the Port of Huntington Tri-State',
    };
    const R40_COL_PHRASE = {
      LU: 'container unloading labor', OC: 'container devanning and stuffing', TR: 'transloading',
      XD: 'cross-docking', RW: 'freight rework', '3P': '3PL completion labor',
      PM: 'logistics project management', WF: 'specialized warehouse workforce',
    };
    const R40_CLASS = (c) => (c === 'research' ? 'ai-question' : c);
    const R40_REFUSE_EXTRA = [
      { re: /\b(?:we|the company|our crews?)\s+(?:offer|provide|perform|handle|do)\w*\b[^.]{0,30}\bdrayage\b/i, why: 'drayage-offer' },
      { re: /\bdrayage\s+(?:is\s+)?(?:offered|included|provided|available)\b/i, why: 'drayage-offer' },
      { re: /\b(?:company|provider)\s+(?:is\s+)?twic[- ]certified\b/i, why: 'twic-certification-assertion' },
      { re: /\btwic[- ]certified\s+(?:company|crews|provider|teams)\b/i, why: 'twic-certification-assertion' },
    ];
    const r40Refuse = (q) => R35_TRUTH_REFUSE.find((t) => t.re.test(q)) || R40_REFUSE_EXTRA.find((t) => t.re.test(q)) || null;
    const r40SvcP1 = (o) => {
      const q = String(o.question || '').toLowerCase();
      const a = String(o.aspect || '');
      if (a === 'freight rework' || /\brework\b/.test(q)) return 'service-freight-rework-transloading';
      if (['transloading sourcing', 'transloading types', 'container-to-truck process', 'per-hundredweight pricing', 'lumper services', 'emergency recovery'].includes(a)) return 'service-transloading';
      if (/\btransload/.test(q)) return 'service-transloading';
      if (/\bcross[- ]dock/.test(q)) return 'service-freight-rework-transloading';
      if (['storage hold', 'single-engagement', 'both-ends labor', 'custody/port-to-door'].includes(a)) return 'service-3pl-support';
      if (/\b(?:devan|unload|stuff|destuff|container labor)\b/.test(q)) return 'service-transloading';
      return 'service-3pl-support';
    };
    const r40NamedPort = (q) => {
      const t = String(q || '').toLowerCase();
      if (/front royal|virginia inland port/.test(t)) return 'port-virginia-inland-port';
      if (/norfolk/.test(t)) return 'port-of-virginia-norfolk';
      if (/richmond/.test(t)) return 'port-richmond-marine-terminal';
      if (/wilmington/.test(t)) return 'port-of-wilmington-de';
      if (/newark|elizabeth|new york and new jersey|port newark/.test(t)) return 'port-of-new-york-new-jersey';
      if (/baltimore/.test(t)) return 'port-of-baltimore';
      if (/philadelphia|philaport/.test(t)) return 'port-philaport';
      if (/huntington/.test(t)) return 'port-of-huntington-tri-state';
      return null;
    };
    const r40Land = (svcId, intentClass, q, area, target, pattern, srcRow) => {
      const bad = r40Refuse(q);
      if (bad) {
        R40_STATS.truthRefused++;
        excluded.push({ reason: 'r40-truth-' + bad.why, serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const nk = svcId + '|' + r30Norm(q);
      if (r30NormSeen.has(nk)) {
        const first = r30NormSeen.get(nk);
        if (first === q) R40_STATS.collisionExact++; else R40_STATS.collisionNormalized++;
        excluded.push({ reason: 'r40-collision-bank-kept', serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const ok = emit(svcId, intentClass, q, area, target, pattern, { source: 'ports-3pl-bridge' });
      if (ok) {
        r30NormSeen.set(nk, q);
        R40_STATS.byService[svcId] = (R40_STATS.byService[svcId] || 0) + 1;
        if (area && area.startsWith('port-')) R40_STATS.byPort[area] = (R40_STATS.byPort[area] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R40_SOURCE_ROWS.push({ q, intent: intentClass, service_id: svcId, area, target_url: landedRow.target_url, pattern, bank: srcRow || null });
        return true;
      }
      R40_STATS.gateExcluded++;
      excluded.push({ reason: 'r40-gate-excluded', serviceId: svcId, queryText: q, pattern });
      return false;
    };
    // -- staged bank rows --
    const bankPath = path.join(ROOT, 'out', 'external-rubric-intake-ports3pl-bridge-2026-11-14', 'staging-bridge-rows.jsonl');
    const bankRows = [];
    if (fs.existsSync(bankPath)) {
      for (const line of fs.readFileSync(bankPath, 'utf8').split('\n')) {
        const t = line.trim();
        if (!t) continue;
        try { bankRows.push(JSON.parse(t)); } catch (e) { /* counted below as unparseable via staged totals */ }
      }
    }
    const portOrder = (portsDb.ports || []).map((p) => p.id);
    const p1 = bankRows.filter((o) => String(o.entry_point_id || '').startsWith('P-1'));
    p1.sort((a, b) => portOrder.indexOf(R40_BANK_PORT[a.port] || '') - portOrder.indexOf(R40_BANK_PORT[b.port] || ''));
    for (const o of p1) {
      R40_STATS.stagedP1++;
      const pid = R40_BANK_PORT[o.port];
      const page = pid && R40_PAGE[pid];
      if (!page) { R40_STATS.deferredWave2++; continue; }
      const q = americanize(String(o.question || '').trim());
      const cls = R40_CLASS(o.intent_class);
      if (!CLASS_ORDER.includes(cls) || !q) {
        R40_STATS.truthRefused++;
        excluded.push({ reason: 'r40-malformed-row', serviceId: null, queryText: q.slice(0, 80), pattern: 'R40-' + o.entry_point_id });
        continue;
      }
      if (r40Land(r40SvcP1(o), cls, q, pid, page, 'R40-' + o.entry_point_id, { entry_point_id: o.entry_point_id, aspect: o.aspect, buyer: o.buyer })) R40_STATS.landedP1++;
    }
    for (const o of bankRows.filter((x) => String(x.entry_point_id || '').startsWith('P-2'))) {
      R40_STATS.stagedP2++;
      const q = americanize(String(o.question || '').trim());
      const cls = R40_CLASS(o.intent_class);
      if (!CLASS_ORDER.includes(cls) || !q) {
        R40_STATS.truthRefused++;
        excluded.push({ reason: 'r40-malformed-row', serviceId: null, queryText: q.slice(0, 80), pattern: 'R40-' + o.entry_point_id });
        continue;
      }
      const pid = r40NamedPort(q);
      const svc = (o.aspect === 'freight rework' || o.aspect === 'pallet rework') ? 'service-freight-rework-transloading' : 'service-3pl-support';
      const target = (pid && R40_PAGE[pid]) ? R40_PAGE[pid] : HUB['service-3pl-support'];
      const area = pid || 'bridge-ports-3pl';
      if (r40Land(svc, cls, q, area, target, 'R40-' + o.entry_point_id, { entry_point_id: o.entry_point_id, aspect: o.aspect, buyer: o.buyer })) R40_STATS.landedP2++;
    }
    // -- generator cell rows: port × coverage column × question type --
    const R40_ASPECTS = [
      (ph, pq) => ['ai-question', 'are ' + ph + ' crews at ' + pq + ' TWIC-carded?'],
      (ph, pq) => ['ai-question', 'who offers 24/7 ' + ph + ' at ' + pq + '?'],
      (ph, pq) => ['ai-question', 'can ' + ph + ' crews scale to 1,000 TWIC-carded workers at ' + pq + '?'],
      (ph, pq) => ['ai-question', 'is ' + ph + ' at ' + pq + ' priced flat in writing?'],
    ];
    let portIdx = 0;
    for (const pid of Object.keys(R40_PAGE)) {
      portIdx++;
      const cells = (portsDb.serviceCoverage || []).filter((c) => c.port === pid && c.offered);
      const cols = [...new Map(cells.map((c) => [c.serviceColumn, c])).values()];
      let colIdx = 0;
      for (const c of cols) {
        colIdx++;
        const ph = R40_COL_PHRASE[c.serviceColumn];
        const pl = R40_PLACE[pid], pq = R40_PORTQ[pid];
        const forms = [
          ['navigational-local', ph + ' ' + pl],
          ['cost', 'how much does ' + ph + ' cost at ' + pq],
          ['how-process', 'how to hire ' + ph + ' at ' + pq],
          ['best-choice', 'best ' + ph + ' ' + pl],
          ['ai-question', 'who provides ' + ph + ' at ' + pq + '?'],
          R40_ASPECTS[(portIdx + colIdx) % 4](ph, pq),
        ];
        for (const [cls, q] of forms) {
          R40_STATS.cellsAttempted++;
          if (r40Land(c.service, cls, q, pid, R40_PAGE[pid], 'R40-cell-' + c.serviceColumn, null)) R40_STATS.cellsLanded++;
        }
      }
      // head terms for the port's labor page
      for (const q of ['devanning crews ' + R40_PLACE[pid], 'port labor ' + R40_PLACE[pid], 'container unloading ' + R40_PLACE[pid], 'devanning services ' + R40_PLACE[pid]]) {
        R40_STATS.headAttempted++;
        if (r40Land('service-transloading', 'navigational-local', q, pid, R40_PAGE[pid], 'R40-head', null)) R40_STATS.headLanded++;
      }
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r40-accounting.json'),
        JSON.stringify({ r40: R40_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r40-source-rows.jsonl'),
        R40_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }

  // R41 (Office Decommissioning & Liquidation Takeover, 2026-11-14):
  // the category bank for the six DC / Northern Virginia surrender
  // markets. DETERMINISM LAW: the lane reads data/office-decom.json
  // (the program registry) only — never rubric.db; dedupe/binding
  // reference is this run's rows. Generator-emitted cell rows per
  // (area x door): the registry's ten doors (core decommissioning,
  // liquidation, lease surrender, federal/GSA surrender, conversion
  // cleanout, cubicle removal, cost, process, best-choice, IT/e-waste
  // coordination) x six question forms — navigational-local, cost,
  // how-process, best-choice, ai-question, plus a rotating advantage
  // aspect (one flat rate in writing / broom-clean handback /
  // documented disposition coordination — resale, donation, recycling
  // — never a furniture purchase / one crew for removal, transport
  // and storage). AREA KEY: the registry area id (the bank's standing
  // non-feature-area convention, like port ids); hub head rows carry
  // 'decom-program'. SERVICE per row = the door's registry service.
  // HEAD TERMS: seven per area plus eight on the category hub, one
  // owner per search. TRUTH SCREEN: the R35 base refuse set is the
  // backstop, plus this lane's extras — any per-square-foot rate
  // assertion (pricing is per job; that IS the flat rate) and any
  // furniture-buying assertion (the company coordinates disposition;
  // it never buys furniture or pays cash for assets).
  const R41_STATS = { cellsAttempted: 0, cellsLanded: 0, headAttempted: 0, headLanded: 0, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0, byArea: {}, byService: {} };
  const R41_SOURCE_ROWS = [];
  {
    const decomDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'office-decom.json'), 'utf8'));
    const R41_REFUSE_EXTRA = [
      { re: /\bper\s+(?:square\s+foot|sq\.?\s?ft)\b/i, why: 'per-square-foot-rate' },
      { re: /\b(?:we|the company|our crews?|the provider)\s+(?:buy|buys|buying|purchase|purchases|pay|pays)\b[^.]{0,40}\b(?:furniture|assets|equipment|inventory)\b/i, why: 'furniture-buying-assertion' },
      { re: /\bcash\s+for\s+(?:your\s+)?(?:office\s+)?(?:furniture|assets|equipment)\b/i, why: 'furniture-buying-assertion' },
    ];
    const r41Refuse = (q) => R35_TRUTH_REFUSE.find((t) => t.re.test(q)) || R41_REFUSE_EXTRA.find((t) => t.re.test(q)) || null;
    const r41Land = (svcId, intentClass, q, area, target, pattern) => {
      const bad = r41Refuse(q);
      if (bad) {
        R41_STATS.truthRefused++;
        excluded.push({ reason: 'r41-truth-' + bad.why, serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const nk = svcId + '|' + r30Norm(q);
      if (r30NormSeen.has(nk)) {
        const first = r30NormSeen.get(nk);
        if (first === q) R41_STATS.collisionExact++; else R41_STATS.collisionNormalized++;
        excluded.push({ reason: 'r41-collision-bank-kept', serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const ok = emit(svcId, intentClass, q, area, target, pattern, { source: 'office-decom-takeover' });
      if (ok) {
        r30NormSeen.set(nk, q);
        R41_STATS.byService[svcId] = (R41_STATS.byService[svcId] || 0) + 1;
        if (area) R41_STATS.byArea[area] = (R41_STATS.byArea[area] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R41_SOURCE_ROWS.push({ q, intent: intentClass, service_id: svcId, area, target_url: landedRow.target_url, pattern });
        return true;
      }
      R41_STATS.gateExcluded++;
      excluded.push({ reason: 'r41-gate-excluded', serviceId: svcId, queryText: q, pattern });
      return false;
    };
    const R41_ASPECTS = [
      (base, pq) => ['ai-question', 'is ' + base + ' in ' + pq + ' priced as one flat rate in writing?'],
      (base, pq) => ['ai-question', 'does ' + base + ' in ' + pq + ' end with a broom-clean handback?'],
      (base, pq) => ['ai-question', 'who coordinates resale, donation and recycling during ' + base + ' in ' + pq + '?'],
      (base, pq) => ['ai-question', 'can one crew handle removal, transport and storage for ' + base + ' in ' + pq + '?'],
    ];
    const R41_BASE_DOORS = { cost: 1, best: 1, process: 1 };
    let areaIdx = 0;
    for (const area of decomDb.areas) {
      areaIdx++;
      const pl = area.placeLabel, pq = area.placeQ;
      let doorIdx = 0;
      for (const door of decomDb.doors) {
        doorIdx++;
        const ph = door.phrase;
        const base = R41_BASE_DOORS[door.id] ? 'office decommissioning' : ph;
        let forms;
        if (door.id === 'cost') {
          forms = [
            ['navigational-local', ph + ' ' + pl],
            ['cost', 'how much does office decommissioning cost in ' + pl],
            ['how-process', 'how is office decommissioning priced in ' + pl],
            ['best-choice', 'best office decommissioning company ' + pl],
            ['ai-question', 'who provides office decommissioning in ' + pq + '?'],
          ];
        } else if (door.id === 'best') {
          forms = [
            ['navigational-local', ph + ' ' + pl],
            ['cost', 'what does the best office decommissioning company in ' + pl + ' charge'],
            ['how-process', 'how to choose an office decommissioning company in ' + pl],
            ['best-choice', 'best office decommissioning services ' + pl],
            ['ai-question', 'who is the best office decommissioning company in ' + pq + '?'],
          ];
        } else if (door.id === 'process') {
          forms = [
            ['navigational-local', ph + ' ' + pl],
            ['cost', 'how much does office decommissioning cost in ' + pl],
            ['how-process', 'how does the office decommissioning process work in ' + pl],
            ['best-choice', 'best office decommissioning services ' + pl],
            ['ai-question', 'who provides office decommissioning services in ' + pq + '?'],
          ];
        } else {
          forms = [
            ['navigational-local', ph + ' ' + pl],
            ['cost', 'how much does ' + ph + ' cost in ' + pl],
            ['how-process', 'how does ' + ph + ' work in ' + pl],
            ['best-choice', 'best ' + ph + ' ' + pl],
            ['ai-question', 'who provides ' + ph + ' in ' + pq + '?'],
          ];
        }
        forms.push(R41_ASPECTS[(areaIdx + doorIdx) % 4](base, pq));
        for (const [cls, q] of forms) {
          R41_STATS.cellsAttempted++;
          if (r41Land(door.service, cls, q, area.id, area.pageSlug, 'R41-cell-' + door.id)) R41_STATS.cellsLanded++;
        }
      }
      // head terms for the area page (service-office-moving owns them)
      for (const h of ['office decommissioning', 'office liquidation', 'office furniture liquidation', 'office furniture removal', 'office decommissioning services', 'office decommissioning companies', 'commercial office decommissioning']) {
        R41_STATS.headAttempted++;
        if (r41Land('service-office-moving', 'navigational-local', h + ' ' + pl, area.id, area.pageSlug, 'R41-head')) R41_STATS.headLanded++;
      }
    }
    // hub head terms — the category hub owns the unplaced heads
    for (const q of ['office decommissioning', 'office liquidation', 'office furniture liquidation', 'office decommissioning services', 'office decommissioning companies', 'office decommissioning Washington DC', 'office decommissioning Northern Virginia', 'office liquidation Northern Virginia']) {
      R41_STATS.headAttempted++;
      if (r41Land('service-office-moving', 'navigational-local', q, 'decom-program', 'office-decommissioning', 'R41-head')) R41_STATS.headLanded++;
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r41-accounting.json'),
        JSON.stringify({ r41: R41_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r41-source-rows.jsonl'),
        R41_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }

  // R42 (Warehouse Racking + Distribution-Center Decommissioning
  // Takeover, 2026-11-15): the category bank for the six I-81
  // corridor distribution markets. DETERMINISM LAW: the lane reads
  // data/warehouse-racking.json (the program registry) only — never
  // rubric.db; dedupe/binding reference is this run's rows.
  // Generator-emitted cell rows per (area x door): the registry's
  // eleven doors (decommissioning, rack teardown, racking relocation,
  // reinstallation and re-anchoring, used-rack buyback, lease
  // handback, inventory relay, transport, cost, process, best-choice)
  // x six question forms — navigational-local, cost, how-process,
  // best-choice, ai-question, plus a rotating advantage aspect (one
  // flat rate in writing / the buyback credit shown as a line item
  // against the flat-rate total / anchor removal and slab patch for a
  // landlord-ready handback / one crew for teardown, transport and
  // reinstallation — the two advantages settled by Henry 2026-11-15
  // ride the lane, never as filler). AREA KEY: the registry area id
  // (the bank's standing non-feature-area convention, like port ids);
  // hub head rows carry 'racking-program'. SERVICE per row = the
  // door's registry service. HEAD TERMS: seven per area plus eight on
  // the category hub, one owner per search — 'warehouse racking
  // relocation' and its Staunton form stay with the pre-existing
  // warehouse-racking-relocation page that already owns them.
  // TRUTH SCREEN: the R35 base refuse set is the backstop, plus this
  // lane's extras — any per-bay / per-beam / per-pallet-position rate
  // assertion (pricing is per job; that IS the flat rate) and any
  // resale-benchmark figure (the $175-$200 per-pallet-position
  // research benchmark is market evidence, internal only, never an
  // FRM figure).
  const R42_STATS = { cellsAttempted: 0, cellsLanded: 0, headAttempted: 0, headLanded: 0, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0, byArea: {}, byService: {} };
  const R42_SOURCE_ROWS = [];
  {
    const rackDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'warehouse-racking.json'), 'utf8'));
    const R42_REFUSE_EXTRA = [
      { re: /\bper\s+(?:bay|beam|pallet\s+position)\b/i, why: 'per-unit-rate' },
      { re: /\$\s?(?:175|200)\b/, why: 'resale-benchmark-figure' },
    ];
    const r42Refuse = (q) => R35_TRUTH_REFUSE.find((t) => t.re.test(q)) || R42_REFUSE_EXTRA.find((t) => t.re.test(q)) || null;
    const r42Land = (svcId, intentClass, q, area, target, pattern) => {
      const bad = r42Refuse(q);
      if (bad) {
        R42_STATS.truthRefused++;
        excluded.push({ reason: 'r42-truth-' + bad.why, serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const nk = svcId + '|' + r30Norm(q);
      if (r30NormSeen.has(nk)) {
        const first = r30NormSeen.get(nk);
        if (first === q) R42_STATS.collisionExact++; else R42_STATS.collisionNormalized++;
        excluded.push({ reason: 'r42-collision-bank-kept', serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const ok = emit(svcId, intentClass, q, area, target, pattern, { source: 'warehouse-racking-takeover' });
      if (ok) {
        r30NormSeen.set(nk, q);
        R42_STATS.byService[svcId] = (R42_STATS.byService[svcId] || 0) + 1;
        if (area) R42_STATS.byArea[area] = (R42_STATS.byArea[area] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R42_SOURCE_ROWS.push({ q, intent: intentClass, service_id: svcId, area, target_url: landedRow.target_url, pattern });
        return true;
      }
      R42_STATS.gateExcluded++;
      excluded.push({ reason: 'r42-gate-excluded', serviceId: svcId, queryText: q, pattern });
      return false;
    };
    const R42_ASPECTS = [
      (base, pq) => ['ai-question', 'is ' + base + ' in ' + pq + ' priced as one flat rate in writing?'],
      (base, pq) => ['ai-question', 'does the used rack buyback credit show as a line item against the flat rate for ' + base + ' in ' + pq + '?'],
      (base, pq) => ['ai-question', 'does ' + base + ' in ' + pq + ' include anchor removal and slab patch for a landlord-ready handback?'],
      (base, pq) => ['ai-question', 'can one crew handle teardown, transport and reinstallation for ' + base + ' in ' + pq + '?'],
    ];
    const R42_BASE_DOORS = { cost: 1, best: 1, process: 1 };
    let areaIdx = 0;
    for (const area of rackDb.areas) {
      areaIdx++;
      const pl = area.placeLabel, pq = area.placeQ;
      let doorIdx = 0;
      for (const door of rackDb.doors) {
        doorIdx++;
        const ph = door.phrase;
        const base = R42_BASE_DOORS[door.id] ? 'distribution center decommissioning' : ph;
        let forms;
        if (door.id === 'cost') {
          forms = [
            ['navigational-local', ph + ' ' + pl],
            ['cost', 'how much does distribution center decommissioning cost in ' + pl],
            ['how-process', 'how is distribution center decommissioning priced in ' + pl],
            ['best-choice', 'best distribution center decommissioning company ' + pl],
            ['ai-question', 'who provides distribution center decommissioning in ' + pq + '?'],
          ];
        } else if (door.id === 'best') {
          forms = [
            ['navigational-local', ph + ' ' + pl],
            ['cost', 'what does the best warehouse decommissioning company in ' + pl + ' charge'],
            ['how-process', 'how to choose a warehouse decommissioning company in ' + pl],
            ['best-choice', 'best warehouse decommissioning services ' + pl],
            ['ai-question', 'who is the best warehouse decommissioning company in ' + pq + '?'],
          ];
        } else if (door.id === 'process') {
          forms = [
            ['navigational-local', ph + ' ' + pl],
            ['cost', 'how much does distribution center decommissioning cost in ' + pl],
            ['how-process', 'how does the warehouse decommissioning process work in ' + pl],
            ['best-choice', 'best warehouse decommissioning services ' + pl],
            ['ai-question', 'who provides warehouse decommissioning services in ' + pq + '?'],
          ];
        } else {
          forms = [
            ['navigational-local', ph + ' ' + pl],
            ['cost', 'how much does ' + ph + ' cost in ' + pl],
            ['how-process', 'how does ' + ph + ' work in ' + pl],
            ['best-choice', 'best ' + ph + ' ' + pl],
            ['ai-question', 'who provides ' + ph + ' in ' + pq + '?'],
          ];
        }
        forms.push(R42_ASPECTS[(areaIdx + doorIdx) % 4](base, pq));
        for (const [cls, q] of forms) {
          R42_STATS.cellsAttempted++;
          if (r42Land(door.service, cls, q, area.id, area.pageSlug, 'R42-cell-' + door.id)) R42_STATS.cellsLanded++;
        }
      }
      // head terms for the area page (service-warehouse-racking-
      // relocation owns them; the bare racking-relocation head stays
      // with the pre-existing racking page that already owns it)
      const heads = ['distribution center decommissioning', 'warehouse racking relocation', 'pallet rack teardown and removal', 'warehouse racking movers', 'distribution center decommissioning services', 'distribution center decommissioning companies', 'warehouse decommissioning services'];
      if (area.id === 'racking-staunton') heads[1] = 'warehouse racking relocation services';
      for (const h of heads) {
        R42_STATS.headAttempted++;
        if (r42Land('service-warehouse-racking-relocation', 'navigational-local', h + ' ' + pl, area.id, area.pageSlug, 'R42-head')) R42_STATS.headLanded++;
      }
    }
    // hub head terms — the category hub owns the unplaced heads
    for (const q of ['distribution center decommissioning', 'pallet rack teardown and removal', 'used pallet rack buyback', 'distribution center decommissioning services', 'distribution center decommissioning companies', 'warehouse decommissioning services', 'warehouse racking relocation services', 'distribution center decommissioning Virginia']) {
      R42_STATS.headAttempted++;
      if (r42Land('service-warehouse-racking-relocation', 'navigational-local', q, 'racking-program', 'distribution-center-decommissioning', 'R42-head')) R42_STATS.headLanded++;
    }
    // R42 VARIANT COVERAGE (Henry, 2026-11-15; checklist section 6):
    // every cell (area x door) carries the full phrasing-family set
    // around its head phrase — proximity, locality scale, radius,
    // ZIP forms, relation words and AI-question forms. Variants are
    // GENERATED from machine data only: the registry (areas, doors),
    // data/service-area.geojson (each area's geo record — postal
    // codes and coordinates; the dispatch branch's coordinates give
    // the radius bucket by centroid distance, the Territory Matrix
    // method) and the registry's own postalCode as the second ZIP
    // source where the geo record's differs (Martinsburg 25404 geo /
    // 25401 market). Never hand-listed; determinism law holds.
    {
      const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-area.geojson'), 'utf8'));
      const featById = {};
      for (const f of geo.features || []) if (f.properties && f.properties.id) featById[f.properties.id] = f;
      const havMi = (lat1, lon1, lat2, lon2) => {
        const R = 3958.8, t = Math.PI / 180;
        const dLat = (lat2 - lat1) * t, dLon = (lon2 - lon1) * t;
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(h));
      };
      const bucket = (mi) => (mi <= 10 ? 10 : mi <= 20 ? 20 : mi <= 35 ? 35 : mi <= 50 ? 50 : 75);
      R42_STATS.variantsAttempted = 0; R42_STATS.variantsLanded = 0; R42_STATS.byFamily = {};
      const landV = (svcId, cls, q, area, target, family) => {
        R42_STATS.variantsAttempted++;
        if (r42Land(svcId, cls, q, area, target, 'R42-variant-' + family)) {
          R42_STATS.variantsLanded++;
          R42_STATS.byFamily[family] = (R42_STATS.byFamily[family] || 0) + 1;
        }
      };
      for (const area of rackDb.areas) {
        const pl = area.placeLabel, pq = area.placeQ;
        const feat = featById[area.geoFeature];
        const zips = geoZipSet(area.geoFeature);
        const branchFeat = featById['place-' + area.branch + '-' + (area.branch === 'winchester' ? 'va' : 'wv')];
        let radius = 25;
        if (feat && branchFeat && feat.geometry && branchFeat.geometry) {
          const [lo1, la1] = feat.geometry.coordinates, [lo2, la2] = branchFeat.geometry.coordinates;
          radius = bucket(havMi(la1, lo1, la2, lo2));
        }
        for (const door of rackDb.doors) {
          const ph = door.phrase;
          const base = R42_BASE_DOORS[door.id] ? 'distribution center decommissioning' : ph;
          // PROXIMITY
          landV(door.service, 'navigational-local', ph + ' near me', area.id, area.pageSlug, 'proximity');
          landV(door.service, 'best-choice', 'best ' + ph + ' near me', area.id, area.pageSlug, 'proximity');
          landV(door.service, 'navigational-local', ph + ' nearby', area.id, area.pageSlug, 'proximity');
          landV(door.service, 'navigational-local', ph + ' near ' + pl, area.id, area.pageSlug, 'proximity');
          landV(door.service, 'navigational-local', ph + ' close to ' + pl, area.id, area.pageSlug, 'proximity');
          // LOCALITY SCALE
          landV(door.service, 'navigational-local', 'local ' + ph + ' ' + pl, area.id, area.pageSlug, 'locality');
          landV(door.service, 'navigational-local', ph + ' in ' + pl, area.id, area.pageSlug, 'locality');
          landV(door.service, 'navigational-local', ph + ' in ' + area.county + ' ' + area.state, area.id, area.pageSlug, 'locality');
          landV(door.service, 'navigational-local', ph + ' around ' + pl, area.id, area.pageSlug, 'locality');
          landV(door.service, 'navigational-local', 'regional ' + ph + ' ' + pl, area.id, area.pageSlug, 'locality');
          // RADIUS
          landV(door.service, 'navigational-local', ph + ' within ' + radius + ' miles of ' + pl, area.id, area.pageSlug, 'radius');
          landV(door.service, 'navigational-local', ph + ' serving the ' + pl + ' area', area.id, area.pageSlug, 'radius');
          // ZIP FORMS — every ZIP in the area's geo record (+ registry ZIP where it differs)
          for (const z of zips) {
            landV(door.service, 'navigational-local', ph + ' ' + z, area.id, area.pageSlug, 'zip');
            landV(door.service, 'navigational-local', ph + ' near ' + z, area.id, area.pageSlug, 'zip');
          }
          // RELATION WORDS
          landV(door.service, 'navigational-local', ph + ' serving ' + pq, area.id, area.pageSlug, 'relation');
          landV(door.service, 'navigational-local', ph + ' available in ' + pl, area.id, area.pageSlug, 'relation');
          landV(door.service, 'navigational-local', ph + ' based in ' + pl, area.id, area.pageSlug, 'relation');
          // AI-QUESTION FORMS
          landV(door.service, 'ai-question', 'how do i arrange ' + base + ' in ' + pl + '?', area.id, area.pageSlug, 'ai-question');
          landV(door.service, 'ai-question', 'what does ' + base + ' include in ' + pl + '?', area.id, area.pageSlug, 'ai-question');
        }
      }
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r42-accounting.json'),
        JSON.stringify({ r42: R42_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r42-source-rows.jsonl'),
        R42_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }

  // R43 (Ports Full-Formula, 2026-11-15): the ports lane goes from
  // HEAD-ONLY to FULL. Two staged external banks (1,320 rows, in
  // out/batch-ports-full-2026-11-15/) enter as the question-content
  // layer for the port cells — BIND 1,260 rows land; the 60
  // returns-processing rows are DEMAND-ONLY by their staged flag and
  // are counted, never landed (Henry's standing rule: no returns
  // program, ever). Registry-port rows bind to the ports' dedicated
  // hub pages (the pages this batch builds up); Charleston, Savannah
  // and Wilmington NC rows — real ports under Henry's any-port
  // contract rule with no registry page — bind to the /port-logistics/
  // program hub, as do the generic 'near the port' rows; the 440 3PL
  // corridor rows (40 x 11 cities) bind to the 3PL support hub. On
  // top of the bank, the lane emits the FULL section-6 variant
  // families per port cell (port x labor phrase), generated from
  // machine data only: data/ports.json (port name, city, the ZIP the
  // registry carries, binding-branch road miles for the radius
  // bucket — the R42 Territory Matrix method) — proximity, locality
  // scale, radius, ZIP forms, relation words, AI-question forms —
  // plus hub head terms and hub-bound cell question forms.
  // DETERMINISM LAW: the lane reads data/ports.json and the two
  // staged bank files only — never rubric.db; dedupe/binding
  // reference is this run's rows (the R40 lane ran earlier and keeps
  // its labor-page rows: one owner per search, collisions are
  // bank-kept and counted). INTENT: the banks' class vocabulary maps
  // onto the rubric's five classes deterministically (cost->cost,
  // process->how-process, choice->best-choice,
  // availability/pain/compliance->ai-question). SERVICE:
  // deterministic affinity in the R40 spirit (unloading / devanning /
  // transloading support / TWIC labor -> transloading; cross-dock /
  // pallet work -> freight-rework; labeling / sorting / cycle counts
  // / kitting -> 3pl-support). TRUTH SCREEN: the R35 base set plus
  // the R40 port extras (a drayage OFFER and a TWIC-certification
  // assertion are refused outright; the interrogative forms pass).
  // TWIC ANSWER RULE (Henry, 2026-11-15): answers to credential
  // questions state that every individual sent onsite holds their
  // own TWIC card and proper ID — the rows here are questions; the
  // answer layer carries the rule.
  const R43_STATS = { stagedTotal: 0, stagedBind: 0, landedBank: 0, demandOnly: 0, demandOther: 0, unmappedPlace: 0, cellsAttempted: 0, cellsLanded: 0, headAttempted: 0, headLanded: 0, variantsAttempted: 0, variantsLanded: 0, byFamily: {}, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0, byPort: {}, byService: {} };
  const R43_SOURCE_ROWS = [];
  {
    const portsDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ports.json'), 'utf8'));
    const R43_HUB = {
      'port-virginia-inland-port': 'virginia-inland-port-transloading',
      'port-of-virginia-norfolk': 'port-of-virginia-logistics',
      'port-richmond-marine-terminal': 'richmond-marine-terminal-logistics',
      'port-of-baltimore': 'port-of-baltimore-logistics',
      'port-of-wilmington-de': 'port-of-wilmington-logistics',
      'port-philaport': 'philaport-logistics',
      'port-of-huntington-tri-state': 'port-of-huntington-logistics',
      'port-of-new-york-new-jersey': 'port-of-new-york-new-jersey-logistics',
    };
    const R43_PROGRAM = 'port-logistics';
    const R43_3PL = '3pl-support-services';
    const R43_PLACE = {
      'port-virginia-inland-port': 'Front Royal VA', 'port-of-virginia-norfolk': 'Norfolk VA',
      'port-richmond-marine-terminal': 'Richmond VA', 'port-of-baltimore': 'Baltimore MD',
      'port-of-wilmington-de': 'Wilmington DE', 'port-philaport': 'Philadelphia PA',
      'port-of-huntington-tri-state': 'Huntington WV', 'port-of-new-york-new-jersey': 'Newark NJ',
    };
    const R43_PORTQ = {
      'port-virginia-inland-port': 'the Virginia Inland Port', 'port-of-virginia-norfolk': 'the Port of Virginia',
      'port-richmond-marine-terminal': 'Richmond Marine Terminal', 'port-of-wilmington-de': 'the Port of Wilmington',
      'port-philaport': 'PhilaPort', 'port-of-baltimore': 'the Helen Delich Bentley Port of Baltimore',
      'port-of-huntington-tri-state': 'the Port of Huntington Tri-State',
      'port-of-new-york-new-jersey': 'the Port of New York and New Jersey',
    };
    const R43_STATE = {
      'port-virginia-inland-port': 'Virginia', 'port-of-virginia-norfolk': 'Virginia',
      'port-richmond-marine-terminal': 'Virginia', 'port-of-baltimore': 'Maryland',
      'port-of-wilmington-de': 'Delaware', 'port-philaport': 'Pennsylvania',
      'port-of-huntington-tri-state': 'West Virginia', 'port-of-new-york-new-jersey': 'New Jersey',
    };
    const R43_BANK_PORT = {
      'Virginia Inland Port (Front Royal VA)': 'port-virginia-inland-port',
      'Port of Virginia (Norfolk)': 'port-of-virginia-norfolk',
      'Richmond Marine Terminal (Richmond VA)': 'port-richmond-marine-terminal',
      'Port of Baltimore': 'port-of-baltimore',
      'PhilaPort (Philadelphia)': 'port-philaport',
      'Port of Huntington Tri-State (Huntington WV)': 'port-of-huntington-tri-state',
      'Port of New York & New Jersey': 'port-of-new-york-new-jersey',
    };
    const R43_BANK_PROGRAM = {
      'Port of Wilmington NC': 'port-of-wilmington-nc',
      'Port of Charleston': 'port-of-charleston',
      'Port of Savannah': 'port-of-savannah',
      'near the port': 'port-program',
    };
    const R43_CORRIDOR = {
      'Winchester VA': 'winchester-va', 'Martinsburg WV': 'martinsburg-wv',
      'Hagerstown MD': 'hagerstown-md', 'Front Royal VA': 'front-royal-va',
      'Harrisonburg VA': 'harrisonburg-va', 'Staunton VA': 'staunton-va',
      'Richmond VA': 'richmond-va', 'Norfolk VA': 'norfolk-va',
      'Virginia Beach VA': 'virginia-beach-va', 'Baltimore MD': 'baltimore-md',
      'Philadelphia PA': 'philadelphia-pa',
    };
    const R43_SVC = {
      'container unloading crews': 'service-transloading',
      'devanning': 'service-transloading',
      'transloading support': 'service-transloading',
      'TWIC-carded port labor': 'service-transloading',
      'cross-dock labor': 'service-freight-rework-transloading',
      'pallet breakdown and rebuild': 'service-freight-rework-transloading',
      'shrink-wrap and palletizing': 'service-freight-rework-transloading',
      'labeling': 'service-3pl-support',
      'sorting': 'service-3pl-support',
      'inventory counts': 'service-3pl-support',
      'kitting and co-packing': 'service-3pl-support',
      '3PL warehouse labor': 'service-3pl-support',
    };
    const R43_CLASS = (c) => ({ cost: 'cost', process: 'how-process', choice: 'best-choice', availability: 'ai-question', pain: 'ai-question', compliance: 'ai-question' }[c] || null);
    const R43_REFUSE_EXTRA = [
      { re: /\b(?:we|the company|our crews?)\s+(?:offer|provide|perform|handle|do)\w*\b[^.]{0,30}\bdrayage\b/i, why: 'drayage-offer' },
      { re: /\bdrayage\s+(?:is\s+)?(?:offered|included|provided|available)\b/i, why: 'drayage-offer' },
      { re: /\b(?:company|provider)\s+(?:is\s+)?twic[- ]certified\b/i, why: 'twic-certification-assertion' },
      { re: /\btwic[- ]certified\s+(?:company|crews|provider|teams)\b/i, why: 'twic-certification-assertion' },
    ];
    const r43Refuse = (q) => R35_TRUTH_REFUSE.find((t) => t.re.test(q)) || R43_REFUSE_EXTRA.find((t) => t.re.test(q)) || null;
    const r43Land = (svcId, intentClass, q, area, target, pattern, srcRow) => {
      const bad = r43Refuse(q);
      if (bad) {
        R43_STATS.truthRefused++;
        excluded.push({ reason: 'r43-truth-' + bad.why, serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const nk = svcId + '|' + r30Norm(q);
      if (r30NormSeen.has(nk)) {
        const first = r30NormSeen.get(nk);
        if (first === q) R43_STATS.collisionExact++; else R43_STATS.collisionNormalized++;
        excluded.push({ reason: 'r43-collision-bank-kept', serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const ok = emit(svcId, intentClass, q, area, target, pattern, { source: 'ports-full-formula' });
      if (ok) {
        r30NormSeen.set(nk, q);
        R43_STATS.byService[svcId] = (R43_STATS.byService[svcId] || 0) + 1;
        if (area) R43_STATS.byPort[area] = (R43_STATS.byPort[area] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R43_SOURCE_ROWS.push({ q, intent: intentClass, service_id: svcId, area, target_url: landedRow.target_url, pattern, bank: srcRow || null });
        return true;
      }
      R43_STATS.gateExcluded++;
      excluded.push({ reason: 'r43-gate-excluded', serviceId: svcId, queryText: q, pattern });
      return false;
    };
    // -- staged bank ingest (bind rows only; demand-only counted) --
    const bankFiles = ['external-bank-staged.jsonl', 'external-bank-staged-2.jsonl'];
    for (const bf of bankFiles) {
      const bp = path.join(ROOT, 'out', 'batch-ports-full-2026-11-15', bf);
      if (!fs.existsSync(bp)) { console.error('R43 FAIL — staged bank missing: ' + bp); process.exit(1); }
      for (const line of fs.readFileSync(bp, 'utf8').split('\n')) {
        const t = line.trim();
        if (!t) continue;
        const o = JSON.parse(t);
        R43_STATS.stagedTotal++;
        if (o.truth_flag !== 'bind') {
          if (o.service === 'returns processing') R43_STATS.demandOnly++; else R43_STATS.demandOther++;
          excluded.push({ reason: 'r43-demand-only-never-binds', serviceId: null, queryText: String(o.q || '').slice(0, 80), pattern: 'R43-bank' });
          continue;
        }
        R43_STATS.stagedBind++;
        const q = americanize(String(o.q || '').trim());
        const cls = R43_CLASS(o.class);
        const svc = R43_SVC[o.service];
        let area = null, target = null;
        if (R43_BANK_PORT[o.place]) { area = R43_BANK_PORT[o.place]; target = R43_HUB[area]; }
        else if (R43_BANK_PROGRAM[o.place]) { area = R43_BANK_PROGRAM[o.place]; target = R43_PROGRAM; }
        else if (R43_CORRIDOR[o.place]) { area = 'corridor-' + R43_CORRIDOR[o.place]; target = R43_3PL; }
        if (!cls || !svc || !target || !q) {
          R43_STATS.unmappedPlace++;
          excluded.push({ reason: 'r43-unmapped-row', serviceId: svc || null, queryText: q.slice(0, 80), pattern: 'R43-bank' });
          continue;
        }
        if (r43Land(svc, cls, q, area, target, 'R43-bank', { service: o.service, place: o.place, class: o.class })) R43_STATS.landedBank++;
      }
    }
    // -- hub cell question forms + heads + full variant families --
    const R43_PHRASES = [
      ['container unloading crews', 'service-transloading'],
      ['devanning', 'service-transloading'],
      ['transloading support', 'service-transloading'],
      ['TWIC-carded port labor', 'service-transloading'],
      ['cross-dock labor', 'service-freight-rework-transloading'],
      ['pallet breakdown and rebuild', 'service-freight-rework-transloading'],
      ['shrink-wrap and palletizing', 'service-freight-rework-transloading'],
      ['labeling services', 'service-3pl-support'],
      ['freight sorting crews', 'service-3pl-support'],
      ['cycle count labor', 'service-3pl-support'],
      ['kitting and co-packing', 'service-3pl-support'],
      ['logistics project management', 'service-logistics-project-management'],
      ['specialized warehouse workforce', 'service-industrial-commercial'],
    ];
    const R43_ASPECTS = [
      (ph, pq) => 'who offers 24/7 ' + ph + ' at ' + pq + '?',
      (ph, pq) => 'is ' + ph + ' at ' + pq + ' priced flat in writing?',
      (ph, pq) => 'can ' + ph + ' scale to 1,000 TWIC-carded workers at ' + pq + '?',
    ];
    const R43_HEAD_EXTRA = {
      'port-richmond-marine-terminal': ['james river barge container labor', 'richmond express barge freight labor', 'barge container unloading richmond va'],
      'port-of-huntington-tri-state': ['river port labor huntington wv', 'ohio river freight labor'],
      'port-of-virginia-norfolk': ['norfolk harbor container labor'],
      'port-virginia-inland-port': ['inland port labor front royal va'],
      'port-of-baltimore': ['baltimore port labor services'],
      'port-of-wilmington-de': ['wilmington de port labor services'],
      'port-philaport': ['philaport container labor services'],
      'port-of-new-york-new-jersey': ['port newark container labor', 'newark port labor services'],
    };
    const bucket = (mi) => (mi <= 10 ? 10 : mi <= 20 ? 20 : mi <= 35 ? 35 : mi <= 50 ? 50 : 75);
    const landV = (svcId, cls, q, area, target, family) => {
      R43_STATS.variantsAttempted++;
      if (r43Land(svcId, cls, q, area, target, 'R43-variant-' + family)) {
        R43_STATS.variantsLanded++;
        R43_STATS.byFamily[family] = (R43_STATS.byFamily[family] || 0) + 1;
      }
    };
    let portIdx = 0;
    for (const pid of Object.keys(R43_HUB)) {
      portIdx++;
      const port = (portsDb.ports || []).find((p) => p.id === pid);
      const pl = R43_PLACE[pid], pq = R43_PORTQ[pid], target = R43_HUB[pid];
      const zip = port && port.address ? port.address.postalCode : null;
      const bm = portsDb.bindingMap[pid] || {};
      const milesRaw = bm.branch === 'martinsburg' ? bm.milesFromMartinsburg : bm.milesFromWinchester;
      const miles = parseFloat(String(milesRaw).split('-')[0]) || 75;
      const radius = bucket(miles);
      const nameLow = String(port.name || '').toLowerCase();
      let phraseIdx = 0;
      for (const [ph, svcId] of R43_PHRASES) {
        phraseIdx++;
        // cell question forms (hub-bound; the plain head forms stay
        // with the R40 labor pages — one owner per search)
        const cellForms = [
          ['ai-question', 'who provides ' + ph + ' at ' + pq + '?'],
          ['ai-question', R43_ASPECTS[(portIdx + phraseIdx) % 3](ph, pq)],
        ];
        for (const [cls, q] of cellForms) {
          R43_STATS.cellsAttempted++;
          if (r43Land(svcId, cls, q, pid, target, 'R43-cell')) R43_STATS.cellsLanded++;
        }
        // PROXIMITY
        landV(svcId, 'navigational-local', ph + ' near me', pid, target, 'proximity');
        landV(svcId, 'best-choice', 'best ' + ph + ' near me', pid, target, 'proximity');
        landV(svcId, 'navigational-local', ph + ' nearby', pid, target, 'proximity');
        landV(svcId, 'navigational-local', ph + ' near ' + pl, pid, target, 'proximity');
        landV(svcId, 'navigational-local', ph + ' close to ' + pl, pid, target, 'proximity');
        // LOCALITY SCALE
        landV(svcId, 'navigational-local', 'local ' + ph + ' ' + pl, pid, target, 'locality');
        landV(svcId, 'navigational-local', ph + ' in ' + pl, pid, target, 'locality');
        landV(svcId, 'navigational-local', ph + ' in ' + R43_STATE[pid], pid, target, 'locality');
        landV(svcId, 'navigational-local', ph + ' around ' + pl, pid, target, 'locality');
        landV(svcId, 'navigational-local', 'regional ' + ph + ' ' + pl, pid, target, 'locality');
        // RADIUS (bucket from the binding branch's measured road miles)
        landV(svcId, 'navigational-local', ph + ' within ' + radius + ' miles of ' + pl, pid, target, 'radius');
        landV(svcId, 'navigational-local', ph + ' serving the ' + pl + ' area', pid, target, 'radius');
        // ZIP FORMS (only where the port registry carries a ZIP)
        if (zip) {
          landV(svcId, 'navigational-local', ph + ' ' + zip, pid, target, 'zip');
          landV(svcId, 'navigational-local', ph + ' near ' + zip, pid, target, 'zip');
        }
        // RELATION WORDS
        landV(svcId, 'navigational-local', ph + ' serving ' + pq, pid, target, 'relation');
        landV(svcId, 'navigational-local', ph + ' available in ' + pl, pid, target, 'relation');
        landV(svcId, 'navigational-local', ph + ' based in ' + pl, pid, target, 'relation');
        // AI-QUESTION FORMS
        landV(svcId, 'ai-question', 'how do i arrange ' + ph + ' in ' + pl + '?', pid, target, 'ai-question');
        landV(svcId, 'ai-question', 'what does ' + ph + ' include at ' + pq + '?', pid, target, 'ai-question');
      }
      // head terms for the port's hub page
      const heads = [nameLow + ' logistics', nameLow + ' container labor', nameLow + ' transloading', 'port labor ' + pl, 'container unloading ' + pl].concat(R43_HEAD_EXTRA[pid] || []);
      for (const h of heads) {
        R43_STATS.headAttempted++;
        if (r43Land('service-transloading', 'navigational-local', h, pid, target, 'R43-head')) R43_STATS.headLanded++;
      }
    }
    // program hub heads (the any-port layer: Charleston, Savannah,
    // Wilmington NC and the generic port demand land here)
    for (const h of ['port labor services', 'port container labor services', 'container unloading labor services', 'port labor company', 'port labor charleston sc', 'container unloading crews charleston sc', 'port labor savannah ga', 'container unloading crews savannah ga', 'port labor wilmington nc', 'container unloading crews wilmington nc']) {
      R43_STATS.headAttempted++;
      if (r43Land('service-transloading', 'navigational-local', h, 'port-program', R43_PROGRAM, 'R43-head')) R43_STATS.headLanded++;
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r43-accounting.json'),
        JSON.stringify({ r43: R43_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r43-source-rows.jsonl'),
        R43_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }

  // R44 (Money Top-3 Full-Formula, 2026-11-15): the first three
  // Tier-1 money pages of the money-page sweep get the new process's
  // section-6 variant coverage — /gun-safe-movers/ (the SIR flagship
  // hub), /commercial-movers-winchester-va/ and
  // /local-regional-movers-winchester-va/ (the Winchester branch
  // heads). The pre-batch family census (rubric.db, 2026-11-15) read
  // the same signature as the ports census: radius 0, ZIP 0, relation
  // 0 on all three pages, proximity-with-place nearly absent — the
  // pages owned their head forms and starved the variant families.
  // CELLS are derived from machine data only (determinism law: the
  // lane reads data/service-area.geojson + data/pages.json, never
  // rubric.db): a target's cells are the geojson place features
  // carrying the service's coverage token whose estate binding lands
  // on the target — the gun-safe hub takes the shared ('both')
  // branch towns (its proven long-tail role; towns with a dedicated
  // gun-safe page are excluded by the pages registry), the two
  // Winchester branch heads take the Winchester-branch places
  // (including the Winchester branch home feature itself). Per cell
  // the lane emits the FULL section-6 families in the R42/R43 shapes
  // — proximity, locality scale, radius (bucket from the binding
  // branch seat's coordinates, the Territory Matrix centroid
  // method; the hub's shared towns read from the nearer branch
  // seat), ZIP forms (the geo record's postal code), relation words
  // and AI-question forms — plus per-cell question forms and one
  // rotating service aspect per cell. TRUTH SCREEN: the R35 base set
  // plus gun-safe extras — no query may imply a locksmith or
  // safe-opening service (never offered). Gun-safe aspects stay
  // inside the published fact set: stairs up/down, re-anchoring on
  // request, the 1,500-3,500 lb SIR band (over-1,500-lb form).
  const R44_STATS = { cellsAttempted: 0, cellsLanded: 0, variantsAttempted: 0, variantsLanded: 0, byFamily: {}, byPage: {}, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0 };
  const R44_SOURCE_ROWS = [];
  {
    const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-area.geojson'), 'utf8'));
    const featById = {};
    for (const f of geo.features || []) if (f.properties && f.properties.id) featById[f.properties.id] = f;
    const pagesDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages.json'), 'utf8'));
    const pageSlugs = new Set((pagesDb.pages || []).map((p) => p.slug));
    const havMi = (lat1, lon1, lat2, lon2) => {
      const R = 3958.8, t = Math.PI / 180;
      const dLat = (lat2 - lat1) * t, dLon = (lon2 - lon1) * t;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    const bucket = (mi) => (mi <= 10 ? 10 : mi <= 20 ? 20 : mi <= 35 ? 35 : mi <= 50 ? 50 : 75);
    const seatCoords = (fid) => {
      const f = featById[fid];
      return (f && f.geometry && f.geometry.coordinates) ? f.geometry.coordinates : null;
    };
    const winSeat = seatCoords('place-winchester-va');
    const marSeat = seatCoords('place-martinsburg-wv');
    const R44_STATE_NAME = { VA: 'Virginia', WV: 'West Virginia', MD: 'Maryland', DC: 'Washington DC', PA: 'Pennsylvania' };
    const R44_REFUSE_EXTRA = [
      { re: /\blocksmith\b/i, why: 'locksmith-claim' },
      { re: /\bsafe cracking\b/i, why: 'safe-cracking-claim' },
      { re: /\bopen(?:s|ing)? (?:a |the |my )?locked safe\b/i, why: 'safe-opening-claim' },
    ];
    const r44Refuse = (q) => R35_TRUTH_REFUSE.find((t) => t.re.test(q)) || R44_REFUSE_EXTRA.find((t) => t.re.test(q)) || null;
    const r44Land = (svcId, intentClass, q, area, target, pattern) => {
      const bad = r44Refuse(q);
      if (bad) {
        R44_STATS.truthRefused++;
        excluded.push({ reason: 'r44-truth-' + bad.why, serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const nk = svcId + '|' + r30Norm(q);
      if (r30NormSeen.has(nk)) {
        const first = r30NormSeen.get(nk);
        if (first === q) R44_STATS.collisionExact++; else R44_STATS.collisionNormalized++;
        excluded.push({ reason: 'r44-collision-bank-kept', serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const ok = emit(svcId, intentClass, q, area, target, pattern, { source: 'money-top3-formula' });
      if (ok) {
        r30NormSeen.set(nk, q);
        R44_STATS.byPage[target] = (R44_STATS.byPage[target] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R44_SOURCE_ROWS.push({ q, intent: intentClass, service_id: svcId, area, target_url: landedRow.target_url, pattern });
        return true;
      }
      R44_STATS.gateExcluded++;
      excluded.push({ reason: 'r44-gate-excluded', serviceId: svcId, queryText: q, pattern });
      return false;
    };
    const landV = (svcId, cls, q, area, target, family) => {
      R44_STATS.variantsAttempted++;
      if (r44Land(svcId, cls, q, area, target, 'R44-variant-' + family)) {
        R44_STATS.variantsLanded++;
        R44_STATS.byFamily[family] = (R44_STATS.byFamily[family] || 0) + 1;
      }
    };
    const R44_ASPECTS = {
      'service-gun-safe': [
        (pq) => 'can gun safe movers take a safe up or down stairs in ' + pq + '?',
        (pq) => 'do gun safe movers re-anchor the safe after placing it in ' + pq + '?',
        (pq) => 'who can move a gun safe over 1,500 pounds in ' + pq + '?',
      ],
      'service-commercial': [
        (pq) => 'can commercial movers work after hours in ' + pq + '?',
        (pq) => 'who provides commercial moving services in ' + pq + '?',
        (pq) => 'can commercial movers move an office in phases in ' + pq + '?',
      ],
      'service-local-regional': [
        (pq) => 'do local movers charge a flat rate in ' + pq + '?',
        (pq) => 'who are the local movers in ' + pq + '?',
        (pq) => 'can local movers in ' + pq + ' move just a few heavy items?',
      ],
    };
    const R44_TARGETS = [
      { svc: 'service-gun-safe', token: 'gun-safe', slug: 'gun-safe-movers', phrase: 'gun safe movers', base: 'gun safe moving', rule: 'both' },
      { svc: 'service-commercial', token: 'commercial-moving', slug: 'commercial-movers-winchester-va', phrase: 'commercial movers', base: 'commercial moving', rule: 'winchester' },
      { svc: 'service-local-regional', token: 'local-regional', slug: 'local-regional-movers-winchester-va', phrase: 'local movers', base: 'local moving', rule: 'winchester' },
    ];
    for (const T of R44_TARGETS) {
      const cells = [];
      for (const f of geo.features || []) {
        const p = f.properties || {};
        if (!p.id || !p.id.startsWith('place-')) continue;
        if (!(p.services || []).includes(T.token)) continue;
        if (T.rule === 'both') {
          if (p.branch !== 'both') continue;
          if (pageSlugs.has(T.slug + '-' + p.id.replace('place-', ''))) continue;
        } else if (p.branch !== 'winchester') continue;
        cells.push(f);
      }
      let cellIdx = 0;
      for (const f of cells) {
        cellIdx++;
        const p = f.properties;
        const pl = String(p.name || '').replace(/,/g, '');
        const pq = String(p.name || '');
        const stateName = R44_STATE_NAME[p.state] || null;
        const countyTail = String(p.county || '').split('/').pop().trim();
        const county = /County$/.test(countyTail) ? countyTail : null;
        const zip = geoZipPrimary(p.id);
        let radius = 25;
        if (f.geometry && f.geometry.coordinates) {
          const [lo, la] = f.geometry.coordinates;
          const seats = T.rule === 'both' ? [winSeat, marSeat].filter(Boolean) : [winSeat].filter(Boolean);
          let best = null;
          for (const s of seats) { const d = havMi(la, lo, s[1], s[0]); if (best === null || d < best) best = d; }
          if (best !== null) radius = bucket(best);
        }
        const ph = T.phrase, base = T.base, area = p.id, target = T.slug;
        // cell question forms
        const cellForms = [
          ['ai-question', 'who provides ' + ph + ' in ' + pq + '?'],
          ['ai-question', R44_ASPECTS[T.svc][cellIdx % R44_ASPECTS[T.svc].length](pq)],
        ];
        for (const [cls, q] of cellForms) {
          R44_STATS.cellsAttempted++;
          if (r44Land(T.svc, cls, q, area, target, 'R44-cell')) R44_STATS.cellsLanded++;
        }
        // PROXIMITY
        landV(T.svc, 'navigational-local', ph + ' near me', area, target, 'proximity');
        landV(T.svc, 'best-choice', 'best ' + ph + ' near me', area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' nearby', area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' near ' + pl, area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' close to ' + pl, area, target, 'proximity');
        // LOCALITY SCALE
        if (!ph.startsWith('local ')) landV(T.svc, 'navigational-local', 'local ' + ph + ' ' + pl, area, target, 'locality');
        landV(T.svc, 'navigational-local', ph + ' in ' + pl, area, target, 'locality');
        if (county) landV(T.svc, 'navigational-local', ph + ' in ' + county + ' ' + p.state, area, target, 'locality');
        if (stateName) landV(T.svc, 'navigational-local', ph + ' in ' + stateName, area, target, 'locality');
        landV(T.svc, 'navigational-local', ph + ' around ' + pl, area, target, 'locality');
        landV(T.svc, 'navigational-local', 'regional ' + ph + ' ' + pl, area, target, 'locality');
        // RADIUS
        landV(T.svc, 'navigational-local', ph + ' within ' + radius + ' miles of ' + pl, area, target, 'radius');
        landV(T.svc, 'navigational-local', ph + ' serving the ' + pl + ' area', area, target, 'radius');
        // ZIP FORMS — the place's geo record postal code
        if (zip) {
          landV(T.svc, 'navigational-local', ph + ' ' + zip, area, target, 'zip');
          landV(T.svc, 'navigational-local', ph + ' near ' + zip, area, target, 'zip');
        }
        // RELATION WORDS
        landV(T.svc, 'navigational-local', ph + ' serving ' + pq, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' covering ' + pq, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' available in ' + pl, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' based in ' + pl, area, target, 'relation');
        // AI-QUESTION FORMS
        landV(T.svc, 'ai-question', 'how do i arrange ' + base + ' in ' + pl + '?', area, target, 'ai-question');
        landV(T.svc, 'ai-question', 'what does ' + base + ' include in ' + pl + '?', area, target, 'ai-question');
      }
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r44-accounting.json'),
        JSON.stringify({ r44: R44_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r44-source-rows.jsonl'),
        R44_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }

  // R45 (Money Next-3 Full-Formula, 2026-11-15): the next three
  // Tier-1 money pages of the money-page sweep get the same section-6
  // variant coverage as R44 — /residential-moving/ (the flagship
  // consumer hub), /long-distance-movers-winchester-va/ (the
  // Winchester branch head for long-distance) and
  // /local-regional-movers-martinsburg-wv/ (the Martinsburg branch
  // head, mirror of R44's Winchester local head). The pre-build
  // family census on the data-audit-corrected bank (rubric.db,
  // 2026-11-15) read the identical signature: radius 0, ZIP 0,
  // relation 0 on all three pages, proximity 12 / 1 / 0. CELLS are
  // derived from machine data only (determinism law: data/
  // service-area.geojson + data/pages.json, never rubric.db): the
  // residential hub takes every place feature carrying its coverage
  // token (its proven service-owner role across both branches'
  // towns; no dedicated residential place pages exist in the
  // registry today, and the R44-style registry check is kept so a
  // future one can never be double-owned), the Winchester head
  // takes the Winchester-branch places and the Martinsburg head
  // takes the Martinsburg-branch places — each including its own
  // branch home feature. Radius buckets read the binding branch
  // seat's coordinates (the hub reads the nearer seat), the
  // Territory Matrix centroid method, as in R44. TRUTH SCREEN: the
  // R35 base set plus an authority-number screen — no row may ask
  // for a USDOT / DOT / MC number (none is published; interstate
  // authority sits with the carriers the company engages).
  // Long-distance aspects stay inside the published fact set: flat
  // rate in writing; the delivery-date question is the bank's own
  // recurring form for this page, answered from the written quote.
  const R45_STATS = { cellsAttempted: 0, cellsLanded: 0, variantsAttempted: 0, variantsLanded: 0, byFamily: {}, byPage: {}, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0 };
  const R45_SOURCE_ROWS = [];
  {
    const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-area.geojson'), 'utf8'));
    const featById = {};
    for (const f of geo.features || []) if (f.properties && f.properties.id) featById[f.properties.id] = f;
    const pagesDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages.json'), 'utf8'));
    const pageSlugs = new Set((pagesDb.pages || []).map((p) => p.slug));
    const havMi = (lat1, lon1, lat2, lon2) => {
      const R = 3958.8, t = Math.PI / 180;
      const dLat = (lat2 - lat1) * t, dLon = (lon2 - lon1) * t;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    const bucket = (mi) => (mi <= 10 ? 10 : mi <= 20 ? 20 : mi <= 35 ? 35 : mi <= 50 ? 50 : 75);
    const seatCoords = (fid) => {
      const f = featById[fid];
      return (f && f.geometry && f.geometry.coordinates) ? f.geometry.coordinates : null;
    };
    const winSeat = seatCoords('place-winchester-va');
    const marSeat = seatCoords('place-martinsburg-wv');
    const R45_STATE_NAME = { VA: 'Virginia', WV: 'West Virginia', MD: 'Maryland', DC: 'Washington DC', PA: 'Pennsylvania' };
    const R45_REFUSE_EXTRA = [
      { re: /\b(?:usdot|dot|mc)\s*(?:#|number|no\.?)\b/i, why: 'authority-number-claim' },
    ];
    const r45Refuse = (q) => R35_TRUTH_REFUSE.find((t) => t.re.test(q)) || R45_REFUSE_EXTRA.find((t) => t.re.test(q)) || null;
    const r45Land = (svcId, intentClass, q, area, target, pattern) => {
      const bad = r45Refuse(q);
      if (bad) {
        R45_STATS.truthRefused++;
        excluded.push({ reason: 'r45-truth-' + bad.why, serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const nk = svcId + '|' + r30Norm(q);
      if (r30NormSeen.has(nk)) {
        const first = r30NormSeen.get(nk);
        if (first === q) R45_STATS.collisionExact++; else R45_STATS.collisionNormalized++;
        excluded.push({ reason: 'r45-collision-bank-kept', serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const ok = emit(svcId, intentClass, q, area, target, pattern, { source: 'money-next3-formula' });
      if (ok) {
        r30NormSeen.set(nk, q);
        R45_STATS.byPage[target] = (R45_STATS.byPage[target] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R45_SOURCE_ROWS.push({ q, intent: intentClass, service_id: svcId, area, target_url: landedRow.target_url, pattern });
        return true;
      }
      R45_STATS.gateExcluded++;
      excluded.push({ reason: 'r45-gate-excluded', serviceId: svcId, queryText: q, pattern });
      return false;
    };
    const landV = (svcId, cls, q, area, target, family) => {
      R45_STATS.variantsAttempted++;
      if (r45Land(svcId, cls, q, area, target, 'R45-variant-' + family)) {
        R45_STATS.variantsLanded++;
        R45_STATS.byFamily[family] = (R45_STATS.byFamily[family] || 0) + 1;
      }
    };
    const R45_ASPECTS = {
      'service-residential': [
        (pq) => 'do residential movers offer packing in ' + pq + '?',
        (pq) => 'can residential movers move heavy items in ' + pq + '?',
        (pq) => 'who provides residential moving services in ' + pq + '?',
      ],
      'service-long-distance': [
        (pq) => 'can i get a guaranteed delivery date for a move out of ' + pq + '?',
        (pq) => 'do long distance movers quote one flat rate in ' + pq + '?',
        (pq) => 'who provides long distance moving services in ' + pq + '?',
      ],
      'service-local-regional': [
        (pq) => 'do local movers charge a flat rate in ' + pq + '?',
        (pq) => 'who are the local movers in ' + pq + '?',
        (pq) => 'can local movers in ' + pq + ' move just a few heavy items?',
      ],
    };
    const R45_TARGETS = [
      { svc: 'service-residential', token: 'residential-moving', slug: 'residential-moving', phrase: 'residential movers', base: 'residential moving', rule: 'all' },
      { svc: 'service-long-distance', token: 'long-distance', slug: 'long-distance-movers-winchester-va', phrase: 'long distance movers', base: 'long distance moving', rule: 'winchester' },
      { svc: 'service-local-regional', token: 'local-regional', slug: 'local-regional-movers-martinsburg-wv', phrase: 'local movers', base: 'local moving', rule: 'martinsburg' },
    ];
    for (const T of R45_TARGETS) {
      const cells = [];
      for (const f of geo.features || []) {
        const p = f.properties || {};
        if (!p.id || !p.id.startsWith('place-')) continue;
        if (!(p.services || []).includes(T.token)) continue;
        if (T.rule === 'all') {
          if (pageSlugs.has(T.slug + '-' + p.id.replace('place-', ''))) continue;
        } else if (p.branch !== T.rule) continue;
        cells.push(f);
      }
      let cellIdx = 0;
      for (const f of cells) {
        cellIdx++;
        const p = f.properties;
        const pl = String(p.name || '').replace(/,/g, '');
        const pq = String(p.name || '');
        const stateName = R45_STATE_NAME[p.state] || null;
        const countyTail = String(p.county || '').split('/').pop().trim();
        const county = /County$/.test(countyTail) ? countyTail : null;
        const zip = geoZipPrimary(p.id);
        let radius = 25;
        if (f.geometry && f.geometry.coordinates) {
          const [lo, la] = f.geometry.coordinates;
          const seats = T.rule === 'all' ? [winSeat, marSeat].filter(Boolean) : T.rule === 'martinsburg' ? [marSeat].filter(Boolean) : [winSeat].filter(Boolean);
          let best = null;
          for (const s of seats) { const d = havMi(la, lo, s[1], s[0]); if (best === null || d < best) best = d; }
          if (best !== null) radius = bucket(best);
        }
        const ph = T.phrase, base = T.base, area = p.id, target = T.slug;
        // cell question forms
        const cellForms = [
          ['ai-question', 'who provides ' + ph + ' in ' + pq + '?'],
          ['ai-question', R45_ASPECTS[T.svc][cellIdx % R45_ASPECTS[T.svc].length](pq)],
        ];
        for (const [cls, q] of cellForms) {
          R45_STATS.cellsAttempted++;
          if (r45Land(T.svc, cls, q, area, target, 'R45-cell')) R45_STATS.cellsLanded++;
        }
        // PROXIMITY
        landV(T.svc, 'navigational-local', ph + ' near me', area, target, 'proximity');
        landV(T.svc, 'best-choice', 'best ' + ph + ' near me', area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' nearby', area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' near ' + pl, area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' close to ' + pl, area, target, 'proximity');
        // LOCALITY SCALE
        if (!ph.startsWith('local ')) landV(T.svc, 'navigational-local', 'local ' + ph + ' ' + pl, area, target, 'locality');
        landV(T.svc, 'navigational-local', ph + ' in ' + pl, area, target, 'locality');
        if (county) landV(T.svc, 'navigational-local', ph + ' in ' + county + ' ' + p.state, area, target, 'locality');
        if (stateName) landV(T.svc, 'navigational-local', ph + ' in ' + stateName, area, target, 'locality');
        landV(T.svc, 'navigational-local', ph + ' around ' + pl, area, target, 'locality');
        landV(T.svc, 'navigational-local', 'regional ' + ph + ' ' + pl, area, target, 'locality');
        // RADIUS
        landV(T.svc, 'navigational-local', ph + ' within ' + radius + ' miles of ' + pl, area, target, 'radius');
        landV(T.svc, 'navigational-local', ph + ' serving the ' + pl + ' area', area, target, 'radius');
        // ZIP FORMS — the place's geo record postal code
        if (zip) {
          landV(T.svc, 'navigational-local', ph + ' ' + zip, area, target, 'zip');
          landV(T.svc, 'navigational-local', ph + ' near ' + zip, area, target, 'zip');
        }
        // RELATION WORDS
        landV(T.svc, 'navigational-local', ph + ' serving ' + pq, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' covering ' + pq, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' available in ' + pl, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' based in ' + pl, area, target, 'relation');
        // AI-QUESTION FORMS
        landV(T.svc, 'ai-question', 'how do i arrange ' + base + ' in ' + pl + '?', area, target, 'ai-question');
        landV(T.svc, 'ai-question', 'what does ' + base + ' include in ' + pl + '?', area, target, 'ai-question');
      }
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r45-accounting.json'),
        JSON.stringify({ r45: R45_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r45-source-rows.jsonl'),
        R45_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }

  // R46 (Money Trio-3 Full-Formula, 2026-11-16): pages 7-9 of the
  // Tier-1 money-page sweep get the same section-6 variant coverage
  // as R44/R45 — /local-regional-moving/ (the local/regional hub),
  // /commercial-moving/ (the commercial hub) and
  // /gun-safe-movers-winchester-va/ (the Winchester branch head for
  // gun safe). The pre-build family census on the sealed 91edfd3d
  // bank (rubric.db, 2026-11-16) read the identical signature:
  // radius 0 and ZIP 0 on all three pages, relation 10 / 1 / 0,
  // proximity 92 / 5 / 8. CELLS are derived from machine data only
  // (determinism law: data/service-area.geojson + data/pages.json,
  // never rubric.db): the local/regional hub takes the shared
  // ('both') branch towns (11 cells — both branch heads already own
  // their branch towns, R44/R45; the same hub rule as R44's gun-safe
  // hub), the commercial hub takes its complement — the
  // Martinsburg-branch places plus the shared towns (33 cells;
  // Winchester-branch places are owned by
  // /commercial-movers-winchester-va/, R44) — and the Winchester
  // gun-safe head takes the Winchester-branch places minus the two
  // towns carrying dedicated gun-safe pages in the registry
  // (Washington DC and McLean, the Spot-2 pages), for 33 cells.
  // Radius buckets read the binding branch seat's coordinates (the
  // hubs' shared towns read the nearer seat), the Territory Matrix
  // centroid method, as in R44/R45. TRUTH SCREEN: the R35 base set
  // plus gun-safe extras — no query may imply a locksmith or
  // safe-opening service (never offered) — plus the authority-number
  // screen (no USDOT / DOT / MC number is published; interstate
  // authority sits with the carriers the company engages). Aspects
  // stay inside the published fact set: flat rate in writing,
  // stairs up/down, re-anchoring on request, the 1,500-3,500 lb SIR
  // band (over-1,500-lb form), after-hours and phased commercial
  // work, a few heavy items on a local booking.
  const R46_STATS = { cellsAttempted: 0, cellsLanded: 0, variantsAttempted: 0, variantsLanded: 0, byFamily: {}, byPage: {}, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0 };
  const R46_SOURCE_ROWS = [];
  {
    const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-area.geojson'), 'utf8'));
    const featById = {};
    for (const f of geo.features || []) if (f.properties && f.properties.id) featById[f.properties.id] = f;
    const pagesDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages.json'), 'utf8'));
    const pageSlugs = new Set((pagesDb.pages || []).map((p) => p.slug));
    const havMi = (lat1, lon1, lat2, lon2) => {
      const R = 3958.8, t = Math.PI / 180;
      const dLat = (lat2 - lat1) * t, dLon = (lon2 - lon1) * t;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    const bucket = (mi) => (mi <= 10 ? 10 : mi <= 20 ? 20 : mi <= 35 ? 35 : mi <= 50 ? 50 : 75);
    const seatCoords = (fid) => {
      const f = featById[fid];
      return (f && f.geometry && f.geometry.coordinates) ? f.geometry.coordinates : null;
    };
    const winSeat = seatCoords('place-winchester-va');
    const marSeat = seatCoords('place-martinsburg-wv');
    const R46_STATE_NAME = { VA: 'Virginia', WV: 'West Virginia', MD: 'Maryland', DC: 'Washington DC', PA: 'Pennsylvania' };
    const R46_REFUSE_EXTRA = [
      { re: /\blocksmith\b/i, why: 'locksmith-claim' },
      { re: /\bsafe cracking\b/i, why: 'safe-cracking-claim' },
      { re: /\bopen(?:s|ing)? (?:a |the |my )?locked safe\b/i, why: 'safe-opening-claim' },
      { re: /\b(?:usdot|dot|mc)\s*(?:#|number|no\.?)\b/i, why: 'authority-number-claim' },
    ];
    const r46Refuse = (q) => R35_TRUTH_REFUSE.find((t) => t.re.test(q)) || R46_REFUSE_EXTRA.find((t) => t.re.test(q)) || null;
    const r46Land = (svcId, intentClass, q, area, target, pattern) => {
      const bad = r46Refuse(q);
      if (bad) {
        R46_STATS.truthRefused++;
        excluded.push({ reason: 'r46-truth-' + bad.why, serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const nk = svcId + '|' + r30Norm(q);
      if (r30NormSeen.has(nk)) {
        const first = r30NormSeen.get(nk);
        if (first === q) R46_STATS.collisionExact++; else R46_STATS.collisionNormalized++;
        excluded.push({ reason: 'r46-collision-bank-kept', serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const ok = emit(svcId, intentClass, q, area, target, pattern, { source: 'money-trio3-formula' });
      if (ok) {
        r30NormSeen.set(nk, q);
        R46_STATS.byPage[target] = (R46_STATS.byPage[target] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R46_SOURCE_ROWS.push({ q, intent: intentClass, service_id: svcId, area, target_url: landedRow.target_url, pattern });
        return true;
      }
      R46_STATS.gateExcluded++;
      excluded.push({ reason: 'r46-gate-excluded', serviceId: svcId, queryText: q, pattern });
      return false;
    };
    const landV = (svcId, cls, q, area, target, family) => {
      R46_STATS.variantsAttempted++;
      if (r46Land(svcId, cls, q, area, target, 'R46-variant-' + family)) {
        R46_STATS.variantsLanded++;
        R46_STATS.byFamily[family] = (R46_STATS.byFamily[family] || 0) + 1;
      }
    };
    const R46_ASPECTS = {
      'service-local-regional': [
        (pq) => 'do local movers charge a flat rate in ' + pq + '?',
        (pq) => 'who are the local movers in ' + pq + '?',
        (pq) => 'can local movers in ' + pq + ' move just a few heavy items?',
      ],
      'service-commercial': [
        (pq) => 'can commercial movers work after hours in ' + pq + '?',
        (pq) => 'who provides commercial moving services in ' + pq + '?',
        (pq) => 'can commercial movers move an office in phases in ' + pq + '?',
      ],
      'service-gun-safe': [
        (pq) => 'can gun safe movers take a safe up or down stairs in ' + pq + '?',
        (pq) => 'do gun safe movers re-anchor the safe after placing it in ' + pq + '?',
        (pq) => 'who can move a gun safe over 1,500 pounds in ' + pq + '?',
      ],
    };
    const R46_TARGETS = [
      { svc: 'service-local-regional', token: 'local-regional', slug: 'local-regional-moving', phrase: 'local movers', base: 'local moving', rule: 'both' },
      { svc: 'service-commercial', token: 'commercial-moving', slug: 'commercial-moving', phrase: 'commercial movers', base: 'commercial moving', rule: 'hub-complement' },
      { svc: 'service-gun-safe', token: 'gun-safe', slug: 'gun-safe-movers-winchester-va', phrase: 'gun safe movers', base: 'gun safe moving', rule: 'winchester-own' },
    ];
    for (const T of R46_TARGETS) {
      const cells = [];
      for (const f of geo.features || []) {
        const p = f.properties || {};
        if (!p.id || !p.id.startsWith('place-')) continue;
        if (!(p.services || []).includes(T.token)) continue;
        if (T.rule === 'both') {
          if (p.branch !== 'both') continue;
        } else if (T.rule === 'hub-complement') {
          if (p.branch === 'winchester') continue;
        } else if (T.rule === 'winchester-own') {
          if (p.branch !== 'winchester') continue;
          const stemPage = 'gun-safe-movers-' + p.id.replace('place-', '');
          if (pageSlugs.has(stemPage) && stemPage !== T.slug) continue;
        }
        cells.push(f);
      }
      let cellIdx = 0;
      for (const f of cells) {
        cellIdx++;
        const p = f.properties;
        const pl = String(p.name || '').replace(/,/g, '');
        const pq = String(p.name || '');
        const stateName = R46_STATE_NAME[p.state] || null;
        const countyTail = String(p.county || '').split('/').pop().trim();
        const county = /County$/.test(countyTail) ? countyTail : null;
        const zip = geoZipPrimary(p.id);
        let radius = 25;
        if (f.geometry && f.geometry.coordinates) {
          const [lo, la] = f.geometry.coordinates;
          let seats;
          if (T.rule === 'winchester-own') seats = [winSeat].filter(Boolean);
          else if (T.rule === 'hub-complement' && p.branch === 'martinsburg') seats = [marSeat].filter(Boolean);
          else seats = [winSeat, marSeat].filter(Boolean);
          let best = null;
          for (const s of seats) { const d = havMi(la, lo, s[1], s[0]); if (best === null || d < best) best = d; }
          if (best !== null) radius = bucket(best);
        }
        const ph = T.phrase, base = T.base, area = p.id, target = T.slug;
        // cell question forms
        const cellForms = [
          ['ai-question', 'who provides ' + ph + ' in ' + pq + '?'],
          ['ai-question', R46_ASPECTS[T.svc][cellIdx % R46_ASPECTS[T.svc].length](pq)],
        ];
        for (const [cls, q] of cellForms) {
          R46_STATS.cellsAttempted++;
          if (r46Land(T.svc, cls, q, area, target, 'R46-cell')) R46_STATS.cellsLanded++;
        }
        // PROXIMITY
        landV(T.svc, 'navigational-local', ph + ' near me', area, target, 'proximity');
        landV(T.svc, 'best-choice', 'best ' + ph + ' near me', area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' nearby', area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' near ' + pl, area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' close to ' + pl, area, target, 'proximity');
        // LOCALITY SCALE
        if (!ph.startsWith('local ')) landV(T.svc, 'navigational-local', 'local ' + ph + ' ' + pl, area, target, 'locality');
        landV(T.svc, 'navigational-local', ph + ' in ' + pl, area, target, 'locality');
        if (county) landV(T.svc, 'navigational-local', ph + ' in ' + county + ' ' + p.state, area, target, 'locality');
        if (stateName) landV(T.svc, 'navigational-local', ph + ' in ' + stateName, area, target, 'locality');
        landV(T.svc, 'navigational-local', ph + ' around ' + pl, area, target, 'locality');
        landV(T.svc, 'navigational-local', 'regional ' + ph + ' ' + pl, area, target, 'locality');
        // RADIUS
        landV(T.svc, 'navigational-local', ph + ' within ' + radius + ' miles of ' + pl, area, target, 'radius');
        landV(T.svc, 'navigational-local', ph + ' serving the ' + pl + ' area', area, target, 'radius');
        // ZIP FORMS — the place's geo record postal code
        if (zip) {
          landV(T.svc, 'navigational-local', ph + ' ' + zip, area, target, 'zip');
          landV(T.svc, 'navigational-local', ph + ' near ' + zip, area, target, 'zip');
        }
        // RELATION WORDS
        landV(T.svc, 'navigational-local', ph + ' serving ' + pq, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' covering ' + pq, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' available in ' + pl, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' based in ' + pl, area, target, 'relation');
        // AI-QUESTION FORMS
        landV(T.svc, 'ai-question', 'how do i arrange ' + base + ' in ' + pl + '?', area, target, 'ai-question');
        landV(T.svc, 'ai-question', 'what does ' + base + ' include in ' + pl + '?', area, target, 'ai-question');
      }
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r46-accounting.json'),
        JSON.stringify({ r46: R46_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r46-source-rows.jsonl'),
        R46_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }

  // R47 (Money Trio-4 Full-Formula, 2026-11-16): pages 10-12 of
  // the Tier-1 money-page sweep get the same section-6 variant
  // coverage as R44/R45/R46 — /long-distance-moving/ (the
  // long-distance hub), /data-center-relocation/ (the data-center
  // hub) and /senior-moving/ (the senior hub). The pre-build family
  // census on the sealed 04e866d6 bank (rubric.db, 2026-11-16) read
  // the identical signature: radius 0, ZIP 0 and relation 0 on all
  // three pages, proximity 4 / 11 / 14. CELLS are derived from
  // machine data only (determinism law: data/service-area.geojson +
  // data/pages.json, never rubric.db): the long-distance hub takes
  // its complement — the places carrying the long-distance token
  // whose branch is not winchester (the Winchester head owns its
  // branch towns, R45; the same hub rule as R46's commercial hub) —
  // minus the Martinsburg home cell, which carries a dedicated head
  // page in the registry (/long-distance-movers-martinsburg-wv/;
  // the R44 hub dedicated-page protection), for 40 cells; the
  // data-center hub takes every place carrying the
  // data-center-relocation token minus the four towns with
  // dedicated data-center pages in the registry (Leesburg, the
  // Spot-1 page, Winchester, Martinsburg and Ashburn), for 64
  // cells; the senior hub takes every place carrying the
  // senior-moving token (the R45 residential flagship rule; no
  // dedicated senior place pages exist), for 80 cells. Radius
  // buckets read the nearer branch seat's coordinates (a
  // Martinsburg-branch cell on the long-distance hub reads the
  // Martinsburg seat), the Territory Matrix centroid method, as in
  // R44/R45/R46. TRUTH SCREEN: the R35 base set plus the
  // authority-number screen (no USDOT / DOT / MC number is
  // published; interstate authority sits with the carriers the
  // company engages), a discount screen (no senior discount or any
  // discount is published — the senior page states it plainly) and
  // the ITAD screens (data destruction and certificates of
  // destruction belong to the engaged certified ITAD partner, never
  // to this company). Aspects stay inside the published fact set:
  // flat rate in writing, safes and pianos long-distance under SIR,
  // site screening and escort rules, de-rack / re-rack / power-up,
  // 24/7 emergency availability, packing for fragile items and
  // keepsakes, the video-walkthrough survey.
  const R47_STATS = { cellsAttempted: 0, cellsLanded: 0, variantsAttempted: 0, variantsLanded: 0, byFamily: {}, byPage: {}, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0 };
  const R47_SOURCE_ROWS = [];
  {
    const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-area.geojson'), 'utf8'));
    const featById = {};
    for (const f of geo.features || []) if (f.properties && f.properties.id) featById[f.properties.id] = f;
    const pagesDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages.json'), 'utf8'));
    const pageSlugs = new Set((pagesDb.pages || []).map((p) => p.slug));
    const havMi = (lat1, lon1, lat2, lon2) => {
      const R = 3958.8, t = Math.PI / 180;
      const dLat = (lat2 - lat1) * t, dLon = (lon2 - lon1) * t;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    const bucket = (mi) => (mi <= 10 ? 10 : mi <= 20 ? 20 : mi <= 35 ? 35 : mi <= 50 ? 50 : 75);
    const seatCoords = (fid) => {
      const f = featById[fid];
      return (f && f.geometry && f.geometry.coordinates) ? f.geometry.coordinates : null;
    };
    const winSeat = seatCoords('place-winchester-va');
    const marSeat = seatCoords('place-martinsburg-wv');
    const R47_STATE_NAME = { VA: 'Virginia', WV: 'West Virginia', MD: 'Maryland', DC: 'Washington DC', PA: 'Pennsylvania' };
    const R47_REFUSE_EXTRA = [
      { re: /\b(?:usdot|dot|mc)\s*(?:#|number|no\.?)\b/i, why: 'authority-number-claim' },
      { re: /\bdiscount\b/i, why: 'discount-claim' },
      { re: /\bdata destruction\b/i, why: 'itad-destruction-claim' },
      { re: /\bcertificates? of destruction\b/i, why: 'itad-certificate-claim' },
    ];
    const r47Refuse = (q) => R35_TRUTH_REFUSE.find((t) => t.re.test(q)) || R47_REFUSE_EXTRA.find((t) => t.re.test(q)) || null;
    const r47Land = (svcId, intentClass, q, area, target, pattern) => {
      const bad = r47Refuse(q);
      if (bad) {
        R47_STATS.truthRefused++;
        excluded.push({ reason: 'r47-truth-' + bad.why, serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const nk = svcId + '|' + r30Norm(q);
      if (r30NormSeen.has(nk)) {
        const first = r30NormSeen.get(nk);
        if (first === q) R47_STATS.collisionExact++; else R47_STATS.collisionNormalized++;
        excluded.push({ reason: 'r47-collision-bank-kept', serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const ok = emit(svcId, intentClass, q, area, target, pattern, { source: 'money-trio4-formula' });
      if (ok) {
        r30NormSeen.set(nk, q);
        R47_STATS.byPage[target] = (R47_STATS.byPage[target] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R47_SOURCE_ROWS.push({ q, intent: intentClass, service_id: svcId, area, target_url: landedRow.target_url, pattern });
        return true;
      }
      R47_STATS.gateExcluded++;
      excluded.push({ reason: 'r47-gate-excluded', serviceId: svcId, queryText: q, pattern });
      return false;
    };
    const landV = (svcId, cls, q, area, target, family) => {
      R47_STATS.variantsAttempted++;
      if (r47Land(svcId, cls, q, area, target, 'R47-variant-' + family)) {
        R47_STATS.variantsLanded++;
        R47_STATS.byFamily[family] = (R47_STATS.byFamily[family] || 0) + 1;
      }
    };
    const R47_ASPECTS = {
      'service-long-distance': [
        (pq) => 'do long distance movers charge a flat rate in ' + pq + '?',
        (pq) => 'can long distance movers move a safe or piano from ' + pq + '?',
        (pq) => 'how far in advance should i book a long distance move from ' + pq + '?',
      ],
      'service-data-center-relocation': [
        (pq) => 'can data center movers pass site screening and escort rules in ' + pq + '?',
        (pq) => 'can data center movers de-rack, re-rack and power up servers in ' + pq + '?',
        (pq) => 'are data center movers available 24/7 for an emergency relocation in ' + pq + '?',
      ],
      'service-senior-moving': [
        (pq) => 'do senior movers charge a flat rate in ' + pq + '?',
        (pq) => 'can senior movers pack fragile items and keepsakes in ' + pq + '?',
        (pq) => 'can a senior move be surveyed by video walkthrough in ' + pq + '?',
      ],
    };
    const R47_TARGETS = [
      { svc: 'service-long-distance', token: 'long-distance', slug: 'long-distance-moving', phrase: 'long distance movers', base: 'long distance moving', rule: 'hub-complement-dedicated', headStem: 'long-distance-movers-' },
      { svc: 'service-data-center-relocation', token: 'data-center-relocation', slug: 'data-center-relocation', phrase: 'data center movers', base: 'data center moving', rule: 'all-dedicated', headStem: 'data-center-movers-' },
      { svc: 'service-senior-moving', token: 'senior-moving', slug: 'senior-moving', phrase: 'senior movers', base: 'senior moving', rule: 'all' },
    ];
    for (const T of R47_TARGETS) {
      const cells = [];
      for (const f of geo.features || []) {
        const p = f.properties || {};
        if (!p.id || !p.id.startsWith('place-')) continue;
        if (!(p.services || []).includes(T.token)) continue;
        if (T.rule === 'hub-complement-dedicated') {
          if (p.branch === 'winchester') continue;
          const stemPage = T.headStem + p.id.replace('place-', '');
          if (pageSlugs.has(stemPage) && stemPage !== T.slug) continue;
        } else if (T.rule === 'all-dedicated') {
          const stemPage = T.headStem + p.id.replace('place-', '');
          if (pageSlugs.has(stemPage) && stemPage !== T.slug) continue;
        }
        cells.push(f);
      }
      let cellIdx = 0;
      for (const f of cells) {
        cellIdx++;
        const p = f.properties;
        const pl = String(p.name || '').replace(/,/g, '');
        const pq = String(p.name || '');
        const stateName = R47_STATE_NAME[p.state] || null;
        const countyTail = String(p.county || '').split('/').pop().trim();
        const county = /County$/.test(countyTail) ? countyTail : null;
        const zip = geoZipPrimary(p.id);
        let radius = 25;
        if (f.geometry && f.geometry.coordinates) {
          const [lo, la] = f.geometry.coordinates;
          let seats;
          if (T.rule === 'hub-complement-dedicated' && p.branch === 'martinsburg') seats = [marSeat].filter(Boolean);
          else seats = [winSeat, marSeat].filter(Boolean);
          let best = null;
          for (const s of seats) { const d = havMi(la, lo, s[1], s[0]); if (best === null || d < best) best = d; }
          if (best !== null) radius = bucket(best);
        }
        const ph = T.phrase, base = T.base, area = p.id, target = T.slug;
        // cell question forms
        const cellForms = [
          ['ai-question', 'who provides ' + ph + ' in ' + pq + '?'],
          ['ai-question', R47_ASPECTS[T.svc][cellIdx % R47_ASPECTS[T.svc].length](pq)],
        ];
        for (const [cls, q] of cellForms) {
          R47_STATS.cellsAttempted++;
          if (r47Land(T.svc, cls, q, area, target, 'R47-cell')) R47_STATS.cellsLanded++;
        }
        // PROXIMITY
        landV(T.svc, 'navigational-local', ph + ' near me', area, target, 'proximity');
        landV(T.svc, 'best-choice', 'best ' + ph + ' near me', area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' nearby', area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' near ' + pl, area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' close to ' + pl, area, target, 'proximity');
        // LOCALITY SCALE
        if (!ph.startsWith('local ')) landV(T.svc, 'navigational-local', 'local ' + ph + ' ' + pl, area, target, 'locality');
        landV(T.svc, 'navigational-local', ph + ' in ' + pl, area, target, 'locality');
        if (county) landV(T.svc, 'navigational-local', ph + ' in ' + county + ' ' + p.state, area, target, 'locality');
        if (stateName) landV(T.svc, 'navigational-local', ph + ' in ' + stateName, area, target, 'locality');
        landV(T.svc, 'navigational-local', ph + ' around ' + pl, area, target, 'locality');
        landV(T.svc, 'navigational-local', 'regional ' + ph + ' ' + pl, area, target, 'locality');
        // RADIUS
        landV(T.svc, 'navigational-local', ph + ' within ' + radius + ' miles of ' + pl, area, target, 'radius');
        landV(T.svc, 'navigational-local', ph + ' serving the ' + pl + ' area', area, target, 'radius');
        // ZIP FORMS — the place's geo record postal code
        if (zip) {
          landV(T.svc, 'navigational-local', ph + ' ' + zip, area, target, 'zip');
          landV(T.svc, 'navigational-local', ph + ' near ' + zip, area, target, 'zip');
        }
        // RELATION WORDS
        landV(T.svc, 'navigational-local', ph + ' serving ' + pq, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' covering ' + pq, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' available in ' + pl, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' based in ' + pl, area, target, 'relation');
        // AI-QUESTION FORMS
        landV(T.svc, 'ai-question', 'how do i arrange ' + base + ' in ' + pl + '?', area, target, 'ai-question');
        landV(T.svc, 'ai-question', 'what does ' + base + ' include in ' + pl + '?', area, target, 'ai-question');
      }
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r47-accounting.json'),
        JSON.stringify({ r47: R47_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r47-source-rows.jsonl'),
        R47_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }

  // R48 (Money Trio-5 Full-Formula, 2026-11-16): pages 13-15 of
  // the Tier-1 money-page sweep get the same section-6 variant
  // coverage as R44/R45/R46/R47 — /freight-rework-transloading/
  // (W29), /warehouse-relocation/ (W26) and
  // /logistics-project-management/ (W28), picked by fresh measure
  // on the sealed a30e1f51 bank (70,516 rows): 1,461 / 1,459 /
  // 1,443 rows bound — the three largest remaining Tier-1 banks,
  // all hubs (no branch-head or town pages in these families). The
  // pre-build family census read the identical signature: radius 0
  // and ZIP 0 on all three pages, relation 7 / 13 / 6, proximity
  // thin on logistics (13). CELLS are derived from machine data
  // only (determinism law: data/service-area.geojson +
  // data/pages.json, never rubric.db): each hub takes every place
  // carrying its token (the R45 residential flagship / R47 senior
  // rule — no dedicated place pages exist in the registry for any
  // of the three families), 68 place cells per target, every cell
  // carrying a postal code. Radius buckets read the nearer branch
  // seat's coordinates, the Territory Matrix centroid method, as in
  // R44-R47. TRUTH SCREEN: the R35 base set plus the R47 extras
  // (authority-number, discount, ITAD destruction / certificate
  // screens) plus a drayage screen (the company never offers
  // drayage) and a transportation-management screen (the logistics
  // service is scoped project execution only — not transportation
  // management, brokerage or drayage, as its registry description
  // states). Aspects stay inside the published fact set: loads
  // refused at a receiver dock, shifted / overweight loads rebuilt
  // and re-secured, emergency and after-hours rework, warehouse
  // moves phased to avoid a full shutdown, load-outs and inbound
  // unloads, one flat rate quoted in writing before work begins,
  // survey and scope planning, warehouse load-outs and resets run
  // as managed projects, supervised execution and closeout.
  const R48_STATS = { cellsAttempted: 0, cellsLanded: 0, variantsAttempted: 0, variantsLanded: 0, byFamily: {}, byPage: {}, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0 };
  const R48_SOURCE_ROWS = [];
  {
    const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-area.geojson'), 'utf8'));
    const featById = {};
    for (const f of geo.features || []) if (f.properties && f.properties.id) featById[f.properties.id] = f;
    const pagesDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages.json'), 'utf8'));
    const pageSlugs = new Set((pagesDb.pages || []).map((p) => p.slug));
    const havMi = (lat1, lon1, lat2, lon2) => {
      const R = 3958.8, t = Math.PI / 180;
      const dLat = (lat2 - lat1) * t, dLon = (lon2 - lon1) * t;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    const bucket = (mi) => (mi <= 10 ? 10 : mi <= 20 ? 20 : mi <= 35 ? 35 : mi <= 50 ? 50 : 75);
    const seatCoords = (fid) => {
      const f = featById[fid];
      return (f && f.geometry && f.geometry.coordinates) ? f.geometry.coordinates : null;
    };
    const winSeat = seatCoords('place-winchester-va');
    const marSeat = seatCoords('place-martinsburg-wv');
    const R48_STATE_NAME = { VA: 'Virginia', WV: 'West Virginia', MD: 'Maryland', DC: 'Washington DC', PA: 'Pennsylvania' };
    const R48_REFUSE_EXTRA = [
      { re: /\b(?:usdot|dot|mc)\s*(?:#|number|no\.?)\b/i, why: 'authority-number-claim' },
      { re: /\bdiscount\b/i, why: 'discount-claim' },
      { re: /\bdata destruction\b/i, why: 'itad-destruction-claim' },
      { re: /\bcertificates? of destruction\b/i, why: 'itad-certificate-claim' },
      { re: /\bdrayage\b/i, why: 'drayage-claim' },
      { re: /\btransportation management\b/i, why: 'transportation-management-claim' },
    ];
    const r48Refuse = (q) => R35_TRUTH_REFUSE.find((t) => t.re.test(q)) || R48_REFUSE_EXTRA.find((t) => t.re.test(q)) || null;
    const r48Land = (svcId, intentClass, q, area, target, pattern) => {
      const bad = r48Refuse(q);
      if (bad) {
        R48_STATS.truthRefused++;
        excluded.push({ reason: 'r48-truth-' + bad.why, serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const nk = svcId + '|' + r30Norm(q);
      if (r30NormSeen.has(nk)) {
        const first = r30NormSeen.get(nk);
        if (first === q) R48_STATS.collisionExact++; else R48_STATS.collisionNormalized++;
        excluded.push({ reason: 'r48-collision-bank-kept', serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const ok = emit(svcId, intentClass, q, area, target, pattern, { source: 'money-trio5-formula' });
      if (ok) {
        r30NormSeen.set(nk, q);
        R48_STATS.byPage[target] = (R48_STATS.byPage[target] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R48_SOURCE_ROWS.push({ q, intent: intentClass, service_id: svcId, area, target_url: landedRow.target_url, pattern });
        return true;
      }
      R48_STATS.gateExcluded++;
      excluded.push({ reason: 'r48-gate-excluded', serviceId: svcId, queryText: q, pattern });
      return false;
    };
    const landV = (svcId, cls, q, area, target, family) => {
      R48_STATS.variantsAttempted++;
      if (r48Land(svcId, cls, q, area, target, 'R48-variant-' + family)) {
        R48_STATS.variantsLanded++;
        R48_STATS.byFamily[family] = (R48_STATS.byFamily[family] || 0) + 1;
      }
    };
    const R48_ASPECTS = {
      'service-freight-rework-transloading': [
        (pq) => 'does freight rework cover loads refused at a receiver dock in ' + pq + '?',
        (pq) => 'can a shifted or overweight load be rebuilt and re-secured in ' + pq + '?',
        (pq) => 'is emergency freight rework available after hours in ' + pq + '?',
      ],
      'service-warehouse-relocation': [
        (pq) => 'can a warehouse move be phased to avoid a full shutdown in ' + pq + '?',
        (pq) => 'do warehouse relocation services include load-outs and inbound unloads in ' + pq + '?',
        (pq) => 'is a warehouse relocation quoted at one flat rate in ' + pq + '?',
      ],
      'service-logistics-project-management': [
        (pq) => 'does logistics project management include survey and scope planning in ' + pq + '?',
        (pq) => 'can a warehouse load-out or reset be run as a managed project in ' + pq + '?',
        (pq) => 'does logistics project management include supervised execution and closeout in ' + pq + '?',
      ],
    };
    const R48_TARGETS = [
      { svc: 'service-freight-rework-transloading', token: 'freight-rework', slug: 'freight-rework-transloading', phrase: 'freight rework', base: 'freight rework', rule: 'all' },
      { svc: 'service-warehouse-relocation', token: 'warehouse-relocation', slug: 'warehouse-relocation', phrase: 'warehouse relocation services', base: 'warehouse relocation', rule: 'all' },
      { svc: 'service-logistics-project-management', token: 'logistics-project-management', slug: 'logistics-project-management', phrase: 'logistics project management', base: 'logistics project management', rule: 'all' },
    ];
    for (const T of R48_TARGETS) {
      const cells = [];
      for (const f of geo.features || []) {
        const p = f.properties || {};
        if (!p.id || !p.id.startsWith('place-')) continue;
        if (!(p.services || []).includes(T.token)) continue;
        cells.push(f);
      }
      let cellIdx = 0;
      for (const f of cells) {
        cellIdx++;
        const p = f.properties;
        const pl = String(p.name || '').replace(/,/g, '');
        const pq = String(p.name || '');
        const stateName = R48_STATE_NAME[p.state] || null;
        const countyTail = String(p.county || '').split('/').pop().trim();
        const county = /County$/.test(countyTail) ? countyTail : null;
        const zip = geoZipPrimary(p.id);
        let radius = 25;
        if (f.geometry && f.geometry.coordinates) {
          const [lo, la] = f.geometry.coordinates;
          const seats = [winSeat, marSeat].filter(Boolean);
          let best = null;
          for (const s of seats) { const d = havMi(la, lo, s[1], s[0]); if (best === null || d < best) best = d; }
          if (best !== null) radius = bucket(best);
        }
        const ph = T.phrase, base = T.base, area = p.id, target = T.slug;
        // cell question forms
        const cellForms = [
          ['ai-question', 'who provides ' + ph + ' in ' + pq + '?'],
          ['ai-question', R48_ASPECTS[T.svc][cellIdx % R48_ASPECTS[T.svc].length](pq)],
        ];
        for (const [cls, q] of cellForms) {
          R48_STATS.cellsAttempted++;
          if (r48Land(T.svc, cls, q, area, target, 'R48-cell')) R48_STATS.cellsLanded++;
        }
        // PROXIMITY
        landV(T.svc, 'navigational-local', ph + ' near me', area, target, 'proximity');
        landV(T.svc, 'best-choice', 'best ' + ph + ' near me', area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' nearby', area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' near ' + pl, area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' close to ' + pl, area, target, 'proximity');
        // LOCALITY SCALE
        if (!ph.startsWith('local ')) landV(T.svc, 'navigational-local', 'local ' + ph + ' ' + pl, area, target, 'locality');
        landV(T.svc, 'navigational-local', ph + ' in ' + pl, area, target, 'locality');
        if (county) landV(T.svc, 'navigational-local', ph + ' in ' + county + ' ' + p.state, area, target, 'locality');
        if (stateName) landV(T.svc, 'navigational-local', ph + ' in ' + stateName, area, target, 'locality');
        landV(T.svc, 'navigational-local', ph + ' around ' + pl, area, target, 'locality');
        landV(T.svc, 'navigational-local', 'regional ' + ph + ' ' + pl, area, target, 'locality');
        // RADIUS
        landV(T.svc, 'navigational-local', ph + ' within ' + radius + ' miles of ' + pl, area, target, 'radius');
        landV(T.svc, 'navigational-local', ph + ' serving the ' + pl + ' area', area, target, 'radius');
        // ZIP FORMS — the place's geo record postal code
        if (zip) {
          landV(T.svc, 'navigational-local', ph + ' ' + zip, area, target, 'zip');
          landV(T.svc, 'navigational-local', ph + ' near ' + zip, area, target, 'zip');
        }
        // RELATION WORDS
        landV(T.svc, 'navigational-local', ph + ' serving ' + pq, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' covering ' + pq, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' available in ' + pl, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' based in ' + pl, area, target, 'relation');
        // AI-QUESTION FORMS
        landV(T.svc, 'ai-question', 'how do i arrange ' + base + ' in ' + pl + '?', area, target, 'ai-question');
        landV(T.svc, 'ai-question', 'what does ' + base + ' include in ' + pl + '?', area, target, 'ai-question');
      }
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r48-accounting.json'),
        JSON.stringify({ r48: R48_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r48-source-rows.jsonl'),
        R48_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }

  // R49 (Money Trio-6 Full-Formula, 2026-11-16): pages 16-18 of
  // the Tier-1 money-page sweep get the same section-6 variant
  // coverage as R44/R45/R46/R47/R48 — /vault-doors/ (W14),
  // /moving-and-storage/ (W11) and /junk-removal/ (W17), picked by
  // fresh measure on the sealed 98a8649b bank (74,096 rows):
  // 1,417 / 1,360 / 1,359 rows bound — the three largest remaining
  // Tier-1 banks, all hubs (no branch-head or town pages in these
  // families). The pre-build family census read the identical
  // signature: radius 0 and ZIP 0 on all three pages, relation
  // 0 / 8 / 0, proximity thin (16 / 6 / 6). CELLS are derived from
  // machine data only (determinism law: data/service-area.geojson
  // + data/pages.json, never rubric.db): each hub takes every
  // place carrying its token (the R45 flagship rule — no dedicated
  // place pages exist in the registry for any of the three
  // families): vault-door 68 cells (every cell carrying a postal
  // code), moving-and-storage 80 cells and junk-removal 80 cells
  // (68 of each carrying a postal code; ZIP forms emit only where
  // the geo record carries one). Radius buckets read the nearer
  // branch seat's coordinates, the Territory Matrix centroid
  // method, as in R44-R48. TRUTH SCREEN: the R35 base set plus the
  // R47 extras (authority-number, discount, ITAD destruction /
  // certificate screens) plus the R48 drayage and
  // transportation-management screens, plus a locksmith screen
  // (no locksmith claim is ever published), a storage-in-transit
  // screen (SIT qualification is never claimed), a
  // climate-controlled-transit screen (climate-controlled SPACE
  // may be offered; climate-controlled transit never is) and a
  // hazardous-waste screen (hazardous and regulated waste is not
  // taken). Aspects stay inside the published fact set: vault
  // doors delivered, relocated and installed at any size,
  // specified from the door's own standards (UL 608, GSA Class 5
  // under AA-D-600D) and its verified weight, contents emptied
  // first; moves with a storage interval in leased storage for
  // any type of items, 30-day minimum stay, customer access while
  // stored, storage quoted per job, monthly, or by volume; junk
  // removal surveyed in advance and quoted at one flat rate in
  // writing, never by the hour, loads sorted after pickup toward
  // donation, recycling and lawful disposal.
  const R49_STATS = { cellsAttempted: 0, cellsLanded: 0, variantsAttempted: 0, variantsLanded: 0, byFamily: {}, byPage: {}, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0 };
  const R49_SOURCE_ROWS = [];
  {
    const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-area.geojson'), 'utf8'));
    const featById = {};
    for (const f of geo.features || []) if (f.properties && f.properties.id) featById[f.properties.id] = f;
    const pagesDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages.json'), 'utf8'));
    const pageSlugs = new Set((pagesDb.pages || []).map((p) => p.slug));
    const havMi = (lat1, lon1, lat2, lon2) => {
      const R = 3958.8, t = Math.PI / 180;
      const dLat = (lat2 - lat1) * t, dLon = (lon2 - lon1) * t;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    const bucket = (mi) => (mi <= 10 ? 10 : mi <= 20 ? 20 : mi <= 35 ? 35 : mi <= 50 ? 50 : 75);
    const seatCoords = (fid) => {
      const f = featById[fid];
      return (f && f.geometry && f.geometry.coordinates) ? f.geometry.coordinates : null;
    };
    const winSeat = seatCoords('place-winchester-va');
    const marSeat = seatCoords('place-martinsburg-wv');
    const R49_STATE_NAME = { VA: 'Virginia', WV: 'West Virginia', MD: 'Maryland', DC: 'Washington DC', PA: 'Pennsylvania' };
    const R49_REFUSE_EXTRA = [
      { re: /\b(?:usdot|dot|mc)\s*(?:#|number|no\.?)\b/i, why: 'authority-number-claim' },
      { re: /\bdiscount\b/i, why: 'discount-claim' },
      { re: /\bdata destruction\b/i, why: 'itad-destruction-claim' },
      { re: /\bcertificates? of destruction\b/i, why: 'itad-certificate-claim' },
      { re: /\bdrayage\b/i, why: 'drayage-claim' },
      { re: /\btransportation management\b/i, why: 'transportation-management-claim' },
      { re: /\blocksmith\b/i, why: 'locksmith-claim' },
      { re: /\bstorage in transit\b/i, why: 'sit-claim' },
      { re: /\bclimate[- ]controlled (?:truck|transport|transit|moving|van|trailer)\b/i, why: 'climate-transit-claim' },
      { re: /\bhazardous\b/i, why: 'hazardous-waste-claim' },
    ];
    const r49Refuse = (q) => R35_TRUTH_REFUSE.find((t) => t.re.test(q)) || R49_REFUSE_EXTRA.find((t) => t.re.test(q)) || null;
    const r49Land = (svcId, intentClass, q, area, target, pattern) => {
      const bad = r49Refuse(q);
      if (bad) {
        R49_STATS.truthRefused++;
        excluded.push({ reason: 'r49-truth-' + bad.why, serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const nk = svcId + '|' + r30Norm(q);
      if (r30NormSeen.has(nk)) {
        const first = r30NormSeen.get(nk);
        if (first === q) R49_STATS.collisionExact++; else R49_STATS.collisionNormalized++;
        excluded.push({ reason: 'r49-collision-bank-kept', serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const ok = emit(svcId, intentClass, q, area, target, pattern, { source: 'money-trio6-formula' });
      if (ok) {
        r30NormSeen.set(nk, q);
        R49_STATS.byPage[target] = (R49_STATS.byPage[target] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R49_SOURCE_ROWS.push({ q, intent: intentClass, service_id: svcId, area, target_url: landedRow.target_url, pattern });
        return true;
      }
      R49_STATS.gateExcluded++;
      excluded.push({ reason: 'r49-gate-excluded', serviceId: svcId, queryText: q, pattern });
      return false;
    };
    const landV = (svcId, cls, q, area, target, family) => {
      R49_STATS.variantsAttempted++;
      if (r49Land(svcId, cls, q, area, target, 'R49-variant-' + family)) {
        R49_STATS.variantsLanded++;
        R49_STATS.byFamily[family] = (R49_STATS.byFamily[family] || 0) + 1;
      }
    };
    const R49_ASPECTS = {
      'service-vault-door': [
        (pq) => 'does vault door installation cover doors of any size in ' + pq + '?',
        (pq) => 'are vault doors specified from their own standards, ul 608 and gsa class 5, in ' + pq + '?',
        (pq) => 'is a vault door move quoted at one flat rate in writing in ' + pq + '?',
      ],
      'service-moving-and-storage': [
        (pq) => 'does moving and storage cover a storage interval between move-out and move-in in ' + pq + '?',
        (pq) => 'can customers access their stored items during a storage stay in ' + pq + '?',
        (pq) => 'is storage quoted per job, monthly, or by volume in ' + pq + '?',
      ],
      'service-junk-removal': [
        (pq) => 'does junk removal include whole-property cleanouts in ' + pq + '?',
        (pq) => 'is junk removal surveyed and quoted at one flat rate before work begins in ' + pq + '?',
        (pq) => 'are usable goods sorted for donation and recyclables for recycling after a junk removal pickup in ' + pq + '?',
      ],
    };
    const R49_TARGETS = [
      { svc: 'service-vault-door', token: 'vault-door', slug: 'vault-doors', phrase: 'vault door movers', base: 'vault door moving', rule: 'all' },
      { svc: 'service-moving-and-storage', token: 'moving-and-storage', slug: 'moving-and-storage', phrase: 'moving and storage', base: 'moving and storage', rule: 'all' },
      { svc: 'service-junk-removal', token: 'junk-removal', slug: 'junk-removal', phrase: 'junk removal services', base: 'junk removal', rule: 'all' },
    ];
    for (const T of R49_TARGETS) {
      const cells = [];
      for (const f of geo.features || []) {
        const p = f.properties || {};
        if (!p.id || !p.id.startsWith('place-')) continue;
        if (!(p.services || []).includes(T.token)) continue;
        cells.push(f);
      }
      let cellIdx = 0;
      for (const f of cells) {
        cellIdx++;
        const p = f.properties;
        const pl = String(p.name || '').replace(/,/g, '');
        const pq = String(p.name || '');
        const stateName = R49_STATE_NAME[p.state] || null;
        const countyTail = String(p.county || '').split('/').pop().trim();
        const county = /County$/.test(countyTail) ? countyTail : null;
        const zip = geoZipPrimary(p.id);
        let radius = 25;
        if (f.geometry && f.geometry.coordinates) {
          const [lo, la] = f.geometry.coordinates;
          const seats = [winSeat, marSeat].filter(Boolean);
          let best = null;
          for (const s of seats) { const d = havMi(la, lo, s[1], s[0]); if (best === null || d < best) best = d; }
          if (best !== null) radius = bucket(best);
        }
        const ph = T.phrase, base = T.base, area = p.id, target = T.slug;
        // cell question forms
        const cellForms = [
          ['ai-question', 'who provides ' + ph + ' in ' + pq + '?'],
          ['ai-question', R49_ASPECTS[T.svc][cellIdx % R49_ASPECTS[T.svc].length](pq)],
        ];
        for (const [cls, q] of cellForms) {
          R49_STATS.cellsAttempted++;
          if (r49Land(T.svc, cls, q, area, target, 'R49-cell')) R49_STATS.cellsLanded++;
        }
        // PROXIMITY
        landV(T.svc, 'navigational-local', ph + ' near me', area, target, 'proximity');
        landV(T.svc, 'best-choice', 'best ' + ph + ' near me', area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' nearby', area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' near ' + pl, area, target, 'proximity');
        landV(T.svc, 'navigational-local', ph + ' close to ' + pl, area, target, 'proximity');
        // LOCALITY SCALE
        if (!ph.startsWith('local ')) landV(T.svc, 'navigational-local', 'local ' + ph + ' ' + pl, area, target, 'locality');
        landV(T.svc, 'navigational-local', ph + ' in ' + pl, area, target, 'locality');
        if (county) landV(T.svc, 'navigational-local', ph + ' in ' + county + ' ' + p.state, area, target, 'locality');
        if (stateName) landV(T.svc, 'navigational-local', ph + ' in ' + stateName, area, target, 'locality');
        landV(T.svc, 'navigational-local', ph + ' around ' + pl, area, target, 'locality');
        landV(T.svc, 'navigational-local', 'regional ' + ph + ' ' + pl, area, target, 'locality');
        // RADIUS
        landV(T.svc, 'navigational-local', ph + ' within ' + radius + ' miles of ' + pl, area, target, 'radius');
        landV(T.svc, 'navigational-local', ph + ' serving the ' + pl + ' area', area, target, 'radius');
        // ZIP FORMS — the place's geo record postal code
        if (zip) {
          landV(T.svc, 'navigational-local', ph + ' ' + zip, area, target, 'zip');
          landV(T.svc, 'navigational-local', ph + ' near ' + zip, area, target, 'zip');
        }
        // RELATION WORDS
        landV(T.svc, 'navigational-local', ph + ' serving ' + pq, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' covering ' + pq, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' available in ' + pl, area, target, 'relation');
        landV(T.svc, 'navigational-local', ph + ' based in ' + pl, area, target, 'relation');
        // AI-QUESTION FORMS
        landV(T.svc, 'ai-question', 'how do i arrange ' + base + ' in ' + pl + '?', area, target, 'ai-question');
        landV(T.svc, 'ai-question', 'what does ' + base + ' include in ' + pl + '?', area, target, 'ai-question');
      }
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r49-accounting.json'),
        JSON.stringify({ r49: R49_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r49-source-rows.jsonl'),
        R49_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }
  // R50 (Money Trio-6 Logistics Dataset addition, 2026-11-16):
  // the dedicated dataset for /logistics-project-management/
  // (datasets-logistics-project-management.json) lands in this
  // batch, and with it the buyer-term census the trio-5 record
  // deferred. Census (out/batch-money-trio6-2026-11-16/
  // logistics-dataset-research.md): the category's 2,951 base
  // rows saturate the service-name permutations ('logistics
  // project' 2,523 rows) but the vocabulary buyers and the
  // industry actually use is absent — 'project logistics' 0
  // (the industry's own category name), 'turnkey' 0, 'milestone'
  // 0, 'program management' 1, 'port logistics' 1, 'container
  // program' 1, 'surge' 1, 'staging' 1, 'single point of
  // contact' 2, 'end to end' 1. R50 closes those families
  // across the hub's cells, bound to the new dataset file (the
  // DATASETS map rebinds the whole service in this same batch).
  // CELLS are derived from machine data only (determinism law:
  // data/service-area.geojson + data/ports.json +
  // data/pages.json, never rubric.db): the 68 place features
  // carrying the logistics-project-management token, plus the
  // 8 registry ports as port cells (area = the ports.json port
  // id, the same area form the base rows carry). Radius buckets
  // read the nearer branch seat's coordinates, the Territory
  // Matrix centroid method, as in R44-R49. TRUTH SCREEN: the
  // R35 base set plus the R49 extras (authority-number,
  // discount, ITAD, drayage, transportation-management,
  // locksmith, SIT, climate-transit, hazardous screens) plus
  // the registry's own exclusion set — brokerage, customs
  // brokerage, freight forwarding and project-cargo transport
  // (scoped project execution only; the company does not sell
  // transportation management, brokerage or drayage). Aspects
  // stay inside the published fact set: survey, full scope,
  // crew and sequence planning, supervised execution and
  // closeout; one flat rate in writing; a single point of
  // contact at the bound branch; container programs, warehouse
  // load-outs and resets, surge programs, freight-rework
  // campaigns and port-adjacent staging; TWIC-carded crews at
  // the ports, dispatched 24/7.
  const R50_STATS = { cellsAttempted: 0, cellsLanded: 0, variantsAttempted: 0, variantsLanded: 0, byFamily: {}, byPage: {}, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0 };
  const R50_SOURCE_ROWS = [];
  {
    const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-area.geojson'), 'utf8'));
    const featById = {};
    for (const f of geo.features || []) if (f.properties && f.properties.id) featById[f.properties.id] = f;
    const portsDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ports.json'), 'utf8'));
    const havMi = (lat1, lon1, lat2, lon2) => {
      const R = 3958.8, t = Math.PI / 180;
      const dLat = (lat2 - lat1) * t, dLon = (lon2 - lon1) * t;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    const bucket = (mi) => (mi <= 10 ? 10 : mi <= 20 ? 20 : mi <= 35 ? 35 : mi <= 50 ? 50 : 75);
    const seatCoords = (fid) => {
      const f = featById[fid];
      return (f && f.geometry && f.geometry.coordinates) ? f.geometry.coordinates : null;
    };
    const winSeat = seatCoords('place-winchester-va');
    const marSeat = seatCoords('place-martinsburg-wv');
    const R50_REFUSE_EXTRA = [
      { re: /\b(?:usdot|dot|mc)\s*(?:#|number|no\.?)\b/i, why: 'authority-number-claim' },
      { re: /\bdiscount\b/i, why: 'discount-claim' },
      { re: /\bdata destruction\b/i, why: 'itad-destruction-claim' },
      { re: /\bcertificates? of destruction\b/i, why: 'itad-certificate-claim' },
      { re: /\bdrayage\b/i, why: 'drayage-claim' },
      { re: /\btransportation management\b/i, why: 'transportation-management-claim' },
      { re: /\blocksmith\b/i, why: 'locksmith-claim' },
      { re: /\bstorage in transit\b/i, why: 'sit-claim' },
      { re: /\bclimate[- ]controlled (?:truck|transport|transit|moving|van|trailer)\b/i, why: 'climate-transit-claim' },
      { re: /\bhazardous\b/i, why: 'hazardous-waste-claim' },
      { re: /\bbrokerage\b/i, why: 'brokerage-claim' },
      { re: /\bcustoms\b/i, why: 'customs-claim' },
      { re: /\bfreight forwarding\b/i, why: 'freight-forwarding-claim' },
      { re: /\bproject cargo\b/i, why: 'project-cargo-transport-claim' },
    ];
    const r50Refuse = (q) => R35_TRUTH_REFUSE.find((t) => t.re.test(q)) || R50_REFUSE_EXTRA.find((t) => t.re.test(q)) || null;
    const r50Land = (svcId, intentClass, q, area, target, pattern) => {
      const bad = r50Refuse(q);
      if (bad) {
        R50_STATS.truthRefused++;
        excluded.push({ reason: 'r50-truth-' + bad.why, serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const nk = svcId + '|' + r30Norm(q);
      if (r30NormSeen.has(nk)) {
        const first = r30NormSeen.get(nk);
        if (first === q) R50_STATS.collisionExact++; else R50_STATS.collisionNormalized++;
        excluded.push({ reason: 'r50-collision-bank-kept', serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const ok = emit(svcId, intentClass, q, area, target, pattern, { source: 'money-trio6-logistics-dataset' });
      if (ok) {
        r30NormSeen.set(nk, q);
        R50_STATS.byPage[target] = (R50_STATS.byPage[target] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R50_SOURCE_ROWS.push({ q, intent: intentClass, service_id: svcId, area, target_url: landedRow.target_url, pattern });
        return true;
      }
      R50_STATS.gateExcluded++;
      excluded.push({ reason: 'r50-gate-excluded', serviceId: svcId, queryText: q, pattern });
      return false;
    };
    const landV = (svcId, cls, q, area, target, family) => {
      R50_STATS.variantsAttempted++;
      if (r50Land(svcId, cls, q, area, target, 'R50-variant-' + family)) {
        R50_STATS.variantsLanded++;
        R50_STATS.byFamily[family] = (R50_STATS.byFamily[family] || 0) + 1;
      }
    };
    const SVC = 'service-logistics-project-management';
    const SLUG = 'logistics-project-management';
    const R50_ASPECTS = [
      (pq) => 'does a logistics project come with a single point of contact in ' + pq + '?',
      (pq) => 'is a logistics project run to a milestone plan in ' + pq + '?',
      (pq) => 'does logistics project management cover a container program end to end in ' + pq + '?',
      (pq) => 'can a warehouse surge program be run under one logistics project plan in ' + pq + '?',
      (pq) => 'is port-adjacent staging included in a logistics project in ' + pq + '?',
      (pq) => 'is a logistics project quoted at one flat rate in writing in ' + pq + '?',
    ];
    const R50_PHRASES = ['project logistics', 'project logistics services', 'logistics program management', 'port project logistics', 'turnkey project logistics'];
    const cells = [];
    for (const f of geo.features || []) {
      const p = f.properties || {};
      if (!p.id || !p.id.startsWith('place-')) continue;
      if (!(p.services || []).includes('logistics-project-management')) continue;
      cells.push(f);
    }
    let cellIdx = 0;
    for (const f of cells) {
      cellIdx++;
      const p = f.properties;
      const pl = String(p.name || '').replace(/,/g, '');
      const pq = String(p.name || '');
      const zip = geoZipPrimary(p.id);
      let radius = 25;
      if (f.geometry && f.geometry.coordinates) {
        const [lo, la] = f.geometry.coordinates;
        const seats = [winSeat, marSeat].filter(Boolean);
        let best = null;
        for (const s of seats) { const d = havMi(la, lo, s[1], s[0]); if (best === null || d < best) best = d; }
        if (best !== null) radius = bucket(best);
      }
      const area = p.id, target = SLUG;
      // rotating census-concept aspect, one per cell
      R50_STATS.cellsAttempted++;
      if (r50Land(SVC, 'ai-question', R50_ASPECTS[cellIdx % R50_ASPECTS.length](pq), area, target, 'R50-cell')) R50_STATS.cellsLanded++;
      for (const ph of R50_PHRASES) {
        // CELL + AI-QUESTION FORMS
        R50_STATS.cellsAttempted++;
        if (r50Land(SVC, 'ai-question', 'who provides ' + ph + ' in ' + pq + '?', area, target, 'R50-cell')) R50_STATS.cellsLanded++;
        landV(SVC, 'ai-question', 'how do i arrange ' + ph + ' in ' + pl + '?', area, target, 'ai-question');
        landV(SVC, 'ai-question', 'what does ' + ph + ' include in ' + pl + '?', area, target, 'ai-question');
        // PROXIMITY
        landV(SVC, 'navigational-local', ph + ' near me', area, target, 'proximity');
        landV(SVC, 'best-choice', 'best ' + ph + ' near me', area, target, 'proximity');
        // LOCALITY SCALE
        landV(SVC, 'navigational-local', ph + ' in ' + pl, area, target, 'locality');
        // RADIUS
        landV(SVC, 'navigational-local', ph + ' within ' + radius + ' miles of ' + pl, area, target, 'radius');
        // ZIP FORMS
        if (zip) {
          landV(SVC, 'navigational-local', ph + ' ' + zip, area, target, 'zip');
          landV(SVC, 'navigational-local', ph + ' near ' + zip, area, target, 'zip');
        }
        // RELATION WORDS
        landV(SVC, 'navigational-local', ph + ' serving ' + pq, area, target, 'relation');
        landV(SVC, 'navigational-local', ph + ' available in ' + pl, area, target, 'relation');
      }
    }
    // PORT CELLS — the 8 registry ports, area = the ports.json id
    for (const port of portsDb.ports || []) {
      const area = port.id, target = SLUG;
      const nm = port.name;
      const short = port.shortName || port.name;
      R50_STATS.cellsAttempted++;
      if (r50Land(SVC, 'ai-question', 'who provides project logistics at ' + nm + '?', area, target, 'R50-cell')) R50_STATS.cellsLanded++;
      R50_STATS.cellsAttempted++;
      if (r50Land(SVC, 'ai-question', 'who manages logistics projects at ' + nm + '?', area, target, 'R50-cell')) R50_STATS.cellsLanded++;
      landV(SVC, 'navigational-local', 'project logistics at ' + short, area, target, 'locality');
      landV(SVC, 'navigational-local', 'logistics program management at ' + short, area, target, 'locality');
      landV(SVC, 'navigational-local', 'port project logistics ' + port.address.addressLocality + ' ' + port.address.addressRegion, area, target, 'locality');
      landV(SVC, 'ai-question', 'does logistics project management cover container programs at ' + nm + '?', area, target, 'ai-question');
      landV(SVC, 'ai-question', 'are twic-carded crews dispatched for logistics projects at ' + nm + '?', area, target, 'ai-question');
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r50-accounting.json'),
        JSON.stringify({ r50: R50_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r50-source-rows.jsonl'),
        R50_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }
  // R51 (Money Trio-7 Full-Formula + Domination Rule, 2026-11-16):
  // pages 19-21 of the Tier-1 money-page sweep get the same
  // section-6 variant coverage as R44-R50 —
  // /medical-lab-equipment-relocation/ (W13), /ffe-logistics/ (W27)
  // and /piano-antique-white-glove-moving/ (W19), picked by fresh
  // measure on the sealed cb882a98 bank (80,935 rows): 1,353 /
  // 1,325 / 1,117 rows bound — the three largest remaining Tier-1
  // banks, all hubs. The pre-build family census read the identical
  // signature on all three: radius 0, ZIP 0, relation 0, proximity
  // thin (8 / 9 / 15). NEW this trio (Henry's domination rule,
  // 2026-11-16): the build is fed by a competitor attack run BEFORE
  // building (out/batch-money-trio7-2026-11-16/rival-reads.md) —
  // RapidMed Logistics and JK Moving hold the medical/lab terms,
  // JK and Olympia hold FF&E in DC while the Winchester FF&E term
  // is unheld, moveBuddha lists and Whitesel hold piano in
  // Winchester while no mover holds antique Middleburg. No rival in
  // any set publishes a flat rate in writing; the lane's aspects and
  // the pages' answer blocks are built on that gap. The Henry-fed
  // buyer-question banks (medical / ffe / piano-antique, 224 each,
  // out/answer-format-2026-11-16/) drive the pages' buyer-voice FAQ
  // through the jf seats. CELLS are derived from machine data only
  // (determinism law: data/service-area.geojson + data/pages.json,
  // never rubric.db): each hub takes every place carrying its
  // token (the R45/R49 flagship rule): medical-lab 68 cells,
  // ffe-logistics 68 cells, piano-antique 80 cells (postal-coded
  // cells emit ZIP forms only where the geo record carries a code).
  // The piano hub carries TWO head phrases — piano movers and
  // antique movers — its two ledger families. Radius buckets read
  // the nearer branch seat's coordinates, the Territory Matrix
  // centroid method, as in R44-R50. TRUTH SCREEN: the R35 base set
  // plus the R49/R50 extras (authority-number, discount, ITAD
  // destruction / certificate, drayage, transportation-management,
  // locksmith, storage-in-transit, climate-controlled-transit,
  // hazardous-waste screens), plus a HIPAA screen (no HIPAA
  // compliance or certification is ever claimed — the crews move
  // equipment, never patient data), a decontamination-certificate
  // screen (decontamination is the facility's / vendor's layer and
  // is never certified by the mover), a specimen / biological /
  // refrigerated-transport screen (the service moves EQUIPMENT
  // ONLY — specimens, biological material, chemicals and cryogenic
  // contents never move; cryogenic equipment moves empty, emptied
  // and prepared by the client's team), a recommissioning /
  // requalification screen (calibration, certification,
  // commissioning and requalification belong to the manufacturer's
  // technicians — never the mover's claim) and an appraisal screen
  // (pieces are assessed for the move; the company does not
  // appraise or value them). Aspects stay inside the published fact
  // set: medical and lab equipment surveyed unit by unit with
  // weights, dimensions and route measurements, custody documented
  // at each hand-off, heavy imaging-class devices planned under
  // SIR in the 1,500 to 3,500 lb band with the floor checked to
  // L/360, the OEM boundary stated plainly; FF&E received from many
  // vendors with a formal inspection report, held in leased space,
  // delivered by floor and room sequence, installed with packaging
  // removal, outgoing hotel FF&E routed to liquidation value
  // recovery, procurement and design never claimed; pianos and
  // antiques assessed piece by piece, a grand moved with legs and
  // pedal lyre removed and wrapped separately and the body on its
  // long side, stairs carried not rolled, custom crating when the
  // piece requires it, high-mass pieces under SIR and KIM-GS.
  const R51_STATS = { cellsAttempted: 0, cellsLanded: 0, variantsAttempted: 0, variantsLanded: 0, byFamily: {}, byPage: {}, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0 };
  const R51_SOURCE_ROWS = [];
  {
    const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-area.geojson'), 'utf8'));
    const featById = {};
    for (const f of geo.features || []) if (f.properties && f.properties.id) featById[f.properties.id] = f;
    const pagesDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages.json'), 'utf8'));
    const pageSlugs = new Set((pagesDb.pages || []).map((p) => p.slug));
    const havMi = (lat1, lon1, lat2, lon2) => {
      const R = 3958.8, t = Math.PI / 180;
      const dLat = (lat2 - lat1) * t, dLon = (lon2 - lon1) * t;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    const bucket = (mi) => (mi <= 10 ? 10 : mi <= 20 ? 20 : mi <= 35 ? 35 : mi <= 50 ? 50 : 75);
    const seatCoords = (fid) => {
      const f = featById[fid];
      return (f && f.geometry && f.geometry.coordinates) ? f.geometry.coordinates : null;
    };
    const winSeat = seatCoords('place-winchester-va');
    const marSeat = seatCoords('place-martinsburg-wv');
    const R51_STATE_NAME = { VA: 'Virginia', WV: 'West Virginia', MD: 'Maryland', DC: 'Washington DC', PA: 'Pennsylvania' };
    const R51_REFUSE_EXTRA = [
      { re: /\b(?:usdot|dot|mc)\s*(?:#|number|no\.?)\b/i, why: 'authority-number-claim' },
      { re: /\bdiscount\b/i, why: 'discount-claim' },
      { re: /\bdata destruction\b/i, why: 'itad-destruction-claim' },
      { re: /\bcertificates? of destruction\b/i, why: 'itad-certificate-claim' },
      { re: /\bdrayage\b/i, why: 'drayage-claim' },
      { re: /\btransportation management\b/i, why: 'transportation-management-claim' },
      { re: /\blocksmith\b/i, why: 'locksmith-claim' },
      { re: /\bstorage in transit\b/i, why: 'sit-claim' },
      { re: /\bclimate[- ]controlled (?:truck|transport|transit|moving|van|trailer)\b/i, why: 'climate-transit-claim' },
      { re: /\bhazardous\b/i, why: 'hazardous-waste-claim' },
      { re: /\bhipaa\b/i, why: 'hipaa-claim' },
      { re: /\bdecontamination certificates?\b/i, why: 'decontamination-certificate-claim' },
      { re: /\bspecimens?\b/i, why: 'specimen-transport-claim' },
      { re: /\bbiological\b/i, why: 'biological-transport-claim' },
      { re: /\brefrigerated\b/i, why: 'refrigerated-transport-claim' },
      { re: /\brecommission/i, why: 'recommissioning-claim' },
      { re: /\brequalif/i, why: 'requalification-claim' },
      { re: /\bapprais(?:al|e|ers?)\b/i, why: 'appraisal-claim' },
    ];
    const r51Refuse = (q) => R35_TRUTH_REFUSE.find((t) => t.re.test(q)) || R51_REFUSE_EXTRA.find((t) => t.re.test(q)) || null;
    const r51Land = (svcId, intentClass, q, area, target, pattern) => {
      const bad = r51Refuse(q);
      if (bad) {
        R51_STATS.truthRefused++;
        excluded.push({ reason: 'r51-truth-' + bad.why, serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const nk = svcId + '|' + r30Norm(q);
      if (r30NormSeen.has(nk)) {
        const first = r30NormSeen.get(nk);
        if (first === q) R51_STATS.collisionExact++; else R51_STATS.collisionNormalized++;
        excluded.push({ reason: 'r51-collision-bank-kept', serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const ok = emit(svcId, intentClass, q, area, target, pattern, { source: 'money-trio7-formula' });
      if (ok) {
        r30NormSeen.set(nk, q);
        R51_STATS.byPage[target] = (R51_STATS.byPage[target] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R51_SOURCE_ROWS.push({ q, intent: intentClass, service_id: svcId, area, target_url: landedRow.target_url, pattern });
        return true;
      }
      R51_STATS.gateExcluded++;
      excluded.push({ reason: 'r51-gate-excluded', serviceId: svcId, queryText: q, pattern });
      return false;
    };
    const landV = (svcId, cls, q, area, target, family) => {
      R51_STATS.variantsAttempted++;
      if (r51Land(svcId, cls, q, area, target, 'R51-variant-' + family)) {
        R51_STATS.variantsLanded++;
        R51_STATS.byFamily[family] = (R51_STATS.byFamily[family] || 0) + 1;
      }
    };
    const R51_ASPECTS = {
      'service-medical-lab-relocation': [
        (pq) => 'does a medical equipment move start with a survey of weights, dimensions and the route in ' + pq + '?',
        (pq) => 'are heavy medical devices planned under sir in the 1,500 to 3,500 lb band in ' + pq + '?',
        (pq) => 'does the crew document custody at each hand-off during a lab move in ' + pq + '?',
      ],
      'service-ffe-logistics': [
        (pq) => 'does ff&e logistics include receiving, inspection and warehousing before installation in ' + pq + '?',
        (pq) => 'is ff&e delivered by floor and room sequence during an installation in ' + pq + '?',
        (pq) => 'is an ff&e project quoted at one flat rate in writing in ' + pq + '?',
      ],
      'service-piano-antique': [
        (pq) => 'are pianos and antiques assessed piece by piece before a move in ' + pq + '?',
        (pq) => 'does a grand piano move with its legs and pedal lyre removed and wrapped separately in ' + pq + '?',
        (pq) => 'are heavy pianos and antiques floor-checked to l/360 under sir in ' + pq + '?',
      ],
    };
    const R51_TARGETS = [
      { svc: 'service-medical-lab-relocation', token: 'medical-lab', slug: 'medical-lab-equipment-relocation', phrases: [{ phrase: 'medical equipment movers', base: 'medical equipment moving' }] },
      { svc: 'service-ffe-logistics', token: 'ffe-logistics', slug: 'ffe-logistics', phrases: [{ phrase: 'ff&e logistics', base: 'ff&e logistics' }] },
      { svc: 'service-piano-antique', token: 'piano-antique', slug: 'piano-antique-white-glove-moving', phrases: [{ phrase: 'piano movers', base: 'piano moving' }, { phrase: 'antique movers', base: 'antique moving' }] },
    ];
    for (const T of R51_TARGETS) {
      const cells = [];
      for (const f of geo.features || []) {
        const p = f.properties || {};
        if (!p.id || !p.id.startsWith('place-')) continue;
        if (!(p.services || []).includes(T.token)) continue;
        cells.push(f);
      }
      let cellIdx = 0;
      for (const f of cells) {
        cellIdx++;
        const p = f.properties;
        const pl = String(p.name || '').replace(/,/g, '');
        const pq = String(p.name || '');
        const stateName = R51_STATE_NAME[p.state] || null;
        const countyTail = String(p.county || '').split('/').pop().trim();
        const county = /County$/.test(countyTail) ? countyTail : null;
        const zip = geoZipPrimary(p.id);
        let radius = 25;
        if (f.geometry && f.geometry.coordinates) {
          const [lo, la] = f.geometry.coordinates;
          const seats = [winSeat, marSeat].filter(Boolean);
          let best = null;
          for (const s of seats) { const d = havMi(la, lo, s[1], s[0]); if (best === null || d < best) best = d; }
          if (best !== null) radius = bucket(best);
        }
        const area = p.id, target = T.slug;
        for (const PH of T.phrases) {
          const ph = PH.phrase, base = PH.base;
          // cell question forms
          const cellForms = [
            ['ai-question', 'who provides ' + ph + ' in ' + pq + '?'],
            ['ai-question', R51_ASPECTS[T.svc][cellIdx % R51_ASPECTS[T.svc].length](pq)],
          ];
          for (const [cls, q] of cellForms) {
            R51_STATS.cellsAttempted++;
            if (r51Land(T.svc, cls, q, area, target, 'R51-cell')) R51_STATS.cellsLanded++;
          }
          // PROXIMITY
          landV(T.svc, 'navigational-local', ph + ' near me', area, target, 'proximity');
          landV(T.svc, 'best-choice', 'best ' + ph + ' near me', area, target, 'proximity');
          landV(T.svc, 'navigational-local', ph + ' nearby', area, target, 'proximity');
          landV(T.svc, 'navigational-local', ph + ' near ' + pl, area, target, 'proximity');
          landV(T.svc, 'navigational-local', ph + ' close to ' + pl, area, target, 'proximity');
          // LOCALITY SCALE
          if (!ph.startsWith('local ')) landV(T.svc, 'navigational-local', 'local ' + ph + ' ' + pl, area, target, 'locality');
          landV(T.svc, 'navigational-local', ph + ' in ' + pl, area, target, 'locality');
          if (county) landV(T.svc, 'navigational-local', ph + ' in ' + county + ' ' + p.state, area, target, 'locality');
          if (stateName) landV(T.svc, 'navigational-local', ph + ' in ' + stateName, area, target, 'locality');
          landV(T.svc, 'navigational-local', ph + ' around ' + pl, area, target, 'locality');
          landV(T.svc, 'navigational-local', 'regional ' + ph + ' ' + pl, area, target, 'locality');
          // RADIUS
          landV(T.svc, 'navigational-local', ph + ' within ' + radius + ' miles of ' + pl, area, target, 'radius');
          landV(T.svc, 'navigational-local', ph + ' serving the ' + pl + ' area', area, target, 'radius');
          // ZIP FORMS — the place's geo record postal code
          if (zip) {
            landV(T.svc, 'navigational-local', ph + ' ' + zip, area, target, 'zip');
            landV(T.svc, 'navigational-local', ph + ' near ' + zip, area, target, 'zip');
          }
          // RELATION WORDS
          landV(T.svc, 'navigational-local', ph + ' serving ' + pq, area, target, 'relation');
          landV(T.svc, 'navigational-local', ph + ' covering ' + pq, area, target, 'relation');
          landV(T.svc, 'navigational-local', ph + ' available in ' + pl, area, target, 'relation');
          landV(T.svc, 'navigational-local', ph + ' based in ' + pl, area, target, 'relation');
          // AI-QUESTION FORMS
          landV(T.svc, 'ai-question', 'how do i arrange ' + base + ' in ' + pl + '?', area, target, 'ai-question');
          landV(T.svc, 'ai-question', 'what does ' + base + ' include in ' + pl + '?', area, target, 'ai-question');
        }
      }
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r51-accounting.json'),
        JSON.stringify({ r51: R51_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r51-source-rows.jsonl'),
        R51_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }
  // R52 (Data-Center Re-Attack + Answer Standard, 2026-11-16):
  // the data-center category gets the section-6 variant coverage
  // its Spot-1 place pages never had. The pre-build family census
  // (rubric.db, 2026-11-16) read the thin signature on every target:
  // /data-center-movers-ashburn-va/ 181 rows — radius 0, ZIP 0,
  // relation 0, locality 1; /data-center-movers-leesburg-va/ 180
  // rows — radius 0, ZIP 0, relation 0, locality 2;
  // /data-center-movers-winchester-va/ and
  // /data-center-movers-martinsburg-wv/ 2 rows each, every family 0;
  // and the IT hub /it-equipment-moving-data-center-logistics-
  // services-virginia/ carried radius 0, ZIP 0, relation 0 across
  // all 136 of its bound areas (the data-center hub itself is full
  // from R44/money-trio4 and is NOT re-laned). The build is fed by
  // the competitor attack run BEFORE building (out/batch-
  // datacenter-reattack-2026-11-16/rival-reads.md): the DCR family
  // (datacentersrelocation.com / Data Center Relocation Experts)
  // holds #1 organic on 4 of 5 Spot-1 terms with a pre-cut answer
  // shape and a downtime GUARANTEE; A Few Good Men Moving holds the
  // Leesburg terms in this run's captures with soft generalist
  // prose. No rival in the set publishes a flat rate in writing or
  // a dated, documented engagement. The Henry-fed DC buyer bank
  // (216 questions: finder / cost / downtime / method / security /
  // timing / equipment / adjacent, out/answer-format-2026-11-16/
  // dc-buyer-questions.json) drives the pages' buyer-voice FAQ
  // through the jf seats. CELLS are derived from machine data only
  // (determinism law: data/service-area.geojson + data/pages.json,
  // never rubric.db): the place targets are the four places with
  // dedicated data-center pages, each asserted in-run against its
  // pages.json service registration; the IT footprint pass takes
  // every remaining place carrying the it-relocation token (66
  // cells) to the IT hub. Radius buckets read the nearer branch
  // seat's coordinates, the Territory Matrix centroid method, as in
  // R44-R51. TRUTH SCREEN: the R35 base set plus the R49/R50 extras
  // (authority-number, discount, ITAD destruction / certificate,
  // drayage, transportation-management, locksmith, storage-in-
  // transit, climate-controlled-transit, hazardous-waste screens)
  // plus a HIPAA screen (no HIPAA compliance or certification is
  // ever claimed), plus the data-center screens: a downtime-
  // guarantee screen and a zero-downtime-claim screen (zero
  // downtime is a METHOD — rack-by-rack phasing inside 2-to-4-hour
  // maintenance windows — never a guarantee or an outcome claim),
  // an invented-percentage screen (no uptime / on-time percentages
  // are ever published), and the logical-layer screens (workload
  // migration, data / cloud migration, dependency mapping, DNS and
  // backup verification are the client's IT layer, never the
  // mover's claim). Aspects stay inside the published fact set:
  // crews disconnect, de-rack, label every cable to the port,
  // transport sealed, re-rack, re-cable and power up; background
  // checks and escort rules are confirmed scope; heavy racks and
  // cabinets in the 1,500 to 3,500 lb band are surveyed under SIR
  // with the floor checked to L/360; the documented record is the
  // eight-site, 33-rack engagement of June 2024 (dc-001, city-level
  // only); retired equipment is handed to the engaged certified
  // ITAD partner, whose sanitization and certification are never
  // claimed as the company's.
  const R52_STATS = { cellsAttempted: 0, cellsLanded: 0, variantsAttempted: 0, variantsLanded: 0, byFamily: {}, byPage: {}, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0 };
  const R52_SOURCE_ROWS = [];
  {
    const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-area.geojson'), 'utf8'));
    const featById = {};
    for (const f of geo.features || []) if (f.properties && f.properties.id) featById[f.properties.id] = f;
    const pagesDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages.json'), 'utf8'));
    const pageBySlugR52 = {};
    for (const p of pagesDb.pages || []) pageBySlugR52[p.slug] = p;
    const havMi = (lat1, lon1, lat2, lon2) => {
      const R = 3958.8, t = Math.PI / 180;
      const dLat = (lat2 - lat1) * t, dLon = (lon2 - lon1) * t;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    const bucket = (mi) => (mi <= 10 ? 10 : mi <= 20 ? 20 : mi <= 35 ? 35 : mi <= 50 ? 50 : 75);
    const seatCoords = (fid) => {
      const f = featById[fid];
      return (f && f.geometry && f.geometry.coordinates) ? f.geometry.coordinates : null;
    };
    const winSeat = seatCoords('place-winchester-va');
    const marSeat = seatCoords('place-martinsburg-wv');
    const R52_STATE_NAME = { VA: 'Virginia', WV: 'West Virginia', MD: 'Maryland', DC: 'Washington DC', PA: 'Pennsylvania' };
    const R52_REFUSE_EXTRA = [
      { re: /\b(?:usdot|dot|mc)\s*(?:#|number|no\.?)\b/i, why: 'authority-number-claim' },
      { re: /\bdiscount\b/i, why: 'discount-claim' },
      { re: /\bdata destruction\b/i, why: 'itad-destruction-claim' },
      { re: /\bcertificates? of destruction\b/i, why: 'itad-certificate-claim' },
      { re: /\bdrayage\b/i, why: 'drayage-claim' },
      { re: /\btransportation management\b/i, why: 'transportation-management-claim' },
      { re: /\blocksmith\b/i, why: 'locksmith-claim' },
      { re: /\bstorage in transit\b/i, why: 'sit-claim' },
      { re: /\bclimate[- ]controlled (?:truck|transport|transit|moving|van|trailer)\b/i, why: 'climate-transit-claim' },
      { re: /\bhazardous\b/i, why: 'hazardous-waste-claim' },
      { re: /\bhipaa\b/i, why: 'hipaa-claim' },
      { re: /\bdowntime guarantee\b/i, why: 'downtime-guarantee-claim' },
      { re: /\bguarantee[ds]?\b[^?]*\b(?:downtime|uptime)\b/i, why: 'downtime-guarantee-claim' },
      { re: /\bzero downtime\b/i, why: 'zero-downtime-claim' },
      { re: /\b\d+(?:\.\d+)?\s?%\s*(?:uptime|on-time|downtime)\b/i, why: 'invented-percentage-claim' },
      { re: /\bworkload migration\b/i, why: 'logical-layer-claim' },
      { re: /\bdata migration\b/i, why: 'logical-layer-claim' },
      { re: /\bcloud migration\b/i, why: 'logical-layer-claim' },
      { re: /\bdependency mapping\b/i, why: 'logical-layer-claim' },
      { re: /\bdns\b/i, why: 'logical-layer-claim' },
      { re: /\bbackup verification\b/i, why: 'logical-layer-claim' },
    ];
    const r52Refuse = (q) => R35_TRUTH_REFUSE.find((t) => t.re.test(q)) || R52_REFUSE_EXTRA.find((t) => t.re.test(q)) || null;
    const r52Land = (svcId, intentClass, q, area, target, pattern) => {
      const bad = r52Refuse(q);
      if (bad) {
        R52_STATS.truthRefused++;
        excluded.push({ reason: 'r52-truth-' + bad.why, serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const nk = svcId + '|' + r30Norm(q);
      if (r30NormSeen.has(nk)) {
        const first = r30NormSeen.get(nk);
        if (first === q) R52_STATS.collisionExact++; else R52_STATS.collisionNormalized++;
        excluded.push({ reason: 'r52-collision-bank-kept', serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const ok = emit(svcId, intentClass, q, area, target, pattern, { source: 'datacenter-reattack-formula' });
      if (ok) {
        r30NormSeen.set(nk, q);
        R52_STATS.byPage[target] = (R52_STATS.byPage[target] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R52_SOURCE_ROWS.push({ q, intent: intentClass, service_id: svcId, area, target_url: landedRow.target_url, pattern });
        return true;
      }
      R52_STATS.gateExcluded++;
      excluded.push({ reason: 'r52-gate-excluded', serviceId: svcId, queryText: q, pattern });
      return false;
    };
    const landV = (svcId, cls, q, area, target, family) => {
      R52_STATS.variantsAttempted++;
      if (r52Land(svcId, cls, q, area, target, 'R52-variant-' + family)) {
        R52_STATS.variantsLanded++;
        R52_STATS.byFamily[family] = (R52_STATS.byFamily[family] || 0) + 1;
      }
    };
    const R52_ASPECTS = {
      'service-data-center-relocation': [
        (pq) => 'does a data center move in ' + pq + ' run rack by rack so the rest of the room stays live?',
        (pq) => 'do the crews disconnect, de-rack, re-rack, re-cable and power up racks in ' + pq + '?',
        (pq) => 'are data center moving crews background checked and escort ready in ' + pq + '?',
      ],
      'service-it-relocation': [
        (pq) => 'does an IT equipment move in ' + pq + ' label every cable to its port before disconnect?',
        (pq) => 'are servers transported sealed and re-racked in the same order in ' + pq + '?',
        (pq) => 'is IT equipment moving quoted at one flat rate in writing in ' + pq + '?',
      ],
    };
    const cellOf = (f) => {
      const p = f.properties;
      const pl = String(p.name || '').replace(/,/g, '');
      const pq = String(p.name || '');
      const stateName = R52_STATE_NAME[p.state] || null;
      const countyTail = String(p.county || '').split('/').pop().trim();
      const county = /County$/.test(countyTail) ? countyTail : null;
      const zip = geoZipPrimary(p.id);
      let radius = 25;
      if (f.geometry && f.geometry.coordinates) {
        const [lo, la] = f.geometry.coordinates;
        const seats = [winSeat, marSeat].filter(Boolean);
        let best = null;
        for (const s of seats) { const d = havMi(la, lo, s[1], s[0]); if (best === null || d < best) best = d; }
        if (best !== null) radius = bucket(best);
      }
      return { p, pl, pq, stateName, county, zip, radius, area: p.id };
    };
    const emitCell = (svc, target, C, phrases, cellIdx) => {
      const { pl, pq, stateName, county, zip, radius, area } = C;
      for (const PH of phrases) {
        const ph = PH.phrase, base = PH.base;
        const cellForms = [
          ['ai-question', 'who provides ' + ph + ' in ' + pq + '?'],
          ['ai-question', R52_ASPECTS[svc][cellIdx % R52_ASPECTS[svc].length](pq)],
        ];
        for (const [cls, q] of cellForms) {
          R52_STATS.cellsAttempted++;
          if (r52Land(svc, cls, q, area, target, 'R52-cell')) R52_STATS.cellsLanded++;
        }
        // PROXIMITY
        landV(svc, 'navigational-local', ph + ' near me', area, target, 'proximity');
        landV(svc, 'best-choice', 'best ' + ph + ' near me', area, target, 'proximity');
        landV(svc, 'navigational-local', ph + ' nearby', area, target, 'proximity');
        landV(svc, 'navigational-local', ph + ' near ' + pl, area, target, 'proximity');
        landV(svc, 'navigational-local', ph + ' close to ' + pl, area, target, 'proximity');
        // LOCALITY SCALE
        if (!ph.startsWith('local ')) landV(svc, 'navigational-local', 'local ' + ph + ' ' + pl, area, target, 'locality');
        landV(svc, 'navigational-local', ph + ' in ' + pl, area, target, 'locality');
        if (county) landV(svc, 'navigational-local', ph + ' in ' + county + ' ' + C.p.state, area, target, 'locality');
        if (stateName) landV(svc, 'navigational-local', ph + ' in ' + stateName, area, target, 'locality');
        landV(svc, 'navigational-local', ph + ' around ' + pl, area, target, 'locality');
        landV(svc, 'navigational-local', 'regional ' + ph + ' ' + pl, area, target, 'locality');
        // RADIUS
        landV(svc, 'navigational-local', ph + ' within ' + radius + ' miles of ' + pl, area, target, 'radius');
        landV(svc, 'navigational-local', ph + ' serving the ' + pl + ' area', area, target, 'radius');
        // ZIP FORMS — the place's geo record postal code
        if (zip) {
          landV(svc, 'navigational-local', ph + ' ' + zip, area, target, 'zip');
          landV(svc, 'navigational-local', ph + ' near ' + zip, area, target, 'zip');
        }
        // RELATION WORDS
        landV(svc, 'navigational-local', ph + ' serving ' + pq, area, target, 'relation');
        landV(svc, 'navigational-local', ph + ' covering ' + pq, area, target, 'relation');
        landV(svc, 'navigational-local', ph + ' available in ' + pl, area, target, 'relation');
        landV(svc, 'navigational-local', ph + ' based in ' + pl, area, target, 'relation');
        // AI-QUESTION FORMS
        landV(svc, 'ai-question', 'how do i arrange ' + base + ' in ' + pl + '?', area, target, 'ai-question');
        landV(svc, 'ai-question', 'what does ' + base + ' include in ' + pl + '?', area, target, 'ai-question');
      }
    };
    const DC_PHRASES = [
      { phrase: 'data center movers', base: 'data center moving' },
      { phrase: 'data center relocation', base: 'data center relocation' },
      { phrase: 'server movers', base: 'server moving' },
    ];
    const IT_PHRASES = [
      { phrase: 'IT equipment movers', base: 'IT equipment moving' },
      { phrase: 'IT movers', base: 'IT moving' },
    ];
    // PLACE CELLS — the four places with dedicated data-center pages.
    // Each target is asserted against its pages.json registration:
    // the page must exist and carry the service in its services list.
    const R52_PLACE_TARGETS = [
      { svc: 'service-data-center-relocation', place: 'place-ashburn-va', target: 'data-center-movers-ashburn-va', phrases: DC_PHRASES },
      { svc: 'service-it-relocation', place: 'place-ashburn-va', target: 'data-center-movers-ashburn-va', phrases: IT_PHRASES },
      { svc: 'service-data-center-relocation', place: 'place-leesburg-va', target: 'data-center-movers-leesburg-va', phrases: DC_PHRASES },
      { svc: 'service-it-relocation', place: 'place-leesburg-va', target: 'data-center-movers-leesburg-va', phrases: IT_PHRASES },
      { svc: 'service-data-center-relocation', place: 'place-winchester-va', target: 'data-center-movers-winchester-va', phrases: DC_PHRASES },
      { svc: 'service-data-center-relocation', place: 'place-martinsburg-wv', target: 'data-center-movers-martinsburg-wv', phrases: DC_PHRASES },
    ];
    let cellIdx = 0;
    for (const T of R52_PLACE_TARGETS) {
      const reg = pageBySlugR52[T.target];
      if (!reg) throw new Error('R52: target not in pages.json: ' + T.target);
      if (!(reg.services || []).includes(T.svc)) throw new Error('R52: ' + T.target + ' not registered for ' + T.svc);
      const f = featById[T.place];
      if (!f) throw new Error('R52: place not in geojson: ' + T.place);
      cellIdx++;
      emitCell(T.svc, T.target, cellOf(f), T.phrases, cellIdx);
    }
    // IT FOOTPRINT — every remaining place carrying the it-relocation
    // token binds to the IT hub (the data-center hub is already full
    // from R44; the IT hub carried radius / ZIP / relation 0).
    const IT_HUB = 'it-equipment-moving-data-center-logistics-services-virginia';
    if (!pageBySlugR52[IT_HUB]) throw new Error('R52: IT hub not in pages.json');
    const placePaged = new Set(['place-ashburn-va', 'place-leesburg-va']);
    for (const f of geo.features || []) {
      const p = f.properties || {};
      if (!p.id || !p.id.startsWith('place-')) continue;
      if (!(p.services || []).includes('it-relocation')) continue;
      if (placePaged.has(p.id)) continue;
      cellIdx++;
      emitCell('service-it-relocation', IT_HUB, cellOf(f), IT_PHRASES, cellIdx);
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r52-accounting.json'),
        JSON.stringify({ r52: R52_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r52-source-rows.jsonl'),
        R52_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
  }
  // R53 (Virginia Beach Gun-Safe Takeover, 2026-11-17): the
  // Hampton Roads gun-safe market enters the bank through the
  // R24/R28 stub-place mechanism. The five cities — Virginia Beach,
  // Norfolk, Chesapeake, Hampton, Newport News — have NO
  // service-area.geojson feature (the footprint stays 87 features;
  // no coverage-matrix cell is claimed for them, GS-3) and no
  // footprint lane can reach them. They bind instead through the
  // national performed-work layer (data/national-scope.json: VA
  // cities Virginia Beach / Norfolk / Chesapeake / Newport News,
  // VA services_performed includes 'gun safe moving'). Hampton is
  // NOT in the published national city set: it emits rows bound to
  // the Virginia Beach page as a coverage/FAQ cell only — no
  // Hampton page, no standalone Hampton work claim.
  // MEASURED DEMAND (phase-1 baseline, BUILD-PLAN.md): 4,000 GSC
  // impressions / 0 clicks across 15 Hampton Roads safe queries
  // (window 2025-07-20 -> 2026-11-14), served today by a legacy
  // page, a Wix blog post and a tag page. RIVAL CEILINGS (rival-
  // reads.md): every Hampton Roads holder publishes a 1,500 lb
  // ceiling or lower — Southside ~1,500, JBR 500-1,500 (explicit),
  // Movers Chesapeake 500-1,500 (explicit), STAR priced to 1,200,
  // Hank's examples <=900. The 1,500-3,500 lb SIR band is unheld in
  // all five SERPs; nobody publishes vault-door / installation /
  // re-anchoring scope. COPY LAW: flat-rate-in-writing is PARTIALLY
  // held in this market (JBR's 'Flat Written Rate' badge, Movers
  // Chesapeake's flat written rate, Hank's binding written
  // estimate) — no row and no page copy may claim flat-rate
  // exclusivity; the wedge is the band + vault/install scope + the
  // guarantee form + 16 years. BRANCH BINDING: Winchester, OSRM-
  // measured in this batch (the estate's binding method): Virginia
  // Beach 234.1 mi / 301 min from Winchester vs 258.5 / 328 from
  // Martinsburg; Norfolk 222.0 / 285 vs 246.5 / 312 — Winchester
  // nearer on every pair, all five cities. Framing: crews travel
  // from the Winchester branch — never a local office or address.
  // EMITS, per stub place: the gun-safe template families the
  // footprint lanes would have emitted (the R2 place form + the
  // R16 cost/best/how forms + the service's question-bank-v2 local
  // ai-questions instantiated with the place name, R28's method)
  // PLUS the section-6 variant families (proximity / locality
  // scale / radius / ZIP forms / relation words / AI-question
  // forms) generated from the stub records, R52's emitCell shapes.
  // Stub ZIP = the geocoder postal code of the city's sourced
  // point (the geo-record postal code, one per place, as in the
  // geojson); stub radius = R52's bucket() applied to the nearer
  // branch seat's computed centroid distance (BUILD-PLAN section
  // 2; every Hampton Roads city is >50 mi out, so the bucket is
  // 75 throughout). BINDING: Virginia Beach rows -> the Virginia
  // Beach page; Norfolk rows -> the Norfolk page; Chesapeake /
  // Hampton / Newport News rows -> the Virginia Beach page
  // (single-headed per place family, R24 doctrine). PLACEMENT
  // (the late-lane laws): after R52 and every roll-up lane, before
  // the panel/news late rows; global first-wins dedupe resolves
  // collisions bank-kept, counted below. TRUTH SCREEN: the R35
  // base set plus the extras below (locksmith, authority-number,
  // discount, climate-transit, storage-in-transit screens) —
  // customers empty the safe first; safes under 1,500 lb are
  // handled the same careful way; the up-to-25,000 lb class is
  // contractor-delivered scope only, never the company's own
  // capacity; no invented prices, reviews, or local presence.
  const R53_STATS = { cellsAttempted: 0, cellsLanded: 0, variantsAttempted: 0, variantsLanded: 0, templateLanded: 0, byFamily: {}, byPage: {}, collisionExact: 0, collisionNormalized: 0, truthRefused: 0, gateExcluded: 0 };
  const R53_SOURCE_ROWS = [];
  {
    const pagesDbR53 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages.json'), 'utf8'));
    const pageBySlugR53 = {};
    for (const p of pagesDbR53.pages || []) pageBySlugR53[p.slug] = p;
    const R53_REFUSE_EXTRA = [
      { re: /\blocksmith\b/i, why: 'locksmith-claim' },
      { re: /\b(?:usdot|dot|mc)\s*(?:#|number|no\.?)\b/i, why: 'authority-number-claim' },
      { re: /\bdiscount\b/i, why: 'discount-claim' },
      { re: /\bclimate[- ]controlled (?:truck|transport|transit|moving|van|trailer)\b/i, why: 'climate-transit-claim' },
      { re: /\bstorage in transit\b/i, why: 'sit-claim' },
    ];
    const r53Refuse = (q) => R35_TRUTH_REFUSE.find((t) => t.re.test(q)) || R53_REFUSE_EXTRA.find((t) => t.re.test(q)) || null;
    const r53Land = (svcId, intentClass, q, area, target, pattern) => {
      const bad = r53Refuse(q);
      if (bad) {
        R53_STATS.truthRefused++;
        excluded.push({ reason: 'r53-truth-' + bad.why, serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const nk = svcId + '|' + r30Norm(q);
      if (r30NormSeen.has(nk)) {
        const first = r30NormSeen.get(nk);
        if (first === q) R53_STATS.collisionExact++; else R53_STATS.collisionNormalized++;
        excluded.push({ reason: 'r53-collision-bank-kept', serviceId: svcId, queryText: q, pattern });
        return false;
      }
      const ok = emit(svcId, intentClass, q, area, target, pattern, { source: 'virginia-beach-gunsafe-formula' });
      if (ok) {
        r30NormSeen.set(nk, q);
        R53_STATS.byPage[target] = (R53_STATS.byPage[target] || 0) + 1;
        const landedRow = rows[rows.length - 1];
        R53_SOURCE_ROWS.push({ q, intent: intentClass, service_id: svcId, area, target_url: landedRow.target_url, pattern });
        return true;
      }
      R53_STATS.gateExcluded++;
      excluded.push({ reason: 'r53-gate-excluded', serviceId: svcId, queryText: q, pattern });
      return false;
    };
    const landV53 = (svcId, cls, q, area, target, family) => {
      R53_STATS.variantsAttempted++;
      if (r53Land(svcId, cls, q, area, target, 'R53-variant-' + family)) {
        R53_STATS.variantsLanded++;
        R53_STATS.byFamily[family] = (R53_STATS.byFamily[family] || 0) + 1;
      }
    };
    const qb2PathR53 = path.join(DATA_ROOT, 'question-bank-v2.json');
    const qb2R53 = fs.existsSync(qb2PathR53) ? JSON.parse(fs.readFileSync(qb2PathR53, 'utf8')) : {};
    const localQs53 = (qb2R53['service-gun-safe'] || [])
      .filter((q) => q && q.local && String(q.text || '').includes('{area}'))
      .map((q) => americanize(String(q.text || '').trim()))
      .filter(Boolean);
    const bucket53 = (mi) => (mi <= 10 ? 10 : mi <= 20 ? 20 : mi <= 35 ? 35 : mi <= 50 ? 50 : 75);
    const GS_PHRASES = [
      { phrase: 'gun safe movers', base: 'gun safe moving' },
      { phrase: 'safe movers', base: 'safe moving' },
      { phrase: 'gun safe relocation', base: 'gun safe relocation' },
    ];
    const R53_ASPECTS = [
      (pq) => 'who moves gun safes of 1,500 to 3,500 lb in ' + pq + '?',
      (pq) => 'do gun safe movers move safes up and down stairs in ' + pq + '?',
      (pq) => 'can a gun safe be re-anchored after placement in ' + pq + '?',
      (pq) => 'do gun safe movers deliver and install a safe bought from a dealer in ' + pq + '?',
    ];
    // Stub place records (R28 shape + the geo-record fields the
    // section-6 families read: zip + nearer-branch centroid miles).
    // mi = the nearer (Winchester) seat's computed centroid
    // distance, BUILD-PLAN section 2; zip = the geocoder postal
    // code of the city's sourced point, measured in this batch.
    const R53_STUBS = [
      { id: 'place-virginia-beach-va', name: 'Virginia Beach, VA', kind: 'city', zip: '23456', mi: 200, target: 'gun-safe-movers-virginia-beach-va' },
      { id: 'place-norfolk-va', name: 'Norfolk, VA', kind: 'city', zip: '23510', mi: 191, target: 'gun-safe-movers-norfolk-va' },
      { id: 'place-chesapeake-va', name: 'Chesapeake, VA', kind: 'city', zip: '23323', mi: 196, target: 'gun-safe-movers-virginia-beach-va' },
      { id: 'place-hampton-va', name: 'Hampton, VA', kind: 'city', zip: '23669', mi: 179, target: 'gun-safe-movers-virginia-beach-va' },
      { id: 'place-newport-news-va', name: 'Newport News, VA', kind: 'city', zip: '23606', mi: 172, target: 'gun-safe-movers-virginia-beach-va' },
    ];
    const SVC53 = 'service-gun-safe';
    const [phrase53, plural53] = PHRASE[SVC53];
    for (const TGT of ['gun-safe-movers-virginia-beach-va', 'gun-safe-movers-norfolk-va']) {
      const reg = pageBySlugR53[TGT];
      if (!reg) throw new Error('R53: target not in pages.json: ' + TGT);
      if (!(reg.services || []).includes(SVC53)) throw new Error('R53: ' + TGT + ' not registered for ' + SVC53);
    }
    let stubIdx = 0;
    for (const st of R53_STUBS) {
      stubIdx++;
      const T = st.target;
      // Template families — R2 place form + R16 forms + qb2 local
      // ai-questions, R28's method, gun-safe service only.
      if (r53Land(SVC53, 'navigational-local', phrase53 + ' ' + st.name, st.id, T, 'R53-stub-place')) R53_STATS.templateLanded++;
      if (r53Land(SVC53, 'cost', 'how much ' + (plural53 ? 'do' : 'does') + ' ' + phrase53 + ' cost in ' + st.name, st.id, T, 'R53-stub-cost')) R53_STATS.templateLanded++;
      if (r53Land(SVC53, 'cost', phrase53 + ' cost in ' + st.name, st.id, T, 'R53-stub-cost')) R53_STATS.templateLanded++;
      if (r53Land(SVC53, 'best-choice', 'best ' + phrase53 + ' in ' + st.name, st.id, T, 'R53-stub-best')) R53_STATS.templateLanded++;
      if (r53Land(SVC53, 'best-choice', 'top rated ' + phrase53 + ' in ' + st.name, st.id, T, 'R53-stub-best')) R53_STATS.templateLanded++;
      if (r53Land(SVC53, 'how-process', 'how to hire ' + phrase53 + ' in ' + st.name, st.id, T, 'R53-stub-how')) R53_STATS.templateLanded++;
      for (const q of localQs53) {
        if (r53Land(SVC53, 'ai-question', q.split('{area}').join(st.name), st.id, T, 'R53-stub-ai')) R53_STATS.templateLanded++;
      }
      // Section-6 cell + variant families, R52's emitCell shapes.
      const pl = st.name.replace(/,/g, '');
      const pq = st.name;
      const stateName = 'Virginia';
      const zip = st.zip;
      const radius = bucket53(st.mi);
      for (const PH of GS_PHRASES) {
        const ph = PH.phrase, base = PH.base;
        const cellForms = [
          ['ai-question', 'who provides ' + ph + ' in ' + pq + '?'],
          ['ai-question', R53_ASPECTS[stubIdx % R53_ASPECTS.length](pq)],
        ];
        for (const [cls, q] of cellForms) {
          R53_STATS.cellsAttempted++;
          if (r53Land(SVC53, cls, q, st.id, T, 'R53-cell')) R53_STATS.cellsLanded++;
        }
        // PROXIMITY
        landV53(SVC53, 'navigational-local', ph + ' near me', st.id, T, 'proximity');
        landV53(SVC53, 'best-choice', 'best ' + ph + ' near me', st.id, T, 'proximity');
        landV53(SVC53, 'navigational-local', ph + ' nearby', st.id, T, 'proximity');
        landV53(SVC53, 'navigational-local', ph + ' near ' + pl, st.id, T, 'proximity');
        landV53(SVC53, 'navigational-local', ph + ' close to ' + pl, st.id, T, 'proximity');
        // LOCALITY SCALE
        if (!ph.startsWith('local ')) landV53(SVC53, 'navigational-local', 'local ' + ph + ' ' + pl, st.id, T, 'locality');
        landV53(SVC53, 'navigational-local', ph + ' in ' + pl, st.id, T, 'locality');
        landV53(SVC53, 'navigational-local', ph + ' in ' + stateName, st.id, T, 'locality');
        landV53(SVC53, 'navigational-local', ph + ' around ' + pl, st.id, T, 'locality');
        landV53(SVC53, 'navigational-local', 'regional ' + ph + ' ' + pl, st.id, T, 'locality');
        // RADIUS
        landV53(SVC53, 'navigational-local', ph + ' within ' + radius + ' miles of ' + pl, st.id, T, 'radius');
        landV53(SVC53, 'navigational-local', ph + ' serving the ' + pl + ' area', st.id, T, 'radius');
        // ZIP FORMS — the stub's geo-record postal code
        if (zip) {
          landV53(SVC53, 'navigational-local', ph + ' ' + zip, st.id, T, 'zip');
          landV53(SVC53, 'navigational-local', ph + ' near ' + zip, st.id, T, 'zip');
        }
        // RELATION WORDS
        landV53(SVC53, 'navigational-local', ph + ' serving ' + pq, st.id, T, 'relation');
        landV53(SVC53, 'navigational-local', ph + ' covering ' + pq, st.id, T, 'relation');
        landV53(SVC53, 'navigational-local', ph + ' available in ' + pl, st.id, T, 'relation');
        landV53(SVC53, 'navigational-local', ph + ' based in ' + pl, st.id, T, 'relation');
        // AI-QUESTION FORMS
        landV53(SVC53, 'ai-question', 'how do i arrange ' + base + ' in ' + pl + '?', st.id, T, 'ai-question');
        landV53(SVC53, 'ai-question', 'what does ' + base + ' include in ' + pl + '?', st.id, T, 'ai-question');
      }
    }
    try {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      fs.writeFileSync(path.join(WORK_DIR, 'r53-accounting.json'),
        JSON.stringify({ r53: R53_STATS }, null, 2) + '\n');
      fs.writeFileSync(path.join(WORK_DIR, 'r53-source-rows.jsonl'),
        R53_SOURCE_ROWS.map((r) => JSON.stringify(r)).join('\n') + '\n');
    } catch (e) { /* accounting is diagnostic; generation never fails on it */ }
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
  // ── GEO PASS (2026-11-21, Geo Batch) ─────────────────────────
  // The estate's 335 places live in data/geo-enriched.json — the
  // generator's canonical geo input: verified ZIP sets per place
  // (Census relationship files + screened recovery + owner
  // rulings; provenance rides every value), radius rings from
  // measured branch distances, nearest neighbors, binding branch
  // seats. The pass emits the place families the per-service lanes
  // under-reached — proximity, locality, radius, ZIP, relation,
  // ai-question, neighbor, route-pair — for every (service,
  // footprint place) cell, through the same emit() gates (R10
  // existence, R11 dedupe). First wins: rows the earlier lanes
  // already emitted stand. An r30Norm normalized-collision guard
  // keeps the pass from minting case/punctuation twins of live
  // rows. The ZIP family reads the record's zip_set ONLY — never
  // the geojson postal_code or the record's estate_postal_code
  // mirror (six record ZIPs were corrected in the 2026-11-21
  // screen; the mirrors still carry the old values by design).
  const GEO_STATS = { attempted: 0, landed: 0, normSkipped: 0, byFamily: {}, refused: [] };
  // GEO_BY_ID + geoZipSet come from the shared geo-record loader
  // at the top of generate() — the one loader every ZIP lane reads.
  const geoNormSeen = new Map();
  for (const r of rows) geoNormSeen.set(r.service_id + '|' + r30Norm(r.query_text), r.query_text);
  const geoTarget = (sid, area) => r30ModalSlug(sid, area) || HUB[sid];
  const geoEmit = (family, sid, cls, text, area, target) => {
    const st = (GEO_STATS.byFamily[family] = GEO_STATS.byFamily[family] || { attempted: 0, landed: 0 });
    st.attempted++; GEO_STATS.attempted++;
    const nk = sid + '|' + r30Norm(text);
    if (geoNormSeen.has(nk)) { GEO_STATS.normSkipped++; return; }
    if (emit(sid, cls, text, area, target, 'GEO-' + family, { source: 'geo-pass' })) {
      st.landed++; GEO_STATS.landed++; geoNormSeen.set(nk, text);
    }
  };
  const geoPl = (name) => String(name || '').replace(/, /, ' ');
  for (const svc of R.services.services) {
    const sid = svc.id;
    const [phrase] = PHRASE[sid];
    for (const f of footprint.get(sid) || []) {
      const rec = GEO_BY_ID.get(f.id);
      if (!rec) { GEO_STATS.refused.push('no enriched record for ' + f.id); continue; }
      const pl = geoPl(rec.name);
      const area = f.id;
      const target = geoTarget(sid, area);
      geoEmit('proximity', sid, 'navigational-local', phrase + ' near ' + pl, area, target);
      geoEmit('proximity', sid, 'navigational-local', phrase + ' close to ' + pl, area, target);
      geoEmit('locality', sid, 'navigational-local', 'local ' + phrase + ' ' + pl, area, target);
      geoEmit('locality', sid, 'navigational-local', phrase + ' in ' + pl, area, target);
      geoEmit('locality', sid, 'navigational-local', phrase + ' around ' + pl, area, target);
      geoEmit('locality', sid, 'navigational-local', 'regional ' + phrase + ' ' + pl, area, target);
      for (const r of (rec.radius && rec.radius.rings_mi) || []) {
        geoEmit('radius', sid, 'navigational-local', phrase + ' within ' + r + ' miles of ' + pl, area, target);
      }
      geoEmit('radius', sid, 'navigational-local', phrase + ' serving the ' + pl + ' area', area, target);
      for (const z of rec.zip_set || []) {
        geoEmit('zip', sid, 'navigational-local', phrase + ' ' + z.zip, area, target);
        geoEmit('zip', sid, 'navigational-local', phrase + ' near ' + z.zip, area, target);
        // The bare ZIP texts bind once per service estate-wide
        // (UNIQUE(query_text, service_id)) to the first place that
        // claims them — for a ZIP shared by several places (22663:
        // White Post, Parkins Mills, Stone Bridge) the other places
        // would carry no ZIP rows at all. The place-qualified form
        // binds per place, so every place carries rows for every
        // ZIP in its verified set (the batch proof gate).
        geoEmit('zip', sid, 'navigational-local', phrase + ' ' + pl + ' ' + z.zip, area, target);
      }
      geoEmit('relation', sid, 'navigational-local', phrase + ' serving ' + pl, area, target);
      geoEmit('relation', sid, 'navigational-local', phrase + ' available in ' + pl, area, target);
      geoEmit('relation', sid, 'navigational-local', phrase + ' based in ' + pl, area, target);
      geoEmit('ai-question', sid, 'ai-question', 'how do i arrange ' + phrase + ' in ' + pl + '?', area, target);
      geoEmit('ai-question', sid, 'ai-question', 'what does ' + phrase + ' include in ' + pl + '?', area, target);
      for (const n of (rec.neighbors_within_30mi || []).slice(0, 3)) {
        const npl = geoPl(n.name);
        geoEmit('neighbor', sid, 'navigational-local', phrase + ' near ' + npl, area, target);
        geoEmit('neighbor', sid, 'navigational-local', phrase + ' serving ' + pl + ' and ' + npl, area, target);
      }
      // Route pairs ride fully lowercase, per the R15 literal
      // precedent ('movers from winchester va to martinsburg wv').
      const bindSeat = rec.radius && rec.radius.binding_branch_seat;
      const partnerId = (f.id === 'place-winchester-va' || f.id === 'place-martinsburg-wv')
        ? (bindSeat === 'place-winchester-va' ? 'place-martinsburg-wv' : 'place-winchester-va')
        : bindSeat;
      const partner = partnerId && GEO_BY_ID.get(partnerId);
      if (partner) {
        const pnl = geoPl(partner.name).toLowerCase();
        const pll = pl.toLowerCase();
        geoEmit('route-pair', sid, 'navigational-local', phrase + ' from ' + pnl + ' to ' + pll, area, target);
        geoEmit('route-pair', sid, 'navigational-local', phrase + ' from ' + pll + ' to ' + pnl, area, target);
      }
    }
  }

  // ── DEPTH-BANK INGEST (2026-11-21, Geo Batch) ────────────────
  // External buyer-language bank (screened 2026-11-21: schema
  // exact, zero price/phone hits, zero internal duplicates, zero
  // collisions with the live rubric): 4,326 rows over 6 corridor
  // places — depth-0 buyer questions plus depth-1 follow-ups.
  // Rows ingest as QUESTIONS ONLY; answers are never taken from a
  // bank file — the answer-evidence layer binds estate fragments
  // mechanically. Leaf services map onto registry services in the
  // staged rows (registry_service_id). The R35 truth screen
  // applies on top of the ingest screen. Depth-1 parent links
  // resolve after the sort (below) into intent_row_lineage; an
  // unresolvable parent stops the build.
  const BANK_STATS = { read: 0, landed: 0, refused: [], normSkipped: 0, byService: {}, lineageResolved: 0, childNotLanded: 0 };
  const BANK_ROWS = [];
  const bankPath = path.join(ROOT, 'out', 'rubric-depth-bank-2026-11-21', 'staged-offered.jsonl');
  if (!fs.existsSync(bankPath)) throw new Error('depth-bank ingest: staged-offered.jsonl missing (Geo Batch 2026-11-21)');
  for (const line of fs.readFileSync(bankPath, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    BANK_ROWS.push(r); BANK_STATS.read++;
    const sid = r.registry_service_id;
    if (!svcById.has(sid)) { BANK_STATS.refused.push(r.id + ': unmapped service ' + sid); continue; }
    const bad = R35_TRUTH_REFUSE.find((t) => t.re.test(r.question));
    if (bad) { BANK_STATS.refused.push(r.id + ': ' + bad.why); continue; }
    const cls = r.family === 'ai-question' ? 'ai-question' : 'navigational-local';
    const nk = sid + '|' + r30Norm(r.question);
    if (geoNormSeen.has(nk)) { BANK_STATS.normSkipped++; continue; }
    if (emit(sid, cls, r.question, r.area, geoTarget(sid, r.area), 'DEPTHBANK-' + r.family, { source: 'depth-bank-2026-11-21' })) {
      BANK_STATS.landed++;
      BANK_STATS.byService[sid] = (BANK_STATS.byService[sid] || 0) + 1;
      geoNormSeen.set(nk, r.question);
    }
  }

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

  // Depth-bank lineage (Geo Batch 2026-11-21): resolve every
  // depth-1 row's parent link against the final row set. The
  // parent is the row carrying the parent bank row's question for
  // the same registry service — the bank's own depth-0 row when it
  // landed, or the live row it deduped onto. A landed child whose
  // parent does not resolve stops the build (BATCH-PLAN hard
  // requirement: 1,560/1,560 links resolve).
  const lineage = [];
  {
    const byNorm = new Map();
    for (const r of rows) {
      const k = r.service_id + '|' + r30Norm(r.query_text);
      if (!byNorm.has(k)) byNorm.set(k, r.row_no);
    }
    const bankById = new Map(BANK_ROWS.map((r) => [r.id, r]));
    for (const r of BANK_ROWS) {
      if (!r.parent_row) continue;
      const parent = bankById.get(r.parent_row);
      if (!parent) throw new Error('depth-bank lineage: bank row ' + r.id + ' names unknown parent ' + r.parent_row);
      const childNo = byNorm.get(r.registry_service_id + '|' + r30Norm(r.question));
      if (childNo === undefined) { BANK_STATS.childNotLanded++; continue; }
      const parentNo = byNorm.get(parent.registry_service_id + '|' + r30Norm(parent.question));
      if (parentNo === undefined) throw new Error('depth-bank lineage: parent of ' + r.id + ' (' + parent.id + ') does not resolve to a live row — batch stops');
      lineage.push({ row_no: childNo, parent_row_no: parentNo, bank_row_id: r.id, parent_bank_row_id: parent.id });
    }
    BANK_STATS.lineageResolved = lineage.length;
  }


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
  // Windowed emit (A5 install batch, 2026-11-22): both digests are
  // hashed by streaming per-row updates — byte-identical to hashing
  // canonicalRows(rows) / the outcome canonical string, without
  // materializing either whole-set string.
  const digest = canonicalDigest(rows);
  const outcomeDigest = outcomeCanonicalDigest(rows);
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
    evidenceStats, pageDerivedStats, rollupStats, targetCoverage, patternByService, evidenceLogCount, observationLinks, observationResolutions, bySource, outcomeGlobal, outcomeByService, existedInWindow, geoStats: GEO_STATS, bankStats: BANK_STATS, lineage };
}

// Canonical serialization for the rows digest: fixed field order,
// generated_at / generator version excluded (they are run metadata).
function canonicalDigest(rows) {
  const h = crypto.createHash('sha256');
  h.update('[');
  rows.forEach((r, i) => {
    if (i) h.update(',');
    h.update(JSON.stringify([
      r.query_text, r.intent_class, r.service_id, r.area, r.target_url, r.target_json,
      r.dataset_ids, r.graph_node, r.cert_target_json_sha256, r.cert_dataset_digests,
      r.gate_page_in_registry, r.gate_target_in_signed_index, r.gate_datasets_in_signed_index,
      r.source || 'generated', r.observation_ids || [],
    ]));
  });
  h.update(']');
  return h.digest('hex');
}
function outcomeCanonicalDigest(rows) {
  const h = crypto.createHash('sha256');
  h.update('[');
  rows.forEach((r, i) => {
    if (i) h.update(',');
    h.update(JSON.stringify([r.query_text, r.service_id,
      OUTCOME_GATES.map((g) => r.outcome[g + '_state']), r.outcome.highest_gate_passed, r.outcome.outcome_status]));
  });
  h.update(']');
  return h.digest('hex');
}
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
const _pubFileDigestCache = new Map();
function pubFileDigest(url) {
  // Memoized per process (2026-11-17, Geo Expansion): emit() calls this
  // per row (~290k calls over ~421 distinct files at the 335-place
  // bank); the uncached read+sha256 of the same files dominated the
  // build (~135s of ~287s profiled). Values are still computed from the
  // files' own bytes (the S2 rule) — PUB files never change during a
  // generator run (the generator writes only its work dir + rubric.db),
  // and each new process re-reads fresh.
  if (_pubFileDigestCache.has(url)) return _pubFileDigestCache.get(url);
  let digest = null;
  if (url && url.startsWith(SITE + '/')) {
    const rel = url.slice(SITE.length + 1);
    let p = path.join(PUB, rel);
    if (rel === '' || rel.endsWith('/')) p = path.join(p, 'index.html');
    try { digest = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); } catch (_) { digest = null; }
  }
  _pubFileDigestCache.set(url, digest);
  return digest;
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


// --- A4 coverage slices (Component A4 — changed-slice rebuilds) ---
// The coverage document's per-service aggregates (the values
// datasetAggregates() derives for buildDataset: per-service counts /
// per-class counts / source counts / enriched counts / first graph
// node, plus the per-service outcome rollup and the per-service area
// counts behind the totals node's rowsByArea) become per-service
// slices. A slice's fingerprint is the service's rows digest (a
// windowed hex-dump aggregate over the intent_query +
// intent_row_outcome tables just written by writeDb — the A5
// transport, windows of A4_COV_WIN rows, no row-set materialization)
// + the digests of the dataset files the service's coverage node
// cites (its hub per-page JSON + DATASETS[svc.id], read from live
// bytes via pubFileDigest) + this builder's own sha256. On a
// fingerprint match the cached aggregate values splice into the
// coverage document in place of a fresh aggregate pass; on any miss
// the values come from the classic datasetAggregates() pass (the
// fallback oracle) and the cache is rewritten. The assembled
// document is byte-identical either way: per-service values are the
// same values, and the totals node's area map is re-assembled in
// the classic first-occurrence order (each area's first row id is
// unique across services, so ordering the merged map by it
// reproduces the id-scan order exactly). The DB write path
// (writeDb .sql, the rows file, the intent parts) is untouched —
// slicing is emit-path-only, here in main(). A4_CLASSIC=1 restores
// the classic full aggregate pass verbatim.
const A4_CLASSIC = process.env.A4_CLASSIC === '1';
const A4_COV_CACHE_DIR = process.env.A4_COV_CACHE_DIR ||
  path.join(ROOT, 'out', 'seal-state', 'coverage-slices');
const A4_COV_CACHE_VERSION = 1;
const A4_COV_WIN = 5000;
let _a4BuilderSha = null;
function a4BuilderSha() {
  if (_a4BuilderSha === null) {
    _a4BuilderSha = crypto.createHash('sha256')
      .update(fs.readFileSync(__filename)).digest('hex');
  }
  return _a4BuilderSha;
}
// Windowed per-service digest over the two row tables, hashing the
// same canonical per-row serializations canonicalDigest() /
// outcomeCanonicalDigest() hash for the whole set, restricted to
// this service's rows in id order.
function a4ServiceRowsDigest(svcId) {
  const h = crypto.createHash('sha256');
  const svcLit = sqlEsc(svcId);
  h.update('rows[');
  let lastId = 0; let first = true;
  for (;;) {
    const rows = sqlHex(DB_PATH,
      'SELECT id, query_text, intent_class, service_id, area, target_url, target_json, dataset_ids, graph_node, cert_target_json_sha256, cert_dataset_digests, gate_page_in_registry, gate_target_in_signed_index, gate_datasets_in_signed_index, source, observation_ids FROM intent_query WHERE service_id = ' + svcLit + ' AND id > ' + lastId + ' ORDER BY id LIMIT ' + A4_COV_WIN + ';');
    if (rows === null) throw new Error('a4ServiceRowsDigest: window read fell back (null)');
    if (!rows.length) break;
    for (const r of rows) {
      if (!first) h.update(',');
      first = false;
      h.update(JSON.stringify([
        r.query_text, r.intent_class, r.service_id, r.area, r.target_url, r.target_json,
        JSON.parse(r.dataset_ids), r.graph_node, r.cert_target_json_sha256,
        JSON.parse(r.cert_dataset_digests),
        r.gate_page_in_registry, r.gate_target_in_signed_index, r.gate_datasets_in_signed_index,
        r.source || 'generated', JSON.parse(r.observation_ids || '[]'),
      ]));
      lastId = r.id;
    }
    if (rows.length < A4_COV_WIN) break;
  }
  h.update(']outcomes[');
  lastId = 0; first = true;
  const gateCols = OUTCOME_GATES.map((g) => g + '_state').join(', ');
  for (;;) {
    const rows = sqlHex(DB_PATH,
      'SELECT intent_query_id, query_text, service_id, ' + gateCols + ', highest_gate_passed, outcome_status FROM intent_row_outcome WHERE service_id = ' + svcLit + ' AND intent_query_id > ' + lastId + ' ORDER BY intent_query_id LIMIT ' + A4_COV_WIN + ';');
    if (rows === null) throw new Error('a4ServiceRowsDigest: outcome window read fell back (null)');
    if (!rows.length) break;
    for (const r of rows) {
      if (!first) h.update(',');
      first = false;
      h.update(JSON.stringify([r.query_text, r.service_id,
        OUTCOME_GATES.map((g) => r[g + '_state']), r.highest_gate_passed, r.outcome_status]));
      lastId = r.intent_query_id;
    }
    if (rows.length < A4_COV_WIN) break;
  }
  h.update(']');
  return h.digest('hex');
}
function a4CoverageFingerprint(svc, hubPage) {
  const h = crypto.createHash('sha256');
  h.update('a4-coverage-slice v' + A4_COV_CACHE_VERSION + '\n');
  h.update('service ' + svc.id + '\n');
  h.update('rows ' + a4ServiceRowsDigest(svc.id) + '\n');
  const cited = [];
  if (hubPage) cited.push(resolveJsonFile(hubPage));
  for (const f of (DATASETS[svc.id] || [])) cited.push(f);
  for (const f of cited) {
    h.update('cited ' + f + ' ' + (pubFileDigest(SITE + '/' + f) || 'MISSING') + '\n');
  }
  h.update('builder ' + a4BuilderSha() + '\n');
  h.update('generator ' + GENERATOR + ' v' + GENERATOR_VERSION + '\n');
  return h.digest('hex');
}
// Per-service area counts + each area's first row id within this
// service (windowed; only computed for slices being rebuilt).
function a4ServiceAreas(svcId) {
  const counts = {}; const first = {};
  let lastId = 0;
  for (;;) {
    const rows = sqlHex(DB_PATH,
      'SELECT id, area FROM intent_query WHERE service_id = ' + sqlEsc(svcId) + ' AND id > ' + lastId + ' ORDER BY id LIMIT ' + A4_COV_WIN + ';');
    if (rows === null) throw new Error('a4ServiceAreas: window read fell back (null)');
    if (!rows.length) break;
    for (const r of rows) {
      if (r.area) {
        counts[r.area] = (counts[r.area] || 0) + 1;
        if (first[r.area] === undefined) first[r.area] = r.id;
      }
      lastId = r.id;
    }
    if (rows.length < A4_COV_WIN) break;
  }
  return { counts, first };
}
function a4CovCachePath(svcId) {
  return path.join(A4_COV_CACHE_DIR, svcId + '.json');
}
function a4ReadCovCache(svcId, fp) {
  try {
    const c = JSON.parse(fs.readFileSync(a4CovCachePath(svcId), 'utf8'));
    if (c && c.version === A4_COV_CACHE_VERSION && c.fingerprint === fp) return c.values;
  } catch (_) { /* cold or stale cache: rebuild the slice */ }
  return null;
}
// Resolve every service's coverage-slice values: cache hits splice,
// misses rebuild from one classic datasetAggregates() pass (plus a
// per-service area pass for the missed slices only) and re-cache.
// Returns the dsAgg gen.dsAgg consumes + the spliced outcome map.
function coverageSlices(gen) {
  const R = gen.R;
  const perService = {}; const outcomeByService = {};
  const areaCount = {}; const areaFirst = {};
  let total = 0; let rebuilt = 0; let cached = 0;
  const pending = [];
  const hits = {};
  for (const svc of R.services.services) {
    const hubPage = R.pages.pages.find((p) => p.slug === HUB[svc.id]);
    const fp = a4CoverageFingerprint(svc, hubPage);
    const hit = a4ReadCovCache(svc.id, fp);
    if (hit) {
      cached++;
      hits[svc.id] = hit;
      perService[svc.id] = hit.agg;
      outcomeByService[svc.id] = hit.outcome;
    } else {
      pending.push({ svc, fp });
    }
  }
  if (pending.length) {
    const fresh = datasetAggregates();
    fs.mkdirSync(A4_COV_CACHE_DIR, { recursive: true });
    for (const { svc, fp } of pending) {
      rebuilt++;
      const values = {
        agg: fresh.perService[svc.id] ||
          { count: 0, perClass: {}, gscObserved: 0, enriched: 0, graphNode: null },
        outcome: gen.outcomeByService[svc.id],
        areas: a4ServiceAreas(svc.id),
      };
      fs.writeFileSync(a4CovCachePath(svc.id),
        JSON.stringify({ version: A4_COV_CACHE_VERSION, service: svc.id, fingerprint: fp, values }, null, 1) + '\n');
      perService[svc.id] = values.agg;
      outcomeByService[svc.id] = values.outcome;
      for (const [a, n] of Object.entries(values.areas.counts)) {
        areaCount[a] = (areaCount[a] || 0) + n;
        if (areaFirst[a] === undefined || values.areas.first[a] < areaFirst[a]) areaFirst[a] = values.areas.first[a];
      }
    }
    if (!cached) {
      // Cold run: the classic pass IS the aggregate source, byte
      // order included; the caches written above serve the next run.
      return { dsAgg: fresh, outcomeByService: gen.outcomeByService, rebuilt, cached };
    }
    // Partial run: totals/area map merge the fresh pass's values
    // for rebuilt slices with the cached slices' stored area maps.
    for (const [svcId, hit] of Object.entries(hits)) {
      for (const [a, n] of Object.entries(hit.areas.counts)) {
        areaCount[a] = (areaCount[a] || 0) + n;
        if (areaFirst[a] === undefined || hit.areas.first[a] < areaFirst[a]) areaFirst[a] = hit.areas.first[a];
      }
    }
  }
  for (const svc of R.services.services) {
    const sa = perService[svc.id];
    if (sa) total += sa.count;
  }
  const areaRows = {};
  for (const a of Object.keys(areaCount).sort((x, y) => areaFirst[x] - areaFirst[y])) {
    areaRows[a] = areaCount[a];
  }
  return { dsAgg: { total, perService, areaRows }, outcomeByService, rebuilt, cached };
}

// Windowed aggregates for buildDataset (A5 install batch,
// 2026-11-22): one pass over the intent_query table just written,
// in ORDER BY id windows of 25,000 rows through the hex transport.
// Produces exactly the per-service counts / per-class counts /
// source counts / enriched counts / first graph_node and the
// per-area row counts that buildDataset used to derive by
// filtering the in-memory row set, in the same first-occurrence
// key order (rows are scanned in id order = generation order).
function datasetAggregates() {
  const WIN = 25000;
  const perService = {};
  const areaRows = {};
  let total = 0;
  let lastId = 0;
  for (;;) {
    const rows = sqlHex(DB_PATH,
      'SELECT id, service_id, intent_class, area, graph_node, source, observation_ids FROM intent_query WHERE id > ' + lastId + ' ORDER BY id LIMIT ' + WIN + ';');
    if (rows === null) throw new Error('datasetAggregates: window read fell back (null)');
    if (!rows.length) break;
    for (const r of rows) {
      total++;
      let sa = perService[r.service_id];
      if (!sa) sa = perService[r.service_id] = { count: 0, perClass: {}, gscObserved: 0, enriched: 0, graphNode: r.graph_node };
      sa.count++;
      sa.perClass[r.intent_class] = (sa.perClass[r.intent_class] || 0) + 1;
      if (r.source === 'gsc-observed') sa.gscObserved++;
      else if ((JSON.parse(r.observation_ids || '[]')).length) sa.enriched++;
      if (r.area) areaRows[r.area] = (areaRows[r.area] || 0) + 1;
      lastId = r.id;
    }
    if (rows.length < WIN) break;
  }
  return { total, perService, areaRows };
}

function buildDataset(gen) {
  const { R, excluded, byClass, byService, digest } = gen;
  const agg = gen.dsAgg;
  const total = agg.total;
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
    const sa = agg.perService[svc.id] || { count: 0, perClass: {}, gscObserved: 0, enriched: 0, graphNode: null };
    const perClass = sa.perClass;
    const node = baseNode(
      SITE + '/#intent-coverage-' + suffix, 'Dataset',
      'Intent Coverage — ' + svc.name,
      'Generated intent coverage for ' + svc.name + ': ' + sa.count + ' query rows, each resolving to the page that answers it, that page\u2019s per-page JSON and the backing dataset file(s) named in this node\u2019s distribution, with the certificate digests of those files read from the signed AI master index. The service\u2019s entity-graph node is ' + sa.graphNode + '.',
      [svc.name.toLowerCase() + ' questions', PHRASE[svc.id][0]],
      [{ '@id': sa.graphNode }]);
    node.url = hubPage.url;
    node.distribution = [
      { '@type': 'DataDownload', contentUrl: SITE + '/datasets-intent-coverage.json', encodingFormat: 'application/json' },
      { '@type': 'DataDownload', contentUrl: SITE + '/' + resolveJsonFile(hubPage), encodingFormat: 'application/json' },
      ...DATASETS[svc.id].map((f) => ({ '@type': 'DataDownload', contentUrl: SITE + '/' + f, encodingFormat: 'application/json' })),
    ];
    node.graphNode = sa.graphNode;
    node.queryRows = sa.count;
    node.queryRowsByIntentClass = perClass;
    const svcObs = sa.gscObserved;
    node.queryRowsBySource = { generated: sa.count - svcObs, gscObserved: svcObs };
    node.generatedRowsEnrichedByGsc = sa.enriched;
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
    const areaRows = agg.areaRows;
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
  // URL-form DOI identifier (https://doi.org/10.5281/zenodo.23879048)
  // on the four collection nodes (scope, taxonomy, resolution, totals)
  // — the checker-held concept-DOI holders inside this file — and the
  // landing URL on the per-service coverage nodes. The D1 operations
  // node is Service-typed (the rubric's operations face): it gains
  // sameAs + identifier pointing at the landing page. The row set is
  // untouched by this block.
  const LANDING = SITE + '/datasets/intent-coverage/';
  const DOI_URL = 'https://doi.org/10.5281/zenodo.23879048';
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
const { execFileSync, spawnSync } = require('child_process');
function sqlEsc(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
}
function writeDb(gen, workDir) {
  const { rows, excluded, digest } = gen;
  // Windowed emit (A5 install batch, 2026-11-22): statements stream
  // through emit() in bounded 8192-statement chunks. The previous
  // form materialized every statement (~1M strings at 518,217 rows)
  // in a lines array that stayed resident beside the row set; the
  // .sql bytes written are identical either way (each chunk is its
  // lines joined by '\n' plus a trailing '\n', in order).
  const sqlPath = path.join(workDir, 'intent-rubric.sql');
  const sqlFd = fs.openSync(sqlPath, 'w');
  let sqlBuf = [];
  const emit = (stmt) => {
    sqlBuf.push(stmt);
    if (sqlBuf.length >= 8192) { fs.writeSync(sqlFd, sqlBuf.join('\n') + '\n'); sqlBuf = []; }
  };
  emit('DROP TABLE IF EXISTS intent_query;');
  emit('DROP TABLE IF EXISTS intent_meta;');
  emit('DROP TABLE IF EXISTS intent_row_outcome;');
  emit('DROP TABLE IF EXISTS gsc_observation_links;');
  // 2026-11-02 (Ports P2): the evidence projection is dropped and rebuilt
  // like the other derived tables — with INSERT OR IGNORE over a persisting
  // table, era/window corrections from eraForWindow would never land.
  emit('DROP TABLE IF EXISTS intent_row_gsc_evidence;');
  emit('DROP TABLE IF EXISTS intent_row_lineage;');
  emit(`CREATE TABLE intent_row_lineage (
  row_no INTEGER PRIMARY KEY,
  parent_row_no INTEGER NOT NULL,
  bank_row_id TEXT NOT NULL,
  parent_bank_row_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'depth-bank-2026-11-21'
);`);
  emit(`CREATE TABLE intent_query (
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
  emit('CREATE INDEX idx_intent_service ON intent_query(service_id);');
  emit('CREATE INDEX idx_intent_class ON intent_query(intent_class);');
  emit('CREATE INDEX idx_intent_source ON intent_query(source);');
  const gateCols = OUTCOME_GATES.map((g) =>
    `  ${g}_state TEXT NOT NULL DEFAULT 'unknown',\n  ${g}_checked_at TEXT,\n  ${g}_evidence_source TEXT`).join(',\n');
  emit(`CREATE TABLE intent_row_outcome (
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
  emit('CREATE INDEX idx_outcome_service ON intent_row_outcome(service_id);');
  emit(`CREATE TABLE IF NOT EXISTS intent_outcome_evidence (
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
  emit(`CREATE TABLE IF NOT EXISTS gsc_observation_links (
  observation_id INTEGER NOT NULL,
  service_id TEXT NOT NULL,
  query_text TEXT NOT NULL,
  link_type TEXT NOT NULL,
  exclusion_reason TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY(observation_id, service_id, query_text, link_type)
);`);
  emit('CREATE TABLE intent_meta (key TEXT PRIMARY KEY, value TEXT);');
  emit('BEGIN TRANSACTION;');
  for (const r of rows) {
    emit('INSERT INTO intent_query (id, query_text, intent_class, service_id, area, target_url, target_json, dataset_ids, graph_node, cert_target_json_sha256, cert_dataset_digests, gate_page_in_registry, gate_target_in_signed_index, gate_datasets_in_signed_index, generated_at, generator_version, source, observation_ids) VALUES (' +
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
    emit(`INSERT INTO intent_row_outcome (intent_query_id, query_text, service_id, ${OUTCOME_GATES.map((g) => `${g}_state, ${g}_checked_at, ${g}_evidence_source`).join(', ')}, highest_gate_passed, outcome_status, outcome_basis, updated_at) VALUES (${vals.join(', ')});`);
  }
  for (const l of gen.observationLinks || []) {
    emit('INSERT OR IGNORE INTO gsc_observation_links (observation_id, service_id, query_text, link_type, exclusion_reason, created_at) VALUES (' +
      [l.observation_id, sqlEsc(l.service_id), sqlEsc(l.query_text), sqlEsc(l.link_type), sqlEsc(l.exclusion_reason || null), sqlEsc(RUBRIC_DATE)].join(', ') + ');');
  }
  for (const l of gen.lineage || []) {
    emit('INSERT INTO intent_row_lineage (row_no, parent_row_no, bank_row_id, parent_bank_row_id) VALUES (' +
      [l.row_no, l.parent_row_no, sqlEsc(l.bank_row_id), sqlEsc(l.parent_bank_row_id)].join(', ') + ');');
  }
  emit(`CREATE TABLE IF NOT EXISTS intent_row_gsc_evidence (
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
        emit('INSERT OR IGNORE INTO intent_row_gsc_evidence (query_text, service_id, observation_id, clicks, impressions, ctr, avg_position, window_start, window_end, era, basis, attached_at) VALUES (' +
          [sqlEsc(r.query_text), sqlEsc(r.service_id), oid, o.clicks || 0, o.impressions || 0, o.ctr || 0, o.avg_position || 0,
           sqlEsc(o.window_start || null), sqlEsc(o.window_end || null), sqlEsc(eraForWindow(o.window_start, o.window_end)),
           sqlEsc('query-text match; target page present in the export Pages aggregate (existed in window) and live in the current registry; metrics are historical evidence, era-tagged ' + eraForWindow(o.window_start, o.window_end) + ' from the import window against the 2026-10-29 rebuild cutover'),
           sqlEsc(RUBRIC_DATE)].join(', ') + ');');
      }
    }
  }
  for (const res of gen.observationResolutions || []) {
    emit(`UPDATE gsc_observed_queries SET resolution_status = ${sqlEsc(res.status)}, resolution_reason = ${sqlEsc(res.reason || null)}, resolved_service_id = ${sqlEsc(res.service_id || null)}, resolved_target_url = ${sqlEsc(res.target_url || null)} WHERE id = ${res.id};`);
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
    emit('INSERT INTO intent_meta (key, value) VALUES (' + sqlEsc(k) + ', ' + sqlEsc(v) + ');');
  }
  emit('COMMIT;');
  if (sqlBuf.length) { fs.writeSync(sqlFd, sqlBuf.join('\n') + '\n'); sqlBuf = []; }
  fs.closeSync(sqlFd);
  const fdIn = fs.openSync(sqlPath, 'r');
  const load = spawnSync('sqlite3', [DB_PATH], { stdio: [fdIn, 'pipe', 'pipe'] });
  fs.closeSync(fdIn);
  if (load.status !== 0) {
    throw new Error('sqlite3 load of intent-rubric.sql failed: ' + (load.stderr || '').toString());
  }
  return sqlPath;
}

function checkAgainstDb(gen) {
  // maxBuffer 512 MB (raised 2026-11-17, Geo Expansion; was 256 MB
  // from 2026-11-16, Money Trio-5): the full-table
  // -json dump crossed the old 64 MB buffer at 74,096 rows (68,218,044
  // bytes) and --check died ENOBUFS — the seal read the unreadable
  // check as "one generation behind" and failed the phase-1 fixpoint
  // on a healthy bank. The buffer must stay ahead of bank growth.
  // A5 hex transport (2026-11-22): this 518k-row read's -json dump
  // also sat one growth step from V8's max string length; sqlHex
  // returns the same row objects the -json parse returned.
  const dbRows = sqlHex(DB_PATH,
    'SELECT query_text, intent_class, service_id, area, target_url, target_json, dataset_ids, graph_node, cert_target_json_sha256, cert_dataset_digests, gate_page_in_registry, gate_target_in_signed_index, gate_datasets_in_signed_index, source, observation_ids FROM intent_query ORDER BY id;').map((r) => ({
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
  const meta = {};
  for (const m of sqlHex(DB_PATH, 'SELECT key, value FROM intent_meta;')) meta[m.key] = m.value;
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
  // Intent row parts (Geo Batch 2026-11-21): the API bundle no
  // longer embeds the packed intent columns — at ~500k rows the
  // packed block alone breaches the 60 MiB bundle gate. The packer
  // reads the DB just written and emits the columns as sealed
  // dataset part files (datasets-intent-rows*.json, AE-part shape)
  // in the public tree; the worker fetches them through the
  // datasetRemote path at runtime. Deterministic: unchanged rows
  // re-emit byte-identical parts.
  {
    const pk = spawnSync('python3', [path.join(ROOT, 'scripts', 'pack-intent-parts.py'),
      '--db', DB_PATH, '--out-dir', PUB, '--rubric-date', RUBRIC_DATE], { stdio: 'inherit' });
    if (pk.status !== 0) throw new Error('pack-intent-parts.py failed with status ' + pk.status);
  }
  const rowsPath = path.join(workDir, 'intent-rows.json');
  { // stream the rows file (2026-11-17): one JSON.stringify of 289k rows
    // spiked ~1 GB and OOM'd the seal's phase-1 build; per-row writes are
    // byte-identical to JSON.stringify(rows, null, 1) + '\n' (proven).
    const fd = fs.openSync(rowsPath, 'w');
    if (!gen.rows.length) { fs.writeSync(fd, '[]\n'); }
    else {
      fs.writeSync(fd, '[');
      gen.rows.forEach((r, i) => {
        const s = JSON.stringify(r, null, 1).split('\n').map(l => ' ' + l).join('\n');
        fs.writeSync(fd, (i ? ',\n' : '\n') + s);
      });
      fs.writeSync(fd, '\n]\n');
    }
    fs.closeSync(fd);
  }
  // Windowed emit (A5 install batch, 2026-11-22): the row set has
  // been fully consumed (DB written, parts packed, rows file
  // streamed). Compute the dataset aggregates by window reads over
  // the table just written, then release the rows before building
  // the dataset document — the emit's peak no longer stacks the
  // whole row set under the dataset build.
  const rowTotal = gen.rows.length;
  gen.rows = null;
  if (A4_CLASSIC) {
    // Classic path (A4 opt-out): the full windowed aggregate pass,
    // exactly as before A4.
    gen.dsAgg = datasetAggregates();
  } else {
    // A4 sliced path: per-service coverage slices splice cached
    // aggregate values into the coverage document; only services
    // whose slice fingerprint moved are rebuilt.
    const cov = coverageSlices(gen);
    gen.dsAgg = cov.dsAgg;
    gen.outcomeByService = cov.outcomeByService;
    console.error('A4-COVERAGE-SLICES: cached=' + cov.cached +
      ' rebuilt=' + cov.rebuilt +
      ' (A4_CLASSIC=1 restores the classic aggregate pass)');
  }
  const dataset = buildDataset(gen);
  const datasetPath = path.join(workDir, 'datasets-intent-coverage.json');
  fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2) + '\n');
  const summary = {
    generator: GENERATOR + ' v' + GENERATOR_VERSION,
    generated_at: RUBRIC_DATE,
    rows: rowTotal,
    bySource: gen.bySource,
    evidence: gen.evidenceStats,
    pageDerived: gen.pageDerivedStats,
    rollup: gen.rollupStats,
    geoPass: gen.geoStats,
    depthBank: gen.bankStats,
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
