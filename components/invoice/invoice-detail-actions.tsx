"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Download, Edit2, Send, CheckCircle, Trash2, Copy, Loader2 
} from "lucide-react";
import { toast } from "sonner";

interface InvoiceDetailActionsProps {
  invoiceId: string;
  number: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "PAID" | "OVERDUE" | "CANCELLED";
  role: "OWNER" | "ADMIN" | "MEMBER";
}

export default function InvoiceDetailActions({
  invoiceId,
  number,
  status,
  role,
}: InvoiceDetailActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"send" | "markPaid" | "delete" | null>(null);

  const canWrite = role === "OWNER" || role === "ADMIN";

  const handleSend = async () => {
    setLoading("send");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success(`Invoice ${number} sent successfully!`);
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to send invoice");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(null);
    }
  };

  const handleMarkPaid = async () => {
    setLoading("markPaid");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success(`Invoice ${number} marked as Paid!`);
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to mark as paid");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete invoice ${number}?`)) return;
    setLoading("delete");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Invoice ${number} deleted.`);
        router.push("/dashboard/invoices");
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(null);
    }
  };

  const handleDuplicate = () => {
    router.push(`/dashboard/invoices/new?duplicateId=${invoiceId}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Edit Draft */}
      {status === "DRAFT" && canWrite && (
        <button
          onClick={() => router.push(`/dashboard/invoices/${invoiceId}/edit`)}
          className="px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Edit2 className="h-3.5 w-3.5" /> Edit
        </button>
      )}

      {/* Send Email */}
      {status === "DRAFT" && canWrite && (
        <button
          onClick={handleSend}
          disabled={loading !== null}
          className="px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {loading === "send" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Send Email
        </button>
      )}

      {/* Mark Paid */}
      {(status === "SENT" || status === "VIEWED" || status === "OVERDUE") && canWrite && (
        <button
          onClick={handleMarkPaid}
          disabled={loading !== null}
          className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-98 disabled:opacity-50"
        >
          {loading === "markPaid" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
          Mark as Paid
        </button>
      )}

      {/* Download PDF */}
      <a
        href={`/api/invoices/${invoiceId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
      >
        <Download className="h-3.5 w-3.5" /> PDF Copy
      </a>

      {/* Duplicate */}
      {canWrite && (
        <button
          onClick={handleDuplicate}
          className="px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Copy className="h-3.5 w-3.5" /> Duplicate
        </button>
      )}

      {/* Delete */}
      {canWrite && (
        <button
          onClick={handleDelete}
          disabled={loading !== null}
          className="px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-semibold text-red-500 hover:text-red-650 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {loading === "delete" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Delete
        </button>
      )}
    </div>
  );
}
