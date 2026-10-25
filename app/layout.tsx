import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./globals-animations.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";

// Platform type: Space Grotesk for titles, Inter for text, JetBrains Mono for
// eyebrows, identifiers and numbers. The landing loads its own (landing/fonts.ts).
const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const code = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Apperio - Your app is trying to tell you something.",
  description:
    "Stop guessing what's breaking in production. Real-time logging, error tracking, and performance monitoring for modern applications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font variables sit on <html> so the :root tokens that reference them
    // (--font-sans, --font-mono) resolve. next-themes adds the theme class
    // here before hydration, hence suppressHydrationWarning.
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${code.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body antialiased scrollbar-hide">
        <ThemeProvider
          attribute={"class"}
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            {children}
          </TooltipProvider>
          <Toaster richColors position="top-left" expand={true} />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
