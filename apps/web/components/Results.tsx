"use client";

import React from "react";
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Opportunity = {
  role: string;
  salary: string;
};

type Props = {
  skills: string[];
  opportunities: Opportunity[];
};

type LensSkill = { skill: string; risk_score?: number };

type Lens = {
  skills_at_risk?: string[] | LensSkill[];
  durable_skills?: LensSkill[];
  resilience_pathways?: LensSkill[];
};
export default function Results({ skills, opportunities, lens }: Props & { lens?: Lens | null }) {
  const container = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
  };

  const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  };

  return (
    <motion.div initial="hidden" animate="show" variants={container} className="mt-8 w-full">
      <Card>
        <motion.h3 variants={item} className="mb-3 text-lg font-semibold dark:text-zinc-100">Detected Skills</motion.h3>
        <motion.div variants={item} className="mb-4 flex flex-wrap gap-2">
          {skills.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No skills detected yet.</p>}
          {skills.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </motion.div>

        {/* Lens sections (skills at risk, durable skills, resilience pathways) */}
        {lens && (
          <>
            <motion.h3 variants={item} className="mb-3 mt-2 text-lg font-semibold dark:text-zinc-100">Skills At Risk</motion.h3>
            <motion.div variants={item} className="mb-4 flex flex-wrap gap-2">
              {Array.isArray(lens.skills_at_risk) && lens.skills_at_risk.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No skills at risk identified.</p>
              )}
              {Array.isArray(lens.skills_at_risk) && lens.skills_at_risk.map((s: any, i) => {
                const label = typeof s === 'string' ? s : s.skill || String(s);
                return (
                  <Badge key={`risk-${label}-${i}`} className="bg-rose-100 text-rose-800 dark:bg-rose-800 dark:text-rose-100">
                    {label}
                  </Badge>
                );
              })}
            </motion.div>

            <motion.h3 variants={item} className="mb-3 mt-2 text-lg font-semibold dark:text-zinc-100">Durable Skills</motion.h3>
            <motion.div variants={item} className="mb-4 flex flex-wrap gap-2">
              {Array.isArray(lens.durable_skills) && lens.durable_skills.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No durable skills identified.</p>
              )}
              {Array.isArray(lens.durable_skills) && lens.durable_skills.map((s) => (
                <Badge key={`durable-${s.skill}`} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <span>{s.skill}</span>
                    {typeof s.risk_score === 'number' && (
                      <span className="ml-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">{s.risk_score.toFixed(1)}%</span>
                    )}
                  </div>
                </Badge>
              ))}
            </motion.div>

            <motion.h3 variants={item} className="mb-3 mt-2 text-lg font-semibold dark:text-zinc-100">Resilience Pathways</motion.h3>
            <motion.div variants={item} className="mb-4 flex flex-wrap gap-2">
              {Array.isArray(lens.resilience_pathways) && lens.resilience_pathways.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No resilience pathways identified.</p>
              )}
              {Array.isArray(lens.resilience_pathways) && lens.resilience_pathways.map((s) => (
                <Badge key={`res-${s.skill}`} className="bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                  <div className="flex items-center gap-2">
                    <span>{s.skill}</span>
                    {typeof s.risk_score === 'number' && (
                      <span className="ml-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">{s.risk_score.toFixed(1)}%</span>
                    )}
                  </div>
                </Badge>
              ))}
            </motion.div>
          </>
        )}

        <motion.h3 variants={item} className="mb-3 mt-2 text-lg font-semibold dark:text-zinc-100">Suggested Opportunities</motion.h3>
        <motion.div variants={item} className="grid gap-4 md:grid-cols-2">
          {opportunities.map((o, idx) => (
            <motion.div key={o.role} whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Card className="relative flex flex-col gap-3 p-4 shadow-sm hover:shadow-md dark:shadow-none">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">{o.role}</div>
                    <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{o.salary}</div>
                  </div>
                  <div className="ml-auto flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                      <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">{92 - idx}%</div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Brief description placeholder for the role.</div>
              </Card>
            </motion.div>
          ))}
          {opportunities.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No opportunities yet.</p>}
        </motion.div>
      </Card>
    </motion.div>
  );
}
