#!/usr/bin/env node
/**
 * build-vault-security.js — generates datasets-vault-security.json from the
 * input store data/vault-security-standards.json (dossier section 2 ONLY).
 * Payload arrays are emitted from the store verbatim; no standards figure is
 * re-typed here. Fail-loud assertions per the V1 generator spec (2026-11-02).
 * Dates: dateModified = generation date; datePublished = the file's first
 * publication date (2026-11-04), preserved by the seal thereafter.
 */
'use strict';
const fs = require('fs');
const path = require('path');

let MACHINE = path.resolve(__dirname, '..');
if (!fs.existsSync(path.join(MACHINE, 'scripts', 'lib-constants.js'))) MACHINE = path.resolve(__dirname, '..', '..');
if (!fs.existsSync(path.join(MACHINE, 'scripts', 'lib-constants.js'))) MACHINE = path.resolve(__dirname, '..', '..', '..');
const PUB = '/home/hatch/workspace/the-flat-rate-movers-pages/public';
const STORE = JSON.parse(fs.readFileSync(path.join(MACHINE, 'data', 'vault-security-standards.json'), 'utf8'));
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

const FILE_URL = BASE + '/datasets-vault-security.json';
const LANDING = BASE + '/datasets/vault-security/';

// ---- assertions on the store payloads (VS-1 shapes) ----
const reg = STORE.standardsRegistry, lock = STORE.lockingSystems, notes = STORE.correctiveNotes;
function assert(c, m) { if (!c) { console.error('BUILD-VAULT-SECURITY ASSERT FAILED: ' + m); process.exit(1); } }
assert(Array.isArray(reg) && reg.length === 8, 'standardsRegistry rows == 8');
assert(Array.isArray(lock) && lock.length === 6, 'lockingSystems rows == 6');
assert(Array.isArray(notes) && notes.length === 3, 'correctiveNotes == 3');
for (const r of reg) {
  if (r.class !== 'Class 5-B') assert(r.ballistic === undefined || r.ballistic === 'none specified', 'non-5-B ballistic discipline: ' + r.class);
}
assert(!JSON.stringify(STORE).includes('ballistic_rating'), 'no ballistic_rating field anywhere');
const g2 = lock.find((r) => r.system === 'UL 768' && r.rating === 'Group 2');
assert(g2 && g2.manipulationHours === null, 'UL 768 Group 2 manipulationHours is null');
for (const r of lock) {
  if (r.system !== 'FF-L-2740B') assert(!('rating' in r && String(r.rating).includes('FF-L-2740')), 'no FF-L-2740 in a UL-group rating field');
}
const storeSources = new Set();
for (const r of [...reg, ...lock, ...notes]) { if (r.source) storeSources.add(r.source); }
for (const r of [...reg, ...lock, ...notes]) assert(storeSources.has(r.source), 'row source in the store source set');

