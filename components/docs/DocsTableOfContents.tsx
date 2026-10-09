"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  title: string;
  level: 2 | 3;
}

interface DocsTableOfContentsProps {
  items: TocItem[];
}

export function DocsTableOfContents({ items }: DocsTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible heading
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="hidden xl:block w-56 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide py-10 pr-4">
      <p className="mb-3 px-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
        On this page
      </p>
      <nav aria-label="Table of contents">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  "block text-xs py-1 px-3 rounded transition-colors duration-150",
                  item.level === 3 && "ml-3",
                  activeId === item.id
                    ? "text-text-primary font-medium"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
