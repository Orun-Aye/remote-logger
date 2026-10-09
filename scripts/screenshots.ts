/**
 * Landing page screenshots, captured from the real demo project on
 * production (the Coffee Kit Shop at shop.demo.apperio.dev, its repo
 * Orun-Aye/apperio-demo-shop, and the demo account).
 *
 *   npm run screenshots                          every shot whose state exists
 *   npm run screenshots -- --only a,b            just these shots (both variants)
 *   npm run screenshots -- --themes dark         one theme
 *   npm run screenshots -- --list                print the shot list
 *   npm run screenshots -- --login               log in through /login first
 *   npm run screenshots -- --story create-issue  the story's issue step: open the
 *                                                group, wait for the AI draft,
 *                                                capture issue-draft, then create it
 *   npm run screenshots -- --story create-issue --dry   same, but cancel instead
 *
 * Writes public/screenshots/{dark,light}/<name>[@mobile].webp and merges the
 * entries into lib/screenshots/manifest.json (shots captured earlier are kept).
 *
 * Credentials come from the gitignored .env.screenshots (DEMO_EMAIL,
 * DEMO_PASSWORD, APPERIO_URL, DEMO_PROJECT_ID); the session is reused from the
 * gitignored .auth/demo.json. Nothing here inserts data: every image shows
 * what the SDK, the GitHub App, the deploy API and the AI layer produced.
 */
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import sharp from "sharp";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Theme = "dark" | "light";
type Variant = "desktop" | "mobile";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const AUTH = path.join(ROOT, ".auth", "demo.json");
const MANIFEST = path.join(ROOT, "lib", "screenshots", "manifest.json");
const OUT = process.argv.includes("--out")
  ? path.resolve(process.argv[process.argv.indexOf("--out") + 1])
  : path.join(ROOT, "public", "screenshots");
const STORY_STATE = path.resolve(ROOT, "..", "demo", "story", "state.json");
const SHOP_DEPLOY_ENV = path.resolve(ROOT, "..", "demo", "shop", ".env.deploy");

const API = process.env.APPERIO_API_URL || "https://apperioserver.onrender.com/api/v1";
const TIMEZONE = "Africa/Lagos";
const DPR = 2;
const MAX_BYTES = 250 * 1024;
const BUG_COMMIT = "fix: use cached user profile on checkout";
const FIX_COMMIT = "fix: fall back to the profile API when nothing is cached";
const GROUP_TEXT = "reading 'email'";
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

// ─── Environment ─────────────────────────────────────────────────────────────

function readEnvFile(file: string): Record<string, string> {
  if (!existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = { ...readEnvFile(path.join(ROOT, ".env.screenshots")), ...process.env } as Record<
  string,
  string | undefined
>;
const APP = (env.APPERIO_URL || "https://www.apperio.dev").replace(/\/$/, "");
const PROJECT = env.DEMO_PROJECT_ID;
if (!PROJECT) throw new Error("screenshots: set DEMO_PROJECT_ID in .env.screenshots");

/** Strings that must never be readable in a capture. */
const SECRETS = [
  env.DEMO_EMAIL,
  readEnvFile(SHOP_DEPLOY_ENV).APPERIO_API_KEY,
].filter((s): s is string => !!s && s.length > 5);

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);
const log = (...a: unknown[]) => console.log(new Date().toTimeString().slice(0, 8), ...a);

// ─── Login ───────────────────────────────────────────────────────────────────

function savedToken(): string | null {
  if (!existsSync(AUTH)) return null;
  const state = JSON.parse(readFileSync(AUTH, "utf8")) as {
    cookies: { name: string; value: string }[];
  };
  const token = state.cookies.find((c) => c.name === "authToken")?.value;
  if (!token) return null;
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) as {
    exp?: number;
  };
  // Keep a margin: a run takes a while and the JWT lasts 10 hours
  if (!payload.exp || payload.exp * 1000 < Date.now() + 45 * 60_000) return null;
  return token;
}

async function ensureLogin(browser: Browser): Promise<string> {
  const existing = flag("login") ? null : savedToken();
  if (existing) return existing;
  if (!env.DEMO_EMAIL || !env.DEMO_PASSWORD) {
    throw new Error("screenshots: session expired and DEMO_EMAIL / DEMO_PASSWORD are not set");
  }
  log("logging in through /login");
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  await page.goto(`${APP}/login`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.fill('input[type="email"]', env.DEMO_EMAIL);
  await page.fill('input[type="password"]', env.DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 90_000 });
  mkdirSync(path.dirname(AUTH), { recursive: true });
  await context.storageState({ path: AUTH });
  await context.close();
  const token = savedToken();
  if (!token) throw new Error("screenshots: login did not produce a session");
  return token;
}

// ─── Story state (ids the routes need), read from the real API ───────────────

interface StoryState {
  groupId?: string;
  groupTitle?: string;
  groupResolved?: boolean;
  bugSha?: string;
  fixSha?: string;
  issueUrl?: string;
  issueNumber?: number;
  verdicts?: Record<string, string>;
  replay?: { sessionId: string; at: number };
}

