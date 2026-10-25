"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Github } from "lucide-react";
import { useCreateAlertRule } from "@/hooks/alerts.hook";
import { useProjects } from "@/hooks/project.hooks";
import { useConnectedIntegrations } from "@/hooks/integration.hooks";
import { toast } from "sonner";

// Updated interface to match AlertRule structure
interface AlertRule {
  _id: string;
  name: string;
  projectId: string;
  condition: {
    level?: string;
    keyword?: string;
    frequency?: number;
    intervalMinutes?: number;
  };
  isActive: boolean;
  notifyChannels: string[];
  notificationConfig: {
    emails?: string[];
    slackWebhookUrl?: string;
    webhookUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAlertRuleCreated: () => void;
  projectId?: string; // Make projectId optional - can be selected from dropdown if not provided
}

export function CreateAlertModal({
  open,
  onOpenChange,
  onAlertRuleCreated,
  projectId,
}: CreateAlertModalProps) {
  // Fetch available projects
  const { data: projectsResp } = useProjects();
  const projects = (projectsResp as any)?.data || [];

  console.log("NEW PROJECTS", projects)

  const {
    data: createdAlertData,
    isError,
    isPending,
    mutateAsync: createAlertRule,
    reset: resetMutation,
  } = useCreateAlertRule();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projectId || ""
  );

