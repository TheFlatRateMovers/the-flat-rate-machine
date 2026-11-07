#!/usr/bin/env node
/* The Flat Rate Machine — per-route document generator (Solution A,
   2026-10-31; design: out/batch-per-route-shell-live/records/DESIGN.md).
 *
 * Derives one complete, standalone HTML document per registry route
 * from the single sources of truth:
 *   --shell       the source shell (content source of record: chrome,
 *                 head template, all 205 page divs, script 0, footer)
 *   --head-data   functions/head-data.js (per-URL head entries)
 *   --pages       data/pages.json (slug <-> canonical URL registry)
 *   --public-dir  the deploy tree (per-page JSON files for baking)
 *   --assets-dir  scripts/route-assets/ (adapted main + WebMCP scripts)
 * Output (--out-dir): one index.html per route + routes-manifest.json.
 * Nothing is hand-edited per route; future batches edit the sources
 * and re-run this generator, then re-seal (digest -> sign).
 *
 * Modes:
 *   node scripts/build-routes.js --out-dir <dir> [options]   (generate)
 *   node scripts/build-routes.js --update-middleware <file> --tree <dir>
 *       (regenerate the STATIC_FILES manifest in the middleware from
 *        the finished deploy tree)
 *
 * Every structural expectation is asserted; any failure aborts before
 * output is written. No dependencies. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function arg(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : dflt;
}
const HOME_DIR = process.env.HOME;
const PAGES_PROJECT = path.join(HOME_DIR, 'workspace/the-flat-rate-movers-pages');

/* ------------------------------------------------------------------ */
/* Middleware manifest mode                                            */
/* ------------------------------------------------------------------ */
if (process.argv.includes('--update-middleware')) {
  const mwPath = arg('update-middleware');
  const tree = arg('tree');
  const files = [];
  (function walk(d, rel) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) walk(path.join(d, e.name), r);
      else if (e.isFile()) files.push('/' + r);
    }
  })(tree, '');
  files.sort();
  const src = fs.readFileSync(mwPath, 'utf8');
  const a = src.indexOf('const STATIC_FILES = new Set([');
  const b = src.indexOf(']);', a);
  if (a < 0 || b < 0) throw new Error('STATIC_FILES block not found in ' + mwPath);
  const inner = files.map((f) => '\n  ' + JSON.stringify(f)).join(',') + '\n';
  fs.writeFileSync(mwPath, src.slice(0, a) + 'const STATIC_FILES = new Set([' + inner + src.slice(b));
  console.log('STATIC_FILES regenerated: ' + files.length + ' entries from ' + tree);
  process.exit(0);
}

/* Cloudflare Web Analytics beacon, baked in (2026-10-31, Solution A):
   Cloudflare's automatic injection appends this tag to served HTML, so
   the served bytes could never equal the sealed bytes. Baking the site's
   own beacon into every route document makes Cloudflare skip the
   automatic injection (documented behavior: an existing beacon
   suppresses it), so served bytes are exactly the sealed bytes and
   analytics keep working. Captured verbatim from the live injection on
   the pre-A shell, 2026-10-31; the token is the site's public Web
   Analytics token (it ships in every served page; not a credential).
   The zone's Email Address Obfuscation was turned OFF the same day for
   the same reason (it rewrote mailto links with a randomized
   per-response token) — see the batch record. */
const CF_BEACON = '<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/vce701823e78c4301a35b7e07294d87301792088814092" integrity="sha512-UKNk8GbxkABxKcXYuLkO16EleLGUkcvJWtpSNmExE0Too3ZaFAxTscNWEc1OdAv5/BikHawapSCaiD2XCmp+Bw==" data-cf-beacon=\'{"version":"2024.11.0","token":"818067e2ff964e189467472592beacef","r":1,"spa":2}\' crossorigin="anonymous"></script>';

