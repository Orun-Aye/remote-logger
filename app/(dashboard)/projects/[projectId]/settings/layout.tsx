"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  Users,
  Key,
  Code2,
  Shield,
  BarChart3,
  Clock,
  Link2,
  Bell,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const projectSettingsTabs = [
  {
    name: "General",
    href: (pid: string) => `/projects/${pid}/settings`,
    icon: Settings,
  },
  {
    name: "Team",
    href: (pid: string) => `/projects/${pid}/settings/team`,
    icon: Users,
  },
  {
    name: "API Key",
    href: (pid: string) => `/projects/${pid}/settings/api-key`,
    icon: Key,
  },
  {
    name: "SDK Config",
    href: (pid: string) => `/projects/${pid}/settings/sdk-config`,
    icon: Code2,
  },
  {
    name: "Rate Limit",
    href: (pid: string) => `/projects/${pid}/settings/rate-limit`,
    icon: Shield,
  },
  {
    name: "Sampling",
    href: (pid: string) => `/projects/${pid}/settings/sampling`,
    icon: BarChart3,
  },
  {
    name: "Retention",
    href: (pid: string) => `/projects/${pid}/settings/retention`,
    icon: Clock,
  },
  {
    name: "Notifications",
    href: (pid: string) => `/projects/${pid}/settings/notifications`,
    icon: Bell,
  },
  {
    name: "Integrations",
    href: (pid: string) => `/projects/${pid}/settings/integrations`,
    icon: Link2,
  },
];

export default function ProjectSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams<{ projectId: string }>();
  const projectId =
    typeof params?.projectId === "string" ? params.projectId : "";

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Left sidebar navigation */}
      <nav className="w-1/5.5 shrink-0 border-r border-border-subtle  p-4 space-y-1">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="w-full justify-start text-text-muted hover:text-text-primary hover:bg-bg-elevated mb-3"
        >
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Link>
        </Button>

        <div className="border-b border-border-subtle mb-3 pb-1" />

        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4 px-3">
          Project Settings
        </h2>

        {projectSettingsTabs.map((tab) => {
          const tabHref = tab.href(projectId);
          const isActive =
            pathname === tabHref ||
            (tabHref !== `/projects/${projectId}/settings` &&
              pathname.startsWith(tabHref));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              href={tabHref}
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
