import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getActiveOrg } from "@/lib/permissions";
import { getTenantDb } from "@/lib/tenant";
import { 
  ArrowLeft, Download, Edit2, Send, CheckCircle, Trash2, 
  Copy, Calendar, Mail, FileText, Landmark, Clock, Activity
} from "lucide-react";
import InvoiceDetailActions from "@/components/invoice/invoice-detail-actions";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const activeOrgInfo = await getActiveOrg(session.user.id);
  if (!activeOrgInfo) {
    redirect("/onboarding");
  }

  const { organization, role } = activeOrgInfo;

  // Fetch invoice securely using tenant database isolation
  const db = getTenantDb(organization.id);
  const invoice = await db.invoice.findFirst({
    where: { id },
    include: {
      client: true,
      items: true,
    },
  });

  if (!invoice) {
    redirect("/dashboard/invoices");
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Back button and actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
        
        {/* Interactive client Actions handles API trigger states */}
        <InvoiceDetailActions 
          invoiceId={invoice.id} 
          number={invoice.number}
          status={invoice.status} 
          role={role}
        />
      </div>

      {/* Main detail splits: Left layout preview, Right audit/timeline */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2 cols: Invoice Visual Display */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-start border-b border-zinc-150 dark:border-zinc-800 pb-6">
            <div>
              <div className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">{organization.name}</div>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 max-w-[240px] leading-relaxed">
                {organization.address || "No Address Set"}
              </p>
              {organization.taxNumber && (
                <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-1">
                  {organization.taxName}: {organization.taxNumber}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold inline-block mb-3 ${
                invoice.status === "PAID" 
                  ? "bg-green-50 text-green-700 border-green-200/50 dark:bg-green-950/30 dark:text-green-400" 
                  : invoice.status === "SENT"
                  ? "bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-950/30 dark:text-blue-400"
                  : invoice.status === "OVERDUE"
                  ? "bg-red-50 text-red-700 border-red-200/50 dark:bg-red-950/30 dark:text-red-400"
                  : "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-850 dark:text-zinc-400"
              }`}>
                {invoice.status}
              </span>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-55">INVOICE</h1>
              <p className="text-xs text-zinc-500 mt-1">#: {invoice.number}</p>
            </div>
          </div>

          {/* Billing Info split */}
          <div className="grid sm:grid-cols-2 gap-6 text-xs leading-normal">
            <div>
              <div className="font-bold text-zinc-450 uppercase tracking-widest text-[9px] mb-2">BILL TO</div>
              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{invoice.client.name}</div>
              <div className="text-zinc-500 flex items-center gap-1 mt-1">
                <Mail className="h-3.5 w-3.5" /> {invoice.client.email}
              </div>
              {invoice.client.address && (
                <p className="text-zinc-550 dark:text-zinc-400 mt-1 max-w-[200px]">
                  {invoice.client.address}
                </p>
              )}
              {invoice.client.taxNumber && (
                <p className="text-zinc-450 dark:text-zinc-500 mt-1">
                  Tax ID: {invoice.client.taxNumber}
                </p>
              )}
            </div>
            
            <div className="sm:text-right space-y-1.5">
              <div className="font-bold text-zinc-450 uppercase tracking-widest text-[9px] mb-2 sm:text-right">Metadata</div>
              <div className="flex justify-between sm:justify-end gap-4 text-zinc-500">
                <span>Issue Date:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-4 text-zinc-500">
                <span>Due Date:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.paidAt && (
                <div className="flex justify-between sm:justify-end gap-4 text-zinc-500">
                  <span>Paid On:</span>
                  <span className="font-semibold text-green-650">{formatDate(invoice.paidAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-850/50 text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3 text-right">Tax</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                {invoice.items.map((item) => (
                  <tr key={item.id} className="text-zinc-700 dark:text-zinc-350">
                    <td className="p-3 max-w-[200px] truncate">{item.description}</td>
                    <td className="p-3 text-right">{item.quantity}</td>
                    <td className="p-3 text-right">{organization.currency} {item.rate.toFixed(2)}</td>
                    <td className="p-3 text-right">{item.taxRate}%</td>
                    <td className="p-3 text-right font-semibold text-zinc-900 dark:text-zinc-200">
                      {organization.currency} {item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals split */}
          <div className="flex flex-col items-end space-y-2 text-xs border-t border-zinc-150 dark:border-zinc-800 pt-4 text-zinc-500">
            <div className="flex w-48 justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-zinc-850 dark:text-zinc-200">{organization.currency} {invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex w-48 justify-between">
                <span>Discount:</span>
                <span className="font-semibold text-zinc-850 dark:text-zinc-200">-{organization.currency} {invoice.discount.toFixed(2)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex w-48 justify-between">
                <span>Tax ({organization.taxName}):</span>
                <span className="font-semibold text-zinc-850 dark:text-zinc-200">{organization.currency} {invoice.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <hr className="w-48 border-zinc-100 dark:border-zinc-800 my-1" />
            <div className="flex w-48 justify-between font-bold text-sm text-zinc-900 dark:text-zinc-50">
              <span>Total:</span>
              <span className="text-violet-600 dark:text-violet-400">{organization.currency} {invoice.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Bottom Notes */}
          {(invoice.notes || invoice.terms) && (
            <div className="pt-6 border-t border-zinc-150 dark:border-zinc-800 space-y-4 text-[11px] text-zinc-500 leading-relaxed">
              {invoice.notes && (
                <div>
                  <div className="font-bold text-zinc-400 uppercase tracking-widest text-[8px] mb-1">Notes</div>
                  <p>{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <div className="font-bold text-zinc-400 uppercase tracking-widest text-[8px] mb-1">Terms & Conditions</div>
                  <p>{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right 1 col: Timeline & Activity Logs */}
        <div className="space-y-6">
          
          {/* Status timeline progress */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-violet-500" /> Status Timeline
            </h3>
            
            <div className="relative pl-6 space-y-6 border-l-2 border-zinc-150 dark:border-zinc-800 py-1 text-xs">
              {/* Draft state */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-violet-600 border-4 border-white dark:border-zinc-900" />
                <div className="font-bold text-zinc-800 dark:text-zinc-200">Invoice Drafted</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Created: {formatDate(invoice.createdAt)}</div>
              </div>

              {/* Sent state */}
              <div className="relative">
                <span className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-4 border-white dark:border-zinc-900 ${
                  invoice.status !== "DRAFT" ? "bg-violet-600" : "bg-zinc-200 dark:bg-zinc-800"
                }`} />
                <div className={`font-bold ${invoice.status !== "DRAFT" ? "text-zinc-850 dark:text-zinc-200" : "text-zinc-400"}`}>
                  Sent to Client
                </div>
                {invoice.status !== "DRAFT" && (
                  <div className="text-[10px] text-zinc-400 mt-0.5">Finalized and emailed</div>
                )}
              </div>

              {/* Viewed state */}
              <div className="relative">
                <span className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-4 border-white dark:border-zinc-900 ${
                  invoice.viewedAt ? "bg-violet-600" : "bg-zinc-200 dark:bg-zinc-800"
                }`} />
                <div className={`font-bold ${invoice.viewedAt ? "text-zinc-850 dark:text-zinc-200" : "text-zinc-400"}`}>
                  Viewed by Client
                </div>
                {invoice.viewedAt && (
                  <div className="text-[10px] text-zinc-400 mt-0.5">Opened: {formatDate(invoice.viewedAt)}</div>
                )}
              </div>

              {/* Paid state */}
              <div className="relative">
                <span className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-4 border-white dark:border-zinc-900 ${
                  invoice.status === "PAID" ? "bg-green-600" : "bg-zinc-200 dark:bg-zinc-800"
                }`} />
                <div className={`font-bold ${invoice.status === "PAID" ? "text-green-600 font-extrabold" : "text-zinc-400"}`}>
                  Paid & Settle
                </div>
                {invoice.paidAt && (
                  <div className="text-[10px] text-zinc-400 mt-0.5">Settled: {formatDate(invoice.paidAt)}</div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Log list */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-violet-500" /> Activity Log
            </h3>
            
            <div className="space-y-3 text-[11px] text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between items-start gap-4">
                <span>Draft created successfully</span>
                <span className="text-[9px] text-zinc-400 text-right">{formatDate(invoice.createdAt)}</span>
              </div>
              
              {invoice.status !== "DRAFT" && (
                <div className="flex justify-between items-start gap-4 border-t border-zinc-50 dark:border-zinc-850 pt-2">
                  <span>Invoice emailed to {invoice.client.email}</span>
                  <span className="text-[9px] text-zinc-400 text-right">{formatDate(invoice.issueDate)}</span>
                </div>
              )}

              {invoice.viewedAt && (
                <div className="flex justify-between items-start gap-4 border-t border-zinc-50 dark:border-zinc-850 pt-2">
                  <span>Client opened invoice portal page</span>
                  <span className="text-[9px] text-zinc-400 text-right">{formatDate(invoice.viewedAt)}</span>
                </div>
              )}

              {invoice.paidAt && (
                <div className="flex justify-between items-start gap-4 border-t border-zinc-50 dark:border-zinc-850 pt-2">
                  <span>Payment confirmed & receipt sent</span>
                  <span className="text-[9px] text-zinc-400 text-right">{formatDate(invoice.paidAt)}</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
