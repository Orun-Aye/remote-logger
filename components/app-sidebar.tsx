"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { SignalDot } from "@/components/shared/SignalDot";
import { OrgSwitcher } from "@/components/shared/OrgSwitcher";
import { useProjects } from "@/hooks/project.hooks";
import { useUserAlertStats } from "@/hooks/alerts.hook";
import { useApperioStore } from "@/store/apperio-store";
import { useOrganizationStore } from "@/store/organization-store";
import { useProfile } from "@/hooks/user.hook";

// Helper function to get project status based on health metrics.
// The list endpoint returns flat project objects (not wrapped in Project type).
const getProjectStatus = (project: any): "ok" | "warn" | "danger" | "info" => {
  const healthScore = project?.metrics?.healthScore ?? project?.healthScore;
  if (healthScore !== undefined) {
    if (healthScore < 50) return "danger";
    if (healthScore < 75) return "warn";
    return "ok";
  }
  if (!project?.isActive) return "info";
  return "ok";
};

// Sub-navigation for the active project, grouped the way people work:
// what changed, what broke, how it performs, who used it, and its setup
const projectSubNavGroups = [
  {
    label: "Overview",
    items: [
      { title: "Summary", path: "" },
      { title: "Changes", path: "/changes" },
      { title: "Issues", path: "/issues" },
      { title: "Insights", path: "/insights" },
    ],
  },
  {
    label: "Signals",
    items: [
      { title: "Logs", path: "/logs" },
      { title: "Errors", path: "/errors" },
      { title: "Console", path: "/console" },
      { title: "Network", path: "/network" },
      { title: "Traces", path: "/traces" },
      { title: "Activity Feed", path: "/activity" },
    ],
  },
  {
    label: "Performance",
    items: [
      { title: "Performance", path: "/performance" },
      { title: "Web Vitals", path: "/web-vitals" },
      { title: "Regressions", path: "/regressions" },
      { title: "Environments", path: "/environments" },
    ],
  },
  {
    label: "Users",
    items: [
      { title: "Sessions", path: "/sessions" },
      { title: "Pageviews", path: "/pageviews" },
      { title: "Interactions", path: "/interactions" },
      { title: "Funnels", path: "/funnels" },
    ],
  },
  {
    label: "Configure",
    items: [
      { title: "Alerts", path: "/alerts" },
      { title: "Source Maps", path: "/source-maps" },
      { title: "Settings", path: "/settings" },
    ],
  },
];

/** The mono uppercase label above each group of links. */
function RailLabel({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow px-7 pb-2 pt-5">{children}</div>;
}

/** One rail link: plain text; active gets a grey fill and an ink bar. */
function RailLink({
  href,
  active,
  children,
  trailing,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <SidebarMenuItem>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex h-9 items-center gap-2 pl-7 pr-4 text-sm transition-colors",
          active
            ? "bg-gs-100 text-text-primary font-medium before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-gs-900"
            : "text-text-secondary hover:bg-gs-50 hover:text-text-primary"
        )}
      >
        <span className="truncate">{children}</span>
        {trailing && <span className="ml-auto">{trailing}</span>}
      </Link>
    </SidebarMenuItem>
  );
}

