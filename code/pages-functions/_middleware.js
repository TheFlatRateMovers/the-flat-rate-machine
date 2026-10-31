// Batch 9 (2026-10-29) — per-URL head resolution for the SPA.
// Every canonical URL of the estate serves the same SPA document; this
// middleware rewrites ONLY the <head> of that document, per request, so
// each of the 156 canonical URLs serves its own title, meta description,
// canonical, Open Graph set, and page-specific JSON-LD — while the body,
// the router, and the quote form reach the browser byte-identical.
// Head data: ./head-data.js (generated from pageMeta + setPageLD() in
// index.html, data/pages.json, and each page's published per-page JSON).
// Mechanism: the asset response is read in full at the edge (it is
// served from the same PoP), the anchored replacements are applied to
// its head (the first ~54 KB), and the reassembled document is
// returned. A streamed variant was prototyped first and rejected on
// evidence: under a sequential 156-route test the streamed responses
// truncated intermittently (55-111 of 156 runs) while the buffered
// form and the unmodified asset both delivered 156/156 complete.
// Unknown paths, non-GET requests, non-HTML responses, and any
// response whose head lacks the expected markers pass through
// unchanged (fail-open per response; the Batch 9 route test asserts
// all 156 routes transform).
// Blog foundation (2026-10-30): unknown paths no longer pass through —
// a GET/HEAD path that is not a known page, a deployed static file, an
// /api/ route or a /cdn-cgi/ platform path returns the genuine 404
// below. Non-GET/HEAD traffic still passes through untouched.
import { HEAD } from './head-data.js';

