"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { getImageProps } from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  EXPECTED_SHOTS,
  SHOW_PLACEHOLDERS,
  captureDate,
  getShot,
  naturalWidth,
  type ShotEntry,
  type ShotVariant,
} from "@/lib/screenshots";
import { landingFontClasses } from "./fonts";

interface ProductShotProps {
  /** Shot name from lib/screenshots/manifest.json, e.g. "suspect-commit". */
  name: string;
  /** "mobile" forces the @mobile crop. "desktop" (default) still swaps to the
   *  crop below 640px when one exists, so small screens never get a shrunken
   *  desktop capture with unreadable UI text. */
  variant?: ShotVariant;
  /** Hero only: loads eagerly at high priority. Everything else lazy loads. */
  priority?: boolean;
  /** Short label that leads the provenance caption. */
  caption?: string;
  className?: string;
}

const MOBILE_QUERY = "(max-width: 639px)";
const ZOOM_QUERY = "(min-width: 1024px) and (hover: hover)";

function useMediaQuery(query: string) {
  // False on the server and the first client render, so markup hydrates
  // identically; zoom switches on after mount.
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/**
 * One theme's capture as a <picture>. The theme that is not showing sits in a
 * display:none <picture>; lazy images there never load, so a visitor only
 * downloads the theme they see. The eager hero image is the exception and is
 * only ever the default dark theme.
 */
function ThemedPicture({
  desktop,
  mobile,
  eager,
  className,
}: {
  desktop: ShotEntry;
  mobile: ShotEntry | null;
  eager: boolean;
  className?: string;
}) {
  const cssWidth = naturalWidth(desktop);
  const { props: img } = getImageProps({
    src: desktop.src,
    alt: desktop.alt,
    width: desktop.width,
    height: desktop.height,
    quality: 90,
    sizes: `(min-width: ${cssWidth + 32}px) ${cssWidth}px, calc(100vw - 32px)`,
    loading: eager ? "eager" : "lazy",
    fetchPriority: eager ? "high" : "auto",
  });
  const source = mobile
    ? getImageProps({
        src: mobile.src,
        alt: mobile.alt,
        width: mobile.width,
        height: mobile.height,
        quality: 90,
        sizes: "calc(100vw - 32px)",
      }).props
    : null;

  return (
    <picture className={className}>
      {source && (
        <source
          media={MOBILE_QUERY}
          srcSet={source.srcSet}
          sizes={source.sizes}
          width={source.width}
          height={source.height}
        />
      )}
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
      <img {...img} className="block h-auto w-full" />
    </picture>
  );
}

const frameClass =
  "overflow-hidden rounded-[12px] border border-border-subtle bg-bg-surface";
const frameStyle: CSSProperties = { boxShadow: "var(--shot-shadow)" };

function Placeholder({ name, className }: { name: string; className?: string }) {
  const expected = EXPECTED_SHOTS[name];
  const aspect = expected?.aspect ?? 16 / 10;
  return (
    <figure
      className={cn("mx-auto w-full", className)}
      style={{ maxWidth: expected?.cssWidth }}
      data-shot-placeholder={name}
    >
      <div
        className={cn(frameClass, "grid place-items-center border-dashed p-6")}
        style={{ ...frameStyle, aspectRatio: String(aspect) }}
      >
        <div className="text-center font-mono text-[11px] leading-relaxed text-text-muted">
          <p className="uppercase tracking-[0.14em]">Screenshot pending</p>
          <p className="mt-1 text-text-secondary">{name}</p>
        </div>
      </div>
      <figcaption className="mt-3 font-mono text-[11px] text-text-muted">
        Demo shop · capture pending
      </figcaption>
    </figure>
  );
}

export function ProductShot({
  name,
  variant = "desktop",
  priority = false,
  caption,
  className,
}: ProductShotProps) {
  const canZoom = useMediaQuery(ZOOM_QUERY);
  const [open, setOpen] = useState(false);

  const shot = getShot(name, variant);
  const crop = variant === "desktop" ? getShot(name, "mobile") : null;

  // Production collapses a missing shot to nothing; check `shotRenders()`
  // before wrapping a shot in spacing of its own.
  if (!shot) {
    return SHOW_PLACEHOLDERS ? (
      <Placeholder name={name} className={className} />
    ) : null;
  }

  const pictures = (zoomed: boolean) => (
    <>
      <ThemedPicture
        desktop={shot.dark}
        mobile={zoomed ? null : (crop?.dark ?? null)}
        eager={false}
        className="hidden dark:block"
      />
      {/* Light is the default theme, so its hero image is the one preloaded */}
      <ThemedPicture
        desktop={shot.light}
        mobile={zoomed ? null : (crop?.light ?? null)}
        eager={priority && !zoomed}
        className="block dark:hidden"
      />
    </>
  );

  const provenance = `Demo shop · captured ${captureDate(shot.dark)}`;

  return (
    <figure
      className={cn("mx-auto w-full", className)}
      style={{ maxWidth: naturalWidth(shot.dark) }}
    >
      {canZoom ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Enlarge screenshot: ${shot.dark.alt}`}
          className={cn(
            frameClass,
            "block w-full cursor-zoom-in text-left transition-[border-color] duration-200 hover:border-border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          )}
          style={frameStyle}
        >
          {pictures(false)}
        </button>
      ) : (
        <div className={frameClass} style={frameStyle}>
          {pictures(false)}
        </div>
      )}

      <figcaption className="mt-3 font-mono text-[11px] text-text-muted">
        {caption ? `${caption} · ${provenance}` : provenance}
      </figcaption>

      {canZoom && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className={cn(
              "landing",
              landingFontClasses,
              "w-auto max-w-[min(94vw,1600px)] gap-3 bg-bg-surface p-3 sm:max-w-[min(94vw,1600px)]"
            )}
          >
            <DialogTitle className="sr-only">{shot.dark.alt}</DialogTitle>
            <div
              className="max-h-[84vh] overflow-auto rounded-[8px] border border-border-subtle"
              style={{ width: `min(90vw, ${shot.dark.width / 1.5}px)` }}
            >
              {pictures(true)}
            </div>
            <p className="px-1 font-mono text-[11px] text-text-muted">
              {provenance}
            </p>
          </DialogContent>
        </Dialog>
      )}
    </figure>
  );
}
