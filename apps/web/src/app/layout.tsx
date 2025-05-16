import type { Metadata } from "next";
import { Inter, Lora, Geist_Mono } from "next/font/google";
import "./globals.css";
// ThemeProvider removed, we're only using light theme
import dynamic from "next/dynamic";
import { Toaster } from "sonner";
import { TRPCProvider } from "@/app/components/trpc/TRPCProvider";
import { Providers } from "@/app/providers"; // Import NextAuth Providers
import { AuthProvider } from "@/app/hooks/use-auth"; // Keep existing AuthProvider for now

// Dynamically import the ErrorBoundary component
const ErrorBoundary = dynamic(() => import("@/app/components/ErrorBoundary"));

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-display",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Email Whisperer",
  description:
    "A privacy-focused AI assistant for analyzing and responding to emails",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${lora.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCProvider>
          <Providers>
            <AuthProvider>
              <ErrorBoundary>{children}</ErrorBoundary>
              <Toaster position="top-right" richColors />
            </AuthProvider>
          </Providers>
        </TRPCProvider>
      </body>
    </html>
  );
}
