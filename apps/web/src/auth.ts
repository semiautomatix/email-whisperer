import NextAuth, { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import * as jose from "jose"; // supports edge functions, use jwtwebtoken elsewhere
import assert from "@/utils/assert";

// assert process.env.SUPABASE_URL;
assert(process.env.SUPABASE_URL, "SUPABASE_URL is not defined");

// assert process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  "SUPABASE_SERVICE_ROLE_KEY is not defined",
);

const config: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!, // override default env
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!, // override default env
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.addons.current.action.compose https://www.googleapis.com/auth/gmail.addons.current.message.action https://www.googleapis.com/auth/gmail.addons.current.message.metadata https://www.googleapis.com/auth/gmail.addons.current.message.readonly https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.insert https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.settings.basic https://www.googleapis.com/auth/gmail.settings.sharing", // do not include https://www.googleapis.com/auth/gmail.metadata
          access_type: "offline",
          prompt: "consent", // forces refresh token
        },
      },
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }),
  callbacks: {
    async session({ session, user, token }) {
      const signingSecret = process.env.SUPABASE_JWT_SECRET;
      if (signingSecret) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: user.id,
          email: user.email,
          role: "authenticated",
        };

        // Use jose instead of jsonwebtoken
        const secret = new TextEncoder().encode(signingSecret);
        session.supabaseAccessToken = await new jose.SignJWT(payload)
          .setProtectedHeader({ alg: "HS256" })
          .sign(secret);
      }

      // Handle auth errors and pass status to client
      if (token?.error) {
        // Add error info to session for client-side handling
        (session as any).error = token.error;
      }

      return session;
    },
  },
  debug: process.env.NODE_ENV === "development", // Add this to see detailed logs during development
};

const result = NextAuth(config);

export const handlers = result.handlers;
export const signIn: typeof result.signIn = result.signIn;
export const signOut: typeof result.signOut = result.signOut;
export const auth: typeof result.auth = result.auth;
