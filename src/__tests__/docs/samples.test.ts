/**
 * Docs samples are code, so they are compiled like code.
 *
 * Every <CodeBlock> in lib/docs/content is pulled out with the TypeScript
 * compiler API. TypeScript and TSX samples are type-checked against the
 * published SDK (the exact `apperio` version in devDependencies), React and
 * Next.js; JSON samples must parse; and no sample may contain anything shaped
 * like a real API key, project ID or commit SHA.
 *
 * Rules a sample is checked under:
 * - Each page's samples form one small project. A sample with a `filename`
 *   lives at that path, so `import { getLogger } from '@/lib/apperio'` in one
 *   sample finds the sample whose filename is lib/apperio.ts.
 * - Every sample is a module (an empty export is appended).
 * - `logger` is predeclared as an Apperio instance, for snippets that use it
 *   without creating it. The stand-ins below cover the reader's own code that
 *   samples call.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../../..");
const CONTENT_DIR = path.join(ROOT, "lib/docs/content");
/** Never written to disk: a home for the virtual files inside the repo, so node_modules resolves */
const VIRTUAL_DIR = path.join(ROOT, ".docs-samples");

const PRELUDE = `
declare const logger: import("apperio").Apperio;

// Stand-ins for the reader's own code that samples call
declare function chargeCard(): Promise<void>;
declare function processOrder(orderId: string): Promise<void>;
declare function runJob(): Promise<void>;
`;

/** Files of the reader's own app that samples import, used when no sample provides them */
const STUB_FILES: Record<string, string> = {
  "src/App.tsx": "export function App() { return null; }\n",
};

