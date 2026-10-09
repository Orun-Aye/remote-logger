# Session D: run the Demo Shop story tonight, capture the real screenshots, ship them

You are finishing the Apperio landing page redesign. The new page is **live** at https://www.apperio.dev (commit `68e5471`), but every product image slot is empty: missing shots collapse in production. Your job, starting now (2026-10-08, evening):

1. Run the Demo Shop story once more, cleanly, on the real clock.
2. Build the screenshot pipeline and capture the real product images.
3. Fill the page's real run facts, QA, and ship a second deploy when the user says so.

Read first, in order:

1. Your memory index (`MEMORY.md`), especially `landing-redesign.md`, `sdk-release-flow.md` and `deploy-verification-first.md`.
2. `remote-logger/docs/redesign/PHASE3-NOTES.md`: the screenshot contract, every slot's shot name, its `cssWidth` and aspect, and every `TODO(run)`.
3. `remote-logger/docs/redesign/PLAN.md`: the shot list (section 7) and product facts (section 3).
4. `remote-logger/docs/redesign/SESSION-B-PROMPT.md`: ground rules and the image contract. Still binding.

The user wants short numbered steps, the answer first, and no em dashes or en dashes in anything you write.

## Non-negotiable rules (from the user)

- **Honesty over polish.** Every image comes from the real app showing data that went through the real path: the SDK in a real browser, ingestion, the GitHub App webhooks, the deploy API, the AI layer.
- **Never fake data.** No database inserts, no hand-edited DOM, no backdating. The backend stamps every log and deploy itself, so verdicts need real wall-clock time.
- **No invented social proof**, and no copy claims the product doesn't back.
- **Mask** API keys, tokens, real emails and personal identity in every capture. The demo account's own email may appear only if masked.
- **Never commit credentials.** They live in the gitignored `remote-logger/.env.screenshots` and `demo/shop/.env.deploy`.
- **Commit and push only when the user asks.** Stage files by name; never `git add -A`, `git add .` or `git commit -a`. Production deploys on push to `main` (frontend on Vercel). The backend deploys manually on Render, by the user.

## Why the last two runs failed (don't repeat them)

1. **Run 1 (14:02):** the bug's deploy failed on a network blip ("fetch failed"), and the old scheduler carried on. The scheduler now has step dependencies, and the deploy retries 4 times.
2. **Run 2 (16:02):** everything ran, but `apperio@1.5.0` sent every uncaught error as "Uncaught Error" with no stack. The group title was generic and the UI step couldn't find it. **Fixed in `apperio@1.5.2`** (published tonight). The shop must use 1.5.2 for this run.

## What already exists (verified tonight)

