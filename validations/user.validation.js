import { z } from "zod";

export const registerValidation = z.object({
  nama: z
    .string({ required_error: "Nama wajib diisi" })
    .min(1, "Nama wajib diisi")
    .trim(),

  email: z
    .string({ required_error: "Email wajib diisi" })
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid (contoh: nama@email.com)")
    .toLowerCase(),

  role: z
    .enum(["hr", "admin_finance", "admin_pengadaan", "owner", "pekerja"], {
      errorMap: () => ({ message: "Role tidak valid" }),
    })
    .optional()
    .default("pekerja"),

  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "Gender harus 'male' atau 'female'" }),
  }),

  phoneNumber: z
    .string({ required_error: "Nomor telepon wajib diisi" })
    .min(7, "Nomor telepon minimal 7 karakter")
    .max(15, "Nomor telepon maksimal 15 karakter")
    .regex(/^\+?[\d\s-]+$/, "Format nomor telepon tidak valid"),

  tanggalLahir: z
    .string({ required_error: "Tanggal lahir wajib diisi" })
    .refine((v) => !Number.isNaN(Date.parse(v)), "Format tanggal lahir tidak valid (contoh: 1988-12-25)"),

  kategoriSpesialisasi: z.string().trim().optional().nullable(),

  password: z
    .string({ required_error: "Kata sandi wajib diisi" })
    .min(8, "Minimal 8 karakter")
    .regex(/[0-9!@#$%^&*]/, "Minimal 1 angka atau simbol"),
});

export const registerOTPValidation = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid"),

  otp: z
    .string({ required_error: "OTP wajib diisi" })
    .min(1, "OTP wajib diisi"),
});

export const loginValidation = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid"),

  password: z
    .string({ required_error: "Kata sandi wajib diisi" })
    .min(1, "Kata sandi wajib diisi"),
});
