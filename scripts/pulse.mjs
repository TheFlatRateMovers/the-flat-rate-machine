#!/usr/bin/env node
/**
 * pulse.mjs — ESTATE EDITION (draft, batch-pulse 2026-11-02)
 * ============================================================
 * Adapted from Henry's uploaded "Release Pulse" (Claude's pulse.mjs, 808 lines).
 * Kept from the original ("the brain"): gate model, IndexNow reason weights,
 * rubric-first ranking, 10-minute debounce, accepted-only state updates,
 * NDJSON receipts, atomic state writes, honesty note (submitted != indexed).
 * Replaced ("the eyes"): the change list no longer comes from crawling and
 * normalizing the live site. In seal mode it is the DIFF OF CONSECUTIVE SIGNED
 * INDEXES (ai-master-index.json) — exact digests, estate data only.
 *
 * Modes:
 *   init        Snapshot a baseline state (index digests + sitemap union) and
 *               ping NOTHING. Used once at installation, taking over from the
 *               parent-fired full-matrix RUN 1 (2026-11-02, main host, HTTP
 *               200, 272 URLs) + RUN 1b (API host, HTTP 202 Accepted, 12 URLs).
 *   seal        Diff --prior-index vs --index (or state baseline vs --index),
 *               ping added/changed/removed canonical URLs. THE standing mode,
 *               run at every seal close, after the new index is installed.
 *   full-matrix Ping the ENTIRE matrix — BOTH hosts: the site sitemap union +
 *               companion surfaces + the 12 API URLs. IndexNow is per-host, so
 *               sends group by host, each with its own keyLocation. Inaugural
 *               execution was the parent's live runs #1 + #1b; this mode
 *               remains for ordered re-fires / re-baselines.
 *   audit       === STUB === The weekly out-of-band check. Delegates to the
 *               ORIGINAL crawl engine (Henry's pulse.mjs) so changes made
 *               outside the Machine are caught. See runAudit() below.
 *
 * Inputs (estate, real schemas — no guessed fields):
 *   --index <path|url>        current signed index (ai-master-index.json)
 *   --prior-index <path|url>  previous signed index (seal mode; else state)
 *   --sitemap-dir <dir>       local public/ copy: sitemap.xml (+ sitemaps/),
 *                             news-sitemap.xml, feed.xml live here
 *   --rubric-counts <json>    {counts: {url: rows}} export of rubric.db
 *   --rubric-db <path>        rubric.db itself (read-only query via python3:
 *                             SELECT target_url, COUNT(*) FROM intent_query
 *                             GROUP BY target_url; www host normalized to apex)
 *   --feed <path>             local feed.xml (new-article detection: an added
 *                             URL present as a feed item link = new article)
 *   --ledger <csv>            blog ledger (schedule check, observation only)
 *   --facts <json>            optional {url: {noindex: true}} hold facts —
 *                             the seal-mode form of Claude's noindex gate
 *   --state <path>            pulse state file (default ./pulse-state.json)
 *   --receipts <path>         NDJSON receipts (live sends only)
 *   --out-dir <dir>           dry-run artifacts: ping-plan.json, coverage.json
 *   --key <k> --key-location <url>   IndexNow key (as the original)
 *   --dry-run                 build the plan, make NO network calls
 *   --force                   bypass debounce
 *   --accept-removals         bypass the removal blast guard
 *   --max-urls N              per-POST cap (protocol max 10000; default 10000)
 *   --min-interval-min N      debounce window (default 10, as the original)
 *
 * Exit codes: 0 ok (incl. dry-run) | 2 usage/input | 3 held by a gate |
 *             4 endpoint refused batch | 5 partial (some chunks refused)
 *
 * HONESTY (carried from the original, binding): an IndexNow 200/202 means
 * RECEIVED. It does not mean crawled or indexed. Receipts therefore record
 * gate:"submitted" only, and pulse output is NEVER written into the estate's
 * outcome-evidence ingest as crawled/indexed evidence (see DESIGN.md).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const PROTOCOL_MAX = 10000;
const HOST = 'theflatratemovers.com';
const SITE = `https://${HOST}`;
const API_HOST = 'api.theflatratemovers.com';
/* The API host's canonical set (run 1b's 12). The API serves sealed data, so
   in seal mode this set is pinged whenever any of its source distributions
   changed (API_SOURCE_RE below) — the endpoints' bytes derive from them. */
