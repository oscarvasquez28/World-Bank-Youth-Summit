"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

type BadgePayload = {
  uid: string;
  recipientName: string;
  recipientId: string;
  skills: string[];
  selectedSkills?: string[];
  opportunities: { role: string }[];
  issuer: { name: string; description: string };
  generatedAt: string;
};

function initials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function BadgePage() {
  const { t } = useI18n();
  const params = useParams<{ uid: string }>();
  const router = useRouter();
  const uid = Array.isArray(params?.uid) ? params.uid[0] : (params?.uid as string | undefined);

  const [data, setData] = useState<BadgePayload | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!uid) {
      setHydrated(true);
      return;
    }
    try {
      const raw = localStorage.getItem(`unmapped:badge:${uid}`);
      if (raw) {
        const parsed = JSON.parse(raw) as BadgePayload;
        setData(parsed);
      }
    } catch (e) {
      console.warn("Failed to read badge from localStorage", e);
    } finally {
      setHydrated(true);
    }
  }, [uid]);

  const issuedDate = useMemo(() => {
    if (!data?.generatedAt) return "";
    try {
      return new Date(data.generatedAt).toLocaleDateString();
    } catch {
      return data.generatedAt;
    }
  }, [data]);

  async function handleShare() {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      if (!url) return;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleDownload() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    triggerDownload(blob, `unmapped-badge-${data.uid}.json`);
  }

  function handleDownloadBlob() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data)], { type: "application/octet-stream" });
    triggerDownload(blob, `unmapped-badge-${data.uid}.blob`);
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-xl dark:border-neutral-700 dark:bg-zinc-900">
          <h1 className="text-2xl font-bold">{t("badge.not_found_title")}</h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{t("badge.not_found_desc")}</p>
          <p className="mt-4 break-all rounded-md bg-zinc-100 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {uid}
          </p>
          <button
            onClick={() => router.push("/opportunities")}
            className="mt-6 inline-flex rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {t("nav.opportunities")}
          </button>
        </div>
      </div>
    );
  }

  const displaySkills = (data.selectedSkills && data.selectedSkills.length > 0
    ? data.selectedSkills
    : data.skills) || [];

  return (
    <div className="flex min-h-screen items-start justify-center px-4 pb-16 pt-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: "100%", maxWidth: "48rem" }}
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-[1px] shadow-2xl">
          <div className="rounded-3xl bg-white dark:bg-zinc-900">
            {/* Header */}
            <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-8 py-10 text-white">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 0, transparent 35%)",
                }}
              />
              <div className="relative flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/80">
                    {data.issuer?.name || "UNMAPPED"}
                  </p>
                  <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
                    {t("badge.title")}
                  </h1>
                  <p className="mt-2 max-w-md text-sm text-white/85">
                    {data.issuer?.description}
                  </p>
                </div>

                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/40" />
                  <svg
                    width="56"
                    height="56"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="relative"
                    aria-hidden
                  >
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Recipient block */}
            <div className="flex items-center gap-4 border-b border-neutral-100 px-8 py-6 dark:border-neutral-800">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white shadow">
                {initials(data.recipientName)}
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t("badge.issued_to")}
                </p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {data.recipientName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t("badge.issued_on")}
                </p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {issuedDate}
                </p>
              </div>
            </div>

            {/* Skills */}
            <div className="px-8 py-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t("badge.skills")}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {displaySkills.length === 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">—</p>
                )}
                {displaySkills.map((s, i) => (
                  <Badge
                    key={`${s}-${i}`}
                    className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Opportunities */}
            {data.opportunities && data.opportunities.length > 0 && (
              <div className="border-t border-neutral-100 px-8 py-6 dark:border-neutral-800">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t("badge.opportunities")}
                </h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {data.opportunities.map((o, i) => (
                    <div
                      key={`${o.role}-${i}`}
                      className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-zinc-800"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-100">
                        {o.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-col gap-4 rounded-b-3xl border-t border-neutral-100 bg-neutral-50 px-8 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-zinc-900/60">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t("badge.uid")}
                </p>
                <p className="mt-1 truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">
                  {data.uid}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={handleShare}
                  className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                >
                  {copied ? t("badge.copied") : t("badge.share")}
                </button>
                <button
                  onClick={handleDownload}
                  className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-indigo-500 hover:to-violet-500"
                >
                  {t("badge.download")}
                </button>
                <button
                  onClick={handleDownloadBlob}
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  {t("badge.download_blob")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
