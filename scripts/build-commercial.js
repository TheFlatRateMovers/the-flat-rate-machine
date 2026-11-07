#!/usr/bin/env node
/*
 * build-commercial.js — B2 deepening generator (2026-11-05).
 * Builds datasets-commercial.json at the current machine standard:
 * the October D1-D8 nodes preserved (prose untouched), @ids re-keyed
 * to the landing-URL form, the operations Service upgraded to the
 * current shape (serviceType / url / areaServed / serviceFacts /
 * process), and three nodes added from data/commercial-research.json:
 * a research Dataset (sourced claims, personas and buyer-intent
 * terms as data rows), a sources Article (primary-source citations),
 * and a boundaries Service. Research basis: IOMI's published methods
 * (man-hour estimating, building protection, anti-static electronics
 * handling, book carts), the building-access record (COI mechanics,
 * the four approvals), and the EPA universal-waste framework. No
 * IOMI certification is claimed — the methods are cited as the
 * trade's standards. Fail-loud assertions throughout.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const FILE = path.join(PUB, 'datasets-commercial.json');
const LANDING = 'https://theflatratemovers.com/datasets/commercial/';
const OLD = 'https://theflatratemovers.com/#dataset-commercial-';
const NEW = LANDING + '#dataset-commercial-';
const fail = (m) => { throw new Error('build-commercial: ' + m); };

const store = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'commercial-research.json'), 'utf8'));
if ((store.claims || []).length !== 7) fail('claims must be 7, got ' + (store.claims || []).length);
if ((store.personas || []).length !== 6) fail('personas must be 6, got ' + (store.personas || []).length);
if ((store.buyerIntentTerms || []).length !== 25) fail('terms must be 25, got ' + (store.buyerIntentTerms || []).length);
if ((store.boundaries || []).length !== 3) fail('boundaries must be 3, got ' + (store.boundaries || []).length);
if ((store.process || []).length !== 7) fail('process must be 7, got ' + (store.process || []).length);
for (const c of store.claims) if (!c.source || !c.fact || !c.headline) fail('claim missing fields: ' + c.id);

const doc = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const GENERATED_SUFFIXES = ['dataset-commercial-research', 'dataset-commercial-sources', 'dataset-commercial-boundaries'];
const graph = doc['@graph'].filter((n) => !GENERATED_SUFFIXES.some((s) => (n['@id'] || '').endsWith(s)));
if (graph.length !== 8) fail('expected the 8 existing nodes as the base, got ' + graph.length);
const byId = (suffix) => graph.find((n) => (n['@id'] || '').endsWith(suffix));
const template = byId('dataset-commercial-asset-taxonomy');
if (!template) fail('template node missing');
const termsArticle = byId('dataset-commercial-terms');

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

const ops = nodes.find((n) => n['@id'] === NEW + 'operations');
if (!ops) fail('operations node missing after re-key');
ops.serviceType = 'Commercial and business relocation — offices, retail, and commercial premises';
ops.url = 'https://theflatratemovers.com/commercial-moving/';
ops.areaServed = [
  { '@id': 'https://theflatratemovers.com/#place-winchester-va' },
  { '@id': 'https://theflatratemovers.com/#place-martinsburg-wv' },
];
ops.serviceFacts = {
  pricingModel: 'Every job is surveyed and priced at one flat rate in writing before work begins; the flat rate is the standard offer and the guarantee. The commercial estimate is built on the man-hour plan — crew size against hours inside both buildings\' windows. Hourly pricing is available when a client asks for it.',
  buildingPacket: 'Both buildings\' requirements are executed as one packet: Certificates of Insurance in each building\'s exact wording, freight-elevator and dock reservations in writing, after-hours access confirmed, the packet reconfirmed 48 to 72 hours before move day.',
  streams: 'Every commercial job separates three streams at the survey — what travels, what stores, what retires — and retired electronics route to documented recycling, never the dumpster.',
  fleetModel: 'Trucks are leased. Interstate work is performed by contractors who hold their own operating authority and proper equipment.',
};
ops.process = store.process;

const research = {
  '@id': NEW + 'research',
  '@type': 'Dataset',
  name: 'Commercial Moving — Research Layer',
  description: 'The sourced research layer under the commercial moving category: seven claims verified against their sources on 2026-11-05 (why a business move is not a household move under the federal framework; the Certificate of Insurance mechanics buildings enforce; the four building approvals that stop moves at the curb; the trade\'s man-hour estimating standard; building protection as a trained discipline; the anti-static electronics handling standard; and the EPA universal-waste rules for retired equipment), the six buyer personas as data rows, and the twenty-five buyer-intent terms the category\'s rubric family carries. Every figure is quoted with its scope and never extended; the trade\'s methods are cited as standards, never as the company\'s certifications.',
  keywords: ['commercial moving', 'certificate of insurance', 'office relocation', 'man-hour estimating', 'building access'],
  about: { '@id': 'https://theflatratemovers.com/#service-commercial' },
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
  researchClaims: store.claims,
  personas: store.personas,
  buyerIntentTerms: store.buyerIntentTerms,
};

const cite = (name, url) => ({ '@type': 'CreativeWork', name, url });
const sources = {
  '@id': NEW + 'sources',
  '@type': 'Article',
  name: 'Commercial Moving — Primary Sources',
  headline: 'The sources under the commercial moving research layer',
  description: 'Every factual claim in the research layer traces to one of these sources, read on 2026-11-05: the International Office Moving Institute\'s published best-practice methods, the building-access record as property managers and commercial movers document it (COI wording, elevator and dock discipline), and the EPA universal-waste framework as the facilities press summarizes it.',
  keywords: ['primary sources', 'iomi', 'certificate of insurance', 'universal waste'],
  about: { '@id': 'https://theflatratemovers.com/#service-commercial' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  dateModified: '2026-11-05',
  creator: template.creator,
  license: template.license,
  distribution: template.distribution,
  sameAs: LANDING,
  author: termsArticle.author,
  publisher: termsArticle.publisher,
  citations: [
    cite('IOMI — best-practice methods: man-hour estimating, building protection, anti-static electronics handling (Olympia Moving training record)', 'https://officemoves.com/every-branch-every-employee-olympia-moving-storage-iomitrained-and-certified/'),
    cite('IOMI — 10 Steps to a Successful Office Move (book bins, building protection, electronics methods)', 'https://www.helpmovingoffice.com/article/10-steps-to-a-successful-office-move'),
    cite('Element Moving — How to Plan an Office Move: COIs, freight elevators, loading docks, after-hours access', 'https://elementmoving.com/blog/moving-your-business/'),
    cite('EaseMoving — Office Moving & Commercial Relocation: COI limits, FMCSA category, downtime doctrine', 'https://easemoving.org/sitemaps.xml'),
    cite('FacilitiesNet — Electronic Waste: Reuse, Recycle, or Dispose? (EPA universal-waste framework)', 'https://www.facilitiesnet.com/maintenanceoperations/article.aspx?id=8597'),
  ],
};

const boundaries = {
  '@id': NEW + 'boundaries',
  '@type': 'Service',
  name: 'Commercial Moving — Scope Boundaries',
  description: 'The scope boundaries of the commercial category stated as data. Building rules govern access: dock windows, elevator reservations, and approved hours are granted by each building\'s management, and the company runs the paperwork and the schedule to those rules without promising slots a building has not granted. Building protection and goods protection are separate instruments: the Certificate of Insurance answers the building\'s risk, the valuation in the customer\'s own contract answers their goods, and the two are never interchangeable. Retired equipment is the customer\'s regulated waste stream until it reaches an authorized handler — the move plan routes it with documentation, and the crew never puts electronics in a dumpster.',
  keywords: ['scope boundaries', 'building rules', 'certificate of insurance', 'universal waste'],
  about: { '@id': 'https://theflatratemovers.com/#service-commercial' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  dateModified: '2026-11-05',
  creator: template.creator,
  license: template.license,
  distribution: template.distribution,
  sameAs: LANDING,
  provider: ops.provider,
  publisher: template.publisher,
  boundaries: store.boundaries,
};

// Canonical distributions (2026-11-06, W02 recipe): the five deepening nodes
// inherited a bare 4-entry distribution set — untyped, no sha256, no
// self-reference (validator errors + DC-2/D-2). They carry the template
// node's canonical distribution set, like every other node here.
for (const suffix of ['operations', 'premises-access', 'terms', 'personas', 'protection-compliance']) {
  const n = nodes.find((x) => (x['@id'] || '').endsWith(suffix));
  if (n) n.distribution = JSON.parse(JSON.stringify(template.distribution));
}
for (const n of nodes) {
  if (Array.isArray(n.distribution)) for (const d of n.distribution) {
    if (d && typeof d === 'object' && !d['@type']) d['@type'] = 'DataDownload';
  }
}
nodes.push(research, sources, boundaries);
if (nodes.length !== 11) fail('expected 11 nodes, got ' + nodes.length);
doc['@graph'] = nodes;
fs.writeFileSync(FILE, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE', FILE, '— 11 nodes (8 re-keyed + research/sources/boundaries); claims 7, personas 6, terms 25, boundaries 3');
