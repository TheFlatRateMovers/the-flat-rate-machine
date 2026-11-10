#!/usr/bin/env node
/* build-coverage.js — Territory Matrix builder (PRODUCTION, P4 live batch 2026-11-09).
 *
 * Reads ONE source (service-area.geojson) + the 34-service registry + the
 * production alias map (data/coverage-alias-map.json), and emits the
 * Territory Matrix into the Pages public tree:
 *   datasets-coverage.json            — the coverage dataset file (summary
 *                                       Dataset node + 81 typed Place nodes
 *                                       + county/state/country scaffolding)
 *   datasets/coverage/features-table.json
 *   datasets/coverage/coverage-table.json  (feature x service, reconciled)
 *   datasets/coverage/pairs-table.json     (haversine, labeled computed-centroid)
 *   datasets/coverage/national-table.json  (national layer, 2026-11-09: the
 *                                       company's performed-work record at
 *                                       state level — 49 State nodes, every
 *                                       state except Hawaii — generated from
 *                                       data/national-scope.json; state rows
 *                                       are the work record, NEVER merged
 *                                       into branch areaServed)
 *   dataset-coverage.json             — the /datasets/coverage/ landing jf
 *                                       (summary node shared @id; org + branch
 *                                       nodes copied from the ports jf at
 *                                       build time; WebPage + breadcrumb)
 *
 * Copies are produced by this builder inside the seal (phase 0.5), never
 * hand-edited downstream. Place @ids are root form (BASE/#place-…),
 * matching the geojson feature ids and the rubric area field. Branch
 * entities are referenced, never redefined. Dates: datePublished is
 * lineage (2026-11-09, first publication); dateModified consumes
 * FB3_STAMPS when the seal passes it.
 *
 * Usage: node build-coverage.js [--date <YYYY-MM-DD>]
 * Exit code 0 only when the full test battery passes.
 */
'use strict';
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const BASE = 'https://theflatratemovers.com';
const MACHINE = path.resolve(__dirname, '..');
const PUB = process.env.PAGES_PUBLIC || path.join(MACHINE, '..', 'the-flat-rate-movers-pages', 'public');
const { CATALOG } = require('./lib-constants.js');

function arg(name, fallback) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
const GEO_PATH = arg('geojson', path.join(MACHINE, 'data', 'service-area.geojson'));
const SERVICES_PATH = arg('services', path.join(MACHINE, 'data', 'services.json'));
const ALIAS_PATH = arg('alias-map', path.join(MACHINE, 'data', 'coverage-alias-map.json'));
const NATIONAL_PATH = arg('national', path.join(MACHINE, 'data', 'national-scope.json'));
const BATCH_DATE = arg('date', '2026-11-09');
// FB-3 stamps (seal phase 0.5): dateModified for the dataset file and the
// landing page come from the seal's stamps map when present.
let FILE_DM = BATCH_DATE, PAGE_DM = BATCH_DATE;
try {
  const stamps = JSON.parse(fs.readFileSync(process.env.FB3_STAMPS || '', 'utf8'));
  FILE_DM = (stamps.files || {})[BASE + '/datasets-coverage.json'] || FILE_DM;
  const ps = (stamps.pages || {})[BASE + '/datasets/coverage/'];
  if (ps) PAGE_DM = (typeof ps === 'object' ? ps.dm : ps) || PAGE_DM;
} catch (e) { /* standalone run: batch date stands */ }

const geo = JSON.parse(fs.readFileSync(GEO_PATH, 'utf8'));
const feats = geo.features;
const regDoc = JSON.parse(fs.readFileSync(SERVICES_PATH, 'utf8'));
const registry = Array.isArray(regDoc) ? regDoc : regDoc.services;
const regIds = new Set(registry.map(s => s.id || s['@id'] || s.slug));
const aliasDoc = JSON.parse(fs.readFileSync(ALIAS_PATH, 'utf8'));
const aliases = aliasDoc.aliases || {};
const nationalDoc = JSON.parse(fs.readFileSync(NATIONAL_PATH, 'utf8'));
const nationalStates = nationalDoc.states || [];

const TYPE_MAP = {
  city: 'City', branch: 'Place', county: 'AdministrativeArea',
  region: 'AdministrativeArea', corridor: 'Place', 'landmark-port': 'Place',
};
const STATE_NAMES = { VA: 'Virginia', WV: 'West Virginia', MD: 'Maryland', PA: 'Pennsylvania', DC: 'District of Columbia' };
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------- features + typed Place nodes ----------
const features = [];
const nodes = [];
const countyNodes = new Map(); // containment-only scaffolding (geography, not coverage)
const stateNodes = new Map();

