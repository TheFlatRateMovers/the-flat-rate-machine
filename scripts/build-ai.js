// Flat Rate Machine — Phase 1, AI Visibility Builder (deterministic v1).
// Regenerates the AI-facing files from data/ ONLY:
//   out/llms.generated.txt, out/ai-sitemap.generated.json,
//   out/ard.generated.json
// Then diffs each against the live equivalents and reports every delta.
// The live llms.txt / ai-sitemap / ARD contain hand-written editorial
// prose, dated update narratives, statistics, and social links that are
// NOT in any Phase 0 dataset. Those deltas are reported as dataset gaps,
// never papered over by copying live text into the generator.
//   node scripts/build-ai.js        (run from the-flat-rate-machine/)
const { SITE, DATA_VERSION, fail, load, writeOut, writeOutJson, fetchText, leafDiff } = require('./lib');

async function main() {
  const locations = load('data/locations.json');
  const services = load('data/services.json').services;
  const pages = load('data/pages.json').pages;
  const corridors = load('data/corridors.json').corridors;
  const geojson = load('data/service-area.geojson');
  const company = locations.company;
  const branches = locations.branches;
  if (branches.length !== 2) fail('expected exactly 2 branches');
  const sir = services.find((s) => s.id === 'service-sir-heavy');
  const ispm = services.find((s) => s.id === 'service-ispm15');
  if (!sir || !ispm) fail('SIR or ISPM 15 service missing from services.json');
  const route81 = pages.find((p) => p.slug === 'route81');
  const developer = pages.find((p) => p.slug === 'developer');
  if (!route81 || !developer) fail('route81 or developer page missing from pages.json');
  const geoCount = (geojson.features || []).length;

  // ---------- llms.txt (deterministic core) ----------
  const ll = [];
  ll.push('# ' + company.name);
  ll.push('');
  ll.push('> Flat-rate moving company based in Winchester, VA and Martinsburg, WV. ' + company.tagline + ' ' + sir.description + ' ' + ispm.description + ' Founded June 2010.');
  ll.push('');
  ll.push('## Company');
  ll.push('');
  ll.push('- [Website](' + SITE + '/): ' + company.name + ', Winchester, VA and Martinsburg, WV');
  ll.push('- [Get a Quote](' + SITE + '/quote): Get My Flat Rate Quote, short Quick Quote and detailed project forms');
  ll.push('- Phone: ' + company.phone);
  ll.push('');
  ll.push('## Locations and Hours');
  ll.push('');
  for (const b of branches) {
    ll.push('- ' + b.city + ': ' + b.name + ', ' + b.street + ', ' + b.city + ', ' + b.state + ' ' + b.zip + ', geo ' + b.geo.lat + ', ' + b.geo.lng + ', hours ' + b.hoursDisplay + ', Google rating ' + b.googleRating.ratingValue + ' with ' + b.googleRating.reviewCount + ' review' + (b.googleRating.reviewCount === 1 ? '' : 's'));
  }
  ll.push('- Branches are distinct: do not unify names, hours, or ratings. Ratings are per branch, never blended.');
  ll.push('');
  ll.push('## Services');
  ll.push('');
  for (const s of services) ll.push('- ' + s.name + ': ' + s.description);
  ll.push('');
  ll.push('## Corridors');
  ll.push('');
  for (const c of corridors) {
    if (c.status === 'live') {
      const page = pages.find((p) => p.slug === c.page);
      ll.push('- ' + c.name + ': dedicated page at ' + (page ? page.url : 'UNKNOWN — FAIL'));
    } else {
      ll.push('- ' + c.name + ': mentioned in service descriptions; no dedicated page (gap recorded ' + DATA_VERSION + ').');
    }
  }
  ll.push('');
  ll.push('## Machine-Readable Data');
  ll.push('');
  ll.push('- [AI Sitemap](' + SITE + '/ai-sitemap.json): AI knowledge sitemap for ' + company.name);
  ll.push('- [Sitemap](' + SITE + '/sitemap.xml): live Cloudflare Pages site, ' + pages.length + ' clean canonical URLs (no hash URLs)');
  ll.push('- [Service Area GeoJSON](' + SITE + '/service-area.geojson): ' + geoCount + ' features, per branch, verified ' + DATA_VERSION);
  ll.push('- [Entity Graph](' + SITE + '/entity-graph.json): chained entity graph for ' + company.name);
  ll.push('');
  const llmsText = ll.join('\n');
  writeOut('llms.generated.txt', llmsText);

  // ---------- ai-sitemap.json (deterministic core) ----------
  const ai = {
    $schema: 'https://json.schemastore.org/jsonld.json',
    '@context': 'https://schema.org',
    '@id': SITE + '/ai-sitemap.json',
    '@type': 'Dataset',
    name: 'The Flat Rate Movers · AI Sitemap',
    url: SITE + '/ai-sitemap.json',
    dateModified: DATA_VERSION,
    version: DATA_VERSION,
    creator: {
      '@id': SITE + '/#organization',
      '@type': 'Organization',
      name: company.name,
      slogan: company.tagline,
      foundingDate: company.foundingDate,
      telephone: company.phone,
      address: branches.map((b) => ({
        '@type': 'PostalAddress',
        addressCountry: 'US',
        addressLocality: b.city,
        addressRegion: b.state,
        postalCode: b.zip,
        streetAddress: b.street,
      })),
      location: branches.map((b) => ({ '@id': SITE + '/#' + b.id })),
    },
    about: services.map((s) => s.name),
    services: services.map((s) => ({ name: s.name, description: s.description })),
    distribution: [
      { url: SITE + '/sitemap.xml', mediaType: 'application/xml' },
      { url: SITE + '/ai-sitemap.json', mediaType: 'application/json' },
      { url: SITE + '/service-area.geojson', mediaType: 'application/geo+json' },
      { url: SITE + '/entity-graph.json', mediaType: 'application/ld+json' },
      { url: SITE + '/llms.txt', mediaType: 'text/markdown' },
    ],
  };
  writeOutJson('ai-sitemap.generated.json', ai);

  // ---------- ARD catalog (deterministic core) ----------
  const ard = {
    specVersion: '1.0',
    host: {
      displayName: company.name,
      identifier: 'did:web:theflatratemovers.com',
      documentationUrl: developer.url,
    },
    entries: [
      { identifier: 'urn:air:theflatratemovers.com:data:ai-sitemap', displayName: 'The Flat Rate Movers AI Sitemap', type: 'application/json', url: SITE + '/ai-sitemap.json', description: 'AI sitemap (JSON, Dataset) for ' + company.name + '.', tags: ['ai-sitemap'] },
      { identifier: 'urn:air:theflatratemovers.com:data:service-area-geojson', displayName: 'The Flat Rate Movers Service Area GeoJSON', type: 'application/geo+json', url: SITE + '/service-area.geojson', description: 'Service areas as GeoJSON: ' + geoCount + ' features, per branch (Winchester, VA and Martinsburg, WV), verified ' + DATA_VERSION + '.', tags: ['geojson'] },
      { identifier: 'urn:air:theflatratemovers.com:data:entity-graph', displayName: 'The Flat Rate Movers Entity Graph', type: 'application/ld+json', url: SITE + '/entity-graph.json', description: 'Chained entity graph for ' + company.name + ': organization, both branches, services, and corridors linked by stable @id.', tags: ['entity-graph'] },
    ],
  };
  writeOutJson('ard.generated.json', ard);

  // ---------- Diffs against live ----------
  const liveLlms = await fetchText(SITE + '/llms.txt');
  const liveLlmsLines = liveLlms.split('\n');
  const genLlmsLines = llmsText.split('\n').filter((l) => l.trim() !== '');
  const liveSet = new Set(liveLlmsLines.map((l) => l.trim()));
  const llmsMissingFromLive = genLlmsLines.filter((l) => !liveSet.has(l.trim()));
  const liveHeaders = liveLlmsLines.filter((l) => l.startsWith('## '));

  const liveAi = JSON.parse(await fetchText(SITE + '/ai-sitemap.json'));
  const aiKeyDiff = {};
  for (const k of new Set([...Object.keys(ai), ...Object.keys(liveAi)])) {
    if (!(k in ai)) aiKeyDiff[k] = { status: 'live-only' };
    else if (!(k in liveAi)) aiKeyDiff[k] = { status: 'generated-only' };
    else {
      const d = leafDiff(ai[k], liveAi[k]);
      if (d.length) aiKeyDiff[k] = { status: 'differs', leafDiffs: d.slice(0, 40), leafDiffCount: d.length };
      else aiKeyDiff[k] = { status: 'equal' };
    }
  }

  const liveArd = JSON.parse(await fetchText(SITE + '/.well-known/ard.json'));
  const ardHostDiff = leafDiff(ard.host, liveArd.host || {});
  const ardEntries = [];
  const liveById = new Map((liveArd.entries || []).map((e) => [e.identifier, e]));
  for (const e of ard.entries) {
    const live = liveById.get(e.identifier);
    if (!live) { ardEntries.push({ identifier: e.identifier, status: 'live-missing' }); continue; }
    ardEntries.push({
      identifier: e.identifier,
      urlEqual: e.url === live.url,
      typeEqual: e.type === live.type,
      descriptionDiffers: e.description !== live.description,
      liveHasTags: Array.isArray(live.tags),
      liveHasRepresentativeQueries: Array.isArray(live.representativeQueries),
    });
  }

  const diff = {
    llms: {
      generatedLines: genLlmsLines.length,
      liveLines: liveLlmsLines.length,
      generatedLinesFoundVerbatimInLive: genLlmsLines.length - llmsMissingFromLive.length,
      generatedLinesNotInLive: llmsMissingFromLive,
      liveSections: liveHeaders,
      status: 'CORE REGENERATED — live-only content is editorial (see gaps)',
    },
    aiSitemap: { keyDiff: aiKeyDiff, status: 'CORE REGENERATED — live-only keys are editorial/curated (see gaps)' },
    ard: { hostDiff: ardHostDiff, entries: ardEntries, status: 'CORE REGENERATED — live prose/tags/queries are editorial (see gaps)' },
    gaps: [
      { field: 'llms.txt dated update narratives (GBP updates, image work, GSC stats, page character counts)', reason: 'Editorial changelog prose, not dataset facts. No changelog/statistics dataset exists in Phase 0. A notes dataset is Phase 2 work.' },
      { field: 'llms.txt social links + company email', reason: 'Social URLs and email are not in any Phase 0 dataset (same gap as the graph builder). Phase 0 amendment needed.' },
      { field: 'llms.txt service page links', reason: 'No canonical-page mapping exists in services.json (pages reference services, not the reverse). Generated services list carries names + descriptions without page links.' },
      { field: 'ai-sitemap description (1522-char prose)', reason: 'Hand-written prose, not a dataset fact.' },
      { field: 'ai-sitemap hasPart[17], keywords[11]', reason: 'Curated lists, not derivable from data/ without editorial selection.' },
      { field: 'ai-sitemap areaServed (merged list)', reason: 'Live list merges both branches into one list. The branch rule forbids merging; per-branch areas live in locations.json and the GeoJSON.' },
      { field: 'ai-sitemap mainEntity (sitemap_index.xml)', reason: 'Live mainEntity points to sitemap_index.xml, a stale WordPress-era artifact, not the current sitemap.xml. Deliberately not reproduced.' },
      { field: 'ai-sitemap creator.email / sameAs / openingHours', reason: 'Not in any Phase 0 dataset (same gap as the graph builder). Note: live creator.openingHours equals Winchester hours only (Mo-Fr 08:00-18:00) — the generator deliberately omits company-level hours because the branches differ (Martinsburg opens 09:00 weekdays); reproducing the live value would bake in a Winchester-only blend.' },
      { field: 'ai-sitemap url (site root vs file URL)', reason: 'Live points url at the site root; generated points url at the ai-sitemap file itself. A convention difference, both defensible; the @id (file URL) matches exactly.' },
      { field: 'ai-sitemap version (2026-10-27 vs 2026-10-28)', reason: 'Live version stamp predates the dataset attestation date by one day. Generated stamps the dataset version (2026-10-28) so the file version always tracks the data it was built from.' },
      { field: 'ARD host.logoUrl', reason: 'Media filenames are not in any Phase 0 dataset (media is schema-only).' },
      { field: 'ARD representativeQueries', reason: 'Questions dataset is schema-only in Phase 0. Queries come from Phase 2 sources (GSC, quote inquiries, GBP).' },
      { field: 'ARD descriptions / tags (live prose)', reason: 'Hand-written prose and curated tags. Generated entries carry mechanical factual descriptions and minimal tags.' },
    ],
  };
  writeOutJson('ai.diff.json', diff);
  console.log('llms lines generated: ' + genLlmsLines.length + ', live: ' + liveLlmsLines.length + ', generated verbatim in live: ' + (genLlmsLines.length - llmsMissingFromLive.length));
  console.log('ai-sitemap keys: ' + JSON.stringify(Object.fromEntries(Object.entries(aiKeyDiff).map(([k, v]) => [k, v.status]))));
  console.log('ard entries compared: ' + ardEntries.length + ', host diffs: ' + ardHostDiff.length);
  console.log('AI BUILD OK — core regenerated, gaps reported in out/ai.diff.json');
}

main().catch((e) => fail(e.message));
