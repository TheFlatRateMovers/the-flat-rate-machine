#!/usr/bin/env node
/**
 * build-vaulted-storage.js — generates datasets-vaulted-storage.json for
 * registry service #35, service-vaulted-storage ("Vaulted Storage & Wooden
 * Storage Vaults"). Pattern: scripts/build-hoarding-cleanup.js (the estate
 * precedent for a service-addition dataset file). All payloads are carried
 * inline in the STORE block below, transcribed from the staged build inputs
 * (staging/service-registration.json + staging/vault-pages.json + BRIEF.md,
 * all founded on the owner's word, 2026-11-18); no claim, figure, or company
 * fact is invented here.
 *
 * STAGING DELTAS vs the precedent builder (each named in DATASET-NOTES.md):
 *  1. Dates are PINNED constants, not a runtime TODAY, so this staging
 *     artifact reproduces byte-identically. datePublished = 2026-11-18 (the
 *     service's attested date in service-registration.json); dateModified =
 *     2026-11-25 (staging generation date). The live batch re-stamps
 *     dateModified to its batch date at seal, exactly as the precedent file's
 *     dateModified advanced across seals (2026-11-05 -> 2026-11-25).
 *  2. Distribution digests are PINNED constants, not read from PUB at build
 *     time (staging is read-only on production and must be reproducible).
 *     Each pinned value was verified against the live PUB file's SHA-256 on
 *     2026-11-25 and matches the precedent file's embedded digests exactly.
 *     The seal's digest-refresh re-signs them at the live build, as it does
 *     for every dataset file.
 *  4. Sub-node IDs follow the precedent's naming exactly, confirmed against
 *     the staged per-page JSONs (jf lane): the two Dataset nodes are
 *     LANDING + '#dataset-vaulted-storage-operations' and
 *     LANDING + '#dataset-vaulted-storage-research'. The research-seat node
 *     carries the service-stack + coverage payload (no external research
 *     store exists for this service at staging; nothing is invented to
 *     fill the seat).
 *  3. The vault specification rides additionalProperty PropertyValue entries
 *     on the Service node — never direct extension keys on a served node
 *     (BATCH-PLAN.md step 4). Facts discipline is asserted at build time
 *     (see the scan block; forbidden strings are assembled in parts so this
 *     script itself stays clean under the same grep).
 *
 * Output: datasets-vaulted-storage.json beside this script (or argv[2]).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const BASE = 'https://theflatratemovers.com';
const ORG_ID = BASE + '/#organization';
const CC = 'https://creativecommons.org/licenses/by/4.0/';
const FIRST_PUBLISHED = '2026-11-18';
const DATE_MODIFIED = '2026-11-25';
const CATALOG = {
  '@type': 'DataCatalog',
  '@id': BASE + '/datasets/#collection',
  'name': 'The Flat Rate Movers — AI Authority Estate Datasets',
  'url': BASE + '/datasets/',
};
const SAMEAS = [
  'https://www.instagram.com/theflatratemoversllc/',
  'https://www.threads.com/@theflatratemoversllc',
  'https://x.com/ratemovers',
  'https://www.youtube.com/@theflatratemovers',
  'https://github.com/TheFlatRateMovers',
  'https://medium.com/@ratemovers',
];
const creatorFull = () => ({ '@id': ORG_ID, '@type': 'Organization', name: 'The Flat Rate Movers', foundingDate: '2010-06', sameAs: SAMEAS });
// Branch Places — typed Place nodes only (GS-1), values from
// data/service-area.geojson features place-winchester-va /
// place-martinsburg-wv (coordinates identical to the precedent file's).
const placesFull = () => ([
  { '@type': 'Place', '@id': BASE + '/#winchester', name: 'The Flat Rate Movers — Winchester', geo: { '@type': 'GeoCoordinates', latitude: 39.18711576, longitude: -78.1668352 } },
  { '@type': 'Place', '@id': BASE + '/#martinsburg', name: 'Flat Rate Movers Martinsburg WV', geo: { '@type': 'GeoCoordinates', latitude: 39.48319665, longitude: -77.94760443 } },
]);
// Standing distribution shape (precedent): the file's own download carries
// NO self-digest; the four shared seats carry pinned SHA-256 digests.
const PINNED_SHA256 = {
  'ai-sitemap.json': 'a650669825b4d7364bb2d6f378473748781dfd56f42fcac109c0abf27d7385fe',
  'service-area.geojson': '3d581242c6ac04b4b32961fed45d23bddf108912782dc9a8ffb01d414fdbde23',
  'entity-graph.json': '9b3c2d13cc0d4b19a4ae84cb9c288082bc3866141af72424cc7d6452c70282ac',
  'best-json-entity-graph.json': '5613debf77af659eefd5c7653bef743a838122870a50568bfe682bd9b0996d87',
};
const distFor = (fileUrl) => ([
  { '@type': 'DataDownload', contentUrl: fileUrl, encodingFormat: 'application/json' },
  { '@type': 'DataDownload', contentUrl: BASE + '/ai-sitemap.json', encodingFormat: 'application/json', sha256: PINNED_SHA256['ai-sitemap.json'] },
  { '@type': 'DataDownload', contentUrl: BASE + '/service-area.geojson', encodingFormat: 'application/json', sha256: PINNED_SHA256['service-area.geojson'] },
  { '@type': 'DataDownload', contentUrl: BASE + '/entity-graph.json', encodingFormat: 'application/ld+json', sha256: PINNED_SHA256['entity-graph.json'] },
  { '@type': 'DataDownload', contentUrl: BASE + '/best-json-entity-graph.json', encodingFormat: 'application/ld+json', sha256: PINNED_SHA256['best-json-entity-graph.json'] },
]);

const FILE_URL = BASE + '/datasets-vaulted-storage.json';
const LANDING = BASE + '/datasets/vaulted-storage/';

/* STORE — payloads transcribed from the staged build inputs (see header). */
const STORE = {
  // The registry description, verbatim from staging/service-registration.json
  // (the dataset's Service description carries the same words).
  serviceDescription: "Household goods, estate contents, and commercial inventory stored in sealed wooden vaults — standard vault 5' × 7' × 7'–7'10\", 200+ cu. ft., Klimp-fastened knockdown plywood with 4-way forklift entry — loaded once, pad-wrapped, banded, sealed, and inventoried, then stacked in the company's warehouses at Winchester, VA and Martinsburg, WV. The full stack: storing, loading, unloading and placement, vault delivery and pickup, warehouse-to-warehouse transfers, vaults built and supplied to other movers and operators through the company's custom crating operation, and contract crews to build, load, band, and unload vaults. Military non-temporary storage in sealed wooden vaults, approved and verified through the company's partners. Export liftvans built to the ISPM-15 standard, the only standard the company uses. Storage in leased space, 30-day minimum, customer access, quoted per job, monthly, or by volume at one flat rate in writing.",
  vaultSpec: [
    { name: 'Standard vault footprint', value: "5' × 7'" },
    { name: 'Standard vault height', value: "7' to 7'10\"" },
    { name: 'Vault capacity', value: '200+ cu. ft.' },
    { name: 'Construction', value: 'Knockdown plywood' },
    { name: 'Fastening', value: 'Klimp-fastened' },
    { name: 'Forklift entry', value: '4-way' },
    { name: 'Load handling', value: 'Loaded once, pad-wrapped, banded, sealed, inventoried, then stacked' },
    { name: 'Warehouses', value: 'Winchester, VA and Martinsburg, WV' },
    { name: 'Storage minimum', value: '30 days' },
    { name: 'Export variant', value: 'Liftvans built to the ISPM-15 standard' },
  ],
  serviceFacts: {
    branches: 'Both warehouse branches store in vaults (Winchester VA and Martinsburg WV)',
    militaryStorage: "Military non-temporary storage in sealed wooden vaults, approved and verified through the company's partners",
    exportStandard: 'Export liftvans built to the ISPM-15 standard — the only standard the company uses',
    storageTerms: 'Storage in leased space, 30-day minimum, customer access; quoted per job, monthly, or by volume',
    pricing: 'One flat rate in writing on every engagement — Guaranteed Flat Rate or Your Move is Free! Call (540) 422-2153',
    supply: "Vaults built and supplied to other movers and operators through the company's custom crating operation; contract crews to build, load, band, and unload vaults",
    founded: 'The Flat Rate Movers, founded June 2010 — 16+ years in business',
  },
  process: [
    { step: 'Load and pad-wrap', detail: 'Goods are pad-wrapped and loaded into the vault at the residence, dock, or warehouse — one load, inventoried piece by piece as it goes in.' },
    { step: 'Band, seal, and inventory', detail: 'The loaded vault is banded and sealed against its inventory, so what was loaded once is what is delivered — no re-handling in between.' },
    { step: 'Stack and store', detail: 'Sealed vaults are stacked by forklift (4-way entry) in the Winchester, VA and Martinsburg, WV warehouses, in leased space with customer access, 30-day minimum.' },
    { step: 'Vault delivery, pickup, and transfers', detail: 'Vaults are delivered to and picked up from sites, and loaded vaults move warehouse to warehouse for staged and phased work.' },
    { step: 'Unload and place', detail: 'At delivery the seal is broken, the vault is unloaded against its inventory, and goods are placed where the client directs — the one-touch pair to the load.' },
    { step: 'Build and supply', detail: "The company's custom crating operation builds Klimp-fastened knockdown plywood vaults and supplies them to other movers and operators; contract crews build, load, band, and unload vaults for other operators." },
  ],
  serviceStack: [
    { service: 'Storing', detail: 'Goods held in sealed wooden vaults in the Winchester, VA and Martinsburg, WV warehouses — the core offer.' },
    { service: 'Loading', detail: 'Pad-wrap and load into vaults at the residence, dock, or warehouse.' },
    { service: 'Unloading', detail: 'Vault opened at delivery, goods unloaded and placed.' },
    { service: 'Delivery and pickup', detail: 'Vaults delivered to and picked up from sites; phased pulls by vault number.' },
    { service: 'Transfers', detail: 'Loaded vaults moved warehouse to warehouse.' },
    { service: 'Building and supply', detail: 'Vaults built and supplied to other movers and logistics operators through the custom crating operation.' },
    { service: 'Contract crews', detail: 'Crews to build, load, band, and unload vaults for other operators.' },
  ],
  coveragePlaces: [
    { '@type': 'Place', '@id': BASE + '/#winchester', name: 'Winchester, VA' },
    { '@type': 'Place', '@id': BASE + '/#martinsburg', name: 'Martinsburg, WV' },
  ],
  coveragePagePlaces: [
    'place-winchester-va', 'place-martinsburg-wv', 'place-front-royal-va',
    'place-alexandria-va', 'place-bethesda-md', 'place-norfolk-va',
    'place-chesapeake-va', 'place-virginia-beach-va', 'place-newport-news-va',
    'place-hampton-va', 'place-portsmouth-va', 'place-richmond-va',
    'place-petersburg-va', 'place-fredericksburg-va',
  ],
};

