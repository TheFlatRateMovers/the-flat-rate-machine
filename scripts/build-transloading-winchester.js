#!/usr/bin/env node
/*
 * build-transloading-winchester.js — premiere upgrade generator
 * (2026-11-05). Builds datasets-transloading-winchester.json at the
 * current machine standard: the October D1-D8 nodes preserved (prose
 * untouched), @ids re-keyed to the landing-URL form, the operations
 * Service upgraded to the current shape (serviceType / url /
 * areaServed / serviceFacts / process), and three nodes added from
 * data/transloading-winchester-research.json: a research Dataset
 * (sourced claims, personas and buyer-intent terms as data rows), a
 * sources Article (primary-source citations), and a chain-boundaries
 * Service. Owner directive 2026-11-05: transloading gets the full
 * territory expansion and the premiere upgrade — the GeoJSON
 * capability 'transloading-winchester' now covers all 64 place
 * features (it covered 26, Winchester branch only), and this build
 * closes the data-depth gap (the file carried zero row-level
 * payload). Gated facts stay gated per the 2026-10-29 rulings: no
 * drayage performer claim, no terminal tenancy or port-authority
 * relationship, no TWIC credential claim, no customs/bonded/FTZ
 * operator claim; pricing language is 'quoted per job' only.
 * Fail-loud assertions throughout.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const FILE = path.join(PUB, 'datasets-transloading-winchester.json');
const LANDING = 'https://theflatratemovers.com/datasets/transloading-winchester/';
const OLD = 'https://theflatratemovers.com/#dataset-transloading-winchester-';
const NEW = LANDING + '#dataset-transloading-winchester-';
const fail = (m) => { throw new Error('build-transloading-winchester: ' + m); };

const store = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'transloading-winchester-research.json'), 'utf8'));
if ((store.claims || []).length !== 7) fail('claims must be 7, got ' + (store.claims || []).length);
if ((store.personas || []).length !== 6) fail('personas must be 6, got ' + (store.personas || []).length);
if ((store.buyerIntentTerms || []).length !== 25) fail('terms must be 25, got ' + (store.buyerIntentTerms || []).length);
if ((store.boundaries || []).length !== 3) fail('boundaries must be 3, got ' + (store.boundaries || []).length);
if ((store.process || []).length !== 7) fail('process must be 7, got ' + (store.process || []).length);
for (const c of store.claims) if (!c.source || !c.fact || !c.headline) fail('claim missing fields: ' + c.id);

const doc = JSON.parse(fs.readFileSync(FILE, 'utf8'));
// Idempotent: on a re-run the file already carries the three generated
// nodes — drop them and rebuild from the 8 base nodes.
const GENERATED_SUFFIXES = ['dataset-transloading-winchester-research', 'dataset-transloading-winchester-sources', 'dataset-transloading-winchester-chain-boundaries'];
const graph = doc['@graph'].filter((n) => !GENERATED_SUFFIXES.some((s) => (n['@id'] || '').endsWith(s)));
if (graph.length !== 8) fail('expected the 8 existing nodes as the base, got ' + graph.length);
const byId = (suffix) => graph.find((n) => (n['@id'] || '').endsWith(suffix));
const template = byId('cross-dock-restack');
if (!template) fail('cross-dock-restack template node missing');
const termsArticle = byId('dataset-transloading-winchester-terms');

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

// 2. operations Service upgrade
const ops = nodes.find((n) => n['@id'] === NEW + 'operations');
if (!ops) fail('operations node missing after re-key');
ops.serviceType = 'Transloading, cross-docking, container unloading and freight rework — Winchester / Virginia Inland Port chain';
ops.url = 'https://theflatratemovers.com/transloading-winchester-va/';
ops.areaServed = [
  { '@id': 'https://theflatratemovers.com/#place-winchester-va' },
  { '@id': 'https://theflatratemovers.com/#place-martinsburg-wv' },
];
ops.serviceFacts = {
  pricingModel: 'Transloading work is quoted per job — scope, container count, handling, and timing priced in writing before work begins. No per-hundredweight schedule, standing rate, or minimum is published for this service.',
  territory: 'The full published footprint — all 71 areas in service-area.geojson; the transloading-winchester capability covers every place feature (cities, counties, both branches) in the map, with the work anchored on the Winchester branch at the Virginia Inland Port end of the chain.',
  chainPosition: 'The dock-and-road side of the Norfolk → rail → Virginia Inland Port → truck chain: loading, unloading, devanning, restacking, and regional trucking arranged per job. The terminal and the railroad are operated by their owners; no tenancy or port-authority relationship is claimed.',
  dispatchBasis: 'Dock time is booked against the chain\'s clocks — terminal appointments, rail arrivals, vessel windows.',
};
ops.process = store.process;

// 3. research Dataset node
const research = {
  '@id': NEW + 'research',
  '@type': 'Dataset',
  name: 'Transloading (Winchester) — Research Layer',
  description: 'The sourced research layer under the Winchester transloading category: seven claims verified against their sources on 2026-11-05 (the Virginia Inland Port\'s identity, reach, and physical plant from the Commonwealth and the Port Authority\'s own reports; the transloading-versus-intermodal and cross-docking definitions the trade prices by; the ship → double-stack rail → inland port → truck chain; VDOT\'s I-81 freight figures; and the port\'s export-consolidation function), the six buyer personas as data rows, and the twenty-five buyer-intent terms the category\'s rubric family carries. Every figure is quoted with its scope and never extended; facility facts are never stated as company credentials.',
  keywords: ['transloading', 'virginia inland port', 'cross docking', 'devanning', 'intermodal'],
  about: { '@id': 'https://theflatratemovers.com/#service-transloading-winchester-va' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  datePublished: '2026-10-29', // the file's first publication (CV-6 DATES table) — the research layer's own date rides dateModified
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
  /* Extension layers ride as additionalProperty PropertyValue entries —
   * schema.org does not define researchClaims / personas /
   * buyerIntentTerms / boundaries for Dataset or Service; as direct keys
   * the served B2B landings carried validator errors (W12: 113 on two
   * nodes). Lossless: values are the JSON-stringified originals. */
  additionalProperty: [
    { '@type': 'PropertyValue', name: 'researchClaims', value: JSON.stringify(store.claims) },
    { '@type': 'PropertyValue', name: 'personas', value: JSON.stringify(store.personas) },
    { '@type': 'PropertyValue', name: 'buyerIntentTerms', value: JSON.stringify(store.buyerIntentTerms) },
  ],
};

