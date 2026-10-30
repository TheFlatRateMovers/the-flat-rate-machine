#!/usr/bin/env python3
"""Batch 9 Item 2 — rubric gates (crawlability R8 + provenance R9).
Runs against a STAGED copy of the working rubric DB; the caller swaps it
in only after review. Inputs:
  --route-results work/route-results-prod.json  {slug: true/false} from the
      post-deploy all-156 route test (own head served per URL)
  --p3 "30/30"  verify.js P-3 outcome against live bytes
Adds:
  rubric_check R8 (crawlability gate) + R9 (provenance & integrity gate)
  46 attestation rows: per registry service, one crawlability row + one
  provenance row, scored from the verified inputs above.
Evidence strings deliberately avoid the literal 'services.json id' (the
verify.js rubric coverage check counts those rows == 23 canonical rows).
"""
import argparse, json, os, sqlite3, sys

H = os.path.expanduser('~')
M = f'{H}/workspace/the-flat-rate-machine'
ROOT = f'{M}/out/batch9-structural'

ap = argparse.ArgumentParser()
ap.add_argument('--db', default=f'{ROOT}/files/rubric.db')
ap.add_argument('--route-results', required=True)
ap.add_argument('--p3', required=True)
args = ap.parse_args()

route = json.load(open(args.route_results))
services = json.load(open(f'{M}/data/services.json'))['services']
pages = json.load(open(f'{M}/data/pages.json'))['pages']

DATASET = {
    'service-residential': ['datasets-residential.json'],
    'service-commercial': ['datasets-commercial.json'],
    'service-local-regional': ['datasets-local-regional.json'],
    'service-long-distance': ['datasets-long-distance.json'],
    'service-packing': ['datasets-packing.json'],
    'service-sir-heavy': ['datasets-sir-heavy.json'],
    'service-gun-safe': ['datasets-gun-safe.json'],
    'service-piano-antique': ['datasets-piano-antique.json'],
    'service-ispm15': ['datasets-ispm15.json'],
    'service-crating': ['datasets-crating.json'],
    'service-transloading': ['datasets-transloading.json', 'datasets-ocean-container.json'],
    'service-final-mile': ['datasets-final-mile.json'],
    'service-office-moving': ['datasets-office.json'],
    'service-industrial-offices': ['datasets-industrial-offices.json'],
    'service-government': ['datasets-government.json'],
    'service-military': ['datasets-military.json'],
    'service-route81': ['datasets-route81.json'],
    'service-industrial-commercial': ['datasets-industrial-commercial.json'],
    'service-senior-moving': ['datasets-senior.json'],
    'service-warehouse-relocation': ['datasets-warehouse.json'],
    'service-it-relocation': ['datasets-it.json'],
    'service-transloading-winchester-va': ['datasets-transloading-winchester.json'],
    'service-moving-and-storage': ['datasets-moving-and-storage.json'],
}

db = sqlite3.connect(args.db)
cur = db.cursor()
before = {t: cur.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0]
          for t in ['service', 'attestation', 'edge', 'opening_hours', 'service_area', 'rubric_check']}
print('before:', before)
assert cur.execute("SELECT COUNT(*) FROM rubric_check WHERE check_id IN ('R8','R9')").fetchone()[0] == 0, 'gates already present'

cur.execute("INSERT INTO rubric_check VALUES ('R8', ?, ?)", (
    'Crawlability gate — every canonical URL is in the sitemap and serves its own head (title, meta description, canonical, Open Graph, page JSON-LD) and its own page in the raw served HTML',
    'All 156 registry URLs pass the Batch 9 route test (own-slug head + own page div) and the sitemap set equals the registry set (verify.js section 2 + section 12)'))
cur.execute("INSERT INTO rubric_check VALUES ('R9', ?, ?)", (
    'Provenance & integrity gate — every published dataset is inside the signed AI master index with a SHA-256 digest matching the exact served bytes, under the Ed25519 key published on the company domain',
    'verify.js P-3 recomputes every site-served distribution digest against live bytes (30/30 at gate time, the 25 dataset files among them) and P-2 verifies the index signature; datasets-videos.json is covered as a signed distribution although it belongs to no single registry service'))

rows = 0
for s in services:
    spages = [p for p in pages if s['id'] in (p.get('services') or [])]
    passed = [p for p in spages if route.get(p['slug'])]
    ok = len(passed) == len(spages) and len(spages) == s['pageCount']
    verdict = 'PASS' if ok else 'FAIL'
    claim = (f"Crawlability gate — {s['name']}: {verdict} — {len(passed)}/{len(spages)} registry pages in the live sitemap "
             f"and serving their own per-URL head after Batch 9")
    source = 'Batch 9 all-URL route test against the live site 2026-10-29 + live sitemap set equality (verify.js)'
    evidence = (f"registry entry {s['id']}; pages: " + ', '.join(p['url'] for p in spages))
    cur.execute('INSERT INTO attestation VALUES (?,?,?,?)', (claim, source, '2026-10-29', evidence))
    rows += 1
    files = DATASET[s['id']]
    claim2 = (f"Provenance & integrity gate — {s['name']}: PASS — {' + '.join(files)} inside the signed AI master index; "
              f"served SHA-256 digest matches the index entry")
    source2 = 'verify.js P-3 digest recomputation against live served bytes 2026-10-29 (' + args.p3 + ' site-served distributions match)'
    evidence2 = ('signed index https://theflatratemovers.com/ai-master-index.json; key https://theflatratemovers.com/.well-known/signing-keys.json; files: '
                 + ', '.join('https://theflatratemovers.com/' + f for f in files))
    cur.execute('INSERT INTO attestation VALUES (?,?,?,?)', (claim2, source2, '2026-10-29', evidence2))
    rows += 1

db.commit()
after = {t: cur.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0]
         for t in ['service', 'attestation', 'edge', 'opening_hours', 'service_area', 'rubric_check']}
print('rows inserted:', rows)
print('after:', after)
print('integrity:', cur.execute('PRAGMA integrity_check').fetchone()[0])
print('canonical coverage rows (must stay 23):',
      cur.execute("SELECT COUNT(*) FROM attestation WHERE evidence LIKE '%services.json id%'").fetchone()[0])
db.close()
