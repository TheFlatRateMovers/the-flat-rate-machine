#!/usr/bin/env node
'use strict';
/*
 * build-ports.js — Ports & Intermodal Takeover Program, batch P1
 * foundation generator (2026-11-02).
 *
 * Source of truth: data/ports.json (hand-maintained; every value
 * carries its source from the program dossier,
 * ~/workspace/theflatratemovers/ports-program/DOSSIER.md).
 *
 * Outputs (into the Pages public tree):
 *   datasets-ports.json  — the master ports dataset file: the master
 *                          Dataset node, the 48-cell service-coverage
 *                          matrix Dataset node, and one Place node per
 *                          port, generated from the database.
 *   dataset-ports.json   — the /datasets/ports/ landing per-page JSON.
 *
 * Discipline (dossier section 3): the section 1.7 branch-binding table
 * is encoded ONCE here (BINDING_TABLE); the generator refuses to build
 * if any database entity's branchBinding disagrees with it, if any
 * volume lacks a source or a period label, if Wilmington carries any
 * volume, or if the PhilaPort binding is not time-based. The outputs
 * are self-scanned against the PB-3 no-claim patterns before writing.
 * Batch-run generator (run by the batch, like build-archive-registry);
 * its own file is a signed code distribution in the AI master index.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const PUB = process.env.PAGES_PUBLIC || path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const SITE = 'https://theflatratemovers.com';
const LANDING = SITE + '/datasets/ports/';
const FILE_URL = SITE + '/datasets-ports.json';
const TODAY = '2026-11-02';
/* FB-3 wire, extended to this file by the re-audit fix batch
 * (2026-11-03): the Dataset nodes' dateModified fields take FILE_DM —
 * the seal phase-0 stamps value for this file's own URL when the seal
 * passes FB3_STAMPS, else the ledger derivation. TODAY itself is
 * unchanged: it is this file's datePublished (P1 creation, 2026-11-02)
 * — lineage, never a stamp. The landing WebPage node's dateModified
 * takes PAGE_DM, the seal's page stamp for the landing URL
 * (stamps.pages), with the same ledger fallback shape. Before this
 * wire, the file's in-file stamp froze at creation and measured stale
 * against the ledger (re-audit root cause RC-T2). */
const FILE_DM = (() => {
  if (process.env.FB3_STAMPS) {
    const m = JSON.parse(fs.readFileSync(process.env.FB3_STAMPS, 'utf8'));
    const v = m.files && m.files[FILE_URL];
    if (!v) throw new Error('FB3_STAMPS lacks the ports file entry');
    return v;
  }
  try {
    const ledger = JSON.parse(fs.readFileSync(
      path.join(__dirname, '..', 'data', 'lastmod-ledger.json'), 'utf8'));
    return (ledger.urls && ledger.urls[FILE_URL]) || TODAY;
  } catch (_) { return TODAY; }
})();
const PAGE_DM = (() => {
  if (process.env.FB3_STAMPS) {
    const m = JSON.parse(fs.readFileSync(process.env.FB3_STAMPS, 'utf8'));
    const v = m.pages && m.pages[LANDING] && m.pages[LANDING].dm;
    if (!v) throw new Error('FB3_STAMPS lacks the ports landing page entry');
    return v;
  }
  try {
    const ledger = JSON.parse(fs.readFileSync(
      path.join(__dirname, '..', 'data', 'lastmod-ledger.json'), 'utf8'));
    return (ledger.urls && ledger.urls[LANDING]) || TODAY;
  } catch (_) { return TODAY; }
})();
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
const ORG_ID = SITE + '/#organization';

function fail(msg) { console.error('build-ports: FAIL — ' + msg); process.exit(1); }

// ---------------------------------------------------------------------
// The section 1.7 binding table, encoded once (dossier section 3).
// ---------------------------------------------------------------------
const BINDING_TABLE = {
  'port-virginia-inland-port': 'winchester',
  'port-of-virginia-norfolk': 'winchester',
  'port-richmond-marine-terminal': 'winchester',
  'port-of-baltimore': 'martinsburg',
  'port-of-wilmington-de': 'martinsburg',
  'port-philaport': 'martinsburg',
};
const BINDING_BASIS = {
  'port-virginia-inland-port': 'miles',
  'port-of-virginia-norfolk': 'miles',
  'port-richmond-marine-terminal': 'miles',
  'port-of-baltimore': 'miles',
  'port-of-wilmington-de': 'miles',
  'port-philaport': 'time',
};

