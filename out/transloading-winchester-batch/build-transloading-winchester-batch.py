#!/usr/bin/env python3
"""Transloading Services — Winchester VA deep refresh deploy batch — 2026-10-29.
Reconciles the transloading-winchester-deep package against CURRENT live state
(post-IT batch): canonical #service-transloading-winchester-va node completed in
head + entity + best (url added where missing — entity + head; full 682-char
package description everywhere; Place chain at the full 31/35 footprint
preserved), per-page JSON Service node refreshed to canonical (expanded Place
nodes preserved byte-for-byte), datasets-transloading-winchester.json created
under the RETYPE rule (W-D1–W-D8 extending ocean D1–D8), Developer card,
ai-sitemap refresh + keywords, llms/data-txt dated entries, DB rows.
Q15 EXECUTED: the ocean container datasets file (byte-identical to the copy
published in the ai repo, git blob c208450e8f57318a8fb3236e85b8a396d4418f50)
is placed in public/ so it serves live as application/json.
Generic #service-transloading node UNTOUCHED (exactly-one-node-changed checks).
Counts unchanged: pages 155 / services 23 / sitemap 155.
Pricing: "quoted per job" is the ONLY pricing language — no CWT, no rates, no
dollar figures anywhere in this batch's new content.
"""
import json, re, shutil, sqlite3, sys
from pathlib import Path

HOME = Path.home()
PUB = HOME / "workspace/the-flat-rate-movers-pages/public"
MACHINE = HOME / "workspace/the-flat-rate-machine"
FLAT = HOME / "workspace/theflatratemovers"
PKG = MACHINE / "out/pages/transloading-winchester-deep"
BATCH = MACHINE / "out/transloading-winchester-batch"
BACKUP = BATCH / "backup-2026-10-29"
DB = FLAT / "rubric.db"
DATE = "2026-10-29"
SVC = "https://theflatratemovers.com/#service-transloading-winchester-va"
GENERIC = "https://theflatratemovers.com/#service-transloading"
HUB = "https://theflatratemovers.com/transloading-winchester-va/"
ORG = "https://theflatratemovers.com/#organization"
OCEAN_SRC = MACHINE / "out/phase-a/datasets-ocean-container.json"

def fail(msg):
    print("FAIL:", msg); sys.exit(1)

def rep(text, old, new, n=1, scope=""):
    c = text.count(old)
    if c != n:
        fail(f"replace anchor count {c} != {n} [{scope}]: {old[:80]!r}")
    return text.replace(old, new, n)

pkg_schema = json.loads((PKG / "schema.json").read_text(encoding="utf-8"))
pkg_svc = next(n for n in pkg_schema["@graph"] if n.get("@id") == SVC)
DESC = pkg_svc["description"]
if len(DESC) != 682:
    fail(f"package description drift: {len(DESC)} chars != 682")
if pkg_svc.get("url") != HUB or pkg_svc.get("name") != "Transloading Services — Winchester VA" or pkg_svc.get("serviceType") != "Transloading":
    fail("package canonical node fields drift")
for bad in ["$", "CWT", "attest", "Spearman", "Around Town", "Bristow", "USDOT"]:
    if bad in DESC:
        fail(f"package description carries forbidden content: {bad}")
CANON_KEYS = ["@id", "@type", "areaServed", "description", "name", "provider", "serviceType", "url"]
CANON = {k: pkg_svc[k] for k in CANON_KEYS}

# ---------- 0. Backups + preconditions ----------
BACKUP.mkdir(parents=True, exist_ok=True)
for src, name in [
    (PUB / "index.html", "index.html"), (PUB / "ai-sitemap.json", "pub-ai-sitemap.json"),
    (PUB / "llms.txt", "pub-llms.txt"), (PUB / "the-flat-rate-movers-data.txt", "pub-data.txt"),
    (PUB / "entity-graph.json", "pub-entity-graph.json"), (PUB / "best-json-entity-graph.json", "pub-best.json"),
    (PUB / "transloading-winchester-va.json", "pub-transloading-winchester-va.json"),
    (MACHINE / "data/entity-graph.json", "machine-entity-graph.json"),
    (MACHINE / "data/best-json-entity-graph.json", "machine-best.json"),
    (FLAT / "entity-graph.json", "flat-entity-graph.json"), (FLAT / "best-json-entity-graph.json", "flat-best.json"),
    (DB, "rubric.db"),
]:
    dst = BACKUP / name
    if dst.exists():
        fail(f"backup already exists: {name} (a prior run may have partially applied — reconcile manually)")
    shutil.copyfile(src, dst)
print("backups written to", BACKUP)

if (PUB / "datasets-transloading-winchester.json").exists():
    fail("datasets-transloading-winchester.json already exists — expected creation")
if (PUB / "datasets-ocean-container.json").exists():
    fail("datasets-ocean-container.json already in public/ — Q15 premise drift")
if (PUB / "dataset-node.json").exists():
    fail("held dataset-node.json present in public/ — must never ship")

def load_graph(path):
    raw = path.read_text(encoding="utf-8")
    d = json.loads(raw)
    if json.dumps(d, indent=2, ensure_ascii=False) != raw.rstrip("\n"):
        fail(f"{path.name} not byte-stable at indent 2")
    return d

def svc_nodes(d, sid=SVC):
    return [n for n in d["@graph"] if isinstance(n, dict) and n.get("@id") == sid]

eg = load_graph(PUB / "entity-graph.json")
bg = load_graph(PUB / "best-json-entity-graph.json")
if len(eg["@graph"]) != 33 or len(bg["@graph"]) != 80:
    fail(f"graph baselines wrong: entity {len(eg['@graph'])}, best {len(bg['@graph'])}")
