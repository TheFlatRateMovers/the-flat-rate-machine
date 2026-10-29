// Flat Rate Machine — Phase A, Dataset Builder (staged, 2026-10-29).
// Generates the staged Dataset JSON-LD drafts from the formulations in
// ../theflatratemovers/datasets-research-and-formulation-2026-10-29.md
// (Henry-approved research doc; descriptions/keywords transcribed verbatim
// except the five "dataset lines" categories, whose descriptions are
// formulated from the doc's dataset lines using only verified company
// facts — see datasets-manifest.json for the derivation note).
//   node scripts/build-datasets.js        (run from the-flat-rate-machine/)
// Output (staged only, never deployed by this script):
//   out/phase-a/dataset-developer.json      (master Dataset, Developer page)
//   out/phase-a/datasets-per-category.json  (@graph of 18 category Datasets)
//   out/phase-a/datasets-manifest.json      (status + sameAs + ship-batch)
// Rules enforced by this builder (fail = stop, never fudge):
//   - license is CC BY 4.0 on every node (decided 2026-10-29, §1 of the doc).
//   - descriptions are 50–5000 chars (Google uses only the first 5000).
//   - keywords are exactly the doc's GSC/SERP query lists — nothing added.
//   - spatialCoverage is the two branch @ids, never a merged list.
//   - staged nodes (no dedicated page yet) carry NO sameAs; the URL is
//     assigned when the page is built and the node ships with that batch.
//   - attestation questions stay OUT: no senior single-provider sentence,
//     no medical/cryogenic specifics, no contracts/clearances/discounts.
//   - banned strings anywhere fail the build: temp labor, crew page,
//     Spearman, Around Town, USDOT.
const fs = require('fs');
const path = require('path');
const { SITE, fail, load, writeOutJson } = require('./lib');

const ROOT = path.resolve(__dirname, '..');
const PAGES = load('data/pages.json').pages;
const bySlug = new Map(PAGES.map((p) => [p.slug, p.url]));
const PUBLIC = path.resolve(ROOT, '..', 'the-flat-rate-movers-pages', 'public');

const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const CREATOR = {
  '@id': SITE + '/#organization',
  '@type': 'Organization',
  name: 'The Flat Rate Movers',
  sameAs: [
    'https://www.instagram.com/theflatratemovers/',
    'https://www.threads.com/@theflatratemovers',
    'https://x.com/ratemovers',
    'https://www.youtube.com/@theflatratemovers',
    'https://github.com/TheFlatRateMovers',
    'https://medium.com/@ratemovers',
  ],
};
const SPATIAL = [{ '@id': SITE + '/#winchester' }, { '@id': SITE + '/#martinsburg' }];
const TEMPORAL = '2010/2026';
const MACHINE_DIST = [
  { '@type': 'DataDownload', name: 'AI Sitemap', contentUrl: SITE + '/ai-sitemap.json', encodingFormat: 'application/json' },
  { '@type': 'DataDownload', name: 'Service Area GeoJSON', contentUrl: SITE + '/service-area.geojson', encodingFormat: 'application/geo+json' },
  { '@type': 'DataDownload', name: 'Entity Graph', contentUrl: SITE + '/entity-graph.json', encodingFormat: 'application/ld+json' },
  { '@type': 'DataDownload', name: 'Best JSON Entity Graph', contentUrl: SITE + '/best-json-entity-graph.json', encodingFormat: 'application/ld+json' },
];
// Distribution for one category node: the 4 machine files + any per-page
// schema JSON that already exists in public/ for its sameAs pages.
function distributionFor(sameAsSlugs) {
  const dist = [...MACHINE_DIST];
  for (const slug of sameAsSlugs) {
    const f = path.join(PUBLIC, slug + '.json');
    if (fs.existsSync(f)) {
      dist.push({ '@type': 'DataDownload', name: 'Per-page schema: ' + slug, contentUrl: SITE + '/' + slug + '.json', encodingFormat: 'application/ld+json' });
    }
  }
  return dist;
}
function urlFor(slug) {
  const u = bySlug.get(slug);
  if (!u) fail('slug not in pages.json registry: ' + slug);
  return u;
}

