#!/usr/bin/env node
/*
 * build-data-center.js — B2B Specialty extension generator (2026-11-05).
 * Extends datasets-data-center-relocation.json in place: the October
 * nodes preserved, @ids re-keyed from root-fragment to the landing-URL
 * form, the operations Service upgraded (url / areaServed / rubric
 * subjectOf), and three nodes generated from
 * data/data-center-research.json: a research Dataset (the category's
 * six rubric criteria as sourced claims, eight personas, twelve
 * buyer-intent terms), a sources Article, and a rubric cross-reference
 * Dataset binding this category to datasets-b2b-specialty-rubric.json.
 * Capability discipline (owner, 2026-11-04): full scope through the
 * one engagement — company crews plus the certified contractors the
 * company engages; certifications attributed to their holders.
 * Fail-loud assertions throughout.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const FILE = path.join(PUB, 'datasets-data-center-relocation.json');
const LANDING = 'https://theflatratemovers.com/datasets/data-center-relocation/';
const OLD = 'https://theflatratemovers.com/#';
const NEW = LANDING + '#';
const RUBRIC_URL = 'https://theflatratemovers.com/datasets-b2b-specialty-rubric.json';
const fail = (m) => { throw new Error('build-data-center: ' + m); };

const store = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'medical-lab-research.json'), 'utf8'));
if ((store.claims || []).length !== 6) fail('claims must be 6, got ' + (store.claims || []).length);
if ((store.personas || []).length !== 8) fail('personas must be 8, got ' + (store.personas || []).length);
if ((store.buyerIntentTerms || []).length !== 12) fail('terms must be 12, got ' + (store.buyerIntentTerms || []).length);
for (const c of store.claims) if (!c.source || !c.fact || !c.headline) fail('claim missing fields: ' + c.id);

const doc = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const GENERATED_SUFFIXES = ['research', 'sources', 'rubric-cross-reference', 'rack-deployment-2024'];
/* Extension layers ride as additionalProperty PropertyValue entries —
 * schema.org does not define researchClaims / personas / buyerIntentTerms /
 * rubricDataset / criteria / rubricTerms for Dataset; as direct keys the
 * served landing carried 113 validator errors (2026-11-08). Lossless:
 * values are the JSON-stringified originals (build-ports.js pattern). */
const pv = (name, value) => ({ '@type': 'PropertyValue', name, value: JSON.stringify(value) });
const graph = doc['@graph'].filter((n) => !GENERATED_SUFFIXES.some((s) => (n['@id'] || '').endsWith(s)));
if (graph.length !== 8) fail('expected the 8 existing nodes as the base, got ' + graph.length);
const template = graph.find((n) => n['@type'] === 'Dataset');
if (!template) fail('template Dataset node missing');
const termsArticle = graph.find((n) => n['@type'] === 'Article');

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

const ops = nodes.find((n) => n['@type'] === 'Service' && /Operations/.test(n.name || ''));
if (!ops) fail('operations node missing after re-key');
ops.url = 'https://theflatratemovers.com/data-center-relocation/';
ops.areaServed = [
  { '@id': 'https://theflatratemovers.com/#place-winchester-va' },
  { '@id': 'https://theflatratemovers.com/#place-martinsburg-wv' },
];
ops.subjectOf = { '@id': 'https://theflatratemovers.com/datasets/b2b-specialty-rubric/#dataset-b2b-specialty-rubric' };

