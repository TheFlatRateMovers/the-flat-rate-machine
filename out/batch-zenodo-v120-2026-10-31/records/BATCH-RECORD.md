# BATCH RECORD — Retrieval Machine 4b: Zenodo v1.2.0 Release

- **Batch:** 4b (SMALL BATCH — the Zenodo v1.2.0 release ONLY; no HF re-sync [4c],
  no catalog registry build, no Kaggle, no dataset content changes)
- **Date:** 2026-10-31
- **State at this record:** PREPARED + DIAGNOSED. All research, verification, and
  packaging complete. The single release-creation action is flagged to the parent
  browser route (§3) with exact parameters; the completion motion (§5–§6) runs
  the moment the new version DOI exists. Nothing has been published, pushed, or
  edited by this batch portion.

## §1 Pre-state — verified live this batch

- **verify.js: 127/127 PASS** (full run this batch). Load-bearing counts:
  482 distributions reproduced from sources, gaps 0 (M-3); rubric 2,906 rows
  (SI-1 dbRows=2906); URL supply 208 = registry 208 (SI-3 → **208 pages**);
  **28 services** (AE-1 coverageServices=28); AE **2,906 questions / 2,188
  fragments**; SI **2,178 clusters**; LG **112 records, 44 coverage sources**;
  DC-5 concept-DOI holder discipline intact (4 intent collection nodes + intent
  landing node + master-index root).
- **Dataset files: 35** — counted identically in the Pages public tree
  (`datasets-*.json`) and in the ai repo `data/` (35 of 42 entries;
  ai-master-index.json + .jws present).
- **ai repo main HEAD at preparation:** `0e33bfa9093667cf3ae569e7f39e4b2b6df750dd`
  (2026-10-31T19:44:03Z, "Refresh datasets-answer-evidence.json (Retrieval
  Machine 4a)"). The release targets branch `main` (as v1.1.0 did), so it
  captures main at creation time regardless of drift after this record.
- **Zenodo (public API):** exactly **1 version** — record 23818767, version DOI
  10.5281/zenodo.23818767, concept DOI 10.5281/zenodo.23818766, version "v1.1.0",
  publication_date 2026-10-30, one file
  (`TheFlatRateMovers/theflatratemovers-ai-v1.1.0.zip`, 472,854 B).
- **v1.1.0 GitHub release (API read-back):** id 429452233, name
  "v1.1.0 — The Flat Rate Movers AI Authority Estate (five-category edition)",
  target_commitish "main", zero assets, published 2026-10-30T20:18:55Z.
  Zenodo record created 2026-10-30T20:19:00Z → **sync latency ≈ 5 seconds**;
  the integration is healthy and automatic.
- **No `.zenodo.json`** in the ai repo root (full root listing checked) → Zenodo
  title/description derive from the GitHub release name/body. That is the
  name-stamp vector: release title carries "The Flat Rate Machine" (package §).

## §2 Route diagnosis — why creation is a flagged parent action

Every non-browser route to "create GitHub release" was checked and is absent:

| Route | Evidence | Result |
|---|---|---|
| GitHub MCP connector | Full live tool catalog contains **no `create_release`** (substring grep = 0 over the catalog; status tool list = 46 tools, release tools are reads only: get_latest_release, get_release_by_tag, get_tag, list_tags) | Cannot create |
| `gh` CLI | Not logged in (standing estate state) | Cannot create |
| git CLI | No credential helper configured (`git config --global credential.helper` → unset); tags alone don't trigger Zenodo anyway (releases do) | Cannot create |
| Raw GitHub REST API | api.github.com reachable (HTTP 200 on public read) but no credential is provisioned to this agent through any approved flow; custom connectors on this machine are Cloudflare + Hugging Face only | Cannot create |
| Zenodo API direct | Login is GitHub OAuth (browser); and a manual record/version is forbidden by scope (would break the GitHub→Zenodo chain) | Not used, by design |

**Conclusion:** creating a GitHub release is a GitHub-web action, and generic
subagents cannot operate the live browser. The estate's standing route for
GitHub-web actions is the **parent browser route** (the same route that carries
every oversized-file web upload). The Zenodo side needs nothing: the
GitHub→Zenodo integration fires automatically on release publication (§1).

## §3 FLAGGED PARENT ACTION — create the release (one step)

Execute **RELEASE-PACKAGE-v1.2.0.md** (same folder as this record) exactly:
repo `TheFlatRateMovers/theflatratemovers-ai`, tag `v1.2.0`, target `main`,
title `v1.2.0 — The Flat Rate Machine: The Flat Rate Movers AI Authority Estate (Retrieval Machine edition)`,
body = the package's marked block verbatim, not a draft, not a pre-release, no
assets. (Henry creating it himself in his own browser with the same package is
an identical substitute — the parameters, not the hand, are what matter.)

