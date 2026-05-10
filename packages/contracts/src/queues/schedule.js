import { z } from "zod";

/** E.164 digits without leading + (same rule as schedule API), e.g. 6281234567890 */
const e164Digits = /^[1-9]\d{6,14}$/;

export const QUEUE_SCHEDULED_WHATSAPP = "scheduled-whatsapp";
export const JOB_SEND_WHATSAPP = "send-whatsapp";
/** Fire-and-forget send with `{ to, body }` — no Schedule document. */
export const JOB_SEND_WHATSAPP_IMMEDIATE = "send-whatsapp-immediate";
export const WHATSAPP_CONCURRENCY = 1;

export const sendWhatsappPayload = z.object({
  scheduleId: z.string().min(1),
});

export const sendWhatsappImmediatePayload = z.object({
  to: z.string().regex(e164Digits, "Must be E.164 digits without leading +"),
  body: z.string().min(1).max(4096),
});
