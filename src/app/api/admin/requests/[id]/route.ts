import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticateAdmin, isAdminPayload } from "@/lib/auth/middleware";
import { reviewRequestSchema } from "@/lib/validators/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[API] POST /api/admin/requests/${params.id}`);

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
    if (!agent) return error("Request not found", 404);

    const newStatus = action === "approve" ? "approved" : "rejected";
    const updated = await prisma.agent.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        isActive: action === "approve",
      },
      select: { id: true, name: true, phone: true, status: true },
    });

    await logAudit({
      action: action === "approve" ? "agent_approved" : "agent_rejected",
      entityType: "agent",
      entityId: agent.id,
      agentId: agent.id,
      metadata: { reviewedBy: auth.phone },
    });

    console.log(`[API] Agent ${agent.phone} ${newStatus} by admin ${auth.phone}`);
    return success({ agent: updated });
  } catch (e) {
    console.error("[API] review request error:", e);
    return error("Failed to update request", 500);
  }
}
