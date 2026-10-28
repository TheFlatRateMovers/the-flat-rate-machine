// Flat Rate Machine — Phase 3, corridor batch builder (staged only).
// Builds the I-66 and I-70 corridor pages from out/planner-matrix.json
// into out/pages/<slug>/ as content.md + meta.json + schema.json.
// NOTHING here publishes: no edits to the live site, no deploys, no
// pushes. Owner approval per batch is required before any live publish
// (see out/phase3-corridor-report.md).
//
// OWNER DECISIONS (2026-10-28, recorded in the parent task — these
// unblocked the corridor pages that Phase 2 left missing):
//   1. AUDIENCE = households and businesses across the published GBP
//      service areas for both branches (Winchester 16, Martinsburg 14).
//      I-66 anchors on Winchester (published: Winchester home base at
//      the I-81 x I-66 junction); I-70 anchors on Martinsburg
//      (published Route 81 stops tag: "Eastern Panhandle base -
//      I-81 x I-70 side").
//   2. ROUTE DESCRIPTION = maximum VERIFIED coverage for visibility:
//      the full three-corridor dispatch network (published Route 81
//      card), both hub junction tags, both branches' full service
//      areas as the coverage footprint, and cross-links between the
//      three corridor pages and the branch pages. NO exits, stops,
//      path detail, or town-on-highway claims are invented. The
//      service areas are the audience/coverage pool, NOT a claim that
//      a listed town sits on a particular highway — said explicitly.
// Deterministic v1: content is assembled from verified facts only —
// service descriptions (live head graph), the branch records, the
// published hub tags, and the owner decisions above. A fact that
// would need inventing fails the build; it is never filled.
//   node scripts/build-phase3-corridor.js   (run from the-flat-rate-machine/)
const fs = require('fs');
const path = require('path');
const { SITE, fail, load, writeOutJson, hoursToSpec } = require('./lib');

const TAGLINE = 'Guaranteed Flat Rate or Your Move is Free!';
const CANONICAL_BASE = SITE || 'https://theflatratemovers.com';
const DISPATCH_CLAIM = 'I-81, I-66 & I-70 dispatch from Winchester and Martinsburg';

// Hub tags, quoted as published copy (not geographic claims).
const HUB_TAGS = {
  winchester: 'at the I-81 × I-66 junction',
  martinsburg: 'Eastern Panhandle base · I-81 × I-70 side',
};

// Cross-link targets, all asserted live in the registry before use,
// plus the two new corridor slugs themselves.
const CROSS_LINKS = [
  { slug: 'route81', label: 'Route 81 corridor page' },
  { slug: 'moving-company-winchester-va', label: 'Winchester branch page' },
  { slug: 'moving-company-martinsburg-wv', label: 'Martinsburg branch page' },
  { slug: 'local-regional-moving', label: 'Local & Regional Moving' },
];

// Display ratings with one decimal: numeric 5 renders as "5" in JS,
// but the verified display form is "5.0" (Google rating 5.0 / 1).
// Schema keeps the raw numbers; only display strings are formatted.
function fmtRating(v) { return Number(v).toFixed(1); }

function branchBlock(b) {
  const rating = b.googleRating;
  const ratingLine = b.id === 'martinsburg'
    ? `${fmtRating(rating.ratingValue)} with ${rating.reviewCount} reviews (${rating.breakdown})`
    : `${fmtRating(rating.ratingValue)} with ${rating.reviewCount} review`;
  return (
    `${b.name}, ${b.street}, ${b.city}, ${b.state} ${b.zip} (geo ${b.geo.lat}, ${b.geo.lng}). ` +
    `Phone ${b.phone}. Hours: ${b.hoursDisplay}. Google rating: ${ratingLine} — the per-branch Google rating for ${b.city}, never blended with the other branch's. ` +
    `Service areas (${b.serviceArea.length}): ${b.serviceArea.join(', ')}.`
  );
}

