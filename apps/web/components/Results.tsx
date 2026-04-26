"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

type Opportunity = {
  role: string;
  salary?: string;
};

type OccupationInfo = {
  matching_skills?: string[];
  description?: string;
  matching_percentage?: number;
};

type LensSkill = { skill: string; risk_score?: number };

type Lens = {
  skills_at_risk?: string[] | LensSkill[];
  durable_skills?: LensSkill[];
  resilience_pathways?: LensSkill[];
};

type Props = {
  skills: string[];
  opportunities: Opportunity[];
  lens?: Lens | null;
  occupations?: Record<string, OccupationInfo> | null;
};

const titleCase = (v: string) =>
  String(v || "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
const formatRawPercentage = (v?: number) => (typeof v === "number" ? `${Number(v.toFixed(2))}%` : "-");

export default function Results({ skills, opportunities, lens, occupations }: Props) {
  const { t } = useI18n();

  return (
    <div className="mt-8 w-full">
      <Card>
        <h3 className="mb-3 text-lg font-semibold dark:text-zinc-100">{t("results.detected")}</h3>
        <div className="mb-4 flex flex-wrap gap-2">
          {skills.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("results.no_skills")}</p>}
          {skills.map((s, idx) => (
            <Badge key={`${s}-${idx}`}>{titleCase(s)}</Badge>
          ))}
        </div>

        {lens && (
          <>
            <h3 className="mb-3 mt-2 text-lg font-semibold dark:text-zinc-100">{t("results.skills_at_risk")}</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {Array.isArray(lens.skills_at_risk) && lens.skills_at_risk.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("results.no_risks")}</p>
              )}
              {Array.isArray(lens.skills_at_risk) &&
                lens.skills_at_risk.map((s: string | LensSkill, i) => {
                  const label = typeof s === "string" ? s : s.skill || String(s);
                  return (
                    <Badge key={`risk-${label}-${i}`} className="bg-rose-100 text-rose-800 dark:bg-rose-800 dark:text-rose-100">
                      {titleCase(label)}
                    </Badge>
                  );
                })}
            </div>

            <h3 className="mb-3 mt-2 text-lg font-semibold dark:text-zinc-100">{t("results.durable_skills")}</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {Array.isArray(lens.durable_skills) && lens.durable_skills.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("results.no_durable")}</p>
              )}
              {Array.isArray(lens.durable_skills) &&
                lens.durable_skills.map((s) => (
                  <Badge key={`durable-${s.skill}`} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    <div className="flex items-center gap-2">
                      <span>{titleCase(s.skill)}</span>
                      {typeof s.risk_score === "number" && (
                        <span className="ml-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">{s.risk_score.toFixed(1)}%</span>
                      )}
                    </div>
                  </Badge>
                ))}
            </div>

            <h3 className="mb-3 mt-2 text-lg font-semibold dark:text-zinc-100">{t("results.resilience_pathways")}</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {Array.isArray(lens.resilience_pathways) && lens.resilience_pathways.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("results.no_resilience")}</p>
              )}
              {Array.isArray(lens.resilience_pathways) &&
                lens.resilience_pathways.map((s) => (
                  <Badge key={`res-${s.skill}`} className="bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                    <div className="flex items-center gap-2">
                      <span>{titleCase(s.skill)}</span>
                      {typeof s.risk_score === "number" && (
                        <span className="ml-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">{s.risk_score.toFixed(1)}%</span>
                      )}
                    </div>
                  </Badge>
                ))}
            </div>
          </>
        )}

        <h3 className="mb-3 mt-6 text-lg font-semibold dark:text-zinc-100">{t("results.occupations_title")}</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {occupations &&
            Object.keys(occupations).length > 0 &&
            Object.entries(occupations).map(([name, info], idx) => {
              return (
                <Card key={`${name}-${idx}`} className="relative flex flex-col gap-3 p-4 shadow-sm hover:shadow-md dark:shadow-none">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">{titleCase(name)}</div>
                    </div>
                    <div className="ml-auto flex items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900">
                        <div className="text-sm font-semibold text-sky-700 dark:text-sky-200">{formatRawPercentage(info?.matching_percentage)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">{info?.description || t("results.role_description")}</div>
                </Card>
              );
            })}
          {(!occupations || Object.keys(occupations).length === 0) && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("results.no_occupations")}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
