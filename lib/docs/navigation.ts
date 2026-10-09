export interface DocItem {
  title: string;
  slug: string;
  description?: string;
  /** Works today but is still changing; shown with a beta label */
  beta?: boolean;
}

export interface DocSection {
  title: string;
  items: DocItem[];
}

export const docsNavigation: DocSection[] = [
  {
    title: "Getting started",
    items: [
      {
        title: "Introduction",
        slug: "introduction",
        description: "What Apperio does, how the pieces fit together, and what is still in beta.",
      },
      {
        title: "Quick start",
        slug: "quickstart",
        description: "Install the SDK, send your first error, and get notified about it.",
      },
      {
        title: "Environments and releases",
        slug: "environments-and-releases",
        description: "Tag every log with where it ran and which version of your code sent it.",
      },
    ],
  },
  {
    title: "Core concepts",
    items: [
      {
        title: "Projects and API keys",
        slug: "concepts/projects-and-api-keys",
        description: "What a project is, where to find its ID and API key, and how to replace a key.",
      },
      {
        title: "Errors and issues",
        slug: "concepts/errors-and-issues",
        description: "How Apperio groups errors into issues, counts sessions, and spots regressions.",
      },
      {
        title: "Connect GitHub",
        slug: "concepts/connect-github",
        description: "Install the GitHub App and link a repository and branch to a project.",
      },
      {
        title: "Commits and summaries",
        slug: "concepts/commits",
        description: "The Changes feed and the plain-English summary written for each commit.",
      },
      {
        title: "Deploys and verdicts",
        slug: "concepts/deploys",
        description: "How deploys reach Apperio and how each one is judged Healthy, Improved or Degraded.",
      },
      {
        title: "Suspect commits",
        slug: "concepts/suspect-commits",
        description: "How Apperio picks the commits most likely to have caused an error.",
      },
      {
        title: "GitHub issues",
        slug: "concepts/github-issues",
        description: "Turn an error into a drafted GitHub issue, and resolve it by closing the issue.",
      },
      {
        title: "Notifications and alerts",
        slug: "concepts/notifications-and-alerts",
        description: "Who hears about new errors, and how alert rules reach email, Slack and webhooks.",
      },
      {
        title: "Session replay",
        slug: "concepts/session-replay",
        description: "Watch what a visitor saw and did. Off by default; inputs are masked.",
        beta: true,
      },
      {
        title: "Performance and Web Vitals",
        slug: "concepts/performance",
        description: "Page loads, slow requests and Core Web Vitals from real visitors.",
      },
      {
        title: "Privacy and PII redaction",
        slug: "concepts/privacy",
        description: "What the SDK redacts before data leaves the page, and what it does not.",
      },
    ],
  },
  {
    title: "SDK reference",
    items: [
      {
        title: "Configuration",
        slug: "sdk/configuration",
        description: "Every option the Apperio constructor accepts, with its type and default.",
      },
      {
        title: "Logging methods",
        slug: "sdk/logging",
        description: "Log levels, structured data, context, and capturing errors by hand.",
      },
      {
        title: "Auto-instrumentation",
        slug: "sdk/auto-instrumentation",
        description: "What the SDK captures in the browser without any code, and at which level.",
      },
      {
        title: "Error tracking",
        slug: "sdk/error-tracking",
        description: "Uncaught errors in the browser, errors on the server, and what each report holds.",
      },
      {
        title: "Tracing",
        slug: "sdk/tracing",
        description: "Attach trace and span IDs to logs so you can follow one action across services.",
      },
      {
        title: "Data sanitization",
        slug: "sdk/data-sanitization",
        description: "Built-in redaction patterns, presets, custom rules and the audit trail.",
      },
      {
        title: "Replay options",
        slug: "sdk/replay",
        description: "Turn session replay on in code, choose a sample rate, and control masking.",
        beta: true,
      },
      {
        title: "Delivery and offline",
        slug: "sdk/delivery",
        description: "Batching, retries, the offline queue, and settings fetched from the dashboard.",
      },
      {
        title: "Sessions",
        slug: "sdk/sessions",
        description: "What a session is, how long it lasts, and how to read its ID.",
      },
      {
        title: "Shutdown",
        slug: "sdk/shutdown",
        description: "Send buffered logs before the page or process goes away.",
      },
      {
        title: "Troubleshooting",
        slug: "sdk/troubleshooting",
        description: "What to check when logs, errors or notifications do not show up.",
      },
    ],
  },
  {
    title: "Framework guides",
    items: [
      {
        title: "React",
        slug: "guides/react",
        description: "Set up Apperio in a React single-page app, with an error boundary.",
      },
      {
        title: "Next.js",
        slug: "guides/nextjs",
        description: "Run the SDK in the browser from the App Router, and on the server in route handlers.",
      },
      {
        title: "Node.js",
        slug: "guides/nodejs",
        description: "Log from servers, workers and scripts, and capture crashes yourself.",
      },
    ],
  },
  {
    title: "API reference",
    items: [
      {
        title: "Overview",
        slug: "api/overview",
        description: "Base URL, API key authentication, response format and errors.",
      },
      {
        title: "Logs",
        slug: "api/logs",
        description: "Send log entries without the SDK, one at a time or in batches of up to 100.",
      },
      {
        title: "Deployments",
        slug: "api/deployments",
        description: "Record a deploy from any CI system so Apperio can judge its impact.",
      },
      {
        title: "Source maps",
        slug: "api/source-maps",
        description: "Upload source maps so minified stack traces can be read.",
        beta: true,
      },
    ],
  },
];

/** Flatten all doc items for lookup */
export function getAllDocSlugs(): string[] {
  return docsNavigation.flatMap((section) => section.items.map((item) => item.slug));
}

/** Find a doc item by slug */
export function findDocBySlug(slug: string): DocItem | undefined {
  for (const section of docsNavigation) {
    const found = section.items.find((item) => item.slug === slug);
    if (found) return found;
  }
  return undefined;
}

/** Find the section a slug belongs to */
export function findSectionBySlug(slug: string): DocSection | undefined {
  return docsNavigation.find((section) => section.items.some((item) => item.slug === slug));
}

/** Get previous and next docs for pagination */
export function getAdjacentDocs(slug: string): {
  prev: DocItem | null;
  next: DocItem | null;
} {
  const allItems = docsNavigation.flatMap((section) => section.items);
  const currentIndex = allItems.findIndex((item) => item.slug === slug);

  return {
    prev: currentIndex > 0 ? allItems[currentIndex - 1] : null,
    next: currentIndex >= 0 && currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null,
  };
}
