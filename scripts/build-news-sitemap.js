#!/usr/bin/env node
/**
 * build-news-sitemap.js — Google News sitemap generator (News Formula Spec A,
 * dossier: theflatratemovers/retrieval-machine/google-news-requirements-2026-11-02.md).
 *
 * Inputs (registry-driven, never prose):
 *   - the blog ledger (~/workspace/theflatratemovers/blog-project/ledger.csv):
 *     which posts exist and which are published;
 *   - the page registry (data/pages.json): confirms each post is a live page
 *     and supplies its canonical URL;
 *   - each post's per-page JSON (public/<slug>.json): the BlogPosting node's
 *     datePublished is copied VERBATIM into <news:publication_date> and its
 *     headline into <news:title> — the sitemap can never drift from the schema.
 *
 * Rule: a post is included iff its datePublished instant is within the
 * trailing 48 hours at generation time (Google News requirement); older
 * posts prune automatically. Date-only datePublished values are read as
 * midnight America/New_York (the estate timezone). The file is rewritten on
 * every run and is regenerated inside every seal (seal.py phase 2b), so a
 * blog batch's seal always emits a fresh news sitemap. A valid empty urlset
 * is emitted when no post is inside the window.
 *
 * Output: public/news-sitemap.xml — a signed distribution in the estate's
 * ai-master-index. <news:name> is exactly "The Flat Rate Movers";
 * <news:language> is "en". The 1,000-URL cap is asserted.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const MACHINE = path.resolve(__dirname, '..');
const PATHS = JSON.parse(fs.readFileSync(path.join(MACHINE, 'paths.json'), 'utf8'));
const PUBLIC = PATHS.public_dir;
const LEDGER = path.join(os.homedir(), 'workspace/theflatratemovers/blog-project/ledger.csv');
const SITE = 'https://theflatratemovers.com';
const WINDOW_MS = 48 * 3600 * 1000;
const CAP = 1000;

function fail(msg) { console.error('build-news-sitemap: FAIL — ' + msg); process.exit(1); }

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

/* Interpret a schema datePublished string as an instant.
 * Full ISO instants parse directly; a date-only value is midnight New York. */
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

function main() {
  const now = Date.now();
  const registry = JSON.parse(fs.readFileSync(path.join(MACHINE, 'data/pages.json'), 'utf8'));
  const bySlug = new Map(registry.pages.map((p) => [p.slug, p]));

  const rows = parseCsv(fs.readFileSync(LEDGER, 'utf8'));
  const header = rows[0];
  const slugIx = header.indexOf('slug');
  const statusIx = header.indexOf('status');
  if (slugIx < 0 || statusIx < 0) fail('ledger header lacks slug/status columns');

  const included = [];
  const pruned = [];
  for (const row of rows.slice(1)) {
    if (!row[slugIx]) continue;
    const slug = row[slugIx].trim();
    if (!/published/i.test(row[statusIx] || '')) continue;
    const page = bySlug.get(slug);
    if (!page) fail(`ledger post "${slug}" is not in the page registry — Spec A inputs violated`);
    const pjPath = path.join(PUBLIC, slug + '.json');
    if (!fs.existsSync(pjPath)) fail(`per-page JSON missing for post "${slug}"`);
    const pj = JSON.parse(fs.readFileSync(pjPath, 'utf8'));
    const nodes = Array.isArray(pj['@graph']) ? pj['@graph'] : [pj];
    const bp = nodes.find((n) => String(n['@type']).includes('BlogPosting'));
    if (!bp || !bp.datePublished) fail(`no BlogPosting datePublished for post "${slug}"`);
    const instant = toInstant(bp.datePublished);
    const age = now - instant;
    if (age <= WINDOW_MS && age >= -5 * 60 * 1000) {
      included.push({ slug, url: page.url, date: bp.datePublished, title: bp.headline, instant });
    } else {
      pruned.push({ slug, date: bp.datePublished, ageHours: Math.round(age / 36000) / 100 });
    }
  }
  if (included.length > CAP) fail(`news sitemap would exceed the ${CAP}-URL cap (${included.length})`);
  included.sort((a, b) => b.instant - a.instant || a.slug.localeCompare(b.slug));

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">',
  ];
  for (const e of included) {
    lines.push('  <url>');
    lines.push(`    <loc>${e.url}</loc>`);
    lines.push('    <news:news>');
    lines.push('      <news:publication>');
    lines.push('        <news:name>The Flat Rate Movers</news:name>');
    lines.push('        <news:language>en</news:language>');
    lines.push('      </news:publication>');
    lines.push(`      <news:publication_date>${e.date}</news:publication_date>`);
    lines.push(`      <news:title>${xmlEscape(e.title)}</news:title>`);
    lines.push('    </news:news>');
    lines.push('  </url>');
  }
  lines.push('</urlset>');
  const out = path.join(PUBLIC, 'news-sitemap.xml');
  fs.writeFileSync(out, lines.join('\n') + '\n');
  console.log(JSON.stringify({
    wrote: out, generatedAt: new Date(now).toISOString(),
    included: included.map((e) => e.slug), pruned,
    count: included.length,
  }, null, 1));
}

main();
