#!/usr/bin/env node
'use strict';
/*
 * build-port-of-new-york-new-jersey.js — Port #8 (2026-11-10): the
 * per-port dataset file for the Port of New York and New Jersey, the
 * eighth port in the Ports & Intermodal program.
 *
 * Source of truth: data/ports.json (the port-of-new-york-new-jersey
 * record + its 8 service-coverage cells), every value sourced in
 * out/batch-port-nynj-2026-11-10/AUDIT.md. The Place node is re-seated
 * verbatim from the generated master ports dataset
 * (datasets-ports.json, build-ports.js) so the two files never drift.
 *
 * Output (Pages public tree): datasets-port-of-new-york-new-jersey.json —
 * root Dataset + service-coverage Dataset + the port Place node,
 * mirroring datasets-port-of-huntington.json (WV-2) in shape.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = process.env.PAGES_PUBLIC || path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const SITE = 'https://theflatratemovers.com';
const LANDING = SITE + '/datasets/port-of-new-york-new-jersey/';
const FILE_URL = SITE + '/datasets-port-of-new-york-new-jersey.json';
const PUBLISHED = '2026-11-10';
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const ORG = { '@type': 'Organization', '@id': SITE + '/#organization', 'name': 'The Flat Rate Movers LLC', 'url': SITE + '/' };

const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ports.json'), 'utf8'));
const port = (db.ports || []).find((p) => p.id === 'port-of-new-york-new-jersey');
if (!port) { console.error('build-port-of-new-york-new-jersey: FAIL — port record missing'); process.exit(1); }
const cells = (db.serviceCoverage || []).filter((c) => c.port === port.id);
if (cells.length !== 8) { console.error('build-port-of-new-york-new-jersey: FAIL — coverage cells = ' + cells.length); process.exit(1); }

const master = JSON.parse(fs.readFileSync(path.join(PUB, 'datasets-ports.json'), 'utf8'));
const masterPlace = (master['@graph'] || []).find((n) => n['@id'] === SITE + '/datasets/ports/#' + port.id);
if (!masterPlace) { console.error('build-port-of-new-york-new-jersey: FAIL — master Place node missing (run build-ports.js first)'); process.exit(1); }
const placeNode = JSON.parse(JSON.stringify(masterPlace));
placeNode['@id'] = LANDING + '#' + port.id;
placeNode.sameAs = SITE + '/datasets/ports/#' + port.id;

// Branch spatialCoverage: the estate's two full branch Place objects,
// reused verbatim from the white-glove dataset file (estate standard).
const wg = JSON.parse(fs.readFileSync(path.join(PUB, 'datasets-white-glove.json'), 'utf8'));
const wgDataset = (wg['@graph'] || []).find((n) => n['@type'] === 'Dataset' && Array.isArray(n.spatialCoverage));
const BRANCH_PLACES = wgDataset.spatialCoverage;

let dm = PUBLISHED;
try {
  const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lastmod-ledger.json'), 'utf8'));
  dm = (ledger.urls && ledger.urls[FILE_URL]) || PUBLISHED;
} catch (_) { /* first build */ }

