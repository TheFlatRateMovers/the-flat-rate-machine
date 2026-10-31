# Verify fix record — WebMCP Agent Tools (2026-10-31)

Batch: WebMCP Agent Tools Live. Batch record:
`out/batch-webmcp-live/records/BATCH-RECORD.md`. This file records the
verify.js changes made in the same motion, per the standing rule
(rewrite a check stricter with a dated record; never waive a gate).

## §15 gains W-1..W-3 (new section, appended after §14)

All three checks fail closed: if the served page cannot be fetched, the
WebMCP layer is absent, or any descriptor is malformed, the check FAILS.

- **W-1** — the served shell (fetched from https://theflatratemovers.com/,
  never /index.html, which serves empty) contains the registration
  layer: the string `document.modelContext` plus a `registerTool`
  descriptor for each of the seven tools by exact name
  (search_services, get_service, list_service_areas, find_dataset,
  search_intent, verify_certificate, get_quote_guidance).
- **W-2** — the form disposition, asserted on served bytes: the hero
  form tag carries `toolname="start_flat_rate_quote"` and a
  `tooldescription`; the string `toolautosubmit` appears NOWHERE in the
  served shell (no form is agent-submittable); and the quote-form byte
  segment (`<form id="quoteForm"…</form>`) re-computes to the canonical
  md5 `4d8d49f05b22b129eac623a41370d9cb` on the SERVED bytes — the
  quote-form byte-identity gate, previously a batch-time discipline
  only, is now a permanent suite assertion.
- **W-3** — the served WebMCP script block is executed in a Node `vm`
  against a mock `document.modelContext` provider, and every captured
  descriptor is validated: the tool set matches the seven names exactly;
  each `inputSchema` is an object schema whose every property carries a
  `type` and a `description`; every `required` entry names a declared
  property; annotations are `readOnlyHint: true` and
  `consequentialHint: false`; `execute` is a function; descriptions are
  substantive (≥ 40 chars). These are exactly the failure modes of
  Lighthouse's `webmcp-schema-validity` audit, asserted at the source so
  the layer cannot rot silently between PageSpeed runs.

No existing check was changed. Suite total moves 97 → 100.
