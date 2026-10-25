"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileCode2,
  Upload,
  Trash2,
  Loader2,
  Package,
  Calendar,
  File,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface SourceMap {
  id: string;
  releaseVersion: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export default function SourceMapsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId =
    typeof params?.projectId === "string" ? params.projectId : "";

  // Local state for source maps (this would be replaced by a real API hook)
  const [sourceMaps, setSourceMaps] = useState<SourceMap[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Upload form state
  const [releaseVersion, setReleaseVersion] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!releaseVersion.trim()) {
      toast.error("Please enter a release version");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a source map file");
      return;
    }

    setIsUploading(true);
    try {
      // Simulate upload -- in production this would call a real API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newMap: SourceMap = {
        id: Date.now().toString(),
        releaseVersion: releaseVersion.trim(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        uploadedAt: new Date().toISOString(),
      };

      setSourceMaps((prev) => [newMap, ...prev]);
      setReleaseVersion("");
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById(
        "sourceMapFile"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      toast.success("Source map uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload source map");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this source map?"
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSourceMaps((prev) => prev.filter((sm) => sm.id !== id));
      toast.success("Source map deleted");
    } catch {
      toast.error("Failed to delete source map");
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center">
            <FileCode2 className="w-5 h-5 text-signal" />
          </div>
          Source Maps
        </h1>
        <p className="text-text-secondary mt-1 ml-[46px]">
          Upload source maps to get readable stack traces in error reports
        </p>
      </div>

      {/* Upload Form */}
      <Card className="bg-bg-surface border-border-subtle max-w-2xl">
        <CardHeader>
          <CardTitle className="font-display text-text-primary flex items-center gap-2">
            <Upload className="w-5 h-5 text-signal" />
            Upload Source Map
          </CardTitle>
          <CardDescription className="text-text-muted">
            Upload a <code className="text-text-code font-mono text-xs">.map</code> file for a specific release version
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="releaseVersion" className="text-text-secondary text-sm">
              Release Version
            </Label>
            <Input
              id="releaseVersion"
              value={releaseVersion}
              onChange={(e) => setReleaseVersion(e.target.value)}
              placeholder="e.g. 1.0.0, v2.3.1, abc123"
              className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0 font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceMapFile" className="text-text-secondary text-sm">
              Source Map File
            </Label>
            <div className="relative">
              <input
                id="sourceMapFile"
                type="file"
                accept=".map,.js.map"
                onChange={(e) =>
                  setSelectedFile(e.target.files?.[0] || null)
                }
                className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-signal/10 file:text-signal hover:file:bg-signal/20 file:cursor-pointer cursor-pointer bg-bg-elevated border border-border-subtle rounded-lg p-2"
              />
            </div>
            {selectedFile && (
              <p className="text-xs text-text-muted">
                Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          <Button
            variant="signal"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload Source Map
          </Button>
        </CardContent>
      </Card>

      {/* Source Maps List */}
      <div className="max-w-2xl">
        <h2 className="text-lg font-display font-semibold text-text-primary mb-4">
          Uploaded Source Maps
        </h2>

        {sourceMaps.length === 0 ? (
          <Card className="bg-bg-surface border-border-subtle">
            <CardContent className="p-12 text-center">
              <FileCode2 className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No source maps uploaded
              </h3>
              <p className="text-text-muted text-sm">
                Upload source maps to translate minified stack traces into
                readable code references.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sourceMaps.map((sm) => (
              <Card
                key={sm.id}
                className="bg-bg-surface border-border-subtle hover:border-border-accent transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center shrink-0">
                        <File className="w-5 h-5 text-text-muted" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-text-primary truncate">
                            {sm.fileName}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-signal/10 text-signal border-signal/20 shrink-0"
                          >
                            <Package className="w-3 h-3 mr-1" />
                            {sm.releaseVersion}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-muted">
                          <span>{formatFileSize(sm.fileSize)}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(sm.uploadedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(sm.id)}
                      disabled={deletingId === sm.id}
                      className="text-text-muted hover:text-status-danger hover:bg-status-danger/10 shrink-0"
                    >
                      {deletingId === sm.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
