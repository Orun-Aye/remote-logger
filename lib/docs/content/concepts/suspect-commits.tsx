import {
  DocPage,
  DocH2,
  DocP,
  DocOl,
  DocUl,
  DocLi,
  DocStrong,
  DocLink,
  DocCallout,
  InlineCode,
  type TocItem,
} from "@/components/docs";

const toc: TocItem[] = [
  { id: "where", title: "Where you see them", level: 2 },
  { id: "how", title: "How they are picked", level: 2 },
  { id: "when", title: "When they are worked out", level: 2 },
  { id: "limits", title: "When there are none", level: 2 },
];

export default function SuspectCommitsPage() {
  return (
    <DocPage slug="concepts/suspect-commits" toc={toc}>
      <DocH2 id="where">Where you see them</DocH2>
      <DocP>
        Open an issue. Under <DocStrong>Likely caused by</DocStrong>, Apperio lists up to
        three commits that probably introduced the error, each with its message, a link to
        the commit on GitHub, and a one-line reason. Suspects are a starting point for your
        investigation, not proof.
      </DocP>

      <DocH2 id="how">How they are picked</DocH2>
      <DocOl>
        <DocLi>
          <DocStrong>Candidates.</DocStrong> Up to 20 commits on your linked branch from the
          7 days before the error was first seen.
        </DocLi>
        <DocLi>
          <DocStrong>Scoring.</DocStrong> A commit scores higher for each file it changed
          whose name appears in the error’s stack trace, and a little higher the more recent
          it is.
        </DocLi>
        <DocLi>
          <DocStrong>Ranking.</DocStrong> The 10 best candidates go to an AI model along with
          the error and its stack trace. It picks the likeliest, gives each a score from 0 to
          100 and writes the reason you see.
        </DocLi>
      </DocOl>
      <DocP>
        If the AI step isn’t available, Apperio falls back to the scoring alone and only
        lists commits that changed a file named in the stack trace, with the reason{" "}
        <DocStrong>Touched files that appear in the error’s stack trace.</DocStrong>
      </DocP>

      <DocH2 id="when">When they are worked out</DocH2>
      <DocP>
        The first time anyone opens the issue. While it runs, the issue shows{" "}
        <DocStrong>Checking recent commits for a likely cause…</DocStrong>, usually for
        less than a minute. The result is saved and not recalculated, so later commits never
        appear as suspects for an older issue.
      </DocP>

      <DocH2 id="limits">When there are none</DocH2>
      <DocUl>
        <DocLi>
          <DocStrong>No commits in the window.</DocStrong> GitHub wasn’t connected yet, or
          nothing was pushed to the linked branch in the 7 days before the error first
          appeared.
        </DocLi>
        <DocLi>
          <DocStrong>No file match without AI.</DocStrong> The fallback needs a file in the
          stack trace to match a changed file.
        </DocLi>
      </DocUl>
      <DocCallout type="tip" title="Minified stack traces">
        Production bundles have names like <InlineCode>page-3f9a1c.js</InlineCode>,
        which never match the source files your commits change. The file-name bonus only
        helps when stack traces name your own files, as they do in Node.js and in
        development builds. The AI ranking still weighs each commit’s message and files.
      </DocCallout>
      <DocP>
        Related: <DocLink href="/docs/concepts/connect-github">Connect GitHub</DocLink>,{" "}
        <DocLink href="/docs/concepts/errors-and-issues">Errors and issues</DocLink>.
      </DocP>
    </DocPage>
  );
}
