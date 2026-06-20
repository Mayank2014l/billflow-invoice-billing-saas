import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { checkPlanLimits } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  rate: z.number().nonnegative("Rate cannot be negative"),
  amount: z.number().nonnegative("Amount cannot be negative"),
  taxRate: z.number().nonnegative().default(0),
});

const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  number: z.string().min(1, "Invoice number is required"),
  issueDate: z.string().optional().transform((v) => (v ? new Date(v) : new Date())),
  dueDate: z.string().transform((v) => new Date(v)),
  subtotal: z.number().nonnegative(),
  taxAmount: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  templateId: z.string().default("modern"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

export async function GET(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db } = authCheck;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  try {
    const whereClause: any = {};
    
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const invoices = await db.invoice.findMany({
      where: whereClause,
      include: {
        client: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Failed to list invoices:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db, organization, userId } = authCheck;

  // Enforce Stripe Free Plan limits
  const planCheck = await checkPlanLimits(organization.id, "invoices");
  if (!planCheck.allowed) {
    return NextResponse.json(
      { error: "Usage limit reached. Upgrade to Pro to send unlimited invoices." },
      { status: 403 }
    );
  }

  try {
    const json = await req.json();
    const body = createInvoiceSchema.parse(json);

    // Verify invoice number is unique within organization
    const existing = await db.invoice.findFirst({
      where: { number: body.number },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Invoice number ${body.number} already exists` },
        { status: 400 }
      );
    }

    const invoice = await db.invoice.create({
      data: {
        organizationId: organization.id,
        clientId: body.clientId,
        number: body.number,
        issueDate: body.issueDate,
        dueDate: body.dueDate,
        subtotal: body.subtotal,
        taxAmount: body.taxAmount,
        discount: body.discount,
        total: body.total,
        notes: body.notes,
        terms: body.terms,
        templateId: body.templateId,
        status: "DRAFT",
        items: {
          create: body.items,
        },
      },
      include: {
        items: true,
      },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "CREATE_INVOICE",
      entity: "Invoice",
      entityId: invoice.id,
      metadata: { number: invoice.number, total: invoice.total },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || error.message }, { status: 400 });
    }
    console.error("Failed to create invoice:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
