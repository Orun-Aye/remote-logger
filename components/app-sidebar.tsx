"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Folder,
  AlertTriangle,
  Settings,
  Code,
  LogOut,
  ScrollText,
  Bug,
  Gauge,
  Activity,
  Users,
  Radio,
  GitBranch,
  Filter,
  TrendingDown,
  Globe,
  FileCode,
  ChevronRight,
  Wifi,
  MousePointerClick,
  Eye,
  Terminal,
  Lightbulb,
  Shield,
  BarChart3,
  Building2,
  Server,
  UsersRound,
  CreditCard,
  Plug,
  Mail,
  GitCommitHorizontal,
  CircleDot,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { SignalDot } from "@/components/shared/SignalDot";
import { OrgSwitcher } from "@/components/shared/OrgSwitcher";
import { useProjects } from "@/hooks/project.hooks";
import { useUserAlertStats } from "@/hooks/alerts.hook";
import { useApperioStore, useBetaAccess } from "@/store/apperio-store";
import { useOrganizationStore } from "@/store/organization-store";
import { useProfile } from "@/hooks/user.hook";
import { Lock } from "lucide-react";

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

// Sub-navigation items for the active project section
const projectSubNavItems = [
  { title: "Overview", path: "", icon: LayoutDashboard, advanced: false },
  { title: "Changes", path: "/changes", icon: GitCommitHorizontal, advanced: false },
  { title: "Issues", path: "/issues", icon: CircleDot, advanced: false },
  { title: "Logs", path: "/logs", icon: ScrollText, advanced: false },
  { title: "Errors", path: "/errors", icon: Bug, advanced: false },
  { title: "Performance", path: "/performance", icon: Gauge, advanced: false },
  { title: "Web Vitals", path: "/web-vitals", icon: Activity, advanced: true },
  { title: "Network", path: "/network", icon: Wifi, advanced: true },
  { title: "Interactions", path: "/interactions", icon: MousePointerClick, advanced: true },
  { title: "Pageviews", path: "/pageviews", icon: Eye, advanced: true },
  { title: "Console", path: "/console", icon: Terminal, advanced: false },
  { title: "Sessions", path: "/sessions", icon: Users, advanced: true },
  { title: "Activity Feed", path: "/activity", icon: Radio, advanced: false },
  { title: "Traces", path: "/traces", icon: GitBranch, advanced: true },
  { title: "Funnels", path: "/funnels", icon: Filter, advanced: true },
  { title: "Regressions", path: "/regressions", icon: TrendingDown, advanced: true },
  { title: "Environments", path: "/environments", icon: Globe, advanced: true },
  { title: "Insights", path: "/insights", icon: Lightbulb, advanced: true },
  { title: "Alerts", path: "/alerts", icon: AlertTriangle, advanced: false },
  { title: "Source Maps", path: "/source-maps", icon: FileCode, advanced: true },
  { title: "Settings", path: "/settings", icon: Settings, advanced: false },
];

