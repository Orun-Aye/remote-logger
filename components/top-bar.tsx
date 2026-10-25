"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
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
import {
  Search,
  Bell,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { useWebsocket } from "@/hooks/useWebsocket";
import { useApperioStore } from "@/store/apperio-store";
import { useProfile } from "@/hooks/user.hook";
import { cn } from "@/lib/utils";
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
  { label: "All environments", value: "all" },
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
    ENVIRONMENTS.find((env) => env.value === value)?.label || "All environments"
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

/** Selected rows in the top bar menus: ink text on the grey fill. */
const selectedItem = "bg-gs-100 text-text-primary font-medium";

/** The quiet mono controls in the top bar (time range, environment). */
const barControl =
  "hidden md:inline-flex h-8 gap-1.5 px-2 font-mono text-xs text-text-secondary hover:text-text-primary";

const clearAllCookies = () => {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
};

// ============================================
// COMPONENT
// ============================================

export function TopBar({ onCommandOpen }: TopBarProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

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

  const { data: userProfile } = useProfile();
  const displayName =
    userProfile?.firstName && userProfile?.lastName
      ? `${userProfile.firstName} ${userProfile.lastName}`
      : userProfile?.firstName || userProfile?.email || "Account";
  const initials =
    ((userProfile?.firstName?.[0] ?? "") + (userProfile?.lastName?.[0] ?? "")).toUpperCase() ||
    userProfile?.email?.[0]?.toUpperCase() ||
    "U";

  // WebSocket connection for real-time notifications
  const { lastMessage } = useWebsocket();

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

  const handleLogout = () => {
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
    <header className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center gap-3 border-b border-border-subtle bg-background px-4 lg:px-6">
      <SidebarTrigger className="-ml-1 md:hidden" />

      {/* Command palette trigger, shaped like a search field */}
      <button
        onClick={onCommandOpen}
        className="flex h-9 w-full max-w-xl min-w-0 items-center gap-2.5 rounded-md border border-border-subtle bg-gs-50 px-3 text-sm text-text-muted transition-colors hover:border-border-accent hover:text-text-secondary"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-left">
          Search projects, logs and actions
        </span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center rounded-sm border border-border-subtle bg-background px-1.5 font-mono text-[11px] text-text-secondary sm:inline-flex">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        {/* Time Range Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={barControl}>
              {getTimeRangeLabel(selectedTimeRange, customTimeRange)}
              <ChevronDown className="size-3 text-text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="eyebrow">Time range</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {TIME_RANGES.map((range) => (
              <DropdownMenuItem
                key={range.value}
                onSelect={() => setTimeRange(range.value as any)}
                className={selectedTimeRange === range.value ? selectedItem : ""}
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
              className={selectedTimeRange === "custom" ? selectedItem : ""}
            >
              <Popover open={datePickerOpen}>
                <PopoverTrigger asChild>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Custom range
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
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
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Environment Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={barControl}>
              {getEnvironmentLabel(selectedEnvironment)}
              <ChevronDown className="size-3 text-text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="eyebrow">Environment</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ENVIRONMENTS.map((env) => (
              <DropdownMenuItem
                key={env.value}
                onSelect={() => setSelectedEnvironment(env.value)}
                className={selectedEnvironment === env.value ? selectedItem : ""}
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
            aria-pressed={autoRefreshEnabled}
            title={autoRefreshEnabled ? "Auto-refresh on" : "Auto-refresh off"}
            className={cn(
              "h-8 px-2 font-mono text-xs",
              autoRefreshEnabled
                ? "text-text-primary"
                : "text-text-muted hover:text-text-primary",
            )}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${autoRefreshEnabled ? "animate-spin" : ""}`}
              style={
                autoRefreshEnabled ? { animationDuration: "3s" } : undefined
              }
            />
            {autoRefreshEnabled && formatRefreshInterval(autoRefreshInterval)}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Refresh interval"
                className="h-8 w-5 px-0 text-text-muted hover:text-text-primary"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="eyebrow">Refresh interval</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {REFRESH_INTERVALS.map((interval) => (
                <DropdownMenuItem
                  key={interval.value}
                  onSelect={() => setAutoRefreshInterval(interval.value)}
                  className={autoRefreshInterval === interval.value ? selectedItem : ""}
                >
                  {interval.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Notifications"
              className="relative h-8 w-8 px-0 text-text-secondary hover:text-text-primary"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-sm bg-status-danger px-1 font-mono text-[10px] text-white">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span className="eyebrow">Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-6 px-2 text-xs"
                >
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-text-muted">
                  No notifications
                </p>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start p-3 space-y-1 cursor-pointer"
                    onSelect={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <h4 className="text-sm font-medium text-text-primary">
                          {notification.title}
                        </h4>
                        {notification.unread && (
                          <span className="size-1.5 bg-gs-900" aria-label="Unread" />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Dismiss"
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
                    <span className="font-mono text-[11px] text-text-muted">
                      {notification.time}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-text-primary"
              onSelect={() => router.push("/notifications")}
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Account */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-2 flex items-center gap-2.5 rounded-sm py-1 pl-1 pr-1.5 text-left transition-colors hover:bg-gs-50">
              {userProfile?.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt=""
                  className="size-7 shrink-0 rounded-sm object-cover"
                />
              ) : (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-gs-900 font-mono text-[11px] font-semibold text-gs-0">
                  {initials}
                </span>
              )}
              <span className="hidden min-w-0 leading-tight lg:block">
                <span className="block max-w-40 truncate text-sm font-medium text-text-primary">
                  {displayName}
                </span>
                {userProfile?.email && userProfile.email !== displayName && (
                  <span className="block max-w-40 truncate text-xs text-text-muted">
                    {userProfile.email}
                  </span>
                )}
              </span>
              <ChevronDown className="size-3.5 text-text-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-0">
            <div className="border-b border-border-subtle px-4 py-3">
              <p className="eyebrow">Signed in</p>
              <p className="mt-2 text-sm font-medium text-text-primary">{displayName}</p>
              {userProfile?.email && (
                <p className="mt-1 truncate font-mono text-xs text-text-secondary">
                  {userProfile.email}
                </p>
              )}
            </div>
            <div className="p-1">
              <DropdownMenuItem onSelect={() => router.push("/settings")}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {resolvedTheme === "dark" ? "Light theme" : "Dark theme"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onCommandOpen}>
                Command palette
                <kbd className="ml-auto rounded-sm border border-border-subtle px-1 font-mono text-[11px] text-text-muted">
                  Ctrl K
                </kbd>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="my-0" />
            <div className="p-1">
              <DropdownMenuItem onSelect={handleLogout}>Sign out</DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
