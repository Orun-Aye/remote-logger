"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#comparison", label: "Compare" },
  { href: "#faq", label: "FAQ" },
  { href: "/docs", label: "Docs" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ${
        scrolled || mobileOpen
          ? "backdrop-blur-md backdrop-saturate-150 border-b border-border-faint"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            className="text-signal"
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
          <span className="font-display font-semibold text-lg text-text-primary tracking-[-0.02em]">
            apperio
          </span>
        </Link>

        {/* Nav Links — Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTA Group — Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Button variant="signal" size="sm" asChild>
            <a href="#waitlist">Join Waitlist</a>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-text-secondary hover:text-text-primary"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border-faint">
          <div className="px-6 py-4 space-y-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block text-sm text-text-secondary hover:text-text-primary py-2"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3 space-y-2 border-t border-border-faint">
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-text-secondary">Theme</span>
                <ThemeToggle />
              </div>
              <Button variant="signal" className="w-full justify-center" asChild>
                <a href="#waitlist" onClick={() => setMobileOpen(false)}>Join Waitlist</a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