const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ports.json'), 'utf8'));
const index = JSON.parse(fs.readFileSync(path.join(PUB, 'ai-master-index.json'), 'utf8'));
const distByUrl = new Map((index.distribution || index.distributions || []).map((d) => [d.contentUrl, d]));
function sealedDigest(url) {
  const e = distByUrl.get(url);
  if (!e || !e.digest) fail('no sealed digest in the installed index for ' + url);
  return e;
}

// Branch spatialCoverage objects are reused verbatim from the
// white-glove dataset file (the estate's two-branch Place shape).
const wg = JSON.parse(fs.readFileSync(path.join(PUB, 'datasets-white-glove.json'), 'utf8'));
const wgDataset = (wg['@graph'] || []).find((n) => n['@type'] === 'Dataset' && Array.isArray(n.spatialCoverage));
if (!wgDataset) fail('white-glove spatialCoverage source node not found');
const SPATIAL = wgDataset.spatialCoverage;
// Landing per-page JSON template nodes (Organization + branch Places)
// are cloned from the freight-rework landing JSON, the newest
// dataset-landing precedent.
const freightLanding = JSON.parse(fs.readFileSync(path.join(PUB, 'dataset-freight-rework.json'), 'utf8'));
const flGraph = freightLanding['@graph'] || [];
const orgNode = flGraph.find((n) => n['@type'] === 'Organization');
const winNode = flGraph.find((n) => n['@id'] === SITE + '/#winchester');
const marNode = flGraph.find((n) => n['@id'] === SITE + '/#martinsburg');
if (!orgNode || !winNode || !marNode) fail('freight landing template nodes missing');

const ORG_REF = { '@type': 'Organization', '@id': ORG_ID, 'name': 'The Flat Rate Movers LLC', 'url': SITE + '/' };

// ---------------------------------------------------------------------
// Validation — refuse to build on any disagreement (dossier section 3).
// ---------------------------------------------------------------------
if (!db.ports || db.ports.length !== 6) fail('database must carry exactly 6 ports');
for (const [pid, branch] of Object.entries(BINDING_TABLE)) {
  const inDb = (db.bindingMap || {})[pid];
  if (!inDb || inDb.branch !== branch) fail('database bindingMap disagrees with the encoded table for ' + pid);
}
for (const port of db.ports) {
  const want = BINDING_TABLE[port.id];
  if (!want) fail('port not in the encoded binding table: ' + port.id);
  if (!port.branchBinding || port.branchBinding.branch !== want) {
    fail('branchBinding of ' + port.id + ' disagrees with the encoded table (' + want + ')');
  }
  if (port.branchBinding.bindingBasis !== BINDING_BASIS[port.id]) {
    fail('bindingBasis of ' + port.id + ' disagrees with the encoded table (' + BINDING_BASIS[port.id] + ')');
  }
  if (!Array.isArray(port.sources) || !port.sources.length) fail('port has no sources: ' + port.id);
  for (const v of port.volumes || []) {
    if (v.value == null || !v.unit || !v.period || !v.source) fail('volume without value/unit/period/source on ' + port.id);
  }
  if (port.id === 'port-of-wilmington-de' && (port.volumes || []).length) {
    fail('Wilmington carries a volume — none is verified; publish none');
  }
  if (!port.geo || typeof port.geo.latitude !== 'number' || typeof port.geo.longitude !== 'number') {
    fail('port geo missing: ' + port.id);
  }
}
if (!Array.isArray(db.serviceCoverage) || db.serviceCoverage.length !== 48) {
  fail('serviceCoverage must carry exactly 48 cells (6 ports x 8 services)');
}
const POINT_ENUM = ['port-adjacent-warehouse', 'receivers-dock', 'yard', 'leased-space', 'on-terminal-by-arrangement'];
for (const cell of db.serviceCoverage) {
  if (cell.boundBranch !== BINDING_TABLE[cell.port]) fail('coverage cell boundBranch disagrees: ' + cell.port + '/' + cell.serviceColumn);
  for (const dp of cell.deliveryPoints || []) if (!POINT_ENUM.includes(dp)) fail('delivery point outside the enum: ' + dp);
}

