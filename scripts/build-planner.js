// Flat Rate Machine — Phase 2, Planner.
// Builds the service × location × intent matrix from data/ only.
// Deterministic v1: no AI drafting, no invented facts. Planned rows are
// proposals (status planned/gap), never published claims. Staged output
// only: writes out/planner-matrix.json, touches nothing else.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'out');
const load = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const locations = load('data/locations.json');
const services = load('data/services.json').services;
const pages = load('data/pages.json').pages;
const corridors = load('data/corridors.json').corridors;

const BRANCHES = locations.branches.map((b) => ({
  id: b.id,
  name: b.name,
  city: b.id === 'winchester' ? 'Winchester' : 'Martinsburg',
  citySlug: b.id === 'winchester' ? 'winchester-va' : 'martinsburg-wv',
  state: b.id === 'winchester' ? 'VA' : 'WV',
}));
const branchById = Object.fromEntries(BRANCHES.map((b) => [b.id, b]));
const registrySlugs = new Set(pages.map((p) => p.slug));

// Branch inference from a registry page's slug + title. 'both' when both
// branch cities appear; null when neither does (company-wide page).
function branchOfPage(p) {
  const hay = ((p.slug || '') + ' ' + (p.title || '')).toLowerCase();
  const w = hay.includes('winchester');
  const m = hay.includes('martinsburg');
  if (w && m) return 'both';
  if (w) return 'winchester';
  if (m) return 'martinsburg';
  return null;
}

// Branch location pages (type 'location' in the registry), one per branch.
const locationPages = {};
for (const p of pages) {
  if (p.type !== 'location') continue;
  const b = branchOfPage(p);
  if (b && b !== 'both' && !locationPages[b]) locationPages[b] = p.slug;
}

// Intent mapping from existing registry page types (documented rule).
const INTENT_BY_TYPE = {
  home: 'navigational',
  location: 'navigational',
  corridor: 'informational',
  service: 'commercial',
  page: 'informational',
};

function serviceQuestions(service, branch) {
  return [
    `What does ${service.name} include?`,
    `Who is ${service.name} for?`,
    `Where does the ${branch.city} branch serve ${service.name}?`,
    `How do I get a flat-rate quote for ${service.name}?`,
    `What are the ${branch.city} branch hours?`,
  ];
}

const rows = [];

// --- Service x branch rows (18 services x 2 branches) ---
for (const service of services) {
  for (const branch of BRANCHES) {
    if (service.id === 'service-route81') {
      // Corridor service: branch coverage is tracked in corridor rows,
      // not as branch-specific service pages. Never plan a bogus page.
      rows.push({
        kind: 'service-branch',
        service: service.id,
        serviceName: service.name,
        branch: branch.id,
        branchName: branch.name,
        intent: 'commercial',
        status: 'corridor-service',
        action: 'none',
        existingBranchPages: [],
        existingCompanyPages: pages
          .filter((p) => p.services.includes(service.id) && branchOfPage(p) === null)
          .map((p) => p.slug),
        proposedSlug: null,
        slugNote: 'route81 is a corridor service; see corridor rows, not branch pages.',
        requiredQuestions: serviceQuestions(service, branch),
        internalLinks: ['home', locationPages[branch.id]].filter(Boolean),
        priority: null,
        approval: 'none',
        source: 'data/services.json + data/pages.json + data/locations.json',
        attested: '2026-10-28',
      });
      continue;
    }
    const branchPages = pages
      .filter((p) => p.services.includes(service.id) && (branchOfPage(p) === branch.id || branchOfPage(p) === 'both'))
      .map((p) => p.slug);
    const companyPages = pages
      .filter((p) => p.services.includes(service.id) && branchOfPage(p) === null)
      .map((p) => p.slug);
    const isLiveBranch = branchPages.length > 0;
    const base = service.id.replace(/^service-/, '');
    const candidate = `${base}-movers-${branch.citySlug}`;
    const proposedSlug = isLiveBranch ? null : (registrySlugs.has(candidate) ? null : candidate);
    const slugNote = isLiveBranch
      ? 'Branch-specific page already live; no page proposed.'
      : (proposedSlug ? 'Proposed slug follows the live branch-page pattern (<service>-movers-<city>-<state>); Phase 3 confirms it through the rubric gate.'
        : 'Candidate slug collides with a live slug; Phase 3 must pick an editorial slug.');
    rows.push({
      kind: 'service-branch',
      service: service.id,
      serviceName: service.name,
      branch: branch.id,
      branchName: branch.name,
      intent: 'commercial',
      status: isLiveBranch ? 'live-branch' : 'gap-branch-page',
      action: isLiveBranch ? 'none' : 'plan-page',
      existingBranchPages: branchPages,
      existingCompanyPages: companyPages,
      proposedSlug,
      slugNote,
      requiredQuestions: serviceQuestions(service, branch),
      internalLinks: ['home', locationPages[branch.id]].filter(Boolean),
      priority: isLiveBranch ? null : (branch.id === 'martinsburg' ? 'P1' : 'P2'),
      approval: isLiveBranch ? 'none' : 'owner-approval-per-batch',
      source: 'data/services.json + data/pages.json + data/locations.json',
      attested: '2026-10-28',
    });
  }
}

