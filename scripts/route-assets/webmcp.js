
/* The Flat Rate Machine — WebMCP agent tools (Batch WebMCP, 2026-10-31).
   Read-only tools for AI agents browsing theflatratemovers.com, backed by
   the estate's own signed data through https://api.theflatratemovers.com.
   Standards-track shape (W3C WebMCP draft): registers only where
   document.modelContext (or the legacy navigator.modelContext) exists;
   a complete no-op everywhere else. No tool writes, submits, sends, or
   transacts anything. The quote form is never agent-submittable: the
   declarative annotation below carries no auto-submit attribute, so invoking
   it only fills and focuses the form for the person, and the form's own
   submit handler refuses agent-invoked submits (SubmitEvent agentInvoked flag). */
(function () {
  'use strict';
  var mc = null;
  try {
    mc = (typeof document !== 'undefined' && document.modelContext) ||
         (typeof navigator !== 'undefined' && navigator.modelContext) || null;
  } catch (e) { mc = null; }
  if (!mc || typeof mc.registerTool !== 'function') return;

  var API = 'https://api.theflatratemovers.com';
  var SITE = 'https://theflatratemovers.com';

  function getJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function out(obj) { return typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2); }
  function fail(msg) { return 'That lookup could not be completed right now. ' + msg; }
  function tokens(q) {
    return String(q || '').toLowerCase().split(/\s+/).filter(function (t) { return t.length > 0; });
  }
  function matchesAll(hay, toks) {
    var h = String(hay || '').toLowerCase();
    return toks.every(function (t) { return h.indexOf(t) >= 0; });
  }
  var READONLY = { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false };

  var tools = [
    {
      name: 'search_services',
      description: 'Search the moving and logistics services The Flat Rate Movers publishes — residential, commercial and office moving, long-distance, gun safes and SIR heavy assets (1,500–3,500 lbs), pianos and antiques, ISPM 15 export packing and custom crating, transloading, final-mile delivery, data center and medical/lab relocation, warehouse racking, FF&E, workforce project support, junk removal, storage and more. Returns matching services with their canonical page URLs. Read-only: it changes nothing.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Words to match against service names, types and descriptions — for example "gun safe", "transloading" or "office". Leave empty to list every published service.' }
        },
        required: []
      },
      annotations: READONLY,
      execute: async function (args) {
        try {
          var d = await getJson(API + '/v1/services');
          var toks = tokens(args && args.query);
          var hits = (d.services || []).filter(function (s) {
            return !toks.length || matchesAll(s.name + ' ' + s.serviceType + ' ' + s.description + ' ' + s.id, toks);
          }).map(function (s) {
            return { id: s.id, name: s.name, serviceType: s.serviceType, url: s.url };
          });
          return out({ totalPublished: (d.services || []).length, matches: hits });
        } catch (e) {
          return fail('Browse all services at ' + SITE + '/services/');
        }
      }
    },
    {
      name: 'get_service',
      description: 'Get the full published detail for one service of The Flat Rate Movers by its service id (from search_services): its name, type, canonical page, full description, the datasets that document it, and how many search-intent rows point at it. Read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          service_id: { type: 'string', description: 'The service id, for example "service-gun-safe". Use search_services to find ids.' }
        },
        required: ['service_id']
      },
      annotations: READONLY,
      execute: async function (args) {
        var id = String((args && args.service_id) || '').trim();
        if (!id) return 'A service_id is required — call search_services to list the published ids.';
        try {
          var r = await fetch(API + '/v1/services/' + encodeURIComponent(id));
          if (r.status === 404) return 'No published service has the id "' + id + '". Call search_services to list the real ids.';
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return out(await r.json());
        } catch (e) {
          return fail('Service pages are listed at ' + SITE + '/services/');
        }
      }
    },
    {
      name: 'list_service_areas',
      description: 'Look up where The Flat Rate Movers works: the published two-branch footprint (53 GeoJSON areas — Winchester, VA and Martinsburg, WV branches, 14 areas shared). With a place name, returns the matching areas and which branch serves each; with no input, returns the full footprint summary and every area name. The branches are distinct and are never blended. Read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          place: { type: 'string', description: 'Optional place to look up — for example "Leesburg", "Bristow" or "Berkeley". Leave empty for the whole footprint.' }
        },
        required: []
      },
      annotations: READONLY,
      execute: async function (args) {
        try {
          var g = await getJson(SITE + '/service-area.geojson');
          var feats = g.features || [];
          var branchName = function (b) {
            if (b === 'winchester') return 'Winchester, VA branch — The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester, VA 22601';
            if (b === 'martinsburg') return 'Martinsburg, WV branch — Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404';
            return 'both branches (shared area)';
          };
          var slim = function (f) {
            var p = f.properties || {};
            var o = { name: p.name, state: p.state, county: p.county, postalCode: p.postal_code, kind: p.type, servedBy: branchName(p.branch) };
            if (f.geometry && f.geometry.coordinates) o.coordinates = f.geometry.coordinates;
            return o;
          };
          var q = String((args && args.place) || '').trim().toLowerCase();
          if (q) {
            var hits = feats.filter(function (f) { return String((f.properties || {}).name || '').toLowerCase().indexOf(q) >= 0; }).map(slim);
            return out(hits.length ? { matches: hits } : { matches: [], note: '"' + (args && args.place) + '" is not in the published footprint. The footprint covers the Shenandoah Valley, the Eastern Panhandle and the I-81 / I-66 / I-70 corridors from Winchester, VA and Martinsburg, WV.' });
          }
          var counts = { winchester: 0, martinsburg: 0, shared: 0 };
          feats.forEach(function (f) {
            var b = (f.properties || {}).branch;
            if (b === 'winchester') counts.winchester++;
            else if (b === 'martinsburg') counts.martinsburg++;
            else if (b === 'both') counts.shared++;
          });
          return out({
            totalAreas: feats.length,
            branchCounts: counts,
            branches: g.branches || undefined,
            areas: feats.map(function (f) { return (f.properties || {}).name; }),
            source: SITE + '/service-area.geojson'
          });
        } catch (e) {
          return fail('The published footprint is at ' + SITE + '/service-area.geojson');
        }
      }
    },
    {
      name: 'find_dataset',
      description: 'Find the published machine-readable datasets of The Flat Rate Movers (32 files: operations, taxonomy, commercial terms, buyer personas, compliance and coverage per service family, plus the search-intent coverage dataset). Returns each match with its human landing page, its direct download URL and its SHA-256 digest from the signed index. All datasets are CC BY 4.0. Read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Words to match against dataset names and file names — for example "gun safe", "intent" or "ocean container". Leave empty to list all datasets.' }
        },
        required: []
      },
      annotations: READONLY,
      execute: async function (args) {
        try {
          var d = await getJson(API + '/v1/datasets');
          var toks = tokens(args && args.query);
          var hits = (d.datasets || []).filter(function (x) {
            return !toks.length || matchesAll(x.name + ' ' + x.file, toks);
          }).map(function (x) {
            return { file: x.file, name: x.name, landingPage: x.landingPage, download: x.fileUrl, sha256: x.sha256 };
          });
          return out({ totalPublished: (d.datasets || []).length, matches: hits, hub: SITE + '/datasets/' });
        } catch (e) {
          return fail('The dataset hub is at ' + SITE + '/datasets/');
        }
      }
    },
    {
      name: 'search_intent',
      description: 'Search The Flat Rate Machine\'s intent rubric: published rows that map real customer questions to the exact page that answers them, each row carrying its certificate fingerprints and an outcome record across the gates (crawled, indexed, understood, corroborated, cited-and-maintained). Use it to find which page answers a question, or to audit coverage by service or area. Read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Optional words to match against the question text of the rows.' },
          service: { type: 'string', description: 'Optional service id filter, for example "service-transloading" (ids come from search_services).' },
          area: { type: 'string', description: 'Optional service-area filter as recorded on the rows, for example "winchester".' },
          intent_class: { type: 'string', description: 'Optional intent class filter: navigational-local, cost, how-process, best-choice or ai-question.' },
          limit: { type: 'integer', minimum: 1, maximum: 50, description: 'How many rows to return (default 10, maximum 50).' }
        },
        required: []
      },
      annotations: READONLY,
      execute: async function (args) {
        try {
          var a = args || {};
          var qs = new URLSearchParams();
          if (a.query) qs.set('q', a.query);
          if (a.service) qs.set('service', a.service);
          if (a.area) qs.set('area', a.area);
          if (a.intent_class) qs.set('intent_class', a.intent_class);
          qs.set('limit', String(Math.min(50, Math.max(1, a.limit || 10))));
          var d = await getJson(API + '/v1/intent?' + qs.toString());
          var rows = (d.results || []).map(function (r) {
            return {
              question: r.query_text, intentClass: r.intent_class, service: r.service_id, area: r.area,
              answerPage: r.target_url, outcome: r.outcome ? r.outcome.status : undefined
            };
          });
          return out({ totalRows: d.total, returned: rows.length, rows: rows });
        } catch (e) {
          return fail('The intent dataset is published at ' + SITE + '/datasets-intent-coverage.json');
        }
      }
    },
    {
      name: 'verify_certificate',
      description: 'Verify one of The Flat Rate Movers\' published files against the company\'s signed AI master index (Ed25519 certificate, key id theflatratemovers-2026-10-29-1): the live file is re-hashed at request time and compared with the digest the certificate carries. Returns whether they match. Read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'A published file name from the signed index — for example "datasets-intent-coverage.json", "llms.txt" or "service-area.geojson".' }
        },
        required: ['file']
      },
      annotations: READONLY,
      execute: async function (args) {
        var f = String((args && args.file) || '').trim();
        if (!f) return 'A file name is required — for example "datasets-intent-coverage.json".';
        try {
          var r = await fetch(API + '/v1/verify?file=' + encodeURIComponent(f));
          if (r.status === 404) return 'The signed index carries no file named "' + f + '".';
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return out(await r.json());
        } catch (e) {
          return fail('The signed index is published at ' + SITE + '/ai-master-index.json with its key at ' + SITE + '/.well-known/signing-keys.json');
        }
      }
    },
    {
      name: 'get_quote_guidance',
      description: 'Explain how getting a flat rate quote from The Flat Rate Movers works: the Short (Quick Quote) and Detailed Project forms, what a person must provide, and what happens after they submit. Information only — this tool cannot request a quote, and no agent can submit the quote form; the person always completes and submits it themselves.',
      inputSchema: { type: 'object', properties: {}, required: [] },
      annotations: READONLY,
      execute: async function () {
        return [
          'How a flat rate quote works at The Flat Rate Movers:',
          '',
          '1. The person opens ' + SITE + '/quote/ and chooses Short (Quick Quote, the default) or Detailed Project on the toggle attached to the "Get My Flat Rate Quote" button. Switching keeps the From, To and What\'s moving answers.',
          '2. Every job is reviewed in full — scope, distance, manpower and equipment — and priced at one flat rate in writing before move day. There is no hourly rate, ever. The company promise is "Guaranteed Flat Rate or Your Move is Free!"',
          '3. Required to submit: moving from, moving to, contact name, phone and email. Move dates are optional and are captured when given. A free film-only video walkthrough (the Survey Room) can support the estimate; clips auto-delete after 24 hours and the estimate is made by a person, never auto-priced.',
          '4. The quote goes directly to the company (ratemovers@gmail.com) with no third-party form service. A person reviews every request and replies.',
          '',
          'An AI agent can fill in the on-page quote form for the person, but it cannot submit it — submission is always the person\'s own click.',
          'Prefer to talk? Call +1-540-422-2153. Winchester, VA: Mon–Fri 8–6, Sat 8–4, Sun 9–4. Martinsburg, WV: Mon–Fri 9–6, Sat 9–4, Sun 9–4.'
        ].join('\n');
      }
    }
  ];

  tools.forEach(function (t) {
    try {
      var p = mc.registerTool(t);
      if (p && typeof p.catch === 'function') p.catch(function () {});
    } catch (e) { /* one tool failing never blocks the rest, or the page */ }
  });

  /* Declarative form coverage for the real quote form. The form's bytes
     are certificate-sealed and never edited, so its WebMCP attributes are
     applied here, at runtime, only in browsers that expose WebMCP. There
     is deliberately NO auto-submit attribute: invoking this tool fills and
     focuses the form for the person — submission stays the person's own
     click, and the submit handler refuses agent-invoked submits. Field
     names mirror the field ids the form already uses (its own logic
     reads by id and never builds a FormData), and descriptions come from
     each field's own label, so the derived schema is complete and valid. */
  try {
    var annotateQuoteForm = function (form) {
      if (!form) return;
      /* Annotate while DETACHED, then reinsert at the exact original
         position in the same synchronous block. Chrome validates a
         form's WebMCP annotation per attribute change and files a
         permanent DevTools issue for any half-annotated state it
         observes on the CONNECTED form (toolname present,
         tooldescription not yet) — and the Lighthouse schema audit
         fails on that filed issue even though the second attribute
         lands one statement later, because the audit reads the
         browser's issue stream, not the final DOM. A form that
         connects already carrying the complete annotation — the
         markup-annotated hero form is the proof case — validates
         clean. The node itself is never replaced: the same element
         comes out and goes back, so its submit handler (with the
         agentInvoked guard), its fields and their state are
         untouched, and no paint or interaction can interleave inside
         one synchronous task at parse time. Reinsertion is finally-
         guaranteed: the form can never be left out of the document.
         Batch record: out/batch-webmcp-schema-fix-live. */
      var annotate = function () {
        form.setAttribute('toolname', 'request_flat_rate_quote');
        form.setAttribute('tooldescription', 'The Flat Rate Movers quote form. Filling this in prepares a flat rate quote request for the person to review — it cannot submit: there is no auto-submit, and the person presses "Get My Flat Rate Quote" themselves. Required: moving from, moving to, contact name, phone, email. The price is one flat rate in writing, never hourly.');
        var fields = form.querySelectorAll('input[id], select[id], textarea[id]');
        for (var i = 0; i < fields.length; i++) {
          var el = fields[i];
          if (!el.getAttribute('name')) el.setAttribute('name', el.id);
          if (!el.getAttribute('toolparamdescription')) {
            var lab = el.closest ? el.closest('label') : null;
            var txt = '';
            if (lab) {
              for (var k = 0; k < lab.childNodes.length; k++) {
                var n = lab.childNodes[k];
                if (n === el) break;
                if (n.nodeType === 3) txt += n.textContent;
              }
              if (!txt) txt = lab.textContent || '';
            }
            txt = txt.replace(/\s+/g, ' ').replace(/\s*\*\s*$/, '').trim();
            if (txt) el.setAttribute('toolparamdescription', txt.slice(0, 140));
          }
        }
      };
      var parent = form.parentNode;
      var anchor = form.nextSibling;
      var detached = false;
      if (parent) {
        try { parent.removeChild(form); detached = true; } catch (e) { detached = false; }
      }
      try {
        annotate();
      } finally {
        if (detached && parent) parent.insertBefore(form, anchor);
      }
    };
    /* Solution A (2026-10-31): the quote form may arrive by client-side
       swap after this script has run; the router calls this hook with
       the freshly inserted form so it receives the same atomic
       detach/annotate/reinsert treatment as a direct load. */
    document.__frmAnnotateQuoteForm = annotateQuoteForm;
    annotateQuoteForm(document.getElementById('quoteForm'));
  } catch (e) { /* annotation is additive only; never break the form */ }
})();
