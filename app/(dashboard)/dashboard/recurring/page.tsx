"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, Calendar, RefreshCw, ChevronDown, ChevronUp, Play, 
  Pause, Trash2, Loader2, ArrowUpRight, Check, X, FileText 
} from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { useOrg } from "@/hooks/use-org";

interface GeneratedInvoice {
  id: string;
  number: string;
  total: number;
  status: string;
  issueDate: string;
}

interface RecurringRule {
  id: string;
  clientId: string;
  frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  nextDate: string;
  endDate?: string | null;
  active: boolean;
  templateData: {
    total: number;
    items: { description: string }[];
  };
  client?: {
    name: string;
    email: string;
  } | null;
  generatedInvoices: GeneratedInvoice[];
}

export default function RecurringPage() {
  const { activeOrg } = useOrg();
  const { canCreateEditInvoices } = usePermissions();

  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recurring");
      if (res.ok) {
        const data = await res.json();
        setRules(data.recurringRules || []);
      }
    } catch (error) {
      console.error("Failed to load recurring rules:", error);
      toast.error("Failed to load recurring rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [activeOrg]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/recurring/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentStatus }),
      });

      if (res.ok) {
        toast.success(!currentStatus ? "Recurring schedule resumed!" : "Recurring schedule paused.");
        fetchRules();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update schedule status");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recurring schedule? No further invoices will be generated.")) return;

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/recurring/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Recurring schedule deleted.");
        fetchRules();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete schedule");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleExpandRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recurring Invoices</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Configure auto-generation parameters and schedules for clients
          </p>
        </div>

        {canCreateEditInvoices && (
          <Link
            href="/dashboard/recurring/new"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-violet-500/10 flex items-center gap-1.5 transition-all active:scale-98"
          >
            <Plus className="h-4 w-4" /> Create Recurring Invoice
          </Link>
        )}
      </div>

      {/* Rules list */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b last:border-0 border-zinc-100 dark:border-zinc-805 pb-4 last:pb-0 animate-pulse">
              <div className="space-y-2">
                <div className="h-4.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-850 rounded" />
              </div>
              <div className="h-6 w-20 bg-zinc-250 dark:bg-zinc-800 rounded-full" />
            </div>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-violet-50 dark:bg-violet-955/25 border border-violet-100 dark:border-violet-900/50 rounded-2xl flex items-center justify-center mb-6">
            <RefreshCw className="h-8 w-8 text-violet-500" />
          </div>
          <h3 className="text-lg font-bold">No Recurring Invoices</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm text-sm">
            Set up recurring billing rules to automatically draft and email invoices to clients weekly, monthly, quarterly, or yearly.
          </p>
          {canCreateEditInvoices && (
            <Link
              href="/dashboard/recurring/new"
              className="mt-6 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-98"
            >
              <Plus className="h-4 w-4" /> Create Your First Schedule
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-850/50 text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800">
                <tr>
                  <th className="p-4 w-10"></th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Frequency</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4">Next Date</th>
                  <th className="p-4">End Date</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800/80 font-medium">
                {rules.map((rule) => {
                  const isExpanded = expandedId === rule.id;
                  return (
                    <React.Fragment key={rule.id}>
                      <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                        <td className="p-4">
                          <button
                            onClick={() => toggleExpandRow(rule.id)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-805 rounded transition-colors text-zinc-500"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-zinc-850 dark:text-zinc-200">{rule.client?.name || "Deleted Client"}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">{rule.client?.email}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-750 dark:bg-violet-955/20 dark:text-violet-400 font-bold text-[9px] uppercase tracking-wider">
                            {rule.frequency}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-zinc-800 dark:text-zinc-200">
                          {activeOrg?.currency} {rule.templateData.total.toFixed(2)}
                        </td>
                        <td className="p-4 text-zinc-500">
                          {new Date(rule.nextDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="p-4 text-zinc-550">
                          {rule.endDate 
                            ? new Date(rule.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : "Ongoing"}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            disabled={actionLoadingId === rule.id || !canCreateEditInvoices}
                            onClick={() => handleToggleActive(rule.id, rule.active)}
                            className={`p-1.5 px-3 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 mx-auto transition-all active:scale-95 disabled:opacity-50 ${
                              rule.active 
                                ? "bg-green-50 text-green-700 border border-green-200/50 dark:bg-green-950/20 dark:text-green-400" 
                                : "bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-955/10 dark:text-amber-400"
                            }`}
                          >
                            {actionLoadingId === rule.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : rule.active ? (
                              <><Play className="h-2.5 w-2.5" /> Active</>
                            ) : (
                              <><Pause className="h-2.5 w-2.5" /> Paused</>
                            )}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {canCreateEditInvoices && (
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                disabled={actionLoadingId === rule.id}
                                className="p-1.5 text-zinc-450 hover:text-red-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors disabled:opacity-50"
                                title="Delete Schedule"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Sub-table */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-zinc-50/70 dark:bg-zinc-900/40 p-5">
                            <div className="space-y-3 pl-8">
                              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                                <FileText className="h-4 w-4" /> Generated Invoices History Log ({rule.generatedInvoices.length})
                              </h4>
                              
                              {rule.generatedInvoices.length === 0 ? (
                                <p className="text-zinc-550 text-xs py-2">No invoices generated by this rule yet. Next run date: {new Date(rule.nextDate).toLocaleDateString()}</p>
                              ) : (
                                <div className="max-w-3xl border border-zinc-150 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950 shadow-inner">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-bold text-zinc-550">
                                      <tr>
                                        <th className="p-2.5">Invoice #</th>
                                        <th className="p-2.5">Generation Date</th>
                                        <th className="p-2.5 text-right">Amount</th>
                                        <th className="p-2.5">Status</th>
                                        <th className="p-2.5 text-right">Link</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-medium">
                                      {rule.generatedInvoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                                          <td className="p-2.5 font-bold text-violet-650 dark:text-violet-400">{inv.number}</td>
                                          <td className="p-2.5 text-zinc-550">
                                            {new Date(inv.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                          </td>
                                          <td className="p-2.5 text-right font-semibold">
                                            {activeOrg?.currency} {inv.total.toFixed(2)}
                                          </td>
                                          <td className="p-2.5 uppercase font-bold text-[9px]">{inv.status}</td>
                                          <td className="p-2.5 text-right">
                                            <Link 
                                              href={`/dashboard/invoices/${inv.id}`}
                                              className="text-violet-600 hover:text-violet-750 font-bold inline-flex items-center gap-0.5 text-[10px]"
                                            >
                                              Details <ArrowUpRight className="h-3 w-3" />
                                            </Link>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
