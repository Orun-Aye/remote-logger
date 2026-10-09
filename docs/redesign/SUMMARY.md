# Landing redesign: summary of the screenshot run (session D)

Date: Thursday 2026-10-08, 21:43 to Friday 2026-10-09, about 02:00 (Africa/Lagos, UTC+1).

## 1. The answer first

1. **The Demo Shop story ran end to end on the real clock.** Every image on the page comes from it, through the real path (SDK in Chrome, ingestion, GitHub App webhooks, the deploy API, the AI layer). Nothing was inserted, edited or backdated.
2. **All 18 landing shots exist** in dark and light, plus 10 phone crops: 56 WebP files, 3.4 MB, none over 250 KB.
3. **Eight production bugs turned up while capturing.** Six frontend fixes and one backend fix are committed, pushed and live, each with your OK. Section 5 lists them.
4. **The landing commit is ready but not pushed.** It holds the images, the manifest, the real run facts, the OG image, the copy fixes and the screenshot script. It waits for your word (section 8).

## 2. What happened, with the real times

| Time | Event | Source |
|---|---|---|
| 21:45 | Branch `demo-3` from `69c2cb0`, `apperio@1.5.2`, commit `002f7f6` | git |
| 21:46 | Project "Coffee Kit Shop" created through the UI: replay 25%, repo linked on `demo-3`, 7 commits backfilled with AI summaries | `setup-project.cjs` |
| 21:48 | v2.4.0 deployed and recorded | deploy API |
| 21:49 | Shoppers start (540 visitors by 00:50) | `traffic/run.mjs` |
| 22:50 | Decoy commit `bbc282b` "chore: bump dependencies" | push webhook |
| **23:02** | Bad commit `f01bc1d` "fix: use cached user profile on checkout" (webhook in at 23:02:12, AI summary at 23:02:38) | push webhook |
| **23:08** | v2.4.1 deployed, recorded 23:08:41 | deploy API |
| **23:12** | First shopper's browser throws the TypeError at 23:12:59 | SDK timestamp |
| **23:13** | Grouped at 23:13:05, first seen on v2.4.1, owner notified; suspects computed 23:13:34, top one `f01bc1d` (score 95) | backend |
| **23:14** | AI drafts the issue (23:14:08); issue #1 created at 23:14:16 | issues dialog |
| 23:28 | Last TypeError (18 in all, 18 sessions) | backend |
| 23:30 | Fix commit `8e9e342` | push webhook |
| 23:32 | v2.4.2 deployed, recorded 23:32:30 | deploy API |
| **23:42** | Issue #1 closed on GitHub at 23:42:45; group "Resolved via GitHub" at 23:42:47 | issues webhook |
| 00:09 | v2.4.1 verdict: **Degraded**, error rate 1.46% to 3.88% (+165.3%) | deploy impact |
| 00:34 | v2.4.2 verdict: **Healthy**, error rate 3.17% to 2.90% (-8.5%) | deploy impact |

These feed `components/landing/run-facts.ts`, so the page now reads: "Your code shipped at 23:02. It broke at 23:12.", "Forty minutes, start to finish." and "the commit pushed ten minutes before it broke".

### Where the run differed from the plan

1. **Close at 23:42, not 23:35.** The scheduler's `gh issue close` failed on a network blip ("error connecting to api.github.com"). Its dependencies had happened, so I re-ran that one command by hand and logged it in `schedule.log`.
2. **v2.4.2 came out Healthy, not Improved.** The shop's baseline errors (SDK console errors, flaky API calls) outweigh 18 TypeErrors, so the drop was -8.5%, inside the ±25% band. The captures and alt text say Healthy. No copy claimed Improved for this run.
3. **Two times for "it broke".** The browser threw at 23:12:59 and Apperio grouped it at 23:13:05. The headline and the "a customer" step use 23:12; the grouped, notified and suspect steps use 23:13. `RUN.brokeTime` holds the first.
4. **`ui.cjs open-group` logged no suspects.** It read the dialog ten seconds before they were computed. The suspects were right; only the log line was early.
5. **H was 23, not 22.** Setup finished at 21:50, but the shoppers had only started at 21:49, short of the 25 minutes of baseline.

