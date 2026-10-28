# Flat Rate Machine — Gap Queue (Phase 2)

**Rule: nothing here auto-publishes.** Planned pages go through the Phase 3 rubric gate with owner approval per batch. Dataset amendments are listed for one owner-approval batch and are NOT applied here. A missing fact is flagged, never filled.

## Totals

- Total open items: **51**
- P1: 3
- P2: 42
- P3: 6

By category:
- generic-template-page: 34
- corridor-page: 2
- branch-specific-page: 2
- dataset-amendment: 7
- decision: 2
- question-transcription: 1
- pending-source-pull: 3

## P1 (3)

### Interstate 66 corridor page

- **ID:** gap-corridor-i-66 · **Category:** corridor-page · **Approval:** owner-approval-per-batch
- **Corridor:** Interstate 66 · **Proposed slug:** interstate-66-corridor
- **Outline sections:** What it includes (verified); Who it is for (missing); Where we serve (verified); Route description (path, exits, stops) (missing); Questions, answered (verified); Quote (verified)
- **Missing:** Dedicated corridor page does not exist. Outline sections flagged missing: Who it is for; Route description (path, exits, stops).
- **Fills from:** Verified corridor + branch facts in the planner outline (out/planner-matrix.json); missing sections require owner input, flagged not filled.
- **Source:** data/corridors.json + out/planner-matrix.json

### Interstate 70 corridor page

- **ID:** gap-corridor-i-70 · **Category:** corridor-page · **Approval:** owner-approval-per-batch
- **Corridor:** Interstate 70 · **Proposed slug:** interstate-70-corridor
- **Outline sections:** What it includes (verified); Who it is for (missing); Where we serve (verified); Route description (path, exits, stops) (missing); Questions, answered (verified); Quote (verified)
- **Missing:** Dedicated corridor page does not exist. Outline sections flagged missing: Who it is for; Route description (path, exits, stops).
- **Fills from:** Verified corridor + branch facts in the planner outline (out/planner-matrix.json); missing sections require owner input, flagged not filled.
- **Source:** data/corridors.json + out/planner-matrix.json

### 15 planned branch-specific service pages for Martinsburg

- **ID:** gap-branch-pages-martinsburg · **Category:** branch-specific-page · **Approval:** owner-approval-per-batch
- **Count:** 15
- **Planned slugs:** local-regional-movers-martinsburg-wv, long-distance-movers-martinsburg-wv, packing-movers-martinsburg-wv, sir-heavy-movers-martinsburg-wv, gun-safe-movers-martinsburg-wv, piano-antique-movers-martinsburg-wv, ispm15-movers-martinsburg-wv, crating-movers-martinsburg-wv, transloading-movers-martinsburg-wv, final-mile-movers-martinsburg-wv, office-moving-movers-martinsburg-wv, industrial-offices-movers-martinsburg-wv, government-movers-martinsburg-wv, military-movers-martinsburg-wv, industrial-commercial-movers-martinsburg-wv
- **Missing:** No branch-specific page exists for 15 service × martinsburg combinations (company-wide service pages exist, but no page speaks to this branch). Winchester has 29 branch-tagged pages vs Martinsburg 3 — the imbalance is systematic.
- **Fills from:** Planner matrix rows (out/planner-matrix.json): service + branch facts already in data/. No new fact is needed to plan these; content goes through the Phase 3 rubric gate.
- **Source:** out/planner-matrix.json

## P2 (42)

### AI License — Use of Published Data

- **ID:** gap-generic-ai-license · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** ai-license
- **Current template:** AI License — Use of Published Data — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Browse All Pages

- **ID:** gap-generic-all-pages · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** all-pages
- **Current template:** Browse All Pages — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Areas Served

- **ID:** gap-generic-areas-served · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** areas-served
- **Current template:** Areas Served — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Author — The Flat Rate Movers

- **ID:** gap-generic-author/ratemoversgmail-com · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** author/ratemoversgmail-com
- **Current template:** Author — The Flat Rate Movers — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Blog — Articles & Guides

- **ID:** gap-generic-blog · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** blog
- **Current template:** Blog — Articles & Guides — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Category — Logistics

- **ID:** gap-generic-category/logistics · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** category/logistics
- **Current template:** Category — Logistics — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Category — Shenandoah Valley Logistics

