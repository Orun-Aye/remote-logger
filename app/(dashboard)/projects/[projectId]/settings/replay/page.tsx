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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Video, Loader2, Check, X, Clock, Code2, ShieldCheck } from "lucide-react";
import { useReplaySettings, useUpdateReplaySettings } from "@/hooks/replay.hook";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SAMPLE_RATE_PRESETS = [0.01, 0.1, 0.25, 0.5, 1];

/** "About 1 in 10 visits", in words a non-statistician reads at a glance */
function describeSampleRate(rate: number): string {
  if (rate >= 1) return "Every visit will be recorded.";
  if (rate <= 0) return "No visits will be recorded.";
  const oneIn = Math.round(1 / rate);
  return `About 1 in ${oneIn} visits will be recorded.`;
}

const formatPercent = (rate: number) => `${Math.round(rate * 100)}%`;

export default function ReplaySettingsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const { data: saved, isLoading, error } = useReplaySettings(projectId);
  const update = useUpdateReplaySettings(projectId);

  // Unsaved edits; null means "same as saved"
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [sampleRate, setSampleRate] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-48 bg-bg-surface rounded animate-pulse" />
        <div className="h-64 bg-bg-surface rounded animate-pulse" />
      </div>
    );
  }

  if (error || !saved) {
    return (
      <div className="max-w-2xl">
        <Card className="bg-bg-surface border-border-subtle">
          <CardContent className="p-12 text-center">
            <p className="text-text-muted">Could not load session replay settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const effectiveEnabled = enabled ?? saved.enabled;
  const effectiveRate = sampleRate ?? saved.sampleRate;
  const dirty = effectiveEnabled !== saved.enabled || effectiveRate !== saved.sampleRate;
  const presets = SAMPLE_RATE_PRESETS.includes(saved.sampleRate)
    ? SAMPLE_RATE_PRESETS
    : [...SAMPLE_RATE_PRESETS, saved.sampleRate].sort((a, b) => a - b);

  const handleSave = () => {
    update.mutate(
      { enabled: effectiveEnabled, sampleRate: effectiveRate },
      {
        onSuccess: (result) => {
          setEnabled(null);
          setSampleRate(null);
          toast.success(result.enabled ? "Session replay is on" : "Session replay is off");
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to save replay settings"),
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center">
            <Video className="w-5 h-5 text-signal" />
          </div>
          Session Replay
        </h1>
        <p className="text-text-secondary mt-1 ml-[46px]">
          Watch a recording of what a visitor saw and did, right up to an error.
        </p>
      </div>

      {/* On/off and sample rate */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <CardTitle className="font-display text-text-primary">Recording</CardTitle>
          <CardDescription className="text-text-muted">
            Off by default. Nothing is recorded until you turn it on here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-bg-elevated border border-border-subtle">
            <div>
              <Label htmlFor="replay-enabled" className="text-text-primary text-sm font-medium">
                Record sessions
              </Label>
              <p className="text-xs text-text-muted mt-0.5">
                Applies to every site or app sending data with this project&apos;s API key.
              </p>
            </div>
            <Switch
              id="replay-enabled"
              checked={effectiveEnabled}
              onCheckedChange={(checked) => setEnabled(checked)}
            />
          </div>

          <div className={cn("space-y-3", !effectiveEnabled && "opacity-50")}>
            <div className="flex items-baseline justify-between">
              <Label className="text-text-primary text-sm font-medium">How many visits to record</Label>
              <span className="text-2xl font-display font-bold text-signal">
                {formatPercent(effectiveRate)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Share of visits to record">
              {presets.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  role="radio"
                  aria-checked={effectiveRate === rate}
                  disabled={!effectiveEnabled}
                  onClick={() => setSampleRate(rate)}
                  className={cn(
                    "px-3 py-1.5 rounded-md border text-sm font-mono transition-colors",
                    effectiveRate === rate
                      ? "border-signal bg-signal/10 text-signal"
                      : "border-border-subtle text-text-secondary hover:border-border-accent hover:text-text-primary",
                    "disabled:cursor-not-allowed"
                  )}
                >
                  {formatPercent(rate)}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted">
              {describeSampleRate(effectiveRate)} Fewer recordings means less data to store;
              errors still show up either way.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="signal" onClick={handleSave} disabled={!dirty || update.isPending}>
              {update.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy, in plain words */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <CardTitle className="font-display text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-signal" />
            What gets recorded
          </CardTitle>
          <CardDescription className="text-text-muted">
            A replay is not a video. It is a copy of the page and what happened on it, rebuilt
            in your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="space-y-2">
            <p className="text-text-primary font-medium">Recorded</p>
            <ul className="space-y-1.5 text-text-secondary">
              {[
                "The page as the visitor saw it, and how it changed",
                "Clicks, scrolling and mouse movement",
                "Text on the page, such as headings, buttons and names shown on screen",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="w-4 h-4 text-status-ok shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-text-primary font-medium">Never recorded</p>
            <ul className="space-y-1.5 text-text-secondary">
              <li className="flex gap-2">
                <X className="w-4 h-4 text-status-danger shrink-0 mt-0.5" />
                <span>
                  Anything typed into a form field. Passwords, emails and card numbers show up as
                  <span className="font-mono text-text-primary"> ••••••</span>, one per character.
                </span>
              </li>
              <li className="flex gap-2">
                <X className="w-4 h-4 text-status-danger shrink-0 mt-0.5" />
                <span>
                  Any part of your page you mark with the{" "}
                  <code className="font-mono text-text-code">apperio-mask</code> class. Use it for
                  things like account names, addresses or balances.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-bg-elevated border border-border-subtle p-4 space-y-1.5 text-text-secondary">
            <p>
              Masking happens in the visitor&apos;s browser, before anything is sent. The hidden
              text never reaches Apperio, so it cannot leak from here.
            </p>
            <p>Recordings are deleted after 7 days. Only people on this project can watch them.</p>
          </div>
        </CardContent>
      </Card>

      {/* When it applies */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <CardTitle className="font-display text-text-primary">When a change takes effect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-text-secondary">
          <p className="flex gap-2">
            <Clock className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
            Within 5 minutes, on the next page a visitor loads. Needs a version of the apperio SDK
            with session replay.
          </p>
          <p className="flex gap-2">
            <Code2 className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
            <span>
              If your code sets <code className="font-mono text-text-code">replay.enabled</code> or{" "}
              <code className="font-mono text-text-code">replay.sampleRate</code> when it starts
              the SDK, the code wins and this page is ignored for that setting.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
