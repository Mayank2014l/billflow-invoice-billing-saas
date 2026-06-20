import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const authCheck = await requireRole(["OWNER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { organization, userId } = authCheck;

  try {
    const { utr } = await req.json();
    if (!utr) {
      return NextResponse.json({ error: "Transaction UTR is required" }, { status: 400 });
    }

    // Upgrade the organization to PRO plan
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        plan: "PRO",
      },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "UPGRADE_PLAN_UPI",
      entity: "Organization",
      entityId: organization.id,
      metadata: { plan: "PRO", utr },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("UPI upgrade error:", error);
    return NextResponse.json({ error: "Failed to process upgrade request" }, { status: 500 });
  }
}
