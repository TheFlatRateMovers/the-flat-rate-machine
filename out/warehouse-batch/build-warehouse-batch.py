#!/usr/bin/env python3
"""Warehouse Relocation deep refresh deploy batch — 2026-10-29.
Reconciles the warehouse-deep package against CURRENT live state (post-senior):
canonical #service-warehouse-relocation node completed in head + entity + best
(url added where missing; full 661-char package description everywhere; Place
chain at the full 31/35 footprint preserved), per-page JSON Service node
refreshed to canonical (expanded Place nodes preserved), datasets-warehouse.json
created under the RETYPE rule, Developer card, ai-sitemap refresh + keywords,
llms/data-txt dated entries, DB attestation rows.
Counts unchanged: pages 155 / services 23 / sitemap 155.
"""
import json, re, shutil, sqlite3, sys
from pathlib import Path

HOME = Path.home()
PUB = HOME / "workspace/the-flat-rate-movers-pages/public"
MACHINE = HOME / "workspace/the-flat-rate-machine"
FLAT = HOME / "workspace/theflatratemovers"
PKG = MACHINE / "out/pages/warehouse-deep"
BATCH = MACHINE / "out/warehouse-batch"
BACKUP = BATCH / "backup-2026-10-29"
DB = FLAT / "rubric.db"
DATE = "2026-10-29"
SVC = "https://theflatratemovers.com/#service-warehouse-relocation"
HUB = "https://theflatratemovers.com/warehouse-relocation/"
ORG = "https://theflatratemovers.com/#organization"

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
if len(DESC) != 661:
    fail(f"package description drift: {len(DESC)} chars != 661")
if pkg_svc.get("url") != HUB or pkg_svc.get("name") != "Warehouse Relocation" or pkg_svc.get("serviceType") != "Warehouse Relocation":
    fail("package canonical node fields drift")
CANON_KEYS = ["@id", "@type", "areaServed", "description", "name", "provider", "serviceType", "url"]
CANON = {k: pkg_svc[k] for k in CANON_KEYS}

# ---------- 0. Backups + preconditions ----------
BACKUP.mkdir(parents=True, exist_ok=True)
for src, name in [
    (PUB / "index.html", "index.html"), (PUB / "ai-sitemap.json", "pub-ai-sitemap.json"),
    (PUB / "llms.txt", "pub-llms.txt"), (PUB / "the-flat-rate-movers-data.txt", "pub-data.txt"),
    (PUB / "entity-graph.json", "pub-entity-graph.json"), (PUB / "best-json-entity-graph.json", "pub-best.json"),
    (PUB / "warehouse-relocation.json", "pub-warehouse-relocation.json"),
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

if (PUB / "datasets-warehouse.json").exists():
    fail("datasets-warehouse.json already exists — expected creation")
if (PUB / "dataset-node.json").exists():
    fail("held dataset-node.json present in public/ — must never ship")

def load_graph(path):
    raw = path.read_text(encoding="utf-8")
    d = json.loads(raw)
    if json.dumps(d, indent=2, ensure_ascii=False) != raw.rstrip("\n"):
        fail(f"{path.name} not byte-stable at indent 2")
    return d

def svc_nodes(d):
    return [n for n in d["@graph"] if isinstance(n, dict) and n.get("@id") == SVC]

eg = load_graph(PUB / "entity-graph.json")
bg = load_graph(PUB / "best-json-entity-graph.json")
if len(eg["@graph"]) != 33 or len(bg["@graph"]) != 80:
    fail(f"graph baselines wrong: entity {len(eg['@graph'])}, best {len(bg['@graph'])}")
if len(svc_nodes(eg)) != 1 or len(svc_nodes(bg)) != 1:
    fail("warehouse node count in machine graphs != 1")
for d, lbl in ((eg, "entity"), (bg, "best")):
    places = {n["@id"].split("#")[-1]: len(n.get("areaServed", [])) for n in d["@graph"] if n.get("@type") == "Place"}
    if places != {"winchester": 31, "martinsburg": 35}:
        fail(f"{lbl} Place footprint drift: {places}")
en, bn = svc_nodes(eg)[0], svc_nodes(bg)[0]
if "url" in en:
    fail("entity warehouse node unexpectedly already carries url")
if bn.get("url") != HUB:
    fail("best warehouse node url drift")
if len(en.get("description", "")) != 524 or len(bn.get("description", "")) != 524:
    fail("machine-graph warehouse description baseline drift (expected the 524-char pre-refresh text)")

# per-page JSON: byte-stable, Service node present once, Places expanded 31/35 (newer than staged schema)
pp_raw = (PUB / "warehouse-relocation.json").read_text(encoding="utf-8")
pp = json.loads(pp_raw)
if json.dumps(pp, indent=2, ensure_ascii=False) != pp_raw.rstrip("\n"):
    fail("warehouse-relocation.json not byte-stable at indent 2")
pp_svc = svc_nodes(pp)
if len(pp_svc) != 1:
    fail("per-page warehouse Service node count != 1")
pp_places = {n["@id"].split("#")[-1]: len(n.get("areaServed", [])) for n in pp["@graph"] if n.get("@type") == "Place"}
if pp_places != {"winchester": 31, "martinsburg": 35}:
    fail(f"per-page Place footprint drift: {pp_places}")

con = sqlite3.connect(DB)
base = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        for t in ["service", "attestation", "edge", "opening_hours", "service_area", "rubric_check"]}
if base != {"service": 32, "attestation": 96, "edge": 40, "opening_hours": 14, "service_area": 66, "rubric_check": 7}:
    fail(f"DB baseline drift: {base}")
