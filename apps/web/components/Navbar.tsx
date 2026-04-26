"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@/components/ui/avatar";
import { toast } from 'sonner';
import { initTheme, getStoredTheme, setTheme, toggleTheme, onThemeChange } from '@/lib/theme'
import { useI18n } from '@/lib/i18n'

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [theme, setThemeState] = useState<'light'|'dark'|'system'>('system')
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    import('@/lib/auth').then((auth) => {
      if (!mounted) return;
      setUser(auth.getUser());
      const unsub = auth.onAuthChange(() => setUser(auth.getUser()));
      // cleanup
      return () => unsub();
    });
    return () => { mounted = false };
  }, []);

  useEffect(() => {
    // initialize theme on client
    initTheme()
    const stored = getStoredTheme()
    setThemeState(stored ?? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
    const unsub = onThemeChange(() => setThemeState(getStoredTheme() ?? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')))
    return () => unsub()
  }, [])

  return (
    <header className="w-full fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-6 text-zinc-900 dark:text-zinc-100 backdrop-blur-sm bg-white/60 dark:bg-black/60 border-b border-transparent dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <svg width="290" height="56" viewBox="0 0 290 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="h-10 w-auto text-zinc-900 dark:text-zinc-100">
            <g transform="translate(8 8)">
              <path d="M24 4 L32 20 L24 36 L16 20 Z" fill="#4f46e5" />
              <circle cx="24" cy="20" r="18" stroke="#6366f1" strokeWidth="4" />
              <circle cx="24" cy="20" r="6" fill="#1e2937" />
              <path d="M24 8 L24 32" stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round" />
            </g>
            <text x="70" y="39" fontFamily="Inter, system-ui, sans-serif" fontSize="37" fontWeight="700" letterSpacing="-0.035em" fill="currentColor">UNMAPPED</text>
          </svg>
        </div>
        <nav className="hidden sm:flex flex-1 justify-center items-center gap-6 text-sm">
          <Link className={`${pathname === '/' ? 'text-indigo-500 font-medium' : 'text-zinc-700 dark:text-zinc-300'}`} href="/">{mounted ? t('nav.discover') : ''}</Link>
          <Link className={`${pathname === '/opportunities' ? 'text-indigo-500 font-medium' : 'text-zinc-700 dark:text-zinc-300'}`} href="/opportunities">{mounted ? t('nav.opportunities') : ''}</Link>
          <Link className={`${pathname === '/for-companies' ? 'text-indigo-500 font-medium' : 'text-zinc-700 dark:text-zinc-300'}`} href="#">{mounted ? t('nav.for_companies') : ''}</Link>
        </nav>
        <div className="hidden sm:flex items-center gap-4">
          <button
            aria-label="Toggle theme"
            onClick={() => { toggleTheme(); }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            )}
          </button>

          <LanguageMenu />

          <ProfileMenu user={user} onSignOut={() => {
            import('@/lib/auth').then((a) => a.clearUser());
          }} />
        </div>
      </div>
    </header>
  );
}
function LanguageMenu() {
  const { locale, setLocale, t } = useI18n();

  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(e) => {
        const v = e.target.value as any;
        setLocale(v);
        // apply change on client only to avoid hydration mismatch;
        // the provider writes the cookie so the server will render the new locale on next full load
        try { toast(t('settings.language_changed')); } catch (e) { /* ignore */ }
      }}
      className="h-9 rounded-md bg-zinc-100 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 px-2"
    >
      <option value="en">EN</option>
      <option value="es">ES</option>
    </select>
  );
}
function ProfileMenu({ user, onSignOut } : { user: any | null; onSignOut: () => void; }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full focus:outline-none"
      >
        <Avatar initials={user ? (user.name ? user.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('') : (user.email?.[0] ?? undefined)) : undefined} />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-md border bg-white shadow-lg dark:bg-zinc-900 dark:border-neutral-700">
          {!user && (
            <a href="/signin" className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">{t('auth.sign_in')}</a>
          )}

          {user && (
            <div>
              <div className="px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  <Avatar initials={user.name ? user.name.split(' ').map((p: string) => p[0]).slice(0,2).join('') : (user.email ? user.email[0] : undefined)} />
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.name ?? user.email}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</div>
                  </div>
                </div>
              </div>

              <div className="px-2 py-2">
                <button onClick={async () => { onSignOut(); toast(t('auth.signed_out')); setOpen(false); }} className="w-full rounded px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left">{t('auth.sign_out')}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
