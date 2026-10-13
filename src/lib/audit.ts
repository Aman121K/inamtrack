import { prisma } from "./db";

export async function logAudit(params: {
  agentId?: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  console.log(`[Audit] ${params.action} ${params.entityType}:${params.entityId} by agent:${params.agentId || "system"}`);

  await prisma.auditLog.create({
    data: {
      agentId: params.agentId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      changes: params.metadata ? (params.metadata as object) : undefined,
    },
  });
}
