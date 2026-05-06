import { randomInt } from "crypto";
import { z } from "zod";
import { BadRequestError, NotFoundError, ValidationError } from "../errors/index.js";
import Order from "../models/order.model.js";
import Vendor from "../models/vendor.model.js";
import { logActivity } from "./activity-log.service.js";
import { createOrderValidation, listOrderValidation } from "../validations/order.validation.js";

function generateOrderNumber() {
  const digits = randomInt(1_000_000_000, 9_999_999_999);
  return `IVR/${digits}`;
}

function computeItemSubtotals(items) {
  return items.map((item) => ({
    ...item,
    subtotal: item.subtotal ?? item.hargaSatuan * item.jumlah,
  }));
}

export default class OrderService {
  static async create(body, buyerId) {
    const parsed = createOrderValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { vendor: vendorId, items, pesan } = parsed.data;

    const vendor = await Vendor.findOne({ _id: vendorId, deletedAt: null });
    if (!vendor) {
      throw new NotFoundError({ details: "Vendor tidak ditemukan" });
    }

    const processedItems = computeItemSubtotals(items);
    const orderNumber = generateOrderNumber();

    const totalDibayar = processedItems.reduce((sum, i) => sum + i.subtotal, 0);

    const order = await Order.create({
      orderNumber,
      vendor: vendorId,
      buyer: buyerId,
      items: processedItems,
      pesan,
      payment: { totalDibayar },
    });

    logActivity({ actorId: buyerId, action: "ORDER_CREATE", resource: "Order", resourceId: order._id, metadata: { orderNumber } });

    return order;
  }

  static async list(query, buyerId) {
    const parsed = listOrderValidation.safeParse(query);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { status, q, month, page, limit } = parsed.data;

    const filter = { buyer: buyerId };

    if (status && status !== "semua") {
      filter.status = status;
    }

    if (q) {
      filter.$or = [
        { orderNumber: { $regex: q, $options: "i" } },
        { "items.namaProduk": { $regex: q, $options: "i" } },
      ];
    }

    if (month) {
      const [year, mon] = month.split("-").map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Order.find(filter)
        .populate("vendor", "namaBrand kategoriSpesialisasi")
        .select("orderNumber vendor items status payment.totalDibayar createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  static async getById(id, buyerId) {
    const order = await Order.findOne({ _id: id, buyer: buyerId })
      .populate("vendor", "namaBrand namaPerusahaan kategoriSpesialisasi telepon alamatPerusahaan")
      .populate("items.material", "nama kategori satuan");

    if (!order) {
      throw new NotFoundError({ details: "Pesanan tidak ditemukan" });
    }

    return order;
  }

  static async cancel(id, buyerId) {
    const order = await Order.findOne({ _id: id, buyer: buyerId });
    if (!order) {
      throw new NotFoundError({ details: "Pesanan tidak ditemukan" });
    }

    if (!["dikirim"].includes(order.status)) {
      throw new BadRequestError({ details: `Pesanan dengan status '${order.status}' tidak dapat dibatalkan` });
    }

    order.status = "dibatalkan";
    await order.save();

    logActivity({ actorId: buyerId, action: "ORDER_CANCEL", resource: "Order", resourceId: order._id });

    return order;
  }

  static async return(id, buyerId) {
    const order = await Order.findOne({ _id: id, buyer: buyerId });
    if (!order) {
      throw new NotFoundError({ details: "Pesanan tidak ditemukan" });
    }

    if (order.status !== "selesai") {
      throw new BadRequestError({ details: "Hanya pesanan selesai yang dapat dikembalikan" });
    }

    order.status = "pengembalian";
    await order.save();

    logActivity({ actorId: buyerId, action: "ORDER_RETURN", resource: "Order", resourceId: order._id });

    return order;
  }

  static async repeat(id, buyerId) {
    const original = await Order.findOne({ _id: id, buyer: buyerId });
    if (!original) {
      throw new NotFoundError({ details: "Pesanan tidak ditemukan" });
    }

    const vendor = await Vendor.findOne({ _id: original.vendor, deletedAt: null });
    if (!vendor) {
      throw new BadRequestError({ details: "Vendor tidak tersedia lagi" });
    }

    const orderNumber = generateOrderNumber();
    const items = original.items.map((item) => ({
      material: item.material,
      namaProduk: item.namaProduk,
      kategoriMaterial: item.kategoriMaterial,
      subKategoriMaterial: item.subKategoriMaterial,
      jumlah: item.jumlah,
      hargaSatuan: item.hargaSatuan,
      subtotal: item.subtotal,
    }));

    const totalDibayar = items.reduce((sum, i) => sum + i.subtotal, 0);

    const newOrder = await Order.create({
      orderNumber,
      vendor: original.vendor,
      buyer: buyerId,
      items,
      pesan: original.pesan,
      payment: { totalDibayar },
    });

    logActivity({ actorId: buyerId, action: "ORDER_REPEAT", resource: "Order", resourceId: newOrder._id, metadata: { originalOrderId: id } });

    return newOrder;
  }
}
