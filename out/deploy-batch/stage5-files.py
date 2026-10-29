#!/usr/bin/env python3
"""Deploy batch Stage 5: public/ files (sitemap, per-page JSONs, graphs,
ai-sitemap, llms.txt, data txt). Anchored + asserted; no quote/ARD/robots/
GeoJSON/worker/DNS/GBP touches."""
import json, shutil, sys
from pathlib import Path

M = Path.home() / "workspace" / "the-flat-rate-machine"
PUB = Path.home() / "workspace" / "the-flat-rate-movers-pages" / "public"
SITE = "https://theflatratemovers.com"
TODAY = "2026-10-29"
FORBIDDEN = ["DESIGN 6", "lorem", "Spearman Group", "Around Town Movers", "USDOT", "MC-"]

def fail(msg):
    print("STAGE5 FAILED:", msg); sys.exit(1)

def once(h, anchor, what):
    if h.count(anchor) != 1:
        fail(f"anchor for {what} occurs {h.count(anchor)}x (expected 1)")

foot = json.loads((M / "out/footprint.json").read_text())
WIN, MAR = foot["winchesterFootprint"], foot["martinsburgFootprint"]
assert len(WIN) == 31 and len(MAR) == 35, "footprint lengths"

# ---------- 1. per-page JSONs ----------
jobs = [
    ("senior-moving", "senior-moving", "service-senior-moving"),
    ("warehouse-relocation", "warehouse-relocation", "service-warehouse-relocation"),
    ("transloading-winchester-va", "transloading-winchester-va", "service-transloading-winchester-va"),
    ("it-relocation-lock", "it-equipment-moving-data-center-logistics-services-virginia", "service-it-relocation"),
]
for pkg, slug, frag in jobs:
    d = json.loads((M / "out/pages" / pkg / "schema.json").read_text())
    svc = next(n for n in d["@graph"] if n["@type"] == "Service")
    if svc["@id"] != f"{SITE}/#{frag}":
        fail(f"{pkg}: Service @id {svc['@id']} != #{frag}")
    if svc.get("url") != f"{SITE}/{slug}/":
        fail(f"{pkg}: Service url {svc.get('url')} != {SITE}/{slug}/")
    for n in d["@graph"]:
        if n["@type"] == "Place" and n["@id"] == f"{SITE}/#winchester":
            n["areaServed"] = WIN
        if n["@type"] == "Place" and n["@id"] == f"{SITE}/#martinsburg":
            n["areaServed"] = MAR
    txt = json.dumps(d, indent=1, ensure_ascii=False) + "\n"
    for f in FORBIDDEN:
        if f in txt:
            fail(f"{pkg}: forbidden string {f} in per-page JSON")
    (PUB / f"{slug}.json").write_text(txt)
    print(f"per-page JSON: {slug}.json ({len(txt)} chars)")

# ---------- 2. sitemap.xml ----------
sm = (PUB / "sitemap.xml").read_text()
if sm.count("<loc>") != 150:
    fail(f"sitemap locs before edit: {sm.count('<loc>')} (expected 150)")
it_entry = f"<url><loc>{SITE}/it-equipment-moving-data-center-logistics-services-virginia/</loc><lastmod>2026-10-28</lastmod></url>"
once(sm, it_entry, "IT sitemap entry")
sm = sm.replace(it_entry, it_entry.replace("2026-10-28", TODAY), 1)
new_urls = "".join(
    f"<url><loc>{SITE}/{s}/</loc><lastmod>{TODAY}</lastmod></url>\n"
    for s in ["senior-moving", "warehouse-relocation", "transloading-winchester-va"])
once(sm, "</urlset>", "sitemap close")
sm = sm.replace("</urlset>", new_urls + "</urlset>", 1)
(PUB / "sitemap.xml").write_text(sm)
if sm.count("<loc>") != 153:
    fail(f"sitemap locs after edit: {sm.count('<loc>')} (expected 153)")
print("sitemap.xml: 150 -> 153 locs, IT lastmod 2026-10-29")

# ---------- 3. graphs ----------
for name, expect in [("entity-graph.json", 38), ("best-json-entity-graph.json", 73)]:
    src = M / "data" / name
    d = json.loads(src.read_text())
    if len(d["@graph"]) != expect:
        fail(f"{name}: {len(d['@graph'])} nodes (expected {expect})")
    shutil.copyfile(src, PUB / name)
    print(f"graph copied: {name} ({expect} nodes)")

# ---------- 4. ai-sitemap ----------
ai = json.loads((M / "out/phase-a/ai-sitemap.json").read_text())
svcs = ai.get("services") or ai.get("hasPart") and None
n_svc = len(ai["services"]) if isinstance(ai.get("services"), list) else None
n_part = len(ai["hasPart"]) if isinstance(ai.get("hasPart"), list) else None
print(f"staged ai-sitemap: services={n_svc}, hasPart={n_part}")
if n_svc != 22 or n_part != 153:
    fail("staged ai-sitemap counts wrong (expected 22/153)")
if "dataset-node" in json.dumps(ai).lower():
    fail("ai-sitemap unexpectedly references dataset-node")
shutil.copyfile(M / "out/phase-a/ai-sitemap.json", PUB / "ai-sitemap.json")
print("ai-sitemap.json copied (22/153)")