## 3. The screenshot pipeline

`npm run screenshots` runs `scripts/screenshots.ts` with Node's type stripping (no new dependency).

| Flag | What it does |
|---|---|
| (none) | Every shot whose story state exists; merges entries into `lib/screenshots/manifest.json` |
| `--only a,b` / `--only a@mobile` | Just these shots |
| `--themes dark` | One theme |
| `--login` | Logs in through `/login` with `DEMO_EMAIL` and `DEMO_PASSWORD` from `.env.screenshots`, saves `.auth/demo.json` (also automatic when the JWT has under 45 minutes left) |
| `--story create-issue [--dry]` | The story's issue step: opens the group, waits for the AI draft, captures `issue-draft` in both themes and at phone width, creates the issue, then captures `github-issue` logged out. `--dry` cancels instead and writes nothing |
| `--list` | Prints the shot list |

How it works:

1. **State from the real API**: the bad and fix commits, the error group, its linked issue, the verdicts and a recorded session that hit the error. A shot whose state doesn't exist yet is skipped.
2. **Capture**: installed Chrome, `deviceScaleFactor: 2`, `reducedMotion`, Africa/Lagos time zone, `animations: "disabled"`, caret hidden, toasts hidden, focus blurred. The clock is pinned with `page.clock.setFixedTime` 30 seconds ahead of the capture start, so data arriving during the load never reads "in less than a minute" (in the future). The manifest's `capturedAt` is that pinned time.
3. **Masks**: the sidebar account block, the org switcher, the demo email, the project API key (also its first 8 characters, which the overview header shows truncated) and anything shaped like a JWT. None of the final crops contain them.
4. **Output**: sharp WebP at quality 90, stepping down until under 250 KB.
5. **The issue step** is the only way to capture the draft, because it exists only until "Create issue" is clicked. `demo/story/ui.cjs create-issue` now hands off to `--story create-issue` (the old path stays behind `--plain`). Light mode for the draft comes from the app's own theme toggle, so both themes show the same draft that was published.
6. **AI root cause** uses one page load for both themes (`oneLoad`), because each load asks the AI again and the two themes would otherwise show different answers.

## 4. Every image, and the state that produced it

Widths are CSS pixels (the files are twice that). "Phone" means an `@mobile` crop exists.

| Shot | Route and state | Viewport | Width | Phone | Captured |
|---|---|---|---|---|---|
| `suspect-commit` | Issues, group dialog open, suspects computed, issue #1 open | 1440 | 768 | 470 (at 520) | 23:33 |
| `error-group-header` | Same dialog, header and impact strip | 1440 | 750 | dropped, see 6 | 23:34 |
| `commit-card` | Changes, the `f01bc1d` card | 1180 | 844 | 310 | 23:47 |
| `commit-explained` | Same card, Explain this change open | 1180 | 844 | | 23:47 |
| `chart-deploy-markers` | Errors, Error Count Over Time with three markers | 1180 | 828 | | 01:17 |
| `captured-error` | Logs, the first TypeError (23:12:59) | 1680 | 800 | | 01:49 |
| `alert-in-app` | `/notifications`, the TypeError alert card | 460 | 409 | dropped, see 6 | 01:49 |
| `issue-draft` | Create GitHub issue dialog with the AI draft, before publishing | 1440 | 672 | 390 | 23:14 |
| `github-issue` | github.com issue #1, logged out, still open | 1280 | 960 | | 23:24 |
| `resolved-via-github` | Issues, Resolved tab, the row | 1180 | 842 | 363 | 23:54 |
| `deploy-verdicts` | Changes, Deploys: v2.4.2 Healthy, v2.4.1 Degraded | 1180 | 846 | 374 | 00:36 |
| `deploy-impact` | Overview, Deploy Impact card | 1280 | 409 | 374 | 00:37 |
| `latest-changes` | Overview, Latest Changes card | 1280 | 490 | 450 | 00:39 |
| `github-app-card` | Settings, Integrations, GitHub App card | 750 | 455 | 345 (at 640) | 22:22 |
| `web-vitals` | Web Vitals gauges | 1100 | 810 | 706 | 22:07 |
| `pii-redacted-log` | Logs, a "Checkout submitted" entry's custom data | 1680 | 471 | 464 | 22:08 |
| `ai-root-cause` | Errors, the TypeError, Root Cause Analysis open (after the backend fix) | 1180 | 828 | | 01:20 |
| `session-replay` (beta) | Sessions, a session that hit the TypeError, replay tab | 1280 | 894 | | 01:21 |
| OG image | `app/opengraph-image.png`, 1200x630 crop of the dark `suspect-commit` | | | | 23:33 |

