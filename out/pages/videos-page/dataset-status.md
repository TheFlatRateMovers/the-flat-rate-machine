# Dataset status — Videos page package

**FULL DATA ONLY (owner rule, standing 2026-10-29: never a light version unless Henry asks or approves; all work is full data).**

## What the data is here

The machine-readable data for the videos page **is the set of six VideoObject nodes** — one per included video — in `datasets-videos.json` (this package). There is nothing prose-like to retype: a video's facts (title, description, thumbnail, watch URL, embed URL, publisher) are carried natively and exactly by schema.org `VideoObject`, which is also the type Google's video features and AI answer engines parse.

## Retype-rule treatment

The redo retype rule (Dataset type only for real tabular/reference data; prose retyped to Service / FAQPage / Article) was applied and considered explicitly:

- **No `Dataset` node is created.** None of the six nodes is a table or a reference dataset, and dressing page copy in a `Dataset` wrapper is exactly what the retype removed from the residential / commercial / gun-safe files. Creating one here would reintroduce the defect the redo closed.
- **No prose node exists to retype.** Each node's description is that video's own verified description material (see research doc), bound to the video it describes. The correct typed home for it is the `VideoObject` itself — not a detached Service or Article node, which would sever the description from the video it belongs to and break the page↔graph match (R3).
- **Counts for the Developer card at merge:** Videos data = 6 VideoObjects, 0 Dataset nodes, 0 Service nodes, 0 Article nodes. List it in that form, matching the pattern the redo set ("listing Dataset nodes separately from Service data and Articles with exact counts").

## Files and their deploy roles

| File | Role at deploy |
|---|---|
| `datasets-videos.json` | Live machine file at `public/datasets-videos.json`; its `@graph` is also the in-div JSON-LD block (parse-equal, per the residential/gun-safe markup precedent). |
| `schema.json` | The full per-page graph (WebPage/CollectionPage + the same 6 VideoObjects + BreadcrumbList); goes live as `public/videos.json`. |

## Field discipline

- `uploadDate` and `duration` are **absent** from every node: no source checked on 2026-10-29 states them (see research doc). If a future check verifies them from a named source, they are added then — never back-filled by estimate. Shorts are not assumed to be any particular length.
- Thumbnails use `hqdefault.jpg`, each verified HTTP 200 + image/jpeg on 2026-10-29.
- `contentUrl` uses the canonical watch URL with Henry's share parameters stripped; `embedUrl` is the standard YouTube embed URL (the page itself embeds through youtube-nocookie, per the div draft).

**Held / not shipped:** any Dataset-node formulation for this page; any duration, upload-date, or view-count figure.
