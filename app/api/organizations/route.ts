import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { z } from "zod";

const createOrgSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  invoicePrefix: z.string().min(1, "Prefix is required").max(10),
  currency: z.string().min(1, "Currency is required"),
  taxName: z.string().min(1, "Tax name is required"),
  taxNumber: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().optional(),
  invites: z.array(
    z.object({
      email: z.string().email(),
      role: z.enum(["ADMIN", "MEMBER"]),
    })
  ).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const json = await req.json();
    const body = createOrgSchema.parse(json);

    // Verify slug uniqueness
    const existing = await prisma.organization.findUnique({
      where: { slug: body.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Organization slug is already in use" },
        { status: 400 }
      );
    }

    // Create organization, membership, and invites in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: body.name,
          slug: body.slug,
          invoicePrefix: body.invoicePrefix,
          currency: body.currency,
          taxName: body.taxName,
          taxNumber: body.taxNumber || null,
          address: body.address || null,
          logo: body.logo || null,
          memberships: {
            create: {
              userId,
              role: "OWNER",
            },
          },
        },
      });

      // Create invites if any
      if (body.invites && body.invites.length > 0) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

        await tx.invite.createMany({
          data: body.invites.map((inv) => ({
            email: inv.email,
            role: inv.role,
            organizationId: org.id,
            expiresAt,
          })),
        });
      }

      return org;
    });

    // Set cookie for active organization
    const response = NextResponse.json(result, { status: 201 });
    response.cookies.set("billflow-active-org-id", result.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        organizationId: result.id,
        userId,
        action: "CREATE_ORGANIZATION",
        entity: "Organization",
        entityId: result.id,
        metadata: { name: result.name, slug: result.slug },
      },
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || error.message }, { status: 400 });
    }
    console.error("Failed to create organization:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });

    const organizations = memberships.map((m) => m.organization);

    // Get active org ID from cookies
    const cookieHeader = req.headers.get("cookie") || "";
    const activeOrgCookie = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("billflow-active-org-id="));
    
    let activeOrgId = activeOrgCookie ? activeOrgCookie.split("=")[1].trim() : null;

    // Verify active org or fallback to first
    let activeMembership = memberships.find((m) => m.organizationId === activeOrgId);
    
    if (!activeMembership && memberships.length > 0) {
      activeMembership = memberships[0];
      activeOrgId = activeMembership.organizationId;
    }

    return NextResponse.json({
      organizations,
      activeOrg: activeMembership ? activeMembership.organization : null,
      role: activeMembership ? activeMembership.role : null,
    });
  } catch (error) {
    console.error("Failed to fetch organizations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const updateOrgSchema = z.object({
  name: z.string().min(1, "Name is required"),
  invoicePrefix: z.string().min(1, "Prefix is required").max(10),
  currency: z.string().min(1, "Currency is required"),
  taxName: z.string().min(1, "Tax name is required"),
  taxNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
});

export async function PUT(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN"]);
  if (!authCheck.authorized) return authCheck.response;

  const { organization, userId } = authCheck;

  try {
    const json = await req.json();
    const body = updateOrgSchema.parse(json);

    const updated = await prisma.organization.update({
      where: { id: organization.id },
      data: {
        name: body.name,
        invoicePrefix: body.invoicePrefix,
        currency: body.currency,
        taxName: body.taxName,
        taxNumber: body.taxNumber || null,
        address: body.address || null,
        logo: body.logo || null,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        userId,
        action: "UPDATE_ORGANIZATION",
        entity: "Organization",
        entityId: organization.id,
        metadata: {
          name: updated.name,
          invoicePrefix: updated.invoicePrefix,
          currency: updated.currency,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || error.message }, { status: 400 });
    }
    console.error("Failed to update organization settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

