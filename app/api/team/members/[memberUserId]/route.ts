import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const updateMemberSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ memberUserId: string }> }
) {
  const { memberUserId } = await params;
  // Only OWNER can edit member roles
  const authCheck = await requireRole(["OWNER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db, organization, userId } = authCheck;

  if (memberUserId === userId) {
    return NextResponse.json(
      { error: "You cannot change your own role" },
      { status: 400 }
    );
  }

  try {
    const json = await req.json();
    const body = updateMemberSchema.parse(json);

    const membership = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: memberUserId,
          organizationId: organization.id,
        },
      },
      include: {
        user: { select: { email: true } },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    const updated = await db.membership.update({
      where: { id: membership.id },
      data: { role: body.role },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "CHANGE_MEMBER_ROLE",
      entity: "Membership",
      entityId: membership.id,
      metadata: { targetUser: membership.user.email, newRole: body.role },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || error.message }, { status: 400 });
    }
    console.error("Failed to update member role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ memberUserId: string }> }
) {
  const { memberUserId } = await params;
  // Only OWNER can remove members
  const authCheck = await requireRole(["OWNER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db, organization, userId } = authCheck;

  if (memberUserId === userId) {
    return NextResponse.json(
      { error: "You cannot remove yourself from the workspace. Delete the organization in settings instead." },
      { status: 400 }
    );
  }

  try {
    const membership = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: memberUserId,
          organizationId: organization.id,
        },
      },
      include: {
        user: { select: { email: true } },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    await db.membership.delete({
      where: { id: membership.id },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "REMOVE_MEMBER",
      entity: "Membership",
      entityId: membership.id,
      metadata: { targetUser: membership.user.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
