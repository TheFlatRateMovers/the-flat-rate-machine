#!/usr/bin/env python3
"""SIR Heavy Asset Relocation deep refresh deploy batch — 2026-10-29.
Reconciles the sir-heavy-deep package against CURRENT live state (post
packing batch + both quote-form batches): canonical #service-sir-heavy node
completed in head + entity (hub url added, full package description), best
graph GAINS the node (81 -> 82 — it held zero SIR fragments). The merge-note's
skew premise is partially stale: the full-site redo already replaced the
skewed node's 35 flat strings and Martinsburg url with the registry name,
provider #organization and the branch Place chain in entity + head; what
remained was url + description completion and the best-graph absence.
MERGE DECISION (flagged in the package, executed here, not silent): the
canonical node's url moves from the Martinsburg branch page to the method
hub https://theflatratemovers.com/heavy/, because the node is the method's
node, not a branch page's node. The Martinsburg per-page JSON keeps its
deliberately branch-scoped Service node (provider #martinsburg, branch url)
and its expanded 35-area branch node — READ at merge time, left unchanged;
no gated content was found in it.
Gates: package open questions Q1-Q10 compared against the live record at
merge time; none is answered by it, so band edges (below 1,500 / above
3,500 lbs), certification wording, equipment beyond the published wording,
structural-engineer involvement, medical/cryogenic specifics, a Winchester
SIR branch page, a valuation offering, and crew-size rules all stay
UNCLAIMED (explicit non-claims only in the datasets). KIM-GS internals are
never published; the six published steps are the complete published method
surface. The live site publishes no certification claim for the method or
the company (the two file occurrences of the term are domain-education
text — certified scales — inside the long-distance datasets); this batch
adds none, and no new content carries the term at all.
datasets-sir-heavy.json created under the RETYPE rule (D1, D7 Service;
D2, D3, D4, D8 Dataset; D5, D6 Article = 4 Dataset / 2 Service / 2 Article —
the senior/warehouse/IT/transloading family shape).
No new page, no new service: pages 155 / services 23 / sitemap 155.
FORM PRESERVATION: the quote form (rebuilt twice today under the owner's
direct orders) is asserted intact before and after the build — contact
block in .contact-fields before #detailedFields, required attributes on
exactly qFrom/qTo/qName/qPhone/qEmail, novalidate + #qError + .field-missing,
touched-tracking functions present. The build never edits form regions.
"""
import json, re, shutil, sqlite3, sys, hashlib
from pathlib import Path

HOME = Path.home()
PUB = HOME / "workspace/the-flat-rate-movers-pages/public"
MACHINE = HOME / "workspace/the-flat-rate-machine"
FLAT = HOME / "workspace/theflatratemovers"
PKG = MACHINE / "out/pages/sir-heavy-deep"
BATCH = MACHINE / "out/sir-heavy-batch"
BACKUP = BATCH / "backup-2026-10-29"
DB = FLAT / "rubric.db"
DB_BACKUP = FLAT / "rubric.db.backup-2026-10-29-sir-heavy-batch"
DATE = "2026-10-29"
SVC = "https://theflatratemovers.com/#service-sir-heavy"
SVC_ID = "service-sir-heavy"
HUB = "https://theflatratemovers.com/heavy/"
ORG = "https://theflatratemovers.com/#organization"
REGNAME = "SIR Heavy Asset Relocation (KIM-GS Protocol)"

def fail(msg):
    print("FAIL:", msg); sys.exit(1)

def sha(p):
    return hashlib.sha1(p.read_bytes()).hexdigest()

pkg_schema = json.loads((PKG / "schema.json").read_text(encoding="utf-8"))
pkg_svc = next(n for n in pkg_schema["@graph"] if n.get("@id") == SVC)
DESC = pkg_svc["description"]
if pkg_svc.get("url") != HUB or pkg_svc.get("name") != REGNAME or pkg_svc.get("serviceType") != REGNAME:
    fail("package canonical node fields drift")
for bad in ["attest", "certified", "Certified", "Spearman", "Around Town", "Bristow", "USDOT", "DESIGN 6", "subcontract"]:
    if bad in DESC:
        fail(f"package description carries forbidden content: {bad}")
if "flat quote" in DESC.lower():
    fail("package description carries bare 'flat quote'")
CANON_KEYS = ["@id", "@type", "areaServed", "description", "name", "provider", "serviceType", "url"]
CANON = {k: pkg_svc[k] for k in CANON_KEYS}
if CANON["areaServed"] != [{"@id": "https://theflatratemovers.com/#winchester"}, {"@id": "https://theflatratemovers.com/#martinsburg"}]:
    fail("package node areaServed is not the branch Place chain")
print(f"package canonical node ok: description {len(DESC)} chars, url = hub")

# ---------- 0. Backups + preconditions ----------
BACKUP.mkdir(parents=True, exist_ok=True)
if DB_BACKUP.exists():
    fail(f"mandated DB backup already exists: {DB_BACKUP} (a prior run may have partially applied — reconcile manually)")
shutil.copyfile(DB, DB_BACKUP)
for src, name in [
    (PUB / "index.html", "index.html"), (PUB / "ai-sitemap.json", "pub-ai-sitemap.json"),
    (PUB / "llms.txt", "pub-llms.txt"), (PUB / "the-flat-rate-movers-data.txt", "pub-data.txt"),
    (PUB / "entity-graph.json", "pub-entity-graph.json"), (PUB / "best-json-entity-graph.json", "pub-best.json"),
    (PUB / "sir-heavy-movers-martinsburg-wv.json", "pub-sir-heavy-movers-martinsburg-wv.json"),
    (MACHINE / "data/entity-graph.json", "machine-entity-graph.json"),
    (MACHINE / "data/best-json-entity-graph.json", "machine-best.json"),
    (FLAT / "entity-graph.json", "flat-entity-graph.json"), (FLAT / "best-json-entity-graph.json", "flat-best.json"),
    (DB, "rubric.db"),
]:
    dst = BACKUP / name
    if dst.exists():
        fail(f"backup already exists: {name} (a prior run may have partially applied — reconcile manually)")
    shutil.copyfile(src, dst)
