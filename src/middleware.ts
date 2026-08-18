import { NextResponse, type NextRequest } from "next/server";

/**
 * Redirects unauthenticated navigation away from /admin.
 *
 * This is a convenience for navigation only — it checks that a session cookie
 * is PRESENT, not that it is valid, because verifying the HMAC needs Node's
 * crypto module and middleware runs on the edge runtime.
 *
 * The real boundary is server-side: the (protected) layout and every
 * /api/admin/* handler call getAdminContext(), which verifies the signature and
 * expiry. A forged cookie gets past this file and no further.
 */
const SESSION_COOKIE = "eshifa_admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const loginUrl = new URL("/admin/login", request.url);
    // Remember the destination, but only ever a same-site path.
    if (pathname !== "/admin") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