// --- Category formulations (doc §4; order = doc order) ---
const CATS = [
  { slug: 'senior-moving', name: 'The Flat Rate Movers — Senior Moving Dataset',
    description: 'Senior moving services from The Flat Rate Movers, Winchester VA and Martinsburg WV: flat-rate moves quoted in writing for seniors downsizing, transitioning to assisted or independent living, or relocating closer to family, across the Shenandoah Valley and Eastern Panhandle. Includes packing support and the free video-walkthrough survey room (film only, no lifting) with a human-made estimate. Branches: Winchester (Mon-Fri 8-6, Sat 8-4, Sun 9-4) and Martinsburg WV (Mon-Fri 9-6, Sat 9-4, Sun 9-4). Phone +1-540-422-2153.',
    keywords: ['senior moving', 'senior movers near me', 'senior downsizing moving', 'senior relocation winchester va', 'senior relocation martinsburg wv'],
    sameAsSlugs: [], staged: true, shipsWith: 'Phase B senior package' },
  { slug: 'industrial-relocation', name: 'The Flat Rate Movers — Industrial Relocation Dataset',
    description: 'Industrial relocation services from The Flat Rate Movers: warehouse and distribution moves, commercial relocation and logistics including white-glove and blanket-wrap, FF&E installation and project support, and supervised workforce deployment for warehousing, manufacturing, transportation and logistics, retail distribution, 3PL, healthcare, commercial furniture, corporate offices, general contractors, educational, and hospitality and hotel renovation work. High-mass assets 1,500–3,500 lbs move under Structural Integrity Relocation (SIR) with floor deflection analysis to L/360. Quoted flat per job, agreed before dispatch. Dispatched from Winchester VA and Martinsburg WV on I-81, I-66, and I-70.',
    keywords: ['industrial relocation', 'industrial moving company virginia', 'warehouse relocation', 'industrial relocation services', 'plant relocation virginia'],
    sameAsSlugs: [], staged: true, shipsWith: 'Phase D industrial relocation package' },
  { slug: 'warehouse-relocation', name: 'The Flat Rate Movers — Warehouse Relocation Dataset',
    description: 'Warehouse relocation and load-out services from The Flat Rate Movers: warehouse and distribution moves, warehouse load-outs and inbound unloads, transload staging, and supervised warehouse teams, quoted per job with no required contract duration. Standard job pricing: Unload $8.00/CWT, Load $10.00/CWT, APU $12.00/CWT, Residential/Driver Meet $400–$425 per man, adjustable for scope, equipment, travel, and after-hours agreed before dispatch. Winchester VA and Martinsburg WV branches, I-81/I-66/I-70 dispatch.',
    keywords: ['warehouse relocation', 'warehouse load-outs', 'warehouse moving company virginia', 'inbound unloads', 'warehouse relocation services'],
    variableMeasured: 'CWT rates: Unload 8.00, Load 10.00, APU 12.00 USD/CWT',
    sameAsSlugs: [], staged: true, shipsWith: 'Phase C warehouse relocation package' },
  { slug: 'it-relocation', name: 'The Flat Rate Movers — IT Relocation Dataset',
    description: 'IT equipment and data center logistics from The Flat Rate Movers: servers, racks, and workstations moved in a planned, labelled sequence so systems come back up in order, as part of commercial and office relocations across the Shenandoah Valley and Eastern Panhandle. Commercial moves are planned around the operation: what moves first, what moves last, and what must be working on day one. Flat rate quoted in writing before move day. Winchester VA and Martinsburg WV.',
    keywords: ['IT equipment moving', 'IT relocation winchester va', 'data center logistics virginia', 'server rack movers', 'office IT relocation'],
    sameAsSlugs: ['it-equipment-moving-data-center-logistics-services-virginia'], staged: false, shipsWith: 'Phase C IT relocation package (page already live; node ships with that batch)' },
  { slug: 'medical-equipment-moving', name: 'The Flat Rate Movers — Medical Equipment Moving Dataset',
    description: 'Medical equipment moving from The Flat Rate Movers: high-value medical devices moved with the same high-value protection as safes, pianos, and antiques, under Structural Integrity Relocation for high-mass assets 1,500–3,500 lbs where applicable, flat rate quoted in writing. Winchester VA and Martinsburg WV, Shenandoah Valley and Eastern Panhandle.',
    keywords: ['medical equipment movers', 'medical device moving virginia', 'hospital equipment movers'],
    sameAsSlugs: [], staged: true, shipsWith: 'Phase D medical package' },
  { slug: 'cryogenic-moving', name: 'The Flat Rate Movers — Cryogenic Moving Dataset',
    description: 'Cryogenic moving from The Flat Rate Movers: cryogenic items moved as high-value, high-mass specialty work under Structural Integrity Relocation (1,500–3,500 lbs, floor deflection to L/360), flat rate quoted in writing, Winchester VA and Martinsburg WV.',
    keywords: ['cryogenic moving', 'cryogenic equipment movers virginia', 'specialty high-value moving'],
    sameAsSlugs: [], staged: true, shipsWith: 'Phase D cryogenic package' },
  { slug: 'ffe-installation', name: 'The Flat Rate Movers — FF&E Installation Dataset',
    description: 'FF&E installation and project support from The Flat Rate Movers: furniture, fixtures, and equipment installation and project support for commercial furniture dealers, corporate offices, and hospitality and hotel renovations, with supervised, self-managed teams, quoted per job. Winchester VA and Martinsburg WV, I-81/I-66/I-70.',
    keywords: ['FF&E installation', 'FF&E movers virginia', 'hotel furniture installation', 'commercial furniture installation'],
    sameAsSlugs: [], staged: true, shipsWith: 'Phase D FF&E package' },
  { slug: 'workforce-deployment', name: 'The Flat Rate Movers — Flexible Workforce Deployment Dataset',
    description: 'Flexible workforce deployment from The Flat Rate Movers: trained, supervised, self-managed moving and warehouse teams supporting contractors and project managers on military and regular household goods, warehouse, and residential jobs needing extra manpower — planned, overflow, peak, weekend, vacation, and emergency deployment, priced per job with no required contract duration. Standard job pricing: Unload $8.00/CWT, Load $10.00/CWT, APU $12.00/CWT, Residential/Driver Meet $400–$425 per man, adjustable for scope, equipment, travel, and after-hours agreed before dispatch. For project managers, contractors, and operations buyers. Winchester VA and Martinsburg WV.',
    keywords: ['specialized labor workforce', 'flexible workforce deployment', 'moving labor teams', 'warehouse labor support', 'military HHG labor support'],
    variableMeasured: 'CWT rates: Unload 8.00, Load 10.00, APU 12.00 USD/CWT',
    sameAsSlugs: [], staged: true, shipsWith: 'Phase D workforce package' },
  { slug: 'ispm15-crating', name: 'The Flat Rate Movers — ISPM 15 Export Packing and Custom Crating Dataset',
    description: 'ISPM 15 export packing and custom crating from The Flat Rate Movers: export packing and custom crates built to ISPM 15 (International Standards for Phytosanitary Measures No. 15), with loading, transloading, and final-mile delivery, and export and port work through the Virginia Inland Port and Port of Virginia chain. Winchester VA and Martinsburg WV.',
    keywords: ['ISPM 15 export packing', 'custom ISPM 15 crating', 'ISPM 15 crating winchester va', 'export packing virginia', 'custom crates'],
    sameAsSlugs: ['international-export-packing-crating-winchester-va', 'ispm15-movers-martinsburg-wv', 'crating-movers-martinsburg-wv'], staged: false, shipsWith: 'Phase D combined-crating package (pages already live; node ships with that batch)' },
  { slug: 'office-moving', name: 'The Flat Rate Movers — Office Moving Dataset',
    description: 'Office moving from The Flat Rate Movers: business relocations planned around the operation — what moves first, what moves last, and what the team needs working on day one — for shops, professional offices, commercial spaces, and industrial offices inside plants and warehouses, flat rate quoted in writing before move day. Winchester VA and Martinsburg WV.',
    keywords: ['office moving winchester va', 'corporate movers winchester va', 'office relocation virginia', 'business moving companies near me'],
    sameAsSlugs: ['office-moving-movers-winchester-va', 'office-moving-movers-martinsburg-wv'], staged: false, shipsWith: 'Phase E office push (pages already live; node ships with that batch)' },
  { slug: 'packing-services', name: 'The Flat Rate Movers — Packing Services Dataset',
    description: 'Packing services from The Flat Rate Movers: packing and unpacking for residential, commercial, and high-value moves, including export packing and custom crating, flat rate quoted in writing. Winchester VA and Martinsburg WV.',
    keywords: ['packing services winchester va', 'packing and unpacking movers', 'packing services for moving'],
    sameAsSlugs: ['packing-services-winchester-va', 'packing-movers-martinsburg-wv'], staged: false, shipsWith: 'Phase D Winchester packing page (new format) batch — Martinsburg page live; Winchester new-format page joins then' },
  { slug: 'transloading', name: 'The Flat Rate Movers — Transloading Dataset',
    description: 'Transloading from The Flat Rate Movers: container loading and unloading, transloading between truck, container, and warehouse, final-mile delivery, and warehouse and transload staging, with export and port work through the Virginia Inland Port and Port of Virginia chain. Winchester VA and Martinsburg WV, I-81/I-66/I-70.',
    keywords: ['transloading virginia', 'container transloading', 'port container transload', 'container loading unloading virginia'],
    sameAsSlugs: ['transloading-movers-martinsburg-wv', 'container-loading-unloading-services-port-transload-virginia'], staged: false, shipsWith: 'Phase C Winchester transloading page batch — Martinsburg page live; Winchester page joins then' },
  { slug: 'gun-safe-moving', name: 'The Flat Rate Movers — Gun Safe Moving Dataset',
    description: 'Gun safe moving from The Flat Rate Movers: gun safes and high-mass assets 1,500–3,500 lbs moved under Structural Integrity Relocation (SIR) and the Kinetic Integrity Method (KIM-GS) — route surveyed, floor checked to L/360, load spread and protected — flat rate quoted in writing. Winchester VA (Google 5.0, 1 review) and Martinsburg WV (Google 4.7, 6 reviews).',
    keywords: ['gun safe movers', 'gun safe movers winchester va', 'heavy gun safe moving', 'safe relocation virginia'],
    variableMeasured: 'Asset weight range 1,500–3,500 lbs; floor deflection L/360',
    sameAsSlugs: ['gun-safe-movers', 'gun-safe-movers-winchester-va', 'gun-safe-movers-martinsburg-wv'], staged: false, shipsWith: 'Phase E gun-safe push (pages already live; node ships with that batch)' },
  { slug: 'commercial-moving', name: 'The Flat Rate Movers — Commercial Moving Dataset',
    description: 'Commercial relocation from The Flat Rate Movers: commercial moves planned around the operation, flat rate quoted in writing, Structural Integrity Relocation for high-mass assets to 3,500 lbs, dispatched on I-81, I-66, and I-70. Winchester VA and Martinsburg WV.',
    keywords: ['commercial moving', 'commercial movers winchester va'],
    sameAsSlugs: ['commercial-moving', 'commercial-movers-winchester-va'], staged: false, shipsWith: 'Phase E commercial depth (pages already live; node ships with that batch)',
    derivation: 'Description formulated from the doc §4 dataset line (commercial relocation planned around the operation, flat rate in writing, SIR to 3,500 lbs, I-81/I-66/I-70) using only verified company facts.' },
  { slug: 'local-residential-moving', name: 'The Flat Rate Movers — Local and Residential Moving Dataset',
    description: 'Residential and local moving from The Flat Rate Movers: house and apartment moves, local and regional, flat rate quoted in writing, from Winchester VA and Martinsburg WV across the Shenandoah Valley and Eastern Panhandle.',
    keywords: ['movers near me', 'moving companies winchester va', 'local moving', 'apartment moves', 'moving and storage'],
    sameAsSlugs: ['residential-moving', 'local-regional-moving', 'local-regional-movers-winchester-va', 'local-regional-movers-martinsburg-wv'], staged: false, shipsWith: 'Phase E local/residential depth (pages already live; node ships with that batch)',
    derivation: 'Description formulated from the doc §4 dataset line (residential and local moves, flat rate, both branches, near-me intent) using only verified company facts.' },
  { slug: 'long-distance-moving', name: 'The Flat Rate Movers — Long-Distance Moving Dataset',
    description: 'Long-distance and interstate moving from The Flat Rate Movers: cross-country and interstate moves on a flat rate agreed in writing before move day, dispatched on I-81, I-66, and I-70 from Winchester VA and Martinsburg WV.',
    keywords: ['cross country movers', 'long distance movers winchester va', 'flat-rate pricing interstate moves'],
    sameAsSlugs: ['long-distance-movers-winchester-va', 'long-distance-movers-martinsburg-wv'], staged: false, shipsWith: 'Phase E long-distance depth (pages already live; node ships with that batch)',
    derivation: 'Description formulated from the doc §4 dataset line (long-distance and interstate moves on a flat rate agreed in writing, I-81/I-66/I-70 corridors) using only verified company facts.' },
  { slug: 'military-government-moving', name: 'The Flat Rate Movers — Military and Government Moving Dataset',
    description: 'Military and government moving from The Flat Rate Movers: military household goods (HHG) and government office moves, flat rate quoted in writing. Winchester VA and Martinsburg WV.',
    keywords: ['military moving', 'government moving', 'HHG movers virginia'],
    sameAsSlugs: ['military-government-moving', 'military-movers-winchester-va', 'military-movers-martinsburg-wv', 'government-movers-winchester-va', 'government-movers-martinsburg-wv'], staged: false, shipsWith: 'Phase E military/government depth (pages already live; node ships with that batch)',
    derivation: 'Description formulated from the doc §4 dataset line (military household goods and government office moves, flat rate; no contracts/clearances/discounts claimed) using only verified company facts.' },
  { slug: 'junk-removal', name: 'The Flat Rate Movers — Junk Removal Dataset',
    description: 'Junk and debris removal from The Flat Rate Movers: junk and debris removal as part of downsizing and commercial clear-outs. Winchester VA and Martinsburg WV.',
    keywords: ['junk haulers near me'],
    sameAsSlugs: [], staged: true, shipsWith: 'Phase B junk light package — dataset line only; full page only if Henry wants it',
    derivation: 'Description formulated from the doc §4 dataset line (junk and debris removal as part of downsizing and commercial clear-outs, Winchester VA and Martinsburg WV) using only verified company facts. Keywords limited to the single cited GSC query.' },
];

