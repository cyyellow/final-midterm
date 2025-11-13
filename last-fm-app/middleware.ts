import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const publicRoutes = ["/signin", "/api/auth", "/api/webhooks"];

export default withAuth(
  function middleware(req) {
    const { nextUrl, nextauth } = req;
    const token = nextauth.token;
    const isPublic = publicRoutes.some((route) =>
      nextUrl.pathname.startsWith(route),
    );

    if (!token && !isPublic) {
      const redirectUrl = new URL("/signin", nextUrl.origin);
      if (nextUrl.pathname !== "/") {
        redirectUrl.searchParams.set("callbackUrl", nextUrl.href);
      }
      return NextResponse.redirect(redirectUrl);
    }

    const userHasUsername = Boolean(token?.username);
    const isOnboardingRoute = nextUrl.pathname.startsWith("/onboarding");
    const isSignInRoute = nextUrl.pathname.startsWith("/signin");

    if (token && !userHasUsername && !isOnboardingRoute) {
      return NextResponse.redirect(new URL("/onboarding", nextUrl.origin));
    }

    if (token && userHasUsername && (isOnboardingRoute || isSignInRoute)) {
      return NextResponse.redirect(new URL("/", nextUrl.origin));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  },
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|api/auth).*)"],
};
