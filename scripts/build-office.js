#!/usr/bin/env node
/*
 * build-office.js — B2 deepening generator (2026-11-05).
 * Builds datasets-office.json at the current machine standard:
 * the October D1-D8 nodes preserved (prose untouched), @ids re-keyed
 * to the landing-URL form, the operations Service upgraded to the
 * current shape (serviceType / url / areaServed / serviceFacts /
 * process), and three nodes added from data/office-research.json:
 * a research Dataset (sourced claims, personas and buyer-intent
 * terms as data rows), a sources Article (primary-source citations),
 * and a boundaries Service. Research basis: systems-furniture
 * installer documentation (teardown order, power-whip safety,
 * per-station timing, manufacturer connector systems), the labeling
 * discipline, IOMI's book-cart method, and the downtime doctrine.
 * Fail-loud assertions throughout.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const FILE = path.join(PUB, 'datasets-office.json');
const LANDING = 'https://theflatratemovers.com/datasets/office/';
const OLD = 'https://theflatratemovers.com/#dataset-office-';
const NEW = LANDING + '#dataset-office-';
const fail = (m) => { throw new Error('build-office: ' + m); };

const store = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'office-research.json'), 'utf8'));
if ((store.claims || []).length !== 7) fail('claims must be 7, got ' + (store.claims || []).length);
if ((store.personas || []).length !== 6) fail('personas must be 6, got ' + (store.personas || []).length);
if ((store.buyerIntentTerms || []).length !== 25) fail('terms must be 25, got ' + (store.buyerIntentTerms || []).length);
if ((store.boundaries || []).length !== 3) fail('boundaries must be 3, got ' + (store.boundaries || []).length);
if ((store.process || []).length !== 7) fail('process must be 7, got ' + (store.process || []).length);
for (const c of store.claims) if (!c.source || !c.fact || !c.headline) fail('claim missing fields: ' + c.id);

const doc = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const GENERATED_SUFFIXES = ['dataset-office-research', 'dataset-office-sources', 'dataset-office-boundaries'];
const graph = doc['@graph'].filter((n) => !GENERATED_SUFFIXES.some((s) => (n['@id'] || '').endsWith(s)));
if (graph.length !== 8) fail('expected the 8 existing nodes as the base, got ' + graph.length);
const byId = (suffix) => graph.find((n) => (n['@id'] || '').endsWith(suffix));
const template = byId('dataset-office-types-sizes');
if (!template) fail('template node missing');
const termsArticle = byId('dataset-office-terms');

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
ops.serviceType = 'Office moving — workstations, systems furniture, and office premises';
ops.url = 'https://theflatratemovers.com/office-moving/';
ops.areaServed = [
  { '@id': 'https://theflatratemovers.com/#place-winchester-va' },
  { '@id': 'https://theflatratemovers.com/#place-martinsburg-wv' },
];
ops.serviceFacts = {
  pricingModel: 'Every job is surveyed and priced at one flat rate in writing before work begins; the flat rate is the standard offer and the guarantee. Station teardown and rebuild times are known quantities, so the estimate is built on the man-hour plan. Hourly pricing is available when a client asks for it.',
  systemsBasis: 'The survey names the furniture systems on the floor — manufacturer, product line, connector type — because every brand connects differently and teardown runs in one fixed order: devices, mounted components, panels, rails, frame.',
  powerRule: 'Panel power whips are de-energized by the customer\'s or building\'s qualified person before any workstation is loosened; the crew never works a live whip and never performs electrical work.',
  finishLine: 'The job is scheduled around the business — after-hours, weekend, or phased by department — and its finish line is employees at working desks on the next business day.',
};
ops.process = store.process;

const research = {
  '@id': NEW + 'research',
  '@type': 'Dataset',
  name: 'Office Moving — Research Layer',
  description: 'The sourced research layer under the office moving category: seven claims verified against their sources on 2026-11-05 (the fixed disassembly order for systems furniture; power-whip safety — panels move only on a dead circuit; timed per-station teardown at 30 to 45 minutes for a standard two-panel workstation; manufacturer-specific connector systems; the color-coded labeling discipline that ties parts to the destination floor plan; scheduling around the business with day-one readiness as the finish line; and the rolling-cart method that keeps files and libraries in order), the six buyer personas as data rows, and the twenty-five buyer-intent terms the category\'s rubric family carries. Every figure is quoted with its scope and never extended.',
  keywords: ['office moving', 'cubicle disassembly', 'systems furniture', 'power whip', 'workstation moving'],
  about: { '@id': 'https://theflatratemovers.com/#service-office-moving' },
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
  name: 'Office Moving — Primary Sources',
  headline: 'The sources under the office moving research layer',
  description: 'Every factual claim in the research layer traces to one of these sources, read on 2026-11-05: systems-furniture installer documentation for teardown order, timing, and connector systems; the technical guide for power-whip safety; commercial movers\' published labeling methods; and the International Office Moving Institute\'s methods for files and downtime.',
  keywords: ['primary sources', 'systems furniture', 'iomi', 'cubicle disassembly'],
  about: { '@id': 'https://theflatratemovers.com/#service-office-moving' },
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
    cite('Chicago Office Movers — How to Disassemble an Office Cubicle for Moving (order, timing, brand systems)', 'https://chicagoofficemovers.com/how-to-disassemble-office-cubicle/'),
    cite('EngineerFix — How to Disassemble Cubicles for Moving or Storage (power whips, electrical safety, connection mechanisms)', 'https://engineerfix.com/how-to-disassemble-cubicles-for-moving-or-storage/'),
    cite('Moving Proz — Office Movers: cubicle cataloging, labeling, reassembly to floor plan', 'https://movingproz.com/kansas-city/office-movers/'),
    cite('IOMI — 10 Steps to a Successful Office Move (book bins method)', 'https://www.helpmovingoffice.com/article/10-steps-to-a-successful-office-move'),
    cite('EaseMoving — Office Moving & Commercial Relocation (after-hours and phased scheduling, downtime)', 'https://easemoving.org/sitemaps.xml'),
  ],
};

const boundaries = {
  '@id': NEW + 'boundaries',
  '@type': 'Service',
  name: 'Office Moving — Scope Boundaries',
  description: 'The scope boundaries of the office moving category stated as data. Electrical feeds are cut and restored by the customer\'s or building\'s qualified person — the crew disassembles furniture around a dead circuit and performs no electrical work. Reconnection ends with the right equipment on the right desk in the right order; network configuration and systems administration stay with the customer\'s IT. Reassembly builds to the destination floor plan the customer supplies; redesigns are the customer\'s and their space planner\'s decisions, and conflicts found on the floor are flagged in the open before anyone builds around them.',
  keywords: ['scope boundaries', 'power whip', 'floor plan', 'it reconnection'],
  about: { '@id': 'https://theflatratemovers.com/#service-office-moving' },
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

nodes.push(research, sources, boundaries);
if (nodes.length !== 11) fail('expected 11 nodes, got ' + nodes.length);
doc['@graph'] = nodes;
fs.writeFileSync(FILE, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE', FILE, '— 11 nodes (8 re-keyed + research/sources/boundaries); claims 7, personas 6, terms 25, boundaries 3');
