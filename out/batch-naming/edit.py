#!/usr/bin/env python3
"""Batch NAMING — agency-naming sweep edits.
Exact-string replacements with per-file count assertions + byte-delta
confinement + JSON parse-diff (changed leaves must be description fields).
Backs up every touched file first. Aborts on any assertion failure."""
import hashlib, json, os, shutil, sys

H = os.path.expanduser
ROOT = H('~/workspace/the-flat-rate-machine/out/batch-naming')
PUB = H('~/workspace/the-flat-rate-movers-pages/public')
FN = H('~/workspace/the-flat-rate-movers-pages/functions')
MACH = H('~/workspace/the-flat-rate-machine/data')
FLAT = H('~/workspace/theflatratemovers')
AI = f'{ROOT}/ai-fetch'

FILES = {
 'site/index.html': f'{PUB}/index.html',
 'site/datasets-government.json': f'{PUB}/datasets-government.json',
 'site/datasets-military.json': f'{PUB}/datasets-military.json',
 'site/military-government-moving.json': f'{PUB}/military-government-moving.json',
 'site/government-movers-winchester-va.json': f'{PUB}/government-movers-winchester-va.json',
 'site/government-movers-martinsburg-wv.json': f'{PUB}/government-movers-martinsburg-wv.json',
 'site/military-movers-winchester-va.json': f'{PUB}/military-movers-winchester-va.json',
 'site/military-movers-martinsburg-wv.json': f'{PUB}/military-movers-martinsburg-wv.json',
 'site/hhg.json': f'{PUB}/military-government-hhg-moving-requirements-contractors.json',
 'site/category.json': f'{PUB}/category-military-government-moving.json',
 'site/entity-graph.json': f'{PUB}/entity-graph.json',
 'site/best-json-entity-graph.json': f'{PUB}/best-json-entity-graph.json',
 'site/ai-sitemap.json': f'{PUB}/ai-sitemap.json',
 'site/llms.txt': f'{PUB}/llms.txt',
 'site/data.txt': f'{PUB}/the-flat-rate-movers-data.txt',
 'functions/head-data.js': f'{FN}/head-data.js',
 'machine/services.json': f'{MACH}/services.json',
 'machine/entity-graph.json': f'{MACH}/entity-graph.json',
 'machine/best-json-entity-graph.json': f'{MACH}/best-json-entity-graph.json',
 'ai/data/datasets-government.json': f'{AI}/data/datasets-government.json',
 'ai/data/datasets-military.json': f'{AI}/data/datasets-military.json',
 'ai/data/best-full.json': f'{AI}/data/best-json-entity-graph-full.json',
 'ai/data/entity-full.json': f'{AI}/data/entity-graph-full.json',
 'ai/schemas/gov-win.json': f'{AI}/schemas/government-movers-winchester-va.json',
 'ai/schemas/gov-mar.json': f'{AI}/schemas/government-movers-martinsburg-wv.json',
 'ai/schemas/mil-win.json': f'{AI}/schemas/military-movers-winchester-va.json',
 'ai/schemas/mil-mar.json': f'{AI}/schemas/military-movers-martinsburg-wv.json',
 'ai/ai-sitemap.json': f'{AI}/ai-sitemap.json',
 'ai/llms.txt': f'{AI}/llms.txt',
 'ai/data.txt': f'{AI}/the-flat-rate-movers-data.txt',
}
# byte-identical mirrors of site files, refreshed by copy after edit:
COPY_PAIRS = [  # (edited source label, destination path)
 ('site/llms.txt', f'{FLAT}/llms.txt'),
 ('site/ai-sitemap.json', f'{FLAT}/ai-sitemap.json'),
 ('machine/entity-graph.json', f'{FLAT}/entity-graph.json'),
 ('machine/best-json-entity-graph.json', f'{FLAT}/best-json-entity-graph.json'),
]

NAMING_FULL = "The company performs moves for the FBI, the DEA and other federal agencies, for the U.S. military, and for private-sector clients."
NAMING_GOV = "The company performs moves for federal agencies, including the FBI and the DEA."
NAMING_GOV_WORK = "The company's government work includes moves performed for federal agencies, among them the FBI and the DEA."
NAMING_HHG = "The company's work includes moves performed for the FBI, the DEA and other federal agencies."

