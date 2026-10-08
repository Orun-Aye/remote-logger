import { Instrument_Sans, JetBrains_Mono } from "next/font/google";

// Landing-only type (PLAN.md section 6, pairing A). Self-hosted by next/font, so
// no layout shift and no request to Google at runtime. The dashboard keeps
// DM Sans, Syne and Geist Mono from the root layout.
export const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

/**
 * Put on the landing wrapper, and on anything portalled out of it (the zoom
 * dialog), so the scoped tokens in app/landing.css can resolve the fonts.
 */
export const landingFontClasses = `${instrumentSans.variable} ${jetbrainsMono.variable}`;