/* ------------------------------------------------------------------ */
/* transformHead — ported line-for-line from functions/_middleware.js  */
/* (Batch 9). The middleware applied exactly this function to exactly  */
/* this head with exactly this entry + page JSON on every request;    */
/* the generator applies it once, at build time.                       */
/* ------------------------------------------------------------------ */
function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function escText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function transformHead(headHtml, entry, pageJsonText) {
  let h = headHtml;
  const rep = (re, fn) => { h = h.replace(re, fn); };
  rep(/<title>[^<]*<\/title>/, () => '<title>' + escText(entry.t) + '</title>');
  rep(/(<meta name="description" content=")[^"]*(")/, (m, a2, b) => a2 + escAttr(entry.d) + b);
  rep(/(<meta property="og:title" content=")[^"]*(")/, (m, a2, b) => a2 + escAttr(entry.t) + b);
  rep(/(<meta property="og:description" content=")[^"]*(")/, (m, a2, b) => a2 + escAttr(entry.d) + b);
  rep(/(<meta property="og:url" content=")[^"]*(")/, (m, a2, b) => a2 + escAttr(entry.c) + b);
  rep(/(<meta property="og:type" content=")[^"]*(")/, (m, a2, b) => a2 + entry.og + b);
  rep(/(<meta property="og:image" content=")[^"]*(")/, (m, a2, b) => a2 + escAttr(entry.img) + b);
  rep(/(<meta name="twitter:title" content=")[^"]*(")/, (m, a2, b) => a2 + escAttr(entry.t) + b);
  rep(/(<meta name="twitter:description" content=")[^"]*(")/, (m, a2, b) => a2 + escAttr(entry.d) + b);
  rep(/(<meta name="twitter:image" content=")[^"]*(")/, (m, a2, b) => a2 + escAttr(entry.img) + b);
  rep(/(<link rel="canonical" id="canonicalLink" href=")[^"]*(")/, (m, a2, b) => a2 + escAttr(entry.c) + b);
  rep(/<script type="application\/ld\+json" id="page-jsonld">\{"@context":"https:\/\/schema\.org","@graph":\[\]\}<\/script>/,
    () => '<script type="application/ld+json" id="page-jsonld">' + entry.ld + '</script>');
  if (entry.imgSwapped) {
    rep(/<meta property="og:image:width"[^>]*>/, '');
    rep(/<meta property="og:image:height"[^>]*>/, '');
    rep(/<meta property="og:image:alt"[^>]*>/, '');
    rep(/<meta name="twitter:image:alt"[^>]*>/, '');
  }
  if (pageJsonText) {
    rep(/<\/head>/, () => '<script type="application/ld+json" data-page-json="' + entry.jf + '">' + pageJsonText + '</script></head>');
  }
  return h;
}

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */
const shellPath = arg('shell', path.join(PAGES_PROJECT, 'public/index.html'));
const headDataPath = arg('head-data', path.join(PAGES_PROJECT, 'functions/head-data.js'));
const pagesPath = arg('pages', path.join(HOME_DIR, 'workspace/the-flat-rate-machine/data/pages.json'));
const publicDir = arg('public-dir', path.join(PAGES_PROJECT, 'public'));
const assetsDir = arg('assets-dir', path.join(HOME_DIR, 'workspace/the-flat-rate-machine/scripts/route-assets'));
const outDir = arg('out-dir');
if (!outDir) throw new Error('--out-dir is required');

const shell = fs.readFileSync(shellPath, 'utf8');
const headSrc = fs.readFileSync(headDataPath, 'utf8');
const HEAD = JSON.parse(headSrc.replace(/^\/\/[^\n]*\n/gm, '').replace('export const HEAD = ', '').replace(/;\s*$/, ''));
const pages = JSON.parse(fs.readFileSync(pagesPath, 'utf8')).pages;
const mainAsset = fs.readFileSync(path.join(assetsDir, 'main.js'), 'utf8');
const webmcpAsset = fs.readFileSync(path.join(assetsDir, 'webmcp.js'), 'utf8');

const fail = (msg) => { throw new Error('build-routes: ' + msg); };

/* ------------------------------------------------------------------ */
/* FB-3 schema timestamp transform (Batch FB-3, 2026-11-03)            */
/*                                                                     */
/* Tree generation REQUIRES --stamps <file>: the seal's phase-0        */
/* stamps map (out/seal-work/stamps.json). Each head-data entry's ld   */
/* is rewritten in memory before injection: on every WebPage and       */
/* Article node in the entry's @graph, dateModified := the page's      */
/* ledger value at seal start (the same value the sitemap publishes    */
/* for the URL) and datePublished := the News Formula manifest date    */
/* (articles) or the route document's signed-index lineage date; the   */
/* field is DELETED when the map carries null (no provable date —      */
/* never a default). A ProfilePage node in head-data fails loud:       */
/* since the FB-3 rider the canonical ProfilePage lives in the         */
/* page's own data, and a template relapse must stop the seal rather   */
/* than be silently stamped. --no-stamps exists ONLY for the batch's   */
/* transform off/on diff proof; a tree generated with it must never    */
/* be sealed or deployed.                                              */
/* ------------------------------------------------------------------ */
const stampsPath = arg('stamps');
const noStamps = process.argv.includes('--no-stamps');
let STAMPS = null;
if (stampsPath) {
  STAMPS = JSON.parse(fs.readFileSync(stampsPath, 'utf8')).pages;
  if (!STAMPS) fail('stamps file lacks the pages map: ' + stampsPath);
} else if (!noStamps) {
  fail('--stamps <stamps.json> is required for tree generation (FB-3); ' +
    '--no-stamps is a dev-only diff-proof path and must never be sealed');
}
/* Page Data manifest (Page Data wave, 2026-11-03): build-page-data.js
   (seal phase 4.5) writes every page's data.json/data.txt beside the
   page and emits this manifest of per-page head blocks (alternate
   links + WebPage/Dataset JSON-LD carrying the files' SHA-256
   digests). Tree generation requires it, exactly like --stamps;
   --no-page-data is the same dev-only diff-proof escape and must
   never be sealed. */
const pageDataPath = arg('page-data');
const noPageData = process.argv.includes('--no-page-data');
let PAGE_DATA = null;
if (pageDataPath) {
  PAGE_DATA = JSON.parse(fs.readFileSync(pageDataPath, 'utf8'));
  if (!PAGE_DATA.pages) fail('page-data manifest lacks the pages map: ' + pageDataPath);
} else if (!noPageData) {
  fail('--page-data <manifest.json> is required for tree generation (Page Data wave); ' +
    '--no-page-data is a dev-only diff-proof path and must never be sealed');
}
function stampedEntry(entry) {
  if (!entry || !STAMPS) return entry;
  const st = STAMPS[entry.c];
  if (!st) fail('no stamps entry for ' + entry.c);
  const doc = JSON.parse(entry.ld);
  for (const node of doc['@graph'] || []) {
    const t = node && node['@type'];
    if (t === 'ProfilePage') fail(entry.c + ': ProfilePage node in head-data — the canonical node lives in page data since FB-3');
    if (t !== 'WebPage' && t !== 'Article') continue;
    node.dateModified = st.dm;
    if (st.dp) node.datePublished = st.dp; else delete node.datePublished;
  }
  const ld = JSON.stringify(doc);
  if (ld.includes('"datePublished":"2026-10-27"') || ld.includes('"dateModified":"2026-10-28"')) {
    fail(entry.c + ': template date constants survived the FB-3 transform');
  }
  return { ...entry, ld };
}

/* ------------------------------------------------------------------ */
/* Segment the shell                                                   */
/* ------------------------------------------------------------------ */
const headEnd = shell.indexOf('</head>') + '</head>'.length;
if (headEnd < 7) fail('no </head> in shell');
const headTemplate = shell.slice(0, headEnd);
if (!headTemplate.includes('id="canonicalLink"')) fail('head template lacks the canonical marker');
if (!headTemplate.includes('<script type="application/ld+json" id="page-jsonld">{"@context":"https://schema.org","@graph":[]}</script>')) fail('head template lacks the seeded page-jsonld slot');

/* Script-aware, comment-aware div extraction. Page divs are the
   depth-0 divs whose opening tag matches the page pattern; other
   depth-0 divs belong to the chrome (header/footer) and stay part of
   the surrounding gap material. */
const divs = []; // {slug, start, end, text}
const gaps = []; // text before each page div, from the previous cut
{
  let i = headEnd;
  let depth = 0;
  let divStart = -1;
  let divIsPage = false;
  let segStart = headEnd;
  const nextToken = (from) => {
    let best = null;
    for (const tok of ['<!--', '<script', '<div', '</div>']) {
      const j = shell.indexOf(tok, from);
      if (j >= 0 && (best === null || j < best.idx)) best = { tok, idx: j };
    }
    return best;
  };
  while (true) {
    const t = nextToken(i);
    if (!t) break;
    if (t.tok === '<!--') {
      const e = shell.indexOf('-->', t.idx);
      if (e < 0) fail('unterminated comment');
      i = e + 3;
    } else if (t.tok === '<script') {
      const e = shell.indexOf('</script>', t.idx);
      if (e < 0) fail('unterminated script');
      i = e + '</script>'.length;
    } else if (t.tok === '<div') {
      if (depth === 0) {
        divStart = t.idx;
        divIsPage = /^<div class="page" id="page-[^"]+">/.test(shell.slice(t.idx, t.idx + 320));
        if (divIsPage) gaps.push(shell.slice(segStart, t.idx));
      }
      depth++;
      i = t.idx + 4;
    } else { // </div>
      depth--;
      if (depth < 0) fail('div depth went negative');
      if (depth === 0 && divIsPage) {
        const end = shell.indexOf('>', t.idx) + 1;
        const text = shell.slice(divStart, end);
        const m = text.match(/^<div class="page" id="page-([^"]+)">/);
        if (!m) fail('page div at ' + divStart + ' lost its opening pattern');
        divs.push({ slug: m[1], start: divStart, end, text });
        segStart = end;
      }
      i = t.idx + 6;
    }
  }
  if (depth !== 0) fail('div depth did not return to 0');
  gaps.push(shell.slice(segStart)); // tail gap (to EOF; footer cut later)
}
if (divs.length !== pages.length) fail('extracted ' + divs.length + ' divs, registry has ' + pages.length);
const slugSet = new Set(divs.map((d) => d.slug));
if (slugSet.size !== divs.length) fail('duplicate div slugs');
/* Join registry pages to divs through pageMeta on the canonical URL
   (the AGENTS.md join rule): pages.json's slug field — and head-data's
   — are path-style for nested pages (category/…, datasets/…), while
   div ids carry the router slug, which is the pageMeta key. This is
   the router's own byPath construction. pageMeta is parsed out of the
   source shell's main script (data literal only). */
let pageMeta;
{
  const at = shell.indexOf('var pageMeta=');
  if (at < 0) fail('pageMeta not found in shell');
  let i = shell.indexOf('{', at);
  let depth = 0, inStr = null, esc = false, end = -1;
  for (let j = i; j < shell.length; j++) {
    const c = shell[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === inStr) inStr = null;
    } else if (c === "'" || c === '"') inStr = c;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  if (end < 0) fail('pageMeta literal did not balance');
  pageMeta = Function('return (' + shell.slice(i, end + 1) + ')')();
}
const metaKeyByUrl = new Map();
for (const [k, v] of Object.entries(pageMeta)) {
  if (v && v.canonical) {
    if (metaKeyByUrl.has(v.canonical)) fail('duplicate pageMeta canonical ' + v.canonical);
    metaKeyByUrl.set(v.canonical, k);
  }
}
if (Object.keys(pageMeta).length !== pages.length) fail('pageMeta has ' + Object.keys(pageMeta).length + ' keys, registry has ' + pages.length);
for (const p of pages) {
  const h = metaKeyByUrl.get(p.url);
  if (!h) fail('no pageMeta key whose canonical equals registry URL ' + p.url);
  if (!slugSet.has(h)) fail('pageMeta key missing its div: ' + h + ' (' + p.url + ')');
}

/* Chrome prefix = gap 0 minus its trailing banner comment. */
let prefix = gaps[0];
const banners = new Map();
{
  const m = prefix.match(/<!--[\s\S]*?-->\s*$/);
  if (m) { banners.set(divs[0].slug, m[0].trim()); prefix = prefix.slice(0, prefix.length - m[0].length); }
  if (!prefix.includes('<main id="app">')) fail('prefix lacks <main id="app">');
  if (!prefix.includes('<header>') || !prefix.includes('id="crumb"')) fail('prefix chrome incomplete');
}
/* Middle gaps: banner comment per following div + residue audit. */
let strayMainClose = 0;
for (let k = 1; k < divs.length; k++) {
  const gap = gaps[k];
  const comments = [...gap.matchAll(/<!--[\s\S]*?-->/g)].map((x) => x[0]);
  let residue = gap;
  for (const c of comments) residue = residue.replace(c, '');
  if (/<\/main>/.test(residue)) { strayMainClose++; residue = residue.replace('</main>', ''); }
  if (residue.trim() !== '') fail('non-chrome residue before div ' + divs[k].slug + ': ' + JSON.stringify(residue.slice(0, 120)));
  if (comments.length) banners.set(divs[k].slug, comments.join('\n'));
}
/* Tail gap: footer segment + pre-footer residue. */
const tail = gaps[divs.length];
const footerStart = tail.indexOf('<footer');
if (footerStart < 0) fail('no <footer> in tail');
{
  let residue = tail.slice(0, footerStart);
  const comments = [...residue.matchAll(/<!--[\s\S]*?-->/g)].map((x) => x[0]);
  for (const c of comments) residue = residue.replace(c, '');
  if (/<\/main>/.test(residue)) { strayMainClose++; residue = residue.replace('</main>', ''); }
  if (residue.trim() !== '') fail('non-chrome residue before footer: ' + JSON.stringify(residue.slice(0, 120)));
  if (comments.length) banners.set('__tail__', comments.join('\n'));
}
const footerSeg = tail.slice(footerStart);

/* Footer template: script 0 verbatim, scripts 1/2 replaced by assets. */
let footerTemplate;
{
  const spans = [];
  let i = 0;
  while (true) {
    const a = footerSeg.indexOf('<script>', i);
    if (a < 0) break;
    const b = footerSeg.indexOf('</script>', a);
    if (b < 0) fail('unterminated script in footer segment');
    spans.push([a, b + '</script>'.length]);
    i = b + 9;
  }
  if (spans.length !== 3) fail('expected exactly 3 plain script blocks after footer, found ' + spans.length);
  const body = (s) => footerSeg.slice(s[0] + '<script>'.length, s[1] - '</script>'.length);
  if (!body(spans[0]).includes('function loadIcsAreas')) fail('script 0 is not the helpers script');
  if (!body(spans[1]).includes('pageMeta')) fail('script 1 is not the main script');
  if (!body(spans[2]).includes('WebMCP')) fail('script 2 is not the WebMCP script');
  footerTemplate =
    footerSeg.slice(0, spans[1][0]) + '<script>' + mainAsset + '</script>' +
    footerSeg.slice(spans[1][1], spans[2][0]) + '<script>' + webmcpAsset + '</script>' +
    footerSeg.slice(spans[2][1]);
  const bodyClose = footerTemplate.lastIndexOf('</body>');
  footerTemplate = footerTemplate.slice(0, bodyClose) + CF_BEACON + '\n' + footerTemplate.slice(bodyClose);
  if (!footerTemplate.includes('</footer>') || !footerTemplate.includes('</body>')) fail('footer template incomplete');
  if ((footerTemplate.match(/cloudflareinsights/g) || []).length !== 1) fail('footer template must carry exactly one baked Web Analytics beacon');
  if (!footerTemplate.includes('id="toast"')) fail('footer template lacks the toast element (chrome)');
}

/* Embed-hash injection (Copy-Integrity batch, 2026-11-04): dataset
 * landing divs embed verbatim dataset-file copies whose DataDownload
 * objects carry sha256 digests of estate files. Those digests used to
 * be authored into the shell and hand-patched whenever a referenced
 * file changed (the reconciliation re-patched the intent landing
 * embed repeatedly by hand). They are now computed here, at
 * generation time, from the FINAL files in the public tree and
 * injected — the authored value is never trusted. Every other byte of
 * the embed is preserved. An estate-origin contentUrl whose file is
 * missing fails the build loud; external contentUrls are not estate
 * files and pass through untouched. */
let embedHashesInjected = 0;
/* Printed-hash injection (Micro-reconciliation batch, 2026-11-04):
 * dataset landing divs print their file's SHA-256 in the certificate
 * block ("SHA-256 of datasets-<stem>.json: <b>hex</b>"). The printed
 * value is a copy of a derived value and was authored into the shell;
 * 36 of 37 prints were stale when measured. The digest is now computed
 * here, at generation time, from the FINAL file in the public tree and
 * injected — the authored value is never trusted. A referenced file
 * that is missing fails the build loud. Gate: verify.js CI-7. */
let printedHashesInjected = 0;
function injectPrintedHashes(html, pageUrl) {
  return html.replace(/(SHA-256 of (datasets-[a-z0-9\-]+\.json): <b>)([0-9a-f]{64})(<\/b>)/g, (whole, pre, fname, stale, post) => {
    const file = path.join(publicDir, fname);
    if (!fs.existsSync(file)) fail(pageUrl + ': printed hash references missing estate file ' + fname);
    const truth = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    if (truth !== stale) printedHashesInjected++;
    return pre + truth + post;
  });
}
function injectEmbedHashes(html, pageUrl) {
  return html.replace(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g, (whole, body) => {
    if (!body.includes('DataDownload')) return whole;
    let parsed = null;
    try { parsed = JSON.parse(body); } catch (_) { return whole; }
    const downloads = [];
    (function walk(o) {
      if (Array.isArray(o)) { for (const v of o) walk(v); return; }
      if (o && typeof o === 'object') {
        const ty = o['@type'];
        if ((Array.isArray(ty) ? ty.includes('DataDownload') : ty === 'DataDownload')
          && typeof o.contentUrl === 'string' && typeof o.sha256 === 'string') downloads.push(o);
        for (const v of Object.values(o)) walk(v);
      }
    })(parsed);
    if (!downloads.length) return whole;
    const replacements = new Map(); // stale sha -> true sha, per block
    for (const d of downloads) {
      if (!d.contentUrl.startsWith('https://theflatratemovers.com/')) continue;
      const rel = decodeURIComponent(new URL(d.contentUrl).pathname).replace(/^\//, '');
      const file = path.join(publicDir, rel);
      if (!fs.existsSync(file)) fail(pageUrl + ': embed DataDownload references missing estate file ' + d.contentUrl);
      const truth = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
      if (truth !== d.sha256) {
        if (replacements.has(d.sha256) && replacements.get(d.sha256) !== truth) {
          fail(pageUrl + ': one stale embed hash maps to two different files — refusing to guess');
        }
        replacements.set(d.sha256, truth);
      }
    }
    if (!replacements.size) return whole;
    let out = body;
    for (const [stale, truth] of replacements) {
      // Two serialization forms exist in the shell: spaced (indent-1
      // embeds) and compact (page-data embeds). Geo batch 2026-11-05:
      // the geojson hash change reached the compact seats for the first
      // time and the spaced-only needle failed the routes phase.
      const spaced = '"sha256": ' + JSON.stringify(stale);
      const compact = '"sha256":' + JSON.stringify(stale);
      if (out.includes(spaced)) out = out.split(spaced).join('"sha256": ' + JSON.stringify(truth));
      else if (out.includes(compact)) out = out.split(compact).join('"sha256":' + JSON.stringify(truth));
      else fail(pageUrl + ': embed hash needle not found for ' + stale.slice(0, 12) + ' (serialization form differs — extend the injector)');
      embedHashesInjected++;
    }
    return whole.replace(body, () => out);
  });
}


/* ------------------------------------------------------------------ */
/* Served-surface normalization (Review + Validator fix batch,        */
/* 2026-11-05). Applied to the assembled route document, every        */
/* ld+json block except the authored id="page-jsonld" seat:           */
/*  1. Ratings seat: the FIRST block carrying aggregateRating keeps   */
/*     it; branch-stub nodes (#winchester / #martinsburg and the      */
/*     -va/-wv forms) in every later block lose aggregateRating +     */
/*     review, so a served page carries exactly one rating set per    */
/*     branch (Google rich-results merge rule — GSC "Review has       */
/*     multiple aggregate ratings"). The per-page JSON files on disk   */
/*     keep their full records; only the served copy is stripped.     */
/*  2. dayOfWeek values become schema.org DayOfWeek enum URLs         */
/*     ("Mon-Fri" expands to the five weekday URLs).                  */
/*  3. areaServed string entries and untyped name-only objects gain   */
/*     a real place type (City, or AdministrativeArea for counties    */
/*     and regions); @id references to the 71 area nodes gain the     */
/*     type their node carries (an ID-only reference reads as Thing   */
/*     to the validator — residual fix, 2026-11-05).                  */
/*  4. BreadcrumbList / FAQPage nodes whose content signature was     */
/*     already served by an earlier block are dropped (the same       */
/*     duplication class as the ratings).                             */
/* Values are never otherwise altered: digests, URLs and names pass   */
/* through byte-identical at the value level.                         */
/* ------------------------------------------------------------------ */
const DOW_URL = { Monday: 'https://schema.org/Monday', Tuesday: 'https://schema.org/Tuesday', Wednesday: 'https://schema.org/Wednesday', Thursday: 'https://schema.org/Thursday', Friday: 'https://schema.org/Friday', Saturday: 'https://schema.org/Saturday', Sunday: 'https://schema.org/Sunday', PublicHolidays: 'https://schema.org/PublicHolidays' };
function normDayOfWeek(v) {
  const one = (s) => {
    if (typeof s !== 'string') return s;
    if (s.startsWith('http')) return s;
    if (s === 'Mon-Fri') return ['https://schema.org/Monday', 'https://schema.org/Tuesday', 'https://schema.org/Wednesday', 'https://schema.org/Thursday', 'https://schema.org/Friday'];
    if (s === 'Sat') return 'https://schema.org/Saturday';
    if (s === 'Sun') return 'https://schema.org/Sunday';
    return DOW_URL[s] || s;
  };
  const out = (Array.isArray(v) ? v : [v]).flatMap((s) => one(s));
  return Array.isArray(v) ? out : (out.length === 1 ? out[0] : out);
}
function areaTypeFor(name) {
  return /\bCounty\b/.test(name) || /Panhandle|Region\b/.test(name) ? 'AdministrativeArea' : 'City';
}
const AREA_ID_TYPE = { place: 'City', county: 'AdministrativeArea', landmark: 'Place', region: 'AdministrativeArea' };
function normAreaEntry(e) {
  if (typeof e === 'string') return { '@type': areaTypeFor(e), name: e };
  if (e && typeof e === 'object' && !e['@type'] && !e['@id'] && typeof e.name === 'string') return Object.assign({ '@type': areaTypeFor(e.name) }, e);
  // Validator residual fix (2026-11-05): an @id-only areaServed reference
  // reads as type "Thing" to the schema.org validator ("Thing is not a
  // known valid target type for the areaServed property", x71 per item).
  // Stamp the type the referenced node carries in the pool/graph onto
  // the reference itself — same node, one added statement.
  if (e && typeof e === 'object' && !e['@type'] && typeof e['@id'] === 'string') {
    const m = e['@id'].match(/#(place|county|landmark|region)-/);
    if (m) return Object.assign({ '@type': AREA_ID_TYPE[m[1]] }, e);
  }
  return e;
}
function normalizeRouteDoc(doc, routeSlug) {
  let arSeatTaken = false;
  const seenLists = new Set();
  const sigOf = (n) => {
    const t = n['@type'];
    let sig = t + ':';
    if (t === 'BreadcrumbList') sig += (n.itemListElement || []).map((li) => { const it = li && li.item; return String(typeof it === 'string' ? it : (it && (it['@id'] || it.url)) || (li && li.name) || ''); }).join('|');
    else sig += (n.mainEntity || []).map((q) => String((q && q.name) || '')).join('|');
    return sig;
  };
  const out = doc.replace(/<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g, (whole, attrs, body) => {
    if (attrs.includes('id="page-jsonld"')) {
      // Authored seat: never modified, but its BreadcrumbList / FAQPage
      // signatures register so later duplicate copies are dropped.
      try {
        const authored = JSON.parse(body);
        const an = Array.isArray(authored['@graph']) ? authored['@graph'] : [authored];
        for (const n of an) if (n && (n['@type'] === 'BreadcrumbList' || n['@type'] === 'FAQPage')) seenLists.add(sigOf(n));
      } catch (_) {}
      return whole;
    }
    let parsed = null;
    try { parsed = JSON.parse(body); } catch (_) { return whole; }
    if (!parsed || typeof parsed !== 'object') return whole;
    const hasAR = body.includes('aggregateRating');
    const keepAR = hasAR && !arSeatTaken;
    if (hasAR) arSeatTaken = true;
    const walk = (o) => {
      if (Array.isArray(o)) { o.forEach(walk); return; }
      if (!o || typeof o !== 'object') return;
      if ('dayOfWeek' in o) o.dayOfWeek = normDayOfWeek(o.dayOfWeek);
      if (Array.isArray(o.areaServed)) o.areaServed = o.areaServed.map(normAreaEntry);
      for (const v of Object.values(o)) walk(v);
    };
    walk(parsed);
    if (!keepAR) {
      const stripWalk = (o) => {
        if (Array.isArray(o)) { o.forEach(stripWalk); return; }
        if (!o || typeof o !== 'object') return;
        const frag = String(o['@id'] || '').split('#')[1] || '';
        const isBranchStub = /^(place-)?(winchester|martinsburg)(-va|-wv)?$/.test(frag) ||
          (('aggregateRating' in o) && (o.name === 'The Flat Rate Movers' || o.name === 'Flat Rate Movers Martinsburg WV'));
        if (isBranchStub && ('aggregateRating' in o || 'review' in o)) {
          delete o.aggregateRating; delete o.review;
        }
        for (const v of Object.values(o)) stripWalk(v);
      };
      stripWalk(parsed);
    }
    if (Array.isArray(parsed['@graph'])) {
      parsed['@graph'] = parsed['@graph'].filter((n) => {
        if (!n || typeof n !== 'object') return true;
        const t = n['@type'];
        if (t !== 'BreadcrumbList' && t !== 'FAQPage') return true;
        const sig = sigOf(n);
        if (seenLists.has(sig)) return false;
        seenLists.add(sig);
        return true;
      });
    }
    const text = body.includes('\n') ? JSON.stringify(parsed, null, 1) : JSON.stringify(parsed);
    return '<script type="application/ld+json"' + attrs + '>' + text + '</script>';
  });
  const arCount = (out.match(/aggregateRating/g) || []).length;
  if (arCount !== 2) fail(routeSlug + ': served-surface normalization left ' + arCount + ' aggregateRating blocks (expected exactly 2 — one per branch)');
  if (/"reviewCount":\s*"?1"?[,}]/.test(out)) fail(routeSlug + ': stale Winchester reviewCount 1 survived normalization');
  return out;
}

/* ------------------------------------------------------------------ */
/* Generate                                                            */
/* ------------------------------------------------------------------ */
fs.mkdirSync(outDir, { recursive: true });
const manifest = [];
const QUOTE_MD5 = '23d1825f2f5c87ff519e60bba628805d';
// Pin re-expressed 2026-11-01 (Batch Quote-Form Fixes): the form markup changed — hero heavy group added, project types expanded to 20, five conditional per-type sections added. Same property, new canonical segment. Record: out/verify-fix-2026-11-01-quote-form-fixes.md.
let d2Instances = 0;

for (const p of pages) {
  const key = p.url.replace('https://theflatratemovers.com', '').replace(/\/$/, '') || '/';
  const entry = stampedEntry(HEAD[key]);
  if (!entry) fail('no head-data entry for ' + p.url);
  if (entry.c !== p.url) fail('head-data canonical mismatch for ' + p.slug + ': ' + entry.c + ' vs ' + p.url);
  let pageJsonText = null;
  const jfPath = path.join(publicDir, entry.jf);
  if (fs.existsSync(jfPath)) {
    const t = fs.readFileSync(jfPath, 'utf8');
    if (t && !/<\/script/i.test(t)) pageJsonText = t;
  }
  const head = transformHead(headTemplate, entry, pageJsonText);
  /* Page Data head block injection (Page Data wave, 2026-11-03): the
     manifest block (2 alternate links + 2 ld+json seats marked
     data-page-data) is appended at the end of the head, after the
     per-page JSON seat. The block's Dataset digests were computed by
     build-page-data.js from the data files it wrote in phase 4.5. */
  let headFull = head;
  if (PAGE_DATA) {
    const pd = PAGE_DATA.pages[p.url];
    if (!pd || !pd.block) fail('page-data manifest lacks a head block for ' + p.url);
    headFull = head.replace(/<\/head>/, () => pd.block + '</head>');
    if (!headFull.includes('data-page-data="dataset"')) fail(p.url + ': page-data head block injection failed');
  }
  const routeSlug = metaKeyByUrl.get(p.url);
  const div = divs.find((d) => d.slug === routeSlug);
  if (!div) fail('div missing for pageMeta key ' + routeSlug);
  const divShow = injectPrintedHashes(injectEmbedHashes(div.text.replace('<div class="page" id=', '<div class="page show" id='), p.url), p.url);
  const banner = banners.get(routeSlug);
  const doc = normalizeRouteDoc(headFull + prefix + (banner ? banner + '\n' : '') + divShow + '\n</main>\n' + footerTemplate, routeSlug);

  /* Per-document assertions. */
  if (!doc.includes('<title>' + escText(entry.t) + '</title>')) fail(routeSlug + ': baked title mismatch');
  if (!doc.includes('id="page-' + routeSlug + '"')) fail(routeSlug + ': own div missing');
  if ((doc.match(/<div class="page( show)?" id="page-/g) || []).length !== 1) fail(routeSlug + ': foreign page div present');
  const ld = (doc.match(/<script type="application\/ld\+json" id="page-jsonld">([\s\S]*?)<\/script>/) || [])[1];
  if (!ld || JSON.stringify(JSON.parse(ld)) !== JSON.stringify(JSON.parse(entry.ld))) fail(routeSlug + ': baked page-jsonld mismatch');
  if (pageJsonText && !doc.includes('data-page-json="' + entry.jf + '"')) fail(routeSlug + ': data-page-json script missing');
  /* D-2 population: Dataset nodes outside the injected head scripts.
     The Page Data head seat (data-page-data, Page Data wave
     2026-11-03) is excluded on the same ground as the baked seats:
     it is a per-page digest pointer governed by the PG gates in
     verify.js (§40), not a landing-embedded dataset graph. */
  for (const m of doc.matchAll(/<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (m[1].includes('id="page-jsonld"') || m[1].includes('data-page-json=') || m[1].includes('data-page-data')) continue;
    let parsed = null;
    try { parsed = JSON.parse(m[2]); } catch (_) { parsed = null; }
    const nodes = parsed ? (parsed['@graph'] || [parsed]) : [];
    for (const n of nodes) if (n && n['@type'] === 'Dataset') d2Instances++;
  }

  const rel = key === '/' ? 'index.html' : key.slice(1) + '/index.html';
  const outPath = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, doc);
  manifest.push({
    slug: routeSlug, registrySlug: p.slug, url: p.url, file: rel,
    bytes: Buffer.byteLength(doc),
    md5: crypto.createHash('md5').update(doc).digest('hex'),
    sha256: crypto.createHash('sha256').update(doc).digest('hex'),
  });
}

/* Estate-level assertions. */
const quoteDoc = fs.readFileSync(path.join(outDir, 'quote/index.html'), 'utf8');
const segM = quoteDoc.match(/<form id="quoteForm"[\s\S]*?<\/form>/);
const segMd5 = segM ? crypto.createHash('md5').update(segM[0], 'utf8').digest('hex') : 'segment-not-found';
if (segMd5 !== QUOTE_MD5) fail('quote-form segment md5 in generated quote document: ' + segMd5);
const srcSeg = shell.match(/<form id="heroQuote"[\s\S]*?<\/form>/);
const homeDoc = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
const homeSeg = homeDoc.match(/<form id="heroQuote"[\s\S]*?<\/form>/);
if (!srcSeg || !homeSeg || srcSeg[0] !== homeSeg[0]) fail('hero form segment differs in generated home document');
if (d2Instances !== 419) fail("D-2 Dataset-node instances across route documents: " + d2Instances + " (expected 419)"); // 417 -> 419 in WV-2 Port of Huntington Tri-State 2026-11-07: +2 (the 2 Dataset-typed nodes of datasets-port-of-huntington.json — root + coverage — in the /datasets/port-of-huntington/ landing embed; the hub route document carries none) // 412 -> 417 in WV Luxury Estate Program 2026-11-07: +5 (the 4 Dataset-typed nodes of datasets-luxury-estate-relocation.json — root + 3 community records — in the /datasets/luxury-estate-relocation/ landing embed, +1 root node in the /luxury-estate-relocation-west-virginia/ hub embed) // 409 -> 412 in Visibility Fix / B3 Long-Distance deepening 2026-11-06: +3 (the 3 new Dataset-typed nodes of datasets-long-distance.json — federal rule table, high-value declaration, item-class protocols — in the re-synced /datasets/long-distance/ landing embed; the batch's other 2 new nodes are Article typed and do not count) // 403 -> 409 in B2B Specialty build 2026-11-05: +6 (the B2B rubric landing embed 1; medical-lab landing research + cross-reference +2; data-center landing research + cross-reference +2; IT landing cross-reference +1) // 402 -> 403 in White-Glove Expansion + Trust Ledger 2026-11-05: +1 (the new trust-ledger Dataset node of datasets-white-glove.json in its landing embed) // 400 -> 402 in B2 Commercial & Office deepening 2026-11-05: +2 (the new research Dataset nodes of datasets-commercial.json and datasets-office.json in their landing embeds) // 398 -> 400 in the Premiere upgrade 2026-11-05: +2 (the new research Dataset nodes of datasets-white-glove.json and datasets-transloading-winchester.json in their landing embeds) // 397 -> 398 in B1 Local & Regional deepening 2026-11-05: +1 (the new research Dataset node of datasets-local-regional.json in the /datasets/local-regional/ landing embed; the batch’s other two new nodes are Article and Service typed and do not count) // 394 -> 397 in Hoarding Cleanout 2026-11-05: +3 (the hoarding-cleanup landing embed: the file's operations + research Dataset nodes, 2; the intent landing embed: the new hoarding-cleanup service coverage node, 1) // 390 -> 394 in Vault Wave 1 2026-11-04: +4 (the vault-security landing embed: the file's registry and locking Dataset nodes, 2 — the landing's own per-page Dataset node rides the authored block this counter excludes; the vault-doors landing embed: the file's door-models Dataset node, 1; the intent landing embed: the new #intent-coverage-vault-door coverage node, 1). The batch's first derivation read 396 by counting the two authored per-page nodes; corrected to the measured 394 at the phase-5 gate // 383 -> 390 in Catalog Registry 2026-11-03: +7 (the 7 Dataset-typed nodes of datasets-catalog-registry.json — scope, catalogs, datasets, observations, diagnostics, gaps, totals — embedded in the /datasets/catalog-registry/ landing route document) // 381 -> 383 in Ports P4 2026-11-03: +2 (the two new services’ intent-coverage nodes — #intent-coverage-logistics-project-management and #intent-coverage-3pl-support — in the re-synced /datasets/intent-coverage/ landing embed; the four new hub route documents contribute no counted instances) // 377 -> 381 in Ports P3 2026-11-03: +4 (the 2 Dataset-typed nodes of datasets-port-of-virginia.json — summary + coverage — embedded in the /port-of-virginia-logistics/ hub and the /datasets/port-of-virginia/ landing route documents) // 376 -> 377 in Page Data Pool 2026-11-03: +1 (the 1 Dataset-typed summary node of datasets-page-data-pool.json embedded in the /datasets/page-data-pool/ landing route document; the pool file's other Dataset-typed records are nested inside ItemLists and do not count) // 374 -> 376 in Quote Tool 2026-11-03: +2 (the 2 Dataset-typed nodes of datasets-quote-tool.json — summary + coverage rubric — embedded in the /datasets/quote-tool/ landing route document) // 372 -> 374 in VC-1 Vault Case Study 2026-11-03: +2 (the 2 Dataset-typed nodes of datasets-vault-door-case-study.json — summary + case record — embedded in the /datasets/vault-door-case-study/ landing route document) // 368 -> 372 in Ports P1 Foundation 2026-11-02: +4 (the 2 Dataset nodes of datasets-ports.json embedded in the /datasets/ports/ landing and the /transloading/ hub) // 367 -> 368 in Consolidated Visibility Batch 2026-11-02: +1 (new Local Graph Registry backlinks Dataset node in its landing embedding); the same batch's intent landing re-sync is Dataset-count-neutral (34 instances before and after) // 362 -> 367 in head-hubs + white-glove batch 2026-11-02: +4 (Dataset-type nodes of datasets-white-glove.json in its landing embedding) + 1 (new service coverage node in the re-synced intent landing embed) // 353 -> 362 in freight-rework batch 2026-11-01: +8 instances (4 Dataset-type nodes of datasets-freight-rework.json x hub + landing embeddings) + 1 (new service coverage node in the re-synced intent landing embed); previously 343 -> 353 in E6-B1 2026-11-01

manifest.sort((a, b) => (a.url < b.url ? -1 : 1));
fs.writeFileSync(path.join(outDir, 'routes-manifest.json'), JSON.stringify({ generated: '2026-10-31', count: manifest.length, documents: manifest }, null, 1) + '\n');
const sizes = manifest.map((m) => m.bytes).sort((a, b) => a - b);
console.log('build-routes: ' + manifest.length + ' route documents generated');
console.log('  raw bytes: min ' + sizes[0] + ', median ' + sizes[Math.floor(sizes.length / 2)] + ', max ' + sizes[sizes.length - 1]);
console.log('  quote segment md5: ' + segMd5 + ' (canonical)');
console.log('  D-2 Dataset-node instances: ' + d2Instances + ' (== pre-A shell total)');
console.log('  embed DataDownload hashes injected from final files: ' + embedHashesInjected);
console.log('  landing printed hashes injected from final files: ' + printedHashesInjected);
console.log('  stray </main> in source accounted for: ' + strayMainClose);
for (const u of ['/', '/gun-safe-movers/', '/transloading-vs-cross-docking-vs-deconsolidation/', '/1650-lb-gun-safe-delivered-and-installed-moorefield-wv/']) {
  const m = manifest.find((x) => x.url === 'https://theflatratemovers.com' + u);
  if (m) console.log('  ' + u + ' -> ' + m.bytes + ' raw bytes');
}
