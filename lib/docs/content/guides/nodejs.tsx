import {
  DocPage,
  DocH2,
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
  { id: "what-is-different", title: "What is different on a server", level: 2 },
  { id: "create-the-logger", title: "1. Create the logger", level: 2 },
  { id: "capture-crashes", title: "2. Capture crashes", level: 2 },
  { id: "log-requests", title: "3. Log what matters", level: 2 },
  { id: "scripts", title: "Scripts and jobs", level: 2 },
  { id: "signals", title: "SIGTERM and SIGINT", level: 2 },
];

const C = InlineCode;

export default function NodejsGuidePage() {
  return (
    <DocPage slug="guides/nodejs" toc={toc}>
      <DocH2 id="what-is-different">What is different on a server</DocH2>
      <DocUl>
        <DocLi>
          Nothing is captured automatically: no errors, requests or timings. You log what
          you need.
        </DocLi>
        <DocLi>
          The SDK adds the platform and Node.js version to every log’s context.
        </DocLi>
        <DocLi>
          It registers handlers for <C>SIGINT</C> and <C>SIGTERM</C> that send the last logs
          and exit. See <DocLink href="#signals">below</DocLink>.
        </DocLi>
      </DocUl>
      <DocP>
        The SDK uses the global <C>fetch</C>, so it needs Node.js 18 or later. Install it
        with <C>npm install apperio</C>; both <C>import</C> and <C>require</C> work.
      </DocP>

      <DocH2 id="create-the-logger">1. Create the logger</DocH2>
      <CodeBlock
        language="ts"
        filename="src/apperio.ts"
        code={`
import { Apperio } from 'apperio';

export const logger = new Apperio({
  apiKey: process.env.APPERIO_API_KEY ?? '',
  projectId: process.env.APPERIO_PROJECT_ID ?? '',
  environment: process.env.NODE_ENV ?? 'development',
  serviceName: 'api',
});
`}
      />
      <DocP>
        The constructor throws if either value is empty, so a missing environment variable
        stops the process at startup rather than losing logs quietly.
      </DocP>

      <DocH2 id="capture-crashes">2. Capture crashes</DocH2>
      <CodeBlock
        language="ts"
        filename="src/crash-reporting.ts"
        code={`
import { logger } from './apperio';

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
        After an uncaught exception the process is in an unknown state, so this exits once
        the report is sent. Each error becomes an issue in Apperio, grouped by its name,
        message and stack.
      </DocP>

      <DocH2 id="log-requests">3. Log what matters</DocH2>
      <DocP>
        Log failures with the error, and important events with enough data to find them
        later:
      </DocP>
      <CodeBlock
        language="ts"
        code={`
export async function handleRefund(orderId: string) {
  try {
    await processOrder(orderId);
    logger.info('Refund issued', { orderId });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Refund failed', error, { orderId });
    throw error;
  }
}
`}
      />
      <DocP>
        In a web framework, log errors from its error handler, the one place every failed
        request passes through.
      </DocP>

      <DocH2 id="scripts">Scripts and jobs</DocH2>
      <DocP>
        The logger’s flush timer keeps Node.js running. At the end of a script, shut it down
        so the last logs go out and the process can exit:
      </DocP>
      <CodeBlock
        language="ts"
        filename="scripts/nightly.ts"
        code={`
import { logger } from '../src/apperio';

try {
  await runJob();
  logger.info('Nightly job finished');
} catch (err) {
  logger.error('Nightly job failed', err instanceof Error ? err : new Error(String(err)));
  process.exitCode = 1;
} finally {
  await logger.shutdown();
}
`}
      />

      <DocH2 id="signals">SIGTERM and SIGINT</DocH2>
      <DocP>
        On either signal, the SDK’s handler calls <C>logger.shutdown()</C> and then{" "}
        <C>process.exit(0)</C>.
      </DocP>
      <DocCallout type="warning" title="Graceful shutdowns">
        The exit happens as soon as the SDK’s own logs are sent, even if your own handler is
        still closing the server or finishing requests, and the exit code is always 0. If
        your platform relies on a graceful shutdown, test it with the SDK in place. See{" "}
        <DocLink href="/docs/sdk/shutdown#node">Shutdown</DocLink>.
      </DocCallout>
    </DocPage>
  );
}
