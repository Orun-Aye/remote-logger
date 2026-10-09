import {
  DocPage,
  DocH2,
  DocP,
  DocUl,
  DocOl,
  DocLi,
  DocStrong,
  DocLink,
  DocCallout,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "what-apperio-does", title: "What Apperio does", level: 2 },
  { id: "how-it-fits-together", title: "How it fits together", level: 2 },
  { id: "what-you-see", title: "What you see in the dashboard", level: 2 },
  { id: "access", title: "Getting access", level: 2 },
  { id: "where-to-start", title: "Where to start", level: 2 },
];

export default function IntroductionPage() {
  return (
    <DocPage slug="introduction" toc={toc}>
      <DocH2 id="what-apperio-does">What Apperio does</DocH2>
      <DocP>
        Apperio tells you when your site or app breaks or slows down, what visitors were
        doing when it happened, and which change caused it. It explains each change in plain
        English and drafts the bug report for whoever does the fixing.
      </DocP>
      <DocP>
        Most error trackers stop at the error. Apperio also keeps a record of what you
        shipped: every commit on the branch you deploy from, and every deploy. When a new
        error appears, it is lined up against that record, so you can see which commit
        probably caused it and whether your last deploy made things better or worse.
      </DocP>

      <DocH2 id="how-it-fits-together">How it fits together</DocH2>
      <DocP>Three things feed a project:</DocP>
      <DocOl>
        <DocLi>
          <DocStrong>The SDK.</DocStrong> The <InlineCode>apperio</InlineCode> package runs in
          your app. In the browser it reports uncaught errors, page views, slow requests and
          Web Vitals on its own, and sends anything you log yourself. It works in Node.js too,
          for logs you send by hand.
        </DocLi>
        <DocLi>
          <DocStrong>GitHub.</DocStrong> The Apperio GitHub App sends the commits pushed to
          the branch you link, plus deployments, releases and issue events from that
          repository.
        </DocLi>
        <DocLi>
          <DocStrong>Deploys.</DocStrong> Apperio picks up GitHub deployments and releases on
          its own. If you deploy some other way, one API call from your CI job records the
          deploy.
        </DocLi>
      </DocOl>

      <DocH2 id="what-you-see">What you see in the dashboard</DocH2>
      <DocUl>
        <DocLi>
          <DocStrong>Issues.</DocStrong> Errors grouped by cause, with how often each happened
          and how many sessions it reached. When a new kind of error appears, the project
          owner is notified without any setup. See{" "}
          <DocLink href="/docs/concepts/errors-and-issues">Errors and issues</DocLink>.
        </DocLi>
        <DocLi>
          <DocStrong>Changes.</DocStrong> Every commit and deploy, each commit with a short
          summary written in plain English. See{" "}
          <DocLink href="/docs/concepts/commits">Commits and summaries</DocLink>.
        </DocLi>
        <DocLi>
          <DocStrong>Deploy verdicts.</DocStrong> An hour after each deploy, Apperio compares
          the error rate before and after and labels it Improved, Healthy or Degraded. See{" "}
          <DocLink href="/docs/concepts/deploys">Deploys and verdicts</DocLink>.
        </DocLi>
        <DocLi>
          <DocStrong>Likely caused by.</DocStrong> For each issue, the recent commits most
          likely to have caused it, with a one-line reason. See{" "}
          <DocLink href="/docs/concepts/suspect-commits">Suspect commits</DocLink>.
        </DocLi>
        <DocLi>
          <DocStrong>GitHub issues.</DocStrong> One click drafts a GitHub issue from the
          error. Closing that issue on GitHub resolves the error in Apperio. See{" "}
          <DocLink href="/docs/concepts/github-issues">GitHub issues</DocLink>.
        </DocLi>
        <DocLi>
          <DocStrong>Session replay (beta).</DocStrong> A recording of what a visitor saw and
          did, with form inputs masked. Off until you turn it on. See{" "}
          <DocLink href="/docs/concepts/session-replay">Session replay</DocLink>.
        </DocLi>
        <DocLi>
          <DocStrong>Web Vitals and performance.</DocStrong> Page load times, slow requests
          and Core Web Vitals from real visits. See{" "}
          <DocLink href="/docs/concepts/performance">Performance and Web Vitals</DocLink>.
        </DocLi>
      </DocUl>

      <DocH2 id="access">Getting access</DocH2>
      <DocP>
        Apperio is in private beta. Join the waitlist on{" "}
        <DocLink href="/">apperio.dev</DocLink>. Once your account has beta access, sign in
        and create a project. An account without beta access is sent back to the waitlist
        page when it opens the dashboard.
      </DocP>
      <DocCallout type="info" title="Beta features">
        Session replay and source map uploads work today but are still changing. Their pages
        are marked beta.
      </DocCallout>

      <DocH2 id="where-to-start">Where to start</DocH2>
      <DocOl>
        <DocLi>
          <DocLink href="/docs/quickstart">Quick start</DocLink>: install the SDK and see your
          first error.
        </DocLi>
        <DocLi>
          <DocLink href="/docs/concepts/connect-github">Connect GitHub</DocLink>: start the
          change history.
        </DocLi>
        <DocLi>
          <DocLink href="/docs/concepts/deploys">Deploys and verdicts</DocLink>: make sure
          your deploys are recorded.
        </DocLi>
      </DocOl>
    </DocPage>
  );
}
