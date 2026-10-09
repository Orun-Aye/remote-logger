"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Search,
  Bell,
  Command,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Globe,
  RefreshCw,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWebsocket } from "@/hooks/useWebsocket";
import { useApperioStore } from "@/store/apperio-store";
import { useProjects } from "@/hooks/project.hooks";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

// ============================================
// TYPES
// ============================================

interface TopBarProps {
  onCommandOpen: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "error" | "warning" | "info" | "success";
  unread: boolean;
  projectId?: string;
  logId?: string;
  timestamp: number;
}

// ============================================
// CONSTANTS
// ============================================

const TIME_RANGES = [
  { label: "Last hour", value: "1h" },
  { label: "Last 6 hours", value: "6h" },
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
] as const;

const ENVIRONMENTS = [
  { label: "All Environments", value: "all" },
  { label: "Production", value: "production" },
  { label: "Staging", value: "staging" },
  { label: "Development", value: "development" },
] as const;

const REFRESH_INTERVALS = [
  { label: "10 seconds", value: 10000 },
  { label: "30 seconds", value: 30000 },
  { label: "1 minute", value: 60000 },
  { label: "5 minutes", value: 300000 },
] as const;

// ============================================
// HELPERS
// ============================================

const isObjectId = (str: string) => /^[a-f\d]{24}$/i.test(str);

const decodeSegment = (segment: string) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

const getTimeRangeLabel = (
  value: string,
  customRange?: { start: Date; end: Date } | null,
) => {
  if (value === "custom" && customRange) {
    return `${format(customRange.start, "MMM d")} - ${format(customRange.end, "MMM d")}`;
  }
  return TIME_RANGES.find((range) => range.value === value)?.label || "Custom";
};

const getEnvironmentLabel = (value: string) => {
  return (
    ENVIRONMENTS.find((env) => env.value === value)?.label || "All Environments"
  );
};

const formatRefreshInterval = (ms: number) => {
  if (ms < 60000) return `${ms / 1000}s`;
  return `${ms / 60000}m`;
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "error":
      return <AlertTriangle className="h-4 w-4 text-status-danger" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-status-warn" />;
    case "success":
      return <CheckCircle className="h-4 w-4 text-status-ok" />;
    default:
      return <Info className="h-4 w-4 text-data-info" />;
  }
};

// ============================================
// COMPONENT
// ============================================

