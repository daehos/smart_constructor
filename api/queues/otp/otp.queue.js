import { Queue } from "bullmq";
import { defaultRedisClient } from "../../configs/redis.config.js";
import constants from "../../constants/index.js";

export const otpQueue = new Queue(constants.QUEUES.OTP, {
  connection: defaultRedisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
