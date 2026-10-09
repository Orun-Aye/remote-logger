# Docs session notes (2026-10-09)

The record of the `/docs` rewrite. The brief was `docs/DOCS-SESSION-PROMPT.md`.

## 1. The answer first

1. **Every docs page was rewritten from the code**, not from the old docs or the README: the SDK source at `v1.5.2` (identical to what npm serves), the backend routes, services and zod schemas, and the dashboard's own labels. 32 pages in five sections replace the old 17.
2. **Code blocks are fixed.** Shiki highlights at build time in a server component; only the copy button hydrates. A regression test renders the sample that broke the old highlighter and fails on the old code.
3. **Every TypeScript sample is compiled.** `src/__tests__/docs/samples.test.ts` type-checks all samples against the published `apperio@1.5.2` types, React and Next.js, parses JSON samples, and rejects anything shaped like a real key, project ID or SHA.
4. **`/sdk` is gone** (page and its three components). It now redirects permanently to `/docs`, and every link to it was repointed. Nothing in it was both true and missing from `/docs`.
5. **Found along the way, not fixed:** two backend security problems, several SDK bugs, and dashboard pages that don't do what they say. Section 7. The docs describe today's behaviour honestly, including the workarounds.

## 2. Decisions

| Question | Your answer |
|---|---|
| Highlighter | Shiki at build time (recommended) |
| API reference scope | Only the API-key surface (recommended) |
| Old `/sdk` URLs | Permanent redirect to `/docs` (recommended) |
| Look | Match the landing: Instrument Sans, JetBrains Mono, landing tokens |

Calls I made without asking:

