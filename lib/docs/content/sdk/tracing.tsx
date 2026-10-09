import {
  DocPage,
  DocH2,
  DocP,
  DocUl,
  DocLi,
  DocStrong,
  DocCallout,
  DocTable,
  CodeBlock,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "what-it-does", title: "What tracing does", level: 2 },
  { id: "turn-it-on", title: "Turn it on", level: 2 },
  { id: "traces", title: "Start and end a trace", level: 2 },
  { id: "spans", title: "Child spans", level: 2 },
  { id: "across-services", title: "Across services", level: 2 },
  { id: "limits", title: "Limits", level: 2 },
];

const C = InlineCode;

export default function TracingPage() {
  return (
    <DocPage slug="sdk/tracing" toc={toc}>
      <DocH2 id="what-it-does">What tracing does</DocH2>
      <DocP>
        While a trace is active, every log the logger sends carries the trace’s{" "}
        <C>traceId</C> and <C>spanId</C>. The <DocStrong>Distributed Traces</DocStrong> page
        groups logs by trace ID, so you can read every log from one user action in order.
      </DocP>
      <DocP>
        That is all it does in 1.5.2. Spans are not sent to Apperio as their own records,
        and no headers are added to your requests automatically.
      </DocP>

      <DocH2 id="turn-it-on">Turn it on</DocH2>
      <CodeBlock
        language="ts"
        code={`
import { Apperio } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  tracing: { enabled: true },
});
`}
      />
      <DocP>
        With tracing off, <C>startTrace()</C> and <C>createChildSpan()</C> return{" "}
        <C>null</C>.
      </DocP>

      <DocH2 id="traces">Start and end a trace</DocH2>
      <CodeBlock
        language="ts"
        code={`
const trace = logger.startTrace('checkout');
// trace: { traceId, spanId, sampled: true }, or null with tracing off

logger.info('Checkout started');   // carries trace.traceId and trace.spanId
logger.info('Payment accepted');   // same IDs

logger.endTrace();
logger.info('Back to browsing');   // no trace IDs
`}
      />
      <DocP>
        <C>logger.getCurrentTrace()</C> returns the active trace, or <C>null</C>.
      </DocP>

      <DocH2 id="spans">Child spans</DocH2>
      <DocP>
        A span times one step inside a trace. Spans live only in your code: to keep a span’s
        result, log it.
      </DocP>
      <CodeBlock
        language="ts"
        code={`
logger.startTrace('checkout');

const span = logger.createChildSpan('charge-card');
span?.setAttribute('provider', 'example-pay');

try {
  await chargeCard();
  logger.info('Card charged', { span: span?.end('ok') });
} catch (err) {
  logger.error('Card declined', err instanceof Error ? err : undefined, {
    span: span?.end('error'),
  });
}

logger.endTrace();
`}
      />
      <DocTable
        headers={["Span method", "What it does"]}
        rows={[
          [<C key="m">setAttribute(key, value)</C>, "Stores a value on the span."],
          [<C key="m">end(status?)</C>, "Stops the clock and returns the span’s data: name, IDs, start and end times, duration in milliseconds, status (ok or error) and attributes."],
          [<C key="m">getData()</C>, "Returns the span’s data without ending it."],
        ]}
      />
      <DocCallout type="warning" title="Start a trace first">
        With tracing on but no active trace, <C>createChildSpan()</C> throws{" "}
        <C>Cannot create child span: no active trace</C>. Logs keep the trace’s own span ID
        while a child span is open.
      </DocCallout>

      <DocH2 id="across-services">Across services</DocH2>
      <DocP>
        To follow an action from the browser to your API, send the trace ID along with the
        request. <C>TracePropagator</C> writes and reads the headers{" "}
        <C>X-Trace-ID</C>, <C>X-Span-ID</C> and <C>X-Parent-Span-ID</C>:
      </DocP>
      <CodeBlock
        language="ts"
        filename="browser.ts"
        code={`
import { TracePropagator } from 'apperio';

const trace = logger.startTrace('checkout');
const headers = trace
  ? TracePropagator.inject({ 'Content-Type': 'application/json' }, trace)
  : { 'Content-Type': 'application/json' };

await fetch('/api/orders', { method: 'POST', headers, body: '{}' });
`}
      />
      <CodeBlock
        language="ts"
        filename="server.ts"
        code={`
import { TracePropagator } from 'apperio';

export function handleOrder(headers: Record<string, string>) {
  const incoming = TracePropagator.extract(headers); // null if the headers are missing
  logger.info('Order received', { traceId: incoming?.traceId });
}
`}
      />
      <DocP>
        The receiving side can’t continue the same trace: <C>startTrace()</C> always creates
        new IDs. Log the incoming ID in your data, as above, and search for it.
      </DocP>

      <DocH2 id="limits">Limits</DocH2>
      <DocUl>
        <DocLi>
          One trace at a time per logger. On a server handling many requests at once, logs
          from other requests pick up the same IDs, so use tracing where one action runs at
          a time: a browser flow, a job or a script.
        </DocLi>
        <DocLi>Trace IDs are random UUIDs, not W3C <C>traceparent</C> values.</DocLi>
      </DocUl>
    </DocPage>
  );
}
