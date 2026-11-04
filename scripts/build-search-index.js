// Flat Rate Machine — Search Index Supply & Standing dataset builder
// (Retrieval Machine build B1, 2026-10-31).
//   node scripts/build-search-index.js [--verdicts <file>] [--out <file>]
//   node scripts/build-search-index.js --check [--verdicts <file>]
// Run from the-flat-rate-machine/. No dependencies beyond Node itself
// (the rubric database is read through the sqlite3 CLI, the pattern
// build-intent-rubric.js established).
//
// WHAT THIS IS
// datasets-search-index.json: the standing dataset of the Retrieval
// Machine's search-index element (design: Retrieval Machine Dossier 01
// §5). Seven tables in one D1–D8-framed file:
//   query_cluster      — the intent rubric's rows grouped into the
//                        clusters a search index actually ranks:
//                        (service, intent class, geo scope, target URL).
//   url_supply         — generated per registry page, never hand-kept:
//                        type, title, schema types, word count, internal
//                        inlinks with top anchor texts, lastmod, the
//                        SHA-256 digest of the page's per-page JSON, and
//                        its indexation state with source and date.
//   standing_observation — sampled positions and console verdicts ONLY
//                        from evidence that exists. Every row carries
//                        method, era and source; methods are never
//                        averaged together. A query with no observation
//                        carries no standing row — observed absence is
//                        recorded as observed absence, never as a
//                        fabricated position, and nothing is zero-filled.
//   engine_window      — the Search Console export overlay: era-tagged
//                        pre-rebuild evidence attached to rubric rows.
//                        Pages absent from the window are "not in
//                        window", never zero-filled.
//   competitor_asset   — observations about OTHER companies' supply,
//                        sampled the same day as the standing sample.
//                        SCHEMA BAR: this table's values can never join
//                        into any company-claim surface. The generator
//                        refuses to emit the file if a competitor record
//                        carries a company-claim field (rating, price,
//                        review count, endorsement) — see
//                        assertCompetitorBar().
//   third_party_record — third-party records about the company: the
//                        value found, the correct value, the correction
//                        status, and the date last checked.
//   gap_record         — the dossier's named gaps, each with its
//                        designed solution and resolving batch.
//
// SOURCES (all read live at generation; locations come from paths.json,
// the machine repo's paths registry — no batch paths are compiled in):
//   rubric DB (intent_query + outcome evidence + GSC evidence tables),
//   data/pages.json + data/services.json registries, the source shell
//   (repo-dir/index.html: word counts, inlinks, anchor texts),
//   functions/head-data.js (served titles), the public tree's per-page
//   JSON files (schema types + digests), service-area.geojson
//   (footprint), and the Search Console indexing-pass verdicts (the
//   standing latest-verdicts file in the rubric work dir named by the
//   registry; --verdicts overrides the path).
//
// DIGEST SEMANTICS (url_supply): the SHA-256 of the page's per-page
// JSON file in the public tree at generation time. A completed estate
// batch seals exactly those bytes into the signed index, so the supply
// digest equals the sealed distribution digest after every batch; a
// verification check asserts that equality against the served index.
//
// DETERMINISM: never the wall clock, so --check is byte-stable
// across days. Q124 (2026-11-03): file-level dateModified stamps
// take FILE_DM — the lastmod-ledger date for this file's URL when
// the seal passes FB3_STAMPS (else the ledger read directly, else
// DATE_MOD) — while DATE_MOD (the newest evidence date among its
// inputs) keeps its evidence roles: validation and evidence prose.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { CATALOG } = require('./lib-constants.js');

const ROOT = path.resolve(__dirname, '..');
const REG = JSON.parse(fs.readFileSync(path.join(ROOT, 'paths.json'), 'utf8'));
const PUB = REG.public_dir;
const REPO_DIR = REG.repo_dir;
const DB = REG.rubric_db;
const PAGES_DIR = REG.pages_dir;
const SITE = 'https://theflatratemovers.com';
const LANDING = SITE + '/datasets/search-index/';
const FILE_URL = SITE + '/datasets-search-index.json';
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const CREATOR = {
  '@id': SITE + '/#organization',
  '@type': 'Organization',
  name: 'The Flat Rate Movers',
  foundingDate: '2010-06',
  sameAs: [
    'https://www.instagram.com/theflatratemoversllc/',
    'https://www.threads.com/@theflatratemoversllc',
    'https://x.com/ratemovers',
    'https://www.youtube.com/@theflatratemovers',
    'https://github.com/TheFlatRateMovers',
    'https://medium.com/@ratemovers',
  ],
};

function arg(name) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : null;
}
const CHECK = process.argv.includes('--check');
// The console verdicts are a standing input: the latest indexing
// pass's verdicts file lives in the rubric work dir named by the
// paths registry (each new pass replaces it, and this dataset
// regenerates in the same motion). --verdicts overrides the path.
const defaultVerdicts = path.join(REG.rubric_work_dir, 'gsc-verdicts-latest.json');
const verdictsPath = arg('verdicts') || (fs.existsSync(defaultVerdicts) ? defaultVerdicts : null);
const outPath = arg('out') || path.join(PUB, 'datasets-search-index.json');

