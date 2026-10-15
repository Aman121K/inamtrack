import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { success, error } from "@/lib/api/response";
import { authenticateAdmin, isAdminPayload } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("[API] GET /api/admin/agents");

  const auth = await authenticateAdmin(req);
  if (!isAdminPayload(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "recent";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search } },
              { city: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    // Work out which agent ids are on this page (ordered).
    let pageIds: string[];
    if (sort === "revenue") {
      const conds: Prisma.Sql[] = [Prisma.sql`1=1`];
      if (status) conds.push(Prisma.sql`a.status = ${status}`);
      if (search) {
        const like = `%${search}%`;
        conds.push(
          Prisma.sql`(a.name ILIKE ${like} OR a.phone LIKE ${like} OR a.city ILIKE ${like})`
        );
      }
      const ordered = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT a.id
        FROM agents a
        LEFT JOIN (
          SELECT agent_id, SUM(sale_price) AS rev FROM sales GROUP BY agent_id
        ) s ON s.agent_id = a.id
        WHERE ${Prisma.join(conds, " AND ")}
        ORDER BY COALESCE(s.rev, 0) DESC, a.created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `);
      pageIds = ordered.map((r) => r.id);
    } else {
      const recent = await prisma.agent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: { id: true },
      });
      pageIds = recent.map((r) => r.id);
    }

    const [agentRows, total, counts, revenueRows] = await Promise.all([
      prisma.agent.findMany({
        where: { id: { in: pageIds } },
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
      }),
      prisma.agent.count({ where }),
      prisma.agent.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.sale.groupBy({
        by: ["agentId"],
        where: { agentId: { in: pageIds } },
        _sum: { salePrice: true },
      }),
    ]);

    const revenueMap = new Map(
      revenueRows.map((r) => [r.agentId, Number(r._sum.salePrice ?? 0)])
    );
    const byId = new Map(agentRows.map((a) => [a.id, a]));
    const agents = pageIds
      .map((id) => byId.get(id))
      .filter((a): a is NonNullable<typeof a> => !!a)
      .map((a) => ({ ...a, revenue: revenueMap.get(a.id) ?? 0 }));

    const countMap: Record<string, number> = {};
    for (const c of counts) countMap[c.status] = c._count._all;
    countMap.all = Object.values(countMap).reduce((a, b) => a + b, 0);

    return success({
      agents,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      counts: countMap,
    });
  } catch (e) {
    console.error("[API] admin agents error:", e);
    return error("Failed to fetch agents", 500);
  }
}