if len(svc_nodes(eg)) != 1 or len(svc_nodes(bg)) != 1:
    fail("winchester node count in machine graphs != 1")
if len(svc_nodes(eg, GENERIC)) != 1:
    fail("generic transloading node count in entity graph != 1")
for d, lbl in ((eg, "entity"), (bg, "best")):
    places = {n["@id"].split("#")[-1]: len(n.get("areaServed", [])) for n in d["@graph"] if n.get("@type") == "Place"}
    if places != {"winchester": 31, "martinsburg": 35}:
        fail(f"{lbl} Place footprint drift: {places}")
en, bn = svc_nodes(eg)[0], svc_nodes(bg)[0]
if "url" in en:
    fail("entity winchester node unexpectedly already carries url")
if bn.get("url") != HUB:
    fail("best winchester node url drift")
if len(en.get("description", "")) != 347 or len(bn.get("description", "")) != 347:
    fail("machine-graph winchester description baseline drift (expected the 347-char pre-refresh text)")

# per-page JSON: byte-stable, Service node present once, Places expanded 31/35
pp_raw = (PUB / "transloading-winchester-va.json").read_text(encoding="utf-8")
pp = json.loads(pp_raw)
if json.dumps(pp, indent=2, ensure_ascii=False) != pp_raw.rstrip("\n"):
    fail("transloading-winchester-va.json not byte-stable at indent 2")
pp_svc = svc_nodes(pp)
if len(pp_svc) != 1:
    fail("per-page winchester Service node count != 1")
pp_places = {n["@id"].split("#")[-1]: len(n.get("areaServed", [])) for n in pp["@graph"] if n.get("@type") == "Place"}
if pp_places != {"winchester": 31, "martinsburg": 35}:
    fail(f"per-page Place footprint drift: {pp_places}")

con = sqlite3.connect(DB)
base = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        for t in ["service", "attestation", "edge", "opening_hours", "service_area", "rubric_check"]}
if base != {"service": 32, "attestation": 103, "edge": 40, "opening_hours": 14, "service_area": 66, "rubric_check": 7}:
    fail(f"DB baseline drift: {base}")
if con.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
    fail("DB integrity not ok")
canon = con.execute("SELECT COUNT(*) FROM service WHERE service_id LIKE '%#service-%'").fetchone()[0]
if canon != 23:
    fail(f"canonical service rows {canon} != 23")
if con.execute("SELECT COUNT(*) FROM service WHERE service_id=?", (SVC,)).fetchone()[0] != 1:
    fail("canonical winchester service row missing or duplicated")
con.close()

def router_audit(html, label):
    m = re.search(r"var pages=\[(.*?)\];", html, re.S)
    if not m:
        fail(f"router pages array not found [{label}]")
    arr = re.findall(r"'([^']+)'", m.group(1))
    pm = html.find("pageMeta={")
    if pm < 0:
        fail(f"pageMeta not found [{label}]")
    seg = html[pm:pm + 400000]
    k1 = re.findall(r"(?:^|,)\s*'?([a-zA-Z0-9\-]+)'?\s*:\{name:", seg, re.M)
    k2 = re.findall(r'"([a-zA-Z0-9\-]+)":\{"name":', seg)
    keys = set(k1) | set(k2)
    if len(arr) != 155 or len(set(arr)) != 155:
        fail(f"router array count drift [{label}]: {len(arr)}/{len(set(arr))}")
    if keys != set(arr):
        fail(f"router audit mismatch [{label}]: pageMeta {len(keys)} vs array {len(set(arr))}; diff {keys ^ set(arr)}")
    print(f"router audit clean [{label}]: pageMeta 155 keys == router array 155 entries, sets exactly equal")
    return set(arr)

html_current = (PUB / "index.html").read_text(encoding="utf-8")
router_audit(html_current, "pre-build live index")
print("preconditions ok: graphs 33/80 footprints 31/35, per-page JSON expanded, DB", base)

# ---------- 1. datasets-transloading-winchester.json (W-D1–W-D8 under the RETYPE rule) ----------
CREATOR = {"@id": ORG, "sameAs": [
    "https://www.instagram.com/theflatratemovers/",
    "https://www.threads.com/@theflatratemovers",
    "https://x.com/ratemovers",
    "https://www.youtube.com/@theflatratemovers",
    "https://github.com/TheFlatRateMovers",
    "https://medium.com/@ratemovers"]}
DIST = [
    {"contentUrl": "https://theflatratemovers.com/ai-sitemap.json", "encodingFormat": "application/json"},
    {"contentUrl": "https://theflatratemovers.com/service-area.geojson", "encodingFormat": "application/json"},
    {"contentUrl": "https://theflatratemovers.com/entity-graph.json", "encodingFormat": "application/ld+json"},
    {"contentUrl": "https://theflatratemovers.com/best-json-entity-graph.json", "encodingFormat": "application/ld+json"}]
SPATIAL = [{"@id": "https://theflatratemovers.com/#winchester"}, {"@id": "https://theflatratemovers.com/#martinsburg"}]

def node(slug, typ, name, desc, keywords, extra=None):
    n = {"@id": f"https://theflatratemovers.com/#dataset-transloading-winchester-{slug}", "@type": typ,
         "name": name, "description": desc, "keywords": keywords,
         "about": [{"@id": SVC}], "spatialCoverage": SPATIAL,
         "temporalCoverage": "2010/2026", "dateModified": DATE,
         "creator": CREATOR, "license": "https://creativecommons.org/licenses/by/4.0/",
         "distribution": DIST, "sameAs": HUB}
    if extra:
        n.update(extra)
    return n