/*__STATIC_FILES_BEGIN__*/
// Every file in the deployed public/ tree (blog foundation batch,
// 2026-10-30). A GET/HEAD path that is neither a known page (HEAD
// map) nor one of these files, nor /api/ or /cdn-cgi/, is a genuine
// 404. Regenerate this block whenever the public/ tree changes.
const STATIC_FILES = new Set([
  "/.well-known/ai-catalog.json",
  "/.well-known/ard.json",
  "/.well-known/signing-keys.json",
  "/1600-lb-gun-safe-moving-winchester-va-to-las-vegas-nv.json",
  "/ai-catalog.json",
  "/ai-license.json",
  "/ai-master-index.json",
  "/ai-master-index.jws",
  "/ai-sitemap.json",
  "/all-pages.json",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/apple-touch-icon.png",
  "/areas-served.json",
  "/assets/img-01-9c77693ba66b-176.webp",
  "/assets/img-01-9c77693ba66b.png",
  "/assets/img-01-9c77693ba66b.webp",
  "/assets/img-02-0b80bbb82653-1200.webp",
  "/assets/img-02-0b80bbb82653-700.webp",
  "/assets/img-02-0b80bbb82653-900.webp",
  "/assets/img-02-0b80bbb82653.jpg",
  "/assets/img-02-0b80bbb82653.webp",
  "/assets/img-03-06ba6c3aa9ad-700.webp",
  "/assets/img-03-06ba6c3aa9ad-900.webp",
  "/assets/img-03-06ba6c3aa9ad.jpg",
  "/assets/img-03-06ba6c3aa9ad.webp",
  "/assets/img-04-d5b531df0d68-700.webp",
  "/assets/img-04-d5b531df0d68-900.webp",
  "/assets/img-04-d5b531df0d68.jpg",
  "/assets/img-04-d5b531df0d68.webp",
  "/assets/img-05-ac47769e6932-700.webp",
  "/assets/img-05-ac47769e6932-900.webp",
  "/assets/img-05-ac47769e6932.jpg",
  "/assets/img-05-ac47769e6932.webp",
  "/assets/img-06-c9f70ae11116-700.webp",
  "/assets/img-06-c9f70ae11116-900.webp",
  "/assets/img-06-c9f70ae11116.jpg",
  "/assets/img-06-c9f70ae11116.webp",
  "/assets/img-07-b39ba374a49a-900.webp",
  "/assets/img-07-b39ba374a49a.jpg",
  "/assets/img-07-b39ba374a49a.webp",
  "/assets/img-08-845680b78b80.jpg",
  "/assets/img-08-845680b78b80.webp",
  "/assets/img-10-6749f9c6cd8e.jpg",
  "/assets/img-10-6749f9c6cd8e.webp",
  "/assets/img-11-6f42b2beebea.jpg",
  "/assets/img-11-6f42b2beebea.webp",
  "/assets/img-12-c5167cca7047.jpg",
  "/assets/img-12-c5167cca7047.webp",
  "/assets/img-13-d15077b65507.jpg",
  "/assets/img-13-d15077b65507.webp",
  "/assets/img-14-8e3ed7b85836.jpg",
  "/assets/img-14-8e3ed7b85836.webp",
  "/assets/img-15-6ff0065cf230.jpg",
  "/assets/img-15-6ff0065cf230.webp",
  "/assets/img-16-80538678edc8.jpg",
  "/assets/img-16-80538678edc8.webp",
  "/assets/img-18-blurred-warehouse-1.jpg",
  "/assets/img-18-blurred-warehouse-1.webp",
  "/assets/img-19-blurred-warehouse-2.jpg",
  "/assets/img-19-blurred-warehouse-2.webp",
  "/assets/img-20-custom-crate-foam-lined-ramp-door.webp",
  "/assets/img-21-robotic-arm-custom-wrapped-skid-mounted.webp",
  "/assets/img-22-antique-fireproof-safe.webp",
  "/author-ratemoversgmail-com.json",
  "/best-json-entity-graph.json",
  "/blog.json",
  "/calibration-safe-moving.json",
  "/case-study-3500lb-safe-moving-winchester-va.json",
  "/category-logistics.json",
  "/category-long-distance-moving.json",
  "/category-maritime-shipping.json",
  "/category-military-government-moving.json",
  "/category-museum-logistics.json",
  "/category-office-commercial-moving.json",
  "/category-rigging-sir-2026-high-value-rigging.json",
  "/category-rigging-sir-2026.json",
  "/category-shenandoah-valley-logistics.json",
  "/category-vault-moving.json",
  "/category-winchester-va-residential-logistics-relocation-services-moving-eastern-panhandle-moving.json",
  "/category-winchester-va-residential-logistics-relocation-services-moving-estate-relocation.json",
  "/category-winchester-va-residential-logistics-relocation-services-moving-long-distance.json",
  "/category-winchester-va-residential-logistics-relocation-services-moving.json",
  "/category-winchester-va-residential-logistics-relocation-services-paper-padding.json",
  "/category-winchester-va-residential-logistics-relocation-services.json",
  "/category-winchester-va-residential-logistics.json",
  "/category-winchester-va-top-rated-movers-winchester-va.json",
  "/category-winchester-va.json",
  "/commercial-freight-handling-solutions.json",
  "/commercial-freight-handling-white-glove-final-mile-services.json",
  "/commercial-movers-winchester-va.json",
  "/commercial-moving.json",
  "/commercial-office-moving-2.json",
  "/container-deconsolidation-cross-docking-transloading-services-virginia.json",
  "/container-deconsolidation-services-virginia-mid-atlantic.json",
  "/container-deconsolidation.json",
  "/container-loading-unloading-services-port-transload-virginia.json",
  "/crating-movers-martinsburg-wv.json",
  "/curbside-vs-inside-vs-white-glove-delivery.json",
  "/data-center-relocation.json",
  "/dataset-commercial.json",
  "/dataset-crating.json",
  "/dataset-data-center-relocation.json",
  "/dataset-ffe-logistics.json",
  "/dataset-final-mile.json",
  "/dataset-government.json",
  "/dataset-gun-safe.json",
  "/dataset-industrial-commercial.json",
  "/dataset-industrial-offices.json",
  "/dataset-intent-coverage.json",
  "/dataset-ispm15.json",
  "/dataset-it.json",
  "/dataset-junk-removal.json",
  "/dataset-local-regional.json",
  "/dataset-long-distance.json",
  "/dataset-medical-lab-relocation.json",
  "/dataset-military.json",
  "/dataset-moving-and-storage.json",
  "/dataset-ocean-container.json",
  "/dataset-office.json",
  "/dataset-packing.json",
  "/dataset-piano-antique.json",
  "/dataset-residential.json",
  "/dataset-route81.json",
  "/dataset-senior.json",
  "/dataset-sir-heavy.json",
  "/dataset-transloading-inland-port.json",
  "/dataset-transloading-winchester.json",
  "/dataset-transloading.json",
  "/dataset-videos.json",
  "/dataset-warehouse-racking-relocation.json",
  "/dataset-warehouse.json",
  "/datasets-commercial.json",
  "/datasets-crating.json",
  "/datasets-data-center-relocation.json",
  "/datasets-ffe-logistics.json",
  "/datasets-final-mile.json",
  "/datasets-government.json",
  "/datasets-gun-safe.json",
  "/datasets-industrial-commercial.json",
  "/datasets-industrial-offices.json",
  "/datasets-intent-coverage.json",
  "/datasets-ispm15.json",
  "/datasets-it.json",
  "/datasets-junk-removal.json",
  "/datasets-local-regional.json",
  "/datasets-long-distance.json",
  "/datasets-medical-lab-relocation.json",
  "/datasets-military.json",
  "/datasets-moving-and-storage.json",
  "/datasets-ocean-container.json",
  "/datasets-office.json",
  "/datasets-packing.json",
  "/datasets-piano-antique.json",
  "/datasets-residential.json",
  "/datasets-route81.json",
  "/datasets-senior.json",
  "/datasets-sir-heavy.json",
  "/datasets-transloading-inland-port.json",
  "/datasets-transloading-winchester.json",
  "/datasets-transloading.json",
  "/datasets-videos.json",
  "/datasets-warehouse-racking-relocation.json",
  "/datasets-warehouse.json",
  "/datasets.json",
  "/developer.json",
  "/do-movers-pack-for-you.json",
  "/docs-data-center-logistics.json",
  "/docs-logistics-event-protocol.json",
  "/docs-logistics-ontology.json",
  "/docs.json",
  "/elite-asset-transition-white-glove-discreet-logistics.json",
  "/emergency-port-container-recovery-twic-labor-virginia.json",
  "/entities.json",
  "/entity-authority-layer.json",
  "/entity-graph.json",
  "/export.json",
  "/faq.json",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/favicon.ico",
  "/ffe-logistics.json",
  "/final-mile-movers-martinsburg-wv.json",
  "/find-us.json",
  "/flat-rate-guarantee.json",
  "/flat-rate-moving-quote-winchester.json",
  "/freight-services.json",
  "/full-service-packing-unpacking-systematic-asset-encapsulation.json",
  "/government-movers-martinsburg-wv.json",
  "/government-movers-winchester-va.json",
  "/gun-safe-movers-martinsburg-wv.json",
  "/gun-safe-movers-winchester-va.json",
  "/gun-safe-movers.json",
  "/heavy.json",
  "/high-mass-logistics-long-distance-moving-winchester-va.json",
  "/home.json",
  "/how-container-deconsolidation-cross-docking-transloading-supports-virginia-freight-networks.json",
  "/how-container-loading-unloading-services-improve-port-logistics.json",
  "/how-international-export-packing-crating-protects-global-shipments.json",
  "/how-port-of-virginia-logistics-supports-east-coast-freight-movement.json",
  "/how-to-pack-for-interstate-move.json",
  "/i-81-shenandoah-valley-move-timing.json",
  "/index.html",
  "/industrial-commercial-movers-martinsburg-wv.json",
  "/industrial-commercial-movers-winchester-va.json",
  "/industrial-commercial-services.json",
  "/industrial-offices-movers-martinsburg-wv.json",
  "/industrial-offices-movers-winchester-va.json",
  "/industrial-offices-moving.json",
  "/industrial-rigging-high-mass-logistics-hub-winchester-va.json",
  "/international-export-packing-crating-winchester-va.json",
  "/interstate-66-corridor.json",
  "/interstate-70-corridor.json",
  "/interstate-moving-guide-winchester-va.json",
  "/interstate-moving-network.json",
  "/interstate-moving-winchester-va.json",
  "/ispm15-movers-martinsburg-wv.json",
  "/it-equipment-moving-data-center-logistics-services-virginia.json",
  "/junk-removal.json",
  "/knowledge-entities.json",
  "/knowledge-equipment.json",
  "/knowledge-events.json",
  "/knowledge-locations.json",
  "/knowledge-services.json",
  "/llms.txt",
  "/local-regional-movers-martinsburg-wv.json",
  "/local-regional-movers-winchester-va.json",
  "/local-regional-moving.json",
  "/logistics-data-engineering-center.json",
  "/logistics-transportation.json",
  "/long-distance-cross-country-moving.json",
  "/long-distance-gun-safe-moving-winchester-va-to-las-vegas-nv.json",
  "/long-distance-movers-martinsburg-wv.json",
  "/long-distance-movers-miami.json",
  "/long-distance-movers-winchester-va-guide.json",
  "/long-distance-movers-winchester-va.json",
  "/looking-for-the-best-movers-near-me-your-guide-to-stress-free-moving-in-winchester-and-martinsburg.json",
  "/martinsburg-wv-movers-full-service-guide.json",
  "/medical-lab-equipment-relocation.json",
  "/military-government-hhg-moving-requirements-contractors.json",
  "/military-government-moving.json",
  "/military-movers-martinsburg-wv.json",
  "/military-movers-winchester-va.json",
  "/moving-a-piano.json",
  "/moving-and-storage.json",
  "/moving-company-martinsburg-wv.json",
  "/moving-company-winchester-va.json",
  "/moving-cost-guide-winchester-va.json",
  "/moving-questions-answers.json",
  "/moving-tips-winchester-va.json",
  "/office-moving-movers-martinsburg-wv.json",
  "/office-moving-movers-winchester-va.json",
  "/online-estimate.json",
  "/packing-cost-winchester-va.json",
  "/packing-movers-martinsburg-wv.json",
  "/packing-services-winchester-va.json",
  "/packing-unpacking-services-2.json",
  "/piano-antique-movers-martinsburg-wv.json",
  "/port-logistics.json",
  "/port-of-virginia-container-loading-unloading-logistics-services.json",
  "/privacy-policy.json",
  "/professional-packing-services-moving-cost-estimator.json",
  "/quote.json",
  "/reading-an-ispm-15-mark.json",
  "/recursive-indexing-layer.json",
  "/reliable-movers-in-martinsburg-wv.json",
  "/relocation-engineering-framework.json",
  "/relocation-engineering-standards-portal.json",
  "/residential-moving.json",
  "/robots.txt",
  "/route81.json",
  "/safe-moving-protocol.json",
  "/senior-moving.json",
  "/service-area.geojson",
  "/service-areas-moving-company.json",
  "/services.json",
  "/sir-2026-protocol.json",
  "/sir-2026-structural-integrity-relocation-protocol.json",
  "/sir-heavy-movers-martinsburg-wv.json",
  "/site.webmanifest",
  "/sitemap.json",
  "/sitemap.xml",
  "/specialized-workforce-labor.json",
  "/technical-rigging-high-security-gun-safe-vault-relocation.json",
  "/technical-rigging-standards.json",
  "/the-data-science-of-displacement-how-predictive-analytics-is-redefining-the-mid-atlantic-relocation-path.json",
  "/the-flat-rate-logistics-data-hub.json",
  "/the-flat-rate-movers-data.txt",
  "/the-invisible-risk-of-high-mass-relocation.json",
  "/the-strategic-roadmap-for-long-distance-residential-relocation.json",
  "/top-10-moving-tips-for-a-stress-free-move-in-2026.json",
  "/top-rated-movers-mid-atlantic.json",
  "/transloading-movers-martinsburg-wv.json",
  "/transloading-winchester-va.json",
  "/videos.json",
  "/virginia-inland-port-freight-transloading-operations.json",
  "/virginia-inland-port-transloading.json",
  "/virginia-to-california-movers.json",
  "/virginia-to-florida-movers.json",
  "/virginia-to-nevada-movers.json",
  "/virginia-to-new-york-movers.json",
  "/virginia-to-texas-movers.json",
  "/warehouse-racking-relocation.json",
  "/warehouse-relocation.json",
  "/when-an-item-needs-a-custom-crate.json",
  "/white-glove-delivery-winchester-va.json",
  "/yandex_e8746618021b9788.html"
]);
/*__STATIC_FILES_END__*/

