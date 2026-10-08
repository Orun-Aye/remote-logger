"use client";

import { LandingHeading } from "@/components/landing/primitives";
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
  const containerRef = useScrollReveal({ stagger: 0.08 });

  return (
    <section
      id="charter"
      ref={containerRef}
      className="scroll-mt-16 border-t border-border-subtle py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <LandingHeading
          eyebrow="Early access"
          headline="What you get"
          headlineAccent="for being early."
          sub="The first accounts through the door are charter members. This is not a launch discount that expires. It is a standing arrangement for the people who show up before it is obvious."
        />

        <div className="mt-14 max-w-[960px]">
          <div className="grid gap-4 sm:grid-cols-2">
            {PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <div
                  key={perk.title}
                  data-reveal
                  className="rounded-[14px] border border-border-subtle bg-bg-surface p-5 sm:p-6"
                >
                  <Icon className="mb-4 h-4 w-4 text-text-muted" aria-hidden="true" />
                  <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-text-primary">
                    {perk.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
                    {perk.body}
                  </p>
                </div>
              );
            })}
          </div>

          <div
            data-reveal
            className="mt-4 rounded-[14px] border border-border-accent bg-bg-elevated p-6 sm:p-8"
          >
            <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <h3 className="font-display text-xl font-semibold leading-tight tracking-[-0.02em] text-text-primary sm:text-2xl">
                  And when the beta ends, the free tier stays free.
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
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
    </section>
  );
}
