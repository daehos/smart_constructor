import { Worker } from "bullmq";
import { getReceiptObjectBuffer } from "../../configs/minio.config.js";
import { workerRedisClient } from "../../configs/redis.config.js";
import constants from "../../constants/index.js";
import Receipt from "../../models/receipt.model.js";
import { extractReceipt } from "../../services/ocr/receipt-ocr.service.js";

async function processReceipt(job) {
  const { receiptId } = job.data;

  const receipt = await Receipt.findById(receiptId);
  if (!receipt) {
    throw new Error(`Receipt ${receiptId} not found`);
  }

  receipt.status = "processing";
  await receipt.save();

  const imageBuffer = await getReceiptObjectBuffer(receipt.objectKey);
  const parsed = await extractReceipt(imageBuffer, receipt.mimeType);

  receipt.parsed = parsed;
  receipt.status = "done";
  receipt.error = null;
  await receipt.save();
}

export const receiptWorker = new Worker(
  constants.QUEUES.RECEIPT_OCR,
  async (job) => {
    switch (job.name) {
      case constants.JOBS.PROCESS_RECEIPT:
        await processReceipt(job);
        break;
      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  },
  {
    connection: workerRedisClient,
    concurrency: constants.JOBS.RECEIPT_OCR_CONCURRENCY,
  },
);

receiptWorker.on("completed", (job) => {
  console.info(`[receipt-ocr] ${job?.name} ${job?.id} completed`);
});

receiptWorker.on("failed", async (job, err) => {
  console.error(`[receipt-ocr] ${job?.name} ${job?.id} failed: ${err?.message}`);

  if (job && job.attemptsMade >= (job.opts?.attempts ?? 2)) {
    try {
      await Receipt.findByIdAndUpdate(job.data?.receiptId, {
        status: "failed",
        error: err?.message ?? "Unknown error",
      });
    } catch (updateErr) {
      console.error("[receipt-ocr] Failed to mark receipt as failed:", updateErr?.message);
    }
  }
});

receiptWorker.on("error", (err) => {
  console.error("[receipt-ocr] Worker error:", err);
});

export function startReceiptWorker() {
  console.info("[receipt-ocr] Worker started (concurrency 1)");
}
