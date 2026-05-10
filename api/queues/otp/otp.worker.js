import { Worker } from "bullmq";

import { workerRedisClient } from "../../configs/redis.config.js";
import constants from "../../constants/index.js";
import { emailService } from "../../services/email.service.js";

export const otpWorker = new Worker(
  constants.QUEUES.OTP,
  async (job) => {
    switch (job.name) {
      case constants.JOBS.SEND_OTP:
        await emailService.sendOTPEmail(job.data.email, job.data.otp);
        break;

      default:
        throw new Error(`unknown job: ${job.name}`);
    }
  },
  {
    connection: workerRedisClient,
    concurrency: constants.JOBS.MAX_CONCURRENCY,
  },
);

otpWorker.on("completed", (job) => {
  console.info(`${job?.name} ${job?.id} completed`);
});

otpWorker.on("failed", (job, err) => {
  console.error(`${job?.name} ${job?.id} failed`, err);
});

otpWorker.on("error", (err) => {
  console.error(`${constants.JOBS.SEND_OTP} worker error`, err);
});

export function startSendOTPWorker() {
  console.info(`${constants.JOBS.SEND_OTP} worker started`);
}
