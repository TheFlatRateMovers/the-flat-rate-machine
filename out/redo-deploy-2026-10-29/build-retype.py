#!/usr/bin/env python3
"""Redo deploy batch, Step 4 (dataset retype, decision 2) + Step 6(h) industrial
name alignment (decision 8) + decision-10 llms/data graph-count prose.
Applies Mira's decisions exactly. Writes finals INTO the staging dirs so the
staging tree == the deploy set. Run: python3 build-retype.py
"""
import json, pathlib, sys

S = pathlib.Path('/home/hatch/workspace/the-flat-rate-machine/out/full-site-redo-2026-10-29')
ORG = 'https://theflatratemovers.com/#organization'
DEPLOY_DATE = '2026-10-29'

RETYPE = {
    # residential
    '#dataset-residential-operations': ('Service', 'service-description content: the household move operation chain'),
    '#dataset-residential-dwelling-access': ('Service', 'service-description content: dwelling scope and access inputs of the service'),
    '#dataset-residential-item-taxonomy': ('Dataset', 'reference data: room/item taxonomy with handling classes'),
    '#dataset-residential-dispatch-network': ('Dataset', 'reference data: branch facts and service-area data (52 features)'),
    '#dataset-residential-commercial-terms': ('Article', 'guide prose: pricing-term and valuation education, no company price schedule'),
    '#dataset-residential-personas-triggers': ('Article', 'informational prose: buyer personas, triggers, demand evidence'),
    '#dataset-residential-protection-compliance': ('Service', 'service-description content: protection, handling and building compliance practice'),
    '#dataset-residential-areas-quote-path': ('Dataset', 'reference data: service-area data (52 features, branch facts) with quote path'),
    # commercial
    '#dataset-commercial-operations': ('Service', 'service-description content: the commercial move operation chain'),
    '#dataset-commercial-premises-access': ('Service', 'service-description content: premises scope and access operations'),
    '#dataset-commercial-asset-taxonomy': ('Dataset', 'reference data: business asset taxonomy with handling classes'),
    '#dataset-commercial-dispatch': ('Dataset', 'reference data: branch facts and service-area data (52 features)'),
    '#dataset-commercial-terms': ('Article', 'guide prose: pricing-term and downtime education with labeled domain figures'),
    '#dataset-commercial-personas': ('Article', 'informational prose: buyer personas and trigger events'),
    '#dataset-commercial-protection-compliance': ('Service', 'service-description content: protection, IT coordination and building compliance practice'),
    '#dataset-commercial-areas-quote': ('Dataset', 'reference data: service-area data (52 features, branch facts) with quote path'),
    # gun-safe D1-D8
    '#dataset-gun-safe-operations': ('Service', 'service-description content: the gun safe move operation chain'),
    '#dataset-gun-safe-weight-access': ('Dataset', 'reference data: weight/size classes (SIR band 1,500-3,500 lbs plus labeled domain classes)'),
    '#dataset-gun-safe-taxonomy': ('Dataset', 'reference data: safe/access/equipment taxonomy'),
    '#dataset-gun-safe-dispatch': ('Dataset', 'reference data: branch facts and service-area data (52 features)'),
    '#dataset-gun-safe-commercial-terms': ('Article', 'guide prose: terms and cost-driver education with labeled domain markers'),
    '#dataset-gun-safe-personas': ('Article', 'informational prose: buyer personas and trigger events'),
    '#dataset-gun-safe-compliance': ('Service', 'service-description content: floor, protection and handling compliance practice'),
    '#dataset-gun-safe-areas-quote': ('Dataset', 'reference data: service-area data (52 features, branch facts) with quote path'),
    # gun-safe service-detail nodes
    '#dataset-gun-safe-service-subband': ('Service', 'service-description content: published service practice for safes under 1,500 lbs'),
    '#dataset-gun-safe-service-emptying': ('Service', 'service-description content: published service practice, safe emptied first'),
    '#dataset-gun-safe-service-stairs': ('Service', 'service-description content: published service practice, stairs up and down'),
    '#dataset-gun-safe-service-equipment': ('Service', 'service-description content: published service practice, equipment matched to project'),
    '#dataset-gun-safe-service-anchoring': ('Service', 'service-description content: published service practice, re-anchoring on request'),
    '#dataset-gun-safe-service-vault': ('Service', 'service-description content: published service practice, vault work any size'),
    '#dataset-gun-safe-service-classes': ('Dataset', 'reference data: safe-class spectrum definitions (RSC, B/C-rate, TL-15/TL-30)'),
    '#dataset-gun-safe-service-winchester': ('Article', 'informational prose: Winchester branch page coverage and branch facts'),
    '#dataset-gun-safe-service-longdistance': ('Article', 'informational prose: published long-distance runs and audience depth, no scope claim'),
    '#dataset-gun-safe-service-locksmith': ('Service', 'service-description content: published service scope boundary, no locksmith services'),
}

