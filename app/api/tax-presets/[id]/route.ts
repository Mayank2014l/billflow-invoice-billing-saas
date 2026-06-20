import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authCheck = await requireRole(["OWNER", "ADMIN"]);
  if (!authCheck.authorized) return authCheck.response;

  const { organization, userId } = authCheck;

  try {
    const presetId = params.id;

    // Check if preset belongs to organization
    const existing = await prisma.taxPreset.findFirst({
      where: { id: presetId, organizationId: organization.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tax preset not found" }, { status: 404 });
    }

    await prisma.taxPreset.delete({
      where: { id: presetId },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "DELETE_TAX_PRESET",
      entity: "TaxPreset",
      entityId: presetId,
      metadata: { name: existing.name, rate: existing.rate },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete tax preset:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
