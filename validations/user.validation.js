import { z } from "zod";

export const registerValidation = z.object({
  nama: z
    .string({ required_error: "Nama wajib diisi" })
    .min(1, "Nama wajib diisi")
    .trim(),

  nik: z
    .string({ required_error: "NIK wajib diisi" })
    .length(16, "NIK harus 16 digit")
    .regex(/^\d+$/, "NIK harus berupa angka"),

  email: z
    .string({ required_error: "Email wajib diisi" })
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .toLowerCase(),

  role: z.enum(["hr", "admin_finance", "admin_pengadaan", "owner", "pekerja"], {
    errorMap: () => ({ message: "Role tidak valid" }),
  }),

  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "Gender must be 'male' or 'female'" }),
  }),

  noHandphone: z
    .string({ required_error: "No handphone wajib diisi" })
    .min(10, "No handphone minimal 10 digit")
    .max(15, "No handphone maksimal 15 digit")
    .regex(/^\+?[\d\s-]+$/, "Format no handphone tidak valid"),

  password: z
    .string({ required_error: "Password wajib diisi" })
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus ada huruf kapital")
    .regex(/[0-9]/, "Password harus ada angka"),
});

export const loginValidation = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid"),

  password: z
    .string({ required_error: "Password wajib diisi" })
    .min(1, "Password wajib diisi"),
});
