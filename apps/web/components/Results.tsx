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
    <motion.div initial="hidden" animate="show" variants={container} className="mt-8 w-full max-w-3xl">
      <Card>
        <motion.h3 variants={item} className="mb-3 text-lg font-semibold">Detected Skills</motion.h3>
        <motion.div variants={item} className="mb-4 flex flex-wrap gap-2">
          {skills.length === 0 && <p className="text-sm text-zinc-500">No skills detected yet.</p>}
          {skills.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </motion.div>

        <motion.h3 variants={item} className="mb-3 mt-2 text-lg font-semibold">Suggested Opportunities</motion.h3>
        <motion.div variants={item} className="grid gap-3 md:grid-cols-2">
          {opportunities.map((o) => (
            <motion.div key={o.role} whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Card className="flex flex-col gap-2 shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{o.role}</div>
                  <div className="text-sm text-zinc-600">{o.salary}</div>
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
