import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendOverdueEmail } from "@/lib/resend";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
  // Verify Vercel Cron Header Authorization
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const today = new Date();
    
    // Find all invoices that are due and not paid, drafted, or cancelled
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        dueDate: { lt: today },
        status: { in: ["SENT", "VIEWED"] },
      },
      include: {
        client: true,
        organization: true,
      },
    });

    let updatedCount = 0;

    for (const invoice of overdueInvoices) {
      await prisma.$transaction(async (tx) => {
        // Update status to OVERDUE
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: "OVERDUE" },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            organizationId: invoice.organizationId,
            userId: "SYSTEM_CRON",
            action: "MARK_OVERDUE",
            entity: "Invoice",
            entityId: invoice.id,
            metadata: { number: invoice.number, amount: invoice.total },
          },
        });
      });

      // Send Overdue Alert Email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const viewUrl = `${appUrl}/invoice/${invoice.viewToken}`;
      
      const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      await sendOverdueEmail(
        invoice.client.email,
        invoice.organization.name,
        invoice.number,
        invoice.total,
        invoice.organization.currency,
        formattedDueDate,
        viewUrl
      );

      updatedCount++;
    }

    return NextResponse.json({ success: true, markedOverdue: updatedCount });
  } catch (error) {
    console.error("Cron check-overdue failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
