"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Check, Shield, Zap, Sparkles, RefreshCw, Users, BarChart3, 
  FileText, Globe, Menu, X, CheckCircle2, ChevronDown, Landmark, Receipt
} from "lucide-react";
import { useTheme } from "@/components/shared/providers";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <Landmark className="h-6 w-6 text-violet-500" />,
      title: "Multi-Workspace Architecture",
      description: "Manage billing for multiple organizations or side-hustles from a single dashboard. Toggle contexts instantly."
    },
    {
      icon: <FileText className="h-6 w-6 text-violet-500" />,
      title: "Automated PDF Invoices",
      description: "Generate beautiful, professional PDF invoices on the fly using industry-designed templates (Modern, Classic, Minimal)."
    },
    {
      icon: <Globe className="h-6 w-6 text-violet-500" />,
      title: "Branded Client Portal",
      description: "Provide clients with secure, passwordless portals to view status, download PDFs, and record manual payment confirmations."
    },
    {
      icon: <RefreshCw className="h-6 w-6 text-violet-500" />,
      title: "Recurring Billing Schedules",
      description: "Configure billing frequencies (weekly, monthly, quarterly, yearly) and automatically generate and email invoices."
    },
    {
      icon: <Users className="h-6 w-6 text-violet-500" />,
      title: "Role-Based Access Control",
      description: "Invite your accountant or partner with custom access levels (Owner, Admin, Member) to keep financial data secure."
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-violet-500" />,
      title: "Revenue & Aging Analytics",
      description: "Analyze monthly revenue trends, top paying clients, and aging overdue invoices with deep aggregated metrics."
    }
  ];

  const faqs = [
    {
      q: "Can I manage multiple businesses under one account?",
      a: "Yes! BillFlow is built from the ground up to support multi-tenancy. You can create or join multiple organizations and easily switch between them from the top navigation bar. All data, clients, and settings are strictly isolated."
    },
    {
      q: "Is there a limit on how many invoices I can send?",
      a: "The Free plan allows you to manage up to 3 clients and send up to 5 invoices. Upgrading to the Pro plan removes all limits, allowing you to create unlimited invoices and register unlimited clients."
    },
    {
      q: "How does the client portal work?",
      a: "Every client gets a secure, private tokenized link to their client portal. They don't need a password to login; clicking the link grants them instant access to view their invoice list, check payment statuses, and download PDFs."
    },
    {
      q: "Can I customize the design of my invoices?",
      a: "Absolutely. We offer three pre-designed invoice templates: Modern (bold violet details), Classic (traditional serif layouts), and Minimal (clean, black-and-white grid). You can switch between templates on the fly."
    },
    {
      q: "Does BillFlow process payments directly?",
      a: "BillFlow supports Stripe integrations for SaaS subscriptions. For invoice payments, you can add your bank terms or payment links directly onto the invoices, and clients can confirm their payments through the portal."
    },
    {
      q: "How secure is my financial data?",
      a: "Every query in BillFlow is strictly isolated using organization-level tenant database extensions. Data is hosted on Supabase (PostgreSQL) with industry-grade SSL encryption and secure role-based controls."
    }
  ];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-violet-500 selection:text-white transition-colors duration-300">
      
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-500/20">
              BF
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
              BillFlow
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#features" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all active:scale-95"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <Link 
              href="/login" 
              className="text-sm font-semibold hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/login" 
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg shadow-md shadow-violet-500/20 hover:shadow-violet-600/30 transition-all duration-200 active:scale-95"
            >
              Start Free
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-4 shadow-lg"
          >
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium hover:text-violet-600 transition-colors"
            >
              Features
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium hover:text-violet-600 transition-colors"
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium hover:text-violet-600 transition-colors"
            >
              FAQ
            </a>
            <hr className="border-zinc-200 dark:border-zinc-800" />
            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2 font-semibold hover:text-violet-600"
            >
              Sign In
            </Link>
            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg"
            >
              Start Free
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/50 border border-violet-200/50 dark:border-violet-800/30 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" /> Next-generation Invoicing
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none mb-6">
              Invoice smarter. <br />
              <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                Get paid faster.
              </span>
            </h1>
            
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mb-8 leading-relaxed">
              BillFlow simplifies invoicing, recurring plans, client portal payments, and multi-tenant management so you can focus on growing your business.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Link 
                href="/login" 
                className="px-6 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg shadow-lg shadow-violet-500/20 flex items-center gap-2 hover:shadow-violet-600/35 transition-all duration-200 active:scale-95"
              >
                Create Free Account <ArrowRight className="h-5 w-5" />
              </Link>
              <a 
                href="#features" 
                className="px-6 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 font-semibold rounded-lg transition-all duration-200 active:scale-95"
              >
                Explore Features
              </a>
            </div>

            {/* Social Proof Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 w-full">
              <div className="flex -space-x-2.5">
                {[
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80"
                ].map((src, i) => (
                  <img 
                    key={i} 
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-950 object-cover" 
                    src={src} 
                    alt="User avatar" 
                  />
                ))}
              </div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Trusted by <span className="text-zinc-900 dark:text-zinc-100 font-bold">3,200+ freelancers</span> and agency owners globally.
              </div>
            </div>
          </div>

          {/* Animated Dashboard Mockup (Styled Div) */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 rounded-2xl blur-2xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-5 overflow-hidden"
            >
              {/* Mockup Topbar */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/80 mb-5">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500 font-medium">
                  billflow.co/dashboard
                </div>
                <div className="w-10 h-1.5" />
              </div>

              {/* Mockup Dashboard Body */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-5 w-16 bg-violet-100 dark:bg-violet-950 text-[10px] font-semibold text-violet-700 dark:text-violet-300 rounded-full flex items-center justify-center">
                    PRO Plan
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border border-zinc-100 dark:border-zinc-800/80 rounded-lg">
                    <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                    <div className="text-lg font-bold text-violet-600 dark:text-violet-400">₹4,25,000</div>
                    <div className="h-2.5 w-12 bg-green-100 dark:bg-green-950/30 rounded mt-1.5" />
                  </div>
                  <div className="p-3 border border-zinc-100 dark:border-zinc-800/80 rounded-lg">
                    <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                    <div className="text-lg font-bold text-zinc-800 dark:text-zinc-200">₹84,500</div>
                    <div className="h-2.5 w-12 bg-red-100 dark:bg-red-950/30 rounded mt-1.5" />
                  </div>
                </div>

                {/* Mock Chart Area */}
                <div className="border border-zinc-100 dark:border-zinc-800/80 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="flex gap-1">
                      <span className="w-6 h-2 bg-violet-500 rounded-sm" />
                      <span className="w-6 h-2 bg-zinc-300 rounded-sm" />
                    </div>
                  </div>
                  <div className="h-24 flex items-end gap-1.5 pt-2 border-b border-zinc-100 dark:border-zinc-850">
                    <div className="h-[40%] w-full bg-violet-100 dark:bg-violet-950/50 rounded-t-sm" />
                    <div className="h-[60%] w-full bg-violet-200 dark:bg-violet-900/60 rounded-t-sm" />
                    <div className="h-[55%] w-full bg-violet-300 dark:bg-violet-800/60 rounded-t-sm" />
                    <div className="h-[80%] w-full bg-violet-400 dark:bg-violet-700/60 rounded-t-sm" />
                    <div className="h-[95%] w-full bg-violet-600 rounded-t-sm" />
                  </div>
                </div>

                {/* Mock Invoices list */}
                <div className="space-y-2">
                  <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                  {[
                    { number: "INV-2026-004", client: "Acme Corp", status: "PAID", statusColor: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
                    { number: "INV-2026-005", client: "Nikhil Dev", status: "OVERDUE", statusColor: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" }
                  ].map((inv, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 rounded-lg text-[10px]">
                      <div className="flex gap-2 items-center">
                        <span className="font-semibold">{inv.number}</span>
                        <span className="text-zinc-500">{inv.client}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[8px] ${inv.statusColor}`}>
                        {inv.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-20 bg-white dark:bg-zinc-900/40 border-y border-zinc-200/50 dark:border-zinc-800/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-2">Features</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Everything you need to bill globally
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-16">
            Robust tools tailored for freelancers, contractors, and agencies, engineered to streamline invoicing pipelines.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-8 rounded-xl text-left hover:border-violet-500/40 dark:hover:border-violet-500/40 hover:shadow-lg dark:hover:shadow-black/20 hover:scale-[1.01] transition-all duration-200"
              >
                <div className="h-12 w-12 rounded-lg bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center mb-6">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold mb-3">{feat.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-2">Workflow</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-16">
            Get paid in 3 steps
          </p>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {[
              {
                step: "01",
                title: "Setup Your Business",
                desc: "Create your organization profile, customize default terms, select a templates styling, and add your details."
              },
              {
                step: "02",
                title: "Draft & Generate",
                desc: "Add items, configure tax, click 'Save Draft'. Previews auto-generate server side instantly using React PDF."
              },
              {
                step: "03",
                title: "Send & Collect",
                desc: "Dispatch the email containing private portal links. Get notified once client views, downloads, or completes payment."
              }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-6 relative">
                <span className="text-5xl font-extrabold text-violet-100 dark:text-zinc-800 mb-4">{step.step}</span>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xs leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white dark:bg-zinc-900/40 border-y border-zinc-200/50 dark:border-zinc-800/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-2">Pricing</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Simple, honest pricing
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto mb-16">
            Free forever for early-stage freelancers. Upgrade to Pro when you scale your team.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Free Plan */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col justify-between hover:shadow-lg transition-shadow">
              <div>
                <h3 className="text-xl font-bold mb-2 text-left">Free Tier</h3>
                <p className="text-sm text-zinc-500 text-left mb-6">Great for testing and micro-freelancing.</p>
                <div className="text-4xl font-extrabold text-left mb-6 text-zinc-900 dark:text-zinc-100">
                  ₹0 <span className="text-sm font-normal text-zinc-500">/ forever</span>
                </div>
                <hr className="border-zinc-100 dark:border-zinc-800 mb-6" />
                <ul className="space-y-3.5 text-sm text-zinc-600 dark:text-zinc-400 text-left">
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-violet-500 shrink-0" /> Up to 3 client profiles
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-violet-500 shrink-0" /> Up to 5 invoice drafts/sent
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-violet-500 shrink-0" /> Standard PDF Invoicing
                  </li>
                  <li className="flex items-center gap-2 text-zinc-400 line-through">
                    <Check className="h-4.5 w-4.5 text-zinc-300 dark:text-zinc-700 shrink-0" /> Team workspaces (RBAC)
                  </li>
                  <li className="flex items-center gap-2 text-zinc-400 line-through">
                    <Check className="h-4.5 w-4.5 text-zinc-300 dark:text-zinc-700 shrink-0" /> Automated recurring cron-rules
                  </li>
                </ul>
              </div>
              <Link 
                href="/login" 
                className="mt-8 w-full py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold rounded-lg text-center transition-colors active:scale-98"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-violet-500 rounded-2xl p-8 flex flex-col justify-between shadow-xl shadow-violet-500/5 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider">
                Recommended
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-left">Pro Plan</h3>
                <p className="text-sm text-zinc-500 text-left mb-6">For professional businesses and agencies.</p>
                <div className="text-4xl font-extrabold text-left mb-6 text-zinc-900 dark:text-zinc-100">
                  ₹899 <span className="text-sm font-normal text-zinc-500">/ month</span>
                </div>
                <hr className="border-zinc-100 dark:border-zinc-800 mb-6" />
                <ul className="space-y-3.5 text-sm text-zinc-600 dark:text-zinc-400 text-left">
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-violet-500 shrink-0" /> <strong>Unlimited</strong> clients
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-violet-500 shrink-0" /> <strong>Unlimited</strong> invoices
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-violet-500 shrink-0" /> PDF invoices with custom templates
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-violet-500 shrink-0" /> Multi-org toggle contextual workspaces
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-violet-500 shrink-0" /> Team Access & RBAC (Admin, Members)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-violet-500 shrink-0" /> Automated recurring cron-rules
                  </li>
                </ul>
              </div>
              <Link 
                href="/login" 
                className="mt-8 w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg text-center shadow-lg shadow-violet-500/20 hover:shadow-violet-600/30 transition-all active:scale-98"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-2">FAQ</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-16">
            Frequently Asked Questions
          </p>

          <div className="space-y-4 text-left">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-colors"
              >
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-250 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4.5 w-4.5 text-zinc-500 transition-transform duration-200 ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1 text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-violet-600 flex items-center justify-center text-white font-bold text-lg">
              BF
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              BillFlow
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            &copy; 2026 BillFlow Inc. All rights reserved. Built with Next.js & Supabase.
          </p>
          <div className="flex gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <a href="#" className="hover:text-violet-600">Privacy Policy</a>
            <a href="#" className="hover:text-violet-600">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
