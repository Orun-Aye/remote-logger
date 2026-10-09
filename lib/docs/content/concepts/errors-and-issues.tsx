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
  { id: "what-counts", title: "What counts as an error", level: 2 },
  { id: "grouping", title: "How errors are grouped", level: 2 },
  { id: "issues-page", title: "The Issues page", level: 2 },
  { id: "sessions-affected", title: "Sessions affected", level: 2 },
  { id: "statuses", title: "Statuses and regressions", level: 2 },
  { id: "notifications", title: "Notifications", level: 2 },
];

export default function ErrorsAndIssuesPage() {
  return (
    <DocPage slug="concepts/errors-and-issues" toc={toc}>
      <DocH2 id="what-counts">What counts as an error</DocH2>
      <DocP>
        Any log at level <InlineCode>error</InlineCode> or <InlineCode>fatal</InlineCode>{" "}
        becomes part of an issue. In the browser that includes, with the default settings:
      </DocP>
      <DocUl>
        <DocLi>uncaught errors and unhandled promise rejections;</DocLi>
        <DocLi>requests that fail outright, and responses with a 5xx status;</DocLi>
        <DocLi>
          whatever you send with <InlineCode>logger.error()</InlineCode>,{" "}
          <InlineCode>logger.fatal()</InlineCode> or{" "}
          <InlineCode>logger.captureException()</InlineCode>.
        </DocLi>
      </DocUl>
      <DocP>
        With <InlineCode>consoleMessages</InlineCode> turned on, every{" "}
        <InlineCode>console.error()</InlineCode> call counts too. See{" "}
        <DocLink href="/docs/sdk/auto-instrumentation">Auto-instrumentation</DocLink>.
      </DocP>

      <DocH2 id="grouping">How errors are grouped</DocH2>
      <DocP>
        Each error gets a fingerprint built from three things:
      </DocP>
      <DocUl>
        <DocLi>the error’s name, such as <InlineCode>TypeError</InlineCode>;</DocLi>
        <DocLi>
          its message, with the parts that change between occurrences replaced: IDs, long
          hex strings, numbers of two or more digits, timestamps, and URL paths and query
          strings;
        </DocLi>
        <DocLi>
          the top five frames of the stack trace, without line and column numbers, query
          strings or domains.
        </DocLi>
      </DocUl>
      <DocP>
        Errors with the same fingerprint form one issue, titled with the name and message,
        for example <InlineCode>TypeError: Cannot read properties of undefined</InlineCode>.
        Grouping is deliberately cautious: two different bugs wrongly merged hide one of
        them, so when in doubt Apperio keeps them apart.
      </DocP>
      <DocCallout type="tip" title="Errors without a stack trace">
        Errors that carry no stack, such as the SDK’s <InlineCode>Server Error</InlineCode>{" "}
        entries for 5xx responses, are grouped by name and message alone. All 5xx responses
        therefore land in one issue; open it and use <DocStrong>View events in logs</DocStrong>{" "}
        to see which requests failed.
      </DocCallout>

      <DocH2 id="issues-page">The Issues page</DocH2>
      <DocP>
        The list shows each issue’s <DocStrong>Events</DocStrong>,{" "}
        <DocStrong>Sessions</DocStrong>, <DocStrong>Last seen</DocStrong> and{" "}
        <DocStrong>Status</DocStrong>, with the environments it appeared in and the release
        it was first seen in. Click an issue to open it:
      </DocP>
      <DocTable
        headers={["Part", "What it shows"]}
        rows={[
          ["Occurrences, Sessions affected, Last seen", "How big the problem is and whether it is still happening."],
          ["Likely caused by", "Recent commits that probably introduced it. See Suspect commits."],
          ["Stack trace", "The stack from the most recent occurrence."],
          ["Watch replay", "Appears when a recorded session hit this error (session replay, beta)."],
          ["View events in logs", "Opens the Logs page filtered to this error’s message."],
          ["Resolve, Ignore, Reopen", "Change the issue’s status (owner or admin)."],
          ["Create GitHub issue", "Drafts a GitHub issue from the error. See GitHub issues."],
        ]}
      />
      <DocP>
        Related pages: <DocLink href="/docs/concepts/suspect-commits">Suspect commits</DocLink>,{" "}
        <DocLink href="/docs/concepts/github-issues">GitHub issues</DocLink>,{" "}
        <DocLink href="/docs/concepts/session-replay">Session replay</DocLink>.
      </DocP>

      <DocH2 id="sessions-affected">Sessions affected</DocH2>
      <DocP>
        A session is one page load in one browser tab (see{" "}
        <DocLink href="/docs/sdk/sessions">Sessions</DocLink>). <DocStrong>Sessions affected</DocStrong>{" "}
        counts the different sessions an error appeared in, so one visitor who reloads three
        times and hits the error each time counts as three. The count stops at 500.
      </DocP>

      <DocH2 id="statuses">Statuses and regressions</DocH2>
      <DocUl>
        <DocLi>
          <DocStrong>Unresolved:</DocStrong> new issues start here.
        </DocLi>
        <DocLi>
          <DocStrong>Resolved:</DocStrong> you marked it fixed, or closed its GitHub issue
          (shown as <DocStrong>Resolved via GitHub</DocStrong>).
        </DocLi>
        <DocLi>
          <DocStrong>Ignored:</DocStrong> it keeps counting new events but stays out of the
          Unresolved list and doesn’t notify you again.
        </DocLi>
        <DocLi>
          <DocStrong>Regressed:</DocStrong> a resolved issue that happened again. It goes back
          to Unresolved with this label, and the owner is notified, at most once every 30
          minutes for the same issue.
        </DocLi>
      </DocUl>

      <DocH2 id="notifications">Notifications</DocH2>
      <DocP>
        The first time a new kind of error appears, the project owner is notified in the app
        and by email, with no alert rule needed. Repeat occurrences of a known issue don’t
        notify. See{" "}
        <DocLink href="/docs/concepts/notifications-and-alerts">Notifications and alerts</DocLink>{" "}
        for the environment filter and for alert rules.
      </DocP>
    </DocPage>
  );
}
