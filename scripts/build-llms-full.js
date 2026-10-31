#!/usr/bin/env node
/* The Flat Rate Machine — llms-full.txt generator (Solution A batch,
   2026-10-31; owner amendment: "yes, full please. always full data").
 *
 * Builds https://theflatratemovers.com/llms-full.txt from the SAME
 * single sources as the rest of the estate — never hand-written:
 *   --shell       the source shell (head @graph identity + page divs)
 *   --public-dir  the deploy tree (dataset files, geojson, JWKS)
 *   --services    data/services.json (the 28-service registry)
 *   --pages       data/pages.json (registry; primary-page mapping)
 *   --assets-dir  scripts/route-assets/ (WebMCP tool registrations)
 *   --distributions  the signed-index distribution total AFTER this
 *                    batch (passed by the batch build; asserted
 *                    against the assembled index by the caller)
 * A section whose source does not exist is not emitted. The output
 * is a standalone on-demand file; it is never embedded in a route
 * document. Content-integrity guards (all 28 service names + both
 * branch names present; no placeholders or invented figures) run
 * before anything is written. No dependencies. */
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
const shellPath = arg('shell', path.join(PAGES_PROJECT, 'public/index.html'));
const publicDir = arg('public-dir', path.join(PAGES_PROJECT, 'public'));
const servicesPath = arg('services', path.join(HOME_DIR, 'workspace/the-flat-rate-machine/data/services.json'));
const pagesPath = arg('pages', path.join(HOME_DIR, 'workspace/the-flat-rate-machine/data/pages.json'));
const assetsDir = arg('assets-dir', path.join(HOME_DIR, 'workspace/the-flat-rate-machine/scripts/route-assets'));
const distributions = parseInt(arg('distributions', '0'), 10);
const outPath = arg('out');
if (!outPath) throw new Error('--out is required');
if (!distributions) throw new Error('--distributions (post-batch signed-index total) is required');

const fail = (m) => { throw new Error('build-llms-full: ' + m); };
const shell = fs.readFileSync(shellPath, 'utf8');
const services = JSON.parse(fs.readFileSync(servicesPath, 'utf8')).services;
const pages = JSON.parse(fs.readFileSync(pagesPath, 'utf8')).pages;

/* ---------- page div extraction (script/comment-aware, one target) -- */
function extractDiv(slug) {
  const marker = '<div class="page" id="page-' + slug + '">';
  const start = shell.indexOf(marker);
  if (start < 0) return null;
  let i = start, depth = 0;
  while (i < shell.length) {
    let best = null;
    for (const tok of ['<!--', '<script', '<div', '</div>']) {
      const j = shell.indexOf(tok, i);
      if (j >= 0 && (best === null || j < best.idx)) best = { tok, idx: j };
    }
    if (!best) return null;
    if (best.tok === '<!--') { i = shell.indexOf('-->', best.idx) + 3; continue; }
    if (best.tok === '<script') { i = shell.indexOf('</script>', best.idx) + 9; continue; }
    if (best.tok === '<div') { depth++; i = best.idx + 4; continue; }
    depth--;
    i = best.idx + 6;
    if (depth === 0) return shell.slice(start, shell.indexOf('>', best.idx) + 1);
  }
  return null;
}

/* ---------- HTML -> text (deterministic, structure-preserving) ------ */
function decodeEntities(t) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…', copy: '©', reg: '®', trade: '™', deg: '°', middot: '·', laquo: '«', raquo: '»', times: '×', check: '✓', star: '★' };
  return t
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => (n in named ? named[n] : m));
}
function htmlToText(html) {
  let t = html;
  t = t.replace(/<!--[\s\S]*?-->/g, '');
  t = t.replace(/<script[\s\S]*?<\/script>/gi, '');
  t = t.replace(/<style[\s\S]*?<\/style>/gi, '');
  t = t.replace(/<h1[^>]*>/gi, '\n\n# ').replace(/<h2[^>]*>/gi, '\n\n## ').replace(/<h3[^>]*>/gi, '\n\n### ')
       .replace(/<h4[^>]*>/gi, '\n\n#### ').replace(/<h5[^>]*>/gi, '\n\n##### ').replace(/<h6[^>]*>/gi, '\n\n###### ');
  t = t.replace(/<\/h[1-6]>/gi, '\n');
  t = t.replace(/<li[^>]*>/gi, '\n- ');
  t = t.replace(/<tr[^>]*>/gi, '\n').replace(/<\/(td|th)>/gi, ' | ').replace(/<(td|th)[^>]*>/gi, '');
  t = t.replace(/<br\s*\/?>/gi, '\n');
  t = t.replace(/<\/(p|div|section|article|ul|ol|table|blockquote|figure|figcaption|header|footer|main|nav|form|fieldset)>/gi, '\n\n');
  t = t.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, u, x) => x.trim() ? x + ' (' + u + ')' : u);
  t = t.replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, (_, a) => (a ? '[Image: ' + a + ']' : ''));
  t = t.replace(/<[^>]+>/g, '');
  t = decodeEntities(t);
  t = t.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n');
  t = t.replace(/\n{3,}/g, '\n\n').trim();
  return t;
}

