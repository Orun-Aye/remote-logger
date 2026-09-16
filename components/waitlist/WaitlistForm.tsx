"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, CircleAlert, Copy, PartyPopper } from "lucide-react";

// ─── Shared signup state ─────────────────────────────────────────────────────
// Several forms appear down the page (hero, charter panel, closing CTA). They
// all read one piece of state so signing up in the hero updates every one.

interface SignupState {
  loading: boolean;
  submitted: boolean;
  position: number | null;
  referralCode: string | null;
  error: string | null;
  submit: (email: string) => Promise<void>;
}

const SignupContext = createContext<SignupState | null>(null);

export function WaitlistSignupProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Something went wrong. Please try again.");
        return;
      }

      setPosition(typeof data.position === "number" ? data.position : null);
      setReferralCode(data.referralCode ?? null);
      setSubmitted(true);
    } catch {
      setError("Could not reach the server. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ loading, submitted, position, referralCode, error, submit }),
    [loading, submitted, position, referralCode, error, submit]
  );

  return (
    <SignupContext.Provider value={value}>{children}</SignupContext.Provider>
  );
}

export function useWaitlistSignup() {
  const ctx = useContext(SignupContext);
  if (!ctx) {
    throw new Error("useWaitlistSignup must be used inside WaitlistSignupProvider");
  }
  return ctx;
}

// ─── Referral share row (success state) ──────────────────────────────────────

function ReferralRow({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const link = `https://www.apperio.dev/?ref=${code}`;

  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="group flex items-center gap-2 w-full max-w-md rounded-lg border border-border-subtle bg-bg-void/60 px-3 py-2.5 text-left transition-colors duration-150 hover:border-signal/40"
    >
      <span className="flex-1 truncate font-mono text-[11px] text-text-muted">
        {link}
      </span>
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-signal shrink-0" />
          <span className="text-[11px] font-semibold text-signal shrink-0">
            Copied
          </span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-text-muted shrink-0 group-hover:text-text-secondary" />
          <span className="text-[11px] text-text-muted shrink-0 group-hover:text-text-secondary">
            Copy invite link
          </span>
        </>
      )}
    </button>
  );
}

// ─── Form ────────────────────────────────────────────────────────────────────

interface WaitlistFormProps {
  /** Centres the form and its helper text, for the closing CTA. */
  align?: "left" | "center";
  /** Button label. The closing CTA asks for something more final. */
  cta?: string;
  className?: string;
}

export function WaitlistForm({
  align = "left",
  cta = "Request early access",
  className,
}: WaitlistFormProps) {
  const { loading, submitted, position, referralCode, error, submit } =
    useWaitlistSignup();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && !loading) submit(email.trim());
  };

  if (submitted) {
    return (
      <div
        className={cn(
          "animate-fade-in space-y-3",
          align === "center" && "flex flex-col items-center",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-signal/10 text-signal shrink-0">
            <PartyPopper className="w-4 h-4" />
          </span>
          <p className="font-display font-bold text-text-primary">
            {position ? (
              <>
                You&apos;re #{position} in line.{" "}
                <span className="font-body font-normal text-text-secondary">
                  Your invite lands by email.
                </span>
              </>
            ) : (
              <>
                You&apos;re on the list.{" "}
                <span className="font-body font-normal text-text-secondary">
                  Your invite lands by email.
                </span>
              </>
            )}
          </p>
        </div>
        {referralCode && (
          <>
            <ReferralRow code={referralCode} />
            <p
              className={cn(
                "text-xs text-text-muted max-w-md",
                align === "center" && "text-center"
              )}
            >
              Every builder who joins through your link moves you up the queue.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn(align === "center" && "flex flex-col items-center", className)}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
        noValidate
      >
        <label htmlFor={`waitlist-email-${align}`} className="sr-only">
          Work email
        </label>
        <Input
          id={`waitlist-email-${align}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-invalid={!!error}
          aria-describedby={error ? `waitlist-error-${align}` : undefined}
          className="h-11 bg-bg-void/80 border-border-subtle text-text-primary placeholder:text-text-muted"
        />
        <Button
          type="submit"
          variant="signal"
          size="lg"
          disabled={loading}
          className="font-display font-bold text-sm px-6 h-11 shrink-0"
        >
          {loading ? "Joining..." : cta}
          {!loading && <ArrowRight className="ml-1 w-4 h-4" />}
        </Button>
      </form>

      {error && (
        <p
          id={`waitlist-error-${align}`}
          role="alert"
          className="flex items-center gap-1.5 mt-2.5 text-xs text-status-danger animate-fade-in"
        >
          <CircleAlert className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
