#!/usr/bin/env node
'use strict';
/*
 * build-port-of-wilmington.js — Ports Completion batch (2026-11-10):
 * the Port of Wilmington (DE) per-port dataset
 * (datasets-port-of-wilmington.json). Same shape as
 * build-port-of-huntington.js: the port Place node is re-seated
 * verbatim from the sealed master (datasets-ports.json), so run
 * build-ports.js first. NO volume is published for this port
 * (build-ports.js hard-fails if one appears). Sources:
 * ports-completion audit §2.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = process.env.PAGES_PUBLIC || path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const SITE = 'https://theflatratemovers.com';
const LANDING = SITE + '/datasets/port-of-wilmington/';
const FILE_URL = SITE + '/datasets-port-of-wilmington.json';
const PUBLISHED = '2026-11-10';
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const ORG = { '@type': 'Organization', '@id': SITE + '/#organization', 'name': 'The Flat Rate Movers LLC', 'url': SITE + '/' };

const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ports.json'), 'utf8'));
const port = (db.ports || []).find((p) => p.id === 'port-of-wilmington-de');
if (!port) { console.error('build-port-of-wilmington: FAIL — port record missing'); process.exit(1); }
const cells = (db.serviceCoverage || []).filter((c) => c.port === port.id);
if (cells.length !== 8) { console.error('build-port-of-wilmington: FAIL — coverage cells = ' + cells.length); process.exit(1); }

const master = JSON.parse(fs.readFileSync(path.join(PUB, 'datasets-ports.json'), 'utf8'));
const masterPlace = (master['@graph'] || []).find((n) => n['@id'] === SITE + '/datasets/ports/#' + port.id);
if (!masterPlace) { console.error('build-port-of-wilmington: FAIL — master Place node missing (run build-ports.js first)'); process.exit(1); }
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

const selfDownload = { '@type': 'DataDownload', 'name': 'datasets-port-of-wilmington.json — this file', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' };
const catalogRef = { '@type': 'DataCatalog', '@id': SITE + '/datasets/#collection', 'name': 'The Flat Rate Movers — AI Authority Estate Datasets', 'url': SITE + '/datasets/' };

const rootDataset = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-port-of-wilmington',
  'name': 'Port of Wilmington Logistics Dataset',
  'description': 'The per-port dataset for the Port of Wilmington (Delaware) in the Ports & Intermodal program of The Flat Rate Movers: the full port record for the deepwater port at 1 Hausel Rd, Wilmington, DE — owned by the Diamond State Port Corporation (State of Delaware) and operated by Enstructure since 31 July 2023 under a long-term concession (the former GT USA Wilmington / Gulftainer concession was cancelled) — North America\'s top port for imports of fresh fruit, bananas and juice concentrate, where Dole and Chiquita together handle more than 1M tons of bananas a year and Citrosuco operates the largest dockside juice terminal in the USA, with refrigerated cargo, breakbulk and project cargo and auto (RoRo) work at the main terminal, Norfolk Southern direct access per the operator (CSX serves the Wilmington area via Wilsmere Yard), the I-495, I-95 and I-295 corridors, the future Edgemoor / Delaware Container Terminal (137 acres, 45-ft depth, 1.2M TEU/yr at full build; groundbreaking 14 September 2026, opening targeted early 2029, litigation live), and the branch binding: the port is served from the Martinsburg, WV branch, about 150 road miles away (Winchester measures 165). No annual volume figure is published for this port — none is verified. The company\'s eight attached port services are recorded cell by cell in the companion coverage dataset. No port tenancy or port-authority relationship is claimed; the company\'s crews hold TWIC cards and its contractors hold valid TWIC cards.',
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
  'keywords': 'Port of Wilmington, Wilmington Delaware, Diamond State Port Corporation, Enstructure, fruit port, bananas, juice concentrate, reefer cargo, Edgemoor, Delaware Container Terminal, breakbulk, transloading, freight rework, Martinsburg WV',
  'about': [{ '@id': SITE + '/#service-transloading' }, { '@id': SITE + '/#service-freight-rework-transloading' }],
  'distribution': [selfDownload],
  'isPartOf': { '@id': SITE + '/datasets/ports/#dataset-ports' },
};

const coverageDataset = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-port-of-wilmington-coverage',
  'name': 'Port of Wilmington Service Coverage Dataset',
  'description': 'The service-coverage cells for the Port of Wilmington in the Ports & Intermodal program: the eight attached services (transloading; ocean container packing and unpacking; loading and unloading / container labor; cross-docking; freight rework; specialized workforce; logistics project management; 3PL support services), each recorded as offered with its delivery points (port-adjacent warehouse, receiver\'s dock, yard, leased space, and on-terminal by arrangement — on-terminal work happens only by arrangement through the terminal\'s own processes, never as a bare claim) and its bound branch, Martinsburg, WV. Drayage is not offered at any port in the program.',
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
  'keywords': 'service coverage, Port of Wilmington, delivery points, branch binding, transloading coverage, Martinsburg, WV',
  'additionalProperty': [{ '@type': 'PropertyValue', 'name': 'coverageMatrix', 'value': JSON.stringify(cells) }],
  'distribution': [selfDownload],
};

const doc = { '@context': 'https://schema.org', '@graph': [rootDataset, coverageDataset, placeNode] };
const out = path.join(PUB, 'datasets-port-of-wilmington.json');
fs.writeFileSync(out, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE ' + out + ' — nodes: ' + doc['@graph'].length + ' | cells: ' + cells.length);
