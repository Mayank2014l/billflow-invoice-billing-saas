import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { auth } from "./auth";
import prisma from "./prisma";
import { getTenantDb } from "./tenant";

export async function getActiveOrg(userId: string) {
  const cookieStore = await cookies();
  const orgId = cookieStore.get("billflow-active-org-id")?.value;

  let membership = null;

  if (orgId) {
    membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
      include: {
        organization: true,
      },
    });
  }

  if (!membership) {
    // Fallback to the first membership
    membership = await prisma.membership.findFirst({
      where: { userId },
      include: {
        organization: true,
      },
    });
  }

  if (!membership) {
    return null;
  }

  return {
    organization: membership.organization,
    role: membership.role as Role,
  };
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return {
      authorized: false as const,
      status: 401,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const activeOrg = await getActiveOrg(session.user.id);
  if (!activeOrg) {
    return {
      authorized: false as const,
      status: 403,
      response: NextResponse.json({ error: "No organization active. Onboarding required." }, { status: 403 }),
    };
  }

  const { organization, role } = activeOrg;

  if (!allowedRoles.includes(role)) {
    return {
      authorized: false as const,
      status: 403,
      response: NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 }),
    };
  }

  return {
    authorized: true as const,
    userId: session.user.id,
    userEmail: session.user.email || "",
    userName: session.user.name || "",
    organization,
    role,
    db: getTenantDb(organization.id),
  };
}
