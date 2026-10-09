# Landing page redesign: Phase 0 plan

Status: **Phase 0 complete, waiting for approval.** Nothing below is built yet, except the items in "Changed during Phase 0".

Date: 2026-10-07. Everything here was checked against the code on `main` in `remote-logger`, `logger_backend` and `loghive-sdk`, and against production where noted.

---

## 1. Changed during Phase 0

| Change | Why |
|---|---|
| Removed `SOC 2` and `99.9% SLA` from the footer (`components/landing/Footer.tsx`) | You asked for it. `GDPR Ready` is still there, see question Q10. Local only until the frontend is deployed. |
| Added `@playwright/test` 1.63.0 as a dev dependency | Needed for every capture. The Chromium download times out on this machine, so scripts use the installed Chrome (`channel: "chrome"`, Chrome 154). |
| Added `scripts/capture-landing.mjs` | Full-page landing captures at any widths and both themes. Reused for the Phase 4 "after" shots. Captures in 4000px bands and stitches with sharp, because Chrome repeats the top of the page past 16,384px. |
| Added `docs/redesign/before/*.png` | Production, 2026-10-07, at 1440x900 and 390x844, light and dark, reduced motion on so scroll reveals show their final state. |
| Added `docs/redesign/specimen/` | Type specimen (HTML and PNGs), see section 6. |

---

## 2. Repo map

| Item | Finding |
|---|---|
| Framework | Next.js 15.4.10 (App Router, Turbopack dev), React 19.1.0, TypeScript, Tailwind 4 |
| Landing entry | `app/page.tsx` renders `Header`, `WaitlistPage`, `Footer` over a fixed `bg-dot-grid` and `HeroCanvas` (canvas constellation) |
| Landing sections | `components/waitlist/*` (live). `components/landing/*` is mostly dead code: only `Header`, `Footer` and `HeroCanvas` are imported. `FAQ.tsx`, `TrustIndicators.tsx`, `StatsBar.tsx` etc. still contain SOC 2 and 99.9% claims but are never rendered. |
| Section order today | Hero (`LiveLogStream`) → `StackStrip` → `ProblemSection` → `PillarsSection` ("The shift") → `IncidentTimeline` → `SetupSteps` → `FeatureBento` (inline in `WaitlistPage.tsx`) → `UseCases` → `ComparisonTable` → `BuildLog` → `CharterOffer` → `WaitlistFAQ` → `ClosingCTA` |
| Styling | Tailwind 4 utilities. Tokens are CSS variables in `app/globals.css` (`:root` light, `.dark` dark) and registered in `@theme inline`. Animations in `app/globals-animations.css` plus GSAP hooks in `hooks/useGsapAnimations.ts` (they honour `prefers-reduced-motion`). |
| Shared tokens | The landing and the dashboard share `globals.css`. Any token change restyles the dashboard too, unless the landing tokens are scoped. |
| Fonts today | `next/font/google`: Syne 700/800 (`--font-display`), DM Sans (`--font-body`). `geist/font/mono` sets `--font-geist-mono`. |
| Font bug | `--font-mono` points at `--font-code`, which is never defined. On production every `.font-mono` element renders in **DM Sans**, and Geist Mono never loads. This affects the dashboard too, so SHAs and timestamps in product screenshots would also be proportional. |
| Theme toggle | `next-themes`, `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`, storage key `theme`. `components/theme-toggle.tsx` flips light and dark. |
| Accent colours | Dark: lime `#AEF78E`. Light: steel blue `#5a8fa8`. So the brand colour changes with the theme. Steel blue on the mint background is 3.47:1 and fails AA for small text (for example the "Sign up" link). |
| Waitlist | `WaitlistForm` posts to `app/api/waitlist/route.ts`, which forwards to `POST {API}/waitlist`. Three forms share one context (hero, charter, closing). Referral link `?ref=`. |
| Invite signup | `/signup?code=APER-XXXXXX`, validated live against `/waitlist/validate-invite/:code`. |
| Metadata | Only `title` and `description` in `app/layout.tsx`. **There are no OG or Twitter tags today.** The description still uses the old positioning ("Real-time logging, error tracking..."). |
| Analytics | `@vercel/analytics` `<Analytics />` in the root layout. |
| Middleware | `middleware.ts` matcher excludes only `api`, `_next/static`, `_next/image`, `favicon.ico`. Files in `public/` (for example `/screenshots/x.webp`) are **not** public paths, so logged-out visitors get redirected to `/login`. Must be fixed before screenshots ship. |

