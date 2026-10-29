# Dataset status — Warehouse Relocation deep-data package

**No light node file by design (never-light rule).** There is no dataset-node.json in this package dir, and none ships with this package.

The datasets for this category are the FULL D1–D8 nodes in the research doc `~/workspace/theflatratemovers/warehouse-deep-datasets-2026-10-29.md` (§6): D1 Warehouse Relocation Operations; D2 Facility & Access Operations; D3 Warehouse & Load Taxonomy; D4 Phasing Models & Continuity Operations; D5 Commercial Terms & Cost Drivers; D6 Buyer Personas & Trigger Events; D7 Inventory, Protection & Building Compliance; D8 Service Areas, Dispatch & Quote Path.

**History.** The Phase C lock package staged a dataset node from the withdrawn datasets-doc formulation; it was REMOVED under the never-light rule (see `out/pages/warehouse-relocation/dataset-status.md`: "No Dataset node ships with this package… built only by the full ocean-method treatment"). This deep package IS that treatment.

**Conversion at merge (proposal for the parent deploy agent).** At deploy, convert D1–D8 to Dataset JSON-LD: page-level markup on the live warehouse-relocation page + a Developer-page collection entry, dateModified = deploy date, license CC BY 4.0 on every node, creator = organization @id + 6 social sameAs, temporalCoverage 2010/2026, spatialCoverage = two branch @ids (never merged). The live per-page JSON (`warehouse-relocation.json`, already application/json) is refreshed to the refreshed node at the same merge. Gated fields are omitted at conversion, never filled: equipment deployment, drayage/chassis, bonded/FTZ, reefer, customs, racking install, phasing promise, WMS integration, permits/engineering, debris/close-out, and any price beyond the verbatim CWT schedule.
