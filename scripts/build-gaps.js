// Flat Rate Machine — Phase 2, Gap Finder.
// Builds the prioritized gap queue from Phase 1 diffs + the planner
// matrix + questions extractable from the live site source.
// Deterministic v1: nothing is invented, nothing is applied. Dataset
// amendments are LISTED for owner approval, never edited in. Staged
// output only: out/gap-queue.json, out/gap-queue.md,
// out/questions.scaffold.json. Touches nothing else.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'out');
const LIVE_SOURCE = path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public', 'index.html');
const load = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const pages = load('data/pages.json').pages;
const metaDiff = load('out/meta.diff.json');
const metaGen = load('out/meta.generated.json');
const graphDiff = load('out/graph.diff.json');
const aiDiff = load('out/ai.diff.json');
const planner = load('out/planner-matrix.json');

const pageBySlug = Object.fromEntries(pages.map((p) => [p.slug, p]));
const metaBySlug = Object.fromEntries(metaGen.map((e) => [e.slug, e]));

// Same branch-inference rule as the planner (documented, not a claim).
function branchOfPage(p) {
  const hay = ((p.slug || '') + ' ' + (p.title || '')).toLowerCase();
  const w = hay.includes('winchester');
  const m = hay.includes('martinsburg');
  if (w && m) return 'both';
  if (w) return 'winchester';
  if (m) return 'martinsburg';
  return null;
}
function locationsFor(slugs) {
  const set = new Set();
  for (const slug of slugs) {
    const p = pageBySlug[slug];
    if (!p) continue;
    const b = branchOfPage(p);
    if (b === 'both') { set.add('winchester'); set.add('martinsburg'); }
    else if (b) set.add(b);
  }
  return [...set].sort();
}
function servicesFor(slugs) {
  const set = new Set();
  for (const slug of slugs) {
    const p = pageBySlug[slug];
    if (p) for (const s of p.services) set.add(s);
  }
  return [...set].sort();
}

// --- Question extraction from the live site source ---
// Method (reproducible, no invention): split the live index.html into
// page chunks at id="page-<slug>" markers; within each chunk, take
// h2/h3/h4 headings whose text ends with '?'. Dedupe by normalized text.
// Answers are NOT auto-paired from stripped HTML (unreliable); every
// scaffolded answer is null pending rubric-gate transcription.
function decodeEntities(t) {
  return t.replace(/&amp;/g, '&').replace(/&rsquo;|&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"');
}
function extractQuestions() {
  const html = fs.readFileSync(LIVE_SOURCE, 'utf8');
  const markers = [...html.matchAll(/id="page-([^"]+)"/g)].map((m) => ({ slug: m[1], pos: m.index }));
  const found = new Map(); // normalized -> {question, sourcePages[]}
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].pos;
    const end = i + 1 < markers.length ? markers[i + 1].pos : html.length;
    const chunk = html.slice(start, end);
    for (const m of chunk.matchAll(/<h[234][^>]*>([^<]*\?[^<]*)<\/h[234]>/g)) {
      const q = decodeEntities(m[1]).replace(/\s+/g, ' ').trim();
      if (!q.endsWith('?')) continue;
      const key = q.toLowerCase();
      if (!found.has(key)) found.set(key, { question: q, sourcePages: [] });
      if (!found.get(key).sourcePages.includes(markers[i].slug)) {
        found.get(key).sourcePages.push(markers[i].slug);
      }
    }
  }
  return [...found.values()];
}
function intentFor(q) {
  // Whole-word match only: substring matching misfires on 'crate' and
  // 'rated' (both contain 'rate' but are not price questions).
  if (/\b(price|flat|quote|cost|rate)\b/i.test(q)) return 'commercial';
  if (/\b(where|hours|serve|which base|find)\b/i.test(q)) return 'navigational';
  return 'informational';
}

const extracted = extractQuestions();
const questions = extracted.map((q, i) => ({
  id: 'q-' + String(i + 1).padStart(3, '0'),
  question: q.question,
  answer: null,
  intent: intentFor(q.question),
  service: servicesFor(q.sourcePages),
  locations: locationsFor(q.sourcePages),
  sourcePages: q.sourcePages,
  source: 'Live site source h2-h4 headings ending with ? (verbatim)',
  attested: '2026-10-28',
}));

