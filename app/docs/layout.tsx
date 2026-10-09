import type { Metadata } from "next";
import { DocsSidebar, DocsHeader } from "@/components/docs";
import { landingFontClasses } from "@/components/landing/fonts";
import "../landing.css";
import "./docs.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.apperio.dev"),
  title: "Apperio docs",
  description:
    "How to set up Apperio: install the SDK, connect GitHub, record deploys, and trace each error back to the change that caused it.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`docs ${landingFontClasses} min-h-screen bg-bg-base text-text-primary`}>
      <DocsHeader />
      <div className="mx-auto flex max-w-[1440px]">
        <DocsSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
