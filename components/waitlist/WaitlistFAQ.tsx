"use client";

import { useState } from "react";
import { LandingHeading } from "@/components/landing/primitives";
import { useScrollReveal } from "@/hooks/useGsapAnimations";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "Do I need to be technical to use it?",
    a: "Not to use it. Apperio explains errors, slow pages and changes in plain English, so anyone on your team can read the dashboard. Setting it up does take code, once: someone adds a short snippet with your project's key to the site. If you did not build the site yourself, whoever did can add it. Connecting GitHub is optional.",
  },
  {
    q: "Is this only for JavaScript apps?",
    a: "The SDK is TypeScript and runs in browsers and in Node today, with no HTTP client dependency. Underneath it is a plain HTTPS endpoint, so anything that can POST JSON can send logs to a project right now. First-party SDKs for other languages come after launch.",
  },
  {
    q: "Do I have to connect GitHub?",
    a: "No. Apperio is a complete error, performance and session monitor without it. Connecting a repo is what adds the change side of the story: commit summaries, deploy markers, suspect commits and drafted issues. You can add it later, and your last 50 commits get backfilled when you do.",
  },
  {
    q: "What happens to my users' data?",
    a: "The SDK replaces personal data before anything leaves the browser, using eleven built-in patterns: emails, card numbers, phone numbers, social security numbers, passport and driving licence numbers, bank account numbers, IP addresses, API keys and JWTs. You can add your own rules or pick a stricter preset, and the SDK keeps an in-memory record of every replacement that your own code can read.",
  },
  {
    q: "Does it record my users' sessions?",
    a: "Only if you turn it on. Session replay is in beta: it is off by default, switched on per project with a sample rate you choose, masks every input in the browser by default, and keeps recordings for seven days.",
  },
  {
    q: "I already pay for something else. Why switch?",
    a: "Do not switch yet. Apperio installs with one snippet and does not conflict with anything else on the page, so run both for a fortnight on the same app and compare what each one told you the next time something broke. If the answer is the same, keep what you have.",
  },
  {
    q: "Will this slow my app down?",
    a: "The SDK batches log submissions rather than sending one request per event, with a configurable batch size and flush interval, exponential backoff with jitter on retry, and a bounded in-memory buffer so a network outage cannot grow without limit. Session replay's recorder only loads when replay is switched on.",
  },
  {
    q: "What does the AI actually see?",
    a: "Commit diffs for summaries, with lockfiles and generated files filtered out and large diffs truncated, plus the stack trace and details of an error group when it ranks suspects, drafts an issue or explains a root cause. Summaries are cached per commit SHA so the same diff is never sent twice, and each project has a monthly cap. If the AI layer is unavailable, everything else keeps working and the summary simply says so.",
  },
  {
    q: "When do I actually get in?",
    a: "Invites go out in batches in waitlist order as capacity allows. You get an email with a code that unlocks signup.",
  },
];

function FAQItem({ q, a, id }: { q: string; a: string; id: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div data-reveal className="border-b border-border-subtle">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={id}
          className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          <span className="font-display text-base font-semibold tracking-[-0.01em] text-text-primary sm:text-[17px]">
            {q}
          </span>
          <Plus
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 text-text-muted transition-transform duration-300",
              open && "rotate-45 text-text-primary"
            )}
          />
        </button>
      </h3>

      {/* Grid-row trick animates to the content's natural height without JS */}
      <div
        id={id}
        className={cn(
          "grid transition-all duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="max-w-[680px] pb-6 text-[15px] leading-relaxed text-text-secondary">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function WaitlistFAQ() {
  const containerRef = useScrollReveal({ stagger: 0.04 });

  return (
    <section
      id="faq"
      ref={containerRef}
      className="scroll-mt-16 border-t border-border-subtle py-24 sm:py-32"
    >
      <div className="mx-auto grid max-w-[1200px] gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div>
          <LandingHeading
            eyebrow="Before you ask"
            headline="The questions"
            headlineAccent="everyone asks."
          />
          <p data-reveal className="mt-6 text-sm text-text-muted">
            Something else on your mind?{" "}
            <a
              href="mailto:femi@apperio.dev"
              className="font-medium text-signal underline-offset-4 hover:underline"
            >
              femi@apperio.dev
            </a>{" "}
            reaches a person, not a form.
          </p>
        </div>

        <div className="border-t border-border-subtle">
          {FAQS.map((faq, i) => (
            <FAQItem key={faq.q} id={`faq-answer-${i}`} {...faq} />
          ))}
        </div>
      </div>
    </section>
  );
}