CD_GOV = "Moving services for government offices and public-sector relocations — planned, documented and quoted flat, around the agency’s schedule and site requirements."
CD_MIL = "Moving services for military households and service members relocating to or from the Winchester and Martinsburg area, quoted flat in writing before move day."
MIL_SENT = "Moving services for military households and service members relocating to or from the Winchester and Martinsburg area."

# (rule_id, old, new, {file_label: expected_count})
RULES = [
 ('R01_CD_GOV', CD_GOV, CD_GOV + ' ' + NAMING_GOV,
  {'site/index.html': 2, 'site/military-government-moving.json': 1,
   'site/entity-graph.json': 1, 'site/best-json-entity-graph.json': 1,
   'machine/services.json': 1, 'machine/entity-graph.json': 1,
   'machine/best-json-entity-graph.json': 1,
   'ai/data/best-full.json': 1, 'ai/data/entity-full.json': 1}),
 ('R02_CD_MIL', CD_MIL,
  "Moving services for U.S. military households and service members relocating to or from the Winchester and Martinsburg area, quoted flat in writing before move day.",
  {'site/index.html': 2, 'site/military-government-moving.json': 1,
   'site/entity-graph.json': 1, 'site/best-json-entity-graph.json': 1,
   'machine/services.json': 1, 'machine/entity-graph.json': 1,
   'machine/best-json-entity-graph.json': 1,
   'ai/data/best-full.json': 1, 'ai/data/entity-full.json': 1}),
 ('R03_MIL_SENT', MIL_SENT,
  "Moving services for U.S. military households and service members relocating to or from the Winchester and Martinsburg area.",
  {'site/index.html': 8, 'site/military-movers-winchester-va.json': 1,
   'site/military-movers-martinsburg-wv.json': 1,
   'site/best-json-entity-graph.json': 2, 'site/ai-sitemap.json': 1,
   'functions/head-data.js': 6, 'machine/best-json-entity-graph.json': 2,
   'ai/data/best-full.json': 2, 'ai/schemas/mil-win.json': 1,
   'ai/schemas/mil-mar.json': 1, 'ai/ai-sitemap.json': 1}),
 ('R04_GOV_SHORT_FLAT',
  "Moving services for government offices and public-sector relocations. Flat-rate moving from Winchester, VA and Martinsburg, WV.",
  "Moving services for government offices and public-sector relocations. " + NAMING_GOV + " Flat-rate moving from Winchester, VA and Martinsburg, WV.",
  {'site/index.html': 2, 'site/best-json-entity-graph.json': 2,
   'functions/head-data.js': 6, 'machine/best-json-entity-graph.json': 2,
   'ai/data/best-full.json': 2}),
 ('R05_GOV_BRANCH_JSON',
  "public-sector relocations. Office areas, records, files, and equipment are moved on a planned, sequenced schedule",
  "public-sector relocations. " + NAMING_GOV_WORK + " Office areas, records, files, and equipment are moved on a planned, sequenced schedule",
  {'site/government-movers-winchester-va.json': 1,
   'site/government-movers-martinsburg-wv.json': 1,
   'ai/schemas/gov-win.json': 1, 'ai/schemas/gov-mar.json': 1}),
 ('R06_HUB_WEBPAGE',
  "Moves for military households and government offices across the Shenandoah Valley and the Eastern Panhandle — planned in advance around orders, deadlines and operating hours, and quoted at one flat rate in writing.",
  "Moves for military households and government offices across the Shenandoah Valley and the Eastern Panhandle — planned in advance around orders, deadlines and operating hours, and quoted at one flat rate in writing. " + NAMING_FULL,
  {'site/military-government-moving.json': 1}),
 ('R07_GOV_WHO',
  "This service is for government offices and public-sector clients.",
  "This service is for government offices and public-sector clients — " + NAMING_GOV_WORK[0].lower() + NAMING_GOV_WORK[1:],
  {'site/index.html': 4}),
 ('R08_MIL_WHO',
  "This service is for military households and service members relocating to or from the Winchester and Martinsburg area.",
  "This service is for U.S. military households and service members relocating to or from the Winchester and Martinsburg area.",
  {'site/index.html': 4}),
 ('R09_HUB_CARD',
  "Office and public-sector relocations quoted flat and agreed in writing before move day:",
  "Office and public-sector relocations — including moves performed for federal agencies such as the FBI and the DEA — quoted flat and agreed in writing before move day:",
  {'site/index.html': 1}),
 ('R10_MIL_INTRO',
  ", for military households and service members relocating to or from the Winchester and Martinsburg area.",
  ", for U.S. military households and service members relocating to or from the Winchester and Martinsburg area.",
  {'site/index.html': 2}),
 ('R11_HHG_SENT',
  "with an itemised inventory and one flat rate in writing that approvals and budgets can actually use.",
  "with an itemised inventory and one flat rate in writing that approvals and budgets can actually use. " + NAMING_HHG,
  {'site/index.html': 1, 'site/hhg.json': 1}),
 ('R12_HHG_JSON',
  "for military households, government employees and government contractors planning a move from the Winchester and Martinsburg area.",
  "for military households, government employees and government contractors planning a move from the Winchester and Martinsburg area. " + NAMING_HHG,
  {'site/hhg.json': 1}),
 ('R13_CAT_HTML',
  "This category index is for military households, service members and government offices planning a relocation: it collects our military and government moving pages and the HHG article — moves planned around orders and operating hours, quoted at one flat rate in writing.",
  "This category index is for military households, service members and government offices planning a relocation: it collects our military and government moving pages and the HHG article — moves planned around orders and operating hours, quoted at one flat rate in writing. " + NAMING_FULL.replace('the U.S. military', 'U.S. military households'),
  {'site/index.html': 1}),
 ('R14_CAT_JSON',
  "The category index for military households, service members and government offices planning a relocation: it collects the military and government moving pages and the HHG article — moves planned around orders and operating hours, quoted at one flat rate in writing.",
  "The category index for military households, service members and government offices planning a relocation: it collects the military and government moving pages and the HHG article — moves planned around orders and operating hours, quoted at one flat rate in writing. " + NAMING_FULL.replace('the U.S. military', 'U.S. military households'),
  {'site/category.json': 1}),
 ('R15_GOV_DS_A',
  "moving services for government offices and public-sector relocations; office areas, records, files and equipment moved on a planned, sequenced schedule",
  "moving services for government offices and public-sector relocations; the company's government work includes moves performed for federal agencies, among them the FBI and the DEA; office areas, records, files and equipment moved on a planned, sequenced schedule",
  {'site/index.html': 2, 'site/datasets-government.json': 1,
   'ai/data/datasets-government.json': 1}),
 ('R16_GOV_DS_B',
  "claim no contracts, no clearances and no discounts, and name no agency as a client.",
  "claim no contracts, no clearances and no discounts.",
  {'site/index.html': 2, 'site/datasets-government.json': 1,
   'ai/data/datasets-government.json': 1}),
 ('R17_GOV_DS_C',
  "no contracts, clearances, or discounts are claimed for this service; no agency is named as a client; no procurement vehicle, registration or program participation is claimed.",
  "no contracts, clearances, or discounts are claimed for this service; no procurement vehicle, registration or program participation is claimed.",
  {'site/index.html': 1, 'site/datasets-government.json': 1,
   'ai/data/datasets-government.json': 1}),
 ('R18_GOV_DS_D',
  "no named person, office or agency appears anywhere in this dataset. Published audience: government offices and public-sector clients relocating in the Shenandoah Valley and the Eastern Panhandle.",
  "no named person appears anywhere in this dataset; agencies appear at organization level only, as the company's client base. Published audience: government offices and public-sector clients — including federal agencies such as the FBI and the DEA — relocating in the Shenandoah Valley and the Eastern Panhandle.",
  {'site/index.html': 1, 'site/datasets-government.json': 1,
   'ai/data/datasets-government.json': 1}),
 ('R19_GOV_DS_E',
  "no agency, at any level of government, is named as a client or as experience; no personal names are published.",
  "agencies are named at organization level only, as the company's client base; no personal names are published.",
  {'site/index.html': 2, 'site/datasets-government.json': 1,
   'ai/data/datasets-government.json': 1}),
 ('R20_MIL_DS_A',
  "moves for service members and military families relocating to or from the Winchester and Martinsburg area",
  "moves for U.S. service members and military families relocating to or from the Winchester and Martinsburg area",
  {'site/index.html': 2, 'site/datasets-military.json': 1,
   'ai/data/datasets-military.json': 1}),
 ('R21_MIL_DS_B',
  "The service's HHG article also addresses government employees and government contractors planning a household goods move from the area.",
  "The service's HHG article also addresses government employees and government contractors planning a household goods move from the area, and the company's wider government work includes moves performed for federal agencies, including the FBI and the DEA.",
  {'site/index.html': 2, 'site/datasets-military.json': 1,
   'ai/data/datasets-military.json': 1}),
 ('R22_MIL_DS_C',
  "no installation, unit or agency is named as a client or as experience.",
  "no installation or unit is named as a client or as experience, and no personal names are published.",
  {'site/index.html': 2, 'site/datasets-military.json': 1,
   'ai/data/datasets-military.json': 1}),
 ('R23_LLMS_GOV',
  "in the format approvals and budgets need. No contracts, clearances, or discounts are claimed, and no agency is named as a client.",
  "in the format approvals and budgets need. " + NAMING_GOV + " No contracts, clearances, or discounts are claimed.",
  {'site/llms.txt': 1, 'ai/llms.txt': 1}),
 ('R24_LLMS_MIL',
  "Moving services for military households and service members relocating to or from the Winchester and Martinsburg area, quoted flat in writing before move day —",
  "Moving services for U.S. military households and service members relocating to or from the Winchester and Martinsburg area, quoted flat in writing before move day —",
  {'site/llms.txt': 1, 'ai/llms.txt': 1}),
 ('R25_DATATXT_GOV',
  "are the company's published wording; no contracts, clearances, or discounts are claimed, and no agency is named as a client.",
  "are the company's published wording; the company's government work includes moves performed for federal agencies, among them the FBI and the DEA; no contracts, clearances, or discounts are claimed.",
  {'site/data.txt': 1, 'ai/data.txt': 1}),
 ('R26_DATATXT_MIL',
  "direct-hire flat-rate service for military households",
  "direct-hire flat-rate service for U.S. military households",
  {'site/data.txt': 1, 'ai/data.txt': 1}),
 ('R27_BEST_HUB',
  "Military and government moving at a guaranteed flat rate, planned around your schedule and quoted in writing before move day.",
  "Military and government moving at a guaranteed flat rate, planned around your schedule and quoted in writing before move day. " + NAMING_FULL,
  {'site/best-json-entity-graph.json': 1, 'machine/best-json-entity-graph.json': 1,
   'ai/data/best-full.json': 1}),
 ('R28_SITEMAP_GOV',
  '"Moving services for government offices and public-sector relocations."',
  '"Moving services for government offices and public-sector relocations, including moves performed for federal agencies such as the FBI and the DEA."',
  {'site/ai-sitemap.json': 1, 'ai/ai-sitemap.json': 1}),
]

