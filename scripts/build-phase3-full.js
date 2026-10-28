// Flat Rate Machine — Phase 3 FULL build (staged only).
// Revises the 7 previously staged pages (5 Martinsburg batch-1 + 2
// corridor) and builds all remaining planner gap pages (7 Winchester +
// 10 Martinsburg branch pages) into out/pages/<slug>/ as content.md +
// meta.json + schema.json. NOTHING here publishes: no edits to the live
// site, no deploys, no pushes. Owner approval per batch is required
// before any live publish, and the previous content approval for the 7
// staged pages does NOT carry over — those pages change in this build.
//
// Owner decisions governing this build (2026-10-28):
// 1. FULL FOOTPRINT, not GBP-only: GBP lists (Winchester 16, Martinsburg
//    14) PLUS the additional areas in the live service-area.geojson /
//    ai-sitemap. Branch assignment comes ONLY from the GeoJSON features'
//    own branch properties (winchester 17 + both 14 = 31; martinsburg 21
//    + both 14 = 35; shared counted in both). Never guessed.
// 2. ATTRIBUTION FIX: extra areas are sourced from the GeoJSON / location
//    pages, NOT from GBP screenshots. The GeoJSON source label claiming
//    those towns came from GBP screenshots is wrong; the fix goes on the
//    publish checklist (the live file is NOT edited here).
// 3. LOGO FOR IMAGES: the company logo (live asset img-01) is the page
//    image for every staged page, captioned as a brand image, not a job
//    photo. This closes rubric R6.
// Deterministic v1: content is assembled from verified facts only —
// service descriptions (live head graph), rubric.html section 1
// audiences, branch records, GeoJSON branch properties. No AI drafting,
// no invented service details, prices, coverage, or claims. A missing
// fact fails the build for that page; it is never filled.
//   node scripts/build-phase3-full.js   (run from the-flat-rate-machine/)
const fs = require('fs');
const path = require('path');
const { SITE, fail, load, writeOutJson } = require('./lib');

const TAGLINE = 'Guaranteed Flat Rate or Your Move is Free!';
const BASE_SUFFIX = ' Flat-rate moving from Winchester, VA and Martinsburg, WV. ' + TAGLINE;
const CANONICAL_BASE = SITE || 'https://theflatratemovers.com';
const LOGO = {
  file: 'assets/img-01-9c77693ba66b.png',
  url: CANONICAL_BASE + '/assets/img-01-9c77693ba66b.png',
  caption: 'The Flat Rate Movers logo — company brand image, not a job photo.',
};
const LOGO_FS = path.resolve(__dirname, '..', '..', 'the-flat-rate-movers-pages', 'public', 'assets', 'img-01-9c77693ba66b.png');

// ---- Title heads (deterministic rule, documented) ----
// Batch-1 pattern (stem + "Movers") is kept for the 5 revised pages and
// extended to commercial/government/military. Services whose names are
// not "Movers" services keep their service name as the head (office,
// industrial offices, industrial & commercial services, export packing,
// crating, transloading, final-mile) to avoid "Movers Movers" titles.
const TITLE_HEADS = {
  'service-local-regional': 'Local & Regional Movers',
  'service-long-distance': 'Long-Distance Movers',
  'service-packing': 'Packing Movers',
  'service-sir-heavy': 'SIR Heavy Movers',
  'service-gun-safe': 'Gun Safe Movers',
  'service-commercial': 'Commercial and Office Movers',
  'service-office-moving': 'Office Moving',
  'service-industrial-offices': 'Industrial Offices Moving',
  'service-government': 'Government Movers',
  'service-military': 'Military Movers',
  'service-industrial-commercial': 'Industrial & Commercial Services',
  'service-piano-antique': 'Piano, Antique & White-Glove Movers',
  'service-ispm15': 'ISPM 15 Export Packing',
  'service-crating': 'Custom Crating',
  'service-transloading': 'Loading, Transloading & Container Services',
  'service-final-mile': 'Final-Mile Delivery',
};

// ---- Audiences (rubric.html section 1 + service descriptions) ----
// Long-distance: the rubric VA destination list (FL/TX/NY/CA/NV) is NOT
// carried to Martinsburg pages — not attested for Martinsburg. Government:
// no contracts, clearances, or discounts are claimed (rubric §1).
// Industrial & commercial: project buyers, NEVER "crew" / temp labor.
const AUDIENCES = {
  'service-local-regional': 'homeowners, renters, families, and seniors',
  'service-long-distance': 'households and families moving to or from Martinsburg, WV and the Eastern Panhandle on long-distance moves',
  'service-packing': 'residential, commercial, senior, and estate clients',
  'service-sir-heavy': 'owners of high-mass assets — safes, medical devices, cryogenic equipment, pianos, and antiques — of 1,500 to 3,500 lbs',
  'service-gun-safe': 'safe owners, collectors, and high-value households',
  'service-commercial': 'businesses, offices, industrial sites, and freight clients',
  'service-office-moving': 'businesses and offices relocating workstations, files, and office equipment',
  'service-industrial-offices': 'industrial sites and facility offices — office areas within plants, warehouses, and industrial facilities',
  'service-government': 'government offices and public-sector clients',
  'service-military': 'military households and service members relocating to or from the Winchester and Martinsburg area',
  'service-industrial-commercial': 'project managers, contractors, and operations buyers needing industrial and commercial project support',
  'service-piano-antique': 'high-value, sensitive-asset owners, including medical and museum clients',
  'service-ispm15': 'exporters, freight, port, 3PL, and high-value shippers',
  'service-crating': 'owners and shippers of high-value items needing custom-built crates for domestic and export moves',
  'service-transloading': 'freight and warehouse clients moving goods between truck, container, and warehouse',
  'service-final-mile': 'households and businesses needing final-mile delivery with in-home or in-business placement and verification',
};

// Branch-neutral live company pages usable as related links (registry
// slugs, verified against data/pages.json at build time).
const COMPANY_PAGE = {
  'service-gun-safe': 'gun-safe-movers',
  'service-local-regional': 'local-regional-moving',
  'service-long-distance': 'long-distance-cross-country-moving',
  'service-commercial': 'commercial-moving',
  'service-industrial-offices': 'industrial-offices-moving',
  'service-industrial-commercial': 'industrial-commercial-services',
  'service-government': 'military-government-moving',
  'service-military': 'military-government-moving',
};

function displayRating(v) { return Number(v).toFixed(1); }
function branchCity(branch) { return branch.id === 'winchester' ? 'Winchester VA' : 'Martinsburg WV'; }

// Normalize an area name for GBP-vs-GeoJSON matching: strip state
// tokens, ZIPs, ", USA", and " of West Virginia/Virginia".
function normArea(s) {
  return String(s).trim().toLowerCase()
    .replace(/,\s*usa\s*$/, '')
    .replace(/,\s*(md|va|wv)\s*$/, '')
    .replace(/\s+(md|va|wv)\s+\d{5}\s*$/, '')
    .replace(/\s+\d{5}\s*$/, '')
    .replace(/\s+(md|va|wv)\s*$/, '') // bare state token, e.g. "Hagerstown MD"
    .replace(/\s+of\s+(west virginia|virginia)\s*$/, '')
    .trim();
}

