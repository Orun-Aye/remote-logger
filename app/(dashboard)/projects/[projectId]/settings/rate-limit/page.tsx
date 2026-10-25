"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Info } from "lucide-react";
import { useProject, useUpdateRateLimit } from "@/hooks/project.hooks";
import { toast } from "sonner";

export default function RateLimitSettingsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId =
    typeof params?.projectId === "string" ? params.projectId : "";
  const { data: projectData, isLoading } = useProject(projectId);
  const updateRateLimit = useUpdateRateLimit();

  const [maxRequests, setMaxRequests] = useState<number | null>(null);
  const [burstLimit, setBurstLimit] = useState<number | null>(null);

  const project = projectData?.project;

  // Initialize form values when project loads
  const effectiveMaxRequests =
    maxRequests ?? project?.rateLimitConfig?.maxRequestsPerMinute ?? 100;
  const effectiveBurstLimit =
    burstLimit ?? project?.rateLimitConfig?.burstLimit ?? 200;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-48 bg-bg-surface rounded animate-pulse" />
        <div className="h-64 bg-bg-surface rounded animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-2xl">
        <Card className="bg-bg-surface border-border-subtle">
          <CardContent className="p-12 text-center">
            <p className="text-text-muted">Project not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    updateRateLimit.mutate(
      {
        projectId: project._id,
        rateLimit: {
          maxRequestsPerMinute: effectiveMaxRequests,
          burstLimit: effectiveBurstLimit,
        },
      },
      {
        onSuccess: () => toast.success("Rate limit configuration updated"),
        onError: () => toast.error("Failed to update rate limit"),
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-signal" />
          </div>
          Rate Limiting
        </h1>
        <p className="text-text-secondary mt-1 ml-[46px]">
          Configure API rate limits for log ingestion
        </p>
      </div>

      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <CardTitle className="font-display text-text-primary">
            Rate Limit Configuration
          </CardTitle>
          <CardDescription className="text-text-muted">
            Control how many requests this project can receive per minute
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Info banner */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-data/5 border border-data/20">
            <Info className="w-5 h-5 text-data shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-text-primary">
                Rate limiting protects your project from excessive traffic.
              </p>
              <p className="text-sm text-text-muted mt-1">
                Requests exceeding the limit will receive a 429 status code.
                The SDK handles retries automatically with exponential backoff.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm">
                Max Requests Per Minute
              </Label>
              <Input
                type="number"
                min={1}
                max={10000}
                value={effectiveMaxRequests}
                onChange={(e) => setMaxRequests(Number(e.target.value))}
                className="bg-background border-input text-text-primary focus:border-gs-900 focus:ring-0 font-mono"
              />
              <p className="text-xs text-text-muted">
                Default: 100 requests/min
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm">Burst Limit</Label>
              <Input
                type="number"
                min={1}
                max={10000}
                value={effectiveBurstLimit}
                onChange={(e) => setBurstLimit(Number(e.target.value))}
                className="bg-background border-input text-text-primary focus:border-gs-900 focus:ring-0 font-mono"
              />
              <p className="text-xs text-text-muted">
                Maximum burst before throttling
              </p>
            </div>
          </div>

          {/* Current usage indicator */}
          <div className="p-4 rounded-lg bg-bg-elevated border border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Current Limit</span>
              <span className="text-sm font-mono text-signal">
                {project.rateLimitConfig?.maxRequestsPerMinute ?? 100} req/min
              </span>
            </div>
            <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden">
              <div
                className="h-full bg-signal rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    (effectiveMaxRequests / 1000) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle">
            <Button
              variant="signal"
              onClick={handleSave}
              disabled={updateRateLimit.isPending}
            >
              {updateRateLimit.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save Rate Limit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
