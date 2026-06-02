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

  /** Gmail (or SMTP-compatible) credentials for OTP emails; leave empty in dev if unused */
  EMAIL_USER: z.string().default(""),
  EMAIL_PASSWORD: z.string().default(""),

  MINIO_ENDPOINT: z.string().min(1).default("127.0.0.1"),
  MINIO_PORT: z.coerce.number().int().min(1).max(65535).default(9000),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET_RECEIPTS: z.string().min(1).default("receipts"),
  MINIO_USE_SSL: z
    .string()
    .transform((v) => v === "true")
    .default("false"),

  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),

  RECEIPT_MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5242880),

  WHATSAPP_AUTH_DIR: z.string().min(1).default("./wa-auth"),
  WHATSAPP_DEFAULT_TZ: z.string().min(1).default("Asia/Jakarta"),
  // Jittered pause (ms) between successive sends to appear more human-like.
  WHATSAPP_SEND_DELAY_MS: z.coerce.number().int().min(0).default(1500),
  WHATSAPP_QR_TTL_SECONDS: z.coerce.number().int().positive().default(60),

  /** IANA zone for attendance "today" and calendar weekday math (e.g. Asia/Jakarta). */
  ATTENDANCE_TIME_ZONE: z.string().min(1).default("Asia/Jakarta"),
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

  email: {
    user: parsed.data.EMAIL_USER.trim(),
    password: parsed.data.EMAIL_PASSWORD.trim(),
  },

  minio: {
    endpoint: parsed.data.MINIO_ENDPOINT,
    port: parsed.data.MINIO_PORT,
    accessKey: parsed.data.MINIO_ACCESS_KEY,
    secretKey: parsed.data.MINIO_SECRET_KEY,
    bucketReceipts: parsed.data.MINIO_BUCKET_RECEIPTS,
    useSSL: parsed.data.MINIO_USE_SSL,
  },

  gemini: {
    apiKey: parsed.data.GEMINI_API_KEY.trim(),
    model: parsed.data.GEMINI_MODEL.trim(),
  },

  receipt: {
    maxUploadBytes: parsed.data.RECEIPT_MAX_UPLOAD_BYTES,
  },

  whatsapp: {
    authDir: parsed.data.WHATSAPP_AUTH_DIR,
    defaultTz: parsed.data.WHATSAPP_DEFAULT_TZ,
    sendDelayMs: parsed.data.WHATSAPP_SEND_DELAY_MS,
    qrTtlSeconds: parsed.data.WHATSAPP_QR_TTL_SECONDS,
  },

  attendance: {
    timeZone: parsed.data.ATTENDANCE_TIME_ZONE,
  },
});
