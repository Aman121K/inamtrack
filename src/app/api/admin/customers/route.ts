import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticateAdmin, isAdminPayload } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  console.log("[API] GET /api/admin/customers");

  const auth = await authenticateAdmin(req);
  if (!isAdminPayload(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const agentId = searchParams.get("agentId") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    if (agentId && !UUID_RE.test(agentId)) return error("Invalid agent", 400);

    const where = {
      ...(agentId ? { agentId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search } },
              { agent: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [customers, total, agg] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: { agent: { select: { id: true, name: true, phone: true, city: true } } },
      }),
      prisma.customer.count({ where }),
      prisma.customer.aggregate({ where, _sum: { totalPurchases: true, totalWins: true } }),
    ]);

    return success({
      customers,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      summary: {
        purchases: agg._sum.totalPurchases ?? 0,
        wins: agg._sum.totalWins ?? 0,
      },
    });
  } catch (e) {
    console.error("[API] admin customers error:", e);
    return error("Failed to fetch customers", 500);
  }
}
