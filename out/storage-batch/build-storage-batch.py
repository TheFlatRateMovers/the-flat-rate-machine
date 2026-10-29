#!/usr/bin/env python3
"""Moving and Storage ACTIVATION deploy batch — applies the
moving-and-storage-deep package merge-note, adjusted to the CURRENT
post-long-distance live state (reconciliation rule) and to the standing
batch rules that supersede parts of the merge-note:
- NO rubric_check row (7-row checks catalog) and NO edge rows (zero
  fragment-service edges by model) — merge-note section 4 proposed both;
  the deploy brief's standing rules govern.
- Pricing basis is NO LONGER gated: Henry confirmed 2026-10-29 that storage
  is quoted per job, monthly, or by volume (recorded in the package
  meta.json/schema.json by the full-site redo sweep). The merge-note's
  "still gated" line is superseded by that later answer.
- services.json description = merge-note section 1 text + the confirmed
  pricing-basis sentence (section 1 predates the pricing answer).
- llms/data-txt treatment follows the established batch convention
  (service line + dated entry), not a pasted D1-D8 section.
- ROUTER REPAIR found during pre-flight: the pages array in index.html is
  missing the 'videos' key added by the videos batch (pageMeta + div exist;
  the array gates routing, and a node route test showed /videos/ falling
  back to home). This batch adds 'videos' AND 'moving-and-storage'.
Every step asserts its precondition and fails loudly rather than guessing.
"""
import json, re, shutil, sqlite3, pathlib

HOME = pathlib.Path.home()
PUB = HOME / "workspace/the-flat-rate-movers-pages/public"
MDATA = HOME / "workspace/the-flat-rate-machine/data"
MIRROR = HOME / "workspace/theflatratemovers"
PKG = HOME / "workspace/the-flat-rate-machine/out/pages/moving-and-storage-deep"
BATCH = HOME / "workspace/the-flat-rate-machine/out/storage-batch"
BACKUP = BATCH / "backup-2026-10-29"
PHASEA = HOME / "workspace/the-flat-rate-machine/out/phase-a"
DB = MIRROR / "rubric.db"
DATE = "2026-10-29"
HUB = "https://theflatratemovers.com/moving-and-storage/"
SVC = "https://theflatratemovers.com/#service-moving-and-storage"
ORGID = "https://theflatratemovers.com/#organization"
WINID = "https://theflatratemovers.com/#winchester"
MARID = "https://theflatratemovers.com/#martinsburg"

def fail(msg):
    raise SystemExit("BUILD FAIL: " + msg)

def load(p):
    return json.loads(pathlib.Path(p).read_text(encoding="utf-8"))

def dump_stable(path, obj):
    """Write with the repo's byte-stable style: indent=2, ensure_ascii=False,
    trailing newline iff the current file has one. Asserts the UNMODIFIED
    re-dump of the current file is byte-identical before any edit is made
    elsewhere in the pipeline (checked by callers)."""
    cur = pathlib.Path(path).read_bytes()
    txt = json.dumps(obj, indent=2, ensure_ascii=False)
    if cur.endswith(b"\n"):
        txt += "\n"
    pathlib.Path(path).write_text(txt, encoding="utf-8")

def check_stable(path):
    raw = pathlib.Path(path).read_text(encoding="utf-8")
    obj = json.loads(raw)
    redump = json.dumps(obj, indent=2, ensure_ascii=False) + ("\n" if raw.endswith("\n") else "")
    if redump != raw:
        fail(f"{path} is not byte-stable under the standard dump — refusing to reformat")

def rep(text, old, new, n=1, scope=""):
    c = text.count(old)
    if c != n:
        fail(f"anchor count {c} != {n} [{scope}]: {old[:90]!r}")
    return text.replace(old, new, n)

# ---------- 0. Backups ----------
BACKUP.mkdir(parents=True, exist_ok=True)
for src in [PUB / "index.html", PUB / "sitemap.xml", PUB / "ai-sitemap.json", PUB / "llms.txt",
            PUB / "the-flat-rate-movers-data.txt", PUB / "entity-graph.json", PUB / "best-json-entity-graph.json",
            MDATA / "entity-graph.json", MDATA / "best-json-entity-graph.json",
            MDATA / "services.json", MDATA / "pages.json",
            PHASEA / "ai-sitemap.json", PHASEA / "llms.txt", DB]:
    # unique per-path backup names (plain names collide: ai-sitemap.json and
    # llms.txt exist in both PUB and PHASEA — the first run's backups collided)
    shutil.copy2(src, BACKUP / str(src).replace("/", "_"))
print("backups done ->", BACKUP)

# ---------- Package inputs ----------
pkg_schema = load(PKG / "schema.json")
pkg_meta = load(PKG / "meta.json")
svc_node_pkg = pkg_schema["@graph"][0]
if svc_node_pkg["@id"] != SVC or svc_node_pkg["url"] != HUB or svc_node_pkg["serviceType"] != "Moving and Storage":
    fail("package schema Service node mismatch")
pkg_desc = svc_node_pkg["description"]
meta_desc = pkg_meta["desc"]
if pkg_meta["svc"] != SVC or pkg_meta["canonical"] != HUB or pkg_meta["slug"] != "moving-and-storage":
    fail("package meta mismatch")
for gated_word in ["GATED", "STAGED", "gate sentence"]:
    if gated_word in pkg_desc:
        fail(f"package description still carries gate wording: {gated_word}")
print("package inputs verified: schema (5 nodes) + meta; description carries confirmed terms, no gate wording")

def graph_node():
    return {
        "@id": SVC,
        "@type": "Service",
        "name": "Moving and Storage",
        "description": pkg_desc,
        "serviceType": "Moving and Storage",
        "provider": {"@id": ORGID},
        "url": HUB,
        "areaServed": [{"@id": WINID}, {"@id": MARID}],
    }

def head_node():
    return {
        "@type": "Service",
        "@id": SVC,
        "name": "Moving and Storage",
        "serviceType": "Moving and Storage",
        "provider": {"@id": ORGID},
        "url": HUB,
        "areaServed": [{"@id": WINID}, {"@id": MARID}],
        "description": pkg_desc,
    }

# ---------- 1. Entity graph: append the canonical node (32 -> 33) ----------
eg_path = MDATA / "entity-graph.json"
check_stable(eg_path)
eg = load(eg_path)
nodes = eg["@graph"]
if len(nodes) != 32:
    fail(f"entity graph node count {len(nodes)} != 32")
if any(isinstance(n, dict) and n.get("@id") == SVC for n in nodes):
    fail("entity graph already holds the storage node — unexpected")
nodes.append(graph_node())
for dest in [eg_path, MIRROR / "entity-graph.json", PUB / "entity-graph.json"]:
    check_stable(dest)
    dump_stable(dest, eg)
print("entity graph: storage node appended, 32 -> 33, mirrored x3")

# ---------- 2. Best graph: append the canonical node (79 -> 80) ----------
bg_path = MDATA / "best-json-entity-graph.json"
check_stable(bg_path)
bg = load(bg_path)
bnodes = bg["@graph"]
if len(bnodes) != 79:
    fail(f"best graph node count {len(bnodes)} != 79")
if any(isinstance(n, dict) and n.get("@id") == SVC for n in bnodes):
    fail("best graph already holds the storage node — unexpected")
bnodes.append(graph_node())
for dest in [bg_path, MIRROR / "best-json-entity-graph.json", PUB / "best-json-entity-graph.json"]:
    check_stable(dest)
    dump_stable(dest, bg)
print("best graph: storage node appended, 79 -> 80, mirrored x3")

# Live Place footprints (read from the updated entity graph)
places = {n["@id"]: n for n in eg["@graph"] if isinstance(n, dict) and n.get("@id") in (WINID, MARID)}
win_areas = places[WINID]["areaServed"]
mar_areas = places[MARID]["areaServed"]
if len(win_areas) != 31 or len(mar_areas) != 35:
    fail(f"footprint {len(win_areas)}/{len(mar_areas)} != 31/35")

# ---------- 3. Per-page JSON moving-and-storage.json (schema, Places expanded) ----------
hub = json.loads(json.dumps(pkg_schema))
for n in hub["@graph"]:
    if isinstance(n, dict) and n.get("@id") == WINID:
        n["areaServed"] = win_areas
    if isinstance(n, dict) and n.get("@id") == MARID:
        n["areaServed"] = mar_areas
if (PUB / "moving-and-storage.json").exists():
    fail("moving-and-storage.json already exists — expected creation")
