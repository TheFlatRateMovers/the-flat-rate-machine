// Flat Rate Machine — Phase 1 shared helpers (deterministic v1).
// No placeholders, no invented facts. Everything here derives from data/
// or from stable site-layout constants (domain, file paths) only.
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://theflatratemovers.com';
const DATA_VERSION = '2026-10-28'; // attested date shared by all Phase 0 datasets

function fail(msg) { console.error('BUILD FAILED: ' + msg); process.exit(1); }
function load(rel) { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
function writeOut(rel, content) {
  const p = path.join(ROOT, 'out', rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log('wrote out/' + rel);
}
function writeOutJson(rel, obj) { writeOut(rel, JSON.stringify(obj, null, 2) + '\n'); }
function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode + ' for ' + url)); return; }
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

// "Berryville 22611" -> { name: "Berryville", slug: "berryville" }
// "Clear Spring MD 21722" -> { name: "Clear Spring", slug: "clear-spring" }
// "Eastern Panhandle of West Virginia" -> { name: "Eastern Panhandle", slug: "eastern-panhandle" }
function slugifyArea(entry) {
  let name = String(entry).trim()
    .replace(/\s+\d{5}\s*$/, '')
    .replace(/\s+(MD|VA|WV)\s*$/, '')
    .replace(/\s+of\s+(West Virginia|Virginia)\s*$/, '')
    .trim();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!name || !slug) fail('cannot slugify service area entry: ' + JSON.stringify(entry));
  return { name, slug };
}

// Explicit state token in a service-area entry, e.g. "Hagerstown MD" -> "MD",
// "Clear Spring MD 21722" -> "MD". Returns null when the entry carries none.
function areaStateToken(entry) {
  const m = String(entry).trim().match(/\b(MD|VA|WV)\b\s*(?:\d{5})?\s*$/);
  return m ? m[1] : null;
}

const DAY_MAP = { 'Mon-Fri': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], Sat: ['Saturday'], Sun: ['Sunday'] };
function hoursToSpec(hours) {
  return hours.map((h) => {
    const days = DAY_MAP[h.days];
    if (!days) fail('unknown hours days value: ' + h.days);
    return { '@type': 'OpeningHoursSpecification', dayOfWeek: days.length === 1 ? days[0] : days, opens: h.opens, closes: h.closes };
  });
}

// Leaf-path diff of two parsed JSON values. Returns [{path, left, right}].
function leafDiff(a, b, base, out) {
  out = out || [];
  base = base || '$';
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if (!(k in a)) out.push({ path: base + '.' + k, left: undefined, right: b[k] });
      else if (!(k in b)) out.push({ path: base + '.' + k, left: a[k], right: undefined });
      else leafDiff(a[k], b[k], base + '.' + k, out);
    }
  } else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) out.push({ path: base + '.length', left: a.length, right: b.length });
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) leafDiff(a[i], b[i], base + '[' + i + ']', out);
  } else {
    out.push({ path: base, left: a, right: b });
  }
  return out;
}

// Diff two JSON-LD @graph arrays by @id.
function diffGraphs(generated, reference) {
  const byId = (nodes) => {
    const m = new Map();
    for (const n of nodes) m.set(n['@id'], n);
    return m;
  };
  const g = byId(generated), r = byId(reference);
  const generatedOnly = [...g.keys()].filter((id) => !r.has(id));
  const referenceOnly = [...r.keys()].filter((id) => !g.has(id));
  const shared = {};
  for (const id of [...g.keys()].filter((id) => r.has(id))) {
    const d = leafDiff(g.get(id), r.get(id));
    if (d.length) shared[id] = d;
  }
  return { generatedNodes: generated.length, referenceNodes: reference.length, generatedOnly, referenceOnly, sharedDiffs: shared };
}

module.exports = { ROOT, SITE, DATA_VERSION, fail, load, writeOut, writeOutJson, fetchText, slugifyArea, areaStateToken, hoursToSpec, leafDiff, diffGraphs };
