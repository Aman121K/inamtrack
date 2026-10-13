import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticate } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  console.log("[API] POST /api/auth/logout");

  try {
    const authResult = await authenticate(req);
    if (authResult instanceof Response) return authResult;

    const { refreshToken } = await req.json().catch(() => ({ refreshToken: "" }));

    if (refreshToken) {
      console.log(`[API] Revoking refresh token for agent: ${authResult.agentId}`);
      await prisma.session.updateMany({
        where: {
          agentId: authResult.agentId,
          refreshToken,
          revoked: false,
        },
        data: { revoked: true },
      });
    } else {
      console.log(`[API] Revoking all sessions for agent: ${authResult.agentId}`);
      await prisma.session.updateMany({
        where: {
          agentId: authResult.agentId,
          revoked: false,
        },
        data: { revoked: true },
      });
    }

    await logAudit({
      action: "logout",
      entityType: "agent",
      entityId: authResult.agentId,
      agentId: authResult.agentId,
    });

    console.log(`[API] Logout successful for agent: ${authResult.agentId}`);
    return success({ message: "Logged out successfully" });
  } catch (e) {
    console.error("[API] logout error:", e);
    return error("Logout failed", 500);
  }
}
