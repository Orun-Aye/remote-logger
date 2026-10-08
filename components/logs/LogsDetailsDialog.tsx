import { getLevelIcon } from "@/lib/utils";
import { LogEntry } from "@/types/analytics";
import { formatRelease } from "@/lib/format-utils";
import { useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { WifiOff } from "lucide-react";
import { ResolvedStackTrace } from "@/components/dashboard/logs/ResolvedStackTrace";


interface LogDetailsDialogProps {
  log: LogEntry | null;
  onClose: () => void;
}

export const LogDetailsDialog: React.FC<LogDetailsDialogProps> = ({ log, onClose }) => {
  
   const levelIcon = useMemo(() => log ? getLevelIcon(log.level) : null, [log]);
  
  if (!log) return null;

  

  return (
    <Dialog open={!!log} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {levelIcon}
            <span>Log Details</span>
            {log.release && (
              <Badge variant="outline" className="font-mono text-xs bg-bg-elevated border-border-subtle">
                {formatRelease(log.release)}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>Full log entry with all available metadata</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Offline Queue Notice */}
          {(log.data?.offlineQueued || log.metadata?.offlineQueued) && (
            <div className="flex items-center gap-2 text-xs text-status-warn bg-status-warn/5 border border-status-warn/20 rounded-md px-3 py-2">
              <WifiOff className="h-3 w-3" />
              This log was queued while offline and synced later
            </div>
          )}
          <div>
            <Label className="text-sm font-medium">Message</Label>
            <Textarea value={log.message} readOnly className="mt-1 min-h-[60px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Level</Label>
              <Input value={log.level} readOnly className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Project</Label>
              <Input value={log.projectId} readOnly className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Service</Label>
              <Input value={log.service || "N/A"} readOnly className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Environment</Label>
              <Input value={log.environment || "N/A"} readOnly className="mt-1" />
            </div>
          </div>
          {/* Resolved Stack Trace */}
          {log.error?.stack && log.release && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Stack Trace</Label>
              <ResolvedStackTrace
                projectId={log.projectId}
                release={log.release}
                stackTrace={log.error.stack}
              />
            </div>
          )}
          <div>
            <Label className="text-sm font-medium">Raw Log Data</Label>
            <Textarea
              value={JSON.stringify(log, null, 2)}
              readOnly
              className="mt-1 min-h-[200px] font-mono text-xs"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};