const BANNED = [/temp labor/i, /crew page/i, /spearman/i, /around town movers/i, /USDOT/i, /MC-\d{4,}/];
function buildNode(c) {
  if (c.description.length < 50 || c.description.length >= 5000) fail(c.slug + ' description length ' + c.description.length + ' outside 50–5000');
  if (!c.keywords.length) fail(c.slug + ' has no keywords');
  const sameAs = c.sameAsSlugs.map(urlFor);
  const node = {
    '@type': 'Dataset',
    '@id': SITE + '/#dataset-' + c.slug,
    name: c.name,
    description: c.description,
    keywords: c.keywords,
    spatialCoverage: SPATIAL,
    temporalCoverage: TEMPORAL,
    dateModified: '2026-10-29',
    creator: CREATOR,
    license: LICENSE,
    distribution: distributionFor(c.sameAsSlugs),
  };
  if (c.variableMeasured) node.variableMeasured = c.variableMeasured;
  if (sameAs.length) node.sameAs = sameAs;
  const text = JSON.stringify(node);
  for (const rx of BANNED) if (rx.test(text)) fail(c.slug + ' contains banned string ' + rx);
  return node;
}

const nodes = CATS.map(buildNode);

// --- Master Dataset (doc §3) ---
const master = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  '@id': SITE + '/developer/#dataset',
  name: 'The Flat Rate Movers — Service, Area, and Authority Datasets',
  description: 'Machine-readable service, service-area, and entity data for The Flat Rate Movers, a flat-rate moving company founded June 2010, based in Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free. Services include residential, commercial, office, long-distance, military and government, packing, ISPM 15 export packing and custom crating, transloading, final-mile delivery, gun-safe, piano, antique, medical, cryogenic, senior, industrial relocation, warehouse relocation, IT relocation, FF&E installation, and supervised workforce deployment, with Structural Integrity Relocation (SIR) for high-mass assets 1,500–3,500 lbs and floor deflection analysis to L/360. Coverage: 52 service areas across the Shenandoah Valley and Eastern Panhandle, dispatched on I-81, I-66, and I-70, with export and port work through the Virginia Inland Port and Port of Virginia chain. Branches are distinct: The Flat Rate Movers, Winchester VA (116 W Piccadilly St Suite 11, Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google 5.0 from 1 review) and Flat Rate Movers Martinsburg WV (736 Williamsport Pike Suite 2, Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google 4.7 from 6 reviews). Phone +1-540-422-2153.',
  keywords: ['flat rate movers', 'moving companies winchester va', 'movers martinsburg wv', 'SIR', 'KIM-GS', 'ISPM 15', 'transloading', 'gun safe movers', 'senior moving', 'industrial relocation', 'warehouse relocation'],
  spatialCoverage: SPATIAL,
  temporalCoverage: TEMPORAL,
  dateModified: '2026-10-29',
  creator: CREATOR,
  license: LICENSE,
  distribution: MACHINE_DIST,
  url: SITE + '/developer/',
};
if (master.description.length >= 5000) fail('master description too long: ' + master.description.length);
for (const rx of BANNED) if (rx.test(JSON.stringify(master))) fail('master contains banned string ' + rx);

