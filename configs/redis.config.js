import { createClient } from "redis";
import { config } from "./env.js";

export const redis = createClient({
  username: config.redis.username,
  password: config.redis.password,
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

redis.on("error", (err) => {
  console.error("redis client error", err);
});

export async function initRedis() {
  try {
    await redis.connect();

    await redis.ping();

    console.info("connected to redis");
  } catch (err) {
    console.error("failed connecting to redis", err);

    process.exit(1);
  }
}
