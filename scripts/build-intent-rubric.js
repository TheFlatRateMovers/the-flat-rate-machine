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
// the SHA-256 certificate digests of the target JSON and datasets read
// from the signed ai-master-index.json at generation time, so every row
// inherits the estate's provenance seal (kid theflatratemovers-2026-10-29-1).
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
//      index (their digests are copied into the row); the service has
//      a Service node in best-json-entity-graph.json. Rows that fail
//      any gate are EXCLUDED and counted with reasons — never pointed
//      at a fallback page.
//   R11 Dedupe on (query_text, service_id); first pattern wins in the
//      fixed class order below.
//
// The signed index is read from the deployed public/ tree. Row-target
// files (per-page JSONs, dataset files) are not edited by the rubric
// batch, so their digests stay valid when the index is re-sealed with
// the new dataset added; the build asserts that invariant at seal time.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { SITE, fail, load } = require('./lib');

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
// and era='pre-rebuild'. Unattached queries remain evidence only.
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
const GENERATOR_VERSION = '2.0.0';
const KID = 'theflatratemovers-2026-10-29-1';

// --- Generator configuration (validated against the registries) ---
// Hub page slug per service: the service's canonical hub in the estate
// (the page its datasets lead with / its graph Service node anchors to).
const HUB = {
  'service-residential': 'residential-moving',
  'service-commercial': 'commercial-moving',
  'service-local-regional': 'local-regional-moving',
  'service-long-distance': 'long-distance-cross-country-moving',
  'service-packing': 'packing-unpacking-services-2',
  'service-sir-heavy': 'heavy',
  'service-gun-safe': 'gun-safe-movers',
  'service-piano-antique': 'elite-asset-transition-white-glove-discreet-logistics',
  'service-ispm15': 'export',
  'service-crating': 'international-export-packing-crating-winchester-va',
  'service-transloading': 'container-deconsolidation-cross-docking-transloading-services-virginia',
  'service-final-mile': 'commercial-freight-handling-white-glove-final-mile-services',
  'service-office-moving': 'commercial-office-moving-2',
  'service-industrial-offices': 'industrial-offices-moving',
  'service-government': 'military-government-moving',
  'service-military': 'military-government-moving',
  'service-route81': 'route81',
  'service-industrial-commercial': 'industrial-commercial-services',
  'service-senior-moving': 'senior-moving',
  'service-warehouse-relocation': 'warehouse-relocation',
  'service-it-relocation': 'it-equipment-moving-data-center-logistics-services-virginia',
  'service-transloading-winchester-va': 'transloading-winchester-va',
  'service-moving-and-storage': 'moving-and-storage',
  'service-junk-removal': 'junk-removal',
  'service-warehouse-racking-relocation': 'warehouse-racking-relocation',
  'service-ffe-logistics': 'ffe-logistics',
  'service-data-center-relocation': 'data-center-relocation',
  'service-medical-lab-relocation': 'medical-lab-equipment-relocation',
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
  'service-warehouse-racking-relocation': ['warehouse racking relocation', false],
  'service-ffe-logistics': ['FF&E logistics', false],
  'service-data-center-relocation': ['data center movers', true],
  'service-medical-lab-relocation': ['medical equipment movers', true],
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
  'service-gun-safe': ['datasets-gun-safe.json'],
  'service-piano-antique': ['datasets-piano-antique.json'],
  'service-ispm15': ['datasets-ispm15.json'],
  'service-crating': ['datasets-crating.json'],
  'service-transloading': ['datasets-transloading.json', 'datasets-transloading-inland-port.json', 'datasets-ocean-container.json'],
  'service-final-mile': ['datasets-final-mile.json'],
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
  'service-warehouse-racking-relocation': ['datasets-warehouse-racking-relocation.json'],
  'service-ffe-logistics': ['datasets-ffe-logistics.json'],
  'service-data-center-relocation': ['datasets-data-center-relocation.json'],
  'service-medical-lab-relocation': ['datasets-medical-lab-relocation.json'],
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
};
// Services with no GeoJSON capability mapping: branch bases only (R1).
// Value: which branch bases ('both' or 'winchester').
const BASE_ONLY = {
  'service-sir-heavy': 'both',
  'service-gun-safe': 'both',
  'service-piano-antique': 'both',
  'service-long-distance': 'both',
  'service-local-regional': 'both',
  'service-route81': 'both',
  'service-senior-moving': 'both',
  'service-warehouse-relocation': 'both',
  'service-it-relocation': 'both',
  'service-moving-and-storage': 'both',
  'service-junk-removal': 'both',
  'service-warehouse-racking-relocation': 'both',
  'service-ffe-logistics': 'both',
  'service-data-center-relocation': 'both',
  'service-medical-lab-relocation': 'both',
  'service-transloading-winchester-va': 'winchester',
};
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
// by slug in the run summary — never silently skipped.
const ROLLUP_SETS = {
  // "freight, transloading, data and corridor logistics ... I-81, I-66,
  // I-70 network" (the page's own head description).
  'category/logistics': ['service-transloading', 'service-final-mile', 'service-industrial-commercial', 'service-warehouse-relocation', 'service-long-distance', 'service-route81'],
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
  'datasets/intent-coverage', 'faq', 'moving-questions-answers',
  'quote', 'online-estimate', 'flat-rate-moving-quote-winchester',
  'flat-rate-guarantee', 'areas-served', 'service-areas-moving-company',
  'find-us', 'moving-cost-guide-winchester-va', 'developer', 'entities',
  'entity-authority-layer', 'knowledge-entities', 'knowledge-equipment',
  'knowledge-events', 'knowledge-locations', 'knowledge-services',
  'logistics-data-engineering-center', 'recursive-indexing-layer',
  'the-flat-rate-logistics-data-hub', 'ai-license', 'docs',
  'docs/logistics-event-protocol', 'docs/logistics-ontology',
  'author/ratemoversgmail-com', 'privacy-policy',
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
  'service-transloading': [null, 'transloading-movers-martinsburg-wv'],
  'service-final-mile': ['white-glove-delivery-winchester-va', 'final-mile-movers-martinsburg-wv'],
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
  'service-warehouse-racking-relocation': [null, null],
  'service-ffe-logistics': [null, null],
  'service-data-center-relocation': [null, null],
  'service-medical-lab-relocation': [null, null],
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
// present, distribution in the signed index, digest copied from the
// index) apply unchanged to whichever file resolves; a page whose
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
    const dsDigests = {};
    for (const f of DATASETS[serviceId]) {
      const e = distByUrl.get(SITE + '/' + f);
      if (!e || !e.digest) { excluded.push({ reason: 'dataset-not-in-signed-index', serviceId, queryText, pattern, file: f }); return false; }
      dsDigests[f] = e.digest.value;
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
      cert_target_json_sha256: tjEntry.digest.value,
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
      }
    }
    // R5/R6/R7 scoped patterns.
    for (const sc of SCOPES) {
      const t = scopeTarget(sc.branch);
      emit(id, 'cost', 'how much ' + (plural ? 'do' : 'does') + ' ' + phrase + ' cost in ' + sc.label, sc.id, t, 'R5-cost-howmuch');
      emit(id, 'cost', phrase + ' cost in ' + sc.label, sc.id, t, 'R5-cost-noun');
      emit(id, 'how-process', 'how to hire ' + phrase + ' in ' + sc.label, sc.id, t, 'R6-how-hire');
      emit(id, 'best-choice', 'best ' + phrase + ' in ' + sc.label, sc.id, t, 'R7-best');
      emit(id, 'best-choice', 'top rated ' + phrase + ' in ' + sc.label, sc.id, t, 'R7-top-rated');
    }
    emit(id, 'how-process', 'how to book ' + phrase, null, hub, 'R6-how-book');
    emit(id, 'ai-question', 'what should I ask before hiring ' + phrase, null, hub, 'R8-generated');
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

  // R12' (v2, owner correction 2026-10-31): the GSC export is a
  // HISTORICAL EVIDENCE OVERLAY, never a row source. Attach an
  // observed query's metrics to an existing row only on an exact
  // normalized text match AND only when the row's target page is
  // present in the export's Pages aggregate (proof the page existed
  // in the window) and still live in the current registry. Every
  // attachment is era-tagged 'pre-rebuild' with its window. Pages in
  // the export that no longer resolve are counted as stale; queries
  // with no matching row stay unattached evidence — they create
  // nothing and exclude nothing.
  const evidenceStats = { queriesImported: 0, queriesAttached: 0, rowsEnriched: 0, queriesUnattached: 0, pagesImported: 0, pagesStillLive: 0, pagesStale: 0, windowStart: null, windowEnd: null, era: 'pre-rebuild' };
  const observationLinks = [];
  const observationResolutions = [];
  const existedInWindow = new Set();
  {
    const observed = loadObservedQueries();
    const observedPages = loadObservedPages();
    evidenceStats.queriesImported = observed.length;
    evidenceStats.pagesImported = observedPages.length;
    if (observed.length) {
      evidenceStats.windowStart = observed[0].window_start || null;
      evidenceStats.windowEnd = observed[0].window_end || null;
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
  return { R, rows, excluded, byClass, byService, digest, outcomeDigest, qbParsed, qbTotal: qb.length, footprint, corridorServices,
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
    'https://www.instagram.com/theflatratemovers/',
    'https://www.threads.com/@theflatratemovers',
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

function baseNode(id, type, name, description, keywords, about) {
  return {
    '@id': id, '@type': type, name, description, keywords,
    about, spatialCoverage: SPATIAL, temporalCoverage: '2010/2026',
    dateModified: RUBRIC_DATE, creator: CREATOR, license: LICENSE,
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
    'The live intent-coverage rubric of The Flat Rate Movers: ' + total + ' generated rows, each one a query string a customer or an AI assistant can use to find a company service, resolved to the exact page that answers it, that page\u2019s per-page JSON, the dataset files behind the answer, and the service\u2019s node in the entity graph. Rows are generated from the estate\u2019s own registries — ' + R.services.services.length + ' services, ' + R.pages.pages.length + ' pages, two branch locations, three corridors and the 53-feature service-area footprint — plus the blog question bank\u2019s 100 real question phrasings, and the rubric is regenerated whenever those registries change. Every row carries the SHA-256 certificate digests of its target JSON and datasets, read from the signed AI master index, so the rubric inherits the estate\u2019s provenance seal. Coverage spans all ' + R.services.services.length + ' services of both branches, Winchester, VA and Martinsburg, WV, along the I-81, I-66 and I-70 corridors. Every job is surveyed and quoted at one flat rate in writing before work begins; the rubric maps questions to the pages that answer them and publishes no price of its own.',
    ['search intent coverage', 'query rubric', 'movers near me', 'gun safe movers winchester va', 'transloading winchester va', 'questions customers ask movers'],
    [{ '@id': SITE + '/#service-catalog' }]);
  d1.hasPart = coverageNodes.map((n) => ({ '@id': n['@id'] }));
  d1.certificate = CERT_BLOCK;

  const d2 = baseNode(
    SITE + '/#dataset-intent-coverage-scope', 'Dataset',
    'The Flat Rate Movers — Intent Coverage Scope Dataset',
    'What the intent-coverage rubric covers, and from what sources. Inputs: the machine registries services.json (' + R.services.services.length + ' services), pages.json (' + R.pages.pages.length + ' pages), locations.json (the two distinct branches — Winchester, The Flat Rate Movers, and Martinsburg, Flat Rate Movers Martinsburg WV, never blended), corridors.json (Interstate 81, Interstate 66, Interstate 70) and service-area.geojson (' + areaCov.features + ' features: Winchester footprint ' + areaCov.winchesterFootprint + ' areas, Martinsburg footprint ' + areaCov.martinsburgFootprint + ' areas, ' + areaCov.shared + ' areas shared); the signed AI master index (certificate digests); and the blog question bank (10 categories of the top-10 questions customers actually ask, 100 phrasings). Output: one row per generated query string across five intent classes — ' + classList + '. Rows exist only where the estate has a real page that answers the string; the scope of the rubric is exactly the scope of the published estate, nothing wider.',
    ['coverage scope', 'service registry', '53 service areas', 'question bank'],
    [{ '@id': SITE + '/#service-catalog' }]);

  const d3 = baseNode(
    SITE + '/#dataset-intent-coverage-taxonomy', 'Dataset',
    'The Flat Rate Movers — Intent Taxonomy and Pattern Rules Dataset',
    'The five intent classes of the rubric and the generation pattern of each. navigational-local: the service phrase with a place ("{phrase} {area}" for every area in the service\u2019s real footprint), the bare phrase, "{phrase} near me", and corridor forms "{phrase} I-81 / I-66 / I-70" for corridor-applicable services. cost: "how much do/does {phrase} cost in {scope}" and "{phrase} cost in {scope}" for the scopes Winchester, VA, Martinsburg, WV and the Shenandoah Valley. how-process: "how to hire {phrase} in {scope}" per scope and "how to book {phrase}". best-choice: "best {phrase} in {scope}" and "top rated {phrase} in {scope}" per scope. ai-question: the question bank\u2019s full natural-language phrasings, mapped to their service, plus "what should I ask before hiring {phrase}" per service. Pattern rules are fixed and bounded: place patterns use the service\u2019s own footprint only, never a blind cross-product of every service with every area.',
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
    'Where the query strings come from. The ai-question rows are the phrasings of the company\u2019s blog question bank (compiled 2026-10-30 from live searches of what people ask about pianos and antiques, ISPM 15 export packing, custom crating, final-mile delivery, industrial offices, government moves, military moves, the I-81 / I-66 / I-70 corridors, transloading and workforce services, and packing), carried verbatim apart from American-spelling normalization. The pattern families — service-plus-place, near-me, cost, how-to-hire, best and top-rated forms — are the standard shapes customers use to search for a mover or a logistics service, instantiated only with this company\u2019s real services, real footprint areas and real corridors. No query string in the rubric names a service, area, certification, price or capability the estate does not publish.',
    ['question bank', 'query sources', 'customer questions'],
    [{ '@id': SITE + '/#dataset-intent-coverage-operations' }]);

  d6.description += ' Version 2 separates the rubric\u2019s sources from its evidence. Every row is generated from the live estate itself \u2014 the registries, the pages and what each page is for (rule R13 page-derived rows join the v1 pattern families). Real Google Search Console queries enter only as a historical evidence overlay: the available export covers the pre-rebuild era (2026-07-29 to 2026-10-28), so its metrics attach, era-tagged pre-rebuild, only to rows whose target page existed in that window and is still live at the same URL. Current-era pages carry no borrowed metrics and no zero-filled values; their rows stand as awaiting observation until the new era produces evidence of its own. The deploy generation adds rule R14: hub, category and estate pages that carry no service of their own gain bounded roll-up rows derived from the services they group, so every published page is a rubric target, and the totals node carries the per-area row counts for the whole 53-feature footprint, zero counts included.';

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
    ['coverage totals', 'rows digest', 'certificate', '53 areas'],
    [{ '@id': SITE + '/#dataset-intent-coverage-operations' }]);
  d8.intentRowsDigest = digest;
  d8.intentRowsDigestAlgorithm = 'SHA-256';
  d8.rowSources = { estateGenerated: gen.bySource.generated, pageDerived: gen.pageDerivedStats.rowsEmitted, gscObservedRows: 0 };
  d8.gscEvidence = {
    era: gen.evidenceStats.era,
    window: [gen.evidenceStats.windowStart, gen.evidenceStats.windowEnd],
    basis: 'Historical Google Search Console Performance export, pre-rebuild era. Metrics attach only to rows whose target page existed in the window (present in the export Pages aggregate) and is still live at the same URL; attachments are evidence, never current performance. Pages of the current era carry no metrics and no zero-filled values.',
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
  // PropertyValue on the four collection nodes (scope, taxonomy,
  // resolution, totals), the landing URL on the per-service coverage
  // nodes. The D1 operations node is Service-typed (the rubric's
  // operations face): it gains sameAs + identifier pointing at the
  // landing page. The row set is untouched by this block.
  const LANDING = SITE + '/datasets/intent-coverage/';
  const DOI_PV = { '@type': 'PropertyValue', propertyID: 'DOI', value: '10.5281/zenodo.23818766', url: 'https://doi.org/10.5281/zenodo.23818766' };
  const COLLECTION_IDS = ['#dataset-intent-coverage-scope', '#dataset-intent-coverage-taxonomy', '#dataset-intent-coverage-resolution', '#dataset-intent-coverage-totals'];
  const graph = [d1, d2, d3, d4, d5, d6, d7, d8, ...coverageNodes];
  for (const n of graph) {
    if (n['@type'] === 'Dataset') {
      n.url = LANDING;
      n.sameAs = LANDING;
      n.identifier = COLLECTION_IDS.some((s) => n['@id'].endsWith(s)) ? DOI_PV : LANDING;
      n.isAccessibleForFree = true;
    }
  }
  d1.sameAs = LANDING;
  d1.identifier = LANDING;

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
  era TEXT NOT NULL DEFAULT 'pre-rebuild',
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
           sqlEsc(o.window_start || null), sqlEsc(o.window_end || null), sqlEsc('pre-rebuild'),
           sqlEsc('query-text match; target page present in the export Pages aggregate (existed in window) and live in the current registry; metrics are historical, pre-rebuild era'),
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
    rowsDigest: gen.digest,
    datasetNodes: dataset['@graph'].length,
    sql: sqlPath, dataset: datasetPath, rowsFile: rowsPath,
  };
  fs.writeFileSync(path.join(workDir, 'generation-summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
}
if (require.main === module) main();
module.exports = { generate, buildDataset, canonicalRows };
