import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { organizationId } = await req.json();

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    }

    // Verify user is a member of this organization
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: Not a member" }, { status: 403 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("billflow-active-org-id", organizationId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false,
    });

    return response;
  } catch (error) {
    console.error("Failed to switch organization:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
