"use client";

import React from "react";
import { Select } from "@/components/ui/select";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function CountrySelector({ value, onChange }: Props) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} label="Country">
      <option value="US">US</option>
      <option value="MX">MX</option>
    </Select>
  );
}
