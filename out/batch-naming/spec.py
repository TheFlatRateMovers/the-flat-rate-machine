#!/usr/bin/env python3
"""Batch NAMING — spec extraction: counts of every target OLD string in
every candidate file, + dumps of the small per-page JSONs' text fields and
the llms/data-txt military passages. Read-only."""
import json, os, re

H = os.path.expanduser
PUB = H('~/workspace/the-flat-rate-movers-pages/public')
FN = H('~/workspace/the-flat-rate-movers-pages/functions')
MACH = H('~/workspace/the-flat-rate-machine/data')
FLAT = H('~/workspace/theflatratemovers')
AI = H('~/workspace/the-flat-rate-machine/out/batch-naming/ai-fetch')

STRINGS = {
 'S1_CD_GOV': "Moving services for government offices and public-sector relocations — planned, documented and quoted flat, around the agency’s schedule and site requirements.",
 'S2_CD_MIL': "Moving services for military households and service members relocating to or from the Winchester and Martinsburg area, quoted flat in writing before move day.",
 'S3_MIL_SENT': "Moving services for military households and service members relocating to or from the Winchester and Martinsburg area.",
 'S4_GOV_BRANCH_JSON': "public-sector relocations. Office areas, records, files, and equipment are moved on a planned, sequenced schedule",
 'S5_HUB_WEBPAGE': "Moves for military households and government offices across the Shenandoah Valley and the Eastern Panhandle — planned in advance around orders, deadlines and operating hours, and quoted at one flat rate in writing.",
 'S6_GOV_WHO': "This service is for government offices and public-sector clients.",
 'S7_MIL_WHO': "This service is for military households and service members relocating to or from the Winchester and Martinsburg area.",
 'S8_HUB_CARD': "Office and public-sector relocations quoted flat and agreed in writing before move day:",
 'S9_HUB_WHO': "government offices and public-sector teams relocating in the Shenandoah Valley and Eastern Panhandle",
 'S10_HHG_JSON': "for military households, government employees and government contractors planning a move from the Winchester and Martinsburg area.",
 'S12_GOV_DS_A': "moving services for government offices and public-sector relocations; office areas, records, files and equipment moved on a planned, sequenced schedule",
 'S13_GOV_DS_B': "claim no contracts, no clearances and no discounts, and name no agency as a client.",
 'S14_GOV_DS_C': "no contracts, clearances, or discounts are claimed for this service; no agency is named as a client; no procurement vehicle, registration or program participation is claimed.",
 'S15_GOV_DS_D': "no named person, office or agency appears anywhere in this dataset. Published audience: government offices and public-sector clients relocating in the Shenandoah Valley and the Eastern Panhandle.",
 'S16_GOV_DS_E': "no agency, at any level of government, is named as a client or as experience; no personal names are published.",
 'S17_MIL_DS_A': "moves for service members and military families relocating to or from the Winchester and Martinsburg area",
 'S18_MIL_DS_B': "The service's HHG article also addresses government employees and government contractors planning a household goods move from the area.",
 'S19_MIL_DS_C': "no installation, unit or agency is named as a client or as experience.",
 'S20_TXT_CLAUSE': "no contracts, clearances, or discounts are claimed, and no agency is named as a client.",
 'S21_LLMS_GOV': "in the format approvals and budgets need.",
 'S22_BEST_HUB': "Military and government moving at a guaranteed flat rate, planned around your schedule and quoted in writing before move day.",
 'S23_SITEMAP_GOVQ': '"Moving services for government offices and public-sector relocations."',
 'S24_MIL_INTRO': ", for military households and service members relocating to or from the Winchester and Martinsburg area.",
 'S25_CAT_INTRO': "This category index is for military households, service members and government offices planning a relocation",
 'S26_HHG_HTML': "with an itemised inventory and one flat rate in writing that approvals and budgets can actually use.",
 'S27_GOV_SHORT_FLAT': "Moving services for government offices and public-sector relocations. Flat-rate moving from Winchester, VA and Martinsburg, WV.",
 'S28_MIL_SHORT_FLAT': "Moving services for military households and service members relocating to or from the Winchester and Martinsburg area. Flat-rate moving from Winchester, VA and Martinsburg, WV.",
}

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
 'site/all-pages.json': f'{PUB}/all-pages.json',
 'site/ai-catalog.json': f'{PUB}/ai-catalog.json',
 'functions/head-data.js': f'{FN}/head-data.js',
 'machine/services.json': f'{MACH}/services.json',
 'machine/entity-graph.json': f'{MACH}/entity-graph.json',
 'machine/best-json-entity-graph.json': f'{MACH}/best-json-entity-graph.json',
 'flat/entity-graph.json': f'{FLAT}/entity-graph.json',
 'flat/best-json-entity-graph.json': f'{FLAT}/best-json-entity-graph.json',
 'flat/llms.txt': f'{FLAT}/llms.txt',
 'flat/ai-sitemap.json': f'{FLAT}/ai-sitemap.json',
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
 'ai/answer-engine.json': f'{AI}/answer-engine.json',
 'ai/authority-index.jsonld': f'{AI}/authority-index.jsonld',
 'ai/ai-catalog.json': f'{AI}/ai-catalog.json',
}

texts = {}
for label, path in FILES.items():
    if os.path.isfile(path):
        texts[label] = open(path, encoding='utf-8').read()
    else:
        print(f'MISSING FILE: {label} {path}')

for sid, s in STRINGS.items():
    hits = [(lbl, t.count(s)) for lbl, t in texts.items() if t.count(s)]
    tot = sum(c for _, c in hits)
    print(f'{sid} total={tot}: ' + ', '.join(f'{l}×{c}' for l, c in hits))

print()
print('===== llms.txt Military Moving service line =====')
for lbl in ['site/llms.txt']:
    for line in texts[lbl].split('\n'):
        if '[Military Moving](' in line or '[Government Moving](' in line:
            print(line[:1200]); print('---')
print('===== data.txt military paragraph =====')
m = re.search(r'- Military Moving datasets[^|]*?(?=\n- |\Z)', texts['site/data.txt'], re.S)
print((m.group(0)[:1500] if m else 'NOT FOUND'))
print('===== category HTML intro (from extracted text) =====')
ct = open(H('~/workspace/the-flat-rate-machine/out/batch-naming/text-page-category-military-government-moving-cat.txt')).read()
i = ct.find('This category index is for')
print(ct[i:i+700])
print('===== hub raw HTML: card + who segments =====')
html = texts['site/index.html']
i = html.find('Office and public-sector relocations quoted flat')
print(repr(html[i-200:i+300]))
i = html.find('public-sector teams relocating')
print(repr(html[i-260:i+320]))
