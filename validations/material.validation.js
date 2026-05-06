import { z } from "zod";

export const createMaterialValidation = z.object({
  nama: z.string({ required_error: "Nama material wajib diisi" }).min(1, "Nama material wajib diisi").trim(),
  kategori: z.string({ required_error: "Kategori wajib diisi" }).min(1, "Kategori wajib diisi").trim(),
  subKategori: z.string().trim().optional().default(""),
  satuan: z.string().trim().optional().default("kg"),
});

export const updateMaterialValidation = createMaterialValidation.partial();

export const listMaterialValidation = z.object({
  q: z.string().trim().optional(),
  kategori: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const priceComparisonValidation = z.object({
  material: z.string().trim().optional(),
  kategoriSpesialisasi: z.string().trim().optional(),
  sort: z.enum(["price_asc", "price_desc"]).default("price_asc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
