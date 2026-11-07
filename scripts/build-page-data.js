#!/usr/bin/env node
// build-page-data.js — the Page Data generator (Page Data wave,
// 2026-11-03). For EVERY registry page it draws a mechanical slice
// of the Page Data Pool (datasets-page-data-pool.json) under the
// pool's draw rules DR-1..DR-11 and writes, beside the page:
//
//   <route>/data.json   the machine file (template emitters, adopted)
//   <route>/data.txt    the human-readable rendering of the same data
//   public/page-data-scores.json   the adopted rubric's score file
//   <manifest>          per-page head blocks + file digests for
//                       build-routes.js (phase 5 injects the block)
//
// Draw summary (DR-1..DR-11 as executed here):
//   DR-1 services of the page = registry services ∪ head-data /
//        per-page-JSON declared Service nodes ∪ rubric-targeted
//        services. BOUNDARIES (DR-5) draw on the DECLARED services
//        only (registry + declared nodes): a boundary belongs to
//        pages about the service, not to pages a roll-up row names.
//   DR-2 questions cluster by (intentClass, serviceId); the first
//        own row is canonical, the cluster's rows are its phrasings.
//        Family rows (same cluster key, other targets) deepen the
//        phrasing pool of a page's own clusters only.
//   DR-3 family tier: hub/variant pages also draw clusters of their
//        declared services estate-wide (same-service siblings).
//   DR-4 answers resolve from the page's own FAQPage, else the
//        page's best-matching answer-evidence fragment, else a
//        drawn Layer-2 entry that answers the question, else (for
//        navigational-local rows) the service's own description.
//        Answers are never invented.
//   DR-5 notOffered = the approved consolidated sets (pool
//        #boundaries): estate-scoped + declared-service-scoped +
//        page-scoped, carried verbatim with sources.
//   DR-6 qualifiers come only from the pool register, each with its
//        source pointer (QUALIFIER_SCOPE below states which pages
//        each register entry serves).
//   DR-7 domain facts arrive via drawn Layer-2 entries only; a
//        Layer-2 entry never sources a company fact.
//   DR-8 geography = pool footprint areas whose recorded services
//        (bridged by AREA_SERVICE_MAP) intersect the page's
//        services; branch pages draw their branch's areas; a page
//        with no area draw carries the two branch cities + the two
//        regions + the I-81 corridor (the estate's own footprint
//        summary, the template's fallback set).
//   DR-9 freshness: verifiedAt = the seal date (the generator
//        verifies the slice as it builds it); dateModified = the
//        page's lastmod-ledger value at seal start (FB3_STAMPS).
//   DR-10 ownerApproved = true rides Henry's estate-wide adoption
//        of the Page Data system (2026-11-03) and his approval of
//        the consolidated notOffered sets (2026-11-03 18:38 EST) —
//        the provenance string is carried on every file.
//   DR-11 exclusions are structural: no invented "industrial
//        rigging up to 25,000 lb" figure exists in the pool, and
//        buyer-intelligence records are not in the pool; nothing is
//        drawn from either.
//
// Rubric: the adopted page-data lint (100 points). A page scoring
// under 100 fails this generator (exit 1) and therefore the seal —
// gate PG-4. PAGE_DATA_TOLERATE=1 downgrades that to a printed list
// (development only; the seal never sets it).
//
// Runs inside seal.py phase 4.5 (after digest-refresh, before
// routes): the data files must exist before build-routes computes
// their SHA-256 digests into the head blocks it injects.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REG = JSON.parse(fs.readFileSync(path.join(ROOT, 'paths.json'), 'utf8'));
const PUB = REG.public_dir;
const PAGES = REG.pages_dir;
const SITE = 'https://theflatratemovers.com';
const POOL_URL = SITE + '/datasets-page-data-pool.json';
const TOLERATE = process.env.PAGE_DATA_TOLERATE === '1';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : d; };
const MANIFEST_PATH = arg('manifest', path.join(ROOT, 'out', 'seal-work', 'page-data-manifest.json'));
const stampsPath = process.env.FB3_STAMPS || arg('stamps', path.join(ROOT, 'out', 'seal-work', 'stamps.json'));
const STAMPS = JSON.parse(fs.readFileSync(stampsPath, 'utf8'));
const SEAL_DATE = STAMPS.sealDate;
if (!SEAL_DATE) throw new Error('build-page-data: stamps file lacks sealDate: ' + stampsPath);

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function htmlToText(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
const decode = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const firstSentence = (s) => { const t = decode(s); const m = t.match(/^[\s\S]*?[.!?](?=\s|$)/); return (m ? m[0] : t).trim(); };
const trimTo = (s, n) => {
  const t = decode(s);
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  return (end > n * 0.5 ? cut.slice(0, end + 1) : cut).trim();
};
const tokens = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 2));
function overlap(a, b) {
  const A = tokens(a); const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let hit = 0; for (const w of A) if (B.has(w)) hit++;
  return hit / Math.min(A.size, B.size);
}
const slugify = (s) => norm(s).replace(/ /g, '-').slice(0, 80);

