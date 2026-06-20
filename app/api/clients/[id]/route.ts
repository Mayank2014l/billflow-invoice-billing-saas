import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db } = authCheck;

  try {
    const client = await db.client.findFirst({
      where: { id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Failed to fetch client:", error);
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
    const json = await req.json();
    const body = clientSchema.parse(json);

    const current = await db.client.findFirst({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const client = await db.client.update({
      where: { id },
      data: {
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
      action: "UPDATE_CLIENT",
      entity: "Client",
      entityId: id,
      metadata: { name: client.name, email: client.email },
    });

    return NextResponse.json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || error.message }, { status: 400 });
    }
    console.error("Failed to update client:", error);
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
    const current = await db.client.findFirst({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await db.client.delete({
      where: { id },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "DELETE_CLIENT",
      entity: "Client",
      entityId: id,
      metadata: { name: current.name, email: current.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete client:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