ORGREF = {"@id": ORG}
nodes = [
    node("operations", "Service", "Winchester Transload Operations",
         "Winchester transload operations: the Winchester-branch execution of a single transload job, from appointment to empty return. The appointment is booked before the container leaves the terminal. At the branch the container is devanned and destuffed; the freight is counted, inspected, and photographed, with exceptions reported in writing the same day; reworked as the job requires — palletized, wrapped, labeled, sorted by destination, purchase order, or SKU; restacked into 53ft domestic trailers (a 40ft container fills about 20 pallet positions, a 20ft about 10); dispatched inland the same day or the next morning; the empty container returned immediately after devanning, before per-diem accrues; and the final mile run by appointment. Domain reference, labeled as such: devanning happens at a warehouse or container freight station; floor-loaded and palletized are the two handling modes; cross-dock dwell is measured in hours, storage between legs in days. Every container transloading job is quoted per job and agreed in writing before dispatch — the only pricing basis published for this service. Not published and not claimed: any named port terminal or ramp; any drayage performer or chassis source; any list of handled container types.",
         ["transloading winchester va", "transloading services virginia", "transloading virginia port container", "container unloading winchester va", "virginia inland port transloading", "port of virginia container services"],
         {"provider": ORGREF, "publisher": ORGREF}),
    node("cross-dock-restack", "Dataset", "Cross-Dock, Decon & Restack Operations",
         "Cross-dock, deconsolidation, and restack operations for Winchester transloading — the dwell models and the restack arithmetic, as data. Cross-dock: freight never enters storage and leaves the same shift. Deconsolidation: the container is broken by destination, purchase order, or SKU. Restack: freight is rebuilt into 53ft domestic trailers, split across destinations where the job calls for it. Restack arithmetic, labeled domain-typical and governed by each load plan: a 40ft container fills about 20 pallet positions; a 20ft about 10. Dwell models, labeled domain: cross-dock dwell is measured in hours; storage between legs is measured in days. IPI — where the original container continues inland intact — is vocabulary in this dataset, not a Winchester service claim. Outbound modes recorded as data: full truckload, less-than-truckload, and split delivery. No dwell-time guarantee and no rate of any kind is published in this dataset.",
         ["container deconsolidation virginia", "cross-docking virginia", "container restacking virginia", "deconsolidation services virginia mid-atlantic"]),
    node("equipment-reference", "Dataset", "Winchester Container Equipment Reference",
         "Winchester container equipment reference — the container vocabulary buyers search, held strictly as domain reference; nothing in this dataset claims any container type is handled by the company. Domain reference data: 20ft general purpose, about 33 cubic meters, about 28,200 kg maximum payload; 40ft general purpose, about 67 cubic meters, about 26,700 kg; 40ft high cube, about 76 cubic meters, about 26,580 kg; refrigerated containers hold a set range from about minus 30 to plus 30 degrees Celsius; open top, flat rack (20ft about 40 tonnes, 40ft about 45 tonnes), platform, and tank containers (20,000 liters and up) complete the standard taxonomy; most dry containers carry a maximum gross of 30,480 kg, and the CSC plate on each individual box governs that box. Not published and not claimed: which container types the Winchester branch handles; any refrigerated or cold-chain capability; any flat-rack or out-of-gauge scope. Those fields stay empty until the company publishes them — the empty fields are this dataset's accuracy, not a gap in it.",
         ["container sizes virginia", "40ft container capacity", "20ft container capacity", "container taxonomy"]),
    node("port-chain-dispatch", "Dataset", "Winchester Port Chain & Corridor Dispatch",
         "Winchester port chain and corridor dispatch — the chain a Winchester transload travels, as data, with no terminal or ramp named. The chain: the Virginia Inland Port and the Port of Virginia, named at the port-system level only; dispatch from the Winchester branch on I-81, I-66, and I-70; the Martinsburg branch cross-referenced, never blended; the final-mile leg by appointment. Domain reference, labeled as such: drayage is the short move between terminal and facility, usually 100 miles or less; port storage is a separate terminal charge, distinct from demurrage; an IPI movement keeps freight in the original container inland, where a transload rebuilds it into domestic equipment. Not published and not claimed: any Port of Virginia terminal name; any Virginia Inland Port ramp name; who performs the drayage leg; where chassis are sourced. Container transloading jobs are quoted per job, agreed in writing before dispatch.",
         ["virginia inland port transloading", "port of virginia container services", "transloading virginia port container", "i-81 corridor transloading virginia"]),
    node("terms", "Article", "Winchester Commercial Terms & Cost Avoidance",
         "Winchester commercial terms and cost avoidance. The company's only published pricing term for container transloading: jobs are quoted per job and agreed in writing before dispatch. No per-container rate, no weight-based container rate, no minimum, and no fee schedule is published for this service — any figure presented as a company container rate did not come from the company. Everything else in this article is labeled domain education, never company terms. Free time is the window a container may sit before charges begin; the last free day ends it. Demurrage is the charge for container time at the terminal, billed per container per day and escalating the longer the box sits. Detention — per-diem — is the parallel charge for container time outside the terminal, and its clock stops when the empty is returned. Port storage is a separate terminal charge again. Chassis are pool-managed, shortages happen, split fees are possible, and tri-axle chassis enter the picture for heavy boxes — variables a transload plan works around, with the job quoted per job. The FMC 2024 billing rule governs who may be billed for demurrage and detention, what an invoice must show, and the window for disputing one. The causes that burn free time, from domain practice: late or incomplete documents; duty delays; customs exams; transport not arranged; slow offload; late empty return. The avoidance discipline, from domain practice: documents ready before arrival; free time known at booking, with extra negotiated where the job needs it; clearance and transport coordinated together; the receiving site ready; the empty returned promptly; and devanning into a warehouse when the premises are not ready to receive.",
         ["demurrage charges importers", "detention charges container", "demurrage vs detention", "free time container terminal", "container demurrage avoidance", "port storage charges"],
         {"headline": "Winchester Commercial Terms & Cost Avoidance", "author": ORGREF, "publisher": ORGREF}),
    node("personas", "Article", "Winchester Buyer Personas & Trigger Events",
         "Winchester buyer personas and trigger events. Who buys a Winchester transload, as published on the service page: importers and distributors are the core audience; retail and e-commerce sellers; third-party logistics providers, forwarders, and brokers; manufacturers; warehouses and distribution centers; and project cargo owners, for whom the SIR conditional applies. Trigger events, labeled domain context: port congestion and terminal dwell pressure; free time running out; one consolidated container splitting to several destinations; an overweight container where transloading beats permitting; surge and overflow volume; and an emergency shift or container tip needing same-day recovery. How a job starts: the quote path on this site — the main button reads 'Get My Flat Rate Quote' and the pill button 'Get a flat rate quote'; the Short (Quick Quote) form is the default and the Detailed Project form switches in place, preserving the From, To, and What's moving entries; job details are agreed before dispatch. No client is named in this dataset, no testimonial is quoted, and no contract term is claimed.",
         ["transloading services virginia port container", "emergency port container recovery", "container moving virginia", "warehouse transloading virginia"],
         {"headline": "Winchester Buyer Personas & Trigger Events", "author": ORGREF, "publisher": ORGREF}),
    node("protection-compliance", "Service", "Handling, Protection & Compliance Boundaries",
         "Handling, protection, and compliance boundaries for Winchester transloading. What a Winchester transload does to cargo, as published: the freight is counted, inspected, and photographed on devanning; damage and exceptions are reported the same day, in writing; freight is palletized where the job needs it, shrink-wrapped, labeled, sorted, and segregated by destination, purchase order, or SKU. Conditional: where a transload actually involves a high-mass asset of 1,500 to 3,500 lbs, that asset moves under SIR Structural Integrity Relocation with floor deflection analysis to L/360, as part of the same flat-rate job — only where such an asset is actually involved. Adjacent services, cross-referenced and never duplicated here: ISPM 15 export packing and custom crating. Domain definition, labeled as such: TWIC, the Transportation Worker Identification Credential, is the port-access credential used at secure port facilities. Not published and not claimed: the company's TWIC credential status; refrigerated or cold-chain handling; bonded warehouse operation; foreign-trade zone operation; customs brokerage; drayage fleet ownership; chassis ownership; and any named equipment list — no forklifts, pallet jacks, dollies, or cranes are listed for this service.",
         ["container inspection virginia", "transload damage reporting", "ispm 15 export packing virginia", "custom crating virginia"],
         {"provider": ORGREF, "publisher": ORGREF}),
    node("areas-quote", "Dataset", "Winchester Service Areas, Dispatch & Quote Path",
         "Winchester service areas, dispatch, and quote path for transloading — two branches, always distinct. Winchester: The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester, VA 22601, geo 39.18711576, -78.1668352, hours Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google rating 5.0 from 1 review; published Google Business service areas 16; full footprint 31 areas. Martinsburg: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404, geo 39.48319665, -77.94760443, hours Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google rating 4.7 from 6 reviews; published Google Business service areas 14; full footprint 35 areas; 14 areas are shared, and Moorefield 26836 is served by both. Dispatch: I-81, I-66, and I-70 corridors from the Winchester branch, through the Virginia Inland Port and Port of Virginia chain; the final-mile leg runs by appointment. Quote path: the Short (Quick Quote) form is the default, the Detailed Project form switches in place preserving From, To, and What's moving; the main button reads 'Get My Flat Rate Quote' and the pill button 'Get a flat rate quote'. The video survey room is a household-survey route, not a container-job route — container jobs start through the job-details quote path. Founded June 2010. Tagline: 'Guaranteed Flat Rate or Your Move is Free!'",
         ["transloading winchester va", "moving company winchester va", "movers winchester va", "winchester moving company", "transloading martinsburg wv"]),
]
datasets_obj = {"@context": "https://schema.org", "@graph": nodes}
datasets_txt = json.dumps(datasets_obj, indent=2, ensure_ascii=False) + "\n"
from collections import Counter
split = Counter(n["@type"] for n in nodes)
if split != {"Dataset": 4, "Service": 2, "Article": 2}:
    fail(f"retype split wrong: {split}")
