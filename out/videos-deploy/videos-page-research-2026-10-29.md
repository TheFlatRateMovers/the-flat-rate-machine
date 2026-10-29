# Videos Page — Research & Verification (2026-10-29)

**Status: STAGED RESEARCH ONLY.** Nothing live was edited, deployed, or pushed. This doc supports the staged package at `~/workspace/the-flat-rate-machine/out/pages/videos-page/`, which deploys in sequence after the office batch closes (Mira runs that deploy).

**Authorization:** Henry, 2026-10-29 — "yes make and published the page with full json, html and descriptions llms txt files, all."

**Method.** Each of the six videos Henry supplied was verified from tool-returned sources only:
- **YouTube oEmbed** (`https://www.youtube.com/oembed?url=<canonical watch URL>&format=json`, fetched 2026-10-29) — returns title, author_name, author_url, thumbnail_url. oEmbed does **not** return duration, upload date, or description.
- **YouTube video pages** via browser fetch (`youtube.com/shorts/<id>` and `youtu.be/<id>`, exactly as supplied by Henry, crawled 2026-10-29) — returned the title and the full published description for every video. The fetched page text did **not** state a duration or an upload date for any of the six.
- **Web search** by video ID and by exact title (2026-10-29) — returned no source stating a duration or an upload date for any of the six videos.
- **Thumbnails:** `https://i.ytimg.com/vi/<id>/hqdefault.jpg` checked directly (2026-10-29): all six return HTTP 200 + `image/jpeg`, and each matches the thumbnail_url returned by oEmbed.

Fields no source stated are recorded **UNVERIFIED** and are omitted from all schema and copy. Nothing was guessed or filled from a URL.

---

## Per-video verification table