const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Page Not Found — The Flat Rate Movers</title>
<style>
body{margin:0;font-family:Georgia,'Times New Roman',serif;background:#f7f3ee;color:#1c2733}
.band{background:linear-gradient(120deg,#0c2340,#16345c 58%,#1e4d38);color:#fff;padding:56px 20px 44px;text-align:center}
.band .name{font-size:15px;letter-spacing:2.5px;text-transform:uppercase;color:#e8b98a;margin:0 0 14px}
.band h1{font-size:34px;margin:0 0 12px;font-weight:600}
.band p{margin:0 auto;max-width:560px;font-size:17px;line-height:1.55;color:#dbe5f0}
.wrap{max-width:640px;margin:0 auto;padding:34px 20px 54px;text-align:center}
.btn{display:inline-block;margin:8px 6px;padding:13px 22px;border-radius:8px;background:#b0703c;color:#fff;text-decoration:none;font-size:16px}
.btn.alt{background:#0c2340}
p.addr{font-size:15px;line-height:1.7;color:#44536a}
a{color:#8a5427}
</style>
</head>
<body>
<div class="band">
<p class="name">The Flat Rate Movers</p>
<h1>Page not found</h1>
<p>The page you asked for is not on this site. The address may be mistyped, or the page may have moved into the sitemap below.</p>
</div>
<div class="wrap">
<a class="btn" href="https://theflatratemovers.com/#/quote">Get My Flat Rate Quote</a>
<a class="btn alt" href="/">Home</a>
<a class="btn alt" href="/all-pages/">All pages</a>
<p class="addr">Prefer to talk? Call <a href="tel:+15404222153">+1-540-422-2153</a>.<br>
Winchester, VA: 116 W Piccadilly St, Suite 11, 22601<br>
Martinsburg, WV: 736 Williamsport Pike, Suite 2, 25404<br>
Guaranteed Flat Rate or Your Move is Free!</p>
</div>
</body>
</html>`;


const HEAD_END = '</head>';

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function escText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function transformHead(headHtml, entry, pageJsonText) {
  let h = headHtml;
  const rep = (re, fn) => { h = h.replace(re, fn); };
  rep(/<title>[^<]*<\/title>/, () => '<title>' + escText(entry.t) + '</title>');
  rep(/(<meta name="description" content=")[^"]*(")/, (m, a, b) => a + escAttr(entry.d) + b);
  rep(/(<meta property="og:title" content=")[^"]*(")/, (m, a, b) => a + escAttr(entry.t) + b);
  rep(/(<meta property="og:description" content=")[^"]*(")/, (m, a, b) => a + escAttr(entry.d) + b);
  rep(/(<meta property="og:url" content=")[^"]*(")/, (m, a, b) => a + escAttr(entry.c) + b);
  rep(/(<meta property="og:type" content=")[^"]*(")/, (m, a, b) => a + entry.og + b);
  rep(/(<meta property="og:image" content=")[^"]*(")/, (m, a, b) => a + escAttr(entry.img) + b);
  rep(/(<meta name="twitter:title" content=")[^"]*(")/, (m, a, b) => a + escAttr(entry.t) + b);
  rep(/(<meta name="twitter:description" content=")[^"]*(")/, (m, a, b) => a + escAttr(entry.d) + b);
  rep(/(<meta name="twitter:image" content=")[^"]*(")/, (m, a, b) => a + escAttr(entry.img) + b);
  rep(/(<link rel="canonical" id="canonicalLink" href=")[^"]*(")/, (m, a, b) => a + escAttr(entry.c) + b);
  rep(/<script type="application\/ld\+json" id="page-jsonld"><\/script>/,
    () => '<script type="application/ld+json" id="page-jsonld">' + entry.ld + '</script>');
  if (entry.imgSwapped) {
    // The width/height/alt metas describe the default image only; with a
    // page image swapped in they would be false captions — remove them.
    rep(/<meta property="og:image:width"[^>]*>/, '');
    rep(/<meta property="og:image:height"[^>]*>/, '');
    rep(/<meta property="og:image:alt"[^>]*>/, '');
    rep(/<meta name="twitter:image:alt"[^>]*>/, '');
  }
  if (pageJsonText) {
    rep(/<\/head>/, () => '<script type="application/ld+json" data-page-json="' + entry.jf + '">' + pageJsonText + '</script></head>');
  }
  return h;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  // Phase F (2026-10-30) — www consolidation: every www request (GET or
  // HEAD) permanently redirects to the same path on the apex domain, so
  // the estate's signals consolidate on https://theflatratemovers.com.
  // Other methods pass through untouched — a redirected POST would drop
  // its body — and no other host is matched.
  if (url.hostname === 'www.theflatratemovers.com' &&
      (request.method === 'GET' || request.method === 'HEAD')) {
    return Response.redirect(
      'https://theflatratemovers.com' + url.pathname + url.search, 301);
  }
  let p = url.pathname;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  const entry = HEAD[p === '' ? '/' : p];
  if (!entry) {
    // Blog foundation (2026-10-30): genuine 404 for unknown paths. Known
    // static files, the API and platform paths pass through untouched, and
    // non-GET/HEAD traffic (the quote POST) is never intercepted.
    if (request.method !== 'GET' && request.method !== 'HEAD') return context.next();
    if (STATIC_FILES.has(p === '' ? '/' : p) ||
        p.startsWith('/api/') || p.startsWith('/cdn-cgi/')) return context.next();
    return new Response(NOT_FOUND_HTML, {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8',
                 'cache-control': 'public, max-age=300' },
    });
  }
  if (request.method !== 'GET') return context.next();

  const res = await context.next();
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('text/html') || !res.body) return res;

  let pageJsonText = null;
  try {
    const jr = await env.ASSETS.fetch(new URL('/' + entry.jf, url.origin));
    if (jr.ok) {
      const t = await jr.text();
      if (t && !/<\/script/i.test(t)) pageJsonText = t;
    }
  } catch (e) { /* head still resolves from pageMeta data alone */ }

  const text = await res.text();
  const idx = text.indexOf(HEAD_END);
  if (idx < 0) return new Response(text, { status: res.status, headers: res.headers });
  const headStr = text.slice(0, idx + HEAD_END.length);
  const newHead = transformHead(headStr, entry, pageJsonText);
  if (newHead === headStr) return new Response(text, { status: res.status, headers: res.headers });
  const headers = new Headers(res.headers);
  headers.delete('content-length');
  headers.delete('etag');
  return new Response(newHead + text.slice(idx + HEAD_END.length), { status: res.status, headers });
}
