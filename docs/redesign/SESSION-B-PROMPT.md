# Parallel session: build the landing page redesign (everything except the product images)

You are picking up Phase 3 of the Apperio landing page redesign while another Claude session captures the real product screenshots and clips. Your job is to build every part of the new page that does not depend on those images, with clean slots the images drop into later.

Read these first, in this order:

1. `remote-logger/docs/redesign/PLAN.md`: findings, section order, type and palette, shot list. It is the source of truth.
2. `remote-logger/docs/redesign/specimen/type-specimen.png` and `palette.png`.
3. `remote-logger/docs/redesign/before/*.png`: the current page.
4. Your memory index (`MEMORY.md`) and `landing-redesign.md` in it.

## What the redesign is for

Every product visual on the page today is a hand-built HTML mock: the hero "production" log panel, the suspect-commit card, the plain-English toggle, the replay scrubber, the incident timeline cards, the feature grid and the setup cards. A visitor cannot tell whether the product exists. The redesign:

- replaces every mock with real screenshots (the other session is producing them from a real demo project)
- gives the page a new type system and quieter palette so the screenshots carry the colour
- adds honest signals that the product is live and actively built

The copy is strong and mostly stays.

## Ground rules (from the user, non-negotiable)

- **Honesty over polish.** No invented social proof: no logos, testimonials, user counts, uptime figures or certifications. If a feature is not shipped, leave it out or label it beta.
- **Copy voice.** Plain, specific, second person, no hype. New copy uses no em dashes or en dashes (hyphens in compound words are fine).
- **Don't break any of these:** the waitlist form (three forms sharing `WaitlistSignupProvider`), invite-code signup (`/signup?code=`), docs links, the theme toggle, metadata, analytics (`@vercel/analytics`).
- **Product facts, not marketing.** Verify claims against the code. Never put a SHA, count, time or name into copy that you have not seen in real data; leave a clearly marked `TODO(run)` for the other session to fill.
- The user wants explanations as short numbered steps, with the answer first.

## Ask the user before you build (one batch, with your recommendation first)

These were left open in PLAN.md section 10. Ask at the start:

