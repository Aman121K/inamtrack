import { z } from "zod";

export const createBatchSchema = z
  .object({
    lotteryName: z.string().min(1).max(200),
    series: z
      .string()
      .length(1)
      .regex(/^[A-Z]$/, "Series must be A-Z"),
    startNumber: z.number().int().min(0),
    endNumber: z.number().int().min(0),
    pricePerTicket: z.number().positive(),
    drawDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date format: YYYY-MM-DD"),
  })
  .refine((data) => data.endNumber >= data.startNumber, {
    message: "End number must be >= start number",
    path: ["endNumber"],
  });
