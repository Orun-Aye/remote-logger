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
  { id: "browser", title: "In the browser", level: 2 },
  { id: "flush", title: "flush()", level: 2 },
  { id: "shutdown", title: "shutdown()", level: 2 },
  { id: "node", title: "In Node.js", level: 2 },
  { id: "serverless", title: "Serverless functions", level: 2 },
];

const C = InlineCode;

export default function ShutdownPage() {
  return (
    <DocPage slug="sdk/shutdown" toc={toc}>
      <DocH2 id="browser">In the browser</DocH2>
      <DocP>
        You don’t need to do anything. When the page is hidden or unloaded, the SDK sends
        what is waiting in a request the browser completes in the background. See{" "}
        <DocLink href="/docs/sdk/delivery#leaving-the-page">When the visitor leaves</DocLink>.
      </DocP>

      <DocH2 id="flush">flush()</DocH2>
      <DocP>
        <C>await logger.flush()</C> sends everything waiting now and resolves when the
        request has finished, retries included. The logger keeps running.
      </DocP>

      <DocH2 id="shutdown">shutdown()</DocH2>
      <DocP>
        <C>await logger.shutdown()</C> stops the logger:
      </DocP>
      <DocUl>
        <DocLi>stops the flush timer and session replay;</DocLi>
        <DocLi>removes every browser hook and restores the originals;</DocLi>
        <DocLi>sends everything still waiting.</DocLi>
      </DocUl>
      <DocP>
        Call <C>logger.init()</C> afterwards to start it again. Calling <C>init()</C> on a
        logger that is already running only prints a warning.
      </DocP>

      <DocH2 id="node">In Node.js</DocH2>
      <DocP>
        When it starts in Node.js, the SDK adds its own handlers for <C>SIGINT</C> and{" "}
        <C>SIGTERM</C>. Each one calls <C>shutdown()</C> and then exits the process with
        code 0.
      </DocP>
      <DocCallout type="warning" title="The SDK ends the process on SIGTERM">
        Because of those handlers, the process exits as soon as the SDK has sent its logs,
        even if your own <C>SIGTERM</C> handler is still closing connections or finishing
        requests. If your server needs a graceful shutdown, test it with the SDK in place.
      </DocCallout>
      <DocP>
        For a script that should end by itself, flush before it finishes; the flush timer
        otherwise keeps the process alive:
      </DocP>
      <CodeBlock
        language="ts"
        code={`
await runJob();
await logger.shutdown(); // sends the last logs, stops the timer, lets Node exit
`}
      />

      <DocH2 id="serverless">Serverless functions</DocH2>
      <DocP>
        A serverless platform may freeze or stop the function as soon as it returns, before
        a batch goes out. Await <C>logger.flush()</C> before returning the response. The{" "}
        <DocLink href="/docs/guides/nextjs#server">Next.js guide</DocLink> shows it in a route
        handler.
      </DocP>
    </DocPage>
  );
}
