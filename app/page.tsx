import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { HERO_SUBTITLE } from "@/components/landing/copy";
import { landingFontClasses } from "@/components/landing/fonts";
import { WaitlistPage } from "@/components/waitlist/WaitlistPage";
import { warnMissingShots } from "@/lib/screenshots";
import "./landing.css";

const TITLE = "Apperio: know which change broke production";
const DESCRIPTION = `${HERO_SUBTITLE} Private beta.`;

export const metadata: Metadata = {
  metadataBase: new URL("https://www.apperio.dev"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://www.apperio.dev",
    siteName: "Apperio",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_GB",
    // TODO(run): add `images` from a real capture (suspect-commit, 1200x630)
    // once the screenshot run has produced it, or add app/opengraph-image.png.
  },
  twitter: {
    // TODO(run): switch to "summary_large_image" when the OG image exists.
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function LandingPage() {
  warnMissingShots();

  return (
    <div className={`landing ${landingFontClasses} relative min-h-screen`}>
      <Header />
      <WaitlistPage />
      <Footer />
    </div>
  );
}
