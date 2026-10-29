#!/usr/bin/env python3
"""Videos page deploy batch — merge the verified staged package into the live
site files. All edits are computed in memory with strict anchor assertions;
files are written only after every assertion passes. Backups were taken first
(out/videos-deploy/backup-2026-10-29/). Deploy + GitHub happen separately.
"""
import json, re, shutil, sqlite3, sys
from pathlib import Path

HOME = Path.home()
PUB = HOME / "workspace/the-flat-rate-movers-pages/public"
MACH = HOME / "workspace/the-flat-rate-machine"
PKG = MACH / "out/pages/videos-page"
BATCH = MACH / "out/videos-deploy"
DB = HOME / "workspace/theflatratemovers/rubric.db"
DEPLOY_DATE = "2026-10-29"

def die(msg):
    print("ABORT:", msg); sys.exit(1)

def rep(text, old, new, n=1, scope=""):
    c = text.count(old)
    if c != n:
        die(f"anchor count {c} != {n} [{scope}]: {old[:90]!r}")
    return text.replace(old, new)

def div_span(html, did):
    start = html.find(f'<div class="page" id="{did}"')
    if start < 0: die(f"div not found: {did}")
    nxt = html.find('<div class="page" id="', start + 10)
    foot = html.find('<footer', start)
    end = min([x for x in (nxt, foot) if x > 0])
    return start, end

def edit_div(html, did, fn):
    s, e = div_span(html, did)
    seg = fn(html[s:e])
    return html[:s] + seg + html[e:]

# ---------------------------------------------------------------- index.html
html = (PUB / "index.html").read_text(encoding="utf-8")
orig_len = len(html)

# --- 1. Sitemap page: counts 153->154 / 263->264 + videos row ---
def smap(seg):
    seg = rep(seg, "lists all 153 canonical pages", "lists all 154 canonical pages", scope="sitemap hero")
    seg = rep(seg, "<h3>153 canonical pages</h3>", "<h3>154 canonical pages</h3>", scope="sitemap card h3")
    seg = rep(seg, "— 153 with a page, a route and structured data", "— 154 with a page, a route and structured data", scope="sitemap card body")
    seg = rep(seg, "<h3>263 live URLs accounted for</h3>", "<h3>264 live URLs accounted for</h3>", scope="sitemap urls h3")
    seg = rep(seg, "153 canonical pages + 2 consolidated pages", "154 canonical pages + 2 consolidated pages", scope="sitemap urls body")
    seg = rep(seg, "Canonical pages — 153</p>", "Canonical pages — 154</p>", scope="sitemap kick")
    row_anchor = ('<a href="#/all-pages"><b>Browse All Pages</b></a><span class="smap-type">Page</span>'
                  '<span class="smap-url">https://theflatratemovers.com/all-pages/</span></div>')
    new_row = ('\n      <div class="smap-row"><a href="#/videos"><b>Videos — Moving &amp; Heavy-Asset Work on Video</b></a>'
               '<span class="smap-type">Page</span><span class="smap-url">https://theflatratemovers.com/videos/</span></div>')
    seg = rep(seg, row_anchor, row_anchor + new_row, scope="sitemap row insert")
    return seg
html = edit_div(html, "page-sitemap", smap)

# --- 2. Developer page: Videos data card after the Local & Regional card ---
VIDEOS_CARD = ('<article class="card"><h3>Videos data</h3><p><a href="/datasets-videos.json" target="_blank" rel="noopener">'
               '<b>datasets-videos.json →</b></a> — 6 published nodes from the company\'s own YouTube channel (@theflatratemovers), '
               'published as VideoObjects: household moving in Winchester and the DMV, three gun safe moves in Northern Virginia, '
               'a final-mile white-glove locker safe installation, and a medical tank relocation — 6 VideoObjects, 0 Datasets, '
               '0 Service data, 0 Articles; the videos themselves are the data, carried natively as VideoObjects. '
               'Page: <a href="/videos/">Videos</a> · Page JSON: <a href="/videos.json" target="_blank" rel="noopener">'
               '<b>videos.json →</b></a>.</p></article>')
def dev(seg):
    anchor = '<b>local-regional-moving.json →</b></a>.</p></article>'
    return rep(seg, anchor, anchor + VIDEOS_CARD, scope="developer card")
html = edit_div(html, "page-developer", dev)

# --- 3. All-pages: Videos chip next to the other collection pages ---
def allpages(seg):
    anchor = '<a class="chip" href="#/developer">🛠️ Developer</a>'
    return rep(seg, anchor, anchor + '<a class="chip" href="#/videos">🎬 Videos</a>', scope="all-pages chip")
