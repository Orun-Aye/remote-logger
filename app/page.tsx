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
    // The image is app/opengraph-image.png: a crop of the real suspect-commit
    // capture from the demo shop run (alt text in opengraph-image.alt.txt)
  },
  twitter: {
    card: "summary_large_image",
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
