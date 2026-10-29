#!/usr/bin/env python3
"""Deploy batch Stage 1: machine registries + graphs + rubric DB + ocean re-stamp.
Recomputes everything from pages.json refs. Aborts on any assertion failure.
Writes a merge report to out/deploy-batch/merge-report-stage1.json.
"""
import json, re, sqlite3, sys, copy
from pathlib import Path

M = Path.home() / "workspace" / "the-flat-rate-machine"
PUB = Path.home() / "workspace" / "the-flat-rate-movers-pages" / "public"
FLAT = Path.home() / "workspace" / "theflatratemovers"
OUT = M / "out" / "deploy-batch"
TODAY = "2026-10-29"
ORG = "https://theflatratemovers.com/#organization"
SITE = "https://theflatratemovers.com"

def load(p):
    return json.loads(Path(p).read_text())

def dump(p, obj):
    Path(p).write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")

def fail(msg):
    print("STAGE1 FAILED:", msg); sys.exit(1)

# ---------- load ----------
services = load(M / "data/services.json")
pages = load(M / "data/pages.json")
descs = load(M / "data/descriptions.json")
eg = load(M / "data/entity-graph.json")
best = load(M / "data/best-json-entity-graph.json")

# live pageMeta IT desc (verbatim source for descriptions.json)
html = (PUB / "index.html").read_text()
m = re.search(r"'it-equipment-moving-data-center-logistics-services-virginia':\{name:'[^']*', svc:'[^']*', canonical:'[^']*', desc:'((?:[^'\\]|\\.)*)'", html)
if not m:
    fail("live pageMeta IT entry not found")
it_desc = m.group(1).replace("\\'", "'")
print("live IT pageMeta desc:", it_desc[:100], "...")

# package metas/schemas
pkg = {}
for slug, d in [("senior-moving", "senior-moving"),
                ("warehouse-relocation", "warehouse-relocation"),
                ("transloading-winchester-va", "transloading-winchester-va")]:
    pkg[slug] = {
        "meta": load(M / "out/pages" / d / "meta.json"),
        "schema": load(M / "out/pages" / d / "schema.json"),
    }
it_schema = load(M / "out/pages/it-relocation-lock/schema.json")
it_svc = [n for n in it_schema["@graph"] if n.get("@type") == "Service"][0]

# ---------- services.json: add 4 ----------
new_services = [
    {"id": "service-senior-moving", "name": "Senior Moving",
     "description": "Flat-rate senior moves quoted in writing for seniors downsizing, transitioning to assisted or independent living, or relocating closer to family, with packing support and a free film-only video-walkthrough survey room with a human-made estimate.",
     "source": "Phase B senior-moving package 2026-10-29 (GSC 'senior moving' 75 impressions, position 1.0; 'senior movers near me' position 1.0, 3-month pull to 2026-10-27)",
     "attested": TODAY},
    {"id": "service-warehouse-relocation", "name": "Warehouse Relocation",
     "description": "Flat-rate warehouse relocation from The Flat Rate Movers: warehouse and distribution moves, warehouse load-outs and inbound unloads, transload staging, and restacking, carried out by supervised warehouse teams and planned around the site — access, floor space, staging, and equipment handling. Standard Job Pricing: Unload $8.00/CWT, Load $10.00/CWT, APU $12.00/CWT, Residential/Driver Meet $400–$425 per man, quoted per job.",
     "source": "Phase C warehouse-relocation lock package 2026-10-29 (SERP #1 'warehouse relocation services Virginia' via industrial page, SERP check 2026-10-29)",
     "attested": TODAY},
    {"id": "service-it-relocation", "name": "IT Relocation & Setup",
     "description": "IT equipment and data center logistics from The Flat Rate Movers: servers, racks, workstations, and network equipment moved in a planned, labelled sequence so systems come back up in order, as part of commercial and office relocations across the Shenandoah Valley and Eastern Panhandle. Flat rate quoted in writing before move day.",
     "source": "Phase C IT-relocation lock package 2026-10-29 (SERP #1 'IT equipment moving setup Winchester VA'; live page fetched 2026-10-29)",
     "attested": TODAY},
    {"id": "service-transloading-winchester-va", "name": "Transloading Services — Winchester VA",
     "description": "Transloading services from Winchester, VA: ocean containers unloaded, counted, sorted, and restacked into domestic equipment for the inland leg, with cross-docking, deconsolidation, warehouse staging, and final-mile delivery, through the Virginia Inland Port and Port of Virginia chain. Quoted per job, flat rate agreed in writing before dispatch.",
     "source": "Phase C transloading-winchester-va package 2026-10-29 (SERP #3 'transloading services Virginia port container', first mover; ocean container datasets doc 2026-10-29)",
     "attested": TODAY},
]
existing_ids = {s["id"] for s in services["services"]}
for s in new_services:
    if s["id"] in existing_ids:
        fail(f"service id already exists: {s['id']}")
    services["services"].append({**s, "pageCount": 0})