| Thing | Where | Notes |
|---|---|---|
| Demo shop code | `Monita/demo/shop` (git repo `Orun-Aye/apperio-demo-shop`, public) | Plain ES modules, so stack frames name `checkout.js`. Vercel functions in `api/` |
| Clean base commit | `69c2cb0` on branch `demo` | 5 clean commits, plus "build: retry Vercel deploys". **Start the new branch from here.** `main` and the rest of `demo` hold the earlier trials. Leave them alone |
| Shop hosting | Vercel project `apperio-demo-shop`, domain `shop.demo.apperio.dev` | Git integration is **disconnected** on purpose: only `npm run deploy` deploys |
| Deploy | `demo/shop/scripts/deploy.mjs` (`npm run deploy`) | Vercel CLI deploy, then `POST /projects/:id/deployments` (the real deploy API). `VERCEL_CLI` in `.env.deploy` points at the cached CLI. Retries built in |
| Shoppers | `demo/shop/traffic/run.mjs` | Playwright with installed Chrome (`channel: "chrome"`; Chromium can't download here). About 35% of shoppers have no saved profile, and they're the ones who crash on the bug |
| Story beats | `Monita/demo/story/beat.sh bump\|bug\|fix` | Commits as "Demo Dev", pushes the current branch, bumps 2.4.1 and then 2.4.2. Bug and fix file contents are in `story/bug/` and `story/fix/` |
| In-app steps | `Monita/demo/story/ui.cjs open-group\|create-issue` | Logs in via `remote-logger/.auth/demo.json` and finds the group by `reading 'email'`. **The create-issue path has never run successfully.** Watch it |
| Scheduler | `Monita/demo/story/schedule.mjs --base H` | Beats at H-1:50 (decoy), H:02 (bug), H:08 (deploy), H:12 (open group), H:13 (issue), H:30 (fix), H:32 (deploy), H:35 (close issue on GitHub). Steps whose time has passed run immediately. Log in `schedule.log`, issue state in `state.json`. **Launch detached** (PowerShell `Start-Process ... -WindowStyle Hidden`), so it survives a session restart |
| Project setup | `Monita/demo/story/setup-project.cjs "<project name>" <branch>` | Through the real UI: creates the project, turns replay on at 25%, links the repo on the given branch, writes the id and key into both env files |
| Demo account | `demo@apperio.dev`, beta tier `full`, creds in `remote-logger/.env.screenshots` | JWTs last 10 hours. If `.auth/demo.json` is stale, log in again through `/login` with Playwright and save `storageState` |
| Backend | `https://apperioserver.onrender.com/api/v1` at `3716633` | Includes tonight's fixes. Check it with `GET /projects/not-an-id/changes`, which returns 404 when current |

**Blocked by the permission system tonight (do not try):** renaming or deleting git branches, and renaming, archiving or deleting existing Apperio projects. Use a **new branch** and a **new project** instead. Project names are unique per owner, so pick an unused name, for example "Coffee Kit Shop" ("Demo Shop" and "Demo Coffee Shop" are taken by earlier trials in the demo account).

## Step 1: Set up (target about 25 minutes)

1. Check the time. Choose the story hour **H** so the bug push at H:02 leaves at least 25 minutes of shopper baseline after setup. It's about 21:35 now: if setup finishes by 21:55, `H = 22`, otherwise `H = 23`. Tell the user which, because the headline times will be the real ones (the user agreed to that).
2. In `demo/shop`:
   1. `git checkout -b demo-3 69c2cb0`
   2. `npm install apperio@1.5.2 --save-exact`
   3. Commit "chore: upgrade apperio to 1.5.2" (Demo Dev, the repo-local git config is set) and `git push -u origin demo-3`.
3. Confirm with `npm run build` that `public/vendor/apperio.js` comes from 1.5.2 (look for `pagehide` in it).
4. Run `node ../story/setup-project.cjs "Coffee Kit Shop" demo-3`. Then check the new project's Changes feed shows the backfilled commits with summaries. Use the API with the demo token, as `GET /projects/:id/changes`.
5. Run `npm run deploy` (v2.4.0). Confirm `https://shop.demo.apperio.dev/config.js` carries the **new** project id and release `v2.4.0`.
6. Start the shoppers, detached, running until about H+1:50:

   ```
   node traffic/run.mjs --minutes <n> --every 20
   ```

   Within 3 minutes, confirm logs arrive in the new project.
7. Clear `story/state.json` to `{}`, then launch `node schedule.mjs --base H` detached.

## Step 2: Watch the run (stay with it)

- **At H:11 to H:13:** the error group must appear as **"TypeError: Cannot read properties of undefined (reading 'email')"**, first seen on v2.4.1, with a stack on `checkout.js`.
- **If `ui.cjs` fails:** do the same steps yourself through the dashboard with Playwright, within minutes, and record them in `state.json`. That means opening the group (this triggers suspect commits), then **Create GitHub issue**, waiting for the AI draft, and **Create issue**.
- **The suspect commit** should be "fix: use cached user profile on checkout". If the AI picks something else, don't hide it. Tell the user and capture what's real.
- **After H:35:** the issue should be closed on GitHub (the scheduler does `gh issue close`) and the group "Resolved via GitHub".
- **Verdicts:** v2.4.1 at about H+1:09 (Degraded) and v2.4.2 at about H+1:33 (Improved). If a verdict comes out differently, capture the truth and adjust the copy.
- **Alert email:** `demo@apperio.dev` has no mailbox. Unless you can verify an email arrived, remove "and by email" from the timeline step (a `TODO(run)` in `IncidentTimeline.tsx`).

## Step 3: Screenshot pipeline (build it while the story runs)

Create `remote-logger/scripts/screenshots.ts` and an `npm run screenshots` script, following the contract in PHASE3-NOTES section 3 and the brief:

- **Login:** log in through the UI once with `DEMO_EMAIL` and `DEMO_PASSWORD` from `.env.screenshots`, then reuse `storageState`.
- **Configuration:** one config array of shots, each with:
  - name
  - route and state setup
  - a selector to wait for (never fixed sleeps)
  - element crop via `locator.screenshot`, or the full viewport
  - variant (`desktop`, or `mobile` for the `@mobile` crops)
  - themes
  - viewport
- **Capture settings:** `deviceScaleFactor: 2`, `channel: "chrome"`, animations disabled, caret hidden, toasts dismissed. Set a fixed clock (`page.clock.setFixedTime`) so "4 min ago" is stable, and `timezoneId` set to the machine's zone (Africa/Lagos, UTC+1), so captured times match the real run.
- **Masking:** use Playwright's `mask` option over keys, tokens, emails, the account menu and the org switcher.
- **Output:** convert with sharp (already installed) to WebP under about 250 KB in `public/screenshots/{dark,light}/<name>.webp` and `<name>@mobile.webp`. Write `lib/screenshots/manifest.json`: `generatedAt`, plus `shots[]` with `name`, `variant`, `theme`, `src`, `width`, `height`, `alt`, `capturedAt`, and `dpr` if not 2. Write real alt text describing what each image shows.
- **Shot list:** the shot names and target widths are in PHASE3-NOTES section 5. Capture shots that don't need verdicts as soon as their state exists: commit card and explanation, error group header, suspect commit, issue draft, the GitHub issue page (public repo, logged out), captured error, alert, Web Vitals, PII redaction, replay, GitHub App card, latest changes, AI root cause. Capture `deploy-verdicts` and `deploy-impact` after H+1:33.
- **Session replay:** pick a recorded session that hit the TypeError (replay sampling is 25%). Mark it beta.
- **Review:** open **every** image and look at it. Re-shoot anything with spinners, empty states, cut-off text, an unmasked secret, or data that contradicts the story.
- **Optional:** the 6 to 12 second `core-flow` clip. ffmpeg is not installed, so ask the user before installing it.

## Step 4: Fill the page and ship

1. **Run facts:** fill `RUN` in `components/landing/run-facts.ts` from the real captures (weekday, every time, both releases, `stackFile`), then delete its TODOs. Grep for any remaining `TODO(run)`.
2. **OG image:** a 1200x630 crop from a real capture (for example `suspect-commit`) as `app/opengraph-image.png`, then switch the Twitter card to `summary_large_image`.
3. **QA:**
   - `npx tsc --noEmit`, `npx eslint` on changed files, `npx vitest run` (3 known stale sidebar failures), `npm run build`.
   - `node scripts/capture-landing.mjs --url http://localhost:3000 --out docs/redesign/after` against a production build, at 1440, 1024, 768 and 390 in both themes. Look at every image.
   - Lighthouse on the production build.
   - Waitlist forms checked **without sending** (the local backend writes to the production database).
4. **Write `docs/redesign/SUMMARY.md`:**
   - before and after pairs
   - every screenshot and the script and state that produced it
   - what was skipped and why
   - what the user still needs to do
5. **Ship:** stage by name (scripts, `package.json` script entry, `public/screenshots/`, manifest, `run-facts.ts`, OG files, docs) and commit. **Push only when the user says so.** Then verify https://www.apperio.dev logged out in both themes: images load (not redirected to `/login`), dark images in dark mode and light in light.

## When something goes wrong

- If anything the run depends on fails (webhooks, AI summaries, issue creation, a deploy), stop that step and tell the user with options. Don't fake around it.
- Network blips on this machine are common. Re-run a failed beat by hand only if its dependencies really happened, and check `schedule.log` first.
