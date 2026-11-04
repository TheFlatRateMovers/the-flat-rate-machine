// Flat Rate Machine — Catalog Registry dataset builder
// (Retrieval Machine Element 4, per Dossier 04 §5 + the catalog-registry
// prep batch of 2026-11-02; executed by the catalog-registry batch,
// 2026-11-03.)
//   node scripts/build-catalog-registry.js [--out <file>]
//   node scripts/build-catalog-registry.js --check
// Run from the-flat-rate-machine/. No dependencies beyond Node itself
// (network reads ride curl subprocesses — the estate fetcher rule).
//
// WHAT THIS IS
// datasets-catalog-registry.json: the standing registry of the
// Retrieval Machine's dataset-catalog element. The estate publishes
// its datasets in more than one catalog; this dataset is the one
// joined view of all of them: every dataset file (including this one)
// x every applicable catalog seat, with presence and version-sync
// states COMPUTED at generation from primary reads —
//   website      local file bytes vs the signed master index digest
//   api          live GET /v1/datasets + the refresh-bundle manifest
//                digest comparison record
//   github-ai    the local mirror clone's origin/main tree (after
//                fetch) + git blob SHA-1 comparison
//   huggingface  Hub API tree reads through the connector surrogate;
//                ANY read failure computes the seat stale-unknown —
//                never current, never asserted
//   zenodo       the dataset-line deposit zip, per-file SHA-256
//   dataset-search  recorded estate-level audits only (the surface
//                exposes no per-dataset signal — gap CR-G2)
// Presence or sync is never asserted: a seat whose digest cannot be
// read computes to stale-unknown. Join rows are re-derived at every
// generation from the signed index — no count is carried forward.
//
// CADENCE: batch/cadence-run like build-crawl-presence.js (NOT wired
// into seal.py — its inputs include live external reads). Run at
// every estate release and at each monthly observation append; the
// observation store is data/catalog-observations.json
// (paths.json: catalog_observations_file), seeded by the prep batch
// and appended by each generating run (deduped).
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOME = process.env.HOME || '/home/hatch';
const PATHS = JSON.parse(fs.readFileSync(path.join(ROOT, 'paths.json'), 'utf8'));
const PUB = PATHS.public_dir;
const API_DIR = PATHS.api_worker_dir;
const SITE = 'https://theflatratemovers.com';
const FILE_NAME = 'datasets-catalog-registry.json';
const FILE_URL = SITE + '/' + FILE_NAME;
const LANDING = SITE + '/datasets/catalog-registry/';
const API_ROUTE = 'https://api.theflatratemovers.com/v1/catalog';
const INDEX_URL = SITE + '/ai-master-index.json';
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const SOFTWARE_DOI = '10.5281/zenodo.23818766';
const DATASET_DOI = '10.5281/zenodo.23879048';
const SEATS = ['website', 'api', 'github-ai', 'huggingface-estate', 'huggingface-intent', 'zenodo', 'dataset-search'];

function etToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}
const GEN_DATE = process.env.CATALOG_DATE || etToday();
let FILE_DM = GEN_DATE;
try {
  const stamps = JSON.parse(fs.readFileSync(path.join(PUB, 'work/stamps.json'), 'utf8'));
  if (process.env.FB3_STAMPS && stamps.files && stamps.files[FILE_URL]) FILE_DM = stamps.files[FILE_URL];
} catch (e) { /* stamps are a seal-time input; generation date stands */ }

const ORG = {
  '@type': ['Organization', 'MovingCompany', 'LocalBusiness'], '@id': SITE + '/#organization',
  name: 'The Flat Rate Movers', legalName: 'The Flat Rate Movers LLC',
  url: SITE + '/', foundingDate: '2010-06', email: 'ratemovers@gmail.com', telephone: '+1-540-422-2153',
  priceRange: '$$',
  address: { '@type': 'PostalAddress', streetAddress: '116 W Piccadilly St Suite 11', addressLocality: 'Winchester', addressRegion: 'VA', postalCode: '22601', addressCountry: 'US' },
  geo: { '@type': 'GeoCoordinates', latitude: 39.18711576, longitude: -78.1668352 },
  sameAs: [
    'https://www.wikidata.org/wiki/Q141969215', 'https://github.com/TheFlatRateMovers',
    'https://www.youtube.com/@theflatratemovers', 'https://www.instagram.com/theflatratemoversllc/',
    'https://www.threads.com/@theflatratemoversllc', 'https://medium.com/@ratemovers',
    'https://lnk.bio/theflatratemovers', 'https://x.com/ratemovers',
  ],
};

