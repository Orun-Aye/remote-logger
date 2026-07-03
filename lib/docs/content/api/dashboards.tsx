import {
  DocsContent,
  DocH2,
  DocP,
  DocCallout,
  DocTable,
  CodeBlock,
  InlineCode,
  EndpointBlock,
  DocsTableOfContents,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "overview-endpoint", title: "Dashboard Overview", level: 2 },
  { id: "metrics", title: "Comprehensive Metrics", level: 2 },
  { id: "realtime", title: "Real-Time Metrics", level: 2 },
  { id: "timeseries", title: "Time Series Data", level: 2 },
  { id: "errors", title: "Error Analysis", level: 2 },
  { id: "performance", title: "Performance Metrics", level: 2 },
  { id: "export", title: "Data Export", level: 2 },
];

export default function ApiDashboardsPage() {
  return (
    <div className="flex">
      <DocsContent
        slug="api/dashboards"
        title="Dashboards API"
        description="Dashboard metrics, analytics, time series, and export endpoints."
      >
        <DocH2 id="overview-endpoint">Dashboard Overview</DocH2>
        <EndpointBlock
          method="GET"
          path="/api/v1/dashboard/overview"
          description="Get high-level dashboard summary"
        />
        <DocP>
          Returns aggregated metrics across all user projects including log
          counts, error rates, active users, and health status.
        </DocP>
        <CodeBlock
          language="json"
          code={`// Response
{
  "status": "success",
  "data": {
    "summary": {
      "totalLogs": 45230,
      "totalErrors": 520,
      "errorRate": 1.15,
      "totalProjects": 5,
      "averageResponseTime": 187
    },
    "health": {
      "healthyProjects": 4,
      "warningProjects": 1,
      "criticalProjects": 0
    },
    "realTime": {
      "activeUsers": 23,
      "currentRPS": 45
    },
    "topIssues": {
      "mostFrequentError": "TypeError: Cannot read properties",
      "slowestEndpoint": "/api/reports/generate"
    },
    "trends": {
      "logVolumeChange": 12.5,
      "errorRateChange": -2.3
    }
  }
}`}
        />

        <DocH2 id="metrics">Comprehensive Metrics</DocH2>
        <EndpointBlock
          method="GET"
          path="/api/v1/dashboard/metrics"
          description="Get detailed metrics with time range filtering"
        />
        <DocTable
          headers={["Parameter", "Type", "Description"]}
          rows={[
            [
              <InlineCode key="tr">timeRange</InlineCode>,
              "string",
              '"1h", "24h", "7d", "30d" (default: "24h")',
            ],
            [
              <InlineCode key="pid">projectId</InlineCode>,
              "string",
              "Filter by specific project (optional)",
            ],
          ]}
        />

        <DocH2 id="realtime">Real-Time Metrics</DocH2>
        <EndpointBlock
          method="GET"
          path="/api/v1/dashboard/realtime"
          description="Get current real-time metrics"
        />
        <DocP>
          Returns live data including current request rate, active sessions,
          and most recent errors. This endpoint is optimized for frequent
          polling (every 10-30 seconds).
        </DocP>
        <CodeBlock
          language="json"
          code={`// Response
{
  "status": "success",
  "data": {
    "currentRPS": 45,
    "activeUsers": 23,
    "recentErrors": [
      {
        "message": "TypeError: Cannot read...",
        "timestamp": "2026-03-07T10:35:12Z",
        "count": 3
      }
    ],
    "uptimePercent": 99.97
  }
}`}
        />

        <DocH2 id="timeseries">Time Series Data</DocH2>
        <EndpointBlock
          method="GET"
          path="/api/v1/dashboard/timeseries"
          description="Get time-bucketed log data for charts"
        />
        <DocTable
          headers={["Parameter", "Type", "Description"]}
          rows={[
            [
              <InlineCode key="tr">timeRange</InlineCode>,
              "string",
              "Time range for the series",
            ],
            [
              <InlineCode key="gr">granularity</InlineCode>,
              "string",
              '"minute", "hour", "day"',
            ],
            [
              <InlineCode key="mt">metric</InlineCode>,
              "string",
              '"logCount", "errorRate", "responseTime"',
            ],
          ]}
        />
        <CodeBlock
          language="json"
          code={`// Response
{
  "status": "success",
  "data": {
    "series": [
      { "timestamp": "2026-03-07T00:00:00Z", "value": 1230 },
      { "timestamp": "2026-03-07T01:00:00Z", "value": 980 },
      { "timestamp": "2026-03-07T02:00:00Z", "value": 450 },
      { "timestamp": "2026-03-07T03:00:00Z", "value": 320 }
    ],
    "granularity": "hour",
    "metric": "logCount"
  }
}`}
        />

        <DocH2 id="errors">Error Analysis</DocH2>
        <EndpointBlock
          method="GET"
          path="/api/v1/dashboard/errors"
          description="Get error analysis and grouping data"
        />
        <DocP>
          Returns errors grouped by message, with occurrence counts, first/last
          seen timestamps, and affected environments.
        </DocP>

        <DocH2 id="performance">Performance Metrics</DocH2>
        <EndpointBlock
          method="GET"
          path="/api/v1/dashboard/performance"
          description="Get performance analysis data"
        />
        <CodeBlock
          language="json"
          code={`// Response
{
  "status": "success",
  "data": {
    "averageResponseTime": 187,
    "p95ResponseTime": 450,
    "p99ResponseTime": 890,
    "slowestEndpoints": [
      { "endpoint": "/api/reports/generate", "responseTime": 2340 },
      { "endpoint": "/api/export/csv", "responseTime": 1870 }
    ],
    "pageLoadTimes": [
      { "page": "/dashboard", "loadTime": 1200 },
      { "page": "/logs", "loadTime": 980 }
    ],
    "networkStats": {
      "totalRequests": 45230,
      "failureRate": 0.8,
      "averageRequestTime": 145,
      "slowRequests": 23
    }
  }
}`}
        />

        <DocH2 id="export">Data Export</DocH2>
        <EndpointBlock
          method="POST"
          path="/api/v1/dashboard/export"
          description="Export dashboard data in various formats"
        />
        <CodeBlock
          language="json"
          code={`// Request body
{
  "format": "csv",         // "csv" or "json"
  "timeRange": "7d",
  "projectId": "proj_abc123",
  "metrics": ["logCount", "errorRate", "responseTime"]
}`}
        />

        <DocCallout type="info">
          Dashboard endpoints use Redis caching with a 5-minute TTL for
          expensive aggregation queries. Use the insights invalidation
          endpoint to force a cache refresh when needed:{" "}
          <InlineCode>GET /api/v1/insights/:projectId/invalidate</InlineCode>
        </DocCallout>
      </DocsContent>
      <DocsTableOfContents items={toc} />
    </div>
  );
}
