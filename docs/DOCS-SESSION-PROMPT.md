# Docs session: make /docs the source of truth, fix the code blocks, remove /sdk

You are taking over Apperio's public documentation at `https://www.apperio.dev/docs` (code in `remote-logger/`). Three jobs, in this order of importance:

1. **Make the docs a reliable source of truth.** Every statement, option, method name, endpoint and code sample must match the code that is running in production today. Today they don't (see "What's wrong today").
2. **Fix the syntax highlighting.** Code blocks currently show raw markup to readers.
3. **Remove the `/sdk` page entirely**, after moving anything true and useful from it into `/docs`.

Read first: the project `CLAUDE.md`, your memory index (`MEMORY.md`), and `remote-logger/docs/redesign/SUMMARY.md` for the landing redesign that just shipped (its copy rules apply here too).

---

## Ground rules (from the user)

- **Honesty over polish.** Never document a feature, option or endpoint you have not found in the code. If something is beta, label it beta. If it is not built (for example the Pulse feed and weekly digests), it does not appear.
- **Copy voice.** Plain, specific, second person, no hype. No em dashes or en dashes in new copy (hyphens in compound words are fine).
- **Explanations to the user** as short numbered steps, answer first.
- **Don't commit, push or deploy unless the user asks.** Stage files by name; never `git add -A`, `git add .` or `git commit -a`. Production deploys from `main` via Vercel. After a push, verify production is serving the new code before saying it is live (Render does not auto-deploy the backend; Vercel does deploy the frontend).
- **Never write to the database.** The local backend `.env` points at the production MongoDB. Don't create projects, logs, users or waitlist entries to test docs. Read-only API calls against your own session are fine; anything that writes needs the user's OK.
- **Don't change dashboard behaviour.** The exception is the link changes needed to remove `/sdk` (see below).

---

## Ask the user first (one batch, recommendation first)

1. **Highlighter.**
   - A (recommended): **Shiki at build time** in a server component. Accurate grammars, zero client JS for highlighting, and 16 of the 17 content pages are already server components. The copy button becomes a small client child. Theme colours come from CSS variables so light (the default since 2026-10-09) and dark both work.
   - B: `sugar-high` (tiny, JS/TS only, client side).
   - C: patch the current regex highlighter. Not recommended; the approach is the bug.
2. **What the API reference covers.**
   - Recommended: only the surface a customer uses with an API key: log ingestion, the deployments API, and anything else the SDK or a CI job calls.
   - Alternative: also the JWT dashboard endpoints (projects, alerts, dashboards, auth) the current pages describe. Those are internal, change often, and documenting them makes them a support promise.
3. **Old `/sdk` URLs.**
   - Recommended: a permanent redirect `/sdk` to `/docs` in `next.config.ts`, so old links and search results land somewhere.
   - Alternative: let them 404.
4. **Look.**
   - Recommended: keep the app theme the docs use today (Observatory tokens, DM Sans, Geist Mono).
   - Alternative: adopt the landing's type and tokens (Instrument Sans + JetBrains Mono, scoped like `.landing` in `app/landing.css`).
   - Either way, add a way back to the homepage. The docs sidebar only links within `/docs`.

---

## What's wrong today (verified 2026-10-09)

**1. Code blocks show raw markup.** `components/docs/CodeBlock.tsx` escapes the code to HTML, then runs regex passes over that HTML string. Later passes rewrite the markup earlier passes inserted:

- `class` is in the keyword list, so it matches every `class="syntax-..."` attribute.
- The number pass matches the `27` in `&#x27;`.

On `/docs/quickstart`, 3 of 7 code blocks render text like `import Apperio from class="syntax-string">"apperio"`. On `/docs/sdk/configuration` it's 4 of 4, and on `/docs/api/logs` 1 of 8. Also check token contrast: light-theme `--syntax-comment` `#969a96` on a light background is under 4.5:1.

**2. The samples use an API that doesn't exist.** The docs content has `import Apperio from "apperio"` 17 times and `Apperio.init(...)` 25 times. The SDK (`apperio` 1.5.2 on npm, source in `loghive-sdk/src`) has **no default export**. `init()` is an instance method that the constructor already calls. The real usage, from `loghive-sdk/README.md`:

