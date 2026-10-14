import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticateAdmin, isAdminPayload } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("[API] GET /api/admin/requests");

  const auth = await authenticateAdmin(req);
  if (!isAdminPayload(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";

    const agents = await prisma.agent.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        city: true,
        preferredLanguage: true,
        status: true,
        createdAt: true,
      },
    });

    const counts = await prisma.agent.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const countMap: Record<string, number> = {};
    for (const c of counts) countMap[c.status] = c._count._all;

    console.log(`[API] Found ${agents.length} '${status}' requests`);
    return success({ requests: agents, counts: countMap });
  } catch (e) {
    console.error("[API] admin requests error:", e);
    return error("Failed to fetch requests", 500);
  }
}
