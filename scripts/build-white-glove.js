#!/usr/bin/env node
/*
 * build-white-glove.js — premiere upgrade generator (2026-11-05).
 * Builds datasets-white-glove.json at the current machine standard:
 * the October D1-D8 nodes preserved (prose untouched), @ids re-keyed to
 * the landing-URL form, the operations Service upgraded to the current
 * shape (serviceType / url / areaServed / serviceFacts / process), and
 * three nodes added from data/white-glove-research.json: a research
 * Dataset (sourced claims, personas and buyer-intent terms as data
 * rows), a sources Article (primary-source citations), and a
 * service-levels Service (the four delivery tiers as data). Owner
 * directive 2026-11-05: white-glove gets the full territory expansion
 * and the premiere upgrade — its GeoJSON capability already covers all
 * 64 place features; this build closes the data-depth gap (the file
 * carried zero row-level payload). Fail-loud assertions throughout.
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
if ((store.claims || []).length !== 7) fail('claims must be 7, got ' + (store.claims || []).length);
if ((store.personas || []).length !== 6) fail('personas must be 6, got ' + (store.personas || []).length);
if ((store.buyerIntentTerms || []).length !== 25) fail('terms must be 25, got ' + (store.buyerIntentTerms || []).length);
if ((store.serviceLevels || []).length !== 4) fail('serviceLevels must be 4, got ' + (store.serviceLevels || []).length);
if ((store.process || []).length !== 7) fail('process must be 7, got ' + (store.process || []).length);
for (const c of store.claims) if (!c.source || !c.fact || !c.headline) fail('claim missing fields: ' + c.id);

const doc = JSON.parse(fs.readFileSync(FILE, 'utf8'));
// Idempotent: on a re-run the file already carries the three generated
// nodes — drop them and rebuild from the 8 base nodes.
const GENERATED_SUFFIXES = ['dataset-white-glove-research', 'dataset-white-glove-sources', 'dataset-white-glove-service-levels'];
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

// 2. operations Service upgrade
const ops = nodes.find((n) => n['@id'] === NEW + 'operations');
if (!ops) fail('operations node missing after re-key');
ops.serviceType = 'White-glove delivery — room-of-choice placement, unpacking, light assembly, debris removal';
ops.url = 'https://theflatratemovers.com/white-glove-delivery/';
ops.areaServed = [
  { '@id': 'https://theflatratemovers.com/#place-winchester-va' },
  { '@id': 'https://theflatratemovers.com/#place-martinsburg-wv' },
];
ops.serviceFacts = {
  pricingModel: 'Every job is surveyed and priced at one flat rate in writing before work begins; the flat rate is the standard offer and the guarantee. The delivery level is part of the written scope. Hourly pricing is available when a client asks for it.',
  territory: 'The full published footprint — all 71 areas in service-area.geojson; the white-glove capability covers every place feature (cities, counties, both branches) in the map.',
  itemListing: 'High-value pieces are listed individually with declared values before custody changes hands, on the federal extraordinary-value rule (items over $100 per pound must be listed on the shipping documents).',
  crewBasis: 'Crew size is set by the piece and the path at the survey — weight, stairs, turns, doorways — on the NIOSH 51 lb load-constant arithmetic.',
};
ops.process = store.process;

// 3. research Dataset node
const research = {
  '@id': NEW + 'research',
  '@type': 'Dataset',
  name: 'White-Glove Delivery — Research Layer',
  description: 'The sourced research layer under the white-glove delivery category: seven claims verified against their sources on 2026-11-05 (the four-level delivery taxonomy the trade prices by, the federal valuation rules — full value protection as the default, the 60-cents-per-pound released-value election, the $100-per-pound extraordinary-value listing rule, valuation versus insurance — the NIOSH lifting constant behind two-person crews, and the delivery-record condition rule), the six buyer personas as data rows, and the twenty-five buyer-intent terms the category\'s rubric family carries. Every figure is quoted with its scope and never extended.',
  keywords: ['white glove delivery', 'room of choice', 'full value protection', 'delivery levels', 'last mile'],
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
  researchClaims: store.claims,
  personas: store.personas,
  buyerIntentTerms: store.buyerIntentTerms,
};

// 4. sources Article node
const cite = (name, url) => ({ '@type': 'CreativeWork', name, url });
const sources = {
  '@id': NEW + 'sources',
  '@type': 'Article',
  name: 'White-Glove Delivery — Primary Sources',
  headline: 'The sources under the white-glove delivery research layer',
  description: 'Every factual claim in the research layer traces to one of these sources, read on 2026-11-05: FMCSA\'s own consumer-protection pages for the valuation rules, the NIOSH lifting-equation manual for crew ergonomics, and the delivery trade\'s published service-level definitions for the four-tier taxonomy.',
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
  citations: [
    cite('FMCSA — Before Requesting Services from Any Mover (Subpart B): full value protection, released value, extraordinary-value items', 'https://www.fmcsa.dot.gov/protect-your-move/how-to/subpartB'),
    cite('FMCSA — Frequently Asked Questions: mover liability and valuation (valuation is not insurance)', 'https://www.fmcsa.dot.gov/faq?keyword=&term_node_tid_depth=23066'),
    cite('NIOSH Publication No. 94-110 — Applications Manual for the Revised NIOSH Lifting Equation (51 lb load constant)', 'https://www.cdc.gov/niosh/docs/94-110/'),
    cite('Sohnne — Doorstep vs Threshold vs Room of Choice vs White Glove Delivery (the four levels, at a glance)', 'https://sohnne.com/blog/furniture-delivery-types-explained/'),
    cite('Secursus — White Glove Delivery Service: What It Is, Cost & Insurance (scope and assembly definitions)', 'https://www.secursus.com/en-us/resource/article/white-glove-delivery/'),
  ],
};

// 5. service-levels Service node
const levels = {
  '@id': NEW + 'service-levels',
  '@type': 'Service',
  name: 'White-Glove Delivery — The Four Delivery Levels',
  description: 'The delivery-level taxonomy stated as data, because the level is the scope: curbside stops at the curb; threshold stops at the first dry covered spot inside; room of choice carries the boxed item to the named room and stops; white glove finishes the job in the room — placement, unpacking, light assembly from the maker\'s kit, joint inspection, and every piece of packaging out with the crew. The Flat Rate Movers\' white-glove service is the fourth level, across the full 71-area footprint, priced at one flat rate in writing per job.',
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
  serviceLevels: store.serviceLevels,
};

nodes.push(research, sources, levels);
if (nodes.length !== 11) fail('expected 11 nodes, got ' + nodes.length);
doc['@graph'] = nodes;
fs.writeFileSync(FILE, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE', FILE, '— 11 nodes (8 re-keyed + research/sources/service-levels); claims 7, personas 6, terms 25, levels 4');
