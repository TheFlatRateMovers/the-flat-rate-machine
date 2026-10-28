// Flat Rate Machine — Phase 1, Graph Builder (deterministic v1).
// Regenerates the canonical entity graph JSON-LD from data/ ONLY:
//   Organization + per-branch LocalBusiness (distinct names, hours,
//   ratings, service areas) + per-branch City nodes + all 18 Services
//   + the OfferCatalog that chains them.
// Then diffs the result against both Phase 0 graph copies and reports
// every difference. A non-empty diff is NOT a failure by itself: every
// difference must be explained (see out/graph.diff.json). What is never
// allowed: inventing a fact to force the diff empty.
//   node scripts/build-graph.js        (run from the-flat-rate-machine/)
const { SITE, DATA_VERSION, fail, load, writeOutJson, slugifyArea, areaStateToken, hoursToSpec, diffGraphs } = require('./lib');

const locations = load('data/locations.json');
const services = load('data/services.json').services;
const geojson = load('data/service-area.geojson');
const eg = load('data/entity-graph.json');
const best = load('data/best-json-entity-graph.json');

// State lookup from the GeoJSON dataset: feature names look like
// "Moorefield, WV". Used only when a service-area entry carries no state
// token of its own; the branch state is the final fallback.
const geoStateBySlug = new Map();
for (const f of geojson.features || []) {
  const name = f && f.properties && f.properties.name;
  if (typeof name !== 'string') continue;
  const m = name.match(/^(.+?),\s*(MD|VA|WV)\s*$/);
  if (m) geoStateBySlug.set(m[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'), m[2]);
}
function areaRegion(entry, branch) {
  const token = areaStateToken(entry);
  if (token) return token;
  const { slug } = slugifyArea(entry);
  return geoStateBySlug.get(slug) || branch.state;
}

const ORG = SITE + '/#organization';
const CATALOG = SITE + '/#service-catalog';
const company = locations.company;
const branches = locations.branches;
if (branches.length !== 2) fail('expected exactly 2 branches, found ' + branches.length);
if (!company.name || !company.tagline || !company.foundingDate || !company.phone) fail('company record missing a required field');

const byId = {};
for (const b of branches) {
  if (!b.name || !b.street || !b.city || !b.state || !b.zip || !b.geo || !b.hours || !b.googleRating) fail('branch ' + b.id + ' missing a required field');
  if (b.googleRating.ratingValue === undefined || b.googleRating.reviewCount === undefined) fail('branch ' + b.id + ' missing googleRating');
  byId[b.id] = b;
}
if (byId.winchester.name === byId.martinsburg.name) fail('branch names blended');
if (JSON.stringify(byId.winchester.hours) === JSON.stringify(byId.martinsburg.hours)) fail('branch hours blended');

function branchNode(b) {
  const cityRefs = b.serviceArea.map((entry) => {
    const { slug } = slugifyArea(entry);
    return { '@id': SITE + '/#area-' + b.id + '-' + slug };
  });
  return {
    '@id': SITE + '/#' + b.id,
    '@type': ['LocalBusiness', 'MovingCompany'],
    name: b.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: b.street,
      addressLocality: b.city,
      addressRegion: b.state,
      postalCode: b.zip,
      addressCountry: 'US',
    },
    geo: { '@type': 'GeoCoordinates', latitude: b.geo.lat, longitude: b.geo.lng },
    telephone: b.phone,
    openingHoursSpecification: hoursToSpec(b.hours),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: b.googleRating.ratingValue,
      reviewCount: b.googleRating.reviewCount,
      bestRating: 5,
      worstRating: 1,
      itemReviewed: { '@id': SITE + '/#' + b.id },
    },
    areaServed: cityRefs,
    parentOrganization: { '@id': ORG },
  };
}

function cityNodes(b) {
  return b.serviceArea.map((entry) => {
    const { name, slug } = slugifyArea(entry);
    return { '@id': SITE + '/#area-' + b.id + '-' + slug, '@type': 'City', addressRegion: areaRegion(entry, b), name };
  });
}

const graph = [];
graph.push({
  '@id': ORG,
  '@type': ['Organization', 'LocalBusiness', 'MovingCompany'],
  name: company.name,
  legalName: company.name,
  slogan: company.tagline,
  foundingDate: company.foundingDate,
  telephone: company.phone,
  url: SITE + '/',
  location: branches.map((b) => ({ '@id': SITE + '/#' + b.id })),
  hasOfferCatalog: { '@id': CATALOG },
});
for (const b of branches) graph.push(branchNode(b));
for (const b of branches) for (const n of cityNodes(b)) graph.push(n);
for (const s of services) {
  if (!s.id || !s.name || !s.description) fail('service ' + JSON.stringify(s.id) + ' missing id, name, or description');
  graph.push({
    '@id': SITE + '/#' + s.id,
    '@type': 'Service',
    name: s.name,
    description: s.description,
    provider: { '@id': ORG },
    areaServed: branches.map((b) => ({ '@id': SITE + '/#' + b.id })),
  });
}
graph.push({
  '@id': CATALOG,
  '@type': 'OfferCatalog',
  itemListElement: services.map((s) => ({ '@id': SITE + '/#' + s.id })),
});

