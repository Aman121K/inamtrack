import { NextRequest } from "next/server";
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
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

    const [agents, total, counts] = await Promise.all([
      prisma.agent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
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
    ]);

    const countMap: Record<string, number> = {};
    for (const c of counts) countMap[c.status] = c._count._all;

    return success({
      agents,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      counts: countMap,
    });
  } catch (e) {
    console.error("[API] admin agents error:", e);
    return error("Failed to fetch agents", 500);
  }
}
