"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Download, CreditCard, CheckCircle2, ShieldCheck, 
  Loader2, AlertCircle, Printer, FileText, Landmark 
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate: number;
}

interface Invoice {
  id: string;
  number: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "PAID" | "OVERDUE" | "CANCELLED";
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string | null;
  terms?: string | null;
  templateId: string;
  client: {
    name: string;
    email: string;
    address?: string | null;
    taxNumber?: string | null;
  };
  organization: {
    name: string;
    address?: string | null;
    taxName: string;
    taxNumber?: string | null;
    currency: string;
  };
  items: InvoiceItem[];
}

export default function PublicInvoicePage() {
  const { viewToken } = useParams() as { viewToken: string };
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/invoice/${viewToken}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
      } else {
        toast.error("Invoice not found or expired");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load invoice details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewToken) {
      fetchInvoice();
    }
  }, [viewToken]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch(`/api/public/invoice/${viewToken}`, {
        method: "POST",
      });
      if (res.ok) {
        setPaySuccess(true);
        toast.success("Payment successful! Thank you.");
        fetchInvoice();
      } else {
        const err = await res.json();
        toast.error(err.error || "Payment failed");
      }
    } catch (error) {
      toast.error("An error occurred during payment processing");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
        <p className="text-zinc-500 mt-2 text-sm font-semibold">Loading invoice details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-md">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-4">Invoice Not Found</h2>
          <p className="text-zinc-550 dark:text-zinc-400 mt-2 text-sm">
            The link you followed is invalid, expired, or has been revoked.
          </p>
        </div>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50";
      case "SENT":
      case "VIEWED":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/35 dark:text-blue-400 border-blue-200 dark:border-blue-900/50";
      case "OVERDUE":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/35 dark:text-rose-400 border-rose-200 dark:border-rose-900/50";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-750";
    }
  };

  const currency = invoice.organization.currency;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-10 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Banner Action Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800/80 rounded-xl p-4.5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 dark:text-white text-sm">Invoice {invoice.number}</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusStyle(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Issued by <strong className="text-zinc-700 dark:text-zinc-300">{invoice.organization.name}</strong> on {formatDate(invoice.issueDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/api/public/invoice/${viewToken}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.75 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-97 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Download PDF
            </a>

            {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
              <button
                onClick={handlePay}
                disabled={paying || paySuccess}
                className="inline-flex items-center justify-center gap-1.5 px-4.5 py-1.75 text-xs font-bold text-white bg-violet-650 hover:bg-violet-750 rounded-lg shadow-sm shadow-violet-100 dark:shadow-none active:scale-97 disabled:opacity-50 transition-all cursor-pointer"
              >
                {paying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-3.5 w-3.5" /> Pay {formatCurrency(invoice.total, currency)}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Invoice Body Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-md p-6 sm:p-10 relative overflow-hidden">
          {invoice.status === "PAID" && (
            <div className="absolute top-12 right-12 border-4 border-emerald-500/30 text-emerald-500 dark:text-emerald-400 font-black text-2xl uppercase tracking-widest px-4 py-2 rounded-lg rotate-12 pointer-events-none">
              Paid
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 border-b border-zinc-150 dark:border-zinc-800/80 pb-8">
            <div>
              <h1 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Invoice</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Ref: {invoice.number}</p>
            </div>
            
            <div className="text-sm sm:text-right">
              <h2 className="font-extrabold text-zinc-850 dark:text-zinc-150">{invoice.organization.name}</h2>
              {invoice.organization.address && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 whitespace-pre-wrap">{invoice.organization.address}</p>
              )}
              {invoice.organization.taxNumber && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {invoice.organization.taxName}: {invoice.organization.taxNumber}
                </p>
              )}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-b border-zinc-150 dark:border-zinc-800/80 text-xs">
            <div>
              <span className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Billed To</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-1.5 block">{invoice.client.name}</span>
              <span className="text-zinc-500 mt-0.5 block">{invoice.client.email}</span>
              {invoice.client.address && (
                <span className="text-zinc-500 mt-1 block whitespace-pre-wrap">{invoice.client.address}</span>
              )}
            </div>

            <div>
              <span className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Issue Date</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-250 mt-1.5 block">{formatDate(invoice.issueDate)}</span>
            </div>

            <div>
              <span className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Due Date</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-250 mt-1.5 block">{formatDate(invoice.dueDate)}</span>
            </div>

            <div>
              <span className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Payment Status</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold border mt-1.5 ${getStatusStyle(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="py-3 pr-4">Description</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Rate</th>
                    {invoice.items.some(i => i.taxRate > 0) && (
                      <th className="py-3 px-4 text-center">Tax</th>
                    )}
                    <th className="py-3 pl-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="text-zinc-800 dark:text-zinc-200">
                      <td className="py-4 pr-4 font-semibold">{item.description}</td>
                      <td className="py-4 px-4 text-center">{item.quantity}</td>
                      <td className="py-4 px-4 text-right">{formatCurrency(item.rate, currency)}</td>
                      {invoice.items.some(i => i.taxRate > 0) && (
                        <td className="py-4 px-4 text-center">{item.taxRate}%</td>
                      )}
                      <td className="py-4 pl-4 text-right font-bold">{formatCurrency(item.amount, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Totals */}
          <div className="border-t border-zinc-150 dark:border-zinc-800/80 pt-6 flex justify-end">
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal, currency)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>Discount</span>
                  <span>-{formatCurrency(invoice.discount, currency)}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                  <span>{invoice.organization.taxName || "Tax"} Amount</span>
                  <span>{formatCurrency(invoice.taxAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black border-t border-zinc-150 dark:border-zinc-800/80 pt-2 text-zinc-900 dark:text-white">
                <span>Total Due</span>
                <span>{formatCurrency(invoice.total, currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="border-t border-zinc-150 dark:border-zinc-800/80 pt-6 mt-8 grid md:grid-cols-2 gap-6 text-[11px] text-zinc-500 dark:text-zinc-400">
              {invoice.notes && (
                <div>
                  <h4 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Notes</h4>
                  <p className="whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h4 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Terms & Conditions</h4>
                  <p className="whitespace-pre-wrap leading-relaxed">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="flex justify-center items-center gap-1.5 text-zinc-400 dark:text-zinc-500 text-[10px] font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-violet-500" />
          <span>Secured invoice generated by BillFlow.</span>
        </div>
      </div>
    </div>
  );
}
