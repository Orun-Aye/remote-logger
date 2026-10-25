"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import {
  buildMarketplaceItems,
  fallbackMarketplaceItems,
  integrationCategories,
} from "@/components/integrations/integration-data";
import {
  useAvailableIntegrations,
  useConnectedIntegrations,
} from "@/hooks/integration.hooks";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plug } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntegrationStatus } from "@/types/integration.types";

export default function IntegrationsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: availableTypes } = useAvailableIntegrations();
  const { data: connectedIntegrations } = useConnectedIntegrations();

  // Build marketplace items from API data or fall back to static data
  const marketplaceItems = useMemo(() => {
    if (availableTypes && availableTypes.length > 0) {
      return buildMarketplaceItems(availableTypes);
    }
    return fallbackMarketplaceItems;
  }, [availableTypes]);

  // Map connected integration statuses by type
  const statusByType = useMemo(() => {
    const map: Record<string, IntegrationStatus> = {};
    if (connectedIntegrations) {
      for (const integration of connectedIntegrations) {
        // If multiple of same type, latest wins
        if (
          !map[integration.type] ||
          integration.status === "connected"
        ) {
          map[integration.type] = integration.status;
        }
      }
    }
    return map;
  }, [connectedIntegrations]);

  // Filter by category and search
  const filteredItems = useMemo(() => {
    return marketplaceItems.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const matchesSearch =
        !search ||
        item.displayName.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [marketplaceItems, activeCategory, search]);

  const connectedCount = connectedIntegrations?.filter(
    (i) => i.status === "connected"
  ).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Integrations"
        description="Connect Apperio with your favorite tools for issue tracking, incident management, and team communication."
        badge={
          connectedCount > 0 ? (
            <Badge variant="signal">
              {connectedCount} connected
            </Badge>
          ) : undefined
        }
        className="px-0"
      />

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {integrationCategories.map((cat) => {
            const count =
              cat.key === "all"
                ? marketplaceItems.length
                : marketplaceItems.filter((i) => i.category === cat.key)
                    .length;

            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                  activeCategory === cat.key
                    ? "bg-signal/10 text-signal border border-signal/20"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-elevated/50"
                )}
              >
                {cat.label}
                <span
                  className={cn(
                    "text-xs",
                    activeCategory === cat.key
                      ? "text-signal"
                      : "text-text-muted"
                  )}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Integration Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <IntegrationCard
              key={item.slug}
              item={item}
              status={statusByType[item.type]}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center mb-4">
            <Plug className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-text-secondary font-medium">
            No integrations found
          </p>
          <p className="text-text-muted text-sm mt-1">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
}
