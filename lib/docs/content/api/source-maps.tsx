import {
  DocPage,
  DocH2,
  DocP,
  DocOl,
  DocUl,
  DocLi,
  DocLink,
  DocStrong,
  DocCallout,
  DocTable,
  EndpointBlock,
  CodeBlock,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "how-it-works", title: "How it works", level: 2 },
  { id: "upload", title: "Upload a source map", level: 2 },
  { id: "upload-a-folder", title: "Upload a whole build", level: 2 },
  { id: "read-a-stack", title: "Read a stack trace", level: 2 },
  { id: "limits", title: "Limits", level: 2 },
];

const C = InlineCode;

export default function ApiSourceMapsPage() {
  return (
    <DocPage slug="api/source-maps" toc={toc}>
      <DocH2 id="how-it-works">How it works</DocH2>
      <DocOl>
        <DocLi>
          Set <C>release</C> on the SDK, so every error says which build it came from. See{" "}
          <DocLink href="/docs/environments-and-releases">Environments and releases</DocLink>.
        </DocLi>
        <DocLi>After each build, upload its source maps for that release.</DocLi>
        <DocLi>
          When you open the error’s entry on the Logs page, choose{" "}
          <DocStrong>De-minify</DocStrong> to see the stack trace mapped back to your source
          files.
        </DocLi>
      </DocOl>
      <DocP>
        Stack traces are stored as they arrived; mapping happens when you ask for it.
        Grouping and suspect commits use the stack as it arrived.
      </DocP>

      <DocH2 id="upload">Upload a source map</DocH2>
      <EndpointBlock method="POST" path="/api/v1/{projectId}/sourcemaps" description="X-API-Key required." />
      <DocTable
        headers={["Field", "Required", "What to send"]}
        rows={[
          [<C key="f">release</C>, "yes", "The same string as the SDK’s release option, up to 100 characters."],
          [<C key="f">originalFileName</C>, "yes", "The JavaScript file’s name as it appears in stack traces, such as main.3f9a1c.js, or its full URL."],
          [<C key="f">fileName</C>, "yes", "The source map file’s name, such as main.3f9a1c.js.map."],
          [<C key="f">sourceMapData</C>, "yes", "The source map file’s contents, as a string."],
          [<C key="f">uploadedBy</C>, "no", "Who or what uploaded it."],
        ]}
      />
      <DocP>
        Uploading again for the same release and file replaces the earlier map. With{" "}
        <C>jq</C> 1.6 or later, a single file looks like this:
      </DocP>
      <CodeBlock
        language="bash"
        code={`
jq -n \\
  --arg release "2.4.1" \\
  --arg file "main.3f9a1c.js" \\
  --rawfile map "dist/assets/main.3f9a1c.js.map" \\
  '{release: $release, originalFileName: $file, fileName: ($file + ".map"), sourceMapData: $map}' \\
| curl -fsS -X POST "https://apperioserver.onrender.com/api/v1/your-project-id/sourcemaps" \\
    -H "X-API-Key: your-api-key" \\
    -H "Content-Type: application/json" \\
    --data @-
`}
      />
      <DocP>The response is <C>201</C>:</DocP>
      <CodeBlock
        language="json"
        code={`
{
  "status": "success",
  "message": "Source map uploaded successfully",
  "data": {
    "_id": "source-map-id",
    "projectId": "your-project-id",
    "release": "2.4.1",
    "fileName": "main.3f9a1c.js.map",
    "originalFileName": "main.3f9a1c.js",
    "fileSize": 12345,
    "createdAt": "2026-01-15T12:00:00.000Z",
    "updatedAt": "2026-01-15T12:00:00.000Z"
  }
}
`}
      />

      <DocH2 id="upload-a-folder">Upload a whole build</DocH2>
      <DocP>
        A Node.js script you can run in CI after the build, with the key, project ID and
        release in environment variables:
      </DocP>
      <CodeBlock
        language="ts"
        filename="scripts/upload-source-maps.ts"
        code={`
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const dir = 'dist/assets';
const url = \`https://apperioserver.onrender.com/api/v1/\${process.env.APPERIO_PROJECT_ID}/sourcemaps\`;

for (const name of await readdir(dir)) {
  if (!name.endsWith('.js.map')) continue;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.APPERIO_API_KEY ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      release: process.env.RELEASE,
      originalFileName: name.replace(/\\.map$/, ''),
      fileName: name,
      sourceMapData: await readFile(path.join(dir, name), 'utf8'),
    }),
  });

  if (!response.ok) throw new Error(\`\${name}: upload failed with \${response.status}\`);
  console.log(\`Uploaded \${name}\`);
}
`}
      />
      <CodeBlock language="bash" code="RELEASE=2.4.1 node scripts/upload-source-maps.ts" />
      <DocP>
        Node.js 22.18 and later run this TypeScript file directly. It has no type
        annotations, so on older versions rename it to <C>.mjs</C>.
      </DocP>

      <DocH2 id="read-a-stack">Read a stack trace</DocH2>
      <DocP>
        On the Logs page, open an entry that has a stack trace and a release. Choose{" "}
        <DocStrong>De-minify</DocStrong>, then switch between{" "}
        <DocStrong>Minified</DocStrong> and <DocStrong>Resolved</DocStrong>. Frames without
        a matching map stay as they were.
      </DocP>

      <DocH2 id="limits">Limits</DocH2>
      <DocUl>
        <DocLi>
          Only stack traces in the Chrome, Edge and Node.js format (lines starting{" "}
          <C>at</C>) can be mapped. Firefox and Safari stacks stay minified.
        </DocLi>
        <DocLi>
          A request body can be up to 5 MB, so very large maps can’t be uploaded yet.
        </DocLi>
        <DocLi>Upload with the API. The Source Maps page in the dashboard isn’t connected to it yet.</DocLi>
      </DocUl>
      <DocCallout type="info" title="Beta">
        Source maps work today but are still changing.
      </DocCallout>
    </DocPage>
  );
}