const manifest = {
  note: 'STAGED Phase A 2026-10-29 — Dataset drafts per datasets-research-and-formulation-2026-10-29.md. NOTHING HERE IS LIVE. The master node deploys to the Developer page only with Henry batch approval; each per-category node deploys to its category page in its own batch. dateModified 2026-10-29 is the DRAFT date and must be re-stamped to the actual deploy date at deploy time. Attribution for CC BY 4.0 reuse: "The Flat Rate Movers, https://theflatratemovers.com/". Proprietary carve-out: SIR/KIM-GS method internals, authority book content, and non-public business data are NOT in these datasets.',
  license: LICENSE,
  licenseNote: 'CC BY 4.0 decided 2026-10-29 (research doc §1). CC0 rejected (waives attribution); CC BY-NC rejected (excludes commercial AI systems). Henry may change the license at batch approval time; until then it is decided, not blank.',
  master: { file: 'out/phase-a/dataset-developer.json', name: master.name, shipsWith: 'Phase A review + deploy batch (Developer page)' },
  categories: CATS.map((c, i) => ({
    slug: c.slug,
    name: c.name,
    status: c.staged ? 'staged' : 'ready',
    sameAs: c.staged ? 'PENDING — assigned when the page is built; node ships with its page batch, never before' : c.sameAsSlugs.map(urlFor),
    distributionFiles: nodes[i].distribution.length,
    shipsWith: c.shipsWith,
    ...(c.derivation ? { derivation: c.derivation } : {}),
  })),
  excludedAttestations: [
    'Senior single-provider / no-subcontracted-crew-swap sentence — NOT claimed (attestation question, research doc §4).',
    'Medical device classes, facility types, handling procedures — NOT claimed (attestation question).',
    'Cryogenic item classes, handling procedures — NOT claimed (attestation question).',
    'Military/government contracts, clearances, discounts — NOT claimed.',
    'No USDOT/MC number, no license details, no invented prices anywhere.',
  ],
};

writeOutJson('phase-a/dataset-developer.json', master);
writeOutJson('phase-a/datasets-per-category.json', { '@context': 'https://schema.org', '@graph': nodes });
writeOutJson('phase-a/datasets-manifest.json', manifest);
console.log('datasets: master 1 + categories ' + nodes.length + ' (ready ' + CATS.filter((c) => !c.staged).length + ', staged ' + CATS.filter((c) => c.staged).length + ')');
console.log('DATASET BUILD OK — staged only, nothing deployed');
