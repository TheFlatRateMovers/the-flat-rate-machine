// Flat Rate Machine — Phase 0 migration verifier (Node, no dependencies).
// Proves the migrated data is identical to the verified live sources.
//   node verify.js        (run from the-flat-rate-machine/)
//   node verify.js --local   (Speed S1 fast tier: every check whose
//     evidence is on disk; the live-only checks are SKIPPED and printed
//     by name. A build-iteration aid only — NEVER the closing gate;
//     batches close on the full run above.)
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
// Speed S1 tiered verification (2026-11-01): in --local mode the checks
// whose evidence is the served estate (fetched pages, the served signed
// index, GitHub-served copies) do not run; each is reported by name via
// skipLive — named and counted, never silently dropped. A check that
// mixes local and live evidence is live-only as a whole (its logic is
// never split). Full mode is unchanged and remains the only closing
// gate; the local summary says so in plain words.
const LOCAL = process.argv.includes('--local');
const skippedLive = [];
function skipLive(name) {
  skippedLive.push(name);
  console.log('SKIP  ' + name + ' — live-only (evidence is the served estate; not run in --local mode)');
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
  if (LOCAL) {
    skipLive('live sitemap fetched');
    skipLive('every pages.json URL is in the live sitemap');
    skipLive('every live sitemap URL is a registry page or a published dataset file');
    skipLive('live sitemap URL count matches registry + dataset files');
  }
  let liveUrls = null;
  if (!LOCAL) {
    try {
      const xml = await fetchText(LIVE_SITEMAP);
      liveUrls = new Set([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim()));
      check('live sitemap fetched', liveUrls.size > 0, liveUrls.size + ' URLs');
    } catch (e) {
      check('live sitemap fetched', false, e.message);
    }
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
  if (LOCAL) {
    skipLive('data service-area.geojson matches live GeoJSON (feature count + names)');
  } else {
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
  if (LOCAL) {
    skipLive('old container .json URL returns application/json with Service #service-transloading + its WebPage node (standalone per-page JSON, Batch 3)');
    skipLive('Martinsburg transloading .json URL returns application/json (real per-page JSON)');
  } else {
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
  if (LOCAL) {
    skipLive('P-1 well-known signing-keys.json live (200 + application/json) with the expected Ed25519 kid');
    skipLive('P-2 ai-master-index.jws verifies against the published key over the canonical served index');
    skipLive('P-3 all site-served distribution digests match the live served bytes');
    skipLive('P-4 every served index distribution entry is complete (name, contentUrl, encodingFormat, license, dateModified, SHA-256 digest + byteSize)');
    skipLive('P-5 certificate covers all 212 per-page JSONs + all 212 route documents + llms-full.txt + the site shell + the deployed code sets (498 distributions)');
    skipLive('P-6 all repo-served distribution digests match the live served bytes');
  } else {
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
    // Extended by Batch Blog N5N6 Live, 2026-10-31 (same motion):
    // totals move to 204 per-page JSON files and 259 distributions
    // (42 data + 204 pages + 13 shell/code — the two new guide posts,
    // transloading-vs-cross-docking-vs-deconsolidation and
    // moving-an-office-inside-a-plant-or-warehouse, join the page set
    // under the owner's standing blog authorization of 2026-10-31, and
    // datasets-intent-coverage.json is regenerated under generator
    // v2.0.0 + re-sealed in the same batch). The assertion stays
    // exact-count. Record: out/verify-fix-2026-10-31-blog-n5n6.md.
    // Extended by Batch Blog JOB1 Live, 2026-10-31 (same motion):
    // totals move to 205 per-page JSON files and 260 distributions
    // (42 data + 205 pages + 13 shell/code — the blog program's first
    // job story, 1650-lb-gun-safe-delivered-and-installed-moorefield-wv,
    // joins the page set under the owner's standing blog authorization
    // of 2026-10-31, and datasets-intent-coverage.json is regenerated
    // under generator v2.0.0 + re-sealed in the same batch). The
    // assertion stays exact-count. Record:
    // out/verify-fix-2026-10-31-blog-job1.md.
    // Extended by Batch Per-Route Shell (Solution A) Live, 2026-10-31
    // (same motion): the single SPA shell is replaced by 205 generated
    // per-route documents, each sealed as its own distribution at its
    // canonical URL, plus llms-full.txt, plus four new code files
    // (scripts/build-routes.js, scripts/build-llms-full.js,
    // scripts/route-assets/main.js, scripts/route-assets/webmcp.js —
    // the generator and the adapted script sources every route
    // document carries). Totals move to 470 distributions (42 data +
    // 205 per-page JSONs + 205 route documents + 1 llms-full.txt +
    // 17 shell/code). The assertion stays exact-count and GAINS the
    // route-document coverage assertion: every registry URL must have
    // a distribution at its canonical URL. Record:
    // out/verify-fix-2026-10-31-per-route-shell.md.
    // Extended by Retrieval Machine Build B1 (search-index dataset),
    // 2026-10-31 (same motion): datasets-search-index.json ships as a
    // published dataset file with its landing page
    // /datasets/search-index/ (registry 205 -> 206 pages), its per-page
    // JSON dataset-search-index.json, its generated route document,
    // and its generator scripts/build-search-index.js as a sealed code
    // distribution. Totals move to 474 distributions (43 data +
    // 206 per-page JSONs + 206 route documents + 1 llms-full.txt +
    // 18 shell/code). The assertion stays exact-count. Record:
    // out/verify-fix-2026-10-31-search-index.md.
    // Extended by Retrieval Machine Build B2 (answer-evidence
    // dataset), 2026-10-31 (same motion): datasets-answer-evidence.json
    // ships as a published dataset file with its landing page
    // /datasets/answer-evidence/ (registry 206 -> 207 pages), its
    // per-page JSON dataset-answer-evidence.json, its generated route
    // document, and its generator scripts/build-answer-evidence.js as
    // a sealed code distribution. Totals move to 478 distributions
    // (44 data + 207 per-page JSONs + 207 route documents + 1
    // llms-full.txt + 19 shell/code). The assertion stays exact-count.
    // Record: out/verify-fix-2026-10-31-answer-evidence.md.
    // Extended by Retrieval Machine Build B3 (local-graph registry
    // dataset), 2026-10-31 (same motion): datasets-local-graph-
    // registry.json ships as a published dataset file with its
    // landing page /datasets/local-graph-registry/ (registry 207 ->
    // 208 pages), its per-page JSON dataset-local-graph-registry.
    // json, its generated route document, and its generator
    // scripts/build-local-graph.js as a sealed code distribution.
    // Totals move to 482 distributions (45 data + 208 per-page
    // JSONs + 208 route documents + 1 llms-full.txt + 20 shell/code).
    // The assertion stays exact-count. Record:
    // out/verify-fix-2026-10-31-local-graph-registry.md.
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
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/scripts/build-routes.js',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/scripts/build-llms-full.js',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/scripts/build-search-index.js',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/scripts/build-answer-evidence.js',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/scripts/build-local-graph.js',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/scripts/build-crawl-presence.js',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/scripts/build-archive-registry.js',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/scripts/route-assets/main.js',
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/scripts/route-assets/webmcp.js',
    ];
    let p5detail = '', p5ok = false;
    try {
      const pubDir = path.join(path.resolve(ROOT, '..', 'the-flat-rate-movers-pages'), 'public');
      const nonPage = new Set(['ai-master-index.json', 'ai-sitemap.json', 'entity-graph.json', 'best-json-entity-graph.json', 'ai-catalog.json', 'ai-verification-report-2026-11-01.json', 'ai-verification-report-2026-11-01-e6b2.json']);
      const pageFiles = fs.readdirSync(pubDir).filter((f) => f.endsWith('.json') && !nonPage.has(f) && !f.startsWith('datasets-')).sort();
      const distUrls = new Set((servedIndex.distribution || []).map((e) => e.contentUrl));
      const missingPages = pageFiles.filter((f) => !distUrls.has('https://theflatratemovers.com/' + f));
      const missingCode = P2_CODE_URLS.filter((u) => !distUrls.has(u));
      const missingRoutes = pages.pages.map((p) => p.url).filter((u) => !distUrls.has(u));
      const hasLlmsFull = distUrls.has('https://theflatratemovers.com/llms-full.txt');
      p5ok = !!servedIndex && pageFiles.length === 212 && missingPages.length === 0 && missingCode.length === 0 &&
        missingRoutes.length === 0 && hasLlmsFull &&
        (servedIndex.distribution || []).length === 498;
      p5detail = 'pageFiles=' + pageFiles.length + ', missingPages=' + (missingPages.join(',') || '0') +
        ', missingCode=' + (missingCode.join(',') || '0') + ', missingRoutes=' + (missingRoutes.slice(0, 3).join(',') || '0') +
        ', llmsFull=' + hasLlmsFull + ', distributions=' + (servedIndex ? (servedIndex.distribution || []).length : 0);
    } catch (e) { p5ok = false; p5detail = e.message; }
    check('P-5 certificate covers all 212 per-page JSONs + all 212 route documents + llms-full.txt + the site shell + the deployed code sets (498 distributions)',
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
    for (const route of LOCAL ? [] : routeSet) {
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
    if (LOCAL) skipLive('S-3 live routes serve their own head (title + canonical + page JSON-LD + per-page JSON) on the defined route set');
    else check('S-3 live routes serve their own head (title + canonical + page JSON-LD + per-page JSON) on the defined route set',
      s3bad.length === 0, routeSet.length + ' routes' + (s3bad.length ? ', bad: ' + s3bad.join(', ') : ''));
    // S-4: sitemap lastmod sanity — format, real dates, not in the future,
    // not one blanket date.
    if (LOCAL) {
      skipLive('S-4 live sitemap lastmod values are real per-URL dates (valid format, 2026-10-28..today ET, not one blanket date)');
    } else {
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
    }
    // S-5: robots.txt carries the explicit AI-crawler groups.
    if (LOCAL) {
      skipLive('S-5 live robots.txt states explicit Allow groups for the 16 AI crawlers + wildcard + sitemap + llms.txt reference');
    } else {
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
    const servedIdxI = LOCAL ? null : JSON.parse(await fetchText('https://theflatratemovers.com/ai-master-index.json'));
    const distUrlsI = new Set(servedIdxI ? (servedIdxI.distribution || []).map((e) => e.contentUrl) : []);
    const missingI = new Set();
    for (const r of rowsI) {
      if (!distUrlsI.has(r.target_json)) missingI.add(r.target_json);
      for (const f of JSON.parse(r.dataset_ids)) {
        const u = 'https://theflatratemovers.com/' + f;
        if (!distUrlsI.has(u)) missingI.add(u);
      }
    }
    if (LOCAL) skipLive('I-3 every intent row target JSON and backing dataset is a distribution in the served signed index');
    else check('I-3 every intent row target JSON and backing dataset is a distribution in the served signed index',
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
    const liveDsRes = LOCAL ? null : await fetchFullI('https://theflatratemovers.com/datasets-intent-coverage.json');
    let liveD8 = null;
    if (liveDsRes) { try { liveD8 = (JSON.parse(liveDsRes.buf.toString('utf8'))['@graph'] || []).find((n) => n['@id'] === 'https://theflatratemovers.com/#dataset-intent-coverage-totals'); } catch (_) { liveD8 = null; } }
    if (LOCAL) skipLive('I-5 live datasets-intent-coverage.json serves application/json with the rubric.db row digest');
    else check('I-5 live datasets-intent-coverage.json serves application/json with the rubric.db row digest',
      liveDsRes.status === 200 && liveDsRes.ct.includes('application/json') && !!liveD8 && liveD8.intentRowsDigest === metaI.rows_digest,
      'status=' + liveDsRes.status + ', content-type=' + liveDsRes.ct + ', digest match=' + (liveD8 ? liveD8.intentRowsDigest === metaI.rows_digest : 'unparseable'));
  } catch (e) {
    check('intent-coverage rubric checks (I-1..I-5) evaluated', false, e.message);
  }

  // --- 13c. Intent landing per-page JSON sync (Batch Intent Landing
  // Fix, 2026-11-01; check I-10) ---
  // The intent landing's per-page JSON (dataset-intent-coverage.json)
  // is a batch-authored artifact with no standing generator; its
  // @graph[0] description is a copy of the dataset file's @graph[0]
  // description and went stale at v1 (1,218 rows / 167 pages) while
  // build-intent-rubric.js regenerated the dataset file through v2.
  // I-10 pins the copy to its source so the divergence cannot recur
  // silently: descriptions byte-equal, the per-page node's
  // dateModified no older than the dataset file's, and neither stale
  // figure present anywhere in the per-page JSON. Record:
  // out/verify-fix-2026-11-01-intent-landing-sync.md.
  try {
    const pubDirJ = path.resolve(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
    const ppRawJ = fs.readFileSync(path.join(pubDirJ, 'dataset-intent-coverage.json'), 'utf8');
    const ppJ = JSON.parse(ppRawJ);
    const dsJ = JSON.parse(fs.readFileSync(path.join(pubDirJ, 'datasets-intent-coverage.json'), 'utf8'));
    const pp0 = (ppJ['@graph'] || [])[0] || {};
    const ds0 = (dsJ['@graph'] || [])[0] || {};
    const staleJ = /1218 generated rows|167 pages/.test(ppRawJ);
    check('I-10 intent landing per-page JSON @graph[0] description equals the dataset file @graph[0] description (sync pinned; no stale v1 figures)',
      !!pp0.description && pp0.description === ds0.description &&
      String(pp0.dateModified || '') >= String(ds0.dateModified || '') && !staleJ,
      'desc equal=' + (pp0.description === ds0.description) + ', per-page dateModified=' + pp0.dateModified + ', dataset dateModified=' + ds0.dateModified + ', stale text present=' + staleJ);
  } catch (e) {
    check('intent landing per-page JSON sync check (I-10) evaluated', false, e.message);
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
    check('I-9 published intent dataset v2 fields reconcile with the database (37-node frame, row sources with gscObservedRows=0, era-tagged evidence block, outcome roll-up + digest, full page coverage, per-area rows over all 53 GeoJSON features)',
      graphV.length === 37 && d8okV && covBadV.length === 0 && !!d6V && /pre-rebuild/.test(d6V.description),
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
    const servedIdxD = LOCAL ? null : JSON.parse(await fetchText(SITE_D + '/ai-master-index.json'));
    const distD = new Set(servedIdxD ? (servedIdxD.distribution || []).map((e) => e.contentUrl) : []);
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
    if (LOCAL) skipLive('D-1 every published dataset file has a landing page (registry + per-page JSON in the signed index + head-data entry)');
    else check('D-1 every published dataset file has a landing page (registry + per-page JSON in the signed index + head-data entry)',
      d1bad.length === 0, dsFilesD.length + ' dataset files, ' + landingsD.length + ' landing pages' + (d1bad.length ? ', bad: ' + d1bad.slice(0, 4).join('; ') : ''));
    // D-2: Dataset-node invariants in the dataset files + the shell.
    // Re-expressed by Batch Per-Route Shell (Solution A) Live,
    // 2026-10-31 (same motion): the single shell's page divs now ship
    // as 205 generated route documents, so the scan covers every
    // route document in the deploy tree, excluding the two baked head
    // scripts (#page-jsonld and the data-page-json script) — exactly
    // the population the old single-shell scan saw, since the old
    // local shell carried those slots empty/absent. The re-expression
    // is stricter: it also PINS the instance total at the pre-split
    // count (304), which the old check only reported, and asserts the
    // scanned document count is the full route set (205), so a
    // dropped or duplicated block now fails. Record:
    // out/verify-fix-2026-10-31-per-route-shell.md.
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
      // Identifier form re-expressed by Batch 4a Catalog Checks
      // (2026-10-31, same motion): the intent collection nodes now
      // carry the concept DOI in URL form, so the assertion is exact
      // string equality — stricter than the PropertyValue field
      // match it replaces. Record:
      // out/verify-fix-2026-10-31-catalog-checks.md.
      const idOk = isIntentColl
        ? n.identifier === 'https://doi.org/' + DOI_D
        : n.identifier === L;
      if (!idOk) badNodesD.push(src + ' ' + n['@id'] + ' identifier');
      if (n.isAccessibleForFree !== true) badNodesD.push(src + ' ' + n['@id'] + ' isAccessibleForFree');
      const dist = n.distribution || [];
      if (dist.some((e) => !e || e['@type'] !== 'DataDownload')) badNodesD.push(src + ' ' + n['@id'] + ' untyped distribution');
      if (!dist.some((e) => e && e.contentUrl === SITE_D + '/' + f)) badNodesD.push(src + ' ' + n['@id'] + ' no self download');
    };
    for (const f of dsFilesD) for (const n of dsNodesOfD(fileDocsD[f])) checkNodeD(n, f);
    const routeDocsD = [];
    (function walkD(d, rel) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const r = rel ? rel + '/' + e.name : e.name;
        if (e.isDirectory()) walkD(path.join(d, e.name), r);
        else if (e.isFile() && e.name === 'index.html') routeDocsD.push(r);
      }
    })(PAGES_PUBLIC, '');
    let shellCountD = 0;
    for (const rel of routeDocsD) {
      const htmlD = fs.readFileSync(path.join(PAGES_PUBLIC, rel), 'utf8');
      for (const m of htmlD.matchAll(/<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g)) {
        if (m[1].includes('id="page-jsonld"') || m[1].includes('data-page-json=')) continue;
        let doc = null;
        try { doc = JSON.parse(m[2]); } catch (_) { doc = null; }
        const ns = doc ? (doc['@graph'] || [doc]) : [];
        for (const n of ns) if (n && n['@type'] === 'Dataset') { shellCountD++; checkNodeD(n, rel); }
      }
    }
    check('D-2 every Dataset node (dataset files + all 212 route documents) carries landing url/unique sameAs, an identifier, isAccessibleForFree, typed distributions and a self-referencing DataDownload',
      badNodesD.length === 0 && shellCountD === 362 && routeDocsD.length === 212,
      'files + ' + shellCountD + ' route-document instances across ' + routeDocsD.length + ' documents' + (badNodesD.length ? ', bad: ' + badNodesD.slice(0, 4).join('; ') : ''));
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
    // serves its own title. Identifier form re-expressed by Batch
    // 4a Catalog Checks (2026-10-31, same motion): URL-form string
    // equality, as in D-2. Record:
    // out/verify-fix-2026-10-31-catalog-checks.md.
    const liveIntentD = LOCAL ? null : JSON.parse(await fetchText(SITE_D + '/datasets-intent-coverage.json'));
    const collD = liveIntentD ? dsNodesOfD(liveIntentD).filter((n) => String(n['@id']).includes('#dataset-intent-coverage-')) : [];
    const doiOkD = collD.length === 4 && collD.every((n) => n.identifier === 'https://doi.org/' + DOI_D);
    const landingHtmlD = LOCAL ? '' : await fetchText(SITE_D + '/datasets/intent-coverage/');
    if (LOCAL) skipLive('D-5 live intent-coverage dataset carries the Zenodo concept DOI on its collection nodes and its landing page serves its own title');
    else check('D-5 live intent-coverage dataset carries the Zenodo concept DOI on its collection nodes and its landing page serves its own title',
      doiOkD && landingHtmlD.includes('<title>The Flat Rate Movers — Search Intent Coverage Dataset</title>'),
      'collection nodes=' + collD.length + ', doi=' + doiOkD + ', own title served=' + landingHtmlD.includes('Search Intent Coverage Dataset'));
  } catch (e) {
    check('dataset discoverability checks (D-1..D-5) evaluated', false, e.message);
  }

  // --- 15. WebMCP agent tools — Batch WebMCP (2026-10-31; checks W-1..W-3;
  // W-4 added by Batch WebMCP Schema Fix, 2026-10-31).
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
  if (LOCAL) {
    skipLive('W-1 served shell registers the seven read-only WebMCP tools');
    skipLive('W-2 served forms: hero identified for agents, no toolautosubmit anywhere, quote-form segment md5 canonical');
    skipLive('W-3 served WebMCP descriptors execute and validate (schema + read-only annotations)');
    skipLive('W-4 served WebMCP annotation never exposes a half-annotated connected form (schema-issue mechanism)');
    skipLive('W-5 quote-form chip groups, hero heavy group, per-type sections and delegated binding on the served bytes');
  } else {
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
    // Batch Per-Route Shell (Solution A) Live, 2026-10-31: the quote
    // form now lives in the quote route document, so W-2 fetches that
    // document too (see the W-2 re-expression note below).
    const quoteRes = await fetchFullW('https://theflatratemovers.com/quote/');
    const quoteHtml = quoteRes.buf.toString('utf8');

    // W-1: the served shell carries the registration layer + all 7 tools.
    const missingTools = WEBMCP_TOOLS.filter((n) => !servedHtml.includes("name: '" + n + "'"));
    check('W-1 served shell registers the seven read-only WebMCP tools',
      rootRes.status === 200 && servedHtml.includes('document.modelContext') && missingTools.length === 0,
      'status=' + rootRes.status + ', tools present=' + (WEBMCP_TOOLS.length - missingTools.length) + '/7' + (missingTools.length ? ', missing: ' + missingTools.join(', ') : ''));

    // W-2: form disposition on the served bytes — hero form identified in
    // markup; no toolautosubmit anywhere; quote-form segment md5 canonical.
    // Re-expressed by Batch Per-Route Shell (Solution A) Live, 2026-10-31:
    // under the per-route architecture the quote form is served by the
    // quote route document, not the home document, so the segment is
    // asserted there (same canonical md5), the hero assertions stay on
    // the served home document, and the toolautosubmit absence is now
    // asserted on BOTH documents — the same property, proved at least
    // as strictly. Record: out/verify-fix-2026-10-31-per-route-shell.md.
    const heroOk = /<form id="heroQuote"[^>]*toolname="start_flat_rate_quote"[^>]*tooldescription="/.test(servedHtml);
    // Re-expressed by Batch Quote-Form Fixes, 2026-11-01: the quote
    // form's markup changed (hero heavy group added on the home
    // document; project types expanded to 20 with five conditional
    // per-type sections on the quote form), so the canonical segment
    // md5 moved to the value below. The property asserted is the same
    // and is now kept company by W-5, which pins the new form
    // structure to the served bytes. Record:
    // out/verify-fix-2026-11-01-quote-form-fixes.md.
    const segM = quoteHtml.match(/<form id="quoteForm"[\s\S]*?<\/form>/);
    const segMd5 = segM ? crypto.createHash('md5').update(segM[0], 'utf8').digest('hex') : 'segment-not-found';
    check('W-2 served forms: hero identified for agents, no toolautosubmit anywhere, quote-form segment md5 canonical',
      heroOk && quoteRes.status === 200 && !servedHtml.includes('toolautosubmit') && !quoteHtml.includes('toolautosubmit') && segMd5 === '23d1825f2f5c87ff519e60bba628805d',
      'heroAnnotated=' + heroOk + ', quote doc status=' + quoteRes.status + ', toolautosubmit absent (home+quote)=' + (!servedHtml.includes('toolautosubmit') && !quoteHtml.includes('toolautosubmit')) + ', quote segment md5=' + segMd5);

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

    // W-4: the annotation MECHANISM (Batch WebMCP Schema Fix, 2026-10-31).
    // Chrome validates a declarative form's WebMCP annotation per
    // attribute change and files a permanent DevTools issue for any
    // half-annotated state it observes on the CONNECTED form (toolname
    // present, tooldescription not yet); the Lighthouse schema-validity
    // audit fails on that filed issue even though both attributes land
    // one statement apart, because the audit reads the browser's
    // Audits.issueAdded stream, not the final DOM (Lighthouse sources:
    // core/audits/webmcp-schema-validity.js consumes the
    // WebMcpSchemaIssues artifact; core/gather/gatherers/webmcp-schema.js
    // appends GenericIssue events and never retracts). The fix annotates
    // #quoteForm while it is DETACHED and reinserts the same node, so
    // the connected form is only ever observed fully annotated — the
    // markup-annotated hero form's proven-clean case. This check
    // executes the SERVED script against an instrumented fake DOM that
    // records every attribute state observable while the form is
    // connected, and fails if any connected snapshot carries exactly
    // one of the pair, if the detach/annotate/reinsert ordering is
    // absent, or if the form does not end connected and fully annotated
    // with every field named and described. Record:
    // out/verify-fix-2026-10-31-webmcp-schema.md.
    let w4ok = false, w4detail = 'WebMCP script block not found in served shell';
    if (wmBlock) {
      const connectedSnapshots = [];
      const ops4 = [];
      const fields4 = [];
      const makeField4 = (id, labelText) => {
        const el = {
          id, _attrs: {},
          getAttribute(k) { return k in this._attrs ? this._attrs[k] : null; },
          setAttribute(k, v) { this._attrs[k] = v; },
          closest() { return this._label; },
        };
        el._label = { childNodes: [{ nodeType: 3, textContent: labelText }, el], textContent: labelText };
        return el;
      };
      const form4 = {
        _attrs: {}, connected: true, parentNode: null, nextSibling: { _anchor: true },
        getAttribute(k) { return k in this._attrs ? this._attrs[k] : null; },
        setAttribute(k, v) {
          this._attrs[k] = v;
          ops4.push('form:set:' + k);
          if (this.connected) connectedSnapshots.push({ toolname: this._attrs.toolname || null, tooldescription: this._attrs.tooldescription || null });
        },
        querySelectorAll() { return fields4; },
      };
      form4.parentNode = {
        removeChild(f) { ops4.push('removeChild'); f.connected = false; },
        insertBefore(f) { ops4.push('insertBefore'); f.connected = true; },
      };
      fields4.push(makeField4('fromCity', 'Moving from'), makeField4('email', 'Email *'), makeField4('notes', 'Notes'));
      const captured4 = [];
      const sandbox4 = {
        document: {
          modelContext: { registerTool: (t) => { captured4.push(t); return Promise.resolve(); } },
          getElementById: (id) => (id === 'quoteForm' ? form4 : null),
        },
        navigator: {},
        fetch: () => Promise.reject(new Error('no network inside verify')),
        URLSearchParams,
        console,
      };
      vm.createContext(sandbox4);
      vm.runInContext(wmBlock, sandbox4);
      const half4 = connectedSnapshots.filter((s) => (!!s.toolname) !== (!!s.tooldescription));
      const detachIdx = ops4.indexOf('removeChild');
      const reinsertIdx = ops4.indexOf('insertBefore');
      const orderingOk = detachIdx >= 0 && reinsertIdx > detachIdx &&
        ops4.slice(detachIdx + 1, reinsertIdx).some((o) => o.startsWith('form:set:')) &&
        !ops4.slice(0, detachIdx).some((o) => o.startsWith('form:set:'));
      const fieldsOk4 = fields4.every((f) => f._attrs.name === f.id && !!f._attrs.toolparamdescription);
      w4ok = captured4.length === WEBMCP_TOOLS.length && half4.length === 0 && orderingOk &&
        form4.connected === true && form4._attrs.toolname === 'request_flat_rate_quote' &&
        !!form4._attrs.tooldescription && fieldsOk4;
      w4detail = 'tools registered=' + captured4.length + ', half-annotated connected states=' + half4.length +
        ', detach/annotate/reinsert ordering=' + orderingOk + ', ends connected+annotated=' +
        (form4.connected === true && form4._attrs.toolname === 'request_flat_rate_quote' && !!form4._attrs.tooldescription) +
        ', fields named+described=' + fieldsOk4;
    }
    check('W-4 served WebMCP annotation never exposes a half-annotated connected form (schema-issue mechanism)', w4ok, w4detail);

    // W-5: quote-form chip groups + conditional per-type sections on
    // the served bytes (Batch Quote-Form Fixes, 2026-11-01; record:
    // out/verify-fix-2026-11-01-quote-form-fixes.md). The form's heavy
    // chips failed live because their binding lived in another page's
    // init; these assertions pin the fixed structure to the SERVED
    // documents so the failure class cannot silently return: every
    // pick group present with its full button set, the hero Short
    // form carrying its own heavy group, the five per-type sections
    // present with their data-types, every conditional-section
    // control present, and the delegated single-handler binding
    // present in the served script.
    const pickCount = (html, id) => { const m = html.match(new RegExp('<div class="pick" id="' + id + '">([\\s\\S]*?)</div>')); return m ? (m[1].match(/<button/g) || []).length : -1; };
    const w5problems = [];
    if (pickCount(quoteHtml, 'heavyPick') !== 6) w5problems.push('quote heavyPick buttons=' + pickCount(quoteHtml, 'heavyPick'));
    if (pickCount(quoteHtml, 'projectPick') !== 20) w5problems.push('quote projectPick buttons=' + pickCount(quoteHtml, 'projectPick'));
    if (pickCount(quoteHtml, 'servicesPick') !== 7) w5problems.push('quote servicesPick buttons=' + pickCount(quoteHtml, 'servicesPick'));
    if (pickCount(servedHtml, 'heroHeavyPick') !== 6) w5problems.push('hero heroHeavyPick buttons=' + pickCount(servedHtml, 'heroHeavyPick'));
    for (const sec of ['ptResidential', 'ptHeavy', 'ptAccess', 'ptExport', 'ptFreight']) {
      if (!quoteHtml.includes('id="' + sec + '" data-types="')) w5problems.push('section ' + sec + ' missing data-types');
    }
    for (const cid of ['qInvBedrooms', 'qInvLiving', 'qInvDining', 'qInvKitchens', 'qInvBathrooms', 'qInvOffice', 'qInvGarage', 'qInvBasement', 'qInvLoft', 'qInvPatio', 'qInvStorage', 'qExportDest', 'qExportItems', 'qFreightSituation', 'qFreightLoad']) {
      if (!quoteHtml.includes('id="' + cid + '"')) w5problems.push('control ' + cid + ' missing');
    }
    if (!quoteHtml.includes('__pickBound')) w5problems.push('delegated pick binding missing from served script');
    if (!quoteHtml.includes('refreshProjectSections')) w5problems.push('refreshProjectSections missing from served script');
    check('W-5 quote-form chip groups, hero heavy group, per-type sections and delegated binding on the served bytes',
      w5problems.length === 0,
      w5problems.length ? w5problems.join('; ') : 'heavyPick=6, projectPick=20, servicesPick=7, heroHeavyPick=6, 5 ptype sections with data-types, 15 conditional controls, delegated binding present');
  } catch (e) {
    check('WebMCP checks (W-1..W-5) evaluated', false, e.message);
  }
  }

  // --- 16. llms-full.txt — Batch Per-Route Shell (Solution A) Live,
  // 2026-10-31 (checks L-1..L-4, added in the same motion as the file
  // shipped; record: out/verify-fix-2026-10-31-per-route-shell.md).
  // llms-full.txt is the estate's full-text companion to llms.txt,
  // generated from the same published sources by
  // scripts/build-llms-full.js and sealed as a distribution. These
  // checks assert its live presence, its seal, its llms.txt link, and
  // a content-integrity spot rule (the estate's two branch names and
  // all 29 service names present; no placeholder braces and none of
  // the invented-string patterns the gate exists to keep out).
  if (LOCAL) {
    skipLive('L-1 llms-full.txt is served live as a text file');
    skipLive('L-2 llms-full.txt is a sealed distribution in the signed index (digest matches the served bytes)');
    skipLive('L-3 llms.txt links llms-full.txt');
    skipLive('L-4 llms-full.txt content integrity (29 service names + both branch names present; no placeholders or invented strings)');
  } else {
  try {
    const crypto = require('crypto');
    const fetchFullL = (url) => new Promise((resolve, reject) => {
      https.get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => { chunks.push(c); });
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, buf: Buffer.concat(chunks) }));
      }).on('error', reject);
    });
    const fullRes = await fetchFullL('https://theflatratemovers.com/llms-full.txt');
    const fullText = fullRes.buf.toString('utf8');
    check('L-1 llms-full.txt is served live as a text file',
      fullRes.status === 200 && String(fullRes.headers['content-type'] || '').includes('text/plain'),
      'status=' + fullRes.status + ', content-type=' + (fullRes.headers['content-type'] || 'none') + ', bytes=' + fullRes.buf.length);
    const idxL = JSON.parse(await fetchText('https://theflatratemovers.com/ai-master-index.json'));
    const entryL = (idxL.distribution || []).find((e) => e.contentUrl === 'https://theflatratemovers.com/llms-full.txt');
    check('L-2 llms-full.txt is a sealed distribution in the signed index (digest matches the served bytes)',
      !!entryL && !!entryL.digest && entryL.digest.byteSize === fullRes.buf.length &&
      entryL.digest.value === crypto.createHash('sha256').update(fullRes.buf).digest('hex'),
      entryL ? 'digest=' + String(entryL.digest && entryL.digest.value || '').slice(0, 12) + '…, byteSize=' + (entryL.digest && entryL.digest.byteSize) : 'entry missing');
    const llmsTxtL = await fetchText('https://theflatratemovers.com/llms.txt');
    check('L-3 llms.txt links llms-full.txt', llmsTxtL.includes('https://theflatratemovers.com/llms-full.txt'),
      'link present=' + llmsTxtL.includes('https://theflatratemovers.com/llms-full.txt'));
    const missingSvcL = services.services.filter((s) => !fullText.includes(s.name)).map((s) => s.name);
    const forbiddenL = ['{{', '25,000 lbs', 'lifecycle logistics'].filter((x) => fullText.includes(x));
    check('L-4 llms-full.txt content integrity (29 service names + both branch names present; no placeholders or invented strings)',
      missingSvcL.length === 0 && fullText.includes('The Flat Rate Movers') && fullText.includes('Flat Rate Movers Martinsburg WV') && forbiddenL.length === 0,
      'missing services=' + (missingSvcL.join(', ') || '0') + ', forbidden present=' + (forbiddenL.join(', ') || '0'));
  } catch (e) {
    check('llms-full checks (L-1..L-4) evaluated', false, e.message);
  }
  }

  // --- 17. Machinery — Batch Reliability (2026-10-31; checks M-1..M-5) ---
  // verify.js §§1–16 prove the published estate; this section proves
  // the machinery that produces it (reliability design D1–D4): the
  // single paths registry resolves and the ingest tool carries no
  // path defaults of its own (D1/D2), the canonical repo-dir set is
  // complete against the sealed index, the seal self-reproduces from
  // its sources, no stale per-batch path literals survive in live
  // tooling, and the ingest's idempotency is armed (D3). Assertions
  // are computed by scripts/check-machinery.py (stdlib only), invoked
  // once here and mapped to M-1..M-5; a helper failure fails all five
  // with the error as detail.
  try {
    const { execFileSync } = require('child_process');
    let mres = null, merr = null;
    try {
      const outM = execFileSync('python3', [path.join(ROOT, 'scripts', 'check-machinery.py')], { maxBuffer: 64 * 1024 * 1024 }).toString();
      mres = JSON.parse(outM);
    } catch (e) {
      merr = e;
    }
    const mNames = {
      'M-1': 'M-1 paths registry resolves (every registered path exists; venv imports cryptography; ingest tool carries no path defaults of its own)',
      'M-2': 'M-2 canonical repo-dir set is complete against the sealed index (every GitHub-main distribution file matches its sealed digest + byteSize)',
      'M-3': 'M-3 the seal self-reproduces from its sources (digest-index over the sealed index reports zero gaps and reproduces every digest + byteSize)',
      'M-4': 'M-4 no stale per-batch path literals in live tooling (scripts/*.py, scripts/*.js, verify.js)',
      'M-5': 'M-5 ingest idempotency is armed (dedupe unique index present, zero NULL dedupe keys, run ledger exists)'
    };
    for (const idM of ['M-1', 'M-2', 'M-3', 'M-4', 'M-5']) {
      if (merr) check(mNames[idM], false, 'machinery helper failed: ' + merr.message);
      else if (mres && mres[idM]) check(mNames[idM], !!mres[idM].ok, mres[idM].detail || '');
      else check(mNames[idM], false, 'machinery helper returned no result for ' + idM);
    }
  } catch (e) {
    check('machinery checks (M-1..M-5) evaluated', false, e.message);
  }

  // --- 18. Search index dataset — Retrieval Machine Build B1 (2026-10-31; checks SI-1..SI-4) ---
  // Added in the same motion as the dataset shipped (record:
  // out/verify-fix-2026-10-31-search-index.md). datasets-search-index.json
  // is the standing dataset of the Retrieval Machine's search-index
  // element (Dossier 01 §5): query clusters x URL supply x standing
  // observations x era-tagged engine windows x competitor assets
  // (schema-barred from claim surfaces) x third-party records x gap
  // records. These checks assert the design's gates: the tables exist
  // and reconcile with the rubric database, every observation carries
  // its method + era + source (the generator rejects rows missing
  // them; SI-2 also proves the file regenerates byte-identical from
  // the live estate), the supply table reconciles 1:1 with the
  // registry and its digests equal the served signed index, and every
  // cluster target resolves inside the registry with the competitor
  // schema bar holding.
  try {
    const { execFileSync: execSI } = require('child_process');
    const regSI = JSON.parse(fs.readFileSync(path.join(ROOT, 'paths.json'), 'utf8'));
    const dsSI = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, 'datasets-search-index.json'), 'utf8'));
    const gSI = dsSI['@graph'] || [];
    const nodeSI = (suffix) => gSI.find((n) => String(n['@id']).endsWith(suffix));
    const clustersSI = (nodeSI('#dataset-search-index-clusters') || {}).queryClusters || [];
    const supplySI = (nodeSI('#dataset-search-index-supply') || {}).urlSupply || [];
    const obsSI = (nodeSI('#dataset-search-index-standing') || {}).standingObservations || [];
    const winSI = (nodeSI('#dataset-search-index-windows') || {}).engineWindows || [];
    const compSI = (nodeSI('#dataset-search-index-competitors') || {}).competitorAssets || [];
    const tpSI = (nodeSI('#dataset-search-index-third-party') || {}).thirdPartyRecords || [];
    const gapSI = (nodeSI('#dataset-search-index-gaps') || {}).gapRecords || [];
    const totSI = (nodeSI('#dataset-search-index-totals') || {}).totals || {};
    const dbRowsSI = Number(execSI('sqlite3', [regSI.rubric_db, 'SELECT COUNT(*) FROM intent_query']).toString().trim());
    const derivedRefsSI = clustersSI.filter((c) => c.clusterSource === 'rubric-derived')
      .reduce((a, c) => a + (c.rubricRowRefs || []).length, 0);
    check('SI-1 search-index dataset carries all seven tables and its totals reconcile with the rubric database',
      clustersSI.length > 0 && supplySI.length === pages.pages.length && obsSI.length > 0 && winSI.length > 0 &&
      compSI.length > 0 && tpSI.length > 0 && gapSI.length > 0 &&
      totSI.queryClusters === clustersSI.length && totSI.urlSupplyRows === supplySI.length &&
      totSI.standingObservations === obsSI.length && totSI.engineWindowQueries === winSI.length &&
      totSI.competitorAssets === compSI.length && totSI.thirdPartyRecords === tpSI.length &&
      totSI.gapRecords === gapSI.length && totSI.rubricRowsCovered === dbRowsSI && derivedRefsSI === dbRowsSI,
      'clusters=' + clustersSI.length + ', supply=' + supplySI.length + ', observations=' + obsSI.length +
      ', windows=' + winSI.length + ', competitors=' + compSI.length + ', thirdParty=' + tpSI.length +
      ', gaps=' + gapSI.length + ', dbRows=' + dbRowsSI + ', derivedRefs=' + derivedRefsSI);
    const badObsSI = obsSI.filter((o) => !o.method || !o.era || !o.sourceRef);
    let regenSI = false, regenDetailSI = '';
    try {
      execSI('node', [path.join(ROOT, 'scripts', 'build-search-index.js'), '--check'], { maxBuffer: 64 * 1024 * 1024 });
      regenSI = true;
    } catch (e) { regenDetailSI = String(e.message).slice(0, 160); }
    check('SI-2 every standing observation carries method + era + source, and the dataset regenerates byte-identical from the live estate',
      badObsSI.length === 0 && regenSI,
      'observations=' + obsSI.length + ', missingDiscipline=' + badObsSI.length + ', regenerated=' + regenSI + (regenDetailSI ? ', ' + regenDetailSI : ''));
    const SITE_SI = 'https://theflatratemovers.com';
    const servedIdxSI = LOCAL ? null : JSON.parse(await fetchText(SITE_SI + '/ai-master-index.json'));
    const distSI = new Map(servedIdxSI ? (servedIdxSI.distribution || []).map((e) => [e.contentUrl, e]) : []);
    const regUrlsSI = new Set(pages.pages.map((p) => p.url));
    const supplyUrlsSI = new Set(supplySI.map((s) => s.url));
    const digestBadSI = supplySI.filter((s) => {
      const e = distSI.get(SITE_SI + '/' + s.perPageJson);
      return !e || !e.digest || e.digest.value !== s.sealedDigest;
    });
    if (LOCAL) skipLive('SI-3 URL supply reconciles 1:1 with the page registry and every supply digest equals the served signed index digest for that per-page JSON');
    else check('SI-3 URL supply reconciles 1:1 with the page registry and every supply digest equals the served signed index digest for that per-page JSON',
      supplyUrlsSI.size === regUrlsSI.size && [...regUrlsSI].every((u) => supplyUrlsSI.has(u)) && digestBadSI.length === 0,
      'supply=' + supplySI.length + ', registry=' + regUrlsSI.size + ', digestMismatches=' + digestBadSI.length +
      (digestBadSI.length ? ' (' + digestBadSI.slice(0, 3).map((s) => s.perPageJson).join(', ') + ')' : ''));
    const claimFieldsSI = ['rating', 'aggregateRating', 'reviewCount', 'price', 'discount', 'endorsement', 'award', 'certification'];
    const barBadSI = compSI.filter((r) => claimFieldsSI.some((f) => Object.prototype.hasOwnProperty.call(r, f)));
    const targetBadSI = clustersSI.filter((c) => c.targetUrl !== null && !regUrlsSI.has(c.targetUrl));
    check('SI-4 every cluster target resolves inside the registry and the competitor schema bar holds (no claim fields in competitor records)',
      targetBadSI.length === 0 && barBadSI.length === 0,
      'clusters=' + clustersSI.length + ', badTargets=' + targetBadSI.length + ', barViolations=' + barBadSI.length);
  } catch (e) {
    check('search-index dataset checks (SI-1..SI-4) evaluated', false, e.message);
  }

  // --- 19. Answer-evidence dataset — Retrieval Machine Build B2 (2026-10-31; checks AE-1..AE-4) ---
  // Added in the same motion as the dataset shipped (record:
  // out/verify-fix-2026-10-31-answer-evidence.md).
  // datasets-answer-evidence.json is the standing dataset of the
  // Retrieval Machine's answer-engine evidence element (Dossier 02
  // section 5): rubric questions x answer fragments (text-hash drift
  // detection) x fragment coverage x engine profiles x citation
  // observations with METHOD as a first-class field x review
  // distribution snapshots (schema-barred) x gap records. These
  // checks assert the design's gates, including its honesty gate:
  // citation standing on the actual answer-engine UIs is UNMEASURED,
  // so AE-2 requires every observation to carry method + era +
  // prompt verbatim AND requires the prompt-panel / brave-serp /
  // console observation counts to be exactly zero — a manufactured
  // panel row fails the suite. AE-3 proves every fragment's evidence
  // digests equal the served signed index and every text hash
  // recomputes from its text.
  try {
    const { execFileSync: execAE } = require('child_process');
    const cryptoAE = require('crypto');
    const regAE = JSON.parse(fs.readFileSync(path.join(ROOT, 'paths.json'), 'utf8'));
    const dsAE = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, 'datasets-answer-evidence.json'), 'utf8'));
    const gAE = dsAE['@graph'] || [];
    const nodeAE = (suffix) => gAE.find((n) => String(n['@id']).endsWith(suffix));
    const questionsAE = (nodeAE('#dataset-answer-evidence-questions') || {}).questions || [];
    const fragmentsAE = (nodeAE('#dataset-answer-evidence-fragments') || {}).answerFragments || [];
    const coverageAE = (nodeAE('#dataset-answer-evidence-coverage') || {}).fragmentCoverage || {};
    const profilesAE = (nodeAE('#dataset-answer-evidence-profiles') || {}).engineProfiles || [];
    const obsAE = (nodeAE('#dataset-answer-evidence-observations') || {}).citationObservations || [];
    const snapsAE = (nodeAE('#dataset-answer-evidence-reviews') || {}).reviewDistributionSnapshots || [];
    const gapsAE = (nodeAE('#dataset-answer-evidence-gaps') || {}).gapRecords || [];
    const totAE = (nodeAE('#dataset-answer-evidence-totals') || {}).totals || {};
    const dbRowsAE = Number(execAE('sqlite3', [regAE.rubric_db, 'SELECT COUNT(*) FROM intent_query']).toString().trim());
    const covTotAE = coverageAE.totals || {};
    const covSumAE = (coverageAE.byService || []).reduce((a, c) => a + c.rubricRows, 0);
    const bindSumAE = questionsAE.filter((q) => q.fragmentBinding === 'bound-exact').length +
      questionsAE.filter((q) => q.fragmentBinding === 'target-page-has-fragments').length +
      questionsAE.filter((q) => q.fragmentBinding === 'no-fragment-on-target-page').length;
    check('AE-1 answer-evidence dataset carries all nine tables and its totals reconcile with the rubric database and the computed coverage',
      questionsAE.length === dbRowsAE && totAE.questions === questionsAE.length &&
      fragmentsAE.length > 0 && totAE.fragments === fragmentsAE.length &&
      profilesAE.length === 4 && totAE.engineProfiles === 4 &&
      obsAE.length > 0 && totAE.citationObservations === obsAE.length &&
      snapsAE.length > 0 && totAE.reviewSnapshots === snapsAE.length &&
      gapsAE.length === 9 && totAE.gapRecords === 9 &&
      covTotAE.rubricRows === questionsAE.length && covSumAE === questionsAE.length && bindSumAE === questionsAE.length &&
      covTotAE.boundExact === questionsAE.filter((q) => q.fragmentBinding === 'bound-exact').length,
      'questions=' + questionsAE.length + ', dbRows=' + dbRowsAE + ', fragments=' + fragmentsAE.length +
      ', profiles=' + profilesAE.length + ', observations=' + obsAE.length + ', snapshots=' + snapsAE.length +
      ', gaps=' + gapsAE.length + ', coverageServices=' + (coverageAE.byService || []).length);
    const badObsAE = obsAE.filter((o) => !o.method || !o.era || !o.promptVerbatim);
    const uiObsAE = obsAE.filter((o) => o.method !== 'search-surface');
    const panelAE = totAE.panelState || {};
    let regenAE = false, regenDetailAE = '';
    try {
      execAE('node', [path.join(ROOT, 'scripts', 'build-answer-evidence.js'), '--check'], { maxBuffer: 64 * 1024 * 1024 });
      regenAE = true;
    } catch (e) { regenDetailAE = String(e.message).slice(0, 160); }
    check('AE-2 every citation observation carries method + era + verbatim prompt, no answer-UI observation is claimed (panel state: zero runs, zero UI observations), and the dataset regenerates byte-identical from the live estate',
      badObsAE.length === 0 && uiObsAE.length === 0 &&
      panelAE.panelRuns === 0 && panelAE.promptPanelObservations === 0 && panelAE.answerUiObservations === 0 &&
      panelAE.braveSerpObservations === 0 && panelAE.consoleObservations === 0 && regenAE,
      'observations=' + obsAE.length + ', missingDiscipline=' + badObsAE.length + ', nonProxyMethods=' + uiObsAE.length +
      ', panelRuns=' + panelAE.panelRuns + ', uiObservations=' + panelAE.answerUiObservations + ', regenerated=' + regenAE + (regenDetailAE ? ', ' + regenDetailAE : ''));
    const SITE_AE = 'https://theflatratemovers.com';
    const servedIdxAE = LOCAL ? null : JSON.parse(await fetchText(SITE_AE + '/ai-master-index.json'));
    const distAE = new Map(servedIdxAE ? (servedIdxAE.distribution || []).map((e) => [e.contentUrl, e]) : []);
    const linkBadAE = [];
    const hashBadAE = [];
    for (const f of fragmentsAE) {
      const h = cryptoAE.createHash('sha256').update(f.text, 'utf8').digest('hex');
      if (h !== f.textHash) hashBadAE.push(f.fragmentId);
      for (const l of (f.evidenceLinks || [])) {
        const e = distAE.get(l.url);
        if (!e || !e.digest || e.digest.value !== l.sha256) linkBadAE.push(f.fragmentId + ':' + l.url);
      }
    }
    const fragByIdAE = new Map(fragmentsAE.map((f) => [f.fragmentId, f]));
    const bindBadAE = questionsAE.filter((q) => q.fragmentBinding === 'bound-exact' &&
      (!q.owningFragmentId || !fragByIdAE.has(q.owningFragmentId) ||
        !(fragByIdAE.get(q.owningFragmentId).questionIdsAnswered || []).includes(q.rubricRowRef)));
    if (LOCAL) skipLive('AE-3 every fragment text hash recomputes from its text, every fragment evidence digest equals the served signed index digest, and every exact binding resolves to a fragment that lists the question');
    else check('AE-3 every fragment text hash recomputes from its text, every fragment evidence digest equals the served signed index digest, and every exact binding resolves to a fragment that lists the question',
      hashBadAE.length === 0 && linkBadAE.length === 0 && bindBadAE.length === 0,
      'fragments=' + fragmentsAE.length + ', hashMismatches=' + hashBadAE.length +
      ', digestMismatches=' + linkBadAE.length + (linkBadAE.length ? ' (' + linkBadAE.slice(0, 3).join(', ') + ')' : '') +
      ', badBindings=' + bindBadAE.length);
    const claimFieldsAE = ['qualityScore', 'qualityClaim', 'endorsement', 'award', 'certificationClaim', 'ratingVerdict', 'recommendation'];
    const barBadAE = snapsAE.filter((r) => claimFieldsAE.some((f) => Object.prototype.hasOwnProperty.call(r, f)));
    const compAE = snapsAE.filter((r) => r.namespace === 'competitor');
    const compLabelBadAE = compAE.filter((r) => !String(r.note || '').includes('Competitor-namespace record'));
    const nsAE = totAE.reviewSnapshotsByNamespace || {};
    check('AE-4 review snapshots hold the schema bar: no claim fields anywhere, competitor records namespaced and labeled, namespace counts reconcile with the totals node',
      barBadAE.length === 0 && compLabelBadAE.length === 0 &&
      nsAE.company === snapsAE.filter((r) => r.namespace === 'company').length &&
      nsAE.competitor === compAE.length,
      'snapshots=' + snapsAE.length + ', company=' + (nsAE.company || 0) + ', competitor=' + compAE.length +
      ', barViolations=' + barBadAE.length + ', unlabeledCompetitor=' + compLabelBadAE.length);
  } catch (e) {
    check('answer-evidence dataset checks (AE-1..AE-4) evaluated', false, e.message);
  }

  // --- 20. Local-graph registry dataset — Retrieval Machine Build B3 (2026-10-31; checks LG-1..LG-4) ---
  // Added in the same motion as the dataset shipped (record:
  // out/verify-fix-2026-10-31-local-graph-registry.md).
  // datasets-local-graph-registry.json is the standing registry of
  // the Retrieval Machine's local-business graph element (Dossier 03
  // section 5): generated branch entities x third-party records with
  // the controlled status vocabulary, lastVerified discipline
  // (date + method + crawl age), propagation parents and exact
  // owner-step keys x the source-by-branch coverage matrix under the
  // branch-parity rule x review-distribution snapshots under the
  // shared schema bar x DO-NOT-TOUCH collision records x gaps
  // L1–L11 with designed solutions x the consolidated owner list
  // GENERATED from the rows. These checks assert the design's gates,
  // including its honesty gates: corrected-live is earned only on
  // direct-fetch proof (LG-2 fails the suite if any corrected-live
  // row rests on a weaker method), a snippet-era status can never be
  // silently upgraded, and the owner list must equal the set the
  // record rows generate — exactly the six designed steps (LG-3).
  try {
    const { execFileSync: execLG } = require('child_process');
    const dsLG = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, 'datasets-local-graph-registry.json'), 'utf8'));
    const gLG = dsLG['@graph'] || [];
    const nodeLG = (suffix) => gLG.find((n) => String(n['@id']).endsWith(suffix));
    const branchesLG = (nodeLG('#dataset-local-graph-registry-branches') || {}).branchEntities || [];
    const recordsLG = (nodeLG('#dataset-local-graph-registry-records') || {}).thirdPartyRecords || [];
    const coverageLG = (nodeLG('#dataset-local-graph-registry-coverage') || {}).coverageMatrix || [];
    const snapsLG = (nodeLG('#dataset-local-graph-registry-reviews') || {}).reviewDistributionSnapshots || [];
    const collsLG = (nodeLG('#dataset-local-graph-registry-collisions') || {}).collisionRecords || [];
    const gapsLG = (nodeLG('#dataset-local-graph-registry-gaps') || {}).gapRecords || [];
    const stepsLG = (nodeLG('#dataset-local-graph-registry-owner-steps') || {}).consolidatedOwnerSteps || [];
    const totLG = (nodeLG('#dataset-local-graph-registry-totals') || {}).totals || {};
    const STATUS_LG = ['verified-correct', 'open', 'correction-sent', 'corrected-live', 'parked-owner-step', 'platform-refused', 'unverifiable-today', 'monitored-synthesis', 'no-profile-exists', 'do-not-touch-collision'];
    const METHOD_LG = ['direct-fetch', 'search-surface', 'owner-manager-read'];
    const badRecLG = recordsLG.filter((r) => !r.recordId || !r.source || !r.field ||
      !r.observedValue || !r.correctValue || !STATUS_LG.includes(r.status) ||
      !r.lastVerified || !/^\d{4}-\d{2}-\d{2}$/.test(r.lastVerified.date || '') ||
      !METHOD_LG.includes(r.lastVerified.method) || !r.evidenceRef);
    const statusSumLG = Object.values(totLG.recordsByStatus || {}).reduce((a, b) => a + b, 0);
    check('LG-1 every registry record carries a controlled-vocabulary status, a last-verified date + method, an evidence reference and non-empty observed/correct values, and the totals reconcile with the rows',
      recordsLG.length > 0 && badRecLG.length === 0 &&
      totLG.thirdPartyRecords === recordsLG.length && statusSumLG === recordsLG.length &&
      totLG.recordsVerifiedCorrect === recordsLG.filter((r) => r.status === 'verified-correct').length,
      'records=' + recordsLG.length + ', badRecords=' + badRecLG.length + ', totalsRecords=' + totLG.thirdPartyRecords);
    const corrLG = recordsLG.filter((r) => r.status === 'corrected-live');
    const corrBadLG = corrLG.filter((r) => r.lastVerified.method !== 'direct-fetch');
    const parentBadLG = recordsLG.filter((r) => r.propagationParent &&
      !recordsLG.some((x) => x.recordId === r.propagationParent));
    const cellBadLG = [];
    for (const row of coverageLG) {
      for (const b of ['winchester', 'martinsburg']) {
        const cell = row[b] || {};
        if (!cell.state || !Array.isArray(cell.recordIds) || cell.recordIds.length === 0) cellBadLG.push(row.sourceId + '/' + b);
      }
    }
    const bwLG = branchesLG.find((b) => b.branchId === 'winchester') || {};
    const bmLG = branchesLG.find((b) => b.branchId === 'martinsburg') || {};
    check('LG-2 corrected-live is earned only on direct-fetch proof, every propagation parent resolves, the coverage matrix is complete (sources x 2 branches, no blank cells), and the two branch entities are present and distinct',
      corrBadLG.length === 0 && parentBadLG.length === 0 &&
      coverageLG.length === totLG.sources && cellBadLG.length === 0 &&
      totLG.coverageCells === coverageLG.length * 2 &&
      branchesLG.length === 2 && bwLG.displayName === 'The Flat Rate Movers' &&
      bmLG.displayName === 'Flat Rate Movers Martinsburg WV' &&
      bwLG.hoursDisplay !== bmLG.hoursDisplay && bwLG.address.full !== bmLG.address.full,
      'correctedLive=' + corrLG.length + ', correctedLiveNotDirectFetch=' + corrBadLG.length +
      ', badParents=' + parentBadLG.length + ', coverageRows=' + coverageLG.length + ', badCells=' + cellBadLG.length);
    const stepKeysLG = [...new Set(recordsLG.filter((r) => r.ownerStep).map((r) => r.ownerStep))].sort();
    const genKeysLG = stepsLG.map((x) => x.step).sort();
    const stepBlocksBadLG = stepsLG.filter((x) => {
      const want = recordsLG.filter((r) => r.ownerStep === x.step).map((r) => r.recordId).sort();
      const got = [...(x.blocksRecordIds || [])].sort();
      return JSON.stringify(want) !== JSON.stringify(got);
    });
    const collBadLG = collsLG.filter((c) => c.action !== 'none — DO-NOT-TOUCH' || !Array.isArray(c.conflationEvents));
    const gapBadLG = gapsLG.filter((g) => !g.solution || !g.title || !g.resolvingBatch);
    check('LG-3 the consolidated owner list equals the set generated from the record rows (exactly the six designed steps, each step blocking exactly its rows), collisions are all DO-NOT-TOUCH with event lists, and every gap carries its designed solution',
      stepsLG.length === 6 && JSON.stringify(stepKeysLG) === JSON.stringify(genKeysLG) && stepBlocksBadLG.length === 0 &&
      collsLG.length === 6 && collBadLG.length === 0 &&
      gapsLG.length === 11 && gapBadLG.length === 0 && totLG.gapRecords === 11,
      'steps=' + stepsLG.length + ', generatedFromRows=' + stepKeysLG.length + ', stepBlockMismatches=' + stepBlocksBadLG.length +
      ', collisions=' + collsLG.length + ', gaps=' + gapsLG.length);
    const claimFieldsLG = ['aggregateRating', 'reviewCount', 'bestRating', 'worstRating', 'ratingValue', 'review', 'itemReviewed', 'author', 'positiveNotes', 'negativeNotes', 'endorsement', 'recommendation', 'qualityScore', 'qualityClaim', 'award', 'certificationClaim', 'ratingVerdict'];
    const barBadLG = snapsLG.filter((r) => claimFieldsLG.some((f) => Object.prototype.hasOwnProperty.call(r, f)));
    const compLG = snapsLG.filter((r) => r.namespace === 'competitor');
    const compLabelBadLG = compLG.filter((r) => !String(r.note || '').includes('Competitor-namespace record'));
    let regenLG = false, regenDetailLG = '';
    try {
      execLG('node', [path.join(ROOT, 'scripts', 'build-local-graph.js'), '--check'], { maxBuffer: 64 * 1024 * 1024 });
      regenLG = true;
    } catch (e) { regenDetailLG = String(e.message).slice(0, 160); }
    check('LG-4 review snapshots hold the schema bar (no claim fields; competitor records namespaced and labeled) and the dataset regenerates byte-identical from the estate registries and evidence seed',
      barBadLG.length === 0 && compLabelBadLG.length === 0 &&
      totLG.reviewSnapshots === snapsLG.length && totLG.competitorSnapshots === compLG.length && regenLG,
      'snapshots=' + snapsLG.length + ', competitor=' + compLG.length + ', barViolations=' + barBadLG.length +
      ', unlabeledCompetitor=' + compLabelBadLG.length + ', regenerated=' + regenLG + (regenDetailLG ? ', ' + regenDetailLG : ''));
  } catch (e) {
    check('local-graph registry dataset checks (LG-1..LG-4) evaluated', false, e.message);
  }

  // --- 21. Dataset catalog checks — Batch 4a Catalog Checks
  // (2026-10-31; checks DC-1..DC-5). The catalog discipline of
  // Dossier 04 / reconciliation Element 4 (build inputs 1, 2, 5, 6,
  // 7), asserted over the local deploy tree (P-3 proves the served
  // tree equals it after deploy): Dataset descriptions inside
  // Google's 50–5,000 character bound (DC-1); schema.org sha256 on
  // DataDownload entries equal to the signed-index digest (DC-2),
  // with exactly four principled exceptions, each verified rather
  // than waived — an entry pointing at its own document (a file
  // cannot carry its own digest), an entry pointing at
  // ai-master-index.json (the index carries no self-digest; its
  // integrity is the detached JWS), the file-pointing entry of a
  // per-page landing JSON (one publication unit with its dataset
  // file; for the generator-backed datasets the pair is a mutual
  // fixed point), and an entry pointing at a route document that
  // republishes the containing graph verbatim (the target's bytes
  // contain the file's bytes — detected by node @id-set equality);
  // ISO 8601 dates with dateModified ≥ datePublished (DC-3);
  // creator/publisher as typed Organizations with the canonical
  // @id (DC-4); and the Zenodo concept DOI in URL form on exactly
  // its holder nodes — the four intent collection nodes, the intent
  // landing node and the master-index root — and nowhere else in
  // the corpus (DC-5). Corpus: the 37 dataset files, the 37
  // per-page dataset JSONs, ai-sitemap.json, entity-graph.json and
  // every route document's non-baked ld+json (the D-2 population).
  // The master index itself is DC-2's comparison source, not
  // population; its root is in scope for DC-5 only. DS-RESOLVE
  // (build input 8) is a C5-cadence live run, recorded in the
  // batch record, not a per-run check. Records:
  // out/batch-catalog-checks-2026-10-31/records/BATCH-RECORD.md and
  // out/verify-fix-2026-10-31-catalog-checks.md.
  try {
    const SITE_C = 'https://theflatratemovers.com';
    const DOI_URL_C = 'https://doi.org/10.5281/zenodo.23818766';
    const ORG_ID_C = SITE_C + '/#organization';
    const INDEX_URL_C = SITE_C + '/ai-master-index.json';
    const idxC = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, 'ai-master-index.json'), 'utf8'));
    const digestByUrlC = {};
    for (const e of idxC.distribution || []) {
      const list = Array.isArray(e) ? e : [e];
      for (const d of list) if (d && d.contentUrl && d.digest && d.digest.value) digestByUrlC[d.contentUrl] = d.digest.value;
    }
    const topNodesC = (doc) => (doc && typeof doc === 'object')
      ? [doc, ...(Array.isArray(doc['@graph']) ? doc['@graph'] : [])] : [];
    const typeHasC = (n, t) => { const x = n && n['@type']; return x === t || (Array.isArray(x) && x.includes(t)); };
    const corpusC = []; // [label, doc, selfUrls:Set]
    const id2fileC = {};
    for (const f of DATASET_FILES) {
      const doc = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, f), 'utf8'));
      corpusC.push([f, doc, new Set([SITE_C + '/' + f])]);
      for (const n of topNodesC(doc)) if (n && n['@id']) id2fileC[n['@id']] = f;
    }
    for (const f of fs.readdirSync(PAGES_PUBLIC).filter((x) => /^dataset-[a-z0-9-]+\.json$/.test(x)).sort()) {
      const doc = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, f), 'utf8'));
      corpusC.push([f, doc, new Set([SITE_C + '/' + f, SITE_C + '/datasets-' + f.slice('dataset-'.length)])]);
    }
    corpusC.push(['ai-sitemap.json', JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, 'ai-sitemap.json'), 'utf8')), new Set([SITE_C + '/ai-sitemap.json'])]);
    corpusC.push(['entity-graph.json', JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, 'entity-graph.json'), 'utf8')), new Set([SITE_C + '/entity-graph.json'])]);
    const routeFilesC = [];
    (function walkC(d, rel) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const r = rel ? rel + '/' + e.name : e.name;
        if (e.isDirectory()) walkC(path.join(d, e.name), r);
        else if (e.isFile() && e.name === 'index.html') routeFilesC.push(r);
      }
    })(PAGES_PUBLIC, '');
    const routeHtmlC = {};
    for (const rel of routeFilesC) routeHtmlC[rel] = fs.readFileSync(path.join(PAGES_PUBLIC, rel), 'utf8');
    const routeUrlOfC = (rel) => SITE_C + '/' + rel.replace(/index\.html$/, '');
    const scriptDocsC = (html) => {
      const out = [];
      for (const m of html.matchAll(/<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g)) {
        if (m[1].includes('id="page-jsonld"') || m[1].includes('data-page-json=')) continue;
        try { out.push(JSON.parse(m[2])); } catch (_) { /* not a JSON-LD doc */ }
      }
      return out;
    };
    for (const rel of routeFilesC) {
      for (const doc of scriptDocsC(routeHtmlC[rel])) {
        const self = new Set([routeUrlOfC(rel)]);
        for (const n of topNodesC(doc)) if (n && n['@id'] && id2fileC[n['@id']]) self.add(SITE_C + '/' + id2fileC[n['@id']]);
        corpusC.push([rel, doc, self]);
      }
    }
    const idsetOfC = (doc) => new Set(topNodesC(doc).map((n) => n && n['@id']).filter(Boolean));
    const repubCacheC = new Map();
    const republishesC = (url, idset) => {
      const key = url + '|' + [...idset].sort().join(',');
      if (repubCacheC.has(key)) return repubCacheC.get(key);
      let ok = false;
      const html = routeHtmlC[url.slice(SITE_C.length + 1) + 'index.html'];
      if (html) {
        for (const doc of scriptDocsC(html)) {
          const ids = idsetOfC(doc);
          if (ids.size === idset.size && [...ids].every((x) => idset.has(x))) { ok = true; break; }
        }
      }
      repubCacheC.set(key, ok);
      return ok;
    };
    const walkAllC = (o, fn) => {
      if (Array.isArray(o)) o.forEach((v) => walkAllC(v, fn));
      else if (o && typeof o === 'object') { fn(o); Object.values(o).forEach((v) => walkAllC(v, fn)); }
    };
    const datasetNodesC = [];
    for (const [label, doc] of corpusC) {
      for (const n of topNodesC(doc)) if (typeHasC(n, 'Dataset')) datasetNodesC.push([label, n]);
    }
    // DC-1: description bound.
    const bad1 = datasetNodesC.filter(([, n]) => typeof n.description !== 'string' || n.description.length < 50 || n.description.length > 5000)
      .map(([label, n]) => label + ' ' + (n['@id'] || '?') + ' len=' + (typeof n.description === 'string' ? n.description.length : 'none'));
    check('DC-1 every Dataset node description is within Google\u2019s 50\u20135,000 character bound (dataset files, per-page JSONs, sitemap, entity graph, all route documents)',
      bad1.length === 0 && datasetNodesC.length > 0,
      datasetNodesC.length + ' Dataset nodes' + (bad1.length ? ', bad: ' + bad1.slice(0, 4).join('; ') : ''));
    // DC-2: in-band sha256 == signed-index digest, four exceptions.
    const bad2 = [];
    let nSha = 0, nSelf = 0, nIndex = 0, nRepub = 0;
    for (const [label, doc, selfUrls] of corpusC) {
      const idset = idsetOfC(doc);
      walkAllC(doc, (node) => {
        if (!typeHasC(node, 'DataDownload')) return;
        const url = node.contentUrl;
        if (!url) { bad2.push(label + ' DataDownload without contentUrl'); return; }
        if (url === INDEX_URL_C) { nIndex++; if ('sha256' in node) bad2.push(label + ' index entry carries sha256'); return; }
        if (selfUrls.has(url)) { nSelf++; if ('sha256' in node) bad2.push(label + ' self entry carries sha256: ' + url); return; }
        if (url.endsWith('/') && republishesC(url, idset)) { nRepub++; if ('sha256' in node) bad2.push(label + ' republication entry carries sha256: ' + url); return; }
        const expected = digestByUrlC[url];
        if (!expected) { bad2.push(label + ' unsealed target: ' + url); return; }
        if (node.sha256 !== expected) { bad2.push(label + ' sha256 ' + (node.sha256 ? 'mismatch' : 'missing') + ': ' + url); return; }
        nSha++;
      });
    }
    check('DC-2 every DataDownload carries schema.org sha256 equal to its signed-index digest (self / index / landing-unit / republication exceptions verified)',
      bad2.length === 0 && nSha > 0,
      nSha + ' sha-verified, ' + nSelf + ' self, ' + nIndex + ' index, ' + nRepub + ' republication' + (bad2.length ? ', bad: ' + bad2.slice(0, 4).join('; ') : ''));
    // DC-3: ISO dates, modified >= published.
    const ISO_C = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
    const bad3 = [];
    let nDates = 0;
    for (const [label, doc] of corpusC) {
      walkAllC(doc, (node) => {
        if (!typeHasC(node, 'Dataset') && !typeHasC(node, 'DataDownload')) return;
        for (const k of ['datePublished', 'dateModified']) {
          const v = node[k];
          if (v === undefined) continue;
          nDates++;
          if (typeof v !== 'string' || !ISO_C.test(v) || Number.isNaN(Date.parse(v))) bad3.push(label + ' ' + (node['@id'] || node.contentUrl || '?') + ' ' + k + '=' + v);
        }
        if (typeof node.datePublished === 'string' && typeof node.dateModified === 'string' &&
            !Number.isNaN(Date.parse(node.datePublished)) && !Number.isNaN(Date.parse(node.dateModified)) &&
            Date.parse(node.dateModified) < Date.parse(node.datePublished)) {
          bad3.push(label + ' ' + (node['@id'] || '?') + ' dateModified < datePublished');
        }
      });
    }
    check('DC-3 every Dataset/DataDownload datePublished/dateModified is ISO 8601 with dateModified \u2265 datePublished',
      bad3.length === 0 && nDates > 0,
      nDates + ' date values' + (bad3.length ? ', bad: ' + bad3.slice(0, 4).join('; ') : ''));
    // DC-4: creator/publisher typed Organization with canonical @id.
    const agentOkC = (a) => !!a && typeof a === 'object' && !Array.isArray(a) && typeHasC(a, 'Organization') && a['@id'] === ORG_ID_C;
    const bad4 = datasetNodesC.filter(([, n]) => !agentOkC(n.creator) || !agentOkC(n.publisher))
      .map(([label, n]) => label + ' ' + (n['@id'] || '?'));
    check('DC-4 every Dataset node\u2019s creator and publisher is a typed Organization carrying the canonical @id',
      bad4.length === 0 && datasetNodesC.length > 0,
      datasetNodesC.length + ' Dataset nodes' + (bad4.length ? ', bad: ' + bad4.slice(0, 4).join('; ') : ''));
    // DC-5: DOI URL form on exactly the holder nodes. Holders are
    // identified by @id, so the verbatim route-document copies of
    // the intent graph are held to the same assertion, not flagged
    // as extra carriers.
    const holderIdsC = new Set();
    const bad5 = [];
    let fileHoldersC = 0;
    for (const [label, doc] of corpusC) {
      if (label !== 'datasets-intent-coverage.json') continue;
      for (const n of topNodesC(doc)) {
        if (typeHasC(n, 'Dataset') && String(n['@id'] || '').startsWith(SITE_C + '/#dataset-intent-coverage-')) {
          fileHoldersC++;
          holderIdsC.add(n['@id']);
          if (n.identifier !== DOI_URL_C) bad5.push('file holder ' + n['@id'] + ' identifier is not the DOI URL');
        }
      }
    }
    if (fileHoldersC !== 4) bad5.push('intent file holders=' + fileHoldersC + ' (expected 4)');
    let landingHoldersC = 0;
    for (const [label, doc] of corpusC) {
      if (label !== 'dataset-intent-coverage.json') continue;
      for (const n of topNodesC(doc)) {
        if (typeHasC(n, 'Dataset')) {
          landingHoldersC++;
          holderIdsC.add(n['@id']);
          if (n.identifier !== DOI_URL_C) bad5.push('intent landing node identifier is not the DOI URL');
        }
      }
    }
    if (landingHoldersC !== 1) bad5.push('intent landing holders=' + landingHoldersC + ' (expected 1)');
    if (idxC.identifier !== DOI_URL_C) bad5.push('master-index root identifier is not the DOI URL');
    let holderInstancesC = 0;
    for (const [label, n] of datasetNodesC) {
      if (holderIdsC.has(n['@id'])) {
        holderInstancesC++;
        if (n.identifier !== DOI_URL_C) bad5.push(label + ' ' + n['@id'] + ' holder instance identifier is not the DOI URL');
        continue;
      }
      if (JSON.stringify(n.identifier || '').includes('23818766')) bad5.push(label + ' ' + (n['@id'] || '?') + ' carries the concept DOI');
      if (n.identifier && typeof n.identifier === 'object' && n.identifier.propertyID === 'DOI') bad5.push(label + ' ' + (n['@id'] || '?') + ' carries a PropertyValue DOI');
    }
    check('DC-5 the Zenodo concept DOI appears in URL form (https://doi.org/10.5281/zenodo.23818766) on exactly its holder nodes and nowhere else',
      bad5.length === 0,
      'holders: 4 intent collection nodes + intent landing node + master-index root, ' + holderInstancesC + ' holder instances incl. route copies' + (bad5.length ? ', bad: ' + bad5.slice(0, 4).join('; ') : ''));
  } catch (e) {
    check('dataset catalog checks (DC-1..DC-5) evaluated', false, e.message);
  }

  // --- 22. Crawl-presence registry dataset — Retrieval Machine Build E5-B1 (2026-10-31; checks CP-1..CP-5) ---
  // Added in the same motion as the dataset shipped (record:
  // out/verify-fix-2026-10-31-crawl-presence.md).
  // datasets-crawl-presence.json is the standing registry of the
  // Retrieval Machine's training/research-corpora element (Dossier
  // 05 section 5): every Common Crawl collection's recorded answer
  // for this domain (query state + verbatim method + attempts) x
  // capture rows classified by computed URL class and content era x
  // the robots posture recorded as the owner's decision (Option 1,
  // open training, 2026-10-31) with the served-vs-source drift gate
  // x the signed signal-observation log x the honesty tables
  // (filter_inspection empty by design, corpus_release_check
  // not-checked by design) x gaps P1–P6 with designed solutions x
  // the mechanism pins. These checks assert the design's gates,
  // including its honesty gates: an unreadable collection is an
  // explicit unverifiable-index-error row, never a zero-filled
  // capture set (CP-4); the recorded posture must equal the decided
  // state and the live robots.txt must still digest-match the
  // recorded served file (CP-2 — the drift gate); the signal log's
  // genesis entry must carry the full 22-field shape and a signature
  // that verifies against the published JWKS key (CP-3).
  try {
    const { execFileSync: execCP } = require('child_process');
    const cryptoCP = require('crypto');
    const dsCP = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, 'datasets-crawl-presence.json'), 'utf8'));
    const gCP = dsCP['@graph'] || [];
    const nodeCP = (suffix) => gCP.find((n) => String(n['@id']).endsWith(suffix));
    const collsCP = (nodeCP('#dataset-crawl-presence-collections') || {}).collections || [];
    const rowsCP = (nodeCP('#dataset-crawl-presence-crawl-presence') || {}).crawlPresence || [];
    const summCP = (nodeCP('#dataset-crawl-presence-presence-summary') || {}).presenceSummary || {};
    const policyCP = (nodeCP('#dataset-crawl-presence-robots-policy') || {}).robotsPolicy || {};
    const sigsCP = (nodeCP('#dataset-crawl-presence-signal-observations') || {}).signalObservations || [];
    const inspCP = (nodeCP('#dataset-crawl-presence-filter-inspections') || {}).filterInspections;
    const relCP = nodeCP('#dataset-crawl-presence-corpus-release-checks') || {};
    const gapsCP = (nodeCP('#dataset-crawl-presence-gaps') || {}).gapRecords || [];
    const pinsCP = (nodeCP('#dataset-crawl-presence-mechanism-pins') || {}).mechanismPins || [];
    const totCP = (nodeCP('#dataset-crawl-presence-totals') || {}).totals || {};
    // CP-1: totals reconcile with the rows.
    const perCollSumCP = collsCP.reduce((a, c) => a + (c.captureCount || 0), 0);
    const summSumCP = (summCP.perCollection || []).reduce((a, c) => a + (c.totalCaptures || 0), 0);
    const eraSumCP = Object.values(summCP.byEra || {}).reduce((a, v) => a + (v.captures || 0), 0);
    const classSumCP = Object.values(summCP.byClass || {}).reduce((a, v) => a + (v.captures || 0), 0);
    const stateCountsCP = { 'queried-clean': 0, 'partial': 0, 'unverifiable-index-error': 0 };
    for (const c of collsCP) if (Object.prototype.hasOwnProperty.call(stateCountsCP, c.queryState)) stateCountsCP[c.queryState]++;
    check('CP-1 crawl-presence totals reconcile with the collection and capture rows (collections, captures, per-collection summary, per-era and per-class sums, query-state counts)',
      collsCP.length === totCP.collections && rowsCP.length === totCP.captureRows &&
      perCollSumCP === rowsCP.length && summSumCP === rowsCP.length &&
      eraSumCP === rowsCP.length && classSumCP === rowsCP.length &&
      JSON.stringify(stateCountsCP) === JSON.stringify(totCP.collectionsByQueryState || {}) &&
      totCP.capturesOk200 === rowsCP.filter((r) => r.status === '200').length &&
      totCP.currentEstateCaptures === rowsCP.filter((r) => r.contentEra === 'current-estate').length,
      'collections=' + collsCP.length + ', rows=' + rowsCP.length + ', perCollSum=' + perCollSumCP +
      ', eraSum=' + eraSumCP + ', classSum=' + classSumCP);
    // CP-2: the recorded decision + the drift gate against the LIVE file.
    const liveRobotsCP = fs.readFileSync(path.join(PAGES_PUBLIC, 'robots.txt'));
    const liveDigestCP = cryptoCP.createHash('sha256').update(liveRobotsCP).digest('hex');
    const decCP = policyCP.decision || {};
    const liveGroupsCP = (liveRobotsCP.toString('utf8').match(/^User-agent:/gim) || []).length;
    check('CP-2 robots policy records the owner decision (Option 1, open training, decided 2026-10-31) and the drift gate holds: served digest, recorded source digest and the live robots.txt digest are one value, with the dated no-drift result and the agent table matching the live file',
      decCP.state === 'decided' && decCP.option === 1 && decCP.optionName === 'open-training' &&
      decCP.posture === 'open-training' && decCP.decidedBy === 'owner' && decCP.decidedOn === '2026-10-31' &&
      (policyCP.servedFile || {}).sha256 === liveDigestCP &&
      (policyCP.sourceFile || {}).sha256 === liveDigestCP &&
      (policyCP.driftGate || {}).result === 'no-drift-observed' &&
      /^\d{4}-\d{2}-\d{2}$/.test((policyCP.driftGate || {}).checkedOn || '') &&
      (policyCP.agents || []).length === liveGroupsCP && liveGroupsCP > 0 &&
      policyCP.contentSignalSearch === 'unset' && policyCP.contentSignalAiInput === 'unset' &&
      policyCP.contentSignalAiTrain === 'unset' && (policyCP.usageTokenAiTraining || {}).state === 'absent',
      'liveDigest=' + liveDigestCP.slice(0, 12) + ', agents=' + (policyCP.agents || []).length + '/' + liveGroupsCP +
      ', drift=' + ((policyCP.driftGate || {}).result || 'missing'));
    // CP-3: the signal-observation log shape + signature.
    const FIELDS_CP = ['entry_id', 'schema_version', 'observed_at', 'capturing_agent', 'mechanism', 'signal_url', 'scope', 'scope_value', 'http_status', 'response_headers_digest', 'body_digest', 'body_byte_size', 'raw_artifact_uri', 'parsed_directives', 'spec_version', 'archive_snapshot_uri', 'change_ref', 'effective_from', 'effective_to', 'prev_entry_digest', 'entry_digest', 'signature', 'signing_key_id'];
    let sigOkCP = false, sigDetailCP = '';
    try {
      const jwksCP = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, '.well-known', 'signing-keys.json'), 'utf8'));
      const keyCP = (jwksCP.keys || []).find((k) => k.kid === 'theflatratemovers-2026-10-29-1');
      const e0 = sigsCP[0] || {};
      const jwkCP = { kty: keyCP.kty, crv: keyCP.crv, x: keyCP.x };
      const pubCP = cryptoCP.createPublicKey({ key: jwkCP, format: 'jwk' });
      sigOkCP = cryptoCP.verify(null, Buffer.from(e0.entry_digest || '', 'hex'), pubCP,
        Buffer.from(e0.signature || '', 'base64url'));
    } catch (e) { sigDetailCP = String(e.message).slice(0, 120); }
    const e0CP = sigsCP[0] || {};
    const fieldsOkCP = FIELDS_CP.every((f) => Object.prototype.hasOwnProperty.call(e0CP, f)) &&
      Object.prototype.hasOwnProperty.call(e0CP, 'timestamp_token') && e0CP.timestamp_token === null &&
      e0CP.prev_entry_digest === null && e0CP.http_status === 200 &&
      e0CP.body_digest === liveDigestCP && e0CP.signing_key_id === 'theflatratemovers-2026-10-29-1';
    check('CP-3 the signal-observation log carries the full 22-field shape (plus the unpopulated optional timestamp_token), the genesis entry digest-chains from null, its body digest equals the live robots.txt digest, and its Ed25519 signature verifies against the published JWKS key',
      sigsCP.length === totCP.signalObservations && sigsCP.length >= 1 && fieldsOkCP && sigOkCP,
      'entries=' + sigsCP.length + ', fieldsOk=' + fieldsOkCP + ', signatureVerifies=' + sigOkCP + (sigDetailCP ? ', ' + sigDetailCP : ''));
    // CP-4: honesty states — no zero-filled presence.
    const QS_CP = ['queried-clean', 'partial', 'unverifiable-index-error'];
    const ERAS_CP = ['current-estate', 'pre-cutover-wordpress', 'wix-era', 'earlier-predecessor'];
    const CLASSES_CP = ['page', 'dataset-file', 'llms', 'graph', 'index', 'robots', 'taxonomy', 'other'];
    const badCollCP = collsCP.filter((c) => !QS_CP.includes(c.queryState) || !c.method ||
      (c.queryState === 'unverifiable-index-error' && (!c.errorNote || c.captureCount !== 0)) ||
      c.captureCount !== rowsCP.filter((r) => r.collectionId === c.collectionId).length);
    const badRowCP = rowsCP.filter((r) => !ERAS_CP.includes(r.contentEra) || !CLASSES_CP.includes(r.urlClass) ||
      typeof r.eraReview !== 'boolean' || !r.url || !r.timestamp || !r.status);
    check('CP-4 no zero-filled presence: every collection carries a controlled query state with its method, unverifiable collections stand as explicit error rows with zero captures, every capture row carries a computed era and class from the vocabularies, and the filter-inspection and corpus-release tables hold their honest empty / not-checked states',
      badCollCP.length === 0 && badRowCP.length === 0 &&
      Array.isArray(inspCP) && inspCP.length === 0 &&
      Array.isArray(relCP.corpusReleaseChecks) && relCP.corpusReleaseChecks.length === 0 &&
      relCP.releaseCheckState === 'not-checked',
      'badCollections=' + badCollCP.length + ', badRows=' + badRowCP.length +
      ', unverifiable=' + collsCP.filter((c) => c.queryState === 'unverifiable-index-error').length);
    // CP-5: gaps with solutions, mechanism pins, byte-identical regen.
    const gapBadCP = gapsCP.filter((g) => !g.solution || !g.status || !g.resolvingBatch || !g.title);
    const p3CP = gapsCP.find((g) => g.gapId === 'P3') || {};
    const pinBadCP = pinsCP.filter((p) => !p.mechanism || !p.pinnedFact || !p.source);
    let regenCP = false, regenDetailCP = '';
    try {
      execCP('node', [path.join(ROOT, 'scripts', 'build-crawl-presence.js'), '--check'], { maxBuffer: 64 * 1024 * 1024 });
      regenCP = true;
    } catch (e) { regenDetailCP = String(e.message).slice(0, 160); }
    check('CP-5 gaps P1–P6 each carry a designed solution and status (P3 resolved by the recorded owner decision), the mechanism pins carry their sources, and the dataset regenerates byte-identical from the sweep seed, the signed observation and the live estate',
      gapsCP.length === 6 && gapBadCP.length === 0 &&
      ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'].every((id) => gapsCP.some((g) => g.gapId === id)) &&
      String(p3CP.status || '').startsWith('resolved') && pinsCP.length >= 4 && pinBadCP.length === 0 && regenCP,
      'gaps=' + gapsCP.length + ', badGaps=' + gapBadCP.length + ', pins=' + pinsCP.length +
      ', regenerated=' + regenCP + (regenDetailCP ? ', ' + regenDetailCP : ''));
  } catch (e) {
    check('crawl-presence registry dataset checks (CP-1..CP-5) evaluated', false, e.message);
  }

  // --- 23. Archive registry dataset — Retrieval Machine Build E6-B1 (2026-11-01; checks AR-1..AR-6) + E6-B2 re-snapshot generation (AR-7) ---
  // The archives element's standing registry (Dossier 06 design;
  // reconciliation build inputs E6-1/E6-2/E6-3): every preservation
  // copy of the estate — Wayback captures CDX-verified live, Zenodo
  // deposits verified per file, GitHub HEADs, the local BagIt 1.0
  // archive — plus the signed verification report of the runbook's
  // first execution. Absences stand as themselves: the five captures
  // the Archive no longer serves are pinned as missing, never
  // omitted (AR-2). Record:
  // out/verify-fix-2026-11-01-archive-registry.md.
  try {
    const { execFileSync: execAR } = require('child_process');
    const cryptoAR = require('crypto');
    const dsAR = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, 'datasets-archive-registry.json'), 'utf8'));
    const gAR = (dsAR['@graph'] || []);
    const nodeAR = (sfx) => gAR.find((n) => String(n['@id'] || '').endsWith(sfx)) || {};
    const totAR = nodeAR('#dataset-archive-registry-totals').totals || {};
    const targetsAR = nodeAR('#dataset-archive-registry-targets').archiveTargets || [];
    const capsAR = nodeAR('#dataset-archive-registry-captures').captures || [];
    const missingAR = nodeAR('#dataset-archive-registry-captures').missingCaptures || [];
    const depsAR = nodeAR('#dataset-archive-registry-deposits').deposits || [];
    const laAR = nodeAR('#dataset-archive-registry-local-archive').localArchive || {};
    const verAR = nodeAR('#dataset-archive-registry-verification').verification || {};
    const gapsAR = nodeAR('#dataset-archive-registry-gaps').gapRecords || [];
    // AR-1: totals reconcile with the rows they summarize.
    const depFilesAR = depsAR.reduce((a, d) => a + (d.fileRows || []).length, 0);
    const statesAR = {};
    for (const t of targetsAR) statesAR[t.captureState] = (statesAR[t.captureState] || 0) + 1;
    check('AR-1 archive registry totals reconcile with their rows (targets = target rows, verified + missing = capture records, deposit files = per-file rows, capture states recomputed from the target rows)',
      totAR.targets === targetsAR.length && totAR.capturesVerified === capsAR.length &&
      totAR.capturesMissing === missingAR.length && totAR.depositFiles === depFilesAR &&
      JSON.stringify(totAR.captureStates) === JSON.stringify(statesAR),
      'targets=' + targetsAR.length + ', verified=' + capsAR.length + ', missing=' + missingAR.length + ', depositFiles=' + depFilesAR);
    // AR-2: A5 fields on every record; the five missing captures stand.
    const A5 = ['byteSize', 'doiReleaseUri', 'localArchivePath', 'mediaType', 'manifestVersion', 'fixityStatus'];
    const badA5 = capsAR.filter((c) => A5.some((k) => !(k in c)) ||
      (c.byteSize === null && typeof c.recordLength !== 'number') ||
      !['verified', 'mismatch', 'missing', 'superseded'].includes(c.fixityStatus));
    const MISSING_URLS = ['datasets-intent-coverage.json', '/datasets/ffe-logistics/', '/datasets/government/', '/datasets/gun-safe/', '/datasets/local-regional/'];
    const missingOkAR = MISSING_URLS.every((u) => missingAR.some((m) => m.url.endsWith(u) &&
      m.fixityStatus === 'missing' && m.recheck2026Nov01 && m.recheck2026Nov01.cdxAllVariants === 0 &&
      m.recheck2026Nov01.snapshotFetch === 404));
    check('AR-2 every capture record carries the A5 fields (byte size, DOI release URI slot, local archive path, media type, manifest version, fixity status from the enum), and the five captures the Archive no longer serves stand as missing with their re-check trail — recorded, never omitted or zero-filled',
      badA5.length === 0 && missingAR.length === 5 && missingOkAR,
      'badA5=' + badA5.length + ', missing=' + missingAR.length + ', trailOk=' + missingOkAR);
    // AR-3: deposit exceptions reconcile exactly (9 divergent + 2 different-artifact + 5 not-verifiable = 16).
    const byClassAR = verAR.exceptionsByKind || {};
    const depCountOkAR = depsAR.every((d) => d.counts &&
      d.counts.releaseSealMatch + d.counts.releaseSealMismatch + d.counts.notInReleaseIndex === d.files &&
      d.archiveFile && d.archiveFile.checksumVerified === true);
    check('AR-3 both Zenodo deposits MD5-match the archive-file checksums Zenodo serves, per-file counts reconcile against both seals, and the verification exceptions reconcile exactly (9 deposit-divergent + 2 different-artifact + 5 capture-not-verifiable = 16; the itemized exceptions with both digests stand in the signed report pinned by AR-5)',
      depCountOkAR && verAR.exceptions === 16 &&
      byClassAR['deposit-divergent'] === 9 && byClassAR['different-artifact'] === 2 && byClassAR['capture-not-verifiable'] === 5,
      'exceptions=' + verAR.exceptions + ', byClass=' + JSON.stringify(byClassAR) + ', depCountsOk=' + depCountOkAR);
    // AR-4: the local-archive record equals the bag on disk.
    let bagOkAR = false, bagDetailAR = '';
    try {
      const bagDir = path.join(ROOT, 'out', 'estate-archive', 'bag');
      const infoAR = fs.readFileSync(path.join(bagDir, 'bag-info.txt'), 'utf8');
      const oxumAR = (infoAR.match(/Payload-Oxum: (\S+)/) || [])[1];
      const manAR = fs.readFileSync(path.join(bagDir, 'manifest-sha256.txt'), 'utf8').trim().split('\n');
      const sampleAR = ['data/ai-sitemap.json', 'data/llms-full.txt', 'data/datasets-intent-coverage.json'];
      let sampleOkAR = true;
      for (const rel of sampleAR) {
        const line = manAR.find((l) => l.endsWith(' ' + rel) || l.endsWith('*' + rel));
        if (!line) { sampleOkAR = false; break; }
        const want = line.split(/\s+/)[0];
        const got = cryptoAR.createHash('sha256').update(fs.readFileSync(path.join(bagDir, rel))).digest('hex');
        if (want !== got) { sampleOkAR = false; break; }
      }
      bagOkAR = oxumAR === laAR.payloadOxum && manAR.length === laAR.payloadFiles && sampleOkAR &&
        laAR.fixityStatus === 'verified' && /BagIt 1\.0/.test(laAR.container || '');
      bagDetailAR = 'oxum=' + oxumAR + ', manifestLines=' + manAR.length + ', sampleOk=' + sampleOkAR;
    } catch (e) { bagDetailAR = e.message; }
    check('AR-4 the local-archive record equals the BagIt bag on disk (Payload-Oxum and payload count re-read from bag-info/manifest; sampled payload files re-hash to the manifest; BagIt version 1.0 per RFC 8493)',
      bagOkAR, bagDetailAR);
    // AR-5: the signed verification report stands beside the index,
    // byte-identical to the registry's record, JWS valid vs the JWKS.
    let jwsOkAR = false, jwsDetailAR = '';
    try {
      const repBytes = fs.readFileSync(path.join(PAGES_PUBLIC, 'ai-verification-report-2026-11-01.json'));
      const repSha = cryptoAR.createHash('sha256').update(repBytes).digest('hex');
      const jwsAR = fs.readFileSync(path.join(PAGES_PUBLIC, 'ai-verification-report-2026-11-01.jws'), 'utf8').trim();
      const jwksAR = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, '.well-known', 'signing-keys.json'), 'utf8'));
      const [hAR, pAR, sAR] = jwsAR.split('.');
      const hdrAR = JSON.parse(Buffer.from(hAR, 'base64url').toString('utf8'));
      const keyAR = (jwksAR.keys || []).find((k) => k.kid === hdrAR.kid);
      const pubKeyAR = cryptoAR.createPublicKey({ key: { kty: keyAR.kty, crv: keyAR.crv, x: keyAR.x }, format: 'jwk' });
      jwsOkAR = repSha === verAR.reportSha256 && verAR.reportUrl === 'https://theflatratemovers.com/ai-verification-report-2026-11-01.json' &&
        cryptoAR.verify(null, Buffer.from(hAR + '.' + pAR), pubKeyAR, Buffer.from(sAR, 'base64url'));
      jwsDetailAR = 'reportSha=' + repSha.slice(0, 16) + ', kid=' + hdrAR.kid;
    } catch (e) { jwsDetailAR = e.message; }
    check('AR-5 the signed 2026-11-01 verification report stands beside the index at the registry-linked URL, its bytes hash to the registry-recorded SHA-256, and its detached JWS verifies against the published JWKS',
      jwsOkAR, jwsDetailAR);
    // AR-6: gaps with solutions + byte-identical regeneration.
    const gapBadAR = gapsAR.filter((g) => !g.solution || !g.status || !g.resolvingBatch || !g.title || !g.evidence);
    let regenAR = false, regenDetailAR = '';
    try {
      execAR('node', [path.join(ROOT, 'scripts', 'build-archive-registry.js'), '--check'], { maxBuffer: 64 * 1024 * 1024 });
      regenAR = true;
    } catch (e) { regenDetailAR = String(e.message).slice(0, 160); }
    check('AR-6 gaps A1–A6 each carry their evidence, designed solution, status and resolving batch, and the registry regenerates byte-identical from its verified evidence seed',
      gapsAR.length === 6 && gapBadAR.length === 0 &&
      ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'].every((id) => gapsAR.some((g) => g.gapId === id)) && regenAR,
      'gaps=' + gapsAR.length + ', badGaps=' + gapBadAR.length + ', regenerated=' + regenAR + (regenDetailAR ? ', ' + regenDetailAR : ''));
    // AR-7: the second signed report (E6-B2 re-snapshot wave) stands
    // beside the index, pinned by the wave run record: bytes hash to
    // the recorded SHA-256, JWS verifies vs the JWKS, the report's
    // leg tallies equal the run record's tallies, and every wave
    // capture row carries verified fixity under the pre-B2 seal's
    // manifest version. Record:
    // out/verify-fix-2026-11-01-archive-resnapshot.md.
    let ar7ok = false, ar7detail = '';
    try {
      const runsAR = nodeAR('#dataset-archive-registry-runs').snapshotRuns || [];
      const runB2 = runsAR.find((r) => r.runId === 'run-2026-11-01-e6b2-resnapshot') || {};
      const rep2Bytes = fs.readFileSync(path.join(PAGES_PUBLIC, 'ai-verification-report-2026-11-01-e6b2.json'));
      const rep2Sha = cryptoAR.createHash('sha256').update(rep2Bytes).digest('hex');
      const rep2 = JSON.parse(rep2Bytes.toString('utf8'));
      const jws2 = fs.readFileSync(path.join(PAGES_PUBLIC, 'ai-verification-report-2026-11-01-e6b2.jws'), 'utf8').trim();
      const [h2, p2, s2] = jws2.split('.');
      const hdr2 = JSON.parse(Buffer.from(h2, 'base64url').toString('utf8'));
      const jwks2 = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, '.well-known', 'signing-keys.json'), 'utf8'));
      const k2 = (jwks2.keys || []).find((k) => k.kid === hdr2.kid);
      const pub2 = cryptoAR.createPublicKey({ key: { kty: k2.kty, crv: k2.crv, x: k2.x }, format: 'jwk' });
      const leg0 = (rep2.legs || [])[0] || {};
      const leg1 = (rep2.legs || [])[1] || {};
      const waveRows = capsAR.filter((c) => /-e6b2-/.test(c.captureId || ''));
      const waveRowsOk = waveRows.length >= (runB2.savesConfirmed || 0) && waveRows.every((c) =>
        c.fixityStatus === 'verified' &&
        (String(c.url).includes('zenodo.org') ||
         String(c.manifestVersion || '').includes('3fb30cd7c02debbdc3eaf5d949b44a1e1730d38c74e0296062b5d851c7fafc4e')));
      ar7ok = rep2Sha === runB2.verificationReportSha256 &&
        runB2.verificationReportUrl === 'https://theflatratemovers.com/ai-verification-report-2026-11-01-e6b2.json' &&
        cryptoAR.verify(null, Buffer.from(h2 + '.' + p2), pub2, Buffer.from(s2, 'base64url')) &&
        leg0.savesConfirmed === runB2.savesConfirmed && leg0.preexistingCurrentEra === runB2.preexistingCurrentEra &&
        leg0.submittedUnverified === runB2.submittedUnverified && leg0.failed === runB2.failed &&
        leg1.sampledCaptures === runB2.sampleSize && leg1.cdxDigestVerified === runB2.sampleDigestVerified &&
        runB2.confirmed === runB2.savesConfirmed + runB2.preexistingCurrentEra && waveRowsOk;
      ar7detail = 'reportSha=' + rep2Sha.slice(0, 16) + ', waveRows=' + waveRows.length + ', runConfirmed=' + runB2.confirmed + ', kid=' + hdr2.kid;
    } catch (e) { ar7detail = e.message; }
    check('AR-7 the signed E6-B2 verification report stands beside the index at the wave run record’s URL, its bytes hash to the run-recorded SHA-256, its detached JWS verifies against the published JWKS, its leg tallies equal the run record’s, and every wave capture row carries verified fixity under the pre-B2 seal’s manifest version',
      ar7ok, ar7detail);
  } catch (e) {
    check('archive registry dataset checks (AR-1..AR-7) evaluated', false, e.message);
  }

  // --- 24. Parseability sweep — Batch Parseability Sweep (2026-11-01; checks PS-1..PS-4) ---
  // Pins the sweep's findings so they cannot regress: every ld+json
  // block in the source shell parses (the #page-jsonld slot carries a
  // seeded valid document, replaced per route at generation); every
  // ld+json block in every route document in the deploy tree parses;
  // every JSON file in the deploy tree parses; llms.txt represents
  // every sitemap page. Record:
  // out/batch-parseability-sweep-2026-11-01/records/BATCH-PARSEABILITY-SWEEP-RECORD.md.
  try {
    const ldRe = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
    const parseBlocks = (text) => {
      let n = 0, bad = 0;
      for (const m of text.matchAll(ldRe)) {
        n++;
        try { JSON.parse(m[1]); } catch (e) { bad++; }
      }
      return { n, bad };
    };
    const shellText = fs.readFileSync(path.join(ROOT, 'repo-dir', 'index.html'), 'utf8');
    const shellBlocks = parseBlocks(shellText);
    check('PS-1 every ld+json block in the source shell parses as JSON, including the seeded #page-jsonld slot',
      shellBlocks.bad === 0 && shellBlocks.n >= 80 &&
      shellText.includes('<script type="application/ld+json" id="page-jsonld">{"@context":"https://schema.org","@graph":[]}</script>'),
      'blocks=' + shellBlocks.n + ', unparseable=' + shellBlocks.bad);
    const smXml = fs.readFileSync(path.join(PAGES_PUBLIC, 'sitemap.xml'), 'utf8');
    const locs = [...smXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
    const pageLocs = locs.filter((u) => !/\.(json|jsonld|geojson|txt)$/.test(u));
    let routeBad = 0, routeBlocks = 0, routeDocs = 0;
    for (const u of pageLocs) {
      const rel = u.replace('https://theflatratemovers.com', '').replace(/^\//, '');
      const fp = path.join(PAGES_PUBLIC, rel, 'index.html');
      const t = fs.readFileSync(fp, 'utf8');
      const r = parseBlocks(t);
      routeDocs++; routeBlocks += r.n; routeBad += r.bad;
    }
    check('PS-2 every ld+json block in every route document in the deploy tree parses as JSON',
      routeBad === 0 && routeDocs === pageLocs.length && routeDocs >= 210,
      'docs=' + routeDocs + ', blocks=' + routeBlocks + ', unparseable=' + routeBad);
    let jsonFiles = 0, jsonBad = [];
    const walkJson = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walkJson(p);
        else if (/\.(json|jsonld|geojson)$/.test(e.name)) {
          jsonFiles++;
          try { JSON.parse(fs.readFileSync(p, 'utf8')); } catch (err) { jsonBad.push(e.name); }
        }
      }
    };
    walkJson(PAGES_PUBLIC);
    check('PS-3 every JSON file in the deploy tree parses as JSON',
      jsonBad.length === 0 && jsonFiles >= 250,
      'files=' + jsonFiles + ', unparseable=' + jsonBad.slice(0, 3).join(','));
    const llmsText = fs.readFileSync(path.join(PAGES_PUBLIC, 'llms.txt'), 'utf8');
    const unrepresented = pageLocs.filter((u) => !llmsText.includes(u));
    check('PS-4 llms.txt represents every sitemap page URL',
      unrepresented.length === 0,
      'pages=' + pageLocs.length + ', unrepresented=' + unrepresented.slice(0, 3).join(','));
  } catch (e) {
    check('parseability sweep checks (PS-1..PS-4) evaluated', false, e.message);
  }

  // --- 9. Guardrail scan: no placeholders, no invented license identifiers ---
  const registryText = JSON.stringify({ pages, services, locations, corridors });
  check('registry files contain no placeholder text',
    !/lorem|placeholder|TODO|TBD|XXX/i.test(registryText));
  check('registry files contain no USDOT/MC number (unconfirmed, never publish)',
    !/USDOT|MC-\d{4,}/i.test(registryText));

  const failed = results.filter((r) => !r.ok);
  if (LOCAL) {
    console.log('\n' + results.filter((r) => r.ok).length + '/' + results.length + ' local checks passed; ' +
      skippedLive.length + ' live-only checks skipped by name above (full suite: ' + (results.length + skippedLive.length) + ' checks).');
    if (failed.length) {
      console.log('FAILED CHECKS:');
      for (const f of failed) console.log('  - ' + f.name);
      console.log('LOCAL VERIFY FAILED — fix the data, not the checks.');
      process.exit(1);
    }
    console.log('LOCAL VERIFY OK — disk evidence only. This is NOT the closing gate: a batch closes only on the full live run (node verify.js).');
    return;
  }
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
