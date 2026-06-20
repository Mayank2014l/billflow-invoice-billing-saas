"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Receipt, Landmark, Download, FileText, 
  Search, ShieldCheck, Loader2, AlertCircle, ExternalLink 
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Invoice {
  id: string;
  number: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "PAID" | "OVERDUE" | "CANCELLED";
  issueDate: string;
  dueDate: string;
  total: number;
  viewToken: string;
}

interface ClientPortalData {
  client: {
    id: string;
    name: string;
    email: string;
    currency: string;
    organization: {
      name: string;
      currency: string;
    };
  };
  invoices: Invoice[];
  stats: {
    totalBilled: number;
    totalPaid: number;
    totalOutstanding: number;
    totalOverdue: number;
  };
}

export default function ClientPortalPage() {
  const { portalToken } = useParams() as { portalToken: string };
  const [data, setData] = useState<ClientPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/client-portal/${portalToken}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error("Portal not found or invalid token");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load portal data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (portalToken) {
      fetchData();
    }
  }, [portalToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-violet-650 animate-spin" />
        <p className="text-zinc-500 mt-2 text-sm font-semibold">Loading client portal...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl p-8 shadow-md">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-4">Portal Inaccessible</h2>
          <p className="text-zinc-550 dark:text-zinc-400 mt-2 text-sm">
            This client portal link is invalid, expired, or has been updated by the merchant.
          </p>
        </div>
      </div>
    );
  }

  const { client, invoices, stats } = data;
  const currency = client.currency || client.organization.currency || "INR";

  // Filter invoices (hide drafts from the customer)
  const filteredInvoices = invoices.filter((inv) => {
    if (inv.status === "DRAFT") return false;

    const matchesSearch = inv.number.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "PAID") return inv.status === "PAID" && matchesSearch;
    if (statusFilter === "OUTSTANDING") return ["SENT", "VIEWED", "OVERDUE"].includes(inv.status) && matchesSearch;
    if (statusFilter === "OVERDUE") return inv.status === "OVERDUE" && matchesSearch;
    
    return matchesSearch;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/50";
      case "SENT":
      case "VIEWED":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/35 dark:text-blue-400 border-blue-200 dark:border-blue-900/50";
      case "OVERDUE":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/35 dark:text-rose-400 border-rose-250 dark:border-rose-900/50";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-750";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-10 px-4 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm">
          <div>
            <h1 className="text-xl font-black text-zinc-900 dark:text-white sm:text-2xl">
              Billing Portal
            </h1>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
              Welcome, <strong className="text-zinc-800 dark:text-zinc-250">{client.name}</strong>. Here is your invoice statement from <strong className="text-violet-650 dark:text-violet-400">{client.organization.name}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-450 dark:text-zinc-500 text-[10px] font-bold">
            <ShieldCheck className="h-4.5 w-4.5 text-violet-500" />
            <span>Secure Client Session</span>
          </div>
        </div>

        {/* Aggregated Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Outstanding</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              {formatCurrency(stats.totalOutstanding, currency)}
            </h3>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Overdue Balance</p>
            <h3 className="text-2xl font-black text-rose-650 dark:text-rose-450 mt-1">
              {formatCurrency(stats.totalOverdue, currency)}
            </h3>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Paid</p>
            <h3 className="text-2xl font-black text-emerald-650 dark:text-emerald-450 mt-1">
              {formatCurrency(stats.totalPaid, currency)}
            </h3>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Billed</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              {formatCurrency(stats.totalBilled, currency)}
            </h3>
          </div>
        </div>

        {/* Filter controls */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto">
            {["ALL", "OUTSTANDING", "OVERDUE", "PAID"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border cursor-pointer active:scale-97 transition-all ${
                  statusFilter === status
                    ? "bg-violet-600 text-white border-violet-650"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices List Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto" />
              <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 mt-2">No invoices found</h4>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
                There are no invoices matching your search filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold">
                    <th className="px-6 py-3.5">Invoice #</th>
                    <th className="px-6 py-3.5">Issue Date</th>
                    <th className="px-6 py-3.5">Due Date</th>
                    <th className="px-6 py-3.5 text-right">Amount</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                  {filteredInvoices.map((inv) => (
                    <tr 
                      key={inv.id}
                      className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40 transition-colors font-semibold"
                    >
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                        {inv.number}
                      </td>
                      <td className="px-6 py-4 text-zinc-550 dark:text-zinc-400">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="px-6 py-4 text-zinc-550 dark:text-zinc-400">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-zinc-900 dark:text-white">
                        {formatCurrency(inv.total, currency)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/api/public/invoice/${inv.viewToken}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1.5 text-zinc-500 dark:text-zinc-455 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-95 transition-all"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          
                          <a
                            href={`/invoice/${inv.viewToken}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-md shadow-xs active:scale-97 transition-all cursor-pointer"
                          >
                            View & Pay <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
