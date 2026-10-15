import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticateAdmin, isAdminPayload } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("[API] GET /api/admin/results");

  const auth = await authenticateAdmin(req);
  if (!isAdminPayload(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || ""; // "matched" | "pending"
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    const base = search
      ? { lotteryName: { contains: search, mode: "insensitive" as const } }
      : {};
    const where = {
      ...base,
      ...(status === "matched" ? { matched: true } : status === "pending" ? { matched: false } : {}),
    };

    const [results, total, matchedCount, allCount] = await Promise.all([
      prisma.drawResult.findMany({
        where,
        orderBy: { drawDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.drawResult.count({ where }),
      prisma.drawResult.count({ where: { ...base, matched: true } }),
      prisma.drawResult.count({ where: base }),
    ]);

    // How many tickets sold across all agents won in each draw.
    const winners = await Promise.all(
      results.map((r) =>
        prisma.sale.count({
          where: {
            resultStatus: "won",
            drawDate: r.drawDate,
            batch: { lotteryName: r.lotteryName },
          },
        })
      )
    );

    return success({
      results: results.map((r, i) => ({ ...r, winnersCount: winners[i] })),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      counts: { all: allCount, matched: matchedCount, pending: allCount - matchedCount },
    });
  } catch (e) {
    console.error("[API] admin results error:", e);
    return error("Failed to fetch results", 500);
  }
}
