import {
  DocPage,
  DocH2,
  DocH3,
  DocP,
  DocUl,
  DocLi,
  DocLink,
  DocCallout,
  DocTable,
  CodeBlock,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "levels", title: "Log levels", level: 2 },
  { id: "methods", title: "Logging methods", level: 2 },
  { id: "data", title: "Attaching data", level: 2 },
  { id: "errors", title: "Logging errors", level: 2 },
  { id: "capture", title: "captureException and captureMessage", level: 3 },
  { id: "breadcrumbs", title: "addBreadcrumb", level: 3 },
  { id: "context", title: "Context", level: 2 },
  { id: "flush", title: "Sending now", level: 2 },
  { id: "what-is-sent", title: "What a log looks like", level: 2 },
];

const C = InlineCode;

export default function SdkLoggingPage() {
  return (
    <DocPage slug="sdk/logging" toc={toc}>
      <DocH2 id="levels">Log levels</DocH2>
      <DocTable
        headers={["Level", "Use it for"]}
        rows={[
          [<C key="l">trace</C>, "Very detailed steps you only want while chasing a problem."],
          [<C key="l">debug</C>, "Detail that helps while developing."],
          [<C key="l">info</C>, "Normal events: a sign-up, an order placed."],
          [<C key="l">warn</C>, "Something unexpected that the app recovered from."],
          [<C key="l">error</C>, "Something failed. Becomes part of an issue."],
          [<C key="l">fatal</C>, "Something failed badly enough to stop the app. Becomes part of an issue."],
        ]}
      />
      <DocP>
        Logs below <C>minLogLevel</C> (default <C>info</C>) are dropped in the SDK. See{" "}
        <DocLink href="/docs/sdk/configuration#log-levels">Passing a log level</DocLink>.
      </DocP>

      <DocH2 id="methods">Logging methods</DocH2>
      <DocTable
        headers={["Method", "Arguments"]}
        rows={[
          [<C key="m">trace, debug, info, warn</C>, <C key="a">(message: string, data?: object)</C>],
          [<C key="m">error, fatal</C>, <C key="a">(message: string, error?: Error, data?: object)</C>],
          [<C key="m">captureException</C>, <C key="a">(error: Error, context?: object)</C>],
          [<C key="m">captureMessage</C>, <C key="a">(message: string, level?: LogLevel, context?: object)</C>],
          [<C key="m">addBreadcrumb</C>, <C key="a">(message: string, category?: string, data?: object)</C>],
        ]}
      />
      <DocP>
        Every method returns straight away. The log waits in memory and goes out with the
        next batch.
      </DocP>

      <DocH2 id="data">Attaching data</DocH2>
      <DocP>
        Pass an object as the last argument. It is stored with the log, and you can see it
        in the log’s details:
      </DocP>
      <CodeBlock
        language="ts"
        code={`
logger.info('Order placed', {
  orderId: 'order-123',
  items: 3,
  total: 42.5,
});
`}
      />
      <DocP>
        The data goes through <DocLink href="/docs/sdk/data-sanitization">redaction</DocLink>{" "}
        first, so a field called <C>email</C> or <C>password</C> is masked.
      </DocP>

      <DocH2 id="errors">Logging errors</DocH2>
      <DocP>
        <C>error()</C> and <C>fatal()</C> take an <C>Error</C> as their second argument. The
        SDK sends its name, message and stack trace, and Apperio groups it into an issue by
        those.
      </DocP>
      <CodeBlock
        language="ts"
        code={`
try {
  await chargeCard();
} catch (err) {
  const error = err instanceof Error ? err : new Error(String(err));
  logger.error('Payment failed', error, { orderId: 'order-123' });
}
`}
      />
      <DocP>
        In TypeScript a caught value has type <C>unknown</C>, so turn it into an{" "}
        <C>Error</C> as above before passing it.
      </DocP>

      <DocH3 id="capture">captureException and captureMessage</DocH3>
      <DocUl>
        <DocLi>
          <C>captureException</C> logs the error at <C>error</C> level with the message{" "}
          <C>Exception captured</C>. The issue is still titled from the error itself.
        </DocLi>
        <DocLi>
          <C>captureMessage</C> logs a message at the level you choose (default <C>info</C>).
        </DocLi>
        <DocLi>
          The optional <C>context</C> is added to the logger’s context for this one log
          only.
        </DocLi>
      </DocUl>
      <CodeBlock
        language="ts"
        code={`
import { LogLevel } from 'apperio';

logger.captureException(new Error('Stock check failed'), { sku: 'sku-42' });
logger.captureMessage('Payment provider slow', LogLevel.WARN);
`}
      />

      <DocH3 id="breadcrumbs">addBreadcrumb</DocH3>
      <DocCallout type="warning" title="Breadcrumbs are sent at debug level">
        <p>
          <C>addBreadcrumb</C> sends a separate log at <C>debug</C> level, so with the default{" "}
          <C>minLogLevel</C> of <C>info</C> it is dropped.
        </p>
        <p>
          It also isn’t added to the trail of recent clicks, requests and page views that
          the SDK attaches to errors it captures by itself. To leave a trail you will see,
          log the step at <C>info</C> instead.
        </p>
      </DocCallout>

      <DocH2 id="context">Context</DocH2>
      <DocP>
        Context is data added to every log from then on, such as the signed-in user’s ID:
      </DocP>
      <CodeBlock
        language="ts"
        code={`
logger.setContext({ userId: 'user-42', plan: 'pro' }); // merged into what is there
logger.getContext();                                   // a copy of the current context
logger.clearContext();                                 // removes everything
`}
      />
      <DocP>
        When it starts, the SDK puts some context there for you: the user agent, page
        address and referrer in a browser, or the platform and Node.js version on a server.{" "}
        <C>clearContext()</C> removes those too.
      </DocP>

      <DocH2 id="flush">Sending now</DocH2>
      <DocP>
        <C>await logger.flush()</C> sends everything waiting in memory without waiting for
        the next batch. Use it before a short script exits or a serverless function returns.
        See <DocLink href="/docs/sdk/shutdown">Shutdown</DocLink>.
      </DocP>

      <DocH2 id="what-is-sent">What a log looks like</DocH2>
      <DocP>
        A <C>logger.error()</C> call from the example above arrives roughly like this (the
        context is shortened):
      </DocP>
      <CodeBlock
        language="json"
        code={`
{
  "projectId": "your-project-id",
  "timestamp": "2026-01-15T12:00:00.000Z",
  "level": "error",
  "message": "Payment failed",
  "data": { "orderId": "order-123" },
  "error": {
    "name": "Error",
    "message": "Card declined",
    "stack": "Error: Card declined\\n    at chargeCard (https://example.com/assets/app.js:1:2345)"
  },
  "service": "web",
  "environment": "production",
  "release": "2.4.1",
  "context": { "url": "https://example.com/checkout" },
  "sessionId": "00000000-0000-4000-8000-000000000000",
  "url": "https://example.com/checkout",
  "referrer": "",
  "userAgent": "Mozilla/5.0 (example)"
}
`}
      />
    </DocPage>
  );
}
