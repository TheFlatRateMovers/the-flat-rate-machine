#!/usr/bin/env node
/**
 * build-update-feed.js — ESTATE UPDATE FEED builder (draft, batch-pulse 2026-11-02)
 * =================================================================================
 * Generates /updates.xml — the SECOND estate feed. /feed.xml stays pure blog
 * articles (the News/Discover surface); updates.xml carries whole-estate
 * changes: every sealed change that adds, materially changes, or removes a
 * page, dataset, or feature on the site host.
 *
 * Source of truth: the SAME signed-index diff Pulse pings from — the pair of
 * consecutive ai-master-index.json states. No entry is ever invented: titles
 * come from the index entries' own `name`, sizes/digests from their `digest`
 * objects, the date from the seal that produced the newer index.
 *
 * Seal integration (see DESIGN.md): seal.py phase 0 snapshots the installed
 * index; a new phase 5.5 runs this builder against (snapshot, pre-digest new
 * index) so phase 6 digests updates.xml in the SAME seal it describes.
 *
 * Item rules:
 *   - site-host distributions only (repo/code distributions are counted in
 *     Pulse's coverage report, never feed items);
 *   - the feed never reports itself: updates.xml is excluded, as are the
 *     provenance files (ai-master-index.json, *.jws, .well-known/*);
 *   - pubDate = the seal's date at midnight America/New_York, RFC-822
 *     (the estate's Spec A date-only convention, same as build-feed.js);
 *   - guid = urn:sha256 over (seal SHA | contentUrl | new digest) — stable,
 *     unique per (seal, URL, content), isPermaLink="false";
 *   - accumulation: prior items are kept (dedupe by guid), newest first,
 *     capped at --max-items (default 200). Full history lives in the signed
 *     indexes themselves; the feed is a window, not the archive.
 *
 * Usage:
 *   node build-update-feed.js --prior-index <path> --index <path> \
 *     --seal-date YYYY-MM-DD --seal-sha <sha256 of the new index file> \
 *     [--existing <path to current updates.xml>] [--max-items 200] --out <path>
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HOST = 'theflatratemovers.com';
const SITE = `https://${HOST}`;
const HUB_URL = 'https://pubsubhubbub.appspot.com/';
const SELF_URL = `${SITE}/updates.xml`;
const EXCLUDED = [/\/updates\.xml$/, /ai-master-index\.json$/, /\.jws$/, /\/\.well-known\//];

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function canon(u) { try { const x = new URL(u); x.protocol = 'https:'; if (x.hostname === 'www.' + HOST) x.hostname = HOST; return x.toString(); } catch { return u; } }
function indexMap(idx) {
  const m = new Map();
  for (const d of idx.distribution || []) {
    if (!d.contentUrl || !d.digest) continue;
    m.set(canon(d.contentUrl), { digest: d.digest.value, byteSize: d.digest.byteSize ?? null, name: d.name || '', encodingFormat: d.encodingFormat || '' });
  }
  return m;
}
/* Midnight America/New_York on dateStr, as an RFC-822 GMT string. */
function nyMidnightRfc822(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  let guess = Date.UTC(y, mo - 1, d, 5, 0, 0);
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(fmt.formatToParts(new Date(guess)).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, (+parts.hour) % 24, +parts.minute, +parts.second);
    const target = Date.UTC(y, mo - 1, d, 0, 0, 0);
    guess += (target - asUTC);
    if (target === asUTC) break;
  }
  return new Date(guess).toUTCString();
}
function itemClass(url) {
  const p = new URL(url).pathname;
  if (/^\/datasets-[^/]*\.json$/.test(p)) return 'dataset-file';
  if (p.startsWith('/datasets/')) return 'dataset-landing';
  if (p.endsWith('/')) return 'page';
  if (p.endsWith('.json')) return 'data';
  return 'file';
}
function short(dg) { return dg ? dg.slice(0, 12) + '…' : '—'; }