Every image was opened and looked at. Re-shot during review: the hero pair (different counts in each theme, then a focus ring), the commit card (the sidebar overlapped it at 1060), the GitHub issue (cut box, theme clocks disagreed), the captured error (last occurrence, too wide), the GitHub App card (squeezed at 480), phone vitals (sticky bar over it), the replay (setup played it), AI root cause (sidebar overlap, then two different answers).

Notes on what the images show:

1. **Session replay** shows the checkout page as recorded, with the player's own note that the error came just before the recording. The TypeError fires while the page loads, before the lazily loaded recorder starts, and each page load is its own session (the known v1 limit). So no recording of this bug can contain the moment itself. The tab copy now says "so you see the page the visitor saw and what they did on it" instead of "the clicks, scrolls and route changes that led there".
2. **Chart markers** sit on hourly buckets: the error timeline API only buckets by hour, so v2.4.2 (23:32) shows at 00:00. The alt text says so.
3. **AI text contains em dashes.** Commit summaries, suspect rationales and the root cause are model output; I left them as they came.
4. **Web Vitals** show LCP about 5 s (Poor): real numbers from headless shoppers on this machine.

## 5. Production bugs found and fixed

All pushed with your OK and verified live.

| Commit | Repo | Fix |
|---|---|---|
| `80f862c` | remote-logger | Notifications never showed (the API answers `{notifications}`, the page read `data.data`); the project overview crashed for an hour after every deploy (stub impact with no windows); issue dialogs were stuck at 512px and the draft ran off the edge; releases showed as "vv2.4.0" |
| `a510108` | remote-logger | Errors list rows opened `/errors/undefined`; the detail page read fields the API doesn't send; root cause was asked about the message instead of a log id |
| `35a27a0` | remote-logger | The Errors chart, its sparkline and its deploy markers were always empty (`{time, errors}` vs `{timestamp, count}`) |
| `1d04746` | remote-logger | The error page was 1599px wide on any screen: the breadcrumb showed the URL-encoded message as one unbreakable word |
| `81bab86` | logger_backend | Root cause analysis now gets the stack trace, page, release and occurrence count (it only had the messages), and answers in plain text. Test: `aiInsights.rootCause.test.ts`. Deployed by you on Render at 00:58 |

## 6. Skipped, and why

