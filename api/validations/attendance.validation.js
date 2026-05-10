import { z } from "zod";

export const clockEventValidation = z.object({
  lat: z.number({ required_error: "Latitude wajib diisi" }),
  lng: z.number({ required_error: "Longitude wajib diisi" }),
});

export const listAttendanceValidation = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const calendarValidation = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM")
    .optional(),
});
