#!/usr/bin/env node
/* The Flat Rate Machine — answer-evidence landing reconciliation
 * (Outside-Copies micro-batch, 2026-11-11).
 *
 * The standing landing-embeds rule leaves each dataset landing's
 * embedded graph to its owning generator's re-syncs. The
 * answer-evidence landing never got one after 2026-11-04: its shell
 * embed (data-ld="datasets-answer-evidence") froze as a full
 * 4,123-question snapshot of an old generation while the dataset
 * file moved on to the live rubric (30,928 rows at the batch that
 * built this script), its pageMeta description kept a still older
 * generation's figures (3,852 / 3,064), and its singular per-page
 * JSON's Dataset node kept a 2026-10-31 date. This script is the
 * owning re-sync, made permanent on the refresh-pool-digests
 * pattern: seal.py runs it inside every consumer-settle round and
 * once more unconditionally after the phase-4c contingency, so the
 * landing is always glued to the answer-evidence file the same
 * seal produces.
 *
 * Seats reconciled, all from the CURRENT datasets-answer-evidence
 * .json (the source of truth — never the rubric DB directly, never
 * hand figures):
 *   1. Shell landing embed (repo-dir/index.html, the unique
 *      data-ld="datasets-answer-evidence" ld+json block): the
 *      file's full @graph, verbatim, except the two payload arrays
 *      are bounded samples of the CURRENT build — the questions
 *      node's questions[] and the fragments node's
 *      answerFragments[] are cut to their first 25 entries. The
 *      totals/scope/description nodes ride verbatim, so the
 *      landing states the file's true counts (with the file's
 *      DataDownload seats) while the full set stays in the file.
 *      The block's serialization (JSON indent 1, no trailing
 *      newline) round-trips byte-identically — asserted here on
 *      every run before any splice.
 *   2. The landing's pageMeta description figures (the
 *      'datasets-answer-evidence' entry's "N rubric questions" /
 *      "M answer fragments") in both main.js seats and the shell's
 *      inline router copy — the same scoped replacement in all
 *      three, so TW-1/TW-7 identity is preserved. A re-authored
 *      description without those figure patterns is reported, not
 *      forced (verify.js AE-5 is the gate that fails the close).
 *   3. The singular per-page JSON (PUB/dataset-answer-evidence
 *      .json): its authored summary Dataset node's dateModified
 *      aligns to the dataset file's totals-node dateModified (its
 *      description carries no counts — nothing else is touched;
 *      sync-derived-copies cannot heal this node: its @id is not
 *      one of the file's graph @ids).
 *
 * Usage: node scripts/sync-ae-landing.js [--check]
 * Heal mode writes only seats whose bytes change; --check writes
 * nothing and exits 1 when any seat is unreconciled. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REG = JSON.parse(fs.readFileSync(path.join(ROOT, 'paths.json'), 'utf8'));
const PUB = REG.public_dir;
const REPO = REG.repo_dir;
const CHECK = process.argv.includes('--check');
const SAMPLE = 25;
const fmt = (n) => n.toLocaleString('en-US');

const summary = { questions: 0, fragments: 0, sampleQuestions: 0,
  sampleFragments: 0, shellBlock: 'unchanged', descSeats: [],
  descWarnings: [], jfDate: 'unchanged', pending: 0 };
const note = (k) => { summary.pending++; };

/* ---- source of truth: the current dataset file ------------------- */
const fileDoc = JSON.parse(fs.readFileSync(
  path.join(PUB, 'datasets-answer-evidence.json'), 'utf8'));
const g = fileDoc['@graph'] || [];
const node = (suffix) => g.find((n) => String(n['@id']).endsWith(suffix));
const totalsNode = node('#dataset-answer-evidence-totals');
if (!totalsNode || !totalsNode.totals) {
  throw new Error('answer-evidence totals node missing — cannot reconcile');
}
const Q = totalsNode.totals.questions;
const F = totalsNode.totals.fragments;
const DM = totalsNode.dateModified;
summary.questions = Q;
summary.fragments = F;