html = edit_div(html, "page-all-pages", allpages)

# --- 4. Hub backlinks (anchors from backlinks.md) ---
def gunsafe(seg):
    anchor = 'Based in Winchester, VA &amp; Martinsburg, WV — serving the Shenandoah Valley &amp; the Eastern Panhandle.</p>'
    return rep(seg, anchor, anchor + '\n      <p>🎬 <a href="#/videos">Watch our gun safe moves on video</a></p>', scope="gunsafe link")
html = edit_div(html, "page-gunsafe", gunsafe)

def residential(seg):
    anchor = '<h3>📞 Start your home move</h3>'
    return rep(seg, anchor, '<p>🎬 <a href="#/videos">See a household move on video</a></p>' + anchor, scope="residential link")
html = edit_div(html, "page-residential", residential)

def commercial(seg):
    anchor = '<h3>📞 Plan your commercial move</h3>'
    return rep(seg, anchor, '<p>🎬 <a href="#/videos">Watch a commercial installation on video</a></p>' + anchor, scope="commercial link")
html = edit_div(html, "page-commercial", commercial)

def finalmile(seg):
    anchor = '<p><a href="#/quote">Get My Flat Rate Quote</a> — Short Quick Quote by default'
    return rep(seg, anchor, '<p>🎬 <a href="#/videos">Watch a final-mile white-glove installation</a></p>\n      ' + anchor, scope="final-mile link")
html = edit_div(html, "page-commercial-freight-handling-white-glove-final-mile-services", finalmile)

def heavy(seg):
    anchor = 'under the guarantee: Guaranteed Flat Rate or Your Move is Free!</p>'
    return rep(seg, anchor, anchor + '\n      <p>🎬 <a href="#/videos">Watch a medical tank relocation</a></p>', scope="heavy link")
html = edit_div(html, "page-heavy", heavy)

# --- 5. pageMeta entry (anchored insert at the object close, before setPageLD) ---
pm_anchor = "\n  };\n  function setPageLD(h){"
if html.count(pm_anchor) != 1: die("pageMeta close anchor not unique")
i = html.find(pm_anchor)
pm_entry = ("     videos:{name:'Videos — Moving & Heavy-Asset Work on Video', svc:null, "
            "canonical:'https://theflatratemovers.com/videos/', "
            "desc:'Videos from The Flat Rate Movers\\' own YouTube channel (@theflatratemovers): household moving in Winchester and the DMV, "
            "heavy gun safe moves in Northern Virginia, a final-mile white-glove locker safe installation, and a medical tank relocation — "
            "the company\\'s own published videos, embedded from YouTube. Guaranteed Flat Rate or Your Move is Free!'}")
html = html[:i] + pm_entry + html[i:]

# --- 6. New page div before <footer> ---
div_draft = (PKG / "page-div-draft.html").read_text(encoding="utf-8").strip()
if '<div class="page" id="page-videos">' not in div_draft: die("draft div id missing")
if 'id="page-videos"' in html: die("page-videos already present in index.html")
foot = html.find("<footer")
if foot < 0: die("footer not found")
html = html[:foot] + div_draft + "\n" + html[foot:]
if html.count('id="page-videos"') != 1: die("page-videos count != 1 after insert")
if len(re.findall(r'<div class="page" id="page-', html)) != 154: die("page div count != 154")

# ---------------------------------------------------------------- sitemap.xml
sitemap = (PUB / "sitemap.xml").read_text(encoding="utf-8")
if sitemap.count("<loc>") != 153: die("sitemap baseline != 153")
sitemap = rep(sitemap, "</urlset>",
              '  <url><loc>https://theflatratemovers.com/videos/</loc><lastmod>2026-10-29</lastmod></url>\n</urlset>',
              scope="sitemap append")
if sitemap.count("<loc>") != 154: die("sitemap after != 154")
if sitemap.count("https://theflatratemovers.com/videos/</loc>") != 1: die("videos loc count != 1")

# ---------------------------------------------------------------- ai-sitemap (public + phase-a staged)
HASPART_ANCHOR = ('      "name": "Transloading Services — Winchester VA",\n'
                  '      "url": "https://theflatratemovers.com/transloading-winchester-va/"\n'
                  '    }\n  ],')
HASPART_NEW = ('      "name": "Transloading Services — Winchester VA",\n'
               '      "url": "https://theflatratemovers.com/transloading-winchester-va/"\n'
               '    },\n'
               '    {\n'
               '      "@type": "WebPage",\n'
               '      "name": "Videos — Moving & Heavy-Asset Work on Video",\n'
               '      "url": "https://theflatratemovers.com/videos/"\n'
               '    }\n  ],')
