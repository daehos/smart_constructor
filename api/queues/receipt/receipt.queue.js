import { Queue } from "bullmq";
import { defaultRedisClient } from "../../configs/redis.config.js";
import constants from "../../constants/index.js";

export const receiptQueue = new Queue(constants.QUEUES.RECEIPT_OCR, {
  connection: defaultRedisClient,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
