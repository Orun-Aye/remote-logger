import {
  DocPage,
  DocH2,
  DocP,
  DocUl,
  DocLi,
  DocLink,
  DocStrong,
  DocCallout,
  DocTable,
  CodeBlock,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "options", title: "Options", level: 2 },
  { id: "who-decides", title: "Code or dashboard", level: 2 },
  { id: "examples", title: "Examples", level: 2 },
  { id: "bundle-size", title: "Bundle size", level: 2 },
  { id: "checking", title: "Checking it is recording", level: 2 },
];

const C = InlineCode;

export default function SdkReplayPage() {
  return (
    <DocPage slug="sdk/replay" toc={toc}>
      <DocP>
        What gets recorded, what is masked and where to watch replays is covered in{" "}
        <DocLink href="/docs/concepts/session-replay">Session replay</DocLink>. This page is
        the SDK side. Replay only runs in a browser.
      </DocP>

      <DocH2 id="options">Options</DocH2>
      <DocTable
        headers={["Option", "Type", "Default", "What it does"]}
        rows={[
          [<C key="o">replay.enabled</C>, <C key="t">boolean</C>, "follows the dashboard", "Record sessions or not."],
          [
            <C key="o">replay.sampleRate</C>,
            <C key="t">number</C>,
            <span key="d"><C>0.1</C> when your code sets <C>enabled</C>; otherwise the dashboard’s rate</span>,
            "Share of sessions to record, from 0 to 1.",
          ],
          [<C key="o">replay.maskAllInputs</C>, <C key="t">boolean</C>, <C key="d">true</C>, "Record every form value as asterisks. Passwords are masked either way."],
        ]}
      />
      <DocP>
        Whether a session is recorded is decided once, when the logger starts, and doesn’t
        change if you create the logger again on the same page.
      </DocP>

      <DocH2 id="who-decides">Code or dashboard</DocH2>
      <DocUl>
        <DocLi>
          If your code leaves <C>replay.enabled</C> out, the SDK asks Apperio for the
          project’s <DocStrong>Settings › Session Replay</DocStrong> choice when it starts.
          The answer is cached by the browser for 5 minutes. If the request fails, nothing is
          recorded.
        </DocLi>
        <DocLi>
          If your code sets <C>replay.enabled</C>, that decides it and the dashboard switch
          is ignored.
        </DocLi>
        <DocLi>
          A <C>replay.sampleRate</C> in your code always wins over the dashboard’s rate.
        </DocLi>
      </DocUl>

      <DocH2 id="examples">Examples</DocH2>
      <DocP>Record 10% of sessions, whatever the dashboard says:</DocP>
      <CodeBlock
        language="ts"
        code={`
import { Apperio } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  replay: { enabled: true, sampleRate: 0.1 },
});
`}
      />
      <DocP>Never record from this app, even if the dashboard switch is on:</DocP>
      <CodeBlock
        language="ts"
        code={`
import { Apperio } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  replay: { enabled: false },
});
`}
      />
      <DocP>Show what visitors type, except passwords (for example, a public search box):</DocP>
      <CodeBlock
        language="ts"
        code={`
import { Apperio } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  replay: { enabled: true, maskAllInputs: false },
});
`}
      />
      <DocCallout type="warning" title="Think before unmasking inputs">
        With <C>maskAllInputs: false</C>, everything typed into non-password fields is
        recorded, including emails and card numbers. Mark sensitive fields with{" "}
        <C>apperio-mask</C> if you turn masking off.
      </DocCallout>

      <DocH2 id="bundle-size">Bundle size</DocH2>
      <DocP>
        The recorder and rrweb aren’t part of the main SDK bundle. They are loaded with a
        dynamic <C>import()</C> only when a session is chosen for recording, so bundlers put
        them in a separate chunk that unrecorded visitors never download.
      </DocP>

      <DocH2 id="checking">Checking it is recording</DocH2>
      <DocP>
        <C>logger.isReplayRecording()</C> returns <C>true</C> once the recorder has loaded
        and started. It is <C>false</C> for a moment after the page loads, and stays{" "}
        <C>false</C> for sessions that weren’t sampled.
      </DocP>
    </DocPage>
  );
}
