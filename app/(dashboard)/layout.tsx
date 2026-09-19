"use client";

import type React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { useState } from "react";
import { CommandPalette } from "@/components/command-palette";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query/client";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { usePathname } from "next/navigation";
import { useBetaAccess } from "@/store/apperio-store";
import { isAdvancedRoute, FEATURE_LABELS } from "@/lib/route-tiers";
import { UpgradeGate } from "@/components/shared/UpgradeGate";
import { useHydrateCurrentUser } from "@/hooks/useHydrateCurrentUser";

function getFeatureName(pathname: string): string {
  // Extract the most specific segment for the label
  const segments = pathname.split("/").filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    if (FEATURE_LABELS[segments[i]]) return FEATURE_LABELS[segments[i]];
  }
  return "This Feature";
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  useAutoRefresh();
  const pathname = usePathname();
  const { betaTier } = useBetaAccess();
  const userLoaded = useHydrateCurrentUser();

  // Wait for the profile before gating, otherwise the default "core" briefly
  // flashes the upgrade overlay at a full-tier user on every load.
  const shouldGate = userLoaded && betaTier === "core" && isAdvancedRoute(pathname);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopBar onCommandOpen={() => setCommandOpen(true)} />
          <main className="flex-1 p-6 bg-bg-base">
            {shouldGate ? (
              <UpgradeGate feature={getFeatureName(pathname)}>
                {children}
              </UpgradeGate>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </SidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardShell>{children}</DashboardShell>
    </QueryClientProvider>
  );
}
