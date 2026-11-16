#!/usr/bin/env node
'use strict';
/*
 * build-logistics-dataset.js — Money Trio-6 scope addition
 * (2026-11-16): builds the dedicated dataset file for the
 * Logistics Project Management category
 * (datasets-logistics-project-management.json) from the machine
 * registries — data/ports.json (the 8 ports, the serviceCoverage
 * matrix, the branch bindingMap), data/services.json (the
 * category + bridge service descriptions) and
 * data/lastmod-ledger.json (dates). Never hand-authored: summary
 * + coverage Dataset nodes, one typed Place node per port, one
 * per-port Service node plus the category Service node and the
 * four bridge Service nodes (transloading, freight rework &
 * transloading, 3PL support, industrial & commercial /
 * specialized workforce). GS-1 holds: areaServed seats carry
 * typed Place nodes only, never a Dataset. The coverage matrix
 * is the ports.json serviceCoverage set (8 ports x 8 service
 * columns = 64 cells) with the registry's project types carried
 * as a named property. Dates ride the lastmod ledger.
 * Idempotent: a re-run over the same registries emits identical
 * bytes. Seal-resident in phase 0.5 (the build-ports /
 * build-coverage seat): the file backs intent-rubric rows, so
 * it must precede phase 1 like every rubric-backing generator.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = process.env.PAGES_PUBLIC || path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const SITE = 'https://theflatratemovers.com';
const LANDING = SITE + '/datasets/logistics-project-management/';
const FILE_URL = SITE + '/datasets-logistics-project-management.json';
const HUB = SITE + '/logistics-project-management/';
const ORG = { '@type': 'Organization', '@id': SITE + '/#organization', 'name': 'The Flat Rate Movers LLC', 'url': SITE + '/' };
const { CATALOG } = require('./lib-constants.js');
const BRANCH_PLACES = [
  { '@type': 'Place', '@id': SITE + '/#winchester', 'name': 'The Flat Rate Movers — Winchester', 'geo': { '@type': 'GeoCoordinates', 'latitude': 39.18711576, 'longitude': -78.1668352 } },
  { '@type': 'Place', '@id': SITE + '/#martinsburg', 'name': 'Flat Rate Movers Martinsburg WV', 'geo': { '@type': 'GeoCoordinates', 'latitude': 39.48319665, 'longitude': -77.94760443 } },
];
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const PUBLISHED = '2026-11-16';
const PROJECT_TYPES = ['container programs', 'warehouse load-outs', 'warehouse resets', 'surge programs', 'freight-rework campaigns', 'port-adjacent staging'];
const BRIDGE = [
  { col: ['TR', 'OC', 'LU'], svc: 'service-transloading', short: 'transloading', hub: SITE + '/transloading/' },
  { col: ['XD', 'RW'], svc: 'service-freight-rework-transloading', short: 'freight-rework', hub: SITE + '/freight-rework-transloading/' },
  { col: ['WF'], svc: 'service-industrial-commercial', short: 'specialized-workforce', hub: SITE + '/industrial-commercial-services/' },
  { col: ['3P'], svc: 'service-3pl-support', short: '3pl-support', hub: SITE + '/3pl-support-services/' },
];

const portsDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ports.json'), 'utf8'));
const servicesDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'services.json'), 'utf8'));
const pagesDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages.json'), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lastmod-ledger.json'), 'utf8'));
const DM = (ledger.urls && ledger.urls[FILE_URL]) || PUBLISHED;

const svcById = {};
for (const s of servicesDb.services || []) svcById[s.id] = s;
const pageUrls = new Set((pagesDb.pages || []).map((p) => p.url));
const ports = [...(portsDb.ports || [])];
const coverageRows = [...(portsDb.serviceCoverage || [])];
const binding = portsDb.bindingMap || {};

function fail(msg) { throw new Error('build-logistics-dataset: ' + msg); }
if (ports.length !== 8) fail('expected 8 ports in data/ports.json, found ' + ports.length);
if (!svcById['service-logistics-project-management']) fail('category service missing from services.json');
for (const b of BRIDGE) if (!svcById[b.svc]) fail('bridge service missing from services.json: ' + b.svc);
for (const u of [HUB, ...BRIDGE.map((b) => b.hub)]) if (!pageUrls.has(u)) fail('page missing from pages.json: ' + u);
const pmRows = coverageRows.filter((r) => r.service === 'service-logistics-project-management');
if (pmRows.length !== 8 || !pmRows.every((r) => r.offered === true)) fail('PM coverage rows must be 8 and all offered, found ' + pmRows.length);
if (coverageRows.length !== 64) fail('expected 64 serviceCoverage cells, found ' + coverageRows.length);

const branchCity = (b) => (b === 'martinsburg' ? 'Martinsburg, WV' : 'Winchester, VA');
const portRef = (p) => ({ '@id': LANDING + '#' + p.id });

function placeNode(p) {
  const bind = binding[p.id] || {};
  const pm = pmRows.find((r) => r.port === p.id) || {};
  return {
    '@type': 'Place',
    '@id': LANDING + '#' + p.id,
    'name': p.name,
    'description': p.portType + ' — ' + p.address.addressLocality + ', ' + p.address.addressRegion + '. Logistics projects at this port run from the ' + branchCity(bind.branch || pm.boundBranch) + ' branch (' + (bind.routeFromBindingBranch || 'route per the registry binding map') + ').',
    'geo': { '@type': 'GeoCoordinates', 'latitude': p.geo.latitude, 'longitude': p.geo.longitude },
    'address': { '@type': 'PostalAddress', 'streetAddress': p.address.streetAddress, 'addressLocality': p.address.addressLocality, 'addressRegion': p.address.addressRegion, 'postalCode': p.address.postalCode, 'addressCountry': 'US' },
    'additionalProperty': [
      { '@type': 'PropertyValue', 'name': 'portAuthority', 'value': p.authorityName },
      { '@type': 'PropertyValue', 'name': 'operator', 'value': p.operatorName },
      { '@type': 'PropertyValue', 'name': 'boundBranch', 'value': bind.branch || pm.boundBranch || '' },
      { '@type': 'PropertyValue', 'name': 'routeFromBindingBranch', 'value': bind.routeFromBindingBranch || '' },
      { '@type': 'PropertyValue', 'name': 'deliveryPoints', 'value': JSON.stringify(pm.deliveryPoints || []) },
    ],
  };
}

const places = ports.map(placeNode);

const summary = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-logistics-project-management',
  'name': 'Logistics Project Management Dataset',
  'description': 'The dedicated dataset of the Logistics Project Management program of The Flat Rate Movers: scoped project execution for port, warehouse and industrial projects — survey, full scope, crew and sequence planning, supervised execution and closeout — at one flat rate in writing, with a single point of contact at the branch each project binds to. The dataset carries the eight ports of the company\'s port registry as typed Places with their bound branches and road bindings, the per-port Logistics Project Management Service nodes bound to the program hub, the bridge services the program runs on (transloading and container services, freight rework and cross-docking, specialized workforce, and 3PL support), and the 64-cell coverage matrix of ports by service columns generated from data/ports.json. Project types: container programs, warehouse load-outs and resets, surge programs, freight-rework campaigns and port-adjacent staging. Port work runs on TWIC-carded crews — every individual sent onsite holds their own TWIC card and proper ID — dispatched 24/7 at contract scale. Scoped project execution only: the company does not sell transportation management, brokerage or drayage, and no rate is published in this dataset; pricing is per job, one flat rate agreed in writing before work starts.',
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
  'keywords': 'project logistics, logistics project management, logistics program management, turnkey project logistics, port project logistics, container programs, warehouse load-outs, warehouse resets, surge programs, freight-rework campaigns, port-adjacent staging, single point of contact, transloading, cross-docking, 3PL support, TWIC-carded labor, Winchester VA, Martinsburg WV, Port of Virginia, Virginia Inland Port',
  'about': [
    { '@id': SITE + '/#service-logistics-project-management' },
    { '@id': SITE + '/#service-transloading' },
    { '@id': SITE + '/#service-freight-rework-transloading' },
    { '@id': SITE + '/#service-3pl-support' },
    { '@id': SITE + '/#service-industrial-commercial' },
  ],
  'distribution': [
    { '@type': 'DataDownload', 'name': 'datasets-logistics-project-management.json — this file', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' },
  ],
};

const matrix = coverageRows.map((r) => ({
  port: r.port,
  serviceColumn: r.serviceColumn,
  serviceLabel: r.serviceLabel,
  service: r.service,
  offered: r.offered === true,
  boundBranch: r.boundBranch,
  deliveryPoints: r.deliveryPoints || [],
}));

const coverage = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-logistics-project-management-coverage',
  'name': 'Logistics Project Management Port × Service Coverage Matrix Dataset',
  'description': 'The coverage matrix of the Logistics Project Management program: the eight ports of the company port registry by the eight service columns of the ports × 3PL bridge — transloading, ocean container packing and unpacking, loading and unloading / container labor, cross-docking, freight rework, specialized workforce, logistics project management, and 3PL support services — 64 cells carrying the offered flag, the bound branch and the delivery points of each cell, generated from data/ports.json by scripts/build-logistics-dataset.js. It is the same matrix the program pages and the intent-rubric rows for this category are built from. Project types run under the program: container programs, warehouse load-outs and resets, surge programs, freight-rework campaigns and port-adjacent staging.',
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
  'keywords': 'logistics project management coverage matrix, ports by service columns, bound branch, delivery points, project logistics coverage',
  'additionalProperty': [
    { '@type': 'PropertyValue', 'name': 'coverageMatrix', 'value': JSON.stringify(matrix) },
    { '@type': 'PropertyValue', 'name': 'cellCount', 'value': String(matrix.length) },
    { '@type': 'PropertyValue', 'name': 'projectTypes', 'value': JSON.stringify(PROJECT_TYPES) },
  ],
  'distribution': [
    { '@type': 'DataDownload', 'name': 'datasets-logistics-project-management.json — this file', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' },
  ],
  'isPartOf': { '@id': LANDING + '#dataset-logistics-project-management' },
};

const categoryService = {
  '@type': 'Service',
  '@id': LANDING + '#service-logistics-project-management',
  'name': 'Logistics Project Management',
  'serviceType': 'Logistics project management',
  'description': svcById['service-logistics-project-management'].description + ' Every engagement is quoted per job at one flat rate in writing, with a single point of contact at the bound branch from survey through closeout.',
  'provider': { '@id': SITE + '/#organization' },
  'url': HUB,
  'areaServed': ports.map(portRef),
};

const bridgeServices = BRIDGE.map((b) => ({
  '@type': 'Service',
  '@id': LANDING + '#service-' + b.short,
  'name': svcById[b.svc].name,
  'serviceType': svcById[b.svc].name,
  'description': svcById[b.svc].description + ' Run inside the logistics project management program at one flat rate in writing.',
  'provider': { '@id': SITE + '/#organization' },
  'url': b.hub,
  'areaServed': ports.map(portRef),
}));

const portServices = ports.map((p) => {
  const bind = binding[p.id] || {};
  const pm = pmRows.find((r) => r.port === p.id) || {};
  const branch = bind.branch || pm.boundBranch || 'winchester';
  return {
    '@type': 'Service',
    '@id': LANDING + '#pm-' + p.id,
    'name': 'Logistics Project Management — ' + (p.shortName || p.name),
    'serviceType': 'Logistics project management',
    'description': 'Logistics project management at ' + p.name + ' from The Flat Rate Movers — survey, full scope, crew and sequence planning, supervised execution and closeout for container programs, warehouse load-outs and resets, surge programs, freight-rework campaigns and port-adjacent staging, run from the ' + branchCity(branch) + ' branch (' + (bind.routeFromBindingBranch || 'route per the registry binding map') + '), one flat rate in writing, TWIC-carded crews dispatched 24/7. The dedicated hub for this program is ' + HUB,
    'provider': { '@id': SITE + '/#organization' },
    'url': HUB,
    'areaServed': [portRef(p)],
  };
});

const doc = { '@context': 'https://schema.org', '@graph': [summary, coverage, categoryService, ...bridgeServices, ...portServices, ...places] };
const out = JSON.stringify(doc, null, 1) + '\n';
const fp = path.join(PUB, 'datasets-logistics-project-management.json');
const prior = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : null;
fs.writeFileSync(fp, out);
console.log('datasets-logistics-project-management.json written:', out.length, 'bytes | nodes:', doc['@graph'].length, '| changed:', prior !== out);
