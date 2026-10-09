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
  { id: "what-it-is", title: "What a replay is", level: 2 },
  { id: "turn-it-on", title: "Turn it on", level: 2 },
  { id: "privacy", title: "What is hidden", level: 2 },
  { id: "watch", title: "Watch a replay", level: 2 },
  { id: "limits", title: "Limits", level: 2 },
];

export default function SessionReplayConceptPage() {
  return (
    <DocPage slug="concepts/session-replay" toc={toc}>
      <DocH2 id="what-it-is">What a replay is</DocH2>
      <DocP>
        A replay isn’t a video. The SDK records the page’s structure and every change to
        it, along with clicks, scrolling and mouse movement, and the dashboard rebuilds the
        page from that record. You see the page as the visitor saw it and what they did on
        it. Recording uses the open source rrweb library, which the SDK downloads only when
        a visit is being recorded.
      </DocP>

      <DocH2 id="turn-it-on">Turn it on</DocH2>
      <DocP>Replay is off until you turn it on. From the dashboard:</DocP>
      <DocOl>
        <DocLi>
          Open <DocStrong>Settings › Session Replay</DocStrong> and switch on{" "}
          <DocStrong>Record sessions</DocStrong>.
        </DocLi>
        <DocLi>
          Choose how many visits to record: 1%, 10%, 25%, 50% or 100%. The default is 10%.
        </DocLi>
        <DocLi>Save. Visitors pick up the change within 5 minutes, on their next page load.</DocLi>
      </DocOl>
      <DocP>
        The setting applies to every site or app sending data with this project’s API key.
        You can also decide in code, which overrides the dashboard; see{" "}
        <DocLink href="/docs/sdk/replay">Replay options</DocLink>.
      </DocP>

      <DocH2 id="privacy">What is hidden</DocH2>
      <DocP>
        Masking happens in the visitor’s browser before anything is recorded, so hidden text
        never reaches Apperio.
      </DocP>
      <DocUl>
        <DocLi>
          <DocStrong>Form fields.</DocStrong> Every input, textarea and select value is
          recorded as asterisks. Password fields are always masked, even if you turn input
          masking off in code.
        </DocLi>
        <DocLi>
          <DocStrong>Anything you mark.</DocStrong> Add the class{" "}
          <InlineCode>apperio-mask</InlineCode> to an element and its text, including text
          inside it and text added later, is recorded as asterisks. Use it for names,
          addresses, balances and anything else shown on screen that should stay private.
        </DocLi>
      </DocUl>
      <CodeBlock
        language="html"
        code={`<div class="apperio-mask">Ada Lovelace, 12 St James's Square</div>`}
      />
      <DocCallout type="warning" title="Attributes are not masked">
        <InlineCode>apperio-mask</InlineCode> hides text, not attributes. Keep private data
        out of <InlineCode>placeholder</InlineCode>, <InlineCode>title</InlineCode>,{" "}
        <InlineCode>alt</InlineCode> and <InlineCode>aria-label</InlineCode>. Text typed into
        a <InlineCode>contenteditable</InlineCode> element counts as page text, so put the
        class on the editable element itself.
      </DocCallout>

      <DocH2 id="watch">Watch a replay</DocH2>
      <DocUl>
        <DocLi>
          From an issue: <DocStrong>Watch replay</DocStrong> appears when a recorded visit
          hit that error. It opens the newest such recording a few seconds before the error.
        </DocLi>
        <DocLi>
          From <DocStrong>Sessions</DocStrong>: open a session and choose the Replay tab.
        </DocLi>
      </DocUl>
      <DocP>Replays are deleted 7 days after they are recorded.</DocP>

      <DocH2 id="limits">Limits</DocH2>
      <DocUl>
        <DocLi>
          <DocStrong>One page load per replay.</DocStrong> A session ends when the page
          reloads or the visitor follows a link that loads a new page, so each replay covers
          one page load. Route changes inside a single-page app stay in the same replay.
        </DocLi>
        <DocLi>
          <DocStrong>Errors during page load.</DocStrong> The recorder starts once it has
          downloaded, a moment after the page loads. An error thrown before then is in your
          issues, but not in the replay.
        </DocLi>
        <DocLi>
          <DocStrong>Upload timing.</DocStrong> The SDK uploads a piece of the recording
          every 10 seconds while something is happening, sooner after 200 events, and when
          the visitor leaves or hides the page. An idle page sends nothing.
        </DocLi>
      </DocUl>
    </DocPage>
  );
}
