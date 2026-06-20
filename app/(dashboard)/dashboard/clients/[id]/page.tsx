import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getActiveOrg } from "@/lib/permissions";
import { getTenantDb } from "@/lib/tenant";
import { 
  ArrowLeft, Mail, Phone, MapPin, Landmark, Plus, 
  Receipt, Calendar, ArrowUpRight, Copy, ExternalLink
} from "lucide-react";
import CopyClientPortalButton from "@/components/dashboard/copy-client-portal-button";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const activeOrgInfo = await getActiveOrg(session.user.id);
  if (!activeOrgInfo) {
    redirect("/onboarding");
  }

  const { organization } = activeOrgInfo;

  // Query database securely
  const db = getTenantDb(organization.id);
  const client = await db.client.findFirst({
    where: { id: params.id },
    include: {
      invoices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    redirect("/dashboard/clients");
  }

  // Calculate metrics
  let totalInvoiced = 0;
  let outstanding = 0;
  let lastInvoiceDate: Date | null = null;

  client.invoices.forEach((inv) => {
    if (inv.status !== "DRAFT" && inv.status !== "CANCELLED") {
      totalInvoiced += inv.total;
      
      if (inv.status !== "PAID") {
        outstanding += inv.total;
      }

      if (!lastInvoiceDate || new Date(inv.issueDate) > new Date(lastInvoiceDate)) {
        lastInvoiceDate = inv.issueDate;
      }
    }
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-50 text-green-750 border-green-200/50 dark:bg-green-950/30 dark:text-green-400";
      case "SENT":
        return "bg-blue-50 text-blue-750 border-blue-200/50 dark:bg-blue-950/30 dark:text-blue-400";
      case "OVERDUE":
        return "bg-red-50 text-red-750 border-red-200/50 dark:bg-red-950/30 dark:text-red-400";
      case "VIEWED":
        return "bg-yellow-50 text-yellow-750 border-yellow-200/50 dark:bg-yellow-950/30 dark:text-yellow-400";
      default:
        return "bg-zinc-50 text-zinc-650 border-zinc-200 dark:bg-zinc-850 dark:text-zinc-400";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Back & CTA Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Clients
        </Link>

        <div className="flex items-center gap-2">
          {/* Copy portal token button */}
          <CopyClientPortalButton portalToken={client.portalToken} />
          
          <Link
            href={`/dashboard/invoices/new?clientId=${client.id}`}
            className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Invoice Client
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Invoiced</div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-50">
            {organization.currency} {totalInvoiced.toFixed(2)}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Outstanding Balance</div>
          <div className="text-xl font-bold mt-1 text-red-600">
            {organization.currency} {outstanding.toFixed(2)}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Last Invoiced</div>
          <div className="text-xl font-bold mt-1 text-zinc-800 dark:text-zinc-200">
            {lastInvoiceDate 
              ? new Date(lastInvoiceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "Never"}
          </div>
        </div>
      </div>

      {/* Details Split */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Col: client coordinates */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-sm">Client Coordinate Details</h2>
          <hr className="border-zinc-150 dark:border-zinc-800" />
          
          <div className="space-y-4 text-xs">
            <div>
              <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Company / Name</div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-150">{client.name}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Email</div>
              <div className="text-zinc-600 flex items-center gap-1">
                <Mail className="h-4 w-4 text-zinc-400" /> {client.email}
              </div>
            </div>
            {client.phone && (
              <div>
                <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Phone</div>
                <div className="text-zinc-650 flex items-center gap-1">
                  <Phone className="h-4 w-4 text-zinc-400" /> {client.phone}
                </div>
              </div>
            )}
            {client.address && (
              <div>
                <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Billing Address</div>
                <div className="text-zinc-600 flex items-start gap-1 leading-normal">
                  <MapPin className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span>
                    {client.address}
                    {client.city && `, ${client.city}`}
                    {client.country && `, ${client.country}`}
                  </span>
                </div>
              </div>
            )}
            {client.taxNumber && (
              <div>
                <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Tax ID / Reference</div>
                <div className="text-zinc-650 flex items-center gap-1">
                  <Landmark className="h-4 w-4 text-zinc-400" /> {client.taxNumber}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Invoice history */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-sm">Invoice History Log</h2>
          <hr className="border-zinc-150 dark:border-zinc-800" />

          {client.invoices.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-xs">
              No invoices generated for this client profile. Click &quot;Invoice Client&quot; above to draft one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800">
                  <tr>
                    <th className="pb-3">Number</th>
                    <th className="pb-3">Issued</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-medium">
                  {client.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-colors">
                      <td className="py-2.5 font-bold text-violet-650 dark:text-violet-400">
                        <Link href={`/dashboard/invoices/${inv.id}`} className="hover:underline">
                          {inv.number}
                        </Link>
                      </td>
                      <td className="py-2.5 text-zinc-500">
                        {new Date(inv.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-2.5 text-right font-bold text-zinc-800 dark:text-zinc-200">
                        {organization.currency} {inv.total.toFixed(2)}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold ${getStatusStyle(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/dashboard/invoices/${inv.id}`}
                          className="inline-flex items-center gap-0.5 text-violet-600 hover:text-violet-750 text-[10px] font-semibold"
                        >
                          Details <ArrowUpRight className="h-3 w-3" />
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

    </div>
  );
}
