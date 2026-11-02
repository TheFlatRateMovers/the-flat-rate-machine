#!/usr/bin/env node
/**
 * RELEASE PULSE — a digest-diff IndexNow trigger.
 *
 * Instead of pinging by hand at batch close, every run:
 *   1. discovers the URL universe  (sitemap + RSS feed + signed master index + rubric targets + tracked state)
 *   2. fetches each page and hashes a NORMALISED copy (volatile tokens, dates, scripts and styles removed)
 *   3. diffs against the last run's state  ->  added / changed / revived / removed / redirected
 *   4. re-checks every "changed" page twice so volatile pages never trigger a ping
 *   5. gates the batch  (noindex, broken JSON-LD, canonical drift, article schema, sitewide-change guard)
 *   6. ranks the batch with the search-intent rubric (pages that answer the most queries go first)
 *   7. POSTs ONE IndexNow batch, writes receipts, and updates state ONLY for URLs that were accepted
 *
 * Zero dependencies. Node 20+.  See README.md.
 *
 * HONESTY NOTE: an IndexNow 200/202 means "received", not "crawled" or "indexed".
 * Receipts therefore record gate "submitted" only. Never mark the rubric's crawled/indexed
 * gates from a ping receipt; mark them from Bing Webmaster Tools data or server logs.
 */
import { createHash } from 'node:crypto';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const VERSION = '1.0.0';
const UA = `ReleasePulse/${VERSION} (+https://theflatratemovers.com/)`;
const ZW = /[​-‍⁠﻿]/g;
const sha256 = (d) => createHash('sha256').update(d).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BACKOFF_MS = () => Number(process.env.PULSE_BACKOFF_MS ?? 500);

class PulseError extends Error {
  constructor(msg, code = 1) { super(msg); this.exitCode = code; }
}

/* ───────────────────────────── CLI ───────────────────────────── */

const HELP = `
Release Pulse ${VERSION} — digest-diff IndexNow trigger

  node pulse.mjs [options]

Core
  --host <h>            site host                               (default theflatratemovers.com)
  --base <url>          where to crawl from                     (default https://<host>)
  --key <k>             IndexNow key (or env INDEXNOW_KEY); key file must be live at <base>/<key>.txt
  --key-location <url>  only if the key file is not at the site root
  --endpoint <url>      IndexNow endpoint                       (default https://api.indexnow.org/indexnow)

Modes
  --dry-run             detect and report, send nothing, write nothing
  --baseline            seal current state as "already known" without pinging
  --ping-all            first run only: ping everything instead of baselining
  --force               ignore the per-URL debounce window
  --accept-sitewide     allow a ping when >= blast-ratio of tracked pages changed at once

Inputs
  --sitemap <url>  --feed <url>  --index <url>
  --rubric <url|path|none>   search-intent rubric  (default <base>/datasets-intent-coverage.json)
  --schedule <path>          release schedule JSON (see schedule.example.json)
  --extra-url <url>          always include (repeatable)
  --volatile <regex>         strip from page text before hashing (repeatable)
  --count-dates              treat dateModified / modified_time changes as content changes

Tuning
  --min-gap <min>       debounce per URL                         (default 10)
  --max-urls <n>        URLs per POST, protocol max 10000        (default 10000)
  --concurrency <n>     parallel fetches                         (default 8)
  --blast-ratio <0-1>   sitewide-change guard ratio              (default 0.5)
  --blast-min <n>       guard only applies from this many pages  (default 25)
  --min-inbound <n>     internal links a new article should have (default 3)
  --no-etag             always re-download (full integrity pass)
  --no-gate             skip noindex / JSON-LD gates (not recommended)
  --strict-integrity    abort if live files drift from the signed master index

Output
  --state <path>        (default .indexnow/state.json)
  --receipts <path>     (default .indexnow/receipts.ndjson)
  --report <path>       write a markdown report (also appended to $GITHUB_STEP_SUMMARY)
  --publish-receipts <path>   write the last 50 receipts as JSON (for a public pulse log)
  --json                print the run summary as JSON only
  --no-color  --quiet  --help

Exit codes: 0 ok · 1 error · 2 partial failure (some URLs not accepted) · 3 preflight failed · 4 integrity abort
`;

const BOOL = new Set(['dry-run', 'baseline', 'ping-all', 'force', 'accept-sitewide', 'count-dates', 'no-etag',
  'no-gate', 'strict-integrity', 'json', 'no-color', 'quiet', 'help']);
const MULTI = new Set(['volatile', 'extra-url']);

export function parseArgs(argv, env = process.env) {
  const raw = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new PulseError(`Unexpected argument: ${a}`);
    const eq = a.indexOf('=');
    const k = eq === -1 ? a.slice(2) : a.slice(2, eq);
    let v = eq === -1 ? undefined : a.slice(eq + 1);
    if (BOOL.has(k)) { raw[k] = true; continue; }
    if (v === undefined) { v = argv[++i]; if (v === undefined) throw new PulseError(`--${k} needs a value`); }
    if (MULTI.has(k)) (raw[k] ||= []).push(v); else raw[k] = v;
  }
  const num = (v, d) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
  const host = (raw.host || env.INDEXNOW_HOST || 'theflatratemovers.com').toLowerCase();
  const base = (raw.base || `https://${host}`).replace(/\/+$/, '');
  return {
    help: !!raw.help, host, base,
    key: raw.key || env.INDEXNOW_KEY || '',
    keyLocation: raw['key-location'] || env.INDEXNOW_KEY_LOCATION || '',
    endpoint: raw.endpoint || env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow',
    dryRun: !!raw['dry-run'], baseline: !!raw.baseline, pingAll: !!raw['ping-all'], force: !!raw.force,
    acceptSitewide: !!raw['accept-sitewide'], countDates: !!raw['count-dates'], noEtag: !!raw['no-etag'],
    noGate: !!raw['no-gate'], strictIntegrity: !!raw['strict-integrity'], json: !!raw.json,
    noColor: !!raw['no-color'], quiet: !!raw.quiet,
    sitemap: raw.sitemap || `${base}/sitemap.xml`,
    feed: raw.feed || `${base}/feed.xml`,
    index: raw.index || `${base}/ai-master-index.json`,
    rubric: raw.rubric ?? `${base}/datasets-intent-coverage.json`,
    schedule: raw.schedule || '',
    extraUrls: raw['extra-url'] || [],
    volatile: (raw.volatile || []).map((s) => new RegExp(s, 'g')),
    minGapMin: num(raw['min-gap'], 10),
    maxUrls: Math.min(num(raw['max-urls'], 10000), 10000),
    concurrency: Math.max(1, num(raw.concurrency, 8)),
    blastRatio: num(raw['blast-ratio'], 0.5),
    blastMin: num(raw['blast-min'], 25),
    minInbound: num(raw['min-inbound'], 3),
    state: raw.state || '.indexnow/state.json',
    receipts: raw.receipts || '.indexnow/receipts.ndjson',
    report: raw.report || '',
    publishReceipts: raw['publish-receipts'] || '',
  };
}

