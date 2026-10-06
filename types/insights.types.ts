// Insights Types (mirror logger_backend DashboardInsights)

/** A count in the selected period vs the same-length period before it. */
export interface PeriodComparison {
  currentPeriod: number;
  previousPeriod: number;
  /** 0 when the previous period had none. */
  percentageChange: number;
}

export interface FrequentErrorMessage {
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  affectedEndpoints: string[];
}

/** GET /insights/:projectId */
export interface ProjectInsights {
  projectId: string;
  timeRange: { from: string; to: string; range: InsightsRange };
  summary: {
    totalLogs: number;
    totalUniqueEndpoints: number;
    averageLogsPerDay: number;
    /** Percentage, 0 to 100. */
    errorRate: number;
  };
  logCountBySeverity: Record<string, number>;
  errorAnalysis: {
    frequentErrorMessages: FrequentErrorMessage[];
    errorTrends: PeriodComparison;
  };
  /** Absent on responses cached before the field existed. */
  volumeTrends?: PeriodComparison;
}

export type InsightsRange = "1h" | "24h" | "7d" | "30d";

export interface InsightsFilters {
  range?: InsightsRange;
}

// ============================================
// AI Insights Types
// ============================================

export interface RootCauseAnalysis {
  analysis: string;
  source: "ai" | "heuristic";
  confidence: "high" | "medium" | "low";
}

export interface AskQuestionResponse {
  answer: string;
  source: "ai" | "heuristic";
}

export interface OptimizationSuggestion {
  title: string;
  description: string;
  priority: string;
  source: "ai" | "heuristic";
}

export interface EnrichedInsights {
  insights: ProjectInsights;
  aiSummary: string | null;
  anomalyCount: number;
  source: "ai" | "heuristic";
}
