import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const client = await prisma.client.findUnique({
      where: { portalToken: token },
      include: {
        organization: {
          select: {
            name: true,
            currency: true,
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client portal not found" }, { status: 404 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { clientId: client.id },
      orderBy: { issueDate: "desc" },
    });

    // Compute stats
    const totalBilled = invoices
      .filter(inv => inv.status !== "CANCELLED" && inv.status !== "DRAFT")
      .reduce((sum, inv) => sum + inv.total, 0);

    const totalPaid = invoices
      .filter(inv => inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.total, 0);

    const totalOutstanding = invoices
      .filter(inv => ["SENT", "VIEWED", "OVERDUE"].includes(inv.status))
      .reduce((sum, inv) => sum + inv.total, 0);

    const totalOverdue = invoices
      .filter(inv => inv.status === "OVERDUE")
      .reduce((sum, inv) => sum + inv.total, 0);

    return NextResponse.json({
      client,
      invoices,
      stats: {
        totalBilled,
        totalPaid,
        totalOutstanding,
        totalOverdue,
      }
    });
  } catch (error) {
    console.error("Failed to fetch client portal data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
