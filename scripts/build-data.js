// Flat Rate Machine — Phase 0 data migration (deterministic v1).
// Builds data/*.json from verified sources only. No placeholders, no
// invented facts, no live-site writes, no network writes.
//   node scripts/build-data.js        (run from the-flat-rate-machine/)
//
// Sources:
//   - Live sitemap: https://theflatratemovers.com/sitemap.xml (fetched;
//     the build FAILS if it cannot be fetched — pages.json is never
//     hand-typed and never falls back to a stale local copy).
//   - Page titles + service links: pageMeta in the live site source
//     (../the-flat-rate-movers-pages/public/index.html).
//   - Service definitions: the head JSON-LD graph in that same source.
//   - Locations, hours, ratings, service areas: owner-verified facts
//     transcribed below with source + date on every entry.
//   - GeoJSON + entity graphs: byte-for-byte copies of the verified
//     files in ../theflatratemovers/ (verify.js proves byte identity).
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const FLAT = path.resolve(ROOT, '..', 'theflatratemovers');
const PAGES = path.resolve(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const LIVE_SITEMAP = 'https://theflatratemovers.com/sitemap.xml';
const TODAY = '2026-10-28';

function fail(msg) { console.error('BUILD FAILED: ' + msg); process.exit(1); }
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
function writeJson(rel, obj) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
  console.log('wrote ' + rel);
}

