#!/usr/bin/env node
/* build-pool-places.js — carries every service-area.geojson feature into
   the Page Data Pool's #areas layer as a typed Place node (SPEC GS-2 /
   verify TM-2: the pool is the places layer of record).
 *
 * Why this exists: the pool was authored 2026-11-03 with the then-87-place
 * footprint. The 2026-11-17 geo expansion grew the geojson to 335 features
 * and TM-2 failed at publish preflight — the pool carried no Place nodes
 * for the new places. This builder derives each missing node from the
 * geojson feature itself (the source of record for name / state / county /
 * primary ZIP / branch / audiences / services), in the exact shape the
 * existing 87 nodes carry:
 *   { @type Place, @id SITE/#<feature id>, name,
 *     additionalProperty: state, county, postalCode, branchBinding,
 *     audiences (JSON string), services (JSON string) }
 * Existing nodes are never touched. Idempotent: a feature whose name is
 * already carried is skipped. --check reports the missing count and exits
 * 1 without writing.
 *
 * Pool serialization is JSON indent 1 + trailing LF (byte-verified
 * 2026-11-17); the write round-trips in that exact form.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = process.env.PAGES_PUBLIC || '/home/hatch/workspace/the-flat-rate-movers-pages/public';
const GEOJSON = path.join(ROOT, 'data', 'service-area.geojson');
const POOL = path.join(PUB, 'datasets-page-data-pool.json');
const SITE = 'https://theflatratemovers.com';
const CHECK = process.argv.includes('--check');

const pv = (name, value) => ({ '@type': 'PropertyValue', name, value });

function nodeFor(f) {
  const p = f.properties;
  return {
    '@type': 'Place',
    '@id': SITE + '/#' + p.id,
    name: p.name,
    additionalProperty: [
      pv('state', p.state),
      pv('county', p.county),
      pv('postalCode', p.postal_code),
      pv('branchBinding', p.branch),
      pv('audiences', JSON.stringify(p.audiences)),
      pv('services', JSON.stringify(p.services)),
    ],
  };
}

function main() {
  const geo = JSON.parse(fs.readFileSync(GEOJSON, 'utf8'));
  const raw = fs.readFileSync(POOL, 'utf8');
  const pool = JSON.parse(raw);
  const areas = pool['@graph'].find((n) => n && String(n['@id']).endsWith('#areas'));
  if (!areas || !Array.isArray(areas.itemListElement)) throw new Error('pool #areas ItemList not found');
  const carriedNames = new Set(areas.itemListElement.map((e) => e && e.name));
  const carriedIds = new Set(areas.itemListElement.map((e) => e && e['@id']));
  const missing = [];
  const conflicts = [];
  for (const f of geo.features) {
    const p = f.properties;
    if (carriedNames.has(p.name)) {
      if (!carriedIds.has(SITE + '/#' + p.id)) conflicts.push(p.name + ' (name carried under a different @id)');
      continue;
    }
    missing.push(f);
  }
  if (conflicts.length) throw new Error('name/@id conflicts, refusing to write: ' + conflicts.join('; '));
  console.log('features: ' + geo.features.length + ' | carried: ' + carriedNames.size + ' | missing: ' + missing.length);
  if (CHECK) {
    if (missing.length) { console.log('CHECK FAIL — pool #areas is missing: ' + missing.slice(0, 5).map((f) => f.properties.name).join(', ')); process.exit(1); }
    console.log('CHECK PASS — every geojson feature is carried in the pool #areas layer');
    return;
  }
  if (!missing.length) { console.log('nothing to add'); return; }
  for (const f of missing) areas.itemListElement.push(nodeFor(f));
  areas.numberOfItems = areas.itemListElement.length;
  const out = JSON.stringify(pool, null, 1) + '\n';
  fs.writeFileSync(POOL, out);
  console.log('wrote ' + missing.length + ' Place nodes; #areas now ' + areas.numberOfItems + ' items, pool ' + out.length + ' bytes');
}

main();