const ops = {
  '@id': BASE + '/#dataset-vault-security-operations',
  '@type': 'Service',
  name: 'Vault Security Standards Registry Operations',
  description: "The standards registry behind vault door relocation and installation at The Flat Rate Movers: the verified reference layer for the standards a vault door is specified by — UL 608 vault door and modular panel classes, GSA Class 5-V / 5-A / 5-B under federal specification AA-D-600D, the federal electromechanical lock specification FF-L-2740B, UL 768 combination lock groups, and UL 887 delayed-action timelocks. Every figure in this file is taken from the standards' own published text or the governing body's own pages, and every row carries its source. The registry exists because vault doors are bought against standards, and a door's weight, class, and lock decide how it travels, what floor it can stand on, and how it is installed. The company's work is the movement and installation of the doors themselves — delivery, relocation, and installation at any size, with structural and floor analysis under SIR (Structural Integrity Relocation) and the KIM-GS Protocol where a door's weight falls in the 1,500 to 3,500 lb band, and doors above the band scoped from their own facts. Three routes carry this dataset: the file https://theflatratemovers.com/datasets-vault-security.json, the API inventory at /v1/datasets, and the landing page https://theflatratemovers.com/datasets/vault-security/.",
  keywords: ['UL 608', 'GSA Class 5-V', 'AA-D-600D', 'FF-L-2740B', 'UL 768', 'vault door standards'],
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

const registryNode = {
  '@type': 'Dataset',
  '@id': BASE + '/datasets/vault-security/#dataset-vault-security-standards',
  name: 'Vault Door Standards Registry — UL 608, AA-D-600D, FF-L-2740B',
  description: "The verified standards registry for vault doors and high-security enclosures. UL 608 classes M, 1, 2, and 3 carry net working times of 15, 30, 60, and 120 minutes against one identical attack basis — common mechanical tools, electric tools, cutting torches, or any combination — and UL 608 section 1.3 excludes attack with the burning bar (thermal lance) or explosives from every class. GSA Class 5-V under AA-D-600D requires resistance to 20 man-hours of surreptitious entry, 30 man-minutes of covert entry, and 10 man-minutes of forced entry, with no ballistic requirement; Class 5-A drops the surreptitious requirement; Class 5-B adds ballistic resistance tested to SD-STD-01.01 Rev. G level 2, and the specification names no test round. Door lock requirements are recorded as their own fields, never blended into the door figures: Class 5-V and 5-B doors carry a lock meeting FF-L-2740 (Style H or K), while Class 5-A's lock is a UL 768 Group 1 lock. The registry also carries three corrective notes where widely published charts contradict the standards' own text. Every row carries the primary source it was verified against on 2026-11-02.",
  url: LANDING, sameAs: LANDING, identifier: LANDING,
  isAccessibleForFree: true, license: CC,
  creator: creatorFull(), publisher: creatorFull(),
  datePublished: FIRST_PUBLISHED, dateModified: TODAY,
  includedInDataCatalog: CATALOG,
  spatialCoverage: placesFull(),
  keywords: ['UL 608 Class M', 'UL 608 Class 1', 'UL 608 Class 2', 'UL 608 Class 3', 'GSA Class 5-V', 'GSA Class 5-A', 'GSA Class 5-B', 'AA-D-600D', 'QPL-AA-D-600-12', 'vault door classes'],
  standardsRegistry: reg,
  correctiveNotes: notes,
  distribution: distFor(FILE_URL),
};

const lockingNode = {
  '@type': 'Dataset',
  '@id': BASE + '/datasets/vault-security/#dataset-vault-security-locking',
  name: 'Vault Locking Systems — UL 768 Groups, FF-L-2740B, UL 887 Timelocks',
  description: "The locking-systems table for vault doors, in the standards' own vocabulary. UL 768 combination lock groups: Group 1 resists expert manipulation for 20 working hours; Group 1R adds 20 working hours of radiological (X-ray) resistance; Group 2M resists for 2 working hours; Group 2 requires a moderate degree of resistance and carries no hour figure in UL 768 — any number attached to Group 2 is invented. UL 768 section 1.3 does not cover electronic locks. FF-L-2740B is the federal specification for electromechanical combination locks — 20 man-hours each against manipulation, radiological analysis, and emanations analysis, and 30 man-minutes against covert entry — sold only to the Federal Government and authorised contractors; it is a federal specification, not a UL 768 group. Delayed-action timelocks sit under UL 887, not UL 768: automatic timelocks carry a factory-set delay of at least 5 minutes, and manual timelocks are user-set with delays of 120 hours or more.",
  url: LANDING, sameAs: LANDING, identifier: LANDING,
  isAccessibleForFree: true, license: CC,
  creator: creatorFull(), publisher: creatorFull(),
  datePublished: FIRST_PUBLISHED, dateModified: TODAY,
  includedInDataCatalog: CATALOG,
  spatialCoverage: placesFull(),
  keywords: ['UL 768 Group 1', 'UL 768 Group 1R', 'UL 768 Group 2M', 'UL 768 Group 2', 'FF-L-2740B locks', 'UL 887 timelocks', 'vault door locks'],
  lockingSystemsScopeNote: STORE.lockingSystemsScopeNote,
  lockingSystems: lock,
  distribution: distFor(FILE_URL),
};

const methodNode = {
  '@id': BASE + '/#dataset-vault-security-method',
  '@type': 'Article',
  name: 'How the Registry Is Verified',
  description: "Method for the vault security standards registry. The registry is maintained from primary sources only: the specification texts of AA-D-600D and FF-L-2740B read in full, the ASSIST QuickSearch records for both specifications, UL's own standard and certification pages, and the standards' Scope text as published by standards distributors; UL 768 group hour figures are corroborated by the lock manufacturer's own published glossary and two independent summaries, because the standard itself is paywalled. A figure enters the registry only when it traces to one of those sources, and each row carries its source URL. Door requirements and lock requirements are kept in separate fields by construction, because the most common error in this space is blending a lock figure into a door rating. Claims that circulate without a primary source are excluded by name in the boundaries node rather than silently dropped: UL 608 to UL 687 equivalence mappings, any hour figure for UL 768 Group 2, any ballistic test round for Class 5-B, and per-class tool lists inside UL 608. A weekly standards-watch observes the ASSIST records, ISOO notices, UL revision summaries, and the two QPL listings; the watch queues changes and never edits data — a changed standard enters this registry only through a sealed batch that re-runs the sourcing for that item.",
  keywords: ['standards verification', 'primary sources', 'vault door standards'],
  about: [{ '@id': BASE + '/#service-vault-door' }],
  spatialCoverage: placesRef(),
  temporalCoverage: '2010/2026',
  dateModified: TODAY,
  creator: creatorLean(),
  license: CC,
  distribution: distShared(),
  sameAs: BASE + '/vault-doors/',
  headline: 'How the Registry Is Verified',
  author: { '@id': ORG_ID },
  publisher: { '@id': ORG_ID },
};

const S = {
  ul608Scope: 'https://standards.globalspec.com/std/14542742/ul-608',
  ul608Shop: 'https://www.shopulstandards.com/ProductDetail.aspx?productId=UL608_7_S_20041130',
  ulCert: 'https://www.ul.com/services/anti-theft-device-testing-and-certification',
  aadText: 'https://govtribe.com/file/government-file/encl-5-fed-spec-aa-d-600d-vault-doors-dot-pdf',
  aadAssist: 'https://quicksearch.dla.mil/qsDocDetails.aspx?ident_number=49651',
  gsaTypes: 'https://www.gsa.gov/buy-through-us/purchasing-programs/requisition-programs/gsa-global-supply/national-stock-numbers/security-containers/types-of-security-containers',
  navfacDoors: 'https://exwc.navfac.navy.mil/DoD-Lock-Program/Security-Hardware/GSA-Approved-Vault-Doors/Vault-Door-Order-Info/',
  aaf363: 'https://mbausa.com/content/downloadfiles/Federal_Specifications/AA-F-363D.pdf',
  ffText: 'http://ftp.sargentandgreenleaf.com/2740B/pdf/2740_Federal_Spec_FF-L-2740B.pdf',
  ffAssist: 'https://quicksearch.dla.mil/qsDocDetails.aspx?ident_number=69846',
  navfacLocks: 'https://exwc.navfac.navy.mil/DoD-Lock-Program/Security-Hardware/Combination-Locks/',
  ul768Shop: 'https://www.shopulstandards.com/ProductDetail.aspx?UniqueKey=34369',
  ul768Scope: 'https://datasheets.globalspec.com/ds/uls/ul-768/af811c5c-da61-4c34-b3e6-552e2bf0d2dd',
  ul768Sg: 'https://www.manualslib.com/manual/2017386/Stanley-Sargent-And-Greenleaf-6730.html?page=7',
  ul768Kc: 'https://www.kcolefas.com/en/insights/safe-lock',
  ul768Lw: 'https://www.lockwiki.com/index.php?title=UL_768',
  ul887Shop: 'https://www.shopulstandards.com/ProductDetail.aspx?UniqueKey=18485',
  osha: 'https://www.osha.gov/nationally-recognized-testing-laboratory-program/list-standards',
};
const sourcesNode = {
  '@id': BASE + '/#dataset-vault-security-sources',
  '@type': 'Article',
  name: 'Standards Sources',
  description: 'Primary sources for every figure in the vault security standards registry, verified 2026-11-02.',
  keywords: ['UL 608 source', 'AA-D-600D source', 'FF-L-2740B source', 'UL 768 source', 'UL 887 source'],
  about: [{ '@id': BASE + '/#service-vault-door' }],
  spatialCoverage: placesRef(),
  temporalCoverage: '2010/2026',
  dateModified: TODAY,
  creator: creatorLean(),
  license: CC,
  distribution: distShared(),
  sameAs: LANDING,
  headline: 'Standards Sources',
  author: { '@id': ORG_ID },
  publisher: { '@id': ORG_ID },
  sources: [
    { standard: 'UL 608 — Scope (sections 1.1-1.3: classes, net working times, attack basis, burning bar and explosives exclusion)', url: S.ul608Scope },
    { standard: 'UL 608, Edition 7 — UL Standards store record (edition and status)', url: S.ul608Shop },
    { standard: 'UL anti-theft device testing and certification (UL Mark and certification categories YUSR / YUTZC)', url: S.ulCert },
    { standard: 'AA-D-600D — specification text (sections 1.2.1, 3.4.1, 3.4.2, 3.7.1, 3.13.3, 4.4.8.3, 6.5.2)', url: S.aadText },
    { standard: 'AA-D-600D — ASSIST QuickSearch record (Revision D, Amendment 4, Active, QPL-AA-D-600-12)', url: S.aadAssist },
    { standard: 'GSA Global Supply — types of security containers (AA-D-600 programme listing, Class 5 only)', url: S.gsaTypes },
    { standard: 'DoD Lock Program (NAVFAC) — GSA-approved vault door order information (Class 5-V gloss)', url: S.navfacDoors },
    { standard: 'AA-F-363D — security filing cabinets (the shared Class 5 protection level across the GSA spec family)', url: S.aaf363 },
    { standard: 'FF-L-2740B — specification text (sections 1.1.1, 3.3.1, 3.7)', url: S.ffText },
    { standard: 'FF-L-2740B — ASSIST QuickSearch record (Revision B, Amendment 2, Active, QPL-FF-L-2740-10)', url: S.ffAssist },
    { standard: 'DoD Lock Program (NAVFAC) — combination locks (FF-L-2740B locks on GSA containers and vault doors since Feb 15, 2015)', url: S.navfacLocks },
    { standard: 'UL 768, Eighth Edition — UL Standards store record (edition and status)', url: S.ul768Shop },
    { standard: 'UL 768 — Scope text (sections 1.1-1.3; electronic locks not covered)', url: S.ul768Scope },
    { standard: 'UL 768 group definitions — Sargent & Greenleaf glossary, manufacturer of record for UL 768 locks', url: S.ul768Sg },
    { standard: 'UL 768 group summary — Kcolefas', url: S.ul768Kc },
    { standard: 'UL 768 test summary — Lockwiki', url: S.ul768Lw },
    { standard: 'UL 887, Edition 8 — UL Standards store record (delayed-action timelocks)', url: S.ul887Shop },
    { standard: 'OSHA NRTL standards list (UL 887 listing)', url: S.osha },
  ],
};

const boundariesNode = {
  '@id': BASE + '/#dataset-vault-security-boundaries',
  '@type': 'Service',
  name: 'Vault Security Scope Boundaries',
  description: "Scope boundaries for the vault security category, stated as data. The Flat Rate Movers relocates, delivers, and installs vault doors and high-security enclosures; vault installation is offered at any size. UL and GSA designations in this file are product standards: they describe doors and locks, never the company. The company holds no UL listing, no GSA approval, and no seat on QPL-AA-D-600-12 or QPL-FF-L-2740-10, and no surface of this category states or implies otherwise. The company provides no locksmith or combination services — combination changes, lock opening, and lock replacement are locksmith and manufacturer work. Vault and safe contents are emptied by the customer before any move. FF-L-2740B locks are sold only to the Federal Government and authorised contractors and are never presented as retail products. Not published in this file, by name: UL 608 to UL 687 equivalence mappings; any manipulation-hour figure for UL 768 Group 2; any ballistic test round or calibre for AA-D-600D Class 5-B; per-class tool differentiation inside UL 608; and any door-model specification that has not passed the verification protocol of the companion dataset, datasets-vault-doors.json.",
  keywords: ['vault door moving scope', 'no locksmith services', 'product standards'],
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

const out = { '@context': 'https://schema.org', '@graph': [ops, registryNode, lockingNode, methodNode, sourcesNode, boundariesNode] };
fs.writeFileSync(path.join(PUB, 'datasets-vault-security.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`datasets-vault-security.json written: 6 nodes, registry ${reg.length}, locking ${lock.length}, notes ${notes.length}`);