// --- Corridor rows with full outlines (verified facts only) ---
const corridorOutlines = {
  'i-66': {
    proposedSlug: 'interstate-66-corridor',
    sections: [
      {
        section: 'What it includes',
        status: 'verified',
        content: 'Local and regional moves along the I-81, I-66 and I-70 corridors (service-local-regional description, head graph); flat-rate long-distance moving from Winchester, VA and Martinsburg, WV (service-long-distance description); I-81, I-66 & I-70 dispatch from Winchester and Martinsburg (live Route 81 page card).',
        source: 'data/services.json + live site source (Route 81 page)',
      },
      {
        section: 'Who it is for',
        status: 'missing',
        content: null,
        missingNote: 'No verified I-66-specific audience fact exists in any dataset. Do not infer an audience from the Winchester service area. Owner input required.',
        source: null,
      },
      {
        section: 'Where we serve',
        status: 'verified',
        content: 'Winchester home base: 116 W Piccadilly St, Suite 11 — at the I-81 × I-66 junction (live site, Winchester card). Branch service areas as published: Winchester 16 areas, Martinsburg 14 areas (data/locations.json). These are branch areas, NOT a claim that any listed town sits on I-66.',
        source: 'data/locations.json + live site source (Winchester card)',
      },
      {
        section: 'Route description (path, exits, stops)',
        status: 'missing',
        content: null,
        missingNote: 'No verified description of the I-66 route path, exits, or stops exists in any dataset. Owner input required; never fill from general geographic knowledge.',
        source: null,
      },
      {
        section: 'Questions, answered',
        status: 'verified',
        content: 'Required questions (templates from the full-format page structure): What is the Interstate 66 corridor service? Which branch serves moves on Interstate 66? Where does the Winchester branch serve? How do I get a flat-rate quote for a corridor move?',
        source: 'Full-format page structure (What it includes / Who it is for / Where we serve / Questions, answered)',
      },
      {
        section: 'Quote',
        status: 'verified',
        content: 'Standard quote card: Get My Flat Rate Quote, Short / Detailed toggle preserving From, To and What is moving.',
        source: 'Live quote form (site-wide)',
      },
    ],
  },
  'i-70': {
    proposedSlug: 'interstate-70-corridor',
    sections: [
      {
        section: 'What it includes',
        status: 'verified',
        content: 'Local and regional moves along the I-81, I-66 and I-70 corridors (service-local-regional description, head graph); flat-rate long-distance moving from Winchester, VA and Martinsburg, WV (service-long-distance description); I-81, I-66 & I-70 dispatch from Winchester and Martinsburg (live Route 81 page card).',
        source: 'data/services.json + live site source (Route 81 page)',
      },
      {
        section: 'Who it is for',
        status: 'missing',
        content: null,
        missingNote: 'No verified I-70-specific audience fact exists in any dataset. Do not infer an audience from the Martinsburg service area. Owner input required.',
        source: null,
      },
      {
        section: 'Where we serve',
        status: 'verified',
        content: 'Martinsburg hub is tagged "Eastern Panhandle base · I-81 × I-70 side" in the live Route 81 stops data (quoted as published copy, not a geographic claim). Branch service areas as published: Winchester 16 areas, Martinsburg 14 areas (data/locations.json). These are branch areas, NOT a claim that any listed town sits on I-70.',
        source: 'data/locations.json + live site source (Route 81 stops data)',
      },
      {
        section: 'Route description (path, exits, stops)',
        status: 'missing',
        content: null,
        missingNote: 'No verified description of the I-70 route path, exits, or stops exists in any dataset. Owner input required; never fill from general geographic knowledge.',
        source: null,
      },
      {
        section: 'Questions, answered',
        status: 'verified',
        content: 'Required questions (templates from the full-format page structure): What is the Interstate 70 corridor service? Which branch serves moves on Interstate 70? Where does the Martinsburg branch serve? How do I get a flat-rate quote for a corridor move?',
        source: 'Full-format page structure (What it includes / Who it is for / Where we serve / Questions, answered)',
      },
      {
        section: 'Quote',
        status: 'verified',
        content: 'Standard quote card: Get My Flat Rate Quote, Short / Detailed toggle preserving From, To and What is moving.',
        source: 'Live quote form (site-wide)',
      },
    ],
  },
};

