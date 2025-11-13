import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/signin", "/api/auth", "/api/webhooks"];

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  
  const isPublic = publicRoutes.some((route) =>
    nextUrl.pathname.startsWith(route),
  );

  // Allow public routes
  if (isPublic) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken = req.cookies.get("next-auth.session-token")?.value;
  
  if (!sessionToken) {
    const redirectUrl = new URL("/signin", nextUrl.origin);
    if (nextUrl.pathname !== "/") {
      redirectUrl.searchParams.set("callbackUrl", nextUrl.href);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // For onboarding and protected routes, allow through
  // The actual session validation happens server-side in getAuthSession()
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"],
};
