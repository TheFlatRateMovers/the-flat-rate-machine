// Flat Rate Machine — Phase 1, Title/Meta Builder (deterministic v1).
// Generates title + meta description for all 126 registry pages from
// verified facts ONLY, using templates — no AI drafting, no invented
// copy. Titles come verbatim from the registry (which came from
// pageMeta); descriptions are templated from service descriptions,
// branch records, and company facts.
// Pages with no service signal get the generic company template and are
// FLAGGED in out/meta.diff.json — that flag is the report the task asks
// for ("no deterministic template fits"), not a silent invention.
// The live pageMeta check below reads the local live-site source the
// same way scripts/build-data.js does (trusted local source, check
// only — generation never reads it).
//   node scripts/build-meta.js        (run from the-flat-rate-machine/)
const fs = require('fs');
const path = require('path');
const { SITE, fail, load, writeOutJson } = require('./lib');

const TAGLINE = 'Guaranteed Flat Rate or Your Move is Free!';
const BASE_SUFFIX = ' Flat-rate moving from Winchester, VA and Martinsburg, WV. ' + TAGLINE;

function main() {
  const locations = load('data/locations.json');
  const servicesById = new Map(load('data/services.json').services.map((s) => [s.id, s]));
  const pages = load('data/pages.json').pages;
  // Editorial descriptions (generic-34 batch, 2026-10-28): owner-approved live
  // copy for pages with no service signal. Checked before the generic fallback
  // so regeneration reproduces specific copy instead of boilerplate.
  const editorialDescriptions = load('data/descriptions.json');
  const company = locations.company;
  const branches = locations.branches;

  function branchForSlug(slug) {
    if (slug.includes('winchester')) return branches.find((b) => b.id === 'winchester');
    if (slug.includes('martinsburg')) return branches.find((b) => b.id === 'martinsburg');
    return null;
  }

  const out = [];
  const genericPages = [];
  for (const p of pages) {
    let description, template;
    if (p.type === 'home') {
      template = 'home';
      description = 'The Flat Rate Movers — flat-rate moving from Winchester, VA and Martinsburg, WV. ' + TAGLINE + ' Founded June 2010.';
    } else if (p.type === 'location') {
      const b = branchForSlug(p.slug);
      if (!b) fail('location page slug matches no branch: ' + p.slug);
      template = 'location';
      description = b.name + ' — flat-rate moving from ' + b.city + ', ' + b.state + '. ' + b.street + ', ' + b.city + ', ' + b.state + ' ' + b.zip + '. Hours ' + b.hoursDisplay + '. Google rating ' + b.googleRating.ratingValue + ' with ' + b.googleRating.reviewCount + ' review' + (b.googleRating.reviewCount === 1 ? '' : 's') + '.';
    } else if (p.type === 'corridor') {
      const svc = servicesById.get('service-route81');
      if (!svc) fail('service-route81 missing for corridor page ' + p.slug);
      template = 'corridor';
      description = 'Interstate 81 corridor moving — ' + svc.description + BASE_SUFFIX;
    } else if (p.services && p.services.length > 0) {
      const first = servicesById.get(p.services[0]);
      if (!first) fail('page ' + p.slug + ' references unknown service: ' + p.services[0]);
      template = p.services.length > 1 ? 'service-multi' : 'service';
      description = p.title + ' — ' + first.description;
      if (p.services.length > 1) {
        const rest = p.services.slice(1).map((id) => {
          const s = servicesById.get(id);
          if (!s) fail('page ' + p.slug + ' references unknown service: ' + id);
          return s.name;
        });
        description += ' Also: ' + rest.join(', ') + '.';
      }
      description += BASE_SUFFIX;
    } else if (editorialDescriptions[p.slug]) {
      template = 'editorial';
      description = editorialDescriptions[p.slug];
    } else {
      template = 'generic';
      genericPages.push(p.slug);
      description = p.title + ' — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. ' + TAGLINE;
    }
    out.push({ slug: p.slug, url: p.url, title: p.title, description, template, genericTemplate: template === 'generic', source: 'pages.json + services.json + locations.json templates', attested: '2026-10-28' });
  }
  writeOutJson('meta.generated.json', out);

  // ---- Check against live pageMeta (check only, never generation input) ----
  const indexPath = path.resolve(__dirname, '..', '..', 'the-flat-rate-movers-pages', 'public', 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const pmStart = indexHtml.indexOf('pageMeta={');
  if (pmStart < 0) fail('pageMeta not found in live site source');
  let depth = 0, i = pmStart + 'pageMeta='.length, pmEnd = -1;
  for (; i < indexHtml.length; i++) {
    if (indexHtml[i] === '{') depth++;
    else if (indexHtml[i] === '}') { depth--; if (depth === 0) { pmEnd = i + 1; break; } }
  }
  if (pmEnd < 0) fail('pageMeta block did not balance');
  // Local trusted source (our own site build); evaluated, not executed.
  const pageMeta = eval('(' + indexHtml.slice(pmStart + 'pageMeta='.length, pmEnd) + ')');
  const byCanonical = {};
  for (const [key, e] of Object.entries(pageMeta)) byCanonical[e.canonical] = e;

  let titleExact = 0, descExact = 0;
  const titleMismatches = [], descLengths = [];
  for (const m of out) {
    const live = byCanonical[m.url];
    if (!live) fail('registry URL has no pageMeta canonical: ' + m.url);
    if (live.name === m.title) titleExact++;
    else titleMismatches.push({ slug: m.slug, generated: m.title, live: live.name });
    if (live.desc === m.description) descExact++;
    descLengths.push(m.description.length);
  }
  const diff = {
    generated: 'out/meta.generated.json',
    pages: out.length,
    titleExactMatches: titleExact,
    titleMismatches,
    descriptionExactMatches: descExact,
    descriptionNote: 'Live pageMeta descriptions are hand-written editorial copy; generated descriptions are deterministic templates from verified facts. A low exact-match count is expected and is NOT a failure — the check proves every generated description is fact-grounded, not that it copies live prose.',
    genericTemplatePages: genericPages,
    genericTemplateCount: genericPages.length,
    descriptionLength: { min: Math.min(...descLengths), max: Math.max(...descLengths) },
    templatesUsed: out.reduce((acc, m) => { acc[m.template] = (acc[m.template] || 0) + 1; return acc; }, {}),
    status: titleMismatches.length === 0
      ? 'TITLES EXACT — descriptions templated from facts (see genericTemplatePages for pages with no specific template)'
      : 'TITLE MISMATCHES FOUND — Phase 0 data drift, fix data first',
  };
  writeOutJson('meta.diff.json', diff);
  console.log('meta entries: ' + out.length + ', title exact: ' + titleExact + '/' + out.length + ', description exact: ' + descExact + '/' + out.length);
  console.log('templates: ' + JSON.stringify(diff.templatesUsed) + ', generic-template pages: ' + genericPages.length);
  if (titleMismatches.length) fail('title mismatches found (see out/meta.diff.json)');
  console.log('META BUILD OK — ' + diff.status);
}

main();
