import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { generateInvoicePDF } from "@/lib/pdf";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db, organization } = authCheck;

  try {
    const invoice = await db.invoice.findFirst({
      where: { id },
      include: {
        client: true,
        items: true,
      },
    });

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

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

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to stream PDF:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
