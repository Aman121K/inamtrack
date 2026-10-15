import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticateAdmin, isAdminPayload } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  console.log("[API] GET /api/admin/lots");

  const auth = await authenticateAdmin(req);
  if (!isAdminPayload(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const agentId = searchParams.get("agentId") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    if (agentId && !UUID_RE.test(agentId)) return error("Invalid agent", 400);

    const base = {
      ...(agentId ? { agentId } : {}),
      ...(search
        ? {
            OR: [
              { lotteryName: { contains: search, mode: "insensitive" as const } },
              { agent: { name: { contains: search, mode: "insensitive" as const } } },
              { agent: { phone: { contains: search } } },
            ],
          }
        : {}),
    };
    const where = { ...base, ...(status ? { status } : {}) };

    const [lots, total, statusCounts, agg] = await Promise.all([
      prisma.ticketBatch.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { agent: { select: { id: true, name: true, phone: true, city: true } } },
      }),
      prisma.ticketBatch.count({ where }),
      prisma.ticketBatch.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
      prisma.ticketBatch.aggregate({ where, _sum: { ticketCount: true, soldCount: true } }),
    ]);

    const counts: Record<string, number> = {};
    for (const c of statusCounts) counts[c.status] = c._count._all;
    counts.all = Object.values(counts).reduce((a, b) => a + b, 0);

    return success({
      lots,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      counts,
      summary: {
        tickets: agg._sum.ticketCount ?? 0,
        sold: agg._sum.soldCount ?? 0,
      },
    });
  } catch (e) {
    console.error("[API] admin lots error:", e);
    return error("Failed to fetch lots", 500);
  }
}
