#!/usr/bin/env node
'use strict';
/*
 * build-warehouse-racking-dataset.js — Warehouse Racking +
 * Distribution-Center Decommissioning Takeover (2026-11-15): builds
 * the category's dedicated dataset file (datasets-warehouse-racking
 * .json) from data/warehouse-racking.json — never hand-authored:
 * summary + coverage Dataset nodes, one typed Place node per program
 * area, one typed Service node per area plus the category Service
 * node. GS-1 holds: areaServed seats carry typed Place references
 * only, never a Dataset. The two advantages settled by Henry on
 * 2026-11-15 ride every layer: used-rack buyback with the credit
 * shown as a line item against the fixed flat-rate total, and anchor
 * removal + slab patch named in the teardown sequence for a
 * landlord-ready handback. Dates ride the lastmod ledger.
 * Idempotent: a re-run over the same registry emits identical bytes.
 * NOT seal-resident (the category dataset builders are batch-run
 * generators too); run it in any batch that changes
 * data/warehouse-racking.json or the category's page set.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = process.env.PAGES_PUBLIC || path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const SITE = 'https://theflatratemovers.com';
const LANDING = SITE + '/datasets/warehouse-racking/';
const FILE_URL = SITE + '/datasets-warehouse-racking.json';
const ORG = { '@type': 'Organization', '@id': SITE + '/#organization', 'name': 'The Flat Rate Movers LLC', 'url': SITE + '/' };
const { CATALOG } = require('./lib-constants.js');
const BRANCH_PLACES = [
  { '@type': 'Place', '@id': SITE + '/#winchester', 'name': 'The Flat Rate Movers — Winchester', 'geo': { '@type': 'GeoCoordinates', 'latitude': 39.18711576, 'longitude': -78.1668352 } },
  { '@type': 'Place', '@id': SITE + '/#martinsburg', 'name': 'Flat Rate Movers Martinsburg WV', 'geo': { '@type': 'GeoCoordinates', 'latitude': 39.48319665, 'longitude': -77.94760443 } },
];
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const PUBLISHED = '2026-11-15';

const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'warehouse-racking.json'), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lastmod-ledger.json'), 'utf8'));
const DM = (ledger.urls && ledger.urls[FILE_URL]) || PUBLISHED;

const areas = [...db.areas].sort((a, b) => a.rank - b.rank);
const doors = db.doors;
const BRANCH_NAME = { winchester: 'the Winchester, VA branch', martinsburg: 'the Martinsburg, WV branch' };

function placeNode(a) {
  return {
    '@type': 'Place',
    '@id': LANDING + '#' + a.id,
    'name': a.name,
    'description': 'Warehouse racking and distribution-center decommissioning market — ' + a.stockLabel + '. Served on contract runs from ' + BRANCH_NAME[a.branch] + '.',
    'geo': { '@type': 'GeoCoordinates', 'latitude': a.latitude, 'longitude': a.longitude },
    'address': { '@type': 'PostalAddress', 'addressLocality': a.placeLabel.replace(/ (VA|WV|MD)$/, ''), 'addressRegion': a.state, 'postalCode': a.postalCode, 'addressCountry': 'US' },
    'additionalProperty': [
      { '@type': 'PropertyValue', 'name': 'industrialStockAndFacilities', 'value': a.stockLabel },
      { '@type': 'PropertyValue', 'name': 'county', 'value': a.county },
    ],
  };
}

const places = areas.map(placeNode);
const placeRef = (a) => ({ '@id': LANDING + '#' + a.id });

const summary = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset',
  'name': 'Warehouse Racking & Distribution-Center Decommissioning Dataset — I-81 Corridor',
  'description': 'The dedicated dataset of the Warehouse Racking + Distribution-Center Decommissioning program of The Flat Rate Movers: one engagement — pallet-rack teardown and removal, used-rack buyback with the credit shown as a line item against the fixed flat-rate total, anchor removal and slab patch for a landlord-ready handback, transport between buildings, reinstallation and re-anchoring, inventory and product relay — at one flat rate in writing, across the six distribution markets of the I-81 corridor: Hagerstown and Washington County MD, Winchester and Frederick County VA, Martinsburg and Berkeley County WV, Front Royal and Warren County VA, Harrisonburg and Rockingham County VA, and Staunton and Augusta County VA. The dataset carries the six market Places with their named industrial stock and sources, the eleven service doors of the category (decommissioning, rack teardown, racking relocation, reinstallation and re-anchoring, buyback, lease handback, inventory relay, transport, cost, process, and best-choice), the per-area Service nodes bound to the dedicated pages that own each market, and the coverage matrix of areas by doors. Pricing is per job: one flat rate agreed in writing before work starts; no per-bay or per-beam rate and no resale benchmark is published in this dataset.',
  'url': LANDING,
  'sameAs': LANDING,
  'identifier': LANDING,
  'isAccessibleForFree': true,
  'license': LICENSE,
  'creator': ORG,
  'publisher': ORG,
  'datePublished': PUBLISHED,
  'dateModified': DM,
  'includedInDataCatalog': { ...CATALOG },
  'spatialCoverage': BRANCH_PLACES,
  'keywords': 'warehouse racking relocation, pallet rack teardown and removal, distribution center decommissioning, used pallet rack buyback, anchor removal and slab patch, warehouse lease handback, rack reinstallation and re-anchoring, I-81 corridor, Hagerstown, Winchester, Martinsburg, Front Royal, Harrisonburg, Staunton',
  'about': [
    { '@id': SITE + '/#service-warehouse-racking-relocation' },
    { '@id': SITE + '/#service-warehouse-relocation' },
    { '@id': SITE + '/#service-industrial-commercial' },
    { '@id': SITE + '/#service-transloading' },
  ],
  'distribution': [
    { '@type': 'DataDownload', 'name': 'datasets-warehouse-racking.json — this file', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' },
  ],
};

const matrix = areas.map((a) => ({
  area: a.id,
  areaName: a.name,
  page: SITE + '/' + a.pageSlug + '/',
  branch: a.branch,
  doors: doors.map((d) => ({ door: d.id, label: d.label, service: d.service, offered: true })),
}));

const coverage = {
  '@type': 'Dataset',
  '@id': LANDING + '#coverage',
  'name': 'Warehouse Racking Coverage Matrix — 6 Areas x 11 Doors (66 Cells)',
  'description': 'The coverage matrix of the Warehouse Racking + Distribution-Center Decommissioning program: six I-81 corridor distribution markets by the eleven service doors of the category — 66 cells, every cell offered, each bound to the dedicated page that owns the market and dispatched from its corridor branch on contract runs. The matrix is generated from data/warehouse-racking.json by scripts/build-warehouse-racking-dataset.js; it is the same matrix the program pages and the intent-rubric lane R42 are built from.',
  'url': LANDING,
  'sameAs': LANDING,
  'identifier': LANDING,
  'isAccessibleForFree': true,
  'license': LICENSE,
  'creator': ORG,
  'publisher': ORG,
  'datePublished': PUBLISHED,
  'dateModified': DM,
  'includedInDataCatalog': { ...CATALOG },
  'spatialCoverage': BRANCH_PLACES,
  'keywords': 'warehouse racking coverage matrix, areas by service doors, I-81 corridor, distribution center decommissioning',
  'additionalProperty': [
    { '@type': 'PropertyValue', 'name': 'coverageMatrix', 'value': JSON.stringify(matrix) },
    { '@type': 'PropertyValue', 'name': 'cellCount', 'value': String(areas.length * doors.length) },
  ],
  'distribution': [
    { '@type': 'DataDownload', 'name': 'datasets-warehouse-racking.json — this file', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' },
  ],
  'isPartOf': { '@id': LANDING + '#dataset' },
};

const categoryService = {
  '@type': 'Service',
  '@id': LANDING + '#service-warehouse-racking-decommissioning',
  'name': 'Warehouse Racking & Distribution-Center Decommissioning',
  'serviceType': 'Warehouse racking relocation and distribution-center decommissioning',
  'description': db.offerSet,
  'provider': { '@id': SITE + '/#organization' },
  'url': SITE + '/distribution-center-decommissioning/',
  'areaServed': areas.map(placeRef),
};

const areaServices = areas.map((a) => ({
  '@type': 'Service',
  '@id': LANDING + '#svc-' + a.id,
  'name': 'Warehouse Racking & Distribution-Center Decommissioning — ' + a.placeLabel,
  'serviceType': 'Warehouse racking relocation and distribution-center decommissioning',
  'description': 'Distribution-center decommissioning and warehouse racking work in ' + a.placeQ + ' from The Flat Rate Movers — one engagement, own crews, one flat rate in writing: pallet-rack teardown and removal, used-rack buyback with the credit shown as a line item against the fixed flat-rate total, anchor removal and slab patch for a landlord-ready handback, transport, reinstallation and re-anchoring, and inventory relay. Local stock: ' + a.stockLabel + '. The dedicated page for this market is ' + SITE + '/' + a.pageSlug + '/',
  'provider': { '@id': SITE + '/#organization' },
  'url': SITE + '/' + a.pageSlug + '/',
  'areaServed': [placeRef(a)],
}));

const doc = { '@context': 'https://schema.org', '@graph': [summary, coverage, categoryService, ...areaServices, ...places] };
const out = JSON.stringify(doc, null, 1) + '\n';
const fp = path.join(PUB, 'datasets-warehouse-racking.json');
const prior = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : null;
fs.writeFileSync(fp, out);
console.log('datasets-warehouse-racking.json written:', out.length, 'bytes | nodes:', doc['@graph'].length, '| changed:', prior !== out);
