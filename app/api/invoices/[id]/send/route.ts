import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { generateInvoicePDF } from "@/lib/pdf";
import { sendInvoiceEmail } from "@/lib/resend";
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
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Generate PDF Buffer
    const pdfInput = {
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      discount: invoice.discount,
      total: invoice.total,
      notes: invoice.notes,
      terms: invoice.terms,
      templateId: invoice.templateId,
      organization: {
        name: organization.name,
        address: organization.address,
        taxName: organization.taxName,
        taxNumber: organization.taxNumber,
        currency: organization.currency,
      },
      client: {
        name: invoice.client.name,
        email: invoice.client.email,
        address: invoice.client.address,
        taxNumber: invoice.client.taxNumber,
      },
      items: invoice.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        rate: i.rate,
        amount: i.amount,
        taxRate: i.taxRate,
      })),
    };

    const pdfBuffer = await generateInvoicePDF(pdfInput);

    // Build public viewing link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const viewUrl = `${appUrl}/invoice/${invoice.viewToken}`;

    // Format dates
    const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Send Email via Resend with PDF attached
    const emailResult = await sendInvoiceEmail(
      invoice.client.email,
      organization.name,
      invoice.number,
      invoice.total,
      organization.currency,
      formattedDueDate,
      viewUrl,
      pdfBuffer
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to dispatch email. Please check configuration." },
        { status: 500 }
      );
    }

    // Update status to SENT
    const updatedInvoice = await db.invoice.update({
      where: { id },
      data: {
        status: "SENT",
      },
    });

    // Audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "SEND_INVOICE",
      entity: "Invoice",
      entityId: id,
      metadata: { number: invoice.number, recipient: invoice.client.email },
    });

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (error) {
    console.error("Failed to process invoice sending:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