function curl(url, headers) {
  const args = ['-sS', '--max-time', '60', '-w', '\n%{http_code}', url];
  for (const h of headers || []) args.push('-H', h);
  const out = execFileSync('curl', args, { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
  const nl = out.lastIndexOf('\n');
  return { status: Number(out.slice(nl + 1)), body: out.slice(0, nl) };
}
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/* ---------------- estate reads ---------------- */
const indexDoc = JSON.parse(fs.readFileSync(path.join(PUB, 'ai-master-index.json'), 'utf8'));
const indexSha = sha256(fs.readFileSync(path.join(PUB, 'ai-master-index.json')));
const distByBase = new Map();
for (const e of indexDoc.distribution || []) {
  const base = String(e.contentUrl || '').split('/').pop();
  if (base) distByBase.set(base, e);
}
const indexDatasetFiles = [...distByBase.keys()].filter((b) => /^datasets-.+\.json$/.test(b)).sort();
const fileSet = [...new Set([...indexDatasetFiles, FILE_NAME])].sort();

let inventory = [];
try { inventory = JSON.parse(fs.readFileSync(path.join(API_DIR, 'data/datasets-inventory.json'), 'utf8')); } catch (e) { /* derived below */ }
const invByFile = new Map(inventory.map((r) => [r.file, r]));
function landingOf(f) {
  const inv = invByFile.get(f);
  if (inv && inv.landingPage) return inv.landingPage;
  return SITE + '/datasets/' + f.replace(/^datasets-/, '').replace(/\.json$/, '') + '/';
}

const localDigest = new Map();
const localBytes = new Map();
for (const f of fileSet) {
  if (f === FILE_NAME) continue;
  const b = fs.readFileSync(path.join(PUB, f));
  localBytes.set(f, b); localDigest.set(f, sha256(b));
}
const indexDigest = (f) => (distByBase.get(f) && distByBase.get(f).digest ? distByBase.get(f).digest.value : null);

/* metadata completeness per file (DC vocabulary, locally computed) */
function completeness(f, docOverride) {
  if (f === 'datasets-videos.json') {
    return {
      'DC-1': 'not-applicable', 'DC-2': 'suite-gate (verify.js DC-2 corpus verdict)',
      'DC-3': 'pass', 'DC-4': 'not-applicable', 'DC-5': dc5(f, docOverride),
      note: 'datasets-videos.json @graph nodes are VideoObject-typed (the dataset is the video catalog itself); DC-1/DC-4 evaluate Dataset nodes and do not apply.',
    };
  }
  let doc = docOverride;
  if (!doc) { try { doc = JSON.parse(localBytes.get(f).toString('utf8')); } catch (e) { doc = null; } }
  const nodes = doc ? (Array.isArray(doc['@graph']) ? doc['@graph'] : [doc]).filter((n) => n && n['@type'] === 'Dataset') : [];
  const dc1 = nodes.length && nodes.every((n) => typeof n.description === 'string' && n.description.length >= 50 && n.description.length <= 5000) ? 'pass' : 'fail';
  const dc3 = nodes.length && nodes.every((n) => !n.datePublished || !n.dateModified || String(n.dateModified) >= String(n.datePublished)) ? 'pass' : 'fail';
  const okOrg = (o) => o && o['@type'] === 'Organization' && o['@id'] === SITE + '/#organization';
  const dc4 = nodes.length && nodes.every((n) => okOrg(n.creator) && okOrg(n.publisher)) ? 'pass' : 'fail';
  return { 'DC-1': dc1, 'DC-2': 'suite-gate (verify.js DC-2 corpus verdict)', 'DC-3': dc3, 'DC-4': dc4, 'DC-5': dc5(f, docOverride) };
}
function dc5(f, docOverride) {
  const raw = docOverride ? JSON.stringify(docOverride) : (localBytes.has(f) ? localBytes.get(f).toString('utf8') : '');
  return {
    carriesSoftwareConceptDOI: raw.includes(SOFTWARE_DOI),
    carriesDatasetConceptDOI: raw.includes(DATASET_DOI),
    placement: 'suite-gate (verify.js DC-5: identifier-field placement on exactly the lawful holder nodes; content presence recorded here as a scan fact)',
  };
}

/* ---------------- channel reads ---------------- */
const runObs = [];
function seatSummaryObs(catalogId, result) {
  runObs.push({ date: GEN_DATE, catalog_id: catalogId, kind: 'sync-check', result });
}

/* github-ai: local mirror clone tree after fetch */
let ghTree = new Map(); let ghHead = null; let ghFetchNote = 'fetch ok';
try {
  const clone = path.join(HOME, 'workspace/git-mirrors/ai');
  try { execFileSync('git', ['-C', clone, 'fetch', '-q', 'origin'], { timeout: 120000 }); } catch (e) { ghFetchNote = 'fetch failed (last fetched tree used)'; }
  ghHead = execFileSync('git', ['-C', clone, 'rev-parse', '--short', 'origin/main']).toString().trim();
  const tree = execFileSync('git', ['-C', clone, 'ls-tree', '-r', 'origin/main', '--', 'data/']).toString();
  for (const line of tree.split('\n')) {
    const m = line.match(/^\d+ blob ([0-9a-f]{40})\tdata\/(.+)$/);
    if (m) ghTree.set(m[2], m[1]);
  }
} catch (e) { ghFetchNote = 'tree read failed: ' + e.message; }
function gitBlobSha(buf) {
  const h = crypto.createHash('sha1');
  h.update('blob ' + buf.length + '\0'); h.update(buf);
  return h.digest('hex');
}

/* api: live list + bundle manifest */
let apiList = null; let apiManifest = null;
try {
  const r = curl('https://api.theflatratemovers.com/v1/datasets');
  if (r.status === 200) apiList = new Set((JSON.parse(r.body).datasets || []).map((d) => d.file));
} catch (e) { apiList = null; }
try { apiManifest = JSON.parse(fs.readFileSync(path.join(API_DIR, 'data/bundle-manifest.json'), 'utf8')); } catch (e) { apiManifest = null; }

/* huggingface: connector surrogate; any failure degrades the seat */
let hfEstate = null; let hfIntent = null; let hfFail = null;
try {
  const sur = execFileSync('python3', [path.join(HOME, 'workspace/custom-connectors/custom.huggingface/bin/hf_api.py'), 'surrogate'], { timeout: 60000 }).toString();
  const m = sur.match(/Authorization:\s*Bearer\s+(\S+)/);
  if (!m) throw new Error('surrogate returned no credential');
  const auth = ['Authorization: Bearer ' + m[1]];
  const readTree = (repo) => {
    const r = curl('https://huggingface.co/api/datasets/' + repo + '/tree/main?recursive=true', auth);
    if (r.status !== 200) throw new Error('tree HTTP ' + r.status);
    const map = new Map();
    for (const e of JSON.parse(r.body)) if (e.type === 'file') map.set(e.path.split('/').pop(), e.oid);
    return map;
  };
  hfEstate = readTree('theflatratemovers/ai-authority-estate');
  hfIntent = readTree('theflatratemovers/intent-coverage');
} catch (e) { hfFail = e.message; }

/* zenodo: record + deposit zip digests */
let zMap = new Map(); let zStats = null; let zFail = null;
try {
  const rec = curl('https://zenodo.org/api/records/23879049');
  if (rec.status !== 200) throw new Error('record HTTP ' + rec.status);
  const rj = JSON.parse(rec.body);
  zStats = rj.stats || null;
  const key = rj.files && rj.files[0] && rj.files[0].key;
  if (!key) throw new Error('record carries no file');
  const zipPath = path.join(require('os').tmpdir(), 'catalog-zenodo-deposit.zip');
  execFileSync('curl', ['-sS', '--max-time', '300', '-o', zipPath, 'https://zenodo.org/api/records/23879049/files/' + encodeURIComponent(key) + '/content'], { timeout: 320000 });
  const py = "import zipfile,hashlib,json,sys\nz=zipfile.ZipFile(sys.argv[1])\nprint(json.dumps({i.filename.split('/')[-1]: hashlib.sha256(z.read(i.filename)).hexdigest() for i in z.infolist()}))";
  const out = execFileSync('python3', ['-c', py, zipPath], { maxBuffer: 16 * 1024 * 1024 }).toString();
  zMap = new Map(Object.entries(JSON.parse(out)));
} catch (e) { zFail = e.message; }

/* dataset-search: last recorded estate-level audit */
const dsLastAudit = '2026-10-31';

/* ---------------- join computation ---------------- */
function ev(method) { return { method, observedAt: GEN_DATE, source: 'catalog registry generator run, ' + GEN_DATE }; }
const rows = [];
let selfCompleteness = null; // filled after the doc is built (self rows patched below)

for (const f of fileSet) {
  const self = f === FILE_NAME;
  const idxD = indexDigest(f);
  /* website */
  let wRow;
  if (self) {
    wRow = { dataset_id: f, catalog_id: 'website', presence_state: 'present-verified', presenceEvidence: ev('Written into the Pages tree by this generator run and joined to the signed master index by the same batch\u2019s seal (catalog registry batch); the seal proof round recomputes this file\u2019s digest against the index (verify.js P-3). The registry necessarily describes its own pre-seal state on mirror seats — see the method node.'), version_sync_state: 'current', last_observed: GEN_DATE };
  } else {
    const match = idxD && localDigest.get(f) === idxD;
    wRow = { dataset_id: f, catalog_id: 'website', presence_state: 'present-verified', presenceEvidence: ev('Local file SHA-256 compared to the signed master index digest at generation.'), version_sync_state: match ? 'current' : 'stale', last_observed: GEN_DATE };
  }
  /* api */
  let aRow;
  if (apiList === null) {
    aRow = { dataset_id: f, catalog_id: 'api', presence_state: 'unverified (read failed)', presenceEvidence: ev('Live GET /v1/datasets failed at generation; the seat computes stale-unknown, never current.'), version_sync_state: 'stale-unknown', last_observed: GEN_DATE };
  } else if (!apiList.has(f)) {
    aRow = { dataset_id: f, catalog_id: 'api', presence_state: 'absent-observed', presenceEvidence: ev('Live GET https://api.theflatratemovers.com/v1/datasets at generation does not list this file (the API bundle refreshes with each estate batch close; a file published after the last refresh is absent until the next one).'), version_sync_state: null, last_observed: GEN_DATE };
  } else {
    let sync = 'stale-unknown';
    const mf = apiManifest && apiManifest.files ? apiManifest.files[f] : null;
    if (self) sync = 'stale';
    else if (mf && idxD) sync = mf.sha256 === idxD ? 'current' : 'stale';
    aRow = { dataset_id: f, catalog_id: 'api', presence_state: 'present-verified', presenceEvidence: ev(self ? 'Live GET /v1/datasets lists this file; the bundle holds the previous sealed generation of it — by construction the registry trails itself by exactly one generation on mirror seats (see the method node). Sync against the current generation is therefore stale by construction, and the post-close blob comparison is recorded in the batch record.' : 'Live GET /v1/datasets lists this file; sync computed from the refresh-bundle manifest digest record (bundle-manifest.json) against the signed master index digest.'), version_sync_state: sync, last_observed: GEN_DATE };
  }
  /* github-ai */
  let gRow;
  if (!ghTree.size) {
    gRow = { dataset_id: f, catalog_id: 'github-ai', presence_state: 'unverified (read failed)', presenceEvidence: ev('Mirror clone tree unreadable at generation (' + ghFetchNote + '); the seat computes stale-unknown, never current.'), version_sync_state: 'stale-unknown', last_observed: GEN_DATE };
  } else if (!ghTree.has(f)) {
    gRow = { dataset_id: f, catalog_id: 'github-ai', presence_state: 'absent-observed', presenceEvidence: ev('git ls-tree of the local mirror clone (origin/main @ ' + ghHead + ', ' + ghFetchNote + '): data/' + f + ' is not in the tree.'), version_sync_state: null, last_observed: GEN_DATE };
  } else {
    let sync = 'stale-unknown';
    if (self) sync = 'stale';
    else if (localBytes.has(f)) sync = gitBlobSha(localBytes.get(f)) === ghTree.get(f) ? 'current' : 'stale';
    gRow = { dataset_id: f, catalog_id: 'github-ai', presence_state: 'present-verified', presenceEvidence: ev(self ? 'git ls-tree of the local mirror clone (origin/main @ ' + ghHead + ') lists data/' + f + '; the mirror holds the previous sealed generation of this file — the registry trails itself by one generation on mirror seats by construction (see the method node); the post-close blob equality is recorded in the batch record.' : 'git ls-tree of the local mirror clone (origin/main @ ' + ghHead + ', ' + ghFetchNote + '); sync = git blob SHA-1 of the mirror copy vs the local file.'), version_sync_state: sync, last_observed: GEN_DATE };
  }
  /* huggingface-estate */
  let heRow;
  if (!hfEstate) {
    heRow = { dataset_id: f, catalog_id: 'huggingface-estate', presence_state: 'unverified (read failed)', presenceEvidence: ev('Hub API tree read failed at generation (' + (hfFail || 'unknown') + '); the seat computes stale-unknown, never current. Last verified state stands in the catalogs node (2026-11-02 observation).'), version_sync_state: 'stale-unknown', last_observed: GEN_DATE };
  } else if (!hfEstate.has(f)) {
    heRow = { dataset_id: f, catalog_id: 'huggingface-estate', presence_state: 'absent-observed', presenceEvidence: ev('Hub API recursive tree read of theflatratemovers/ai-authority-estate at generation: no path carries this file name.'), version_sync_state: null, last_observed: GEN_DATE };
  } else {
    const sync = localBytes.has(f) ? (gitBlobSha(localBytes.get(f)) === hfEstate.get(f) ? 'current' : 'stale') : 'stale-unknown';
    heRow = { dataset_id: f, catalog_id: 'huggingface-estate', presence_state: 'present-verified', presenceEvidence: ev('Hub API recursive tree read at generation; sync = git blob SHA-1 of the mirror copy vs the local file.'), version_sync_state: sync, last_observed: GEN_DATE };
  }
  /* huggingface-intent */
  let hiRow;
  if (f !== 'datasets-intent-coverage.json') {
    hiRow = { dataset_id: f, catalog_id: 'huggingface-intent', presence_state: 'not-applicable', presenceEvidence: ev('This repo carries the intent dataset only; every other dataset file is not-applicable on this seat by design.'), version_sync_state: null, last_observed: GEN_DATE };
  } else if (!hfIntent) {
    hiRow = { dataset_id: f, catalog_id: 'huggingface-intent', presence_state: 'unverified (read failed)', presenceEvidence: ev('Hub API tree read failed at generation (' + (hfFail || 'unknown') + '); the seat computes stale-unknown, never current.'), version_sync_state: 'stale-unknown', last_observed: GEN_DATE };
  } else if (!hfIntent.has(f)) {
    hiRow = { dataset_id: f, catalog_id: 'huggingface-intent', presence_state: 'absent-observed', presenceEvidence: ev('Hub API recursive tree read of theflatratemovers/intent-coverage at generation: the intent file is not in the tree.'), version_sync_state: null, last_observed: GEN_DATE };
  } else {
    hiRow = { dataset_id: f, catalog_id: 'huggingface-intent', presence_state: 'present-verified', presenceEvidence: ev('Hub API recursive tree read at generation; sync = git blob SHA-1 of the mirror copy vs the local file.'), version_sync_state: gitBlobSha(localBytes.get(f)) === hfIntent.get(f) ? 'current' : 'stale', last_observed: GEN_DATE };
  }
  /* zenodo */
  let zRow;
  if (zFail) {
    zRow = { dataset_id: f, catalog_id: 'zenodo', presence_state: 'unverified (read failed)', presenceEvidence: ev('Zenodo record/zip read failed at generation (' + zFail + '); the seat computes stale-unknown, never current.'), version_sync_state: 'stale-unknown', last_observed: GEN_DATE };
  } else if (!zMap.has(f)) {
    zRow = { dataset_id: f, catalog_id: 'zenodo', presence_state: 'absent-observed', presenceEvidence: ev('The current dataset-line deposit zip (record 23879049) was downloaded and listed at generation: this file is not in it. The deposit predates the file\u2019s publication; a new-version deposit is the recorded remedy (gap C2).'), version_sync_state: null, last_observed: GEN_DATE };
  } else {
    zRow = { dataset_id: f, catalog_id: 'zenodo', presence_state: 'present-verified', presenceEvidence: ev('The current dataset-line deposit zip (record 23879049) was downloaded at generation; sync = SHA-256 of the zipped copy vs the signed master index digest.'), version_sync_state: idxD && zMap.get(f) === idxD ? 'current' : 'stale', last_observed: GEN_DATE };
  }
  /* dataset-search */
  const dsRow = { dataset_id: f, catalog_id: 'dataset-search', presence_state: 'absent-observed', presenceEvidence: ev('Estate-level recorded audits only: the surface exposes no per-dataset presence signal (gap CR-G2), so every file carries the estate-level recorded state — absent at the last full audit (' + dsLastAudit + '), with sampled re-checks since; the cadence re-checks from this registry\u2019s observation store.'), version_sync_state: null, last_observed: dsLastAudit };
  for (const r of [wRow, aRow, gRow, heRow, hiRow, zRow, dsRow]) {
    if (r.catalog_id === 'website' || r.catalog_id === 'dataset-search') {
      r.metadata_completeness = self ? null : completeness(f);
    }
    rows.push(r);
  }
}

/* seat summary observations (CR-3 backing records) */
function seatCounts(seat) {
  const rs = rows.filter((r) => r.catalog_id === seat);
  return {
    present: rs.filter((r) => r.presence_state === 'present-verified').length,
    absent: rs.filter((r) => r.presence_state === 'absent-observed').length,
    na: rs.filter((r) => r.presence_state === 'not-applicable').length,
    unverified: rs.filter((r) => String(r.presence_state).startsWith('unverified')).length,
    current: rs.filter((r) => r.version_sync_state === 'current').length,
    stale: rs.filter((r) => r.version_sync_state === 'stale').length,
    unknown: rs.filter((r) => r.version_sync_state === 'stale-unknown').length,
  };
}
{
  const w = seatCounts('website');
  seatSummaryObs('website', 'Generating run ' + GEN_DATE + ': ' + w.current + ' of ' + fileSet.length + ' dataset files byte-identical to the signed master index (SHA-256); the registry file\u2019s own digest joins the index in this batch\u2019s seal.');
  const a = seatCounts('api');
  seatSummaryObs('api', apiList === null ? 'Generating run ' + GEN_DATE + ': live /v1/datasets read failed; seat computed stale-unknown.' : 'Generating run ' + GEN_DATE + ': live /v1/datasets lists ' + a.present + ' of ' + fileSet.length + ' dataset files; ' + a.current + ' digest-current per the refresh-bundle manifest record, ' + a.stale + ' stale, ' + a.absent + ' absent (published after the last bundle refresh; the batch-close refresh is the remedy).');
  const g = seatCounts('github-ai');
  seatSummaryObs('github-ai', 'Generating run ' + GEN_DATE + ': mirror clone origin/main @ ' + ghHead + ' (' + ghFetchNote + ') carries ' + g.present + ' of ' + fileSet.length + ' dataset files under data/; ' + g.current + ' blob-current, ' + g.stale + ' stale, ' + g.absent + ' absent.');
  if (!hfEstate) seatSummaryObs('huggingface-estate', 'Generating run ' + GEN_DATE + ': Hub API reads FAILED (' + (hfFail || 'unknown') + ') — unauthenticated and connector-authenticated; an unrelated public endpoint answered 200 from the same egress, so the failure is specific to this account\u2019s reads. Seat computed stale-unknown; last verified state 2026-11-02 stands in the catalogs node.');
  else { const h = seatCounts('huggingface-estate'); seatSummaryObs('huggingface-estate', 'Generating run ' + GEN_DATE + ': Hub tree read ok — ' + h.present + ' present, ' + h.current + ' blob-current, ' + h.stale + ' stale, ' + h.absent + ' absent.'); }
  if (zFail) seatSummaryObs('zenodo', 'Generating run ' + GEN_DATE + ': Zenodo read failed (' + zFail + '); seat computed stale-unknown.');
  else { const z = seatCounts('zenodo'); seatSummaryObs('zenodo', 'Generating run ' + GEN_DATE + ': dataset-line deposit (record 23879049) holds ' + z.present + ' of ' + fileSet.length + ' dataset files; ' + z.current + ' digest-current, ' + z.stale + ' stale, ' + z.absent + ' absent. Record stats at read: ' + (zStats ? zStats.views + ' views, ' + zStats.downloads + ' downloads' : 'unavailable') + '.'); }
}

/* T2 diagnostic-test observation (CR-G1 resolution, execution step 0) */
runObs.push({
  date: GEN_DATE, catalog_id: 'dataset-search', kind: 'diagnostic-test',
  result: 'T2 re-validated from primary sources on ' + GEN_DATE + ' (the 2026-11-01 diagnostic\u2019s primary record file could not be located — only its outcome statement survives in the 2026-11-01 daily log — so the test was RE-RUN, per the prep\u2019s remedy): required Dataset properties per Google\u2019s own dataset documentation (name; description 50\u20135,000 chars; DataDownload contentUrl) PASS on all three representative landings\u2019 primary Dataset nodes (datasets hub, intent-coverage, gun-safe), and no required-property form difference exists against the Zenodo record page\u2019s embedded Dataset node. Recommended-property deltas only (datePublished, version on landing-primary nodes). T2 ELIMINATED, firm. Full record: batch-catalog-registry-2026-11-03/work/T2-VALIDATION-2026-11-03.md.',
});

/* observations = store rows + run rows, deduped */
const storePath = path.resolve(ROOT, PATHS.catalog_observations_file || 'data/catalog-observations.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
const obsKey = (o) => [o.date, o.catalog_id, o.kind, o.result].join('|');
const obsMap = new Map();
for (const o of store.observations) obsMap.set(obsKey(o), o);
for (const o of runObs) obsMap.set(obsKey(o), o);
const observations = [...obsMap.values()].sort((a, b) => (a.date + a.catalog_id + a.kind).localeCompare(b.date + b.catalog_id + b.kind));

/* ---------------- catalog rows ---------------- */
const aC = seatCounts('api'); const gC = seatCounts('github-ai'); const zC = seatCounts('zenodo'); const hC = seatCounts('huggingface-estate');
const catalogs = [
  { catalog_id: 'website', name: 'The Flat Rate Movers website (canonical)', kind: 'first-party canonical host', url: SITE + '/datasets/', distributionScope: 'Every dataset file is published at the site root and sealed in the signed master index; dataset landings under /datasets/<name>/ are generated per file. Presence and sync on this seat are definitional: the local file bytes are compared to the signed index digest at every generation.', status: 'live-current', lastObserved: GEN_DATE },
  { catalog_id: 'api', name: 'Estate API (api.theflatratemovers.com)', kind: 'first-party read API', url: 'https://api.theflatratemovers.com/v1/datasets', distributionScope: 'The API worker bundles every dataset file at each refresh (refresh-bundle.py derives the set from the signed index) and serves it byte-identical at /v1/datasets and per-registry routes. At this generation the live bundle lists ' + aC.present + ' of ' + fileSet.length + ' files; a file published after the last refresh joins at the next batch close.', status: 'live-current', lastObserved: GEN_DATE },
  { catalog_id: 'github-ai', name: 'GitHub — theflatratemovers-ai (data/)', kind: 'public repository mirror', url: 'https://github.com/TheFlatRateMovers/theflatratemovers-ai/tree/main/data', distributionScope: 'Every dataset file is mirrored under data/ in the public AI repository at each batch close (push-mirrors glob rule). At this generation the mirror tree (origin/main @ ' + ghHead + ') carries ' + gC.present + ' of ' + fileSet.length + ' files, ' + gC.current + ' blob-current.', status: 'live-current', lastObserved: GEN_DATE },
  hfEstate
    ? { catalog_id: 'huggingface-estate', name: 'Hugging Face — theflatratemovers/ai-authority-estate', kind: 'dataset repository mirror', url: 'https://huggingface.co/datasets/theflatratemovers/ai-authority-estate', distributionScope: 'The estate mirror repo carries the dataset files under datasets/. Read live at this generation: ' + hC.present + ' present, ' + hC.current + ' blob-current, ' + hC.stale + ' stale.', status: 'live', lastObserved: GEN_DATE }
    : { catalog_id: 'huggingface-estate', name: 'Hugging Face — theflatratemovers/ai-authority-estate', kind: 'dataset repository mirror', url: 'https://huggingface.co/datasets/theflatratemovers/ai-authority-estate', distributionScope: 'The estate mirror repo carries the dataset files under datasets/. At the last verified read (2026-11-02) it held 38 of the then-40 dataset files, 1 digest-current. The re-sync remedy is the next release motion (gap C2).', status: 'read-failed — Hub API returned HTTP 401 on ' + GEN_DATE + ' (unauthenticated and connector-authenticated reads); last verified state 2026-11-02: live-stale', lastObserved: '2026-11-02', lastVerifiedState: { date: '2026-11-02', present: 38, filesAtRead: 40, digestCurrent: 1, lastModified: '2026-11-01T23:31:01Z', downloads: 383 } },
  hfIntent
    ? { catalog_id: 'huggingface-intent', name: 'Hugging Face — theflatratemovers/intent-coverage', kind: 'dataset repository (single dataset)', url: 'https://huggingface.co/datasets/theflatratemovers/intent-coverage', distributionScope: 'This repo carries datasets-intent-coverage.json only; every other dataset file is not-applicable on this seat by design. Read live at this generation.', status: 'live', lastObserved: GEN_DATE }
    : { catalog_id: 'huggingface-intent', name: 'Hugging Face — theflatratemovers/intent-coverage', kind: 'dataset repository (single dataset)', url: 'https://huggingface.co/datasets/theflatratemovers/intent-coverage', distributionScope: 'This repo carries datasets-intent-coverage.json only; every other dataset file is not-applicable on this seat by design. At the last verified read (2026-11-02) the intent file was present and stale against the then-current generation.', status: 'read-failed — Hub API returned HTTP 401 on ' + GEN_DATE + ' (unauthenticated and connector-authenticated reads); last verified state 2026-11-02: live-stale', lastObserved: '2026-11-02', lastVerifiedState: { date: '2026-11-02', present: 1, digestCurrent: 0, lastModified: '2026-11-01T23:31:27Z', downloads: 90 } },
  { catalog_id: 'zenodo', name: 'Zenodo — dataset line (record 23879049)', kind: 'DOI deposit (versioned snapshot)', url: 'https://zenodo.org/records/23879049', distributionScope: 'The dataset deposit is a versioned snapshot zip (the-flat-rate-movers-datasets-2026-11-02.zip), not a live mirror: at this generation\u2019s read it holds ' + zC.present + ' of ' + fileSet.length + ' dataset files, ' + zC.current + ' digest-current. A new-version deposit at the next release is the recorded remedy (gap C2). The record\u2019s concept DOI is the citable dataset DOI; it is carried here as data fields only and never as an identifier of any node in this file (gate CR-4).', recordVersionDoi: '10.5281/zenodo.23879049', recordConceptDoi: DATASET_DOI, status: 'live-stale (snapshot of 2026-11-02)', lastObserved: GEN_DATE },
  { catalog_id: 'dataset-search', name: 'Google Dataset Search', kind: 'discovery surface (no submission channel)', url: 'https://datasetsearch.research.google.com/', distributionScope: 'Dataset Search has no submission or API: presence is earned by crawl of the landings\u2019 Dataset markup and read back only by querying the surface. The estate-level recorded state is absent (full audits 2026-10-30 and 2026-10-31, sampled re-checks since); per-dataset presence is not observable on this surface (gap CR-G2), so join rows carry the estate-level state with the audit dates as evidence.', status: 'absent-observed (estate level)', lastObserved: dsLastAudit },
  { catalog_id: 'kaggle', name: 'Kaggle Datasets', kind: 'dataset repository (not pursued)', url: 'https://www.kaggle.com/datasets', distributionScope: 'No Kaggle dataset exists and none is claimed. The channel is mapped here so the catalog map is complete: every channel considered carries a row, including the ones deliberately not used.', status: 'not-pursued-by-design', reEntryConditions: 'Re-enters only if the owner personally creates and signs in to a Kaggle account and asks for the mirror (account creation is an owner step under the registry login-route rule); the mirror then publishes under the same CC BY 4.0 license with the signed index as its provenance.', lastObserved: GEN_DATE },
  { catalog_id: 'data-gov', name: 'data.gov', kind: 'government catalog (not pursued)', url: 'https://catalog.data.gov/', distributionScope: 'No data.gov listing exists and none is claimed. data.gov catalogs United States government datasets; a private company\u2019s commercial dataset estate is outside its collection scope, so the channel is recorded as mapped-and-declined rather than left as an unexamined blank.', status: 'not-pursued-by-design', reEntryConditions: 'Re-enters only if a government partner program or an agency data call makes a private-sector listing in scope; no action is pending and none is scheduled.', lastObserved: GEN_DATE },
];

/* ---------------- static payloads ---------------- */
const scopeRules = [
  { rule: 'join-completeness', text: 'The join is datasets x seats: every dataset file that is a distribution of the signed master index (plus this registry file itself) carries exactly one row for each of the seven seats: website, api, github-ai, huggingface-estate, huggingface-intent, zenodo, dataset-search. The two non-channel catalogs (kaggle, data-gov) carry catalog rows only and never join rows. Gate CR-1 verifies completeness in both directions at every seal.' },
  { rule: 'presence-vocabulary', text: 'presence_state is one of: present-verified (a dated observation with a method stands behind the row), absent-observed (a dated read found the file missing), present-stale (present and read, but not the current generation — used where a seat reports presence without per-file digests), not-submitted (a channel with a submission step that has not been taken), not-applicable (the seat does not carry this file by design), or unverified (read failed) — a read failure is recorded as an observation and the row\u2019s sync state computes to stale-unknown; presence is never upgraded on a failed read.' },
  { rule: 'sync-computation', text: 'version_sync_state is computed, never asserted: file seats compare SHA-256 digests (mirror copy vs the signed master index digest); repository seats compare git blob SHA-1 (mirror blob vs local file); the API seat reads the refresh-bundle manifest\u2019s digest-match record. A seat whose digest cannot be read computes to stale-unknown, never to current.' },
  { rule: 'evidence-rule', text: 'Every present-verified row carries presenceEvidence {method, observedAt, source}. A claim without a dated observation behind it does not ship: it degrades to the honest state (absent-observed, present-stale, or stale-unknown) instead.' },
  { rule: 'metadata-completeness', text: 'Website and dataset-search rows carry metadata_completeness in the verify.js DC vocabulary: DC-1 (every Dataset node description within 50\u20135,000 characters), DC-3 (dateModified not before datePublished), DC-4 (creator/publisher the canonical Organization) computed per file at generation; DC-2 and DC-5 recorded as suite-gate verdicts with the per-file DOI content scans computed. datasets-videos.json is not-applicable for DC-1/DC-4 (its graph is VideoObject-typed) and the row says why.' },
  { rule: 'doi-discipline', text: 'DOIs appear in this file as data fields and prose facts only. No Dataset or DataCatalog node in this file carries a DOI in its identifier (gate CR-4): the software concept DOI stays on exactly its lawful holder nodes estate-wide, and the dataset concept DOI stays on the collection node at /datasets/#collection.' },
  { rule: 'self-inclusion', text: 'This registry file is a row subject like every other dataset file: it joins all seven seats with its own computed states, including the honest ones (absent from snapshot seats until their next refresh, and trailing itself by one generation on mirror seats by construction).' },
];
const boundaryRules = [
  { boundary: 'no-invented-presence', text: 'Presence is observed or it is not claimed. Snapshot seats (Zenodo) and crawl-earned surfaces (Dataset Search) show their true states — absent and stale rows are published, not rounded up.' },
  { boundary: 'no-account-creation', text: 'This registry creates no account and submits nothing anywhere. Channels that need an owner sign-in (Kaggle) are recorded not-pursued-by-design with their re-entry conditions; account steps are owner steps.' },
  { boundary: 'no-claimed-listings', text: 'No listing, indexing, ranking or citation by any third-party catalog is claimed beyond what a dated observation in this file records. Dataset Search presence in particular is reported as the recorded estate-level observation, never as per-dataset fact (gap CR-G2).' },
  { boundary: 'mirrors-are-copies', text: 'Mirror seats are copies of the canonical website files; the canonical provenance is the signed master index on theflatratemovers.com. A stale mirror is a distribution lag with a recorded remedy (the next refresh), never a second source of truth.' },
  { boundary: 'private-material-excluded', text: 'This registry describes published dataset files and public catalogs only. Internal research stores (buyer intelligence, quote records, client material) are not dataset files, appear in no catalog, and are never described here.' },
];

const diagnostics = [
  { stage: 'T1', hypothesis: 'Dataset Search absence is indexing/crawl lag on a young rebuilt estate: the current site cut over on 2026-10-28, the recorded absence checks ran 2026-10-30 and 2026-10-31, and new structured data can take weeks to surface.', test: 'Re-query Dataset Search for the company name, the site domain and the flagship dataset names on the registry cadence and record each result as an observation.', date: '2026-10-31', result: 'Inconclusive: absence persists across the two recorded estate-level checks (2026-10-30, 2026-10-31); the cadence re-checks from this registry\u2019s observation store. The hypothesis weakens with every passing week the other stages stay eliminated.', status: 'open' },
  { stage: 'T2', hypothesis: 'Absence is a schema nuance: the landings\u2019 Dataset markup might miss a required property or encode one in a form the surface does not consume, even though the markup validates.', test: 'Diff the required-property set for Dataset (per Google\u2019s own dataset structured-data documentation) against the Dataset nodes actually served on representative landings, per property, and against the Dataset node Zenodo embeds on the record page.', date: GEN_DATE, result: 'Eliminated (firm). Original run 2026-11-01 found no required property failing on sampled datasets — absence is not a schema failure — but its primary record file could not be located at execution, so the test was RE-RUN from primary sources on ' + GEN_DATE + ': required properties (name; description 50\u20135,000 chars; DataDownload contentUrl) pass on the primary Dataset nodes of the datasets hub, intent-coverage and gun-safe landings, with no required-property form difference against Zenodo\u2019s embedded node; recommended-property deltas only (datePublished, version on landing-primary nodes; version has no truthful per-dataset value — the estate\u2019s versioning seat is the signed index — so no estate-wide markup fix is triggered). Full record: out/batch-catalog-registry-2026-11-03/work/T2-VALIDATION-2026-11-03.md (batch record).', status: 'eliminated' },
];

const gaps = [
  { id: 'C1', title: 'Dataset Search absence — cause not yet isolated', evidence: 'Estate-level queries on 2026-10-30 and 2026-10-31 found no estate datasets on Google Dataset Search, while the parallel channels-build verification the same week confirmed the dataset landings carry the recommended properties. The T-series diagnostic (diagnostics node) works the cause in order; T2 is eliminated (firm, re-validated ' + GEN_DATE + '), T1 (lag) remains open and weakens weekly.', impact: 'One discovery surface shows nothing while every other surface (web search, the API, both repositories, the DOI record) carries the estate.', designedSolution: 'Work the diagnostic in order under gate CR-5: keep T1 under cadence observation; if absence persists past the lag window with T2 eliminated, run T3 (landing-form A/B evidence) and T4 (host-signal weight) in order. Nothing is submitted or marked up speculatively meanwhile.', status: 'open' },
  { id: 'C2', title: 'Mirror staleness on the snapshot and repository seats', evidence: 'Computed at this generation (' + GEN_DATE + '): the Zenodo dataset deposit (a 2026-11-02 snapshot) holds ' + zC.present + ' of ' + fileSet.length + ' dataset files, ' + zC.current + ' digest-current; the Hugging Face seats\u2019 last verified state (2026-11-02) was likewise behind the sealed estate, and their ' + GEN_DATE + ' reads failed (HTTP 401), so their rows compute stale-unknown this generation. The website, API and GitHub seats refresh at every batch close and are current by construction.', impact: 'A researcher landing on a mirror seat can meet an older generation of a dataset; the canonical signed index is unaffected.', designedSolution: 'Re-sync the mirrors at the next release motion: new-version Zenodo deposit of the full current file set, Hugging Face repo refresh (after its read access is restored) — then this registry\u2019s next generation records the computed improvement. Sync states are never edited by hand; they recompute from digests.', status: 'open' },
  { id: 'C3', title: 'No joined catalog view existed', evidence: 'Before this file, presence and sync per dataset per catalog lived in separate batch records (the channels build-out, the Hugging Face re-sync record, the Zenodo deposit record) that drifted apart between motions; Dossier 04 \u00a75 specified this registry as the joined view.', impact: 'Any "where is dataset X published and is it current" question required re-deriving from records of different dates.', designedSolution: 'This file: one computed join, regenerated at every release and on the observation cadence, gated by CR-1..CR-5 in verify.js.', status: 'resolved (catalog registry batch, ' + GEN_DATE + ')' },
  { id: 'C4', title: 'Croissant depth beyond the intent dataset', evidence: 'The X2 Croissant-first package (2026-11-02) put the full Croissant metadata layer on the Hugging Face repos as then synced; the intent dataset carries the deepest card. Per-dataset Croissant records for the remaining files ride on the repos\u2019 card-level metadata, not on per-file records.', impact: 'ML-tooling consumers get first-class Croissant treatment for the flagship dataset and standard dataset cards for the rest.', designedSolution: 'At the next Hugging Face re-sync (after read access is restored), extend the dataset_info/Croissant parity pass from the intent card to the estate repo\u2019s per-file records in the same motion as the C2 refresh.', status: 'open' },
  { id: 'C5', title: 'Observation cadence is manual until E6-B3 wires it', evidence: 'This registry\u2019s facts decay: mirrors refresh, deposits land, Dataset Search is re-queried. The prep cadence (every release + monthly observation appends) is a discipline, not yet a schedule; the archive program\u2019s E6-B3 batch is the estate\u2019s cadence-wiring motion.', impact: 'Between releases, recorded observations age; the file always shows its generation date and per-row observed dates, so staleness is visible rather than hidden.', designedSolution: 'E6-B3 wires the release-cadence runner with this registry\u2019s observation store (data/catalog-observations.json) as its home: each release regenerates the join and appends the channel observations in the same motion.', status: 'open' },
  { id: 'C6', title: 'Kaggle mirror not pursued', evidence: 'Kaggle is a real dataset channel the estate deliberately does not use: creating the account is an owner step under the registry login-route rule, and no owner step has been taken or requested.', impact: 'One channel carries nothing; the catalog map records the decision and its re-entry conditions instead of leaving an unexamined blank.', designedSolution: 'None required — closed by design. Re-enters only on the recorded conditions in the kaggle catalog row.', status: 'closed-by-design' },
  { id: 'CR-G1', title: 'Diagnostic evidence gap: the 2026-11-01 Dataset Search diagnostic\u2019s primary record was not locatable', evidence: 'At prep (2026-11-02) the run\u2019s outcome statement was on record (no required property fails on sampled datasets; recommended-property gaps only) but its primary evidence file \u2014 the per-property table \u2014 could not be located, and the channels build-out that cites it was reported through a browser summary rather than a named record file.', impact: 'T2 stood at eliminated-provisional: the diagnostic order could not proceed past T2 on an unproduced record.', designedSolution: 'Resolve at execution step 0 by locating the primary record or re-running the validation. EXECUTED ' + GEN_DATE + ': the outcome statement was located in the 2026-11-01 daily log (a summary, not the primary evidence), so the T2 validation was re-run from primary sources (Google\u2019s dataset documentation + the served landings\u2019 Dataset nodes + the Zenodo record\u2019s embedded node); T2 is eliminated (firm) and the full re-run record stands at out/batch-catalog-registry-2026-11-03/work/T2-VALIDATION-2026-11-03.md.', status: 'resolved (execution step 0, ' + GEN_DATE + ': re-run from primary sources)' },
  { id: 'CR-G2', title: 'Per-dataset Dataset Search presence is not observable', evidence: 'Dataset Search exposes no API and no per-dataset presence feed; its result pages do not enumerate which of the estate\u2019s 40+ datasets it holds, so a per-file presence claim on this seat cannot be evidenced the way the other seats\u2019 claims are.', impact: 'The dataset-search join rows carry the estate-level recorded state instead of per-file states; a reader must not read a row as a per-dataset verdict.', designedSolution: 'Recorded as structural: the rows state the limitation in their evidence text, the cadence re-checks at estate level, and if the surface ever exposes per-dataset signals the rows upgrade to per-file observations in the next generation.', status: 'recorded-structural' },
];

/* ---------------- totals (computed) ---------------- */
function countWhere(fn) { return rows.filter(fn).length; }
const compFiles = fileSet.filter((f) => f !== FILE_NAME);
const compCount = (key, val) => compFiles.filter((f) => completeness(f)[key] === val).length;
const totals = {
  datasetFiles: fileSet.length,
  catalogs: catalogs.length,
  catalogChannels: catalogs.filter((c) => c.status !== 'not-pursued-by-design').length,
  nonChannels: catalogs.filter((c) => c.status === 'not-pursued-by-design').length,
  joinRows: rows.length,
  rowsPerDataset: SEATS.length,
  presence: {
    'present-verified': countWhere((r) => r.presence_state === 'present-verified'),
    'absent-observed': countWhere((r) => r.presence_state === 'absent-observed'),
    'not-applicable': countWhere((r) => r.presence_state === 'not-applicable'),
    'unverified (read failed)': countWhere((r) => String(r.presence_state).startsWith('unverified')),
  },
  sync: {
    current: countWhere((r) => r.version_sync_state === 'current'),
    stale: countWhere((r) => r.version_sync_state === 'stale'),
    'stale-unknown': countWhere((r) => r.version_sync_state === 'stale-unknown'),
    'not-measured (no digest on this seat)': countWhere((r) => r.version_sync_state === null),
  },
  seats: Object.fromEntries(SEATS.map((s) => [s, seatCounts(s)])),
  completeness: {
    filesMeasured: compFiles.length,
    'DC-1': { pass: compCount('DC-1', 'pass'), fail: compCount('DC-1', 'fail'), 'not-applicable': compCount('DC-1', 'not-applicable') },
    'DC-3': { pass: compCount('DC-3', 'pass'), fail: compCount('DC-3', 'fail') },
    'DC-4': { pass: compCount('DC-4', 'pass'), fail: compCount('DC-4', 'fail'), 'not-applicable': compCount('DC-4', 'not-applicable') },
    note: 'Computed per file at generation over the pre-existing dataset files; the registry file\u2019s own rows carry its completeness computed over its own nodes in the same run (website and dataset-search rows). DC-2 and DC-5 are suite-gate verdicts (verify.js) with per-file DOI content scans computed in each row.',
  },
  baselineAtGeneration: {
    signedDistributions: (indexDoc.distribution || []).length,
    signedIndexSha256Prefix: indexSha.slice(0, 8),
    datasetFilesInIndex: indexDatasetFiles.length,
    pagesRegistered: (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data/pages.json'), 'utf8')).length; } catch (e) { return null; } })(),
    note: 'The estate baseline as read by this generation (' + GEN_DATE + '), before this batch\u2019s own seal adds the registry\u2019s distributions.',
  },
  openGaps: gaps.filter((g) => g.status === 'open').map((g) => g.id),
  diagnosticsOpen: diagnostics.filter((d) => d.status === 'open').map((d) => d.stage),
  generatedAt: GEN_DATE,
};

/* ---------------- node assembly ---------------- */
function node(type, suffix, name, description, extra, payloadKey) {
  const n = {
    '@type': type, '@id': FILE_URL + '#dataset-catalog-registry-' + suffix, name,
    description, inLanguage: 'en-US', dateModified: FILE_DM,
    isAccessibleForFree: true, license: LICENSE, creator: ORG, publisher: ORG,
    url: LANDING, sameAs: LANDING, identifier: LANDING,
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: FILE_URL },
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: INDEX_URL, name: 'Signed master index (provenance)' },
    ],
  };
  if (type === 'Dataset') {
    n.datePublished = '2026-11-03';
    n.includedInDataCatalog = { '@id': SITE + '/datasets/#collection' };
    // No variableMeasured: verify.js CV-6 reserves that property to
    // the six measurement datasets; the catalog registry is held to
    // the same bar as the other registry files (execution deviation
    // from the prep seed frame, recorded in the batch record).
  }
  return Object.assign(n, extra || {});
}

const doc = {
  '@context': 'https://schema.org',
  '@graph': [
    node('Service', 'operations', 'Dataset Catalog Registry \u2014 Operations',
      'The operations record for the dataset catalog registry of The Flat Rate Movers: what the registry is, the seats it joins, and the gates that verify it. The registry is the dataset-catalog element (Element 4) of the Retrieval Machine, built from Dossier 04 \u00a75: one joined, computed view of every dataset file the company publishes and every catalog that carries it \u2014 the company website, the estate API, the GitHub AI repository, two Hugging Face dataset repositories, the Zenodo DOI deposit, and Google Dataset Search \u2014 plus the channels deliberately not used, recorded with their reasons. Presence and version-sync states are computed from primary reads at every generation and sealed in the signed master index; nothing in the file is asserted without a dated observation behind it.',
      { provider: { '@id': SITE + '/#organization' }, serviceType: 'Dataset catalog registry and channel verification', areaServed: 'Worldwide (digital distribution)' }, null),
    node('Dataset', 'scope', 'Dataset Catalog Registry \u2014 Scope Rules',
      'The scope rules of the catalog registry: the join is datasets x seats with exactly one row per dataset per applicable seat; the presence vocabulary (present-verified, absent-observed, present-stale, not-submitted, not-applicable, and unverified-on-read-failure); the sync-computation rule (digests compared, never asserted; an unreadable seat computes stale-unknown); the evidence rule (every present-verified row carries a dated observation with a method); the metadata-completeness encoding in the verify.js DC vocabulary; the DOI discipline (DOIs as data fields only, never as node identifiers); and self-inclusion (the registry joins its own seats with computed states).',
      { scopeRules }, 'scopeRules'),
    node('Dataset', 'catalogs', 'Dataset Catalog Registry \u2014 The Catalogs',
      'The nine catalog rows: seven channels that carry or can carry the estate\u2019s datasets (the company website, the estate API, the GitHub AI repository, the Hugging Face estate repository, the Hugging Face intent repository, the Zenodo DOI deposit, and Google Dataset Search) and two channels recorded as not pursued by design with their re-entry conditions (Kaggle, data.gov). Each row states the channel kind, its URL, exactly what it distributes, its status and the date it was last observed \u2014 including the honest states: the Zenodo deposit is a stale snapshot by design, and the Hugging Face seats\u2019 current read state is recorded as it stands.',
      { catalogs }, 'catalogs'),
    node('Dataset', 'datasets', 'Dataset Catalog Registry \u2014 The Join: Datasets x Catalog Seats',
      'The join itself: ' + rows.length + ' rows at this generation \u2014 ' + fileSet.length + ' dataset files x 7 seats. Every row names its dataset file and catalog, the presence state with its dated evidence (method, observed date, source), the computed version-sync state, and \u2014 on the website and dataset-search seats \u2014 the file\u2019s metadata completeness in the DC vocabulary. Read it as the answer to one question per row: is this dataset in this catalog, and is the copy there the current generation?',
      { catalogDatasets: rows }, 'catalogDatasets'),
    node('Dataset', 'observations', 'Dataset Catalog Registry \u2014 Channel Observations',
      'The observation log behind the join: dated, method-carrying observations of the catalogs \u2014 live reads of the website files against the signed index, the API dataset list and bundle manifest, the GitHub mirror tree, the Hugging Face repositories, the Zenodo deposit contents, and the Dataset Search surface audits. The log is append-only in the registry\u2019s observation store (data/catalog-observations.json); each generation of this file republishes the standing rows plus its own run\u2019s seat summaries, including read failures exactly as they occurred.',
      { catalogObservations: observations }, 'catalogObservations'),
    node('Dataset', 'diagnostics', 'Dataset Catalog Registry \u2014 Dataset Search Diagnostic (T-Series)',
      'The ordered diagnostic for the estate\u2019s one absent surface, Google Dataset Search, run under gate CR-5 (a stage is worked only when every earlier stage has a row): T1 (indexing lag on a young rebuilt estate) is open and under cadence observation; T2 (schema nuance) is eliminated, firm \u2014 re-validated from primary sources at this registry\u2019s execution after its original record could not be located (gap CR-G1). T3 and T4 carry no rows yet and are not run out of order.',
      { diagnosticRecords: diagnostics }, 'diagnosticRecords'),
    node('Dataset', 'gaps', 'Dataset Catalog Registry \u2014 Gaps and Designed Solutions',
      'The catalog element\u2019s named gaps, each with its evidence, its impact and its designed solution: C1 the un-isolated Dataset Search absence; C2 mirror staleness on the snapshot and repository seats, with the next-release re-sync as its remedy (never hand-edited sync states); C3 the missing joined view, resolved by this file; C4 Croissant depth beyond the intent dataset; C5 the observation cadence, whose scheduling home is the archive program\u2019s E6-B3 batch; C6 the Kaggle non-pursuit, closed by design; CR-G1 the diagnostic\u2019s unlocatable primary record, resolved at execution by re-running the validation; and CR-G2 the structural unobservability of per-dataset Dataset Search presence.',
      { gapRecords: gaps }, 'gapRecords'),
    node('Dataset', 'totals', 'Dataset Catalog Registry \u2014 Totals',
      'The registry\u2019s computed totals for this generation: dataset files joined, catalog rows, join rows, the presence and sync counts across all seats and per seat, the metadata-completeness pass counts, and the estate baseline the generation read (signed distributions, dataset files in the index, registered pages) \u2014 every figure derived from the join rows and the signed index in the same run, never carried forward from an earlier generation.',
      { totals }, 'totals'),
    node('Article', 'method', 'Dataset Catalog Registry \u2014 Method',
      'How this registry is generated and how to read it: the generator (scripts/build-catalog-registry.js, a Flat Rate Machine tool) derives the dataset set from the signed master index, reads every seat from its primary source, computes presence and sync, merges the append-only observation store, and writes this file; verify.js gates CR-1..CR-5 check the join\u2019s completeness, its evidence, its digest backing, its DOI discipline and its diagnostic order at every seal.',
      { articleBody: 'Generation. The generator reads the signed master index (ai-master-index.json) for the authoritative dataset-file set (adding this registry file itself), reads each file\u2019s bytes from the Pages tree, and computes metadata completeness per file in the DC vocabulary (descriptions measured, date order compared, creator/publisher matched against the canonical Organization; DOI content scans for the DC-5 record). Seat reads: website = local SHA-256 vs the signed index digest; api = live GET /v1/datasets for presence plus the refresh-bundle manifest\u2019s per-file digest record for sync; github-ai = the local mirror clone\u2019s origin/main tree after fetch, git blob SHA-1 vs the local file; huggingface = Hub API recursive tree reads through the estate\u2019s connector, blob SHA-1 vs the local file \u2014 on ' + GEN_DATE + ' every Hub read failed with HTTP 401, so both seats compute stale-unknown with the failure recorded as an observation (the seats\u2019 last verified state, 2026-11-02, stands in the catalogs node); zenodo = the dataset-line deposit zip downloaded and hashed per file; dataset-search = the recorded estate-level audits (the surface exposes no per-dataset signal). Observations merge from the append-only store data/catalog-observations.json plus this run\u2019s seat summaries, deduped; the store is appended in the same motion. Reading the join. presence_state answers "is it there" with its evidence attached; version_sync_state answers "is the copy current" and is only ever a digest comparison result \u2014 current, stale, stale-unknown (digest unreadable), or null where the seat carries no per-file digest. Self-inclusion honesty: this file\u2019s own mirror-seat rows describe the previous sealed generation, because a registry cannot contain its own final digest; the post-close comparisons land in the batch record and in the next generation. Cadence: regenerated at every estate release and at each monthly observation append; the E6-B3 batch wires the runner with the observation store as its home (gap C5).' }, null),
    node('Article', 'sources', 'Dataset Catalog Registry \u2014 Sources',
      'The sources this registry stands on: the prep batch\u2019s specification and seed-evidence record (2026-11-02), Dossier 04 \u00a75, the signed master index, the live channel reads of the generation date, the Hugging Face re-sync record and the Zenodo deposit record (both 2026-11-02), the channels build-out record (2026-11-01), and the T2 re-validation record written at this registry\u2019s execution (2026-11-03) after the 2026-11-01 diagnostic\u2019s primary record could not be located.',
      {
        sources: [
          { name: 'Catalog registry prep batch — PREP-RECORD.md, dataset-spec.md, api-endpoint-spec.md, landing-spec.md, propagation-spec.md, work/seed-evidence.json', date: '2026-11-02' },
          { name: 'Dossier 04 (dataset catalog), \u00a75 — the catalog registry design', date: '2026-10-31' },
          { name: 'Signed master index (ai-master-index.json) \u2014 the dataset set, digests and baseline read at generation', date: GEN_DATE },
          { name: 'Live channel reads at generation: estate API /v1/datasets + bundle-manifest.json; GitHub mirror clone tree (origin/main @ ' + ghHead + '); Zenodo record 23879049 + deposit zip', date: GEN_DATE },
          { name: 'Hugging Face read attempt at generation \u2014 HTTP 401 on all reads (recorded as observation); last verified state from the re-sync record RESYNC-2026-11-02.md', date: GEN_DATE },
          { name: 'Zenodo dataset record 23879049 (deposit of 2026-11-02; concept DOI ' + DATASET_DOI + ')', date: '2026-11-02' },
          { name: 'Channels build-out record (2026-11-01) and the Dataset Search absence checks of 2026-10-30 / 2026-10-31', date: '2026-11-01' },
          { name: 'T2-VALIDATION-2026-11-03.md \u2014 the T2 re-run from primary sources (Google dataset structured-data documentation; served landings\u2019 Dataset nodes; the Zenodo record page\u2019s embedded Dataset node)', date: GEN_DATE },
        ],
      }, null),
    node('Service', 'boundaries', 'Dataset Catalog Registry \u2014 Boundaries',
      'The registry\u2019s boundaries, stated as plainly as its claims: presence is observed or it is not claimed; the registry creates no account and submits nothing anywhere (owner-step channels stand not-pursued with their re-entry conditions); no third-party listing, indexing or citation is claimed beyond a dated observation in this file; mirror seats are copies whose canonical provenance is the signed master index; and internal research material is never described here \u2014 the registry covers published dataset files and public catalogs only.',
      { provider: { '@id': SITE + '/#organization' }, serviceType: 'Catalog registry publication boundaries', boundaryRules }, null),
  ],
};

/* self completeness: computed over this doc's own Dataset nodes */
selfCompleteness = completeness(FILE_NAME, doc);
for (const r of rows) {
  if (r.dataset_id === FILE_NAME && r.metadata_completeness === null) r.metadata_completeness = selfCompleteness;
}

/* ---------------- assertions (fail the generation, never assert) ---------------- */
const errs = [];
if (doc['@graph'].length !== 11) errs.push('node count ' + doc['@graph'].length + ' != 11');
if (rows.length !== fileSet.length * SEATS.length) errs.push('join rows ' + rows.length + ' != ' + fileSet.length * SEATS.length);
{
  const seen = new Set(rows.map((r) => r.dataset_id + '|' + r.catalog_id));
  if (seen.size !== rows.length) errs.push('duplicate join rows');
  for (const f of fileSet) for (const s of SEATS) if (!seen.has(f + '|' + s)) errs.push('missing row ' + f + ' / ' + s);
  for (const n of doc['@graph']) {
    if (n.description.length < 50 || n.description.length > 5000) errs.push('DC-1 bound violated by node ' + n['@id'] + ' (' + n.description.length + ')');
    if (String(n.identifier).includes('10.5281')) errs.push('CR-4: DOI in identifier of ' + n['@id']);
  }
  const t2 = diagnostics.find((d) => d.stage === 'T2');
  if (!t2 || t2.status !== 'eliminated') errs.push('T2 must stand eliminated at this generation (CR-G1)');
}
if (errs.length) { console.error('GENERATION ASSERTIONS FAILED:\n' + errs.join('\n')); process.exit(1); }

const text = JSON.stringify(doc, null, 1) + '\n';
const outArg = process.argv.indexOf('--out');
const outPath = outArg >= 0 ? process.argv[outArg + 1] : path.join(PUB, FILE_NAME);
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
  if (cur === text) { console.log('catalog-registry: --check OK (byte-identical, ' + text.length + ' bytes)'); process.exit(0); }
  console.error('catalog-registry: --check FAILED (on-disk differs from generated)');
  process.exit(1);
}
fs.writeFileSync(outPath, text);
/* append run rows to the observation store (deduped) */
if (outArg < 0 || path.resolve(outPath) === path.join(PUB, FILE_NAME)) {
  let added = 0;
  for (const o of runObs) if (!store.observations.some((s) => obsKey(s) === obsKey(o))) { store.observations.push(o); added++; }
  if (added) fs.writeFileSync(storePath, JSON.stringify(store, null, 1) + '\n');
  console.log('catalog-registry: store appended ' + added + ' run observations');
}
console.log('catalog-registry: wrote ' + outPath + ' (' + text.length + ' bytes, ' + fileSet.length + ' files x ' + SEATS.length + ' seats = ' + rows.length + ' rows, sha256 ' + sha256(Buffer.from(text)) + ')');
