import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";

export async function GET(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db } = authCheck;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  try {
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.auditLog.count(),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
