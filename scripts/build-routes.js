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
  rep(/<script type="application\/ld\+json" id="page-jsonld"><\/script>/,
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
/* Segment the shell                                                   */
/* ------------------------------------------------------------------ */
const headEnd = shell.indexOf('</head>') + '</head>'.length;
if (headEnd < 7) fail('no </head> in shell');
const headTemplate = shell.slice(0, headEnd);
if (!headTemplate.includes('id="canonicalLink"')) fail('head template lacks the canonical marker');
if (!headTemplate.includes('<script type="application/ld+json" id="page-jsonld"></script>')) fail('head template lacks the empty page-jsonld slot');

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

/* ------------------------------------------------------------------ */
/* Generate                                                            */
/* ------------------------------------------------------------------ */
fs.mkdirSync(outDir, { recursive: true });
const manifest = [];
const QUOTE_MD5 = '4d8d49f05b22b129eac623a41370d9cb';
let d2Instances = 0;

for (const p of pages) {
  const key = p.url.replace('https://theflatratemovers.com', '').replace(/\/$/, '') || '/';
  const entry = HEAD[key];
  if (!entry) fail('no head-data entry for ' + p.url);
  if (entry.c !== p.url) fail('head-data canonical mismatch for ' + p.slug + ': ' + entry.c + ' vs ' + p.url);
  let pageJsonText = null;
  const jfPath = path.join(publicDir, entry.jf);
  if (fs.existsSync(jfPath)) {
    const t = fs.readFileSync(jfPath, 'utf8');
    if (t && !/<\/script/i.test(t)) pageJsonText = t;
  }
  const head = transformHead(headTemplate, entry, pageJsonText);
  const routeSlug = metaKeyByUrl.get(p.url);
  const div = divs.find((d) => d.slug === routeSlug);
  if (!div) fail('div missing for pageMeta key ' + routeSlug);
  const divShow = div.text.replace('<div class="page" id=', '<div class="page show" id=');
  const banner = banners.get(routeSlug);
  const doc = head + prefix + (banner ? banner + '\n' : '') + divShow + '\n</main>\n' + footerTemplate;

  /* Per-document assertions. */
  if (!doc.includes('<title>' + escText(entry.t) + '</title>')) fail(routeSlug + ': baked title mismatch');
  if (!doc.includes('id="page-' + routeSlug + '"')) fail(routeSlug + ': own div missing');
  if ((doc.match(/<div class="page( show)?" id="page-/g) || []).length !== 1) fail(routeSlug + ': foreign page div present');
  const ld = (doc.match(/<script type="application\/ld\+json" id="page-jsonld">([\s\S]*?)<\/script>/) || [])[1];
  if (!ld || JSON.stringify(JSON.parse(ld)) !== JSON.stringify(JSON.parse(entry.ld))) fail(routeSlug + ': baked page-jsonld mismatch');
  if (pageJsonText && !doc.includes('data-page-json="' + entry.jf + '"')) fail(routeSlug + ': data-page-json script missing');
  /* D-2 population: Dataset nodes outside the two injected head scripts. */
  for (const m of doc.matchAll(/<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (m[1].includes('id="page-jsonld"') || m[1].includes('data-page-json=')) continue;
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
if (d2Instances !== 304) fail('D-2 Dataset-node instances across route documents: ' + d2Instances + ' (expected 304)');

manifest.sort((a, b) => (a.url < b.url ? -1 : 1));
fs.writeFileSync(path.join(outDir, 'routes-manifest.json'), JSON.stringify({ generated: '2026-10-31', count: manifest.length, documents: manifest }, null, 1) + '\n');
const sizes = manifest.map((m) => m.bytes).sort((a, b) => a - b);
console.log('build-routes: ' + manifest.length + ' route documents generated');
console.log('  raw bytes: min ' + sizes[0] + ', median ' + sizes[Math.floor(sizes.length / 2)] + ', max ' + sizes[sizes.length - 1]);
console.log('  quote segment md5: ' + segMd5 + ' (canonical)');
console.log('  D-2 Dataset-node instances: ' + d2Instances + ' (== pre-A shell total)');
console.log('  stray </main> in source accounted for: ' + strayMainClose);
for (const u of ['/', '/gun-safe-movers/', '/transloading-vs-cross-docking-vs-deconsolidation/', '/1650-lb-gun-safe-delivered-and-installed-moorefield-wv/']) {
  const m = manifest.find((x) => x.url === 'https://theflatratemovers.com' + u);
  if (m) console.log('  ' + u + ' -> ' + m.bytes + ' raw bytes');
}
