import Link from "next/link";

const PRINCIPLES = [
  "Every error, log and slow request lands in one place.",
  "Each issue is tied to the change that caused it.",
  "Insights cite the events behind every statement.",
];

/** The left column of the auth pages: wordmark, statement, three principles. */
export function AuthBrandPanel() {
  return (
    <div className="flex h-full w-full flex-col border-r border-border-subtle bg-gs-50 px-10 py-14 xl:px-14">
      <Link href="/" className="inline-flex items-center gap-2.5 self-start">
        <span aria-hidden className="size-2.5 bg-gs-900" />
        <span className="font-mono text-[13px] font-semibold uppercase tracking-[0.14em] text-text-primary">
          Apperio
        </span>
      </Link>

      <div className="flex flex-1 flex-col justify-center">
        <p className="eyebrow">Observability · Error tracking · Session replay</p>
        <h2 className="mt-6 max-w-xl font-display text-[44px] leading-[1.12] text-text-primary">
          One record of your application, across every release it ships.
        </h2>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-text-secondary">
          Logs, errors, performance and sessions as sections of one system.
          What broke, when, and which change did it.
        </p>
        <ol className="mt-8 max-w-xl space-y-3 border-t border-border-subtle pt-6">
          {PRINCIPLES.map((line, i) => (
            <li key={line} className="flex gap-4 text-[15px] text-text-primary">
              <span className="font-mono text-sm text-text-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              {line}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
