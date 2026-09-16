"use client";

import { SectionHeading } from "@/components/shared/SectionHeading";
import { useScrollReveal } from "@/hooks/useGsapAnimations";
import { WaitlistForm } from "./WaitlistForm";
import { Compass, MessageSquare, Tag, Unlock } from "lucide-react";

const PERKS = [
  {
    icon: Tag,
    title: "Founding price, locked",
    body: "Whatever tier you land on during the beta stays at that price for as long as you keep the account. Public pricing will be higher than this.",
  },
  {
    icon: Unlock,
    title: "The whole product, no tiers",
    body: "Every feature unlocked while the beta runs, including the AI layer, Change Intelligence and session replay, on every project you create.",
  },
  {
    icon: MessageSquare,
    title: "A direct line",
    body: "A private channel to the person building this. Bug reports skip the queue, and you get an answer rather than a ticket number.",
  },
  {
    icon: Compass,
    title: "A say in the order",
    body: "You see the roadmap before it is public and you vote on what gets built next. Charter feedback outranks the backlog.",
  },
];

export function CharterOffer() {
  const containerRef = useScrollReveal({ stagger: 0.09 });

  return (
    <section
      id="charter"
      ref={containerRef}
      className="border-t border-border-faint py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <SectionHeading
          eyebrow="Early access"
          headline="What you get"
          headlineAccent="for being early."
          sub="The first accounts through the door are charter members. This is not a launch discount that expires. It is a standing arrangement for the people who show up before it is obvious."
        />

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid gap-4 sm:grid-cols-2">
            {PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <div
                  key={perk.title}
                  data-reveal
                  className="rounded-xl border border-border-subtle bg-bg-surface/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-signal/30"
                >
                  <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-signal/10 text-signal">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="font-display text-base font-bold text-text-primary">
                    {perk.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {perk.body}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Signup panel with the animated conic border */}
          <div
            data-reveal
            className="relative mt-6 overflow-hidden rounded-2xl p-px"
          >
            <span
              aria-hidden="true"
              className="animate-border-sweep absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, var(--signal) 40deg, transparent 90deg, transparent 360deg)",
                opacity: 0.35,
              }}
            />
            <div className="relative rounded-2xl border border-border-subtle bg-bg-surface/80 p-8 backdrop-blur-md sm:p-10">
              <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
                <div>
                  <h3 className="font-display text-xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-2xl">
                    And when the beta ends, the free tier stays free.
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    Not a trial that lapses into a paywall. A real free tier with
                    a monthly log allowance, live projects and alerts, meant for
                    the side project that may never make money. Paid tiers start
                    at nine dollars a month when you outgrow it.
                  </p>
                </div>

                <div>
                  <WaitlistForm cta="Claim a charter spot" />
                  <p className="mt-3 text-xs text-text-muted">
                    Invites go out in batches, in waitlist order, as capacity
                    allows. No card, no call, no demo to sit through.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
