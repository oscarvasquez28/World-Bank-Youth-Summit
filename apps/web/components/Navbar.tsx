"use client";

import React from "react";
import Avatar from "@/components/ui/avatar";

export default function Navbar() {
  return (
    <header className="w-full">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <svg width="290" height="56" viewBox="0 0 290 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="h-10 w-auto">
            <g transform="translate(8 8)">
              <path d="M24 4 L32 20 L24 36 L16 20 Z" fill="#4f46e5" />
              <circle cx="24" cy="20" r="18" stroke="#6366f1" strokeWidth="4" />
              <circle cx="24" cy="20" r="6" fill="#1e2937" />
              <path d="M24 8 L24 32" stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round" />
            </g>
            <text x="70" y="39" fontFamily="Inter, system-ui, sans-serif" fontSize="37" fontWeight="700" letterSpacing="-0.035em" fill="#0f172a">UNMAPPED</text>
          </svg>
        </div>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-zinc-700">
          <a className="text-indigo-600 font-medium" href="#">Discover</a>
          <a href="#">My Path</a>
          <a href="#">Opportunities</a>
          <a href="#">For Companies</a>
        </nav>

        <div className="flex items-center gap-4">
          <button className="hidden sm:inline-flex rounded-md border px-3 py-1 text-sm">View details</button>
          <div className="hidden sm:block">
            <Avatar initials="OS" />
          </div>
        </div>
      </div>
    </header>
  );
}
