"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Trash2, Save, Send, Download, Sparkles, Layout, 
  UserPlus, HelpCircle, Loader2, Calendar, FileText, Landmark
} from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string;
  address?: string | null;
  taxNumber?: string | null;
}

interface Product {
  id: string;
  name: string;
  rate: number;
  unit: string;
  description?: string | null;
}

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  taxRate: number;
  amount: number;
}

interface InvoiceBuilderProps {
  initialData?: any; // Existing invoice for edit
  isRecurring?: boolean;
  organization: {
    id: string;
    name: string;
    currency: string;
    taxName: string;
    invoicePrefix: string;
    address?: string | null;
    taxNumber?: string | null;
  };
}

export default function InvoiceBuilder({ initialData, isRecurring = false, organization }: InvoiceBuilderProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [frequency, setFrequency] = useState<"WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");
  const [endDate, setEndDate] = useState("");

  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxPresets, setTaxPresets] = useState<{ id: string; name: string; rate: number }[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form states
  const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || "");
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.number || "");
  const [issueDate, setIssueDate] = useState(
    initialData?.issueDate 
      ? new Date(initialData.issueDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate 
      ? new Date(initialData.dueDate).toISOString().split("T")[0]
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // default 15 days
  );
  
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [terms, setTerms] = useState(initialData?.terms || "");
  const [discount, setDiscount] = useState<number>(initialData?.discount || 0);
  const [templateId, setTemplateId] = useState(initialData?.templateId || "modern");

  // Line items state
  const [items, setItems] = useState<LineItem[]>(
    initialData?.items?.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      taxRate: item.taxRate,
      amount: item.amount,
    })) || [{ description: "", quantity: 1, rate: 0, taxRate: 0, amount: 0 }]
  );

  // Modal states
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load clients and products
  useEffect(() => {
    async function loadData() {
      try {
        const [clientsRes, productsRes, presetsRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/products"),
          fetch("/api/tax-presets")
        ]);
        
        if (clientsRes.ok && productsRes.ok) {
          const clientsData = await clientsRes.json();
          const productsData = await productsRes.json();
          setClients(clientsData.clients || []);
          setProducts(productsData.products || []);
        }

        if (presetsRes.ok) {
          const presetsData = await presetsRes.json();
          setTaxPresets(presetsData || []);
        }

        // Check for duplicateId in search params
        const searchParams = new URLSearchParams(window.location.search);
        const duplicateId = searchParams.get("duplicateId");
        if (duplicateId && !isEdit) {
          const dupRes = await fetch(`/api/invoices/${duplicateId}`);
          if (dupRes.ok) {
            const dupData = await dupRes.json();
            setSelectedClientId(dupData.clientId);
            setNotes(dupData.notes || "");
            setTerms(dupData.terms || "");
            setDiscount(dupData.discount || 0);
            setTemplateId(dupData.templateId || "modern");
            setItems(
              dupData.items?.map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                rate: item.rate,
                taxRate: item.taxRate,
                amount: item.amount,
              })) || []
            );
            toast.success("Invoice duplicated! Adjust details and save.");
          }
        }

        // Generate automatic invoice number for new invoice
        if (!isEdit) {
          const invoicesRes = await fetch("/api/invoices");
          if (invoicesRes.ok) {
            const invoicesData = await invoicesRes.json();
            const count = invoicesData.invoices?.length || 0;
            const paddedCount = String(count + 1).padStart(4, "0");
            setInvoiceNumber(`${organization.invoicePrefix}-${new Date().getFullYear()}-${paddedCount}`);
          }
        }
      } catch (error) {
        console.error("Failed to load invoice builder data:", error);
        toast.error("Failed to load catalog data");
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, [isEdit, organization]);

  // Recalculate row amount on change
  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === "description") {
      item.description = value;
    } else {
      const numVal = parseFloat(value) || 0;
      if (field === "quantity") item.quantity = numVal;
      if (field === "rate") item.rate = numVal;
      if (field === "taxRate") item.taxRate = numVal;
    }

    // Amount calculation
    const base = item.quantity * item.rate;
    const tax = base * (item.taxRate / 100);
    item.amount = base + tax;

    updated[index] = item;
    setItems(updated);
  };

  const handleAutocompleteProduct = (index: number, product: Product) => {
    const updated = [...items];
    const item = { ...updated[index] };
    item.description = product.name;
    item.rate = product.rate;
    
    // Recalculate amount
    const base = item.quantity * item.rate;
    const tax = base * (item.taxRate / 100);
    item.amount = base + tax;
    
    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0, taxRate: 0, amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error("An invoice must contain at least one item");
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Math totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate * (item.taxRate / 100)), 0);
  const total = subtotal + taxAmount - discount;

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientEmail.trim()) {
      toast.error("Name and Email are required");
      return;
    }
    
    setIsCreatingClient(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClientName,
          email: newClientEmail,
          address: newClientAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create client");

      toast.success("Client added successfully");
      setClients([...clients, data]);
      setSelectedClientId(data.id);
      setNewClientModalOpen(false);
      setNewClientName("");
      setNewClientEmail("");
      setNewClientAddress("");
    } catch (error: any) {
      toast.error(error.message || "Could not add client");
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleSave = async (silent = false) => {
    if (!selectedClientId) {
      toast.error("Please select a client");
      return null;
    }
    if (!isRecurring && !invoiceNumber.trim()) {
      toast.error("Invoice number is required");
      return null;
    }

    setIsSavingDraft(true);
    try {
      if (isRecurring) {
        const url = isEdit ? `/api/recurring/${initialData.id}` : "/api/recurring";
        const method = isEdit ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: selectedClientId,
            frequency,
            nextDate: issueDate,
            endDate: endDate ? endDate : null,
            templateData: {
              subtotal,
              taxAmount,
              discount,
              total,
              notes,
              terms,
              templateId,
              items,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save recurring rule");

        if (!silent) {
          toast.success(isEdit ? "Recurring rule updated" : "Recurring rule created successfully!");
          router.push("/dashboard/recurring");
        }
        return data;
      }

      const url = isEdit ? `/api/invoices/${initialData.id}` : "/api/invoices";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          number: invoiceNumber,
          issueDate,
          dueDate,
          notes,
          terms,
          discount,
          subtotal,
          taxAmount,
          total,
          templateId,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save invoice");

      if (!silent) {
        toast.success(isEdit ? "Invoice updated successfully" : "Invoice created as Draft");
        router.push("/dashboard/invoices");
      }
      return data;
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
      return null;
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSend = async () => {
    // 1. Save changes first
    const savedInvoice = await handleSave(true);
    if (!savedInvoice) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/invoices/${savedInvoice.id}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch email");

      toast.success("Invoice sent to client successfully!");
      router.push("/dashboard/invoices");
    } catch (error: any) {
      toast.error(error.message || "Could not dispatch invoice");
    } finally {
      setIsSending(false);
    }
  };

  // Find active client details
  const activeClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start h-full">
      
      {/* Left panel: Form */}
      <div className="flex-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex justify-between items-center pb-4 border-b border-zinc-150 dark:border-zinc-800">
          <h1 className="text-xl font-bold">{isEdit ? "Edit Invoice" : "Create New Invoice"}</h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
              {initialData?.status || "DRAFT"}
            </span>
          </div>
        </div>

        {/* Client & Metadata Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1.5 flex items-center justify-between">
                Client
                <button
                  onClick={() => setNewClientModalOpen(true)}
                  className="text-violet-600 hover:text-violet-750 flex items-center gap-0.5 text-[10px] font-semibold"
                >
                  <UserPlus className="h-3 w-3" /> Add Client
                </button>
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/25"
              >
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            {!isRecurring ? (
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1.5">Invoice Number</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="INV-0001"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1.5">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/25 font-semibold text-zinc-800 dark:text-zinc-250"
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1.5">
                  {isRecurring ? "First Generation Date" : "Issue Date"}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1.5">
                  {isRecurring ? "End Date (Optional)" : "Due Date"}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="date"
                    value={isRecurring ? endDate : dueDate}
                    onChange={(e) => isRecurring ? setEndDate(e.target.value) : setDueDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1.5">Invoice Template Style</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "modern", label: "Modern" },
                  { id: "classic", label: "Classic" },
                  { id: "minimal", label: "Minimal" }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateId(t.id)}
                    className={`py-2 px-3 text-xs border rounded-lg font-medium transition-all ${
                      templateId === t.id 
                        ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/10" 
                        : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-800">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <Layout className="h-4.5 w-4.5 text-violet-500" /> Line Items
          </h2>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-zinc-150 dark:border-zinc-800/80 rounded-lg relative group">
                
                {/* Description and Autocomplete */}
                <div className="flex-1 w-full relative">
                  <label className="md:hidden block text-[9px] font-bold text-zinc-400 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Item description or product..."
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                    className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                  />
                  {/* Small product suggestion dropdown if matched */}
                  {products.length > 0 && item.description.length > 1 && !products.some(p => p.name === item.description) && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-30 max-h-36 overflow-y-auto">
                      {products
                        .filter(p => p.name.toLowerCase().includes(item.description.toLowerCase()))
                        .map(prod => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => handleAutocompleteProduct(idx, prod)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-850/80 border-b border-zinc-100 last:border-0 flex justify-between"
                          >
                            <span>{prod.name}</span>
                            <span className="font-semibold text-violet-600">{organization.currency} {prod.rate}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 w-full md:w-80">
                  <div className="col-span-1">
                    <label className="md:hidden block text-[9px] font-bold text-zinc-400 mb-1">Qty</label>
                    <input
                      type="number"
                      placeholder="1"
                      min="0.1"
                      step="any"
                      value={item.quantity || ""}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none text-right"
                    />
                  </div>

                  <div className="col-span-1.5">
                    <label className="md:hidden block text-[9px] font-bold text-zinc-400 mb-1">Rate</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="any"
                      value={item.rate || ""}
                      onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                      className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none text-right"
                    />
                  </div>

                  <div className="col-span-1.5">
                    <label className="md:hidden block text-[9px] font-bold text-zinc-400 mb-1">Tax%</label>
                    {(() => {
                      const isCustomTax = item.taxRate !== 0 && !taxPresets.some(p => p.rate === item.taxRate);
                      return isCustomTax ? (
                        <div className="flex gap-1 items-center">
                          <input
                            type="number"
                            placeholder="0%"
                            min="0"
                            max="100"
                            step="any"
                            value={item.taxRate === 0.001 ? "" : (item.taxRate || "")}
                            onChange={(e) => handleItemChange(idx, "taxRate", e.target.value)}
                            className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none text-right"
                          />
                          <button
                            type="button"
                            onClick={() => handleItemChange(idx, "taxRate", 0)}
                            className="p-1 px-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold cursor-pointer"
                            title="Use Preset"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <select
                          value={item.taxRate}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "custom") {
                              handleItemChange(idx, "taxRate", 0.001);
                            } else {
                              handleItemChange(idx, "taxRate", parseFloat(val));
                            }
                          }}
                          className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-955 text-xs focus:outline-none text-right font-medium"
                        >
                          <option value="0">0%</option>
                          {taxPresets.map((preset) => (
                            <option key={preset.id} value={preset.rate}>
                              {preset.name} ({preset.rate}%)
                            </option>
                          ))}
                          <option value="custom">Custom...</option>
                        </select>
                      );
                    })()}
                  </div>
                </div>

                {/* Amount and delete */}
                <div className="flex items-center justify-between w-full md:w-32 pt-2 md:pt-0 border-t md:border-0 border-zinc-100">
                  <div className="text-right flex-1 pr-2">
                    <div className="text-[9px] text-zinc-400 font-medium md:hidden">Amount</div>
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {organization.currency} {item.amount.toFixed(2)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-500 hover:text-violet-650 hover:border-violet-500/30 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Line Row
            </button>
          </div>
        </div>

        {/* Notes, Terms & Summary */}
        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-zinc-150 dark:border-zinc-800">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1.5">Notes</label>
              <textarea
                placeholder="Payment instructions, bank detail notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1.5">Terms & Conditions</label>
              <textarea
                placeholder="Net 15 days, late payment penalty terms..."
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={2}
                className="w-full p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-zinc-150 dark:border-zinc-800 rounded-lg flex flex-col justify-between h-fit space-y-3">
            <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {organization.currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Discount</span>
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="any"
                  value={discount || ""}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 p-1 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950 text-right text-xs focus:outline-none"
                />
              </div>
              <div className="flex justify-between">
                <span>Tax ({organization.taxName})</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {organization.currency} {taxAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <hr className="border-zinc-150 dark:border-zinc-800" />

            <div className="flex justify-between items-center text-sm font-bold">
              <span>Total</span>
              <span className="text-lg text-violet-600 dark:text-violet-400">
                {organization.currency} {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-800">
          <button
            onClick={() => handleSave(false)}
            disabled={isSavingDraft || isSending}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-violet-500/10 active:scale-98 disabled:opacity-50"
          >
            {isSavingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isRecurring ? "Save Schedule" : "Save Draft"}
          </button>
          
          {!isRecurring && (
            <button
              onClick={handleSend}
              disabled={isSavingDraft || isSending}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Save & Send Invoice
            </button>
          )}
        </div>
      </div>

      {/* Right panel: Live Preview Mockup */}
      <div className="w-full lg:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 shrink-0 lg:sticky lg:top-24">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-violet-500" /> Live HTML Preview
        </h2>

        {/* High fidelity container reproducing selected template */}
        <div className={`
          border border-zinc-150 dark:border-zinc-800/80 rounded-lg p-5 overflow-hidden text-[9px] bg-white text-zinc-800 shadow-inner min-h-[380px]
          ${templateId === "classic" ? "font-serif" : "font-sans"}
        `}>
          {/* Header Layout */}
          <div className="flex justify-between items-start border-b border-zinc-100 pb-3 mb-4">
            <div>
              <div className="font-bold text-[11px] uppercase tracking-tight text-zinc-900">{organization.name}</div>
              <div className="text-[8px] text-zinc-500 mt-1 max-w-[140px] truncate">{organization.address || "No Address Set"}</div>
              {organization.taxNumber && <div className="text-[8px] text-zinc-450 mt-0.5">{organization.taxName}: {organization.taxNumber}</div>}
            </div>
            <div className="text-right">
              <div className={`font-bold text-xs uppercase ${templateId === "modern" ? "text-violet-600" : "text-zinc-900"}`}>
                {isRecurring ? "RECURRING" : "INVOICE"}
              </div>
              {!isRecurring ? (
                <>
                  <div className="text-[7.5px] text-zinc-500 mt-1">#: {invoiceNumber || "DRAFT-XXXX"}</div>
                  <div className="text-[7.5px] text-zinc-500">Date: {issueDate}</div>
                  <div className="text-[7.5px] text-zinc-500">Due: {dueDate}</div>
                </>
              ) : (
                <>
                  <div className="text-[7.5px] text-zinc-500 mt-1">Freq: {frequency}</div>
                  <div className="text-[7.5px] text-zinc-500">Starts: {issueDate}</div>
                  {endDate && <div className="text-[7.5px] text-zinc-500">Ends: {endDate}</div>}
                </>
              )}
            </div>
          </div>

          {/* Client Details */}
          <div className="mb-4">
            <div className={`font-bold text-[8.5px] mb-1 text-zinc-500 ${templateId === "modern" ? "text-violet-500" : ""}`}>BILL TO</div>
            <div className="font-bold text-[9.5px] text-zinc-900">{activeClient?.name || "[Client Name]"}</div>
            <div className="text-zinc-500">{activeClient?.email || "[Client Email]"}</div>
            <div className="text-zinc-500 max-w-[180px] truncate">{activeClient?.address}</div>
          </div>

          {/* Line Items table */}
          <div className="space-y-1.5 mb-4">
            <div className={`flex font-bold text-[7.5px] border-b border-zinc-100 pb-1 ${templateId === "modern" ? "bg-violet-50 text-violet-850 p-1" : ""}`}>
              <span className="flex-1">Description</span>
              <span className="w-8 text-right">Qty</span>
              <span className="w-16 text-right">Rate</span>
              <span className="w-16 text-right">Total</span>
            </div>
            {items.map((item, index) => (
              <div key={index} className="flex border-b border-zinc-50 pb-1 text-zinc-700">
                <span className="flex-1 truncate pr-1">{item.description || "[Item details...]"}</span>
                <span className="w-8 text-right">{item.quantity}</span>
                <span className="w-16 text-right">{organization.currency} {item.rate.toFixed(2)}</span>
                <span className="w-16 text-right font-semibold">{organization.currency} {item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Breakdown and totals */}
          <div className="flex flex-col items-end space-y-1 text-zinc-600 mb-6">
            <div className="flex w-32 justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-zinc-900">{organization.currency} {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex w-32 justify-between">
                <span>Discount:</span>
                <span className="font-semibold text-zinc-900">-{organization.currency} {discount.toFixed(2)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex w-32 justify-between">
                <span>Tax ({organization.taxName}):</span>
                <span className="font-semibold text-zinc-900">{organization.currency} {taxAmount.toFixed(2)}</span>
              </div>
            )}
            <hr className="w-32 border-zinc-100 my-0.5" />
            <div className="flex w-32 justify-between font-bold text-zinc-950 text-[10.5px]">
              <span>Total:</span>
              <span className={templateId === "modern" ? "text-violet-600" : ""}>{organization.currency} {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer brand */}
          <div className="text-[7px] text-zinc-400 border-t border-zinc-100 pt-2 text-center">
            Powered by BillFlow (www.billflowsaas.com)
          </div>
        </div>

        {/* Inline Info banner */}
        <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 text-[10px] text-zinc-500 leading-normal flex items-start gap-1.5">
          <HelpCircle className="h-4.5 w-4.5 text-violet-500 shrink-0 mt-0.5" />
          <span>Keystrokes automatically synchronize to the live preview. Save draft before downloading PDFs.</span>
        </div>
      </div>

      {/* Inline Add Client Modal */}
      {newClientModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold">Add New Client</h3>
              <p className="text-[11px] text-zinc-500">Create a client directory entry inline.</p>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-500 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-500 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-500 mb-1">Address</label>
                <textarea
                  placeholder="Billing address..."
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewClientModalOpen(false)}
                  className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClient}
                  className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg flex items-center gap-1"
                >
                  {isCreatingClient && <Loader2 className="h-3 w-3 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
