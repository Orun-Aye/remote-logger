"use client";

import { useState } from "react";
import { Search, X, Filter, Activity, Save, CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export interface LogFilters {
  search: string;
  levels: string[];
  services: string[];
  environments: string[];
  eventTypes: string[];
  timeRange?: "1h" | "6h" | "24h" | "7d" | "30d" | "custom";
  release?: string;
  customFrom?: string;
  customTo?: string;
}

interface ObservatoryFilterBarProps {
  filters: LogFilters;
  onFiltersChange: (filters: LogFilters) => void;
  onSaveSearch?: () => void;
  availableServices: string[];
  availableEnvironments: string[];
  isLiveTail?: boolean;
  onToggleLiveTail?: () => void;
}

const LOG_LEVELS = [
  { value: "trace", label: "TRC", color: "var(--level-trace)" },
  { value: "debug", label: "DBG", color: "var(--level-debug)" },
  { value: "info", label: "INF", color: "var(--level-info)" },
  { value: "warn", label: "WRN", color: "var(--level-warn)" },
  { value: "error", label: "ERR", color: "var(--level-error)" },
  { value: "fatal", label: "FTL", color: "var(--level-fatal)" },
];

const EVENT_TYPES = [
  "error",
  "performance",
  "interaction",
  "network",
  "console",
  "pageview",
];

const TIME_OPTS: Array<{ value: NonNullable<LogFilters["timeRange"]>; label: string }> = [
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

interface FilterChipProps {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, color, active, onClick }: FilterChipProps) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="font-mono uppercase rounded-sm transition-all duration-150"
      style={{
        padding: "2px 8px",
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: "0.04em",
        border: `1px solid ${
          active
            ? `color-mix(in srgb, ${color} 40%, transparent)`
            : hov
              ? "var(--border-subtle)"
              : "var(--border-faint)"
        }`,
        background: active
          ? `color-mix(in srgb, ${color} 12%, transparent)`
          : hov
            ? "var(--bg-elevated)"
            : "transparent",
        color: active ? color : hov ? "var(--text-secondary)" : "var(--text-muted)",
      }}
    >
      {label}
    </button>
  );
}

