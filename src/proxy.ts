import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/terms", "/privacy"];
const API_PUBLIC = ["/api/register", "/api/auth", "/api/schools"];

export const proxy = auth(function proxy(req: NextRequest & { auth: any }) {
  const { pathname } = req.nextUrl;

  // Allow public API routes
  if (API_PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Allow public pages
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // Already logged in → redirect away from auth pages
    if (req.auth?.user && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
      return NextResponse.redirect(new URL("/feed", req.url));
    }
    return NextResponse.next();
  }

  // Protect app routes
  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Banned users
  if ((req.auth.user as any).isBanned) {
    return NextResponse.redirect(new URL("/login?error=banned", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|manifest|icons|robots|logo|uploads|sw\\.js|offline\\.html).*)",
  ],
};
