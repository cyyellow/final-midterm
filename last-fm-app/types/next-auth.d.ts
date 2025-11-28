import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username: string | null;
      lastfmUsername: string | null;
      displayName: string | null;
    };
  }

  interface User {
    username?: string | null;
    lastfmUsername?: string | null;
    displayName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    lastfmUsername?: string | null;
    username?: string | null;
    displayName?: string | null;
  }
}


