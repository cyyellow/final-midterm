import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { ObjectId } from "mongodb";

import { clientPromise } from "@/lib/mongodb";
import {
  getUserInfo,
  getAuthToken,
  type LastfmUser,
} from "@/lib/lastfm";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB,
  }),
  debug: process.env.NEXTAUTH_DEBUG === "true",
  logger: {
    debug(code: string, ...message: any[]) {
      console.log("[next-auth][debug]", code, ...message);
    },
    warn(code: string) {
      console.warn("[next-auth][warn]", code);
    },
    error(code: string, ...message: any[]) {
      console.error("[next-auth][error]", code, ...message);
    },
  },
  providers: [
    {
      id: "lastfm",
      name: "Last.fm",
      type: "oauth",
      clientId: process.env.LASTFM_API_KEY,
      clientSecret: process.env.LASTFM_API_SECRET,
      // Last.fm uses a non-standard OAuth flow
      // Disable checks since Last.fm doesn't support state/PKCE
      checks: [],
      authorization: {
        url: "https://www.last.fm/api/auth/",
        params: { 
          api_key: process.env.LASTFM_API_KEY,
          cb: `${process.env.NEXTAUTH_URL}/api/auth/callback/lastfm`,
        },
      },
      token: {
        async request(context) {
          // Middleware transforms Last.fm's 'token' param to 'code' for NextAuth compatibility
          const { params } = context;
          
          console.log("[lastfm-provider] Token request params:", params);
          
          // The middleware should have transformed 'token' to 'code'
          const token = params?.code as string | undefined;
          
          if (!token) {
            console.error("[lastfm-provider] No token found after middleware transformation");
            console.error("[lastfm-provider] Available params:", JSON.stringify(params, null, 2));
            throw new Error("No token returned from Last.fm after callback");
          }

          console.log("[lastfm-provider] Exchanging Last.fm token for session key");
          
          try {
            const sessionKey = await getAuthToken(token);
            console.log("[lastfm-provider] Successfully obtained session key");
            
            return {
              tokens: {
                access_token: sessionKey,
                token_type: "Bearer",
              },
            };
          } catch (error) {
            console.error("[lastfm-provider] Failed to exchange token for session:", error);
            throw error;
          }
        },
      },
      userinfo: {
        async request(context) {
          const sessionKey = context.tokens.access_token;
          if (!sessionKey) {
            throw new Error("Missing session key");
          }

          console.log("[lastfm-provider] Fetching user info with session key");
          
          const profile = await getUserInfo(sessionKey);
          
          console.log("[lastfm-provider] Got user profile:", profile.name);
          
          // Return profile in NextAuth's expected format
          return {
            sub: profile.name,
            name: profile.realname || profile.name,
            email: undefined,
            picture: profile.image?.find((img) => img.size === "extralarge")?.["#text"] || undefined,
          };
        },
      },
      profile(profile: any) {
        console.log("[lastfm-provider] Mapping profile for user:", profile.sub);
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          lastfmUsername: profile.sub,
          username: null,
        };
      },
    },
  ],
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async session({ session, user }) {
      // With database strategy, we get the user object directly (no token)
      if (!session.user || !user) {
        return session;
      }

      try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const lookupQuery = ObjectId.isValid(user.id)
          ? { _id: new ObjectId(user.id) }
          : { id: user.id };

        const userDoc = await db
          .collection("users")
          .findOne<{
            username?: string;
            lastfmUsername?: string;
            displayName?: string;
            image?: string;
          }>(lookupQuery, {
            projection: { username: 1, lastfmUsername: 1, displayName: 1, image: 1 },
          });

        session.user.id = user.id;
        session.user.image = userDoc?.image ?? user.image ?? null;
        session.user.username = userDoc?.username ?? null;
        session.user.lastfmUsername = userDoc?.lastfmUsername ?? null;
        session.user.displayName = userDoc?.displayName ?? null;
      } catch (error) {
        console.warn("[next-auth][session] user lookup failed", error);
        session.user.id = user.id;
        session.user.image = user.image ?? null;
        session.user.username = null;
        session.user.lastfmUsername = null;
        session.user.displayName = null;
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      try {
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
      } catch (error) {
        console.warn("[next-auth][createUser] failed to upsert user", error);
      }
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}