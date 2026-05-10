import mongoose from "mongoose";
import { createScheduleSchema } from "@smart-constructor/contracts/schedule";
import { JOB_SEND_WHATSAPP } from "@smart-constructor/contracts/queues";
import { initMongoDB } from "./mongoose.config.js";
import { defaultRedisClient, initRedis, workerRedisClient } from "./redis.config.js";
import { scheduleQueue } from "./schedule.queue.js";
import { startScheduleWorker } from "./schedule.worker.js";
import { whatsappClient } from "./baileys.client.js";

// Register the Schedule model using this service's own mongoose instance.
// schedule.worker.js (imported below) may also reference it — guard against double registration.
const Schedule =
  mongoose.models.Schedule ?? mongoose.model("Schedule", createScheduleSchema(mongoose));

const RECOVERY_GRACE_MS = 5 * 60 * 1000;

async function reconcile() {
  const now = new Date();
  const graceBoundary = new Date(now.getTime() - RECOVERY_GRACE_MS);

  const overdueOneshots = await Schedule.find({
    kind: "oneshot",
    status: "pending",
    scheduledAt: { $lt: now },
    createdAt: { $gt: graceBoundary },
  });

  for (const schedule of overdueOneshots) {
    console.warn(`[wa-worker] Re-enqueuing overdue oneshot: ${schedule._id}`);
    try {
      const job = await scheduleQueue.add(
        JOB_SEND_WHATSAPP,
        { scheduleId: schedule._id.toString() },
        { jobId: `recovery-${schedule._id}` },
      );
      schedule.bullJobId = job.id;
      await schedule.save();
    } catch (err) {
      console.error(`[wa-worker] Failed to re-enqueue ${schedule._id}:`, err?.message);
    }
  }

  const activeRecurring = await Schedule.find({
    kind: "recurring",
    status: "active",
    bullRepeatKey: { $ne: null },
  });

  if (activeRecurring.length > 0) {
    let existingRepeatKeys;
    try {
      const repeatables = await scheduleQueue.getRepeatableJobs();
      existingRepeatKeys = new Set(repeatables.map((r) => r.key));
    } catch (err) {
      console.error("[wa-worker] Failed to fetch repeatable jobs:", err?.message);
      return;
    }

    for (const schedule of activeRecurring) {
      if (!existingRepeatKeys.has(schedule.bullRepeatKey)) {
        console.warn(`[wa-worker] Recreating missing repeatable for: ${schedule._id}`);
        try {
          const job = await scheduleQueue.add(
            JOB_SEND_WHATSAPP,
            { scheduleId: schedule._id.toString() },
            {
              repeat: { pattern: schedule.cron, tz: schedule.timezone },
              jobId: `recovery-${schedule._id}`,
            },
          );
          schedule.bullRepeatKey = job.repeatJobKey ?? schedule.bullRepeatKey;
          await schedule.save();
        } catch (err) {
          console.error(`[wa-worker] Failed to recreate repeatable ${schedule._id}:`, err?.message);
        }
      }
    }
  }

  if (overdueOneshots.length + activeRecurring.length > 0) {
    console.info(
      `[wa-worker] Reconcile complete — oneshots: ${overdueOneshots.length}, recurring checked: ${activeRecurring.length}`,
    );
  }
}

async function bootstrap() {
  await Promise.all([
    initMongoDB(),
    initRedis(defaultRedisClient, "app"),
    initRedis(workerRedisClient, "worker"),
  ]);

  await reconcile();

  await whatsappClient.init();

  startScheduleWorker(whatsappClient);

  console.info("[wa-worker] WhatsApp worker is running");
}

bootstrap();