async function api<T>(token: string, p: string): Promise<T> {
  const res = await fetch(`${API}${p}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`GET ${p} answered ${res.status}`);
  return ((await res.json()) as { data: T }).data;
}

interface ApiCommit {
  itemType: string;
  sha: string;
  message: string;
  release?: string;
  impact?: { verdict?: string };
}
interface ApiGroup {
  _id: string;
  title: string;
  status: string;
  resolvedBy?: string;
  linkedIssue?: { url: string; number: number };
}

async function resolveState(token: string): Promise<StoryState> {
  const s: StoryState = {};
  const feed = await api<ApiCommit[]>(token, `/projects/${PROJECT}/changes?limit=50`);
  s.bugSha = feed.find((c) => c.itemType === "commit" && c.message.startsWith(BUG_COMMIT))?.sha;
  s.fixSha = feed.find((c) => c.itemType === "commit" && c.message.startsWith(FIX_COMMIT))?.sha;
  s.verdicts = Object.fromEntries(
    feed
      .filter((d) => d.itemType !== "commit" && d.release && d.impact?.verdict)
      .map((d) => [d.release!, d.impact!.verdict!])
  );

  const groups = await api<ApiGroup[]>(
    token,
    `/projects/${PROJECT}/error-groups?limit=100&search=${encodeURIComponent(GROUP_TEXT)}`
  ).catch(() => [] as ApiGroup[]);
  const group = groups.find((g) => g.title.includes(GROUP_TEXT));
  if (group) {
    s.groupId = group._id;
    s.groupTitle = group.title;
    s.groupResolved = group.status === "resolved" && group.resolvedBy === "github";
    s.issueUrl = group.linkedIssue?.url;
    s.issueNumber = group.linkedIssue?.number;

    // A recorded session that hit the TypeError, for the replay shot
    const detail = await api<{ recentEvents?: { sessionId?: string; timestamp?: string }[] }>(
      token,
      `/projects/${PROJECT}/error-groups/${group._id}`
    );
    const events = (detail.recentEvents ?? []).filter((e) => e.sessionId && e.timestamp);
    if (events.length) {
      const ids = [...new Set(events.map((e) => e.sessionId!))];
      const available = await api<{ sessionIds: string[] }>(
        token,
        `/${PROJECT}/replay/available?sessionIds=${encodeURIComponent(ids.join(","))}`
      ).catch(() => ({ sessionIds: [] as string[] }));
      const hit = events.find((e) => available.sessionIds.includes(e.sessionId!));
      if (hit) s.replay = { sessionId: hit.sessionId!, at: new Date(hit.timestamp!).getTime() };
    }
  }
  return s;
}

// ─── Shot list ───────────────────────────────────────────────────────────────

type Crop =
  | { kind: "viewport" }
  | { kind: "element"; locate: (page: Page, s: StoryState) => Locator }
  /** The union of several elements' boxes (all must be on screen together) */
  | { kind: "union"; locate: (page: Page, s: StoryState) => Locator[]; pad?: number }
  /** A region worked out on the page, in viewport coordinates */
  | {
      kind: "box";
      locate: (page: Page) => Promise<{ x: number; y: number; width: number; height: number }>;
    };

interface Shot {
  name: string;
  variant: Variant;
  viewport: { width: number; height: number };
  themes?: Theme[];
  /** Story state the shot needs before it can be captured */
  needs?: (s: StoryState) => boolean;
  route: (s: StoryState) => string;
  loggedOut?: boolean;
  setup?: (page: Page, s: StoryState) => Promise<void>;
  /** Visible once the state is on screen */
  waitFor: (page: Page, s: StoryState) => Locator;
  crop: Crop;
  /** Extra selectors to mask on top of the account menu, org switcher and secrets */
  mask?: string[];
  /** Fixed clock for stable relative times. Off for the replay player. */
  clock?: boolean;
  /**
   * Capture both themes from one page load, switching with the app's own
   * theme toggle. For shots whose content is generated per request (an AI
   * answer), so dark and light show the same text.
   */
  oneLoad?: boolean;
  alt: string;
}

const p = (rest = "") => `/projects/${PROJECT}${rest}`;
const dialog = (page: Page) => page.locator("[role=dialog]").first();
/** The innermost bordered card that contains this text */
const cardWith = (page: Page, text: string, cardSel = "div.rounded-lg") =>
  page.locator(cardSel, { hasText: text }).filter({ hasNot: page.locator(cardSel, { hasText: text }) }).first();

/** Same shot at phone width, with its own crop */
const mobile = (shot: Shot, crop: Crop = shot.crop, extra: Partial<Shot> = {}): Shot => ({
  ...shot,
  variant: "mobile",
  viewport: PHONE,
  crop,
  ...extra,
});

const commitCard = (page: Page, sha: string) =>
  page
    .locator("div.rounded-lg.p-4")
    .filter({ has: page.locator(`a:text-is("${sha.slice(0, 7)}")`) })
    .first();

const deployCard = (page: Page, release: string) =>
  page.locator("div.rounded-lg.p-4").filter({ hasText: "Deployed to" }).filter({ hasText: release }).first();

const overviewCard = (page: Page, title: string) =>
  page
    .locator("div.flex.flex-col.overflow-hidden.rounded-lg")
    .filter({ has: page.locator(`span:text-is("${title}")`) })
    .first();

const logRow = (page: Page, text: string) => page.getByText(text, { exact: true }).first();
const logPanel = (page: Page) => page.locator("div.h-full.flex.flex-col.animate-slide-in-right").first();

async function searchLogs(page: Page, query: string) {
  const box = page.getByPlaceholder(/Search logs/);
  await box.waitFor({ timeout: 90_000 });
  await box.fill(query);
  await box.press("Enter");
}

const SUSPECT: Shot = {
  name: "suspect-commit",
  variant: "desktop",
  viewport: DESKTOP,
  needs: (s) => !!s.groupId,
  route: (s) => p(`/issues?group=${s.groupId}`),
  waitFor: (page) => dialog(page).getByText("Likely caused by"),
  crop: { kind: "element", locate: dialog },
  alt: "Apperio issue dialog for TypeError: Cannot read properties of undefined (reading 'email'), first seen on v2.4.1, with occurrences and sessions affected, and Likely caused by naming the commit fix: use cached user profile on checkout",
};

const GROUP_HEADER: Shot = {
  ...SUSPECT,
  name: "error-group-header",
  crop: {
    kind: "union",
    locate: (page) => [
      dialog(page).locator("h2").first(),
      dialog(page).locator("div.grid.grid-cols-3").first(),
    ],
    pad: 16,
  },
  alt: "Error group header: TypeError: Cannot read properties of undefined (reading 'email'), first seen on v2.4.1, with its occurrences, sessions affected and last seen",
};

const COMMIT: Shot = {
  name: "commit-card",
  variant: "desktop",
  viewport: { width: 1180, height: 900 },
  needs: (s) => !!s.bugSha,
  route: () => p("/changes?tab=commit"),
  waitFor: (page, s) => commitCard(page, s.bugSha!).locator("svg.lucide-sparkles"),
  crop: { kind: "element", locate: (page, s) => commitCard(page, s.bugSha!) },
  alt: "Changes feed card for the checkout commit: a plain-English summary with the technical summary under it, the author, short SHA, files changed and Explain this change",
};

const EXPLAINED: Shot = {
  ...COMMIT,
  name: "commit-explained",
  setup: async (page, s) => {
    const card = commitCard(page, s.bugSha!);
    await card.locator("svg.lucide-sparkles").waitFor({ timeout: 90_000 });
    await card.getByRole("button", { name: /Explain this change/ }).click();
  },
  waitFor: (page, s) => commitCard(page, s.bugSha!).locator("div.ml-11 p.whitespace-pre-line"),
  alt: "The checkout commit's card with Explain this change open: an AI explanation of what the code change does, written from the diff",
};

const VERDICTS: Shot = {
  name: "deploy-verdicts",
  variant: "desktop",
  viewport: { width: 1180, height: 900 },
  needs: (s) => !!s.verdicts?.["v2.4.1"] && !!s.verdicts?.["v2.4.2"],
  route: () => p("/changes?tab=deployment"),
  waitFor: (page) => deployCard(page, "v2.4.2").getByText(/Improved|Healthy|Degraded/),
  crop: {
    kind: "union",
    locate: (page) => [deployCard(page, "v2.4.2"), deployCard(page, "v2.4.1")],
    pad: 1,
  },
  alt: "Two deploy cards from the Changes feed: v2.4.2 rated Healthy and v2.4.1 rated Degraded, each with the change in error rate in the hour after the deploy",
};

const IMPACT: Shot = {
  name: "deploy-impact",
  variant: "desktop",
  viewport: { width: 1280, height: 900 },
  needs: (s) => !!s.verdicts?.["v2.4.2"],
  route: () => p(),
  waitFor: (page) => overviewCard(page, "Deploy Impact").getByText("Error rate"),
  crop: { kind: "element", locate: (page) => overviewCard(page, "Deploy Impact") },
  alt: "Deploy Impact card on the project overview: the v2.4.2 deploy rated Healthy, with its error rate in the hour before and the hour after",
};

const LATEST: Shot = {
  name: "latest-changes",
  variant: "desktop",
  viewport: { width: 1280, height: 900 },
  needs: (s) => !!s.fixSha,
  route: () => p(),
  waitFor: (page) => overviewCard(page, "Latest Changes").locator("svg.lucide-sparkles"),
  crop: { kind: "element", locate: (page) => overviewCard(page, "Latest Changes") },
  alt: "Latest Changes card on the project overview: the newest commits and deploys, each commit summarised in plain English",
};

const CHART: Shot = {
  name: "chart-deploy-markers",
  variant: "desktop",
  viewport: { width: 1180, height: 900 },
  needs: (s) => !!s.fixSha,
  route: () => p("/errors"),
  // The markers arrive after the series: wait until the deploy lines are drawn
  waitFor: (page) =>
    page
      .locator("div.rounded-lg", { has: page.locator('h3:text-is("Error Count Over Time")') })
      .locator(".recharts-reference-line")
      .nth(2),
  crop: {
    kind: "element",
    locate: (page) =>
      page.locator("div.rounded-lg.p-6", { has: page.locator('h3:text-is("Error Count Over Time")') }).first(),
  },
  alt: "Error Count Over Time chart for the demo shop with a marker for each of the three deploys, v2.4.0, v2.4.1 and v2.4.2, snapped to the chart's hourly buckets",
};

const ALERT: Shot = {
  name: "alert-in-app",
  variant: "desktop",
  // The top-bar bell only lists alerts that arrive while the page is open, so
  // the stored alert is shown where it is kept. At this width the card wraps
  // to about the 380px the landing shows it at.
  viewport: { width: 460, height: 900 },
  needs: (s) => !!s.groupId,
  route: () => "/notifications",
  waitFor: (page) => page.getByText(GROUP_TEXT).first(),
  // The card alone: at this width the page header's button overlaps its title
  crop: { kind: "element", locate: (page) => cardWith(page, GROUP_TEXT, "div.rounded-xl.border") },
  alt: "Apperio notifications with an unread alert: New error in Coffee Kit Shop: TypeError: Cannot read properties of undefined (reading 'email') (production)",
};

const VITALS: Shot = {
  name: "web-vitals",
  variant: "desktop",
  viewport: { width: 1180, height: 900 },
  route: () => p("/web-vitals"),
  waitFor: (page) => page.getByText("Largest Contentful Paint").first(),
  crop: {
    kind: "element",
    locate: (page) =>
      page.locator("div.grid", { has: page.getByText("Largest Contentful Paint") }).filter({ has: page.getByText("Cumulative Layout Shift") }).last(),
  },
  alt: "Core Web Vitals gauges for the shop, measured in visitors' browsers: Largest Contentful Paint, Interaction to Next Paint and Cumulative Layout Shift, each with its rating",
};

const RCA: Shot = {
  name: "ai-root-cause",
  variant: "desktop",
  viewport: { width: 1180, height: 1000 },
  needs: (s) => !!s.groupId,
  route: () => p("/errors"),
  setup: async (page) => {
    await page.getByRole("button", { name: /Top Errors/ }).first().click({ timeout: 90_000 });
    // Table rows and grid cards are both buttons; either opens the error page
    await page.locator("button", { hasText: GROUP_TEXT }).first().click({ timeout: 90_000 });
    await page.getByRole("button", { name: /Root Cause Analysis/ }).click({ timeout: 90_000 });
  },
  waitFor: (page) => page.getByText("Claude AI").first(),
  // Every load asks the AI again, so take both themes from one answer
  oneLoad: true,
  crop: {
    kind: "element",
    locate: (page) =>
      page.locator("div.rounded-lg.overflow-hidden", { has: page.getByRole("button", { name: /Root Cause Analysis/ }) }).first(),
  },
  alt: "Root Cause Analysis on the TypeError's error page: the AI traces it to renderCheckoutSummary in checkout.js line 25, explains why it fails and suggests a fix, marked Claude AI with a confidence label",
};

const PII: Shot = {
  name: "pii-redacted-log",
  variant: "desktop",
  viewport: { width: 1680, height: 1000 },
  route: () => p("/logs"),
  setup: async (page) => {
    await searchLogs(page, "Checkout submitted");
    await logRow(page, "Checkout submitted").click({ timeout: 90_000 });
  },
  waitFor: (page) => page.getByText("CARD_REDACTED").first(),
  crop: {
    kind: "element",
    locate: (page) => page.locator("div", { has: page.getByText("Custom Data", { exact: true }) }).filter({ has: page.getByText("CARD_REDACTED") }).last(),
  },
  alt: "A Checkout submitted log entry's custom data: the shopper's email and card number arrive already masked by the SDK in the browser",
};

const CAPTURED: Shot = {
  name: "captured-error",
  variant: "desktop",
  viewport: { width: 1680, height: 1000 },
  needs: (s) => !!s.groupId,
  route: () => p("/logs"),
  setup: async (page) => {
    // The "N logs matching" header repeats the query, so search for part of
    // the message and click the row by the rest of it
    await searchLogs(page, "Cannot read properties");
    // Newest first, so the last row is the first occurrence (the timeline's moment)
    const rows = page.getByText(/\(reading 'email'\)/);
    await rows.first().waitFor({ timeout: 90_000 });
    await rows.last().click({ timeout: 90_000 });
  },
  waitFor: (page) => logPanel(page).getByText(/checkout\.js/).first(),
  // The panel's header (level, time, release, message) down to the end of the
  // first stack block. The panel is ~1000px wide at this viewport and the
  // stack lines end near 730px, so the right side (copy buttons) is left out
  // to keep the text readable in a 640px slot.
  crop: {
    kind: "box",
    locate: async (page) => {
      // The panel slides in from the right, and with a log open the explorer is
      // wider than the viewport: let it land, then scroll it into view
      await logPanel(page).evaluate((el) =>
        Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)).then(() => undefined)
      );
      await logPanel(page).scrollIntoViewIfNeeded();
      const panel = await logPanel(page).boundingBox();
      const stack = await logPanel(page)
        .locator("div.rounded-lg", { hasText: "checkout.js" })
        .locator("pre, code")
        .first()
        .boundingBox();
      if (!panel || !stack) throw new Error("captured-error: panel or stack not on screen");
      return {
        x: panel.x,
        y: panel.y,
        width: Math.min(panel.width, 800),
        height: stack.y + stack.height + 14 - panel.y,
      };
    },
  },
  alt: "The first captured TypeError in the log explorer: level, time and release v2.4.1, the message, and its stack trace through checkout.js",
};

const REPLAY: Shot = {
  name: "session-replay",
  variant: "desktop",
  viewport: { width: 1280, height: 1000 },
  needs: (s) => !!s.replay,
  clock: false,
  route: (s) => p(`/sessions/${encodeURIComponent(s.replay!.sessionId)}?tab=replay&at=${s.replay!.at}`),
  // The TypeError fires while the checkout page loads, before the lazily
  // loaded recorder starts, so the recording begins just after it and the
  // player says so. The shot is the recorded page, not yet played.
  waitFor: (page) => page.locator(".apperio-replay .replayer-wrapper iframe"),
  crop: {
    kind: "element",
    locate: (page) => page.locator("div.space-y-3", { has: page.locator(".apperio-replay") }).first(),
  },
  alt: "Session replay (beta) of a shopper who hit the TypeError: the checkout page as recorded, with the player noting that the error came just before the recording began",
};

const APP_CARD: Shot = {
  name: "github-app-card",
  variant: "desktop",
  // Below 768px the settings page drops to one column, so the card lays out at
  // about the 420px the setup step shows it at and its text stays readable
  viewport: { width: 750, height: 1200 },
  route: () => p("/settings/integrations"),
  waitFor: (page) => page.getByText("Covered repositories"),
  crop: { kind: "element", locate: (page) => cardWith(page, "Covered repositories", "div.rounded-xl.border") },
  alt: "GitHub App card in the project's integrations: connected via the Apperio GitHub App, with the demo shop repository covered",
};

const RESOLVED: Shot = {
  name: "resolved-via-github",
  variant: "desktop",
  viewport: { width: 1180, height: 900 },
  needs: (s) => !!s.groupResolved,
  route: () => p("/issues"),
  setup: async (page) => {
    await page.getByRole("button", { name: /^Resolved/ }).first().click({ timeout: 90_000 });
  },
  waitFor: (page) => page.locator("button", { hasText: GROUP_TEXT }).getByText("Resolved via GitHub"),
  crop: { kind: "element", locate: (page) => page.locator("button", { hasText: GROUP_TEXT }).first() },
  alt: "The TypeError's row in Issues, Resolved tab: Resolved via GitHub, with the linked GitHub issue shown as closed",
};

const GITHUB_ISSUE: Shot = {
  name: "github-issue",
  variant: "desktop",
  viewport: { width: 1280, height: 900 },
  needs: (s) => !!s.issueUrl,
  loggedOut: true,
  route: (s) => s.issueUrl!,
  waitFor: (page) => page.locator("[data-testid=issue-body] .markdown-body").first(),
  // GitHub renders its own relative times; a fixed clock made the two themes disagree
  clock: false,
  // The issue title and the top of its body, without GitHub's sidebar
  crop: {
    kind: "box",
    locate: async (page) => {
      const title = await page.locator("main h1").first().boundingBox();
      const body = await page.locator("[data-testid=issue-body]").first().boundingBox();
      if (!title || !body) throw new Error("github-issue: no title or body on screen");
      const x = Math.max(0, title.x - 24);
      const y = Math.max(0, title.y - 24);
      return { x, y, width: Math.min(1280, body.x + body.width + 24) - x, height: Math.min(900 - y, 560) };
    },
  },
  alt: "The GitHub issue Apperio opened in the demo shop's public repository, written from the error's stack trace, impact and suspect commit",
};

const ISSUE_DRAFT: Shot = {
  name: "issue-draft",
  variant: "desktop",
  viewport: DESKTOP,
  // Only exists between "Create GitHub issue" and "Create issue": see --story
  needs: () => false,
  route: (s) => p(`/issues?group=${s.groupId}`),
  waitFor: (page) => page.getByText("Drafted by AI"),
  crop: { kind: "element", locate: dialog },
  alt: "Create GitHub issue dialog with the AI draft: a title and a markdown body written from the stack trace, impact data and suspect commits, ready to review",
};

const SHOTS: Shot[] = [
  SUSPECT,
  mobile(SUSPECT, {
    kind: "element",
    locate: (page) => dialog(page).locator("div.space-y-2", { has: page.locator('h3:has-text("Likely caused by")') }).first(),
  }, {
    // At 390 the stack trace's long URLs make the dialog wider than the screen
    // (a dashboard bug on phones), which cuts this block off; 520 fits it
    viewport: { width: 520, height: 1000 },
    alt: "Likely caused by: the commit fix: use cached user profile on checkout, with its SHA and the AI's one-sentence reason",
  }),
  GROUP_HEADER,
  // No phone crop: at 390 the dialog is wider than the screen (the stack
  // trace's long URLs), so phones show the desktop image instead
  COMMIT,
  mobile(COMMIT),
  EXPLAINED,
  VERDICTS,
  mobile(VERDICTS),
  IMPACT,
  mobile(IMPACT),
  LATEST,
  mobile(LATEST),
  CHART,
  ALERT,
  // No phone crop: at 390 the dashboard is wider than the screen and cuts the card
  VITALS,
  // Tall enough that the stacked gauges sit below the sticky top bar
  mobile(VITALS, VITALS.crop, { viewport: { width: 390, height: 1900 } }),
  RCA,
  PII,
  mobile(PII, PII.crop, { viewport: { width: 390, height: 1400 } }),
  CAPTURED,
  REPLAY,
  APP_CARD,
  // At 390 the settings nav squeezes the card; 640 gives a ~345px card
  mobile(APP_CARD, APP_CARD.crop, { viewport: { width: 640, height: 1200 } }),
  RESOLVED,
  mobile(RESOLVED),
  GITHUB_ISSUE,
  ISSUE_DRAFT,
];

// ─── Capture ─────────────────────────────────────────────────────────────────

interface ShotEntry {
  name: string;
  variant: Variant;
  theme: Theme;
  src: string;
  width: number;
  height: number;
  alt: string;
  capturedAt: string;
  dpr?: number;
}

const CAPTURE_CSS = `
  *, *::before, *::after { caret-color: transparent !important; }
  [data-sonner-toaster], [data-sonner-toast] { display: none !important; }
  nextjs-portal, [data-nextjs-toast] { display: none !important; }
`;

const MASKED = [
  // Account menu (name, avatar) and org switcher
  "[data-sidebar=footer]",
  'button:has-text("Select Organization")',
];

async function newContext(
  browser: Browser,
  theme: Theme,
  viewport: { width: number; height: number },
  loggedOut = false
): Promise<BrowserContext> {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: DPR,
    colorScheme: theme,
    reducedMotion: "reduce",
    timezoneId: TIMEZONE,
    storageState: loggedOut ? undefined : AUTH,
  });
  await context.addInitScript(
    ({ t, css }) => {
      try {
        localStorage.setItem("theme", t);
      } catch {}
      const add = () => {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
      };
      if (document.head) add();
      else document.addEventListener("DOMContentLoaded", add);
    },
    { t: theme, css: CAPTURE_CSS }
  );
  return context;
}

/** Waits until nothing inside `scope` is spinning or pulsing (no fixed sleeps). */
async function settle(page: Page, scope: Locator) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const busy = await scope.locator(".animate-spin, .animate-pulse").count();
    if (!busy) break;
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // Two frames, so layout from the last data update is painted
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  );
}

function masksFor(page: Page, shot: Shot): Locator[] {
  return [
    ...[...MASKED, ...(shot.mask ?? [])].map((sel) => page.locator(sel)),
    ...SECRETS.map((secret) => page.getByText(secret, { exact: false })),
    // The overview header shows the key truncated, so match its first characters too
    ...SECRETS.map((secret) => page.getByText(secret.slice(0, 8), { exact: false })),
    page.getByText(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+/),
  ];
}

async function grab(page: Page, shot: Shot, s: StoryState, theme: Theme): Promise<Buffer> {
  const options = {
    animations: "disabled" as const,
    caret: "hide" as const,
    scale: "device" as const,
    mask: masksFor(page, shot),
    maskColor: theme === "dark" ? "#26262b" : "#e4e4e7",
  };
  // No focus rings: a dialog focuses its close button when it opens
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
  if (shot.crop.kind === "viewport") {
    await settle(page, page.locator("body"));
    return page.screenshot(options);
  }
  if (shot.crop.kind === "element") {
    const target = shot.crop.locate(page, s);
    await target.scrollIntoViewIfNeeded();
    await settle(page, target);
    return target.screenshot(options);
  }
  if (shot.crop.kind === "box") {
    await settle(page, page.locator("body"));
    return page.screenshot({ ...options, clip: await shot.crop.locate(page) });
  }
  const parts = shot.crop.locate(page, s);
  await parts[0].scrollIntoViewIfNeeded();
  for (const part of parts) await settle(page, part);
  const boxes = await Promise.all(parts.map((part) => part.boundingBox()));
  if (boxes.some((b) => !b)) throw new Error(`${shot.name}: a crop element is not on screen`);
  const pad = shot.crop.pad ?? 0;
  const x = Math.max(0, Math.min(...boxes.map((b) => b!.x)) - pad);
  const y = Math.max(0, Math.min(...boxes.map((b) => b!.y)) - pad);
  const right = Math.max(...boxes.map((b) => b!.x + b!.width)) + pad;
  const bottom = Math.max(...boxes.map((b) => b!.y + b!.height)) + pad;
  return page.screenshot({ ...options, clip: { x, y, width: right - x, height: bottom - y } });
}

async function toWebp(png: Buffer, file: string) {
  let quality = 90;
  let out = await sharp(png).webp({ quality, effort: 6 }).toBuffer();
  while (out.length > MAX_BYTES && quality > 50) {
    quality -= 8;
    out = await sharp(png).webp({ quality, effort: 6 }).toBuffer();
  }
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, out);
  const meta = await sharp(out).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0, bytes: out.length, quality };
}

async function save(shot: Shot, theme: Theme, png: Buffer, capturedAt: Date): Promise<ShotEntry> {
  const file = `${shot.name}${shot.variant === "mobile" ? "@mobile" : ""}.webp`;
  const result = await toWebp(png, path.join(OUT, theme, file));
  log(
    `   ${theme}/${file} ${result.width}x${result.height} ${Math.round(result.bytes / 1024)}KB q${result.quality}`
  );
  return {
    name: shot.name,
    variant: shot.variant,
    theme,
    src: `/screenshots/${theme}/${file}`,
    width: result.width,
    height: result.height,
    alt: shot.alt,
    capturedAt: capturedAt.toISOString(),
  };
}

/** Dark, then light, from the same page (see Shot.oneLoad). */
async function captureOneLoad(browser: Browser, shot: Shot, s: StoryState, now: Date): Promise<ShotEntry[]> {
  const context = await newContext(browser, "dark", shot.viewport, shot.loggedOut);
  try {
    const page = await context.newPage();
    if (shot.clock !== false) await page.clock.setFixedTime(now);
    await page.goto(`${APP}${shot.route(s)}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    if (shot.setup) await shot.setup(page, s);
    await shot.waitFor(page, s).first().waitFor({ state: "visible", timeout: 120_000 });
    const dark = await save(shot, "dark", await grab(page, shot, s, "dark"), now);
    await page.locator("button:has(> span.sr-only:text-is('Toggle theme'))").first().click();
    await page.waitForFunction(() => !document.documentElement.classList.contains("dark"));
    const light = await save(shot, "light", await grab(page, shot, s, "light"), now);
    return [dark, light];
  } finally {
    await context.close();
  }
}

