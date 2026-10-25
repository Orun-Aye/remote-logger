"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  XCircle,
} from "lucide-react";
import { useAlertEvents, useAcknowledgeAlert } from "@/hooks/useAlerts";
import { useProjects } from "@/hooks/project.hooks";
import { AlertEvent } from "@/types/alert.types";
import { formatDistanceToNow } from "date-fns";

export default function AlertEventsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "acknowledged" | "resolved"
  >("all");

  const { data: projectsData } = useProjects();
  const projects = projectsData?.data || [];

  const selectedProject = projects.find((p) => p._id === projectFilter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-8 h-8" />
          Alert Events
        </h1>
        <p className="text-muted-foreground mt-1">
          View and manage triggered alert events
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project._id} value={project._id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value: "all" | "active" | "acknowledged" | "resolved") => setStatusFilter(value)}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events List */}
      {projectFilter === "all" || !selectedProject ? (
        <Card>
          <CardHeader>
            <CardTitle>Select a Project</CardTitle>
            <CardDescription>
              Please select a project from the filter above to view alert events
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <AlertEventsContent
          projectId={selectedProject._id}
          statusFilter={statusFilter}
          searchTerm={searchTerm}
        />
      )}
    </div>
  );
}

function AlertEventsContent({
  projectId,
  statusFilter,
  searchTerm,
}: {
  projectId: string;
  statusFilter: "all" | "active" | "acknowledged" | "resolved";
  searchTerm: string;
}) {
  const { data, isLoading } = useAlertEvents(projectId, {
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const acknowledgeMutation = useAcknowledgeAlert();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const events = data?.events || [];

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle className="w-12 h-12 text-status-ok mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No alert events</h3>
          <p className="text-muted-foreground">
            All clear! No alerts have been triggered recently.
          </p>
        </CardContent>
      </Card>
    );
  }

  const filteredEvents = events.filter(
    (event) =>
      event.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.ruleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAcknowledge = (eventId: string) => {
    acknowledgeMutation.mutate({
      alertId: eventId,
      projectId,
    });
  };

  return (
    <div className="space-y-4">
      {filteredEvents.map((event) => (
        <AlertEventCard
          key={event._id}
          event={event}
          onAcknowledge={handleAcknowledge}
          isAcknowledging={acknowledgeMutation.isPending}
        />
      ))}
    </div>
  );
}

function AlertEventCard({
  event,
  onAcknowledge,
  isAcknowledging,
}: {
  event: AlertEvent;
  onAcknowledge: (id: string) => void;
  isAcknowledging: boolean;
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-status-danger bg-status-danger/10";
      case "high":
        return "border-status-warn bg-status-warn/10";
      case "medium":
        return "border-level-warn bg-level-warn/10";
      case "low":
        return "border-data-info bg-data-info/10";
      default:
        return "border-border-accent bg-gs-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="w-5 h-5 text-status-danger" />;
      case "acknowledged":
        return <Clock className="w-5 h-5 text-level-warn" />;
      case "resolved":
        return <CheckCircle className="w-5 h-5 text-status-ok" />;
      default:
        return <XCircle className="w-5 h-5 text-text-muted" />;
    }
  };

  return (
    <Card className={`border-l-4 ${getSeverityColor(event.severity)}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(event.status)}
              <CardTitle className="text-lg">{event.ruleName}</CardTitle>
              <Badge variant="outline" className="capitalize">
                {event.severity}
              </Badge>
            </div>
            <CardDescription>{event.message}</CardDescription>
          </div>
          {event.status === "active" && (
            <Button
              size="sm"
              onClick={() => onAcknowledge(event._id)}
              disabled={isAcknowledging}
            >
              Acknowledge
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Triggered</p>
            <p className="font-medium">
              {formatDistanceToNow(new Date(event.triggeredAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Count</p>
            <p className="font-medium">{event.count} occurrences</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <Badge
              variant={event.status === "active" ? "destructive" : "secondary"}
              className="capitalize"
            >
              {event.status}
            </Badge>
          </div>
          {event.acknowledgedAt && (
            <div>
              <p className="text-muted-foreground">Acknowledged</p>
              <p className="font-medium">
                {formatDistanceToNow(new Date(event.acknowledgedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          )}
        </div>
        {event.notes && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Notes</p>
            <p className="text-sm text-muted-foreground">{event.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
