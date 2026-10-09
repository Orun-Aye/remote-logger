# Phase 3 notes: landing page build (everything except the images)

Date: 2026-10-08. Session B. Everything below is local and uncommitted, except the app-wide fix in section 2.

**Superseded by section 10 (session C):** a production build now renders nothing for a missing shot, so the page can ship with any subset of the captures. Placeholders show in `next dev` only. Both still print the list of missing shots (`[screenshots] N landing shot(s) missing ...`).

---

## 1. Decisions you made

| Question | Answer |
|---|---|
| Type pairing | A: Instrument Sans + JetBrains Mono |
| Token scope | Landing only, scoped under `.landing`, plus both app-wide fixes first, pushed to `main` |
| Suspect-commit copy (Q6) | Change the copy to match the product: no confidence %, no diff |
| Copy fixes (Q7) | Apply all |
| Changelog and status (Q11, Q12) | Frontend now, backend later. `/status` hides the fake uptime. The landing does not link `/changelog` or `/status` as live signals. The Build log uses first-in-production dates |
| Footer (Q10) | Remove GDPR Ready, trim company links (Contact = mailto, Pricing = `#charter`), drop the GitHub and X icons, new tagline |

---

## 2. App-wide fix (committed, pushed, live)

Commit `63c2b67` on `main`: `fix: render font-mono as Geist Mono and use one green accent in light mode`. Files: `app/globals.css`, `app/layout.tsx`.

1. `.font-mono` pointed at the undefined `--font-code`, so it fell back to DM Sans. It now uses `--font-geist-mono`, and the next/font variable classes moved from `<body>` to `<html>` so the `:root` tokens resolve.
2. Light-theme accent: steel blue `#5a8fa8` (3.47:1) became deep green `#1f7a3d` (5.3:1) everywhere it was used: primary, ring, chart-1, sidebar, signal, status-ok, rating-good, level-info, syntax-function. Dark is unchanged.

Verified on production at about 12:30: `https://www.apperio.dev/login` computes `.font-mono` as GeistMono (and the font loads), with `--signal` `#1f7a3d` in light and `#aef78e` in dark. The 15:40 captures will show both.

---

## 3. What was built

### Screenshot contract

| File | What it does |
|---|---|
| `lib/screenshots/manifest.json` | Created empty: `{ "generatedAt": null, "shots": [], "clips": [] }`. **Owned by the screenshot run from here on.** |
| `lib/screenshots/index.ts` | Types (`ShotEntry`, `ClipEntry`, `ScreenshotManifest`), `getShot(name, variant)` returning `{ dark, light }` (a shot captured in one theme only fills both), `getClip`, `naturalWidth`, `captureDate`, `EXPECTED_SHOTS`, `missingShots()`, `warnMissingShots()` |
| `components/landing/ProductShot.tsx` | `<ProductShot name variant? priority? caption? />`, described below |
| `components/landing/ProductClip.tsx` | `<ProductClip name caption? />`, described below |

**ProductShot behaviour (tested with throwaway images, then removed):**

1. Two `<picture>` elements, `hidden dark:block` and `block dark:hidden`. Lazy images in the hidden one never load. Verified: in dark only the dark files download, in light only the light ones.
2. The hero (`priority`) dark image is eager with `fetchpriority="high"`. In light mode the dark hero is still fetched, so one wasted download in light mode only. Accepted.
3. Below 640px a `<source media>` swaps to `<name>@mobile.webp` when the manifest has a `variant: "mobile"` entry. Verified: only the crop downloads at 390.
4. Shown at most at natural width: `width / dpr`, where `dpr` defaults to 2. Add a `"dpr"` field to a manifest entry if a capture isn't 2x.
5. Frame: 1px line border, 12px radius, one soft shadow, no browser chrome.
6. Caption: `{caption} · Demo Shop · captured YYYY-MM-DD`, using the date from `capturedAt`.
7. Click to zoom at 1024px and wider on hover devices (Radix dialog, closes with Escape). Verified.
8. `next/image` via `getImageProps`, quality 90, width and height from the manifest.
9. Missing shot: a dashed frame at the expected aspect and width, labelled with the shot name.

**ProductClip:** loads nothing until it is within 300px of the viewport. Under reduced motion it shows the poster `<img>` and never fetches the video (verified). It renders nothing if the clip isn't in the manifest, because the loop is optional.

