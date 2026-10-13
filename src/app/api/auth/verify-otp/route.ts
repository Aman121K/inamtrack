import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { verifyOtpSchema } from "@/lib/validators/auth";
import { verifyOtp } from "@/lib/auth/otp";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  console.log("[API] POST /api/auth/verify-otp");

  try {
    const body = await req.json();
    console.log("[API] Body:", JSON.stringify({ phone: body.phone, code: "***" }));

    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[API] Validation failed:", parsed.error.issues);
      return error(parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const { phone, code } = parsed.data;
    const result = await verifyOtp(phone, code);

    if (!result.valid) {
      console.warn(`[API] OTP verification failed for ${phone}: ${result.error}`);
      return error(result.error || "Invalid or expired OTP", 401);
    }

    console.log(`[API] OTP verified for ${phone}, checking registration...`);

    const agent = await prisma.agent.findUnique({ where: { phone } });

    if (agent && agent.pinHash) {
      console.log(`[API] Agent ${phone} is registered with PIN`);
      return success({ status: "registered", hasPin: true });
    }

    if (agent && !agent.pinHash) {
      console.log(`[API] Agent ${phone} exists but no PIN set`);
      return success({ status: "registered", hasPin: false });
    }

    console.log(`[API] Agent ${phone} is new — needs registration`);
    return success({ status: "new", hasPin: false });
  } catch (e) {
    console.error("[API] verify-otp error:", e);
    return error("Failed to verify OTP", 500);
  }
}