function sql(q) {
  const out = execFileSync('sqlite3', ['-json', DB, q], { maxBuffer: 256 * 1024 * 1024 }).toString();
  return out.trim() ? JSON.parse(out) : [];
}
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function targetSlug(url) {
  const p = url.replace(SITE, '').replace(/^\/|\/$/g, '');
  return p === '' ? 'home' : p.replace(/\//g, '-');
}

// ---------------------------------------------------------------- seed:
// sampled standing + competitor observations, transcribed from Retrieval
// Machine Dossier 01 §§2–3 (live sampling, 2026-10-31). Every row keeps
// its method, era and source; positions the sampling did not state
// numerically are null with the observation carried in the note — never
// reconstructed.
const SAMPLE_DATE = '2026-10-31';
const SAMPLE_ERA = 'post-rebuild';
const SAMPLE_SOURCE = 'Retrieval Machine Dossier 01 (live search sampling, 2026-10-31)';
const SAMPLED = [
  {
    query: 'gun safe movers Virginia', engine: 'google', method: 'serp-sample',
    serviceId: 'service-gun-safe', geoScope: 'state-virginia', moneyWeight: 'P1',
    ourPosition: 1, ourUrl: SITE + '/gun-safe-movers/', observedAbsent: false,
    localPackPresent: null, aiOverviewPresent: null,
    holders: [
      { name: 'Southside Moving and Storage', note: 'holds a dedicated gun-safe page in the sampled result set' },
      { name: 'VanGuard Moving Express', note: 'holds a dedicated gun-safe page in the sampled result set' },
    ],
    note: 'The company holds position 1 with the gun-safe hub. The 1,500–3,500 lb high-mass band is named by no competitor supply found in the sampling.',
  },
  {
    query: 'movers in Winchester VA (local pack)', engine: 'google', method: 'places-sample',
    serviceId: null, geoScope: 'place-winchester-va', moneyWeight: 'P2',
    ourPosition: 5, ourUrl: SITE + '/', observedAbsent: false,
    localPackPresent: true, aiOverviewPresent: null,
    holders: [
      { name: 'Mover Dudes', note: 'pack position 1 in the sampled order' },
      { name: 'Shields Movers', note: 'pack position 2 in the sampled order' },
      { name: 'M.C. Movers', note: 'pack position 3 in the sampled order' },
      { name: 'Hulk Haulers', note: 'pack position 4 in the sampled order' },
      { name: 'Royal Movers', note: 'pack position 6 in the sampled order' },
      { name: 'Pattons Moving', note: 'pack position 7 in the sampled order' },
    ],
    note: 'Sampled pack order: Mover Dudes, Shields, M.C. Movers, Hulk Haulers, The Flat Rate Movers (5th), Royal Movers, Pattons. The company is present in the Winchester pack; the pack leader is a generalist local mover.',
  },
  {
    query: 'movers in Martinsburg WV (local listing)', engine: 'google', method: 'places-sample',
    serviceId: null, geoScope: 'place-martinsburg-wv', moneyWeight: 'P3',
    ourPosition: 1, ourUrl: SITE + '/', observedAbsent: false,
    localPackPresent: true, aiOverviewPresent: null,
    holders: [
      { name: 'DJ Moving Pros', note: 'present in the sampled Martinsburg result set' },
      { name: "Mama's Movers", note: 'present in the sampled Martinsburg result set' },
    ],
    note: 'The Martinsburg branch listing holds position 1. The Martinsburg field is weak: two profile-incomplete competitors take the next slots.',
  },
  {
    query: 'transloading services Virginia', engine: 'google', method: 'serp-sample',
    serviceId: 'service-transloading', geoScope: 'state-virginia', moneyWeight: 'P1',
    ourPosition: null, ourUrl: null, observedAbsent: true,
    localPackPresent: null, aiOverviewPresent: null,
    holders: [
      { name: 'Virginia Crossdock 247', note: 'leads the sampled result set' },
      { name: 'Olimp Warehousing', note: 'present in the sampled result set' },
      { name: 'Atlantic Coast Hauling', note: 'present in the sampled result set' },
      { name: 'Buske Logistics', note: 'present in the sampled result set' },
      { name: 'Total Distribution Inc', note: 'present in the sampled result set' },
    ],
    note: 'The company is absent from the sampled result set for the generic state query: Richmond- and port-based 3PL content holds it. The company wedge is the Virginia Inland Port / Interstate 81 cluster, not the generic state query.',
  },
  {
    query: 'warehouse racking relocation', engine: 'google', method: 'serp-sample',
    serviceId: 'service-warehouse-racking-relocation', geoScope: 'state-virginia', moneyWeight: 'P1',
    ourPosition: null, ourUrl: SITE + '/gun-safe-movers/', observedAbsent: false,
    localPackPresent: null, aiOverviewPresent: null,
    holders: [
      { name: 'Richmond Rack', note: 'holds racking-specific supply in the sampled result set' },
      { name: 'TP Supply', note: 'holds racking-specific supply in the sampled result set' },
      { name: 'WDRacks', note: 'holds racking-specific supply in the sampled result set' },
    ],
    note: 'The URL Google returned for the company was the gun-safe hub, not the dedicated warehouse racking relocation page (live since 2026-10-30 and in the sitemap). Recorded as the G2 anomaly in the gap table: indexation lag or hub-signal concentration; the verdict-reconciliation batch decides.',
  },
  {
    query: 'data center relocation services Virginia', engine: 'google', method: 'serp-sample',
    serviceId: 'service-data-center-relocation', geoScope: 'state-virginia', moneyWeight: 'P1',
    ourPosition: 2, ourUrl: SITE + '/gun-safe-movers/', observedAbsent: false,
    localPackPresent: null, aiOverviewPresent: null,
    holders: [
      { name: 'Data Center Relocation Experts', note: 'present in the sampled result set' },
      { name: 'MG Moving', note: 'holds a dedicated category page in the sampled result set' },
      { name: 'JK Moving', note: 'holds a dedicated category page in the sampled result set' },
    ],
    note: 'The company is visible at position 2 — through the gun-safe hub again, not the dedicated data center relocation page. Same G2 anomaly.',
  },
  {
    query: 'medical equipment moving company Virginia', engine: 'google', method: 'serp-sample',
    serviceId: 'service-medical-lab-relocation', geoScope: 'state-virginia', moneyWeight: 'P1',
    ourPosition: 2, ourUrl: SITE + '/gun-safe-movers/', observedAbsent: false,
    localPackPresent: null, aiOverviewPresent: null,
    holders: [
      { name: 'Move OMX', note: 'present in the sampled result set' },
      { name: 'JK Moving', note: 'present in the sampled result set' },
      { name: 'National Medical Equipment Logistics', note: 'present in the sampled result set' },
      { name: 'MG Moving', note: 'present in the sampled result set' },
    ],
    note: 'The company is visible at position 2 — through the gun-safe hub again, not the dedicated medical and lab equipment relocation page. Same G2 anomaly.',
  },
  {
    query: 'Virginia Inland Port Front Royal intermodal transloading', engine: 'google', method: 'serp-sample',
    serviceId: 'service-transloading', geoScope: 'virginia-inland-port', moneyWeight: 'P1',
    ourPosition: null, ourUrl: null, observedAbsent: true,
    localPackPresent: null, aiOverviewPresent: null,
    holders: [],
    note: 'The sampled result set is institutional only (port authority, state, rail and reference sources); no local vendor is visible. The shipper-intent version of this query is unowned by any vendor in the sampling.',
  },
];

// Competitor assets: observations about THEIR supply, from the same
// sampling. No ratings, prices, review counts or endorsements — the
// schema bar is enforced in code below.
const COMPETITOR_ASSETS = [
  { competitor: 'Southside Moving and Storage', asset: 'Dedicated gun-safe moving page', queryContext: 'gun safe movers Virginia', observedPosition: null, note: 'Dedicated category page present in the sampled result set; the company holds position 1 for the query.' },
  { competitor: 'VanGuard Moving Express', asset: 'Dedicated gun-safe moving page', queryContext: 'gun safe movers Virginia', observedPosition: null, note: 'Dedicated category page present in the sampled result set.' },
  { competitor: 'Mover Dudes', asset: 'Local pack listing, Winchester', queryContext: 'movers in Winchester VA (local pack)', observedPosition: 1, note: 'Pack leader in the sampled order. A generalist local mover.' },
  { competitor: 'Shields Movers', asset: 'Local pack listing, Winchester', queryContext: 'movers in Winchester VA (local pack)', observedPosition: 2, note: 'Present in the sampled pack order.' },
  { competitor: 'M.C. Movers', asset: 'Local pack listing, Winchester', queryContext: 'movers in Winchester VA (local pack)', observedPosition: 3, note: 'Present in the sampled pack order.' },
  { competitor: 'Hulk Haulers', asset: 'Local pack listing, Winchester', queryContext: 'movers in Winchester VA (local pack)', observedPosition: 4, note: 'Present in the sampled pack order.' },
  { competitor: 'Royal Movers', asset: 'Local pack listing, Winchester', queryContext: 'movers in Winchester VA (local pack)', observedPosition: 6, note: 'Present in the sampled pack order.' },
  { competitor: 'Pattons Moving', asset: 'Local pack listing, Winchester', queryContext: 'movers in Winchester VA (local pack)', observedPosition: 7, note: 'Present in the sampled pack order.' },
  { competitor: 'DJ Moving Pros', asset: 'Local listing, Martinsburg', queryContext: 'movers in Martinsburg WV (local listing)', observedPosition: null, note: 'Present below the company listing, which holds position 1.' },
  { competitor: "Mama's Movers", asset: 'Local listing, Martinsburg', queryContext: 'movers in Martinsburg WV (local listing)', observedPosition: null, note: 'Present below the company listing, which holds position 1.' },
  { competitor: 'Virginia Crossdock 247', asset: 'Transloading / cross-dock service content, Richmond VA', queryContext: 'transloading services Virginia', observedPosition: 1, note: 'Leads the sampled result set for the generic state query.' },
  { competitor: 'Olimp Warehousing', asset: 'Transloading service content', queryContext: 'transloading services Virginia', observedPosition: null, note: 'Present in the sampled result set.' },
  { competitor: 'Atlantic Coast Hauling', asset: 'Transloading service content', queryContext: 'transloading services Virginia', observedPosition: null, note: 'Present in the sampled result set.' },
  { competitor: 'Buske Logistics', asset: 'Transloading / 3PL service content', queryContext: 'transloading services Virginia', observedPosition: null, note: 'Present in the sampled result set.' },
  { competitor: 'Total Distribution Inc', asset: 'Transloading / distribution service content', queryContext: 'transloading services Virginia', observedPosition: null, note: 'Present in the sampled result set.' },
  { competitor: 'Richmond Rack', asset: 'Racking-specific product and service supply', queryContext: 'warehouse racking relocation', observedPosition: null, note: 'Rack dealer supply, not a mover: little direct overlap with a mover who disassembles, moves and re-installs.' },
  { competitor: 'TP Supply', asset: 'Racking-specific supply', queryContext: 'warehouse racking relocation', observedPosition: null, note: 'Present in the sampled result set.' },
  { competitor: 'WDRacks', asset: 'Racking-specific supply (buyback angle)', queryContext: 'warehouse racking relocation', observedPosition: null, note: 'Present in the sampled result set; its buyback angle is untested against this company model.' },
  { competitor: 'Data Center Relocation Experts', asset: 'Dedicated data-center relocation content', queryContext: 'data center relocation services Virginia', observedPosition: null, note: 'Present in the sampled result set; the company sample position (2) came through its hub, not its dedicated page.' },
  { competitor: 'MG Moving', asset: 'Dedicated data-center and medical category pages', queryContext: 'data center relocation services Virginia; medical equipment moving company Virginia', observedPosition: null, note: 'Regional mover with dedicated category pages in both sampled B2B queries.' },
  { competitor: 'JK Moving', asset: 'Dedicated data-center and medical category pages', queryContext: 'data center relocation services Virginia; medical equipment moving company Virginia', observedPosition: null, note: 'National mover present in both sampled B2B queries.' },
  { competitor: 'Move OMX', asset: 'Medical equipment moving content', queryContext: 'medical equipment moving company Virginia', observedPosition: null, note: 'Present in the sampled result set.' },
  { competitor: 'National Medical Equipment Logistics', asset: 'Medical equipment logistics content', queryContext: 'medical equipment moving company Virginia', observedPosition: null, note: 'Present in the sampled result set.' },
];

// Third-party records about the company: value found vs correct value,
// from Retrieval Machine Dossier 03 (re-verified 2026-10-31) joined to
// the backlink program's wave-1 statuses (2026-10-30). Correct values
// are the company's own published facts only.
const CORRECT_ADDRESS_W = '116 W Piccadilly St Suite 11, Winchester, VA 22601';
const THIRD_PARTY = [
  { source: 'Birdeye (Winchester profile)', field: 'Street address', valueFound: '116 E Piccadilly St (wrong direction prefix); page also states the business has "not been claimed" though it was claimed on 2026-10-30', correctValue: CORRECT_ADDRESS_W, status: 'open', lastChecked: '2026-10-31', note: 'Public profile still serves the pre-claim crawl (about 63 days old at check). Fix starts with an in-account read of the claimed profile.' },
  { source: 'Birdeye (Martinsburg profile)', field: 'Claim state / reviews', valueFound: '"Not been claimed" and "No reviews", though the profile was claimed on 2026-10-30 and the branch holds a 4.7 Google rating from 6 reviews', correctValue: 'Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404', status: 'open', lastChecked: '2026-10-31', note: 'Public profile still serves a crawl about 210 days old. Intermittent 403s to automated fetch recorded.' },
  { source: 'CB Insights', field: 'Headquarters address', valueFound: '1850 Valley Ave, Winchester (a stale address, removed from the company’s own surfaces in the rebuild)', correctValue: CORRECT_ADDRESS_W, status: 'parked-owner-step', lastChecked: '2026-10-31', note: 'Claim form rejects a gmail.com address; needs a company-domain mailbox decision. The page also carries a "Founded Year 2005" string recorded as unverified — the company founding is June 2010.' },
  { source: 'Superpages / Thryv network (Superpages, YellowPages, DexKnows)', field: 'Business address', valueFound: '17048 Waterfall Rd, Haymarket, VA (no company presence there)', correctValue: CORRECT_ADDRESS_W, status: 'parked-owner-step', lastChecked: '2026-10-31', note: 'One Thryv account fix covers all three renders. Needs a new password only the owner can set.' },
  { source: 'Better Business Bureau (profile 0241-235987783)', field: 'Profile address / identity', valueFound: 'A second profile at the stale 1850 Valley Ave address, carrying the Winchester place identity; it is the profile searchers land on', correctValue: CORRECT_ADDRESS_W, status: 'parked-owner-step', lastChecked: '2026-10-31', note: 'Merge into the correct profile 0241-236010957. The merge flow needs the owner signed in; free correction only, no paid accreditation.' },
  { source: 'Better Business Bureau (Martinsburg)', field: 'Profile existence', valueFound: 'No Martinsburg profile exists', correctValue: 'Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404', status: 'open', lastChecked: '2026-10-31', note: 'Rides on the Winchester profile resolution in the same owner sitting.' },
  { source: 'Porch (Winchester profile)', field: 'Years in business / address', valueFound: '"4 years in business" on one part of the page against the company’s own "Since 2010" on another; Suite 11 missing', correctValue: 'In business since June 2010; ' + CORRECT_ADDRESS_W, status: 'parked-owner-step', lastChecked: '2026-10-31', note: 'Corrections queued behind the owner sign-in.' },
  { source: 'Judy’s Book', field: 'Address / category', valueFound: '1850 Valley Ave listed under the category "Personal Care"', correctValue: CORRECT_ADDRESS_W + '; category: moving company', status: 'parked-owner-step', lastChecked: '2026-10-31', note: 'Correction route is paid; the owner default is no. Recorded so the root fix (Data Axle) is tested against it on the refresh cycle.' },
  { source: 'MapQuest', field: 'Listing address (listing ID 270567269)', valueFound: 'Stale address on the listing', correctValue: CORRECT_ADDRESS_W, status: 'correction sent', lastChecked: '2026-10-30', note: 'Free listing report submitted 2026-10-30; the durable fix rides on the Data Axle record.' },
  { source: 'Chamber of Commerce (chamberofcommerce.com)', field: 'Address rendering', valueFound: '"116 Piccadilly Street 11" — the W direction and the word Suite are dropped', correctValue: CORRECT_ADDRESS_W, status: 'correction sent', lastChecked: '2026-10-31', note: 'Merge/correction request sent in wave 1; the rendering error was re-verified 2026-10-31.' },
  { source: 'Fyple', field: 'Listing address', valueFound: 'Stale 1850 Valley Ave address', correctValue: CORRECT_ADDRESS_W, status: 'correction sent', lastChecked: '2026-10-30', note: 'Report submitted 2026-10-30.' },
  { source: 'NSN Lookup', field: 'Company record', valueFound: 'Stale 1850 Valley Ave cluster record', correctValue: CORRECT_ADDRESS_W, status: 'correction sent', lastChecked: '2026-10-30', note: 'Correction sent by live chat 2026-10-30.' },
  { source: 'GreatGuysMove', field: 'Offer / authority framing', valueFound: 'An invented "15% discount" attributed to the company, still live at re-verification, and a framing of "USDOT: Not Authorized" in a comparison table', correctValue: 'No discount has ever been offered or published by the company; the company publishes no USDOT/MC number', status: 'correction sent', lastChecked: '2026-10-31', note: 'Correction sent in wave 1 (remove the invented discount). The identical 15% text traces to the company’s own stale pre-rebuild page — see the gap table for the two-sided fix.' },
  { source: 'AnyFlip', field: 'Mirrored page content', valueFound: 'A stale mirror of the pre-rebuild homepage (about 497 days old at check), still ranking for name queries, carrying old-era claims ("licensed and insured", "same-day service")', correctValue: 'The current homepage: https://theflatratemovers.com/', status: 'open', lastChecked: '2026-10-31', note: 'Takedown route identified; account-or-email step is conditional on the owner sitting.' },
  { source: 'Data Axle', field: 'Root distribution record (Winchester place ID MTGJKSKP)', valueFound: 'Stale record feeding the aggregator cluster (CB Insights, BBB, Judy’s Book, MapQuest, Fyple, NSN Lookup all carry the same stale address)', correctValue: CORRECT_ADDRESS_W, status: 'parked-owner-step', lastChecked: '2026-10-31', note: 'Parked at account confirmation: phone verification complete, the verify-email link fails in the automated browser. The owner completes the confirmation link, then the record correction runs server-side. Whether Data Axle is the sole upstream is an inference the correction sequence tests empirically.' },
  { source: 'moveBuddha (Winchester top-10)', field: 'Inclusion', valueFound: 'The company is absent from the Winchester top-10 list entirely', correctValue: 'The company belongs in the Winchester mover set on its published facts (Winchester branch, flat-rate model, since 2010)', status: 'open', lastChecked: '2026-10-31', note: 'Wave-2 inclusion path in the backlink program.' },
  { source: 'Martinsburg Places record (sampled 2026-10-31)', field: 'Display name / labels', valueFound: 'Display name shortened to "Flat Rate Movers", with unpublished labels "Certified gun safe transport" and "Extreme-mass logistics" attached', correctValue: 'Flat Rate Movers Martinsburg WV; no certification labels are published by the company', status: 'open', lastChecked: '2026-10-31', note: 'New corruption found by the Dossier 03 sampling; correction route runs through the branch’s own profile management.' },
];

// Gap records: Dossier 01 §6, each carrying its designed solution
// (solutions, not problem statements). Statuses are as of generation.
const GAPS = [
  { gapId: 'gap-g1-prominence', title: 'Prominence is the binding constraint, not technical supply', requirementRef: 'Dossier 01 §6 G1 (Claude gates: Corroborated × Worth citing)', evidenceRefs: ['Dossier 01 §2.1', 'Dossier 01 §4.1'], impact: 'Technical supply is at its measured ceiling (verify suite green, Performance 100). Pack order and corroboration decide the head local queries now, and both are built from evidence assets, not from review volume: the company’s high-value and government/military clients do not write reviews, which is a settled fact of this market, not a deficit to engineer around.', status: 'open — solution in force', resolvingBatch: 'Retrieval Machine B7 (proof-asset cadence) + Dossier 03 corroboration program', solution: 'Prominence from evidence assets the company controls: the anonymized job-story engine across every industry served, Business Profile completeness and post cadence on the two in-scope profiles, third-party citation accuracy, and machine citation of the datasets through the answer panel. No review solicitation program exists or is planned.' },
  { gapId: 'gap-g2-hub-concentration', title: 'Dedicated B2B pages not yet the returned URL (G2 anomaly)', requirementRef: 'Dossier 01 §6 G2 (gates: Indexed × Understood)', evidenceRefs: ['Dossier 01 §2.2', 'Dossier 01 §3.2–3.4'], impact: 'For racking, data-center and medical queries the gun-safe hub is the returned company URL while the dedicated pages stand live and in the sitemap. If the cause is hub-signal concentration rather than indexation lag, the dedicated pages will not take over unaided.', status: 'open — reconciliation decides', resolvingBatch: 'Retrieval Machine B2 (verdict reconciliation), then B3 only if B2 finds concentration', solution: 'B2 reconciles the Search Console verdicts against the sampled returns and publishes the determination in this table; B3 (hub-to-dedicated internal-signal consolidation) runs only on a concentration finding. Against lag, the designed response is time plus the standing indexing cadence, not edits.' },
  { gapId: 'gap-g3-hub-fragment-dependence', title: 'Hub-fragment dependence for transloading and port intent', requirementRef: 'Dossier 01 §6 G3 (gate: Understood)', evidenceRefs: ['Dossier 01 §2.2', 'Dossier 02 A2'], impact: 'The hub carries embedded sections for adjacent intents; answer engines cite the fragment while search returns the hub. The dedicated pages must win their own queries outright.', status: 'open — B3 conditional', resolvingBatch: 'Retrieval Machine B3 (conditional on B2)', solution: 'Answer-fragment binding (Dossier 02): each money question gets one canonical fragment on its dedicated page, with the hub fragment demoted to a pointer. Runs inside B3 if B2 confirms concentration.' },
  { gapId: 'gap-g4-third-party-corruption', title: 'Third-party records still corrupt on money queries', requirementRef: 'Dossier 01 §6 G4 (gate: Corroborated)', evidenceRefs: ['Dossier 03 §§2–3', 'third_party_record table in this dataset'], impact: 'Stale addresses, an invented discount and wrong authority framings circulate on records a searcher or an answer engine can read instead of the company’s own surfaces.', status: 'open — correction wave designed', resolvingBatch: 'Retrieval Machine B4 (third-party correction wave; owner steps as one consolidated sitting)', solution: 'The registry in this dataset generates the owner-step list; corrections run in dependency order (Data Axle root first, then the aggregator-fed records get one refresh cycle before any direct-edit retry). "Corrected-live" is claimed only on direct-fetch proof.' },
  { gapId: 'gap-g5-no-bing-channel', title: 'No Bing channel at all', requirementRef: 'Dossier 01 §6 G5 (gate: Crawlable, second engine)', evidenceRefs: ['Dossier 01 §2.5'], impact: 'No verified Bing Webmaster property, no IndexNow, no Bing Places work: the estate is invisible to the second engine’s consoles and its AI surfaces that draw on the same index.', status: 'open — channel build designed', resolvingBatch: 'Retrieval Machine B5 (Bing channel)', solution: 'Verify the Webmaster property through the existing DNS access, publish an IndexNow key file as a new sealed distribution, wire deploy-hook submissions, and import the first Bing standing into this dataset’s observation table under its own method (bing-wmt), never averaged with Google methods.' },
  { gapId: 'gap-g6-datasets-not-in-dataset-search', title: 'Datasets not present in Google Dataset Search at audit', requirementRef: 'Dossier 01 §6 G6 (gate: Corroborated, machine surfaces)', evidenceRefs: ['Outlets verification audit 2026-10-30', 'Dossier 04 (dataset catalog)'], impact: 'The 33 dataset files are fully marked up and landed, but the catalog surface that aggregates datasets had not picked them up at audit time.', status: 'open — routed to the dataset-catalog element', resolvingBatch: 'Dossier 04 program (re-check on the measurement cadence)', solution: 'Presence is re-checked on the measurement cadence; the dataset-catalog dossier owns the verdict and any additional registration routes. No markup change is indicated: the Dataset schema is checker-verified every batch.' },
  { gapId: 'gap-g7-proof-assets', title: 'Proof assets are thin for the B2B categories', requirementRef: 'Dossier 01 §6 G7 (gate: Worth citing)', evidenceRefs: ['Dossier 01 §4.4', 'Blog program record (first job story live 2026-10-31)'], impact: 'The categories with the highest contract value have the fewest citable proof assets; the first anonymized job story (a 1,650 lb gun safe delivered and installed in Moorefield, WV) is live, and the pipeline behind it is the fix.', status: 'open — pipeline designed', resolvingBatch: 'Retrieval Machine B7 (proof-asset cadence)', solution: 'The job-story pipeline runs on the blog program’s gates with client identity never published: one story per completed job the owner clears, told by scope, weight, terrain and method. Cadence, not campaigns.' },
  { gapId: 'gap-g8-no-standing-dataset', title: 'No standing dataset existed (closed by this build)', requirementRef: 'Dossier 01 §5 (the dataset design itself)', evidenceRefs: ['Dossier 01 §5.1–5.3'], impact: 'Before this build, sampled standing lived in prose dossiers and console verdicts lived in a log; neither was a queryable, sealed, regenerating dataset.', status: 'closed by B1 for the dataset; the prompt panel itself is Dossier 02 A1', resolvingBatch: 'Retrieval Machine B1 (this build)', solution: 'This dataset: regenerated from the live estate by scripts/build-search-index.js in the batch cadence, sealed in the signed index, with method-and-era discipline enforced at generation. The remaining instrument gap — citation standing on the answer engines’ own surfaces — is Dossier 02’s Answer Panel, a separate build.' },
  { gapId: 'gap-stale-legacy-page', title: 'Stale pre-rebuild page still in the index, feeding a third-party error', requirementRef: 'Dossier 03 §3.8 (two-sided fix)', evidenceRefs: ['Dossier 03 §3.8', 'third_party_record: GreatGuysMove'], impact: 'The company’s own stale pre-rebuild page (a free-estimates post from the old site) carries the same invented 15% discount text a third-party record now attributes to the company. Correcting only the third party leaves the source standing.', status: 'open — retirement designed', resolvingBatch: 'A later retirement batch (sequenced with the correction wave)', solution: 'Two-sided: retire the stale page from the estate (with its sitemap, registry and seal consequences handled as a normal batch), then re-run the third-party correction with the source gone.' },
];

// ------------------------------------------------------------- inputs
const pagesReg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages.json'), 'utf8'));
const servicesReg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'services.json'), 'utf8'));
const geo = JSON.parse(fs.readFileSync(path.join(PUB, 'service-area.geojson'), 'utf8'));
// Footprint membership: the geojson now carries a scalar `branch`
// property per feature ('winchester' | 'martinsburg' | 'both'); earlier
// exports carried a `branches` array. Normalise both shapes to a
// membership list so the footprint counts follow the file as published.
function featureBranches(f) {
  const p = (f && f.properties) || {};
  if (Array.isArray(p.branches)) return p.branches;
  if (p.branch === 'both') return ['winchester', 'martinsburg'];
  return p.branch ? [p.branch] : [];
}
const inFootprint = (f, b) => featureBranches(f).includes(b);
const shell = fs.readFileSync(path.join(REPO_DIR, 'index.html'), 'utf8');
const headDataSrc = fs.readFileSync(path.join(PAGES_DIR, 'functions', 'head-data.js'), 'utf8');

