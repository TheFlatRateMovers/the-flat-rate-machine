// The Flat Rate Movers — Estate Data API (read-only) + MCP endpoint.
//
// Serves the company's public machine-readable estate (datasets, entity
// graph, signed master index, search-intent rows) as a versioned JSON API,
// plus an MCP (Model Context Protocol) JSON-RPC endpoint at /mcp exposing
// the same reads as tools. All data is public and bundled at refresh time
// by scripts/refresh-bundle.py; dataset payloads are served byte-identical
// to the files live at https://theflatratemovers.com/.
//
// Provenance: every estate file is listed in the signed master index
// (ai-master-index.json, Ed25519, kid theflatratemovers-2026-10-29-1).
// GET /v1/verify re-hashes the live file and compares it to that index.

import {
  datasetText,
  coreText,
  services,
  datasetsInventory,
  pageDataInventory,
  intentRows,
  bundleManifest,
  datasetRemote,
} from '../data/bundle-index.js';

const BASE = 'https://theflatratemovers.com/';
const KID = 'theflatratemovers-2026-10-29-1';
const CONCEPT_DOI = '10.5281/zenodo.23818766';
const API_VERSION = '1.0.0';
const MCP_PROTOCOL = '2025-03-26';

const masterIndex = JSON.parse(coreText['ai-master-index.json']);
const indexDigestByUrl = new Map();
for (const d of masterIndex.distribution || []) {
  if (d.contentUrl && d.digest && d.digest.value) {
    indexDigestByUrl.set(d.contentUrl, d.digest.value);
  }
}
const servicesById = new Map(services.map((s) => [s.id, s]));
const inventoryByFile = new Map(datasetsInventory.map((d) => [d.file, d]));
const pageDataBySlug = new Map((pageDataInventory || []).map((d) => [d.slug, d]));

// ------------------------------------------------------- dataset access
// Payloads over the refresh threshold are not embedded in the worker
// script (Cloudflare caps a worker at 63.9 MiB uncompressed). They are
// served fetch-through from the estate's own live files — the same
// sealed bytes the bundle would have carried — via the edge cache.
const remoteDatasetSet = new Set(datasetRemote || []);
const hasDataset = (name) => datasetText[name] !== undefined || remoteDatasetSet.has(name);
async function dsText(name) {
  if (datasetText[name] !== undefined) return datasetText[name];
  if (!remoteDatasetSet.has(name)) return undefined;
  const url = BASE + name;
  try {
    const cache = (typeof caches !== 'undefined' && caches.default) || null;
    if (cache) { const hit = await cache.match(url); if (hit) return await hit.text(); }
    const res = await fetch(url, { headers: { 'User-Agent': 'flat-rate-estate-api/dataset' } });
    if (!res.ok) return undefined;
    const text = await res.text();
    if (cache) {
      try {
        await cache.put(url, new Response(text, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }));
      } catch (_) { /* cache write is best-effort */ }
    }
    return text;
  } catch (_) { return undefined; }
}

// ------------------------------------------------------------------ counts
// Every figure this worker publishes — the landing page, the MCP tool
// descriptions, the OpenAPI document — is computed here from the same
// bundled data the endpoints serve, so a published number can never
// drift from the data itself again.
const indexDistributions = masterIndex.distribution || [];
const COUNTS = {
  services: services.length,
  datasets: datasetsInventory.length,
  intentRows: intentRows.length,
  // Pages = the site's HTML documents carried in the signed index: the
  // per-route documents plus the dataset landing pages, counted from
  // the index rather than restated as prose.
  pages: indexDistributions.filter(
    (d) => d.encodingFormat === 'text/html'
      && String(d.contentUrl || '').startsWith(BASE)).length,
  distributions: indexDistributions.length,
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Mcp-Session-Id, MCP-Protocol-Version',
};

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value, null, 1), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  });
}

function textResponse(text, contentType, status = 200) {
  return new Response(text, {
    status,
    headers: { 'Content-Type': contentType, ...CORS },
  });
}