if con.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
    fail("DB integrity not ok")
canon = con.execute("SELECT COUNT(*) FROM service WHERE service_id LIKE '%#service-%'").fetchone()[0]
if canon != 23:
    fail(f"canonical service rows {canon} != 23")
if con.execute("SELECT COUNT(*) FROM service WHERE service_id=?", (SVC,)).fetchone()[0] != 1:
    fail("canonical warehouse service row missing or duplicated")
con.close()

# router audit on CURRENT index (standing gate): pageMeta keys (both syntaxes) == router array set
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

# ---------- 1. datasets-warehouse.json (D1-D8 under the RETYPE rule) ----------
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
    n = {"@id": f"https://theflatratemovers.com/#dataset-warehouse-{slug}", "@type": typ,
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
    node("operations", "Service", "Warehouse Relocation Operations",
         "Warehouse relocation operations: warehouse and distribution moves, warehouse load-outs, inbound unloads, transload staging, and restacking, run by trained, supervised, self-managed moving and warehouse teams that support contractors and project managers — a project-support service, not day-hire labor and not a labor listing. The work is planned around the site itself: access, floor space, staging, and equipment handling. Pricing basis, as published: quoted per job and agreed before dispatch, with no required contract duration, adjustable for scope, equipment, travel, and after-hours work agreed before dispatch. Standard Job Pricing, verbatim: Unload $8.00/CWT; Load $10.00/CWT; APU $12.00/CWT; Residential/Driver Meet $400–$425 per man. Deployment needs served, as published on the industrial page: planned, overflow, peak, weekend, vacation, and emergency. Markets served: warehousing, manufacturing, transportation and logistics, retail distribution, 3PL, healthcare, commercial furniture dealers, corporate offices, general contractors, educational facilities, and hospitality and hotel renovations. Conditional: where a warehouse job actually involves a high-mass asset of 1,500 to 3,500 lbs, that asset moves under SIR Structural Integrity Relocation with floor deflection analysis to L/360, as part of the same flat-rate job — only where such an asset is actually involved. Not published and not claimed for warehouse relocation: any deployed-equipment list; drayage or chassis scope; bonded or free-trade-zone scope; refrigerated or cold-chain scope; customs scope; racking teardown or reinstall as a company service; a phasing offering; WMS or inventory-system integration; permits or engineering scope; debris or close-out scope.",
         ["warehouse relocation", "warehouse relocation services virginia", "warehouse load-outs", "inbound unloads", "warehouse moving company virginia", "industrial warehouse relocation"],
         {"provider": ORGREF, "publisher": ORGREF}),
    node("facility-access", "Dataset", "Facility & Access Operations",
         "Facility and access operations for warehouse relocation. Published site inputs: the job is scoped around the site itself — access, floor space, staging, and equipment handling. Dispatch network: the Winchester, VA and Martinsburg, WV branches, along the I-81, I-66, and I-70 corridors, across the Shenandoah Valley and the Eastern Panhandle. Facility types seen across the market, labeled domain context: distribution centers and 3PL facilities; manufacturing warehouses; retail and e-commerce fulfillment sites; cold and climate-controlled facilities; records, FF&E, and project staging space. Access inputs used in industry move planning, labeled domain only: dock times and access at both facilities; gate and security coordination; clearances; floor-loading realities; ceiling heights; power points; aisle widths for equipment; warehouse-system internet live on day one. Building-compliance topics from domain practice, labeled as such: high-piled storage permits; seismic permits (a California example); fire-code compliance on reinstall; anchor patterns around post-tension slab mapping; sprinkler and flue-space constraints. Beyond the published site inputs, no dock-scheduling, gate-coordination, clearance-survey, permit, or engineering offering is published or claimed for this company.",
         ["warehouse site survey", "warehouse dock access", "warehouse floor loading", "warehouse move planning"]),
    node("taxonomy", "Dataset", "Warehouse & Load Taxonomy",
         "Warehouse and load taxonomy. Load classes published by the company: warehouse and distribution moves; load-outs; inbound unloads; transload staging; restacking. Load classes seen across the market, labeled domain context: palletized inventory; cased and cartoned goods; racking and shelving systems; material-handling equipment; high-mass assets; hazard-classified goods, which follow their own rules and may require specialized carriers. Move types published by the company: full move; load-out; inbound unload; transload staging; restack; overflow, peak, and emergency deployment. Move-type vocabulary used across the industry, labeled domain only and not a company offering: phased zone moves; big-bang moves; wave moves; velocity-first moves; after-hours and weekend moves. Staging itself is published company scope; staging models — a staging area or overflow buffer between buildings, transload staging, wave staging by zone and destination area — are domain models. High-mass band, published: assets of 1,500 to 3,500 lbs move under the SIR conditional with floor deflection analysis to L/360, only where such an asset is actually involved. Cross-references only, never duplicated here: transloading, its own category with the ocean-container datasets; FF&E installation, its own category treatment; the SIR method, its own category treatment; storage, a separate service, never blurred with warehouse staging.",
         ["warehouse load-out", "warehouse restacking", "transload staging", "pallet racking relocation", "warehouse equipment moving"]),
    node("phasing-continuity", "Article", "Phasing Models & Continuity Operations",
         "Phasing models and continuity operations for warehouse relocation, published as industry education. Nothing in this dataset is a company offering: the company's published scope is warehouse work planned around the site, and no phasing, sequencing, continuity, or inventory-accuracy service is claimed. Phasing models used across the industry, labeled domain: a phased zone move, moving the building in zones; a big-bang move, everything at once, which industry guidance generally warns against; a wave move, sequenced non-critical stock first, then core SKUs, with equipment last; a velocity-first move, fastest-moving inventory prioritized; and after-hours or weekend moves that keep shipping days clear. The continuity workstream, labeled domain: customer communication that is proactive, specific, and early; scheduling the move around the busiest shipping days; a temporary storage or overflow buffer; backup procedures such as alternate carriers, manual pick lists, and fallback windows; daily check-ins during move week; predictability valued over perfection. Inventory continuity practice, labeled domain: a pre-move full audit and dead-stock purge through the warehouse system; tagged and counted waves mapped from the old location to the new; system locations updated wave by wave; post-move validation through spot checks, a first reconciling cycle count, re-slotting fast movers, updated procedures, and a post-move review. Downtime framing, attributed and domain only: an industry guide (ADSI, 2026) puts average unplanned downtime at $260,000 per hour across manufacturing sectors and frames one delayed shift as potentially exceeding the entire moving invoice — an attributed industry claim, never a company figure and never a downtime guarantee. Timeline guidance, labeled domain: heavy equipment and racking scheduling runs three to six months out; the move week runs in waves; the following week stabilizes and the week after optimizes — planning guidance, never a company lead-time promise.",
         ["phased warehouse move", "warehouse move without downtime", "warehouse inventory continuity", "warehouse move checklist", "minimize warehouse downtime"],
         {"headline": "Phasing Models & Continuity Operations", "author": ORGREF, "publisher": ORGREF}),
    node("terms", "Article", "Commercial Terms & Cost Drivers",
         "Commercial terms and cost drivers for warehouse relocation. The company's pricing is exact and complete as published — Standard Job Pricing, verbatim: Unload $8.00/CWT; Load $10.00/CWT; APU $12.00/CWT; Residential/Driver Meet $400–$425 per man, quoted per job, adjustable for scope, equipment, travel, and after-hours work agreed before dispatch, with no required contract duration. The quote path: the main button reads 'Get My Flat Rate Quote' and the pill button 'Get a flat rate quote'; the Short (Quick Quote) form is the default and the Detailed Project form switches in place, preserving the From, To, and What's moving entries. The framing is one flat price agreed before dispatch, with no hourly clock, ever: 'Guaranteed Flat Rate or Your Move is Free!' Everything beyond this paragraph is labeled domain education from published industry sources, never this company's prices. 3PL storage rates, 2026 survey averages (Fulfillment Advisor; Buske 3PL guide): $19.37 per pallet per month ($18–$25 typical); $0.45–$0.46 per cubic foot per month; $1.26–$1.73 per square foot per month; pallet in/out handling $3.50–$12; case pick $0.40–$1.50 — storage rates, not relocation project rates. Racking costs, labeled domain (Lehigh Valley racking guide): $50–$120 per pallet position installed for standard selective racking including engineering, permits, and anchoring, so a 1,000-position warehouse runs about $50,000–$120,000 installed, with used racking at 40–60% less material cost — racking installation is not a published company service. Downtime framing, attributed: an ADSI industry guide puts average unplanned downtime at $260,000 per hour across manufacturing sectors; the same domain sources name geography as the single biggest warehousing pricing lever and record fixed written quotes after a site visit as standard domain practice. Domain cost drivers: volume or weight or cubic footage; climate control; duration; location and geography; labor rates; real-estate rates; and scope — whose scope, equipment, travel, and after-hours adjusters are the same four the company publishes for its own schedule, an overlap noted here, not stretched into a price model.",
         ["warehouse relocation cost", "warehouse moving pricing", "flat rate warehouse move", "warehouse load-out pricing", "cwt warehouse pricing"],
         {"headline": "Commercial Terms & Cost Drivers", "author": ORGREF, "publisher": ORGREF}),
    node("personas", "Article", "Buyer Personas & Trigger Events",
         "Buyer personas and trigger events for warehouse relocation. The audience, from the company's published industrial and warehouse pages: warehouse operators and managers; distribution and 3PL operations teams; manufacturers; project managers; contractors; operations buyers; distributors; and retail and e-commerce fulfillment operators. Markets the company publishes for its project-support work: warehousing, manufacturing, transportation and logistics, retail distribution, 3PL, healthcare, commercial furniture dealers, corporate offices, general contractors, educational facilities, and hospitality and hotel renovations. Buying criteria, ranked as domain analysis from industry sources and labeled as such — not a company claim: first, downtime and continuity, that orders keep shipping through the move; second, inventory accuracy, that the count reconciles; third, sequence accountability, one plan and one price agreed before dispatch; fourth, price certainty, a flat price rather than an hourly clock. Trigger events, labeled domain context: a lease ending; expansion into a bigger building or a new racking plan with a peak-tied go-live; consolidation of facilities; new premises, where the layout is fixed rather than copied; a change of 3PL; and renovation or re-slotting of the existing space. No trigger event is published as tied to this company's warehouse service specifically; the triggers stand as market context for the buyers above.",
         ["warehouse relocation company virginia", "warehouse move project manager", "3pl warehouse relocation", "warehouse consolidation move"],
         {"headline": "Buyer Personas & Trigger Events", "author": ORGREF, "publisher": ORGREF}),
    node("protection-compliance", "Service", "Inventory, Protection & Building Compliance",
         "Inventory, protection, and building compliance for warehouse relocation. Published company scope: the work is carried out by supervised warehouse teams and planned around the site — access, floor space, staging, and equipment handling — and, conditionally, a high-mass asset of 1,500 to 3,500 lbs moves under SIR with floor deflection analysis to L/360 where such an asset is actually involved. Everything beyond this paragraph is labeled domain practice from published industry sources, not this company's published warehouse offering. Domain protection practice: blanket-wrapping furniture and equipment; boxing mirrors and art; covering mattresses and upholstery; palletizing and cartoning with labels by location; dismantling racking in a documented sequence, labeled by bay; and plumb, level, and anchor checks on reinstall — racking teardown and reinstall scope is not published for this company. Domain inventory discipline: numbered tags with condition noted at load-in; counts by zone and destination area; warehouse-system location updates wave by wave; release checked against the same inventory; and a post-move cycle count with spot checks. Domain building compliance: dock scheduling at both buildings; floor-loading realities surveyed before pricing; high-piled storage permits; seismic and fire-code compliance on reinstall; anchor patterns set around post-tension slab mapping; and sprinkler and flue-space constraints. Hazard-classified goods follow their own rules and may require specialized carriers; whether this company accepts them is not published. No compliance, permit, engineering, or certification claim is published for warehouse relocation.",
         ["warehouse inventory accuracy move", "warehouse racking reinstall", "warehouse move safety", "warehouse floor loading"],
         {"provider": ORGREF, "publisher": ORGREF}),
    node("areas-quote", "Dataset", "Service Areas, Dispatch & Quote Path",
         "Service areas, dispatch, and quote path for warehouse relocation. Two branches, always distinct. Winchester: The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester, VA 22601, geo 39.18711576, -78.1668352, hours Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google rating 5.0 from 1 review. Martinsburg: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404, geo 39.48319665, -77.94760443, hours Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google rating 4.7 from 6 reviews. Published Google Business service areas: Winchester 16 areas, Martinsburg 14, the lists carried on the two branch Place nodes. Full footprint: Winchester 31 areas, Martinsburg 35, with 14 shared and 52 GeoJSON features in total; Moorefield 26836 is served by both branches. Dispatch runs from both branches along the I-81, I-66, and I-70 corridors across the Shenandoah Valley and the Eastern Panhandle. Quote path: the main button reads 'Get My Flat Rate Quote' and the pill button 'Get a flat rate quote'; the Short (Quick Quote) form is the default and the Detailed Project form switches in place, preserving the From, To, and What's moving entries; where a walkthrough fits, the survey room is film-only and the estimate that follows is human-made, never auto-priced. There is one two-branch warehouse page by design — the search intent is Virginia-wide — and no branch warehouse pages.",
         ["warehouse relocation winchester va", "warehouse relocation martinsburg wv", "warehouse movers shenandoah valley", "warehouse movers eastern panhandle"]),
]
datasets_obj = {"@context": "https://schema.org", "@graph": nodes}
datasets_txt = json.dumps(datasets_obj, indent=2, ensure_ascii=False) + "\n"
from collections import Counter
split = Counter(n["@type"] for n in nodes)
if split != {"Dataset": 3, "Service": 2, "Article": 3}:
    fail(f"retype split wrong: {split}")
