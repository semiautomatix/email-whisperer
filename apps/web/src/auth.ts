import NextAuth, { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import * as jose from "jose"; // supports edge functions, use jwtwebtoken elsewhere
import { refreshAccessToken } from "@/utils/refreshAccessToken";
import assert from "@/utils/assert";

// assert process.env.SUPABASE_URL;
assert(process.env.SUPABASE_URL, "SUPABASE_URL is not defined");

// assert process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  "SUPABASE_SERVICE_ROLE_KEY is not defined",
);

// Maximum number of minutes to allow a session with a refresh error before forcing sign out
const MAX_ERROR_SESSION_MINUTES = 15;

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
    async jwt({ token, account }) {
      // Initial login
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires =
          Date.now() + (account.expires_at ?? 0) * 1000;
        token.providerAccountId = account.providerAccountId; // for Supabase query
        return token;
      }

      // If token is still valid, return it
      if (Date.now() < Number(token.accessTokenExpires)) {
        return token;
      }

      // Token expired, refresh and sync to Supabase
      try {
        const refreshedToken = await refreshAccessToken({
          refreshToken: token.refreshToken as string,
          providerAccountId: Number(token.providerAccountId),
        });

        // Define a type guard for the error response
        const isErrorResponse = (
          response: any,
        ): response is {
          error: string;
          errorDetails: any;
          providerAccountId: number;
          refreshToken: string;
        } => {
          return "error" in response;
        };

        // Check if there was an error during refresh
        if (isErrorResponse(refreshedToken)) {
          console.error(
            `Token refresh failed: ${refreshedToken.error}`,
            refreshedToken.errorDetails,
          );

          // For InvalidRefreshTokenError, force re-authentication
          if (refreshedToken.error === "InvalidRefreshTokenError") {
            console.warn(
              "Invalid refresh token, user will need to re-authenticate",
            );
            return { ...token, error: "RefreshAccessTokenError" };
          }

          // For other errors, include error in token but keep old tokens in case they still work
          // This prevents completely locking out the user on temporary failures
          return {
            ...token,
            error: refreshedToken.error,
          };
        }

        return refreshedToken;
      } catch (error) {
        console.error("Unexpected error refreshing token:", error);
        return { ...token, error: "UnexpectedTokenError" };
      }
    },
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

        // Set a short expiry for sessions with errors to force reauthentication
        if (token.error === "RefreshAccessTokenError") {
          const shortExpiryDate = new Date();
          shortExpiryDate.setMinutes(
            shortExpiryDate.getMinutes() + MAX_ERROR_SESSION_MINUTES,
          );
          session.expires = shortExpiryDate.toISOString() as Date & string;
        }
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
