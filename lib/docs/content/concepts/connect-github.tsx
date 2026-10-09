import {
  DocPage,
  DocH2,
  DocP,
  DocOl,
  DocUl,
  DocLi,
  DocStrong,
  DocLink,
  DocCallout,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "what-you-get", title: "What connecting gives you", level: 2 },
  { id: "install-the-app", title: "1. Install the GitHub App", level: 2 },
  { id: "link-a-repository", title: "2. Link a repository and branch", level: 2 },
  { id: "what-happens-next", title: "What happens next", level: 2 },
  { id: "personal-token", title: "Using a personal token instead", level: 2 },
  { id: "organizations", title: "Organization repositories", level: 2 },
];

export default function ConnectGithubPage() {
  return (
    <DocPage slug="concepts/connect-github" toc={toc}>
      <DocH2 id="what-you-get">What connecting gives you</DocH2>
      <DocUl>
        <DocLi>
          the <DocLink href="/docs/concepts/commits">Changes feed</DocLink>, with a
          plain-English summary of each commit;
        </DocLi>
        <DocLi>
          <DocLink href="/docs/concepts/deploys">deploys and verdicts</DocLink> from your
          GitHub deployments and releases;
        </DocLi>
        <DocLi>
          <DocLink href="/docs/concepts/suspect-commits">Likely caused by</DocLink> on each
          issue;
        </DocLi>
        <DocLi>
          <DocLink href="/docs/concepts/github-issues">GitHub issues</DocLink> created from
          errors, which resolve the error when you close them.
        </DocLi>
      </DocUl>

      <DocH2 id="install-the-app">1. Install the GitHub App</DocH2>
      <DocOl>
        <DocLi>
          Open your project, then <DocStrong>Settings › Integrations</DocStrong>.
        </DocLi>
        <DocLi>
          On the GitHub App card, choose <DocStrong>Install GitHub App</DocStrong>.
        </DocLi>
        <DocLi>
          On GitHub, pick the account and the repositories Apperio may use, then confirm.
          GitHub sends you back to the same settings page.
        </DocLi>
      </DocOl>
      <DocP>
        The card then reads <DocStrong>Connected via GitHub App</DocStrong>. If it says{" "}
        <DocStrong>App installed, repo not covered</DocStrong>, the installation doesn’t
        include the repository you linked: add it on GitHub with{" "}
        <DocStrong>Manage installation</DocStrong>.
      </DocP>

      <DocH2 id="link-a-repository">2. Link a repository and branch</DocH2>
      <DocP>
        In the <DocStrong>Linked Repository</DocStrong> card on the same page, search for the
        repository and pick it, check the <DocStrong>Branch</DocStrong> field, then choose{" "}
        <DocStrong>Link</DocStrong>. Use the branch you deploy from, usually{" "}
        <InlineCode>main</InlineCode>. A project tracks one repository and one branch.
      </DocP>

      <DocH2 id="what-happens-next">What happens next</DocH2>
      <DocUl>
        <DocLi>
          Apperio imports the last 50 commits on that branch, plus the repository’s
          published releases and deployments. The 10 newest commits get summaries.
        </DocLi>
        <DocLi>
          From then on, every push to the branch arrives within seconds through the App.
          Pushes to other branches are ignored, and so are GitHub deployments of other
          branches.
        </DocLi>
        <DocLi>
          <DocStrong>Sync from GitHub</DocStrong> on the Changes page imports again, for
          anything missed.
        </DocLi>
      </DocUl>
      <DocCallout type="tip" title="Connect GitHub before errors happen">
        Suspect commits are worked out from the commits Apperio already has when an issue is
        first opened. Commits imported later aren’t considered for older issues.
      </DocCallout>

      <DocH2 id="personal-token">Using a personal token instead</DocH2>
      <DocP>
        If the App isn’t installed, you can connect your own GitHub account in your account
        settings and link a repository with it. This is a fallback with limits:
      </DocP>
      <DocUl>
        <DocLi>
          GitHub only sends live updates to the App, so commits arrive when you link the
          repository or press <DocStrong>Sync from GitHub</DocStrong>, not on every push;
        </DocLi>
        <DocLi>closing a GitHub issue doesn’t resolve the Apperio issue;</DocLi>
        <DocLi>
          access depends on your token, so it stops when you revoke it or leave the
          organization.
        </DocLi>
      </DocUl>
      <DocP>Install the App for the full experience.</DocP>

      <DocH2 id="organizations">Organization repositories</DocH2>
      <DocP>
        If you aren’t an owner of the GitHub organization, the install becomes a request,
        and the dashboard says an organization owner needs to approve it. Once they do, the
        repository can be linked.
      </DocP>
    </DocPage>
  );
}
