import {
  DocPage,
  DocH2,
  DocH3,
  DocP,
  DocUl,
  DocLi,
  DocLink,
  DocCallout,
  DocTable,
  CodeBlock,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "defaults", title: "What happens by default", level: 2 },
  { id: "patterns", title: "Built-in patterns", level: 2 },
  { id: "fields", title: "Field masking", level: 2 },
  { id: "presets", title: "Presets", level: 2 },
  { id: "custom-rules", title: "Custom rules", level: 2 },
  { id: "config-type", title: "The full configuration", level: 2 },
  { id: "changing-at-runtime", title: "Changing it at runtime", level: 3 },
  { id: "audit-trail", title: "Audit trail", level: 2 },
  { id: "turning-it-off", title: "Turning it off", level: 2 },
];

const C = InlineCode;

export default function DataSanitizationPage() {
  return (
    <DocPage slug="sdk/data-sanitization" toc={toc}>
      <DocH2 id="defaults">What happens by default</DocH2>
      <DocP>
        Before a log is queued, the SDK copies it and cleans the copy. It looks at the
        message, the data you attach, the context, and the metadata. Two things happen:
      </DocP>
      <DocUl>
        <DocLi>text matching a known pattern, such as an email address, is replaced;</DocLi>
        <DocLi>fields whose names suggest secrets, such as <C>password</C>, are masked.</DocLi>
      </DocUl>
      <DocP>
        The error’s name, message and stack, the page address, the referrer and the user
        agent are not cleaned. See <DocLink href="/docs/concepts/privacy">Privacy and PII redaction</DocLink>{" "}
        for the full picture.
      </DocP>

      <DocH2 id="patterns">Built-in patterns</DocH2>
      <DocTable
        headers={["Pattern", "Replaced with", "Notes"]}
        rows={[
          ["Email address", <C key="r">[EMAIL_REDACTED]</C>, ""],
          ["US Social Security number", <C key="r">[SSN_REDACTED]</C>, "Any nine digits, with or without dashes"],
          ["Card number", <C key="r">[CARD_REDACTED]</C>, "16 digits, optionally in groups of four"],
          ["US phone number", <C key="r">[PHONE_REDACTED]</C>, "Ten digits, optionally with +1 and separators"],
          ["IPv4 address", <C key="r">[IP_REDACTED]</C>, "Version numbers like Chrome/137.0.0.0 are kept"],
          ["API key or token", <C key="r">[API_KEY_REDACTED]</C>, "api_key, token, secret, password or pwd, then = or :, then 20 or more characters"],
          ["JWT", <C key="r">[JWT_REDACTED]</C>, "Three dot-separated parts starting with eyJ"],
          ["Bank account number", <C key="r">[ACCOUNT_REDACTED]</C>, "8 to 17 digits after account, acct, routing, iban or bank"],
          ["US driving licence", <C key="r">[DL_REDACTED]</C>, "A capital letter and 8 digits"],
          ["Passport number", <C key="r">[PASSPORT_REDACTED]</C>, "One or two capital letters and 6 to 9 digits"],
        ]}
      />
      <DocP>
        The patterns are exported as <C>PII_PATTERNS</C>. They only look at text: a number
        stored as a number is left alone, but the same digits inside a string can match. In
        a string, a nine-digit order ID becomes <C>[SSN_REDACTED]</C> and a ten-digit Unix
        timestamp becomes <C>[PHONE_REDACTED]</C>.
      </DocP>

      <DocH2 id="fields">Field masking</DocH2>
      <DocP>
        Any field in the data, context or metadata whose name contains one of these words,
        ignoring case, has its string value masked: <C>password</C>, <C>secret</C>,{" "}
        <C>token</C>, <C>key</C>, <C>ssn</C>, <C>email</C>. The first and last characters
        are kept and the rest become asterisks; values of 4 characters or fewer become{" "}
        <C>[ANONYMIZED]</C>.
      </DocP>
      <CodeBlock
        language="ts"
        code={`
logger.info('Signed in', { email: 'ada@example.com', apiKey: 'example-key-123', plan: 'pro' });
// Sent as: { email: '[**************]', apiKey: 'e*************3', plan: 'pro' }
`}
      />
      <DocP>
        The <C>email</C> value was first replaced by the email pattern, then masked because
        of its field name. Matching is by substring, so <C>key</C> also masks fields such as{" "}
        <C>keyboardLayout</C> or <C>monkey</C>.
      </DocP>

      <DocH2 id="presets">Presets</DocH2>
      <DocTable
        headers={["Preset", "Patterns", "Field masking", "Audit trail"]}
        rows={[
          [<C key="p">BALANCED</C>, "All ten", "password, secret, token, key, ssn, email", "On"],
          [<C key="p">STRICT</C>, "All ten", "The same, plus phone and address", "On"],
          [<C key="p">LENIENT</C>, "Only SSN, card, API key, JWT and bank account", "Off", "Off"],
        ]}
      />
      <DocP>
        <C>BALANCED</C> is what you get without configuring anything. Pick another with{" "}
        <C>SANITIZATION_PRESETS</C>:
      </DocP>
      <DocCallout type="warning" title="LENIENT sends passwords in plain text">
        <C>LENIENT</C> turns field masking off and drops the email pattern, so a{" "}
        <C>password</C> or <C>email</C> field in your data is sent as it is. Use it only
        where you are sure no such data is logged.
      </DocCallout>
      <CodeBlock
        language="ts"
        code={`
import { Apperio, SANITIZATION_PRESETS } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  sanitization: { config: SANITIZATION_PRESETS.STRICT },
});
`}
      />

      <DocH2 id="custom-rules">Custom rules</DocH2>
      <DocP>
        Add a rule for data only your app has. Give the pattern the <C>g</C> flag, or only
        the first match in each string is replaced.
      </DocP>
      <CodeBlock
        language="ts"
        code={`
logger.addCustomSanitizationRule({
  pattern: /CUST-\\d{6}/g,
  replacement: '[CUSTOMER_ID]',
  description: 'Customer number',
  severity: 'medium',
  category: 'custom',
});

logger.removeCustomSanitizationRule('Customer number'); // removed by description
`}
      />

      <DocH2 id="config-type">The full configuration</DocH2>
      <DocP>
        <C>sanitization.config</C> takes a complete <C>SanitizationConfig</C>. The easiest
        way to change one part is to start from a preset:
      </DocP>
      <CodeBlock
        language="ts"
        code={`
import { Apperio, SANITIZATION_PRESETS } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  sanitization: {
    config: {
      ...SANITIZATION_PRESETS.BALANCED,
      sensitiveFields: [...SANITIZATION_PRESETS.BALANCED.sensitiveFields, 'address'],
      customRules: [
        {
          pattern: /CUST-\\d{6}/g,
          replacement: '[CUSTOMER_ID]',
          description: 'Customer number',
          severity: 'medium',
          category: 'custom',
        },
      ],
    },
  },
});
`}
      />
      <DocTable
        headers={["Field", "Type", "What it does"]}
        rows={[
          [<C key="f">enabled</C>, <C key="t">boolean</C>, "Whether this configuration runs at all."],
          [<C key="f">rules</C>, <C key="t">SanitizationRule[]</C>, "The patterns to apply. PII_PATTERNS by default."],
          [<C key="f">customRules</C>, <C key="t">SanitizationRule[]</C>, "Your own patterns, applied after rules."],
          [<C key="f">sensitiveFields</C>, <C key="t">string[]</C>, "Field names to mask."],
          [<C key="f">anonymizationEnabled</C>, <C key="t">boolean</C>, "Whether field masking runs."],
          [<C key="f">auditEnabled</C>, <C key="t">boolean</C>, "Whether the audit trail records anything."],
          [<C key="f">retentionPolicy</C>, <C key="t">RetentionPolicy</C>, "Required by the type, but it doesn’t affect stored data. Retention is set per project in Settings › Retention."],
          [<C key="f">preserveStructure</C>, <C key="t">boolean</C>, "Required by the type; has no effect."],
        ]}
      />

      <DocH3 id="changing-at-runtime">Changing it at runtime</DocH3>
      <CodeBlock
        language="ts"
        code={`
logger.updateSanitizationConfig({ sensitiveFields: ['password', 'secret', 'token'] });
const current = logger.getSanitizationConfig();
`}
      />

      <DocH2 id="audit-trail">Audit trail</DocH2>
      <DocP>
        With <C>auditEnabled</C> on, the SDK records each clean-up in memory: when it
        happened, sizes before and after, and which rules matched. It keeps the last 1,000
        entries and never sends them anywhere. Read it while debugging your rules:
      </DocP>
      <CodeBlock
        language="ts"
        code={`
const entries = logger.getAuditTrail(); // [{ timestamp, operation, rulesApplied, ... }]
logger.clearAuditTrail();
`}
      />

      <DocH2 id="turning-it-off">Turning it off</DocH2>
      <CodeBlock
        language="ts"
        code={`
import { Apperio } from 'apperio';

const logger = new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  sanitization: { enabled: false },
});
`}
      />
      <DocCallout type="warning" title="Nothing is redacted on the server">
        Apperio’s servers store what the SDK sends. With sanitization off, everything you
        log is stored as it is.
      </DocCallout>
    </DocPage>
  );
}
