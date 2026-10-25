import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface SummaryWidgetProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
  trend: string
  variant?: string
  subtitle?: string
  details?: string
}

const variantStyles: Record<string, {
  icon: string
  border: string
  glow: string
}> = {
  success: {
    icon: "text-signal",
    border: "border-l-signal",
    glow: "",
  },
  destructive: {
    icon: "text-status-danger",
    border: "border-l-status-danger",
    glow: "",
  },
  warning: {
    icon: "text-status-warn",
    border: "border-l-status-warn",
    glow: "",
  },
  default: {
    icon: "text-data-info",
    border: "border-l-data-info",
    glow: "",
  },
}

export function SummaryWidget({
  title,
  value,
  change,
  icon: Icon,
  trend,
  variant = "default",
  subtitle,
  details,
}: SummaryWidgetProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return TrendingUp
      case "down":
        return TrendingDown
      default:
        return Minus
    }
  }

  const TrendIcon = getTrendIcon()

  const getTrendColor = () => {
    if (variant === "destructive") {
      return trend === "down" ? "text-status-ok" : "text-status-danger"
    }
    return trend === "up" ? "text-status-ok" : trend === "down" ? "text-status-danger" : "text-text-muted"
  }

  const styles = variantStyles[variant] || variantStyles.default

  return (
    <Card className={cn(
      "border-l-4 transition-all duration-200",
      styles.border,
      styles.glow,
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-text-secondary">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", styles.icon)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono text-text-primary">{value}</div>
        <div className="flex items-center space-x-1 text-xs mt-1">
          <TrendIcon className={cn("h-3 w-3", getTrendColor())} />
          <span className={getTrendColor()}>{change}</span>
          {subtitle && <span className="text-text-muted">{subtitle}</span>}
        </div>
        {details && <p className="text-xs text-text-muted mt-2">{details}</p>}
      </CardContent>
    </Card>
  )
}
