import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { authenticate } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";

interface SyncOperation {
  id: string;
  type: "sale" | "customer" | "batch";
  action: "create" | "update";
  data: Record<string, unknown>;
  timestamp: string;
}

export async function POST(req: NextRequest) {
  console.log("[API] POST /api/sync");

  try {
    const authResult = await authenticate(req);
    if (authResult instanceof Response) return authResult;

    const { operations } = (await req.json()) as { operations: SyncOperation[] };

    if (!Array.isArray(operations) || operations.length === 0) {
      console.warn("[API] Empty or invalid sync payload");
      return error("No operations to sync", 400);
    }

    if (operations.length > 100) {
      console.warn(`[API] Too many operations: ${operations.length}`);
      return error("Maximum 100 operations per sync", 400);
    }

    console.log(`[API] Syncing ${operations.length} operations for agent: ${authResult.agentId}`);

    const results: { id: string; status: "synced" | "failed" | "skipped"; error?: string }[] = [];

    for (const op of operations) {
      try {
        console.log(`[API] Sync op: ${op.type}/${op.action} (${op.id})`);

        await prisma.syncQueue.upsert({
          where: {
            id: op.id,
          },
          update: {
            status: "pending",
          },
          create: {
            id: op.id,
            agentId: authResult.agentId,
            operationType: `${op.type}_${op.action}`,
            payload: op.data as object,
            status: "pending",
          },
        });

        results.push({ id: op.id, status: "synced" });
      } catch (e) {
        console.error(`[API] Sync op failed (${op.id}):`, (e as Error).message);
        results.push({ id: op.id, status: "failed", error: (e as Error).message });
      }
    }

    const synced = results.filter((r) => r.status === "synced").length;
    const failed = results.filter((r) => r.status === "failed").length;

    console.log(`[API] Sync complete: ${synced} synced, ${failed} failed`);

    return success({ results, summary: { synced, failed } });
  } catch (e) {
    console.error("[API] sync error:", e);
    return error("Sync failed", 500);
  }
}