const scaffold = {
  dataset: 'questions-scaffold',
  generated: new Date().toISOString().slice(0, 10),
  method: 'Headings (h2-h4) ending with ? extracted from the live site source, split into page chunks at id="page-<slug>" markers, deduplicated by normalized text. Verbatim only; no question was written, paraphrased, or inferred.',
  intentRule: 'Whole-word match: commercial if the question contains price/flat/quote/cost/rate as a whole word; else navigational if it contains where/hours/serve/which base/find as a whole word; else informational. (Whole words only: "crate" and "rated" must not match "rate".)',
  answerNote: 'Every answer is null. Answer text lives on the source pages and must be transcribed through the Phase 3 rubric gate; auto-pairing answers from stripped HTML is unreliable and was not attempted. A question with no answer on its source page stays null (a gap, not a draft).',
  count: questions.length,
  questions,
};

// --- Gap queue ---
const items = [];
const add = (item) => items.push({ status: 'open', ...item });

// (a) 34 generic-template pages (Phase 1 meta diff).
for (const slug of metaDiff.genericTemplatePages) {
  const meta = metaBySlug[slug] || {};
  const page = pageBySlug[slug] || {};
  add({
    id: 'gap-generic-' + slug,
    category: 'generic-template-page',
    priority: 'P2',
    slug,
    title: page.title || meta.title || slug,
    missing: 'Editorial meta description and page-specific content; the page currently carries only the generic company template.',
    currentTemplate: meta.description || null,
    fillsFrom: 'Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.',
    approval: 'owner-approval-per-batch',
    source: 'out/meta.diff.json genericTemplatePages + out/meta.generated.json',
  });
}

// (b) Corridor pages (planner outlines).
for (const row of planner.rows.filter((r) => r.kind === 'corridor' && r.action === 'plan-page')) {
  const missingSections = (row.outline || []).filter((s) => s.status === 'missing').map((s) => s.section);
  add({
    id: 'gap-corridor-' + row.corridor,
    category: 'corridor-page',
    priority: 'P1',
    corridor: row.corridor,
    corridorName: row.corridorName,
    proposedSlug: row.proposedSlug,
    title: row.corridorName + ' corridor page',
    missing: 'Dedicated corridor page does not exist. Outline sections flagged missing: ' + missingSections.join('; ') + '.',
    fillsFrom: 'Verified corridor + branch facts in the planner outline (out/planner-matrix.json); missing sections require owner input, flagged not filled.',
    approval: 'owner-approval-per-batch',
    source: 'data/corridors.json + out/planner-matrix.json',
    outlineSections: (row.outline || []).map((s) => ({ section: s.section, status: s.status })),
  });
}

// (e) Branch-specific service pages (summary pointers into the planner;
// rows themselves are NOT duplicated here).
const plannedRows = planner.rows.filter((r) => r.action === 'plan-page' && r.kind === 'service-branch');
for (const branch of ['martinsburg', 'winchester']) {
  const rows = plannedRows.filter((r) => r.branch === branch);
  if (!rows.length) continue;
  add({
    id: 'gap-branch-pages-' + branch,
    category: 'branch-specific-page',
    priority: branch === 'martinsburg' ? 'P1' : 'P2',
    branch,
    count: rows.length,
    title: `${rows.length} planned branch-specific service pages for ${branch === 'martinsburg' ? 'Martinsburg' : 'Winchester'}`,
    missing: `No branch-specific page exists for ${rows.length} service × ${branch} combinations (company-wide service pages exist, but no page speaks to this branch). Winchester has 29 branch-tagged pages vs Martinsburg 3 — the imbalance is systematic.`,
    fillsFrom: 'Planner matrix rows (out/planner-matrix.json): service + branch facts already in data/. No new fact is needed to plan these; content goes through the Phase 3 rubric gate.',
    approval: 'owner-approval-per-batch',
    source: 'out/planner-matrix.json',
    plannedSlugs: rows.map((r) => r.proposedSlug).filter(Boolean),
  });
}

