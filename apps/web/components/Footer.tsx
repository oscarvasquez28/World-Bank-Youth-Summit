"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <footer className="mt-12 w-full border-t border-neutral-200 bg-white/60 backdrop-blur-sm dark:border-neutral-800 dark:bg-black/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-6 py-5 text-center text-xs text-zinc-500 dark:text-zinc-400 sm:flex-row sm:justify-between sm:text-left">
        <p>
          {mounted
            ? t("footer.esco_attribution")
            : "This service uses the ESCO classification of the European Commission."}
        </p>
        <p className="text-[11px] opacity-70">© {new Date().getFullYear()} UNMAPPED · TREPALDO</p>
      </div>
    </footer>
  );
}
