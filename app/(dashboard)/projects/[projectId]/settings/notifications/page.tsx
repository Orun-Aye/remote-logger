"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Info, Loader2, Plus } from "lucide-react";
import {
  useProject,
  useUpdateNotificationSettings,
} from "@/hooks/project.hooks";
import { useDistinctValues } from "@/hooks/log.hooks";
import { NotificationSettings } from "@/types/project.types";
import { toast } from "sonner";

// Mirrors the backend default for projects without stored settings
const DEFAULT_SETTINGS: NotificationSettings = {
  errorGroups: { enabled: true, environments: ["production"] },
};

export default function NotificationSettingsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId =
    typeof params?.projectId === "string" ? params.projectId : "";
  const { data: projectData, isLoading } = useProject(projectId);
  const project = projectData?.project;

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

  const saved = project.notificationSettings?.errorGroups;
  const initial: NotificationSettings = {
    errorGroups: {
      enabled: saved?.enabled ?? DEFAULT_SETTINGS.errorGroups.enabled,
      environments:
        saved?.environments ?? DEFAULT_SETTINGS.errorGroups.environments,
    },
  };

  // Mount the form only once data is loaded so state initializes correctly
  return <NotificationSettingsForm projectId={project._id} initial={initial} />;
}

function NotificationSettingsForm({
  projectId,
  initial,
}: {
  projectId: string;
  initial: NotificationSettings;
}) {
  const updateSettings = useUpdateNotificationSettings();
  const { data: seenEnvironments } = useDistinctValues(projectId, "environment");

  const [enabled, setEnabled] = useState(initial.errorGroups.enabled);
  const [allEnvironments, setAllEnvironments] = useState(
    initial.errorGroups.environments.length === 0
  );
  const [selected, setSelected] = useState<string[]>(
    initial.errorGroups.environments
  );
  const [customEnv, setCustomEnv] = useState("");

  // Environments seen in logs, plus anything already selected, plus production
  const options = useMemo(() => {
    const set = new Set<string>(["production", ...selected]);
    for (const env of seenEnvironments ?? []) {
      if (typeof env === "string" && env.trim()) set.add(env);
    }
    return Array.from(set).sort((a, b) =>
      a === "production" ? -1 : b === "production" ? 1 : a.localeCompare(b)
    );
  }, [seenEnvironments, selected]);

  const toggleEnv = (env: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, env] : prev.filter((e) => e !== env)
    );
  };

  const addCustomEnv = () => {
    const env = customEnv.trim();
    if (!env) return;
    if (!selected.includes(env)) setSelected((prev) => [...prev, env]);
    setCustomEnv("");
  };

  const noEnvironmentSelected = enabled && !allEnvironments && selected.length === 0;

  const handleSave = () => {
    if (noEnvironmentSelected) return;
    updateSettings.mutate(
      {
        projectId,
        notificationSettings: {
          errorGroups: {
            enabled,
            environments: allEnvironments ? [] : selected,
          },
        },
      },
      {
        onSuccess: () => toast.success("Notification settings updated"),
        onError: () => toast.error("Failed to update notification settings"),
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-signal" />
          </div>
          Notifications
        </h1>
        <p className="text-text-secondary mt-1 ml-[46px]">
          Choose when the project owner hears about new errors
        </p>
      </div>

      {/* Master toggle */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <CardTitle className="font-display text-text-primary">
            Error group notifications
          </CardTitle>
          <CardDescription className="text-text-muted">
            In-app and email alerts when a new error appears or a resolved
            error comes back. Alert rules are configured separately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-bg-elevated border border-border-subtle">
            <Label
              htmlFor="error-group-notifications"
              className="text-text-primary text-sm font-medium"
            >
              Notify the owner about error groups
            </Label>
            <Switch
              id="error-group-notifications"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Environment filter */}
      <Card
        className={`bg-bg-surface border-border-subtle ${enabled ? "" : "opacity-60"}`}
      >
        <CardHeader>
          <CardTitle className="font-display text-text-primary">
            Environments
          </CardTitle>
          <CardDescription className="text-text-muted">
            Only errors from these environments send notifications. Errors
            from other environments are still grouped and shown in Issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-data/5 border border-data/20">
            <Info className="w-5 h-5 text-data shrink-0 mt-0.5" />
            <p className="text-sm text-text-muted">
              The Apperio SDK reports{" "}
              <code className="font-mono text-text-secondary">development</code>{" "}
              unless you pass{" "}
              <code className="font-mono text-text-secondary">environment</code>{" "}
              to <code className="font-mono text-text-secondary">init()</code>.
              Set it to <code className="font-mono text-text-secondary">production</code>{" "}
              in your live app to get notified.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-bg-elevated border border-border-subtle">
            <Label
              htmlFor="all-environments"
              className="text-text-primary text-sm font-medium"
            >
              All environments
            </Label>
            <Switch
              id="all-environments"
              checked={allEnvironments}
              onCheckedChange={setAllEnvironments}
              disabled={!enabled}
            />
          </div>

          {!allEnvironments && (
            <>
              <div className="space-y-2">
                {options.map((env) => {
                  const id = `env-${env}`;
                  return (
                    <div
                      key={env}
                      className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-subtle"
                    >
                      <Checkbox
                        id={id}
                        checked={selected.includes(env)}
                        onCheckedChange={(checked) => toggleEnv(env, checked === true)}
                        disabled={!enabled}
                      />
                      <Label
                        htmlFor={id}
                        className="text-sm font-mono text-text-primary"
                      >
                        {env}
                      </Label>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Input
                  value={customEnv}
                  onChange={(e) => setCustomEnv(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomEnv();
                    }
                  }}
                  placeholder="Add an environment, e.g. prod"
                  maxLength={64}
                  disabled={!enabled}
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  onClick={addCustomEnv}
                  disabled={!enabled || !customEnv.trim()}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              {noEnvironmentSelected && (
                <p className="text-sm text-status-warn">
                  Select at least one environment, or turn on All environments.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="signal"
          onClick={handleSave}
          disabled={updateSettings.isPending || noEnvironmentSelected}
        >
          {updateSettings.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          Save Notification Settings
        </Button>
      </div>
    </div>
  );
}
