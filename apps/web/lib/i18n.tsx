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
  const initial = initialLocale || (typeof window !== 'undefined' && (localStorage.getItem(LOCALE_KEY) as Locale)) || 'en';
  const [locale, setLocaleState] = useState<Locale>(initial as Locale);

  useEffect(() => {
    try {
      // ensure localStorage reflects current locale (do not change locale here to avoid hydration mismatch)
      localStorage.setItem(LOCALE_KEY, locale);
      // also write a cookie so server renders can read the preference
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
