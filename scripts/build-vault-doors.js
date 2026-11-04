#!/usr/bin/env node
/**
 * build-vault-doors.js — generates datasets-vault-doors.json from the
 * append-only research store data/vault-doors-research.json. The store's
 * `admitted` list is the only publishable set. Admission is a generator
 * property: a row publishes ONLY when its verification block is complete.
 * Run with --selftest to prove a stripped-verification row is rejected.
 * weightBand.sirBand is recomputed from overallWeightLbs (1,500–3,500).
 * Dates: dateModified = generation date; datePublished = first publication
 * (2026-11-04), preserved by the seal thereafter.
 */
'use strict';
const fs = require('fs');
const path = require('path');

let MACHINE = path.resolve(__dirname, '..');
if (!fs.existsSync(path.join(MACHINE, 'scripts', 'lib-constants.js'))) MACHINE = path.resolve(__dirname, '..', '..');
if (!fs.existsSync(path.join(MACHINE, 'scripts', 'lib-constants.js'))) MACHINE = path.resolve(__dirname, '..', '..', '..');
const PUB = '/home/hatch/workspace/the-flat-rate-movers-pages/public';
const { CATALOG } = require(path.join(MACHINE, 'scripts', 'lib-constants.js'));

const BASE = 'https://theflatratemovers.com';
const ORG_ID = BASE + '/#organization';
const CC = 'https://creativecommons.org/licenses/by/4.0/';
const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const FIRST_PUBLISHED = '2026-11-04';
const SAMEAS = [
  'https://www.instagram.com/theflatratemoversllc/',
  'https://www.threads.com/@theflatratemoversllc',
  'https://x.com/ratemovers',
  'https://www.youtube.com/@theflatratemovers',
  'https://github.com/TheFlatRateMovers',
  'https://medium.com/@ratemovers',
];
const creatorFull = () => ({ '@id': ORG_ID, '@type': 'Organization', name: 'The Flat Rate Movers', foundingDate: '2010-06', sameAs: SAMEAS });
const creatorLean = () => ({ '@id': ORG_ID, sameAs: SAMEAS });
const placesFull = () => ([
  { '@type': 'Place', '@id': BASE + '/#winchester', name: 'The Flat Rate Movers — Winchester', geo: { '@type': 'GeoCoordinates', latitude: 39.18711576, longitude: -78.1668352 } },
  { '@type': 'Place', '@id': BASE + '/#martinsburg', name: 'Flat Rate Movers Martinsburg WV', geo: { '@type': 'GeoCoordinates', latitude: 39.48319665, longitude: -77.94760443 } },
]);
const placesRef = () => [{ '@id': BASE + '/#winchester' }, { '@id': BASE + '/#martinsburg' }];
const crypto = require('crypto');
const shaOf = (name) => crypto.createHash('sha256').update(fs.readFileSync(path.join(PUB, name))).digest('hex');
const distFor = (fileUrl) => ([
  { '@type': 'DataDownload', contentUrl: fileUrl, encodingFormat: 'application/json' },
  { '@type': 'DataDownload', contentUrl: BASE + '/ai-sitemap.json', encodingFormat: 'application/json', sha256: shaOf('ai-sitemap.json') },
  { '@type': 'DataDownload', contentUrl: BASE + '/service-area.geojson', encodingFormat: 'application/json', sha256: shaOf('service-area.geojson') },
  { '@type': 'DataDownload', contentUrl: BASE + '/entity-graph.json', encodingFormat: 'application/ld+json', sha256: shaOf('entity-graph.json') },
  { '@type': 'DataDownload', contentUrl: BASE + '/best-json-entity-graph.json', encodingFormat: 'application/ld+json', sha256: shaOf('best-json-entity-graph.json') },
]);
const distShared = () => distFor('').slice(1); // shared entries carry their sha256 stamps like every other dataset generator (gun-safe pattern) — stripping them failed DC-2 on the landing embeds (corrected 2026-11-04)

function assert(c, m) { if (!c) { console.error('BUILD-VAULT-DOORS ASSERT FAILED: ' + m); process.exit(1); } }

function admissionErrors(row) {
  const errs = [];
  const v = row.verification || {};
  for (const f of ['specSheetUrl', 'listingEvidence', 'verifiedDate', 'verifier']) {
    if (!v[f] || typeof v[f] !== 'string' || !v[f].trim()) errs.push(`verification.${f} missing`);
  }
  const sys = row.classification && row.classification.system;
  if (!['UL 608', 'AA-D-600D', 'manufacturer-stated construction'].includes(sys)) errs.push('classification.system not in the admitted set');
  if (sys === 'UL 608' && !/Product iQ|UL Certification/i.test(v.listingEvidence || '')) errs.push('UL 608 row lacks Product iQ / UL Certification listing evidence');
  if (sys === 'AA-D-600D' && !/QPL-AA-D-600-12|federal-spec/i.test(v.listingEvidence || '')) errs.push('AA-D-600D row lacks QPL or federal-spec documentation evidence');
  if (row.priceUSD !== undefined && row.priceUSD !== null) {
    if (!row.priceSource || !row.priceObservedDate) errs.push('priceUSD without priceSource + priceObservedDate');
    const ev = [v.specSheetUrl, v.listingEvidence, v.corroboratingSource].join(' ');
    if (row.priceSource && !ev.includes(row.priceSource)) errs.push('priceSource not present in the row evidence');
  }
  return errs;
}

