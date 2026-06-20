import React from "react";
import { requireRole } from "@/lib/permissions";
import SettingsClient from "@/components/dashboard/settings-client";
import { redirect } from "next/navigation";

export const revalidate = 0; // Disable static rendering

export default async function SettingsPage() {
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) {
    redirect("/login");
  }

  const { organization, role } = authCheck;

  return (
    <div className="p-1">
      <SettingsClient 
        initialOrg={{
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          invoicePrefix: organization.invoicePrefix,
          currency: organization.currency,
          taxName: organization.taxName,
          taxNumber: organization.taxNumber,
          address: organization.address,
        }}
        role={role}
      />
    </div>
  );
}
