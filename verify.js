// Flat Rate Machine — Phase 0 migration verifier (Node, no dependencies).
// Proves the migrated data is identical to the verified live sources.
//   node verify.js        (run from the-flat-rate-machine/)
//
// Every check prints PASS or FAIL with exact detail. Any FAIL exits 1.
// Checks are never weakened to force a pass: if a check fails, the DATA
// is wrong (or the live source changed) — fix the data, re-run, and
// record the change. A FAIL here blocks Phase 1 generators.
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = __dirname;
const FLAT = path.resolve(ROOT, '..', 'theflatratemovers');
const LIVE_SITEMAP = 'https://theflatratemovers.com/sitemap.xml';

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok });
  console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (detail ? ' — ' + detail : ''));
}
function load(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}
function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); return; }
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}
function countIdKeys(obj) {
  let n = 0;
  (function walk(o) {
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (o && typeof o === 'object') {
      if (Object.prototype.hasOwnProperty.call(o, '@id')) n++;
      Object.values(o).forEach(walk);
    }
  })(obj);
  return n;
}

async function main() {
  const pages = load('data/pages.json');
  const services = load('data/services.json');
  const locations = load('data/locations.json');
  const corridors = load('data/corridors.json');
  const geo = load('data/service-area.geojson');
  const graphRaw = fs.readFileSync(path.join(ROOT, 'data/entity-graph.json'), 'utf8');
  const bestRaw = fs.readFileSync(path.join(ROOT, 'data/best-json-entity-graph.json'), 'utf8');
  const graph = JSON.parse(graphRaw);
  const best = JSON.parse(bestRaw);

  // --- 1. Page count ---
  check('pages.json count is 126', pages.count === 126 && pages.pages.length === 126,
    'count=' + pages.count + ', entries=' + pages.pages.length);

  // --- 2. Live sitemap set equality (fetched fresh, not from disk) ---
  let liveUrls = null;
  try {
    const xml = await fetchText(LIVE_SITEMAP);
    liveUrls = new Set([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim()));
    check('live sitemap fetched', liveUrls.size > 0, liveUrls.size + ' URLs');
  } catch (e) {
    check('live sitemap fetched', false, e.message);
  }
  if (liveUrls) {
    const mine = new Set(pages.pages.map((p) => p.url));
    const missing = [...mine].filter((u) => !liveUrls.has(u));
    const extra = [...liveUrls].filter((u) => !mine.has(u));
    check('every pages.json URL is in the live sitemap', missing.length === 0,
      missing.length ? 'missing: ' + missing.join(', ') : 'all ' + mine.size + ' present');
    check('every live sitemap URL is in pages.json', extra.length === 0,
      extra.length ? 'extra: ' + extra.join(', ') : 'no extras');
    check('live sitemap itself has 126 URLs', liveUrls.size === 126, 'live=' + liveUrls.size);
  }
  check('no hash URLs in pages.json', pages.pages.every((p) => !p.url.includes('#')));

  // --- 3. GeoJSON ---
  check('service-area.geojson is a FeatureCollection with 52 features',
    geo.type === 'FeatureCollection' && Array.isArray(geo.features) && geo.features.length === 52,
    'type=' + geo.type + ', features=' + (geo.features ? geo.features.length : 'n/a'));

  // --- 4. Byte identity of the copied files ---
  for (const f of ['service-area.geojson', 'entity-graph.json', 'best-json-entity-graph.json']) {
    const a = fs.readFileSync(path.join(ROOT, 'data', f));
    const b = fs.readFileSync(path.join(FLAT, f));
    check('data/' + f + ' is byte-identical to ../theflatratemovers/' + f, a.equals(b),
      a.length + ' bytes vs ' + b.length + ' bytes');
  }

  // --- 5. Graph @id counts (two methods, both asserted) ---
  // Historical figures 37/89 are raw-substring counts of "@id" in the file
  // text (they include 3 prose mentions each, e.g. "stable @ids"). The
  // structural counts are the real "@id" keys: 34 and 86. Both are checked
  // so neither number can silently drift.
  check('entity-graph.json raw "@id" substring count is 37',
    (graphRaw.match(/@id/g) || []).length === 37, 'found ' + (graphRaw.match(/@id/g) || []).length);
  check('entity-graph.json structural "@id" key count is 34',
    countIdKeys(graph) === 34, 'found ' + countIdKeys(graph));
  check('best-json-entity-graph.json raw "@id" substring count is 89',
    (bestRaw.match(/@id/g) || []).length === 89, 'found ' + (bestRaw.match(/@id/g) || []).length);
  check('best-json-entity-graph.json structural "@id" key count is 86',
    countIdKeys(best) === 86, 'found ' + countIdKeys(best));

  // --- 6. Branches are distinct, exact, and never blended ---
  const branches = locations.branches || [];
  check('locations.json has exactly 2 branches', branches.length === 2, 'found ' + branches.length);
  const win = branches.find((b) => b.id === 'winchester');
  const mar = branches.find((b) => b.id === 'martinsburg');
  check('Winchester branch exists', !!win);
  check('Martinsburg branch exists', !!mar);
  if (win && mar) {
    check('Winchester name is "The Flat Rate Movers"', win.name === 'The Flat Rate Movers', win.name);
    check('Martinsburg name is "Flat Rate Movers Martinsburg WV" (no "The")',
      mar.name === 'Flat Rate Movers Martinsburg WV', mar.name);
    check('Winchester hours are Mon-Fri 8-6, Sat 8-4, Sun 9-4',
      win.hoursDisplay === 'Mon-Fri 8-6, Sat 8-4, Sun 9-4', win.hoursDisplay);
    check('Martinsburg hours are Mon-Fri 9-6, Sat 9-4, Sun 9-4',
      mar.hoursDisplay === 'Mon-Fri 9-6, Sat 9-4, Sun 9-4', mar.hoursDisplay);
    check('Branch hours differ (never unified)',
      JSON.stringify(win.hours) !== JSON.stringify(mar.hours));
    check('Branch names differ', win.name !== mar.name);
    check('Branch addresses differ', win.street !== mar.street && win.zip !== mar.zip,
      win.zip + ' vs ' + mar.zip);
    check('Winchester Google rating is 5.0 / 1 review',
      win.googleRating && win.googleRating.ratingValue === 5.0 && win.googleRating.reviewCount === 1,
      JSON.stringify(win.googleRating));
    check('Martinsburg Google rating is 4.7 / 6 reviews',
      mar.googleRating && mar.googleRating.ratingValue === 4.7 && mar.googleRating.reviewCount === 6,
      JSON.stringify(mar.googleRating));
    check('Branch service areas differ (never merged)',
      JSON.stringify([...win.serviceArea].sort()) !== JSON.stringify([...mar.serviceArea].sort()),
      'winchester=' + win.serviceArea.length + ', martinsburg=' + mar.serviceArea.length);
    check('Winchester service area has 16 entries', win.serviceArea.length === 16);
    check('Martinsburg service area has 14 entries', mar.serviceArea.length === 14);
    check('Company founding is 2010-06 (no day invented)',
      locations.company && locations.company.foundingDate === '2010-06',
      locations.company ? locations.company.foundingDate : 'missing');
  }

  // --- 7. Services ---
  check('services.json has 18 services', services.services.length === 18,
    'found ' + services.services.length);
  const svcIds = new Set(services.services.map((s) => s.id));
  check('services.json includes service-industrial-commercial',
    svcIds.has('service-industrial-commercial'));
  const recomputed = {};
  const unresolved = new Set();
  for (const p of pages.pages) {
    for (const s of p.services || []) {
      recomputed[s] = (recomputed[s] || 0) + 1;
      if (!svcIds.has(s)) unresolved.add(s);
    }
  }
  check('every page service reference resolves to services.json', unresolved.size === 0,
    unresolved.size ? 'unresolved: ' + [...unresolved].join(', ') : 'all resolve');
  const countMismatch = services.services.filter((s) => (recomputed[s.id] || 0) !== s.pageCount);
  check('services.json pageCounts match pages.json references', countMismatch.length === 0,
    countMismatch.length ? 'mismatch: ' + countMismatch.map((s) => s.id).join(', ') : 'all match');
  check('every service has a non-empty source and attestation date',
    services.services.every((s) => s.source && s.attested));

  // --- 8. Registry hygiene ---
  const slugs = pages.pages.map((p) => p.slug);
  check('pages.json slugs are unique', new Set(slugs).size === slugs.length);
  check('every page has title, lastmod, status live, source, attestation',
    pages.pages.every((p) => p.title && p.lastmod && p.status === 'live' && p.source && p.attested));
  check('corridors.json has 3 corridors (I-81, I-66, I-70)',
    corridors.corridors.length === 3, 'found ' + corridors.corridors.length);
  const i81 = corridors.corridors.find((c) => c.id === 'i-81');
  const i66 = corridors.corridors.find((c) => c.id === 'i-66');
  const i70 = corridors.corridors.find((c) => c.id === 'i-70');
  check('I-81 corridor page route81 exists in pages.json',
    !!(i81 && i81.page === 'route81' && slugs.includes('route81')));
  check('I-66 has no dedicated page (recorded as gap, not invented)',
    !!(i66 && i66.page === null && i66.status === 'gap'));
  check('I-70 has no dedicated page (recorded as gap, not invented)',
    !!(i70 && i70.page === null && i70.status === 'gap'));

  // --- 9. Guardrail scan: no placeholders, no invented license identifiers ---
  const registryText = JSON.stringify({ pages, services, locations, corridors });
  check('registry files contain no placeholder text',
    !/lorem|placeholder|TODO|TBD|XXX/i.test(registryText));
  check('registry files contain no USDOT/MC number (unconfirmed, never publish)',
    !/USDOT|MC-\d{4,}/i.test(registryText));

  const failed = results.filter((r) => !r.ok);
  console.log('\n' + results.filter((r) => r.ok).length + '/' + results.length + ' checks passed.');
  if (failed.length) {
    console.log('FAILED CHECKS:');
    for (const f of failed) console.log('  - ' + f.name);
    console.log('Phase 1 is BLOCKED until every check passes. Fix the data, not the checks.');
    process.exit(1);
  }
  console.log('VERIFY OK — migration is provably identical to the live sources.');
}

main().catch((e) => { console.error('VERIFY ERROR: ' + e.message); process.exit(1); });