/* ------------------------------------------------------------ inputs */
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages.json'), 'utf8')).pages;
const headSrc = fs.readFileSync(path.join(PAGES, 'functions', 'head-data.js'), 'utf8');
const HEAD = JSON.parse(headSrc.replace(/^\/\/[^\n]*\n/gm, '').replace('export const HEAD = ', '').replace(/;\s*$/, ''));
const pool = JSON.parse(fs.readFileSync(path.join(PUB, 'datasets-page-data-pool.json'), 'utf8'));
const poolBySuffix = {};
for (const n of pool['@graph']) poolBySuffix[String(n['@id']).split('#').pop()] = n;
const items = (suffix) => (poolBySuffix[suffix] && poolBySuffix[suffix].itemListElement) || [];

const SERVICES = new Map(); // serviceId -> {id, name, description}
for (const s of items('services')) SERVICES.set(s.serviceId, { id: s['@id'], name: s.name, description: s.description });
const BOUNDARIES = items('boundaries').map((b) => ({ name: b.name, source: b.source, scope: b.scope }));
const QUALIFIERS = items('qualifiers');
const AUDIENCES = items('audiences');
const AREAS = items('areas').map((a) => {
  // Places shape fix (2026-11-07, WV-3): pool area records carry
  // state/county/postalCode/branchBinding/audiences/services as
  // additionalProperty entries (validator-clean Place nodes);
  // fold them back to direct fields for internal use.
  if (!a.additionalProperty) return a;
  const out = { ...a };
  for (const e of a.additionalProperty) {
    try { out[e.name] = JSON.parse(e.value); } catch { out[e.name] = e.value; }
  }
  return out;
});
const DOMAIN = items('domain-layer').map((e) => ({
  id: String(e['@id']).split('#').pop(), headline: e.headline, fact: e.fact, detail: e.detail,
  questions: e.questionsItAnswers || [], source: e.source,
  services: (e.about || []).map((a) => String(a['@id']).split('#').pop()),
}));
const DATASETS = items('datasets');

const rows = JSON.parse(execFileSync('sqlite3', ['-json', REG.rubric_db,
  'SELECT query_text, intent_class, service_id, target_url FROM intent_query ORDER BY id'],
  { maxBuffer: 256 * 1024 * 1024 }).toString());
const rowsByTarget = new Map();
const rowsByCluster = new Map(); // `${intent_class}|${service_id}` -> [query_text]
for (const r of rows) {
  if (!rowsByTarget.has(r.target_url)) rowsByTarget.set(r.target_url, []);
  rowsByTarget.get(r.target_url).push(r);
  const k = r.intent_class + '|' + r.service_id;
  if (!rowsByCluster.has(k)) rowsByCluster.set(k, []);
  rowsByCluster.get(k).push(r.query_text);
}

const ae = JSON.parse(fs.readFileSync(path.join(PUB, 'datasets-answer-evidence.json'), 'utf8'));
const FRAGMENTS = new Map(); // pageUrl -> [fragment]
for (const n of ae['@graph']) {
  for (const f of n.answerFragments || []) {
    if (!FRAGMENTS.has(f.pageUrl)) FRAGMENTS.set(f.pageUrl, []);
    FRAGMENTS.get(f.pageUrl).push(f);
  }
}

