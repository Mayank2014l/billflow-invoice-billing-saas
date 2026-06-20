import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const toggleSchema = z.object({
  active: z.boolean(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authCheck = await requireRole(["OWNER", "ADMIN"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db, organization, userId } = authCheck;

  try {
    const json = await req.json();
    const body = toggleSchema.parse(json);

    const current = await db.recurringInvoice.findFirst({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Recurring rule not found" }, { status: 404 });
    }

    const updated = await db.recurringInvoice.update({
      where: { id },
      data: {
        active: body.active,
      },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: body.active ? "RESUME_RECURRING_RULE" : "PAUSE_RECURRING_RULE",
      entity: "RecurringInvoice",
      entityId: id,
      metadata: { active: body.active },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || error.message }, { status: 400 });
    }
    console.error("Failed to update recurring rule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authCheck = await requireRole(["OWNER", "ADMIN"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db, organization, userId } = authCheck;

  try {
    const current = await db.recurringInvoice.findFirst({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Recurring rule not found" }, { status: 404 });
    }

    await db.recurringInvoice.delete({
      where: { id },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "DELETE_RECURRING_RULE",
      entity: "RecurringInvoice",
      entityId: id,
      metadata: { client: current.clientId, frequency: current.frequency },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete recurring rule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
