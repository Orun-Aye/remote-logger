// Everything the SDK drops into, and everywhere Apperio can push a signal back
// out to. These are supported surfaces, not customer logos. "Pushes to" lists
// only what alerts and owner notifications actually reach today: alert rules
// send email, Slack, webhooks and GitHub issues (alert.service.ts). Discord,
// Teams, Linear, Jira and PagerDuty connect on the integrations page but
// nothing routes alerts to them yet, so they stay off until something does.
const RUNS_IN = [
  "React",
  "Next.js",
  "Vue",
  "Svelte",
  "Angular",
  "Node.js",
  "Express",
  "Remix",
  "Astro",
  "Vanilla JS",
];

const PUSHES_TO = ["GitHub", "Slack", "Email", "Webhooks"];

function Row({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
      <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
        {label}
      </span>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm text-text-secondary">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StackStrip() {
  return (
    <section
      aria-label="Supported frameworks and integrations"
      className="border-y border-border-subtle bg-bg-surface py-7"
    >
      <div className="mx-auto max-w-[1200px] space-y-3 px-4 sm:px-6">
        <Row label="Runs in" items={RUNS_IN} />
        <Row label="Pushes to" items={PUSHES_TO} />
      </div>
    </section>
  );
}