// (c) Dataset amendment batch — consolidated from graph.diff (12) and
// ai.diff (13) gaps, deduplicated by field. LISTED, NOT APPLIED.
const amendments = [
  {
    id: 'amend-company-email',
    field: 'Company contact email (locations.json company record)',
    missing: 'No email field exists in any Phase 0 dataset, so generators omit it from graphs, llms.txt, and ai-sitemap creator blocks.',
    fillsFrom: 'Owner attestation in the amendment batch. The address used on the live site is NOT copied in silently; the batch must attest it with source + date.',
    approval: 'owner-facts',
    fromDiffs: ['graph.diff gaps: Organization.email', 'ai.diff gaps: creator.email / llms social+email'],
  },
  {
    id: 'amend-sameas',
    field: 'Organization.sameAs social profile URLs',
    missing: 'Social URLs are in no Phase 0 dataset, so generators omit sameAs from graphs and llms.txt.',
    fillsFrom: 'Owner-confirmed social profile URLs, attested in the amendment batch. Handles are NOT copied in from memory or old files.',
    approval: 'owner-facts',
    fromDiffs: ['graph.diff gaps: Organization.sameAs', 'ai.diff gaps: creator.sameAs / llms social+email'],
  },
  {
    id: 'amend-pricerange',
    field: 'Organization.priceRange',
    missing: 'No priceRange field exists in any Phase 0 dataset, so generators omit it from graphs.',
    fillsFrom: 'Owner-confirmed price range, attested in the amendment batch. No value is asserted here.',
    approval: 'owner-facts',
    fromDiffs: ['graph.diff gaps: Organization.priceRange'],
  },
  {
    id: 'amend-service-page-mapping',
    field: 'Service → canonical page mapping',
    missing: 'Pages reference services, but services carry no canonical page, so llms.txt and ai-sitemap service lists carry names + descriptions without links.',
    fillsFrom: 'Planner matrix existing pages per service + owner choice of one canonical page per service. The choice is editorial, not derivable — it must be decided, not auto-picked.',
    approval: 'owner-decision',
    fromDiffs: ['ai.diff gaps: llms.txt service page links'],
  },
  {
    id: 'amend-questions-bank',
    field: 'Questions bank (questions.json)',
    missing: 'No populated questions dataset exists, so ARD representativeQueries and llms FAQ content cannot be generated.',
    fillsFrom: 'out/questions.scaffold.json (17 extracted questions) + pending source pulls (GSC, GBP, quote inquiries — see pending-source-pull items) + rubric-gate transcription of answers.',
    approval: 'owner-facts',
    fromDiffs: ['ai.diff gaps: ARD representativeQueries', 'DATA_MODEL questions schema-only'],
  },
  {
    id: 'amend-media-inventory',
    field: 'Media inventory (logo + image filenames, captions, credits, face-blur flags)',
    missing: 'Media is schema-only in Phase 0, so ARD logoUrl and graph logo/image are omitted.',
    fillsFrom: 'Live site source asset list (filenames, captions, credits) inventoried in Phase 4 + owner confirmation of company-work vs style-example and face-blur flags.',
    approval: 'owner-approval-per-batch',
    fromDiffs: ['graph.diff gaps: knowsAbout/logo/image', 'ai.diff gaps: ARD host.logoUrl'],
  },
  {
    id: 'amend-changelog-stats',
    field: 'Changelog / statistics dataset',
    missing: 'No changelog or statistics dataset exists, so llms.txt dated update narratives and GSC statistics cannot be generated (or a decision to drop dated narratives from llms.txt is needed).',
    fillsFrom: 'Owner notes + GSC exports (pending source pull). If the owner prefers no dated narratives, this item closes by decision instead of data.',
    approval: 'owner-facts',
    fromDiffs: ['ai.diff gaps: llms.txt dated update narratives'],
  },
];
for (const a of amendments) {
  add({
    id: a.id,
    category: 'dataset-amendment',
    priority: 'P2',
    field: a.field,
    title: 'Dataset amendment: ' + a.field,
    missing: a.missing,
    fillsFrom: a.fillsFrom,
    approval: a.approval,
    source: a.fromDiffs.join('; '),
  });
}

// Decisions (not data gaps).
add({
  id: 'decision-company-hours',
  category: 'decision',
  priority: 'P3',
  field: 'Company-level hours policy',
  title: 'Decision: company-level hours in ai-sitemap creator block',
  missing: 'Live ai-sitemap uses Winchester hours as company hours. Reproducing it would bake in a branch blend, so the generator omits company-level hours.',
  fillsFrom: 'No dataset fact fills this — it is a policy choice. Recommendation: omit company-level hours (branches differ); publish hours per branch only.',
  approval: 'owner-decision',
  source: 'out/ai.diff.json gaps: creator.openingHours',
});
add({
  id: 'decision-atid-migration',
  category: 'decision',
  priority: 'P3',
  field: '@id migration (legacy aliases vs cutover)',
  title: 'Decision: @id migration if the generated graph ever replaces entity-graph.json',
  missing: 'Generated graph changes branch @ids (#winchester-place → #winchester) and service @ids (page-slug → #service-* fragments). Publishing without a decision breaks existing @id references.',
  fillsFrom: 'No dataset fact fills this — it is a migration choice: keep legacy @ids as aliases, or cut over. Must be decided before anything publishes.',
  approval: 'owner-decision',
  source: 'out/phase1-report.md item 4',
});

