"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { ChatService } from "@/app/services/chat";
import { trpc } from "@/app/trpc/utils";

export interface User {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  hasGmailAccess?: boolean;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  removeAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const isLoading = status === "loading";

  // Define the deletion mutation at component level
  const deleteAccountMutation = trpc.accounts.delete.useMutation();

  useEffect(() => {
    if (session?.user) {
      // Transform session user to our User interface
      const sessionUser: User = {
        id: session.user.id as string,
        name: session.user.name || "User",
        email: session.user.email || "No email provided",
        imageUrl:
          session.user.image ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name || "User")}&background=4F46E5&color=fff`,
        hasGmailAccess: true, // Handled by NextAuth since we require the scope
      };

      setUser(sessionUser);
    } else {
      setUser(null);
    }
  }, [session]);

  const login = async () => {
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const logout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const removeAccount = async () => {
    if (!user) return;

    try {
      // Call the accounts.delete mutation we defined above
      await deleteAccountMutation.mutateAsync();

      // If we get here, the mutation succeeded (no error was thrown)

      // Delete all chat histories
      await ChatService.deleteAllChatHistories(user.id);

      // Sign out the user
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Error removing account:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, removeAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
