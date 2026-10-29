#!/usr/bin/env python3
"""Deploy batch Stage 3: convert staged content.md packages to Phase 3 page-div HTML.
Applies the mandated merge transforms and nothing else:
  - branch area lists expand GBP-only -> full footprint (31/35), branches distinct
  - warehouse 'node, schema, and dataset' -> 'node and schema' (dataset HELD)
  - 'Where we serve' GBP source sentences -> footprint source wording + shared line
Everything else is verbatim content.md prose. Aborts on any failed assertion.
Outputs: out/deploy-batch/divs/<slug>.html
"""
import json, re, sys, html as H
from pathlib import Path

M = Path.home() / "workspace" / "the-flat-rate-machine"
OUT = M / "out" / "deploy-batch" / "divs"
TODAY = "2026-10-29"

def fail(msg):
    print("STAGE3 FAILED:", msg); sys.exit(1)

fp = json.loads((M / "out/footprint.json").read_text())
WIN_FP = fp["winchesterFootprint"]   # 31
MAR_FP = fp["martinsburgFootprint"]  # 35
SHARED = fp["sharedAreas"]           # 14
assert len(WIN_FP) == 31, len(WIN_FP)
assert len(MAR_FP) == 35, len(MAR_FP)
assert len(SHARED) == 14, len(SHARED)

pages = json.loads((M / "data/pages.json").read_text())["pages"]
PAGE_SLUGS = {p["slug"] for p in pages}

def esc(t):
    return H.escape(t, quote=False)

def bold(t):
    return re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", esc(t))

def parse_md(text):
    """Split content.md into (intro_paras, [(header, body_text)]) preserving order."""
    lines = text.split("\n")
    intro, sections, cur_h, cur = [], [], None, []
    for ln in lines:
        if ln.startswith("# "):
            continue
        m = re.match(r"##\s+(.*)", ln)
        if m:
            if cur_h is not None:
                sections.append((cur_h, "\n".join(cur).strip()))
            cur_h, cur = m.group(1).strip(), []
        else:
            if cur_h is None:
                intro.append(ln)
            else:
                cur.append(ln)
    if cur_h is not None:
        sections.append((cur_h, "\n".join(cur).strip()))
    intro_paras = [p.strip() for p in "\n".join(intro).strip().split("\n\n") if p.strip()]
    return intro_paras, sections

def split_paras(body):
    return [p.strip() for p in body.split("\n\n") if p.strip()]

def gbp_list_from_para(para):
    """Extract the area list from a 'service areas (Google Business Profile, N): ...' paragraph."""
    m = re.search(r"service areas \(Google Business Profile, \d+\):\s*(.*?)\.?\s*$", para)
    if not m:
        return None
    return [a.strip() for a in m.group(1).rstrip(".").split(", ") if a.strip()]

def footprint_block(branch, gbp):
    """Return (full_list, extended_list) with count assertions."""
    full = WIN_FP if branch == "winchester" else MAR_FP
    gset = set(gbp)
    # GBP entries match footprint entries verbatim except bare-vs-qualified forms;
    # match on normalized form (strip state token + zip) to find the extended set.
    def norm(a):
        a = re.sub(r"\s+\d{5}\s*$", "", a.strip())
        a = re.sub(r",?\s*(VA|WV|MD)\s*$", "", a)
        return a.strip().lower()
    gnorm = {norm(a) for a in gbp}
    extended = [a for a in full if norm(a) not in gnorm]
    exp_n = 15 if branch == "winchester" else 21
    if len(gbp) != (16 if branch == "winchester" else 14):
        fail(f"{branch}: GBP list len {len(gbp)}")
    if len(extended) != exp_n:
        fail(f"{branch}: extended len {len(extended)} != {exp_n}; extended={extended}")
    return full, extended