---

## 3. Product map: what is shipped

Shipped means the code path exists end to end on `main` and production. Production backend uptime shows a restart about 2 hours after the last backend commit (2026-10-06), so prod is likely on current `main`.

| Feature | Where it shows | Status | Notes that matter for the page |
|---|---|---|---|
| Error groups (fingerprinting, counts, statuses, regressions) | `/projects/:id/issues`, detail dialog via `?group=:groupId` | **Shipped** | Header shows title, status, "First seen {date} · {release}", Occurrences, **Sessions affected**, Last seen |
| Suspect commits, "Likely caused by" | Issues detail dialog | **Partial vs the copy** | Heuristic (stack-file basename overlap + recency) then AI ranking, top 3. UI shows commit message, SHA link and rationale. The `score` is stored but **no confidence % is rendered and no diff is shown**. Computed once, the first time the group is opened. |
| Commit feed, plain English + technical | `/projects/:id/changes` | **Shipped** | Plain-English summary is the headline, technical summary is the line under it, "Explain this change" expands a longer AI explanation. **There is no register toggle**; both show at once. Monthly cap 500 AI summaries per project. |
| Deploys and release health verdict | `/projects/:id/changes?tab=deployment`, "Deploy Impact" card on `/projects/:id`, deploy markers on the errors, activity and performance charts | **Shipped** | Verdict after a fixed 60-minute window (`IMPACT_WINDOW_MINUTES`, not configurable), ±25% error-rate threshold, at least 10 logs each side. Labels are **Healthy, Improved, Degraded, Not enough traffic**, not "better, worse, no change". |
| Release split ("100% on v2.4.1, 0% on v2.4.0") | Nowhere in the UI | **Stubbed** | `GET /projects/:id/releases/:release/health` exists in the backend; no frontend calls it. |
| Drafted issues, two-way sync | Issues dialog, "Create GitHub issue" | **Shipped** | AI draft with template fallback after 25s, editable preview, opened through the GitHub App installation. Closing it on GitHub resolves the group ("Resolved via GitHub"). |
| Zero-config new-error alerts | Top-bar bell (WebSocket), `/notifications`, email | **Shipped** | Owner notified in-app and by email for `production` by default, 30-minute cooldown. Email needs Resend configured in prod (unverified). |
| Alert rules and channels | `/alerts`, `/projects/:id/alerts/rules`, integrations | **Shipped, channels not verified one by one** | Slack, Discord, Teams, webhooks exist in `notification.service.ts`. |
| Performance and Web Vitals | `/projects/:id/performance`, `/projects/:id/web-vitals` | **Shipped** | SDK captures LCP, CLS, INP with `PerformanceObserver`. |
| AI root cause on an error | `/projects/:id/errors/:errorId` | **Shipped** | "Root Cause Analysis" section with a confidence label. Real replacement for the typing "AI insight" mock. |
| PII redaction | SDK, visible as `[EMAIL_REDACTED]` etc. inside stored logs | **Shipped** | Redaction happens in the browser. |
| PII redaction audit trail | SDK memory only (`getAuditTrail()`) | **Partial** | Never sent to the backend, no dashboard view. Cannot be screenshotted from the product. The landing mock also shows `[CC_REDACTED]`; the SDK emits `[CARD_REDACTED]`. |
| Weekly digest, Pulse feed | Nowhere | **Not built** | No digest code in the backend. `SetupSteps` step 3 presents it as working. |
| Session replay | `/projects/:id/sessions/:sessionId?tab=replay`, "Watch replay" in the issues dialog, `/projects/:id/settings/replay` | **Shipped 2026-09-28, beta** | SDK 1.5.0 (rrweb, lazy-loaded), all inputs masked by default, opt-in per project. You confirmed it end to end on 2026-10-06. The Build log still says "Building now". |

