import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { sendOtpSchema } from "@/lib/validators/auth";
import { createOtp } from "@/lib/auth/otp";

export async function POST(req: NextRequest) {
  console.log("[API] POST /api/auth/send-otp");

  try {
    const body = await req.json();
    console.log("[API] Body:", JSON.stringify(body));

    const parsed = sendOtpSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[API] Validation failed:", parsed.error.issues);
      return error(parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const { phone } = parsed.data;
    console.log(`[API] Sending OTP to ${phone}`);

    const code = await createOtp(phone);
    console.log(`[API] OTP created for ${phone}`);

    return success({ message: "OTP sent successfully" });
  } catch (e) {
    console.error("[API] send-otp error:", e);
    return error("Failed to send OTP", 500);
  }
}
