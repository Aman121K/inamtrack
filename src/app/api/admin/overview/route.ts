import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticateAdmin, isAdminPayload } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("[API] GET /api/admin/overview");

  const auth = await authenticateAdmin(req);
  if (!isAdminPayload(auth)) return auth;

  try {
    // Last 7 days in IST, oldest → newest.
    const IST_MS = 5.5 * 3600 * 1000;
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      days.push(new Date(Date.now() + IST_MS - i * 86400000).toISOString().slice(0, 10));
    }
    const since = new Date(`${days[0]}T00:00:00+05:30`);
    const todayStart = new Date(`${days[6]}T00:00:00+05:30`);

    const [
      totalAgents,
      pendingApprovals,
      activeAgents,
      totalLots,
      salesAgg,
      totalWinners,
      totalCustomers,
      todayAgg,
      trendRows,
      topRevenue,
      recentSales,
      recentPending,
    ] = await Promise.all([
      prisma.agent.count(),
      prisma.agent.count({ where: { status: "pending" } }),
      prisma.agent.count({ where: { status: "approved", isActive: true } }),
      prisma.ticketBatch.count(),
      prisma.sale.aggregate({ _count: { _all: true }, _sum: { salePrice: true } }),
      prisma.sale.count({ where: { resultStatus: "won" } }),
      prisma.customer.count(),
      prisma.sale.aggregate({
        where: { createdAt: { gte: todayStart } },
        _count: { _all: true },
        _sum: { salePrice: true },
      }),
      prisma.$queryRaw<{ day: Date; sales: number; revenue: number }[]>`
        SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata') AS day,
               COUNT(*)::int AS sales,
               COALESCE(SUM(sale_price), 0)::float AS revenue
        FROM sales
        WHERE created_at >= ${since}
        GROUP BY 1 ORDER BY 1`,
      prisma.sale.groupBy({
        by: ["agentId"],
        _count: { _all: true },
        _sum: { salePrice: true },
        orderBy: { _sum: { salePrice: "desc" } },
        take: 5,
      }),
      prisma.sale.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          agent: { select: { id: true, name: true } },
          customer: { select: { name: true } },
          batch: { select: { lotteryName: true } },
        },
      }),
      prisma.agent.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, name: true, phone: true, city: true, createdAt: true },
      }),
    ]);

    const trendMap = new Map(
      trendRows.map((r) => [new Date(r.day).toISOString().slice(0, 10), r])
    );
    const trend = days.map((d) => ({
      date: d,
      sales: trendMap.get(d)?.sales ?? 0,
      revenue: trendMap.get(d)?.revenue ?? 0,
    }));

    const topAgentRows = await prisma.agent.findMany({
      where: { id: { in: topRevenue.map((t) => t.agentId) } },
      select: { id: true, name: true, city: true },
    });
    const agentById = new Map(topAgentRows.map((a) => [a.id, a]));
    const topAgents = topRevenue.map((t) => ({
      id: t.agentId,
      name: agentById.get(t.agentId)?.name ?? "Unknown",
      city: agentById.get(t.agentId)?.city ?? null,
      sales: t._count._all,
      revenue: Number(t._sum.salePrice ?? 0),
    }));

    return success({
      totalAgents,
      pendingApprovals,
      activeAgents,
      totalLots,
      totalSales: salesAgg._count._all,
      totalRevenue: Number(salesAgg._sum.salePrice ?? 0),
      totalWinners,
      totalCustomers,
      today: {
        sales: todayAgg._count._all,
        revenue: Number(todayAgg._sum.salePrice ?? 0),
      },
      trend,
      topAgents,
      recentSales: recentSales.map((s) => ({
        id: s.id,
        ticket: s.fullTicketId,
        amount: Number(s.salePrice),
        status: s.resultStatus,
        createdAt: s.createdAt,
        customer: s.customer?.name ?? "—",
        lottery: s.batch?.lotteryName ?? "",
        agent: s.agent,
      })),
      recentPending,
    });
  } catch (e) {
    console.error("[API] admin overview error:", e);
    return error("Failed to load overview", 500);
  }
}