export function AppSidebar() {
  const router = useRouter();
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
  const { betaTier } = useBetaAccess();
  const isCoreTier = betaTier === "core";

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

  // Primary navigation items
  const navigationItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      badge: undefined as string | undefined,
      badgeVariant: undefined as "destructive" | undefined,
      advanced: false,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Folder,
      badge: projectsResponse?.data?.length?.toString() || "0",
      badgeVariant: undefined as "destructive" | undefined,
      advanced: false,
    },
    {
      title: "Logs",
      url: "/logs",
      icon: ScrollText,
      badge: undefined as string | undefined,
      badgeVariant: undefined as "destructive" | undefined,
      advanced: false,
    },
    {
      title: "Alerts",
      url: "/alerts",
      icon: AlertTriangle,
      badge: activeAlertCount > 0 ? activeAlertCount.toString() : undefined,
      badgeVariant: "destructive" as "destructive" | undefined,
      advanced: false,
    },
  ];

  // Check if a top-level navigation item is active
  const isNavActive = (url: string) => {
    if (url === "/dashboard") return pathname === "/dashboard";
    if (url === "/projects") return pathname === "/projects";
    if (url === "/logs") return pathname === "/logs";
    if (url === "/alerts") return pathname === "/alerts";
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

  const clearAllCookies = () => {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name =
        eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  };

  const handleLogout = async () => {
    try {
      clearAllCookies();
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch {}
    router.replace("/login");
  };

  return (
    <Sidebar className="border-r border-border-subtle">
      {/* Header / Logo */}
      <SidebarHeader className="border-b border-border-subtle">
        <div className="flex items-center space-x-2.5">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            className="text-signal shrink-0"
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
          <div>
            <h2 className="font-display font-semibold text-lg tracking-[-0.02em]">
              Apperio
            </h2>
            <p className="text-xs text-text-muted">Developer Console</p>
          </div>
        </div>
        {/* Organization Switcher */}
        <div className="mt-2 pt-2 border-t border-border-subtle/50">
          <OrgSwitcher />
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-x-clip">
        {/* Section 1: Primary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-text-muted uppercase text-[11px] tracking-wider font-display">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const active = isNavActive(item.url);
                const isLocked = item.advanced && isCoreTier;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={
                        active
                          ? "bg-signal/10 text-signal font-medium border-l-2 border-signal"
                          : isLocked
                          ? "text-text-secondary/50 hover:text-text-secondary hover:bg-bg-elevated/30"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50"
                      }
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                        {isLocked && (
                          <Lock className="ml-auto w-3.5 h-3.5 text-text-muted/40" />
                        )}
                        {!isLocked && item.badge && (
                          <Badge
                            variant={item.badgeVariant || "secondary"}
                            className="ml-auto text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Section 2: Active Project (only when a project is selected via URL) */}
        {urlProjectId && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-text-muted uppercase text-[11px] tracking-wider font-display">
                Active Project
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Project selector header */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="text-text-primary hover:bg-bg-elevated/50 font-medium"
                    >
                      <Link
                        href="/projects"
                        className="flex items-center gap-2"
                      >
                        <SignalDot
                          status={activeProject ? getProjectStatus(activeProject) : "info"}
                          size="sm"
                          pulse={activeProject ? getProjectStatus(activeProject) !== "info" : false}
                        />
                        <span className="truncate font-display text-sm">
                          {activeProject?.name ?? activeProject?.project?.name ?? "Loading..."}
                        </span>
                        <ChevronRight className="ml-auto w-3.5 h-3.5 text-text-muted" />
                      </Link>
                    </SidebarMenuButton>

                    {/* 14 sub-nav items */}
                    <SidebarMenuSub>
                      {projectSubNavItems.map((subItem) => {
                        const subActive = isSubNavActive(subItem.path);
                        const href = `/projects/${urlProjectId}${subItem.path}`;
                        const isLocked = subItem.advanced && isCoreTier;
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={subActive}
                              className={
                                subActive
                                  ? "text-signal font-medium"
                                  : isLocked
                                  ? "text-text-muted/50 hover:text-text-muted"
                                  : "text-text-muted hover:text-text-primary"
                              }
                            >
                              <Link href={href}>
                                <subItem.icon className="w-3.5 h-3.5" />
                                <span>{subItem.title}</span>
                                {isLocked && (
                                  <Lock className="ml-auto w-3 h-3 text-text-muted/40" />
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <SidebarSeparator />

        {/* Section 3: Admin (only for admin users) */}
        {isSuperAdmin && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-text-muted uppercase text-[11px] tracking-wider font-display">
                Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[
                    { title: "Overview", url: "/admin", icon: BarChart3 },
                    { title: "Users", url: "/admin/users", icon: Users },
                    { title: "Organizations", url: "/admin/organizations", icon: Building2 },
                    { title: "System", url: "/admin/system", icon: Server },
                    { title: "Waitlist", url: "/admin/waitlist", icon: Mail },
                  ].map((item) => {
                    const active =
                      item.url === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.url);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className={
                            active
                              ? "bg-signal/10 text-signal font-medium border-l-2 border-signal"
                              : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50"
                          }
                        >
                          <Link href={item.url}>
                            {item.url === "/admin" && !active ? (
                              <Shield className="w-4 h-4" />
                            ) : (
                              <item.icon className="w-4 h-4" />
                            )}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}

        {/* Section 4: Footer links (SDK Docs, Settings) */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-text-muted uppercase text-[11px] tracking-wider font-display">
            Resources
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/sdk")}
                  className={
                    pathname.startsWith("/sdk")
                      ? "bg-signal/10 text-signal font-medium border-l-2 border-signal"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50"
                  }
                >
                  <Link href="/sdk">
                    <Code className="w-4 h-4" />
                    <span>SDK Docs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/billing")}
                  className={
                    pathname.startsWith("/billing")
                      ? "bg-signal/10 text-signal font-medium border-l-2 border-signal"
                      : isCoreTier
                      ? "text-text-secondary/50 hover:text-text-secondary hover:bg-bg-elevated/30"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50"
                  }
                >
                  <Link href="/billing">
                    <CreditCard className="w-4 h-4" />
                    <span>Billing</span>
                    {isCoreTier && <Lock className="ml-auto w-3.5 h-3.5 text-text-muted/40" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/integrations")}
                  className={
                    pathname.startsWith("/integrations")
                      ? "bg-signal/10 text-signal font-medium border-l-2 border-signal"
                      : isCoreTier
                      ? "text-text-secondary/50 hover:text-text-secondary hover:bg-bg-elevated/30"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50"
                  }
                >
                  <Link href="/integrations">
                    <Plug className="w-4 h-4" />
                    <span>Integrations</span>
                    {isCoreTier && <Lock className="ml-auto w-3.5 h-3.5 text-text-muted/40" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/settings")}
                  className={
                    pathname.startsWith("/settings")
                      ? "bg-signal/10 text-signal font-medium border-l-2 border-signal"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50"
                  }
                >
                  <Link href="/settings">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Section: Organization (shown when user has an org selected) */}
        {currentOrgId && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-text-muted uppercase text-[11px] tracking-wider font-display">
                Organization
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[
                    { title: "General", url: "/organization/general", icon: Building2 },
                    { title: "Members", url: "/organization/members", icon: Users },
                    { title: "Teams", url: "/organization/teams", icon: UsersRound },
                    { title: "Audit Log", url: "/organization/audit-log", icon: ScrollText },
                  ].map((item) => {
                    const active = pathname.startsWith(item.url);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className={
                            active
                              ? "bg-signal/10 text-signal font-medium border-l-2 border-signal"
                              : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50"
                          }
                        >
                          <Link href={item.url}>
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border-subtle p-4">
        <div className="flex flex-col gap-3">
          {/* User info + System status */}
          <div className="flex items-center gap-2.5">
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.firstName || "User"}
                className="w-8 h-8 rounded-full object-cover border border-border-subtle shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-signal/10 flex items-center justify-center text-xs text-signal font-semibold border border-border-subtle shrink-0">
                {userProfile?.firstName?.[0]?.toUpperCase() || userProfile?.email?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {userProfile?.firstName && userProfile?.lastName
                  ? `${userProfile.firstName} ${userProfile.lastName}`
                  : userProfile?.firstName || userProfile?.email || "Account"}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <SignalDot status="ok" size="sm" pulse />
                <span>Online</span>
              </div>
            </div>
          </div>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md text-sm text-text-muted hover:text-text-primary hover:bg-bg-elevated/50 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