for (const corridor of corridors) {
  if (corridor.id === 'i-81') {
    rows.push({
      kind: 'corridor',
      corridor: corridor.id,
      corridorName: corridor.name,
      intent: 'informational',
      status: 'live',
      action: 'none',
      existingPage: corridor.page,
      proposedSlug: null,
      outline: null,
      requiredQuestions: [],
      internalLinks: ['home', locationPages.winchester, locationPages.martinsburg].filter(Boolean),
      priority: null,
      approval: 'none',
      source: corridor.source,
      attested: corridor.attested,
    });
    continue;
  }
  const outline = corridorOutlines[corridor.id];
  rows.push({
    kind: 'corridor',
    corridor: corridor.id,
    corridorName: corridor.name,
    intent: 'informational',
    status: 'gap-corridor-page',
    action: 'plan-page',
    existingPage: null,
    proposedSlug: outline.proposedSlug,
    outline: outline.sections,
    requiredQuestions: [
      `What is the ${corridor.name} corridor service?`,
      `Which branch serves moves on ${corridor.name}?`,
      'How do I get a flat-rate quote for a corridor move?',
    ],
    internalLinks: ['home', locationPages.winchester, locationPages.martinsburg].filter(Boolean),
    priority: 'P1',
    approval: 'owner-approval-per-batch',
    source: corridor.source,
    attested: corridor.attested,
  });
}

const byStatus = {};
const byPriority = {};
for (const r of rows) {
  byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  if (r.priority) byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
}
const planned = rows.filter((r) => r.action === 'plan-page');

const matrix = {
  dataset: 'planner-matrix',
  generated: new Date().toISOString().slice(0, 10),
  source: 'data/locations.json + data/services.json + data/pages.json + data/corridors.json + live site source (corridor facts only)',
  attested: '2026-10-28',
  method: {
    branchInference: "A registry page counts as branch-specific when its slug or title contains 'winchester' or 'martinsburg' (both when both appear); otherwise it is company-wide. This is a planning heuristic, documented here, not a published claim.",
    intentRule: 'Intent follows the existing registry page type: service -> commercial, location/home -> navigational, corridor/page -> informational.',
    requiredQuestionsRule: 'Required questions are templates from the site\'s own full-format page structure (What it includes / Who it is for / Where we serve / Questions, answered + quote). They are questions a page must answer, not answers and not claims.',
    proposedSlugRule: 'Proposed slugs follow the live branch-page pattern <service>-movers-<city>-<state>; a colliding candidate yields proposedSlug null and an editorial-slug note.',
    corridorOutlineRule: 'Outline sections carry verified content with a source, or content null with a missingNote. Nothing is filled from general knowledge.',
    approvalRule: 'Planned pages need owner approval per batch (Phase 3 rubric gate). Live rows need no action.',
  },
  summary: {
    totalRows: rows.length,
    byStatus,
    byPriority,
    plannedPages: planned.length,
    plannedByBranch: {
      martinsburg: planned.filter((r) => r.branch === 'martinsburg').length,
      winchester: planned.filter((r) => r.branch === 'winchester').length,
      corridor: planned.filter((r) => r.kind === 'corridor').length,
    },
  },
  locationPages,
  rows,
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'planner-matrix.json'), JSON.stringify(matrix, null, 2) + '\n');
console.log(`planner-matrix.json: ${rows.length} rows, ${planned.length} planned pages`);
console.log('byStatus:', JSON.stringify(byStatus));
console.log('planned by branch:', JSON.stringify(matrix.summary.plannedByBranch));
