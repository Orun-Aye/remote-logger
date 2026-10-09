import {
  DocPage,
  DocH2,
  DocP,
  DocUl,
  DocLi,
  DocStrong,
  DocLink,
  DocCallout,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "projects", title: "Projects", level: 2 },
  { id: "project-id", title: "Project ID", level: 2 },
  { id: "api-key", title: "API key", level: 2 },
  { id: "replacing-a-key", title: "Replacing a key", level: 2 },
  { id: "team", title: "Team members", level: 2 },
  { id: "retention", title: "How long data is kept", level: 2 },
];

export default function ProjectsAndApiKeysPage() {
  return (
    <DocPage slug="concepts/projects-and-api-keys" toc={toc}>
      <DocH2 id="projects">Projects</DocH2>
      <DocP>
        A project is one site or app. Its logs, issues, sessions, linked GitHub repository,
        team and settings all belong to it. If you run a website and a separate API, you can
        send both to one project and tell them apart with{" "}
        <InlineCode>serviceName</InlineCode>, or give each its own project.
      </DocP>

      <DocH2 id="project-id">Project ID</DocH2>
      <DocP>
        Every project has an ID, a 24-character string. The SDK needs it, and so does every
        API call. Find it in the dashboard address after <InlineCode>/projects/</InlineCode>,
        or in the code preview on <DocStrong>Settings › SDK Config</DocStrong>.
      </DocP>

      <DocH2 id="api-key">API key</DocH2>
      <DocP>
        Each project has one API key. The SDK sends it in the{" "}
        <InlineCode>X-API-Key</InlineCode> header with every request, and your CI uses it to
        record deploys. Find it in <DocStrong>Settings › API Key</DocStrong>.
      </DocP>
      <DocCallout type="warning" title="Treat the key as public">
        When the SDK runs in a browser, the key is part of your site’s JavaScript, so anyone
        who opens the page can read it and send data to your project with it. Don’t paste it
        anywhere you wouldn’t paste your site’s source. If someone sends junk with it,
        replace it.
      </DocCallout>

      <DocH2 id="replacing-a-key">Replacing a key</DocH2>
      <DocP>
        <DocStrong>Settings › API Key › Regenerate API Key</DocStrong> issues a new key. The
        old one stops working at once, so:
      </DocP>
      <DocUl>
        <DocLi>update your app and deploy it, or logs from visitors on the old build are rejected;</DocLi>
        <DocLi>update the key in any CI job that records deploys or uploads source maps.</DocLi>
      </DocUl>
      <DocP>Keys don’t expire on their own.</DocP>

      <DocH2 id="team">Team members</DocH2>
      <DocP>
        Add people in <DocStrong>Settings › Team</DocStrong> as an{" "}
        <DocStrong>admin</DocStrong> or a <DocStrong>viewer</DocStrong>. Everyone on the team
        can see the project. Changing things, such as resolving or ignoring an issue,
        creating a GitHub issue, or re-syncing commits, needs the owner or an admin.
      </DocP>
      <DocP>
        New-error notifications go to the project owner only. See{" "}
        <DocLink href="/docs/concepts/notifications-and-alerts">Notifications and alerts</DocLink>{" "}
        for ways to reach the rest of the team.
      </DocP>

      <DocH2 id="retention">How long data is kept</DocH2>
      <DocUl>
        <DocLi>
          <DocStrong>Logs</DocStrong> are kept for 30 days by default. Change it in{" "}
          <DocStrong>Settings › Retention</DocStrong>.
        </DocLi>
        <DocLi>
          <DocStrong>Session replays</DocStrong> are deleted 7 days after they are recorded.
        </DocLi>
      </DocUl>
    </DocPage>
  );
}
