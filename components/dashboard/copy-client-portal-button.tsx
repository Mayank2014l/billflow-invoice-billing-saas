"use client";

import React, { useState } from "react";
import { Copy, Check, Globe } from "lucide-react";
import { toast } from "sonner";

export default function CopyClientPortalButton({ portalToken }: { portalToken: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const portalUrl = `${window.location.origin}/client-portal/${portalToken}`;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    toast.success("Portal link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-650" /> : <Globe className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Portal Link"}
    </button>
  );
}