const selfDownload = { '@type': 'DataDownload', 'name': 'datasets-port-of-new-york-new-jersey.json — this file', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' };
const catalogRef = { '@type': 'DataCatalog', '@id': SITE + '/datasets/#collection', 'name': 'The Flat Rate Movers — AI Authority Estate Datasets', 'url': SITE + '/datasets/' };

const rootDataset = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-port-of-new-york-new-jersey',
  'name': 'Port of New York and New Jersey Logistics Dataset',
  'description': 'The per-port dataset for the Port of New York and New Jersey in the Ports & Intermodal program of The Flat Rate Movers: the full port record for the largest container port on the U.S. East Coast and the third-largest in the nation — a landlord port owned by The Port Authority of New York and New Jersey (a bi-state authority established in 1921) and run by private terminal operators under long-term leases — its container terminals (Maher Terminals and APM Terminals Elizabeth at Elizabeth–Port Authority Marine Terminal; Port Newark Container Terminal at Port Newark; Port Liberty Bayonne at Port Jersey; Port Liberty New York at Howland Hook, Staten Island; Red Hook Container Terminal in Brooklyn), the Port Newark auto terminal (FAPS), its 50-foot harbor channel, its container volume on the Port Authority\'s named bases (8,897,531 TEU in CY2025; 8,698,526 TEU in CY2024), ExpressRail service by the two Class I partners CSX and Norfolk Southern with Conrail Shared Assets switching, the I-95 (New Jersey Turnpike), I-78, I-287 and US-1/9 corridors, Foreign-Trade Zone 49, and the branch binding: the port is served from the Martinsburg, WV branch, about 251.1 road miles away (Winchester measures 275.6). The company\'s eight attached port services are recorded cell by cell in the companion coverage dataset. No port tenancy or port-authority relationship is claimed; the company\'s crews hold TWIC cards and its contractors hold valid TWIC cards.',
  'url': LANDING,
  'sameAs': LANDING,
  'identifier': LANDING,
  'isAccessibleForFree': true,
  'license': LICENSE,
  'creator': ORG,
  'publisher': ORG,
  'datePublished': PUBLISHED,
  'dateModified': dm,
  'includedInDataCatalog': catalogRef,
  'spatialCoverage': BRANCH_PLACES,
  'keywords': 'Port of New York and New Jersey, Port Authority of New York and New Jersey, PANYNJ, Port Newark, Elizabeth Marine Terminal, Maher Terminals, APM Terminals Elizabeth, Port Newark Container Terminal, Port Liberty Bayonne, Port Liberty New York, Howland Hook, Red Hook Container Terminal, FAPS, ExpressRail, container terminal, transloading, freight rework, Martinsburg WV',
  'about': [{ '@id': SITE + '/#service-transloading' }, { '@id': SITE + '/#service-freight-rework-transloading' }],
  'distribution': [selfDownload],
  'isPartOf': { '@id': SITE + '/datasets/ports/#dataset-ports' },
};

const coverageDataset = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-port-of-new-york-new-jersey-coverage',
  'name': 'Port of New York and New Jersey Service Coverage Dataset',
  'description': 'The service-coverage cells for the Port of New York and New Jersey in the Ports & Intermodal program: the eight attached services (transloading; ocean container packing and unpacking; loading and unloading / container labor; cross-docking; freight rework; specialized workforce; logistics project management; 3PL support services), each recorded as offered with its delivery points (port-adjacent warehouse, receiver\'s dock, yard, leased space, and on-terminal by arrangement — on-terminal work happens only by arrangement through the terminal\'s own processes, never as a bare claim) and its bound branch, Martinsburg, WV. Drayage is not offered at any port in the program.',
  'url': LANDING,
  'sameAs': LANDING,
  'identifier': LANDING,
  'isAccessibleForFree': true,
  'license': LICENSE,
  'creator': ORG,
  'publisher': ORG,
  'datePublished': PUBLISHED,
  'dateModified': dm,
  'includedInDataCatalog': catalogRef,
  'spatialCoverage': BRANCH_PLACES,
  'keywords': 'service coverage, Port of New York and New Jersey, delivery points, branch binding, transloading coverage, Martinsburg WV',
  'additionalProperty': [{ '@type': 'PropertyValue', 'name': 'coverageMatrix', 'value': JSON.stringify(cells) }],
  'distribution': [selfDownload],
};

const doc = { '@context': 'https://schema.org', '@graph': [rootDataset, coverageDataset, placeNode] };
const out = path.join(PUB, 'datasets-port-of-new-york-new-jersey.json');
fs.writeFileSync(out, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE ' + out + ' — nodes: ' + doc['@graph'].length + ' | cells: ' + cells.length);
