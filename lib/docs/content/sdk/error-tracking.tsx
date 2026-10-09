import {
  DocPage,
  DocH2,
  DocH3,
  DocP,
  DocUl,
  DocLi,
  DocLink,
  DocCallout,
  CodeBlock,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "browser", title: "In the browser", level: 2 },
  { id: "script-error", title: "Script error.", level: 3 },
  { id: "framework-boundaries", title: "Errors your framework catches", level: 2 },
  { id: "manual", title: "Reporting errors yourself", level: 2 },
  { id: "node", title: "On a server", level: 2 },
  { id: "patterns", title: "Pattern detection", level: 2 },
];

const C = InlineCode;

export default function ErrorTrackingPage() {
  return (
    <DocPage slug="sdk/error-tracking" toc={toc}>
      <DocH2 id="browser">In the browser</DocH2>
      <DocP>
        With <C>autoCapture.errors</C> on (the default), the SDK listens for the window’s{" "}
        <C>error</C> and <C>unhandledrejection</C> events and reports each one at{" "}
        <C>error</C> level. The log message is the error’s name and first line, such as{" "}
        <C>TypeError: Cannot read properties of undefined (reading &apos;id&apos;)</C>, and
        the report carries the stack trace, where it happened, the recent{" "}
        <DocLink href="/docs/sdk/auto-instrumentation#breadcrumb-trail">breadcrumb trail</DocLink>{" "}
        and a snapshot of the page. Apperio then groups it into an issue; see{" "}
        <DocLink href="/docs/concepts/errors-and-issues">Errors and issues</DocLink>.
      </DocP>
      <DocP>
        A rejection with something other than an <C>Error</C>, such as a string, is turned
        into one. If the text looks like <C>TypeError: message</C>, that name is kept.
      </DocP>

      <DocH3 id="script-error">Script error.</DocH3>
      <DocP>
        Browsers hide the details of errors thrown by scripts from another origin, such as a
        CDN, and report only <C>Script error.</C> with no stack. To see the real error,
        serve the script with an <C>Access-Control-Allow-Origin</C> header and load it with
        the <C>crossorigin</C> attribute.
      </DocP>

      <DocH2 id="framework-boundaries">Errors your framework catches</DocH2>
      <DocP>
        Some errors never reach the window. React error boundaries and Next.js{" "}
        <C>error.tsx</C> files catch rendering errors so they can show a fallback, and the
        SDK doesn’t see them. Report them from the boundary; the{" "}
        <DocLink href="/docs/guides/react">React</DocLink> and{" "}
        <DocLink href="/docs/guides/nextjs">Next.js</DocLink> guides show how.
      </DocP>

      <DocH2 id="manual">Reporting errors yourself</DocH2>
      <DocP>
        For an error you catch and handle, pass it to <C>logger.error()</C>, or to{" "}
        <C>logger.fatal()</C> if the app can’t carry on:
      </DocP>
      <CodeBlock
        language="ts"
        code={`
async function submitOrder(orderId: string) {
  try {
    await processOrder(orderId);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Order failed', error, { orderId });
    throw error;
  }
}
`}
      />
      <DocP>
        <C>logger.captureException(error, context)</C> does the same with a fixed message;
        see <DocLink href="/docs/sdk/logging#capture">Logging methods</DocLink>. Either way,
        the issue is titled from the error’s name and message, not from your log message.
      </DocP>
      <DocCallout type="info" title="Error messages are not redacted">
        The error’s name, message and stack are sent as they are. Keep personal data and
        secrets out of the errors you throw. See{" "}
        <DocLink href="/docs/concepts/privacy">Privacy and PII redaction</DocLink>.
      </DocCallout>

      <DocH2 id="node">On a server</DocH2>
      <DocP>
        In Node.js nothing is captured automatically. Report crashes with the process
        events:
      </DocP>
      <CodeBlock
        language="ts"
        code={`
process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught exception', error);
  void logger.flush().finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error('Unhandled rejection', error);
});
`}
      />
      <DocP>
        Awaiting <C>flush()</C> before exiting gives the report a chance to leave. The{" "}
        <DocLink href="/docs/guides/nodejs">Node.js guide</DocLink> covers servers, workers
        and scripts.
      </DocP>

      <DocH2 id="patterns">Pattern detection</DocH2>
      <DocP>
        On by default. The SDK watches the errors it sends and spots two patterns:
      </DocP>
      <DocUl>
        <DocLi>
          <C>recurring_error</C>: the same message (its first 80 characters) 3 or more
          times within 5 minutes;
        </DocLi>
        <DocLi>
          <C>error_spike</C>: 3 or more errors in the last minute, and more than three times
          the average per minute over the last 10 minutes.
        </DocLi>
      </DocUl>
      <DocP>
        When it spots one, it logs a <C>warn</C> such as{" "}
        <C>[Pattern Detection] recurring_error: Card declined</C> (the error’s message) and
        calls your{" "}
        <C>onPatternDetected</C> function, if you gave one. The same pattern is reported at
        most once every 5 minutes. Detection only sees errors from the current page or
        process.
      </DocP>
      <CodeBlock
        language="ts"
        code={`
import { Apperio } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  onPatternDetected: (pattern) => {
    console.warn(\`\${pattern.type}: \${pattern.count} errors in \${pattern.windowMs / 1000} s\`);
  },
});
`}
      />
      <DocP>
        Turn it off with <C>enablePatternDetection: false</C>.
      </DocP>
    </DocPage>
  );
}
