import { z } from "zod";

export const createWorkerValidation = z.object({
  nama: z.string({ required_error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").trim(),
  email: z.string().email("Format email tidak valid").toLowerCase().optional().nullable(),
  telepon: z.string().trim().optional().default(""),
  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "Gender harus 'male' atau 'female'" }),
  }),
  tanggalLahir: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Format tanggal lahir tidak valid")
    .optional()
    .nullable(),
  keahlian: z.array(z.string().trim()).default([]),
  alamat: z.string().trim().optional().default(""),
  photoUrl: z.string().url("URL foto tidak valid").optional().nullable(),
});

export const updateWorkerValidation = createWorkerValidation.partial();

export const listWorkerValidation = z.object({
  q: z.string().trim().optional(),
  keahlian: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
