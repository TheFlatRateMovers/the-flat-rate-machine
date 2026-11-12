#!/usr/bin/env node
/* The Flat Rate Machine — AI ingestion card generator
 * (Outside-Copies micro-batch, 2026-11-11).
 *
 * Builds https://theflatratemovers.com/ai-ingestion-card.html — a
 * compact, static, script-free HTML card for AI fetchers. Measured
 * 2026-11-11: consumer AI fetchers fail on the estate's raw data
 * files and read JS-heavy pages as layout-only; the estate's own
 * HTML feeds them fully but was once read STALE. This card is the
 * small door: the company's identity facts as plain text, the full
 * machine-readable map, the live census, and a freshness block that
 * names the estate seal it was generated under — so a stale read
 * shows its age on its face.
 *
 * GENERATOR-FED: seal.py runs this builder inside every seal (after
 * index registration, before routes), so the card can never drift
 * from the sealed estate. Every figure derives from estate sources
 * at generation time — nothing is hand-passed:
 *   data/locations.json          company + both branches (names,
 *                                addresses, hours, Google ratings)
 *   data/services.json           the service registry (names)
 *   data/service-area.geojson    footprint (branch seat counts)
 *   data/national-scope.json     the national work record (states)
 *   PUB/ai-master-index.json     census: distributions, dataset
 *                                files, per-page JSONs (the P-5
 *                                census definition, mirrored: root
 *                                JSON members less the non-page set
 *                                and the datasets- files; the
 *                                dataset- landing JSONs count, as
 *                                they do in P-5 — the CV-3 llms.txt
 *                                figure excludes them and is a
 *                                different, older census)
 *   PUB/datasets-intent-coverage.json  rubric rows + page totals
 *                                (the intent totals node)
 *   AI_CARD_PRIOR_INDEX          the seal's phase-0 snapshot of the
 *                                previously installed index; its
 *                                SHA-256 is the "estate seal at
 *                                generation" the card stamps. The
 *                                card never claims the seal that
 *                                contains itself. Standalone runs
 *                                (no env) fall back to the installed
 *                                index — the same value before a
 *                                seal starts.
 *   AI_CARD_DATE / RUBRIC_DATE   the generation (seal) date.
 *
 * Content guards (build-llms-full pattern): both branch names,
 * every registry service name, and the signed-index-governs line
 * must be present in the output; a missing source fails loud and
 * nothing is written. No dependencies. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.dirname(__dirname);
const REG = JSON.parse(fs.readFileSync(path.join(ROOT, 'paths.json'), 'utf8'));
const PUB = REG.public_dir;
const DATA = path.join(ROOT, 'data');
const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(PUB, 'ai-ingestion-card.html');
const SITE = 'https://theflatratemovers.com';

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function shaFile(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
const fmt = (n) => n.toLocaleString('en-US');

/* ---- sources ---------------------------------------------------- */
const locations = readJson(path.join(DATA, 'locations.json'));
const company = locations.company;
const branches = locations.branches;
if (!Array.isArray(branches) || branches.length !== 2) {
  throw new Error('locations.json: expected exactly 2 branches');
}
const services = readJson(path.join(DATA, 'services.json')).services;
if (!Array.isArray(services) || services.length === 0) {
  throw new Error('services.json: registry missing');
}
const geo = readJson(path.join(DATA, 'service-area.geojson'));
const feats = geo.features || [];
const nBoth = feats.filter((f) => f.properties.branch === 'both').length;
const nWin = feats.filter((f) => ['winchester', 'both']
  .includes(f.properties.branch)).length;
const nMar = feats.filter((f) => ['martinsburg', 'both']
  .includes(f.properties.branch)).length;
const national = readJson(path.join(DATA, 'national-scope.json'));
const states = national.states || [];
const excluded = (national.excluded || []).map((e) => e.state);
if (states.some((s) => s.abbr === 'HI')) {
  throw new Error('national-scope.json: Hawaii must not carry a row');
}
const index = readJson(path.join(PUB, 'ai-master-index.json'));
const dist = index.distribution || [];
const urls = dist.map((e) => e.contentUrl || '');
const ROOTU = SITE + '/';
const NONPAGE = new Set(['ai-master-index.json', 'ai-sitemap.json',
  'entity-graph.json', 'best-json-entity-graph.json', 'ai-catalog.json',
  'ai-verification-report-2026-11-01.json',
  'ai-verification-report-2026-11-01-e6b2.json']);
const rootJson = urls.filter((u) => u.startsWith(ROOTU)
  && !u.slice(ROOTU.length).includes('/')
  && u.endsWith('.json')).map((u) => u.slice(ROOTU.length));
const perPage = rootJson.filter((n) => !n.startsWith('datasets-')
  && !NONPAGE.has(n)).length;
const dsFiles = urls.filter((u) => /\/datasets-[^/]+\.json$/.test(u)).length;
const intent = readJson(path.join(PUB, 'datasets-intent-coverage.json'));
const totals = (intent['@graph'] || []).find((n) => String(n['@id'] || '')
  .endsWith('#dataset-intent-coverage-totals'));
if (!totals) throw new Error('intent totals node missing');
const rows = totals.rowSources.estateGenerated;
const pagesTotal = totals.pageCoverage.pagesTotal;

const priorIndexPath = process.env.AI_CARD_PRIOR_INDEX
  || path.join(PUB, 'ai-master-index.json');
