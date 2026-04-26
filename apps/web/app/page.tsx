"use client";

import React, { useState, useEffect } from "react";
import SkillInput from "@/components/SkillInput";
import Results from "@/components/Results";
import Spinner from "@/components/ui/spinner";
import { motion } from 'framer-motion';
import storage from '@/lib/storage';
import api from "@/lib/api";
import "@/lib/api.routes";
import { useI18n } from '@/lib/i18n'

const titleCase = (v: any) => String(v || '')
  .toLowerCase()
  .replace(/\b\w/g, (c) => c.toUpperCase());

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<{ role: string }[]>([]);
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [currentOpportunities, setCurrentOpportunities] = useState<{ role: string; salary?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { t } = useI18n();

  useEffect(() => {
    try {
      const s = storage.getDetectedSkills();
      const o = storage.getDetectedOpportunities();
      if (Array.isArray(s) && s.length) setSkills(s as string[]);
      if (Array.isArray(o) && o.length) setOpportunities(o as { role: string }[]);
    } catch (e) {
      console.warn('Failed to read detected skills from localStorage on mount', e);
    }
  }, []);

  function mockAnalyze(text: string, country: string) {
    setLoading(true);

    // simple mock: extract words longer than 3 letters and treat some as skills
    setTimeout(() => {
      const tokens = text
        .split(/[^A-Za-z0-9\+\#\-]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2)
        .slice(0, 8);

      let detected = Array.from(new Set(tokens)).slice(0, 8);
      detected = detected.map(titleCase);

      const opps = detected.slice(0, 4).map((s, i) => ({
        role: String(s),
        salary: country === "US" ? "$60k - $95k" : "$20k - $40k",
      }));

      // set current results for the Results panel (only show these on Discover)
      setCurrentSkills(detected);
      setCurrentOpportunities(opps);

      setSkills((prev) => {
        const merged = Array.from(new Set([...prev, ...detected]));
        try {
          storage.appendDetectedSkills(detected);
        } catch (e) {
          console.warn('Failed to append detected skills to storage', e);
        }
        return merged;
      });

      setOpportunities((prev) => {
        const mergedRoles = Array.from(new Set([...prev.map((p) => p.role), ...opps.map((o) => o.role)])).map((r) => ({ role: r }));
        try {
          storage.appendDetectedOpportunities(opps.map((o) => ({ role: o.role })));
        } catch (e) {
          console.warn('Failed to append detected opportunities to storage', e);
        }
        return mergedRoles;
      });
      setLoading(false);
    }, 900);
  }

  async function analyzeRemote(text: string, country: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.analyze({ text, country });
      let detected = data.skills || [];
      detected = detected.map(titleCase);
      const opps = data.opportunities || [];

      // current results - only these should be shown on Discover
      setCurrentSkills(detected);
      setCurrentOpportunities(opps);

      setSkills((prev) => {
        const merged = Array.from(new Set([...prev, ...detected]));
        try {
          storage.appendDetectedSkills(detected);
        } catch (e) {
          console.warn('Failed to append detected skills to storage', e);
        }
        return merged;
      });

      setOpportunities((prev) => {
        const mergedRoles = Array.from(new Set([...prev.map((p) => p.role), ...opps.map((o) => o.role)])).map((r) => ({ role: r }));
        try {
          storage.appendDetectedOpportunities(opps.map((o) => ({ role: o.role })));
        } catch (e) {
          console.warn('Failed to append detected opportunities to storage', e);
        }
        return mergedRoles;
      });
    } catch (err) {
      console.error("Analyze request failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Request failed");
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-start bg-transparent p-8 pt-16 font-sans">
      <main className="w-full">
        <div className="mx-auto mb-10 flex justify-center">
          <div className="w-full rounded-3xl bg-white px-12 py-14 shadow-2xl dark:bg-zinc-900 dark:shadow-none">
            <div className="mb-6 text-center">
              <h1 className="mx-auto max-w-4xl text-6xl font-extrabold leading-tight">{t('home.title')}</h1>
              <p className="mx-auto mt-4 max-w-2xl text-zinc-600 dark:text-zinc-300">{t('home.description')}</p>
            </div>

            <div className="rounded-xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-zinc-800">
              <SkillInput
                onAnalyze={(text, country) => {
                  // prefer remote API; fallback to mock if API unreachable
                  analyzeRemote(text, country).catch(() => mockAnalyze(text, country));
                }}
              />

              {error && (
                <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">Error: {error}</div>
              )}

                      {loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-zinc-600">
                          <Spinner size={18} />
                          <span>{t('analyzing')}</span>
                        </motion.div>
                      )}
            </div>
          </div>
        </div>

        {!loading && (currentSkills.length > 0 || currentOpportunities.length > 0) && (
          <div className="mt-8">
            <Results skills={currentSkills} opportunities={currentOpportunities} />
          </div>
        )}
      </main>
    </div>
  );
}
