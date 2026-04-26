"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useI18n } from '@/lib/i18n'

type Props = {
  onAnalyze: (text: string, country: string) => void;
};

export default function SkillInput({ onAnalyze }: Props) {
  const [text, setText] = useState("");
  const [country, setCountry] = useState("US");
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

      <div className="mt-5 flex items-end gap-4">
        <div className="w-48">
          <Select value={country} onChange={(e) => setCountry(e.target.value)} label="Country">
            <option value="US">{t('country.US')}</option>
            <option value="MX">{t('country.MX')}</option>
          </Select>
        </div>
        <div className="ml-auto w-48">
          <Button
            className="w-full bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-zinc-200 h-10 px-3 py-2 rounded-lg text-sm"
            onClick={() => {
              onAnalyze(text, country);
              setText("");
            }}
          >
            {t('skill.analyze')}
          </Button>
        </div>
      </div>
    </div>
  );
}
