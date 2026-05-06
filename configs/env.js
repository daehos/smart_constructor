import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().min(1).max(65535).default(3000),
  API_VERSION: z.string().min(1),

  MONGODB_URI: z.string().min(1),

  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_USERNAME: z.string().min(1),
  REDIS_PASSWORD: z.string(),

  JWT_SECRET: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables");
  console.error(z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const config = Object.freeze({
  app: {
    env: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    apiVersion: parsed.data.API_VERSION,
  },

  mongodb: {
    uri: parsed.data.MONGODB_URI,
  },

  redis: {
    host: parsed.data.REDIS_HOST,
    port: parsed.data.REDIS_PORT,
    username: parsed.data.REDIS_USERNAME,
    password: parsed.data.REDIS_PASSWORD,
  },

  jwt: {
    secret: parsed.data.JWT_SECRET,
  },
});
