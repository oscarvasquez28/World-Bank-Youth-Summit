"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useI18n } from '@/lib/i18n'

type Props = {
  onAnalyze: (text: string, country: string, education: number | null) => void;
};

export default function SkillInput({ onAnalyze }: Props) {
  const [text, setText] = useState("");
  const [country, setCountry] = useState("US");
  const [education, setEducation] = useState<number | null>(null);
  const { t } = useI18n();

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Textarea
        label={t('skill.label')}
        placeholder={t('skill.placeholder')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[110px]"
      />

      <div className="mt-5">
        <div className="mb-3 w-full">
          <Select value={country} onChange={(e) => setCountry(e.target.value)} label="Country">
            <option value="US">{t('country.US')}</option>
            <option value="MX">{t('country.MX')}</option>
          </Select>
        </div>

        <div className="mb-3 w-full">
          <label className="text-sm text-zinc-600 dark:text-zinc-300">{t('education.label')}</label>
          <select
            value={education === null ? '' : String(education)}
            onChange={(e) => setEducation(e.target.value === '' ? null : Number(e.target.value))}
            className="mt-2 w-full rounded-md border border-neutral-100 px-3 py-2 text-sm shadow-sm bg-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-neutral-700 dark:bg-zinc-700 dark:text-zinc-100"
          >
            <option value="">{t('education.placeholder')}</option>
            <option value="0">{t('education.options.ISCED_0')}</option>
            <option value="1">{t('education.options.ISCED_1')}</option>
            <option value="2">{t('education.options.ISCED_2')}</option>
            <option value="3">{t('education.options.ISCED_3')}</option>
            <option value="4">{t('education.options.ISCED_4')}</option>
            <option value="5">{t('education.options.ISCED_5')}</option>
            <option value="6">{t('education.options.ISCED_6')}</option>
            <option value="7">{t('education.options.ISCED_7')}</option>
            <option value="8">{t('education.options.ISCED_8')}</option>
          </select>
        </div>

        <div className="flex items-end gap-4">
          <div className="ml-auto w-48">
            <Button
              className="w-full bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-zinc-200 h-10 px-3 py-2 rounded-lg text-sm"
              onClick={() => {
                onAnalyze(text, country, education);
                setText("");
              }}
            >
              {t('skill.analyze')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
