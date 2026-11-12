#!/usr/bin/env node
/*
 * build-white-glove.js — premiere upgrade generator (2026-11-05), v2
 * expansion (2026-11-05, owner's confirmed scope + case register,
 * ~/workspace/user/files/white_glove_cases.json, plus the owner's
 * "we do all" ruling the same day).
 * Builds datasets-white-glove.json at the current machine standard:
 * the October D1-D8 nodes preserved, @ids re-keyed to the landing-URL
 * form, the operations Service upgraded (serviceType / url /
 * areaServed / serviceFacts / process / completedJob), and four nodes
 * generated from data/white-glove-research.json: a research Dataset
 * (sourced claims, personas and buyer-intent terms as data rows), a
 * sources Article, a service-levels Service (the four delivery tiers
 * as data), and a trust-ledger Dataset (the machine-readable trust
 * layer: longevity, clientele classes, repeat-account evidence,
 * documentation standard, value classes, signed provenance).
 * Company scope per the owner 2026-11-05: receiving + inspection
 * report + storage hold, install-day delivery, FULL assembly,
 * appliance hookups, haul-away, any stairs, carrier-terminal pickup,
 * three-stage photo documentation, every level bookable alone,
 * quoted per job; own crews in the home territory, a vetted partner
 * beyond it. The two brand accounts are NEVER named. Fail-loud.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const FILE = path.join(PUB, 'datasets-white-glove.json');
const LANDING = 'https://theflatratemovers.com/datasets/white-glove/';
const OLD = 'https://theflatratemovers.com/#dataset-white-glove-';
const NEW = LANDING + '#dataset-white-glove-';
const fail = (m) => { throw new Error('build-white-glove: ' + m); };

const store = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'white-glove-research.json'), 'utf8'));
if ((store.claims || []).length !== 13) fail('claims must be 13, got ' + (store.claims || []).length);
if ((store.personas || []).length !== 10) fail('personas must be 10, got ' + (store.personas || []).length);
if ((store.buyerIntentTerms || []).length !== 50) fail('terms must be 50, got ' + (store.buyerIntentTerms || []).length);
if ((store.serviceLevels || []).length !== 4) fail('serviceLevels must be 4, got ' + (store.serviceLevels || []).length);
if ((store.process || []).length !== 8) fail('process must be 8, got ' + (store.process || []).length);
if ((store.cases || []).length !== 2) fail('cases must be 2, got ' + (store.cases || []).length);
if (!store.trustLedger || !store.trustLedger.founded) fail('trustLedger missing');
for (const c of store.claims) if (!c.source || !c.fact || !c.headline) fail('claim missing fields: ' + c.id);
for (const lv of store.serviceLevels) if (lv.bookableAlone !== true) fail('level not bookable alone: ' + lv.level);
const wgLevel = store.serviceLevels.find((l) => l.level === 'White glove');
if (!/full assembly/.test(wgLevel.assembly || '')) fail('white-glove level must carry full assembly');

const doc = JSON.parse(fs.readFileSync(FILE, 'utf8'));
// Idempotent: drop the generated nodes and rebuild from the 8 base nodes.
const GENERATED_SUFFIXES = ['dataset-white-glove-research', 'dataset-white-glove-sources', 'dataset-white-glove-service-levels', 'dataset-white-glove-trust-ledger', 'dataset-white-glove-process'];
const graph = doc['@graph'].filter((n) => !GENERATED_SUFFIXES.some((s) => (n['@id'] || '').endsWith(s)));
if (graph.length !== 8) fail('expected the 8 existing nodes as the base, got ' + graph.length);
const byId = (suffix) => graph.find((n) => (n['@id'] || '').endsWith(suffix));
const template = byId('sizes-access') || byId('delivery-levels');
if (!template) fail('template node missing');
const termsArticle = byId('dataset-white-glove-terms');

// 1. re-key every @id and every string that carries the old prefix
const rekey = (o) => {
  if (Array.isArray(o)) return o.map(rekey);
  if (o && typeof o === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(o)) out[k] = rekey(v);
    return out;
  }
  if (typeof o === 'string' && o.startsWith(OLD)) return NEW + o.slice(OLD.length);
  return o;
};
const nodes = graph.map(rekey);

// Schema-carrier normalization (validator reconciliation, 2026-11-05): every
// sub-object carries a @type, and extension data rides schema.org carriers
// (additionalProperty / hasPart / audience / mentions / offers) instead of
// unrecognized property names — proven zero-error against validator.schema.org.
const ap = (name, value) => ({ '@type': 'PropertyValue', name, value });
for (const n of nodes) {
  if (Array.isArray(n.distribution)) n.distribution = n.distribution.map((e) => (e && typeof e === 'object' && !e['@type']) ? { '@type': 'DataDownload', ...e } : e);
}
const mapClaim = (c) => ({
  '@type': 'Claim', identifier: c.id, name: c.headline, description: c.fact,
  citation: { '@type': 'CreativeWork', name: c.source.title, url: c.source.url, publisher: { '@type': 'Organization', name: c.source.publisher } },
  additionalProperty: [ap('detail', c.detail), ap('scope', c.scope)],
});
const mapPersona = (p) => ({
  '@type': 'Audience', identifier: p.id, name: p.name,
  additionalProperty: [ap('need', p.need), ap('situation', p.situation)],
});
const mapTerm = (t) => ({
  '@type': 'DefinedTerm', name: t.term, url: 'https://theflatratemovers.com' + t.target,
  additionalProperty: [ap('intentClass', t.intentClass)],
});

// 2. operations Service upgrade — confirmed scope (owner, 2026-11-05)
const ops = nodes.find((n) => n['@id'] === NEW + 'operations');
if (!ops) fail('operations node missing after re-key');
ops.serviceType = 'White-glove delivery — receiving and inspection, storage hold, install-day delivery, room-of-choice placement, unpacking, full assembly, appliance hookups, haul-away, debris removal';
ops.url = 'https://theflatratemovers.com/white-glove-delivery/';
ops.areaServed = [
  { '@id': 'https://theflatratemovers.com/#place-winchester-va' },
  { '@id': 'https://theflatratemovers.com/#place-martinsburg-wv' },
];
delete ops.serviceFacts;
delete ops.process;
delete ops.completedJob; // rebuilt below as caseNodes -> ops.mentions
ops.additionalProperty = [
  ap('pricingModel', 'Every job is surveyed and priced at one flat rate in writing before work begins — quoted per job; the flat rate is the standard offer and the guarantee. The delivery level is part of the written scope. Hourly pricing is available when a client asks for it.'),
  ap('territory', 'The full published footprint — all 83 areas in service-area.geojson; the white-glove capability covers every place feature (cities, counties, both branches) in the map.'),
  ap('itemListing', 'High-value pieces are listed individually with declared values before custody changes hands, on the federal extraordinary-value rule (items over $100 per pound must be listed on the shipping documents).'),
  ap('crewBasis', 'Crew size is set by the piece and the path at the survey — weight, stairs, turns, doorways — on the NIOSH 51 lb load-constant arithmetic. Stairs run any number of flights, up or down.'),
  ap('confirmedScope', 'Receiving and holding in storage with a receiving inspection report; delivery on the install day; full assembly, including appliance hookups where the job includes appliances; haul-away of the replaced item; carrier-terminal pickup with damage noted on the carrier\'s ticket; three-stage photo documentation (arrival, unboxed, placed); packaging and pallet removal. Every delivery level — curbside, threshold, room of choice, white glove — is bookable on its own.'),
  ap('fulfillment', 'The company\'s own crews inside the home territory; a vetted partner, coordinated by the company under the same written scope, when a job is outside it.'),
  ap('clientele', 'Brands and manufacturers using the company as a local delivery arm, retailers and big-box stores, shippers and carriers, businesses, and homeowners through those accounts — high-dollar, heavy, or fragile pieces; every job is different.'),
];
const caseNodes = store.cases.map((c) => ({
  '@type': 'Service',
  name: c.title,
  description: c.story,
  serviceType: 'White-glove delivery',
  areaServed: c.town + ', ' + c.state,
  additionalProperty: [
    ap('dateCompleted', c.month),
    ap('customerType', c.customerType),
    ap('itemHandled', c.item),
    ...(c.origin ? [ap('pickupOrigin', c.origin)] : []),
    ap('requirementsMet', c.requirementsMet),
  ],
}));
// Validator ruling (2026-11-05): completedJob is not a schema.org property
// the validator recognizes on a Service — it read as 2 errors on this node,
// reached through the process HowTo's about link. The cases ride mentions,
// the carrier the trust ledger proved clean for the same nodes.
ops.mentions = caseNodes;

// 3. research Dataset node
const research = {
  '@id': NEW + 'research',
  '@type': 'Dataset',
  name: 'White-Glove Delivery — Research Layer',
  description: 'The sourced research layer under the white-glove delivery category: thirteen claims — the four-level delivery taxonomy the trade prices by, the federal valuation rules (full value protection as the default, the 60-cents-per-pound released-value election, the $100-per-pound extraordinary-value listing rule, valuation versus insurance), the NIOSH lifting constant behind two-person crews, the delivery-record condition rule, and the company\'s owner-confirmed scope (receiving with inspection report and storage hold, install-day delivery, full assembly, appliance hookups, haul-away, carrier-terminal pickup, three-stage photo documentation, any stairs) — the ten buyer personas as data rows, and the fifty buyer-intent terms the category\'s rubric family carries. Every figure is quoted with its scope and never extended.',
  keywords: ['white glove delivery', 'room of choice', 'full value protection', 'delivery levels', 'last mile', 'receiving inspection'],
  about: { '@id': 'https://theflatratemovers.com/#service-white-glove' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  datePublished: '2026-11-02', // the file's first publication (CV-6 DATES table) — the research layer's own date rides dateModified
  dateModified: '2026-11-05',
  creator: template.creator,
  publisher: template.publisher,
  license: template.license,
  url: LANDING,
  sameAs: LANDING,
  identifier: LANDING,
  isAccessibleForFree: true,
  includedInDataCatalog: template.includedInDataCatalog,
  distribution: template.distribution,
  hasPart: store.claims.map(mapClaim),
  audience: store.personas.map(mapPersona),
  mentions: store.buyerIntentTerms.map(mapTerm),
};

// 4. sources Article node
const cite = (name, url) => ({ '@type': 'CreativeWork', name, url });
const sources = {
  '@id': NEW + 'sources',
  '@type': 'Article',
  name: 'White-Glove Delivery — Primary Sources',
  headline: 'The sources under the white-glove delivery research layer',
  description: 'Every factual claim in the research layer traces to one of these sources: FMCSA\'s own consumer-protection pages for the valuation rules, the NIOSH lifting-equation manual for crew ergonomics, the delivery trade\'s published service-level definitions for the four-tier taxonomy, and the company\'s own owner-confirmed scope and case register (2026-11-05) for the practice claims and the two case records.',
  keywords: ['primary sources', 'fmcsa', 'niosh', 'delivery levels'],
  about: { '@id': 'https://theflatratemovers.com/#service-white-glove' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  dateModified: '2026-11-05',
  creator: template.creator,
  license: template.license,
  distribution: template.distribution,
  sameAs: LANDING,
  author: termsArticle.author,
  publisher: termsArticle.publisher,
  citation: [
    cite('FMCSA — Before Requesting Services from Any Mover (Subpart B): full value protection, released value, extraordinary-value items', 'https://www.fmcsa.dot.gov/protect-your-move/how-to/subpartB'),
    cite('FMCSA — Frequently Asked Questions: mover liability and valuation (valuation is not insurance)', 'https://www.fmcsa.dot.gov/faq?keyword=&term_node_tid_depth=23066'),
    cite('NIOSH Publication No. 94-110 — Applications Manual for the Revised NIOSH Lifting Equation (51 lb load constant)', 'https://www.cdc.gov/niosh/docs/94-110/'),
    cite('Sohnne — Doorstep vs Threshold vs Room of Choice vs White Glove Delivery (the four levels, at a glance)', 'https://sohnne.com/blog/furniture-delivery-types-explained/'),
    cite('Secursus — White Glove Delivery Service: What It Is, Cost & Insurance (scope and assembly definitions)', 'https://www.secursus.com/en-us/resource/article/white-glove-delivery/'),
    cite('The Flat Rate Movers — White-Glove Service Scope and Case Register, owner-confirmed 2026-11-05 (company practice claims; case records wg-001 and wg-002, city level)', 'https://theflatratemovers.com/white-glove-delivery/'),
  ],
};

// 5. service-levels Service node
const levels = {
  '@id': NEW + 'service-levels',
  '@type': 'Service',
  name: 'White-Glove Delivery — The Four Delivery Levels',
  description: 'The delivery-level taxonomy stated as data, because the level is the scope: curbside stops at the curb; threshold stops at the first dry covered spot inside; room of choice carries the boxed item to the named room and stops; white glove finishes the job in the room — placement, unpacking, full assembly, joint inspection, and every piece of packaging out with the crew. Every level is bookable on its own. The Flat Rate Movers\' white-glove service is the fourth level, across the full 83-area footprint, priced at one flat rate in writing per job.',
  keywords: ['curbside', 'threshold', 'room of choice', 'white glove', 'delivery levels'],
  about: { '@id': 'https://theflatratemovers.com/#service-white-glove' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  dateModified: '2026-11-05',
  creator: template.creator,
  license: template.license,
  distribution: template.distribution,
  sameAs: LANDING,
  provider: ops.provider,
  publisher: template.publisher,
  offers: store.serviceLevels.map((lv) => ({
    '@type': 'Offer', name: lv.level, description: lv.stops,
    additionalProperty: [ap('assembly', lv.assembly), ap('debrisRemoval', lv.debrisRemoval), ap('unpacking', lv.unpacking), ap('bookableAlone', lv.bookableAlone)],
  })),
};

// 6. trust-ledger Dataset node — the machine-readable trust layer
const ledger = {
  '@id': NEW + 'trust-ledger',
  '@type': 'Dataset',
  name: 'White-Glove Delivery — Trust Ledger',
  description: 'The trust layer stated as data: a company founded in 2010 with 16+ years operating, serving clientele classes whose work is high-dollar and privacy-first — federal agencies, brands and manufacturers running the company as a local delivery arm, retailers and big-box stores, shippers and carriers, and homeowners. Its evidence is repeat-account work (multiple white-glove orders from a single brand account inside one week, December 2025), a written documentation standard (receiving inspection report, three-stage photographs, carrier-ticket damage notation, delivery record signed against the item list), the value classes actually handled, and this estate\'s own signed provenance — every claim here is a distribution in an Ed25519-signed index whose digests verify.',
  keywords: ['trust ledger', 'clientele', 'documentation standard', 'signed provenance', 'repeat accounts'],
  about: { '@id': 'https://theflatratemovers.com/#service-white-glove' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  datePublished: '2026-11-02',
  dateModified: '2026-11-05',
  creator: template.creator,
  publisher: template.publisher,
  license: template.license,
  url: LANDING,
  sameAs: LANDING,
  identifier: LANDING,
  isAccessibleForFree: true,
  includedInDataCatalog: template.includedInDataCatalog,
  distribution: template.distribution,
  additionalProperty: Object.entries(store.trustLedger).map(([k, v]) => ap(k, v)),
  mentions: [...caseNodes, {
    '@type': 'ItemList',
    name: 'Demand corridors — long-distance and white-glove (observed 2026-11-05)',
    description: 'Metropolitan demand signals observed in Cloudflare Web Analytics (top data centers, last 24 hours, 2026-11-05). A demand corridor records where interest in the estate originates; it is not a local service area and adds no town to the service footprint. Long-distance work into these metros rides the interstate contractor model, and white-glove fulfillment outside the home area rides vetted partners — both owner-confirmed scope. The service footprint remains the 83-area Shenandoah Valley / Eastern Panhandle set.',
    numberOfItems: (store.demandCorridors || []).length,
    itemListElement: (store.demandCorridors || []).map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'City',
        name: m.city,
        geo: { '@type': 'GeoCoordinates', latitude: m.lat, longitude: m.lon },
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'cloudflareDataCenter', value: m.code },
          { '@type': 'PropertyValue', name: 'cloudflareRequests24h', value: m.cloudflareRequests24h, unitText: 'requests in the 24 hours before 2026-11-05' },
        ],
      },
    })),
  }],
};

const howto = {
  '@id': NEW + 'process',
  '@type': 'HowTo',
  name: 'White-Glove Delivery — The Process, Step by Step',
  description: 'The eight-step white-glove delivery process as data: item list and survey; receiving and the inspection report; the storage hold; install-day scheduling; protected transport; room-of-choice placement; unpacking, full assembly and hookups; and the close — haul-away, debris out, and the three-stage photo record delivered to the account. The same sequence the service page states in prose.',
  keywords: ['white glove process', 'receiving inspection', 'install-day delivery', 'three-stage photo documentation'],
  about: { '@id': NEW + 'operations' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  dateModified: '2026-11-05',
  creator: template.creator,
  publisher: template.publisher,
  license: template.license,
  step: store.process.map((s) => ({ '@type': 'HowToStep', position: s.step, name: s.name, text: s.text })),
};

nodes.push(research, sources, levels, ledger, howto);
if (nodes.length !== 13) fail('expected 13 nodes, got ' + nodes.length);
// Digest fill (file-sourced, S2 pattern; DC-2 fix 2026-11-05): every
// cross-file DataDownload carries its target file's SHA-256 computed from
// the file on disk at build time. Self-references to this dataset file
// stay digest-less — the signed index is the self-digest seat.
{
  const crypto = require('crypto');
  for (const n of nodes) {
    if (!Array.isArray(n.distribution)) continue;
    for (const e of n.distribution) {
      if (!e || e['@type'] !== 'DataDownload' || e.sha256 || typeof e.contentUrl !== 'string') continue;
      const rel = e.contentUrl.replace('https://theflatratemovers.com/', '');
      if (!rel || rel === 'datasets-white-glove.json') continue;
      const fp = path.join(PUB, rel);
      if (fs.existsSync(fp)) e.sha256 = crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex');
    }
  }
}
doc['@graph'] = nodes;
fs.writeFileSync(FILE, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE', FILE, '— 13 nodes (8 re-keyed + research/sources/service-levels/trust-ledger/process HowTo); claims 13, personas 10, terms 50, levels 4, process 8, cases 2');
