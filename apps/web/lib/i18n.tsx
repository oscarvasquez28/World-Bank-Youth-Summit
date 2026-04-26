"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "@/locales/en.json";
import es from "@/locales/es.json";

type Locale = "en" | "es";

const LOCALE_KEY = "unmapped_locale";

const translations: Record<Locale, Record<string, string>> = {
  en,
  es,
};

type I18nContext = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (k: string) => string;
};

const I18nCtx = createContext<I18nContext | undefined>(undefined);

export function I18nProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  // Avoid reading localStorage during render to prevent SSR/client mismatch.
  // Start with server-provided `initialLocale` if available, otherwise default to 'en'.
  const initial = (initialLocale as Locale) || 'en';
  const [locale, setLocaleState] = useState<Locale>(initial as Locale);
  // debug: log initial values on client render
  try {
    // eslint-disable-next-line no-console
    console.log('I18nProvider:init', { initialLocale, initial });
  } catch (e) {}

  // On mount, sync from localStorage if user previously selected a locale.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_KEY) as Locale | null;
      // debug: log stored value
      // eslint-disable-next-line no-console
      console.log('I18nProvider:mounted stored', { stored, locale });
      if (stored && stored !== locale) {
        setLocaleState(stored);
      }
    } catch (e) {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCALE_KEY, locale);
      document.cookie = `${LOCALE_KEY}=${locale}; Path=/; Max-Age=${60 * 60 * 24 * 365}`;
    } catch (e) {
      // ignore
    }
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(LOCALE_KEY, l); document.cookie = `${LOCALE_KEY}=${l}; Path=/; Max-Age=${60 * 60 * 24 * 365}`; } catch (e) { }
  };

  const t = useMemo(() => {
    return (k: string) => {
      const val = translations[locale] && translations[locale][k];
      if (val) return val;
      // fallback to english if missing
      return translations['en'][k] || k;
    };
  }, [locale]);

  return <I18nCtx.Provider value={{ locale, setLocale, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
