import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticate } from "@/lib/auth/middleware";
import { createBatchSchema } from "@/lib/validators/inventory";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  console.log("[API] GET /api/inventory");

  try {
    const authResult = await authenticate(req);
    if (authResult instanceof Response) return authResult;

    const status = req.nextUrl.searchParams.get("status") || "active";
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    console.log(`[API] Inventory: status=${status}, page=${page}, agent=${authResult.agentId}`);

    const where = {
      agentId: authResult.agentId,
      status,
    };

    const [batches, total] = await Promise.all([
      prisma.ticketBatch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { drawDate: "desc" as const },
      }),
      prisma.ticketBatch.count({ where }),
    ]);

    console.log(`[API] Found ${batches.length}/${total} batches`);

    return success({
      batches,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error("[API] inventory GET error:", e);
    return error("Failed to fetch inventory", 500);
  }
}

export async function POST(req: NextRequest) {
  console.log("[API] POST /api/inventory");

  try {
    const authResult = await authenticate(req);
    if (authResult instanceof Response) return authResult;

    const body = await req.json();
    console.log("[API] Body:", JSON.stringify(body));

    const parsed = createBatchSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[API] Validation failed:", parsed.error.issues);
      return error(parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const { lotteryName, series, startNumber, endNumber, pricePerTicket, drawDate } = parsed.data;
    const ticketCount = endNumber - startNumber + 1;

    const existingBatch = await prisma.ticketBatch.findFirst({
      where: {
        agentId: authResult.agentId,
        lotteryName,
        series,
        drawDate: new Date(drawDate),
      },
    });

    if (existingBatch) {
      console.warn(`[API] Duplicate batch: ${lotteryName} ${series} on ${drawDate}`);
      return error("A batch with this lottery, series and draw date already exists", 409);
    }

    console.log(`[API] Creating batch: ${lotteryName} ${series} (${startNumber}-${endNumber}, ${ticketCount} tickets)`);

    const batch = await prisma.ticketBatch.create({
      data: {
        agentId: authResult.agentId,
        lotteryName,
        series,
        startNumber,
        endNumber,
        ticketCount,
        pricePerTicket,
        drawDate: new Date(drawDate),
      },
    });

    await logAudit({
      action: "create",
      entityType: "ticketBatch",
      entityId: batch.id,
      agentId: authResult.agentId,
      metadata: { lotteryName, series, startNumber, endNumber, ticketCount },
    });

    console.log(`[API] Batch created: ${batch.id}`);

    return success({ batch }, 201);
  } catch (e) {
    console.error("[API] inventory POST error:", e);
    return error("Failed to create batch", 500);
  }
}
