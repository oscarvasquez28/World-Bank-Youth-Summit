"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import PassportCard from "@/components/PassportCard";
import { useI18n } from "@/lib/i18n";

type Opportunity = {
  role: string;
  salary?: string;
};

type OccupationInfo = {
  matching_skills?: string[];
  missing_essential_skills?: string[];
  description?: string;
  matching_percentage?: number;
  isced_level?: number;
  opportunity_type?: string;
  sector_growth?: number | null;
  wage_signal?: number | null;
};

type LensSkill = { skill: string; risk_score?: number };

type Lens = {
  skills_at_risk?: string[] | LensSkill[];
  durable_skills?: LensSkill[];
  resilience_pathways?: LensSkill[];
  credential?: Record<string, any>;
  passport?: Record<string, any>;
  jsonld?: Record<string, any>;
  credentials?: Array<Record<string, any>>;
};

type Props = {
  skills: string[];
  opportunities: Opportunity[];
  lens?: Lens | null;
  occupations?: Record<string, OccupationInfo> | null;
  credential?: Record<string, any> | null;
  education?: number | null;
};

const titleCase = (v: string) =>
  String(v || "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
const formatRawPercentage = (v?: number) => (typeof v === "number" ? `${Number(v.toFixed(2))}%` : "-");
const formatSignedPercentage = (v?: number | null) =>
  typeof v === "number" ? `${v > 0 ? "+" : ""}${Number(v.toFixed(2))}%` : null;
const formatWageSignal = (v?: number | null) => {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return `$${Math.round(v).toLocaleString()}/mo`;
};

function extractCredential(lens?: Lens | null, credential?: Record<string, any> | null) {
  if (credential && typeof credential === 'object') return credential;
  if (!lens) return null;
  if (lens.credential && typeof lens.credential === 'object') return lens.credential;
  if (lens.passport && typeof lens.passport === 'object') return lens.passport;
  if (lens.jsonld && typeof lens.jsonld === 'object') return lens.jsonld;
  if (Array.isArray(lens.credentials) && lens.credentials[0] && typeof lens.credentials[0] === 'object') return lens.credentials[0];
  return null;
}

export default function Results({ skills, opportunities, lens, occupations, credential }: Props) {
  const { t } = useI18n();
  const passportCredential = extractCredential(lens, credential);
  
  const iscedLabel = (lvl?: number | null) => {
    if (lvl === null || typeof lvl !== 'number') return '-';
    const map: Record<number, string> = {
      0: t('education.options.ISCED_0'),
      1: t('education.options.ISCED_1'),
      2: t('education.options.ISCED_2'),
      3: t('education.options.ISCED_3'),
      4: t('education.options.ISCED_4'),
      5: t('education.options.ISCED_5'),
      6: t('education.options.ISCED_6'),
      7: t('education.options.ISCED_7'),
      8: t('education.options.ISCED_8'),
    };
    return map[lvl] || String(lvl);
  };

  return (
    <div className="mt-8 w-full">
      <Card>
        {passportCredential && (
          <div className="mb-6">
            <PassportCard credential={passportCredential} />
          </div>
        )}

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
            Object.entries(occupations).map(([name, info], idx) => (
              <Card key={`${name}-${idx}`} className="relative flex flex-col gap-3 p-4 shadow-sm hover:shadow-md dark:shadow-none">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">{titleCase(name)}</div>
                    {typeof info?.isced_level === 'number' && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('results.isced_required').replace('{{level}}', iscedLabel(info?.isced_level))}</div>
                    )}
                  </div>
                  <div className="ml-auto flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900">
                      <div className="text-sm font-semibold text-sky-700 dark:text-sky-200">{formatRawPercentage(info?.matching_percentage)}</div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">{info?.description || t("results.role_description")}</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(() => {
                    const v = info?.sector_growth;
                    const formatted = formatSignedPercentage(v);
                    const tone =
                      typeof v === "number" && v > 0
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                        : typeof v === "number" && v < 0
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
                    const arrow =
                      typeof v === "number" && v > 0 ? "▲" : typeof v === "number" && v < 0 ? "▼" : "•";
                    return (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${tone}`}>
                        <span aria-hidden>{arrow}</span>
                        {t("results.sector_growth")}: {formatted ?? t("results.no_data")}
                      </span>
                    );
                  })()}
                  {(() => {
                    const formatted = formatWageSignal(info?.wage_signal);
                    return (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                          formatted
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        <span aria-hidden>$</span>
                        {t("results.wage_signal")}: {formatted ?? t("results.no_data")}
                      </span>
                    );
                  })()}
                </div>
                {Array.isArray(info?.missing_essential_skills) && info!.missing_essential_skills!.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t('results.missing_essential_skills')}:</div>
                    <ul className="mt-1 ml-3 list-disc text-sm text-zinc-500 dark:text-zinc-400">
                      {info!.missing_essential_skills!.map((m, i) => (
                        <li key={`${name}-miss-${i}`}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          {(!occupations || Object.keys(occupations).length === 0) && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("results.no_occupations")}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
