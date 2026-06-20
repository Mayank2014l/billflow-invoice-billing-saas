import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const taxPresetSchema = z.object({
  name: z.string().min(2, "Tax preset name must be at least 2 characters"),
  rate: z.number().min(0, "Tax rate must be positive"),
});

export async function GET(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { organization } = authCheck;

  try {
    const presets = await prisma.taxPreset.findMany({
      where: { organizationId: organization.id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(presets);
  } catch (error) {
    console.error("Failed to list tax presets:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN"]);
  if (!authCheck.authorized) return authCheck.response;

  const { organization, userId } = authCheck;

  try {
    const json = await req.json();
    const body = taxPresetSchema.parse(json);

    // Create tax preset
    const preset = await prisma.taxPreset.create({
      data: {
        organizationId: organization.id,
        name: body.name,
        rate: body.rate,
      },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "CREATE_TAX_PRESET",
      entity: "TaxPreset",
      entityId: preset.id,
      metadata: { name: body.name, rate: body.rate },
    });

    return NextResponse.json(preset, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || error.message }, { status: 400 });
    }
    console.error("Failed to create tax preset:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
