import { z } from "zod";
import { NotFoundError, ValidationError } from "../errors/index.js";
import Material from "../models/material.model.js";
import Vendor from "../models/vendor.model.js";
import {
  createMaterialValidation,
  listMaterialValidation,
  priceComparisonValidation,
  updateMaterialValidation,
} from "../validations/material.validation.js";

export default class MaterialService {
  static async list(query) {
    const parsed = listMaterialValidation.safeParse(query);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { q, kategori, page, limit } = parsed.data;
    const filter = { deletedAt: null };

    if (q) {
      filter.nama = { $regex: q, $options: "i" };
    }
    if (kategori) {
      filter.kategori = { $regex: kategori, $options: "i" };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Material.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Material.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  static async getById(id) {
    const material = await Material.findOne({ _id: id, deletedAt: null });
    if (!material) {
      throw new NotFoundError({ details: "Material tidak ditemukan" });
    }
    return material;
  }

  static async create(body) {
    const parsed = createMaterialValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }
    return Material.create(parsed.data);
  }

  static async update(id, body) {
    const parsed = updateMaterialValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const material = await Material.findOne({ _id: id, deletedAt: null });
    if (!material) {
      throw new NotFoundError({ details: "Material tidak ditemukan" });
    }

    Object.assign(material, parsed.data);
    return material.save();
  }

  static async delete(id) {
    const material = await Material.findOne({ _id: id, deletedAt: null });
    if (!material) {
      throw new NotFoundError({ details: "Material tidak ditemukan" });
    }
    material.deletedAt = new Date();
    await material.save();
    return { message: "Material berhasil dihapus" };
  }

  /**
   * Aggregate vendor price history entries and return a sorted price comparison.
   * Result shape: [{ vendor: { _id, namaBrand, kategoriSpesialisasi }, namaMaterial, hargaTerakhir, satuanHarga, namaProyek }]
   */
  static async priceComparison(query) {
    const parsed = priceComparisonValidation.safeParse(query);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { material, kategoriSpesialisasi, sort, page, limit } = parsed.data;

    const matchVendor = { deletedAt: null };
    if (kategoriSpesialisasi) {
      matchVendor.kategoriSpesialisasi = { $regex: kategoriSpesialisasi, $options: "i" };
    }

    const pipeline = [
      { $match: matchVendor },
      { $unwind: "$riwayatHargaMaterial" },
    ];

    if (material) {
      pipeline.push({
        $match: {
          "riwayatHargaMaterial.namaMaterial": { $regex: material, $options: "i" },
        },
      });
    }

    pipeline.push({
      $project: {
        _id: 0,
        vendor: {
          _id: "$_id",
          namaBrand: "$namaBrand",
          namaPerusahaan: "$namaPerusahaan",
          kategoriSpesialisasi: "$kategoriSpesialisasi",
          telepon: "$telepon",
          alamatPerusahaan: "$alamatPerusahaan",
        },
        namaMaterial: "$riwayatHargaMaterial.namaMaterial",
        hargaTerakhir: "$riwayatHargaMaterial.hargaTerakhir",
        satuanHarga: "$riwayatHargaMaterial.satuanHarga",
        namaProyek: "$riwayatHargaMaterial.namaProyek",
      },
    });

    const sortDir = sort === "price_asc" ? 1 : -1;
    pipeline.push({ $sort: { hargaTerakhir: sortDir } });

    const countPipeline = [...pipeline, { $count: "total" }];
    const dataPipeline = [
      ...pipeline,
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const [countResult, data] = await Promise.all([
      Vendor.aggregate(countPipeline),
      Vendor.aggregate(dataPipeline),
    ]);

    const total = countResult[0]?.total ?? 0;

    return { data, total, page, limit };
  }
}