/* ─────────────────────────── networking ─────────────────────────── */

export async function request(url, { method = 'GET', headers = {}, body, redirect = 'follow', retries = 3, timeoutMs = 30000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { method, headers: { 'user-agent': UA, ...headers }, body, redirect, signal: AbortSignal.timeout(timeoutMs) });
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        const ra = Number(res.headers.get('retry-after'));
        const wait = Number.isFinite(ra) && ra > 0 ? Math.min(ra, 60) * 1000 : BACKOFF_MS() * 2 ** attempt;
        await res.arrayBuffer().catch(() => {});
        await sleep(wait);
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await sleep(BACKOFF_MS() * 2 ** attempt);
    }
  }
  throw lastErr;
}

async function pool(items, limit, worker) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await worker(items[i], i); }
  }));
  return out;
}

/* ───────────────────────────── URLs ───────────────────────────── */

/** canonical identity: https://<host><path><query>, no fragment. Returns {url} | {hash:true} | null (foreign host). */
export function toCanon(u, host, relativeTo) {
  let p;
  try { p = new URL(u, relativeTo || `https://${host}/`); } catch { return null; }
  if (p.hostname.toLowerCase() !== host) return null;
  if (p.hash && p.hash.length > 1) return { hash: true };
  return { url: `https://${host}${p.pathname}${p.search}` };
}
const pathKey = (canon) => { const p = new URL(canon).pathname; return p.length > 1 ? p.replace(/\/+$/, '') : '/'; };

/* ───────────────────────── normalisation ───────────────────────── */

export function kindOf(canon, contentType = '') {
  const p = new URL(canon).pathname;
  if (/feed\.xml$|\.rss$|\.atom$/i.test(p) || /rss|atom/i.test(contentType)) return 'feed';
  if (/sitemap[^/]*\.xml$/i.test(p)) return 'sitemap';
  if (/html/i.test(contentType) || p.endsWith('/') || !/\.[a-z0-9]+$/i.test(p)) return 'html';
  return 'raw';
}

/**
 * Text that matters for "did the content change?".
 * Strips: comments, non-LD scripts, styles, nonces, Cloudflare email-obfuscation tokens (random per request),
 * dateModified / modified_time (a date bump alone is not a content change), feed lastBuildDate, sitemap lastmod.
 */
