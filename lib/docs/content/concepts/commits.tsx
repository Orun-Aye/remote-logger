import {
  DocPage,
  DocH2,
  DocP,
  DocUl,
  DocLi,
  DocStrong,
  DocLink,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "the-changes-page", title: "The Changes page", level: 2 },
  { id: "summaries", title: "Commit summaries", level: 2 },
  { id: "explain", title: "Explain this change", level: 2 },
  { id: "what-is-sent", title: "What the AI sees", level: 2 },
  { id: "limits", title: "Limits", level: 2 },
];

export default function CommitsPage() {
  return (
    <DocPage slug="concepts/commits" toc={toc} title="Commits and plain-English summaries">
      <DocH2 id="the-changes-page">The Changes page</DocH2>
      <DocP>
        <DocStrong>Changes</DocStrong> is a timeline of everything that shipped on the branch
        you linked, grouped by day. Filter it with <DocStrong>All activity</DocStrong>,{" "}
        <DocStrong>Commits</DocStrong> or <DocStrong>Deploys</DocStrong>. It needs a linked
        repository; see <DocLink href="/docs/concepts/connect-github">Connect GitHub</DocLink>.
      </DocP>
      <DocP>
        Each commit shows its summary (or its commit message while there isn’t one), the
        author, a link to the commit on GitHub, and how many files and lines changed.
      </DocP>

      <DocH2 id="summaries">Commit summaries</DocH2>
      <DocP>
        When a commit arrives, Apperio asks an AI model to describe it in two ways: one
        sentence anyone can follow, and a technical note for developers. Summaries
        are written in the background, usually within a minute; until then the card says{" "}
        <DocStrong>Writing summary…</DocStrong>. If writing one fails, the card offers a
        retry.
      </DocP>

      <DocH2 id="explain">Explain this change</DocH2>
      <DocP>
        <DocStrong>Explain this change</DocStrong>, on any commit card, asks for a longer
        explanation of what the commit does and what it might affect. Apperio reads the
        commit’s diff from GitHub to write it. The answer is saved, so opening it again is
        instant.
      </DocP>

      <DocH2 id="what-is-sent">What the AI sees</DocH2>
      <DocP>
        To write a summary, Apperio sends the model the commit message, the list of changed
        files and an excerpt of the diff, up to 8,000 characters per commit. These files
        never contribute diff content:
      </DocP>
      <DocUl>
        <DocLi>
          lockfiles (<InlineCode>package-lock.json</InlineCode>,{" "}
          <InlineCode>yarn.lock</InlineCode>, <InlineCode>pnpm-lock.yaml</InlineCode>);
        </DocLi>
        <DocLi>minified files, source maps, and anything under <InlineCode>dist/</InlineCode>, <InlineCode>build/</InlineCode> or <InlineCode>node_modules/</InlineCode>;</DocLi>
        <DocLi>images and fonts.</DocLi>
      </DocUl>

      <DocH2 id="limits">Limits</DocH2>
      <DocUl>
        <DocLi>
          <DocStrong>Per push:</DocStrong> up to 10 commits from each push get a summary.
        </DocLi>
        <DocLi>
          <DocStrong>On first link:</DocStrong> 50 commits are imported and the 10 newest are
          summarized.
        </DocLi>
        <DocLi>
          <DocStrong>Per month:</DocStrong> each project has a monthly allowance of AI
          summaries. When it runs out, the Changes page says so, new commits appear with
          their commit messages, and summaries resume on the 1st of the next month (UTC).
        </DocLi>
      </DocUl>
    </DocPage>
  );
}
