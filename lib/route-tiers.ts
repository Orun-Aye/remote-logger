/**
 * Route tier definitions for beta feature gating.
 *
 * "core" routes are accessible to all beta users.
 * "advanced" routes show an UpgradeGate overlay when the user's betaTier is "core".
 */

// Advanced route path patterns (checked with startsWith)
export const ADVANCED_ROUTE_PREFIXES = [
  "/integrations",
  "/billing",
  "/organization",
] as const;

// Advanced sub-routes within project pages
export const ADVANCED_PROJECT_SUBROUTES = new Set([
  "funnels",
  "regressions",
  "insights",
  "web-vitals",
  "network",
  "interactions",
  "pageviews",
  "sessions",
  "traces",
  "environments",
  "source-maps",
]);

// Advanced sub-routes within project settings
export const ADVANCED_PROJECT_SETTINGS = new Set([
  "retention",
  "sampling",
  "sdk-config",
  "integrations",
]);

// Advanced alert sub-routes
export const ADVANCED_ALERT_ROUTES = new Set([
  "analytics",
  "escalation-policies",
  "maintenance-windows",
]);

// Advanced user settings routes
export const ADVANCED_SETTINGS_ROUTES = new Set([
  "preferences",
  "privacy",
  "tokens",
]);

/**
 * Check if a given pathname is an advanced (gated) route.
 */
export function isAdvancedRoute(pathname: string): boolean {
  // Top-level advanced prefixes
  for (const prefix of ADVANCED_ROUTE_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }

  // /projects/[id]/[subroute]
  const projectMatch = pathname.match(/^\/projects\/[^/]+\/(.+)/);
  if (projectMatch) {
    const subroute = projectMatch[1];
    const topSegment = subroute.split("/")[0];

    // Check project settings sub-routes
    if (topSegment === "settings") {
      const settingsSegment = subroute.split("/")[1];
      if (settingsSegment && ADVANCED_PROJECT_SETTINGS.has(settingsSegment)) {
        return true;
      }
      return false;
    }

    if (ADVANCED_PROJECT_SUBROUTES.has(topSegment)) return true;
  }

  // /alerts/[subroute]
  const alertMatch = pathname.match(/^\/alerts\/(.+)/);
  if (alertMatch) {
    const subroute = alertMatch[1].split("/")[0];
    if (ADVANCED_ALERT_ROUTES.has(subroute)) return true;
  }

  // /settings/[subroute]
  const settingsMatch = pathname.match(/^\/settings\/(.+)/);
  if (settingsMatch) {
    const subroute = settingsMatch[1].split("/")[0];
    if (ADVANCED_SETTINGS_ROUTES.has(subroute)) return true;
  }

  return false;
}

/**
 * Feature names for the UpgradeGate display.
 */
export const FEATURE_LABELS: Record<string, string> = {
  "funnels": "Funnel Analysis",
  "regressions": "Regression Detection",
  "insights": "AI-Powered Insights",
  "web-vitals": "Web Vitals Dashboard",
  "network": "Network Monitoring",
  "interactions": "User Interaction Tracking",
  "pageviews": "Pageview Analytics",
  "sessions": "Session Replay",
  "traces": "Distributed Tracing",
  "environments": "Environment Stats",
  "source-maps": "Source Map Management",
  "integrations": "Integrations Hub",
  "billing": "Billing & Plans",
  "organization": "Organization Management",
  "analytics": "Alert Analytics",
  "escalation-policies": "Escalation Policies",
  "maintenance-windows": "Maintenance Windows",
  "retention": "Data Retention Settings",
  "sampling": "Log Sampling Config",
  "sdk-config": "SDK Configuration",
  "preferences": "User Preferences",
  "privacy": "Privacy Settings",
  "tokens": "API Tokens",
};
