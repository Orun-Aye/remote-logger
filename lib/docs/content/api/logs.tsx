import {
  DocPage,
  DocH2,
  DocH3,
  DocP,
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
  { id: "batch", title: "Send a batch", level: 2 },
  { id: "fields", title: "Entry fields", level: 3 },
  { id: "limits", title: "Limits", level: 3 },
  { id: "batch-response", title: "Response", level: 3 },
  { id: "single", title: "Send one entry", level: 2 },
  { id: "what-happens", title: "What happens to a log", level: 2 },
];

const C = InlineCode;

export default function ApiLogsPage() {
  return (
    <DocPage slug="api/logs" toc={toc}>
      <DocP>
        Use these when the SDK doesn’t fit, for example from another language or a log
        shipper. Authentication and errors are described in the{" "}
        <DocLink href="/docs/api/overview">API overview</DocLink>.
      </DocP>

      <DocH2 id="batch">Send a batch</DocH2>
      <EndpointBlock method="POST" path="/api/v1/{projectId}/logs/batch" description="X-API-Key required. What the SDK uses." />
      <CodeBlock
        language="bash"
        code={`
curl -X POST "https://apperioserver.onrender.com/api/v1/your-project-id/logs/batch" \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d @logs.json
`}
      />
      <CodeBlock
        language="json"
        filename="logs.json"
        code={`
{
  "logs": [
    {
      "level": "info",
      "message": "Order placed",
      "timestamp": "2026-01-15T12:00:00.000Z",
      "service": "billing",
      "environment": "production",
      "release": "2.4.1",
      "data": { "orderId": "order-123" }
    },
    {
      "level": "error",
      "message": "Payment failed",
      "service": "billing",
      "environment": "production",
      "error": {
        "name": "CardError",
        "message": "Card declined",
        "stack": "CardError: Card declined\\n    at charge (billing/charge.py:42)"
      }
    }
  ]
}
`}
      />

      <DocH3 id="fields">Entry fields</DocH3>
      <DocTable
        headers={["Field", "Type", "Notes"]}
        rows={[
          [<C key="f">level</C>, "string, required", "trace, debug, info, warn, error or fatal"],
          [<C key="f">message</C>, "string, required", "1 to 5,000 characters"],
          [<C key="f">timestamp</C>, "string", "ISO 8601 in UTC ending in Z, such as 2026-01-15T12:00:00.000Z. Offsets like +01:00 are rejected. Defaults to the time Apperio receives it."],
          [<C key="f">data</C>, "object", "Anything you want stored with the entry"],
          [<C key="f">error</C>, "object", "name (up to 200), message (up to 1,000), and optional stack (up to 10,000), url, lineNumber, columnNumber"],
          [<C key="f">service</C>, "string", "Up to 100 characters"],
          [<C key="f">environment</C>, "string", "Up to 50 characters"],
          [<C key="f">release</C>, "string", "Up to 100 characters"],
          [<C key="f">context</C>, "object", "Shared details, such as a user ID"],
          [<C key="f">metadata</C>, "any", ""],
          [<C key="f">eventType</C>, "string", "error, performance, interaction, network, console, pageview, web-vital, breadcrumb, message or system"],
          [<C key="f">sessionId</C>, "string", "Up to 100 characters. Groups entries into a session."],
          [<C key="f">traceId, spanId, correlationId</C>, "string", "Up to 100 characters each"],
          [<C key="f">url, referrer</C>, "string", "Up to 2,000 characters each"],
          [<C key="f">userAgent</C>, "string", "Up to 500 characters"],
        ]}
      />
      <DocP>Fields not in this list are dropped.</DocP>

      <DocH3 id="limits">Limits</DocH3>
      <DocUl>
        <DocLi>1 to 100 entries per request.</DocLi>
        <DocLi>
          The whole request is rejected with 400 if any entry breaks a rule above. Fix the
          entry and send the batch again.
        </DocLi>
        <DocLi>Request bodies can be up to 5 MB.</DocLi>
      </DocUl>

      <DocH3 id="batch-response">Response</DocH3>
      <DocP>
        <C>201</C>, with a result for each entry, in order:
      </DocP>
      <CodeBlock
        language="json"
        code={`
{
  "status": "success",
  "message": "Batch processing complete: 2 succeeded, 0 failed",
  "data": {
    "success": 2,
    "failed": 0,
    "results": [
      { "index": 0, "success": true, "logId": "log-id-1" },
      { "index": 1, "success": true, "logId": "log-id-2" }
    ]
  }
}
`}
      />
      <DocP>
        An entry that passes validation but can’t be stored is reported with{" "}
        <C>{`"success": false`}</C> and an <C>error</C> message, while the rest are saved.
      </DocP>

      <DocH2 id="single">Send one entry</DocH2>
      <EndpointBlock method="POST" path="/api/v1/{projectId}/logs" description="X-API-Key required." />
      <DocP>
        The body is one entry with the fields above. Here only the required fields and the
        allowed values of <C>level</C> and <C>eventType</C> are checked; the length limits
        apply to batches. The response is <C>201</C> with the stored entry in{" "}
        <C>data</C>.
      </DocP>
      <CodeBlock
        language="bash"
        code={`
curl -X POST "https://apperioserver.onrender.com/api/v1/your-project-id/logs" \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{"level":"warn","message":"Disk 90% full","service":"worker","environment":"production"}'
`}
      />
      <DocCallout type="info" title="Sampling">
        The project’s <DocStrong>Settings › Sampling</DocStrong> applies to this endpoint
        only. When an
        entry is sampled out, the response is <C>202</C> with{" "}
        <C>{`"message": "Log sampled out"`}</C> and nothing is stored. Batches, and so the
        SDK, aren’t sampled.
      </DocCallout>

      <DocH2 id="what-happens">What happens to a log</DocH2>
      <DocUl>
        <DocLi>It is stored as you sent it. Nothing is redacted on the server.</DocLi>
        <DocLi>
          Entries at <C>error</C> or <C>fatal</C> are grouped into issues and can notify
          the project owner, exactly like errors from the SDK. Include{" "}
          <C>error.name</C>, <C>error.message</C> and <C>error.stack</C> for good grouping.
        </DocLi>
        <DocLi>Every entry is checked against your alert rules.</DocLi>
        <DocLi>Logs are kept for the project’s retention period, 30 days by default.</DocLi>
      </DocUl>
    </DocPage>
  );
}
