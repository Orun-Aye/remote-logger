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
  { id: "create-the-logger", title: "1. Create the logger", level: 2 },
  { id: "load-it-first", title: "2. Load it before rendering", level: 2 },
  { id: "error-boundary", title: "3. Report errors React catches", level: 2 },
  { id: "use-it", title: "4. Log from components", level: 2 },
  { id: "notes", title: "Notes", level: 2 },
];

const C = InlineCode;

export default function ReactGuidePage() {
  return (
    <DocPage slug="guides/react" toc={toc}>
      <DocP>
        This guide is for a React app that runs in the browser, such as one built with Vite.
        For Next.js, use the <DocLink href="/docs/guides/nextjs">Next.js guide</DocLink>. The
        code works with React 18 and 19. Install the SDK first:{" "}
        <C>npm install apperio</C>.
      </DocP>

      <DocH2 id="create-the-logger">1. Create the logger</DocH2>
      <DocP>Create one logger in its own module and import it wherever you need it:</DocP>
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
  release: '1.0.0',
});
`}
      />
      <DocP>
        Fill these in from your build’s environment variables. In Vite, for example, read{" "}
        <C>import.meta.env.VITE_APPERIO_API_KEY</C> and{" "}
        <C>import.meta.env.MODE</C>. The API key is public once it is in your bundle;
        that is expected.
      </DocP>

      <DocH2 id="load-it-first">2. Load it before rendering</DocH2>
      <DocP>
        Import the module at the top of your entry file, so the logger exists before React
        renders anything and catches errors from the very first render:
      </DocP>
      <CodeBlock
        language="tsx"
        filename="src/main.tsx"
        code={`
import './apperio';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
`}
      />
      <DocP>
        Because the logger is created once at module level, Strict Mode’s double rendering
        doesn’t create a second one.
      </DocP>

      <DocH2 id="error-boundary">3. Report errors React catches</DocH2>
      <DocP>
        When an error boundary catches a rendering error, React shows the fallback and the
        error doesn’t reach the window, so the SDK never sees it. Log it from{" "}
        <C>componentDidCatch</C>:
      </DocP>
      <CodeBlock
        language="tsx"
        filename="src/ErrorBoundary.tsx"
        code={`
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from './apperio';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('React render error', error, {
      componentStack: info.componentStack ?? undefined,
    });
  }

  render() {
    if (this.state.hasError) {
      return <p>Something went wrong. Please reload the page.</p>;
    }
    return this.props.children;
  }
}
`}
      />
      <DocP>
        The component stack goes with the error, so you can see which component failed.
        Errors outside rendering, such as in event handlers and timers, don’t go through
        boundaries; the SDK captures those itself.
      </DocP>

      <DocH2 id="use-it">4. Log from components</DocH2>
      <CodeBlock
        language="tsx"
        filename="src/CheckoutButton.tsx"
        code={`
import { logger } from './apperio';

export function CheckoutButton({ orderId }: { orderId: string }) {
  const handleClick = async () => {
    logger.info('Checkout started', { orderId });
    try {
      await processOrder(orderId);
    } catch (err) {
      logger.error('Checkout failed', err instanceof Error ? err : new Error(String(err)), {
        orderId,
      });
    }
  };

  return <button onClick={handleClick}>Pay now</button>;
}
`}
      />
      <DocP>
        To tag every later log with the signed-in user, call{" "}
        <C>{`logger.setContext({ userId })`}</C> after sign-in and{" "}
        <C>logger.clearContext()</C> after sign-out. Avoid emails and names: an ID is enough
        to find the user in your own systems.
      </DocP>

      <DocH2 id="notes">Notes</DocH2>
      <DocUl>
        <DocLi>
          Route changes made with React Router, or anything else that uses the History API,
          are logged as page views and stay in the same session.
        </DocLi>
        <DocLi>
          Turn on <DocLink href="/docs/concepts/session-replay">session replay</DocLink> from
          the dashboard; no code change is needed.
        </DocLi>
      </DocUl>
      <DocCallout type="tip" title="Seeing it work">
        Throw an error from a button’s click handler in development, with{" "}
        <C>environment</C> set to <C>production</C> just for the test, and it appears in
        Issues within a few seconds.
      </DocCallout>
    </DocPage>
  );
}