const API_PATHS = ['/', '/openapi.json', '/v1/services', '/v1/datasets', '/v1/intent', '/v1/graph', '/v1/index', '/v1/verify', '/v1/answer-evidence', '/v1/local-graph', '/v1/crawl-presence', '/v1/archives'];
const API_URLS = API_PATHS.map(p => `https://${API_HOST}${p}`);
const API_SOURCE_RE = /datasets-[^/]*\.json$|(best-json-)?entity-graph\.json$|ai-sitemap\.json$|src-index\.js$/;
/* Companion surfaces: pinged in full-matrix mode always, and in seal mode
   whenever their own digest changed. Run #1's five: feed, sitemap index,
   news sitemap, llms.txt, ai-sitemap — plus updates.xml once it exists. */
const COMPANIONS = ['/feed.xml', '/updates.xml', '/sitemap.xml', '/news-sitemap.xml', '/llms.txt', '/ai-sitemap.json']
  .map(p => SITE + p);
/* Never pinged, never feed items: provenance machinery itself. */
const NEVER_PING = [/ai-master-index\.json$/, /\.jws$/, /\/\.well-known\//, /signing-keys\.json$/];
/* Reason weights — Claude's, unchanged. */
const REASON_W = { 'new-article': 100000, 'added': 50000, 'removed': 20000, 'changed': 10000 };
/* Removal blast guard (estate-tuned, see DESIGN.md): more than this many
   sitemap-universe removals in one seal holds the removals (not the batch). */
const REMOVAL_HOLD_THRESHOLD = 10;

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function canon(u) { try { const x = new URL(u); x.protocol = 'https:'; if (x.hostname === 'www.' + HOST) x.hostname = HOST; return x.toString(); } catch { return u; } }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
async function readJsonSource(src) {
  if (/^https?:\/\//.test(src)) { const r = await fetch(src); if (!r.ok) throw new Error(`fetch ${src}: HTTP ${r.status}`); return { json: JSON.parse(await r.text()), bytes: null }; }
  const bytes = fs.readFileSync(src); return { json: JSON.parse(bytes.toString('utf8')), bytes };
}
function writeJson(p, o) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(o, null, 1) + '\n'); }
function atomicWrite(p, text) { const t = p + '.tmp-' + process.pid; fs.writeFileSync(t, text); fs.renameSync(t, p); }

/* ---------- signed index ---------- */
function indexMap(idx) {
  const m = new Map();
  for (const d of idx.distribution || []) {
    if (!d.contentUrl || !d.digest) continue;
    m.set(canon(d.contentUrl), {
      digest: d.digest.value, byteSize: d.digest.byteSize ?? null,
      name: d.name || '', dateModified: d.dateModified || null,
      encodingFormat: d.encodingFormat || '',
    });
  }
  return m;
}
function diffIndexes(prior, current) {
  const added = [], removed = [], changed = [];
  for (const [u, c] of current) {
    const p = prior.get(u);
    if (!p) added.push(u);
    else if (p.digest !== c.digest) changed.push(u);
  }
  for (const u of prior.keys()) if (!current.has(u)) removed.push(u);
  return { added, removed, changed };
}

/* ---------- sitemap universe (local copies) ---------- */
function locs(xml) { return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(m => canon(m[1])); }
function loadUniverse(dir) {
  const sections = {}; const union = new Set();
  const files = [];
  const idxPath = path.join(dir, 'sitemap.xml');
  if (fs.existsSync(idxPath)) files.push(['sitemap-index', idxPath]);
  const sub = path.join(dir, 'sitemaps');
  if (fs.existsSync(sub)) for (const f of fs.readdirSync(sub).filter(f => f.endsWith('.xml')).sort()) files.push([f.replace(/\.xml$/, ''), path.join(sub, f)]);
  const news = path.join(dir, 'news-sitemap.xml');
  if (fs.existsSync(news)) files.push(['news', news]);
  for (const [name, f] of files) {
    const set = new Set(locs(fs.readFileSync(f, 'utf8')));
    if (name === 'sitemap-index') continue; // index file: its locs are section files, not pages
    sections[name] = set.size;
    for (const u of set) union.add(u);
  }
  return { union, sections };
}

