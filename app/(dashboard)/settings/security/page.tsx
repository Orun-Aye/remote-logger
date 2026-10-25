"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  ShieldOff,
  Loader2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  QrCode,
  AlertTriangle,
} from "lucide-react";
import { SignalDot } from "@/components/shared/SignalDot";
import { mfaService, MfaSetupResponse } from "@/services/mfa.service";
import { toast } from "sonner";

type SetupStep = "idle" | "qr" | "verify" | "backup" | "done";

export default function SecuritySettingsPage() {
  // MFA status
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);
  const [statusLoading, setStatusLoading] = useState(true);

  // Setup wizard state
  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [backupConfirmed, setBackupConfirmed] = useState(false);

  // Disable MFA state
  const [disableCode, setDisableCode] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  // Setup loading
  const [setupLoading, setSetupLoading] = useState(false);

  // Load MFA status on mount
  useEffect(() => {
    loadMfaStatus();
  }, []);

  const loadMfaStatus = async () => {
    setStatusLoading(true);
    try {
      const status = await mfaService.getMfaStatus();
      setMfaEnabled(status.mfaEnabled);
      setBackupCodesRemaining(status.backupCodesRemaining);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load MFA status");
    } finally {
      setStatusLoading(false);
    }
  };

  // Start MFA setup
  const handleStartSetup = async () => {
    setSetupLoading(true);
    try {
      const data = await mfaService.setupMfa();
      setSetupData(data);
      setSetupStep("qr");
    } catch (err: any) {
      toast.error(err?.message || "Failed to initiate MFA setup");
    } finally {
      setSetupLoading(false);
    }
  };

  // Verify TOTP and enable
  const handleVerify = async () => {
    if (!verifyCode.trim() || verifyCode.length !== 6) {
      setVerifyError("Enter a 6-digit code from your authenticator app");
      return;
    }
    if (!setupData) return;

    setVerifyLoading(true);
    setVerifyError("");

    try {
      await mfaService.verifyMfa(verifyCode, setupData.backupCodes);
      setSetupStep("backup");
    } catch (err: any) {
      setVerifyError(err?.message || "Invalid code. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  };

  // Confirm backup codes saved
  const handleBackupConfirmed = () => {
    setMfaEnabled(true);
    setBackupCodesRemaining(setupData?.backupCodes.length || 8);
    setSetupStep("done");

    // Reset after brief display
    setTimeout(() => {
      setSetupStep("idle");
      setSetupData(null);
      setVerifyCode("");
      setBackupConfirmed(false);
    }, 2000);

    toast.success("MFA has been enabled successfully");
  };

  // Copy backup codes
  const handleCopyBackupCodes = () => {
    if (!setupData) return;
    const text = setupData.backupCodes.join("\n");
    navigator.clipboard.writeText(text);
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
    toast.success("Backup codes copied to clipboard");
  };

  // Copy secret
  const handleCopySecret = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  // Disable MFA
  const handleDisableMfa = async () => {
    if (!disableCode.trim()) return;

    setDisableLoading(true);
    try {
      await mfaService.disableMfa(disableCode);
      setMfaEnabled(false);
      setBackupCodesRemaining(0);
      setShowDisable(false);
      setDisableCode("");
      toast.success("MFA has been disabled");
    } catch (err: any) {
      toast.error(err?.message || "Failed to disable MFA");
    } finally {
      setDisableLoading(false);
    }
  };

  // Cancel setup
  const handleCancelSetup = () => {
    setSetupStep("idle");
    setSetupData(null);
    setVerifyCode("");
    setVerifyError("");
    setBackupConfirmed(false);
  };

  if (statusLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-48 bg-bg-surface rounded animate-pulse" />
        <div className="h-64 bg-bg-surface rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-signal" />
          </div>
          Security
        </h1>
        <p className="text-text-secondary mt-1 ml-[46px]">
          Manage your account security settings
        </p>
      </div>

      {/* MFA Status Card */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-text-primary flex items-center gap-2">
                Two-Factor Authentication
                <SignalDot
                  status={mfaEnabled ? "ok" : "warn"}
                  size="md"
                  pulse={mfaEnabled}
                />
              </CardTitle>
              <CardDescription className="text-text-muted mt-1">
                {mfaEnabled
                  ? "Your account is protected with two-factor authentication"
                  : "Add an extra layer of security to your account"}
              </CardDescription>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                mfaEnabled
                  ? "bg-status-ok/10 text-status-ok"
                  : "bg-status-warn/10 text-status-warn"
              }`}
            >
              {mfaEnabled ? "Enabled" : "Disabled"}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* MFA is disabled - show enable button or setup wizard */}
          {!mfaEnabled && setupStep === "idle" && (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Use an authenticator app like Google Authenticator, Authy, or
                1Password to generate time-based verification codes.
              </p>
              <Button
                variant="signal"
                onClick={handleStartSetup}
                disabled={setupLoading}
              >
                {setupLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 mr-2" />
                )}
                Enable MFA
              </Button>
            </div>
          )}

          {/* Step 1: QR Code */}
          {setupStep === "qr" && setupData && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <QrCode className="w-4 h-4" />
                Step 1 of 3 — Scan QR code
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={setupData.qrCodeDataUrl}
                    alt="MFA QR Code"
                    width={200}
                    height={200}
                  />
                </div>
                <p className="text-sm text-text-secondary text-center max-w-sm">
                  Scan this QR code with your authenticator app. If you
                  can&apos;t scan it, enter the secret key manually.
                </p>

                {/* Manual entry secret */}
                <div className="w-full">
                  <p className="text-xs text-text-muted mb-1.5">
                    Manual entry key:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm font-mono text-text-primary select-all break-all">
                      {setupData.secret}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopySecret}
                      className="shrink-0 border-border-subtle text-text-secondary hover:text-text-primary"
                    >
                      {copiedSecret ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <Button
                  variant="outline"
                  onClick={handleCancelSetup}
                  className="border-border-subtle text-text-secondary hover:text-text-primary"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  variant="signal"
                  onClick={() => setSetupStep("verify")}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Verify TOTP */}
          {setupStep === "verify" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <KeyRound className="w-4 h-4" />
                Step 2 of 3 — Verify code
              </div>

              <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                  Enter the 6-digit code from your authenticator app to verify
                  the setup.
                </p>

                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={verifyCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setVerifyCode(val);
                    setVerifyError("");
                  }}
                  placeholder="000000"
                  className={`bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0 text-center font-mono text-xl tracking-[0.3em] h-12 ${
                    verifyError ? "border-status-danger" : ""
                  }`}
                  autoFocus
                />
                {verifyError && (
                  <p className="text-xs text-status-danger text-center">
                    {verifyError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <Button
                  variant="outline"
                  onClick={() => setSetupStep("qr")}
                  className="border-border-subtle text-text-secondary hover:text-text-primary"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  variant="signal"
                  onClick={handleVerify}
                  disabled={verifyLoading || verifyCode.length !== 6}
                >
                  {verifyLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Verify
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Backup codes */}
          {setupStep === "backup" && setupData && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <KeyRound className="w-4 h-4" />
                Step 3 of 3 — Save backup codes
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-status-warn/5 border border-status-warn/20">
                  <AlertTriangle className="w-5 h-5 text-status-warn shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary">
                    Save these backup codes in a secure location. Each code can
                    only be used once. If you lose access to your authenticator
                    app, you can use a backup code to sign in.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {setupData.backupCodes.map((code, i) => (
                    <div
                      key={i}
                      className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 font-mono text-sm text-text-primary text-center select-all"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={handleCopyBackupCodes}
                  className="w-full border-border-subtle text-text-secondary hover:text-text-primary"
                >
                  {copiedBackup ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copiedBackup ? "Copied!" : "Copy All Codes"}
                </Button>
              </div>

              <div className="pt-4 border-t border-border-subtle space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={backupConfirmed}
                    onChange={(e) => setBackupConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded border-border-subtle text-signal focus:ring-gs-900/10 bg-bg-elevated"
                  />
                  <span className="text-sm text-text-secondary">
                    I have saved my backup codes in a secure location
                  </span>
                </label>

                <Button
                  variant="signal"
                  onClick={handleBackupConfirmed}
                  disabled={!backupConfirmed}
                  className="w-full"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Complete Setup
                </Button>
              </div>
            </div>
          )}

          {/* Done state */}
          {setupStep === "done" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 rounded-full bg-status-ok/10 flex items-center justify-center">
                <Check className="w-6 h-6 text-status-ok" />
              </div>
              <p className="text-text-primary font-medium">
                MFA enabled successfully
              </p>
            </div>
          )}

          {/* MFA is enabled - show status and disable option */}
          {mfaEnabled && setupStep === "idle" && (
            <div className="space-y-5">
              {/* Backup codes status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-bg-elevated">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-4 h-4 text-text-muted" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Backup codes
                    </p>
                    <p className="text-xs text-text-muted">
                      {backupCodesRemaining} of 8 remaining
                    </p>
                  </div>
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    backupCodesRemaining > 2
                      ? "bg-status-ok/10 text-status-ok"
                      : backupCodesRemaining > 0
                      ? "bg-status-warn/10 text-status-warn"
                      : "bg-status-danger/10 text-status-danger"
                  }`}
                >
                  {backupCodesRemaining > 2
                    ? "Good"
                    : backupCodesRemaining > 0
                    ? "Low"
                    : "None"}
                </div>
              </div>

              {/* Disable MFA */}
              {!showDisable ? (
                <div className="pt-4 border-t border-border-subtle">
                  <Button
                    variant="outline"
                    onClick={() => setShowDisable(true)}
                    className="border-status-danger/30 text-status-danger hover:bg-status-danger/5 hover:text-status-danger"
                  >
                    <ShieldOff className="w-4 h-4 mr-2" />
                    Disable MFA
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t border-border-subtle space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-status-danger/5 border border-status-danger/20">
                    <AlertTriangle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
                    <p className="text-sm text-text-secondary">
                      Disabling MFA will reduce your account security. Enter
                      your authenticator code to confirm.
                    </p>
                  </div>

                  <Input
                    type="text"
                    inputMode="numeric"
                    value={disableCode}
                    onChange={(e) =>
                      setDisableCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    placeholder="000000"
                    className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0 text-center font-mono text-xl tracking-[0.3em] h-12"
                    autoFocus
                  />

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDisable(false);
                        setDisableCode("");
                      }}
                      className="border-border-subtle text-text-secondary hover:text-text-primary"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDisableMfa}
                      disabled={disableLoading || disableCode.length !== 6}
                      className="border-status-danger/30 text-status-danger hover:bg-status-danger/5"
                    >
                      {disableLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ShieldOff className="w-4 h-4 mr-2" />
                      )}
                      Confirm Disable
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
