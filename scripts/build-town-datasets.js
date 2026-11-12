#!/usr/bin/env node
/*
 * build-town-datasets.js — Scope A town dataset generator (2026-11-12).
 * One generic builder for the 12 town dataset families. For each town in
 * data/town-datasets-research.json it writes, from estate data only:
 *   PUB/datasets-<stem>.json — 11 nodes (5 Dataset / 3 Service / 3 Article)
 *     mirroring the local-regional pattern (dataset-pattern-spec §1):
 *     operations Service (all 34 registry services, researched top-6 first),
 *     market / services / coverage / intent-rubric Datasets, terms and
 *     personas Articles, protection-compliance Service, and the generated
 *     research Dataset / sources Article / boundaries Service (TW form:
 *     extension payloads ride as additionalProperty PropertyValue entries).
 *   PUB/dataset-<stem>.json — the landing jf (spec §3.4): 6 nodes, summary
 *     Dataset node with NO includedInDataCatalog and NO datePublished, a
 *     single-entry distribution, bare-ref spatialCoverage, about = the
 *     local-regional service ref + the town Place ref.
 * Dataset-file Dataset nodes carry: spatialCoverage = exactly the two full
 * branch Place objects (CV-6 rule, copied from the local-regional template
 * node); includedInDataCatalog = a spread copy of CATALOG from
 * lib-constants.js (never hardcoded); the canonical 5-entry distribution
 * whose self entry carries NO sha256 and whose other 4 sha256 values are
 * computed from the CURRENT files on disk in PUB (asserted equal to the
 * digests embedded in datasets-local-regional.json by the same method).
 * Dates: datePublished + dateModified = 2026-11-12 on the dataset file's
 * Dataset nodes; dateModified = 2026-11-12 on every other new node.
 * Deterministic: fixed town order from the store, indent-1 serialization,
 * no timestamps; a re-run yields byte-identical files.
 * Fail-loud assertions on every store payload, like the LR/TW builders.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
let SITE, CATALOG;
try { ({ SITE, CATALOG } = require(path.join(__dirname, 'lib-constants.js'))); }
catch (e) { ({ SITE, CATALOG } = require(path.join(ROOT, 'lib-constants.js'))); }
const DATE = '2026-11-12';
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const ORG = SITE + '/#organization';
const SVC_LR = SITE + '/#service-local-regional';
const fail = (m) => { throw new Error('build-town-datasets: ' + m); };
const clone = (o) => JSON.parse(JSON.stringify(o));
const sha256File = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

// ---- inputs -------------------------------------------------------------
const store = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'town-datasets-research.json'), 'utf8'));
if (!Array.isArray(store.towns) || store.towns.length !== 12) fail('store towns must be 12');
if ((store.process || []).length !== 7) fail('process must be 7');
if ((store.boundaries || []).length !== 3) fail('boundaries must be 3');
for (const t of store.towns) {
  if ((t.claims || []).length !== 4) fail(t.stem + ': claims must be 4');
  if ((t.personas || []).length !== 5) fail(t.stem + ': personas must be 5');
  if ((t.buyerIntentTerms || []).length !== 12) fail(t.stem + ': buyerIntentTerms must be 12');
  if ((t.topServices || []).length !== 6) fail(t.stem + ': topServices must be 6');
  if ((t.citations || []).length !== 5) fail(t.stem + ': citations must be 5');
  if (t.rubricServicesCovered !== 34) fail(t.stem + ': rubricServicesCovered must be 34');
  for (const c of t.claims) if (!c.source || !c.fact || !c.headline) fail(t.stem + ': claim missing fields: ' + c.id);
  if (t.auditPageSlug !== t.pageSlug) fail(t.stem + ': page slug disagrees with audit-datasets.json');
}
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'services.json'), 'utf8')).services;
if (registry.length !== 34) fail('service registry must be 34, got ' + registry.length);
const regById = new Map(registry.map((s) => [s.id, s]));

// Templates from the local-regional family (the pattern family, spec §1/§3).
const lrDoc = JSON.parse(fs.readFileSync(path.join(PUB, 'datasets-local-regional.json'), 'utf8'));
const template = lrDoc['@graph'].find((n) => (n['@id'] || '').endsWith('sizes-access'));
if (!template) fail('local-regional template node missing');
const lrOps = lrDoc['@graph'].find((n) => (n['@id'] || '').endsWith('operations'));
if (!lrOps || !lrOps.serviceFacts) fail('local-regional operations serviceFacts missing');
const jfLR = JSON.parse(fs.readFileSync(path.join(PUB, 'dataset-local-regional.json'), 'utf8'));
const jfOrg = jfLR['@graph'].find((n) => n['@type'] === 'Organization');
const jfPlaces = jfLR['@graph'].filter((n) => n['@type'] === 'Place');
const jfSummary = jfLR['@graph'].find((n) => n['@type'] === 'Dataset');
if (!jfOrg || jfPlaces.length !== 2 || !jfSummary) fail('local-regional jf template nodes missing');
const creatorFull = clone(template.creator);
const creatorShort = { '@id': ORG, 'sameAs': clone(template.creator.sameAs) };
const branchPlacesFull = clone(template.spatialCoverage); // exactly the two full branch Places (CV-6)
const branchRefs = [{ '@id': SITE + '/#winchester' }, { '@id': SITE + '/#martinsburg' }];

// Canonical distribution: digests computed from disk, proven against LR.
const DISK = [
  ['ai-sitemap.json', 'application/json'],
  ['service-area.geojson', 'application/json'],
  ['entity-graph.json', 'application/ld+json'],
  ['best-json-entity-graph.json', 'application/ld+json'],
];
const diskDigest = {};
for (const [f] of DISK) diskDigest[f] = sha256File(path.join(PUB, f));
for (const d of template.distribution) {
  if (d.sha256) {
    const f = d.contentUrl.slice(SITE.length + 1);
    if (diskDigest[f] !== d.sha256) fail('disk digest for ' + f + ' disagrees with the local-regional embedded digest — method or file changed');
  }
}
function distribution(stem) {
  const out = [{ '@type': 'DataDownload', 'contentUrl': SITE + '/datasets-' + stem + '.json', 'encodingFormat': 'application/json' }];
  for (const [f, fmt] of DISK) out.push({ '@type': 'DataDownload', 'contentUrl': SITE + '/' + f, 'encodingFormat': fmt, 'sha256': diskDigest[f] });
  return out;
}

// ---- per-town construction ----------------------------------------------
function buildTown(t) {
  const stem = t.stem;
  const LANDING = SITE + '/datasets/' + stem + '/';
  const NEW = LANDING + '#dataset-' + stem + '-';
  const placeRef = { '@id': SITE + '/#' + t.placeId };
  const townShort = t.placeName.split(',')[0];
  const townKey = (townShort + ' ' + t.state).toLowerCase();
  const branchRefsForTown = [];
  const branchIds = t.branch === 'both' ? ['place-winchester-va', 'place-martinsburg-wv'] : [t.branch === 'winchester' ? 'place-winchester-va' : 'place-martinsburg-wv'];
  for (const b of branchIds) { const r = { '@id': SITE + '/#' + b }; if (r['@id'] !== placeRef['@id']) branchRefsForTown.push(r); }
  const areaServed = [placeRef, ...branchRefsForTown];
  const branchPhrase = t.branch === 'both'
    ? 'served by both branches — the Winchester branch (The Flat Rate Movers) and the Martinsburg branch (Flat Rate Movers Martinsburg WV) — with branch binding \'both\' in the Territory Matrix'
    : t.branch === 'winchester'
      ? 'served from the Winchester branch (The Flat Rate Movers, Winchester VA)'
      : 'served from the Martinsburg branch (Flat Rate Movers Martinsburg WV)';
  // All 34 registry services: researched top-6 first, the rest in registry order.
  const orderedIds = [...t.topServices, ...registry.filter((s) => !t.topServices.includes(s.id)).map((s) => s.id)];
  if (orderedIds.length !== 34 || new Set(orderedIds).size !== 34) fail(stem + ': ordered service list is not 34 distinct');
  const ordered = orderedIds.map((id, i) => ({ rank: i + 1, '@id': SITE + '/#' + id, name: regById.get(id).name, showcase: i < 6 }));
  const topNames = ordered.slice(0, 6).map((s) => s.name);
  const keywords = ['movers in ' + townKey, 'moving company ' + townKey, townKey + ' movers', t.buyerIntentTerms[0].toLowerCase(), t.buyerIntentTerms[1].toLowerCase(), 'movers near me'];
  const pv = (name, value) => ({ '@type': 'PropertyValue', 'name': name, 'value': JSON.stringify(value) });

  function datasetNode(suffix, name, description, extra, generated) {
    const n = {
      '@id': NEW + suffix, '@type': 'Dataset', 'name': name, 'description': description,
      'keywords': keywords,
      'about': generated ? { '@id': SVC_LR } : [{ '@id': SVC_LR }],
      'spatialCoverage': clone(branchPlacesFull),
      'temporalCoverage': generated ? '2026' : '2010/2026',
      'dateModified': DATE,
      'creator': clone(creatorFull), 'publisher': clone(creatorFull),
      'license': LICENSE,
      'distribution': distribution(stem),
      'sameAs': LANDING, 'url': LANDING, 'identifier': LANDING,
      'isAccessibleForFree': true,
      'datePublished': DATE,
      'includedInDataCatalog': { ...CATALOG },
    };
    if (extra) n.additionalProperty = extra;
    return n;
  }
  function serviceNode(suffix, name, description, extra) {
    const n = {
      '@id': NEW + suffix, '@type': 'Service', 'name': name, 'description': description,
      'keywords': keywords,
      'about': [{ '@id': SVC_LR }],
      'spatialCoverage': clone(branchPlacesFull),
      'temporalCoverage': '2010/2026',
      'dateModified': DATE,
      'creator': clone(creatorShort),
      'license': LICENSE,
      'distribution': distribution(stem),
      'sameAs': LANDING,
      'provider': { '@id': ORG }, 'publisher': { '@id': ORG },
    };
    if (extra) for (const [k, v] of extra) n[k] = v;
    return n;
  }
  function articleNode(suffix, name, headline, description, extra) {
    const n = {
      '@id': NEW + suffix, '@type': 'Article', 'name': name, 'description': description,
      'keywords': keywords,
      'about': [{ '@id': SVC_LR }],
      'spatialCoverage': clone(branchPlacesFull),
      'temporalCoverage': '2010/2026',
      'dateModified': DATE,
      'creator': clone(creatorShort),
      'license': LICENSE,
      'distribution': distribution(stem),
      'sameAs': LANDING,
      'headline': headline,
      'author': { '@id': ORG }, 'publisher': { '@id': ORG },
    };
    if (extra) for (const [k, v] of extra) n[k] = v;
    return n;
  }

  const ops = serviceNode('operations', t.placeName + ' Moving Operations',
    'Moving operations in ' + t.placeName + ' (' + t.county + '), ' + branchPhrase + '. Every one of the 34 services in the company registry is offered in ' + t.placeName + '; the researched showcase order for this town leads with ' + topNames.join(', ') + ', followed by the remaining registry services in registry order. Each job is surveyed in full — scope, distance, manpower and equipment — and priced at one flat rate in writing before work begins; hourly pricing is available when a client asks for it. The town page for this dataset is ' + t.pageUrl + ', and the audiences recorded for the town in the service-area map are ' + t.audiences.join(', ') + '.',
    [['serviceType', 'Moving services in ' + t.placeName],
     ['url', t.pageUrl],
     ['areaServed', areaServed],
     ['additionalProperty', [
       pv('serviceFacts', clone(lrOps.serviceFacts)),
       pv('process', store.process),
       pv('servicesOffered', ordered),
       pv('topServices', t.topServices),
     ]]]);

  const market = datasetNode('market', t.placeName + ' Moving Market',
    'The moving market of ' + t.placeName + ' as published data: a ' + t.coveragePlaceNode['@type'] + ' in ' + t.county + ' (' + t.state + ' ' + t.postalCode + ') at latitude ' + t.latitude + ', longitude ' + t.longitude + ', ' + branchPhrase + '. Researched market note for this town: ' + t.marketNote + ' The audiences recorded for the town in service-area.geojson are ' + t.audiences.join(', ') + ', and the town\'s own page is ' + t.pageUrl + '. No prices, ratings or review counts are stated in this dataset — pricing is per job, quoted at one flat rate in writing after survey.', [
      pv('townPlace', { ...clone(t.coveragePlaceNode), 'county': t.county, 'postalCode': t.postalCode, 'branch': t.branch }),
      pv('marketNote', { 'note': t.marketNote, 'basis': t.topServicesBasis }),
    ], false);

  const services = datasetNode('services', 'Services Offered in ' + t.placeName,
    'The full service offer in ' + t.placeName + ': all 34 services in the company registry, ordered for this town from the researched top six — ' + topNames.join(', ') + ' — followed by the remaining 28 registry services in registry order: ' + ordered.slice(6).map((s) => s.name).join(', ') + '. The ordering is the town\'s showcase order from the 2026-11-12 top-services research (basis: ' + t.topServicesBasis + '); it ranks presentation, not availability — every listed service is offered in the town, ' + branchPhrase + '.', [
      pv('servicesOffered', ordered),
      pv('topServices', t.topServices),
    ], false);

  const contained = (t.coveragePlaceNode.containedInPlace || []).map((c) => c['@id']).join(' and ');
  const coverage = datasetNode('coverage', t.placeName + ' Coverage & Route Binding',
    'Coverage and route binding for ' + t.placeName + ', expressed by reference rather than by restated counts: this dataset binds the town\'s typed Territory Matrix place node (' + SITE + '/#' + t.placeId + ', a ' + t.coveragePlaceNode['@type'] + ' contained in ' + contained + ') and the coverage dataset itself (' + SITE + '/datasets/coverage/#dataset). The place node carries branchBinding \'' + t.coverageBranchBinding + '\', so ' + t.placeName + ' is ' + branchPhrase + '. Route pairs and coverage cells for the town live in the Territory Matrix and are read there; this node is the town-level pointer into that matrix, kept in step with it by @id.', [
      pv('coverageBinding', {
        'method': '@id reference to the coverage dataset and the typed place node; per-place cell/pair counts are not restated here',
        'coverageDataset': SITE + '/datasets/coverage/#dataset',
        'coverageLanding': SITE + '/datasets/coverage/',
        'placeNode': clone(t.coveragePlaceNode),
      }),
    ], false);

  const terms = articleNode('terms', t.placeName + ' Moving Terms', 'The terms every ' + t.placeName + ' move is quoted and run under',
    'The terms layer for moves in ' + t.placeName + ': every job is reviewed in full — scope, distance, manpower and equipment — and priced at one flat rate in writing before work begins; the flat rate is the standard offer and the guarantee, and hourly pricing is available when a client asks for it. Trucks are leased, and interstate work is performed by contractors who hold their own operating authority and proper equipment. No rate, range, minimum or fee for ' + t.placeName + ' is published in this dataset, because the survey governs each job and the written flat-rate quote is the price.');

  const personas = articleNode('personas', t.placeName + ' Buyer Personas', 'Who books moving work in ' + t.placeName + ', as data rows',
    'The buyer personas for ' + t.placeName + ' follow the audiences recorded for the town in service-area.geojson — ' + t.audiences.join(', ') + ' — expressed as five data rows in this node\'s additionalProperty: households moving in or out of the town, businesses relocating premises, industrial and warehouse operators, government offices and public institutions, and military households and units. Each row names its dominant intent against the town\'s showcase services (' + topNames.slice(0, 3).join(', ') + ' lead), so answer engines can match a ' + t.placeName + ' question to the audience asking it.',
    [['additionalProperty', [pv('personas', t.personas)]]]);

  const protection = serviceNode('protection-compliance', t.placeName + ' Protection & Compliance',
    'Protection and compliance for moves in ' + t.placeName + ': a written flat-rate quote stands behind every job, and the claims path follows the jurisdiction the move runs in — Virginia intrastate moves under the Virginia DMV household-goods rules, West Virginia intrastate moves under the Public Service Commission of West Virginia, and any move crossing a state line under the federal household-goods rules (49 CFR Part 375), performed by contractors holding their own operating authority. High-mass pieces in the 1,500 to 3,500 lb band move under SIR Structural Integrity Relocation with the KIM-GS Protocol and L/360 floor-deflection analysis; work in the up-to-25,000 lb class is delivered through contractors who work in that weight class.');

  const intent = datasetNode('intent-rubric', t.placeName + ' Intent Rubric',
    'The intent-rubric family for ' + t.placeName + ': ' + t.rubricRows + ' intent queries recorded for area \'' + t.placeId + '\' in the estate\'s rubric bank, covering ' + t.rubricServicesCovered + ' of 34 registry services — a complete family, with no service missing for this town. The bank as a whole holds ' + t.rubricBankTotal + ' rows (live count from rubric.db, 2026-11-12). The family\'s questions are the researched buyer-intent forms for each service in the town — navigational, cost, best-choice, how-to and AI-question forms — targeted at the town page ' + t.pageUrl + ', the service hubs and the branch pages as each row records. Counts are the bank\'s own; nothing is rounded or projected.', [
      pv('rubricFamily', {
        'area': t.placeId, 'rows': t.rubricRows, 'servicesCovered': t.rubricServicesCovered, 'servicesTotal': 34,
        'bankTotal': t.rubricBankTotal, 'source': 'rubric.db intent_query — live count by area, 2026-11-12',
        'targetPage': t.pageUrl,
      }),
    ], false);

  const research = datasetNode('research', t.placeName + ' Moving — Research Layer',
    'The sourced research layer under the ' + t.placeName + ' town dataset: four claims, each carried with its estate source (the service-area GeoJSON feature, the Territory Matrix place node, the live rubric-bank count for the town\'s family, and the researched market note for the town), the five buyer personas as data rows, and the twelve buyer-intent terms this town\'s showcase services generate. Every figure is quoted with its scope and never extended; market facts about employers and institutions are context for the town\'s demand, never company credentials.', [
      pv('researchClaims', t.claims),
      pv('personas', t.personas),
      pv('buyerIntentTerms', t.buyerIntentTerms),
    ], true);

  const sources = articleNode('sources', t.placeName + ' Moving — Primary Sources', 'The estate sources under the ' + t.placeName + ' town dataset',
    'Every factual claim in the ' + t.placeName + ' town dataset traces to one of the estate sources cited in this node: the service-area GeoJSON feature for the town (its coordinates, county, branch binding and audiences), the Territory Matrix coverage dataset\'s typed place node, the intent-coverage layer the rubric family is counted from, the town\'s own published page, and the local-regional dataset family whose pattern this town dataset mirrors. Figures keep the scope of the source they came from.',
    [['citations', t.citations]]);
  sources.temporalCoverage = '2026';

  const boundaries = serviceNode('boundaries', t.placeName + ' — Jurisdiction Boundaries',
    'The scope boundaries of moving work in ' + t.placeName + ' stated as data: a move that stays inside ' + (t.state === 'VA' ? 'Virginia is Virginia-intrastate (DMV certificate of fitness, filed tariffs, the bound-estimate rule, the 30/120-day claims clock)' : 'West Virginia is WV-intrastate (PSC certificate, PSC rate regulation, 150 CSR 9 insurance filings)') + '. A move that crosses a state line — including the short Winchester-to-Martinsburg run — is interstate and federal (49 CFR Part 375), performed by contractors holding their own operating authority. Pricing is quoted per job at one flat rate in writing; no rate schedule is published for this town.',
    [['additionalProperty', [pv('boundaries', store.boundaries)]]]);
  boundaries.temporalCoverage = '2026';

  const graph = [ops, market, services, coverage, terms, personas, protection, intent, research, sources, boundaries];
  if (graph.length !== 11) fail(stem + ': expected 11 nodes');
  const doc = { '@context': 'https://schema.org', '@graph': graph };

  // ---- landing jf (spec §3.4, as corrected: no catalog, no datePublished)
  const title = t.placeName + ' Moving Datasets';
  const summaryDesc =
    title + ' — the published datasets-' + stem + '.json dataset from The Flat Rate Movers (CC BY 4.0): the moving market, service offer, coverage binding and intent rubric of ' + t.placeName + ' (' + t.county + '), ' + branchPhrase + '. ' +
    'Researched market note: ' + t.marketNote + ' ' +
    'All 34 registry services are offered in ' + t.placeName + '; the town\'s researched showcase order leads with ' + topNames.join(', ') + ', and the full 34-service offer is enumerated, in that order, in the dataset file\'s services node and in the operations node\'s servicesOffered payload. ' +
    'The town\'s intent-rubric family carries ' + t.rubricRows + ' rows covering 34 of 34 services, counted live from the ' + t.rubricBankTotal + '-row rubric bank; its coverage binding rides the Territory Matrix place node ' + SITE + '/#' + t.placeId + ' with branchBinding \'' + t.coverageBranchBinding + '\'. ' +
    'Every job in the town is surveyed in full and priced at one flat rate in writing before work begins. The dataset\'s five Dataset nodes, three Service nodes and three Article nodes are published in the file linked below; the town page is ' + t.pageUrl + '.';
  const summary = {
    '@id': LANDING + '#dataset', '@type': 'Dataset', 'name': t.placeName + ' Moving Market, Services, Coverage & Intent',
    'description': summaryDesc,
    'url': LANDING, 'sameAs': LANDING, 'identifier': LANDING,
    'isAccessibleForFree': true,
    'license': LICENSE,
    'creator': clone(jfSummary.creator), 'publisher': clone(jfSummary.publisher),
    'dateModified': DATE,
    'temporalCoverage': '2010/2026',
    'spatialCoverage': clone(branchRefs),
    'keywords': keywords,
    'distribution': [{ '@type': 'DataDownload', 'contentUrl': SITE + '/datasets-' + stem + '.json', 'encodingFormat': 'application/json' }],
    'about': [{ '@id': SVC_LR }, clone(placeRef)],
  };
  const webPage = {
    '@type': 'WebPage', '@id': LANDING, 'url': LANDING, 'name': title,
    'image': { '@type': 'ImageObject', 'url': 'https://theflatratemovers.com/assets/img-01-9c77693ba66b.png', 'caption': 'The Flat Rate Movers logo — company brand image, not a job photo.' },
    'dateModified': DATE,
  };
  const breadcrumb = {
    '@id': LANDING + '#breadcrumb', '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'item': SITE + '/', 'name': 'Home', 'position': 1 },
      { '@type': 'ListItem', 'item': SITE + '/datasets/', 'name': 'Published Datasets', 'position': 2 },
      { '@type': 'ListItem', 'item': LANDING, 'name': title, 'position': 3 },
    ],
  };
  const jf = { '@context': 'https://schema.org', '@graph': [summary, clone(jfOrg), ...clone(jfPlaces), webPage, breadcrumb] };
  return { stem, doc, jf, summaryDesc };
}

let written = 0;
for (const t of store.towns) {
  const { stem, doc, jf } = buildTown(t);
  const f1 = path.join(PUB, 'datasets-' + stem + '.json');
  const f2 = path.join(PUB, 'dataset-' + stem + '.json');
  fs.writeFileSync(f1, JSON.stringify(doc, null, 1) + '\n');
  fs.writeFileSync(f2, JSON.stringify(jf, null, 1) + '\n');
  written += 2;
  console.log('WROTE', f1, '— 11 nodes (5 Dataset / 3 Service / 3 Article);', f2, '— 6 nodes');
}
console.log('build-town-datasets: wrote', written, 'files for', store.towns.length, 'towns');
