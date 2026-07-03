export interface LogEntry {
  _id: string
  projectId: string
  timestamp: string
  level: "trace" | "debug" | "info" | "warn" | "error" | "fatal"
  message: string
  data?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
    url?: string
    lineNumber?: number
    columnNumber?: number
  }
  service?: string
  environment?: string
  context?: Record<string, any>
  eventType?: "error" | "performance" | "interaction" | "network" | "console" | "pageview"
  userAgent?: string
  url?: string
  referrer?: string
  correlationId?: string
  sessionId?: string
  metadata?: Record<string, any>
  release?: string
  traceId?: string
}

export interface Project {
  id: string
  name: string
  environment: string
  status: "healthy" | "warning" | "critical"
  lastEvent: string
  errorCount: number
  totalEvents: number
  errorRate: number
  avgResponseTime: number
  uptime: number
  activeUsers: number
  avgPageLoad: number
}

export interface ErrorSummary {
  id: string
  type: string
  message: string
  count: number
  affectedProjects: string[]
  lastSeen: string
  trend: "up" | "down" | "stable"
}


export interface ChartDataPoint {
  timestamp: string
  errors: number
  warnings: number
  info: number
  performance: number
  network: number
}

export interface LogFilters {
  level?: LogEntry['level'] | 'all';
  levels?: LogEntry['level'][]; // Support multiple levels
  source?: string;
  service?: string;
  services?: string[]; // Support multiple services
  startDate?: string;
  endDate?: string;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  release?: string;
}

export interface LogSummary {
  totalLogs: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  debugCount: number;
  uniqueServices: number;
  timeRange: {
    from: string;
    to: string;
  };
}

export interface LogTrends {
  timeRange: string;
  data: Array<{
    timestamp: string;
    total: number;
    error: number;
    warn: number;
    info: number;
    debug: number;
  }>;
}

export interface UniqueError {
  message: string;
  count: number;
  lastOccurred: string;
  firstOccurred: string;
  affectedServices: string[];
}

export type TimeRange = "24h" | "7d" | "30d" | "custom"
export type Environment = "production" | "staging" | "development" | "all"