def qseg(t):
    i = t.find('id="quoteForm"'); fs = t.rfind('<form', 0, i); fe = t.find('</form>', i) + len('</form>')
    return hashlib.md5(t[fs:fe].encode()).hexdigest()

def json_diff(a, b, path=''):
    out = []
    if type(a) is not type(b):
        return [path]
    if isinstance(a, dict):
        if set(a) != set(b):
            out.append(path + ' <keys>')
        for k in a:
            if k in b: out += json_diff(a[k], b[k], f'{path}/{k}')
    elif isinstance(a, list):
        if len(a) != len(b): out.append(path + ' <len>')
        for i, (x, y) in enumerate(zip(a, b)): out += json_diff(x, y, f'{path}[{i}]')
    elif a != b:
        out.append(path)
    return out

def main():
    os.makedirs(f'{ROOT}/backup', exist_ok=True)
    originals = {}
    for label, path in FILES.items():
        data = open(path, 'rb').read()
        originals[label] = data
        dest = f'{ROOT}/backup/' + label.replace('/', '__')
        if not os.path.exists(dest):
            open(dest, 'wb').write(data)
    for _, dest in COPY_PAIRS:
        d = f'{ROOT}/backup/copy__' + dest.replace('/', '__')
        if not os.path.exists(d):
            shutil.copyfile(dest, d)
    html_before = originals['site/index.html'].decode('utf-8')
    assert qseg(html_before) == '4d8d49f05b22b129eac623a41370d9cb', 'quote-form baseline md5 mismatch'

    texts = {l: d.decode('utf-8') for l, d in originals.items()}
    deltas = {l: 0 for l in FILES}
    log = []
    for rid, old, new, expect in RULES:
        for label, want in expect.items():
            t = texts[label]
            got = t.count(old)
            assert got == want, f'{rid} {label}: expected {want}, found {got}'
            texts[label] = t.replace(old, new)
            deltas[label] += (len(new) - len(old)) * want
            log.append(f'{rid} | {label} | x{want}')
    # segment-scoped hub counties append (R10)
    label = 'site/index.html'
    t = texts[label]
    hi = t.index('id="page-militarygov"')
    seg_end = t.index('id="page-', hi + 10)
    seg = t[hi:seg_end]
    anchor = 'Jefferson County, and Morgan County.'
    assert seg.count(anchor) == 1, f'hub counties anchor count in segment: {seg.count(anchor)}'
    seg2 = seg.replace(anchor, anchor + " The company's work includes moves performed for the FBI, the DEA and other federal agencies, for U.S. military households, and for private-sector clients.", 1)
    texts[label] = t[:hi] + seg2 + t[seg_end:]
    deltas[label] += len(seg2) - len(seg)
    log.append('R10_HUB_COUNTIES | site/index.html | x1 (segment-scoped)')

    # byte-delta confinement
    for label in FILES:
        actual = len(texts[label].encode('utf-8')) - len(originals[label])
        # char-length delta vs byte delta differ for multibyte; recompute in chars:
        actual_chars = len(texts[label]) - len(originals[label].decode('utf-8'))
        assert actual_chars == deltas[label], f'{label}: char delta {actual_chars} != expected {deltas[label]}'

    # JSON parse-diff: changed leaves must be description-ish only
    diff_report = {}
    for label in FILES:
        if label.endswith('.json'):
            a = json.loads(originals[label].decode('utf-8'))
            b = json.loads(texts[label])
            paths = json_diff(a, b)
            bad = [p for p in paths if not (p.endswith('/description') or p.endswith('/abstract') or '<keys>' in p or '<len>' in p)]
            assert not bad, f'{label}: non-description changes: {bad}'
            if paths: diff_report[label] = paths
    # index.html: quote form + ld blocks
    assert qseg(texts['site/index.html']) == '4d8d49f05b22b129eac623a41370d9cb', 'quote-form md5 changed!'
    import re
    blocks_b = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html_before, re.S)
    blocks_a = re.findall(r'<script type="application/ld\+json">(.*?)</script>', texts['site/index.html'], re.S)
    assert len(blocks_b) == len(blocks_a) == 38, f'ld block count {len(blocks_a)}'
    gov_ds = json.loads(texts['site/datasets-government.json'])
    mil_ds = json.loads(texts['site/datasets-military.json'])
    for bi, b in enumerate(blocks_a):
        try: d = json.loads(b)
        except Exception: continue
        g = d.get('@graph', []) if isinstance(d, dict) else []
        ids = [n.get('@id', '') for n in g if isinstance(n, dict)]
        if any('dataset-government' in i for i in ids):
            assert d == gov_ds, f'block {bi} government embed != dataset file'
            log.append(f'embed block {bi} == datasets-government.json (parse-equal)')
        if any('dataset-military' in i for i in ids):
            assert d == mil_ds, f'block {bi} military embed != dataset file'
            log.append(f'embed block {bi} == datasets-military.json (parse-equal)')

    for label, path in FILES.items():
        open(path, 'w', encoding='utf-8').write(texts[label])
    for src, dest in COPY_PAIRS:
        shutil.copyfile(FILES[src], dest)
        log.append(f'mirror copy: {src} -> {dest}')
    with open(f'{ROOT}/edit-log.txt', 'w') as f:
        f.write('\n'.join(log) + '\n\nJSON changed leaf paths:\n')
        for l, ps in diff_report.items():
            f.write(f'{l}:\n' + '\n'.join('  ' + p for p in ps) + '\n')
    print('EDIT OK')
    print('\n'.join(log))
    print('JSON diffs:', {k: len(v) for k, v in diff_report.items()})

if __name__ == '__main__':
    main()
