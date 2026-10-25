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
import { Switch } from "@/components/ui/switch";
import { Clock, Loader2, Info, AlertTriangle } from "lucide-react";
import { useProject, useApplyRetention } from "@/hooks/project.hooks";
import { toast } from "sonner";

const RETENTION_PRESETS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
  { label: "365 days", value: 365 },
];

export default function RetentionSettingsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId =
    typeof params?.projectId === "string" ? params.projectId : "";
  const { data: projectData, isLoading } = useProject(projectId);
  const applyRetention = useApplyRetention();

  const [retentionDays, setRetentionDays] = useState(
    (projectData?.project as any)?.retentionConfig?.retentionDays ?? 30
  );
  const [autoCleanup, setAutoCleanup] = useState(true);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-48 bg-bg-surface rounded animate-pulse" />
        <div className="h-64 bg-bg-surface rounded animate-pulse" />
      </div>
    );
  }

  const project = projectData?.project;

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
    applyRetention.mutate(
      {
        projectId: project._id,
        retentionConfig: { retentionDays },
      },
      {
        onSuccess: () => toast.success("Retention settings updated"),
        onError: () => toast.error("Failed to update retention settings"),
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-signal" />
          </div>
          Data Retention
        </h1>
        <p className="text-text-secondary mt-1 ml-[46px]">
          Configure how long log data is kept
        </p>
      </div>

      {/* Retention period */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <CardTitle className="font-display text-text-primary">
            Retention Period
          </CardTitle>
          <CardDescription className="text-text-muted">
            Logs older than the retention period will be automatically deleted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-data/5 border border-data/20">
            <Info className="w-5 h-5 text-data shrink-0 mt-0.5" />
            <p className="text-sm text-text-muted">
              Reducing retention period will delete existing logs older than the
              new limit. This action cannot be undone.
            </p>
          </div>

          {/* Quick presets */}
          <div className="space-y-2">
            <Label className="text-text-secondary text-sm">
              Quick Select
            </Label>
            <div className="flex flex-wrap gap-2">
              {RETENTION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setRetentionDays(preset.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                    retentionDays === preset.value
                      ? "bg-signal/10 border-signal text-signal"
                      : "bg-bg-elevated border-border-subtle text-text-secondary hover:border-border-accent hover:text-text-primary"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom input */}
          <div className="space-y-2">
            <Label htmlFor="retentionDays" className="text-text-secondary text-sm">
              Custom Retention Period (days)
            </Label>
            <Input
              id="retentionDays"
              type="number"
              min={1}
              max={3650}
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="bg-background border-input text-text-primary focus:border-gs-900 focus:ring-0 font-mono w-40"
            />
          </div>

          {retentionDays < 7 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-status-warn/5 border border-status-warn/20">
              <AlertTriangle className="w-5 h-5 text-status-warn shrink-0 mt-0.5" />
              <p className="text-sm text-status-warn">
                Very short retention periods may cause you to lose important
                debugging data. Consider keeping at least 7 days.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-cleanup */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <CardTitle className="font-display text-text-primary">
            Automatic Cleanup
          </CardTitle>
          <CardDescription className="text-text-muted">
            Automatically delete logs that exceed the retention period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-bg-elevated border border-border-subtle">
            <div>
              <Label className="text-text-primary text-sm font-medium">
                Enable Auto-Cleanup
              </Label>
              <p className="text-sm text-text-muted mt-0.5">
                Runs daily to remove logs older than {retentionDays} days
              </p>
            </div>
            <Switch
              checked={autoCleanup}
              onCheckedChange={setAutoCleanup}
            />
          </div>

          {!autoCleanup && (
            <p className="text-xs text-text-muted">
              When disabled, old logs will not be automatically deleted.
              You will need to manage storage manually.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="signal"
          onClick={handleSave}
          disabled={applyRetention.isPending}
        >
          {applyRetention.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          Save Retention Settings
        </Button>
      </div>
    </div>
  );
}
