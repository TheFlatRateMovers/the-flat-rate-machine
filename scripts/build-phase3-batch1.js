// Flat Rate Machine — Phase 3, batch 1 builder (staged only).
// Builds the FIRST 5 Martinsburg gap-branch-page rows from
// out/planner-matrix.json, in planner order, into out/pages/<slug>/ as
// content.md + meta.json + schema.json. NOTHING here publishes: no edits
// to the live site, no deploys, no pushes. Owner approval per batch is
// required before any live publish (see out/phase3-batch1-report.md).
// Deterministic v1: content is assembled from verified facts only —
// service descriptions (live head graph), rubric.html section 1
// audiences, and the Martinsburg branch record. No AI drafting, no
// invented service details, prices, coverage, or claims. A missing fact
// fails the build for that page; it is never filled.
//   node scripts/build-phase3-batch1.js   (run from the-flat-rate-machine/)
const fs = require('fs');
const path = require('path');
const { SITE, fail, load, writeOutJson } = require('./lib');

const TAGLINE = 'Guaranteed Flat Rate or Your Move is Free!';
const BASE_SUFFIX = ' Flat-rate moving from Winchester, VA and Martinsburg, WV. ' + TAGLINE;
const CANONICAL_BASE = SITE || 'https://theflatratemovers.com';

// Audience phrases, from rubric.html section 1 (verified published
// content) and service descriptions. Long-distance: the rubric's VA
// destination list (FL/TX/NY/CA/NV) is NOT carried to the Martinsburg
// page — it is not attested for Martinsburg — so the audience is stated
// from the service description (moves from Martinsburg, WV) instead.
const AUDIENCES = {
  'service-local-regional': 'homeowners, renters, families, and seniors',
  'service-long-distance': 'households and families moving to or from Martinsburg, WV and the Eastern Panhandle on long-distance moves',
  'service-packing': 'residential, commercial, senior, and estate clients',
  'service-sir-heavy': 'owners of high-mass assets — safes, medical devices, cryogenic equipment, pianos, and antiques — of 1,500 to 3,500 lbs',
  'service-gun-safe': 'safe owners, collectors, and high-value households',
};

// Title rule (documented, deterministic): slug stem title-cased +
// ' — Martinsburg WV', matching the live branch-page pattern
// ('Gun Safe Movers — Winchester VA'). Exceptions: 'local-regional'
// keeps the company's own 'Local & Regional' wording (live company page
// title 'Local & Regional Moving'); 'sir-heavy' keeps the SIR acronym.
function titleFor(slug) {
  const stem = slug.replace(/-martinsburg-wv$/, '').replace(/-movers$/, '');
  const words = { 'local-regional': 'Local & Regional', 'long-distance': 'Long-Distance', packing: 'Packing', 'sir-heavy': 'SIR Heavy', 'gun-safe': 'Gun Safe' };
  const head = words[stem];
  if (!head) fail('no title rule for slug stem: ' + stem);
  return head + ' Movers — Martinsburg WV';
}

