import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticateAdmin, isAdminPayload } from "@/lib/auth/middleware";
import { reviewRequestSchema } from "@/lib/validators/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Agent detail with their lots and recent sales.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticateAdmin(req);
  if (!isAdminPayload(auth)) return auth;

  try {
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

    const [lots, salesAgg, winners] = await Promise.all([
      prisma.ticketBatch.findMany({
        where: { agentId: params.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.sale.aggregate({
        where: { agentId: params.id },
        _count: { _all: true },
        _sum: { salePrice: true },
      }),
      prisma.sale.count({ where: { agentId: params.id, resultStatus: "won" } }),
    ]);

    return success({
      agent,
      lots,
      stats: {
        totalSales: salesAgg._count._all,
        totalRevenue: Number(salesAgg._sum.salePrice ?? 0),
        winners,
      },
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