1. **Type pairing.** A (Instrument Sans + JetBrains Mono, recommended and the default if they don't choose), B (IBM Plex Sans + Plex Mono), or C (Bricolage + Martian Mono).
2. **Scope of the new tokens.** Landing only (recommended, scoped under a wrapper class), plus two app-wide fixes:
   - (a) `.font-mono` renders DM Sans everywhere because `--font-code` is never defined.
   - (b) The light-theme accent is steel blue `#5a8fa8` (3.47:1, fails AA for small text) while dark is lime `#AEF78E`.

   If approved, do (a) and (b) FIRST as one small separate change, and tell the user it must be deployed before the screenshots are captured (around 15:40 on 2026-10-08), because the screenshots come from production and would otherwise show the old fonts and colours.
3. **Suspect-commit copy (PLAN Q6).** The real "Likely caused by" card shows commit message, SHA link and an AI rationale. It does NOT show a confidence percentage or a diff (the score is stored but not rendered). Default: change the copy to match.
4. **Copy fixes to match the product (PLAN Q7), as one batch.**
   - "sessions affected", not "users affected"
   - "first seen on v2.4.1", not "100% on v2.4.1 · 0% on v2.4.0" (no UI shows a release split)
   - verdict labels Improved, Healthy, Degraded, Not enough traffic, not better / worse / no change
   - no Plain English / Technical toggle (the product shows both at once)
   - the weekly digest is not built, so remove it from Setup step 3
   - session replay shipped 2026-09-28, so it moves to Shipped (beta)
   - the SDK emits `[CARD_REDACTED]`, not `[CC_REDACTED]`
5. **Footer (PLAN Q10).** SOC 2 and 99.9% SLA were already removed (local, uncommitted). Still open:
   - `GDPR Ready`: recommend removing until a privacy policy exists.
   - GitHub and Twitter/X URLs: they point at bare domains.
   - About, Privacy, Terms, Security: they all link to `/docs`.
   - Contact: `mailto:femi@apperio.dev`.
   - Pricing: link `#charter`, since `#pricing` doesn't exist.
   - Tagline: "The Developer's Logging Companion" doesn't match the hero.
6. **Changelog and status (PLAN Q11, Q12).**
   - `/changelog` is fed by invented seed entries ("1.0.0 Initial Release, 2025-06-01"), and production text still says "Monita". May real entries from git replace them? Use commit dates or first-in-production dates for "Built in the open"?
   - `/status` shows a hardcoded 99.9% uptime ("placeholder values" in `logger_backend/src/services/status.service.ts`). May it be removed before the page links to status?

Don't link to `/changelog` or `/status` as "it's running" signals until the user has answered question 6.

## Facts you need (verified 2026-10-07/08)

- **Stack.** `remote-logger` is Next.js 15.4 (App Router), React 19, Tailwind 4, next-themes (`attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`), GSAP hooks in `hooks/useGsapAnimations.ts` (they honour `prefers-reduced-motion`).
- **Landing files.** `app/page.tsx` renders `components/landing/Header.tsx`, `components/waitlist/WaitlistPage.tsx` (hero and FeatureBento are inline in it) and `components/landing/Footer.tsx`. Everything else in `components/landing/` except `Header`, `Footer` and `HeroCanvas` is dead code (no importers).
- **Tokens.** They live in `app/globals.css` (`:root` light, `.dark` dark, registered in `@theme inline`). The dashboard shares them, so a token change restyles the dashboard too.
- **Fonts.** Loaded in `app/layout.tsx`: Syne + DM Sans via `next/font/google`, `geist/font/mono`. Use `next/font/google` for the new pair (self-hosted, no layout shift), with `font-variant-numeric: tabular-nums` on times and metrics.
- **Middleware bug.** The matcher in `middleware.ts` excludes only `api|_next/static|_next/image|favicon.ico`, so files in `public/` (including future `/screenshots/*`) redirect logged-out visitors to `/login`. Fix it (exclude `screenshots/`, `videos/` and common static file extensions) and verify logged out.
- **Metadata.** Only `title` and `description` exist, and the description uses the old positioning. Add Open Graph and Twitter tags. An OG image can come from a real screenshot later, so leave a `TODO(run)`.
- **Beta tiers are gone.** As of 2026-10-08, every account has every feature (UpgradeGate deleted). "The whole product, no tiers" is now true.
- **Pricing claims.** CharterOffer and FAQ say "paid tiers start at nine dollars a month" and "free tier forever". Don't add new pricing claims.
- **Monoscope** (https://monoscope.tech) is the structural reference only: product footage first, tabbed feature sections with a clip each, a "Launch playground" path, specific numbers. It is light, Inter and blue; Apperio must not look like it. Stay dark-first, the chosen pair, one lime signal accent, mono timestamps as the structural motif, no emoji.

## The screenshot contract (build to this; the other session fills it)

- **Images.** `public/screenshots/dark/<name>.webp` and `public/screenshots/light/<name>.webp`. Mobile crops are `<name>@mobile.webp`.
- **Manifest.** `lib/screenshots/manifest.json`, imported statically by the page. Create it with `{ "generatedAt": null, "shots": [], "clips": [] }`; the other session's `npm run screenshots` overwrites it. Each shot looks like this:

  ```json
  { "name": "suspect-commit", "variant": "desktop", "theme": "dark",
    "src": "/screenshots/dark/suspect-commit.webp",
    "width": 1680, "height": 1120,
    "alt": "Issue dialog showing Likely caused by with the checkout commit",
    "capturedAt": "2026-10-08T15:40:00Z" }
  ```

  Each clip looks like this:

  ```json
  { "name": "core-flow", "theme": "dark", "mp4": "/videos/core-flow.mp4",
    "webm": "/videos/core-flow.webm", "poster": "/videos/core-flow.jpg",
    "width": 1440, "height": 900, "alt": "..." }
  ```

  Write the TypeScript types in `lib/screenshots/index.ts`, with a `getShot(name, variant)` helper that returns both themes.
- **`<ProductShot name variant? priority? caption? />`**
  - Renders the dark image under `.dark` and the light one otherwise, the same mechanism next-themes uses. Make sure only the visible theme's image downloads (hero: preload only the default dark one).
  - Uses `next/image` with width and height from the manifest. The hero image loads with priority; everything else lazy loads.
  - One consistent frame everywhere: 1px border in the line token, 12px radius, one soft shadow, **no fake browser chrome or traffic-light dots** (that reads as a mock).
  - A small mono caption under each image: `Demo Shop · captured <date>`.
  - Click-to-zoom on desktop (Radix dialog is already installed).
  - Never scale a desktop shot so small that its UI text is unreadable. On narrow viewports, use the `@mobile` crop when one exists.
  - **When the shot is missing from the manifest,** render a framed placeholder showing the shot name at the expected aspect ratio, so layout work can proceed. Add a build-time or dev warning listing missing shots. The page must not ship with placeholders; say so in your summary.
- **`<ProductClip name />`** plays the mp4 and webm with `autoPlay muted loop playsInline`, lazy loaded with the poster. Under `prefers-reduced-motion` it shows the poster only.

**Shot names**, mapped to sections in PLAN.md sections 5 and 7:

| Section | Shots |
|---|---|
| Hero | `suspect-commit` |
| Tour: Change Intelligence | `suspect-commit`, `error-group-header` |
| Tour: Plain English | `commit-card`, `commit-explained` |
| Tour: Session replay (beta) | `session-replay` |
| Incident timeline | 14:02 `commit-card`, 14:09 `chart-deploy-markers` and `deploy-verdicts`, 14:11 `captured-error`, `error-group-header`, `alert-in-app`, 14:12 `suspect-commit`, 14:13 `issue-draft` and `github-issue`, 14:33 `resolved-via-github` and `deploy-verdicts` |
| Setup step 2 | `github-app-card` |
| Setup step 3 | `latest-changes`, `deploy-impact` |
| Everything else | `ai-root-cause`, `issue-draft`, `web-vitals`, `pii-redacted-log`, `alert-in-app`, `deploy-impact` |
| Optional loop | `core-flow` |

## What to build

Follow PLAN.md section 5 (section order) and section 6 (type and palette). In short:

- **Header.** Nav: How it works, Product, Build log, FAQ, Docs. The theme toggle and Join waitlist stay.
- **Hero.** Keep the badge, the 14:02 / 14:11 headline, the sub copy, the waitlist form and the invite link. Replace `LiveLogStream` with `<ProductShot name="suspect-commit" priority />`. Remove the decorative `HeroCanvas` and dot grid from the landing page only (other pages still use HeroCanvas). Leave the "last shipped" line as `TODO(changelog)` until the user answers question 6.
- **Stack strip.** Keep, restyled; a static row is fine.
- **The problem.** Keep. `SeveredLink` is a concept diagram, not product UI, so it stays (restyled).
- **Product tour.** Replaces "The shift" (`PillarsSection`) with a tabbed section in the spirit of Monoscope's feature tabs (Change Intelligence, Plain English, Session replay beta), each with 2 or 3 short points and a capture. On mobile, use a segmented control plus tight crops. Accessible tabs: Radix Tabs is installed.
- **Anatomy of an incident.** Keep the rail and the timestamps. Each step's mock detail card becomes the matching `ProductShot`. Times and numbers are `TODO(run)`.
- **Setup.** Keep 3 steps. Step 1 stays a code block. Steps 2 and 3 become shots, and the digest goes.
- **Everything else (bento).** Real shots instead of the mocks. The install snippet stays as code. The digest card becomes text only, labelled Next.
- **Unchanged sections.** Who it is for, Comparison, Charter, FAQ and the closing CTA keep their structure and are restyled. Apply the approved copy fixes, and update the replay and digest answers in the FAQ.
- **Built in the open.** Keep. Add ship dates and changelog links per the user's answers. Replay moves to Shipped (beta).
- **Footer.** Per the user's answers. Make the copyright year current (it is hardcoded `© 2025`).
- **Delete the mock components** once their sections are rebuilt, along with dead `components/landing/*` files that have no importers. List what you deleted.

**Proposals, do not build without the user's OK:**

- a cached, aggregate-only public counter endpoint
- a dogfooding block (the landing page instrumented with Apperio)
- a read-only "Explore the demo" project

## QA before you hand back

- Run `node scripts/capture-landing.mjs --url http://localhost:3000 --out docs/redesign/after` against `npm run dev`. It does 1440, 1024, 768 and 390 in both themes, and stitches past Chrome's 16,384px limit.
- Look at every image and fix overflow, contrast, theme mismatches and misaligned frames.
- Playwright cannot download Chromium on this machine; use `channel: "chrome"`.
- Run `npx tsc --noEmit`, `npx eslint` on the files you changed, and `npx vitest run`. Three sidebar tests fail already (stale expectations about "Custom Dashboards" and "System status"); don't count those as yours.
- Run Lighthouse on a production build (`npm run build && npm start`). Targets: LCP under 2.5s, CLS under 0.1, no accessibility regressions, alt text and dimensions on every image.

## Coordination with the other session (important)

- The other session owns `demo/`, `logger_backend/`, `scripts/screenshots.ts` (it will create it), `public/screenshots/`, `public/videos/`, the contents of `lib/screenshots/manifest.json`, `.env.screenshots` and `.auth/`. Don't edit or read the secrets in those.
- **Don't change dashboard pages or components** (`app/(dashboard)/**`, shared dashboard components). The screenshots come from them, and a change mid-capture makes the set inconsistent. The only exception is the app-wide fixes in question 2, if approved and done first.
- **The working tree has uncommitted work you must not lose or sweep into your own commits:** `components/landing/Footer.tsx`, `package.json`, `package-lock.json` (adds `@playwright/test`), `.gitignore` (`.auth/`), `docs/redesign/`, `scripts/capture-landing.mjs`. Never use `git add -A`, `git add .` or `git commit -a`; stage files by name.
- **Don't commit, push or deploy unless the user asks.** Production deploys from `main` (Vercel for this repo).
- **Never submit the waitlist form with test emails.** The local backend's `.env` points at the production database, and production is live. Verify the form renders and validates without sending.

## When you finish

Write `docs/redesign/PHASE3-NOTES.md` covering:

- what you built
- every `TODO(run)` and `TODO(changelog)` left for the screenshot session
- which shots each section expects
- the decisions the user made
- what you deleted
- QA results with before and after image paths

Then give the user a short numbered summary.
