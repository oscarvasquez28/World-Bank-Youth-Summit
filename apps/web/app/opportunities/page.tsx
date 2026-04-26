"use client";

import React, { useEffect, useState } from "react";
import Results from "@/components/Results";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from 'framer-motion';
import storage from '@/lib/storage';
import { onAuthChange, getUser } from '@/lib/auth';
import { useI18n } from '@/lib/i18n'

export default function OpportunitiesPage() {
  const { t } = useI18n();
  const [skills, setSkills] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<{ role: string; salary?: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    try {
      const s = storage.getDetectedSkills();
      const o = storage.getDetectedOpportunities();
      setSkills(Array.isArray(s) ? s : []);
      setOpportunities(Array.isArray(o) ? o : []);
    } catch (e) {
      console.warn('Failed to read detected skills from localStorage', e);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthChange(() => {
      // if user logged out, clear state immediately
      const u = getUser();
      if (!u) {
        setSkills([]);
        setOpportunities([]);
        setSelectedSkills([]);
        setSearchQuery('');
      } else {
        // user logged in - rehydrate from per-user storage
        try {
          const s = storage.getDetectedSkills();
          const o = storage.getDetectedOpportunities();
          setSkills(Array.isArray(s) ? s : []);
          setOpportunities(Array.isArray(o) ? o : []);
        } catch (e) {
          // ignore
        }
      }
    });
    return () => unsub && unsub();
  }, []);

  return (
    <div className="flex min-h-screen items-start bg-transparent p-8 pt-16 font-sans">
      <main className="mx-auto w-full max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-6 text-3xl text-center font-extrabold">{t('opportunities.title')}</h1>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_2fr]">
            <aside className="w-full">

              <Card className="sticky top-20 h-fit p-4">
              <h3 className="mb-6 text-2xl font-semibold text-center">{t('results.detected')}</h3>
                  <div className="mb-3">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('opportunities.search_placeholder')}
                      className="w-full rounded-md border border-neutral-100 px-3 py-2 text-sm shadow-sm bg-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-neutral-700 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                    />
                  </div>

                <div className="flex flex-wrap gap-2">
                  {skills.length === 0 && <p className="text-sm text-zinc-500">{t('opportunities.no_skills_saved')}</p>}
                  {skills
                    .filter((s) => s.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                    .map((s, idx) => {
                      const active = selectedSkills.includes(s);
                      return (
                        <Badge
                          key={`${s}-${idx}`}
                          onClick={() => {
                            setSelectedSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
                          }}
                          className={
                            `cursor-pointer ${
                              active
                                ? 'bg-indigo-600 text-white shadow-md dark:bg-indigo-500 dark:shadow-none'
                                : ''
                            }`
                          }
                        >
                          {s}
                        </Badge>
                      );
                    })}
                </div>
              </Card>
            </aside>

            <section className="w-full bg-white shadow-2xl p-6 dark:bg-zinc-900 dark:shadow-none">
              <div className="h-[70vh] overflow-y-auto pr-2">
                {/** Group opportunities by skill match */}
                {(() => {
                  const selected = selectedSkills.length > 0 ? selectedSkills : skills;
                  const groups: Record<string, { role: string; salary: string }[]> = {};

                  function escapeRegExp(str: string) {
                    return str.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
                  }

                  // initialize groups for selected skills
                  selected.forEach((s) => (groups[s] = []));

                  // For each skill, match opportunities by whole-word match to avoid substring collisions
                  const matchedSet = new Set<string>();
                  selected.forEach((s) => {
                    const pattern = new RegExp("\\b" + escapeRegExp(s) + "\\b", "i");
                    opportunities.forEach((o) => {
                      if (pattern.test(o.role)) {
                        groups[s].push(o);
                        matchedSet.add(o.role);
                      }
                    });
                  });

                  // collect unmatched opportunities into Other (match only by role)
                  const other = opportunities.filter((o) => !matchedSet.has(o.role));
                  if (other.length > 0) groups['Other'] = other;

                  if (selected.length === 0 && opportunities.length === 0) {
                    return <p className="text-sm text-zinc-500">{t('results.no_opps')}</p>;
                  }

                  // when no selection, show per-skill groups for all skills
                  const keys = selected.length > 0 ? selected : skills.length > 0 ? skills : [];

                  return (
                    <div className="space-y-6">
                      {keys.map((skill, skillIdx) => (
                        <motion.div key={`${skill}-${skillIdx}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                          <h2 className="mb-3 text-lg font-semibold dark:text-zinc-100">{t('opportunities.for_skill').replace('{{skill}}', skill)}</h2>
                          <div className="grid gap-4 md:grid-cols-2">
                            {(groups[skill] || []).map((o, idx) => (
                              <Card key={`${o.role}-${idx}`} className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="text-sm font-semibold">{o.role}</div>
                                  </div>
                                </div>
                                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Brief description placeholder for the role.</div>
                              </Card>
                            ))}
                            {(groups[skill] || []).length === 0 && <p className="text-sm text-zinc-500">{t('opportunities.no_for_skill')}</p>}
                          </div>
                        </motion.div>
                      ))}

                      {groups['Other'] && groups['Other'].length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                          <h2 className="mb-3 text-lg font-semibold">{t('opportunities.other')}</h2>
                          <div className="grid gap-4 md:grid-cols-2">
                            {groups['Other'].map((o, idx) => (
                              <Card key={`${o.role}-${idx}`} className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="text-sm font-semibold">{o.role}</div>
                                  </div>
                                </div>
                                <div className="text-sm text-zinc-500 mt-2">Brief description placeholder for the role.</div>
                              </Card>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
