"use client";

import { useRef, useCallback, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, EASE, DURATION } from "@/lib/gsap-config";

/**
 * Scroll reveal — fades elements in from below when they enter the viewport.
 * Attach the returned ref to the container element.
 * Children with `data-reveal` attribute will be animated.
 */
export function useScrollReveal(options?: {
  y?: number;
  stagger?: number;
  threshold?: number;
  duration?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    y = 32,
    stagger = 0.08,
    threshold = 0.15,
    duration = 0.6,
  } = options || {};

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const elements = containerRef.current.querySelectorAll("[data-reveal]");
      if (elements.length === 0) return;

      // prefersReducedMotion is hoisted from below; GSAP ignores the CSS query.
      if (prefersReducedMotion()) {
        gsap.set(elements, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(elements, { opacity: 0, y });

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: `top ${100 - threshold * 100}%`,
        once: true,
        onEnter: () => {
          gsap.to(elements, {
            opacity: 1,
            y: 0,
            duration,
            stagger,
            ease: EASE.smooth,
          });
        },
      });
    },
    { scope: containerRef, dependencies: [] }
  );

  return containerRef;
}

/**
 * Count-up animation — animates a number from 0 to target value.
 * Returns a ref to attach to the display element and a trigger function.
 */
export function useCountUp(options?: {
  duration?: number;
  separator?: string;
}) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const { duration = DURATION.scene, separator = "," } = options || {};

  const formatNumber = useCallback(
    (num: number) => {
      return Math.round(num)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    },
    [separator]
  );

  useGSAP(
    () => {
      if (!elementRef.current) return;

      const target = parseFloat(
        elementRef.current.dataset.target || "0"
      );
      if (isNaN(target)) return;

      ScrollTrigger.create({
        trigger: elementRef.current,
        start: "top 85%",
        once: true,
        onEnter: () => {
          if (hasAnimated.current) return;
          hasAnimated.current = true;

          const obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration,
            ease: EASE.out,
            onUpdate: () => {
              if (elementRef.current) {
                elementRef.current.textContent = formatNumber(obj.val);
              }
            },
          });
        },
      });
    },
    { scope: elementRef, dependencies: [] }
  );

  return elementRef;
}

/**
 * Hero load sequence — orchestrated GSAP timeline for hero section.
 * Returns a ref to attach to the hero container.
 */
export function useHeroSequence() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: EASE.out } });

      const canvas = containerRef.current.querySelector("[data-hero-canvas]");
      const badge = containerRef.current.querySelector("[data-hero-badge]");
      const headlines =
        containerRef.current.querySelectorAll("[data-hero-headline]");
      const sub = containerRef.current.querySelector("[data-hero-sub]");
      const ctas = containerRef.current.querySelector("[data-hero-ctas]");
      const trust = containerRef.current.querySelector("[data-hero-trust]");
      const preview = containerRef.current.querySelector(
        "[data-hero-preview]"
      );

      const all = [
        canvas,
        badge,
        ...Array.from(headlines),
        sub,
        ctas,
        trust,
        preview,
      ].filter(Boolean);

      // Reduced motion: land on the finished state rather than choreographing
      // toward it. GSAP does not honour the CSS media query on its own, so
      // without this the whole hero would still slide in.
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        gsap.set(all, { opacity: 1, y: 0 });
        if (canvas) gsap.set(canvas, { opacity: 0.6 });
        return;
      }

      // Set initial states
      gsap.set(all, { opacity: 0 });

      if (badge) gsap.set(badge, { y: 12 });
      if (headlines.length)
        gsap.set(headlines, { y: 16 });
      if (ctas) gsap.set(ctas, { y: 12 });
      if (preview) gsap.set(preview, { y: 40 });

      // Choreography: 0ms → 1100ms
      if (canvas) tl.to(canvas, { opacity: 0.6, duration: 0.8 }, 0);
      if (badge) tl.to(badge, { opacity: 1, y: 0, duration: 0.6 }, 0.2);

      headlines.forEach((el, i) => {
        tl.to(el, { opacity: 1, y: 0, duration: 0.8 }, 0.38 + i * 0.08);
      });

      if (sub) tl.to(sub, { opacity: 1, duration: 0.4 }, 0.7);
      if (ctas) tl.to(ctas, { opacity: 1, y: 0, duration: 0.4 }, 0.85);
      if (trust) tl.to(trust, { opacity: 1, duration: 0.3 }, 0.95);

      if (preview) {
        tl.to(
          preview,
          { opacity: 1, y: 0, duration: 0.7, ease: EASE.smooth },
          1.1
        );
      }
    },
    { scope: containerRef, dependencies: [] }
  );

  return containerRef;
}

/**
 * Stagger reveal — generic stagger for grids/lists.
 * Elements with `data-stagger` inside the container are animated.
 */
export function useStaggerReveal(options?: {
  stagger?: number;
  y?: number;
  duration?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { stagger = 0.08, y = 24, duration = 0.8 } = options || {};

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const items = containerRef.current.querySelectorAll("[data-stagger]");
      if (items.length === 0) return;

      if (prefersReducedMotion()) {
        gsap.set(items, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(items, { opacity: 0, y });

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(items, {
            opacity: 1,
            y: 0,
            duration,
            stagger,
            ease: EASE.smooth,
          });
        },
      });
    },
    { scope: containerRef, dependencies: [] }
  );

  return containerRef;
}

