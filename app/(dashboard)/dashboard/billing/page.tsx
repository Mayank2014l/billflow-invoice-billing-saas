import React from "react";
import { requireRole } from "@/lib/permissions";
import { checkPlanLimits } from "@/lib/stripe";
import BillingClient from "@/components/dashboard/billing-client";
import { redirect } from "next/navigation";

export const revalidate = 0; // Disable static rendering

export default async function BillingPage() {
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) {
    redirect("/login");
  }

  const { organization, role } = authCheck;

  const invoiceLimit = await checkPlanLimits(organization.id, "invoices");
  const clientLimit = await checkPlanLimits(organization.id, "clients");
  const memberLimit = await checkPlanLimits(organization.id, "members");

  const limits = {
    invoices: invoiceLimit,
    clients: clientLimit,
    members: memberLimit,
  };

  return (
    <div className="p-1">
      <BillingClient 
        organization={{
          id: organization.id,
          name: organization.name,
          plan: organization.plan,
        }}
        limits={limits}
        role={role}
      />
    </div>
  );
}
