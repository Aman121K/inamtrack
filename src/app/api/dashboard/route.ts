import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticate } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  console.log("[API] GET /api/dashboard");

  try {
    const authResult = await authenticate(req);
    if (authResult instanceof Response) return authResult;

    const agentId = authResult.agentId;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    console.log(`[API] Dashboard for agent: ${agentId}`);

    const [
      todaySales,
      totalTickets,
      soldTickets,
      pendingResults,
      totalWinners,
      totalCustomers,
      recentSales,
    ] = await Promise.all([
      prisma.sale.count({
        where: { agentId, createdAt: { gte: todayStart } },
      }),
      prisma.ticketBatch.aggregate({
        where: { agentId, status: "active" },
        _sum: { endNumber: true, startNumber: true },
        _count: true,
      }),
      prisma.ticketBatch.aggregate({
        where: { agentId, status: "active" },
        _sum: { soldCount: true },
      }),
      prisma.sale.count({
        where: { agentId, resultStatus: "pending" },
      }),
      prisma.sale.count({
        where: { agentId, resultStatus: "won" },
      }),
      prisma.customer.count({
        where: { agentId },
      }),
      prisma.sale.findMany({
        where: { agentId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          customer: { select: { name: true, phone: true } },
          batch: { select: { lotteryName: true } },
        },
      }),
    ]);

    // Flatten to the shape the dashboard UI expects.
    const recentSalesFlat = recentSales.map((s) => ({
      id: s.id,
      customerName: s.customer?.name ?? "—",
      lotteryName: s.batch?.lotteryName ?? "",
      ticketNumber: s.fullTicketId,
      amount: s.salePrice.toString(),
      time: s.createdAt,
    }));

    const totalTicketCount = totalTickets._count > 0
      ? (totalTickets._sum.endNumber || 0) - (totalTickets._sum.startNumber || 0) + totalTickets._count
      : 0;

    const dashboard = {
      todaySales,
      totalTickets: totalTicketCount,
      soldTickets: soldTickets._sum.soldCount || 0,
      pendingResults,
      totalWinners,
      totalCustomers,
      recentSales: recentSalesFlat,
    };

    console.log("[API] Dashboard data:", JSON.stringify({
      todaySales,
      totalTickets: totalTicketCount,
      soldTickets: soldTickets._sum.soldCount || 0,
      pendingResults,
      totalWinners,
      totalCustomers,
    }));

    return success(dashboard);
  } catch (e) {
    console.error("[API] dashboard error:", e);
    return error("Failed to load dashboard", 500);
  }
}
