// Flat Rate Machine — Local Graph Registry dataset builder
// (Retrieval Machine Element 3, build batch B1 per Dossier 03 §7;
// executed as Retrieval Machine build batch B3 of the program,
// 2026-10-31).
//   node scripts/build-local-graph.js [--out <file>]
//   node scripts/build-local-graph.js --check
// Run from the-flat-rate-machine/. No dependencies beyond Node itself.
//
// WHAT THIS IS
// datasets-local-graph-registry.json: the standing registry of the
// Retrieval Machine's local-business graph element (design: Dossier
// 03 §5). The two branch entities resolve correctly at the graph's
// center (Google) and corrupt at its edges (aggregators, directories,
// stale scrapes) — the layer answer engines and secondary directories
// actually read. This dataset is the permanent corrections worklist
// for that graph: every public record about either branch, what it
// says, what it should say, what state the fix is in, and when it was
// last proven — so "the graph is clean" is a query result, not an
// impression:
//   branch_entity            — the canonical truth for the two
//                              branches, GENERATED from the estate
//                              (locations registry + service-area
//                              GeoJSON), never hand-edited; the two
//                              branches are always both present and
//                              never blended.
//   third_party_record       — one row per public record per field:
//                              observed value, correct value (traced
//                              to a canonical source — the generator
//                              refuses a branch-field correct value
//                              that does not trace), status from the
//                              controlled vocabulary, last-verified
//                              date + method + crawl age, propagation
//                              parent (the upstream record a fix must
//                              precede), the designed solution's gap
//                              and the exact owner step where one
//                              blocks.
//   coverage_matrix          — source x branch, generated: every
//                              cell carries a state (the branch-parity
//                              rule of Dossier 03 §4 L9 made visible;
//                              blanks are impossible).
//   review_distribution_snapshot — the shared schema with Dossier 02
//                              §5: per-platform display facts as
//                              distribution and arithmetic only, never
//                              blended, never a raw count as a quality
//                              signal; competitor-namespace rows are
//                              schema-barred from claim surfaces by
//                              generator assertion.
//   collision_record         — the name-collision companies,
//                              catalogued DO-NOT-TOUCH: we never edit
//                              another company's record; the class
//                              exists so a conflation event (their
//                              identifiers on our records, or ours on
//                              theirs) is detectable in one query.
//   gap_record               — Dossier 03's gaps L1–L11, each with
//                              its designed solution and resolving
//                              batch.
//   consolidated_owner_steps — GENERATED from the record rows that
//                              carry an owner step, so the owner's
//                              one list can never drift from the
//                              registry (Dossier 03 §5.3).
//
// STATUS VOCABULARY (Dossier 03 §5.1): verified-correct / open /
// correction-sent / corrected-live / parked-owner-step /
// platform-refused / unverifiable-today / monitored-synthesis /
// no-profile-exists / do-not-touch-collision. `corrected-live` is
// earned only on direct-fetch proof — a search snippet can never
// close a row (Dossier 03 §5.3); the generator refuses a
// corrected-live row whose method is not direct-fetch.
// METHODS: direct-fetch / search-surface / owner-manager-read.
//
// STALE-VERIFICATION GATE (Dossier 03 §5.3): a record whose
// effective verification age (days since last_verified plus the
// crawl age of the underlying page, where the observation rests on
// a crawl) exceeds the 35-day recheck window is flagged
// staleVerification in the output — flagged, never silently trusted.
//
// SOURCES (locations from paths.json, the machine repo's paths
// registry — no batch paths compiled in): data/locations.json (the
// canonical branch registry), data/service-area.geojson (the
// footprint), and the transcribed observation seed below, whose
// every row carries its evidence reference: Retrieval Machine
// Dossier 03 (audit of 2026-10-31) and the backlink program's
// records (Phase 1 citation audit + Wave 1 execution, 2026-10-30;
// Phase 2 plan + Wave 2 prep re-verification, 2026-10-31). Where the
// two conflict, the dossier (fresher) governs and the conflict is
// noted on the row.
//
// DETERMINISM: the file's dateModified is the newest evidence date
// among its inputs (2026-10-31), never the wall clock, so --check is
// byte-stable across days.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const REG = JSON.parse(fs.readFileSync(path.join(ROOT, 'paths.json'), 'utf8'));
const PUB = REG.public_dir;
const SITE = 'https://theflatratemovers.com';
const LANDING = SITE + '/datasets/local-graph-registry/';
const FILE_URL = SITE + '/datasets-local-graph-registry.json';
const API_ROUTE = 'https://api.theflatratemovers.com/v1/local-graph';
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
const DATE_MOD = '2026-11-02';
/* FB-3 wire (2026-11-03): file-level dateModified fields take FILE_DM --
 * the seal phase-0 stamps value for this file's own URL when the seal
 * passes FB3_STAMPS, else the legacy derivation (DATE_MOD). DATE_MOD
 * itself is unchanged: it drives evidence-date validation and
 * generated-on prose, which are evidence, not file stamps. */
const FILE_DM = (() => {
  if (process.env.FB3_STAMPS) {
    const m = JSON.parse(fs.readFileSync(process.env.FB3_STAMPS, 'utf8'));
    const v = m.files && m.files['https://theflatratemovers.com/datasets-local-graph-registry.json'];
    if (!v) throw new Error('FB3_STAMPS lacks the local-graph-registry file entry');
    return v;
  }
  // Out-of-seal fallback: the ledger is the estate's truth for this
  // file's last modification (verify --check runs without FB3_STAMPS).
  try {
    const ledger = JSON.parse(fs.readFileSync(
      path.join(__dirname, '..', 'data', 'lastmod-ledger.json'), 'utf8'));
    return (ledger.urls && ledger.urls['https://theflatratemovers.com/datasets-local-graph-registry.json']) || DATE_MOD;
  } catch (_) { return DATE_MOD; }
})();

const STALE_WINDOW_DAYS = 35;

function arg(name) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : null;
}
const CHECK = process.argv.includes('--check');
const outPath = arg('out') || path.join(PUB, 'datasets-local-graph-registry.json');
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

// ---------------------------------------------------------- canonical
// branch entities — generated from the estate (Dossier 03 §5.1: the
// canonical side is generated, never hand-edited). The only seed on
// this side is the pair of Google place_ids, observed on the Places
// records in Dossier 03 §2.1/§3 and recorded here with that source.
const locations = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'locations.json'), 'utf8'));
const geojson = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-area.geojson'), 'utf8'));
const GBP_PLACE_IDS = {
  winchester: { placeId: '590858019260679', sourceRef: 'Retrieval Machine Dossier 03 §2.1/§3 (Places record read 2026-10-31)' },
  martinsburg: { placeId: '863365035582649', sourceRef: 'Retrieval Machine Dossier 03 §2.1/§3 (Places record read 2026-10-31)' },
};
function fullAddress(b) {
  return b.street + ', ' + b.city + ', ' + b.state + ' ' + b.zip;
}
const branchEntities = locations.branches.map((b) => {
  const feats = geojson.features;
  const own = feats.filter((f) => f.properties.branch === b.id).length;
  const shared = feats.filter((f) => f.properties.branch === 'both').length;
  return {
    branchId: b.id,
    entityRef: SITE + '/#' + b.id,
    displayName: b.name,
    legalName: locations.company.name,
    address: {
      streetAddress: b.street, addressLocality: b.city, addressRegion: b.state,
      postalCode: b.zip, addressCountry: 'US', full: fullAddress(b),
    },
    geo: { latitude: b.geo.lat, longitude: b.geo.lng },
    phone: b.phone,
    website: SITE + '/',
    branchUrl: SITE + '/#' + b.id,
    hours: b.hours.map((h) => ({ days: h.days, opens: h.opens, closes: h.closes })),
    hoursDisplay: b.hoursDisplay,
    gbpPlaceId: GBP_PLACE_IDS[b.id].placeId,
    gbpPlaceIdSource: GBP_PLACE_IDS[b.id].sourceRef,
    gbpListedServiceAreas: b.serviceArea,
    gbpListedServiceAreaCount: b.serviceArea.length,
    geojsonFeatureCount: own + shared,
    geojsonOwnFeatureCount: own,
    geojsonSharedFeatureCount: shared,
    footprintAreas: b.serviceAreaFull,
    googleRatingDisplay: {
      ratingValue: b.googleRating.ratingValue,
      reviewCount: b.googleRating.reviewCount,
      breakdown: b.googleRating.breakdown || null,
      source: b.source, sourceDate: '2026-10-28',
      note: 'GBP manager-of-record values as recorded in the estate locations registry. Per-platform displays live in the review snapshot table; no surface of this dataset blends the two branches’ ratings.',
    },
    founding: locations.company.foundingDate,
    canonicalSource: 'data/locations.json + data/service-area.geojson (estate registries), generated ' + DATE_MOD,
  };
});
const branchById = Object.fromEntries(branchEntities.map((b) => [b.branchId, b]));
// Branch-distinctness gate (Dossier 03 §5.3): the two entities must
// differ on the features resolvers separate on; a generated surface
// that blended them fails here, at generation.
{
  const [w, m] = branchEntities;
  if (branchEntities.length !== 2) throw new Error('BRANCH GATE: expected exactly 2 branch entities');
  for (const f of ['displayName', 'hoursDisplay', 'gbpPlaceId']) {
    if (w[f] === m[f]) throw new Error('BRANCH GATE: branches share ' + f + ' — blended generation refused');
  }
  if (w.address.full === m.address.full) throw new Error('BRANCH GATE: branches share an address — refused');
  if (w.geo.latitude === m.geo.latitude && w.geo.longitude === m.geo.longitude) throw new Error('BRANCH GATE: branches share geo — refused');
}

// ------------------------------------------------------- owner steps
// The exact owner-step texts (Dossier 03 §7 consolidated list). Rows
// reference a step by key; the published consolidated list is
// generated from the rows, so it cannot drift from the registry.
const OWNER_STEPS = {
  'step-1-data-axle': {
    n: 1, system: 'Data Axle',
    text: 'Open the Data Axle account-confirmation link from the ratemovers@gmail.com inbox in your own browser (the link 403s automated sessions only). Once the account is confirmed, the Winchester and Martinsburg record corrections are executed from the canonical packets in the same session.',
  },
  'step-2-thryv': {
    n: 2, system: 'Thryv (Superpages / YellowPages / DexKnows)',
    text: 'Set the Thryv new-account password under ratemovers@gmail.com — a new account password only the owner can set. Both branch records are then corrected in the one Thryv system that feeds Superpages, YellowPages and DexKnows.',
  },
  'step-3-bbb': {
    n: 3, system: 'Better Business Bureau',
    text: 'Sign in to the BBB under ratemovers@gmail.com while the merge flow is worked: merge profile 0241-235987783 into 0241-236010957 (free correction path only — no paid accreditation) and create the Martinsburg profile from the canonical packet in the same session.',
  },
  'step-4-porch': {
    n: 4, system: 'Porch',
    text: 'Sign in to Porch under ratemovers@gmail.com. The queued corrections — years in business since June 2010 and Suite 11 on the Winchester address — and the Martinsburg profile creation are executed in the same session.',
  },
  'step-5-cb-insights-mailbox': {
    n: 5, system: 'CB Insights (decision)',
    text: 'Decide the company-domain mailbox: designate a monitored company-domain mailbox for registry claims (the CB Insights claim form rejects gmail.com addresses) — or record the fallback correction-request channel as the standing route. This item is a decision, not a sign-in.',
  },
  'step-6-anyflip-conditional': {
    n: 6, system: 'AnyFlip (conditional)',
    text: 'Only if account recovery requires it: identify the email the AnyFlip account was created under.',
  },
};

// ------------------------------------------------------------- seed:
// third-party records — the observation side, transcribed from the
// evidence base (Dossier 03 audit of 2026-10-31 + backlink program
// records). Every row carries its evidence reference; statuses are
// the dossier's per-item stamps, and where the program records and
// the dossier conflict the dossier governs (noted on the row).
const STATUS_VOCAB = ['verified-correct', 'open', 'correction-sent', 'corrected-live', 'parked-owner-step', 'platform-refused', 'unverifiable-today', 'monitored-synthesis', 'no-profile-exists', 'do-not-touch-collision'];
const METHOD_VOCAB = ['direct-fetch', 'search-surface', 'owner-manager-read'];
const D3 = 'Retrieval Machine Dossier 03';
const P1 = 'Backlink program Phase 1 citation audit, 2026-10-30';
const W1 = 'Backlink program Wave 1 execution record, 2026-10-30';
const P2P = 'Backlink program Phase 2 plan, Wave 2 prep re-verification 2026-10-31';

