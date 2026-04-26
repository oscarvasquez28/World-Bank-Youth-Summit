"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from 'framer-motion';
import storage from '@/lib/storage';
import api from '@/lib/api';
import '@/lib/api.routes';
import { onAuthChange, getUser } from '@/lib/auth';
import { useI18n } from '@/lib/i18n'

type Opportunity = { role: string; salary?: string };
type OccupationInfo = {
  matching_skills?: string[];
  description?: string;
  matching_percentage?: number;
};
type OccupationsResponse = Record<string, OccupationInfo>;

export default function OpportunitiesPage() {
  const { t } = useI18n();
  const [skills, setSkills] = useState<string[]>([]);
  const [, setOpportunities] = useState<Opportunity[]>([]);
  const [occupationsBySkill, setOccupationsBySkill] = useState<Record<string, OccupationsResponse>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const uniqueSkills = Array.from(new Set(skills.map((s) => String(s || '').trim()).filter(Boolean)));
  const titleCase = (v: string) =>
    String(v || '')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const formatRawPercentage = (v?: number) => (typeof v === 'number' ? `${Number(v.toFixed(2))}%` : '-');

  const filteredSideSkills = uniqueSkills.filter((s) => s.toLowerCase().includes(searchQuery.trim().toLowerCase()));

  const skillsForRows = Array.from(new Set((selectedSkills.length > 0 ? selectedSkills : filteredSideSkills).map((s) => String(s || '').trim()).filter(Boolean)));
  const skillsForRowsKey = skillsForRows.join('|').toLowerCase();

  const opportunitiesBySkill = skillsForRows.map((skill) => {
    const rows = Object.entries(occupationsBySkill[skill] || {});
    return { skill, rows };
  });

  const filteredOccupationsEntries = opportunitiesBySkill.flatMap(({ skill, rows }) =>
    rows.map(([name, info]) => ({ skill, name, info }))
  );

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
        setOccupationsBySkill({});
        setSelectedSkills([]);
        setSearchQuery("");
      } else {
        // user logged in - rehydrate from per-user storage
        try {
          const s = storage.getDetectedSkills();
          const o = storage.getDetectedOpportunities();
          setSkills(Array.isArray(s) ? s : []);
          setOpportunities(Array.isArray(o) ? o : []);
          if (!Array.isArray(s) || s.length === 0) setOccupationsBySkill({});
        } catch (e) {
          // ignore
        }
      }
    });
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      async function fetchPerSkill() {
        if (skillsForRows.length === 0) {
          setOccupationsBySkill({});
          return;
        }

        const entries = await Promise.all(
          skillsForRows.map(async (skill) => {
            try {
              const occ = await api.occupations({
                skills: [skill],
                country: 'US',
                top_n: 10,
              });
              const out = occ && typeof occ === 'object' ? (occ as OccupationsResponse) : {};
              return [skill, out] as const;
            } catch (e) {
              console.warn(`Failed to fetch occupations for skill ${skill}`, e);
              return [skill, {}] as const;
            }
          })
        );

        if (!cancelled) {
          setOccupationsBySkill(Object.fromEntries(entries));
        }
      }

      fetchPerSkill();
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [skillsForRowsKey]);

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
                  {uniqueSkills.length === 0 && <p className="text-sm text-zinc-500">{t('opportunities.no_skills_saved')}</p>}
                  {filteredSideSkills.map((s, idx) => {
                    const active = selectedSkills.includes(s);
                    return (
                      <Badge
                        key={`${s}-${idx}`}
                        onClick={() => {
                          setSelectedSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
                        }}
                        className={`cursor-pointer ${active ? 'bg-indigo-600 text-white shadow-md dark:bg-indigo-500 dark:shadow-none' : ''}`}
                      >
                        {titleCase(s)}
                      </Badge>
                    );
                  })}
                </div>
              </Card>
            </aside>

            <section className="w-full bg-white shadow-2xl p-6 dark:bg-zinc-900 dark:shadow-none">
              <div className="h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-6">
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="space-y-6">
                      {opportunitiesBySkill.map(({ skill, rows }) => (
                        <div key={skill}>
                          <h3 className="mb-3 text-base font-semibold dark:text-zinc-100">{t('opportunities.for_skill').replace('{{skill}}', titleCase(skill))}</h3>
                          <div className="grid gap-4 md:grid-cols-2">
                            {rows.map(([name, info]) => (
                              <Card key={`${skill}-${name}`} className="relative flex flex-col gap-3 p-4 shadow-sm hover:shadow-md dark:shadow-none">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="text-sm font-semibold">{titleCase(name)}</div>
                                  </div>
                                  <div className="ml-auto flex items-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                                      <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">{formatRawPercentage(info?.matching_percentage)}</div>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-zinc-500 dark:text-zinc-400">{info?.description || t('results.role_description')}</div>
                              </Card>
                            ))}
                            {rows.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('opportunities.no_for_skill')}</p>}
                          </div>
                        </div>
                      ))}
                      {opportunitiesBySkill.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('results.no_opps')}</p>}
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 className="mb-3 text-lg font-semibold dark:text-zinc-100">{t('results.occupations_title')}</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredOccupationsEntries.map(({ skill, name, info }) => {
                        return (
                          <Card key={`${skill}-${name}`} className="relative flex flex-col gap-3 p-4 shadow-sm hover:shadow-md dark:shadow-none">
                            <div className="flex items-start justify-between gap-4">
                              <div className="text-sm font-semibold">{titleCase(name)}</div>
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900">
                                <div className="text-sm font-semibold text-sky-700 dark:text-sky-200">{formatRawPercentage(info?.matching_percentage)}</div>
                              </div>
                            </div>
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">{info?.description || t('results.role_description')}</div>
                          </Card>
                        );
                      })}
                      {filteredOccupationsEntries.length === 0 && <p className="text-sm text-zinc-500">{t('results.no_occupations')}</p>}
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
