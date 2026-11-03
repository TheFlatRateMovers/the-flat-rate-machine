#!/usr/bin/env node
/**
 * build-feed.js — article feed generator (batch-sitemap-extensions-
 * 2026-11-02). Emits public/feed.xml: an RSS 2.0 feed (with the Atom
 * self-link) of every published blog post, for the consumers the News
 * sitemap does not serve — aggregators, feed readers, and the AI
 * crawlers that consume feeds.
 *
 * Inputs (registry-driven, never prose — the same discipline as
 * build-news-sitemap.js):
 *   - the blog ledger (~/workspace/theflatratemovers/blog-project/
 *     ledger.csv): which posts are published;
 *   - the page registry (data/pages.json): each post's canonical URL;
 *   - each post's per-page JSON (public/<slug>.json): the BlogPosting
 *     node's headline, description, datePublished, dateModified,
 *     articleSection — copied from the schema, so the feed can never
 *     drift from what the page itself declares.
 *   - the source shell (repo-dir/index.html): each post's full body
 *     HTML for <content:encoded>, taken from the post's own page div
 *     (<div class="page" id="page-<slug>">) — the same block
 *     build-routes.js lifts into the post's route document, so the
 *     feed carries the body exactly as the site publishes it. The
 *     shell is read rather than the generated route documents
 *     because this generator runs in seal phase 2b, before phase 5
 *     regenerates the routes: at 2b the shell is the current source
 *     and the route documents on disk are the previous generation's.
 *
 * WebSub (batch-feed-push-2026-11-02): the channel declares Google's
 * public hub (<atom:link rel="hub" href="https://pubsubhubbub.
 * appspot.com/"/>) beside the self link, and every item carries its
 * full body in <content:encoded>, so subscribers are pushed the
 * complete post on publish instead of polling for a summary. The
 * hub ping itself is a separate post-deploy step (ping-websub.py);
 * this generator only declares the hub and carries the content.
 *
 * Dates: <pubDate> is the RFC-822 form of the post's datePublished
 * instant. Full ISO instants parse directly; a date-only datePublished
 * is read as midnight America/New_York — the estate's standing Spec A
 * convention (build-news-sitemap.js), applied identically here.
 * Items sort newest first. The item <author> is the published business
 * inbox with the byline name: ratemovers@gmail.com (Henry Pitts Jr.).
 *
 * Runs inside every seal (seal.py phase 2b, beside build-sitemap.js and
 * build-news-sitemap.js). feed.xml is a signed distribution in the
 * estate's ai-master-index (its entry is added to the index before the
 * batch's first seal, the news-sitemap precedent); this generator, like
 * the other sitemap generators, is not itself a distribution.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const MACHINE = path.resolve(__dirname, '..');
const PATHS = JSON.parse(fs.readFileSync(path.join(MACHINE, 'paths.json'), 'utf8'));
const PUBLIC = PATHS.public_dir;
const SHELL = path.join(PATHS.repo_dir, 'index.html');
const HUB_URL = 'https://pubsubhubbub.appspot.com/';
const LEDGER = path.join(os.homedir(), 'workspace/theflatratemovers/blog-project/ledger.csv');
const SITE = 'https://theflatratemovers.com';
const FEED_URL = SITE + '/feed.xml';
const AUTHOR = 'ratemovers@gmail.com (Henry Pitts Jr.)';

function fail(msg) { console.error('build-feed: FAIL — ' + msg); process.exit(1); }

/* Minimal RFC 4180 CSV parser (the ledger quotes titles containing commas). */
function parseCsv(text) {
  const rows = []; let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/* UTC offset (ms) of America/New_York at a given UTC instant. */
function nyOffsetMs(utcMs) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = {};
  for (const p of dtf.formatToParts(new Date(utcMs))) parts[p.type] = p.value;
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/* Interpret a schema datePublished string as an instant (Spec A rule). */
function toInstant(s) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const guess = Date.parse(s + 'T00:00:00Z');
    return guess - nyOffsetMs(guess);
  }
  const t = Date.parse(s);
  if (Number.isNaN(t)) fail('unparseable datePublished: ' + s);
  return t;
}

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/* CDATA-wrap a full HTML body for <content:encoded>. The terminator
 * sequence is split across two CDATA sections so a body containing
 * it (none does today) could never break the feed. */
function cdata(s) {
  return '<![CDATA[' + String(s).split(']]>').join(']]]]><![CDATA[>') + ']]>';
}

/* Extract every page div's inner HTML from the source shell, keyed by
 * router slug. Same tokenizer discipline as build-routes.js: comments
 * and script blocks are skipped whole, and <div> depth is tracked, so
 * a "</div>" inside a script string or comment cannot end a page div
 * early. Returns a Map of slug -> inner HTML (opening/closing page-div
 * tags stripped, surrounding whitespace trimmed; the body itself is
 * carried verbatim — never edited, never truncated). */
