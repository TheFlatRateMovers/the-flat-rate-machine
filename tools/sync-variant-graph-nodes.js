#!/usr/bin/env node
/* Batch Q3 Graph Citizenship for variant pages + category hubs
 * (staged 2026-11-03): derive ONE citizen node per in-scope page and
 * sync it into both published graphs and their machine-repo data/
 * mirrors (four copies), following the FB-2 pattern exactly: the graph
 * node is the page's OWN summary node from its sealed per-page JSON
 * (or, for the four pages whose per-page JSON carries no page-class
 * node of their own, the page's served page-jsonld WebPage node as
 * baked into head-data — the FB-1 derivation precedent), plus exactly
 * the join the estate's existing citizens carry:
 *
 *   variant WebPage citizens — `about` := the page's registered
 *     services (data/pages.json `services[]`, registry order), the
 *     same join the authored WebPage citizens already carry
 *     (measured: every pre-carrying variant's about set equals its
 *     registry list; one page's authored about was a strict subset —
 *     the registry list is the estate's record and wins).
 *   variant Service citizens (the page's own page-scoped or own-slug
 *     Service node is its honest subject) — node verbatim; when the
 *     node carries no reference to any registered service, `isPartOf`
 *     := the page's first registered service (single-object form,
 *     mirroring the authored workforce page's isPartOf). Join field:
 *     isPartOf.
 *   hub CollectionPage citizens — node verbatim; `about` is authored
 *     content and must equal the registry list when both exist (fail
 *     loud otherwise — measured equal for all 18); when `about` is
 *     absent it is set from the registry list, or — for a root hub
 *     with no registered service — to the Organization node (the
 *     estate's root-structure join, as Dataset citizens join the
 *     catalog and Blog citizens join the Blog). A hub nested under
 *     another in-scope hub gains `isPartOf` := the parent hub's
 *     #collection node when absent (mirroring the one authored
 *     exemplar: the logistics-transportation hub). Join fields:
 *     about (when set here), isPartOf (when set here).
 *
 * The population (86 pages: 64 service-variant + 22 category hubs)
 * lives in graph-citizenship-population.js beside this file —
 * GENERATED from the closing re-audit classes; do not hand-edit.
 *
 * Derivation sources are the SEALED artifacts in the Pages tree:
 *   PUB/<per-page>.json   (resolved by the estate's own rule: a
 *     unique WebPage-@id match wins; else the slug-derived filename;
 *     else head-data's jf — build-intent-rubric.js resolveJsonFile)
 *   repo-dir/head-data.js (the sealed served-JSON-LD source, for the
 *     four no-page-node pages and the jf fallback)
 *   data/pages.json + data/services.json (the sealed registries)
 * No content is authored here: every field of every derived node is
 * copied verbatim from one of those sealed sources, plus the joins
 * defined above.
 *
 * Modes (identical to sync-dataset-graph-nodes.js):
 *   --check    derive + report only; write nothing.
 *   (default)  insert missing nodes; skip deep-equal nodes; FAIL on a
 *              present-but-different node (drift is a decision, not a
 *              silent overwrite).
 *   --resync   like default, but a present-but-different node is
 *              replaced in place (for seals that legitimately changed
 *              a source node).
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
const CHECK = process.argv.includes('--check');
const RESYNC = process.argv.includes('--resync');
const POPULATION = require(path.join(__dirname, 'graph-citizenship-population.js'));

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
const clone = (o) => JSON.parse(JSON.stringify(o));
const typeIs = (n, t) => n && (n['@type'] === t || (Array.isArray(n['@type']) && n['@type'].includes(t)));

function nodesOf(doc) {
  if (doc && Array.isArray(doc['@graph'])) return doc['@graph'];
  return Array.isArray(doc) ? doc : [doc];
}

/* --------- sealed sources: registries + head-data + jf map -------- */
const pagesReg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/pages.json'), 'utf8')).pages;
const pagesBySlug = new Map(pagesReg.map((p) => [p.slug, p]));
const servicesReg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/services.json'), 'utf8')).services;
const REGISTERED = new Set(servicesReg.map((s) => SITE + '/#' + s.id));

let _head = null;
function headData() {
  if (_head) return _head;
  for (const cand of [path.join(ROOT, 'repo-dir/head-data.js'), path.join(ROOT, 'head-data.js')]) {
    if (!fs.existsSync(cand)) continue;
    const text = fs.readFileSync(cand, 'utf8');
    _head = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    return _head;
  }
  throw new Error('head-data.js not found under ' + ROOT);
}

