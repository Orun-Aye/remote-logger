import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const analyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The old standalone SDK page, replaced by /docs
      { source: "/sdk", destination: "/docs", permanent: true },
      // Docs pages that were renamed or folded into others
      { source: "/docs/installation", destination: "/docs/quickstart", permanent: true },
      { source: "/docs/sdk/overview", destination: "/docs/sdk/logging", permanent: true },
      { source: "/docs/sdk/web-vitals", destination: "/docs/concepts/performance", permanent: true },
      { source: "/docs/api/authentication", destination: "/docs/api/overview", permanent: true },
      { source: "/docs/api/projects", destination: "/docs/api/overview", permanent: true },
      { source: "/docs/api/dashboards", destination: "/docs/api/overview", permanent: true },
      { source: "/docs/api/alerts", destination: "/docs/concepts/notifications-and-alerts", permanent: true },
    ];
  },
};

export default analyzer(nextConfig);