/* ---------- rubric counts (real schema) ---------- */
function loadRubricCounts(args) {
  if (args.rubricCounts) { const j = readJson(args.rubricCounts); const m = new Map(); for (const [u, c] of Object.entries(j.counts || j)) m.set(canon(u), c); return m; }
  if (args.rubricDb) {
    const py = "import sqlite3,sys,json\ncon=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True)\nprint(json.dumps({r[0]:r[1] for r in con.execute('SELECT target_url, COUNT(*) FROM intent_query GROUP BY target_url')}))";
    const r = spawnSync('python3', ['-c', py, args.rubricDb], { encoding: 'utf8', maxBuffer: 1 << 24 });
    if (r.status !== 0) throw new Error('rubric-db read failed: ' + r.stderr);
    const m = new Map(); for (const [u, c] of Object.entries(JSON.parse(r.stdout))) m.set(canon(u), c); return m;
  }
  return new Map();
}

/* ---------- blog ledger schedule check (observation only) ---------- */
function scheduleCheck(ledgerPath) {
  if (!ledgerPath || !fs.existsSync(ledgerPath)) return null;
  const lines = fs.readFileSync(ledgerPath, 'utf8').trim().split('\n');
  const head = lines[0].split(',');
  const iDate = head.indexOf('slot_date'), iStatus = head.indexOf('status'), iSlug = head.indexOf('slug');
  const today = new Date().toISOString().slice(0, 10);
  const overdue = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    const published = /^published/.test((cells[iStatus] || '').replace(/^"|"$/g, ''));
    if (cells[iDate] && cells[iDate] < today && !published) overdue.push({ slot_date: cells[iDate], slug: cells[iSlug] });
  }
  return { overdue, note: 'observation only — publishing cadence is the blog pipeline\'s, not a ping gate' };
}

/* ---------- state ---------- */
function loadState(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }
function saveState(p, s) { atomicWrite(p, JSON.stringify(s, null, 1) + '\n'); }
function freshState() { return { version: 2, tool: 'pulse-estate', host: HOST, baselineSealSha: null, baselineIndexDigests: {}, sitemapUnion: [], urls: {}, history: [] }; }

/* ---------- plan builder (seal + full-matrix share this) ---------- */
function buildPlan({ mode, diff, universe, state, rubric, feedLinks, facts, args }) {
  const pings = [], held = [];
  const priorUnion = new Set((state && state.sitemapUnion) || []);
  const push = (url, reason, meta) => {
    const rows = rubric.get(url) || 0;
    const prio = (REASON_W[reason] || 0) + rows;
    const item = { url, reason, intentRows: rows, prio, ...(meta || {}) };
    if (facts && facts[url] && facts[url].noindex) { held.push({ ...item, gate: 'noindex-facts', detail: 'held by supplied facts (seal-mode noindex gate)' }); return; }
    const last = state && state.urls && state.urls[url] && state.urls[url].lastPinged;
    if (!args.force && last && (Date.now() - Date.parse(last)) < args.minIntervalMin * 60000 && reason !== 'new-article' && reason !== 'added') {
      held.push({ ...item, gate: 'debounced', detail: `pinged ${last}, inside ${args.minIntervalMin} min` }); return;
    }
    pings.push(item);
  };
  if (mode === 'full-matrix') {
    for (const u of universe.union) push(u, state && state.baselineSealSha ? 'changed' : 'added');
    for (const c of COMPANIONS) if (!universe.union.has(c)) push(c, 'changed', { companion: true });
    for (const u of API_URLS) push(u, 'changed', { api: true });
  } else { // seal
    const removedInUnion = diff.removed.filter(u => priorUnion.has(u));
    const removalHold = removedInUnion.length > REMOVAL_HOLD_THRESHOLD && !args.acceptRemovals;
    const handle = (url, kind) => {
      if (NEVER_PING.some(re => re.test(url))) { held.push({ url, reason: kind, gate: 'never-ping', detail: 'provenance machinery' }); return; }
      let u; try { u = new URL(url); } catch { return; }
      if (u.hostname !== HOST) return; // repo/other-host distributions: counted in coverage, never pinged
      let reason = kind;
      if (kind === 'added' && feedLinks && feedLinks.has(url)) reason = 'new-article';
      if (kind === 'removed') {
        if (!priorUnion.has(url)) { held.push({ url, reason: kind, gate: 'not-in-prior-union', detail: 'removal not in the baseline sitemap union — nothing live to de-index' }); return; }
        if (removalHold) { held.push({ url, reason: kind, gate: 'removal-blast', detail: `${removedInUnion.length} universe removals > ${REMOVAL_HOLD_THRESHOLD} threshold` }); return; }
      } else if (!universe.union.has(url) && !COMPANIONS.includes(url)) {
        held.push({ url, reason: kind, gate: 'not-in-sitemap-union', detail: 'changed distribution is not a canonical sitemap URL (per-page JSON, data txt, graph, etc.)' }); return;
      }
      push(url, reason);
    };
    for (const u of diff.added) handle(u, 'added');
    for (const u of diff.changed) handle(u, 'changed');
    for (const u of diff.removed) handle(u, 'removed');
    /* API host: its endpoints serve the sealed datasets/graphs/index, so any
       source-distribution change re-pings the whole 12-URL API set. */
    const apiTriggered = [...diff.added, ...diff.changed, ...diff.removed].some(u => API_SOURCE_RE.test(u));
    if (apiTriggered) for (const u of API_URLS) push(u, 'changed', { api: true, detail: 'API source distribution changed in this seal' });
  }
  pings.sort((a, b) => b.prio - a.prio || a.url.localeCompare(b.url));
  return { pings, held };
}

