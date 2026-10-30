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
import { HEAD } from './head-data.js';

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
  if (request.method !== 'GET') return context.next();
  let p = url.pathname;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  const entry = HEAD[p === '' ? '/' : p];
  if (!entry) return context.next();

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
