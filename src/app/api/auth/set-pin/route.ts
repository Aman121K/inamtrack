import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { setPinSchema } from "@/lib/validators/auth";
import { hashPin } from "@/lib/auth/pin";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  console.log("[API] POST /api/auth/set-pin");

  try {
    const body = await req.json();
    console.log("[API] Body:", JSON.stringify({ ...body, pin: "****" }));

    const parsed = setPinSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[API] Validation failed:", parsed.error.issues);
      return error(parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const { phone, name, pin, city, preferredLanguage } = parsed.data;

    const existing = await prisma.agent.findUnique({ where: { phone } });
    if (existing?.pinHash) {
      console.warn(`[API] Agent ${phone} already has a PIN`);
      return error("PIN already set. Use login instead.", 409);
    }

    const pinHash = await hashPin(pin);
    console.log(`[API] PIN hashed for ${phone}`);

    const agent = existing
      ? await prisma.agent.update({
          where: { phone },
          data: { name, pinHash, city, preferredLanguage: preferredLanguage || "hi" },
        })
      : await prisma.agent.create({
          data: {
            phone,
            name,
            pinHash,
            city,
            preferredLanguage: preferredLanguage || "hi",
          },
        });

    console.log(`[API] Agent ${existing ? "updated" : "created"}: ${agent.id}`);

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
      action: existing ? "update" : "create",
      entityType: "agent",
      entityId: agent.id,
      agentId: agent.id,
    });

    console.log(`[API] Registration complete for ${phone}`);

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
    console.error("[API] set-pin error:", e);
    return error("Registration failed", 500);
  }
}