// (d) Question transcription + pending source pulls.
add({
  id: 'gap-question-transcription',
  category: 'question-transcription',
  priority: 'P3',
  count: questions.length,
  title: `Transcribe verified answers for ${questions.length} scaffolded questions`,
  missing: `All ${questions.length} scaffolded questions have answer null. Answer text lives on their source pages but was not auto-paired from stripped HTML (unreliable).`,
  fillsFrom: 'Answer text on the source pages, transcribed through the Phase 3 rubric gate. A question with no answer on its source page stays null — a gap, not a draft.',
  approval: 'owner-approval-per-batch',
  source: 'out/questions.scaffold.json',
  questionIds: questions.map((q) => q.id),
});
const pulls = [
  {
    id: 'pull-gsc-queries',
    sourceName: 'Google Search Console queries',
    step: 'In Google Search Console, property sc-domain:theflatratemovers.com, open Performance → Search results, set the date range, and export Queries. Filter to question-like queries (what / how / why / when / where / can / do). Add each query verbatim with source "GSC query" + export date. Requires a live browser session signed in as ratemovers@gmail.com; no GSC connector exists, and a generic subagent cannot perform this pull.',
  },
  {
    id: 'pull-gbp-queries',
    sourceName: 'Google Business Profile queries',
    step: 'In the Google Business Profile manager, open each branch profile (Winchester: The Flat Rate Movers; Martinsburg: Flat Rate Movers Martinsburg WV) and export the search-terms / queries report. Add each term verbatim with source "GBP query" + branch + export date. Requires a live browser session signed in as ratemovers@gmail.com.',
  },
  {
    id: 'pull-quote-inquiries',
    sourceName: 'Quote-form inquiry questions',
    step: 'In Gmail (ratemovers@gmail.com), review quote-form inquiry emails for question phrasing from real clients. Add each question verbatim with source "quote inquiry" + message date. No query text is pre-filled here — every entry must come from a real message.',
  },
];
for (const p of pulls) {
  add({
    id: p.id,
    category: 'pending-source-pull',
    priority: 'P3',
    title: 'Pending source pull: ' + p.sourceName,
    missing: 'Real user questions from ' + p.sourceName + ' (count unknown until pulled). Zero queries are fabricated here.',
    fillsFrom: p.step,
    approval: 'owner-facts',
    source: 'DATA_MODEL.md questions sources (Phase 2 order: GSC, quote inquiries, GBP, then FAQ pages)',
  });
}

const byPriority = {};
const byCategory = {};
for (const it of items) {
  byPriority[it.priority] = (byPriority[it.priority] || 0) + 1;
  byCategory[it.category] = (byCategory[it.category] || 0) + 1;
}
const queue = {
  dataset: 'gap-queue',
  generated: new Date().toISOString().slice(0, 10),
  source: 'out/meta.diff.json + out/graph.diff.json + out/ai.diff.json + out/planner-matrix.json + live site source (questions)',
  attested: '2026-10-28',
  rule: 'Nothing in this queue auto-publishes. Planned pages go through the Phase 3 rubric gate with owner approval per batch. Dataset amendments are listed for one owner-approval batch and are NOT applied here. A missing fact is flagged, never filled.',
  approvalKey: {
    'owner-approval-per-batch': 'Phase 3 builds the item through the rubric gate; Henry approves the batch before anything publishes.',
    'owner-facts': 'Henry must supply or attest the fact (or the export/access for a pull).',
    'owner-decision': 'Henry decides the policy or choice; no data fills it.',
    'none': 'No action needed (live rows only; not queued).',
  },
  totals: { total: items.length, byPriority, byCategory },
  items,
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'gap-queue.json'), JSON.stringify(queue, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'questions.scaffold.json'), JSON.stringify(scaffold, null, 2) + '\n');

