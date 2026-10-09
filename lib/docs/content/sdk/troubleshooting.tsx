import {
  DocPage,
  DocH2,
  DocH3,
  DocP,
  DocOl,
  DocUl,
  DocLi,
  DocLink,
  DocStrong,
  DocTable,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "nothing-arrives", title: "Nothing shows up", level: 2 },
  { id: "status-codes", title: "What the response means", level: 3 },
  { id: "some-logs-missing", title: "Some logs are missing", level: 2 },
  { id: "no-notification", title: "No notification for a new error", level: 2 },
  { id: "server-errors", title: "Server errors aren’t captured", level: 2 },
  { id: "framework-errors", title: "React or Next.js errors are missing", level: 2 },
  { id: "console-messages", title: "Messages in the console", level: 2 },
  { id: "github", title: "Changes or suspects are empty", level: 2 },
  { id: "verdicts", title: "Deploys say No verdict yet", level: 2 },
  { id: "replay", title: "No replays", level: 2 },
  { id: "sessions", title: "Session counts look high", level: 2 },
];

const C = InlineCode;

export default function TroubleshootingPage() {
  return (
    <DocPage slug="sdk/troubleshooting" toc={toc}>
      <DocH2 id="nothing-arrives">Nothing shows up</DocH2>
      <DocOl>
        <DocLi>
          Wait a few seconds. Logs go out every 5 seconds or once 10 are waiting.
        </DocLi>
        <DocLi>
          Open your browser’s network tab and look for requests to{" "}
          <C>apperioserver.onrender.com</C> ending in <C>/logs/batch</C>. No request at all
          means the logger isn’t being created; check that the code runs in the browser.
        </DocLi>
        <DocLi>Check the response status against the table below.</DocLi>
        <DocLi>
          Check <C>minLogLevel</C>. With the default of <C>info</C>,{" "}
          <C>logger.debug()</C> and <C>logger.trace()</C> are dropped before sending.
        </DocLi>
      </DocOl>

      <DocH3 id="status-codes">What the response means</DocH3>
      <DocTable
        headers={["Status", "Meaning", "Fix"]}
        rows={[
          ["201", "Received.", "Look in Logs, and in Issues for errors."],
          ["400", "The batch was rejected: more than 100 logs, or a field over its limit.", <span key="f">See the limits in <DocLink href="/docs/api/logs#limits">the logs API</DocLink>.</span>],
          ["401", "No API key was sent.", "Pass apiKey to the constructor."],
          ["403", "The API key isn’t valid.", "Copy it again from Settings › API Key. It changes when someone regenerates it."],
        ]}
      />

      <DocH2 id="some-logs-missing">Some logs are missing</DocH2>
      <DocUl>
        <DocLi>
          Auto-captured events below <C>info</C> are never sent by default: fast requests,
          good Web Vitals, clicks. See{" "}
          <DocLink href="/docs/sdk/auto-instrumentation#levels">Auto-instrumentation</DocLink>.
        </DocLi>
        <DocLi>
          <C>logger.addBreadcrumb()</C> logs at <C>debug</C>, so it is dropped by default.
        </DocLi>
        <DocLi>
          If the same batch is refused with 400 again and again, one log in it is over a
          limit, for example an error message longer than 1,000 characters. Shorten what
          you log; the stuck logs clear when the page reloads.
        </DocLi>
      </DocUl>

      <DocH2 id="no-notification">No notification for a new error</DocH2>
      <DocUl>
        <DocLi>
          Check the error’s environment. With the default settings only{" "}
          <C>production</C> notifies, and the SDK tags logs <C>development</C> unless you set{" "}
          <C>environment</C>.
        </DocLi>
        <DocLi>
          Only a new kind of error notifies, once. More occurrences of a known issue don’t.
        </DocLi>
        <DocLi>Only the project owner is notified.</DocLi>
        <DocLi>
          Check that notifications are on in <DocStrong>Settings › Notifications</DocStrong>.
        </DocLi>
      </DocUl>

      <DocH2 id="server-errors">Server errors aren’t captured</DocH2>
      <DocP>
        Automatic capture only works in browsers. In Node.js, report errors yourself; see{" "}
        <DocLink href="/docs/sdk/error-tracking#node">Error tracking</DocLink>.
      </DocP>

      <DocH2 id="framework-errors">React or Next.js errors are missing</DocH2>
      <DocP>
        Error boundaries and Next.js <C>error.tsx</C> files catch rendering errors before
        the SDK sees them. Log them from the boundary, as the{" "}
        <DocLink href="/docs/guides/react">React</DocLink> and{" "}
        <DocLink href="/docs/guides/nextjs">Next.js</DocLink> guides show.
      </DocP>

      <DocH2 id="console-messages">Messages in the console</DocH2>
      <DocTable
        headers={["Message", "What it means"]}
        rows={[
          [<C key="m">Apperio: API Key is required.</C>, "apiKey is missing or empty. The constructor throws."],
          [<C key="m">Apperio: Project ID is required.</C>, "projectId is missing or empty. The constructor throws."],
          [<C key="m">Apperio: Already initialized. Call shutdown() first to re-initialize.</C>, "Something called init(). Remove the call: the constructor already starts the logger."],
          [<C key="m">Apperio: Authentication/Authorization failed. Check API Key.</C>, "The API answered 401 or 403. See the status table above."],
          [<C key="m">Apperio: Network error on attempt 1</C>, "Apperio couldn’t be reached. The SDK retries; see Delivery and offline."],
          [<C key="m">Apperio: Dropped 12 oldest logs due to buffer overflow.</C>, "More than 1,000 logs were waiting. Lower the volume or the flush interval."],
        ]}
      />

      <DocH2 id="github">Changes or suspects are empty</DocH2>
      <DocUl>
        <DocLi>
          Check <DocStrong>Settings › Integrations</DocStrong>: the GitHub App card should say{" "}
          <DocStrong>Connected via GitHub App</DocStrong> and a repository should be linked.
        </DocLi>
        <DocLi>Check the linked branch is the one you push to.</DocLi>
        <DocLi>
          Suspects are worked out once, when an issue is first opened, from commits in the 7
          days before it first appeared. See{" "}
          <DocLink href="/docs/concepts/suspect-commits">Suspect commits</DocLink>.
        </DocLi>
      </DocUl>

      <DocH2 id="verdicts">Deploys say No verdict yet</DocH2>
      <DocP>
        The deploy is less than an hour old, nobody has opened the project overview since
        the hour ended, or one of the two hours had fewer than 10 logs. See{" "}
        <DocLink href="/docs/concepts/deploys">Deploys and verdicts</DocLink>.
      </DocP>

      <DocH2 id="replay">No replays</DocH2>
      <DocUl>
        <DocLi>
          Check <DocStrong>Settings › Session Replay</DocStrong> is on, then wait up to 5
          minutes and load a new page.
        </DocLi>
        <DocLi>
          If your code sets <C>replay.enabled</C>, the code decides and the dashboard switch
          is ignored.
        </DocLi>
        <DocLi>
          Only the sampled share of visits is recorded: 10% unless you change it. Set{" "}
          <C>replay: {"{ enabled: true, sampleRate: 1 }"}</C> while testing.
        </DocLi>
      </DocUl>

      <DocH2 id="sessions">Session counts look high</DocH2>
      <DocP>
        Each full page load starts a new session. See{" "}
        <DocLink href="/docs/sdk/sessions">Sessions</DocLink>.
      </DocP>
    </DocPage>
  );
}
