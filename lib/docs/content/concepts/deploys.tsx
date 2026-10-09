import {
  DocPage,
  DocH2,
  DocH3,
  DocP,
  DocUl,
  DocOl,
  DocLi,
  DocStrong,
  DocLink,
  DocCallout,
  DocTable,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "how-deploys-arrive", title: "How deploys reach Apperio", level: 2 },
  { id: "verdicts", title: "Verdicts", level: 2 },
  { id: "the-rules", title: "The rules", level: 3 },
  { id: "when", title: "When the verdict appears", level: 3 },
  { id: "where-you-see-them", title: "Where you see them", level: 2 },
  { id: "getting-good-verdicts", title: "Getting useful verdicts", level: 2 },
];

export default function DeploysPage() {
  return (
    <DocPage slug="concepts/deploys" toc={toc}>
      <DocH2 id="how-deploys-arrive">How deploys reach Apperio</DocH2>
      <DocTable
        headers={["Source", "What you do", "Gets a verdict"]}
        rows={[
          [
            "GitHub deployments",
            "Nothing, once the GitHub App is installed and the repository linked. Deployments of other branches are skipped.",
            "Yes, once GitHub reports the deployment succeeded",
          ],
          [
            "GitHub releases",
            "Nothing. Published releases appear as Release <tag>.",
            "No, a release is a version label, not a deploy",
          ],
          [
            "Deployments API",
            "Call it from your CI job after each deploy.",
            "Yes",
          ],
        ]}
      />
      <DocP>
        Hosts that create GitHub deployments for your repository, such as Vercel, are picked
        up this way with no extra work. For anything else, use the{" "}
        <DocLink href="/docs/api/deployments">deployments API</DocLink>. Use one source per
        deploy, or the same deploy is counted twice.
      </DocP>

      <DocH2 id="verdicts">Verdicts</DocH2>
      <DocP>
        A verdict answers one question: did errors go up after this deploy? Apperio compares
        the hour before the deploy with the hour after it. For each hour it counts all logs
        and the logs at level <InlineCode>error</InlineCode> or <InlineCode>fatal</InlineCode>,
        and works out the error rate: errors divided by all logs.
      </DocP>

      <DocH3 id="the-rules">The rules</DocH3>
      <DocTable
        headers={["Verdict", "When"]}
        rows={[
          [
            <DocStrong key="d">Degraded</DocStrong>,
            "The error rate rose by more than 25%, with at least 5 errors in the hour after.",
          ],
          [
            <DocStrong key="i">Improved</DocStrong>,
            "The error rate fell by more than 25%, with at least 5 errors in the hour before.",
          ],
          [<DocStrong key="h">Healthy</DocStrong>, "Anything in between."],
          [
            <DocStrong key="n">No verdict yet</DocStrong>,
            "Either hour had fewer than 10 logs, so there isn’t enough traffic to judge.",
          ],
        ]}
      />
      <DocP>
        One exception to the traffic rule: if the hour before had some logs and no errors,
        and the hour after has 5 or more errors, the deploy is Degraded even with little
        traffic. A deploy with no logs at all in the hour before it (often a project’s first
        deploy) has nothing to compare with, so it stays without a verdict.
      </DocP>
      <DocP>
        Only logs from the deploy’s environment count. If neither hour has logs with that
        environment name, Apperio uses all of the project’s logs instead. Logs are placed in
        an hour by when Apperio received them.
      </DocP>

      <DocH3 id="when">When the verdict appears</DocH3>
      <DocP>
        The hour after a deploy has to pass first. The next time someone opens the
        project’s overview page after that, Apperio works out the verdict and saves it, and
        from then on it shows everywhere. It doesn’t change afterwards. Failed deploys are
        marked <DocStrong>failed</DocStrong> and don’t get a verdict.
      </DocP>

      <DocH2 id="where-you-see-them">Where you see them</DocH2>
      <DocUl>
        <DocLi>
          <DocStrong>Changes › Deploys:</DocStrong> each deploy, its verdict, and the change
          in error rate, for example <InlineCode>Error rate +40.0% in the hour after</InlineCode>.
        </DocLi>
        <DocLi>
          <DocStrong>Project overview:</DocStrong> the Deploy Impact card.
        </DocLi>
        <DocLi>
          <DocStrong>Errors, Performance and Activity:</DocStrong> deploy markers on the
          time charts. The Errors chart counts errors per hour, so its markers sit on the
          hour each deploy happened in.
        </DocLi>
      </DocUl>

      <DocH2 id="getting-good-verdicts">Getting useful verdicts</DocH2>
      <DocOl>
        <DocLi>
          Set <InlineCode>environment</InlineCode> on the SDK to the same name your deploys
          use, such as <InlineCode>production</InlineCode>. See{" "}
          <DocLink href="/docs/environments-and-releases">Environments and releases</DocLink>.
        </DocLi>
        <DocLi>
          Record each deploy once, when it is live, not when the build starts.
        </DocLi>
        <DocLi>
          Expect <DocStrong>No verdict yet</DocStrong> on quiet sites. A verdict needs at
          least 10 logs on each side of the deploy.
        </DocLi>
      </DocOl>
      <DocCallout type="info" title="What a verdict can’t tell you">
        A verdict compares error rates. A slower page or a broken flow that throws no errors
        won’t show up in it. If background errors are common on your site, a new bug can
        also stay inside the 25% band and read Healthy.
      </DocCallout>
    </DocPage>
  );
}
