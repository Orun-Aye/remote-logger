"use client";

import { LandingHeading } from "@/components/landing/primitives";
import { useScrollReveal } from "@/hooks/useGsapAnimations";

const AUDIENCES = [
  {
    title: "Solo developers",
    body: "You are the entire on-call rotation. Apperio tells you what broke and which of your own commits did it, so your evening is a one-line fix and not a three-hour bisect.",
    tag: "Zero-config error notifications",
  },
  {
    title: "Builders working with AI",
    body: "You shipped code you did not write line by line. A plain-English summary of every commit means you always know what actually changed in your app, whoever or whatever typed it.",
    tag: "Every commit, explained",
  },
  {
    title: "Small product teams",
    body: "Errors grouped by cause, the project owner notified automatically, and the issue drafted in your repo with full context. Triage stops being a meeting.",
    tag: "Issues drafted, status synced",
  },
  {
    title: "Agencies and freelancers",
    body: "A project per client, an API key each, one account. Add a client to their own project as a viewer, and answer what broke before they ask.",
    tag: "Per-project isolation",
  },
  {
    title: "Founders and product people",
    body: "Know whether the thing you just shipped made it better or worse without asking an engineer to dig. An hour after every deploy you get a verdict in plain words, with the baseline measured for you.",
    tag: "Deploy impact verdicts",
  },
  {
    title: "Checkout and payment flows",
    body: "An abandoned session with an error attached is revenue walking out. Watch a recording of a session that hit the error, find where it died, ship the fix before the day ends.",
    tag: "Session replay from an error, beta",
  },
];

export function UseCases() {
  const containerRef = useScrollReveal({ stagger: 0.06 });

  return (
    <section
      id="who-its-for"
      ref={containerRef}
      className="border-t border-border-subtle py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <LandingHeading
          eyebrow="Who it is for"
          headline="One snippet."
          headlineAccent="Anyone with something live."
          sub="Apperio does not assume you have an engineering team. It assumes you have an app or website people use, and not enough hours in the day."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div
              key={a.title}
              data-reveal
              className="flex flex-col rounded-[14px] border border-border-subtle bg-bg-surface p-5 sm:p-6"
            >
              <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-text-primary">
                {a.title}
              </h3>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-text-secondary">
                {a.body}
              </p>
              <p className="mt-5 border-t border-border-subtle pt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted">
                {a.tag}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
