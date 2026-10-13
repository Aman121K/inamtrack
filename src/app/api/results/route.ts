import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticate } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  console.log("[API] GET /api/results");

  try {
    const authResult = await authenticate(req);
    if (authResult instanceof Response) return authResult;

    const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20")));

    console.log(`[API] Fetching ${limit} recent draw results`);

    const results = await prisma.drawResult.findMany({
      orderBy: { drawDate: "desc" },
      take: limit,
    });

    console.log(`[API] Found ${results.length} draw results`);

    return success({ results });
  } catch (e) {
    console.error("[API] results error:", e);
    return error("Failed to fetch results", 500);
  }
}
