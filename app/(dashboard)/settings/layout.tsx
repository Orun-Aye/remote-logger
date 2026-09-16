"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, Lock, Heart, Key, Shield, ShieldCheck, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsTabs = [
  { name: "Profile", href: "/settings", icon: User },
  { name: "Password", href: "/settings/password", icon: Lock },
  { name: "Security", href: "/settings/security", icon: ShieldCheck },
  { name: "Preferences", href: "/settings/preferences", icon: Heart },
  { name: "Integrations", href: "/settings/integrations", icon: Plug },
  { name: "API Tokens", href: "/settings/tokens", icon: Key },
  { name: "Privacy & Data", href: "/settings/privacy", icon: Shield },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Left sidebar navigation */}
      <nav className="w-1/5.5 shrink-0 border-r border-border-subtle space-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4 px-3">
          Settings
        </h2>
        {settingsTabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/settings" && pathname.startsWith(tab.href));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5  text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-signal/10 text-signal border-l-2 border-signal"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.name}
            </Link>
          );
        })}
      </nav>

      {/* Content area */}
      <div className="flex-1 p-8 overflow-auto">{children}</div>
    </div>
  );
}
