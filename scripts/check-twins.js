#!/usr/bin/env node
// check-twins.js — twin-identity gate (Reconciliation batch, 2026-11-03).
//
// Root cause it kills: the Page Data Pool close (2026-11-03) shipped a
// router splice into scripts/route-assets/main.js but not into its twin
// repo-dir/main.js — the copy digest-index.py resolves for that signed
// distribution (repo-dir/<basename> for every raw.githubusercontent
// contentUrl). The seal certified the stale twin; only the LIVE close
// (verify.js P-6) caught it. This gate byte-compares every duplicated
// seat in the estate LOCALLY, so a divergence fails before deploy —
// verify.js §39 (TW-1..TW-6) registers its verdicts, and publish.py
// runs it as preflight step 0.
//
// The pair list is DERIVED, not hand-listed:
//   A  scripts/ ∩ repo-dir/ same-basename files (generator twins)
//   B  scripts/route-assets/ ∩ repo-dir/ same-basename files
//   C  machine-root files ∩ repo-dir/ same-basename files (verify.js)
//   D  repo-dir/ basenames found anywhere under Pages functions/
//   G  repo-dir/ ∩ Pages-public-root basenames (minus registered
//      derived seats — the shell's route documents)
//   E  two REGISTERED cross-basename role pairs (worker sources vs
//      their sealed repo-dir distribution copies)
//   F  multi-seat data groups from the completeness scan itself
//      (entity graph, best graph, service-area geojson — every seat
//      the scan finds is byte-compared as one group)
// New twins join automatically: a file added to both sides of a
// derived class is compared from that moment; a duplicated seat that
// appears anywhere in the scanned trees without classification FAILS
// TW-6 until it is paired, grouped, or entered in the EXCLUSIONS
// register below with a reason.
//
// Usage: node scripts/check-twins.js [--json]
// Exit 0 = every pair/group byte-identical and every duplicated seat
// classified. Exit 1 = divergence or unclassified seat.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');           // the-flat-rate-machine
const WS = path.resolve(ROOT, '..');                  // ~/workspace
const REG = JSON.parse(fs.readFileSync(path.join(ROOT, 'paths.json'), 'utf8'));
const REPO = REG.repo_dir;
const PUB = REG.public_dir;
const PAGES = REG.pages_dir;
const FLAT = path.join(WS, 'theflatratemovers');
const MACHDATA = path.join(ROOT, 'data');
const API_SRC = path.join(REG.api_worker_dir, 'src');
const QUOTE_SRC = path.join(WS, 'the-flat-rate-movers-worker', 'src');

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const filesOf = (dir) => fs.existsSync(dir)
  ? fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name) : [];
const walkFiles = (dir) => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) out.push(...walkFiles(p)); else if (d.isFile()) out.push(p);
  }
  return out;
};

// Scoped trees for the completeness scan (TW-6). Push targets
// (git-mirrors clones) and generated output trees (public/ below its
// root, out/**) are excluded by design: clone equality is proven by
// the push itself + verify.js P-6; public/ documents are seal outputs
// proven by P-2/P-3. Only hand-edited working seats are scanned.
const TREES = [
  ['MACH-root', ROOT, false],
  ['scripts', path.join(ROOT, 'scripts'), false],
  ['route-assets', path.join(ROOT, 'scripts', 'route-assets'), false],
  ['repo-dir', REPO, false],
  ['mach-data', MACHDATA, false],
  ['functions', path.join(PAGES, 'functions'), true],
  ['PUB-root', PUB, false],
  ['FLAT-root', FLAT, false],
  ['api-src', API_SRC, false],
  ['quote-src', QUOTE_SRC, false],
];
function scanGroups() {
  const groups = new Map(); // basename -> Map(treeLabel -> absPath)
  for (const [label, dir, recursive] of TREES) {
    const files = recursive ? walkFiles(dir) : filesOf(dir).map((n) => path.join(dir, n));
    for (const p of files) {
      const base = path.basename(p);
      if (!groups.has(base)) groups.set(base, new Map());
      groups.get(base).set(label, p);
    }
  }
  return groups;
}

