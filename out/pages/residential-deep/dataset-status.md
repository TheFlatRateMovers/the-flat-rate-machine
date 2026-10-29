# Dataset status — Residential Moving deep-data package

**FULL DATA ONLY (owner rule, standing 2026-10-29: never a light version unless Henry asks or approves; all work is full data).**

No light per-category node file is staged with this package — deliberately. There is NO dataset-node.json in this package dir, and none should be created from the withdrawn datasets-doc formulations.

The residential datasets ARE the full D1–D8 datasets in the research doc:
~/workspace/theflatratemovers/residential-deep-datasets-2026-10-29.md (§6)

- D1 Household Move Operations
- D2 Dwelling & Access Operations
- D3 Home & Item Taxonomy
- D4 Local & Regional Dispatch Network
- D5 Commercial Terms & Cost Drivers (domain facts labeled; no company pricing beyond flat-rate-in-writing)
- D6 Buyer Personas & Trigger Events
- D7 Protection, Handling & Building Compliance
- D8 Service Areas, Dispatch & Quote Path

Each dataset carries fields, relationships, verified company facts, labeled domain facts, real-query keywords, target queries, and rubric mapping, under CC BY 4.0 with creator organization @id and temporalCoverage 2010/2026.

**At merge**, the D1–D8 are converted to Dataset JSON-LD: page-level markup on https://theflatratemovers.com/residential-moving/ plus an entry in the Developer-page Dataset collection, with dateModified = deploy date. Gated fields (storage, valuation offering, apartment-specific capability, same-day availability, debris scope, prohibited-items list, residential pricing beyond flat-rate-in-writing) stay OMITTED until Henry answers research doc §8 — they are never guessed into the JSON-LD.

**Held / not shipped:** any dataset content derived from the withdrawn datasets-doc §4 formulations (research queries/intent only, never dataset content).
