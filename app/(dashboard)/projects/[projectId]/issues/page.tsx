"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  CircleDot,
  Github,
  ExternalLink,
  Search,
  Check,
  Loader2,
  Sparkles,
  GitCommitHorizontal,
  Users,
  Hash,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SignalDot } from "@/components/shared/SignalDot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateGithubIssue,
  useErrorGroupDetail,
  useErrorGroups,
  useIssueDraft,
  useUpdateErrorGroupStatus,
} from "@/hooks/changes.hooks";
import type { ErrorGroup } from "@/services/changes.service";
import { formatCompact } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

// ---------------------------------------------------------------------------
// Status presentation
// ---------------------------------------------------------------------------

const STATUS_TABS = [
  { id: "unresolved", label: "Unresolved" },
  { id: "resolved", label: "Resolved" },
  { id: "ignored", label: "Ignored" },
  { id: "all", label: "All" },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["id"];

function StatusBadge({ group }: { group: ErrorGroup }) {
  if (group.status === "resolved") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-ok/10 text-status-ok text-xs">
        <SignalDot status="ok" size="sm" pulse={false} />
        Resolved{group.resolvedBy === "github" ? " via GitHub" : ""}
      </span>
    );
  }
  if (group.status === "ignored") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted text-xs">
        Ignored
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-danger/10 text-status-danger text-xs">
      <SignalDot status="danger" size="sm" />
      {group.regressed ? "Regressed" : "Unresolved"}
    </span>
  );
}