function extractPageDivs(shell) {
  const divs = new Map();
  let i = 0, depth = 0, divStart = -1, divSlug = null;
  const nextToken = (from) => {
    let best = null;
    for (const tok of ['<!--', '<script', '<div', '</div>']) {
      const j = shell.indexOf(tok, from);
      if (j >= 0 && (best === null || j < best.idx)) best = { tok, idx: j };
    }
    return best;
  };
  while (true) {
    const t = nextToken(i);
    if (!t) break;
    if (t.tok === '<!--') {
      const e = shell.indexOf('-->', t.idx);
      if (e < 0) fail('shell: unterminated comment');
      i = e + 3;
    } else if (t.tok === '<script') {
      const e = shell.indexOf('</script>', t.idx);
      if (e < 0) fail('shell: unterminated script');
      i = e + '</script>'.length;
    } else if (t.tok === '<div') {
      if (depth === 0) {
        const m = shell.slice(t.idx, t.idx + 320).match(/^<div class="page" id="page-([^"]+)">/);
        if (m) { divStart = t.idx; divSlug = m[1]; }
      }
      depth++;
      i = t.idx + 4;
    } else { // </div>
      depth--;
      if (depth < 0) fail('shell: div depth went negative');
      if (depth === 0 && divSlug !== null) {
        const end = shell.indexOf('>', t.idx) + 1;
        const text = shell.slice(divStart, end);
        const openEnd = text.indexOf('>') + 1;
        divs.set(divSlug, text.slice(openEnd, text.length - '</div>'.length).trim());
        divStart = -1; divSlug = null;
      }
      i = t.idx + 6;
    }
  }
  if (depth !== 0) fail('shell: div depth did not return to 0');
  return divs;
}

function main() {
  const now = Date.now();
  const registry = JSON.parse(fs.readFileSync(path.join(MACHINE, 'data/pages.json'), 'utf8'));
  const bySlug = new Map(registry.pages.map((p) => [p.slug, p]));
  const blogPage = bySlug.get('blog');
  if (!blogPage) fail('blog hub missing from the page registry');

  /* Channel description from the blog hub's own per-page JSON. */
  let channelDesc = '';
  const blogJsonPath = path.join(PUBLIC, 'blog.json');
  if (fs.existsSync(blogJsonPath)) {
    const bj = JSON.parse(fs.readFileSync(blogJsonPath, 'utf8'));
    const nodes = Array.isArray(bj['@graph']) ? bj['@graph'] : [bj];
    const hub = nodes.find((n) => n.description);
    if (hub) channelDesc = hub.description;
  }
  if (!channelDesc) {
    channelDesc = 'Articles and job stories from The Flat Rate Movers: flat-rate moving, ' +
      'heavy-asset relocation, transloading and logistics — Winchester, VA and Martinsburg, WV.';
  }

  /* Full post bodies from the source shell (see header): one pass
   * collects every page div; a published post whose div is missing
   * fails the build rather than emitting a summary-only item. */
  if (!fs.existsSync(SHELL)) fail('source shell missing: ' + SHELL);
  const pageDivs = extractPageDivs(fs.readFileSync(SHELL, 'utf8'));

  const rows = parseCsv(fs.readFileSync(LEDGER, 'utf8'));
  const header = rows[0];
  const slugIx = header.indexOf('slug');
  const statusIx = header.indexOf('status');
  if (slugIx < 0 || statusIx < 0) fail('ledger header lacks slug/status columns');

  const items = [];
  for (const row of rows.slice(1)) {
    if (!row[slugIx]) continue;
    const slug = row[slugIx].trim();
    if (!/published/i.test(row[statusIx] || '')) continue;
    const page = bySlug.get(slug);
    if (!page) fail(`ledger post "${slug}" is not in the page registry`);
    const pjPath = path.join(PUBLIC, slug + '.json');
    if (!fs.existsSync(pjPath)) fail(`per-page JSON missing for post "${slug}"`);
    const pj = JSON.parse(fs.readFileSync(pjPath, 'utf8'));
    const nodes = Array.isArray(pj['@graph']) ? pj['@graph'] : [pj];
    const bp = nodes.find((n) => String(n['@type']).includes('BlogPosting'));
    if (!bp || !bp.headline || !bp.description || !bp.datePublished) {
      fail(`BlogPosting node incomplete for post "${slug}" (headline/description/datePublished required)`);
    }
    const content = pageDivs.get(slug);
    if (!content) fail(`page div missing in the source shell for post "${slug}"`);
    items.push({
      slug, url: page.url, title: bp.headline, description: bp.description,
      instant: toInstant(bp.datePublished),
      section: bp.articleSection || null,
      content,
    });
  }
  if (!items.length) fail('no published posts — refusing to emit an empty feed');
  items.sort((a, b) => b.instant - a.instant || a.slug.localeCompare(b.slug));

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    '  <channel>',
    '    <title>The Flat Rate Movers — Articles</title>',
    `    <link>${blogPage.url}</link>`,
    `    <description>${xmlEscape(channelDesc)}</description>`,
    '    <language>en-us</language>',
    /* S3 determinism (2026-11-03): lastBuildDate is the channel's last
       CONTENT change (the newest item's instant; items are sorted
       newest-first above), never the wall-clock build time — a build
       that changes no item must serialize byte-identically. */
    `    <lastBuildDate>${new Date(items.length ? items[0].instant : now).toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml"/>`,
    `    <atom:link rel="hub" href="${HUB_URL}"/>`,
  ];
  for (const it of items) {
    lines.push('    <item>');
    lines.push(`      <title>${xmlEscape(it.title)}</title>`);
    lines.push(`      <link>${it.url}</link>`);
    lines.push(`      <guid isPermaLink="true">${it.url}</guid>`);
    lines.push(`      <pubDate>${new Date(it.instant).toUTCString()}</pubDate>`);
    lines.push(`      <author>${AUTHOR}</author>`);
    if (it.section) lines.push(`      <category>${xmlEscape(it.section)}</category>`);
    lines.push(`      <description>${xmlEscape(it.description)}</description>`);
    lines.push(`      <content:encoded>${cdata(it.content)}</content:encoded>`);
    lines.push('    </item>');
  }
  lines.push('  </channel>');
  lines.push('</rss>');
  const out = path.join(PUBLIC, 'feed.xml');
  fs.writeFileSync(out, lines.join('\n') + '\n');
  console.log(JSON.stringify({
    wrote: out, generatedAt: new Date(now).toISOString(),
    items: items.map((e) => e.slug), count: items.length,
  }, null, 1));
}

main();
