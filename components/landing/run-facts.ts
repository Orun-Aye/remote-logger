/**
 * Facts from the Demo Shop run that the landing copy quotes in the hero
 * headline.
 *
 * All from the run on Thursday 2026-10-08 (Africa/Lagos, UTC+1), project
 * "Coffee Kit Shop", repo Orun-Aye/apperio-demo-shop on branch demo-3, read
 * back from the API and the captures.
 */
export const RUN = {
  /** Day of the run, for "one Thursday night". */
  weekday: "Thursday",
  /** Part of the day the bad commit went out, for the same line. */
  dayPart: "night",
  /** Bad commit f01bc1d pushed (committed 23:02:04, webhook in at 23:02:12). */
  commitTime: "23:02",
  /** v2.4.1 deploy recorded through the deploy API at 23:08:41. */
  deployTime: "23:08",
  /** The first shopper's browser threw the TypeError at 23:12:59 (the SDK's timestamp on the captured error). */
  brokeTime: "23:12",
  /** Apperio ingested and grouped that error at 23:13:05, and notified the owner. */
  errorTime: "23:13",
  /** Group opened at 23:13:24, suspects computed at 23:13:34. */
  suspectTime: "23:13",
  /** GitHub issue #1 created from the AI draft at 23:14:16. */
  issueTime: "23:14",
  /** Issue #1 closed on GitHub at 23:42:45, group resolved via GitHub at 23:42:47. */
  resolvedTime: "23:42",
  /** Release that introduced the bug. */
  badRelease: "v2.4.1",
  /** Release that fixed it (deployed 23:32:30). */
  fixRelease: "v2.4.2",
  /** File named in the top stack frame and touched by the bad commit. */
  stackFile: "checkout.js",
} as const;

