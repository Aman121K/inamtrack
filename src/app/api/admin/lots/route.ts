import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticateAdmin, isAdminPayload } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("[API] GET /api/admin/lots");

  const auth = await authenticateAdmin(req);
  if (!isAdminPayload(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { lotteryName: { contains: search, mode: "insensitive" as const } },
              { agent: { name: { contains: search, mode: "insensitive" as const } } },
              { agent: { phone: { contains: search } } },
            ],
          }
        : {}),
    };

    const [lots, total] = await Promise.all([
      prisma.ticketBatch.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { agent: { select: { name: true, phone: true, city: true } } },
      }),
      prisma.ticketBatch.count({ where }),
    ]);

    return success({
      lots,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error("[API] admin lots error:", e);
    return error("Failed to fetch lots", 500);
  }
}