1. **`core-flow` clip.** ffmpeg isn't installed and I didn't stop the run to ask. It's optional; the page renders nothing without it.
2. **"and by email" in the alert step.** The demo account has no mailbox, so the owner email couldn't be verified. The step now says "In the app, as a new notification."
3. **`error-group-header@mobile` and `alert-in-app@mobile`.** At phone width the group dialog is wider than the screen (the stack trace's long URLs), so the crop was cut off. Re-shooting now would show "Resolved", which is wrong for that step. Phones show the desktop image. The alert card had the same problem at 390 (the dashboard is wider than the screen); its 409px desktop crop reads fine on a phone.
4. **The top-bar bell.** It only lists alerts that arrive over the WebSocket while the page is open, and never loads stored ones. So `alert-in-app` comes from `/notifications`, which PLAN allowed.

## 7. QA

All against a production build of this working tree, served from a scratch copy on port 3005 (see 8.2 for why).

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean (includes `scripts/screenshots.ts`) |
| `npx eslint` on every changed file | 0 errors; only warnings that were there before |
| `npx vitest run` | 55 passed, 3 failed: the known stale sidebar tests |
| `next build` | Succeeds; no missing-shot warning; `/opengraph-image.png` is a route |
| Meta tags | `og:image` 1200x630 with alt text, `twitter:card` `summary_large_image`, no "capture pending" anywhere |
| `capture-landing.mjs`, 1440/1024/768/390, both themes | In `docs/redesign/after/`. I looked at every band. Fixed on the way: the alert crop (the page header's button overlapped it), the captured error's bottom edge, the tour showing the group header twice, and blank frames at 768 light (images still loading at capture time; the script now waits for visible images) |
| Lighthouse desktop | Performance 75, Accessibility 100, Best practices 96, SEO 100. LCP 1.3 s, CLS 0.002, TBT 490 ms, 529 KiB |
| Lighthouse mobile | Performance 50, Accessibility 100, Best practices 96, SEO 100. LCP 5.8 s, CLS 0.069, TBT 1,120 ms |
| Waitlist forms | Every waitlist request answered in the browser, everything else to a backend aborted: 3 forms with unique ids, an empty submit sends nothing, an error shows inline with `aria-invalid` and `aria-describedby`, and success switches all three forms to "You're on the list." Nothing was sent |

On Lighthouse: the LCP element is still the hero paragraph (5.3 s of render delay on mobile), not an image. That is the main-thread JavaScript issue PHASE3 described. Desktop TBT is higher than session B measured (it scored 97); this machine was also running another session's dev server, so re-measure on the live page before reading much into it.

### Copy and layout changes that came out of the run

1. Run facts filled in; `RUN.brokeTime` (23:12, the browser) added next to `RUN.errorTime` (23:13, grouped).
2. "One Thursday afternoon" became "One Thursday night" (`RUN.dayPart`), and "with nothing configured in advance" became "with no alert rules set up" (the SDK, the repo link and replay were set up).
3. "You push to main" became "You push a small fix" (the demo pushes to its linked branch `demo-3`, and the commit is a "fix:").
4. The alert step lost "and by email" (unverified).
5. Session replay tab: the first point no longer promises "the clicks, scrolls and route changes that led there", and the caption says beta.
6. The Change Intelligence tab shows only `suspect-commit` (it already contains the group header).
7. Provenance captions read "Demo shop" (the project in the images is called "Coffee Kit Shop").
8. OG image added; the Twitter card is `summary_large_image`.

## 8. What you still need to do

1. **Say "push" for the landing commit** (listed below). Vercel deploys it, then I verify www.apperio.dev logged out in both themes.
2. **Restart the old `next dev` server** if you still use it. It has run on port 3000 since 14:45 and shares `remote-logger/.next`, which my production build replaced, so it now answers 500. Delete `.next` and start it again.
3. **Decide on the follow-ups below.** None are fixed.

Follow-ups found tonight, not fixed:

1. The top-bar bell never loads stored notifications (WebSocket only), and the notifications API ignores `read=false`.
2. Dashboard pages scroll sideways below about 1175px (the top bar's minimum width), and the group dialog overflows at phone width.
3. The Errors page's "Most common error" reads "None": the top-errors API has no `name`.
4. The error detail page always says "Active", even for a resolved error (no status in the details API).
5. The error timeline buckets by hour at every range, so deploy markers can be 30 minutes off.
6. "High confidence" on root cause just means more than five similar errors.
7. The SDK's own network retries are logged as console errors in the customer's project ("Apperio: Network error on attempt 1"), which inflates error rates.
8. Errors thrown during page load can never appear in a replay (recorder not loaded yet).
9. The Changes feed calls an unverdicted deploy "No verdict yet" while the landing lists "Not enough traffic".
10. The Errors page also requests logs for an older project id (`6ac63f97...`), probably a stale selection in the store.

Landing commit contents, staged by name: `scripts/screenshots.ts`, `package.json` (the `screenshots` script, plus the earlier `@playwright/test` devDependency), `package-lock.json`, `public/screenshots/`, `lib/screenshots/manifest.json`, `components/landing/run-facts.ts`, `components/landing/ProductTour.tsx`, `components/landing/ProductShot.tsx`, `components/landing/ProductClip.tsx`, `components/waitlist/IncidentTimeline.tsx`, `components/waitlist/WaitlistPage.tsx`, `app/page.tsx`, `app/opengraph-image.png`, `app/opengraph-image.alt.txt`, `docs/redesign/` and `scripts/capture-landing.mjs`. Also `.gitignore`, which ignores `.auth/` (the demo login state).