# ---------- pages.json: add 3, amend IT ----------
new_pages = [
    {"slug": "senior-moving", "url": SITE + "/senior-moving/",
     "title": pkg["senior-moving"]["meta"]["title"], "type": "service",
     "services": ["service-senior-moving"], "lastmod": TODAY, "status": "live",
     "source": "Phase B senior-moving package 2026-10-29 + deploy batch 2026-10-29",
     "attested": TODAY},
    {"slug": "warehouse-relocation", "url": SITE + "/warehouse-relocation/",
     "title": pkg["warehouse-relocation"]["meta"]["title"], "type": "service",
     "services": ["service-warehouse-relocation"], "lastmod": TODAY, "status": "live",
     "source": "Phase C warehouse-relocation lock package 2026-10-29 + deploy batch 2026-10-29",
     "attested": TODAY},
    {"slug": "transloading-winchester-va", "url": SITE + "/transloading-winchester-va/",
     "title": pkg["transloading-winchester-va"]["meta"]["title"], "type": "service",
     "services": ["service-transloading-winchester-va"], "lastmod": TODAY, "status": "live",
     "source": "Phase C transloading-winchester-va package 2026-10-29 + deploy batch 2026-10-29",
     "attested": TODAY},
]
existing_slugs = {p["slug"] for p in pages["pages"]}
for p in new_pages:
    if p["slug"] in existing_slugs:
        fail(f"page slug already exists: {p['slug']}")
    if p["title"] != pkg[p["slug"]]["meta"]["title"]:
        fail(f"title/meta mismatch for {p['slug']}")
    pages["pages"].append(p)
it_entry = next((p for p in pages["pages"] if p["slug"] == "it-equipment-moving-data-center-logistics-services-virginia"), None)
if not it_entry:
    fail("IT pages.json entry missing")
if "service-it-relocation" not in it_entry["services"]:
    it_entry["services"].append("service-it-relocation")
it_entry["lastmod"] = TODAY

# ---------- recompute pageCounts + counts ----------
recomputed = {}
for p in pages["pages"]:
    for s in p.get("services", []):
        recomputed[s] = recomputed.get(s, 0) + 1
svc_ids = {s["id"] for s in services["services"]}
unresolved = [s for s in recomputed if s not in svc_ids]
if unresolved:
    fail(f"unresolved service refs: {unresolved}")
for s in services["services"]:
    s["pageCount"] = recomputed.get(s["id"], 0)
services["count"] = len(services["services"])
pages["count"] = len(pages["pages"])
services["generated"] = TODAY
pages["generated"] = TODAY
if services["count"] != 22:
    fail(f"services count {services['count']} != 22")
if pages["count"] != 153:
    fail(f"pages count {pages['count']} != 153")
if len({p["slug"] for p in pages["pages"]}) != 153:
    fail("duplicate page slugs")
print("counts OK: services 22, pages 153")
print("pageCounts:", {s["id"]: s["pageCount"] for s in services["services"] if s["id"].startswith(("service-senior", "service-warehouse", "service-it", "service-transloading"))})

# ---------- descriptions.json ----------
for slug in ["senior-moving", "warehouse-relocation", "transloading-winchester-va"]:
    descs[slug] = pkg[slug]["meta"]["description"]