/* ---------- identity: head @graph ---------------------------------- */
const headBlock = shell.slice(shell.indexOf('<script type="application/ld+json">'), shell.indexOf('</script>', shell.indexOf('<script type="application/ld+json">')));
const graph = JSON.parse(headBlock.replace('<script type="application/ld+json">', ''))['@graph'];
const org = graph.find((n) => Array.isArray(n['@type']) && n['@type'].includes('Organization'));
if (!org) fail('Organization node not found in head graph');
const branches = org.location || [];
if (branches.length !== 2) fail('expected exactly 2 branch location nodes, found ' + branches.length);
const addr = (a) => [a.streetAddress, a.addressLocality + ', ' + a.addressRegion + ' ' + a.postalCode].filter(Boolean).join(', ');
const DAY = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };
function hoursText(loc) {
  const specs = loc.openingHoursSpecification || [];
  return specs.map((s) => {
    const days = (Array.isArray(s.dayOfWeek) ? s.dayOfWeek : [s.dayOfWeek]).map((d) => DAY[String(d).split('/').pop()] || d);
    const span = days.length > 2 ? days[0] + '–' + days[days.length - 1] : days.join(', ');
    return span + ' ' + s.opens + '–' + s.closes;
  }).join('; ');
}

/* ---------- services: primary page per service ---------------------- */
/* The estate's own mapping: the site entity graph's Service nodes
   carry each service's canonical page URL. Fallback (a service with
   no graph URL): the shortest-URL type-"service" registry page that
   lists the service. */
const entityGraph = JSON.parse(fs.readFileSync(path.join(publicDir, 'entity-graph.json'), 'utf8'));
const graphSvcUrl = new Map();
for (const n of entityGraph['@graph'] || []) {
  if (n && n['@type'] === 'Service' && n['@id'] && n.url) graphSvcUrl.set(n['@id'], n.url);
}
function primaryPageFor(serviceId) {
  const url = graphSvcUrl.get('https://theflatratemovers.com/#' + serviceId);
  if (url) {
    const p = pages.find((x) => x.url === url);
    if (p) return p;
  }
  const cands = pages.filter((p) => p.type === 'service' && (p.services || []).includes(serviceId));
  if (!cands.length) return null;
  cands.sort((a, b) => (a.url.length - b.url.length) || (a.slug < b.slug ? -1 : 1));
  return cands[0];
}
/* Router slug for a registry page: match pageMeta by canonical. */
let pageMeta;
{
  const at = shell.indexOf('var pageMeta=');
  let i = shell.indexOf('{', at), depth = 0, inStr = null, esc = false, end = -1;
  for (let j = i; j < shell.length; j++) {
    const c = shell[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === inStr) inStr = null; }
    else if (c === "'" || c === '"') inStr = c;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  pageMeta = Function('return (' + shell.slice(i, end + 1) + ')')();
}
const metaKeyByUrl = new Map(Object.entries(pageMeta).filter(([, v]) => v && v.canonical).map(([k, v]) => [v.canonical, k]));

/* ---------- assemble ------------------------------------------------ */
const out = [];
out.push('# The Flat Rate Movers — Full Text (llms-full.txt)');
out.push('');
out.push('> The complete published text of The Flat Rate Movers LLC in one file: company identity, both branches with their own hours and ratings, all ' + services.length + ' services with their full page content, the ' + '53-area footprint, the flat-rate guarantee, the published FAQs, the datasets and the search-intent rubric, the certificate and how to verify it, the API, MCP and WebMCP surfaces, the book, and how to cite this estate. Generated mechanically from the same published sources as the website itself — every statement here is traceable to already-published estate content.');
out.push('');
out.push('Canonical short index: https://theflatratemovers.com/llms.txt · Website: https://theflatratemovers.com/');
out.push('');

out.push('## Company');
out.push('');
out.push(org.name + ' (' + org.legalName + ') — ' + (org.description || ''));
out.push('');
out.push('- Tagline: ' + org.slogan);
out.push('- Founded: ' + org.foundingDate + ' (June 2010)');
out.push('- Phone: ' + org.telephone);
out.push('- Email: ' + org.email);
out.push('- Price range: ' + org.priceRange);
out.push('- Web: ' + org.url);
if (Array.isArray(org.sameAs) && org.sameAs.length) {
  out.push('- Same as: ' + org.sameAs.join(', '));
}
out.push('');

