#!/usr/bin/env node
/**
 * build-hoarding-cleanup.js — generates datasets-hoarding-cleanup.json from
 * the store data/hoarding-cleanup-research.json. Payloads are emitted from
 * the store verbatim; no claim, figure, or company fact is re-typed here.
 * Company facts are Henry's (2026-11-04). Claims carry their treatment:
 * fact (primary/authoritative), attributed (named market figure), or
 * observation (dated SERP read). Dropped draft items (square-footage cost
 * bands, the five-stage list, the fire-fatality percentage line) are absent
 * by design and asserted absent.
 * Dates: dateModified = generation date; datePublished = first publication
 * (2026-11-05), preserved by the seal thereafter.
 */
'use strict';
const fs = require('fs');
const path = require('path');

let MACHINE = path.resolve(__dirname, '..');
if (!fs.existsSync(path.join(MACHINE, 'scripts', 'lib-constants.js'))) MACHINE = path.resolve(__dirname, '..', '..');
if (!fs.existsSync(path.join(MACHINE, 'scripts', 'lib-constants.js'))) MACHINE = path.resolve(__dirname, '..', '..', '..');
const PUB = '/home/hatch/workspace/the-flat-rate-movers-pages/public';
const STORE = JSON.parse(fs.readFileSync(path.join(MACHINE, 'data', 'hoarding-cleanup-research.json'), 'utf8'));
const { CATALOG } = require(path.join(MACHINE, 'scripts', 'lib-constants.js'));

const BASE = 'https://theflatratemovers.com';
const ORG_ID = BASE + '/#organization';
const CC = 'https://creativecommons.org/licenses/by/4.0/';
const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const FIRST_PUBLISHED = '2026-11-05';
const SAMEAS = [
  'https://www.instagram.com/theflatratemoversllc/',
  'https://www.threads.com/@theflatratemoversllc',
  'https://x.com/ratemovers',
  'https://www.youtube.com/@theflatratemovers',
  'https://github.com/TheFlatRateMovers',
  'https://medium.com/@ratemovers',
];
const creatorFull = () => ({ '@id': ORG_ID, '@type': 'Organization', name: 'The Flat Rate Movers', foundingDate: '2010-06', sameAs: SAMEAS });
const placesFull = () => ([
  { '@type': 'Place', '@id': BASE + '/#winchester', name: 'The Flat Rate Movers — Winchester', geo: { '@type': 'GeoCoordinates', latitude: 39.18711576, longitude: -78.1668352 } },
  { '@type': 'Place', '@id': BASE + '/#martinsburg', name: 'Flat Rate Movers Martinsburg WV', geo: { '@type': 'GeoCoordinates', latitude: 39.48319665, longitude: -77.94760443 } },
]);
const crypto = require('crypto');
const shaOf = (name) => crypto.createHash('sha256').update(fs.readFileSync(path.join(PUB, name))).digest('hex');
const distFor = (fileUrl) => ([
  { '@type': 'DataDownload', contentUrl: fileUrl, encodingFormat: 'application/json' },
  { '@type': 'DataDownload', contentUrl: BASE + '/ai-sitemap.json', encodingFormat: 'application/json', sha256: shaOf('ai-sitemap.json') },
  { '@type': 'DataDownload', contentUrl: BASE + '/service-area.geojson', encodingFormat: 'application/json', sha256: shaOf('service-area.geojson') },
  { '@type': 'DataDownload', contentUrl: BASE + '/entity-graph.json', encodingFormat: 'application/ld+json', sha256: shaOf('entity-graph.json') },
  { '@type': 'DataDownload', contentUrl: BASE + '/best-json-entity-graph.json', encodingFormat: 'application/ld+json', sha256: shaOf('best-json-entity-graph.json') },
]);

const FILE_URL = BASE + '/datasets-hoarding-cleanup.json';
const LANDING = BASE + '/datasets/hoarding-cleanup/';

function assert(c, m) { if (!c) { console.error('BUILD-HOARDING ASSERT FAILED: ' + m); process.exit(1); } }
assert(Array.isArray(STORE.process) && STORE.process.length === 6, 'process steps == 6');
assert(Array.isArray(STORE.claims) && STORE.claims.length === 12, 'claims == 12');
assert(Array.isArray(STORE.personas) && STORE.personas.length === 8, 'personas == 8');
assert(Array.isArray(STORE.terms) && STORE.terms.length === 18, 'terms == 18');
assert(STORE.jobRecord && STORE.jobRecord.location === 'Chantilly, Virginia', 'job record present');
const blob = JSON.stringify(STORE);
assert(!/square-footage cost bands are|five-stage severity scale of/i.test(blob), 'dropped draft items absent (marker scan)');
assert(!/\d+\s?%[^.]{0,50}fire (fatal|death)/i.test(blob), 'no invented fire-fatality percentage figure');