async function main() {
  // --- 1. Live sitemap (the only source of page URLs) ---
  let sitemapXml;
  try { sitemapXml = await fetchText(LIVE_SITEMAP); }
  catch (e) { fail('could not fetch live sitemap ' + LIVE_SITEMAP + ': ' + e.message); }
  const sitemapEntries = [...sitemapXml.matchAll(/<url>\s*<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>/g)]
    .map((m) => ({ url: m[1].trim(), lastmod: m[2].trim() }));
  if (sitemapEntries.length === 0) fail('live sitemap parsed to zero URLs');
  console.log('live sitemap URLs: ' + sitemapEntries.length);

  // --- 2. pageMeta + head-graph services from the live site source ---
  const indexHtml = fs.readFileSync(path.join(PAGES, 'index.html'), 'utf8');
  const pmStart = indexHtml.indexOf('pageMeta={');
  if (pmStart < 0) fail('pageMeta not found in index.html');
  let depth = 0, i = pmStart + 'pageMeta='.length, pmEnd = -1;
  for (; i < indexHtml.length; i++) {
    if (indexHtml[i] === '{') depth++;
    else if (indexHtml[i] === '}') { depth--; if (depth === 0) { pmEnd = i + 1; break; } }
  }
  if (pmEnd < 0) fail('pageMeta block did not balance');
  // Local trusted source (our own site build); evaluated, not executed.
  const pageMeta = eval('(' + indexHtml.slice(pmStart + 'pageMeta='.length, pmEnd) + ')');
  const byCanonical = {};
  for (const [key, e] of Object.entries(pageMeta)) byCanonical[e.canonical] = { key, ...e };

  const ldMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!ldMatch) fail('head JSON-LD graph not found in index.html');
  const headGraph = JSON.parse(ldMatch[1])['@graph'] || [];
  const headServices = headGraph.filter((n) => {
    const t = n['@type'];
    return Array.isArray(t) ? t.includes('Service') : t === 'Service';
  });

  // --- 3. pages.json: live sitemap JOIN pageMeta (fail on any mismatch) ---
  const pageCountByService = {};
  const pages = [];
  for (const { url, lastmod } of sitemapEntries) {
    const meta = byCanonical[url];
    if (!meta) fail('live sitemap URL has no pageMeta canonical: ' + url);
    const slug = url === 'https://theflatratemovers.com/'
      ? 'home'
      : url.replace('https://theflatratemovers.com/', '').replace(/\/$/, '');
    // svc is a comma-joined string on most pages but an array on some;
    // normalize both, then keep only service fragments (not #organization).
    const svcRaw = meta.svc ? (Array.isArray(meta.svc) ? meta.svc : meta.svc.split(',')) : [];
    const services = svcRaw.map((v) => String(v).trim().replace('https://theflatratemovers.com/#', '')).filter((v) => v !== 'organization');
    for (const s of services) pageCountByService[s] = (pageCountByService[s] || 0) + 1;
    let type = 'page';
    if (slug === 'home') type = 'home';
    else if (slug === 'moving-company-winchester-va' || slug === 'moving-company-martinsburg-wv') type = 'location';
    else if (slug === 'route81') type = 'corridor';
    else if (services.length > 0) type = 'service';
    pages.push({
      slug, url, title: meta.name, type, services, lastmod, status: 'live',
      source: 'live sitemap.xml + pageMeta in live site source',
      attested: TODAY,
    });
  }
  const sitemapSet = new Set(sitemapEntries.map((e) => e.url));
  for (const [key, e] of Object.entries(pageMeta)) {
    if (!sitemapSet.has(e.canonical)) fail('pageMeta canonical missing from live sitemap: ' + e.canonical + ' (pageMeta key ' + key + ')');
  }
  pages.sort((a, b) => (a.url < b.url ? -1 : 1));
  writeJson('data/pages.json', {
    dataset: 'pages',
    generated: TODAY,
    source: LIVE_SITEMAP + ' joined to pageMeta in ../the-flat-rate-movers-pages/public/index.html',
    attestation: 'Every URL below was fetched from the live sitemap on ' + TODAY + '; titles and service links come from pageMeta in the live site source. No URL was hand-typed.',
    typeRule: "home = site root; location = the two branch pages; corridor = route81; service = pageMeta svc non-empty; else page. The type is a registry classification, not a published claim.",
    count: pages.length,
    pages,
  });

  // --- 4. services.json: head-graph Service nodes + page reference counts ---
  const services = headServices.map((n) => {
    const id = String(n['@id']).replace('https://theflatratemovers.com/#', '');
    return {
      id, name: n.name, description: n.description || '',
      pageCount: pageCountByService[id] || 0,
      source: 'head JSON-LD graph in live site source (index.html)',
      attested: TODAY,
    };
  });
  writeJson('data/services.json', {
    dataset: 'services',
    generated: TODAY,
    source: 'head JSON-LD graph in ../the-flat-rate-movers-pages/public/index.html, page counts from pageMeta svc references',
    attestation: 'Service names and descriptions are copied from the live head graph; pageCount is counted from pageMeta, not estimated.',
    count: services.length,
    services,
  });

  // --- 5. locations.json: owner-verified branch facts (never blended) ---
  writeJson('data/locations.json', {
    dataset: 'locations',
    generated: TODAY,
    company: {
      name: 'The Flat Rate Movers LLC',
      tagline: 'Guaranteed Flat Rate or Your Move is Free!',
      foundingDate: '2010-06',
      phone: '+1-540-422-2153',
      source: 'Owner confirmation 2026-10-27 (founding June 2010; no day invented)',
      attested: TODAY,
    },
    attestation: 'The two branches below are distinct records. Names, hours, service areas, and ratings are never merged, averaged, or copied across branches.',
    branches: [
      {
        id: 'winchester',
        name: 'The Flat Rate Movers',
        street: '116 W Piccadilly St Suite 11',
        city: 'Winchester', state: 'VA', zip: '22601',
        geo: { lat: 39.18711576, lng: -78.1668352 },
        phone: '+1-540-422-2153',
        hours: [
          { days: 'Mon-Fri', opens: '08:00', closes: '18:00' },
          { days: 'Sat', opens: '08:00', closes: '16:00' },
          { days: 'Sun', opens: '09:00', closes: '16:00' },
        ],
        hoursDisplay: 'Mon-Fri 8-6, Sat 8-4, Sun 9-4',
        googleRating: { ratingValue: 5.0, reviewCount: 1 },
        serviceArea: ['Leesburg', 'Marshall', 'Sterling', 'Stephens City', 'Loudoun County', 'Berryville 22611', 'Frederick County', 'Middleburg 20117', 'Middletown 22645', 'Moorefield 26836', 'Round Hill 20141', 'Stephenson 22656', 'Upperville 20184', 'Winchester 22601', 'Purcellville 20132', 'South Riding 20152'],
        source: 'Google Business Profile check 2026-10-28 (rating) + GBP Business information screenshots supplied by owner 2026-10-27 (service area) + Places verification 2026-10-27 (address, geo)',
        attested: TODAY,
      },
      {
        id: 'martinsburg',
        name: 'Flat Rate Movers Martinsburg WV',
        street: '736 Williamsport Pike Suite 2',
        city: 'Martinsburg', state: 'WV', zip: '25404',
        geo: { lat: 39.48319665, lng: -77.94760443 },
        phone: '+1-540-422-2153',
        hours: [
          { days: 'Mon-Fri', opens: '09:00', closes: '18:00' },
          { days: 'Sat', opens: '09:00', closes: '16:00' },
          { days: 'Sun', opens: '09:00', closes: '16:00' },
        ],
        hoursDisplay: 'Mon-Fri 9-6, Sat 9-4, Sun 9-4',
        googleRating: { ratingValue: 4.7, reviewCount: 6, breakdown: '4 at 5 stars, 2 at 4 stars' },
        serviceArea: ['Inwood', 'Hagerstown MD', 'Hedgesville', 'Paw Paw 25434', 'Shepherdstown', 'Berkeley County', 'Moorefield 26836', 'Bunker Hill 25413', 'Charles Town 25414', 'Clear Spring MD 21722', 'Summit Point 25446', 'Harpers Ferry 25425', 'Kearneysville 25430', 'Eastern Panhandle of West Virginia'],
        source: 'Google Business Profile check 2026-10-28 (rating) + GBP Business information screenshots supplied by owner 2026-10-27 (service area) + Places verification 2026-10-27 (address, geo)',
        attested: TODAY,
      },
    ],
  });

  // --- 6. corridors.json: I-81 live; I-66/I-70 mentioned, no dedicated page ---
  writeJson('data/corridors.json', {
    dataset: 'corridors',
    generated: TODAY,
    source: 'Live sitemap (route81 page) + service descriptions in the head graph + owner-verified service-area list in ../theflatratemovers/the-flat-rate-movers-data.txt',
    attestation: 'Only I-81 has a dedicated page. I-66 and I-70 are recorded as gaps, never as pages.',
    corridors: [
      { id: 'i-81', name: 'Interstate 81', page: 'route81', status: 'live', source: 'live sitemap + head graph service-route81', attested: TODAY },
      { id: 'i-66', name: 'Interstate 66', page: null, status: 'gap', source: 'mentioned in head graph service descriptions + data txt service-area list; no dedicated page in sitemap', attested: TODAY },
      { id: 'i-70', name: 'Interstate 70', page: null, status: 'gap', source: 'mentioned in head graph service descriptions + data txt service-area list; no dedicated page in sitemap', attested: TODAY },
    ],
  });

  // --- 7. Byte-for-byte copies of the verified graphs + GeoJSON ---
  for (const f of ['service-area.geojson', 'entity-graph.json', 'best-json-entity-graph.json']) {
    fs.copyFileSync(path.join(FLAT, f), path.join(ROOT, 'data', f));
    console.log('copied data/' + f + ' (byte-for-byte from ../theflatratemovers/)');
  }
  console.log('BUILD OK');
}

main().catch((e) => fail(e.message));
