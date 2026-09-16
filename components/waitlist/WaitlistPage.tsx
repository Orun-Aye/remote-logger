"use client";

import { useEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { SignalDot } from "@/components/shared/SignalDot";
import { TerminalBlock } from "@/components/shared/TerminalBlock";
import {
  useCountUpGroup,
  useHeroSequence,
  useScrollReveal,
  useSpotlight,
  useStaggerReveal,
} from "@/hooks/useGsapAnimations";
import { BuildLog } from "./BuildLog";
import { CharterOffer } from "./CharterOffer";
import { ComparisonTable } from "./ComparisonTable";
import { FeatureCard } from "./FeatureCard";
import { IncidentTimeline } from "./IncidentTimeline";
import { LiveLogStream } from "./LiveLogStream";
import { PillarsSection } from "./PillarsSection";
import { ProblemSection } from "./ProblemSection";
import { ScrollProgress } from "./ScrollProgress";
import { SetupSteps } from "./SetupSteps";
import { StackStrip } from "./StackStrip";
import { UseCases } from "./UseCases";
import { WaitlistFAQ } from "./WaitlistFAQ";
import { WaitlistForm, WaitlistSignupProvider } from "./WaitlistForm";
import {
  Activity,
  ArrowDown,
  Bell,
  Github,
  Mail,
  Rocket,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

// ─── Hero stat tiles ─────────────────────────────────────────────────────────

const HERO_STATS = [
  { value: 1, label: "line to install", prefix: "", suffix: "" },
  { value: 6, label: "signal types, no config", prefix: "", suffix: "" },
  { value: 5, label: "minutes to first insight", prefix: "<", suffix: "" },
  { value: 0, label: "dashboards to build", prefix: "", suffix: "" },
];

function HeroStats() {
  const ref = useCountUpGroup();

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 lg:gap-x-4"
    >
      {HERO_STATS.map((stat) => (
        <div key={stat.label}>
          <span
            data-count={stat.value}
            data-count-prefix={stat.prefix}
            data-count-suffix={stat.suffix}
            className="block font-display text-3xl font-extrabold tabular-nums text-signal sm:text-4xl"
          >
            {stat.prefix}
            {stat.value}
          </span>
          <span className="mt-1 block text-[11px] leading-tight text-text-muted">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── AI insight typing animation (feature bento) ─────────────────────────────

function AIInsightTyping() {
  const [text, setText] = useState("");
  const fullText =
    "TypeError spike in /checkout, 12x above baseline for the last 15 minutes. All of it on v2.4.1. The payment API started returning null for accounts with no saved profile. Add the null check at checkout.ts:142.";
  const indexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (indexRef.current < fullText.length) {
        setText(fullText.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        setTimeout(() => {
          indexRef.current = 0;
          setText("");
        }, 2600);
      }
    }, 22);
    return () => clearInterval(interval);
    // fullText is a module-level constant, so the effect runs once by design
  }, []);

  return (
    <div className="h-[104px] overflow-hidden rounded-lg border border-signal/20 bg-signal/5 p-3 font-mono text-[12px] leading-relaxed text-text-secondary sm:h-[92px]">
      <span className="font-semibold text-signal">AI insight: </span>
      {text}
      <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-signal" />
    </div>
  );
}

function MiniSparkline() {
  const bars = [35, 45, 30, 60, 80, 55, 70, 90, 65, 40, 75, 85];
  return (
    <div className="flex h-10 items-end gap-[3px]">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[6px] rounded-sm bg-signal/60 transition-all duration-500"
          style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

function RedactedText() {
  return (
    <div className="space-y-1 font-mono text-[12px]">
      <div>
        <span className="text-text-muted">email: </span>
        <span className="rounded bg-status-danger/20 px-1 text-status-danger line-through">
          john@example.com
        </span>
        <span className="ml-1 text-signal">&rarr; [EMAIL_REDACTED]</span>
      </div>
      <div>
        <span className="text-text-muted">card: </span>
        <span className="rounded bg-status-danger/20 px-1 text-status-danger line-through">
          4242-4242-4242-4242
        </span>
        <span className="ml-1 text-signal">&rarr; [CC_REDACTED]</span>
      </div>
      <div>
        <span className="text-text-muted">token: </span>
        <span className="rounded bg-status-danger/20 px-1 text-status-danger line-through">
          eyJhbGciOiJIUzI1...
        </span>
        <span className="ml-1 text-signal">&rarr; [JWT_REDACTED]</span>
      </div>
    </div>
  );
}

function MockGithubIssue() {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-void/80 p-3 text-[12px]">
      <div className="mb-2 flex items-center gap-2">
        <Github className="h-3.5 w-3.5 text-text-muted" />
        <span className="font-mono text-text-secondary">
          #142 <span className="text-status-danger">bug</span>
        </span>
        <span className="ml-auto rounded bg-signal/10 px-1.5 py-0.5 font-mono text-[9px] text-signal">
          apperio[bot]
        </span>
      </div>
      <p className="text-[11px] font-semibold text-text-primary">
        Checkout fails for accounts with no email set
      </p>
      <p className="mt-1 text-[10px] text-text-muted">
        Stack, breadcrumbs, 14 affected users and the suspect commit, attached
        automatically. Close it here and the error resolves in Apperio.
      </p>
    </div>
  );
}

function DeployVerdict() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg border border-signal/25 bg-signal/5 p-2.5">
        <span className="font-mono text-[11px] text-text-secondary">
          v2.4.2
        </span>
        <span className="font-mono text-[11px] font-semibold text-signal">
          Better &middot; errors -100%
        </span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-status-danger/25 bg-status-danger/5 p-2.5">
        <span className="font-mono text-[11px] text-text-secondary">
          v2.4.1
        </span>
        <span className="font-mono text-[11px] font-semibold text-status-danger">
          Worse &middot; new error group
        </span>
      </div>
    </div>
  );
}

function DigestPreview() {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-void/80 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Mail className="h-3.5 w-3.5 text-text-muted" />
        <span className="font-mono text-[10px] text-text-muted">
          Monday, 9:00
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-text-secondary">
        You shipped 11 commits across 3 deploys. Errors fell 47%. Your slowest
        page is /settings at 2.4s, and it got worse on Thursday.
      </p>
    </div>
  );
}

// ─── Feature bento ───────────────────────────────────────────────────────────

function FeatureBento() {
  const featuresRef = useStaggerReveal({ stagger: 0.09 });
  const spotlightRef = useSpotlight();

  return (
    <section
      id="features"
      className="border-t border-border-faint py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <SectionHeading
          eyebrow="Everything else"
          headline="The rest of what you would"
          headlineAccent="have had to build yourself."
          sub="One SDK, one dashboard, one source of truth. Nothing here is an add-on tier or a second product."
        />

        <div ref={spotlightRef} className="mt-16">
          <div
            ref={featuresRef}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <FeatureCard
              pain="Logs are noise without context"
              title="AI-powered insights"
              description="Anomaly surfacing, root cause explanation and fix suggestions, written against your actual stack trace rather than a generic pattern library."
              icon={<Sparkles className="h-4 w-4" />}
              visual={<AIInsightTyping />}
              span={2}
            />

            <FeatureCard
              pain="Copy-pasting stack traces into issues"
              title="Issues drafted for you"
              description="One click turns an error group into a GitHub issue with everything attached. Close it there and Apperio marks the error resolved here."
              icon={<Github className="h-4 w-4" />}
              visual={<MockGithubIssue />}
            />

            <FeatureCard
              pain="Users leave before they complain"
              title="Performance monitoring"
              description="Web Vitals, network timing and interaction latency, captured on every real session rather than a synthetic run from a data centre."
              icon={<Activity className="h-4 w-4" />}
              visual={
                <div className="flex items-center gap-4">
                  <MiniSparkline />
                  <div className="font-mono text-[11px]">
                    <div className="text-signal">LCP 1.2s</div>
                    <div className="text-status-warn">INP 210ms</div>
                    <div className="text-text-muted">CLS 0.03</div>
                  </div>
                </div>
              }
              span={2}
            />

            <FeatureCard
              pain="Manual logging is always incomplete"
              title="Auto-instrumentation"
              description="Errors, network requests, clicks, page views, console output and Web Vitals, captured from the moment you initialise. No wrapping, no decorators."
              icon={<Zap className="h-4 w-4" />}
              visual={
                <div className="rounded-lg bg-bg-void/80 p-3 font-mono text-[12px] text-text-secondary">
                  <span className="text-signal">new</span>{" "}
                  <span className="text-data">Apperio</span>
                  {"({ apiKey })"}
                  <div className="mt-1 text-text-muted">
                    {"// that is the entire setup"}
                  </div>
                </div>
              }
            />

            <FeatureCard
              pain="Accidentally logging your users"
              title="PII stripped at the source"
              description="Ten-plus detection patterns for emails, cards, national ID numbers, API keys and JWTs, redacted in the browser with an audit trail of every substitution."
              icon={<Shield className="h-4 w-4" />}
              visual={<RedactedText />}
            />

            <FeatureCard
              pain="Finding out on social media"
              title="Alerts that reach you"
              description="Slack, Discord, Teams, Linear, Jira, PagerDuty, email or a raw webhook. Thresholds and anomalies when you want them, sensible defaults when you do not."
              icon={<Bell className="h-4 w-4" />}
              visual={
                <div className="rounded-lg border border-border-subtle bg-bg-void/80 p-3 text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#4A154B] text-[8px] font-bold text-white">
                      S
                    </span>
                    <span className="font-mono text-text-muted">
                      #eng-alerts
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-text-secondary">
                    <span className="font-semibold text-status-danger">
                      Error spike
                    </span>{" "}
                    in /api/checkout &mdash; 23 in 5 min, baseline 2
                  </p>
                </div>
              }
            />

            <FeatureCard
              pain="Did that deploy help or hurt?"
              title="Release health"
              description="Every deploy gets a baseline and a verdict. Better, worse, or no change, measured against the release before it rather than left to your memory."
              icon={<Rocket className="h-4 w-4" />}
              visual={<DeployVerdict />}
            />

            <FeatureCard
              pain="Nobody opens the dashboard"
              title="A digest that reads like a person"
              description="Weekly or daily, in plain English: what you shipped, what it did to your users, and the one thing worth looking at next."
              icon={<Mail className="h-4 w-4" />}
              visual={<DigestPreview />}
              status="next"
              span={2}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Closing CTA ─────────────────────────────────────────────────────────────

function ClosingCTA() {
  const closingRef = useScrollReveal();

  return (
    <section
      ref={closingRef}
      className="relative overflow-hidden border-t border-border-faint py-28 sm:py-36"
    >
      <div className="mx-auto max-w-[1280px] px-4 text-center sm:px-6">
        <div className="mb-6 flex items-center justify-center gap-2" data-reveal>
          <SignalDot status="ok" size="sm" />
          <span className="text-sm text-text-muted">
            Private beta &middot; invites in waitlist order
          </span>
        </div>

        <h2
          className="mb-6 font-display font-extrabold leading-[1.1] tracking-tight text-text-primary"
          style={{ fontSize: "clamp(28px, 4.8vw, 60px)" }}
          data-reveal
        >
          Stop finding out last.
        </h2>

        <p
          className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-text-secondary"
          data-reveal
        >
          Every hour an error runs unseen is a person who tried your product once
          and decided it was broken. They will not email you. They will just not
          come back.
        </p>

        <div className="mb-10 flex justify-center" data-reveal>
          <WaitlistForm align="center" cta="Join the waitlist" />
        </div>

        <div className="mx-auto mb-8 max-w-[480px]" data-reveal>
          <TerminalBlock code="npm install apperio" showCopy />
        </div>

        <p className="text-xs text-text-muted" data-reveal>
          Free tier forever &middot; No credit card &middot; Charter pricing
          locked &middot; One-click unsubscribe
        </p>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function WaitlistPage() {
  const heroRef = useHeroSequence();

  return (
    <WaitlistSignupProvider>
      <ScrollProgress />

      {/* ═══ HERO ═══ */}
      <section
        id="waitlist"
        ref={heroRef}
        className="relative overflow-hidden pt-16"
      >
        <div className="relative z-10 mx-auto max-w-[1280px] px-4 pb-20 pt-20 sm:px-6 md:pt-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            {/* Left column */}
            <div className="w-full">
              <div className="mb-8" data-hero-badge>
                <div className="inline-flex items-center gap-2.5 rounded-full border border-signal bg-signal-muted px-4 py-1.5">
                  <SignalDot status="ok" size="sm" />
                  <span className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-signal">
                    Private beta &mdash; charter access open
                  </span>
                </div>
              </div>

              <h1
                className="mb-6 text-balance font-display font-extrabold leading-[1.06] tracking-[-0.03em]"
                style={{ fontSize: "clamp(20px, 5.2vw, 40px)" }}
              >
                <span data-hero-headline className="block">
                  Your code shipped at 14:02.
                </span>
                <span data-hero-headline className="block">
                  It broke at{" "}
                  <span className="animate-text-glitch text-status-danger">
                    14:11
                  </span>
                  .
                </span>
                <span data-hero-headline className="block text-signal">
                  Apperio already knows why.
                </span>
              </h1>

              <p
                className="mb-9 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base md:text-lg"
                data-hero-sub
              >
                Apperio watches every error, every deploy and every commit in
                between, then tells you in plain English which change caused the
                break and what to do about it. One npm install. Nothing to
                configure.
              </p>

              <div data-hero-ctas className="mb-5">
                <WaitlistForm />
              </div>

              <div
                className="mb-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-muted"
                data-hero-trust
              >
                <span>No spam, ever.</span>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-1.5 font-medium text-text-secondary transition-colors hover:text-signal"
                >
                  See it work end to end
                  <ArrowDown className="h-3 w-3" />
                </a>
                <span className="hidden sm:inline">
                  Have an invite code?{" "}
                  <a
                    href="/signup"
                    className="font-medium text-signal transition-colors hover:text-signal-bright"
                  >
                    Sign up
                  </a>
                </span>
              </div>

              <div
                className="border-t border-border-faint pt-8"
                data-hero-trust
              >
                <HeroStats />
              </div>
            </div>

            {/* Right column */}
            <div data-hero-preview className="mt-4 lg:mt-0">
              <LiveLogStream />
            </div>
          </div>
        </div>
      </section>

      <StackStrip />
      <ProblemSection />
      <PillarsSection />
      <IncidentTimeline />
      <SetupSteps />
      <FeatureBento />
      <UseCases />
      <ComparisonTable />
      <BuildLog />
      <CharterOffer />
      <WaitlistFAQ />
      <ClosingCTA />
    </WaitlistSignupProvider>
  );
}
