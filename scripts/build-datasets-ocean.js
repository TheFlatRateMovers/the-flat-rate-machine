// Flat Rate Machine — Phase A, Ocean Container Dataset Builder (staged, 2026-10-29).
// Generates the staged D1–D8 Dataset JSON-LD nodes from the formulations in
// ../theflatratemovers/ocean-container-datasets-2026-10-29.md §6.
//   node scripts/build-datasets-ocean.js  (run from the-flat-rate-machine/)
// Output (staged only, never deployed by this script):
//   out/phase-a/datasets-ocean-container.json  (@graph of 8 Dataset nodes)
//   out/phase-a/datasets-ocean-manifest.json  (status + sameAs + gating notes)
// Rules enforced by this builder (fail = stop, never fudge):
//   - license is CC BY 4.0 on every node; creator is the organization @id.
//   - keywords are exactly the doc §6 lists — nothing added.
//   - spatialCoverage is the two branch @ids, never a merged list.
//   - temporalCoverage is 2010/2026; descriptions are 50–5000 chars.
//   - GATED fields are omitted, never guessed: no Port of Virginia terminal
//     names (NIT/VIG/PMT/RMT), no bonded/FTZ claim, no customs-brokerage
//     claim, no reefer/cold-chain capability claim, no drayage fleet or
//     chassis-ownership claim, no standalone-container rate (the industrial
//     CWT schedule is NOT extended to standalone unloads), no container
//     type claimed as company-handled beyond general container handling
//     already published, no TWIC-card credential claim (TWIC labor is
//     published text/slug only). Gating sentences in D3/D4/D5/D7 state
//     these boundaries explicitly instead of silently dropping them.
//   - Distribution includes ONLY real per-page JSON files: a .json URL
//     returning 200 text/html is the SPA fallback, NOT a JSON file
//     (verified live 2026-10-29: old container .json URLs return
//     text/html ~1MB index.html). The builder checks public/ on disk, so
//     fallback URLs can never enter distribution.
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
function distributionFor(sameAsSlugs) {
  const dist = [...MACHINE_DIST];
  for (const slug of sameAsSlugs) {
    // On-disk check ONLY: a .json URL that returns SPA-fallback HTML has
    // no file here and must never enter distribution.
    if (fs.existsSync(path.join(PUBLIC, slug + '.json'))) {
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
// Claim patterns that must NEVER appear in a D-node description.
const CLAIM_BANNED = [
  /\bNIT\b/, /\bVIG\b/, /\bPMT\b/, /\bRMT\b/,
  /customs brokerage/i, /bonded warehouse (operat|offer|provid|stor)/i, /\bFTZ\b.{0,40}(operat|offer|provid)/i,
  /chassis (owned|ownership|fleet)/i, /company trucks/i, /drayage fleet/i,
  /reefer (capability|handling|service)/i, /cold-chain (capability|service)/i,
  /TWIC(-certified| cards| holders)/i, /USDOT/i, /MC-\d{4,}/, /temp labor/i, /crew page/i,
];

const D = [
  { slug: 'container-operations', code: 'D1', name: 'The Flat Rate Movers — Container Loading and Unloading Operations Dataset',
    about: [SITE + '/#service-transloading'],
    description: 'Container loading and unloading operations from The Flat Rate Movers: loading (stuffing) and unloading (devanning/destuffing) of ocean containers for port transload in Virginia, through the Virginia Inland Port and Port of Virginia chain, with warehouse and transload staging, final-mile delivery, and supervised teams. Operations cover floor-loaded and palletized cargo. Verified process steps: pre-arrival plan, port release, drayage-in, unload, count, inspect, photograph, report. Same-day unload is stated as a service pattern, not a guarantee. Photo record covers doors, seal, condition, and load; exceptions (damage, shortage, overage) are reported the same day, in writing. Domain facts (general industry knowledge): a 40ft container holds about 20 pallet positions and a 20ft about 10; floor-loaded containers need disciplined pace and safe sequencing; damage caught at devanning is caught before inland travel.',
    keywords: ['container loading unloading virginia', 'container unloading services', 'ocean container unloading', 'devanning virginia', 'container devanning services'],
    sameAsSlugs: ['container-loading-unloading-services-port-transload-virginia', 'port-of-virginia-container-loading-unloading-logistics-services', 'virginia-inland-port-freight-transloading-operations'],
    staged: false, shipsWith: 'Ocean container batch (pages already live; node ships with that batch). Note: the three pages have NO standalone per-page JSON (their .json URLs return SPA-fallback HTML) — distribution therefore carries only the 4 machine files until Phase D adds real per-page JSONs.' },
  { slug: 'transload-operations', code: 'D2', name: 'The Flat Rate Movers — Transload, Cross-Dock and Deconsolidation Operations Dataset',
    about: [SITE + '/#service-transloading'],
    description: 'Transload, cross-dock, and deconsolidation operations from The Flat Rate Movers: transloading between truck, container, and warehouse; deconsolidation in defined steps (receive, unload, count, sort by destination, stage, build outbound); and the logistics event protocol (quote, transload, deliver, verified placement). Inbound is the ocean container; outbound is the 53ft domestic trailer, LTL, FTL, or split delivery. Cross-dock dwell is hours, not days; transload is immediate or short storage. Rework covers palletizing, shrink-wrap, labeling, sorting by purchase order, SKU, or destination, segregation, and relabeling; empties return before per-diem charges. Martinsburg transloading page and industrial-page transload staging are published. Domain facts (general industry knowledge): transload converts 40HC ocean loads to trailer loads for inland destinations; multi-destination break-bulk fans one container to several distribution centers the same day; cross-docking removes line-haul legs and handling events versus terminal LTL.',
    keywords: ['transloading virginia', 'cross-docking virginia', 'container deconsolidation', 'transload port of virginia', 'container transloading services'],
    sameAsSlugs: ['container-deconsolidation-cross-docking-transloading-services-virginia', 'container-deconsolidation-services-virginia-mid-atlantic', 'docs/container-deconsolidation', 'transloading-movers-martinsburg-wv'],
    staged: false, shipsWith: 'Ocean container batch (pages already live; node ships with that batch)' },
  { slug: 'container-taxonomy', code: 'D3', name: 'The Flat Rate Movers — Container Equipment Taxonomy Dataset',
    about: [SITE + '/#service-transloading', SITE + '/#service-sir-heavy'],
    description: 'Container equipment taxonomy (general industry reference, typical values only — the CSC plate on each box governs): 20ft general purpose (~33 cubic meters, ~28,200 kg max payload), 40ft general purpose (~67 cubic meters, ~26,700 kg), 40ft high cube (~76 cubic meters, ~26,580 kg), 20ft reefer (~28 cubic meters, ~27,400 kg), 40ft high-cube reefer (~67 cubic meters, ~25,600 kg, range −30°C to +30°C), open top, flat rack, platform, tank (20ft ISO), ventilated, pallet-wide, and side-opening / double-door / half-height types. Maximum gross mass for most dry containers is typically 30,480 kg; some 20ft boxes are plated higher. Company-handled scope is gated: no container type is claimed as company-handled beyond general container loading and unloading already published. Reefer and cold-chain capability is not claimed. Heavy equipment moves under Structural Integrity Relocation for high-mass assets 1,500–3,500 lbs with floor deflection analysis to L/360.',
    keywords: ['container sizes', '20ft container dimensions', '40ft high cube capacity', 'reefer container sizes', 'flat rack container', 'open top container'],
    sameAsSlugs: [],
    staged: true, shipsWith: 'Phase D container types/sizes reference page (page proposal (c)) — node ships with that page, never before' },
  { slug: 'port-chain', code: 'D4', name: 'The Flat Rate Movers — Port Chain and Corridor Network Dataset',
    about: [SITE + '/#service-transloading'],
    description: 'Port chain and corridor network for The Flat Rate Movers: export and port work through the Virginia Inland Port and Port of Virginia chain, three-corridor dispatch (I-81, I-66, I-70) from the Winchester VA and Martinsburg WV branches, and final-mile delivery. Chain legs run port, inland port, warehouse or distribution center, final mile. Modes are ocean, drayage truck, and domestic trailer; the rail ramp leg is domain-only (handled by the railroad, not claimed). Domain facts (general industry knowledge): intermodal means standardized containers transferring between modes without repacking; drayage is usually 100 miles or less; port-adjacent transload facilities act as handoff points between international and domestic networks. Gating: no Port of Virginia terminal is named; drayage fleet and chassis ownership are not claimed — both are attestation questions.',
    keywords: ['port of virginia container services', 'virginia inland port transloading', 'port drayage virginia', 'intermodal virginia'],
    sameAsSlugs: ['port-of-virginia-container-loading-unloading-logistics-services', 'virginia-inland-port-freight-transloading-operations'],
    staged: false, shipsWith: 'Ocean container batch (pages already live; node ships with that batch)' },
  { slug: 'commercial-terms', code: 'D5', name: 'The Flat Rate Movers — Commercial Terms and Cost Drivers Dataset',
    about: [SITE + '/#service-transloading'],
    description: 'Commercial terms and cost drivers for container work (domain mechanics plus verified company pricing basis): free time, last free day (LFD), demurrage (box sitting at the terminal past free time), detention and per-diem (box kept outside the terminal), chassis, tri-axle, overweight permit, IPI, and the transload alternative. Cost logic: move inside free time; transloading removes container weight from the permitting equation; 3PL storage is cheaper than port demurrage. Company pricing basis (verified, published): flat rate quoted in writing before move day for all services, and per-job pricing with no required contract duration for industrial-commercial project support. Gating: a per-container or per-CWT rate for standalone container unloads is not claimed — whether the industrial CWT schedule (Unload $8.00/CWT, Load $10.00/CWT, APU $12.00/CWT, Residential/Driver Meet $400–$425 per man) extends to standalone unloads is an attestation question, and that schedule is cited here only as the industrial-commercial schedule, not as a container rate.',
    keywords: ['demurrage avoidance', 'container detention charges', 'free time container', 'overweight container transload', 'port congestion drayage'],
    sameAsSlugs: [],
    staged: true, shipsWith: 'Phase D demurrage/detention/free-time cost-avoidance page (page proposal (d)) — node ships with that page, never before' },
  { slug: 'buyer-personas', code: 'D6', name: 'The Flat Rate Movers — Buyer Personas and Trigger Events Dataset',
    about: [SITE + '/#service-transloading', SITE + '/#service-industrial-commercial'],
    description: 'Buyer personas and trigger events for container unloading and transload work: importers and distributors, retailers and e-commerce businesses, 3PLs, freight forwarders and brokers, manufacturers, warehouses and distribution centers, and project cargo owners. Trigger events: port congestion, free-time expiry, multi-destination split, overweight box, recurring volume, surge or overflow, and emergency shift or tip (published emergency port container recovery page). Buying criteria: dock reliability, pace, sequencing, communication, same-day exception reporting, and one accountable team. Company facts (verified, published): emergency port container recovery page, supervised teams, per-job pricing, and GBP products including Ocean Container Handling, Transloading, and Restacking. Quote path per persona is the B2B job-details route on the industrial page plus the main quote toggle.',
    keywords: ['container unloading services for importers', '3PL container unloading', 'warehouse container unloading', 'emergency container recovery virginia'],
    sameAsSlugs: ['emergency-port-container-recovery-twic-labor-virginia', 'industrial-commercial-services'],
    staged: false, shipsWith: 'Ocean container batch (pages already live; node ships with that batch)' },
  { slug: 'compliance-access', code: 'D7', name: 'The Flat Rate Movers — Compliance, Access and Handling Dataset',
    about: [SITE + '/#service-transloading', SITE + '/#service-ispm15'],
    description: 'Compliance, access, and handling for container work. Access: TWIC labor is published (emergency port container recovery page slug; 15 lowercase mentions site-wide) — TWIC is the port access credential as a domain fact, but whether teams hold TWIC cards is an attestation question and is NOT claimed here. Export compliance: ISPM 15 (International Standards for Phytosanitary Measures No. 15) export packing and custom crating are published, with pages. Handling: bracing, lashing, and securing are domain practice; SIR heavy method covers high-mass assets 1,500–3,500 lbs with floor deflection analysis to L/360 (published). Gating: customs brokerage is not claimed; bonded warehouse and foreign-trade-zone space are not claimed (0 mentions on site); reefer and cold-chain capability are not claimed (0 mentions on site). Every compliance-adjacent field here is either published or explicitly gated.',
    keywords: ['TWIC labor virginia', 'ISPM 15 export packing', 'container bracing lashing', 'port container recovery'],
    sameAsSlugs: ['emergency-port-container-recovery-twic-labor-virginia', 'international-export-packing-crating-winchester-va', 'ispm15-movers-martinsburg-wv', 'crating-movers-martinsburg-wv'],
    staged: false, shipsWith: 'Ocean container batch (pages already live; node ships with that batch)' },
  { slug: 'areas-dispatch', code: 'D8', name: 'The Flat Rate Movers — Service Areas, Dispatch and Quote Path Dataset',
    about: [SITE + '/#service-transloading', SITE + '/#service-final-mile', SITE + '/#service-industrial-commercial'],
    description: 'Service areas, dispatch, and quote path for container work. Areas: 52 GeoJSON features — Winchester 31 (GBP 16 + extended 15), Martinsburg 35 (GBP 14 + extended 21), 14 shared, never merged. Branches: Winchester — The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601, Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google 5.0 from 1 review; Martinsburg — Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg WV 25404, Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google 4.7 from 6 reviews. Dispatch on I-81, I-66, and I-70 from both branches. Quote path: Short/Detailed toggle, "Get My Flat Rate Quote", verified on the pattern, never by test post. Survey note: the film-only video walkthrough survey room is for move surveys; container jobs use the job-details route on the industrial page — the two are not conflated.',
    keywords: ['container services winchester va', 'transloading martinsburg wv', 'container unloading shenandoah valley', 'port services eastern panhandle'],
    sameAsSlugs: ['transloading-movers-martinsburg-wv', 'industrial-commercial-services'],
    staged: false, shipsWith: 'Ocean container batch (pages already live; node ships with that batch). Note: the Winchester new-format transloading page joins in Phase D.' },
];

function buildNode(d) {
  if (d.description.length < 50 || d.description.length >= 5000) fail(d.slug + ' description length ' + d.description.length);
  if (!d.keywords.length) fail(d.slug + ' has no keywords');
  const sameAs = d.sameAsSlugs.map(urlFor);
  const node = {
    '@type': 'Dataset',
    '@id': SITE + '/#dataset-ocean-' + d.slug,
    name: d.name,
    description: d.description,
    keywords: d.keywords,
    about: d.about.map((id) => ({ '@id': id })),
    spatialCoverage: SPATIAL,
    temporalCoverage: TEMPORAL,
    dateModified: '2026-10-29',
    creator: CREATOR,
    license: LICENSE,
    distribution: distributionFor(d.sameAsSlugs),
  };
  if (sameAs.length) node.sameAs = sameAs;
  const text = JSON.stringify(node);
  // Scan for claims, not for gating sentences: remove sentences that
  // explicitly negate a claim ("... is not claimed") before matching,
  // so stating a boundary can never trip the guard.
  const textForScan = text.replace(/[^."]*not claimed[^."]*\.?/gi, '');
  for (const rx of CLAIM_BANNED) if (rx.test(textForScan)) fail(d.slug + ' contains banned claim pattern ' + rx);
  return node;
}

const nodes = D.map(buildNode);
const manifest = {
  note: 'STAGED Phase A 2026-10-29 — Ocean container D1–D8 Dataset drafts per ocean-container-datasets-2026-10-29.md §6. NOTHING HERE IS LIVE. Each node deploys to its category page in its own batch; staged nodes (D3, D5) ship only with their Phase D pages. dateModified 2026-10-29 is the DRAFT date and must be re-stamped to the actual deploy date at deploy time. Attribution for CC BY 4.0 reuse: "The Flat Rate Movers, https://theflatratemovers.com/".',
  license: LICENSE,
  correctionsApplied: [
    'Old container pages have NO standalone per-page JSON: their .json URLs return HTTP 200 with Content-Type text/html (SPA fallback, ~1MB index.html, verified live 2026-10-29). Distribution therefore includes per-page JSONs ONLY where a real file exists on disk (transloading-movers-martinsburg-wv.json, industrial-commercial-services.json). Status 200 alone never counts as a JSON file.',
    'TWIC coverage EXISTS and is not reported as missing: TWIC labor is published (emergency page slug; 15 lowercase mentions site-wide, verified by grep 2026-10-29). Only TWIC-card credential detail is gated (attestation question Q2).',
    'Gated fields omitted, never guessed: no Port of Virginia terminal names (NIT/VIG/PMT/RMT), no bonded/FTZ claim, no customs-brokerage claim, no reefer/cold-chain capability claim, no drayage fleet or chassis-ownership claim, no standalone-container rate, no container type claimed as company-handled beyond general handling already published. D3/D4/D5/D7 descriptions state these boundaries explicitly.',
  ],
  nodes: D.map((d, i) => ({
    code: d.code, slug: d.slug, name: d.name,
    status: d.staged ? 'staged' : 'ready',
    sameAs: d.staged ? 'PENDING — assigned when the page is built; node ships with its page batch, never before' : d.sameAsSlugs.map(urlFor),
    distributionFiles: nodes[i].distribution.length,
    shipsWith: d.shipsWith,
  })),
};

writeOutJson('phase-a/datasets-ocean-container.json', { '@context': 'https://schema.org', '@graph': nodes });
writeOutJson('phase-a/datasets-ocean-manifest.json', manifest);
console.log('ocean datasets: ' + nodes.length + ' (ready ' + D.filter((d) => !d.staged).length + ', staged ' + D.filter((d) => d.staged).length + ')');
console.log('OCEAN DATASET BUILD OK — staged only, nothing deployed');