function coverageReport({ mode, universe, plan, diff, currentMap }) {
  const pingedSet = new Set(plan.pings.map(p => p.url));
  const heldUnion = plan.held.filter(h => universe.union.has(h.url));
  const accounted = new Set([...pingedSet, ...heldUnion.map(h => h.url)]);
  const unchanged = [...universe.union].filter(u => !accounted.has(u));
  const unionNotInIndex = [...universe.union].filter(u => !currentMap.has(u));
  return {
    mode,
    hosts: {
      [HOST]: { universe: universe.union.size, pinged: plan.pings.filter(p => { try { return new URL(p.url).hostname === HOST; } catch { return false; } }).length },
      [API_HOST]: { universe: API_URLS.length, pinged: plan.pings.filter(p => p.api).length },
    },
    matrixTotal: universe.union.size + API_URLS.length,
    universe: universe.union.size,
    sections: universe.sections,
    pinged: plan.pings.length,
    pingedInUnion: [...pingedSet].filter(u => universe.union.has(u)).length,
    companionsPinged: plan.pings.filter(p => p.companion || COMPANIONS.includes(p.url)).length,
    held: plan.held.length,
    heldByGate: plan.held.reduce((a, h) => { a[h.gate] = (a[h.gate] || 0) + 1; return a; }, {}),
    unchangedInUnion: unchanged.length,
    unionUrlsNotDistributions: unionNotInIndex.length,
    distributionDelta: diff ? { added: diff.added.length, changed: diff.changed.length, removed: diff.removed.length } : null,
    accounting: 'site: pinged ∪ held(union) ∪ unchanged == sitemap universe; API: the fixed 12-URL set, pinged whole or not at all',
    meaning: 'IndexNow acceptance means received/submitted — not crawled, not indexed.',
  };
}

/* ---------- IndexNow send (live path; never exercised in prep) ---------- */
async function sendPing({ host, key, keyLocation, urls }) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation, urlList: urls }),
  });
  return { status: res.status, text: await res.text().catch(() => '') };
}

/* ---------- modes ---------- */
async function runInit(args) {
  const { json: idx, bytes } = await readJsonSource(args.index);
  const current = indexMap(idx);
  const universe = loadUniverse(args.sitemapDir);
  const st = freshState();
  st.baselineSealSha = bytes ? sha256(bytes) : null;
  st.baselineIndexDigests = Object.fromEntries([...current].map(([u, v]) => [u, v.digest]));
  st.sitemapUnion = [...universe.union].sort();
  st.initializedFrom = 'post-run-1/1b baseline (full matrix pinged live 2026-11-02 on both hosts: main 200, API 202)';
  saveState(args.state, st);
  console.log(`init: baseline sealed at ${st.baselineSealSha} — ${current.size} distributions, union ${universe.union.size}. Nothing pinged.`);
  return 0;
}

