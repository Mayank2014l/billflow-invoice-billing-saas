import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";

export async function GET(req: Request) {
  const authCheck = await requireRole(["OWNER", "ADMIN", "MEMBER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { db } = authCheck;
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "30"; // "30", "90", "365", "all"

  try {
    const now = new Date();
    let startDate: Date | null = null;

    if (range === "30") {
      startDate = new Date(now.setDate(now.getDate() - 30));
    } else if (range === "90") {
      startDate = new Date(now.setDate(now.getDate() - 90));
    } else if (range === "365") {
      startDate = new Date(now.setDate(now.getDate() - 365));
    }

    const whereClause: any = {};
    if (startDate) {
      whereClause.issueDate = { gte: startDate };
    }

    const invoices = await db.invoice.findMany({
      where: whereClause,
      include: {
        client: {
          select: { name: true }
        }
      },
      orderBy: { issueDate: "asc" }
    });

    // 1. Core aggregates
    const paidInvoices = invoices.filter(inv => inv.status === "PAID");
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const outstandingInvoices = invoices.filter(inv => ["SENT", "VIEWED", "OVERDUE"].includes(inv.status));
    const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const overdueInvoices = invoices.filter(inv => inv.status === "OVERDUE");
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // 2. Average payment duration
    let avgPaymentDays = 0;
    const paidWithDates = paidInvoices.filter(inv => inv.paidAt && inv.issueDate);
    if (paidWithDates.length > 0) {
      const totalDays = paidWithDates.reduce((sum, inv) => {
        const pDate = new Date(inv.paidAt!);
        const iDate = new Date(inv.issueDate);
        const diffTime = Math.abs(pDate.getTime() - iDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);
      avgPaymentDays = Math.round(totalDays / paidWithDates.length);
    }

    // 3. Status Distribution
    const statusCounts: Record<string, number> = {
      DRAFT: 0,
      SENT: 0,
      VIEWED: 0,
      PAID: 0,
      OVERDUE: 0,
      CANCELLED: 0
    };
    invoices.forEach(inv => {
      statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
    });

    const statusDistribution = Object.keys(statusCounts).map(status => ({
      name: status,
      value: statusCounts[status]
    })).filter(item => item.value > 0);

    // 4. Top Clients (by PAID revenue)
    const clientRevenue: Record<string, { name: string; amount: number }> = {};
    paidInvoices.forEach(inv => {
      const clientId = inv.clientId;
      const clientName = inv.client?.name || "Unknown Client";
      if (!clientRevenue[clientId]) {
        clientRevenue[clientId] = { name: clientName, amount: 0 };
      }
      clientRevenue[clientId].amount += inv.total;
    });

    const topClients = Object.values(clientRevenue)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // 5. Revenue Over Time
    // We group by date/month based on range
    const revenueOverTime: Record<string, { Paid: number; Pending: number }> = {};

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    invoices.forEach(inv => {
      const date = new Date(inv.issueDate);
      let label = "";
      if (range === "30") {
        // Daily: e.g. "Jun 18"
        label = `${monthNames[date.getMonth()]} ${date.getDate()}`;
      } else {
        // Monthly: e.g. "Jun 26"
        label = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
      }

      if (!revenueOverTime[label]) {
        revenueOverTime[label] = { Paid: 0, Pending: 0 };
      }

      if (inv.status === "PAID") {
        revenueOverTime[label].Paid += inv.total;
      } else if (["SENT", "VIEWED", "OVERDUE"].includes(inv.status)) {
        revenueOverTime[label].Pending += inv.total;
      }
    });

    const revenueOverTimeList = Object.keys(revenueOverTime).map(key => ({
      date: key,
      Paid: Math.round(revenueOverTime[key].Paid),
      Pending: Math.round(revenueOverTime[key].Pending)
    }));

    return NextResponse.json({
      summary: {
        totalPaid,
        totalOutstanding,
        totalOverdue,
        avgPaymentDays,
      },
      statusDistribution,
      topClients,
      revenueOverTime: revenueOverTimeList
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
