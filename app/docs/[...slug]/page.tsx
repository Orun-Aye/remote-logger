import { notFound } from "next/navigation";
import { Metadata } from "next";
import { findDocBySlug, findSectionBySlug, getAllDocSlugs } from "@/lib/docs/navigation";

/* ─── Content page imports ─────────────────────────────────────────────── */
import IntroductionPage from "@/lib/docs/content/introduction";
import QuickStartPage from "@/lib/docs/content/quickstart";
import EnvironmentsAndReleasesPage from "@/lib/docs/content/environments-and-releases";
import ProjectsAndApiKeysPage from "@/lib/docs/content/concepts/projects-and-api-keys";
import ErrorsAndIssuesPage from "@/lib/docs/content/concepts/errors-and-issues";
import ConnectGithubPage from "@/lib/docs/content/concepts/connect-github";
import CommitsPage from "@/lib/docs/content/concepts/commits";
import DeploysPage from "@/lib/docs/content/concepts/deploys";
import SuspectCommitsPage from "@/lib/docs/content/concepts/suspect-commits";
import GithubIssuesPage from "@/lib/docs/content/concepts/github-issues";
import NotificationsAndAlertsPage from "@/lib/docs/content/concepts/notifications-and-alerts";
import SessionReplayConceptPage from "@/lib/docs/content/concepts/session-replay";
import PerformancePage from "@/lib/docs/content/concepts/performance";
import PrivacyPage from "@/lib/docs/content/concepts/privacy";
import SdkConfigurationPage from "@/lib/docs/content/sdk/configuration";
import SdkLoggingPage from "@/lib/docs/content/sdk/logging";
import AutoInstrumentationPage from "@/lib/docs/content/sdk/auto-instrumentation";
import ErrorTrackingPage from "@/lib/docs/content/sdk/error-tracking";
import TracingPage from "@/lib/docs/content/sdk/tracing";
import DataSanitizationPage from "@/lib/docs/content/sdk/data-sanitization";
import SdkReplayPage from "@/lib/docs/content/sdk/replay";
import DeliveryPage from "@/lib/docs/content/sdk/delivery";
import SessionsPage from "@/lib/docs/content/sdk/sessions";
import ShutdownPage from "@/lib/docs/content/sdk/shutdown";
import TroubleshootingPage from "@/lib/docs/content/sdk/troubleshooting";
import ReactGuidePage from "@/lib/docs/content/guides/react";
import NextjsGuidePage from "@/lib/docs/content/guides/nextjs";
import NodejsGuidePage from "@/lib/docs/content/guides/nodejs";
import ApiOverviewPage from "@/lib/docs/content/api/overview";
import ApiLogsPage from "@/lib/docs/content/api/logs";
import ApiDeploymentsPage from "@/lib/docs/content/api/deployments";
import ApiSourceMapsPage from "@/lib/docs/content/api/source-maps";

/* ─── Slug-to-component mapping ────────────────────────────────────────── */
const pageComponents: Record<string, React.ComponentType> = {
  introduction: IntroductionPage,
  quickstart: QuickStartPage,
  "environments-and-releases": EnvironmentsAndReleasesPage,
  "concepts/projects-and-api-keys": ProjectsAndApiKeysPage,
  "concepts/errors-and-issues": ErrorsAndIssuesPage,
  "concepts/connect-github": ConnectGithubPage,
  "concepts/commits": CommitsPage,
  "concepts/deploys": DeploysPage,
  "concepts/suspect-commits": SuspectCommitsPage,
  "concepts/github-issues": GithubIssuesPage,
  "concepts/notifications-and-alerts": NotificationsAndAlertsPage,
  "concepts/session-replay": SessionReplayConceptPage,
  "concepts/performance": PerformancePage,
  "concepts/privacy": PrivacyPage,
  "sdk/configuration": SdkConfigurationPage,
  "sdk/logging": SdkLoggingPage,
  "sdk/auto-instrumentation": AutoInstrumentationPage,
  "sdk/error-tracking": ErrorTrackingPage,
  "sdk/tracing": TracingPage,
  "sdk/data-sanitization": DataSanitizationPage,
  "sdk/replay": SdkReplayPage,
  "sdk/delivery": DeliveryPage,
  "sdk/sessions": SessionsPage,
  "sdk/shutdown": ShutdownPage,
  "sdk/troubleshooting": TroubleshootingPage,
  "guides/react": ReactGuidePage,
  "guides/nextjs": NextjsGuidePage,
  "guides/nodejs": NodejsGuidePage,
  "api/overview": ApiOverviewPage,
  "api/logs": ApiLogsPage,
  "api/deployments": ApiDeploymentsPage,
  "api/source-maps": ApiSourceMapsPage,
};

/* ─── Static params for SSG ────────────────────────────────────────────── */
export function generateStaticParams() {
  return getAllDocSlugs().map((slug) => ({
    slug: slug.split("/"),
  }));
}

// Every page is prerendered; anything else is a 404
export const dynamicParams = false;

/* ─── Metadata ─────────────────────────────────────────────────────────── */
interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const fullSlug = slug.join("/");
  const doc = findDocBySlug(fullSlug);
  const section = findSectionBySlug(fullSlug);

  if (!doc) {
    return { title: "Not found | Apperio docs" };
  }

  return {
    title: `${doc.title} | ${section?.title ?? "Docs"} | Apperio docs`,
    description: doc.description ?? `${doc.title} in the Apperio documentation`,
    alternates: { canonical: `/docs/${fullSlug}` },
  };
}

/* ─── Page component ───────────────────────────────────────────────────── */
export default async function DocsPage({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = slug.join("/");
  const PageComponent = pageComponents[fullSlug];

  if (!PageComponent) {
    notFound();
  }

  return <PageComponent />;
}
