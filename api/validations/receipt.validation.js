import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectIdSchema = z
  .string()
  .regex(objectIdRegex, "Must be a valid MongoDB ObjectId");

const confirmItemSchema = z.object({
  name: z.string().min(1),
  qty: z.coerce.number().int().min(1).default(1),
  price: z.coerce.number().min(0),
});

export const confirmReceiptValidation = z.object({
  vendor: objectIdSchema,
  items: z.array(confirmItemSchema).optional(),
  pesan: z.string().default(""),
});

export const listReceiptValidation = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["queued", "processing", "done", "failed"]).optional(),
});