export function normalize(kind, text, { extra = [], countDates = false } = {}) {
  let t = text.replace(ZW, '');
  if (kind === 'html') {
    t = t.replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<script\b(?![^>]*type=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/\s(?:nonce|integrity)=["'][^"']*["']/gi, '')
      .replace(/\/cdn-cgi\/l\/email-protection#[0-9a-f]+/gi, '/cdn-cgi/l/email-protection#')
      .replace(/data-cfemail=["'][0-9a-f]+["']/gi, 'data-cfemail=""');
    if (!countDates) {
      t = t.replace(/"dateModified"\s*:\s*"[^"]*"/g, '"dateModified":""')
        .replace(/<meta\b[^>]*(?:article:modified_time|og:updated_time)[^>]*>/gi, '');
    }
  } else if (kind === 'feed') {
    t = t.replace(/<lastBuildDate>[\s\S]*?<\/lastBuildDate>/gi, '');
  } else if (kind === 'sitemap') {
    t = t.replace(/<lastmod>[\s\S]*?<\/lastmod>/gi, '');
  }
  for (const re of extra) t = t.replace(re, '');
  return t.replace(/\s+/g, ' ').trim();
}

const attr = (tag, name) => (tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i')) || [])[1];

export function extractFacts(html, canon, host) {
  const text = html.replace(ZW, '');
  const facts = { canonical: null, noindex: false, ld: [], ldErrors: 0, links: [], hashLinks: 0 };
  for (const tag of text.match(/<link\b[^>]*>/gi) || []) {
    if (/rel\s*=\s*["']canonical["']/i.test(tag)) facts.canonical = attr(tag, 'href') || null;
  }
  for (const tag of text.match(/<meta\b[^>]*>/gi) || []) {
    if (/name\s*=\s*["']robots["']/i.test(tag) && /noindex/i.test(attr(tag, 'content') || '')) facts.noindex = true;
  }
  const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(text))) {
    try {
      const j = JSON.parse(m[1].trim());
      const nodes = Array.isArray(j) ? j : j['@graph'] ? j['@graph'] : [j];
      facts.ld.push(...nodes);
    } catch { facts.ldErrors++; }
  }
  const seen = new Set();
  for (const tag of text.match(/<a\b[^>]*>/gi) || []) {
    const href = attr(tag, 'href');
    if (!href) continue;
    if (/^#/.test(href)) { if (href.length > 1) facts.hashLinks++; continue; }
    const c = toCanon(href, host, canon);
    if (!c) continue;
    if (c.hash) { facts.hashLinks++; continue; }
    const k = pathKey(c.url);
    if (!seen.has(k)) { seen.add(k); facts.links.push(k); }
  }
  return facts;
}

/* ──────────────────────────── RSS feed ──────────────────────────── */

const decode = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&apos;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
const tagText = (block, name) => { const m = block.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i')); return m ? decode(m[1]) : ''; };

/** Tolerates zero-width characters inside tag names (seen in the live feed), validates what it can. */
export function parseFeed(xmlRaw, host, now = Date.now()) {
  const xml = xmlRaw.replace(ZW, '');
  const items = [];
  for (const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const b = m[1];
    items.push({
      title: tagText(b, 'title'), link: tagText(b, 'link'), guid: tagText(b, 'guid') || tagText(b, 'link'),
      pubDate: tagText(b, 'pubDate'), category: tagText(b, 'category'), description: tagText(b, 'description'),
    });
  }
  const health = { items: items.length, zeroWidthChars: (xmlRaw.match(ZW) || []).length, problems: [] };
  const open = (xml.match(/<item\b/gi) || []).length, close = (xml.match(/<\/item>/gi) || []).length;
  if (open !== close) health.problems.push(`unbalanced <item> tags (${open} open / ${close} close)`);
  if (!/<channel\b/i.test(xml)) health.problems.push('no <channel> element');
  if (health.zeroWidthChars) health.problems.push(`${health.zeroWidthChars} zero-width character(s) in raw feed; strict XML parsers may reject it`);
  const guids = new Map();
  for (const it of items) {
    const label = it.title.slice(0, 50) || it.link;
    if (!it.link) health.problems.push(`item without <link>: "${label}"`);
    if (!it.pubDate) health.problems.push(`item without <pubDate>: "${label}"`);
    else if (Number.isNaN(Date.parse(it.pubDate))) health.problems.push(`unparseable pubDate: "${label}"`);
    else if (Date.parse(it.pubDate) > now + 5 * 60000) health.problems.push(`future-dated item (scheduled post leaking?): "${label}"`);
    if (guids.has(it.guid)) health.problems.push(`duplicate guid: "${label}"`); else guids.set(it.guid, 1);
    const c = it.link ? toCanon(it.link, host) : null;
    if (it.link && (!c || c.hash)) health.problems.push(`link not a clean ${host} URL: ${it.link}`);
    it.canon = c && c.url ? c.url : null;
    it.ts = Date.parse(it.pubDate) || 0;
  }
  return { items, health };
}

/* ─────────────────────────── search-intent rubric ─────────────────────────── */

const PAGE_FIELDS = ['targetPage', 'target_page', 'targetUrl', 'target_url', 'resolvedPage', 'resolved_page', 'pageUrl', 'page_url', 'page', 'url'];
const QUERY_FIELDS = ['query', 'queryText', 'query_text', 'queryString', 'query_string', 'q', 'text'];
const CLASS_FIELDS = ['intentClass', 'intent_class', 'class'];
const SERVICE_FIELDS = ['service', 'serviceId', 'service_id'];
const firstStr = (o, fields) => { for (const f of fields) if (typeof o[f] === 'string' && o[f]) return o[f]; return ''; };

/** Walks any JSON shape; a "row" is an object that has BOTH a query-ish and a page-ish string field. */
export function parseRubric(json, host) {
  const byPath = new Map();
  let rows = 0, hashTargets = 0;
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== 'object') return;
    const q = firstStr(n, QUERY_FIELDS), pg = firstStr(n, PAGE_FIELDS);
    if (q && pg) {
      rows++;
      const c = toCanon(pg, host);
      if (c && c.hash) hashTargets++;
      else if (c && c.url) {
        const k = pathKey(c.url);
        const e = byPath.get(k) || { rows: 0, classes: new Set(), services: new Set(), canon: c.url };
        e.rows++;
        const ic = firstStr(n, CLASS_FIELDS), sv = firstStr(n, SERVICE_FIELDS);
        if (ic) e.classes.add(ic); if (sv) e.services.add(sv);
        byPath.set(k, e);
      }
    }
    for (const v of Object.values(n)) if (v && typeof v === 'object') walk(v);
  };
  walk(json);
  return { byPath, rows, hashTargets, pages: byPath.size };
}

/* ───────────────────────────── schedule ───────────────────────────── */

export function checkSchedule(schedule, items, now = Date.now(), graceMin = 45) {
  const rows = schedule.map((s) => {
    const t = Date.parse(s.slot);
    const re = new RegExp(s.match, 'i');
    const found = items.find((it) => re.test(it.title) || re.test(it.link));
    let status = 'upcoming';
    if (found) status = 'published';
    else if (now >= t) status = now - t > graceMin * 60000 ? 'overdue' : 'due';
    return { slot: s.slot, service: s.service || s.match, status, url: found?.link || '' };
  });
  const count = (st) => rows.filter((r) => r.status === st).length;
  return { rows, published: count('published'), due: count('due'), overdue: count('overdue'), upcoming: count('upcoming') };
}

/* ────────────────────────────── gates ────────────────────────────── */

export function gate(url, facts, { isArticle, xRobots }) {
  const fails = [], warns = [];
  if (xRobots && /noindex/i.test(xRobots)) fails.push('X-Robots-Tag: noindex');
  if (!facts) return { fails, warns };
  if (facts.noindex) fails.push('meta robots noindex');
  if (facts.ldErrors) fails.push(`${facts.ldErrors} JSON-LD block(s) fail to parse`);
  if (!facts.canonical) warns.push('no canonical link');
  else {
    const a = facts.canonical.replace(/\/+$/, ''), b = url.replace(/\/+$/, '');
    if (a !== b) warns.push(`canonical points elsewhere (${facts.canonical})`);
  }
  if (isArticle) {
    const art = facts.ld.find((n) => [].concat(n['@type'] || []).some((t) => /^(BlogPosting|Article|NewsArticle|TechArticle)$/i.test(t)));
    if (!art) warns.push('article has no BlogPosting/Article JSON-LD');
    else if (!art.datePublished) warns.push('article JSON-LD has no datePublished');
  }
  return { fails, warns };
}

/* ───────────────────────────── state ───────────────────────────── */

const emptyState = (host) => ({ version: 1, host, createdAt: new Date().toISOString(), lastRun: null, urls: {}, feed: { seen: [] }, history: [] });

async function loadState(file, host) {
  try {
    const s = JSON.parse(await fsp.readFile(file, 'utf8'));
    if (s.version !== 1 || s.host !== host) throw new PulseError(`State file ${file} is for another host/version; delete it to re-baseline`);
    s.urls ||= {}; s.feed ||= { seen: [] }; s.history ||= [];
    return { state: s, fresh: false };
  } catch (e) {
    if (e instanceof PulseError) throw e;
    if (e.code === 'ENOENT') return { state: emptyState(host), fresh: true };
    throw new PulseError(`Cannot read state ${file}: ${e.message}`);
  }
}

async function writeAtomic(file, data) {
  await fsp.mkdir(path.dirname(path.resolve(file)), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, data);
  await fsp.rename(tmp, file);
}

/* ───────────────────────────── ping ───────────────────────────── */

const MEANING = {
  200: 'received', 202: 'received, key validation pending', 400: 'invalid request format', 403: 'key invalid or key file missing',
  422: 'URLs do not belong to host, or key does not match schema', 429: 'rate limited (possible spam flag)',
};

async function preflightKey(cfg) {
  const loc = cfg.keyLocation || `${cfg.base}/${cfg.key}.txt`;
  let res;
  try { res = await request(loc, { retries: 1 }); } catch (e) { throw new PulseError(`Key file unreachable at ${loc.replace(cfg.key, '***')}: ${e.message}`, 3); }
  const txt = (await res.text()).trim();
  if (res.status !== 200 || txt !== cfg.key) {
    throw new PulseError(`Key file check failed (HTTP ${res.status}). Make sure ${loc.replace(cfg.key, '***')} is live and contains exactly the key, or IndexNow will answer 403.`, 3);
  }
}

async function sendPing(cfg, urls) {
  const out = [];
  for (let i = 0; i < urls.length; i += cfg.maxUrls) {
    const urlList = urls.slice(i, i + cfg.maxUrls);
    const body = JSON.stringify({ host: cfg.host, key: cfg.key, ...(cfg.keyLocation ? { keyLocation: cfg.keyLocation } : {}), urlList });
    const res = await request(cfg.endpoint, { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body });
    const note = (await res.text().catch(() => '')).replace(cfg.key, '***').slice(0, 240);
    const ok = res.status === 200 || res.status === 202;
    out.push({ urlList, status: res.status, ok, meaning: MEANING[res.status] || 'unexpected response', note });
    if ([400, 403, 422].includes(res.status)) break; // retrying cannot help
  }
  return out;
}

/* ───────────────────────────── helpers ───────────────────────────── */

const fmtTime = (d = new Date()) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' }).format(d);
const spark = (vals) => { const bars = '▁▂▃▄▅▆▇█'; const m = Math.max(1, ...vals); return vals.map((v) => (v === 0 ? '▁' : bars[Math.max(1, Math.min(7, Math.round((v / m) * 7)))])).join(''); };
const esc = (s) => String(s).replace(/\|/g, '\\|');
const short = (u, n = 64) => { const p = u.replace(/^https:\/\/[^/]+/, '') || '/'; return p.length > n ? `${p.slice(0, n - 1)}…` : p; };

/* ───────────────────────────── main run ───────────────────────────── */

export async function run(cfg) {
  const started = Date.now();
  const useColor = !cfg.noColor && !cfg.json && process.stdout.isTTY && !process.env.NO_COLOR;
  const paint = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
  const bold = paint(1), dim = paint(2), green = paint(32), yellow = paint(33), red = paint(31), cyan = paint(36), magenta = paint(35);
  const say = cfg.out || ((s) => { if (!cfg.quiet && !cfg.json) console.log(s); });
  const S = { warnings: [], notes: [] };
  const warn = (m) => { S.warnings.push(m); say(`  ${yellow('⚠')} ${m}`); };
  const step = (m) => say(`  ${green('✓')} ${m}`);

  if (!cfg.dryRun && !cfg.baseline && !cfg.key) throw new PulseError('No IndexNow key. Set INDEXNOW_KEY or pass --key (use --dry-run to preview).', 3);

  const { state, fresh } = await loadState(cfg.state, cfg.host);
  // stored hashes are only comparable under the same normalisation settings
  const normSig = sha256(JSON.stringify({ countDates: cfg.countDates, volatile: cfg.volatile.map((r) => r.source) })).slice(0, 12);
  const resealed = !fresh && !!state.normSig && state.normSig !== normSig;
  const baselineMode = cfg.baseline || (fresh && !cfg.pingAll) || resealed;
  const canonOf = (u) => toCanon(u, cfg.host);
  const fetchUrl = (canon) => { const p = new URL(canon); return `${cfg.base}${p.pathname}${p.search}`; };

  say('');
  say(`  ${cyan('╭────────────────────────────────────────────────────────╮')}`);
  say(`  ${cyan('│')}  ${bold('◉  RELEASE PULSE')}  ${dim('IndexNow · digest-diff trigger')}          ${cyan('│')}`);
  say(`  ${cyan('│')}  ${dim(`${cfg.host} · ${fmtTime()}`.padEnd(54))} ${cyan('│')}`);
  say(`  ${cyan('╰────────────────────────────────────────────────────────╯')}`);
  const hist = state.history.slice(-12).map((h) => h.pinged);
  say(`  ${dim('mode:')} ${cfg.dryRun ? 'dry-run' : baselineMode ? 'baseline (seal state, no ping)' : 'live'}   ${dim('pulse')} ${magenta(hist.length ? spark(hist) : '—')}`);
  if (resealed) warn('normalisation settings changed since the last run: resealing state without pinging');
  say('');

  /* 1 ── discovery ───────────────────────────────────────────── */
  const universe = new Map(); // canon -> Set(sources)
  const add = (canon, src) => { if (!canon) return; (universe.get(canon) || universe.set(canon, new Set()).get(canon)).add(src); };
  const text = async (u) => { const r = await request(u); if (r.status !== 200) throw new Error(`HTTP ${r.status}`); return r.text(); };

  const [smR, feedR, idxR, rubR] = await Promise.allSettled([
    (async () => {
      const locs = [];
      const xml = await text(cfg.sitemap);
      const grab = (x) => [...x.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => decode(m[1]));
      if (/<sitemapindex/i.test(xml)) {
        for (const child of grab(xml).slice(0, 50)) {
          const cc = canonOf(child);
          const cx = await text(cc && cc.url ? fetchUrl(cc.url) : child).catch(() => '');
          locs.push(...grab(cx));
        }
      } else locs.push(...grab(xml));
      return locs;
    })(),
    text(cfg.feed),
    text(cfg.index),
    cfg.rubric && cfg.rubric !== 'none'
      ? (/^https?:\/\//.test(cfg.rubric) ? text(cfg.rubric) : fsp.readFile(cfg.rubric, 'utf8'))
      : Promise.resolve(null),
  ]);

  let sitemapHash = 0;
  if (smR.status === 'fulfilled') {
    for (const l of smR.value) { const c = canonOf(l); if (c?.hash) sitemapHash++; else if (c) add(c.url, 'sitemap'); }
    step(`sitemap       ${smR.value.length} URLs${sitemapHash ? yellow(` (${sitemapHash} hash URLs ignored)`) : ''}`);
    if (sitemapHash) warn(`${sitemapHash} sitemap URL(s) contain #fragments: crawlers collapse these to the home page`);
  } else warn(`sitemap unavailable (${smR.reason.message}); relying on feed, index and tracked state`);

  let feed = { items: [], health: { items: 0, problems: [] } };
  if (feedR.status === 'fulfilled') {
    feed = parseFeed(feedR.value, cfg.host);
    for (const it of feed.items) if (it.canon) add(it.canon, 'feed');
    step(`rss feed      ${feed.items.length} items${feed.health.problems.length ? yellow(` · ${feed.health.problems.length} problem(s)`) : ''}`);
    for (const p of feed.health.problems) warn(`feed: ${p}`);
  } else warn(`feed unavailable (${feedR.reason.message})`);

  const indexDigests = new Map();
  let indexCount = null;
  if (idxR.status === 'fulfilled') {
    try {
      const j = JSON.parse(idxR.value);
      const dist = Array.isArray(j.distribution) ? j.distribution : [];
      indexCount = dist.length;
      for (const d of dist) {
        const c = d.contentUrl ? canonOf(d.contentUrl) : null;
        if (c && c.url) { add(c.url, 'index'); if (d.digest?.value) indexDigests.set(c.url, String(d.digest.value).toLowerCase()); }
      }
      step(`signed index  ${indexCount} distributions (${indexDigests.size} on ${cfg.host})`);
    } catch (e) { warn(`master index is not valid JSON (${e.message})`); }
  } else warn(`master index unavailable (${idxR.reason.message})`);

  let rubric = { byPath: new Map(), rows: 0, hashTargets: 0, pages: 0 };
  if (rubR.status === 'fulfilled' && rubR.value) {
    try { rubric = parseRubric(JSON.parse(rubR.value), cfg.host); } catch (e) { warn(`rubric is not valid JSON (${e.message})`); }
    if (rubric.rows) {
      step(`rubric        ${rubric.rows} intent rows → ${rubric.pages} target pages`);
      if (rubric.hashTargets) warn(`${rubric.hashTargets} rubric row(s) target #/hash URLs; they cannot be indexed as separate pages`);
      for (const e of rubric.byPath.values()) add(e.canon, 'rubric-candidate');
    } else warn('rubric loaded but no query→page rows recognised; running without rubric priority');
  } else if (rubR.status === 'rejected') warn(`rubric unavailable (${rubR.reason.message}); running without rubric priority`);

  for (const p of ['/', '/llms.txt', '/feed.xml', '/sitemap.xml', '/news-sitemap.xml', '/ai-sitemap.json', '/blog/']) add(`https://${cfg.host}${p}`, 'always');
  for (const u of cfg.extraUrls) { const c = canonOf(u); if (c?.url) add(c.url, 'extra'); }
  for (const [u, e] of Object.entries(state.urls)) if (e.status === 'ok') add(u, 'state');

  // rubric-candidate URLs are only crawled if they resolve to a real page (they are optional extras)
  const optionalOnly = (srcs) => [...srcs].every((s) => s === 'rubric-candidate' || s === 'always');

  /* 2 ── crawl ───────────────────────────────────────────────── */
  const seenGuids = new Set(state.feed.seen);
  const newItems = feed.items.filter((it) => it.canon && !seenGuids.has(it.guid));
  const needFull = cfg.noEtag || newItems.length > 0; // link-graph checks need bodies
  const targets = [...universe.keys()];

  const fetchPage = async (canon, { etag = true } = {}) => {
    const prev = state.urls[canon];
    const headers = {};
    if (etag && !needFull && prev?.etag && prev.status === 'ok') headers['if-none-match'] = prev.etag;
    let res;
    try { res = await request(fetchUrl(canon), { redirect: 'manual', headers, retries: 2 }); } catch (e) { return { canon, status: 0, error: e.message }; }
    const r = { canon, status: res.status, etag: res.headers.get('etag') || '', lastModified: res.headers.get('last-modified') || '', xRobots: res.headers.get('x-robots-tag') || '' };
    if (res.status === 304 && prev) return { ...r, status: 200, notModified: true, kind: prev.kind, raw: prev.raw, norm: prev.norm, etag: prev.etag };
    if ([301, 302, 303, 307, 308].includes(res.status)) { r.location = res.headers.get('location') || ''; await res.arrayBuffer().catch(() => {}); return r; }
    if (res.status !== 200) { await res.arrayBuffer().catch(() => {}); return r; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get('content-type') || '';
    r.kind = kindOf(canon, ct);
    r.raw = sha256(buf);
    const asText = buf.toString('utf8');
    r.norm = r.kind === 'raw' ? r.raw : sha256(normalize(r.kind, asText, { extra: cfg.volatile, countDates: cfg.countDates }));
    if (r.kind === 'html') r.facts = extractFacts(asText, canon, cfg.host);
    r.bytes = buf.length;
    return r;
  };

  const results = await pool(targets, cfg.concurrency, (c) => fetchPage(c));
  const byUrl = new Map(results.map((r) => [r.canon, r]));
  const ok200 = results.filter((r) => r.status === 200).length;
  step(`crawled       ${results.length} URLs · ${ok200} live${needFull ? dim(' · full-body pass (new article detected)') : ''}`);

  /* 3 ── diff ───────────────────────────────────────────────── */
  const candidates = new Map(); // canon -> {reason}
  const skipped = [];
  const newByCanon = new Map(newItems.map((it) => [it.canon, it]));
  let unchanged = 0, errors = 0;
  for (const r of results) {
    const prev = state.urls[r.canon];
    const srcs = universe.get(r.canon);
    if (r.status === 0 || (r.status >= 500) || (r.status === 429)) { errors++; if (prev) skipped.push({ url: r.canon, why: `fetch error (${r.error || r.status})` }); continue; }
    if (r.status === 200) {
      if (!prev) candidates.set(r.canon, { reason: newByCanon.has(r.canon) ? 'new-article' : 'added' });
      else if (prev.status !== 'ok') candidates.set(r.canon, { reason: 'revived' });
      else if (prev.norm !== r.norm) candidates.set(r.canon, { reason: 'changed' });
      else unchanged++;
    } else if (r.status === 404 || r.status === 410) {
      if (prev?.status === 'ok') candidates.set(r.canon, { reason: 'removed' });
      else if (!prev && !optionalOnly(srcs)) skipped.push({ url: r.canon, why: `HTTP ${r.status} (listed in ${[...srcs].join(', ')})` });
    } else if (r.status >= 300 && r.status < 400) {
      if (prev?.status === 'ok') candidates.set(r.canon, { reason: 'redirected' });
      else if (!prev && !optionalOnly(srcs)) skipped.push({ url: r.canon, why: `redirects to ${r.location || '?'}; list the final URL instead` });
    } else if (!prev && !optionalOnly(srcs)) skipped.push({ url: r.canon, why: `HTTP ${r.status}` });
  }

  // a brand-new URL discovered only through optional sources and not live is simply ignored
  if (baselineMode) {
    for (const r of results) {
      if (r.status !== 200) continue;
      const prev = state.urls[r.canon];
      state.urls[r.canon] = { status: 'ok', kind: r.kind, norm: r.norm, raw: r.raw, etag: r.etag, lastModified: r.lastModified, firstSeen: prev?.firstSeen || new Date().toISOString(), lastChanged: prev?.lastChanged || null, lastPinged: prev?.lastPinged || null };
    }
    for (const it of feed.items) seenGuids.add(it.guid);
    state.feed.seen = [...seenGuids];
    state.lastRun = new Date().toISOString();
    state.history.push({ ts: state.lastRun, pinged: 0, held: 0 });
    state.history = state.history.slice(-48);
    state.normSig = normSig;
    if (!cfg.dryRun) await writeAtomic(cfg.state, JSON.stringify(state, null, 1));
    step(`baseline sealed ${Object.keys(state.urls).length} URLs tracked${cfg.dryRun ? ' (dry-run: not written)' : ''}`);
    return finish({ candidates: [], pinged: [], held: [], baseline: true });
  }

  /* 4 ── stability re-check (volatile pages never ping) ─────────── */
  const held = [];
  const changedList = [...candidates].filter(([, c]) => c.reason === 'changed' || c.reason === 'added' || c.reason === 'new-article' || c.reason === 'revived');
  if (changedList.length) {
    await sleep(Number(process.env.PULSE_STABILITY_MS ?? 1500));
    await pool(changedList, cfg.concurrency, async ([canon, c]) => {
      const again = await fetchPage(canon, { etag: false });
      const first = byUrl.get(canon);
      if (again.status !== 200 || again.norm !== first.norm) {
        candidates.delete(canon);
        held.push({ url: canon, reason: c.reason, why: 'volatile: content differs between two consecutive fetches' });
        const p = state.urls[canon]; if (p) p.volatile = (p.volatile || 0) + 1;
      }
    });
  }

  /* 5 ── sitewide guard ────────────────────────────────────── */
  const tracked = Object.values(state.urls).filter((e) => e.status === 'ok').length;
  const changedOnly = [...candidates].filter(([, c]) => c.reason === 'changed');
  if (!cfg.acceptSitewide && changedOnly.length >= cfg.blastMin && tracked && changedOnly.length / tracked >= cfg.blastRatio) {
    // stay in `candidates` (so their stored hash is NOT updated) but are excluded from the batch
    for (const [, c] of changedOnly) c.heldWhy = `sitewide change (${changedOnly.length}/${tracked} pages); likely a template or build-id change. Re-run with --accept-sitewide if intended, or --baseline to reseal`;
    warn(`sitewide guard held ${changedOnly.length} changed pages (${Math.round((changedOnly.length / tracked) * 100)}% of tracked); a template-level change is not a reason to ping`);
  }

  /* 6 ── gates + debounce + rubric priority ──────────────────────── */
  const inbound = new Map();
  for (const r of results) if (r.facts) for (const l of r.facts.links) { if (l !== pathKey(r.canon)) (inbound.get(l) || inbound.set(l, new Set()).get(l)).add(r.canon); }
  const now = Date.now();
  const batch = [];
  const gateWarnings = [];
  for (const [canon, c] of candidates) {
    const r = byUrl.get(canon);
    const prev = state.urls[canon];
    const isArticle = c.reason === 'new-article';
    if (c.heldWhy) { held.push({ url: canon, reason: c.reason, why: c.heldWhy }); continue; }
    let g = { fails: [], warns: [] };
    if (!cfg.noGate && r.status === 200) g = gate(canon, r.facts, { isArticle, xRobots: r.xRobots });
    if (g.fails.length) { held.push({ url: canon, reason: c.reason, why: `gate: ${g.fails.join('; ')}` }); continue; }
    if (!cfg.force && prev?.lastPinged && now - Date.parse(prev.lastPinged) < cfg.minGapMin * 60000 && c.reason !== 'new-article') {
      held.push({ url: canon, reason: c.reason, why: `debounce (pinged ${Math.round((now - Date.parse(prev.lastPinged)) / 60000)} min ago)` });
      continue;
    }
    for (const w of g.warns) gateWarnings.push(`${short(canon)}: ${w}`);
    if (isArticle) {
      const n = inbound.get(pathKey(canon))?.size || 0;
      c.inbound = n;
      if (needFull && n < cfg.minInbound) gateWarnings.push(`${short(canon)}: only ${n} internal link(s) point to this new article (target ≥ ${cfg.minInbound}: service hub + paired + related)`);
    }
    const rb = rubric.byPath.get(pathKey(canon));
    const intentRows = rb?.rows || 0;
    const prio = intentRows + (isArticle ? 100000 : c.reason === 'added' ? 50000 : c.reason === 'removed' || c.reason === 'redirected' ? 20000 : 10000);
    batch.push({ url: canon, reason: c.reason, kind: r.kind, intentRows, services: rb ? [...rb.services].slice(0, 3) : [], classes: rb ? [...rb.classes].slice(0, 3) : [], prio, inbound: c.inbound, warns: g.warns });
  }
  batch.sort((a, b) => b.prio - a.prio || a.url.localeCompare(b.url));
  for (const w of gateWarnings.slice(0, 8)) warn(w);
  for (const w of gateWarnings.slice(8)) S.warnings.push(w);
  if (skipped.length) {
    warn(`${skipped.length} listed URL(s) are not indexable right now (404 / redirect / error)`);
    for (const s of skipped.slice(0, 4)) say(`      ${dim(`${short(s.url, 48)} — ${s.why}`)}`);
  }
  if (skipped.length) S.skipped = skipped;

  /* 7 ── integrity vs signed index ───────────────────────────── */
  const drift = [];
  for (const [canon, digest] of indexDigests) {
    const r = byUrl.get(canon);
    if (r && r.status === 200 && r.kind !== 'html' && r.raw && r.raw !== digest) drift.push(canon);
  }
  if (drift.length) {
    warn(`${drift.length} live file(s) differ from the signed master index; re-sign before pinging so /v1/verify stays green`);
    for (const d of drift.slice(0, 5)) say(`      ${dim(short(d))}`);
    if (cfg.strictIntegrity && !cfg.dryRun) throw new PulseError('Integrity drift with --strict-integrity: refusing to ping.', 4);
  } else if (indexDigests.size) step('integrity     live files match the signed index');

  const fmtReason = { 'new-article': 'new article', added: 'new page', changed: 'content changed', revived: 'back online', removed: 'removed', redirected: 'redirected' };
  say('');
  say(`  ${bold('Δ')} ${bold(String(batch.length))} to ping · ${held.length} held · ${unchanged} unchanged${errors ? ` · ${errors} fetch errors` : ''}`);
  for (const b of batch.slice(0, 12)) say(`    ${green('▸')} ${short(b.url, 52).padEnd(52)} ${dim(fmtReason[b.reason].padEnd(15))} ${b.intentRows ? cyan(`${b.intentRows} intent rows`) : dim('—')}`);
  if (batch.length > 12) say(`    ${dim(`… and ${batch.length - 12} more`)}`);
  for (const h of held.slice(0, 6)) say(`    ${yellow('◌')} ${short(h.url, 52).padEnd(52)} ${dim(h.why)}`);

  /* 8 ── ping ─────────────────────────────────────────────────── */
  let pings = [];
  let acceptedUrls = [];
  if (batch.length && !cfg.dryRun) {
    await preflightKey(cfg);
    pings = await sendPing(cfg, batch.map((b) => b.url));
    acceptedUrls = pings.filter((p) => p.ok).flatMap((p) => p.urlList);
    for (const p of pings) say(`  ${p.ok ? green('✓') : red('✗')} POST ${p.urlList.length} URL(s) → ${p.status} ${p.meaning}`);
  } else if (batch.length && cfg.dryRun) say(`  ${dim('dry-run: nothing sent')}`);

  /* 9 ── state, receipts ────────────────────────────────────────── */
  const accepted = new Set(acceptedUrls);
  if (!cfg.dryRun) {
    const nowIso = new Date().toISOString();
    for (const r of results) {
      if (r.status !== 200) continue;
      const prev = state.urls[r.canon];
      const isCand = candidates.has(r.canon);
      if (isCand && !accepted.has(r.canon)) continue; // keep the old hash so it is retried next run
      state.urls[r.canon] = { status: 'ok', kind: r.kind, norm: r.norm, raw: r.raw, etag: r.etag, lastModified: r.lastModified, firstSeen: prev?.firstSeen || nowIso, lastChanged: isCand ? nowIso : prev?.lastChanged || null, lastPinged: accepted.has(r.canon) ? nowIso : prev?.lastPinged || null, volatile: prev?.volatile || 0 };
    }
    for (const [canon, c] of candidates) {
      if (!accepted.has(canon)) continue;
      const r = byUrl.get(canon);
      if (c.reason === 'removed') state.urls[canon] = { ...(state.urls[canon] || {}), status: 'gone', lastPinged: nowIso, lastChanged: nowIso };
      if (c.reason === 'redirected') state.urls[canon] = { ...(state.urls[canon] || {}), status: 'redirect', location: r.location, lastPinged: nowIso, lastChanged: nowIso };
    }
    for (const [canon, e] of Object.entries(state.urls)) if (e.status !== 'ok' && e.lastPinged && Date.now() - Date.parse(e.lastPinged) > 60 * 86400000) delete state.urls[canon];
    for (const it of feed.items) {
      const c = it.canon;
      const isNew = c && newByCanon.has(c);
      if (!isNew) { seenGuids.add(it.guid); continue; }
      const st = byUrl.get(c);
      if (accepted.has(c) || (st?.status === 200 && !candidates.has(c) && !held.some((h) => h.url === c))) seenGuids.add(it.guid);
    }
    state.feed.seen = [...seenGuids].slice(-2000);
    state.lastRun = nowIso;
    state.history.push({ ts: nowIso, pinged: accepted.size, held: held.length });
    state.history = state.history.slice(-48);
    state.normSig = normSig;
    await writeAtomic(cfg.state, JSON.stringify(state, null, 1));
    if (pings.length) {
      const receipt = {
        ts: nowIso, tool: `release-pulse/${VERSION}`, endpoint: cfg.endpoint, host: cfg.host,
        gate: 'submitted', note: 'IndexNow 200/202 = received, not crawled or indexed',
        requests: pings.map((p) => ({ status: p.status, ok: p.ok, meaning: p.meaning, count: p.urlList.length })),
        urls: batch.map((b) => ({ url: b.url, reason: b.reason, accepted: accepted.has(b.url), intentRows: b.intentRows, services: b.services })),
      };
      await fsp.mkdir(path.dirname(path.resolve(cfg.receipts)), { recursive: true });
      await fsp.appendFile(cfg.receipts, JSON.stringify(receipt) + '\n');
      if (cfg.publishReceipts) {
        const lines = (await fsp.readFile(cfg.receipts, 'utf8')).trim().split('\n').slice(-50).map((l) => JSON.parse(l));
        await writeAtomic(cfg.publishReceipts, JSON.stringify({ generated: nowIso, note: 'Submission receipts, not indexing proof', receipts: lines }, null, 1));
      }
    }
  }

  return finish({ candidates: batch, pinged: acceptedUrls, held, pings, drift, indexCount, rubric, feed, newItems, unchanged, errors, skipped, inbound });

  /* ── summary / report ── */
  async function finish(x) {
    let schedule = null;
    if (cfg.schedule) {
      try { schedule = checkSchedule(JSON.parse(await fsp.readFile(cfg.schedule, 'utf8')), feed.items); }
      catch (e) { warn(`schedule unreadable (${e.message})`); }
    }
    if (schedule) {
      step(`schedule      ${schedule.published} published · ${schedule.due} due · ${schedule.overdue} overdue · ${schedule.upcoming} upcoming`);
      if (schedule.overdue) warn(`${schedule.overdue} release slot(s) are overdue: ${schedule.rows.filter((r) => r.status === 'overdue').map((r) => r.service).slice(0, 5).join(', ')}`);
    }
    const failedChunks = (x.pings || []).filter((p) => !p.ok);
    const exitCode = failedChunks.length ? 2 : 0;
    const summary = {
      tool: `release-pulse/${VERSION}`, host: cfg.host, at: new Date().toISOString(), mode: cfg.dryRun ? 'dry-run' : x.baseline ? 'baseline' : 'live',
      tracked: Object.keys(state.urls).length, toPing: x.candidates.length, accepted: x.pinged.length, held: x.held.length, unchanged: x.unchanged ?? 0,
      signedIndexDistributions: x.indexCount ?? null, rubricRows: x.rubric?.rows ?? 0, feedItems: feed.items.length, newArticles: (x.newItems || []).length,
      integrityDrift: (x.drift || []).length, warnings: S.warnings, skipped: S.skipped || [], exitCode, elapsedMs: Date.now() - started,
      pinged: x.candidates.map((b) => ({ url: b.url, reason: b.reason, intentRows: b.intentRows, accepted: x.pinged.includes(b.url) })), heldDetail: x.held, schedule,
    };
    say('');
    say(`  ${bold(failedChunks.length ? red('Pulse incomplete') : x.baseline ? green('Baseline sealed') : x.pinged.length ? green(`Pulse sent · ${x.pinged.length} URL(s) accepted`) : cyan('Quiet pulse · nothing changed that is worth a ping'))}  ${dim(`${((Date.now() - started) / 1000).toFixed(1)}s`)}`);
    say('');
    if (cfg.json) console.log(JSON.stringify(summary, null, 1));
    const md = renderMarkdown(summary, x, feed);
    if (cfg.report) await writeAtomic(cfg.report, md);
    if (process.env.GITHUB_STEP_SUMMARY) await fsp.appendFile(process.env.GITHUB_STEP_SUMMARY, md + '\n').catch(() => {});
    return { exitCode, summary, markdown: md };
  }
}

function renderMarkdown(s, x, feed) {
  const L = [];
  L.push(`## ◉ Release Pulse · ${s.host}`);
  L.push('', `**${s.mode}** · ${s.accepted} accepted of ${s.toPing} queued · ${s.held} held · ${s.unchanged} unchanged · ${s.tracked} tracked · ${(s.elapsedMs / 1000).toFixed(1)}s`);
  L.push('', '> IndexNow 200/202 means *received*. It is not proof of crawling or indexing.');
  if (x.candidates?.length) {
    L.push('', '### Pinged', '', '| URL | Why | Intent rows | Accepted |', '|---|---|---:|:-:|');
    for (const p of s.pinged.slice(0, 50)) L.push(`| \`${esc(short(p.url, 70))}\` | ${p.reason} | ${p.intentRows || '–'} | ${p.accepted ? '✓' : s.mode === 'dry-run' ? '·' : '✗'} |`);
    if (s.pinged.length > 50) L.push(`| … ${s.pinged.length - 50} more | | | |`);
  }
  if (s.heldDetail?.length) {
    L.push('', '### Held back', '', '| URL | Reason |', '|---|---|');
    for (const h of s.heldDetail.slice(0, 30)) L.push(`| \`${esc(short(h.url, 70))}\` | ${esc(h.why)} |`);
  }
  L.push('', '### Signals', '', `- Signed index distributions: **${s.signedIndexDistributions ?? 'n/a'}** · integrity drift: **${s.integrityDrift}**`);
  L.push(`- RSS items: **${s.feedItems}** · new articles this run: **${s.newArticles}**`, `- Rubric intent rows read: **${s.rubricRows}**`);
  if (s.schedule) L.push(`- Release schedule: **${s.schedule.published}** published · **${s.schedule.due}** due · **${s.schedule.overdue}** overdue · **${s.schedule.upcoming}** upcoming`);
  if (s.warnings.length) { L.push('', '### Warnings', ''); for (const w of s.warnings.slice(0, 40)) L.push(`- ${w}`); }
  return L.join('\n');
}

/* ───────────────────────────── entry ───────────────────────────── */

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  (async () => {
    try {
      const cfg = parseArgs(process.argv.slice(2));
      if (cfg.help) { console.log(HELP); process.exit(0); }
      const { exitCode } = await run(cfg);
      process.exit(exitCode);
    } catch (e) {
      console.error(`\n  ✗ ${e.message}\n`);
      process.exit(e.exitCode || 1);
    }
  })();
}