const intentRows = sql('SELECT id, query_text, intent_class, service_id, area, target_url FROM intent_query ORDER BY id');
const meta = {};
for (const r of sql('SELECT key, value FROM intent_meta')) meta[r.key] = r.value;
const gscAttached = sql('SELECT observation_id, query_text, service_id FROM intent_row_gsc_evidence ORDER BY observation_id, id');
const gscQueries = sql('SELECT id, query_text_normalized, clicks, impressions, ctr, avg_position, window_start, window_end, resolved_target_url FROM gsc_observed_queries');

let verdicts = null;
if (verdictsPath) {
  verdicts = JSON.parse(fs.readFileSync(verdictsPath, 'utf8'));
  if (verdicts.kind !== 'indexing') throw new Error('verdicts file kind must be indexing');
}
const verdictByUrl = new Map();
if (verdicts) for (const v of verdicts.verdicts) verdictByUrl.set(v.url, v);

// dates: DATE_MOD = newest evidence date (deterministic) — evidence
// semantics only since Q124; file-level stamps take FILE_DM below.
const evidenceDates = ['2026-07-29', '2026-10-28', SAMPLE_DATE];
if (verdicts) evidenceDates.push(verdicts.observed_at);
const DATE_MOD = evidenceDates.sort().slice(-1)[0];

