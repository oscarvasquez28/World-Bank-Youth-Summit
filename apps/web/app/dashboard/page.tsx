"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { COUNTRIES, findCountry } from "@/lib/countries";

type DashboardData = {
  country_name: string;
  macro_indicators: Record<string, number | null>;
  education_landscape: Record<string, Record<string, number>>;
  resilience_index: number;
};

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: DashboardData }
  | { status: "error"; message: string };

const ML_BASE = (process.env.NEXT_PUBLIC_ML_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

async function fetchAggregate(country_code: string): Promise<DashboardData> {
  const res = await fetch(`${ML_BASE}/api/dashboard/aggregate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ country_code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any)?.detail || `HTTP ${res.status}`);
  }
  return data as DashboardData;
}

function formatNumber(value: number | null | undefined, opts: { decimals?: number; suffix?: string } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const { decimals = 1, suffix = "" } = opts;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: decimals })}${suffix}`;
}

const INDICATOR_META: Record<string, { i18nKey: string; suffix?: string; decimals?: number }> = {
  broadband_penetration: { i18nKey: "dashboard.ind.broadband_penetration", suffix: "", decimals: 1 },
  internet_users_pct: { i18nKey: "dashboard.ind.internet_users_pct", suffix: "%", decimals: 1 },
  mobile_cellular_subs: { i18nKey: "dashboard.ind.mobile_cellular_subs", suffix: "", decimals: 1 },
  gdp_per_capita_ppp: { i18nKey: "dashboard.ind.gdp_per_capita_ppp", suffix: "", decimals: 0 },
  unemployment_youth: { i18nKey: "dashboard.ind.unemployment_youth", suffix: "%", decimals: 1 },
  labor_force_participation: { i18nKey: "dashboard.ind.labor_force_participation", suffix: "%", decimals: 1 },
  school_enrollment_tertiary: { i18nKey: "dashboard.ind.school_enrollment_tertiary", suffix: "%", decimals: 1 },
};

// ───────────────────────── Country Selector ─────────────────────────

function CountrySelect({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (code: string) => void;
  label: string;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = findCountry(value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg leading-none">{selected?.flag ?? "🌐"}</span>
          <span className="font-medium">{selected?.name ?? t("dashboard.select_country")}</span>
          <span className="text-xs text-zinc-500">{selected?.code}</span>
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-zinc-900">
          <div className="p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.search_country")}
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-zinc-800"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1 text-sm">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-zinc-500">{t("dashboard.no_matches")}</li>
            )}
            {filtered.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-indigo-50 dark:hover:bg-zinc-800 ${
                    c.code === value ? "bg-indigo-50 dark:bg-zinc-800" : ""
                  }`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="font-mono text-xs text-zinc-500">{c.code}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Resilience Gauge ─────────────────────────

function ResilienceGauge({ value, loading }: { value?: number; loading?: boolean }) {
  const { t } = useI18n();
  const v = Math.max(0, Math.min(100, value ?? 0));
  const radius = 80;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference * (1 - v / 100);
  const tone = v >= 70 ? "#10b981" : v >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <Card className="flex flex-col items-center p-6">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {t("dashboard.resilience_gauge")}
      </h3>
      <div className="relative">
        <svg width="220" height="130" viewBox="0 0 220 130">
          <path
            d="M 20 110 A 80 80 0 0 1 200 110"
            fill="none"
            stroke="currentColor"
            className="text-neutral-200 dark:text-zinc-700"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {!loading && (
            <path
              d="M 20 110 A 80 80 0 0 1 200 110"
              fill="none"
              stroke={tone}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
            />
          )}
        </svg>
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-neutral-200 dark:bg-zinc-700" />
          ) : (
            <>
              <span className="text-3xl font-extrabold tabular-nums" style={{ color: tone }}>
                {v.toFixed(1)}
              </span>
              <span className="text-xs text-zinc-500">/ 100</span>
            </>
          )}
        </div>
      </div>
      <p className="mt-3 max-w-xs text-center text-xs text-zinc-500 dark:text-zinc-400">
        {t("dashboard.resilience_help")}
      </p>
    </Card>
  );
}

// ───────────────────────── Education Chart ─────────────────────────

function EducationChart({
  landscape,
  loading,
}: {
  landscape?: Record<string, Record<string, number>>;
  loading?: boolean;
}) {
  const { t } = useI18n();
  if (loading) return <SkeletonCard rows={4} />;
  const years = landscape ? Object.keys(landscape).sort() : [];
  if (!landscape || years.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t("dashboard.education_transition")}
        </h3>
        <p className="mt-3 text-sm text-zinc-500">{t("dashboard.no_projection")}</p>
      </Card>
    );
  }

  // collect categories
  const categorySet = new Set<string>();
  years.forEach((y) => Object.keys(landscape[y] || {}).forEach((k) => categorySet.add(k)));
  const categories = Array.from(categorySet);

  const palette = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#ef4444", "#64748b"];

  // chart dims
  const W = 560;
  const H = 240;
  const padding = { top: 20, right: 20, bottom: 36, left: 40 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;
  const groupCount = years.length;
  const groupGap = 24;
  const barGroupW = (chartW - groupGap * (groupCount - 1)) / groupCount;
  const barW = barGroupW / Math.max(1, categories.length);

  const allValues = years.flatMap((y) => Object.values(landscape[y] || {}));
  const maxVal = Math.max(1, ...allValues);

  return (
    <Card className="overflow-hidden p-6">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {t("dashboard.education_transition_long")}
      </h3>
      <div className="overflow-x-auto">
        <svg width={W} height={H} className="text-zinc-400">
          {/* y axis grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = padding.top + chartH * (1 - t);
            return (
              <g key={i}>
                <line x1={padding.left} x2={W - padding.right} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.15" />
                <text x={padding.left - 6} y={y + 3} textAnchor="end" fontSize="10" fill="currentColor">
                  {(maxVal * t).toFixed(0)}
                </text>
              </g>
            );
          })}

          {years.map((year, gi) => {
            const groupX = padding.left + gi * (barGroupW + groupGap);
            return (
              <g key={year}>
                {categories.map((cat, ci) => {
                  const val = landscape[year]?.[cat] ?? 0;
                  const h = (val / maxVal) * chartH;
                  const x = groupX + ci * barW;
                  const y = padding.top + chartH - h;
                  return (
                    <rect
                      key={cat}
                      x={x}
                      y={y}
                      width={Math.max(2, barW - 2)}
                      height={h}
                      fill={palette[ci % palette.length]}
                      rx="2"
                    >
                      <title>{`${cat} (${year}): ${val.toFixed(1)}`}</title>
                    </rect>
                  );
                })}
                <text
                  x={groupX + barGroupW / 2}
                  y={H - padding.bottom + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fill="currentColor"
                  className="text-zinc-600 dark:text-zinc-300"
                >
                  {year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
        {categories.map((cat, i) => (
          <span key={cat} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: palette[i % palette.length] }}
            />
            {cat}
          </span>
        ))}
      </div>
    </Card>
  );
}

// ───────────────────────── Macro Stat Cards ─────────────────────────

function MacroStatCards({
  indicators,
  loading,
  comparedTo,
}: {
  indicators?: Record<string, number | null>;
  loading?: boolean;
  comparedTo?: Record<string, number | null>;
}) {
  const { t } = useI18n();
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} rows={2} compact />
        ))}
      </div>
    );
  }
  if (!indicators) return null;

  const entries = Object.entries(INDICATOR_META);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(([key, meta]) => {
        const val = indicators[key];
        const compare = comparedTo?.[key];
        let delta: number | null = null;
        if (typeof val === "number" && typeof compare === "number" && compare !== 0) {
          delta = ((val - compare) / Math.abs(compare)) * 100;
        }
        const up = (delta ?? 0) > 0.5;
        const down = (delta ?? 0) < -0.5;

        return (
          <Card key={key} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t(meta.i18nKey)}
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {formatNumber(val, { decimals: meta.decimals, suffix: meta.suffix })}
              </span>
              {delta !== null && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    up ? "text-emerald-600" : down ? "text-rose-600" : "text-zinc-500"
                  }`}
                >
                  {up ? "▲" : down ? "▼" : "•"}
                  {Math.abs(delta).toFixed(1)}%
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ───────────────────────── Skeleton ─────────────────────────

function SkeletonCard({ rows = 3, compact = false }: { rows?: number; compact?: boolean }) {
  const { t } = useI18n();
  return (
    <Card className={compact ? "p-4" : "p-6"}>
      <div className="mb-3 h-3 w-32 animate-pulse rounded bg-neutral-200 dark:bg-zinc-700" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-neutral-100 dark:bg-zinc-800" />
        ))}
      </div>
      {!compact && (
        <p className="mt-3 text-[11px] uppercase tracking-wider text-zinc-400">
          {t("dashboard.calibrating")}
        </p>
      )}
    </Card>
  );
}