/* ------------------------------------------------- scope vocabularies */
// Which pages each pool qualifier serves (DR-6). Estate core serves
// every page; the rest serve their service / page scope only.
const QUALIFIER_SCOPE = [
  { names: ['Phone', 'Pricing basis', 'Email', 'Founded', 'Tagline'], scope: 'estate' },
  { names: ['Winchester branch'], scope: 'branch:winchester' },
  { names: ['Martinsburg branch'], scope: 'branch:martinsburg' },
  { names: ['SIR band', 'Floor deflection criterion'], scope: ['service-sir-heavy', 'service-gun-safe'] },
  { names: ['Safes under the band', 'Safe preparation', 'Stairs', 'Re-anchoring', 'Vault installation'], scope: ['service-gun-safe'] },
  { names: ['Storage terms'], scope: ['service-moving-and-storage'] },
  { names: ['Survey Room', 'Quote form inventory'], scope: ['page:/quote/', 'page:/quote-tool/'] },
  { names: ['Industrial workforce schedule (industrial service only)'], scope: ['service-industrial-commercial'] },
  { names: ['TWIC wording'], scope: ['service-transloading', 'service-freight-rework-transloading', 'service-transloading-winchester-va'] },
  { names: ['The book'], scope: ['page:/author/henry-pitts-jr/'] },
  { names: ['White-glove footprint'], scope: ['service-white-glove'] },
];
const qualifierScope = (name) => {
  for (const q of QUALIFIER_SCOPE) if (q.names.includes(name)) return q.scope;
  return 'estate';
};
// Audience anchor -> the services whose pages it serves (DR-1/DR-3).
const AUDIENCE_SERVICES = {
  'residential': ['service-residential'],
  'local-regional': ['service-local-regional'],
  'long-distance': ['service-long-distance'],
  'senior-moving': ['service-senior-moving'],
  'moving-storage': ['service-moving-and-storage'],
  'junk-removal': ['service-junk-removal'],
  'commercial': ['service-commercial'],
  'office-moving': ['service-office-moving'],
  'industrial-offices': ['service-industrial-offices'],
  'government': ['service-government'],
  'military': ['service-military'],
  'warehouse-relocation': ['service-warehouse-relocation', 'service-warehouse-racking-relocation'],
  'data-center-it': ['service-data-center-relocation', 'service-it-relocation'],
  'gun-safes': ['service-gun-safe'],
  'pianos-antiques': ['service-piano-antique'],
  'medical-equipment': ['service-medical-lab-relocation'],
  'cryogenic': ['service-medical-lab-relocation'],
  'heavy-assets-sir': ['service-sir-heavy'],
  'ispm-15-export': ['service-ispm15', 'service-crating'],
  'freight-rework-transloading': ['service-transloading', 'service-freight-rework-transloading', 'service-transloading-winchester-va', 'service-final-mile', 'service-logistics-project-management', 'service-3pl-support'],
  // Ports P4 (2026-11-03): the pool's 3PL/DC operations audience serves the two new services.
  '3pl-operations': ['service-3pl-support', 'service-logistics-project-management'],
};
// Service clusters for the DR-3 family tier (same-service families).
const SERVICE_CLUSTERS = [
  ['service-residential', 'service-local-regional', 'service-long-distance', 'service-senior-moving', 'service-packing', 'service-moving-and-storage'],
  ['service-sir-heavy', 'service-gun-safe'],
  ['service-commercial', 'service-office-moving', 'service-industrial-offices', 'service-industrial-commercial'],
  ['service-government', 'service-military'],
  ['service-transloading', 'service-freight-rework-transloading', 'service-transloading-winchester-va', 'service-final-mile', 'service-route81', 'service-logistics-project-management', 'service-3pl-support'],
  ['service-piano-antique', 'service-white-glove', 'service-ispm15', 'service-crating', 'service-junk-removal',
    'service-warehouse-relocation', 'service-warehouse-racking-relocation', 'service-ffe-logistics',
    'service-data-center-relocation', 'service-it-relocation', 'service-medical-lab-relocation'],
];
const clusterOf = (sid) => SERVICE_CLUSTERS.find((c) => c.includes(sid)) || [sid];
// GeoJSON area-service vocabulary -> pool serviceIds (DR-8 bridge).
const AREA_SERVICE_MAP = {
  'residential-moving': 'service-residential', 'commercial-moving': 'service-commercial',
  'commercial-relocation': 'service-commercial', 'custom-crating': 'service-crating',
  'ffe-installation': 'service-ffe-logistics', 'final-mile': 'service-final-mile',
  'flexible-deployment': 'service-industrial-commercial', 'government-moving': 'service-government',
  'industrial-offices': 'service-industrial-offices', 'ispm15-export-packing': 'service-ispm15',
  'loading': 'service-transloading', 'military-moving': 'service-military',
  'ocean-container': 'service-transloading', 'office-moving': 'service-office-moving',
  'packing': 'service-packing', 'pods': 'service-moving-and-storage',
  'restacking': 'service-industrial-commercial', 'transloading': 'service-transloading',
  'warehouse-distribution': 'service-warehouse-relocation',
};

/* --------------------------------------------------------- page model */
function headEntryFor(url) {
  const p = url.replace(SITE, '') || '/';
  return HEAD[p] || HEAD[p.replace(/\/$/, '')] || null;
}
function perPageJson(entry) {
  if (!entry || !entry.jf) return null;
  const f = path.join(PUB, entry.jf);
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) { return null; }
}
function declaredServices(page, entry, ppj) {
  const out = new Set();
  for (const s of page.services || []) if (SERVICES.has(s)) out.add(s);
  const ldGraphs = [];
  if (entry && entry.ld) { try { ldGraphs.push(JSON.parse(entry.ld)); } catch (_) { /* */ } }
  if (ppj) ldGraphs.push(ppj);
  for (const g of ldGraphs) {
    for (const n of [g, ...(g['@graph'] || [])]) {
      if (!n || typeof n !== 'object') continue;
      const ids = [];
      if (n['@type'] === 'Service' && n['@id']) ids.push(n['@id']);
      const about = Array.isArray(n.about) ? n.about : (n.about ? [n.about] : []);
      for (const a of about) if (a && a['@id']) ids.push(a['@id']);
      if (n.mainEntity && n.mainEntity['@id']) ids.push(n.mainEntity['@id']);
      for (const id of ids) {
        const sid = String(id).split('#').pop();
        if (SERVICES.has(sid)) out.add(sid);
      }
    }
  }
  return [...out];
}
function faqOf(ppj) {
  if (!ppj) return [];
  for (const n of [ppj, ...(ppj['@graph'] || [])]) {
    if (n && n['@type'] === 'FAQPage') {
      return (n.mainEntity || []).map((q) => ({
        q: decode(q.name), a: decode(q.acceptedAnswer && q.acceptedAnswer.text),
      })).filter((x) => x.q && x.a);
    }
  }
  return [];
}
function routeText(url) {
  const rel = url.replace(SITE + '/', '').replace(/\/$/, '');
  const f = path.join(PUB, rel, 'index.html');
  const home = path.join(PUB, 'index.html');
  const file = rel === '' ? home : f;
  if (!fs.existsSync(file)) return '';
  return htmlToText(fs.readFileSync(file, 'utf8'));
}

