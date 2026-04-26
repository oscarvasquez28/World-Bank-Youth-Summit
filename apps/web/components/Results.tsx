"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import PassportCard from "@/components/PassportCard";
import { useI18n } from '@/lib/i18n'

type Opportunity = {
  role: string;
  salary?: string;
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
  credential?: Record<string, any>;
  passport?: Record<string, any>;
  jsonld?: Record<string, any>;
  credentials?: Array<Record<string, any>>;
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

export default function Results({ skills, opportunities, lens, credential }: Props & { lens?: Lens | null; credential?: Record<string, any> | null }) {
  const { t } = useI18n();
  const passportCredential = extractCredential(lens, credential);

  return (
    <div className="mt-8 w-full">
      <Card>
        {passportCredential && (
          <div className="mb-6">
            <PassportCard credential={passportCredential} />
          </div>
        )}

        <h3 className="mb-3 text-lg font-semibold dark:text-zinc-100">{t('results.detected')}</h3>
        <div className="mb-4 flex flex-wrap gap-2">
          {skills.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('results.no_skills')}</p>}
          {skills.map((s, idx) => (
            <Badge key={`${s}-${idx}`}>{s}</Badge>
          ))}
        </div>

        {/* Lens sections (skills at risk, durable skills, resilience pathways) */}
        {lens && (
          <>
            <h3 className="mb-3 mt-2 text-lg font-semibold dark:text-zinc-100">{t('results.skills_at_risk') || 'Skills At Risk'}</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {Array.isArray(lens.skills_at_risk) && lens.skills_at_risk.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('results.no_risks') || 'No skills at risk identified.'}</p>
              )}
              {Array.isArray(lens.skills_at_risk) && lens.skills_at_risk.map((s: any, i) => {
                const label = typeof s === 'string' ? s : s.skill || String(s);
                return (
                  <Badge key={`risk-${label}-${i}`} className="bg-rose-100 text-rose-800 dark:bg-rose-800 dark:text-rose-100">
                    {label}
                  </Badge>
                );
              })}
            </div>

            <h3 className="mb-3 mt-2 text-lg font-semibold dark:text-zinc-100">{t('results.durable_skills') || 'Durable Skills'}</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {Array.isArray(lens.durable_skills) && lens.durable_skills.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('results.no_durable') || 'No durable skills identified.'}</p>
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
            </div>

            <h3 className="mb-3 mt-2 text-lg font-semibold dark:text-zinc-100">{t('results.resilience_pathways') || 'Resilience Pathways'}</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {Array.isArray(lens.resilience_pathways) && lens.resilience_pathways.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('results.no_resilience') || 'No resilience pathways identified.'}</p>
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
            </div>
          </>
        )}

        <h3 className="mb-3 mt-2 text-lg font-semibold dark:text-zinc-100">{t('results.suggested')}</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {opportunities.map((o, idx) => (
            <div key={`${o.role}-${idx}`}>
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
            </div>
          ))}
          {opportunities.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('results.no_opps')}</p>}
        </div>
      </Card>
    </div>
  );
}