- **ID:** gap-generic-category/shenandoah-valley-logistics · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** category/shenandoah-valley-logistics
- **Current template:** Category — Shenandoah Valley Logistics — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Category — Winchester VA

- **ID:** gap-generic-category/winchester-va · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** category/winchester-va
- **Current template:** Category — Winchester VA — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Category — Relocation Services

- **ID:** gap-generic-category/winchester-va/residential-logistics/relocation-services · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** category/winchester-va/residential-logistics/relocation-services
- **Current template:** Category — Relocation Services — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Developer Resources

- **ID:** gap-generic-developer · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** developer
- **Current template:** Developer Resources — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Docs — Reference Library

- **ID:** gap-generic-docs · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** docs
- **Current template:** Docs — Reference Library — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Docs — Logistics Event Protocol

- **ID:** gap-generic-docs/logistics-event-protocol · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** docs/logistics-event-protocol
- **Current template:** Docs — Logistics Event Protocol — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Docs — Logistics Ontology

- **ID:** gap-generic-docs/logistics-ontology · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** docs/logistics-ontology
- **Current template:** Docs — Logistics Ontology — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Entities — Index

- **ID:** gap-generic-entities · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** entities
- **Current template:** Entities — Index — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Entity Authority Layer

- **ID:** gap-generic-entity-authority-layer · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** entity-authority-layer
- **Current template:** Entity Authority Layer — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### FAQ — Questions, Answered

- **ID:** gap-generic-faq · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** faq
- **Current template:** FAQ — Questions, Answered — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Find Us — Winchester VA & Martinsburg WV

- **ID:** gap-generic-find-us · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** find-us
- **Current template:** Find Us — Winchester VA & Martinsburg WV — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Flat Rate Moving Quote — Winchester

- **ID:** gap-generic-flat-rate-moving-quote-winchester · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** flat-rate-moving-quote-winchester
- **Current template:** Flat Rate Moving Quote — Winchester — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Knowledge — Entities

- **ID:** gap-generic-knowledge-entities · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** knowledge-entities
- **Current template:** Knowledge — Entities — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Knowledge — Equipment

- **ID:** gap-generic-knowledge-equipment · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** knowledge-equipment
- **Current template:** Knowledge — Equipment — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Knowledge — Events

- **ID:** gap-generic-knowledge-events · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** knowledge-events
- **Current template:** Knowledge — Events — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Knowledge — Locations

- **ID:** gap-generic-knowledge-locations · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** knowledge-locations
- **Current template:** Knowledge — Locations — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Knowledge — Services

- **ID:** gap-generic-knowledge-services · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** knowledge-services
- **Current template:** Knowledge — Services — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Logistics Data Engineering Center

- **ID:** gap-generic-logistics-data-engineering-center · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** logistics-data-engineering-center
- **Current template:** Logistics Data Engineering Center — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Moving Cost Guide — Winchester VA

- **ID:** gap-generic-moving-cost-guide-winchester-va · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** moving-cost-guide-winchester-va
- **Current template:** Moving Cost Guide — Winchester VA — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Moving Questions & Answers

- **ID:** gap-generic-moving-questions-answers · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** moving-questions-answers
- **Current template:** Moving Questions & Answers — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Online Estimate

- **ID:** gap-generic-online-estimate · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** online-estimate
- **Current template:** Online Estimate — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Privacy Policy

- **ID:** gap-generic-privacy-policy · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** privacy-policy
- **Current template:** Privacy Policy — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Get a flat rate quote

- **ID:** gap-generic-quote · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** quote
- **Current template:** Get a flat rate quote — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Recursive Indexing Layer

- **ID:** gap-generic-recursive-indexing-layer · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** recursive-indexing-layer
- **Current template:** Recursive Indexing Layer — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Service Areas — Moving Company

- **ID:** gap-generic-service-areas-moving-company · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** service-areas-moving-company
- **Current template:** Service Areas — Moving Company — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Services

- **ID:** gap-generic-services · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** services
- **Current template:** Services — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### Sitemap — All Pages & Redirects

- **ID:** gap-generic-sitemap · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** sitemap
- **Current template:** Sitemap — All Pages & Redirects — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### The Flat Rate Logistics Data Hub

