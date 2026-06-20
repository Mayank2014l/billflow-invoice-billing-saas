"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  Building2, Globe, IndianRupee, DollarSign, Plus, Trash2, 
  ArrowRight, ArrowLeft, Check, Loader2, Landmark, Mail, ShieldAlert
} from "lucide-react";

interface InviteRow {
  email: string;
  role: "ADMIN" | "MEMBER";
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [taxName, setTaxName] = useState("GST");

  // Step 2 State
  const [address, setAddress] = useState("");
  const [taxNumber, setTaxNumber] = useState("");

  // Step 3 State
  const [invites, setInvites] = useState<InviteRow[]>([]);

  // Automatically compute slug from name
  useEffect(() => {
    if (step === 1) {
      const computedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(computedSlug);
    }
  }, [name, step]);

  // Auth Guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-2" />
        <span className="text-sm font-medium text-zinc-500">Loading your profile...</span>
      </div>
    );
  }

  if (!session) return null;

  const handleAddInvite = () => {
    setInvites([...invites, { email: "", role: "MEMBER" }]);
  };

  const handleRemoveInvite = (index: number) => {
    setInvites(invites.filter((_, idx) => idx !== index));
  };

  const handleInviteChange = (index: number, field: keyof InviteRow, value: string) => {
    const updated = [...invites];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setInvites(updated);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        toast.error("Please enter your organization name");
        return;
      }
      if (!slug.trim()) {
        toast.error("Please enter an organization URL slug");
        return;
      }
      if (!/^[a-z0-9-]+$/.test(slug)) {
        toast.error("Slug can only contain lowercase letters, numbers, and hyphens");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Filter out blank invites
    const activeInvites = invites.filter((inv) => inv.email.trim() !== "");

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          invoicePrefix,
          currency,
          taxName,
          taxNumber,
          address,
          invites: activeInvites,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create organization");
      }

      toast.success("Organization created successfully!");
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between py-12 transition-colors duration-300">
      <div className="max-w-xl w-full mx-auto px-4">
        {/* Progress Bar & Header */}
        <div className="mb-10 text-center">
          <div className="h-8 w-8 rounded bg-violet-600 flex items-center justify-center text-white font-bold text-lg mx-auto shadow-md shadow-violet-500/10 mb-4">
            BF
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Set up your workspace</h1>
          
          <div className="flex justify-between items-center max-w-xs mx-auto text-xs text-zinc-400 font-semibold mb-2">
            <span className={step >= 1 ? "text-violet-600 dark:text-violet-400" : ""}>Workspace</span>
            <span className={step >= 2 ? "text-violet-600 dark:text-violet-400" : ""}>Billing Info</span>
            <span className={step >= 3 ? "text-violet-600 dark:text-violet-400" : ""}>Invite Team</span>
          </div>
          
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              className="bg-violet-600 h-full"
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Wizard Form */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-xl relative min-h-[420px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-bold">Create your organization</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    This will be the shared space for your invoices, clients, and team members.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Organization Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
                      <input 
                        type="text" 
                        placeholder="e.g. Acme Corp" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">URL Slug</label>
                    <div className="relative flex items-center">
                      <span className="pl-3 pr-1 text-xs text-zinc-400 font-medium select-none bg-zinc-50 dark:bg-zinc-900 border-y border-l border-zinc-200 dark:border-zinc-800 rounded-l-lg py-2.5">
                        billflow.co/
                      </span>
                      <input 
                        type="text" 
                        placeholder="acme-corp" 
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                        className="w-full pr-4 pl-1 py-2 border border-zinc-200 dark:border-zinc-800 rounded-r-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Currency</label>
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    <div className="col-span-1">
                      <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Tax Name</label>
                      <input 
                        type="text" 
                        placeholder="GST" 
                        value={taxName}
                        onChange={(e) => setTaxName(e.target.value)}
                        className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Invoice Prefix</label>
                      <input 
                        type="text" 
                        placeholder="INV" 
                        value={invoicePrefix}
                        onChange={(e) => setInvoicePrefix(e.target.value)}
                        className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-bold">Billing Details</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    This information will appear as default sender info on all your invoices.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Business Address</label>
                    <textarea 
                      placeholder="e.g. 102, Hitech City, Hyderabad, India" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="w-full p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">{taxName} Number (Optional)</label>
                    <div className="relative">
                      <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
                      <input 
                        type="text" 
                        placeholder="e.g. 36AAAAA1111A1Z1" 
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-bold">Invite your team</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Send pending invitations to your team. You can also skip this and invite them later.
                  </p>
                </div>

                <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                  {invites.map((inv, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input 
                          type="email" 
                          placeholder="partner@example.com" 
                          value={inv.email}
                          onChange={(e) => handleInviteChange(idx, "email", e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500"
                        />
                      </div>
                      <select
                        value={inv.role}
                        onChange={(e) => handleInviteChange(idx, "role", e.target.value as any)}
                        className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                      >
                        <option value="MEMBER">Member (Read Only)</option>
                        <option value="ADMIN">Admin (Full Edit)</option>
                      </select>
                      <button 
                        onClick={() => handleRemoveInvite(idx)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <button 
                    onClick={handleAddInvite}
                    className="w-full py-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-500 hover:text-violet-600 hover:border-violet-500/40 dark:hover:bg-zinc-850 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Member Invite
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            {step > 1 ? (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors active:scale-98"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-500 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Create Workspace
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
