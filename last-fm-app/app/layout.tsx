import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { AuthProvider } from "@/components/providers/session-provider";
import { BodyPointerEventsFix } from "@/components/providers/body-pointer-fix";
import { Toaster } from "@/components/ui/toaster";
import { getAuthSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "next.fm",
  description:
    "A music-first social experience powered by your Last.fm listening history.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          jetBrainsMono.variable,
        )}
      >
        <AuthProvider session={session}>
          <BodyPointerEventsFix />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
