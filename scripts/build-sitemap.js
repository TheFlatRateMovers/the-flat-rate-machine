// Flat Rate Machine — Phase 1, Sitemap Builder (deterministic v1).
// Regenerates sitemap.xml from data/pages.json (clean canonical URLs,
// lastmod from the registry, no hash URLs) and diffs it against the
// freshly fetched live sitemap. Unlike the graph/ai builders, this one
// MUST be byte-identical: every input is in the registry.
//   node scripts/build-sitemap.js        (run from the-flat-rate-machine/)
const { SITE, fail, load, writeOut, writeOutJson, fetchText } = require('./lib');

async function main() {
  const pages = load('data/pages.json').pages;
  if (!pages || pages.length === 0) fail('pages.json is empty');
  for (const p of pages) {
    if (!p.url || !p.lastmod) fail('page missing url or lastmod: ' + JSON.stringify(p.slug));
    if (p.url.includes('#')) fail('hash URL in registry (must never happen): ' + p.url);
    if (!p.url.startsWith(SITE + '/')) fail('non-canonical URL in registry: ' + p.url);
  }
  const sorted = [...pages].sort((a, b) => (a.url < b.url ? -1 : 1));
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  for (const p of sorted) lines.push('  <url><loc>' + p.url + '</loc><lastmod>' + p.lastmod + '</lastmod></url>');
  lines.push('</urlset>');
  const xml = lines.join('\n') + '\n';
  writeOut('sitemap.generated.xml', xml);

  // ---- Diff against the live sitemap (fresh fetch, like verify.js) ----
  const liveXml = await fetchText(SITE + '/sitemap.xml');
  const liveEntries = [...liveXml.matchAll(/<url>\s*<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>/g)]
    .map((m) => ({ url: m[1].trim(), lastmod: m[2].trim() }));
  const genUrls = sorted.map((p) => p.url);
  const liveUrls = liveEntries.map((e) => e.url);
  const genSet = new Set(genUrls), liveSet = new Set(liveUrls);
  const missing = liveUrls.filter((u) => !genSet.has(u));
  const extra = genUrls.filter((u) => !liveSet.has(u));
  const lastmodMismatches = [];
  const liveByUrl = new Map(liveEntries.map((e) => [e.url, e.lastmod]));
  for (const p of sorted) {
    if (liveByUrl.has(p.url) && liveByUrl.get(p.url) !== p.lastmod) {
      lastmodMismatches.push({ url: p.url, generated: p.lastmod, live: liveByUrl.get(p.url) });
    }
  }
  const orderMatches = JSON.stringify(genUrls) === JSON.stringify(liveUrls);
  const byteIdentical = xml === liveXml;
  const diff = {
    generated: 'out/sitemap.generated.xml',
    generatedUrls: genUrls.length,
    liveUrls: liveUrls.length,
    missingFromGenerated: missing,
    extraInGenerated: extra,
    lastmodMismatches,
    orderMatches,
    byteIdentical,
    status: (missing.length === 0 && extra.length === 0 && lastmodMismatches.length === 0 && orderMatches && byteIdentical)
      ? 'BYTE-IDENTICAL to the live sitemap'
      : 'MISMATCH — see fields above (do not publish; fix data first)',
  };
  writeOutJson('sitemap.diff.json', diff);
  console.log('sitemap URLs generated: ' + genUrls.length + ', live: ' + liveUrls.length);
  console.log('missing: ' + missing.length + ', extra: ' + extra.length + ', lastmod mismatches: ' + lastmodMismatches.length + ', order matches: ' + orderMatches + ', byte-identical: ' + byteIdentical);
  if (diff.status.startsWith('MISMATCH')) fail('sitemap diff is not empty');
  console.log('SITEMAP BUILD OK — ' + diff.status);
}

main().catch((e) => fail(e.message));