let _wpMap = null;
function webPageFileMap() {
  if (_wpMap) return _wpMap;
  _wpMap = new Map();
  for (const f of fs.readdirSync(PUB)) {
    // The two graph files are sync TARGETS, never derivation sources:
    // once the citizens land, the graphs themselves carry WebPage
    // nodes with the citizens' @ids and would make resolution
    // ambiguous (found at Q3 execution, 2026-11-03 — the staged
    // validation ran against pre-citizen graphs).
    if (!f.endsWith('.json') || f.startsWith('datasets-') ||
        f === 'entity-graph.json' || f === 'best-json-entity-graph.json') continue;
    let doc;
    try { doc = JSON.parse(fs.readFileSync(path.join(PUB, f), 'utf8')); } catch (e) { continue; }
    for (const n of nodesOf(doc)) {
      if (typeIs(n, 'WebPage') && typeof n['@id'] === 'string') {
        if (!_wpMap.has(n['@id'])) _wpMap.set(n['@id'], []);
        _wpMap.get(n['@id']).push(f);
      }
    }
  }
  return _wpMap;
}

function resolveJsonFile(url, slug, headKey) {
  const hits = webPageFileMap().get(url) || [];
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) throw new Error(url + ': per-page JSON resolution ambiguous: ' + hits.join(', '));
  const derived = slug.replace(/\//g, '-') + '.json';
  if (fs.existsSync(path.join(PUB, derived))) return derived;
  const hd = headData()[headKey];
  if (hd && hd.jf && fs.existsSync(path.join(PUB, hd.jf))) return hd.jf;
  throw new Error(url + ': per-page JSON unresolvable');
}

/* ---------------- derivation (the Q3 rule) ------------------------ */
const HUB_PATHS = POPULATION.filter((e) => e.kind === 'hub').map((e) => e.path);
function parentHub(p) {
  let best = null;
  for (const h of HUB_PATHS) {
    if (h !== p && p.startsWith(h) && (!best || h.length > best.length)) best = h;
  }
  return best;
}

function deriveOne(entry) {
  const url = SITE + entry.path;
  const slug = entry.path === '/' ? 'home' : entry.path.slice(1, -1);
  const headKey = entry.path === '/' ? '/' : entry.path.slice(0, -1);
  const reg = pagesBySlug.get(slug);
  if (!reg) throw new Error(entry.path + ': not in data/pages.json');
  const services = reg.services || [];
  const jf = resolveJsonFile(url, slug, headKey);
  const doc = JSON.parse(fs.readFileSync(path.join(PUB, jf), 'utf8'));
  const nodes = nodesOf(doc);
  let node = null, cls = null, source = jf;

  if (entry.kind === 'hub') {
    const cand = nodes.find((n) => typeIs(n, 'CollectionPage'));
    if (!cand) throw new Error(entry.path + ': no CollectionPage node in ' + jf);
    node = clone(cand); cls = 'collection';
    if (!('about' in node)) {
      if (services.length) node.about = services.map((s) => ({ '@id': SITE + '/#' + s }));
      else if (!parentHub(entry.path)) node.about = [{ '@id': SITE + '/#organization' }];
    } else if (services.length) {
      const aboutIds = (Array.isArray(node.about) ? node.about : [node.about]).map((a) => a && a['@id']).sort();
      const regIds = services.map((s) => SITE + '/#' + s).sort();
      if (JSON.stringify(aboutIds) !== JSON.stringify(regIds)) {
        throw new Error(entry.path + ': hub about != registry services (drift is a decision): ' +
          aboutIds.join(',') + ' vs ' + regIds.join(','));
      }
    }
    const parent = parentHub(entry.path);
    if (parent && !('isPartOf' in node)) node.isPartOf = { '@id': SITE + parent + '#collection' };
  } else {
    const lastSeg = slug.split('/').pop();
    const scoped = nodes.find((n) => typeIs(n, 'Service') && typeof n['@id'] === 'string' && n['@id'].indexOf(url) === 0);
    const ownSlug = nodes.find((n) => typeIs(n, 'Service') && n['@id'] === SITE + '/#service-' + lastSeg && !REGISTERED.has(n['@id']));
    if (scoped || ownSlug) {
      node = clone(scoped || ownSlug); cls = 'service';
      const blob = JSON.stringify(node);
      const linked = [...REGISTERED].some((id) => blob.includes('"' + id + '"'));
      if (!linked) {
        if (!services.length) throw new Error(entry.path + ': Service citizen has no registry service to join');
        node.isPartOf = { '@id': SITE + '/#' + services[0] };
      }
    } else {
      const wp = nodes.find((n) => typeIs(n, 'WebPage') && n['@id'] === url);
      if (wp) { node = clone(wp); cls = 'webpage'; }
      else {
        const hd = headData()[headKey];
        if (!hd || !hd.ld) throw new Error(entry.path + ': no page-class node in ' + jf + ' and no served ld in head-data');
        const swp = nodesOf(JSON.parse(hd.ld)).find((n) => typeIs(n, 'WebPage'));
        if (!swp) throw new Error(entry.path + ': served ld carries no WebPage node');
        node = clone(swp); cls = 'webpage-served'; source = 'head-data ld (served page-jsonld)';
      }
      if (!services.length) throw new Error(entry.path + ': variant WebPage citizen has no registry services for its about join');
      node.about = services.map((s) => ({ '@id': SITE + '/#' + s }));
    }
  }
  if (!node['@id']) throw new Error(entry.path + ': derived node has no @id');
  // The population module carries the cls + @id read off the sealed
  // sources at generation time; the live derivation must agree.
  if (node['@id'] !== entry.id) throw new Error(entry.path + ': derived @id ' + node['@id'] + ' != population @id ' + entry.id);
  if (cls !== entry.cls) throw new Error(entry.path + ': derived class ' + cls + ' != population class ' + entry.cls);
  return { page: entry.path, kind: entry.kind, cls, id: node['@id'], node, source };
}

