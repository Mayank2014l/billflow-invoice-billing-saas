import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const recurringSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  nextDate: z.string().transform((v) => new Date(v)),
  endDate: z.string().optional().nullable().transform((v) => (v ? new Date(v) : null)),
  templateData: z.object({
    subtotal: z.number().nonnegative(),
    taxAmount: z.number().nonnegative().default(0),
    discount: z.number().nonnegative().default(0),
    total: z.number().nonnegative(),
    notes: z.string().optional().nullable(),
    terms: z.string().optional().nullable(),
    templateId: z.string().default("modern"),
    items: z.array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().positive(),
        rate: z.number().nonnegative(),
        amount: z.number().nonnegative(),
        taxRate: z.number().nonnegative().default(0),
      })
    ).min(1),
  }),
});

export async function GET(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db } = authCheck;

  try {
    const rules = await db.recurringInvoice.findMany({
      orderBy: { createdAt: "desc" },
    });

    // For each rule, fetch generated invoices count/details
    const rulesWithInvoices = await Promise.all(
      rules.map(async (rule) => {
        const invoices = await db.invoice.findMany({
          where: { recurringId: rule.id },
          select: { id: true, number: true, total: true, status: true, issueDate: true },
          orderBy: { issueDate: "desc" },
        });

        // Resolve client details
        const client = await db.client.findFirst({
          where: { id: rule.clientId },
          select: { name: true, email: true },
        });

        return {
          ...rule,
          client,
          generatedInvoices: invoices,
        };
      })
    );

    return NextResponse.json({ recurringRules: rulesWithInvoices });
  } catch (error) {
    console.error("Failed to list recurring rules:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db, organization, userId } = authCheck;

  try {
    const json = await req.json();
    const body = recurringSchema.parse(json);

    const rule = await db.recurringInvoice.create({
      data: {
        organizationId: organization.id,
        clientId: body.clientId,
        frequency: body.frequency,
        nextDate: body.nextDate,
        endDate: body.endDate,
        active: true,
        templateData: body.templateData,
      },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "CREATE_RECURRING_RULE",
      entity: "RecurringInvoice",
      entityId: rule.id,
      metadata: { frequency: body.frequency, total: body.templateData.total },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || error.message }, { status: 400 });
    }
    console.error("Failed to create recurring rule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
