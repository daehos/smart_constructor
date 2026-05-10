import { z } from "zod";

const phoneRegex = /^[1-9]\d{6,14}$/;

const cronRegex = /^(\S+\s+){4}\S+$/;

const sharedFields = {
  // E.164 without leading +, e.g. "6281234567890"
  to: z
    .string()
    .regex(phoneRegex, "Must be E.164 digits without leading +, e.g. 6281234567890"),
  body: z.string().min(1).max(4096),
  timezone: z.string().min(1).optional(),
};

const oneshotSchema = z
  .object({
    kind: z.literal("oneshot"),
    scheduledAt: z.string().datetime({ offset: true }),
    ...sharedFields,
  })
  .strip();

const recurringSchema = z
  .object({
    kind: z.literal("recurring"),
    cron: z
      .string()
      .regex(cronRegex, "Must be a valid 5-part cron expression (min hour dom mon dow)"),
    ...sharedFields,
  })
  .strip();

export const createScheduleValidation = z.discriminatedUnion("kind", [
  oneshotSchema,
  recurringSchema,
]);

// For PATCH: all scheduling fields optional, but kind may not change
export const updateScheduleValidation = z
  .object({
    scheduledAt: z.string().datetime({ offset: true }).optional(),
    cron: z
      .string()
      .regex(cronRegex, "Must be a valid 5-part cron expression")
      .optional(),
    body: z.string().min(1).max(4096).optional(),
    timezone: z.string().min(1).optional(),
  })
  .strip();

export const listScheduleValidation = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(["pending", "active", "sent", "cancelled", "failed"])
    .optional(),
  kind: z.enum(["oneshot", "recurring"]).optional(),
});