for n in nodes:
    if not (50 <= len(n["description"]) < 5000):
        fail(f"description length out of band: {n['@id']} {len(n['description'])}")
    if n["@type"] == "Dataset" and n["license"] != "https://creativecommons.org/licenses/by/4.0/":
        fail("Dataset license missing")
print("datasets-transloading-winchester.json built: 8 nodes, split", dict(split))

# ---------- 2. Machine graphs: complete the canonical node in place ----------
def upgrade_graph_node(d, add_url):
    n = svc_nodes(d)[0]
    out = {}
    for k, v in n.items():
        out[k] = DESC if k == "description" else v
    if add_url:
        if "url" in n:
            fail("graph node unexpectedly already has url")
        out["url"] = HUB
    if out.get("description") != DESC or out.get("url") != HUB:
        fail("graph node upgrade incomplete")
    if {k: out[k] for k in CANON_KEYS} != CANON:
        fail("graph node does not equal the canonical package node")
    idx = d["@graph"].index(n)
    d["@graph"][idx] = out
    return out

for d, lbl, add_url in ((eg, "entity", True), (bg, "best", False)):
    before = [json.dumps(x, sort_keys=True) for x in d["@graph"]]
    gen_before = json.dumps(svc_nodes(d, GENERIC)[0], sort_keys=True) if svc_nodes(d, GENERIC) else None
    upgrade_graph_node(d, add_url)
    after = [json.dumps(x, sort_keys=True) for x in d["@graph"]]
    changed = sum(1 for a, b in zip(before, after) if a != b)
    if changed != 1:
        fail(f"{lbl}: {changed} nodes changed, expected exactly 1")
    gen_after = json.dumps(svc_nodes(d, GENERIC)[0], sort_keys=True) if svc_nodes(d, GENERIC) else None
    if gen_before != gen_after:
        fail(f"{lbl}: GENERIC transloading node changed — must stay untouched")
    txt = json.dumps(d, indent=2, ensure_ascii=False) + "\n"
    for path in [PUB / ("entity-graph.json" if lbl == "entity" else "best-json-entity-graph.json"),
                 MACHINE / "data" / ("entity-graph.json" if lbl == "entity" else "best-json-entity-graph.json"),
                 FLAT / ("entity-graph.json" if lbl == "entity" else "best-json-entity-graph.json")]:
        path.write_text(txt, encoding="utf-8")
    print(f"{lbl} graph: winchester node completed in place (url {'added' if add_url else 'kept'} + 682-char description); generic node byte-identical; all 3 copies byte-identical")

