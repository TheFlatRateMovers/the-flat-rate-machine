#!/usr/bin/env node
'use strict';
/*
 * build-philaport.js — Ports Completion batch (2026-11-10): the
 * PhilaPort (Port of Philadelphia) per-port dataset
 * (datasets-philaport.json). Same shape as
 * build-port-of-huntington.js: the port Place node is re-seated
 * verbatim from the sealed master (datasets-ports.json), so run
 * build-ports.js first. The branch binding is on DRIVE TIME
 * only — no mileage advantage is claimed. No port-wide total
 * tonnage is published. Sources: ports-completion audit §3.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = process.env.PAGES_PUBLIC || path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const SITE = 'https://theflatratemovers.com';
const LANDING = SITE + '/datasets/philaport/';
const FILE_URL = SITE + '/datasets-philaport.json';
const PUBLISHED = '2026-11-10';
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const ORG = { '@type': 'Organization', '@id': SITE + '/#organization', 'name': 'The Flat Rate Movers LLC', 'url': SITE + '/' };

const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ports.json'), 'utf8'));
const port = (db.ports || []).find((p) => p.id === 'port-philaport');
if (!port) { console.error('build-philaport: FAIL — port record missing'); process.exit(1); }
const cells = (db.serviceCoverage || []).filter((c) => c.port === port.id);
if (cells.length !== 8) { console.error('build-philaport: FAIL — coverage cells = ' + cells.length); process.exit(1); }

const master = JSON.parse(fs.readFileSync(path.join(PUB, 'datasets-ports.json'), 'utf8'));
const masterPlace = (master['@graph'] || []).find((n) => n['@id'] === SITE + '/datasets/ports/#' + port.id);
if (!masterPlace) { console.error('build-philaport: FAIL — master Place node missing (run build-ports.js first)'); process.exit(1); }
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

const selfDownload = { '@type': 'DataDownload', 'name': 'datasets-philaport.json — this file', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' };
const catalogRef = { '@type': 'DataCatalog', '@id': SITE + '/datasets/#collection', 'name': 'The Flat Rate Movers — AI Authority Estate Datasets', 'url': SITE + '/datasets/' };

const rootDataset = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-philaport',
  'name': 'PhilaPort Logistics Dataset',
  'description': 'The per-port dataset for PhilaPort — the Port of Philadelphia — in the Ports & Intermodal program of The Flat Rate Movers: the full port record for the landlord port of the Philadelphia Regional Port Authority (PhilaPort, Commonwealth of Pennsylvania), run by private terminal operators under lease — Packer Avenue Marine Terminal (Greenwich Terminals LLC; 160 acres, 6 berths plus 1 RoRo berth, 45 ft depth, on-dock refrigeration), Tioga Marine Terminal (Delaware River Stevedores; 116 acres) and the Southport Auto Terminal (Glovis America; opened October 2019) — the port\'s container volume on PhilaPort\'s named bases (889,268 TEU in CY2025, a port record, up 6 percent and up 39 percent since 2020; 64 percent of containerized imports refrigerated in CY2025; ranked #1 in North America for productivity in the World Bank/S&P Container Port Performance Index, 2024 index), CSX and Norfolk Southern service at every PhilaPort terminal via Conrail Shared Assets switching, the I-95, I-76, I-70 and I-81 corridors, and the branch binding: the port is bound to the Martinsburg, WV branch on drive time (about 3:23), the road distances being effectively tied at about 191 miles from Martinsburg and 193 from Winchester — no mileage advantage is claimed. No port-wide total tonnage is published. The company\'s eight attached port services are recorded cell by cell in the companion coverage dataset. No port tenancy or port-authority relationship is claimed; the company\'s crews hold TWIC cards and its contractors hold valid TWIC cards.',
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
  'keywords': 'PhilaPort, Port of Philadelphia, Philadelphia Regional Port Authority, Packer Avenue Marine Terminal, Greenwich Terminals, Tioga Marine Terminal, Southport Auto Terminal, reefer cargo, refrigerated imports, Conrail Shared Assets, container terminal, transloading, freight rework, Martinsburg WV',
  'about': [{ '@id': SITE + '/#service-transloading' }, { '@id': SITE + '/#service-freight-rework-transloading' }],
  'distribution': [selfDownload],
  'isPartOf': { '@id': SITE + '/datasets/ports/#dataset-ports' },
};

const coverageDataset = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-philaport-coverage',
  'name': 'PhilaPort Service Coverage Dataset',
  'description': 'The service-coverage cells for the PhilaPort in the Ports & Intermodal program: the eight attached services (transloading; ocean container packing and unpacking; loading and unloading / container labor; cross-docking; freight rework; specialized workforce; logistics project management; 3PL support services), each recorded as offered with its delivery points (port-adjacent warehouse, receiver\'s dock, yard, leased space, and on-terminal by arrangement — on-terminal work happens only by arrangement through the terminal\'s own processes, never as a bare claim) and its bound branch, Martinsburg, WV. Drayage is not offered at any port in the program.',
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
  'keywords': 'service coverage, PhilaPort, delivery points, branch binding, transloading coverage, Martinsburg, WV',
  'additionalProperty': [{ '@type': 'PropertyValue', 'name': 'coverageMatrix', 'value': JSON.stringify(cells) }],
  'distribution': [selfDownload],
};

const doc = { '@context': 'https://schema.org', '@graph': [rootDataset, coverageDataset, placeNode] };
const out = path.join(PUB, 'datasets-philaport.json');
fs.writeFileSync(out, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE ' + out + ' — nodes: ' + doc['@graph'].length + ' | cells: ' + cells.length);