**Auth flow.** `/login` (email + password) → `POST /users/login` → JWT in the `authToken` cookie (7 days) → `/dashboard`. MFA accounts go to `/mfa-verify`. GitHub and Google OAuth via `/callback`. Middleware lets `role: admin` through everywhere and sends non-beta users back to `/`.

**How a project receives data.** SDK `new Apperio({ apiKey, projectId, environment, release })` → batched `POST /api/v1/:projectId/logs` with `X-API-Key` → fingerprinting → error group upsert → owner notification. Replay segments go to `POST /:projectId/replay`. GitHub App webhooks (`push`, `deployment`, `deployment_status`, `release`, `issues`) arrive at `/api/v1/webhooks`. CI deploys use `POST /api/v1/projects/:projectId/deployments` with `X-API-Key` and `{ environment, release, sha, url, description, deployedBy }`. Every timestamp is set server-side, so nothing can be backdated through the real path.

**Existing seed and demo scripts. None can be used under the ground rules:**

- `logger_backend/src/scripts/seed.ts` inserts straight into MongoDB for "the first user found".
- `loghive-sdk/example/seed-database.ts` posts hand-built payloads with axios, not the SDK.
- `loghive-sdk/example/browser/` (with a `checkout.html`) is a useful starting point for the demo shop.

---

## 4. Credibility leaks found

| # | Where | Problem |
|---|---|---|
| 1 | Hero `LiveLogStream` | A scripted fake log stream titled "apperio, production", with a fake Slack alert. |
| 2 | Pillars, Timeline 14:12 | "92%" confidence and diff lines. The product shows neither. |
| 3 | Pillars body | "with the diff and the deploy it rode in on". Neither is in the suspect UI. |
| 4 | Timeline 14:11, bento issue mock | "14 users affected". The product counts sessions, and sessions reset on every page load. |
| 5 | Timeline 14:11 | "100% on v2.4.1 · 0% on v2.4.0". No UI shows a release split. |
| 6 | Pillars, Timeline 14:33, bento | "Better, worse, or no change". Real labels are Improved, Healthy, Degraded. |
| 7 | Pillars "Plain English / Technical" toggle | No toggle exists; the product shows both registers together. |
| 8 | SetupSteps step 3, bento digest card | Digest is not built. Step 3 reads as if it works. |
| 9 | Build log | Replay listed as "Building now"; it shipped on 2026-09-28. |
| 10 | Bento PII card, FAQ | "audit trail of every substitution" is SDK-side only. |
| 11 | Every mock | SHA `a7f3c21`. The demo run will produce a different real SHA, so the copy must follow it. |
| 12 | `/changelog` (public) | Fed by seed entries with invented history, for example "1.0.0 Initial Release, 2025-06-01: the first public release of Apperio". Production's copy still says "Connect **Monita** to your workflow". Newest entry is 2026-03-05, so nothing about Change Intelligence or replay. |
| 13 | `/status` (public) | Uptime is hardcoded to 99.9% ("placeholder values" in `status.service.ts`). Linking it as a "running" signal would surface a fake number. |
| 14 | Footer | `© 2025` hardcoded, About/Privacy/Terms/Security/Contact all go to `/docs`, GitHub and Twitter go to the bare domains, "Pricing" goes to a missing `#pricing`, tagline "The Developer's Logging Companion" doesn't match the hero. |
| 15 | Metadata | Description uses the old positioning; no OG image. |

---

## 5. Proposed section order

