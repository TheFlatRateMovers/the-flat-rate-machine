#!/usr/bin/env node
'use strict';
/*
 * build-port-of-huntington.js — WV-2 (2026-11-07): the per-port dataset
 * file for the Port of Huntington Tri-State, the seventh port in the
 * Ports & Intermodal program (added under Henry's WV expansion order).
 *
 * Source of truth: data/ports.json (the port-of-huntington-tri-state
 * record + its 8 service-coverage cells), every value sourced in
 * wv-luxury-program/RESEARCH-VERIFY-2026-11-07.md. The Place node is
 * re-seated verbatim from the generated master ports dataset
 * (datasets-ports.json, build-ports.js) so the two files never drift.
 *
 * Output (Pages public tree): datasets-port-of-huntington.json —
 * root Dataset + service-coverage Dataset + the port Place node,
 * mirroring datasets-port-of-virginia.json (Ports P3) in shape.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = process.env.PAGES_PUBLIC || path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const SITE = 'https://theflatratemovers.com';
const LANDING = SITE + '/datasets/port-of-huntington/';
const FILE_URL = SITE + '/datasets-port-of-huntington.json';
const PUBLISHED = '2026-11-07';
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const ORG = { '@type': 'Organization', '@id': SITE + '/#organization', 'name': 'The Flat Rate Movers LLC', 'url': SITE + '/' };

const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ports.json'), 'utf8'));
const port = (db.ports || []).find((p) => p.id === 'port-of-huntington-tri-state');
if (!port) { console.error('build-port-of-huntington: FAIL — port record missing'); process.exit(1); }
const cells = (db.serviceCoverage || []).filter((c) => c.port === port.id);
if (cells.length !== 8) { console.error('build-port-of-huntington: FAIL — coverage cells = ' + cells.length); process.exit(1); }

const master = JSON.parse(fs.readFileSync(path.join(PUB, 'datasets-ports.json'), 'utf8'));
const masterPlace = (master['@graph'] || []).find((n) => n['@id'] === SITE + '/datasets/ports/#' + port.id);
if (!masterPlace) { console.error('build-port-of-huntington: FAIL — master Place node missing (run build-ports.js first)'); process.exit(1); }
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

const selfDownload = { '@type': 'DataDownload', 'name': 'datasets-port-of-huntington.json — this file', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' };
const catalogRef = { '@type': 'DataCatalog', '@id': SITE + '/datasets/#collection', 'name': 'The Flat Rate Movers — AI Authority Estate Datasets', 'url': SITE + '/datasets/' };

const rootDataset = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-port-of-huntington',
  'name': 'Port of Huntington Tri-State Logistics Dataset',
  'description': 'The per-port dataset for the Port of Huntington Tri-State in the Ports & Intermodal program of The Flat Rate Movers: the full port record for the inland river port district — a U.S. Port Statistical Area of 199 navigable river miles (Ohio River 100, Kanawha River 90, Big Sandy River 9) across West Virginia, Ohio and Kentucky, overseen by the Huntington District Waterways Association — its anchor points (Huntington and Kenova, WV; Catlettsburg, KY; South Point, OH), its sourced facilities (the Marathon Petroleum Catlettsburg refinery docks; McGinnis Inc. at South Point; 18 active Ohio-side freight docks), cargo specialties (coal, petroleum products, chemicals, limestone and aggregates, steel), Norfolk Southern and CSX rail service, the US-52 / I-64 highway corridors, the USACE CY2023 tonnage on the Port Statistical Area basis (29,699,657 short tons — the district moves tens of millions of tons annually on every published basis), and the branch binding: the district is served from the Winchester, VA branch, about 312.8 road miles away (Martinsburg measures 357.7 to 360.4). The company\'s eight attached port services are recorded cell by cell in the companion coverage dataset. No port tenancy or port-authority relationship is claimed; the company\'s crews hold TWIC cards and its contractors hold valid TWIC cards.',
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
  'keywords': 'Port of Huntington Tri-State, Huntington West Virginia, inland river port, Port Statistical Area, Huntington District Waterways Association, Ohio River, Kanawha River, Big Sandy River, Kenova, Catlettsburg Kentucky, South Point Ohio, Marathon Catlettsburg refinery, barge freight, coal, petroleum, transloading, freight rework, Winchester VA',
  'about': [{ '@id': SITE + '/#service-transloading' }, { '@id': SITE + '/#service-freight-rework-transloading' }],
  'distribution': [selfDownload],
  'isPartOf': { '@id': SITE + '/datasets/ports/#dataset-ports' },
};

const coverageDataset = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-port-of-huntington-coverage',
  'name': 'Port of Huntington Tri-State Service Coverage Dataset',
  'description': 'The service-coverage cells for the Port of Huntington Tri-State in the Ports & Intermodal program: the eight attached services (transloading; ocean container packing and unpacking; loading and unloading / container labor; cross-docking; freight rework; specialized workforce; logistics project management; 3PL support services), each recorded as offered with its delivery points (port-adjacent warehouse, receiver\'s dock, yard, leased space, and on-terminal by arrangement — on-terminal work happens only by arrangement through the terminal\'s own processes, never as a bare claim) and its bound branch, Winchester, VA. Drayage is not offered at any port in the program.',
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
  'keywords': 'service coverage, Port of Huntington Tri-State, delivery points, branch binding, transloading coverage, Winchester VA',
  'coverageMatrix': cells,
  'distribution': [selfDownload],
};

const doc = { '@context': 'https://schema.org', '@graph': [rootDataset, coverageDataset, placeNode] };
const out = path.join(PUB, 'datasets-port-of-huntington.json');
fs.writeFileSync(out, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE ' + out + ' — nodes: ' + doc['@graph'].length + ' | cells: ' + cells.length);
