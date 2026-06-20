"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Search, Users2, Edit2, Trash2, Globe, ExternalLink, 
  Copy, Check, Mail, Phone, Landmark, MoreHorizontal, Loader2, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { useOrg } from "@/hooks/use-org";

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country: string;
  currency: string;
  taxNumber?: string | null;
  portalToken: string;
  totalInvoiced: number;
  outstanding: number;
  lastInvoiceDate?: string | null;
}

export default function ClientsPage() {
  const router = useRouter();
  const { activeOrg } = useOrg();
  const { canCreateEditInvoices } = usePermissions();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("India");
  const [taxNumber, setTaxNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [activeOrg]);

  const handleOpenAddModal = () => {
    setSelectedClient(null);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setCountry("India");
    setTaxNumber("");
    setClientModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setSelectedClient(client);
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone || "");
    setAddress(client.address || "");
    setCity(client.city || "");
    setCountry(client.country || "India");
    setTaxNumber(client.taxNumber || "");
    setClientModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and Email are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = selectedClient ? `/api/clients/${selectedClient.id}` : "/api/clients";
      const method = selectedClient ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          address: address || null,
          city: city || null,
          country,
          taxNumber: taxNumber || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save client");

      toast.success(selectedClient ? "Client details updated" : "Client profile added");
      setClientModalOpen(false);
      fetchClients();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete ${clientName}? This will delete all their invoices.`)) return;

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Client ${clientName} deleted.`);
        fetchClients();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete client");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleCopyPortal = (portalToken: string) => {
    const appUrl = window.location.origin;
    const portalUrl = `${appUrl}/client-portal/${portalToken}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedToken(portalToken);
    toast.success("Portal link copied to clipboard!");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Maintain client directories and monitor invoice distributions
          </p>
        </div>

        {canCreateEditInvoices && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-violet-500/10 flex items-center gap-1.5 transition-all active:scale-98"
          >
            <Plus className="h-4 w-4" /> Add Client
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by client name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b last:border-0 border-zinc-100 dark:border-zinc-805 pb-4 last:pb-0 animate-pulse">
              <div className="space-y-2">
                <div className="h-4.5 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-3.5 w-24 bg-zinc-100 dark:bg-zinc-855 rounded" />
              </div>
              <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/50 rounded-2xl flex items-center justify-center mb-6">
            <Users2 className="h-8 w-8 text-violet-500" />
          </div>
          <h3 className="text-lg font-bold">No Clients Found</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm text-sm">
            {searchQuery 
              ? "We couldn't find any clients matching your query parameters." 
              : "Register clients profiles here to send invoices and share branded portal links."}
          </p>
          {canCreateEditInvoices && !searchQuery && (
            <button
              onClick={handleOpenAddModal}
              className="mt-6 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-98"
            >
              <Plus className="h-4 w-4" /> Add Your First Client
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-850/50 text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-right">Total Invoiced</th>
                  <th className="p-4 text-right">Outstanding</th>
                  <th className="p-4">Last Invoiced</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800/80 font-medium">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                    <td 
                      onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                      className="p-4 font-bold text-violet-600 dark:text-violet-400 cursor-pointer hover:underline"
                    >
                      {client.name}
                    </td>
                    <td className="p-4 text-zinc-500">{client.email}</td>
                    <td className="p-4 text-right font-semibold">
                      {activeOrg?.currency} {client.totalInvoiced.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-bold text-red-650">
                      {activeOrg?.currency} {client.outstanding.toFixed(2)}
                    </td>
                    <td className="p-4 text-zinc-550">
                      {client.lastInvoiceDate 
                        ? new Date(client.lastInvoiceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "Never"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Detail link */}
                        <button
                          onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                          className="p-1.5 text-zinc-500 hover:text-violet-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="View Invoices History"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>

                        {/* Edit Client */}
                        {canCreateEditInvoices && (
                          <button
                            onClick={() => handleOpenEditModal(client)}
                            className="p-1.5 text-zinc-500 hover:text-violet-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Edit Details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Copy Portal Token */}
                        <button
                          onClick={() => handleCopyPortal(client.portalToken)}
                          className="p-1.5 text-zinc-500 hover:text-violet-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Copy Private Portal Link"
                        >
                          {copiedToken === client.portalToken ? <Check className="h-4 w-4 text-green-650" /> : <Copy className="h-4 w-4" />}
                        </button>

                        {/* Delete Client */}
                        {canCreateEditInvoices && (
                          <button
                            onClick={() => handleDeleteClient(client.id, client.name)}
                            className="p-1.5 text-zinc-500 hover:text-red-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors"
                            title="Delete Client"
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

      {/* Add / Edit Client Modal */}
      {clientModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold">{selectedClient ? "Edit Client Profile" : "Add Client Directory"}</h3>
              <p className="text-xs text-zinc-550 mt-1">Configure client coordinate parameters.</p>
            </div>
            
            <form onSubmit={handleSaveClient} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-500 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 99999 99999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-500 mb-1">Tax ID / GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="Tax reference"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-500 mb-1">Billing Address</label>
                <textarea
                  placeholder="Street address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-500 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-500 mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. India"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setClientModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg flex items-center gap-1 active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