// ─── Waitlist / marketing page motion ────────────────────────────────────────

/**
 * True when the visitor has asked the OS to reduce motion. GSAP does not honour
 * the CSS media query on its own, so every hook below checks this and renders
 * the finished state instead of animating toward it.
 */
function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Count-up group — animates every `[data-count]` descendant from 0 to its
 * `data-count` value once the container scrolls into view.
 *
 * Per-element options, all read off data attributes:
 *   data-count="4800"        target value (required)
 *   data-count-decimals="1"  fixed decimal places (default 0)
 *   data-count-prefix="<"    text rendered before the number
 *   data-count-suffix="%"    text rendered after the number
 */
export function useCountUpGroup(options?: { duration?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { duration = 1.6 } = options || {};

  useGSAP(
    () => {
      const root = containerRef.current;
      if (!root) return;

      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>("[data-count]")
      );
      if (nodes.length === 0) return;

      const render = (el: HTMLElement, value: number) => {
        const decimals = Number(el.dataset.countDecimals ?? 0);
        const prefix = el.dataset.countPrefix ?? "";
        const suffix = el.dataset.countSuffix ?? "";
        const body = value
          .toFixed(decimals)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        el.textContent = `${prefix}${body}${suffix}`;
      };

      if (prefersReducedMotion()) {
        nodes.forEach((el) => render(el, Number(el.dataset.count ?? 0)));
        return;
      }

      nodes.forEach((el) => render(el, 0));

      ScrollTrigger.create({
        trigger: root,
        start: "top 85%",
        once: true,
        onEnter: () => {
          nodes.forEach((el, i) => {
            const target = Number(el.dataset.count ?? 0);
            if (Number.isNaN(target)) return;
            const counter = { val: 0 };
            gsap.to(counter, {
              val: target,
              duration,
              delay: i * 0.08,
              ease: EASE.out,
              onUpdate: () => render(el, counter.val),
            });
          });
        },
      });
    },
    { scope: containerRef, dependencies: [] }
  );

  return containerRef;
}

/**
 * Parallax drift — moves `[data-parallax]` elements against the scroll while the
 * container passes through the viewport. The attribute value is the strength
 * (`data-parallax="0.3"` travels 30% of the container height, negative inverts).
 */
export function useParallax() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = containerRef.current;
      if (!root || prefersReducedMotion()) return;

      const layers = root.querySelectorAll<HTMLElement>("[data-parallax]");
      layers.forEach((layer) => {
        const strength = Number(layer.dataset.parallax || 0.2);
        gsap.fromTo(
          layer,
          { yPercent: -strength * 50 },
          {
            yPercent: strength * 50,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    },
    { scope: containerRef, dependencies: [] }
  );

  return containerRef;
}

/**
 * Scrub sequence — the incident timeline. Draws `[data-scrub-line]` downward and
 * brings each `[data-scrub-step]` from dimmed to full as the reader scrolls
 * through the section, so the story advances at the pace they read it.
 */
export function useScrubSequence(options?: { dim?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { dim = 0.22 } = options || {};

  useGSAP(
    () => {
      const root = containerRef.current;
      if (!root) return;

      const line = root.querySelector<HTMLElement>("[data-scrub-line]");
      const steps = Array.from(
        root.querySelectorAll<HTMLElement>("[data-scrub-step]")
      );
      if (steps.length === 0) return;

      if (prefersReducedMotion()) {
        gsap.set(steps, { opacity: 1, x: 0 });
        if (line) gsap.set(line, { scaleY: 1 });
        return;
      }

      gsap.set(steps, { opacity: dim, x: 18 });
      if (line) gsap.set(line, { scaleY: 0, transformOrigin: "top center" });

      ScrollTrigger.create({
        trigger: root,
        start: "top 70%",
        end: "bottom 80%",
        scrub: 0.6,
        onUpdate: (self) => {
          if (line) gsap.set(line, { scaleY: self.progress });
          // Each step owns an equal slice of the scroll and lights up as the
          // playhead crosses into it.
          const playhead = self.progress * steps.length;
          steps.forEach((step, i) => {
            const local = gsap.utils.clamp(0, 1, playhead - i);
            gsap.set(step, {
              opacity: dim + (1 - dim) * local,
              x: 18 * (1 - local),
            });
          });
        },
      });
    },
    { scope: containerRef, dependencies: [] }
  );

  return containerRef;
}

/**
 * Pointer spotlight — writes `--spot-x` / `--spot-y` onto `[data-spotlight]`
 * cards so a CSS radial gradient can follow the cursor. Pure pointer maths, no
 * layout reads on move, and silent on touch devices.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const cards = Array.from(
      root.querySelectorAll<HTMLElement>("[data-spotlight]")
    );
    if (cards.length === 0) return;

    const cleanups = cards.map((card) => {
      const onMove = (e: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
        card.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
      };
      const onLeave = () => card.style.removeProperty("--spot-x");
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
      return () => {
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
      };
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return containerRef;
}