async function runSealOrMatrix(args) {
  const mode = args.mode;
  const { json: idx, bytes } = await readJsonSource(args.index);
  const current = indexMap(idx);
  const universe = loadUniverse(args.sitemapDir);
  const rubric = loadRubricCounts(args);
  const state = loadState(args.state) || freshState();
  let diff = null;
  if (mode === 'seal') {
    let prior;
    if (args.priorIndex) { prior = indexMap((await readJsonSource(args.priorIndex)).json); }
    else if (state.baselineIndexDigests && Object.keys(state.baselineIndexDigests).length) {
      prior = new Map(Object.entries(state.baselineIndexDigests).map(([u, d]) => [u, { digest: d }]));
    } else throw new Error('seal mode needs --prior-index or an initialized state');
    diff = diffIndexes(prior, current);
  }
  let feedLinks = null;
  if (args.feed && fs.existsSync(args.feed)) feedLinks = new Set(locs(fs.readFileSync(args.feed, 'utf8')));
  const facts = args.facts ? readJson(args.facts) : null;
  const plan = buildPlan({ mode, diff, universe, state, rubric, feedLinks, facts, args });
  const coverage = coverageReport({ mode, universe, plan, diff, currentMap: current });
  const sched = scheduleCheck(args.ledger);
  const report = { tool: 'pulse-estate', mode, dryRun: !!args.dryRun, ts: new Date().toISOString(), coverage, scheduleCheck: sched, held: plan.held, pingPlan: plan.pings };
  if (args.outDir) {
    writeJson(path.join(args.outDir, 'ping-plan.json'), { mode, count: plan.pings.length, urls: plan.pings });
    writeJson(path.join(args.outDir, 'coverage.json'), coverage);
  }
  if (args.json) console.log(JSON.stringify(report, null, 1));
  else {
    console.log(`pulse[${mode}]${args.dryRun ? ' DRY-RUN' : ''}: universe ${coverage.universe}, ping ${plan.pings.length}, held ${plan.held.length}, unchanged ${coverage.unchangedInUnion}`);
    for (const p of plan.pings.slice(0, 15)) console.log(`  ${p.prio}\t${p.reason}\trows=${p.intentRows}\t${p.url}`);
  }
  if (args.dryRun) return plan.held.some(h => h.gate === 'removal-blast' || h.gate === 'noindex-facts') ? 3 : 0;
  if (!plan.pings.length) { advanceBaseline(args, state, idx, bytes, current, universe); return 0; }
  /* key resolution mirrors the original: --key, else fetch keyLocation file */
  let key = args.key || process.env.INDEXNOW_KEY || null;
  if (!key && args.keyLocation) { const r = await fetch(args.keyLocation); if (r.ok) key = (await r.text()).trim(); }
  if (!key) { console.error('no IndexNow key available'); return 2; }
  /* IndexNow is PER-HOST: one POST sequence per host, each with that host's
     own keyLocation (main: site root file; API: served today by the interim
     standalone worker flat-rate-indexnow-key-api, absorbed into the canonical
     API bundle at the next API refresh — see DESIGN.md). Receipts record the
     ACTUAL status per host: 200 on the main host, 202 on the API host in the
     inaugural runs — never rounded or normalized. */
  const receipts = [];
  let refused = 0, chunksTotal = 0;
  const byHost = new Map();
  for (const p of plan.pings) { const h = new URL(p.url).hostname; if (!byHost.has(h)) byHost.set(h, []); byHost.get(h).push(p); }
  for (const [host, hostPings] of byHost) {
    const keyLocation = `https://${host}/${key}.txt`;
    for (let i = 0; i < hostPings.length; i += args.maxUrls) {
      const chunk = hostPings.slice(i, i + args.maxUrls);
      const urls = chunk.map(p => p.url);
      const { status, text } = await sendPing({ host, key, keyLocation, urls });
      chunksTotal++;
      const accepted = status === 200 || status === 202;
      if (!accepted) refused++;
      receipts.push({ ts: new Date().toISOString(), tool: 'pulse-estate', mode, endpoint: 'https://api.indexnow.org/indexnow', host, httpStatus: status, gate: accepted ? 'submitted' : 'refused', detail: text.slice(0, 200), urls: chunk.map(p => ({ url: p.url, reason: p.reason, accepted, intentRows: p.intentRows })) });
      if (accepted) for (const p of chunk) state.urls[p.url] = { lastPinged: new Date().toISOString(), lastReason: p.reason, status: 'submitted' };
      if (status === 400 || status === 403 || status === 422) break; // protocol-level refusal: stop this host, as the original
    }
  }
  if (args.receipts) { fs.mkdirSync(path.dirname(args.receipts), { recursive: true }); fs.appendFileSync(args.receipts, receipts.map(r => JSON.stringify(r)).join('\n') + '\n'); }
  advanceBaseline(args, state, idx, bytes, current, universe);
  return refused ? (refused === chunksTotal ? 4 : 5) : 0;
}

