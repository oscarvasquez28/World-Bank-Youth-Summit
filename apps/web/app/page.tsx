"use client";

import React, { useState } from "react";
import SkillInput from "@/components/SkillInput";
import Results from "@/components/Results";
import Spinner from "@/components/ui/spinner";
import { motion } from 'framer-motion';
import api from "@/lib/api";
import "@/lib/api.routes";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<{ role: string; salary: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  function mockAnalyze(text: string, country: string) {
    // kept for local fallback, but prefer server analyze
    setLoading(true);
    setSkills([]);
    setOpportunities([]);

    // simple mock: extract words longer than 3 letters and treat some as skills
    setTimeout(() => {
      const tokens = text
        .split(/[^A-Za-z0-9\+\#\-]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2)
        .slice(0, 8);

      const detected = Array.from(new Set(tokens)).slice(0, 8);

      // mock opportunities
      const opps = detected.slice(0, 4).map((s, i) => ({
        role: `${s} Specialist`,
        salary: country === "US" ? "$60k - $95k" : "$20k - $40k",
      }));

      setSkills(detected);
      setOpportunities(opps);
      setLoading(false);
    }, 900);
  }

  async function analyzeRemote(text: string, country: string) {
    setLoading(true);
    setSkills([]);
    setError(null);
    setOpportunities([]);

    try {
      const data = await api.analyze({ text, country });
      setSkills(data.skills || []);
      setOpportunities(data.opportunities || []);
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
          <div className="w-full rounded-3xl bg-white px-12 py-14 shadow-2xl">
            <div className="mb-6 text-center">
              <h1 className="mx-auto max-w-4xl text-6xl font-extrabold leading-tight">Discover Opportunities from Your Skills</h1>
              <p className="mx-auto mt-4 max-w-2xl text-zinc-600">Describe your skills in plain text and get suggested roles and salary ranges.</p>
            </div>

            <div className="rounded-xl border border-neutral-100 bg-white p-6 shadow-sm">
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
                  <span>Analyzing...</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {!loading && (skills.length > 0 || opportunities.length > 0) && (
          <div className="mt-8">
            <Results skills={skills} opportunities={opportunities} />
          </div>
        )}
      </main>
    </div>
  );
}