# ---------- 5. llms.txt ----------
ll = (PUB / "llms.txt").read_text()
once(ll, "150 clean canonical URLs (no hash URLs)", "llms sitemap clause")
ll = ll.replace("150 clean canonical URLs (no hash URLs)", "153 clean canonical URLs (no hash URLs)", 1)
once(ll, "sitemap.xml rebuilt to 126", "llms history line (must survive)")
ind = "- [Industrial & Commercial Services](https://theflatratemovers.com/#/industrial-commercial-services)"
once(ll, ind, "llms industrial service line")
services = json.loads((M / "data/services.json").read_text())["services"]
by_id = {s["id"]: s for s in services}
svc_lines = ""
for sid, slug in [("service-senior-moving", "senior-moving"),
                  ("service-warehouse-relocation", "warehouse-relocation"),
                  ("service-it-relocation", "it-equipment-moving-data-center-logistics-services-virginia"),
                  ("service-transloading-winchester-va", "transloading-winchester-va")]:
    s = by_id[sid]
    svc_lines += f"- [{s['name']}](https://theflatratemovers.com/{slug}/): {s['description']}\n"
# insert after the industrial line (end of that line)
pos = ll.find(ind) + len(ind)
eol = ll.find("\n", pos)
ll = ll[:eol + 1] + svc_lines + ll[eol + 1:]
ll_update = """
## Update — 2026-10-29 (deploy batch)
- Phase A infrastructure repair: serviceType on every Service node in both graphs; ai-sitemap regenerated from machine data (22 services, 153 pages); FAQ schema completed to all 9 questions on #/faq plus local-regional-moving and industrial-offices-moving Q&As; rubric database synced to 22 services and the full 31/35 footprint.
- 3 new pages: Senior Moving, Warehouse Relocation, Transloading Services — Winchester VA (full footprint, branches kept distinct); IT relocation lock: new #service-it-relocation node for the existing IT equipment page, pageMeta pointer corrected from #service-commercial. Pages 150 → 153, services 18 → 22.
- Ocean container D1–D8 datasets staged for the machine-readable repository (full treatment); no Dataset nodes ship on live pages in this batch, and no senior, warehouse, IT, or transloading dataset node ships — those categories receive full deep-database treatment before any dataset node publishes.
"""
if not ll.endswith("\n"):
    ll += "\n"
ll += ll_update
(PUB / "llms.txt").write_text(ll)
print("llms.txt updated (153 clause, 4 service lines, 2026-10-29 section)")

# ---------- 6. data txt ----------
dt = (PUB / "the-flat-rate-movers-data.txt").read_text()
once(dt, "Updated: 2026-10-28", "data txt updated line")
dt = dt.replace("Updated: 2026-10-28", "Updated: 2026-10-29", 1)
once(dt, "Live site 2026-10-28: Cloudflare Pages, 150 clean canonical URLs in sitemap.xml", "data txt live-site clause")
dt = dt.replace("Live site 2026-10-28: Cloudflare Pages, 150 clean canonical URLs in sitemap.xml",
                "Live site 2026-10-29: Cloudflare Pages, 153 clean canonical URLs in sitemap.xml", 1)
once(dt, "Sitemap now 150 clean canonical URLs.", "data txt sitemap line")
dt = dt.replace("Sitemap now 150 clean canonical URLs.", "Sitemap now 153 clean canonical URLs.", 1)
dt_update = """
## Update 2026-10-29 — deploy batch (Phase A repair + senior + warehouse + IT lock + Winchester transloading)
- Phase A infrastructure repair: serviceType on every Service node in both graphs; ai-sitemap regenerated from machine data (22 services, 153 pages); FAQ schema completed to all 9 questions on #/faq plus local-regional-moving and industrial-offices-moving Q&As; rubric database synced to 22 services and the full 31/35 footprint.
- 3 new pages (full footprint, branches kept distinct):
- Senior Moving: https://theflatratemovers.com/senior-moving/ (per-page JSON: https://theflatratemovers.com/senior-moving.json)
- Warehouse Relocation: https://theflatratemovers.com/warehouse-relocation/ (per-page JSON: https://theflatratemovers.com/warehouse-relocation.json)
- Transloading Services — Winchester VA: https://theflatratemovers.com/transloading-winchester-va/ (per-page JSON: https://theflatratemovers.com/transloading-winchester-va.json)
- IT relocation lock (existing page, no new slug, no visible copy change): https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia/ (per-page JSON: https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia.json) — new #service-it-relocation node, pageMeta pointer corrected from #service-commercial.
- Ocean container D1–D8 datasets staged for the machine-readable repository (full treatment); no Dataset nodes ship on live pages in this batch, and no senior, warehouse, IT, or transloading dataset node ships — those categories receive full deep-database treatment before any dataset node publishes.
- Pages 150 → 153, services 18 → 22. No GBP edits, no DNS changes, no quote test posts in this batch.
"""
if not dt.endswith("\n"):
    dt += "\n"
dt += dt_update
(PUB / "the-flat-rate-movers-data.txt").write_text(dt)
print("data txt updated (153 clauses, 2026-10-29 section)")
print("STAGE5 OK")
