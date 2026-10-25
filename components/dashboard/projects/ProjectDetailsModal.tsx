"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Info,
  Activity,
  Users,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  Zap,
  Target,
  Settings,
  Mail,
  User,
} from "lucide-react";

interface ProjectData {
  _id: string;
  name: string;
  description: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  teamMembers: Array<{
    _id: string;
    role: string;
    user: {
      _id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  }>;
  metrics: {
    healthScore: number;
    errorRate: number;
    averageResponseTime: number;
    performance: {
      p95ResponseTime: number;
      uptimePercentage: number;
    };
    recentActivity: {
      isActive: boolean;
      logsLast24h: number;
      errorsLast24h: number;
    };
    totalLogs: number;
    totalErrorCount: number;
  };

  trends: {
    activityTrend: "up" | "down" | "stable";
    errorTrend: "up" | "down" | "stable";
    performanceTrend: "up" | "down" | "stable";
  };
  rateLimitConfig: {
    maxRequestsPerMinute: number;
    burstLimit: number;
  };

  logCount: number;
  alertRuleCount: number;
  tags: string[];
}

interface ProjectDetailsModalProps {
  project: ProjectData;
  trigger?: React.ReactNode;
}

export function ProjectDetailsModal({
  project,
  trigger,
}: ProjectDetailsModalProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-status-ok";
    if (score >= 60) return "text-status-warn";
    return "text-status-danger";
  };

  const getHealthScoreBackground = (score: number) => {
    if (score >= 80) return "bg-status-ok/15";
    if (score >= 60) return "bg-level-warn/15";
    return "bg-status-danger/15";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-status-ok" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-status-danger" />;
      default:
        return <Minus className="w-4 h-4 text-text-muted" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-status-ok";
      case "down":
        return "text-status-danger";
      default:
        return "text-text-secondary";
    }
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Info className="w-4 h-4 mr-2" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="md:min-w-4xl lg:min-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  project.isActive ? "bg-status-ok" : "bg-gs-400"
                }`}
              />
              <div>
                <DialogTitle className="text-2xl">{project.name}</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {project.description}
                </DialogDescription>
              </div>
            </div>
            <Badge variant={project.isActive ? "default" : "secondary"}>
              {project.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Health Score Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Project Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${getHealthScoreBackground(
                        project.metrics.healthScore
                      )}`}
                    >
                      <span
                        className={`text-2xl font-bold ${getHealthScoreColor(
                          project.metrics.healthScore
                        )}`}
                      >
                        {project.metrics.healthScore}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Health Score</p>
                      <p className="text-sm text-muted-foreground">
                        Overall project health
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={project.metrics.healthScore}
                    className="w-32"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      {getTrendIcon(project.trends.activityTrend)}
                      <span
                        className={`text-sm font-medium ${getTrendColor(
                          project.trends.activityTrend
                        )}`}
                      >
                        Activity
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {project.metrics.recentActivity.logsLast24h} logs (24h)
                    </p>
                  </div>

                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      {getTrendIcon(project.trends.errorTrend)}
                      <span
                        className={`text-sm font-medium ${getTrendColor(
                          project.trends.errorTrend
                        )}`}
                      >
                        Errors
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {project.metrics.recentActivity.errorsLast24h} errors
                      (24h)
                    </p>
                  </div>

                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      {getTrendIcon(project.trends.performanceTrend)}
                      <span
                        className={`text-sm font-medium ${getTrendColor(
                          project.trends.performanceTrend
                        )}`}
                      >
                        Performance
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {project.metrics.averageResponseTime}ms avg
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-data-info" />
                    <div>
                      <p className="text-2xl font-bold">
                        {project.metrics.totalLogs.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Logs
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-status-danger" />
                    <div>
                      <p className="text-2xl font-bold">
                        {project.metrics.totalErrorCount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Errors
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-status-ok" />
                    <div>
                      <p className="text-2xl font-bold">
                        {project.alertRuleCount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Alert Rules
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-data-purple" />
                    <div>
                      <p className="text-2xl font-bold">
                        {project.teamMembers.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Team Members
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="w-5 h-5" />
                  <span>Project Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Project ID</Label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                        {project._id}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(project._id, "projectId")
                        }
                      >
                        {copiedField === "projectId" ? (
                          <Check className="w-4 h-4 text-status-ok" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">API Key</Label>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <code className="block p-2 bg-muted rounded text-sm font-mono pr-10">
                          {showApiKey
                            ? project.apiKey
                            : "••••••••-••••-••••-••••-••••••••••••"}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-2"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(project.apiKey, "apiKey")
                        }
                      >
                        {copiedField === "apiKey" ? (
                          <Check className="w-4 h-4 text-status-ok" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(project.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(project.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-data-info">
                      {project.metrics.averageResponseTime}ms
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Average Response Time
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-data-purple">
                      {project.metrics.performance.p95ResponseTime}ms
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      95th Percentile
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-status-ok">
                      {project.metrics.performance.uptimePercentage}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Uptime</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Error Rate</span>
                      <span className="text-sm text-muted-foreground">
                        {project.metrics.errorRate}%
                      </span>
                    </div>
                    <Progress
                      value={project.metrics.errorRate}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Health Score</span>
                      <span className="text-sm text-muted-foreground">
                        {project.metrics.healthScore}/100
                      </span>
                    </div>
                    <Progress
                      value={project.metrics.healthScore}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rate Limiting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Rate Limiting Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-status-warn">
                      {project.rateLimitConfig.maxRequestsPerMinute}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Max Requests/Minute
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-status-danger">
                      {project.rateLimitConfig.burstLimit}
                    </div>
                    <p className="text-sm text-muted-foreground">Burst Limit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            {/* Project Owner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Project Owner</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>
                      {getUserInitials(
                        project.ownerId.firstName,
                        project.ownerId.lastName
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {project.ownerId.firstName} {project.ownerId.lastName}
                    </p>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span>{project.ownerId.email}</span>
                    </div>
                  </div>
                  <Badge variant="outline">Owner</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Team Members ({project.teamMembers.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.teamMembers.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {getUserInitials(
                              member.user.firstName,
                              member.user.lastName
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span>{member.user.email}</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          member.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Project Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Project Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Project Status</p>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable logging for this project
                    </p>
                  </div>
                  <Badge variant={project.isActive ? "default" : "secondary"}>
                    {project.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Tags</p>
                    <p className="text-sm text-muted-foreground">
                      Organize your project with tags
                    </p>
                  </div>
                  <div>
                    {project.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No tags
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-status-danger/30">
              <CardHeader>
                <CardTitle className="text-status-danger">
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-status-danger/30 text-status-danger hover:bg-status-danger/10 bg-transparent"
                >
                  Reset API Key
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-status-danger/30 text-status-danger hover:bg-status-danger/10 bg-transparent"
                >
                  Delete Project
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <label className={className}>{children}</label>;
}
