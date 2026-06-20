"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, Receipt, Clock, Settings, Save, 
  Loader2, ChevronLeft, ChevronRight, Eye, ShieldCheck, RefreshCw,
  Download, Percent, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: any;
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  invoicePrefix: string;
  currency: string;
  taxName: string;
  taxNumber?: string | null;
  address?: string | null;
}

interface SettingsClientProps {
  initialOrg: Organization;
  role: string;
}

export default function SettingsClient({ initialOrg, role }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"general" | "audit" | "tax-presets">("general");

  // Form states
  const [name, setName] = useState(initialOrg.name);
  const [invoicePrefix, setInvoicePrefix] = useState(initialOrg.invoicePrefix);
  const [currency, setCurrency] = useState(initialOrg.currency);
  const [taxName, setTaxName] = useState(initialOrg.taxName);
  const [taxNumber, setTaxNumber] = useState(initialOrg.taxNumber || "");
  const [address, setAddress] = useState(initialOrg.address || "");
  const [saving, setSaving] = useState(false);

  // Audit Log states
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // CSV Export state
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Tax Presets state
  const [presets, setPresets] = useState<{ id: string; name: string; rate: number }[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetRate, setPresetRate] = useState("");
  const [presetSubmitting, setPresetSubmitting] = useState(false);

  const handleDownloadAllCSV = async () => {
    setDownloadingCsv(true);
    try {
      const res = await fetch("/api/audit-logs?page=1&limit=1000");
      if (res.ok) {
        const json = await res.json();
        const allLogs = json.logs || [];
        
        if (allLogs.length === 0) {
          toast.error("No logs available to download");
          return;
        }

        const headers = ["ID", "Timestamp", "Actor", "Action", "Entity", "EntityID", "Metadata"];
        const rows = allLogs.map((log: any) => [
          log.id,
          new Date(log.createdAt).toISOString(),
          log.userId,
          log.action,
          log.entity,
          log.entityId,
          log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : ""
        ]);
        
        const csvContent = [
          headers.join(","),
          ...rows.map((row: any) => row.map((val: any) => `"${val}"`).join(","))
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `billflow_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Audit logs exported to CSV successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to export audit logs");
    } finally {
      setDownloadingCsv(false);
    }
  };

  const fetchTaxPresets = async () => {
    setPresetsLoading(true);
    try {
      const res = await fetch("/api/tax-presets");
      if (res.ok) {
        const data = await res.json();
        setPresets(data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tax presets");
    } finally {
      setPresetsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tax-presets") {
      fetchTaxPresets();
    }
  }, [activeTab]);

  const handleAddPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "MEMBER") {
      toast.error("Only Admins and Owners can manage tax presets.");
      return;
    }

    const rateNum = parseFloat(presetRate);
    if (isNaN(rateNum) || rateNum < 0) {
      toast.error("Please enter a valid tax rate percentage.");
      return;
    }

    setPresetSubmitting(true);
    try {
      const res = await fetch("/api/tax-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: presetName, rate: rateNum }),
      });

      if (res.ok) {
        toast.success("Tax preset created successfully!");
        setPresetName("");
        setPresetRate("");
        fetchTaxPresets();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create preset");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setPresetSubmitting(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (role === "MEMBER") {
      toast.error("Only Admins and Owners can manage tax presets.");
      return;
    }

    try {
      const res = await fetch(`/api/tax-presets/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Tax preset deleted.");
        fetchTaxPresets();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete preset");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const fetchAuditLogs = async (pageNum: number) => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/audit-logs?page=${pageNum}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
        setPage(json.pagination.page);
        setTotalPages(json.pagination.totalPages);
        setTotalLogs(json.pagination.total);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load audit logs");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs(page);
    }
  }, [activeTab, page]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "MEMBER") {
      toast.error("Only Owners and Admins can update settings.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          invoicePrefix,
          currency,
          taxName,
          taxNumber: taxNumber || null,
          address: address || null,
        }),
      });

      if (res.ok) {
        toast.success("Organization settings updated successfully!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save settings");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving organization settings");
    } finally {
      setSaving(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "text-emerald-600 dark:text-emerald-400";
    if (action.includes("DELETE")) return "text-rose-600 dark:text-rose-455";
    if (action.includes("UPDATE")) return "text-amber-600 dark:text-amber-400";
    if (action.includes("PAY")) return "text-violet-650 dark:text-violet-400";
    return "text-zinc-600 dark:text-zinc-400";
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white md:text-3xl">
          Workspace Settings
        </h1>
        <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">
          Configure profile properties, default invoicing rules and monitor changes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-1.5 pb-2.5 px-1.5 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "general"
              ? "border-violet-600 text-violet-750 dark:text-violet-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
          }`}
        >
          <Building2 className="h-4 w-4" /> Organization Settings
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-1.5 pb-2.5 px-1.5 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "audit"
              ? "border-violet-600 text-violet-750 dark:text-violet-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
          }`}
        >
          <Clock className="h-4 w-4" /> Audit Trails
        </button>
        <button
          onClick={() => setActiveTab("tax-presets")}
          className={`flex items-center gap-1.5 pb-2.5 px-1.5 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "tax-presets"
              ? "border-violet-600 text-violet-750 dark:text-violet-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
          }`}
        >
          <Percent className="h-4 w-4" /> Tax Presets
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "general" ? (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-6 shadow-xs space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Org Profile */}
            <div className="space-y-4">
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Workspace Profile</h3>
              
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={role === "MEMBER"}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1">Workspace URL slug</label>
                <input
                  type="text"
                  value={initialOrg.slug}
                  disabled
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-500"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">The slug is fixed and serves as your workspace namespace identifier.</span>
              </div>
            </div>

            {/* Invoicing defaults */}
            <div className="space-y-4">
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Default Invoicing Parameters</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    required
                    disabled={role === "MEMBER"}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={role === "MEMBER"}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 disabled:opacity-60"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1">Tax Label (e.g. GST)</label>
                  <input
                    type="text"
                    value={taxName}
                    onChange={(e) => setTaxName(e.target.value)}
                    required
                    disabled={role === "MEMBER"}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1">Tax ID / Number</label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="Enter Tax registration number"
                    disabled={role === "MEMBER"}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-zinc-150 dark:border-zinc-800" />

          <div>
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1">Billing Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Company physical address displayed on invoices"
              disabled={role === "MEMBER"}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 disabled:opacity-60"
            />
          </div>

          <div className="flex justify-end pt-4">
            {role === "MEMBER" ? (
              <span className="text-xs text-rose-500 font-semibold">Only Admins/Owners can modify settings.</span>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4.5 py-2 text-sm font-bold text-white bg-violet-650 hover:bg-violet-750 rounded-lg shadow-sm shadow-violet-100 dark:shadow-none active:scale-97 disabled:opacity-50 transition-all cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Settings
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Security Audit Logs</h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Tracking workspace events and configuration mutations</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadAllCSV}
                disabled={downloadingCsv || logs.length === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg text-[10px] font-bold text-zinc-700 dark:text-zinc-300 disabled:opacity-50 cursor-pointer"
              >
                {downloadingCsv ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                Export CSV
              </button>

              <button
                onClick={() => fetchAuditLogs(page)}
                disabled={logsLoading}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${logsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {logsLoading && logs.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="h-6 w-6 text-violet-600 animate-spin mx-auto" />
              <p className="text-xs text-zinc-500 mt-2">Loading audit trail...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-8 w-8 text-zinc-300 mx-auto" />
              <h4 className="font-bold text-xs text-zinc-700 dark:text-zinc-300 mt-2">No logs found</h4>
              <p className="text-[10px] text-zinc-450 mt-1">Actions performed will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-505 uppercase tracking-wider font-bold">
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Actor (User ID)</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Entity</th>
                    <th className="px-6 py-3">Entity ID</th>
                    <th className="px-6 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40 transition-colors font-medium">
                      <td className="px-6 py-3.5 text-zinc-500 dark:text-zinc-450">
                        {formatDate(log.createdAt)} {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-6 py-3.5 text-zinc-650 dark:text-zinc-350 font-bold max-w-[120px] truncate" title={log.userId}>
                        {log.userId === "system-public-portal" ? "Public Portal" : log.userId === "stripe-webhook" ? "Stripe" : log.userId}
                      </td>
                      <td className={`px-6 py-3.5 font-bold ${getActionColor(log.action)}`}>
                        {log.action}
                      </td>
                      <td className="px-6 py-3.5 text-zinc-700 dark:text-zinc-305">
                        {log.entity}
                      </td>
                      <td className="px-6 py-3.5 text-zinc-500 font-mono text-[10px] max-w-[100px] truncate" title={log.entityId}>
                        {log.entityId}
                      </td>
                      <td className="px-6 py-3.5 text-right text-zinc-450 dark:text-zinc-500 max-w-[180px] truncate" title={JSON.stringify(log.metadata)}>
                        {log.metadata ? JSON.stringify(log.metadata) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-500 text-[11px] font-semibold">
                    Showing {logs.length} of {totalLogs} events
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-855 disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "tax-presets" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Create Preset Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-6 shadow-xs h-fit space-y-4 md:col-span-1">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Add Tax Preset</h3>
              <p className="text-[10px] text-zinc-450 mt-0.5">Define a preset value to select in invoice items</p>
            </div>
            
            <form onSubmit={handleAddPreset} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1">Preset Name</label>
                <input
                  type="text"
                  placeholder="e.g. GST 18%, VAT 5%"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  required
                  disabled={role === "MEMBER" || presetSubmitting}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-955 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1">Tax Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="18.00"
                    value={presetRate}
                    onChange={(e) => setPresetRate(e.target.value)}
                    required
                    disabled={role === "MEMBER" || presetSubmitting}
                    className="w-full pl-3 pr-8 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-955 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 disabled:opacity-60"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-450">%</span>
                </div>
              </div>

              {role === "MEMBER" ? (
                <span className="text-[10px] text-rose-500 font-semibold block">Only Admins/Owners can add presets.</span>
              ) : (
                <button
                  type="submit"
                  disabled={presetSubmitting}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-violet-500/10 cursor-pointer"
                >
                  {presetSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Preset
                </button>
              )}
            </form>
          </div>

          {/* Presets List */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs md:col-span-2 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Tax Presets Directory</h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Quickly select these rates in your invoices</p>
              </div>
              <button
                onClick={fetchTaxPresets}
                disabled={presetsLoading}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850"
              >
                <RefreshCw className={`h-4 w-4 ${presetsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {presetsLoading && presets.length === 0 ? (
              <div className="p-12 text-center">
                <Loader2 className="h-6 w-6 text-violet-600 animate-spin mx-auto" />
                <p className="text-xs text-zinc-500 mt-2">Loading presets...</p>
              </div>
            ) : presets.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="h-8 w-8 text-zinc-300 mx-auto" />
                <h4 className="font-bold text-xs text-zinc-700 dark:text-zinc-300 mt-2">No tax presets</h4>
                <p className="text-[10px] text-zinc-450 mt-1">Tax presets you add will show up here.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-150 dark:divide-zinc-800">
                {presets.map((preset) => (
                  <div key={preset.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40 transition-colors">
                    <div>
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">{preset.name}</h4>
                      <span className="text-[10px] text-zinc-450 font-semibold">{preset.rate}% Tax Rate</span>
                    </div>
                    {role !== "MEMBER" && (
                      <button
                        onClick={() => handleDeletePreset(preset.id)}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-900 text-zinc-450 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