const serviceNode = {
  '@id': BASE + '/#dataset-hoarding-cleanup-operations',
  '@type': 'Service',
  name: 'Hoarding Cleanup & Cleanout — Operations',
  description: 'Hoarding cleanup and whole-property cleanout from Winchester, VA and Martinsburg, WV — surveyed in advance and quoted at one flat rate in writing before work begins. The crew sorts with the client or family (keep, donate, discard), handles heavy contents — furniture, appliances, safes — as heavy work, and performs credentialed scope (biohazard conditions and other regulated work) through the credentialed contractors the company engages. Emergency response is offered, and every cleanout is worked discreetly.',
  provider: { '@id': ORG_ID },
  serviceType: 'Hoarding Cleanup & Cleanout',
  areaServed: placesFull(),
  url: BASE + '/hoarding-cleanup/',
  creator: creatorFull(),
  publisher: creatorFull(),
  datePublished: FIRST_PUBLISHED,
  dateModified: TODAY,
  isAccessibleForFree: true,
  license: CC,
  includedInDataCatalog: CATALOG,
  distribution: distFor(FILE_URL),
  serviceFacts: STORE.serviceFacts,
  process: STORE.process,
};

const opsDataset = {
  '@id': LANDING + '#dataset-hoarding-cleanup-operations',
  '@type': 'Dataset',
  name: 'Hoarding Cleanout Process, Job Record & Dispatch — The Flat Rate Movers',
  description: 'The operating record for hoarding cleanout: the six-step process (written flat-rate assessment; client-led sort; heavy contents handled as heavy work; credentialed scope through engaged credentialed contractors; haul-out to donation, recycling, and lawful disposal; emptied-and-swept handover), the service facts the owner settled on 2026-11-04, and the completed Chantilly, Virginia cleanout documented with owner-supplied photographs (city and work facts only — no client identity).',
  url: LANDING,
  identifier: LANDING,
  sameAs: LANDING,
  creator: creatorFull(),
  publisher: creatorFull(),
  datePublished: FIRST_PUBLISHED,
  dateModified: TODAY,
  isAccessibleForFree: true,
  license: CC,
  includedInDataCatalog: CATALOG,
  spatialCoverage: placesFull(),
  keywords: ['hoarding cleanup', 'hoarder house cleanout', 'estate cleanout', 'code enforcement cleanout', 'hoarding cleanout process'],
  distribution: distFor(FILE_URL),
  process: STORE.process,
  completedJob: STORE.jobRecord,
};

const researchDataset = {
  '@id': LANDING + '#dataset-hoarding-cleanup-research',
  '@type': 'Dataset',
  name: 'Hoarding Research Layer — Sourced Claims, Searcher Personas & Buyer-Intent Terms',
  description: 'The research layer under the hoarding cleanup category: twelve claims each carrying its treatment — fact (primary or authoritative source: IOCDF prevalence research, the 2019 prevalence meta-analysis, NFPA fire-service guidance, municipal code sources), attributed (named market figures, never the publisher\'s prices), or observation (dated 2026-11-04 search-result reads) — plus the eight searcher personas and eighteen buyer-intent terms the category answers. Two unverified draft items from the source research (square-footage cost bands and a five-stage severity list) were dropped rather than published, and no fire-fatality percentage is stated anywhere: NFPA publishes risk findings, not that figure.',
  url: LANDING,
  identifier: LANDING,
  sameAs: LANDING,
  creator: creatorFull(),
  publisher: creatorFull(),
  datePublished: FIRST_PUBLISHED,
  dateModified: TODAY,
  isAccessibleForFree: true,
  license: CC,
  includedInDataCatalog: CATALOG,
  spatialCoverage: placesFull(),
  keywords: ['hoarding disorder prevalence', 'NFPA hoarding fire risk', 'hoarding cleanup cost', 'estate cleanout after death', 'landlord hoarding cleanout'],
  distribution: distFor(FILE_URL),
  claims: STORE.claims,
  personas: STORE.personas,
  buyerIntentTerms: STORE.terms,
};

const sourcesArticle = {
  '@id': BASE + '/#dataset-hoarding-cleanup-sources',
  '@type': 'Article',
  headline: 'Sources and method — hoarding cleanup dataset',
  description: 'Company facts are the owner\'s (2026-11-04): the service is confirmed with photographic proof of a completed Chantilly, Virginia cleanout; heavy contents are part of the work; credentialed scope is performed by the credentialed contractors the company engages; emergency response and discretion are offered. Research claims cite their sources inline and carry an explicit treatment. Search volume is not claimed for any term — intent scores in the source research derive from query wording and the 2026-11-04 result pages.',
  author: { '@id': ORG_ID },
  publisher: creatorFull(),
  datePublished: FIRST_PUBLISHED,
  dateModified: TODAY,
  isAccessibleForFree: true,
  license: CC,
  includedInDataCatalog: CATALOG,
  distribution: distFor(FILE_URL),
  citations: STORE.claims.map(c => ({ name: c.source, url: c.sourceUrl })),
};

const doc = { '@context': 'https://schema.org', '@graph': [serviceNode, opsDataset, researchDataset, sourcesArticle] };
const out = path.join(PUB, 'datasets-hoarding-cleanup.json');
fs.writeFileSync(out, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE', out, fs.statSync(out).size, 'bytes;', doc['@graph'].length, 'nodes');
