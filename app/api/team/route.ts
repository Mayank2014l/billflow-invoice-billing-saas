import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { sendInviteEmail } from "@/lib/resend";
import { logAudit } from "@/lib/audit";
import { checkPlanLimits } from "@/lib/stripe";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function GET(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db } = authCheck;

  try {
    const [members, invites] = await Promise.all([
      db.membership.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { role: "asc" },
      }),
      db.invite.findMany({
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ members, invites });
  } catch (error) {
    console.error("Failed to load team data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db, organization, userId, userName } = authCheck;

  try {
    const json = await req.json();
    const body = inviteSchema.parse(json);

    // Enforce billing plan limits
    const planCheck = await checkPlanLimits(organization.id, "members");
    if (!planCheck.allowed) {
      return NextResponse.json(
        { error: `You have reached the maximum limit of ${planCheck.limit} team members allowed on the Free plan. Please upgrade to Pro.` },
        { status: 403 }
      );
    }

    // Verify user is not already a member
    const existingMember = await db.membership.findFirst({
      where: {
        user: { email: body.email },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 400 }
      );
    }

    // Check if there is already a pending active invite
    const existingInvite = await db.invite.findFirst({
      where: {
        email: body.email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "A pending invitation already exists for this email" },
        { status: 400 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const invite = await db.invite.create({
      data: {
        organizationId: organization.id,
        email: body.email,
        role: body.role,
        expiresAt,
      },
    });

    // Build accepting link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/invite/${invite.token}`;

    // Send Invite Email via Resend
    await sendInviteEmail(body.email, organization.name, userName || "A team member", inviteUrl);

    // Write audit log
    await logAudit({
      organizationId: organization.id,
      userId,
      action: "INVITE_MEMBER",
      entity: "Invite",
      entityId: invite.id,
      metadata: { invitee: body.email, role: body.role },
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || error.message }, { status: 400 });
    }
    console.error("Failed to create invitation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