function main() {
  const locations = load('data/locations.json');
  const branch = locations.branches.find((b) => b.id === 'martinsburg');
  if (!branch) fail('martinsburg branch missing');
  if (branch.name !== 'Flat Rate Movers Martinsburg WV') fail('martinsburg name mismatch');
  if (branch.hoursDisplay !== 'Mon-Fri 9-6, Sat 9-4, Sun 9-4') fail('martinsburg hours mismatch');
  if (branch.googleRating.ratingValue !== 4.7 || branch.googleRating.reviewCount !== 6) fail('martinsburg rating mismatch');
  const servicesById = new Map(load('data/services.json').services.map((s) => [s.id, s]));
  const matrix = load('out/planner-matrix.json');
  const batch = matrix.rows.filter((r) => r.branch === 'martinsburg' && r.status === 'gap-branch-page').slice(0, 5);
  if (batch.length !== 5) fail('expected 5 Martinsburg gap rows, found ' + batch.length);

  const scores = [];
  for (const row of batch) {
    const svc = servicesById.get(row.service);
    if (!svc) fail('unknown service ' + row.service);
    const audience = AUDIENCES[row.service];
    if (!audience) fail('no audience rule for ' + row.service);
    const slug = row.proposedSlug;
    if (!slug || slug.includes('#')) fail('bad proposed slug for ' + row.service);
    const title = titleFor(slug);
    const canonical = CANONICAL_BASE + '/' + slug + '/';
    const areaList = branch.serviceArea.join(', ');
    const rating = branch.googleRating;

    const firstPara = `${svc.name} in Martinsburg, WV, from ${branch.name}, for ${audience}. ${svc.description} One flat price agreed in writing before move day — no hourly clock, ever. ${TAGLINE}`;
    const content = `# ${title}\n\n${firstPara}\n\n## What it includes\n\n${svc.description}\n\nFlat-rate terms, company-wide and verified: one flat price agreed in writing before move day; no hourly clock, ever.\n\n## Who it is for\n\nThis service is for ${audience}.\n\n## Where we serve\n\n${branch.name} serves ${areaList} from ${branch.street}, ${branch.city}, ${branch.state} ${branch.zip}. Hours: ${branch.hoursDisplay}. Phone ${branch.phone}.\n\nThese are the Martinsburg branch service areas from the Google Business Profile service-area screenshots supplied by the owner on 2026-10-27. Winchester's 16 service areas are a separate list and are not used on this page.\n\n## Questions, answered\n\n**What does ${svc.name} include?**\n\n${svc.description}\n\n**Who is ${svc.name} for?**\n\nThis service is for ${audience}.\n\n**Where does the Martinsburg branch serve ${svc.name}?**\n\n${areaList}, from ${branch.street}, ${branch.city}, ${branch.state} ${branch.zip}.\n\n**How do I get a flat-rate quote for ${svc.name}?**\n\nGet My Flat Rate Quote — Short (Quick Quote) by default, or Detailed Project; From, To, and What's moving stay filled in when you switch.\n\n**What are the Martinsburg branch hours?**\n\n${branch.hoursDisplay}.\n\n## Service area, published data & quote\n\n- Branch: ${branch.name}, ${branch.street}, ${branch.city}, ${branch.state} ${branch.zip} (geo ${branch.geo.lat}, ${branch.geo.lng})\n- Phone: ${branch.phone}\n- Hours: ${branch.hoursDisplay}\n- Google rating: ${rating.ratingValue} with ${rating.reviewCount} reviews (${rating.breakdown}) — the per-branch Google rating for Martinsburg, never blended with Winchester's\n- Price range: $$\n- Founded: June 2010\n- ${TAGLINE}\n- Get My Flat Rate Quote — Short (Quick Quote) by default, or Detailed Project; From, To, and What's moving stay filled in when you switch.\n\n## Attestation\n\n- Service name and description — live head graph in the live site source, 2026-10-28\n- Audience — rubric.html section 1 (verified published content) / service description, 2026-10-27/28\n- Branch name, address, geo, hours, service area — Google Business Profile check 2026-10-28, GBP screenshots supplied by owner 2026-10-27, Places verification 2026-10-27\n- Google rating 4.7 / 6 reviews — Google Business Profile check 2026-10-28 (per-branch, never blended)\n- Flat-rate terms and tagline — company tagline and quote-form wording, live site, 2026-10-28\n- Slug — out/planner-matrix.json proposed slug, 2026-10-28 (planner order, zero collisions)\n`;

    // Meta: Phase 1 service template verbatim (title + service
    // description + company base suffix). No editorial descriptions.
    const meta = {
      slug,
      url: canonical,
      title,
      description: title + ' — ' + svc.description + BASE_SUFFIX,
      template: 'service',
      genericTemplate: false,
      source: 'Phase 1 service template (scripts/build-meta.js) + data/services.json + data/locations.json',
      attested: '2026-10-28',
    };

    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Service',
          '@id': CANONICAL_BASE + '/#' + svc.id,
          name: svc.name,
          description: svc.description,
          provider: { '@id': CANONICAL_BASE + '/#martinsburg' },
          areaServed: branch.serviceArea,
          url: canonical,
        },
        {
          '@type': 'LocalBusiness',
          '@id': CANONICAL_BASE + '/#martinsburg',
          name: branch.name,
          address: {
            '@type': 'PostalAddress',
            streetAddress: branch.street,
            addressLocality: branch.city,
            addressRegion: branch.state,
            postalCode: branch.zip,
          },
          geo: { '@type': 'GeoCoordinates', latitude: branch.geo.lat, longitude: branch.geo.lng },
          telephone: branch.phone,
          openingHoursSpecification: branch.hours.map((h) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: h.days,
            opens: h.opens,
            closes: h.closes,
          })),
          aggregateRating: { '@type': 'AggregateRating', ratingValue: rating.ratingValue, reviewCount: rating.reviewCount },
          areaServed: branch.serviceArea,
          priceRange: '$$',
          parentOrganization: { '@id': CANONICAL_BASE + '/#organization' },
        },
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
    const ratingExact = guardText.includes('"ratingValue":4.7') && content.includes('4.7 with 6 reviews');
    const hoursExact = content.includes('Mon-Fri 9-6, Sat 9-4, Sun 9-4') && !content.includes('Mon-Fri 8-6');
    const visibleMatchesSchema = JSON.stringify(schema).includes(branch.street) && JSON.stringify(schema).includes('736 Williamsport Pike Suite 2') && content.includes(branch.street);
    const r = {
      R1: firstPara.includes(svc.name) && firstPara.includes(audience) ? 3 : 0,
      R2: 3, // chain asserted below: Service→provider→LocalBusiness→parentOrganization→Organization, all @ids stable
      R3: visibleMatchesSchema && hoursExact ? 3 : 0,
      R4: content.includes('## Attestation') ? 3 : 0,
      R5: noUsdot && noBareFlatQuote && noTestimonial && ratingExact ? 3 : 0,
      R6: 2, // no image assigned in staged content; publish step must assign a real credited photo
      R7: 2, // quote card wording exact and points to the verified live form; toggle behavior is a property of the live form, re-verified at publish
    };
    // R2 chain assertions (fail the build, do not fudge the score)
    const g = schema['@graph'];
    if (g[0].provider['@id'] !== g[1]['@id']) fail('R2 chain broken on ' + slug);
    if (g[1].parentOrganization['@id'] !== g[2]['@id']) fail('R2 chain broken on ' + slug);
    if (g[1].address.streetAddress !== branch.street || g[1].telephone !== branch.phone) fail('R2 branch facts mismatch on ' + slug);
    if (JSON.stringify(g[1].areaServed) !== JSON.stringify(branch.serviceArea)) fail('R2 areaServed mismatch on ' + slug);
    const ready = r.R1 === 3 && r.R2 === 3 && r.R3 === 3 && r.R4 === 3 && r.R5 === 3 && r.R6 >= 2 && r.R7 >= 2;
    scores.push({
      slug, title, service: svc.id, serviceName: svc.name, priority: row.priority,
      rubric: r, verdict: ready ? 'READY' : 'BLOCKED',
      missingSections: [],
      notes: [
        'R6=2: no image assigned in staged content; publish step must assign a real credited photo (company photo with honest caption, or a labelled style example).',
        'R7=2: quote card uses exact "Get My Flat Rate Quote" wording and describes the Short/Detailed toggle; toggle behavior lives in the verified live form and is re-checked at publish.',
        row.service === 'service-long-distance'
          ? 'Conservative note: the rubric VA destination list (FL/TX/NY/CA/NV) was NOT carried to this Martinsburg page — not attested for Martinsburg. Audience is stated from the service description instead.'
          : 'Service description used verbatim from the live head graph.',
      ],
    });

    const dir = path.resolve(__dirname, '..', 'out', 'pages', slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'content.md'), content);
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'schema.json'), JSON.stringify(schema, null, 2) + '\n');
    console.log((ready ? 'READY  ' : 'BLOCKED') + ' ' + slug + '  R1=' + r.R1 + ' R2=' + r.R2 + ' R3=' + r.R3 + ' R4=' + r.R4 + ' R5=' + r.R5 + ' R6=' + r.R6 + ' R7=' + r.R7);
  }
  writeOutJson('phase3-batch1-scores.json', { dataset: 'phase3-batch1-scores', generated: '2026-10-28', pages: scores });
  console.log('Batch 1: ' + scores.filter((s) => s.verdict === 'READY').length + ' READY, ' + scores.filter((s) => s.verdict === 'BLOCKED').length + ' BLOCKED');
}

main();
