"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useOrg } from "@/hooks/use-org";
import { useTheme } from "@/components/shared/providers";
import { 
  LayoutDashboard, Receipt, Users2, Package, RefreshCw, Users, 
  BarChart3, Settings, CreditCard, Menu, X, Bell, Sun, Moon, 
  Search, ChevronDown, Plus, LogOut, Loader2, Building, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { organizations, activeOrg, role, switchOrg, isLoading: isOrgLoading } = useOrg();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Invoices", href: "/dashboard/invoices", icon: Receipt },
    { name: "Clients", href: "/dashboard/clients", icon: Users2 },
    { name: "Products/Services", href: "/dashboard/products", icon: Package },
    { name: "Recurring Invoices", href: "/dashboard/recurring", icon: RefreshCw },
    { name: "Team", href: "/dashboard/team", icon: Users },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Mobile Header Banner */}
      <header className="md:hidden h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-violet-600 flex items-center justify-center text-white font-bold text-lg">
            BF
          </div>
          <span className="font-extrabold tracking-tight">BillFlow</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out md:translate-x-0 md:relative
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand header */}
          <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-violet-600 flex items-center justify-center text-white font-bold text-lg">
                BF
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                BillFlow
              </span>
            </div>
            <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Org Switcher */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/85 relative">
            {isOrgLoading ? (
              <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              </div>
            ) : (
              <>
                <button
                  onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                  className="w-full flex items-center justify-between p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all text-left text-sm font-semibold active:scale-98"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building className="h-4.5 w-4.5 text-violet-500 shrink-0" />
                    <span className="truncate">{activeOrg?.name || "No Organization"}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                </button>

                <AnimatePresence>
                  {orgDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-4 right-4 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden py-1.5"
                    >
                      <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        My Workspaces
                      </div>
                      
                      {organizations.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => {
                            switchOrg(org.id);
                            setOrgDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center justify-between ${
                            org.id === activeOrg?.id ? "text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/20" : ""
                          }`}
                        >
                          <span className="truncate">{org.name}</span>
                          {org.id === activeOrg?.id && <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />}
                        </button>
                      ))}
                      
                      <hr className="my-1 border-zinc-150 dark:border-zinc-800" />
                      
                      <button
                        onClick={() => {
                          setOrgDropdownOpen(false);
                          router.push("/onboarding");
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" /> Create Workspace
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                    ${active 
                      ? "bg-violet-500 text-white shadow-md shadow-violet-500/15" 
                      : "text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }
                  `}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? "text-white" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 truncate text-left w-full hover:bg-zinc-50 dark:hover:bg-zinc-850 p-1.5 rounded-lg transition-colors"
          >
            <img 
              src={session?.user?.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80"}
              alt="Avatar"
              className="h-8 w-8 rounded-full object-cover shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-800"
            />
            <div className="truncate flex-1">
              <div className="text-xs font-bold truncate">{session?.user?.name || "User Account"}</div>
              <div className="text-[10px] text-zinc-500 truncate">{session?.user?.email}</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          </button>

          <AnimatePresence>
            {userDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-16 left-4 right-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden py-1"
              >
                <div className="px-3 py-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-violet-500" /> Role: {role || "MEMBER"}
                </div>
                <hr className="border-zinc-100 dark:border-zinc-800" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Panel Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="hidden md:flex h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 items-center justify-between px-8 sticky top-0 z-30 transition-colors duration-300">
          {/* Left search */}
          <div className="w-80 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search invoices, clients..." 
              className="w-full pl-9 pr-4 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Dark Mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors active:scale-95"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors relative"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-violet-600" />
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 p-4"
                  >
                    <div className="font-bold text-xs mb-2 text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                      Recent Activity
                    </div>
                    <div className="space-y-2 text-[11px] text-zinc-650 dark:text-zinc-400">
                      <div className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 rounded">
                        <strong>Invoice SENT</strong>: INV-2026-004 sent to client.
                      </div>
                      <div className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 rounded">
                        <strong>System Notification</strong>: Active workspace set to {activeOrg?.name}.
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Content */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
