import React from "react";
import Link from "next/link";
import { 
  Receipt, Users2, AlertCircle, CheckCircle2, 
  TrendingUp, ArrowUpRight, Plus, Package, Users, Settings, CreditCard 
} from "lucide-react";
import { requireRole } from "@/lib/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";
import RevenueChart from "@/components/dashboard/revenue-chart";
import { checkPlanLimits } from "@/lib/stripe";

import { redirect } from "next/navigation";

export const revalidate = 0; // Disable static rendering

export default async function DashboardPage() {
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) {
    redirect("/login");
  }

  const { db, organization } = authCheck;

  // 1. Fetch Invoices and calculate stats
  const invoices = await db.invoice.findMany({
    include: {
      client: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const totalPaid = invoices
    .filter(inv => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalOutstanding = invoices
    .filter(inv => ["SENT", "VIEWED", "OVERDUE"].includes(inv.status))
    .reduce((sum, inv) => sum + inv.total, 0);

  const overdueInvoices = invoices.filter(inv => inv.status === "OVERDUE");
  const overdueCount = overdueInvoices.length;
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

  const paidCount = invoices.filter(inv => inv.status === "PAID").length;

  // 2. Aggregate chart data for the last 6 months
  const now = new Date();
  const chartData = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthIndex = d.getMonth();
    const year = d.getFullYear();
    const label = `${monthNames[monthIndex]} ${year.toString().slice(-2)}`;

    // Invoices in this month/year
    const monthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.issueDate);
      return invDate.getMonth() === monthIndex && invDate.getFullYear() === year;
    });

    const paidVal = monthInvoices
      .filter(inv => inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.total, 0);

    const pendingVal = monthInvoices
      .filter(inv => ["SENT", "VIEWED", "OVERDUE"].includes(inv.status))
      .reduce((sum, inv) => sum + inv.total, 0);

    chartData.push({
      month: label,
      Paid: Math.round(paidVal),
      Pending: Math.round(pendingVal)
    });
  }

  // 3. Recent invoices (last 5)
  const recentInvoices = invoices.slice(0, 5);

  // 4. Usage status
  const invoiceLimit = await checkPlanLimits(organization.id, "invoices");
  const clientLimit = await checkPlanLimits(organization.id, "clients");
  const memberLimit = await checkPlanLimits(organization.id, "members");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50";
      case "SENT":
      case "VIEWED":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200 dark:border-blue-900/50";
      case "OVERDUE":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200 dark:border-rose-900/50";
      case "DRAFT":
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
    }
  };

  const currencySymbol = organization.currency === "INR" ? "₹" : "$";

  return (
    <div className="space-y-8 p-1">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-950 to-zinc-650 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent md:text-3xl">
            Welcome back to {organization.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Here's what's happening with your business today.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-750 active:scale-98 rounded-lg shadow-sm shadow-violet-100 dark:shadow-none transition-all"
          >
            <Plus className="h-4 w-4" /> New Invoice
          </Link>
        </div>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs relative overflow-hidden group hover:border-violet-300 dark:hover:border-violet-800/50 transition-all">
          <div className="absolute top-0 right-0 h-16 w-16 bg-violet-50/50 dark:bg-violet-950/10 rounded-bl-full flex items-center justify-center translate-x-2 -translate-y-2 group-hover:scale-105 transition-transform" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-black tracking-tight mt-0.5">{formatCurrency(totalPaid, organization.currency)}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{paidCount} paid invoice{paidCount === 1 ? "" : "s"}</span>
          </div>
        </div>

        {/* Card 2: Outstanding Balance */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-800/50 transition-all">
          <div className="absolute top-0 right-0 h-16 w-16 bg-blue-50/50 dark:bg-blue-950/10 rounded-bl-full flex items-center justify-center translate-x-2 -translate-y-2 group-hover:scale-105 transition-transform" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Outstanding</p>
              <h3 className="text-2xl font-black tracking-tight mt-0.5">{formatCurrency(totalOutstanding, organization.currency)}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span>Awaiting payment</span>
          </div>
        </div>

        {/* Card 3: Overdue Amount */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-800/50 transition-all">
          <div className="absolute top-0 right-0 h-16 w-16 bg-rose-50/50 dark:bg-rose-950/10 rounded-bl-full flex items-center justify-center translate-x-2 -translate-y-2 group-hover:scale-105 transition-transform" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Overdue</p>
              <h3 className="text-2xl font-black tracking-tight mt-0.5">{formatCurrency(overdueAmount, organization.currency)}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
            <span>{overdueCount} invoice{overdueCount === 1 ? "" : "s"} overdue</span>
          </div>
        </div>

        {/* Card 4: Plan Limit Usage */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-800 transition-all">
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Plan & Usage</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-750 dark:bg-violet-950/30 dark:text-violet-400 border border-violet-200 dark:border-violet-900/40 mt-1">
                  {organization.plan} Plan
                </span>
              </div>
              {organization.plan === "FREE" && (
                <Link
                  href="/dashboard/billing"
                  className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center hover:underline"
                >
                  Upgrade <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </Link>
              )}
            </div>

            <div className="mt-3 space-y-1.5">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  <span>Invoices</span>
                  <span>{invoiceLimit.label}</span>
                </div>
                {invoiceLimit.limit !== Infinity && (
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1 mt-0.5">
                    <div
                      className="bg-violet-600 h-1 rounded-full"
                      style={{ width: `${(invoiceLimit.current / invoiceLimit.limit) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  <span>Clients</span>
                  <span>{clientLimit.label}</span>
                </div>
                {clientLimit.limit !== Infinity && (
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1 mt-0.5">
                    <div
                      className="bg-violet-600 h-1 rounded-full"
                      style={{ width: `${(clientLimit.current / clientLimit.limit) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart View */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white">Revenue History</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Last 6 months comparison of paid vs pending revenue</p>
            </div>
          </div>
          <RevenueChart data={chartData} currencySymbol={currencySymbol} />
        </div>

        {/* Quick Actions & Short Cuts */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white">Quick Actions</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Navigate around BillFlow quickly</p>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Link
                href="/dashboard/invoices/new"
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-150 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:border-violet-300 dark:hover:border-violet-900/30 text-center transition-all group"
              >
                <Plus className="h-5 w-5 text-violet-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-1.5">New Invoice</span>
              </Link>
              
              <Link
                href="/dashboard/clients"
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-150 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:border-violet-300 dark:hover:border-violet-900/30 text-center transition-all group"
              >
                <Users2 className="h-5 w-5 text-violet-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-1.5">Add Client</span>
              </Link>

              <Link
                href="/dashboard/products"
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-150 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:border-violet-300 dark:hover:border-violet-900/30 text-center transition-all group"
              >
                <Package className="h-5 w-5 text-violet-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-1.5">Products Catalog</span>
              </Link>

              <Link
                href="/dashboard/team"
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-150 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:border-violet-300 dark:hover:border-violet-900/30 text-center transition-all group"
              >
                <Users className="h-5 w-5 text-violet-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-1.5">Manage Team</span>
              </Link>
            </div>
          </div>

          <div className="border-t border-zinc-150 dark:border-zinc-800/80 pt-4 mt-6">
            <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">Configure Settings</h4>
            <div className="space-y-1">
              <Link 
                href="/dashboard/settings" 
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-855 hover:text-zinc-900 dark:hover:text-white transition-all"
              >
                <Settings className="h-3.5 w-3.5 text-zinc-400" /> Default Invoice Settings
              </Link>
              <Link 
                href="/dashboard/billing" 
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-855 hover:text-zinc-900 dark:hover:text-white transition-all"
              >
                <CreditCard className="h-3.5 w-3.5 text-zinc-400" /> Subscription Details
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white">Recent Invoices</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Overview of the last 5 invoices created</p>
          </div>
          <Link
            href="/dashboard/invoices"
            className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center"
          >
            View all invoices <ArrowUpRight className="h-3.5 w-3.5 ml-0.5" />
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="p-10 text-center">
            <Receipt className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto" />
            <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 mt-2">No invoices found</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Get started by creating your very first invoice.</p>
            <Link
              href="/dashboard/invoices/new"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-md shadow-sm mt-4 active:scale-98"
            >
              <Plus className="h-3.5 w-3.5" /> Create Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold">
                  <th className="px-6 py-3">Invoice #</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Issue Date</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                {recentInvoices.map((inv) => (
                  <tr 
                    key={inv.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors font-medium"
                  >
                    <td className="px-6 py-4.5 font-bold text-zinc-900 dark:text-zinc-100">
                      {inv.number}
                    </td>
                    <td className="px-6 py-4.5 text-zinc-700 dark:text-zinc-300">
                      {inv.client.name}
                    </td>
                    <td className="px-6 py-4.5 text-zinc-500 dark:text-zinc-400">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="px-6 py-4.5 text-zinc-500 dark:text-zinc-400">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-6 py-4.5 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(inv.total, organization.currency)}
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <span className={`inline-flex px-2 py-0.75 rounded-full text-[10px] font-bold border ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="inline-flex items-center justify-center px-2.5 py-1.25 text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-97 transition-all"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
