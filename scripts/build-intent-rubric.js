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
const PUB = path.resolve(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const DB_PATH = path.join(FLAT, 'rubric.db');
const QB_PATH = path.join(FLAT, 'blog-project', '04-question-bank.md');
const RUBRIC_DATE = '2026-10-30';
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
const GENERATOR_VERSION = '1.3.2';
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

// --- Registry loading + validation ---
function loadAll() {
  const services = load('data/services.json');
  const pages = load('data/pages.json');
  const locations = load('data/locations.json');
  const corridors = load('data/corridors.json');
  const geo = load('data/service-area.geojson');
  const best = load('data/best-json-entity-graph.json');
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

  function emit(serviceId, intentClass, queryText, area, targetSlug, pattern) {
    const svc = svcById.get(serviceId);
    const key = serviceId + '|' + queryText;
    if (seen.has(key)) { excluded.push({ reason: 'duplicate', serviceId, queryText, pattern }); return; }
    const page = V.pageBySlug.get(targetSlug);
    if (!page) { excluded.push({ reason: 'target-not-in-pages.json', serviceId, queryText, pattern }); return; }
    const jf = jsonFileFor(targetSlug);
    if (!fs.existsSync(path.join(PUB, jf))) { excluded.push({ reason: 'per-page-json-missing', serviceId, queryText, pattern }); return; }
    const targetJsonUrl = SITE + '/' + jf;
    const tjEntry = distByUrl.get(targetJsonUrl);
    if (!tjEntry || !tjEntry.digest) { excluded.push({ reason: 'target-json-not-in-signed-index', serviceId, queryText, pattern }); return; }
    const dsDigests = {};
    for (const f of DATASETS[serviceId]) {
      const e = distByUrl.get(SITE + '/' + f);
      if (!e || !e.digest) { excluded.push({ reason: 'dataset-not-in-signed-index', serviceId, queryText, pattern, file: f }); return; }
      dsDigests[f] = e.digest.value;
    }
    const gn = graphNode(R, svc);
    if (!gn) { excluded.push({ reason: 'graph-node-missing', serviceId, queryText, pattern }); return; }
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
    });
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

  // Canonical order: service, class order, query text.
  rows.sort((a, b) =>
    (a.service_id < b.service_id ? -1 : a.service_id > b.service_id ? 1 : 0) ||
    (CLASS_ORDER.indexOf(a.intent_class) - CLASS_ORDER.indexOf(b.intent_class)) ||
    (a.query_text < b.query_text ? -1 : a.query_text > b.query_text ? 1 : 0));
  rows.forEach((r, i) => { r.row_no = i + 1; });

  const byClass = {}; const byService = {};
  for (const r of rows) {
    byClass[r.intent_class] = (byClass[r.intent_class] || 0) + 1;
    byService[r.service_id] = (byService[r.service_id] || 0) + 1;
  }
  const canonical = canonicalRows(rows);
  const digest = crypto.createHash('sha256').update(canonical).digest('hex');
  return { R, rows, excluded, byClass, byService, digest, qbParsed, qbTotal: qb.length, footprint, corridorServices };
}