for (const f of feats) {
  const p = f.properties, g = f.geometry;
  const [lon, lat] = g.coordinates;
  features.push({
    feature_id: p.id, name: p.name, kind: p.type, state: p.state || null,
    county: p.county || null, postal_code: p.postal_code || null, branch: p.branch,
    lat, lon, rubric_score: p.rubric_score ?? null,
    gbp_service_area: p.gbp_service_area ?? null,
    verified: p.verified || null, source: p.source || null,
    services_count: (p.services || []).length,
  });

  const chain = [];
  if (p.county && p.type !== 'county') {
    const cname = p.county.split('/')[0].trim();
    const cid = 'place-county-' + slugify(cname + ' ' + (p.state || ''));
    if (!countyNodes.has(cid)) {
      countyNodes.set(cid, {
        '@type': 'AdministrativeArea', '@id': `${BASE}/#${cid}`,
        name: cname + (/(County|City)$/.test(cname) ? '' : ' County'),
        additionalProperty: [{ '@type': 'PropertyValue', name: 'matrixRole',
          value: 'containment-only (geography scaffolding, not a coverage claim)' }],
      });
    }
    chain.push({ '@id': `${BASE}/#${cid}` });
  }
  if (p.state && STATE_NAMES[p.state]) {
    const sid = 'place-state-' + p.state.toLowerCase();
    if (!stateNodes.has(sid)) {
      stateNodes.set(sid, { '@type': 'State', '@id': `${BASE}/#${sid}`, name: STATE_NAMES[p.state],
        containedInPlace: { '@id': `${BASE}/#place-country-us` } });
    }
    chain.push({ '@id': `${BASE}/#${sid}` });
  }
  if (chain.length === 0 || p.state) {
    // every chain terminates at the country node (appended to the graph below)
    if (!chain.some(r => r['@id'] === `${BASE}/#place-state-${(p.state || '').toLowerCase()}`) && !p.state) {
      chain.push({ '@id': `${BASE}/#place-country-us` });
    }
  }

  nodes.push({
    '@type': TYPE_MAP[p.type] || 'Place',
    '@id': `${BASE}/#${p.id}`,
    name: p.name,
    geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lon },
    containedInPlace: chain,
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'branchBinding', value: p.branch },
      { '@type': 'PropertyValue', name: 'featureKind', value: p.type },
    ],
  });
}
// ---------- national layer (state-level performed-work record) ----------
// One State node per state in data/national-scope.json (49 — every state
// except Hawaii). Footprint states reuse the chain nodes built above (same
// @ids); the rest are minted here in the same form. State nodes are the
// company's work record at state level: they carry NO branch binding and
// are never referenced by branch areaServed. Enrichment (mail-scan tiers,
// cities, dates, counts) rides as additionalProperty PropertyValue entries
// on the node and as fields on the national table rows — one source file,
// both surfaces generated, nothing hand-carried.
for (const s of nationalStates) {
  const sid = 'place-state-' + s.abbr.toLowerCase();
  if (!stateNodes.has(sid)) {
    stateNodes.set(sid, { '@type': 'State', '@id': `${BASE}/#${sid}`, name: s.state,
      containedInPlace: { '@id': `${BASE}/#place-country-us` } });
  }
  const node = stateNodes.get(sid);
  const ap = [
    { '@type': 'PropertyValue', name: 'matrixRole',
      value: 'national-layer — state in the company performed-work record (not a branch service area)' },
  ];
  const e = s.evidence;
  if (e) {
    ap.push({ '@type': 'PropertyValue', name: 'workRecordTier', value: e.tier });
    if (e.jobs !== null && e.jobs !== undefined)
      ap.push({ '@type': 'PropertyValue', name: 'workRecordJobs', value: e.jobs });
    if (Array.isArray(e.cities) && e.cities.length)
      ap.push({ '@type': 'PropertyValue', name: 'workRecordCities', value: JSON.stringify(e.cities) });
    if (e.first) ap.push({ '@type': 'PropertyValue', name: 'workRecordFirstDate', value: e.first });
    if (e.last) ap.push({ '@type': 'PropertyValue', name: 'workRecordLastDate', value: e.last });
  }
  node.additionalProperty = ap;
}
const national = nationalStates.map((s) => ({
  state: s.state,
  state_abbr: s.abbr,
  node_id: `${BASE}/#place-state-${s.abbr.toLowerCase()}`,
  coverage_basis: 'performed work — national work record (not a branch service area)',
  evidence_tier: s.evidence ? s.evidence.tier : null,
  evidenced_jobs: s.evidence ? s.evidence.jobs : null,
  cities: s.evidence ? s.evidence.cities : [],
  first_date: s.evidence ? s.evidence.first : null,
  last_date: s.evidence ? s.evidence.last : null,
}));