def fix_ai(path):
    raw = path.read_text(encoding="utf-8")
    raw = rep(raw, "153 clean canonical URLs in sitemap.xml", "154 clean canonical URLs in sitemap.xml", scope=f"{path} desc")
    raw = rep(raw, HASPART_ANCHOR, HASPART_NEW, scope=f"{path} hasPart")
    d = json.loads(raw)
    assert len(d["hasPart"]) == 154, (path, len(d["hasPart"]))
    assert len(d["services"]) == 22, (path, len(d["services"]))
    return raw, len(d["keywords"])
ai_pub, ai_pub_kw = fix_ai(PUB / "ai-sitemap.json")
ai_staged, ai_staged_kw = fix_ai(MACH / "out/phase-a/ai-sitemap.json")

# ---------------------------------------------------------------- llms.txt (public)
llms = (PUB / "llms.txt").read_text(encoding="utf-8")
VIDEOS_LINE = ("- [Videos — Moving & Heavy-Asset Work on Video](https://theflatratemovers.com/videos/): Videos from The Flat Rate "
               "Movers' own YouTube channel (@theflatratemovers) — household moving in Winchester and the DMV, heavy gun safe moves "
               "in Northern Virginia, a final-mile white-glove locker safe installation, and a medical tank relocation, embedded from YouTube.")
m = re.search(r"^- \[Transloading Services — Winchester VA\]\(https://theflatratemovers\.com/transloading-winchester-va/\)[^\n]*\n", llms, re.M)
if not m: die("llms transloading line not found")
llms = llms[:m.end()] + VIDEOS_LINE + "\n" + llms[m.end():]
llms = rep(llms, "153 clean canonical URLs (no hash URLs)", "154 clean canonical URLs (no hash URLs)", scope="llms sitemap clause")
LLMS_ENTRY = (
"\n## Update — 2026-10-29 (videos page)\n"
"- New page published: Videos — Moving & Heavy-Asset Work on Video (https://theflatratemovers.com/videos/), a collection page with no service node claimed; pages 153 → 154, services unchanged at 22. The page embeds six videos from the company's own YouTube channel (@theflatratemovers), each verified 2026-10-29 via YouTube oEmbed and the videos' own YouTube pages: household moving in Winchester and the DMV (29L981tzn5E), three gun safe moves in Northern Virginia (Z7Im5nR--AQ; HLGSTQ5byxM; _W6wheqTGIE — a 900 lb Browning ProSteel 1878 Series safe), a final-mile delivery and white-glove installation of a 1,800 lb locker safe system (1S5Tux0-4lM), and a medical tank relocation (AX4oWENjxJo).\n"
"- Machine data published: https://theflatratemovers.com/videos.json (8 nodes: the WebPage/CollectionPage node, 6 VideoObjects, BreadcrumbList) and https://theflatratemovers.com/datasets-videos.json (the 6 VideoObjects — the videos themselves are the data, published natively as VideoObjects; no Dataset node is created for this page). Durations and upload dates are not published: no source checked on 2026-10-29 states them, so both fields are omitted everywhere rather than estimated. No view counts are published.\n"
"- Inbound links added: Developer page Videos data entry, Browse All Pages index entry, sitemap page row, and watch-on-video links from the Gun Safe Moving, Residential Moving, and Commercial Moving hubs, the final-mile/white-glove services page, and the Heavy Asset Authority page.\n")
if not llms.endswith("\n"): llms += "\n"
llms = llms + LLMS_ENTRY

# staged llms: count clause only (verify.js parity artifact)
llms_staged_path = MACH / "out/phase-a/llms.txt"
llms_staged = llms_staged_path.read_text(encoding="utf-8")
llms_staged = rep(llms_staged, "153 clean canonical URLs", "154 clean canonical URLs", scope="staged llms clause")

