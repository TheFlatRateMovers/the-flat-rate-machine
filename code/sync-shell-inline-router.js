#!/usr/bin/env node
// sync-shell-inline-router.js — shell inline router data mirror
// (W30 Machine repair, 2026-11-10).
//
// Root cause it kills: repo-dir/index.html carries an inline router
// <script> — a reduced fallback copy of the router whose DATA literals
// (var pages / var redirects / var pageMeta) were maintained by hand.
// Every batch edited main.js (the served router, via build-routes) and
// mirrored pageMeta into the shell, but the inline `pages` array was
// only updated when someone remembered: by 2026-11-10 it had silently
// lost 10 slugs (Nov 4–7 batches: port-of-huntington, vault wave,
// hoarding) and 3 pageMeta desc values had drifted. Live routing was
// unaffected (route documents build from main.js) — the seats simply
// disagreed, invisibly.
//
// Mechanism: main.js is the single source. This script splices the
// three data literals out of repo-dir/main.js VERBATIM (byte-level
// span swap, never a re-serialization) into the shell's inline router
// script. seal.py runs it in phase 0.5, so every seal self-heals the
// seat before anything is digested; check-twins.js TW-7 runs this
// script's --check mode as a permanent gate, so a drift that somehow
// lands outside a seal fails publish preflight.
//
// Usage: node scripts/sync-shell-inline-router.js [--check]
//        [--shell <path>] [--main <path>]
// Exit 0 = in sync (or synced). Exit 1 = drift found in --check mode.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REG = JSON.parse(fs.readFileSync(path.join(ROOT, 'paths.json'), 'utf8'));
const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const argOf = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const SHELL = argOf('--shell', path.join(REG.repo_dir, 'index.html'));
const MAIN = argOf('--main', path.join(REG.repo_dir, 'main.js'));
const VARS = ['pages', 'redirects', 'pageMeta'];

// Locate the literal span of `var NAME = <literal>` in txt: returns
// {start, end, text} covering the literal itself (bracket to bracket).
function literalSpan(txt, name) {
  const i = txt.indexOf('var ' + name);
  if (i < 0) return null;
  const eq = txt.indexOf('=', i);
  let j = eq + 1;
  while (/\s/.test(txt[j])) j++;
  const open = txt[j];
  const close = open === '[' ? ']' : open === '{' ? '}' : null;
  if (!close) return null;
  let depth = 0, inS = null, esc = false;
  for (let k = j; k < txt.length; k++) {
    const c = txt[k];
    if (inS) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === inS) inS = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inS = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return { start: j, end: k + 1, text: txt.slice(j, k + 1) }; }
  }
  return null;
}

function parseLit(text) { return eval('(' + text + ')'); }

function summarize(name, a, b) {
  if (name === 'pages') {
    const miss = b.filter((s) => !a.includes(s));
    const extra = a.filter((s) => !b.includes(s));
    return 'pages ' + a.length + ' vs ' + b.length +
      (miss.length ? '; missing: ' + miss.join(', ') : '') +
      (extra.length ? '; extra: ' + extra.join(', ') : '');
  }
  if (name === 'pageMeta') {
    const ka = new Set(Object.keys(a)), kb = new Set(Object.keys(b));
    const diffs = [...ka].filter((k) => kb.has(k) && JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    return 'pageMeta keys ' + ka.size + ' vs ' + kb.size +
      (diffs.length ? '; value diffs: ' + diffs.join(', ') : '');
  }
  return name + ' differs';
}

function main() {
  const mainTxt = fs.readFileSync(MAIN, 'utf8');
  const shellTxt = fs.readFileSync(SHELL, 'utf8');
  const si = shellTxt.indexOf('var pages');
  if (si < 0) { console.log('FAIL  inline router script not found in shell'); process.exit(1); }
  const sStart = shellTxt.lastIndexOf('<script>', si);
  const sEnd = shellTxt.indexOf('</script>', si);
  let inline = shellTxt.slice(sStart, sEnd);

  const drift = [];
  // Splice from the LAST var to the first so earlier spans stay valid.
  for (const name of [...VARS].reverse()) {
    const src = literalSpan(mainTxt, name);
    const dst = literalSpan(inline, name);
    if (!src || !dst) { console.log('FAIL  literal span not found for ' + name); process.exit(1); }
    if (src.text !== dst.text) {
      drift.push(summarize(name, parseLit(dst.text), parseLit(src.text)));
      inline = inline.slice(0, dst.start) + src.text + inline.slice(dst.end);
    }
  }
  if (!drift.length) {
    console.log('INLINE ROUTER IN SYNC — shell inline pages/redirects/pageMeta identical to repo-dir/main.js');
    return;
  }
  if (CHECK) {
    console.log('INLINE ROUTER DRIFT — ' + drift.join(' | '));
    process.exit(1);
  }
  fs.writeFileSync(SHELL, shellTxt.slice(0, sStart) + inline + shellTxt.slice(sEnd));
  console.log('INLINE ROUTER SYNCED from repo-dir/main.js — ' + drift.join(' | '));
}

main();
