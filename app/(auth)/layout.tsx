import type React from "react";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left: branded panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <AuthBrandPanel />
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex flex-col bg-background overflow-y-auto">
        <div className="flex justify-end p-4">
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