## §4 Expected result + verification (on completion)

Per the package's checklist: Zenodo versions total becomes 2; the new record
carries a **new version DOI under the same concept DOI 10.5281/zenodo.23818766**,
title "TheFlatRateMovers/theflatratemovers-ai: v1.2.0 — The Flat Rate Machine: …",
version field "v1.2.0", single file `TheFlatRateMovers/theflatratemovers-ai-v1.2.0.zip`;
the concept DOI resolves to the new record. Both DOIs + the record URL get
recorded here on completion. If the record has not appeared within ~15 minutes
of publication (v1.1.0 took ~5 s), the diagnosis to run is: confirm the release
is published (not draft) on the correct repo, then check the repo's Zenodo
integration state on zenodo.org (GitHub tab — the repo must still be enabled;
it demonstrably was on 2026-10-30); the remedy is re-saving the Zenodo GitHub
setting or re-publishing the release — **never a duplicate manual record**.

## §5 Estate surfaces — classified (the completion motion, contingent on §3)

Published surfaces DO track the current version. Full-text sweep of the Pages
public tree for the version DOI + "v1.1.0" found **8 published files** whose
statements are explicitly latest-tracking ("version DOI …; record …",
"this version …", "GitHub release v1.1.0 of …"):

1. `llms.txt` — 4 occurrences (incl. "GitHub release v1.1.0 of theflatratemovers-ai")
2. `the-flat-rate-movers-data.txt` — 2 occurrences (incl. "GitHub release v1.1.0")
3. `llms-full.txt` — 3 occurrences (generated; update at source, regenerate)
4. `developer/index.html` — 2 occurrences (route document; regenerate via build-routes)
5. `datasets/index.html` — 4 occurrences ("this version" hub block)
6. `datasets/intent-coverage/index.html` — 4 occurrences ("this version")
7. `datasets/answer-evidence/index.html` — 4 occurrences (inside harvested
   fragments quoting surfaces 1/4; regenerate, never hand-edit)
8. `datasets-answer-evidence.json` — 4 occurrences (same fragments; regenerate)

**Completion motion (after §4 verifies):** update the version statements at
their generator sources (llms.txt + data-txt masters and their ai-repo/phase-a
copies; dataset landing + Developer card sources; llms-full source data), swap
ONLY version-DOI / record-URL / "v1.1.0" → new DOI / new record / "v1.2.0",
regenerate (build-llms-full, build-routes, build-answer-evidence), re-run the
intent-rubric cadence if its generator touches any of these strings, then
digest → sign → Pages deploy → verify.js green → exactly ONE push per repo
(ai + machine) back-to-back with byte-identical read-backs → web-upload flags
for oversized files (the shell mirror and the AE dataset file exceeded the
connector ceiling in B2/B3 and are expected to again — flag with size + SHA
rather than pushing). **The concept DOI stays the citation target everywhere;
no concept↔version swap anywhere; DC-5's six holder nodes are untouched.**

No surface has been changed yet — updating them before the new DOI exists
would publish a citation to a record that does not exist.

## §6 Rules compliance + gates

- **DataCite rule:** no checksum field added to any Zenodo/DataCite metadata.
  The synced record's metadata derives from the release (title/body) + repo
  license detection (MIT, as v1.1.0) — no checksum involvement; digests remain
  solely in the signed index. ✓
- **verify.js:** 127/127 PASS at preparation close; the completion motion
  re-runs it green before its pushes. ✓
- **Pushes this portion:** none. **Web uploads this portion:** none.
  **Pre-push key grep:** n/a (nothing pushed). **Gist graph blob cda897e6…:**
  untouched (no graph writes of any kind). ✓
- **Small-batch discipline:** HF untouched (4c), registry untouched, Kaggle
  untouched (parked), no new DOIs (X1 remains an owner decision). ✓

---

## §7 CLOSE-OUT ADDENDUM — completion motion executed (2026-10-31, batch 4b-close)

The flagged parent action (§3) was executed: GitHub release **v1.2.0**
published on TheFlatRateMovers/theflatratemovers-ai (tag `v1.2.0`, target
`main`, commit 0e33bfa). Zenodo synced automatically: new version record
**23844324**, NEW VERSION DOI **10.5281/zenodo.23844324**, title
"TheFlatRateMovers/theflatratemovers-ai: v1.2.0 — The Flat Rate Machine:
The Flat Rate Movers AI Authority Estate (Retrieval Machine edition)";
concept DOI 10.5281/zenodo.23818766 verified live to resolve to
https://zenodo.org/records/23844324. The §5 motion then ran in full:

