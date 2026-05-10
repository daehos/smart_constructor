import Redis from "ioredis";
import { config } from "./env.js";

export const defaultRedisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  username: config.redis.username,
  password: config.redis.password,

  maxRetriesPerRequest: null,
});

export const workerRedisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  username: config.redis.username,
  password: config.redis.password,

  maxRetriesPerRequest: null,
});

export async function initRedis(client, name = "default") {
  client.on("connect", () => {
    console.info(`connected to ${name} redis`);
  });

  client.on("error", (err) => {
    console.error(`failed connecting to ${name} redis`, err);
  });

  await checkRedisConnection(client, name);

  return client;
}

export async function checkRedisConnection(client, name) {
  try {
    const pong = await client.ping();

    if (pong !== "PONG") {
      throw new Error(`invalid ${name} redis ping response`);
    }
  } catch (err) {
    console.error(`failed connecting to ${name} redis`, err);

    process.exit(1);
  }
}
