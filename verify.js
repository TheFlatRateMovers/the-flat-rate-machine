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

  // --- 2. Live sitemap architecture (fetched fresh, not from disk) ---
  // Rewritten by Batch Dataset Discoverability, 2026-10-30 (record:
  // out/verify-fix-2026-10-30-dataset-discoverability.md): the
  // sitemap now also lists the published dataset files (Dataset
  // Search + Common Crawl discoverability), so the expected live
  // set is pages.json URLs + dataset-file URLs, both derived —
  // stricter than the old pages-only premise, which this approved
  // batch superseded. Check names say what they now assert.
  // Rewritten again by Batch Sitemap Architecture, 2026-11-02:
  // sitemap.xml is now a sitemap INDEX over three section sitemaps
  // (pages / datasets / blog) plus the Google News sitemap (Spec A);
  // the set-equality checks run against the UNION of the sections,
  // and a new check pins the index structure itself. Section
  // assignment rule (declared in scripts/build-sitemap.js): datasets
  // = /datasets/ registry pages + dataset files; blog = the blog hub
  // + published ledger posts; pages = every remaining registry page.
  const SECTION_URLS_SM = [
    'https://theflatratemovers.com/sitemaps/pages.xml',
    'https://theflatratemovers.com/sitemaps/datasets.xml',
    'https://theflatratemovers.com/sitemaps/blog.xml',
  ];
  const NEWS_SM_URL = 'https://theflatratemovers.com/news-sitemap.xml';
  if (LOCAL) {
    skipLive('live sitemap index fetched');
    skipLive('live sitemap.xml is a sitemap index referencing exactly the three section sitemaps and the news sitemap');
    skipLive('every pages.json URL is in the live sitemap');
    skipLive('every live sitemap URL is a registry page or a published dataset file');
    skipLive('live sitemap URL count matches registry + dataset files');
  }
  let liveUrls = null;
  if (!LOCAL) {
    try {
      const indexXml = await fetchText(LIVE_SITEMAP);
      const children = [...indexXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
      const expectedChildren = [...SECTION_URLS_SM, NEWS_SM_URL];
      check('live sitemap index fetched', indexXml.includes('<sitemapindex'), children.length + ' children');
      check('live sitemap.xml is a sitemap index referencing exactly the three section sitemaps and the news sitemap',
        children.length === expectedChildren.length && expectedChildren.every((u) => children.includes(u)),
        'children=' + children.join(', '));
      liveUrls = new Set();
      for (const u of SECTION_URLS_SM) {
        const sx = await fetchText(u);
        for (const m of sx.matchAll(/<loc>(.*?)<\/loc>/g)) liveUrls.add(m[1].trim());
      }
    } catch (e) {
      check('live sitemap index fetched', false, e.message);
      liveUrls = null;
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
    const aiUrls = (stagedAi.pages || []).map((p) => p.url); // WS2 (2026-11-02): inventory key renamed hasPart -> pages (Google Dataset profile: hasPart = URL or Dataset only)
    check('staged ai-sitemap services count matches services.json', (stagedAi.services || []).length === services.services.length,
      'staged=' + (stagedAi.services || []).length + ', registry=' + services.services.length);
    check('staged ai-sitemap pages count matches pages.json', (stagedAi.pages || []).length === pages.pages.length,
      'staged=' + (stagedAi.pages || []).length + ', registry=' + pages.pages.length);
    check('staged ai-sitemap pages URLs are all registry URLs',
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
    skipLive('P-5 certificate covers all 231 per-page JSONs + all 231 route documents + llms-full.txt + the site shell + the deployed code sets (544 distributions)');
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
      'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/code/api-worker/src-index.js',
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
      p5ok = !!servedIndex && pageFiles.length === 231 && missingPages.length === 0 && missingCode.length === 0 &&
        missingRoutes.length === 0 && hasLlmsFull &&
        (servedIndex.distribution || []).length === 544; // 229 -> 231 and 539 -> 544 re-expressed 2026-11-03 (VC-1 Vault Case Study): +2 pages (the vault door case-study post + the vault-door-case-study dataset landing), +5 distributions (post route document + per-page JSON, dataset file, landing route document + per-page JSON); 226 -> 227 and 530 -> 534 re-expressed 2026-11-02 (Ports P1 Foundation): +1 page (the /datasets/ports/ landing), +4 distributions (dataset file, landing JSON, route document, build-ports.js); 534 -> 535 re-expressed 2026-11-02 (Pulse): +1 distribution (the estate update feed, updates.xml); 227 -> 228 and 535 -> 537 re-expressed 2026-11-02 (Ports P2): +1 page (the Virginia Inland Port 3PL spoke), +2 distributions (spoke per-page JSON, spoke route document); 228 -> 229 and 537 -> 539 re-expressed 2026-11-02 (Ports P2 article A1): +1 page (who unloads containers at the Virginia Inland Port), +2 distributions (article per-page JSON, article route document)
      p5detail = 'pageFiles=' + pageFiles.length + ', missingPages=' + (missingPages.join(',') || '0') +
        ', missingCode=' + (missingCode.join(',') || '0') + ', missingRoutes=' + (missingRoutes.slice(0, 3).join(',') || '0') +
        ', llmsFull=' + hasLlmsFull + ', distributions=' + (servedIndex ? (servedIndex.distribution || []).length : 0);
    } catch (e) { p5ok = false; p5detail = e.message; }
    check('P-5 certificate covers all 231 per-page JSONs + all 231 route documents + llms-full.txt + the site shell + the deployed code sets (544 distributions)',
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

  // --- 12. Structural — Batch 9 (2026-10-29; checks S-1..S-7) ---
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
        try {
          // FB-3 re-expression (2026-11-03, GATE-SPEC s3): the served
          // page-jsonld is the head-data ld AFTER the seal's stamp
          // transform, so byte equality against raw head-data no longer
          // holds by design. The identity assertion now covers
          // everything except the three FB-3-owned date fields on
          // page-class nodes (masked on both sides); the fields' actual
          // values are asserted MORE strongly by S-7a/S-7b against the
          // ledger and the signed-index lineage.
          const maskS3 = (doc) => {
            for (const n of (doc && doc['@graph']) || []) {
              const t = n && n['@type'];
              const ts = Array.isArray(t) ? t : [t];
              if (ts.includes('WebPage') || ts.includes('Article') || ts.includes('ProfilePage')) {
                delete n.datePublished; delete n.dateModified; delete n.dateCreated;
              }
            }
            return doc;
          };
          ldOk = !!ld && JSON.stringify(maskS3(JSON.parse(ld))) === JSON.stringify(maskS3(JSON.parse(e.ld)));
        } catch (_) {}
        if (title !== e.t || canon !== e.c || !ldOk || !headPart.includes('data-page-json="' + e.jf + '"')) s3bad.push(route);
      } catch (err) { s3bad.push(route + ' (' + err.message + ')'); }
    }
    if (LOCAL) skipLive('S-3 live routes serve their own head (title + canonical + page JSON-LD + per-page JSON) on the defined route set');
    else check('S-3 live routes serve their own head (title + canonical + page JSON-LD + per-page JSON) on the defined route set',
      s3bad.length === 0, routeSet.length + ' routes' + (s3bad.length ? ', bad: ' + s3bad.join(', ') : ''));
    // S-4: sitemap lastmod TRUTH — rewritten stricter by the Crawl Demand
    // batch, 2026-11-02 (supersedes the format/blanket sanity below it in
    // history): every live sitemap <lastmod> must EQUAL the seal-maintained
    // ledger (data/lastmod-ledger.json) for that URL; the ledger must cover
    // the sitemap union exactly; its seal anchor (the index SHA phase 6b
    // stamped against) must match the installed index while the live index
    // matches it distribution-for-distribution; and every union URL whose
    // distribution changed in the last recorded transition (the seal-work
    // prior-index snapshot -> the installed index) must carry the last
    // seal's date. Truth by construction, recomputed here from the chain.
    if (LOCAL) {
      skipLive('S-4 live sitemap lastmod values equal the seal-maintained ledger for every URL (format/range valid; ledger covers the union exactly; seal anchor + last-transition recompute clean)');
    } else {
    try {
      const cryptoS4 = require('crypto');
      const indexXmlS4 = await fetchText(LIVE_SITEMAP);
      const sectionUrlsS4 = [...indexXmlS4.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim())
        .filter((u) => u.includes('/sitemaps/'));
      const liveMods = new Map();
      for (const u of sectionUrlsS4) {
        const sx = await fetchText(u);
        for (const block of sx.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
          const loc = (block[1].match(/<loc>(.*?)<\/loc>/) || [])[1];
          const lm = (block[1].match(/<lastmod>(.*?)<\/lastmod>/) || [])[1];
          if (loc) liveMods.set(loc.trim(), (lm || '').trim());
        }
      }
      const ledgerS4 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lastmod-ledger.json'), 'utf8'));
      const led = ledgerS4.urls || {};
      const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const fmtOk = [...liveMods.values()].every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d)) && d >= '2026-10-28' && d <= todayET);
      const mismatch = [...liveMods.entries()].filter(([u, d]) => led[u] !== d).map(([u]) => u);
      const uncovered = Object.keys(led).filter((u) => !liveMods.has(u));
      const localIndexBuf = fs.readFileSync(path.join(PAGES_PUBLIC, 'ai-master-index.json'));
      const localIndexSha = cryptoS4.createHash('sha256').update(localIndexBuf).digest('hex');
      const localIdx = JSON.parse(localIndexBuf.toString('utf8'));
      const liveIdx = JSON.parse(await fetchText('https://theflatratemovers.com/ai-master-index.json'));
      const mapOf = (ix) => { const m = new Map(); for (const e of ix.distribution || []) m.set(e.contentUrl, (e.digest || {}).value); return m; };
      const liveMap = mapOf(liveIdx), localMap = mapOf(localIdx);
      const mapsEqual = liveMap.size === localMap.size && [...liveMap].every(([u, d]) => localMap.get(u) === d);
      const anchorOk = mapsEqual && !!ledgerS4.lastSeal && ledgerS4.lastSeal.indexSha256 === localIndexSha;
      let transBad = [];
      if (anchorOk) {
        const prior = JSON.parse(fs.readFileSync(path.join(ROOT, 'out', 'seal-work', 'prior-index.json'), 'utf8'));
        const priorMap = mapOf(prior);
        for (const [u, d] of localMap) {
          if (liveMods.has(u) && priorMap.get(u) !== d && led[u] !== ledgerS4.lastSeal.date) transBad.push(u);
        }
      }
      check('S-4 live sitemap lastmod values equal the seal-maintained ledger for every URL (format/range valid; ledger covers the union exactly; seal anchor + last-transition recompute clean)',
        liveMods.size === pages.pages.length + DATASET_FILES.length && fmtOk && mismatch.length === 0 && uncovered.length === 0 && anchorOk && transBad.length === 0,
        liveMods.size + ' values, ledger=' + Object.keys(led).length + ', mismatch=' + mismatch.length + (mismatch.length ? ' (' + mismatch.slice(0, 3).join(', ') + ')' : '') + ', uncovered=' + uncovered.length + ', anchor=' + (anchorOk ? 'ok' : 'STALE') + ', transition-bad=' + transBad.length + (transBad.length ? ' (' + transBad.slice(0, 3).join(', ') + ')' : ''));
    } catch (e) {
      check('S-4 live sitemap lastmod truth (ledger equality)', false, e.message);
    }
    }
    // S-5: robots.txt carries the explicit AI-crawler groups AND the
    // open-training declaration (Content-Signal in every group + the
    // __usage_ai-training group). Rewritten stricter by Batch Sitemap
    // Extensions, 2026-11-02: the declaration is now part of the gate.
    if (LOCAL) {
      skipLive('S-5 live robots.txt states explicit Allow groups for the 16 AI crawlers + wildcard, the open-training declaration (Content-Signal search=yes, ai-input=yes, ai-train=yes in every group) and the __usage_ai-training group (Allow: /), + sitemap index + news sitemap + llms.txt reference');
    } else {
    try {
      const robots = await fetchText('https://theflatratemovers.com/robots.txt');
      const agents = ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-User', 'anthropic-ai',
        'Google-Extended', 'PerplexityBot', 'Perplexity-User', 'CCBot', 'Applebot-Extended',
        'Meta-ExternalAgent', 'cohere-ai', 'YouBot', 'DuckAssistBot', 'MistralAI-User'];
      const missingAgents = agents.filter((a) => !robots.includes('User-agent: ' + a));
      // Group-level declaration proof: split the file into RFC 9309
      // groups; every group must carry a Content-Signal line whose
      // value holds all three affirmative signals.
      const groupsS5 = [];
      let curS5 = null;
      for (const rawLine of robots.split('\n')) {
        const line = rawLine.trim();
        if (/^user-agent:/i.test(line)) {
          if (!curS5 || curS5.rules.length) { curS5 = { agents: [], rules: [] }; groupsS5.push(curS5); }
          curS5.agents.push(line.split(':').slice(1).join(':').trim());
        } else if (curS5 && /^(allow|disallow|content-signal):/i.test(line)) {
          curS5.rules.push(line);
        }
      }
      const signalOf = (g) => g.rules.find((r) => /^content-signal:/i.test(r)) || '';
      const groupsLacking = groupsS5.filter((g) => {
        const v = signalOf(g);
        return !(v.includes('search=yes') && v.includes('ai-input=yes') && v.includes('ai-train=yes'));
      });
      const usageS5 = groupsS5.find((g) => g.agents.includes('__usage_ai-training'));
      check('S-5 live robots.txt states explicit Allow groups for the 16 AI crawlers + wildcard, the open-training declaration (Content-Signal search=yes, ai-input=yes, ai-train=yes in every group) and the __usage_ai-training group (Allow: /), + sitemap index + news sitemap + llms.txt reference',
        missingAgents.length === 0 && robots.includes('User-agent: *') && robots.includes('Allow: /') &&
        robots.includes('Sitemap: https://theflatratemovers.com/sitemap.xml') &&
        robots.includes('Sitemap: https://theflatratemovers.com/news-sitemap.xml') && robots.includes('llms.txt') &&
        groupsS5.length >= 18 && groupsLacking.length === 0 &&
        !!usageS5 && usageS5.rules.some((r) => /^allow:\s*\/$/i.test(r)),
        missingAgents.length ? 'missing: ' + missingAgents.join(', ') :
          'groups=' + groupsS5.length + ', lacking-signal=' + groupsLacking.length +
          ', usage-group=' + (usageS5 ? 'present' : 'absent'));
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
    // S-7: schema timestamp truth (Batch FB-3, 2026-11-03; DESIGN +
    // GATE-SPEC: out/batch-fb3-schema-timestamps-prep-2026-11-03/).
    // Page-node dates are no longer template constants: the seal's
    // phase-0 stamps map (ledger at seal start + signed-index lineage
    // + the News Formula manifest) drives build-routes' transform, and
    // these checks recompute the truth from the same sources. The
    // authored class (page-class nodes inside per-page JSON) was
    // measured estate-wide at FB-3 execution under GATE-SPEC s7's
    // extension clause — 208 authored nodes in 188 per-page JSONs,
    // corrected to the ledger in the same batch (record:
    // out/batch-fb3-schema-timestamps-2026-11-03/EXECUTION-RECORD.md).
    const S7_PAGE_TYPES = ['WebPage', 'Article', 'ProfilePage'];
    const s7Types = (n) => { const t = n && n['@type']; return Array.isArray(t) ? t : [t]; };
    const s7IsPageClass = (n) => s7Types(n).some((t) => S7_PAGE_TYPES.includes(t));
    const s7Blocks = (html) => {
      const out = [];
      for (const m of html.matchAll(/<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g)) {
        let d = null;
        try { d = JSON.parse(m[2]); } catch (_) { continue; }
        const nodes = d && Array.isArray(d['@graph']) ? d['@graph'] : (d && d['@type'] ? [d] : []);
        out.push({ head: m[1].includes('id="page-jsonld"'), authored: m[1].includes('data-page-json'), nodes });
      }
      return out;
    };
    const s7TreeDoc = (url) => {
      const rel = url.replace('https://theflatratemovers.com', '').replace(/^\//, '');
      return fs.readFileSync(rel === '' ? path.join(PAGES_PUBLIC, 'index.html') : path.join(PAGES_PUBLIC, rel, 'index.html'), 'utf8');
    };
    const s7Ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lastmod-ledger.json'), 'utf8')).urls || {};
    const s7Prior = JSON.parse(fs.readFileSync(path.join(ROOT, 'out', 'seal-work', 'prior-index.json'), 'utf8'));
    const s7Lineage = {}, s7FileLineage = {};
    for (const e of s7Prior.distribution || []) {
      if (e.encodingFormat === 'text/html' && e.dateModified) s7Lineage[e.contentUrl] = e.dateModified;
      if (/\.json$/.test(e.contentUrl || '') && e.dateModified) s7FileLineage[e.contentUrl] = e.dateModified;
    }
    const s7Manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'news-formula.json'), 'utf8'));
    const s7Articles = new Map();
    for (const post of s7Manifest.posts || []) s7Articles.set('https://theflatratemovers.com/' + post.slug + '/', post.instant || post.ledgerDate);
    const s7HeadByUrl = {};
    for (const e of Object.values(HEADMAP)) s7HeadByUrl[e.c] = e;
    const s7DatePart = (v) => typeof v === 'string' ? v.slice(0, 10) : null;
    // S-7a: every governed page-class node's dateModified == ledger.
    try {
      const s7aBad = [];
      const s7aDoc = (url, html, where) => {
        let governed = 0;
        for (const b of s7Blocks(html)) {
          if (!b.head && !b.authored) continue;
          for (const n of b.nodes) {
            if (!s7IsPageClass(n)) continue;
            governed++;
            if (s7DatePart(n.dateModified) !== s7Ledger[url]) s7aBad.push(where + ' ' + url + ' ' + (n['@id'] || n['@type']) + ' dm=' + n.dateModified);
          }
        }
        if (!governed) s7aBad.push(where + ' ' + url + ': no governed page-class node');
      };
      for (const p of pages.pages) {
        try { s7aDoc(p.url, s7TreeDoc(p.url), 'tree'); } catch (e) { s7aBad.push('tree ' + p.url + ' (' + e.message + ')'); }
      }
      if (!LOCAL) {
        const liveSet = new Set(routeSet.map((r) => 'https://theflatratemovers.com' + r));
        for (const u of s7Articles.keys()) liveSet.add(u);
        for (const p of pages.pages) if (p.url.includes('/author/')) liveSet.add(p.url);
        for (const u of liveSet) {
          try { s7aDoc(u, await fetchText(u), 'live'); } catch (e) { s7aBad.push('live ' + u + ' (' + e.message + ')'); }
        }
      }
      check('S-7a every page-class node dateModified equals the seal-maintained ledger value for its page (tree: all route documents; live: S-3 set + articles + author pages)',
        s7aBad.length === 0, s7aBad.length ? s7aBad.slice(0, 6).join(' | ') : 'page-class nodes ledger-true on ' + pages.pages.length + ' pages');
    } catch (e) {
      check('S-7a page-node dateModified equals ledger', false, e.message);
    }
    // S-7b: datePublished integrity + the template-constant tripwire.
    try {
      const s7bBad = [];
      for (const p of pages.pages) {
        let html = null;
        try { html = s7TreeDoc(p.url); } catch (e) { s7bBad.push(p.url + ' (' + e.message + ')'); continue; }
        const expected = s7Articles.has(p.url) ? String(s7Articles.get(p.url)).slice(0, 10) : s7Lineage[p.url];
        const jfUrl = 'https://theflatratemovers.com/' + ((s7HeadByUrl[p.url] || {}).jf || '');
        for (const b of s7Blocks(html)) {
          if (!b.head && !b.authored) continue;
          for (const n of b.nodes) {
            if (!s7IsPageClass(n)) continue;
            if (n.datePublished === '2026-10-27' || n.dateModified === '2026-10-28') s7bBad.push(p.url + ' ' + (n['@id'] || n['@type']) + ': template constant survives');
            if (b.head) {
              if (expected ? n.datePublished !== expected : n.datePublished !== undefined) {
                s7bBad.push(p.url + ' ' + (n['@id'] || n['@type']) + ' dp=' + n.datePublished + ' expected ' + expected);
              }
            } else if (n.datePublished !== undefined && n.datePublished !== s7Lineage[p.url] && n.datePublished !== s7FileLineage[jfUrl]) {
              s7bBad.push(p.url + ' ' + (n['@id'] || n['@type']) + ' authored dp=' + n.datePublished + ' matches neither page lineage ' + s7Lineage[p.url] + ' nor file lineage ' + s7FileLineage[jfUrl]);
            }
          }
        }
      }
      const shellS7 = fs.readFileSync(path.join(ROOT, 'repo-dir', 'index.html'), 'utf8');
      if (shellS7.includes('"datePublished":"2026-10-27"') || shellS7.includes('"dateModified":"2026-10-28"')) s7bBad.push('source shell still carries a template date constant');
      if (headSrc.includes('"datePublished":"2026-10-27"') || headSrc.includes('"dateModified":"2026-10-28"')) s7bBad.push('head-data still carries a template date constant');
      check('S-7b page-node datePublished equals manifest (articles) or signed-index lineage; authored values match a provable lineage; template constants absent from tree and source',
        s7bBad.length === 0, s7bBad.length ? s7bBad.slice(0, 6).join(' | ') : 'datePublished lineage-true on ' + pages.pages.length + ' pages');
    } catch (e) {
      check('S-7b page-node datePublished integrity', false, e.message);
    }
    // S-7c: BlogPosting values byte-equal the News Formula manifest.
    try {
      const s7cBad = [];
      for (const [u, expected] of s7Articles) {
        let html = null;
        try { html = s7TreeDoc(u); } catch (e) { s7cBad.push(u + ' (' + e.message + ')'); continue; }
        let bp = null;
        for (const b of s7Blocks(html)) for (const n of b.nodes) if (s7Types(n).includes('BlogPosting')) bp = n;
        if (!bp) { s7cBad.push(u + ': no BlogPosting node'); continue; }
        if (bp.datePublished !== expected || bp.dateModified !== expected) s7cBad.push(u + ': BlogPosting ' + bp.datePublished + ' / ' + bp.dateModified + ' != manifest ' + expected);
      }
      check('S-7c BlogPosting datePublished/dateModified byte-equal the News Formula manifest for every article',
        s7cBad.length === 0, s7cBad.length ? s7cBad.slice(0, 6).join(' | ') : s7Articles.size + ' articles manifest-true');
    } catch (e) {
      check('S-7c BlogPosting manifest equality', false, e.message);
    }
    // S-7d: datetime format validity across every route document.
    try {
      const S7_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
      const S7_FULL_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
      const s7ValidDateOnly = (v) => { if (!S7_DATE_ONLY.test(v)) return false; const d = new Date(v + 'T00:00:00Z'); return !isNaN(d) && d.toISOString().slice(0, 10) === v; };
      const s7ValidFull = (v) => S7_FULL_ISO.test(v) && !isNaN(Date.parse(v));
      const s7dBad = [];
      const s7Walk = (o, url, types) => {
        if (Array.isArray(o)) { for (const v of o) s7Walk(v, url, types); return; }
        if (!o || typeof o !== 'object') return;
        const myTypes = o['@type'] ? s7Types(o) : types;
        for (const f of ['datePublished', 'dateModified', 'dateCreated']) {
          if (!(f in o)) continue;
          const v = o[f];
          const strict = myTypes.includes('ProfilePage') && (f === 'dateCreated' || f === 'dateModified');
          const ok = typeof v === 'string' && (strict ? s7ValidFull(v) : (s7ValidDateOnly(v) || s7ValidFull(v)));
          if (!ok) s7dBad.push(url + ' ' + (o['@id'] || o['@type'] || '?') + ' ' + f + '=' + v);
        }
        for (const v of Object.values(o)) s7Walk(v, url, myTypes);
      };
      for (const p of pages.pages) {
        let html = null;
        try { html = s7TreeDoc(p.url); } catch (e) { s7dBad.push(p.url + ' (' + e.message + ')'); continue; }
        for (const b of s7Blocks(html)) for (const n of b.nodes) s7Walk(n, p.url, []);
      }
      check('S-7d every date value in every route document is a real date-only or full-ISO-8601-with-offset form; ProfilePage dateCreated/dateModified carry the full form',
        s7dBad.length === 0, s7dBad.length ? s7dBad.slice(0, 6).join(' | ') : 'all date values well-formed');
    } catch (e) {
      check('S-7d datetime format validity', false, e.message);
    }
    // S-7e: no duplicate-@id date divergence within a document.
    try {
      const s7eBad = [];
      for (const p of pages.pages) {
        let html = null;
        try { html = s7TreeDoc(p.url); } catch (e) { s7eBad.push(p.url + ' (' + e.message + ')'); continue; }
        const byId = new Map();
        for (const b of s7Blocks(html)) for (const n of b.nodes) {
          if (!n || !n['@id'] || Object.keys(n).length <= 1) continue;
          if (!byId.has(n['@id'])) byId.set(n['@id'], []);
          byId.get(n['@id']).push(n);
        }
        for (const [id, ns] of byId) {
          if (ns.length < 2) continue;
          for (const f of ['datePublished', 'dateModified', 'dateCreated']) {
            const vals = new Set(ns.filter((n) => f in n).map((n) => n[f]));
            if (vals.size > 1) s7eBad.push(p.url + ' ' + id + ' ' + f + ': ' + [...vals].join(' vs '));
          }
        }
      }
      check('S-7e no two nodes sharing an @id in a route document carry divergent date values (reference stubs exempt)',
        s7eBad.length === 0, s7eBad.length ? s7eBad.slice(0, 6).join(' | ') : 'no duplicate-@id date divergence');
    } catch (e) {
      check('S-7e duplicate-@id date divergence', false, e.message);
    }
  } catch (e) {
    check('structural Batch 9 checks (S-1..S-7) evaluated', false, e.message);
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
    const qI = (sql) => execFileSync('sqlite3', ['-json', dbPathI, sql], { maxBuffer: 64 * 1024 * 1024 }).toString(); // maxBuffer raised 2026-11-02 (Ports P2): the 3,373-row intent table outgrew the 1 MB default (spawnSync ENOBUFS); matches the section-13 v2 block
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
    check('I-4 published intent-coverage dataset counts and row digest equal rubric.db (totals node + 30 coverage nodes)',
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
    // Era/window span (2026-11-02, Ports P2): the overlay can hold
    // several import batches; the generator's summary window is the
    // full observed span and its era derives from that span against
    // the 2026-10-29 rebuild cutover (eraForWindow in the generator).
    const spanV = oneV('SELECT MIN(window_start) AS ws, MAX(window_end) AS we FROM gsc_observed_queries;');
    const eraForSpanV = (ws, we) => (we && we < '2026-10-29') ? 'pre-rebuild' : (ws && ws >= '2026-10-29') ? 'current' : 'transition';
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
      metaV.evidence_era === eraForSpanV(spanV.ws, spanV.we) &&
      metaV.evidence_window === String(spanV.ws) + '/' + String(spanV.we) &&
      parseInt(metaV.evidence_queries_attached, 10) === countsV.ev_attached;
    check('I-6 rubric v2 generator version, source accounting (v1 + page-derived + roll-up = total), full page-registry target coverage and evidence window reconcile',
      i6ok, 'generator ' + metaV.generator_version + ' / schema ' + metaV.schema_version + '; rows=' + countsV.rows_n +
        ' (v1 ' + (countsV.rows_n - (genSummaryV.pageDerived.rowsEmitted || 0) - (genSummaryV.rollup.rowsEmitted || 0)) +
        ' + page-derived ' + genSummaryV.pageDerived.rowsEmitted + ' + roll-up ' + genSummaryV.rollup.rowsEmitted + '); coverage ' +
        metaV.target_pages_covered + '/' + metaV.target_pages_total + '; window ' + metaV.evidence_window + '; attached queries ' + countsV.ev_attached);

    // I-7: evidence attachments are era-tagged, metric-true, gated to existed-in-window + still-live targets.
    const evJoinV = oneV("SELECT " +
      "SUM(CASE WHEN e.era != (CASE WHEN e.window_end < '2026-10-29' THEN 'pre-rebuild' WHEN e.window_start >= '2026-10-29' THEN 'current' ELSE 'transition' END) THEN 1 ELSE 0 END) AS bad_era, " +
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
    check('I-7 v2 evidence attachments are era-tagged by import window (pre-rebuild / transition / current against the 2026-10-29 cutover; re-expressed 2026-11-02, Ports P2), metric-true to the import, and attach only to rows whose target existed in the window and is still live',
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
    check('I-9 published intent dataset v2 fields reconcile with the database (38-node frame, row sources with gscObservedRows=0, era-tagged evidence block, outcome roll-up + digest, full page coverage, per-area rows over all 53 GeoJSON features)',
      graphV.length === 38 && d8okV && covBadV.length === 0 && !!d6V && /pre-rebuild/.test(d6V.description),
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
    check('D-2 every Dataset node (dataset files + all 229 route documents) carries landing url/unique sameAs, an identifier, isAccessibleForFree, typed distributions and a self-referencing DataDownload',
      badNodesD.length === 0 && shellCountD === 374 && routeDocsD.length === 231, // 372 -> 374 and 229 -> 231 re-expressed 2026-11-03 (VC-1 Vault Case Study): +2 Dataset instances = the summary + case-record nodes of datasets-vault-door-case-study.json embedded in its landing route document; +2 route documents = the case-study post and the dataset landing; build-routes.js D-2 pin moved in the same motion // 368 -> 372 and 226 -> 227 re-expressed 2026-11-02 (Ports P1 Foundation): +4 Dataset instances = the ports master + coverage-matrix nodes of datasets-ports.json embedded in two route documents (the /datasets/ports/ landing and the /transloading/ hub); +1 route document = the ports landing; build-routes.js D-2 pin moved in the same motion; 227 -> 228 route documents re-expressed 2026-11-02 (Ports P2): +1 route document = the Virginia Inland Port 3PL spoke (its graph carries no Dataset node, so the 372 shell count stands); build-routes.js D-2 pin reviewed in the same motion (count unchanged); 228 -> 229 route documents re-expressed 2026-11-02 (Ports P2 article A1): +1 route document = the A1 article (its graph carries no Dataset node, so the 372 shell count stands)
      'files + ' + shellCountD + ' route-document instances across ' + routeDocsD.length + ' documents' + (badNodesD.length ? ', bad: ' + badNodesD.slice(0, 4).join('; ') : ''));
    // D-3: local sitemap architecture — sitemap.xml is an index whose
    // children are exactly the three section sitemaps plus the news
    // sitemap, and the sections' URL union equals registry pages +
    // dataset files. (Rewritten by Batch Sitemap Architecture,
    // 2026-11-02; the news sitemap itself is pinned by §26 NS checks,
    // never by membership in this set.)
    const localIndexD = fs.readFileSync(path.join(PAGES_PUBLIC, 'sitemap.xml'), 'utf8');
    const indexChildrenD = [...localIndexD.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
    const expectedChildrenD = [
      SITE_D + '/sitemaps/pages.xml', SITE_D + '/sitemaps/datasets.xml',
      SITE_D + '/sitemaps/blog.xml', SITE_D + '/news-sitemap.xml',
    ];
    const localUrlsD = new Set();
    for (const child of indexChildrenD.filter((u) => u.includes('/sitemaps/'))) {
      const relD = child.replace(SITE_D + '/', '');
      const sxD = fs.readFileSync(path.join(PAGES_PUBLIC, relD), 'utf8');
      for (const m of sxD.matchAll(/<loc>(.*?)<\/loc>/g)) localUrlsD.add(m[1].trim());
    }
    const expectedD = new Set([...pageUrlsD, ...dsFilesD.map((f) => SITE_D + '/' + f)]);
    const d3missing = [...expectedD].filter((u) => !localUrlsD.has(u));
    const d3extra = [...localUrlsD].filter((u) => !expectedD.has(u));
    check('D-3 local sitemap architecture: the index references exactly the three section sitemaps plus the news sitemap, and the section URL union equals pages.json URLs plus the published dataset files',
      localIndexD.includes('<sitemapindex') &&
      indexChildrenD.length === expectedChildrenD.length && expectedChildrenD.every((u) => indexChildrenD.includes(u)) &&
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
  // all 30 service names present; no placeholder braces and none of
  // the invented-string patterns the gate exists to keep out).
  if (LOCAL) {
    skipLive('L-1 llms-full.txt is served live as a text file');
    skipLive('L-2 llms-full.txt is a sealed distribution in the signed index (digest matches the served bytes)');
    skipLive('L-3 llms.txt links llms-full.txt');
    skipLive('L-4 llms-full.txt content integrity (30 service names + both branch names present; no placeholders or invented strings)');
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
    check('L-4 llms-full.txt content integrity (30 service names + both branch names present; no placeholders or invented strings)',
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
  // panel standing is MEASURED and published per method (Answer Panel
  // first runs ingested 2026-11-01/02), so AE-2 — rewritten stricter
  // in the same motion, 2026-11-02, Element 2 fragment-binding batch —
  // requires every observation to carry method + era + prompt
  // verbatim, admits only the search-surface and prompt-panel methods
  // (any other method fails), reconciles the prompt-panel rows
  // EXACTLY with the validated panel input file (same count, same
  // observationId set), recomputes the published panel state from the
  // rows, and requires blocked cells to be recorded unscored — a
  // panel row not backed by the input file fails the suite. AE-3
  // proves every fragment's evidence digests equal the served signed
  // index and every text hash recomputes from its text.
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
    const badMethodAE = obsAE.filter((o) => o.method !== 'search-surface' && o.method !== 'prompt-panel');
    const panelObsAE = obsAE.filter((o) => o.method === 'prompt-panel');
    const searchObsAE = obsAE.filter((o) => o.method === 'search-surface');
    const panelAE = totAE.panelState || {};
    // AE-2 panel reconciliation (rewritten 2026-11-02, fragment-binding
    // batch, per PANEL-INGEST-DESIGN.md §7): the dataset's prompt-panel
    // rows must reconcile EXACTLY with the panel input file read via
    // paths.json — same count, same observationId set — and the
    // published panelState must recompute from the rows themselves.
    let panelFileAE = null, panelFileErrAE = '';
    try {
      panelFileAE = JSON.parse(fs.readFileSync(regAE.panel_observations_file, 'utf8'));
    } catch (e) { panelFileErrAE = String(e.message).slice(0, 120); }
    const filePanelIdsAE = new Set(panelFileAE ? (panelFileAE.rows || []).filter((r) => r.method === 'prompt-panel').map((r) => r.observationId) : []);
    const dsPanelIdsAE = new Set(panelObsAE.map((o) => o.observationId));
    const panelReconAE = !!panelFileAE && filePanelIdsAE.size === dsPanelIdsAE.size &&
      [...filePanelIdsAE].every((id) => dsPanelIdsAE.has(id));
    const runIdsAE = new Set(panelObsAE.map((o) => o.runId));
    const panelStateOkAE = panelAE.panelRuns === runIdsAE.size &&
      panelAE.promptPanelObservations === panelObsAE.length &&
      panelAE.answerUiObservations === panelObsAE.length &&
      panelAE.searchSurfaceObservations === searchObsAE.length &&
      panelAE.braveSerpObservations === 0 && panelAE.consoleObservations === 0;
    const panelFieldBadAE = panelObsAE.filter((o) => !o.surface || !o.accessMode || !o.completionState || !o.runnerRef ||
      (o.completionState === 'blocked' && (!o.ourCited || o.ourCited.cited !== false || !o.panelScores || o.panelScores.mentioned !== null)));
    let regenAE = false, regenDetailAE = '';
    try {
      execAE('node', [path.join(ROOT, 'scripts', 'build-answer-evidence.js'), '--check'], { maxBuffer: 64 * 1024 * 1024 });
      regenAE = true;
    } catch (e) { regenDetailAE = String(e.message).slice(0, 160); }
    check('AE-2 every citation observation carries method + era + verbatim prompt and an admissible method (search-surface or prompt-panel only), the prompt-panel rows reconcile exactly with the panel input file, the published panel state recomputes from the rows, blocked cells are recorded unscored, and the dataset regenerates byte-identical from the live estate',
      badObsAE.length === 0 && badMethodAE.length === 0 && panelReconAE && panelStateOkAE && panelFieldBadAE.length === 0 && regenAE,
      'observations=' + obsAE.length + ', missingDiscipline=' + badObsAE.length + ', inadmissibleMethods=' + badMethodAE.length +
      ', panelRows=' + panelObsAE.length + ', panelFileRows=' + filePanelIdsAE.size + ', panelReconciled=' + panelReconAE +
      ', panelRuns=' + panelAE.panelRuns + ', panelStateRecomputes=' + panelStateOkAE + ', panelFieldViolations=' + panelFieldBadAE.length +
      ', regenerated=' + regenAE + (panelFileErrAE ? ', panelFile=' + panelFileErrAE : '') + (regenDetailAE ? ', ' + regenDetailAE : ''));
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
  // the corpus (DC-5). Corpus: the 39 dataset files, the 37
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
  // entries must each carry the full 22-field shape, chain by digest
  // and carry signatures that verify against the published JWKS key,
  // with the latest entry digest-matching the served file (CP-3).
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
      policyCP.contentSignalSearch === 'yes' && policyCP.contentSignalAiInput === 'yes' &&
      policyCP.contentSignalAiTrain === 'yes' && (policyCP.usageTokenAiTraining || {}).state === 'present' &&
      (((policyCP.usageTokenAiTraining || {}).groups || [])[0] || { rules: [] }).rules
        .some((r) => r.type === 'Allow' && r.value === '/'),
      'liveDigest=' + liveDigestCP.slice(0, 12) + ', agents=' + (policyCP.agents || []).length + '/' + liveGroupsCP +
      ', drift=' + ((policyCP.driftGate || {}).result || 'missing'));
    // CP-3: the signal-observation log — every entry's shape, the
    // hash chain, every signature, and the LATEST entry against the
    // live file. (Rewritten stricter by Batch Sitemap Architecture,
    // 2026-11-02: the log gained its second entry when robots.txt
    // deliberately changed — the news-sitemap Sitemap line — so the
    // genesis-only form, which pinned the genesis entry's body digest
    // as the drift evidence, would have failed the deliberate change
    // or, worse, been waived. The gate now follows the chain.)
    const FIELDS_CP = ['entry_id', 'schema_version', 'observed_at', 'capturing_agent', 'mechanism', 'signal_url', 'scope', 'scope_value', 'http_status', 'response_headers_digest', 'body_digest', 'body_byte_size', 'raw_artifact_uri', 'parsed_directives', 'spec_version', 'archive_snapshot_uri', 'change_ref', 'effective_from', 'effective_to', 'prev_entry_digest', 'entry_digest', 'signature', 'signing_key_id'];
    let chainOkCP = true, sigAllOkCP = true, sigDetailCP = '';
    try {
      const jwksCP = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, '.well-known', 'signing-keys.json'), 'utf8'));
      const keyCP = (jwksCP.keys || []).find((k) => k.kid === 'theflatratemovers-2026-10-29-1');
      const pubCP = cryptoCP.createPublicKey({ key: { kty: keyCP.kty, crv: keyCP.crv, x: keyCP.x }, format: 'jwk' });
      const idsCP = new Set();
      sigsCP.forEach((e, i) => {
        if (!FIELDS_CP.every((f) => Object.prototype.hasOwnProperty.call(e, f)) ||
            !Object.prototype.hasOwnProperty.call(e, 'timestamp_token') || e.timestamp_token !== null ||
            e.http_status !== 200 || e.signing_key_id !== 'theflatratemovers-2026-10-29-1' ||
            idsCP.has(e.entry_id)) chainOkCP = false;
        idsCP.add(e.entry_id);
        if (i === 0) { if (e.prev_entry_digest !== null) chainOkCP = false; }
        else if (e.prev_entry_digest !== sigsCP[i - 1].entry_digest) chainOkCP = false;
        let okE = false;
        try {
          okE = cryptoCP.verify(null, Buffer.from(e.entry_digest || '', 'hex'), pubCP,
            Buffer.from(e.signature || '', 'base64url'));
        } catch (err) { sigDetailCP = String(err.message).slice(0, 120); }
        if (!okE) sigAllOkCP = false;
      });
    } catch (e) { chainOkCP = false; sigAllOkCP = false; sigDetailCP = String(e.message).slice(0, 120); }
    const latestCP = sigsCP[sigsCP.length - 1] || {};
    check('CP-3 the signal-observation log is a signed hash chain: every entry carries the full 22-field shape (plus the unpopulated optional timestamp_token), the genesis entry chains from null, each later entry chains to its predecessor, entry ids are unique, every Ed25519 signature verifies against the published JWKS key, and the latest entry\u2019s body digest equals the live robots.txt digest',
      sigsCP.length === totCP.signalObservations && sigsCP.length >= 1 && chainOkCP && sigAllOkCP &&
      latestCP.body_digest === liveDigestCP,
      'entries=' + sigsCP.length + ', chainOk=' + chainOkCP + ', signaturesVerify=' + sigAllOkCP + (sigDetailCP ? ', ' + sigDetailCP : ''));
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
    const smIndexPS = fs.readFileSync(path.join(PAGES_PUBLIC, 'sitemap.xml'), 'utf8');
    const sectionFilesPS = [...smIndexPS.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim())
      .filter((u) => u.includes('/sitemaps/'));
    let locs = [];
    for (const u of sectionFilesPS) {
      const relPS = u.replace('https://theflatratemovers.com/', '');
      const sxPS = fs.readFileSync(path.join(PAGES_PUBLIC, relPS), 'utf8');
      locs = locs.concat([...sxPS.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim()));
    }
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

  // --- 25. Head-hub existence — Batch Head-Hubs (2026-11-02; checks HH-1..HH-4) ---
  // Every registry service must resolve a dedicated head hub: its
  // head-graph Service url is unique across services (no shared
  // canonical), is not a category route, is not a "-2" artifact slug,
  // names a pages.json registry page that claims the service as its
  // own, and that page exists as a generated route document with a
// per-page JSON.
  // Record: out/batch-head-hubs-2026-11-02/ws1/READY.md.
  try {
    const shellHH = fs.readFileSync(path.join(ROOT, 'repo-dir', 'index.html'), 'utf8');
    const headEndHH = shellHH.indexOf('</head>');
    const headHH = headEndHH > 0 ? shellHH.slice(0, headEndHH) : shellHH;
    const svcNodesHH = [];
    for (const m of headHH.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      let docHH;
      try { docHH = JSON.parse(m[1]); } catch (e) { continue; }
      for (const n of (docHH['@graph'] || [])) {
        if (n['@type'] === 'Service' && String(n['@id'] || '').includes('/#service-')) svcNodesHH.push(n);
      }
    }
    const byUrlHH = new Map();
    for (const n of svcNodesHH) {
      if (!n.url) continue;
      if (!byUrlHH.has(n.url)) byUrlHH.set(n.url, []);
      byUrlHH.get(n.url).push(String(n['@id']).split('#')[1]);
    }
    const sharedHH = [...byUrlHH.entries()].filter(([, ids]) => ids.length > 1);
    check('HH-1 every head-graph Service node carries a url and no two services share a canonical url',
      svcNodesHH.length >= 29 && svcNodesHH.every((n) => !!n.url) && sharedHH.length === 0,
      'serviceNodes=' + svcNodesHH.length + ', shared=' + sharedHH.map(([u, ids]) => u + ' <- ' + ids.join('+')).join('; '));
    const pageByUrlHH = new Map(pages.pages.map((p) => [p.url, p]));
    const badFormHH = [], unclaimedHH = [];
    for (const n of svcNodesHH) {
      const id = String(n['@id']).split('#')[1];
      const u = n.url || '';
      if (u.includes('/category/') || /-2\/$/.test(u)) badFormHH.push(id + ' -> ' + u);
      // A city branch page standing in as the canonical (the
      // long-distance defect) — exempt only when the service itself is
      // the city-specific service (service-transloading-winchester-va).
      const citySuffix = /-(winchester-va|martinsburg-wv)\/$/.exec(u);
      if (citySuffix && !id.endsWith('-' + citySuffix[1])) badFormHH.push(id + ' -> ' + u + ' (branch page as canonical)');
      const pg = pageByUrlHH.get(u);
      if (!pg || !(pg.services || []).includes(id)) unclaimedHH.push(id + ' -> ' + u);
    }
    check('HH-2 no service canonical is a category route, a "-2" artifact slug, or a city branch page, and the canonical page claims the service in pages.json',
      badFormHH.length === 0 && unclaimedHH.length === 0,
      'badForm=' + badFormHH.join('; ') + ' unclaimed=' + unclaimedHH.join('; '));
    const missingHH = [];
    for (const n of svcNodesHH) {
      const pg = pageByUrlHH.get(n.url || '');
      if (!pg) { missingHH.push((n.url || '?') + ' (no registry page)'); continue; }
      // The route document in the deploy tree is the existence proof
      // (shell div ids use legacy page keys, not registry slugs, for
      // older pages — build-routes maps them via pageMeta).
      if (!fs.existsSync(path.join(PAGES_PUBLIC, pg.slug, 'index.html'))) missingHH.push(pg.slug + ' (no route document)');
      const jsonFlat = pg.slug + '.json';
      const jsonDash = pg.slug.replace(/\//g, '-') + '.json';
      if (!fs.existsSync(path.join(PAGES_PUBLIC, jsonFlat)) && !fs.existsSync(path.join(PAGES_PUBLIC, jsonDash))) missingHH.push(pg.slug + ' (no per-page JSON)');
    }
    check('HH-3 every service canonical resolves to a registry page with a generated route document and a per-page JSON (the head hub exists)',
      missingHH.length === 0, missingHH.slice(0, 6).join('; '));
    if (LOCAL) {
      skipLive('HH-4 every service hub url returns HTTP 200 live with its own slug content');
    } else {
      const deadHH = [];
      for (const n of svcNodesHH) {
        try {
          const body = await fetchText(n.url);
          const pg = pageByUrlHH.get(n.url);
          if (!pg || !body.includes(pg.slug)) deadHH.push(n.url);
        } catch (e) { deadHH.push(n.url + ' (' + e.message + ')'); }
      }
      check('HH-4 every service hub url returns HTTP 200 live with its own slug content',
        deadHH.length === 0, deadHH.slice(0, 6).join('; '));
    }
  } catch (e) {
    check('head-hub checks (HH-1..HH-4) evaluated', false, e.message);
  }

  // --- 26. News sitemap — Batch Sitemap Architecture (2026-11-02; checks NS-1..NS-5) ---
  // Spec A of the News Formula dossier
  // (theflatratemovers/retrieval-machine/google-news-requirements-2026-11-02.md):
  // news-sitemap.xml is generated by scripts/build-news-sitemap.js in
  // seal phase 2b from the blog ledger + page registry, copying each
  // post's schema datePublished and headline verbatim. These checks pin
  // that contract: the file is live as XML with the same entry set as
  // the sealed local file (NS-1); the local file is a well-formed news
  // urlset within the 1,000-URL cap (NS-2); every entry is a published
  // ledger post with a route document whose date and title byte-match
  // its BlogPosting schema (NS-3); the publication name and language
  // are exact on every entry (NS-4); and the entry set is exactly the
  // published ledger posts inside the 48-hour window at generation
  // time — the local file's mtime, written by the generator in the
  // seal and preserved by the tree rsync (NS-5).
  try {
    const parseCsvNS = (text) => {
      const rows = []; let row = [], field = '', inQ = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQ) {
          if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
          else field += c;
        } else if (c === '"') inQ = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
        else if (c !== '\r') field += c;
      }
      if (field.length || row.length) { row.push(field); rows.push(row); }
      return rows;
    };
    const rowsNS = parseCsvNS(fs.readFileSync(path.join(FLAT, 'blog-project', 'ledger.csv'), 'utf8'));
    const hNS = rowsNS[0];
    const publishedNS = new Set();
    for (const r of rowsNS.slice(1)) {
      const slug = (r[hNS.indexOf('slug')] || '').trim();
      if (slug && /published/i.test(r[hNS.indexOf('status')] || '')) publishedNS.add(slug);
    }
    const schemaNS = (slug) => {
      const pj = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, slug + '.json'), 'utf8'));
      const nodes = Array.isArray(pj['@graph']) ? pj['@graph'] : [pj];
      return nodes.find((n) => String(n['@type']).includes('BlogPosting')) || {};
    };
    const nyOffsetNS = (utcMs) => {
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York', hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
      const parts = {};
      for (const p of dtf.formatToParts(new Date(utcMs))) parts[p.type] = p.value;
      const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
      return asUtc - Math.floor(utcMs / 1000) * 1000;
    };
    const toInstantNS = (s) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const guess = Date.parse(s + 'T00:00:00Z');
        return guess - nyOffsetNS(guess);
      }
      return Date.parse(s);
    };
    const xmlEscNS = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const parseNewsNS = (xml) => {
      const entries = [];
      for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
        const b = m[1];
        const g = (re) => { const mm = b.match(re); return mm ? mm[1].trim() : null; };
        entries.push({
          loc: g(/<loc>(.*?)<\/loc>/),
          name: g(/<news:name>(.*?)<\/news:name>/),
          lang: g(/<news:language>(.*?)<\/news:language>/),
          date: g(/<news:publication_date>(.*?)<\/news:publication_date>/),
          title: g(/<news:title>(.*?)<\/news:title>/),
        });
      }
      return entries;
    };
    const newsPathNS = path.join(PAGES_PUBLIC, 'news-sitemap.xml');
    const localNewsXmlNS = fs.readFileSync(newsPathNS, 'utf8');
    const localEntriesNS = parseNewsNS(localNewsXmlNS);
    const genMsNS = fs.statSync(newsPathNS).mtimeMs;
    const expectedNS = new Set();
    for (const slug of publishedNS) {
      const bp = schemaNS(slug);
      if (!bp.datePublished) continue;
      const age = genMsNS - toInstantNS(bp.datePublished);
      if (age <= 48 * 3600 * 1000 && age >= -5 * 60 * 1000) expectedNS.add(slug);
    }
    const problemsNS = [];
    const seenSlugsNS = new Set();
    for (const e of localEntriesNS) {
      const pg = pages.pages.find((p) => p.url === e.loc);
      if (!pg) { problemsNS.push(String(e.loc) + ' (not a registry URL)'); continue; }
      seenSlugsNS.add(pg.slug);
      if (!publishedNS.has(pg.slug)) problemsNS.push(pg.slug + ' (not a published ledger post)');
      const bp = schemaNS(pg.slug);
      if (e.date !== bp.datePublished) problemsNS.push(pg.slug + ' (date ' + e.date + ' != schema ' + bp.datePublished + ')');
      if (e.title !== xmlEscNS(bp.headline || '')) problemsNS.push(pg.slug + ' (title != schema headline)');
      if (!fs.existsSync(path.join(PAGES_PUBLIC, pg.slug, 'index.html'))) problemsNS.push(pg.slug + ' (no route document)');
    }
    check('NS-2 the local news-sitemap.xml is a well-formed news urlset (news namespace declared, every entry complete) within the 1,000-URL cap',
      localNewsXmlNS.includes('<urlset') && localNewsXmlNS.includes('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"') &&
      localEntriesNS.every((e) => e.loc && e.date && e.title) && localEntriesNS.length <= 1000,
      'entries=' + localEntriesNS.length);
    check('NS-3 every news sitemap entry is a published ledger post with a route document, and its publication_date and title byte-match the post\u2019s BlogPosting schema',
      problemsNS.length === 0, problemsNS.slice(0, 4).join('; ') || 'all entries match their schema');
    check('NS-4 every news sitemap entry names the publication exactly "The Flat Rate Movers" with language en',
      localEntriesNS.every((e) => e.name === 'The Flat Rate Movers' && e.lang === 'en'),
      'entries=' + localEntriesNS.length);
    check('NS-5 the news sitemap entry set is exactly the published ledger posts inside the 48-hour window at generation time',
      seenSlugsNS.size === expectedNS.size && [...expectedNS].every((s) => seenSlugsNS.has(s)),
      'entries=' + [...seenSlugsNS].join(', ') + '; expected=' + [...expectedNS].join(', '));
    if (LOCAL) {
      skipLive('NS-1 news-sitemap.xml is live (HTTP 200, XML content type) and its entry set equals the local sealed file');
    } else {
      const fetchFullNS = (url) => new Promise((resolve, reject) => {
        https.get(url, (res) => {
          const chunks = [];
          res.on('data', (c) => { chunks.push(c); });
          res.on('end', () => resolve({ status: res.statusCode, ct: res.headers['content-type'] || '', body: Buffer.concat(chunks).toString('utf8') }));
        }).on('error', reject);
      });
      const liveNS = await fetchFullNS('https://theflatratemovers.com/news-sitemap.xml');
      const liveEntriesNS = parseNewsNS(liveNS.body);
      const sameSetNS = liveEntriesNS.length === localEntriesNS.length &&
        liveEntriesNS.every((e) => localEntriesNS.some((l) => l.loc === e.loc && l.date === e.date && l.title === e.title));
      check('NS-1 news-sitemap.xml is live (HTTP 200, XML content type) and its entry set equals the local sealed file',
        liveNS.status === 200 && /xml/.test(liveNS.ct) && sameSetNS,
        'status=' + liveNS.status + ', ct=' + liveNS.ct + ', liveEntries=' + liveEntriesNS.length);
    }
  } catch (e) {
    check('news sitemap checks (NS-1..NS-5) evaluated', false, e.message);
  }


  // ------------------------------------------------------------------
  // 27. News Formula gates (batch-news-formula-2026-11-02; dossier
  // google-news-requirements-2026-11-02.md gates N-2/N-4/N-7/N-8/N-10 +
  // Spec B). The recorded state lives in data/news-formula.json: per
  // published post — the ledger date, the single recorded publication
  // instant feeding the visible byline line, the schema dates and the
  // news sitemap (null = no time of day is recorded anywhere; the post
  // stays date-only and inventing one fails NF-3), the lane (story =
  // Spec B NewsArticle profile; guide = pure BlogPosting) and the N-8
  // image state (pass, or a recorded owner-photo-needed flag — filling
  // a flagged post with the logo, stock or another subject fails NF-5).
  // ------------------------------------------------------------------
  {
    const NF_SITE = 'https://theflatratemovers.com';
    const NF_AUTHOR = NF_SITE + '/author/henry-pitts-jr/';
    let nfManifest = null;
    try { nfManifest = JSON.parse(fs.readFileSync('data/news-formula.json', 'utf8')); } catch (e) { /* reported below */ }
    const nfPosts = nfManifest && Array.isArray(nfManifest.posts) ? nfManifest.posts : [];
    const nfPub = PAGES_PUBLIC;
    const nfPosting = (slug) => {
      const d = JSON.parse(fs.readFileSync(path.join(nfPub, slug + '.json'), 'utf8'));
      return (d['@graph'] || []).find((n) => String(n['@type']).includes('BlogPosting')) || null;
    };

    // NF-3 (local): schema instants — full ISO 8601 with offset where a
    // publication instant is recorded; date-only only where the manifest
    // records why no time exists.
    try {
      const bad = [];
      for (const p of nfPosts) {
        const bp = nfPosting(p.slug);
        if (!bp) { bad.push(p.slug + ':no-posting'); continue; }
        if (p.instant) {
          if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(p.instant)) bad.push(p.slug + ':manifest-instant-malformed');
          if (bp.datePublished !== p.instant || bp.dateModified !== p.instant) bad.push(p.slug + ':schema!=manifest-instant');
        } else {
          if (bp.datePublished !== p.ledgerDate || bp.dateModified !== p.ledgerDate) bad.push(p.slug + ':date-only-mismatch');
          if (!p.dateOnlyReason || p.dateOnlyReason.length < 40) bad.push(p.slug + ':date-only-unrecorded');
        }
      }
      check('NF-3 schema dates are the manifest instants (full ISO 8601 with New York offset) or recorded date-only',
        !!nfManifest && nfPosts.length >= 1 && bad.length === 0, bad.join(', ') || (nfPosts.length + ' posts'));
    } catch (e) { check('NF-3 schema dates are the manifest instants (full ISO 8601 with New York offset) or recorded date-only', false, e.message); }

    // NF-4 (local): dossier QA gate — every headline <= 110 characters.
    try {
      const bad = [];
      for (const p of nfPosts) {
        const bp = nfPosting(p.slug);
        if (!bp || typeof bp.headline !== 'string' || bp.headline.length > 110) bad.push(p.slug + ':' + (bp && bp.headline ? bp.headline.length : 'missing'));
      }
      check('NF-4 every article headline is 110 characters or fewer',
        nfPosts.length >= 1 && bad.length === 0, bad.join(', ') || 'max ' + Math.max(...nfPosts.map((p) => nfPosting(p.slug).headline.length)));
    } catch (e) { check('NF-4 every article headline is 110 characters or fewer', false, e.message); }

    // NF-5 (local): the image rule — a passing post's first schema image
    // is landscape (16:9 / 4:3 / 1:1 within 0.02), >= 1200 px wide, the
    // file is in the tree, and the image is in the page body; a flagged
    // post carries a recorded owner-photo-needed reason instead.
    try {
      const shellNF = fs.readFileSync(path.join(ROOT, 'repo-dir', 'index.html'), 'utf8');
      const bad = [];
      for (const p of nfPosts) {
        const bp = nfPosting(p.slug);
        if (!bp) { bad.push(p.slug + ':no-posting'); continue; }
        if (p.image && p.image.status === 'pass') {
          const imgs = Array.isArray(bp.image) ? bp.image : (bp.image ? [bp.image] : []);
          const im = imgs[0];
          if (!im || im.url !== p.image.url) { bad.push(p.slug + ':schema-image!=manifest'); continue; }
          const ratio = im.width / im.height;
          const ratioOk = [16 / 9, 4 / 3, 1].some((r) => Math.abs(ratio - r) <= 0.02);
          if (!(im.width >= 1200 && ratioOk)) bad.push(p.slug + ':geometry');
          const rel = im.url.replace('https://theflatratemovers.com/', '');
          if (!fs.existsSync(path.join(nfPub, rel))) bad.push(p.slug + ':file-missing');
          const divAt = shellNF.indexOf('<div class="page" id="page-' + p.slug + '">');
          const divEnd = shellNF.indexOf('<div class="page"', divAt + 10);
          const div = divAt >= 0 ? shellNF.slice(divAt, divEnd > divAt ? divEnd : undefined) : '';
          if (!div.includes('/' + rel)) bad.push(p.slug + ':not-in-page-body');
        } else if (p.image && p.image.status === 'owner-photo-needed') {
          if (!p.image.reason || p.image.reason.length < 40) bad.push(p.slug + ':flag-unrecorded');
        } else {
          bad.push(p.slug + ':no-image-state');
        }
      }
      check('NF-5 every post carries a true landscape article image (>=1200 px, page + schema) or a recorded owner-photo-needed flag',
        nfPosts.length >= 1 && bad.length === 0, bad.join(', ') || (nfPosts.filter((p) => p.image.status === 'pass').length + ' pass / ' + nfPosts.filter((p) => p.image.status !== 'pass').length + ' flagged'));
    } catch (e) { check('NF-5 every post carries a true landscape article image (>=1200 px, page + schema) or a recorded owner-photo-needed flag', false, e.message); }

    // NF-7 (local): lane discipline (Spec B as a switch) + the author
    // chain — every post's author node points at the author page.
    try {
      const bad = [];
      for (const p of nfPosts) {
        const bp = nfPosting(p.slug);
        if (!bp) { bad.push(p.slug + ':no-posting'); continue; }
        if (!bp.author || bp.author.url !== NF_AUTHOR) bad.push(p.slug + ':author-url');
        if (!Array.isArray(bp.author && bp.author.sameAs) || bp.author.sameAs.length < 1) bad.push(p.slug + ':author-sameAs');
        const types = Array.isArray(bp['@type']) ? bp['@type'] : [bp['@type']];
        if (p.lane === 'story') {
          if (!(types.includes('BlogPosting') && types.includes('NewsArticle'))) bad.push(p.slug + ':story-not-multityped');
          if (bp.isAccessibleForFree !== true) bad.push(p.slug + ':story-free');
          if (!bp.articleSection) bad.push(p.slug + ':story-section');
        } else if (bp['@type'] !== 'BlogPosting') {
          bad.push(p.slug + ':guide-not-pure');
        }
      }
      check('NF-7 lane discipline: story posts carry the Spec B NewsArticle profile, guides stay pure BlogPosting, every author node carries the author-page url',
        nfPosts.length >= 1 && bad.length === 0, bad.join(', ') || (nfPosts.filter((p) => p.lane === 'story').length + ' story / ' + nfPosts.filter((p) => p.lane !== 'story').length + ' guides'));
    } catch (e) { check('NF-7 lane discipline: story posts carry the Spec B NewsArticle profile, guides stay pure BlogPosting, every author node carries the author-page url', false, e.message); }

    // NF-1 (live): the byline + publication line in the SERVED article
    // HTML, directly under the H1, its datetime equal to the one ledger
    // instant (or the ledger date where no instant is recorded).
    if (LOCAL) {
      skipLive('NF-1 every served article carries the byline + publication line under its H1, datetime equal to the manifest instant');
    } else {
      try {
        const bad = [];
        for (const p of nfPosts) {
          const doc = await fetchText(NF_SITE + '/' + p.slug + '/');
          const m = doc.match(/<p class="post-byline">[\s\S]*?<time datetime="([^"]+)"/);
          if (!m) { bad.push(p.slug + ':no-byline'); continue; }
          if (!doc.includes('By <a href="#/author-henry-pitts-jr">Henry Pitts Jr.</a>')) bad.push(p.slug + ':byline-link');
          if (m[1] !== (p.instant || p.ledgerDate)) bad.push(p.slug + ':datetime=' + m[1]);
          const h1At = doc.indexOf('</h1>');
          if (!(doc.indexOf('<p class="post-byline">') > h1At && doc.indexOf('<p class="post-byline">') < h1At + 400)) bad.push(p.slug + ':not-under-h1');
        }
        check('NF-1 every served article carries the byline + publication line under its H1, datetime equal to the manifest instant',
          nfPosts.length >= 1 && bad.length === 0, bad.join(', ') || (nfPosts.length + ' articles'));
      } catch (e) { check('NF-1 every served article carries the byline + publication line under its H1, datetime equal to the manifest instant', false, e.message); }
    }

    // NF-2 (live): the author page resolves with ProfilePage markup and
    // links every live post back (the bidirectional author chain).
    if (LOCAL) {
      skipLive('NF-2 author page serves 200 with ProfilePage markup and links every live post');
    } else {
      try {
        const doc = await fetchText(NF_SITE + '/author/henry-pitts-jr/');
        const missing = nfPosts.filter((p) => !doc.includes('href="#/' + p.slug + '"')).map((p) => p.slug);
        check('NF-2 author page serves 200 with ProfilePage markup and links every live post',
          doc.length > 0 && doc.includes('ProfilePage') && missing.length === 0,
          'len=' + doc.length + ', missingLinks=' + (missing.join(',') || '0'));
      } catch (e) { check('NF-2 author page serves 200 with ProfilePage markup and links every live post', false, e.message); }
    }

    // NF-6 (live): the 48x48 + 192x192 PNG icon links ride the shell
    // head onto the home page, an article and the author page.
    if (LOCAL) {
      skipLive('NF-6 48x48 and 192x192 PNG favicon links present on served routes');
    } else {
      try {
        const bad = [];
        for (const u of ['/', '/moving-a-piano/', '/author/henry-pitts-jr/']) {
          const body = await fetchText(NF_SITE + u);
          if (!body.includes('sizes="48x48" href="/favicon-48x48.png"')) bad.push(u + ':48');
          if (!body.includes('sizes="192x192" href="/favicon-192x192.png"')) bad.push(u + ':192');
        }
        check('NF-6 48x48 and 192x192 PNG favicon links present on served routes',
          bad.length === 0, bad.join(', ') || '3 routes');
      } catch (e) { check('NF-6 48x48 and 192x192 PNG favicon links present on served routes', false, e.message); }
    }
  }


  // ------------------------------------------------------------------
  // 28. API certificate + head coverage (Added Items #1/#2, News
  // Formula batch 2026-11-02, owner-priority). AC-1: the estate API
  // worker's CODE (flat-rate-estate-api, entry module src/index.js) is
  // a signed distribution whose digest equals BOTH the canonical
  // repo-dir copy and the deployed project source — the gap the P2
  // certificate directive missed must never recur silently. (The
  // worker's generated data module, data/bundle-index.js, is
  // deliberately NOT a distribution: it embeds the master index that
  // would carry its digest — the same self-reference that keeps the
  // index from distributing itself; its constituent files are each
  // signed and are verified by the worker at runtime. Cadence: every
  // bundle refresh re-stages the canonical code copy — refresh-bundle.py
  // does it — and the next seal re-digests it.) AC-2/AC-3: EVERY route
  // document's head graph carries the one shared API node
  // (https://theflatratemovers.com/#api, a WebAPI node naming
  // https://api.theflatratemovers.com) — full coverage, generated
  // files locally (AC-2) and served documents live (AC-3). Before this
  // batch only 3 of 224 heads named the API (the crawl-presence,
  // local-graph-registry and archive-registry dataset landings, via
  // per-dataset identifier entries).
  // ------------------------------------------------------------------
  {
    const crypto = require('crypto');
    const AC_API_ID = 'https://theflatratemovers.com/#api';
    const AC_API_URL = 'https://api.theflatratemovers.com';
    const AC_CODE_URL = 'https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/code/api-worker/src-index.js';

    // AC-1 (local evidence, both modes): presence + three-way digest.
    try {
      const idxAC = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, 'ai-master-index.json'), 'utf8'));
      const ent = (idxAC.distribution || []).find((e) => e.contentUrl === AC_CODE_URL);
      const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
      const repoCopy = path.join(ROOT, 'repo-dir', 'src-index.js');
      const projSrc = path.join(ROOT, '..', 'theflatratemovers', 'api-worker', 'src', 'index.js');
      const okAC1 = !!ent && !!ent.digest &&
        ent.digest.value === sha(repoCopy) && ent.digest.value === sha(projSrc);
      check('AC-1 estate API worker code (src/index.js) is a signed distribution matching the deployed source and its canonical copy',
        okAC1, ent ? ('digest=' + String(ent.digest && ent.digest.value).slice(0, 12) + '…') : 'entry absent from the sealed index');
    } catch (e) { check('AC-1 estate API worker code (src/index.js) is a signed distribution matching the deployed source and its canonical copy', false, e.message); }

    // AC-2 (local): every generated route document's head carries the node.
    try {
      const missing = [];
      for (const p of pages.pages) {
        const rel = p.url.replace('https://theflatratemovers.com/', '');
        const docPath = path.join(PAGES_PUBLIC, rel, 'index.html');
        let doc = '';
        try { doc = fs.readFileSync(docPath, 'utf8'); } catch (_) { /* counted as missing */ }
        const headPart = doc.split('</head>')[0] || '';
        if (!headPart.includes(AC_API_ID) || !headPart.includes(AC_API_URL)) missing.push(p.slug);
      }
      check('AC-2 every generated route document head graph carries the shared API node (#api)',
        missing.length === 0, (pages.pages.length - missing.length) + '/' + pages.pages.length + ' route documents' + (missing.length ? '; missing: ' + missing.slice(0, 5).join(', ') : ''));
    } catch (e) { check('AC-2 every generated route document head graph carries the shared API node (#api)', false, e.message); }

    // AC-3 (live): every served route document's head carries the node.
    if (LOCAL) {
      skipLive('AC-3 every served route document head graph carries the shared API node (#api)');
    } else {
      try {
        const missing = [];
        for (const p of pages.pages) {
          let doc = '';
          try { doc = await fetchText(p.url); } catch (_) { /* counted as missing */ }
          const headPart = doc.split('</head>')[0] || '';
          if (!headPart.includes(AC_API_ID) || !headPart.includes(AC_API_URL)) missing.push(p.slug);
        }
        check('AC-3 every served route document head graph carries the shared API node (#api)',
          missing.length === 0, (pages.pages.length - missing.length) + '/' + pages.pages.length + ' route documents' + (missing.length ? '; missing: ' + missing.slice(0, 5).join(', ') : ''));
      } catch (e) { check('AC-3 every served route document head graph carries the shared API node (#api)', false, e.message); }
    }
  }

  // ------------------------------------------------------------------
  // 29. Sitemap extensions (Batch Sitemap Extensions, 2026-11-02;
  // checks SX-1..SX-6). The section sitemaps carry Google extension
  // children enumerated by build-sitemap.js from the source shell via
  // the registry -> pageMeta -> div join: <image:image> entries
  // (loc/caption/geo_location/title/license) on registry pages and
  // <video:video> entries on /videos/. SX-2 recomputes the expected
  // image map with the generator's own extraction and requires exact
  // equality — the gate proves the tagging (parent standard: caption
  // + title on every entry, geo only from the curated map, license
  // only from the CC credit tail in the caption data).
  // ------------------------------------------------------------------
  {
    const SITE_SX = 'https://theflatratemovers.com';
    const fetchFullSX = (url) => new Promise((resolve, reject) => {
      https.get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => { chunks.push(c); });
        res.on('end', () => resolve({ status: res.statusCode, ct: res.headers['content-type'] || '', buf: Buffer.concat(chunks) }));
      }).on('error', reject);
    });
    const unescSX = (s) => String(s || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
    const cleanSX = (s) => String(s || '').replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
      .replace(/\s+/g, ' ').trim();
    const attrSX = (tag, name) => { const m = tag.match(new RegExp(name + '="([^"]*)"')); return m ? m[1] : ''; };

    function parseSectionSX(xml) {
      const out = [];
      for (const um of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
        const block = um[1];
        const locM = block.match(/<loc>(.*?)<\/loc>/);
        const entry = { url: locM ? unescSX(locM[1]) : '', images: [], videos: [] };
        for (const im of block.matchAll(/<image:image>([\s\S]*?)<\/image:image>/g)) {
          const b = im[1];
          const g = (tag) => { const m = b.match(new RegExp('<image:' + tag + '>([\\s\\S]*?)</image:' + tag + '>')); return m ? unescSX(m[1]) : ''; };
          const e = { loc: g('loc') };
          if (g('caption')) e.caption = g('caption');
          if (g('geo_location')) e.geo_location = g('geo_location');
          if (g('title')) e.title = g('title');
          if (g('license')) e.license = g('license');
          entry.images.push(e);
        }
        for (const vm of block.matchAll(/<video:video>([\s\S]*?)<\/video:video>/g)) {
          const b = vm[1];
          const g = (tag) => { const m = b.match(new RegExp('<video:' + tag + '>([\\s\\S]*?)</video:' + tag + '>')); return m ? unescSX(m[1]) : ''; };
          entry.videos.push({ thumbnail_loc: g('thumbnail_loc'), title: g('title'), description: g('description'), player_loc: g('player_loc') });
        }
        out.push(entry);
      }
      return out;
    }

    /* The generator's extraction, mirrored (build-sitemap.js). */
    const GEO_SX = { 'moorefield-': 'Moorefield, West Virginia' };
    function shellDivsSX(shell) {
      let pageMeta;
      const at = shell.indexOf('var pageMeta=');
      if (at < 0) throw new Error('pageMeta not found in shell');
      let i = shell.indexOf('{', at);
      let depth = 0, inStr = null, esc = false, end = -1;
      for (let j = i; j < shell.length; j++) {
        const c = shell[j];
        if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === inStr) inStr = null; }
        else if (c === '"' || c === "'") inStr = c;
        else if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) { end = j; break; } }
      }
      if (end < 0) throw new Error('pageMeta literal did not balance');
      pageMeta = Function('return (' + shell.slice(i, end + 1) + ')')();
      const metaKeyByUrl = new Map();
      for (const [k, v] of Object.entries(pageMeta)) {
        if (v && v.canonical) metaKeyByUrl.set(v.canonical, k);
      }
      const divs = new Map();
      const headEnd = shell.indexOf('</head>');
      let k = headEnd, d2 = 0, divStart = -1, divIsPage = false;
      const nextToken = (from) => {
        let best = null;
        for (const tok of ['<!--', '<script', '<div', '</div>']) {
          const j = shell.indexOf(tok, from);
          if (j >= 0 && (best === null || j < best.idx)) best = { tok, idx: j };
        }
        return best;
      };
      while (true) {
        const t = nextToken(k); if (!t) break;
        if (t.tok === '<!--') { k = shell.indexOf('-->', t.idx) + 3; }
        else if (t.tok === '<script') { k = shell.indexOf('</script>', t.idx) + 9; }
        else if (t.tok === '<div') {
          if (d2 === 0) {
            divStart = t.idx;
            divIsPage = /^<div class="page" id="page-[^"]+">/.test(shell.slice(t.idx, t.idx + 320));
          }
          d2++; k = t.idx + 4;
        } else {
          d2--;
          if (d2 === 0 && divIsPage) {
            const e2 = shell.indexOf('>', t.idx) + 1;
            const text = shell.slice(divStart, e2);
            const m = text.match(/^<div class="page" id="page-([^"]+)">/);
            if (m) divs.set(m[1], text);
          }
          k = t.idx + 6;
        }
      }
      return { metaKeyByUrl, divs };
    }
    function imagesInDivSX(div) {
      const out = []; const figSpans = [];
      for (const fm of div.matchAll(/<figure.*?<\/figure>/gs)) {
        figSpans.push([fm.index, fm.index + fm[0].length]);
        const im = fm[0].match(/<img [^>]*>/);
        if (!im) continue;
        const src = attrSX(im[0], 'src'); if (!src) continue;
        const cap = fm[0].match(/<figcaption[^>]*>(.*?)<\/figcaption>/s);
        out.push({ src, alt: cleanSX(attrSX(im[0], 'alt')), caption: cap ? cleanSX(cap[1]) : '' });
      }
      for (const im of div.matchAll(/<img [^>]*>/g)) {
        if (figSpans.some(([s, e]) => im.index >= s && im.index < e)) continue;
        const src = attrSX(im[0], 'src'); if (!src) continue;
        if (attrSX(im[0], 'class').includes('logo-img') || src.includes('img-01-9c77693ba66b')) continue;
        out.push({ src, alt: cleanSX(attrSX(im[0], 'alt')), caption: '' });
      }
      return out.map((im) => {
        const e = { loc: im.src.startsWith('http') ? im.src : SITE_SX + im.src };
        const cap = im.caption || im.alt;
        if (cap) e.caption = cap;
        const base = im.src.split('/').pop();
        for (const [pre, place] of Object.entries(GEO_SX)) {
          if (base.startsWith(pre)) e.geo_location = place;
        }
        if (im.caption && im.alt && im.alt !== im.caption) e.title = im.alt;
        const credit = (im.caption || '') + ' ' + (im.alt || '');
        const cm = credit.match(/CC (BY-SA|BY) (\d\.\d)/);
        if (cm) e.license = 'https://creativecommons.org/licenses/' + cm[1].toLowerCase() + '/' + cm[2] + '/';
        return e;
      });
    }
    function videosInDivSX(div) {
      const iframes = [...div.matchAll(/<iframe [^>]*>/g)];
      const cards = [];
      for (let n = 0; n < iframes.length; n++) {
        const src = attrSX(iframes[n][0], 'src');
        const idm = src.match(/(?:youtube-nocookie\.com|youtube\.com)\/embed\/([A-Za-z0-9_-]{11})/);
        if (!idm) continue;
        const start = iframes[n].index + iframes[n][0].length;
        const nextH3 = div.indexOf('<h3', start);
        const end = Math.min(nextH3 < 0 ? div.length : nextH3,
          n + 1 < iframes.length ? iframes[n + 1].index : div.length);
        const ps = [...div.slice(start, end).matchAll(/<p[^>]*>(.*?)<\/p>/gs)]
          .map((x) => cleanSX(x[1])).filter((t) => t.length > 25);
        cards.push({
          thumbnail_loc: 'https://i.ytimg.com/vi/' + idm[1] + '/hqdefault.jpg',
          title: cleanSX(attrSX(iframes[n][0], 'title')), description: ps[0] || '', player_loc: src,
        });
      }
      return cards;
    }
    function pageDivSX(html, slug) {
      // Served route documents mark the active page's div with the
      // additional 'show' class ('<div class="page show" id="...">'),
      // so the marker match tolerates extra classes.
      const mm = html.match(new RegExp('<div class="page[^"]*" id="page-' + slug + '">'));
      if (!mm) return '';
      const start = mm.index;
      let depth = 0, k = start;
      const nextToken = (from) => {
        let best = null;
        for (const tok of ['<!--', '<script', '<div', '</div>']) {
          const j = html.indexOf(tok, from);
          if (j >= 0 && (best === null || j < best.idx)) best = { tok, idx: j };
        }
        return best;
      };
      while (true) {
        const t = nextToken(k); if (!t) return '';
        if (t.tok === '<!--') { k = html.indexOf('-->', t.idx) + 3; }
        else if (t.tok === '<script') { k = html.indexOf('</script>', t.idx) + 9; }
        else if (t.tok === '<div') { depth++; k = t.idx + 4; }
        else {
          depth--;
          if (depth === 0) return html.slice(start, html.indexOf('>', t.idx) + 1);
          k = t.idx + 6;
        }
      }
    }

    const SECTION_FILES_SX = ['pages.xml', 'datasets.xml', 'blog.xml'];
    let localSectionsSX = null;
    try {
      localSectionsSX = SECTION_FILES_SX.map((f) => {
        const text = fs.readFileSync(path.join(PAGES_PUBLIC, 'sitemaps', f), 'utf8');
        return { file: f, text, entries: parseSectionSX(text) };
      });
    } catch (e) {
      check('SX-1 section sitemaps are well-formed urlsets declaring the image and video namespaces, every image loc on the estate origin, no URL over the 1,000-image cap', false, e.message);
    }
    if (localSectionsSX) {
      // SX-1 (local): shape + namespaces + loc origin + cap.
      try {
        const badShape = localSectionsSX.filter((s) =>
          !s.text.startsWith('<?xml version="1.0" encoding="UTF-8"?>') ||
          !s.text.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"') ||
          !s.text.includes('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"') ||
          !s.text.trimEnd().endsWith('</urlset>'));
        const allImages = localSectionsSX.flatMap((s) => s.entries.flatMap((e) => e.images.map((im) => ({ url: e.url, im }))));
        const offOrigin = allImages.filter((x) => !x.im.loc.startsWith(SITE_SX + '/'));
        const overCap = localSectionsSX.flatMap((s) => s.entries).filter((e) => e.images.length > 1000);
        check('SX-1 section sitemaps are well-formed urlsets declaring the image and video namespaces, every image loc on the estate origin, no URL over the 1,000-image cap',
          badShape.length === 0 && offOrigin.length === 0 && overCap.length === 0,
          'sections=' + localSectionsSX.map((s) => s.entries.length).join('/') +
          ', images=' + allImages.length + ', off-origin=' + offOrigin.length + ', over-cap=' + overCap.length);
      } catch (e) { check('SX-1 section sitemaps are well-formed urlsets declaring the image and video namespaces, every image loc on the estate origin, no URL over the 1,000-image cap', false, e.message); }

      // SX-2 (local): image-set equality against the generator's extraction.
      try {
        const shellSX = fs.readFileSync(path.join(ROOT, 'repo-dir', 'index.html'), 'utf8');
        const { metaKeyByUrl, divs } = shellDivsSX(shellSX);
        const expected = new Map();
        for (const p of pages.pages) {
          const imgs = imagesInDivSX(divs.get(metaKeyByUrl.get(p.url)) || '');
          if (imgs.length) expected.set(p.url, imgs);
        }
        const actual = new Map();
        for (const s of localSectionsSX) {
          for (const e of s.entries) if (e.images.length) actual.set(e.url, e.images);
        }
        const canon = (arr) => JSON.stringify([...arr].sort((a, b) => a.loc.localeCompare(b.loc)));
        const diffUrls = [];
        for (const u of new Set([...expected.keys(), ...actual.keys()])) {
          if (canon(expected.get(u) || []) !== canon(actual.get(u) || [])) diffUrls.push(u);
        }
        check('SX-2 section image children exactly equal the set recomputed from the sealed shell (registry -> pageMeta -> div extraction, caption/title/geo/license fields equal)',
          diffUrls.length === 0,
          'expected pages=' + expected.size + ', actual pages=' + actual.size +
          ', expected images=' + [...expected.values()].reduce((n, a) => n + a.length, 0) +
          (diffUrls.length ? '; differing: ' + diffUrls.slice(0, 4).join(', ') : ''));
      } catch (e) { check('SX-2 section image children exactly equal the set recomputed from the sealed shell (registry -> pageMeta -> div extraction, caption/title/geo/license fields equal)', false, e.message); }

      // SX-5 (local): no textless entries; geo values only from the curated map.
      try {
        const allImages = localSectionsSX.flatMap((s) => s.entries.flatMap((e) => e.images));
        const textless = allImages.filter((im) => !im.caption && !im.title);
        const geoAllowed = new Set(['Moorefield, West Virginia']);
        const badGeo = allImages.filter((im) => im.geo_location && !geoAllowed.has(im.geo_location));
        const licensed = allImages.filter((im) => im.license);
        check('SX-5 every image entry carries a caption or title, and every geo_location is in the curated map (Moorefield, West Virginia)',
          textless.length === 0 && badGeo.length === 0,
          'images=' + allImages.length + ', textless=' + textless.length + ', bad-geo=' + badGeo.length +
          ', licensed=' + licensed.length + ', geo-tagged=' + allImages.filter((im) => im.geo_location).length);
      } catch (e) { check('SX-5 every image entry carries a caption or title, and every geo_location is in the curated map (Moorefield, West Virginia)', false, e.message); }

      // SX-6 (local + live): /videos/ children — sealed section vs shell
      // extraction vs the served document's own iframes.
      const VIDEOS_URL_SX = SITE_SX + '/videos/';
      try {
        const shellSX2 = fs.readFileSync(path.join(ROOT, 'repo-dir', 'index.html'), 'utf8');
        const { metaKeyByUrl: mk2, divs: divs2 } = shellDivsSX(shellSX2);
        const shellVideos = videosInDivSX(divs2.get(mk2.get(VIDEOS_URL_SX)) || '');
        const localEntry = localSectionsSX.flatMap((s) => s.entries).find((e) => e.url === VIDEOS_URL_SX);
        const localVideos = localEntry ? localEntry.videos : [];
        let okSX6 = JSON.stringify(localVideos) === JSON.stringify(shellVideos) && localVideos.length > 0;
        let detailSX6 = 'sealed=' + localVideos.length + ', shell=' + shellVideos.length;
        if (!LOCAL) {
          const servedDoc = await fetchText(VIDEOS_URL_SX);
          const servedVideos = videosInDivSX(pageDivSX(servedDoc, 'videos'));
          okSX6 = okSX6 && JSON.stringify(localVideos) === JSON.stringify(servedVideos);
          detailSX6 += ', served=' + servedVideos.length;
        }
        check('SX-6 the /videos/ sitemap video children equal the set recomputed from the served page iframes (and the sealed shell extraction)',
          okSX6, detailSX6);
      } catch (e) { check('SX-6 the /videos/ sitemap video children equal the set recomputed from the served page iframes (and the sealed shell extraction)', false, e.message); }

      // SX-3 (live): served section files byte-equal the sealed local files.
      if (LOCAL) {
        skipLive('SX-3 served section sitemaps byte-equal the sealed local section files');
      } else {
        try {
          const diffs = [];
          for (const s of localSectionsSX) {
            const live = await fetchText(SITE_SX + '/sitemaps/' + s.file);
            if (live !== s.text) diffs.push(s.file);
          }
          check('SX-3 served section sitemaps byte-equal the sealed local section files',
            diffs.length === 0, diffs.length ? 'differing: ' + diffs.join(', ') : '3/3 sections byte-equal');
        } catch (e) { check('SX-3 served section sitemaps byte-equal the sealed local section files', false, e.message); }
      }

      // SX-4 (live): every distinct image asset serves 200 + image/*.
      if (LOCAL) {
        skipLive('SX-4 every distinct image asset referenced in the sections returns HTTP 200 with an image content type');
      } else {
        try {
          const locs = [...new Set(localSectionsSX.flatMap((s) => s.entries.flatMap((e) => e.images.map((im) => im.loc))))];
          const bad = [];
          for (const loc of locs) {
            const r = await fetchFullSX(loc);
            if (r.status !== 200 || !r.ct.startsWith('image/')) bad.push(loc.split('/').pop() + ':' + r.status + '/' + r.ct);
          }
          check('SX-4 every distinct image asset referenced in the sections returns HTTP 200 with an image content type',
            bad.length === 0, 'assets=' + locs.length + (bad.length ? '; bad: ' + bad.slice(0, 4).join(', ') : ''));
        } catch (e) { check('SX-4 every distinct image asset referenced in the sections returns HTTP 200 with an image content type', false, e.message); }
      }
    }
  }

  // ------------------------------------------------------------------
  // 30. Article feed (Batch Sitemap Extensions, 2026-11-02; checks
  // FD-1..FD-4). /feed.xml is an RSS 2.0 feed of every published post,
  // generated by build-feed.js from the ledger + registry + per-page
  // schema (the same inputs as the News sitemap), and a signed
  // distribution in the estate index. FD-3 recomputes the item set
  // from those inputs so the feed can never drift from the schema;
  // date-only posts read as midnight America/New_York (Spec A).
  // ------------------------------------------------------------------
  {
    const SITE_FD = 'https://theflatratemovers.com';
    const unescFD = (s) => String(s || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

    // FD-2 (local): RSS shape, self-link, channel identity.
    let feedTextFD = '';
    try {
      feedTextFD = fs.readFileSync(path.join(PAGES_PUBLIC, 'feed.xml'), 'utf8');
      const blogPageFD = pages.pages.find((p) => p.slug === 'blog');
      check('FD-2 feed.xml is well-formed RSS 2.0 with the exact atom self-link, the blog hub as channel link and the Articles channel title',
        feedTextFD.startsWith('<?xml version="1.0" encoding="UTF-8"?>') &&
        feedTextFD.includes('<rss version="2.0"') &&
        feedTextFD.includes('<atom:link href="https://theflatratemovers.com/feed.xml" rel="self" type="application/rss+xml"/>') &&
        !!blogPageFD && feedTextFD.includes('<link>' + blogPageFD.url + '</link>') &&
        feedTextFD.includes('<title>The Flat Rate Movers — Articles</title>') &&
        feedTextFD.trimEnd().endsWith('</rss>'),
        'channel link=' + (blogPageFD ? blogPageFD.url : 'missing'));
    } catch (e) { check('FD-2 feed.xml is well-formed RSS 2.0 with the exact atom self-link, the blog hub as channel link and the Articles channel title', false, e.message); }

    // FD-3 (local): item set recomputed from ledger + registry + schema.
    try {
      const parseCsvFD = (text) => {
        const rows = []; let row = [], field = '', inQ = false;
        for (let i = 0; i < text.length; i++) {
          const c = text[i];
          if (inQ) {
            if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
            else field += c;
          } else if (c === '"') inQ = true;
          else if (c === ',') { row.push(field); field = ''; }
          else if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
          else if (c !== '\r') field += c;
        }
        if (field.length || row.length) { row.push(field); rows.push(row); }
        return rows;
      };
      const nyOffsetFD = (utcMs) => {
        const dtf = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York', hourCycle: 'h23',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
        const parts = {};
        for (const p of dtf.formatToParts(new Date(utcMs))) parts[p.type] = p.value;
        return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second) - Math.floor(utcMs / 1000) * 1000;
      };
      const toInstantFD = (s) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
          const guess = Date.parse(s + 'T00:00:00Z');
          return guess - nyOffsetFD(guess);
        }
        return Date.parse(s);
      };
      const ledgerFD = fs.readFileSync(path.join(ROOT, '..', 'theflatratemovers', 'blog-project', 'ledger.csv'), 'utf8');
      const rowsFD = parseCsvFD(ledgerFD);
      const slugIxFD = rowsFD[0].indexOf('slug');
      const statusIxFD = rowsFD[0].indexOf('status');
      const bySlugFD = new Map(pages.pages.map((p) => [p.slug, p]));
      const expectedFD = [];
      for (const row of rowsFD.slice(1)) {
        if (!row[slugIxFD]) continue;
        const slug = row[slugIxFD].trim();
        if (!/published/i.test(row[statusIxFD] || '')) continue;
        const page = bySlugFD.get(slug);
        const pj = JSON.parse(fs.readFileSync(path.join(PAGES_PUBLIC, slug + '.json'), 'utf8'));
        const nodes = Array.isArray(pj['@graph']) ? pj['@graph'] : [pj];
        const bp = nodes.find((n) => String(n['@type']).includes('BlogPosting'));
        expectedFD.push({
          slug, url: page.url, title: bp.headline, description: bp.description,
          pubDate: new Date(toInstantFD(bp.datePublished)).toUTCString(),
        });
      }
      expectedFD.sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate) || a.slug.localeCompare(b.slug));
      const actualFD = [];
      for (const im of feedTextFD.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const b = im[1];
        const g = (tag) => { const m = b.match(new RegExp('<' + tag + '>([\\s\\S]*?)</' + tag + '>')); return m ? unescFD(m[1]) : ''; };
        const gm = b.match(/<guid[^>]*>([\s\S]*?)<\/guid>/);
        actualFD.push({ url: g('link'), title: g('title'), description: g('description'), pubDate: g('pubDate'), guid: gm ? unescFD(gm[1]) : '' });
      }
      const badFD = [];
      if (actualFD.length !== expectedFD.length) badFD.push('count ' + actualFD.length + '!=' + expectedFD.length);
      for (let i = 0; i < Math.min(actualFD.length, expectedFD.length); i++) {
        const a = actualFD[i], e = expectedFD[i];
        if (a.url !== e.url || a.guid !== e.url || a.title !== e.title ||
            a.description !== e.description || a.pubDate !== e.pubDate) badFD.push(e.slug);
      }
      check('FD-3 feed item set equals the published-ledger post set recomputed from the per-page schema (title/link/guid/description/pubDate per item)',
        badFD.length === 0, 'items=' + actualFD.length + (badFD.length ? '; bad: ' + badFD.slice(0, 4).join(', ') : ''));
    } catch (e) { check('FD-3 feed item set equals the published-ledger post set recomputed from the per-page schema (title/link/guid/description/pubDate per item)', false, e.message); }

    // FD-4 (local + live sample): the RSS discovery link in the shell
    // head, and in the served home + one served article head.
    try {
      const shellFD = fs.readFileSync(path.join(ROOT, 'repo-dir', 'index.html'), 'utf8');
      const headFD = shellFD.split('</head>')[0] || '';
      let okFD4 = headFD.includes('<link rel="alternate" type="application/rss+xml" href="https://theflatratemovers.com/feed.xml"');
      let detailFD4 = 'shell head link=' + okFD4;
      if (!LOCAL) {
        const homeDoc = await fetchText(SITE_FD + '/');
        const homeOk = (homeDoc.split('</head>')[0] || '').includes('application/rss+xml');
        const firstPost = pages.pages.find((p) => p.slug === 'transloading-at-the-virginia-inland-port');
        const artDoc = await fetchText(firstPost.url);
        const artOk = (artDoc.split('</head>')[0] || '').includes('application/rss+xml');
        okFD4 = okFD4 && homeOk && artOk;
        detailFD4 += ', served home=' + homeOk + ', served article=' + artOk;
      }
      check('FD-4 the RSS alternate link is in the sealed shell head and in the served home + article heads',
        okFD4, detailFD4);
    } catch (e) { check('FD-4 the RSS alternate link is in the sealed shell head and in the served home + article heads', false, e.message); }

    // FD-1 (live): the served feed byte-equals the sealed local file.
    if (LOCAL) {
      skipLive('FD-1 served feed.xml returns 200 with an XML/RSS content type and byte-equals the sealed local file');
    } else {
      try {
        const r = await new Promise((resolve, reject) => {
          https.get(SITE_FD + '/feed.xml', (res) => {
            const chunks = [];
            res.on('data', (c) => { chunks.push(c); });
            res.on('end', () => resolve({ status: res.statusCode, ct: res.headers['content-type'] || '', buf: Buffer.concat(chunks) }));
          }).on('error', reject);
        });
        const localBuf = fs.readFileSync(path.join(PAGES_PUBLIC, 'feed.xml'));
        check('FD-1 served feed.xml returns 200 with an XML/RSS content type and byte-equals the sealed local file',
          r.status === 200 && r.ct.includes('xml') && r.buf.equals(localBuf),
          'status=' + r.status + ', content-type=' + r.ct + ', bytes=' + r.buf.length + '/' + localBuf.length);
      } catch (e) { check('FD-1 served feed.xml returns 200 with an XML/RSS content type and byte-equals the sealed local file', false, e.message); }
    }
  }


  // --- 31. Consolidated Visibility Batch (2026-11-02): identity, flip,
  // figures, hub, landing, enrichment, registry and backlink gates ---
  {
    const fsx = fs, pathx = path;
    const PUB = PAGES_PUBLIC;
    const readJ = (p) => JSON.parse(fsx.readFileSync(p, 'utf8'));
    const walkO = (o, fn) => {
      if (Array.isArray(o)) o.forEach((v) => walkO(v, fn));
      else if (o && typeof o === 'object') { fn(o); Object.values(o).forEach((v) => walkO(v, fn)); }
    };
    const typeHasX = (n, t) => { const ty = n && n['@type']; return Array.isArray(ty) ? ty.includes(t) : ty === t; };

    // CV-1: handle flip — zero old IG/Threads patterns in generator
    // sources, served outputs and the API bundle; denylist untouched.
    {
      const RE_OLD_IG = new RegExp('instagram\\.com\\/' + 'theflat' + 'ratemovers\\/(?!llc)', 'g');
      const RE_OLD_TH = new RegExp('threads\\.com\\/@' + 'theflat' + 'ratemovers(?!llc)', 'g');
      const isOld = (txt) => (txt.match(RE_OLD_IG) || []).length + (txt.match(RE_OLD_TH) || []).length;
      let srcHits = [];
      const srcFiles = [];
      for (const d of ['scripts', 'repo-dir']) {
        for (const f of fsx.readdirSync(pathx.join(ROOT, d))) if (/\.(js|html|json)$/.test(f)) srcFiles.push(pathx.join(ROOT, d, f));
      }
      srcFiles.push(pathx.join(ROOT, 'data', 'entity-graph.json'), pathx.join(ROOT, 'data', 'best-json-entity-graph.json'), pathx.join(ROOT, 'data', 'locations.json'));
      for (const f of srcFiles) { const n = isOld(fsx.readFileSync(f, 'utf8')); if (n) srcHits.push(pathx.basename(f) + ':' + n); }
      let outHits = [];
      const walkDir = (dir, rel) => {
        for (const e of fsx.readdirSync(dir, { withFileTypes: true })) {
          const r = rel ? rel + '/' + e.name : e.name;
          if (e.isDirectory()) walkDir(pathx.join(dir, e.name), r);
          else if (/\.(json|txt|html|xml)$/.test(e.name) && !/^ai-verification-report/.test(e.name) && e.name !== 'ai-master-index.jws') {
            const n = isOld(fsx.readFileSync(pathx.join(dir, e.name), 'utf8'));
            if (n) outHits.push(r + ':' + n);
          }
        }
      };
      walkDir(PUB, '');
      let bundleHits = 0, bundleFiles = 0;
      const bundleDir = pathx.join(FLAT, 'api-worker', 'data', 'bundle');
      if (fsx.existsSync(bundleDir)) {
        const walkB = (dir) => {
          for (const e of fsx.readdirSync(dir, { withFileTypes: true })) {
            if (e.isDirectory()) walkB(pathx.join(dir, e.name));
            else { bundleFiles++; bundleHits += isOld(fsx.readFileSync(pathx.join(dir, e.name), 'utf8')); }
          }
        };
        walkB(bundleDir);
      }
      const shellTxt = fsx.readFileSync(pathx.join(PUB, 'index.html'), 'utf8');
      const deny = ['youtube.com/@theflatratemovers', 'x.com/ratemovers', 'github.com/TheFlatRateMovers', 'medium.com/@ratemovers']
        .map((d) => d + '=' + (shellTxt.split(d).length - 1));
      const denyOk = ['youtube.com/@theflatratemovers', 'x.com/ratemovers', 'github.com/TheFlatRateMovers', 'medium.com/@ratemovers']
        .every((d) => shellTxt.includes(d));
      check('CV-1 handle flip complete: zero old @theflatratemovers Instagram/Threads patterns in generator sources, served outputs and the API bundle; denylist handles untouched',
        srcHits.length === 0 && outHits.length === 0 && bundleHits === 0 && denyOk,
        'sources ' + (srcHits.length ? srcHits.slice(0, 3).join(';') : 'clean') + ', outputs ' + (outHits.length ? outHits.slice(0, 3).join(';') : 'clean') + ', bundle ' + bundleFiles + ' files/' + bundleHits + ' old, denylist in shell: ' + deny.join(', '));
    }

    // CV-2: identity propagation + the DC-5 DOI-identifier guard.
    {
      const Q = 'https://www.wikidata.org/wiki/Q141969215';
      const DOI_NEW = 'https://doi.org/10.5281/zenodo.23879048';
      const bad = [];
      for (const gf of ['entity-graph.json', 'best-json-entity-graph.json']) {
        const g = readJ(pathx.join(PUB, gf));
        const byId = (id) => (g['@graph'] || []).find((n) => n['@id'] === id);
        const org = byId('https://theflatratemovers.com/#organization');
        if (!org || !(org.sameAs || []).includes(Q)) bad.push(gf + ' org lacks Q141969215');
        const win = byId('https://theflatratemovers.com/#winchester');
        const mar = byId('https://theflatratemovers.com/#martinsburg');
        if (!win || !(win.sameAs || []).includes('https://www.openstreetmap.org/node/14340286372')) bad.push(gf + ' winchester OSM');
        if (!mar || !(mar.sameAs || []).includes('https://www.openstreetmap.org/node/14340286373')) bad.push(gf + ' martinsburg OSM');
        const book = byId('https://theflatratemovers.com/author/henry-pitts-jr/#book');
        if (!book) bad.push(gf + ' book node missing');
        else {
          if (!(book.sameAs || []).includes('https://www.wikidata.org/wiki/Q141969268')) bad.push(gf + ' book QID');
          const ids = JSON.stringify(book.identifier || '');
          if (!ids.includes('B0GRBKR5DS') || !ids.includes('2940185300718')) bad.push(gf + ' book identifiers');
        }
        const cat = byId('https://theflatratemovers.com/datasets/#collection');
        if (!cat) bad.push(gf + ' catalog node missing');
        else {
          if (!typeHasX(cat, 'DataCatalog')) bad.push(gf + ' catalog type');
          if (cat.identifier !== DOI_NEW) bad.push(gf + ' catalog identifier');
          if (!(cat.sameAs || []).includes('https://www.wikidata.org/wiki/Q141969285')) bad.push(gf + ' catalog QID');
        }
      }
      // DOI-identifier guard across every public JSON file.
      const doiHits = [];
      for (const f of fsx.readdirSync(PUB).filter((x) => x.endsWith('.json'))) {
        let doc; try { doc = readJ(pathx.join(PUB, f)); } catch (_) { continue; }
        walkO(doc, (n) => {
          const idf = n.identifier;
          const vals = [];
          if (typeof idf === 'string') vals.push(idf);
          if (Array.isArray(idf)) for (const e of idf) { if (typeof e === 'string') vals.push(e); else if (e && e.value) vals.push(String(e.value)); }
          if (idf && typeof idf === 'object' && !Array.isArray(idf) && idf.value) vals.push(String(idf.value));
          for (const v of vals) {
            const m = v.match(/10\.5281\/zenodo\.\d+/);
            if (m) doiHits.push(m[0] + '|' + f + '|' + (n['@id'] || '?'));
          }
        });
      }
      const expectedDoi = new Set([
        '10.5281/zenodo.23818766|ai-master-index.json|https://github.com/TheFlatRateMovers/theflatratemovers-ai#master-index',
        '10.5281/zenodo.23818766|dataset-intent-coverage.json|https://theflatratemovers.com/datasets/intent-coverage/#dataset',
        '10.5281/zenodo.23818766|datasets-intent-coverage.json|https://theflatratemovers.com/#dataset-intent-coverage-scope',
        '10.5281/zenodo.23818766|datasets-intent-coverage.json|https://theflatratemovers.com/#dataset-intent-coverage-taxonomy',
        '10.5281/zenodo.23818766|datasets-intent-coverage.json|https://theflatratemovers.com/#dataset-intent-coverage-resolution',
        '10.5281/zenodo.23818766|datasets-intent-coverage.json|https://theflatratemovers.com/#dataset-intent-coverage-totals',
        '10.5281/zenodo.23879048|entity-graph.json|https://theflatratemovers.com/datasets/#collection',
        '10.5281/zenodo.23879048|best-json-entity-graph.json|https://theflatratemovers.com/datasets/#collection',
        // Batch FB-2 (2026-11-03): the intent-coverage Dataset node is
        // now a graph citizen in both published graphs, and its DOI
        // identifier travels with the node (the DC-5 holder rule: every
        // instance of a holder @id carries the DOI URL). The two graph
        // seats are therefore lawful and enumerated here — 8 -> 10.
        '10.5281/zenodo.23818766|entity-graph.json|https://theflatratemovers.com/datasets/intent-coverage/#dataset',
        '10.5281/zenodo.23818766|best-json-entity-graph.json|https://theflatratemovers.com/datasets/intent-coverage/#dataset',
      ]);
      const extra = doiHits.filter((h) => !expectedDoi.has(h));
      const missing = [...expectedDoi].filter((h) => !doiHits.includes(h));
      check('CV-2 identity propagated (Q141969215 org, branch OSM nodes, Book + catalog nodes in both graphs) and DOI identifiers sit exactly on their ten lawful seats',
        bad.length === 0 && extra.length === 0 && missing.length === 0,
        (bad.concat(extra.map((e) => 'extra DOI: ' + e), missing.map((e) => 'missing DOI: ' + e))).slice(0, 4).join('; ') || doiHits.length + ' DOI identifier seats, all lawful');
    }

    // CV-3: llms.txt figures equal the sealed index + intent file.
    {
      const idx = readJ(pathx.join(PUB, 'ai-master-index.json'));
      const dist = idx.distribution || idx.distributions || [];
      const urls = dist.map((e) => e.contentUrl || e.url || '');
      const rootJson = urls.filter((u) => u.startsWith('https://theflatratemovers.com/') && !u.slice('https://theflatratemovers.com/'.length).includes('/') && u.endsWith('.json')).map((u) => u.split('/').pop());
      const excl = new Set(['ai-sitemap.json', 'ai-master-index.json', 'entity-graph.json', 'best-json-entity-graph.json', 'ai-license.json', 'ai-verification-report-2026-11-01.json', 'ai-verification-report-2026-11-01-e6b2.json']);
      const perPage = rootJson.filter((n) => !n.startsWith('datasets-') && !n.startsWith('dataset-') && !excl.has(n)).length;
      const dsCount = urls.filter((u) => /\/datasets-[^/]+\.json$/.test(u)).length;
      const intent = readJ(pathx.join(PUB, 'datasets-intent-coverage.json'));
      const totalsN = (intent['@graph'] || []).find((n) => (n['@id'] || '').endsWith('#dataset-intent-coverage-totals'));
      const rows = totalsN.rowSources.estateGenerated, targeted = totalsN.pageCoverage.pagesTargeted;
      const fmt = (n) => n.toLocaleString('en-US');
      const llms = fsx.readFileSync(pathx.join(PUB, 'llms.txt'), 'utf8');
      const bad = [];
      const para = (llms.match(/lists (\d+) distributions: the (\d+) published dataset files[\s\S]{0,300}?all (\d+) per-page JSON files/) || []);
      if (!para.length) bad.push('certificate paragraph shape not found');
      else {
        if (+para[1] !== dist.length) bad.push('total ' + para[1] + ' != ' + dist.length);
        if (+para[2] !== dsCount) bad.push('dataset files ' + para[2] + ' != ' + dsCount);
        if (+para[3] !== perPage) bad.push('per-page ' + para[3] + ' != ' + perPage);
      }
      if (!llms.includes('the ' + fmt(rows) + '-row search-intent rubric')) bad.push('line-59 rows figure');
      if (!llms.includes(fmt(rows) + ' generated query rows')) bad.push('line-65 rows figure');
      if (!llms.includes("every one of the site's " + targeted + ' pages is a rubric target')) bad.push('targeted pages figure');
      check('CV-3 llms.txt figures equal the sealed index and the intent dataset totals, computed in-check',
        bad.length === 0, bad.slice(0, 3).join('; ') || ('total ' + dist.length + ', datasets ' + dsCount + ', per-page ' + perPage + ', rows ' + rows + ', targeted ' + targeted));
    }

    // CV-4: hub counts — hero, hub JSON description, head description.
    {
      const nFiles = DATASET_FILES.length;
      const nSvc = services.services.length;
      const bad = [];
      const hubDoc = fsx.readFileSync(pathx.join(PUB, 'datasets', 'index.html'), 'utf8');
      if (!hubDoc.includes(nFiles + ' dataset files, published under CC BY 4.0, covering all ' + nSvc + ' services')) bad.push('hero');
      const hub = readJ(pathx.join(PUB, 'datasets.json'));
      const coll = (hub['@graph'] || [])[0];
      if (!coll.description.includes(nFiles + ' dataset files')) bad.push('datasets.json description');
      if (!typeHasX(coll, 'DataCatalog')) bad.push('hub @type lacks DataCatalog');
      if ((coll.hasPart || []).length !== nFiles) bad.push('hasPart ' + (coll.hasPart || []).length + ' != ' + nFiles);
      const headData = fsx.readFileSync(pathx.join(ROOT, '..', 'the-flat-rate-movers-pages', 'functions', 'head-data.js'), 'utf8');
      if (!headData.includes(nFiles + ' CC BY 4.0 dataset files')) bad.push('head-data description');
      check('CV-4 datasets hub reads ' + nFiles + ' files / ' + nSvc + ' services identically on hero, hub JSON (DataCatalog, hasPart complete) and head description',
        bad.length === 0, bad.join('; ') || 'all three surfaces agree');
    }

    // CV-5: intent landing figures pinned to the dataset file totals.
    {
      const intent = readJ(pathx.join(PUB, 'datasets-intent-coverage.json'));
      const totalsN = (intent['@graph'] || []).find((n) => (n['@id'] || '').endsWith('#dataset-intent-coverage-totals'));
      const routeDoc = fsx.readFileSync(pathx.join(PUB, 'datasets', 'intent-coverage', 'index.html'), 'utf8');
      const grab = (label) => { const m = routeDoc.match(new RegExp('<b>' + label + '</b></td><td>([\\d,]+)</td>')); return m ? +m[1].replace(/,/g, '') : null; };
      const bad = [];
      const want = {
        'Rubric rows': totalsN.rowSources.estateGenerated,
        'Services covered': (intent['@graph'] || []).filter((n) => (n.name || '').startsWith('Intent Coverage —')).length,
        'Registry pages': totalsN.pageCoverage.pagesTotal,
        'Pages targeted': totalsN.pageCoverage.pagesTargeted,
        'Nodes in this file': (intent['@graph'] || []).length,
      };
      for (const [k, v] of Object.entries(want)) { const got = grab(k); if (got !== v) bad.push(k + ': landing ' + got + ' != file ' + v); }
      const hero = routeDoc.match(/(\d[\d,]*) generated rows/);
      if (!hero || +hero[1].replace(/,/g, '') !== totalsN.rowSources.estateGenerated) bad.push('hero rows figure');
      check('CV-5 intent landing body figures equal the dataset file totals (rows, services, pages, targeted, nodes)',
        bad.length === 0, bad.slice(0, 3).join('; ') || JSON.stringify(want));
    }

    // CV-6: enrichment — datePublished table, catalog pointer,
    // variableMeasured on exactly six files, spatialCoverage shape,
    // and no version anywhere (parent decision D3).
    {
      const DATES = { 'answer-evidence': '2026-10-31', 'archive-registry': '2026-11-01', 'commercial': '2026-10-29', 'crating': '2026-10-29', 'crawl-presence': '2026-10-31', 'data-center-relocation': '2026-10-30', 'ffe-logistics': '2026-10-30', 'final-mile': '2026-10-29', 'freight-rework': '2026-11-01', 'government': '2026-10-29', 'gun-safe': '2026-10-29', 'industrial-commercial': '2026-10-29', 'industrial-offices': '2026-10-29', 'intent-coverage': '2026-10-30', 'ispm15': '2026-10-29', 'it': '2026-10-29', 'junk-removal': '2026-10-30', 'local-graph-registry': '2026-10-31', 'local-regional': '2026-10-29', 'long-distance': '2026-10-29', 'medical-lab-relocation': '2026-10-30', 'military': '2026-10-29', 'moving-and-storage': '2026-10-29', 'ocean-container': '2026-10-29', 'office': '2026-10-29', 'packing': '2026-10-29', 'piano-antique': '2026-10-29', 'ports': '2026-11-02', 'residential': '2026-10-29', 'route81': '2026-10-29', 'search-index': '2026-10-31', 'senior': '2026-10-29', 'sir-heavy': '2026-10-29', 'transloading': '2026-10-29', 'transloading-inland-port': '2026-10-30', 'transloading-winchester': '2026-10-29', 'vault-door-case-study': '2026-11-03', 'warehouse': '2026-10-29', 'warehouse-racking-relocation': '2026-10-30', 'white-glove': '2026-11-02' };
      const VM = new Set(['intent-coverage', 'search-index', 'answer-evidence', 'crawl-presence', 'local-graph-registry', 'archive-registry']);
      const NO_SC = new Set(['archive-registry', 'crawl-presence', 'local-graph-registry', 'videos']);
      const bad = [];
      for (const f of DATASET_FILES) {
        const slug = f.replace(/^datasets-/, '').replace(/\.json$/, '');
        const doc = readJ(pathx.join(PUB, f));
        const dsNodes = (doc['@graph'] || []).filter((n) => typeHasX(n, 'Dataset'));
        if (slug === 'videos') { if (dsNodes.length) bad.push('videos gained Dataset nodes'); continue; }
        if (!dsNodes.length) { bad.push(f + ': no Dataset nodes'); continue; }
        for (const n of dsNodes) {
          if (n.datePublished !== DATES[slug]) bad.push(f + ' datePublished ' + n.datePublished);
          if (!n.includedInDataCatalog || n.includedInDataCatalog['@id'] !== 'https://theflatratemovers.com/datasets/#collection') bad.push(f + ' catalog pointer');
          if ('version' in n) bad.push(f + ' carries version (D3 hold)');
          const hasVM = Array.isArray(n.variableMeasured) && n.variableMeasured.length > 0;
          if (VM.has(slug) && !hasVM) bad.push(f + ' variableMeasured missing');
          if (!VM.has(slug) && 'variableMeasured' in n) bad.push(f + ' variableMeasured unexpected');
          if (NO_SC.has(slug)) { if ('spatialCoverage' in n) bad.push(f + ' spatialCoverage unexpected'); }
          else {
            const sc = n.spatialCoverage || [];
            if (sc.length !== 2 || !sc.every((p) => p && p['@type'] === 'Place' && p.geo && typeof p.geo.latitude === 'number')) bad.push(f + ' spatialCoverage shape');
          }
          if (bad.length > 6) break;
        }
      }
      check('CV-6 enrichment complete on all 40 Dataset-bearing files (datePublished per the sourced table, catalog pointer, variableMeasured on exactly the six measurement files, full-Place spatialCoverage on 37, version nowhere)',
        bad.length === 0, bad.slice(0, 4).join('; ') || '40 files enriched per table');
    }

    // CV-7 + CV-8: local-graph registry totals and the backlink tier.
    {
      const lg = readJ(pathx.join(PUB, 'datasets-local-graph-registry.json'));
      const totNode = (lg['@graph'] || []).find((n) => (n['@id'] || '').endsWith('#dataset-local-graph-registry-totals'));
      const T = totNode.totals;
      const bad = [];
      if (T.sources !== 49) bad.push('sources ' + T.sources);
      if (T.coverageCells !== 98) bad.push('cells ' + T.coverageCells);
      if (T.thirdPartyRecords !== 120) bad.push('records ' + T.thirdPartyRecords);
      if (T.consolidatedOwnerSteps !== 6) bad.push('owner steps ' + T.consolidatedOwnerSteps);
      if (T.dateModified !== '2026-11-02') bad.push('DATE_MOD ' + T.dateModified);
      const covNode = (lg['@graph'] || []).find((n) => (n['@id'] || '').endsWith('#dataset-local-graph-registry-coverage'));
      for (const row of covNode.coverageMatrix) for (const b of ['winchester', 'martinsburg']) if (!row[b] || !row[b].state) bad.push('blank cell ' + row.sourceId + '/' + b);
      const recNode = (lg['@graph'] || []).find((n) => (n['@id'] || '').endsWith('#dataset-local-graph-registry-records'));
      const NEWCH = ['wikidata-company-item', 'wikidata-book-item', 'wikidata-dataset-item', 'openstreetmap-w-node', 'openstreetmap-m-node', 'google-publisher-center-company-publication', 'instagram-company-profile', 'threads-company-profile'];
      for (const id of NEWCH) {
        const r = recNode.thirdPartyRecords.find((x) => x.recordId === id);
        if (!r) bad.push('missing record ' + id);
        else if (r.lastVerified.date !== '2026-11-02') bad.push(id + ' lastVerified ' + r.lastVerified.date);
      }
      check('CV-7 local-graph registry: 49 sources x 2 = 98 cells, 120 records, exactly 6 owner steps, DATE_MOD 2026-11-02, eight new-channel records verified 2026-11-02',
        bad.length === 0, bad.slice(0, 4).join('; ') || 'registry totals exact');

      const blNode = (lg['@graph'] || []).find((n) => (n['@id'] || '').endsWith('#dataset-local-graph-registry-backlinks'));
      const bad8 = [];
      if (!blNode) bad8.push('backlinks node missing');
      const entries = [];
      if (blNode) {
        for (const r of blNode.backlinkRecords || []) entries.push(r);
      }
      for (const r of recNode.thirdPartyRecords) for (const b of r.backlinks || []) entries.push(b);
      const uniq = new Set(entries.map((e) => e.referring_domain + '|' + e.referring_page + '|' + e.target_url));
      const recorded = entries.filter((e) => e.class === 'recorded').length;
      const review = entries.filter((e) => e.class === 'review').length;
      if (entries.length !== 33) bad8.push('entries ' + entries.length + ' != 33');
      if (uniq.size !== entries.length) bad8.push('dedupe collision');
      if (recorded !== 19) bad8.push('recorded ' + recorded + ' != 19');
      if (review !== 14) bad8.push('review ' + review + ' != 14');
      for (const e of entries) if (!e.source || !e.verification_status) bad8.push('entry without source/status: ' + e.referring_domain);
      const FAILS = [
        'eagleswing.org|https://eagleswing.org/united-states/winchester/christian-owned-businesses/the-flat-rate-movers|https://theflatratemovers.com',
        'bulletinvision.com|https://bulletinvision.com/the-benefits-of-hiring-professional-movers-for-your-winchester-va-move|https://theflatratemovers.com/gun-safe-movers',
        'bulletinvision.com|https://bulletinvision.com/the-benefits-of-hiring-professional-movers-for-your-winchester-va-move|https://theflatratemovers.com',
        'bulletinvision.com|https://bulletinvision.com/the-benefits-of-hiring-professional-movers-for-your-winchester-va-move|https://theflatratemovers.com/online-estimate',
        'vetbizlive.com|https://vetbizlive.com/united-states/winchester/transportation-logistics/the-flat-rate-movers|https://theflatratemovers.com',
        'texomaland.com|https://texomaland.com/listings?lid=59292|https://theflatratemovers.com',
        'allthought.com|https://allthought.com/biz/va/winchester/the-flat-rate-movers|https://theflatratemovers.com',
        'longdistancemovinginwinchesterva.blogspot.com|https://longdistancemovinginwinchesterva.blogspot.com|https://theflatratemovers.com',
        'longdistancemovinginwinchesterva.blogspot.com|https://longdistancemovinginwinchesterva.blogspot.com|https://theflatratemovers.com/gun-safe-movers',
        'movingboxes-app.com|https://movingboxes-app.com/en/partner/nvdi5e65xd/0,0,1,0.html|https://theflatratemovers.com',
        'movingboxes-app.com|https://movingboxes-app.com/de/partner/nvdi5e65xd|https://theflatratemovers.com',
        'movingboxes-app.com|https://movingboxes-app.com/en/partner/nvdi5e65xd|https://theflatratemovers.com',
        'starcourts.com|https://starcourts.com/make-money-at-home-with-affiliate-marketing|https://theflatratemovers.com',
      ];
      for (const f of FAILS) if (uniq.has(f)) bad8.push('FAIL row published: ' + f.split('|')[0]);
      check('CV-8 backlink tier published exactly as verified: 19 recorded + 14 fetch-verified review entries, dedupe-unique, every entry sourced, zero FAIL rows',
        bad8.length === 0, bad8.slice(0, 4).join('; ') || entries.length + ' entries (' + recorded + ' recorded, ' + review + ' review)');
    }
  }


  // ================================================================
  // 32. PORTS & INTERMODAL PROGRAM GATES (Ports P1 Foundation,
  // 2026-11-02; dossier section 7.5 / section 10). PB-1 binding
  // consistency, PB-2 no orphan numbers, PB-3 no-claim scan — over
  // the ports database (data/ports.json, the single source), the
  // generated ports dataset file, its landing per-page JSON, and the
  // port nodes in both live graphs. GBP service assignment derives
  // from the same binding map and is recorded in the batch record
  // (Winchester GBP: VIP, Norfolk, Richmond; Martinsburg GBP:
  // Baltimore, Wilmington, PhilaPort).
  // ================================================================
  try {
    const readPB = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
    const dbPB = readPB(path.join(ROOT, 'data', 'ports.json'));
    const dsPB = readPB(path.join(PAGES_PUBLIC, 'datasets-ports.json'));
    const ldPB = readPB(path.join(PAGES_PUBLIC, 'dataset-ports.json'));
    const egPB = readPB(path.join(PAGES_PUBLIC, 'entity-graph.json'));
    const bgPB = readPB(path.join(PAGES_PUBLIC, 'best-json-entity-graph.json'));
    const portNodesOf = (doc) => new Map(((doc && doc['@graph']) || [])
      .filter((n) => n && n['@type'] === 'Place' && String(n['@id'] || '').includes('/datasets/ports/#port-'))
      .map((n) => [String(n['@id']).split('#').pop(), n]));
    const dsPorts = portNodesOf(dsPB);
    const egPorts = portNodesOf(egPB);
    const bgPorts = portNodesOf(bgPB);

    // PB-1: binding consistency — database binding map, dataset port
    // nodes, graph port nodes and every coverage cell must agree.
    {
      const bad = [];
      if (!dbPB.bindingMap || Object.keys(dbPB.bindingMap).length !== 6) bad.push('bindingMap does not carry 6 ports');
      for (const p of dbPB.ports || []) {
        const mapBranch = dbPB.bindingMap && dbPB.bindingMap[p.id] && dbPB.bindingMap[p.id].branch;
        if (mapBranch !== p.branchBinding.branch) bad.push(p.id + ': entity binding != bindingMap');
        for (const [label, m] of [['dataset', dsPorts], ['entity graph', egPorts], ['best graph', bgPorts]]) {
          const n = m.get(p.id);
          if (!n) { bad.push(p.id + ': missing from ' + label); continue; }
          if (!n.branchBinding || n.branchBinding.branch !== p.branchBinding.branch) bad.push(p.id + ': branch in ' + label);
          if (n.branchBinding && n.branchBinding.bindingBasis !== p.branchBinding.bindingBasis) bad.push(p.id + ': basis in ' + label);
        }
      }
      for (const c of dbPB.serviceCoverage || []) {
        if (!dbPB.bindingMap[c.port] || c.boundBranch !== dbPB.bindingMap[c.port].branch) bad.push('coverage cell binding: ' + c.port + '/' + c.serviceColumn);
      }
      const masterPB = ((dsPB['@graph'] || []).find((n) => n && n['@type'] === 'Dataset' && String(n['@id'] || '').endsWith('#dataset-ports')) || {});
      if (!ldPB['@graph'] || !ldPB['@graph'][0] || ldPB['@graph'][0].description !== masterPB.description) bad.push('landing per-page JSON description != dataset master description');
      check('PB-1 ports branch binding is consistent everywhere it is stated (database binding map == port entities == dataset nodes == both graph copies == all 48 coverage cells; landing description == master description)',
        bad.length === 0, bad.slice(0, 4).join('; ') || '6 ports, one binding map, 48 cells in agreement');
    }

    // PB-2: no orphan numbers — every volume figure in the dataset
    // and the graphs traces to a database volumes[] entry (value +
    // unit + period), and every port node carries its sources.
    {
      const bad = [];
      for (const p of dbPB.ports || []) {
        for (const [label, m] of [['dataset', dsPorts], ['entity graph', egPorts], ['best graph', bgPorts]]) {
          const n = m.get(p.id);
          if (!n) continue;
          if (!Array.isArray(n.sources) || !n.sources.length) bad.push(p.id + ': no sources in ' + label);
          const dv = n.volumes || [];
          if (dv.length !== (p.volumes || []).length) bad.push(p.id + ': volume count in ' + label + ' (' + dv.length + ' != ' + (p.volumes || []).length + ')');
          for (const v of dv) {
            if (!(p.volumes || []).some((w) => w.value === v.value && w.unit === v.unit && w.period === v.period)) {
              bad.push(p.id + ': orphan volume in ' + label + ' (' + v.value + ' ' + v.unit + ' ' + v.period + ')');
            }
          }
        }
        for (const v of p.volumes || []) {
          if (v.value == null || !v.unit || !v.period || !v.source) bad.push(p.id + ': database volume without value/unit/period/source');
        }
      }
      check('PB-2 no orphan numbers in the ports surfaces (every volume figure traces to the ports database with value, unit, period and source; every port node carries sources)',
        bad.length === 0, bad.slice(0, 4).join('; ') || 'all volumes trace to data/ports.json');
    }

    // PB-3: no-claim scan — TWIC credential claims not grounded in
    // crew/contractor card-holding, drayage as the company's own
    // service, port tenancy or port-authority relationship claims,
    // any Wilmington volume figure, and any PhilaPort mileage-
    // advantage claim are barred from the ports surfaces.
    {
      const surfaces = {
        'datasets-ports.json': JSON.stringify(dsPB),
        'dataset-ports.json': JSON.stringify(ldPB),
        'data/ports.json': JSON.stringify(dbPB),
        'graph port nodes': JSON.stringify([...egPorts.values()]) + JSON.stringify([...bgPorts.values()]),
      };
      const bad = [];
      const claimPats = [
        [/twic[-\s]?(certified|certification|credentialed)/i, 'TWIC credential claim'],
        [/our (own )?(terminal|berth|dock) at/i, 'port tenancy claim'],
        [/port (partner|partnership)/i, 'port-authority relationship claim'],
        [/official (port|terminal)/i, 'official port claim'],
        [/we (offer|provide|run|do) (port )?drayage/i, 'drayage as own service'],
        [/drayage (services|company|provider)/i, 'drayage as own service'],
        [/world'?s largest banana/i, 'unverified Wilmington banana claim'],
        [/#1 automobile port|first port for automobiles/i, 'stale Baltimore autos claim'],
        [/philaport[^.]{0,140}(mileage advantage|fewer miles|less miles|shorter (route|distance))/i, 'PhilaPort mileage-advantage claim'],
      ];
      for (const [label, text] of Object.entries(surfaces)) {
        for (const [re, why] of claimPats) {
          const hits = text.match(new RegExp('[^.]*' + re.source + '[^.]*', 'gi')) || [];
          for (const h of hits) {
            if (/\b(not|no|never)\b/i.test(h) && /mileage advantage/i.test(h)) continue;
            bad.push(label + ': ' + why);
          }
        }
        const gt = text.match(/[^.]*(gulftainer|gt usa)[^.]*/gi) || [];
        for (const h of gt) if (!/\b(former|cancelled|canceled|gone|no longer|not|never|stale)\b/i.test(h)) bad.push(label + ': stale Wilmington operator credited');
        const dr = text.match(/[^.]*\bdrayage\b[^.]*/gi) || [];
        for (const h of dr) if (!/\b(not|no|never|does not|do not)\b/i.test(h)) bad.push(label + ': drayage outside a negation context');
      }
      const wil = dsPorts.get('port-of-wilmington-de');
      if (!wil || (wil.volumes || []).length !== 0) bad.push('Wilmington carries a volume figure in the dataset');
      const masterText = ((dsPB['@graph'] || []).find((n) => n && n['@type'] === 'Dataset') || {}).description || '';
      if (!/crews hold TWIC cards/.test(masterText) || !/contractors hold valid TWIC cards/.test(masterText)) bad.push('settled TWIC card-holding wording missing from the master dataset description');
      check('PB-3 ports no-claim scan (no TWIC credential claims — crew/contractor card-holding wording only; no drayage as own service; no port tenancy or relationship claims; no Wilmington volume; no PhilaPort mileage advantage)',
        bad.length === 0, bad.slice(0, 4).join('; ') || 'ports surfaces clean');
    }
  } catch (e) { check('§32 ports gates PB-1..PB-3 execute', false, String(e && e.message || e)); }


  // ================================================================
  // 33. BLOG GRAPH JOIN GATES (Batch Blog Graph Join, 2026-11-03;
  // Henry's direct order). The blog was never joined into the graph
  // builder's inputs: every post carried its BlogPosting node in its
  // own page and the signed index, but neither published graph held
  // a Blog node or any article node (0/12, parent-verified live
  // 2026-11-03) and llms-full.txt named only 7 of 12 posts. BG-1..
  // BG-3 pin the join permanently: every manifest post's BlogPosting
  // @id — the exact @id its own per-page JSON serves — present in
  // BOTH published graphs with headline + dates mirrored, the Blog
  // node present in both, the machine-repo data/ mirrors carrying
  // the same join, and llms-full.txt naming every post. A future
  // post that misses any surface fails the seal.
  // ================================================================
  try {
    const SITE_BG = 'https://theflatratemovers.com';
    const readBG = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
    const mfBG = readBG(path.join(ROOT, 'data', 'news-formula.json'));
    const postsBG = Array.isArray(mfBG.posts) ? mfBG.posts : [];
    const postingOf = (slug) => {
      const d = readBG(path.join(PAGES_PUBLIC, slug + '.json'));
      return (d['@graph'] || []).find((n) => n && String(n['@type']).includes('BlogPosting')) || null;
    };
    const blogIdBG = SITE_BG + '/blog/#blog';
    const graphJoinState = (doc) => {
      const g = (doc && doc['@graph']) || [];
      const byId = new Map(g.filter((n) => n && n['@id']).map((n) => [n['@id'], n]));
      const postingCount = g.filter((n) => n && String(n['@type']).includes('BlogPosting')).length;
      const bad = [];
      if (!byId.has(blogIdBG)) bad.push('Blog node missing');
      for (const p of postsBG) {
        const src = postingOf(p.slug);
        if (!src) { bad.push(p.slug + ': no per-page BlogPosting'); continue; }
        const gn = byId.get(src['@id']);
        if (!gn) { bad.push(p.slug + ': missing'); continue; }
        if (gn.headline !== src.headline) bad.push(p.slug + ': headline differs');
        if (gn.datePublished !== src.datePublished || gn.dateModified !== src.dateModified) bad.push(p.slug + ': dates differ');
        if (!gn.isPartOf || gn.isPartOf['@id'] !== blogIdBG) bad.push(p.slug + ': isPartOf not the Blog node');
      }
      if (postingCount !== postsBG.length) bad.push('BlogPosting node count ' + postingCount + ' != manifest ' + postsBG.length);
      return bad;
    };

    // BG-1: the two published graphs (site root) carry the join.
    {
      const bad = [];
      for (const [label, f] of [['entity-graph.json', path.join(PAGES_PUBLIC, 'entity-graph.json')], ['best-json-entity-graph.json', path.join(PAGES_PUBLIC, 'best-json-entity-graph.json')]]) {
        for (const b of graphJoinState(readBG(f))) bad.push(label + ': ' + b);
      }
      check('BG-1 both published graphs carry the Blog node and every manifest post\u2019s BlogPosting node (exact @id, headline + dates mirrored, isPartOf chained)',
        postsBG.length >= 1 && bad.length === 0, bad.slice(0, 4).join('; ') || (postsBG.length + ' posts joined in both graphs'));
    }

    // BG-2: the machine-repo data/ graph mirrors carry the same join.
    {
      const bad = [];
      for (const [label, f] of [['data/entity-graph.json', path.join(ROOT, 'data', 'entity-graph.json')], ['data/best-json-entity-graph.json', path.join(ROOT, 'data', 'best-json-entity-graph.json')]]) {
        for (const b of graphJoinState(readBG(f))) bad.push(label + ': ' + b);
      }
      check('BG-2 the machine-repo data/ graph mirrors carry the same blog join (Blog node + every BlogPosting node)',
        postsBG.length >= 1 && bad.length === 0, bad.slice(0, 4).join('; ') || (postsBG.length + ' posts joined in both mirrors'));
    }

    // BG-3: llms-full.txt names every published post.
    {
      const fullBG = fs.readFileSync(path.join(PAGES_PUBLIC, 'llms-full.txt'), 'utf8');
      const missing = postsBG.filter((p) => !fullBG.includes(SITE_BG + '/' + p.slug + '/')).map((p) => p.slug);
      check('BG-3 llms-full.txt names every published post (full enumeration from the News Formula manifest)',
        postsBG.length >= 1 && missing.length === 0, missing.join(', ') || (postsBG.length + '/' + postsBG.length + ' posts named'));
    }
  } catch (e) { check('§33 blog graph join gates BG-1..BG-3 execute', false, String(e && e.message || e)); }


  // ================================================================
  // 34. DATASET GRAPH CITIZENSHIP GATES (Batch FB-2, 2026-11-03).
  // The full-URL audit found exactly ONE Dataset node (ports) in
  // each published graph: the other dataset files were sealed,
  // API-served and pinged but not graph citizens. FB-2 derives ONE
  // citizenship node per dataset file — the landing's per-page
  // summary node (or the file's own node when it shares the summary
  // @id; ports), copied verbatim with `distribution` dropped and
  // `includedInDataCatalog` set to the estate catalog, the Ports P1
  // transform — and syncs it into both published graphs and both
  // machine-repo data/ mirrors (scripts/sync-dataset-graph-nodes.js).
  // DG-1..DG-4 pin the citizenship permanently: the expected set is
  // re-derived here from the signed index + sealed sources with the
  // SAME algorithm as the sync tool, never a hard-coded list, so a
  // future dataset file that misses any graph copy — or a source
  // edit that leaves a citizen stale — fails the seal.
  // ================================================================
  try {
    const SITE_DG = 'https://theflatratemovers.com';
    const readDG = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
    const sortKeysDG = (o) => {
      if (Array.isArray(o)) return o.map(sortKeysDG);
      if (o && typeof o === 'object') {
        const r = {};
        for (const k of Object.keys(o).sort()) r[k] = sortKeysDG(o[k]);
        return r;
      }
      return o;
    };
    const deepEqualDG = (a, b) => JSON.stringify(sortKeysDG(a)) === JSON.stringify(sortKeysDG(b));
    const nodesOfDG = (doc) => {
      if (doc && Array.isArray(doc['@graph'])) return doc['@graph'];
      return Array.isArray(doc) ? doc : [doc];
    };
    const CATALOG_DG = { '@id': SITE_DG + '/datasets/#collection' };

    // File set: the signed index's dataset-file distributions; the
    // PUB disk set must equal it (offenders named in setBadDG).
    const idxDG = readDG(path.join(PAGES_PUBLIC, 'ai-master-index.json'));
    const fileSetDG = [...new Set((idxDG.distribution || [])
      .map((d) => d && d.contentUrl)
      .filter((u) => typeof u === 'string' && /^https:\/\/theflatratemovers\.com\/datasets-[^/]+\.json$/.test(u))
      .map((u) => u.split('/').pop()))].sort();
    const diskSetDG = fs.readdirSync(PAGES_PUBLIC).filter((f) => /^datasets-.+\.json$/.test(f)).sort();
    const setBadDG = [];
    for (const f of diskSetDG) if (!fileSetDG.includes(f)) setBadDG.push(f + ' on disk but not in the signed index');
    for (const f of fileSetDG) if (!diskSetDG.includes(f)) setBadDG.push(f + ' in the signed index but missing from PUB');

    // Derivation — the sync tool's rule (pattern-spec §4). A failure
    // throws with the stem named and fails the wrapper check.
    const deriveDG = (f) => {
      const stem = f.replace(/^datasets-/, '').replace(/\.json$/, '');
      const landing = SITE_DG + '/datasets/' + stem + '/';
      const candIds = new Set([landing + '#dataset', landing + '#dataset-' + stem, SITE_DG + '/' + f + '#dataset']);
      const ppDoc = readDG(path.join(PAGES_PUBLIC, 'dataset-' + stem + '.json'));
      const ppHits = nodesOfDG(ppDoc).filter((n) => n && n['@type'] === 'Dataset' && candIds.has(n['@id']));
      if (ppHits.length !== 1) throw new Error(stem + ': expected exactly 1 summary Dataset node in per-page JSON, got ' + ppHits.length);
      let src = ppHits[0];
      const fDoc = readDG(path.join(PAGES_PUBLIC, f));
      const fHits = nodesOfDG(fDoc).filter((n) => n && n['@type'] === 'Dataset' && n['@id'] === src['@id']);
      if (fHits.length === 1) src = fHits[0];
      if (fHits.length > 1) throw new Error(stem + ': multiple file nodes share the summary @id');
      const node = JSON.parse(JSON.stringify(src));
      delete node.distribution;
      if (node.includedInDataCatalog && !deepEqualDG(node.includedInDataCatalog, CATALOG_DG)) {
        throw new Error(stem + ': pre-existing includedInDataCatalog differs from the catalog ref');
      }
      node.includedInDataCatalog = { ...CATALOG_DG };
      if (typeof node.description !== 'string' || node.description.length < 50 || node.description.length > 5000) {
        throw new Error(stem + ': description outside the 50-5000 bound (DC-1 preview)');
      }
      if (node.url !== landing) throw new Error(stem + ': summary url is not the landing: ' + node.url);
      if (!node.identifier) throw new Error(stem + ': summary node lacks identifier');
      if (node.isAccessibleForFree !== true) throw new Error(stem + ': isAccessibleForFree is not true');
      for (const k of ['datePublished', 'dateModified']) {
        if (node[k] !== undefined && !/^\d{4}-\d{2}-\d{2}/.test(node[k])) throw new Error(stem + ': ' + k + ' not ISO (DC-3 preview)');
      }
      if (node.datePublished && node.dateModified && node.dateModified < node.datePublished) {
        throw new Error(stem + ': dateModified < datePublished (DC-3 preview)');
      }
      return node;
    };
    const citizensDG = fileSetDG.map((f) => deriveDG(f));
    const citizenIdsDG = new Set(citizensDG.map((n) => n['@id']));
    const derivedByIdDG = new Map(citizensDG.map((n) => [n['@id'], n]));
    const datasetNodesDG = (doc) => nodesOfDG(doc).filter((n) => n && n['@type'] === 'Dataset');
    const copiesDG = [
      ['PUB entity-graph.json', path.join(PAGES_PUBLIC, 'entity-graph.json'), 'pub'],
      ['PUB best-json-entity-graph.json', path.join(PAGES_PUBLIC, 'best-json-entity-graph.json'), 'pub'],
      ['data/entity-graph.json', path.join(ROOT, 'data', 'entity-graph.json'), 'mirror'],
      ['data/best-json-entity-graph.json', path.join(ROOT, 'data', 'best-json-entity-graph.json'), 'mirror'],
    ].map(([label, f, kind]) => ({ label, kind, nodes: datasetNodesDG(readDG(f)) }));
    const citizenshipBad = (kind) => {
      const bad = [];
      for (const c of copiesDG.filter((x) => x.kind === kind)) {
        for (const n of citizensDG) {
          const hits = c.nodes.filter((x) => x['@id'] === n['@id']).length;
          if (hits !== 1) bad.push(c.label + ': ' + n['@id'] + ' x' + hits);
        }
      }
      return bad;
    };

    // DG-1: citizenship in the two published graphs (+ index/disk set agreement).
    {
      const bad = [...setBadDG, ...citizenshipBad('pub')];
      check('DG-1 every dataset file in the signed index has exactly one Dataset citizenship node in both published graphs',
        fileSetDG.length >= 1 && bad.length === 0,
        bad.slice(0, 4).join('; ') || (citizensDG.length + ' citizens in both published graphs'));
    }

    // DG-2: citizenship in the machine-repo data/ mirrors.
    {
      const bad = citizenshipBad('mirror');
      check('DG-2 the machine-repo data/ graph mirrors carry the same dataset citizenship (exactly one node per dataset @id)',
        fileSetDG.length >= 1 && bad.length === 0,
        bad.slice(0, 4).join('; ') || (citizensDG.length + ' citizens in both mirrors'));
    }

    // DG-3: content sync — every citizenship node deep-equals its derivation.
    {
      const bad = [];
      for (const c of copiesDG) {
        for (const n of citizensDG) {
          const hits = c.nodes.filter((x) => x['@id'] === n['@id']);
          if (hits.length === 1 && !deepEqualDG(hits[0], derivedByIdDG.get(n['@id']))) bad.push(c.label + ': ' + n['@id'] + ' differs from its derived source');
        }
      }
      check('DG-3 every citizenship node deep-equals its derived source node (verbatim copy, distribution dropped, catalog join set) in all four graph copies',
        bad.length === 0, bad.slice(0, 4).join('; ') || (citizensDG.length + ' citizens in sync across 4 copies'));
    }

    // DG-4: no extras — Dataset @id set per copy equals the derived set.
    {
      const bad = [];
      for (const c of copiesDG) {
        const ids = new Set(c.nodes.map((n) => n['@id']));
        for (const id of ids) if (!citizenIdsDG.has(id)) bad.push(c.label + ': extra Dataset node ' + id);
        if (ids.size !== citizenIdsDG.size) bad.push(c.label + ': Dataset @id set size ' + ids.size + ' != derived ' + citizenIdsDG.size);
      }
      check('DG-4 no extra Dataset nodes in any graph copy (the Dataset @id set equals the derived citizenship set exactly)',
        bad.length === 0, bad.slice(0, 4).join('; ') || 'citizenship set exact in all four copies');
    }
  } catch (e) { check('§34 dataset graph citizenship gates DG-1..DG-4 execute', false, String(e && e.message || e)); }

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