// ───────────────────────── Page ─────────────────────────

export default function DashboardPage() {
  const { t } = useI18n();
  const [country, setCountry] = useState("MEX");
  const [compareCountry, setCompareCountry] = useState("USA");
  const [compareOn, setCompareOn] = useState(false);
  const [primary, setPrimary] = useState<FetchState>({ status: "idle" });
  const [secondary, setSecondary] = useState<FetchState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    setPrimary({ status: "loading" });
    fetchAggregate(country)
      .then((data) => !cancelled && setPrimary({ status: "ready", data }))
      .catch((e) => !cancelled && setPrimary({ status: "error", message: e?.message || "Failed" }));
    return () => {
      cancelled = true;
    };
  }, [country]);

  useEffect(() => {
    if (!compareOn) {
      setSecondary({ status: "idle" });
      return;
    }
    let cancelled = false;
    setSecondary({ status: "loading" });
    fetchAggregate(compareCountry)
      .then((data) => !cancelled && setSecondary({ status: "ready", data }))
      .catch((e) => !cancelled && setSecondary({ status: "error", message: e?.message || "Failed" }));
    return () => {
      cancelled = true;
    };
  }, [compareCountry, compareOn]);

  const primaryData = primary.status === "ready" ? primary.data : undefined;
  const secondaryData = secondary.status === "ready" ? secondary.data : undefined;
  const primaryLoading = primary.status === "loading";

  return (
    <div className="flex min-h-screen items-start bg-transparent p-8 pt-16 font-sans">
      <main className="mx-auto w-full max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <header className="mb-6">
            <h1 className="text-3xl font-extrabold">{t("dashboard.title")}</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{t("dashboard.subtitle")}</p>
          </header>

          {/* Controls */}
          <Card className="mb-6 p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
              <CountrySelect
                value={country}
                onChange={setCountry}
                label={t("dashboard.country")}
              />
              <div className="flex items-end justify-center pb-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={compareOn}
                    onChange={(e) => setCompareOn(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {t("dashboard.compare")}
                </label>
              </div>
              <div className={compareOn ? "" : "pointer-events-none opacity-40"}>
                <CountrySelect
                  value={compareCountry}
                  onChange={setCompareCountry}
                  label={t("dashboard.compare_country")}
                />
              </div>
            </div>
            {primary.status === "error" && (
              <div className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-900/30 dark:text-rose-200">
                {primary.message}
              </div>
            )}
          </Card>

          {/* Top row: gauge + macro stats */}
          <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_2fr]">
            <ResilienceGauge value={primaryData?.resilience_index} loading={primaryLoading} />
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t("dashboard.macro")} —{" "}
                <span className="text-zinc-700 dark:text-zinc-200">
                  {primaryData?.country_name ?? findCountry(country)?.name}
                </span>
              </h2>
              <MacroStatCards
                indicators={primaryData?.macro_indicators}
                loading={primaryLoading}
                comparedTo={secondaryData?.macro_indicators}
              />
            </div>
          </div>

          {/* Education chart */}
          <div className="mb-6">
            <EducationChart landscape={primaryData?.education_landscape} loading={primaryLoading} />
          </div>

          {/* Comparison panel */}
          {compareOn && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <header className="mb-3 flex items-center gap-2">
                  <span className="text-2xl">{findCountry(country)?.flag}</span>
                  <div>
                    <h3 className="font-semibold">{primaryData?.country_name ?? findCountry(country)?.name}</h3>
                    <p className="text-xs text-zinc-500">{country}</p>
                  </div>
                  <span className="ml-auto rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                    {primaryLoading
                      ? "…"
                      : `${t("dashboard.resilience")} ${primaryData?.resilience_index?.toFixed(1) ?? "—"}`}
                  </span>
                </header>
                <MacroStatCards indicators={primaryData?.macro_indicators} loading={primaryLoading} />
              </Card>
              <Card className="p-5">
                <header className="mb-3 flex items-center gap-2">
                  <span className="text-2xl">{findCountry(compareCountry)?.flag}</span>
                  <div>
                    <h3 className="font-semibold">
                      {secondaryData?.country_name ?? findCountry(compareCountry)?.name}
                    </h3>
                    <p className="text-xs text-zinc-500">{compareCountry}</p>
                  </div>
                  <span className="ml-auto rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
                    {secondary.status === "loading"
                      ? "…"
                      : `${t("dashboard.resilience")} ${secondaryData?.resilience_index?.toFixed(1) ?? "—"}`}
                  </span>
                </header>
                <MacroStatCards
                  indicators={secondaryData?.macro_indicators}
                  loading={secondary.status === "loading"}
                  comparedTo={primaryData?.macro_indicators}
                />
                {secondary.status === "error" && (
                  <p className="mt-3 text-sm text-rose-600">{secondary.message}</p>
                )}
              </Card>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-zinc-400">
            {t("dashboard.source")}
          </p>
        </motion.div>
      </main>
    </div>
  );
}
