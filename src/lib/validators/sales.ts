import { z } from "zod";

export const createSaleSchema = z.object({
  batchId: z.string().uuid(),
  ticketNumber: z.number().int().min(0),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number"),
  notes: z.string().max(500).optional(),
  offlineId: z.string().max(50).optional(),
});
