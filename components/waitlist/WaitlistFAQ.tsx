"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { useScrollReveal } from "@/hooks/useGsapAnimations";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "Is this only for JavaScript apps?",
    a: "The SDK is TypeScript and runs in browsers and in Node today, with no HTTP client dependency. Underneath it is a plain HTTPS endpoint, so anything that can POST JSON can send logs to a project right now. First-party SDKs for other languages come after launch.",
  },
  {
    q: "Do I have to connect GitHub?",
    a: "No. Apperio is a complete error, performance and session monitor without it. Connecting a repo is what adds the change side of the story: commit summaries, deploy markers, suspect commits and drafted issues. You can add it later, and your recent history gets backfilled when you do.",
  },
  {
    q: "What happens to my users' data?",
    a: "The SDK redacts personal data before anything leaves the browser: emails, credit cards, national insurance and social security numbers, API keys, JWTs and more, across ten-plus built-in patterns, with an audit trail of what was redacted and why. You can add your own rules or pick a stricter preset. Session replay masks every text input and password by default and stays off until you turn it on per project.",
  },
  {
    q: "How much will it cost me?",
    a: "There is a free tier and it is not a trial. Paid tiers start at nine dollars a month and scale on log volume rather than seats, so adding a teammate never costs more. Charter members keep whatever price they joined on.",
  },
  {
    q: "I already pay for something else. Why switch?",
    a: "Do not switch yet. Apperio installs in one line and does not conflict with anything else on the page, so run both for a fortnight on the same app and compare what each one told you the next time something broke. If the answer is the same, keep what you have.",
  },
  {
    q: "Will this slow my app down?",
    a: "The SDK batches log submissions rather than sending one request per event, with a configurable batch size and flush interval, exponential backoff with jitter on retry, and a bounded in-memory buffer so a network outage cannot grow without limit. It ships as both CommonJS and ESM with no runtime HTTP dependency.",
  },
  {
    q: "What does the AI actually see?",
    a: "Commit diffs for summarisation, with lockfiles and generated files filtered out and large diffs truncated, plus the error group being explained. Summaries are cached per commit SHA so the same diff is never sent twice, and there is a spend cap per project. If the AI layer is unavailable, everything else keeps working and the summary simply says so.",
  },
  {
    q: "When do I actually get in?",
    a: "Invites go out in batches in waitlist order as capacity allows. You get an email with a code that unlocks signup. Sharing your invite link moves you up the queue when someone joins through it.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      data-reveal
      className={cn(
        "rounded-xl border bg-bg-surface/40 backdrop-blur-sm transition-colors duration-300",
        open ? "border-signal/30" : "border-border-subtle hover:border-border-accent"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <span className="font-display text-sm font-bold text-text-primary sm:text-base">
          {q}
        </span>
        <Plus
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-300",
            open ? "rotate-45 text-signal" : "text-text-muted"
          )}
        />
      </button>

      {/* Grid-row trick animates to the content's natural height without JS */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-relaxed text-text-secondary">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function WaitlistFAQ() {
  const containerRef = useScrollReveal({ stagger: 0.05 });

  return (
    <section
      id="faq"
      ref={containerRef}
      className="border-t border-border-faint py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <SectionHeading
          eyebrow="Before you ask"
          headline="The questions"
          headlineAccent="everyone asks."
        />

        <div className="mx-auto mt-14 max-w-3xl space-y-3">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} {...faq} />
          ))}
        </div>

        <p
          data-reveal
          className="mt-10 text-center text-sm text-text-muted"
        >
          Something else on your mind?{" "}
          <a
            href="mailto:femi@apperio.dev"
            className="font-medium text-signal transition-colors hover:text-signal-bright"
          >
            femi@apperio.dev
          </a>{" "}
          reaches a person, not a form.
        </p>
      </div>
    </section>
  );
}
