"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/spinner";
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseSkills = (text: string) => Array.from(
    new Set(
      text
        .split(/[,\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !email || !password) {
      setError("Please complete all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, skills: parseSkills(skillsText) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Register failed');

      try {
        const { user } = data as any;
        if (user) {
          const auth = await import('@/lib/auth');
          auth.setUser(user);
          toast.success('Account created — signed in');
        }
      } catch (e) {
        console.warn('Failed to persist user locally', e);
      }

      router.push('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Register failed');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow">
        <h2 className="mb-2 text-2xl font-semibold">Create your account</h2>
        <p className="mb-6 text-sm text-zinc-600">Sign up to save your path and get better suggestions.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

          <div>
            <label className="mb-2 block text-sm font-medium">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm shadow-sm"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm shadow-sm"
              placeholder="you@domain.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Skills (comma-separated)</label>
            <textarea
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm shadow-sm min-h-[84px]"
              placeholder="Excel, Customer Service, Data Analysis"
            />
          </div>

          <div className="flex items-center justify-between">
            <Link href="/signin" className="text-sm text-indigo-600">Already have an account?</Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-neutral-900"
              disabled={loading}
            >
              {loading ? <Spinner size={16} /> : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
