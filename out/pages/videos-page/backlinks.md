# Backlinks — Videos page (deploy-time link plan)

Every target below was verified to exist in the live sitemap (153 URLs, read 2026-10-29). Links are added **at deploy**, by the follow-on deploy batch — this staged package adds no live links. Inbound links to add point at `https://theflatratemovers.com/videos/` (in-div links use the SPA hash form `#/videos`, per site pattern).

## Inbound links to add at deploy

| From (live page) | URL | Why / anchor |
|---|---|---|
| Developer page | https://theflatratemovers.com/developer/ | Data collection listing: add the "Videos data" entry (6 VideoObjects; `videos.json` + `datasets-videos.json`), same pattern as the residential / commercial / gun-safe / office data cards. |
| Browse All Pages (index) | https://theflatratemovers.com/all-pages/ | Page index entry for the new page (pageMeta addition drives the SPA route; add the visible index entry with the other collection pages). |
| Gun Safe Moving hub | https://theflatratemovers.com/gun-safe-movers/ | Three verified gun-safe videos are embedded on the videos page (`Z7Im5nR--AQ`, `HLGSTQ5byxM`, `_W6wheqTGIE`). Anchor: "Watch our gun safe moves on video". |
| Residential Moving hub | https://theflatratemovers.com/residential-moving/ | Verified household-moving video embedded (`29L981tzn5E`). Anchor: "See a household move on video". |
| Commercial Moving hub | https://theflatratemovers.com/commercial-moving/ | Verified commercial installation video embedded (`1S5Tux0-4lM` — final-mile delivery + white-glove installation for a commercial client). Anchor: "Watch a commercial installation on video". |
| Final-mile / white-glove services page | https://theflatratemovers.com/commercial-freight-handling-white-glove-final-mile-services/ | Same verified video is a final-mile delivery + white-glove installation — the exact scope of this page. Anchor: "Watch a final-mile white-glove installation". |
| Heavy Asset Authority (SIR hub) | https://theflatratemovers.com/heavy/ | Verified medical tank relocation video embedded (`AX4oWENjxJo`) — sensitive / heavy-asset equipment work in the SIR family. Anchor: "Watch a medical tank relocation". |

## Outbound links already in the page div (drafted)

Related-pages chips + "Match a video to your move" section link to: Home, Browse All Pages, Gun Safe Moving, Residential Moving, Commercial Moving, Heavy Asset Authority, the final-mile/white-glove services page, both branch pages (`#/moving-company-winchester-va`, `#/moving-company-martinsburg-wv` — both verified live slugs), Quote, Online Estimate, and the YouTube channel. All targets verified in the live sitemap / pages.json on 2026-10-29.

## Not linked (deliberate)

- No branch page links are required beyond the two chips already in the div; the videos are not branch-specific (channel-level content), so no per-branch video claims are made anywhere.
- No link from any page whose scope does not match a verified video scope (no packing, senior, military/government, or transloading link — no verified video covers those scopes).