function LinkedIssueChip({ group }: { group: ErrorGroup }) {
  if (!group.linkedIssue) return null;
  return (
    <a
      href={group.linkedIssue.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs transition-colors",
        group.linkedIssue.state === "closed"
          ? "bg-data-purple/10 text-data-purple hover:bg-data-purple/20"
          : "bg-status-ok/10 text-status-ok hover:bg-status-ok/20",
      )}
    >
      <Github className="w-3 h-3" />
      #{group.linkedIssue.number}
      {group.linkedIssue.state === "closed" ? " closed" : " open"}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Create-issue dialog (AI draft preview, editable before publishing)
// ---------------------------------------------------------------------------

function CreateIssueDialog({
  projectId,
  group,
  open,
  onClose,
}: {
  projectId: string;
  group: ErrorGroup;
  open: boolean;
  onClose: () => void;
}) {
  const draftMutation = useIssueDraft(projectId);
  const createMutation = useCreateGithubIssue(projectId);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [draftSource, setDraftSource] = useState<"ai" | "template" | null>(null);
  const [created, setCreated] = useState<{ number: number; url: string } | null>(null);

  useEffect(() => {
    if (open && !title && !draftMutation.isPending) {
      draftMutation.mutate(group._id, {
        onSuccess: (draft) => {
          setTitle(draft.title);
          setBody(draft.body);
          setDraftSource(draft.source);
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCreate = () => {
    createMutation.mutate(
      { groupId: group._id, title, body },
      {
        onSuccess: (result) => setCreated(result.issue),
      },
    );
  };

  const handleClose = () => {
    setCreated(null);
    setTitle("");
    setBody("");
    setDraftSource(null);
    createMutation.reset();
    draftMutation.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            Create GitHub issue
          </DialogTitle>
          <DialogDescription>
            {created
              ? "Issue created and linked. Closing it on GitHub resolves this error automatically."
              : "Review the draft before publishing. Apperio wrote it from the error's context."}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="rounded-lg border border-border-subtle bg-bg-base p-6 text-center space-y-3">
            <Check className="w-8 h-8 text-status-ok mx-auto" />
            <p className="text-sm text-text-primary font-medium">
              Issue #{created.number} created
            </p>
            <Button asChild variant="outline" size="sm">
              <a href={created.url} target="_blank" rel="noopener noreferrer">
                Open on GitHub
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </a>
            </Button>
          </div>
        ) : draftMutation.isPending ? (
          <div className="rounded-lg border border-border-subtle bg-bg-base p-10 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-signal mx-auto animate-spin" />
            <p className="text-sm text-text-muted">Drafting the issue from error context…</p>
          </div>
        ) : (
          <div className="space-y-4">
            {draftSource === "ai" && (
              <p className="text-xs text-text-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-signal" />
                Drafted by AI from the stack trace, impact data, and suspect commits.
              </p>
            )}
            <div className="space-y-1.5">
              <label className="text-xs text-text-muted uppercase tracking-wider">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-text-muted uppercase tracking-wider">
                Body (GitHub markdown)
              </label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={14}
                className="font-mono text-xs"
              />
            </div>
            {createMutation.isError && (
              <p className="text-xs text-status-danger">
                {(createMutation.error as Error)?.message || "Failed to create issue"}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {created ? (
            <Button variant="outline" onClick={handleClose}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="signal"
                onClick={handleCreate}
                disabled={createMutation.isPending || !title.trim() || draftMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create issue
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Group detail dialog
// ---------------------------------------------------------------------------

function GroupDetailDialog({
  projectId,
  groupId,
  onClose,
}: {
  projectId: string;
  groupId: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const detailQuery = useErrorGroupDetail(projectId, groupId);
  const updateStatus = useUpdateErrorGroupStatus(projectId);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);

  const group = detailQuery.data?.group;

  return (
    <>
      <Dialog open={!!groupId && !issueDialogOpen} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {!group ? (
            <div className="p-10 text-center">
              <Loader2 className="w-6 h-6 text-signal mx-auto animate-spin" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-base leading-snug pr-8">
                  {group.title}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="flex items-center flex-wrap gap-3 pt-1">
                    <StatusBadge group={group} />
                    <LinkedIssueChip group={group} />
                    <span className="text-xs text-text-muted">
                      First seen {format(new Date(group.firstSeen), "MMM d, yyyy HH:mm")}
                      {group.releaseFirstSeen ? ` · ${group.releaseFirstSeen}` : ""}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              {/* Impact strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border-subtle bg-bg-base p-3">
                  <p className="text-xs text-text-muted flex items-center gap-1.5">
                    <Hash className="w-3 h-3" /> Occurrences
                  </p>
                  <p className="text-xl font-display font-bold text-text-primary mt-1">
                    {formatCompact(group.count)}
                  </p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-bg-base p-3">
                  <p className="text-xs text-text-muted flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> Sessions affected
                  </p>
                  <p className="text-xl font-display font-bold text-text-primary mt-1">
                    {formatCompact(group.sessionCount)}
                  </p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-bg-base p-3">
                  <p className="text-xs text-text-muted">Last seen</p>
                  <p className="text-sm font-medium text-text-primary mt-2">
                    {formatDistanceToNow(new Date(group.lastSeen), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Suspect commits */}
              {group.suspectCommits && group.suspectCommits.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-body text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <GitCommitHorizontal className="w-3.5 h-3.5" />
                    Likely caused by
                  </h3>
                  {group.suspectCommits.map((suspect) => (
                    <div
                      key={suspect.sha}
                      className="rounded-lg border border-border-subtle bg-bg-base p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-text-primary truncate">
                          {suspect.message || suspect.sha.slice(0, 7)}
                        </p>
                        {suspect.htmlUrl ? (
                          <a
                            href={suspect.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-text-muted hover:text-signal shrink-0 inline-flex items-center gap-1"
                          >
                            {suspect.sha.slice(0, 7)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs font-mono text-text-muted shrink-0">
                            {suspect.sha.slice(0, 7)}
                          </span>
                        )}
                      </div>
                      {suspect.rationale && (
                        <p className="text-xs text-text-muted">{suspect.rationale}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!group.suspectCommitsComputedAt && (
                <p className="text-xs text-text-muted flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Checking recent commits for a likely cause…
                </p>
              )}

              {/* Stack trace */}
              {group.sampleStack && (
                <div className="space-y-2">
                  <h3 className="text-xs font-body text-text-muted uppercase tracking-wider">
                    Stack trace
                  </h3>
                  <pre className="rounded-lg border border-border-subtle bg-bg-base p-3 text-xs font-mono text-text-secondary overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {group.sampleStack}
                  </pre>
                </div>
              )}

              <DialogFooter className="flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.push(`/projects/${projectId}/logs?search=${encodeURIComponent(group.sampleMessage.slice(0, 60))}`)
                  }
                >
                  View events in logs
                </Button>
                {group.status !== "ignored" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate({ groupId: group._id, status: "ignored" })
                    }
                  >
                    Ignore
                  </Button>
                )}
                {group.status !== "resolved" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate({ groupId: group._id, status: "resolved" })
                    }
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Resolve
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate({ groupId: group._id, status: "unresolved" })
                    }
                  >
                    Reopen
                  </Button>
                )}
                {group.linkedIssue ? (
                  <Button asChild variant="signal" size="sm">
                    <a
                      href={group.linkedIssue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="w-4 h-4 mr-1.5" />
                      Issue #{group.linkedIssue.number}
                    </a>
                  </Button>
                ) : (
                  <Button
                    variant="signal"
                    size="sm"
                    onClick={() => setIssueDialogOpen(true)}
                  >
                    <Github className="w-4 h-4 mr-1.5" />
                    Create GitHub issue
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {group && (
        <CreateIssueDialog
          projectId={projectId}
          group={group}
          open={issueDialogOpen}
          onClose={() => setIssueDialogOpen(false)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function IssuesPage() {
  const params = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const projectId = params.projectId;

  const [statusTab, setStatusTab] = useState<StatusTab>("unresolved");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    searchParams.get("group"),
  );
  const debouncedSearch = useDebounce(search, 300);

  const groupsQuery = useErrorGroups(projectId, {
    page,
    limit: 20,
    status: statusTab === "all" ? undefined : statusTab,
    search: debouncedSearch || undefined,
  });

  const items = groupsQuery.data?.items ?? [];
  const meta = groupsQuery.data?.meta;
  const stats = meta?.stats ?? { unresolved: 0, resolved: 0, ignored: 0 };
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  const tabCount = (tab: StatusTab): number | null => {
    if (tab === "unresolved") return stats.unresolved;
    if (tab === "resolved") return stats.resolved;
    if (tab === "ignored") return stats.ignored;
    return stats.unresolved + stats.resolved + stats.ignored;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Issues"
        description="Errors grouped into actionable issues. New ones notify you automatically — one click turns them into GitHub issues."
      />

      <div className="px-4 space-y-4">
        {/* Status tabs + search */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1 border-b border-border-subtle">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusTab(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-2 text-sm transition-colors border-b-2 -mb-px inline-flex items-center gap-2",
                  statusTab === tab.id
                    ? "border-signal text-text-primary font-medium"
                    : "border-transparent text-text-muted hover:text-text-secondary",
                )}
              >
                {tab.label}
                {tabCount(tab.id) !== null && (
                  <span className="text-xs font-mono text-text-muted">
                    {formatCompact(tabCount(tab.id)!)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search issues…"
              className="pl-9"
            />
          </div>
        </div>

        {/* List */}
        {groupsQuery.isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border-subtle bg-bg-surface h-16 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-12 text-center space-y-3">
            <CircleDot className="w-8 h-8 text-text-muted mx-auto" />
            <p className="text-sm text-text-primary font-medium">
              {statusTab === "unresolved" ? "No unresolved issues" : "Nothing here"}
            </p>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              {statusTab === "unresolved"
                ? "When your app throws a new kind of error, it shows up here and you get notified."
                : "Issues you resolve or ignore will appear in their tabs."}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_90px_90px_130px_180px] gap-4 px-4 py-3 border-b border-border-subtle bg-bg-base">
              <span className="text-xs font-body text-text-muted uppercase tracking-wider">Issue</span>
              <span className="text-xs font-body text-text-muted uppercase tracking-wider text-right">Events</span>
              <span className="text-xs font-body text-text-muted uppercase tracking-wider text-right">Sessions</span>
              <span className="text-xs font-body text-text-muted uppercase tracking-wider">Last seen</span>
              <span className="text-xs font-body text-text-muted uppercase tracking-wider">Status</span>
            </div>
            {items.map((group) => (
              <button
                key={group._id}
                onClick={() => setSelectedGroupId(group._id)}
                className="grid grid-cols-1 md:grid-cols-[1fr_90px_90px_130px_180px] gap-2 md:gap-4 px-4 py-3 border-b border-border-subtle last:border-b-0 w-full text-left hover:bg-bg-elevated/50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm text-text-primary font-medium truncate group-hover:text-signal transition-colors">
                    {group.title}
                  </p>
                  <p className="text-xs text-text-muted truncate mt-0.5">
                    {group.environments.join(", ")}
                    {group.releaseFirstSeen ? ` · since ${group.releaseFirstSeen}` : ""}
                  </p>
                </div>
                <span className="text-sm font-mono text-status-danger md:text-right font-semibold">
                  {formatCompact(group.count)}
                </span>
                <span className="text-sm font-mono text-text-secondary md:text-right">
                  {formatCompact(group.sessionCount)}
                </span>
                <span className="text-xs text-text-muted font-mono self-center">
                  {formatDistanceToNow(new Date(group.lastSeen), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-2 flex-wrap">
                  <StatusBadge group={group} />
                  <LinkedIssueChip group={group} />
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <GroupDetailDialog
        projectId={projectId}
        groupId={selectedGroupId}
        onClose={() => setSelectedGroupId(null)}
      />
    </div>
  );
}
