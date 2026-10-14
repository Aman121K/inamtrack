import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { requestAccessSchema } from "@/lib/validators/auth";
import { hashPin } from "@/lib/auth/pin";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("[API] POST /api/auth/request-access");

  try {
    const body = await req.json();
    console.log("[API] Body:", JSON.stringify({ ...body, pin: "****" }));

    const parsed = requestAccessSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[API] Validation failed:", parsed.error.issues);
      return error(parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const { phone, name, pin, city, preferredLanguage } = parsed.data;

    const existing = await prisma.agent.findUnique({ where: { phone } });

    if (existing) {
      if (existing.status === "approved") {
        return error("Yeh number pehle se registered hai. Login karein.", 409);
      }
      if (existing.status === "pending") {
        return error("Aapki request pehle hi bheji ja chuki hai. Admin approval ka intezaar karein.", 409);
      }
      // Rejected earlier — allow the agent to re-submit a fresh request.
      const pinHash = await hashPin(pin);
      await prisma.agent.update({
        where: { phone },
        data: {
          name,
          pinHash,
          city,
          preferredLanguage: preferredLanguage || "hi",
          status: "pending",
        },
      });
      console.log(`[API] Re-submitted access request for ${phone}`);
      return success({ status: "pending" }, 201);
    }

    const pinHash = await hashPin(pin);
    const agent = await prisma.agent.create({
      data: {
        phone,
        name,
        pinHash,
        city,
        preferredLanguage: preferredLanguage || "hi",
        status: "pending",
        isActive: true,
      },
    });

    await logAudit({
      action: "access_request",
      entityType: "agent",
      entityId: agent.id,
      agentId: agent.id,
    });

    console.log(`[API] Access request created for ${phone}: ${agent.id}`);
    return success({ status: "pending" }, 201);
  } catch (e) {
    console.error("[API] request-access error:", e);
    return error("Request failed", 500);
  }
}
