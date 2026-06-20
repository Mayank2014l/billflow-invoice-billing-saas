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

export async function GET(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db } = authCheck;

  try {
    const products = await db.product.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to list products:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db, organization, userId } = authCheck;

  try {
    const json = await req.json();
    const body = productSchema.parse(json);

    const product = await db.product.create({
      data: {
        organizationId: organization.id,
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
      action: "CREATE_PRODUCT",
      entity: "Product",
      entityId: product.id,
      metadata: { name: product.name, rate: product.rate },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || error.message }, { status: 400 });
    }
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
