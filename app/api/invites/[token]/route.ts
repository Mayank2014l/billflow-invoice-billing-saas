import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        organization: {
          include: {
            memberships: {
              where: { role: "OWNER" },
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invitation token" }, { status: 404 });
    }

    if (invite.acceptedAt) {
      return NextResponse.json({ error: "This invitation has already been accepted" }, { status: 400 });
    }

    if (new Date() > new Date(invite.expiresAt)) {
      return NextResponse.json({ error: "This invitation has expired" }, { status: 400 });
    }

    const owner = invite.organization.memberships[0]?.user;
    const inviterName = owner?.name || owner?.email || "A workspace owner";

    return NextResponse.json({
      organizationName: invite.organization.name,
      organizationId: invite.organizationId,
      inviterName,
      email: invite.email,
      role: invite.role,
    });
  } catch (error) {
    console.error("Failed to load invite details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
