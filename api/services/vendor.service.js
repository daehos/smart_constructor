import { z } from "zod";
import { BadRequestError, NotFoundError, ValidationError } from "../errors/index.js";
import VendorAudit from "../models/vendor-audit.model.js";
import Vendor from "../models/vendor.model.js";
import { logActivity } from "./activity-log.service.js";
import {
  createVendorValidation,
  listVendorValidation,
  updateVendorValidation,
} from "../validations/vendor.validation.js";

function buildCategoryPrefix(kategori) {
  return kategori
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3)
    .padEnd(3, "X");
}

async function generateVendorCode(kategoriSpesialisasi) {
  const prefix = buildCategoryPrefix(kategoriSpesialisasi);
  const count = await Vendor.countDocuments({
    vendorCode: { $regex: `^VEND-${prefix}-` },
  });
  const seq = String(count + 1).padStart(3, "0");
  return `VEND-${prefix}-${seq}`;
}

async function writeAudit({ vendorId, action, before, after, userId }) {
  await VendorAudit.create({
    vendor: vendorId,
    action,
    changes: { before: before ?? null, after: after ?? null },
    changedBy: userId,
  });
}

export default class VendorService {
  static async list(query) {
    const parsed = listVendorValidation.safeParse(query);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { q, kategoriSpesialisasi, page, limit } = parsed.data;

    const filter = { deletedAt: null };

    if (q) {
      filter.$or = [
        { namaBrand: { $regex: q, $options: "i" } },
        { namaPerusahaan: { $regex: q, $options: "i" } },
      ];
    }

    if (kategoriSpesialisasi) {
      filter.kategoriSpesialisasi = { $regex: kategoriSpesialisasi, $options: "i" };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Vendor.find(filter)
        .select("vendorCode namaBrand namaPerusahaan kategoriSpesialisasi subKategori email alamatPerusahaan photoUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vendor.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  static async getById(id) {
    const vendor = await Vendor.findOne({ _id: id, deletedAt: null })
      .populate("riwayatHargaMaterial.material", "nama kategori satuan")
      .populate("riwayatHargaMaterial.proyek", "nama lokasi");

    if (!vendor) {
      throw new NotFoundError({ details: "Vendor tidak ditemukan" });
    }

    return vendor;
  }

  static async create(body, userId) {
    const parsed = createVendorValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const data = parsed.data;
    const vendorCode = await generateVendorCode(data.kategoriSpesialisasi);

    const vendor = await Vendor.create({ ...data, vendorCode });

    await writeAudit({
      vendorId: vendor._id,
      action: "CREATE",
      before: null,
      after: vendor.toObject(),
      userId,
    });

    logActivity({ actorId: userId, action: "VENDOR_CREATE", resource: "Vendor", resourceId: vendor._id, metadata: { vendorCode } });

    return vendor;
  }

  static async update(id, body, userId) {
    const parsed = updateVendorValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const existing = await Vendor.findOne({ _id: id, deletedAt: null });
    if (!existing) {
      throw new NotFoundError({ details: "Vendor tidak ditemukan" });
    }

    const before = existing.toObject();
    Object.assign(existing, parsed.data);
    await existing.save();

    await writeAudit({
      vendorId: existing._id,
      action: "UPDATE",
      before,
      after: existing.toObject(),
      userId,
    });

    logActivity({ actorId: userId, action: "VENDOR_UPDATE", resource: "Vendor", resourceId: existing._id });

    return existing;
  }

  static async delete(id, userId) {
    const vendor = await Vendor.findOne({ _id: id, deletedAt: null });
    if (!vendor) {
      throw new NotFoundError({ details: "Vendor tidak ditemukan" });
    }

    const before = vendor.toObject();
    vendor.deletedAt = new Date();
    await vendor.save();

    await writeAudit({
      vendorId: vendor._id,
      action: "DELETE",
      before,
      after: null,
      userId,
    });

    logActivity({ actorId: userId, action: "VENDOR_DELETE", resource: "Vendor", resourceId: vendor._id });

    return { message: "Data berhasil dihapus" };
  }

  static async getMaterialPriceHistory(id, query = {}) {
    const vendor = await Vendor.findOne({ _id: id, deletedAt: null })
      .populate("riwayatHargaMaterial.material", "nama kategori satuan")
      .populate("riwayatHargaMaterial.proyek", "nama lokasi")
      .select("riwayatHargaMaterial namaBrand");

    if (!vendor) {
      throw new NotFoundError({ details: "Vendor tidak ditemukan" });
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;
    const all = vendor.riwayatHargaMaterial ?? [];
    const data = all.slice(skip, skip + limit);

    return { data, total: all.length, page, limit };
  }

  static async getAuditHistory(id, query = {}) {
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      throw new NotFoundError({ details: "Vendor tidak ditemukan" });
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      VendorAudit.find({ vendor: id })
        .populate("changedBy", "nama email")
        .sort({ changedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      VendorAudit.countDocuments({ vendor: id }),
    ]);

    return { data, total, page, limit };
  }

  static async addMaterialPrice(id, body, userId) {
    const vendor = await Vendor.findOne({ _id: id, deletedAt: null });
    if (!vendor) {
      throw new NotFoundError({ details: "Vendor tidak ditemukan" });
    }

    const before = vendor.toObject();
    vendor.riwayatHargaMaterial.push(body);
    await vendor.save();

    await writeAudit({
      vendorId: vendor._id,
      action: "UPDATE",
      before,
      after: vendor.toObject(),
      userId,
    });

    return vendor.riwayatHargaMaterial[vendor.riwayatHargaMaterial.length - 1];
  }
}
