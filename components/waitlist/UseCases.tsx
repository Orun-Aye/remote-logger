"use client";

import { SectionHeading } from "@/components/shared/SectionHeading";
import { useScrollReveal, useSpotlight } from "@/hooks/useGsapAnimations";
import {
  Boxes,
  Building2,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";

const AUDIENCES = [
  {
    icon: User,
    title: "Solo developers",
    body: "You are the entire on-call rotation. Apperio tells you what broke and which of your own commits did it, so your evening is a one-line fix and not a three-hour bisect.",
    tag: "Zero-config error notifications",
  },
  {
    icon: Sparkles,
    title: "Builders working with AI",
    body: "You shipped code you did not write line by line. A plain-English summary of every commit means you always know what actually changed in your app, whoever or whatever typed it.",
    tag: "Every commit, explained",
  },
  {
    icon: Boxes,
    title: "Small product teams",
    body: "Errors grouped by cause, the right owner notified automatically, and the issue drafted in your repo with full context. Triage stops being a meeting.",
    tag: "Issues drafted, status synced",
  },
  {
    icon: Building2,
    title: "Agencies and freelancers",
    body: "A project per client, an API key each, one account. Send the weekly digest instead of writing the status update, and answer what broke before the client asks.",
    tag: "Per-project isolation",
  },
  {
    icon: TrendingUp,
    title: "SaaS finding its footing",
    body: "Release health on every deploy, so you know within minutes whether the thing you just shipped made it better or worse, with the baseline measured for you.",
    tag: "Deploy impact verdicts",
  },
  {
    icon: ShoppingCart,
    title: "Checkout and payment flows",
    body: "An abandoned session with an error attached is revenue walking out. Replay the exact session, find the frame it died on, ship the fix before the day ends.",
    tag: "Session replay from an error",
  },
];

export function UseCases() {
  const containerRef = useScrollReveal({ stagger: 0.07 });
  const spotlightRef = useSpotlight();

  return (
    <section
      id="who-its-for"
      ref={containerRef}
      className="border-t border-border-faint py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <SectionHeading
          eyebrow="Who it is for"
          headline="One SDK."
          headlineAccent="Every kind of builder."
          sub="Apperio does not assume you have a platform team. It assumes you have something in production and not enough hours in the day."
        />

        <div
          ref={spotlightRef}
          className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {AUDIENCES.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.title}
                data-reveal
                data-spotlight
                className="spotlight-card group flex flex-col rounded-xl border border-border-subtle bg-bg-surface/40 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-signal/30"
              >
                <div className="relative z-10 flex flex-1 flex-col">
                  <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-signal/10 text-signal">
                    <Icon className="h-4 w-4" />
                  </span>

                  <h3 className="font-display text-base font-bold text-text-primary">
                    {a.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
                    {a.body}
                  </p>

                  <p className="mt-4 border-t border-border-faint pt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-signal">
                    {a.tag}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