function advanceBaseline(args, state, idx, bytes, current, universe) {
  state.baselineSealSha = bytes ? sha256(bytes) : state.baselineSealSha;
  state.baselineIndexDigests = Object.fromEntries([...current].map(([u, v]) => [u, v.digest]));
  state.sitemapUnion = [...universe.union].sort();
  state.history = [...(state.history || []), { ts: new Date().toISOString(), seal: state.baselineSealSha }].slice(-48);
  saveState(args.state, state);
}

/* ---------- audit mode: STUB delegating to the original crawl engine ------
   The weekly audit exists to catch changes made OUTSIDE the Machine (a hand
   edit on a mirror, a platform-side change). Seal mode cannot see those —
   its baseline is the Machine's own index. The audit therefore keeps
   Claude's original normalized-crawl engine UNCHANGED: place Henry's
   original pulse.mjs at scripts/pulse-audit-original.mjs (seal-time step)
   and this stub delegates with the original's own flags. No crawl logic is
   re-implemented here on purpose: one engine, one behavior, upstream file. */
function runAudit(args) {
  const engine = args.auditEngine;
  if (!engine || !fs.existsSync(engine)) {
    console.error('AUDIT MODE (stub): the original crawl engine is not installed yet.');
    console.error('Seal-time step: copy Henry\'s pulse.mjs to scripts/pulse-audit-original.mjs, then re-run with --audit-engine <path>.');
    console.error('Until then the weekly audit runs the original file directly from the pulse-review copy.');
    return 3;
  }
  const r = spawnSync('node', [engine, ...args.auditPassthrough], { stdio: 'inherit' });
  return r.status ?? 3;
}

/* ---------- CLI ---------- */
function parseArgs(argv) {
  const a = { mode: 'seal', state: './pulse-state.json', maxUrls: PROTOCOL_MAX, minIntervalMin: 10, auditPassthrough: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = () => argv[++i];
    if (k === '--mode') a.mode = v();
    else if (k === '--index') a.index = v();
    else if (k === '--prior-index') a.priorIndex = v();
    else if (k === '--sitemap-dir') a.sitemapDir = v();
    else if (k === '--rubric-counts') a.rubricCounts = v();
    else if (k === '--rubric-db') a.rubricDb = v();
    else if (k === '--feed') a.feed = v();
    else if (k === '--ledger') a.ledger = v();
    else if (k === '--facts') a.facts = v();
    else if (k === '--state') a.state = v();
    else if (k === '--receipts') a.receipts = v();
    else if (k === '--out-dir') a.outDir = v();
    else if (k === '--key') a.key = v();
    else if (k === '--key-location') a.keyLocation = v();
    else if (k === '--audit-engine') a.auditEngine = v();
    else if (k === '--dry-run') a.dryRun = true;
    else if (k === '--force') a.force = true;
    else if (k === '--accept-removals') a.acceptRemovals = true;
    else if (k === '--json') a.json = true;
    else if (k === '--max-urls') a.maxUrls = Math.min(PROTOCOL_MAX, parseInt(v(), 10));
    else if (k === '--min-interval-min') a.minIntervalMin = parseInt(v(), 10);
    else if (k === '--') a.auditPassthrough = argv.slice(i + 1), i = argv.length;
    else { console.error('unknown arg: ' + k); process.exit(2); }
  }
  return a;
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  try {
    if (args.mode === 'audit') process.exit(runAudit(args));
    if (!args.index || !args.sitemapDir) { console.error('--index and --sitemap-dir are required'); process.exit(2); }
    if (args.mode === 'init') process.exit(await runInit(args));
    if (args.mode === 'seal' || args.mode === 'full-matrix') process.exit(await runSealOrMatrix(args));
    console.error('unknown mode: ' + args.mode); process.exit(2);
  } catch (e) { console.error('pulse error: ' + e.message); process.exit(2); }
})();
