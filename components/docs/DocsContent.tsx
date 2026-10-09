import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAdjacentDocs } from "@/lib/docs/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface DocsContentProps {
  slug: string;
  title: string;
  description?: string;
  /** Marks a feature that works but is still changing */
  beta?: boolean;
  children: React.ReactNode;
}

/** Main content wrapper with consistent typography, title, and prev/next navigation */
export function DocsContent({
  slug,
  title,
  description,
  beta = false,
  children,
}: DocsContentProps) {
  const { prev, next } = getAdjacentDocs(slug);

  return (
    <article className="mx-auto min-w-0 max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <header className="mb-8 border-b border-border-subtle pb-6">
        <h1 className="mb-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold tracking-[-0.02em] text-text-primary">
          {title}
          {beta && <BetaBadge />}
        </h1>
        {description && (
          <p className="text-lg leading-relaxed text-text-secondary">{description}</p>
        )}
      </header>

      <div className="docs-prose">{children}</div>

      {/* Prev / Next navigation */}
      <footer className="mt-16 border-t border-border-subtle pt-6">
        <div className="flex items-center justify-between gap-4">
          {prev ? (
            <Link
              href={`/docs/${prev.slug}`}
              className="group flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <div className="text-left">
                <div className="text-xs text-text-muted">Previous</div>
                <div className="font-medium">{prev.title}</div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {next ? (
            <Link
              href={`/docs/${next.slug}`}
              className="group flex items-center gap-2 text-right text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <div>
                <div className="text-xs text-text-muted">Next</div>
                <div className="font-medium">{next.title}</div>
              </div>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </footer>
    </article>
  );
}

/* ─── Reusable doc typography primitives ────────────────────────────────── */

export function BetaBadge() {
  return (
    <span className="rounded-full border border-border-accent px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-[0.06em] text-text-secondary">
      Beta
    </span>
  );
}

export function DocH2({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="mb-4 mt-12 scroll-mt-24 font-display text-xl font-semibold tracking-[-0.01em] text-text-primary"
    >
      {children}
    </h2>
  );
}

export function DocH3({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h3
      id={id}
      className="mb-3 mt-8 scroll-mt-24 text-lg font-semibold text-text-primary"
    >
      {children}
    </h3>
  );
}

export function DocP({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 leading-7 text-text-secondary">{children}</p>;
}

export function DocUl({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mb-4 list-outside list-disc space-y-1.5 pl-5 leading-7 text-text-secondary">
      {children}
    </ul>
  );
}

export function DocOl({ children }: { children: React.ReactNode }) {
  return (
    <ol className="mb-4 list-outside list-decimal space-y-1.5 pl-5 leading-7 text-text-secondary">
      {children}
    </ol>
  );
}

export function DocLi({ children }: { children: React.ReactNode }) {
  return <li className="pl-1">{children}</li>;
}

export function DocStrong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-text-primary">{children}</strong>;
}

export function DocLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const isExternal = href.startsWith("http");
  return (
    <Link
      href={href}
      className="text-signal underline decoration-1 underline-offset-[3px] hover:decoration-2"
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </Link>
  );
}

/** A callout / alert box */
export function DocCallout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "warning" | "danger" | "tip";
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-l-signal bg-signal-muted",
    warning: "border-l-status-warn bg-status-warn/5",
    danger: "border-l-status-danger bg-status-danger/5",
    tip: "border-l-border-accent bg-bg-elevated",
  };

  const labels = {
    info: "Note",
    warning: "Warning",
    danger: "Important",
    tip: "Tip",
  };

  return (
    <div className={cn("my-5 rounded-r-md border-l-4 p-4", styles[type])}>
      <p className="mb-1 text-sm font-semibold text-text-primary">{title || labels[type]}</p>
      <div className="text-sm leading-relaxed text-text-secondary [&>p+p]:mt-2">{children}</div>
    </div>
  );
}

/**
 * Table wrapper for consistent styling. Tables with three or more columns keep
 * a minimum width and scroll inside their box on phones, rather than squeezing
 * option names until they break mid-word.
 */
export function DocTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  const wide = headers.length > 2;
  return (
    <div
      className="my-5 overflow-x-auto rounded-lg border border-border-subtle focus-visible:outline-2 focus-visible:outline-signal"
      // A box that can scroll must be reachable from the keyboard
      tabIndex={wide ? 0 : undefined}
    >
      <table
        className={cn(
          "docs-table w-full text-sm",
          wide && "docs-table-wide",
          wide && (headers.length > 3 ? "min-w-[46rem]" : "min-w-[36rem]")
        )}
      >
        <thead>
          <tr className="border-b border-border-subtle bg-bg-elevated">
            {headers.map((header, i) => (
              <th
                key={i}
                scope="col"
                className="whitespace-nowrap px-4 py-2.5 text-left font-semibold text-text-primary"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border-faint align-top last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 leading-6 text-text-secondary">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** HTTP method badge */
export function MethodBadge({ method }: { method: string }) {
  return (
    <span className="inline-block rounded border border-border-accent bg-bg-elevated px-2 py-0.5 font-mono text-xs font-semibold text-text-primary">
      {method.toUpperCase()}
    </span>
  );
}

/** Endpoint display */
export function EndpointBlock({
  method,
  path,
  description,
}: {
  method: string;
  path: string;
  description?: string;
}) {
  return (
    <div className="my-4 flex items-start gap-3 rounded-lg border border-border-subtle bg-bg-surface p-3">
      <MethodBadge method={method} />
      <div className="min-w-0">
        <code className="break-all font-mono text-sm text-text-primary">{path}</code>
        {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
      </div>
    </div>
  );
}
