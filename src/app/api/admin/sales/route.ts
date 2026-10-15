import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticateAdmin, isAdminPayload } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  console.log("[API] GET /api/admin/sales");

  const auth = await authenticateAdmin(req);
  if (!isAdminPayload(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const agentId = searchParams.get("agentId") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    if (agentId && !UUID_RE.test(agentId)) return error("Invalid agent", 400);

    // `base` ignores the status tab so tab counts stay stable while filtering.
    const base = {
      ...(agentId ? { agentId } : {}),
      ...(search
        ? {
            OR: [
              { fullTicketId: { contains: search, mode: "insensitive" as const } },
              { customer: { name: { contains: search, mode: "insensitive" as const } } },
              { customer: { phone: { contains: search } } },
              { agent: { name: { contains: search, mode: "insensitive" as const } } },
              { agent: { phone: { contains: search } } },
            ],
          }
        : {}),
    };
    const where = { ...base, ...(status ? { resultStatus: status } : {}) };

    const [sales, total, agg, statusCounts] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          agent: { select: { id: true, name: true, phone: true, city: true } },
          customer: { select: { name: true, phone: true } },
          batch: { select: { lotteryName: true, series: true } },
        },
      }),
      prisma.sale.count({ where }),
      prisma.sale.aggregate({ where, _sum: { salePrice: true, prizeAmount: true } }),
      prisma.sale.groupBy({ by: ["resultStatus"], where: base, _count: { _all: true } }),
    ]);

    const counts: Record<string, number> = {};
    for (const c of statusCounts) counts[c.resultStatus] = c._count._all;
    counts.all = Object.values(counts).reduce((a, b) => a + b, 0);

    return success({
      sales,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      counts,
      summary: {
        revenue: Number(agg._sum.salePrice ?? 0),
        prizes: Number(agg._sum.prizeAmount ?? 0),
      },
    });
  } catch (e) {
    console.error("[API] admin sales error:", e);
    return error("Failed to fetch sales", 500);
  }
}