// EXCLUSIONS — multi-seat basenames that are NOT twins. Every seat of
// an excluded basename must be listed here with its reason; a new seat
// of an excluded basename in another tree is unclassified and fails.
//   index.html: repo-dir/index.html is the source shell; the PUB-root
//     seat is its generated home route document (build-routes stamps +
//     head injection). Derived, never byte-compared.
//   rubric.db: the working DB is the FLAT seat (paths.json rubric_db).
//     The MACH-root seat is a 0-byte stray (asserted below — if it ever
//     gains content, classification fails and a human must re-decide).
//   services.json: two different documents — mach-data/services.json
//     is the service registry; the PUB-root seat is the /services/
//     page's JSON-LD (CollectionPage). Shared basename only.
const EXCLUSIONS = {
  'index.html': {
    'repo-dir': 'source shell (the PUB seat is derived from it)',
    'PUB-root': 'derived route document (build-routes output), not a twin',
  },
  'rubric.db': {
    'FLAT-root': 'canonical working rubric DB (paths.json rubric_db); single seat of record',
    'MACH-root': '0-byte stray; never read (paths.json points at the FLAT seat)',
  },
  'services.json': {
    'mach-data': 'service registry (30 services) — a different document from the PUB seat',
    'PUB-root': '/services/ page JSON-LD (CollectionPage) — a different document from the registry',
  },
};
// REGISTERED cross-basename role pairs (class E): worker project
// sources vs the sealed distribution copies digest-index resolves.
// src-index.js: refresh-bundle.py copies the deployed API worker
// source into repo-dir/src-index.js so the seal digests the exact
// deployed bytes. index.js: repo-dir/index.js is the canonical copy
// of the quote worker (the-flat-rate-movers-worker/src/index.js).
const ROLE_PAIRS = [
  ['api worker source (sealed copy repo-dir/src-index.js)', path.join(REPO, 'src-index.js'), path.join(API_SRC, 'index.js')],
  ['quote worker source (sealed copy repo-dir/index.js)', path.join(REPO, 'index.js'), path.join(QUOTE_SRC, 'index.js')],
];
// Byte-groups (class F): basenames whose every scanned seat must be
// one identical byte stream (the seal copies graphs data/ -> PUB +
// FLAT; the geojson rides the same three seats).
const BYTE_GROUPS = ['entity-graph.json', 'best-json-entity-graph.json', 'service-area.geojson'];

function derivePairs() {
  const pairs = { A: [], B: [], C: [], D: [], G: [], E: ROLE_PAIRS };
  const repoFiles = new Set(filesOf(REPO));
  for (const b of filesOf(path.join(ROOT, 'scripts'))) if (repoFiles.has(b)) pairs.A.push([b, path.join(ROOT, 'scripts', b), path.join(REPO, b)]);
  for (const b of filesOf(path.join(ROOT, 'scripts', 'route-assets'))) if (repoFiles.has(b)) pairs.B.push([b, path.join(ROOT, 'scripts', 'route-assets', b), path.join(REPO, b)]);
  for (const b of filesOf(ROOT)) if (repoFiles.has(b)) pairs.C.push([b, path.join(ROOT, b), path.join(REPO, b)]);
  for (const p of walkFiles(path.join(PAGES, 'functions'))) {
    const b = path.basename(p);
    if (repoFiles.has(b)) pairs.D.push([b + ' (' + path.relative(PAGES, p) + ')', path.join(REPO, b), p]);
  }
  const derivedExcluded = new Set(Object.keys(EXCLUSIONS));
  for (const b of filesOf(PUB)) if (repoFiles.has(b) && !derivedExcluded.has(b)) pairs.G.push([b, path.join(REPO, b), path.join(PUB, b)]);
  return pairs;
}

function comparePair([label, a, b]) {
  if (!fs.existsSync(a) || !fs.existsSync(b)) return { label, ok: false, detail: 'missing seat: ' + (!fs.existsSync(a) ? a : b) };
  const ha = sha(a);
  return { label, ok: ha === sha(b), detail: ha.slice(0, 12) + ' ' + path.relative(WS, a) + ' == ' + path.relative(WS, b) };
}

