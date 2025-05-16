// Add custom session and JWT information for NextAuth.js
import { DefaultSession, DefaultJWT } from "next-auth";

// Declare module augmentation for Session
declare module "next-auth" {
  // Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
  interface Session {
    // A JWT which can be used as Authorization header with supabase-js for RLS.
    supabaseAccessToken?: string;
    user: {
      // The user's postal address
      address: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

// Declare module augmentation for JWT
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }
}
