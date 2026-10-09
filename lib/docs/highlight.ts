import { createCssVariablesTheme, createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

/**
 * Build-time syntax highlighting for the docs (server components only).
 *
 * Shiki tokenizes with real TextMate grammars and returns HTML whose colours
 * are CSS variables (--shiki-token-*), defined for both themes in
 * app/docs/docs.css. Nothing here ships to the browser.
 */

const theme = createCssVariablesTheme({
  name: "apperio-docs",
  variablePrefix: "--shiki-",
  fontStyle: true,
});

/** Language names accepted by CodeBlock, mapped to Shiki grammar ids. */
const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript",
  typescript: "typescript",
  tsx: "tsx",
  js: "javascript",
  javascript: "javascript",
  jsx: "tsx",
  json: "json",
  bash: "shellscript",
  sh: "shellscript",
  shell: "shellscript",
  yaml: "yaml",
  yml: "yaml",
  html: "html",
  http: "http",
};

let highlighter: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [theme],
    langs: [
      import("shiki/langs/typescript.mjs"),
      import("shiki/langs/tsx.mjs"),
      import("shiki/langs/javascript.mjs"),
      import("shiki/langs/json.mjs"),
      import("shiki/langs/shellscript.mjs"),
      import("shiki/langs/yaml.mjs"),
      import("shiki/langs/html.mjs"),
      import("shiki/langs/http.mjs"),
    ],
    // The JavaScript engine avoids loading the Oniguruma WASM binary
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
}

export function resolveLanguage(language?: string): string {
  if (!language) return "text";
  return LANGUAGE_ALIASES[language.toLowerCase()] ?? "text";
}

/**
 * Highlight `code` and return Shiki's `<pre class="shiki">` HTML. Unknown
 * languages come back as escaped plain text in the same markup.
 */
export async function highlightCode(code: string, language?: string): Promise<string> {
  const instance = await getHighlighter();
  return instance.codeToHtml(code, {
    lang: resolveLanguage(language),
    theme: "apperio-docs",
  });
}
