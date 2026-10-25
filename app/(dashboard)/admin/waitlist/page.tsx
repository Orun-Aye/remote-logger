"use client";

import { useState } from "react";
import {
  useWaitlistEntries,
  useWaitlistStats,
  useApproveEntry,
  useRejectEntry,
  useSendInvite,
  useBulkApprove,
} from "@/hooks/waitlist.hook";
import { WaitlistStatus } from "@/services/waitlist.service";
import { useDebounce } from "@/hooks/useDebounce";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Check,
  X,
  Clock,
  UserCheck,
  UserX,
  Users,
  Send,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusBadge(status: WaitlistStatus) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-status-warn/10 text-status-warn border-transparent">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge className="bg-signal/15 text-signal border-signal/30">
          <Check className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-status-danger/10 text-status-danger border-transparent">
          <X className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminWaitlistPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WaitlistStatus | "all">(
    "all"
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const limit = 20;

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useWaitlistEntries({
    page,
    limit,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearch || undefined,
    sort: "-createdAt",
  });
  const { data: stats } = useWaitlistStats();

  const approveEntry = useApproveEntry();
  const rejectEntry = useRejectEntry();
  const sendInvite = useSendInvite();
  const bulkApprove = useBulkApprove();

  const entries = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const handleApprove = async (id: string) => {
    try {
      await approveEntry.mutateAsync(id);
      toast.success("Entry approved");
    } catch {
      toast.error("Failed to approve entry");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectEntry.mutateAsync(id);
      toast.success("Entry rejected");
    } catch {
      toast.error("Failed to reject entry");
    }
  };

  const handleSendInvite = async (id: string) => {
    try {
      await sendInvite.mutateAsync(id);
      toast.success("Invite email sent");
    } catch {
      toast.error("Failed to send invite email");
    }
  };

  const handleBulkApprove = async () => {
    if (selected.size === 0) return;
    try {
      const result = await bulkApprove.mutateAsync(Array.from(selected));
      toast.success(`${result.length} entries approved`);
      setSelected(new Set());
    } catch {
      toast.error("Failed to bulk approve");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === entries.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(entries.map((e) => e._id)));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waitlist"
        description="Manage early access signups and send invite emails"
        badge={
          stats ? (
            <Badge variant="outline" className="text-text-muted">
              {stats.total} total
            </Badge>
          ) : undefined
        }
      />

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, icon: Users },
            { label: "Pending", value: stats.pending, icon: Clock },
            { label: "Approved", value: stats.approved, icon: UserCheck },
            { label: "Rejected", value: stats.rejected, icon: UserX },
            { label: "Signed Up", value: stats.signedUp, icon: Check },
          ].map((s) => (
            <Card key={s.label} className="bg-bg-surface border-border-subtle">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-muted">
                  <s.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-lg font-display font-bold text-text-primary">
                    {s.value}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">
                    {s.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters + Bulk actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-bg-surface border-border-subtle text-text-primary placeholder:text-text-muted"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "pending", "approved", "rejected"] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "ghost"}
                size="sm"
                className={
                  statusFilter === s
                    ? "bg-signal/15 text-signal hover:bg-signal/20 text-xs"
                    : "text-text-muted hover:text-text-primary text-xs"
                }
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
              >
                {s === "all"
                  ? "All"
                  : s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {selected.size > 0 && (
          <Button
            variant="signal"
            size="sm"
            onClick={handleBulkApprove}
            disabled={bulkApprove.isPending}
          >
            {bulkApprove.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4 mr-2" />
            )}
            Approve {selected.size} selected
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="bg-bg-surface border-border-subtle overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">
              No waitlist entries found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-elevated/50">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={
                          entries.length > 0 &&
                          selected.size === entries.length
                        }
                        onChange={toggleAll}
                        className="rounded border-border-subtle"
                      />
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      #
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Invite Code
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Email Sent
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Signed Up
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {entries.map((entry) => (
                    <tr
                      key={entry._id}
                      className="hover:bg-bg-elevated/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selected.has(entry._id)}
                          onChange={() => toggleSelect(entry._id)}
                          className="rounded border-border-subtle"
                        />
                      </td>
                      <td className="py-3 px-4 text-text-muted text-xs font-mono">
                        {entry.position}
                      </td>
                      <td className="py-3 px-4 text-text-primary font-mono text-xs">
                        {entry.email}
                      </td>
                      <td className="py-3 px-4">{statusBadge(entry.status)}</td>
                      <td className="py-3 px-4">
                        {entry.inviteCode ? (
                          <code className="text-xs text-signal bg-signal/10 px-2 py-1 rounded font-mono">
                            {entry.inviteCode}
                          </code>
                        ) : (
                          <span className="text-text-muted text-xs">--</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-muted text-xs">
                        {entry.invitedAt ? (
                          <span className="text-signal">
                            {formatDate(entry.invitedAt)}
                          </span>
                        ) : entry.status === "approved" ? (
                          <span className="text-status-warn">Not sent</span>
                        ) : (
                          "--"
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-muted text-xs">
                        {formatDate(entry.signedUpAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Send invite email button */}
                          {entry.status === "approved" && entry.inviteCode && !entry.signedUpAt && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-text-muted hover:text-signal"
                              onClick={() => handleSendInvite(entry._id)}
                              disabled={sendInvite.isPending}
                              title="Send invite email"
                            >
                              {sendInvite.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </Button>
                          )}

                          {/* Approve button */}
                          {entry.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-text-muted hover:text-signal"
                                onClick={() => handleApprove(entry._id)}
                                disabled={approveEntry.isPending}
                                title="Approve"
                              >
                                <UserCheck className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-text-muted hover:text-status-danger"
                                onClick={() => handleReject(entry._id)}
                                disabled={rejectEntry.isPending}
                                title="Reject"
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Showing {(page - 1) * limit + 1}-
            {Math.min(page * limit, meta.total)} of {meta.total} entries
          </p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="text-text-muted hover:text-text-primary"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="flex items-center px-3 text-xs text-text-secondary">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="text-text-muted hover:text-text-primary"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