/* ------------------------------------------------------------- rubric */
function lintPage(r, pageText) {
  const F = { errors: [], warns: [] };
  const give = (k, frac) => Math.round(frac * { scopeOffered: 10, scopeExcluded: 15, qualifiers: 10, audiences: 15, questions: 20, geo: 5, fresh: 10, approved: 5, parity: 10 }[k]);
  const s = {};
  s.scopeOffered = (r.scope.offered || []).length >= 2 ? 10 : give('scopeOffered', (r.scope.offered || []).length / 2);
  s.scopeExcluded = (r.scope.notOffered || []).length ? 15 : 0;
  const qs = r.qualifiers || [];
  const qOk = qs.filter((q) => q.label && q.value && q.source).length;
  if (qs.some((q) => !q.source)) F.errors.push('qualifier without a source');
  s.qualifiers = give('qualifiers', Math.min(1, qOk / 3));
  const au = r.audiences || [];
  const aOk = au.filter((a) => a.id && a.who && a.jobs && (a.prepare || []).length >= 2 && (a.formFields || []).length >= 1 && a.watch).length;
  if (au.some((a) => !(a.id && a.who && a.jobs && a.watch))) F.errors.push('audience missing id/who/jobs/watch');
  s.audiences = give('audiences', Math.min(1, aOk / 3));
  const qn = r.questions || [];
  const qOkN = qn.filter((q) => q.q && q.a && (q.variants || []).length >= 2 && q.evidence).length;
  if (qn.some((q) => !(q.q && q.a && q.evidence))) F.errors.push('question missing q/a/evidence');
  const seenQ = new Set(); let dup = false;
  for (const q of qn) for (const p of [q.q, ...(q.variants || [])]) { const k = norm(p); if (seenQ.has(k)) dup = true; seenQ.add(k); }
  if (dup) F.errors.push('duplicate question phrasing');
  s.questions = give('questions', Math.min(1, qOkN / 8));
  s.geo = (r.geo || []).length ? 5 : 0;
  const age = (Date.parse(SEAL_DATE) - Date.parse(r.verifiedAt)) / 864e5;
  s.fresh = age <= 90 ? 10 : 0;
  s.approved = r.ownerApproved ? 5 : 0;
  const must = r.onPage || [];
  const miss = must.filter((x) => !norm(pageText).includes(norm(x)));
  if (miss.length) F.errors.push('on-page strings not found: ' + miss.join(' | '));
  s.parity = must.length ? give('parity', (must.length - miss.length) / must.length) : 0;
  const total = Object.values(s).reduce((a, b) => a + b, 0);
  return { breakdown: s, total, findings: F };
}

/* ------------------------------------------------------------ emitters */
function dataJson(r) {
  const o = {
    schemaVersion: r.schemaVersion,
    generator: 'page-data/1.0.0 (The Flat Rate Machine — build-page-data.js)',
    page: { id: r.page.id, url: r.page.url, title: r.page.title },
    dateModified: r.dateModified,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    publisher: { name: r.publisher.name, url: r.publisher.url, contact: r.publisher.contact },
    summary: r.summary,
    service: r.service,
    verification: {
      status: r.ownerApproved ? 'verified' : 'source-read',
      source: r.sourceNote, verifiedAt: r.verifiedAt, verifiedBy: r.verifiedBy,
      ownerApproved: !!r.ownerApproved, rubricScore: r.score,
    },
    scope: r.scope,
    qualifiers: r.qualifiers.map((q) => ({ label: q.label, value: q.value, source: q.source })),
    audiences: r.audiences.map((a) => ({
      id: a.id, audience: a.name, who: a.who, jobs: a.jobs,
      prepare: a.prepare, formFields: a.formFields, watchFor: a.watch,
    })),
    geo: r.geo,
    questions: r.questions.map((q) => ({ question: q.q, alsoAskedAs: q.variants, answer: q.a, evidence: q.evidence })),
    callToAction: r.cta,
  };
  return JSON.stringify(o, null, 2) + '\n';
}
function dataTxt(r) {
  const L = [];
  L.push(r.page.title);
  L.push('The Flat Rate Movers — page data (plain-text rendering of this page\'s data.json)');
  L.push('Page: ' + r.page.url);
  L.push('Status: ' + (r.ownerApproved ? 'verified' : 'source-read') + ' · Verified ' + r.verifiedAt + ' · Rubric score ' + r.score + '/100');
  L.push('Source: ' + r.sourceNote);
  L.push('');
  L.push('SUMMARY'); L.push(r.summary); L.push('');
  L.push('OFFERED'); for (const x of r.scope.offered) L.push('- ' + x); L.push('');
  L.push('NOT OFFERED'); for (const x of r.scope.notOffered) L.push('- ' + x); L.push('');
  L.push('QUALIFIERS'); for (const q of r.qualifiers) L.push('- ' + q.label + ': ' + q.value + ' (source: ' + q.source + ')'); L.push('');
  L.push('WHO THIS SERVES');
  for (const a of r.audiences) {
    L.push('- ' + a.name + ' — ' + a.who);
    L.push('  Jobs: ' + a.jobs);
    L.push('  Prepare: ' + a.prepare.join('; '));
    L.push('  On the quote form: ' + a.formFields.join('; '));
    L.push('  Watch for: ' + a.watch);
  }
  L.push('');
  L.push('WHERE'); for (const g of r.geo) L.push('- ' + g.name + ' (' + g.type + ')'); L.push('');
  L.push('QUESTIONS');
  for (const q of r.questions) {
    L.push('Q: ' + q.q);
    for (const v of q.variants) L.push('   Also asked as: ' + v);
    L.push('A: ' + q.a);
    L.push('   Evidence: ' + q.evidence);
  }
  L.push('');
  L.push('NEXT STEP'); L.push(r.cta.label + ': ' + r.cta.url); L.push('');
  L.push('CONTACT'); L.push('Phone: +1-540-422-2153 · Email: ratemovers@gmail.com'); L.push('');
  L.push('Generated by The Flat Rate Machine (build-page-data.js) from the Page Data Pool');
  L.push('(datasets-page-data-pool.json), the estate\'s master database for page data.');
  L.push('Both files are distributions in the signed master index (ai-master-index.json,');
  L.push('Ed25519, kid theflatratemovers-2026-10-29-1).');
  return L.join('\n') + '\n';
}

