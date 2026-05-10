import {
  QUEUE_SCHEDULED_WHATSAPP,
  JOB_SEND_WHATSAPP,
  JOB_SEND_WHATSAPP_IMMEDIATE,
  WHATSAPP_CONCURRENCY,
  sendWhatsappPayload,
  sendWhatsappImmediatePayload,
} from "@smart-constructor/contracts/queues";

export {
  QUEUE_SCHEDULED_WHATSAPP,
  JOB_SEND_WHATSAPP,
  JOB_SEND_WHATSAPP_IMMEDIATE,
  WHATSAPP_CONCURRENCY,
  sendWhatsappPayload,
  sendWhatsappImmediatePayload,
};

// Convenience aliases kept for backwards-compat within this service
export const QUEUES = { SCHEDULED_WHATSAPP: QUEUE_SCHEDULED_WHATSAPP };
export const JOBS = {
  SEND_WHATSAPP: JOB_SEND_WHATSAPP,
  SEND_WHATSAPP_IMMEDIATE: JOB_SEND_WHATSAPP_IMMEDIATE,
  WHATSAPP_CONCURRENCY,
};