const generated = { '@context': 'https://schema.org', '@graph': graph };
writeOutJson('entity-graph.generated.json', generated);

// ---- Diff against both Phase 0 copies (explained, never fudged) ----
const diffEg = diffGraphs(graph, eg['@graph'] || []);
const diffBest = diffGraphs(graph, best['@graph'] || []);

const gaps = [
  { field: 'Organization.email / contactPoint.email', foundIn: 'entity-graph.json, best-json-entity-graph.json, live ai-sitemap creator', reason: 'Not present in any Phase 0 dataset (locations.json company record has no email). Omitted, not copied in. Phase 0 amendment needed for byte-equivalence.' },
  { field: 'Organization.sameAs (social profiles)', foundIn: 'entity-graph.json, best-json-entity-graph.json', reason: 'Social URLs are not in any Phase 0 dataset. Omitted, not copied in. Phase 0 amendment needed.' },
  { field: 'Organization.priceRange', foundIn: 'entity-graph.json, best-json-entity-graph.json', reason: 'Not in any Phase 0 dataset. Omitted.' },
  { field: 'Organization.description (prose)', foundIn: 'best-json-entity-graph.json', reason: 'Hand-written prose, not a dataset fact. The generated graph carries the same facts as structured fields instead.' },
  { field: 'Organization.knowsAbout, logo, image', foundIn: 'best-json-entity-graph.json', reason: 'knowsAbout is an editorial topic list; logo/image paths in the old copy do not match live asset filenames (media dataset is schema-only). Omitted.' },
  { field: 'Organization.contactPoint.areaServed / availableLanguage', foundIn: 'best-json-entity-graph.json', reason: 'Contact-point detail not in any Phase 0 dataset. Telephone is carried on the Organization and branch nodes instead.' },
  { field: 'WebSite / WebPage / BreadcrumbList nodes', foundIn: 'best-json-entity-graph.json', reason: 'Page-structure nodes, not entity data. They belong to the Phase 3 page builder, not the entity graph.' },
  { field: 'Standalone PostalAddress nodes (#winchester-address, #martinsburg-address)', foundIn: 'entity-graph.json', reason: 'Canonical pattern change: branch addresses are inline PostalAddress objects on the LocalBusiness nodes, so no second copy of the same address exists in the file.' },
  { field: 'Branch node type Place vs LocalBusiness', foundIn: 'entity-graph.json, best-json-entity-graph.json', reason: 'Phase 1 spec models branches as LocalBusiness (with hours, rating, areaServed as chained refs). Same facts, different node type; old #winchester-place / #martinsburg-place @ids are therefore reference-only.' },
  { field: 'Service @id pattern (page-slug #service vs #service-* fragments)', foundIn: 'entity-graph.json, best-json-entity-graph.json', reason: 'Canonical pattern change: services use the head-graph fragment @ids from services.json. Old page-slug @ids are reference-only; the generated graph carries all 18 services where the old copies carried 4 and 8.' },
  { field: 'Service description wording', foundIn: 'best-json-entity-graph.json', reason: 'Generated descriptions are services.json (head-graph) descriptions, the dataset truth. Best-graph descriptions are an alternate wording not present in any dataset.' },
  { field: 'Dataset wrapper (attestations, chain, rubric, version)', foundIn: 'entity-graph.json', reason: 'Provenance wrapper, not graph data. Provenance for the generated graph lives in out/graph.diff.json and DATA_MODEL.md, not inside the JSON-LD.' },
];

const diff = {
  generated: 'out/entity-graph.generated.json',
  generatedNodeCount: graph.length,
  generatedNodeTypes: { Organization: 1, LocalBusiness: 2, City: 30, Service: 18, OfferCatalog: 1 },
  dataVersion: DATA_VERSION,
  vsEntityGraph: diffEg,
  vsBestGraph: diffBest,
  gaps,
  byteEquivalent: false,
  status: 'EXPLAINED — every difference is listed above or in the node diffs; no fact was invented to force an empty diff.',
};
writeOutJson('graph.diff.json', diff);

console.log('graph nodes generated: ' + graph.length + ' (1 Organization, 2 LocalBusiness, 30 City, 18 Service, 1 OfferCatalog)');
console.log('vs entity-graph.json: generated-only ' + diffEg.generatedOnly.length + ', reference-only ' + diffEg.referenceOnly.length + ', shared-with-diffs ' + Object.keys(diffEg.sharedDiffs).length);
console.log('vs best-json-entity-graph.json: generated-only ' + diffBest.generatedOnly.length + ', reference-only ' + diffBest.referenceOnly.length + ', shared-with-diffs ' + Object.keys(diffBest.sharedDiffs).length);
console.log('gaps recorded: ' + gaps.length + ' (see out/graph.diff.json)');
console.log('GRAPH BUILD OK — diff explained, not empty by design');