for n in nodes:
    if not (50 <= len(n["description"]) < 5000):
        fail(f"description length out of band: {n['@id']} {len(n['description'])}")
    if n["@type"] == "Dataset" and n["license"] != "https://creativecommons.org/licenses/by/4.0/":
        fail("Dataset license missing")
print("datasets-warehouse.json built: 8 nodes, split", dict(split))

# ---------- 2. Machine graphs: complete the canonical node in place ----------
def upgrade_graph_node(d, add_url):
    """Swap description to the canonical package text; append url (at the end,
    matching the best/per-page key order) only where missing. Key order otherwise preserved."""
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
    upgrade_graph_node(d, add_url)
    after = [json.dumps(x, sort_keys=True) for x in d["@graph"]]
    changed = sum(1 for a, b in zip(before, after) if a != b)
    if changed != 1:
        fail(f"{lbl}: {changed} nodes changed, expected exactly 1")
    txt = json.dumps(d, indent=2, ensure_ascii=False) + "\n"
    for path in [PUB / ("entity-graph.json" if lbl == "entity" else "best-json-entity-graph.json"),
                 MACHINE / "data" / ("entity-graph.json" if lbl == "entity" else "best-json-entity-graph.json"),
                 FLAT / ("entity-graph.json" if lbl == "entity" else "best-json-entity-graph.json")]:
        path.write_text(txt, encoding="utf-8")
    print(f"{lbl} graph: warehouse node completed in place (url {'added' if add_url else 'kept'} + 661-char description); all 3 copies byte-identical")

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
(PUB / "warehouse-relocation.json").write_text(json.dumps(pp, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("per-page warehouse-relocation.json: Service node refreshed to canonical; Place footprints 31/35 preserved")

# ---------- 4. index.html: head node + warehouse div datasets block + Developer card ----------
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
    fail("head warehouse node count != 1")
n = hwh[0]
if "url" in n:
    fail("head warehouse node unexpectedly already carries url")
if len(n.get("description", "")) != 425:
    fail(f"head warehouse description baseline drift: {len(n.get('description', ''))} != 425")
out = {}
for k, v in n.items():
    out[k] = DESC if k == "description" else v
    if k == "provider":
        out["url"] = HUB
canon_head = dict(out)
canon_head.pop("@type", None)
if {k: out[k] for k in CANON_KEYS if k in out} != {k: CANON[k] for k in CANON_KEYS if k in out} or out.get("url") != HUB or out.get("description") != DESC:
    fail("head warehouse upgrade incomplete")
head_graph["@graph"][head_graph["@graph"].index(n)] = out
html = html[:hbody_start] + json.dumps(head_graph, indent=2, ensure_ascii=False) + html[hbody_end:]
print("head graph: warehouse node upgraded in place (25 nodes, url added + full 661-char description)")

def div_span(text, did):
    s = text.find(f'<div class="page" id="{did}"')
    if s < 0:
        fail(f"div not found: {did}")
    nxt = text.find('<div class="page" id="', s + 10)
    foot = text.find("<footer", s)
    e = min(x for x in (nxt, foot) if x > 0)
    return s, e

# 4b. Warehouse div: append the datasets JSON-LD block before the div close
s, e = div_span(html, "page-warehouse-relocation")
seg = html[s:e]
if "#dataset-warehouse" in seg:
    fail("warehouse div already carries a datasets block")
if seg.count('<script type="application/ld+json">') != 0:
    fail("warehouse div unexpectedly carries an ld+json block already")
tail_anchor = "</section>\n</div>"
if seg.count(tail_anchor) != 1:
    fail(f"warehouse div tail anchor count {seg.count(tail_anchor)} != 1")
block = ('</section>\n  <script type="application/ld+json">\n' + datasets_txt.rstrip("\n") + '\n  </script>\n</div>')
seg = seg.replace(tail_anchor, block, 1)
mm = re.search(r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>', seg, re.S)
if not mm or json.loads(mm.group(1))["@graph"] != datasets_obj["@graph"]:
    fail("in-div JSON-LD not parse-equal to datasets-warehouse.json")
html = html[:s] + seg + html[e:]
print("warehouse div: datasets JSON-LD block appended (parse-equal to datasets-warehouse.json)")

# 4c. Developer card after the Senior data card
WH_CARD = ('<article class="card"><h3>Warehouse data</h3><p><a href="/datasets-warehouse.json" target="_blank" rel="noopener">'
           '<b>datasets-warehouse.json →</b></a> — 8 published nodes about the warehouse relocation service, from both branches, never merged: '
           '3 as Datasets (CC BY 4.0) — facility &amp; access operations, warehouse &amp; load taxonomy, service areas, dispatch &amp; quote path; '
           '2 as Service data — warehouse relocation operations, inventory, protection &amp; building compliance; '
           '3 as Articles — phasing models &amp; continuity operations (industry models published as education only; no phasing offering is claimed), '
           'commercial terms &amp; cost drivers (the verbatim CWT schedule is the only company pricing; domain figures labeled), buyer personas &amp; trigger events. '
           'Hub page: <a href="/warehouse-relocation/">Warehouse Relocation</a> · Hub JSON: '
           '<a href="/warehouse-relocation.json" target="_blank" rel="noopener"><b>warehouse-relocation.json →</b></a>.</p></article>')
s, e = div_span(html, "page-developer")
seg = html[s:e]
anchor = '<b>senior-moving.json →</b></a>.</p></article>'
if seg.count(anchor) != 1:
    fail("developer senior-card anchor not unique")
if "datasets-warehouse.json" in seg:
    fail("developer warehouse card already present")
seg = seg.replace(anchor, anchor + WH_CARD, 1)
html = html[:s] + seg + html[e:]
print("developer: Warehouse data card inserted after Senior data card")
router_audit(html, "post-build index")
idx_path.write_text(html, encoding="utf-8")
(PUB / "datasets-warehouse.json").write_text(datasets_txt, encoding="utf-8")
print("index.html + datasets-warehouse.json written")

# ---------- 5. ai-sitemap (public): warehouse description + package keywords ----------
ai_path = PUB / "ai-sitemap.json"
ai_raw = ai_path.read_text(encoding="utf-8")
ai = json.loads(ai_raw)
if json.dumps(ai, indent=2, ensure_ascii=False) != ai_raw.rstrip("\n"):
    fail("ai-sitemap not byte-stable at indent 2")
if len(ai["services"]) != 23 or len(ai["hasPart"]) != 155 or len(ai["keywords"]) != 49:
    fail(f"ai-sitemap baseline drift: {len(ai['services'])}/{len(ai['hasPart'])}/{len(ai['keywords'])}")
svc_entry = [x for x in ai["services"] if x.get("name") == "Warehouse Relocation"]
if len(svc_entry) != 1:
    fail("ai-sitemap warehouse entry count != 1")
if len(svc_entry[0].get("description", "")) != 425:
    fail("ai-sitemap warehouse description baseline drift")
svc_entry[0]["description"] = DESC
kw_before = list(ai["keywords"])
added = []
for kw in ["warehouse relocation services virginia", "warehouse moving company virginia",
           "warehouse load-outs", "inbound unloads", "industrial warehouse relocation"]:
    if kw not in ai["keywords"]:
        ai["keywords"].append(kw)
        added.append(kw)
if not set(kw_before) <= set(ai["keywords"]):
    fail("a keyword was dropped")
ai_path.write_text(json.dumps(ai, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"ai-sitemap: warehouse description -> full package description; keywords 49 -> {len(ai['keywords'])} (+{added}; none dropped)")

# ---------- 6. llms.txt (public): warehouse line refresh + dated entry ----------
llms_path = PUB / "llms.txt"
llms = llms_path.read_text(encoding="utf-8")
OLD_LINE = ("- [Warehouse Relocation](https://theflatratemovers.com/warehouse-relocation/): Flat-rate warehouse relocation from The Flat Rate Movers: "
            "warehouse and distribution moves, warehouse load-outs and inbound unloads, transload staging, and restacking, carried out by supervised "
            "warehouse teams and planned around the site — access, floor space, staging, and equipment handling. Standard Job Pricing: Unload $8.00/CWT, "
            "Load $10.00/CWT, APU $12.00/CWT, Residential/Driver Meet $400–$425 per man, quoted per job.")
NEW_LINE = ("- [Warehouse Relocation](https://theflatratemovers.com/warehouse-relocation/): " + DESC +
            " Datasets D1–D8 (CC BY 4.0): warehouse relocation operations; facility & access operations; warehouse & load taxonomy; "
            "phasing models & continuity operations (industry models published as education only — no phasing offering is claimed); "
            "commercial terms & cost drivers (the verbatim CWT schedule is the only company pricing; every other figure labeled domain education); "
            "buyer personas & trigger events; inventory, protection & building compliance; service areas, dispatch & quote path. "
            "Full datasets: https://theflatratemovers.com/datasets-warehouse.json · Hub JSON: https://theflatratemovers.com/warehouse-relocation.json")
llms = rep(llms, OLD_LINE, NEW_LINE, scope="llms warehouse line")
LLMS_ENTRY = (
    "## Update — 2026-10-29 (warehouse relocation deep refresh)\n"
    "- Warehouse Relocation node completed in both machine graphs and the head graph (same @id #service-warehouse-relocation, exactly one node per graph): hub url added where missing and the full description carried everywhere; Place chain at the full footprint (Winchester 31 areas, Martinsburg 35) unchanged; counts unchanged at 155 pages and 23 services. The live warehouse page copy is unchanged — this is a node and data refresh for a page already live.\n"
    "- Warehouse Relocation datasets D1–D8 published at https://theflatratemovers.com/datasets-warehouse.json (8 nodes: 3 Datasets under CC BY 4.0, 2 Service, 3 Articles; dateModified 2026-10-29), with page-level markup on the warehouse-relocation page and a Developer-page collection entry. Per-page JSON refreshed to the same canonical node with its expanded branch footprints preserved: https://theflatratemovers.com/warehouse-relocation.json\n"
    "- Company pricing in the datasets is the verbatim Standard Job Pricing only (Unload $8.00/CWT, Load $10.00/CWT, APU $12.00/CWT, Residential/Driver Meet $400–$425 per man); every other figure is labeled domain education. Gated warehouse facts stay unpublished: no equipment deployment, drayage or chassis, bonded or FTZ, reefer, customs, racking-install, phasing-offering, WMS-integration, permit or engineering, or debris claim is made.\n")
if "warehouse relocation deep refresh" in llms:
    fail("llms warehouse entry already present")
if not llms.endswith("\n"):
    llms += "\n"
llms += "\n" + LLMS_ENTRY
llms_path.write_text(llms, encoding="utf-8")
print("llms.txt: warehouse service line refreshed + dated entry appended")

# ---------- 7. data txt: dated entry appended ----------
data_path = PUB / "the-flat-rate-movers-data.txt"
dtxt = data_path.read_text(encoding="utf-8")
DATA_ENTRY = (
    "## Update 2026-10-29 — warehouse relocation deep refresh\n"
    "- Canonical #service-warehouse-relocation Service node completed in both machine graphs and the head graph (one node per graph, hub url https://theflatratemovers.com/warehouse-relocation/, full description, Place chain at the full footprint 31/35, branches distinct). No new page; counts unchanged (155 pages, 23 services).\n"
    "- Warehouse Relocation datasets D1–D8 published as JSON-LD at https://theflatratemovers.com/datasets-warehouse.json (8 nodes: 3 Datasets under CC BY 4.0, 2 Service, 3 Articles; dateModified 2026-10-29), with page-level markup on the warehouse-relocation page and a Developer-page collection entry. Per-page JSON: https://theflatratemovers.com/warehouse-relocation.json (refreshed to the canonical node, expanded branch footprints preserved).\n"
    "- The only company pricing in the datasets is the verbatim Standard Job Pricing (Unload $8.00/CWT; Load $10.00/CWT; APU $12.00/CWT; Residential/Driver Meet $400–$425 per man, quoted per job, no required contract duration). Phasing models, downtime framing, 3PL storage rates and racking costs appear only as labeled domain education from named industry sources, never as company prices, promises, or offerings; gated scope items (equipment, drayage, bonded/FTZ, reefer, customs, racking install, WMS, permits, debris) are named as unpublished, not claimed.\n")
if "warehouse relocation deep refresh" in dtxt:
    fail("data txt warehouse entry already present")
if not dtxt.endswith("\n"):
    dtxt += "\n"
dtxt += "\n" + DATA_ENTRY
data_path.write_text(dtxt, encoding="utf-8")
print("data txt: dated entry appended")

# ---------- 8. Rubric DB: attestation rows for newly published facts only ----------
con = sqlite3.connect(DB)
rows = [
    ("Warehouse Relocation canonical node completed: #service-warehouse-relocation upgraded in place in the head graph, entity graph and best graph — exactly one node per graph — gaining the hub url https://theflatratemovers.com/warehouse-relocation/ in the entity and head graphs (the best graph already carried it) and the full 661-character package description everywhere; Place chain to #winchester / #martinsburg at the full footprint 31/35 unchanged",
     "Warehouse Relocation deep package 2026-10-29 (schema.json, merge-note.md)", DATE,
     "public/index.html (head graph); public/entity-graph.json; public/best-json-entity-graph.json"),
    ("Warehouse Relocation datasets D1-D8 published: datasets-warehouse.json, 8 nodes (3 Dataset CC BY 4.0, 2 Service, 3 Article), page-level markup on the warehouse-relocation page, Developer-page collection entry, dateModified 2026-10-29; the only company pricing in the datasets is the verbatim Standard Job Pricing (Unload $8.00/CWT, Load $10.00/CWT, APU $12.00/CWT, Residential/Driver Meet $400-$425 per man); phasing models, downtime framing, 3PL storage rates and racking costs are labeled domain education from named industry sources, never company prices or offerings; gated warehouse facts (equipment deployment, drayage/chassis, bonded/FTZ, reefer, customs, racking install, phasing offering, WMS integration, permits/engineering, debris) remain unpublished and unclaimed",
     "warehouse-deep-datasets-2026-10-29.md section 6 (D1-D8)", DATE,
     "public/datasets-warehouse.json"),
    ("Warehouse Relocation per-page JSON refreshed in place: the live warehouse-relocation.json Service node was replaced with the canonical #service-warehouse-relocation node (full 661-character description) while the file's expanded branch Place nodes (Winchester 31 areas, Martinsburg 35) were preserved unchanged — no footprint shrink; Organization and BreadcrumbList nodes untouched",
     "Warehouse Relocation deep package merge-note section 6 + live-state comparison 2026-10-29", DATE,
     "public/warehouse-relocation.json"),
]
con.executemany("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?,?,?,?)", rows)
con.commit()
after = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
         for t in ["service", "attestation", "edge", "opening_hours", "service_area", "rubric_check"]}
integ = con.execute("PRAGMA integrity_check").fetchone()[0]
con.close()
if after["attestation"] != 99 or after["service"] != 32 or integ != "ok":
    fail(f"DB after-state wrong: {after}, integrity {integ}")
print(f"rubric DB: +3 attestation rows (96 -> 99); counts {after}; integrity ok")

# ---------- 9. Forbidden scans over every NEW published block + index deltas ----------
NEW_BLOCKS = {"datasets file": datasets_txt, "developer card": WH_CARD,
              "llms service line": NEW_LINE, "llms dated entry": LLMS_ENTRY,
              "data txt dated entry": DATA_ENTRY, "package description": DESC}
for label, blob in NEW_BLOCKS.items():
    low = blob.lower()
    for bad in ["flat quote", "usdot", "spearman", "around town", "design 6", "attest", "lorem", "todo", "tbd",
                "subcontract", "crew page", "temp labor"]:
        if bad in low:
            fail(f"forbidden string {bad!r} in NEW block [{label}]")
    if re.search(r"MC-\d{4,}", blob):
        fail(f"MC number pattern in NEW block [{label}]")
html_after = idx_path.read_text(encoding="utf-8")
for pat in ["attest", "USDOT", "Spearman", "Around Town", "DESIGN 6", "Bristow", "subcontract"]:
    a, b = html_before.lower().count(pat.lower()), html_after.lower().count(pat.lower())
    if a != b:
        fail(f"index-wide delta for {pat!r}: {a} -> {b}")
print("forbidden scans: zero in all new published blocks; index-wide deltas all 0")
print("BUILD OK")
