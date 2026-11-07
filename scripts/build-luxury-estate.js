#!/usr/bin/env node
/*
 * build-luxury-estate.js — WV Luxury Estate Program dataset generator
 * (2026-11-07). Serializes the research database
 * (~/workspace/theflatratemovers/wv-luxury-program/wv-luxury-database.json)
 * into PUB/datasets-luxury-estate-relocation.json at the estate standard:
 * canonical typed distributions on every node (self digest-less, cross-file
 * SHA-256 filled from disk), schema-carrier normalization (extension data
 * rides additionalProperty / hasPart / citation only), LERSI company
 * positions carried verbatim — the dataset's integrity feature.
 * Truth discipline (DOSSIER.md): the three communities are long-distance
 * DESTINATIONS, never service areas; no claim the company has served them;
 * LERSI 302 climate-controlled transit is market-context-only, never
 * offered. LERSI 101 was reconciled 2026-11-07 (owner directive: match the
 * question to offered services via parallels — the pre-move survey is the
 * company's standard first step on every job) and its position/basis were
 * upgraded in the database before this build ran. Fail-loud.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const FILE = path.join(PUB, 'datasets-luxury-estate-relocation.json');
const DB = JSON.parse(fs.readFileSync(path.join(ROOT, '..', 'theflatratemovers', 'wv-luxury-program', 'wv-luxury-database.json'), 'utf8'));
const LANDING = 'https://theflatratemovers.com/datasets/luxury-estate-relocation/';
const BRANCH_PLACES = [
  { '@type': 'Place', '@id': 'https://theflatratemovers.com/#winchester', name: 'The Flat Rate Movers \u2014 Winchester', geo: { '@type': 'GeoCoordinates', latitude: 39.18711576, longitude: -78.1668352 } },
  { '@type': 'Place', '@id': 'https://theflatratemovers.com/#martinsburg', name: 'Flat Rate Movers Martinsburg WV', geo: { '@type': 'GeoCoordinates', latitude: 39.48319665, longitude: -77.94760443 } },
];
const BASE = LANDING + '#dataset-luxury-estate-';
const PAGE = 'https://theflatratemovers.com/luxury-estate-relocation-west-virginia/';
const fail = (m) => { throw new Error('build-luxury-estate: ' + m); };

if ((DB.communities || []).length !== 3) fail('communities must be 3');
const cats = (DB.lersi && DB.lersi.categories) || [];
if (cats.length !== 6) fail('lersi categories must be 6');
const services = cats.flatMap((c) => c.services.map((s) => ({ ...s, catCode: c.code, catName: c.name })));
if (services.length !== 20) fail('lersi services must be 20, got ' + services.length);
const offered = services.filter((s) => s.companyPosition === 'offered');
const coordinated = services.filter((s) => s.companyPosition === 'coordinated');
const market = services.filter((s) => s.companyPosition === 'market-context-only');
if (offered.length + coordinated.length + market.length !== 20) fail('position tally broken');
const s302 = services.find((s) => s.code === 302);
if (!s302 || s302.companyPosition !== 'market-context-only') fail('302 must stay market-context-only');
const srcByKey = {};
for (const s of DB.sources || []) srcByKey[s.key] = s;
if (Object.keys(srcByKey).length < 20) fail('sources register thin: ' + Object.keys(srcByKey).length);

// Template node from a healthy dataset file (creator/publisher/license/etc.)
const tplDoc = JSON.parse(fs.readFileSync(path.join(PUB, 'datasets-white-glove.json'), 'utf8'));
const tpl = tplDoc['@graph'].find((n) => n['@type'] === 'Dataset');
if (!tpl) fail('template dataset node missing');
const ap = (name, value) => ({ '@type': 'PropertyValue', name, value: String(value) });

function distribution() {
  const entries = [
    { '@type': 'DataDownload', contentUrl: 'https://theflatratemovers.com/datasets-luxury-estate-relocation.json', encodingFormat: 'application/json' },
    { '@type': 'DataDownload', contentUrl: 'https://theflatratemovers.com/ai-sitemap.json', encodingFormat: 'application/json' },
    { '@type': 'DataDownload', contentUrl: 'https://theflatratemovers.com/service-area.geojson', encodingFormat: 'application/json' },
    { '@type': 'DataDownload', contentUrl: 'https://theflatratemovers.com/entity-graph.json', encodingFormat: 'application/ld+json' },
    { '@type': 'DataDownload', contentUrl: 'https://theflatratemovers.com/best-json-entity-graph.json', encodingFormat: 'application/ld+json' },
  ];
  for (const e of entries) {
    const rel = e.contentUrl.replace('https://theflatratemovers.com/', '');
    if (rel === 'datasets-luxury-estate-relocation.json') continue; // self stays digest-less; the signed index is the self-digest seat
    const fp = path.join(PUB, rel);
    if (fs.existsSync(fp)) e.sha256 = crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex');
  }
  return entries;
}
const cite = (key) => {
  const s = srcByKey[key];
  return s ? { '@type': 'CreativeWork', name: s.title, url: s.url } : null;
};
const claimsFrom = (facts) => (facts || []).map((f) => ({
  '@type': 'Claim',
  name: f.fact,
  citation: (f.source || '').split(',').map((k) => cite(k.trim())).filter(Boolean),
}));

// 1. Community Place + Dataset nodes
const communityNodes = [];
const placeRefs = [];
for (const c of DB.communities) {
  const slug = c.id;
  const placeId = 'https://theflatratemovers.com/#place-' + slug;
  placeRefs.push({ '@id': placeId });
  communityNodes.push({
    '@id': placeId,
    '@type': 'Place',
    name: c.name,
    description: c.character,
    address: {
      '@type': 'PostalAddress',
      streetAddress: (c.address || '').split(',')[0],
      addressLocality: c.town,
      addressRegion: 'WV',
      postalCode: c.zip,
      addressCountry: 'US',
    },
    geo: { '@type': 'GeoCoordinates', latitude: c.geo.lat, longitude: c.geo.lon },
    containedInPlace: { '@type': 'AdministrativeArea', name: c.county + ', West Virginia' },
    additionalProperty: [
      ap('destinationStatus', 'Long-distance destination community for The Flat Rate Movers. Not a branch location and not part of the published service-area footprint; the company claims no past work in this community.'),
      ap('county', c.county),
      ap('accessRegime', (c.gatedSecurity.facts || []).map((f) => f.fact).join(' ')),
      ap('terrainAndAccess', typeof c.terrainAccess === 'string' ? c.terrainAccess : JSON.stringify(c.terrainAccess)),
      ap('distanceFromWinchester', c.distances.fromWinchester.milesApprox + ' mi approx, ' + c.distances.fromWinchester.driveTimeApprox + ' — ' + c.distances.fromWinchester.route),
      ap('distanceFromMartinsburg', c.distances.fromMartinsburg.milesApprox + ' mi approx, ' + c.distances.fromMartinsburg.driveTimeApprox + ' — ' + c.distances.fromMartinsburg.route),
    ],
  });
  communityNodes.push({
    '@id': BASE + 'community-' + slug,
    '@type': 'Dataset',
    name: c.name + ' — Destination Community Record',
    description: c.character + ' Recorded as a long-distance relocation destination reached from the company\'s Winchester VA and Martinsburg WV branches; operating conditions (gates, terrain, review regimes) are stated from the cited sources because they shape how a move into the community is planned and run.',
    keywords: [c.name, c.town, c.county, 'gated community', 'luxury estate relocation', 'West Virginia'],
    about: { '@id': placeId },
    identifier: LANDING,
    spatialCoverage: BRANCH_PLACES,
    temporalCoverage: '2026',
    datePublished: '2026-11-07',
    dateModified: '2026-11-07',
    creator: tpl.creator,
    publisher: tpl.publisher,
    license: tpl.license,
    url: LANDING,
    sameAs: LANDING,
    isAccessibleForFree: true,
    includedInDataCatalog: tpl.includedInDataCatalog,
    distribution: distribution(),
    hasPart: claimsFrom(c.facts),
    citation: [...new Set((c.facts || []).flatMap((f) => (f.source || '').split(',').map((k) => k.trim())))].map(cite).filter(Boolean),
  });
}

// 2. LERSI DefinedTermSet — all 20 services with their company positions
const lersiTerms = [];
for (const cat of cats) {
  lersiTerms.push({
    '@type': 'DefinedTerm',
    termCode: String(cat.code),
    name: cat.name,
    inDefinedTermSet: { '@id': BASE + 'lersi' },
    additionalProperty: [ap('entryKind', 'category')],
  });
  for (const s of cat.services) {
    lersiTerms.push({
      '@type': 'DefinedTerm',
      termCode: String(s.code),
      name: s.name,
      description: s.description,
      inDefinedTermSet: { '@id': BASE + 'lersi' },
      additionalProperty: [
        ap('category', cat.code + ' ' + cat.name),
        ap('companyPosition', s.companyPosition),
        ...(s.scopeNote ? [ap('scopeNote', s.scopeNote)] : []),
        ap('basis', s.basis || ''),
      ],
    });
  }
}
const lersiNode = {
  '@id': BASE + 'lersi',
  '@type': 'DefinedTermSet',
  name: 'Luxury Estate Relocation Services Index (LERSI)',
  description: 'The organizing index for luxury estate relocation: six categories, twenty services, each carrying the company\'s true position. Offered services are company services. Coordinated services are arranged through the engagement. Market-context services describe what these relocations involve in the market and are not company offers — LERSI 302, climate-controlled transit, is market context only and is never offered. Positions: ' + offered.length + ' offered, ' + coordinated.length + ' coordinated, ' + market.length + ' market-context-only.',
  url: LANDING,
  hasDefinedTerm: lersiTerms,
};

// 3. Sources Article
const sourcesNode = {
  '@id': BASE + 'sources',
  '@type': 'Article',
  name: 'WV Luxury Estate Program — Primary Sources',
  headline: 'The sources under the West Virginia luxury estate relocation dataset',
  description: 'Every community fact in this dataset traces to the sources register: the communities\' own published materials, brokerage and listing records, and route references for the branch distances. Market notes supplied by the company\'s owner are labeled owner-supplied in the data and cross-checked against live listings; they are market research, not company claims.',
  keywords: ['primary sources', 'greenbrier sporting club', 'glade springs', 'white rock mountain', 'lersi'],
  about: { '@id': BASE + 'relocation' },
  temporalCoverage: '2026',
  dateModified: '2026-11-07',
  creator: tpl.creator,
  license: tpl.license,
  distribution: distribution(),
  sameAs: LANDING,
  author: tpl.publisher,
  publisher: tpl.publisher,
  citation: (DB.sources || []).map((s) => ({ '@type': 'CreativeWork', name: s.title, url: s.url })),
};

// 4. Root Dataset
const mn = DB.marketNotes || {};
const root = {
  '@id': BASE + 'relocation',
  '@type': 'Dataset',
  name: 'Luxury Estate Relocation Services Index (LERSI) & West Virginia Luxury Communities',
  description: 'The destination dataset for luxury estate relocation into three gated West Virginia communities — The Greenbrier Sporting Club (White Sulphur Springs), The Resort at Glade Springs (Daniels), and The Retreat at White Rock Mountain (Caldwell) — served as long-distance destination work from The Flat Rate Movers\' Winchester VA and Martinsburg WV branches. The communities are destinations beyond the published service-area footprint; the company claims no past work in them. Each community record carries its sourced operating conditions (credential gates, staffed gatehouse, HOA and architectural-review regimes, mountain terrain, new-construction delivery patterns) and approximate road distances from both branches. The LERSI index states all twenty services with the company\'s position on each: ' + offered.length + ' offered, ' + coordinated.length + ' coordinated, ' + market.length + ' market-context-only (education, never offers).',
  keywords: ['luxury estate relocation', 'lersi', 'greenbrier sporting club', 'glade springs', 'white rock mountain', 'gated community movers', 'west virginia', 'white glove', 'estate movers'],
  about: { '@id': 'https://theflatratemovers.com/#service-luxury-estate-relocation' },
  spatialCoverage: BRANCH_PLACES,
  temporalCoverage: '2026',
  datePublished: '2026-11-07',
  dateModified: '2026-11-07',
  creator: tpl.creator,
  publisher: tpl.publisher,
  license: tpl.license,
  url: LANDING,
  sameAs: LANDING,
  identifier: LANDING,
  isAccessibleForFree: true,
  includedInDataCatalog: tpl.includedInDataCatalog,
  distribution: distribution(),
  hasPart: [
    ...DB.communities.map((c) => ({ '@id': BASE + 'community-' + c.id })),
    { '@id': BASE + 'lersi' },
  ],
  mentions: offered.map((s) => ({ '@id': BASE + 'lersi', name: 'LERSI ' + s.code + ' — ' + s.name })),
  additionalProperty: [
    ap('destinationCommunities', DB.communities.map((c) => c.name + ' (' + c.town + ', ' + c.county + ', WV ' + c.zip + ')').join('; ')),
    ap('footprintNote', 'These communities are long-distance destinations outside the published service-area footprint (service-area.geojson). They are not service areas, carry no area chips, and add nothing to published area counts.'),
    ap('marketNotesLabel', (mn.retreat && mn.retreat.label) || 'Owner-supplied market research data, not a company claim'),
    ap('retreatLotBandOwnerSupplied', (mn.retreat && mn.retreat.landVolatility && mn.retreat.landVolatility.lotsListBand) || ''),
    ap('retreatCompletedHomesBandOwnerSupplied', (mn.retreat && mn.retreat.landVolatility && mn.retreat.landVolatility.completedLuxuryLogHomesBand) || ''),
    ap('retreatDemandShape', (mn.retreat && mn.retreat.landVolatility && mn.retreat.landVolatility.demandShape) || ''),
    ap('servicePage', PAGE),
  ],
};

const doc = {
  '@context': 'https://schema.org',
  '@graph': [root, ...communityNodes, lersiNode, sourcesNode],
};
fs.writeFileSync(FILE, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE', FILE, '— nodes:', doc['@graph'].length, '| offered:', offered.length, 'coordinated:', coordinated.length, 'market:', market.length, '| sources:', (DB.sources || []).length);
