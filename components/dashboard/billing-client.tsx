"use client";

import React, { useState } from "react";
import { 
  CreditCard, Check, ShieldAlert, Sparkles, 
  Loader2, ArrowRight, TrendingUp, HelpCircle 
} from "lucide-react";
import { toast } from "sonner";

interface LimitMetric {
  allowed: boolean;
  current: number;
  limit: number;
  label: string;
}

interface BillingClientProps {
  organization: {
    id: string;
    name: string;
    plan: "FREE" | "PRO";
  };
  limits: {
    invoices: LimitMetric;
    clients: LimitMetric;
    members: LimitMetric;
  };
  role: string;
}

export default function BillingClient({ organization, limits, role }: BillingClientProps) {
  const [loading, setLoading] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [utr, setUtr] = useState("");
  const [isUpiSubmitting, setIsUpiSubmitting] = useState(false);

  const handleUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (utr.length < 8) {
      toast.error("Please enter a valid Transaction ID / UTR Number.");
      return;
    }

    setIsUpiSubmitting(true);
    try {
      const res = await fetch("/api/organizations/upi-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utr }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("UPI payment submitted! Your workspace has been upgraded to PRO.");
        setIsUpiModalOpen(false);
        setUtr("");
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to process UPI upgrade request.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsUpiSubmitting(false);
    }
  };

  const handleStripeAction = async (action: "subscribe" | "portal") => {
    if (role !== "OWNER") {
      toast.error("Only workspace owners can modify subscription plans.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to initiate Stripe session.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const isPro = organization.plan === "PRO";

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white md:text-3xl">
          Billing & Subscription
        </h1>
        <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
          Manage your organization pricing plan, track invoice limits and billing portal.
        </p>
      </div>

      {/* Grid: Plan Card & Usage Limits */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: Plan Summary Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-6 shadow-xs md:col-span-2 flex flex-col justify-between relative overflow-hidden group">
          {isPro && (
            <div className="absolute top-0 right-0 h-24 w-24 bg-violet-500/10 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4" />
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block">Active Plan</span>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white mt-1">
                  {isPro ? "Pro Subscription" : "Free Tier"}
                </h3>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                isPro 
                  ? "bg-violet-100 text-violet-750 dark:bg-violet-950/35 dark:text-violet-400 border border-violet-250 dark:border-violet-900/30" 
                  : "bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-750"
              }`}>
                {isPro ? "PRO" : "FREE"}
              </span>
            </div>

            <p className="text-xs text-zinc-550 dark:text-zinc-400">
              {isPro 
                ? "You have full, unrestricted access to all premium features of BillFlow including unlimited invoices, clients, team collaborations, and automated recurring invoice emails."
                : "You are currently on the Free plan. To raise your invoice creation and client registration limits, upgrade your workspace to the Pro subscription plan."
              }
            </p>

            <div className="border-t border-zinc-150 dark:border-zinc-800/80 pt-4 flex justify-between items-center text-xs">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 font-semibold block">Cost</span>
                <span className="font-extrabold text-zinc-900 dark:text-white text-base">
                  {isPro ? "₹499 / Month" : "₹0 / Lifetime"}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 dark:text-zinc-505 font-semibold block">Billing Cycle</span>
                <span className="font-bold text-zinc-600 dark:text-zinc-400">
                  {isPro ? "Monthly" : "None"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            {role !== "OWNER" ? (
              <p className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                <ShieldAlert className="h-4 w-4" /> Subscription management is restricted to organization owners.
              </p>
            ) : isPro ? (
              <button
                onClick={() => handleStripeAction("portal")}
                disabled={loading}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.25 rounded-lg text-xs font-bold text-white shadow-sm transition-all active:scale-97 cursor-pointer bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Customer Billing Portal
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleStripeAction("subscribe")}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-zinc-850 dark:text-zinc-900 shadow-sm transition-all active:scale-97 cursor-pointer bg-white border border-zinc-200 hover:bg-zinc-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Pay with Card (Stripe)
                </button>
                
                <button
                  onClick={() => setIsUpiModalOpen(true)}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-sm transition-all active:scale-97 cursor-pointer bg-violet-650 hover:bg-violet-750 shadow-lg shadow-violet-500/10"
                >
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Pay with UPI (QR Code)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Limits meter */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Workspace Usage</h4>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">Summary of workspace resource allocations</p>
            
            <div className="space-y-4 mt-6">
              {/* Invoices */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-zinc-650 dark:text-zinc-350">
                  <span>Invoices Issued</span>
                  <span>{limits.invoices.label}</span>
                </div>
                {limits.invoices.limit !== Infinity ? (
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-violet-650 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (limits.invoices.current / limits.invoices.limit) * 105)}%` }}
                    />
                  </div>
                ) : (
                  <div className="w-full bg-violet-100 dark:bg-violet-955/20 h-1.5 rounded-full mt-1.5" />
                )}
              </div>

              {/* Clients */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-zinc-650 dark:text-zinc-355">
                  <span>Clients Managed</span>
                  <span>{limits.clients.label}</span>
                </div>
                {limits.clients.limit !== Infinity ? (
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-violet-650 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (limits.clients.current / limits.clients.limit) * 105)}%` }}
                    />
                  </div>
                ) : (
                  <div className="w-full bg-violet-100 dark:bg-violet-955/20 h-1.5 rounded-full mt-1.5" />
                )}
              </div>

              {/* Members */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-zinc-650 dark:text-zinc-355">
                  <span>Team Collaborators</span>
                  <span>{limits.members.label}</span>
                </div>
                {limits.members.limit !== Infinity ? (
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-violet-650 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (limits.members.current / limits.members.limit) * 105)}%` }}
                    />
                  </div>
                ) : (
                  <div className="w-full bg-violet-100 dark:bg-violet-955/20 h-1.5 rounded-full mt-1.5" />
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-150 dark:border-zinc-800/80 pt-4 mt-6 text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold">
            Usage resets instantly when upgrading subscription status.
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-6 shadow-xs">
        <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Compare subscription tiers</h3>
        <p className="text-[10px] text-zinc-450 dark:text-zinc-550 mt-0.5">View limits and feature sets across plan specifications</p>

        <div className="grid gap-4 md:grid-cols-2 mt-6">
          {/* Free Plan */}
          <div className="border border-zinc-150 dark:border-zinc-805 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-900 dark:text-white text-sm">Free Starter</span>
              <span className="text-xs font-black">₹0</span>
            </div>
            <ul className="space-y-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-violet-550 shrink-0" /> Max 5 Invoices</li>
              <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-violet-550 shrink-0" /> Max 3 Client Ledger Accounts</li>
              <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-violet-550 shrink-0" /> Max 2 Team members</li>
              <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-violet-550 shrink-0" /> Professional Modern PDF templates</li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="border border-violet-250 dark:border-violet-900/50 bg-violet-50/20 dark:bg-violet-955/5 rounded-xl p-5 space-y-4 relative">
            <div className="absolute top-3 right-3 text-[9px] font-black tracking-widest text-violet-650 bg-violet-100 dark:bg-violet-950/50 px-2 py-0.5 rounded uppercase">
              Popular
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-violet-750 dark:text-violet-400 text-sm">Pro Workspace</span>
              <span className="text-xs font-black text-violet-700 dark:text-violet-400">₹499 / mo</span>
            </div>
            <ul className="space-y-2 text-xs font-medium text-violet-900 dark:text-violet-300">
              <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-violet-500 shrink-0" /> Unlimited Invoices</li>
              <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-violet-550 shrink-0" /> Unlimited Clients Profiles</li>
              <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-violet-550 shrink-0" /> Unlimited Team Collaboration</li>
              <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-violet-550 shrink-0" /> Auto recurring invoices + email logs</li>
              <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-violet-550 shrink-0" /> Priority Server PDF stream generation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* UPI Payment Modal */}
      {isUpiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white">Pay via UPI QR Code</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Scan the QR code using any UPI app (GPay, PhonePe, Paytm)</p>
              </div>
              <button
                onClick={() => {
                  setIsUpiModalOpen(false);
                  setUtr("");
                }}
                className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-200 transition-colors text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center py-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-lg border border-zinc-150 dark:border-zinc-800 mb-4">
              <div className="bg-white p-2.5 rounded-lg shadow-xs border border-zinc-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    `upi://pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || "pay-billflow@upi"}&pn=BillFlow%20Labs&am=499.00&cu=INR&tn=BillFlow%20Pro%2520Upgrade`
                  )}`}
                  alt="UPI QR Code"
                  className="h-[160px] w-[160px] block"
                />
              </div>
              
              <div className="text-center mt-3">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">UPI Address</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 select-all">
                  {process.env.NEXT_PUBLIC_UPI_ID || "pay-billflow@upi"}
                </span>
              </div>
              
              <div className="mt-2 text-center">
                <span className="text-[9px] font-semibold text-zinc-450 block">Pay Amount</span>
                <span className="text-base font-black text-violet-650">₹499.00</span>
              </div>
            </div>

            {/* Instruction / Form */}
            <form onSubmit={handleUpiSubmit} className="space-y-4">
              <div>
                <label htmlFor="utr" className="block text-[9px] font-bold uppercase text-zinc-400 mb-1">
                  Transaction UTR / Reference ID
                </label>
                <input
                  id="utr"
                  type="text"
                  placeholder="Enter UPI Ref ID (e.g. 12-digit UTR)"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUpiModalOpen(false);
                    setUtr("");
                  }}
                  className="w-1/2 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpiSubmitting}
                  className="w-1/2 py-2 bg-violet-600 hover:bg-violet-750 disabled:bg-violet-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/10"
                >
                  {isUpiSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Upgrading...
                    </>
                  ) : (
                    <>Submit Payment</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