export function TopBar({ onCommandOpen }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Local state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Zustand store
  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const setTimeRange = useApperioStore((s) => s.setTimeRange);
  const customTimeRange = useApperioStore((s) => s.customTimeRange);
  const setCustomTimeRange = useApperioStore((s) => s.setCustomTimeRange);
  const selectedEnvironment = useApperioStore((s) => s.selectedEnvironment);
  const setSelectedEnvironment = useApperioStore(
    (s) => s.setSelectedEnvironment,
  );
  const autoRefreshEnabled = useApperioStore((s) => s.autoRefreshEnabled);
  const autoRefreshInterval = useApperioStore((s) => s.autoRefreshInterval);
  const toggleAutoRefresh = useApperioStore((s) => s.toggleAutoRefresh);
  const setAutoRefreshInterval = useApperioStore(
    (s) => s.setAutoRefreshInterval,
  );

  // Projects for breadcrumb ObjectId resolution
  const { data: projectsResponse } = useProjects();

  // WebSocket connection for real-time notifications
  const { lastMessage } = useWebsocket();

  // Build a lookup map from project IDs to names
  const projectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    const projects = projectsResponse?.data;
    if (Array.isArray(projects)) {
      for (const project of projects) {
        if (project?._id && project?.name) {
          map.set(project._id, project.name);
        }
      }
    }
    return map;
  }, [projectsResponse]);

  // Handle real-time notifications from WebSocket
  useEffect(() => {
    if (!lastMessage) return;

    try {
      // Socket.io messages arrive as objects: { type, payload }
      const msgType = lastMessage.type;
      const payload = lastMessage.payload;

      if (msgType === "NOTIFICATION" || msgType === "NEW_ALERT") {
        const data = payload?.alert || payload || {};
        const newNotification: Notification = {
          id: data._id || data.id || Date.now().toString(),
          title: data.title || data.ruleName || "New Alert",
          message: data.message || "An issue has been detected",
          time: "Just now",
          type: data.severity === "critical" || data.severity === "high" ? "error" : "warning",
          unread: true,
          projectId: data.projectId,
          logId: data.logId,
          timestamp: Date.now(),
        };

        setNotifications((prev) => [newNotification, ...prev.slice(0, 49)]);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  }, [lastMessage]);

  // Generate breadcrumbs from pathname with ObjectId resolution
  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const items: { name: string; href: string; isLast: boolean }[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const href = "/" + segments.slice(0, i + 1).join("/");
      const isLast = i === segments.length - 1;

      let name: string;
      if (isObjectId(segment)) {
        name = projectNameMap.get(segment) || segment.slice(0, 8) + "...";
      } else {
        const label = decodeSegment(segment)
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        // Dynamic segments (an error message on the error page) are long, and
        // URL-encoded they are one unbreakable word that widened the whole page
        name = label.length > 32 ? `${label.slice(0, 31)}…` : label;
      }

      items.push({ name, href, isLast });
    }

    return items;
  }, [pathname, projectNameMap]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Notification handlers
  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, unread: false } : n,
        ),
      );

      if (notification.projectId) {
        router.push(`/projects/${notification.projectId}`);
      } else if (notification.logId) {
        router.push(`/logs?logId=${notification.logId}`);
      }
    },
    [router],
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-border-subtle bg-bg-base/95 backdrop-blur supports-[backdrop-filter]:bg-bg-base/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden lg:block">
            <BreadcrumbLink
              href="/dashboard"
              className="text-text-muted hover:text-text-secondary"
            >
              <LayoutDashboard />
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((breadcrumb) => (
            <div key={breadcrumb.href} className="flex items-center">
              <BreadcrumbSeparator className="hidden mr-2 md:block" />
              <BreadcrumbItem>
                {breadcrumb.isLast ? (
                  <BreadcrumbPage className="text-text-primary">
                    {breadcrumb.name}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={breadcrumb.href}
                    className="text-text-muted hover:text-text-secondary"
                  >
                    {breadcrumb.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center space-x-2">
        {/* Command Palette Trigger */}
        <button
          onClick={onCommandOpen}
          className="hidden md:inline-flex items-center gap-2 h-9 w-64 rounded-md border border-border-subtle bg-bg-surface px-3 text-sm text-text-muted hover:bg-bg-elevated/50 hover:text-text-secondary transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border-subtle bg-bg-elevated px-1.5 font-mono text-[10px] font-medium text-text-muted">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        <Separator orientation="vertical" className="h-4" />

        {/* Time Range Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex text-text-secondary hover:text-text-primary"
            >
              <Clock className="w-4 h-4 mr-2" />
              {getTimeRangeLabel(selectedTimeRange, customTimeRange)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-bg-surface border-border-subtle"
          >
            <DropdownMenuLabel className="text-text-muted">
              Time Range
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {TIME_RANGES.map((range) => (
              <DropdownMenuItem
                key={range.value}
                onSelect={() => setTimeRange(range.value as any)}
                className={
                  selectedTimeRange === range.value
                    ? "bg-signal/10 text-signal"
                    : ""
                }
              >
                {range.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setDatePickerOpen(true);
              }}
              className={
                selectedTimeRange === "custom" ? "bg-signal/10 text-signal" : ""
              }
            >
              <Popover open={datePickerOpen}>
                <PopoverTrigger asChild>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Custom range
                  </span>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-bg-surface border-border-subtle"
                  align="end"
                  sideOffset={8}
                >
                  <div className="p-3 border-b border-border-subtle">
                    <p className="text-sm font-medium text-text-primary">
                      Select date range
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {customTimeRange
                        ? `${format(customTimeRange.start, "MMM d, yyyy")} - ${format(customTimeRange.end, "MMM d, yyyy")}`
                        : "Pick a start and end date"}
                    </p>
                  </div>
                  <CalendarComponent
                    mode="range"
                    defaultMonth={customTimeRange?.start ?? new Date()}
                    selected={
                      customTimeRange
                        ? {
                            from: customTimeRange.start,
                            to: customTimeRange.end,
                          }
                        : undefined
                    }
                    onSelect={(range: DateRange | undefined) => {
                      if (range?.from && range?.to) {
                        setCustomTimeRange({
                          start: range.from,
                          end: range.to,
                        });
                      } else if (range?.from) {
                        // Partial selection — wait for end date
                      }
                    }}
                    numberOfMonths={2}
                    disabled={{ after: new Date() }}
                  />
                </PopoverContent>
              </Popover>
            </DropdownMenuItem>
            {/* Custom Date Range Popover */}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Environment Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex text-text-secondary hover:text-text-primary"
            >
              <Globe className="w-4 h-4 mr-2" />
              {getEnvironmentLabel(selectedEnvironment)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-bg-surface border-border-subtle"
          >
            <DropdownMenuLabel className="text-text-muted">
              Environment
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ENVIRONMENTS.map((env) => (
              <DropdownMenuItem
                key={env.value}
                onSelect={() => setSelectedEnvironment(env.value)}
                className={
                  selectedEnvironment === env.value
                    ? "bg-signal/10 text-signal"
                    : ""
                }
              >
                {env.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Auto-Refresh Toggle */}
        <div className="hidden md:flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAutoRefresh}
            className={
              autoRefreshEnabled
                ? "text-signal hover:text-signal"
                : "text-text-secondary hover:text-text-primary"
            }
          >
            <RefreshCw
              className={`w-4 h-4 ${autoRefreshEnabled ? "animate-spin" : ""}`}
              style={
                autoRefreshEnabled ? { animationDuration: "3s" } : undefined
              }
            />
            {autoRefreshEnabled && (
              <span className="ml-1.5 text-xs">
                {formatRefreshInterval(autoRefreshInterval)}
              </span>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-5 px-0 text-text-muted hover:text-text-primary"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-bg-surface border-border-subtle"
            >
              <DropdownMenuLabel className="text-text-muted">
                Refresh Interval
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {REFRESH_INTERVALS.map((interval) => (
                <DropdownMenuItem
                  key={interval.value}
                  onSelect={() => setAutoRefreshInterval(interval.value)}
                  className={
                    autoRefreshInterval === interval.value
                      ? "bg-signal/10 text-signal"
                      : ""
                  }
                >
                  {interval.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-4" />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-status-danger text-[10px] text-white flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 bg-bg-surface border-border-subtle"
          >
            <DropdownMenuLabel className="flex items-center justify-between">
              <span className="text-text-primary">Notifications</span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-6 px-2 text-xs text-signal hover:text-signal-bright"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-text-muted mb-2" />
                  <p className="text-sm text-text-muted">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start p-4 space-y-1 cursor-pointer hover:bg-bg-elevated/50"
                    onSelect={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <h4 className="text-sm font-medium text-text-primary">
                          {notification.title}
                        </h4>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-signal rounded-full" />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-text-muted">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-text-muted">
                        {notification.time}
                      </span>
                      {notification.projectId && (
                        <Badge
                          variant="outline"
                          className="text-xs border-border-subtle"
                        >
                          Project
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center text-signal hover:text-signal-bright"
              onSelect={() => router.push("/notifications")}
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
      </div>
    </header>
  );
}