### Page

`app/page.tsx` wraps everything in `.landing` with the two new fonts (`components/landing/fonts.ts`). It imports `app/landing.css` (the scoped tokens), sets the new metadata and calls `warnMissingShots()`. `HeroCanvas` and the dot grid are gone from the landing; `/sdk` and the auth panel still use HeroCanvas.

| # | Section | File | Notes |
|---|---|---|---|
| 1 | Header | `components/landing/Header.tsx` | Nav: How it works, Product, Build log, FAQ, Docs. Lime "Join waitlist". Solid background once scrolled |
| 2 | Hero | `components/waitlist/WaitlistPage.tsx` | LIVE pill, 3-line headline (times from `RUN`), sub copy, form, invite link, "Last shipped 2026-09-29 · Session replay (beta) in apperio 1.5.0" (links to `#build-log`), then `suspect-commit` |
| 3 | Stack strip | `StackStrip.tsx` | Static rows, no marquee |
| 4 | The problem | `ProblemSection.tsx` | SeveredLink kept, with no fake SHAs |
| 5 | Product tour | `components/landing/ProductTour.tsx` | Replaces PillarsSection. Radix Tabs with a 3-column segmented control on mobile. Inactive tabs aren't mounted, so their images don't load. The optional `core-flow` clip sits under the tabs |
| 6 | Anatomy of an incident | `IncidentTimeline.tsx` | Mono time column, rail drawn on scroll, product shots instead of mock cards. Heading duration and "N minutes before" are computed from `RUN` |
| 7 | Setup | `SetupSteps.tsx` | Step 1 is code (now includes the required `projectId`). Steps 2 and 3 are shots. Digest removed |
| 8 | Everything else | `WaitlistPage.tsx` (FeatureBento), `FeatureCard.tsx` | Shots in cards. The install snippet stays as code. The digest is text only, labelled Next |
| 9 | Who it is for | `UseCases.tsx` | Restyled, copy fixes |
| 10 | Comparison | `ComparisonTable.tsx` | Restyled. PII note "11 patterns, in the browser". Scroll region is keyboard focusable |
| 11 | Built in the open | `BuildLog.tsx` | Date column, replay is Shipped (beta) on 2026-09-29, counts derived from entries |
| 12 | Charter, FAQ, closing CTA | `CharterOffer.tsx`, `WaitlistFAQ.tsx`, `WaitlistPage.tsx` | Restyled. The conic border animation is gone. FAQ is a two-column layout with the answers fixed |
| 13 | Footer | `components/landing/Footer.tsx` | Per your answers. Dynamic year |

Landing primitives live in `components/landing/primitives.tsx`: `LandingHeading` (the shared `SectionHeading` is untouched because the dashboard uses it), `StatusTag`, and `CodeBlock` (no traffic-light dots).

### Other changes

| File | Change |
|---|---|
| `middleware.ts` | Matcher also excludes `screenshots/`, `videos/` and static extensions (webp, avif, png, jpg, gif, svg, ico, mp4, webm, txt, xml, woff, woff2). Verified logged out: `/screenshots/dark/missing.webp` and `/videos/missing.mp4` return 404 instead of a redirect to `/login`, and `/dashboard` still redirects |
| `app/status/page.tsx` | Uptime section and `UptimeBar` removed, with a comment pointing at `status.service.ts`. Verified with mocked data: components and incidents render, no 99.9 anywhere |
| `hooks/useGsapAnimations.ts` | `useScrubSequence` takes an optional `x` (default 18, unchanged). The timeline passes `{ dim: 1, x: 0 }` |
| `components/waitlist/WaitlistForm.tsx` | `useId` ids (the hero and charter forms both used `waitlist-email-left`). Lime button via `signal-fill`. Submit logic untouched |

---

## 4. Copy changes, and why

All Q6 and Q7 fixes were applied. A few more came out of checking the copy against the code:

