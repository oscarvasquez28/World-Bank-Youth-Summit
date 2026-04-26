"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Spinner from "@/components/ui/spinner";
import { useI18n } from "@/lib/i18n";

type Candidate = {
  id: string;
  name: string;
  email: string;
  skills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  score: number;
};

function scoreTone(score: number) {
  if (score >= 80) return "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/40";
  if (score >= 50) return "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-500/40";
  return "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-700/40 dark:text-zinc-200 dark:ring-zinc-600";
}

const titleCase = (v: string) =>
  String(v || "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

function parseSkills(input: string): string[] {
  const items = input
    .split(/[,\n]+/)
    .map((s) => titleCase(s))
    .filter(Boolean);
  return Array.from(new Set(items));
}

function buildCandidateFromSkills(id: string, name: string, email: string, skills: string[], requiredSkills: string[]): Candidate | null {
  const normalizedSkills = Array.from(new Set(skills.map((s) => titleCase(s)).filter(Boolean)));
  if (normalizedSkills.length === 0) return null;

  const matchedSkills = requiredSkills.filter((r) => normalizedSkills.some((s) => s.toLowerCase() === r.toLowerCase()));
  if (matchedSkills.length === 0) return null;

  const missingSkills = requiredSkills.filter((r) => !matchedSkills.some((m) => m.toLowerCase() === r.toLowerCase()));
  const score = Math.round((matchedSkills.length / Math.max(requiredSkills.length, 1)) * 100);

  return {
    id,
    name,
    email,
    skills: normalizedSkills,
    matchedSkills,
    missingSkills,
    score,
  };
}

function getCandidatesFromLocalStorage(requiredSkills: string[]): Candidate[] {
  if (typeof window === "undefined") return [];

  const candidates: Candidate[] = [];

  let currentUser: { id?: string; name?: string; email?: string } | null = null;
  try {
    const rawUser = localStorage.getItem("unmapped_user_v1");
    currentUser = rawUser ? JSON.parse(rawUser) : null;
  } catch (e) {
    currentUser = null;
  }

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    const match = key.match(/^detectedSkills:user:(.+)$/);
    if (!match) continue;

    const userId = match[1];

    let parsed: unknown = [];
    try {
      parsed = JSON.parse(localStorage.getItem(key) || "[]");
    } catch (e) {
      parsed = [];
    }

    const skills = Array.isArray(parsed) ? parsed.map((s) => String(s || "")) : [];
    const fallbackName = `User ${userId.slice(0, 8)}`;
    const fallbackEmail = `id:${userId}`;

    const name = currentUser && currentUser.id === userId ? (currentUser.name || currentUser.email || fallbackName) : fallbackName;
    const email = currentUser && currentUser.id === userId ? (currentUser.email || fallbackEmail) : fallbackEmail;

    const candidate = buildCandidateFromSkills(userId, name, email, skills, requiredSkills);
    if (candidate) candidates.push(candidate);
  }

  return candidates.sort((a, b) => b.score - a.score || b.matchedSkills.length - a.matchedSkills.length);
}

export default function ForCompaniesPage() {
  const { t } = useI18n();
  const [skillsText, setSkillsText] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMatch() {
    setError(null);
    const skills = parseSkills(skillsText);

    if (skills.length === 0) {
      setError(t("companies.error_no_skills"));
      return;
    }

    setLoading(true);
    setRequiredSkills(skills);

    const localCandidates = getCandidatesFromLocalStorage(skills);
    setCandidates(localCandidates);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/auth/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requiredSkills: skills }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Match failed");

      const apiRequiredSkills = Array.isArray(data.requiredSkills) ? data.requiredSkills : skills;
      const apiCandidates = Array.isArray(data.candidates) ? (data.candidates as Candidate[]) : [];

      const merged = new Map<string, Candidate>();
      localCandidates.forEach((c) => merged.set(c.id, c));
      apiCandidates.forEach((c) => merged.set(c.id, c));

      setRequiredSkills(apiRequiredSkills);
      setCandidates(Array.from(merged.values()).sort((a, b) => b.score - a.score || b.matchedSkills.length - a.matchedSkills.length));
    } catch (err) {
      if (localCandidates.length === 0) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || t("companies.error_match_failed"));
      }
    }
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white px-4 pb-8 pt-20 font-sans dark:bg-zinc-950 sm:px-6">
      <main className="mx-auto w-full max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="mb-8 rounded-2xl border border-white/70 bg-white/80 p-6 shadow-[0_16px_60px_-24px_rgba(15,23,42,0.35)] backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/80 dark:shadow-[0_16px_60px_-24px_rgba(0,0,0,0.6)] sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">{t("companies.title")}</h1>
                <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300 sm:text-base">{t("companies.subtitle")}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                <span>{t("companies.results_title")}</span>
                <span className="rounded-md bg-white/20 px-2 py-0.5 dark:bg-zinc-900/10">{candidates.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside>
              <Card className="sticky top-20 rounded-2xl border border-zinc-200/80 bg-white/95 p-5 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.45)] backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 dark:shadow-[0_12px_30px_-20px_rgba(0,0,0,0.7)]">
                <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t("companies.form_title")}</h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("companies.required_skills")}</p>

                <textarea
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder={t("companies.skills_placeholder")}
                  className="mt-4 min-h-[160px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-800 shadow-inner outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                />

                <button
                  onClick={handleMatch}
                  disabled={loading}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {loading ? <Spinner size={16} /> : null}
                  {t("companies.find_candidates")}
                </button>

                {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
              </Card>
            </aside>

            <section className="rounded-2xl border border-zinc-200/70 bg-white/90 p-5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.4)] backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.7)] sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t("companies.results_title")}</h2>
                {requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {requiredSkills.map((s, idx) => (
                      <Badge key={`${s}-${idx}`} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {!loading && candidates.length === 0 && requiredSkills.length > 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                    {t("companies.no_matches")}
                  </div>
                )}

                {candidates.map((c, idx) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.2) }}
                  >
                    <Card className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_34px_-20px_rgba(15,23,42,0.45)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_8px_24px_-18px_rgba(0,0,0,0.75)] sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{c.name}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{c.email}</div>
                        </div>
                        <div className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${scoreTone(c.score)}`}>
                          {c.score}%
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
                          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{t("companies.matched_skills")}</div>
                          <div className="flex flex-wrap gap-2">
                            {c.matchedSkills.map((s, i) => (
                              <Badge key={`${c.id}-m-${s}-${i}`} className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white dark:bg-emerald-500 dark:text-emerald-50">{s}</Badge>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/70">
                          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">{t("companies.missing_skills")}</div>
                          <div className="flex flex-wrap gap-2">
                            {c.missingSkills.length > 0 ? c.missingSkills.map((s, i) => (
                              <Badge key={`${c.id}-x-${s}-${i}`} className="rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100">{s}</Badge>
                            )) : <span className="text-xs text-zinc-500 dark:text-zinc-400">0</span>}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
