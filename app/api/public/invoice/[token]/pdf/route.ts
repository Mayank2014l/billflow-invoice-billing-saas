import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/pdf";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { viewToken: token },
      include: {
        client: true,
        organization: true,
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
        name: invoice.organization.name,
        address: invoice.organization.address,
        taxName: invoice.organization.taxName,
        taxNumber: invoice.organization.taxNumber,
        currency: invoice.organization.currency,
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
    console.error("Failed to stream public PDF:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
