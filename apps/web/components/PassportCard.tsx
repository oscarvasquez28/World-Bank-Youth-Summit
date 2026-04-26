"use client";

import React, { useState } from "react";

type Alignment = {
  name?: string;
  description?: string;
  targetName?: string;
  targetUrl?: string;
  targetFramework?: string;
};

type Credential = {
  id?: string;
  issuanceDate?: string;
  issuer?: { name?: string; image?: string } | string;
  credentialSubject?: {
    id?: string;
    achievement?: {
      name?: string;
      description?: string;
      alignment?: Alignment[];
    };
  };
  [k: string]: any;
};

export default function PassportCard({ credential }: { credential: Credential }) {
  const [copied, setCopied] = useState(false);
  const [meta, setMeta] = useState<Record<string, any>>({});
  const [loadingMeta, setLoadingMeta] = useState<Record<string, boolean>>({});

  if (!credential) return null;

  const normalizedCredential = (credential && typeof credential === "object" && credential.credential)
    ? credential.credential
    : credential;

  const achievement = normalizedCredential?.credentialSubject?.achievement;
  const issuer =
    typeof normalizedCredential?.issuer === "string"
      ? { name: normalizedCredential.issuer }
      : normalizedCredential?.issuer ?? achievement?.issuer ?? {};

  async function fetchMeta(url: string) {
    if (!url || meta[url]) return;
    try {
      setLoadingMeta((prev) => ({ ...prev, [url]: true }));
      const res = await fetch(url);
      const data = await res.json();
      setMeta((prev) => ({ ...prev, [url]: data }));
    } catch (_e) {
      setMeta((prev) => ({ ...prev, [url]: { error: "failed to load" } }));
    } finally {
      setLoadingMeta((prev) => ({ ...prev, [url]: false }));
    }
  }

  function handleDownload() {
    const blob = new Blob([JSON.stringify(normalizedCredential, null, 2)], { type: "application/ld+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const name = normalizedCredential?.id
      ? `skills_passport_${String(normalizedCredential.id).split("/").pop()}.jsonld`
      : "skills_passport.jsonld";
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    const link = normalizedCredential?.id || "";
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) {
      // ignore
    }
  }

  return (
    <div className="max-w-xl bg-white dark:bg-slate-800 shadow-md rounded-lg p-6">
      <div className="flex items-start gap-4">
        {issuer.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={issuer.image} alt={issuer.name || "issuer"} className="w-16 h-16 object-contain rounded" />
        ) : (
          <div className="w-16 h-16 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2L20 6v6c0 5-3.6 9.7-8 11-4.4-1.3-8-6-8-11V6l8-4z" fill="#CBD5E1" /></svg>
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{achievement?.name || "Skills Passport"}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{achievement?.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500 dark:text-slate-400">{issuer?.name}</div>
              <div className="text-xs text-slate-400">{normalizedCredential?.issuanceDate ? new Date(normalizedCredential.issuanceDate).toLocaleDateString() : ""}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {(achievement?.alignment || []).map((a, idx) => {
                const skillLabel = a.name || a.targetName || "skill";
                const key = a.targetUrl || `${skillLabel}-${idx}`;
                const metaKey = a.targetUrl || "";
                const metaValue = metaKey ? meta[metaKey] : null;
                const isLoading = metaKey ? loadingMeta[metaKey] : false;
                return (
                  <div key={key} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-3 py-1 rounded">
                    <span className="text-sm">{skillLabel}</span>
                    {a.description ? (
                      <button title={a.description} className="text-xs text-slate-500 dark:text-slate-300">i</button>
                    ) : a.targetFramework ? (
                      <button title={`Framework: ${a.targetFramework}`} className="text-xs text-slate-500 dark:text-slate-300">i</button>
                    ) : null}
                    {a.targetUrl ? (
                      <button onClick={() => fetchMeta(a.targetUrl as string)} className="ml-1 text-xs text-blue-600 dark:text-blue-400">fetch</button>
                    ) : null}
                    {metaValue ? (
                      <div className="ml-2 text-xs text-slate-500 dark:text-slate-300">{metaValue.prefLabel || metaValue.label || JSON.stringify(metaValue)}</div>
                    ) : isLoading ? (
                      <div className="ml-2 text-xs text-slate-500">loading...</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button onClick={handleDownload} className="px-3 py-1 bg-slate-800 text-white rounded">Download Digital Passport</button>
            <button onClick={handleShare} className="px-3 py-1 border rounded">{copied ? "Copied!" : "Share Verification Link"}</button>
            {normalizedCredential?.id ? (
              <a href={normalizedCredential.id} target="_blank" rel="noreferrer" className="ml-auto text-sm text-blue-600 dark:text-blue-400">View Source</a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
