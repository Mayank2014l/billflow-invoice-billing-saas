import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
        organization: {
          select: {
            name: true,
            address: true,
            taxName: true,
            taxNumber: true,
            currency: true,
          }
        },
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // If the invoice was in SENT state, update it to VIEWED
    if (invoice.status === "SENT") {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "VIEWED",
          viewedAt: invoice.viewedAt || new Date(),
        },
      });
      invoice.status = "VIEWED";
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Failed to fetch public invoice:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Mock payment route
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { viewToken: token },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        organizationId: invoice.organizationId,
        userId: "system-public-portal",
        action: "PAY_INVOICE",
        entity: "Invoice",
        entityId: invoice.id,
        metadata: { number: invoice.number, total: invoice.total, paymentMethod: "MOCK_PAYMENT" },
      }
    });

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (error) {
    console.error("Failed to process mock payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
