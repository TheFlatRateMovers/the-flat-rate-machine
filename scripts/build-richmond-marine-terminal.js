#!/usr/bin/env node
'use strict';
/*
 * build-richmond-marine-terminal.js — Ports Completion batch
 * (2026-11-10): the Richmond Marine Terminal per-port dataset
 * (datasets-richmond-marine-terminal.json). Same shape as
 * build-port-of-huntington.js: the port Place node is re-seated
 * verbatim from the sealed master (datasets-ports.json), so run
 * build-ports.js first. The terminal leaves the Port of
 * Virginia file in this batch (owner-directed, audit §4.5).
 * No standalone volume is published. Sources: audit §4.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = process.env.PAGES_PUBLIC || path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const SITE = 'https://theflatratemovers.com';
const LANDING = SITE + '/datasets/richmond-marine-terminal/';
const FILE_URL = SITE + '/datasets-richmond-marine-terminal.json';
const PUBLISHED = '2026-11-10';
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const ORG = { '@type': 'Organization', '@id': SITE + '/#organization', 'name': 'The Flat Rate Movers LLC', 'url': SITE + '/' };

const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ports.json'), 'utf8'));
const port = (db.ports || []).find((p) => p.id === 'port-richmond-marine-terminal');
if (!port) { console.error('build-richmond-marine-terminal: FAIL — port record missing'); process.exit(1); }
const cells = (db.serviceCoverage || []).filter((c) => c.port === port.id);
if (cells.length !== 8) { console.error('build-richmond-marine-terminal: FAIL — coverage cells = ' + cells.length); process.exit(1); }

const master = JSON.parse(fs.readFileSync(path.join(PUB, 'datasets-ports.json'), 'utf8'));
const masterPlace = (master['@graph'] || []).find((n) => n['@id'] === SITE + '/datasets/ports/#' + port.id);
if (!masterPlace) { console.error('build-richmond-marine-terminal: FAIL — master Place node missing (run build-ports.js first)'); process.exit(1); }
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

const selfDownload = { '@type': 'DataDownload', 'name': 'datasets-richmond-marine-terminal.json — this file', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' };
const catalogRef = { '@type': 'DataCatalog', '@id': SITE + '/datasets/#collection', 'name': 'The Flat Rate Movers — AI Authority Estate Datasets', 'url': SITE + '/datasets/' };

const rootDataset = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-richmond-marine-terminal',
  'name': 'Richmond Marine Terminal Logistics Dataset',
  'description': 'The per-port dataset for Richmond Marine Terminal in the Ports & Intermodal program of The Flat Rate Movers: the full port record for the James River barge terminal at 5000 Deepwater Terminal Rd, Richmond, VA — owned by the City of Richmond, leased by the Virginia Port Authority under a 40-year lease signed 2016 (to 2056) and operated by Virginia International Terminals, LLC as part of the Port of Virginia system — 124 acres with 300,000 sq ft of storage, a mobile harbor crane in the 124-ton class, three reefer plugs, a Monday-Friday 0700-1600 gate, on-terminal transload and cross-docking, CSX direct rail with Norfolk Southern via local switch, and the Richmond Express (64 Express) barge service: three barges in rotation, 500 FEU combined capacity, running six days a week with about a 12-hour overnight transit to Norfolk International Terminals, the Virginia International Gateway and Portsmouth Marine Terminal. No standalone annual volume is published for this terminal. The I-95, I-64, I-85 and I-295 corridors, and the branch binding: the terminal is served from the Winchester, VA branch, about 135 road miles away (Martinsburg measures about 158). The company\'s eight attached port services are recorded cell by cell in the companion coverage dataset. No port tenancy or port-authority relationship is claimed; the company\'s crews hold TWIC cards and its contractors hold valid TWIC cards.',
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
  'keywords': 'Richmond Marine Terminal, RMT, Port of Virginia, Virginia Port Authority, Virginia International Terminals, Richmond Express, 64 Express, James River barge, Deepwater Terminal, barge containers, transloading, cross-docking, freight rework, Winchester VA',
  'about': [{ '@id': SITE + '/#service-transloading' }, { '@id': SITE + '/#service-freight-rework-transloading' }],
  'distribution': [selfDownload],
  'isPartOf': { '@id': SITE + '/datasets/ports/#dataset-ports' },
};

const coverageDataset = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-richmond-marine-terminal-coverage',
  'name': 'Richmond Marine Terminal Service Coverage Dataset',
  'description': 'The service-coverage cells for the Richmond Marine Terminal in the Ports & Intermodal program: the eight attached services (transloading; ocean container packing and unpacking; loading and unloading / container labor; cross-docking; freight rework; specialized workforce; logistics project management; 3PL support services), each recorded as offered with its delivery points (port-adjacent warehouse, receiver\'s dock, yard, leased space, and on-terminal by arrangement — on-terminal work happens only by arrangement through the terminal\'s own processes, never as a bare claim) and its bound branch, Winchester, VA. Drayage is not offered at any port in the program.',
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
  'keywords': 'service coverage, Richmond Marine Terminal, delivery points, branch binding, transloading coverage, Winchester, VA',
  'additionalProperty': [{ '@type': 'PropertyValue', 'name': 'coverageMatrix', 'value': JSON.stringify(cells) }],
  'distribution': [selfDownload],
};

const doc = { '@context': 'https://schema.org', '@graph': [rootDataset, coverageDataset, placeNode] };
const out = path.join(PUB, 'datasets-richmond-marine-terminal.json');
fs.writeFileSync(out, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE ' + out + ' — nodes: ' + doc['@graph'].length + ' | cells: ' + cells.length);
