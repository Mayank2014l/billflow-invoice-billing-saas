"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, Search, Receipt, ArrowRight, Download, Edit2, 
  Trash2, CheckCircle, Send, MoreHorizontal, ChevronRight, Loader2, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { useOrg } from "@/hooks/use-org";

interface Invoice {
  id: string;
  number: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "PAID" | "OVERDUE" | "CANCELLED";
  issueDate: string;
  dueDate: string;
  total: number;
  client: {
    name: string;
    email: string;
  };
}

export default function InvoicesPage() {
  const router = useRouter();
  const { activeOrg } = useOrg();
  const { canCreateEditInvoices } = usePermissions();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/invoices", window.location.origin);
      if (statusFilter !== "ALL") {
        url.searchParams.set("status", statusFilter);
      }
      if (searchQuery.trim() !== "") {
        url.searchParams.set("search", searchQuery);
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error("Failed to load invoices", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, searchQuery, activeOrg]);

  const handleMarkPaid = async (id: string, number: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/invoices/${id}/mark-paid`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success(`Invoice ${number} marked as Paid!`);
        fetchInvoices();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to mark as paid");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendInvoice = async (id: string, number: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/invoices/${id}/send`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success(`Invoice ${number} sent successfully!`);
        fetchInvoices();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to send invoice");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${number}?`)) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Invoice ${number} deleted.`);
        fetchInvoices();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-50 text-green-750 border-green-200/50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/40";
      case "SENT":
        return "bg-blue-50 text-blue-750 border-blue-200/50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/40";
      case "OVERDUE":
        return "bg-red-50 text-red-750 border-red-200/50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40";
      case "VIEWED":
        return "bg-yellow-50 text-yellow-750 border-yellow-200/50 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-850/40";
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your billing ledger, drafts, and client distributions
          </p>
        </div>

        {canCreateEditInvoices && (
          <Link
            href="/dashboard/invoices/new"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-violet-500/10 flex items-center gap-1.5 transition-all active:scale-98"
          >
            <Plus className="h-4 w-4" /> Create Invoice
          </Link>
        )}
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto border border-zinc-150 dark:border-zinc-800 p-1 rounded-lg">
          {["ALL", "DRAFT", "SENT", "PAID", "OVERDUE"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${
                statusFilter === status 
                  ? "bg-violet-600 text-white" 
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by client or invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>

      </div>

      {/* Invoices List Content */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b last:border-0 border-zinc-100 dark:border-zinc-805 pb-4 last:pb-0 animate-pulse">
              <div className="space-y-2">
                <div className="h-4.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-850 rounded" />
              </div>
              <div className="h-6 w-20 bg-zinc-250 dark:bg-zinc-800 rounded-full" />
            </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/50 rounded-2xl flex items-center justify-center mb-6">
            <Receipt className="h-8 w-8 text-violet-500" />
          </div>
          <h3 className="text-lg font-bold">No Invoices Found</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm text-sm">
            {searchQuery 
              ? "We couldn't find any invoices matching your search parameters." 
              : "Generate invoices, customize branding configurations, and dispatch them to your clients."}
          </p>
          {canCreateEditInvoices && !searchQuery && (
            <Link
              href="/dashboard/invoices/new"
              className="mt-6 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-98"
            >
              <Plus className="h-4 w-4" /> Create Your First Invoice
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-850/50 text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800">
                <tr>
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Issued</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800/80 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                    <td 
                      onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                      className="p-4 font-bold text-violet-600 dark:text-violet-400 cursor-pointer hover:underline"
                    >
                      {inv.number}
                    </td>
                    <td className="p-4">
                      <div>{inv.client?.name}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{inv.client?.email}</div>
                    </td>
                    <td className="p-4 text-zinc-500">
                      {new Date(inv.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="p-4 text-zinc-500">
                      {new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="p-4 text-right font-bold text-zinc-800 dark:text-zinc-200">
                      {activeOrg?.currency} {inv.total.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${getStatusStyle(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                          className="p-1.5 text-zinc-500 hover:text-violet-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="View Details"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>

                        {/* Edit Draft */}
                        {inv.status === "DRAFT" && canCreateEditInvoices && (
                          <button
                            onClick={() => router.push(`/dashboard/invoices/${inv.id}/edit`)}
                            className="p-1.5 text-zinc-500 hover:text-violet-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Edit Draft"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Send Email */}
                        {inv.status === "DRAFT" && canCreateEditInvoices && (
                          <button
                            onClick={() => handleSendInvoice(inv.id, inv.number)}
                            disabled={actionLoadingId === inv.id}
                            className="p-1.5 text-zinc-500 hover:text-violet-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            title="Send Email"
                          >
                            {actionLoadingId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          </button>
                        )}

                        {/* Mark Paid */}
                        {inv.status === "SENT" && canCreateEditInvoices && (
                          <button
                            onClick={() => handleMarkPaid(inv.id, inv.number)}
                            disabled={actionLoadingId === inv.id}
                            className="p-1.5 text-zinc-500 hover:text-green-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            title="Mark as Paid"
                          >
                            {actionLoadingId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          </button>
                        )}

                        {/* Download PDF */}
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-zinc-500 hover:text-violet-650 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </a>

                        {/* Delete */}
                        {canCreateEditInvoices && (
                          <button
                            onClick={() => handleDelete(inv.id, inv.number)}
                            disabled={actionLoadingId === inv.id}
                            className="p-1.5 text-zinc-550 hover:text-red-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