function deriveAll() {
  const out = POPULATION.map(deriveOne);
  const ids = new Set(out.map((d) => d.id));
  if (ids.size !== out.length) throw new Error('duplicate citizen @id derived');
  if (out.length !== 86) throw new Error('population drift: derived ' + out.length + ' != 86');
  return out;
}

/* ------- textual sync into the graph files (FB-2 mechanics) ------ */
function skipString(text, i) {
  // i points at the opening quote; returns index just past the close quote.
  i++;
  while (i < text.length) {
    if (text[i] === '\\') { i += 2; continue; }
    if (text[i] === '"') return i + 1;
    i++;
  }
  throw new Error('unterminated string');
}

function elementSpans(text) {
  // Spans [start, end) of each top-level element of the "@graph" array.
  const gAt = text.indexOf('"@graph"');
  if (gAt < 0) throw new Error('no @graph key');
  let i = text.indexOf('[', gAt);
  if (i < 0) throw new Error('no @graph array');
  i++;
  const spans = [];
  let depth = 0, start = -1;
  while (i < text.length) {
    const c = text[i];
    if (c === '"') { i = skipString(text, i); continue; }
    if (c === '{' || c === '[') { if (depth === 0) start = i; depth++; i++; continue; }
    if (c === '}' || c === ']') {
      depth--;
      if (depth === 0 && start >= 0) { spans.push([start, i + 1]); start = -1; i++; continue; }
      if (depth < 0) break;
      i++; continue;
    }
    i++;
  }
  return spans;
}

function graphArrayEnd(text) {
  const gAt = text.indexOf('"@graph"');
  let i = text.indexOf('[', gAt);
  i++;
  let depth = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '"') { i = skipString(text, i); continue; }
    if (c === '{' || c === '[') { depth++; i++; continue; }
    if (c === '}' || c === ']') {
      if (depth === 0) return i; // the array's own closing bracket
      depth--; i++; continue;
    }
    i++;
  }
  throw new Error('@graph array end not found');
}

function formatNode(node) {
  // Matches the files' existing style (FB-2): 2-space element indent.
  return JSON.stringify(node, null, 1).split('\n').map((l) => '  ' + l).join('\n');
}

function syncGraph(file, derived, { bumpDateModified }) {
  const before = fs.readFileSync(file, 'utf8');
  const doc = JSON.parse(before);
  const existing = new Map();
  for (const n of doc['@graph'] || []) if (n && n['@id']) existing.set(n['@id'], n);
  const inserts = [], replaces = [], skips = [];
  for (const d of derived) {
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
    for (const d of [...replaces].sort((a, b) => byId.get(b.id)[0] - byId.get(a.id)[0])) {
      const [s, e] = byId.get(d.id);
      after = after.slice(0, s) + formatNode(d.node).slice(2) + after.slice(e);
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
  const docAfter = JSON.parse(after);
  const g = docAfter['@graph'];
  if (g.length !== (doc['@graph'] || []).length + inserts.length) throw new Error(file + ': count delta wrong');
  const beforeIds = (doc['@graph'] || []).map((n) => n && n['@id']);
  const keptIds = g.filter((n) => beforeIds.includes(n && n['@id'])).map((n) => n && n['@id']);
  if (JSON.stringify(keptIds) !== JSON.stringify(beforeIds)) throw new Error(file + ': pre-existing node order changed');
  const byIdAfter = new Map(g.filter((n) => n && n['@id']).map((n) => [n['@id'], n]));
  for (const d of derived) {
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
console.log('derived ' + derived.length + ' citizenship nodes (' +
  derived.filter((d) => d.cls === 'webpage').length + ' WebPage, ' +
  derived.filter((d) => d.cls === 'webpage-served').length + ' served-WebPage, ' +
  derived.filter((d) => d.cls === 'service').length + ' Service, ' +
  derived.filter((d) => d.cls === 'collection').length + ' CollectionPage)');
const targets = [
  [path.join(PUB, 'entity-graph.json'), false],
  [path.join(PUB, 'best-json-entity-graph.json'), true],
  [path.join(ROOT, 'data/entity-graph.json'), false],
  [path.join(ROOT, 'data/best-json-entity-graph.json'), true],
];
for (const [f, bump] of targets) syncGraph(f, derived, { bumpDateModified: bump });
console.log('OK — variant graph sync ' + (CHECK ? 'checked' : 'complete'));