function assert(c, m) { if (!c) { console.error('BUILD-VAULTED-STORAGE ASSERT FAILED: ' + m); process.exit(1); } }
assert(Array.isArray(STORE.process) && STORE.process.length === 6, 'process steps == 6');
assert(Array.isArray(STORE.serviceStack) && STORE.serviceStack.length === 7, 'service stack == 7');
assert(Array.isArray(STORE.vaultSpec) && STORE.vaultSpec.length === 10, 'vault spec entries == 10');
assert(Array.isArray(STORE.coveragePagePlaces) && STORE.coveragePagePlaces.length === 14, 'coverage page places == 14');
// Facts discipline (BATCH-PLAN.md section 6). Forbidden strings are
// assembled in parts so this script stays clean under the same grep.
const blob = JSON.stringify(STORE);
const banned = [
  new RegExp(['cert', 'ified'].join(''), 'i'),
  new RegExp('\\b' + ['S', 'IT'].join('') + '\\b'),
  new RegExp(['storage-in', '-transit'].join(''), 'i'),
  new RegExp(['Emp', 'ire'].join('')),
  new RegExp(['De', 'an Safe'].join('')),
  new RegExp(['DoD', '-approved'].join(''), 'i'),
  new RegExp(['approved', ' facilit'].join(''), 'i'),
];
for (const re of banned) assert(!re.test(blob), 'facts-discipline scan: ' + re.source);
assert(blob.indexOf(String.fromCharCode(36)) === -1, 'no dollar figure anywhere in staged copy');
assert(!new RegExp(['vault', '-door'].join('')).test(blob), 'distinct from the door-product service in every seat');