mapping_rows = []
for fname in ['datasets-residential.json', 'datasets-commercial.json', 'datasets-gun-safe.json']:
    path = S / 'jsons' / fname
    doc = json.loads(path.read_text(encoding='utf-8'))
    nodes = doc['@graph']
    for n in nodes:
        frag = '#' + n['@id'].split('#', 1)[1] if '#' in n['@id'] else n['@id']
        assert frag in RETYPE, f'{fname}: unmapped node {frag}'
        new_type, reason = RETYPE[frag]
        old_type = n['@type']
        assert old_type == 'Dataset', f'{fname} {frag}: expected Dataset, found {old_type}'
        n['dateModified'] = DEPLOY_DATE
        if new_type == 'Dataset':
            assert 'creativecommons.org/licenses/by/4.0' in str(n.get('license')), f'{frag}: CC BY missing'
        elif new_type == 'Service':
            n['@type'] = 'Service'
            assert 'provider' not in n
            n['provider'] = {'@id': ORG}
            n['publisher'] = {'@id': ORG}
        elif new_type == 'Article':
            n['@type'] = 'Article'
            n['headline'] = n['name']
            n['author'] = {'@id': ORG}
            n['publisher'] = {'@id': ORG}
        mapping_rows.append((fname, n['@id'], old_type, new_type, reason))
    path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    json.loads(path.read_text(encoding='utf-8'))  # re-parse check
    print(f'{fname}: {len(nodes)} nodes retyped/stamped, written')

# mapping table file
out = ['# Dataset retype mapping — redo deploy 2026-10-29 (decision 2)', '',
       '| file | @id | old type | new type | reason |', '|---|---|---|---|---|']
for r in mapping_rows:
    out.append(f'| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} |')
out += ['', 'FAQPage: no node in the three files carries discrete question/answer pairs '
            '(the gun-safe service-detail nodes list likely-search questions inside prose, without '
            'paired answers), so no node was retyped to FAQPage. The hub FAQPage block is unchanged.',
        '', f'Totals: {len(mapping_rows)} nodes — ' +
        ', '.join(f"{t}: {sum(1 for r in mapping_rows if r[3]==t)}" for t in ['Dataset','Service','Article'])]
(S.parent / 'retype-mapping.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
print('mapping rows:', len(mapping_rows))

# --- Decision 8: industrial name alignment in industrial-commercial-services.json ---
ipath = S / 'jsons' / 'industrial-commercial-services.json'
idoc = json.loads(ipath.read_text(encoding='utf-8'))
changed = 0
for n in idoc['@graph']:
    if n.get('@type') == 'Service':
        assert n['name'] == 'Industrial & Commercial Project Support', n['name']
        n['name'] = 'Industrial & Commercial Services'
        changed += 1
        assert 'Flexible Project Support Deployment' in (n.get('serviceType') if isinstance(n.get('serviceType'), list) else [n.get('serviceType')])
ipath.write_text(json.dumps(idoc, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('industrial Service name aligned:', changed)

# --- Decision 10: llms.txt + data txt graph-count prose (current reference line only) ---
for fname in ['llms.txt', 'the-flat-rate-movers-data.txt']:
    p = S / 'visibility' / fname
    txt = p.read_text(encoding='utf-8')
    a = '(89 @ids, rubric + attestations)'
    b = '(141 @ids)'
    assert txt.count(a) == 1, f'{fname}: count({a})={txt.count(a)}'
    assert txt.count(b) == 1, f'{fname}: count({b})={txt.count(b)}'
    txt = txt.replace(a, '(32 nodes, rubric + published source data)').replace(b, '(76 nodes)')
    p.write_text(txt, encoding='utf-8')
    print(f'{fname}: graph-count prose -> node counts (32/76)')
print('OK')
