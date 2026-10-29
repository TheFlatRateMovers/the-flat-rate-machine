#!/usr/bin/env python3
"""Senior Moving deep refresh deploy batch — 2026-10-29.
Reconciles the senior-deep package against CURRENT live state (post-storage):
graphs upgraded in place (url + alternateName + full 713-char description),
datasets-senior.json created under the RETYPE rule, Developer card, ai-sitemap
refresh + 2 GSC keywords, llms/data-txt dated entries, DB attestation rows.
Counts unchanged: pages 155 / services 23 / sitemap 155.
"""
import json, re, shutil, sqlite3, sys
from pathlib import Path

HOME = Path.home()
PUB = HOME / "workspace/the-flat-rate-movers-pages/public"
MACHINE = HOME / "workspace/the-flat-rate-machine"
FLAT = HOME / "workspace/theflatratemovers"
PKG = MACHINE / "out/pages/senior-deep"
BATCH = MACHINE / "out/senior-batch"
BACKUP = BATCH / "backup-2026-10-29"
DB = FLAT / "rubric.db"
DATE = "2026-10-29"
SVC = "https://theflatratemovers.com/#service-senior-moving"
HUB = "https://theflatratemovers.com/senior-moving/"
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
ALT = pkg_svc["alternateName"]
if len(DESC) != 713 or ALT != "Senior Advocacy Logistics":
    fail(f"package description/alternateName drift: {len(DESC)} chars, {ALT!r}")

# ---------- 0. Backups + preconditions ----------
BACKUP.mkdir(parents=True, exist_ok=True)
for src, name in [
    (PUB / "index.html", "index.html"), (PUB / "ai-sitemap.json", "pub-ai-sitemap.json"),
    (PUB / "llms.txt", "pub-llms.txt"), (PUB / "the-flat-rate-movers-data.txt", "pub-data.txt"),
    (PUB / "entity-graph.json", "pub-entity-graph.json"), (PUB / "best-json-entity-graph.json", "pub-best.json"),
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

if (PUB / "datasets-senior.json").exists():
    fail("datasets-senior.json already exists — expected creation")
if (PUB / "dataset-node.json").exists():
    fail("held dataset-node.json present in public/ — must never ship")

def load_graph(path):
    raw = path.read_text(encoding="utf-8")
    d = json.loads(raw)
    if json.dumps(d, indent=2, ensure_ascii=False) != raw.rstrip("\n"):
        fail(f"{path.name} not byte-stable at indent 2")
    return d

def senior_nodes(d):
    return [n for n in d["@graph"] if isinstance(n, dict) and n.get("@id") == SVC]

eg = load_graph(PUB / "entity-graph.json")
bg = load_graph(PUB / "best-json-entity-graph.json")
if len(eg["@graph"]) != 33 or len(bg["@graph"]) != 80:
    fail(f"graph baselines wrong: entity {len(eg['@graph'])}, best {len(bg['@graph'])}")
if len(senior_nodes(eg)) != 1 or len(senior_nodes(bg)) != 1:
    fail("senior node count in machine graphs != 1")
for d, lbl in ((eg, "entity"), (bg, "best")):
    places = {n["@id"].split("#")[-1]: len(n.get("areaServed", [])) for n in d["@graph"] if n.get("@type") == "Place"}
    if places != {"winchester": 31, "martinsburg": 35}:
        fail(f"{lbl} Place footprint drift: {places}")
con = sqlite3.connect(DB)
base = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        for t in ["service", "attestation", "edge", "opening_hours", "service_area", "rubric_check"]}
if base != {"service": 32, "attestation": 93, "edge": 40, "opening_hours": 14, "service_area": 66, "rubric_check": 7}:
    fail(f"DB baseline drift: {base}")
if con.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
    fail("DB integrity not ok")
canon = con.execute("SELECT COUNT(*) FROM service WHERE service_id LIKE '%#service-%'").fetchone()[0]
if canon != 23:
    fail(f"canonical service rows {canon} != 23")
if con.execute("SELECT COUNT(*) FROM service WHERE service_id=?", (SVC,)).fetchone()[0] != 1:
    fail("canonical senior service row missing or duplicated")
con.close()
print("preconditions ok: graphs 33/80 with footprints 31/35, DB", base)

