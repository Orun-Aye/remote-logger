import { findDocBySlug } from "@/lib/docs/navigation";
import { DocsContent } from "./DocsContent";
import { DocsTableOfContents, type TocItem } from "./DocsTableOfContents";

/**
 * One docs page: title, description and beta label come from
 * lib/docs/navigation.ts so the sidebar and the page header never disagree.
 */
export function DocPage({
  slug,
  toc,
  title,
  children,
}: {
  slug: string;
  toc: TocItem[];
  /** Overrides the sidebar title when the page heading should be longer */
  title?: string;
  children: React.ReactNode;
}) {
  const doc = findDocBySlug(slug);
  if (!doc) throw new Error(`Docs page "${slug}" is missing from lib/docs/navigation.ts`);

  return (
    <div className="flex">
      <DocsContent
        slug={slug}
        title={title ?? doc.title}
        description={doc.description}
        beta={doc.beta}
      >
        {children}
      </DocsContent>
      <DocsTableOfContents items={toc} />
    </div>
  );
}
