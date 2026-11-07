'use strict';
/* sync-derived-copies.js — seal-wired alignment of every DATE copy seat
 * (Copy-Integrity batch, 2026-11-04).
 *
 * The catalog-pointer reconciliation exposed the estate's copy-drift
 * class in its date form: when the seal's lastmod ledger advanced a
 * page to a new date, every hand-copied dateModified seat of that page
 * went stale at once — per-page JSON page nodes, nested taxonomy
 * seats, Dataset nodes inside per-page JSONs, and the dataset landing
 * embeds baked into the shell — and each surface had to be re-aligned
 * by a hand-run script (the reconciliation ran four). This script is
 * that alignment, made permanent: seal.py runs it in phase 2c (after
 * dataset generation + stamping + the catalog-registry regeneration,
 * before sitemap/route generation) and verify.js §42 CI-6 runs it in
 * --check mode as the standing gate.
 *
 * Rules (identical in heal and check mode):
 *   1. Canonical page dates come from data/lastmod-ledger.json, keyed
 *      by each file's OWN primary page-class node @id — never by
 *      filename joins.
 *   2. Per-page JSONs (every PUB root *.json except datasets-*.json
 *      and the non-page root files): every page-class node
 *      (WebPage / Article / ProfilePage) whose @id is the file's own
 *      page gets dateModified = the ledger date, preserving each
 *      value's existing FORM (date-only stays date-only; an instant
 *      keeps its T00:00:00-05:00 shape). That covers the nested
 *      taxonomy seats too — they are page-class nodes inside
 *      category-*.json files.
 *   3. Dataset nodes inside per-page dataset-*.json seats: dateModified
 *      = the same-@id Dataset node's dateModified in the canonical
 *      datasets-*.json file (post-stamping).
 *   4. Shell (repo-dir/index.html ld+json blocks): every embedded
 *      node that claims to BE a page (page-class type; @id is the
 *      page URL or carries only a page-node fragment — #webpage,
 *      #article, #profilepage) gets dateModified = the ledger date
 *      of its bare @id, replaced textually inside its object span.
 *      Everything else embedded is NOT a page-date copy and is left
 *      alone, on measurements taken in the Copy-Integrity batch:
 *      Dataset summary records inside the landing embeds are a
 *      different, authored node shape (they carry file:/landing:
 *      fields; the /datasets/residential/#dataset embed record
 *      differs from the seat node in 14 fields), and the embeds'
 *      Article nodes are dataset-content records (glossary terms
 *      and personas with @ids like #dataset-route81-terms), not
 *      page copies. Their dates ride the owning generators' and
 *      batches' embed re-syncs (the standing landing-embeds rule).
 *   Files that do not JSON round-trip byte-identically are edited
 *   textually with an occurrence-count assertion; a file whose stale
 *   value is shared by an out-of-scope node aborts the run loudly
 *   rather than guessing.
 *
 * Usage: node scripts/sync-derived-copies.js [--check]
 * Exit: heal mode 0 on success; --check exits 1 when any drift is
 * found (and writes nothing). Output: one JSON summary line. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PATHS = JSON.parse(fs.readFileSync(path.join(ROOT, 'paths.json'), 'utf8'));
const PUB = PATHS.public_dir;
const REPO = PATHS.repo_dir;
const CHECK = process.argv.includes('--check');

const readJ = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const ledgerDoc = readJ(path.join(ROOT, 'data', 'lastmod-ledger.json'));
const ledger = ledgerDoc.urls || ledgerDoc; // seal ledger: { urls: { <page URL>: 'YYYY-MM-DD' } }
const ledgerDate = (url) => { const v = ledger[url]; if (!v) return null; return typeof v === 'string' ? v : (v.dateModified || null); };
const typeHas = (n, t) => { const ty = n && n['@type']; return Array.isArray(ty) ? ty.includes(t) : ty === t; };
const PAGE_CLASS = ['WebPage', 'Article', 'ProfilePage'];
const isPageClass = (n) => PAGE_CLASS.some((t) => typeHas(n, t));
const fmtLike = (existing, target) => {
  const d = String(target).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(existing)) return d;
  if (String(existing).includes('T')) return d + 'T00:00:00-05:00';
  return d;
};

const summary = { perPageFiles: 0, perPageDatesFixed: 0, datasetSeatDatesFixed: 0, shellEmbedDatesFixed: 0, skippedNoLedger: [], drift: [] };
const note = (kind, file, id, from, to) => { summary.drift.push({ kind, file, id, from, to }); };

/* Align one parsed JSON file's dateModified values. muts: list of
 * {node, target} — node objects are mutated in place on the parsed doc;
 * the caller writes via round-trip or textual discipline. */