  // Check if GitHub integration is connected for the selected project
  const effectiveProjectId = projectId || selectedProjectId;
  const { data: connectedIntegrations } = useConnectedIntegrations(effectiveProjectId || undefined);
  const isGitHubConnected = Array.isArray(connectedIntegrations)
    && connectedIntegrations.some(
        (integration: any) => integration.type === "github" && integration.status === "connected"
      );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    condition: {
      level: "" as string,
      keyword: "",
      frequency: undefined as number | undefined,
      intervalMinutes: undefined as number | undefined,
    },
    isActive: true,
    notifyChannels: ["email"] as string[],
    notificationConfig: {
      emails: [] as string[],
      slackWebhookUrl: "",
      webhookUrl: "",
    },
  });

  const [emailInput, setEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Update selectedProjectId when projectId prop changes
  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Use selectedProjectId (either from props or dropdown selection)
      const currentProjectId = selectedProjectId || projectId;

      if (!currentProjectId) {
        throw new Error("Please select a project");
      }

      // Prepare the payload to match CreateAlertRuleDTO
      const payload = {
        name: formData.name,
        projectId: currentProjectId,
        condition: {
          level: formData.condition.level,
          keyword: formData.condition.keyword || undefined,
          frequency: formData.condition.frequency || 0,
          intervalMinutes: formData.condition.intervalMinutes || 0,
        },
        isActive: formData.isActive,
        notifyChannels: formData.notifyChannels,
        notificationConfig: {
          ...(formData.notificationConfig.emails.length > 0 && {
            emails: formData.notificationConfig.emails,
          }),
          ...(formData.notificationConfig.slackWebhookUrl && {
            slackWebhookUrl: formData.notificationConfig.slackWebhookUrl,
          }),
          ...(formData.notificationConfig.webhookUrl && {
            webhookUrl: formData.notificationConfig.webhookUrl,
          }),
        },
      };

      // Remove empty condition fields
      Object.keys(payload.condition).forEach((key) => {
        if (
          payload.condition[key] === undefined ||
          payload.condition[key] === ""
        ) {
          delete payload.condition[key];
        }
      });

      console.log(payload)

      const response = await createAlertRule({
        data: payload,
    });

      if (response) {
        onAlertRuleCreated();
        resetForm();
        resetMutation()
        onOpenChange(false);
        toast.success("Rule created successfully", {
          description: `${payload.name} will be triggered when alert conditions are met`
        })
      } else {
        throw new Error("Rule is undefiend");
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to create alert rule:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedProjectId(projectId || "");
    setFormData({
      name: "",
      description: "",
      condition: {
        level: "",
        keyword: "",
        frequency: undefined,
        intervalMinutes: undefined,
      },
      isActive: true,
      notifyChannels: ["email"],
      notificationConfig: {
        emails: [],
        slackWebhookUrl: "",
        webhookUrl: "",
      },
    });
    setEmailInput("");
    setError("");
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && !formData.notificationConfig.emails.includes(email)) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        setFormData((prev) => ({
          ...prev,
          notificationConfig: {
            ...prev.notificationConfig,
            emails: [...prev.notificationConfig.emails, email],
          },
        }));
        setEmailInput("");
      }
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      notificationConfig: {
        ...prev.notificationConfig,
        emails: prev.notificationConfig.emails.filter(
          (email) => email !== emailToRemove
        ),
      },
    }));
  };

  const toggleNotifyChannel = (channel: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      notifyChannels: checked
        ? [...prev.notifyChannels, channel]
        : prev.notifyChannels.filter((c) => c !== channel),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  // Validation
  const isFormValid =
    formData.name.trim() && formData.condition.level && selectedProjectId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle>Create New Alert Rule</DialogTitle>
          <DialogDescription>
            Create a new alert rule to automatically monitor logs and trigger
            notifications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter alert rule name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what this rule monitors"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="isActive">Rule is active</Label>
            </div>
          </div>

          {/* Project Selection - only show if no projectId prop provided */}
          {!projectId && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem
                        key={project._id || project.id}
                        value={project._id || project.id}
                      >
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Condition Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium">Alert Conditions</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Log Level *</Label>
                <Select
                  value={formData.condition.level}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      condition: { ...prev.condition, level: value },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select log level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="fatal">Fatal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyword">Keyword (Optional)</Label>
                <Input
                  id="keyword"
                  value={formData.condition.keyword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      condition: { ...prev.condition, keyword: e.target.value },
                    }))
                  }
                  placeholder="Search for specific text"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency Threshold</Label>
                <Input
                  id="frequency"
                  type="number"
                  min="0"
                  value={formData.condition.frequency || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      condition: {
                        ...prev.condition,
                        frequency: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                  placeholder="Number of occurrences"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intervalMinutes">Time Window (Minutes)</Label>
                <Input
                  id="intervalMinutes"
                  type="number"
                  min="0"
                  value={formData.condition.intervalMinutes || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      condition: {
                        ...prev.condition,
                        intervalMinutes: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                  placeholder="Time period in minutes"
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Leave frequency and time window empty to trigger on every
              occurrence
            </p>
          </div>

          {/* Notification Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium">Notification Settings</h4>

            {/* Notification Channels */}
            <div className="space-y-3">
              <Label>Notification Channels</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email-channel"
                    checked={formData.notifyChannels.includes("email")}
                    onCheckedChange={(checked) =>
                      toggleNotifyChannel("email", checked)
                    }
                  />
                  <Label htmlFor="email-channel">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="slack-channel"
                    checked={formData.notifyChannels.includes("slack")}
                    onCheckedChange={(checked) =>
                      toggleNotifyChannel("slack", checked)
                    }
                  />
                  <Label htmlFor="slack-channel">Slack</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="webhook-channel"
                    checked={formData.notifyChannels.includes("webhook")}
                    onCheckedChange={(checked) =>
                      toggleNotifyChannel("webhook", checked)
                    }
                  />
                  <Label htmlFor="webhook-channel">Webhook</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="github-channel"
                    checked={formData.notifyChannels.includes("github")}
                    onCheckedChange={(checked) =>
                      toggleNotifyChannel("github", checked)
                    }
                    disabled={!isGitHubConnected}
                  />
                  <Label
                    htmlFor="github-channel"
                    className={`flex items-center gap-1.5 ${
                      !isGitHubConnected ? "text-muted-foreground" : ""
                    }`}
                  >
                    <Github className="h-4 w-4" />
                    GitHub Issue
                  </Label>
                </div>
                {!isGitHubConnected && (
                  <p className="text-xs text-muted-foreground pl-1">
                    Configure GitHub integration in project settings first
                  </p>
                )}
                {formData.notifyChannels.includes("github") && isGitHubConnected && (
                  <p className="text-xs text-muted-foreground pl-1">
                    A GitHub issue will be created automatically when this alert fires
                  </p>
                )}
              </div>
            </div>

            {/* Email Configuration */}
            {formData.notifyChannels.includes("email") && (
              <div className="space-y-2">
                <Label htmlFor="emails">Email Recipients</Label>
                <div className="flex gap-2">
                  <Input
                    id="emails"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add email addresses"
                  />
                  <Button type="button" variant="outline" onClick={addEmail}>
                    Add
                  </Button>
                </div>
                {formData.notificationConfig.emails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.notificationConfig.emails.map((email) => (
                      <Badge
                        key={email}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {email}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-status-danger"
                          onClick={() => removeEmail(email)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Slack Configuration */}
            {formData.notifyChannels.includes("slack") && (
              <div className="space-y-2">
                <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                <Input
                  id="slackWebhook"
                  type="url"
                  value={formData.notificationConfig.slackWebhookUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notificationConfig: {
                        ...prev.notificationConfig,
                        slackWebhookUrl: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
            )}

            {/* Webhook Configuration */}
            {formData.notifyChannels.includes("webhook") && (
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={formData.notificationConfig.webhookUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notificationConfig: {
                        ...prev.notificationConfig,
                        webhookUrl: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://your-webhook-endpoint.com"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isFormValid}>
              {isSubmitting ? "Creating..." : "Create Alert Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
