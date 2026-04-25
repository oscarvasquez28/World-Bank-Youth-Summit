"use client";

import React from "react";
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
  return (
    <div className="mt-8 w-full max-w-3xl">
      <Card>
        <h3 className="mb-3 text-lg font-semibold">Detected Skills</h3>
        <div className="mb-4 flex flex-wrap gap-2">
          {skills.length === 0 && <p className="text-sm text-zinc-500">No skills detected yet.</p>}
          {skills.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>

        <h3 className="mb-3 mt-2 text-lg font-semibold">Suggested Opportunities</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {opportunities.map((o) => (
            <Card key={o.role} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{o.role}</div>
                <div className="text-sm text-zinc-600">{o.salary}</div>
              </div>
              <div className="text-sm text-zinc-500">Brief description placeholder for the role.</div>
            </Card>
          ))}
          {opportunities.length === 0 && <p className="text-sm text-zinc-500">No opportunities yet.</p>}
        </div>
      </Card>
    </div>
  );
}
