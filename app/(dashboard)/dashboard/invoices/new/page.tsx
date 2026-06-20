import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveOrg } from "@/lib/permissions";
import InvoiceBuilder from "@/components/invoice/invoice-builder";

export default async function NewInvoicePage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const activeOrgInfo = await getActiveOrg(session.user.id);
  if (!activeOrgInfo) {
    redirect("/onboarding");
  }

  const { organization } = activeOrgInfo;

  return (
    <div className="space-y-6">
      <InvoiceBuilder 
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
