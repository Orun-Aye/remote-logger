// /middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Beta-aware middleware.
 *
 * Public paths pass through freely.
 * Protected paths require an auth token cookie.
 * If no token or token lacks betaAccess, redirect appropriately.
 */

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/mfa-verify",
  "/callback",
  "/changelog",
  "/status",
  "/docs",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Allow all /docs/* and /reset-password/* paths
  if (pathname.startsWith("/docs/")) return true;
  if (pathname.startsWith("/reset-password/")) return true;
  return false;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public paths: always accessible
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Protected path: check for auth token
  const token = request.cookies.get("authToken")?.value;

  if (!token) {
    // No auth, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Decode token to check beta access
  const payload = decodeJwtPayload(token);

  if (!payload) {
    // Invalid token, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin users always get full access
  if (payload.role === "admin") {
    return NextResponse.next();
  }

  // Check beta access
  if (!payload.betaAccess) {
    // User exists but not a beta tester, send to waitlist
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Beta user: allow through (feature gating handled at component level)
  return NextResponse.next();
}

/**
 * Middleware Matcher Configuration.
 * Matches all paths except API routes, Next's own assets and anything served
 * from public/ (landing screenshots and clips, plus any file with a static
 * extension). Without the public/ exclusions a logged-out visitor asking for
 * /screenshots/dark/x.webp was redirected to /login.
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|screenshots/|videos/|.*\\.(?:webp|avif|png|jpe?g|gif|svg|ico|mp4|webm|txt|xml|woff2?)$).*)",
  ],
};
