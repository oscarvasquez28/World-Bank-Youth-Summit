"use client";

import React, { useState } from "react";
import SkillInput from "@/components/SkillInput";
import Results from "@/components/Results";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<{ role: string; salary: string }[]>([]);

  function mockAnalyze(text: string, country: string) {
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 font-sans dark:bg-black">
      <main className="w-full max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold">Discover Opportunities from Your Skills</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">Describe your skills in plain text and get suggested roles and salary ranges.</p>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm">
          <SkillInput
            onAnalyze={(text, country) => {
              mockAnalyze(text, country);
            }}
          />

          {loading && (
            <div className="mt-4 text-center text-sm font-medium text-zinc-600 dark:text-zinc-300">Analyzing...</div>
          )}
        </div>

        {!loading && (skills.length > 0 || opportunities.length > 0) && (
          <div className="mt-6">
            <Results skills={skills} opportunities={opportunities} />
          </div>
        )}
      </main>
    </div>
  );
}