export function ObservatoryFilterBar({
  filters,
  onFiltersChange,
  onSaveSearch,
  availableServices,
  availableEnvironments,
  isLiveTail,
  onToggleLiveTail,
}: ObservatoryFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  const advancedCount =
    filters.services.length +
    filters.environments.length +
    filters.eventTypes.length +
    (filters.release ? 1 : 0);

  const totalActive =
    advancedCount + filters.levels.length + (filters.search ? 1 : 0);

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const clearFilters = () => {
    setCustomDateRange({});
    setShowDatePicker(false);
    onFiltersChange({
      search: "",
      levels: [],
      services: [],
      environments: [],
      eventTypes: [],
      release: "",
      timeRange: "24h",
      customFrom: undefined,
      customTo: undefined,
    });
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    const newRange = { from: range?.from, to: range?.to };
    setCustomDateRange(newRange);
    if (range?.from && range?.to) {
      onFiltersChange({
        ...filters,
        timeRange: "custom",
        customFrom: range.from.toISOString(),
        customTo: range.to.toISOString(),
      });
    }
  };

  const formatDateShort = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="border-b border-border-faint shrink-0">
      {/* Row 1 — search + time pills + live + levels + filters toggle */}
      <div className="flex items-center gap-1.5 px-3.5 py-2">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          <input
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            placeholder="Search logs… message, error, url, service"
            className={cn(
              "w-full bg-bg-elevated border border-border-faint rounded-md outline-none",
              "text-text-primary font-body transition-colors duration-150",
              "focus:border-signal/40"
            )}
            style={{
              padding: "5px 28px 5px 30px",
              fontSize: 12.5,
            }}
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Time pills */}
        <div className="flex items-center gap-0.5 bg-bg-elevated border border-border-faint rounded-md p-0.5">
          {TIME_OPTS.map((opt) => {
            const active = filters.timeRange === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    timeRange: opt.value,
                    customFrom: undefined,
                    customTo: undefined,
                  })
                }
                className="font-mono rounded-sm transition-all duration-150"
                style={{
                  padding: "3px 9px",
                  fontSize: 11,
                  background: active ? "var(--bg-overlay)" : "transparent",
                  border: `1px solid ${active ? "var(--border-subtle)" : "transparent"}`,
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {opt.label}
              </button>
            );
          })}

          {/* Custom range trigger */}
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <button
                className="font-mono rounded-sm transition-all duration-150 inline-flex items-center gap-1"
                style={{
                  padding: "3px 7px",
                  fontSize: 11,
                  background:
                    filters.timeRange === "custom" ? "var(--bg-overlay)" : "transparent",
                  border: `1px solid ${filters.timeRange === "custom" ? "var(--border-subtle)" : "transparent"}`,
                  color:
                    filters.timeRange === "custom"
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                }}
              >
                <CalendarIcon className="w-3 h-3" />
                {customDateRange.from && customDateRange.to
                  ? `${formatDateShort(customDateRange.from)}–${formatDateShort(customDateRange.to)}`
                  : "custom"}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-bg-surface border-border-subtle"
              align="end"
            >
              <Calendar
                mode="range"
                selected={
                  customDateRange.from
                    ? { from: customDateRange.from, to: customDateRange.to }
                    : undefined
                }
                onSelect={handleCustomDateSelect}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
                className="bg-bg-surface text-text-primary"
                classNames={{
                  day: "text-text-primary",
                  caption_label: "text-text-primary",
                  weekday: "text-text-muted",
                  outside: "text-text-muted/50",
                  range_start: "rounded-l-md bg-signal/20",
                  range_end: "rounded-r-md bg-signal/20",
                  range_middle: "bg-signal/10 rounded-none",
                  today: "bg-bg-base text-signal rounded-md",
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Live tail */}
        {onToggleLiveTail && (
          <button
            onClick={onToggleLiveTail}
            className="inline-flex items-center gap-1.5 rounded-md transition-all duration-150"
            style={{
              padding: "4px 10px",
              fontSize: 11.5,
              border: `1px solid ${isLiveTail ? "color-mix(in srgb, var(--signal) 30%, transparent)" : "var(--border-faint)"}`,
              background: isLiveTail
                ? "color-mix(in srgb, var(--signal) 7%, transparent)"
                : "transparent",
              color: isLiveTail ? "var(--signal)" : "var(--text-muted)",
            }}
          >
            <span
              className={cn("w-1.5 h-1.5 rounded-full", isLiveTail && "animate-live-badge")}
              style={{
                background: isLiveTail ? "var(--signal)" : "var(--text-muted)",
              }}
            />
            Live
          </button>
        )}

        {/* Levels inline */}
        <div className="flex items-center gap-1">
          {LOG_LEVELS.map((l) => (
            <FilterChip
              key={l.value}
              label={l.label}
              color={l.color}
              active={filters.levels.includes(l.value)}
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  levels: toggleArr(filters.levels, l.value),
                })
              }
            />
          ))}
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md transition-all duration-150 shrink-0"
          )}
          style={{
            padding: "4px 10px",
            fontSize: 11.5,
            border: `1px solid ${showAdvanced ? "var(--border-subtle)" : "var(--border-faint)"}`,
            background: showAdvanced ? "var(--bg-elevated)" : "transparent",
            color: "var(--text-muted)",
          }}
        >
          <Filter className="w-3 h-3" />
          Filters
          {advancedCount > 0 && (
            <span
              className="font-mono rounded-sm"
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                padding: "0px 4px",
                background: "var(--signal)",
                color: "var(--bg-void)",
              }}
            >
              {advancedCount}
            </span>
          )}
        </button>

        {/* Save search */}
        {onSaveSearch && (
          <button
            onClick={onSaveSearch}
            className="inline-flex items-center gap-1.5 rounded-md transition-all duration-150 shrink-0"
            style={{
              padding: "4px 10px",
              fontSize: 11.5,
              border: "1px solid var(--border-faint)",
              color: "var(--text-muted)",
            }}
            title="Save search"
          >
            <Save className="w-3 h-3" />
          </button>
        )}

        {/* Clear */}
        {totalActive > 0 && (
          <button
            onClick={clearFilters}
            className="text-text-muted hover:text-status-danger leading-none px-1 transition-colors"
            style={{ fontSize: 18 }}
            aria-label="Clear all filters"
          >
            ×
          </button>
        )}
      </div>

      {/* Advanced row */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-4 px-3.5 pb-2.5 pt-1 border-t border-border-faint animate-fade-in">
          {/* Services */}
          {availableServices.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span
                className="font-mono uppercase text-text-muted"
                style={{ fontSize: 10, letterSpacing: "0.06em" }}
              >
                svc
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {availableServices.map((s) => (
                  <FilterChip
                    key={s}
                    label={s}
                    color="var(--data)"
                    active={filters.services.includes(s)}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        services: toggleArr(filters.services, s),
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Environments */}
          {availableEnvironments.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span
                className="font-mono uppercase text-text-muted"
                style={{ fontSize: 10, letterSpacing: "0.06em" }}
              >
                env
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {availableEnvironments.map((e) => (
                  <FilterChip
                    key={e}
                    label={e}
                    color="var(--signal)"
                    active={filters.environments.includes(e)}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        environments: toggleArr(filters.environments, e),
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Event types */}
          <div className="flex items-center gap-1.5">
            <span
              className="font-mono uppercase text-text-muted"
              style={{ fontSize: 10, letterSpacing: "0.06em" }}
            >
              type
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {EVENT_TYPES.map((t) => (
                <FilterChip
                  key={t}
                  label={t}
                  color="var(--text-secondary)"
                  active={filters.eventTypes.includes(t)}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      eventTypes: toggleArr(filters.eventTypes, t),
                    })
                  }
                />
              ))}
            </div>
          </div>

          {/* Release */}
          <div className="flex items-center gap-1.5">
            <span
              className="font-mono uppercase text-text-muted"
              style={{ fontSize: 10, letterSpacing: "0.06em" }}
            >
              rel
            </span>
            <input
              value={filters.release || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, release: e.target.value })
              }
              placeholder="2.4.1"
              className="font-mono bg-bg-elevated border border-border-faint rounded-sm outline-none text-text-primary focus:border-signal/40 transition-colors"
              style={{ padding: "2px 8px", width: 80, fontSize: 11 }}
            />
          </div>

          {/* Live tail (mobile fallback) */}
          {onToggleLiveTail && (
            <button
              onClick={onToggleLiveTail}
              className="inline-flex items-center gap-1.5 rounded-md transition-all duration-150 md:hidden"
              style={{
                padding: "3px 10px",
                fontSize: 11,
                border: `1px solid ${isLiveTail ? "color-mix(in srgb, var(--signal) 30%, transparent)" : "var(--border-faint)"}`,
                background: isLiveTail
                  ? "color-mix(in srgb, var(--signal) 7%, transparent)"
                  : "transparent",
                color: isLiveTail ? "var(--signal)" : "var(--text-muted)",
              }}
            >
              <Activity className="w-3 h-3" />
              Live
            </button>
          )}
        </div>
      )}
    </div>
  );
}
