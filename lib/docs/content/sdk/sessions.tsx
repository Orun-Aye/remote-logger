import {
  DocPage,
  DocH2,
  DocP,
  DocUl,
  DocLi,
  DocLink,
  DocStrong,
  DocTable,
  CodeBlock,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "what-a-session-is", title: "What a session is", level: 2 },
  { id: "how-long", title: "How long a session lasts", level: 2 },
  { id: "what-uses-it", title: "What uses it", level: 2 },
  { id: "reading-the-id", title: "Reading the session ID", level: 2 },
];

const C = InlineCode;

export default function SessionsPage() {
  return (
    <DocPage slug="sdk/sessions" toc={toc}>
      <DocH2 id="what-a-session-is">What a session is</DocH2>
      <DocP>
        Every log carries a <C>sessionId</C>, a random ID the SDK creates for the page. You
        don’t configure it. Every Apperio logger on the same page shares the same session.
      </DocP>

      <DocH2 id="how-long">How long a session lasts</DocH2>
      <DocP>
        The ID lives in memory only. The SDK uses no cookies, local storage or session
        storage, so it has nowhere to keep the ID across page loads:
      </DocP>
      <DocTable
        headers={["What the visitor does", "Session"]}
        rows={[
          ["Moves between routes in a single-page app", "Same session"],
          ["Reloads the page, or follows a link that loads a new page", "New session"],
          ["Opens the site in another tab", "New session"],
        ]}
      />
      <DocP>
        So one person browsing a site where each link loads a new page produces several
        sessions. Session counts read higher, and each session shorter, than a
        visitor-based count would. This is a known limit of the current version.
      </DocP>

      <DocH2 id="what-uses-it">What uses it</DocH2>
      <DocUl>
        <DocLi>The <DocStrong>Sessions</DocStrong> page, which groups logs by session.</DocLi>
        <DocLi>
          <DocStrong>Sessions affected</DocStrong> on each issue. See{" "}
          <DocLink href="/docs/concepts/errors-and-issues#sessions-affected">Errors and issues</DocLink>.
        </DocLi>
        <DocLi>
          Session replay, which matches each recording to the logs from the same session.
        </DocLi>
      </DocUl>

      <DocH2 id="reading-the-id">Reading the session ID</DocH2>
      <DocP>
        To connect Apperio sessions with your own analytics or support tools, read the ID:
      </DocP>
      <CodeBlock
        language="ts"
        code={`
import { getSessionId } from 'apperio';

const sessionId = getSessionId(); // the same value every log on this page carries
`}
      />
    </DocPage>
  );
}
