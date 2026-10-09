import {
  DocPage,
  DocH2,
  DocP,
  DocUl,
  DocLi,
  DocStrong,
  DocLink,
  DocCallout,
  DocTable,
  CodeBlock,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "what-is-measured", title: "What is measured", level: 2 },
  { id: "web-vitals", title: "Core Web Vitals", level: 2 },
  { id: "what-is-sent", title: "What is sent by default", level: 2 },
  { id: "send-everything", title: "Sending every measurement", level: 2 },
  { id: "where", title: "Where you see it", level: 2 },
];

export default function PerformancePage() {
  return (
    <DocPage slug="concepts/performance" toc={toc}>
      <DocH2 id="what-is-measured">What is measured</DocH2>
      <DocP>
        In the browser, with the default settings, the SDK measures:
      </DocP>
      <DocUl>
        <DocLi>
          <DocStrong>Page loads</DocStrong>, from the browser’s navigation timing.
        </DocLi>
        <DocLi>
          <DocStrong>Resources</DocStrong>: how long each script, stylesheet, image and
          request took to load, and its transfer size.
        </DocLi>
        <DocLi>
          <DocStrong>Core Web Vitals</DocStrong>: LCP, CLS and INP, each rated.
        </DocLi>
        <DocLi>
          <DocStrong>Network requests</DocStrong> made with <InlineCode>fetch</InlineCode> or{" "}
          <InlineCode>XMLHttpRequest</InlineCode>: method, URL, status and duration.
        </DocLi>
      </DocUl>
      <DocP>
        These come from <InlineCode>autoCapture.performance</InlineCode> and{" "}
        <InlineCode>autoCapture.networkRequests</InlineCode>, both on by default. Nothing is
        measured in Node.js. The SDK’s own uploads to Apperio are left out.
      </DocP>

      <DocH2 id="web-vitals">Core Web Vitals</DocH2>
      <DocTable
        headers={["Metric", "What it measures", "Good", "Needs improvement", "Poor"]}
        rows={[
          ["LCP", "When the largest piece of content appeared", "2.5 s or less", "up to 4 s", "over 4 s"],
          ["CLS", "How much the layout jumped around", "0.1 or less", "up to 0.25", "over 0.25"],
          ["INP", "How long the page took to respond to a click, tap or key", "200 ms or less", "up to 500 ms", "over 500 ms"],
        ]}
      />
      <DocP>
        Each reading is sent with its rating (<InlineCode>good</InlineCode>,{" "}
        <InlineCode>needs-improvement</InlineCode> or <InlineCode>poor</InlineCode>). For INP,
        the SDK reports each interaction that took 40 ms or longer.
      </DocP>

      <DocH2 id="what-is-sent">What is sent by default</DocH2>
      <DocP>
        Each measurement is logged at a level that depends on how slow it was, and the SDK
        only sends logs at or above its <InlineCode>minLogLevel</InlineCode>, which is{" "}
        <InlineCode>info</InlineCode> by default. So out of the box, fast results stay in the
        browser and only the slow ones reach Apperio:
      </DocP>
      <DocTable
        headers={["Measurement", "Sent by default when"]}
        rows={[
          ["Page load", "over 1 s (over 3 s is a warning)"],
          ["Script or stylesheet", "over 1 s"],
          ["Any other resource", "over 3 s"],
          ["LCP", "over 2.5 s"],
          ["CLS", "over 0.1"],
          ["INP", "over 200 ms"],
          ["Network request", "status 4xx or 5xx, a failure, or slower than 5 s"],
        ]}
      />
      <DocCallout type="info" title="Why the Web Vitals page can look worse than reality">
        With the default level, good readings are never sent, so charts built from them show
        only the slower visits. Keep that in mind when you read the averages.
      </DocCallout>

      <DocH2 id="send-everything">Sending every measurement</DocH2>
      <DocP>
        Lower the level to <InlineCode>debug</InlineCode> to send fast results as well:
      </DocP>
      <CodeBlock
        language="ts"
        code={`
import { Apperio, LogLevel } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  environment: 'production',
  minLogLevel: LogLevel.DEBUG,
});
`}
      />
      <DocP>
        This sends a lot more: every successful request and every resource on every page.
        It also lets your own <InlineCode>logger.debug()</InlineCode> calls through. Consider
        it for a while on a quiet site, or a staging environment, rather than permanently.
      </DocP>

      <DocH2 id="where">Where you see it</DocH2>
      <DocUl>
        <DocLi><DocStrong>Core Web Vitals</DocStrong>: LCP, INP and CLS.</DocLi>
        <DocLi><DocStrong>Performance Analytics</DocStrong>: response times and throughput.</DocLi>
        <DocLi><DocStrong>Network Monitoring</DocStrong>: requests, statuses and timings.</DocLi>
        <DocLi><DocStrong>Pageview Analytics</DocStrong>: page traffic.</DocLi>
      </DocUl>
      <DocP>
        Deploys appear as markers on the Performance Analytics chart, so you can see whether
        a release made things slower. See{" "}
        <DocLink href="/docs/concepts/deploys">Deploys and verdicts</DocLink>.
      </DocP>
    </DocPage>
  );
}