def branch_section_html(branch, facts_para, area_para, extra_paras, svc_name):
    """facts_para: address/hours/phone/rating paragraph (verbatim).
    area_para: GBP area paragraph -> replaced by footprint block.
    extra_paras: any other paragraphs in the section (verbatim)."""
    gbp = gbp_list_from_para(area_para)
    if gbp is None:
        fail(f"{branch}: could not parse GBP area list from: {area_para[:120]}")
    full, extended = footprint_block(branch, gbp)
    bname = "The Flat Rate Movers" if branch == "winchester" else "Flat Rate Movers Martinsburg WV"
    n_full, n_gbp, n_ext = len(full), len(gbp), len(extended)
    parts = [f'<h2 class="sec-h">{esc("Winchester branch" if branch == "winchester" else "Martinsburg branch")} — {esc(svc_name)}</h2>']
    parts.append(f'<p class="sec-p">{bold(facts_para)}</p>')
    parts.append(f'<p class="sec-p">{esc("Winchester" if branch == "winchester" else "Martinsburg")} service areas (full footprint, {n_full}): {esc(", ".join(full))}.</p>')
    parts.append(f'<p class="sec-p">Service areas (GBP, {n_gbp}): {esc(", ".join(gbp))}.</p>')
    parts.append(f'<p class="sec-p">Extended footprint ({n_ext} more): {esc(", ".join(extended))}.</p>')
    parts.append(f'<p class="sec-p">Full footprint for this branch: {n_full} areas (GBP {n_gbp} + extended {n_ext}).</p>')
    for p in extra_paras:
        parts.append(f'<p class="sec-p">{bold(p)}</p>')
    return "\n    ".join(parts)

def bullets_html(body):
    """Convert '- ' bullets (with **lead** — rest) to <ul><li>."""
    items = []
    for ln in body.split("\n"):
        ln = ln.strip()
        if ln.startswith("- "):
            items.append(bold(ln[2:].strip()))
    if not items:
        return None
    return "<ul>\n      " + "\n      ".join(f"<li>{i}</li>" for i in items) + "\n    </ul>"

def numbered_html(body):
    """Convert 'N. text' lines to <p class='sec-p'><b>N.</b> text</p>."""
    out = []
    for ln in body.split("\n"):
        ln = ln.strip()
        m = re.match(r"(\d+)\.\s+(.*)", ln)
        if m:
            out.append(f'<p class="sec-p"><b>{m.group(1)}.</b> {bold(m.group(2))}</p>')
        elif ln:
            out.append(f'<p class="sec-p">{bold(ln)}</p>')
    return "\n    ".join(out)

def section_html(header, body, ctx):
    """Generic section -> HTML. Branch/Where/Related/QA handled by caller."""
    paras = split_paras(body)
    # mixed prose + bullets: split body into prose paras and bullet block
    # split body into alternating prose / bullet chunks (a prose paragraph
    # AFTER bullets must not be swallowed by the bullet chunk)
    chunks = []
    cur_kind, buf = None, []
    for ln in body.split("\n"):
        kind = "bullets" if ln.strip().startswith("- ") else "prose"
        if cur_kind is None:
            cur_kind, buf = kind, [ln]
        elif kind == cur_kind:
            buf.append(ln)
        else:
            chunks.append((cur_kind, "\n".join(buf)))
            cur_kind, buf = kind, [ln]
    if buf:
        chunks.append((cur_kind, "\n".join(buf)))
    out = [f'<h2 class="sec-h">{esc(header)}</h2>']
    for kind, chunk in chunks:
        if kind == "bullets":
            b = bullets_html(chunk)
            if b:
                out.append(b)
        else:
            for p in split_paras(chunk):
                if re.match(r"\d+\.\s+", p.strip()):
                    out.append(numbered_html(p))
                else:
                    out.append(f'<p class="sec-p">{bold(p)}</p>')
    return "\n    ".join(out)