// 4. sources Article node
const cite = (name, url) => ({ '@type': 'CreativeWork', name, url });
const sources = {
  '@id': NEW + 'sources',
  '@type': 'Article',
  name: 'Transloading (Winchester) — Primary Sources',
  headline: 'The sources under the Winchester transloading research layer',
  description: 'Every factual claim in the research layer traces to one of these sources, read on 2026-11-05: the Commonwealth of Virginia\'s Port Authority pages and the Authority\'s own audited report for the inland port\'s identity and plant, the USGS-sourced local record for the rail chain, VDOT\'s corridor plan for the freight figures, and the logistics trade\'s published definitions for transloading and cross-docking.',
  keywords: ['primary sources', 'virginia port authority', 'virginia inland port', 'vdot'],
  about: { '@id': 'https://theflatratemovers.com/#service-transloading-winchester-va' },
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
    cite('Commonwealth of Virginia — Agencies: Virginia Port Authority (VIP identity, 220-mile reach, export consolidation)', 'https://www.transportation.virginia.gov/agencies/'),
    cite('Virginia Port Authority — Comprehensive Annual Financial Report (VIP plant: 161 acres, 1989, cross-dock, customs port of entry)', 'https://rga.lis.virginia.gov/Published/2005/RD202'),
    cite('VirginiaPlaces.org — Virginia Inland Port (VIP) and Intermodal Terminals (the Norfolk → rail → Front Royal chain)', 'https://www.virginiaplaces.org/transportation/inlandport.html'),
    cite('VDOT — I-81 Corridor Improvement Plan (over 40% of interstate truck VMT; over $300B in goods)', 'https://www.vdot.virginia.gov/projects/resources/i-81/i-81-corridor-improvement-plan-executive-summary.pdf'),
    cite('Wikipedia — Transloading (transloading versus intermodal, the trade definition)', 'https://en.wikipedia.org/wiki/Transloading'),
    cite('Weber Logistics — Cross Docking vs Transloading Services (the under-24-hour cross-dock standard)', 'https://www.weberlogistics.com/blog/california-logistics-blog/blog/california-logistics-cross-docking-transloading-services'),
  ],
};

// 5. chain-boundaries Service node
const boundaries = {
  '@id': NEW + 'chain-boundaries',
  '@type': 'Service',
  name: 'Transloading (Winchester) — Chain Boundaries',
  description: 'The scope boundaries of the Winchester transloading category stated as data. The Virginia Inland Port belongs to the Virginia Port Authority and the rail leg to Norfolk Southern — the company holds no tenancy and claims no port relationship; its work is the dock-and-road side of the chain, arranged per job. Customs and FTZ processes belong to their holders — the port is a Customs-designated port of entry with FTZ 20 Site 7 status as a facility, and the company packs, loads, and documents to the paperwork without holding those authorities. Pricing is quoted per job in writing; no rate schedule is published for this service.',
  keywords: ['scope boundaries', 'virginia inland port', 'ftz 20', 'quoted per job'],
  about: { '@id': 'https://theflatratemovers.com/#service-transloading-winchester-va' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  dateModified: '2026-11-05',
  creator: template.creator,
  license: template.license,
  distribution: template.distribution,
  sameAs: LANDING,
  provider: ops.provider,
  publisher: template.publisher,
  additionalProperty: [
    { '@type': 'PropertyValue', name: 'boundaries', value: JSON.stringify(store.boundaries) },
  ],
};

nodes.push(research, sources, boundaries);
if (nodes.length !== 11) fail('expected 11 nodes, got ' + nodes.length);
doc['@graph'] = nodes;
fs.writeFileSync(FILE, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE', FILE, '— 11 nodes (8 re-keyed + research/sources/chain-boundaries); claims 7, personas 6, terms 25, boundaries 3');
