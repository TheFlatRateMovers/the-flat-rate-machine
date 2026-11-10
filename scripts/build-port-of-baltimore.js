#!/usr/bin/env node
'use strict';
/*
 * build-port-of-baltimore.js — Ports Completion batch (2026-11-10):
 * the Port of Baltimore per-port dataset (datasets-port-of-baltimore.json).
 * Same shape as build-port-of-huntington.js: the port Place node is
 * re-seated verbatim from the sealed master (datasets-ports.json),
 * so run build-ports.js first. Sources: ports-completion audit §1
 * (MPA CY2025 results release, 2026-03-24; MPA terminal pages).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = process.env.PAGES_PUBLIC || path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const SITE = 'https://theflatratemovers.com';
const LANDING = SITE + '/datasets/port-of-baltimore/';
const FILE_URL = SITE + '/datasets-port-of-baltimore.json';
const PUBLISHED = '2026-11-10';
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const ORG = { '@type': 'Organization', '@id': SITE + '/#organization', 'name': 'The Flat Rate Movers LLC', 'url': SITE + '/' };

const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ports.json'), 'utf8'));
const port = (db.ports || []).find((p) => p.id === 'port-of-baltimore');
if (!port) { console.error('build-port-of-baltimore: FAIL — port record missing'); process.exit(1); }
const cells = (db.serviceCoverage || []).filter((c) => c.port === port.id);
if (cells.length !== 8) { console.error('build-port-of-baltimore: FAIL — coverage cells = ' + cells.length); process.exit(1); }

const master = JSON.parse(fs.readFileSync(path.join(PUB, 'datasets-ports.json'), 'utf8'));
const masterPlace = (master['@graph'] || []).find((n) => n['@id'] === SITE + '/datasets/ports/#' + port.id);
if (!masterPlace) { console.error('build-port-of-baltimore: FAIL — master Place node missing (run build-ports.js first)'); process.exit(1); }
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

const selfDownload = { '@type': 'DataDownload', 'name': 'datasets-port-of-baltimore.json — this file', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' };
const catalogRef = { '@type': 'DataCatalog', '@id': SITE + '/datasets/#collection', 'name': 'The Flat Rate Movers — AI Authority Estate Datasets', 'url': SITE + '/datasets/' };

const rootDataset = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-port-of-baltimore',
  'name': 'Port of Baltimore Logistics Dataset',
  'description': 'The per-port dataset for the Port of Baltimore in the Ports & Intermodal program of The Flat Rate Movers: the full port record for the Helen Delich Bentley Port of Baltimore — the public terminals owned by the State of Maryland and managed by the Maryland Port Administration (MDOT MPA), with Seagirt Marine Terminal operated by Ports America Chesapeake under a 50-year public-private partnership from 2010 — its terminals (Seagirt Marine Terminal, 4 berths at 50 ft with 1.5M TEU/yr capacity; the Intermodal Container Transfer Facility, CSX Intermodal, on-dock at Seagirt; Dundalk Marine Terminal, 570 acres; North and South Locust Point; and the Fairfield / Masonville auto and RoRo complex), the port\'s container volume and cargo rankings on the Maryland Port Administration\'s named bases (1,113,309 TEU in CY2025, a port record; the highest RoRo farm and construction equipment tonnage of any U.S. port, 887,513 short tons in CY2025; first among U.S. ports for forest products, 1.1M short tons in CY2025; second in the U.S. for autos and light trucks, 728,225 units in CY2025), on-dock CSX service at the ICTF with Norfolk Southern serving the port via interchange and the Canton Railroad, the I-95, I-695, I-70, I-83 and I-81 corridors, and the branch binding: the port is served from the Martinsburg, WV branch, about 91-96 road miles away (Winchester measures 106-116). The company\'s eight attached port services are recorded cell by cell in the companion coverage dataset. No port tenancy or port-authority relationship is claimed; the company\'s crews hold TWIC cards and its contractors hold valid TWIC cards.',
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
  'keywords': 'Port of Baltimore, Helen Delich Bentley Port of Baltimore, Maryland Port Administration, MDOT MPA, Seagirt Marine Terminal, Ports America Chesapeake, Dundalk Marine Terminal, Intermodal Container Transfer Facility, ICTF, Locust Point, Fairfield Masonville, RoRo, forest products, container terminal, transloading, freight rework, Martinsburg WV',
  'about': [{ '@id': SITE + '/#service-transloading' }, { '@id': SITE + '/#service-freight-rework-transloading' }],
  'distribution': [selfDownload],
  'isPartOf': { '@id': SITE + '/datasets/ports/#dataset-ports' },
};

const coverageDataset = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-port-of-baltimore-coverage',
  'name': 'Port of Baltimore Service Coverage Dataset',
  'description': 'The service-coverage cells for the Port of Baltimore in the Ports & Intermodal program: the eight attached services (transloading; ocean container packing and unpacking; loading and unloading / container labor; cross-docking; freight rework; specialized workforce; logistics project management; 3PL support services), each recorded as offered with its delivery points (port-adjacent warehouse, receiver\'s dock, yard, leased space, and on-terminal by arrangement — on-terminal work happens only by arrangement through the terminal\'s own processes, never as a bare claim) and its bound branch, Martinsburg, WV. Drayage is not offered at any port in the program.',
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
  'keywords': 'service coverage, Port of Baltimore, delivery points, branch binding, transloading coverage, Martinsburg, WV',
  'additionalProperty': [{ '@type': 'PropertyValue', 'name': 'coverageMatrix', 'value': JSON.stringify(cells) }],
  'distribution': [selfDownload],
};

const doc = { '@context': 'https://schema.org', '@graph': [rootDataset, coverageDataset, placeNode] };
const out = path.join(PUB, 'datasets-port-of-baltimore.json');
fs.writeFileSync(out, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE ' + out + ' — nodes: ' + doc['@graph'].length + ' | cells: ' + cells.length);