function main() {
  const pairs = derivePairs();
  const groups = scanGroups();
  const classified = new Set(); // absolute paths of classified seats
  const mark = (p) => classified.add(p);
  const checks = [];
  const runClass = (id, name, list) => {
    const rs = list.map(comparePair);
    for (const [, a, b] of list) { mark(a); mark(b); }
    const bad = rs.filter((r) => !r.ok);
    checks.push({ id, name, ok: bad.length === 0 && list.length > 0,
      detail: bad.length ? bad.map((r) => r.label + ': ' + r.detail).join('; ') : list.length + ' pairs byte-identical' });
    return rs;
  };
  runClass('TW-1', 'TW-1 generator script twins byte-identical (scripts/ vs repo-dir/, derived by basename intersection)', pairs.A);
  runClass('TW-2', 'TW-2 route-assets + machine-root twins byte-identical (route-assets/ and root vs repo-dir/, derived)', [...pairs.B, ...pairs.C]);
  runClass('TW-3', 'TW-3 Pages-functions + public-root seats byte-identical to repo-dir (derived)', [...pairs.D, ...pairs.G]);
  runClass('TW-4', 'TW-4 worker role pairs byte-identical (API + quote worker sources vs sealed repo-dir copies, registered)', pairs.E);

  // Class F: byte groups over the scan's own seat sets.
  const fBad = [];
  let fSeats = 0;
  for (const base of BYTE_GROUPS) {
    const seats = groups.get(base);
    if (!seats || seats.size < 2) { fBad.push(base + ': fewer than 2 seats found'); continue; }
    fSeats += seats.size;
    const hs = new Set([...seats.values()].map(sha));
    if (hs.size !== 1) fBad.push(base + ': ' + seats.size + ' seats, ' + hs.size + ' distinct byte streams');
    for (const p of seats.values()) mark(p);
  }
  checks.push({ id: 'TW-5', name: 'TW-5 multi-seat data groups byte-identical across every seat (graphs x3 seats, service-area geojson x3 seats)',
    ok: fBad.length === 0, detail: fBad.join('; ') || BYTE_GROUPS.length + ' groups, ' + fSeats + ' seats, one byte stream each' });

  // TW-6 completeness: every multi-seat basename group in the scanned
  // trees is fully classified (paired, grouped, or excluded with a
  // reason); exclusion state assertions still hold.
  const unclassified = [];
  for (const [base, seats] of groups) {
    if (seats.size < 2) continue;
    for (const [label, p] of seats) {
      if (classified.has(p)) continue;
      if (EXCLUSIONS[base] && EXCLUSIONS[base][label]) { classified.add(p); continue; }
      unclassified.push(base + ' @ ' + label + ' (' + p + ')');
    }
  }
  const stateBad = [];
  const stray = path.join(ROOT, 'rubric.db');
  if (fs.existsSync(stray) && fs.statSync(stray).size !== 0) stateBad.push('MACH-root rubric.db is no longer a 0-byte stray — its exclusion reason is void; reclassify it');
  for (const base of Object.keys(EXCLUSIONS)) {
    const seats = groups.get(base);
    if (!seats) continue;
    for (const label of seats.keys()) if (!EXCLUSIONS[base][label]) stateBad.push(base + ' has a seat in ' + label + ' with no exclusion reason');
  }
  checks.push({ id: 'TW-6', name: 'TW-6 twin completeness: every duplicated seat in the scanned trees is classified (paired, grouped, or excluded with a reason)',
    ok: unclassified.length === 0 && stateBad.length === 0,
    detail: [...unclassified.map((u) => 'unclassified seat: ' + u), ...stateBad].join('; ') ||
      'all multi-seat groups classified; new duplicated seats fail here until paired, grouped, or excluded with a reason' });

  const failed = checks.filter((c) => !c.ok);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ checks, pairs: pairs.A.length + pairs.B.length + pairs.C.length + pairs.D.length + pairs.G.length + pairs.E.length, groups: BYTE_GROUPS.length }, null, 1));
  } else {
    for (const c of checks) console.log((c.ok ? 'PASS  ' : 'FAIL  ') + c.name + ' — ' + c.detail);
    console.log(failed.length ? 'TWIN CHECK FAILED — fix the divergence at the canonical source (repo-dir for sealed code), never by weakening this gate.'
      : 'TWIN CHECK OK — every duplicated seat byte-identical, every seat classified.');
  }
  process.exit(failed.length ? 1 : 0);
}

main();