# ---------- 1. datasets-senior.json (D1-D8 under the RETYPE rule) ----------
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
    n = {"@id": f"https://theflatratemovers.com/#dataset-senior-{slug}", "@type": typ,
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
    node("operations", "Service", "Senior Move Operations",
         "Senior move operations: a senior move run end to end as one accountable job. The published sequence: a quote request (Short Quick Quote by default, or the Detailed Project form, switchable in place with the From, To and What's moving entries preserved); an optional free film-only video-walkthrough survey, using the survey room's Senior prompt set — main living areas, bedroom and personal rooms, keepsakes and fragile items, one prompt per screen; a human-made estimate (never auto-priced); one flat price agreed in writing before move day, with no hourly clock, ever; packing support, including fragile items and keepsakes; the move itself; and close-out. The survey media stays private — never published, never emailed, never shared with third-party AI — and auto-deletes 24 hours after upload. No price, discount, deposit, or special offer is stated for senior moves: the page's FAQ says so directly. Where a senior move actually involves a high-mass asset of 1,500 to 3,500 lbs, that item moves under SIR Structural Integrity Relocation with floor deflection analysis to L/360, as part of the same flat-rate move — a conditional that applies only where such an asset is actually involved, never to senior moves as a class. The published record does not state whether every part of a senior move is performed by one provider's own supervised teams; that question is recorded as open in the research file and no claim is made either way. No crew-size or truck claim is published for senior moves.",
         ["senior moving", "senior movers near me", "senior relocation winchester va", "senior relocation martinsburg wv", "senior downsizing moving"],
         {"provider": ORGREF, "publisher": ORGREF}),
    node("transition-dwelling", "Dataset", "Transition & Dwelling Operations",
         "Transition and dwelling operations: the transition a senior move runs through, not just the truck. Transition types published on the senior page: downsizing; transitioning to assisted living; transitioning to independent living; relocating closer to family. Further motivations seen across the market, labeled domain context only: retirement-community moves, 55+ community moves, estate-settlement moves, and health-change-driven moves (a reason for moving, never a care claim). Destination classes: a smaller home, a 55+ community unit, an independent-living unit, an assisted-living unit. Domain pattern, labeled as such: the destination is usually smaller than the home left behind, so keep, family, donate, sell, and discard decisions dominate the job, and destination move-in dates drive the timeline backwards from the target date. Not published for this company and not claimed: coordination with facility or community staff on scheduling and access; a floor-plan or fit-analysis service for the new residence; multi-destination distribution to a new home, family members, and donation in one job. Building planning inputs seen in domain practice — elevator booking, parking, move-in windows, dock access, hallway protection — are listed as domain inputs only, not as company capabilities.",
         ["senior downsizing moving", "moving to assisted living", "senior relocation", "downsizing help seniors"]),
    node("taxonomy", "Dataset", "Senior Household & Keepsake Taxonomy",
         "Senior household and keepsake taxonomy: what actually moves in a senior move, by class. Classes published on the senior page: fragile items; keepsakes; and the general household goods that make up the move's contents. Keepsakes are the highest-trust class — irreplaceable and sentimental, judged on handling care — and the survey room's Senior prompts cover keepsakes and fragile items explicitly. Item classes seen across the market, labeled domain context: furniture including heirlooms and antiques, china collections, artwork, clothing and personal effects, books, photographs and documents, kitchen and household goods. Heavy class, published: a high-mass asset of 1,500 to 3,500 lbs moves under the SIR conditional described in the operations dataset; handling below or above that band is not published for senior moves. Medical class: none — no medical-device, care-equipment, or health-item class is claimed for senior moves; medical moving is a separate category, cross-referenced only. Sorting decisions (keep, family, donate, sell, discard — item by item, room by room, at the senior's pace) are domain move-manager practice; this company's sorting support is not published, and neither donation-pickup coordination nor estate-sale coordination is published or claimed.",
         ["senior keepsakes moving", "downsizing sorting help", "senior fragile items packing"]),
    node("dispatch-network", "Dataset", "Branch Dispatch Network",
         "Branch dispatch network for senior moves: two home bases, never blended. Winchester — The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601, geo 39.18711576, -78.1668352, hours Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google rating 5.0 from 1 review. Martinsburg — Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg WV 25404, geo 39.48319665, -77.94760443, hours Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google rating 4.7 from 6 reviews. Published Google Business service areas: Winchester 16 areas, Martinsburg 14 (the lists live on the two Place nodes). Full footprint: Winchester 31 areas, Martinsburg 35, with 14 shared — Moorefield, Front Royal, Strasburg, Woodstock, Warren County, Shenandoah County, Hardy County, Port of Virginia, Virginia Inland Port, Shenandoah Valley, Eastern Panhandle of West Virginia, and the Interstate 81, Interstate 66, and Interstate 70 corridors — 52 GeoJSON features in total. Corridor names describe the coverage pool; they are not a claim that a listed town sits on a particular highway. Dispatch rule: both bases dispatch across the region, Winchester serving the Valley side and Martinsburg the Eastern Panhandle side, overlapping at Moorefield; the quote form settles which base and route fit the move. There are no senior branch pages by design: one two-branch page carries the generic senior intent.",
         ["senior moving winchester va", "senior movers martinsburg wv", "senior relocation shenandoah valley", "senior movers eastern panhandle"]),
    node("terms", "Article", "Commercial Terms & Cost Drivers",
         "Commercial terms and cost drivers for senior moving. The company's terms are few and exact: one flat price agreed in writing before move day; no hourly clock, ever; and no senior price, discount, deposit, or fee published — the page FAQ states directly that no special senior price or discount is offered. Everything beyond this paragraph is labeled domain education from published industry sources, never this company's prices. The market prices senior moves both ways: straight hourly for shorter local jobs, flat rate for larger, long-distance, or fixed-budget moves, with hybrid models in between. Senior move-management support — a separate profession from the mover — is published at $40–$80 per hour in mover guides and about $60–$120 per hour in AARP-cited guidance, with complete projects commonly $1,000–$3,000 or more depending on size and complexity. Published move-cost ranges: local moves about $600–$3,500; long-distance moves of roughly 1,000 miles about $1,500–$8,300, depending on shipment size and service level. Deposit practice varies by mover — published market examples run from no deposit to 10–50% — and is a market observation, not a rule. Domain cost drivers: home size; amount and type of belongings; distance; packing and unpacking scope; sorting and downsizing time; building access; time of year; crew size. Some movers publish AARP, veteran, or senior discounts; this company does not — its published position is one flat rate for every customer. No valuation offering is published for senior moves, and in company copy valuation is never presented as insurance. Senior moves with storage needs price storage on the confirmed storage basis — per job, monthly, or by volume — with no storage rate published.",
         ["senior moving costs", "how much does senior moving cost", "flat rate senior moving", "senior move manager cost"],
         {"headline": "Commercial Terms & Cost Drivers", "author": ORGREF, "publisher": ORGREF}),
    node("personas", "Article", "Buyer Personas & Trigger Events",
         "Buyer personas and trigger events for senior moving. The downsizing senior: decades in one home, moving to something smaller; weighs trust, keepsake care, pace, and one price in writing. The community mover: a senior with a community move-in date at an assisted-living, independent-living, or 55+ community; weighs timing certainty and price certainty. The closer-to-family mover: relocating nearer to children or family; weighs remote coordination and a human-made estimate. The adult-child coordinator: often out of town, arranging a parent's move; weighs one accountable provider, costs in writing, and communication — the published audience the survey room's remote walkthrough is built for. The estate handler (a domain persona; this company's estate scope is not published): a family member or estate handler after a death or settlement, weighing discretion, keepsake care, and exact placement. Trigger events: a move-in date set; the downsizing decision; a home sale or closing; a family proximity decision; an estate settlement; a health change (a motivation only, never a care claim). Domain buying logic, labeled as such: the decision pace is slower than a standard residential move, because decisions tied to decades of personal history take time, and an unhurried pace is itself a buying criterion. Search behavior: families search generically — 'senior moving' and 'senior movers near me', both ranking first for this site in Search Console data — and adult children often search from out of town on a parent's behalf. Senior-household clients rarely post public reviews, for privacy; per the owner, low review volume is expected and is not a quality signal, and the per-branch Google ratings (Winchester 5.0 from 1 review, Martinsburg 4.7 from 6) are branch ratings, never presented as senior-specific ratings.",
         ["senior moving", "senior movers near me", "help moving elderly parent", "downsizing seniors help"],
         {"headline": "Buyer Personas & Trigger Events", "author": ORGREF, "publisher": ORGREF}),
    node("protection-compliance", "Service", "Protection, Handling & Building Compliance",
         "Protection, handling, and building compliance for senior moves. Published scope: packing support for senior moves, including fragile items and keepsakes. The survey room protects the senior during the estimate itself: film only — never lift, move, open, or climb anything heavy or locked — with media kept private and auto-deleted 24 hours after upload. Published, conditional: where a senior move involves a high-mass asset of 1,500 to 3,500 lbs, floor deflection analysis to L/360 applies to that item under SIR, as part of the same flat-rate move. Everything beyond this paragraph is labeled domain practice from published industry sources, not this company's published scope. Domain packing method: individual wrapping and custom padding for heirlooms, antiques, china, and artwork; blanket wrapping and padding for furniture; boxes labeled by room and priority. Domain inventory practice: detailed inventories with photographs for family records, checked at redelivery against the load-in record — this company's inventory practice for senior moves is not published. Domain unpack-and-settle practice: unpacking and furniture placement so the senior arrives to a livable home, with beds made, the kitchen set up, pictures placed, and furniture arranged for safety and accessibility — this company's unpacking and placement depth is not published. Domain floor protection at both locations is market practice and is a different thing from the SIR floor analysis above; the two are not merged. Building inputs — elevator booking, parking, move-in windows, dock access, hallway protection, facility staff scheduling — are domain planning inputs; coordination with facility staff is not published for this company. No prohibited-items list is published for senior moves.",
         ["senior fragile items packing", "keepsake handling moving", "senior move protection"],
         {"provider": ORGREF, "publisher": ORGREF}),
    node("areas-quote", "Dataset", "Service Areas, Dispatch & Quote Path",
         "Service areas, dispatch, and quote path for senior moves. Footprint: Winchester 31 areas, Martinsburg 35, 14 shared, 52 GeoJSON features, carried on the two branch Place nodes and never merged. Dispatch: both bases dispatch across the region — Winchester the Valley side, Martinsburg the Eastern Panhandle side, overlapping at Moorefield — and the quote form settles which base and route fit the move. Quote path: the main button reads 'Get My Flat Rate Quote' and the pill button 'Get a flat rate quote'. Short (Quick Quote) is the default; the Detailed Project form switches in place, preserving the From, To, and What's moving entries. The hero card submit prefills the quote form and routes to the quote page. Survey path: the free video-walkthrough checkbox on the hero card and the quote form creates a private room; the Senior prompt set — main living areas, bedroom and personal rooms, keepsakes and fragile items, one prompt per screen — guides the filming, and the estimate that follows is human-made, never auto-priced. Placement rule: Senior Moving is not one of the nine home-page core-service cards; it lives on the all-pages index, the areas-served page, both branch pages, and the quote path.",
         ["senior moving winchester va", "senior movers martinsburg wv", "get a flat rate quote senior move"]),
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
print("datasets-senior.json built: 8 nodes, split", dict(split))

# ---------- 2. Machine graphs: upgrade the senior node in place ----------
def upgrade_graph_node(d, style):
    """Insert alternateName after name, url after provider (if missing), swap description.
    Preserves the node's existing key order otherwise."""
    n = senior_nodes(d)[0]
    out = {}
    for k, v in n.items():
        if k == "description":
            out[k] = DESC
        else:
            out[k] = v
        if k == "name" and "alternateName" not in n:
            out["alternateName"] = ALT
        if k == "provider" and "url" not in n:
            out["url"] = HUB
    if out.get("description") != DESC or out.get("alternateName") != ALT or out.get("url") != HUB:
        fail(f"graph node upgrade incomplete ({style}): {list(out.keys())}")
    idx = d["@graph"].index(n)
    d["@graph"][idx] = out
    return out

for d, lbl in ((eg, "entity"), (bg, "best")):
    before = [json.dumps(x, sort_keys=True) for x in d["@graph"]]
    upgrade_graph_node(d, lbl)
    after = [json.dumps(x, sort_keys=True) for x in d["@graph"]]
    changed = sum(1 for a, b in zip(before, after) if a != b)
    if changed != 1:
        fail(f"{lbl}: {changed} nodes changed, expected exactly 1")
    txt = json.dumps(d, indent=2, ensure_ascii=False) + "\n"
    for path in [PUB / ("entity-graph.json" if lbl == "entity" else "best-json-entity-graph.json"),
                 MACHINE / "data" / ("entity-graph.json" if lbl == "entity" else "best-json-entity-graph.json"),
                 FLAT / ("entity-graph.json" if lbl == "entity" else "best-json-entity-graph.json")]:
        path.write_text(txt, encoding="utf-8")
    print(f"{lbl} graph: senior node upgraded in place (url + alternateName + 713-char description); all 3 copies byte-identical")

# ---------- 3. index.html: head node + senior div datasets block + Developer card ----------
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
hsen = [n for n in head_graph["@graph"] if isinstance(n, dict) and n.get("@id") == SVC]
if len(hsen) != 1:
    fail("head senior node count != 1")
n = hsen[0]
out = {}
for k, v in n.items():
    out[k] = DESC if k == "description" else v
    if k == "name" and "alternateName" not in n:
        out["alternateName"] = ALT
    if k == "provider" and "url" not in n:
        out["url"] = HUB
if out.get("url") != HUB or out.get("alternateName") != ALT or out.get("description") != DESC:
    fail("head senior upgrade incomplete")
head_graph["@graph"][head_graph["@graph"].index(n)] = out
html = html[:hbody_start] + json.dumps(head_graph, indent=2, ensure_ascii=False) + html[hbody_end:]
print("head graph: senior node upgraded in place (25 nodes, url + alternateName + full description)")

def div_span(text, did):
    s = text.find(f'<div class="page" id="{did}"')
    if s < 0:
        fail(f"div not found: {did}")
    nxt = text.find('<div class="page" id="', s + 10)
    foot = text.find("<footer", s)
    e = min(x for x in (nxt, foot) if x > 0)
    return s, e

# 3b. Senior div: append the datasets JSON-LD block before the div close (storage pattern)
s, e = div_span(html, "page-senior-moving")
seg = html[s:e]
if "#dataset-senior" in seg:
    fail("senior div already carries a datasets block")
tail_anchor = "</section>\n</div>"
if seg.count(tail_anchor) != 1:
    fail(f"senior div tail anchor count {seg.count(tail_anchor)} != 1")
block = ('</section>\n  <script type="application/ld+json">\n' + datasets_txt.rstrip("\n") + '\n  </script>\n</div>')
seg = seg.replace(tail_anchor, block, 1)
mm = re.search(r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>', seg, re.S)
if not mm or json.loads(mm.group(1))["@graph"] != datasets_obj["@graph"]:
    fail("in-div JSON-LD not parse-equal to datasets-senior.json")
html = html[:s] + seg + html[e:]
print("senior div: datasets JSON-LD block appended (parse-equal to datasets-senior.json)")

# 3c. Developer card after the Moving & Storage data card
SENIOR_CARD = ('<article class="card"><h3>Senior data</h3><p><a href="/datasets-senior.json" target="_blank" rel="noopener">'
               '<b>datasets-senior.json →</b></a> — 8 published nodes for the senior moving service, from both branches, never merged: '
               '4 as Datasets (CC BY 4.0) — transition &amp; dwelling operations, senior household &amp; keepsake taxonomy, branch dispatch network, '
               'service areas, dispatch &amp; quote path; 2 as Service data — senior move operations, protection, handling &amp; building compliance; '
               '2 as Articles — commercial terms &amp; cost drivers (the only company term is one flat price agreed in writing; market figures labeled '
               'domain education; no senior price or discount is published), buyer personas &amp; trigger events. '
               'Hub page: <a href="/senior-moving/">Senior Moving</a> · Hub JSON: '
               '<a href="/senior-moving.json" target="_blank" rel="noopener"><b>senior-moving.json →</b></a>.</p></article>')
s, e = div_span(html, "page-developer")
seg = html[s:e]
anchor = '<b>moving-and-storage.json →</b></a>.</p></article>'
if seg.count(anchor) != 1:
    fail("developer storage-card anchor not unique")
if "datasets-senior.json" in seg:
    fail("developer senior card already present")
seg = seg.replace(anchor, anchor + SENIOR_CARD, 1)
html = html[:s] + seg + html[e:]
print("developer: Senior data card inserted after Moving & Storage data card")
idx_path.write_text(html, encoding="utf-8")
(PUB / "datasets-senior.json").write_text(datasets_txt, encoding="utf-8")
print("index.html + datasets-senior.json written")

# ---------- 4. ai-sitemap (public): senior description + 2 GSC keywords ----------
ai_path = PUB / "ai-sitemap.json"
ai_raw = ai_path.read_text(encoding="utf-8")
ai = json.loads(ai_raw)
if json.dumps(ai, indent=2, ensure_ascii=False) != ai_raw.rstrip("\n"):
    fail("ai-sitemap not byte-stable at indent 2")
if len(ai["services"]) != 23 or len(ai["hasPart"]) != 155 or len(ai["keywords"]) != 47:
    fail(f"ai-sitemap baseline drift: {len(ai['services'])}/{len(ai['hasPart'])}/{len(ai['keywords'])}")
svc_entry = [x for x in ai["services"] if x.get("name") == "Senior Moving"]
if len(svc_entry) != 1:
    fail("ai-sitemap senior entry count != 1")
svc_entry[0]["description"] = DESC
for kw in ["senior moving", "senior movers near me"]:
    if kw in ai["keywords"]:
        fail(f"keyword already present: {kw}")
    ai["keywords"].append(kw)
if len(ai["keywords"]) != 49:
    fail("keywords != 49 after append")
ai_path.write_text(json.dumps(ai, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("ai-sitemap: senior description -> full package description; keywords 47 -> 49 (+senior moving, +senior movers near me; none dropped)")

# ---------- 5. llms.txt (public): senior line refresh + dated entry ----------
llms_path = PUB / "llms.txt"
llms = llms_path.read_text(encoding="utf-8")
OLD_LINE = ("- [Senior Moving](https://theflatratemovers.com/senior-moving/): Flat-rate senior moves quoted in writing for seniors downsizing, "
            "transitioning to assisted or independent living, or relocating closer to family, with packing support and a free film-only "
            "video-walkthrough survey room with a human-made estimate.")
NEW_LINE = ("- [Senior Moving](https://theflatratemovers.com/senior-moving/): " + DESC +
            " Datasets D1–D8 (CC BY 4.0): senior move operations; transition & dwelling operations; senior household & keepsake taxonomy; "
            "branch dispatch network; commercial terms & cost drivers (flat-rate-in-writing only; domain figures labeled); buyer personas & "
            "trigger events; protection, handling & building compliance; service areas, dispatch & quote path. "
            "Full datasets: https://theflatratemovers.com/datasets-senior.json · Hub JSON: https://theflatratemovers.com/senior-moving.json")
llms = rep(llms, OLD_LINE, NEW_LINE, scope="llms senior line")
LLMS_ENTRY = (
    "## Update — 2026-10-29 (senior moving deep refresh)\n"
    "- Senior Moving node completed in both machine graphs and the head graph (same @id #service-senior-moving, exactly one node per graph): hub url and the full description added everywhere, alternate name Senior Advocacy Logistics carried as a name only; Place chain at the full footprint (Winchester 31 areas, Martinsburg 35) unchanged; counts unchanged at 155 pages and 23 services. The live senior page copy is unchanged — it already defends 'senior moving' and 'senior movers near me' at position 1.0 in Search Console data.\n"
    "- Senior Moving datasets D1–D8 published at https://theflatratemovers.com/datasets-senior.json (8 nodes: 4 Datasets under CC BY 4.0, 2 Service, 2 Articles; dateModified 2026-10-29), with page-level markup on the senior-moving page and a Developer-page collection entry. Per-page JSON unchanged: https://theflatratemovers.com/senior-moving.json (5 nodes, full footprint).\n"
    "- Gated senior facts stay unpublished: no facility coordination, downsizing or estate-sale scope, senior discount or price, association membership or credential, or care service is claimed; the page FAQ states directly that no senior price or discount is published.\n")
if "senior moving deep refresh" in llms:
    fail("llms senior entry already present")
if not llms.endswith("\n"):
    llms += "\n"
llms += "\n" + LLMS_ENTRY
llms_path.write_text(llms, encoding="utf-8")
print("llms.txt: senior service line refreshed + dated entry appended")

# ---------- 6. data txt: dated entry appended ----------
data_path = PUB / "the-flat-rate-movers-data.txt"
dtxt = data_path.read_text(encoding="utf-8")
DATA_ENTRY = (
    "## Update 2026-10-29 — senior moving deep refresh\n"
    "- Canonical #service-senior-moving Service node completed in both machine graphs and the head graph (one node per graph, hub url https://theflatratemovers.com/senior-moving/, full description, alternate name Senior Advocacy Logistics as a name only, Place chain at the full footprint 31/35, branches distinct). No new page; counts unchanged (155 pages, 23 services).\n"
    "- Senior Moving datasets D1–D8 published as JSON-LD at https://theflatratemovers.com/datasets-senior.json (8 nodes: 4 Datasets under CC BY 4.0, 2 Service, 2 Articles; dateModified 2026-10-29), with page-level markup on the senior-moving page and a Developer-page collection entry. Per-page JSON: https://theflatratemovers.com/senior-moving.json (5 nodes, unchanged).\n"
    "- Company terms in the datasets: one flat price agreed in writing before move day, no hourly clock; no senior price, discount, deposit, or fee published (the page FAQ states this directly); every market figure in the terms dataset is labeled domain education from published industry sources, never a company price. Gated items (facility coordination, sorting/donation/estate scope, unpacking depth, memberships, care scope) are named as unpublished, not claimed.\n")
if "senior moving deep refresh" in dtxt:
    fail("data txt senior entry already present")
if not dtxt.endswith("\n"):
    dtxt += "\n"
dtxt += "\n" + DATA_ENTRY
data_path.write_text(dtxt, encoding="utf-8")
print("data txt: dated entry appended")

# ---------- 7. Rubric DB: attestation rows for newly published facts only ----------
con = sqlite3.connect(DB)
rows = [
    ("Senior Moving canonical node completed: #service-senior-moving upgraded in place in the head graph, entity graph and best graph — exactly one node per graph — gaining the hub url https://theflatratemovers.com/senior-moving/, the alternate name Senior Advocacy Logistics (a name only, no advocacy service claimed), and the full 713-character package description; Place chain to #winchester / #martinsburg at the full footprint 31/35 unchanged",
     "Senior Moving deep package 2026-10-29 (schema.json, merge-note.md)", DATE,
     "public/index.html (head graph); public/entity-graph.json; public/best-json-entity-graph.json"),
    ("Senior Moving datasets D1-D8 published: datasets-senior.json, 8 nodes (4 Dataset CC BY 4.0, 2 Service, 2 Article), page-level markup on the senior-moving page, Developer-page collection entry, dateModified 2026-10-29; gated senior facts (facility coordination, downsizing/estate scope, senior discounts, memberships/credentials, care scope) remain unpublished and unclaimed; market figures in the terms dataset are labeled domain education, never company prices",
     "senior-deep-datasets-2026-10-29.md section 6 (D1-D8)", DATE,
     "public/datasets-senior.json"),
    ("Senior Moving demand evidence: 'senior moving' 75 impressions at position 1.0 and 'senior movers near me' at position 1.0 in the GSC 3-month pull to 2026-10-27 — the two queries the single two-branch senior page defends; both queries added to the ai-sitemap keyword list in this batch (47 -> 49, none dropped)",
     "GSC 3-month pull to 2026-10-27, read 2026-10-29; senior-deep-datasets-2026-10-29.md sections 2/6", DATE,
     "public/ai-sitemap.json"),
]
con.executemany("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?,?,?,?)", rows)
con.commit()
after = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
         for t in ["service", "attestation", "edge", "opening_hours", "service_area", "rubric_check"]}
integ = con.execute("PRAGMA integrity_check").fetchone()[0]
con.close()
if after["attestation"] != 96 or after["service"] != 32 or integ != "ok":
    fail(f"DB after-state wrong: {after}, integrity {integ}")
print(f"rubric DB: +3 attestation rows (93 -> 96); counts {after}; integrity ok")

# ---------- 8. Forbidden scans over every NEW published block + index deltas ----------
NEW_BLOCKS = {"datasets file": datasets_txt, "developer card": SENIOR_CARD,
              "llms service line": NEW_LINE, "llms dated entry": LLMS_ENTRY,
              "data txt dated entry": DATA_ENTRY, "package description": DESC}
for label, blob in NEW_BLOCKS.items():
    low = blob.lower()
    for bad in ["flat quote", "usdot", "spearman", "around town", "design 6", "attest", "lorem", "todo", "tbd",
                "subcontract", "crew page", "temp labor", "nasmm"]:
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
