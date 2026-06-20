import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const userEmail = session.user.email || "";

  try {
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        organization: true,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invitation token" }, { status: 404 });
    }

    if (invite.acceptedAt) {
      return NextResponse.json(
        { error: "This invitation has already been accepted" },
        { status: 400 }
      );
    }

    if (new Date() > new Date(invite.expiresAt)) {
      return NextResponse.json({ error: "This invitation has expired" }, { status: 400 });
    }

    // Verify email match (case-insensitive)
    if (userEmail.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: `This invitation was sent to ${invite.email}, but you are logged in as ${userEmail}.` },
        { status: 400 }
      );
    }

    // Create membership and mark invite as accepted in a transaction
    await prisma.$transaction(async (tx) => {
      // Create membership
      await tx.membership.create({
        data: {
          userId,
          organizationId: invite.organizationId,
          role: invite.role,
        },
      });

      // Mark invite as accepted
      await tx.invite.update({
        where: { id: invite.id },
        data: {
          acceptedAt: new Date(),
        },
      });
    });

    // Set active organization cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("billflow-active-org-id", invite.organizationId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false,
    });

    // Write audit log
    await logAudit({
      organizationId: invite.organizationId,
      userId,
      action: "ACCEPT_INVITE",
      entity: "Invite",
      entityId: invite.id,
      metadata: { email: invite.email, role: invite.role },
    });

    return response;
  } catch (error: any) {
    console.error("Failed to accept invitation:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "You are already a member of this organization." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