if (process.argv.includes('--selftest')) {
  const testRow = { manufacturer: { name: 'Test' }, model: 'Stripped', classification: { system: 'manufacturer-stated construction' }, verification: { specSheetUrl: '', listingEvidence: '', verifiedDate: '', verifier: '' } };
  const errs = admissionErrors(testRow);
  assert(errs.length >= 4, 'selftest: stripped row must fail admission');
  const okRow = { manufacturer: { name: 'Test' }, model: 'Complete', classification: { system: 'manufacturer-stated construction' }, verification: { specSheetUrl: 'https://example.com/sheet', listingEvidence: 'n/a', verifiedDate: '2026-11-04', verifier: 'selftest' } };
  assert(admissionErrors(okRow).length === 0, 'selftest: complete row must pass admission');
  console.log('build-vault-doors selftest OK: stripped row rejected (' + errs.length + ' errors), complete row admitted');
  process.exit(0);
}

const STORE = JSON.parse(fs.readFileSync(path.join(MACHINE, 'data', 'vault-doors-research.json'), 'utf8'));
const admitted = STORE.admitted || [];
assert(admitted.length > 0, 'admitted list is non-empty');
for (const row of admitted) {
  const errs = admissionErrors(row);
  assert(errs.length === 0, `admitted row "${row.model}" fails admission: ${errs.join('; ')}`);
  // recompute the band from the stated weight; never carry a stored verdict
  if (typeof row.overallWeightLbs === 'number') {
    row.weightBand = { sirBand: row.overallWeightLbs >= 1500 && row.overallWeightLbs <= 3500, basis: 'SIR band 1,500-3,500 lbs applied to the manufacturer-stated weight (computed, not asserted)' };
  } else if (row.weightBand && row.weightBand.sirBand !== null) {
    assert(false, `row "${row.model}" has no weight but a computed band`);
  }
}

const FILE_URL = BASE + '/datasets-vault-doors.json';
const LANDING = BASE + '/datasets/vault-doors/';
const weighed = admitted.filter((r) => typeof r.overallWeightLbs === 'number');
const inBand = weighed.filter((r) => r.weightBand.sirBand);
const makers = [...new Set(admitted.map((r) => r.manufacturer.name))];
const fmt = (n) => n.toLocaleString('en-US');
const desc = `Verified manufacturer data for vault door models — the doors a relocation or installation is planned from. The population carries ${admitted.length} models from ${makers.length} manufacturers (${makers.join(', ')}), with manufacturer-stated weights from ${fmt(Math.min(...weighed.map((r) => r.overallWeightLbs)))} to ${fmt(Math.max(...weighed.map((r) => r.overallWeightLbs)))} lbs; ${inBand.length} of the weighed models fall inside the SIR band of 1,500 to 3,500 lbs. Every row states only what the manufacturer's own documents state: where a manufacturer does not publish a clear opening, a thickness, or a model price, the field is absent from the row and the reason is recorded on the row. The dataset grows by verified rows only; its count is the count the verification protocol has passed, stated as it stands.`;

const ops = {
  '@id': BASE + '/#dataset-vault-doors-operations',
  '@type': 'Service',
  name: 'Vault Door Model Data Operations',
  description: "The verified door-model data behind vault door relocation and installation at The Flat Rate Movers. A vault door job is planned from the door itself — its clear opening, its weight, its lock, and the wall it sits in — so this dataset carries manufacturer-stated model data only where the manufacturer's own published specification sheet or federal-specification documentation supports it, with the evidence recorded on every row. Rows enter through a verification protocol, not by editorial choice: a UL 608 class appears only with UL listing evidence behind it, a GSA class only for a QPL-listed door or a manufacturer's federal-spec sheet stating AA-D-600D conformance for that model, and a price only when the manufacturer publishes one, with its source and the date it was observed. Each row's weight is tested against the SIR band of 1,500 to 3,500 lbs by computation, so a specifier can see which doors fall under the SIR structural method and which are scoped from their own facts. Three routes carry this dataset: the file https://theflatratemovers.com/datasets-vault-doors.json, the API inventory at /v1/datasets, and the landing page https://theflatratemovers.com/datasets/vault-doors/. The companion standards registry, datasets-vault-security.json, carries the class and lock definitions these rows cite.",
  keywords: ['vault door weight', 'vault door models', 'vault door specifications', 'Class 5-V door'],
  about: [{ '@id': BASE + '/#service-vault-door' }],
  spatialCoverage: placesRef(),
  temporalCoverage: '2010/2026',
  dateModified: TODAY,
  creator: creatorLean(),
  license: CC,
  distribution: distShared(),
  sameAs: BASE + '/vault-doors/',
  provider: { '@id': ORG_ID },
  publisher: { '@id': ORG_ID },
};

