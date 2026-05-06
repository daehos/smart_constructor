import { z } from "zod";

const componentSchema = z.object({
  name: z.string().min(1, "Nama komponen wajib diisi").trim(),
  type: z.enum(["earning", "deduction"], {
    errorMap: () => ({ message: "Tipe harus 'earning' atau 'deduction'" }),
  }),
  amount: z.number({ required_error: "Jumlah wajib diisi" }).min(0, "Jumlah tidak boleh negatif"),
});

export const createPayrollValidation = z.object({
  user: z.string({ required_error: "User wajib diisi" }),
  period: z.object({
    year: z.number({ required_error: "Tahun wajib diisi" }).int().min(2000),
    month: z.number({ required_error: "Bulan wajib diisi" }).int().min(1).max(12),
  }),
  gajiPokok: z.number({ required_error: "Gaji pokok wajib diisi" }).min(0),
  components: z.array(componentSchema).default([]),
});

export const updatePayrollValidation = createPayrollValidation
  .omit({ user: true, period: true })
  .partial();

export const listPayrollValidation = z.object({
  user: z.string().optional(),
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Format period harus YYYY-MM")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