print("backups written to", BACKUP, "+ mandated DB backup", DB_BACKUP.name)

if (PUB / "datasets-sir-heavy.json").exists():
    fail("datasets-sir-heavy.json already exists — expected creation")
if (PUB / "dataset-node.json").exists():
    fail("held dataset-node.json present in public/ — must never ship")

for fname in ["entity-graph.json", "best-json-entity-graph.json"]:
    hs = {sha(PUB / fname), sha(MACHINE / "data" / fname), sha(FLAT / fname)}
    if len(hs) != 1:
        fail(f"{fname} copies diverge before build: {hs}")
print("graph copies byte-identical across public/machine/flat")

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
if len(eg["@graph"]) != 33 or len(bg["@graph"]) != 81:
    fail(f"graph baselines wrong: entity {len(eg['@graph'])}, best {len(bg['@graph'])}")
if len(svc_nodes(eg)) != 1:
    fail("entity SIR node count != 1")
if len(svc_nodes(bg)) != 0:
    fail("best SIR fragment count != 0 (merge-note: best gains the node)")
for d, lbl in ((eg, "entity"), (bg, "best")):
    places = {n["@id"].split("#")[-1]: len(n.get("areaServed", [])) for n in d["@graph"] if n.get("@type") == "Place"}
    if places != {"winchester": 31, "martinsburg": 35}:
        fail(f"{lbl} Place footprint drift: {places}")
en = svc_nodes(eg)[0]
if "url" in en:
    fail("entity SIR node unexpectedly already carries url")
SHORT = en.get("description")
if not SHORT or len(SHORT) != 212 or SHORT == DESC:
    fail(f"entity SIR short-description baseline drift: {len(SHORT or '')} chars")
if en.get("areaServed") != [{"@id": "https://theflatratemovers.com/#winchester"}, {"@id": "https://theflatratemovers.com/#martinsburg"}]:
    fail("entity SIR areaServed is not the branch Place chain (skew premise changed — reconcile)")
if en.get("name") != REGNAME or en.get("serviceType") != REGNAME:
    fail("entity SIR name/serviceType drift (redo state expected)")

# Martinsburg per-page JSON: READ-ONLY check (branch identity; no change planned)
pp_path = PUB / "sir-heavy-movers-martinsburg-wv.json"
pp_raw = pp_path.read_text(encoding="utf-8")
pp = json.loads(pp_raw)
if json.dumps(pp, indent=2, ensure_ascii=False) != pp_raw.rstrip("\n"):
    fail("sir-heavy-movers-martinsburg-wv.json not byte-stable at indent 2")
if len(pp["@graph"]) != 5:
    fail(f"martinsburg per-page nodes {len(pp['@graph'])} != 5")
pp_svc = svc_nodes(pp)
if len(pp_svc) != 1:
    fail("martinsburg per-page Service node count != 1")
if pp_svc[0].get("provider") != {"@id": "https://theflatratemovers.com/#martinsburg"} or pp_svc[0].get("url") != "https://theflatratemovers.com/sir-heavy-movers-martinsburg-wv/":
    fail("martinsburg per-page branch identity drift (expected provider #martinsburg + branch url)")
pp_desc = pp_svc[0].get("description", "")
for bad in ["certified", "Certified", "attest"]:
    if bad in pp_desc:
        fail(f"martinsburg per-page description carries gated content: {bad}")
pp_branch = [n for n in pp["@graph"] if n.get("@type") == "LocalBusiness"]
if len(pp_branch) != 1 or len(pp_branch[0].get("areaServed", [])) != 35:
    fail("martinsburg expanded branch node drift (expected LocalBusiness with 35 areas)")
PP_MD5_BEFORE = hashlib.md5(pp_raw.encode("utf-8")).hexdigest()
print("martinsburg per-page JSON read: branch-scoped node + expanded 35-area branch node intact; no gated content; NO change planned")

con = sqlite3.connect(DB)
base = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        for t in ["service", "attestation", "edge", "opening_hours", "service_area", "rubric_check"]}
if base != {"service": 32, "attestation": 111, "edge": 40, "opening_hours": 14, "service_area": 66, "rubric_check": 7}:
    fail(f"DB baseline drift: {base}")
if con.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
    fail("DB integrity not ok")
canon_rows = con.execute("SELECT COUNT(*) FROM service WHERE service_id LIKE '%#service-%'").fetchone()[0]
if canon_rows != 23:
    fail(f"canonical service rows {canon_rows} != 23")
row = con.execute("SELECT description FROM service WHERE service_id=?", (SVC,)).fetchall()
if len(row) != 1:
    fail("canonical SIR service row missing or duplicated")
if row[0][0] != SHORT:
    fail("DB SIR row description != live short description baseline")
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

def form_assert(html, label):
    cf = html.find('class="contact-fields"')
    df = html.find('id="detailedFields"')
    if cf < 0 or df < 0 or cf > df:
        fail(f"form guard [{label}]: .contact-fields not before #detailedFields")
    for fid in ["qName", "qPhone", "qEmail", "qReach"]:
        p = html.find(f'id="{fid}"')
        if not (cf < p < df):
            fail(f"form guard [{label}]: {fid} not inside the always-visible contact zone")
    req = {}
    for fid in ["qFrom", "qTo", "qName", "qPhone", "qEmail", "qReach", "qDate", "qDateEnd"]:
        m = re.search(rf'<(?:input|select)[^>]*id="{fid}"[^>]*>', html)
        if not m:
            fail(f"form guard [{label}]: {fid} tag not found")
        req[fid] = "required" in m.group(0)
    if not (req["qFrom"] and req["qTo"] and req["qName"] and req["qPhone"] and req["qEmail"]
            and req["qReach"] is False and req["qDate"] is False and req["qDateEnd"] is False):
        fail(f"form guard [{label}]: required set drift: {req}")
    if 'id="quoteForm" novalidate' not in html:
        fail(f"form guard [{label}]: #quoteForm novalidate missing")
    if 'id="qError" role="alert"' not in html:
        fail(f"form guard [{label}]: #qError role=alert missing")
    if ".field-missing" not in html:
        fail(f"form guard [{label}]: .field-missing CSS missing")
    for fn in ["touchedSel", "selVal", "accessString", "pickText"]:
        if fn not in html:
            fail(f"form guard [{label}]: touched-tracking function {fn} missing")
    if "return out.join(', ');" not in html or "return v||'None noted'" not in html:
        fail(f"form guard [{label}]: pickList/pickText semantics drift (pickList must yield '' for empty groups)")
    print(f"form preservation assertions PASS [{label}]")