function errorJson(error, status) {
  return jsonResponse({ error }, status);
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------- services
function serviceSummary(s) {
  return {
    id: s.id,
    graphId: s.graphId,
    name: s.name,
    serviceType: s.serviceType,
    url: s.url,
    description: s.description,
    datasets: s.datasets,
    intentRowCount: s.intentRowCount,
  };
}

function serviceDetail(s) {
  return {
    ...serviceSummary(s),
    node: s.node,
    datasetFiles: s.datasets
      .map((f) => inventoryByFile.get(f))
      .filter(Boolean),
  };
}

// ---------------------------------------------------------------- datasets
function normalizeDatasetName(name) {
  if (!name) return null;
  if (hasDataset(name)) return name;
  const guess = `datasets-${name.replace(/\.json$/, '')}.json`;
  return hasDataset(guess) ? guess : null;
}

// ------------------------------------------------------------------ intent
function filterIntent(params) {
  const service = params.get('service');
  const area = params.get('area');
  const intentClass = params.get('intent_class');
  const q = params.get('q');
  let out = intentRows;
  if (service) out = out.filter((r) => r.service_id === service);
  if (area) out = out.filter((r) => (r.area || '') === area);
  if (intentClass) out = out.filter((r) => r.intent_class === intentClass);
  if (q) {
    const needle = q.toLowerCase();
    out = out.filter((r) => r.query_text.toLowerCase().includes(needle));
  }
  return out;
}

function paginate(rows, params) {
  let limit = parseInt(params.get('limit') || '50', 10);
  if (Number.isNaN(limit) || limit < 1) limit = 50;
  limit = Math.min(limit, 200);
  let offset = parseInt(params.get('offset') || '0', 10);
  if (Number.isNaN(offset) || offset < 0) offset = 0;
  return {
    total: rows.length,
    limit,
    offset,
    results: rows.slice(offset, offset + limit),
  };
}

// ------------------------------------------------------------------ verify
async function verifyFile(file) {
  const name = String(file || '').split('/').pop();
  const url = BASE + name;
  const signedIndexDigest = indexDigestByUrl.get(url) || null;
  // Live first: hash the bytes the site serves right now.
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'flat-rate-estate-api/verify' },
    });
    if (res.ok) {
      const liveSha256 = await sha256Hex(await res.arrayBuffer());
      return {
        file: name,
        url,
        liveSha256,
        signedIndexDigest,
        match: signedIndexDigest ? liveSha256 === signedIndexDigest : null,
        kid: KID,
        source: 'live',
      };
    }
  } catch (_) {
    /* fall through to the bundle copy */
  }
  const rec = bundleManifest.files[name];
  if (!rec) {
    return { file: name, url, error: 'file not found in the signed index or bundle' };
  }
  return {
    file: name,
    url,
    liveSha256: rec.sha256,
    signedIndexDigest,
    match: signedIndexDigest ? rec.sha256 === signedIndexDigest : null,
    kid: KID,
    source: 'bundle',
  };
}

// --------------------------------------------------------------------- MCP
const TOOLS = [
  {
    name: 'list_services',
    description: `List all ${COUNTS.services} services in The Flat Rate Movers estate registry, with ids, names, page URLs, backing datasets and intent-row counts.`,
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_service',
    description: 'Get one service by its id (e.g. "service-commercial"): the full entity-graph node, its dataset files and its intent-row count.',
    inputSchema: {
      type: 'object',
      properties: { service_id: { type: 'string' } },
      required: ['service_id'],
    },
  },
  {
    name: 'list_datasets',
    description: `Inventory of the ${COUNTS.datasets} published datasets: file name, file URL, landing page, identifier and SHA-256.`,
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_dataset',
    description: 'Get a dataset file\'s full JSON, byte-identical to the live file at theflatratemovers.com. Pass the file name (e.g. "datasets-commercial.json") or its short name (e.g. "commercial").',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
  },
  {
    name: 'search_intent',
    description: `Search the ${COUNTS.intentRows}-row search-intent rubric (v2): the strings people use to find each service, each bound to its target page, datasets and certificates, and each carrying its generation source, era-tagged Search Console evidence and five-gate outcome state. Filter by service, area, intent_class or a text query q.`,
    inputSchema: {
      type: 'object',
      properties: {
        service: { type: 'string' },
        area: { type: 'string' },
        intent_class: { type: 'string', enum: ['navigational-local', 'cost', 'how-process', 'best-choice', 'ai-question'] },
        q: { type: 'string' },
        limit: { type: 'integer' },
        offset: { type: 'integer' },
      },
    },
  },
  {
    name: 'verify_file',
    description: 'Verify an estate file against the signed master index: returns the live SHA-256, the signed-index digest, whether they match, and the signing key id.',
    inputSchema: {
      type: 'object',
      properties: { file: { type: 'string' } },
      required: ['file'],
    },
  },
];

