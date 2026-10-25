"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignalDot } from "@/components/shared/SignalDot";
import { IntegrationIcon } from "./IntegrationIcon";
import type {
  IntegrationMarketplaceItem,
  IntegrationStatus,
} from "@/types/integration.types";
import { Settings, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationCardProps {
  item: IntegrationMarketplaceItem;
  status?: IntegrationStatus;
  className?: string;
}

const categoryLabels: Record<string, string> = {
  issue_tracking: "Issue Tracking",
  incident_management: "Incident Management",
  communication: "Communication",
};

export function IntegrationCard({
  item,
  status,
  className,
}: IntegrationCardProps) {
  const isConnected = status === "connected";
  const isError = status === "error";

  const dotStatus = isConnected
    ? "ok"
    : isError
      ? "danger"
      : ("info" as const);

  return (
    <Card
      className={cn(
        "group relative flex flex-col",
        isConnected && "border-signal/30",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-bg-elevated border border-border-subtle">
              <IntegrationIcon
                iconName={item.iconName}
                size="md"
                className="text-text-secondary group-hover:text-signal transition-colors"
              />
            </div>
            <div>
              <CardTitle className="text-base font-display">
                {item.displayName}
              </CardTitle>
              <Badge
                variant="outline"
                className="mt-1 text-[10px] font-normal"
              >
                {categoryLabels[item.category] || item.category}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <SignalDot
              status={dotStatus}
              size="sm"
              pulse={isConnected}
            />
            <span
              className={cn(
                "text-xs capitalize",
                isConnected
                  ? "text-status-ok"
                  : isError
                    ? "text-status-danger"
                    : "text-text-muted"
              )}
            >
              {status || "Not connected"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <CardDescription className="text-text-secondary text-sm leading-relaxed">
          {item.description}
        </CardDescription>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Link href={`/integrations/${item.slug}`}>
            {isConnected ? (
              <>
                <Settings className="w-4 h-4" />
                Configure
              </>
            ) : (
              <>
                Connect
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