**Surfaces updated (v1.1.0 DOI 10.5281/zenodo.23818767 → 23844324;
"GitHub release v1.1.0" → "v1.2.0"), all at generator source:**
- `llms.txt` (served file): 4 DOI swaps + release-phrase swap (2 passages).
- `the-flat-rate-movers-data.txt` (served file + the workspace master copy
  in ~/workspace/theflatratemovers/): 2 DOI swaps + release phrase, 1 passage
  each. NOTE: the data txt is a published surface but is NOT a signed-index
  distribution (0 index entries) — pre-existing design, unchanged here.
- `scripts/build-llms-full.js` (+ its repo-dir mirror, byte-identical):
  1 record-URL swap → llms-full.txt regenerated (405,923 B).
- Source shell `repo-dir/index.html`: 10 own-content DOI swaps (datasets
  hub card + the two "this version" citation blocks); the 4 occurrences
  inside the answer-evidence embed were refreshed by div-sync from the
  regenerated dataset file, never hand-edited.
- Regenerated in dependency order: datasets-answer-evidence.json
  (fragments re-extracted from the edited shell; 2,906 questions / 2,188
  fragments), datasets-search-index.json (digest cascade only; totals
  unchanged: 2,178 clusters, 208 supply rows), route documents for
  /developer/, /datasets/, /datasets/intent-coverage/,
  /datasets/answer-evidence/, /datasets/search-index/ (the other 203
  route documents reproduced byte-identical in the baseline test).
  Middleware manifest regenerated — byte-unchanged (529 entries).
- Fixpoint: reseal → all four generator --checks (AE/SI/LG/intent) PASS,
  div-sync --check CLEAN. Re-sweep: **zero** occurrences of 23818767 in
  the entire published tree and in every generator source; zero "v1.1.0"
  strings remain on published surfaces.

**Seal + deploy:** 482 distributions, digest audit clean, JWS re-signed
(kid theflatratemovers-2026-10-29-1). Pages deploy
https://ce33b762.the-flat-rate-movers.pages.dev (12 files uploaded).
API: bundle refresh (signed-index digest matches 40/40), tests 43/43,
worker redeployed — version 47978c73-7705-44fc-bc83-aaa5802bc3c2.
Live verification: every changed URL 200 with the new DOI and zero old
DOI; /v1/verify match:true for llms.txt (ddb6fe76…) and
datasets-answer-evidence.json (251230e8…); concept DOI final landing =
records/23844324. verify.js **127/127 PASS** (pre-deploy run; the
post-push repo-digest state is the standard flagged end-state below).

**Pushes (one per repo, back-to-back; pre-push key grep = 0 over all
pushed files; gist graph blob cda897e6… untouched):**
- ai (theflatratemovers-ai) HEAD **7f8ae3289216a8b02ad2f60df4a38fa7f305f541**:
  llms.txt, the-flat-rate-movers-data.txt, data/ai-master-index.json,
  data/ai-master-index.jws, data/datasets-search-index.json.
- machine (the-flat-rate-machine): scripts/build-llms-full.js + this
  batch record (out/batch-zenodo-v120-2026-10-31/records/BATCH-RECORD.md).
  This record rides in that push; its HEAD is reported to the parent on
  completion rather than written here.

**Parent web-upload flags (connector ceiling — the standing route):**
1. machine repo `code/site-shell/index.html` ← repo-dir/index.html:
   **14,679,146 B, SHA-256 e2d5c6d83ea6926aaadf307acdcea11422351b13fa19411bf64f32794ac9c1cb**
   (commit message: "Refresh site-shell mirror (zenodo-v120 batch)").
2. ai repo `data/datasets-answer-evidence.json` ←
   public/datasets-answer-evidence.json:
   **7,171,215 B, SHA-256 251230e8310137e0a951557e1fbc717d76b5bda6e76efa31a51780f4d197ee2e**
   (commit message: "Refresh datasets-answer-evidence.json (Retrieval Machine 4b-close)").
Until flag 1 lands, P-6 stands partial on the shell mirror only — the
accepted B1–B4a end-state.

**Batch 4b is FULLY CLOSED** (release + Zenodo sync + §5 surface motion
+ reseal + deploy + pushes). Remaining Element 4 items unchanged from
§5/4a: 4c HF re-sync next; catalog registry build, Croissant, Dataset
Search diagnostic, C5 runner, X1/X2 owner decisions, Kaggle parked.
