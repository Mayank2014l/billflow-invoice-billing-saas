"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-lg space-y-6">
        <div className="h-16 w-16 bg-rose-100 dark:bg-rose-950/40 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
          <AlertCircle className="h-8 w-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Something went wrong!</h2>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs leading-relaxed">
            An unexpected error occurred during execution. Our engineering team has been notified.
          </p>
          {error.digest && (
            <p className="text-[9px] font-mono text-zinc-400 select-all">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.25 text-xs font-bold text-white bg-violet-650 hover:bg-violet-750 rounded-lg shadow-sm shadow-violet-100 dark:shadow-none active:scale-97 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Try Again
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.25 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-97 transition-all cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" /> Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}
