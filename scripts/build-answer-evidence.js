// Flat Rate Machine — Answer-Engine Evidence dataset builder
// (Retrieval Machine Element 2, build batch B1 per Dossier 02 §7;
// executed as Retrieval Machine build batch B2 of the program,
// 2026-10-31).
//   node scripts/build-answer-evidence.js [--out <file>]
//   node scripts/build-answer-evidence.js --check
// Run from the-flat-rate-machine/. No dependencies beyond Node itself
// (the rubric database is read through the sqlite3 CLI, the pattern
// build-intent-rubric.js and build-search-index.js established).
//
// WHAT THIS IS
// datasets-answer-evidence.json: the standing dataset of the Retrieval
// Machine's answer-engine evidence element (design: Dossier 02 §5).
// The intent rubric maps what could be asked; the search-index dataset
// maps what the index did; this dataset maps what the answer layer did
// with it — question x the fragment that should answer it x the
// evidence behind that fragment x what answer engines were observed
// doing, era-tagged, with method as a first-class field:
//   question                 — every intent-rubric row, generated from
//                              rubric.db (never hand-kept), carrying
//                              its fragment-binding state and its
//                              Answer Panel membership state.
//   answer_fragment          — passages extracted from the live
//                              estate: FAQ fragments from the per-page
//                              JSONs' FAQPage schema (exact Q&A text)
//                              and heading-led passages from the source
//                              shell's page divs. Each carries its
//                              owning page, heading-path locator, full
//                              text, SHA-256 text hash (drift
//                              detection), the schema types on its
//                              page, evidence links (the per-page JSON
//                              and dataset files backing its facts,
//                              with the SHA-256 digests the seal
//                              records) and its surface copies.
//   fragment_coverage        — the A5 coverage number, computed per
//                              service from the live estate, never
//                              asserted: rubric rows bound exactly to
//                              a fragment, rows whose target page
//                              carries fragments, rows with neither.
//   engine_profile           — the four answer engines' documented
//                              pipelines (Dossier 02 §1.2 as living
//                              data), with contested and unknown
//                              fields recorded as contested/unknown.
//   citation_observation     — what answer surfaces were observed
//                              doing. METHOD IS FIRST-CLASS and rows
//                              are never averaged across methods.
//                              HONESTY STATE: the Answer Panel HAS run
//                              (first runs 2026-11-01 and 2026-11-02);
//                              its rows enter ONLY through the
//                              validated panel input file
//                              (data/panel-observations.json,
//                              transcribed from the dated run records)
//                              with method 'prompt-panel' — the
//                              generator refuses any prompt-panel row
//                              not backed by that file, and refuses
//                              brave-serp / console rows outright
//                              (no run of those methods exists). The
//                              2026-10-31 search-surface probes
//                              (Dossier 02 §2.2) remain on file as
//                              method 'search-surface' — a labeled
//                              proxy, never a UI observation. Panel
//                              state is COMPUTED from the merged rows,
//                              never hard-coded (extension built
//                              2026-11-02, Element 2 fragment-binding
//                              batch, per PANEL-INGEST-DESIGN.md).
//   review_distribution_snapshot — review evidence as distribution
//                              and arithmetic only, per platform,
//                              never blended, and never a raw count
//                              presented as a quality signal (owner
//                              rule). Competitor records live in the
//                              competitor namespace and can never join
//                              a company-claim surface; the generator
//                              enforces the bar (see
//                              assertSnapshotBar()).
//   gap_record               — Dossier 02's gaps A1-A9, each with its
//                              designed solution and resolving batch.
//
// FRAGMENT EXTRACTION RULES (stated so the coverage number is
// auditable): a fragment is a heading-led passage (h1-h3) with at
// least one character of body text, or an FAQPage Question/Answer
// pair. Heading-only blocks carry no passage and are not fragments.
// A passage quoting a 64-hex SHA-256 string is excluded: certificate
// text quotes the file's own hash and is self-referential by
// construction, so it can never be a stable fragment (the excluded
// count is published in the totals). A fragment is SUBSTANTIVE for
// coverage when its body carries at least 120 characters.
//
// SOURCES (all read live at generation; locations from paths.json,
// the machine repo's paths registry — no batch paths compiled in):
//   rubric DB (intent_query), data/pages.json registry, the source
//   shell (repo-dir/index.html: page divs + pageMeta), the public
//   tree's per-page JSON files (FAQ schema, schema types, digests),
//   the public dataset files named by rubric rows (evidence digests),
//   llms-full.txt (surface-copy presence), functions/head-data.js
//   (per-page JSON filenames).
//
// DETERMINISM: never the wall clock, so --check is byte-stable
// across days. Q124 (2026-11-03): file-level dateModified stamps
// take FILE_DM — the lastmod-ledger date for this file's URL when
// the seal passes FB3_STAMPS (else the ledger read directly, else
// DATE_MOD) — while DATE_MOD (the newest evidence date among its
// inputs) keeps its evidence roles: validation and evidence prose.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { CATALOG } = require('./lib-constants.js');

const ROOT = path.resolve(__dirname, '..');
const REG = JSON.parse(fs.readFileSync(path.join(ROOT, 'paths.json'), 'utf8'));
const PUB = REG.public_dir;
const REPO_DIR = REG.repo_dir;
const DB = REG.rubric_db;
const PAGES_DIR = REG.pages_dir;
const SITE = 'https://theflatratemovers.com';
const LANDING = SITE + '/datasets/answer-evidence/';
const FILE_URL = SITE + '/datasets-answer-evidence.json';
const API_ROUTE = 'https://api.theflatratemovers.com/v1/answer-evidence';
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const CREATOR = {
  '@id': SITE + '/#organization',
  '@type': 'Organization',
  name: 'The Flat Rate Movers',
  foundingDate: '2010-06',
  sameAs: [
    'https://www.instagram.com/theflatratemoversllc/',
    'https://www.threads.com/@theflatratemoversllc',
    'https://x.com/ratemovers',
    'https://www.youtube.com/@theflatratemovers',
    'https://github.com/TheFlatRateMovers',
    'https://medium.com/@ratemovers',
  ],
};

// ------------------------------------------------------- panel input
// Prompt-panel extension (2026-11-02, Element 2 fragment-binding
// batch, per PANEL-INGEST-DESIGN.md): panel observations enter ONLY
// through the panel input file named by paths.json
// (panel_observations_file), transcribed from the dated Answer Panel
// run records. Validation is fail-loud (design §5): a panel row can
// exist only if its run record exists on disk, its run's census
// reconciles, and every row rule holds. If the key or the file is
// absent the generator behaves exactly as it did before the extension
// (search-surface only, panel state zero) — the extension is additive.
function loadPanel() {
  const empty = { present: false, rows: [], questions: new Map(), runs: new Map(), runsByQuestion: new Map(), newestDate: null };
  const p = REG.panel_observations_file;
  if (!p || !fs.existsSync(p)) return empty;
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  const fail = (m) => { throw new Error('PANEL INPUT: ' + m); };
  if (doc.schemaVersion !== 1) fail('schemaVersion must be 1');
  const runs = new Map();
  for (const sr of doc.sourceRecords || []) {
    if (!sr.runId || runs.has(sr.runId)) fail('duplicate or missing runId in sourceRecords: ' + sr.runId);
    const dir = String(sr.recordDir || '').replace(/^~\//, (process.env.HOME || '') + '/');
    if (!sr.recordFile || !fs.existsSync(path.join(dir, sr.recordFile))) {
      fail('run record file does not exist for ' + sr.runId + ': ' + sr.recordFile);
    }
    if (sr.cellsCompleted + sr.cellsBlocked !== sr.cellsDeclared) fail('declared census inconsistent for ' + sr.runId);
    runs.set(sr.runId, sr);
  }
  const questions = new Map();
  for (const q of doc.panelQuestions || []) {
    if (!q.questionId || questions.has(q.questionId)) fail('duplicate or missing panel questionId: ' + q.questionId);
    questions.set(q.questionId, q);
  }
  const rows = doc.rows || [];
  const ids = new Set();
  const perRun = new Map();
  const runsByQuestion = new Map();
  for (const r of rows) {
    if (!r.observationId || ids.has(r.observationId)) fail('duplicate or missing observationId: ' + r.observationId);
    ids.add(r.observationId);
    if (r.method !== 'prompt-panel') fail('row method is not prompt-panel: ' + r.observationId);
    if (!r.era || !r.promptVerbatim || !r.surface || !r.accessMode) fail('row missing era/promptVerbatim/surface/accessMode: ' + r.observationId);
    const run = runs.get(r.runId);
    if (!run) fail('row runId not in sourceRecords: ' + r.observationId);
    if (r.date !== run.date) fail('row date differs from its run date: ' + r.observationId);
    if (r.runnerRef !== run.runnerRef) fail('row runnerRef differs from its run record: ' + r.observationId);
    const q = questions.get(r.panelQuestionId);
    if (!q) fail('row panelQuestionId not in panelQuestions: ' + r.observationId);
    if (r.promptVerbatim !== q.promptVerbatim) fail('row promptVerbatim differs from panelQuestions: ' + r.observationId);
    if (r.completionState !== 'completed' && r.completionState !== 'blocked') fail('bad completionState: ' + r.observationId);
    if (!r.ourCited || typeof r.ourCited.cited !== 'boolean') fail('row ourCited.cited not boolean: ' + r.observationId);
    if (!Array.isArray(r.citedUrlsInOrder)) fail('row citedUrlsInOrder not an array: ' + r.observationId);
    if (!r.panelScores || typeof r.panelScores !== 'object') fail('row panelScores missing: ' + r.observationId);
    if (r.completionState === 'blocked') {
      if (r.ourCited.cited !== false) fail('blocked row cited !== false: ' + r.observationId);
      if (r.citedUrlsInOrder.length) fail('blocked row citedUrlsInOrder not empty: ' + r.observationId);
      if (r.panelScores.mentioned !== null) fail('blocked row mentioned !== null: ' + r.observationId);
      if (r.recommendedFirst !== null) fail('blocked row recommendedFirst !== null: ' + r.observationId);
    } else {
      if (typeof r.panelScores.mentioned !== 'boolean') fail('completed row mentioned not boolean: ' + r.observationId);
      if (r.panelQuestionId === 'panel-q4') {
        if (typeof r.recommendedFirst !== 'boolean') fail('completed Q4 row recommendedFirst not boolean: ' + r.observationId);
      } else if (r.recommendedFirst !== null) fail('non-Q4 row recommendedFirst !== null: ' + r.observationId);
    }
    if (!perRun.has(r.runId)) perRun.set(r.runId, { total: 0, completed: 0, blocked: 0 });
    const c = perRun.get(r.runId);
    c.total += 1; c[r.completionState] += 1;
    if (!runsByQuestion.has(r.panelQuestionId)) runsByQuestion.set(r.panelQuestionId, { runs: new Set(), latest: null });
    const rq = runsByQuestion.get(r.panelQuestionId);
    rq.runs.add(r.runId);
    if (!rq.latest || run.date > rq.latest) rq.latest = run.date;
  }
  for (const [runId, sr] of runs) {
    const c = perRun.get(runId) || { total: 0, completed: 0, blocked: 0 };
    if (c.total !== sr.cellsDeclared || c.completed !== sr.cellsCompleted || c.blocked !== sr.cellsBlocked) {
      fail('run census does not reconcile for ' + runId + ': rows ' + c.total + '/' + c.completed + '/' + c.blocked
        + ' vs declared ' + sr.cellsDeclared + '/' + sr.cellsCompleted + '/' + sr.cellsBlocked);
    }
  }
  const newestDate = [...runs.values()].map((s) => s.date).sort().slice(-1)[0] || null;
  return { present: true, rows, questions, runs, runsByQuestion, newestDate };
}
const PANEL = loadPanel();

function arg(name) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : null;
}
const CHECK = process.argv.includes('--check');
const outPath = arg('out') || path.join(PUB, 'datasets-answer-evidence.json');