(PUB / "moving-and-storage.json").write_text(
    json.dumps(hub, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")
print("per-page JSON created: moving-and-storage.json (5 nodes, footprint 31/35)")

# ---------- 4. datasets-moving-and-storage.json (D1-D8 under the RETYPE rule) ----------
# Retype mapping (precedent: local-regional + long-distance batches):
# D1 operations -> Service; D2 interval & access -> Dataset (bands/models
# reference); D3 taxonomy -> Dataset; D4 dispatch network -> Dataset;
# D5 terms -> Article; D6 personas -> Article; D7 protection/compliance ->
# Service; D8 areas/quote -> Dataset. Totals: Dataset 4 / Service 2 /
# Article 2. No FAQPage node (the page's Q&A pairs live in the page copy;
# precedent keeps FAQPage out of the datasets files).
# Activation reconciliation: the research doc's D-fields marked GATED were
# resolved by Henry's 2026-10-29 answers (leased; any item type; 30-day
# minimum; customer access yes; leases vary; pricing per job/monthly/by
# volume). Standing non-claims stay out or stay negated: facility/lessor
# identity, SIT qualification, climate control for the leased space,
# valuation during hold, a company exclusions list.
SOCIALS = ["https://www.instagram.com/theflatratemovers/", "https://www.threads.com/@theflatratemovers",
           "https://x.com/ratemovers", "https://www.youtube.com/@theflatratemovers",
           "https://github.com/TheFlatRateMovers", "https://medium.com/@ratemovers"]
DIST = [
    {"contentUrl": "https://theflatratemovers.com/ai-sitemap.json", "encodingFormat": "application/json"},
    {"contentUrl": "https://theflatratemovers.com/service-area.geojson", "encodingFormat": "application/json"},
    {"contentUrl": "https://theflatratemovers.com/entity-graph.json", "encodingFormat": "application/ld+json"},
    {"contentUrl": "https://theflatratemovers.com/best-json-entity-graph.json", "encodingFormat": "application/ld+json"},
]

def dnode(slug, typ, name, desc, keywords):
    n = {
        "@id": f"https://theflatratemovers.com/#dataset-moving-and-storage-{slug}",
        "@type": typ,
        "name": name,
        "description": desc,
        "keywords": keywords,
        "about": [{"@id": SVC}],
        "spatialCoverage": [{"@id": WINID}, {"@id": MARID}],
        "temporalCoverage": "2010/2026",
        "dateModified": DATE,
        "creator": {"@id": ORGID, "sameAs": SOCIALS},
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "distribution": DIST,
        "sameAs": HUB,
    }
    if typ == "Service":
        n["provider"] = {"@id": ORGID}
        n["publisher"] = {"@id": ORGID}
    if typ == "Article":
        n["headline"] = name
        n["author"] = {"@id": ORGID}
        n["publisher"] = {"@id": ORGID}
    return n

D = []
D.append(dnode("operations", "Service", "Combined Move-and-Store Operations",
    "Combined move-and-store operations: a move with a storage interval between move-out and move-in, run as one coordinated plan — survey, quote, pack, load, intake, hold, redelivery, placement, reassembly, unpacking, and a final walkthrough. The move side is the published residential pattern: whole-home and apartment moves of every size; loading, transport and unloading; furniture protection and careful placement; disassembly and reassembly of standard furniture, planned up front; full, partial, or fragile-only packing plus unpacking at the other end; white-glove care for antiques and high-value pieces; custom crates when a piece needs more than padding. Where a move includes a high-mass asset of 1,500 to 3,500 lbs, that piece moves under SIR Structural Integrity Relocation with L/360 floor-deflection analysis, as part of the same flat-rate move. The hold side, on the company's confirmed terms: items are held in leased storage between move-out and move-in, for any type of items — including containers, household goods, and machines such as robotic arms — with a 30-day minimum stay; customers can access their stored items while stored; lease terms vary; then goods are redelivered and placed room by room when the destination is ready. The quote path: one flat price in writing before move day for the job, through Get My Flat Rate Quote — the Short (Quick Quote) form by default or the Detailed Project form, switching in place with From, To and What's moving preserved — or the free film-only video walkthrough survey room, where the customer films and a person makes the estimate; nothing is auto-priced. Domain facts, labeled as such: a mover-held gap move typically involves two handlings against four for a self-storage gap; the condition recorded at intake is mirrored at release; redelivery is triggered by destination readiness, not by the calendar alone.",
    ["moving and storage", "flat rate moving and storage", "movers near me", "moving companies winchester va", "movers winchester va", "movers martinsburg wv"]))
D.append(dnode("interval-access", "Dataset", "Storage Interval & Access Operations",
    "Storage interval and access operations — the reference bands every move-with-storage plan is built from. Company terms, confirmed and published: the minimum stay is 30 days; customers can access their stored items while stored (no notice period, access hours, or attendant rule is published, because none was stated); lease terms vary, so no single uniform arrangement is claimed. Interval bands, as domain reference: a gap hold of days to weeks (closing gaps, overlapping leases); long-term holds of months to years (renovations, deployments, downsizing, estate transitions, staging); and storage-in-transit inside a move contract, a federally defined domain form capped at 180 days, after which goods convert to permanent storage under a separate warehouse contract with written notice — domain rules, published as education. The company does not claim storage-in-transit qualification: a regulator rule in the domain record (NCUC) requires SIT shipments to be held in a carrier-owned warehouse or a public warehouse under a long-term lease, and this company's storage is leased storage with varying lease terms, so the qualification is not established and is not claimed. Access models in the wider industry, labeled domain: business-hours access; advance notice of 24 or 48 hours in published examples; attendant-assisted access, sometimes at an hourly rate; partial retrieval of selected items, sometimes for a small handling fee — industry models listed for understanding, none of them published as this company's rule; the company's own published access term is the sentence above. Self-storage anytime access and portable-container driveway limits are domain comparisons, never company offers.",
    ["moving and storage", "storage between moves", "moving storage", "storage in transit"]))
D.append(dnode("taxonomy", "Dataset", "Storage Taxonomy & Item Suitability",
    "Storage taxonomy and item suitability. Storage forms, as domain reference: vaulted warehouse storage (belongings packed into sealed wooden vaults, inventoried, and stored intact — one vault holds about one room; one published vault size is 7.5 by 7 by 5 feet, about 245 cubic feet); self-storage; portable containers; storage-in-transit inside a move contract; long-term or permanent storage under a warehouse contract; and commercial storage for inventory, files, fixtures, FF&E and records. Duration bands: gap (days to weeks), the storage-in-transit window (to 180 days, domain), and long-term (months to years). The company's published item scope stands alone and is not a suitability table: any type of items — including containers, household goods, and machines such as robotic arms. No company accepted-items or prohibited-items list is published: the exclusions other movers commonly publish (perishables, live plants and animals, flammables, fuel and chemicals, illegal substances, unlicensed firearms, hazardous materials) are domain education only, recorded in the protection and compliance dataset as industry practice, never as this company's list. Climate, as domain rationale: stable temperature and humidity protect wood furniture, electronics, books, photographs and fabrics, and climate-controlled space is a standard industry form; no climate claim is made for the company's leased space. Specialty pieces are cross-referenced, never duplicated: pianos and antiques to the piano and antique category, safes and high-mass pieces to SIR and gun-safe moving, crates to custom crating, and freight staging to the industrial and commercial warehouse floor — a different service from household storage, never blurred with it.",
    ["moving and storage", "moving storage services", "household storage during move", "vaulted storage"]))
D.append(dnode("dispatch-network", "Dataset", "Dispatch Network & Warehouse Chain",
    "Dispatch network and warehouse chain for moving and storage. Two branches, never merged: Winchester — The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester, VA 22601, hours Monday to Friday 8 to 6, Saturday 8 to 4, Sunday 9 to 4, Google rating 5.0 from 1 review; Martinsburg — Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404, hours Monday to Friday 9 to 6, Saturday 9 to 4, Sunday 9 to 4, Google rating 4.7 from 6 reviews. Phone +1-540-422-2153 at both branches; founded June 2010; the promise is Guaranteed Flat Rate or Your Move is Free! The full published footprint is 52 GeoJSON service-area features — Winchester 31 areas (16 published on its Google profile plus 15 extended), Martinsburg 35 areas (14 plus 21 extended), 14 shared, including Moorefield 26836, which both branches serve — carried on each branch's own record, never merged into one list. Dispatch runs the published I-81, I-66 and I-70 corridor network from both branches; the service areas are the coverage pool, and no listed town is claimed to sit on a particular highway. The warehouse chain distinction is a published field, stated so no reader merges two different services: the industrial and commercial warehouse floor — load-outs, inbound unloads, container handling, freight staging for onward shipment — is the industrial and commercial service; moving and storage holds a household's or a business's items in leased storage between move-out and move-in, and no facility name or facility location is published for it. Redelivery distance from the hold to the new home is a domain cost driver, recorded in the commercial terms dataset.",
    ["moving and storage", "movers winchester va", "winchester movers", "moving companies winchester va", "movers martinsburg wv", "moving company winchester va"]))
D.append(dnode("terms", "Article", "Commercial Terms & Cost Drivers",
    "Commercial terms and cost drivers for moving and storage. The company's confirmed terms are few and are stated exactly: the move is quoted at one flat rate in writing before move day, with no hourly meter; storage is quoted per job, monthly, or by volume — that is the pricing basis, and no rate, range, minimum charge beyond the stated 30-day minimum stay, fee, or deposit is published anywhere in this dataset; the minimum stay is 30 days; customers can access their stored items while stored; lease terms vary. Everything else here is domain education, researched and labeled, never company terms. Cost drivers in the industry: the volume held (home size, cubic feet, vault count), the duration of the hold, warehouse handling in and out, valuation coverage, and redelivery distance. Storage-in-transit terms in the federal framework (domain): a 180-day cap, then conversion to permanent storage under a separate warehouse contract with written notice covering the conversion date, a 9-month claim window, the end of transit liability, and the warehouseman's rules; under SIT, goods stay under the bill of lading and the move's valuation — Released Value at $0.60 per pound, with Full Value Protection available — and SIT rates are typically weight-based, billed in 30-day increments, sometimes prorated. Valuation is not insurance; it is a tariff-based level of carrier liability, and no valuation-during-hold term is published for the company. Published industry figures, from other movers and listed for education only: SIT at $0.40 to $0.75 per cubic foot per month plus about $75 per vault in each direction (one Florida source); vault storage at $85 to $115 per vault per month (one California source); $85 per vault per month plus a $100 setup fee (one Massachusetts source); monthly pricing by home size from one New Jersey mover (studio $130 to $250, two-bedroom $250 to $400, three-to-four bedroom $400 to $650); self-storage 5-by-10 units at $60 to $220 depending on market and climate control. No figure in this dataset is The Flat Rate Movers' price. Booking guidance in the industry: gap moves are commonly booked about 4 to 6 weeks before move-out day as a safe target.",
    ["moving and storage", "flat rate moving and storage", "moving storage cost", "storage in transit cost"]))
D.append(dnode("personas", "Article", "Buyer Personas & Trigger Events",
    "Buyer personas and trigger events for moving and storage — the buyers are people whose two dates stopped lining up. Closing-gap movers: the sale closes on one date and the purchase on another, and the hold bridges the gap. Renovators: the work finishes after move-out, and the household waits in storage. Downsizers and estate transitions: sorting what fits takes longer than the move itself, cross-referenced to the senior category, which owns its claims. Staged movers: moving in phases, holding part of the household between stages. Seasonal and temporary-housing holders: a posting, a school term, or travel holds the household between homes. Commercial stagers: inventory, fixtures, and FF&E held between leases or mid-build-out. Long-distance window movers: a delivery window on either end of a long-distance move creates the interval, cross-referenced to the long-distance category. The seasonal pattern is industry research, labeled as such: roughly 60 to 70 percent of US moves happen May through September, month-ends peak, and gap moves cluster around closings, which cluster around month-ends. Booking behavior is domain guidance: gap moves are commonly planned about 4 to 6 weeks ahead, and last-minute summer gaps face tighter availability. Every persona plans through the same published path: the Short or Detailed quote form with inputs preserved while switching, or the free film-only video walkthrough survey room with a human-made estimate — film only, never lift, move, open, or climb anything heavy or locked. Published branch hours are the branches' hours; no storage hours are claimed.",
    ["moving and storage", "movers near me", "moving companies winchester va", "local moving", "moving and storage winchester va"]))
D.append(dnode("protection-compliance", "Service", "Protection, Inventory & Compliance",
    "Protection, inventory, and compliance for moving and storage. Published company practice on the move side, cross-referenced from the residential and packing categories: furniture blanket-wrapped and protected end to end; mirrors and art boxed; mattresses and upholstery covered; disassembly and reassembly of standard furniture planned up front; full, partial, or fragile-only packing, plus unpacking at the other end; white-glove care for antiques and high-value pieces; custom crates when a piece needs more than padding. Where a move includes a high-mass asset of 1,500 to 3,500 lbs, SIR Structural Integrity Relocation applies, with L/360 floor-deflection analysis — for heavy pieces only, as part of the same flat-rate move. The survey room rule is published and absolute: film only — never lift, move, open, or climb anything heavy or locked — and the estimate is human-made. Inventory practice for a hold is published here as domain practice, labeled as such: numbered tags with condition noted at load-in; goods palletized or vaulted; held in secured, access-controlled space; the same inventory governs release, with a tag check at redelivery. Building compliance at either end — elevator reservation, loading-zone reservation, building move hours, advance notice, HOA rules, and a certificate of insurance where a managed building requires one — is recorded as domain planning inputs that shape the quote, never as capability claims. Prohibited-items guidance is domain education only: other movers commonly exclude perishables, live plants and animals, flammables, fuel and chemicals, illegal substances, unlicensed firearms, and hazardous materials, and valuables are commonly carried personally — no company prohibited-items list is published, and the company's published scope statement is any type of items, with the examples stated on the service page. Valuation during a hold is not published as a company term; the valuation education lives in the commercial terms dataset, labeled domain.",
    ["moving and storage", "white glove moving", "fragile packing", "furniture protection", "movers winchester va"]))
D.append(dnode("areas-quote", "Dataset", "Service Areas, Dispatch & Quote Path",
    "Service areas, dispatch, and quote path for moving and storage. Two branches, never merged: Winchester — The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester, VA 22601, hours Monday to Friday 8 to 6, Saturday 8 to 4, Sunday 9 to 4, Google rating 5.0 from 1 review, with 16 published Google Business Profile service areas from Leesburg and Sterling to Berryville 22611 and South Riding 20152; Martinsburg — Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404, hours Monday to Friday 9 to 6, Saturday 9 to 4, Sunday 9 to 4, Google rating 4.7 from 6 reviews, with 14 published Google Business Profile service areas from Inwood and Hedgesville to Charles Town 25414 and Harpers Ferry 25425. The full published footprint is 52 GeoJSON features — Winchester 31, Martinsburg 35, 14 shared, Moorefield 26836 served by both — carried per branch and never merged; no area is claimed for a branch without a source. Phone +1-540-422-2153; founded June 2010; Guaranteed Flat Rate or Your Move is Free! Dispatch runs the I-81, I-66 and I-70 corridor network from both branches, and a move with a storage interval is scheduled around two dates, not one — the move-out date and the destination-ready date. The demand record: in the company's Search Console record, 'moving and storage' drew 85 impressions at position 1.0 and 'flat rate moving and storage' 1 at 1.0 — the query this page and node now own outright. The quote path: Get My Flat Rate Quote with the Short (Quick Quote) form by default and the Detailed Project form one toggle away, From, To and What's moving preserved while switching, the pill reading 'Get a flat rate quote', or the free film-only video walkthrough survey room with a human-made estimate; no test quote is ever posted. Cross-references: residential moving (the move side), local and regional moving, long-distance moving, packing, senior moving, warehouse relocation and the industrial and commercial warehouse floor (freight staging — a different service), and the two branch pages — links, never duplicated claims.",
    ["moving and storage", "movers near me", "moving companies winchester va", "movers winchester va", "winchester movers", "movers martinsburg wv"]))

datasets_obj = {"@context": "https://schema.org", "@graph": D}
datasets_txt = json.dumps(datasets_obj, indent=2, sort_keys=False, ensure_ascii=False) + "\n"
if (PUB / "datasets-moving-and-storage.json").exists():
    fail("datasets-moving-and-storage.json already exists — expected creation")
print("datasets object built: 8 nodes (Dataset 4 / Service 2 / Article 2)")

# ---------- 5. Registries: services.json (22 -> 23) + pages.json (154 -> 155) ----------
SVC_REGISTRY_DESC = ("Moves with a storage interval between move-out and move-in, in leased storage for any type of items "
                     "— containers, household goods, machines including robotic arms — with a 30-day minimum stay and "
                     "customer access while stored; lease terms vary. Storage is quoted per job, monthly, or by volume. "
                     "Quoted flat in writing.")
sj_path = MDATA / "services.json"
check_stable(sj_path)
sj = load(sj_path)
if sj["count"] != 22 or len(sj["services"]) != 22:
    fail("services.json baseline != 22")
if any(s["id"] == "service-moving-and-storage" for s in sj["services"]):
    fail("services.json already holds the storage entry")
sj["services"].append({
    "id": "service-moving-and-storage",
    "name": "Moving and Storage",
    "description": SVC_REGISTRY_DESC,
    "source": "Moving-and-storage activation package 2026-10-29 + owner-confirmed terms 2026-10-29 (leased storage; any item type + examples; 30-day minimum stay; customer access while stored; lease terms vary; storage quoted per job, monthly, or by volume)",
    "attested": DATE,
    "pageCount": 1,
})
sj["count"] = 23
dump_stable(sj_path, sj)
print("services.json: storage entry appended, count 22 -> 23")

pj_path = MDATA / "pages.json"
check_stable(pj_path)
pj = load(pj_path)
if pj["count"] != 154 or len(pj["pages"]) != 154:
    fail("pages.json baseline != 154")
if any(p["slug"] == "moving-and-storage" for p in pj["pages"]):
    fail("pages.json already holds the storage page")
pj["pages"].append({
    "slug": "moving-and-storage",
    "url": HUB,
    "title": "Moving and Storage — Winchester VA & Martinsburg WV",
    "type": "service",
    "services": ["service-moving-and-storage"],
    "lastmod": DATE,
    "status": "live",
    "source": "Moving-and-storage activation package 2026-10-29 + owner-confirmed storage terms 2026-10-29 (leased; any item type + examples)",
    "attested": DATE,
})
pj["count"] = 155
dump_stable(pj_path, pj)
print("pages.json: storage page appended, count 154 -> 155")

# ---------- 6. ai-sitemap (public + phase-a staged) ----------
def fix_ai(path, is_public):
    check_stable(path)
    d = load(path)
    desc_old = "154 clean canonical URLs in sitemap.xml, 22 services,"
    if d["description"].count(desc_old) != 1:
        fail(f"{path}: ai-sitemap description clause anchor mismatch")
    d["description"] = d["description"].replace(desc_old, "155 clean canonical URLs in sitemap.xml, 23 services,", 1)
    if len(d["services"]) != 22 or len(d["hasPart"]) != 154:
        fail(f"{path}: ai-sitemap baseline services/hasPart != 22/154")
    if any(s.get("name") == "Moving and Storage" for s in d["services"]):
        fail(f"{path}: ai-sitemap already holds the storage service")
    d["services"].append({"name": "Moving and Storage", "description": pkg_desc})
    d["hasPart"].append({"@type": "WebPage", "name": "Moving and Storage — Winchester VA & Martinsburg WV", "url": HUB})
    kw = d["keywords"]
    if is_public:
        if len(kw) != 44:
            fail(f"public ai-sitemap keywords baseline {len(kw)} != 44")
        if kw[21] != "Transloading Services — Winchester VA" or kw[22] != "movers near me":
            fail("public ai-sitemap keyword name-block boundary unexpected")
        for q in ["moving and storage", "flat rate moving and storage"]:
            if q in kw:
                fail(f"public ai-sitemap keyword already present: {q}")
        kw.insert(22, "Moving and Storage")
        kw.extend(["moving and storage", "flat rate moving and storage"])
    else:
        if len(kw) != 22:
            fail(f"staged ai-sitemap keywords baseline {len(kw)} != 22")
        kw.append("Moving and Storage")
    dump_stable(path, d)
    return len(d["keywords"])

kw_pub = fix_ai(PUB / "ai-sitemap.json", True)
kw_staged = fix_ai(PHASEA / "ai-sitemap.json", False)
print(f"ai-sitemap x2: services 22 -> 23, hasPart 154 -> 155, clause 154/22 -> 155/23; keywords public 44 -> {kw_pub}, staged 22 -> {kw_staged}")

# ---------- 7. The new page div (from the package content.md, site pattern) ----------
DIV = r'''<div class="page" id="page-moving-and-storage">
  <!-- Breadcrumb: the sitewide <nav id="crumb"> chrome renders "Home › Moving and Storage — Winchester VA &amp; Martinsburg WV" from the pageMeta name at deploy, as on every page. No in-div breadcrumb markup, per the established pattern. -->
  <div class="phero" style="background:linear-gradient(120deg,#0c2340,#4a3520 55%,#8a5427)"><div class="wrap">
    <span class="pill">MOVING AND STORAGE — WINCHESTER VA &amp; MARTINSBURG WV</span><h1>Moving and Storage — Winchester VA &amp; Martinsburg WV</h1><p>Moving and storage from The Flat Rate Movers: a move with a storage interval between move-out and move-in. We move your items, hold them in leased storage, then redeliver and place them when the destination is ready — one coordinated plan, quoted flat in writing. Storage is quoted per job, monthly, or by volume. Guaranteed Flat Rate or Your Move is Free!</p>
    <a class="btn btn-white" href="#/quote">Get My Flat Rate Quote</a>
  </div></div>
  <section class="block" style="padding-top:34px"><div class="wrap">
    <figure style="margin-bottom:22px"><img class="wideph" src="/assets/img-01-9c77693ba66b.png" alt="The Flat Rate Movers logo — company brand image, not a job photo." loading="lazy"><figcaption class="phcap">The Flat Rate Movers logo — company brand image, not a job photo.</figcaption></figure>
  </div></section>
  <section class="block"><div class="wrap">
    <h2 class="sec-h">Leased storage, on stated terms</h2>
    <p class="sec-p">Storage is leased. We provide leased storage for any type of items — including containers, household goods, and machines such as robotic arms. Minimum stay is 30 days. Customers can access their stored items while stored. Lease terms vary.</p>
  </div></section>
  <section class="block"><div class="wrap">
    <h2 class="sec-h">Who it is for</h2>
    <p class="sec-p">This service is for anyone whose two dates stopped lining up: closing-gap movers whose sale closes on one date and purchase on another; renovators whose work finishes after move-out; downsizers and estate transitions sorting what fits; staged movers moving in phases; seasonal and temporary-housing holds; commercial staging between leases or mid-build-out; and long-distance moves with a delivery window on either end.</p>
  </div></section>
  <section class="block"><div class="wrap">
    <h2 class="sec-h">What it includes</h2>
    <p class="sec-p">The move side, as published on the <a href="#/residential">residential page</a>: whole-home and apartment moves of every size; loading, transport and unloading; furniture protection and careful placement; disassembly and reassembly of standard furniture, planned up front; full, partial, or fragile-only packing, plus unpacking at the other end; white-glove care for antiques and high-value pieces; custom crates when a piece needs more than padding.</p>
    <p class="sec-p">The storage interval: items held in leased storage between move-out and move-in, then redelivered and placed room by room. Minimum stay is 30 days. Customers can access their stored items while stored. Lease terms vary. Storage is quoted per job, monthly, or by volume. If a move involves a very heavy item — a high-mass asset in the 1,500–3,500 lb range — that item moves under <a href="#/heavy">Structural Integrity Relocation (SIR)</a>, with floor deflection analysis to L/360, as part of the same flat-rate move.</p>
    <p class="sec-p">This is not the warehouse floor used for freight staging and transloading. That floor — industrial-commercial warehouse space, load-outs, inbound unloads, container handling — is a different service: <a href="#/industrial-commercial-services">Industrial &amp; Commercial Services</a>. Moving and storage holds your items between move-out and move-in; freight staging moves freight onward. The two are never blurred.</p>
    <p class="sec-p">Specialty pieces move under their own categories — piano and antique moving, gun-safe moving under SIR, custom crating — and are cross-referenced here, never duplicated. Ask about a specialty piece when you request a quote.</p>
  </div></section>
  <section class="block"><div class="wrap">
    <h2 class="sec-h">How it works</h2>
    <p class="sec-p">1. <b>Get My Flat Rate Quote</b> — Short (Quick Quote) or Detailed Project, switching in place with From, To, and What's moving preserved. Request a quote to confirm storage pricing for your dates and items.</p>
    <p class="sec-p">2. <b>Packing, room by room</b> — full, partial, or fragile-only, plus unpacking at the other end. You may pack yourself; the company loads, moves, and places.</p>
    <p class="sec-p">3. <b>Loading, sequenced</b> — heavy items low and first, boxes staged by room, fragile secured on top, everything strapped against movement.</p>
    <p class="sec-p">4. <b>Hold</b> — items held in leased storage between move-out and move-in.</p>
    <p class="sec-p">5. <b>Redelivery</b> — when the destination is ready, goods are redelivered and placed room by room, furniture reassembled, beds and wardrobes rebuilt.</p>
    <p class="sec-p">6. <b>Walkthrough</b> — final walkthrough at placement.</p>
    <p class="sec-p">The free video-walkthrough survey room is available: film only — never lift, move, open, or climb anything heavy or locked — with a human-made estimate.</p>
  </div></section>
  <section class="block"><div class="wrap">
    <h2 class="sec-h">Storage, explained — industry background, not our terms</h2>
    <p class="sec-p">Everything in this section is general industry information from mover and regulator sources. It explains how storage works in general. It is NOT The Flat Rate Movers' storage terms: our storage terms — leased storage, any item type, 30-day minimum stay, customer access while stored, lease terms vary, and storage quoted per job, monthly, or by volume — are stated in the sections above.</p>
    <h3>Storage types (industry)</h3>
    <p class="sec-p">Short-term storage covers days to weeks — closing gaps, overlapping leases. Long-term storage covers months to years — renovations, deployments, downsizing, estate transitions, staging. Containerized or vaulted storage packs belongings into sealed wooden vaults at the home, inventoried and stored intact, so they are handled less; one vault holds about one room, and one published vault size is 7.5' × 7' × 5', about 245 cubic feet. Storage-in-transit (SIT) is temporary warehouse storage during a move. Other industry forms include vehicle, boat, and RV storage; commercial storage for inventory, files, fixtures, FF&amp;E, and records with chain-of-custody, plus receiving, staging, retail overflow, and seasonal inventory; fine art, antique, and high-value storage; and temperature- or climate-controlled storage.</p>
    <h3>Storage-in-transit rules (industry, FMCSA / NCUC)</h3>
    <p class="sec-p">SIT is federally defined temporary warehouse storage during a move, capped at 180 days; after 180 days it converts to permanent storage under a separate warehouse contract, with written notice required covering the conversion date, a 9-month claim window, the end of transit liability, and the warehouseman's rules and charges. Under SIT, goods stay under the bill of lading and the valuation chosen for the move — Released Value at $0.60 per pound, with Full Value Protection available; after conversion, coverage shifts to warehouse-receipt terms. SIT rates are typically weight-based rather than per-container, billed in 30-day increments, sometimes prorated. One SIT rule matters for leased space: NCUC states SIT shipments must be held in a warehouse owned by the carrier or a public warehouse in which the carrier has a long-term lease agreement. We describe our storage as leased storage.</p>
    <h3>Inventory and protection (industry practice)</h3>
    <p class="sec-p">Numbered tags with condition noted at load-in; furniture blanket-wrapped; mirrors and art boxed; mattresses and upholstery covered; goods palletized or vaulted; held in secured, access-controlled space; climate control for wood, electronics, and sensitive items. The same inventory governs release, with a tag check at redelivery.</p>
    <h3>Access models (industry)</h3>
    <p class="sec-p">Business-hours access; advance notice of 24 hours or 48 hours in published examples; attendant-assisted access, sometimes at an hourly rate; partial retrieval of selected items, sometimes for a small handling fee. None of these is our rule — they are industry models, listed so the options are understood.</p>
    <h3>Pricing models (industry figures only — never our prices)</h3>
    <p class="sec-p">Published figures from other movers, listed for education: SIT at $0.40–$0.75 per cubic foot per month plus about $75 per vault in each direction (one Florida source); vault storage at $85–$115 per vault per month (one California source); $85 per vault per month plus a $100 setup fee (one Massachusetts source); monthly pricing by home size from one New Jersey mover (studio $130–$250, 2-bedroom $250–$400, 3–4 bedroom $400–$650); self-storage 5×10 units at $60–$220 depending on market and climate control. Pricing drivers in the industry are volume, weight, or cubic footage; climate control; duration; and location. Month-to-month billing and multi-month discounts are individual movers' offers, not industry rules. No figure in this paragraph is The Flat Rate Movers' price.</p>
    <h3>Typical exclusions (industry education only — not our list)</h3>
    <p class="sec-p">Other movers commonly exclude perishables, live plants and animals, flammables, fuel and chemicals, illegal substances, unlicensed firearms, and hazardous materials. That is industry practice. Our published scope statement is "any type of items" with the examples above.</p>
    <h3>Climate rationale (industry)</h3>
    <p class="sec-p">Stable temperature and humidity protect wood furniture, electronics, books, photographs, and fabrics; one premium published example is 18–24°C with 40–60% humidity. This paragraph states industry rationale only.</p>
  </div></section>
  <section class="block"><div class="wrap">
    <div class="card" style="margin-bottom:22px">
      <h3>Winchester branch — Moving and Storage</h3>
      <p>The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester, VA 22601. Hours: Mon-Fri 8-6, Sat 8-4, Sun 9-4. Phone +1-540-422-2153. Google rating 5.0 from 1 review.</p>
      <p>Winchester service areas (Google Business Profile, 16): Leesburg, Marshall, Sterling, Stephens City, Loudoun County, Berryville 22611, Frederick County, Middleburg 20117, Middletown 22645, Moorefield 26836, Round Hill 20141, Stephenson 22656, Upperville 20184, Winchester 22601, Purcellville 20132, South Riding 20152.</p>
    </div>
    <div class="card">
      <h3>Martinsburg branch — Moving and Storage</h3>
      <p>Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404. Hours: Mon-Fri 9-6, Sat 9-4, Sun 9-4. Phone +1-540-422-2153. Google rating 4.7 from 6 reviews (4 at 5 stars, 2 at 4 stars).</p>
      <p>Martinsburg service areas (Google Business Profile, 14): Inwood, Hagerstown MD, Hedgesville, Paw Paw 25434, Shepherdstown, Berkeley County, Moorefield 26836, Bunker Hill 25413, Charles Town 25414, Clear Spring MD 21722, Summit Point 25446, Harpers Ferry 25425, Kearneysville 25430, Eastern Panhandle of West Virginia.</p>
    </div>
  </div></section>
  <section class="block"><div class="wrap">
    <h2 class="sec-h">Where we serve</h2>
    <p class="sec-p">Moving and storage is served from Winchester, VA and Martinsburg, WV across the Shenandoah Valley and Eastern Panhandle. Branch areas above are the published Google Business Profile service areas for each branch (screenshots supplied by the owner 2026-10-27, confirmed 2026-10-28). Moorefield 26836 is served by both branches. The two branches are distinct: names, hours, service areas, and ratings are never blended. No area is claimed for a branch without a source.</p>
  </div></section>
  <section class="block"><div class="wrap">
    <h2 class="sec-h">Related pages</h2>
    <div class="chips"><a class="chip" href="#/home">Home</a><a class="chip" href="#/all-pages">Browse all pages</a><a class="chip" href="#/areas-served">Areas served</a><a class="chip" href="#/residential">Residential Moving</a><a class="chip" href="#/local-regional-moving">Local and Regional Moving</a><a class="chip" href="#/longdistance">Long-Distance Moving</a><a class="chip" href="#/packing-services-winchester-va">Packing Services</a><a class="chip" href="#/senior-moving">Senior Moving</a><a class="chip" href="#/warehouse-relocation">Warehouse Relocation</a><a class="chip" href="#/industrial-commercial-services">Industrial &amp; Commercial Services</a><a class="chip" href="#/winchester">The Flat Rate Movers — Winchester</a><a class="chip" href="#/martinsburg">Flat Rate Movers Martinsburg WV</a><a class="chip" href="#/quote">Get a Quote</a><a class="chip" href="#/online-estimate">Online Estimate</a></div>
  </div></section>
  <section class="block"><div class="wrap">
    <h2 class="sec-h">Questions, answered</h2>
    <p><b>What does moving and storage include?</b></p>
    <p class="sec-p">A move with a storage interval between move-out and move-in: packing, loading, a hold in leased storage, then redelivery and room-by-room placement — one coordinated plan, quoted flat in writing.</p>
    <p><b>What kinds of items can be stored?</b></p>
    <p class="sec-p">Any type of items — including containers, household goods, and machines such as robotic arms. That scope statement and those examples are the item scope stated here.</p>
    <p><b>Is the storage space yours?</b></p>
    <p class="sec-p">Storage is leased.</p>
    <p><b>Is there a minimum stay?</b></p>
    <p class="sec-p">Yes — minimum stay is 30 days.</p>
    <p><b>Can I access my items while they are stored?</b></p>
    <p class="sec-p">Yes — customers can access their stored items while stored.</p>
    <p><b>Do lease terms vary?</b></p>
    <p class="sec-p">Yes — lease terms vary.</p>
    <p><b>How does the move side work?</b></p>
    <p class="sec-p">As published on the residential page: whole-home and apartment moves, loading, transport and unloading, furniture protection and careful placement, disassembly and reassembly planned up front, full, partial, or fragile-only packing plus unpacking, white-glove care for antiques and high-value pieces, and custom crates when a piece needs more than padding.</p>
    <p><b>How do I get a flat rate quote for a move with storage?</b></p>
    <p class="sec-p">Get My Flat Rate Quote — Short (Quick Quote) by default, or Detailed Project, switching in place with From, To, and What's moving preserved. The pill button reads "Get a flat rate quote". Request a quote to confirm storage pricing for your dates and items.</p>
    <p><b>What if the move includes a very heavy item?</b></p>
    <p class="sec-p">If the move involves a high-mass asset in the 1,500–3,500 lb range, that item moves under Structural Integrity Relocation (SIR), with floor deflection analysis to L/360, as part of the same flat-rate move.</p>
    <p><b>Is this the same as warehouse or transload staging?</b></p>
    <p class="sec-p">No. Warehouse relocation and transloading stage freight for onward shipment. Moving and storage holds your items between move-out and move-in. The two services are distinct and are never blurred on this page.</p>
    <p><b>What about pianos, safes, or antiques in storage?</b></p>
    <p class="sec-p">Specialty pieces move under their own categories — piano and antique moving, gun-safe moving under SIR, custom crating — cross-referenced here, never duplicated. Ask about a specialty piece when you request a quote.</p>
    <p><b>What does storage typically cost, and how does access usually work?</b></p>
    <p class="sec-p">See "Storage, explained" above: industry pricing and access models are listed there for education, labeled as industry figures and models — never as our prices or our rules. Our own storage is quoted per job, monthly, or by volume; our minimum stay (30 days) and customer access are stated above.</p>
  </div></section>
  <section class="block"><div class="wrap">
    <div class="card">
      <h3>Service area, published data &amp; quote</h3>
      <p>Branch: The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester, VA 22601 (geo 39.18711576, -78.1668352)</p>
      <p>Hours: Mon-Fri 8-6, Sat 8-4, Sun 9-4</p>
      <p>Google rating: 5.0 with 1 review — the per-branch Google rating for The Flat Rate Movers, never blended with the other branch's</p>
      <p>Branch: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404 (geo 39.48319665, -77.94760443)</p>
      <p>Hours: Mon-Fri 9-6, Sat 9-4, Sun 9-4</p>
      <p>Google rating: 4.7 with 6 reviews — the per-branch Google rating for Flat Rate Movers Martinsburg WV, never blended with the other branch's</p>
      <p>Phone: +1-540-422-2153</p>
      <p>Price range: $$</p>
      <p>Founded: June 2010</p>
      <p>Guaranteed Flat Rate or Your Move is Free!</p>
      <p><a href="#/quote">Get My Flat Rate Quote</a> — Short (Quick Quote) by default, or Detailed Project; From, To, and What's moving stay filled in when you switch.</p>
    </div>
  </div></section>
  <section class="block"><div class="wrap">
    <div class="card">
      <h3>Sources &amp; verification</h3>
      <p style="font-size:.85rem">Storage terms — the owner's stated terms, 2026-10-29: storage is offered with moves; storage is leased; any type of items (owner examples: containers, household goods, machines including robotic arms); 30-day minimum stay; customers can access stored items while stored; lease terms vary; storage quoted per job, monthly, or by volume. No facility name or location is published, because none was stated.</p>
      <p style="font-size:.85rem">Branch name, address, geo, hours, service area — Google Business Profile check 2026-10-28, GBP screenshots supplied by owner 2026-10-27, Places verification 2026-10-27</p>
      <p style="font-size:.85rem">Google ratings per branch — Google Business Profile check 2026-10-28 (Winchester 5.0/1, Martinsburg 4.7/6, never blended)</p>
      <p style="font-size:.85rem">Demand — Google Search Console, 3 months to 2026-10-27: "moving and storage" 85 impressions at position 1.0; "flat rate moving and storage" 1 impression at position 1.0</p>
      <p style="font-size:.85rem">Industry background section — mover and regulator sources researched 2026-10-29 (FMCSA and NCUC storage-in-transit rules, published vault sizes, access models, and other movers' published pricing): general industry information, labeled in place, never the company's terms; the company's storage-in-transit qualification is not claimed</p>
      <p style="font-size:.85rem">Image — company logo assets/img-01-9c77693ba66b.png, owner-approved as page image 2026-10-28; brand image, not a job photo</p>
      <p style="font-size:.85rem">Slug — collision-checked against the live sitemap (154 URLs) and data/pages.json (154 slugs), 2026-10-29: "moving-and-storage" was free in both</p>
    </div>
  </div></section>
  <script type="application/ld+json">
__DATASETS_JSON__
  </script>
</div>
'''
DIV = DIV.replace("__DATASETS_JSON__", datasets_txt.rstrip("\n"))
if 'id="page-moving-and-storage"' not in DIV:
    fail("div id missing")
mm = re.search(r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>', DIV, re.S)
if not mm:
    fail("in-div JSON-LD not found")
if json.loads(mm.group(1))["@graph"] != datasets_obj["@graph"]:
    fail("in-div graph != datasets graph")
print("page div built from content.md; in-div JSON-LD parse-equal to datasets-moving-and-storage.json")

# ---------- 8. index.html: head node + sitemap page + developer card + chips + links + router + pageMeta + div ----------
idx_path = PUB / "index.html"
html = idx_path.read_text(encoding="utf-8")

def rep_html(old, new, n=1, scope=""):
    global html
    html = rep(html, old, new, n=n, scope=scope)

def div_span(text, did):
    s = text.find(f'<div class="page" id="{did}"')
    if s < 0:
        fail(f"div not found: {did}")
    nxt = text.find('<div class="page" id="', s + 10)
    foot = text.find('<footer', s)
    e = min([x for x in (nxt, foot) if x > 0])
    return s, e

def edit_div(text, did, fn):
    s, e = div_span(text, did)
    return text[:s] + fn(text[s:e]) + text[e:]

# 8a. Head graph: append the storage Service node (block is byte-stable).
# Format on disk: <script type="application/ld+json">{...}</script> — the JSON
# starts immediately after the tag and ends immediately before </script>.
tag = '<script type="application/ld+json">'
hstart = html.find(tag)
if hstart < 0:
    fail("head ld+json tag not found")
hbody_start = hstart + len(tag)
hbody_end = html.find("</script>", hbody_start)
if hbody_end < 0:
    fail("head ld+json close not found")
head_body = html[hbody_start:hbody_end]
head_graph = json.loads(head_body)
if json.dumps(head_graph, indent=2, ensure_ascii=False) != head_body:
    fail("head graph block is not byte-stable — refusing to reformat")
hnodes = head_graph["@graph"]
if len(hnodes) != 24:
    fail(f"head graph nodes {len(hnodes)} != 24")
if any(isinstance(n, dict) and n.get("@id") == SVC for n in hnodes):
    fail("head graph already holds the storage node")
hnodes.append(head_node())
new_head = json.dumps(head_graph, indent=2, ensure_ascii=False)
html = html[:hbody_start] + new_head + html[hbody_end:]
print("head graph: storage node appended, 24 -> 25")

# 8b. Sitemap page: counts 154 -> 155 / 264 -> 265 + storage row after the Videos row
def smap(seg):
    seg = rep(seg, "lists all 154 canonical pages", "lists all 155 canonical pages", scope="sitemap hero")
    seg = rep(seg, "<h3>154 canonical pages</h3>", "<h3>155 canonical pages</h3>", scope="sitemap card h3")
    seg = rep(seg, "— 154 with a page, a route and structured data", "— 155 with a page, a route and structured data", scope="sitemap card body")
    seg = rep(seg, "<h3>264 live URLs accounted for</h3>", "<h3>265 live URLs accounted for</h3>", scope="sitemap urls h3")
    seg = rep(seg, "154 canonical pages + 2 consolidated pages", "155 canonical pages + 2 consolidated pages", scope="sitemap urls body")
    seg = rep(seg, "Canonical pages — 154</p>", "Canonical pages — 155</p>", scope="sitemap kick")
    row_anchor = ('<a href="#/videos"><b>Videos — Moving &amp; Heavy-Asset Work on Video</b></a>'
                  '<span class="smap-type">Page</span><span class="smap-url">https://theflatratemovers.com/videos/</span></div>')
    new_row = ('\n       <div class="smap-row"><a href="#/moving-and-storage"><b>Moving and Storage — Winchester VA &amp; Martinsburg WV</b></a>'
               '<span class="smap-type">Page</span><span class="smap-url">https://theflatratemovers.com/moving-and-storage/</span></div>')
    seg = rep(seg, row_anchor, row_anchor + new_row, scope="sitemap row insert")
    return seg
html = edit_div(html, "page-sitemap", smap)
print("sitemap page: counts 154 -> 155 / 264 -> 265 + storage row added")

# 8c. Developer card: Moving & Storage data card after the Long-Distance data card
STORAGE_CARD = ('<article class="card"><h3>Moving &amp; Storage data</h3><p><a href="/datasets-moving-and-storage.json" target="_blank" rel="noopener">'
                '<b>datasets-moving-and-storage.json →</b></a> — 8 published nodes for the moving and storage service, from both branches, never merged: '
                '4 as Datasets (CC BY 4.0) — storage interval &amp; access operations, storage taxonomy &amp; item suitability, dispatch network &amp; warehouse chain, '
                'service areas, dispatch &amp; quote path; 2 as Service data — combined move-and-store operations, protection, inventory &amp; compliance; '
                '2 as Articles — commercial terms &amp; cost drivers (company terms only as confirmed: leased storage, any item type, 30-day minimum stay, customer access, '
                'leases vary, pricing per job, monthly, or by volume; industry figures labeled domain education), buyer personas &amp; trigger events. '
                'Hub page: <a href="/moving-and-storage/">Moving and Storage</a> · Hub JSON: '
                '<a href="/moving-and-storage.json" target="_blank" rel="noopener"><b>moving-and-storage.json →</b></a>.</p></article>')
def dev(seg):
    anchor = '<b>long-distance-movers-winchester-va.json →</b></a>.</p></article>'
    return rep(seg, anchor, anchor + STORAGE_CARD, scope="developer card")
html = edit_div(html, "page-developer", dev)
print("developer: Moving & Storage data card inserted after Long-Distance data card")

# 8d. All-pages chip after the Transloading Winchester chip
def allpages(seg):
    anchor = '<a class="chip" href="#/transloading-winchester-va">Transloading Services — Winchester VA</a>'
    return rep(seg, anchor, anchor + '<a class="chip" href="#/moving-and-storage">Moving and Storage — Winchester VA &amp; Martinsburg WV</a>', scope="all-pages chip")
html = edit_div(html, "page-all-pages", allpages)
print("all-pages: storage chip added")

# 8e. Residential page: link to the dedicated storage page (package merge-time link work)
def residential(seg):
    anchor = '<h3>📞 Start your home move</h3>'
    return rep(seg, anchor, '<p>📦 <a href="#/moving-and-storage">Moving and Storage</a> — for moves with a storage interval between move-out and move-in: leased storage, 30-day minimum stay, access to your items while stored.</p>' + anchor, scope="residential link")
html = edit_div(html, "page-residential", residential)
print("residential: moving-and-storage link added before the closing card")

# 8f. Router pages array: add the new key + repair the missing 'videos' key
rep_html("'transloading-winchester-va'];", "'transloading-winchester-va','videos','moving-and-storage'];", scope="pages array")
print("router: pages array += 'videos' (repair) + 'moving-and-storage'")

# 8g. pageMeta entry at the object close
if "'" in meta_desc:
    fail("meta desc contains an apostrophe — JS escaping needed")
pm_anchor = "\n  };\n  function setPageLD(h){"
if html.count(pm_anchor) != 1:
    fail("pageMeta close anchor not unique")
pm_entry = (",\n     'moving-and-storage':{name:'Moving and Storage — Winchester VA & Martinsburg WV', "
            "svc:'https://theflatratemovers.com/#service-moving-and-storage', "
            "canonical:'https://theflatratemovers.com/moving-and-storage/', "
            "desc:'" + meta_desc + "'}")
i = html.find(pm_anchor)
html = html[:i] + pm_entry + html[i:]
print("pageMeta: storage entry added (svc -> #service-moving-and-storage)")

# 8h. New page div before <footer>
if 'id="page-moving-and-storage"' in html:
    fail("page-moving-and-storage already present in index.html")
foot = html.find("<footer")
if foot < 0:
    fail("footer not found")
html = html[:foot] + DIV + "\n" + html[foot:]
if html.count('id="page-moving-and-storage"') != 1:
    fail("page-moving-and-storage count != 1 after insert")
if len(re.findall(r'<div class="page" id="page-', html)) != 155:
    fail("page div count != 155 after insert")
idx_path.write_text(html, encoding="utf-8")
(PUB / "datasets-moving-and-storage.json").write_text(datasets_txt, encoding="utf-8")
print("index.html written (head 25 nodes, divs 154 -> 155); datasets-moving-and-storage.json written")

# ---------- 9. sitemap.xml: +1 ----------
sitemap_path = PUB / "sitemap.xml"
sitemap = sitemap_path.read_text(encoding="utf-8")
if sitemap.count("<loc>") != 154:
    fail("sitemap baseline != 154")
sitemap = rep(sitemap, "</urlset>",
              '  <url><loc>https://theflatratemovers.com/moving-and-storage/</loc><lastmod>2026-10-29</lastmod></url>\n</urlset>',
              scope="sitemap append")
if sitemap.count("<loc>") != 155 or sitemap.count("https://theflatratemovers.com/moving-and-storage/</loc>") != 1:
    fail("sitemap after-state wrong")
sitemap_path.write_text(sitemap, encoding="utf-8")
print("sitemap.xml: 154 -> 155 locs, storage URL present once")

# ---------- 10. llms.txt (public): service line + sitemap clause + dated entry ----------
llms_path = PUB / "llms.txt"
llms = llms_path.read_text(encoding="utf-8")
STORAGE_LINE = ("- [Moving and Storage](https://theflatratemovers.com/moving-and-storage/): " + pkg_desc +
                " Datasets D1–D8 (CC BY 4.0): combined move-and-store operations; storage interval &amp; access operations; "
                "storage taxonomy &amp; item suitability; dispatch network &amp; warehouse chain; commercial terms &amp; cost drivers "
                "(company terms as confirmed only; industry figures labeled domain education); buyer personas &amp; trigger events; "
                "protection, inventory &amp; compliance; service areas, dispatch &amp; quote path. "
                "Full datasets: https://theflatratemovers.com/datasets-moving-and-storage.json · Hub JSON: https://theflatratemovers.com/moving-and-storage.json")
# NOTE: llms.txt is plain text, not HTML — strip the &amp; entities used in the HTML card copy.
STORAGE_LINE = STORAGE_LINE.replace("&amp;", "&")
ld_tail = "Hub JSON: https://theflatratemovers.com/long-distance-movers-winchester-va.json\n"
if llms.count(ld_tail) != 1:
    fail("llms long-distance line tail anchor mismatch")
llms = llms.replace(ld_tail, ld_tail + STORAGE_LINE + "\n", 1)
llms = rep(llms, "154 clean canonical URLs (no hash URLs)", "155 clean canonical URLs (no hash URLs)", scope="llms sitemap clause")
LLMS_ENTRY = (
"\n## Update — 2026-10-29 (moving and storage activation)\n"
"- New service and page published: Moving and Storage (https://theflatratemovers.com/moving-and-storage/) — a move with a storage interval between move-out and move-in. Pages 154 → 155, services 22 → 23. Canonical #service-moving-and-storage Service node added to both machine graphs and the head graph (same @id, exactly one node per graph, hub url + Place chain, branches distinct).\n"
"- Storage terms, as confirmed by the owner on 2026-10-29 and published on the page and node: storage is leased (no facility name or location published; no owned-warehouse claim); any type of items (owner examples: containers, household goods, machines including robotic arms); 30-day minimum stay; customers can access their stored items while stored; lease terms vary; storage is quoted per job, monthly, or by volume — basis only, with no rate, range, or fee published.\n"
"- Moving and Storage datasets D1–D8 published at https://theflatratemovers.com/datasets-moving-and-storage.json (8 nodes: 4 Datasets under CC BY 4.0, 2 Service, 2 Articles; dateModified 2026-10-29), with page-level markup on the moving-and-storage page and a Developer-page collection entry. Per-page JSON created: https://theflatratemovers.com/moving-and-storage.json (5 nodes, Place areas at the full footprint 31/35, branches distinct).\n"
"- Industry storage material on the page and in the datasets (storage types, storage-in-transit rules, vault sizes, inventory practice, access models, other movers' published pricing, typical exclusions) is published as labeled domain education only, never as company terms. Storage-in-transit qualification is not claimed for the company; no company exclusions list is published; the published item scope is any type of items.\n")
if "moving and storage activation" in llms:
    fail("llms storage entry already present")
if not llms.endswith("\n"):
    llms += "\n"
llms += "\n" + LLMS_ENTRY.strip("\n") + "\n"
llms_path.write_text(llms, encoding="utf-8")
print("llms.txt: storage service line + sitemap clause 155 + dated entry appended")

# ---------- 11. llms.txt (phase-a staged): count clause + service name line ----------
staged_path = PHASEA / "llms.txt"
staged = staged_path.read_text(encoding="utf-8")
staged = rep(staged, "154 clean canonical URLs", "155 clean canonical URLs", scope="staged llms clause")
m = re.search(r"^- Transloading Services — Winchester VA: [^\n]*\n", staged, re.M)
if not m:
    fail("staged llms transloading line not found")
staged = staged[:m.end()] + "- Moving and Storage: " + SVC_REGISTRY_DESC + "\n" + staged[m.end():]
staged_path.write_text(staged, encoding="utf-8")
print("staged llms.txt: clause 155 + Moving and Storage line added (verify.js parity)")

# ---------- 12. data txt: count lines + dated entry ----------
data_path = PUB / "the-flat-rate-movers-data.txt"
dtxt = data_path.read_text(encoding="utf-8")
dtxt = rep(dtxt, "Cloudflare Pages, 154 clean canonical URLs in sitemap.xml", "Cloudflare Pages, 155 clean canonical URLs in sitemap.xml", scope="data txt live-site line")
dtxt = rep(dtxt, "Sitemap now 154 clean canonical URLs.", "Sitemap now 155 clean canonical URLs.", scope="data txt sitemap-now line")
DATA_ENTRY = (
"## Update 2026-10-29 — moving and storage activation\n"
"- New service and page published: Moving and Storage (https://theflatratemovers.com/moving-and-storage/); pages 154 → 155, services 22 → 23; canonical #service-moving-and-storage node added to both machine graphs and the head graph (one node per graph, hub url, Place chain at the full footprint 31/35, branches distinct).\n"
"- Storage terms confirmed by the owner 2026-10-29 and published: storage is leased (no facility name or location published); any type of items (owner examples: containers, household goods, machines including robotic arms); 30-day minimum stay; customers can access stored items while stored; lease terms vary; storage quoted per job, monthly, or by volume (basis only — no rates published).\n"
"- Datasets D1–D8 published as JSON-LD at https://theflatratemovers.com/datasets-moving-and-storage.json (8 nodes: 4 Datasets under CC BY 4.0, 2 Service, 2 Articles; dateModified 2026-10-29), with page-level markup on the new page and a Developer-page collection entry. Per-page JSON created: https://theflatratemovers.com/moving-and-storage.json (5 nodes). Industry storage material is labeled domain education only; storage-in-transit qualification is not claimed; no company exclusions list is published.\n")
if "moving and storage activation" in dtxt:
    fail("data txt storage entry already present")
if not dtxt.endswith("\n"):
    dtxt += "\n"
dtxt += "\n" + DATA_ENTRY
data_path.write_text(dtxt, encoding="utf-8")
print("data txt: count lines 155 + dated entry appended")

# ---------- 13. Rubric DB: canonical service row + attestation rows ----------
con = sqlite3.connect(DB)
canon_before = con.execute("SELECT COUNT(*) FROM service WHERE service_id LIKE '%#service-%'").fetchone()[0]
total_before = con.execute("SELECT COUNT(*) FROM service").fetchone()[0]
if canon_before != 22 or total_before != 31:
    fail(f"DB service baseline canonical={canon_before} total={total_before}, expected 22/31")
if con.execute("SELECT COUNT(*) FROM service WHERE service_id=?", (SVC,)).fetchone()[0] != 0:
    fail("DB already holds the storage service row")
con.execute("INSERT INTO service (service_id, name, url, description, provider_id) VALUES (?,?,?,?,?)",
            (SVC, "Moving and Storage", SVC,
             "Flat-rate moving and storage from Winchester, VA and Martinsburg, WV.", ORGID))
att_before = con.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
if att_before != 86:
    fail(f"attestation rows before = {att_before}, expected 86")
EV_PAGE = "public/index.html (page-moving-and-storage); public/moving-and-storage.json; public/datasets-moving-and-storage.json"
SRC_TERMS = "Owner statements 2026-10-29 (storage activation + terms update); moving-and-storage-deep-datasets-2026-10-29.md section 10"
rows = [
    ("Service 'Moving and Storage' is offered by The Flat Rate Movers",
     "head JSON-LD graph in live site source (index.html)", DATE,
     "services.json id service-moving-and-storage; pages.json pageCount 1"),
    ("Moving and Storage service published: new page slug moving-and-storage (canonical https://theflatratemovers.com/moving-and-storage/) and canonical #service-moving-and-storage node added to the head graph, entity graph and best graph — exactly one node per graph, hub url + full description + Place chain; site pages 154 → 155, services 22 → 23",
     "Moving-and-storage activation package 2026-10-29 (content.md, meta.json, schema.json, merge-note.md)", DATE,
     "public/index.html (page-moving-and-storage, pageMeta, head graph); public/moving-and-storage.json; data/services.json; data/pages.json"),
    ("Storage type and scope confirmed by the owner 2026-10-29 and published on the moving-and-storage page, node and datasets: storage is LEASED (no facility name, location, or lessor published; no owned-warehouse claim), and the item scope is any type of items — owner examples: containers, household goods, machines including robotic arms (an item type only; no client is named or implied)",
     SRC_TERMS, DATE, EV_PAGE),
    ("Storage stay, access and lease terms confirmed by the owner 2026-10-29 and published: 30-day minimum stay; customers can access their stored items while stored (no notice period, access hours, or attendant rule published — none was stated); lease terms vary (no uniform lease arrangement claimed)",
     SRC_TERMS, DATE, EV_PAGE),
    ("Storage pricing basis confirmed by the owner 2026-10-29 and published: storage is quoted per job, monthly, or by volume — basis only; no rate, range, minimum charge beyond the 30-day term, or fee is published anywhere",
     "Owner statement 2026-10-29 (pricing-basis confirmation, full-site redo Area E); package meta.json + schema.json as updated 2026-10-29", DATE, EV_PAGE),
    ("Moving and Storage datasets D1-D8 published: datasets-moving-and-storage.json, 8 nodes (4 Dataset CC BY 4.0, 2 Service, 2 Article), page-level markup on the moving-and-storage page, Developer-page entry, dateModified 2026-10-29; industry storage material (storage-in-transit rules, vault sizes, access models, other movers' published pricing, typical exclusions) published as labeled domain education only; storage-in-transit qualification is NOT claimed for the company and no company exclusions list is published",
     "moving-and-storage-deep-datasets-2026-10-29.md section 6 (D1-D8) + section 10 domain findings", DATE,
     "public/datasets-moving-and-storage.json"),
    ("Moving-and-storage demand evidence: 'moving and storage' 85 impressions at position 1.0 and 'flat rate moving and storage' 1 impression at position 1.0 — the query the new page and node now own",
     "GSC 3-month pull to 2026-10-27, read 2026-10-29; moving-and-storage-deep-datasets-2026-10-29.md sections 2/6", DATE,
     "moving-and-storage-deep-datasets-2026-10-29.md"),
]
con.executemany("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?,?,?,?)", rows)
con.commit()
canon_after = con.execute("SELECT COUNT(*) FROM service WHERE service_id LIKE '%#service-%'").fetchone()[0]
att_after = con.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
integ = con.execute("PRAGMA integrity_check").fetchone()[0]
counts = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
          for t in ["service", "attestation", "edge", "opening_hours", "service_area", "rubric_check"]}
con.close()
if canon_after != 23 or att_after != 93 or integ != "ok":
    fail(f"DB after-state wrong: canonical={canon_after}, attestation={att_after}, integrity={integ}")
print(f"rubric DB: service row added (canonical 22 -> 23, total 31 -> 32); +7 attestation rows (86 -> 93); counts {counts}; integrity ok")

# ---------- 14. Forbidden scans over every NEW published block ----------
NEW_BLOCKS = {
    "page div": DIV,
    "datasets file": datasets_txt,
    "developer card": STORAGE_CARD,
    "llms service line": STORAGE_LINE,
    "llms dated entry": LLMS_ENTRY,
    "data txt dated entry": DATA_ENTRY,
    "pageMeta desc": meta_desc,
    "package description": pkg_desc,
}
for label, blob in NEW_BLOCKS.items():
    low = blob.lower()
    for bad in ["flat quote", "usdot", "spearman", "around town", "design 6", "attest", "lorem", "todo", "tbd"]:
        if bad in low:
            fail(f"forbidden string {bad!r} in NEW block [{label}]")
    for pat in [r"we offer (sit|storage-in-transit)", r"our sit\b", r"sit service", r"offers storage-in-transit",
                r"our warehouse", r"our facility", r"our own (storage )?(facility|warehouse|space)",
                r"company-owned warehouse", r"we own the"]:
        if re.search(pat, low):
            fail(f"forbidden claim pattern {pat!r} in NEW block [{label}]")
if "We describe our storage as leased storage" not in DIV:
    fail("div is missing the leased-storage SIT disclaimer sentence")
if "industry background, not our terms" not in DIV:
    fail("div is missing the industry-section disclaimer")
print("forbidden scans: zero in all new published blocks (incl. SIT-offering and owned-facility patterns)")

shutil.copyfile(HOME / "workspace/theflatratemovers/moving-and-storage-deep-datasets-2026-10-29.md",
                BATCH / "moving-and-storage-deep-datasets-2026-10-29.md")
print("research doc copied into batch dir")
print("BUILD OK")
