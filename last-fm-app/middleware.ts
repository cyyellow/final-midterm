import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const publicRoutes = ["/signin", "/api/auth", "/api/webhooks"];

export default auth((req) => {
  const { nextUrl } = req;
  const isPublic = publicRoutes.some((route) =>
    nextUrl.pathname.startsWith(route),
  );

  if (!req.auth && !isPublic) {
    const redirectUrl = new URL("/signin", nextUrl.origin);
    if (nextUrl.pathname !== "/") {
      redirectUrl.searchParams.set("callbackUrl", nextUrl.href);
    }
    return NextResponse.redirect(redirectUrl);
  }

  const userHasUsername = Boolean(req.auth?.user?.username);
  const isOnboardingRoute = nextUrl.pathname.startsWith("/onboarding");
  const isSignInRoute = nextUrl.pathname.startsWith("/signin");

  if (req.auth && !userHasUsername && !isOnboardingRoute) {
    return NextResponse.redirect(new URL("/onboarding", nextUrl.origin));
  }

  if (req.auth && userHasUsername && (isOnboardingRoute || isSignInRoute)) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|api/auth).*)"],
};