async function capture(
  browser: Browser,
  shot: Shot,
  theme: Theme,
  s: StoryState,
  now: Date
): Promise<ShotEntry> {
  const context = await newContext(browser, theme, shot.viewport, shot.loggedOut);
  try {
    const page = await context.newPage();
    if (shot.clock !== false) await page.clock.setFixedTime(now);
    const route = shot.route(s);
    await page.goto(route.startsWith("http") ? route : `${APP}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    if (shot.setup) await shot.setup(page, s);
    await shot.waitFor(page, s).first().waitFor({ state: "visible", timeout: 120_000 });
    return await save(shot, theme, await grab(page, shot, s, theme), now);
  } finally {
    await context.close();
  }
}

// ─── Manifest ────────────────────────────────────────────────────────────────

interface Manifest {
  generatedAt: string | null;
  shots: ShotEntry[];
  clips: unknown[];
}

function writeManifest(entries: ShotEntry[]) {
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;
  const key = (e: ShotEntry) => `${e.name}|${e.variant}|${e.theme}`;
  const merged = new Map(manifest.shots.map((e) => [key(e), e]));
  for (const e of entries) merged.set(key(e), e);
  const shots = [...merged.values()].sort((a, b) => key(a).localeCompare(key(b)));
  writeFileSync(
    MANIFEST,
    JSON.stringify({ generatedAt: new Date().toISOString(), shots, clips: manifest.clips ?? [] }, null, 2) + "\n"
  );
}

// ─── The story's issue step ──────────────────────────────────────────────────
// The draft exists only between "Create GitHub issue" and "Create issue", so
// this step does what demo/story/ui.cjs create-issue did and captures the
// draft on the way: both themes (switched with the app's own toggle) and the
// phone crop, then creates the issue from that same draft.

async function storyCreateIssue(browser: Browser, token: string, dry: boolean) {
  const story = existsSync(STORY_STATE)
    ? (JSON.parse(readFileSync(STORY_STATE, "utf8")) as Record<string, unknown>)
    : {};
  // A dry run (rehearsal on another group) leaves the story state and manifest alone
  const saveStory = () => !dry && writeFileSync(STORY_STATE, JSON.stringify(story, null, 2));
  const saveManifest = (list: ShotEntry[]) => !dry && list.length > 0 && writeManifest(list);
  const groupText = arg("group-text") || GROUP_TEXT;

  const context = await newContext(browser, "dark", DESKTOP);
  const page = await context.newPage();
  const entries: ShotEntry[] = [];
  try {
    // The group shows up once the first error is ingested; keep looking
    let found = false;
    for (let i = 0; i < 20 && !found; i++) {
      await page.goto(`${APP}${p("/issues")}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
      const row = page.locator("button", { hasText: groupText }).first();
      found = await row
        .waitFor({ timeout: 30_000 })
        .then(() => true)
        .catch(() => false);
      if (found) await row.click();
      else log("group not there yet, retrying");
    }
    if (!found) throw new Error("error group never appeared");
    story.groupUrl = page.url();

    await dialog(page).getByRole("button", { name: "Create GitHub issue" }).click({ timeout: 90_000 });
    const draft = page.locator("[role=dialog] textarea");
    await draft.waitFor({ timeout: 90_000 });
    await page.waitForFunction(
      () => (document.querySelector<HTMLTextAreaElement>("[role=dialog] textarea")?.value || "").length > 40,
      null,
      { timeout: 150_000 }
    );
    story.draftTitle = await page.locator("[role=dialog] input").first().inputValue();
    story.draftSource = (await page.getByText("Drafted by AI").count()) ? "ai" : "template";
    log("draft ready:", story.draftSource, "|", story.draftTitle);

    const s: StoryState = {};
    const now = new Date();
    const desktopShot = ISSUE_DRAFT;
    // At phone width the dialog is full width and scrolls, so its visible box
    // is the title and the first lines of the body
    const mobileShot = mobile(ISSUE_DRAFT, ISSUE_DRAFT.crop, {
      alt: "The AI-drafted GitHub issue on a phone: its title and the first lines of the markdown body",
    });

    const themeToggle = page.locator("button:has(> span.sr-only:text-is('Toggle theme'))").first();
    for (const theme of ["dark", "light"] as Theme[]) {
      if (theme === "light") {
        // The app's own toggle; dispatchEvent because the open dialog makes the rest of the page inert
        await themeToggle.dispatchEvent("click");
        await page.waitForFunction(() => !document.documentElement.classList.contains("dark"));
      }
      await page.setViewportSize(DESKTOP);
      entries.push(await save(desktopShot, theme, await grab(page, desktopShot, s, theme), now));
      await page.setViewportSize(PHONE);
      entries.push(await save(mobileShot, theme, await grab(page, mobileShot, s, theme), now));
    }
    await themeToggle.dispatchEvent("click");
    await page.setViewportSize(DESKTOP);

    if (dry) {
      await page.getByRole("button", { name: "Cancel" }).click();
      log("dry run: draft captured, issue not created");
    } else {
      await page.locator("[role=dialog] button", { hasText: /^Create issue$/ }).click();
      const done = page.getByText(/Issue #\d+ created/);
      await done.waitFor({ timeout: 120_000 });
      story.issueNumber = Number(((await done.textContent()) || "").match(/#(\d+)/)?.[1]);
      story.issueUrl = await page.getByRole("link", { name: /Open on GitHub/ }).getAttribute("href");
      story.issueCreatedAt = new Date().toISOString();
      log("issue created:", story.issueUrl);
    }
    saveStory();
    saveManifest(entries);
  } catch (err) {
    saveStory();
    saveManifest(entries);
    throw err;
  } finally {
    await context.close();
  }

  // The issue on GitHub, logged out, while it is still open
  if (!dry && story.issueUrl) {
    const s: StoryState = { issueUrl: story.issueUrl as string };
    const now = new Date();
    const shots: ShotEntry[] = [];
    for (const theme of ["dark", "light"] as Theme[]) {
      try {
        shots.push(await capture(browser, GITHUB_ISSUE, theme, s, now));
      } catch (err) {
        log(`!! github-issue ${theme}:`, (err as Error).message.split("\n")[0]);
      }
    }
    if (shots.length) writeManifest(shots);
  }
  void token;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const browser = await chromium.launch({ channel: "chrome" });
try {
  if (flag("list")) {
    for (const shot of SHOTS) console.log(`${shot.name}${shot.variant === "mobile" ? "@mobile" : ""}`);
  } else {
    const token = await ensureLogin(browser);
    const story = arg("story");
    if (story === "create-issue") {
      await storyCreateIssue(browser, token, flag("dry"));
    } else if (story) {
      throw new Error(`unknown story step ${story}`);
    } else {
      const only = arg("only")?.split(",");
      const themes = (arg("themes")?.split(",") ?? ["dark", "light"]) as Theme[];
      const s = await resolveState(token);
      log("state:", JSON.stringify({ ...s, replay: s.replay ? "found" : undefined }));
      const entries: ShotEntry[] = [];
      const failed: string[] = [];
      for (const shot of SHOTS) {
        const label = `${shot.name}${shot.variant === "mobile" ? "@mobile" : ""}`;
        if (only && !only.includes(shot.name) && !only.includes(label)) continue;
        if (shot.needs && !shot.needs(s)) {
          log(`-- ${label}: state not there yet, skipped`);
          continue;
        }
        log(`== ${label}`);
        if (shot.oneLoad && !arg("themes")) {
          try {
            entries.push(...(await captureOneLoad(browser, shot, s, new Date(Date.now() + 30_000))));
          } catch (err) {
            failed.push(label);
            log(`!! ${label}:`, (err as Error).message.split("\n")[0]);
          }
          continue;
        }
        for (const theme of shot.themes ?? themes) {
          // Pinned a little ahead of the capture, so data that arrives while
          // the page loads never reads as "in less than a minute"
          const now = new Date(Date.now() + 30_000);
          try {
            entries.push(await capture(browser, shot, theme, s, now));
          } catch (err) {
            failed.push(`${label} (${theme})`);
            log(`!! ${label} ${theme}:`, (err as Error).message.split("\n")[0]);
          }
        }
      }
      if (entries.length) writeManifest(entries);
      log(`done: ${entries.length} images${failed.length ? `, failed: ${failed.join(", ")}` : ""}`);
      if (failed.length) process.exitCode = 1;
    }
  }
} finally {
  await browser.close();
}
