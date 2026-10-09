import {
  DocPage,
  DocH2,
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
  { id: "overview", title: "Overview", level: 2 },
  { id: "levels", title: "Levels decide what is sent", level: 2 },
  { id: "errors", title: "errors", level: 2 },
  { id: "performance", title: "performance", level: 2 },
  { id: "network", title: "networkRequests", level: 2 },
  { id: "page-views", title: "pageViews", level: 2 },
  { id: "console", title: "consoleMessages", level: 2 },
  { id: "interactions", title: "userInteractions", level: 2 },
  { id: "breadcrumb-trail", title: "The breadcrumb trail", level: 2 },
  { id: "how-it-hooks-in", title: "How it hooks in", level: 2 },
];

const C = InlineCode;

export default function AutoInstrumentationPage() {
  return (
    <DocPage slug="sdk/auto-instrumentation" toc={toc}>
      <DocH2 id="overview">Overview</DocH2>
      <DocP>
        In a browser, the SDK captures events without any code from you. Choose which with{" "}
        <C>autoCapture</C>; anything you leave out keeps its default.
      </DocP>
      <CodeBlock
        language="ts"
        code={`
import { Apperio } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  autoCapture: {
    errors: true,           // default true
    performance: true,      // default true
    networkRequests: true,  // default true
    pageViews: true,        // default true
    consoleMessages: false, // default false
    userInteractions: false // default false
  },
});
`}
      />
      <DocP>
        None of this runs in Node.js. On a server, log what you need yourself; see the{" "}
        <DocLink href="/docs/guides/nodejs">Node.js guide</DocLink>.
      </DocP>

      <DocH2 id="levels">Levels decide what is sent</DocH2>
      <DocP>
        Every captured event becomes a log with a level, and the SDK drops logs below{" "}
        <C>minLogLevel</C> (default <C>info</C>). Many routine events are logged at{" "}
        <C>debug</C> or <C>trace</C>, so they are captured but never sent unless you lower{" "}
        <C>minLogLevel</C>. The tables below list each event’s level.
      </DocP>

      <DocH2 id="errors">errors</DocH2>
      <DocTable
        headers={["Event", "Level", "Message"]}
        rows={[
          ["Uncaught error (window error event)", <C key="l">error</C>, "The error’s name and message, such as TypeError: x is undefined"],
          ["Unhandled promise rejection", <C key="l">error</C>, "The rejection’s name and message"],
        ]}
      />
      <DocP>
        Each report includes the stack trace, the file, line and column the browser gave,
        the recent <DocLink href="#breadcrumb-trail">breadcrumb trail</DocLink>,
        and a snapshot of the page: its address, viewport size, scroll position, whether the
        browser was online and, where the browser exposes them, the connection type and
        memory use. See <DocLink href="/docs/sdk/error-tracking">Error tracking</DocLink>.
      </DocP>

      <DocH2 id="performance">performance</DocH2>
      <DocTable
        headers={["Event", "Level"]}
        rows={[
          ["Page load", <span key="l"><C>warn</C> over 3 s, <C>info</C> over 1 s, otherwise <C>debug</C></span>],
          ["Script or stylesheet", <span key="l"><C>warn</C> over 3 s, <C>info</C> over 1 s, otherwise <C>debug</C></span>],
          ["Other resource", <span key="l"><C>warn</C> over 3 s, otherwise <C>debug</C></span>],
          ["Paint timing and your own performance measures", <C key="l">debug</C>],
          ["LCP", <span key="l"><C>warn</C> over 4 s, <C>info</C> over 2.5 s, otherwise <C>debug</C></span>],
          ["CLS", <span key="l"><C>warn</C> over 0.25, <C>info</C> over 0.1, otherwise <C>debug</C></span>],
          ["INP, per interaction of 40 ms or more", <span key="l"><C>warn</C> over 500 ms, <C>info</C> over 200 ms, otherwise <C>debug</C></span>],
        ]}
      />
      <DocP>
        Web Vitals carry a <C>good</C>, <C>needs-improvement</C> or <C>poor</C> rating. See{" "}
        <DocLink href="/docs/concepts/performance">Performance and Web Vitals</DocLink>.
      </DocP>

      <DocH2 id="network">networkRequests</DocH2>
      <DocTable
        headers={["Event", "Level", "Message"]}
        rows={[
          ["Response with status 500 or above", <C key="l">error</C>, "Server Error"],
          ["Response with status 400 to 499", <C key="l">warn</C>, "Client Error"],
          ["Response below 400 that took over 5 s", <C key="l">warn</C>, "Slow Network Request"],
          ["Request that fails outright (fetch only)", <C key="l">error</C>, "Network Request Failed"],
          ["Any other response", <C key="l">debug</C>, "Network Request"],
        ]}
      />
      <DocP>
        Covers <C>fetch</C> and <C>XMLHttpRequest</C>, so libraries built on them, such as
        axios, are covered too. Each entry has the method, URL, status and duration. The{" "}
        <C>token</C>, <C>key</C>, <C>password</C>, <C>secret</C> and <C>api_key</C> query
        parameters are replaced with <C>[REDACTED]</C>. Requests to Apperio itself are
        skipped.
      </DocP>

      <DocH2 id="page-views">pageViews</DocH2>
      <DocP>
        Logs a <C>Page View</C> at <C>info</C> when the page loads and after every{" "}
        <C>history.pushState</C>, <C>history.replaceState</C> and back or forward
        navigation, with the address, title and referrer. Single-page app route changes
        are therefore counted, and so are calls to <C>replaceState</C> that don’t change the
        page.
      </DocP>

      <DocH2 id="console">consoleMessages</DocH2>
      <DocTable
        headers={["Call", "Level", "Message"]}
        rows={[
          [<C key="c">console.error</C>, <C key="l">error</C>, "Console Error"],
          [<C key="c">console.warn</C>, <C key="l">warn</C>, "Console Warning"],
          [<C key="c">console.log</C>, <C key="l">info</C>, "Console Log"],
          [<C key="c">console.info</C>, <C key="l">info</C>, "Console Info"],
          [<C key="c">console.debug</C>, <C key="l">debug</C>, "Console Debug"],
        ]}
      />
      <DocP>
        The arguments are converted to strings and stored in the log’s data. The console
        still prints as usual.
      </DocP>
      <DocCallout type="warning" title="Noisy, and it counts itself">
        <p>
          Every <C>console.error</C> becomes an error and can open an issue, including ones
          from third-party scripts.
        </p>
        <p>
          The SDK’s own console messages are captured too, such as{" "}
          <C>Apperio: Network error on attempt 1</C> when Apperio can’t be reached. Turn
          this on while investigating, not permanently.
        </p>
      </DocCallout>

      <DocH2 id="interactions">userInteractions</DocH2>
      <DocTable
        headers={["Event", "Level"]}
        rows={[
          ["Click, with the element’s selector and coordinates", <C key="l">debug</C>],
          ["Focus and blur", <C key="l">debug</C>],
          ["Scroll, at most one per 100 ms", <C key="l">trace</C>],
          ["Key press, at most one per 100 ms, without the key", <C key="l">trace</C>],
        ]}
      />
      <DocP>
        All of these are below <C>info</C>, so with the default level none are sent. Clicks
        still feed the breadcrumb trail. To see clicks and scrolling in context, use{" "}
        <DocLink href="/docs/concepts/session-replay">session replay</DocLink> instead.
      </DocP>

      <DocH2 id="breadcrumb-trail">The breadcrumb trail</DocH2>
      <DocP>
        The SDK keeps the last 50 page views, network requests, console messages and clicks
        it has captured (each kind only when its capture is on), and attaches them to every
        error it captures by itself. The trail lives in memory and is only sent as part of
        an error. <C>logger.addBreadcrumb()</C> doesn’t add to it.
      </DocP>

      <DocH2 id="how-it-hooks-in">How it hooks in</DocH2>
      <DocUl>
        <DocLi>
          <C>window.fetch</C> and <C>XMLHttpRequest.prototype.open</C> and <C>send</C> are
          wrapped.
        </DocLi>
        <DocLi><C>history.pushState</C> and <C>replaceState</C> are wrapped.</DocLi>
        <DocLi>The <C>console</C> methods are wrapped when <C>consoleMessages</C> is on.</DocLi>
        <DocLi>
          Errors, rejections and interactions use event listeners; timings use{" "}
          <C>PerformanceObserver</C>.
        </DocLi>
      </DocUl>
      <DocP>
        <C>logger.shutdown()</C> removes all of them and restores the originals.
      </DocP>
    </DocPage>
  );
}