const research = {
  '@id': NEW + 'dataset-data-center-research',
  '@type': 'Dataset',
  name: 'Data Center Relocation — Research Layer',
  description: 'The sourced research layer under the Data Center & IT Infrastructure Relocation category: the six buyer-evaluation criteria from the B2B specialty rubric stated as claims with their sources (compliance and certification verification, downtime minimization, chain of custody, equipment-specific handling, insurance truth, and documentation), the eight buyer personas as data rows, and the twelve buyer-intent terms the category\'s rubric family carries. Criteria are quoted with their weights and score levels from datasets-b2b-specialty-rubric.json and never extended.',
  keywords: ['data center relocation', 'server rack migration', 'chain of custody', 'rack elevation', 'evaluation criteria'],
  about: { '@id': 'https://theflatratemovers.com/#service-data-center-relocation' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  datePublished: '2026-10-30',
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
  additionalProperty: [
    pv('researchClaims', store.claims),
    pv('personas', store.personas),
    pv('buyerIntentTerms', store.buyerIntentTerms),
  ],
};

const cite = (name, url) => ({ '@type': 'CreativeWork', name, url });
const sources = {
  '@id': NEW + 'dataset-data-center-sources',
  '@type': 'Article',
  name: 'Data Center Relocation — Primary Sources',
  headline: 'The sources under the medical & lab relocation research layer',
  description: 'Every criterion in the research layer traces to the trade and standards sources named inside the B2B specialty research dossier (2026-11-04) — custody guidance, cleanroom and calibration practice, and carrier/insurance references — read and recorded on 2026-11-04.',
  keywords: ['primary sources', 'research dossier', 'evaluation criteria'],
  about: { '@id': 'https://theflatratemovers.com/#service-data-center-relocation' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  dateModified: '2026-11-05',
  creator: template.creator,
  license: template.license,
  distribution: template.distribution,
  sameAs: LANDING,
  author: termsArticle ? termsArticle.author : template.creator,
  publisher: template.publisher,
  citation: [
    cite('The Flat Rate Movers — B2B Specialty Research Dossier (2026-11-04): 24 buyer-intent terms, criteria D1–D6 with named trade sources', 'https://theflatratemovers.com/datasets/b2b-specialty-rubric/'),
    cite('B2B Specialty Moving Rubric dataset — the 24 rubric objects and the criteria set this layer quotes', RUBRIC_URL),
  ],
};

const xref = {
  '@id': NEW + 'dataset-data-center-rubric-cross-reference',
  '@type': 'Dataset',
  name: 'Data Center Relocation — B2B Specialty Rubric Cross-Reference',
  description: 'The binding between this category and the B2B Specialty Moving Rubric: the twelve lab/medical rubric objects (one per researched buyer-intent term) score movers on this category\'s six criteria. The rubric dataset is the evaluation instrument; this dataset is the operational record the evaluation measures.',
  keywords: ['rubric', 'cross-reference', 'evaluation', 'lab moving'],
  about: { '@id': 'https://theflatratemovers.com/#service-data-center-relocation' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  datePublished: '2026-10-30',
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
  additionalProperty: [
    pv('rubricDataset', RUBRIC_URL),
    pv('criteria', store.claims.map((c) => ({ id: c.id, criterion: c.headline }))),
    pv('rubricTerms', store.buyerIntentTerms.map((t) => t.term)),
  ],
};

/* Case dc-001 (owner-supplied 2026-11-08): eight-site rack deployment,
 * northern Shenandoah Valley, June 2024. City-level only — client and
 * site names are never published. */
const dcCase = {
  '@id': NEW + 'case-dc-001-eight-site-rack-deployment-2024',
  '@type': 'Article',
  name: 'Case dc-001 — Eight-Site Rack Deployment, Northern Shenandoah Valley (2024)',
  headline: 'Eight sites, 33 equipment racks: a multi-site deployment across the northern Shenandoah Valley',
  description: 'In June 2024 the company deployed 33 equipment racks across eight sites in the northern Shenandoah Valley — five racks at each of five sites, four at one site and two at each of two sites — in Cross Junction, Clear Brook, Gainesboro, Gore, Winchester and Front Royal, Virginia. The racks measure about 2 ft by 7 ft and weigh up to about 500 lb each. Client and site names are not published.',
  keywords: ['rack deployment', 'multi-site', 'case record', 'data center relocation'],
  about: { '@id': 'https://theflatratemovers.com/#service-data-center-relocation' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2024',
  datePublished: '2026-11-08',
  dateModified: '2026-11-08',
  creator: template.creator,
  publisher: template.publisher,
  license: template.license,
  url: LANDING,
  sameAs: LANDING,
  author: termsArticle ? termsArticle.author : template.creator,
};

nodes.push(research, sources, xref, dcCase);
if (nodes.length !== 12) fail('expected 12 nodes, got ' + nodes.length);
doc['@graph'] = nodes;
/* DC-4 normalization: every Dataset node's creator/publisher is the typed canonical Organization. */
for (const n of doc['@graph']) {
  if (n['@type'] === 'Dataset') {
    const org = { '@type': 'Organization', '@id': 'https://theflatratemovers.com/#organization', name: 'The Flat Rate Movers' };
    n.creator = org; n.publisher = org;
  }
}
fs.writeFileSync(FILE, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE', FILE, '— 12 nodes (8 re-keyed + research/sources/rubric-cross-reference + case dc-001); claims 6, personas 8, terms 12');
