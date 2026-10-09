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
  { id: "env", title: "1. Add your keys", level: 2 },
  { id: "browser-logger", title: "2. Create the browser logger", level: 2 },
  { id: "start-it", title: "3. Start it from the root layout", level: 2 },
  { id: "error-files", title: "4. Report errors Next.js catches", level: 2 },
  { id: "server", title: "5. Log on the server", level: 2 },
  { id: "runtime", title: "Node.js runtime only", level: 3 },
  { id: "notes", title: "Notes", level: 2 },
];

const C = InlineCode;

export default function NextjsGuidePage() {
  return (
    <DocPage slug="guides/nextjs" toc={toc}>
      <DocP>
        For the App Router in Next.js 13.4 and later. The browser side reports page views,
        uncaught errors and slow requests; the server side lets route handlers log. Install
        the SDK first: <C>npm install apperio</C>.
      </DocP>

      <DocH2 id="env">1. Add your keys</DocH2>
      <CodeBlock
        language="bash"
        filename=".env.local"
        code={`
NEXT_PUBLIC_APPERIO_API_KEY=your-api-key
NEXT_PUBLIC_APPERIO_PROJECT_ID=your-project-id

# Only needed for step 5, server logging
APPERIO_API_KEY=your-api-key
APPERIO_PROJECT_ID=your-project-id
`}
      />
      <DocP>
        The <C>NEXT_PUBLIC_</C> prefix puts the values in the browser bundle, which the
        browser SDK needs. Set the same variables in your hosting provider.
      </DocP>

      <DocH2 id="browser-logger">2. Create the browser logger</DocH2>
      <DocP>
        Create the logger lazily, the first time it is needed in the browser. Creating it at
        module level would also run it during server rendering.
      </DocP>
      <CodeBlock
        language="ts"
        filename="lib/apperio.ts"
        code={`
import { Apperio } from 'apperio';

let logger: Apperio | null = null;

/**
 * The browser logger, created on first use. Returns null during server
 * rendering and when the environment variables are missing.
 */
export function getLogger(): Apperio | null {
  if (typeof window === 'undefined') return null;
  if (logger) return logger;

  const apiKey = process.env.NEXT_PUBLIC_APPERIO_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_APPERIO_PROJECT_ID;
  if (!apiKey || !projectId) return null;

  logger = new Apperio({
    apiKey,
    projectId,
    environment: process.env.NODE_ENV,
    serviceName: 'web',
  });
  return logger;
}
`}
      />
      <DocP>
        <C>process.env.NODE_ENV</C> is <C>production</C> in a production build, which is the
        environment new-error notifications follow by default.
      </DocP>

      <DocH2 id="start-it">3. Start it from the root layout</DocH2>
      <DocP>A client component that starts the logger and renders nothing:</DocP>
      <CodeBlock
        language="tsx"
        filename="components/apperio-provider.tsx"
        code={`
'use client';

import { useEffect } from 'react';
import { getLogger } from '@/lib/apperio';

export function ApperioProvider() {
  useEffect(() => {
    getLogger();
  }, []);

  return null;
}
`}
      />
      <CodeBlock
        language="tsx"
        filename="app/layout.tsx"
        code={`
import type { ReactNode } from 'react';
import { ApperioProvider } from '@/components/apperio-provider';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApperioProvider />
        {children}
      </body>
    </html>
  );
}
`}
      />
      <DocP>
        The layout stays a server component. Client-side navigations keep the same logger
        and the same session, and each one is logged as a page view.
      </DocP>

      <DocH2 id="error-files">4. Report errors Next.js catches</DocH2>
      <DocP>
        Next.js wraps each route segment in an error boundary. An error caught there shows
        your <C>error.tsx</C> instead of reaching the window, so the SDK doesn’t see it.
        Report it from the file:
      </DocP>
      <CodeBlock
        language="tsx"
        filename="app/error.tsx"
        code={`
'use client';

import { useEffect } from 'react';
import { getLogger } from '@/lib/apperio';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    getLogger()?.error('Page error', error, { digest: error.digest });
  }, [error]);

  return (
    <div>
      <p>Something went wrong.</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
`}
      />
      <DocP>
        Errors in the root layout itself are handled by <C>app/global-error.tsx</C>, which
        replaces the whole page, so it renders its own <C>html</C> and <C>body</C>:
      </DocP>
      <CodeBlock
        language="tsx"
        filename="app/global-error.tsx"
        code={`
'use client';

import { useEffect } from 'react';
import { getLogger } from '@/lib/apperio';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    getLogger()?.fatal('Root layout error', error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <p>Something went wrong.</p>
      </body>
    </html>
  );
}
`}
      />
      <DocCallout type="info" title="Errors from server components">
        In production, an error thrown while rendering a server component reaches the
        browser with a generic message and a <C>digest</C>, not the real message. Both files
        above still report it with the digest; log the real error on the server, as in the
        next step, to see the details.
      </DocCallout>

      <DocH2 id="server">5. Log on the server</DocH2>
      <DocP>
        Use a separate logger on the server. Keep it on <C>globalThis</C> so hot reloading
        in development doesn’t create a new one on every change:
      </DocP>
      <CodeBlock
        language="ts"
        filename="lib/apperio-server.ts"
        code={`
import { Apperio } from 'apperio';

const globalForApperio = globalThis as typeof globalThis & { apperioServer?: Apperio };

/** The server logger, created on first use. Returns null without credentials. */
export function getServerLogger(): Apperio | null {
  if (globalForApperio.apperioServer) return globalForApperio.apperioServer;

  const apiKey = process.env.APPERIO_API_KEY;
  const projectId = process.env.APPERIO_PROJECT_ID;
  if (!apiKey || !projectId) return null;

  globalForApperio.apperioServer = new Apperio({
    apiKey,
    projectId,
    environment: process.env.NODE_ENV,
    serviceName: 'web-server',
  });
  return globalForApperio.apperioServer;
}
`}
      />
      <DocP>
        In a route handler, flush before the response is sent. On serverless hosting the
        function may be frozen as soon as it returns, before a batch goes out:
      </DocP>
      <CodeBlock
        language="ts"
        filename="app/api/orders/route.ts"
        code={`
import { getServerLogger } from '@/lib/apperio-server';

export async function POST(request: Request) {
  const logger = getServerLogger();
  try {
    const { orderId } = (await request.json()) as { orderId: string };
    await processOrder(orderId);
    logger?.info('Order placed', { orderId });
    return Response.json({ ok: true });
  } catch (err) {
    logger?.error('Order failed', err instanceof Error ? err : new Error(String(err)));
    return Response.json({ error: 'Order failed' }, { status: 500 });
  } finally {
    await logger?.flush();
  }
}
`}
      />
      <DocP>
        Errors on the server are never captured automatically; report them as above. See{" "}
        <DocLink href="/docs/guides/nodejs">Node.js</DocLink> for more.
      </DocP>

      <DocH3 id="runtime">Node.js runtime only</DocH3>
      <DocP>
        Use the server logger in the Node.js runtime, the default for route handlers and
        server components. When it starts on a server, the SDK registers Node.js process
        handlers, which the Edge runtime and middleware don’t provide.
      </DocP>

      <DocH2 id="notes">Notes</DocH2>
      <DocUl>
        <DocLi>
          The browser logger starts after the page hydrates, so an error thrown during
          hydration itself isn’t captured by the SDK. <C>error.tsx</C> still reports
          rendering errors.
        </DocLi>
        <DocLi>
          If you run <C>next start</C> yourself, note that the SDK exits the process after
          sending its logs on <C>SIGTERM</C>. See <DocLink href="/docs/sdk/shutdown#node">Shutdown</DocLink>.
        </DocLi>
        <DocLi>
          Session replay needs no extra code: turn it on in the dashboard. See{" "}
          <DocLink href="/docs/concepts/session-replay">Session replay</DocLink>.
        </DocLi>
      </DocUl>
    </DocPage>
  );
}
