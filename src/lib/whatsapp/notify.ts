import { prisma } from "../db";
import { sendWhatsAppMessage } from "./client";
import { getTemplate, NotificationType } from "./templates";

// Store a message to be sent. Always queued first so nothing is lost even if
// WhatsApp is down or the device is offline — the cron can retry failures.
export async function queueNotification(params: {
  agentId: string;
  type: NotificationType;
  recipientPhone: string;
  data: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      agentId: params.agentId,
      type: params.type,
      recipientPhone: params.recipientPhone,
      templateParams: params.data as object,
      status: "queued",
    },
  });
}

// Send a single notification. Looks up the agent (the per-agent mapping) and
// injects their shop/name/phone into the message, then marks sent/failed.
export async function sendNotification(notificationId: string) {
  const n = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!n || n.status === "sent") return { success: false, error: "not sendable" };

  const template = getTemplate(n.type as NotificationType);
  if (!template) {
    await prisma.notification.update({ where: { id: n.id }, data: { status: "failed" } });
    return { success: false, error: `Unknown template: ${n.type}` };
  }

  const agent = await prisma.agent.findUnique({
    where: { id: n.agentId },
    select: { name: true, phone: true, city: true },
  });
  if (!agent) {
    await prisma.notification.update({ where: { id: n.id }, data: { status: "failed" } });
    return { success: false, error: "Agent not found" };
  }

  const data = (n.templateParams as Record<string, unknown>) || {};
  const { params, preview } = template.build({ ...data, agent });

  console.log(`[Notify] ${n.type} → ${n.recipientPhone}\n${preview}`);

  const res = await sendWhatsAppMessage({
    to: n.recipientPhone,
    templateName: template.name,
    templateParams: params,
  });

  await prisma.notification.update({
    where: { id: n.id },
    data: { status: res.success ? "sent" : "failed" },
  });

  return res;
}

// Flush the queue (used by cron and for retrying failed sends).
export async function processQueuedNotifications(limit = 200) {
  const queued = await prisma.notification.findMany({
    where: { status: { in: ["queued", "failed"] } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let sent = 0;
  let failed = 0;
  for (const n of queued) {
    const res = await sendNotification(n.id);
    if (res?.success) sent++;
    else failed++;
  }

  console.log(`[Notify] Flushed queue: ${sent} sent, ${failed} failed`);
  return { processed: queued.length, sent, failed };
}
