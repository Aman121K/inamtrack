import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticate } from "@/lib/auth/middleware";
import { createSaleSchema } from "@/lib/validators/sales";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { queueNotification, sendNotification } from "@/lib/whatsapp/notify";

export async function GET(req: NextRequest) {
  console.log("[API] GET /api/sales");

  try {
    const authResult = await authenticate(req);
    if (authResult instanceof Response) return authResult;

    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20")));
    const status = req.nextUrl.searchParams.get("status");
    const skip = (page - 1) * limit;

    console.log(`[API] Sales list: page=${page}, limit=${limit}, status=${status}, agent=${authResult.agentId}`);

    const where = {
      agentId: authResult.agentId,
      ...(status ? { resultStatus: status } : {}),
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" as const },
        include: {
          customer: { select: { name: true, phone: true } },
          batch: { select: { lotteryName: true } },
        },
      }),
      prisma.sale.count({ where }),
    ]);

    console.log(`[API] Found ${sales.length}/${total} sales`);

    return success({
      sales,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error("[API] sales GET error:", e);
    return error("Failed to fetch sales", 500);
  }
}

export async function POST(req: NextRequest) {
  console.log("[API] POST /api/sales");

  try {
    const authResult = await authenticate(req);
    if (authResult instanceof Response) return authResult;

    const body = await req.json();
    console.log("[API] Body:", JSON.stringify(body));

    const parsed = createSaleSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[API] Validation failed:", parsed.error.issues);
      return error(parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const { batchId, ticketNumber, customerName, customerPhone, offlineId } = parsed.data;

    if (offlineId) {
      const existing = await prisma.sale.findFirst({
        where: { offlineId, agentId: authResult.agentId },
      });
      if (existing) {
        console.log(`[API] Duplicate offlineId: ${offlineId} — returning existing sale`);
        return success({ sale: existing, deduplicated: true });
      }
    }

    const batch = await prisma.ticketBatch.findFirst({
      where: { id: batchId, agentId: authResult.agentId },
    });

    if (!batch) {
      console.warn(`[API] Batch not found: ${batchId}`);
      return error("Ticket batch not found", 404);
    }

    if (batch.status !== "active") {
      console.warn(`[API] Batch not active: ${batchId} (${batch.status})`);
      return error("Batch is not active", 400);
    }

    if (ticketNumber < batch.startNumber || ticketNumber > batch.endNumber) {
      console.warn(`[API] Ticket ${ticketNumber} out of range ${batch.startNumber}-${batch.endNumber}`);
      return error(`Ticket number must be between ${batch.startNumber} and ${batch.endNumber}`, 400);
    }

    const fullTicketId = `${batch.series}-${String(ticketNumber).padStart(5, "0")}`;

    const alreadySold = await prisma.sale.findFirst({
      where: { fullTicketId, drawDate: batch.drawDate, agentId: authResult.agentId },
    });

    if (alreadySold) {
      console.warn(`[API] Ticket ${fullTicketId} already sold`);
      return error("This ticket has already been sold", 409);
    }

    console.log(`[API] Creating sale: ${fullTicketId} to ${customerName} (${customerPhone})`);

    const sale = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: {
          agentId_phone: {
            agentId: authResult.agentId,
            phone: customerPhone,
          },
        },
        update: {
          name: customerName,
          totalPurchases: { increment: 1 },
        },
        create: {
          agentId: authResult.agentId,
          name: customerName,
          phone: customerPhone,
          totalPurchases: 1,
        },
      });

      const newSale = await tx.sale.create({
        data: {
          agentId: authResult.agentId,
          batchId: batch.id,
          customerId: customer.id,
          ticketNumber,
          fullTicketId,
          drawDate: batch.drawDate,
          salePrice: batch.pricePerTicket,
          offlineId,
        },
      });

      await tx.ticketBatch.update({
        where: { id: batch.id },
        data: { soldCount: { increment: 1 } },
      });

      console.log(`[API] Sale created: ${newSale.id}, customer: ${customer.id}`);
      return newSale;
    });

    await logAudit({
      action: "create",
      entityType: "sale",
      entityId: sale.id,
      agentId: authResult.agentId,
      metadata: { fullTicketId, customerPhone },
    });

    // Send the customer a WhatsApp confirmation (with this agent's details).
    // Never let a messaging error fail the sale — queue first, then try to send.
    try {
      const drawDateStr = batch.drawDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const notification = await queueNotification({
        agentId: authResult.agentId,
        type: "sale_confirm",
        recipientPhone: customerPhone,
        data: {
          customerName,
          lotteryName: batch.lotteryName,
          ticketId: fullTicketId,
          price: batch.pricePerTicket.toString(),
          drawDate: drawDateStr,
        },
      });
      await sendNotification(notification.id);
    } catch (notifyErr) {
      console.error("[API] sale confirmation notify failed (non-fatal):", notifyErr);
    }

    return success({ sale }, 201);
  } catch (e) {
    console.error("[API] sales POST error:", e);
    return error("Failed to create sale", 500);
  }
}