/* ---- 1. the shell landing embed ---------------------------------- */
const landingGraph = {
  '@context': fileDoc['@context'],
  '@graph': g.map((n) => {
    if (String(n['@id']).endsWith('#dataset-answer-evidence-questions')) {
      summary.sampleQuestions = Math.min(SAMPLE, (n.questions || []).length);
      return { ...n, questions: (n.questions || []).slice(0, SAMPLE) };
    }
    if (String(n['@id']).endsWith('#dataset-answer-evidence-fragments')) {
      summary.sampleFragments = Math.min(SAMPLE,
        (n.answerFragments || []).length);
      return { ...n, answerFragments: (n.answerFragments || []).slice(0, SAMPLE) };
    }
    return n;
  }),
};
const newBody = JSON.stringify(landingGraph, null, 1);
const shellPath = path.join(REPO, 'index.html');
let shell = fs.readFileSync(shellPath, 'utf8');
const blockRe = /(<script type="application\/ld\+json" data-ld="datasets-answer-evidence">)([\s\S]*?)(<\/script>)/g;
const blocks = [...shell.matchAll(blockRe)];
if (blocks.length !== 1) {
  throw new Error(`expected exactly 1 AE landing embed block, found ${blocks.length}`);
}
const oldBody = blocks[0][2];
/* Serialization discipline: the seat round-trips under indent 1 —
 * prove it on the CURRENT body before splicing anything. */
if (JSON.stringify(JSON.parse(oldBody), null, 1) !== oldBody) {
  throw new Error('AE landing embed does not round-trip under indent 1 — refusing to splice');
}
let shellDirty = false;
if (oldBody !== newBody) {
  summary.shellBlock = `spliced (${oldBody.length} -> ${newBody.length} bytes)`;
  note('shellBlock');
  shell = shell.replace(blockRe,
    (m0, open, _body, close) => open + newBody + close);
  shellDirty = true;
}

/* ---- 2. pageMeta description figures (3 seats) -------------------- */
const descFiles = [path.join(REPO, 'index.html'),
  path.join(REPO, 'main.js'),
  path.join(ROOT, 'scripts', 'route-assets', 'main.js')];
for (const p of descFiles) {
  let text = p === shellPath ? shell : fs.readFileSync(p, 'utf8');
  const at = text.indexOf("'datasets-answer-evidence':{");
  if (at < 0) { summary.descWarnings.push(path.basename(p) + ': entry not found'); continue; }
  const span = text.slice(at, at + 4000);
  const qm = span.match(/([\d,]+) rubric questions/);
  const fm = span.match(/([\d,]+) answer fragments/);
  if (!qm || !fm) {
    summary.descWarnings.push(path.basename(p) +
      ': figure patterns absent (re-authored desc?)');
    continue;
  }
  let nspan = span;
  if (qm[1] !== fmt(Q)) nspan = nspan.replace(qm[0], fmt(Q) + ' rubric questions');
  if (fm[1] !== fmt(F)) nspan = nspan.replace(fm[0], fmt(F) + ' answer fragments');
  if (nspan !== span) {
    summary.descSeats.push(path.basename(p));
    note('desc');
    text = text.slice(0, at) + nspan + text.slice(at + 4000);
    if (p === shellPath) { shell = text; shellDirty = true; }
    else if (!CHECK) fs.writeFileSync(p, text);
  }
}
/* the shell is written once, after both of its seats are reconciled */
if (!CHECK && shellDirty) fs.writeFileSync(shellPath, shell);

/* ---- 3. singular per-page JSON date ------------------------------- */
const jfPath = path.join(PUB, 'dataset-answer-evidence.json');
const jfText = fs.readFileSync(jfPath, 'utf8');
const jf = JSON.parse(jfText);
const dsNode = (jf['@graph'] || []).find((n) =>
  String(n['@id']).endsWith('datasets-answer-evidence.json#dataset'));
if (!dsNode) throw new Error('singular jf Dataset node missing');
if (JSON.stringify(JSON.parse(jfText), null, 1) + '\n' !== jfText) {
  throw new Error('singular jf does not round-trip under indent 1 + newline — refusing');
}
if (dsNode.dateModified !== DM) {
  summary.jfDate = `${dsNode.dateModified} -> ${DM}`;
  note('jf');
  if (!CHECK) {
    dsNode.dateModified = DM;
    fs.writeFileSync(jfPath, JSON.stringify(jf, null, 1) + '\n');
  }
}

console.log(JSON.stringify({ mode: CHECK ? 'check' : 'heal', ...summary }));
if (CHECK && summary.pending) process.exit(1);
