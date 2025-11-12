import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { ObjectId } from "mongodb";

import { clientPromise } from "@/lib/mongodb";
import {
  getUserInfo,
  requestSession,
  type LastfmUser,
} from "@/lib/lastfm";

const lastfmProvider = {
  id: "lastfm",
  name: "Last.fm",
  type: "oauth",
  clientId: process.env.LASTFM_API_KEY ?? "",
  clientSecret: process.env.LASTFM_API_SECRET ?? "",
  authorization: {
    url: "https://www.last.fm/api/auth/",
    params: {
      api_key: process.env.LASTFM_API_KEY ?? "",
    },
  },
  token: async ({ params }: { params: Record<string, string> }) => {
    const token = params?.token;
    if (!token) {
      throw new Error("Missing token returned from Last.fm authorization");
    }

    const session = await requestSession(token);
    return {
      access_token: session.key,
      token_type: "session",
      expires_in: null,
      obtained_at: Date.now(),
      lastfm_username: session.name,
    };
  },
  userinfo: async ({ tokens }: { tokens: Record<string, string> }) => {
    const sessionKey = tokens.access_token;
    if (!sessionKey) {
      throw new Error("Missing Last.fm session key while loading profile");
    }

    const profile = await getUserInfo(sessionKey);

    return {
      ...profile,
      id: profile.name,
      lastfmUsername: profile.name,
    } as LastfmUser & {
      id: string;
      lastfmUsername: string;
    };
  },
  profile: (profile: LastfmUser & { id: string; lastfmUsername: string }) => ({
    id: profile.id,
    name: profile.realname || profile.name,
    image: profile.image?.at(-1)?.["#text"] ?? undefined,
    username: null,
    lastfmUsername: profile.lastfmUsername,
  }),
};

export const authConfig = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB,
  }),
  providers: [lastfmProvider],
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider === "lastfm" && account.access_token) {
        token.lastfmSessionKey = account.access_token;
      }

      if (user) {
        token.sub = user.id;
        token.name = user.name ?? token.name;
        token.picture = user.image ?? token.picture;
        // @ts-expect-error custom field
        token.lastfmUsername = user.lastfmUsername ?? token.lastfmUsername;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user || !token.sub) {
        return session;
      }

      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);
      const lookupQuery = ObjectId.isValid(token.sub)
        ? { _id: new ObjectId(token.sub) }
        : { id: token.sub };

      const userDoc = await db
        .collection("users")
        .findOne<{ username?: string; lastfmUsername?: string; image?: string }>(
          lookupQuery,
        );

      session.user.id = token.sub;
      session.user.image = userDoc?.image ?? session.user.image ?? null;
      session.user.username = userDoc?.username ?? null;
      session.user.lastfmUsername =
        userDoc?.lastfmUsername ??
        (typeof token.lastfmUsername === "string"
          ? token.lastfmUsername
          : null);

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);
      const filter = ObjectId.isValid(user.id)
        ? { _id: new ObjectId(user.id) }
        : { id: user.id };

      await db.collection("users").updateOne(
        filter,
        {
          $setOnInsert: {
            createdAt: new Date(),
          },
          $set: {
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

