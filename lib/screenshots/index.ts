/**
 * Landing page screenshot contract.
 *
 * The screenshot session (`npm run screenshots`) captures the real Demo Shop
 * project and overwrites `manifest.json`; the landing page only reads it. Images
 * live in `public/screenshots/{dark,light}/<name>.webp`, mobile crops are
 * `<name>@mobile.webp`, clips live in `public/videos/`.
 */
import manifestJson from "./manifest.json";

export type ShotTheme = "dark" | "light";
export type ShotVariant = "desktop" | "mobile";

export interface ShotEntry {
  name: string;
  variant: ShotVariant;
  theme: ShotTheme;
  src: string;
  /** Intrinsic pixel size of the file. */
  width: number;
  height: number;
  alt: string;
  /** ISO timestamp of the capture. */
  capturedAt: string;
  /** Device scale factor of the capture. Defaults to 2. */
  dpr?: number;
}

export interface ClipEntry {
  name: string;
  theme: ShotTheme;
  mp4: string;
  webm?: string;
  poster: string;
  width: number;
  height: number;
  alt: string;
  capturedAt?: string;
}

export interface ScreenshotManifest {
  generatedAt: string | null;
  shots: ShotEntry[];
  clips: ClipEntry[];
}

/** Both themes of one shot. A shot captured in one theme only fills both. */
export interface ThemedShot {
  dark: ShotEntry;
  light: ShotEntry;
}

export interface ThemedClip {
  dark: ClipEntry;
  light: ClipEntry;
}

// Through unknown: the JSON's inferred types (plain strings, empty arrays)
// change every time the screenshot run rewrites the file.
export const manifest = manifestJson as unknown as ScreenshotManifest;

const DEFAULT_DPR = 2;

export function getShot(
  name: string,
  variant: ShotVariant = "desktop"
): ThemedShot | null {
  const matches = manifest.shots.filter(
    (s) => s.name === name && s.variant === variant
  );
  const dark = matches.find((s) => s.theme === "dark");
  const light = matches.find((s) => s.theme === "light");
  if (!dark && !light) return null;
  return { dark: (dark ?? light)!, light: (light ?? dark)! };
}

export function getClip(name: string): ThemedClip | null {
  const matches = manifest.clips.filter((c) => c.name === name);
  const dark = matches.find((c) => c.theme === "dark");
  const light = matches.find((c) => c.theme === "light");
  if (!dark && !light) return null;
  return { dark: (dark ?? light)!, light: (light ?? dark)! };
}

/** Width in CSS pixels at which the capture shows its UI at 1:1. */
export function naturalWidth(shot: ShotEntry): number {
  return Math.round(shot.width / (shot.dpr ?? DEFAULT_DPR));
}

/** `2026-10-08` from the capture timestamp, for the provenance caption. */
export function captureDate(shot: ShotEntry): string {
  return shot.capturedAt.slice(0, 10);
}

// ─── Expected shots ──────────────────────────────────────────────────────────
// Every shot the landing page renders (PLAN.md section 7). `aspect` and
// `cssWidth` size the placeholder until the real capture exists, and tell the
// capture run what each slot is laid out for: a shot is shown at most at its
// natural width (pixel width / dpr), and it should not need to shrink much
// below `cssWidth` or its UI text gets too small to read.

export const EXPECTED_SHOTS: Record<
  string,
  { aspect: number; cssWidth: number; mobile?: boolean }
> = {
  "suspect-commit": { aspect: 3 / 2, cssWidth: 840, mobile: true },
  "error-group-header": { aspect: 16 / 5, cssWidth: 840, mobile: true },
  "commit-card": { aspect: 4 / 1, cssWidth: 760, mobile: true },
  "commit-explained": { aspect: 16 / 9, cssWidth: 760 },
  "deploy-verdicts": { aspect: 2 / 1, cssWidth: 760, mobile: true },
  "deploy-impact": { aspect: 4 / 3, cssWidth: 420, mobile: true },
  "chart-deploy-markers": { aspect: 16 / 7, cssWidth: 840 },
  "issue-draft": { aspect: 3 / 2, cssWidth: 760, mobile: true },
  "github-issue": { aspect: 16 / 9, cssWidth: 840 },
  "resolved-via-github": { aspect: 6 / 1, cssWidth: 840, mobile: true },
  "alert-in-app": { aspect: 4 / 5, cssWidth: 380, mobile: true },
  "web-vitals": { aspect: 3 / 1, cssWidth: 760, mobile: true },
  "ai-root-cause": { aspect: 16 / 9, cssWidth: 760 },
  "pii-redacted-log": { aspect: 4 / 3, cssWidth: 420, mobile: true },
  "session-replay": { aspect: 16 / 10, cssWidth: 900 },
  "captured-error": { aspect: 4 / 3, cssWidth: 640, mobile: true },
  "github-app-card": { aspect: 2 / 1, cssWidth: 420, mobile: true },
  "latest-changes": { aspect: 4 / 3, cssWidth: 420, mobile: true },
};

/** Expected shots with no desktop capture in the manifest. */
export function missingShots(): string[] {
  return Object.keys(EXPECTED_SHOTS).filter((name) => !getShot(name));
}

/**
 * A missing shot renders a framed placeholder in development only. In a
 * production build it renders nothing, so the page can ship with any subset
 * of the captures and never shows an empty frame.
 */
export const SHOW_PLACEHOLDERS = process.env.NODE_ENV !== "production";

/**
 * Whether `<ProductShot name>` renders anything: the shot is in the manifest,
 * or this build shows placeholders. Wrappers check this so a collapsed shot
 * leaves no margin or empty column behind.
 */
export function shotRenders(name: string): boolean {
  return SHOW_PLACEHOLDERS || getShot(name) !== null;
}

let warned = false;

/**
 * Logs the missing shots once per server process, so `next dev` and
 * `next build` both say which slots are placeholders (dev) or collapsed
 * (production).
 */
export function warnMissingShots(): void {
  if (warned) return;
  warned = true;
  const missing = missingShots();
  if (missing.length === 0) return;
  const effect = SHOW_PLACEHOLDERS
    ? "rendering placeholders"
    : "collapsing their slots in this production build";
  console.warn(
    `[screenshots] ${missing.length} landing shot(s) missing from lib/screenshots/manifest.json, ${effect}: ${missing.join(", ")}`
  );
}