// --- Readable markdown rendering ---
const byP = (p) => items.filter((i) => i.priority === p);
let md = `# Flat Rate Machine — Gap Queue (Phase 2)\n\n`;
md += `**Rule: nothing here auto-publishes.** Planned pages go through the Phase 3 rubric gate with owner approval per batch. Dataset amendments are listed for one owner-approval batch and are NOT applied here. A missing fact is flagged, never filled.\n\n`;
md += `## Totals\n\n- Total open items: **${items.length}**\n`;
for (const p of ['P1', 'P2', 'P3']) md += `- ${p}: ${byPriority[p] || 0}\n`;
md += `\nBy category:\n`;
for (const [c, n] of Object.entries(byCategory)) md += `- ${c}: ${n}\n`;
md += `\n`;
for (const p of ['P1', 'P2', 'P3']) {
  const list = byP(p);
  if (!list.length) continue;
  md += `## ${p} (${list.length})\n\n`;
  for (const it of list) {
    md += `### ${it.title}\n\n- **ID:** ${it.id} · **Category:** ${it.category} · **Approval:** ${it.approval}\n`;
    if (it.slug) md += `- **Page:** ${it.slug}\n`;
    if (it.corridor) md += `- **Corridor:** ${it.corridorName} · **Proposed slug:** ${it.proposedSlug}\n`;
    if (it.field) md += `- **Field:** ${it.field}\n`;
    if (it.count !== undefined) md += `- **Count:** ${it.count}\n`;
    if (it.currentTemplate) md += `- **Current template:** ${it.currentTemplate}\n`;
    if (it.plannedSlugs) md += `- **Planned slugs:** ${it.plannedSlugs.join(', ') || '(editorial slugs needed — candidates collided)'}\n`;
    if (it.outlineSections) md += `- **Outline sections:** ${it.outlineSections.map((s) => `${s.section} (${s.status})`).join('; ')}\n`;
    if (it.questionIds) md += `- **Questions:** ${it.questionIds.join(', ')}\n`;
    md += `- **Missing:** ${it.missing}\n- **Fills from:** ${it.fillsFrom}\n- **Source:** ${it.source}\n\n`;
  }
}
md += `## Appendix A — Method notes\n\n`;
md += `- **Branch inference (planner + questions):** a registry page counts as branch-specific when its slug or title contains 'winchester' or 'martinsburg' (both when both appear); otherwise company-wide. A planning heuristic, documented here, not a published claim.\n`;
md += `- **Question extraction:** h2–h4 headings ending with '?' in the live site source, split into page chunks at id="page-<slug>" markers, deduplicated by normalized text. ${questions.length} unique questions from 18 headings (one duplicate across two pages). Verbatim only.\n`;
md += `- **Question intent rule:** commercial if the question mentions price/flat/quote/cost/rate; else navigational if it mentions where/hours/serve/which base/find; else informational.\n`;
md += `- **Answers:** every scaffolded answer is null. Answer text lives on the source pages and must be transcribed through the Phase 3 rubric gate; auto-pairing from stripped HTML was not attempted. A question with no answer on its source page stays null.\n`;
md += `- **Corridor outlines:** sections carry verified content with a source, or content null with a missing note. Route paths, exits, stops, and corridor-specific audiences are NOT in any dataset and are flagged missing, never filled from general knowledge. Branch service areas in outlines are branch facts, not claims that a listed town sits on a given corridor.\n`;
md += `\n## Appendix B — Phase 1 diff items deliberately NOT queued as data gaps\n\n`;
md += `- WebSite / WebPage / BreadcrumbList nodes → Phase 3 page builder, not entity data.\n`;
md += `- Standalone PostalAddress nodes → resolved: branch addresses are inline on LocalBusiness nodes (one copy, not two).\n`;
md += `- Service @id pattern (page-slug vs #service-* fragments) → resolved: #service-* fragments from services.json are canonical.\n`;
md += `- Service description wording → resolved: services.json (head-graph) descriptions are dataset truth.\n`;
md += `- Dataset wrapper (attestations, chain, rubric, version) → provenance lives in the diff files and DATA_MODEL.md, not inside JSON-LD.\n`;
md += `- ai-sitemap merged areaServed list → MUST NOT be reproduced: merging branches violates the branch rule. Per-branch areas live in locations.json and the GeoJSON.\n`;
md += `- ai-sitemap mainEntity (sitemap_index.xml) → MUST NOT be reproduced: stale WordPress-era artifact, not the current sitemap.xml.\n`;
md += `- ai-sitemap url / version conventions → recorded conventions (site root vs file URL; version stamp date), not data gaps.\n`;
md += `- ARD descriptions / tags prose → editorial content for the Phase 3 gate, not a dataset gap.\n`;
md += `\n## Appendix C — Pending source pulls (full steps)\n\n`;
for (const p of pulls) md += `### ${p.sourceName}\n\n${p.step}\n\n`;
fs.writeFileSync(path.join(OUT, 'gap-queue.md'), md);

console.log(`gap-queue.json: ${items.length} items`);
console.log('byPriority:', JSON.stringify(byPriority));
console.log('byCategory:', JSON.stringify(byCategory));
console.log(`questions.scaffold.json: ${questions.length} questions`);
for (const q of questions) console.log(`  ${q.id} [${q.intent}] ${q.question} <- ${q.sourcePages.join(', ')}`);
