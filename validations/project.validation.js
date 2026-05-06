import { z } from "zod";

export const createProjectValidation = z.object({
  nama: z.string({ required_error: "Nama proyek wajib diisi" }).min(1, "Nama proyek wajib diisi").trim(),
  lokasi: z.string().trim().optional().default(""),
});

export const updateProjectValidation = createProjectValidation.partial();

export const listProjectValidation = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
