import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, AlertTriangle, Info, CheckCircle, Settings } from "lucide-react"
import Link from "next/link"

export function AlertsOverview() {
  const recentAlerts = [
    {
      id: 1,
      type: "critical",
      title: "High Error Rate",
      project: "web-app",
      time: "2m ago",
    },
    {
      id: 2,
      type: "warning",
      title: "Memory Usage High",
      project: "api-service",
      time: "8m ago",
    },
    {
      id: 3,
      type: "info",
      title: "Deployment Complete",
      project: "worker-queue",
      time: "15m ago",
    },
    {
      id: 4,
      type: "resolved",
      title: "Database Slow Query",
      project: "web-app",
      time: "1h ago",
    },
  ]

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-status-danger" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-status-warn" />
      case "info":
        return <Info className="w-4 h-4 text-data-info" />
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-status-ok" />
      default:
        return <Bell className="w-4 h-4 text-text-muted" />
    }
  }

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "critical":
        return "destructive"
      case "warning":
        return "secondary"
      case "info":
        return "default"
      case "resolved":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Recent Alerts</span>
            </CardTitle>
            <CardDescription>Latest notifications and alerts</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/alerts">
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center space-x-3 p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {getAlertIcon(alert.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm truncate">{alert.title}</h4>
                  <Badge variant={getAlertBadge(alert.type) as any} className="text-xs">
                    {alert.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {alert.project} • {alert.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-status-danger">3</div>
              <div className="text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-status-warn">8</div>
              <div className="text-muted-foreground">Warning</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
