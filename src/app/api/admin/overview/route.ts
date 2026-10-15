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
    const [
      totalAgents,
      pendingApprovals,
      activeAgents,
      totalLots,
      salesAgg,
      totalWinners,
      totalCustomers,
    ] = await Promise.all([
      prisma.agent.count(),
      prisma.agent.count({ where: { status: "pending" } }),
      prisma.agent.count({ where: { status: "approved", isActive: true } }),
      prisma.ticketBatch.count(),
      prisma.sale.aggregate({ _count: { _all: true }, _sum: { salePrice: true } }),
      prisma.sale.count({ where: { resultStatus: "won" } }),
      prisma.customer.count(),
    ]);

    return success({
      totalAgents,
      pendingApprovals,
      activeAgents,
      totalLots,
      totalSales: salesAgg._count._all,
      totalRevenue: Number(salesAgg._sum.salePrice ?? 0),
      totalWinners,
      totalCustomers,
    });
  } catch (e) {
    console.error("[API] admin overview error:", e);
    return error("Failed to load overview", 500);
  }
}
