#!/usr/bin/env node
/*
 * build-it.js — B2B Specialty extension generator (2026-11-05).
 * Extends datasets-it.json in place: the October nodes preserved,
 * @ids re-keyed from root-fragment to the landing-URL form, the
 * operations Service upgraded (url / areaServed / rubric subjectOf),
 * and two nodes added: a sources Article and a rubric cross-reference
 * Dataset. IT relocation is the regional spearhead of the Data Center
 * category — it is evaluated under that category's rubric objects in
 * datasets-b2b-specialty-rubric.json, and its research layer rides the
 * data-center research store (data/data-center-research.json), so this
 * file gains the binding and the citations, not a duplicate layer.
 * Fail-loud assertions throughout.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const FILE = path.join(PUB, 'datasets-it.json');
const LANDING = 'https://theflatratemovers.com/datasets/it/';
const OLD = 'https://theflatratemovers.com/#';
const NEW = LANDING + '#';
const RUBRIC_URL = 'https://theflatratemovers.com/datasets-b2b-specialty-rubric.json';
const fail = (m) => { throw new Error('build-it: ' + m); };

const doc = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const GENERATED_SUFFIXES = ['dataset-it-sources', 'dataset-it-rubric-cross-reference'];
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
ops.url = 'https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia/';
ops.areaServed = [
  { '@id': 'https://theflatratemovers.com/#place-winchester-va' },
  { '@id': 'https://theflatratemovers.com/#place-martinsburg-wv' },
];
ops.subjectOf = { '@id': 'https://theflatratemovers.com/datasets/b2b-specialty-rubric/#dataset-b2b-specialty-rubric' };

const cite = (name, url) => ({ '@type': 'CreativeWork', name, url });
const sources = {
  '@id': NEW + 'dataset-it-sources',
  '@type': 'Article',
  name: 'IT Relocation — Primary Sources',
  headline: 'The sources under the IT relocation layer',
  description: 'The IT relocation category is evaluated under the Data Center & IT Infrastructure Relocation rubric: the criteria, their named trade sources, and the 24-term buyer-intent research live in the B2B specialty research dossier (2026-11-04) and the rubric dataset it produced.',
  keywords: ['primary sources', 'research dossier', 'evaluation criteria'],
  about: { '@id': 'https://theflatratemovers.com/#service-it-relocation' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  dateModified: '2026-11-05',
  creator: template.creator,
  license: template.license,
  distribution: template.distribution,
  sameAs: LANDING,
  author: termsArticle ? termsArticle.author : template.creator,
  publisher: template.publisher,
  citations: [
    cite('The Flat Rate Movers — B2B Specialty Research Dossier (2026-11-04): 24 buyer-intent terms, criteria D1–D6 with named trade sources', 'https://theflatratemovers.com/datasets/b2b-specialty-rubric/'),
    cite('B2B Specialty Moving Rubric dataset — the rubric objects under which IT relocation is evaluated', RUBRIC_URL),
  ],
};

const xref = {
  '@id': NEW + 'dataset-it-rubric-cross-reference',
  '@type': 'Dataset',
  name: 'IT Relocation — B2B Specialty Rubric Cross-Reference',
  description: 'The binding between IT relocation and the B2B Specialty Moving Rubric: IT relocation is the regional spearhead of the Data Center & IT Infrastructure Relocation category, and engagements are evaluated against that category\'s twelve rubric objects and six criteria (chain of custody and physical security, technical documentation, handling method and ESD discipline, verification and uptime accountability, insurance truth, decommissioning and ITAD integrity). The rubric dataset is the evaluation instrument; this dataset is the operational record the evaluation measures.',
  keywords: ['rubric', 'cross-reference', 'evaluation', 'it relocation'],
  about: { '@id': 'https://theflatratemovers.com/#service-it-relocation' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  datePublished: '2026-10-29',
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
  rubricDataset: RUBRIC_URL,
  evaluatedUnderCategory: 'Data Center & IT Infrastructure Relocation',
};

nodes.push(sources, xref);
if (nodes.length !== 10) fail('expected 10 nodes, got ' + nodes.length);
doc['@graph'] = nodes;
/* DC-4 normalization: every Dataset node's creator/publisher is the typed canonical Organization. */
for (const n of doc['@graph']) {
  if (n['@type'] === 'Dataset') {
    const org = { '@type': 'Organization', '@id': 'https://theflatratemovers.com/#organization', name: 'The Flat Rate Movers' };
    n.creator = org; n.publisher = org;
  }
}
fs.writeFileSync(FILE, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE', FILE, '— 10 nodes (8 re-keyed + sources/rubric-cross-reference)');
