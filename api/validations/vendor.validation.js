import { z } from "zod";

const materialPriceHistorySchema = z.object({
  material: z.string().optional().nullable(),
  namaMaterial: z.string().min(1, "Nama material wajib diisi").trim(),
  hargaTerakhir: z.number({ required_error: "Harga wajib diisi" }).min(0, "Harga tidak boleh negatif"),
  satuanHarga: z.string().trim().default("/kg"),
  proyek: z.string().optional().nullable(),
  namaProyek: z.string().min(1, "Nama proyek wajib diisi").trim(),
});

export const createVendorValidation = z.object({
  namaBrand: z.string().trim().optional().nullable(),
  telepon: z
    .string({ required_error: "Nomor telepon wajib diisi" })
    .min(7, "Nomor telepon minimal 7 karakter")
    .trim(),
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid")
    .toLowerCase(),
  website: z.string().trim().optional().default(""),
  namaPerusahaan: z.string({ required_error: "Nama perusahaan wajib diisi" }).min(1).trim(),
  alamatPerusahaan: z.string({ required_error: "Alamat perusahaan wajib diisi" }).min(1).trim(),
  kategoriSpesialisasi: z.string({ required_error: "Kategori spesialisasi wajib diisi" }).min(1).trim(),
  subKategori: z.array(z.string().trim()).default([]),
  photoUrl: z.string().url("URL foto tidak valid").optional().nullable(),
  profilDokumenUrl: z.string().url("URL dokumen tidak valid").optional().nullable(),
  riwayatHargaMaterial: z.array(materialPriceHistorySchema).default([]),
});

export const updateVendorValidation = createVendorValidation.partial();

export const listVendorValidation = z.object({
  q: z.string().trim().optional(),
  kategoriSpesialisasi: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const addMaterialPriceValidation = materialPriceHistorySchema;
