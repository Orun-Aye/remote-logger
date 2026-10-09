import {
  DocPage,
  DocH2,
  DocH3,
  DocP,
  DocUl,
  DocLi,
  DocLink,
  DocStrong,
  DocCallout,
  DocTable,
  CodeBlock,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "minimal", title: "Minimal setup", level: 2 },
  { id: "all-options", title: "All options", level: 2 },
  { id: "auto-capture", title: "autoCapture", level: 3 },
  { id: "log-levels", title: "Passing a log level", level: 2 },
  { id: "full-example", title: "A fuller example", level: 2 },
  { id: "no-effect", title: "Options with no effect in 1.5.2", level: 2 },
];

const C = InlineCode;

export default function SdkConfigurationPage() {
  return (
    <DocPage slug="sdk/configuration" toc={toc}>
      <DocP>
        This page describes <C>apperio</C> 1.5.2, the current version on npm. Every option
        is passed to the <C>Apperio</C> constructor.
      </DocP>

      <DocH2 id="minimal">Minimal setup</DocH2>
      <CodeBlock
        language="ts"
        code={`
import { Apperio } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
});
`}
      />
      <DocP>
        <C>apiKey</C> and <C>projectId</C> are required; the constructor throws{" "}
        <C>Apperio: API Key is required.</C> or <C>Apperio: Project ID is required.</C>{" "}
        without them. The constructor also starts the logger, so don’t call{" "}
        <C>init()</C> yourself.
      </DocP>

      <DocH2 id="all-options">All options</DocH2>
      <DocTable
        headers={["Option", "Type", "Default", "What it does"]}
        rows={[
          [<C key="k">apiKey</C>, <C key="t">string</C>, "required", "Your project’s API key, sent as X-API-Key."],
          [<C key="k">projectId</C>, <C key="t">string</C>, "required", "Your project’s ID."],
          [
            <C key="k">endpoint</C>,
            <C key="t">string</C>,
            <C key="d">https://apperioserver.onrender.com/api/v1</C>,
            "Where logs are sent. Leave it alone unless Apperio tells you otherwise.",
          ],
          [<C key="k">minLogLevel</C>, <C key="t">LogLevel</C>, <C key="d">LogLevel.INFO</C>, "Logs below this level are dropped in the SDK and never sent."],
          [<C key="k">batchSize</C>, <C key="t">number</C>, <C key="d">10</C>, "Send as soon as this many logs are waiting. The API takes at most 100 logs per request, so keep it at 100 or less."],
          [<C key="k">flushIntervalMs</C>, <C key="t">number</C>, <C key="d">5000</C>, "Send whatever is waiting this often, in milliseconds."],
          [<C key="k">maxRetries</C>, <C key="t">number</C>, <C key="d">3</C>, "Extra attempts when sending fails with a network error or a 5xx response."],
          [<C key="k">retryDelayMs</C>, <C key="t">number</C>, <C key="d">1000</C>, "Wait before the first retry. It doubles for each later one."],
          [<C key="k">environment</C>, <C key="t">string</C>, <C key="d">{`'development'`}</C>, "Tags every log. Set it to 'production' in production."],
          [<C key="k">serviceName</C>, <C key="t">string</C>, <C key="d">{`'unknown-service'`}</C>, "Tags every log with the part of your system that sent it."],
          [<C key="k">release</C>, <C key="t">string</C>, "none", "Tags every log with the version of your code."],
          [<C key="k">autoCapture</C>, "object", "see below", "Which browser events are captured automatically."],
          [
            <C key="k">sanitization</C>,
            <C key="t">{`{ enabled?, config? }`}</C>,
            <C key="d">{`{ enabled: true }`}</C>,
            <span key="s">
              PII redaction. See <DocLink href="/docs/sdk/data-sanitization">Data sanitization</DocLink>.
            </span>,
          ],
          [
            <C key="k">offline</C>,
            <C key="t">OfflineManagerConfig</C>,
            <C key="d">{`{}`}</C>,
            <span key="s">
              The browser’s offline queue. See <DocLink href="/docs/sdk/delivery#offline">Delivery and offline</DocLink>.
            </span>,
          ],
          [
            <C key="k">remoteConfig</C>,
            <C key="t">RemoteConfigOptions</C>,
            <C key="d">{`{ enabled: false }`}</C>,
            <span key="s">
              Fetch some settings from the dashboard. See <DocLink href="/docs/sdk/delivery#remote-config">Delivery and offline</DocLink>.
            </span>,
          ],
          [
            <C key="k">tracing</C>,
            <C key="t">{`{ enabled? }`}</C>,
            <C key="d">{`{ enabled: false }`}</C>,
            <span key="s">
              Trace and span IDs on logs. See <DocLink href="/docs/sdk/tracing">Tracing</DocLink>.
            </span>,
          ],
          [
            <C key="k">replay</C>,
            <C key="t">ReplayOptions</C>,
            "follows the dashboard",
            <span key="s">
              Session replay, browser only. See <DocLink href="/docs/sdk/replay">Replay options</DocLink>.
            </span>,
          ],
          [<C key="k">enablePatternDetection</C>, <C key="t">boolean</C>, <C key="d">true</C>, "Log a warning when the same error repeats or errors spike. See Error tracking."],
          [<C key="k">onPatternDetected</C>, "function", "none", "Called with each detected pattern."],
        ]}
      />

      <DocH3 id="auto-capture">autoCapture</DocH3>
      <DocTable
        headers={["Field", "Default", "Captures"]}
        rows={[
          [<C key="k">errors</C>, <C key="d">true</C>, "Uncaught errors and unhandled promise rejections."],
          [<C key="k">performance</C>, <C key="d">true</C>, "Page load, resource and paint timing, and Web Vitals."],
          [<C key="k">networkRequests</C>, <C key="d">true</C>, "fetch and XMLHttpRequest calls."],
          [<C key="k">pageViews</C>, <C key="d">true</C>, "The first page view and every history change."],
          [<C key="k">consoleMessages</C>, <C key="d">false</C>, "console.error, warn, log, info and debug calls."],
          [<C key="k">userInteractions</C>, <C key="d">false</C>, "Clicks, focus, blur, scrolling and key presses (without the keys)."],
        ]}
      />
      <DocP>
        Fields you leave out keep their defaults. All of these are browser only. Details and
        log levels are in <DocLink href="/docs/sdk/auto-instrumentation">Auto-instrumentation</DocLink>.
      </DocP>

      <DocH2 id="log-levels">Passing a log level</DocH2>
      <DocP>
        <C>LogLevel</C> is a TypeScript enum, so in TypeScript import it rather than passing
        a string:
      </DocP>
      <CodeBlock
        language="ts"
        code={`
import { Apperio, LogLevel } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  minLogLevel: LogLevel.WARN,
});
`}
      />
      <DocP>
        In plain JavaScript the string works too: <C>{`minLogLevel: 'warn'`}</C>. The levels,
        lowest first, are <C>trace</C>, <C>debug</C>, <C>info</C>, <C>warn</C>, <C>error</C> and{" "}
        <C>fatal</C>.
      </DocP>

      <DocH2 id="full-example">A fuller example</DocH2>
      <CodeBlock
        language="ts"
        filename="src/apperio.ts"
        code={`
import { Apperio, LogLevel } from 'apperio';

export const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  environment: 'production',
  serviceName: 'web',
  release: '2.4.1',
  minLogLevel: LogLevel.INFO,
  batchSize: 20,
  flushIntervalMs: 10000,
  autoCapture: {
    consoleMessages: false,
    userInteractions: false,
  },
  replay: {
    enabled: true,
    sampleRate: 0.1,
  },
});
`}
      />

      <DocH2 id="no-effect">Options with no effect in 1.5.2</DocH2>
      <DocP>
        These are part of the type, so TypeScript accepts them, but the SDK ignores them.
        Leave them out:
      </DocP>
      <DocUl>
        <DocLi>
          <C>serviceVersion</C>: never sent. Use <C>release</C>.
        </DocLi>
        <DocLi>
          <C>autoCapture.logLevels</C>: auto-captured events always use the levels listed in{" "}
          <DocLink href="/docs/sdk/auto-instrumentation">Auto-instrumentation</DocLink>.
        </DocLi>
        <DocLi>
          <C>tracing.autoTraceNetworkRequests</C>: no spans are created for requests.
        </DocLi>
      </DocUl>
      <DocCallout type="info" title="Settings in the dashboard">
        <DocStrong>Settings › SDK Config</DocStrong> in the dashboard doesn’t change a
        running SDK unless you turn on <C>remoteConfig</C>, and even then only some of its
        fields apply. See{" "}
        <DocLink href="/docs/sdk/delivery#remote-config">Remote config</DocLink>.
      </DocCallout>
    </DocPage>
  );
}
