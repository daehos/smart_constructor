import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { config } from "./env.js";
import { Readable } from "stream";

export const s3Client = new S3Client({
  endpoint: `${config.minio.useSSL ? "https" : "http"}://${config.minio.endpoint}:${config.minio.port}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: config.minio.accessKey,
    secretAccessKey: config.minio.secretKey,
  },
  forcePathStyle: true,
});

/**
 * Upload a buffer to MinIO.
 * @param {Buffer} buffer
 * @param {string} key  - object key, e.g. "receipts/userId/uuid.jpg"
 * @param {string} mimeType
 */
export async function putReceiptObject(buffer, key, mimeType) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.minio.bucketReceipts,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }),
  );
}

/**
 * Generate a presigned GET URL valid for `ttlSeconds`.
 * @param {string} key
 * @param {number} [ttlSeconds=300]
 * @returns {Promise<string>}
 */
export async function getReceiptPresignedUrl(key, ttlSeconds = 300) {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: config.minio.bucketReceipts,
      Key: key,
    }),
    { expiresIn: ttlSeconds },
  );
}

async function streamToBuffer(body) {
  // AWS SDK v3 returns a Node.js Readable stream in Node runtimes.
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body.transformToByteArray === "function") {
    const arr = await body.transformToByteArray();
    return Buffer.from(arr);
  }
  if (body instanceof Readable || typeof body.on === "function") {
    const chunks = [];
    for await (const chunk of body) chunks.push(chunk);
    return Buffer.concat(chunks.map((c) => (Buffer.isBuffer(c) ? c : Buffer.from(c))));
  }
  throw new Error("Unsupported GetObject body type");
}

/**
 * Fetch a receipt object from MinIO as a Buffer.
 * @param {string} key
 * @returns {Promise<Buffer>}
 */
export async function getReceiptObjectBuffer(key) {
  const resp = await s3Client.send(
    new GetObjectCommand({
      Bucket: config.minio.bucketReceipts,
      Key: key,
    }),
  );
  return streamToBuffer(resp.Body);
}
