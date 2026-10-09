import {
  DocPage,
  DocH2,
  DocP,
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
  { id: "set-them", title: "Set them on the logger", level: 2 },
  { id: "environment", title: "What environment is used for", level: 2 },
  { id: "release", title: "What release is used for", level: 2 },
  { id: "service-name", title: "Service name", level: 2 },
  { id: "choosing-values", title: "Choosing values", level: 2 },
];

export default function EnvironmentsAndReleasesPage() {
  return (
    <DocPage slug="environments-and-releases" toc={toc}>
      <DocH2 id="set-them">Set them on the logger</DocH2>
      <DocP>
        Both are plain strings on the logger, attached to every entry it sends:
      </DocP>
      <CodeBlock
        language="ts"
        code={`
import { Apperio } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  environment: 'production', // default: 'development'
  release: '2.4.1',          // default: none
});
`}
      />

      <DocH2 id="environment">What environment is used for</DocH2>
      <DocUl>
        <DocLi>
          <DocStrong>Notifications.</DocStrong> The project owner is told about new errors
          only from the environments listed in <DocStrong>Settings › Notifications</DocStrong>.
          The default list is <InlineCode>production</InlineCode>. An empty list means every
          environment. An error with no environment always notifies.
        </DocLi>
        <DocLi>
          <DocStrong>Deploy verdicts.</DocStrong> A deploy to <InlineCode>production</InlineCode>{" "}
          is judged on logs tagged <InlineCode>production</InlineCode>. If neither hour has
          logs with that name, Apperio falls back to all of the project’s logs. See{" "}
          <DocLink href="/docs/concepts/deploys">Deploys and verdicts</DocLink>.
        </DocLi>
        <DocLi>
          <DocStrong>Issues.</DocStrong> Each issue lists the environments it has been seen
          in. When an error first seen in staging reaches production, you get the
          notification you would have had if it had started there.
        </DocLi>
        <DocLi>
          <DocStrong>Filters and alert rules.</DocStrong> You can filter logs by environment
          and limit an alert rule to one.
        </DocLi>
      </DocUl>
      <DocCallout type="warning" title="The default is development">
        If you don’t set <InlineCode>environment</InlineCode>, everything is tagged{" "}
        <InlineCode>development</InlineCode>, and with the default notification settings you
        won’t be told about new errors.
      </DocCallout>

      <DocH2 id="release">What release is used for</DocH2>
      <DocUl>
        <DocLi>
          <DocStrong>Issues.</DocStrong> An issue shows the release it was first seen in, for
          example <InlineCode>since 2.4.1</InlineCode> in the list and next to{" "}
          <DocStrong>First seen</DocStrong> in the detail view.
        </DocLi>
        <DocLi>
          <DocStrong>Deploys.</DocStrong> When you record a deploy with the{" "}
          <DocLink href="/docs/api/deployments">deployments API</DocLink>, pass the same
          release string so the deploy and the logs it produced line up.
        </DocLi>
        <DocLi>
          <DocStrong>Source maps (beta).</DocStrong> A minified stack trace can only be read
          back with source maps uploaded for the same release. See{" "}
          <DocLink href="/docs/api/source-maps">Source maps</DocLink>.
        </DocLi>
      </DocUl>

      <DocH2 id="service-name">Service name</DocH2>
      <DocP>
        <InlineCode>serviceName</InlineCode> (default <InlineCode>unknown-service</InlineCode>)
        tags each log with the part of your system that sent it, such as{" "}
        <InlineCode>web</InlineCode> or <InlineCode>api</InlineCode>. Logs can be filtered by
        service, and alert rules can be limited to one.
      </DocP>
      <DocP>
        There is also a <InlineCode>serviceVersion</InlineCode> option. In{" "}
        <InlineCode>apperio</InlineCode> 1.5.2 it is accepted but never sent, so use{" "}
        <InlineCode>release</InlineCode> for versions.
      </DocP>

      <DocH2 id="choosing-values">Choosing values</DocH2>
      <DocUl>
        <DocLi>
          Use a small, fixed set of environment names, spelled the same way everywhere:{" "}
          <InlineCode>production</InlineCode>, <InlineCode>staging</InlineCode>,{" "}
          <InlineCode>development</InlineCode>. Notification settings ignore case, but deploy
          verdicts match the name exactly, so keep names lowercase.
        </DocLi>
        <DocLi>
          For the release, use whatever identifies a build: your package version, a git
          tag, or a commit SHA. Set it at build time from an environment variable, so each
          deploy reports its own value.
        </DocLi>
        <DocLi>
          Releases can be up to 100 characters and environments up to 50.
        </DocLi>
      </DocUl>
    </DocPage>
  );
}
