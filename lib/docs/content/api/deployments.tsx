import {
  DocPage,
  DocH2,
  DocP,
  DocUl,
  DocLi,
  DocLink,
  DocCallout,
  DocTable,
  EndpointBlock,
  CodeBlock,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "when-to-use", title: "When to use it", level: 2 },
  { id: "request", title: "Request", level: 2 },
  { id: "response", title: "Response", level: 2 },
  { id: "github-actions", title: "GitHub Actions", level: 2 },
  { id: "other-ci", title: "Other CI systems", level: 2 },
];

const C = InlineCode;

export default function ApiDeploymentsPage() {
  return (
    <DocPage slug="api/deployments" toc={toc}>
      <DocH2 id="when-to-use">When to use it</DocH2>
      <DocP>
        Call this once a deploy is live, so Apperio can mark it on your charts and judge it
        an hour later (see <DocLink href="/docs/concepts/deploys">Deploys and verdicts</DocLink>).
        If your host already creates GitHub deployments for the linked repository, Apperio
        receives those on its own; calling this as well records the deploy twice.
      </DocP>

      <DocH2 id="request">Request</DocH2>
      <EndpointBlock
        method="POST"
        path="/api/v1/projects/{projectId}/deployments"
        description="X-API-Key required. The key must belong to the project in the path."
      />
      <CodeBlock
        language="bash"
        code={`
curl -X POST "https://apperioserver.onrender.com/api/v1/projects/your-project-id/deployments" \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{"environment":"production","release":"2.4.1","sha":"your-commit-sha","deployedBy":"ci"}'
`}
      />
      <DocTable
        headers={["Field", "Default", "Notes"]}
        rows={[
          [<C key="f">environment</C>, <C key="d">production</C>, "Use the same name as the SDK’s environment option. Logs from this environment decide the verdict."],
          [<C key="f">release</C>, "none", "The version you deployed. Use the same value as the SDK’s release option."],
          [<C key="f">sha</C>, "none", "The commit you deployed. Shown on the deploy."],
          [<C key="f">status</C>, <C key="d">success</C>, "success or failure. Only successful deploys get a verdict. Any other value counts as success."],
          [<C key="f">url</C>, "none", "Where the deploy can be seen. Shown as a View link."],
          [<C key="f">description</C>, "none", "A line of text shown under the deploy."],
          [<C key="f">deployedBy</C>, "none", "Who or what deployed it."],
        ]}
      />
      <DocP>
        Every field is optional. The deploy’s time is when Apperio receives the request; you
        can’t set it.
      </DocP>
      <DocCallout type="warning" title="Don’t send in_progress">
        The API also accepts <C>in_progress</C>, but there is no way to update a deploy
        afterwards, so it would never get a verdict. Call the endpoint once, after the
        deploy has finished.
      </DocCallout>

      <DocH2 id="response">Response</DocH2>
      <DocP><C>201</C>, with the recorded deploy:</DocP>
      <CodeBlock
        language="json"
        code={`
{
  "status": "success",
  "data": {
    "_id": "deployment-id",
    "projectId": "your-project-id",
    "kind": "deployment",
    "provider": "api",
    "environment": "production",
    "release": "2.4.1",
    "sha": "your-commit-sha",
    "deployedBy": "ci",
    "status": "success",
    "startedAt": "2026-01-15T12:00:00.000Z",
    "finishedAt": "2026-01-15T12:00:00.000Z",
    "createdAt": "2026-01-15T12:00:00.000Z",
    "updatedAt": "2026-01-15T12:00:00.000Z",
    "__v": 0
  }
}
`}
      />
      <DocUl>
        <DocLi>
          <C>403</C> with <C>API key does not belong to this project</C>: the project ID in the
          path isn’t the key’s project.
        </DocLi>
        <DocLi><C>400</C>: the project ID isn’t a valid ID.</DocLi>
      </DocUl>

      <DocH2 id="github-actions">GitHub Actions</DocH2>
      <DocP>
        Add a step after your deploy step. Store the key as a secret and the project ID as a
        variable in the repository settings:
      </DocP>
      <CodeBlock
        language="yaml"
        filename=".github/workflows/deploy.yml"
        code={`
- name: Record deploy in Apperio
  if: success()
  env:
    APPERIO_API_KEY: \${{ secrets.APPERIO_API_KEY }}
    APPERIO_PROJECT_ID: \${{ vars.APPERIO_PROJECT_ID }}
  run: |
    curl -fsS -X POST "https://apperioserver.onrender.com/api/v1/projects/$APPERIO_PROJECT_ID/deployments" \\
      -H "X-API-Key: $APPERIO_API_KEY" \\
      -H "Content-Type: application/json" \\
      -d "{\\"environment\\":\\"production\\",\\"release\\":\\"$GITHUB_SHA\\",\\"sha\\":\\"$GITHUB_SHA\\",\\"deployedBy\\":\\"$GITHUB_ACTOR\\"}"
`}
      />
      <DocP>
        <C>-f</C> makes the step fail if Apperio refuses the request, so a wrong key doesn’t
        go unnoticed. Use <C>continue-on-error: true</C> on the step if a failure to record
        the deploy shouldn’t fail the workflow.
      </DocP>

      <DocH2 id="other-ci">Other CI systems</DocH2>
      <DocP>
        Any system that can run <C>curl</C> after a deploy works the same way: send the key
        in <C>X-API-Key</C> and describe the deploy in the JSON body. Keep the key in the
        system’s secret store, not in the repository.
      </DocP>
    </DocPage>
  );
}