// Canonical serialization for the rows digest: fixed field order,
// generated_at / generator version excluded (they are run metadata).
function canonicalRows(rows) {
  return JSON.stringify(rows.map((r) => [
    r.query_text, r.intent_class, r.service_id, r.area, r.target_url, r.target_json,
    r.dataset_ids, r.graph_node, r.cert_target_json_sha256, r.cert_dataset_digests,
    r.gate_page_in_registry, r.gate_target_in_signed_index, r.gate_datasets_in_signed_index,
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
      { '@type': 'DataDownload', contentUrl: SITE + '/' + jsonFileFor(HUB[svc.id]), encodingFormat: 'application/json' },
      ...DATASETS[svc.id].map((f) => ({ '@type': 'DataDownload', contentUrl: SITE + '/' + f, encodingFormat: 'application/json' })),
    ];
    node.graphNode = svcRows[0].graph_node;
    node.queryRows = svcRows.length;
    node.queryRowsByIntentClass = perClass;
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
    'How each rubric row resolves its target, and the gates a row must pass to exist. Default target: the service\u2019s hub page. A place or scoped row for a Winchester area targets the service\u2019s Winchester branch page when the estate has one (Martinsburg likewise); a shared area and the Shenandoah Valley scope target the hub. A corridor row targets the corridor\u2019s own page when that page belongs to the service\u2019s page set, else the hub. A question-bank row targets the hub, unless the question\u2019s own slug is a page of that service, which is then the target. The per-page JSON filename is the page slug with slashes replaced by dashes, at the site root. The graph node is the service\u2019s canonical #service-* @id in the best entity graph when present, else the Service node on the hub page, else the Service node carrying the service\u2019s registry name. Gates, all required: the target page is in pages.json; the per-page JSON file exists in the deployed site tree; the target JSON and every backing dataset file are distributions in the signed master index. In this generation ' + excluded.length + ' candidate rows failed a gate or deduplication and were excluded (' + exclText + ') — excluded rows are dropped, never pointed at a fallback page.',
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
  UNIQUE(query_text, service_id)
);`);
  lines.push('CREATE INDEX idx_intent_service ON intent_query(service_id);');
  lines.push('CREATE INDEX idx_intent_class ON intent_query(intent_class);');
  lines.push('CREATE TABLE intent_meta (key TEXT PRIMARY KEY, value TEXT);');
  lines.push('BEGIN TRANSACTION;');
  for (const r of rows) {
    lines.push('INSERT INTO intent_query (id, query_text, intent_class, service_id, area, target_url, target_json, dataset_ids, graph_node, cert_target_json_sha256, cert_dataset_digests, gate_page_in_registry, gate_target_in_signed_index, gate_datasets_in_signed_index, generated_at, generator_version) VALUES (' +
      [r.row_no, sqlEsc(r.query_text), sqlEsc(r.intent_class), sqlEsc(r.service_id), sqlEsc(r.area),
       sqlEsc(r.target_url), sqlEsc(r.target_json), sqlEsc(JSON.stringify(r.dataset_ids)), sqlEsc(r.graph_node),
       sqlEsc(r.cert_target_json_sha256), sqlEsc(JSON.stringify(r.cert_dataset_digests)),
       r.gate_page_in_registry, r.gate_target_in_signed_index, r.gate_datasets_in_signed_index,
       sqlEsc(RUBRIC_DATE), sqlEsc(GENERATOR_VERSION)].join(', ') + ');');
  }
  const meta = {
    rows_digest: digest,
    row_count: String(rows.length),
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
    'SELECT query_text, intent_class, service_id, area, target_url, target_json, dataset_ids, graph_node, cert_target_json_sha256, cert_dataset_digests, gate_page_in_registry, gate_target_in_signed_index, gate_datasets_in_signed_index FROM intent_query ORDER BY id;']).toString();
  const dbRows = JSON.parse(out || '[]').map((r) => ({
    query_text: r.query_text, intent_class: r.intent_class, service_id: r.service_id, area: r.area,
    target_url: r.target_url, target_json: r.target_json,
    dataset_ids: JSON.parse(r.dataset_ids), graph_node: r.graph_node,
    cert_target_json_sha256: r.cert_target_json_sha256,
    cert_dataset_digests: JSON.parse(r.cert_dataset_digests),
    gate_page_in_registry: r.gate_page_in_registry,
    gate_target_in_signed_index: r.gate_target_in_signed_index,
    gate_datasets_in_signed_index: r.gate_datasets_in_signed_index,
  }));
  const dbCanonical = canonicalRows(dbRows);
  const dbDigest = crypto.createHash('sha256').update(dbCanonical).digest('hex');
  const metaOut = execFileSync('sqlite3', ['-json', DB_PATH, 'SELECT key, value FROM intent_meta;']).toString();
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
  const workDir = path.resolve(ROOT, 'out', 'batch-intent-rubric', 'work');
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
