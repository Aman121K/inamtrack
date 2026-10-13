import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticate } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  console.log("[API] GET /api/customers");

  try {
    const authResult = await authenticate(req);
    if (authResult instanceof Response) return authResult;

    const search = req.nextUrl.searchParams.get("search") || "";
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    console.log(`[API] Customer search: "${search}", page: ${page}, limit: ${limit}, agent: ${authResult.agentId}`);

    const where = {
      agentId: authResult.agentId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.customer.count({ where }),
    ]);

    console.log(`[API] Found ${customers.length}/${total} customers`);

    return success({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    console.error("[API] customers error:", e);
    return error("Failed to fetch customers", 500);
  }
}