# ---------------------------------------------------------------- data txt (public)
data = (PUB / "the-flat-rate-movers-data.txt").read_text(encoding="utf-8")
data = rep(data, "Cloudflare Pages, 153 clean canonical URLs in sitemap.xml", "Cloudflare Pages, 154 clean canonical URLs in sitemap.xml", scope="data txt live-site line")
data = rep(data, "Sitemap now 153 clean canonical URLs.", "Sitemap now 154 clean canonical URLs.", scope="data txt sitemap-now line")
DATA_ENTRY = (
"\n## Update 2026-10-29 — videos page\n"
"- New page published: Videos — Moving & Heavy-Asset Work on Video (https://theflatratemovers.com/videos/), a collection page with no service node; pages 153 → 154, services unchanged at 22.\n"
"- Six videos published on the page, all from the company's own YouTube channel (@theflatratemovers), verified 2026-10-29 via YouTube oEmbed and the videos' own YouTube pages: 29L981tzn5E \"DMV Moving Made Easy: Top-Rated Movers in Winchester & Beyond! (#WinchesterVA #MoversVA #DMVMovers)\" (household moving, Winchester and the DMV); Z7Im5nR--AQ \"Moving a Heavy Gun Safe? We Can Help! Flat Rate Movers (VA)\" (gun safe, Northern Virginia); HLGSTQ5byxM \"The Flat Rate Movers of Winchester: Safe and Reliable Gun Safe Moving in Northern Virginia\" (gun safe, Northern Virginia); 1S5Tux0-4lM \"Final Mile Delivery & White Glove Safe Installation | 1,800 lb Locker System (Full Process)\" (final-mile delivery and white-glove installation, commercial); AX4oWENjxJo \"Medical Tank Relocation: Experts for Your Sensitive Equipment\" (medical and sensitive equipment); _W6wheqTGIE \"Gun Safe Movers Moving a 900 lb Gun Safe BROWNING PROSTEEL 1878 SERIES\" (gun safe, 900 lb Browning ProSteel 1878 Series).\n"
"- Machine files created: videos.json (per-page graph, 8 nodes: WebPage/CollectionPage, 6 VideoObjects, BreadcrumbList) and datasets-videos.json (6 VideoObject nodes; the videos are the data — no Dataset node is created for this page). Duration and upload date are unpublished for all six videos: no source checked on 2026-10-29 states them, so both fields are omitted rather than estimated. No view counts published.\n")
if not data.endswith("\n"): data += "\n"
data = data + DATA_ENTRY

# ---------------------------------------------------------------- pages.json registry
pj_path = MACH / "data/pages.json"
pj = pj_path.read_text(encoding="utf-8")
pj = rep(pj, '"count": 153,', '"count": 154,', scope="pages.json count")
tail_anchor = "    }\n  ]\n}"
if not pj.rstrip("\n").endswith(tail_anchor): die("pages.json tail shape unexpected")
ENTRY = (',\n    {\n'
         '      "slug": "videos",\n'
         '      "url": "https://theflatratemovers.com/videos/",\n'
         '      "title": "Videos — Moving & Heavy-Asset Work on Video",\n'
         '      "type": "page",\n'
         '      "services": [],\n'
         '      "lastmod": "2026-10-29",\n'
         '      "status": "live",\n'
         '      "source": "live sitemap.xml + pageMeta in live site source",\n'
         '      "attested": "2026-10-29"\n'
         '    }')
idx = pj.rfind("    }\n  ]")
pj = pj[:idx] + "    }" + ENTRY + pj[idx + len("    }"):]
d = json.loads(pj)
assert d["count"] == 154 and len(d["pages"]) == 154
assert len({p["slug"] for p in d["pages"]}) == 154
assert d["pages"][-1]["slug"] == "videos" and d["pages"][-1]["services"] == []

# ---------------------------------------------------------------- new public JSON files
videos_json = (PKG / "schema.json").read_text(encoding="utf-8")
datasets_json = (PKG / "datasets-videos.json").read_text(encoding="utf-8")
vj = json.loads(videos_json); dj = json.loads(datasets_json)
assert len(vj["@graph"]) == 8, len(vj["@graph"])
assert len(dj["@graph"]) == 6 and all(n["@type"] == "VideoObject" for n in dj["@graph"])
for blob, name in ((videos_json, "schema.json"), (datasets_json, "datasets-videos.json")):
    if "uploadDate" in blob or '"duration"' in blob: die(f"forbidden key in {name}")
    if "dateModified" in blob: die(f"unexpected dateModified in {name}")

