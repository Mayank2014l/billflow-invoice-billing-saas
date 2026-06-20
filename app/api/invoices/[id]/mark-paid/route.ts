import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { sendReceiptEmail } from "@/lib/resend";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authCheck = await requireRole(["OWNER", "ADMIN"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db, organization, userId } = authCheck;

  try {
    const invoice = await db.invoice.findFirst({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Invoice is already marked as paid" },
        { status: 400 }
      );
    }

    const paidAt = new Date();

    const updatedInvoice = await db.invoice.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt,
      },
    });

    // Send payment received receipt email
    const formattedPaidDate = paidAt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    await sendReceiptEmail(
      invoice.client.email,
      organization.name,
      invoice.number,
      invoice.total,
      organization.currency,
      formattedPaidDate
    );

    // Audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "MARK_PAID",
      entity: "Invoice",
      entityId: id,
      metadata: { number: invoice.number, total: invoice.total },
    });

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (error) {
    console.error("Failed to mark invoice as paid:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
