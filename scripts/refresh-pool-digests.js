#!/usr/bin/env node
/*
 * refresh-pool-digests.js — permanent DC-2 fix (2026-11-07).
 *
 * The page-data pool (PUB/datasets-page-data-pool.json) embeds a
 * sha256 for every dataset file it carries. Any seal phase that
 * rewrites a dataset file after the pool was built — the graph
 * resync in the consumer settle, or phase 4's digest-refresh
 * string-replacing a root digest inside a PUB-root dataset file —
 * leaves those embeds stale, and verify DC-2 fails on the pool.
 * Hand-sweeping the pool before a seal cannot work: the staleness
 * is created BY the seal, after any hand sweep.
 *
 * This script recomputes every site-local .json DataDownload
 * embed in the pool from the actual file bytes on disk. seal.py
 * runs it inside every consumer-settle round and once more after
 * the phase-4c contingency, immediately before phase 4.5 draws
 * the per-page data files from the pool — so the pool always
 * settles from final bytes, in the same pass that signs it.
 *
 * Idempotent: a second run over settled bytes changes nothing,
 * and the file is only rewritten when an embed actually moved.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PUB = process.env.FRM_PUB || '/home/hatch/workspace/the-flat-rate-movers-pages/public';
const SITE = 'https://theflatratemovers.com';
const POOL = path.join(PUB, 'datasets-page-data-pool.json');

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function main() {
  const pool = JSON.parse(fs.readFileSync(POOL, 'utf8'));
  let fixed = 0;
  (function walk(o) {
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (!o || typeof o !== 'object') return;
    const cu = o.contentUrl, sh = o.sha256;
    if (typeof cu === 'string' && typeof sh === 'string' &&
        cu.startsWith(SITE + '/') && cu.endsWith('.json')) {
      const rel = cu.slice(SITE.length + 1);
      const fp = path.join(PUB, rel);
      if (fs.existsSync(fp)) {
        const actual = sha256File(fp);
        if (actual !== sh) { o.sha256 = actual; fixed++; }
      }
    }
    Object.values(o).forEach(walk);
  })(pool);
  if (fixed > 0) {
    fs.writeFileSync(POOL, JSON.stringify(pool, null, 1) + '\n');
  }
  console.log(`refresh-pool-digests: ${fixed} embed(s) refreshed`);
}

main();