async function callTool(name, args) {
  switch (name) {
    case 'list_services':
      return { count: services.length, services: services.map(serviceSummary) };
    case 'get_service': {
      const s = servicesById.get(args.service_id);
      if (!s) throw new Error(`unknown service id: ${args.service_id}`);
      return serviceDetail(s);
    }
    case 'list_datasets':
      return { count: datasetsInventory.length, datasets: datasetsInventory };
    case 'get_dataset': {
      const file = normalizeDatasetName(args.name);
      if (!file) throw new Error(`unknown dataset: ${args.name}`);
      return await dsText(file); // raw text content, byte-identical
    }
    case 'search_intent': {
      const params = new URLSearchParams();
      for (const k of ['service', 'area', 'intent_class', 'q', 'limit', 'offset']) {
        if (args[k] !== undefined && args[k] !== null) params.set(k, String(args[k]));
      }
      return paginate(filterIntent(params), params);
    }
    case 'verify_file':
      return verifyFile(args.file);
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

function rpcResult(id, result) {
  return jsonResponse({ jsonrpc: '2.0', id, result });
}

function rpcError(id, code, message) {
  return jsonResponse({ jsonrpc: '2.0', id, error: { code, message } });
}

async function handleMcp(request) {
  let msg;
  try {
    msg = await request.json();
  } catch (_) {
    return rpcError(null, -32700, 'Parse error');
  }
  const isNotification = msg.id === undefined || msg.id === null;
  if (isNotification) {
    // Notifications (e.g. notifications/initialized) get no JSON-RPC body.
    return new Response(null, { status: 202, headers: { ...CORS } });
  }
  switch (msg.method) {
    case 'initialize':
      return rpcResult(msg.id, {
        protocolVersion: (msg.params && msg.params.protocolVersion) || MCP_PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: { name: 'flat-rate-estate-api', version: API_VERSION },
      });
    case 'ping':
      return rpcResult(msg.id, {});
    case 'tools/list':
      return rpcResult(msg.id, { tools: TOOLS });
    case 'tools/call': {
      const params = msg.params || {};
      try {
        const out = await callTool(params.name, params.arguments || {});
        const text = typeof out === 'string' ? out : JSON.stringify(out, null, 1);
        return rpcResult(msg.id, { content: [{ type: 'text', text }], isError: false });
      } catch (e) {
        return rpcResult(msg.id, {
          content: [{ type: 'text', text: String(e && e.message || e) }],
          isError: true,
        });
      }
    }
    default:
      return rpcError(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

// ------------------------------------------------------------------ landing
function landingHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Flat Rate Machine — The Flat Rate Movers' Verified Data API</title>
<style>body{font-family:system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem;line-height:1.5;color:#1a1a1a}code{background:#f2f2f2;padding:.1em .3em;border-radius:.25em}li{margin:.3em 0}</style>
</head>
<body>
<h1>The Flat Rate Machine — The Flat Rate Movers' Verified Data API</h1>
<p><strong>Base URL: <code>https://api.theflatratemovers.com</code></strong> — every endpoint
below is a path on this base. MCP server: <code>https://api.theflatratemovers.com/mcp</code>.
The datasets served here are also mirrored on Hugging Face
(<a href="https://huggingface.co/datasets/theflatratemovers">huggingface.co/datasets/theflatratemovers</a>)
and archived on Zenodo under concept DOI <a href="https://doi.org/${CONCEPT_DOI}">${CONCEPT_DOI}</a>.</p>
<p>Read-only public API for <strong>The Flat Rate Machine</strong>, the verified data
system of The Flat Rate Movers LLC — its machine-readable estate
(Winchester, VA and Martinsburg, WV): ${COUNTS.services} services, ${COUNTS.datasets} datasets, the entity graph,
the signed master index, and the ${COUNTS.intentRows}-row search-intent rubric. Every file served
here is byte-identical to the copy at
<a href="https://theflatratemovers.com/">theflatratemovers.com</a> and is listed in
the signed provenance index (Ed25519, key id <code>${KID}</code>).</p>
<p><strong>Live counts</strong> — computed from the same bundled data the endpoints
serve, at the moment this page is rendered: ${COUNTS.services} services ·
${COUNTS.datasets} datasets · ${COUNTS.pages} pages · ${COUNTS.intentRows} intent rows ·
${COUNTS.distributions} signed distributions in the master index. A machine-readable
description of every endpoint is at <a href="/openapi.json"><code>GET /openapi.json</code></a>
(OpenAPI 3).</p>
<p><strong>The intent feed (v2).</strong> <code>GET /v1/intent</code> serves the estate's
search-intent rubric as data: every row is a query string customers and AI assistants use
to find one of the ${COUNTS.services} services, resolved to the page that answers it, and usable directly
as a suggestion — query text, intent class, target page and outcome state ride on every
row. Version 2 covers all ${COUNTS.pages} pages of the site and adds, per row, its generation source,
era-tagged Google Search Console evidence where an observation window recorded the row's
page, and an outcome record across five gates — crawled, indexed, understood, corroborated,
cited-and-maintained — that stays unmarked until evidence is recorded for it, so the feed
proves coverage without claiming performance it has not measured. Cite the rubric as:
The Flat Rate Movers, <em>Search Intent Coverage Dataset</em>,
<a href="https://theflatratemovers.com/datasets-intent-coverage.json">theflatratemovers.com/datasets-intent-coverage.json</a>
(concept DOI <a href="https://doi.org/${CONCEPT_DOI}">${CONCEPT_DOI}</a>), or query it live here.</p>
<h2>Endpoints</h2>
<ul>
<li><code>GET /v1/services</code> — all services</li>
<li><code>GET /v1/services/{service_id}</code> — one service, its datasets and intent rows count</li>
<li><code>GET /v1/datasets</code> — dataset inventory</li>
<li><code>GET /v1/datasets/{name}</code> — a dataset's full JSON</li>
<li><code>GET /v1/intent?service=&amp;area=&amp;intent_class=&amp;q=</code> — intent rows, filtered and paginated</li>
<li><code>GET /v1/answer-evidence</code> — the answer-engine evidence dataset, byte-identical (add <code>?table=questions|fragments|coverage|profiles|observations|reviews|gaps</code> for one table)</li>
<li><code>GET /v1/local-graph</code> — the local graph registry dataset, byte-identical (add <code>?table=branches|records|coverage|reviews|collisions|gaps|owner-steps</code> for one table)</li>
<li><code>GET /v1/crawl-presence</code> — the crawl-presence registry dataset, byte-identical (add <code>?table=collections|presence|summary|robots|signals|inspections|releases|gaps|mechanisms</code> for one table)</li>
<li><code>GET /v1/archives</code> — the archive registry dataset, byte-identical (add <code>?table=targets|captures|deposits|github|local-archive|verification|runs|gaps|channels|totals</code> for one table)</li>
<li><code>GET /v1/catalog</code> — the catalog registry dataset, byte-identical (add <code>?table=catalogs|datasets|observations|diagnostics|gaps|totals</code> for one table)</li>
<li><code>GET /v1/graph</code> — the best entity graph</li>
<li><code>GET /v1/index</code> — the signed master index</li>
<li><code>GET /v1/page-data</code> — every page's Page Data record: the page URL, its data.json + data.txt URLs, their signed SHA-256 digests and its rubric score</li>
<li><code>GET /v1/page-data/{slug}</code> — one page's Page Data record (slug is the page path, e.g. <code>gun-safe-movers</code> or <code>datasets/gun-safe</code>; the homepage is <code>home</code>)</li>
<li><code>GET /v1/verify?file={filename}</code> — live SHA-256 vs the signed index</li>
<li><code>GET /openapi.json</code> — this API as an OpenAPI 3 document</li>
<li><code>POST /mcp</code> — MCP JSON-RPC endpoint (tools: list_services, get_service, list_datasets, get_dataset, search_intent, verify_file)</li>
</ul>
<h2>Access, caching and limits</h2>
<ul>
<li><strong>Authentication:</strong> none. Every endpoint is public and read-only; no
API key, account or token is required or accepted.</li>
<li><strong>Methods:</strong> GET on every data endpoint; POST only on <code>/mcp</code>
(stateless JSON-RPC 2.0). CORS is open (<code>Access-Control-Allow-Origin: *</code>).</li>
<li><strong>Caching:</strong> the worker sets no <code>Cache-Control</code> headers of
its own. Each response is rendered per request from the bundled estate snapshot, and
this page's counts are computed from that same snapshot — the snapshot is refreshed
and the worker redeployed whenever the estate republishes, so the figures above
always describe the data the endpoints are serving right now.</li>
<li><strong>Rate limits:</strong> the worker applies none — no throttling, quotas or
key-based limits are implemented.</li>
<li><strong>Provenance:</strong> every dataset payload is byte-identical to the file
at theflatratemovers.com and digest-listed in the signed master index;
<code>GET /v1/verify?file=</code> re-hashes the live file and compares it for you.</li>
</ul>
<h2>Records</h2>
<ul>
<li>Datasets hub: <a href="https://theflatratemovers.com/datasets/">theflatratemovers.com/datasets/</a></li>
<li>Archived release DOI: <a href="https://doi.org/${CONCEPT_DOI}">${CONCEPT_DOI}</a></li>
<li>Signing keys: <a href="https://theflatratemovers.com/.well-known/signing-keys.json">theflatratemovers.com/.well-known/signing-keys.json</a></li>
</ul>
</body>
</html>`;
}

// ----------------------------------------------------------------- openapi
const tableParam = (values) => ({
  name: 'table', in: 'query', required: false,
  description: 'Return one table of the dataset instead of the whole file.',
  schema: { type: 'string', enum: values },
});
const datasetDocResponse = (summary) => ({
  description: summary,
  content: { 'application/json': { schema: { type: 'object' } } },
});
const OPENAPI = {
  openapi: '3.0.3',
  info: {
    title: 'The Flat Rate Machine — The Flat Rate Movers\' Verified Data API',
    version: API_VERSION,
    description: `Read-only public API for the machine-readable estate of The Flat Rate Movers LLC (Winchester, VA and Martinsburg, WV): ${COUNTS.services} services, ${COUNTS.datasets} datasets, the entity graph, the signed master index (Ed25519, key id ${KID}) and the ${COUNTS.intentRows}-row search-intent rubric. No authentication; every endpoint is public. Dataset payloads are byte-identical to the files at https://theflatratemovers.com/. Counts in this document were computed from the same bundled data the endpoints serve.`,
    license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
    contact: { name: 'The Flat Rate Movers', url: 'https://theflatratemovers.com/' },
  },
  servers: [{ url: 'https://api.theflatratemovers.com' }],
  paths: {
    '/': {
      get: {
        summary: 'Landing page',
        description: 'Human-readable overview of this API, with counts computed live from the served data.',
        responses: { '200': { description: 'HTML landing page.', content: { 'text/html': { schema: { type: 'string' } } } } },
      },
    },
    '/openapi.json': {
      get: {
        summary: 'This OpenAPI document',
        responses: { '200': { description: 'The OpenAPI 3 description of this API.', content: { 'application/json': { schema: { type: 'object' } } } } },
      },
    },
    '/v1/services': {
      get: {
        summary: 'List all services',
        responses: { '200': { description: 'Service registry summaries.', content: { 'application/json': { schema: { type: 'object', properties: { count: { type: 'integer' }, services: { type: 'array', items: { $ref: '#/components/schemas/ServiceSummary' } } }, required: ['count', 'services'] } } } } },
      },
    },
    '/v1/services/{service_id}': {
      get: {
        summary: 'Get one service',
        parameters: [{ name: 'service_id', in: 'path', required: true, schema: { type: 'string' }, example: 'service-commercial' }],
        responses: {
          '200': { description: 'The service summary plus its full entity-graph node and dataset file records.', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ServiceSummary' }, { type: 'object', properties: { node: { type: 'object' }, datasetFiles: { type: 'array', items: { type: 'object' } } } }] } } } },
          '404': { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/v1/datasets': {
      get: {
        summary: 'Dataset inventory',
        responses: { '200': { description: 'Inventory of every published dataset file.', content: { 'application/json': { schema: { type: 'object', properties: { count: { type: 'integer' }, datasets: { type: 'array', items: { $ref: '#/components/schemas/DatasetRecord' } } }, required: ['count', 'datasets'] } } } } },
      },
    },
    '/v1/datasets/{name}': {
      get: {
        summary: 'Get a dataset file',
        description: 'The dataset\'s full JSON, byte-identical to the live file. Pass the file name (datasets-commercial.json) or its short name (commercial).',
        parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' }, example: 'datasets-commercial.json' }],
        responses: {
          '200': datasetDocResponse('The dataset document (JSON-LD, schema.org Dataset graph).'),
          '404': { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/v1/intent': {
      get: {
        summary: 'Search the intent rubric',
        description: 'Filtered, paginated rows of the search-intent rubric (v2).',
        parameters: [
          { name: 'service', in: 'query', required: false, schema: { type: 'string' }, description: 'Service id, e.g. service-commercial.' },
          { name: 'area', in: 'query', required: false, schema: { type: 'string' }, description: 'Exact area value carried on the row.' },
          { name: 'intent_class', in: 'query', required: false, schema: { type: 'string', enum: ['navigational-local', 'cost', 'how-process', 'best-choice', 'ai-question'] } },
          { name: 'q', in: 'query', required: false, schema: { type: 'string' }, description: 'Case-insensitive substring match on the query text.' },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 50, maximum: 200 } },
          { name: 'offset', in: 'query', required: false, schema: { type: 'integer', default: 0, minimum: 0 } },
        ],
        responses: { '200': { description: 'One page of intent rows.', content: { 'application/json': { schema: { type: 'object', properties: { total: { type: 'integer' }, limit: { type: 'integer' }, offset: { type: 'integer' }, results: { type: 'array', items: { type: 'object' } } }, required: ['total', 'limit', 'offset', 'results'] } } } } },
      },
    },
    '/v1/answer-evidence': {
      get: {
        summary: 'Answer-engine evidence dataset',
        parameters: [tableParam(['questions', 'fragments', 'coverage', 'profiles', 'observations', 'reviews', 'gaps'])],
        responses: { '200': datasetDocResponse('The full dataset file (no ?table) or the single requested table node.'), '404': { $ref: '#/components/responses/Error' } },
      },
    },
    '/v1/local-graph': {
      get: {
        summary: 'Local graph registry dataset',
        parameters: [tableParam(['branches', 'records', 'coverage', 'reviews', 'collisions', 'gaps', 'owner-steps'])],
        responses: { '200': datasetDocResponse('The full dataset file (no ?table) or the single requested table node.'), '404': { $ref: '#/components/responses/Error' } },
      },
    },
    '/v1/crawl-presence': {
      get: {
        summary: 'Crawl-presence registry dataset',
        parameters: [tableParam(['collections', 'presence', 'summary', 'robots', 'signals', 'inspections', 'releases', 'gaps', 'mechanisms'])],
        responses: { '200': datasetDocResponse('The full dataset file (no ?table) or the single requested table node.'), '404': { $ref: '#/components/responses/Error' } },
      },
    },
    '/v1/archives': {
      get: {
        summary: 'Archive registry dataset',
        parameters: [tableParam(['targets', 'captures', 'deposits', 'github', 'local-archive', 'verification', 'runs', 'gaps', 'channels', 'totals'])],
        responses: { '200': datasetDocResponse('The full dataset file (no ?table) or the single requested table node.'), '404': { $ref: '#/components/responses/Error' } },
      },
    },
    '/v1/catalog': {
      get: {
        summary: 'Catalog registry dataset',
        parameters: [tableParam(['catalogs', 'datasets', 'observations', 'diagnostics', 'gaps', 'totals'])],
        responses: { '200': datasetDocResponse('The full dataset file (no ?table) or the single requested table node.'), '404': { $ref: '#/components/responses/Error' } },
      },
    },
    '/v1/graph': {
      get: {
        summary: 'The best entity graph',
        responses: { '200': datasetDocResponse('best-json-entity-graph.json, byte-identical to the live file.') },
      },
    },
    '/v1/index': {
      get: {
        summary: 'The signed master index',
        responses: { '200': datasetDocResponse('ai-master-index.json: every signed distribution of the estate with its SHA-256 digest.') },
      },
    },
    '/v1/page-data': {
      get: {
        summary: 'Page Data inventory — every page\'s data files',
        description: 'Every page of the site carries data.json + data.txt beside it (Page Data, drawn from the Page Data Pool). This index lists each page with the two files\' URLs, their signed SHA-256 digests and the page\'s rubric score.',
        responses: { '200': { description: 'Page Data inventory.', content: { 'application/json': { schema: { type: 'object' } } } } },
      },
    },
    '/v1/page-data/{slug}': {
      get: {
        summary: 'One page\'s Page Data record',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' }, example: 'gun-safe-movers' }],
        responses: {
          '200': { description: 'The page\'s Page Data record.', content: { 'application/json': { schema: { type: 'object' } } } },
          '404': { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/v1/verify': {
      get: {
        summary: 'Verify a file against the signed index',
        description: 'Fetches the live file, hashes it, and compares the digest with the signed master index entry.',
        parameters: [{ name: 'file', in: 'query', required: true, schema: { type: 'string' }, example: 'datasets-commercial.json' }],
        responses: {
          '200': { description: 'Verification result.', content: { 'application/json': { schema: { $ref: '#/components/schemas/VerifyResult' } } } },
          '400': { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/mcp': {
      post: {
        summary: 'MCP endpoint (JSON-RPC 2.0, stateless)',
        description: `Model Context Protocol endpoint. Methods: initialize, ping, tools/list, tools/call. Tools: ${TOOLS.map((t) => t.name).join(', ')}.`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  jsonrpc: { type: 'string', enum: ['2.0'] },
                  id: { type: ['string', 'number', 'null'] },
                  method: { type: 'string', enum: ['initialize', 'ping', 'tools/list', 'tools/call'] },
                  params: { type: 'object' },
                },
                required: ['jsonrpc', 'method'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'JSON-RPC result or error object.', content: { 'application/json': { schema: { type: 'object' } } } },
          '202': { description: 'Notification accepted; no body.' },
        },
      },
    },
  },
  components: {
    schemas: {
      ServiceSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          graphId: { type: 'string' },
          name: { type: 'string' },
          serviceType: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          description: { type: 'string' },
          datasets: { type: 'array', items: { type: 'string' } },
          intentRowCount: { type: 'integer' },
        },
      },
      DatasetRecord: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          name: { type: 'string' },
          fileUrl: { type: 'string', format: 'uri' },
          landingPage: { type: 'string', format: 'uri' },
          landingSource: { type: 'string' },
          identifier: { type: 'string', nullable: true },
          sha256: { type: 'string' },
          byteSize: { type: 'integer' },
          signedIndexMatch: { type: 'boolean', nullable: true },
        },
      },
      VerifyResult: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          liveSha256: { type: 'string' },
          signedIndexDigest: { type: 'string', nullable: true },
          match: { type: 'boolean', nullable: true },
          kid: { type: 'string' },
          source: { type: 'string', enum: ['live', 'bundle'] },
          error: { type: 'string' },
        },
        required: ['file', 'url'],
      },
    },
    responses: {
      Error: {
        description: 'Error object.',
        content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } }, required: ['error'] } } },
      },
    },
  },
};

// -------------------------------------------------------------------- main
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...CORS } });
    }

    if (path === '/mcp') {
      if (request.method !== 'POST') {
        return errorJson('MCP endpoint accepts POST (stateless JSON-RPC).', 405);
      }
      return handleMcp(request);
    }
    if (request.method !== 'GET') {
      return errorJson('Method not allowed', 405);
    }

    if (path === '/') return textResponse(landingHtml(), 'text/html; charset=utf-8');
    // IndexNow key file for this host — served by the canonical API
    // worker since the catalog-registry batch (2026-11-03) absorbed
    // the interim standalone key worker's exact-path route.
    if (path === '/bbf7b7d5281876c13897f6e1498f6cc56abb3487f12603698128f7b08bae3a6d.txt') return textResponse('bbf7b7d5281876c13897f6e1498f6cc56abb3487f12603698128f7b08bae3a6d', 'text/plain; charset=utf-8');
    if (path === '/openapi.json') return jsonResponse(OPENAPI);
    if (path === '/v1/services') {
      return jsonResponse({ count: services.length, services: services.map(serviceSummary) });
    }
    if (path.startsWith('/v1/services/')) {
      const id = decodeURIComponent(path.slice('/v1/services/'.length));
      const s = servicesById.get(id);
      if (!s) return errorJson(`unknown service id: ${id}`, 404);
      return jsonResponse(serviceDetail(s));
    }
    if (path === '/v1/datasets') {
      return jsonResponse({ count: datasetsInventory.length, datasets: datasetsInventory });
    }
    if (path.startsWith('/v1/datasets/')) {
      const file = normalizeDatasetName(decodeURIComponent(path.slice('/v1/datasets/'.length)));
      if (!file) return errorJson('unknown dataset', 404);
      const rawDataset = await dsText(file);
      if (rawDataset === undefined) return errorJson('dataset unavailable', 502);
      return textResponse(rawDataset, 'application/json; charset=utf-8');
    }
    if (path === '/v1/intent') {
      return jsonResponse(paginate(filterIntent(url.searchParams), url.searchParams));
    }
    if (path === '/v1/answer-evidence') {
      const table = url.searchParams.get('table');
      const rawDoc = await dsText('datasets-answer-evidence.json');
      if (rawDoc === undefined) return errorJson('dataset unavailable', 502);
      if (!table) return textResponse(rawDoc, 'application/json; charset=utf-8');
      const tables = {
        questions: '#dataset-answer-evidence-questions',
        fragments: '#dataset-answer-evidence-fragments',
        coverage: '#dataset-answer-evidence-coverage',
        profiles: '#dataset-answer-evidence-profiles',
        observations: '#dataset-answer-evidence-observations',
        reviews: '#dataset-answer-evidence-reviews',
        gaps: '#dataset-answer-evidence-gaps',
      };
      const suffix = tables[table];
      if (!suffix) return errorJson(`unknown table: ${table}`, 404);
      const doc = JSON.parse(rawDoc);
      const node = (doc['@graph'] || []).find((n) => String(n['@id']).endsWith(suffix));
      if (!node) return errorJson(`table not found: ${table}`, 404);
      return jsonResponse(node);
    }
    if (path === '/v1/local-graph') {
      const table = url.searchParams.get('table');
      const rawDoc = await dsText('datasets-local-graph-registry.json');
      if (rawDoc === undefined) return errorJson('dataset unavailable', 502);
      if (!table) return textResponse(rawDoc, 'application/json; charset=utf-8');
      const tables = {
        branches: '#dataset-local-graph-registry-branches',
        records: '#dataset-local-graph-registry-records',
        coverage: '#dataset-local-graph-registry-coverage',
        reviews: '#dataset-local-graph-registry-reviews',
        collisions: '#dataset-local-graph-registry-collisions',
        gaps: '#dataset-local-graph-registry-gaps',
        'owner-steps': '#dataset-local-graph-registry-owner-steps',
      };
      const suffix = tables[table];
      if (!suffix) return errorJson(`unknown table: ${table}`, 404);
      const doc = JSON.parse(rawDoc);
      const node = (doc['@graph'] || []).find((n) => String(n['@id']).endsWith(suffix));
      if (!node) return errorJson(`table not found: ${table}`, 404);
      return jsonResponse(node);
    }
    if (path === '/v1/crawl-presence') {
      const table = url.searchParams.get('table');
      const rawDoc = await dsText('datasets-crawl-presence.json');
      if (rawDoc === undefined) return errorJson('dataset unavailable', 502);
      if (!table) return textResponse(rawDoc, 'application/json; charset=utf-8');
      const tables = {
        collections: '#dataset-crawl-presence-collections',
        presence: '#dataset-crawl-presence-crawl-presence',
        summary: '#dataset-crawl-presence-presence-summary',
        robots: '#dataset-crawl-presence-robots-policy',
        signals: '#dataset-crawl-presence-signal-observations',
        inspections: '#dataset-crawl-presence-filter-inspections',
        releases: '#dataset-crawl-presence-corpus-release-checks',
        gaps: '#dataset-crawl-presence-gaps',
        mechanisms: '#dataset-crawl-presence-mechanism-pins',
      };
      const suffix = tables[table];
      if (!suffix) return errorJson(`unknown table: ${table}`, 404);
      const doc = JSON.parse(rawDoc);
      const node = (doc['@graph'] || []).find((n) => String(n['@id']).endsWith(suffix));
      if (!node) return errorJson(`table not found: ${table}`, 404);
      return jsonResponse(node);
    }
    if (path === '/v1/archives') {
      const table = url.searchParams.get('table');
      const rawDoc = await dsText('datasets-archive-registry.json');
      if (rawDoc === undefined) return errorJson('dataset unavailable', 502);
      if (!table) return textResponse(rawDoc, 'application/json; charset=utf-8');
      const tables = {
        targets: '#dataset-archive-registry-targets',
        captures: '#dataset-archive-registry-captures',
        deposits: '#dataset-archive-registry-deposits',
        github: '#dataset-archive-registry-github',
        'local-archive': '#dataset-archive-registry-local-archive',
        verification: '#dataset-archive-registry-verification',
        runs: '#dataset-archive-registry-runs',
        gaps: '#dataset-archive-registry-gaps',
        channels: '#dataset-archive-registry-channels',
        totals: '#dataset-archive-registry-totals',
      };
      const suffix = tables[table];
      if (!suffix) return errorJson(`unknown table: ${table}`, 404);
      const doc = JSON.parse(rawDoc);
      const node = (doc['@graph'] || []).find((n) => String(n['@id']).endsWith(suffix));
      if (!node) return errorJson(`table not found: ${table}`, 404);
      return jsonResponse(node);
    }
    if (path === '/v1/catalog') {
      const table = url.searchParams.get('table');
      const rawDoc = await dsText('datasets-catalog-registry.json');
      if (rawDoc === undefined) return errorJson('dataset unavailable', 502);
      if (!table) return textResponse(rawDoc, 'application/json; charset=utf-8');
      const tables = {
        catalogs: '#dataset-catalog-registry-catalogs',
        datasets: '#dataset-catalog-registry-datasets',
        observations: '#dataset-catalog-registry-observations',
        diagnostics: '#dataset-catalog-registry-diagnostics',
        gaps: '#dataset-catalog-registry-gaps',
        totals: '#dataset-catalog-registry-totals',
      };
      const suffix = tables[table];
      if (!suffix) return errorJson(`unknown table: ${table}`, 404);
      const doc = JSON.parse(rawDoc);
      const node = (doc['@graph'] || []).find((n) => String(n['@id']).endsWith(suffix));
      if (!node) return errorJson(`table not found: ${table}`, 404);
      return jsonResponse(node);
    }
    if (path === '/v1/page-data') {
      return jsonResponse({ count: pageDataInventory.length, pages: pageDataInventory });
    }
    if (path.startsWith('/v1/page-data/')) {
      const slug = decodeURIComponent(path.slice('/v1/page-data/'.length));
      const rec = pageDataBySlug.get(slug);
      if (!rec) return errorJson(`unknown page slug: ${slug}`, 404);
      return jsonResponse(rec);
    }
    if (path === '/v1/graph') {
      return textResponse(coreText['best-json-entity-graph.json'], 'application/json; charset=utf-8');
    }
    if (path === '/v1/index') {
      return textResponse(coreText['ai-master-index.json'], 'application/json; charset=utf-8');
    }
    if (path === '/v1/verify') {
      const file = url.searchParams.get('file');
      if (!file) return errorJson('missing ?file= parameter', 400);
      return jsonResponse(await verifyFile(file));
    }
    return errorJson('not found', 404);
  },
};
