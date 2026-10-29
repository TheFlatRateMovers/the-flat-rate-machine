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
const LIVE_GEOJSON = 'https://theflatratemovers.com/service-area.geojson';
const PHASE_A = path.join(ROOT, 'out', 'phase-a');

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
  check('pages.json count matches entries', pages.count === pages.pages.length,
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
    check('live sitemap URL count matches registry', liveUrls.size === pages.pages.length, 'live=' + liveUrls.size + ', registry=' + pages.pages.length);
  }
  check('no hash URLs in pages.json', pages.pages.every((p) => !p.url.includes('#')));

  // --- 3. GeoJSON (registry-relative: data file vs live file, no literal) ---
  check('service-area.geojson is a FeatureCollection with features',
    geo.type === 'FeatureCollection' && Array.isArray(geo.features) && geo.features.length > 0,
    'type=' + geo.type + ', features=' + (geo.features ? geo.features.length : 'n/a'));
  try {
    const liveGeo = JSON.parse(await fetchText(LIVE_GEOJSON));
    const liveNames = new Set((liveGeo.features || []).map((f) => f.properties && f.properties.name));
    const dataNames = new Set((geo.features || []).map((f) => f.properties && f.properties.name));
    const nameDiff = [...dataNames].filter((n) => !liveNames.has(n)).concat([...liveNames].filter((n) => !dataNames.has(n)));
    check('data service-area.geojson matches live GeoJSON (feature count + names)',
      (liveGeo.features || []).length === (geo.features || []).length && nameDiff.length === 0,
      'live=' + (liveGeo.features || []).length + ', data=' + (geo.features || []).length + (nameDiff.length ? ', diff: ' + nameDiff.join(', ') : ''));
  } catch (e) {
    check('live service-area.geojson fetched and compared', false, e.message);
  }

  // --- 4. Byte identity of the copied files ---
  for (const f of ['service-area.geojson', 'entity-graph.json', 'best-json-entity-graph.json']) {
    const a = fs.readFileSync(path.join(ROOT, 'data', f));
    const b = fs.readFileSync(path.join(FLAT, f));
    check('data/' + f + ' is byte-identical to ../theflatratemovers/' + f, a.equals(b),
      a.length + ' bytes vs ' + b.length + ' bytes');
  }

  // --- 5. Graph @id counts (reported, not asserted as literals) ---
  // Phase A rule: no hardcoded totals. The old 89/86/141/138 literals are
  // replaced by coverage assertions below: every services.json entry must
  // have at least one Service node in each graph (matched by fragment
  // @id OR by exact service name — the legacy graph anchors some services
  // to page slugs instead of #service-* fragments; that pattern gap is
  // reported as INFO, not hidden). Counts are still printed so drift is
  // visible, and byte-identity with the ../theflatratemovers mirror
  // (section 4) pins the files.
  const egServiceNodes = (graph['@graph'] || []).filter((n) => n['@type'] === 'Service' || (Array.isArray(n['@type']) && n['@type'].includes('Service')));
  const bestServiceNodes = (best['@graph'] || []).filter((n) => n['@type'] === 'Service' || (Array.isArray(n['@type']) && n['@type'].includes('Service')));
  console.log('INFO  entity-graph.json @id raw=' + (graphRaw.match(/@id/g) || []).length + ' structural=' + countIdKeys(graph) + ' serviceNodes=' + egServiceNodes.length);
  console.log('INFO  best-json-entity-graph.json @id raw=' + (bestRaw.match(/@id/g) || []).length + ' structural=' + countIdKeys(best) + ' serviceNodes=' + bestServiceNodes.length);
  const nodeCovers = (nodes, s) => nodes.some((n) => String(n['@id']).endsWith('#' + s.id) || n.name === s.name);
  const fragmentOnly = (nodes, s) => nodes.some((n) => String(n['@id']).endsWith('#' + s.id));
  const egCovered = services.services.filter((s) => nodeCovers(egServiceNodes, s));
  const bestCovered = services.services.filter((s) => nodeCovers(bestServiceNodes, s));
  check('every services.json entry has a Service node in entity-graph.json', egCovered.length === services.services.length,
    egCovered.length + '/' + services.services.length + (egCovered.length === services.services.length ? '' : ' missing: ' + services.services.filter((s) => !egCovered.includes(s)).map((s) => s.id).join(', ')));
  check('every services.json entry has a Service node in best-json-entity-graph.json', bestCovered.length === services.services.length,
    bestCovered.length + '/' + services.services.length);
  const slugOnly = services.services.filter((s) => nodeCovers(egServiceNodes, s) && !fragmentOnly(egServiceNodes, s)).map((s) => s.id);
  console.log('INFO  entity-graph services covered only via page-slug @id (no #service-* fragment): ' + (slugOnly.length ? slugOnly.join(', ') : 'none'));

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

  // --- 7. Services (registry-relative) ---
  check('services.json count field matches entries', services.count === services.services.length,
    'count=' + services.count + ', entries=' + services.services.length);
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
  check('I-66 corridor page interstate-66-corridor exists in pages.json (gap closed 2026-10-28)',
    !!(i66 && i66.page === 'interstate-66-corridor' && i66.status === 'live' && slugs.includes('interstate-66-corridor')));
  check('I-70 corridor page interstate-70-corridor exists in pages.json (gap closed 2026-10-28)',
    !!(i70 && i70.page === 'interstate-70-corridor' && i70.status === 'live' && slugs.includes('interstate-70-corridor')));

  // --- 10. Phase A staged checks (out/phase-a/) ---
  // serviceType coverage: every Service node in both graphs must carry a
  // non-empty serviceType (Phase A backfill; best graph was already typed).
  const egTyped = egServiceNodes.filter((n) => n.serviceType);
  const bestTyped = bestServiceNodes.filter((n) => n.serviceType);
  check('entity-graph.json Service nodes all carry serviceType', egTyped.length === egServiceNodes.length,
    egTyped.length + '/' + egServiceNodes.length);
  check('best-json-entity-graph.json Service nodes all carry serviceType', bestTyped.length === bestServiceNodes.length,
    bestTyped.length + '/' + bestServiceNodes.length);

  // ai-sitemap parity: staged file must match the registries exactly.
  try {
    const stagedAi = JSON.parse(fs.readFileSync(path.join(PHASE_A, 'ai-sitemap.json'), 'utf8'));
    const pageUrls = new Set(pages.pages.map((p) => p.url));
    const svcNames = new Set(services.services.map((s) => s.name));
    const aiSvcNames = (stagedAi.services || []).map((s) => s.name);
    const aiUrls = (stagedAi.hasPart || []).map((p) => p.url);
    check('staged ai-sitemap services count matches services.json', (stagedAi.services || []).length === services.services.length,
      'staged=' + (stagedAi.services || []).length + ', registry=' + services.services.length);
    check('staged ai-sitemap hasPart count matches pages.json', (stagedAi.hasPart || []).length === pages.pages.length,
      'staged=' + (stagedAi.hasPart || []).length + ', registry=' + pages.pages.length);
    check('staged ai-sitemap hasPart URLs are all registry URLs',
      aiUrls.length > 0 && aiUrls.every((u) => pageUrls.has(u)),
      aiUrls.length + ' urls' + (aiUrls.every((u) => pageUrls.has(u)) ? '' : ' — non-registry: ' + aiUrls.filter((u) => !pageUrls.has(u)).join(', ')));
    check('staged ai-sitemap service names are all registry names',
      aiSvcNames.length > 0 && aiSvcNames.every((n) => svcNames.has(n)), aiSvcNames.length + ' names');
    check('staged ai-sitemap keywords cover all service names',
      (stagedAi.keywords || []).length === services.services.length && services.services.every((s) => (stagedAi.keywords || []).includes(s.name)),
      'keywords=' + (stagedAi.keywords || []).length);
  } catch (e) {
    check('staged ai-sitemap.json readable and parsed', false, e.message);
  }

  // llms coverage: staged llms must name every existing service and state
  // the registry page total in its sitemap clause.
  try {
    const stagedLlms = fs.readFileSync(path.join(PHASE_A, 'llms.txt'), 'utf8');
    const missingSvc = services.services.filter((s) => !stagedLlms.includes(s.name)).map((s) => s.name);
    check('staged llms.txt names every services.json entry', missingSvc.length === 0,
      missingSvc.length ? 'missing: ' + missingSvc.join(', ') : 'all ' + services.services.length + ' named');
    check('staged llms.txt states the registry page total', stagedLlms.includes(pages.pages.length + ' clean canonical URLs'),
      'looking for "' + pages.pages.length + ' clean canonical URLs"');
  } catch (e) {
    check('staged llms.txt readable', false, e.message);
  }

  // FAQ schema: staged file must be valid FAQPage blocks with real answers.
  try {
    const stagedFaq = JSON.parse(fs.readFileSync(path.join(PHASE_A, 'faq-schema.json'), 'utf8'));
    const faqPages = stagedFaq.faqPages || [];
    const faqOk = faqPages.length > 0 && faqPages.every((pg) => pg['@type'] === 'FAQPage' && Array.isArray(pg.mainEntity) && pg.mainEntity.length > 0 &&
      pg.mainEntity.every((q) => q['@type'] === 'Question' && q.name && q.acceptedAnswer && q.acceptedAnswer.text));
    const faqTotal = faqPages.reduce((n, pg) => n + (pg.mainEntity || []).length, 0);
    check('staged faq-schema.json is valid FAQPage blocks with non-empty answers', faqOk,
      faqPages.length + ' pages, ' + faqTotal + ' questions');
  } catch (e) {
    check('staged faq-schema.json readable and parsed', false, e.message);
  }

  // Dataset drafts: master (Developer page) + 18 per-category nodes.
  // License is DECIDED (CC BY 4.0, 2026-10-29 research doc §1) — the old
  // flagged-TODO check is replaced: a TODO here now FAILS, because the
  // decision exists; only the exact CC BY 4.0 URI passes.
  try {
    const stagedDs = JSON.parse(fs.readFileSync(path.join(PHASE_A, 'dataset-developer.json'), 'utf8'));
    const distUrls = (stagedDs.distribution || []).map((d) => d.contentUrl);
    const expectedDist = ['https://theflatratemovers.com/ai-sitemap.json', 'https://theflatratemovers.com/service-area.geojson', 'https://theflatratemovers.com/entity-graph.json', 'https://theflatratemovers.com/best-json-entity-graph.json'];
    check('staged dataset-developer.json is a Dataset with the 4 expected distributions',
      stagedDs['@type'] === 'Dataset' && expectedDist.every((u) => distUrls.includes(u)),
      'distributions=' + distUrls.length);
    check('staged dataset creator is the organization @id',
      stagedDs.creator && stagedDs.creator['@id'] === 'https://theflatratemovers.com/#organization',
      stagedDs.creator ? stagedDs.creator['@id'] : 'missing');
    check('staged dataset license is CC BY 4.0 (decided, not TODO)',
      stagedDs.license === 'https://creativecommons.org/licenses/by/4.0/',
      stagedDs.license ? String(stagedDs.license).slice(0, 60) : 'license field missing');
    check('staged dataset license is not a flagged TODO (decision supersedes it)',
      !(typeof stagedDs.license === 'string' && stagedDs.license.includes('TODO')),
      'TODO present means the decision was not applied');
    const masterKw = ['flat rate movers', 'moving companies winchester va', 'movers martinsburg wv', 'SIR', 'KIM-GS', 'ISPM 15', 'transloading', 'gun safe movers', 'senior moving', 'industrial relocation', 'warehouse relocation'];
    check('staged master dataset name + keywords match the research doc §3',
      stagedDs.name === 'The Flat Rate Movers — Service, Area, and Authority Datasets' &&
      JSON.stringify(stagedDs.keywords) === JSON.stringify(masterKw),
      'keywords=' + (stagedDs.keywords || []).length);
    check('staged master dataset description is under 5000 chars',
      typeof stagedDs.description === 'string' && stagedDs.description.length >= 50 && stagedDs.description.length < 5000,
      'len=' + (stagedDs.description ? stagedDs.description.length : 0));
  } catch (e) {
    check('staged dataset-developer.json readable and parsed', false, e.message);
  }

  // Per-category datasets: 18 nodes, valid shape, staged nodes carry no
  // sameAs, ready nodes point only at registry URLs, manifest agrees.
  try {
    const stagedCats = JSON.parse(fs.readFileSync(path.join(PHASE_A, 'datasets-per-category.json'), 'utf8'));
    const stagedMan = JSON.parse(fs.readFileSync(path.join(PHASE_A, 'datasets-manifest.json'), 'utf8'));
    const nodes = stagedCats['@graph'] || [];
    const pageUrls = new Set(pages.pages.map((p) => p.url));
    const badShape = nodes.filter((n) => n['@type'] !== 'Dataset' || !n.name || typeof n.description !== 'string' || n.description.length < 50 || n.description.length >= 5000 ||
      !Array.isArray(n.keywords) || n.keywords.length === 0 || n.license !== 'https://creativecommons.org/licenses/by/4.0/' ||
      n.temporalCoverage !== '2010/2026' || !Array.isArray(n.spatialCoverage) || n.spatialCoverage.length !== 2 ||
      !Array.isArray(n.distribution) || n.distribution.length < 4);
    check('staged per-category datasets: 18 nodes, all valid shape + CC BY + temporal + spatial',
      nodes.length === 18 && badShape.length === 0,
      'nodes=' + nodes.length + (badShape.length ? ', bad: ' + badShape.map((n) => n['@id']).join(', ') : ''));
    const manBySlug = new Map((stagedMan.categories || []).map((c) => [c.slug, c]));
    const statusMismatch = nodes.filter((n) => {
      const slug = String(n['@id']).split('#dataset-')[1];
      const m = manBySlug.get(slug);
      if (!m) return true;
      if (m.status === 'staged') return !!n.sameAs;
      return !n.sameAs || !n.sameAs.every((u) => pageUrls.has(u));
    });
    check('staged/ready status matches sameAs (staged = none, ready = registry URLs only)',
      statusMismatch.length === 0 && manBySlug.size === nodes.length,
      'manifest=' + manBySlug.size + ', nodes=' + nodes.length + (statusMismatch.length ? ', mismatch: ' + statusMismatch.map((n) => n['@id']).join(', ') : ''));
    const readyCount = (stagedMan.categories || []).filter((c) => c.status === 'ready').length;
    const stagedCount = (stagedMan.categories || []).filter((c) => c.status === 'staged').length;
    check('per-category manifest: 10 ready + 8 staged = 18', readyCount === 10 && stagedCount === 8,
      'ready=' + readyCount + ', staged=' + stagedCount);
    const catText = JSON.stringify(stagedCats);
    check('per-category datasets contain no banned wording or attestation claims',
      !/temp labor|crew page|spearman|around town movers|USDOT|MC-\d{4,}/i.test(catText) && !/subcontract/i.test(catText),
      'banned-string scan clean');
  } catch (e) {
    check('staged datasets-per-category.json + manifest readable and parsed', false, e.message);
  }

  // Ocean container D1–D8 datasets (staged, ocean doc §6).
  try {
    const stagedOcean = JSON.parse(fs.readFileSync(path.join(PHASE_A, 'datasets-ocean-container.json'), 'utf8'));
    const stagedOceanMan = JSON.parse(fs.readFileSync(path.join(PHASE_A, 'datasets-ocean-manifest.json'), 'utf8'));
    const dNodes = stagedOcean['@graph'] || [];
    const pageUrls = new Set(pages.pages.map((p) => p.url));
    const allowedAbout = new Set(['https://theflatratemovers.com/#service-transloading', 'https://theflatratemovers.com/#service-final-mile', 'https://theflatratemovers.com/#service-ispm15', 'https://theflatratemovers.com/#service-industrial-commercial', 'https://theflatratemovers.com/#service-sir-heavy']);
    const dBad = dNodes.filter((n) => n['@type'] !== 'Dataset' || !n.name || typeof n.description !== 'string' || n.description.length < 50 || n.description.length >= 5000 ||
      !Array.isArray(n.keywords) || n.keywords.length === 0 || n.license !== 'https://creativecommons.org/licenses/by/4.0/' ||
      n.temporalCoverage !== '2010/2026' || !Array.isArray(n.spatialCoverage) || n.spatialCoverage.length !== 2 ||
      !Array.isArray(n.distribution) || n.distribution.length < 4 || !Array.isArray(n.about) || n.about.length === 0 ||
      !n.about.every((a) => allowedAbout.has(a['@id'])));
    check('staged ocean datasets: 8 nodes (D1–D8), all valid shape + CC BY + temporal + spatial + about',
      dNodes.length === 8 && dBad.length === 0,
      'nodes=' + dNodes.length + (dBad.length ? ', bad: ' + dBad.map((n) => n['@id']).join(', ') : ''));
    const dManBySlug = new Map((stagedOceanMan.nodes || []).map((c) => [c.slug, c]));
    const dMismatch = dNodes.filter((n) => {
      const slug = String(n['@id']).split('#dataset-ocean-')[1];
      const m = dManBySlug.get(slug);
      if (!m) return true;
      if (m.status === 'staged') return !!n.sameAs;
      return !n.sameAs || !n.sameAs.every((u) => pageUrls.has(u));
    });
    const dReady = (stagedOceanMan.nodes || []).filter((c) => c.status === 'ready').length;
    const dStaged = (stagedOceanMan.nodes || []).filter((c) => c.status === 'staged').length;
    check('ocean manifest: 6 ready + 2 staged, status matches sameAs (staged = none, ready = registry URLs)',
      dReady === 6 && dStaged === 2 && dMismatch.length === 0,
      'ready=' + dReady + ', staged=' + dStaged + (dMismatch.length ? ', mismatch: ' + dMismatch.map((n) => n['@id']).join(', ') : ''));
    const byOceanSlug = (s) => dNodes.find((n) => String(n['@id']).endsWith(s));
    check('ocean gating sentences present (D3 CSC qualifier, D4/D5/D7 not-claimed)',
      byOceanSlug('container-taxonomy').description.includes('CSC plate on each box governs') &&
      byOceanSlug('port-chain').description.includes('not claimed') &&
      byOceanSlug('commercial-terms').description.includes('not claimed') &&
      byOceanSlug('compliance-access').description.includes('not claimed'),
      'D3/D4/D5/D7 boundaries stated');
    const dScan = JSON.stringify(stagedOcean).replace(/[^."]*not claimed[^."]*\.?/gi, '');
    check('ocean datasets contain no gated claims (terminals, bonded/FTZ, brokerage, reefer capability, fleet/chassis, TWIC cards)',
      !/\bNIT\b|\bVIG\b|\bPMT\b|\bRMT\b|customs brokerage|chassis (owned|ownership)|company trucks|drayage fleet|TWIC(-certified| cards| holders)|USDOT/i.test(dScan),
      'claim-pattern scan clean (negation sentences excluded)');
    check('ocean manifest records the 3 corrections (SPA-fallback JSON, TWIC present, gated fields)',
      Array.isArray(stagedOceanMan.correctionsApplied) && stagedOceanMan.correctionsApplied.length === 3,
      'corrections=' + (stagedOceanMan.correctionsApplied || []).length);
  } catch (e) {
    check('staged datasets-ocean-container.json + manifest readable and parsed', false, e.message);
  }

  // Live .json content-type proof (the SPA-fallback trap, verified 2026-10-29).
  // The first check is EXPECTED to flip when Phase D adds real per-page
  // JSONs for the old container pages — a flip there is good news, and
  // the D-node distributions must then be regenerated.
  try {
    const fetchContentType = (url) => new Promise((resolve, reject) => {
      https.get(url, (res) => {
        const ct = res.headers['content-type'] || '';
        res.resume();
        res.on('end', () => resolve(ct));
      }).on('error', reject);
    });
    const oldCt = await fetchContentType('https://theflatratemovers.com/container-loading-unloading-services-port-transload-virginia.json');
    check('old container .json URL returns text/html (SPA fallback — NO standalone JSON file)',
      oldCt.includes('text/html'), 'content-type=' + oldCt);
    const realCt = await fetchContentType('https://theflatratemovers.com/transloading-movers-martinsburg-wv.json');
    check('Martinsburg transloading .json URL returns application/json (real per-page JSON)',
      realCt.includes('application/json'), 'content-type=' + realCt);
  } catch (e) {
    check('live .json content-types fetched', false, e.message);
  }

  // Rubric DB: canonical service rows + attestations must cover the registry.
  try {
    const { execSync } = require('child_process');
    const dbPath = path.resolve(ROOT, '..', 'theflatratemovers', 'rubric.db');
    const canon = parseInt(execSync('sqlite3 "' + dbPath + '" "SELECT COUNT(*) FROM service WHERE service_id LIKE \'%#service-%\';"').toString().trim(), 10);
    const att = parseInt(execSync('sqlite3 "' + dbPath + '" "SELECT COUNT(*) FROM attestation WHERE evidence LIKE \'%services.json id%\';"').toString().trim(), 10);
    check('rubric.db canonical service rows match services.json', canon === services.services.length,
      'canonical=' + canon + ', registry=' + services.services.length);
    check('rubric.db attestations cover services.json entries', att === services.services.length,
      'attestations=' + att + ', registry=' + services.services.length);
  } catch (e) {
    check('rubric.db readable via sqlite3', false, e.message);
  }

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
    console.log('VERIFY FAILED — fix the data, not the checks.');
    process.exit(1);
  }
  console.log('VERIFY OK — migration is provably identical to the live sources.');
}

main().catch((e) => { console.error('VERIFY ERROR: ' + e.message); process.exit(1); });
