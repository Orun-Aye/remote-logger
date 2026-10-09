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
  { id: "create", title: "Create an issue from an error", level: 2 },
  { id: "the-draft", title: "What goes in the draft", level: 2 },
  { id: "sync", title: "Two-way sync", level: 2 },
  { id: "requirements", title: "Requirements", level: 2 },
];

export default function GithubIssuesPage() {
  return (
    <DocPage slug="concepts/github-issues" toc={toc}>
      <DocH2 id="create">Create an issue from an error</DocH2>
      <DocOl>
        <DocLi>Open the error on the <DocStrong>Issues</DocStrong> page.</DocLi>
        <DocLi>
          Choose <DocStrong>Create GitHub issue</DocStrong>. Apperio drafts the title and
          body; this takes a few seconds.
        </DocLi>
        <DocLi>Read the draft and edit anything you like. The body is GitHub markdown.</DocLi>
        <DocLi>
          Choose <DocStrong>Create issue</DocStrong>. The issue is opened in your linked
          repository with the labels <InlineCode>bug</InlineCode> and{" "}
          <InlineCode>apperio</InlineCode>, and linked to the error.
        </DocLi>
      </DocOl>
      <DocP>
        From then on the error shows the issue number and whether it is open or closed. Each
        error links to one GitHub issue: once it is linked, the button becomes{" "}
        <DocStrong>Issue #</DocStrong> followed by its number, and opens it on GitHub.
      </DocP>

      <DocH2 id="the-draft">What goes in the draft</DocH2>
      <DocP>
        An AI model writes the draft from the error’s context: the message, the stack trace,
        how many times it happened and how many sessions it reached, when it was first and
        last seen, its environments and first release, and any{" "}
        <DocLink href="/docs/concepts/suspect-commits">suspect commits</DocLink>. The dialog
        says <DocStrong>Drafted by AI</DocStrong> when it did.
      </DocP>
      <DocP>
        If the AI step isn’t available, you get a fixed template with the same facts: a
        summary, an impact list, the stack trace, possible causes, and a link back to the
        error in Apperio.
      </DocP>
      <DocCallout type="warning" title="Check what you publish">
        The draft includes the stack trace and error message as Apperio received them. If
        your repository is public, so is the issue. Remove anything you wouldn’t want
        shown before you create it.
      </DocCallout>

      <DocH2 id="sync">Two-way sync</DocH2>
      <DocUl>
        <DocLi>
          Close the issue on GitHub and the error becomes{" "}
          <DocStrong>Resolved via GitHub</DocStrong> in Apperio, usually within seconds.
        </DocLi>
        <DocLi>Reopen the issue and the error goes back to Unresolved.</DocLi>
        <DocLi>
          If the error happens again after it was resolved, it is marked{" "}
          <DocStrong>Regressed</DocStrong> and you are notified. The GitHub issue isn’t
          reopened for you.
        </DocLi>
      </DocUl>

      <DocH2 id="requirements">Requirements</DocH2>
      <DocUl>
        <DocLi>
          A linked repository. See{" "}
          <DocLink href="/docs/concepts/connect-github">Connect GitHub</DocLink>.
        </DocLi>
        <DocLi>
          The GitHub App installed on that repository for the sync. With only a personal
          token, Apperio can create the issue but never hears that it was closed.
        </DocLi>
        <DocLi>The project owner or an admin to create the issue.</DocLi>
      </DocUl>
    </DocPage>
  );
}
