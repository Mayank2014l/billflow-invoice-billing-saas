import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveOrg } from "@/lib/permissions";
import { getTenantDb } from "@/lib/tenant";
import InvoiceBuilder from "@/components/invoice/invoice-builder";

export default async function EditInvoicePage({
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

  const { organization } = activeOrgInfo;

  // Query database securely using tenant isolation
  const db = getTenantDb(organization.id);
  const invoice = await db.invoice.findFirst({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!invoice) {
    redirect("/dashboard/invoices");
  }

  // Only DRAFT invoices can be edited
  if (invoice.status !== "DRAFT") {
    redirect(`/dashboard/invoices/${id}`);
  }

  return (
    <div className="space-y-6">
      <InvoiceBuilder
        initialData={invoice}
        organization={{
          id: organization.id,
          name: organization.name,
          currency: organization.currency,
          taxName: organization.taxName,
          invoicePrefix: organization.invoicePrefix,
          address: organization.address,
          taxNumber: organization.taxNumber,
        }}
      />
    </div>
  );
}
