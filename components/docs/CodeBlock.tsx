import { cn } from "@/lib/utils";
import { highlightCode, resolveLanguage } from "@/lib/docs/highlight";
import { CopyButton } from "./CopyButton";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
  showLineNumbers?: boolean;
}

const languageLabels: Record<string, string> = {
  typescript: "TypeScript",
  tsx: "TSX",
  javascript: "JavaScript",
  json: "JSON",
  shellscript: "Terminal",
  yaml: "YAML",
  html: "HTML",
  http: "HTTP",
  text: "Text",
};

/** Drop the blank lines a template literal starts and ends with. */
function tidy(code: string): string {
  return code.replace(/^\s*\n/, "").replace(/\s+$/, "");
}

/**
 * A highlighted code sample. Server component: Shiki runs when the page is
 * built, so readers get plain HTML and only the copy button hydrates.
 */
export async function CodeBlock({
  code,
  language,
  filename,
  className,
  showLineNumbers = false,
}: CodeBlockProps) {
  const source = tidy(code);
  const html = await highlightCode(source, language);
  const label = filename ?? languageLabels[resolveLanguage(language)];

  return (
    <figure
      className={cn(
        "docs-code my-5 overflow-hidden rounded-lg border border-border-subtle bg-[var(--code-bg)]",
        className
      )}
      data-line-numbers={showLineNumbers ? "" : undefined}
    >
      <figcaption className="flex h-9 items-center justify-between gap-3 border-b border-border-subtle bg-[var(--code-header)] pl-4 pr-2">
        <span className="truncate font-mono text-xs text-text-muted">{label}</span>
        <CopyButton code={source} />
      </figcaption>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
}

/** Inline code span for use within paragraphs */
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-border-subtle bg-[var(--code-bg)] px-1.5 py-0.5 font-mono text-[0.85em] text-text-primary [overflow-wrap:anywhere]">
      {children}
    </code>
  );
}
