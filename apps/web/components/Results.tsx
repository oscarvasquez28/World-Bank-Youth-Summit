"use client";

import React from "react";
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useI18n } from '@/lib/i18n'

type Opportunity = {
  role: string;
  salary?: string;
};

type Props = {
  skills: string[];
  opportunities: Opportunity[];
};

export default function Results({ skills, opportunities }: Props) {
  const { t } = useI18n();
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
        <motion.h3 variants={item} className="mb-3 text-lg font-semibold dark:text-zinc-100">{t('results.detected')}</motion.h3>
        <motion.div variants={item} className="mb-4 flex flex-wrap gap-2">
          {skills.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('results.no_skills')}</p>}
          {skills.map((s, idx) => (
            <Badge key={`${s}-${idx}`}>{s}</Badge>
          ))}
        </motion.div>

        <motion.h3 variants={item} className="mb-3 mt-2 text-lg font-semibold dark:text-zinc-100">{t('results.suggested')}</motion.h3>
        <motion.div variants={item} className="grid gap-4 md:grid-cols-2">
          {opportunities.map((o, idx) => (
            <motion.div key={`${o.role}-${idx}`} whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Card className="relative flex flex-col gap-3 p-4 shadow-sm hover:shadow-md dark:shadow-none">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">{o.role}</div>
                  </div>
                  <div className="ml-auto flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                      <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">{92 - idx}%</div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">{t('results.role_description')}</div>
              </Card>
            </motion.div>
          ))}
          {opportunities.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('results.no_opps')}</p>}
        </motion.div>
      </Card>
    </motion.div>
  );
}