// ---------------------------------------------------------------------
// Node builders.
// ---------------------------------------------------------------------
function portDescription(p) {
  const parts = [];
  parts.push(p.name + ' (' + p.address.addressLocality + ', ' + p.address.addressRegion + ') — ' + p.portType + '. Authority: ' + p.authorityName + '. Operator: ' + p.operatorName + '.');
  parts.push('Cargo: ' + p.cargoSpecialties.join('; ') + '.');
  if (p.railService && p.railService.length) {
    parts.push('Rail: ' + p.railService.map((r) => r.railroad + ' — ' + r.qualifier).join('; ') + '.');
  }
  parts.push('Highway corridors: ' + p.corridors.join(', ') + '.');
  if (p.ftz) parts.push('Foreign-trade zone: ' + p.ftz.zone + (p.ftz.site ? ', ' + p.ftz.site : '') + ' (grantee ' + p.ftz.grantee + ').');
  if (p.customsPortOfEntry) parts.push('U.S. Customs port of entry.');
  for (const v of p.volumes || []) {
    parts.push('Volume (' + v.period + ', ' + v.fiscalOrCalendar + '): ' + Number(v.value).toLocaleString('en-US') + ' ' + v.unit + ' — ' + v.scope + ' (source: ' + v.source + ').');
  }
  const b = p.branchBinding;
  parts.push('Branch binding: this port is served from the ' + (b.branch === 'winchester' ? 'Winchester, VA' : 'Martinsburg, WV') +
    ' branch of The Flat Rate Movers — about ' + b.milesFromWinchester + ' road miles from Winchester and ' + b.milesFromMartinsburg +
    ' from Martinsburg; bound to ' + (b.branch === 'winchester' ? 'Winchester' : 'Martinsburg') + ' on ' + b.bindingBasis + '. ' + b.marginNote + '.');
  return parts.join(' ');
}

function portNode(p) {
  const node = {
    '@type': 'Place',
    '@id': SITE + '/datasets/ports/#' + p.id,
    'name': p.name,
    'alternateName': p.shortName,
    'description': portDescription(p),
    'address': Object.assign({ '@type': 'PostalAddress' }, p.address),
    'geo': { '@type': 'GeoCoordinates', 'latitude': p.geo.latitude, 'longitude': p.geo.longitude },
    'portAuthority': p.authorityName,
    'operator': p.operatorName,
    'terminals': p.terminals,
    'cargoSpecialties': p.cargoSpecialties,
    'railService': p.railService,
    'corridors': p.corridors,
  };
  if (p.ftz) node.ftz = p.ftz;
  if (p.customsPortOfEntry) node.customsPortOfEntry = true;
  node.volumes = p.volumes || [];
  node.statusItems = p.statusItems || [];
  node.branchBinding = p.branchBinding;
  node.sources = p.sources;
  node.lastVerified = p.lastVerified;
  return node;
}

function datasetShell(idSuffix, name, description) {
  return {
    '@type': 'Dataset',
    '@id': LANDING + '#' + idSuffix,
    'name': name,
    'description': description,
    'url': LANDING,
    'sameAs': LANDING,
    'identifier': LANDING,
    'isAccessibleForFree': true,
    'license': LICENSE,
    'creator': JSON.parse(JSON.stringify(ORG_REF)),
    'publisher': JSON.parse(JSON.stringify(ORG_REF)),
    'datePublished': TODAY,
    'dateModified': FILE_DM,
    'includedInDataCatalog': { '@id': SITE + '/datasets/#collection' },
    'spatialCoverage': JSON.parse(JSON.stringify(SPATIAL)),
  };
}

