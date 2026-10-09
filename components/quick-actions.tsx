import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, BarChart3, Shield, Code, Bell, Download, HelpCircle } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  const actions = [
    {
      title: "Create New Project",
      description: "Set up logging for a new application",
      icon: Plus,
      href: "/projects/new",
      variant: "default" as const,
    },
    {
      title: "View SDK Documentation",
      description: "Integration guides and code examples",
      icon: Code,
      href: "/docs",
      variant: "outline" as const,
    },
    {
      title: "Configure Alerts",
      description: "Set up notifications and alert rules",
      icon: Bell,
      href: "/alerts/rules",
      variant: "outline" as const,
    },
    {
      title: "Team Management",
      description: "Invite team members and manage permissions",
      icon: Users,
      href: "/team",
      variant: "outline" as const,
    },
    {
      title: "Analytics Dashboard",
      description: "Deep dive into your application metrics",
      icon: BarChart3,
      href: "/analytics",
      variant: "outline" as const,
    },
    {
      title: "Export Data",
      description: "Download logs and reports",
      icon: Download,
      href: "/export",
      variant: "outline" as const,
    },
    {
      title: "Security Settings",
      description: "Manage API keys and access controls",
      icon: Shield,
      href: "/security",
      variant: "outline" as const,
    },
    {
      title: "Help & Support",
      description: "Documentation, guides, and support",
      icon: HelpCircle,
      href: "/help",
      variant: "outline" as const,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts to get things done faster</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-auto p-4 flex flex-col items-start space-y-2 text-left"
              asChild
            >
              <Link href={action.href}>
                <action.icon className="w-5 h-5" />
                <div>
                  <div className="font-semibold text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