| # | Section | What changes |
|---|---|---|
| 1 | Header | Nav: How it works, Product, Build log, FAQ, Docs. Theme toggle and Join waitlist unchanged. |
| 2 | Hero | Keep badge, 14:02 / 14:11 headline, sub copy, waitlist form, invite link. Replace `LiveLogStream` with the real hero shot (S1). Under the form, one honest line: "Last shipped {date}: {item}" linking to the changelog. Drop the decorative `HeroCanvas` and dot grid on the landing so the screenshot carries the colour. |
| 3 | Stack strip | Keep. Probably a static row instead of a marquee. |
| 4 | The problem | Keep. `SeveredLink` is a concept diagram, not product UI, so it stays (restyled). |
| 5 | Product tour (replaces "The shift") | Tabbed, in the spirit of Monoscope's feature tabs: **Change Intelligence** (S1, S2), **Plain English** (S3, S4), **Session replay, beta** (S15). Each tab has 2 or 3 short points and one capture. On mobile the tabs become a segmented control and the captures become tight crops. |
| 6 | Anatomy of an incident | Keep the rail and the timestamps. Each step's mock card becomes the real crop of that moment (mapping in section 7). Times come from the real run. |
| 7 | Setup | Keep 3 steps. Step 1 stays code. Step 2 becomes the real GitHub App card (S17). Step 3 becomes the overview's "Latest changes" and "Deploy impact" (S18, S6) instead of the digest. |
| 8 | Everything else | Same bento grid, real crops: AI root cause (S13), drafted issue (S8), Web Vitals (S12), install snippet (code, stays), PII redaction (S14), alert (S11), release health (S6). Digest card becomes text only, labelled Next. |
| 9 | Who it is for | Keep. |
| 10 | Comparison | Keep. Recheck "Ranked suspect commit, AI-ranked" wording once S1 exists. |
| 11 | Built in the open | Keep. Add ship dates, link each item to its changelog entry, move replay to Shipped (beta). |
| 12 | Charter, FAQ, closing CTA | Keep. Fix the replay and digest answers in the FAQ. |
| 13 | Footer | Fixes from leak 14, after your answers to Q10. |

Every product image gets a small mono caption, for example `Demo Shop · captured 2026-10-14`, from the manifest. It is honest about the source and doubles as a "this is running" signal.

**How this differs from Monoscope.** Monoscope is light-first, Inter, a blue accent, logo walls, testimonials and inline emoji. Apperio stays dark-first, uses Instrument Sans with JetBrains Mono, one lime signal, mono timestamps as the structural motif, no logos, no testimonials, no emoji. We borrow only the structure: product footage first, tabbed feature captures, an "explore the demo" path, specific numbers.

---

## 6. Type and palette

Specimen: `docs/redesign/specimen/type-specimen.png` (one file per pairing: `a-instrument-jetbrains.png`, `b-plex.png`, `c-bricolage-martian.png`, `palette.png`). Each pairing is set in the real headline, the hero paragraph, a timestamp and SHA log block, and an inline SHA sentence, in dark and light.