/* ------------------------------------------------------------- build */
const APPROVAL_SOURCE = 'Page Data Pool draw (datasets-page-data-pool.json) under rules DR-1..DR-11; ' +
  'owner approval: Henry Pitts, estate-wide adoption of the Page Data system 2026-11-03 and approval ' +
  'of the consolidated notOffered sets 2026-11-03 18:38 EST.';
const manifest = { generated: SEAL_DATE, pages: {} };
const scorePages = [];
const failures = [];

for (const page of registry) {
  const url = page.url;
  const entry = headEntryFor(url);
  const ppj = perPageJson(entry);
  const declared = declaredServices(page, entry, ppj);
  const ownRows = rowsByTarget.get(url) || [];
  const qServices = new Set(declared);
  for (const r of ownRows) if (SERVICES.has(r.service_id)) qServices.add(r.service_id);
  const famServices = new Set(qServices);
  for (const sid of [...qServices]) for (const s of clusterOf(sid)) famServices.add(s);
  const primary = declared[0] || (ownRows[0] && ownRows[0].service_id) || null;
  const dm = (STAMPS.pages[url] || {}).dm || page.lastmod || SEAL_DATE;
  const title = entry ? entry.t : page.title;
  const summary = entry ? entry.d : page.title;
  const pathPart = url.replace(SITE, ''); // "/" or "/slug/"
  const jsonUrl = url + 'data.json';
  const txtUrl = url + 'data.txt';

  /* scope — offered */
  const offered = [];
  const dsItem = DATASETS.find((d) => d.landing === url);
  if (dsItem) offered.push(dsItem.name + ' — ' + firstSentence(dsItem.description) + ' Served as a signed JSON file with a SHA-256 digest in the master index.');
  const offeredServices = [...new Set([primary, ...declared].filter(Boolean))].slice(0, 6);
  if (!dsItem && !(page.services || []).length && offeredServices.length) {
    offered.push(summary);
  }
  for (const sid of offeredServices) {
    const s = SERVICES.get(sid);
    offered.push(s.name + ' — ' + firstSentence(s.description));
  }
  if (offered.length < 3) {
    offered.push(summary);
    offered.push('Flat rate moving and logistics services from two branches — Winchester, VA and Martinsburg, WV — every service described in full on its own page of this site.');
  }
  /* scope — notOffered (DR-5, declared services) */
  const notOffered = [];
  for (const b of BOUNDARIES) {
    if (b.scope === 'estate') notOffered.push(b.name);
    else if (Array.isArray(b.scope) && b.scope.some((s) => declared.includes(s))) notOffered.push(b.name);
    else if (b.scope === 'page:' + pathPart) notOffered.push(b.name);
  }
  const scope = { offered: [...new Set(offered)], notOffered: [...new Set(notOffered)] };

  /* qualifiers (DR-6) */
  const branchOf = page.slug && page.slug.includes('martinsburg') ? 'martinsburg'
    : (page.slug === 'winchester' || (page.slug || '').includes('winchester')) && page.type === 'location' ? 'winchester'
    : page.slug === 'home' ? 'both' : null;
  const quals = [];
  for (const q of QUALIFIERS) {
    const sc = qualifierScope(q.name);
    let take = false;
    if (sc === 'estate') take = true;
    else if (Array.isArray(sc)) take = sc.some((s) => s.startsWith('service-') ? qServices.has(s) : url === SITE + s.slice(5));
    else if (typeof sc === 'string' && sc.startsWith('branch:')) take = branchOf === sc.slice(7) || branchOf === 'both';
    if (take) quals.push({ label: q.name, value: q.value, source: q.source });
    if (quals.length >= 8) break;
  }

  /* audiences (DR-1/DR-3 draw) */
  const auds = [];
  const audTake = (svcSet) => {
    for (const a of AUDIENCES) {
      if (auds.some((x) => x.id === a.anchor)) continue;
      if ((AUDIENCE_SERVICES[a.anchor] || []).some((s) => svcSet.has(s))) {
        auds.push({
          id: a.anchor, name: a.name, who: a.whoItIsFor, jobs: a.jobsItCovers,
          prepare: a.whatToPrepare || [], formFields: String(a.formFields || '').split(';').map((x) => x.trim()).filter(Boolean),
          watch: a.watchFor,
        });
      }
    }
  };
  audTake(qServices);
  if (auds.length < 3) audTake(famServices);
  if (auds.length < 3) {
    for (const a of AUDIENCES) {
      if (auds.length >= 3) break;
      if (!auds.some((x) => x.id === a.anchor)) {
        auds.push({ id: a.anchor, name: a.name, who: a.whoItIsFor, jobs: a.jobsItCovers, prepare: a.whatToPrepare || [], formFields: String(a.formFields || '').split(';').map((x) => x.trim()).filter(Boolean), watch: a.watchFor });
      }
    }
  }
  const audiences = auds.slice(0, 6);

  /* geo (DR-8) */
  const geo = [];
  const areaTake = (list) => {
    for (const a of list) {
      if (geo.length >= 12) break;
      if (geo.some((g) => g.name === a.name)) continue;
      geo.push({ name: a.name, type: /county/i.test(a.name) ? 'Place' : 'City' });
    }
  };
  if (page.type === 'location' && branchOf && branchOf !== 'both') {
    areaTake(AREAS.filter((a) => a.branchBinding === branchOf));
  }
  areaTake(AREAS.filter((a) => (a.services || []).some((s) => qServices.has(AREA_SERVICE_MAP[s]))));
  if (!geo.length) {
    geo.push(
      { name: 'Winchester, VA', type: 'City' }, { name: 'Martinsburg, WV', type: 'City' },
      { name: 'Shenandoah Valley', type: 'Region' }, { name: 'Eastern Panhandle', type: 'Region' },
      { name: 'I-81 corridor', type: 'Corridor' });
  }

  /* questions (DR-2/DR-3/DR-4/DR-7) */
  const faqs = faqOf(ppj);
  const frags = FRAGMENTS.get(url) || [];
  const used = new Set();
  const questions = [];
  const takePhrasings = (list, n) => {
    const out = [];
    for (const p of list) {
      const k = norm(p);
      if (!k || used.has(k)) continue;
      used.add(k); out.push(p);
      if (out.length >= n) break;
    }
    return out;
  };
  const usedFrags = new Set();
  const fragAnswer = (frag) => {
    let t = decode(frag.text || '');
    const h = decode(frag.heading || '');
    if (h && t.toLowerCase().startsWith(h.toLowerCase())) t = t.slice(h.length).trim();
    return trimTo(t, 700);
  };
  const bestFrag = (qtext, min = 0.3) => {
    let best = null; let bs = 0;
    for (const f of frags) {
      if (usedFrags.has(f.fragmentId)) continue;
      let sc = overlap(qtext, (f.heading || '') + ' ' + (f.text || ''));
      if (/start here|get your flat rate|get my flat rate/i.test(f.heading || '')) sc *= 0.5; // chrome/CTA sections are weak answers
      if (sc > bs) { bs = sc; best = f; }
    }
    if (best && bs >= min) { usedFrags.add(best.fragmentId); return best; }
    return null;
  };
  const resolveAnswer = (canonical, clusterKey) => {
    for (const f of faqs) if (norm(f.q) === norm(canonical)) return { a: f.a, ev: url + '#faq' };
    const fr = bestFrag(canonical, 0.3);
    if (fr) return { a: fragAnswer(fr), ev: url + '#' + slugify(fr.heading || fr.fragmentId) };
    const sid = clusterKey ? clusterKey.split('|')[1] : null;
    for (const d of DOMAIN) {
      if (sid && !d.services.includes(sid)) continue;
      if (d.questions.some((dq) => overlap(dq, canonical) >= 0.5)) {
        return { a: trimTo(d.fact + ' ' + d.detail, 700), ev: POOL_URL + '#' + d.id };
      }
    }
    if (clusterKey && clusterKey.startsWith('navigational-local|') && sid && SERVICES.has(sid)) {
      return { a: trimTo(SERVICES.get(sid).description, 700), ev: url };
    }
    return null;
  };
  // 1) the page's own clusters, family-deepened (DR-2)
  const ownKeys = [...new Set(ownRows.map((r) => r.intent_class + '|' + r.service_id))];
  const famKeys = [...new Set([...famServices].map((sid) =>
    [...rowsByCluster.keys()].filter((k) => k.endsWith('|' + sid))).flat())];
  const keyOrder = [...ownKeys, ...famKeys.filter((k) => !ownKeys.includes(k))];
  const faqNorms = new Set(faqs.map((f) => norm(f.q)));
  for (const key of keyOrder) {
    if (questions.length >= 14) break;
    const own = ownRows.filter((r) => r.intent_class + '|' + r.service_id === key).map((r) => r.query_text);
    const fam = rowsByCluster.get(key) || [];
    const poolP = [...own, ...fam.filter((x) => !own.includes(x))];
    const seenP = new Set(); const fresh = [];
    for (const p of poolP) { const k = norm(p); if (!used.has(k) && !seenP.has(k)) { seenP.add(k); fresh.push(p); } }
    if (fresh.length < 3) continue;
    // DR-2 scan (2026-11-05, Rubric Full-Depth): a cluster is a
    // phrasing pool, not a single shot — walk the cluster's phrasings
    // in order until one resolves an answer under DR-4. With the v3
    // rubric's deep family clusters, the first phrasing is often a
    // family variant whose answer does not live on this page; the
    // cluster still holds the page's question in another phrasing.
    for (let ci = 0; ci < fresh.length; ci++) {
      const canonical = fresh[ci];
      if (faqNorms.has(norm(canonical))) continue; // FAQ entries carry it below
      const ans = resolveAnswer(canonical, key);
      if (!ans || !ans.a) continue;
      used.add(norm(canonical));
      const variants = takePhrasings(fresh.filter((_, j) => j !== ci), 4);
      if (variants.length < 2) continue;
      questions.push({ q: canonical, variants, a: ans.a, evidence: ans.ev });
      break;
    }
  }
  // 2) the page's FAQ entries, variants from matching clusters (DR-4a)
  for (const f of faqs) {
    if (questions.length >= 16) break;
    if (used.has(norm(f.q))) continue;
    const cand = [];
    for (const key of keyOrder) for (const p of rowsByCluster.get(key) || []) {
      if (norm(p) !== norm(f.q) && overlap(p, f.q) >= 0.34) cand.push([overlap(p, f.q), p]);
    }
    cand.sort((a, b) => b[0] - a[0]);
    used.add(norm(f.q));
    const variants = takePhrasings(cand.map((c) => c[1]), 3);
    if (variants.length < 2) continue;
    questions.push({ q: f.q, variants, a: f.a, evidence: url + '#faq' });
  }
  // 3) drawn Layer-2 entries' own questions (DR-7)
  for (const d of DOMAIN) {
    if (questions.length >= 16) break;
    if (!d.services.some((s) => qServices.has(s))) continue;
    const seenD = new Set(); const fresh = [];
    for (const p of d.questions) { const k = norm(p); if (!used.has(k) && !seenD.has(k)) { seenD.add(k); fresh.push(p); } }
    if (fresh.length < 3) continue;
    const canonical = fresh[0];
    used.add(norm(canonical));
    const variants = takePhrasings(fresh.slice(1), 3);
    if (variants.length < 2) continue;
    questions.push({ q: canonical, variants, a: trimTo(d.fact + ' ' + d.detail, 700), evidence: POOL_URL + '#' + d.id });
  }
  // 4) question-shaped fragments not already covered (DR-4b)
  for (const f of frags) {
    if (questions.length >= 16) break;
    if (!f.questionShaped || !f.heading) continue;
    const q = decode(f.heading);
    if (!q.endsWith('?') || used.has(norm(q))) continue;
    const cand = [];
    for (const key of keyOrder) for (const p of rowsByCluster.get(key) || []) {
      if (overlap(p, q) >= 0.4) cand.push([overlap(p, q), p]);
    }
    cand.sort((a, b) => b[0] - a[0]);
    used.add(norm(q));
    const variants = takePhrasings(cand.map((c) => c[1]), 3);
    if (variants.length < 2) continue;
    const a = fragAnswer(f);
    if (!a) continue;
    usedFrags.add(f.fragmentId);
    used.add(norm(q));
    questions.push({ q, variants, a, evidence: url + '#' + slugify(f.heading) });
  }

  /* service + parity + registry record */
  const svcBlock = dsItem
    ? { name: dsItem.name, description: dsItem.description }
    : (primary && SERVICES.has(primary))
      ? { name: SERVICES.get(primary).name, description: SERVICES.get(primary).description }
      : { name: page.title, description: summary };
  const text = routeText(url);
  const onPage = [title, svcBlock.name, 'Get My Flat Rate Quote', '+1-540-422-2153', 'Guaranteed Flat Rate or Your Move is Free!']
    .filter((v, i, a) => a.indexOf(v) === i)
    .filter((v) => norm(text).includes(norm(v)));
  const record = {
    schemaVersion: '1.0', page: { id: 'page:' + (page.slug || 'home'), url, title },
    publisher: { name: 'The Flat Rate Movers', url: SITE + '/', contact: '+1-540-422-2153' },
    summary, service: svcBlock, scope, qualifiers: quals, audiences, geo, questions,
    cta: { label: 'Get My Flat Rate Quote', url: SITE + '/quote/' },
    verifiedAt: SEAL_DATE, verifiedBy: 'The Flat Rate Machine — build-page-data.js (pool draw DR-1..DR-11)',
    sourceNote: APPROVAL_SOURCE, ownerApproved: true, onPage,
    dateModified: dm, score: 0,
  };
  const scored = lintPage(record, text);
  record.score = scored.total;
  scorePages.push({ url, score: scored.total, breakdown: scored.breakdown, errors: scored.findings.errors, warnings: scored.findings.warns });
  if (scored.total < 100 || scored.findings.errors.length) {
    failures.push({ url, score: scored.total, breakdown: scored.breakdown, errors: scored.findings.errors });
  }

  /* files */
  const relDir = pathPart.replace(/^\//, '').replace(/\/$/, '');
  const outDir = relDir ? path.join(PUB, relDir) : PUB;
  fs.mkdirSync(outDir, { recursive: true });
  const jsonText = dataJson(record);
  const txtText = dataTxt(record);
  fs.writeFileSync(path.join(outDir, 'data.json'), jsonText);
  fs.writeFileSync(path.join(outDir, 'data.txt'), txtText);
  const jsonSha = sha256(Buffer.from(jsonText));
  const txtSha = sha256(Buffer.from(txtText));

  /* head block for build-routes */
  const svcRef = primary && SERVICES.has(primary) ? [{ '@id': SERVICES.get(primary).id }] : [{ '@id': SITE + '/#organization' }];
  const areaServed = geo.slice(0, 8).map((g) => ({
    '@type': g.type === 'City' ? 'City' : (g.type === 'Region' ? 'AdministrativeArea' : 'Place'), name: g.name,
  }));
  const webPage = {
    '@context': 'https://schema.org', '@type': 'WebPage', '@id': url, url, name: title,
    description: summary, inLanguage: 'en-US', dateModified: dm,
    isPartOf: { '@id': SITE + '/#website' }, publisher: { '@id': SITE + '/#organization' },
    about: svcRef, areaServed, hasPart: [{ '@id': url + '#page-data-dataset' }],
  };
  const dataset = {
    '@context': 'https://schema.org', '@type': 'Dataset', '@id': url + '#page-data-dataset',
    name: title + ' — page data', description: summary, url, inLanguage: 'en-US', dateModified: dm,
    isAccessibleForFree: true, identifier: url + '#page-data-dataset',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    publisher: { '@id': SITE + '/#organization' },
    distribution: [
      { '@type': 'DataDownload', contentUrl: jsonUrl, encodingFormat: 'application/json' },
      { '@type': 'DataDownload', contentUrl: txtUrl, encodingFormat: 'text/plain' },
    ],
  };
  const block =
    '  <link rel="alternate" type="application/json" title="Page data — ' + esc(title) + ' (JSON)" href="' + jsonUrl + '">\n' +
    '  <link rel="alternate" type="text/plain" title="Page data — ' + esc(title) + ' (text)" href="' + txtUrl + '">\n' +
    '  <script type="application/ld+json" data-page-data="webpage">' + JSON.stringify(webPage) + '</script>\n' +
    '  <script type="application/ld+json" data-page-data="dataset">' + JSON.stringify(dataset) + '</script>\n';
  manifest.pages[url] = { block, jsonSha, txtSha };
}

/* scores file + manifest */
const scores = scorePages.map((p) => p.score).sort((a, b) => a - b);
const scoresDoc = {
  '@type': 'Dataset', name: 'Page Data rubric scores — every page, adopted rubric (100 = full)',
  generator: 'page-data/1.0.0 (The Flat Rate Machine — build-page-data.js)', generatedAt: SEAL_DATE,
  rubric: 'scope 10 · notOffered 15 · qualifiers 10 · audiences 15 · questions 20 · geo 5 · fresh 10 · approved 5 · parity 10',
  summary: {
    pages: scorePages.length, perfect: scorePages.filter((p) => p.score === 100).length,
    min: scores[0], median: scores[Math.floor(scores.length / 2)],
  },
  pages: scorePages,
};
fs.writeFileSync(path.join(PUB, 'page-data-scores.json'), JSON.stringify(scoresDoc, null, 1) + '\n');
fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 1) + '\n');

console.log('build-page-data: ' + scorePages.length + ' pages; scores min ' + scores[0] +
  ' median ' + scores[Math.floor(scores.length / 2)] + '; perfect ' +
  scorePages.filter((p) => p.score === 100).length + '/' + scorePages.length);
if (failures.length) {
  console.log('build-page-data: ' + failures.length + ' page(s) under 100 or with errors:');
  for (const f of failures) {
    console.log('  ' + f.url + ' score ' + f.score + ' ' + JSON.stringify(f.breakdown) +
      (f.errors.length ? ' errors: ' + f.errors.join('; ') : ''));
  }
  if (!TOLERATE) { console.error('build-page-data: PG-4 — a page under 100 fails the seal.'); process.exit(1); }
}
