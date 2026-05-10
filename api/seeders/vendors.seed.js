import VendorAudit from "../models/vendor-audit.model.js";
import Vendor from "../models/vendor.model.js";

function deriveBrand(namaPerusahaan) {
  return namaPerusahaan.replace(/^(PT|CV|UD|PD)\s+/i, "").trim();
}

function makeCode(prefix, seq) {
  return `VEND-${prefix}-${String(seq).padStart(3, "0")}`;
}

export async function seedVendors({ materials, projects, adminUserId }) {
  const hBeam200 = materials.find((m) => m.nama === "H-Beam 200x200");
  const rebar = materials.find((m) => m.nama === "Rebar D16 BJTS 420");
  const wf300 = materials.find((m) => m.nama === "Wide Flange 300x150");
  const hBeam150 = materials.find((m) => m.nama === "H-Beam 150x150");
  const steelPlate = materials.find((m) => m.nama === "Steel Plate 12mm");
  const klapaProj = projects.find((p) => p.nama === "Klapa Village");
  const sudirmanProj = projects.find((p) => p.nama === "Sudirman Tower");
  const ciracasProj = projects.find((p) => p.nama === "Ciracas Residence");

  const vendorDefs = [
    {
      namaPerusahaan: "PT Pilar Baja Nusantara",
      kategoriSpesialisasi: "Baja Struktural",
      subKategori: ["H-Beam", "WF", "Rebar"],
      telepon: "02112345001",
      email: "pilar@pilarbaja.co.id",
      alamatPerusahaan: "Jl. Industri Baja No.1, Bekasi Barat",
      riwayatHargaMaterial: [
        { material: hBeam200?._id, namaMaterial: "H-Beam 200x200", hargaTerakhir: 18500, satuanHarga: "/kg", proyek: klapaProj?._id, namaProyek: "Klapa Village" },
        { material: rebar?._id, namaMaterial: "Rebar D16 BJTS 420", hargaTerakhir: 13200, satuanHarga: "/kg", proyek: klapaProj?._id, namaProyek: "Klapa Village" },
        { material: wf300?._id, namaMaterial: "Wide Flange 300x150", hargaTerakhir: 19000, satuanHarga: "/kg", proyek: sudirmanProj?._id, namaProyek: "Sudirman Tower" },
        { material: hBeam150?._id, namaMaterial: "H-Beam 150x150", hargaTerakhir: 17500, satuanHarga: "/kg", proyek: ciracasProj?._id, namaProyek: "Ciracas Residence" },
        { material: steelPlate?._id, namaMaterial: "Steel Plate 12mm", hargaTerakhir: 22000, satuanHarga: "/kg", proyek: klapaProj?._id, namaProyek: "Klapa Village" },
      ],
    },
    { namaPerusahaan: "PT Sinar Elektrik Solusi", kategoriSpesialisasi: "Elektrikal", subKategori: ["Kabel", "Panel"], telepon: "02112345002", email: "info@sinarelektrik.co.id", alamatPerusahaan: "Jl. Elektrik No.2, Jakarta Barat" },
    { namaPerusahaan: "PT Mitra Alat Berat", kategoriSpesialisasi: "Alat Berat", subKategori: ["Excavator", "Crane"], telepon: "02112345003", email: "info@mitraalat.co.id", alamatPerusahaan: "Jl. Alat Berat No.3, Cikarang" },
    { namaPerusahaan: "CV Beton Perkasa", kategoriSpesialisasi: "Beton", subKategori: ["Ready Mix", "Precast"], telepon: "02112345004", email: "info@betonperkasa.co.id", alamatPerusahaan: "Jl. Beton No.4, Depok" },
    { namaPerusahaan: "PT Interior Studio Modern", kategoriSpesialisasi: "Interior", subKategori: ["Furniture", "Partisi"], telepon: "02112345005", email: "info@interiorstudio.co.id", alamatPerusahaan: "Jl. Interior No.5, Jakarta Selatan" },
    { namaPerusahaan: "PT Cerah Abadi Paint", kategoriSpesialisasi: "Cat", subKategori: ["Cat Tembok", "Cat Besi"], telepon: "02112345006", email: "info@cerahabadi.co.id", alamatPerusahaan: "Jl. Cat No.6, Tangerang" },
    { namaPerusahaan: "PT Adhi Karya Semesta", kategoriSpesialisasi: "Kontraktor Umum", subKategori: ["Sipil", "Gedung"], telepon: "02112345007", email: "info@adhikarya.co.id", alamatPerusahaan: "Jl. Konstruksi No.7, Jakarta Pusat" },
    { namaPerusahaan: "PT Garda Sekuriti Properti", kategoriSpesialisasi: "Keamanan", subKategori: ["CCTV", "Satpam"], telepon: "02112345008", email: "info@gardasekuriti.co.id", alamatPerusahaan: "Jl. Keamanan No.8, Bogor" },
    { namaPerusahaan: "PT Hadir Jasa Facility", kategoriSpesialisasi: "Facility Management", subKategori: ["Cleaning", "Maintenance"], telepon: "02112345009", email: "info@hadirjasa.co.id", alamatPerusahaan: "Jl. Fasilitas No.9, Bekasi" },
    { namaPerusahaan: "PT Duta Ukur Survey", kategoriSpesialisasi: "Surveying", subKategori: ["Topografi", "GPS"], telepon: "02112345010", email: "info@dutaukur.co.id", alamatPerusahaan: "Jl. Survey No.10, Depok" },
    { namaPerusahaan: "PT Archiview Design", kategoriSpesialisasi: "Arsitektur", subKategori: ["Desain", "3D Visualisasi"], telepon: "02112345011", email: "info@archiview.co.id", alamatPerusahaan: "Jl. Desain No.11, Jakarta Selatan" },
    { namaPerusahaan: "PT Karya Mandiri Engineering", kategoriSpesialisasi: "Mekanikal", subKategori: ["Plumbing", "HVAC"], telepon: "02112345012", email: "info@karyamandiri.co.id", alamatPerusahaan: "Jl. Mesin No.12, Tangerang Selatan" },
    { namaPerusahaan: "PT Sumber Agung Kontraktor", kategoriSpesialisasi: "Kontraktor Umum", subKategori: ["Pondasi", "Jalan"], telepon: "02112345013", email: "info@sumberagung.co.id", alamatPerusahaan: "Jl. Agung No.13, Cikarang" },
    { namaPerusahaan: "PT Global HVAC Systems", kategoriSpesialisasi: "HVAC", subKategori: ["AC", "Ventilasi"], telepon: "02112345014", email: "info@globalhvac.co.id", alamatPerusahaan: "Jl. HVAC No.14, Jakarta Utara" },
    { namaPerusahaan: "PT Visionary Build Solutions", kategoriSpesialisasi: "Project Management", subKategori: ["PMO", "Konsultansi"], telepon: "02112345015", email: "info@visionary.co.id", alamatPerusahaan: "Jl. Visionary No.15, Jakarta Pusat" },
  ];

  const categorySeqMap = {};
  function buildCode(kategori) {
    const prefix = kategori
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 3)
      .padEnd(3, "X");
    categorySeqMap[prefix] = (categorySeqMap[prefix] ?? 0) + 1;
    return makeCode(prefix, categorySeqMap[prefix]);
  }

  const docs = vendorDefs.map((v) => ({
    ...v,
    namaBrand: deriveBrand(v.namaPerusahaan),
    vendorCode: buildCode(v.kategoriSpesialisasi),
  }));

  const created = await Vendor.insertMany(docs, { ordered: true });

  // Write vendor-audit for the first vendor (Pilar Baja Nusantara) to mirror real flow
  if (adminUserId) {
    await VendorAudit.create({
      vendor: created[0]._id,
      action: "CREATE",
      changes: { before: null, after: created[0].toObject() },
      changedBy: adminUserId,
    });
  }

  console.log(`  ✓ vendors: ${created.length}`);
  return created;
}