| Pairing | Read |
|---|---|
| **A. Instrument Sans + JetBrains Mono** (recommended, the brief's default) | Crisp, slightly condensed, holds up at small sizes. JetBrains Mono gives clear `0`/`O` and tabular timestamps. Distinct from Inter and Geist without being quirky. |
| B. IBM Plex Sans + IBM Plex Mono | One superfamily, so inline SHAs sit naturally in sentences. Reads a little more "enterprise docs". |
| C. Bricolage Grotesque + Martian Mono | Most expressive headline, but Martian Mono is so wide that the log rows clip at the same size. Not suitable for the timeline. |

Implementation: `next/font/google` (self-hosted at build, no layout shift), weights Instrument Sans 400/500/600/700 and JetBrains Mono 400/500. `font-variant-numeric: tabular-nums` on every time and metric.

Palette (tokens on `:root` and `.dark`, scoped to the landing unless Q9 says app-wide):

| Token | Dark | Light |
|---|---|---|
| bg | `#0a0a0b` | `#fafaf9` |
| surface | `#121214` | `#ffffff` |
| raised | `#1a1a1d` | `#f4f4f5` |
| line | `#26262b` | `#e4e4e7` |
| text / text-2 | `#ededef` / `#a1a1aa` (7.7:1) | `#18181b` / `#52525b` (7.4:1) |
| signal fill (LIVE pill, verdicts, suspect highlight) | `#aef78e`, text on it `#0a0a0b` (15.5:1) | same `#aef78e` |
| signal text | `#aef78e` | `#1f7a3d` (5.4:1 on white) |
| danger (the 14:11, errors) | `#f87171` | `#c53030` |

Surfaces stay neutral so the screenshots carry the colour. Lime is the one accent, used for live and signal states only.

Screenshot frame: 1px `line` border, 12px radius, one soft shadow, no fake traffic-light chrome (that reads as a mock). Click to zoom on desktop. The hero image loads with priority; everything else lazy loads with width and height from the manifest. Light captures show in light mode and dark in dark mode, switched by the same `.dark` class `next-themes` sets.

---

## 7. Shot list

All shots: Chrome via Playwright, `deviceScaleFactor: 2`, animations off, caret hidden, toasts dismissed, fixed clock (`page.clock.setFixedTime`) so "4 min ago" is stable, `timezoneId: Europe/London`. Masked in every shot: top-bar user menu (name, email, avatar), org switcher name, API keys and tokens, IPs in log payloads, any personal GitHub login or avatar. Output: WebP in `public/screenshots/{light,dark}/`, target under 250 KB, plus a manifest (name, width, height, alt, theme, capturedAt).

Route prefix `/p` = `/projects/{demoProjectId}`.

| # | Name | Route and state | Wait for | Crop | Viewport | Used in |
|---|---|---|---|---|---|---|
| S1 | `suspect-commit` (hero candidate) | `/p/issues?group={checkoutGroup}`, dialog open, suspects computed | text "Likely caused by", no "Checking recent commits" | `[role=dialog]` | 1440x900; mobile: the "Likely caused by" block only, 390 | Hero, Tour: Change Intelligence, Timeline 14:12 |
| S2 | `error-group-header` | same dialog | impact strip numbers | dialog header + impact strip | 1440; 390 crop | Tour, Timeline 14:11 (grouped) |
| S3 | `commit-card` | `/p/changes` | the bad commit's card with summary (not "Writing summary…") | that card | 1440; 390 | Tour: Plain English, Timeline 14:02 |
| S4 | `commit-explained` | `/p/changes`, "Explain this change" open on the same card | explanation text (not "Reading the code changes…") | card + explanation | 1440 | Tour: Plain English |
| S5 | `deploy-verdicts` | `/p/changes?tab=deployment` | v2.4.2 "Improved" and v2.4.1 "Degraded" chips | the two deploy cards | 1440; 390 | Timeline 14:09 and 14:33 |
| S6 | `deploy-impact` | `/p` overview | Deploy Impact card with Improved and before → after rates | that card | 1440; 390 | Bento: Release health, Setup step 3 |
| S7 | `chart-deploy-markers` | `/p/errors` | chart with both deploy markers | chart card | 1440 | Timeline 14:09 ("every chart gets a marker") |
| S8 | `issue-draft` | issues dialog → Create GitHub issue | "Drafted by AI from the stack trace…" | dialog | 1440; 390 crop of title + first lines | Timeline 14:13, Bento: Issues drafted |
| S9 | `github-issue` | the real issue on github.com (public repo, logged out) | issue title | issue header + top of body | 1440 | Timeline 14:13 |
| S10 | `resolved-via-github` | `/p/issues`, Resolved tab | "Resolved via GitHub" and "#n closed" chips | the row | 1440; 390 | Timeline 14:33 |
| S11 | `alert-in-app` | top-bar bell dropdown open (or `/notifications`) | the new-error notification | dropdown | 1440; 390 | Timeline 14:11 (told), Bento: Alerts |
| S12 | `web-vitals` | `/p/web-vitals` | gauges with values | gauge row | 1440; 390 | Bento: Performance |
| S13 | `ai-root-cause` | `/p/errors/{errorId}`, Root Cause Analysis expanded | analysis text and confidence | that section | 1440 | Bento: AI insights |
| S14 | `pii-redacted-log` | `/p/logs`, detail of the "checkout submitted" log | `[EMAIL_REDACTED]` in the JSON viewer | JSON viewer | 1440; 390 | Bento: PII stripped at the source |
| S15 | `session-replay` (beta) | `/p/sessions/{sessionId}?tab=replay&at=…`, paused just before the error | player frame rendered | player | 1440 | Tour: Session replay |
| S16 | `captured-error` | `/p/logs`, detail of the TypeError event | stack + release + session fields | detail panel | 1440; 390 | Timeline 14:11 (captured) |
| S17 | `github-app-card` | `/p/settings/integrations` | installed repo listed | GitHub App card | 1440; 390 | Setup step 2 |
| S18 | `latest-changes` | `/p` overview | Latest Changes card with summaries | that card | 1440; 390 | Setup step 3 |

Dropped because the feature isn't there: weekly digest email (not built), release split (no UI), PII audit trail view (SDK only).

Optional loop (6 to 12 s): issues list → open the group → "Likely caused by" → Create GitHub issue → draft appears. Playwright `recordVideo`, then ffmpeg to H.264 MP4 + WebM + poster. **ffmpeg is not installed** (`winget install Gyan.FFmpeg` would add it).

---

## 8. Demo data plan (Phase 1)

Nothing is inserted into the database. Every row comes from the SDK, the ingestion API, the GitHub App, the deploy API or the AI layer.

**Pieces**

1. **Account and project.** "Demo Shop" project created through the UI at `/projects/new`, in the account you pick (Q2). Its API key goes into the shop's deploy secrets only.
2. **Repo.** A real, public repo (Q3), cloned at `Monita/demo/shop`. The Apperio GitHub App installed on it (you click Install; it needs your GitHub session).
3. **Shop app.** Plain JavaScript ES modules with no bundler, so stack frames name `checkout.js` and the suspect heuristic can match real files. Pages: home, product, cart, checkout, account. A few API endpoints with real latency and occasional real 500s and timeouts. SDK `apperio@1.5.0` with `environment: "production"`, `release` from the tag, replay on, sanitization on.
4. **The bug, as real code.**
   - v2.4.0 checkout awaits `fetchProfile(userId)`.
   - Commit "fix: use cached user profile on checkout" replaces it with `cache.get(userId)`, which is `undefined` for accounts with no saved profile. `renderCheckoutSummary` then throws `TypeError: Cannot read properties of undefined (reading 'email')`.
   - A decoy commit before it ("chore: bump dependencies") gives the ranking something to rank.
   - v2.4.2 adds the guard.
5. **Deploys.** A GitHub Action on push to `main` deploys the shop, then calls `POST /api/v1/projects/{id}/deployments` with `release`, `sha`, `environment: production`, `deployedBy`. That is exactly what a customer's CI would do.
6. **Traffic.** `demo/shop/traffic/run.mjs`, Playwright with Chrome. Each visitor is a fresh browser context, so a fresh SDK session. About one visitor every 20 seconds, 3 to 6 pages each, clicks, add to cart, checkout. About 30% of personas have no saved email. Some requests are slow, some fail. The checkout logs a "checkout submitted" event carrying an email and a card number, which the SDK redacts before sending (S14).

**Timeline, on the real clock (no backdating anywhere)**

| Local time | Event | What it produces |
|---|---|---|
| 12:30 | Deploy v2.4.0, start traffic | baseline logs, sessions, replays, Web Vitals |
| 13:40 | Push "chore: bump dependencies" | decoy commit + AI summary |
| 14:02 | Push "fix: use cached user profile on checkout" | commit, plain-English + technical summaries (S3, S4) |
| 14:09 | Action deploys v2.4.1 | deploy record, chart markers (S7) |
| 14:11 | First visitor with no email hits checkout | TypeError, error group, owner alert (S2, S11, S16) |
| 14:12 | Open the group in the UI | suspect commits computed (S1) |
| 14:13 | Create the GitHub issue from the draft | S8, S9 |
| 14:30 | Push the guard, Action deploys v2.4.2 at about 14:33 | second deploy |
| 14:35 | Close the issue on GitHub | group "Resolved via GitHub" (S10) |
| 15:09 | v2.4.1 window ends | verdict Degraded |
| 15:33 | v2.4.2 window ends | verdict Improved (S5, S6) |
| 15:45 | Stop traffic, run `npm run screenshots` | everything else |

About 3 hours and 15 minutes of wall-clock time. The time-dependent states are covered:

- **Verdicts.** The 60-minute window is a hardcoded constant and the backend stamps every log and deploy itself, so the only honest route is to wait. Backdating isn't possible, so I won't ask to backdate.
- **Weekly digest.** It doesn't exist, so there's nothing to trigger.

If the run happens at these times, the headline's 14:02 and 14:11 are literally true for the screenshots.

**Preconditions I'll check before starting (read-only):**

- The GitHub App's webhook URL points at the prod backend.
- AI is enabled in prod and `ANTHROPIC_MODEL` is set (the code default `claude-opus-5` may not be a valid model ID).
- Resend is configured in prod; if not, in-app alerts only.
- The backend stays awake (the keep-alive workflow covers this).

If any of these fail, I stop and come back with options rather than work around them.

---

## 9. Proposals, not to be built without your OK

1. **Live aggregate counter.** `GET /api/v1/public/stats`, aggregate only (events ingested in the last 7 days, error groups opened, deploys verdicted), cached 10 minutes. Caveat: with a small beta the numbers may be small, and today local dev writes into the same database as prod, which would inflate them.
2. **Dogfooding block.** Instrument www.apperio.dev itself with the SDK (replay off), and show a capture of its own project: "This page reports to Apperio."
3. **Explore the demo.** A read-only Demo Shop that visitors can click through, like Monoscope's playground. The project `viewer` role already exists, but a public login needs rate limiting and an account that can't change anything. Decide after Phase 3.

---

## 10. Open questions

**Blocking Phase 1**

- **Q1. Environment.** There is no staging. The local backend `.env` points at the same Atlas cluster and default `test` database as production, so local and prod share data anyway. I propose running against production (prod backend + www.apperio.dev). OK?
- **Q2. Demo account.** `femi@apperio.dev` is the super-admin account. Using it means admin-only UI in shots and a super-admin session saved on disk for the screenshot runs. I recommend a dedicated beta user (for example `demo@apperio.dev`, via an invite code). Keep femi@ or create demo@?
- **Q3. Demo repo.** Owner and name, for example public `Orun-Aye/apperio-demo-shop`. Commits authored as "Demo Dev <demo@apperio.dev>" so no personal avatar appears?
- **Q4. Shop hosting.** Vercel under a subdomain such as `shop.demo.apperio.dev` (recommended: real URLs in logs and replays, and it can become the "Explore the demo" target), or local only at `localhost`?
- **Q5. Run day.** Pick a day for the roughly 3-hour run with the push at 14:02 London time. The traffic script runs on this machine, so it has to stay on.

**Blocking Phase 3 copy**

- **Q6. Suspect commit gap.** Either change the copy to match the UI (drop "92%" and the diff), or make a small product change first: render the stored `score` as a confidence and link the SHA to the diff. My default is the copy change.
- **Q7. Copy fixes to match the product, as one batch.**
  - "sessions affected" instead of "users affected"
  - "first seen on v2.4.1" instead of the release split
  - Improved / Degraded instead of better / worse
  - no register toggle
  - digest removed from Setup step 3
  - replay moved to Shipped (beta)
  - `[CARD_REDACTED]`
  - real SHAs and counts from the run
- **Q8. Type.** A (recommended), B or C.
- **Q9. Scope.** New fonts and palette landing-only, plus two app-wide fixes before any capture?
  - (a) The `font-mono` bug, so SHAs in screenshots are monospaced.
  - (b) One accent across both themes, so light-mode screenshots aren't steel blue next to a green page.

**Footer and public pages**

- **Q10. Footer.**
  - `GDPR Ready`: I'd remove it until a privacy policy exists. There's no privacy page, and the waitlist collects emails.
  - GitHub link: which public URL?
  - Twitter/X: which handle, or remove?
  - Privacy, Terms, Security, About: remove the links for now, or write pages?
  - Contact: `mailto:femi@apperio.dev`.
  - Pricing: link to `#charter`.
  - Tagline: "Errors, traced back to the change that caused them." or "Know which change broke it."
- **Q11. Changelog and status.** May I replace the invented seed entries with real ones from git (Change Intelligence, GitHub App install flow, AI cap, notification controls, session replay), and remove the placeholder 99.9% uptime from `/status`? Both are public, and the new "it's running" signals depend on them.
- **Q12. Ship dates in the Build log.** Commit dates (Change Intelligence 2026-07-03, replay 2026-09-28), or the date each reached production? Production ran stale code until late September.

**Later**

- **Q13.** Proposals in section 9.
- **Q14.** Install ffmpeg for the optional loop?
