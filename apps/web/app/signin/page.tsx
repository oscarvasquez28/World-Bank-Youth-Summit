"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/spinner";
import { toast } from 'sonner';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      // call backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Sign in failed');

      // save user to localStorage
        try {
          const { user } = data as any;
        if (user) {
          const auth = await import('@/lib/auth');
          auth.setUser(user);
          toast.success('Signed in successfully');
        }
        } catch (e) {
          console.warn('Failed to persist user locally', e);
        }

        // success: redirect to home
        router.push('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Sign in failed');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow">
        <h2 className="mb-2 text-2xl font-semibold">Sign in to UNMAPPED</h2>
        <p className="mb-6 text-sm text-zinc-600">Enter your email and password to continue.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

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

          <div className="flex items-center justify-between">
            <Link href="/register" className="text-sm text-indigo-600">Create account</Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-neutral-900"
              disabled={loading}
            >
              {loading ? <Spinner size={16} /> : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
