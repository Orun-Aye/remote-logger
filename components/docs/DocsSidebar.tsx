"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { docsNavigation } from "@/lib/docs/navigation";
import { ChevronDown, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { landingFontClasses } from "@/components/landing/fonts";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function slugToPath(slug: string): string {
  return `/docs/${slug}`;
}

function SidebarNavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const currentSlug = pathname.replace(/^\/docs\/?/, "");

  const toggleSection = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <nav className="flex flex-col gap-1 py-4" aria-label="Documentation">
      {docsNavigation.map((section) => {
        const isCollapsed = collapsed[section.title] ?? false;
        const hasActive = section.items.some((item) => item.slug === currentSlug);

        return (
          <div key={section.title} className="mb-2">
            <button
              type="button"
              onClick={() => toggleSection(section.title)}
              aria-expanded={!isCollapsed}
              className={cn(
                "flex w-full items-center justify-between px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em]",
                "text-text-muted transition-colors duration-150 hover:text-text-secondary",
                hasActive && "text-text-secondary"
              )}
            >
              <span>{section.title}</span>
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform duration-200", isCollapsed && "-rotate-90")}
                aria-hidden="true"
              />
            </button>

            {!isCollapsed && (
              <ul className="mt-0.5 flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const isActive = item.slug === currentSlug;
                  return (
                    <li key={item.slug}>
                      <Link
                        href={slugToPath(item.slug)}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "ml-2 flex items-center gap-2 rounded-md border-l-2 px-3 py-1.5 text-sm transition-colors duration-150",
                          isActive
                            ? "border-l-signal bg-bg-elevated font-medium text-text-primary"
                            : "border-l-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                        )}
                      >
                        {item.title}
                        {item.beta && (
                          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-muted">
                            beta
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/** Desktop sidebar, fixed beside the content below the header */
export function DocsSidebar() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-border-subtle px-2 scrollbar-hide lg:block">
      <SidebarNavContent />
    </aside>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Apperio home">
      <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="text-signal" aria-hidden="true">
        <path
          d="M4 20L4 16L8 12L12 18L18 8L22 14L24 10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="4" cy="20" r="2" fill="currentColor" />
        <circle cx="24" cy="10" r="2" fill="currentColor" />
      </svg>
      <span className="font-display text-[17px] font-semibold tracking-[-0.02em] text-text-primary">
        apperio
      </span>
    </Link>
  );
}

/** Top bar for every docs page, with the way back to the homepage */
export function DocsHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-base/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <Link
            href="/docs/introduction"
            className="rounded border border-border-subtle px-1.5 py-0.5 font-mono text-xs text-text-secondary transition-colors hover:text-text-primary"
          >
            docs
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-4">
          <nav className="hidden items-center gap-5 sm:flex" aria-label="Site">
            <Link href="/" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
              Home
            </Link>
            <Link href="/dashboard" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
              Dashboard
            </Link>
          </nav>
          <ThemeToggle />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="p-2 text-text-secondary transition-colors hover:text-text-primary lg:hidden"
                aria-label="Open documentation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            {/* Portalled out of the .docs wrapper, so it brings the tokens and fonts along */}
            <SheetContent side="left" className={cn("docs w-72 bg-bg-base p-0", landingFontClasses)}>
              <SheetHeader className="border-b border-border-subtle p-4">
                <SheetTitle className="font-display text-text-primary">Documentation</SheetTitle>
              </SheetHeader>
              <div className="flex gap-5 border-b border-border-subtle px-5 py-3 text-sm">
                <Link href="/" onClick={() => setOpen(false)} className="text-text-secondary hover:text-text-primary">
                  Home
                </Link>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="text-text-secondary hover:text-text-primary">
                  Dashboard
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto px-2">
                <SidebarNavContent onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
