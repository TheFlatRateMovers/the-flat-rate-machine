#!/usr/bin/env node
/* Batch FB-2 Dataset Graph Citizenship (prep-staged 2026-11-03):
 * derive ONE Dataset citizenship node per published dataset file and
 * sync it into both published graphs and their machine-repo data/
 * mirrors (four copies), following the Ports P1 exemplar exactly:
 * the graph node is the dataset's own summary node (the per-page
 * JSON's Dataset node, or the file's own node when the file carries
 * one under the same @id — the ports case) with `distribution`
 * dropped and `includedInDataCatalog` set to the estate catalog ref.
 *
 * Derivation sources are the SEALED artifacts in the Pages tree:
 *   PUB/datasets-<stem>.json  (the dataset file)
 *   PUB/dataset-<stem>.json   (the landing's per-page JSON)
 * No content is authored here: every field of every derived node is
 * copied verbatim from one of those two sealed sources.
 *
 * Modes:
 *   --check    derive + report only; write nothing.
 *   (default)  insert missing nodes; skip deep-equal nodes; FAIL on a
 *              present-but-different node (drift is a decision, not a
 *              silent overwrite).
 *   --resync   like default, but a present-but-different node is
 *              replaced in place (for seals that legitimately changed
 *              a source node, e.g. FB-3's timestamp wiring).
 *
 * Env overrides (dry-run / testing): FRM_PUB, FRM_ROOT, FRM_SEAL_DATE.
 * At execution this file is copied to scripts/ + repo-dir/ (twin rule)
 * and run from the machine repo with no overrides.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.FRM_ROOT || '/home/hatch/workspace/the-flat-rate-machine';
const PUB = process.env.FRM_PUB || '/home/hatch/workspace/the-flat-rate-movers-pages/public';
const SITE = 'https://theflatratemovers.com';
const SEAL_DATE = process.env.FRM_SEAL_DATE || new Date().toISOString().slice(0, 10);
const CATALOG = { '@type': 'DataCatalog', '@id': SITE + '/datasets/#collection', 'name': 'The Flat Rate Movers — AI Authority Estate Datasets', 'url': SITE + '/datasets/' };
const CHECK = process.argv.includes('--check');
const RESYNC = process.argv.includes('--resync');
const exclArg = process.argv.indexOf('--exclude');
const EXCLUDE = new Set(exclArg >= 0 ? process.argv[exclArg + 1].split(',') : []);

function sortKeys(o) {
  if (Array.isArray(o)) return o.map(sortKeys);
  if (o && typeof o === 'object') {
    const r = {};
    for (const k of Object.keys(o).sort()) r[k] = sortKeys(o[k]);
    return r;
  }
  return o;
}
const deepEqual = (a, b) => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));

function nodesOf(doc) {
  if (doc && Array.isArray(doc['@graph'])) return doc['@graph'];
  return Array.isArray(doc) ? doc : [doc];
}

/* ---------------- derivation (the FB-2 rule) ----------------------- */
function deriveAll() {
  const files = fs.readdirSync(PUB).filter((f) => /^datasets-.+\.json$/.test(f)).sort();
  if (!files.length) throw new Error('no dataset files found in ' + PUB);
  const out = [];
  for (const f of files) {
    const stem = f.replace(/^datasets-/, '').replace(/\.json$/, '');
    if (EXCLUDE.has(stem)) { out.push({ stem, excluded: true }); continue; }
    const landing = SITE + '/datasets/' + stem + '/';
    const candIds = new Set([landing + '#dataset', landing + '#dataset-' + stem, SITE + '/' + f + '#dataset']);
    const ppDoc = JSON.parse(fs.readFileSync(path.join(PUB, 'dataset-' + stem + '.json'), 'utf8'));
    const ppHits = nodesOf(ppDoc).filter((n) => n && n['@type'] === 'Dataset' && candIds.has(n['@id']));
    if (ppHits.length !== 1) throw new Error(stem + ': expected exactly 1 summary Dataset node in per-page JSON, got ' + ppHits.length);
    let src = ppHits[0], origin = 'per-page';
    const fDoc = JSON.parse(fs.readFileSync(path.join(PUB, f), 'utf8'));
    const fHits = nodesOf(fDoc).filter((n) => n && n['@type'] === 'Dataset' && n['@id'] === src['@id']);
    if (fHits.length === 1) { src = fHits[0]; origin = 'file'; }
    if (fHits.length > 1) throw new Error(stem + ': multiple file nodes share the summary @id');
    const node = JSON.parse(JSON.stringify(src));
    delete node.distribution;
    if (node.includedInDataCatalog && !deepEqual(node.includedInDataCatalog, CATALOG)) {
      throw new Error(stem + ': pre-existing includedInDataCatalog differs from the catalog ref');
    }
    node.includedInDataCatalog = { ...CATALOG };
    // Gate-preview assertions (DC-1/DC-3/D-2 shape, graph-side):
    if (typeof node.description !== 'string' || node.description.length < 50 || node.description.length > 5000) {
      throw new Error(stem + ': description outside the 50-5000 bound (' + (node.description || '').length + ')');
    }
    if (node.url !== landing) throw new Error(stem + ': summary url is not the landing: ' + node.url);
    if (!node.identifier) throw new Error(stem + ': summary node lacks identifier');
    if (node.isAccessibleForFree !== true) throw new Error(stem + ': isAccessibleForFree is not true');
    for (const k of ['datePublished', 'dateModified']) {
      if (node[k] !== undefined && !/^\d{4}-\d{2}-\d{2}/.test(node[k])) throw new Error(stem + ': ' + k + ' not ISO: ' + node[k]);
    }
    if (node.datePublished && node.dateModified && node.dateModified < node.datePublished) {
      throw new Error(stem + ': dateModified < datePublished');
    }
    out.push({ stem, id: node['@id'], origin, node });
  }
  return out;
}