- **ID:** gap-generic-the-flat-rate-logistics-data-hub · **Category:** generic-template-page · **Approval:** owner-approval-per-batch
- **Page:** the-flat-rate-logistics-data-hub
- **Current template:** The Flat Rate Logistics Data Hub — The Flat Rate Movers, flat-rate moving from Winchester, VA and Martinsburg, WV. Guaranteed Flat Rate or Your Move is Free!
- **Missing:** Editorial meta description and page-specific content; the page currently carries only the generic company template.
- **Fills from:** Owner editorial input + existing page content transcribed through the Phase 3 rubric gate. No dataset fact fills this; do not auto-fit a service template.
- **Source:** out/meta.diff.json genericTemplatePages + out/meta.generated.json

### 7 planned branch-specific service pages for Winchester

- **ID:** gap-branch-pages-winchester · **Category:** branch-specific-page · **Approval:** owner-approval-per-batch
- **Count:** 7
- **Planned slugs:** commercial-movers-winchester-va, local-regional-movers-winchester-va, office-moving-movers-winchester-va, industrial-offices-movers-winchester-va, government-movers-winchester-va, military-movers-winchester-va, industrial-commercial-movers-winchester-va
- **Missing:** No branch-specific page exists for 7 service × winchester combinations (company-wide service pages exist, but no page speaks to this branch). Winchester has 29 branch-tagged pages vs Martinsburg 3 — the imbalance is systematic.
- **Fills from:** Planner matrix rows (out/planner-matrix.json): service + branch facts already in data/. No new fact is needed to plan these; content goes through the Phase 3 rubric gate.
- **Source:** out/planner-matrix.json

### Dataset amendment: Company contact email (locations.json company record)

- **ID:** amend-company-email · **Category:** dataset-amendment · **Approval:** owner-facts
- **Field:** Company contact email (locations.json company record)
- **Missing:** No email field exists in any Phase 0 dataset, so generators omit it from graphs, llms.txt, and ai-sitemap creator blocks.
- **Fills from:** Owner attestation in the amendment batch. The address used on the live site is NOT copied in silently; the batch must attest it with source + date.
- **Source:** graph.diff gaps: Organization.email; ai.diff gaps: creator.email / llms social+email

### Dataset amendment: Organization.sameAs social profile URLs

- **ID:** amend-sameas · **Category:** dataset-amendment · **Approval:** owner-facts
- **Field:** Organization.sameAs social profile URLs
- **Missing:** Social URLs are in no Phase 0 dataset, so generators omit sameAs from graphs and llms.txt.
- **Fills from:** Owner-confirmed social profile URLs, attested in the amendment batch. Handles are NOT copied in from memory or old files.
- **Source:** graph.diff gaps: Organization.sameAs; ai.diff gaps: creator.sameAs / llms social+email

### Dataset amendment: Organization.priceRange

- **ID:** amend-pricerange · **Category:** dataset-amendment · **Approval:** owner-facts
- **Field:** Organization.priceRange
- **Missing:** No priceRange field exists in any Phase 0 dataset, so generators omit it from graphs.
- **Fills from:** Owner-confirmed price range, attested in the amendment batch. No value is asserted here.
- **Source:** graph.diff gaps: Organization.priceRange

### Dataset amendment: Service → canonical page mapping

- **ID:** amend-service-page-mapping · **Category:** dataset-amendment · **Approval:** owner-decision
- **Field:** Service → canonical page mapping
- **Missing:** Pages reference services, but services carry no canonical page, so llms.txt and ai-sitemap service lists carry names + descriptions without links.
- **Fills from:** Planner matrix existing pages per service + owner choice of one canonical page per service. The choice is editorial, not derivable — it must be decided, not auto-picked.
- **Source:** ai.diff gaps: llms.txt service page links

### Dataset amendment: Questions bank (questions.json)

- **ID:** amend-questions-bank · **Category:** dataset-amendment · **Approval:** owner-facts
- **Field:** Questions bank (questions.json)
- **Missing:** No populated questions dataset exists, so ARD representativeQueries and llms FAQ content cannot be generated.
- **Fills from:** out/questions.scaffold.json (17 extracted questions) + pending source pulls (GSC, GBP, quote inquiries — see pending-source-pull items) + rubric-gate transcription of answers.
- **Source:** ai.diff gaps: ARD representativeQueries; DATA_MODEL questions schema-only

