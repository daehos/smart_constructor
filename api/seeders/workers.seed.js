import Worker from "../models/worker.model.js";

const WORKERS = [
  { nama: "Suparman", gender: "male", tanggalLahir: new Date("1985-04-10"), keahlian: ["Tukang Batu", "Tukang Besi"], telepon: "0811111111", alamat: "Jl. Mangga No.1, Jakarta Timur" },
  { nama: "Bambang Irawan", gender: "male", tanggalLahir: new Date("1987-09-15"), keahlian: ["Mandor"], telepon: "0811111112", alamat: "Jl. Pisang No.2, Depok" },
  { nama: "Teguh Santoso", gender: "male", tanggalLahir: new Date("1990-01-20"), keahlian: ["Welder", "Pengelas"], telepon: "0811111113", alamat: "Jl. Nangka No.3, Bekasi" },
  { nama: "Sulistyo", gender: "male", tanggalLahir: new Date("1992-06-05"), keahlian: ["Operator Alat Berat"], telepon: "0811111114", alamat: "Jl. Durian No.4, Tangerang" },
  { nama: "Wahyu Purnomo", gender: "male", tanggalLahir: new Date("1988-11-30"), keahlian: ["Plumber", "Tukang Las"], telepon: "0811111115", alamat: "Jl. Jambu No.5, Bogor" },
  { nama: "Novi Susanti", gender: "female", tanggalLahir: new Date("1995-03-22"), keahlian: ["Finishing", "Cat"], telepon: "0811111116", alamat: "Jl. Rambutan No.6, Depok" },
  { nama: "Agus Prasetyo", gender: "male", tanggalLahir: new Date("1983-07-14"), keahlian: ["Tukang Kayu", "Tukang Pintu"], telepon: "0811111117", alamat: "Jl. Salak No.7, Jakarta Selatan" },
  { nama: "Desi Ratnasari", gender: "female", tanggalLahir: new Date("1998-02-28"), keahlian: ["Administrasi Lapangan"], telepon: "0811111118", alamat: "Jl. Melon No.8, Jakarta Utara" },
  { nama: "Mulyono", gender: "male", tanggalLahir: new Date("1980-12-01"), keahlian: ["Kepala Regu", "Mandor"], telepon: "0811111119", alamat: "Jl. Jeruk No.9, Tangerang Selatan" },
  { nama: "Slamet Riyadi", gender: "male", tanggalLahir: new Date("1986-05-17"), keahlian: ["Pengelas", "Fitter"], telepon: "0811111120", alamat: "Jl. Apel No.10, Jakarta Barat" },
];

export async function seedWorkers() {
  const docs = WORKERS.map((w, i) => ({
    ...w,
    kodeWorker: `WORK-${String(i + 1).padStart(3, "0")}`,
  }));

  const created = await Worker.insertMany(docs, { ordered: true });
  console.log(`  ✓ workers: ${created.length}`);
  return created;
}
