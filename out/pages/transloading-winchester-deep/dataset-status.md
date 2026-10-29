# Dataset Status — Winchester Transloading Deep Package

**Date:** 2026-10-29. **Status:** STAGED BUILD ONLY.

## Datasets ship ONLY as the full W-D1–W-D8 nodes in the research doc — no light node file

- The full datasets live in `~/workspace/theflatratemovers/transloading-winchester-deep-datasets-2026-10-29.md`, §6 (W-D1–W-D8), licensed CC BY 4.0, attribution to The Flat Rate Movers, https://theflatratemovers.com/.
- **There is NO dataset-node.json in this package dir — BY DESIGN.** The Phase C light dataset node was removed under the never-light rule (owner: "we never ever ever do a light version unless i ask or approve... all our work is full data"). Nothing light ships. The W-D1–W-D8 datasets in the research doc ARE the full treatment; they convert to Dataset JSON-LD only at merge (see merge-note.md), with dateModified = deploy date.
- **Ocean D1–D8 relationship:** the ocean datasets are ALREADY LIVE as ai-repo machine files (deploy batch 1). This package EXTENDS them with Winchester-specific depth; it does NOT duplicate them. W-D1 extends ocean D1; W-D2 extends ocean D2; W-D3 extends ocean D3; W-D4 extends ocean D4; W-D5 extends ocean D5; W-D6 extends ocean D6; W-D7 extends ocean D7; W-D8 extends ocean D8.
- **Serving status (verified 2026-10-29):** `datasets-ocean-container.json` returns 200 + text/html on the live domain (SPA fallback — NOT a JSON file). `datasets-residential.json` returns 200 + application/json (the verified pattern). `datasets-transloading-winchester.json` does NOT exist yet (SPA HTML) — proposed at merge following the residential pattern, not claimed.
- **Gated fields are empty, not filled:** handled container types, reefer capability, flat-rack/OOG scope, bonded/FTZ/customs claims, TWIC credential status, drayage performer, chassis source, equipment list, terminal names, ramp names — all empty until the §8 attestation questions are answered. An empty gated field is the dataset's honesty, not a defect.
- **License:** CC BY 4.0 (`https://creativecommons.org/licenses/by/4.0/`) on every node. Proprietary carve-out stands: SIR/KIM-GS method internals + book content are NOT in any dataset.
