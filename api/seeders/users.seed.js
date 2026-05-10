import { hashPassword } from "../utils/bcrypt.util.js";
import User from "../models/user.model.js";

const RAW_PASSWORD = "Admin123!";

export async function seedUsers() {
  const users = [
    {
      nama: "Budi Santoso",
      email: "owner@proyek.in",
      role: "owner",
      phoneNumber: "081234567890",
      gender: "male",
      tanggalLahir: new Date("1975-03-15"),
      kategoriSpesialisasi: null,
      password: hashPassword(RAW_PASSWORD),
    },
    {
      nama: "Siti Rahayu",
      email: "hr@proyek.in",
      role: "hr",
      phoneNumber: "081234567891",
      gender: "female",
      tanggalLahir: new Date("1988-07-22"),
      kategoriSpesialisasi: null,
      password: hashPassword(RAW_PASSWORD),
    },
    {
      nama: "Andi Wijaya",
      email: "finance@proyek.in",
      role: "admin_finance",
      phoneNumber: "081234567892",
      gender: "male",
      tanggalLahir: new Date("1990-11-10"),
      kategoriSpesialisasi: null,
      password: hashPassword(RAW_PASSWORD),
    },
    {
      nama: "Dewi Lestari",
      email: "pengadaan@proyek.in",
      role: "admin_pengadaan",
      phoneNumber: "081234567893",
      gender: "female",
      tanggalLahir: new Date("1992-05-30"),
      kategoriSpesialisasi: null,
      password: hashPassword(RAW_PASSWORD),
    },
    {
      nama: "Rudi Hermawan",
      email: "pekerja1@proyek.in",
      role: "pekerja",
      phoneNumber: "081234567894",
      gender: "male",
      tanggalLahir: new Date("1995-02-14"),
      kategoriSpesialisasi: "Tukang Batu",
      password: hashPassword(RAW_PASSWORD),
    },
    {
      nama: "Fitri Wulandari",
      email: "pekerja2@proyek.in",
      role: "pekerja",
      phoneNumber: "081234567895",
      gender: "female",
      tanggalLahir: new Date("1997-08-19"),
      kategoriSpesialisasi: "Arsitek",
      password: hashPassword(RAW_PASSWORD),
    },
    {
      nama: "Hendra Gunawan",
      email: "pekerja3@proyek.in",
      role: "pekerja",
      phoneNumber: "081234567896",
      gender: "male",
      tanggalLahir: new Date("1993-12-05"),
      kategoriSpesialisasi: "Mandor",
      password: hashPassword(RAW_PASSWORD),
    },
    {
      nama: "Rina Marlina",
      email: "pekerja4@proyek.in",
      role: "pekerja",
      phoneNumber: "081234567897",
      gender: "female",
      tanggalLahir: new Date("1999-04-25"),
      kategoriSpesialisasi: "Pengelas",
      password: hashPassword(RAW_PASSWORD),
    },
    {
      nama: "Joko Susilo",
      email: "pekerja5@proyek.in",
      role: "pekerja",
      phoneNumber: "081234567898",
      gender: "male",
      tanggalLahir: new Date("1996-06-11"),
      kategoriSpesialisasi: "Operator Alat Berat",
      password: hashPassword(RAW_PASSWORD),
    },
  ];

  const created = await User.insertMany(users, { ordered: true });

  const byRole = {};
  for (const u of created) {
    if (!byRole[u.role]) byRole[u.role] = [];
    byRole[u.role].push(u._id);
  }

  console.log(`  ✓ users: ${created.length}`);
  return byRole;
}
