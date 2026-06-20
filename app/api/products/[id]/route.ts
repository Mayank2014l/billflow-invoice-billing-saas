import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  rate: z.number().positive("Rate must be greater than 0"),
  unit: z.string().default("hr"),
});

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
    const body = productSchema.parse(json);

    const current = await db.product.findFirst({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await db.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        rate: body.rate,
        unit: body.unit,
      },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "UPDATE_PRODUCT",
      entity: "Product",
      entityId: id,
      metadata: { name: product.name, rate: product.rate },
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || error.message }, { status: 400 });
    }
    console.error("Failed to update product:", error);
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
    const current = await db.product.findFirst({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await db.product.delete({
      where: { id },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "DELETE_PRODUCT",
      entity: "Product",
      entityId: id,
      metadata: { name: current.name, rate: current.rate },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
