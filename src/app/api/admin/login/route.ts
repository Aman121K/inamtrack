import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { adminLoginSchema } from "@/lib/validators/auth";
import { signAdminToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("[API] POST /api/admin/login");

  try {
    const adminPhone = process.env.SUPER_ADMIN_PHONE;
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!adminPhone || !adminPassword) {
      console.error("[API] SUPER_ADMIN_PHONE / SUPER_ADMIN_PASSWORD not configured");
      return error("Admin login not configured", 500);
    }

    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const { phone, password } = parsed.data;

    if (phone !== adminPhone || password !== adminPassword) {
      console.warn(`[API] Admin login failed for ${phone}`);
      return error("Galat phone ya password", 401);
    }

    const token = await signAdminToken({ role: "super_admin", phone });
    console.log(`[API] Admin logged in: ${phone}`);

    return success({ token, phone });
  } catch (e) {
    console.error("[API] admin login error:", e);
    return error("Login failed", 500);
  }
}