def build_page(slug, pkgdir, svc_short, pill_override=None):
    meta = json.loads((M / "out/pages" / pkgdir / "meta.json").read_text())
    schema = json.loads((M / "out/pages" / pkgdir / "schema.json").read_text())
    content = (M / "out/pages" / pkgdir / "content.md").read_text()
    intro_paras, sections = parse_md(content)
    name = meta["name"]
    pill = esc((pill_override or name).upper().replace(" & ", " &amp; ")) if False else None
    # pill: uppercase name, escape & for HTML
    pill_text = name.upper()
    pill_html = pill_text.replace("&", "&amp;")
    intro = " ".join(intro_paras)
    # mandated dataset-sentence fix (warehouse only)
    if "its own node, schema, and dataset" in intro:
        intro = intro.replace("its own node, schema, and dataset", "its own node and schema")
        ctx_note = "dataset-sentence fixed"
    else:
        ctx_note = ""
    svc_node = [n for n in schema["@graph"] if n.get("@type") == "Service"][0]
    places = {n["@id"].split("#")[-1]: n for n in schema["@graph"] if n.get("@type") == "Place"}
    win, mar = places["winchester"], places["martinsburg"]
    parts = []
    parts.append(f'<div class="page" id="page-{slug}">')
    parts.append(f'  <div class="phero" style="background:linear-gradient(120deg,#0c2340,#4a3520 55%,#8a5427)"><div class="wrap">')
    parts.append(f'    <span class="pill">{pill_html}</span><h1>{esc(name)}.</h1><p>{bold(intro)}</p>')
    parts.append(f'    <a class="btn btn-white" href="#/quote">Get My Flat Rate Quote</a>')
    parts.append(f'  </div></div>')
    parts.append(f'  <section class="block" style="padding-top:34px"><div class="wrap">')
    parts.append(f'    <figure style="margin-bottom:22px"><img class="wideph" src="/assets/img-01-9c77693ba66b.png" alt="The Flat Rate Movers logo — company brand image, not a job photo." loading="lazy"><figcaption class="phcap">The Flat Rate Movers logo — company brand image, not a job photo.</figcaption></figure>')
    parts.append(f'  </div></section>')
    for header, body in sections:
        if header == "Image":
            continue
        if header in ("Winchester branch — " + name.split(" — ")[0],) or header.startswith("Winchester branch"):
            paras = split_paras(body)
            facts = paras[0]
            area = next((p for p in paras if "service areas (Google Business Profile" in p), None)
            extra = [p for p in paras[1:] if p != area]
            parts.append('  <section class="block"><div class="wrap">')
            parts.append("    " + branch_section_html("winchester", facts, area, extra, svc_short))
            parts.append('  </div></section>')
        elif header.startswith("Martinsburg branch"):
            paras = split_paras(body)
            facts = paras[0]
            area = next((p for p in paras if "service areas (Google Business Profile" in p), None)
            extra = [p for p in paras[1:] if p != area]
            parts.append('  <section class="block"><div class="wrap">')
            parts.append("    " + branch_section_html("martinsburg", facts, area, extra, svc_short))
            parts.append('  </div></section>')
        elif header == "Where we serve":
            parts.append('  <section class="block"><div class="wrap">')
            out = [f'<h2 class="sec-h">Where we serve</h2>']
            for p in split_paras(body):
                if "published Google Business Profile service areas for each branch" in p or "published Google Business Profile service areas" in p:
                    # replace the GBP-only source sentence with footprint wording
                    p2 = re.sub(r"Branch areas above are the published Google Business Profile service areas for each branch \(screenshots supplied by the owner 2026-10-27, confirmed 2026-10-28\)\.",
                                "Branch areas above are each branch's full service footprint: the published Google Business Profile service areas (Winchester 16, Martinsburg 14; screenshots supplied by the owner 2026-10-27, confirmed 2026-10-28) plus the extended areas from the live service-area.geojson feature branch properties (Winchester +15, Martinsburg +21).", p)
                    p2 = re.sub(r"Branch areas above are the published Google Business Profile service areas for each branch \(screenshots supplied by the owner 2026-10-27, confirmed 2026-10-28\)",
                                "Branch areas above are each branch's full service footprint: the published Google Business Profile service areas (Winchester 16, Martinsburg 14; screenshots supplied by the owner 2026-10-27, confirmed 2026-10-28) plus the extended areas from the live service-area.geojson feature branch properties (Winchester +15, Martinsburg +21)", p2)
                    out.append(f'<p class="sec-p">{bold(p2)}</p>')
                else:
                    out.append(f'<p class="sec-p">{bold(p)}</p>')
            out.append(f'<p class="sec-p">Shared by both branches (14): {esc(", ".join(SHARED))}.</p>')
            out.append(f'<p class="sec-p">GBP areas are from the Google Business Profile service-area screenshots supplied by the owner on 2026-10-27 and confirmed 2026-10-28 (Winchester 16, Martinsburg 14). Extended areas are from the live service-area.geojson feature branch properties, 2026-10-28 — NOT from GBP screenshots.</p>')
            parts.append("    " + "\n    ".join(out))
            parts.append('  </div></section>')
        elif header == "Related pages":
            chips = []
            for ln in body.split("\n"):
                ln = ln.strip()
                m = re.match(r"-\s*(.+?):\s*(https://theflatratemovers\.com/(.*?)/?)$", ln)
                if not m:
                    continue
                label, url, path = m.group(1), m.group(2), m.group(3)
                slug2 = path.strip("/") or "home"
                if slug2 == "":
                    slug2 = "home"
                if slug2 not in PAGE_SLUGS:
                    fail(f"{slug}: related URL slug not in pages array: {url} -> {slug2}")
                chips.append(f'<a class="chip" href="#/{slug2}">{esc(label)}</a>')
            parts.append('  <section class="block"><div class="wrap">')
            parts.append(f'    <h2 class="sec-h">Related pages</h2>')
            parts.append(f'    <div class="chips">{"".join(chips)}</div>')
            parts.append('  </div></section>')
        elif header == "Questions, answered":
            parts.append('  <section class="block"><div class="wrap">')
            parts.append(f'    <h2 class="sec-h">Questions, answered</h2>')
            # parse **Q?** then answer paras
            blocks = re.split(r"\n\s*\n", body)
            qi = 0
            while qi < len(blocks):
                b = blocks[qi].strip()
                qm = re.match(r"\*\*(.+?)\*\*$", b)
                if qm and qi + 1 < len(blocks):
                    q, a = qm.group(1), blocks[qi + 1].strip()
                    a_html = bold(a).replace("Get My Flat Rate Quote", '<a href="#/quote">Get My Flat Rate Quote</a>')
                    parts.append(f'    <p><b>{esc(q)}</b></p>')
                    parts.append(f'    <p class="sec-p">{a_html}</p>')
                    qi += 2
                else:
                    if b:
                        parts.append(f'    <p class="sec-p">{bold(b)}</p>')
                    qi += 1
            parts.append('  </div></section>')
        else:
            parts.append('  <section class="block"><div class="wrap">')
            parts.append("    " + section_html(header, body, {}))
            parts.append('  </div></section>')
    # published-data card (both branches, distinct)
    def branch_card_lines(place, bname):
        addr = place["address"]
        geo = place["geo"]
        hrs = {"winchester": "Mon-Fri 8-6, Sat 8-4, Sun 9-4", "martinsburg": "Mon-Fri 9-6, Sat 9-4, Sun 9-4"}[place["@id"].split("#")[-1]]
        r = place["aggregateRating"]
        return (f'<p>Branch: {esc(bname)}, {esc(addr["streetAddress"])}, {esc(addr["addressLocality"])}, {esc(addr["addressRegion"])} {esc(addr["postalCode"])} (geo {geo["latitude"]}, {geo["longitude"]})</p>\n'
                f'      <p>Hours: {hrs}</p>\n'
                f'      <p>Google rating: {r["ratingValue"]} with {r["reviewCount"]} review{"s" if str(r["reviewCount"]) != "1" else ""} — the per-branch Google rating for {esc(bname.split(",")[0])}, never blended with the other branch\'s</p>')
    parts.append('  <section class="block"><div class="wrap">')
    parts.append('    <div class="card">')
    parts.append('      <h3>Service area, published data &amp; quote</h3>')
    parts.append('      ' + branch_card_lines(win, "The Flat Rate Movers"))
    parts.append('      ' + branch_card_lines(mar, "Flat Rate Movers Martinsburg WV"))
    parts.append('      <p>Phone: +1-540-422-2153</p>')
    parts.append('      <p>Price range: $$</p>')
    parts.append('      <p>Founded: June 2010</p>')
    parts.append('      <p>Guaranteed Flat Rate or Your Move is Free!</p>')
    parts.append('      <p><a href="#/quote">Get My Flat Rate Quote</a> — Short (Quick Quote) by default, or Detailed Project; From, To, and What\'s moving stay filled in when you switch.</p>')
    parts.append('    </div>')
    parts.append('  </div></section>')
    # sources card
    src_lines = [
        "Service name and description — staged package 2026-10-29 (content, meta, schema verified READY)",
        "Branch name, address, geo, hours, service area — Google Business Profile check 2026-10-28, GBP screenshots supplied by owner 2026-10-27, Places verification 2026-10-27",
        "Full footprint (GBP lists + extended areas) — owner decision 2026-10-28: GBP areas from GBP service-area screenshots supplied by owner 2026-10-27, confirmed 2026-10-28 (Winchester 16, Martinsburg 14); extended areas from live service-area.geojson feature branch properties 2026-10-28, NOT from GBP screenshots. Branch assignment from GeoJSON branch properties only; shared areas noted as shared, never silently assigned to one branch.",
        "Google ratings per branch — Google Business Profile check 2026-10-28 (Winchester 5.0/1, Martinsburg 4.7/6, never blended)",
        "Image — company logo assets/img-01-9c77693ba66b.png, owner-approved as page image 2026-10-28; brand image, not a job photo",
        "Flat-rate terms and tagline — company tagline and quote-form wording, live site",
        "Slug — staged package 2026-10-29 (zero collisions in the registry)",
    ]
    if slug == "senior-moving":
        src_lines.insert(1, "Audience — GSC 3-month pull to 2026-10-27: 'senior moving' 75 impressions, position 1.0; 'senior movers near me' position 1.0")
        src_lines.insert(2, "Survey room — survey room build and live verification 2026-10-28: film-only walkthrough, human-made estimate")
        src_lines.insert(3, "SIR conditional scope — company thesis 2026-10-27: SIR applies only where a senior move actually involves a 1,500–3,500 lb asset, L/360")
    if slug == "warehouse-relocation":
        src_lines.insert(1, "SERP position — 'warehouse relocation services Virginia' position 1 via Industrial & Commercial Services page, SERP check 2026-10-29")
        src_lines.insert(2, "Standard Job Pricing — industrial page live content 2026-10-28/29: Unload $8.00/CWT, Load $10.00/CWT, APU $12.00/CWT, Residential/Driver Meet $400–$425 per man, quoted per job")
        src_lines.insert(3, "SIR conditional scope — company thesis 2026-10-27: SIR applies only where a warehouse move actually involves a 1,500–3,500 lb asset, L/360")
    if slug == "transloading-winchester-va":
        src_lines.insert(1, "SERP position — 'transloading services Virginia port container' position 3, first mover, SERP check 2026-10-29")
        src_lines.insert(2, "Process chain and commercial terms — ocean container datasets doc 2026-10-29, stated as domain facts; gated claims (terminals, drayage performer, chassis, reefer, bonded/FTZ, customs, equipment, OOG, handled types, container rates) are NOT claimed")
        src_lines.insert(3, "Company published steps — container deconsolidation reference (receive, unload, count, sort by destination, stage, build outbound) and logistics event protocol (quoted, surveyed, packed, loaded, transloaded, delivered, verified placement)")
    parts.append('  <section class="block"><div class="wrap">')
    parts.append('    <div class="card">')
    parts.append('      <h3>Sources &amp; attestation</h3>')
    for s in src_lines:
        parts.append(f'      <p style="font-size:.85rem">{esc(s)}</p>')
    parts.append('    </div>')
    parts.append('  </div></section>')
    parts.append('</div>')
    div = "\n".join(parts)
    # ---- verification of the generated div ----
    plain = re.sub(r"<[^>]+>", " ", div)
    plain = re.sub(r"\s+", " ", plain)
    if "dataset" in plain.lower() and slug == "warehouse-relocation":
        fail("warehouse div still mentions dataset")
    if "Google Business Profile, 16" in plain or "Google Business Profile, 14" in plain:
        fail(f"{slug}: GBP-only area label survived")
    if "full footprint, 31" not in plain or "full footprint, 35" not in plain:
        fail(f"{slug}: footprint counts missing from div")
    if "Get My Flat Rate Quote" not in plain:
        fail(f"{slug}: CTA missing")
    if "DESIGN 6" in div:
        fail(f"{slug}: DESIGN 6 string present")
    (OUT / f"{slug}.html").write_text(div + "\n")
    print(f"built div {slug}: {len(div)} chars, note: {ctx_note}")
    return div

build_page("senior-moving", "senior-moving", "Senior Moving")
build_page("warehouse-relocation", "warehouse-relocation", "Warehouse Relocation")
build_page("transloading-winchester-va", "transloading-winchester-va", "Transloading Services — Winchester VA")
print("STAGE3 OK")
