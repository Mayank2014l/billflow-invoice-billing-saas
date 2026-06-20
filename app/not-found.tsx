"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-lg space-y-6">
        <div className="h-16 w-16 bg-violet-100 dark:bg-violet-950/40 rounded-full flex items-center justify-center text-violet-650 dark:text-violet-400 mx-auto">
          <AlertTriangle className="h-8 w-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">404</h1>
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Page Not Found</h2>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs leading-relaxed">
            The page you are looking for does not exist, has been moved, or you might not have authorization to view it.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.25 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm shadow-violet-100 dark:shadow-none active:scale-97 transition-all cursor-pointer"
          >
            Go to Dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.25 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-97 transition-all cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
