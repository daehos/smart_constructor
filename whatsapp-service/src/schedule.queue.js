import { Queue } from "bullmq";
import * as constants from "./constants.js";
import { defaultRedisClient } from "./redis.config.js";

export const scheduleQueue = new Queue(constants.QUEUES.SCHEDULED_WHATSAPP, {
  connection: defaultRedisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