/* Q124 wire (2026-11-03; the build-local-graph.js FB-3 pattern):
 * file-level dateModified fields take FILE_DM — the seal phase-0
 * stamps value for this file's own URL when the seal passes
 * FB3_STAMPS, else the lastmod ledger read directly (verify --check
 * runs without FB3_STAMPS), else DATE_MOD. */
const FILE_DM = (() => {
  if (process.env.FB3_STAMPS) {
    const m = JSON.parse(fs.readFileSync(process.env.FB3_STAMPS, 'utf8'));
    const v = m.files && m.files['https://theflatratemovers.com/datasets-search-index.json'];
    if (!v) throw new Error('FB3_STAMPS lacks the search-index file entry');
    return v;
  }
  try {
    const ledger = JSON.parse(fs.readFileSync(
      path.join(__dirname, '..', 'data', 'lastmod-ledger.json'), 'utf8'));
    return (ledger.urls && ledger.urls['https://theflatratemovers.com/datasets-search-index.json']) || DATE_MOD;
  } catch (_) { return DATE_MOD; }
})();

// ------------------------------------------------------- shell mining
function divText(slug) {
  const start = shell.indexOf('<div class="page" id="page-' + slug + '">');
  if (start < 0) return '';
  let i = start, depth = 0, end = shell.length;
  while (i < shell.length) {
    const o = shell.indexOf('<div', i), c = shell.indexOf('</div>', i), s = shell.indexOf('<script', i);
    const cands = [o, c, s].filter((x) => x >= 0);
    if (!cands.length) break;
    const j = Math.min(...cands);
    if (j === s) { i = shell.indexOf('</script>', j) + 9; continue; }
    if (j === o) { depth += 1; i = j + 4; continue; }
    depth -= 1; i = j + 6;
    if (depth === 0) { end = i; break; }
  }
  const body = shell.slice(start, end)
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/g, ' ');
  return body;
}
// head-data.js is an ES module (export const HEAD = {...}); evaluate it
// in place to get the served titles and per-page JSON filenames (jf) —
// the authoritative filename source (a few pages, e.g. nested category
// pages, do not follow the slug-derived pattern).
const HEAD = (() => {
  const m = { exports: {} };
  new Function('module', 'exports', headDataSrc.replace('export const HEAD =', 'module.exports ='))(m, m.exports);
  return m.exports;
})();
function headEntry(urlPath) { return HEAD[urlPath === '' ? '/' : urlPath] || null; }
function headTitle(urlPath) { const e = headEntry(urlPath); return e ? e.t : null; }
function headJsonFile(urlPath) { const e = headEntry(urlPath); return e ? e.jf : null; }