function alignFile(file, mutate) {
  const text = fs.readFileSync(file, 'utf8');
  const doc = JSON.parse(text);
  const stale = mutate(doc); // [{from,to}] applied to doc already
  if (!stale.length) return 0;
  const reser = JSON.stringify(doc, null, 2) + (text.endsWith('\n') ? '\n' : '');
  const pristine = (() => { const d = JSON.parse(text); return JSON.stringify(d, null, 2) + (text.endsWith('\n') ? '\n' : ''); })();
  if (pristine === text) {
    if (!CHECK) fs.writeFileSync(file, reser);
    return stale.length;
  }
  /* textual discipline: every stale pair must occur exactly as many
   * times in the raw text as it occurs among the mutated nodes. */
  let out = text;
  for (const { from, to, count } of stale) {
    /* The needle takes the file's OWN serialization: indent=1 files write
     * "dateModified":"..." (no space after the colon); spaced files write
     * "dateModified": "...". Use whichever form occurs exactly `count`
     * times and replace in the same form; fail only when neither form is
     * safe. Extended 2026-11-05 (Hoarding close): the commercial-freight
     * per-page JSON is compact-form, and the seal-384a2e5d ledger advance
     * for its page made the spaced needle occur 0x. */
    const forms = ['"dateModified": ' + JSON.stringify(from), '"dateModified":' + JSON.stringify(from)];
    /* The global fast path is safe ONLY when every occurrence of the
     * stale value in the file, in BOTH serializations, belongs to a
     * mutated node (total == count). Otherwise — e.g. dataset-quote-tool
     * .json, whose WebPage node serializes spaced and whose Dataset node
     * serializes compact — a single-form count can coincidentally match
     * the WRONG node's occurrences, and two sections then fight over
     * that one node forever (found 2026-11-05, Hoarding close: sections
     * 1 and 3 each fast-pathed the same spaced node, net effect zero).
     * With node ids present, the positional path below is node-exact and
     * is always preferred. */
    const totalOcc = forms.reduce((a, n) => a + (out.split(n).length - 1), 0);
    const pairIds = (stale.find((s) => s.from === from && s.to === to) || {}).ids || [];
    const form = pairIds.length !== count && totalOcc === count ? forms.find((n) => out.split(n).length - 1 === count) : null;
    if (form) {
      const toForm = form.indexOf('": ') >= 0 ? '"dateModified": ' + JSON.stringify(to) : '"dateModified":' + JSON.stringify(to);
      out = out.split(form).join(toForm);
      continue;
    }
    /* Positional path (extended 2026-11-05, Hoarding close): an
     * out-of-scope node in the same file shares the stale value (the
     * dataset-landing seats carry a summary Dataset node whose date
     * stands apart from the page node's ledger date — e.g.
     * dataset-intent-coverage.json, both at 2026-11-04 while only the
     * WebPage node moves). Replace only the occurrence owned by each
     * mutated node: locate the node's object span (the smallest object
     * containing its "@id" anchor), then the first dateModified needle
     * at the span's own field depth (nested reference objects — a
     * breadcrumb {"@id": ...} — sit deeper and are never touched).
     * Fail loud when an anchor or needle cannot be isolated. */
    const ids = (stale.find((s) => s.from === from && s.to === to) || {}).ids || [];
    if (ids.length !== count) throw new Error(file + ': textual alignment unsafe — "dateModified" ' + JSON.stringify(from) + ' occurs in neither serialization the expected ' + count + 'x, and the mutated-node id set does not match the count (a stale value is shared by an out-of-scope node; extend the script, do not guess)');
    const spans = [];
    { let i = 0;
      while (i < out.length) {
        const open = out.indexOf('{', i);
        if (open < 0) break;
        let depth = 0, j = open, inStr = false, esc = false;
        for (; j < out.length; j++) {
          const c = out[j];
          if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; }
          else if (c === '"') inStr = true;
          else if (c === '{') depth++;
          else if (c === '}') { depth--; if (depth === 0) break; }
        }
        spans.push([open, j]);
        i = open + 1;
      } }
    for (const id of ids) {
      const anchors = ['"@id": ' + JSON.stringify(id), '"@id":' + JSON.stringify(id)];
      let replaced = false;
      for (const a of anchors) {
        let from = 0;
        while (!replaced) {
          const aAt = out.indexOf(a, from);
          if (aAt < 0) break;
          from = aAt + a.length;
          let span = null;
          for (const [s0, s1] of spans) if (s0 <= aAt && aAt <= s1 && (!span || s1 - s0 < span[1] - span[0])) span = [s0, s1];
          if (!span) continue;
          let depth = 0, inStr = false, esc = false;
          for (let j = span[0]; j <= span[1] && !replaced; j++) {
            const c = out[j];
            if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
            if (c === '"') {
              if (depth === 1) {
                for (const nf of forms) {
                  if (out.startsWith(nf, j)) {
                    const toForm = nf.indexOf('": ') >= 0 ? '"dateModified": ' + JSON.stringify(to) : '"dateModified":' + JSON.stringify(to);
                    out = out.slice(0, j) + toForm + out.slice(j + nf.length);
                    replaced = true;
                    break;
                  }
                }
              }
              if (!replaced) inStr = true;
              continue;
            }
            if (c === '{') depth++;
            else if (c === '}') depth--;
          }
        }
        if (replaced) break;
      }
      if (!replaced) throw new Error(file + ': textual alignment unsafe — no isolable dateModified needle in the node span of ' + id);
    }
  }
  if (!CHECK) fs.writeFileSync(file, out);
  return stale.length;
}