# ---------- 3. Per-page JSON: refresh ONLY the Service node to canonical; Places preserved ----------
pp_before = [json.dumps(x, sort_keys=True) for x in pp["@graph"]]
ppn = pp_svc[0]
new_pp_svc = {}
for k, v in ppn.items():
    new_pp_svc[k] = DESC if k == "description" else v
if {k: new_pp_svc[k] for k in CANON_KEYS} != CANON:
    fail("per-page Service node does not equal canonical after refresh")
pp["@graph"][pp["@graph"].index(ppn)] = new_pp_svc
pp_after = [json.dumps(x, sort_keys=True) for x in pp["@graph"]]
if sum(1 for a, b in zip(pp_before, pp_after) if a != b) != 1:
    fail("per-page JSON: expected exactly 1 node changed")
pp_places_after = {n["@id"].split("#")[-1]: len(n.get("areaServed", [])) for n in pp["@graph"] if n.get("@type") == "Place"}
if pp_places_after != {"winchester": 31, "martinsburg": 35}:
    fail(f"per-page footprint changed by refresh: {pp_places_after}")
(PUB / "transloading-winchester-va.json").write_text(json.dumps(pp, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("per-page transloading-winchester-va.json: Service node refreshed to canonical; Place footprints 31/35 preserved")

# ---------- 4. index.html: head node + page div datasets block + Developer card ----------
idx_path = PUB / "index.html"
html = idx_path.read_text(encoding="utf-8")
html_before = html

tag = '<script type="application/ld+json">'
hstart = html.find(tag)
hbody_start = hstart + len(tag)
hbody_end = html.find("</script>", hbody_start)
head_body = html[hbody_start:hbody_end]
head_graph = json.loads(head_body)
if json.dumps(head_graph, indent=2, ensure_ascii=False) != head_body:
    fail("head graph block is not byte-stable — refusing to reformat")
if len(head_graph["@graph"]) != 25:
    fail(f"head graph nodes {len(head_graph['@graph'])} != 25")
hwh = [n for n in head_graph["@graph"] if isinstance(n, dict) and n.get("@id") == SVC]
if len(hwh) != 1:
    fail("head winchester node count != 1")
n = hwh[0]
if "url" in n:
    fail("head winchester node unexpectedly already carries url")
if len(n.get("description", "")) != 347:
    fail(f"head winchester description baseline drift: {len(n.get('description', ''))} != 347")
head_before = [json.dumps(x, sort_keys=True) for x in head_graph["@graph"]]
gen_head_before = json.dumps([x for x in head_graph["@graph"] if isinstance(x, dict) and x.get("@id") == GENERIC][0], sort_keys=True)
out = {}
for k, v in n.items():
    out[k] = DESC if k == "description" else v
    if k == "provider":
        out["url"] = HUB
if out.get("url") != HUB or out.get("description") != DESC:
    fail("head winchester upgrade incomplete")
head_graph["@graph"][head_graph["@graph"].index(n)] = out
head_after = [json.dumps(x, sort_keys=True) for x in head_graph["@graph"]]
if sum(1 for a, b in zip(head_before, head_after) if a != b) != 1:
    fail("head graph: expected exactly 1 node changed")
gen_head_after = json.dumps([x for x in head_graph["@graph"] if isinstance(x, dict) and x.get("@id") == GENERIC][0], sort_keys=True)
if gen_head_before != gen_head_after:
    fail("head graph: GENERIC transloading node changed — must stay untouched")
html = html[:hbody_start] + json.dumps(head_graph, indent=2, ensure_ascii=False) + html[hbody_end:]
print("head graph: winchester node upgraded in place (25 nodes, url added + full 682-char description); generic node byte-identical")

def div_span(text, did):
    s = text.find(f'<div class="page" id="{did}"')
    if s < 0:
        fail(f"div not found: {did}")
    nxt = text.find('<div class="page" id="', s + 10)
    foot = text.find("<footer", s)
    e = min(x for x in (nxt, foot) if x > 0)
    return s, e

# 4b. Transloading div: append the datasets JSON-LD block before the div close
s, e = div_span(html, "page-transloading-winchester-va")
seg = html[s:e]
if "#dataset-transloading-winchester" in seg:
    fail("transloading div already carries a datasets block")
if seg.count('<script type="application/ld+json">') != 0:
    fail("transloading div unexpectedly carries an ld+json block already")
tail_anchor = "</section>\n</div>"
if seg.count(tail_anchor) != 1:
    fail(f"transloading div tail anchor count {seg.count(tail_anchor)} != 1")
block = ('</section>\n  <script type="application/ld+json">\n' + datasets_txt.rstrip("\n") + '\n  </script>\n</div>')
seg = seg.replace(tail_anchor, block, 1)
mm = re.search(r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>', seg, re.S)
if not mm or json.loads(mm.group(1))["@graph"] != datasets_obj["@graph"]:
    fail("in-div JSON-LD not parse-equal to datasets-transloading-winchester.json")
html = html[:s] + seg + html[e:]
print("transloading div: datasets JSON-LD block appended (parse-equal to datasets-transloading-winchester.json)")

# 4c. Developer card after the IT data card
TW_CARD = ('<article class="card"><h3>Transloading — Winchester data</h3><p><a href="/datasets-transloading-winchester.json" target="_blank" rel="noopener">'
           '<b>datasets-transloading-winchester.json →</b></a> — 8 published nodes about Winchester transloading, extending the ocean container datasets, from both branches, never merged: '
           '4 as Datasets (CC BY 4.0) — cross-dock, deconsolidation &amp; restack operations, container equipment reference (domain reference only; no handled type claimed), '
           'port chain &amp; corridor dispatch, service areas, dispatch &amp; quote path; '
           '2 as Service data — Winchester transload operations, handling, protection &amp; compliance boundaries; '
           '2 as Articles — commercial terms &amp; cost avoidance (container jobs are quoted per job; every other figure labeled domain education), buyer personas &amp; trigger events. '
           'Hub page: <a href="/transloading-winchester-va/">Transloading Services — Winchester VA</a> · Hub JSON: '
           '<a href="/transloading-winchester-va.json" target="_blank" rel="noopener"><b>transloading-winchester-va.json →</b></a> · Ocean datasets: '
           '<a href="/datasets-ocean-container.json" target="_blank" rel="noopener"><b>datasets-ocean-container.json →</b></a>.</p></article>')
s, e = div_span(html, "page-developer")
seg = html[s:e]
anchor = '<b>it-equipment-moving-data-center-logistics-services-virginia.json →</b></a>.</p></article>'
if seg.count(anchor) != 1:
    fail("developer IT-card anchor not unique")
if "datasets-transloading-winchester.json" in seg:
    fail("developer transloading card already present")
seg = seg.replace(anchor, anchor + TW_CARD, 1)
html = html[:s] + seg + html[e:]
print("developer: Transloading — Winchester data card inserted after IT data card")
router_audit(html, "post-build index")
idx_path.write_text(html, encoding="utf-8")
(PUB / "datasets-transloading-winchester.json").write_text(datasets_txt, encoding="utf-8")
print("index.html + datasets-transloading-winchester.json written")

# ---------- 4d. Q15: ocean datasets live-serving fix ----------
import hashlib
ocean_bytes = OCEAN_SRC.read_bytes()
blob = hashlib.sha1(b"blob " + str(len(ocean_bytes)).encode() + b"\0" + ocean_bytes).hexdigest()
if blob != "c208450e8f57318a8fb3236e85b8a396d4418f50":
    fail(f"ocean source blob drift: {blob}")
od = json.loads(ocean_bytes)
if len(od.get("@graph", [])) != 8 or any(n.get("@type") != "Dataset" for n in od["@graph"]):
    fail("ocean source shape drift (expected 8 Dataset nodes)")
(PUB / "datasets-ocean-container.json").write_bytes(ocean_bytes)
print("Q15: datasets-ocean-container.json placed in public/ byte-identical to the ai-repo published copy (blob c208450e…) — 8 Dataset nodes, now serves live")

# ---------- 5. ai-sitemap (public): winchester description + package keywords ----------
ai_path = PUB / "ai-sitemap.json"
ai_raw = ai_path.read_text(encoding="utf-8")
ai = json.loads(ai_raw)
if json.dumps(ai, indent=2, ensure_ascii=False) != ai_raw.rstrip("\n"):
    fail("ai-sitemap not byte-stable at indent 2")
if len(ai["services"]) != 23 or len(ai["hasPart"]) != 155 or len(ai["keywords"]) != 60:
    fail(f"ai-sitemap baseline drift: {len(ai['services'])}/{len(ai['hasPart'])}/{len(ai['keywords'])}")
svc_entry = [x for x in ai["services"] if x.get("name") == "Transloading Services — Winchester VA"]
if len(svc_entry) != 1:
    fail("ai-sitemap winchester entry count != 1")
if len(svc_entry[0].get("description", "")) != 347:
    fail("ai-sitemap winchester description baseline drift")
svc_entry[0]["description"] = DESC
kw_before = list(ai["keywords"])
added = []
for kw in ["transloading winchester va", "transloading services virginia",
           "transloading virginia port container", "container unloading winchester va",
           "virginia inland port transloading", "port of virginia container services"]:
    if kw not in ai["keywords"]:
        ai["keywords"].append(kw)
        added.append(kw)
if not set(kw_before) <= set(ai["keywords"]):
    fail("a keyword was dropped")
ai_path.write_text(json.dumps(ai, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"ai-sitemap: winchester description -> full package description; keywords 60 -> {len(ai['keywords'])} (+{added}; none dropped)")

# ---------- 6. llms.txt (public): winchester line refresh + dated entry ----------
llms_path = PUB / "llms.txt"
llms = llms_path.read_text(encoding="utf-8")
OLD_LINE = ("- [Transloading Services — Winchester VA](https://theflatratemovers.com/transloading-winchester-va/): Transloading services from Winchester, VA: "
            "ocean containers unloaded, counted, sorted, and restacked into domestic equipment for the inland leg, with cross-docking, deconsolidation, "
            "warehouse staging, and final-mile delivery, through the Virginia Inland Port and Port of Virginia chain. Quoted per job, flat rate agreed in writing before dispatch.")
NEW_LINE = ("- [Transloading Services — Winchester VA](https://theflatratemovers.com/transloading-winchester-va/): " + DESC +
            " Datasets W-D1–W-D8 (CC BY 4.0), extending the ocean container datasets D1–D8: Winchester transload operations; cross-dock, deconsolidation & restack operations; "
            "container equipment reference (domain reference only — no handled type is claimed); port chain & corridor dispatch (port-system level only — no terminal or ramp named); "
            "commercial terms & cost avoidance (quoted per job is the only company pricing term for this service; everything else labeled domain education); "
            "buyer personas & trigger events; handling, protection & compliance boundaries; service areas, dispatch & quote path. "
            "Full datasets: https://theflatratemovers.com/datasets-transloading-winchester.json · Hub JSON: https://theflatratemovers.com/transloading-winchester-va.json · Ocean container datasets: https://theflatratemovers.com/datasets-ocean-container.json")
llms = rep(llms, OLD_LINE, NEW_LINE, scope="llms winchester line")
LLMS_ENTRY = (
    "## Update — 2026-10-29 (Winchester transloading deep refresh)\n"
    "- Transloading Services — Winchester VA node completed in both machine graphs and the head graph (same @id #service-transloading-winchester-va, exactly one node per graph): hub url added where missing and the full description carried everywhere; Place chain at the full footprint (Winchester 31 areas, Martinsburg 35) unchanged; counts unchanged at 155 pages and 23 services. The generic transloading node is untouched, and the live Winchester page copy is unchanged — this is a node and data refresh for a page already live.\n"
    "- Winchester transloading datasets W-D1–W-D8 published at https://theflatratemovers.com/datasets-transloading-winchester.json (8 nodes: 4 Datasets under CC BY 4.0, 2 Service, 2 Articles; dateModified 2026-10-29), extending the ocean container datasets D1–D8, with page-level markup on the transloading-winchester-va page and a Developer-page collection entry. Per-page JSON refreshed to the same canonical node with its expanded branch footprints preserved: https://theflatratemovers.com/transloading-winchester-va.json\n"
    "- The ocean container datasets D1–D8 now serve as JSON on the live domain at https://theflatratemovers.com/datasets-ocean-container.json — the address previously returned the site page; the file is byte-identical to the copy published in the machine-readable repository.\n"
    "- Company pricing for Winchester transloading is quoted per job only — no per-container rate, no weight-based container rate, and no fee schedule is published; every figure in the datasets beyond that is labeled domain education. Gated facts stay unpublished and are named in the datasets as explicit non-claims: no named terminal or ramp; no TWIC credential status; no drayage performer or chassis source; no refrigerated, bonded, free-trade-zone, or customs scope; no equipment list; no flat-rack or out-of-gauge scope; no handled container type list.\n")
if "Winchester transloading deep refresh" in llms:
    fail("llms winchester entry already present")
if not llms.endswith("\n"):
    llms += "\n"
llms += "\n" + LLMS_ENTRY
llms_path.write_text(llms, encoding="utf-8")
print("llms.txt: winchester service line refreshed + dated entry appended")

# ---------- 7. data txt: dated entry appended ----------
data_path = PUB / "the-flat-rate-movers-data.txt"
dtxt = data_path.read_text(encoding="utf-8")
DATA_ENTRY = (
    "## Update 2026-10-29 — Winchester transloading deep refresh\n"
    "- Canonical #service-transloading-winchester-va Service node completed in both machine graphs and the head graph (one node per graph, hub url https://theflatratemovers.com/transloading-winchester-va/, full description, Place chain at the full footprint 31/35, branches distinct). The generic #service-transloading node is untouched. No new page; counts unchanged (155 pages, 23 services).\n"
    "- Winchester transloading datasets W-D1–W-D8 published as JSON-LD at https://theflatratemovers.com/datasets-transloading-winchester.json (8 nodes: 4 Datasets under CC BY 4.0, 2 Service, 2 Articles; dateModified 2026-10-29), extending the ocean container datasets D1–D8, with page-level markup on the transloading-winchester-va page and a Developer-page collection entry. Per-page JSON: https://theflatratemovers.com/transloading-winchester-va.json (Service node refreshed to the canonical node, expanded branch footprints preserved).\n"
    "- Ocean container datasets D1–D8 now serve as JSON on the live domain: https://theflatratemovers.com/datasets-ocean-container.json (byte-identical to the copy published in the machine-readable repository; the address previously returned the site page).\n"
    "- The only company pricing term for Winchester transloading is quoted per job, agreed in writing before dispatch; no per-container or weight-based container rate and no fee schedule is published. Demurrage, detention, free-time, chassis, and FMC material in the datasets is labeled domain education, never a company price or term; gated scope items (named terminals or ramps, TWIC credential status, drayage performer, chassis source, reefer, bonded/FTZ, customs, equipment, flat-rack/OOG, handled container types) are named as unpublished, not claimed.\n")
if "Winchester transloading deep refresh" in dtxt:
    fail("data txt winchester entry already present")
if not dtxt.endswith("\n"):
    dtxt += "\n"
dtxt += "\n" + DATA_ENTRY
data_path.write_text(dtxt, encoding="utf-8")
print("data txt: dated entry appended")

# ---------- 8. Rubric DB: service row refresh + attestation rows ----------
con = sqlite3.connect(DB)
con.execute("UPDATE service SET description=? WHERE service_id=?", (DESC, SVC))
if con.total_changes != 1:
    fail(f"service row update touched {con.total_changes} rows")
rows = [
    ("Transloading Winchester canonical node completed: #service-transloading-winchester-va upgraded in place in the head graph, entity graph and best graph — exactly one node per graph — gaining the hub url https://theflatratemovers.com/transloading-winchester-va/ in the entity and head graphs (the best graph already carried it) and the full 682-character package description everywhere; Place chain to #winchester / #martinsburg at the full footprint 31/35 unchanged; the generic #service-transloading node is byte-identical in every graph",
     "Transloading Winchester deep package 2026-10-29 (schema.json, merge-note.md)", DATE,
     "public/index.html (head graph); public/entity-graph.json; public/best-json-entity-graph.json"),
    ("Winchester transloading datasets W-D1-W-D8 published: datasets-transloading-winchester.json, 8 nodes (4 Dataset CC BY 4.0, 2 Service, 2 Article) extending the ocean container datasets D1-D8, page-level markup on the transloading-winchester-va page, Developer-page collection entry, dateModified 2026-10-29; the only company pricing term in the datasets is quoted per job, agreed in writing before dispatch — no per-container rate, no weight-based container rate, no fee schedule; demurrage, detention, free-time, chassis and FMC material is labeled domain education; gated facts (named terminals or ramps, TWIC credential status, drayage performer, chassis source, reefer, bonded/FTZ, customs, equipment list, flat-rack/OOG scope, handled container types) remain unpublished and unclaimed, named in the datasets as explicit non-claims",
     "transloading-winchester-deep-datasets-2026-10-29.md section 6 (W-D1-W-D8)", DATE,
     "public/datasets-transloading-winchester.json"),
    ("Transloading Winchester per-page JSON refreshed in place: the live transloading-winchester-va.json Service node was replaced with the canonical #service-transloading-winchester-va node (full 682-character description, hub url) while the file's expanded branch Place nodes (Winchester 31 areas, Martinsburg 35) were preserved unchanged — no footprint shrink; Organization and BreadcrumbList nodes untouched",
     "Transloading Winchester deep package merge-note + live-state comparison 2026-10-29", DATE,
     "public/transloading-winchester-va.json"),
    ("Ocean container datasets live-serving fixed (package merge question Q15, decided in this merge): datasets-ocean-container.json — the D1-D8 ocean container datasets published in the machine-readable repository since deploy batch 1 — is now served on the live domain as application/json at https://theflatratemovers.com/datasets-ocean-container.json, byte-identical to the repository copy (git blob c208450e8f57318a8fb3236e85b8a396d4418f50); before this batch the address returned the site page (SPA fallback), so the ocean datasets were never live-domain JSON until now",
     "Transloading Winchester deep package merge-note section 8 Q15 + live serving checks 2026-10-29", DATE,
     "public/datasets-ocean-container.json"),
]
con.executemany("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?,?,?,?)", rows)
con.commit()
after = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
         for t in ["service", "attestation", "edge", "opening_hours", "service_area", "rubric_check"]}
integ = con.execute("PRAGMA integrity_check").fetchone()[0]
con.close()
if after["attestation"] != 107 or after["service"] != 32 or integ != "ok":
    fail(f"DB after-state wrong: {after}, integrity {integ}")
print(f"rubric DB: service row description -> canonical; +4 attestation rows (103 -> 107); counts {after}; integrity ok")

# ---------- 9. Forbidden scans over every NEW published block + index deltas ----------
NEW_BLOCKS = {"datasets file": datasets_txt, "developer card": TW_CARD,
              "llms service line": NEW_LINE, "llms dated entry": LLMS_ENTRY,
              "data txt dated entry": DATA_ENTRY, "package description": DESC}
for label, blob in NEW_BLOCKS.items():
    low = blob.lower()
    for bad in ["flat quote", "usdot", "spearman", "around town", "design 6", "attest", "lorem", "todo", "tbd",
                "subcontract", "crew page", "temp labor", "cwt", "$"]:
        if bad in low:
            fail(f"forbidden string {bad!r} in NEW block [{label}]")
    if re.search(r"MC-\d{4,}", blob):
        fail(f"MC number pattern in NEW block [{label}]")
html_after = idx_path.read_text(encoding="utf-8")
for pat in ["attest", "USDOT", "Spearman", "Around Town", "DESIGN 6", "Bristow", "subcontract"]:
    a, b = html_before.lower().count(pat.lower()), html_after.lower().count(pat.lower())
    if a != b:
        fail(f"index-wide delta for {pat!r}: {a} -> {b}")
print("forbidden scans: zero in all new published blocks (incl. zero CWT, zero $); index-wide deltas all 0")
print("BUILD OK")
