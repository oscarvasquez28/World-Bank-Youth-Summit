import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";
import Navbar from "@/components/Navbar";
import { Toaster } from 'sonner';

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UNMAPPED — Discover Opportunities from Your Skills",
  description: "Analyze free-text skills to get suggested roles and salary ranges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gradient-to-b from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 text-zinc-900 dark:text-zinc-100 pt-16">
        <Navbar />
        <PageTransition>
          <div className="mx-auto w-full max-w-7xl px-6">{children}</div>
        </PageTransition>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
