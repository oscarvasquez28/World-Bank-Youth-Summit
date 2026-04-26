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

export default function Results({ skills, opportunities }: Props) {
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
        <motion.h3 variants={item} className="mb-3 text-lg font-semibold">Detected Skills</motion.h3>
        <motion.div variants={item} className="mb-4 flex flex-wrap gap-2">
          {skills.length === 0 && <p className="text-sm text-zinc-500">No skills detected yet.</p>}
          {skills.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </motion.div>

        <motion.h3 variants={item} className="mb-3 mt-2 text-lg font-semibold">Suggested Opportunities</motion.h3>
        <motion.div variants={item} className="grid gap-4 md:grid-cols-2">
          {opportunities.map((o, idx) => (
            <motion.div key={o.role} whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Card className="relative flex flex-col gap-3 p-4 shadow-sm hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">{o.role}</div>
                    <div className="mt-1 text-sm text-zinc-600">{o.salary}</div>
                  </div>
                  <div className="ml-auto flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                      <div className="text-sm font-semibold text-emerald-700">{92 - idx}%</div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-zinc-500">Brief description placeholder for the role.</div>
              </Card>
            </motion.div>
          ))}
          {opportunities.length === 0 && <p className="text-sm text-zinc-500">No opportunities yet.</p>}
        </motion.div>
      </Card>
    </motion.div>
  );
}
