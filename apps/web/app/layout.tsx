import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";
import Navbar from "@/components/Navbar";
import { Toaster } from 'sonner';
import { I18nProvider } from '@/lib/i18n';
import { cookies } from 'next/headers';

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode;}>) {
  const cookieStore = cookies();
  let localeCookie: 'en' | 'es' | undefined = undefined;
  try {
    if (cookieStore && typeof (cookieStore as any).get === 'function') {
      localeCookie = (cookieStore as any).get('unmapped_locale')?.value as any;
    } else if (cookieStore && typeof (cookieStore as any).getAll === 'function') {
      const all = (cookieStore as any).getAll();
      const found = Array.isArray(all) ? all.find((c: any) => c.name === 'unmapped_locale') : undefined;
      localeCookie = found?.value;
    } else if (Array.isArray(cookieStore)) {
      const found = (cookieStore as any).find((c: any) => c.name === 'unmapped_locale');
      localeCookie = found?.value;
    } else if (cookieStore && typeof (cookieStore as any).get === 'undefined' && (cookieStore as any)['unmapped_locale']) {
      // fallback: cookieStore might be a plain object
      localeCookie = (cookieStore as any)['unmapped_locale'];
    }
  } catch (e) {
    // ignore and leave localeCookie undefined
  }

  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gradient-to-b from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 text-zinc-900 dark:text-zinc-100 pt-16">
        <I18nProvider initialLocale={localeCookie}>
          <Navbar />
          <PageTransition>
            <div className="mx-auto w-full max-w-7xl px-6">{children}</div>
          </PageTransition>
        </I18nProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