### Dataset amendment: Media inventory (logo + image filenames, captions, credits, face-blur flags)

- **ID:** amend-media-inventory · **Category:** dataset-amendment · **Approval:** owner-approval-per-batch
- **Field:** Media inventory (logo + image filenames, captions, credits, face-blur flags)
- **Missing:** Media is schema-only in Phase 0, so ARD logoUrl and graph logo/image are omitted.
- **Fills from:** Live site source asset list (filenames, captions, credits) inventoried in Phase 4 + owner confirmation of company-work vs style-example and face-blur flags.
- **Source:** graph.diff gaps: knowsAbout/logo/image; ai.diff gaps: ARD host.logoUrl

### Dataset amendment: Changelog / statistics dataset

- **ID:** amend-changelog-stats · **Category:** dataset-amendment · **Approval:** owner-facts
- **Field:** Changelog / statistics dataset
- **Missing:** No changelog or statistics dataset exists, so llms.txt dated update narratives and GSC statistics cannot be generated (or a decision to drop dated narratives from llms.txt is needed).
- **Fills from:** Owner notes + GSC exports (pending source pull). If the owner prefers no dated narratives, this item closes by decision instead of data.
- **Source:** ai.diff gaps: llms.txt dated update narratives

## P3 (6)

### Decision: company-level hours in ai-sitemap creator block

- **ID:** decision-company-hours · **Category:** decision · **Approval:** owner-decision
- **Field:** Company-level hours policy
- **Missing:** Live ai-sitemap uses Winchester hours as company hours. Reproducing it would bake in a branch blend, so the generator omits company-level hours.
- **Fills from:** No dataset fact fills this — it is a policy choice. Recommendation: omit company-level hours (branches differ); publish hours per branch only.
- **Source:** out/ai.diff.json gaps: creator.openingHours

### Decision: @id migration if the generated graph ever replaces entity-graph.json

