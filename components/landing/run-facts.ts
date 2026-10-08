/**
 * Facts from the Demo Shop run that the landing copy quotes: the hero
 * headline, the incident timeline and the hero "last shipped" line.
 *
 * TODO(run): every value below is the PLANNED value. The screenshot session
 * must replace each one with what the real captures show (times from the
 * commit, deploy and error rows, the SHA from the suspect card), then delete
 * this TODO. Durations and the "nine minutes ago" style phrases are computed
 * from the times, so only the times need editing.
 */
export const RUN = {
  /** Day of the run, for "one Thursday afternoon". TODO(run) */
  weekday: "Thursday",
  /** Local time the bad commit was pushed. TODO(run) */
  commitTime: "14:02",
  /** Local time the bad release's deploy was recorded. TODO(run): the scheduler deploys at 14:08, so the recorded time may be 14:08 or 14:09. */
  deployTime: "14:09",
  /** First TypeError captured. TODO(run) */
  errorTime: "14:11",
  /** Group opened, suspects computed. TODO(run) */
  suspectTime: "14:12",
  /** GitHub issue created from the draft. TODO(run) */
  issueTime: "14:13",
  /** Issue closed on GitHub, group resolved. TODO(run): fix deploy at 14:32, close at 14:35. */
  resolvedTime: "14:33",
  /** Release that introduced the bug. TODO(run) */
  badRelease: "v2.4.1",
  /** Release that fixed it. TODO(run) */
  fixRelease: "v2.4.2",
  /** File named in the top stack frame and touched by the bad commit. TODO(run) */
  stackFile: "checkout.js",
} as const;

/**
 * Last thing shipped, for the hero line. Verified: apperio@1.5.0 (session
 * replay) was published to npm on 2026-09-29.
 * TODO(changelog): link to its /changelog entry once the backend's invented
 * seed entries are replaced with real ones.
 */
export const LAST_SHIPPED = {
  date: "2026-09-29",
  item: "Session replay (beta) in apperio 1.5.0",
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesBetween(from: string, to: string): number {
  return toMinutes(to) - toMinutes(from);
}

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty"];

/** 0 to 59 in words, for copy like "Thirty-one minutes". */
export function inWords(n: number): string {
  if (n < 20) return ONES[n] ?? String(n);
  if (n >= 60) return String(n);
  const tens = TENS[Math.floor(n / 10)];
  const ones = n % 10;
  return ones ? `${tens}-${ONES[ones]}` : tens;
}

export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
