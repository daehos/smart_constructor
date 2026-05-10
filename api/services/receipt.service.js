import { randomUUID } from "crypto";
import { z } from "zod";
import { putReceiptObject } from "../configs/minio.config.js";
import constants from "../constants/index.js";
import { BadRequestError, NotFoundError, ValidationError } from "../errors/index.js";
import Receipt from "../models/receipt.model.js";
import Vendor from "../models/vendor.model.js";
import { receiptQueue } from "../queues/receipt/receipt.queue.js";
import { logActivity } from "./activity-log.service.js";
import OrderService from "./order.service.js";
import {
  confirmReceiptValidation,
  listReceiptValidation,
} from "../validations/receipt.validation.js";

const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default class ReceiptService {
  static async create(file, userId) {
    if (!file) {
      throw new BadRequestError({ message: "No file uploaded. Field name must be 'receipt'." });
    }

    const ext = MIME_TO_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestError({ message: "Unsupported image type." });
    }

    const objectKey = `receipts/${userId}/${randomUUID()}.${ext}`;
    await putReceiptObject(file.buffer, objectKey, file.mimetype);

    const receipt = await Receipt.create({
      user: userId,
      objectKey,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      status: "queued",
    });

    await receiptQueue.add(constants.JOBS.PROCESS_RECEIPT, { receiptId: receipt._id.toString() });

    return receipt;
  }

  static async list(query, userId) {
    const parsed = listReceiptValidation.safeParse(query);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { page, limit, status } = parsed.data;
    const filter = { user: userId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Receipt.find(filter)
        .select("-rawOcr")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Receipt.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  static async getById(id, userId) {
    const receipt = await Receipt.findOne({ _id: id, user: userId }).lean();
    if (!receipt) {
      throw new NotFoundError({ details: "Receipt not found" });
    }
    return receipt;
  }

  static async confirm(id, userId, body) {
    const parsed = confirmReceiptValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const receipt = await Receipt.findOne({ _id: id, user: userId });
    if (!receipt) {
      throw new NotFoundError({ details: "Receipt not found" });
    }

    if (receipt.status !== "done") {
      throw new BadRequestError({
        message: `Cannot confirm a receipt with status '${receipt.status}'. Wait until OCR is done.`,
      });
    }

    if (receipt.linkedOrder) {
      throw new BadRequestError({ message: "This receipt has already been confirmed." });
    }

    const vendor = await Vendor.findOne({ _id: parsed.data.vendor, deletedAt: null });
    if (!vendor) {
      throw new NotFoundError({ details: "Vendor not found" });
    }

    const itemsSource = parsed.data.items?.length
      ? parsed.data.items
      : receipt.parsed?.items ?? [];

    if (!itemsSource.length) {
      throw new BadRequestError({ message: "No items available to create an order. Provide items manually." });
    }

    const orderItems = itemsSource.map((item) => ({
      namaProduk: item.name ?? item.namaProduk,
      kategoriMaterial: "",
      subKategoriMaterial: "",
      jumlah: item.qty ?? item.jumlah ?? 1,
      hargaSatuan: item.price ?? item.hargaSatuan ?? 0,
      subtotal: item.subtotal ?? (item.price ?? item.hargaSatuan ?? 0) * (item.qty ?? item.jumlah ?? 1),
    }));

    const order = await OrderService.createInternal({
      vendorId: parsed.data.vendor,
      buyerId: userId,
      items: orderItems,
      pesan: parsed.data.pesan,
    });

    receipt.linkedOrder = order._id;
    await receipt.save();

    logActivity({
      actorId: userId,
      action: "RECEIPT_CONFIRM",
      resource: "Receipt",
      resourceId: receipt._id,
      metadata: { orderNumber: order.orderNumber },
    });

    return { receipt, order };
  }
}
