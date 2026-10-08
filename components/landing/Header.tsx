"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#product", label: "Product" },
  { href: "#build-log", label: "Build log" },
  { href: "#faq", label: "FAQ" },
  { href: "/docs", label: "Docs" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Apperio home">
      <svg
        width="26"
        height="26"
        viewBox="0 0 28 28"
        fill="none"
        className="text-signal"
        aria-hidden="true"
      >
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

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[1000] border-b transition-[background-color,border-color] duration-200",
        scrolled || mobileOpen
          ? "border-border-subtle bg-bg-void/90 backdrop-blur-md"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-text-secondary transition-colors duration-150 hover:text-text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Button variant="signal" size="sm" className="signal-fill shadow-none hover:translate-y-0" asChild>
            <a href="#waitlist">Join waitlist</a>
          </Button>
        </div>

        <button
          className="p-2 text-text-secondary hover:text-text-primary md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border-subtle md:hidden">
          <div className="space-y-1 px-4 py-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-2 text-sm text-text-secondary hover:text-text-primary"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-2 space-y-3 border-t border-border-subtle pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Theme</span>
                <ThemeToggle />
              </div>
              <Button
                variant="signal"
                className="signal-fill w-full justify-center shadow-none hover:translate-y-0"
                asChild
              >
                <a href="#waitlist" onClick={() => setMobileOpen(false)}>
                  Join waitlist
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