const MASTER_DESC = 'The master dataset of the Ports & Intermodal program of The Flat Rate Movers: the six ports the company\'s crews serve with logistics project management, specialized labor, ocean container packing and unpacking, loading and unloading, cross-docking, transloading, 3PL support and freight rework — the Virginia Inland Port at Front Royal, the Port of Virginia at Norfolk (Norfolk International Terminals, Virginia International Gateway, Portsmouth Marine Terminal and Newport News Marine Terminal), Richmond Marine Terminal, the Port of Baltimore, the Port of Wilmington, Delaware, and PhilaPort at Philadelphia. Each port is a full entity: authority and operator of record, terminal facts with acreage, berths, depth and capacity where the port authority publishes them, cargo specialties, rail service with on-dock and interchange qualifiers, highway corridors, foreign-trade-zone facts where designated, labeled volume figures with their sources and periods, current status items, and the branch binding that assigns the port to Winchester, VA or Martinsburg, WV by verified road distance. Portsmouth Marine Terminal is recorded as what it is — a heavy-lift and offshore-wind hub, not a container terminal; Virginia International Gateway is recorded as leased, not port-authority-owned; the Port of Wilmington\'s operator of record is Enstructure. No volume figure is published for the Virginia Inland Port, Richmond Marine Terminal or the Port of Wilmington, because none is verified. The company\'s crews hold TWIC cards and its contractors hold valid TWIC cards. The offer set does not include drayage: the company does not run port drayage — freight moves on the customer\'s or carrier\'s trucks, and the company\'s crews do the hands-on work at port-adjacent warehouses, receivers\' docks, yards, leased space, and on-terminal only by arrangement through the terminal\'s own processes. Every fact carries its source; the companion coverage-matrix node in this file maps all 48 port-by-service cells.';

const MATRIX_DESC = 'The service-coverage matrix of the Ports & Intermodal program: 48 cells — six ports by the eight attached services (transloading; ocean container packing and unpacking; loading and unloading / container labor; cross-docking; freight rework; specialized workforce; logistics project management; 3PL support services) — each cell recording whether the service is offered at the port, the treatment the program gives it (S, a dedicated spoke page; H, a hub section; D, dataset and hub mention only, the deliberate treatment for the secondary nodes), the delivery points where the work is performed, and the bound branch. Delivery points come from one enum only: port-adjacent warehouse, receiver\'s dock, yard, leased space, and on-terminal by arrangement — on-terminal work happens only by arrangement through the terminal\'s own processes, never as a bare claim. Every cell binds to its port\'s branch: Winchester, VA for the Virginia Inland Port, the Port of Virginia and Richmond Marine Terminal; Martinsburg, WV for Baltimore, Wilmington and PhilaPort (PhilaPort on drive time — road miles are tied).';

const master = datasetShell('dataset-ports', 'Ports & Intermodal Logistics Dataset', MASTER_DESC);
master.keywords = 'ports, intermodal, transloading, container labor, devanning, cross-docking, freight rework, 3PL support, logistics project management, Virginia Inland Port, Port of Virginia, Norfolk, Richmond Marine Terminal, Port of Baltimore, Port of Wilmington, PhilaPort, TWIC card, branch binding';
master.about = [{ '@id': SITE + '/#service-transloading' }, { '@id': SITE + '/#service-freight-rework-transloading' }];
master.distribution = [
  { '@type': 'DataDownload', 'name': 'datasets-ports.json — this file', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' },
];
for (const f of ['ai-sitemap.json', 'entity-graph.json', 'best-json-entity-graph.json', 'service-area.geojson']) {
  const e = sealedDigest(SITE + '/' + f);
  master.distribution.push({ '@type': 'DataDownload', 'name': f, 'contentUrl': SITE + '/' + f, 'encodingFormat': 'application/json', 'contentSize': e.digest.byteSize, 'sha256': e.digest.value });
}

const matrix = datasetShell('dataset-ports-coverage', 'Ports Service Coverage Matrix Dataset', MATRIX_DESC);
matrix.keywords = 'service coverage matrix, port services, delivery points, branch binding, transloading coverage, cross-docking coverage, 3PL support coverage';
matrix.coverageMatrix = db.serviceCoverage;
matrix.distribution = [
  { '@type': 'DataDownload', 'name': 'datasets-ports.json — this file', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' },
];

const graph = [master, matrix].concat(db.ports.map(portNode));
const fileDoc = { '@context': 'https://schema.org', '@graph': graph };

// ---------------------------------------------------------------------
// Landing per-page JSON.
// ---------------------------------------------------------------------
const landingDataset = {
  '@type': 'Dataset',
  '@id': LANDING + '#dataset-ports',
  'name': 'Ports & Intermodal Logistics Dataset',
  'description': MASTER_DESC,
  'url': LANDING,
  'sameAs': LANDING,
  'identifier': LANDING,
  'isAccessibleForFree': true,
  'license': LICENSE,
  'creator': JSON.parse(JSON.stringify(orgNode)),
  'publisher': JSON.parse(JSON.stringify(orgNode)),
  'datePublished': TODAY,
  'dateModified': FILE_DM,
  'spatialCoverage': [{ '@id': SITE + '/#winchester' }, { '@id': SITE + '/#martinsburg' }],
  'keywords': master.keywords,
  'distribution': [{ '@type': 'DataDownload', 'name': 'datasets-ports.json', 'contentUrl': FILE_URL, 'encodingFormat': 'application/json' }],
  'about': [{ '@id': SITE + '/#service-transloading' }, { '@id': SITE + '/#service-freight-rework-transloading' }],
};
const landingDoc = {
  '@context': 'https://schema.org',
  '@graph': [
    landingDataset,
    orgNode,
    winNode,
    marNode,
    {
      '@type': 'WebPage',
      '@id': LANDING,
      'url': LANDING,
      'name': 'Ports & Intermodal Logistics Datasets',
      'breadcrumb': { '@id': LANDING + '#breadcrumb' },
      'image': { '@type': 'ImageObject', 'url': SITE + '/assets/img-01-9c77693ba66b.png', 'caption': 'The Flat Rate Movers logo — company brand image, not a job photo.' },
      'dateModified': PAGE_DM,
    },
    {
      '@id': LANDING + '#breadcrumb',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'item': SITE + '/', 'name': 'Home', 'position': 1 },
        { '@type': 'ListItem', 'item': SITE + '/datasets/', 'name': 'Published Datasets', 'position': 2 },
        { '@type': 'ListItem', 'item': LANDING, 'name': 'Ports & Intermodal Logistics Datasets', 'position': 3 },
      ],
    },
  ],
};

