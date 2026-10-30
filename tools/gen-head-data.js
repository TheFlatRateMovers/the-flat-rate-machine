#!/usr/bin/env node
// Batch 9 — Item 1 head-data generator.
// Derives the per-URL head map from the estate's OWN sources of truth:
//   - pageMeta + setPageLD() extracted verbatim from public/index.html
//     (the page JSON-LD is produced by RUNNING the site's own function
//     against a DOM stub, so the served head is byte-identical to what
//     the client router computes today);
//   - data/pages.json (registry) for slug <-> URL;
//   - work/slug-file-map.json for each page's per-page JSON file.
// Output: files/head-data.js (a Pages Functions module) + work/head-report.json
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HOME_DIR = process.env.HOME;
const PUB = path.join(HOME_DIR, 'workspace/the-flat-rate-movers-pages/public');
const ROOT = path.join(HOME_DIR, 'workspace/the-flat-rate-machine/out/batch-data-center-physical');
const html = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');

function extractLiteral(src, marker) {
  let i = src.indexOf(marker);
  if (i < 0) throw new Error('marker not found: ' + marker);
  let j = src.indexOf('{', i), depth = 0, k = j, inStr = false, esc = false, q = '';
  for (; k < src.length; k++) {
    const c = src[k];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === q) inStr = false; continue; }
    if (c === "'" || c === '"' || c === '`') { inStr = true; q = c; continue; }
    if (c === '{') depth++;
    if (c === '}') { depth--; if (depth === 0) { k++; break; } }
  }
  return src.slice(j, k);
}
function extractFunction(src, marker) {
  let i = src.indexOf(marker);
  if (i < 0) throw new Error('function not found: ' + marker);
  let j = src.indexOf('{', i), depth = 0, k = j, inStr = false, esc = false, q = '';
  for (; k < src.length; k++) {
    const c = src[k];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === q) inStr = false; continue; }
    if (c === "'" || c === '"' || c === '`') { inStr = true; q = c; continue; }
    if (c === '{') depth++;
    if (c === '}') { depth--; if (depth === 0) { k++; break; } }
  }
  return src.slice(i, k);
}

const pageMeta = vm.runInNewContext('(' + extractLiteral(html, 'pageMeta={') + ')');
const setPageLDsrc = extractFunction(html, 'function setPageLD');

// DOM stub: setPageLD touches #canonicalLink (href) and #page-jsonld (textContent).
function runSetPageLD(key) {
  const els = { canonicalLink: { href: '' }, 'page-jsonld': { textContent: '' } };
  const ctx = {
    pageMeta,
    document: { getElementById: (id) => els[id] || null },
  };
  vm.createContext(ctx);
  vm.runInContext(setPageLDsrc + '\nsetPageLD(' + JSON.stringify(key) + ');', ctx);
  return { ld: els['page-jsonld'].textContent, canonical: els.canonicalLink.href };
}

const registry = JSON.parse(fs.readFileSync(path.join(HOME_DIR, 'workspace/the-flat-rate-machine/data/pages.json'), 'utf8')).pages;
const slugFile = JSON.parse(fs.readFileSync(path.join(ROOT, 'work/slug-file-map.json'), 'utf8'));
const metaByUrl = {};
for (const [k, m] of Object.entries(pageMeta)) metaByUrl[m.canonical] = { key: k, meta: m };

const DEFAULT_IMG = 'https://theflatratemovers.com/assets/img-02-0b80bbb82653.jpg';
const assets = new Set(fs.readdirSync(path.join(PUB, 'assets')));

const head = {};
const report = { pages: [], imgFallbacks: [], problems: [] };
for (const p of registry) {
  const rec = metaByUrl[p.url];
  if (!rec) { report.problems.push(p.slug + ': no pageMeta for ' + p.url); continue; }
  const { key, meta } = rec;
  const { ld, canonical } = runSetPageLD(key);
  let ldObj = null;
  try { ldObj = JSON.parse(ld); } catch (e) { report.problems.push(p.slug + ': pageLd does not parse: ' + e.message); }
  if (canonical !== p.url) report.problems.push(p.slug + ': setPageLD canonical ' + canonical + ' != registry ' + p.url);
  const title = key === 'home' ? 'The Flat Rate Movers — Trust First. Flat Rate. Route 81.' : 'The Flat Rate Movers — ' + meta.name;
  let img = DEFAULT_IMG, imgSwapped = false;
  if (meta.img) {
    const fname = meta.img.split('/').pop();
    if (assets.has(fname)) { img = 'https://theflatratemovers.com/' + meta.img; imgSwapped = img !== DEFAULT_IMG; }
    else report.imgFallbacks.push(p.slug + ': meta.img ' + meta.img + ' not in assets/ — default kept');
  }
  const jf = slugFile[p.slug];
  if (!jf) { report.problems.push(p.slug + ': no per-page JSON file in map'); continue; }
  const jfPath = path.join(PUB, jf);
  const jfText = fs.readFileSync(jfPath, 'utf8');
  try { JSON.parse(jfText); } catch (e) { report.problems.push(p.slug + ': per-page JSON does not parse: ' + e.message); }
  if (/<\/script/i.test(jfText)) report.problems.push(p.slug + ': per-page JSON contains </script — cannot embed');
  const urlPath = new URL(p.url).pathname; // '/x/' or '/'
  const mapKey = urlPath === '/' ? '/' : urlPath.replace(/\/$/, '');
  head[mapKey] = {
    slug: p.slug, key, t: title, d: meta.desc, c: p.url,
    og: meta.article ? 'article' : 'website',
    img, imgSwapped, ld, jf,
  };
  report.pages.push({ slug: p.slug, key, path: mapKey, jf, ldBytes: ld.length, jfBytes: jfText.length, imgSwapped });
}
report.count = Object.keys(head).length;
fs.writeFileSync(path.join(ROOT, 'work/head-report.json'), JSON.stringify(report, null, 1));
const out = '// GENERATED by out/batch-data-center-physical/tools/gen-head-data.js — do not hand-edit.\n' +
  '// Source of truth: pageMeta + setPageLD() in public/index.html, data/pages.json,\n' +
  '// and each page\'s published per-page JSON. Regenerate after any of those change.\n' +
  'export const HEAD = ' + JSON.stringify(head, null, 1) + ';\n';
fs.writeFileSync(path.join(ROOT, 'files/head-data.js'), out);
console.log('head entries:', report.count, '| problems:', report.problems.length, '| img fallbacks:', report.imgFallbacks.length);
for (const x of report.problems) console.log('  PROBLEM:', x);
for (const x of report.imgFallbacks) console.log('  IMG:', x);
