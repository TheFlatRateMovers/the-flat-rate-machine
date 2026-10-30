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
    // REWRITTEN 2026-10-30 (Batch P2): the premise "16" was the GBP list as
    // supplied 2026-10-27. Google published the owner's Bristow service-area
    // edit on 2026-10-30 (verified in GBP Manager: 17 published areas,
    // Bristow, VA, USA listed first), so the data is 17 and the check now
    // asserts the stronger state — exact count AND Bristow's presence.
    // Record: out/verify-fix-2026-10-30-p2.md.
    check('Winchester service area has 17 entries including Bristow (GBP published 2026-10-30)',
      win.serviceArea.length === 17 && win.serviceArea.includes('Bristow'),
      'entries=' + win.serviceArea.length + ', bristow=' + win.serviceArea.includes('Bristow'));
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
    // DOCUMENTED EXCEPTION (Batch P1, 2026-10-29): this check previously
    // also required keywords.length === services count (23). Henry's
    // 48-state all-AI-surfaces audit fold-in, shipped in Batch P1, adds one
    // approved non-service-name keyword ('specialized workforce labor 48
    // contiguous states deployment coverage') to every ai-sitemap copy,
    // phase-a included, so exact-length equality no longer expresses the
    // intent. The check's named assertion — coverage of every service
    // name — is unchanged and still enforced; length is now a floor, not
    // an equality. Record: out/verify-fix-2026-10-29-p1-provenance.md.
    check('staged ai-sitemap keywords cover all service names',
      (stagedAi.keywords || []).length >= services.services.length && services.services.every((s) => (stagedAi.keywords || []).includes(s.name)),
      'keywords=' + (stagedAi.keywords || []).length + ' (service names ' + services.services.length + ' + approved additions)');
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
  // DOCUMENTED EXCEPTION to the banner rule above (recorded 2026-10-29):
  // checks are never weakened to force a pass — but this check was not
  // weakened; the DATA's intended state changed by an approved batch.
  // Full-format Batch 3 (manifest item 6) deliberately created a standalone
  // per-page JSON for the old container page, deployed and live-verified
  // (200, application/json, 3,081 bytes, 4 nodes), so the original premise
  // ("SPA fallback — NO standalone JSON file") is dead. The first check now
  // asserts the current intended state instead; nothing was deleted or waived.
  try {
    const fetchContentType = (url) => new Promise((resolve, reject) => {
      https.get(url, (res) => {
        const ct = res.headers['content-type'] || '';
        res.resume();
        res.on('end', () => resolve(ct));
      }).on('error', reject);
    });
    const fetchBody = (url) => new Promise((resolve, reject) => {
      https.get(url, (res) => {
        const ct = res.headers['content-type'] || '';
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => resolve({ ct, body }));
      }).on('error', reject);
    });
    const oldSlug = 'container-loading-unloading-services-port-transload-virginia';
    const oldRes = await fetchBody('https://theflatratemovers.com/' + oldSlug + '.json');
    let oldGraph = [];
    try { oldGraph = JSON.parse(oldRes.body)['@graph'] || []; } catch (_) { oldGraph = []; }
    const nodeTypes = (n) => Array.isArray(n['@type']) ? n['@type'] : [n['@type']];
    const hasTransloadService = oldGraph.some((n) =>
      nodeTypes(n).includes('Service') && n['@id'] === 'https://theflatratemovers.com/#service-transloading');
    const hasOldWebPage = oldGraph.some((n) =>
      nodeTypes(n).includes('WebPage') && typeof n['@id'] === 'string' &&
      n['@id'].replace(/\/$/, '').endsWith(oldSlug));
    check('old container .json URL returns application/json with Service #service-transloading + its WebPage node (standalone per-page JSON, Batch 3)',
      oldRes.ct.includes('application/json') && hasTransloadService && hasOldWebPage,
      'content-type=' + oldRes.ct + ', service=' + hasTransloadService + ', webpage=' + hasOldWebPage);
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

  // --- 11. Provenance — signing layer (Batch P1, 2026-10-29; checks P-1..P-4;
  // extended by Batch P2, 2026-10-30, with P-5 coverage + P-6 repo digests) ---
  // Added in the same motion as the feature shipped (spec:
  // out/batchP1-provenance/notes/verify-gate-spec.md; record:
  // out/verify-fix-2026-10-29-p1-provenance.md). The estate's provenance
  // layer: the company publishes its Ed25519 verification key on its own
  // domain, every AI master index distribution carries a SHA-256 digest of
  // the exact served bytes, and the index itself is signed (JWS, EdDSA)
  // over its RFC 8785 (JCS) canonical form. These checks assert the SERVED
  // state, so a silent change to any signed file fails the suite.
  try {
    const crypto = require('crypto');
    const fetchFull = (url) => new Promise((resolve, reject) => {
      https.get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => { chunks.push(c); });
        res.on('end', () => resolve({ status: res.statusCode, ct: res.headers['content-type'] || '', buf: Buffer.concat(chunks) }));
      }).on('error', reject);
    });
    const b64uDec = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4), 'base64');
    // RFC 8785 (JCS) canonicalization, sufficient for this index (keys are
    // ASCII, numbers are integers — String(int) is the JCS serialization);
    // P-2 byte-compares the result against the signed payload, so any
    // canonicalization drift fails loudly instead of passing silently.
    const jcs = (v) => {
      if (v === null) return 'null';
      if (Array.isArray(v)) return '[' + v.map(jcs).join(',') + ']';
      if (typeof v === 'object') {
        return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + jcs(v[k])).join(',') + '}';
      }
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
      return JSON.stringify(v);
    };
    const P_KID = 'theflatratemovers-2026-10-29-1';

    // P-1: well-known key document live, parses, expected kid + shape.
    const jwksRes = await fetchFull('https://theflatratemovers.com/.well-known/signing-keys.json');
    let jwk = null;
    try {
      const jwks = JSON.parse(jwksRes.buf.toString('utf8'));
      jwk = (jwks.keys || []).find((k) => k.kid === P_KID) || null;
    } catch (_) { jwk = null; }
    check('P-1 well-known signing-keys.json live (200 + application/json) with the expected Ed25519 kid',
      jwksRes.status === 200 && jwksRes.ct.includes('application/json') && !!jwk &&
      jwk.kty === 'OKP' && jwk.crv === 'Ed25519' && jwk.alg === 'EdDSA' && jwk.use === 'sig' &&
      b64uDec(jwk.x || '').length === 32,
      'status=' + jwksRes.status + ', content-type=' + jwksRes.ct + ', kid=' + (jwk ? jwk.kid : 'missing'));

    // Fetch the served index + signature once; P-2/P-3/P-4 assert over them.
    const idxRes = await fetchFull('https://theflatratemovers.com/ai-master-index.json');
    const jwsRes = await fetchFull('https://theflatratemovers.com/ai-master-index.jws');
    let servedIndex = null;
    try { servedIndex = JSON.parse(idxRes.buf.toString('utf8')); } catch (_) { servedIndex = null; }

    // P-2: JWS payload byte-equals the JCS canonical served index, and the
    // Ed25519 signature verifies against the published key (matched by kid).
    let p2ok = false, p2detail = '';
    try {
      const parts = jwsRes.buf.toString('utf8').trim().split('.');
      if (parts.length !== 3) throw new Error('JWS does not have 3 segments');
      const header = JSON.parse(b64uDec(parts[0]).toString('utf8'));
      if (header.alg !== 'EdDSA' || header.kid !== P_KID) throw new Error('unexpected JWS header ' + JSON.stringify(header));
      if (!servedIndex) throw new Error('served index did not parse');
      const canonical = Buffer.from(jcs(servedIndex), 'utf8');
      if (!b64uDec(parts[1]).equals(canonical)) throw new Error('payload != canonical(index), payload=' + b64uDec(parts[1]).length + 'B canonical=' + canonical.length + 'B');
      if (!jwk) throw new Error('no published key to verify against');
      const pub = crypto.createPublicKey({ key: jwk, format: 'jwk' });
      p2ok = crypto.verify(null, Buffer.from(parts[0] + '.' + parts[1], 'ascii'), pub, b64uDec(parts[2]));
      p2detail = 'signature ' + (p2ok ? 'valid' : 'INVALID') + ', canonical=' + canonical.length + 'B';
    } catch (e) { p2ok = false; p2detail = e.message; }
    check('P-2 ai-master-index.jws verifies against the published key over the canonical served index', p2ok, p2detail);

    // P-3: every site-served distribution's digest re-computes over the
    // live bytes. Repo-served entries (raw.githubusercontent) are covered
    // at push time by the GitHub read-back md5 discipline instead.
    let p3ok = 0, p3bad = [];
    const siteEntries = servedIndex ? (servedIndex.distribution || []).filter((e) => String(e.contentUrl || '').startsWith('https://theflatratemovers.com/')) : [];
    for (const e of siteEntries) {
      try {
        const r = await fetchFull(e.contentUrl);
        const hex = crypto.createHash('sha256').update(r.buf).digest('hex');
        if (e.digest && hex === e.digest.value && r.buf.length === e.digest.byteSize) p3ok++;
        else p3bad.push(e.name + ' (served ' + r.buf.length + 'B sha256 ' + hex.slice(0, 12) + '… vs index ' + (e.digest ? e.digest.byteSize + 'B ' + String(e.digest.value).slice(0, 12) + '…' : 'no digest') + ')');
      } catch (err) { p3bad.push(e.name + ' (' + err.message + ')'); }
    }
    check('P-3 all site-served distribution digests match the live served bytes',
      !!servedIndex && p3bad.length === 0 && p3ok === siteEntries.length && siteEntries.length > 0,
      p3ok + '/' + siteEntries.length + ' match' + (p3bad.length ? '; mismatch: ' + p3bad.join('; ') : ''));

    // P-4: completeness invariant — every distribution entry is full.
    const hexOk = (v) => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
    const incomplete = servedIndex ? (servedIndex.distribution || []).filter((e) =>
      !e.name || !e.contentUrl || !e.encodingFormat || !e.license || !e.dateModified ||
      !e.digest || e.digest.algorithm !== 'SHA-256' || !hexOk(e.digest.value) || !Number.isInteger(e.digest.byteSize)) : [];
    check('P-4 every served index distribution entry is complete (name, contentUrl, encodingFormat, license, dateModified, SHA-256 digest + byteSize)',
      !!servedIndex && (servedIndex.distribution || []).length > 0 && incomplete.length === 0,
      'entries=' + (servedIndex ? (servedIndex.distribution || []).length : 0) + (incomplete.length ? ', incomplete: ' + incomplete.map((e) => e.name || e.contentUrl || '?').join(', ') : ', all complete'));

    // P-5: certificate coverage (Batch P2, 2026-10-30) — the seal covers
    // every per-page JSON, the site shell, and the deployed code sets, not
    // just the 35 data distributions. Asserts the SERVED index carries a
    // distribution for each of the 156 per-page JSON files (filename set
    // derived from the deployed public/ listing, the same derivation the
    // Batch 8a coverage join used) plus the 11 shell/code contentUrls, and
    // that the total is exactly 202 (35 + 156 + 11). Record:
    // out/verify-fix-2026-10-30-p2.md.
    // Extended by Batch Junk Removal, 2026-10-30 (same motion as the new
    // category shipped): totals move to 157 per-page JSON files and 204
    // distributions (36 data + 157 pages + 11 shell/code — the new dataset
    // file joins the data set, the new page JSON joins the page set). The
    // assertion is exact-count, as before, never a floor. Record:
    // out/verify-fix-2026-10-30-junk-removal.md.
    // Extended by Batch Blog Foundation, 2026-10-30 (same motion as the
    // Flat-Rate Guarantee page shipped): totals move to 158 per-page JSON
    // files and 205 distributions (36 data + 158 pages + 11 shell/code —
    // no new dataset; the guarantee page JSON joins the page set). The
    // assertion stays exact-count. Record:
    // out/verify-fix-2026-10-30-blog-foundation.md.
    const P2_CODE_URLS = [
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/code/site-shell/index.html',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/code/pages-functions/_middleware.js',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/code/pages-functions/head-data.js',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/code/pages-functions/quote.js',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/code/quote-worker/index.js',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/verify.js',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/tools/keygen.py',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/tools/digest-index.py',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/tools/sign-index.py',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/tools/verify-provenance.py',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/tools/gen-head-data.js',
    ];
    let p5detail = '', p5ok = false;
    try {
      const pubDir = path.join(path.resolve(ROOT, '..', 'the-flat-rate-movers-pages'), 'public');
      const nonPage = new Set(['ai-master-index.json', 'ai-sitemap.json', 'entity-graph.json', 'best-json-entity-graph.json', 'ai-catalog.json']);
      const pageFiles = fs.readdirSync(pubDir).filter((f) => f.endsWith('.json') && !nonPage.has(f) && !f.startsWith('datasets-')).sort();
      const distUrls = new Set((servedIndex.distribution || []).map((e) => e.contentUrl));
      const missingPages = pageFiles.filter((f) => !distUrls.has('https://theflatratemovers.com/' + f));
      const missingCode = P2_CODE_URLS.filter((u) => !distUrls.has(u));
      p5ok = !!servedIndex && pageFiles.length === 158 && missingPages.length === 0 && missingCode.length === 0 &&
        (servedIndex.distribution || []).length === 205;
      p5detail = 'pageFiles=' + pageFiles.length + ', missingPages=' + (missingPages.join(',') || '0') +
        ', missingCode=' + (missingCode.join(',') || '0') + ', distributions=' + (servedIndex ? (servedIndex.distribution || []).length : 0);
    } catch (e) { p5ok = false; p5detail = e.message; }
    check('P-5 certificate covers all 158 per-page JSONs + the site shell + the deployed code sets (205 distributions)',
      p5ok, p5detail);

    // P-6: repo-served distribution digests re-computed over live bytes
    // (P-3 covers site-served entries; P1 left repo entries to push-time
    // read-back — P2 strengthens the gate to live verification, since the
    // code sets' canonical copies now live in the machine repo).
    let p6ok = 0; const p6bad = [];
    const repoEntries = servedIndex ? (servedIndex.distribution || []).filter((e) => String(e.contentUrl || '').includes('raw.githubusercontent.com')) : [];
    for (const e of repoEntries) {
      try {
        const r = await fetchFull(e.contentUrl);
        const hex = crypto.createHash('sha256').update(r.buf).digest('hex');
        if (r.status === 200 && e.digest && hex === e.digest.value && r.buf.length === e.digest.byteSize) p6ok++;
        else p6bad.push(e.name + ' (status ' + r.status + ', served ' + r.buf.length + 'B vs index ' + (e.digest ? e.digest.byteSize + 'B' : 'no digest') + ')');
      } catch (err) { p6bad.push(e.name + ' (' + err.message + ')'); }
    }
    check('P-6 all repo-served distribution digests match the live served bytes',
      !!servedIndex && p6bad.length === 0 && p6ok === repoEntries.length && repoEntries.length > 0,
      p6ok + '/' + repoEntries.length + ' match' + (p6bad.length ? '; mismatch: ' + p6bad.join('; ') : ''));
  } catch (e) {
    check('provenance layer (P-1..P-6) fetched and evaluated', false, e.message);
  }

  // --- 12. Structural — Batch 9 (2026-10-29; checks S-1..S-6) ---
  // Added in the same motion as the structural batch shipped (record:
  // out/verify-fix-2026-10-29-batch9.md). Batch 9 gave every canonical URL
  // its own served head (Pages middleware + generated head-data), real
  // per-URL sitemap lastmod values, explicit AI-crawler robots groups,
  // and the R8/R9 rubric gates. These checks assert the SERVED and
  // RECORDED state so a silent regression fails the suite.
  try {
    const PAGES_PROJECT = path.resolve(ROOT, '..', 'the-flat-rate-movers-pages');
    // S-1: the deployed head-data module covers the whole registry.
    const headSrc = fs.readFileSync(path.join(PAGES_PROJECT, 'functions', 'head-data.js'), 'utf8');
    const headJson = headSrc.replace(/^\/\/[^\n]*\n/gm, '').replace('export const HEAD = ', '').replace(/;\s*$/, '');
    const HEADMAP = JSON.parse(headJson);
    const regUrls = new Set(pages.pages.map((p) => p.url));
    const headEntries = Object.values(HEADMAP);
    const headBad = headEntries.filter((e) => !e.t || !e.d || !e.c || !regUrls.has(e.c) || !e.jf || !e.ld ||
      !String(e.ld).includes('"@id":"' + e.c + '#webpage"'));
    check('S-1 functions/head-data.js covers every registry URL with title, description, canonical, page JSON and a WebPage node',
      headEntries.length === pages.pages.length && headBad.length === 0 &&
      pages.pages.every((p) => headEntries.some((e) => e.c === p.url)),
      'entries=' + headEntries.length + ', registry=' + pages.pages.length + (headBad.length ? ', bad: ' + headBad.map((e) => e.slug).join(', ') : ''));
    // S-2: the middleware that applies the head data is deployed.
    const mwSrc = fs.readFileSync(path.join(PAGES_PROJECT, 'functions', '_middleware.js'), 'utf8');
    check('S-2 functions/_middleware.js present and driven by head-data (per-URL head resolver)',
      mwSrc.includes("from './head-data.js'") && mwSrc.includes('onRequest'),
      'middleware ' + mwSrc.length + ' bytes');
    // S-3: live per-URL heads on a defined route set (home, branch service,
    // article, workforce, category, faq, services index, developer).
    const routeSet = ['/', '/gun-safe-movers-winchester-va/', '/the-invisible-risk-of-high-mass-relocation/',
      '/specialized-workforce-labor/', '/category/logistics/', '/faq/', '/services/', '/developer/'];
    const headByPath = {};
    for (const [k, v] of Object.entries(HEADMAP)) headByPath[k === '/' ? '/' : k + '/'] = v;
    let s3bad = [];
    for (const route of routeSet) {
      const e = headByPath[route];
      try {
        const body = await fetchText('https://theflatratemovers.com' + route);
        const headPart = body.slice(0, body.indexOf('</head>'));
        const title = (headPart.match(/<title>(.*?)<\/title>/s) || [])[1];
        const canon = (headPart.match(/<link rel="canonical" id="canonicalLink" href="([^"]*)"/) || [])[1];
        const ld = (headPart.match(/<script type="application\/ld\+json" id="page-jsonld">(.*?)<\/script>/s) || [])[1];
        let ldOk = false;
        try { ldOk = !!ld && JSON.stringify(JSON.parse(ld)) === JSON.stringify(JSON.parse(e.ld)); } catch (_) {}
        if (title !== e.t || canon !== e.c || !ldOk || !headPart.includes('data-page-json="' + e.jf + '"')) s3bad.push(route);
      } catch (err) { s3bad.push(route + ' (' + err.message + ')'); }
    }
    check('S-3 live routes serve their own head (title + canonical + page JSON-LD + per-page JSON) on the defined route set',
      s3bad.length === 0, routeSet.length + ' routes' + (s3bad.length ? ', bad: ' + s3bad.join(', ') : ''));
    // S-4: sitemap lastmod sanity — format, real dates, not in the future,
    // not one blanket date.
    try {
      const xml = await fetchText(LIVE_SITEMAP);
      const mods = [...xml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map((m) => m[1].trim());
      const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const fmtOk = mods.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d)));
      const rangeOk = mods.every((d) => d >= '2026-10-28' && d <= todayET);
      check('S-4 live sitemap lastmod values are real per-URL dates (valid format, 2026-10-28..today ET, not one blanket date)',
        mods.length === pages.pages.length && fmtOk && rangeOk && new Set(mods).size >= 2,
        mods.length + ' values, distinct=' + new Set(mods).size + ', range ' + (mods.length ? [...mods].sort()[0] + '..' + [...mods].sort()[mods.length - 1] : 'n/a'));
    } catch (e) {
      check('S-4 live sitemap lastmod sanity', false, e.message);
    }
    // S-5: robots.txt carries the explicit AI-crawler groups.
    try {
      const robots = await fetchText('https://theflatratemovers.com/robots.txt');
      const agents = ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-User', 'anthropic-ai',
        'Google-Extended', 'PerplexityBot', 'Perplexity-User', 'CCBot', 'Applebot-Extended',
        'Meta-ExternalAgent', 'cohere-ai', 'YouBot', 'DuckAssistBot', 'MistralAI-User'];
      const missingAgents = agents.filter((a) => !robots.includes('User-agent: ' + a));
      check('S-5 live robots.txt states explicit Allow groups for the 16 AI crawlers + wildcard + sitemap + llms.txt reference',
        missingAgents.length === 0 && robots.includes('User-agent: *') && robots.includes('Allow: /') &&
        robots.includes('Sitemap: https://theflatratemovers.com/sitemap.xml') && robots.includes('llms.txt'),
        missingAgents.length ? 'missing: ' + missingAgents.join(', ') : 'all 16 groups present');
    } catch (e) {
      check('S-5 live robots.txt AI-crawler groups', false, e.message);
    }
    // S-6: rubric gates recorded (R8/R9 definitions + 23 + 23 scored rows).
    try {
      const { execSync } = require('child_process');
      const dbPath = path.resolve(ROOT, '..', 'theflatratemovers', 'rubric.db');
      const q = (sql) => execSync('sqlite3 "' + dbPath + '" "' + sql + '"').toString().trim();
      const gateDefs = parseInt(q("SELECT COUNT(*) FROM rubric_check WHERE check_id IN ('R8','R9');"), 10);
      const crawlRows = parseInt(q("SELECT COUNT(*) FROM attestation WHERE claim LIKE 'Crawlability gate —%';"), 10);
      const provRows = parseInt(q("SELECT COUNT(*) FROM attestation WHERE claim LIKE 'Provenance & integrity gate —%';"), 10);
      check('S-6 rubric.db carries the R8 crawlability + R9 provenance gate definitions and 23 + 23 scored gate rows',
        gateDefs === 2 && crawlRows === services.services.length && provRows === services.services.length,
        'defs=' + gateDefs + ', crawlability rows=' + crawlRows + ', provenance rows=' + provRows);
    } catch (e) {
      check('S-6 rubric gate rows present', false, e.message);
    }
  } catch (e) {
    check('structural Batch 9 checks (S-1..S-6) evaluated', false, e.message);
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