```ts
import { Apperio } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
});
```

`apiKey` and `projectId` are required (`LoggerConfig` in `loghive-sdk/src/types.ts`). Assume every other sample is wrong until checked.

**3. The product's core features are missing.** Zero docs pages mention session replay, the GitHub App, deploys or deploy verdicts, releases, suspect commits, or Change Intelligence. Those are what the landing page sells.

**4. Old positioning.** The docs metadata in `app/docs/layout.tsx` still says "real-time logging, error tracking, and performance monitoring SDK".

**5. Two competing references.** `app/sdk/page.tsx` (1,816 lines, a separate SDK reference) duplicates and contradicts `/docs`.

---

## Where the truth lives

Check every claim against these, in this order:

| Topic | Source of truth |
|---|---|
| SDK public API | `loghive-sdk/src/index.ts` (exports), `loghive-sdk/src/types.ts` (`LoggerConfig`, `ReplayOptions`, log levels), `loghive-sdk/src/logger.ts` |
| SDK behaviour | `auto-instrumentation.ts`, `data-sanitizer.ts` (11 PII patterns: email, card, SSN, phone, IP, passport, driving licence, bank account, API key, JWT; check the list), `replay-recorder.ts` (inputs masked by default), `tracing/`, `offline-manager.ts`, `remote-config.ts`, `utils.ts` (session id is in memory and resets on every full page load, by design) |
| Published version | `npm view apperio version` (1.5.2 on 2026-10-09). Document what is published, not unreleased source |
| SDK README | `loghive-sdk/README.md` (1,354 lines). Useful, but verify it too; it is not automatically right |
| HTTP API | `logger_backend/src/routes/*.ts` mounted in `server.ts`, then the controller and its zod schema or DTO for request and response shapes. Deployments API: `POST /api/v1/projects/:projectId/deployments` with `X-API-Key` (`routes/change.routes.ts`) |
| Product behaviour | The services: `deployment.service.ts` (60-minute verdict window, ±25% threshold, at least 10 logs each side, labels Improved, Healthy, Degraded, Not enough traffic), `errorGroup.service.ts` (fingerprinting, sessions affected, suspects computed when a group is first opened, issue draft template), `change.service.ts` (backfills 50 commits on repo link, lockfiles filtered), `aiBudget.service.ts` (monthly summary cap per project) |
| Alert channels | Check `alert.service.ts` and `notification.service.ts`. The landing currently lists only email, Slack, webhooks and GitHub issues as places alerts actually reach; Discord, Teams, Linear, Jira and PagerDuty connect on the integrations page but nothing routes alerts to them yet. Confirm before writing either way |
| Dashboard names | The UI itself (`app/(dashboard)/**`): use the labels a user sees, for example "Likely caused by", "Explain this change", "Watch replay", "Resolved via GitHub" |

If the code and the README disagree, the code wins. Note each disagreement for the user so the README can be fixed too.

---

## What to build

### 1. Code blocks

- Replace the highlighter per the user's choice. Keep the copy button, the filename/language label, optional line numbers and horizontal scroll.
- Tokens must meet 4.5:1 against the code background in both themes. Use mono everywhere (`.font-mono` renders Geist Mono app-wide since commit `63c2b67`).
- Add a regression test (vitest) that renders a sample containing quotes, `class`, numbers and a comment, and asserts the visible text contains no `syntax-`, `class=` or `&#x`.

### 2. Docs content

Rewrite or delete every page so it matches the sources above. A proposed structure (adjust with the user):

