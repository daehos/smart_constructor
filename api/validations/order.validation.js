import { z } from "zod";

const orderItemValidation = z.object({
  material: z.string().optional().nullable(),
  namaProduk: z.string({ required_error: "Nama produk wajib diisi" }).min(1).trim(),
  kategoriMaterial: z.string().trim().optional().default(""),
  subKategoriMaterial: z.string().trim().optional().default(""),
  jumlah: z.number({ required_error: "Jumlah wajib diisi" }).int().min(1),
  hargaSatuan: z.number({ required_error: "Harga satuan wajib diisi" }).min(0),
  subtotal: z.number().min(0).optional(),
});

export const createOrderValidation = z.object({
  vendor: z.string({ required_error: "Vendor wajib diisi" }),
  items: z
    .array(orderItemValidation)
    .min(1, "Minimal 1 item wajib diisi"),
  pesan: z.string().trim().optional().default(""),
});

export const listOrderValidation = z.object({
  status: z
    .enum(["dikirim", "selesai", "dibatalkan", "pengembalian", "semua"])
    .optional()
    .default("semua"),
  q: z.string().trim().optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
