import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Intercept Last.fm OAuth callback
  if (pathname === "/api/auth/callback/lastfm") {
    // Last.fm sends 'token' but NextAuth expects 'code'
    const lastfmToken = searchParams.get("token");
    
    if (lastfmToken) {
      console.log("[middleware] Intercepted Last.fm callback with token:", lastfmToken.substring(0, 10) + "...");
      
      // Create a new URL with 'code' instead of 'token'
      const url = request.nextUrl.clone();
      url.searchParams.delete("token");
      url.searchParams.set("code", lastfmToken);
      
      console.log("[middleware] Redirecting to callback with transformed parameters");
      
      // Redirect to the same endpoint but with the transformed parameters
      // This causes a new request with the correct parameters for NextAuth
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/auth/callback/lastfm",
};
