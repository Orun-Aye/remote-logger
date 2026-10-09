import {
  DocPage,
  DocH2,
  DocP,
  DocUl,
  DocOl,
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
  { id: "batching", title: "Batching", level: 2 },
  { id: "retries", title: "Retries", level: 2 },
  { id: "leaving-the-page", title: "When the visitor leaves", level: 2 },
  { id: "offline", title: "Offline queue", level: 2 },
  { id: "remote-config", title: "Remote config", level: 2 },
  { id: "other-exports", title: "Other exports", level: 2 },
];

const C = InlineCode;

export default function DeliveryPage() {
  return (
    <DocPage slug="sdk/delivery" toc={toc}>
      <DocH2 id="batching">Batching</DocH2>
      <DocP>
        Logs wait in memory and go out together in one request to{" "}
        <C>POST /{"{projectId}"}/logs/batch</C>. A batch is sent:
      </DocP>
      <DocUl>
        <DocLi>as soon as <C>batchSize</C> logs are waiting (default 10);</DocLi>
        <DocLi>every <C>flushIntervalMs</C> (default 5,000 ms);</DocLi>
        <DocLi>when you call <C>await logger.flush()</C>;</DocLi>
        <DocLi>when the visitor leaves or hides the page.</DocLi>
      </DocUl>
      <DocP>
        At most 1,000 logs wait at once; beyond that the oldest are dropped, with a console
        warning. Two logs with the same message and the same timestamp in one batch are sent
        once.
      </DocP>
      <DocCallout type="warning" title="The API takes 100 logs per request">
        Each flush sends everything waiting, and the API rejects a request with more than
        100 logs. Keep <C>batchSize</C> at 100 or less. If Apperio can’t be reached for a
        while and more than 100 logs pile up, every later flush is refused too, and nothing
        more from that page arrives.
      </DocCallout>

      <DocH2 id="retries">Retries</DocH2>
      <DocOl>
        <DocLi>
          If a request fails with a network error or a 5xx response, the SDK tries again,
          up to <C>maxRetries</C> more times (default 3).
        </DocLi>
        <DocLi>
          It waits <C>retryDelayMs</C> before the first retry (default 1,000 ms) and doubles
          the wait each time, with a little random jitter, up to 60 seconds.
        </DocLi>
        <DocLi>
          A 4xx response, such as 401, 403, 400 or 429, isn’t retried: it would fail the same
          way.
        </DocLi>
        <DocLi>
          If every attempt fails, or the request was refused, the logs go back to the front
          of the queue and the next flush tries again.
        </DocLi>
      </DocOl>
      <DocP>
        While this happens you see messages such as{" "}
        <C>Apperio: Network error on attempt 1</C> in the console.
      </DocP>

      <DocH2 id="leaving-the-page">When the visitor leaves</DocH2>
      <DocP>
        A normal request is cancelled when the page unloads. So when the page is hidden or
        unloaded, the SDK sends what is waiting with <C>keepalive</C>, which the browser
        finishes in the background. Browsers cap these requests, so up to about 40 KB of
        logs go that way and anything beyond in a normal request, as a best effort. There
        are no retries at this point. This needs no code from you.
      </DocP>

      <DocH2 id="offline">Offline queue</DocH2>
      <DocP>
        In a browser, when the device goes offline, new logs go to a separate queue instead
        of being sent. When the connection comes back, the queue is sent in one request.
        It is on by default and only uses memory, so a queue is lost if the tab closes.
      </DocP>
      <CodeBlock
        language="ts"
        code={`
import { Apperio } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  offline: {
    maxQueueSize: 100,
    prioritizeCritical: true,
    onOffline: () => console.info('Offline: holding logs'),
    onOnline: () => console.info('Back online'),
    onSyncComplete: (count) => console.info(\`Sent \${count} queued logs\`),
  },
});
`}
      />
      <DocTable
        headers={["Option", "Default", "What it does"]}
        rows={[
          [<C key="o">maxQueueSize</C>, <C key="d">500</C>, "Most logs held while offline."],
          [<C key="o">prioritizeCritical</C>, <C key="d">true</C>, "When the queue is full, drop the oldest log that isn’t an error or fatal first. Otherwise drop the oldest."],
          [<C key="o">onOffline, onOnline</C>, "none", "Called when the browser goes offline or comes back."],
          [<C key="o">onSyncComplete</C>, "none", "Called with the number of queued logs sent after reconnecting."],
        ]}
      />
      <DocCallout type="warning" title="Set maxQueueSize to 100 or less">
        The queue goes out as a single request when the connection returns, and the API
        rejects more than 100 logs per request. With the default of 500, a long offline
        spell can fill a queue that is never delivered.
      </DocCallout>

      <DocH2 id="remote-config">Remote config</DocH2>
      <DocP>
        Off by default. Turn it on to let <DocStrong>Settings › SDK Config</DocStrong> in the
        dashboard adjust a running SDK:
      </DocP>
      <CodeBlock
        language="ts"
        code={`
import { Apperio } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  remoteConfig: {
    enabled: true,
    refreshIntervalMs: 300000, // default: every 5 minutes
    onConfigUpdate: (config) => console.info('Apperio settings updated', config),
  },
});
`}
      />
      <DocP>
        The SDK fetches the settings when it starts and then on every interval. Once
        fetched, these replace the values in your code:
      </DocP>
      <DocUl>
        <DocLi><DocStrong>Minimum Log Level</DocStrong></DocLi>
        <DocLi><DocStrong>Batch Size</DocStrong> and <DocStrong>Flush Interval</DocStrong></DocLi>
        <DocLi>the sanitization preset (<DocStrong>Strict Mode</DocStrong>)</DocLi>
      </DocUl>
      <DocP>
        The preset replaces any sanitization settings you passed in code, including custom
        rules. Everything else on that page, such as environment, service name, the
        auto-capture switches, and the sensitive fields and custom rules you enter there,
        doesn’t change a running SDK. Set those in code.
      </DocP>

      <DocH2 id="other-exports">Other exports</DocH2>
      <DocP>
        The package also exports <C>CircuitBreaker</C>, <C>compressPayload</C> and{" "}
        <C>HealthMetricsCollector</C>. The <C>Apperio</C> class doesn’t use them when sending
        logs, and you don’t need them to use Apperio, so they aren’t covered here.{" "}
        <C>AutoInstrumentation</C> and <C>BreadcrumbManager</C> are exported too; the logger
        creates and manages them for you. See{" "}
        <DocLink href="/docs/sdk/configuration">Configuration</DocLink> for everything the
        logger itself supports.
      </DocP>
    </DocPage>
  );
}
