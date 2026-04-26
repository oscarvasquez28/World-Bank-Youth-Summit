"use client";

import React, { useEffect, useState } from "react";
import Results from "@/components/Results";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from 'framer-motion';

export default function OpportunitiesPage() {
  const [skills, setSkills] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<{ role: string; salary: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('detectedSkills') || '[]');
      const o = JSON.parse(localStorage.getItem('detectedOpportunities') || '[]');
      setSkills(Array.isArray(s) ? s : []);
      setOpportunities(Array.isArray(o) ? o : []);
    } catch (e) {
      console.warn('Failed to read detected skills from localStorage', e);
    }
  }, []);

  return (
    <div className="flex min-h-screen items-start bg-transparent p-8 pt-16 font-sans">
      <main className="mx-auto w-full max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-6 text-3xl text-center font-extrabold">Opportunities</h1>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_2fr]">
            <aside className="w-full">

              <Card className="sticky top-20 h-fit p-4">
              <h3 className="mb-6 text-2xl font-semibold text-center">Detected Skills</h3>
                <div className="mb-3">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search skills..."
                    className="w-full rounded-md border px-3 py-2 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {skills.length === 0 && <p className="text-sm text-zinc-500">No skills saved yet.</p>}
                  {skills
                    .filter((s) => s.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                    .map((s) => {
                      const active = selectedSkills.includes(s);
                      return (
                        <Badge
                          key={s}
                          onClick={() => {
                            setSelectedSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
                          }}
                          className={`cursor-pointer ${active ? 'bg-indigo-600 text-white' : ''}`}
                        >
                          {s}
                        </Badge>
                      );
                    })}
                </div>
              </Card>
            </aside>

            <section className="w-full bg-white shadow-2xl p-6">
              <div className="h-[70vh] overflow-y-auto pr-2">
                {/** Group opportunities by skill match */}
                {(() => {
                  const selected = selectedSkills.length > 0 ? selectedSkills : skills;
                  const groups: Record<string, { role: string; salary: string }[]> = {};

                  // initialize groups for selected skills
                  selected.forEach((s) => (groups[s] = []));

                  // assign opportunities to matching skill groups by checking role text
                  opportunities.forEach((o) => {
                    const matched = selected.find((s) => o.role.toLowerCase().includes(s.toLowerCase()));
                    if (matched) groups[matched].push(o);
                    else {
                      // put into an 'Other' group
                      groups['Other'] = groups['Other'] || [];
                      groups['Other'].push(o);
                    }
                  });

                  if (selected.length === 0 && opportunities.length === 0) {
                    return <p className="text-sm text-zinc-500">No opportunities yet.</p>;
                  }

                  // when no filter, show per-skill groups for all skills
                  const keys = selected.length > 0 ? selected : skills.length > 0 ? skills : [];

                  return (
                    <div className="space-y-6">
                      {keys.map((skill) => (
                        <motion.div key={skill} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                          <h2 className="mb-3 text-lg font-semibold">Opportunities for {skill}</h2>
                          {(groups[skill] || []).length > 0 && (
                            <div className="grid gap-4 md:grid-cols-2">
                              {(groups[skill] || []).map((o) => (
                                <Card key={o.role} className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <div className="text-sm font-semibold">{o.role}</div>
                                      <div className="mt-1 text-sm text-zinc-600">{o.salary}</div>
                                    </div>
                                  </div>
                                  <div className="text-sm text-zinc-500 mt-2">Brief description placeholder for the role.</div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}

                      {groups['Other'] && groups['Other'].length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                          <h2 className="mb-3 text-lg font-semibold">Other Opportunities</h2>
                          <div className="grid gap-4 md:grid-cols-2">
                            {groups['Other'].map((o) => (
                              <Card key={o.role} className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="text-sm font-semibold">{o.role}</div>
                                    <div className="mt-1 text-sm text-zinc-600">{o.salary}</div>
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