# in-div JSON-LD must be parse-equal to datasets-videos.json @graph
mm = re.search(r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>', div_draft, re.S)
if not mm: die("in-div JSON-LD not found in draft")
indiv = json.loads(mm.group(1))
assert indiv["@graph"] == dj["@graph"], "in-div graph != datasets graph"

# ---------------------------------------------------------------- WRITE FILES
(PUB / "index.html").write_text(html, encoding="utf-8")
(PUB / "sitemap.xml").write_text(sitemap, encoding="utf-8")
(PUB / "ai-sitemap.json").write_text(ai_pub, encoding="utf-8")
(MACH / "out/phase-a/ai-sitemap.json").write_text(ai_staged, encoding="utf-8")
(PUB / "llms.txt").write_text(llms, encoding="utf-8")
llms_staged_path.write_text(llms_staged, encoding="utf-8")
(PUB / "the-flat-rate-movers-data.txt").write_text(data, encoding="utf-8")
pj_path.write_text(pj, encoding="utf-8")
(PUB / "videos.json").write_text(videos_json, encoding="utf-8")
(PUB / "datasets-videos.json").write_text(datasets_json, encoding="utf-8")
shutil.copyfile(HOME / "workspace/theflatratemovers/videos-page-research-2026-10-29.md",
                BATCH / "videos-page-research-2026-10-29.md")

# ---------------------------------------------------------------- rubric DB attestation rows
SRC = "Videos page package 2026-10-29; YouTube oEmbed + YouTube video pages fetched 2026-10-29"
EV = "public/videos.json; public/datasets-videos.json; public/index.html (page-videos)"
rows = [
    ("Videos page published: Videos — Moving & Heavy-Asset Work on Video, slug videos, canonical https://theflatratemovers.com/videos/, a collection page with no service node (pageMeta svc null, registry type page, services []); site pages 153 → 154, services unchanged at 22",
     SRC, DEPLOY_DATE, "public/index.html (page-videos, pageMeta); data/pages.json; public/sitemap.xml"),
    ("Video 29L981tzn5E published on the Videos page: \"DMV Moving Made Easy: Top-Rated Movers in Winchester & Beyond! (#WinchesterVA #MoversVA #DMVMovers)\" — The Flat Rate Movers' own YouTube channel (@theflatratemovers); scope: household moving, Winchester and the DMV", SRC, DEPLOY_DATE, EV),
    ("Video Z7Im5nR--AQ published on the Videos page: \"Moving a Heavy Gun Safe? We Can Help! Flat Rate Movers (VA)\" — The Flat Rate Movers' own YouTube channel (@theflatratemovers); scope: gun safe moving, a 1,500 lb safe up a hill, Northern Virginia", SRC, DEPLOY_DATE, EV),
    ("Video HLGSTQ5byxM published on the Videos page: \"The Flat Rate Movers of Winchester: Safe and Reliable Gun Safe Moving in Northern Virginia\" — The Flat Rate Movers' own YouTube channel (@theflatratemovers); scope: gun safe moving, Northern Virginia", SRC, DEPLOY_DATE, EV),
    ("Video 1S5Tux0-4lM published on the Videos page: \"Final Mile Delivery & White Glove Safe Installation | 1,800 lb Locker System (Full Process)\" — The Flat Rate Movers' own YouTube channel (@theflatratemovers); scope: commercial final-mile delivery and white-glove installation, 1,800 lb locker safe system", SRC, DEPLOY_DATE, EV),
    ("Video AX4oWENjxJo published on the Videos page: \"Medical Tank Relocation: Experts for Your Sensitive Equipment\" — The Flat Rate Movers' own YouTube channel (@theflatratemovers); scope: medical tank relocation, sensitive heavy-asset equipment", SRC, DEPLOY_DATE, EV),
    ("Video _W6wheqTGIE published on the Videos page: \"Gun Safe Movers Moving a 900 lb Gun Safe BROWNING PROSTEEL 1878 SERIES\" — The Flat Rate Movers' own YouTube channel (@theflatratemovers); scope: gun safe moving, 900 lb Browning ProSteel 1878 Series", SRC, DEPLOY_DATE, EV),
    ("Duration and upload date are unpublished for all six videos on the Videos page: no source checked on 2026-10-29 (YouTube oEmbed, the YouTube video pages, search by video ID and title) states them, so both fields are omitted from the page and its data files rather than estimated; no view counts are published",
     SRC, DEPLOY_DATE, "videos-page-research-2026-10-29.md; public/datasets-videos.json"),
]
con = sqlite3.connect(DB)
before = con.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
con.executemany("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?,?,?,?)", rows)
con.commit()
after = con.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
integ = con.execute("PRAGMA integrity_check").fetchone()[0]
counts = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
          for t in ("service", "attestation", "edge", "opening_hours", "service_area", "rubric_check")}
con.close()
assert after - before == 8 and integ == "ok", (before, after, integ)

print("MERGE OK")
print(f"index.html: {orig_len} -> {len(html)} chars; page divs 153 -> 154")
print(f"ai-sitemap public keywords={ai_pub_kw}, staged keywords={ai_staged_kw} (unchanged by design)")
print(f"DB counts: {counts}; integrity={integ}; attestation {before} -> {after}")