const countryNode = { '@type': 'Country', '@id': `${BASE}/#place-country-us`, name: 'United States' };
// state chains already reference the country; feature chains that end at a state
// resolve through the state node. Feature chains without a state point at country directly.

// ---------- coverage table (registry-reconciled, zero orphans) ----------
const coverage = [];
const unresolved = [];
for (const f of feats) {
  const p = f.properties;
  for (const label of p.services || []) {
    let registryId = null, mappingClass = null;
    if (regIds.has('service-' + label)) { registryId = 'service-' + label; mappingClass = 'direct'; }
    else if (aliases[label] && regIds.has(aliases[label].registry)) {
      registryId = aliases[label].registry; mappingClass = aliases[label].class;
    }
    if (!registryId) unresolved.push({ feature_id: p.id, label });
    coverage.push({
      feature_id: p.id, service_geojson_label: label,
      service_registry_id: registryId, mapping_class: mappingClass,
      branch: p.branch,
    });
  }
}

// ---------- pairs table (haversine, labeled) ----------
const hav = (a, b) => {
  const R = 3958.8, rad = Math.PI / 180;
  const la1 = a.lat * rad, la2 = b.lat * rad;
  const h = Math.sin((la2 - la1) / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
};
const pairs = [];
for (const a of features) for (const b of features) {
  if (a.feature_id === b.feature_id) continue;
  pairs.push({
    from: a.feature_id, to: b.feature_id, distance_miles: hav(a, b),
    distance_basis: 'computed-centroid',
    same_branch: a.branch === b.branch || a.branch === 'both' || b.branch === 'both',
  });
}

// ---------- distribution digests (estate form: self carries no sha256;
// every other download carries contentSize + sha256 of the file as written)
const ser = (o) => JSON.stringify(o, null, 1) + '\n';
const covStr = ser(coverage), pairsStr = ser(pairs), featStr = ser(features), natStr = ser(national);
const geoBytes = fs.readFileSync(path.join(PUB, 'service-area.geojson'));
const shaOf = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const dlFull = (name, url, buf) => ({ '@type': 'DataDownload', name, contentUrl: url, encodingFormat: 'application/json', contentSize: Buffer.byteLength(buf), sha256: shaOf(buf) });
// spatialCoverage in the estate form: the two full branch Place objects,
// copied from the ports dataset's summary node at build time.
const portsFileDoc = JSON.parse(fs.readFileSync(path.join(PUB, 'datasets-ports.json'), 'utf8'));
const portsSummaryNode = portsFileDoc['@graph'].find(n => n['@type'] === 'Dataset');
const branchSpatial = portsSummaryNode.spatialCoverage;

// ---------- production dataset file ----------
const catalog = CATALOG;
const landing = `${BASE}/datasets/coverage/`;
const datasetNode = {
  '@type': 'Dataset',
  '@id': `${landing}#dataset`,
  name: 'Territory Matrix — Service Coverage by Place',
  description:
    'The Flat Rate Movers service-coverage matrix: every place in the company footprint as a typed ' +
    'schema.org Place node with coordinates and branch binding (Winchester VA and Martinsburg WV), ' +
    'the full feature-by-service coverage table reconciled to the 34-service registry, and the ' +
    'place-to-place distance table (centroid distances, computed and labeled as computed; road miles ' +
    'only where separately researched). A national layer records the company performed-work record at ' +
    'state level: State nodes for the 49 states where the company has moved clients and performed job ' +
    'work — every state except Hawaii — published as the national table, kept separate from the branch ' +
    'footprint (state rows are the work record, not branch service areas). Generated from ' +
    'service-area.geojson and data/national-scope.json by build-coverage.js.',
  url: landing, identifier: landing, isAccessibleForFree: true,
  datePublished: BATCH_DATE, dateModified: FILE_DM,
  license: 'https://creativecommons.org/licenses/by/4.0/',
  sameAs: landing,
  creator: { '@type': 'Organization', '@id': `${BASE}/#organization`, name: 'The Flat Rate Movers LLC', url: BASE + '/' },
  publisher: { '@type': 'Organization', '@id': `${BASE}/#organization`, name: 'The Flat Rate Movers LLC', url: BASE + '/' },
  about: [
    // The services this dataset actually binds to places: the distinct
    // registry ids present in the coverage cells, in registry order.
    // (service-sir-heavy carries no per-place labels in the geojson —
    // the SIR/KIM-GS protocol is engaged estate-wide by job, so it is
    // not listed here; the table never invents a binding.)
    ...registry.filter(r => coverage.some(c => c.service_registry_id === r.id))
      .map(r => ({ '@id': `${BASE}/#${r.id}` })),
    { '@id': `${BASE}/#winchester` }, { '@id': `${BASE}/#martinsburg` },
  ],
  keywords: 'service coverage, territory matrix, places, branch binding, Winchester VA, Martinsburg WV, Shenandoah Valley, Eastern Panhandle, I-81, I-66, I-70, coverage matrix, place-to-place distance, The Flat Rate Movers',
  includedInDataCatalog: catalog,
  spatialCoverage: branchSpatial,
  distribution: [
    { '@type': 'DataDownload', name: 'datasets-coverage.json — this file', contentUrl: `${BASE}/datasets-coverage.json`, encodingFormat: 'application/json' },
    dlFull('Coverage table (feature x service)', `${landing}coverage-table.json`, covStr),
    dlFull('Place pairs distance table', `${landing}pairs-table.json`, pairsStr),
    dlFull('Features table', `${landing}features-table.json`, featStr),
    dlFull('National work record table (state level)', `${landing}national-table.json`, natStr),
    dlFull('Service-area GeoJSON (the source map)', `${BASE}/service-area.geojson`, geoBytes),
  ],
};
const datasetFile = {
  '@context': 'https://schema.org',
  '@graph': [datasetNode, ...nodes, ...countyNodes.values(), ...stateNodes.values(), countryNode],
};

// ---------- landing jf (dataset-coverage.json) ----------
// Org + branch Place nodes are copied from the ports landing jf at build
// time (generator-produced copies; never hand-maintained here).
const portsJf = JSON.parse(fs.readFileSync(path.join(PUB, 'dataset-ports.json'), 'utf8'));
const portsGraph = portsJf['@graph'] || [portsJf];
const pickNode = (id) => portsGraph.find(n => n['@id'] === id);
const orgNode = pickNode(`${BASE}/#organization`);
const winNode = pickNode(`${BASE}/#winchester`);
const martNode = pickNode(`${BASE}/#martinsburg`);
if (!orgNode || !winNode || !martNode) { console.error('FAIL jf source nodes missing from dataset-ports.json'); process.exit(1); }
const webPageNode = {
  '@type': 'WebPage', '@id': landing, url: landing,
  name: 'Territory Matrix — Service Coverage by Place | The Flat Rate Movers',
  breadcrumb: { '@id': `${landing}#breadcrumb` },
  datePublished: BATCH_DATE, dateModified: PAGE_DM,
};
const crumbNode = {
  '@type': 'BreadcrumbList', '@id': `${landing}#breadcrumb`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Datasets', item: `${BASE}/datasets/` },
    { '@type': 'ListItem', position: 3, name: 'Territory Matrix — Coverage', item: landing },
  ],
};
const jfFile = { '@context': 'https://schema.org', '@graph': [datasetNode, orgNode, winNode, martNode, webPageNode, crumbNode] };