html_current = (PUB / "index.html").read_text(encoding="utf-8")
router_audit(html_current, "pre-build live index")
form_assert(html_current, "pre-build live index")

# head-graph baseline inside index.html
mb0 = re.search(r'<script type="application/ld\+json">(.*?)</script>', html_current, re.S)
if not mb0:
    fail("head ld+json block not found")
head0 = json.loads(mb0.group(1))
if json.dumps(head0, indent=2, ensure_ascii=False) != mb0.group(1).rstrip("\n"):
    fail("head graph not byte-stable at indent 2")
if len(head0["@graph"]) != 25:
    fail(f"head graph nodes {len(head0['@graph'])} != 25")
hn0 = svc_nodes(head0)
if len(hn0) != 1 or "url" in hn0[0] or hn0[0].get("description") != SHORT:
    fail("head SIR node baseline drift (expected: 1 node, no url, short description)")
print("preconditions ok: graphs 33/81 (best SIR fragments 0), footprints 31/35, DB", base)

# ---------- 1. datasets-sir-heavy.json (D1–D8 under the RETYPE rule) ----------
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
    n = {"@id": f"https://theflatratemovers.com/#dataset-sir-heavy-{slug}", "@type": typ,
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
    node("operations", "Service", "SIR Method Operations",
         "SIR method operations — how a high-mass move is run at The Flat Rate Movers, under SIR (Structural Integrity Relocation) executed through the KIM-GS Protocol, for assets of 1,500 to 3,500 lbs, quoted at one flat rate agreed in writing before move day. The published chain has six steps: (1) the asset — weight, dimensions, centre of mass, and value at risk are established first; (2) the structure — route and clearance survey at both ends, stairs and landings measured, and floor deflection assessed against L/360, span divided by 360, before any lift is planned; (3) the load path — load spreading and protection runs are planned where the substrate needs support, and floors, walls, and frames are protected end to end; (4) the crew and rigging are matched to the plan — dollies, straps, and equipment chosen for this asset and this route; (5) the move — controlled, strapped, and supervised along the planned path; (6) placement — the asset is set in its final position, levelled, and verified with the client, at the flat rate agreed in writing. The structural protocol compresses the same chain into three phases — assess the asset, assess the structure, move under KIM-GS — and calibration-sensitive and fragile high-mass items are flagged at the assess stage, not discovered on the day. The six published steps are the complete published method surface; the protocol's internal calculations, models, and formulas are not published here or anywhere in the company's data. Not published and not claimed: any handling rule below 1,500 lbs or above 3,500 lbs under this method, any equipment beyond the published wording, and any crew-size rule.",
         ["SIR", "KIM-GS", "heavy asset moving", "high-mass relocation", "floor deflection L/360", "gun safe movers"],
         {"provider": ORGREF, "publisher": ORGREF}),
    node("assessment", "Dataset", "Asset & Structure Assessment Operations",
         "Asset and structure assessment operations — the survey that gates every SIR move. Published asset inputs: weight, dimensions, centre of mass, and value at risk, with calibration-sensitive and fragile items flagged at the assess stage. Published structure inputs: the route and clearance at both ends, stairs and landings measured, the substrate, and floor deflection assessed against L/360 — span divided by 360 — before any lift is planned; the plan outputs are the load path, the spreading and protection runs, and the crew and rigging matched to the plan. The company's published rule is that the building is assessed before the asset moves: every SIR move starts with the building, not the item. Domain education, labeled as such and never a company figure: L/360 is the standard residential floor deflection limit in the IRC framework (Table R502.3.1) — a 10-foot span may deflect about one-third of an inch, a 12-foot span 0.40 inches, a 15-foot span 0.50 inches — and tile and stone floors demand the stricter L/480. IRC design loads are 40 psf live load in living areas, 30 psf in sleeping areas, and 20 psf in uninhabitable attic storage, plus roughly 10 to 20 psf dead load, all as uniform loads; a heavy asset concentrates its weight on a small footprint, which is why the published method checks the structure first. Not published and not claimed: any PSI value, floor-load figure, or joist schedule as company engineering data, and any involvement of a licensed structural engineer.",
         ["floor deflection L/360", "heavy asset survey", "high-mass relocation", "SIR protocol steps"]),
    node("taxonomy", "Dataset", "High-Mass Asset Taxonomy",
         "High-mass asset taxonomy — the published asset classes that move under the SIR method, each owned by its own category and cross-referenced here, never duplicated. Gun safes and high-mass safes (gun-safe category); pianos (piano and antique category); antiques and high-value pieces (piano and antique category); medical devices (medical category); cryogenic equipment (cryogenic category); industrial equipment and machinery (industrial and commercial category); vaults (technical rigging, cross-referenced to gun-safe); and calibration-sensitive items, flagged at the assess stage. The published mass band for the method is 1,500 to 3,500 lbs. Below 1,500 lbs and above 3,500 lbs are not published SIR scope: no sub-band handling rule, no maximum, and no refusal or special-handling rule is published, and none is claimed here. Asset-specific handling — safe models and weights, piano types, medical device classes, cryogenic handling — belongs to the asset categories and is not specified in this dataset.",
         ["high-mass assets", "gun safe movers", "piano movers", "medical equipment moving", "cryogenic moving"]),
    node("dispatch-network", "Dataset", "Dispatch Network & Corridor Chain",
         "Dispatch network and corridor chain for SIR heavy asset work. Two branch bases, never merged: Winchester, VA — The Flat Rate Movers, 116 W Piccadilly St Suite 11, open Mon–Fri 8–6, Sat 8–4, Sun 9–4, Google rating 5.0 from 1 review; and Martinsburg, WV — Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, open Mon–Fri 9–6, Sat 9–4, Sun 9–4, Google rating 4.7 from 6 reviews. Coverage is the published two-branch footprint: 52 GeoJSON areas — Winchester 31 (16 Google Business areas plus 15 extended), Martinsburg 35 (14 Google Business areas plus 21 extended), 14 areas shared. Dispatch runs along the I-81, I-66, and I-70 corridors from both bases; a listed area is part of the coverage pool, never a claim that a town sits on a particular highway. The Martinsburg branch carries a full-format SIR branch page; no Winchester SIR branch page exists, and none is claimed — the method hub serves both branches. Sibling categories dispatched from the same bases — gun-safe, piano and antique, long-distance, and industrial and commercial — keep their own nodes and their own claims.",
         ["SIR heavy movers Martinsburg", "heavy asset authority", "high-mass logistics Winchester", "industrial rigging Winchester VA"]),
    node("terms", "Article", "Commercial Terms & Cost Drivers",
         "Commercial terms and cost drivers for SIR heavy asset relocation. The company's only pricing term is the published one: one flat rate agreed in writing before move day — no hourly clock, and no company price, fee, deposit, or discount stated anywhere in this dataset. The published logic of the model: the buyer is not buying muscle but the structure check, and a flat rate in writing removes the meter running on an engineering job. Everything else here is domain education, researched and labeled. Estimate types (domain): binding, non-binding, and not-to-exceed estimates are the industry forms the flat-rate model is published against. Risk transfer (domain logic): under a flat rate the mover carries the timing risk once scope is locked; under hourly pricing the customer pays for every delay. Cost drivers (domain): weight, dimensions, access (stairs, elevator, long carry), protection scope, distance, and specialty handling. Valuation (domain, FMCSA): Full Value Protection means the mover repairs, replaces, or pays the current replacement value of a lost or damaged item, with a minimum declared value of $6 per pound of shipment weight; Released Value Protection caps liability at $0.60 per pound per article and is chosen only by a signed waiver. Valuation is not insurance. Not published and not claimed: any company valuation offering for high-mass assets, and any crew-size rule or minimum job size.",
         ["flat rate heavy moving", "SIR moving quote", "high-mass relocation cost"],
         {"headline": "Commercial Terms & Cost Drivers", "author": ORGREF, "publisher": ORGREF}),
    node("personas", "Article", "Buyer Personas & Trigger Events",
         "Buyer personas and trigger events for SIR heavy asset moving — who buys the method, and what starts the conversation. Safe owners, whose gun safe or high-mass safe has to move without the floor, the staircase, or the safe becoming a guess (the gun-safe category owns that demand). Piano and antique owners and collectors, including estate handlers settling high-value pieces, where the value at risk matters as much as the weight. Medical, museum, and industrial clients whose asset cannot be guessed with — the structural protocol page's own audience. Facility and operations buyers planning industrial rigging, warehouse, and transload work. And homeowners with one heavy piece inside a home move, where the heavy piece moves under the same method as part of the same flat-rate move. Trigger events (domain buyer logic, labeled as such): a new equipment delivery, a home move with a heavy piece, a facility install, a renovation, an estate settlement, an equipment replacement, a building move. The published booking pattern is survey-first — the assessment comes before any lift is planned — through the Short or Detailed quote form and the film-only survey room, with a human-made estimate. No client is named, no testimonial is quoted, and no seasonality or booking-window figure is published or claimed for this category.",
         ["heavy asset moving", "high-mass relocation", "SIR protocol", "industrial rigging"],
         {"headline": "Buyer Personas & Trigger Events", "author": ORGREF, "publisher": ORGREF}),
    node("protection-compliance", "Service", "Floor, Protection & Handling Compliance",
         "Floor, protection, and handling compliance for high-mass assets — the published standard, with domain context labeled. Published: floor deflection is assessed against L/360 before any lift is planned. Load spreading and protection runs are planned where the substrate needs support. Floors, walls, and frames are protected end to end. Dollies, straps, and equipment are matched to the plan, and the crew is matched to the plan. The move runs controlled, strapped, and supervised along the planned path, and placement is levelled and verified with the client. Calibration-sensitive and fragile high-mass items are flagged at the assess stage. The only named heavy equipment anywhere in the company's published record beyond dollies and straps is the warehouse forklift and track loader in the industrial hub's photo caption. Domain reference, labeled as such and never company deployment: load spreading with skids or plywood decking; a rigging inventory of safe-moving dollies, powered stair climbers, straps and tie-downs, gantries, hoists, and cribbing; stair inspection and load restraint on stairs; and structural-engineer consultation guidance for unusual loads. Not published and not claimed: any equipment deployment beyond the published wording, any structural-engineer involvement, any inspection report, warranty, or engineering stamp, and any certification, credential, or accreditation for the method or the company.",
         ["floor deflection L/360", "load spreading", "high-mass rigging standards", "heavy asset protection"],
         {"provider": ORGREF, "publisher": ORGREF}),
    node("areas-quote", "Dataset", "Service Areas, Dispatch & Quote Path",
         "Service areas, dispatch, and quote path for SIR heavy asset relocation. Areas: the published two-branch footprint — 52 GeoJSON areas, Winchester 31 and Martinsburg 35 with 14 shared — carried on the two Place nodes via branch references and never merged into one list. Branches: Winchester, VA (The Flat Rate Movers) and Martinsburg, WV (Flat Rate Movers Martinsburg WV), phone +1-540-422-2153, founded June 2010, tagline 'Guaranteed Flat Rate or Your Move is Free!'. Dispatch runs on the I-81, I-66, and I-70 corridors from both bases. Fourteen published pages carry this service: the method hub, the two protocol pages, the Martinsburg branch page, the technical rigging standards page, the Winchester industrial rigging hub, the vault relocation page, the calibration-safe page, the long-distance high-mass page, two category indexes, and the method articles. The quote path: 'Get My Flat Rate Quote' runs the Short (Quick Quote) form by default, with the Detailed Project form one toggle away and From, To, and What's moving preserved when switching; the film-only survey room supports a human-made estimate, and no test submission is ever sent. No Winchester SIR branch page exists; it is recorded here as a gap, not filled. No certification claim appears anywhere in this dataset.",
         ["SIR heavy movers", "heavy asset authority", "industrial rigging Winchester VA", "high-mass logistics"]),
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
print("datasets-sir-heavy.json built: 8 nodes, split", dict(split))

# ---------- 2. Machine graphs: entity completed in place; best GAINS the canonical node ----------
def upgrade_entity_node(d):
    n = svc_nodes(d)[0]
    out = {}
    for k, v in n.items():
        out[k] = DESC if k == "description" else v
    out["url"] = HUB
    if {k: out[k] for k in CANON_KEYS} != CANON:
        fail("entity node does not equal the canonical package node after upgrade")
    d["@graph"][d["@graph"].index(n)] = out
    return out

before = [json.dumps(x, sort_keys=True) for x in eg["@graph"]]
upgrade_entity_node(eg)
after = [json.dumps(x, sort_keys=True) for x in eg["@graph"]]
if sum(1 for a, b in zip(before, after) if a != b) != 1:
    fail("entity graph: expected exactly 1 node changed")
eg_txt = json.dumps(eg, indent=2, ensure_ascii=False) + "\n"
for path in [PUB / "entity-graph.json", MACHINE / "data/entity-graph.json", FLAT / "entity-graph.json"]:
    path.write_text(eg_txt, encoding="utf-8")
print("entity graph: SIR node completed in place (url added — the merge-decision move to the hub — + full package description; Place chain kept); all 3 copies byte-identical")

canon_node = {k: CANON[k] for k in CANON_KEYS}
bg["@graph"].append(canon_node)
if len(bg["@graph"]) != 82 or len(svc_nodes(bg)) != 1:
    fail("best graph: SIR node addition wrong")
if svc_nodes(bg)[0] != canon_node:
    fail("best graph: added node is not canonical")
bg_txt = json.dumps(bg, indent=2, ensure_ascii=False) + "\n"
for path in [PUB / "best-json-entity-graph.json", MACHINE / "data/best-json-entity-graph.json", FLAT / "best-json-entity-graph.json"]:
    path.write_text(bg_txt, encoding="utf-8")
print("best graph: canonical SIR node ADDED (81 -> 82 nodes, first SIR fragment); all 3 copies byte-identical")

if hashlib.md5((PUB / "sir-heavy-movers-martinsburg-wv.json").read_bytes()).hexdigest() != PP_MD5_BEFORE:
    fail("martinsburg per-page JSON changed unexpectedly")
print("martinsburg per-page JSON: unchanged (merge-time read only)")

# ---------- 3. index.html: head graph + hub datasets block + Developer card ----------
html = (PUB / "index.html").read_text(encoding="utf-8")
mb = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
if not mb:
    fail("head ld+json block not found")
head_raw = mb.group(1)
head = json.loads(head_raw)
if json.dumps(head, indent=2, ensure_ascii=False) != head_raw.rstrip("\n"):
    fail("head graph not byte-stable at indent 2")
if len(head["@graph"]) != 25:
    fail(f"head graph nodes {len(head['@graph'])} != 25")
hpn = svc_nodes(head)
if len(hpn) != 1:
    fail("head SIR node count != 1")
hn = hpn[0]
if "url" in hn:
    fail("head SIR node unexpectedly already carries url")
if hn.get("description") != SHORT:
    fail("head SIR description baseline drift")
hp_before = [json.dumps(x, sort_keys=True) for x in head["@graph"]]
upd = {}
for k, v in hn.items():
    upd[k] = DESC if k == "description" else v
    if k == "provider":
        upd["url"] = HUB
if {k: upd[k] for k in CANON_KEYS} != CANON:
    fail("head node does not equal the canonical package node after upgrade")
head["@graph"][head["@graph"].index(hn)] = upd
hp_after = [json.dumps(x, sort_keys=True) for x in head["@graph"]]
if sum(1 for a, b in zip(hp_before, hp_after) if a != b) != 1:
    fail("head graph: expected exactly 1 node changed")
head_new = json.dumps(head, indent=2, ensure_ascii=False)
html = html[:mb.start(1)] + head_new + html[mb.end(1):]
print("head graph: SIR node completed in place (url inserted after provider + full package description); exactly 1 of 25 nodes changed")

def div_span(doc, div_id):
    start = doc.find(f'<div class="page" id="{div_id}"')
    if start < 0:
        fail(f"div not found: {div_id}")
    nxt = doc.find('<div class="page"', start + 10)
    foot = doc.find("<footer", start)
    end = min([x for x in [nxt, foot] if x > 0])
    return start, end

s, e = div_span(html, "page-heavy")
seg = html[s:e]
if "application/ld+json" in seg or "datasets-sir-heavy" in seg:
    fail("hub div unexpectedly already carries a datasets block")
pos = seg.rfind("</div>")
if pos < 0 or not seg[pos + 6:].strip().startswith("<!--"):
    fail("hub div closing-tag anchor drift (expected the page close followed by a section comment)")
block = '  <script type="application/ld+json">\n' + datasets_txt.rstrip("\n") + "\n  </script>\n"
html = html[:s] + seg[:pos] + block + seg[pos:] + html[e:]

s, e = div_span(html, "page-developer")
seg = html[s:e]
if "SIR Heavy data" in seg:
    fail("developer card already present")
anchor = '<b>datasets-packing.json →</b></a>.</p></article>'
if seg.count(anchor) != 1:
    fail("developer after-anchor count != 1")
card = (
    '<article class="card"><h3>SIR Heavy data</h3><p>Published with the authority graphs (CC BY 4.0 where a Dataset applies): '
    'SIR method operations, asset and structure assessment operations, the high-mass asset taxonomy, the dispatch network and corridor chain, '
    'commercial terms and cost drivers, buyer personas and trigger events, floor, protection and handling compliance, and service areas, dispatch and quote path — four Datasets, two Service data nodes, and two Articles. '
    'The method surface is the six published steps; the protocol\'s internal calculations are not published, and band edges, equipment deployment, engineer involvement, valuation, and crew rules are recorded as explicit non-claims, never as company offers. '
    'No SIR prices appear anywhere: the one flat rate is quoted in writing before move day. '
    'Served as one JSON-LD dataset file, embedded in the Heavy Asset Authority hub page and the authority graphs. '
    'Canonical service node: <a href="#/heavy"><b>SIR Heavy Asset Relocation (KIM-GS Protocol)</b></a>. '
    'File: <a href="datasets-sir-heavy.json"><b>datasets-sir-heavy.json →</b></a>.</p></article>')
html = html[:s] + seg.replace(anchor, anchor + card, 1) + html[e:]
print("developer card 'SIR Heavy data' inserted after the Packing card")
(PUB / "index.html").write_text(html, encoding="utf-8")

html = (PUB / "index.html").read_text(encoding="utf-8")
s, e = div_span(html, "page-heavy")
m2 = re.search(r'<script type="application/ld\+json">(.*?)</script>', html[s:e], re.S)
if not m2 or json.loads(m2.group(1)) != datasets_obj:
    fail("hub div datasets block is not parse-equal to datasets-sir-heavy.json")
(PUB / "datasets-sir-heavy.json").write_text(datasets_txt, encoding="utf-8")
print("hub div datasets block embedded, parse-equal to datasets-sir-heavy.json (8 nodes, 4 Dataset / 2 Service / 2 Article)")

router_audit(html, "post-build")
form_assert(html, "post-build")

# ---------- 4. ai-sitemap ----------
ai = json.loads((PUB / "ai-sitemap.json").read_text(encoding="utf-8"))
if len(ai.get("services", [])) != 23 or len(ai.get("hasPart", [])) != 155:
    fail(f"ai-sitemap baseline drift: services {len(ai.get('services', []))}, hasPart {len(ai.get('hasPart', []))}")
hit = [x for x in ai["services"] if x.get("name") == REGNAME]
if len(hit) != 1:
    fail("ai-sitemap SIR entry count != 1")
if hit[0].get("description") != SHORT:
    fail("ai-sitemap SIR description baseline drift")
hit[0]["description"] = DESC
kw_before = list(ai.get("keywords", []))
if len(kw_before) != 72:
    fail(f"keyword baseline {len(kw_before)} != 72")
kw_add = []
# ai-sitemap keywords grow by the canonical SERVICE node's keyword forms only
# (the D1 operations node's keyword set — the precedent of every prior batch:
# senior +2, warehouse +5, IT +6, transloading +6, packing +6). Per-dataset
# keywords stay inside datasets-sir-heavy.json; they are not ai-sitemap keywords.
for k in nodes[0].get("keywords", []):
    kl = k.lower()
    if kl not in [x.lower() for x in kw_before] and kl not in kw_add:
        kw_add.append(kl)
ai["keywords"] = kw_before + kw_add
(PUB / "ai-sitemap.json").write_text(json.dumps(ai, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"ai-sitemap: SIR description updated to canonical (212 -> {len(DESC)} chars); keywords 72 -> {len(ai['keywords'])} (+{len(kw_add)}: {kw_add}); services 23, hasPart 155")

# ---------- 5. llms.txt ----------
llms = (PUB / "llms.txt").read_text(encoding="utf-8")
old_line = "- [Heavy Asset Authority](https://theflatratemovers.com/): Pianos, medical devices, cryogenic, and antiques, structural integrity relocation"
if llms.count(old_line) != 1:
    fail("llms thin SIR line anchor not found exactly once")
dedicated = ("- [Heavy Asset Authority](https://theflatratemovers.com/heavy/): " + DESC + " "
             "Datasets D1–D8 published: SIR method operations, asset and structure assessment operations, the high-mass asset taxonomy, the dispatch network and corridor chain, commercial terms and cost drivers, buyer personas and trigger events, floor, protection and handling compliance, and service areas, dispatch and quote path — 4 Datasets, 2 Service data nodes, and 2 Articles, CC BY 4.0 where a Dataset applies. The six published steps are the complete published method surface; band edges, equipment deployment, engineer involvement, valuation, and crew rules stay explicit non-claims. "
             "Full datasets: https://theflatratemovers.com/datasets-sir-heavy.json")
if dedicated in llms:
    fail("llms dedicated SIR line already present")
llms = llms.replace(old_line, dedicated, 1)
entry = (
    "\n\n## Update — 2026-10-29 (SIR heavy asset relocation deep refresh)\n"
    "- The SIR heavy deep research package (sir-heavy-deep) has been MERGED into the live authority data. SIR is the method the asset categories run on; its 14 published pages already carry it, so the refresh adds no page and no service — it completes the method's node and publishes its datasets.\n"
    "- Canonical service node https://theflatratemovers.com/#service-sir-heavy is now identical across the head graph, entity-graph.json, and best-json-entity-graph.json: name \"SIR Heavy Asset Relocation (KIM-GS Protocol)\", url https://theflatratemovers.com/heavy/, the full package description, provider #organization, and areaServed chain to the Winchester (31) and Martinsburg (35) Place nodes. MERGE DECISION, flagged in the package and executed here: the node's url moves from the Martinsburg branch page to the method hub, because the node is the method's node, not a branch page's node. The entity and head graphs already carried the registry name and the branch chain from the full-site redo but no url and a thin 212-character description; best-json-entity-graph.json held no SIR fragment at all and gains the canonical node (81 → 82 nodes).\n"
    "- Datasets D1–D8 published as https://theflatratemovers.com/datasets-sir-heavy.json (8 nodes under the retype rule: D1 Service — SIR method operations; D2 Dataset — asset and structure assessment operations; D3 Dataset — high-mass asset taxonomy; D4 Dataset — dispatch network and corridor chain; D5 Article — commercial terms and cost drivers; D6 Article — buyer personas and trigger events; D7 Service — floor, protection and handling compliance; D8 Dataset — service areas, dispatch and quote path). Dataset nodes carry CC BY 4.0, temporalCoverage 2010/2026, dateModified 2026-10-29; the identical @graph is embedded in the Heavy Asset Authority hub page and linked from the Developer page (\"SIR Heavy data\").\n"
    "- Gates honored: the package's open questions Q1–Q10 were compared against the live record at merge time and none is answered by it, so handling below 1,500 lbs and above 3,500 lbs, certification or credential wording, equipment beyond the published \"dollies, straps and equipment\" plus the warehouse forklift and track loader, structural-engineer involvement, medical and cryogenic handling specifics, a Winchester SIR branch page, a company valuation offering, and crew-size rules all stay UNCLAIMED: they appear in the datasets only as explicit non-claims. The live site publishes no certification claim for the method or the company, and none is added. The protocol's internal calculations, models, and formulas are not published anywhere in this data.\n"
    "- Branch record preserved: sir-heavy-movers-martinsburg-wv.json keeps its branch-scoped Service node (provider #martinsburg, url the Martinsburg branch page) and its expanded Martinsburg branch node unchanged — the url move applies to the canonical graph node only. A per-page JSON for the Heavy Asset Authority hub itself remains a follow-up item, as the package records.\n"
    "- ai-sitemap.json: the SIR Heavy Asset Relocation service entry carries the canonical description; keywords grew with the package forms (none dropped). Counts unchanged: pages 155, services 23, sitemap 155. Router audit (pageMeta keys == router pages array) clean before and after the build.")
if "## Update — 2026-10-29 (SIR heavy asset relocation deep refresh)" in llms:
    fail("llms SIR entry already present")
llms += entry
(PUB / "llms.txt").write_text(llms, encoding="utf-8")
print("llms.txt: thin Heavy Asset Authority line replaced in place by the dedicated full line (title kept, url corrected to the hub) + dated SIR refresh entry appended; history byte-identical")

# ---------- 6. data txt ----------
data = (PUB / "the-flat-rate-movers-data.txt").read_text(encoding="utf-8")
dentry = (
    "\n## Update 2026-10-29 — SIR heavy asset relocation deep refresh\n"
    "Merged the sir-heavy-deep research package into the live authority data. Canonical node https://theflatratemovers.com/#service-sir-heavy (\"SIR Heavy Asset Relocation (KIM-GS Protocol)\", url https://theflatratemovers.com/heavy/) is now identical in the head graph, entity-graph.json, and best-json-entity-graph.json, with the full package description and the areaServed chain to the Winchester (31 areas) and Martinsburg (35 areas) Place nodes; the best graph gains the node (81 -> 82). "
    "Merge decision, flagged in the package and executed here: the canonical url moves from the Martinsburg branch page to the method hub — the node is the method's node, not a branch page's node; the branch page's own JSON keeps its branch-scoped node (provider #martinsburg, branch url) and its expanded branch record unchanged. "
    "New public dataset file datasets-sir-heavy.json: 8 nodes — D1 SIR method operations (Service), D2 asset and structure assessment operations (Dataset), D3 high-mass asset taxonomy (Dataset), D4 dispatch network and corridor chain (Dataset), D5 commercial terms and cost drivers (Article), D6 buyer personas and trigger events (Article), D7 floor, protection and handling compliance (Service), D8 service areas, dispatch and quote path (Dataset); Dataset nodes CC BY 4.0, dateModified 2026-10-29; the same @graph is embedded in the Heavy Asset Authority hub page and linked from the Developer page. "
    "Gates: open questions Q1-Q10 (band edges below 1,500 and above 3,500 lbs; certification wording; equipment beyond the published wording; structural-engineer involvement; medical and cryogenic specifics; Winchester branch page; valuation offering; crew-size rules; publishable method surface) are answered by nothing in the live record and stay unclaimed, recorded in the datasets only as explicit non-claims; the six published steps are the complete published method surface and the protocol's internals are not published. No SIR prices anywhere. Counts unchanged: pages 155, services 23, sitemap URLs 155.")
if "## Update 2026-10-29 — SIR heavy asset relocation deep refresh" in data:
    fail("data txt SIR entry already present")
data += "\n" + dentry + "\n"
(PUB / "the-flat-rate-movers-data.txt").write_text(data, encoding="utf-8")
print("data txt: dated SIR refresh entry appended; history byte-identical")

# ---------- 7. Rubric DB (in place; backup already taken) ----------
# REAL schema: service(service_id, name, url, description, provider_id);
# attestation(claim, source, verified, evidence). rubric_check stays the
# 7-row checks catalog (packing precedent); the edge table holds zero
# fragment-service edges by standing rule, so the merge-note's proposed
# fragment edges are NOT added (disposition (c), reported).
con = sqlite3.connect(DB)
cur = con.execute("UPDATE service SET description=? WHERE service_id=?", (DESC, SVC))
if cur.rowcount != 1:
    fail("DB service description update rowcount != 1")
claims = [
    ("SIR canonical node completed: #service-sir-heavy upgraded in place in the head graph and the entity graph — exactly one node per graph — gaining the method hub url https://theflatratemovers.com/heavy/ and the full package description; best-json-entity-graph.json held no SIR fragment and gains the canonical node (81 -> 82 nodes); the areaServed chain to #winchester / #martinsburg at the full footprint 31/35 is unchanged. Merge decision executed and recorded here: the canonical url moves from the Martinsburg branch page to the method hub, because the node is the method's node, not a branch page's node. The live entity and head nodes already carried the registry name and the branch chain from the full-site redo, so the package merge-note's skew premise was partially stale: the remaining work was url + description completion and the best-graph addition, not a footprint repair.",
     "SIR heavy deep package 2026-10-29 (schema.json, merge-note.md)",
     "public/index.html (head graph); public/entity-graph.json; public/best-json-entity-graph.json"),
    ("SIR datasets D1-D8 published: datasets-sir-heavy.json, 8 nodes under the retype rule (D1 Service — SIR method operations; D2, D3, D4, D8 Dataset CC BY 4.0 — assessment operations, high-mass asset taxonomy, dispatch network and corridor chain, service areas and quote path; D5, D6 Article — commercial terms and cost drivers, buyer personas and trigger events; D7 Service — floor, protection and handling compliance), the identical @graph embedded in the Heavy Asset Authority hub page, an SIR Heavy data card on the Developer page, dateModified 2026-10-29. The six published steps are the complete published method surface in this data; the protocol's internal calculations, models, and formulas are not published. Domain material (IRC loads and deflection arithmetic, the rigging inventory, estimate and valuation forms) is labeled domain education wherever it appears, never as company data. No SIR price appears anywhere beyond the published flat-rate-in-writing position; the only figures carried are the federal valuation figures inside the terms dataset, labeled domain (FMCSA) exactly as the long-distance datasets carry them.",
     "sir-heavy-deep-datasets-2026-10-29.md section 6 (D1-D8)",
     "public/datasets-sir-heavy.json"),
    ("SIR method facts and certification silence: the published method record is the 1,500 to 3,500 lb band, the L/360 floor deflection check (span divided by 360, before any lift is planned), the six published steps, and the published asset classes — gun safes and high-mass safes, pianos, antiques and high-value pieces, medical devices, cryogenic equipment, industrial equipment and machinery, vaults, and calibration-sensitive items flagged at the assess stage. The live site publishes no certification, credential, or accreditation claim for SIR, KIM-GS, or the company: the only occurrences of the term in the live site file are domain-education references to scale weights inside the long-distance datasets, never a company claim — and this batch adds no occurrence. The wording gate (package question Q3) stays open until an answer names an issuer.",
     "SIR heavy deep package 2026-10-29 (research doc sections 1 and 8)",
     "public/index.html (full-file term count); sir-heavy-deep package rubric.md"),
    ("SIR merge-time reads executed: the Martinsburg branch page's per-page JSON (sir-heavy-movers-martinsburg-wv.json) was read at merge time; its Service node is deliberately branch-scoped (provider #martinsburg, url the Martinsburg branch page) and its expanded Martinsburg branch node (35 areas) is preserved unchanged — the canonical url move applies to the graph node only — and no gated content was found in the file, so it is the one surface this batch leaves byte-identical by design. The package's open questions Q1-Q10 were compared against the live record and none is answered by it, so band edges, certification wording, equipment beyond the published wording (dollies, straps and equipment, plus the warehouse forklift and track loader in a photo caption), structural-engineer involvement, medical and cryogenic specifics, the Winchester branch page, a valuation offering, and crew-size rules all remain unclaimed; R7 stays 2; a per-page JSON for the hub itself remains a recorded follow-up.",
     "SIR heavy deep package merge-note + live-state comparison 2026-10-29",
     "public/sir-heavy-movers-martinsburg-wv.json; sir-heavy-deep package dataset-status.md"),
]
for claim, src, ev in claims:
    con.execute("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?,?,?,?)",
                (claim, src, "2026-10-29", ev))
con.commit()
counts = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
          for t in ["service", "attestation", "edge", "opening_hours", "service_area", "rubric_check"]}
if counts != {"service": 32, "attestation": 115, "edge": 40, "opening_hours": 14, "service_area": 66, "rubric_check": 7}:
    fail(f"DB post counts wrong: {counts}")
if con.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
    fail("DB integrity failed post-write")
con.close()
print("DB: service row description set to canonical; attestation 111 -> 115 (+4); all other counts unchanged; integrity ok")

# ---------- 8. Forbidden scans ----------
new_blocks = datasets_txt + card + dedicated + entry + dentry + json.dumps(claims)
for bad in ["attest", "certified", "Certified", "Spearman", "Around Town", "DESIGN 6", "Bristow", "subcontract", "crew page"]:
    if bad in new_blocks:
        fail(f"forbidden content in new blocks: {bad}")
if "flat quote" in new_blocks.lower():
    fail("bare 'flat quote' in new blocks")
for pat in [r"USDOT", r"\bMC[- ]?\d{4,}", r"\b\d{6,7}\s*(USDOT|MC)\b"]:
    if re.search(pat, new_blocks):
        fail(f"authority-number pattern in new blocks: {pat}")
amounts = set(re.findall(r"\$\d+(?:\.\d+)?", new_blocks))
if amounts != {"$6", "$0.60"}:
    fail(f"dollar figures in new blocks are not exactly the FMCSA domain pair: {amounts}")
if "$" in (card + dedicated + entry + dentry + json.dumps(claims)):
    fail("dollar figure outside the terms dataset")
html_new = (PUB / "index.html").read_text(encoding="utf-8")
for probe in ["attest", "USDOT", "Spearman", "Around Town", "DESIGN 6", "Bristow", "subcontract", "certified", "Certified"]:
    a, b = html_current.lower().count(probe.lower()), html_new.lower().count(probe.lower())
    if a != b:
        fail(f"index-wide delta for {probe}: {a} -> {b}")
print("forbidden scans: new blocks clean (only $ figures are the FMCSA domain pair $6 / $0.60, inside the terms dataset only); index-wide deltas all zero")
print("BUILD COMPLETE — SIR-heavy batch applied locally (not yet deployed)")