descs["it-equipment-moving-data-center-logistics-services-virginia"] = it_desc

# guardrail scan on new registry text
reg_text = json.dumps({"services": services, "pages": pages})
if re.search(r"lorem|placeholder|TODO|TBD|XXX", reg_text, re.I):
    fail("placeholder text in registries")
if re.search(r"USDOT|MC-\d{4,}", reg_text, re.I):
    fail("USDOT/MC in registries")

dump(M / "data/services.json", services)
dump(M / "data/pages.json", pages)
dump(M / "data/descriptions.json", descs)
print("registries written")

# ---------- graphs: add 4 Service nodes ----------
def svc_node_eg(svc_id, name, svc_type, desc):
    return {"@id": SITE + "/#" + svc_id, "@type": "Service",
            "areaServed": [{"@id": SITE + "/#winchester-place"}, {"@id": SITE + "/#martinsburg-place"}],
            "description": desc, "name": name,
            "provider": {"@id": ORG}, "serviceType": svc_type}

def svc_node_best(svc_id, name, svc_type, desc, url):
    n = svc_node_eg(svc_id, name, svc_type, desc)
    n["url"] = url
    return n

def pkg_svc_desc(schema):
    return [n for n in schema["@graph"] if n.get("@type") == "Service"][0]

new_nodes = [
    ("service-senior-moving", "Senior Moving", "Senior Moving",
     pkg_svc_desc(pkg["senior-moving"]["schema"])["description"], SITE + "/senior-moving/"),
    ("service-warehouse-relocation", "Warehouse Relocation", "Warehouse Relocation",
     pkg_svc_desc(pkg["warehouse-relocation"]["schema"])["description"], SITE + "/warehouse-relocation/"),
    ("service-it-relocation", "IT Relocation & Setup", "IT Relocation & Setup",
     it_svc["description"], SITE + "/it-equipment-moving-data-center-logistics-services-virginia/"),
    ("service-transloading-winchester-va", "Transloading Services — Winchester VA", "Transloading",
     pkg_svc_desc(pkg["transloading-winchester-va"]["schema"])["description"], SITE + "/transloading-winchester-va/"),
]
for graph, best_flag in [(eg, False), (best, True)]:
    g = graph["@graph"]
    # do not touch the pre-existing transloading node(s); assert presence, not @id equality:
    # EG anchors it at #service-transloading; best anchors it at a page-slug @id by name.
    if not best_flag:
        gen = [n for n in g if n.get("@id") == SITE + "/#service-transloading"]
    else:
        gen = [n for n in g if n.get("@type") == "Service" and n.get("name") == "Loading, Transloading and Container Services"]
    if not gen:
        fail("pre-existing transloading node missing from graph")
    last_svc = max(i for i, n in enumerate(g) if n.get("@type") == "Service")
    ins = []
    for svc_id, name, svc_type, desc, url in new_nodes:
        if any(n.get("@id") == SITE + "/#" + svc_id for n in g):
            fail(f"graph node already exists: {svc_id}")
        ins.append(svc_node_best(svc_id, name, svc_type, desc, url) if best_flag else svc_node_eg(svc_id, name, svc_type, desc))
    g[last_svc + 1:last_svc + 1] = ins
    typed = [n for n in g if n.get("@type") == "Service" and n.get("serviceType")]
    allsvc = [n for n in g if n.get("@type") == "Service"]
    if len(typed) != len(allsvc):
        fail("untyped Service node in graph after merge")
    print(f"graph nodes now: {len(g)} total, {len(allsvc)} Service, all typed")

dump(M / "data/entity-graph.json", eg)
dump(M / "data/best-json-entity-graph.json", best)
# byte-identical mirrors
for f in ["entity-graph.json", "best-json-entity-graph.json"]:
    (FLAT / f).write_bytes((M / "data" / f).read_bytes())
print("graphs written + mirrored")