/* --- canonical @id -> dateModified map (dataset files win) --- */
const rootJsons = fs.readdirSync(PUB).filter((f) => f.endsWith('.json'));
const canon = new Map();
for (const pass of [0, 1]) {
  for (const f of rootJsons) {
    const isDs = f.startsWith('datasets-');
    if ((pass === 0) !== isDs) continue;
    let doc; try { doc = readJ(path.join(PUB, f)); } catch (e) { continue; }
    for (const n of (doc['@graph'] || [])) {
      if (n && n['@id'] && n.dateModified && !canon.has(n['@id'])) canon.set(n['@id'], n.dateModified);
    }
  }
}

/* --- 1+2. per-page JSONs: page-class nodes keyed by the file's own @id --- */
const SKIP = new Set(['ai-master-index.json', 'ai-sitemap.json', 'entity-graph.json', 'best-json-entity-graph.json', 'page-data-scores.json']);
for (const f of rootJsons) {
  if (f.startsWith('datasets-') || SKIP.has(f)) continue;
  const file = path.join(PUB, f);
  let doc; try { doc = readJ(file); } catch (e) { continue; }
  const graph = doc['@graph'] || [];
  const own = graph.find((n) => isPageClass(n) && n['@id']);
  if (!own) continue;
  summary.perPageFiles++;
  const pageUrl = own['@id'].split('#')[0]; // Article '#article' / WebPage '#webpage' nodes share the page's bare URL
  const target = ledgerDate(pageUrl);
  if (!target) { summary.skippedNoLedger.push(f); continue; }
  const fixed = alignFile(file, (d) => {
    const pairs = new Map();
    for (const n of (d['@graph'] || [])) {
      if (isPageClass(n) && n['@id'] && n['@id'].split('#')[0] === pageUrl && n.dateModified) {
        const neu = fmtLike(n.dateModified, target);
        if (neu !== n.dateModified) {
          note('per-page', f, n['@id'], n.dateModified, neu);
          const k = n.dateModified + ' ' + neu;
          const rec = pairs.get(k) || { from: n.dateModified, to: neu, count: 0, ids: [] };
          rec.count++; rec.ids.push(n['@id']); pairs.set(k, rec);
          n.dateModified = neu;
        }
      }
    }
    return [...pairs.values()];
  });
  summary.perPageDatesFixed += fixed;
}