// ---------------------------------------------------------------------
// PB-3 self-scan of everything this generator is about to publish.
// ---------------------------------------------------------------------
const banned = [
  [/twic[-\s]?(certified|certification|credentialed)/i, 'TWIC credential claim'],
  [/our (own )?(terminal|berth|dock) at/i, 'port tenancy claim'],
  [/port (partner|partnership|authority partner)/i, 'port relationship claim'],
  [/official (port|terminal)/i, 'official port claim'],
  [/we (offer|provide|run|do) (port )?drayage/i, 'drayage as own service'],
  [/drayage (services|company|provider)/i, 'drayage as own service'],
  [/gulftainer|gt usa/i, 'stale Wilmington operator credited'],
  [/first port for automobiles|#1 automobile port/i, 'stale Baltimore autos claim'],
  [/world'?s largest banana/i, 'unverified Wilmington banana claim'],
];
function scan(label, text) {
  for (const [re, why] of banned) {
    const hits = text.match(new RegExp('[^.]*' + re.source + '[^.]*', 'gi')) || [];
    for (const s of hits) {
      // A barred term inside a correction/negation context ("the former
      // GT USA concession was cancelled") is the correction itself, not
      // the claim; claim-shaped occurrences fail.
      if (/\b(former|cancelled|canceled|gone|no longer|not|never|stale)\b/i.test(s) && /gulftainer|gt usa/i.test(s)) continue;
      fail('PB-3 self-scan (' + why + ') tripped in ' + label + ': ' + s.trim().slice(0, 140));
    }
  }
  const dray = text.match(/[^.]*\bdrayage\b[^.]*/gi) || [];
  for (const s of dray) if (!/\b(not|no|never|does not|do not)\b/i.test(s)) fail('PB-3 self-scan: drayage outside a negation context in ' + label + ': ' + s.trim());
}
scan('datasets-ports.json', JSON.stringify(fileDoc));
scan('dataset-ports.json', JSON.stringify(landingDoc));

const fileBytes = JSON.stringify(fileDoc, null, 1) + '\n';
const landingBytes = JSON.stringify(landingDoc, null, 1) + '\n';
fs.writeFileSync(path.join(PUB, 'datasets-ports.json'), fileBytes);
fs.writeFileSync(path.join(PUB, 'dataset-ports.json'), landingBytes);
const sha = crypto.createHash('sha256').update(fileBytes).digest('hex');
console.log('build-ports: wrote datasets-ports.json (' + fileBytes.length + ' bytes, sha256 ' + sha + ') and dataset-ports.json (' + landingBytes.length + ' bytes)');
console.log('build-ports: @graph nodes = ' + graph.length + ' (2 Dataset + ' + db.ports.length + ' Place); coverage cells = ' + db.serviceCoverage.length);