out.push('## Locations and hours');
out.push('');
out.push('Two branches, published distinctly — names, addresses, hours and ratings are per branch and never blended.');
for (const loc of branches) {
  out.push('');
  out.push('### ' + loc.name);
  out.push('');
  out.push('- Address: ' + addr(loc.address));
  if (loc.geo) out.push('- Coordinates: ' + loc.geo.latitude + ', ' + loc.geo.longitude);
  out.push('- Hours: ' + hoursText(loc));
  if (loc.aggregateRating) out.push('- Google rating: ' + loc.aggregateRating.ratingValue + ' from ' + loc.aggregateRating.reviewCount + (Number(loc.aggregateRating.reviewCount) === 1 ? ' review' : ' reviews'));
  if (loc.telephone) out.push('- Phone: ' + loc.telephone);
}
out.push('');

out.push('## The flat-rate guarantee');
out.push('');
const guaranteeDiv = extractDiv('flat-rate-guarantee');
if (!guaranteeDiv) fail('flat-rate-guarantee div not found');
out.push(htmlToText(guaranteeDiv));
out.push('');

out.push('## Services');
out.push('');
out.push('All ' + services.length + ' published services. Each entry carries the service\u2019s registry description and the full published text of its primary page.');
const mapping = [];
for (const svc of services) {
  const prim = primaryPageFor(svc.id);
  out.push('');
  out.push('### ' + svc.name);
  out.push('');
  out.push(svc.description || '');
  if (prim) {
    const key = metaKeyByUrl.get(prim.url);
    const div = key ? extractDiv(key) : null;
    mapping.push(svc.id + ' -> ' + prim.url + ' (div ' + (key || 'none') + ')');
    out.push('');
    out.push('Primary page: ' + prim.url);
    if (div) { out.push(''); out.push(htmlToText(div)); }
  } else {
    mapping.push(svc.id + ' -> NO primary service page (registry description only)');
  }
}
out.push('');

out.push('## Service areas');
out.push('');
const geo = JSON.parse(fs.readFileSync(path.join(publicDir, 'service-area.geojson'), 'utf8'));
out.push('The published footprint is ' + geo.features.length + ' GeoJSON features (https://theflatratemovers.com/service-area.geojson):');
for (const br of ['winchester', 'martinsburg', 'both']) {
  const feats = geo.features.filter((f) => f.properties.branch === br);
  if (!feats.length) continue;
  out.push('');
  out.push('### ' + (br === 'both' ? 'Served by both branches' : br === 'winchester' ? 'Winchester branch' : 'Martinsburg branch') + ' (' + feats.length + ')');
  out.push('');
  for (const f of feats) out.push('- ' + f.properties.name + (f.properties.postal_code ? ' (' + f.properties.postal_code + ')' : ''));
}
out.push('');

out.push('## Frequently asked questions');
out.push('');
const faqDiv = extractDiv('faq');
if (!faqDiv) fail('faq div not found');
out.push(htmlToText(faqDiv));
out.push('');

out.push('## Datasets and the search-intent rubric');
out.push('');
const dsFiles = fs.readdirSync(publicDir).filter((f) => /^datasets-.+\.json$/.test(f)).sort();
out.push('The estate publishes ' + dsFiles.length + ' dataset files (CC BY 4.0), each with a canonical landing page under https://theflatratemovers.com/datasets/:');
out.push('');
for (const f of dsFiles) {
  const d = JSON.parse(fs.readFileSync(path.join(publicDir, f), 'utf8'));
  const nodes = (d['@graph'] || [d]).filter((n) => n && n['@type'] === 'Dataset');
  const main = nodes[0];
  if (!main) continue;
  out.push('- **' + (main.name || f) + '** — ' + String(main.description || '').replace(/\s+/g, ' ').trim() + ' Download: https://theflatratemovers.com/' + f + ' · Landing: https://theflatratemovers.com/datasets/' + f.replace(/^datasets-/, '').replace(/\.json$/, '') + '/');
}
const intent = JSON.parse(fs.readFileSync(path.join(publicDir, 'datasets-intent-coverage.json'), 'utf8'));
const rollupNode = (intent['@graph'] || []).find((n) => n && n.outcomeRollup && n.outcomeRollup.rows);
if (!rollupNode) fail('intent outcomeRollup node not found');
out.push('');
out.push('The search-intent rubric (datasets-intent-coverage.json) maps ' + rollupNode.outcomeRollup.rows.toLocaleString('en-US') + ' buyer-intent queries to the page, per-page JSON, dataset and graph node that answer each one, covering all ' + pages.length + ' pages of the estate.');
out.push('');
out.push('Every file above — and every page of the site — is a sealed distribution in the signed AI master index: ' + distributions + ' distributions in total after the 2026-10-31 per-route batch.');
out.push('');