function RailGroup({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SidebarGroup className="p-0">
      <RailLabel>{label}</RailLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0">{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/** A count beside a rail link, in mono. Alerts read in the negative colour. */
function RailCount({ value, tone }: { value: string; tone?: "danger" }) {
  return (
    <span
      className={cn(
        "font-mono text-xs tabular",
        tone === "danger"
          ? "rounded-sm bg-status-danger/10 px-1.5 py-0.5 text-status-danger"
          : "text-text-muted"
      )}
    >
      {value}
    </span>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const currentProjectId = useApperioStore((s) => s.currentProjectId);
  const currentOrgId = useOrganizationStore((s) => s.currentOrgId);

  // Fetch projects
  const { data: projectsResponse } = useProjects({
    includeInactive: false,
  });

  // Fetch user alert statistics
  const { data: alertStats } = useUserAlertStats();

  // Fetch user profile to check platform super admin
  const { data: userProfile } = useProfile();
  const isSuperAdmin = userProfile?.email === "femi@apperio.dev";

  // Calculate active alert count
  const activeAlertCount = alertStats?.data?.active || 0;

  // Extract projectId from URL
  const urlProjectId = useMemo(() => {
    const match = pathname.match(/\/projects\/([^\/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  // Resolve the active project ID (URL takes precedence, then store)
  const activeProjectId = urlProjectId || currentProjectId;

  // Find the active project object from the fetched list.
  // The list endpoint returns flat objects with _id directly on the item.
  const activeProject = useMemo(() => {
    if (!activeProjectId || !projectsResponse?.data) return null;
    return projectsResponse.data.find(
      (p: any) => (p._id ?? p.project?._id) === activeProjectId
    ) || null;
  }, [activeProjectId, projectsResponse?.data]);

  // Check if a top-level navigation item is active
  const isNavActive = (url: string) => {
    if (url === "/dashboard") return pathname === "/dashboard";
    if (url === "/projects") return pathname === "/projects";
    if (url === "/logs") return pathname === "/logs";
    return pathname.startsWith(url);
  };

  // Check if a project sub-nav item is active
  const isSubNavActive = (subPath: string) => {
    if (!activeProjectId) return false;
    const fullPath = `/projects/${activeProjectId}${subPath}`;
    if (subPath === "") {
      // Overview: exact match only
      return pathname === `/projects/${activeProjectId}`;
    }
    return pathname.startsWith(fullPath);
  };

  const projectName =
    activeProject?.name ?? activeProject?.project?.name ?? "Loading…";

  return (
    <Sidebar className="border-r border-border-subtle">
      {/* Wordmark, the same height as the top bar so the rules line up */}
      <SidebarHeader className="h-[52px] shrink-0 flex-row items-center gap-0 border-b border-border-subtle px-5 py-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span aria-hidden className="size-2.5 bg-gs-900" />
          <span className="font-mono text-[13px] font-semibold uppercase tracking-[0.14em] text-text-primary">
            Apperio
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 overflow-x-clip pb-6">
        {/* Organization switcher */}
        <div className="border-b border-border-subtle px-4 py-2">
          <OrgSwitcher />
        </div>

        <RailGroup label="Work">
          <RailLink href="/dashboard" active={isNavActive("/dashboard")}>
            Dashboard
          </RailLink>
          <RailLink
            href="/projects"
            active={isNavActive("/projects")}
            trailing={
              <RailCount value={String(projectsResponse?.data?.length ?? 0)} />
            }
          >
            Projects
          </RailLink>
          <RailLink href="/logs" active={isNavActive("/logs")}>
            Logs
          </RailLink>
          <RailLink
            href="/alerts"
            active={isNavActive("/alerts")}
            trailing={
              activeAlertCount > 0 ? (
                <RailCount value={String(activeAlertCount)} tone="danger" />
              ) : undefined
            }
          >
            Alerts
          </RailLink>
          <RailLink href="/notifications" active={isNavActive("/notifications")}>
            Notifications
          </RailLink>
        </RailGroup>

        {/* Active project (only when a project is selected via URL) */}
        {urlProjectId && (
          <>
            <div className="mx-7 mt-5 border-t border-border-subtle" />
            <Link
              href="/projects"
              className="flex items-center gap-2 px-7 pt-5 text-sm font-medium text-text-primary hover:underline underline-offset-4"
              title="All projects"
            >
              <SignalDot
                status={activeProject ? getProjectStatus(activeProject) : "info"}
                size="sm"
                pulse={false}
              />
              <span className="truncate font-display">{projectName}</span>
            </Link>
            {projectSubNavGroups.map((group) => (
              <RailGroup key={group.label} label={group.label}>
                {group.items.map((item) => (
                  <RailLink
                    key={item.title}
                    href={`/projects/${urlProjectId}${item.path}`}
                    active={isSubNavActive(item.path)}
                  >
                    {item.title}
                  </RailLink>
                ))}
              </RailGroup>
            ))}
            <div className="mx-7 mt-5 border-t border-border-subtle" />
          </>
        )}

        {/* Organization (shown when user has an org selected) */}
        {currentOrgId && (
          <RailGroup label="Organization">
            {[
              { title: "General", url: "/organization/general" },
              { title: "Members", url: "/organization/members" },
              { title: "Teams", url: "/organization/teams" },
              { title: "Audit Log", url: "/organization/audit-log" },
            ].map((item) => (
              <RailLink
                key={item.title}
                href={item.url}
                active={pathname.startsWith(item.url)}
              >
                {item.title}
              </RailLink>
            ))}
          </RailGroup>
        )}

        <RailGroup label="Account">
          <RailLink href="/integrations" active={pathname.startsWith("/integrations")}>
            Integrations
          </RailLink>
          <RailLink href="/billing" active={pathname.startsWith("/billing")}>
            Billing
          </RailLink>
          <RailLink href="/settings" active={pathname.startsWith("/settings")}>
            Settings
          </RailLink>
          <RailLink href="/docs" active={pathname.startsWith("/docs")}>
            SDK Docs
          </RailLink>
        </RailGroup>

        {/* Admin (platform super admin only) */}
        {isSuperAdmin && (
          <RailGroup label="Admin">
            {[
              { title: "Overview", url: "/admin" },
              { title: "Users", url: "/admin/users" },
              { title: "Organizations", url: "/admin/organizations" },
              { title: "System", url: "/admin/system" },
              { title: "Waitlist", url: "/admin/waitlist" },
            ].map((item) => (
              <RailLink
                key={item.title}
                href={item.url}
                active={
                  item.url === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.url)
                }
              >
                {item.title}
              </RailLink>
            ))}
          </RailGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