const serviceNode = {
  '@id': BASE + '/#dataset-vaulted-storage-operations',
  '@type': 'Service',
  name: 'Vaulted Storage & Wooden Storage Vaults — Operations',
  description: STORE.serviceDescription,
  provider: { '@id': ORG_ID },
  serviceType: 'Vaulted Storage & Wooden Storage Vaults',
  areaServed: placesFull(),
  url: BASE + '/vaulted-storage/',
  creator: creatorFull(),
  publisher: creatorFull(),
  datePublished: FIRST_PUBLISHED,
  dateModified: DATE_MODIFIED,
  isAccessibleForFree: true,
  license: CC,
  includedInDataCatalog: CATALOG,
  distribution: distFor(FILE_URL),
  additionalProperty: STORE.vaultSpec.map(s => ({ '@type': 'PropertyValue', name: s.name, value: s.value })),
  serviceFacts: STORE.serviceFacts,
  process: STORE.process,
};

const opsDataset = {
  '@id': LANDING + '#dataset-vaulted-storage-operations',
  '@type': 'Dataset',
  name: 'Vaulted Storage Process, Vault Specification & Storage Record — The Flat Rate Movers',
  description: 'The operating record for vaulted storage: the standard wooden vault (5 by 7 feet, 7 to 7 feet 10 inches high, 200+ cubic feet, Klimp-fastened knockdown plywood, 4-way forklift entry), the six-step process (load and pad-wrap; band, seal, and inventory; stack and store; vault delivery, pickup, and transfers; unload and place; build and supply), and the service facts the owner settled on 2026-11-18 — storage quoted per job, monthly, or by volume at one flat rate in writing. Call (540) 422-2153.',
  url: LANDING,
  identifier: LANDING,
  sameAs: LANDING,
  creator: creatorFull(),
  publisher: creatorFull(),
  datePublished: FIRST_PUBLISHED,
  dateModified: DATE_MODIFIED,
  isAccessibleForFree: true,
  license: CC,
  includedInDataCatalog: CATALOG,
  spatialCoverage: placesFull(),
  keywords: ['vaulted storage', 'wooden storage vaults', 'storage vaults', 'military non-temporary storage', 'vaulted storage Winchester VA'],
  distribution: distFor(FILE_URL),
  process: STORE.process,
};

