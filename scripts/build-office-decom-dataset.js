#!/usr/bin/env node
'use strict';
/*
 * build-office-decom-dataset.js — Office Decommissioning & Liquidation
 * Takeover (2026-11-14): builds the category's dedicated dataset file
 * (datasets-office-decommissioning.json) from data/office-decom.json —
 * never hand-authored: summary + coverage Dataset nodes, one typed
 * Place node per program area, one typed Service node per area plus
 * the category Service node. GS-1 holds: areaServed seats carry typed
 * Place nodes only, never a Dataset. Dates ride the lastmod ledger.
 * Idempotent: a re-run over the same registry emits identical bytes.
 * NOT seal-resident (the category dataset builders are batch-run
 * generators too); run it in any batch that changes
 * data/office-decom.json or the category's page set.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = process.env.PAGES_PUBLIC || path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const SITE = 'https://theflatratemovers.com';
const LANDING = SITE + '/datasets/office-decommissioning/';
const FILE_URL = SITE + '/datasets-office-decommissioning.json';
const ORG = { '@type': 'Organization', '@id': SITE + '/#organization', 'name': 'The Flat Rate Movers LLC', 'url': SITE + '/' };
const { CATALOG } = require('./lib-constants.js');
const BRANCH_PLACES = [
  { '@type': 'Place', '@id': SITE + '/#winchester', 'name': 'The Flat Rate Movers — Winchester', 'geo': { '@type': 'GeoCoordinates', 'latitude': 39.18711576, 'longitude': -78.1668352 } },
  { '@type': 'Place', '@id': SITE + '/#martinsburg', 'name': 'Flat Rate Movers Martinsburg WV', 'geo': { '@type': 'GeoCoordinates', 'latitude': 39.48319665, 'longitude': -77.94760443 } },
];
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const PUBLISHED = '2026-11-14';

const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'office-decom.json'), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lastmod-ledger.json'), 'utf8'));
const DM = (ledger.urls && ledger.urls[FILE_URL]) || PUBLISHED;

const areas = [...db.areas].sort((a, b) => a.rank - b.rank);
const doors = db.doors;

function placeNode(a) {
  return {
    '@type': 'Place',
    '@id': LANDING + '#' + a.id,
    'name': a.name.replace(' (tier 2)', ''),
    'description': 'Office decommissioning market — ' + a.stockLabel + '. Served on contract runs from the Winchester, VA branch.',
    'geo': { '@type': 'GeoCoordinates', 'latitude': a.latitude, 'longitude': a.longitude },
    'address': { '@type': 'PostalAddress', 'addressLocality': a.name.replace(' (tier 2)', '').split(',')[0], 'addressRegion': a.state, 'postalCode': a.postalCode, 'addressCountry': 'US' },
    'additionalProperty': [
      { '@type': 'PropertyValue', 'name': 'officeStockAndVacancy', 'value': a.stockLabel },
      { '@type': 'PropertyValue', 'name': 'county', 'value': a.county },
    ],
  };
}

const places = areas.map(placeNode);
const placeRef = (a) => ({ '@id': LANDING + '#' + a.id });

const summary = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-office-decommissioning',
  'name': 'Office Decommissioning & Liquidation Dataset',
  'description': 'The dedicated dataset of the Office Decommissioning & Liquidation program of The Flat Rate Movers: one engagement — decommissioning, furniture and equipment removal, liquidation and value-recovery coordination, transport, storage, and broom-clean lease-surrender handback — at one flat rate in writing, across the six high-volume office markets of Washington DC and Northern Virginia: Downtown Washington DC, Crystal City / National Landing and Pentagon City in Arlington, Reston and Herndon, Tysons, Alexandria, and Bethesda MD. The dataset carries the six market Places with their office-stock and vacancy evidence, the ten service doors of the category (decommissioning services, liquidation, lease surrender, federal and GSA surrender, conversion cleanout, cubicle removal, cost, process, best-choice, and IT/e-waste coordination), the per-area Service nodes bound to the dedicated pages that own each market, and the coverage matrix of areas by doors. Liquidation in this program means removal plus value-recovery coordination and disposition — resale coordination, donation, recycling, disposal; the company does not buy furniture and does not pay cash for assets. Pricing is per job: one flat rate agreed in writing before work starts; no rate is published in this dataset.',
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
  'keywords': 'office decommissioning, office liquidation, office furniture liquidation, lease surrender cleanout, broom-clean handback, GSA lease surrender, federal office decommissioning, office conversion cleanout, cubicle removal, Washington DC, Crystal City, National Landing, Reston, Herndon, Tysons, Alexandria, Bethesda',
  'about': [
    { '@id': SITE + '/#service-office-moving' },
    { '@id': SITE + '/#service-industrial-offices' },
    { '@id': SITE + '/#service-government' },
    { '@id': SITE + '/#service-commercial' },
  ],
  'distribution': [
    { '@type': 'DataDownload', 'name': 'datasets-office-decommissioning.json — this file', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' },
  ],
};

const matrix = areas.map((a) => ({
  area: a.id,
  areaName: a.name.replace(' (tier 2)', ''),
  page: SITE + '/' + a.pageSlug + '/',
  branch: a.branch,
  doors: doors.map((d) => ({ door: d.id, label: d.label, service: d.service, offered: true })),
}));

const coverage = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-office-decommissioning-coverage',
  'name': 'Office Decommissioning Area × Door Coverage Matrix Dataset',
  'description': 'The coverage matrix of the Office Decommissioning & Liquidation program: six high-volume office markets by the ten service doors of the category — 60 cells, every cell offered, each bound to the dedicated page that owns the market and dispatched from the Winchester, VA branch on contract runs. The matrix is generated from data/office-decom.json by scripts/build-office-decom-dataset.js; it is the same matrix the program pages and the intent-rubric lane R41 are built from.',
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
  'keywords': 'office decommissioning coverage matrix, areas by service doors, Washington DC, Northern Virginia',
  'additionalProperty': [
    { '@type': 'PropertyValue', 'name': 'coverageMatrix', 'value': JSON.stringify(matrix) },
    { '@type': 'PropertyValue', 'name': 'cellCount', 'value': String(matrix.length * doors.length) },
  ],
  'distribution': [
    { '@type': 'DataDownload', 'name': 'datasets-office-decommissioning.json — this file', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' },
  ],
  'isPartOf': { '@id': LANDING + '#dataset-office-decommissioning' },
};

const categoryService = {
  '@type': 'Service',
  '@id': LANDING + '#service-office-decommissioning',
  'name': 'Office Decommissioning & Liquidation',
  'serviceType': 'Office decommissioning and liquidation',
  'description': 'Office decommissioning and liquidation as one engagement from The Flat Rate Movers: survey and written flat rate, furniture and equipment removal, cubicle and workstation teardown, liquidation and value-recovery coordination (resale coordination, donation, recycling, disposal — the company does not buy furniture), office IT and e-waste coordination through certified partners inside the same engagement, transport and storage of removed assets, and broom-clean handback at surrender condition. Own crews — the work is performed, not coordinated away.',
  'provider': { '@id': SITE + '/#organization' },
  'url': SITE + '/office-decommissioning/',
  'areaServed': areas.map(placeRef),
};

const areaServices = areas.map((a) => ({
  '@type': 'Service',
  '@id': LANDING + '#decom-' + a.id,
  'name': 'Office Decommissioning & Liquidation — ' + a.name.replace(' (tier 2)', ''),
  'serviceType': 'Office decommissioning and liquidation',
  'description': 'Office decommissioning, liquidation and lease-surrender handback in ' + a.placeQ + ' from The Flat Rate Movers — one engagement, own crews, one flat rate in writing: ' + a.driver + '. The dedicated page for this market is ' + SITE + '/' + a.pageSlug + '/',
  'provider': { '@id': SITE + '/#organization' },
  'url': SITE + '/' + a.pageSlug + '/',
  'areaServed': [placeRef(a)],
}));

const doc = { '@context': 'https://schema.org', '@graph': [summary, coverage, categoryService, ...areaServices, ...places] };
const out = JSON.stringify(doc, null, 1) + '\n';
const fp = path.join(PUB, 'datasets-office-decommissioning.json');
const prior = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : null;
fs.writeFileSync(fp, out);
console.log('datasets-office-decommissioning.json written:', out.length, 'bytes | nodes:', doc['@graph'].length, '| changed:', prior !== out);
