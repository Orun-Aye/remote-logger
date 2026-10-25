"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Hash,
  Activity,
  Mail,
  MessageSquare,
  Webhook,
  ExternalLink,
} from "lucide-react"
// Legacy component — replaced by AlertDetailPanel/AlertDetailModal (enhanced)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Alert = any;

interface AlertDetailsModalProps {
  alert: Alert | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (alertId: string, newStatus: string) => void
}

export function AlertDetailsModal({ alert, open, onOpenChange, onStatusChange }: AlertDetailsModalProps) {
  if (!alert) return null

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-status-danger/15 text-status-danger border-status-danger/30"
      case "high":
        return "bg-status-warn/15 text-status-warn border-status-warn/30"
      case "medium":
        return "bg-level-warn/15 text-level-warn border-level-warn/30"
      case "low":
        return "bg-data-info/15 text-data-info border-data-info/30"
      default:
        return "bg-gs-100 text-text-secondary border-border-subtle"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-status-danger/15 text-status-danger border-status-danger/30"
      case "acknowledged":
        return "bg-level-warn/15 text-level-warn border-level-warn/30"
      case "resolved":
        return "bg-status-ok/15 text-status-ok border-status-ok/30"
      case "snoozed":
        return "bg-data-purple/10 text-data-purple border-transparent"
      default:
        return "bg-gs-100 text-text-secondary border-border-subtle"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-status-danger" />
      case "high":
        return <AlertTriangle className="w-5 h-5 text-status-warn" />
      case "medium":
        return <Bell className="w-5 h-5 text-level-warn" />
      case "low":
        return <Bell className="w-5 h-5 text-data-info" />
      default:
        return <Bell className="w-5 h-5 text-text-muted" />
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  // Mock activity data based on alert properties
  const activityLog = [
    {
      id: "1",
      action: "Alert Triggered",
      timestamp: alert.lastTriggered,
      user: "System",
      details: `Alert triggered due to ${alert.source} conditions`,
    },
    {
      id: "2",
      action: "Alert Created",
      timestamp: alert.createdAt,
      user: "System",
      details: `Alert rule created for ${alert.project}`,
    },
  ]

  if (alert.status === "acknowledged") {
    activityLog.unshift({
      id: "3",
      action: "Alert Acknowledged",
      timestamp: alert.updatedAt,
      user: "Unknown",
      details: "Alert has been acknowledged and is being investigated",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {getSeverityIcon(alert.severity)}
              <div>
                <DialogTitle className="text-xl">{alert.title}</DialogTitle>
                <DialogDescription className="mt-1">{alert.message}</DialogDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
              <Badge className={getStatusColor(alert.status)}>{alert.status}</Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Alert Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Project</span>
                    <span className="text-sm font-medium">{alert.project}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Environment</span>
                    <span className="text-sm font-medium">{alert.environment}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Source</span>
                    <span className="text-sm font-medium">{alert.source}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Count</span>
                    <span className="text-sm font-medium">{alert.count}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm font-medium">{formatTimeAgo(alert.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Triggered</span>
                    <span className="text-sm font-medium">{formatTimeAgo(alert.lastTriggered)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Updated</span>
                    <span className="text-sm font-medium">{formatTimeAgo(alert.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {alert.tags.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {alert.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Technical Details</CardTitle>
                <CardDescription>Detailed information about this alert</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Alert ID</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">{alert.id}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Created At</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatDateTime(alert.createdAt)}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Alert Description</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <span className="text-sm font-medium">Notification Channels</span>
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-data-info" />
                      <span className="text-sm">Email</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-status-ok" />
                      <span className="text-sm">Slack</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Webhook className="w-4 h-4 text-data-purple" />
                      <span className="text-sm">Webhook</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Log</CardTitle>
                <CardDescription>Recent activity and changes for this alert</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLog.map((activity, index) => (
                    <div key={activity.id} className="flex space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-data-info/15 rounded-full flex items-center justify-center">
                          <Activity className="w-4 h-4 text-data-info" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.details}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{activity.user}</span>
                        </div>
                      </div>
                      {index < activityLog.length - 1 && <div className="absolute left-4 mt-8 w-px h-4 bg-border-subtle" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Manage this alert's status and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => onStatusChange(alert.id, "acknowledged")}
                    disabled={alert.status === "acknowledged"}
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Acknowledge
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onStatusChange(alert.id, "resolved")}
                    disabled={alert.status === "resolved"}
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onStatusChange(alert.id, "snoozed")}
                    disabled={alert.status === "snoozed"}
                    className="w-full"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Snooze
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Logs
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <span className="text-sm font-medium">Additional Actions</span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Edit Rule
                    </Button>
                    <Button variant="outline" size="sm">
                      Duplicate
                    </Button>
                    <Button variant="outline" size="sm">
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