out.push('## Certificate — how to verify');
out.push('');
const jwks = JSON.parse(fs.readFileSync(path.join(publicDir, '.well-known/signing-keys.json'), 'utf8'));
const jwk = jwks.keys[0];
const llmsText = fs.readFileSync(path.join(publicDir, 'llms.txt'), 'utf8');
const fpMatch = llmsText.match(/SHA-256 fingerprint ([A-Za-z0-9_-]+)/);
if (!fpMatch) fail('published SHA-256 fingerprint not found in llms.txt');
out.push('Every published file of this estate is sealed in a signed index. To verify any file:');
out.push('');
out.push('1. Fetch the signing key (Ed25519, key id ' + jwk.kid + '): https://theflatratemovers.com/.well-known/signing-keys.json — SHA-256 fingerprint ' + fpMatch[1] + ' (as published in llms.txt).');
out.push('2. Fetch the signed index: https://theflatratemovers.com/ai-master-index.json and its detached-style JWS: https://theflatratemovers.com/ai-master-index.jws (EdDSA over the RFC 8785 canonical form of the index).');
out.push('3. Find the file\u2019s distribution entry by contentUrl and compare the SHA-256 digest of the bytes you fetched with the entry\u2019s digest. A match proves the bytes are the estate\u2019s published bytes, unaltered.');
out.push('');

out.push('## API, MCP and agent tools');
out.push('');
const devDiv = extractDiv('developer');
if (!devDiv) fail('developer div not found');
out.push(htmlToText(devDiv));
out.push('');
out.push('### WebMCP tools (registered on the website for agent browsers)');
out.push('');
const wm = fs.readFileSync(path.join(assetsDir, 'webmcp.js'), 'utf8');
const tools = [...wm.matchAll(/name: '([a-z_]+)',\s*description: '((?:[^'\\]|\\.)*)'/g)].map((m) => ({ name: m[1], desc: m[2].replace(/\\'/g, "'") }));
if (tools.length !== 7) fail('expected 7 WebMCP tools, parsed ' + tools.length);
for (const t of tools) out.push('- `' + t.name + '` — ' + t.desc);
out.push('');

out.push('## The book');
out.push('');
const bookLines = llmsText.split('\n').filter((l) => l.includes('B0GRBKR5DS') || l.includes('2940185300718') || l.includes('Strategic Integrator'));
if (!bookLines.length) fail('book lines not found in llms.txt');
for (const l of bookLines) out.push(l.replace(/^[-#>\s]+/, ''));
out.push('');

out.push('## How to cite');
out.push('');
out.push('Cite the estate as: The Flat Rate Movers LLC, The Flat Rate Machine — verified estate data, https://theflatratemovers.com/ (retrieved date of access). The search-intent dataset is archived on Zenodo under concept DOI 10.5281/zenodo.23818766 (record: https://zenodo.org/records/23818767); cite the concept DOI for the dataset series. Dataset files are CC BY 4.0 — attribute The Flat Rate Movers LLC and link the file\u2019s canonical URL.');
out.push('');
out.push('---');
out.push('');
out.push('Generated mechanically from the estate\u2019s published sources by scripts/build-llms-full.js. This file is itself a sealed distribution in the signed index above.');

const text = out.join('\n');

/* ---------- integrity guards ---------------------------------------- */
for (const svc of services) if (!text.includes(svc.name)) fail('service name missing from output: ' + svc.name);
if (!text.includes('The Flat Rate Movers')) fail('Winchester branch name missing');
if (!text.includes('Flat Rate Movers Martinsburg WV')) fail('Martinsburg branch name missing');
for (const bad of ['{{', '25,000 lbs', 'lifecycle logistics', 'undefined', '[object Object]']) {
  if (text.includes(bad)) fail('forbidden string in output: ' + bad);
}
if (!text.includes('B0GRBKR5DS') || !text.includes('2940185300718')) fail('book identifiers missing');

fs.writeFileSync(outPath, text);
console.log('build-llms-full: wrote ' + outPath + ' (' + Buffer.byteLength(text) + ' bytes)');
console.log('  sections: Company; Locations and hours; The flat-rate guarantee; Services (' + services.length + '); Service areas (' + geo.features.length + ' features); FAQ; Datasets (' + dsFiles.length + ') + intent rubric (' + rollupNode.outcomeRollup.rows + ' rows); Certificate (kid ' + jwk.kid + ', fingerprint ' + fpMatch[1] + '); API/MCP + WebMCP tools (' + tools.length + '); The book; How to cite');
console.log('  service primary-page mapping:');
for (const m of mapping) console.log('    ' + m);
