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
  { id: "scope", title: "What this API covers", level: 2 },
  { id: "base-url", title: "Base URL", level: 2 },
  { id: "authentication", title: "Authentication", level: 2 },
  { id: "endpoints", title: "Endpoints", level: 2 },
  { id: "responses", title: "Responses", level: 2 },
  { id: "errors", title: "Errors", level: 2 },
  { id: "browsers", title: "Calling from a browser", level: 2 },
];

const C = InlineCode;

export default function ApiOverviewPage() {
  return (
    <DocPage slug="api/overview" toc={toc}>
      <DocH2 id="scope">What this API covers</DocH2>
      <DocP>
        These are the endpoints you call with a project’s API key: to send logs without the
        SDK, to record deploys from CI, and to upload source maps. The dashboard uses other
        endpoints that change often; they aren’t a public API.
      </DocP>

      <DocH2 id="base-url">Base URL</DocH2>
      <CodeBlock language="text" code="https://apperioserver.onrender.com/api/v1" />

      <DocH2 id="authentication">Authentication</DocH2>
      <DocP>
        Send the project’s API key in the <C>X-API-Key</C> header. Find it in{" "}
        <DocStrong>Settings › API Key</DocStrong>. Every path also contains the project ID;
        always use the ID of the project the key belongs to.
      </DocP>
      <CodeBlock
        language="bash"
        code={`
curl -X POST "https://apperioserver.onrender.com/api/v1/your-project-id/logs/batch" \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{"logs":[{"level":"info","message":"Hello from curl"}]}'
`}
      />

      <DocH2 id="endpoints">Endpoints</DocH2>
      <DocTable
        headers={["Method and path", "What it does"]}
        rows={[
          [
            <DocLink key="p" href="/docs/api/logs#batch">POST /{"{projectId}"}/logs/batch</DocLink>,
            "Send up to 100 log entries. What the SDK uses.",
          ],
          [
            <DocLink key="p" href="/docs/api/logs#single">POST /{"{projectId}"}/logs</DocLink>,
            "Send one log entry.",
          ],
          [
            <DocLink key="p" href="/docs/api/deployments">POST /projects/{"{projectId}"}/deployments</DocLink>,
            "Record a deploy.",
          ],
          [
            <DocLink key="p" href="/docs/api/source-maps">POST /{"{projectId}"}/sourcemaps</DocLink>,
            "Upload a source map (beta).",
          ],
        ]}
      />
      <DocP>
        The SDK also calls <C>GET /sdk-config</C> and <C>POST /{"{projectId}"}/replay</C> for
        its own settings and session replay. Those exist for the SDK; don’t build on them.
      </DocP>

      <DocH2 id="responses">Responses</DocH2>
      <DocP>Every response is JSON with a <C>status</C> field:</DocP>
      <CodeBlock
        language="json"
        code={`
{
  "status": "success",
  "message": "Log entry created successfully",
  "data": {}
}
`}
      />

      <DocH2 id="errors">Errors</DocH2>
      <DocTable
        headers={["Status", "When", "Body"]}
        rows={[
          ["400", "The body failed validation.", <C key="b">{`{ "status": "error", "message": "Validation failed", "errors": [...] }`}</C>],
          ["401", "No X-API-Key header.", <C key="b">{`{ "status": "error", "code": "UNAUTHORIZED", "message": "API key is required" }`}</C>],
          ["403", "The key doesn’t match any project, or (for deployments) belongs to another project.", <C key="b">{`{ "status": "error", "code": "INVALID_API_KEY", ... }`}</C>],
          ["500", "Something went wrong on Apperio’s side. Retry later.", <C key="b">{`{ "status": "error", "message": "..." }`}</C>],
        ]}
      />
      <DocP>A validation error lists each problem:</DocP>
      <CodeBlock
        language="json"
        code={`
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "logs.0.level",
      "message": "Invalid enum value. Expected 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal', received 'notice'",
      "code": "invalid_enum_value"
    }
  ]
}
`}
      />
      <DocCallout type="info" title="Retrying">
        Retry 5xx responses and network errors with a growing delay, as the SDK does. Don’t
        retry a 4xx: the same request fails the same way.
      </DocCallout>

      <DocH2 id="browsers">Calling from a browser</DocH2>
      <DocUl>
        <DocLi>The logs and source map endpoints accept requests from any website.</DocLi>
        <DocLi>
          The deployments endpoint is meant for servers and CI jobs and can’t be called from
          a browser on your own site.
        </DocLi>
      </DocUl>
    </DocPage>
  );
}