# ---------- rubric DB ----------
db_path = FLAT / "rubric.db"
con = sqlite3.connect(str(db_path))
cur = con.cursor()
canon_before = cur.execute("SELECT COUNT(*) FROM service WHERE service_id LIKE '%#service-%'").fetchone()[0]
att_before = cur.execute("SELECT COUNT(*) FROM attestation WHERE evidence LIKE '%services.json id%'").fetchone()[0]
for svc_id, name, svc_type, desc, url in new_nodes:
    at_id = SITE + "/#" + svc_id
    cur.execute("INSERT OR IGNORE INTO service (service_id, name, url, description, provider_id) VALUES (?,?,?,?,?)",
                (at_id, name, at_id, next(s["description"] for s in services["services"] if s["id"] == svc_id), ORG))
    pc = next(s["pageCount"] for s in services["services"] if s["id"] == svc_id)
    cur.execute("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?,?,?,?)",
                (f"Service '{name}' is offered by The Flat Rate Movers",
                 "head JSON-LD graph in live site source (index.html)", TODAY,
                 f"services.json id {svc_id}; pages.json pageCount {pc}"))
# service_area extended rows from GeoJSON
geo = load(M / "data/service-area.geojson")
def norm_area(a):
    return re.sub(r",\s*(VA|WV|MD)\s*$", "", a).strip().lower()
existing_areas = {}
for place_id, area in cur.execute("SELECT place_id, area FROM service_area").fetchall():
    existing_areas.setdefault(place_id, set()).add(norm_area(area))
inserted = {"winchester": 0, "martinsburg": 0}
for feat in geo["features"]:
    br = (feat.get("properties") or {}).get("branch")
    fname = (feat.get("properties") or {}).get("name")
    if not br or not fname:
        continue
    targets = []
    if br in ("winchester", "both"):
        targets.append(("winchester", SITE + "/#winchester-place"))
    if br in ("martinsburg", "both"):
        targets.append(("martinsburg", SITE + "/#martinsburg-place"))
    for bkey, place_id in targets:
        if norm_area(fname) not in existing_areas.setdefault(place_id, set()):
            cur.execute("INSERT OR IGNORE INTO service_area (place_id, area, source) VALUES (?,?,?)",
                        (place_id, fname, "service-area.geojson footprint (branch property), adopted 2026-10-28"))
            existing_areas[place_id].add(norm_area(fname))
            inserted[bkey] += 1
con.commit()
canon_after = cur.execute("SELECT COUNT(*) FROM service WHERE service_id LIKE '%#service-%'").fetchone()[0]
att_after = cur.execute("SELECT COUNT(*) FROM attestation WHERE evidence LIKE '%services.json id%'").fetchone()[0]
sa_total = cur.execute("SELECT COUNT(*) FROM service_area").fetchone()[0]
con.close()
print(f"rubric DB: canonical {canon_before} -> {canon_after}, attestations {att_before} -> {att_after}, service_area total {sa_total}, extended inserted {inserted}")
if canon_after != 22 or att_after != 22:
    fail("rubric DB counts != 22")

# ---------- ocean datasets re-stamp ----------
ocean_path = M / "out/phase-a/datasets-ocean-container.json"
ocean = load(ocean_path)
for n in ocean.get("@graph", []):
    n["dateModified"] = TODAY
dump(ocean_path, ocean)
print("ocean datasets re-stamped to", TODAY, "nodes:", len(ocean.get("@graph", [])))

# ---------- report ----------
report = {
    "services_count": 22, "pages_count": 153,
    "new_services": [s["id"] for s in new_services],
    "new_pages": [p["slug"] for p in new_pages],
    "it_entry_services": it_entry["services"],
    "pageCounts_new": {s["id"]: s["pageCount"] for s in services["services"] if s["id"] in [x["id"] for x in new_services]},
    "rubric_db": {"canonical_before": canon_before, "canonical_after": canon_after,
                  "attestations_before": att_before, "attestations_after": att_after,
                  "service_area_total": sa_total, "service_area_extended_inserted": inserted},
    "ocean_nodes_restamped": len(ocean.get("@graph", [])),
}
dump(OUT / "merge-report-stage1.json", report)
print("STAGE1 OK")
