import { createClient } from "redis";

const redis = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

redis.on("error", (err) => console.log("Redis Client Error", err));

await redis.connect();

await redis.set("foo", "HIDUP JOKOWI");
const result = await redis.get("foo");
console.log(result); // >>> bar
export default redis;
