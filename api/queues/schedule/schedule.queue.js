import { Queue } from "bullmq";
import { defaultRedisClient } from "../../configs/redis.config.js";
import constants from "../../constants/index.js";

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
