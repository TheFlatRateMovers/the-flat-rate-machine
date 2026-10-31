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
// Batch Dataset Discoverability (2026-10-30): the published dataset
// files, enumerated from the Pages public listing — sitemap and
// discoverability expectations derive from this, never a literal.
const PAGES_PUBLIC = path.resolve(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const DATASET_FILES = fs.readdirSync(PAGES_PUBLIC).filter((f) => /^datasets-.+\.json$/.test(f)).sort();

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
  // Rewritten by Batch Dataset Discoverability, 2026-10-30 (record:
  // out/verify-fix-2026-10-30-dataset-discoverability.md): the
  // sitemap now also lists the published dataset files (Dataset
  // Search + Common Crawl discoverability), so the expected live
  // set is pages.json URLs + dataset-file URLs, both derived —
  // stricter than the old pages-only premise, which this approved
  // batch superseded. Check names say what they now assert.
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
    const dsUrls = new Set(DATASET_FILES.map((f) => 'https://theflatratemovers.com/' + f));
    const expected = new Set([...mine, ...dsUrls]);
    const missing = [...expected].filter((u) => !liveUrls.has(u));
    const extra = [...liveUrls].filter((u) => !expected.has(u));
    check('every pages.json URL is in the live sitemap', [...mine].filter((u) => !liveUrls.has(u)).length === 0,
      [...mine].filter((u) => !liveUrls.has(u)).length ? 'missing: ' + [...mine].filter((u) => !liveUrls.has(u)).join(', ') : 'all ' + mine.size + ' present');
    check('every live sitemap URL is a registry page or a published dataset file', extra.length === 0,
      extra.length ? 'extra: ' + extra.join(', ') : 'no extras beyond ' + mine.size + ' pages + ' + dsUrls.size + ' dataset files');
    check('live sitemap URL count matches registry + dataset files', liveUrls.size === expected.size, 'live=' + liveUrls.size + ', expected=' + expected.size);
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
    // Extended by Batch Blog Pilots Live, 2026-10-30 (same motion as the
    // first two guide posts shipped): totals move to 160 per-page JSON
    // files and 207 distributions (36 data + 160 pages + 11 shell/code —
    // no new dataset; the two post JSONs join the page set). The
    // assertion stays exact-count. Record:
    // out/verify-fix-2026-10-30-blog-pilots.md.
    // Extended by Batch Blog N1N2 Live, 2026-10-30 (same motion as the
    // next two guide posts shipped): totals move to 162 per-page JSON
    // files and 209 distributions (36 data + 162 pages + 11 shell/code —
    // no new dataset; the two post JSONs join the page set). The same
    // batch carried the owner's curb/curbside spelling sweep across the
    // final-mile and white-glove copy. The assertion stays exact-count.
    // Record: out/verify-fix-2026-10-30-blog-n1n2.md.
    // Extended by Batch Intent Rubric, 2026-10-30 (same motion as the
    // generative intent-coverage dataset shipped): totals move to 210
    // distributions (37 data + 162 pages + 11 shell/code — the new
    // datasets-intent-coverage.json joins the data set; no new page).
    // The assertion stays exact-count. Record:
    // out/verify-fix-2026-10-30-intent-rubric.md.
    // Extended by Batch Racking Relocation, 2026-10-30 (same motion as
    // the first takeover category shipped): totals move to 163 per-page
    // JSON files and 212 distributions (38 data + 163 pages + 11
    // shell/code — the new datasets-warehouse-racking-relocation.json
    // joins the data set, the new warehouse-racking-relocation.json
    // joins the page set, and datasets-intent-coverage.json is
    // regenerated + re-sealed in the same batch with the new service's
    // rows). The assertion stays exact-count. Record:
    // out/verify-fix-2026-10-30-racking-relocation.md.
    // Extended by Batch FF&E Logistics, 2026-10-30 (takeover category
    // #2, same motion): totals move to 164 per-page JSON files and 214
    // distributions (39 data + 164 pages + 11 shell/code — the new
    // datasets-ffe-logistics.json joins the data set, the new
    // ffe-logistics.json joins the page set, and
    // datasets-intent-coverage.json is regenerated + re-sealed in the
    // same batch with the new service's rows). The assertion stays
    // exact-count. Record:
    // out/verify-fix-2026-10-30-ffe-logistics.md.
    // Extended by Batch Inland Port Transloading, 2026-10-30 (takeover
    // category #3, same motion): totals move to 165 per-page JSON files
    // and 216 distributions (40 data + 165 pages + 11 shell/code — the
    // new datasets-transloading-inland-port.json joins the data set, the
    // new virginia-inland-port-transloading.json joins the page set, and
    // datasets-intent-coverage.json is regenerated + re-sealed in the
    // same batch with the transloading rows now backed by the new
    // dataset file). Services stay 26 (the hub attaches to the existing
    // transloading service). The assertion stays exact-count. Record:
    // out/verify-fix-2026-10-30-inland-port-transloading.md.
    // Extended by Batch Data Center Relocation, 2026-10-30 (takeover
    // category #4, same motion): totals move to 166 per-page JSON files
    // and 218 distributions (41 data + 166 pages + 11 shell/code — the
    // new datasets-data-center-relocation.json joins the data set, the
    // new data-center-relocation.json joins the page set, and
    // datasets-intent-coverage.json is regenerated + re-sealed in the
    // same batch with the new service's rows). The assertion stays
    // exact-count. Record:
    // out/verify-fix-2026-10-30-data-center-relocation.md.
    // Extended by Batch Medical & Laboratory Equipment Relocation,
    // 2026-10-30 (takeover category #5, same motion): totals move to
    // 167 per-page JSON files and 220 distributions (42 data + 167
    // pages + 11 shell/code — the new datasets-medical-lab-relocation.json
    // joins the data set, the new medical-lab-equipment-relocation.json
    // joins the page set, and datasets-intent-coverage.json is
    // regenerated + re-sealed in the same batch with the new service's
    // rows). The assertion stays exact-count. Record:
    // out/verify-fix-2026-10-30-medical-lab-relocation.md.
    // Extended by Batch Dataset Discoverability, 2026-10-30 (same
    // motion): totals move to 200 per-page JSON files and 253
    // distributions (42 data + 200 pages + 11 shell/code — the 33 new
    // dataset landing pages join the page set; no data file is added,
    // but every file carrying Dataset nodes changes digest as the
    // Dataset Search metadata lands, and datasets-intent-coverage.json
    // is regenerated + re-sealed in the same batch). The assertion
    // Extended by Batch Blog N3N4 Live, 2026-10-31 (same motion):
    // totals move to 202 per-page JSON files and 255 distributions
    // (42 data + 202 pages + 11 shell/code — the two new guide posts,
    // when-an-item-needs-a-custom-crate and
    // i-81-shenandoah-valley-move-timing, join the page set under the
    // owner's standing blog authorization of 2026-10-31, and
    // datasets-intent-coverage.json is regenerated + re-sealed in the
    // same batch; the batch also corrects the stale signed-index
    // label "Entity Graph — Full (92 nodes)" to "Entity Graph — Site
    // (38 nodes)", the true node count of the file the entry serves).
    // The assertion stays exact-count. Record:
    // out/verify-fix-2026-10-31-blog-n3n4.md.
    // Extended by Batch Intent Rubric v2 Live, 2026-10-31 (same
    // motion): totals move to 257 distributions (42 data + 202 pages
    // + 13 shell/code — the two v2 code files join the code set under
    // the owner's certificate directive that every code/script carry
    // the seal: scripts/build-intent-rubric.js, the generative rubric
    // builder whose output is itself a sealed dataset, and
    // scripts/ingest-outcome-evidence.py, the outcome-evidence ingest
    // tool. No page or data file is added; the page set stays 202).
    // The assertion stays exact-count. Record:
    // out/verify-fix-2026-10-31-intent-rubric-v2.md.
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
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/scripts/build-intent-rubric.js',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/scripts/ingest-outcome-evidence.py',
    ];
    let p5detail = '', p5ok = false;
    try {
      const pubDir = path.join(path.resolve(ROOT, '..', 'the-flat-rate-movers-pages'), 'public');
      const nonPage = new Set(['ai-master-index.json', 'ai-sitemap.json', 'entity-graph.json', 'best-json-entity-graph.json', 'ai-catalog.json']);
      const pageFiles = fs.readdirSync(pubDir).filter((f) => f.endsWith('.json') && !nonPage.has(f) && !f.startsWith('datasets-')).sort();
      const distUrls = new Set((servedIndex.distribution || []).map((e) => e.contentUrl));
      const missingPages = pageFiles.filter((f) => !distUrls.has('https://theflatratemovers.com/' + f));
      const missingCode = P2_CODE_URLS.filter((u) => !distUrls.has(u));
      p5ok = !!servedIndex && pageFiles.length === 202 && missingPages.length === 0 && missingCode.length === 0 &&
        (servedIndex.distribution || []).length === 257;
      p5detail = 'pageFiles=' + pageFiles.length + ', missingPages=' + (missingPages.join(',') || '0') +
        ', missingCode=' + (missingCode.join(',') || '0') + ', distributions=' + (servedIndex ? (servedIndex.distribution || []).length : 0);
    } catch (e) { p5ok = false; p5detail = e.message; }
    check('P-5 certificate covers all 202 per-page JSONs + the site shell + the deployed code sets (257 distributions)',
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
        mods.length === pages.pages.length + DATASET_FILES.length && fmtOk && rangeOk && new Set(mods).size >= 2,
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

  // --- 13. Intent-coverage rubric — Batch Intent Rubric (2026-10-30; checks I-1..I-5) ---
  // Added in the same motion as the feature shipped (record:
  // out/verify-fix-2026-10-30-intent-rubric.md). The generative
  // intent-coverage rubric (scripts/build-intent-rubric.js) maps the
  // query strings customers and AI assistants use to the page, per-page
  // JSON, dataset files and graph node that answer each one; its rows
  // live in rubric.db (intent_query) and its public face is
  // datasets-intent-coverage.json, a sealed distribution. These checks
  // assert the whole chain: regeneration is byte-identical, every row
  // target is a registry page, every target JSON and dataset is in the
  // served signed index, and the published dataset's counts and row
  // digest equal the database's.
  try {
    const { execFileSync } = require('child_process');
    const dbPathI = path.resolve(ROOT, '..', 'theflatratemovers', 'rubric.db');
    const qI = (sql) => execFileSync('sqlite3', ['-json', dbPathI, sql]).toString();
    const fetchFullI = (url) => new Promise((resolve, reject) => {
      https.get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => { chunks.push(c); });
        res.on('end', () => resolve({ status: res.statusCode, ct: res.headers['content-type'] || '', buf: Buffer.concat(chunks) }));
      }).on('error', reject);
    });
    // I-1: generator re-run byte-identical to the DB (canonical rows digest).
    let i1ok = false, i1detail = '';
    try {
      const out = execFileSync('node', [path.join(ROOT, 'scripts', 'build-intent-rubric.js'), '--check'], { cwd: ROOT }).toString().trim();
      i1ok = out.startsWith('CHECK PASS');
      i1detail = out;
    } catch (e) { i1ok = false; i1detail = e.stdout ? e.stdout.toString().trim() : e.message; }
    check('I-1 intent rubric generator re-run is byte-identical to rubric.db intent_query (canonical rows digest)', i1ok, i1detail);
    // Load the rows + meta once for I-2..I-5.
    const rowsI = JSON.parse(qI('SELECT query_text, service_id, target_url, target_json, dataset_ids, gate_page_in_registry AS g1, gate_target_in_signed_index AS g2, gate_datasets_in_signed_index AS g3 FROM intent_query;') || '[]');
    const metaI = {};
    for (const m of JSON.parse(qI('SELECT key, value FROM intent_meta;') || '[]')) metaI[m.key] = m.value;
    // I-2: every row target in pages.json; all gates 1.
    const pageUrlsI = new Set(pages.pages.map((p) => p.url));
    const badTargets = rowsI.filter((r) => !pageUrlsI.has(r.target_url));
    const badGates = rowsI.filter((r) => !(r.g1 === 1 && r.g2 === 1 && r.g3 === 1));
    check('I-2 every intent_query row target is a pages.json URL and all three coverage gates are 1',
      rowsI.length > 0 && badTargets.length === 0 && badGates.length === 0,
      rowsI.length + ' rows, badTargets=' + badTargets.length + ', badGates=' + badGates.length);
    // I-3: every row target JSON + dataset file is a distribution in the
    // served signed index (and so is the rubric's own dataset file).
    const servedIdxI = JSON.parse(await fetchText('https://theflatratemovers.com/ai-master-index.json'));
    const distUrlsI = new Set((servedIdxI.distribution || []).map((e) => e.contentUrl));
    const missingI = new Set();
    for (const r of rowsI) {
      if (!distUrlsI.has(r.target_json)) missingI.add(r.target_json);
      for (const f of JSON.parse(r.dataset_ids)) {
        const u = 'https://theflatratemovers.com/' + f;
        if (!distUrlsI.has(u)) missingI.add(u);
      }
    }
    check('I-3 every intent row target JSON and backing dataset is a distribution in the served signed index',
      missingI.size === 0 && distUrlsI.has('https://theflatratemovers.com/datasets-intent-coverage.json'),
      'missing=' + (missingI.size ? [...missingI].slice(0, 5).join(', ') : '0') + ', intent dataset in index=' + distUrlsI.has('https://theflatratemovers.com/datasets-intent-coverage.json'));
    // I-4: published dataset counts + row digest equal the DB.
    const dsPath = path.resolve(ROOT, '..', 'the-flat-rate-movers-pages', 'public', 'datasets-intent-coverage.json');
    const dsDoc = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
    const dsGraph = dsDoc['@graph'] || [];
    const d8 = dsGraph.find((n) => n['@id'] === 'https://theflatratemovers.com/#dataset-intent-coverage-totals');
    const covNodes = dsGraph.filter((n) => String(n['@id']).includes('/#intent-coverage-'));
    const perSvcDb = {};
    for (const r of rowsI) perSvcDb[r.service_id] = (perSvcDb[r.service_id] || 0) + 1;
    const covBad = covNodes.filter((n) => {
      const svcId = 'service-' + String(n['@id']).split('/#intent-coverage-')[1];
      return n.queryRows !== perSvcDb[svcId];
    });
    check('I-4 published intent-coverage dataset counts and row digest equal rubric.db (totals node + 28 coverage nodes)',
      !!d8 && d8.intentRowsDigest === metaI.rows_digest && parseInt(metaI.row_count, 10) === rowsI.length &&
      covNodes.length === services.services.length && covBad.length === 0,
      'rows=' + rowsI.length + ', digest match=' + (d8 ? d8.intentRowsDigest === metaI.rows_digest : 'no D8') +
      ', coverage nodes=' + covNodes.length + ', bad=' + covBad.length);
    // I-5: the live dataset URL serves the same document (JSON, not the
    // SPA fallback) with the DB's row digest.
    const liveDsRes = await fetchFullI('https://theflatratemovers.com/datasets-intent-coverage.json');
    let liveD8 = null;
    try { liveD8 = (JSON.parse(liveDsRes.buf.toString('utf8'))['@graph'] || []).find((n) => n['@id'] === 'https://theflatratemovers.com/#dataset-intent-coverage-totals'); } catch (_) { liveD8 = null; }
    check('I-5 live datasets-intent-coverage.json serves application/json with the rubric.db row digest',
      liveDsRes.status === 200 && liveDsRes.ct.includes('application/json') && !!liveD8 && liveD8.intentRowsDigest === metaI.rows_digest,
      'status=' + liveDsRes.status + ', content-type=' + liveDsRes.ct + ', digest match=' + (liveD8 ? liveD8.intentRowsDigest === metaI.rows_digest : 'unparseable'));
  } catch (e) {
    check('intent-coverage rubric checks (I-1..I-5) evaluated', false, e.message);
  }

  // --- 13b. Intent Rubric v2 (Batch Intent Rubric v2 Live, 2026-10-31; checks I-6..I-9) ---
  // Applies the staged patch (verify-section-13-v2.patch.md) in the
  // same motion as rubric v2 shipped. Record:
  // out/verify-fix-2026-10-31-intent-rubric-v2.md. Vocabulary note:
  // the patch's gate-state words {observed, verified} are the
  // generator's single state 'passed' (a gate passes only on
  // recorded evidence); the outcome_status vocabulary matches the
  // generator exactly. All four checks fail closed: a missing v2
  // table, meta key, or field is a FAIL, never a skip.
  try {
    const { execFileSync } = require('child_process');
    const dbPathV = path.resolve(ROOT, '..', 'theflatratemovers', 'rubric.db');
    const qV = (sql) => execFileSync('sqlite3', ['-json', dbPathV, sql], { maxBuffer: 64 * 1024 * 1024 }).toString();
    const rowsOfV = (sql) => JSON.parse(qV(sql) || '[]');
    const oneV = (sql) => rowsOfV(sql)[0] || {};
    const sum0 = (v) => (v === null || v === undefined ? 0 : v);
    const metaV = {};
    for (const mm of rowsOfV('SELECT key, value FROM intent_meta;')) metaV[mm.key] = mm.value;
    const countsV = oneV('SELECT (SELECT COUNT(*) FROM intent_query) AS rows_n, (SELECT COUNT(*) FROM intent_row_outcome) AS outcome_n, (SELECT COUNT(*) FROM intent_outcome_evidence) AS evidence_n, (SELECT COUNT(*) FROM gsc_observed_queries) AS obs_q, (SELECT COUNT(*) FROM gsc_observed_pages) AS obs_p, (SELECT COUNT(*) FROM intent_row_gsc_evidence) AS ev_rows, (SELECT COUNT(DISTINCT observation_id) FROM intent_row_gsc_evidence) AS ev_attached');
    const genSummaryV = JSON.parse(fs.readFileSync(path.join(ROOT, 'out', 'batch-intent-rubric', 'work', 'generation-summary.json'), 'utf8'));
    const batchV = oneV('SELECT window_start, window_end FROM gsc_import_batches ORDER BY id DESC LIMIT 1;');
    const rowsV = rowsOfV('SELECT query_text, service_id, target_url, observation_ids FROM intent_query;');
    const obsPageSetV = new Set(rowsOfV('SELECT page_url FROM gsc_observed_pages;').map((r) => r.page_url.replace('://www.', '://')));
    const registrySetV = new Set(pages.pages.map((p) => p.url.replace('://www.', '://')));

    // I-6: v2 generator version + source accounting + full coverage + evidence window.
    const i6ok = metaV.generator_version === '2.0.0' && metaV.schema_version === '2' &&
      parseInt(metaV.row_count, 10) === countsV.rows_n &&
      genSummaryV.rows === countsV.rows_n &&
      parseInt(metaV.page_derived_rows, 10) === genSummaryV.pageDerived.rowsEmitted && genSummaryV.pageDerived.rowsEmitted > 0 &&
      parseInt(metaV.rollup_rows, 10) === genSummaryV.rollup.rowsEmitted &&
      parseInt(metaV.target_pages_covered, 10) === pages.pages.length &&
      parseInt(metaV.target_pages_total, 10) === pages.pages.length &&
      Array.isArray(genSummaryV.targetCoverage.uncovered) && genSummaryV.targetCoverage.uncovered.length === 0 &&
      metaV.evidence_era === 'pre-rebuild' &&
      metaV.evidence_window === String(batchV.window_start) + '/' + String(batchV.window_end) &&
      parseInt(metaV.evidence_queries_attached, 10) === countsV.ev_attached;
    check('I-6 rubric v2 generator version, source accounting (v1 + page-derived + roll-up = total), full page-registry target coverage and evidence window reconcile',
      i6ok, 'generator ' + metaV.generator_version + ' / schema ' + metaV.schema_version + '; rows=' + countsV.rows_n +
        ' (v1 ' + (countsV.rows_n - (genSummaryV.pageDerived.rowsEmitted || 0) - (genSummaryV.rollup.rowsEmitted || 0)) +
        ' + page-derived ' + genSummaryV.pageDerived.rowsEmitted + ' + roll-up ' + genSummaryV.rollup.rowsEmitted + '); coverage ' +
        metaV.target_pages_covered + '/' + metaV.target_pages_total + '; window ' + metaV.evidence_window + '; attached queries ' + countsV.ev_attached);

    // I-7: evidence attachments are era-tagged, metric-true, gated to existed-in-window + still-live targets.
    const evJoinV = oneV("SELECT " +
      "SUM(CASE WHEN e.era != 'pre-rebuild' THEN 1 ELSE 0 END) AS bad_era, " +
      "SUM(CASE WHEN e.window_start != o.window_start OR e.window_end != o.window_end THEN 1 ELSE 0 END) AS bad_window, " +
      "SUM(CASE WHEN e.clicks != o.clicks OR e.impressions != o.impressions OR e.ctr != o.ctr OR e.avg_position != o.avg_position THEN 1 ELSE 0 END) AS bad_metrics " +
      "FROM intent_row_gsc_evidence e JOIN gsc_observed_queries o ON o.id = e.observation_id");
    const evRowsV = rowsOfV('SELECT query_text, service_id, observation_id FROM intent_row_gsc_evidence;');
    const rowByKeyV = new Map(rowsV.map((r) => [r.query_text + '|' + r.service_id, r]));
    let badExistV = 0, danglingV = 0;
    for (const r of rowsV) {
      const ids = JSON.parse(r.observation_ids || '[]');
      const tu = String(r.target_url).replace('://www.', '://');
      if (ids.length && (!obsPageSetV.has(tu) || !registrySetV.has(tu))) badExistV++;
      for (const id of ids) {
        if (!evRowsV.some((e) => e.query_text === r.query_text && e.service_id === r.service_id && e.observation_id === id)) danglingV++;
      }
    }
    for (const e of evRowsV) {
      const r = rowByKeyV.get(e.query_text + '|' + e.service_id);
      if (!r || !JSON.parse(r.observation_ids || '[]').includes(e.observation_id)) danglingV++;
    }
    check('I-7 v2 evidence attachments are era-tagged pre-rebuild, metric-true to the import, and attach only to rows whose target existed in the window and is still live',
      sum0(evJoinV.bad_era) === 0 && sum0(evJoinV.bad_window) === 0 && sum0(evJoinV.bad_metrics) === 0 &&
        badExistV === 0 && danglingV === 0 && countsV.ev_rows > 0,
      'evidence rows=' + countsV.ev_rows + ', attached queries=' + countsV.ev_attached + '; bad era/window/metrics=' +
        sum0(evJoinV.bad_era) + '/' + sum0(evJoinV.bad_window) + '/' + sum0(evJoinV.bad_metrics) +
        '; bad targets=' + badExistV + '; dangling links=' + danglingV);

    // I-8: outcome integrity — 1:1 summaries, legal states, proven states carry their proof,
    // status derivations hold, awaiting-observation rows honestly name the window, evidence log append-only.
    const GC = ['crawled', 'indexed', 'understood', 'corroborated', 'cited_maintained'];
    const ocV = oneV('SELECT ' +
      'SUM(CASE WHEN ' + GC.map((g) => g + "_state NOT IN ('unknown','passed','failed','not-applicable')").join(' OR ') + ' THEN 1 ELSE 0 END) AS bad_state, ' +
      'SUM(CASE WHEN ' + GC.map((g) => '(' + g + "_state != 'unknown' AND (" + g + '_checked_at IS NULL OR ' + g + '_evidence_source IS NULL))').join(' OR ') + ' THEN 1 ELSE 0 END) AS bad_proof, ' +
      "SUM(CASE WHEN outcome_status NOT IN ('unknown','awaiting-observation','partial','blocked','complete') THEN 1 ELSE 0 END) AS bad_status, " +
      "SUM(CASE WHEN outcome_status = 'complete' AND NOT (" + GC.map((g) => g + "_state = 'passed'").join(' AND ') + ') THEN 1 ELSE 0 END) AS bad_complete, ' +
      "SUM(CASE WHEN outcome_status = 'partial' AND NOT (" + GC.map((g) => g + "_state = 'passed'").join(' OR ') + ') THEN 1 ELSE 0 END) AS bad_partial ' +
      'FROM intent_row_outcome');
    const joinV = oneV('SELECT ' +
      '(SELECT COUNT(*) FROM intent_row_outcome o LEFT JOIN intent_query q ON q.query_text = o.query_text AND q.service_id = o.service_id WHERE q.query_text IS NULL) AS orphan_outcomes, ' +
      '(SELECT COUNT(*) FROM intent_query q LEFT JOIN intent_row_outcome o ON q.query_text = o.query_text AND q.service_id = o.service_id WHERE o.query_text IS NULL) AS rows_without_outcome');
    const awaitingRowsV = rowsOfV("SELECT q.target_url, o.outcome_basis FROM intent_row_outcome o JOIN intent_query q ON q.query_text = o.query_text AND q.service_id = o.service_id WHERE o.outcome_status = 'awaiting-observation'");
    let badAwaitV = 0;
    for (const r of awaitingRowsV) {
      const tu = String(r.target_url).replace('://www.', '://');
      if (!/evidence window/.test(r.outcome_basis || '') || obsPageSetV.has(tu)) badAwaitV++;
    }
    check('I-8 v2 outcome summaries are 1:1 with rows, every non-unknown gate state is proven and dated, status derivations hold, and the evidence log is append-only',
      countsV.outcome_n === countsV.rows_n && joinV.orphan_outcomes === 0 && joinV.rows_without_outcome === 0 &&
        sum0(ocV.bad_state) === 0 && sum0(ocV.bad_proof) === 0 && sum0(ocV.bad_status) === 0 &&
        sum0(ocV.bad_complete) === 0 && sum0(ocV.bad_partial) === 0 && badAwaitV === 0 &&
        countsV.evidence_n === parseInt(metaV.outcome_evidence_count, 10),
      'summaries=' + countsV.outcome_n + '/' + countsV.rows_n + '; orphans=' + joinV.orphan_outcomes + '/' + joinV.rows_without_outcome +
        '; bad state/proof/status/complete/partial=' + sum0(ocV.bad_state) + '/' + sum0(ocV.bad_proof) + '/' + sum0(ocV.bad_status) + '/' +
        sum0(ocV.bad_complete) + '/' + sum0(ocV.bad_partial) + '; bad awaiting=' + badAwaitV +
        '; evidence log=' + countsV.evidence_n + ' (meta baseline ' + metaV.outcome_evidence_count + ')');

    // I-9: the published dataset v2 fields reconcile with the database (no hand-edited numbers).
    const dsDocV = JSON.parse(fs.readFileSync(path.resolve(ROOT, '..', 'the-flat-rate-movers-pages', 'public', 'datasets-intent-coverage.json'), 'utf8'));
    const graphV = dsDocV['@graph'] || [];
    const d8V = graphV.find((n) => n['@id'] === 'https://theflatratemovers.com/#dataset-intent-coverage-totals');
    const d6V = graphV.find((n) => n['@id'] === 'https://theflatratemovers.com/#dataset-intent-coverage-sources');
    const covNodesV = graphV.filter((n) => String(n['@id']).includes('/#intent-coverage-'));
    const ocRowsV = rowsOfV('SELECT service_id, outcome_status, highest_gate_passed, crawled_state, indexed_state, understood_state, corroborated_state, cited_maintained_state FROM intent_row_outcome');
    const byStatusV = { unknown: 0, 'awaiting-observation': 0, partial: 0, blocked: 0, complete: 0 };
    const byHighestV = { none: 0, crawled: 0, indexed: 0, understood: 0, corroborated: 0, 'cited-maintained': 0 };
    const byGateV = { crawled: {}, indexed: {}, understood: {}, corroborated: {}, 'cited-maintained': {} };
    for (const r of ocRowsV) {
      byStatusV[r.outcome_status] = (byStatusV[r.outcome_status] || 0) + 1;
      byHighestV[r.highest_gate_passed] = (byHighestV[r.highest_gate_passed] || 0) + 1;
      for (const g of GC) {
        const lbl = g === 'cited_maintained' ? 'cited-maintained' : g;
        byGateV[lbl][r[g + '_state']] = (byGateV[lbl][r[g + '_state']] || 0) + 1;
      }
    }
    const enrichedSvcV = {};
    for (const r of rowsV) if (JSON.parse(r.observation_ids || '[]').length) enrichedSvcV[r.service_id] = (enrichedSvcV[r.service_id] || 0) + 1;
    const covBadV = covNodesV.filter((n) => {
      const sid = 'service-' + String(n['@id']).split('/#intent-coverage-')[1];
      return n.queryRowsBySource.generated !== n.queryRows ||
        n.generatedRowsEnrichedByGsc !== (enrichedSvcV[sid] || 0) ||
        !n.outcomeRollup || n.outcomeRollup.rows !== n.queryRows;
    });
    const geoV = load('data/service-area.geojson');
    const areaTaggedV = oneV('SELECT COUNT(*) AS n FROM intent_query WHERE area IS NOT NULL').n;
    const rollEqV = (pub, dbMap, vocab) => !!pub &&
      Object.keys(pub).every((k) => vocab.includes(k)) &&
      vocab.every((k) => (pub[k] || 0) === (dbMap[k] || 0));
    const gateEqV = (pub, dbMap) => !!pub &&
      ['crawled', 'indexed', 'understood', 'corroborated', 'cited-maintained'].every((g) =>
        rollEqV(pub[g], dbMap[g] || {}, ['unknown', 'passed', 'failed', 'not-applicable']));
    const d8okV = !!d8V && d8V.generatedBy === 'build-intent-rubric.js v2.0.0' &&
      d8V.rowSources.estateGenerated === countsV.rows_n &&
      d8V.rowSources.pageDerived === parseInt(metaV.page_derived_rows, 10) &&
      d8V.rowSources.gscObservedRows === 0 &&
      d8V.gscEvidence.queriesImported === countsV.obs_q &&
      d8V.gscEvidence.queriesAttachedToRows === countsV.ev_attached &&
      d8V.gscEvidence.rowsEnriched === rowsV.filter((r) => JSON.parse(r.observation_ids || '[]').length).length &&
      d8V.gscEvidence.pagesInExport === countsV.obs_p &&
      d8V.gscEvidence.pagesStillLive + d8V.gscEvidence.pagesStale === countsV.obs_p &&
      d8V.outcomeDigest === metaV.outcome_digest &&
      d8V.outcomeRollup.rows === countsV.rows_n &&
      rollEqV(d8V.outcomeRollup.byStatus, byStatusV, ['unknown', 'awaiting-observation', 'partial', 'blocked', 'complete']) &&
      rollEqV(d8V.outcomeRollup.byHighestGate, byHighestV, ['none', 'crawled', 'indexed', 'understood', 'corroborated', 'cited-maintained']) &&
      gateEqV(d8V.outcomeRollup.byGateState, byGateV) &&
      d8V.pageCoverage.pagesTargeted === pages.pages.length && Array.isArray(d8V.pageCoverage.uncoveredPages) && d8V.pageCoverage.uncoveredPages.length === 0 &&
      Array.isArray(d8V.rowsByArea) && d8V.rowsByArea.length === (geoV.features || []).length &&
      d8V.rowsByArea.reduce((a, x) => a + x.rows, 0) + Object.values(d8V.rowsByNonFeatureArea || {}).reduce((a, x) => a + x, 0) === areaTaggedV;
    check('I-9 published intent dataset v2 fields reconcile with the database (36-node frame, row sources with gscObservedRows=0, era-tagged evidence block, outcome roll-up + digest, full page coverage, per-area rows over all 53 GeoJSON features)',
      graphV.length === 36 && d8okV && covBadV.length === 0 && !!d6V && /pre-rebuild/.test(d6V.description),
      'nodes=' + graphV.length + '; coverage nodes bad=' + covBadV.length + '; d8 reconcile=' + d8okV +
        '; outcome digest=' + String(metaV.outcome_digest || '').slice(0, 12) + '…; areas=' + (d8V && d8V.rowsByArea ? d8V.rowsByArea.length : 0));
  } catch (e) {
    check('I-6..I-9 intent rubric v2 checks execute (fail-closed)', false, e.message);
  }

  // --- 14. Dataset discoverability — Batch Dataset Discoverability (2026-10-30; checks D-1..D-5) ---
  // Added in the same motion as the feature shipped (record:
  // out/verify-fix-2026-10-30-dataset-discoverability.md). The batch
  // closed the six gaps of the 2026-10-30 Dataset Search audit: every
  // published dataset gained a canonical landing page, and every
  // Dataset node estate-wide gained its landing url + unique sameAs,
  // an identifier, isAccessibleForFree, fully typed distributions and
  // a self-referencing DataDownload; the intent-coverage collection
  // and the signed master index carry the estate's Zenodo concept DOI
  // (10.5281/zenodo.23818766) as identifier. These checks assert the
  // invariants so a silent regression fails the suite.
  try {
    const SITE_D = 'https://theflatratemovers.com';
    const DOI_D = '10.5281/zenodo.23818766';
    const dsFilesD = DATASET_FILES.slice().sort();
    const landingOfD = (f) => SITE_D + '/datasets/' + f.replace(/^datasets-/, '').replace(/\.json$/, '') + '/';
    const dsNodesOfD = (doc) => ((doc && doc['@graph']) || []).filter((n) => n && n['@type'] === 'Dataset');
    // D-1: a landing page per dataset file — registry entry, per-page
    // JSON sealed in the served signed index, head-data entry.
    const servedIdxD = JSON.parse(await fetchText(SITE_D + '/ai-master-index.json'));
    const distD = new Set((servedIdxD.distribution || []).map((e) => e.contentUrl));
    const headSrcD = fs.readFileSync(path.join(PAGES_PUBLIC, '..', 'functions', 'head-data.js'), 'utf8');
    const HEADD = JSON.parse(headSrcD.replace(/^\/\/[^\n]*\n/gm, '').replace('export const HEAD = ', '').replace(/;\s*$/, ''));
    const pageUrlsD = new Set(pages.pages.map((p) => p.url));
    const landingsD = [SITE_D + '/datasets/', ...dsFilesD.map(landingOfD)];
    const d1bad = [];
    for (const u of landingsD) {
      const jf = u === SITE_D + '/datasets/' ? 'datasets.json' : 'dataset-' + u.split('/datasets/')[1].replace(/\//g, '') + '.json';
      if (!pageUrlsD.has(u)) d1bad.push(u + ' not in pages.json');
      if (!distD.has(SITE_D + '/' + jf)) d1bad.push(jf + ' not in signed index');
      if (!HEADD[u.replace(SITE_D, '').replace(/\/$/, '')]) d1bad.push(u + ' no head-data entry');
    }
    check('D-1 every published dataset file has a landing page (registry + per-page JSON in the signed index + head-data entry)',
      d1bad.length === 0, dsFilesD.length + ' dataset files, ' + landingsD.length + ' landing pages' + (d1bad.length ? ', bad: ' + d1bad.slice(0, 4).join('; ') : ''));
    // D-2: Dataset-node invariants in the dataset files + the shell.
    const id2fileD = {};
    const fileDocsD = {};
    for (const f of dsFilesD) {
      const d = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, f), 'utf8'));
      fileDocsD[f] = d;
      for (const n of dsNodesOfD(d)) if (n['@id']) id2fileD[n['@id']] = f;
    }
    const badNodesD = [];
    const checkNodeD = (n, src) => {
      const f = id2fileD[n['@id']];
      if (!f) { badNodesD.push(src + ' unmapped ' + n['@id']); return; }
      const L = landingOfD(f);
      if (n.url !== L) badNodesD.push(src + ' ' + n['@id'] + ' url');
      if (n.sameAs !== L) badNodesD.push(src + ' ' + n['@id'] + ' sameAs');
      const isIntentColl = f === 'datasets-intent-coverage.json' && String(n['@id']).includes('#dataset-intent-coverage-');
      const idOk = isIntentColl
        ? (n.identifier && n.identifier.propertyID === 'DOI' && n.identifier.value === DOI_D)
        : n.identifier === L;
      if (!idOk) badNodesD.push(src + ' ' + n['@id'] + ' identifier');
      if (n.isAccessibleForFree !== true) badNodesD.push(src + ' ' + n['@id'] + ' isAccessibleForFree');
      const dist = n.distribution || [];
      if (dist.some((e) => !e || e['@type'] !== 'DataDownload')) badNodesD.push(src + ' ' + n['@id'] + ' untyped distribution');
      if (!dist.some((e) => e && e.contentUrl === SITE_D + '/' + f)) badNodesD.push(src + ' ' + n['@id'] + ' no self download');
    };
    for (const f of dsFilesD) for (const n of dsNodesOfD(fileDocsD[f])) checkNodeD(n, f);
    const htmlD = fs.readFileSync(path.join(PAGES_PUBLIC, 'index.html'), 'utf8');
    let shellCountD = 0;
    for (const m of htmlD.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      let doc = null;
      try { doc = JSON.parse(m[1]); } catch (_) { doc = null; }
      const ns = doc ? (doc['@graph'] || [doc]) : [];
      for (const n of ns) if (n && n['@type'] === 'Dataset') { shellCountD++; checkNodeD(n, 'index.html'); }
    }
    check('D-2 every Dataset node (dataset files + index.html) carries landing url/unique sameAs, an identifier, isAccessibleForFree, typed distributions and a self-referencing DataDownload',
      badNodesD.length === 0, 'files + ' + shellCountD + ' shell instances' + (badNodesD.length ? ', bad: ' + badNodesD.slice(0, 4).join('; ') : ''));
    // D-3: local sitemap set == registry pages + dataset files.
    const localXmlD = fs.readFileSync(path.join(PAGES_PUBLIC, 'sitemap.xml'), 'utf8');
    const localUrlsD = new Set([...localXmlD.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim()));
    const expectedD = new Set([...pageUrlsD, ...dsFilesD.map((f) => SITE_D + '/' + f)]);
    const d3missing = [...expectedD].filter((u) => !localUrlsD.has(u));
    const d3extra = [...localUrlsD].filter((u) => !expectedD.has(u));
    check('D-3 local sitemap.xml URL set equals pages.json URLs plus the published dataset files',
      d3missing.length === 0 && d3extra.length === 0 && localUrlsD.size === expectedD.size,
      'local=' + localUrlsD.size + ', expected=' + expectedD.size +
      (d3missing.length ? ', missing: ' + d3missing.slice(0, 3).join(', ') : '') +
      (d3extra.length ? ', extra: ' + d3extra.slice(0, 3).join(', ') : ''));
    // D-4: site + machine entity graphs agree on Dataset-node fields.
    const gSiteD = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, 'entity-graph.json'), 'utf8'));
    const projD = (g) => {
      const o = {};
      const all = g ? [g, ...(g['@graph'] || [])] : [];
      for (const n of all) if (n && n['@type'] === 'Dataset') o[n['@id']] = [n.url, n.sameAs, typeof n.identifier === 'object' ? JSON.stringify(n.identifier) : n.identifier, n.isAccessibleForFree];
      return o;
    };
    const pSiteD = projD(gSiteD), pMacD = projD(graph);
    const d4bad = Object.keys(pSiteD).filter((k) => JSON.stringify(pSiteD[k]) !== JSON.stringify(pMacD[k]));
    check('D-4 site and machine entity graphs agree on every Dataset node landing url/sameAs/identifier',
      d4bad.length === 0 && Object.keys(pSiteD).length === Object.keys(pMacD).length && Object.keys(pSiteD).length > 0,
      'nodes=' + Object.keys(pSiteD).length + (d4bad.length ? ', bad: ' + d4bad.join(', ') : ''));
    // D-5: the DOI is live on the intent dataset + the landing page
    // serves its own title.
    const liveIntentD = JSON.parse(await fetchText(SITE_D + '/datasets-intent-coverage.json'));
    const collD = dsNodesOfD(liveIntentD).filter((n) => String(n['@id']).includes('#dataset-intent-coverage-'));
    const doiOkD = collD.length === 4 && collD.every((n) => n.identifier && n.identifier.propertyID === 'DOI' && n.identifier.value === DOI_D);
    const landingHtmlD = await fetchText(SITE_D + '/datasets/intent-coverage/');
    check('D-5 live intent-coverage dataset carries the Zenodo concept DOI on its collection nodes and its landing page serves its own title',
      doiOkD && landingHtmlD.includes('<title>The Flat Rate Movers — Search Intent Coverage Dataset</title>'),
      'collection nodes=' + collD.length + ', doi=' + doiOkD + ', own title served=' + landingHtmlD.includes('Search Intent Coverage Dataset'));
  } catch (e) {
    check('dataset discoverability checks (D-1..D-5) evaluated', false, e.message);
  }

  // --- 15. WebMCP agent tools — Batch WebMCP (2026-10-31; checks W-1..W-3).
  // The site shell registers seven read-only WebMCP tools (W3C WebMCP
  // draft) where a browser exposes document.modelContext, and both
  // on-page forms carry declarative WebMCP identification — the hero
  // form in markup (it transmits nothing by construction), the quote
  // form at runtime only, because its bytes are certificate-sealed.
  // The quote form is NEVER agent-submittable: no toolautosubmit exists
  // anywhere, and its submit handler refuses agent-invoked submits.
  // These checks assert the SERVED state plus a live execution of the
  // served registration script against a mock provider, so the layer
  // cannot silently fall out or rot. Record:
  // out/verify-fix-2026-10-31-webmcp.md.
  try {
    const vm = require('vm');
    const crypto = require('crypto');
    const fetchFullW = (url) => new Promise((resolve, reject) => {
      https.get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => { chunks.push(c); });
        res.on('end', () => resolve({ status: res.statusCode, buf: Buffer.concat(chunks) }));
      }).on('error', reject);
    });
    const WEBMCP_TOOLS = ['search_services', 'get_service', 'list_service_areas', 'find_dataset', 'search_intent', 'verify_certificate', 'get_quote_guidance'];
    const rootRes = await fetchFullW('https://theflatratemovers.com/');
    const servedHtml = rootRes.buf.toString('utf8');

    // W-1: the served shell carries the registration layer + all 7 tools.
    const missingTools = WEBMCP_TOOLS.filter((n) => !servedHtml.includes("name: '" + n + "'"));
    check('W-1 served shell registers the seven read-only WebMCP tools',
      rootRes.status === 200 && servedHtml.includes('document.modelContext') && missingTools.length === 0,
      'status=' + rootRes.status + ', tools present=' + (WEBMCP_TOOLS.length - missingTools.length) + '/7' + (missingTools.length ? ', missing: ' + missingTools.join(', ') : ''));

    // W-2: form disposition on the served bytes — hero form identified in
    // markup; no toolautosubmit anywhere; quote-form segment md5 canonical.
    const heroOk = /<form id="heroQuote"[^>]*toolname="start_flat_rate_quote"[^>]*tooldescription="/.test(servedHtml);
    const segM = servedHtml.match(/<form id="quoteForm"[\s\S]*?<\/form>/);
    const segMd5 = segM ? crypto.createHash('md5').update(segM[0], 'utf8').digest('hex') : 'segment-not-found';
    check('W-2 served forms: hero identified for agents, no toolautosubmit anywhere, quote-form segment md5 canonical',
      heroOk && !servedHtml.includes('toolautosubmit') && segMd5 === '4d8d49f05b22b129eac623a41370d9cb',
      'heroAnnotated=' + heroOk + ', toolautosubmit absent=' + !servedHtml.includes('toolautosubmit') + ', quote segment md5=' + segMd5);

    // W-3: execute the SERVED WebMCP script against a mock provider and
    // validate every captured descriptor: exact tool set, structurally
    // valid inputSchema (object type; every property typed + described;
    // required ⊆ properties) — the schema-validity audit's failure
    // modes — and read-only, non-consequential annotations.
    const blocks = [...servedHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    const wmBlock = blocks.find((b) => b.includes('WebMCP agent tools'));
    let w3ok = false, w3detail = 'WebMCP script block not found in served shell';
    if (wmBlock) {
      const captured = [];
      const sandbox = {
        document: {
          modelContext: { registerTool: (t) => { captured.push(t); return Promise.resolve(); } },
          getElementById: () => null,
        },
        navigator: {},
        fetch: () => Promise.reject(new Error('no network inside verify')),
        URLSearchParams,
        console,
      };
      vm.createContext(sandbox);
      vm.runInContext(wmBlock, sandbox);
      const problems = [];
      const gotNames = captured.map((t) => t.name).sort();
      if (JSON.stringify(gotNames) !== JSON.stringify([...WEBMCP_TOOLS].sort())) problems.push('tool set mismatch: ' + gotNames.join(','));
      for (const t of captured) {
        const s = t.inputSchema || {};
        if (s.type !== 'object' || !s.properties || typeof s.properties !== 'object') { problems.push(t.name + ': inputSchema not an object schema'); continue; }
        for (const [k, pr] of Object.entries(s.properties)) {
          if (!pr.type) problems.push(t.name + '.' + k + ': missing type');
          if (!pr.description) problems.push(t.name + '.' + k + ': missing description');
        }
        for (const r of s.required || []) if (!(r in s.properties)) problems.push(t.name + ': required not in properties: ' + r);
        if (!t.annotations || t.annotations.readOnlyHint !== true) problems.push(t.name + ': readOnlyHint not true');
        if (!t.annotations || t.annotations.consequentialHint !== false) problems.push(t.name + ': consequentialHint not false');
        if (typeof t.execute !== 'function') problems.push(t.name + ': execute missing');
        if (!t.description || t.description.length < 40) problems.push(t.name + ': description too thin');
      }
      w3ok = problems.length === 0 && captured.length === WEBMCP_TOOLS.length;
      w3detail = 'registered=' + captured.length + (problems.length ? ', problems: ' + problems.join('; ') : ', all descriptors valid');
    }
    check('W-3 served WebMCP descriptors execute and validate (schema + read-only annotations)', w3ok, w3detail);
  } catch (e) {
    check('WebMCP checks (W-1..W-3) evaluated', false, e.message);
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
