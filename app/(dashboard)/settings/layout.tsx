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
    <div className="flex items-stretch">
      {/* Left sidebar navigation */}
      <nav className="w-52 shrink-0 border-r border-border-subtle pr-4 space-y-0.5">
        <h2 className="eyebrow mb-3 px-3">
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
                "flex items-center gap-2.5 px-3 h-9 text-sm transition-colors [&_svg]:hidden",
                isActive
                  ? "bg-gs-100 text-text-primary font-medium shadow-[inset_2px_0_0_var(--gs-900)]"
                  : "text-text-secondary hover:text-text-primary hover:bg-gs-50"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.name}
            </Link>
          );
        })}
      </nav>

      {/* Content area */}
      <div className="min-w-0 flex-1 overflow-auto pl-8 lg:pl-10">{children}</div>
    </div>
  );
}
