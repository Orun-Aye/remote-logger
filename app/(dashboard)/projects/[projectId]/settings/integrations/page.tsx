"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Link2,
  Loader2,
  Zap,
  Mail,
  Webhook,
  Check,
  Play,
  AlertCircle,
} from "lucide-react";
import { useProject } from "@/hooks/project.hooks";
import {
  useGithubConnection,
  useGithubRepos,
  useLinkGithubRepo,
  useUnlinkGithubRepo,
} from "@/hooks/integrations.hooks";
import { toast } from "sonner";
import { SignalDot } from "@/components/shared/SignalDot";

// Validation helpers
function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validateEmails(value: string): { valid: boolean; errors: string[] } {
  if (!value.trim()) return { valid: true, errors: [] };
  const emails = value.split(",").map((e) => e.trim()).filter(Boolean);
  const errors: string[] = [];
  for (const email of emails) {
    if (!isValidEmail(email)) {
      errors.push(`"${email}" is not a valid email address`);
    }
  }
  return { valid: errors.length === 0, errors };
}

type TestingState = {
  slack: boolean;
  email: boolean;
  webhook: boolean;
};

export default function IntegrationSettingsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId =
    typeof params?.projectId === "string" ? params.projectId : "";
  const { data: projectData, isLoading } = useProject(projectId);

  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [emailRecipients, setEmailRecipients] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [testing, setTesting] = useState<TestingState>({
    slack: false,
    email: false,
    webhook: false,
  });

  // Validation error states
  const [slackError, setSlackError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [webhookError, setWebhookError] = useState("");

  const project = projectData?.project;

  // Pre-fill form fields from existing project settings
  useEffect(() => {
    if (project && !initialized) {
      const settings = project.integrationSettings;
      if (settings) {
        setSlackWebhookUrl(settings.slack?.webhookUrl || "");
        setEmailRecipients(
          settings.email?.recipients?.join(", ") || ""
        );
        setWebhookUrl(settings.webhook?.url || "");
      }
      setInitialized(true);
    }
  }, [project, initialized]);

  // Validate on change
  const handleSlackChange = useCallback((value: string) => {
    setSlackWebhookUrl(value);
    if (value && !isValidUrl(value)) {
      setSlackError("Please enter a valid URL");
    } else {
      setSlackError("");
    }
  }, []);

  const handleEmailChange = useCallback((value: string) => {
    setEmailRecipients(value);
    if (value) {
      const { errors } = validateEmails(value);
      setEmailError(errors.length > 0 ? errors[0] : "");
    } else {
      setEmailError("");
    }
  }, []);

  const handleWebhookChange = useCallback((value: string) => {
    setWebhookUrl(value);
    if (value && !isValidUrl(value)) {
      setWebhookError("Please enter a valid URL");
    } else {
      setWebhookError("");
    }
  }, []);

  const handleSave = async () => {
    // Run validation before saving
    let hasErrors = false;

    if (slackWebhookUrl && !isValidUrl(slackWebhookUrl)) {
      setSlackError("Please enter a valid URL");
      hasErrors = true;
    }
    if (emailRecipients) {
      const { valid, errors } = validateEmails(emailRecipients);
      if (!valid) {
        setEmailError(errors[0]);
        hasErrors = true;
      }
    }
    if (webhookUrl && !isValidUrl(webhookUrl)) {
      setWebhookError("Please enter a valid URL");
      hasErrors = true;
    }

    if (hasErrors) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    setSaving(true);
    try {
      const { apiClient } = await import("@/services/config");
      await apiClient.put(`/projects/${projectId}/integration-settings`, {
        slack: { webhookUrl: slackWebhookUrl || undefined },
        email: {
          recipients: emailRecipients
            ? emailRecipients
                .split(",")
                .map((e) => e.trim())
                .filter(Boolean)
            : [],
        },
        webhook: { url: webhookUrl || undefined },
      });
      toast.success("Integration settings saved");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save integration settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (type: "slack" | "email" | "webhook") => {
    // Validate before testing
    if (type === "slack") {
      if (!slackWebhookUrl) {
        toast.error("Enter a Slack webhook URL first");
        return;
      }
      if (!isValidUrl(slackWebhookUrl)) {
        toast.error("Slack webhook URL is not a valid URL");
        return;
      }
    }

    if (type === "email") {
      if (!emailRecipients) {
        toast.error("Enter at least one email recipient first");
        return;
      }
      const { valid, errors } = validateEmails(emailRecipients);
      if (!valid) {
        toast.error(errors[0]);
        return;
      }
    }

    if (type === "webhook") {
      if (!webhookUrl) {
        toast.error("Enter a webhook URL first");
        return;
      }
      if (!isValidUrl(webhookUrl)) {
        toast.error("Webhook URL is not a valid URL");
        return;
      }
    }

    setTesting((prev) => ({ ...prev, [type]: true }));

    try {
      const { apiClient } = await import("@/services/config");
      const configPayload: Record<string, any> = {};

      if (type === "slack") {
        configPayload.webhookUrl = slackWebhookUrl;
      } else if (type === "email") {
        configPayload.recipients = emailRecipients
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean);
      } else if (type === "webhook") {
        configPayload.url = webhookUrl;
      }

      const response = await apiClient.post(
        `/integrations/${projectId}/test`,
        { type, config: configPayload }
      );

      if (response.data?.status === "success") {
        toast.success(
          response.data.message || `${type} integration test successful`
        );
      } else {
        toast.error(
          response.data?.message || `${type} integration test failed`
        );
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        `Failed to test ${type} integration`;
      toast.error(errorMessage);
    } finally {
      setTesting((prev) => ({ ...prev, [type]: false }));
    }
  };

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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-signal" />
          </div>
          Integrations
        </h1>
        <p className="text-text-secondary mt-1 ml-[46px]">
          Connect external services for notifications and data export
        </p>
      </div>

      {/* Slack */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center text-signal">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-text-primary">
                  Slack
                </CardTitle>
                <CardDescription className="text-xs text-text-muted mt-0.5">
                  Send alert notifications to a Slack channel
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <SignalDot
                status={slackWebhookUrl ? "ok" : "warn"}
                size="sm"
                pulse={!!slackWebhookUrl}
              />
              <span className="text-xs text-text-muted">
                {slackWebhookUrl ? "Configured" : "Not configured"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="slackUrl" className="text-text-secondary text-sm">
              Webhook URL
            </Label>
            <Input
              id="slackUrl"
              value={slackWebhookUrl}
              onChange={(e) => handleSlackChange(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className={`bg-bg-elevated border-border-subtle text-text-primary placeholder:text-text-muted focus:border-signal focus:ring-signal/20 font-mono text-sm ${
                slackError ? "border-status-danger focus:border-status-danger" : ""
              }`}
            />
            {slackError && (
              <p className="text-xs text-status-danger flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {slackError}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTest("slack")}
              disabled={testing.slack || !slackWebhookUrl}
              className="border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            >
              {testing.slack ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 mr-1.5" />
              )}
              Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-data/10 flex items-center justify-center text-data">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-text-primary">
                  Email Notifications
                </CardTitle>
                <CardDescription className="text-xs text-text-muted mt-0.5">
                  Send alerts to email addresses
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <SignalDot
                status={emailRecipients ? "ok" : "warn"}
                size="sm"
                pulse={!!emailRecipients}
              />
              <span className="text-xs text-text-muted">
                {emailRecipients ? "Configured" : "Not configured"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label
              htmlFor="emailRecipients"
              className="text-text-secondary text-sm"
            >
              Recipients
            </Label>
            <Input
              id="emailRecipients"
              value={emailRecipients}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="dev@example.com, ops@example.com"
              className={`bg-bg-elevated border-border-subtle text-text-primary placeholder:text-text-muted focus:border-signal focus:ring-signal/20 ${
                emailError
                  ? "border-status-danger focus:border-status-danger"
                  : ""
              }`}
            />
            {emailError ? (
              <p className="text-xs text-status-danger flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {emailError}
              </p>
            ) : (
              <p className="text-xs text-text-muted">
                Separate multiple emails with commas
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTest("email")}
              disabled={testing.email || !emailRecipients}
              className="border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            >
              {testing.email ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 mr-1.5" />
              )}
              Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generic Webhook */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-status-warn/10 flex items-center justify-center text-status-warn">
                <Webhook className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-text-primary">
                  Custom Webhook
                </CardTitle>
                <CardDescription className="text-xs text-text-muted mt-0.5">
                  Send log data to a custom HTTP endpoint
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <SignalDot
                status={webhookUrl ? "ok" : "warn"}
                size="sm"
                pulse={!!webhookUrl}
              />
              <span className="text-xs text-text-muted">
                {webhookUrl ? "Configured" : "Not configured"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl" className="text-text-secondary text-sm">
              Webhook URL
            </Label>
            <Input
              id="webhookUrl"
              value={webhookUrl}
              onChange={(e) => handleWebhookChange(e.target.value)}
              placeholder="https://your-service.com/webhook"
              className={`bg-bg-elevated border-border-subtle text-text-primary placeholder:text-text-muted focus:border-signal focus:ring-signal/20 font-mono text-sm ${
                webhookError
                  ? "border-status-danger focus:border-status-danger"
                  : ""
              }`}
            />
            {webhookError && (
              <p className="text-xs text-status-danger flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {webhookError}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTest("webhook")}
              disabled={testing.webhook || !webhookUrl}
              className="border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            >
              {testing.webhook ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 mr-1.5" />
              )}
              Test
            </Button>
          </div>
        </CardContent>
      </Card>

      <LinkedGithubRepoCard projectId={projectId} project={project} />

      {/* Save */}
      <div className="flex justify-end">
        <Button variant="signal" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          Save Integration Settings
        </Button>
      </div>
    </div>
  );
}

function LinkedGithubRepoCard({
  projectId,
  project,
}: {
  projectId: string;
  project: any;
}) {
  const { data: ghStatus } = useGithubConnection();
  const linked = project?.integrationSettings?.githubRepo;
  const linkRepo = useLinkGithubRepo(projectId);
  const unlinkRepo = useUnlinkGithubRepo(projectId);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<{
    owner: string;
    repo: string;
    branch: string;
  } | null>(null);
  const { data: repos, isLoading: reposLoading } = useGithubRepos(
    search,
    !!ghStatus?.connected && !linked,
  );

  const onSave = async () => {
    if (!picked) return;
    try {
      await linkRepo.mutateAsync(picked);
      toast.success(`Linked ${picked.owner}/${picked.repo}`);
      setPicked(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link repo");
    }
  };

  const onUnlink = async () => {
    try {
      await unlinkRepo.mutateAsync();
      toast.success("Repo unlinked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unlink repo");
    }
  };

  return (
    <Card className="bg-bg-surface border-border-subtle">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center text-signal">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium text-text-primary">
              Linked Repository
            </CardTitle>
            <CardDescription className="text-xs text-text-muted mt-0.5">
              Connect a GitHub repo so commits show up as deploy events on the
              project overview.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!ghStatus?.connected && (
          <div className="text-sm text-text-muted">
            You haven&apos;t connected a GitHub account yet.{" "}
            <a
              href="/settings/integrations"
              className="text-signal hover:underline"
            >
              Connect GitHub in Account Settings →
            </a>
          </div>
        )}

        {ghStatus?.connected && linked && (
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-mono text-sm text-text-primary">
                {linked.owner}/{linked.repo}
              </div>
              <div className="font-mono text-xs text-text-muted">
                branch · {linked.branch || "main"}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onUnlink}
              disabled={unlinkRepo.isPending}
              className="border-border-subtle"
            >
              {unlinkRepo.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Unlink"
              )}
            </Button>
          </div>
        )}

        {ghStatus?.connected && !linked && (
          <div className="space-y-3">
            <Input
              placeholder="Search your repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto rounded-md border border-border-subtle divide-y divide-border-faint">
              {reposLoading && (
                <div className="px-3 py-4 text-center text-xs text-text-muted">
                  Loading repos…
                </div>
              )}
              {!reposLoading && repos && repos.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-text-muted">
                  No matching repositories.
                </div>
              )}
              {!reposLoading &&
                repos?.map((r) => {
                  const isPicked =
                    picked?.owner === r.owner && picked?.repo === r.repo;
                  return (
                    <button
                      key={r.fullName}
                      type="button"
                      onClick={() =>
                        setPicked({
                          owner: r.owner,
                          repo: r.repo,
                          branch: r.defaultBranch || "main",
                        })
                      }
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                        isPicked ? "bg-signal/10" : "hover:bg-bg-elevated"
                      }`}
                    >
                      <span className="truncate font-mono">{r.fullName}</span>
                      <span className="ml-2 text-xs text-text-muted font-mono">
                        {r.defaultBranch}
                      </span>
                    </button>
                  );
                })}
            </div>
            {picked && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-text-secondary shrink-0">
                  Branch
                </Label>
                <Input
                  className="font-mono text-sm"
                  value={picked.branch}
                  onChange={(e) =>
                    setPicked((p) => (p ? { ...p, branch: e.target.value } : p))
                  }
                />
                <Button
                  variant="signal"
                  size="sm"
                  onClick={onSave}
                  disabled={linkRepo.isPending}
                >
                  {linkRepo.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Link"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
