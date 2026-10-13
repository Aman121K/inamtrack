import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { refreshSchema } from "@/lib/validators/auth";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  console.log("[API] POST /api/auth/refresh");

  try {
    const body = await req.json();

    const parsed = refreshSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[API] Validation failed:", parsed.error.issues);
      return error("Invalid refresh token", 400);
    }

    const { refreshToken } = parsed.data;

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      console.warn("[API] Invalid/expired refresh token");
      return error("Invalid or expired refresh token", 401);
    }

    const session = await prisma.session.findFirst({
      where: {
        agentId: payload.agentId,
        refreshToken,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      console.warn(`[API] No valid session found for agent: ${payload.agentId}`);
      return error("Session expired or revoked", 401);
    }

    const agent = await prisma.agent.findUnique({
      where: { id: payload.agentId },
    });

    if (!agent || !agent.isActive) {
      console.warn(`[API] Agent not found or deactivated: ${payload.agentId}`);
      return error("Account not found or deactivated", 401);
    }

    console.log(`[API] Rotating tokens for agent: ${agent.phone}`);

    const newAccessToken = await signAccessToken({
      agentId: agent.id,
      phone: agent.phone,
    });

    const newRefreshToken = await signRefreshToken({
      agentId: agent.id,
      phone: agent.phone,
    });

    await prisma.session.update({
      where: { id: session.id },
      data: { revoked: true },
    });

    await prisma.session.create({
      data: {
        agentId: agent.id,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`[API] Token rotation complete for ${agent.phone}`);

    return success({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      agent: {
        id: agent.id,
        name: agent.name,
        phone: agent.phone,
        preferredLanguage: agent.preferredLanguage,
      },
    });
  } catch (e) {
    console.error("[API] refresh error:", e);
    return error("Token refresh failed", 500);
  }
}
