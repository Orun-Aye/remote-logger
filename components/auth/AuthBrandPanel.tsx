"use client";

import { HeroCanvas } from "@/components/landing/HeroCanvas";
import Link from "next/link";

export function AuthBrandPanel() {
  return (
    <div className="relative w-full h-full bg-bg-void overflow-hidden flex flex-col">
      {/* Dot grid background */}
      <div className="absolute inset-0 bg-dot-grid opacity-60" />

      {/* Radial signal glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-signal/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Constellation canvas */}
      <div className="absolute inset-0">
        <HeroCanvas />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2">
          <svg
            viewBox="0 0 28 20"
            fill="none"
            className="w-7 h-5"
            aria-hidden="true"
          >
            <path
              d="M2 18L8 4L14 14L20 6L26 18"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-signal"
            />
          </svg>
          <span className="text-xl font-display font-bold text-text-primary tracking-tight">
            Apperio
          </span>
        </Link>

        {/* Center content */}
        <div className="flex-1 flex flex-col justify-center max-w-md">
          <h2 className="text-3xl xl:text-4xl font-display font-bold text-text-primary leading-tight mb-4">
            Observe everything.
            <br />
            <span className="gradient-text-signal">Miss nothing.</span>
          </h2>
          <p className="text-text-secondary text-base leading-relaxed">
            Real-time error tracking, performance monitoring, and AI-powered
            insights for your production applications.
          </p>
        </div>

        {/* Bottom */}
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="w-1.5 h-1.5 bg-signal rounded-full animate-pulse" />
          Now open to everyone
        </div>
      </div>
    </div>
  );
}
