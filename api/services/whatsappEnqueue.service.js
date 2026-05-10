import { JOB_SEND_WHATSAPP_IMMEDIATE } from "@smart-constructor/contracts/queues";
import { scheduleQueue } from "../queues/schedule/schedule.queue.js";

/**
 * Enqueues an immediate WhatsApp send on the same queue as scheduled jobs.
 * Higher BullMQ priority so it is picked before delayed/repeat jobs when backed up.
 */
export async function enqueueWhatsappImmediate({ to, body }) {
  await scheduleQueue.add(
    JOB_SEND_WHATSAPP_IMMEDIATE,
    { to, body },
    {
      priority: 10,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}