function buildItems(prior, current, sealDate, sealSha, pubDate) {
  const items = [];
  const stats = { added: 0, changed: 0, removed: 0, excluded: 0, offHost: 0 };
  const consider = (url, kind) => {
    let host; try { host = new URL(url).hostname; } catch { return; }
    if (host !== HOST) { stats.offHost++; return; }
    if (EXCLUDED.some(re => re.test(url))) { stats.excluded++; return; }
    const cur = current.get(url), pri = prior.get(url);
    const e = cur || pri;
    const verb = kind === 'added' ? 'Added' : kind === 'changed' ? 'Updated' : 'Removed';
    let description;
    if (kind === 'added') description = `Added to the signed estate index. ${e.encodingFormat}, ${e.byteSize} bytes. SHA-256 ${short(e.digest)}. Sealed in index ${short(sealSha)}.`;
    else if (kind === 'changed') description = `Digest changed in the signed estate index: ${short(pri.digest)} → ${short(cur.digest)}. Size ${pri.byteSize} → ${cur.byteSize} bytes. ${e.encodingFormat}. Sealed in index ${short(sealSha)}.`;
    else description = `Removed from the signed estate index (was ${e.encodingFormat}, ${e.byteSize} bytes, SHA-256 ${short(e.digest)}). Sealed in index ${short(sealSha)}.`;
    const guid = 'urn:sha256:' + sha256(`${sealSha}|${url}|${kind === 'removed' ? 'removed' : cur.digest}`);
    items.push({
      guid,
      xml: [
        '  <item>',
        `    <title>${xmlEscape(`${e.name || url} — ${verb}`)}</title>`,
        `    <link>${xmlEscape(url)}</link>`,
        `    <guid isPermaLink="false">${guid}</guid>`,
        `    <pubDate>${pubDate}</pubDate>`,
        `    <category>${itemClass(url)}</category>`,
        `    <description>${xmlEscape(description)}</description>`,
        '  </item>',
      ].join('\n'),
    });
    stats[kind]++;
  };
  for (const [u, c] of current) { const p = prior.get(u); if (!p) consider(u, 'added'); else if (p.digest !== c.digest) consider(u, 'changed'); }
  for (const u of prior.keys()) if (!current.has(u)) consider(u, 'removed');
  return { items, stats };
}

function existingItems(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)].map(m => {
    const g = /<guid[^>]*>([^<]+)<\/guid>/.exec(m[0]);
    return { guid: g ? g[1] : null, xml: m[0].split('\n').map(l => l.startsWith('  ') ? l : '  ' + l).join('\n') };
  }).filter(i => i.guid);
}

function main() {
  const a = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) a[argv[i].replace(/^--/, '')] = argv[i + 1];
  for (const req of ['prior-index', 'index', 'seal-date', 'seal-sha', 'out']) if (!a[req]) { console.error('missing --' + req); process.exit(2); }
  const maxItems = parseInt(a['max-items'] || '200', 10);
  const prior = indexMap(JSON.parse(fs.readFileSync(a['prior-index'], 'utf8')));
  const current = indexMap(JSON.parse(fs.readFileSync(a.index, 'utf8')));
  const pubDate = nyMidnightRfc822(a['seal-date']);
  const { items, stats } = buildItems(prior, current, a['seal-date'], a['seal-sha'], pubDate);
  const priorItems = existingItems(a.existing && fs.existsSync(a.existing) ? fs.readFileSync(a.existing, 'utf8') : null);
  const seen = new Set(items.map(i => i.guid));
  const merged = [...items, ...priorItems.filter(i => !seen.has(i.guid))].slice(0, maxItems);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    '  <title>The Flat Rate Movers — Estate Updates</title>',
    `  <link>${SITE}/</link>`,
    `  <atom:link href="${SELF_URL}" rel="self" type="application/rss+xml"/>`,
    `  <atom:link rel="hub" href="${HUB_URL}"/>`,
    '  <description>Every sealed change to the estate — pages, datasets, and data surfaces — recorded from the signed ai-master-index at each seal. Article feed: /feed.xml.</description>',
    '  <language>en-us</language>',
    `  <lastBuildDate>${pubDate}</lastBuildDate>`,
    ...merged.map(i => i.xml),
    '</channel>',
    '</rss>',
    '',
  ].join('\n');
  fs.mkdirSync(path.dirname(a.out), { recursive: true });
  fs.writeFileSync(a.out, xml);
  console.log(JSON.stringify({ out: a.out, newItems: items.length, totalItems: merged.length, stats, pubDate }, null, 1));
}
main();