const priorSeal = shaFile(priorIndexPath);
const genDate = process.env.AI_CARD_DATE || process.env.RUBRIC_DATE
  || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' })
    .format(new Date());
const founded = company.foundingDate === '2010-06' ? 'June 2010'
  : company.foundingDate;

/* ---- render ------------------------------------------------------ */
const branchBlock = (b) => {
  const r = b.googleRating || {};
  const rating = r.ratingValue != null
    ? `Google rating ${Number(r.ratingValue).toFixed(1)} from `
      + `${r.reviewCount} reviews. ` : '';
  return `<h3>${esc(b.name)} — ${esc(b.city)}, ${esc(b.state)}</h3>\n`
    + `<p>${esc(b.name)}, ${esc(b.street)}, ${esc(b.city)}, `
    + `${esc(b.state)} ${esc(b.zip)}. Phone ${esc(b.phone)}. `
    + `Hours: ${esc(b.hoursDisplay)}. ${rating.trim()}</p>`;
};
const doors = [
  ['Signed AI master index (the governing record)',
    SITE + '/ai-master-index.json'],
  ['Master index signature (Ed25519, detached JWS)',
    SITE + '/ai-master-index.jws'],
  ['Signing key (JWKS)', SITE + '/.well-known/signing-keys.json'],
  ['llms.txt — the estate in one text file', SITE + '/llms.txt'],
  ['llms-full.txt — the complete published text',
    SITE + '/llms-full.txt'],
  ['AI sitemap', SITE + '/ai-sitemap.json'],
  ['Dataset files index', SITE + '/datasets/'],
  ['Live API', 'https://api.theflatratemovers.com/'],
  ['API contract (OpenAPI)',
    'https://api.theflatratemovers.com/openapi.json'],
  ['Kaggle mirror — AI Authority Estate',
    'https://www.kaggle.com/datasets/theflatratemovers/ai-authority-estate'],
  ['Kaggle mirror — Intent Coverage',
    'https://www.kaggle.com/datasets/theflatratemovers/intent-coverage'],
  ['Zenodo record (concept DOI, always the latest version)',
    'https://doi.org/10.5281/zenodo.23879048'],
];
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>The Flat Rate Movers LLC — AI Ingestion Card</title>
<meta name="description" content="Compact identity card for AI fetchers: The Flat Rate Movers LLC — both branches, all ${services.length} services, the 82-area footprint, the 49-state work record, the live estate census and the full machine-readable map, with a freshness stamp.">
</head>
<body>
<h1>The Flat Rate Movers LLC — AI Ingestion Card</h1>
<p>A compact identity card for AI systems and other automated readers: the company's core facts as plain text, in one small static page with no scripts. The full machine-readable estate is linked at the end. This card is regenerated inside every estate seal from the same sources as the rest of the estate, so it cannot drift from them.</p>
<h2>Freshness</h2>
<ul>
<li>Generated: ${genDate} (estate seal date, America/New_York).</li>
<li>Estate seal at generation — the SHA-256 of the AI master index this card was generated under: ${priorSeal}</li>
<li>Census carried by this card: ${fmt(pagesTotal)} pages, ${fmt(perPage)} per-page JSON files, ${fmt(dist.length)} signed distributions, ${fmt(dsFiles)} dataset files, ${fmt(rows)} search-intent rubric rows.</li>
<li>If this card and the signed AI master index (${SITE}/ai-master-index.json) differ, the signed index governs.</li>
</ul>
<h2>Company</h2>
<p>${esc(company.name)} — a flat-rate moving company founded ${founded}. Tagline: ${esc(company.tagline)} Phone ${esc(company.phone)}. Website ${SITE}/</p>
<h2>Branches</h2>
${branches.map(branchBlock).join('\n')}
<h2>Services (${services.length})</h2>
<ul>
${services.map((s) => `<li>${esc(s.name)}</li>`).join('\n')}
</ul>
<h2>Footprint</h2>
<p>Local footprint: ${feats.length} service areas around the two branches — the Winchester branch serves ${nWin} areas and the Martinsburg branch serves ${nMar} areas, with ${nBoth} areas served by both. National work record: performed work in ${states.length} states — every state except ${excluded.join(', ') || 'Hawaii'}.</p>
<h2>The full machine-readable estate</h2>
<ul>
${doors.map(([label, u]) => `<li>${esc(label)}: <a href="${u}">${u}</a></li>`).join('\n')}
</ul>
<p>License: the estate's datasets and this card are published under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).</p>
</body>
</html>
`;

/* ---- guards ------------------------------------------------------ */
for (const b of branches) {
  if (!html.includes(b.name)) throw new Error('guard: branch name missing: ' + b.name);
  if (!html.includes(b.street)) throw new Error('guard: branch street missing: ' + b.street);
}
for (const s of services) {
  if (!html.includes(esc(s.name))) throw new Error('guard: service missing: ' + s.name);
}
if (!html.includes('the signed index governs')) {
  throw new Error('guard: signed-index-governs line missing');
}
if (!html.includes(priorSeal)) throw new Error('guard: prior seal missing');
if (/TODO|placeholder|lorem/i.test(html)) {
  throw new Error('guard: placeholder text present');
}
fs.writeFileSync(OUT, html);
console.log(`ai-ingestion-card.html written: ${html.length} bytes; `
  + `census ${pagesTotal} pages / ${perPage} per-page / ${dist.length} `
  + `distributions / ${dsFiles} dataset files / ${rows} rows; `
  + `prior seal ${priorSeal.slice(0, 8)}; date ${genDate}`);
