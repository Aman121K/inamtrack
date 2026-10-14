import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { loginSchema } from "@/lib/validators/auth";
import { verifyPin } from "@/lib/auth/pin";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  console.log("[API] POST /api/auth/login");

  try {
    const body = await req.json();
    console.log("[API] Body:", JSON.stringify({ phone: body.phone, pin: "****" }));

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[API] Validation failed:", parsed.error.issues);
      return error(parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const { phone, pin } = parsed.data;

    const agent = await prisma.agent.findUnique({ where: { phone } });
    if (!agent) {
      console.warn(`[API] Login attempt for unregistered phone: ${phone}`);
      return error("Agent not found", 404);
    }

    if (!agent.pinHash) {
      console.warn(`[API] Login attempt for agent without PIN: ${phone}`);
      return error("PIN not set. Please set your PIN first.", 400);
    }

    if (agent.status === "pending") {
      console.warn(`[API] Login attempt for pending agent: ${phone}`);
      return error("Aapki request admin approval ka intezaar kar rahi hai.", 403);
    }

    if (agent.status === "rejected") {
      console.warn(`[API] Login attempt for rejected agent: ${phone}`);
      return error("Aapki access request reject ho gayi hai. Admin se sampark karein.", 403);
    }

    if (!agent.isActive) {
      console.warn(`[API] Login attempt for deactivated agent: ${phone}`);
      return error("Account is deactivated", 403);
    }

    const pinValid = await verifyPin(pin, agent.pinHash);
    if (!pinValid) {
      console.warn(`[API] Wrong PIN for ${phone}`);
      await logAudit({
        action: "login_fail",
        entityType: "agent",
        entityId: agent.id,
        agentId: agent.id,
        metadata: { reason: "wrong_pin" },
      });
      return error("Incorrect PIN", 401);
    }

    console.log(`[API] PIN verified for ${phone}, creating session...`);

    const accessToken = await signAccessToken({
      agentId: agent.id,
      phone: agent.phone,
    });

    const refreshToken = await signRefreshToken({
      agentId: agent.id,
      phone: agent.phone,
    });

    await prisma.session.create({
      data: {
        agentId: agent.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await logAudit({
      action: "login",
      entityType: "agent",
      entityId: agent.id,
      agentId: agent.id,
    });

    console.log(`[API] Login successful for ${phone}`);

    return success({
      accessToken,
      refreshToken,
      agent: {
        id: agent.id,
        name: agent.name,
        phone: agent.phone,
        preferredLanguage: agent.preferredLanguage,
      },
    });
  } catch (e) {
    console.error("[API] login error:", e);
    return error("Login failed", 500);
  }
}
