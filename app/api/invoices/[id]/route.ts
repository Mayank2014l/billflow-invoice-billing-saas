import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  rate: z.number().nonnegative("Rate cannot be negative"),
  amount: z.number().nonnegative("Amount cannot be negative"),
  taxRate: z.number().nonnegative().default(0),
});

const updateInvoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  number: z.string().min(1, "Invoice number is required"),
  issueDate: z.string().transform((v) => new Date(v)),
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db } = authCheck;

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

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authCheck = await requireRole(["OWNER", "ADMIN"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db, organization, userId } = authCheck;

  try {
    // Verify invoice exists and is in DRAFT status
    const current = await db.invoice.findFirst({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (current.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft invoices can be edited" },
        { status: 400 }
      );
    }

    const json = await req.json();
    const body = updateInvoiceSchema.parse(json);

    // Update the invoice in a transaction
    // 1. Delete all existing items.
    // 2. Update invoice details and create new items.
    const invoice = await db.$transaction(async (tx: any) => {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      return tx.invoice.update({
        where: { id },
        data: {
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
          items: {
            create: body.items,
          },
        },
        include: {
          items: true,
        },
      });
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "UPDATE_INVOICE",
      entity: "Invoice",
      entityId: invoice.id,
      metadata: { number: invoice.number, total: invoice.total },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || error.message }, { status: 400 });
    }
    console.error("Failed to update invoice:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authCheck = await requireRole(["OWNER", "ADMIN"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db, organization, userId } = authCheck;

  try {
    const current = await db.invoice.findFirst({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Delete invoice (cascade delete handles items)
    await db.invoice.delete({
      where: { id },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "DELETE_INVOICE",
      entity: "Invoice",
      entityId: id,
      metadata: { number: current.number, total: current.total },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
