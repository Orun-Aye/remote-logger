import {
  DocPage,
  DocH2,
  DocP,
  DocOl,
  DocUl,
  DocLi,
  DocStrong,
  DocLink,
  DocCallout,
  CodeBlock,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "before-you-start", title: "Before you start", level: 2 },
  { id: "find-your-keys", title: "1. Find your API key and project ID", level: 2 },
  { id: "install", title: "2. Install the SDK", level: 2 },
  { id: "initialise", title: "3. Create the logger", level: 2 },
  { id: "first-error", title: "4. Send a test error", level: 2 },
  { id: "see-it", title: "5. See it in Apperio", level: 2 },
  { id: "next-steps", title: "Next steps", level: 2 },
];

export default function QuickStartPage() {
  return (
    <DocPage slug="quickstart" toc={toc}>
      <DocH2 id="before-you-start">Before you start</DocH2>
      <DocP>
        You need an Apperio account with beta access and a project. If you don’t have one
        yet, see <DocLink href="/docs/introduction#access">Getting access</DocLink>. Then, in
        the dashboard, create a project for the site or app you want to watch.
      </DocP>
      <DocP>
        This guide sets up the SDK in browser code, where it captures errors on its own. For
        a server, follow these steps and then read the{" "}
        <DocLink href="/docs/guides/nodejs">Node.js guide</DocLink>.
      </DocP>

      <DocH2 id="find-your-keys">1. Find your API key and project ID</DocH2>
      <DocUl>
        <DocLi>
          <DocStrong>API key:</DocStrong> open the project, then{" "}
          <DocStrong>Settings › API Key</DocStrong>. Use <DocStrong>Reveal Key</DocStrong> or
          the copy button.
        </DocLi>
        <DocLi>
          <DocStrong>Project ID:</DocStrong> the long string after{" "}
          <InlineCode>/projects/</InlineCode> in the dashboard address. It also appears in the
          code preview on <DocStrong>Settings › SDK Config</DocStrong>.
        </DocLi>
      </DocUl>

      <DocH2 id="install">2. Install the SDK</DocH2>
      <CodeBlock language="bash" code="npm install apperio" />
      <DocP>
        Yarn and pnpm work too (<InlineCode>yarn add apperio</InlineCode>,{" "}
        <InlineCode>pnpm add apperio</InlineCode>). The package ships ES module and CommonJS
        builds with TypeScript types.
      </DocP>

      <DocH2 id="initialise">3. Create the logger</DocH2>
      <DocP>
        Create one logger, as early as possible in your app’s startup code, so errors that
        happen early are caught too:
      </DocP>
      <CodeBlock
        language="ts"
        filename="src/apperio.ts"
        code={`
import { Apperio } from 'apperio';

export const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  environment: 'production',
  serviceName: 'web',
});
`}
      />
      <DocP>
        Creating the logger starts it: it begins capturing errors, page views and slow
        requests straight away. There is no separate <InlineCode>init()</InlineCode> call.
      </DocP>
      <DocCallout type="warning" title="Set environment in production">
        <p>
          If you leave <InlineCode>environment</InlineCode> out, every log is tagged{" "}
          <InlineCode>development</InlineCode>. New-error notifications only go out for{" "}
          <InlineCode>production</InlineCode> unless you change that in{" "}
          <DocStrong>Settings › Notifications</DocStrong>, so without it you won’t hear about
          new errors.
        </p>
        <p>
          A common pattern is to pass your build’s environment variable, for example{" "}
          <InlineCode>process.env.NODE_ENV</InlineCode>.
        </p>
      </DocCallout>
      <DocP>
        The API key ends up in your site’s JavaScript, where anyone can read it. That is
        expected for browser SDKs; see{" "}
        <DocLink href="/docs/concepts/projects-and-api-keys">Projects and API keys</DocLink>{" "}
        for what that means.
      </DocP>

      <DocH2 id="first-error">4. Send a test error</DocH2>
      <DocP>
        Throw an error nobody catches. In the browser, the SDK reports it on its own:
      </DocP>
      <CodeBlock
        language="ts"
        code={`
setTimeout(() => {
  throw new Error('Apperio test error');
}, 0);
`}
      />
      <DocP>Or report one yourself, with extra detail attached:</DocP>
      <CodeBlock
        language="ts"
        code={`
logger.error('Checkout failed', new Error('Card declined'), {
  orderId: 'order-123',
});
`}
      />
      <DocP>
        Logs are sent in batches: when 10 are waiting, every 5 seconds, and when the visitor
        leaves or hides the page. Expect your test error within about 5 seconds.
      </DocP>

      <DocH2 id="see-it">5. See it in Apperio</DocH2>
      <DocOl>
        <DocLi>
          <DocStrong>Issues</DocStrong> shows a new issue titled{" "}
          <InlineCode>Error: Apperio test error</InlineCode>. Open it to see the stack trace,
          how many times it happened and how many sessions it reached.
        </DocLi>
        <DocLi>
          <DocStrong>Logs</DocStrong> shows the raw entry, along with the page view the SDK
          sent when the page loaded.
        </DocLi>
        <DocLi>
          As the project owner, you get a notification in the app and an email saying there
          is a new error, as long as the error’s environment is one you are notified about.
        </DocLi>
      </DocOl>
      <DocP>
        Nothing showing up? See{" "}
        <DocLink href="/docs/sdk/troubleshooting">Troubleshooting</DocLink>.
      </DocP>

      <DocH2 id="next-steps">Next steps</DocH2>
      <DocUl>
        <DocLi>
          <DocLink href="/docs/concepts/connect-github">Connect GitHub</DocLink> so Apperio can
          show which commit probably caused each error.
        </DocLi>
        <DocLi>
          <DocLink href="/docs/environments-and-releases">Add a release</DocLink> to every
          log, so you can tell which version of your code an error came from.
        </DocLi>
        <DocLi>
          <DocLink href="/docs/concepts/deploys">Record your deploys</DocLink> to get a
          verdict on each one.
        </DocLi>
        <DocLi>
          Using React or Next.js? Follow the{" "}
          <DocLink href="/docs/guides/react">React</DocLink> or{" "}
          <DocLink href="/docs/guides/nextjs">Next.js</DocLink> guide, which also report the
          errors those frameworks catch for you.
        </DocLi>
      </DocUl>
    </DocPage>
  );
}