/* --- 3. Dataset nodes inside per-page dataset-*.json seats --- */
for (const f of rootJsons) {
  if (!f.startsWith('dataset-')) continue;
  const srcName = 'datasets-' + f.slice('dataset-'.length);
  if (!fs.existsSync(path.join(PUB, srcName))) continue;
  const file = path.join(PUB, f);
  const fixed = alignFile(file, (d) => {
    const pairs = new Map();
    for (const n of (d['@graph'] || [])) {
      if (typeHas(n, 'Dataset') && n['@id'] && n.dateModified && canon.has(n['@id'])) {
        const neu = fmtLike(n.dateModified, canon.get(n['@id']));
        if (neu !== n.dateModified) {
          note('dataset-seat', f, n['@id'], n.dateModified, neu);
          const k = n.dateModified + ' ' + neu;
          const rec = pairs.get(k) || { from: n.dateModified, to: neu, count: 0, ids: [] };
          rec.count++; rec.ids.push(n['@id']); pairs.set(k, rec);
          n.dateModified = neu;
        }
      }
    }
    return [...pairs.values()];
  });
  summary.datasetSeatDatesFixed += fixed;
}

/* --- 4. shell landing-embed dates (textual, span-scoped) --- */
const shellFile = path.join(REPO, 'index.html');
{
  const html = fs.readFileSync(shellFile, 'utf8');
  const blocks = [];
  const re = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) blocks.push({ start: m.index, bodyStart: m.index + m[0].indexOf(m[1]), body: m[1] });
  const edits = [];
  for (const b of blocks) {
    const s = b.body;
    let i = 0;
    while (i < s.length) {
      const open = s.indexOf('{', i);
      if (open < 0) break;
      let depth = 0, j = open, inStr = false, esc = false;
      for (; j < s.length; j++) {
        const c = s[j];
        if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; }
        else if (c === '"') inStr = true;
        else if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) { j++; break; } }
      }
      const span = s.slice(open, j);
      if (span.length <= 200000 && span.includes('"@id"') && span.includes('"dateModified"')) {
        let obj = null; try { obj = JSON.parse(span); } catch (e) { /* not a standalone object */ }
        /* Only a node that claims to BE a page is a date copy of that
         * page: page-class type, and an @id that is the page URL
         * itself or carries only a page-node fragment. Content
         * records inside dataset embeds (Article nodes with @ids
         * like #dataset-route81-terms) are dataset content, not page
         * copies, and are excluded by the fragment test. */
        const frag = obj && obj['@id'] && obj['@id'].includes('#') ? obj['@id'].split('#')[1] : '';
        const isPageNode = obj && obj['@id'] && obj.dateModified && isPageClass(obj)
          && (frag === '' || frag === 'webpage' || frag === 'article' || frag === 'profilepage')
          && ledgerDate(obj['@id'].split('#')[0]);
        if (isPageNode) {
          const want = fmtLike(obj.dateModified, ledgerDate(obj['@id'].split('#')[0]));
          if (obj.dateModified !== want) {
            /* The needle must be the node's OWN dateModified: search
             * from its @id forward, stopping at its distribution
             * array (child objects live there; a node's own scalar
             * fields always precede it in these embeds). */
            const needleForms = ['"dateModified": ' + JSON.stringify(obj.dateModified), '"dateModified":' + JSON.stringify(obj.dateModified)];
            const from = span.indexOf('"@id"');
            const distAt = span.indexOf('"distribution"', from);
            let needle = null; let at = -1;
            for (const nf of needleForms) { const a = span.indexOf(nf, from); if (a >= 0) { needle = nf; at = a; break; } }
            if (at >= 0 && (distAt < 0 || at < distAt)) {
              edits.push({ at: b.bodyStart + open + at, len: needle.length, to: (needle.indexOf('": ') >= 0 ? '"dateModified": ' + JSON.stringify(want) : '"dateModified":' + JSON.stringify(want)) });
              note('shell-embed', 'repo-dir/index.html', obj['@id'], obj.dateModified, want);
              summary.shellEmbedDatesFixed++;
            }
          }
        }
      }
      i = open + 1; // visit every nested object span too — embeds are @graph documents, the nodes live inside
    }
  }
  if (edits.length && !CHECK) {
    edits.sort((a, b2) => b2.at - a.at);
    let out = html;
    for (const e of edits) out = out.slice(0, e.at) + e.to + out.slice(e.at + e.len);
    fs.writeFileSync(shellFile, out);
  }
}

console.log(JSON.stringify({ mode: CHECK ? 'check' : 'heal', ...summary, driftTotal: summary.drift.length }));
if (CHECK && summary.drift.length) process.exit(1);