- **ID:** decision-atid-migration · **Category:** decision · **Approval:** owner-decision
- **Field:** @id migration (legacy aliases vs cutover)
- **Missing:** Generated graph changes branch @ids (#winchester-place → #winchester) and service @ids (page-slug → #service-* fragments). Publishing without a decision breaks existing @id references.
- **Fills from:** No dataset fact fills this — it is a migration choice: keep legacy @ids as aliases, or cut over. Must be decided before anything publishes.
- **Source:** out/phase1-report.md item 4

### Transcribe verified answers for 17 scaffolded questions

- **ID:** gap-question-transcription · **Category:** question-transcription · **Approval:** owner-approval-per-batch
- **Count:** 17
- **Questions:** q-001, q-002, q-003, q-004, q-005, q-006, q-007, q-008, q-009, q-010, q-011, q-012, q-013, q-014, q-015, q-016, q-017
- **Missing:** All 17 scaffolded questions have answer null. Answer text lives on their source pages but was not auto-paired from stripped HTML (unreliable).
- **Fills from:** Answer text on the source pages, transcribed through the Phase 3 rubric gate. A question with no answer on its source page stays null — a gap, not a draft.
- **Source:** out/questions.scaffold.json

### Pending source pull: Google Search Console queries

- **ID:** pull-gsc-queries · **Category:** pending-source-pull · **Approval:** owner-facts
- **Missing:** Real user questions from Google Search Console queries (count unknown until pulled). Zero queries are fabricated here.
- **Fills from:** In Google Search Console, property sc-domain:theflatratemovers.com, open Performance → Search results, set the date range, and export Queries. Filter to question-like queries (what / how / why / when / where / can / do). Add each query verbatim with source "GSC query" + export date. Requires a live browser session signed in as ratemovers@gmail.com; no GSC connector exists, and a generic subagent cannot perform this pull.
- **Source:** DATA_MODEL.md questions sources (Phase 2 order: GSC, quote inquiries, GBP, then FAQ pages)

### Pending source pull: Google Business Profile queries

- **ID:** pull-gbp-queries · **Category:** pending-source-pull · **Approval:** owner-facts
- **Missing:** Real user questions from Google Business Profile queries (count unknown until pulled). Zero queries are fabricated here.
- **Fills from:** In the Google Business Profile manager, open each branch profile (Winchester: The Flat Rate Movers; Martinsburg: Flat Rate Movers Martinsburg WV) and export the search-terms / queries report. Add each term verbatim with source "GBP query" + branch + export date. Requires a live browser session signed in as ratemovers@gmail.com.
- **Source:** DATA_MODEL.md questions sources (Phase 2 order: GSC, quote inquiries, GBP, then FAQ pages)

### Pending source pull: Quote-form inquiry questions

- **ID:** pull-quote-inquiries · **Category:** pending-source-pull · **Approval:** owner-facts
- **Missing:** Real user questions from Quote-form inquiry questions (count unknown until pulled). Zero queries are fabricated here.
- **Fills from:** In Gmail (ratemovers@gmail.com), review quote-form inquiry emails for question phrasing from real clients. Add each question verbatim with source "quote inquiry" + message date. No query text is pre-filled here — every entry must come from a real message.
- **Source:** DATA_MODEL.md questions sources (Phase 2 order: GSC, quote inquiries, GBP, then FAQ pages)

## Appendix A — Method notes

- **Branch inference (planner + questions):** a registry page counts as branch-specific when its slug or title contains 'winchester' or 'martinsburg' (both when both appear); otherwise company-wide. A planning heuristic, documented here, not a published claim.
- **Question extraction:** h2–h4 headings ending with '?' in the live site source, split into page chunks at id="page-<slug>" markers, deduplicated by normalized text. 17 unique questions from 18 headings (one duplicate across two pages). Verbatim only.
- **Question intent rule:** commercial if the question mentions price/flat/quote/cost/rate; else navigational if it mentions where/hours/serve/which base/find; else informational.
- **Answers:** every scaffolded answer is null. Answer text lives on the source pages and must be transcribed through the Phase 3 rubric gate; auto-pairing from stripped HTML was not attempted. A question with no answer on its source page stays null.
- **Corridor outlines:** sections carry verified content with a source, or content null with a missing note. Route paths, exits, stops, and corridor-specific audiences are NOT in any dataset and are flagged missing, never filled from general knowledge. Branch service areas in outlines are branch facts, not claims that a listed town sits on a given corridor.

## Appendix B — Phase 1 diff items deliberately NOT queued as data gaps

- WebSite / WebPage / BreadcrumbList nodes → Phase 3 page builder, not entity data.
- Standalone PostalAddress nodes → resolved: branch addresses are inline on LocalBusiness nodes (one copy, not two).
- Service @id pattern (page-slug vs #service-* fragments) → resolved: #service-* fragments from services.json are canonical.
- Service description wording → resolved: services.json (head-graph) descriptions are dataset truth.
- Dataset wrapper (attestations, chain, rubric, version) → provenance lives in the diff files and DATA_MODEL.md, not inside JSON-LD.
- ai-sitemap merged areaServed list → MUST NOT be reproduced: merging branches violates the branch rule. Per-branch areas live in locations.json and the GeoJSON.
- ai-sitemap mainEntity (sitemap_index.xml) → MUST NOT be reproduced: stale WordPress-era artifact, not the current sitemap.xml.
- ai-sitemap url / version conventions → recorded conventions (site root vs file URL; version stamp date), not data gaps.
- ARD descriptions / tags prose → editorial content for the Phase 3 gate, not a dataset gap.

## Appendix C — Pending source pulls (full steps)

### Google Search Console queries

In Google Search Console, property sc-domain:theflatratemovers.com, open Performance → Search results, set the date range, and export Queries. Filter to question-like queries (what / how / why / when / where / can / do). Add each query verbatim with source "GSC query" + export date. Requires a live browser session signed in as ratemovers@gmail.com; no GSC connector exists, and a generic subagent cannot perform this pull.

### Google Business Profile queries

In the Google Business Profile manager, open each branch profile (Winchester: The Flat Rate Movers; Martinsburg: Flat Rate Movers Martinsburg WV) and export the search-terms / queries report. Add each term verbatim with source "GBP query" + branch + export date. Requires a live browser session signed in as ratemovers@gmail.com.

### Quote-form inquiry questions

In Gmail (ratemovers@gmail.com), review quote-form inquiry emails for question phrasing from real clients. Add each question verbatim with source "quote inquiry" + message date. No query text is pre-filled here — every entry must come from a real message.

