import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeBlock } from "@/components/docs/CodeBlock";

/**
 * The old highlighter ran regexes over escaped HTML, so later passes rewrote
 * markup from earlier ones and readers saw raw markup such as
 * `class="syntax-string">` and `&#x27;` inside code. These samples hit every
 * trigger it had: quotes, the word class, numbers and comments.
 */
const TRICKY_TS = `import { Apperio } from 'apperio';

// A "comment" that says class and 27
class Example {
  count = 27;
  label = "it's 4.5:1";
  html = '<b>bold</b> & more';
}`;

const TRICKY_BASH = `# install, then check "class" 27
npm install apperio && echo 'done'`;

async function renderBlock(props: Parameters<typeof CodeBlock>[0]) {
  return render(await CodeBlock(props));
}

function codeText(container: HTMLElement): string {
  return container.querySelector("pre")?.textContent ?? "";
}

describe("docs CodeBlock", () => {
  it.each([
    ["ts", TRICKY_TS],
    ["bash", TRICKY_BASH],
    ["json", `{ "class": "a", "count": 27, "quote": "it's" }`],
  ])("shows %s source exactly as written", async (language, code) => {
    const { container } = await renderBlock({ code, language });
    const text = codeText(container);

    expect(text).toBe(code);
    expect(text).not.toContain("syntax-");
    expect(text).not.toContain("class=");
    expect(text).not.toContain("&#x");
  });

  it("highlights tokens with theme variables", async () => {
    const { container } = await renderBlock({ code: TRICKY_TS, language: "ts" });
    const styles = Array.from(container.querySelectorAll("pre span[style]")).map(
      (span) => span.getAttribute("style") ?? ""
    );

    expect(styles.some((style) => style.includes("--shiki-token-keyword"))).toBe(true);
    expect(styles.some((style) => style.includes("--shiki-token-comment"))).toBe(true);
    expect(styles.some((style) => style.includes("--shiki-token-string"))).toBe(true);
  });

  it("escapes code in languages it doesn't highlight", async () => {
    const code = "<script>alert('x')</script> & more";
    const { container } = await renderBlock({ code, language: "text" });

    expect(codeText(container)).toBe(code);
    expect(container.querySelector("pre script")).toBeNull();
  });

  it("keeps line numbers out of the text", async () => {
    const { container } = await renderBlock({ code: TRICKY_BASH, language: "bash", showLineNumbers: true });

    expect(container.querySelector("[data-line-numbers]")).not.toBeNull();
    expect(codeText(container)).toBe(TRICKY_BASH);
  });

  it("labels the block and offers a copy button", async () => {
    const { getByText, getByRole } = await renderBlock({ code: "npm install apperio", language: "bash", filename: "Terminal" });

    expect(getByText("Terminal")).toBeTruthy();
    expect(getByRole("button", { name: "Copy" })).toBeTruthy();
  });
});