function rec(r) {
  return Object.assign({
    sourceUrl: null, sourceRecordId: null, correctRef: null, propagationParent: null,
    solutionRef: null, ownerStep: null, creationPath: null, note: null, backlinks: null,
  }, r);
}
const RECORDS = [
  // ---- the center: Google Business Profile / Places (Dossier 03 §2.1)
  rec({ recordId: 'google-places-w-name', source: 'google-places', branch: 'winchester', field: 'display name',
    observedValue: 'The Flat Rate Movers', correctRef: { branch: 'winchester', field: 'displayName' },
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.1 (Places-style record read 2026-10-31)' }),
  rec({ recordId: 'google-places-w-address', source: 'google-places', branch: 'winchester', field: 'address (short display)',
    observedValue: '116 W Piccadilly St — Suite 11 absent from the short address line', correctRef: { branch: 'winchester', field: 'address' },
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.1', note: 'The Suite 11 omission is display-layer thinness in the short-form address, not a record error; the full record carries the suite. Tracked as a display observation, not a correction (Dossier 03 §2.1).' }),
  rec({ recordId: 'google-places-w-phone', source: 'google-places', branch: 'winchester', field: 'phone',
    observedValue: '+1-540-422-2153', correctRef: { branch: 'winchester', field: 'phone' },
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.1' }),
  rec({ recordId: 'google-places-w-geo', source: 'google-places', branch: 'winchester', field: 'coordinates',
    observedValue: '39.187116, -78.166835', correctRef: { branch: 'winchester', field: 'geo' },
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.1', note: 'Displayed coordinates round the canonical estate geo (39.18711576, -78.1668352) to six decimals.' }),
  rec({ recordId: 'google-places-w-hours', source: 'google-places', branch: 'winchester', field: 'hours',
    observedValue: 'Mon–Fri 8-6, Sat 8-4, Sun 9-4', correctRef: { branch: 'winchester', field: 'hours' },
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.1', note: 'Exactly Winchester’s hours — branch-distinct from Martinsburg, as required.' }),
  rec({ recordId: 'google-places-w-category', source: 'google-places', branch: 'winchester', field: 'category',
    observedValue: 'Home Mover / Moving & Storage', correctValue: 'Home Mover / Moving & Storage',
    status: 'verified-correct', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Winchester audit table, Google row)' }),
  rec({ recordId: 'google-places-w-rating', source: 'google-places', branch: 'winchester', field: 'rating display (sampled surface)',
    observedValue: 'No rating line surfaced in the sampled Places-style record', correctValue: '5.0 over 1 review (GBP manager of record)',
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.1', note: 'A display observation, not a correction: the rating exists on the profile of record (see the branch entity and the review snapshot table).' }),
  rec({ recordId: 'google-places-m-name', source: 'google-places', branch: 'martinsburg', field: 'display name',
    observedValue: 'Flat Rate Movers', correctRef: { branch: 'martinsburg', field: 'displayName' },
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §§2.1, 2.4.1 (NEW finding)', solutionRef: 'L7',
    note: 'The display name is shortened at the Places layer, dropping the branch-distinct “Martinsburg WV”. Whether the drift sits in the GBP field or is platform shortening is determined by the L7 GBP-source audit.' }),
  rec({ recordId: 'google-places-m-address', source: 'google-places', branch: 'martinsburg', field: 'address',
    observedValue: '736 Williamsport Pike Suite 2, Martinsburg, WV 25404 (Suite 2 present)', correctRef: { branch: 'martinsburg', field: 'address' },
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.1' }),
  rec({ recordId: 'google-places-m-phone', source: 'google-places', branch: 'martinsburg', field: 'phone',
    observedValue: '+1-540-422-2153', correctRef: { branch: 'martinsburg', field: 'phone' },
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.1' }),
  rec({ recordId: 'google-places-m-geo', source: 'google-places', branch: 'martinsburg', field: 'coordinates',
    observedValue: '39.483197, -77.947604', correctRef: { branch: 'martinsburg', field: 'geo' },
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.1', note: 'Displayed coordinates round the canonical estate geo (39.48319665, -77.94760443) to six decimals.' }),
  rec({ recordId: 'google-places-m-hours', source: 'google-places', branch: 'martinsburg', field: 'hours',
    observedValue: 'Mon–Fri 9-6, Sat 9-4, Sun 9-4', correctRef: { branch: 'martinsburg', field: 'hours' },
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.1', note: 'Exactly Martinsburg’s hours — branch-distinct from Winchester, as required.' }),
  rec({ recordId: 'google-places-m-offerings', source: 'google-places', branch: 'martinsburg', field: 'service / offering labels',
    observedValue: '“Certified gun safe transport”; “Extreme-mass logistics”',
    correctValue: 'Neither label is published by the company. The company’s published service labels are its estate service names, and “Certified” is never used for the gun-safe service.',
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §§2.1, 2.4.1 (NEW finding)', solutionRef: 'L7',
    note: 'Origin undetermined — GBP services field vs platform synthesis — until the L7 GBP-source audit (a read-only manager read). If the labels are platform-synthesized, this row becomes monitored-synthesis and the estate’s published labels stay exact as the corpus those syntheses learn from (Dossier 03 §4 L7). An answer engine summarizing this branch today can lift these labels as company claims — the answer-evidence dataset (Dossier 02 §4 A7) consumes this row’s status.' }),
  rec({ recordId: 'google-places-m-rating', source: 'google-places', branch: 'martinsburg', field: 'rating display',
    observedValue: '4.7 over 6 reviews', correctValue: '4.7 over 6 reviews (GBP manager of record)',
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.1; ' + P1 + ' (Martinsburg audit table, Google row)' }),

  // ---- Birdeye (Dossier 03 §2.2)
  rec({ recordId: 'birdeye-w-address', source: 'birdeye', branch: 'winchester', field: 'address',
    sourceUrl: 'https://reviews.birdeye.com/the-flat-rate-movers-163130362685696', sourceRecordId: '163130362685696',
    observedValue: '116 E Piccadilly St #11, Winchester, VA (wrong direction: E for W)', correctRef: { branch: 'winchester', field: 'address' },
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 63 },
    evidenceRef: D3 + ' §2.2 (Birdeye — Winchester)', solutionRef: 'L1',
    note: 'The observation rests on a page last crawled ~63 days before the read — before the owner’s 2026-10-30 claim. Step 1 of the designed fix is the direct-URL recheck (this element’s build batch B2), which separates “claim didn’t propagate” from “crawl predates the claim effect”.' }),
  rec({ recordId: 'birdeye-w-claim', source: 'birdeye', branch: 'winchester', field: 'profile claim status',
    sourceUrl: 'https://reviews.birdeye.com/the-flat-rate-movers-163130362685696', sourceRecordId: '163130362685696',
    observedValue: '“This profile has not been claimed by the business owner or representative”',
    correctValue: 'Claimed — the owner completed the Birdeye claim on 2026-10-30 (backlink program record)',
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 63 },
    evidenceRef: D3 + ' §2.2; ' + W1 + ' (Birdeye claims completed by the owner)', solutionRef: 'L1',
    note: 'The public page as last crawled contradicts the completed claim. The registry tracks the public page, not the account claim, as the status source: this row closes only when the public page shows claimed (Dossier 03 §4 L1).' }),
  rec({ recordId: 'birdeye-w-review-display', source: 'birdeye', branch: 'winchester', field: 'review display',
    sourceUrl: 'https://reviews.birdeye.com/the-flat-rate-movers-163130362685696', sourceRecordId: '163130362685696',
    observedValue: '4.9 over 41 reviews (cross-platform aggregate display)',
    correctValue: 'Per-platform displays only. A cross-platform aggregate is the platform’s own aggregation behavior — recorded as record data, never adopted as a company figure.',
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 63 },
    evidenceRef: D3 + ' §§0, 2.2', note: 'The display is what the platform does with the underlying reviews; the defect rows on this profile are the address and the claim label. Arithmetic for this display is carried in the review snapshot table.' }),
  rec({ recordId: 'birdeye-m-nap', source: 'birdeye', branch: 'martinsburg', field: 'name, address, phone, hours',
    sourceUrl: 'https://reviews.birdeye.com/flat-rate-movers-martinsburg-wv-171614909716521', sourceRecordId: '171614909716521',
    observedValue: 'Name and address (736 Williamsport Pike Suite 2, Martinsburg, WV 25404) fully correct; phone correct; hours correct',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 210 },
    evidenceRef: D3 + ' §2.2 (Birdeye — Martinsburg); ' + P1 + ' (Martinsburg audit table, Birdeye row)',
    note: 'The crawl underlying this observation is ~210 days old; the NAP facts agree with every other observation of this profile.' }),
  rec({ recordId: 'birdeye-m-claim', source: 'birdeye', branch: 'martinsburg', field: 'profile claim status',
    sourceUrl: 'https://reviews.birdeye.com/flat-rate-movers-martinsburg-wv-171614909716521', sourceRecordId: '171614909716521',
    observedValue: '“This profile has not been claimed” (as last crawled)',
    correctValue: 'Claimed — the owner completed the Birdeye claim on 2026-10-30 (backlink program record)',
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 210 },
    evidenceRef: D3 + ' §2.2; ' + W1, solutionRef: 'L1',
    note: 'OPEN / STALE-CRAWL in the dossier’s stamp: the crawl predates the claim by months, so the current public state is unverifiable from the snippet. The direct-URL recheck (build batch B2) is step 1 of the designed fix (Dossier 03 §§2.2, 8.1).' }),
  rec({ recordId: 'birdeye-m-review-display', source: 'birdeye', branch: 'martinsburg', field: 'review display',
    sourceUrl: 'https://reviews.birdeye.com/flat-rate-movers-martinsburg-wv-171614909716521', sourceRecordId: '171614909716521',
    observedValue: '“No reviews” / NR displayed',
    correctValue: 'The branch’s Google record displays 4.7 over 6 reviews; Birdeye’s Google-review syndication for this location is the designed check (gap L1)',
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 210 },
    evidenceRef: D3 + ' §2.2', solutionRef: 'L1',
    note: 'A claimed profile showing zero reviews while Google shows 6 is a feed failure, not a review-volume fact (Dossier 03 §2.2).' }),
  rec({ recordId: 'birdeye-m-category', source: 'birdeye', branch: 'martinsburg', field: 'category',
    sourceUrl: 'https://reviews.birdeye.com/flat-rate-movers-martinsburg-wv-171614909716521', sourceRecordId: '171614909716521',
    observedValue: 'Transportation Services', correctValue: 'Movers',
    status: 'open', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Martinsburg audit table, Birdeye row)', solutionRef: 'L1',
    note: 'Category could be sharpened to Movers at claim (Phase 1 audit). A minor row beside the claim and syndication rows on the same profile.' }),

  // ---- CB Insights (Dossier 03 §2.2; company-level record, HQ = Winchester)
  rec({ recordId: 'cb-insights-hq-address', source: 'cb-insights', branch: 'company', field: 'headquarters address',
    sourceUrl: 'https://www.cbinsights.com/company/the-flat-rate-movers',
    observedValue: '1850 Valley Ave, Winchester (FAQ answer on the company page)', correctRef: { branch: 'winchester', field: 'address' },
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 0 },
    evidenceRef: D3 + ' §2.2 (CB Insights)', solutionRef: 'L11', ownerStep: 'step-5-cb-insights-mailbox',
    note: 'Re-confirmed current: the page was crawled ~20 hours before the 2026-10-31 read. The claim path is blocked on the company-domain mailbox decision (owner step 5). CB Insights is a separate data product — this row is NOT a Data Axle propagation child (Dossier 03 §2.3).' }),
  rec({ recordId: 'cb-insights-claim', source: 'cb-insights', branch: 'company', field: 'profile claim status',
    sourceUrl: 'https://www.cbinsights.com/company/the-flat-rate-movers',
    observedValue: 'Unclaimed (compare pages state the profile is unclaimed)',
    correctValue: 'Claimed by the company',
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 0 },
    evidenceRef: D3 + ' §2.2', solutionRef: 'L11', ownerStep: 'step-5-cb-insights-mailbox',
    note: 'The claim form rejects gmail.com addresses; the mailbox decision (owner step 5) is the unblock, with the documented correction-request channel as the fallback (Dossier 03 §4 L11).' }),
  rec({ recordId: 'cb-insights-founding-string', source: 'cb-insights', branch: 'company', field: 'founding year (compare-table string)',
    sourceUrl: 'https://www.cbinsights.com/company/the-flat-rate-movers',
    observedValue: 'A “Founded Year, 2005” string inside a multi-company compare table — attribution to this company’s column is NOT established',
    correctValue: '2010 (founded June 2010)',
    status: 'unverifiable-today', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 0 },
    evidenceRef: D3 + ' §§2.2, 8.3', solutionRef: 'L11',
    note: 'Recorded as an unverified possible additional corruption, never as a finding. A direct page open in the re-verification pass (build batch B2) resolves attribution; if attributed, correct founding to June 2010 at claim.' }),

  // ---- BBB (Dossier 03 §2.2)
  rec({ recordId: 'bbb-w-wrong-address', source: 'bbb', branch: 'winchester', field: 'address (duplicate profile)',
    sourceUrl: 'https://www.bbb.org/us/va/winchester/profile/moving-companies/the-flat-rate-movers-0241-235987783', sourceRecordId: '0241-235987783',
    observedValue: '1850 Valley Ave, Winchester, VA 22601-6316; “NOT a BBB Accredited Business”; phone correct',
    correctRef: { branch: 'winchester', field: 'address' },
    status: 'parked-owner-step', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 63 },
    evidenceRef: D3 + ' §2.2 (BBB); ' + P1 + ' (BBB profile 1)', solutionRef: 'L3', ownerStep: 'step-3-bbb',
    propagationParent: 'data-axle-w-record',
    note: 'Live and findable, and it carries the same place identifier as the Winchester GBP record in the search surface — BBB’s own data ties this stale profile to the real place. The designed fix is the merge into profile 0241-236010957 in the B4 owner sitting (free correction path only — no paid accreditation, standing rule).' }),
  rec({ recordId: 'bbb-w-correct-profile', source: 'bbb', branch: 'winchester', field: 'profile (correct-address)',
    sourceUrl: 'https://www.bbb.org/us/va/winchester/profile/moving-companies/the-flat-rate-movers-0241-236010957', sourceRecordId: '0241-236010957',
    observedValue: 'Correct-address profile exists: 116 W. Piccadilly St, Winchester, VA 22601; phone correct; BBB file opened 5/12/2016; not accredited (Phase 1 audit)',
    correctValue: 'This profile is the surviving record in the designed merge',
    status: 'unverifiable-today', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (BBB profile 2); ' + D3 + ' §8.5', solutionRef: 'L3',
    note: 'Not read directly in the 2026-10-31 pass; its current-minute state is unverified (Dossier 03 §8.5). The direct read is part of the B4 sitting’s in-session work.' }),
  rec({ recordId: 'bbb-m-existence', source: 'bbb', branch: 'martinsburg', field: 'profile existence',
    observedValue: 'No Martinsburg BBB profile exists',
    correctValue: 'One BBB profile carrying the Martinsburg canonical facts',
    status: 'no-profile-exists', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.2; ' + P1 + ' (Martinsburg audit table, BBB row)', solutionRef: 'L3', ownerStep: 'step-3-bbb',
    creationPath: 'Created from the canonical submission packet in the B4 owner sitting, in the same session as the Winchester merge (Dossier 03 §4 L3)' }),

  // ---- Data Axle — the upstream record (Dossier 03 §2.2)
  rec({ recordId: 'data-axle-w-record', source: 'data-axle', branch: 'winchester', field: 'aggregator record (Winchester)',
    sourceRecordId: 'MTGJKSKP',
    observedValue: 'Record located (place ID MTGJKSKP); phone verification completed; account confirmation incomplete, so the record’s current contents are not yet readable',
    correctValue: 'The Winchester canonical record: The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester, VA 22601, +1-540-422-2153, https://theflatratemovers.com/',
    status: 'parked-owner-step', lastVerified: { date: '2026-10-30', method: 'owner-manager-read', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.2 (Data Axle); ' + W1 + ' (Data Axle item)', solutionRef: 'L2', ownerStep: 'step-1-data-axle',
    note: 'The cluster root: the 1850 Valley Ave rows (BBB duplicate, MapQuest, Judy’s Book, Fyple, NSN Lookup, StartUs) carry this record as their propagation parent and cannot be marked failed until it is corrected-live AND one refresh cycle has passed (Dossier 03 §2.3). That Data Axle is the sole upstream for every cluster row is an inference from cluster shape and aggregator mechanics; the B3→B7 sequence tests it empirically (Dossier 03 §8.4).' }),
  rec({ recordId: 'data-axle-m-record', source: 'data-axle', branch: 'martinsburg', field: 'aggregator record (Martinsburg)',
    observedValue: 'Correction queued behind the same incomplete account confirmation',
    correctValue: 'The Martinsburg canonical record: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404, +1-540-422-2153, https://theflatratemovers.com/',
    status: 'parked-owner-step', lastVerified: { date: '2026-10-30', method: 'owner-manager-read', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.2 (Data Axle); ' + W1, solutionRef: 'L2', ownerStep: 'step-1-data-axle',
    note: 'Both branch corrections are executed from the canonical packets in the same session once the account is confirmed (owner step 1).' }),

  // ---- Thryv family: Superpages / YellowPages / DexKnows share one feed (Dossier 03 §2.2)
  rec({ recordId: 'superpages-w-address', source: 'superpages', branch: 'winchester', field: 'address',
    sourceUrl: 'https://www.superpages.com/winchester-va/piano-organ-moving',
    observedValue: '17048 Waterfall Rd, Haymarket, VA 20169 (wrong city, wrong address; phone correct; the listing’s “16 Years” is consistent with the 2010 founding; categories Piano & Organ Moving / Movers)',
    correctRef: { branch: 'winchester', field: 'address' },
    status: 'parked-owner-step', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 23 },
    evidenceRef: D3 + ' §2.2 (Superpages / Thryv); ' + P1 + ' (Superpages row)', solutionRef: 'L5', ownerStep: 'step-2-thryv',
    note: 'Observed via a Superpages category page (crawl ~23 days), not the listing page itself (Dossier 03 §8.7). One Thryv account fix covers Superpages + YellowPages + DexKnows in a single motion — the three properties share the feed.' }),
  rec({ recordId: 'yellowpages-w-address', source: 'yellowpages', branch: 'winchester', field: 'address',
    observedValue: 'No separate YellowPages listing surfaced; the Thryv network record is the Superpages entry carrying 17048 Waterfall Rd, Haymarket',
    correctRef: { branch: 'winchester', field: 'address' },
    status: 'parked-owner-step', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (YellowPages direct row); ' + D3 + ' §2.2', solutionRef: 'L5', ownerStep: 'step-2-thryv',
    propagationParent: 'superpages-w-address',
    note: 'Same Thryv feed as the Superpages record, which is this row’s propagation parent; corrected by the same single Thryv action and verified on this property’s public page after one refresh cycle.' }),
  rec({ recordId: 'dexknows-w-address', source: 'dexknows', branch: 'winchester', field: 'address',
    observedValue: 'No separate DexKnows listing surfaced; the Thryv network record is the Superpages entry carrying 17048 Waterfall Rd, Haymarket',
    correctRef: { branch: 'winchester', field: 'address' },
    status: 'parked-owner-step', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + '; ' + D3 + ' §2.2 (Thryv family)', solutionRef: 'L5', ownerStep: 'step-2-thryv',
    propagationParent: 'superpages-w-address',
    note: 'Same Thryv feed as the Superpages record, which is this row’s propagation parent; corrected by the same single Thryv action and verified on this property’s public page after one refresh cycle.' }),
  rec({ recordId: 'superpages-m-existence', source: 'superpages', branch: 'martinsburg', field: 'profile existence (Thryv network)',
    observedValue: 'Not found — the Thryv network record points at the wrong Haymarket address under Winchester; no Martinsburg listing',
    correctValue: 'A Martinsburg location record in the Thryv network carrying the Martinsburg canonical facts',
    status: 'no-profile-exists', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Martinsburg audit table, Thryv row)', solutionRef: 'L5', ownerStep: 'step-2-thryv',
    creationPath: 'Added as the second location in the Thryv correction, executed in the B4 owner sitting (Dossier 03 §4 L5)' }),
  rec({ recordId: 'yellowpages-m-existence', source: 'yellowpages', branch: 'martinsburg', field: 'profile existence (Thryv network)',
    observedValue: 'Not found — no Martinsburg listing in the Thryv network',
    correctValue: 'A Martinsburg location record in the Thryv network carrying the Martinsburg canonical facts',
    status: 'no-profile-exists', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Martinsburg audit table, Thryv row)', solutionRef: 'L5', ownerStep: 'step-2-thryv',
    creationPath: 'Rides the same Thryv second-location creation as the Superpages Martinsburg record (one feed, three properties)' }),
  rec({ recordId: 'dexknows-m-existence', source: 'dexknows', branch: 'martinsburg', field: 'profile existence (Thryv network)',
    observedValue: 'Not found — no Martinsburg listing in the Thryv network',
    correctValue: 'A Martinsburg location record in the Thryv network carrying the Martinsburg canonical facts',
    status: 'no-profile-exists', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Martinsburg audit table, Thryv row)', solutionRef: 'L5', ownerStep: 'step-2-thryv',
    creationPath: 'Rides the same Thryv second-location creation as the Superpages Martinsburg record (one feed, three properties)' }),

  // ---- Porch (Dossier 03 §2.2)
  rec({ recordId: 'porch-w-years', source: 'porch', branch: 'winchester', field: 'years in business',
    sourceUrl: 'https://pro.porch.com/winchester-va/movers/the-flat-rate-movers-165420742/pp', sourceRecordId: 'the-flat-rate-movers-165420742',
    observedValue: '“4 years in business” (Credentials & Stats) — while the same profile’s About text says “Since 2010”: the record contradicts itself',
    correctValue: 'In business since June 2010',
    status: 'parked-owner-step', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 86 },
    evidenceRef: D3 + ' §2.2 (Porch); ' + P1 + ' (Porch row)', solutionRef: 'L6', ownerStep: 'step-4-porch' }),
  rec({ recordId: 'porch-w-address', source: 'porch', branch: 'winchester', field: 'address',
    sourceUrl: 'https://pro.porch.com/winchester-va/movers/the-flat-rate-movers-165420742/pp', sourceRecordId: 'the-flat-rate-movers-165420742',
    observedValue: '116 W Piccadilly St (Suite 11 missing)', correctRef: { branch: 'winchester', field: 'address' },
    status: 'parked-owner-step', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 86 },
    evidenceRef: D3 + ' §2.2 (Porch)', solutionRef: 'L6', ownerStep: 'step-4-porch' }),
  rec({ recordId: 'porch-m-existence', source: 'porch', branch: 'martinsburg', field: 'profile existence',
    observedValue: 'No Martinsburg Porch profile exists (Winchester profile only)',
    correctValue: 'A Martinsburg Porch profile carrying the Martinsburg canonical facts',
    status: 'no-profile-exists', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Martinsburg audit table, Porch row); ' + D3 + ' §2.2', solutionRef: 'L6', ownerStep: 'step-4-porch',
    creationPath: 'Created from the canonical packet in the B4 owner sitting, in the same session as the Winchester corrections (Dossier 03 §4 L6)' }),
];

// ---- group 2: the 1850 Valley Ave cluster children, Chamber,
// GreatGuysMove, our own stale page, AnyFlip, verified-correct
// singles, Martinsburg-only sources, and the absence/parity rows.
RECORDS.push(
  // ---- cluster directories fed by the aggregator layer (Dossier 03 §2.2)
  rec({ recordId: 'mapquest-w-address', source: 'mapquest', branch: 'winchester', field: 'address',
    sourceUrl: 'https://www.mapquest.com/us/virginia/the-flat-rate-movers-545355596', sourceRecordId: '545355596',
    observedValue: '1850 Valley Ave, Winchester, VA 22601',
    correctRef: { branch: 'winchester', field: 'address' },
    status: 'correction-sent', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 276 },
    evidenceRef: D3 + ' §2.2 (MapQuest); ' + W1 + ' (free report submitted; listing ID 270567269)', solutionRef: 'L2',
    propagationParent: 'data-axle-w-record',
    note: 'The free report was submitted 2026-10-30 (report listing ID 270567269). The profile page itself was last crawled ~276 days before the 2026-10-31 read and has carried the wrong address since at least then; the free report may or may not have landed. Propagation class: this row re-resolves when the Data Axle parent is corrected-live and one refresh cycle has passed (Dossier 03 §2.3).' }),
  rec({ recordId: 'fyple-w-address', source: 'fyple', branch: 'winchester', field: 'address',
    observedValue: '1850 Valley Ave, Winchester, VA 22601',
    correctRef: { branch: 'winchester', field: 'address' },
    status: 'correction-sent', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 310 },
    evidenceRef: D3 + ' §2.2 (Fyple); ' + W1 + ' (report submitted 2026-10-30)', solutionRef: 'L2',
    propagationParent: 'data-axle-w-record',
    note: 'Page last crawled ~310 days before the 2026-10-31 read; the 2026-10-30 report is sent and its effect is unproven until the page re-crawls.' }),
  rec({ recordId: 'fyple-w-category', source: 'fyple', branch: 'winchester', field: 'category',
    observedValue: 'Arts & Entertainment',
    correctValue: 'Movers / moving company',
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 310 },
    evidenceRef: D3 + ' §2.2 (Fyple); ' + P1 + ' (Fyple row)', solutionRef: 'L2',
    propagationParent: 'data-axle-w-record',
    note: 'A wrong category on the same stale record; the category correction rides the same report/propagation path as the address row.' }),
  rec({ recordId: 'nsn-w-address', source: 'nsn-lookup', branch: 'winchester', field: 'address',
    sourceUrl: 'https://www.nsnlookup.com/cage/629v',
    observedValue: '1850 Valley Ave, Winchester, VA 22601-6316 (mailing address, incorrect)',
    correctRef: { branch: 'winchester', field: 'address' },
    status: 'correction-sent', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 319 },
    evidenceRef: D3 + ' §2.2 (NSN Lookup); ' + W1 + ' (correction sent via live chat 2026-10-30)', solutionRef: 'L2',
    propagationParent: 'data-axle-w-record',
    note: 'The correction was sent via live chat 2026-10-30 with no written confirmation path; the page was last crawled ~319 days before the 2026-10-31 read. A direct recheck of the cage page verifies whether the chat correction landed (build batch B2); until then the dossier’s honest stamp stands: sent is not corrected (§8.2).' }),
  rec({ recordId: 'judysbook-w-address', source: 'judys-book', branch: 'winchester', field: 'address',
    observedValue: '1850 Valley Ave, Winchester, VA 22601',
    correctRef: { branch: 'winchester', field: 'address' },
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 237 },
    evidenceRef: D3 + ' §2.2 (Judy’s Book)', solutionRef: 'L2',
    propagationParent: 'data-axle-w-record',
    note: 'Direct edits are paywalled ($9.95 one-time / ~$19.92 per month; standing default: NO paid correction). The designed free path is the Data Axle upstream correction — this row’s fix arrives by propagation or not at all (Dossier 03 §§2.2, 8.6).' }),
  rec({ recordId: 'judysbook-w-category', source: 'judys-book', branch: 'winchester', field: 'category',
    observedValue: 'Personal Care',
    correctValue: 'Movers / moving company',
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 237 },
    evidenceRef: D3 + ' §2.2 (Judy’s Book — NEW category finding)', solutionRef: 'L2',
    propagationParent: 'data-axle-w-record',
    note: 'A category error on the same record (NEW in the 2026-10-31 pass): the company is filed under Personal Care. Same paywalled-edit constraint as the address row; the correction rides propagation.' }),
  rec({ recordId: 'startus-w-address', source: 'startus', branch: 'winchester', field: 'address',
    observedValue: '1850 Valley Ave (display truncated in the audit record)',
    correctRef: { branch: 'winchester', field: 'address' },
    status: 'open', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (StartUs row); ' + D3 + ' §2.2', solutionRef: 'L2',
    propagationParent: 'data-axle-w-record',
    note: 'The site was unreachable during the Wave 1 pass — standing instruction: do not retry the direct route. The row is tracked for propagation only.' }),

  // ---- Chamberofcommerce.com directory (Dossier 03 §2.2)
  rec({ recordId: 'chamber-w-merge', source: 'chamber-directory', branch: 'winchester', field: 'duplicate listing (merge)',
    sourceUrl: 'https://www.chamberofcommerce.com/united-states/virginia/winchester/carpet-cleaning-service/2012251284-the-flat-rate-movers', sourceRecordId: '2012251284',
    observedValue: 'Two live listings: main entry 2012251284 (movers/carpet-cleaning categories) and duplicate 2025999381 (cleaning category) — merge requested 2026-10-30',
    correctValue: 'One merged listing (2012251284) carrying the Winchester canonical facts',
    status: 'correction-sent', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 57 },
    evidenceRef: D3 + ' §2.2 (Chamberofcommerce.com); ' + W1 + ' (merge request sent 2026-10-30)',
    note: 'The merge request is sent; the duplicate still appeared in the 2026-10-31 read (page crawl ~57 days). Merges process on the directory’s own schedule — this row closes on the duplicate’s disappearance from the public pages, verified by direct fetch.' }),
  rec({ recordId: 'chamber-w-category', source: 'chamber-directory', branch: 'winchester', field: 'category (duplicate listing)',
    sourceRecordId: '2025999381',
    observedValue: 'The duplicate listing 2025999381 sits under cleaning categories',
    correctValue: 'No cleaning-category listing; the surviving listing carries moving categories',
    status: 'correction-sent', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 57 },
    evidenceRef: D3 + ' §2.2', propagationParent: 'chamber-w-merge',
    note: 'The category error lives on the duplicate; the merge (this row’s propagation parent) removes it with the listing itself.' }),
  rec({ recordId: 'chamber-w-address-format', source: 'chamber-directory', branch: 'winchester', field: 'address (rendered form)',
    sourceUrl: 'https://www.chamberofcommerce.com/united-states/virginia/winchester/carpet-cleaning-service/2012251284-the-flat-rate-movers', sourceRecordId: '2012251284',
    observedValue: '“116 Piccadilly Street 11” — street type abbreviated (“W” dropped) and “Suite” dropped, suite number appended',
    correctRef: { branch: 'winchester', field: 'address' },
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 57 },
    evidenceRef: D3 + ' §2.2 (Chamberofcommerce.com — NEW rendering note)',
    note: 'A display-rendering defect on the surviving listing, distinct from the duplicate: even after the merge, the rendered address needs the correction. Flagged for the merge follow-up / a directory correction request.' }),

  // ---- GreatGuysMove (Dossier 03 §2.2)
  rec({ recordId: 'greatguysmove-w-discount', source: 'greatguysmove', branch: 'winchester', field: 'offer / discount claim',
    observedValue: 'A “15% discount” offer presented as a company offer',
    correctValue: 'No discount offer exists. The company publishes no percentage-discount offer anywhere; its published pricing statement is the flat-rate guarantee (review the full scope, distance, manpower and equipment, and price the job at one flat rate — hourly pricing is available when a client asks for it).',
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 3 },
    evidenceRef: D3 + ' §2.2 (GreatGuysMove)', solutionRef: 'L4',
    note: 'Re-confirmed live on a page crawled ~3 days before the 2026-10-31 read — the first correction (sent 2026-10-30, Wave 1) did not remove it. The designed fix is two-sided: retire our own stale pre-rebuild page that carries the identical sentence (see the estate-stale-index row), then send the second correction citing that provenance (gap L4).' }),
  rec({ recordId: 'greatguysmove-w-license-framing', source: 'greatguysmove', branch: 'winchester', field: 'license-status framing',
    observedValue: 'A federal license-status statement naming a carrier status the company does not publish',
    correctValue: 'The company publishes no federal carrier status. Interstate work runs through contractors holding their own operating authority and proper equipment (the company’s standing operating model).',
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 3 },
    evidenceRef: D3 + ' §2.2 (GreatGuysMove)', solutionRef: 'L4',
    note: 'The platform presents a license-status claim about the federal carrier registry that the company has never published. The correction asks for removal of the framing alongside the discount (gap L4); the registry records the framing, never the platform’s wording.' }),
  rec({ recordId: 'greatguysmove-w-nap', source: 'greatguysmove', branch: 'winchester', field: 'name, address, phone, founding',
    observedValue: 'Address correct (116 W Piccadilly St Ste 11); phone correct; founding 2010 correct',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 3 },
    evidenceRef: D3 + ' §2.2 (GreatGuysMove)' }),
  rec({ recordId: 'greatguysmove-m-existence', source: 'greatguysmove', branch: 'martinsburg', field: 'profile existence',
    observedValue: 'Only the Winchester page exists on this source',
    correctValue: 'A Martinsburg page carrying the Martinsburg canonical facts',
    status: 'no-profile-exists', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: D3 + ' §2.2 (GreatGuysMove)', solutionRef: 'L9',
    creationPath: 'Request the second location page in the same correction motion as the Winchester discount removal (branch-parity wave, Dossier 03 §4 L9 / G-E5)' }),

  // ---- our own stale artifact in the index (Dossier 03 §2.2)
  rec({ recordId: 'estate-stale-free-estimates-offer', source: 'estate-stale-index', branch: 'company', field: 'offer text (stale pre-rebuild page)',
    sourceUrl: 'https://theflatratemovers.com/post/free-moving-estimates',
    observedValue: 'A stale pre-rebuild estate page still in the index carries the same “15 percent discount” sentence the GreatGuysMove profile displays',
    correctValue: 'No discount offer exists on any estate surface; the current site publishes the flat-rate guarantee only',
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 352 },
    evidenceRef: D3 + ' §2.2 (GreatGuysMove provenance)', solutionRef: 'L4',
    note: 'Provenance evidence for gap L4: the scraped sentence most plausibly originated on our own pre-rebuild page (page last crawled ~352 days before the 2026-10-31 read). First action is to verify the page is still served; the retirement itself is this element’s build batch B5 (an estate-side change, sequenced so a live estate batch is never edited concurrently).' }),

  // ---- AnyFlip: our own content, stale mirror (Dossier 03 §2.2)
  rec({ recordId: 'anyflip-stale-claims', source: 'anyflip', branch: 'company', field: 'claims (stale homepage mirror)',
    observedValue: 'A stale mirror of the old homepage still ranking for name queries, carrying old-era claims the current site does not make (“licensed and insured”; “same-day service”)',
    correctValue: 'The current site’s published claims only; the mirror should be removed or updated to the current homepage',
    status: 'open', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 9 },
    evidenceRef: D3 + ' §2.2 (AnyFlip — NEW)', solutionRef: 'L8', ownerStep: 'step-6-anyflip-conditional',
    note: 'The mirrored content is ~497 days old (it cites an October 2024 mover ranking) and the page was crawled ~9 days before the 2026-10-31 read — it is ranking NOW. Whether the publishing account is ours is unverified: the designed sequence checks account recovery first, then takedown-or-update (build batch B5); the owner step is conditional on recovery requiring it.' }),
  rec({ recordId: 'anyflip-nap', source: 'anyflip', branch: 'company', field: 'name, address',
    observedValue: 'Current name; 116 W Piccadilly St address (correct)',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: 9 },
    evidenceRef: D3 + ' §2.2 (AnyFlip)' }),

  // ---- verified-correct singles (Phase 1 audit, 2026-10-30; nothing
  // in the 2026-10-31 pass contradicts them)
  rec({ recordId: 'thomasnet-w-profile', source: 'thomasnet', branch: 'winchester', field: 'profile (name, address, phone, categories)',
    observedValue: 'Full correct NAP; correct categories (Packing, Relocation, Household and Stock Moving, Movers), anchored on the Winchester address',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Thomasnet row); Wave 2 prep re-verification 2026-10-31 (listing confirmed present — the wave item is a CLAIM, not a creation)',
    note: 'One of the strongest industrial discovery surfaces in the audit. The registry tracks the public profile; the claim (G-E3) rides a Thomasnet supplier account action at the table.' }),
  rec({ recordId: 'nearbymovers-w-profile', source: 'nearbymovers', branch: 'winchester', field: 'profile',
    observedValue: 'Correct NAP; correct categories; correct founding (2010)',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (NearbyMovers row)' }),
  rec({ recordId: 'bestprosintown-w-profile', source: 'bestprosintown', branch: 'winchester', field: 'profile',
    observedValue: 'Correct NAP; correct founding (2010)',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (BestProsInTown row)' }),
  rec({ recordId: 'bizidex-w-profile', source: 'bizidex', branch: 'winchester', field: 'profile',
    observedValue: 'Correct NAP; correct founding (2010); correct category (Piano Movers); branch-specific page',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Bizidex row)' }),
  rec({ recordId: 'bunity-w-profile', source: 'bunity', branch: 'winchester', field: 'profile',
    observedValue: 'Correct NAP; correct founding (2010); mover categories',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Bunity row)' }),
  rec({ recordId: 'hirerush-w-profile', source: 'hirerush', branch: 'winchester', field: 'profile',
    observedValue: 'Partial NAP complete and correct as shown (the aggregate does not publish a street address; what it shows is right)',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (HireRush row)' }),
  rec({ recordId: 'aboutme-w-profile', source: 'aboutme', branch: 'winchester', field: 'profile',
    observedValue: 'Correct headline business descriptors (Winchester + Martinsburg named; year 2010 in the URL/handle record)',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (About.me row)' }),
  rec({ recordId: 'akama-w-profile', source: 'akama', branch: 'winchester', field: 'profile',
    observedValue: 'Correct name/phone/website/established 2010 (membership directory record)',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Akama row)' }),
  rec({ recordId: 'industryoversight-w-profile', source: 'industryoversight', branch: 'winchester', field: 'profile',
    observedValue: 'Correct NAP; categorized “Moving & Storage Service”; membership-based listing site (lien/credit data product)',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (IndustryOversight row)' }),
  rec({ recordId: 'lnkbio-company-page', source: 'lnkbio', branch: 'company', field: 'link page (own channel)',
    observedValue: 'The company’s own link-in-bio page carries the Winchester address and links both towns’ services',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Lnk.bio row)',
    note: 'Company-level surface: the page is ours and carries the Winchester address; Martinsburg is carried in its service links rather than on a branch-specific page, and no branch-specific page exists on this source.' }),
  rec({ recordId: 'medium-company-profile', source: 'medium', branch: 'company', field: 'publication profile (own channel)',
    observedValue: 'Both branch addresses carried correctly on the company’s Medium presence',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Medium rows, both branch tables)' }),

  // ---- Martinsburg-only sources (Phase 1 audit)
  rec({ recordId: 'localitybiz-m-address', source: 'localitybiz', branch: 'martinsburg', field: 'address',
    observedValue: '736 Williamsport Pike Ste 2, Martinsburg, WV 25404 (correct)',
    correctValue: 'Correct as displayed',
    status: 'verified-correct', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Martinsburg audit table, LocalityBiz row)' }),
  rec({ recordId: 'localitybiz-m-category', source: 'localitybiz', branch: 'martinsburg', field: 'category surfaces',
    observedValue: 'The record surfaces under taxi and insurance category pages as well as moving',
    correctValue: 'Moving categories',
    status: 'open', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Martinsburg audit table, LocalityBiz row)',
    note: 'No practical edit channel exists on this source — monitor only (Phase 1 audit). Recorded so the parity matrix shows the state honestly rather than a blank.' }),
  rec({ recordId: 'rentechdigital-m-scrape', source: 'rentechdigital', branch: 'martinsburg', field: 'scraped record',
    observedValue: 'A scraped-data record exists; address data is masked in the free view; the record is referenced (for backlink credit) from other Martinsburg pages',
    correctValue: 'The Martinsburg canonical facts',
    status: 'open', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (Martinsburg audit table, RenTechDigital row)', solutionRef: 'L2',
    propagationParent: 'data-axle-m-record',
    note: 'A scraper, not a citation channel: the row exists for propagation tracking only — if the upstream record is corrected and this one refreshes wrong, it is evidence about propagation, not a channel to fix directly.' }),
);

// ---- group 3: absences and channel expansions (Dossier 03 §§2.4, 6;
// Phase 1 audit; Wave 2 prep). Every source in the coverage matrix
// carries a row for BOTH branches — an absence is a record, never a
// blank (the branch-parity rule).
function absence(recordId, source, branch, evidence, o) {
  return rec(Object.assign({
    recordId, source, branch, field: 'profile existence',
    observedValue: 'No profile exists for this branch on this source',
    correctValue: 'A profile carrying the branch’s canonical facts',
    status: 'no-profile-exists',
    lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: evidence,
  }, o || {}));
}
const G5 = P1 + ' (Martinsburg grouped absence sweep, 2026-10-30)';
RECORDS.push(
  // GBP-linked channel expansions (G-E1)
  absence('bing-places-w-existence', 'bing-places', 'winchester', P2P, {
    lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    note: 'No public listing surfaced in the Wave 2 prep check. Creation opens with an in-account duplicate check, then the standard GBP-import flow (the documented route — the data is already canonical in Google). Sequenced as a wave-3 at-the-table item (G-E1).',
    creationPath: 'Bing Places creation via GBP import, after the in-account duplicate check (G-E1)',
  }),
  absence('bing-places-m-existence', 'bing-places', 'martinsburg', P2P, {
    lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    note: 'Parity row: Martinsburg is created in the same motion as Winchester (G-E1).',
    creationPath: 'Bing Places creation via GBP import, after the in-account duplicate check (G-E1)',
  }),
  absence('apple-business-w-existence', 'apple-business', 'winchester', D3 + ' §6 (G-E1)', {
    status: 'unverifiable-today',
    lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    note: 'Apple Business Connect state is account-side and not publicly verifiable from the search surface; the claim check is part of the G-E1 wave (Apple Maps is a material share of local pack traffic on iOS).',
    creationPath: 'Apple Business Connect claim/creation, both branches (G-E1)',
  }),
  absence('apple-business-m-existence', 'apple-business', 'martinsburg', D3 + ' §6 (G-E1)', {
    status: 'unverifiable-today',
    lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    note: 'Parity row — claimed/created in the same motion as Winchester (G-E1).',
    creationPath: 'Apple Business Connect claim/creation, both branches (G-E1)',
  }),
  // Review-platform expansions (G-E4)
  absence('yelp-w-existence', 'yelp', 'winchester', P1 + ' (Yelp row); re-corroborated 2026-10-31', {
    lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    note: 'Verified absence twice (2026-10-30 audit and the 2026-10-31 Wave 2 prep re-check): no Yelp page exists for either branch. Yelp is the highest-weight review surface in the answer-citation research (Dossier 02 §2) after the GBP layer — the most material single absence in the graph.',
    creationPath: 'Yelp business claim/creation, both branches in one motion (G-E4, wave 3, at the table)',
  }),
  absence('yelp-m-existence', 'yelp', 'martinsburg', P1 + ' (Yelp row); re-corroborated 2026-10-31', {
    lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    note: 'Parity row — created in the same motion as Winchester (G-E4).',
    creationPath: 'Yelp business claim/creation, both branches in one motion (G-E4)',
  }),
  absence('nextdoor-w-existence', 'nextdoor', 'winchester', D3 + ' §6 (G-E4)', {
    status: 'unverifiable-today',
    lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    note: 'Nextdoor presence is neighborhood-graph state, not publicly enumerable from the search surface; the claim check rides the G-E4 wave (Nextdoor is a real referral surface for residential moving).',
    creationPath: 'Nextdoor business claim/creation (G-E4)',
  }),
  absence('nextdoor-m-existence', 'nextdoor', 'martinsburg', D3 + ' §6 (G-E4)', {
    status: 'unverifiable-today',
    lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    note: 'Parity row — same motion as Winchester (G-E4).',
    creationPath: 'Nextdoor business claim/creation (G-E4)',
  }),
  // Wave 2 creation wave (Phase 2 plan §Wave 2) — free-claim channels
  absence('angi-w-existence', 'angi', 'winchester', P1 + ' (Angi row)', {
    note: 'Free claim path verified in the audit (angi.com/business-claim); Angi and HomeAdvisor are the same account — one claim covers both.',
    creationPath: 'Angi business claim (one account also covers HomeAdvisor), wave 2, at the table',
  }),
  absence('angi-m-existence', 'angi', 'martinsburg', P1 + ' (Angi row)', {
    note: 'Parity row — second location on the same claim.',
    creationPath: 'Angi business claim, second location (wave 2)',
  }),
  absence('houzz-w-existence', 'houzz', 'winchester', P1 + ' (Houzz row)', {
    creationPath: 'Houzz pro profile creation (free tier), wave 2, at the table',
  }),
  absence('houzz-m-existence', 'houzz', 'martinsburg', P1 + ' (Houzz row)', {
    note: 'Parity row — second location/service area on the same profile.',
    creationPath: 'Houzz pro profile, second location (wave 2)',
  }),
  absence('thumbtack-w-existence', 'thumbtack', 'winchester', P1 + ' (Thumbtack row)', {
    note: 'Free to join; leads are pay-per-lead afterwards — joining is free and inside the rule; lead purchase decisions are the owner’s.',
    creationPath: 'Thumbtack pro signup (free), wave 2, at the table — phone verification code is the owner’s step in-session',
  }),
  absence('thumbtack-m-existence', 'thumbtack', 'martinsburg', P1 + ' (Thumbtack row)', {
    note: 'Parity row — Martinsburg service area on the same pro account.',
    creationPath: 'Thumbtack pro signup, Martinsburg service area (wave 2)',
  }),
  absence('moverscom-w-existence', 'movers-com', 'winchester', P1 + ' (Movers.com row)', {
    note: 'Program rule 3.8 applies: a lead-gen profile, if created, never carries lead-gen copy as company fact.',
    creationPath: 'Movers.com business profile (free route), wave 2, at the table',
  }),
  absence('moverscom-m-existence', 'movers-com', 'martinsburg', P1 + ' (Movers.com row)', {
    note: 'Parity row.',
    creationPath: 'Movers.com business profile, Martinsburg (wave 2)',
  }),
  absence('mcr-w-existence', 'movingcompanyreviews', 'winchester', P1 + ' (MovingCompanyReviews row)', {
    creationPath: 'MovingCompanyReviews business profile (free), wave 2, at the table',
  }),
  absence('mcr-m-existence', 'movingcompanyreviews', 'martinsburg', P1 + ' (Movers.com/MCR rows)', {
    note: 'Parity row.',
    creationPath: 'MovingCompanyReviews business profile, Martinsburg (wave 2)',
  }),
  // Editorial / paid channels — no submission flow (monitor only)
  absence('movebuddha-w-existence', 'movebuddha', 'winchester', D3 + ' §2.4.3', {
    lastVerified: { date: '2026-10-31', method: 'search-surface', crawlAgeDays: null },
    observedValue: 'The company is absent from moveBuddha’s Winchester top-10 mover list (read 2026-10-31)',
    correctValue: 'Consideration in the list on the strength of the corroborated record (GBP facts, the dataset estate, third-party corroboration)',
    note: 'An editorial absence on a high-intent list — the fix is the channel check (editorial update request vs paid placement; paid placement is out under the no-paid rule) plus the canonical data packet. Framed as corroboration work, never a promise (Dossier 03 §2.4.3).',
    creationPath: 'Editorial channel check + canonical packet submission; no paid placement (Dossier 03 §2.4.3)',
  }),
  absence('movebuddha-m-existence', 'movebuddha', 'martinsburg', P1 + ' (Martinsburg audit table, moveBuddha row)', {
    observedValue: 'The company is absent from moveBuddha’s Martinsburg list',
    correctValue: 'Consideration in the list on the strength of the corroborated record',
    note: 'Parity row — same editorial channel as the Winchester row.',
    creationPath: 'Editorial channel check + canonical packet submission; no paid placement',
  }),
  absence('todays-homeowner-w-existence', 'todays-homeowner', 'winchester', P1 + " (Today’s Homeowner row)", {
    note: 'Data-driven editorial rankings with no submission flow — monitor only; the corroboration estate is the lever.',
    creationPath: 'None (editorial; monitor only)',
  }),
  absence('todays-homeowner-m-existence', 'todays-homeowner', 'martinsburg', P1 + " (Today’s Homeowner row)", {
    note: 'Parity row — monitor only.',
    creationPath: 'None (editorial; monitor only)',
  }),
  // Real chambers — paid membership, outside the no-paid rule
  absence('chamber-tov-w-existence', 'chamber-top-of-virginia', 'winchester', P1 + ' (Top of Virginia Regional Chamber row)', {
    note: 'The REAL local chamber (distinct from the Chamberofcommerce.com directory): membership is paid and outside the no-paid rule — a business decision for the owner, recorded so the absence is a decision, not an oversight.',
    creationPath: 'Paid membership — owner business decision; not pursued under the no-paid rule',
  }),
  absence('chamber-mbc-m-existence', 'chamber-martinsburg-berkeley', 'martinsburg', P1 + ' (Martinsburg–Berkeley County Chamber row)', {
    note: 'Parity row — the real Berkeley County chamber; paid membership, owner decision.',
    creationPath: 'Paid membership — owner business decision; not pursued under the no-paid rule',
  }),
  // Martinsburg grouped absences (Phase 1 grouped sweep — no listing
  // found for Martinsburg on these Winchester-present sources)
  absence('mapquest-m-existence', 'mapquest', 'martinsburg', G5, {
    solutionRef: 'L9',
    creationPath: 'Branch-parity wave (G-E5): Martinsburg listing created/submitted from the canonical packet',
  }),
  absence('nearbymovers-m-existence', 'nearbymovers', 'martinsburg', G5, {
    solutionRef: 'L9',
    creationPath: 'Branch-parity wave (G-E5): Martinsburg listing from the canonical packet',
  }),
  absence('bestprosintown-m-existence', 'bestprosintown', 'martinsburg', G5, {
    solutionRef: 'L9',
    creationPath: 'Branch-parity wave (G-E5): Martinsburg listing from the canonical packet',
  }),
  absence('bizidex-m-existence', 'bizidex', 'martinsburg', G5, {
    solutionRef: 'L9',
    creationPath: 'Branch-parity wave (G-E5): Martinsburg listing from the canonical packet',
  }),
  absence('bunity-m-existence', 'bunity', 'martinsburg', G5, {
    solutionRef: 'L9',
    creationPath: 'Branch-parity wave (G-E5): Martinsburg listing from the canonical packet',
  }),
  absence('hirerush-m-existence', 'hirerush', 'martinsburg', G5, {
    solutionRef: 'L9',
    creationPath: 'Branch-parity wave (G-E5): Martinsburg listing from the canonical packet',
  }),
  absence('aboutme-m-existence', 'aboutme', 'martinsburg', G5, {
    solutionRef: 'L9',
    note: 'The company About.me page names both towns in its descriptors; no branch-specific Martinsburg page exists. Parity here means the Martinsburg facts ride the company page accurately.',
    creationPath: 'Branch-parity wave (G-E5): Martinsburg facts verified on the company page / branch page if the source supports one',
  }),
  absence('akama-m-existence', 'akama', 'martinsburg', G5, {
    solutionRef: 'L9',
    creationPath: 'Branch-parity wave (G-E5): Martinsburg listing if the directory supports a second location',
  }),
  absence('thomasnet-m-existence', 'thomasnet', 'martinsburg', G5, {
    solutionRef: 'L9',
    note: 'The Thomasnet supplier record is anchored on the Winchester address; Martinsburg parity on this source is the service-area statement on the claimed profile (the G-E3 claim), not a second profile.',
    creationPath: 'At claim (G-E3): Martinsburg carried as a served location on the one supplier profile',
  }),
  absence('industryoversight-m-existence', 'industryoversight', 'martinsburg', G5, {
    solutionRef: 'L9',
    creationPath: 'Branch-parity wave (G-E5): Martinsburg listing if the directory supports one',
  }),
  absence('chamber-m-existence', 'chamber-directory', 'martinsburg', G5, {
    solutionRef: 'L9',
    creationPath: 'Branch-parity wave (G-E5): Martinsburg listing from the canonical packet',
  }),
  absence('judysbook-m-existence', 'judys-book', 'martinsburg', G5, {
    solutionRef: 'L9',
    note: 'No Martinsburg listing; creation on this source runs into the same paywalled-edit economics as the Winchester record — the parity route is the canonical packet if a free creation path exists, else recorded as monitored.',
    creationPath: 'Branch-parity wave (G-E5): free creation path only; otherwise monitored',
  }),
  absence('fyple-m-existence', 'fyple', 'martinsburg', G5, {
    solutionRef: 'L9',
    creationPath: 'Branch-parity wave (G-E5): Martinsburg listing from the canonical packet',
  }),
  absence('startus-m-existence', 'startus', 'martinsburg', G5, {
    solutionRef: 'L9',
    note: 'The source site was unreachable in Wave 1 — do not retry the direct route; parity rides propagation.',
    creationPath: 'Propagation only (source unreachable; standing no-retry)',
  }),
  // Single-record and branch-specific sources: parity here means the
  // state is recorded, not that a second record should exist.
  rec({ recordId: 'nsn-lookup-m-scope', source: 'nsn-lookup', branch: 'martinsburg', field: 'branch record',
    observedValue: 'No Martinsburg record — this source carries one company cage record, whose mailing address is the Winchester one (see the Winchester row)',
    correctValue: 'One company record with the correct Winchester mailing address; Martinsburg is a branch of the same company record, not a second record on this source',
    status: 'no-profile-exists', lastVerified: { date: '2026-10-30', method: 'search-surface', crawlAgeDays: null },
    evidenceRef: P1 + ' (NSN Lookup row — Winchester table only)',
    note: 'Parity on a single-record source means the company record is correct; there is nothing branch-specific to create here. The address defect lives on the Winchester row (nsn-w-address).',
    creationPath: 'None — single company record source; correctness rides the Winchester row’s correction' }),
  absence('localitybiz-w-existence', 'localitybiz', 'winchester', P1 + ' (Winchester audit table — no LocalityBiz row)', {
    solutionRef: 'L9',
    note: 'This source surfaced only for Martinsburg in the audit; the Winchester cell is recorded as an absence so the matrix stays honest.',
    creationPath: 'Branch-parity wave (G-E5): Winchester listing from the canonical packet if the source accepts one' }),
  absence('rentechdigital-w-existence', 'rentechdigital', 'winchester', P1 + ' (Winchester audit table — no RenTechDigital row)', {
    note: 'The scraped record surfaced only for Martinsburg. A scraper, not a citation channel — recorded for completeness of the matrix.',
    creationPath: 'None pursued — scraper surface; propagation tracking only' }),
  absence('chamber-tov-m-scope', 'chamber-top-of-virginia', 'martinsburg', P1 + ' (Top of Virginia Regional Chamber row)', {
    note: 'This chamber serves the Winchester / Top of Virginia region; Martinsburg parity lives on the Martinsburg–Berkeley County chamber source, not here.',
    creationPath: 'Not applicable — regional chamber for the Winchester area' }),
  absence('chamber-mbc-w-scope', 'chamber-martinsburg-berkeley', 'winchester', P1 + ' (Martinsburg–Berkeley County Chamber row)', {
    note: 'This chamber serves Berkeley County (Martinsburg); Winchester parity lives on the Top of Virginia chamber source, not here.',
    creationPath: 'Not applicable — regional chamber for the Martinsburg area' }),
  rec({
    "sourceUrl": "https://www.wikidata.org/wiki/Q141969215",
    "sourceRecordId": "Q141969215",
    "correctRef": null,
    "propagationParent": null,
    "solutionRef": null,
    "ownerStep": null,
    "creationPath": null,
    "note": "Machine form: https://www.wikidata.org/wiki/Special:EntityData/Q141969215.json. Company-level item \u2014 covers both branches in the coverage matrix. Cross-linked from both OpenStreetMap nodes (wikidata=Q141969215, changeset 191354104).",
    "recordId": "wikidata-company-item",
    "source": "wikidata",
    "branch": "company",
    "field": "company item",
    "observedValue": "Live Wikidata item Q141969215 for the company: 7 statements (P31 business, P571 inception 2010-06, P856 website, P17 US, P159 HQ Winchester, P452 transport industry, P276 location Martinsburg), all carrying the site as reference; EntityData JSON parsed OK; no notability/deletion warnings",
    "correctValue": "A live Wikidata company item carrying the company facts in the observed value (founded June 2010; HQ Winchester; Martinsburg location; company website)",
    "status": "verified-correct",
    "lastVerified": {
      "date": "2026-11-02",
      "method": "direct-fetch",
      "crawlAgeDays": null
    },
    "evidenceRef": "Retrieval Machine new-channels record, 2026-11-02 (~/workspace/theflatratemovers/retrieval-machine/new-channels-2026-11-02.md) \u2014 Wikidata section (parent-verified via EntityData JSON 2026-11-02)"
  }),
  rec({
    "sourceUrl": "https://www.wikidata.org/wiki/Q141969268",
    "sourceRecordId": "Q141969268",
    "correctRef": null,
    "propagationParent": null,
    "solutionRef": null,
    "ownerStep": null,
    "creationPath": null,
    "note": "No EAN property exists on Wikidata for 2940185300718 (searched; correctly not forced) \u2014 the Barnes & Noble EAN is therefore absent from the item by platform structure, not by omission. The ASIN statement carries no Amazon reference because Amazon refuses the agent browser (standing Amazon block, per the source record). Machine form: https://www.wikidata.org/wiki/Special:EntityData/Q141969268.json.",
    "recordId": "wikidata-book-item",
    "source": "wikidata",
    "branch": "company",
    "field": "book item",
    "observedValue": "Live Wikidata item Q141969268 for the book: 6 properties (P31 written work + literary work, P1476 full title, P2093 author name string \"Henry Pitts Jr.\", P577 2026-03-01, P5749 ASIN B0GRBKR5DS, P407 English); EntityData JSON parsed OK; no notability/deletion warnings",
    "correctValue": "A live Wikidata item for the book carrying ASIN B0GRBKR5DS and publication date 2026-03-01",
    "status": "verified-correct",
    "lastVerified": {
      "date": "2026-11-02",
      "method": "direct-fetch",
      "crawlAgeDays": null
    },
    "evidenceRef": "Retrieval Machine new-channels record, 2026-11-02 (~/workspace/theflatratemovers/retrieval-machine/new-channels-2026-11-02.md) \u2014 Wikidata section (parent-verified via EntityData JSON 2026-11-02)"
  }),
  rec({
    "sourceUrl": "https://www.wikidata.org/wiki/Q141969285",
    "sourceRecordId": "Q141969285",
    "correctRef": null,
    "propagationParent": null,
    "solutionRef": null,
    "ownerStep": null,
    "creationPath": null,
    "note": "Machine form: https://www.wikidata.org/wiki/Special:EntityData/Q141969285.json. The DOI is the Zenodo dataset concept DOI recorded in the Zenodo section of the same source file.",
    "recordId": "wikidata-dataset-item",
    "source": "wikidata",
    "branch": "company",
    "field": "dataset item",
    "observedValue": "Live Wikidata item Q141969285 for the dataset estate: 7 statements (P31 data set, P356 DOI 10.5281/zenodo.23879048 with Zenodo reference, P123 publisher -> Q141969215, P275 CC BY 4.0, P6216 copyrighted, P577 2026-11-02, P856 https://api.theflatratemovers.com/); EntityData JSON parsed OK; no notability/deletion warnings",
    "correctValue": "A live Wikidata dataset item carrying concept DOI 10.5281/zenodo.23879048, publisher Q141969215 and CC BY 4.0",
    "status": "verified-correct",
    "lastVerified": {
      "date": "2026-11-02",
      "method": "direct-fetch",
      "crawlAgeDays": null
    },
    "evidenceRef": "Retrieval Machine new-channels record, 2026-11-02 (~/workspace/theflatratemovers/retrieval-machine/new-channels-2026-11-02.md) \u2014 Wikidata section (parent-verified via EntityData JSON 2026-11-02)"
  }),
  rec({
    "sourceUrl": "https://www.openstreetmap.org/node/14340286372",
    "sourceRecordId": "14340286372",
    "correctRef": null,
    "propagationParent": null,
    "solutionRef": null,
    "ownerStep": null,
    "creationPath": null,
    "note": "No correctRef is used: the node's placed coordinates are an iD click placement ~5 m from the canonical branch geo, as the source records, so a geo correctRef would make the generator refuse the row (seed value would disagree with the computed canonical value). The field tracked is the node record as a whole.",
    "recordId": "openstreetmap-w-node",
    "source": "openstreetmap",
    "branch": "winchester",
    "field": "map node (place record)",
    "observedValue": "OpenStreetMap node for The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601; placed 39.1870713, -78.1668261 (~5 m from the Places point 39.18711576, -78.1668352; iD click placement); 12 tags verified incl. phone, website, opening_hours Mo-Fr 08:00-18:00 / Sa 08:00-16:00 / Su 09:00-16:00; wikidata=Q141969215 tag present (Version #2, verified live on the node page)",
    "correctValue": "Correct as displayed",
    "status": "verified-correct",
    "lastVerified": {
      "date": "2026-11-02",
      "method": "direct-fetch",
      "crawlAgeDays": null
    },
    "evidenceRef": "Retrieval Machine new-channels record, 2026-11-02 (~/workspace/theflatratemovers/retrieval-machine/new-channels-2026-11-02.md) \u2014 OpenStreetMap section (creation changeset 191353533; wikidata cross-link changeset 191354104)"
  }),
  rec({
    "sourceUrl": "https://www.openstreetmap.org/node/14340286373",
    "sourceRecordId": "14340286373",
    "correctRef": null,
    "propagationParent": null,
    "solutionRef": null,
    "ownerStep": null,
    "creationPath": null,
    "note": "Branch record \u2014 the Martinsburg node is a separate node from the Winchester node and carries Martinsburg's own name, address and hours. No correctRef, for the same click-placement reason as the Winchester node row.",
    "recordId": "openstreetmap-m-node",
    "source": "openstreetmap",
    "branch": "martinsburg",
    "field": "map node (place record)",
    "observedValue": "OpenStreetMap node for Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg WV 25404; placed 39.4831998, -77.9476545 (~5 m from the canonical point 39.48319665, -77.94760443); 12 tags verified incl. opening_hours Mo-Fr 09:00-18:00 / Sa 09:00-16:00 / Su 09:00-16:00; wikidata=Q141969215 tag present (Version #2, verified live on the node page)",
    "correctValue": "Correct as displayed",
    "status": "verified-correct",
    "lastVerified": {
      "date": "2026-11-02",
      "method": "direct-fetch",
      "crawlAgeDays": null
    },
    "evidenceRef": "Retrieval Machine new-channels record, 2026-11-02 (~/workspace/theflatratemovers/retrieval-machine/new-channels-2026-11-02.md) \u2014 OpenStreetMap section (creation changeset 191353533; wikidata cross-link changeset 191354104)"
  }),
  rec({
    "sourceUrl": "https://publishercenter.google.com/?publication=CAoww5riCw",
    "sourceRecordId": "CAoww5riCw",
    "correctRef": null,
    "propagationParent": null,
    "solutionRef": null,
    "ownerStep": null,
    "creationPath": null,
    "note": "The current UI offers no News section/feed/RSS mechanism (per the source record: \"March 2025 update: Google News now automatically generates publication pages\"); Reader Revenue Manager NOT STARTED (deliberately; not a News gate); the legacy publication \"Historic Apple Winchester VA Movers\" in the same account is untouched. The unfilled wide-logo slot is recorded in the observed value, not staged as a separate row (one record per channel, per the staging brief).",
    "recordId": "google-publisher-center-company-publication",
    "source": "google-publisher-center",
    "branch": "company",
    "field": "publication",
    "observedValue": "Google Publisher Center publication \"The Flat Rate Movers\" created 2026-11-02 (org \"The Flat Rate Movers\", ratemovers@gmail.com); primary URL theflatratemovers.com VERIFIED in settings (Search Console ownership); square logo uploaded (estate logo 1024x1024), wide logo slot unfilled; contact ratemovers@gmail.com status Verified (update 2026-11-02 ~03:35 EST, read directly from the settings page)",
    "correctValue": "A Publisher Center publication for the company with the primary URL verified and the contact verified",
    "status": "verified-correct",
    "lastVerified": {
      "date": "2026-11-02",
      "method": "owner-manager-read",
      "crawlAgeDays": null
    },
    "evidenceRef": "Retrieval Machine new-channels record, 2026-11-02 (~/workspace/theflatratemovers/retrieval-machine/new-channels-2026-11-02.md) \u2014 Google Publisher Center section incl. the 2026-11-02 ~03:35 EST contact-verified update"
  }),
  rec({
    "sourceUrl": "https://www.instagram.com/theflatratemoversllc/",
    "sourceRecordId": "@theflatratemoversllc",
    "correctRef": null,
    "propagationParent": null,
    "solutionRef": null,
    "ownerStep": null,
    "creationPath": null,
    "note": "OPEN ITEM carried on this row (not a separate record, and deliberately NOT coded as an ownerStep \u2014 see D-registry.md): website links NOT set \u2014 Instagram's web editor refuses link editing (\"only available on mobile\"); the source record's route is the Instagram connector (update-bio --action add-link) once the account is linked through Meta Accounts Center, else the owner's mobile app. The older @theflatratemovers account is CLOSED by owner ruling 2026-11-02 (cannot be logged into; never propose recovery) \u2014 this llc account is its replacement.",
    "recordId": "instagram-company-profile",
    "source": "instagram",
    "branch": "company",
    "field": "profile (own channel)",
    "observedValue": "Operating Instagram @theflatratemoversllc: Business (Professional) account, category \"Moving & Storage Service\"; name \"The Flat Rate Movers | Winchester & Martinsburg\"; 149-char company bio (flat-rate, Winchester VA & Martinsburg WV, gun safes/pianos/heavy, guarantee, Est. 2010); logo profile picture; contact email ratemovers@gmail.com and phone +1 540-422-2153 shown; no street address entered; privacy PUBLIC; 0 posts / 0 followers / 0 following at capture (~05:36 EST, browser-verified by profile reload); personal-name occurrences on the finished profile: 0",
    "correctValue": "Correct as displayed",
    "status": "verified-correct",
    "lastVerified": {
      "date": "2026-11-02",
      "method": "direct-fetch",
      "crawlAgeDays": null
    },
    "evidenceRef": "Retrieval Machine new-channels record, 2026-11-02 (~/workspace/theflatratemovers/retrieval-machine/new-channels-2026-11-02.md) \u2014 Instagram section (node captured 2026-11-02 ~05:36 EST)"
  }),
  rec({
    "sourceUrl": "https://www.threads.com/@theflatratemoversllc",
    "sourceRecordId": "@theflatratemoversllc",
    "correctRef": null,
    "propagationParent": null,
    "solutionRef": null,
    "ownerStep": null,
    "creationPath": null,
    "note": "Threads' own \"Finish your profile\" prompts (create thread, follow 10) were intentionally left undone \u2014 no posts/follows made (source record). Nothing was attempted with the closed @theflatratemovers account.",
    "recordId": "threads-company-profile",
    "source": "threads",
    "branch": "company",
    "field": "profile (own channel)",
    "observedValue": "Threads @theflatratemoversllc (tied to the operating Instagram of the same handle): name \"The Flat Rate Movers\"; full company bio (flat-rate, Winchester VA & Martinsburg WV, gun safes/pianos/heavy, guarantee, Est. 2010); link https://theflatratemovers.com/; logo profile picture (carried from Instagram); privacy PUBLIC (confirmed in Edit profile); 0 followers, no posts at capture (~05:41 EST, browser-verified on the reloaded profile)",
    "correctValue": "Correct as displayed",
    "status": "verified-correct",
    "lastVerified": {
      "date": "2026-11-02",
      "method": "direct-fetch",
      "crawlAgeDays": null
    },
    "evidenceRef": "Retrieval Machine new-channels record, 2026-11-02 (~/workspace/theflatratemovers/retrieval-machine/new-channels-2026-11-02.md) \u2014 Threads section (node captured 2026-11-02 ~05:41 EST)"
  }),
);

// Backlink attachments (Consolidated Visibility Batch 2026-11-02):
// referring pages whose domain already has a registry source ride
// on that source’s holder record as a `backlinks` array (the
// minimal schema extension staged in D-registry); they create no
// new third-party record and do not enter the coverage matrix.
const BACKLINK_ATTACHMENTS = {
  "cb-insights-hq-address": [
    {
      "referring_domain": "cbinsights.com",
      "referring_page": "https://cbinsights.com/company/the-flat-rate-movers/alternatives-competitors",
      "anchor_text": "theflatratemovers.com",
      "target_url": "https://theflatratemovers.com",
      "tier": "directory-or-platform",
      "class": "recorded",
      "source": "Bing Webmaster backlinks export 2026-11-01",
      "observed_date": "2026-11-01",
      "verification_status": "recorded (export-sourced; not fetch-verified)"
    },
    {
      "referring_domain": "cbinsights.com",
      "referring_page": "https://cbinsights.com/company/the-flat-rate-movers",
      "anchor_text": "theflatratemovers.com",
      "target_url": "https://theflatratemovers.com",
      "tier": "directory-or-platform",
      "class": "recorded",
      "source": "Bing Webmaster backlinks export 2026-11-01",
      "observed_date": "2026-11-01",
      "verification_status": "recorded (export-sourced; not fetch-verified)"
    }
  ],
  "birdeye-w-address": [
    {
      "referring_domain": "reviews.birdeye.com",
      "referring_page": "https://reviews.birdeye.com/the-flat-rate-movers-163130362685696",
      "anchor_text": "https://www.theflatratemovers.com/",
      "target_url": "https://theflatratemovers.com",
      "tier": "directory-or-platform",
      "class": "recorded",
      "source": "Bing Webmaster backlinks export 2026-11-01",
      "observed_date": "2026-11-01",
      "verification_status": "recorded (export-sourced; not fetch-verified)"
    },
    {
      "referring_domain": "reviews.birdeye.com",
      "referring_page": "https://reviews.birdeye.com/the-flat-rate-movers-163130362685696?filter=newest&rsource=100",
      "anchor_text": "https://www.theflatratemovers.com/",
      "target_url": "https://theflatratemovers.com",
      "tier": "directory-or-platform",
      "class": "recorded",
      "source": "Bing Webmaster backlinks export 2026-11-01",
      "observed_date": "2026-11-01",
      "verification_status": "recorded (export-sourced; not fetch-verified)"
    }
  ],
  "birdeye-m-nap": [
    {
      "referring_domain": "reviews.birdeye.com",
      "referring_page": "https://reviews.birdeye.com/flat-rate-movers-martinsburg-wv-171614909716521",
      "anchor_text": "https://www.theflatratemovers.com/",
      "target_url": "https://theflatratemovers.com",
      "tier": "directory-or-platform",
      "class": "recorded",
      "source": "Bing Webmaster backlinks export 2026-11-01",
      "observed_date": "2026-11-01",
      "verification_status": "recorded (export-sourced; not fetch-verified)"
    }
  ]
};
for (const seed of RECORDS) {
  if (seed.recordId && BACKLINK_ATTACHMENTS[seed.recordId]) seed.backlinks = BACKLINK_ATTACHMENTS[seed.recordId];
}


// ------------------------------------------------------------- sources
// The coverage-matrix source list (Dossier 03 §5.2: sources x 2
// branches; every source here must carry at least one record per
// branch — company-scope records count toward both branches and are
// marked as such in the cell).
const SOURCES = [
  ['google-places', 'Google Business Profile / Places', 'Core pack surface (GBP)'],
  ['birdeye', 'Birdeye', 'Aggregator / review syndication'],
  ['bbb', 'Better Business Bureau', 'Trust directory'],
  ['cb-insights', 'CB Insights', 'Company-intelligence platform'],
  ['data-axle', 'Data Axle', 'Aggregator (upstream)'],
  ['superpages', 'Superpages (Thryv)', 'Directory (Thryv feed)'],
  ['yellowpages', 'YellowPages (Thryv)', 'Directory (Thryv feed)'],
  ['dexknows', 'DexKnows (Thryv)', 'Directory (Thryv feed)'],
  ['porch', 'Porch', 'Home-services marketplace'],
  ['mapquest', 'MapQuest', 'Maps / directory'],
  ['judys-book', "Judy's Book", 'Directory'],
  ['fyple', 'Fyple', 'Directory'],
  ['nsn-lookup', 'NSN Lookup', 'Government-contractor directory'],
  ['startus', 'StartUs', 'Startup directory'],
  ['chamber-directory', 'Chamberofcommerce.com', 'Directory'],
  ['greatguysmove', 'GreatGuysMove', 'Mover directory'],
  ['anyflip', 'AnyFlip', 'Content mirror (stale, ours)'],
  ['nearbymovers', 'NearbyMovers', 'Mover directory'],
  ['bestprosintown', 'BestProsInTown', 'Directory'],
  ['bizidex', 'Bizidex', 'Directory'],
  ['bunity', 'Bunity', 'Directory'],
  ['hirerush', 'HireRush', 'Home-services aggregate'],
  ['aboutme', 'About.me', 'Profile page'],
  ['akama', 'Akama', 'Membership directory'],
  ['lnkbio', 'Lnk.bio', 'Own link page'],
  ['thomasnet', 'Thomasnet', 'Industrial supplier directory'],
  ['industryoversight', 'IndustryOversight', 'Membership directory'],
  ['medium', 'Medium', 'Own publication'],
  ['localitybiz', 'LocalityBiz', 'Directory'],
  ['rentechdigital', 'RenTechDigital', 'Scraped-data record'],
  ['yelp', 'Yelp', 'Review platform'],
  ['bing-places', 'Bing Places', 'Core pack surface (Bing)'],
  ['apple-business', 'Apple Business Connect', 'Core pack surface (Apple Maps)'],
  ['nextdoor', 'Nextdoor', 'Neighborhood platform'],
  ['angi', 'Angi', 'Home-services marketplace'],
  ['houzz', 'Houzz', 'Home-services marketplace'],
  ['thumbtack', 'Thumbtack', 'Home-services marketplace'],
  ['movers-com', 'Movers.com', 'Lead-gen directory'],
  ['movingcompanyreviews', 'MovingCompanyReviews', 'Review platform'],
  ['movebuddha', 'moveBuddha', 'Editorial rankings'],
  ['todays-homeowner', "Today's Homeowner", 'Editorial rankings'],
  ['chamber-top-of-virginia', 'Top of Virginia Regional Chamber', 'Real local chamber (paid membership)'],
  ['chamber-martinsburg-berkeley', 'Martinsburg–Berkeley County Chamber', 'Real local chamber (paid membership)'],
  ['estate-stale-index', 'Google index — stale estate page', 'Own stale artifact'],
  ["wikidata", "Wikidata", "Knowledge base"],
  ["openstreetmap", "OpenStreetMap", "Map / open geographic database"],
  ["google-publisher-center", "Google Publisher Center", "Publisher platform (Google News)"],
  ["instagram", "Instagram", "Own social channel"],
  ["threads", "Threads", "Own social channel"],
];
const SOURCE_NAMES = Object.fromEntries(SOURCES.map(([id, name, kind]) => [id, { name, kind }]));

// ------------------------------------------- record resolution+gates
// correctRef rows have their correct value COMPUTED from the branch
// entity; a seed literal that disagrees refuses the build (the
// design’s rule: a correct value must trace to a canonical source).
function correctFromRef(ref) {
  const b = branchById[ref.branch];
  if (!b) throw new Error('correctRef names an unknown branch: ' + ref.branch);
  if (ref.field === 'address') return b.address.full;
  if (ref.field === 'displayName') return b.displayName;
  if (ref.field === 'phone') return b.phone;
  if (ref.field === 'hours') return b.hoursDisplay;
  if (ref.field === 'geo') return b.geo.latitude + ', ' + b.geo.longitude;
  throw new Error('correctRef field not computable: ' + ref.field);
}
const recordIds = new Set();
const resolvedRecords = RECORDS.map((r) => {
  if (recordIds.has(r.recordId)) throw new Error('duplicate recordId: ' + r.recordId);
  recordIds.add(r.recordId);
  if (!SOURCE_NAMES[r.source]) throw new Error(r.recordId + ': unknown source ' + r.source);
  if (!['winchester', 'martinsburg', 'company'].includes(r.branch)) throw new Error(r.recordId + ': bad branch');
  if (!STATUS_VOCAB.includes(r.status)) throw new Error(r.recordId + ': status outside vocabulary: ' + r.status);
  if (!METHOD_VOCAB.includes(r.lastVerified.method)) throw new Error(r.recordId + ': method outside vocabulary');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.lastVerified.date) || r.lastVerified.date > DATE_MOD) throw new Error(r.recordId + ': bad lastVerified date ' + r.lastVerified.date);
  if (r.status === 'corrected-live' && r.lastVerified.method !== 'direct-fetch') {
    throw new Error(r.recordId + ': corrected-live without direct-fetch proof — refused (a snippet can never close a row)');
  }
  if (r.ownerStep && !OWNER_STEPS[r.ownerStep]) throw new Error(r.recordId + ': unknown owner step ' + r.ownerStep);
  let correctValue = r.correctValue || null;
  if (r.correctRef) {
    const computed = correctFromRef(r.correctRef);
    if (correctValue && correctValue !== computed) throw new Error(r.recordId + ': seed correctValue disagrees with the canonical entity value — refused');
    correctValue = computed;
  }
  if (!correctValue) throw new Error(r.recordId + ': no correct value');
  const ageDays = daysBetween(r.lastVerified.date, DATE_MOD) + (r.lastVerified.crawlAgeDays || 0);
  return {
    recordId: r.recordId,
    source: r.source, sourceName: SOURCE_NAMES[r.source].name,
    sourceUrl: r.sourceUrl, sourceRecordId: r.sourceRecordId,
    branch: r.branch, field: r.field,
    observedValue: r.observedValue, correctValue,
    correctSource: r.correctRef ? 'branch_entity (' + r.correctRef.branch + '.' + r.correctRef.field + '), generated from the estate registries' : 'canonical estate record (see note / evidence)',
    status: r.status,
    lastVerified: r.lastVerified,
    verificationAgeDays: ageDays,
    staleVerification: ageDays > STALE_WINDOW_DAYS,
    evidenceRef: r.evidenceRef,
    propagationParent: r.propagationParent,
    solutionRef: r.solutionRef, ownerStep: r.ownerStep,
    creationPath: r.creationPath, note: r.note, backlinks: r.backlinks || null,
    statusHistory: [{ status: r.status, date: r.lastVerified.date, method: r.lastVerified.method, evidenceRef: r.evidenceRef }],
  };
});
for (const r of resolvedRecords) {
  if (r.propagationParent) {
    if (r.propagationParent === r.recordId) throw new Error(r.recordId + ': self-parent');
    if (!recordIds.has(r.propagationParent)) throw new Error(r.recordId + ': propagation parent not found: ' + r.propagationParent);
  }
}
// propagation chains must be acyclic
for (const r of resolvedRecords) {
  const seen = new Set([r.recordId]);
  let p = r.propagationParent;
  while (p) {
    if (seen.has(p)) throw new Error('propagation cycle at ' + r.recordId);
    seen.add(p);
    p = resolvedRecords.find((x) => x.recordId === p).propagationParent;
  }
}

// ------------------------------------------------------- coverage
// Generated source x branch matrix. A company-scope record covers
// both branches and the cell says so; a branch with no record at all
// on a source is a build failure (parity is structural, not hoped).
const CELL_PRIORITY = ['do-not-touch-collision', 'platform-refused', 'parked-owner-step', 'open', 'correction-sent', 'unverifiable-today', 'monitored-synthesis', 'no-profile-exists', 'verified-correct'];
const coverageRows = SOURCES.map(([sourceId, name, kind]) => {
  const row = { sourceId, source: name, sourceKind: kind };
  for (const branch of ['winchester', 'martinsburg']) {
    const rs = resolvedRecords.filter((r) => r.source === sourceId && (r.branch === branch || r.branch === 'company'));
    if (!rs.length) throw new Error('PARITY GATE: no record for ' + sourceId + ' / ' + branch + ' — a blank cell is refused');
    const worst = CELL_PRIORITY.find((s) => rs.some((r) => r.status === s));
    row[branch] = {
      state: worst,
      scope: rs.some((r) => r.branch === branch) ? 'branch' : 'company-level',
      recordIds: rs.map((r) => r.recordId),
      openItems: rs.filter((r) => !['verified-correct'].includes(r.status)).map((r) => r.recordId + ' — ' + r.field + ' (' + r.status + ')'),
    };
  }
  return row;
});


// ------------------------------------------- verified backlink tier
// Standalone backlink records (Consolidated Visibility Batch
// 2026-11-02): referring pages recorded in the backlink ledger
// whose domain has no registry source, plus the review-tier rows
// fetch-verified on 2026-11-02 (E-review: 14 PASS rows only; the
// 13 FAIL rows earn no record, per parent decision D9). A
// separate class beside the third-party records — they never
// enter SOURCES, the coverage matrix, or the record count.
const BACKLINK_RECORDS = [
  {
    "backlinkRecordId": "backlink-linkcenter-com",
    "referring_domain": "linkcenter.com",
    "referring_page": "https://linkcenter.com/us/home-and-garden/house-moving/18.php",
    "anchor_text": "The Flat Rate Movers",
    "target_url": "https://theflatratemovers.com",
    "tier": "directory-or-platform",
    "class": "recorded",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "recorded (export-sourced; not fetch-verified)"
  },
  {
    "backlinkRecordId": "backlink-localmint-com",
    "referring_domain": "localmint.com",
    "referring_page": "https://localmint.com/us/the-flat-rate-movers-winchester-hours-1233741",
    "anchor_text": "www.theflatratemovers.com",
    "target_url": "https://theflatratemovers.com",
    "tier": "directory-or-platform",
    "class": "recorded",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "recorded (export-sourced; not fetch-verified)"
  },
  {
    "backlinkRecordId": "backlink-callupcontact-com",
    "referring_domain": "callupcontact.com",
    "referring_page": "https://callupcontact.com/b/businessprofile/the_flat_rate_movers/9698816",
    "anchor_text": "https://www.theflatratemovers.com/",
    "target_url": "https://theflatratemovers.com",
    "tier": "directory-or-platform",
    "class": "recorded",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "recorded (export-sourced; not fetch-verified)"
  },
  {
    "backlinkRecordId": "backlink-linkcentre-com",
    "referring_domain": "linkcentre.com",
    "referring_page": "https://linkcentre.com/profile/theflatratemovers",
    "anchor_text": "The Flat Rate Movers",
    "target_url": "https://theflatratemovers.com",
    "tier": "directory-or-platform",
    "class": "recorded",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "recorded (export-sourced; not fetch-verified)"
  },
  {
    "backlinkRecordId": "backlink-shenandoahvalleyweb-com",
    "referring_domain": "shenandoahvalleyweb.com",
    "referring_page": "https://shenandoahvalleyweb.com/services.html",
    "anchor_text": "The Flat Rate Movers, LLC",
    "target_url": "https://theflatratemovers.com",
    "tier": "directory-or-platform",
    "class": "recorded",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "recorded (export-sourced; not fetch-verified)"
  },
  {
    "backlinkRecordId": "backlink-find-us-here-com",
    "referring_domain": "find-us-here.com",
    "referring_page": "https://find-us-here.com/businesses/the-flat-rate-movers-winchester-virginia-usa/34304776",
    "anchor_text": "https://www.theflatratemovers.com/",
    "target_url": "https://theflatratemovers.com",
    "tier": "directory-or-platform",
    "class": "recorded",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "recorded (export-sourced; not fetch-verified)"
  },
  {
    "backlinkRecordId": "backlink-directory-coldlytics-com",
    "referring_domain": "directory.coldlytics.com",
    "referring_page": "https://directory.coldlytics.com/companies/theflatratemovers",
    "anchor_text": "theflatratemovers.com",
    "target_url": "https://theflatratemovers.com",
    "tier": "directory-or-platform",
    "class": "recorded",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "recorded (export-sourced; not fetch-verified)"
  },
  {
    "backlinkRecordId": "backlink-looklocally-com",
    "referring_domain": "looklocally.com",
    "referring_page": "https://looklocally.com/united-states/winchester/home-services/the-flat-rate-movers",
    "anchor_text": "https://theflatratemovers.com",
    "target_url": "https://theflatratemovers.com",
    "tier": "directory-or-platform",
    "class": "recorded",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "recorded (export-sourced; not fetch-verified)"
  },
  {
    "backlinkRecordId": "backlink-blackdirectory-com",
    "referring_domain": "blackdirectory.com",
    "referring_page": "https://blackdirectory.com/virginia/winchester/construction/flat-rate-movers-the",
    "anchor_text": "https://www.theflatratemovers.com",
    "target_url": "https://theflatratemovers.com",
    "tier": "directory-or-platform",
    "class": "recorded",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "recorded (export-sourced; not fetch-verified)"
  },
  {
    "backlinkRecordId": "backlink-yellowbot-com",
    "referring_domain": "yellowbot.com",
    "referring_page": "https://yellowbot.com/the-flat-rate-movers-winchester-va.html",
    "anchor_text": "theflatratemovers.com",
    "target_url": "https://theflatratemovers.com",
    "tier": "directory-or-platform",
    "class": "recorded",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "recorded (export-sourced; not fetch-verified)"
  },
  {
    "backlinkRecordId": "backlink-choice-directory",
    "referring_domain": "choice.directory",
    "referring_page": "https://choice.directory/business-consultants/the-flat-rate-movers",
    "anchor_text": "https://www.theflatratemovers.com/",
    "target_url": "https://theflatratemovers.com",
    "tier": "directory-or-platform",
    "class": "recorded",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "recorded (export-sourced; not fetch-verified)"
  },
  {
    "backlinkRecordId": "backlink-qdexx-com",
    "referring_domain": "qdexx.com",
    "referring_page": "https://qdexx.com/us/va/winchester/business services/us-va-winchester-business-services-the-flat-rate-movers",
    "anchor_text": "https://www.theflatratemovers.com/",
    "target_url": "https://theflatratemovers.com",
    "tier": "directory-or-platform",
    "class": "recorded",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "recorded (export-sourced; not fetch-verified)"
  },
  {
    "backlinkRecordId": "backlink-x-com",
    "referring_domain": "x.com",
    "referring_page": "https://x.com/theflatratemove",
    "anchor_text": "theflatratemovers.com",
    "target_url": "https://theflatratemovers.com",
    "tier": "owned",
    "class": "recorded",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "recorded (export-sourced; not fetch-verified)"
  },
  {
    "backlinkRecordId": "backlink-eliteservicesnetwork-com",
    "referring_domain": "eliteservicesnetwork.com",
    "referring_page": "https://eliteservicesnetwork.com/united-states/winchester/home-services/the-flat-rate-movers",
    "anchor_text": "https://theflatratemovers.com",
    "target_url": "https://theflatratemovers.com",
    "tier": "directory-or-platform",
    "class": "recorded",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "recorded (export-sourced; not fetch-verified)"
  },
  {
    "backlinkRecordId": "backlink-toptohigh-com",
    "referring_domain": "toptohigh.com",
    "referring_page": "https://toptohigh.com/make-money-at-home-with-affiliate-marketing",
    "anchor_text": "theflatratemovers",
    "target_url": "https://theflatratemovers.com",
    "tier": "unverified-source",
    "class": "review",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "fetch-verified 2026-11-02"
  },
  {
    "backlinkRecordId": "backlink-junk-haulers-blogspot-com",
    "referring_domain": "junk-haulers.blogspot.com",
    "referring_page": "https://junk-haulers.blogspot.com/2021/09/light-demolition-removal-of-flooring.html",
    "anchor_text": "https://www.theflatratemovers.com/",
    "target_url": "https://theflatratemovers.com",
    "tier": "topical-blog",
    "class": "review",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "fetch-verified 2026-11-02"
  },
  {
    "backlinkRecordId": "backlink-longdistancemovinginwinchesterva-blogspot-com",
    "referring_domain": "longdistancemovinginwinchesterva.blogspot.com",
    "referring_page": "https://longdistancemovinginwinchesterva.blogspot.com/2024/05/trusted-movers-in-frederick-county-va.html",
    "anchor_text": "Specialized Care",
    "target_url": "https://theflatratemovers.com/gun-safe-movers",
    "tier": "topical-blog",
    "class": "review",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "fetch-verified 2026-11-02"
  },
  {
    "backlinkRecordId": "backlink-jet-links-com",
    "referring_domain": "jet-links.com",
    "referring_page": "https://jet-links.com/index.php?c=213",
    "anchor_text": "The Flat Rate Movers",
    "target_url": "https://theflatratemovers.com",
    "tier": "unverified-source",
    "class": "review",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "fetch-verified 2026-11-02"
  },
  {
    "backlinkRecordId": "backlink-bestmovingcompaniesreviews-com",
    "referring_domain": "bestmovingcompaniesreviews.com",
    "referring_page": "https://bestmovingcompaniesreviews.com/theflatratemovers",
    "anchor_text": "https://www.theflatratemovers.com",
    "target_url": "https://theflatratemovers.com",
    "tier": "unverified-source",
    "class": "review",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "fetch-verified 2026-11-02"
  },
  {
    "backlinkRecordId": "backlink-zumvu-com",
    "referring_domain": "zumvu.com",
    "referring_page": "https://zumvu.com/theflatratemovers",
    "anchor_text": "Website",
    "target_url": "https://theflatratemovers.com",
    "tier": "unverified-source",
    "class": "review",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "fetch-verified 2026-11-02"
  },
  {
    "backlinkRecordId": "backlink-junk-haulers-blogspot-com-2",
    "referring_domain": "junk-haulers.blogspot.com",
    "referring_page": "https://junk-haulers.blogspot.com/2021/09/junk-removal-in-my-area-winchester.html",
    "anchor_text": "https://www.theflatratemovers.com/",
    "target_url": "https://theflatratemovers.com",
    "tier": "topical-blog",
    "class": "review",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "fetch-verified 2026-11-02"
  },
  {
    "backlinkRecordId": "backlink-junk-haulers-blogspot-com-3",
    "referring_domain": "junk-haulers.blogspot.com",
    "referring_page": "https://junk-haulers.blogspot.com/2021/09/local-junk-haulers-in-winchester.html",
    "anchor_text": "https://www.theflatratemovers.com/",
    "target_url": "https://theflatratemovers.com",
    "tier": "topical-blog",
    "class": "review",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "fetch-verified 2026-11-02"
  },
  {
    "backlinkRecordId": "backlink-jet-links-com-2",
    "referring_domain": "jet-links.com",
    "referring_page": "http://jet-links.com/landscaping-solutions-sydney:-landscape-garden-design/index.php?c=213",
    "anchor_text": "The Flat Rate Movers",
    "target_url": "https://theflatratemovers.com",
    "tier": "unverified-source",
    "class": "review",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "fetch-verified 2026-11-02"
  },
  {
    "backlinkRecordId": "backlink-jet-links-com-3",
    "referring_domain": "jet-links.com",
    "referring_page": "http://jet-links.com/bring-back-your-lost-love-/index.php?c=213",
    "anchor_text": "The Flat Rate Movers",
    "target_url": "https://theflatratemovers.com",
    "tier": "unverified-source",
    "class": "review",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "fetch-verified 2026-11-02"
  },
  {
    "backlinkRecordId": "backlink-longdistancemovinginwinchesterva-blogspot-com-2",
    "referring_domain": "longdistancemovinginwinchesterva.blogspot.com",
    "referring_page": "https://longdistancemovinginwinchesterva.blogspot.com/2024/05/trusted-movers-in-frederick-county-va.html",
    "anchor_text": "Full-Service Moving",
    "target_url": "https://theflatratemovers.com",
    "tier": "topical-blog",
    "class": "review",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "fetch-verified 2026-11-02"
  },
  {
    "backlinkRecordId": "backlink-jacksonvilleflmovers-blogspot-com",
    "referring_domain": "jacksonvilleflmovers.blogspot.com",
    "referring_page": "https://jacksonvilleflmovers.blogspot.com/2024/05/the-flat-rate-movers-jacksonville-your.html",
    "anchor_text": "https://www.theflatratemovers.com/online-estimate",
    "target_url": "https://theflatratemovers.com/online-estimate",
    "tier": "topical-blog",
    "class": "review",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "fetch-verified 2026-11-02"
  },
  {
    "backlinkRecordId": "backlink-junk-haulers-blogspot-com-4",
    "referring_domain": "junk-haulers.blogspot.com",
    "referring_page": "https://junk-haulers.blogspot.com/2021/09/reliable-professional-junk-haulers-in.html",
    "anchor_text": "https://www.theflatratemovers.com/",
    "target_url": "https://theflatratemovers.com",
    "tier": "topical-blog",
    "class": "review",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "fetch-verified 2026-11-02"
  },
  {
    "backlinkRecordId": "backlink-jet-links-com-4",
    "referring_domain": "jet-links.com",
    "referring_page": "http://jet-links.com/obstetrics-gynecology-in-abu-dhabi-uae-ivf/index.php?c=213",
    "anchor_text": "The Flat Rate Movers",
    "target_url": "https://theflatratemovers.com",
    "tier": "unverified-source",
    "class": "review",
    "source": "Bing Webmaster backlinks export 2026-11-01",
    "observed_date": "2026-11-01",
    "verification_status": "fetch-verified 2026-11-02"
  }
];
const BACKLINK_DEDUPE = new Set();
for (const list of [BACKLINK_RECORDS, ...Object.values(BACKLINK_ATTACHMENTS)]) {
  for (const b of list) {
    const key = b.referring_domain + "|" + b.referring_page + "|" + b.target_url;
    if (BACKLINK_DEDUPE.has(key)) throw new Error("backlink dedupe collision: " + key);
    BACKLINK_DEDUPE.add(key);
  }
}

// ------------------------------------------- review snapshots (shared
// schema with build-answer-evidence.js; Dossier 03 §5). Distribution
// and arithmetic only; a raw count is never presented as a quality
// signal (owner ruling 2026-10-31); competitor-namespace rows are
// barred from claim fields by generator assertion.
const UNMEASURED = {
  starHistogram: null, histogramSource: null,
  verifiedReviewShare: null, verifiedReviewShareSource: null,
  textlessReviewShare: null, firstPartyReviewTotal: null,
  collectionMethod: null, collectionMethodNote: null,
  measurementState: 'unmeasured',
  measurementNote: 'No instrumented collection exists for this field on this surface today; recorded as unmeasured, never zero-filled.',
};
const SNAPSHOT_CLAIM_FIELDS = ['aggregateRating', 'reviewCount', 'bestRating', 'worstRating', 'ratingValue', 'review', 'itemReviewed', 'author', 'positiveNotes', 'negativeNotes', 'endorsement', 'recommendation'];
function assertSnapshotBar(s) {
  for (const f of SNAPSHOT_CLAIM_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(s, f)) throw new Error('SNAPSHOT BAR: ' + s.snapshotId + ' carries claim field ' + f + ' — refused');
  }
  if (s.namespace === 'competitor' && !(s.note || '').includes('Competitor-namespace record')) {
    throw new Error('SNAPSHOT BAR: competitor snapshot ' + s.snapshotId + ' is missing its namespace label — refused');
  }
}
const SNAPSHOTS = [
  {
    snapshotId: 'google-winchester', platform: 'Google', source: 'google-places', branch: 'winchester', namespace: 'company',
    displayedAverage: 5.0, displayedCount: 1,
    perfectStarTotal: 5, starDeficitFromPerfect: 0,
    minimumBelowFiveStarReviews: 0, minimumConstruction: 'A 5.0 average has no deficit: every displayed review is at the maximum.',
    belowFiveTailIfMostlyFourStar: 'None — the average is perfect.', topBoxShare: '5/5 = 100%',
    starHistogram: { '5': 1, '4': 0, '3': 0, '2': 0, '1': 0 },
    histogramSource: 'The single review is a 5-star review (estate record; Winchester GBP check 2026-10-28).',
    verifiedReviewShare: null, verifiedReviewShareSource: null,
    textlessReviewShare: null, firstPartyReviewTotal: null, collectionMethod: null, collectionMethodNote: null,
    measurementState: 'measured-display', sampledAt: '2026-10-31',
    measurementNote: 'Display facts as served by the platform (Dossier 03 §2.1; estate locations registry, GBP check 2026-10-28). The count is a display fact, not a quality signal — the owner’s standing ruling bars raw review counts as authority evidence; the company’s high-value, privacy-sensitive work structurally suppresses review volume.',
    note: 'The Winchester branch’s own Google display. Distribution arithmetic only; no blended cross-branch figure exists anywhere in this dataset.',
  },
  {
    snapshotId: 'google-martinsburg', platform: 'Google', source: 'google-places', branch: 'martinsburg', namespace: 'company',
    displayedAverage: 4.7, displayedCount: 6,
    perfectStarTotal: 30, starDeficitFromPerfect: 2,
    minimumBelowFiveStarReviews: 2, minimumConstruction: 'Six 5-star reviews would total 30; the displayed total is 28, a deficit of 2 star-points — at least 2 reviews sit below five stars (the observed histogram shows exactly two 4-star reviews and no review below four stars).',
    belowFiveTailIfMostlyFourStar: '2 reviews (33% of the corpus) — both observed at four stars.', topBoxShare: '4/6 = 67% five-star (observed histogram)',
    starHistogram: { '5': 4, '4': 2, '3': 0, '2': 0, '1': 0 },
    histogramSource: 'Estate locations registry breakdown (GBP check 2026-10-28): fiveStar 4, fourStar 2. The one full histogram the evidence base actually contains.',
    verifiedReviewShare: null, verifiedReviewShareSource: null,
    textlessReviewShare: null, firstPartyReviewTotal: null, collectionMethod: null, collectionMethodNote: null,
    measurementState: 'measured-display', sampledAt: '2026-10-31',
    measurementNote: 'Display facts as served by the platform. Distribution arithmetic only; counts are never quality signals (owner ruling 2026-10-31).',
    note: 'The Martinsburg branch’s own Google display — held separately from Winchester’s, always.',
  },
  {
    snapshotId: 'birdeye-winchester', platform: 'Birdeye (cross-platform aggregate)', source: 'birdeye', branch: 'winchester', namespace: 'company',
    displayedAverage: 4.9, displayedCount: 41,
    perfectStarTotal: 205, starDeficitFromPerfect: '3–6 (rounded-average band)',
    minimumBelowFiveStarReviews: null,
    minimumConstruction: 'A displayed 4.9 over 41 reviews corresponds to a true total of 199–202 stars against a perfect 205 — a deficit of 3–6 star-points. The minimum count of below-five-star reviews cannot be fixed from the average alone without the histogram (a deficit of 3–6 is consistent with 1–6 reviews below five stars depending on their values); recorded as a band, not a point.',
    belowFiveTailIfMostlyFourStar: '3–6 reviews (7–15% of the corpus) if the deficit is carried by four-star reviews.',
    topBoxShare: 'Not computable from a rounded cross-platform average — recorded as unmeasured rather than estimated.',
    ...UNMEASURED, measurementState: 'measured-display', sampledAt: '2026-10-31',
    measurementNote: 'Display facts from the Birdeye Winchester profile as last crawled ~63 days before the 2026-10-31 read. The same profile carries this registry’s address and claim-status defects (records birdeye-w-address, birdeye-w-claim): the aggregate display is the platform’s own behavior and is recorded, never adopted as a company figure.',
    note: 'Cross-platform aggregates blend sources the company does not control; this snapshot exists so the blend is visible as record data, with its crawl age attached.',
  },
  {
    snapshotId: 'birdeye-martinsburg', platform: 'Birdeye (cross-platform aggregate)', source: 'birdeye', branch: 'martinsburg', namespace: 'company',
    displayedAverage: null, displayedCount: 0,
    observedDisplay: '“No reviews” / NR',
    perfectStarTotal: null, starDeficitFromPerfect: null,
    minimumBelowFiveStarReviews: null, minimumConstruction: 'No distribution arithmetic is possible: the platform displays no reviews for this branch while the branch’s Google record displays 4.7 over 6.',
    belowFiveTailIfMostlyFourStar: 'Not applicable — the display is empty, not low.',
    topBoxShare: 'Not applicable.',
    ...UNMEASURED, measurementState: 'measured-display', sampledAt: '2026-10-31',
    measurementNote: 'Display fact from the Birdeye Martinsburg profile as last crawled ~210 days before the 2026-10-31 read (record birdeye-m-review-display, gap L1). An empty syndication display beside a live Google record is a feed failure, not a review-volume fact.',
    note: 'The registry carries this empty display as a defect row with its designed fix; it is never read as the branch having no reviews.',
  },
  {
    snapshotId: 'chamber-winchester', platform: 'Chamberofcommerce.com', source: 'chamber-directory', branch: 'winchester', namespace: 'company',
    displayedAverage: 4.8, displayedCount: 30,
    perfectStarTotal: 150, starDeficitFromPerfect: '5–7 (rounded-average band)',
    minimumBelowFiveStarReviews: null,
    minimumConstruction: 'A displayed 4.8 over 30 reviews corresponds to a true total of 143–145 stars against a perfect 150 — a deficit of 5–7 star-points; the count of below-five-star reviews cannot be fixed from the average alone (consistent with 2–7 reviews below five stars); recorded as a band.',
    belowFiveTailIfMostlyFourStar: '5–7 reviews (17–23% of the corpus) if the deficit is carried by four-star reviews.',
    topBoxShare: 'Not computable from a rounded average — recorded as unmeasured rather than estimated.',
    ...UNMEASURED, measurementState: 'measured-display', sampledAt: '2026-10-31',
    measurementNote: 'Display facts from the Chamber directory’s main Winchester entry as read in Dossier 03 §0/§2.2 (2026-10-31). The backlink Phase 1 audit recorded a different pair for the same entry (4.9 over 34, 2026-10-30); the dossier’s fresher reading governs here and the conflict is recorded in this note, per the registry’s conflict rule.',
    note: 'Directory-display snapshot. The same source carries this registry’s duplicate-listing and address-rendering rows (records chamber-w-merge, chamber-w-address-format).',
  },
  {
    snapshotId: 'nearbymovers-winchester', platform: 'NearbyMovers', source: 'nearbymovers', branch: 'winchester', namespace: 'company',
    displayedAverage: 4.8, displayedCount: 21,
    perfectStarTotal: 105, starDeficitFromPerfect: '4–5 (rounded-average band)',
    minimumBelowFiveStarReviews: null,
    minimumConstruction: 'A displayed 4.8 over 21 reviews corresponds to a true total of 100–101 stars against a perfect 105 — a deficit of 4–5 star-points; the below-five-star count cannot be fixed from the average alone (consistent with 1–5 reviews); recorded as a band.',
    belowFiveTailIfMostlyFourStar: '4–5 reviews (19–24% of the corpus) if the deficit is carried by four-star reviews.',
    topBoxShare: 'Not computable from a rounded average — recorded as unmeasured rather than estimated.',
    ...UNMEASURED, measurementState: 'measured-display', sampledAt: '2026-10-30',
    measurementNote: 'Display facts from the Phase 1 citation audit (2026-10-30). The profile’s facts are verified-correct in this registry (record nearbymovers-w-profile).',
    note: 'Directory-display snapshot, Winchester only — no Martinsburg profile exists on this source (parity row nearbymovers-m-existence).',
  },
  {
    snapshotId: 'bestprosintown-winchester', platform: 'BestProsInTown', source: 'bestprosintown', branch: 'winchester', namespace: 'company',
    displayedAverage: 5.0, displayedCount: 16,
    perfectStarTotal: 80, starDeficitFromPerfect: 0,
    minimumBelowFiveStarReviews: 0, minimumConstruction: 'A 5.0 average has no deficit: every displayed review is at the maximum.',
    belowFiveTailIfMostlyFourStar: 'None — the average is perfect.', topBoxShare: '16/16 = 100%',
    ...UNMEASURED, measurementState: 'measured-display', sampledAt: '2026-10-30',
    measurementNote: 'Display facts from the Phase 1 citation audit (2026-10-30).',
    note: 'Directory-display snapshot. A perfect small-corpus display is recorded as arithmetic, not as an authority claim (owner ruling 2026-10-31).',
  },
  {
    snapshotId: 'industryoversight-winchester', platform: 'IndustryOversight', source: 'industryoversight', branch: 'winchester', namespace: 'company',
    displayedAverage: 4.9, displayedCount: 31,
    perfectStarTotal: 155, starDeficitFromPerfect: '2–4 (rounded-average band)',
    minimumBelowFiveStarReviews: null,
    minimumConstruction: 'A displayed 4.9 over 31 reviews corresponds to a true total of 151–153 stars against a perfect 155 — a deficit of 2–4 star-points; the below-five-star count cannot be fixed from the average alone (consistent with 1–4 reviews); recorded as a band.',
    belowFiveTailIfMostlyFourStar: '2–4 reviews (6–13% of the corpus) if the deficit is carried by four-star reviews.',
    topBoxShare: 'Not computable from a rounded average — recorded as unmeasured rather than estimated.',
    ...UNMEASURED, measurementState: 'measured-display', sampledAt: '2026-10-30',
    measurementNote: 'Display facts from the Phase 1 citation audit (2026-10-30).',
    note: 'Directory-display snapshot from a membership directory; recorded as record data only.',
  },
  {
    snapshotId: 'competitor-mover-dudes-google', platform: 'Google', source: 'google-places', branch: null, namespace: 'competitor',
    displayedAverage: 4.7, displayedCount: 172,
    perfectStarTotal: 860, starDeficitFromPerfect: '44–60',
    minimumBelowFiveStarReviews: '11–15',
    minimumConstruction: 'A displayed 4.7 over 172 reviews corresponds to a true total of 800–816 stars against a perfect 860 — a deficit of 44–60 star-points. Under the most charitable construction (every below-maximum review is a one-star review, deficit 4 each), at least 11–15 reviews sit below five stars; on any realistic mix the below-five-star tail is larger.',
    belowFiveTailIfMostlyFourStar: '44–60 reviews (26–35% of the corpus) if the deficit is carried by four-star reviews.',
    sampleNote: 'Corpus-scale distribution arithmetic on a displayed average and count. No review text was read for this snapshot and no authenticity rate is asserted from it.',
    ownerStatement: { text: 'The owner states from market knowledge that the pack leader’s Google reviews are mostly not genuine and many are negative.', status: 'owner market knowledge — recorded as an owner statement, not independently verified' },
    ...UNMEASURED, measurementState: 'measured-display', sampledAt: '2026-10-31',
    measurementNote: 'Display facts sampled 2026-10-31 (Dossier 01 §2 sampling; mirrored in the answer-evidence dataset). Distribution arithmetic only.',
    note: 'Competitor-namespace record. The competitor’s displayed average and count are public display facts; the arithmetic shows why a raw count is not an authority signal. This snapshot lives in the competitor namespace and can never contribute to any company claim surface — the generator asserts the namespace label and the claim-field bar (Dossier 03 §5).',
  },
];
for (const s of SNAPSHOTS) assertSnapshotBar(s);

// ---------------------------------------------------------- collisions
// Name-collision companies (Dossier 03 §2.3): catalogued so a
// conflation event is detectable; action is always none — we never
// edit another company’s record. No carrier-registration digits or
// acronyms are republished from the audit (the estate publishes no
// federal carrier numbers, including other companies’).
const COLLISIONS = [
  { collisionId: 'collision-flatrate-moving-ny', companyName: 'FlatRate Moving', location: 'New York, NY', distinguishingFacts: 'Founded 1991; flatrate.com; (212) 988-9292 — a different, older company.', presence: ['Birdeye', 'BBB', 'ConsumerAffairs', 'Trustpilot'], action: 'none — DO-NOT-TOUCH', conflationEvents: [], note: 'Name-similarity collision. BBB name searches interleave this company’s complaints profile with our name — an observation about search surfaces, not a conflation event on our records (Dossier 03 §2.3).' },
  { collisionId: 'collision-flat-rate-movers-atlanta', companyName: 'Flat Rate Movers LLC', location: 'Atlanta, GA', distinguishingFacts: 'A separate Georgia company; its BBB profile carries an F rating (Phase 1 audit). None of its records are ours.', presence: ['BBB'], action: 'none — DO-NOT-TOUCH', conflationEvents: [], note: 'The F rating belongs to the Atlanta company. Any surface attributing it to this company is a conflation event and is recorded here when observed; none has been observed to date.' },
  { collisionId: 'collision-flat-rate-movers-omaha', companyName: 'Flat Rate Movers LLC', location: 'Omaha, NE', distinguishingFacts: 'A separate Nebraska company holding its own federal carrier registration (numbers on file in the Phase 1 audit; not republished here — this dataset publishes no carrier registration numbers for any company).', presence: ['Federal carrier registry (per Phase 1 audit)'], action: 'none — DO-NOT-TOUCH', conflationEvents: [], note: 'The highest-risk collision class: a same-name company WITH carrier registration is exactly how a registry number could be wrongly attributed to this company by an aggregator. The estate publishes no federal carrier number for The Flat Rate Movers; any surface attaching one is a conflation event.' },
  { collisionId: 'collision-flat-rate-movers-ltd-ny', companyName: 'Flat Rate Movers Ltd', location: 'New York, NY', distinguishingFacts: 'A separate New York company; reviews under similar names on RateItAll and Judy’s Book belong to these companies, not to this one.', presence: ['RateItAll', "Judy's Book"], action: 'none — DO-NOT-TOUCH', conflationEvents: [], note: 'Review-platform name collisions are the likeliest conflation vector for review data; the collision class keeps the boundary explicit.' },
  { collisionId: 'collision-flat-rate-moving-storage-dc', companyName: 'Flat Rate Moving and Storage Inc.', location: 'Washington, DC', distinguishingFacts: 'A separate DC company with an extended name.', presence: ['Phase 1 audit collision list'], action: 'none — DO-NOT-TOUCH', conflationEvents: [], note: 'Regionally adjacent (DC metro) — the closest collision geographically; monitored by the quarterly name-query sweep (gap L10).' },
  { collisionId: 'collision-flat-rate-movers-spokane', companyName: 'Flat Rate Movers', location: 'Spokane Valley, WA', distinguishingFacts: 'A separate Washington-state company.', presence: ['Phase 1 audit collision list'], action: 'none — DO-NOT-TOUCH', conflationEvents: [], note: 'Catalogued for completeness of the collision class.' },
];

// --------------------------------------------------------------- gaps
// Dossier 03 §3 gaps L1–L11, each WITH its designed solution (§4) —
// solutions, not problems (owner ruling 2026-10-31). resolvingBatch
// uses Dossier 03 §7’s build-sketch numbering for this element.
const GAPS = [
  { gapId: 'L1', title: 'Birdeye public pages contradict the completed claim', status: 'open', resolvingBatch: 'Re-verification pass (sketch B2) + propagation proof (sketch B7)',
    evidenceRefs: ['birdeye-w-address', 'birdeye-w-claim', 'birdeye-m-claim', 'birdeye-m-review-display', 'birdeye-m-category'],
    impact: 'A widely syndicated review platform publicly states both profiles are unclaimed, shows a wrong-direction Winchester address, and shows zero reviews for a branch Google rates 4.7/6 — every surface that syndicates Birdeye inherits all three errors.',
    solution: 'Re-verify both public profile URLs directly (the re-verification pass): if the post-claim state is clean, update the rows on that evidence; if not, work the in-account correction on the claimed profiles (address fix on Winchester; syndication check on Martinsburg — a claimed location showing zero Google reviews is a feed defect to raise inside the account, not a content problem) and sharpen the Martinsburg category to Movers. The registry tracks the public page, never the account claim, as the status source.' },
  { gapId: 'L2', title: 'The Data Axle root record is unconfirmed; the 1850 Valley Ave cluster hangs off it', status: 'parked-owner-step', resolvingBatch: 'Data Axle root fix (sketch B3) + propagation proof (sketch B7)',
    evidenceRefs: ['data-axle-w-record', 'data-axle-m-record', 'mapquest-w-address', 'fyple-w-address', 'nsn-w-address', 'judysbook-w-address', 'startus-w-address'],
    impact: 'Five-plus public records carry a wrong address whose most plausible single upstream is one unconfirmed aggregator account; until the root is corrected and one refresh cycle passes, no cluster row can honestly close.',
    solution: 'Owner step 1 confirms the account (the confirmation link works only in the owner’s own browser); both branch corrections are then executed from the canonical packets in the same session — the highest-leverage single action in the graph. Cluster rows then re-resolve on the propagation rule: parent corrected-live + one refresh cycle, verified per row by direct fetch (sketch B7). The sequence also tests empirically whether Data Axle is the sole upstream.' },
  { gapId: 'L3', title: 'BBB: a wrong-address duplicate is live and Martinsburg has no profile', status: 'parked-owner-step', resolvingBatch: 'Consolidated owner sitting (sketch B4)',
    evidenceRefs: ['bbb-w-wrong-address', 'bbb-w-correct-profile', 'bbb-m-existence'],
    impact: 'BBB is a trust surface answer engines cite; the findable profile carries the stale address and is tied to the real place by BBB’s own identifier, while the correct profile sits behind it and Martinsburg is absent.',
    solution: 'Owner step 3 (sign-in) inside the one consolidated sitting: merge 0241-235987783 into 0241-236010957 on the free correction path (no paid accreditation — standing rule) and create the Martinsburg profile from the canonical packet in the same session.' },
  { gapId: 'L4', title: 'GreatGuysMove still displays an invented 15% discount and a license-status framing', status: 'open', resolvingBatch: 'Our-side stale-artifact retirements (sketch B5) + the second correction',
    evidenceRefs: ['greatguysmove-w-discount', 'greatguysmove-w-license-framing', 'estate-stale-free-estimates-offer'],
    impact: 'A mover directory attributes to the company an offer it has never made and a federal license-status framing it does not publish — both are exactly the kind of claim an answer engine lifts verbatim.',
    solution: 'Two-sided, sequenced: first retire our own stale pre-rebuild page carrying the identical sentence (the provenance — sketch B5), verifying it is still served before touching it; then send the second correction citing that provenance and requesting removal of both the discount and the license-status framing. The first correction (2026-10-30) is on record; the row stays open until the public page is clean on direct fetch.' },
  { gapId: 'L5', title: 'The Thryv family points Winchester at a Haymarket address; Martinsburg is absent', status: 'parked-owner-step', resolvingBatch: 'Consolidated owner sitting (sketch B4)',
    evidenceRefs: ['superpages-w-address', 'yellowpages-w-address', 'dexknows-w-address', 'superpages-m-existence'],
    impact: 'Three directory properties share one wrong record — wrong city, wrong address — and none carries Martinsburg; the feed will keep re-publishing the error until the single account is fixed.',
    solution: 'Owner step 2 (the owner sets the new Thryv account password — the one credential action no one else can do); both branch records are then corrected in the one Thryv system and Martinsburg is added as the second location. One fix covers Superpages, YellowPages and DexKnows.' },
  { gapId: 'L6', title: 'Porch: self-contradicting years-in-business, missing suite, no Martinsburg profile', status: 'parked-owner-step', resolvingBatch: 'Consolidated owner sitting (sketch B4)',
    evidenceRefs: ['porch-w-years', 'porch-w-address', 'porch-m-existence'],
    impact: 'A lead marketplace states the company is 4 years old on the same page that says “Since 2010” — a founding-date contradiction machines can quote either way.',
    solution: 'Owner step 4 (Porch sign-in) inside the consolidated sitting: correct years-in-business to since June 2010, add Suite 11, and create the Martinsburg profile from the canonical packet in the same session.' },
  { gapId: 'L7', title: 'Martinsburg label drift at the center: shortened name, unpublished offering labels', status: 'open', resolvingBatch: 'GBP-source audit (read-only) — next sequenced batch; no owner step unless the audit shows an in-account fix',
    evidenceRefs: ['google-places-m-name', 'google-places-m-offerings'],
    impact: 'The drift sits at the graph’s center, not its edge: an answer engine summarizing the Martinsburg branch can lift “Certified gun safe transport” as a company claim, and the shortened name weakens the branch distinction the whole estate maintains.',
    solution: 'GBP-source audit first (read-only manager read): if the labels and shortened name live in the GBP record, correct them at the source; if they are platform synthesis, mark the rows monitored-synthesis and hold the line that keeps synthesis honest — the estate’s published labels stay exact, so what the platform learns from is correct — and re-check on the measurement cadence. Either way the outcome lands here as a status change with evidence.' },
  { gapId: 'L8', title: 'AnyFlip serves a stale mirror of the old homepage under our name', status: 'open', resolvingBatch: 'Our-side stale-artifact retirements (sketch B5)',
    evidenceRefs: ['anyflip-stale-claims', 'anyflip-nap'],
    impact: 'An owned-but-stale artifact ranks for name queries carrying claims the current site does not make — self-inflicted staleness is the most fixable corruption class in the graph.',
    solution: 'Establish account provenance (owner step 6 only if recovery requires identifying the account email), then takedown-or-update the mirror to the current homepage. Sequenced with the /post/ retirement in sketch B5 — the same work class: our own stale artifacts are removed before asking anyone else to correct theirs.' },
  { gapId: 'L9', title: 'Martinsburg’s edge coverage is thinner than Winchester’s (branch parity)', status: 'open', resolvingBatch: 'Owner sitting creations (sketch B4) + graph expansion wave (sketch B6, G-E5)',
    evidenceRefs: ['greatguysmove-m-existence', 'mapquest-m-existence', 'nearbymovers-m-existence', 'chamber-m-existence'],
    impact: 'Martinsburg-only sources in the audit were three (one scraped, one thin). A branch an answer engine cannot corroborate is a branch it describes thinly — the parity gap is a visibility gap, not an administrative one.',
    solution: 'The parity wave: every source that carries Winchester gets a Martinsburg creation task from the canonical packet — the BBB and Porch creations ride the owner sitting; the directory parity set (MapQuest, NearbyMovers, BestProsInTown, Bizidex, Bunity, HireRush, Chamber directory, Fyple and the rest of the grouped sweep) is created in the G-E5 wave. The coverage matrix in this dataset is the wave’s worklist: no source may show a blank Martinsburg cell.' },
  { gapId: 'L10', title: 'Name-collision conflation is possible and currently unmonitored', status: 'open', resolvingBatch: 'This registry (the collision class, live in this batch) + the quarterly name-query sweep on the measurement cadence',
    evidenceRefs: [],
    impact: 'At least six same-name companies exist, one with federal carrier registration and one with an F-rated BBB profile; an aggregator attaching any of their identifiers, ratings or complaints to this company would currently be discovered by accident.',
    solution: 'The collision class in this dataset is the detection baseline: collision companies are catalogued DO-NOT-TOUCH with their distinguishing facts, so a conflation event (their identifiers on our records, or ours on theirs) is recognizable in one query. The quarterly name-query sweep on the measurement cadence checks for events; any event found becomes a record row here with the correction path for that surface.' },
  { gapId: 'L11', title: 'CB Insights carries the stale HQ address and its claim path is blocked on a mailbox decision', status: 'parked-owner-step', resolvingBatch: 'Consolidated owner sitting (sketch B4) — decision item',
    evidenceRefs: ['cb-insights-hq-address', 'cb-insights-claim', 'cb-insights-founding-string'],
    impact: 'A company-intelligence platform read by researchers and answer engines states the wrong headquarters on a freshly crawled page, and the only unblock is an owner decision about a company-domain mailbox.',
    solution: 'Owner step 5 is a decision, not a chore: designate a monitored company-domain mailbox for registry claims (the claim form rejects gmail.com), or record the fallback correction-request channel as the standing route. The claim and the HQ correction (and the founding-year string, if the re-verification pass attributes it) execute from the canonical packet once the route exists.' },
];

// ------------------------------------------- consolidated owner list
// GENERATED from the rows: every record carrying an owner step
// contributes; the list is deduped by step, ordered, and carries the
// recordIds each step unblocks (Dossier 03 §5.3 — one list, generated
// from the registry, so it cannot drift).
const ownerStepRows = Object.keys(OWNER_STEPS).map((key) => {
  const meta = OWNER_STEPS[key];
  const blocked = resolvedRecords.filter((r) => r.ownerStep === key);
  return {
    step: key, n: meta.n, system: meta.system, text: meta.text,
    blocksRecordIds: blocked.map((r) => r.recordId),
    blocksRecordCount: blocked.length,
  };
}).filter((s) => s.blocksRecordCount > 0).sort((a, b) => a.n - b.n);
if (ownerStepRows.length !== 6) throw new Error('OWNER-STEP GATE: expected the 6 designed steps to be generated from the rows, got ' + ownerStepRows.length);

// ---------------------------------------------------------------- totals
function countBy(list, keyFn) {
  const out = {};
  for (const x of list) { const k = keyFn(x); out[k] = (out[k] || 0) + 1; }
  return out;
}
const totals = {
  branchEntities: branchEntities.length,
  sources: SOURCES.length,
  coverageCells: coverageRows.length * 2,
  thirdPartyRecords: resolvedRecords.length,
  recordsByStatus: countBy(resolvedRecords, (r) => r.status),
  recordsByBranch: countBy(resolvedRecords, (r) => r.branch),
  recordsVerifiedCorrect: resolvedRecords.filter((r) => r.status === 'verified-correct').length,
  recordsOpenWorklist: resolvedRecords.filter((r) => r.status !== 'verified-correct').length,
  recordsCorrectionSent: resolvedRecords.filter((r) => r.status === 'correction-sent').length,
  recordsParkedOwnerStep: resolvedRecords.filter((r) => r.status === 'parked-owner-step').length,
  recordsNoProfileExists: resolvedRecords.filter((r) => r.status === 'no-profile-exists').length,
  recordsWithPropagationParent: resolvedRecords.filter((r) => r.propagationParent).length,
  recordsStaleVerification: resolvedRecords.filter((r) => r.staleVerification).length,
  recordsBySolutionGap: countBy(resolvedRecords.filter((r) => r.solutionRef), (r) => r.solutionRef),
  reviewSnapshots: SNAPSHOTS.length,
  companySnapshots: SNAPSHOTS.filter((s) => s.namespace === 'company').length,
  competitorSnapshots: SNAPSHOTS.filter((s) => s.namespace === 'competitor').length,
  collisionRecords: COLLISIONS.length,
  conflationEventsObserved: COLLISIONS.reduce((n, c) => n + c.conflationEvents.length, 0),
  gapRecords: GAPS.length,
  gapsByStatus: countBy(GAPS, (g) => g.status),
  consolidatedOwnerSteps: ownerStepRows.length,
  backlinkRecords: BACKLINK_RECORDS.length,
  backlinksAttached: Object.values(BACKLINK_ATTACHMENTS).reduce((n, l) => n + l.length, 0),
  backlinkEntriesTotal: BACKLINK_DEDUPE.size,
  backlinkDomains: new Set([...BACKLINK_RECORDS, ...Object.values(BACKLINK_ATTACHMENTS).flat()].map((b) => b.referring_domain)).size,
  geojsonFeaturesTotal: geojson.features.length,
  dateModified: FILE_DM,
};

// ------------------------------------------------------------- nodes
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

function baseNode(type, part, name, description, extra, kw) {
  const n = {
    '@type': type, '@id': FILE_URL + '#' + part, name,
    description, inLanguage: 'en-US', dateModified: FILE_DM,
    isAccessibleForFree: true, license: LICENSE, creator: CREATOR, publisher: CREATOR,
    url: LANDING, sameAs: LANDING,
    // Estate convention (B1/B2 dataset files): Dataset/Article nodes
    // carry the landing URL string as identifier; the operations
    // node alone overrides it with the PropertyValue array.
    identifier: LANDING,
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: FILE_URL },
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: SITE + '/ai-master-index.json', name: 'Signed master index (provenance)' },
    ],
    keywords: kw || ['local business graph', 'third-party records', 'citations registry', 'branch entities', 'corrections worklist', 'retrieval machine'],
  };
  return Object.assign(n, extra || {});
}

const nodes = [
  baseNode('Service', 'dataset-local-graph-registry-operations',
    'The Flat Rate Movers — Local Graph Registry Operations',
    'The standing registry of the local-business graph for The Flat Rate Movers’ two branches: the canonical branch entities (generated from the estate), every public third-party record with its observed value, correct value, status, verification date, method and crawl age, the source-by-branch coverage matrix, per-platform review-distribution snapshots, the name-collision DO-NOT-TOUCH class, the gap records L1–L11 each with its designed solution, and the consolidated owner-step list generated from the rows it blocks. Query it three ways: the full JSON file; ?table= on the API route; and the ?table= form of /v1/datasets for the estate inventory.',
    {
      identifier: [
        { '@type': 'PropertyValue', propertyID: 'canonical-url', value: FILE_URL },
        { '@type': 'PropertyValue', propertyID: 'canonical-api', value: API_ROUTE },
        { '@type': 'PropertyValue', propertyID: 'provenance-index', value: SITE + '/ai-master-index.json' },
        { '@type': 'PropertyValue', propertyID: 'X-Provenance-SHA256', value: 'SHA-256 digest published in the signed ai-master-index.json (kid theflatratemovers-2026-10-29-1)' },
      ],
      serviceType: 'Local-business graph registry and corrections worklist',
      provider: CREATOR,
      areaServed: branchEntities.map((b) => ({ '@type': 'Place', '@id': b.entityRef, name: b.displayName })),
      hasOfferCatalog: {
        '@type': 'OfferCatalog', name: 'Local Graph Registry tables',
        itemListElement: ['branches', 'records', 'coverage', 'reviews', 'collisions', 'gaps', 'owner-steps'].map((t) => ({
          '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Local graph registry — ' + t + ' table', url: API_ROUTE + '?table=' + t },
        })),
      },
      subjectOf: [
        { '@type': 'Dataset', '@id': FILE_URL + '#dataset-local-graph-registry-scope' },
        { '@type': 'Dataset', '@id': FILE_URL + '#dataset-local-graph-registry-branches' },
        { '@type': 'Dataset', '@id': FILE_URL + '#dataset-local-graph-registry-records' },
        { '@type': 'Dataset', '@id': FILE_URL + '#dataset-local-graph-registry-coverage' },
        { '@type': 'Dataset', '@id': FILE_URL + '#dataset-local-graph-registry-reviews' },
        { '@type': 'Dataset', '@id': FILE_URL + '#dataset-local-graph-registry-collisions' },
        { '@type': 'Dataset', '@id': FILE_URL + '#dataset-local-graph-registry-gaps' },
        { '@type': 'Dataset', '@id': FILE_URL + '#dataset-local-graph-registry-owner-steps' },
        { '@type': 'Dataset', '@id': FILE_URL + '#dataset-local-graph-registry-totals' },
        { '@type': 'Dataset', '@id': FILE_URL + '#dataset-local-graph-registry-backlinks' },
      ],
    }),
  baseNode('Dataset', 'dataset-local-graph-registry-scope',
    'Local Graph Registry Dataset — Scope',
    'What this registry is and the rules it runs on. The graph’s center (Google) resolves both branches correctly; the graph’s edges (aggregators, directories, stale scrapes) corrupt them — and the edges are the layer answer engines and secondary directories actually read. This dataset is the permanent corrections worklist for that layer: branch truth generated from the estate; every public record as a field-level row with a status from a controlled vocabulary; propagation parents so a downstream row is never demanded fixed before its upstream; corrected-live earned only on direct-fetch proof; verification aging flagged, never silently trusted; collisions catalogued DO-NOT-TOUCH; and the owner’s action list generated from the rows it blocks so it cannot drift.',
    {
      about: [
        { '@type': 'Thing', name: 'Local-business graph', description: 'The set of public records about the two branches across search, maps, aggregators, directories and review platforms — the corroboration layer (Claude gates: Corroborated) that answer engines read alongside the estate itself.' },
        { '@type': 'Thing', name: 'Branch parity', description: 'Winchester and Martinsburg are always both present in every view of this registry — coverage matrix, worklist, snapshots — and are never blended into a single company figure.' },
        { '@type': 'Thing', name: 'Propagation', description: 'Directory data flows downhill from aggregators. A row whose fix depends on an upstream record names that record as its propagation parent; the parent must be corrected-live and one refresh cycle must pass before the child can be judged.' },
      ],
      scopeRules: [
        'Statuses come only from the controlled vocabulary; a status that cannot be honestly assigned is unverifiable-today, never a guess.',
        'corrected-live requires a direct-fetch observation of the corrected public page; snippets and search results can open work, never close it.',
        'A correct value for a branch field must trace to the generated branch entity or to a cited canonical estate record; the generator refuses a value that traces to neither.',
        'Review data is carried as per-platform distribution snapshots — averages, counts and arithmetic — never blended across platforms or branches, and never presented as a quality signal (owner ruling 2026-10-31).',
        'Collision companies are catalogued for detection only. This registry never edits, claims or corrects another company’s record.',
        'No third-party record in this dataset carries a client name, a price, a contract, a clearance or a certification claim.',
      ],
    }),
  baseNode('Dataset', 'dataset-local-graph-registry-branches',
    'Local Graph Registry Dataset — Branch Entities (canonical)',
    'The canonical side of the registry: the two branch entities, generated from the estate’s own registries (locations + service-area GeoJSON) so the truth every third-party record is compared against can never be hand-edited in this file. The branches are distinct — different names, hours, addresses, coordinates and Google place identifiers — and are always both present.',
    { branchEntities }),
  baseNode('Dataset', 'dataset-local-graph-registry-records',
    'Local Graph Registry Dataset — Third-Party Records',
    'One row per public record per field: source, branch, field, the observed value exactly as the evidence base recorded it, the correct value traced to its canonical source, the status from the controlled vocabulary, the last-verified date with method (direct-fetch / search-surface / owner-manager-read) and the crawl age of the underlying page where the observation rests on one, the designed solution’s gap, the owner step where one blocks, the propagation parent where the fix flows from upstream, and the append-only status history. ' + totals.thirdPartyRecords + ' records: ' + totals.recordsVerifiedCorrect + ' verified-correct, ' + totals.recordsCorrectionSent + ' correction-sent, ' + totals.recordsParkedOwnerStep + ' parked on an owner step, ' + totals.recordsNoProfileExists + ' absences with a creation path, and the remainder open or unverifiable-today — each with its fix designed in the gap records.',
    { thirdPartyRecords: resolvedRecords }),
  baseNode('Dataset', 'dataset-local-graph-registry-coverage',
    'Local Graph Registry Dataset — Coverage Matrix',
    'The generated source-by-branch matrix: ' + SOURCES.length + ' sources x 2 branches = ' + (SOURCES.length * 2) + ' cells, every cell carrying a state (the worst status among its records) and the recordIds behind it. A source with no record for a branch fails generation — the branch-parity rule made structural. Company-scope records cover both branches and their cells are marked company-level.',
    {
      coverageMatrix: coverageRows,
      parityRule: 'Every source carries at least one record for each branch; absences are records with creation paths, never blank cells.',
      staleVerificationWindowDays: STALE_WINDOW_DAYS,
      staleVerificationRule: 'A record whose effective verification age (days since last verified, plus the crawl age of the underlying page where applicable) exceeds ' + STALE_WINDOW_DAYS + ' days is flagged staleVerification in the records table — flagged for the re-verification cadence, never silently trusted and never silently re-stated.',
    }),
  baseNode('Dataset', 'dataset-local-graph-registry-reviews',
    'Local Graph Registry Dataset — Review Distribution Snapshots',
    'Per-platform review displays as distribution and arithmetic — the shared snapshot schema with the answer-evidence dataset: displayed average, displayed count, the perfect-score total and the star deficit the average implies, the minimum below-five-star construction, and the measurement state. ' + totals.companySnapshots + ' company snapshots (per branch, per platform — never blended) and ' + totals.competitorSnapshots + ' competitor-namespace snapshot whose arithmetic shows why a raw review count is not an authority signal. Histogram and authenticity fields are null-marked unmeasured wherever no instrumented collection exists.',
    { reviewDistributionSnapshots: SNAPSHOTS }),
  baseNode('Dataset', 'dataset-local-graph-registry-collisions',
    'Local Graph Registry Dataset — Name Collisions (DO-NOT-TOUCH)',
    'The name-collision class: ' + COLLISIONS.length + ' other companies whose names collide with The Flat Rate Movers, catalogued with their distinguishing facts so a conflation event — their identifiers, ratings or complaints landing on this company’s records, or the reverse — is detectable in one query. Action on every record is none: this registry never edits another company’s record. No conflation event has been observed to date (' + totals.conflationEventsObserved + ' events recorded).',
    { collisionRecords: COLLISIONS }),
  baseNode('Dataset', 'dataset-local-graph-registry-gaps',
    'Local Graph Registry Dataset — Gaps and Designed Solutions (L1–L11)',
    'The element’s gap records, each with its evidence rows, its impact, and its designed solution — solutions, not problem lists (owner ruling 2026-10-31). Resolution runs through this element’s build sequence: the re-verification pass, the Data Axle root fix, the one consolidated owner sitting, the our-side stale-artifact retirements, the expansion wave, and the propagation proof pass.',
    { gapRecords: GAPS }),
  baseNode('Dataset', 'dataset-local-graph-registry-owner-steps',
    'Local Graph Registry Dataset — Consolidated Owner Steps (generated)',
    'The owner’s entire action list for this element — ' + ownerStepRows.length + ' items — GENERATED from the record rows that carry an owner step, so the list can never drift from the registry: each step names its system, the exact action, and the recordIds it unblocks. One sitting covers the sign-in items; the Data Axle confirmation and the CB Insights mailbox decision stand as their own items. No other owner action exists anywhere in this element’s worklist.',
    { consolidatedOwnerSteps: ownerStepRows }),
  baseNode('Dataset', 'dataset-local-graph-registry-totals',
    'Local Graph Registry Dataset — Totals',
    'Registry totals, generated: records by status and by branch, coverage cells, snapshots by namespace, collisions, gaps by status, owner steps, and the stale-verification count under the ' + STALE_WINDOW_DAYS + '-day window.',
    { totals }),
  baseNode('Dataset', 'dataset-local-graph-registry-backlinks',
    'Local Graph Registry Dataset — Verified Backlink Tier',
    'The verified backlink tier, added 2026-11-02: referring pages recorded in the estate backlink ledger (Bing Webmaster export 2026-11-01) and the review-tier rows fetch-verified the same day. Entries whose domain already carries a registry source ride on that source\u2019s holder record as a backlinks array; the rest stand here as their own class beside the third-party records — never inside the coverage matrix and never inside the record count. Fetch verification is direct-fetch evidence only: a page earns a review-tier record only when the fetched page itself carries the link.',
    { backlinkRecords: BACKLINK_RECORDS, backlinkAttachments: Object.entries(BACKLINK_ATTACHMENTS).map(([holderRecordId, backlinks]) => ({ holderRecordId, backlinks })) }),
  baseNode('Article', 'dataset-local-graph-registry-method',
    'Local Graph Registry — Method',
    'How the registry is built and maintained. (1) The canonical side is generated from the estate registries; (2) the observation side is transcribed from the evidence base — Dossier 03’s audit of 2026-10-31 and the backlink program’s records — with every row carrying its evidence reference, and the fresher source governing conflicts (conflicts are noted on the row, never silently resolved); (3) statuses follow the controlled vocabulary and the direct-fetch rule for corrected-live; (4) the coverage matrix, owner-step list and totals are computed from the rows at generation, so the published views cannot drift from the underlying records; (5) maintenance runs on the measurement cadence — re-verification passes update rows only on page evidence, stale-verification flags mark rows past the window, and every regeneration re-seals the file in the estate’s signed index in the same motion.',
    {
      articleBody: [
        'Evidence tiers follow the Retrieval Machine research framework: platform documentation, the program’s own sampled reads (search-surface and Places-style records, each labeled with its method and crawl age), the backlink program’s execution records, and owner statements (labeled, never silently upgraded).',
        'Crawl ages are stated because aggregator pages are republished on the platform’s schedule, not ours: a 210-day-old crawl showing “not been claimed” beside a claim completed yesterday is a stale observation, and the registry says so on the row instead of averaging the two into a false state.',
        'The propagation model is tested, not assumed: the Data Axle root fix (sketch B3) followed by one refresh cycle and a per-row direct-fetch proof pass (sketch B7) will show which cluster rows actually resolve from the root — the registry’s parent links make that experiment readable row by row.',
      ],
    }),
  baseNode('Article', 'dataset-local-graph-registry-sources',
    'Local Graph Registry — Sources',
    'The evidence base for this registry: Retrieval Machine Dossier 03 (the local-business graph audit and design, reads of 2026-10-31); the backlink program’s Phase 1 citation audit (2026-10-30), Wave 1 execution record (2026-10-30) and Phase 2 plan with its Wave 2 prep re-verification note (2026-10-31); the estate’s canonical registries (locations, service-area GeoJSON, the signed ai-master-index); and the branch submission data packets the program corrects from. Where the audit and the dossier conflict, the dossier’s fresher reading governs and the conflict is noted on the affected row (one instance: the Chamber directory’s Winchester review display — dossier 4.8 over 30 governs over the audit’s 4.9 over 34).',
    {
      sources: [
        { name: 'Retrieval Machine Dossier 03 — Local-business graph', role: 'Governing audit + design (2026-10-31 reads; crawl ages stated per row)' },
        { name: 'Backlink program Phase 1 citation audit', role: 'Per-source, per-branch record inventory (2026-10-30)' },
        { name: 'Backlink program Wave 1 execution record', role: 'Corrections sent/submitted states (2026-10-30)' },
        { name: 'Backlink program Phase 2 plan + Wave 2 prep note', role: 'Creation-wave channels + re-verification results (2026-10-31)' },
        { name: 'Estate registries (locations, service-area GeoJSON)', role: 'Canonical branch facts, generated into the branch entities' },
        { name: 'Estate signed index (ai-master-index.json)', role: 'Provenance for this file and every estate distribution' },
      ],
    }),
  baseNode('Service', 'dataset-local-graph-registry-boundaries',
    'Local Graph Registry — Boundaries',
    'What this registry will not do. It never edits, claims or corrects another company’s record (the collision class is detection-only). It never presents a review count — ours or a competitor’s — as a quality or authority signal. It never marks a row corrected on snippet evidence. It never blends the two branches. It carries no client names, no prices beyond the estate’s already-published industrial schedule (which appears nowhere in this file), no contracts, no clearances and no certification claims. Paid corrections and paid placements are outside the program’s no-paid rule; where a platform paywalls an edit (Judy’s Book), the registry records the free propagation path instead.',
    {
      boundaryRules: [
        'DO-NOT-TOUCH: collision-company records are never edited by this program.',
        'Direct-fetch rule: corrected-live is earned on the public page, not on a snippet, a dashboard claim or a submission receipt.',
        'No-paid rule: corrections and creations use free paths; paywalled edits are recorded with their free alternative.',
        'Branch rule: Winchester and Martinsburg are separate entities on every surface of this dataset — separate records, separate snapshots, separate cells.',
        'Owner-step rule: the consolidated owner list is generated from the rows; an action that is not on a row is not on the list.',
      ],
    }),
];


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
    n.includedInDataCatalog = { '@id': 'https://theflatratemovers.com/datasets/#collection' };
    if (variableMeasured) n.variableMeasured = variableMeasured;
    if (strengthenSC && Array.isArray(n.spatialCoverage)) {
      n.spatialCoverage = n.spatialCoverage.map((p) => (p && ENRICH_PLACES[p['@id']] && Object.keys(p).length === 1) ? ENRICH_PLACES[p['@id']] : p);
    }
  }
}

enrichDatasetNodes(nodes, '2026-10-31', ["thirdPartyRecords (field, observedValue vs correctValue, lastVerified)", "reviewDistributionSnapshots (displayedAverage, displayedCount, branch)", "coverageMatrix (winchester / martinsburg parity cells per source)", "collisionRecords (conflationEvents, presence)"], false);
shaDistributions(nodes, FILE_URL);

// Estate file shape (uniform across dataset files): {@context, @graph}.
const doc = {
  '@context': 'https://schema.org',
  '@graph': nodes,
};

const bytes = Buffer.from(JSON.stringify(doc, null, 2) + '\n', 'utf8');
if (CHECK) {
  const cur = fs.existsSync(outPath) ? fs.readFileSync(outPath) : null;
  if (cur && cur.equals(bytes)) { console.log('CHECK OK: ' + outPath + ' byte-identical'); process.exit(0); }
  console.log('CHECK FAIL: ' + outPath + ' differs (have ' + (cur ? cur.length : 0) + ' bytes, generated ' + bytes.length + ')');
  process.exit(1);
}
fs.writeFileSync(outPath, bytes);
console.log('WROTE ' + outPath + ' (' + bytes.length + ' bytes, sha256 ' + sha256(bytes) + ')');
console.log(JSON.stringify({
  records: totals.thirdPartyRecords, byStatus: totals.recordsByStatus,
  cells: totals.coverageCells, collisions: totals.collisionRecords,
  snapshots: totals.reviewSnapshots, gaps: totals.gapRecords,
  ownerSteps: totals.consolidatedOwnerSteps, stale: totals.recordsStaleVerification,
}, null, 1));