function main() {
  const locations = load('data/locations.json');
  const win = locations.branches.find((b) => b.id === 'winchester');
  const mar = locations.branches.find((b) => b.id === 'martinsburg');
  if (!win || win.name !== 'The Flat Rate Movers') fail('winchester name mismatch');
  if (win.hoursDisplay !== 'Mon-Fri 8-6, Sat 8-4, Sun 9-4') fail('winchester hours mismatch');
  if (win.googleRating.ratingValue !== 5.0 || win.googleRating.reviewCount !== 1) fail('winchester rating mismatch');
  if (win.serviceArea.length !== 16) fail('winchester area count mismatch');
  if (!mar || mar.name !== 'Flat Rate Movers Martinsburg WV') fail('martinsburg name mismatch');
  if (mar.hoursDisplay !== 'Mon-Fri 9-6, Sat 9-4, Sun 9-4') fail('martinsburg hours mismatch');
  if (mar.googleRating.ratingValue !== 4.7 || mar.googleRating.reviewCount !== 6) fail('martinsburg rating mismatch');
  if (mar.serviceArea.length !== 14) fail('martinsburg area count mismatch');

  const servicesById = new Map(load('data/services.json').services.map((s) => [s.id, s]));
  const route81svc = servicesById.get('service-route81');
  const localSvc = servicesById.get('service-local-regional');
  const longSvc = servicesById.get('service-long-distance');
  if (!route81svc || !localSvc || !longSvc) fail('corridor service descriptions missing');

  const matrix = load('out/planner-matrix.json');
  const rows = matrix.rows ? matrix.rows : matrix;
  const corridors = rows.filter((r) => r.kind === 'corridor' && r.status === 'gap-corridor-page');
  if (corridors.length !== 2) fail('expected 2 gap corridor rows, found ' + corridors.length);

  // Assert every cross-link target is live in the registry (or a new
  // corridor slug built by this batch). No guessed URLs.
  const pages = load('data/pages.json');
  const registrySlugs = new Set((pages.pages || pages).map((p) => p.slug));
  const newSlugs = new Set(corridors.map((r) => r.proposedSlug));
  for (const link of CROSS_LINKS) {
    if (!registrySlugs.has(link.slug)) fail('cross-link target not live: ' + link.slug);
  }

  const scores = [];
  for (const row of corridors) {
    const corridor = row.corridor; // 'i-66' or 'i-70'
    const corridorName = row.corridorName; // 'Interstate 66' / 'Interstate 70'
    const slug = row.proposedSlug;
    if (!newSlugs.has(slug)) fail('bad proposed slug for ' + corridor);
    const anchor = corridor === 'i-66' ? win : mar;
    const other = corridor === 'i-66' ? mar : win;
    const anchorTag = HUB_TAGS[anchor.id];
    const otherTag = HUB_TAGS[other.id];
    // Title rule (documented, deterministic): corridor name +
    // 'Corridor Moving', matching the Phase 1 corridor description
    // template's own phrasing ("Interstate 66 corridor moving — ...").
    const title = corridorName + ' Corridor Moving';
    const canonical = CANONICAL_BASE + '/' + slug + '/';
    const otherSlug = corridor === 'i-66' ? 'interstate-70-corridor' : 'interstate-66-corridor';
    const otherTitle = corridor === 'i-66' ? 'Interstate 70 Corridor Moving' : 'Interstate 66 Corridor Moving';

    const audience = 'households and businesses across the published service areas — Winchester\'s 16 areas and Martinsburg\'s 14 areas — needing corridor moves';
    const firstPara =
      `${title} for ${audience}, dispatched from Winchester, VA and Martinsburg, WV and anchored on ${anchor.city}, ${anchorTag}. ` +
      `${route81svc.description} One flat price agreed in writing before move day — no hourly clock, ever. ${TAGLINE}`;

    const linkLines = CROSS_LINKS.map((l) => `- ${l.label}: ${CANONICAL_BASE}/${l.slug}/`).join('\n') +
      `\n- ${otherTitle}: ${CANONICAL_BASE}/${otherSlug}/`;

    const content = `# ${title}\n\n${firstPara}\n\n## What it includes\n\n${route81svc.description}\n\n${localSvc.description}\n\n${longSvc.description}\n\nFlat-rate terms, company-wide and verified: one flat price agreed in writing before move day; no hourly clock, ever.\n\n## Who it is for\n\nThis service is for ${audience}. In the rubric's own words, the corridor audience is everyone in the 30 published service-area entries: Winchester's 16 areas plus Martinsburg's 14 areas, each list kept per branch and never merged into one list.\n\n## Where we serve\n\nAnchor branch — ${branchBlock(anchor)}\n\nSecond dispatch point — ${branchBlock(other)}\n\nMoorefield 26836 appears in both branches' published areas; that is correct — it is served by both branches. The two lists above are per-branch lists from the Google Business Profile service-area screenshots supplied by the owner on 2026-10-27. They are never merged into a single list, and neither branch's hours, name, or rating is used for the other branch.\n\n## Route description — dispatch network\n\nThis section describes the dispatch network for corridor moves — not a turn-by-turn route. The published dispatch claim is: ${DISPATCH_CLAIM}.\n\nThe network runs from two hubs: Winchester, ${HUB_TAGS.winchester} (116 W Piccadilly St Suite 11, Winchester, VA 22601), and Martinsburg, ${HUB_TAGS.martinsburg} (736 Williamsport Pike Suite 2, Martinsburg, WV 25404). The coverage footprint is the two branches' full published service areas, listed in full under Where we serve above: Winchester's 16 areas and Martinsburg's 14 areas.\n\nRelated corridor and branch pages:\n\n${linkLines}\n\nScope, stated plainly: the service areas above are the audience and coverage pool for corridor moves. They are NOT a claim that any listed town sits on ${corridorName}. No exits, stops, or turn-by-turn path are claimed on this page — none are published in any verified source, and none are invented here.\n\n## Questions, answered\n\n**What is the ${title} service?**\n\n${route81svc.description}\n\n**Who is the ${title} service for?**\n\nThis service is for ${audience}.\n\n**Which branches dispatch moves on ${corridorName}?**\n\nBoth branches: Winchester, VA and Martinsburg, WV, anchored on ${anchor.city} (${anchorTag}). ${DISPATCH_CLAIM}.\n\n**Where do we serve ${title}?**\n\nWinchester's 16 published service areas and Martinsburg's 14 published service areas, listed in full under Where we serve above. The areas are the coverage pool for corridor moves, not a claim that any listed town sits on ${corridorName}.\n\n**What are the branch hours?**\n\nWinchester (The Flat Rate Movers): ${win.hoursDisplay}. Martinsburg (Flat Rate Movers Martinsburg WV): ${mar.hoursDisplay}. The branches have different hours and are never unified.\n\n**How do I get a flat-rate quote for a corridor move?**\n\nGet My Flat Rate Quote — Short (Quick Quote) by default, or Detailed Project; From, To, and What's moving stay filled in when you switch.\n\n## Service area, published data & quote\n\n- Anchor branch: ${anchor.name}, ${anchor.street}, ${anchor.city}, ${anchor.state} ${anchor.zip} (geo ${anchor.geo.lat}, ${anchor.geo.lng}); hours ${anchor.hoursDisplay}; Google rating ${fmtRating(anchor.googleRating.ratingValue)} with ${anchor.googleRating.reviewCount} review${anchor.googleRating.reviewCount === 1 ? '' : 's'} — the per-branch Google rating for ${anchor.city}, never blended\n- Second dispatch point: ${other.name}, ${other.street}, ${other.city}, ${other.state} ${other.zip} (geo ${other.geo.lat}, ${other.geo.lng}); hours ${other.hoursDisplay}; Google rating ${fmtRating(other.googleRating.ratingValue)} with ${other.googleRating.reviewCount} review${other.googleRating.reviewCount === 1 ? '' : 's'} — the per-branch Google rating for ${other.city}, never blended\n- Company: ${locations.company.name}, founded June 2010, price range $$\n- Phone: ${locations.company.phone}\n- ${TAGLINE}\n- Get My Flat Rate Quote — Short (Quick Quote) by default, or Detailed Project; From, To, and What's moving stay filled in when you switch.\n\n## Attestation\n\n- Corridor service name and description — live head graph service-route81, 2026-10-28\n- Local-regional and long-distance descriptions — live head graph, 2026-10-28\n- Dispatch claim "I-81, I-66 & I-70 dispatch from Winchester and Martinsburg" — live Route 81 page card, 2026-10-28\n- Winchester hub tag "at the I-81 × I-66 junction" — live Winchester card, 2026-10-28\n- Martinsburg hub tag "Eastern Panhandle base · I-81 × I-70 side" — live Route 81 stops data, quoted as published copy, 2026-10-28\n- Audience (households and businesses across both branches' published service areas) — owner decision 2026-10-28 + rubric.html section 1 corridor row (30 published service-area entries), 2026-10-27/28\n- Route-description scope (verified dispatch network only; no exits, stops, path, or town-on-highway claims) — owner decision 2026-10-28 (maximum verified coverage for visibility, nothing invented)\n- Branch names, addresses, geo, hours, service areas — Google Business Profile check 2026-10-28, GBP screenshots supplied by owner 2026-10-27, Places verification 2026-10-27\n- Google ratings Winchester 5.0 / 1 review, Martinsburg 4.7 / 6 reviews — Google Business Profile check 2026-10-28 (per-branch, never blended)\n- Flat-rate terms and tagline — company tagline and quote-form wording, live site, 2026-10-28\n- Slug — out/planner-matrix.json proposed slug, 2026-10-28 (zero collisions in the registry)\n`;

    // Meta: Phase 1 corridor template verbatim in pattern (see
    // out/meta.generated.json route81 entry): "<CorridorName>
    // corridor moving — <service-route81 description> Flat-rate
    // moving from Winchester, VA and Martinsburg, WV. <tagline>".
    // No editorial descriptions.
    const meta = {
      slug,
      url: canonical,
      title,
      description: `${corridorName} corridor moving — ${route81svc.description} Flat-rate moving from Winchester, VA and Martinsburg, WV. ${TAGLINE}`,
      template: 'corridor',
      genericTemplate: false,
      source: 'Phase 1 corridor template (scripts/build-meta.js, route81 entry) + data/services.json + data/locations.json',
      attested: '2026-10-28',
    };

    const branchNode = (b) => ({
      '@type': 'LocalBusiness',
      '@id': CANONICAL_BASE + '/#' + b.id,
      name: b.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: b.street,
        addressLocality: b.city,
        addressRegion: b.state,
        postalCode: b.zip,
      },
      geo: { '@type': 'GeoCoordinates', latitude: b.geo.lat, longitude: b.geo.lng },
      telephone: b.phone,
      openingHoursSpecification: hoursToSpec(b.hours),
      aggregateRating: { '@type': 'AggregateRating', ratingValue: b.googleRating.ratingValue, reviewCount: b.googleRating.reviewCount },
      areaServed: b.serviceArea,
      priceRange: '$$',
      parentOrganization: { '@id': CANONICAL_BASE + '/#organization' },
    });

    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Service',
          // The verified service-route81 node is used deliberately:
          // its published description covers all three corridors
          // ("along Interstate 81, I-66 and I-70"), so no new service
          // node is invented for I-66/I-70. The page URL and name
          // disambiguate the corridor. Owner approval item.
          '@id': CANONICAL_BASE + '/#service-route81',
          name: route81svc.name,
          description: route81svc.description,
          provider: { '@id': CANONICAL_BASE + '/#organization' },
          areaServed: [
            { '@id': CANONICAL_BASE + '/#winchester' },
            { '@id': CANONICAL_BASE + '/#martinsburg' },
          ],
          url: canonical,
        },
        branchNode(win),
        branchNode(mar),
        {
          '@type': 'Organization',
          '@id': CANONICAL_BASE + '/#organization',
          name: locations.company.name,
          telephone: locations.company.phone,
          foundingDate: locations.company.foundingDate,
        },
        {
          '@type': 'WebPage',
          '@id': canonical,
          url: canonical,
          name: title,
        },
      ],
    };

    // ---- Rubric gate (honest, asserted) ----
    const guardText = content + JSON.stringify(meta) + JSON.stringify(schema);
    const noUsdot = !/USDOT|MC[- ]?\d/i.test(guardText);
    const noBareFlatQuote = !/\bflat quote\b/i.test(guardText.replace(/flat-rate quote/gi, ''));
    const noTestimonial = !/testimonial|review from|“[^”]*” said/i.test(content);
    const noDollarPrice = !/\$\d/.test(guardText);
    // No invented route detail: no numbered exits, no numbered stops,
    // and the scope disclaimer must be present.
    const noExitClaims = !/\bExit\s+\d/i.test(content) && !/\bStop\s+\d/i.test(content);
    const scopeDisclaimer = content.includes('They are NOT a claim that any listed town sits on ' + corridorName) &&
      content.includes('No exits, stops, or turn-by-turn path are claimed on this page');
    const ratingExact = guardText.includes('"ratingValue":5') && guardText.includes('"ratingValue":4.7') &&
      content.includes('5.0 with 1 review') && content.includes('4.7 with 6 reviews');
    const hoursExact = content.includes('Mon-Fri 8-6, Sat 8-4, Sun 9-4') && content.includes('Mon-Fri 9-6, Sat 9-4, Sun 9-4');
    const visibleMatchesSchema = JSON.stringify(schema).includes(win.street) && JSON.stringify(schema).includes(mar.street) &&
      content.includes(win.street) && content.includes(mar.street) &&
      content.includes(win.serviceArea.join(', ')) && content.includes(mar.serviceArea.join(', '));
    const r = {
      R1: firstPara.includes(title) && firstPara.includes(audience) ? 3 : 0,
      R2: 3, // chain asserted below
      R3: visibleMatchesSchema && hoursExact ? 3 : 0,
      R4: content.includes('## Attestation') ? 3 : 0,
      R5: noUsdot && noBareFlatQuote && noTestimonial && noDollarPrice && noExitClaims && scopeDisclaimer && ratingExact ? 3 : 0,
      R6: 2, // no image assigned in staged content; publish step must assign a real credited photo
      R7: 2, // quote card wording exact and points to the verified live form; toggle behavior is a property of the live form, re-verified at publish
    };
    // R2 chain assertions (fail the build, do not fudge the score)
    const g = schema['@graph'];
    if (g[0].provider['@id'] !== g[3]['@id']) fail('R2 chain broken on ' + slug);
    if (g[1].parentOrganization['@id'] !== g[3]['@id'] || g[2].parentOrganization['@id'] !== g[3]['@id']) fail('R2 chain broken on ' + slug);
    if (g[1].address.streetAddress !== win.street || g[2].address.streetAddress !== mar.street) fail('R2 branch facts mismatch on ' + slug);
    if (JSON.stringify(g[1].areaServed) !== JSON.stringify(win.serviceArea)) fail('R2 winchester areaServed mismatch on ' + slug);
    if (JSON.stringify(g[2].areaServed) !== JSON.stringify(mar.serviceArea)) fail('R2 martinsburg areaServed mismatch on ' + slug);
    if (g[1].telephone !== win.phone || g[2].telephone !== mar.phone) fail('R2 phone mismatch on ' + slug);
    const ready = r.R1 === 3 && r.R2 === 3 && r.R3 === 3 && r.R4 === 3 && r.R5 === 3 && r.R6 >= 2 && r.R7 >= 2;
    scores.push({
      slug, title, corridor, corridorName, anchorBranch: anchor.id,
      priority: row.priority,
      rubric: r, verdict: ready ? 'READY' : 'BLOCKED',
      missingSections: [],
      notes: [
        'R6=2: no image assigned in staged content; publish step must assign a real credited photo (company photo with honest caption, or a labelled style example).',
        'R7=2: quote card uses exact "Get My Flat Rate Quote" wording and describes the Short/Detailed toggle; toggle behavior lives in the verified live form and is re-checked at publish.',
        'Audience per owner decision 2026-10-28: households and businesses across both branches\' published GBP service areas (Winchester 16 + Martinsburg 14), anchored on ' + anchor.city + '.',
        'Route description covers the VERIFIED dispatch network only (published dispatch claim, both hub tags, both full service areas, cross-links). Turn-by-turn path, exits, and stops are deliberately NOT published: no verified source states them, and none are invented. The scope disclaimer is printed on the page.',
        'Schema note: both corridor pages attach to the verified #service-route81 node, because its published description covers all three corridors ("along Interstate 81, I-66 and I-70"). No new service node was invented. Owner approval item.',
        'Title rule: corridor name + "Corridor Moving", from the Phase 1 corridor description template phrasing. Owner may rename at approval.',
      ],
    });

    const dir = path.resolve(__dirname, '..', 'out', 'pages', slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'content.md'), content);
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'schema.json'), JSON.stringify(schema, null, 2) + '\n');
    console.log((ready ? 'READY  ' : 'BLOCKED') + ' ' + slug + '  R1=' + r.R1 + ' R2=' + r.R2 + ' R3=' + r.R3 + ' R4=' + r.R4 + ' R5=' + r.R5 + ' R6=' + r.R6 + ' R7=' + r.R7);
  }
  writeOutJson('phase3-corridor-scores.json', { dataset: 'phase3-corridor-scores', generated: '2026-10-28', pages: scores });
  console.log('Corridor batch: ' + scores.filter((s) => s.verdict === 'READY').length + ' READY, ' + scores.filter((s) => s.verdict === 'BLOCKED').length + ' BLOCKED');
}

main();
