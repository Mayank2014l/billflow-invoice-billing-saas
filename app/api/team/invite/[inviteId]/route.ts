import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params;
  const authCheck = await requireRole(["OWNER", "ADMIN"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db, organization, userId } = authCheck;

  try {
    const invite = await db.invite.findFirst({
      where: { id: inviteId },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    await db.invite.delete({
      where: { id: inviteId },
    });

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "REVOKE_INVITE",
      entity: "Invite",
      entityId: inviteId,
      metadata: { targetUser: invite.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to revoke invite:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