1. Suspect commit: "says why in one sentence, with a link to the commit" instead of "92%" and the diff.
2. "sessions affected" everywhere. "First seen on v2.4.1" instead of the release split. Verdicts are Improved, Healthy, Degraded, Not enough traffic.
3. No Plain English / Technical toggle. The tour says both registers show at once.
4. Digest: removed from Setup step 3 and from Agencies in Who it is for. Bento card is text only, labelled Next.
5. Replay is Shipped (beta), dated 2026-09-29, the day `apperio@1.5.0` was published to npm (checked with `npm view apperio time`).
6. PII: 11 patterns (counted in `data-sanitizer.ts`). The FAQ claimed **national insurance**, but no such pattern exists, so I removed it. The "audit trail" is now "an in-memory record ... that your own code can read", which is what `getAuditTrail()` is.
7. **SDK snippet was wrong:** it omitted `projectId`, which `LoggerConfig` requires. Fixed in Setup and in the bento.
8. Timeline: "Someone in Manchester" became "Someone" (no location in real data). "One Tuesday afternoon" became `RUN.weekday` (Thursday). `checkout.ts` became `checkout.js` (the shop's real file). "Three files" was dropped (an unverified count). The issue draft list now matches the template: no breadcrumbs, sessions not users.
9. Release health: "an hour after each deploy, compared with the hour before" (`IMPACT_WINDOW_MINUTES = 60`). SaaS card "within minutes" became "an hour after it lands".
10. AI root cause: the product shows analysis plus a confidence label, so "fix suggestions" was dropped.
11. Hero badge "Private beta — charter access open" became "Private beta · charter access open" (no em dash). The glitch animation on 14:11 is gone.
12. Removed the hero stat tiles (count-up "<5 minutes to first insight" and similar). They weren't in the brief's keep list and "<5 minutes" is unverified. The Comparison table still says "Under 5 minutes"; **verify or soften it**.
13. Footer: the Changelog link was removed too (it leads to the invented seed history). Status stays, now that its fake uptime is hidden.

---

## 5. Left for the screenshot session

### TODO(run)

| Where | What to fill |
|---|---|
| `components/landing/run-facts.ts` | **Every value in `RUN`**: weekday, `commitTime`, `deployTime` (scheduler deploys 14:08, so check the recorded time), `errorTime`, `suspectTime`, `issueTime`, `resolvedTime` (fix deploy 14:32, close 14:35), `badRelease`, `fixRelease`, `stackFile`. Then delete the TODO. The headline, timeline, heading duration ("Thirty-one minutes") and "N minutes before it broke" all derive from these |
| `components/waitlist/IncidentTimeline.tsx:66` | Confirm the owner **email** arrived in production (needs Resend). If not, drop "and by email" from the 14:11 alert step |
| `app/page.tsx:25` | OG image from a real capture (1200x630, e.g. from `suspect-commit`), or add `app/opengraph-image.png` |
| `app/page.tsx:29` | Twitter card to `summary_large_image` once that image exists |

### TODO(changelog), after the backend replaces the seed entries

| Where | What |
|---|---|
| `components/landing/run-facts.ts` (`LAST_SHIPPED`) and `WaitlistPage.tsx:92` | Link the hero "Last shipped" item to its `/changelog` entry |
| `components/waitlist/BuildLog.tsx` | Replace "Sep 2026" with exact first-in-production days. Link each entry |
| `components/landing/Footer.tsx` | Add Changelog back to Resources |

### Shots each section expects

`cssWidth` is the width each slot is laid out for (from `EXPECTED_SHOTS`). Capture at 2x so the file is about twice that wide. A shot is never shown wider than its natural width, and a slot narrower than about 75% of it makes UI text hard to read. Mobile crops (`@mobile`, roughly 390 CSS px wide) are used below 640px for the shots marked "yes".

| Shot | Used in | cssWidth | Aspect (placeholder) | Mobile crop |
|---|---|---|---|---|
| `suspect-commit` | Hero, Tour: Change Intelligence, Timeline at suspectTime | 840 | 3:2 | yes |
| `error-group-header` | Tour: Change Intelligence, Timeline at errorTime (grouped) | 840 | 16:5 | yes |
| `commit-card` | Tour: Plain English, Timeline at commitTime | 760 | 4:1 | yes |
| `commit-explained` | Tour: Plain English | 760 | 16:9 | |
| `session-replay` | Tour: Session replay | 900 | 16:10 | |
| `chart-deploy-markers` | Timeline at deployTime | 840 | 16:7 | |
| `captured-error` | Timeline at errorTime (captured) | 640 | 4:3 | yes |
| `alert-in-app` | Timeline at errorTime (told), Bento: Alerts | 380 | 4:5 | yes |
| `issue-draft` | Timeline at issueTime, Bento: Issues drafted | 760 | 3:2 | yes |
| `github-issue` | Timeline at issueTime | 840 | 16:9 | |
| `resolved-via-github` | Timeline at resolvedTime | 840 | 6:1 | yes |
| `deploy-verdicts` | Timeline at resolvedTime | 760 | 2:1 | yes |
| `github-app-card` | Setup step 2 | 420 | 2:1 | yes |
| `latest-changes` | Setup step 3 | 420 | 4:3 | yes |
| `deploy-impact` | Setup step 3, Bento: Release health | 420 | 4:3 | yes |
| `ai-root-cause` | Bento (2 columns wide) | 760 | 16:9 | |
| `web-vitals` | Bento (2 columns wide) | 760 | 3:1 | yes |
| `pii-redacted-log` | Bento (1 column) | 420 | 4:3 | yes |
| `core-flow` (clip, optional) | Under the product tour | 1040 max | from manifest | |

Deviation from the brief's table: `deploy-verdicts` appears only at the resolve step, not also at the deploy step. At the deploy step no verdict exists yet in the story, and showing "Degraded" before the error happens reads wrong.

The bento's one-column cards are about 330 to 370px wide at 1024 to 1440, so `alert-in-app`, `pii-redacted-log`, `deploy-impact`, `github-app-card` and `latest-changes` need tight crops (about 420 CSS px natural width at most) or their text will be small.

---

## 6. Deleted

Replaced mocks: `components/waitlist/LiveLogStream.tsx`, `components/waitlist/PillarsSection.tsx`.

Dead code with no importers (checked across `app`, `components`, `lib`, `hooks`, tests and scripts): `components/waitlist/EarlyAccessGate.tsx`, and in `components/landing/`: `ClosingCTA`, `DashboardPreview`, `FAQ`, `FeatureCard`, `FeaturePreview`, `Features`, `Hero`, `Integrations`, `LogEntries`, `LogLine`, `MockChart`, `Pricing`, `ProblemSection`, `SDKSection`, `StatCards`, `StatsBar`, `TrustIndicators` (all `.tsx`). That removes the last copies of the SOC 2 and 99.9% claims.

Kept: `components/landing/HeroCanvas.tsx` (used by `/sdk` and `AuthBrandPanel`).

---

## 7. QA

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| `npx eslint` on changed files | 0 errors. 2 pre-existing warnings (`app/status/page.tsx` unused `Metadata`, `HeroCanvas.tsx` unused `_time`) |
| `npx vitest run` | 55 passed, 3 failed: the known stale sidebar tests in `src/__tests__/components/sidebar.test.tsx` |
| `npm run build` | Succeeds |
| Horizontal overflow (Playwright, 390/768/1024/1440, both themes) | None. No console errors on `/` |
| Waitlist forms (network mocked in the browser, nothing sent) | 3 forms, unique ids. Empty submit sends nothing. Error renders inline with `aria-describedby`. Success in one form updates all three, with the referral link |
| Invite link, theme toggle, docs links, `<Analytics />` | Present and unchanged |
| Lighthouse, desktop (local prod build) | Performance 97, Accessibility 100, Best practices 96, SEO 100. LCP 1.0s, CLS 0.003 |
| Lighthouse, mobile (local prod build, 2 runs) | Accessibility 100. LCP 4.0s and 5.5s, CLS 0 and 0.07 |
| Lighthouse, mobile, live page as baseline | Accessibility 96 (colour contrast fails), LCP 4.9s, Performance 49 |

**Mobile LCP misses the 2.5s target, as the live page does.** Two fixes went in:

1. The hero no longer hides its text until hydration. It was the LCP element, with 90% render delay.
2. The timeline no longer fades steps to 22% opacity. This was the contrast failure.

What remains is about 685KB of uncompressed client JS (every section is a client component: GSAP, Radix, icons) and a render-blocking 173KB app-wide stylesheet, measured on this machine's slow, throttled CPU. The real fix is turning the static sections into Server Components and keeping client JS for the forms, tabs, shots and header. Recommended as a follow-up, not started.

Captures:

- Before: `docs/redesign/before/landing-{1440,390}-{light,dark}.png` (production, 2026-10-07)
- After: `docs/redesign/after/landing-{1440,1024,768,390}-{light,dark}.png` (local dev, 2026-10-08, with placeholders)

Two things noticed but not fixed:

- `/status` throws `SyntaxError: Unexpected token '<'` from a request other than the status API (seen with the backend down and with the status API mocked).
- `next dev --turbopack` fails with `Can't resolve '@vercel/turbopack-next/internal/font/google/font'` right after a `next build` into the same `.next`. Deleting `.next` fixes it.

---

## 8. Not built (proposals, need your OK)

1. A cached, aggregate-only public counter endpoint.
2. A dogfooding block (the landing instrumented with Apperio).
3. A read-only "Explore the demo" project.

## 9. Committing this later

Nothing in sections 3 to 6 is committed. When you want it committed, stage by name and leave out the files that aren't part of this work: `.gitignore`, `package.json`, `package-lock.json`, `scripts/capture-landing.mjs` and `docs/redesign/before`, `specimen` and `PLAN.md` (unless you want them in the same commit). `components/landing/Footer.tsx` also carries your earlier SOC 2 and SLA removal, which this rewrite keeps.

---

## 10. Session C (2026-10-08 afternoon): positioning and the no-screenshot fallback

Committed locally as `68e5471` on `main` (not pushed). It holds all of session B's landing work plus session C's changes. Left out on purpose: `.gitignore`, `package.json`, `package-lock.json`, `scripts/`, `docs/`.

### Decisions

| Question | Answer |
|---|---|
| Hero subtitle | Option C: "Know when your site breaks or slows down, what visitors were doing when it happened, and which change caused it. Apperio explains it in plain English and writes it up for whoever does the fixing." Lives in `components/landing/copy.ts`, shared with the meta, OG and Twitter descriptions |
| 3-line headline | Keep as is |
| Page title | Keep "Apperio: know which change broke production" |

### Fallback (missing shots)

1. `SHOW_PLACEHOLDERS` and `shotRenders(name)` in `lib/screenshots/index.ts`. `ProductShot` returns `null` for a missing shot when `NODE_ENV === "production"`.
2. Wrappers check `shotRenders`: the hero shot block, tour tabs (a tab with no shot goes full width, with its points in 3 columns), timeline steps, setup steps 2 and 3, and bento cards (text-only).
3. Lines that point at captures appear only when one exists: the timeline's "Every capture below comes from that run" and the Build log's "every product image on it is a capture".
4. Verified on a production build with the empty manifest: zero placeholders in the HTML, 4 widths in both themes in `docs/redesign/after-noshots/`.

### Copy changes

1. Under the subtitle: "Setup is one snippet of code, added once by you or whoever built your site." There is no working no-npm path: the docs' CDN snippet (`unpkg.com/apperio@latest/dist/index.js`, `Apperio.init`) points at a file the package does not ship.
2. Jargon pass on the intros: Problem ("The moment your site goes live"), Product tour sub, Setup sub, bento headline and sub, Who it is for ("One snippet. Anyone with something live.").
3. Who it is for: "SaaS finding its footing" became "Founders and product people" (same deploy-verdict tag).
4. FAQ: new first question, "Do I need to be technical to use it?" "Installs in one line" became "installs with one snippet".
5. Over-claims fixed: alert rules only send email, Slack, webhooks and GitHub issues (`alert.service.ts`), so the stack strip's "Pushes to" and the Alerts card no longer list Discord, Teams, Linear, Jira or PagerDuty. Comparison "Under 5 minutes" became "From the first visit".
6. Bento: dense packing plus Release health spanning 2 columns at md (no hole at 768); the snippet is multi-line (no clipping at 1024).

### QA

`tsc` clean, `eslint` clean on changed files, `vitest` 55 passed and 3 known sidebar failures, `next build` OK. Waitlist forms checked with every request mocked or aborted in the browser: 3 unique ids, empty submit sends nothing, the error renders with `aria-describedby`, and success updates all 3 forms. `/screenshots/*` returns 404, not a redirect.

The production build was made in an isolated copy (scratchpad, `node_modules` junction) because two `next dev` servers from another session were using `remote-logger/.next`.

### When the screenshots land

1. The screenshot session commits `run-facts.ts`, `manifest.json`, `public/screenshots/` and `public/videos/` on top of `68e5471`.
2. Rerun `npm run build`, capture at 4 widths in both themes, and look.
3. Push only on the user's word, then verify https://www.apperio.dev logged out.