// ---------- write production outputs ----------
fs.mkdirSync(path.join(PUB, 'datasets', 'coverage'), { recursive: true });
const wTo = (p, obj) => fs.writeFileSync(p, JSON.stringify(obj, null, 1) + '\n');
fs.writeFileSync(path.join(PUB, 'datasets', 'coverage', 'features-table.json'), featStr);
fs.writeFileSync(path.join(PUB, 'datasets', 'coverage', 'coverage-table.json'), covStr);
fs.writeFileSync(path.join(PUB, 'datasets', 'coverage', 'pairs-table.json'), pairsStr);
fs.writeFileSync(path.join(PUB, 'datasets', 'coverage', 'national-table.json'), natStr);
wTo(path.join(PUB, 'datasets-coverage.json'), datasetFile);
wTo(path.join(PUB, 'dataset-coverage.json'), jfFile);

// ---------- test battery (P1 tests, updated for the TM-1 binding) ----------
const tests = [];
const T = (name, pass) => tests.push([name, !!pass]);
T('T1 features in == features out (81)', features.length === 81 && feats.length === 81);
T('T2 typed nodes == features (81)', nodes.length === 81);
T('T3 every node carries GeoCoordinates', nodes.every(n => n.geo && n.geo['@type'] === 'GeoCoordinates'));
T('T4 coverage cells == sum of feature services lists',
  coverage.length === feats.reduce((s, f) => s + (f.properties.services || []).length, 0));
