import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Service-local .env (whatsapp-service/.env), then repo-root .env as fallback for local dev
const serviceRoot = join(__dirname, "../../");
dotenv.config({ quiet: true, path: join(serviceRoot, ".env") });
dotenv.config({ quiet: true, path: join(serviceRoot, "../.env") });

const workerEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),

  MONGODB_URI: z.string().min(1),

  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_USERNAME: z.string().min(1),
  REDIS_PASSWORD: z.string(),

  WHATSAPP_AUTH_DIR: z.string().min(1).default("./wa-auth"),
  WHATSAPP_DEFAULT_TZ: z.string().min(1).default("Asia/Jakarta"),
  WHATSAPP_SEND_DELAY_MS: z.coerce.number().int().min(0).default(1500),
  WHATSAPP_QR_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  /** Override Baileys WA Web protocol version: "major,build,revision" e.g. 2,3000,1019707846 */
  WHATSAPP_WA_VERSION: z.string().optional(),
});

const parsed = workerEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[whatsapp-worker] Invalid environment variables");
  console.error(z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

function parseWaVersion(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") return null;
  const parts = String(raw)
    .split(",")
    .map((x) => parseInt(x.trim(), 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    console.warn("[whatsapp-worker] Ignoring invalid WHATSAPP_WA_VERSION (expected three integers):", raw);
    return null;
  }
  return parts;
}

export const config = Object.freeze({
  app: {
    env: parsed.data.NODE_ENV,
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
  whatsapp: {
    authDir: parsed.data.WHATSAPP_AUTH_DIR,
    defaultTz: parsed.data.WHATSAPP_DEFAULT_TZ,
    sendDelayMs: parsed.data.WHATSAPP_SEND_DELAY_MS,
    qrTtlSeconds: parsed.data.WHATSAPP_QR_TTL_SECONDS,
    waVersionOverride: parseWaVersion(parsed.data.WHATSAPP_WA_VERSION),
  },
});
