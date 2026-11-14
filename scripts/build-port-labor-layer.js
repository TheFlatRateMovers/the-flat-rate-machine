#!/usr/bin/env node
'use strict';
/*
 * build-port-labor-layer.js — Ports × 3PL Takeover (Wave 1, 2026-11-14):
 * splices the dedicated port-labor layer into each wave-1 port's
 * per-port dataset file. The layer is DERIVED from data/ports.json
 * (the serviceCoverage cells that carry a laborPage) — never hand-
 * authored per file: one typed Service node per distinct offered
 * coverage service at the port, areaServed = the port's typed Place
 * node (GS-1: never a Dataset), url = the port's dedicated labor
 * page; the coverage dataset's coverageMatrix is re-struck from
 * ports.json so the laborPage binding rides the matrix; both Dataset
 * nodes take their dateModified from the lastmod ledger. Idempotent:
 * prior labor nodes (LANDING + '#labor-') are removed and re-emitted,
 * so a re-run after a per-port builder refresh restores the layer
 * byte-consistently. NOT seal-resident (the per-port dataset builders
 * are batch-run generators too); run it in any batch that changes
 * ports.json laborPage bindings or a wave port's dataset file.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = process.env.PAGES_PUBLIC || path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const SITE = 'https://theflatratemovers.com';
const ORG = { '@type': 'Organization', '@id': SITE + '/#organization', 'name': 'The Flat Rate Movers LLC', 'url': SITE + '/' };

// port id -> [dataset file, landing slug]
const FILES = {
  'port-of-virginia-norfolk': ['datasets-port-of-virginia.json', 'port-of-virginia'],
  'port-richmond-marine-terminal': ['datasets-richmond-marine-terminal.json', 'richmond-marine-terminal'],
  'port-of-wilmington-de': ['datasets-port-of-wilmington.json', 'port-of-wilmington'],
  'port-of-new-york-new-jersey': ['datasets-port-of-new-york-new-jersey.json', 'port-of-new-york-new-jersey'],
  'port-virginia-inland-port': ['datasets-transloading-inland-port.json', 'transloading-inland-port'],
  'port-philaport': ['datasets-philaport.json', 'philaport'],
  'port-of-huntington-tri-state': ['datasets-port-of-huntington.json', 'port-of-huntington'],
};
const PLACE_LABEL = {
  'port-of-virginia-norfolk': 'Norfolk VA',
  'port-richmond-marine-terminal': 'Richmond VA',
  'port-of-wilmington-de': 'Wilmington DE',
  'port-of-new-york-new-jersey': 'Newark NJ',
  'port-virginia-inland-port': 'Front Royal VA',
  'port-philaport': 'Philadelphia PA',
  'port-of-huntington-tri-state': 'Huntington WV',
};

const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ports.json'), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lastmod-ledger.json'), 'utf8'));

for (const [pid, [file, landingSlug]] of Object.entries(FILES)) {
  const port = (db.ports || []).find((p) => p.id === pid);
  if (!port) { console.error('FAIL — port missing: ' + pid); process.exit(1); }
  const cells = (db.serviceCoverage || []).filter((c) => c.port === pid && c.offered);
  const laborPage = (cells.find((c) => c.laborPage) || {}).laborPage;
  if (!laborPage) { console.error('FAIL — no laborPage cell for ' + pid); process.exit(1); }
  const LANDING = SITE + '/datasets/' + landingSlug + '/';
  const fileUrl = SITE + '/' + file;
  const dm = (ledger.urls && ledger.urls[fileUrl]) || '2026-11-14';
  const fp = path.join(PUB, file);
  const doc = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const graph = doc['@graph'];
  if (!Array.isArray(graph)) { console.error('FAIL — no @graph in ' + file); process.exit(1); }
  // idempotent: drop prior labor nodes
  const kept = graph.filter((n) => !(typeof n['@id'] === 'string' && n['@id'].startsWith(LANDING + '#labor-')));
  // the port's Place node in this file (else the master ports ref)
  const placeNode = kept.find((n) => n['@type'] === 'Place' && typeof n['@id'] === 'string' && n['@id'].endsWith('#' + pid));
  const placeRef = placeNode ? placeNode['@id'] : SITE + '/datasets/ports/#' + pid;
  const branch = (db.bindingMap[pid] || {}).branch === 'martinsburg' ? 'Martinsburg, WV' : 'Winchester, VA';
  // one Service node per distinct coverage service
  const byService = new Map();
  for (const c of cells) if (!byService.has(c.service)) byService.set(c.service, []);
  for (const c of cells) byService.get(c.service).push(c.serviceLabel);
  const laborNodes = [];
  for (const [svc, labels] of [...byService.entries()].sort()) {
    const slug = svc.replace(/^service-/, '');
    laborNodes.push({
      '@type': 'Service',
      '@id': LANDING + '#labor-' + slug,
      'name': labels[0] + ' at ' + port.name,
      'serviceType': labels.join('; '),
      'description': 'Port labor at ' + port.name + ' from The Flat Rate Movers \u2014 ' + labels[0].toLowerCase() + ', performed by TWIC-carded crews: every crew member holds a TWIC card, and the company\u2019s contractors hold valid TWIC cards. Crews are background-checked, escort-ready, and dispatched 24/7 from the ' + branch + ' branch at contract scale up to 1,000 crew; flat rate in writing before work starts. The dedicated labor page for this port is ' + laborPage + '. Labor only: the company does not perform drayage.',
      'provider': ORG,
      'url': laborPage,
      'areaServed': [{ '@id': placeRef }],
    });
  }
  const sentence = ' The dedicated labor layer for this port is published at ' + laborPage + ' \u2014 Container Unloading Labor \u2014 ' + PLACE_LABEL[pid] + ': TWIC-carded crews, dispatched 24/7, at contract scale up to 1,000 crew.';
  const datasets = kept.filter((n) => n['@type'] === 'Dataset');
  for (const ds of datasets) {
    ds.dateModified = dm;
    if (typeof ds.description === 'string' && !ds.description.includes(laborPage)) ds.description += sentence;
    if (Array.isArray(ds.about)) {
      for (const svc of byService.keys()) {
        const ref = SITE + '/#' + svc;
        if (!ds.about.some((a) => a['@id'] === ref)) ds.about.push({ '@id': ref });
      }
    }
    // coverage matrix re-struck from ports.json (laborPage rides)
    if (Array.isArray(ds.additionalProperty)) {
      for (const pv of ds.additionalProperty) {
        if (pv && pv.name === 'coverageMatrix') pv.value = JSON.stringify(cells);
      }
    }
  }
  doc['@graph'] = kept.concat(laborNodes);
  fs.writeFileSync(fp, JSON.stringify(doc, null, 1) + '\n');
  console.log('LABOR LAYER ' + file + ' — services: ' + laborNodes.length + ' | nodes: ' + doc['@graph'].length + ' | dm: ' + dm);
}
