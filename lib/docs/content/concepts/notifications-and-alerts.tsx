import {
  DocPage,
  DocH2,
  DocH3,
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
  { id: "new-error-notifications", title: "New-error notifications", level: 2 },
  { id: "notification-settings", title: "Choosing environments", level: 3 },
  { id: "alert-rules", title: "Alert rules", level: 2 },
  { id: "conditions", title: "Conditions", level: 3 },
  { id: "channels", title: "Where alerts go", level: 3 },
  { id: "quieting", title: "Cooldown, snooze and maintenance", level: 3 },
];

export default function NotificationsAndAlertsPage() {
  return (
    <DocPage slug="concepts/notifications-and-alerts" toc={toc}>
      <DocH2 id="new-error-notifications">New-error notifications</DocH2>
      <DocP>
        These need no setup. The project owner is notified:
      </DocP>
      <DocUl>
        <DocLi>the first time a new kind of error appears in the project;</DocLi>
        <DocLi>
          when a resolved error happens again (at most once every 30 minutes for the same
          error);
        </DocLi>
        <DocLi>
          when an error first seen in an environment you don’t follow reaches one you do.
        </DocLi>
      </DocUl>
      <DocP>
        Each notification appears in the app, on the <DocStrong>Notifications</DocStrong>{" "}
        page, and is sent by email to the owner’s address with a link to the error. Further
        occurrences of an error you have already heard about don’t notify again. Only the
        owner receives these; to reach the rest of the team, add an alert rule.
      </DocP>

      <DocH3 id="notification-settings">Choosing environments</DocH3>
      <DocP>
        In <DocStrong>Settings › Notifications</DocStrong> you can turn these notifications
        off, or choose which environments trigger them. The default is{" "}
        <InlineCode>production</InlineCode> only. Leave the list empty to be notified about
        every environment. Errors sent without an environment always notify. Names are
        compared without regard to case.
      </DocP>
      <DocCallout type="warning" title="Check your SDK’s environment">
        The SDK tags logs <InlineCode>development</InlineCode> unless you set{" "}
        <InlineCode>environment</InlineCode>, and the default notification setting ignores
        development. See{" "}
        <DocLink href="/docs/environments-and-releases">Environments and releases</DocLink>.
      </DocCallout>

      <DocH2 id="alert-rules">Alert rules</DocH2>
      <DocP>
        For anything beyond new errors, create a rule on the project’s{" "}
        <DocStrong>Alerts</DocStrong> pages with <DocStrong>Create Alert Rule</DocStrong>. A
        rule is checked against every log as it arrives.
      </DocP>

      <DocH3 id="conditions">Conditions</DocH3>
      <DocTable
        headers={["Field", "Matches when"]}
        rows={[
          ["Log Level", "The log is at exactly this level."],
          ["Keyword", "The message contains this text (case is ignored)."],
          ["Service", "The log’s serviceName is this value."],
          ["Environment", "The log’s environment is this value."],
          ["Event Type", "The log is of this kind: error, performance, network, console or interaction."],
          [
            "Response Time (ms)",
            "A captured network request took at least this long. Logs that aren’t network requests also pass this check, so pair it with Event Type: network.",
          ],
          ["Frequency Threshold and Interval (minutes)", "At least this many matching logs arrived within the interval. Leave the threshold empty to alert on every match."],
        ]}
      />
      <DocP>
        Fields you leave empty match anything. You can combine several conditions and
        require <DocStrong>ALL</DocStrong> or <DocStrong>ANY</DocStrong> of them.
      </DocP>

      <DocH3 id="channels">Where alerts go</DocH3>
      <DocTable
        headers={["Channel", "What you provide", "What arrives"]}
        rows={[
          ["Email", "One or more addresses", "An email with the alert, its severity and the log message."],
          ["Slack", "A Slack incoming webhook URL", "A message with severity, status, message and environment."],
          [
            "Webhook",
            "Any HTTPS URL",
            <span key="w">
              A JSON <InlineCode>POST</InlineCode> with{" "}
              <InlineCode>{`"type": "alert.triggered"`}</InlineCode> and the alert under{" "}
              <InlineCode>event</InlineCode>. Failed deliveries are retried.
            </span>,
          ],
          ["GitHub Issue", "A connected GitHub integration", "An issue for the alert. The same alert doesn’t open a second issue."],
        ]}
      />
      <DocP>
        Every triggered alert is also listed on the Alerts page. Webhook requests aren’t
        signed, so keep the URL private.
      </DocP>
      <DocCallout type="info" title="Other integrations">
        The dashboard lets you connect other services, such as Discord, Microsoft Teams,
        Linear, Jira and PagerDuty. Alerts aren’t sent to them yet; use the four channels
        above.
      </DocCallout>

      <DocH3 id="quieting">Cooldown, snooze and maintenance</DocH3>
      <DocUl>
        <DocLi>
          <DocStrong>Cooldown.</DocStrong> After a rule fires, it doesn’t fire again within
          its interval (10 minutes if you set none) while that alert is still active or
          acknowledged.
        </DocLi>
        <DocLi>
          <DocStrong>Snooze.</DocStrong> A snoozed rule is skipped until the snooze ends.
        </DocLi>
        <DocLi>
          <DocStrong>Maintenance windows.</DocStrong> While one is active, rules don’t fire
          for the logs it covers: all of them, or only certain services or environments.
        </DocLi>
      </DocUl>
    </DocPage>
  );
}
