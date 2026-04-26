import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";
import Navbar from "@/components/Navbar";
import { Toaster } from 'sonner';
import { I18nProvider } from '@/lib/i18n';
import { headers } from 'next/headers';

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
  description: "Analyze free-text skills to get suggested roles.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode;}>) {
  // Read the cookie header (await headers()) to decide the initial locale for SSR.
  let cookieHeader = '';
  try {
    const h = await headers();
    if (h && typeof (h as any).get === 'function') {
      cookieHeader = (h as any).get('cookie') || '';
    } else if (h && typeof (h as any).entries === 'function') {
      // Headers-like iterable
      for (const [k, v] of (h as any).entries()) {
        if (k.toLowerCase() === 'cookie') { cookieHeader = v; break; }
      }
    } else if (Array.isArray(h)) {
      const found = (h as any).find((c: any) => c && (c[0] === 'cookie' || c.name === 'cookie'));
      cookieHeader = found ? (found[1] || found.value || '') : '';
    } else if (h && typeof h === 'object') {
      cookieHeader = (h as any).cookie || (h as any)['cookie'] || '';
    }
  } catch (e) {
    // ignore and leave cookieHeader empty
  }

  let localeCookie: 'en' | 'es' | undefined = undefined;
  try {
    const m = (cookieHeader || '').match(/(?:^|; )unmapped_locale=(en|es)(?:;|$)/);
    if (m) localeCookie = m[1] as any;
  } catch (e) {
    // ignore
  }

  return (
    <html lang={localeCookie ?? 'en'} className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gradient-to-b from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 text-zinc-900 dark:text-zinc-100 pt-16">
        <I18nProvider initialLocale={localeCookie}>
          <Navbar />
          <PageTransition>
            <div className="mx-auto w-full max-w-7xl px-6">{children}</div>
          </PageTransition>
        </I18nProvider>
        {/* development debug panel removed */}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
