import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/pdf";
import { sendInvoiceEmail } from "@/lib/resend";

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

    // Query active rules due to generate
    const dueRules = await prisma.recurringInvoice.findMany({
      where: {
        active: true,
        nextDate: { lte: today },
        OR: [
          { endDate: null },
          { endDate: { gte: today } },
        ],
      },
    });

    let generatedCount = 0;

    for (const rule of dueRules) {
      const client = await prisma.client.findUnique({
        where: { id: rule.clientId },
      });
      const org = await prisma.organization.findUnique({
        where: { id: rule.organizationId },
      });

      if (!client || !org) {
        // Pause rule if client/org no longer exists
        await prisma.recurringInvoice.update({
          where: { id: rule.id },
          data: { active: false },
        });
        continue;
      }

      // Generate invoice number
      const invoicesCount = await prisma.invoice.count({
        where: { organizationId: org.id },
      });
      const paddedCount = String(invoicesCount + 1).padStart(4, "0");
      const invoiceNumber = `${org.invoicePrefix}-${new Date().getFullYear()}-${paddedCount}`;

      // Date schedules
      const issueDate = new Date();
      // Calculate due date (default +15 days from issueDate)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);

      const templateData = rule.templateData as any;

      // Create Invoice and items in transaction
      const invoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.create({
          data: {
            organizationId: org.id,
            clientId: client.id,
            number: invoiceNumber,
            status: "SENT",
            issueDate,
            dueDate,
            subtotal: templateData.subtotal,
            taxAmount: templateData.taxAmount,
            discount: templateData.discount,
            total: templateData.total,
            notes: templateData.notes,
            terms: templateData.terms,
            templateId: templateData.templateId || "modern",
            recurringId: rule.id,
            items: {
              create: templateData.items.map((i: any) => ({
                description: i.description,
                quantity: i.quantity,
                rate: i.rate,
                amount: i.amount,
                taxRate: i.taxRate,
              })),
            },
          },
          include: {
            items: true,
          },
        });

        // Compute next schedule run date
        const nextRun = new Date(rule.nextDate);
        if (rule.frequency === "WEEKLY") {
          nextRun.setDate(nextRun.getDate() + 7);
        } else if (rule.frequency === "MONTHLY") {
          nextRun.setMonth(nextRun.getMonth() + 1);
        } else if (rule.frequency === "QUARTERLY") {
          nextRun.setMonth(nextRun.getMonth() + 3);
        } else if (rule.frequency === "YEARLY") {
          nextRun.setFullYear(nextRun.getFullYear() + 1);
        }

        // Deactivate if past end date
        const keepActive = !rule.endDate || nextRun <= new Date(rule.endDate);

        await tx.recurringInvoice.update({
          where: { id: rule.id },
          data: {
            nextDate: nextRun,
            active: keepActive,
          },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            organizationId: org.id,
            userId: "SYSTEM_CRON",
            action: "GENERATE_RECURRING_INVOICE",
            entity: "Invoice",
            entityId: inv.id,
            metadata: { number: invoiceNumber, ruleId: rule.id, total: inv.total },
          },
        });

        return inv;
      });

      // Compile and stream PDF buffer
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
          name: org.name,
          address: org.address,
          taxName: org.taxName,
          taxNumber: org.taxNumber,
          currency: org.currency,
        },
        client: {
          name: client.name,
          email: client.email,
          address: client.address,
          taxNumber: client.taxNumber,
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

      // E-mail invoice with PDF attached
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const viewUrl = `${appUrl}/invoice/${invoice.viewToken}`;
      
      const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      await sendInvoiceEmail(
        client.email,
        org.name,
        invoice.number,
        invoice.total,
        org.currency,
        formattedDueDate,
        viewUrl,
        pdfBuffer
      );

      generatedCount++;
    }

    return NextResponse.json({ success: true, generatedCount });
  } catch (error) {
    console.error("Cron generate-recurring failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