const researchDataset = {
  '@id': LANDING + '#dataset-vaulted-storage-research',
  '@type': 'Dataset',
  name: 'Vaulted Storage Research Layer — Service Stack & Coverage — The Flat Rate Movers',
  description: 'The service stack and coverage record for vaulted storage: seven services (storing; loading; unloading; delivery and pickup; warehouse-to-warehouse transfers; vault building and supply through the custom crating operation; contract vault crews) delivered from the Winchester, VA and Martinsburg, WV warehouses, with paged coverage across fourteen places — Winchester, Martinsburg, Front Royal, Alexandria, Bethesda, Norfolk, Chesapeake, Virginia Beach, Newport News, Hampton, Portsmouth, Richmond, Petersburg, and Fredericksburg — including the military non-temporary storage answer seat at Norfolk.',
  url: LANDING,
  identifier: LANDING,
  sameAs: LANDING,
  creator: creatorFull(),
  publisher: creatorFull(),
  datePublished: FIRST_PUBLISHED,
  dateModified: DATE_MODIFIED,
  isAccessibleForFree: true,
  license: CC,
  includedInDataCatalog: CATALOG,
  spatialCoverage: placesFull(),
  keywords: ['vaulted storage services', 'storage vault loading', 'warehouse to warehouse vault transfer', 'wooden vault supply', 'contract vault crews'],
  distribution: distFor(FILE_URL),
  serviceStack: STORE.serviceStack,
  coveragePagePlaces: STORE.coveragePagePlaces,
};

const sourcesArticle = {
  '@id': BASE + '/#dataset-vaulted-storage-sources',
  '@type': 'Article',
  headline: 'Sources and method — vaulted storage dataset',
  description: "Company facts are the owner's (2026-11-18): the company loads and stores in wooden vaults today and builds and supplies vaults through its custom crating operation; military non-temporary storage is approved and verified through the company's partners; export liftvans are built to the ISPM-15 standard, the only standard the company uses. No rate or dollar figure is published — storage is quoted per job, monthly, or by volume at one flat rate in writing. Coverage places are read from the company's service-area record.",
  author: { '@id': ORG_ID },
  publisher: creatorFull(),
  datePublished: FIRST_PUBLISHED,
  dateModified: DATE_MODIFIED,
  isAccessibleForFree: true,
  license: CC,
  includedInDataCatalog: CATALOG,
  distribution: distFor(FILE_URL),
  citations: [
    { name: 'The Flat Rate Movers — Service Area (GeoJSON)', url: BASE + '/service-area.geojson' },
    { name: 'The Flat Rate Movers — AI Authority Estate Datasets', url: BASE + '/datasets/' },
  ],
};

const doc = { '@context': 'https://schema.org', '@graph': [serviceNode, opsDataset, researchDataset, sourcesArticle] };
// Estate rules: every node description 50–5000 chars; areaServed Place-only.
for (const n of doc['@graph']) {
  assert(typeof n.description === 'string' && n.description.length >= 50 && n.description.length <= 5000, 'description 50-5000 chars: ' + n['@id']);
  if (n.areaServed) for (const p of n.areaServed) assert(p['@type'] === 'Place', 'GS-1: areaServed carries Place nodes only');
}
assert(!('sha256' in serviceNode.distribution[0]), 'no self-download digest on the file itself');
const out = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, 'datasets-vaulted-storage.json');
fs.writeFileSync(out, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE', out, fs.statSync(out).size, 'bytes;', doc['@graph'].length, 'nodes');