function sql(q) {
  const out = execFileSync('sqlite3', ['-json', DB, q], { maxBuffer: 256 * 1024 * 1024 }).toString();
  return out.trim() ? JSON.parse(out) : [];
}
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function normText(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}
const ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'",
  '&nbsp;': ' ', '&rsquo;': '’', '&lsquo;': '‘', '&rdquo;': '”', '&ldquo;': '“',
  '&mdash;': '—', '&ndash;': '–', '&hellip;': '…', '&copy;': '©',
};
function decodeEntities(s) {
  return String(s)
    .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n)))
    .replace(/&[a-z#0-9]+;/gi, (m) => (Object.prototype.hasOwnProperty.call(ENTITIES, m) ? ENTITIES[m] : ' '));
}
function visibleText(htmlFragment) {
  return decodeEntities(String(htmlFragment)
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------- seed:
// engine profiles, from Retrieval Machine Dossier 02 §1.2 (evidence
// read 2026-10-31). Documented facts carry their source class;
// contested and unknown fields are recorded as contested/unknown —
// the dossier's discipline, kept in the data.
const PROFILE_DATE = '2026-10-31';
const ENGINE_PROFILES = [
  {
    engineId: 'engine-chatgpt-search', engine: 'ChatGPT search', operator: 'OpenAI',
    surfaces: ['ChatGPT search answers'],
    crawlers: [
      { agent: 'OAI-SearchBot', role: 'Search index. Sites opted out of OAI-SearchBot are not shown in ChatGPT search answers, though they can still appear as navigational links.' },
      { agent: 'GPTBot', role: 'Training only. Blocking GPTBot does not affect search visibility.' },
      { agent: 'ChatGPT-User', role: 'User-initiated live fetch; robots.txt may not apply.' },
    ],
    indexSource: 'OpenAI’s own crawl (OAI-SearchBot) blended with partner search providers. Google rank plays no direct role.',
    citationMechanics: 'Citations attach to retrieved sources and concentrate on opening turns. A vendor panel of about 700,000 US English ChatGPT conversations (Oct–Dec 2025) measured roughly 18% of conversations triggering at least one web search, with citations on 12.6% of opening turns vs 4.5% at turn 10 and 3.0% at turn 20 — the opening phrasing of a buyer’s question is the citation battleground.',
    documentedFacts: [
      { claim: 'Three crawler agents with independent switches govern admission, training and live fetch.', sourceClass: 'platform documentation, via secondary summaries read 2026-10-31' },
      { claim: 'Retrieval blends OpenAI’s own crawl with partner providers.', sourceClass: 'platform documentation, via secondary summaries read 2026-10-31' },
    ],
    contestedOrUnknown: [
      { field: 'Partner index composition', state: 'unknown — the partner providers are not fully enumerated in the documentation available at the evidence date' },
    ],
    sourceRefs: ['Retrieval Machine Dossier 02 §1.2 (ChatGPT search)', 'OpenAI crawler documentation (via secondary summaries, read 2026-10-31)', 'Profound citation study, ~700,000 US English ChatGPT conversations, Oct–Dec 2025 (vendor measurement, era-labeled)'],
    date: PROFILE_DATE,
  },
  {
    engineId: 'engine-google-ai', engine: 'Google AI Overviews / AI Mode', operator: 'Google',
    surfaces: ['AI Overviews', 'AI Mode'],
    crawlers: [
      { agent: 'Googlebot', role: 'Search index admission; AI features read the same index as web search.' },
    ],
    indexSource: 'Google’s search index.',
    citationMechanics: 'Eligibility is being indexed and eligible to appear with a snippet — no additional AI-specific requirements and no special AI schema; Google states it does not use llms.txt for Search. Both surfaces use query fan-out (multiple related searches across subtopics), so a page can be cited for a sub-question it answers even when it does not rank for the head question. AI-feature traffic reports inside Search Console’s Web performance report.',
    documentedFacts: [
      { claim: 'Eligibility = indexed + snippet-eligible; no special AI schema is required.', sourceClass: 'platform documentation, via secondary summaries read 2026-10-31' },
      { claim: 'Google states it does not use llms.txt for Search.', sourceClass: 'platform documentation, via secondary summaries read 2026-10-31' },
    ],
    contestedOrUnknown: [
      { field: 'AI Overview citation sourcing (top-10 share)', state: 'contested — a July 2025 sample (1.9M citations) put top-10 organic share near 76%; a March 2026 update (4M citations) put it near 38%, with roughly a third of citations from pages outside the top 100; other secondary sources claim ~94% of overviews include a top-20 source. The figures cannot describe the same population; recorded as a conflict, never blended' },
      { field: 'AI Mode vs AI Overviews citation split (Maps/GBP vs website)', state: 'single-study-family evidence (Steady Demand / Whitespark reporting, partly withdrawn by its own authors); consistent with Google’s Maps-grounding direction; to be re-checked against the console at panel time' },
    ],
    sourceRefs: ['Retrieval Machine Dossier 02 §1.2 (Google AI Overviews / AI Mode)', 'Google, “AI features and your website” (via secondary summaries, read 2026-10-31)', 'Ahrefs AI Overview citation analyses, Jul 2025 and Mar 2026 (contested, era-labeled)'],
    date: PROFILE_DATE,
  },
  {
    engineId: 'engine-claude', engine: 'Claude', operator: 'Anthropic',
    surfaces: ['Claude web-search answers'],
    crawlers: [
      { agent: 'ClaudeBot', role: 'Training crawler; robots-respecting.' },
      { agent: 'Claude-User', role: 'User-initiated fetches; robots-respecting.' },
      { agent: 'Claude-SearchBot', role: 'Search crawler; robots-respecting.' },
    ],
    indexSource: 'Not vendor-confirmed. Indirect evidence points to the Brave index: Brave Search was added to Anthropic’s subprocessor list in March 2025; a BraveSearchParams schema name was observed in Claude’s tooling; a 2026-09-01 study (Complete SEO; 1,481 matched queries over 10 weeks) found 87.8% of URLs Claude retrieved also sat in Brave’s top 10 and Claude’s source set closer to Brave’s than to Google’s on 98.2% of queries; a second 2026 study (Blyskal; ~35,000 URLs / 400 queries) found 20.8% of Claude’s cited URLs outside Brave’s top 10. Retrieved is not cited; the two findings are kept distinct.',
    citationMechanics: 'Web-search citations attach at passage level: each citation carries a short cited passage (up to ~150 characters) plus URL and title — structurally rewarding pages that contain a self-contained sentence supporting the claim.',
    documentedFacts: [
      { claim: 'Three robots-respecting crawlers (training, user fetch, search).', sourceClass: 'platform documentation, via secondary summaries read 2026-10-31' },
      { claim: 'Citations attach at passage level with a short cited passage, URL and title.', sourceClass: 'platform documentation, via secondary summaries read 2026-10-31' },
    ],
    contestedOrUnknown: [
      { field: 'Index provider', state: 'indirect evidence only: Brave (see indexSource). Anthropic has not confirmed it; treated as a proxy metric, never as a documented pipeline' },
      { field: 'turbopuffer role', state: 'unknown — added as a web-search subprocessor on 2026-05-06; its role is not documented' },
    ],
    sourceRefs: ['Retrieval Machine Dossier 02 §1.2 (Claude)', 'Anthropic crawler documentation (via secondary summaries, read 2026-10-31)', 'Complete SEO, Claude–Brave citation study, 2026-09-01', 'Blyskal 2026, Claude citation overlap study'],
    date: PROFILE_DATE,
  },
  {
    engineId: 'engine-perplexity', engine: 'Perplexity', operator: 'Perplexity',
    surfaces: ['Perplexity answers'],
    crawlers: [
      { agent: 'PerplexityBot', role: 'Index crawler for Perplexity’s own index.' },
      { agent: '(unnamed search partners)', role: 'Partner supply; partners are not named in the documentation available.' },
    ],
    indexSource: 'Perplexity’s own index (PerplexityBot) plus unnamed search partners. The full ranking formula is unpublished.',
    citationMechanics: 'Retrieval-augmented by design: live search on nearly every query. Answers stream search_results events — one per search run, each source carrying id, title, snippet, URL and date — and citation markers [N] in the answer text map to those retrieved search-result ids. Citations are retrieval outputs.',
    documentedFacts: [
      { claim: 'Citations map to retrieved search results; the developer documentation states “Never generate your own URLs” (model-generated URLs can be hallucinated).', sourceClass: 'platform documentation — Perplexity developer documentation, “Streaming Citation Parsing”, updated 2026-10-25, read directly 2026-10-31' },
    ],
    contestedOrUnknown: [
      { field: 'Ranking formula', state: 'unpublished. Practitioner percentages circulating about freshness or format advantages are low-credibility and uncontrolled; none are relied on anywhere in this dataset' },
    ],
    sourceRefs: ['Retrieval Machine Dossier 02 §1.2 (Perplexity)', 'Perplexity developer documentation, “Streaming Citation Parsing”, updated 2026-10-25'],
    date: PROFILE_DATE,
  },
];

// ---------------------------------------------------------------- seed:
// citation observations — the ONLY observations on file at this
// build: Dossier 02 §2.2's live probing of the public web-search
// surface (browser.search, 2026-10-31, single vantage). Method is
// 'search-surface' on every row. This surface is NOT the ChatGPT /
// Claude / Perplexity UI and NOT an AI Overview: these rows are a
// labeled proxy for what the retrieval layer surfaces and extracts,
// and they are never presented as answer-engine citations. Cited
// URLs are recorded only where the dossier states them; other
// holders are recorded by name, as observed. Positions the dossier
// states as "#0" (first result returned) are recorded as position 1.
const OBS_DATE = '2026-10-31';
const OBS_ERA = 'post-rebuild';
const OBS_RUNNER = 'Retrieval Machine Dossier 02 §2.2 probing (browser.search public web-search surface, single vantage, 2026-10-31)';
const OBSERVATIONS = [
  {
    observationId: 'obs-search-surface-2026-10-31-gun-safe-movers-virginia',
    prompt: 'gun safe movers Virginia',
    engine: 'search-surface-proxy', surface: 'search-surface proxy (public web-search surface)',
    ourCited: { cited: true, url: SITE + '/gun-safe-movers/', position: 1, fragmentMatched: 'The surface lifted the gun-safe hub’s FAQ blocks verbatim into the returned snippet (empty-the-safe instruction, branch facts, the SIR 1,500–3,500 lb band).' },
    citedUrlsInOrder: [SITE + '/gun-safe-movers/'],
    otherHoldersObserved: [
      { name: 'Southside (Hampton Roads)', note: 'dedicated specialty page in the returned set' },
      { name: 'VanGuard (Fairfax)', note: 'dedicated specialty page in the returned set' },
      { name: 'MyProMovers', note: 'present via press-release distribution' },
    ],
    answerStatementsAboutUs: [
      { statement: 'The extracted snippet carried the company’s published facts: the SIR 1,500–3,500 lb high-mass band, the empty-the-safe-first instruction, and distinct branch facts.', accuracyVerdict: 'accurate', causeRef: null },
    ],
    note: 'Fragment extraction is working now for the estate’s strongest family. Competitor fragments in this set compete on equipment lists and price tables; the company’s differentiators in the extracted text are the SIR band, flat rate in writing, and distinct branch facts.',
  },
  {
    observationId: 'obs-search-surface-2026-10-31-transloading-winchester-vip',
    prompt: 'transloading Winchester VA Virginia Inland Port',
    engine: 'search-surface-proxy', surface: 'search-surface proxy (public web-search surface)',
    ourCited: { cited: true, url: SITE + '/gun-safe-movers/', position: 1, fragmentMatched: 'Returned via the hub’s embedded “Transloading Services — Winchester VA” section. The dedicated page /virginia-inland-port-transloading/ did not appear.' },
    citedUrlsInOrder: [SITE + '/gun-safe-movers/'],
    otherHoldersObserved: [
      { name: 'Maersk / MSC', note: 'inland-port pages in the returned set' },
      { name: 'Commtrex', note: 'Winchester transload facility listing in the returned set' },
    ],
    answerStatementsAboutUs: [
      { statement: 'No factual statement about the company was made; the observation is a routing fact: the hub, not the dedicated transloading page, was the returned URL.', accuracyVerdict: 'not-applicable — routing observation, no factual claim', causeRef: 'gap-a2-hub-concentration' },
    ],
    note: 'The hub-concentration anomaly (Dossier 01 G2) is real on this surface: the hub is the estate’s universal donor page. The vendor intent for Virginia Inland Port transloading is otherwise answered by the port authority, carriers and a facility directory — no local transloading operator’s dedicated page holds it.',
  },
  {
    observationId: 'obs-search-surface-2026-10-31-movers-winchester-va',
    prompt: 'movers Winchester VA',
    engine: 'search-surface-proxy', surface: 'search-surface proxy (public web-search surface, Places-style records)',
    ourCited: { cited: true, url: SITE + '/', position: 5, fragmentMatched: null },
    citedUrlsInOrder: [],
    otherHoldersObserved: [
      { name: 'Mover Dudes', note: 'record position 1 in the sampled order' },
      { name: 'Shields', note: 'present in the sampled record set' },
      { name: 'M.C. Movers', note: 'present in the sampled record set' },
      { name: 'Hulk Haulers', note: 'present in the sampled record set' },
    ],
    answerStatementsAboutUs: [
      { statement: 'The Winchester record showed the company’s name, address, phone, coordinates and hours — all correct for the Winchester branch.', accuracyVerdict: 'accurate', causeRef: null },
      { statement: 'No rating line surfaced for the company in this record, where competitor records carry one; the record’s completeness is thinner than competitors’.', accuracyVerdict: 'accurate-as-shown — a completeness observation, not a factual error', causeRef: null },
    ],
    note: 'The Winchester entity resolves correctly on the local graph. Record completeness (rating display, offerings) is an Element 3 contest that this element consumes.',
  },
  {
    observationId: 'obs-search-surface-2026-10-31-warehouse-racking-relocation',
    prompt: 'warehouse racking relocation',
    engine: 'search-surface-proxy', surface: 'search-surface proxy (public web-search surface)',
    ourCited: { cited: false, url: null, position: null, fragmentMatched: null },
    citedUrlsInOrder: [],
    otherHoldersObserved: [
      { name: '(no US-local holder)', note: 'the returned set was a New Zealand brochure PDF, a UK specialist, an Australian firm and one Florida warehouse mover' },
    ],
    answerStatementsAboutUs: [],
    note: 'Recorded as a query-design finding: the un-geographed query is not localizable by the retrieval layer from this vantage. Racking intent must be won in geo-anchored forms, and fragments must carry the geo anchor inside the passage, not just in page metadata (gap A8).',
  },
  {
    observationId: 'obs-search-surface-2026-10-31-what-is-sir',
    prompt: 'what is SIR Structural Integrity Relocation moving',
    engine: 'search-surface-proxy', surface: 'search-surface proxy (public web-search surface)',
    ourCited: { cited: true, url: SITE + '/gun-safe-movers/', position: 1, fragmentMatched: 'The gun-safe page’s SIR / KIM-GS / L/360 definitional text was extracted at position 1; the company’s own Medium article held position 2.' },
    citedUrlsInOrder: [SITE + '/gun-safe-movers/'],
    otherHoldersObserved: [
      { name: 'Medium — @ratemovers, “Vibration Sensitivity & The KIM-GS Protocol…”', note: 'the company’s own owned channel at position 2 (URL not stated in the probing record; recorded by name)' },
      { name: 'Florida SIRS content (Structural Integrity Reserve Study)', note: 'term collision below the company’s results: a statutory neighbor namespace, not a competitor' },
    ],
    answerStatementsAboutUs: [
      { statement: 'The definitional text extracted for SIR (Structural Integrity Relocation), the KIM-GS Protocol and the L/360 floor-deflection standard matches the estate’s published definitions.', accuracyVerdict: 'accurate', causeRef: null },
    ],
    note: 'The proprietary term’s answer layer is the company plus its owned channel — a defended asset, and the template for definitional redundancy (gap A6): every proprietary concept should hold its definition on at least two owned surfaces.',
  },
  {
    observationId: 'obs-search-surface-2026-10-31-flat-rate-movers-martinsburg',
    prompt: 'flat rate movers Martinsburg WV',
    engine: 'search-surface-proxy', surface: 'search-surface proxy (public web-search surface, Places-style records)',
    ourCited: { cited: true, url: SITE + '/', position: 1, fragmentMatched: null },
    citedUrlsInOrder: [],
    otherHoldersObserved: [],
    answerStatementsAboutUs: [
      { statement: 'The Martinsburg record showed the branch address with Suite 2, phone, coordinates and hours — all exactly the Martinsburg branch’s published facts.', accuracyVerdict: 'accurate', causeRef: null },
      { statement: 'The record’s display name was shortened to “Flat Rate Movers”. The branch’s published name is “Flat Rate Movers Martinsburg WV”.', accuracyVerdict: 'inaccurate — third-party record drift', causeRef: 'Dossier 03 registry: Martinsburg Places record (display name / labels)' },
      { statement: 'The record’s offerings list included “Certified gun safe transport” and “Extreme-mass logistics” — labels the estate does not publish for this service (“Certified” is not a word the estate uses for it).', accuracyVerdict: 'inaccurate — third-party record drift', causeRef: 'Dossier 03 registry: Martinsburg Places record (display name / labels)' },
    ],
    note: 'The entity resolves to the correct distinct place; the labels attached to it drift from the published record. Carried into Dossier 03 as a registry item with its fix (gap A7).',
  },
];

// ---------------------------------------------------------------- seed:
// review-distribution snapshots — Dossier 02 §2.4 + §0, observed
// 2026-10-31. Distribution and arithmetic only. Displayed averages
// and counts are platform-display facts, recorded per platform and
// never blended; no count anywhere in this table is a quality
// signal, for any subject (owner rule). Histogram, velocity,
// reviewer-profile and text-repetition fields are UNMEASURED for
// every record: they require per-platform corpus capture that has
// not been performed (§8.5 of the dossier); the fields are present
// and null with the reason stated, never filled by inference.
const SNAP_DATE = '2026-10-31';
const UNMEASURED = {
  starHistogram: null,
  starHistogramState: 'unmeasured — the platform did not publicly expose a histogram in the sampled record; corpus capture has not been performed',
  velocity: null,
  velocityState: 'unmeasured — requires dated-review corpus capture, not performed',
  reviewerProfileSignals: null,
  reviewerProfileSignalsState: 'unmeasured — requires reviewer-corpus capture, not performed; no reviewer identities are stored by design',
  textRepetition: null,
  textRepetitionState: 'unmeasured — requires corpus capture, not performed',
};
const SNAPSHOTS = [
  {
    snapshotId: 'review-snapshot-2026-10-31-google-winchester', namespace: 'company',
    platform: 'Google (Business Profile)', subject: 'The Flat Rate Movers — Winchester branch',
    branchRef: SITE + '/#winchester', date: SNAP_DATE,
    displayedAverage: 5.0, displayedCount: 1,
    arithmetic: { perfectStarTotal: 5, starPointsBelowPerfect: 0, reading: 'A 5.0 average over 1 review is a one-review distribution: the single review is 5 stars. Stated as a distribution fact; a one-review sample carries no quality inference in either direction.' },
    ...UNMEASURED,
    ownerStatement: null,
    note: 'Small-sample distribution, exactly what the business model produces: the branch’s clientele is privacy-sensitive and high-value, and low public review volume is a fixed characteristic of that model (Dossier 02 §0 correction), not a deficit to be engineered away.',
    sourceRef: 'Retrieval Machine Dossier 02 §2.4 (per-platform display, observed 2026-10-31)',
  },
  {
    snapshotId: 'review-snapshot-2026-10-31-google-martinsburg', namespace: 'company',
    platform: 'Google (Business Profile)', subject: 'Flat Rate Movers Martinsburg WV — Martinsburg branch',
    branchRef: SITE + '/#martinsburg', date: SNAP_DATE,
    displayedAverage: 4.7, displayedCount: 6,
    arithmetic: { perfectStarTotal: 30, starPointsBelowPerfect: 2, reading: 'A displayed 4.7 over 6 reviews means the six reviews total 28 stars (the only integer total inside the rounding band) — two star-points below a perfect 30. A small-sample distribution, stated as arithmetic only.' },
    ...UNMEASURED,
    ownerStatement: null,
    note: 'Small-sample distribution, as with Winchester: honest, thin, and a fixed characteristic of the business model (Dossier 02 §0 correction).',
    sourceRef: 'Retrieval Machine Dossier 02 §2.4 (per-platform display, observed 2026-10-31)',
  },
  {
    snapshotId: 'review-snapshot-2026-11-04-google-winchester', namespace: 'company',
    platform: 'Google (Business Profile)', subject: 'The Flat Rate Movers — Winchester branch',
    branchRef: SITE + '/#winchester', date: '2026-11-04',
    displayedAverage: 5.0, displayedCount: 2,
    arithmetic: { perfectStarTotal: 10, starPointsBelowPerfect: 0, reading: 'A 5.0 average over 2 reviews: both reviews are 5 stars (full enumeration, 2026-11-04). Stated as a distribution fact; a two-review sample carries no quality inference in either direction.' },
    starHistogram: { '5': 2, '4': 0, '3': 0, '2': 0, '1': 0 },
    starHistogramState: 'measured — full profile enumeration 2026-11-04: every review on the profile was read (stars, text and owner-reply state); the histogram is the complete corpus, not a sample',
    velocity: null,
    velocityState: 'unmeasured — the platform displays relative dates only; velocity is not computed from relative dates',
    reviewerProfileSignals: null,
    reviewerProfileSignalsState: 'unmeasured — reviewer profiles were not inspected; no reviewer identities are stored in this dataset by design',
    textRepetition: null,
    textRepetitionState: 'unmeasured — corpus captured 2026-11-04; repetition analysis not performed',
    ownerStatement: null,
    note: 'Second dated observation of this profile: the count moved 1 → 2 on 2026-11-04 (a new 5-star review, answered by the owner the same day). Small-sample distribution, exactly what the business model produces: the branch’s clientele is privacy-sensitive and high-value, and low public review volume is a fixed characteristic of that model (Dossier 02 §0 correction), not a deficit to be engineered away. Every review on both company profiles carries an owner reply (enumeration 2026-11-04).',
    sourceRef: 'Google Business Profile full review enumeration, 2026-11-04 (browser sitting on the owner’s order)',
  },
  {
    snapshotId: 'review-snapshot-2026-11-04-google-martinsburg', namespace: 'company',
    platform: 'Google (Business Profile)', subject: 'Flat Rate Movers Martinsburg WV — Martinsburg branch',
    branchRef: SITE + '/#martinsburg', date: '2026-11-04',
    displayedAverage: 4.7, displayedCount: 6,
    arithmetic: { perfectStarTotal: 30, starPointsBelowPerfect: 2, reading: 'A displayed 4.7 over 6 reviews totals 28 stars — two star-points below a perfect 30; the full enumeration shows the deficit sits in exactly two 4-star reviews and no review below four stars. A small-sample distribution, stated as arithmetic only.' },
    starHistogram: { '5': 4, '4': 2, '3': 0, '2': 0, '1': 0 },
    starHistogramState: 'measured — full profile enumeration 2026-11-04: every review on the profile was read (stars, text and owner-reply state); the histogram is the complete corpus, not a sample',
    velocity: null,
    velocityState: 'unmeasured — the platform displays relative dates only; velocity is not computed from relative dates',
    reviewerProfileSignals: null,
    reviewerProfileSignalsState: 'unmeasured — reviewer profiles were not inspected; no reviewer identities are stored in this dataset by design',
    textRepetition: null,
    textRepetitionState: 'unmeasured — corpus captured 2026-11-04; repetition analysis not performed',
    ownerStatement: null,
    note: 'Second dated observation of this profile: values unchanged from 2026-10-31 (4.7 over 6); the 2026-11-04 enumeration re-verified every review’s stars and text. Small-sample distribution, as with Winchester: honest, thin, and a fixed characteristic of the business model (Dossier 02 §0 correction). Every review on both company profiles carries an owner reply (enumeration 2026-11-04).',
    sourceRef: 'Google Business Profile full review enumeration, 2026-11-04 (browser sitting on the owner’s order)',
  },
  {
    snapshotId: 'review-snapshot-2026-10-31-birdeye-winchester', namespace: 'company',
    platform: 'Birdeye (cross-platform aggregate display)', subject: 'The Flat Rate Movers — Winchester branch (aggregator display)',
    branchRef: SITE + '/#winchester', date: SNAP_DATE,
    displayedAverage: 4.9, displayedCount: 41,
    arithmetic: { perfectStarTotal: 205, starPointsBelowPerfect: '3–6', reading: 'A displayed 4.9 over 41 reviews means the corpus totals 199–202 stars (the integer totals inside the rounding band) — 3–6 star-points below a perfect 205.' },
    ...UNMEASURED,
    ownerStatement: null,
    note: 'An aggregator’s cross-platform display manufactures a different-looking number from the same underlying reality as the per-platform records above — one more reason counts are cited per platform or not at all. The Birdeye profile itself carries separate record defects (Dossier 03 registry).',
    sourceRef: 'Retrieval Machine Dossier 02 §2.4 (Birdeye aggregate display, via Dossier 03, observed 2026-10-31)',
  },
  {
    snapshotId: 'review-snapshot-2026-10-31-google-mover-dudes', namespace: 'competitor',
    platform: 'Google', subject: 'Mover Dudes (Winchester pack leader) — competitor namespace record',
    branchRef: null, date: SNAP_DATE,
    displayedAverage: 4.7, displayedCount: 172,
    arithmetic: {
      perfectStarTotal: 860, starPointsBelowPerfect: '44–60',
      minimumBelowFiveStarReviews: '11–15',
      minimumConstruction: 'most charitable construction: every non-5-star review is a 1-star review (each such review accounts for 4 lost star-points; 44–60 lost points require at least 11–15 of them)',
      belowFiveTailIfMostlyFourStar: '44–60 reviews (26–35% of the corpus)',
      reading: 'A displayed 4.7 average (true mean between 4.65 and 4.75 after rounding) over 172 reviews sits 44–60 star-points below a perfect 860. A 4.7 headline average over a large corpus mathematically requires a substantial below-5 tail; the headline number alone conceals it. Distribution, not count, is the honest unit.',
    },
    ...UNMEASURED,
    sampleNote: 'The five review texts surfaced in the 2026-10-31 record sample were all strongly positive — a sample, not a distribution; the full histogram, velocity, reviewer-profile patterns and text-repetition signals are not observable from that surface and are recorded here as unmeasured.',
    ownerStatement: {
      type: 'owner market knowledge — recorded as stated, NOT verified fact',
      statement: 'Henry states from market knowledge that the pack leader’s 172 Google reviews are mostly not genuine and many are negative.',
      reliance: 'No finding, ranking or recommendation in this dataset rests on this statement. What is verifiable from the aggregate alone is the arithmetic recorded above.',
    },
    note: 'Competitor-namespace record: benchmark evidence about the market only. This record can never join into a company-claim surface (schema bar, enforced in this generator and in the verification suite).',
    sourceRef: 'Retrieval Machine Dossier 02 §§0, 2.4 (per-platform display + aggregate arithmetic, observed 2026-10-31)',
  },
];

// ---------------------------------------------------------------- seed:
// gap records — Dossier 02 §4 (A1-A9), each with its designed
// solution and the build batch that resolves it (Dossier 02 §7).
const GAPS = [
  { gapId: 'gap-a1-no-panel', title: 'No prompt-panel instrument exists: citation standing on the actual answer UIs is completely unmeasured', requirementRef: 'Dossier 02 §4 A1', evidenceRefs: ['Dossier 02 §1.5', 'Dossier 02 §2.1'], impact: 'No console exists for ChatGPT / Claude / Perplexity citation standing; zero panel observations have ever been run. Every other gap in this element is ranked on supply-side reasoning because the outcome measure does not exist.', status: 'open — instrument designed; this dataset is its substrate', resolvingBatch: 'Element 2 build batch B2 (Answer Panel instrument + first run)', solution: 'The Answer Panel: a fixed panel of money questions generated from the rubric (panel set membership is a flag on the rubric row, so panel and rubric can never drift apart), run on the ChatGPT, Claude, Perplexity and Google AI surfaces on a monthly cadence, recording engine, surface, prompt verbatim, date, cited URLs in order, whether the company was cited and with which fragment, and an accuracy verdict on every statement the answer makes about the company. Runs are recorded as citation_observation rows with method prompt-panel — a namespace never averaged with search-surface or console rows.' },
  { gapId: 'gap-a2-hub-concentration', title: 'Hub concentration at the fragment level: the gun-safe hub is the estate’s universal donor', requirementRef: 'Dossier 02 §4 A2', evidenceRefs: ['Dossier 02 §2.2 (transloading probe)', 'Dossier 01 G2'], impact: 'Answer engines fan out into sub-questions; a hub containing every service’s text is a candidate for all of them and the right page for none. The five takeover categories risk being answered from the wrong page, with the wrong fragment, or not at all.', status: 'open — the binding substrate is built in this batch; the hub re-scope is B3', resolvingBatch: 'Element 2 build batch B3 (fragment binding wave 1)', solution: 'Answer-fragment binding: every rubric question is bound to exactly one owning fragment (this dataset computes the binding state of every row); the hub’s embedded service sections are re-scoped to route (one-line answer + link to the owning page’s fragment) rather than contain each service’s full text; rows whose owning fragment lives on the hub while a dedicated page exists are flagged by the coverage gate.' },
  { gapId: 'gap-a3-vip-vendor-intent', title: 'Transloading / Virginia Inland Port vendor intent is unanswered by any local operator', requirementRef: 'Dossier 02 §4 A3', evidenceRefs: ['Dossier 02 §2.2 (transloading probe)', 'Dossier 01 G3'], impact: 'The VIP / transloading cluster is held by the Port’s own pages, carriers and a facility directory; the company’s presence is via the hub only. The vendor-intent sub-cluster — a shipper asking who transloads at the VIP — is a specific-need question, the class answer engines answer from websites.', status: 'open — fragment set designed', resolvingBatch: 'Element 2 build batch B3 (VIP vendor-intent fragment set)', solution: 'A vendor-intent fragment set on /virginia-inland-port-transloading/, built from the rubric’s transloading rows (the estate’s largest category) and published estate facts only: what transloading at the VIP is, who performs it from the Winchester / I-81 side, how ocean-to-domestic conversion, cross-docking and deconsolidation differ, what the shipper must provide, and how a job is quoted (per job, flat rate in writing).' },
  { gapId: 'gap-a4-certificate-positioning', title: 'The certificate is built but not positioned where an answer system would ever meet it', requirementRef: 'Dossier 02 §4 A4', evidenceRefs: ['Dossier 02 §2.3'], impact: 'No engine documents provenance indexes as citation inputs, and no answer fragment anywhere states in citable form that the company’s published facts can be verified and how. The effect size of fixing it is honestly unknown; it is a cheap, truthful fragment, not a promised lever.', status: 'open — fragment + telemetry designed', resolvingBatch: 'Element 2 build batch B6 (verification fragment + telemetry)', solution: 'One canonical verification fragment (Developer page + llms-full + API landing, identical wording): the estate’s facts are published as certificate-sealed distributions under an Ed25519 signed index, verifiable at the published JWKS and in one API / MCP call — stated as what it proves (origin + integrity) and what it does not. API / MCP verify_file calls are counted as aggregate telemetry so the program can report whether anything ever checks.' },
  { gapId: 'gap-a5-fragment-coverage', title: 'Fragment coverage is proven on one family (gun safes) and unbuilt as an estate-wide system', requirementRef: 'Dossier 02 §4 A5', evidenceRefs: ['Dossier 02 §2.2 (gun-safe probe)', 'fragment_coverage table in this dataset'], impact: 'Gun-safe FAQ fragments extract verbatim; no equivalent extraction test existed for the other 27 services, and the rubric’s questions were not mapped to fragments anywhere. From this build, coverage is a computed number that moves, not a project that “finishes”.', status: 'open — coverage computed from this build; category waves close it', resolvingBatch: 'Element 2 build batch B4 (fragment coverage waves, standing sequence)', solution: 'Extend the gun-safe pattern estate-wide: each service’s primary page carries question-shaped fragments for its rubric questions (answer-first, self-contained, numbers included where published), written from each category’s full deep-treatment research — never spun from a template (scaled templated content is a named spam risk). The coverage gate in this dataset recomputes fragment coverage per service every batch; thin spots are named, per the doctrine.' },
  { gapId: 'gap-a6-sir-namespace', title: 'Proprietary-term namespace risk: “SIR” has a statutory neighbor (Florida SIRS)', requirementRef: 'Dossier 02 §4 A6', evidenceRefs: ['Dossier 02 §2.2 (SIR probe)'], impact: 'Exact-phrase SIR queries return the company at position 1 and its Medium article at position 2; the broader result set is dominated by Florida SIRS condo-law content. Definitional ownership is held on exactly two surfaces today.', status: 'open — redundancy designed', resolvingBatch: 'Element 2 build batch B6 (definitional redundancy)', solution: 'The SIR / KIM-GS definitions published in identical canonical wording on every surface that legitimately carries them (heavy-asset hub, SIR registry / GitHub authority repos, the book’s citation records, Zenodo / Hugging Face dataset descriptions, the Medium channel), each definitional fragment carrying the disambiguation “SIR (Structural Integrity Relocation), a moving-industry method — not a Structural Integrity Reserve Study”. The canonical definition text lives in the estate’s single source and propagates like any other fact; this dataset binds the definition questions to those fragments across surfaces so drift is gate-detectable.' },
  { gapId: 'gap-a7-local-graph-evidence', title: 'Local-answer evidence depends on the local graph, whose corrupt records are also answer corruption', requirementRef: 'Dossier 02 §4 A7', evidenceRefs: ['Dossier 02 §2.2 (Martinsburg probe)', 'Dossier 03 registry'], impact: 'An answer engine summarizing the Martinsburg branch today can lift “Certified gun safe transport” — a label the company does not publish — from the company’s own graph record. Wrong third-party facts are answer corruption, not just listing corruption.', status: 'open — one worklist, two dossiers', resolvingBatch: 'Dossier 03 corrections program (registry); consumed by Element 2 build batch B4', solution: 'Dossier 03’s third-party-record registry is the single corrections queue; this element consumes its status field — a record counts as answer-evidence-clean only at status corrected-live. The Martinsburg label drift carries a named registry row with its fix (align the profile-side service / offerings labels to the estate’s published labels; verify the branch display name at the profile source). This dataset joins registry status per branch so panel observations about local questions can be read against which graph records were clean at observation time.' },
  { gapId: 'gap-a8-geo-anchor', title: 'The un-geographed query failure mode: category intent without a geo anchor returns nothing usable', requirementRef: 'Dossier 02 §4 A8', evidenceRefs: ['Dossier 02 §2.2 (racking probe)'], impact: '“warehouse racking relocation” returned NZ / UK / AU results. Racking, data-center and medical buyers often search un-geographed first (national procurement language); fragments that do not carry their geography inside the passage cannot be localized wherever they are lifted.', status: 'open — standard designed; applied in the B4 waves', resolvingBatch: 'Element 2 build batch B4 (geo-anchored fragments); panel includes both forms from B2', solution: 'Every B2B category fragment carries its geography inside the passage (e.g. “…from Winchester, VA, serving the I-81 corridor and Northern Virginia data-center markets…”) using only published footprint facts; category pages also answer the national-form question with the process chain, earning the informational citation even when the vendor citation goes elsewhere. The panel includes geo’d and un-geographed forms of the B2B prompts so the effect is observed, not assumed.' },
  { gapId: 'gap-a9-unmeasured-supply-lines', title: 'Two supply lines are unmeasured: Brave (Claude’s retrieval proxy) and Perplexity’s index', requirementRef: 'Dossier 02 §4 A9', evidenceRefs: ['Dossier 02 §1.2 (Claude, Perplexity)'], impact: 'Claude’s retrieval tracks Brave’s top 10 closely in independent measurement, so Brave standing is the best available proxy for Claude citability — and it has never been observed. PerplexityBot admission is documented, but the company’s presence in its index is unobserved.', status: 'open — runner extension designed', resolvingBatch: 'Element 2 build batch B2 (observation runner extension)', solution: 'Extend the observation runner, do not build a new one: three method namespaces kept separate forever — search-surface (the current probing), brave-serp (Brave results for the money queries) and prompt-panel (the actual UIs). Same query set, same era tags, monthly cadence. Brave has no submission route — supply runs through the open crawl posture the estate already operates — so the runner observes only, and standing changes are correlated with estate batches in this dataset rather than attributed by feel.' },
];

// ------------------------------------------------------------- inputs
const pagesReg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages.json'), 'utf8'));
const shell = fs.readFileSync(path.join(REPO_DIR, 'index.html'), 'utf8');
const headDataSrc = fs.readFileSync(path.join(PAGES_DIR, 'functions', 'head-data.js'), 'utf8');
const intentRows = sql('SELECT id, query_text, intent_class, service_id, area, target_url, dataset_ids FROM intent_query ORDER BY id');
const meta = {};
for (const r of sql('SELECT key, value FROM intent_meta')) meta[r.key] = r.value;
const llmsFullNorm = normText(fs.readFileSync(path.join(PUB, 'llms-full.txt'), 'utf8'));

// head-data.js evaluated in place (the build-search-index pattern): the
// authoritative per-page JSON filename source.
const HEAD = (() => {
  const m = { exports: {} };
  new Function('module', 'exports', headDataSrc.replace('export const HEAD =', 'module.exports ='))(m, m.exports);
  return m.exports;
})();
function headJsonFile(url) {
  const key = url.replace(SITE, '').replace(/\/$/, '');
  const e = HEAD[key === '' ? '/' : key];
  return e ? e.jf : null;
}

// pageMeta parsed out of the source shell (the build-routes pattern):
// router slug -> canonical URL, the estate's own join.
const pageMeta = (() => {
  const at = shell.indexOf('var pageMeta=');
  if (at < 0) throw new Error('pageMeta not found in shell');
  let i = shell.indexOf('{', at), depth = 0, inStr = null, esc = false, end = -1;
  for (let j = i; j < shell.length; j++) {
    const c = shell[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === inStr) inStr = null; }
    else if (c === "'" || c === '"') inStr = c;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  if (end < 0) throw new Error('pageMeta literal did not balance');
  return Function('return (' + shell.slice(i, end + 1) + ')')();
})();
const pageByUrl = new Map(pagesReg.pages.map((p) => [p.url, p]));
const urlByRouterSlug = new Map();
for (const [k, v] of Object.entries(pageMeta)) if (v && v.canonical) urlByRouterSlug.set(k, v.canonical);

// script-aware, depth-aware page-div spans (the estate's div_span
// pattern, ported).
function divSpan(slug) {
  const start = shell.indexOf('<div class="page" id="page-' + slug + '">');
  if (start < 0) return null;
  let i = start, depth = 0;
  while (i < shell.length) {
    const o = shell.indexOf('<div', i), c = shell.indexOf('</div>', i), sc = shell.indexOf('<script', i);
    const cands = [o, c, sc].filter((x) => x >= 0);
    if (!cands.length) break;
    const j = Math.min(...cands);
    if (j === sc) { i = shell.indexOf('</script>', j) + 9; continue; }
    if (j === o) { depth += 1; i = j + 4; continue; }
    depth -= 1; i = j + 6;
    if (depth === 0) return [start, i];
  }
  throw new Error('unbalanced div: ' + slug);
}

// per-page JSON facts: schema types, FAQ pairs, file digest.
const fileDigestCache = new Map();
function digestOfPublicFile(name) {
  if (!fileDigestCache.has(name)) {
    const p = path.join(PUB, name);
    if (!fs.existsSync(p)) throw new Error('public file missing: ' + name);
    fileDigestCache.set(name, sha256(fs.readFileSync(p)));
  }
  return fileDigestCache.get(name);
}
const pageFacts = new Map(); // url -> { jf, schemaTypes, faqPairs }
for (const p of pagesReg.pages) {
  const urlPath = p.url.replace(SITE, '').replace(/\/$/, '');
  const jf = headJsonFile(urlPath === '' ? '' : urlPath) || headJsonFile(p.url);
  if (!jf) throw new Error('no head-data jf for ' + p.url);
  const doc = JSON.parse(fs.readFileSync(path.join(PUB, jf), 'utf8'));
  const types = new Set();
  const faqPairs = [];
  for (const n of (doc['@graph'] || [doc])) {
    if (!n || typeof n !== 'object') continue;
    const t = n['@type'];
    if (Array.isArray(t)) t.forEach((x) => types.add(x)); else if (t) types.add(t);
    if (t === 'FAQPage') {
      for (const q of (n.mainEntity || [])) {
        if (q && q['@type'] === 'Question' && q.name && q.acceptedAnswer && q.acceptedAnswer.text) {
          faqPairs.push({ question: visibleText(q.name), answer: visibleText(q.acceptedAnswer.text) });
        }
      }
    }
  }
  pageFacts.set(p.url, { jf, schemaTypes: [...types].sort(), faqPairs });
}

// ------------------------------------------------- passage extraction
const QUESTION_LEAD = /^(how|what|when|where|why|which|who|whose|can|do|does|did|is|are|was|were|should|will|would|could|how much|how long|how many)\b/i;
function questionShaped(heading) {
  const h = heading.trim();
  return h.endsWith('?') || QUESTION_LEAD.test(h);
}
const HEX64 = /[0-9a-f]{64}/;
let excludedSelfReferential = 0;
const fragments = [];
const fragmentsByPage = new Map(); // url -> [fragment]
function pushFragment(f) {
  fragments.push(f);
  if (!fragmentsByPage.has(f.pageUrl)) fragmentsByPage.set(f.pageUrl, []);
  fragmentsByPage.get(f.pageUrl).push(f);
}
function jfLinkFor(url) {
  const facts = pageFacts.get(url);
  return {
    kind: 'per-page-json', url: SITE + '/' + facts.jf, sha256: digestOfPublicFile(facts.jf),
    note: 'The page’s own structured record (digest = the SHA-256 the signed index seals).',
  };
}
function surfaceCopiesFor(url, bodyText) {
  const copies = [{ surface: 'page', url }];
  const probe = normText(bodyText).slice(0, 80);
  if (probe.length >= 40 && llmsFullNorm.includes(probe)) {
    copies.push({ surface: 'llms-full.txt', url: SITE + '/llms-full.txt' });
  }
  return copies;
}

for (const [routerSlug, url] of [...urlByRouterSlug.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
  const page = pageByUrl.get(url);
  if (!page) throw new Error('pageMeta canonical not in registry: ' + url);
  const span = divSpan(routerSlug);
  if (!span) throw new Error('no page div for router slug ' + routerSlug);
  const facts = pageFacts.get(url);
  let seq = 0;
  const mk = (source, heading, locator, body) => {
    seq += 1;
    const text = (heading + ' ' + body).replace(/\s+/g, ' ').trim();
    if (HEX64.test(text)) { excludedSelfReferential += 1; return; }
    const f = {
      fragmentId: 'frag-' + routerSlug + '-' + seq,
      source,
      pageUrl: url,
      pageSlug: page.slug,
      locator,
      heading,
      questionShaped: questionShaped(heading),
      text,
      textHash: sha256(Buffer.from(text, 'utf8')),
      bodyChars: body.length,
      substantive: body.length >= 120,
      schemaTypes: facts.schemaTypes,
      evidenceLinks: [jfLinkFor(url)],
      surfaceCopies: surfaceCopiesFor(url, body),
      questionIdsAnswered: [],
    };
    pushFragment(f);
  };
  // FAQ fragments first (exact Q&A from the page's own schema).
  for (const pair of facts.faqPairs) {
    mk('faq-schema', pair.question, 'FAQ schema (per-page JSON FAQPage)', pair.answer);
  }
  // Heading-led passages from the div's visible text.
  const divHtml = shell.slice(span[0], span[1])
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ');
  const headRe = /<h([123])[^>]*>([\s\S]*?)<\/h\1>/g;
  const heads = [];
  let hm;
  while ((hm = headRe.exec(divHtml)) !== null) {
    heads.push({ level: Number(hm[1]), heading: visibleText(hm[2]), start: hm.index, end: hm.index + hm[0].length });
  }
  const stack = [];
  for (let k = 0; k < heads.length; k++) {
    const h = heads[k];
    while (stack.length && stack[stack.length - 1].level >= h.level) stack.pop();
    stack.push(h);
    const bodyEnd = k + 1 < heads.length ? heads[k + 1].start : divHtml.length;
    const body = visibleText(divHtml.slice(h.end, bodyEnd));
    if (!h.heading || body.length === 0) continue;
    mk('passage', h.heading, stack.map((s) => s.heading).join(' › '), body);
  }
}
fragments.sort((a, b) => (a.fragmentId < b.fragmentId ? -1 : 1));

// ------------------------------------------------------------ binding
const SAMPLED_WEIGHTS = {
  'gun safe movers virginia': 'P1',
  'transloading services virginia': 'P1',
  'warehouse racking relocation': 'P1',
  'data center relocation services virginia': 'P1',
  'medical equipment moving company virginia': 'P1',
  'virginia inland port front royal intermodal transloading': 'P1',
};
const fragByNormHeadingPage = new Map();
for (const f of fragments) {
  const key = normText(f.heading) + '' + f.pageUrl;
  if (!fragByNormHeadingPage.has(key)) fragByNormHeadingPage.set(key, []);
  fragByNormHeadingPage.get(key).push(f);
}
for (const list of fragByNormHeadingPage.values()) {
  list.sort((a, b) => (a.source === b.source ? 0 : a.source === 'faq-schema' ? -1 : 1));
}
const substantivePages = new Set();
for (const f of fragments) if (f.substantive) substantivePages.add(f.pageUrl);
const questions = [];
const coverageByService = new Map();
for (const r of intentRows) {
  const key = normText(r.query_text) + '' + r.target_url;
  const cands = fragByNormHeadingPage.get(key) || [];
  let binding = 'no-fragment-on-target-page';
  let owning = null;
  if (cands.length) { binding = 'bound-exact'; owning = cands[0]; owning.questionIdsAnswered.push(r.id); }
  else if (substantivePages.has(r.target_url)) binding = 'target-page-has-fragments';
  // Panel membership is DERIVED (2026-11-02 extension): a rubric row
  // is a panel member when its normalized text equals a panel prompt's
  // normalized text AND its target URL equals that prompt's designated
  // target in the panel input file. Without the input file the legacy
  // unmeasured state is emitted unchanged.
  let panelMember = false;
  let panelState = 'not-flagged — the panel set is defined in this element’s build batch B2; no panel run has occurred (full statement on the scope node).';
  if (PANEL.present) {
    panelState = 'not a panel question.';
    for (const [qid, pq] of PANEL.questions) {
      if (normText(r.query_text) === normText(pq.promptVerbatim) && r.target_url === pq.designatedTargetUrl) {
        panelMember = true;
        const info = PANEL.runsByQuestion.get(qid) || { runs: new Set(), latest: PANEL.newestDate };
        panelState = 'panel member — observed in ' + info.runs.size + ' run(s), latest ' + info.latest + '; observations are recorded in this dataset’s citation_observation table with method prompt-panel.';
        break;
      }
    }
  }
  questions.push({
    questionId: 'question-' + r.id,
    rubricRowRef: r.id,
    text: r.query_text,
    intentClass: r.intent_class,
    serviceId: r.service_id,
    geoScope: r.area == null ? 'pattern-family' : r.area,
    targetUrl: r.target_url,
    moneyWeight: SAMPLED_WEIGHTS[r.query_text.toLowerCase()] || 'standard',
    panelMember,
    panelState,
    fragmentBinding: binding,
    owningFragmentId: owning ? owning.fragmentId : null,
  });
  if (!coverageByService.has(r.service_id)) {
    coverageByService.set(r.service_id, { serviceId: r.service_id, rubricRows: 0, boundExact: 0, targetPageHasFragments: 0, noFragmentOnTargetPage: 0 });
  }
  const c = coverageByService.get(r.service_id);
  c.rubricRows += 1;
  if (binding === 'bound-exact') c.boundExact += 1;
  else if (binding === 'target-page-has-fragments') c.targetPageHasFragments += 1;
  else c.noFragmentOnTargetPage += 1;
}
for (const f of fragments) f.questionIdsAnswered.sort((a, b) => a - b);
// Fragment evidence, completed after binding: beside the page's own
// record, a fragment's facts are backed by the dataset files named by
// the rubric questions bound to it. (Unbound passages carry the
// per-page JSON link only — the page-level dataset mapping lives on
// the questions themselves and in the intent dataset.)
const rowById = new Map(intentRows.map((r) => [r.id, r]));
for (const f of fragments) {
  if (!f.questionIdsAnswered.length) continue;
  const dsFiles = new Set();
  for (const qid of f.questionIdsAnswered) {
    let ids = [];
    try { ids = JSON.parse(rowById.get(qid).dataset_ids || '[]'); } catch (e) { ids = []; }
    for (const d of ids) dsFiles.add(d);
  }
  for (const d of [...dsFiles].sort()) {
    f.evidenceLinks.push({ kind: 'dataset', url: SITE + '/' + d, sha256: digestOfPublicFile(d), note: 'Dataset backing this fragment’s facts, named by a rubric question bound to it.' });
  }
}
const coverageServices = [...coverageByService.values()].sort((a, b) => (a.serviceId < b.serviceId ? -1 : 1));
const coverageTotals = {
  rubricRows: questions.length,
  boundExact: questions.filter((q) => q.fragmentBinding === 'bound-exact').length,
  targetPageHasFragments: questions.filter((q) => q.fragmentBinding === 'target-page-has-fragments').length,
  noFragmentOnTargetPage: questions.filter((q) => q.fragmentBinding === 'no-fragment-on-target-page').length,
  pagesWithFragments: fragmentsByPage.size,
  pagesInRegistry: pagesReg.pages.length,
  servicesCovered: coverageServices.length,
};

// ------------------------------------------------------------- honesty
// gates (design §5.3, extended 2026-11-02): every observation carries
// method + era + prompt verbatim. Admissibility is EVIDENCE-DRIVEN:
// 'search-surface' rows come from the dossier seed below;
// 'prompt-panel' rows are admissible ONLY through the validated panel
// input file (loadPanel — a prompt-panel row appearing anywhere else
// is structurally impossible here and the merged gate still refuses
// any other method); 'brave-serp' and 'console' remain refused
// outright — no run of those methods exists to record, and a row
// claiming them would be a manufactured observation.
const OBS_METHODS_ADMISSIBLE = ['search-surface', 'prompt-panel'];
const seedObservations = OBSERVATIONS.map((o) => ({
  observationId: o.observationId,
  date: OBS_DATE,
  engine: o.engine,
  surface: o.surface,
  method: 'search-surface',
  era: OBS_ERA,
  promptVerbatim: o.prompt,
  citedUrlsInOrder: o.citedUrlsInOrder,
  ourCited: o.ourCited,
  otherHoldersObserved: o.otherHoldersObserved,
  answerStatementsAboutUs: o.answerStatementsAboutUs,
  note: o.note,
  runnerRef: OBS_RUNNER,
}));
const panelObservations = PANEL.present ? PANEL.rows.map((r) => ({
  observationId: r.observationId,
  date: r.date,
  runId: r.runId,
  runKind: r.runKind,
  engine: r.engine,
  surface: r.surface,
  accessMode: r.accessMode,
  method: 'prompt-panel',
  era: r.era,
  panelQuestionId: r.panelQuestionId,
  promptVerbatim: r.promptVerbatim,
  completionState: r.completionState,
  citedUrlsInOrder: r.citedUrlsInOrder,
  ourCited: r.ourCited,
  recommendedFirst: r.recommendedFirst,
  panelScores: r.panelScores,
  otherHoldersObserved: r.otherHoldersObserved,
  answerStatementsAboutUs: r.answerStatementsAboutUs,
  note: r.note,
  runnerRef: r.runnerRef,
})).sort((a, b) => (a.observationId < b.observationId ? -1 : 1)) : [];
// Deterministic merge: search-surface rows in seed order, then panel
// rows sorted by observationId.
const observations = [...seedObservations, ...panelObservations];
{
  const seenIds = new Set();
  for (const o of observations) {
    if (!o.method || !o.era || !o.promptVerbatim) throw new Error('observation missing method/era/prompt: ' + o.observationId);
    if (!OBS_METHODS_ADMISSIBLE.includes(o.method)) throw new Error('method not admissible at this build: ' + o.method);
    if (seenIds.has(o.observationId)) throw new Error('duplicate observationId across the merged set: ' + o.observationId);
    seenIds.add(o.observationId);
  }
}
// Panel state is COMPUTED from the merged rows when the panel input
// file is present (2026-11-02 extension); without it, the legacy
// unmeasured literal is emitted unchanged.
const PANEL_STATE = PANEL.present ? {
  panelRuns: PANEL.runs.size,
  promptPanelObservations: panelObservations.length,
  answerUiObservations: panelObservations.length,
  braveSerpObservations: 0,
  consoleObservations: 0,
  searchSurfaceObservations: seedObservations.length,
  statement: 'Citation standing on the actual answer-engine UIs is MEASURED by the Answer Panel: ' + PANEL.runs.size + ' run(s) on file (' + [...PANEL.runs.keys()].sort().join(', ') + '), latest ' + PANEL.newestDate + ', with ' + panelObservations.length + ' prompt-panel observations recorded in this dataset (method prompt-panel, era post-rebuild), including access-blocked cells recorded as blocked and never scored. Standing is published per method and never averaged across methods: the ' + seedObservations.length + ' search-surface observations (2026-10-31 probes) remain a labeled proxy for what the retrieval layer surfaces and extracts, never an answer-engine citation, and brave-serp and console observations remain unmeasured (0).',
} : {
  panelRuns: 0,
  promptPanelObservations: 0,
  answerUiObservations: 0,
  braveSerpObservations: 0,
  consoleObservations: 0,
  searchSurfaceObservations: seedObservations.length,
  statement: 'Citation standing on the actual answer-engine UIs (ChatGPT, Claude, Perplexity, Google AI Overviews / AI Mode) is UNMEASURED: no prompt panel has ever been run and zero UI observations exist. The only observations on file are the 2026-10-31 search-surface probes recorded in this dataset — a labeled proxy for what the retrieval layer surfaces and extracts, never an answer-engine citation. The panel instrument (question set flagged on the rubric rows, monthly cadence, method prompt-panel) is this element’s build batch B2.',
};

// snapshot schema bar (design §5.1 + §5.3): competitor-namespace
// values can never join into a company-claim surface. The generator
// refuses a competitor record that is unflagged or that carries any
// claim-shaped field.
const SNAPSHOT_CLAIM_FIELDS = ['qualityScore', 'qualityClaim', 'endorsement', 'award', 'certificationClaim', 'ratingVerdict', 'recommendation'];
function assertSnapshotBar(records) {
  for (const r of records) {
    for (const f of SNAPSHOT_CLAIM_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(r, f)) {
        throw new Error('SCHEMA BAR: review snapshot ' + r.snapshotId + ' carries claim field ' + f + ' — refusing to generate');
      }
    }
    if (r.namespace === 'competitor' && !r.note.includes('Competitor-namespace record')) {
      throw new Error('SCHEMA BAR: competitor snapshot ' + r.snapshotId + ' is not labeled as a competitor-namespace record — refusing to generate');
    }
  }
}
assertSnapshotBar(SNAPSHOTS);
const snapshots = SNAPSHOTS.map((s) => ({ ...s }));
const gaps = GAPS.map((g) => ({ ...g }));
// Gap A1 status follows the panel instrument's real state (2026-11-02
// extension): when panel rows are ingested, the record states the
// built instrument and the ingested runs; the record itself is never
// deleted (AE-1 pins gapRecords at 9) and its solution text — the
// design that was executed — is retained verbatim.
if (PANEL.present) {
  const g1 = gaps.find((g) => g.gapId === 'gap-a1-no-panel');
  if (g1) g1.status = 'instrument built; first runs ingested 2026-11-01 and 2026-11-02 (33 rows); monthly cadence booked';
}
const profiles = ENGINE_PROFILES.map((p) => ({ ...p }));

// -------------------------------------------------------------- totals
const DATE_MOD = [OBS_DATE, SNAP_DATE, PROFILE_DATE, ...(PANEL.present ? [PANEL.newestDate] : [])].sort().slice(-1)[0];

/* Q124 wire (2026-11-03; the build-local-graph.js FB-3 pattern):
 * file-level dateModified fields take FILE_DM — the seal phase-0
 * stamps value for this file's own URL when the seal passes
 * FB3_STAMPS, else the lastmod ledger read directly (verify --check
 * runs without FB3_STAMPS), else DATE_MOD. DATE_MOD itself keeps
 * its evidence roles (validation, evidence prose). */
const FILE_DM = (() => {
  if (process.env.FB3_STAMPS) {
    const m = JSON.parse(fs.readFileSync(process.env.FB3_STAMPS, 'utf8'));
    const v = m.files && m.files['https://theflatratemovers.com/datasets-answer-evidence.json'];
    if (!v) throw new Error('FB3_STAMPS lacks the answer-evidence file entry');
    return v;
  }
  try {
    const ledger = JSON.parse(fs.readFileSync(
      path.join(__dirname, '..', 'data', 'lastmod-ledger.json'), 'utf8'));
    return (ledger.urls && ledger.urls['https://theflatratemovers.com/datasets-answer-evidence.json']) || DATE_MOD;
  } catch (_) { return DATE_MOD; }
})();
const totals = {
  questions: questions.length,
  fragments: fragments.length,
  fragmentsBySource: {
    'faq-schema': fragments.filter((f) => f.source === 'faq-schema').length,
    passage: fragments.filter((f) => f.source === 'passage').length,
  },
  fragmentsQuestionShaped: fragments.filter((f) => f.questionShaped).length,
  fragmentsSubstantive: fragments.filter((f) => f.substantive).length,
  fragmentsExcludedSelfReferential: excludedSelfReferential,
  coverage: coverageTotals,
  engineProfiles: profiles.length,
  citationObservations: observations.length,
  observationsByMethod: PANEL.present
    ? { 'search-surface': seedObservations.length, 'prompt-panel': panelObservations.length }
    : { 'search-surface': seedObservations.length },
  panelState: PANEL_STATE,
  reviewSnapshots: snapshots.length,
  reviewSnapshotsByNamespace: {
    company: snapshots.filter((s) => s.namespace === 'company').length,
    competitor: snapshots.filter((s) => s.namespace === 'competitor').length,
  },
  gapRecords: gaps.length,
};

// ---------------------------------------------------------------- doc
// --- Catalog checks (2026-10-31): in-band sha256 on DataDownload
// entries (schema.org sha256 of MediaObject), read from the public tree
// at generation time so the value equals the digest the signed index
// seals for the same file. Two principled exclusions, mirroring verify
// DC-2: the self-referencing entry (a file cannot carry its own digest —
// it lives in ai-master-index.json) and the ai-master-index.json entry
// itself (the index carries no self-digest by design; its integrity is
// the detached JWS).
const INDEX_URL = SITE + '/ai-master-index.json';
function pubFileDigest(url) {
  if (!url || !url.startsWith(SITE + '/')) return null;
  const rel = url.slice(SITE.length + 1);
  let p = path.join(PUB, rel);
  if (rel === '' || rel.endsWith('/')) p = path.join(p, 'index.html');
  try { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); } catch (_) { return null; }
}
function shaDistributions(nodes, selfUrl) {
  for (const n of nodes) {
    if (!n || !Array.isArray(n.distribution)) continue;
    n.distribution = n.distribution.map((e) => {
      if (!e || e['@type'] !== 'DataDownload' || !e.contentUrl) return e;
      if (e.contentUrl === selfUrl || e.contentUrl === INDEX_URL) return e;
      const d = pubFileDigest(e.contentUrl);
      return d ? { ...e, sha256: d } : e;
    });
  }
}

function baseNode(id, type, name, description) {
  return {
    '@id': id, '@type': type, name, description,
    keywords: ['answer engines', 'citation evidence', 'answer fragments', 'prompt panel', 'AI Overviews', 'retrieval machine'],
    about: [{ '@id': SITE + '/#organization' }],
    spatialCoverage: [{ '@id': SITE + '/#winchester' }, { '@id': SITE + '/#martinsburg' }],
    temporalCoverage: '2010/2026', dateModified: FILE_DM,
    creator: CREATOR, publisher: CREATOR, license: LICENSE,
    distribution: [
      { '@type': 'DataDownload', contentUrl: FILE_URL, encodingFormat: 'application/json' },
      { '@type': 'DataDownload', contentUrl: SITE + '/ai-master-index.json', encodingFormat: 'application/json' },
    ],
    sameAs: LANDING, url: LANDING, identifier: LANDING, isAccessibleForFree: true,
  };
}
const D1_DESC = 'Answer-engine evidence operations for The Flat Rate Movers: the standing dataset of the Retrieval Machine’s answer-engine evidence element. One dataset file joins the demand side (every buyer-intent rubric question, generated from the estate’s own rubric database), the answer side (the fragments — FAQ answers and heading-led passages extracted from the live estate, each with its owning page, locator, full text, text hash for drift detection, the schema types on its page and the sealed evidence backing its facts), the measurement side (what answer surfaces were observed doing, era-tagged, with method as a first-class field), the engines’ documented pipelines (with contested and unknown fields recorded as such), the review-evidence layer stated as distribution and arithmetic only, and the named gaps with their designed solutions.' + (PANEL.present
  ? ' The honesty state of the measurement side is stated wherever it appears: citation standing on the actual answer-engine interfaces is measured by the Answer Panel — ' + PANEL.runs.size + ' run(s) on file, latest ' + PANEL.newestDate + ', ' + panelObservations.length + ' prompt-panel observations recorded with method prompt-panel — published per method and never averaged with the labeled search-surface probes, which remain a proxy and are never presented as answer-engine citations.'
  : ' The honesty state of the measurement side is stated wherever it appears: citation standing on the actual answer-engine interfaces is unmeasured — no prompt panel has ever been run — and the only observations on file are labeled search-surface probes, never presented as answer-engine citations.');
const graph = [
  {
    ...baseNode(SITE + '/#dataset-answer-evidence-operations', 'Service', 'Answer-Engine Evidence Operations', D1_DESC),
    about: [{ '@id': SITE + '/#organization' }],
    provider: { '@id': SITE + '/#organization' },
    areaServed: [{ '@id': SITE + '/#winchester' }, { '@id': SITE + '/#martinsburg' }],
    serviceType: 'Answer-engine evidence, fragment binding and citation measurement operations',
    identifier: [
      { '@type': 'PropertyValue', propertyID: 'X-Provenance-SHA256', name: 'Certificate of the signed AI master index (Ed25519, kid theflatratemovers-2026-10-29-1). The digest of THIS distribution is recorded in ai-master-index.json; verify any copy against that index and its detached signature.', value: 'see ai-master-index.json distribution entry for ' + FILE_URL },
      { '@type': 'PropertyValue', propertyID: 'canonical-file', name: 'Canonical machine-readable file for this dataset', value: FILE_URL },
      { '@type': 'PropertyValue', propertyID: 'canonical-page', name: 'Canonical landing page for this dataset', value: LANDING },
      { '@type': 'PropertyValue', propertyID: 'canonical-api', name: 'Canonical API route for this dataset', value: API_ROUTE },
    ],
    subjectOf: { '@id': SITE + '/#dataset-answer-evidence-method' },
    distribution: [
      { '@type': 'DataDownload', contentUrl: FILE_URL, encodingFormat: 'application/json' },
      { '@type': 'DataDownload', contentUrl: SITE + '/ai-master-index.json', encodingFormat: 'application/json' },
    ],
  },
  {
    ...baseNode(SITE + '/#dataset-answer-evidence-scope', 'Dataset', 'Answer Evidence Scope and Measurement State',
      'The scope this dataset measures: ' + pagesReg.pages.length + ' pages in the registry, ' + coverageTotals.servicesCovered + ' published services, ' + totals.questions + ' rubric questions, ' + profiles.length + ' answer engines profiled — and the measurement state of the answer layer, stated plainly: ' + (PANEL.present
        ? 'the Answer Panel has run — ' + PANEL.runs.size + ' run(s) on file, latest ' + PANEL.newestDate + ', ' + panelObservations.length + ' prompt-panel observations of the actual answer-engine interfaces — alongside the ' + seedObservations.length + ' labeled search-surface probes of 2026-10-31, a proxy kept in its own method namespace and never averaged with panel rows.'
        : 'the Answer Panel has never been run, observations of the actual answer-engine interfaces number zero, and the only observations on file are the ' + seedObservations.length + ' labeled search-surface probes of 2026-10-31.')),
    scope: {
      pagesInRegistry: pagesReg.pages.length,
      servicesCovered: coverageTotals.servicesCovered,
      rubricQuestions: totals.questions,
      enginesProfiled: profiles.length,
      panelState: PANEL_STATE,
    },
  },
  {
    ...baseNode(SITE + '/#dataset-answer-evidence-questions', 'Dataset', 'Answer-Evidence Questions',
      'Every question of the buyer-intent rubric — ' + totals.questions + ' rows generated from the rubric database, never hand-kept — with its intent class, service, geo scope, target page, money weight, Answer Panel membership state, and its fragment-binding state: bound exactly to the fragment that should answer it, covered at page level, or carrying no fragment on its target page yet.'),
    questions,
  },
  {
    ...baseNode(SITE + '/#dataset-answer-evidence-fragments', 'Dataset', 'Answer Fragments',
      'The estate’s answer fragments — ' + totals.fragments + ' passages extracted from the live estate (' + totals.fragmentsBySource['faq-schema'] + ' FAQ answers from the per-page JSON schema, ' + totals.fragmentsBySource.passage + ' heading-led passages from the page texts). Each fragment carries its owning page, heading-path locator, full text, a SHA-256 text hash for drift detection, the schema types present on its page, evidence links to the sealed records backing its facts, its surface copies, and the rubric questions bound to it.'),
    answerFragments: fragments,
  },
  {
    ...baseNode(SITE + '/#dataset-answer-evidence-coverage', 'Dataset', 'Fragment Coverage Report',
      'The fragment-coverage report, computed from the live estate by the generator — never asserted. Of ' + coverageTotals.rubricRows + ' rubric questions, ' + coverageTotals.boundExact + ' are bound exactly to an owning fragment, ' + coverageTotals.targetPageHasFragments + ' are covered at page level (their target page carries substantive fragments but no exact binding yet), and ' + coverageTotals.noFragmentOnTargetPage + ' target a page with no substantive fragment. Coverage is stated per service so thin spots are named, per the doctrine.'),
    fragmentCoverage: { totals: coverageTotals, byService: coverageServices },
  },
  {
    ...baseNode(SITE + '/#dataset-answer-evidence-profiles', 'Dataset', 'Answer Engine Profiles',
      'The four answer engines’ documented pipelines as living data: crawler agents and their roles, index sources, citation mechanics, documented facts with their source class, and — recorded as first-class fields, never smoothed over — the contested and unknown fields (an index provider supported only by indirect evidence; a subprocessor whose role is unknown; citation-share studies that conflict).'),
    engineProfiles: profiles,
  },
  {
    ...baseNode(SITE + '/#dataset-answer-evidence-observations', 'Dataset', 'Citation Observations',
      'What answer surfaces were observed doing — ' + totals.citationObservations + ' observations in ' + (PANEL.present ? 'two method namespaces, never averaged: ' + seedObservations.length + ' method search-surface (the 2026-10-31 probing of the public web-search surface, a labeled proxy) and ' + panelObservations.length + ' method prompt-panel (the Answer Panel runs of 2026-11-01 and 2026-11-02, transcribed from the dated run records through the validated panel input file; the generator refuses any prompt-panel row not backed by that file, and access-blocked cells are recorded as blocked, never scored)' : 'one method only: search-surface (the 2026-10-31 probing of the public web-search surface, a labeled proxy)') + '. Each row carries its engine, surface, method, era, prompt verbatim, the URLs cited in order where the record states them, the company’s citation state, and a human-reviewed accuracy verdict on every statement the surface made about the company.' + (PANEL.present ? '' : ' There are no prompt-panel rows in this file because no panel run exists; the generator refuses to emit one.')),
    citationObservations: observations,
  },
  {
    ...baseNode(SITE + '/#dataset-answer-evidence-reviews', 'Dataset', 'Review Distribution Snapshots',
      'The review-evidence layer stated as distribution and arithmetic only — ' + totals.reviewSnapshots + ' per-platform snapshots (' + totals.reviewSnapshotsByNamespace.company + ' for the company’s own branches and aggregator display, ' + totals.reviewSnapshotsByNamespace.competitor + ' in the competitor namespace), never blended across platforms, and never a raw count presented as a quality signal for any subject. Histogram, velocity, reviewer-profile and text-repetition fields carry their measured or unmeasured state per record: the 2026-11-04 full enumerations measured the two company Google histograms completely; the remaining fields await the captures their state lines name.'),
    reviewDistributionSnapshots: snapshots,
  },
  {
    ...baseNode(SITE + '/#dataset-answer-evidence-gaps', 'Dataset', 'Answer-Evidence Gap Records',
      'The named gaps of the answer-engine evidence element, ' + gaps.length + ' records (A1–A9), each with its requirement reference, evidence references, impact, status, resolving batch — and its designed solution. A gap in this file is a work item with a fix attached, never a bare problem statement.'),
    gapRecords: gaps,
  },
  {
    ...baseNode(SITE + '/#dataset-answer-evidence-totals', 'Dataset', 'Answer Evidence Totals',
      'Totals for this generation of the answer-evidence dataset, computed by the generator from the live estate: ' + totals.questions + ' questions, ' + totals.fragments + ' fragments, ' + totals.engineProfiles + ' engine profiles, ' + totals.citationObservations + ' citation observations (' + (PANEL.present ? seedObservations.length + ' search-surface method; ' + panelObservations.length + ' prompt-panel observations from ' + PANEL.runs.size + ' panel run(s), latest ' + PANEL.newestDate + ' — measured, stated per method' : 'all search-surface method; prompt-panel observations: 0 — unmeasured, stated as such') + '), ' + totals.reviewSnapshots + ' review distribution snapshots and ' + totals.gapRecords + ' gap records. This file is itself a sealed distribution of the signed AI master index, under the certificate block recorded on the operations node.'),
    totals,
    sources: [
      { name: 'Intent rubric database', detail: intentRows.length + ' rows; rows digest ' + (meta.rows_digest || '') + '; generator build-intent-rubric.js (rubric v2)' },
      { name: 'Source shell + per-page JSONs', detail: 'fragment extraction from the live estate: FAQ schema pairs and heading-led passages, with per-page JSON and dataset digests computed from the public files the seal records' },
      { name: 'Live answer-surface probing', detail: 'Retrieval Machine Dossier 02 §2.2 (browser.search public web-search surface, 2026-10-31, single vantage) — a labeled proxy, never an answer-engine UI observation' },
      ...(PANEL.present ? [{ name: 'Answer Panel run records', detail: 'Retrieval Machine answer-panel-2026-11-01.md and answer-panel-2026-11-02.md, transcribed through the validated panel input file (data/panel-observations.json): ' + panelObservations.length + ' prompt-panel observations — the 2026-11-01 full run, the 2026-11-01 Q3 re-probe and the 2026-11-02 monthly run (29 cells completed; 4 ChatGPT cells access-blocked, recorded as blocked and never scored)' }] : []),
      { name: 'Review platform displays', detail: 'Retrieval Machine Dossier 02 §§0, 2.4 (per-platform displays + aggregate arithmetic, observed 2026-10-31)' },
      { name: 'Engine documentation and studies', detail: 'Retrieval Machine Dossier 02 §1.2 (platform documentation via secondary summaries; Perplexity documentation read directly; vendor and academic studies era-labeled, conflicts kept as conflicts)' },
    ],
  },
  {
    '@id': SITE + '/#dataset-answer-evidence-method', '@type': 'Article',
    name: 'How the Answer-Evidence Dataset Is Built',
    description: 'Method. The generator (scripts/build-answer-evidence.js in the Flat Rate Machine) reads the paths registry for every location and builds all tables from the live estate in one run: questions are generated mechanically from the rubric database; fragments are extracted from the source shell’s page divs (heading-led passages h1–h3 with at least one character of body text) and from the per-page JSONs’ FAQPage schema (exact question/answer pairs); a passage quoting a 64-hex SHA-256 string is excluded as self-referential certificate text and the exclusion count is published; each fragment’s text hash is the SHA-256 of its full text, so any later drift between the published fragment and the live page is detectable; binding is exact — a rubric question binds to a fragment only when the fragment’s normalized heading equals the question’s normalized text on the question’s own target page, with FAQ-schema fragments preferred over passages; coverage is computed per service from those bindings and from substantive-fragment presence (body of at least 120 characters), never asserted. Observations are admitted only from evidence on file — the dossier’s dated search-surface probing and the panel input file transcribed from the dated Answer Panel run records — transcribed with method, era, surface and prompt verbatim, and the generator refuses any observation row whose method is not backed by an evidence file: prompt-panel rows are admissible only through the validated panel input file (run records must exist on disk and each run’s census must reconcile), and brave-serp and console rows cannot be emitted until a real run of those methods exists. Review snapshots are transcribed from the dossier’s per-platform records with their arithmetic; the generator enforces the schema bar on competitor-namespace records in code. The file’s dateModified is the estate lastmod-ledger date for this file’s URL, wired by the seal (Batch Q124, 2026-11-03) — outside a seal the generator falls back to the newest evidence date among its inputs — never the wall clock, so regeneration is byte-stable and checkable. Update cadence: the dataset regenerates in every estate batch that changes pages, rubric rows, fragments or observations, and reseals in the same motion.',
    dateModified: FILE_DM, author: { '@id': SITE + '/#organization' },
    isPartOf: { '@id': SITE + '/#dataset-answer-evidence-operations' },
    sameAs: LANDING, url: LANDING, identifier: LANDING, isAccessibleForFree: true,
  },
  {
    '@id': SITE + '/#dataset-answer-evidence-sources-article', '@type': 'Article',
    name: 'Answer-Evidence Dataset Sources',
    description: 'Sources, with their dates and eras kept distinct. (1) The estate’s own registries, rubric database, source shell and per-page JSONs — the question and fragment truth, current at generation. (2) Live probing of the public web-search surface on 2026-10-31 (Retrieval Machine Dossier 02 §2.2): six probes, single vantage, labeled [OBS] in the dossier — a search-surface proxy, explicitly not the ChatGPT, Claude or Perplexity interfaces and not an AI Overview; nothing from it is presented as an answer-engine citation. (3) Platform documentation for the four answer engines (Dossier 02 §1.2): OpenAI, Google and Anthropic documentation via secondary summaries read 2026-10-31; Perplexity’s developer documentation read directly (updated 2026-10-25). (4) Named third-party studies, era-labeled, with their conflicts kept as conflicts: the Profound ChatGPT conversation panel (Oct–Dec 2025, vendor measurement), the Complete SEO Claude–Brave overlap study (2026-09-01), Blyskal 2026, the Ahrefs AI Overview citation analyses (Jul 2025 and Mar 2026, mutually contested), and the Pew Research Center browsing panel (Mar 2025, observational and publicly disputed by Google — used in the dossier for order-of-magnitude reasoning only). (5) Review platform displays observed 2026-10-31 (Dossier 02 §§0, 2.4) with the owner’s market-knowledge statement recorded as a statement, typed as unverified, and relied on by no finding. No source is presented as fresher than it is.',
    dateModified: FILE_DM, author: { '@id': SITE + '/#organization' },
    isPartOf: { '@id': SITE + '/#dataset-answer-evidence-operations' },
    sameAs: LANDING, url: LANDING, identifier: LANDING, isAccessibleForFree: true,
  },
  {
    ...baseNode(SITE + '/#dataset-answer-evidence-boundaries', 'Service', 'Answer Evidence Boundaries and Non-Claims',
      'What this dataset never does. It never presents a search-surface probe as an answer-engine citation, and never claims citation standing on any answer interface that has not been measured — standing is published per method, era-tagged, and never averaged across methods, and the panel state is published in this file precisely so measured and unmeasured surfaces cannot be smoothed over. It never averages observations across methods, never blends review platforms, and never presents a raw review count — the company’s or any competitor’s — as a quality or authority signal; where reviews appear, they appear as distribution and arithmetic. It contains no representation of any service the company has not confirmed and published through the normal estate path: the research dossiers’ expansion candidates (after-hours cross-dock work, auction-exit medical logistics, data-center decommissioning’s physical layer, small-count rack moves as a named segment, a transloading buyer desk, video fragments) appear nowhere in this file as services and enter only if the owner confirms the capability and the service is published first. Competitor records are benchmark observations and feed no company claim; the one competitor-namespace review record carries the owner’s market-knowledge statement typed as unverified, and no finding rests on it. The provenance certificate proves origin and integrity of this file only; it is not a citation input for any engine and is not represented as one.'),
    about: [{ '@id': SITE + '/#organization' }],
  },
];
shaDistributions(graph, FILE_URL);

// --- Consolidated Visibility Batch 2026-11-02: dataset enrichment ---
// datePublished (first publication per the file's deploy batch record),
// includedInDataCatalog (the datasets hub node is retyped DataCatalog in
// the same batch — parent decision D2), variableMeasured (measurement
// datasets only, per the enrichment table) and spatialCoverage
// strengthening (bare Place @id refs -> full Place objects with geo).
const ENRICH_PLACES = {
  'https://theflatratemovers.com/#winchester': { '@type': 'Place', '@id': 'https://theflatratemovers.com/#winchester', name: 'The Flat Rate Movers \u2014 Winchester', geo: { '@type': 'GeoCoordinates', latitude: 39.18711576, longitude: -78.1668352 } },
  'https://theflatratemovers.com/#martinsburg': { '@type': 'Place', '@id': 'https://theflatratemovers.com/#martinsburg', name: 'Flat Rate Movers Martinsburg WV', geo: { '@type': 'GeoCoordinates', latitude: 39.48319665, longitude: -77.94760443 } },
};
function enrichDatasetNodes(nodes, datePublished, variableMeasured, strengthenSC) {
  for (const n of nodes) {
    if (!n || typeof n !== 'object') continue;
    const types = Array.isArray(n['@type']) ? n['@type'] : [n['@type']];
    if (!types.includes('Dataset')) continue;
    n.datePublished = datePublished;
    n.includedInDataCatalog = { ...CATALOG };
    if (variableMeasured) n.variableMeasured = variableMeasured;
    if (strengthenSC && Array.isArray(n.spatialCoverage)) {
      n.spatialCoverage = n.spatialCoverage.map((p) => (p && ENRICH_PLACES[p['@id']] && Object.keys(p).length === 1) ? ENRICH_PLACES[p['@id']] : p);
    }
  }
}

enrichDatasetNodes(graph, '2026-10-31', ["citationObservations (ourCited, citedUrlsInOrder, answerStatementsAboutUs, engine, date)", "questions (panelState, fragmentBinding, moneyWeight)", "answerFragments (bodyChars, substantive, questionShaped)", "reviewDistributionSnapshots (displayedAverage, displayedCount, platform, branchRef)"], true);
const doc = { '@context': 'https://schema.org', '@graph': graph };
const bytes = JSON.stringify(doc) + '\n'; // compact emit (2026-11-07): pretty emit crossed the 25 MiB Pages per-file limit at 30,209 rows
if (CHECK) {
  const cur = fs.readFileSync(outPath, 'utf8');
  if (cur !== bytes) { console.error('CHECK FAIL: ' + outPath + ' differs from regeneration'); process.exit(1); }
  console.log('CHECK OK: datasets-answer-evidence.json regenerates byte-identical (' + bytes.length + ' bytes)');
} else {
  fs.writeFileSync(outPath, bytes);
  console.log('WROTE ' + outPath + ' (' + bytes.length + ' bytes)');
  console.log('totals: ' + JSON.stringify(totals));
}
