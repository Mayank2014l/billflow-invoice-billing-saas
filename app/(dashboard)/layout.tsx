import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveOrg } from "@/lib/permissions";
import DashboardShell from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  // Force onboarding if they do not belong to any organization
  const activeOrgInfo = await getActiveOrg(session.user.id);
  if (!activeOrgInfo) {
    redirect("/onboarding");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
