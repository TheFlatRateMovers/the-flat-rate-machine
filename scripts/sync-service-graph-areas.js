#!/usr/bin/env node
/* ADD-1 (batch town-datasets 2026-11-12): White-Glove graph enumeration fix.
 *
 * Standing rule (Henry, 2026-11-05): White-Glove Delivery areaServed is the
 * FULL published footprint. The #service-white-glove node in both entity
 * graphs carried a hand-authored snapshot of the footprint as it stood at
 * the service's creation (2026-11-02, 71 areas; see the source note on
 * service-white-glove in data/services.json). service-area.geojson later
 * grew to 83 features (appended in geojson order) and the snapshot was
 * never re-derived, so the graphs silently stayed at 71.
 *
 * This sync makes the enumeration DERIVED, permanently: at run time it
 * reads data/service-area.geojson, builds the areaServed ref list from
 * ALL features in geojson order ({ '@id': SITE + '/#' + feature id }),
 * and rewrites ONLY that array, textually, in the four graph seats
 * (PUB + data/ masters). The replacement array is self-templated from
 * the seat's own existing array bytes (the template must reproduce the
 * old array exactly before it is trusted), so no other byte can move —
 * a full-file re-dump is NOT byte-safe here (Node drops the trailing
 * ".0" on ratingValue numbers). Doc-level dateModified is NOT bumped —
 * the batch seal owns dates and re-digests + re-signs both graphs.
 *
 * The dataset file's own enumerations (datasets-white-glove.json) are a
 * different lane (build-white-glove.js / batch-authored seats) and are
 * NOT touched by this script. This script never touches the shell head
 * graph, which carries its own copy of this node.
 *
 * Modes:
 *   --check    derive + report only; write nothing; exit 1 on drift.
 *   (default)  apply the derivation to every seat that differs.
 *
 * Env overrides (dry-run / testing): FRM_PUB, FRM_ROOT.
 * Twin rule: scripts/ seat and repo-dir/ seat are byte-identical.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.FRM_ROOT || '/home/hatch/workspace/the-flat-rate-machine';
const PUB = process.env.FRM_PUB || '/home/hatch/workspace/the-flat-rate-movers-pages/public';
const SITE = 'https://theflatratemovers.com';
const WG_ID = SITE + '/#service-white-glove';
const CHECK = process.argv.includes('--check');

function deriveRefs() {
  const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-area.geojson'), 'utf8'));
  const feats = geo.features || [];
  if (!feats.length) throw new Error('service-area.geojson has no features');
  const refs = feats.map((f) => {
    const id = f && f.properties && f.properties.id;
    if (!id) throw new Error('geojson feature without properties.id: ' + JSON.stringify(f).slice(0, 120));
    return { '@id': SITE + '/#' + id };
  });
  if (new Set(refs.map((r) => r['@id'])).size !== refs.length) throw new Error('duplicate feature ids in service-area.geojson');
  return refs;
}

/* bracket-match a JSON array starting at text[openAt] === '[' (string-aware) */
function arrayEnd(text, openAt) {
  let depth = 0, inStr = false, esc = false;
  for (let i = openAt; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') { depth--; if (depth === 0) return i; }
  }
  throw new Error('array never closes');
}

function formatArray(refs) {
  const entries = refs.map((r) => '    {\n     "@id": "' + r['@id'] + '"\n    }');
  return '[\n' + entries.join(',\n') + '\n   ]';
}

function syncGraph(file, refs) {
  const before = fs.readFileSync(file, 'utf8');
  const doc = JSON.parse(before);
  const hits = (doc['@graph'] || []).filter((n) => n && n['@id'] === WG_ID);
  if (hits.length !== 1) throw new Error(file + ': expected exactly 1 ' + WG_ID + ' node, got ' + hits.length);
  const old = hits[0].areaServed;
  const oldCount = Array.isArray(old) ? old.length : -1;
  if (JSON.stringify(old) === JSON.stringify(refs)) {
    console.log(path.basename(file) + ' (' + path.basename(path.dirname(file)) + '): already derived — areaServed ' + oldCount + ' [skip]');
    return { changed: false, oldCount };
  }
  // Locate the WG node's areaServed array textually, inside the node's own span:
  // the node element begins at the "\n  {\n" preceding its @id line.
  const idAt = before.indexOf('"@id": "' + WG_ID + '"');
  if (idAt < 0) throw new Error(file + ': WG @id line not found');
  const nodeStart = before.lastIndexOf('\n  {', idAt);
  if (nodeStart < 0) throw new Error(file + ': WG node start not found');
  const keyAt = before.indexOf('"areaServed"', idAt);
  const openAt = before.indexOf('[', keyAt);
  const closeAt = arrayEnd(before, openAt);
  const oldText = before.slice(openAt, closeAt + 1);
  // Self-template assertion: the formatter must reproduce the OLD array bytes
  // from the OLD parsed refs exactly, or the seat's style differs — stop.
  if (formatArray(old) !== oldText) throw new Error(file + ': array style differs from template — refusing to rewrite');
  const after = before.slice(0, openAt) + formatArray(refs) + before.slice(closeAt + 1);
  // Assertions: parses; node count unchanged; ONLY the WG node's areaServed differs.
  const docAfter = JSON.parse(after);
  if (docAfter['@graph'].length !== doc['@graph'].length) throw new Error(file + ': node count changed');
  for (let i = 0; i < doc['@graph'].length; i++) {
    const a = doc['@graph'][i], b = docAfter['@graph'][i];
    if (a && a['@id'] === WG_ID) {
      const a2 = { ...a }, b2 = { ...b };
      delete a2.areaServed; delete b2.areaServed;
      if (JSON.stringify(a2) !== JSON.stringify(b2)) throw new Error(file + ': WG node changed beyond areaServed');
      if (JSON.stringify(b.areaServed) !== JSON.stringify(refs)) throw new Error(file + ': areaServed mismatch after write');
    } else if (JSON.stringify(a) !== JSON.stringify(b)) {
      throw new Error(file + ': non-WG node changed at index ' + i);
    }
  }
  const topA = { ...doc }, topB = { ...docAfter };
  delete topA['@graph']; delete topB['@graph'];
  if (JSON.stringify(topA) !== JSON.stringify(topB)) throw new Error(file + ': top-level fields changed');
  if (!CHECK) fs.writeFileSync(file, after);
  console.log(path.basename(file) + ' (' + path.basename(path.dirname(file)) + '): areaServed ' + oldCount + ' -> ' + refs.length + (CHECK ? ' [check — drift]' : ' [written]'));
  return { changed: true, oldCount };
}

const refs = deriveRefs();
console.log('derived ' + refs.length + ' areaServed refs from data/service-area.geojson (geojson order)');
const targets = [
  path.join(PUB, 'entity-graph.json'),
  path.join(PUB, 'best-json-entity-graph.json'),
  path.join(ROOT, 'data', 'entity-graph.json'),
  path.join(ROOT, 'data', 'best-json-entity-graph.json'),
];
let drift = 0;
for (const f of targets) { const r = syncGraph(f, refs); if (r.changed) drift++; }
if (CHECK && drift) { console.error('DRIFT: ' + drift + ' seat(s) differ from the geojson-derived enumeration'); process.exit(1); }
console.log('OK — white-glove graph area sync ' + (CHECK ? 'checked' : 'complete') + ' (' + drift + ' seat(s) updated)');