### 1. `29L981tzn5E` — INCLUDE
| Field | Value | Source |
|---|---|---|
| Supplied URL | https://youtube.com/shorts/29L981tzn5E?feature=share | Henry, 2026-10-29 |
| Canonical watch URL | https://www.youtube.com/watch?v=29L981tzn5E | Task-standard canonical form (share parameters stripped) |
| Format | YouTube Short | Supplied URL path (`/shorts/`) |
| Title | DMV Moving Made Easy: Top-Rated Movers in Winchester & Beyond! (#WinchesterVA #MoversVA #DMVMovers) | oEmbed + YouTube page, 2026-10-29 (identical in both) |
| Channel | The Flat Rate Movers | oEmbed `author_name`, 2026-10-29 |
| Channel URL | https://www.youtube.com/@theflatratemovers | oEmbed `author_url`, 2026-10-29 |
| Company channel? | **Yes** — matches the company's verified YouTube handle | oEmbed vs. site sameAs record |
| Description | Verified in full from the YouTube page (2026-10-29). Opens: "Moving to a new home in the DMV area (DC, Maryland, Virginia)? Don't let the stress of packing and hauling overwhelm you. The Flat Rate Movers, a top-rated moving company in Winchester, VA, is here to make your relocation smooth, secure, and worry-free!" Also states: white-glove service with protection for doors, floors, and banisters/rails; serving Winchester, VA and surrounding areas incl. Loudoun County, VA, Moorefield, WV, Shepherdstown, WV, Lake Frederick, VA, Summit Point, WV, Berryville, VA, Potomac, MD; phone 540-422-2153; online estimate link. | YouTube page fetch, 2026-10-29 |
| Duration | UNVERIFIED — no returned source states it | oEmbed (not provided); YouTube page fetch (not stated); ID/title search (no source) |
| Upload date | UNVERIFIED — no returned source states it | Same as above |
| Thumbnail | https://i.ytimg.com/vi/29L981tzn5E/hqdefault.jpg — HTTP 200, image/jpeg | Direct check + oEmbed, 2026-10-29 |
| Scope | **Household moving** (residential relocation, Winchester / DMV area) | Verified title + description |
| Include / exclude | **INCLUDE** — company channel, verified title + description | — |

### 2. `Z7Im5nR--AQ` — INCLUDE
| Field | Value | Source |
|---|---|---|
| Supplied URL | https://youtube.com/shorts/Z7Im5nR--AQ?feature=share | Henry, 2026-10-29 |
| Canonical watch URL | https://www.youtube.com/watch?v=Z7Im5nR--AQ | Canonical form, share parameters stripped |
| Format | YouTube Short | Supplied URL path (`/shorts/`) |
| Title | Moving a Heavy Gun Safe? We Can Help! Flat Rate Movers (VA) | oEmbed + YouTube page, 2026-10-29 |
| Channel | The Flat Rate Movers | oEmbed `author_name` |
| Channel URL | https://www.youtube.com/@theflatratemovers | oEmbed `author_url` |
| Company channel? | **Yes** | oEmbed vs. site sameAs record |
| Description | Verified (YouTube page, 2026-10-29): "Move a 1500lb Gun Safe Up a Hill in Northern Virginia with Flat Rate Movers! Our experienced movers can handle even the most challenging moves, like getting your gun safe up a steep slope. Call us today for a free quote!" followed by location hashtags. | YouTube page fetch |
| Duration | UNVERIFIED | As video 1 |
| Upload date | UNVERIFIED | As video 1 |
| Thumbnail | https://i.ytimg.com/vi/Z7Im5nR--AQ/hqdefault.jpg — HTTP 200, image/jpeg | Direct check + oEmbed |
| Scope | **Gun safe moving** (1,500 lb gun safe, Northern Virginia) | Verified title + description |
| Include / exclude | **INCLUDE** | — |

### 3. `HLGSTQ5byxM` — INCLUDE
| Field | Value | Source |
|---|---|---|
| Supplied URL | https://youtube.com/shorts/HLGSTQ5byxM?feature=share | Henry, 2026-10-29 |
| Canonical watch URL | https://www.youtube.com/watch?v=HLGSTQ5byxM | Canonical form |
| Format | YouTube Short | Supplied URL path |
| Title | The Flat Rate Movers of Winchester: Safe and Reliable Gun Safe Moving in Northern Virginia | oEmbed + YouTube page, 2026-10-29 |
| Channel | The Flat Rate Movers | oEmbed `author_name` |
| Channel URL | https://www.youtube.com/@theflatratemovers | oEmbed `author_url` |
| Company channel? | **Yes** | oEmbed vs. site sameAs record |
| Description | Verified (YouTube page, 2026-10-29): "Looking for a safe and reliable gun safe moving company in Northern Virginia? Look no further than The Flat Rate Movers of Winchester! We have the experience and expertise to move your gun safe safely and efficiently, regardless of its size or weight. In this video, we show you how we safely and securely move gun safes in Northern Virginia. We use the latest equipment and techniques to ensure that your safe arrives at its destination in perfect condition..." plus free quotes / flexible scheduling lines and keyword lists. | YouTube page fetch |
| Duration | UNVERIFIED | As video 1 |
| Upload date | UNVERIFIED | As video 1 |
| Thumbnail | https://i.ytimg.com/vi/HLGSTQ5byxM/hqdefault.jpg — HTTP 200, image/jpeg | Direct check + oEmbed |
| Scope | **Gun safe moving** (Northern Virginia) | Verified title + description |
| Include / exclude | **INCLUDE** | — |

### 4. `1S5Tux0-4lM` — INCLUDE
| Field | Value | Source |
|---|---|---|
| Supplied URL | https://youtube.com/shorts/1S5Tux0-4lM?feature=share | Henry, 2026-10-29 |
| Canonical watch URL | https://www.youtube.com/watch?v=1S5Tux0-4lM | Canonical form |
| Format | YouTube Short | Supplied URL path |
| Title | Final Mile Delivery & White Glove Safe Installation \| 1,800 lb Locker System (Full Process) | oEmbed + YouTube page, 2026-10-29 |
| Channel | The Flat Rate Movers | oEmbed `author_name` |
| Channel URL | https://www.youtube.com/@theflatratemovers | oEmbed `author_url` |
| Company channel? | **Yes** | oEmbed vs. site sameAs record |
| Description | Verified (YouTube page, 2026-10-29): "Watch a complete final mile delivery and white glove installation performed by The Flat Rate Movers. In this project, our team handled a 1,800 lb custom locker safe system delivered in 5 crates from a tractor trailer and completed full on-site installation for a commercial client." Also lists what is shown (tractor trailer delivery and job-site receiving, pallet jack unloading, safe crate breakdown and debris removal, handling of heavy locker safe components, dollies / impact drills / installation tools, final positioning and full system setup) and services featured (final mile delivery, white glove installation, heavy item moving — safes, lockers, equipment — commercial installation projects, debris removal and job-site cleanup); service areas Winchester, VA, Martinsburg, WV, Frederick County & Berkeley County. | YouTube page fetch |
| Duration | UNVERIFIED | As video 1 |
| Upload date | UNVERIFIED | As video 1 |
| Thumbnail | https://i.ytimg.com/vi/1S5Tux0-4lM/hqdefault.jpg — HTTP 200, image/jpeg | Direct check + oEmbed |
| Scope | **Commercial — final-mile delivery & white-glove installation** (1,800 lb locker safe system, 5 crates, commercial client) | Verified title + description |
| Client named? | **No.** The description says "for a commercial client" and names no client, person, or address. No per-video privacy flag beyond the standing flag below. | YouTube page fetch |
| Include / exclude | **INCLUDE** | — |

### 5. `AX4oWENjxJo` — INCLUDE
| Field | Value | Source |
|---|---|---|
| Supplied URL | https://youtu.be/AX4oWENjxJo | Henry, 2026-10-29 |
| Canonical watch URL | https://www.youtube.com/watch?v=AX4oWENjxJo | Canonical form |
| Format | YouTube video (long-form URL form as supplied) | Supplied URL form |
| Title | Medical Tank Relocation: Experts for Your Sensitive Equipment | oEmbed + YouTube page, 2026-10-29 |
| Channel | The Flat Rate Movers | oEmbed `author_name` |
| Channel URL | https://www.youtube.com/@theflatratemovers | oEmbed `author_url` |
| Company channel? | **Yes** | oEmbed vs. site sameAs record |
| Description | Verified (YouTube page, 2026-10-29): "Moving sensitive medical equipment, especially large tanks, requires a specialized touch. Our team of knowledgeable technicians possesses the expertise and state-of-the-art equipment to ensure the safe and efficient relocation of your vital medical resources." Also states: tailored solutions for specific needs, unwavering commitment to safety, streamlined logistics coordinated with the facility, clear communication, competitive pricing. (The description also carries the company's own registry/link block; link targets were not followed and are not used as facts.) | YouTube page fetch |
| Duration | UNVERIFIED | As video 1 |
| Upload date | UNVERIFIED | As video 1 |
| Thumbnail | https://i.ytimg.com/vi/AX4oWENjxJo/hqdefault.jpg — HTTP 200, image/jpeg | Direct check + oEmbed |
| Scope | **Industrial / heavy-asset — medical & sensitive equipment relocation** (medical tanks) | Verified title + description |
| Include / exclude | **INCLUDE** | — |

### 6. `_W6wheqTGIE` — INCLUDE
| Field | Value | Source |
|---|---|---|
| Supplied URL | https://youtu.be/_W6wheqTGIE | Henry, 2026-10-29 |
| Canonical watch URL | https://www.youtube.com/watch?v=_W6wheqTGIE | Canonical form |
| Format | YouTube video (long-form URL form as supplied) | Supplied URL form |
| Title | Gun Safe Movers Moving a 900 lb Gun Safe BROWNING PROSTEEL 1878 SERIES | oEmbed + YouTube page, 2026-10-29 |
| Channel | The Flat Rate Movers | oEmbed `author_name` |
| Channel URL | https://www.youtube.com/@theflatratemovers | oEmbed `author_url` |
| Company channel? | **Yes** | oEmbed vs. site sameAs record |
| Description | Verified (YouTube page, 2026-10-29). Opens: "Gun Safe Movers, Gun Safe Moving. Since 2010, The Flat Rate Movers has provided solutions & quality services to clients by providing them with the professional care they deserve..." and continues with the company's published full-service packing / local and long-distance moving text for Winchester, VA and surrounding areas, phone 540-422-2153 and the company website. | YouTube page fetch |
| Duration | UNVERIFIED | As video 1 |
| Upload date | UNVERIFIED | As video 1 |
| Thumbnail | https://i.ytimg.com/vi/_W6wheqTGIE/hqdefault.jpg — HTTP 200, image/jpeg | Direct check + oEmbed |
| Scope | **Gun safe moving** (900 lb Browning ProSteel 1878 Series gun safe) | Verified title |
| Include / exclude | **INCLUDE** | — |

---

## Company-channel gate result

**All six videos pass.** Every oEmbed response returns `author_name: "The Flat Rate Movers"` and `author_url: "https://www.youtube.com/@theflatratemovers"` — the company's own channel, matching the YouTube URL already recorded in the site's Organization sameAs. **No video is excluded; no third-party video is published as company work.**

## Standing privacy flag

Faces and on-camera content inside the videos **cannot be assessed from metadata** — no tool used here inspects video frames. The videos are the company's own public YouTube posts, published by the company itself; embedding them on the page republishes the company's own public content through YouTube's own player, exactly as YouTube offers it. No verified description names a client: video 4 (`1S5Tux0-4lM`) states the installation was "for a commercial client" without naming the client, and no other description identifies a client, a person, or a client address. If frame-level review is ever wanted before or after go-live, it has to be a human watching the six videos — it is flagged here, not scored away (see rubric.md, R6).

## UNVERIFIED fields (complete list)

- **Duration — all six videos.** oEmbed does not provide it; the fetched YouTube page text did not state it; ID/title searches returned no source stating it. Omitted from schema (`duration` absent) and from all copy.
- **Upload date — all six videos.** Same sources, same result. Omitted from schema (`uploadDate` absent) and from all copy.
- **View counts** — never returned by any source used; never stated anywhere in the package.

## Slug decision

Candidates checked against (a) the live sitemap (153 `<loc>` entries, read 2026-10-29) and (b) `data/pages.json` (153 registered slugs, read 2026-10-29):

| Candidate | Sitemap | pages.json | Result |
|---|---|---|---|
| `videos` | no match (no URL contains "video" at all) | no match | **Collision-free — CHOSEN** |
| `moving-videos` | no match | no match | Collision-free (not needed) |
| `video-gallery` | no match | no match | Collision-free (not needed) |

**Slug: `videos`** — canonical `https://theflatratemovers.com/videos/`, page div `id="page-videos"`, pageMeta key `videos`. First candidate was collision-free, so it is the choice per the brief's order.

## Page registry / pageMeta precedent

Non-service pages in pageMeta declare `svc:null` — verified in the live index for `all-pages`, `services`, `quote`, `developer`, and the `knowledge-*` and `docs` index entries (read 2026-10-29). The machine registry likewise carries those pages as `type: "page"`, `services: []`. The videos page is a collection page, not a single service, so meta.json follows that precedent: **svc: null**, registry type `page`, services `[]`. The choice is recorded in meta.json and merge-note.md.

## Branch facts used on the page (closing card, copied from the established page pattern)

- Winchester: The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester, VA 22601 (geo 39.18711576, -78.1668352), Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google 5.0 / 1 review.
- Martinsburg: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404 (geo 39.48319665, -77.94760443), Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google 4.7 / 6 reviews.
- Phone +1-540-422-2153, price range $$, founded June 2010, tagline "Guaranteed Flat Rate or Your Move is Free!"
- The two branches are stated separately everywhere they appear; never blended.