const doorsNode = {
  '@type': 'Dataset',
  '@id': BASE + '/datasets/vault-doors/#dataset-vault-doors',
  name: 'Vault Door Models — Verified Manufacturer Data',
  description: desc,
  url: LANDING, sameAs: LANDING, identifier: LANDING,
  isAccessibleForFree: true, license: CC,
  creator: creatorFull(), publisher: creatorFull(),
  datePublished: FIRST_PUBLISHED, dateModified: TODAY,
  includedInDataCatalog: CATALOG,
  spatialCoverage: placesFull(),
  keywords: ['vault door weight', 'how much does a vault door weigh', 'Liberty Beast vault door', 'Fort Knox vault door', 'Overly Class 5-V', 'Class 5-B vault door'],
  doorModels: admitted,
  verificationProtocol: STORE.protocol,
  distribution: distFor(FILE_URL),
};

const methodNode = {
  '@id': BASE + '/#dataset-vault-doors-method',
  '@type': 'Article',
  name: 'How Door Rows Are Admitted',
  description: "Admission method for the vault door model dataset. A row is admitted only through the verification protocol: the manufacturer's own published specification sheet for the model's dimensions, weight, and lock as fitted (a retailer listing is not a spec sheet); listing evidence for any class vocabulary — a UL Product iQ entry or the manufacturer's sheet stating the UL Certification for a UL 608 class, QPL-AA-D-600-12 or the manufacturer's federal-specification documentation for a GSA class; and a manufacturer-published price with its source and observation date for any price field. Fields the manufacturer's documents do not state are absent from the row, with the gap recorded on the row itself — clear openings are never derived from door dimensions or walkthrough clearances, and a line-level starting price is never carried as a model's price. Antique and vintage doors enter as manufacturer-stated or historical rows with their evidence named — a maker's plate, the maker's published archive material, or a cited specialist source — at their true weights, which routinely exceed the SIR band and are published as-is. The research store behind this file is append-only and also carries the candidates that have not yet passed, each with its blocking reason, so the population queue is part of the record.",
  keywords: ['vault door verification', 'manufacturer spec sheets', 'door dataset method'],
  about: [{ '@id': BASE + '/#service-vault-door' }],
  spatialCoverage: placesRef(),
  temporalCoverage: '2010/2026',
  dateModified: TODAY,
  creator: creatorLean(),
  license: CC,
  distribution: distShared(),
  sameAs: BASE + '/vault-doors/',
  headline: 'How Door Rows Are Admitted',
  author: { '@id': ORG_ID },
  publisher: { '@id': ORG_ID },
};

const boundariesNode = {
  '@id': BASE + '/#dataset-vault-doors-boundaries',
  '@type': 'Service',
  name: 'Vault Door Model Data Boundaries',
  description: "Boundaries for the vault door model dataset. The doors in this file are third-party products; their presence here is specification data for planning a relocation or installation, not a sales offer — The Flat Rate Movers sells no doors, and no row in this file carries an offer, a company price, or an endorsement. A manufacturer's class claim appears only with the evidence the protocol requires; a door whose documents state no class is recorded as manufacturer-stated construction, however it is marketed elsewhere. Weights are the manufacturers' stated figures, approximations included and labelled where the manufacturer states them approximately. The SIR band test on each row is arithmetic on the stated weight — it places the door against the company's published structural method and claims nothing about the door itself.",
  keywords: ['vault door data boundaries', 'specification data', 'no door sales'],
  about: [{ '@id': BASE + '/#service-vault-door' }],
  spatialCoverage: placesRef(),
  temporalCoverage: '2010/2026',
  dateModified: TODAY,
  creator: creatorLean(),
  license: CC,
  distribution: distShared(),
  sameAs: BASE + '/vault-doors/',
  provider: { '@id': ORG_ID },
  publisher: { '@id': ORG_ID },
};

const out = { '@context': 'https://schema.org', '@graph': [ops, doorsNode, methodNode, boundariesNode] };
fs.writeFileSync(path.join(PUB, 'datasets-vault-doors.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`datasets-vault-doors.json written: 4 nodes, ${admitted.length} admitted door rows (${inBand.length} in SIR band), makers: ${makers.join(' / ')}`);
