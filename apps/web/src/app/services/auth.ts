// This service handles authentication with Google OAuth via Supabase
import { supabase } from "@/app/lib/supabaseClient";
import { toast } from "sonner";

export interface User {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  // Add property to track Gmail API access
  hasGmailAccess?: boolean;
}

export const AuthService = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false;
    return (
      supabase.auth.getSession() !== null ||
      localStorage.getItem("emailWhisperer_user") !== null
    );
  },

  // Get current user from Supabase and localStorage as fallback
  getCurrentUser: async (): Promise<User | null> => {
    // Try to get the session from Supabase
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const { id, email, user_metadata } = session.user;

      // Check if user has provided Gmail access permission
      // The provider token is typically available directly on the session
      // and not in user_metadata
      const hasGmailAccess = !!(
        session.provider_token &&
        session.provider_refresh_token &&
        session.access_token
      );

      // Use data from Supabase session
      const user: User = {
        id,
        name: user_metadata.full_name || user_metadata.name || "User",
        email: email || "No email provided",
        imageUrl:
          user_metadata.avatar_url ||
          user_metadata.picture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user_metadata.full_name || user_metadata.name || "User")}&background=4F46E5&color=fff`,
        hasGmailAccess: hasGmailAccess,
      };

      // Save to localStorage for offline access
      if (typeof window !== "undefined") {
        localStorage.setItem("emailWhisperer_user", JSON.stringify(user));
      }

      return user;
    }

    // Fallback to localStorage if Supabase session is not available
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("emailWhisperer_user");
      return userData ? JSON.parse(userData) : null;
    }

    return null;
  },

  // Login with Google via Supabase
  loginWithGoogle: async (): Promise<User> => {
    try {
      // Redirect to Google OAuth flow with Gmail access scope
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard`,
          scopes:
            "email profile https://www.googleapis.com/auth/gmail.readonly",
          // queryParams: {
          //   prompt: "consent",
          // },
        },
      });

      if (error) {
        console.error("Google OAuth error:", error);
        toast.error("Login failed. Please try again.");
        throw error;
      }

      // The user will be redirected to Google for authentication
      // After successful authentication, they will be redirected back to the app
      // The session will be automatically established

      // This is a placeholder since the actual user will be available after redirect
      return {} as User;
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please try again.");
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Also clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("emailWhisperer_user");
      }

      toast.info("You have been logged out");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  },
};