interface Sample {
  page: string;
  line: number;
  language: string;
  filename?: string;
  code: string;
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

function stringAttribute(attr: ts.JsxAttribute | undefined, page: string): string | undefined {
  if (!attr?.initializer) return undefined;
  const init = attr.initializer;
  if (ts.isStringLiteral(init)) return init.text;
  if (ts.isJsxExpression(init) && init.expression) {
    const expr = init.expression;
    if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return expr.text;
  }
  throw new Error(`${page}: CodeBlock ${attr.name.getText()} must be a plain string, not an expression`);
}

function collectSamples(): Sample[] {
  const samples: Sample[] = [];
  for (const file of walk(CONTENT_DIR)) {
    const page = path.relative(ROOT, file).replace(/\\/g, "/");
    const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    const visit = (node: ts.Node) => {
      const element = ts.isJsxSelfClosingElement(node) ? node : ts.isJsxOpeningElement(node) ? node : undefined;
      if (element && element.tagName.getText() === "CodeBlock") {
        const attrs = new Map<string, ts.JsxAttribute>();
        for (const prop of element.attributes.properties) {
          if (ts.isJsxAttribute(prop)) attrs.set(prop.name.getText(), prop);
        }
        const code = stringAttribute(attrs.get("code"), page);
        if (code === undefined) throw new Error(`${page}: CodeBlock without a code string`);
        samples.push({
          page,
          line: source.getLineAndCharacterOfPosition(element.getStart()).line + 1,
          language: stringAttribute(attrs.get("language"), page) ?? "text",
          filename: stringAttribute(attrs.get("filename"), page),
          code: code.replace(/^\s*\n/, "").replace(/\s+$/, ""),
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return samples;
}

const TS_LANGUAGES = new Set(["ts", "typescript", "tsx"]);
const samples = collectSamples();

const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  lib: ["lib.dom.d.ts", "lib.dom.iterable.d.ts", "lib.es2022.d.ts"],
  types: ["node"],
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  esModuleInterop: true,
  isolatedModules: true,
  resolveJsonModule: true,
};

/** Shared across programs so lib and node_modules declarations are parsed once */
const diskFiles = new Map<string, ts.SourceFile | undefined>();

function typeCheckPage(page: string, pageSamples: Sample[]): string[] {
  const pageDir = path.join(VIRTUAL_DIR, page.replace(/[^a-z0-9]+/gi, "_"));
  const virtual = new Map<string, { text: string; sample?: Sample }>();
  const preludePath = path.join(pageDir, "__prelude.d.ts");
  virtual.set(preludePath, { text: PRELUDE });

  pageSamples.forEach((sample, index) => {
    const ext = sample.language === "tsx" ? ".tsx" : ".ts";
    const name = sample.filename ?? `__sample_${index}${ext}`;
    const fullPath = path.join(pageDir, name);
    if (virtual.has(fullPath)) throw new Error(`${page}: two samples share the filename ${name}`);
    virtual.set(fullPath, { text: `${sample.code}\nexport {};\n`, sample });
  });

  for (const [name, text] of Object.entries(STUB_FILES)) {
    const fullPath = path.join(pageDir, name);
    if (!virtual.has(fullPath)) virtual.set(fullPath, { text });
  }

  const options: ts.CompilerOptions = { ...compilerOptions, baseUrl: pageDir, paths: { "@/*": ["./*"] } };
  const defaultHost = ts.createCompilerHost(options, true);
  const virtualDirs = new Set<string>();
  for (const file of virtual.keys()) {
    for (let dir = path.dirname(file); dir.startsWith(VIRTUAL_DIR); dir = path.dirname(dir)) virtualDirs.add(dir);
  }

  const host: ts.CompilerHost = {
    ...defaultHost,
    directoryExists: (dir) => virtualDirs.has(path.resolve(dir)) || ts.sys.directoryExists(dir),
    fileExists: (fileName) => virtual.has(path.resolve(fileName)) || defaultHost.fileExists(fileName),
    readFile: (fileName) => virtual.get(path.resolve(fileName))?.text ?? defaultHost.readFile(fileName),
    getSourceFile: (fileName, languageVersion) => {
      const entry = virtual.get(path.resolve(fileName));
      if (entry) return ts.createSourceFile(fileName, entry.text, languageVersion, true);
      if (!diskFiles.has(fileName)) diskFiles.set(fileName, defaultHost.getSourceFile(fileName, languageVersion));
      return diskFiles.get(fileName);
    },
  };

  const program = ts.createProgram([...virtual.keys()], options, host);
  return ts.getPreEmitDiagnostics(program).map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    if (!diagnostic.file || diagnostic.start === undefined) return message;
    const entry = virtual.get(path.resolve(diagnostic.file.fileName));
    const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    if (!entry?.sample) return `${diagnostic.file.fileName}:${line + 1} ${message}`;
    return `${entry.sample.page} (CodeBlock at line ${entry.sample.line}, sample line ${line + 1}): ${message}`;
  });
}

describe("docs code samples", () => {
  it("finds the samples", () => {
    expect(samples.length).toBeGreaterThan(20);
  });

  it("type-check against the published apperio types", { timeout: 180_000 }, () => {
    const byPage = new Map<string, Sample[]>();
    for (const sample of samples) {
      if (!TS_LANGUAGES.has(sample.language)) continue;
      byPage.set(sample.page, [...(byPage.get(sample.page) ?? []), sample]);
    }
    const errors = [...byPage].flatMap(([page, pageSamples]) => typeCheckPage(page, pageSamples));
    expect(errors).toEqual([]);
  });

  it("JSON samples parse", () => {
    const broken = samples
      .filter((sample) => sample.language === "json")
      .flatMap((sample) => {
        try {
          JSON.parse(sample.code);
          return [];
        } catch (error) {
          return [`${sample.page}:${sample.line} ${(error as Error).message}`];
        }
      });
    expect(broken).toEqual([]);
  });

  it("use placeholders, never real keys, project IDs or SHAs", () => {
    const suspicious = samples.flatMap((sample) => {
      const found = [
        ...(sample.code.match(/\bmk_[A-Za-z0-9]{8,}/g) ?? []),
        ...(sample.code.match(/\b(?!0{24}\b)[0-9a-f]{24}\b/g) ?? []),
        ...(sample.code.match(/\b[0-9a-f]{40}\b/g) ?? []),
      ];
      return found.map((value) => `${sample.page}:${sample.line} ${value}`);
    });
    expect(suspicious).toEqual([]);
  });
});