// ------------------------------------------------------------ clusters
function scopeOf(area) { return area == null ? 'pattern-family' : area; }
const clusterMap = new Map();
for (const r of intentRows) {
  const scope = scopeOf(r.area);
  const cid = 'cluster-' + slugify(r.service_id.replace(/^service-/, '')) + '-' + r.intent_class + '-' + slugify(scope) + '-' + targetSlug(r.target_url);
  if (!clusterMap.has(cid)) {
    clusterMap.set(cid, {
      clusterId: cid, canonicalQuery: null, variants: [], intentClass: r.intent_class,
      serviceId: r.service_id, geoScope: scope, moneyWeight: 'standard',
      targetUrl: r.target_url, rubricRowRefs: [], clusterSource: 'rubric-derived',
    });
  }
  const c = clusterMap.get(cid);
  c.variants.push(r.query_text);
  c.rubricRowRefs.push(r.id);
}
for (const c of clusterMap.values()) {
  c.variants = [...new Set(c.variants)].sort();
  c.rubricRowRefs.sort((a, b) => a - b);
  c.canonicalQuery = [...c.variants].sort((a, b) => a.length - b.length || (a < b ? -1 : 1))[0];
}
// sampled clusters (observation-defined; rubric refs only where a row's
// text matches exactly — an honest empty list otherwise).
const rowByText = new Map();
for (const r of intentRows) {
  const k = r.query_text.toLowerCase();
  if (!rowByText.has(k)) rowByText.set(k, []);
  rowByText.get(k).push(r.id);
}
for (const s of SAMPLED) {
  const cid = 'cluster-sampled-' + slugify(s.query);
  clusterMap.set(cid, {
    clusterId: cid, canonicalQuery: s.query,
    variants: [s.query], intentClass: 'sampled-money-query',
    serviceId: s.serviceId, geoScope: s.geoScope, moneyWeight: s.moneyWeight,
    targetUrl: s.ourUrl, rubricRowRefs: (rowByText.get(s.query.toLowerCase()) || []).sort((a, b) => a - b),
    clusterSource: 'sampled-observation',
  });
}
const clusters = [...clusterMap.values()].sort((a, b) => (a.clusterId < b.clusterId ? -1 : 1));
const clusterByRowId = new Map();
for (const c of clusters) for (const id of c.rubricRowRefs) {
  if (!clusterByRowId.has(id)) clusterByRowId.set(id, []);
  clusterByRowId.get(id).push(c.clusterId);
}

