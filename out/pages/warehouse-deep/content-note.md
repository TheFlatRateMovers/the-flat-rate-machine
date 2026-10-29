# Content note — Warehouse Relocation deep-data package (staged build)

## What the live page already says (verified live 2026-10-29)

The warehouse-relocation page is live and full-format: 1,686 words, 11 headings (Who it is for; What it includes; How it works; Standard Job Pricing; Winchester branch; Martinsburg branch; Where we serve; Related pages; Questions, answered; Service area, published data & quote; Sources & attestation), FAQ section, branch sections with address/hours/rating/areas kept distinct, per-page JSON returning application/json, node in both machine graphs + the head graph. Published scope, verbatim in substance: warehouse and distribution moves, warehouse load-outs and inbound unloads, transload staging, and restacking, by supervised warehouse teams, planned around the site (access, floor space, staging, equipment handling), quoted flat per job with no required contract duration, CWT schedule verbatim, SIR conditional for 1,500–3,500 lb assets with L/360.

## What this package adds (not a rewrite of the live page)

1. **Node refresh.** The live nodes exist but are thin: entity node has no `url`; head node has no `url` and no Place chain (7 flat areaServed strings); best node has `url` but no Place chain. This package stages the full canonical node (same @id, full chain, `url` everywhere) for merge into both graphs + the head upgrade.
2. **D1–D8 full datasets.** The Phase C dataset node was removed under the never-light rule. This package supplies the full database (research doc §6): operations, facility/access, taxonomy, phasing/continuity, commercial terms, personas/triggers, inventory/protection/compliance, areas/dispatch/quote path — CC BY 4.0, converted to Dataset JSON-LD at merge.
3. **Large rubric.** Full fact table with source + date per fact, 16 named gaps, R1–R5 = 3, R6 = 3, R7 = 2.
4. **Phase E depth brief (staged guidance only — NOT a live edit).** See below.

## Page-mechanism decision: NO new page — with evidence

The page exists live with the SERP #1 intent locked, its own node, schema, and per-page JSON. A second warehouse hub would split that intent and cannibalize the page built to lock it. The Phase C rationale stands: one two-branch page because the SERP query is Virginia-wide. No content.md / meta.json / backlinks.md staged here, deliberately — the live page already carries them (Phase C backlinks verified 8/8; live sitemap 153 re-verified at deploy). No branch warehouse pages are proposed.

## Phase E depth brief (guidance for a future copy pass, not this package)

1. **Phasing-models explainer.** The sharpest vocabulary gap in the category: "phased" = 0 site-wide while phasing is the industry's core product. Add a domain-labeled explainer: phased zone moves vs big-bang moves; wave order (non-critical → core SKUs → equipment last); velocity-first moves; after-hours/weekend moves. Label every model domain; promise nothing until §8 Q7 is answered.
2. **Continuity workstream block.** Domain-labeled: customer communication (proactive, specific, early); schedule around busiest shipping days; overflow/staging buffer; backup procedures; daily check-ins. Frame continuity as its own workstream — the question "how do orders keep moving while the building changes?"
3. **Inventory-accuracy block.** Domain-labeled: pre-move audit + dead-stock purge; tagged/counted waves mapped old-location → new-location; WMS locations updated wave by wave; post-move validation (spot checks, first cycle count reconciles). Never present as a published company offering until §8 Q8 is answered.
4. **Downtime-math explainer.** Domain-labeled, attributed: the ADSI $260,000/hour average unplanned-downtime claim and the "one delayed shift can exceed the moving invoice" framing. Education only — never a company figure, never a downtime guarantee.
5. **Cross-links.** Industrial & Commercial Services (parent); transloading pages (staging overlap, cross-ref only); FF&E/workforce (project-support spine); SIR conditional (high-mass assets only); moving-and-storage (leased storage is a SEPARATE service — link only where a reader genuinely needs storage, never blur staging into storage).
6. **Optional image.** Face-blurred warehouse photos (img-18/img-19) live on the industrial page; attach one to the warehouse page at Phase E ONLY if the filenames check out and the caption stays honest ("faces blurred for privacy", supplied photo, not a warehouse-relocation job photo unless verified as one).

## What this package deliberately does NOT do

No new page; no branch pages; no services.json or pages.json change (both entries already live); no sitemap count change (stays 153); no services count change (stays 22); no GBP edit; no live-site edit; no deploy; no GitHub push; no quote test post; no facility/equipment/drayage/chassis/bonded/FTZ/reefer/customs/racking-install/phasing-promise/WMS/permit/debris claim; no price beyond the verbatim CWT schedule; no household-storage claim.