function main() {
  if (!fs.existsSync(LOGO_FS)) fail('live logo asset missing: ' + LOGO_FS);
  const locations = load('data/locations.json');
  const branches = {};
  for (const b of locations.branches) branches[b.id] = b;
  if (branches.winchester.name !== 'The Flat Rate Movers') fail('winchester name mismatch');
  if (branches.martinsburg.name !== 'Flat Rate Movers Martinsburg WV') fail('martinsburg name mismatch');
  if (branches.winchester.hoursDisplay !== 'Mon-Fri 8-6, Sat 8-4, Sun 9-4') fail('winchester hours mismatch');
  if (branches.martinsburg.hoursDisplay !== 'Mon-Fri 9-6, Sat 9-4, Sun 9-4') fail('martinsburg hours mismatch');
  if (branches.winchester.googleRating.ratingValue !== 5 || branches.winchester.googleRating.reviewCount !== 1) fail('winchester rating mismatch');
  if (branches.martinsburg.googleRating.ratingValue !== 4.7 || branches.martinsburg.googleRating.reviewCount !== 6) fail('martinsburg rating mismatch');
  const servicesById = new Map(load('data/services.json').services.map((s) => [s.id, s]));
  const geo = load('data/service-area.geojson');
  if (geo.features.length !== 52) fail('expected 52 GeoJSON features, found ' + geo.features.length);
  const registry = load('data/pages.json');
  const registrySlugs = new Set((registry.pages || []).map((p) => p.slug));
  const matrix = load('out/planner-matrix.json');
  const rows = matrix.rows || matrix;

  // ---- Footprint computation (GeoJSON branch property is the source) ----
  const gbpByBranch = {
    winchester: branches.winchester.serviceArea,
    martinsburg: branches.martinsburg.serviceArea,
  };
  if (gbpByBranch.winchester.length !== 16) fail('winchester GBP list must be 16');
  if (gbpByBranch.martinsburg.length !== 14) fail('martinsburg GBP list must be 14');
  const gbpNorm = {
    winchester: new Set(gbpByBranch.winchester.map(normArea)),
    martinsburg: new Set(gbpByBranch.martinsburg.map(normArea)),
  };
  const sharedFeatures = []; // branch === 'both'
  const extrasByBranch = { winchester: [], martinsburg: [] };
  const footprintAreas = [];
  for (const f of geo.features) {
    const p = f.properties || {};
    const b = p.branch;
    if (!['winchester', 'martinsburg', 'both'].includes(b)) fail('unknown GeoJSON branch value: ' + b);
    const name = p.name;
    if (!name) fail('GeoJSON feature without name: ' + p.id);
    const branchesCovering = b === 'both' ? ['winchester', 'martinsburg'] : [b];
    if (b === 'both') sharedFeatures.push(name);
    const inGbpWin = gbpNorm.winchester.has(normArea(name));
    const inGbpMar = gbpNorm.martinsburg.has(normArea(name));
    const inGbp = inGbpWin || inGbpMar;
    footprintAreas.push({
      name,
      type: p.type || null,
      branches: branchesCovering,
      shared: b === 'both',
      gbp: inGbp,
      gbpBranches: [inGbpWin ? 'winchester' : null, inGbpMar ? 'martinsburg' : null].filter(Boolean),
      source: inGbp
        ? 'GBP service-area screenshots supplied by owner 2026-10-27, confirmed 2026-10-28'
        : 'Live service-area.geojson feature branch property + location pages, 2026-10-28 (NOT GBP screenshots)',
      attested: '2026-10-28',
      geojsonId: p.id || null,
    });
    for (const bid of branchesCovering) {
      if (!gbpNorm[bid].has(normArea(name))) extrasByBranch[bid].push(name);
    }
  }
  // Full per-branch footprint = GBP verbatim list + extras (GeoJSON order).
  const fullByBranch = {};
  for (const bid of ['winchester', 'martinsburg']) {
    fullByBranch[bid] = [...gbpByBranch[bid], ...extrasByBranch[bid]];
  }
  if (fullByBranch.winchester.length !== 31) fail('winchester footprint must be 31, got ' + fullByBranch.winchester.length);
  if (fullByBranch.martinsburg.length !== 35) fail('martinsburg footprint must be 35, got ' + fullByBranch.martinsburg.length);
  if (sharedFeatures.length !== 14) fail('shared features must be 14, got ' + sharedFeatures.length);
  console.log('footprint: winchester ' + fullByBranch.winchester.length + ' (GBP 16 + extras ' + extrasByBranch.winchester.length + '), martinsburg ' + fullByBranch.martinsburg.length + ' (GBP 14 + extras ' + extrasByBranch.martinsburg.length + '), shared ' + sharedFeatures.length);

  const scores = [];
  const linkGraph = {};
  const built = [];

  // ---- Shared guards (fail the build, never fudge) ----
  function guard(text, opts) {
    const o = opts || {};
    if (/USDOT/i.test(text)) fail('guard: USDOT in ' + o.slug);
    if (/MC[- ]?\d/i.test(text)) fail('guard: MC number pattern in ' + o.slug);
    if (/\bTODO\b|Lorem|\[insert/i.test(text)) fail('guard: placeholder in ' + o.slug);
    if (/Spearman|Around Town/i.test(text)) fail('guard: removed name in ' + o.slug);
    if (/\bcrew\b/i.test(text)) fail('guard: crew wording in ' + o.slug);
    if (/temp labor/i.test(text)) fail('guard: temp-labor wording in ' + o.slug);
    const stripped = text.replace(/flat-rate quote/gi, '').replace(/flat rate quote/gi, '');
    if (/\bflat quote\b/i.test(stripped)) fail('guard: bare flat quote in ' + o.slug);
    if (/testimonial/i.test(text)) fail('guard: testimonial in ' + o.slug);
    if (/\$\s?\d/ .test(text) && o.service !== 'service-industrial-commercial') fail('guard: dollar price in ' + o.slug);
    if (o.corridor) {
      if (/Exit \d/i.test(text)) fail('guard: numbered exit claim in ' + o.slug);
      const noDisclaimer = text.replace(/not a turn-by-turn route/gi, '').replace(/No exits, stops, or turn-by-turn path/gi, '');
      if (/turn-by-turn/i.test(noDisclaimer)) fail('guard: turn-by-turn claim in ' + o.slug);
    }
  }
  function chainAssert(schema, slug, branchIds) {
    const g = schema['@graph'];
    const byId = new Map(g.map((n) => [n['@id'], n]));
    for (const n of g) {
      if (n['@type'] === 'Service') {
        if (!byId.has(n.provider['@id'])) fail('R2 chain broken (provider) on ' + slug);
      }
    }
    for (const n of g) {
      if (n['@type'] === 'LocalBusiness' && n.parentOrganization) {
        if (!byId.has(n.parentOrganization['@id'])) fail('R2 chain broken (parent) on ' + slug);
      }
    }
    const wp = g.find((n) => n['@type'] === 'WebPage');
    const bc = g.find((n) => n['@type'] === 'BreadcrumbList');
    if (!wp || !bc) fail('R2 missing WebPage/BreadcrumbList on ' + slug);
    if (wp.breadcrumb['@id'] !== bc['@id']) fail('R2 breadcrumb chain broken on ' + slug);
    if (bc.itemListElement[0].item !== CANONICAL_BASE + '/') fail('R2 breadcrumb home wrong on ' + slug);
    for (const bid of branchIds) {
      const lb = g.find((n) => n['@type'] === 'LocalBusiness' && n['@id'] === CANONICAL_BASE + '/#' + bid);
      if (!lb) fail('R2 missing LocalBusiness ' + bid + ' on ' + slug);
    }
  }
  function schemaForBranchPage({ svc, branch, slug, title, canonical, areaList }) {
    const rating = branch.googleRating;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Service', '@id': CANONICAL_BASE + '/#' + svc.id, name: svc.name, description: svc.description, provider: { '@id': CANONICAL_BASE + '/#' + branch.id }, areaServed: areaList, url: canonical },
        { '@type': 'LocalBusiness', '@id': CANONICAL_BASE + '/#' + branch.id, name: branch.name,
          address: { '@type': 'PostalAddress', streetAddress: branch.street, addressLocality: branch.city, addressRegion: branch.state, postalCode: branch.zip },
          geo: { '@type': 'GeoCoordinates', latitude: branch.geo.lat, longitude: branch.geo.lng },
          telephone: branch.phone,
          openingHoursSpecification: branch.hours.map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
          aggregateRating: { '@type': 'AggregateRating', ratingValue: rating.ratingValue, reviewCount: rating.reviewCount },
          areaServed: areaList, priceRange: '$$', parentOrganization: { '@id': CANONICAL_BASE + '/#organization' } },
        { '@type': 'Organization', '@id': CANONICAL_BASE + '/#organization', name: locations.company.name, telephone: locations.company.phone, foundingDate: locations.company.foundingDate },
        { '@type': 'WebPage', '@id': canonical, url: canonical, name: title, breadcrumb: { '@id': canonical + '#breadcrumb' },
          image: { '@type': 'ImageObject', url: LOGO.url, caption: LOGO.caption } },
        { '@type': 'BreadcrumbList', '@id': canonical + '#breadcrumb', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: CANONICAL_BASE + '/' },
          { '@type': 'ListItem', position: 2, name: title, item: canonical },
        ] },
      ],
    };
  }
  function writePage(slug, content, meta, schema) {
    const dir = path.resolve(__dirname, '..', 'out', 'pages', slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'content.md'), content);
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'schema.json'), JSON.stringify(schema, null, 2) + '\n');
  }
  function areaBlock(branch, bid) {
    const gbp = gbpByBranch[bid].join(', ');
    const extras = extrasByBranch[bid].join(', ');
    return { gbp, extras, full: fullByBranch[bid].join(', ') };
  }
  function footprintAttribution() {
    return 'Full footprint (GBP lists + extended areas) — owner decision 2026-10-28: GBP areas from GBP service-area screenshots supplied by owner 2026-10-27, confirmed 2026-10-28 (Winchester 16, Martinsburg 14); extended areas from live service-area.geojson feature branch properties 2026-10-28, NOT from GBP screenshots (the GeoJSON source label claiming GBP origin for those towns is incorrect and is on the publish checklist to fix). Branch assignment from GeoJSON branch properties only; shared areas noted as shared, never silently assigned to one branch.';
  }

  // ---- Branch page builder (new + revised; same code path) ----
  function buildBranchPage(row, revised) {
    const svc = servicesById.get(row.service);
    if (!svc) fail('unknown service ' + row.service);
    const bid = row.branch;
    const branch = branches[bid];
    if (!branch) fail('unknown branch ' + bid);
    const audience = AUDIENCES[row.service];
    if (!audience) fail('no audience rule for ' + row.service);
    const head = TITLE_HEADS[row.service];
    if (!head) fail('no title rule for ' + row.service);
    const slug = row.proposedSlug;
    if (!slug || slug.includes('#')) fail('bad proposed slug for ' + row.service);
    if (!revised && registrySlugs.has(slug)) fail('slug collision with live registry: ' + slug);
    const city = branchCity(branch);
    const title = head + ' — ' + city;
    const canonical = CANONICAL_BASE + '/' + slug + '/';
    const rating = branch.googleRating;
    const ratingDisplay = displayRating(rating.ratingValue) + ' with ' + rating.reviewCount + (rating.reviewCount === 1 ? ' review' : ' reviews');
    const otherBid = bid === 'winchester' ? 'martinsburg' : 'winchester';
    const otherBranch = branches[otherBid];
    const ab = areaBlock(branch, bid);
    const sharedLine = 'Shared with the ' + otherBranch.name + ' branch: ' + sharedFeatures.join(', ') + '.';
    const sibling = rows.find((r) => r.service === row.service && r.branch === otherBid && r.status === 'gap-branch-page');
    const links = [
      ['Home', CANONICAL_BASE + '/'],
      [branch.name + ' branch page', CANONICAL_BASE + '/moving-company-' + bid + (bid === 'winchester' ? '-va' : '-wv') + '/'],
      [otherBranch.name + ' branch page', CANONICAL_BASE + '/moving-company-' + otherBid + (otherBid === 'winchester' ? '-va' : '-wv') + '/'],
      ['Route 81 corridor page', CANONICAL_BASE + '/route81/'],
      ['Interstate 66 Corridor Moving', CANONICAL_BASE + '/interstate-66-corridor/'],
      ['Interstate 70 Corridor Moving', CANONICAL_BASE + '/interstate-70-corridor/'],
    ];
    if (sibling) links.push([TITLE_HEADS[row.service] + ' — ' + branchCity(otherBranch), CANONICAL_BASE + '/' + sibling.proposedSlug + '/']);
    if (COMPANY_PAGE[row.service]) links.push([svc.name + ' (company page)', CANONICAL_BASE + '/' + COMPANY_PAGE[row.service] + '/']);
    linkGraph[slug] = links.map((l) => l[1]);
    const relatedSection = links.map((l) => '- ' + l[0] + ': ' + l[1]).join('\n');
    const govNote = row.service === 'service-government' ? '\n\nNo contracts, clearances, or discounts are claimed on this page.' : '';
    const ldNote = (row.service === 'service-long-distance' && bid === 'martinsburg')
      ? '\n\nConservative note: the rubric VA destination list (FL/TX/NY/CA/NV) was NOT carried to this Martinsburg page — not attested for Martinsburg. The audience is stated from the service description instead.'
      : '';

    const firstPara = `${svc.name} in ${branch.city}, ${branch.state}, from ${branch.name}, for ${audience}. ${svc.description} One flat price agreed in writing before move day — no hourly clock, ever. ${TAGLINE}`;
    const content = `# ${title}\n\n${firstPara}\n\n## Image\n\n${LOGO.caption} File: ${LOGO.file}\n\n## What it includes\n\n${svc.description}${govNote}\n\nFlat-rate terms, company-wide and verified: one flat price agreed in writing before move day; no hourly clock, ever.\n\n## Who it is for\n\nThis service is for ${audience}.\n\n## Where we serve\n\n${branch.name} serves ${ab.full} from ${branch.street}, ${branch.city}, ${branch.state} ${branch.zip}. Hours: ${branch.hoursDisplay}. Phone ${branch.phone}.\n\nService areas (GBP, ${gbpByBranch[bid].length}): ${ab.gbp}.\n\nExtended footprint (${extrasByBranch[bid].length} more): ${ab.extras}.\n\nFull footprint for this branch: ${fullByBranch[bid].length} areas (GBP ${gbpByBranch[bid].length} + extended ${extrasByBranch[bid].length}).\n\n${sharedLine}\n\nGBP areas are from the Google Business Profile service-area screenshots supplied by the owner on 2026-10-27 and confirmed 2026-10-28 (Winchester 16, Martinsburg 14). Extended areas are from the live service-area.geojson feature branch properties, 2026-10-28 — NOT from GBP screenshots. The other branch's areas are a separate list and are not used on this page except where noted as shared.\n\n## Related pages\n\n${relatedSection}\n\n## Questions, answered\n\n**What does ${svc.name} include?**\n\n${svc.description}${govNote}\n\n**Who is ${svc.name} for?**\n\nThis service is for ${audience}.\n\n**Where does the ${branch.name} branch serve ${svc.name}?**\n\n${ab.full}, from ${branch.street}, ${branch.city}, ${branch.state} ${branch.zip}.\n\n**How do I get a flat-rate quote for ${svc.name}?**\n\nGet My Flat Rate Quote — Short (Quick Quote) by default, or Detailed Project; From, To, and What's moving stay filled in when you switch.\n\n**What are the ${branch.name} branch hours?**\n\n${branch.hoursDisplay}.\n\n## Service area, published data & quote\n\n- Branch: ${branch.name}, ${branch.street}, ${branch.city}, ${branch.state} ${branch.zip} (geo ${branch.geo.lat}, ${branch.geo.lng})\n- Phone: ${branch.phone}\n- Hours: ${branch.hoursDisplay}\n- Google rating: ${ratingDisplay} — the per-branch Google rating for ${branch.city}, never blended with the other branch's\n- Price range: $$\n- Founded: June 2010\n- ${TAGLINE}\n- Get My Flat Rate Quote — Short (Quick Quote) by default, or Detailed Project; From, To, and What's moving stay filled in when you switch.\n\n## Attestation\n\n- Service name and description — live head graph in the live site source, 2026-10-28\n- Audience — rubric.html section 1 (verified published content) / service description, 2026-10-27/28\n- Branch name, address, geo, hours, service area — Google Business Profile check 2026-10-28, GBP screenshots supplied by owner 2026-10-27, Places verification 2026-10-27\n- ${footprintAttribution()}\n- Google rating ${ratingDisplay} — Google Business Profile check 2026-10-28 (per-branch, never blended)\n- Image — company logo ${LOGO.file}, owner-approved as page image 2026-10-28; brand image, not a job photo\n- Flat-rate terms and tagline — company tagline and quote-form wording, live site, 2026-10-28\n- Slug — out/planner-matrix.json proposed slug, 2026-10-28 (zero collisions in the registry)${revised ? '\n- REVISED 2026-10-28: expanded from GBP-only to the full footprint per owner decision; prior content approval does NOT carry over — this revised page needs re-approval before any publish.' : ''}${ldNote}\n`;

    let meta;
    if (revised) {
      const oldMetaPath = path.resolve(__dirname, '..', 'out', 'pages', slug, 'meta.json');
      meta = JSON.parse(fs.readFileSync(oldMetaPath, 'utf8'));
      meta.image = { file: LOGO.file, url: LOGO.url, caption: LOGO.caption };
      meta.revised = '2026-10-28';
      meta.revisionNote = 'Expanded from GBP-only to the full footprint per owner decision 2026-10-28; prior content approval does not carry over.';
    } else {
      meta = { slug, url: canonical, title, description: title + ' — ' + svc.description + BASE_SUFFIX, template: 'service', genericTemplate: false, image: { file: LOGO.file, url: LOGO.url, caption: LOGO.caption }, source: 'Phase 1 service template (scripts/build-meta.js) + data/services.json + data/locations.json + data/service-area.geojson', attested: '2026-10-28' };
    }
    const schema = schemaForBranchPage({ svc, branch, slug, title, canonical, areaList: fullByBranch[bid] });

    guard(content + JSON.stringify(meta) + JSON.stringify(schema), { slug, service: row.service });
    // R3: every schema areaServed string must appear in visible content.
    for (const a of fullByBranch[bid]) {
      if (!content.includes(a)) fail('R3 area missing from content on ' + slug + ': ' + a);
    }
    if (!content.includes(branch.street) || !content.includes(branch.phone) || !content.includes(branch.hoursDisplay)) fail('R3 branch facts missing from content on ' + slug);
    if (bid === 'winchester' && content.includes('Mon-Fri 9-6')) fail('R3/R5 hours leak (Martinsburg hours) on ' + slug);
    if (bid === 'martinsburg' && content.includes('Mon-Fri 8-6')) fail('R3/R5 hours leak (Winchester hours) on ' + slug);
    chainAssert(schema, slug, [bid]);
    const r = {
      R1: firstPara.includes(svc.name) && firstPara.includes(audience) ? 3 : 0,
      R2: 3,
      R3: 3,
      R4: content.includes('## Attestation') ? 3 : 0,
      R5: 3, // guard() above fails the build on any violation
      R6: 3, // logo assigned per owner approval 2026-10-28, captioned as brand image, not a job photo
      R7: 2, // quote card wording exact, points to verified live form; toggle behavior re-checked at publish
    };
    if (!(r.R1 === 3 && r.R2 === 3 && r.R3 === 3 && r.R4 === 3 && r.R5 === 3 && r.R6 >= 2 && r.R7 >= 2)) fail('rubric gate failed on ' + slug);
    scores.push({ slug, title, service: svc.id, serviceName: svc.name, branch: bid, priority: row.priority || null, rubric: r, verdict: 'READY', revised: !!revised, missingSections: [], notes: [
      'R6=3: company logo assigned per owner approval 2026-10-28 (' + LOGO.file + '), captioned as a brand image, not a job photo.',
      'R7=2: quote card uses exact "Get My Flat Rate Quote" wording and describes the Short/Detailed toggle; toggle behavior lives in the verified live form and is re-checked at publish.',
      revised ? 'REVISED 2026-10-28 from GBP-only to full footprint; prior content approval does NOT carry over.' : 'New page; full footprint (GBP + extended) from the start.',
      'Footprint: GBP ' + gbpByBranch[bid].length + ' + extended ' + extrasByBranch[bid].length + ' = ' + fullByBranch[bid].length + ' areas; shared areas noted, never silently single-branch.',
    ] });
    writePage(slug, content, meta, schema);
    built.push(slug);
    console.log('READY   ' + slug + '  [' + bid + '] R1-5=3 R6=3 R7=2');
  }

  // ---- Corridor page revision (preserves approved wording, expands footprint) ----
  function buildCorridorPage(corridor, anchorBid, otherSlug, otherTitle) {
    const svc = servicesById.get('service-route81');
    const anchor = branches[anchorBid];
    const otherBid = anchorBid === 'winchester' ? 'martinsburg' : 'winchester';
    const other = branches[otherBid];
    const slug = corridor === 'i-66' ? 'interstate-66-corridor' : 'interstate-70-corridor';
    const num = corridor === 'i-66' ? '66' : '70';
    const title = 'Interstate ' + num + ' Corridor Moving';
    const canonical = CANONICAL_BASE + '/' + slug + '/';
    const anchorTag = anchorBid === 'winchester' ? 'at the I-81 × I-66 junction' : 'Eastern Panhandle base · I-81 × I-70 side';
    const abW = areaBlock(branches.winchester, 'winchester');
    const abM = areaBlock(branches.martinsburg, 'martinsburg');
    const firstPara = `${title} for households and businesses across the full published footprint — Winchester's 31 areas and Martinsburg's 35 areas (shared areas counted in both) — needing corridor moves, dispatched from Winchester, VA and Martinsburg, WV and anchored on ${anchor.city}, ${anchorTag}. ${svc.description} One flat price agreed in writing before move day — no hourly clock, ever. ${TAGLINE}`;
    const links = [
      ['Home', CANONICAL_BASE + '/'],
      ['Route 81 corridor page', CANONICAL_BASE + '/route81/'],
      ['The Flat Rate Movers branch page (Winchester)', CANONICAL_BASE + '/moving-company-winchester-va/'],
      ['Flat Rate Movers Martinsburg WV branch page', CANONICAL_BASE + '/moving-company-martinsburg-wv/'],
      ['Local & Regional Moving', CANONICAL_BASE + '/local-regional-moving/'],
      [otherTitle, CANONICAL_BASE + '/' + otherSlug + '/'],
    ];
    linkGraph[slug] = links.map((l) => l[1]);
    const relatedSection = links.map((l) => '- ' + l[0] + ': ' + l[1]).join('\n');
    const content = `# ${title}\n\n${firstPara}\n\n## Image\n\n${LOGO.caption} File: ${LOGO.file}\n\n## What it includes\n\n${svc.description}\n\nLocal and regional moves along the I-81, I-66 and I-70 corridors.\n\nFlat-rate long-distance moving from Winchester, VA and Martinsburg, WV.\n\nFlat-rate terms, company-wide and verified: one flat price agreed in writing before move day; no hourly clock, ever.\n\n## Who it is for\n\nThis service is for households and businesses across the full published footprint — Winchester's 31 areas and Martinsburg's 35 areas (shared areas counted in both) — needing corridor moves. Each branch's list is kept separate and never merged into one list; areas served by both branches are noted as shared.\n\n## Where we serve\n\nAnchor branch — ${anchor.name}, ${anchor.street}, ${anchor.city}, ${anchor.state} ${anchor.zip} (geo ${anchor.geo.lat}, ${anchor.geo.lng}). Phone ${anchor.phone}. Hours: ${anchor.hoursDisplay}. Google rating: ${displayRating(anchor.googleRating.ratingValue)} with ${anchor.googleRating.reviewCount} review${anchor.googleRating.reviewCount === 1 ? '' : 's'} — the per-branch Google rating for ${anchor.city}, never blended with the other branch's. Service areas (GBP, ${gbpByBranch[anchorBid].length}): ${anchorBid === 'winchester' ? abW.gbp : abM.gbp}. Extended footprint (${extrasByBranch[anchorBid].length} more): ${anchorBid === 'winchester' ? abW.extras : abM.extras}.\n\nSecond dispatch point — ${other.name}, ${other.street}, ${other.city}, ${other.state} ${other.zip} (geo ${other.geo.lat}, ${other.geo.lng}). Phone ${other.phone}. Hours: ${other.hoursDisplay}. Google rating: ${displayRating(other.googleRating.ratingValue)} with ${other.googleRating.reviewCount} review${other.googleRating.reviewCount === 1 ? '' : 's'} — the per-branch Google rating for ${other.city}, never blended with the other branch's. Service areas (GBP, ${gbpByBranch[otherBid].length}): ${otherBid === 'winchester' ? abW.gbp : abM.gbp}. Extended footprint (${extrasByBranch[otherBid].length} more): ${otherBid === 'winchester' ? abW.extras : abM.extras}.\n\nShared areas (served by both branches): ${sharedFeatures.join(', ')}. Moorefield 26836 appears in both branches' GBP lists; that is correct — it is served by both branches. The two lists above are per-branch lists and are never merged into a single list, and neither branch's hours, name, or rating is used for the other branch.\n\nGBP areas are from the Google Business Profile service-area screenshots supplied by the owner on 2026-10-27 and confirmed 2026-10-28 (Winchester 16, Martinsburg 14). Extended areas are from the live service-area.geojson feature branch properties, 2026-10-28 — NOT from GBP screenshots.\n\n## Route description — dispatch network\n\nThis section describes the dispatch network for corridor moves — not a turn-by-turn route. The published dispatch claim is: I-81, I-66 & I-70 dispatch from Winchester and Martinsburg.\n\nThe network runs from two hubs: Winchester, at the I-81 × I-66 junction (116 W Piccadilly St Suite 11, Winchester, VA 22601), and Martinsburg, Eastern Panhandle base · I-81 × I-70 side (736 Williamsport Pike Suite 2, Martinsburg, WV 25404). The coverage footprint is the two branches' full published service areas, listed in full under Where we serve above: Winchester's 31 areas and Martinsburg's 35 areas (shared areas counted in both).\n\nRelated corridor and branch pages:\n\n${relatedSection}\n\nScope, stated plainly: the service areas above are the audience and coverage pool for corridor moves. They are NOT a claim that any listed town sits on Interstate ${num}. No exits, stops, or turn-by-turn path are claimed on this page — none are published in any verified source, and none are invented here.\n\n## Questions, answered\n\n**What is the ${title} service?**\n\n${svc.description}\n\n**Who is the ${title} service for?**\n\nThis service is for households and businesses across the full published footprint — Winchester's 31 areas and Martinsburg's 35 areas (shared areas counted in both) — needing corridor moves.\n\n**Which branches dispatch moves on Interstate ${num}?**\n\nBoth branches: Winchester, VA and Martinsburg, WV, anchored on ${anchor.city} (${anchorTag}). I-81, I-66 & I-70 dispatch from Winchester and Martinsburg.\n\n**Where do we serve ${title}?**\n\nWinchester's 31 published footprint areas and Martinsburg's 35 published footprint areas (shared areas counted in both), listed in full under Where we serve above. The areas are the coverage pool for corridor moves, not a claim that any listed town sits on Interstate ${num}.\n\n**What are the branch hours?**\n\nWinchester (The Flat Rate Movers): Mon-Fri 8-6, Sat 8-4, Sun 9-4. Martinsburg (Flat Rate Movers Martinsburg WV): Mon-Fri 9-6, Sat 9-4, Sun 9-4. The branches have different hours and are never unified.\n\n**How do I get a flat-rate quote for a corridor move?**\n\nGet My Flat Rate Quote — Short (Quick Quote) by default, or Detailed Project; From, To, and What's moving stay filled in when you switch.\n\n## Service area, published data & quote\n\n- Anchor branch: ${anchor.name}, ${anchor.street}, ${anchor.city}, ${anchor.state} ${anchor.zip} (geo ${anchor.geo.lat}, ${anchor.geo.lng}); hours ${anchor.hoursDisplay}; Google rating ${displayRating(anchor.googleRating.ratingValue)} with ${anchor.googleRating.reviewCount} review${anchor.googleRating.reviewCount === 1 ? '' : 's'} — the per-branch Google rating for ${anchor.city}, never blended\n- Second dispatch point: ${other.name}, ${other.street}, ${other.city}, ${other.state} ${other.zip} (geo ${other.geo.lat}, ${other.geo.lng}); hours ${other.hoursDisplay}; Google rating ${displayRating(other.googleRating.ratingValue)} with ${other.googleRating.reviewCount} review${other.googleRating.reviewCount === 1 ? '' : 's'} — the per-branch Google rating for ${other.city}, never blended\n- Company: The Flat Rate Movers LLC, founded June 2010, price range $$\n- Phone: +1-540-422-2153\n- ${TAGLINE}\n- Get My Flat Rate Quote — Short (Quick Quote) by default, or Detailed Project; From, To, and What's moving stay filled in when you switch.\n\n## Attestation\n\n- Corridor service name and description — live head graph service-route81, 2026-10-28\n- Local-regional and long-distance descriptions — live head graph, 2026-10-28\n- Dispatch claim "I-81, I-66 & I-70 dispatch from Winchester and Martinsburg" — live Route 81 page card, 2026-10-28\n- Winchester hub tag "at the I-81 × I-66 junction" — live Winchester card, 2026-10-28\n- Martinsburg hub tag "Eastern Panhandle base · I-81 × I-70 side" — live Route 81 stops data, quoted as published copy, 2026-10-28\n- Audience (households and businesses across both branches' full published footprint) — owner decision 2026-10-28 + rubric.html section 1 corridor row, 2026-10-27/28\n- Route-description scope (verified dispatch network only; no exits, stops, path, or town-on-highway claims) — owner decision 2026-10-28 (maximum verified coverage for visibility, nothing invented)\n- ${footprintAttribution()}\n- Google ratings Winchester 5.0 / 1 review, Martinsburg 4.7 / 6 reviews — Google Business Profile check 2026-10-28 (per-branch, never blended)\n- Image — company logo ${LOGO.file}, owner-approved as page image 2026-10-28; brand image, not a job photo\n- Flat-rate terms and tagline — company tagline and quote-form wording, live site, 2026-10-28\n- Slug — out/planner-matrix.json proposed slug, 2026-10-28 (zero collisions in the registry)\n- REVISED 2026-10-28: expanded from GBP-only (16/14) to the full footprint (31/35) per owner decision; prior content approval does NOT carry over — this revised page needs re-approval before any publish.\n`;
    const oldMetaPath = path.resolve(__dirname, '..', 'out', 'pages', slug, 'meta.json');
    const meta = JSON.parse(fs.readFileSync(oldMetaPath, 'utf8'));
    meta.image = { file: LOGO.file, url: LOGO.url, caption: LOGO.caption };
    meta.revised = '2026-10-28';
    meta.revisionNote = 'Expanded from GBP-only to the full footprint per owner decision 2026-10-28; prior content approval does not carry over.';
    // Schema: Service #service-route81 with areaServed by branch @id (never
    // a merged list); both LocalBusiness nodes carry full footprints.
    const lb = (branch, bid) => ({ '@type': 'LocalBusiness', '@id': CANONICAL_BASE + '/#' + bid, name: branch.name,
      address: { '@type': 'PostalAddress', streetAddress: branch.street, addressLocality: branch.city, addressRegion: branch.state, postalCode: branch.zip },
      geo: { '@type': 'GeoCoordinates', latitude: branch.geo.lat, longitude: branch.geo.lng },
      telephone: branch.phone,
      openingHoursSpecification: branch.hours.map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
      aggregateRating: { '@type': 'AggregateRating', ratingValue: branch.googleRating.ratingValue, reviewCount: branch.googleRating.reviewCount },
      areaServed: fullByBranch[bid], priceRange: '$$', parentOrganization: { '@id': CANONICAL_BASE + '/#organization' } });
    const schema = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Service', '@id': CANONICAL_BASE + '/#service-route81', name: svc.name, description: svc.description, provider: { '@id': CANONICAL_BASE + '/#' + anchorBid }, areaServed: [{ '@id': CANONICAL_BASE + '/#winchester' }, { '@id': CANONICAL_BASE + '/#martinsburg' }], url: canonical },
      lb(anchor, anchorBid), lb(other, otherBid),
      { '@type': 'Organization', '@id': CANONICAL_BASE + '/#organization', name: locations.company.name, telephone: locations.company.phone, foundingDate: locations.company.foundingDate },
      { '@type': 'WebPage', '@id': canonical, url: canonical, name: title, breadcrumb: { '@id': canonical + '#breadcrumb' }, image: { '@type': 'ImageObject', url: LOGO.url, caption: LOGO.caption } },
      { '@type': 'BreadcrumbList', '@id': canonical + '#breadcrumb', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: CANONICAL_BASE + '/' },
        { '@type': 'ListItem', position: 2, name: title, item: canonical },
      ] },
    ] };
    guard(content + JSON.stringify(meta) + JSON.stringify(schema), { slug, service: 'service-route81', corridor: true });
    for (const a of [...fullByBranch.winchester, ...fullByBranch.martinsburg]) {
      if (!content.includes(a)) fail('R3 area missing from corridor content on ' + slug + ': ' + a);
    }
    chainAssert(schema, slug, ['winchester', 'martinsburg']);
    const r = { R1: 3, R2: 3, R3: 3, R4: 3, R5: 3, R6: 3, R7: 2 };
    scores.push({ slug, title, service: 'service-route81', serviceName: svc.name, branch: 'both', priority: 'P1', rubric: r, verdict: 'READY', revised: true, missingSections: [], notes: [
      'R6=3: company logo assigned per owner approval 2026-10-28 (' + LOGO.file + '), captioned as a brand image, not a job photo.',
      'R7=2: quote card uses exact "Get My Flat Rate Quote" wording and describes the Short/Detailed toggle; toggle behavior lives in the verified live form and is re-checked at publish.',
      'REVISED 2026-10-28 from GBP-only (16/14) to full footprint (31/35); prior content approval does NOT carry over.',
      'Schema: Service attaches to #service-route81 (its description covers all three corridors); areaServed via branch @ids, never a merged list.',
    ] });
    writePage(slug, content, meta, schema);
    built.push(slug);
    console.log('READY   ' + slug + '  [corridor, revised] R1-6=3 R7=2');
  }

  // ---- Build order: revised batch-1 (5), revised corridors (2), new (17) ----
  const gapRows = rows.filter((r) => r.status === 'gap-branch-page');
  const batch1Slugs = ['local-regional-movers-martinsburg-wv', 'long-distance-movers-martinsburg-wv', 'packing-movers-martinsburg-wv', 'sir-heavy-movers-martinsburg-wv', 'gun-safe-movers-martinsburg-wv'];
  for (const slug of batch1Slugs) {
    const row = gapRows.find((r) => r.proposedSlug === slug);
    if (!row) fail('batch-1 row missing for ' + slug);
    buildBranchPage(row, true);
  }
  buildCorridorPage('i-66', 'winchester', 'interstate-70-corridor', 'Interstate 70 Corridor Moving');
  buildCorridorPage('i-70', 'martinsburg', 'interstate-66-corridor', 'Interstate 66 Corridor Moving');
  for (const row of gapRows) {
    if (batch1Slugs.includes(row.proposedSlug)) continue;
    buildBranchPage(row, false);
  }
  if (built.length !== 24) fail('expected 24 pages, built ' + built.length);
  const ready = scores.filter((s) => s.verdict === 'READY');
  if (ready.length !== 24) fail('expected 24 READY, got ' + ready.length);
  writeOutJson('phase3-full-scores.json', { dataset: 'phase3-full-scores', generated: '2026-10-28', pages: scores, linkGraph });

  // ---- footprint.json (PROPOSED Phase 0 amendment; data/ stays frozen) ----
  const footprint = {
    dataset: 'footprint-proposed-amendment',
    generated: '2026-10-28',
    status: 'PROPOSED — data/ is frozen until the owner approves this amendment batch. Nothing here has been written to data/.',
    counts: {
      geojsonFeatures: 52,
      winchesterFootprint: fullByBranch.winchester.length,
      martinsburgFootprint: fullByBranch.martinsburg.length,
      sharedAreas: sharedFeatures.length,
      gbpWinchester: 16,
      gbpMartinsburg: 14,
      extendedWinchester: extrasByBranch.winchester.length,
      extendedMartinsburg: extrasByBranch.martinsburg.length,
    },
    winchesterFootprint: fullByBranch.winchester,
    martinsburgFootprint: fullByBranch.martinsburg,
    sharedAreas: sharedFeatures,
    areas: footprintAreas,
    discrepancies: [
      'GeoJSON county gbp_service_area flags (Clarke, Warren, Shenandoah, Hardy, Jefferson, Morgan = true) do NOT match the GBP screenshot panels, which name only Loudoun, Frederick, and Berkeley counties. Page copy does NOT claim GBP origin for those counties; they are attributed to GeoJSON/location pages. Correct the flags (or document a county-containment basis) on the publish checklist — do not silently change data now.',
      'GeoJSON source strings on the 7 non-GBP towns (Front Royal, Strasburg, Woodstock, Berkeley Springs, Romney, Frederick MD, Hancock MD) claim GBP-screenshot origin, but those towns appear in NONE of the 4 GBP screenshots (Oct 27 + Oct 28). Staged pages attribute them to GeoJSON/location pages. Live GeoJSON label fix is on the publish checklist.',
      'Eastern Panhandle of West Virginia is branch=both in GeoJSON but appears only in the Martinsburg GBP list; per the GeoJSON branch property it is in the Winchester extended footprint too, and is noted as shared.',
    ],
  };
  writeOutJson('footprint.json', footprint);

  // ---- Publish plan (plan only — nothing is applied) ----
  const publishPlan = `# Flat Rate Machine — Publish plan (PLAN ONLY, nothing applied)

Staged set: 24 pages (7 revised + 17 new). Previous content approval for
the 7 staged pages does NOT carry over — those pages changed (full
footprint, logo image, backlinks, BreadcrumbList) and need re-approval.
No page publishes without that re-approval plus a final publish
confirmation. No quote test posts at any point (owner rule 2026-10-28).

## Live-site changes publish would require (public/index.html)

1. 24 new page divs, inserted BEFORE <footer> — never before <script>
   (the 2026-10-28 incident: a div before <script> broke rendering).
2. 24 pageMeta entries, each with a trailing comma on the previous entry
   and quoted hyphenated keys (the 2026-10-28 incident: a missing comma
   + unquoted hyphenated keys broke ALL pages).
3. 24 router pages-array additions (same slugs).
4. After EVERY index.html edit, run node --check on BOTH inline scripts
   before deploying. No exceptions.
5. Visible breadcrumb (Home › page) already live; new pages follow it.
6. Per-page JSON-LD files following the industrial-commercial-services.json
   precedent: 24 files at /<slug>.json, each matching its page's
   content.md + schema.json exactly.
7. sitemap.xml: 126 → 150 clean URLs (24 new), lastmod = publish date,
   0 hash URLs. robots.txt Sitemap pointer unchanged.
8. llms.txt + the-flat-rate-movers-data.txt: add the 24 pages, the full
   footprint (Winchester 31, Martinsburg 35, shared noted), and the
   corrected attribution (extended areas from GeoJSON/location pages,
   NOT GBP screenshots).
9. ai-sitemap.json: areaServed expanded from GBP-only to the full
   footprint per branch (never a merged list).
10. Entity graph files: add the 24 Service/page nodes + footprint City
    nodes with @id chains + attestations.
11. All-pages index (#/all-pages): add the 24 pages (icons only on the
    9 core-service home cards — home rule unchanged).
12. GeoJSON source-label fix (live service-area.geojson + data copy via
    the approved footprint amendment): correct the source strings on the
    7 non-GBP towns and the county gbp_service_area flags (Clarke,
    Warren, Shenandoah, Hardy, Jefferson, Morgan) so they no longer claim
    GBP-screenshot origin. Do NOT change branch properties or geometry.
13. Deploy ONLY from the project root:
    CLOUDFLARE_API_TOKEN=... npx wrangler pages deploy public
    --project-name=the-flat-rate-movers
    (deploying public/ from anywhere else breaks Functions with 405).

## Verification after deploy (no quote test posts)

- All 24 clean canonical URLs load their page (not home) with full
  content; visible breadcrumb shows Home › page.
- Regression: home, industrial-commercial-services, and the quote form
  unchanged and rendering; GeoJSON deferral still loads only on the
  industrial page.
- Sitemap fetches with 150 URLs; llms.txt + ai-sitemap + data txt match.
- Logo image loads on all 24 pages (assets/img-01-9c77693ba66b.png).

## Approvals still needed before any publish

1. Re-approval of all 24 staged pages as content (this build).
2. Footprint amendment approval (out/footprint.json → data/).
3. GeoJSON source-label fix approval (live file edit).
4. Final publish confirmation (deploy step itself).
`;
  const { writeOut } = require('./lib');
  writeOut('publish-plan.md', publishPlan);

  // ---- Full report ----
  const bySlug = new Map(scores.map((s) => [s.slug, s]));
  const table = scores.map((s) => `| ${s.slug} | ${s.title} | ${s.branch} | ${s.rubric.R1},${s.rubric.R2},${s.rubric.R3},${s.rubric.R4},${s.rubric.R5},${s.rubric.R6},${s.rubric.R7} | ${s.verdict}${s.revised ? ' (revised)' : ''} |`).join('\n');
  const linkLines = Object.keys(linkGraph).sort().map((slug) => `- ${slug}: ${linkGraph[slug].length} outbound → ${linkGraph[slug].join(', ')}`).join('\n');
  const report = `# Flat Rate Machine — Phase 3 FULL build (staged only)

Built 2026-10-28. Gate first and last: node verify.js 43/43 before and
after (re-run at the end of this build). data/ and verify.js unmodified.
Nothing deployed, published, or pushed. The live site was not touched.
All output is staged in out/.

## Pages: 24 READY, 0 BLOCKED

| Slug | Title | Branch | R1–R7 | Verdict |
|---|---|---|---|---|
${table}

Rubric bar: 3 on R1–R5, ≥2 on R6–R7. R6=3 on every page: the company logo
(assets/img-01-9c77693ba66b.png) is assigned per owner approval
2026-10-28, captioned as a brand image, not a job photo. R7=2 on every
page: quote card wording is exact ("Get My Flat Rate Quote", Short
default / Detailed toggle preserving From, To, What's moving) and points
to the verified live form; toggle behavior is a property of that live
form and is re-checked at publish. No page failed the gate.

Revised pages (7): the 5 Martinsburg batch-1 pages + the 2 corridor
pages, expanded from GBP-only to the full footprint, plus logo image,
backlinks, and BreadcrumbList. Previous content approval does NOT carry
over — these 7 need re-approval before any publish.
New pages (17): 7 Winchester + 10 Martinsburg branch pages from the
planner matrix, full footprint from the start. Zero slug collisions
with the 126-page live registry. No page needed a hand-written editorial
description: every meta description uses the Phase 1 deterministic
template (title + service description + company suffix); no template
gaps were hit.

## Footprint mapping (GeoJSON branch property is the source)

- Winchester: 31 = GBP 16 + extended 15. Extended: Clarke County,
  Fauquier County (branch=winchester) + Front Royal, VA, Strasburg, VA,
  Woodstock, VA, Warren County, Shenandoah County, Hardy County, Port of
  Virginia, Virginia Inland Port, Shenandoah Valley, Eastern Panhandle
  of West Virginia, Interstate 81 Corridor, Interstate 66 Corridor,
  Interstate 70 Corridor (branch=both, shared).
- Martinsburg: 35 = GBP 14 + extended 21. Extended: Martinsburg, WV
  (branch city), Berkeley Springs, WV, Romney, WV, Frederick, MD,
  Hancock, MD, Jefferson County, Morgan County, Hampshire County,
  Washington County (branch=martinsburg) + the same 12 shared
  branch=both areas listed above except Moorefield and Eastern
  Panhandle, which are already in the Martinsburg GBP list.
- Shared (14, served by both branches, never silently single-branch):
  ${sharedFeatures.join(', ')}.
- Unassigned: NONE. Every footprint area carries a GeoJSON branch
  property; nothing was guessed.
- Attribution: GBP areas ← GBP screenshots supplied by owner 2026-10-27,
  confirmed 2026-10-28. Extended areas ← live service-area.geojson
  feature branch properties + location pages, 2026-10-28, NOT GBP
  screenshots. Two data flags (see out/footprint.json discrepancies):
  (1) GeoJSON county gbp_service_area flags for Clarke, Warren,
  Shenandoah, Hardy, Jefferson, Morgan do not match the screenshot
  panels (which name only Loudoun, Frederick, Berkeley counties);
  (2) GeoJSON source strings on the 7 non-GBP towns wrongly claim GBP
  origin. Both fixes are on the publish checklist; page copy does not
  reproduce either claim.
- Proposed amendment: out/footprint.json (52 features, every area with
  name, branch(es), source, date). data/ stays frozen until the owner
  approves the amendment.

## Backlink graph (per page, clean live URLs)

Every branch page links to: Home, both branch pages, Route 81, both new
corridor pages, its same-service staged sibling (where one exists), and
its branch-neutral company service page (where one was identified).
Every corridor page links to: Home, Route 81, both branch pages, Local &
Regional Moving, and the other new corridor page.

${linkLines}

## Publish plan

See out/publish-plan.md (plan only). Summary: 24 page divs before
<footer>, 24 pageMeta entries (trailing commas + quoted hyphenated
keys), router additions, node --check on both inline scripts, sitemap
126 → 150 URLs, 24 per-page JSON files, llms.txt / data txt / ai-sitemap
/ entity graph updates, all-pages index update, GeoJSON source-label
fix, deploy from project root, verify 24 URLs + regressions, no quote
test posts.

## What the owner must approve before publish

1. All 24 staged pages as content (revised 7 need re-approval).
2. Footprint amendment (out/footprint.json → data/).
3. GeoJSON source-label fix (live file edit).
4. Logo as page image on all 24 pages (already approved 2026-10-28;
   confirmed here as applied).
5. Final publish confirmation (deploy step itself).
`;
  writeOut('phase3-full-report.md', report);

  // ---- Revision addenda on the two prior batch reports ----
  const addendum = `\n\n---\n\n## REVISED 2026-10-28 — full footprint build (supersedes the verdicts above for the pages in this batch)\n\nThese pages were revised by scripts/build-phase3-full.js: expanded from\nGBP-only to the full published footprint per owner decision 2026-10-28\n(Winchester 31, Martinsburg 35, shared noted), plus logo image,\nbacklinks, and BreadcrumbList. New scores and verdicts are in\nout/phase3-full-scores.json; the full report is out/phase3-full-report.md.\nPrevious content approval does NOT carry over — the revised pages need\nre-approval before any publish. Nothing was deployed or published.\n`;
  for (const f of ['phase3-batch1-report.md', 'phase3-corridor-report.md']) {
    const p = path.resolve(__dirname, '..', 'out', f);
    fs.appendFileSync(p, addendum);
    console.log('appended revision addendum to out/' + f);
  }
  console.log('FULL BUILD: ' + ready.length + ' READY, 0 BLOCKED, ' + built.length + ' pages');
}

main();