T('T5 pairs == 81*80 = 6480', pairs.length === 6480);
T('T6 every pair distance labeled computed-centroid', pairs.every(p => p.distance_basis === 'computed-centroid'));
const definedIds = new Set(datasetFile['@graph'].map(n => n['@id']));
T('T7 GS-4: every containedInPlace ref resolves to a defined node',
  nodes.every(n => n.containedInPlace.every(r => definedIds.has(r['@id']))) &&
  [...stateNodes.values()].every(n => definedIds.has(n.containedInPlace['@id'])));
T('T8 branch split post-TM-1: Winchester 54 / Martinsburg 48 / both 21 (33 W-only, 27 M-only)',
  features.filter(x => x.branch === 'winchester' || x.branch === 'both').length === 54 &&
  features.filter(x => x.branch === 'martinsburg' || x.branch === 'both').length === 48 &&
  features.filter(x => x.branch === 'both').length === 21);
T('T9 GS-3: zero unresolved coverage cells (registry + alias map reconcile all)',
  unresolved.length === 0 && coverage.every(c => c.service_registry_id && regIds.has(c.service_registry_id)));
T('T10 registry is 34 services', registry.length === 34);
T('T11 every feature has exactly one typed node (id set == feature set)',
  new Set(nodes.map(n => n['@id'])).size === 81 &&
  features.every(f => definedIds.has(`${BASE}/#${f.feature_id}`)));
T('T12 GS-1 shape: no Dataset/DataDownload id appears in any node seat other than the dataset node itself',
  nodes.every(n => !JSON.stringify(n).includes('#dataset')));
T('T13 dataset summary description within 50..5000 chars',
  datasetNode.description.length >= 50 && datasetNode.description.length <= 5000);
T('T14 national layer: exactly 49 state rows, Hawaii absent',
  national.length === 49 && nationalStates.length === 49 &&
  !national.some(r => r.state_abbr === 'HI') &&
  !nationalStates.some(s => s.abbr === 'HI'));
T('T15 national layer: one State node per national state in the graph (49), DC scaffolding untouched',
  national.every(r => { const n = stateNodes.get('place-state-' + r.state_abbr.toLowerCase());
    return n && n['@type'] === 'State' && n['@id'] === r.node_id; }) &&
  stateNodes.size === 50 && stateNodes.has('place-state-dc'));
T('T16 national layer: no state node carries a branch binding; national rows add no coverage cells',
  national.every(r => { const n = stateNodes.get('place-state-' + r.state_abbr.toLowerCase());
    const ap = n.additionalProperty || [];
    return !ap.some(p => p.name === 'branchBinding'); }) &&
  coverage.every(c => regIds.has(c.service_registry_id)));
T('T17 national layer: table rows re-project exactly from data/national-scope.json (no orphan detail)',
  national.every((r, i) => { const s = nationalStates[i], e = s.evidence;
    return r.state === s.state && r.state_abbr === s.abbr &&
      r.evidence_tier === (e ? e.tier : null) &&
      r.evidenced_jobs === (e ? e.jobs : null) &&
      JSON.stringify(r.cities) === JSON.stringify(e ? e.cities : []) &&
      r.first_date === (e ? e.first : null) && r.last_date === (e ? e.last : null); }));

let ok = true;
for (const [name, pass] of tests) { console.log((pass ? 'PASS' : 'FAIL'), name); ok = ok && pass; }
const byClass = {};
for (const c of coverage) byClass[c.mapping_class] = (byClass[c.mapping_class] || 0) + 1;
console.log(`features: ${features.length} | nodes: ${nodes.length} | county scaffolding: ${countyNodes.size} | states: ${stateNodes.size}`);
console.log(`coverage cells: ${coverage.length} by class:`, byClass);
console.log(`pairs: ${pairs.length} | unresolved cells: ${unresolved.length}`);
console.log(`national layer: ${national.length} states (${national.filter(r => r.evidence_tier).length} with mail/case enrichment)`);
console.log('catalog object: lib-constants CATALOG');
console.log('BUILD-COVERAGE:', ok ? 'ALL TESTS PASS' : 'FAILURES PRESENT');
process.exit(ok ? 0 : 1);
