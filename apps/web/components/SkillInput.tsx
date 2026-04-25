"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Props = {
  onAnalyze: (text: string, country: string) => void;
};

export default function SkillInput({ onAnalyze }: Props) {
  const [text, setText] = useState("");
  const [country, setCountry] = useState("US");

  return (
    <div className="w-full max-w-2xl">
      <Textarea
        label="Describe your skills"
        placeholder="I help customers and use Excel to build reports..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="mt-4 flex gap-3">
        <div className="w-40">
          <Select value={country} onChange={(e) => setCountry(e.target.value)} label="Country">
            <option value="US">US</option>
            <option value="MX">MX</option>
          </Select>
        </div>

        <div className="flex-1">
          <Button
            className="w-full bg-black text-white hover:bg-black/90"
            onClick={() => onAnalyze(text, country)}
          >
            Analyze
          </Button>
        </div>
      </div>
    </div>
  );
}
