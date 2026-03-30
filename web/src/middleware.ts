import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DASHBOARD_COOKIE_NAME, isValidSessionCookie } from "@/lib/session";
import { validateApiRequest } from "@/lib/auth-api";

async function isApiAuthorized(request: NextRequest): Promise<boolean> {
  if (validateApiRequest(request)) return true;
  const cookie = request.cookies.get(DASHBOARD_COOKIE_NAME)?.value;
  return isValidSessionCookie(cookie);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (!(await isApiAuthorized(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const cookie = request.cookies.get(DASHBOARD_COOKIE_NAME)?.value;
  if (!(await isValidSessionCookie(cookie))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
