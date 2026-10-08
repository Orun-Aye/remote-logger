import {
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  Globe,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "../ui/button";
import { LogEntry } from "@/types/analytics";
import { formatRelease } from "@/lib/format-utils";
import { useMemo } from "react";
import { formatTimestamp, getLevelColor, getLevelIcon } from "@/lib/utils";
import { Badge } from "../ui/badge";

// --- Component: LogListItem ---
interface LogListItemProps {
  log: LogEntry;
  isExpanded: boolean;
  onToggleExpansion: (logId: string) => void;
  onViewDetails: (log: LogEntry) => void;
  onDeleteLog: (logId: string) => void;
}

export const LogListItem: React.FC<LogListItemProps> = ({
  log,
  isExpanded,
  onToggleExpansion,
  onViewDetails,
  onDeleteLog,
}) => {
  const timestamp = useMemo(
    () => formatTimestamp(log.timestamp),
    [log.timestamp]
  );
  const levelColorClass = useMemo(() => getLevelColor(log.level), [log.level]);
  const levelIcon = useMemo(() => getLevelIcon(log.level), [log.level]);


  return (
    <div
      key={log._id}
      className={`border-l-4 p-4 hover:bg-muted/30 transition-colors ${levelColorClass}`}
    >
      <div className="flex items-start space-x-4">
        <Button
          variant="ghost"
          size="sm"
          className="p-4 h-auto self-center"
          onClick={() => onToggleExpansion(log._id)}
          aria-expanded={isExpanded}
          aria-controls={`log-details-${log._id}`}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-1">
            {levelIcon}
            <Badge variant="outline" className="text-xs">
              {log.level.toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {log.environment || "N/A"}
            </Badge>
            {log.service && (
              <Badge variant="outline" className="text-xs">
                {log.service}
              </Badge>
            )}
            {log.eventType && (
              <Badge variant="outline" className="text-xs">
                {log.eventType}
              </Badge>
            )}
            {log.release && (
              <Badge variant="outline" className="font-mono text-xs">
                {formatRelease(log.release)}
              </Badge>
            )}
            {(log.data?.offlineQueued || log.metadata?.offlineQueued) && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-status-warn/10 text-status-warn border-status-warn/30">
                Offline
              </Badge>
            )}
          </div>

          <p className="font-medium text-sm mb-2 break-words">{log.message}</p>

          <div className="flex items-center space-x-4 text-xs text-muted-foreground flex-wrap gap-y-1">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>
                {timestamp.date} {timestamp.time}
              </span>
            </div>
            {log.url && (
              <div className="flex items-center space-x-1">
                <Globe className="w-3 h-3" />
                <span className="truncate max-w-[150px] sm:max-w-xs">
                  {log.url}
                </span>
              </div>
            )}
            {log.userAgent && (
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>User Agent</span>{" "}
                {/* Consider truncating or showing on hover */}
              </div>
            )}
          </div>

          {isExpanded && (
            <div
              id={`log-details-${log._id}`}
              className="mt-4 space-y-3 animate-fade-in"
            >
              {/* Error Details */}
              {log.error && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Error Details</h4>
                  <div className="space-y-1 text-xs">
                    <div>
                      <strong>Name:</strong> {log.error.name}
                    </div>
                    <div>
                      <strong>Message:</strong> {log.error.message}
                    </div>
                    {log.error.url && (
                      <div>
                        <strong>File:</strong> {log.error.url}
                      </div>
                    )}
                    {log.error.lineNumber && (
                      <div>
                        <strong>Line:</strong> {log.error.lineNumber}
                      </div>
                    )}
                    {log.error.columnNumber && (
                      <div>
                        <strong>Column:</strong> {log.error.columnNumber}
                      </div>
                    )}
                  </div>
                  {log.error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                        {log.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Context Data */}
              {log.context && Object.keys(log.context).length > 0 && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Context</h4>
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(log.context, null, 2)}
                  </pre>
                </div>
              )}

              {/* Additional Data */}
              {log.data && Object.keys(log.data).length > 0 && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Additional Data</h4>
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Request Details */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Request Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <strong>Timestamp:</strong> {log.timestamp}
                  </div>
                  <div>
                    <strong>Environment:</strong> {log.environment || "N/A"}
                  </div>
                  {log.url && (
                    <div>
                      <strong>URL:</strong>{" "}
                      <span className="break-all">{log.url}</span>
                    </div>
                  )}
                  {log.referrer && (
                    <div>
                      <strong>Referrer:</strong>{" "}
                      <span className="break-all">{log.referrer}</span>
                    </div>
                  )}
                  {log.userAgent && (
                    <div className="col-span-1 sm:col-span-2">
                      <strong>User Agent:</strong>
                      <span className="block mt-1 break-all">
                        {log.userAgent}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(log)}
            aria-label="View full log details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDeleteLog(log._id)}
            aria-label="Delete log entry"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
