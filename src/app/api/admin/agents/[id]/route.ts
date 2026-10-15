import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticateAdmin, isAdminPayload } from "@/lib/auth/middleware";
import { reviewRequestSchema } from "@/lib/validators/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Full agent profile: identity, revenue, prizes, 30-day trend, per-lottery revenue.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticateAdmin(req);
  if (!isAdminPayload(auth)) return auth;

  try {
    if (!UUID_RE.test(params.id)) return error("Agent not found", 404);

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        phone: true,
        city: true,
        preferredLanguage: true,
        status: true,
        isActive: true,
        createdAt: true,
        _count: { select: { ticketBatches: true, sales: true, customers: true } },
      },
    });
    if (!agent) return error("Agent not found", 404);

    // 30-day window in IST, oldest → newest.
    const IST_MS = 5.5 * 3600 * 1000;
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      days.push(new Date(Date.now() + IST_MS - i * 86400000).toISOString().slice(0, 10));
    }
    const since = new Date(`${days[0]}T00:00:00+05:30`);

    const [salesAgg, winners, prizeAgg, ticketAgg, lastSale, trendRows, byLottery] =
      await Promise.all([
        prisma.sale.aggregate({
          where: { agentId: params.id },
          _count: { _all: true },
          _sum: { salePrice: true },
        }),
        prisma.sale.count({ where: { agentId: params.id, resultStatus: "won" } }),
        prisma.sale.aggregate({
          where: { agentId: params.id, resultStatus: "won" },
          _sum: { prizeAmount: true },
        }),
        prisma.ticketBatch.aggregate({
          where: { agentId: params.id },
          _sum: { ticketCount: true, soldCount: true },
        }),
        prisma.sale.findFirst({
          where: { agentId: params.id },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
        prisma.$queryRaw<{ day: Date; sales: number; revenue: number }[]>`
          SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata') AS day,
                 COUNT(*)::int AS sales,
                 COALESCE(SUM(sale_price), 0)::float AS revenue
          FROM sales
          WHERE agent_id = ${params.id}::uuid AND created_at >= ${since}
          GROUP BY 1 ORDER BY 1`,
        prisma.$queryRaw<{ lottery: string; sales: number; revenue: number }[]>`
          SELECT b.lottery_name AS lottery,
                 COUNT(*)::int AS sales,
                 COALESCE(SUM(s.sale_price), 0)::float AS revenue
          FROM sales s JOIN ticket_batches b ON b.id = s.batch_id
          WHERE s.agent_id = ${params.id}::uuid
          GROUP BY b.lottery_name ORDER BY revenue DESC LIMIT 8`,
      ]);

    const trendMap = new Map(
      trendRows.map((r) => [new Date(r.day).toISOString().slice(0, 10), r])
    );
    const trend = days.map((d) => ({
      date: d,
      sales: trendMap.get(d)?.sales ?? 0,
      revenue: trendMap.get(d)?.revenue ?? 0,
    }));

    return success({
      agent,
      stats: {
        totalSales: salesAgg._count._all,
        totalRevenue: Number(salesAgg._sum.salePrice ?? 0),
        winners,
        prizeTotal: Number(prizeAgg._sum.prizeAmount ?? 0),
        ticketsTotal: ticketAgg._sum.ticketCount ?? 0,
        ticketsSold: ticketAgg._sum.soldCount ?? 0,
        lastSaleAt: lastSale?.createdAt ?? null,
      },
      trend,
      byLottery,
    });
  } catch (e) {
    console.error("[API] admin agent detail error:", e);
    return error("Failed to load agent", 500);
  }
}

// Control actions: approve / reject / activate / deactivate.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticateAdmin(req);
  if (!isAdminPayload(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = reviewRequestSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0]?.message || "Invalid action", 400);
    }
    const { action } = parsed.data;

    const agent = await prisma.agent.findUnique({ where: { id: params.id } });
    if (!agent) return error("Agent not found", 404);

    const data: { status?: string; isActive?: boolean } = {};
    if (action === "approve") {
      data.status = "approved";
      data.isActive = true;
    } else if (action === "reject") {
      data.status = "rejected";
      data.isActive = false;
    } else if (action === "activate") {
      data.isActive = true;
    } else if (action === "deactivate") {
      data.isActive = false;
    }

    const updated = await prisma.agent.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, phone: true, status: true, isActive: true },
    });

    await logAudit({
      action: `agent_${action}`,
      entityType: "agent",
      entityId: agent.id,
      agentId: agent.id,
      metadata: { by: auth.phone },
    });

    console.log(`[API] Agent ${agent.phone} ${action} by admin ${auth.phone}`);
    return success({ agent: updated });
  } catch (e) {
    console.error("[API] admin agent action error:", e);
    return error("Failed to update agent", 500);
  }
}