/* ------------- textual graph editing (FB-1 mechanics) -------------- */
function formatNode(n) {
  return JSON.stringify(n, null, 1).split('\n').map((l) => '  ' + l).join('\n');
}
function graphArrayEnd(text) {
  const keyAt = text.indexOf('"@graph"');
  if (keyAt < 0) throw new Error('no @graph key');
  const openAt = text.indexOf('[', keyAt);
  let depth = 0, inStr = false, esc = false;
  for (let i = openAt; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return i; }
  }
  throw new Error('@graph array never closes');
}
/* spans [start,end) of each top-level @graph element */
function elementSpans(text) {
  const keyAt = text.indexOf('"@graph"');
  const openAt = text.indexOf('[', keyAt);
  const spans = [];
  let i = openAt + 1, depth = 0, inStr = false, esc = false, start = -1;
  for (; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; continue; }
    if (c === '{' || c === '[') { if (depth === 0) start = i; depth++; }
    else if (c === '}' || c === ']') {
      depth--;
      if (depth === 0 && start >= 0) { spans.push([start, i + 1]); start = -1; }
      else if (depth === 0) break; // array close
    }
  }
  return spans;
}

function syncGraph(file, derived, { bumpDateModified }) {
  const before = fs.readFileSync(file, 'utf8');
  const doc = JSON.parse(before);
  const existing = new Map();
  for (const n of doc['@graph'] || []) if (n && n['@id']) existing.set(n['@id'], n);
  const inserts = [], replaces = [], skips = [];
  for (const d of derived) {
    if (d.excluded) continue;
    const cur = existing.get(d.id);
    if (!cur) inserts.push(d);
    else if (deepEqual(cur, d.node)) skips.push(d);
    else if (RESYNC) replaces.push(d);
    else throw new Error(file + ': DRIFT at ' + d.id + ' (present but differs) — rerun with --resync only inside a seal that owns the source change');
  }
  let after = before;
  if (replaces.length) {
    const spans = elementSpans(after);
    const byId = new Map();
    const docNow = JSON.parse(after);
    docNow['@graph'].forEach((n, ix) => { if (n && n['@id']) byId.set(n['@id'], spans[ix]); });
    // replace from the end backwards so spans stay valid
    for (const d of [...replaces].sort((a, b) => byId.get(b.id)[0] - byId.get(a.id)[0])) {
      const [s, e] = byId.get(d.id);
      after = after.slice(0, s) + formatNode(d.node).slice(2) /* element base indent already in span start */ + after.slice(e);
    }
  }
  if (inserts.length) {
    const endAt = graphArrayEnd(after);
    if (after.slice(endAt - 2, endAt) !== '\n ') throw new Error(file + ': unexpected @graph close format');
    const insertAt = endAt - 2;
    after = after.slice(0, insertAt) + ',\n' + inserts.map((d) => formatNode(d.node)).join(',\n') + after.slice(insertAt);
  }
  if (bumpDateModified) {
    const cur = JSON.parse(after).dateModified;
    if (!cur) throw new Error(file + ': no doc-level dateModified to bump');
    const needle = '"dateModified": "' + cur + '"';
    const at = after.lastIndexOf(needle);
    if (at < 0) throw new Error(file + ': doc-level dateModified needle not found');
    after = after.slice(0, at) + '"dateModified": "' + SEAL_DATE + '"' + after.slice(at + needle.length);
  }
  // Assertions: parses; count delta == inserts; pre-existing order kept;
  // every derived node now present and deep-equal.
  const docAfter = JSON.parse(after);
  const g = docAfter['@graph'];
  if (g.length !== (doc['@graph'] || []).length + inserts.length) throw new Error(file + ': count delta wrong');
  const beforeIds = (doc['@graph'] || []).map((n) => n && n['@id']);
  const keptIds = g.filter((n) => beforeIds.includes(n && n['@id'])).map((n) => n && n['@id']);
  if (JSON.stringify(keptIds) !== JSON.stringify(beforeIds)) throw new Error(file + ': pre-existing node order changed');
  const byIdAfter = new Map(g.filter((n) => n && n['@id']).map((n) => [n['@id'], n]));
  for (const d of derived) {
    if (d.excluded) continue;
    if (!byIdAfter.has(d.id)) throw new Error(file + ': derived node missing after sync: ' + d.id);
    if (!deepEqual(byIdAfter.get(d.id), d.node)) throw new Error(file + ': derived node mismatch after sync: ' + d.id);
  }
  if (!CHECK) fs.writeFileSync(file, after);
  console.log(path.basename(file) + ': inserts=' + inserts.length + ' replaces=' + replaces.length + ' skips=' + skips.length +
    ' (' + (doc['@graph'] || []).length + ' -> ' + g.length + ' nodes)' + (CHECK ? ' [check]' : ''));
  return { inserts: inserts.length, replaces: replaces.length, skips: skips.length };
}

/* ------------------------------- main ------------------------------ */
const derived = deriveAll();
const live = derived.filter((d) => !d.excluded);
console.log('derived ' + live.length + ' citizenship nodes (' +
  live.filter((d) => d.origin === 'file').length + ' file-sourced, ' +
  live.filter((d) => d.origin === 'per-page').length + ' per-page-sourced)' +
  (derived.length !== live.length ? ', ' + (derived.length - live.length) + ' excluded' : ''));
const targets = [
  [path.join(PUB, 'entity-graph.json'), false],
  [path.join(PUB, 'best-json-entity-graph.json'), true],
  [path.join(ROOT, 'data/entity-graph.json'), false],
  [path.join(ROOT, 'data/best-json-entity-graph.json'), true],
];
for (const [f, bump] of targets) syncGraph(f, derived, { bumpDateModified: bump });
console.log('OK — dataset graph sync ' + (CHECK ? 'checked' : 'complete'));
