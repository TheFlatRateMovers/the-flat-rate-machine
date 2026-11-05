#!/usr/bin/env node
/*
 * build-local-regional.js — B1 deepening generator (2026-11-05).
 * Builds datasets-local-regional.json at the current machine standard:
 * the October D1-D8 nodes preserved (prose untouched), @ids re-keyed to
 * the landing-URL form, the operations Service upgraded to the current
 * shape (serviceType / areaServed / url / serviceFacts / process /
 * completedJob), and three nodes added from data/local-regional-
 * research.json: a research Dataset (sourced claims, personas and
 * buyer-intent terms as data rows), a sources Article (primary-source
 * citations), and a jurisdiction-boundaries Service. Every claim in the
 * store was verified against its primary source on 2026-11-05
 * (RESEARCH-B1.md); figures keep their scope, never extended.
 * Fail-loud assertions on every store payload.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const FILE = path.join(PUB, 'datasets-local-regional.json');
const LANDING = 'https://theflatratemovers.com/datasets/local-regional/';
const OLD = 'https://theflatratemovers.com/#dataset-local-regional-';
const NEW = LANDING + '#dataset-local-regional-';
const fail = (m) => { throw new Error('build-local-regional: ' + m); };

const store = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'local-regional-research.json'), 'utf8'));
if ((store.claims || []).length !== 9) fail('claims must be 9, got ' + (store.claims || []).length);
if ((store.personas || []).length !== 6) fail('personas must be 6, got ' + (store.personas || []).length);
if ((store.buyerIntentTerms || []).length !== 25) fail('terms must be 25, got ' + (store.buyerIntentTerms || []).length);
if ((store.boundaries || []).length !== 3) fail('boundaries must be 3, got ' + (store.boundaries || []).length);
if ((store.process || []).length !== 7) fail('process must be 7, got ' + (store.process || []).length);
for (const c of store.claims) if (!c.source || !c.fact || !c.headline) fail('claim missing fields: ' + c.id);

const doc = JSON.parse(fs.readFileSync(FILE, 'utf8'));
// Idempotent (2026-11-05): on a re-run the file already carries the three
// generated nodes — drop them and rebuild from the 8 base nodes.
const GENERATED_SUFFIXES = ['dataset-local-regional-research', 'dataset-local-regional-sources', 'dataset-local-regional-boundaries'];
const graph = doc['@graph'].filter((n) => !GENERATED_SUFFIXES.some((s) => (n['@id'] || '').endsWith(s)));
if (graph.length !== 8) fail('expected the 8 existing nodes as the base, got ' + graph.length);
const byId = (suffix) => graph.find((n) => (n['@id'] || '').endsWith(suffix));
const template = byId('sizes-access');
if (!template) fail('sizes-access template node missing');
const termsArticle = byId('dataset-local-regional-terms');

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
ops.serviceType = 'Local and regional household goods moving';
ops.url = 'https://theflatratemovers.com/local-regional-moving/';
ops.areaServed = [
  { '@id': 'https://theflatratemovers.com/#place-winchester-va' },
  { '@id': 'https://theflatratemovers.com/#place-martinsburg-wv' },
];
ops.serviceFacts = {
  pricingModel: 'Every job is surveyed and priced at one flat rate in writing before work begins; the flat rate is the standard offer and the guarantee. Hourly pricing is available when a client asks for it.',
  fleetModel: 'Trucks are leased. Interstate moves are performed by contractors who hold their own operating authority and proper equipment.',
  surveyBasis: 'The survey governs each job: scope, distance, manpower, and equipment are reviewed in full before the price is written.',
  localScope: 'Moves inside one branch territory and regional runs between the two branch territories along I-81, I-66, and I-70.',
};
ops.process = store.process;
ops.completedJob = {
  '@type': 'Service',
  name: 'Winchester residential move with a very heavy item',
  areaServed: 'Winchester, VA',
  description: 'A Winchester, VA residential move that included a very heavy item, carried professionally and placed exactly where the customers wanted it; the customers rated the move five stars on the branch\u2019s public Google profile.',
  evidence: 'Public Google review on the Winchester branch profile; the review itself is carried as a Review node in the entity graph. Recorded at city level only, per the estate\u2019s privacy rules.',
};

// 3. research Dataset node
const research = {
  '@id': NEW + 'research',
  '@type': 'Dataset',
  name: 'Local & Regional Moving \u2014 Research Layer',
  description: 'The sourced research layer under the local and regional category: nine claims verified against primary sources on 2026-11-05 (Virginia and West Virginia mover law, the FMCSA federal/state split, NIOSH/OSHA lifting science, and VDOT corridor operating data), the six buyer personas as data rows, and the twenty-five buyer-intent terms the category\u2019s rubric family carries. Every figure is quoted with its scope and never extended.',
  keywords: ['virginia mover law', 'certificate of fitness', 'flat rate estimate virginia', 'local movers', 'buyer intent'],
  about: { '@id': 'https://theflatratemovers.com/#service-local-regional' },
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

// 4. sources Article node
const cite = (name, url) => ({ '@type': 'CreativeWork', name, url });
const sources = {
  '@id': NEW + 'sources',
  '@type': 'Article',
  name: 'Local & Regional Moving \u2014 Primary Sources',
  headline: 'The primary sources under the local and regional research layer',
  description: 'Every factual claim in the research layer traces to one of these primary sources, read in full on 2026-11-05: the Virginia Code\u2019s household-goods article, the West Virginia Code and PSC rules, FMCSA\u2019s own consumer guidance, the NIOSH lifting-equation manual, OSHA\u2019s materials-handling guidance, and VDOT\u2019s I-81 corridor plan.',
  keywords: ['primary sources', 'virginia code', 'fmcsa', 'niosh', 'vdot'],
  about: { '@id': 'https://theflatratemovers.com/#service-local-regional' },
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
    cite('Va. Code Title 46.2, Chapter 21, Article 4 \u2014 Household Goods Carriers (LIS)', 'https://law.lis.virginia.gov/vacodefull/title46.2/chapter21/article4/'),
    cite('Va. Code Title 46.2, Chapter 21 (incl. \u00a746.2-2101(C) financial responsibility) (LIS)', 'https://law.lis.virginia.gov/vacodefull/title46.2/chapter21/'),
    cite('Virginia DMV Form OA 142 \u2014 Application for Certificate of Fitness (Forms E and H filings)', 'https://dmv.am.virginia.gov/sites/default/files/oa142.pdf'),
    cite('W. Va. Code Chapter 24A \u2014 Motor Carriers (incl. \u00a724A-2-3, \u00a724A-2-5)', 'https://code.wvlegislature.gov/email/24A/'),
    cite('150 CSR 9 \u2014 Rules Governing Motor Carriers and Insurance Filings (WV Secretary of State)', 'https://apps.sos.wv.gov/adlaw/csr/rule.aspx?rule=150-09'),
    cite('FMCSA FAQ \u2014 Protect Your Move (the federal/state split)', 'https://www.fmcsa.dot.gov/faq?keyword=&term_node_tid_depth=23066'),
    cite('NIOSH Publication No. 94-110 \u2014 Applications Manual for the Revised NIOSH Lifting Equation (51 lb load constant)', 'https://stacks.cdc.gov/view/cdc/191840/cdc_191840_DS1.pdf'),
    cite('OSHA eTool \u2014 Materials Handling: Heavy Lifting', 'https://www.osha.gov/etools/electrical-contractors/materials-handling/heavy'),
    cite('VDOT \u2014 I-81 Corridor Improvement Plan Final Report (January 2026)', 'https://www.vdot.virginia.gov/media/improve81/documentsacc/corridor-improvement-plan/VDOT-I-81-Corridor-Improvement-Plan-Final-Report_acc01142026.pdf'),
  ],
};

// 5. boundaries Service node
const boundaries = {
  '@id': NEW + 'boundaries',
  '@type': 'Service',
  name: 'Local & Regional \u2014 Jurisdiction Boundaries',
  description: 'The scope boundaries of the local and regional category stated as data: three rulebooks operate inside one service area. A move that stays inside Virginia is Virginia-intrastate (DMV certificate of fitness, filed tariffs, the bound-estimate rule, the 30/120-day claims clock). A move that stays inside West Virginia is WV-intrastate (PSC certificate, PSC rate regulation, 150 CSR 9 insurance filings). Any move that crosses a state line \u2014 including the short Winchester-to-Martinsburg run \u2014 is interstate and federal (49 CFR Part 375), performed by contractors holding their own operating authority.',
  keywords: ['intrastate', 'interstate', 'jurisdiction', 'virginia dmV', 'wv psc'],
  about: { '@id': 'https://theflatratemovers.com/#service-local-regional' },
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
console.log('WROTE', FILE, '\u2014 11 nodes (8 re-keyed + research/sources/boundaries); claims 9, personas 6, terms 25, boundaries 3');
