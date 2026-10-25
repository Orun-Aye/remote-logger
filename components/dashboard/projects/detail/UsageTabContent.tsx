"use client";

import { useState } from "react";
import { Project } from "@/types/project.types";
import { TerminalBlock } from "@/components/shared/TerminalBlock";
import { SignalDot } from "@/components/shared/SignalDot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRegenerateApiKey } from "@/hooks/project.hooks";
import { Clock, Settings, Info, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UsageTabContentProps {
  project: Project["project"];
  usage: Project["analytics"]["usage"];
}

export function UsageTabContent({ project, usage }: UsageTabContentProps) {
  const regenerateApiKey = useRegenerateApiKey();
  const [showApiKey, setShowApiKey] = useState(false);

  const handleRegenerate = () => {
    if (!confirm("Are you sure? All existing SDK connections will stop working.")) return;
    regenerateApiKey.mutate(project._id, {
      onSuccess: () => toast.success("API key regenerated"),
      onError: () => toast.error("Failed to regenerate API key"),
    });
  };

  const maskedKey = project.apiKey
    ? `${project.apiKey.slice(0, 8)}${"*".repeat(24)}${project.apiKey.slice(-4)}`
    : "No API key";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Usage Patterns */}
      <div className="bg-bg-surface border border-border-subtle rounded-lg p-6">
        <div className="flex items-center gap-2 text-text-primary mb-1">
          <Clock className="w-5 h-5 text-data-info" />
          <h3 className="font-display font-semibold">Usage Patterns</h3>
        </div>
        <p className="text-sm text-text-muted mb-4">Activity distribution and trends</p>

        <div className="space-y-4">
          <div className="p-4 bg-data-info/5 border border-data-info/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm text-text-primary">Peak Activity</h4>
              <Badge variant="outline" className="text-data-info border-data-info/30">
                16:00 Wed
              </Badge>
            </div>
            <p className="text-xs text-text-muted">
              Highest traffic occurs during hour 16 on weekday 3
            </p>
          </div>

          {(usage?.insights?.length ?? 0) > 0 ? (
            usage.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <SignalDot status="info" size="sm" className="mt-1.5 shrink-0" />
                <span className="text-text-secondary">{insight}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-muted">No usage insights available</p>
          )}
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-bg-surface border border-border-subtle rounded-lg p-6">
        <div className="flex items-center gap-2 text-text-primary mb-1">
          <Settings className="w-5 h-5 text-signal" />
          <h3 className="font-display font-semibold">Configuration</h3>
        </div>
        <p className="text-sm text-text-muted mb-4">Current project settings</p>

        <div className="space-y-5">
          {/* API Key */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-text-primary">API Key</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-xs text-text-primary underline underline-offset-4 decoration-border-accent hover:decoration-current transition-colors"
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-border-subtle"
                  onClick={handleRegenerate}
                  disabled={regenerateApiKey.isPending}
                >
                  {regenerateApiKey.isPending ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  Regenerate
                </Button>
              </div>
            </div>
            <TerminalBlock
              code={showApiKey ? project.apiKey : maskedKey}
              showCopy
            />
          </div>

          {/* Rate Limiting */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text-primary">Rate Limiting</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-bg-base border border-border-faint rounded-lg text-center">
                <div className="font-display font-bold text-text-primary text-lg">
                  {project.rateLimitConfig?.maxRequestsPerMinute}
                </div>
                <div className="text-xs text-text-muted">per minute</div>
              </div>
              <div className="p-3 bg-bg-base border border-border-faint rounded-lg text-center">
                <div className="font-display font-bold text-text-primary text-lg">
                  {project.rateLimitConfig?.burstLimit}
                </div>
                <div className="text-xs text-text-muted">burst window (min)</div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-text-primary">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-signal/10 text-signal border-signal/30"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
