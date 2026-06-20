import React from "react";
import { requireRole } from "@/lib/permissions";
import AnalyticsClient from "@/components/dashboard/analytics-client";
import { redirect } from "next/navigation";

export const revalidate = 0; // Disable static rendering

export default async function AnalyticsPage() {
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) {
    redirect("/login");
  }

  const { organization } = authCheck;

  return (
    <div className="p-1">
      <AnalyticsClient currency={organization.currency} />
    </div>
  );
}