1. **Shared tokens, not a copy.** `app/landing.css` now scopes its tokens to `.landing, .docs`, so the two public surfaces can't drift. The docs-only code colours live in `app/docs/docs.css`.
2. **`apperio@1.5.2` as an exact devDependency** of `remote-logger`, so the sample check runs against the published types without needing the sibling `loghive-sdk` folder (it is a separate repo and won't exist in CI).
3. **Old docs slugs redirect too** (`/docs/installation`, `/docs/sdk/overview`, `/docs/sdk/web-vitals`, `/docs/api/authentication|projects|dashboards|alerts`), consistent with the `/sdk` choice.
4. **The dashboard's "SDK config →" link** on the project overview pointed at `/docs/api/sdk`, which never existed. It now goes to `/docs/sdk/configuration`. This is a dashboard link outside the `/sdk` exception; revert it if you'd rather not.
5. **The sidebar item keeps its "SDK Docs" label** and now links to `/docs` (a test asserts the label).

## 3. What changed

### Code

| File | Change |
|---|---|
| `lib/docs/highlight.ts` | New. Shiki core with the JavaScript regex engine (no WASM) and a css-variables theme; 8 grammars |
| `components/docs/CodeBlock.tsx` | Rewritten as an async server component; keeps filename/language label, copy button, line numbers (CSS counters, so never copied), horizontal scroll |
| `components/docs/CopyButton.tsx` | New, the only client part of a code block |
| `components/docs/DocsContent.tsx` | Now a server component; beta badge; underlined links; 16px phone gutter |
| `components/docs/DocPage.tsx` | New. Takes title, description and beta from `lib/docs/navigation.ts` so sidebar and header never disagree |
| `components/docs/DocsSidebar.tsx` | New `DocsHeader` with the logo and Home link back to the homepage, Dashboard link, theme toggle, phone menu; sidebar shows beta labels |
| `app/docs/layout.tsx` | `.docs` wrapper with landing fonts and tokens; new metadata |
| `app/docs/docs.css` | New. Code token colours for both themes, all at least 4.5:1 |
| `app/landing.css` | Token blocks shared with `.docs` |
| `lib/docs/navigation.ts` | New structure, descriptions, beta flags |
| `app/docs/[...slug]/page.tsx` | New slug map, `dynamicParams = false`, canonical URLs |
| `next.config.ts` | Redirects |
| `app/sdk/`, `components/sdk/` | Deleted |
| `components/landing/Footer.tsx`, `components/app-sidebar.tsx`, `components/quick-actions.tsx`, `middleware.ts`, `app/(dashboard)/projects/[projectId]/page.tsx` | Links repointed; `/sdk` removed from `PUBLIC_PATHS` |
| `src/__tests__/docs/samples.test.ts`, `src/__tests__/docs/code-block.test.tsx` | New tests |
| `package.json`, `package-lock.json` | `shiki` ^4.5.0, `apperio` 1.5.2 (dev) |

### Pages

Getting started

1. **Introduction**: the landing's positioning, the three inputs (SDK, GitHub App, deploys), what you see, private beta access, what is beta.
2. **Quick start**: where the key and project ID are (no page labels the project ID; it's in the URL and the SDK Config preview), install, `new Apperio(...)`, a test error, what appears where. Warns that the default `environment` is `development` while notifications default to `production`.
3. **Environments and releases** (new): what each is used for (notifications, verdicts, issues, source maps), `serviceVersion` does nothing.

Core concepts (all new)

4. **Projects and API keys**: the key is public in a browser bundle; regenerating; team roles (owner/admin change things, viewers read); retention (logs 30 days, replays 7).
5. **Errors and issues**: what counts as an error, the fingerprint, the Issues page labels, sessions affected (stops at 500), statuses and regressions (30-minute cooldown).
6. **Connect GitHub**: Install GitHub App, Linked Repository, branch, 50-commit backfill, personal-token limits, org approval.
7. **Commits and summaries**: Changes page, summaries, Explain this change, what the AI sees, limits (10 per push, monthly cap).
8. **Deploys and verdicts**: three sources, the exact rules, when the verdict appears, where it shows.
9. **Suspect commits**: candidates, scoring, AI ranking and fallback, when computed, minified-stack caveat.
10. **GitHub issues**: create flow, the draft, two-way sync, requirements.
11. **Notifications and alerts**: owner notifications and the environment filter; alert rule conditions, channels (email, Slack, webhook, GitHub issue), cooldown, snooze, maintenance windows.
12. **Session replay** (beta): turning it on, masking, watching, 7-day retention, limits.
13. **Performance and Web Vitals**: what is measured, thresholds, and what the default level actually sends.
14. **Privacy and PII redaction**: SDK-only redaction, what is and isn't covered, no browser storage, what goes to Claude.

SDK reference

15. **Configuration**: every `LoggerConfig` field with real type and default; the three options that do nothing.
16. **Logging methods** (replaces SDK Overview): levels, methods, errors in TypeScript, `captureException`, `addBreadcrumb` caveat, context, the wire format.
17. **Auto-instrumentation**: every captured event with its level and message; why most aren't sent by default.
18. **Error tracking**: browser capture, Script error., framework boundaries, manual, Node, pattern detection.
19. **Tracing**: IDs on logs only; spans aren't sent; `TracePropagator`; one trace per logger.
20. **Data sanitization**: the 10 patterns, field masking (verified output), presets, custom rules, full config type, audit trail.
21. **Replay options** (beta, new): options, code vs dashboard precedence, bundle splitting, `isReplayRecording()`.
22. **Delivery and offline** (new): batching, retries, page-exit keepalive, offline queue, remote config, other exports.
23. **Sessions** (new): per page load; `getSessionId()`.
24. **Shutdown** (new): browser needs nothing; `flush()`, `shutdown()`, the SIGTERM handler, serverless.
25. **Troubleshooting** (new): status codes, missing logs, missing notifications, console messages.

Framework guides

26. **React**: module-level logger, imported before render, error boundary with `componentDidCatch`.
27. **Next.js**: the dogfood site's pattern (`femiajanaku`), plus `error.tsx`, `global-error.tsx` and a server logger that flushes in route handlers.
28. **Node.js** (new): crash handlers, scripts, signals.

API reference

29. **Overview** (replaces Authentication): base URL, X-API-Key, endpoints, response and error shapes (the validation example is real zod output).
30. **Logs**: batch and single endpoints, every field with its limit, response, sampling on the single endpoint.
31. **Deployments** (new): fields, response, GitHub Actions step.
32. **Source maps** (beta, new): upload fields, jq and Node examples, De-minify, limits.

Deleted: Installation (folded into Quick start), SDK Overview (now Logging methods), Web Vitals (now Performance), API Authentication, Projects, Alerts, Dashboards (JWT endpoints, out of scope).

## 4. Where sources disagreed, and what I followed

The code won every time.

### The SDK README (`loghive-sdk/README.md`)

1. Says logs are sent "individually (one POST per log entry)" to `/logs`. The SDK sends batches to `/logs/batch`.
2. Says 4xx errors "except 429" aren't retried. 429 isn't retried either.
3. Documents `serviceVersion` and `autoCapture.logLevels` (including in its troubleshooting fix for noisy logs). Neither does anything.
4. Says pattern detection events log at `INFO`, with a "(5 occurrences in 5 min)" suffix. They log at `WARN`, with just the message.
5. Says remote config can change `autoCapture`. It merges the value but the instrumentation is already installed, so nothing changes.
6. Says `consoleMessages` captures `console.error` and `console.warn`. It also captures `log`, `info` and `debug`.
7. Recommends `beforeunload` + `logger.flush()` in the browser. Since 1.5.2 the SDK flushes on `pagehide`/hidden with `keepalive` by itself, and a plain fetch on unload is cancelled.
8. Says shutdown leaves the logger accepting no more logs. It accepts them; `init()` restarts it.
9. Says Node.js 16+. The SDK uses global `fetch`, so 18+.
10. `sanitization: { config: { } }` and the Express sample (`logger[level](msg, data)`) don't type-check; `catch (error)` samples pass `unknown` as an `Error`.
11. Doesn't mention that with the default `minLogLevel`, most auto-captured events (fast requests, good Web Vitals, every interaction) are dropped.
12. Doesn't mention that the SDK installs SIGINT/SIGTERM handlers that `process.exit(0)`.
13. "Your API key is invalid or expired": keys don't expire.

### The old docs and `/sdk`

Default import and `Apperio.init()` everywhere; packages that don't exist (`@apperio/react`, `@apperio/nextjs`); methods that don't exist (`startSpan`, `getSanitizationAuditTrail`, `createServerLogger`, `withApperioMiddleware`, `createEnhancedLogger`); config keys that don't exist (`patternDetection`, `sanitization.preset`, `remoteConfigUrl`); "W3C traceparent" propagation (the SDK uses `X-Trace-ID`); "9 patterns" including dates of birth (there are 10, no dates of birth); invented presets contents; `"uptimePercent": 99.97`.

### `CLAUDE.md` and the brief

1. CLAUDE.md: "SDK/Client → … → LogService → DataSanitizer → MongoDB". The backend never sanitizes. Docs say redaction is SDK-only.
2. CLAUDE.md: rate limiting "100 req/min per project, 429 responses". No rate-limit middleware is mounted anywhere. Docs promise no rate limit.
3. Brief: "11 PII patterns". There are 10.
4. Brief: verdict label "Not enough traffic". The UI says **No verdict yet**; docs use the UI's words.

## 5. Left out

1. **Pulse and digests**: not built. Not mentioned.
2. **JWT dashboard endpoints**: out of scope by your decision.
3. **`CircuitBreaker`, `compressPayload`, `HealthMetricsCollector`**: exported but unused by the logger. One sentence says so.
4. **Discord, Teams, Linear, Jira, PagerDuty**: they connect but receive no alerts. One callout says so.
5. **The Sampling and Rate Limit settings pages**: sampling only affects the single-log endpoint (documented there); rate limits aren't enforced.
6. **The dashboard Source Maps page**: its upload is simulated (see 7.3). The docs say to upload with the API.
7. **Owner email delivery**: the code sends it when a Resend key is configured, and the local `.env` has one. I couldn't verify a real email arrives (the landing dropped "and by email" for the same reason). The docs say owners are notified "in the app and by email"; check one real new-error email before relying on it.
8. **Vue, Express and other framework guides**: not verified, so not written.

## 6. What I verified and how

1. **Sample type-check**: all TS/TSX samples compile against `apperio@1.5.2`. A deliberate typo in a cross-file import made it fail, so the check isn't vacuous.
2. **Old highlighter**: fed the regression sample, it prints `import { Apperio } from class="syntax-string">&#x27;apperio&#x27;;`, the exact bug.
3. **Sanitizer examples**: run through the published package. That's how I learned an `email` field becomes `[**************]` (pattern, then masking) and that `LENIENT` sends passwords in clear.
4. **Node.js behaviour**: four scripts against a local mock server: `shutdown()` lets a script exit; without it the process stays alive; the crash pattern delivers both reports then exits 1; on SIGTERM the SDK exits 0 and cut short a 3-second app cleanup.
5. **Next.js guide**: the guide's seven files were extracted from the page source into a scratch Next.js 15.4 app and built for production (which also type-checked them). In Chrome, with SDK traffic intercepted (nothing reached Apperio): page views were logged on load and on client navigation, all in one session, tagged `production`/`web`; an error thrown in a click handler was captured automatically; a rendering error was reported once, through `error.tsx`, and never reached the SDK on its own (so the file is needed). On the server, with the SDK's requests rerouted to a local mock by a harness-only `instrumentation.ts`, the route handler delivered "Order placed" and "Order failed" before responding, and the Edge route failed with `process.on is not a function`, as the guide warns. Not exercised: `global-error.tsx` (type-checked only).
6. **React guide**: type-checked, and its pattern (module-level logger, boundary logging) is the same code path the Next.js run exercised. Not run in a Vite app.

## 7. Bugs found, not fixed

### 7.1 Security (backend)

1. **Cross-project log writes.** `POST /:projectId/logs` and `/logs/batch` authenticate the key but use `req.params.projectId`, never checking it matches the key's project (`log.controller.ts` `createLog`, `batchCreateLogs`). Any public browser key can write logs, issues and notifications into any project whose ID it knows. The deployments route does check (`change.controller.ts:169`); copy that.
2. **Project data exposed by API key.** `GET /api/v1/projects/by-api-key` has no auth and returns the whole project document (`project.routes.ts:15`, `ProjectService.getProjectByApiKey`): Slack webhook URL, alert email recipients, outgoing webhook URL and headers, team member IDs. Browser keys are public, so anyone can read these. Remove the route or return only what a caller needs.

### 7.2 SDK

1. **Batches over 100 get stuck.** `flush()` sends the whole buffer; the API rejects more than 100 per request (400); the SDK treats 4xx as final and puts the logs back, so every later flush fails the same way. Triggered by a long outage, a `batchSize` over 100, or one over-long field.
2. **The offline queue (default 500) is sent in one request** when the connection returns, so it has the same problem. Default should be ≤ 100, or send in chunks.
3. **`serviceVersion`, `autoCapture.logLevels`, `tracing.autoTraceNetworkRequests`** are typed and defaulted but never read.
4. **`addBreadcrumb()` logs at `debug`**, so it's dropped by default and never joins the breadcrumb trail attached to errors.
5. **SIGTERM handler exits with code 0** after its own flush, cutting short the app's graceful shutdown.
6. **`consoleMessages` captures the SDK's own retry messages** (already in the landing follow-ups).
7. **Remote config's sanitization preset wipes code-defined sanitization**, and `autoCapture` from remote config has no effect.
8. **`addCustomSanitizationRule` mutates the shared default `customRules` array** (shallow spread of `DEFAULT_SANITIZATION_CONFIG`), so rules leak across logger instances and into `SANITIZATION_PRESETS.BALANCED`.
9. **XHR network failures log at `debug`** (status 0), unlike fetch failures (`error`).

### 7.3 Dashboard

1. **Source Maps page upload is fake**: "Simulate upload -- in production this would call a real API", then a success toast.
2. **SDK Config preview** shows `minLogLevel: 'info'` (a type error; it's an enum), an extra `logger.init()`, and "Remote config active" even though remote config is off unless enabled in code.
3. **`GettingStartedWizard.tsx`** uses `import Apperio from 'apperio'` and `logger.init()`. It's imported nowhere, so no user sees it; delete or fix.
4. **Deploy verdicts are only computed when the project overview loads** (its Deploy Impact card calls the deployments list). The Changes feed never triggers them.
5. **Commits after the 10th in a push** stay "Writing summary…" forever (`summarizeCommits` slices to 10 and never marks the rest).
6. **Alert rule "Response Time (ms)"** matches every log without a network duration (`alert.service.ts:706`).

### 7.4 Backend docs page

`server.ts` serves an HTML page at the API root with a "Quick Start Example" that posts to `/api/v1/your-project-id/` with a JWT. Wrong path and wrong auth.

## 8. QA

All against a production build of this working tree, served locally on port 3011.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| `npx eslint` on the changed files | 0 errors. Four warnings, all in older code of files where I only changed a link (`app-sidebar.tsx`, the project overview page) |
| `npx vitest run` | 66 passed, 3 failed: the three known stale sidebar tests. The sidebar test that checks the "SDK Docs" link passes. 11 new tests (7 CodeBlock, 4 samples) |
| Sample type-check | Passes for every TS/TSX sample; fails as expected when a sample is broken on purpose |
| `next build` | Succeeds; all 32 docs pages are prerendered; a docs page ships 213 B of its own JS (no highlighter in the browser) |
| Browser QA, 32 pages × light/dark × 1440/390 (128 loads) | No `syntax-`, `class=` or `&#x` in any code block (the one allowed `class=` is the HTML sample that shows `class="apperio-mask"`); no horizontal page overflow; no console errors; every scrolling box is keyboard-focusable |
| Links | 1,505 links checked: every `/docs` link is a real page, every `#anchor` a real id; `/` 200, `/dashboard` 307 (login) |
| Redirects | `/sdk` and the 7 old docs slugs answer 308 to the right page; `/docs` goes to the introduction; an unknown docs page is 404 |
| Lighthouse accessibility | `/docs/quickstart` 100, `/docs/sdk/configuration` 100, no contrast failures (Lighthouse runs the default light theme) |
| Dark-theme code colours | Every token at least 4.5:1 on both code surfaces, by calculation (lowest 5.42) |
| Grep of docs, docs components and tests | `Apperio.init` 0, `import Apperio from` 0, Monita 0, LogHive 0, em dashes 0, en dashes 0 |

Notes:

1. Locally, every page (the landing too) logged `Unexpected token '<'`: `next start` redirects `/_vercel/insights/script.js` to `/login`. Production serves that script (checked: 200, `application/javascript`), so QA stubbed that one URL.
2. Fixed during QA: wide tables squeezed option names until they broke mid-word on phones. Tables of three or more columns now keep a minimum width and scroll inside their own focusable box; two-column tables wrap.
3. I looked at the screenshots in both themes at both widths: landing type and palette, Home link in the header and phone menu, readable code tokens.

## 9. For you

1. Review, then say "commit" and/or "push". Nothing is committed. To stage by name: the files in section 3's table, every file under `lib/docs/content/` (new, changed and deleted), `src/__tests__/docs/`, `docs/DOCS-NOTES.md` and `docs/DOCS-SESSION-PROMPT.md`. Vercel deploys the frontend from `main`; nothing in the backend changed.
2. Fix the README using section 4, and consider a 1.5.3 for 7.2.1 and 7.2.2 (the docs tell readers to keep `batchSize` and `maxQueueSize` at 100 or less until then).
3. Decide on 7.1. Both are small fixes, and the first one matters most.
4. I deleted `remote-logger/.next` after the build, so `next dev --turbopack` starts cleanly.
5. Quick wins in the dashboard (section 7.3), if you want them: point the onboarding at `/docs/quickstart`, fix the SDK Config preview, and either connect or hide the Source Maps upload form.