- **Getting started:** Introduction (what Apperio is, in the landing's positioning), Quick start (install, initialise, see your first error), Environments and releases.
- **Core concepts:** Projects and API keys; Errors and error groups; Connect GitHub (the GitHub App); Commits and plain-English summaries; Deploys and verdicts (deployments API, GitHub deployments); Suspect commits ("Likely caused by"); GitHub issues and two-way sync; Notifications and alerts; Session replay (beta); Performance and Web Vitals; Privacy and PII redaction.
- **SDK reference:** Configuration (every `LoggerConfig` field, its type and default, taken from the code); Logging methods; Auto-instrumentation; Error tracking; Tracing; Data sanitization; Replay options; Offline support, circuit breaker and remote config (only if they are exported and work); Sessions (the in-memory lifetime); Shutdown; Troubleshooting.
- **Framework guides:** React and Next.js, verified. The Next.js guide is the one client-component page. Add others only if you can verify them.
- **API reference:** per the user's answer.

Rules for samples:

- Every TypeScript sample must type-check against the published SDK types. Add a small script or test that extracts the samples (or keeps them in `.ts` files the pages import) and runs `tsc` on them against `loghive-sdk`'s declarations.
- Use placeholders (`'your-api-key'`, `'your-project-id'`), never real keys, SHAs or project ids.
- No invented numbers. The API dashboards page currently shows `"uptimePercent": 99.97`; examples must look like real responses from the code, with obviously fake values.

Also:

- Update `lib/docs/navigation.ts`, the slug map in `app/docs/[...slug]/page.tsx`, page descriptions and the docs metadata.
- Keep `/docs` redirecting to the first page.

### 3. Remove `/sdk`

1. Mine `app/sdk/page.tsx` for anything accurate that `/docs` lacks (sections: quickstart, config, auto-instrumentation, privacy, tracing, resilience, frameworks, advanced, api-reference, demo). Verify it, then move it into `/docs`.
2. Delete `app/sdk/` (check for a layout or other files in it).
3. Repoint or remove every link:
   - `components/landing/Footer.tsx` (two links, "SDK" and "SDK Reference")
   - `components/app-sidebar.tsx` around line 418 (dashboard nav item)
   - `components/quick-actions.tsx` line 19
   - `"/sdk"` in `PUBLIC_PATHS` in `middleware.ts`
   - Grep again for `/sdk` afterwards, including tests (`src/__tests__/`).
4. Add the redirect if the user chose it.
5. `components/landing/HeroCanvas.tsx` stays (`components/auth/AuthBrandPanel.tsx` still uses it).

---

## Facts you'll need

- **Stack.** `remote-logger` is Next.js 15.4 (App Router), React 19, Tailwind 4, next-themes. The default theme is **light** since 2026-10-09; the toggle still offers dark. Docs routes: `app/docs/layout.tsx`, `app/docs/page.tsx` (redirects), `app/docs/[...slug]/page.tsx`; content in `lib/docs/content/**`; UI in `components/docs/` (`CodeBlock`, `DocsContent`, `DocsSidebar`, `DocsTableOfContents`).
- **Production URLs.** Frontend `https://www.apperio.dev`, API `https://apperioserver.onrender.com/api/v1`.
- **Brand.** "Apperio", npm package `apperio`, class `Apperio`. No "Monita" or "LogHive" anywhere.
- **Dev server gotcha.** After `next build`, `next dev --turbopack` fails with `Can't resolve '@vercel/turbopack-next/internal/font/google/font'` until you delete `.next`.
- **Playwright.** Chromium can't download on this machine; use `channel: "chrome"`.
- **npm is slow here.** A new dependency can take minutes to install. Start installs in the background.
- **Another session may be running** a `next start` on port 3005 from its own scratchpad. Leave it alone.

---

## QA before you hand back

1. `npx tsc --noEmit`, `npx eslint` on the files you changed, and `npx vitest run`. The three stale sidebar tests in `src/__tests__/components/sidebar.test.tsx` already failed before you started; if your `/sdk` link change touches what they test, update them and say so.
2. The sample type-check passes.
3. Load every docs page (Playwright, both themes, 1440 and 390):
   - no `syntax-`, `class=` or `&#x` in any code block's text
   - no horizontal page overflow
   - no console errors
   - every internal link resolves
   - `/sdk` behaves as decided
4. Lighthouse accessibility on two docs pages: no contrast failures.
5. Grep the docs for `Apperio.init`, `import Apperio from`, `Monita`, `LogHive`, em dashes and en dashes. All should be zero.

## When you finish

Write `remote-logger/docs/DOCS-NOTES.md` with:

- what changed, page by page
- every place where the code and the README (or the old docs) disagreed, and which one you followed
- anything you left out because it isn't built or couldn't be verified
- the user's decisions
- QA results

Then give the user a short numbered summary.
