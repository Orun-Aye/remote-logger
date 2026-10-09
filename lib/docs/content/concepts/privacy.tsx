import {
  DocPage,
  DocH2,
  DocP,
  DocUl,
  DocLi,
  DocStrong,
  DocLink,
  DocCallout,
  DocTable,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "where-redaction-happens", title: "Where redaction happens", level: 2 },
  { id: "what-is-covered", title: "What is covered", level: 2 },
  { id: "what-is-not", title: "What is not covered", level: 2 },
  { id: "browser-storage", title: "Cookies and browser storage", level: 2 },
  { id: "ai", title: "What is sent to the AI model", level: 2 },
  { id: "retention", title: "How long data is kept", level: 2 },
];

export default function PrivacyPage() {
  return (
    <DocPage slug="concepts/privacy" toc={toc}>
      <DocH2 id="where-redaction-happens">Where redaction happens</DocH2>
      <DocP>
        All redaction happens inside the SDK, before a log leaves the visitor’s browser or
        your server. It is on by default. Apperio’s servers don’t redact anything, so logs
        you send straight to the <DocLink href="/docs/api/logs">logs API</DocLink> are
        stored exactly as you send them.
      </DocP>

      <DocH2 id="what-is-covered">What is covered</DocH2>
      <DocTable
        headers={["Protection", "What it does"]}
        rows={[
          [
            "Pattern redaction",
            "Replaces emails, card numbers, US Social Security and phone numbers, IP addresses, API keys and tokens, JWTs, bank account numbers, and US driving licence and passport numbers with labels such as [EMAIL_REDACTED].",
          ],
          [
            "Field masking",
            "Masks the value of any field whose name contains password, secret, token, key, ssn or email, keeping only the first and last character.",
          ],
          [
            "Request URLs",
            "In captured network requests, replaces the token, key, password, secret and api_key query parameters with [REDACTED].",
          ],
          [
            "Session replay",
            "Records form field values as asterisks, always masks passwords, and hides the text of anything marked apperio-mask.",
          ],
        ]}
      />
      <DocP>
        Pattern redaction and field masking apply to a log’s message, its data, the context
        you set, and its metadata. The full list of patterns, and how to add your own, is in{" "}
        <DocLink href="/docs/sdk/data-sanitization">Data sanitization</DocLink>.
      </DocP>

      <DocH2 id="what-is-not">What is not covered</DocH2>
      <DocP>Some fields are sent as they are:</DocP>
      <DocUl>
        <DocLi>
          <DocStrong>The error itself</DocStrong>: its name, message and stack trace, as
          stored on the log’s <InlineCode>error</InlineCode> field. Don’t put personal data or
          secrets in error messages.
        </DocLi>
        <DocLi>
          <DocStrong>The page address</DocStrong>, the referrer and the browser’s user agent.
          Keep tokens and personal data out of your page URLs.
        </DocLi>
      </DocUl>
      <DocCallout type="warning" title="Patterns are not perfect">
        Redaction works by matching text. It can miss personal data in a format it doesn’t
        know, and it can redact harmless text that looks like personal data, such as a
        nine-digit order number. Don’t rely on it as your only safeguard: avoid logging
        personal data in the first place.
      </DocCallout>

      <DocH2 id="browser-storage">Cookies and browser storage</DocH2>
      <DocP>
        The SDK sets no cookies and doesn’t use local storage, session storage or IndexedDB.
        Everything it keeps, such as the session ID and logs waiting to be sent, lives in
        memory and is gone when the page closes.
      </DocP>

      <DocH2 id="ai">What is sent to the AI model</DocH2>
      <DocP>
        Commit summaries, change explanations, suspect commit ranking, issue drafts and
        root cause analysis are written by Anthropic’s Claude. To do that, Apperio sends it:
      </DocP>
      <DocUl>
        <DocLi>for commits: the message, the changed file names and an excerpt of the diff;</DocLi>
        <DocLi>
          for errors: the message, the stack trace, the page it happened on, its release
          and occurrence counts, and the candidate commits’ messages and file names.
        </DocLi>
      </DocUl>

      <DocH2 id="retention">How long data is kept</DocH2>
      <DocUl>
        <DocLi>
          Logs: 30 days by default, adjustable in <DocStrong>Settings › Retention</DocStrong>.
        </DocLi>
        <DocLi>Session replays: 7 days.</DocLi>
      </DocUl>
    </DocPage>
  );
}
