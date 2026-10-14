import { NextRequest } from "next/server";
import { verifyAccessToken, verifyAdminToken, TokenPayload, AdminTokenPayload } from "./jwt";
import { error } from "../api/response";

export async function authenticate(
  req: NextRequest
): Promise<TokenPayload | Response> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.warn("[Auth] Request without Bearer token");
    return error("Token missing", 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyAccessToken(token);
  if (!payload) {
    console.warn("[Auth] Invalid or expired token");
    return error("Invalid or expired token", 401);
  }

  console.log(`[Auth] Authenticated agent ${payload.agentId} (${payload.phone})`);
  return payload;
}

export function isTokenPayload(
  result: TokenPayload | Response
): result is TokenPayload {
  return "agentId" in result;
}

export async function authenticateAdmin(
  req: NextRequest
): Promise<AdminTokenPayload | Response> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.warn("[Auth] Admin request without Bearer token");
    return error("Admin token missing", 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyAdminToken(token);
  if (!payload) {
    console.warn("[Auth] Invalid or expired admin token");
    return error("Invalid or expired admin token", 401);
  }

  console.log(`[Auth] Authenticated admin ${payload.phone}`);
  return payload;
}

export function isAdminPayload(
  result: AdminTokenPayload | Response
): result is AdminTokenPayload {
  return "role" in result;
}
