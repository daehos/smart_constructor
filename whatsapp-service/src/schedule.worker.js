import mongoose from "mongoose";
import { Worker } from "bullmq";
import { createScheduleSchema } from "@smart-constructor/contracts/schedule";
import {
  JOB_SEND_WHATSAPP,
  JOB_SEND_WHATSAPP_IMMEDIATE,
  sendWhatsappImmediatePayload,
} from "./constants.js";
import * as constants from "./constants.js";
import { workerRedisClient } from "./redis.config.js";

const Schedule =
  mongoose.models.Schedule ?? mongoose.model("Schedule", createScheduleSchema(mongoose));

let _whatsappClient = null;

async function processSchedule(job) {
  const { scheduleId } = job.data;

  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    throw new Error(`Schedule ${scheduleId} not found`);
  }

  if (schedule.status === "cancelled" || schedule.status === "sent") {
    console.info(`[wa-worker] Skipping ${scheduleId}: status=${schedule.status}`);
    return;
  }

  if (!_whatsappClient) {
    throw new Error("WhatsApp client not ready");
  }

  await _whatsappClient.sendText(schedule.to, schedule.body);

  schedule.lastSentAt = new Date();
  schedule.lastError = null;
  schedule.attempts += 1;

  if (schedule.kind === "oneshot") {
    schedule.status = "sent";
  }

  await schedule.save();
}

async function processImmediateSend(job) {
  const parsed = sendWhatsappImmediatePayload.safeParse(job.data);
  if (!parsed.success) {
    throw new Error(`Invalid immediate send payload: ${parsed.error.message}`);
  }

  if (!_whatsappClient) {
    throw new Error("WhatsApp client not ready");
  }

  const { to, body } = parsed.data;
  await _whatsappClient.sendText(to, body);
  console.info(`[wa-worker] Immediate send completed → ${to}`);
}

export let scheduleWorker;

export function startScheduleWorker(whatsappClient) {
  _whatsappClient = whatsappClient;

  scheduleWorker = new Worker(
    constants.QUEUES.SCHEDULED_WHATSAPP,
    async (job) => {
      switch (job.name) {
        case JOB_SEND_WHATSAPP:
          await processSchedule(job);
          break;
        case JOB_SEND_WHATSAPP_IMMEDIATE:
          await processImmediateSend(job);
          break;
        default:
          throw new Error(`Unknown job: ${job.name}`);
      }
    },
    {
      connection: workerRedisClient,
      concurrency: constants.JOBS.WHATSAPP_CONCURRENCY,
    },
  );

  scheduleWorker.on("completed", (job) => {
    console.info(`[wa-worker] ${job?.name} ${job?.id} completed`);
  });

  scheduleWorker.on("failed", async (job, err) => {
    console.error(`[wa-worker] ${job?.name} ${job?.id} failed: ${err?.message}`);

    if (!job || job.attemptsMade < (job.opts?.attempts ?? 3)) {
      return;
    }

    const scheduleId = job.data?.scheduleId;
    if (!scheduleId) {
      return;
    }

    try {
      const schedule = await Schedule.findById(scheduleId);
      if (schedule && schedule.kind === "oneshot") {
        schedule.status = "failed";
        schedule.lastError = err?.message ?? "Unknown error";
        await schedule.save();
      } else if (schedule) {
        schedule.lastError = err?.message ?? "Unknown error";
        schedule.attempts += 1;
        await schedule.save();
      }
    } catch (updateErr) {
      console.error("[wa-worker] Failed to update schedule on failure:", updateErr?.message);
    }
  });

  scheduleWorker.on("error", (err) => {
    console.error("[wa-worker] Worker error:", err);
  });

  console.info("[wa-worker] Schedule worker started (concurrency 1)");
}