// ---------------------------------------------------------- url supply
const supply = [];
for (const p of pagesReg.pages) {
  const slug = p.slug;
  const divSlug = slug === 'home' ? 'home' : slug.replace(/\//g, '-');
  const text = divText(divSlug);
  const words = text.split(/\s+/).filter(Boolean).length;
  // inlinks: href="#/<router-slug>" occurrences across the whole shell.
  const routerSlug = slug === 'home' ? '' : divSlug;
  const linkRe = new RegExp('href="#/' + routerSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=["/])', 'g');
  const inlinks = (shell.match(linkRe) || []).length;
  const anchorRe = new RegExp('<a[^>]+href="#/' + routerSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^"]*"[^>]*>([\\s\\S]*?)</a>', 'g');
  const anchors = new Map();
  let am;
  while ((am = anchorRe.exec(shell)) !== null) {
    const t = am[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (t) anchors.set(t, (anchors.get(t) || 0) + 1);
  }
  const topAnchors = [...anchors.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 5).map((e) => e[0]);
  // per-page JSON: schema types + digest of the local file. The served
  // head data's jf field names the file; slug-derived candidates are
  // the fallback (dataset landings use dataset-<short>.json, singular,
  // tried before the slug-derived name, which for those pages is the
  // dataset file itself).
  const urlPathForJson = p.url.replace(SITE, '').replace(/\/$/, '');
  let jsonFile = null;
  const candidates = [];
  const jf = headJsonFile(urlPathForJson);
  if (jf) candidates.push(jf);
  if (slug.startsWith('datasets/') && slug.split('/').length === 2) candidates.push('dataset-' + slug.split('/')[1] + '.json');
  candidates.push(slug.replace(/\//g, '-') + '.json');
  for (const c of candidates) {
    if (fs.existsSync(path.join(PUB, c))) { jsonFile = c; break; }
  }
  if (!jsonFile) throw new Error('no per-page JSON found for ' + slug + ' (tried ' + candidates.join(', ') + ')');
  const jsonBytes = fs.readFileSync(path.join(PUB, jsonFile));
  const jsonDoc = JSON.parse(jsonBytes.toString('utf8'));
  const types = new Set();
  for (const n of (jsonDoc['@graph'] || [jsonDoc])) {
    if (!n || typeof n !== 'object') continue;
    const t = n['@type'];
    if (Array.isArray(t)) t.forEach((x) => types.add(x)); else if (t) types.add(t);
  }
  const urlPath = p.url.replace(SITE, '').replace(/\/$/, '') || '';
  const v = verdictByUrl.get(p.url);
  let indexation;
  if (v) {
    indexation = {
      state: v.coverage.indexOf('URL is on Google') >= 0 ? 'indexed' : 'not-indexed',
      verdict: v.coverage,
      indexingRequested: v.detail.indexOf('Indexing requested, success') === 0,
      indexingDetail: v.detail,
      source: 'Google Search Console URL inspection, indexing pass of ' + verdicts.observed_at,
      date: verdicts.observed_at,
      era: 'post-rebuild',
    };
  } else {
    indexation = {
      state: 'unobserved',
      source: 'No Search Console inspection verdict on file at generation. Unobserved is recorded as unobserved — never as not-indexed.',
      date: null,
      era: null,
    };
  }
  supply.push({
    url: p.url,
    pageType: p.type,
    title: headTitle(urlPath === '' ? '' : urlPath) || p.title,
    schemaTypes: [...types].sort(),
    wordCount: words,
    internalInlinks: inlinks,
    topAnchorTexts: topAnchors,
    lastmod: p.lastmod,
    perPageJson: jsonFile,
    sealedDigest: sha256(jsonBytes),
    sealedByteSize: jsonBytes.length,
    indexation,
  });
}
supply.sort((a, b) => (a.url < b.url ? -1 : 1));

// ------------------------------------------------- standing observations
const observations = [];
for (const s of SAMPLED) {
  observations.push({
    observationId: 'obs-sample-' + slugify(s.query),
    date: SAMPLE_DATE, engine: s.engine, method: s.method, era: SAMPLE_ERA,
    clusterId: 'cluster-sampled-' + slugify(s.query), query: s.query,
    ourPosition: s.ourPosition, ourUrlReturned: s.ourUrl, observedAbsent: s.observedAbsent,
    localPackPresent: s.localPackPresent, aiOverviewPresent: s.aiOverviewPresent,
    holders: s.holders, note: s.note, sourceRef: SAMPLE_SOURCE,
  });
}
if (verdicts) {
  for (const v of verdicts.verdicts) {
    observations.push({
      observationId: 'obs-gsc-' + verdicts.observed_at + '-' + targetSlug(v.url),
      date: verdicts.observed_at, engine: 'google', method: 'gsc-inspection', era: 'post-rebuild',
      clusterId: null, query: null, url: v.url,
      ourPosition: null, ourUrlReturned: v.url, observedAbsent: false,
      localPackPresent: null, aiOverviewPresent: null,
      verdict: v.coverage,
      indexingRequested: v.detail.indexOf('Indexing requested, success') === 0,
      indexingDetail: v.detail,
      sourceRef: 'Search Console indexing pass ' + verdicts.observed_at + '; verdicts ingested into the rubric outcome-evidence log the same day (161 evidence rows)',
    });
  }
}
for (const o of observations) {
  if (!o.method || !o.era || !o.sourceRef) throw new Error('observation missing method/era/source: ' + o.observationId);
}

const ERA_CUTOVER = '2026-10-29';
function eraForWindow(start, end) {
  if (end < ERA_CUTOVER) return 'pre-rebuild';
  if (start >= ERA_CUTOVER) return 'post-rebuild';
  return 'transition';
}
function windowsPhrase(rows) {
  const seen = new Map();
  for (const r of rows) seen.set(r.windowStart + '/' + r.windowEnd, eraForWindow(r.windowStart, r.windowEnd));
  return [...seen.entries()].sort().map(([w, e]) => w.replace('/', ' to ') + ' (' + e + ' era)').join(' and ');
}
// ------------------------------------------------------- engine window
const gscById = new Map(gscQueries.map((q) => [q.id, q]));
const enrichedByObs = new Map();
for (const a of gscAttached) {
  if (!enrichedByObs.has(a.observation_id)) enrichedByObs.set(a.observation_id, []);
  enrichedByObs.get(a.observation_id).push(a);
}
const rowIdByTextService = new Map();
for (const r of intentRows) rowIdByTextService.set(r.query_text + '' + r.service_id, r.id);
const windowRows = [];
for (const [obsId, rows] of [...enrichedByObs.entries()].sort((a, b) => a[0] - b[0])) {
  const q = gscById.get(obsId);
  if (!q) throw new Error('attached observation missing from gsc_observed_queries: ' + obsId);
  const clusterRefs = new Set();
  for (const a of rows) {
    const rid = rowIdByTextService.get(a.query_text + '' + a.service_id);
    if (rid != null) for (const cid of (clusterByRowId.get(rid) || [])) clusterRefs.add(cid);
  }
  windowRows.push({
    query: q.query_text_normalized,
    clicks: q.clicks, impressions: q.impressions, ctr: q.ctr, avgPosition: q.avg_position,
    windowStart: q.window_start, windowEnd: q.window_end, era: eraForWindow(q.window_start, q.window_end),
    linkedPageUrl: q.resolved_target_url,
    rubricRowsEnriched: rows.length,
    clusterRefs: [...clusterRefs].sort(),
    sourceRef: 'Google Search Console performance export, window ' + q.window_start + ' to ' + q.window_end + ' (' + eraForWindow(q.window_start, q.window_end) + ' era), imported into the rubric database as era-tagged evidence',
  });
}

// ------------------------------------------------------- competitor bar
const CLAIM_FIELDS = ['rating', 'aggregateRating', 'reviewCount', 'price', 'discount', 'endorsement', 'award', 'certification'];
function assertCompetitorBar(records) {
  for (const r of records) {
    for (const f of CLAIM_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(r, f)) {
        throw new Error('SCHEMA BAR: competitor_asset record for ' + r.competitor + ' carries claim field ' + f + ' — refusing to generate');
      }
    }
  }
}
assertCompetitorBar(COMPETITOR_ASSETS);
const competitorAssets = COMPETITOR_ASSETS.map((r, i) => ({
  assetId: 'competitor-asset-' + (i + 1), competitor: r.competitor, asset: r.asset,
  queryContext: r.queryContext, observedPosition: r.observedPosition,
  date: SAMPLE_DATE, method: 'serp-sample / places-sample', era: SAMPLE_ERA,
  note: r.note, sourceRef: SAMPLE_SOURCE,
}));

const thirdParty = THIRD_PARTY.map((r, i) => ({ recordId: 'third-party-' + (i + 1), ...r }));
const gaps = GAPS.map((g) => ({ ...g }));

// -------------------------------------------------------------- totals
const byClass = {};
for (const c of clusters) byClass[c.intentClass] = (byClass[c.intentClass] || 0) + 1;
const byMethod = {};
for (const o of observations) byMethod[o.method] = (byMethod[o.method] || 0) + 1;
const byIndexation = {};
for (const s of supply) byIndexation[s.indexation.state] = (byIndexation[s.indexation.state] || 0) + 1;
const totals = {
  queryClusters: clusters.length,
  rubricRowsCovered: intentRows.length,
  clustersByIntentClass: byClass,
  sampledClusters: clusters.filter((c) => c.clusterSource === 'sampled-observation').length,
  urlSupplyRows: supply.length,
  standingObservations: observations.length,
  observationsByMethod: byMethod,
  engineWindowQueries: windowRows.length,
  competitorAssets: competitorAssets.length,
  thirdPartyRecords: thirdParty.length,
  gapRecords: gaps.length,
  indexationStates: byIndexation,
};

// ---------------------------------------------------------------- doc
// --- Catalog checks (2026-10-31): in-band sha256 on DataDownload
// entries (schema.org sha256 of MediaObject), read from the public tree
// at generation time so the value equals the digest the signed index
// seals for the same file. Two principled exclusions, mirroring verify
// DC-2: the self-referencing entry (a file cannot carry its own digest —
// it lives in ai-master-index.json) and the ai-master-index.json entry
// itself (the index carries no self-digest by design; its integrity is
// the detached JWS).
const INDEX_URL = SITE + '/ai-master-index.json';
function pubFileDigest(url) {
  if (!url || !url.startsWith(SITE + '/')) return null;
  const rel = url.slice(SITE.length + 1);
  let p = path.join(PUB, rel);
  if (rel === '' || rel.endsWith('/')) p = path.join(p, 'index.html');
  try { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); } catch (_) { return null; }
}
function shaDistributions(nodes, selfUrl) {
  for (const n of nodes) {
    if (!n || !Array.isArray(n.distribution)) continue;
    n.distribution = n.distribution.map((e) => {
      if (!e || e['@type'] !== 'DataDownload' || !e.contentUrl) return e;
      if (e.contentUrl === selfUrl || e.contentUrl === INDEX_URL) return e;
      const d = pubFileDigest(e.contentUrl);
      return d ? { ...e, sha256: d } : e;
    });
  }
}

function baseNode(id, type, name, description) {
  return {
    '@id': id, '@type': type, name, description,
    keywords: ['search index', 'query clusters', 'url supply', 'standing observations', 'search standing', 'retrieval machine'],
    about: [{ '@id': SITE + '/#organization' }],
    spatialCoverage: [{ '@id': SITE + '/#winchester' }, { '@id': SITE + '/#martinsburg' }],
    temporalCoverage: '2010/2026', dateModified: FILE_DM,
    creator: CREATOR, publisher: CREATOR, license: LICENSE,
    distribution: [
      { '@type': 'DataDownload', contentUrl: FILE_URL, encodingFormat: 'application/json' },
      { '@type': 'DataDownload', contentUrl: SITE + '/ai-master-index.json', encodingFormat: 'application/json' },
    ],
    sameAs: LANDING, url: LANDING, identifier: LANDING, isAccessibleForFree: true,
  };
}
const D1_DESC = 'Search index supply and standing operations for The Flat Rate Movers: the standing measurement system of the Retrieval Machine’s search-index element. One dataset file joins the demand side (the buyer-intent query clusters generated from the estate’s own rubric), the supply side (every page of the estate with its schema types, word count, internal inlinks, per-page JSON digest and indexation state), and the evidence side (sampled standing, Search Console verdicts and the era-tagged pre-rebuild console window), plus the competitor supply observed in the same sampling, the third-party records that corroborate or corrupt the company’s facts, and the named gaps with their designed solutions. Standing is recorded only from evidence that exists: a cluster with no observation carries no standing row, observed absence is recorded as observed absence, and no position, rating or metric is invented or zero-filled anywhere in the file.';
const graph = [
  {
    ...baseNode(SITE + '/#dataset-search-index-operations', 'Service', 'Search Index Supply & Standing Operations', D1_DESC),
    about: [{ '@id': SITE + '/#organization' }],
    provider: { '@id': SITE + '/#organization' },
    areaServed: [{ '@id': SITE + '/#winchester' }, { '@id': SITE + '/#martinsburg' }],
    serviceType: 'Search index supply, standing measurement and retrieval evidence operations',
    identifier: [
      { '@type': 'PropertyValue', propertyID: 'X-Provenance-SHA256', name: 'Certificate of the signed AI master index (Ed25519, kid theflatratemovers-2026-10-29-1). The digest of THIS distribution is recorded in ai-master-index.json; verify any copy against that index and its detached signature.', value: 'see ai-master-index.json distribution entry for ' + FILE_URL },
      { '@type': 'PropertyValue', propertyID: 'canonical-file', name: 'Canonical machine-readable file for this dataset', value: FILE_URL },
      { '@type': 'PropertyValue', propertyID: 'canonical-page', name: 'Canonical landing page for this dataset', value: LANDING },
    ],
    subjectOf: { '@id': SITE + '/#dataset-search-index-method' },
    distribution: [
      { '@type': 'DataDownload', contentUrl: FILE_URL, encodingFormat: 'application/json' },
      { '@type': 'DataDownload', contentUrl: SITE + '/ai-master-index.json', encodingFormat: 'application/json' },
      { '@type': 'DataDownload', contentUrl: SITE + '/llms-full.txt', encodingFormat: 'text/plain' },
      { '@type': 'DataDownload', contentUrl: SITE + '/service-area.geojson', encodingFormat: 'application/geo+json' },
      { '@type': 'DataDownload', contentUrl: SITE + '/entity-graph.json', encodingFormat: 'application/ld+json' },
      { '@type': 'DataDownload', contentUrl: SITE + '/best-json-entity-graph.json', encodingFormat: 'application/ld+json' },
    ],
  },
  {
    ...baseNode(SITE + '/#dataset-search-index-scope', 'Dataset', 'Search Index Scope and Footprint',
      'The scope the standing system measures: ' + pagesReg.pages.length + ' pages in the registry, ' + servicesReg.services.length + ' published services, and the ' + geo.features.length + '-feature service-area footprint (Winchester footprint ' + geo.features.filter((f) => inFootprint(f, 'winchester')).length + ' areas, Martinsburg footprint ' + geo.features.filter((f) => inFootprint(f, 'martinsburg')).length + ' areas, ' + geo.features.filter((f) => featureBranches(f).length > 1).length + ' shared). The two branches are distinct in every table of this file: Winchester is The Flat Rate Movers (116 W Piccadilly St Suite 11, Winchester, VA 22601; hours Mon-Fri 8-6, Sat 8-4, Sun 9-4; Google rating 5.0 from 2 reviews) and Martinsburg is Flat Rate Movers Martinsburg WV (736 Williamsport Pike Suite 2, Martinsburg, WV 25404; hours Mon-Fri 9-6, Sat 9-4, Sun 9-4; Google rating 4.7 from 6 reviews). Branch facts are never blended.'),
    coverage: {
      pagesInRegistry: pagesReg.pages.length,
      servicesPublished: servicesReg.services.length,
      geojsonFeatures: geo.features.length,
      winchesterFootprint: geo.features.filter((f) => inFootprint(f, 'winchester')).length,
      martinsburgFootprint: geo.features.filter((f) => inFootprint(f, 'martinsburg')).length,
      sharedAreas: geo.features.filter((f) => featureBranches(f).length > 1).length,
    },
  },
  {
    ...baseNode(SITE + '/#dataset-search-index-taxonomy', 'Dataset', 'Search Index Taxonomy',
      'The vocabularies every table in this file uses. Intent classes: the rubric’s five generated classes (ai-question, best-choice, cost, how-process, navigational-local) plus sampled-money-query for the observation-defined clusters. Geo scopes: pattern-family (area-null rows: near-me and national pattern forms), the branch scopes (scope-winchester, scope-martinsburg, scope-shenandoah-valley), town scopes (place-*), corridor scopes (i-81, i-66, i-70), and the sampled state and port scopes. Observation methods: serp-sample, places-sample, gsc-inspection, gsc-export, bing-wmt and prompt-panel (the last two have no observations yet and are named so future rows keep their own method rather than borrowing one). Eras: pre-rebuild (console windows predating the rebuilt site), transition (the console window spanning the rebuild) and post-rebuild. Indexation states: indexed, not-indexed, unobserved. Third-party record statuses: open, correction sent, corrected-live, parked-owner-step.'),
    vocabularies: {
      intentClasses: ['ai-question', 'best-choice', 'cost', 'how-process', 'navigational-local', 'sampled-money-query'],
      observationMethods: ['serp-sample', 'places-sample', 'gsc-inspection', 'gsc-export', 'bing-wmt', 'prompt-panel'],
      eras: ['pre-rebuild', 'post-rebuild'],
      indexationStates: ['indexed', 'not-indexed', 'unobserved'],
      thirdPartyStatuses: ['open', 'correction sent', 'corrected-live', 'parked-owner-step'],
      moneyWeights: ['P1', 'P2', 'P3', 'standard'],
    },
  },
  {
    ...baseNode(SITE + '/#dataset-search-index-clusters', 'Dataset', 'Query Clusters',
      'The demand side: ' + clusters.length + ' query clusters grouping all ' + intentRows.length + ' intent-rubric rows by service, intent class, geo scope and target URL. Each cluster carries its canonical query (the shortest variant, the cluster’s representative phrasing), every variant phrasing, the rubric row ids it groups, and a money weight: the sampled money clusters carry the owner’s priority classes from the research dossier (P1 B2B and freight money plus the defended gun-safe #1, P2 the Winchester head terms, P3 the Martinsburg defense and category hubs); generated clusters carry "standard", meaning not separately owner-ordered. Cluster derivation is mechanical — no cluster is hand-written, and an observation-defined cluster whose text matches no rubric row carries an empty rubricRowRefs list rather than invented refs.'),
    queryClusters: clusters,
  },
  {
    ...baseNode(SITE + '/#dataset-search-index-supply', 'Dataset', 'URL Supply',
      'The supply side: one generated row per registry page (' + supply.length + ' pages), never hand-kept. Each row carries the page type, the served title, the schema @types in the page’s per-page JSON, the page’s word count from the source shell, its internal inlink count with the top anchor texts used across the site, the registry lastmod, the SHA-256 digest and byte size of its per-page JSON, and its indexation state with source and date. Indexation comes only from the Search Console indexing pass of ' + (verdicts ? verdicts.observed_at : 'the current evidence file') + ' (' + (verdicts ? verdicts.verdicts.length : 0) + ' URLs inspected); every other page is recorded unobserved, which is a statement about the evidence on file, not about the page.'),
    urlSupply: supply,
  },
  {
    ...baseNode(SITE + '/#dataset-search-index-standing', 'Dataset', 'Standing Observations',
      'The evidence side, first table: ' + observations.length + ' standing observations, each carrying its date, engine, method, era and source. ' + (byMethod['serp-sample'] || 0) + ' come from live search-result sampling, ' + (byMethod['places-sample'] || 0) + ' from local-pack sampling, and ' + (byMethod['gsc-inspection'] || 0) + ' from Search Console URL inspections (verdicts, which carry no position). Methods are never averaged together, sampled positions are never blended with console metrics, and no observation exists for a query nobody measured: unmeasured clusters carry no standing row.'),
    standingObservations: observations,
  },
  {
    ...baseNode(SITE + '/#dataset-search-index-windows', 'Dataset', 'Engine Windows (Era-Tagged Console Overlay)',
      'The evidence side, second table: the Search Console performance exports for ' + windowsPhrase(windowRows) + ' — era-tagged windows, kept and labeled as exactly that. ' + (meta.evidence_queries_imported || '1000') + ' observed queries were imported; ' + windowRows.length + ' matched live rubric rows and are attached here as evidence to ' + gscAttached.length + ' rows. Of the ' + (meta.evidence_pages_imported || '103') + ' exported pages, ' + (meta.evidence_pages_still_live || '73') + ' still exist at the same URL and ' + (meta.evidence_pages_stale || '30') + ' do not. Metrics attach only to the queries that were actually observed, only inside their window, and never as current performance. Pages launched after the window are awaiting observation — unmeasured, never zero-filled.'),
    engineWindows: windowRows,
    importMeta: {
      queriesImported: Number(meta.evidence_queries_imported || 1000),
      queriesAttached: Number(meta.evidence_queries_attached || windowRows.length),
      rowsEnriched: gscAttached.length,
      pagesInExport: Number(meta.evidence_pages_imported || 103),
      pagesStillLive: Number(meta.evidence_pages_still_live || 73),
      pagesStale: Number(meta.evidence_pages_stale || 30),
      era: meta.evidence_era || 'pre-rebuild',
      window: meta.evidence_window || '2026-07-29/2026-10-28',
    },
  },
  {
    ...baseNode(SITE + '/#dataset-search-index-competitors', 'Dataset', 'Competitor Assets (Benchmark Only)',
      'Benchmark section — observations about other companies’ supply, sampled the same day as the standing sample: ' + competitorAssets.length + ' records of dedicated category pages, pack listings and service content that hold the sampled result sets. This table exists so the estate can see what supply it is measured against. SCHEMA BAR: these records describe their owners’ assets only; they carry no rating, price, review count or endorsement fields, the generator refuses to emit the file if one appears, and no value from this table may join into any company-claim surface. Nothing here is a claim about The Flat Rate Movers.'),
    competitorAssets,
  },
  {
    ...baseNode(SITE + '/#dataset-search-index-third-party', 'Dataset', 'Third-Party Records Registry',
      'The corroboration ledger: ' + thirdParty.length + ' third-party records about the company, each with the field, the value found, the correct value from the company’s own published facts, the correction status and the date last checked. "Corrected-live" is used only where a direct fetch proved the fix; records behind an owner step are parked-owner-step, named plainly. The registry generates the correction program’s owner-step list, so the list can never drift from the records.'),
    thirdPartyRecords: thirdParty,
  },
  {
    ...baseNode(SITE + '/#dataset-search-index-gaps', 'Dataset', 'Search Index Gap Records',
      'The named gaps of the search-index element, ' + gaps.length + ' records, each with its requirement reference, evidence references, impact, status, resolving batch — and its designed solution. A gap in this file is a work item with a fix attached, never a bare problem statement.'),
    gapRecords: gaps,
  },
  {
    ...baseNode(SITE + '/#dataset-search-index-totals', 'Dataset', 'Search Index Totals',
      'Totals for this generation of the search-index dataset, computed by the generator from the live estate: ' + totals.queryClusters + ' query clusters over ' + totals.rubricRowsCovered + ' rubric rows, ' + totals.urlSupplyRows + ' supply rows (one per registry page), ' + totals.standingObservations + ' standing observations, ' + totals.engineWindowQueries + ' era-tagged window queries, ' + totals.competitorAssets + ' competitor asset records, ' + totals.thirdPartyRecords + ' third-party records and ' + totals.gapRecords + ' gap records. This file is itself a sealed distribution of the signed AI master index, under the certificate block recorded on the operations node.'),
    totals,
    sources: [
      { name: 'Intent rubric database', detail: intentRows.length + ' rows; rows digest ' + (meta.rows_digest || '') + '; generator ' + 'build-intent-rubric.js (rubric v2)' },
      { name: 'Search Console performance export', detail: 'window ' + (meta.evidence_window || '2026-07-29/2026-10-28') + ', era pre-rebuild, imported as evidence only' },
      { name: 'Search Console indexing pass', detail: verdicts ? verdicts.observed_at + ', ' + verdicts.verdicts.length + ' URLs inspected; verdicts also ingested into the outcome-evidence log' : 'no verdicts file supplied at generation' },
      { name: 'Live search sampling', detail: SAMPLE_SOURCE },
      { name: 'Third-party records', detail: 'Retrieval Machine Dossier 03 (re-verified 2026-10-31) joined to the backlink program wave-1 statuses (2026-10-30)' },
    ],
  },
  {
    '@id': SITE + '/#dataset-search-index-method', '@type': 'Article',
    name: 'How the Search Index Dataset Is Built',
    description: 'Method. The generator (scripts/build-search-index.js in the Flat Rate Machine) reads the paths registry for every location and builds all seven tables from the live estate in one run: clusters are grouped mechanically from the rubric database by (service, intent class, geo scope, target URL); URL supply is mined from the registries, the source shell, the served head data and the per-page JSON files; standing observations are admitted only from evidence on file — the research dossier’s dated live sampling and the Search Console verdicts — and the generator rejects any observation missing its method, era or source; the console window is joined from the rubric’s era-tagged evidence tables without aggregation or zero-filling; competitor, third-party and gap records are transcribed from the research dossiers with their check dates, under a schema bar the generator enforces in code. The url_supply digest is the SHA-256 of the page’s per-page JSON file in the public tree at generation time; a completed batch seals exactly those bytes, and the verification suite asserts the supply digests equal the served signed index after every batch. The file’s dateModified is the estate lastmod-ledger date for this file’s URL, wired by the seal (Batch Q124, 2026-11-03) — outside a seal the generator falls back to the newest evidence date among its inputs — never the wall clock, so regeneration is byte-stable and checkable. Update cadence: the dataset regenerates in every estate batch that changes pages, rubric rows or standing evidence, and reseals in the same motion.',
    dateModified: FILE_DM, author: { '@id': SITE + '/#organization' },
    isPartOf: { '@id': SITE + '/#dataset-search-index-operations' },
    sameAs: LANDING, url: LANDING, identifier: LANDING, isAccessibleForFree: true,
  },
  {
    '@id': SITE + '/#dataset-search-index-sources-article', '@type': 'Article',
    name: 'Search Index Dataset Sources',
    description: 'Sources, with their dates and eras kept distinct. (1) The estate’s own registries and rubric database — the demand and supply truth, current at generation. (2) Live search sampling of 2026-10-31 (Retrieval Machine Dossier 01 §§2–3): sampled positions and pack orders, labeled [OBS] in the dossier, post-rebuild era, small-sample by design and never blended with console data. (3) Search Console URL-inspection verdicts of 2026-10-31: 11 URLs inspected in the standing indexing pass; the same verdicts were ingested into the rubric outcome-evidence log (161 evidence rows). (4) The Search Console performance export for 2026-07-29 to 2026-10-28: pre-rebuild era evidence, attached to rubric rows by exact normalized text match only where the target page existed in the export and still exists; its totals describe the old site, not this one. (5) Third-party record checks of 2026-10-30 (backlink program wave 1) and 2026-10-31 (Dossier 03 re-verification, with each crawl’s age stated there). No source is presented as fresher than it is.',
    dateModified: FILE_DM, author: { '@id': SITE + '/#organization' },
    isPartOf: { '@id': SITE + '/#dataset-search-index-operations' },
    sameAs: LANDING, url: LANDING, identifier: LANDING, isAccessibleForFree: true,
  },
  {
    ...baseNode(SITE + '/#dataset-search-index-boundaries', 'Service', 'Search Index Boundaries and Non-Claims',
      'What this dataset never does. It never invents a position, a metric, a rating or a review count — for the company or for any competitor. It never presents the pre-rebuild console window as current performance, and never averages methods together. It never claims a third-party record corrected without direct-fetch proof. It contains no representation of any service the company has not confirmed and published through the normal estate path: the research dossiers’ expansion candidates (after-hours cross-dock work, auction-exit medical logistics, data-center decommissioning’s physical layer, small-count rack moves as a named segment, equipment buyback) appear nowhere in this file and enter only if the owner confirms the capability and the service is published first. Competitor records are benchmark observations about their owners’ supply and feed no company claim. The provenance certificate proves origin and integrity of this file only; it is not a ranking input and is not represented as one.'),
    about: [{ '@id': SITE + '/#organization' }],
  },
];
shaDistributions(graph, FILE_URL);

// --- Consolidated Visibility Batch 2026-11-02: dataset enrichment ---
// datePublished (first publication per the file's deploy batch record),
// includedInDataCatalog (the datasets hub node is retyped DataCatalog in
// the same batch — parent decision D2), variableMeasured (measurement
// datasets only, per the enrichment table) and spatialCoverage
// strengthening (bare Place @id refs -> full Place objects with geo).
const ENRICH_PLACES = {
  'https://theflatratemovers.com/#winchester': { '@type': 'Place', '@id': 'https://theflatratemovers.com/#winchester', name: 'The Flat Rate Movers \u2014 Winchester', geo: { '@type': 'GeoCoordinates', latitude: 39.18711576, longitude: -78.1668352 } },
  'https://theflatratemovers.com/#martinsburg': { '@type': 'Place', '@id': 'https://theflatratemovers.com/#martinsburg', name: 'Flat Rate Movers Martinsburg WV', geo: { '@type': 'GeoCoordinates', latitude: 39.48319665, longitude: -77.94760443 } },
};
function enrichDatasetNodes(nodes, datePublished, variableMeasured, strengthenSC) {
  for (const n of nodes) {
    if (!n || typeof n !== 'object') continue;
    const types = Array.isArray(n['@type']) ? n['@type'] : [n['@type']];
    if (!types.includes('Dataset')) continue;
    n.datePublished = datePublished;
    n.includedInDataCatalog = { ...CATALOG };
    if (variableMeasured) n.variableMeasured = variableMeasured;
    if (strengthenSC && Array.isArray(n.spatialCoverage)) {
      n.spatialCoverage = n.spatialCoverage.map((p) => (p && ENRICH_PLACES[p['@id']] && Object.keys(p).length === 1) ? ENRICH_PLACES[p['@id']] : p);
    }
  }
}

enrichDatasetNodes(graph, '2026-10-31', ["standingObservations (ourPosition, aiOverviewPresent, localPackPresent, observedAbsent; per engine/date)", "engineWindows (impressions, clicks, ctr, avgPosition)", "urlSupply (wordCount, internalInlinks, indexation state, perPageJson)", "queryClusters (cluster counts by intentClass / moneyWeight)"], true);
const doc = { '@context': 'https://schema.org', '@graph': graph };
const bytes = JSON.stringify(doc, null, 2) + '\n';
if (CHECK) {
  const cur = fs.readFileSync(outPath, 'utf8');
  if (cur !== bytes) { console.error('CHECK FAIL: ' + outPath + ' differs from regeneration'); process.exit(1); }
  console.log('CHECK OK: datasets-search-index.json regenerates byte-identical (' + bytes.length + ' bytes)');
} else {
  fs.writeFileSync(outPath, bytes);
  console.log('WROTE ' + outPath + ' (' + bytes.length + ' bytes)');
  console.log('totals: ' + JSON.stringify(totals));
}
