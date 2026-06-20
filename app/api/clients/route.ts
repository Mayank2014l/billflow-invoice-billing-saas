import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { checkPlanLimits } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().default("India"),
  currency: z.string().default("INR"),
  taxNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db } = authCheck;

  try {
    const clients = await db.client.findMany({
      include: {
        invoices: {
          select: {
            total: true,
            status: true,
            issueDate: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formattedClients = clients.map((client) => {
      let totalInvoiced = 0;
      let outstanding = 0;
      let lastInvoiceDate: Date | null = null;

      client.invoices.forEach((inv) => {
        if (inv.status !== "DRAFT" && inv.status !== "CANCELLED") {
          totalInvoiced += inv.total;
          
          if (inv.status !== "PAID") {
            outstanding += inv.total;
          }

          if (!lastInvoiceDate || new Date(inv.issueDate) > new Date(lastInvoiceDate)) {
            lastInvoiceDate = inv.issueDate;
          }
        }
      });

      const { invoices, ...rest } = client;

      return {
        ...rest,
        totalInvoiced,
        outstanding,
        lastInvoiceDate,
      };
    });

    return NextResponse.json({ clients: formattedClients });
  } catch (error) {
    console.error("Failed to list clients:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db, organization, userId } = authCheck;

  // Enforce Stripe Free Plan client limits
  const planCheck = await checkPlanLimits(organization.id, "clients");
  if (!planCheck.allowed) {
    return NextResponse.json(
      { error: "Usage limit reached. Upgrade to Pro to add more clients." },
      { status: 403 }
    );
  }

  try {
    const json = await req.json();
    const body = clientSchema.parse(json);

    const client = await db.client.create({
      data: {
        organizationId: organization.id,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        country: body.country,
        currency: body.currency,
        taxNumber: body.taxNumber || null,
        notes: body.notes || null,
      },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "CREATE_CLIENT",
      entity: "Client",
      entityId: client.id,
      metadata: { name: client.name, email: client.email },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || error.message }, { status: 400 });
    }
    console.error("Failed to create client:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
