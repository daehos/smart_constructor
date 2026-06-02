import Material from "../models/material.model.js";

const MATERIALS = [
  { nama: "H-Beam 200x200", kategori: "Baja Struktural", subKategori: "H-Beam", satuan: "kg", hargaSatuan: 18500 },
  { nama: "Rebar D16 BJTS 420", kategori: "Baja Tulangan", subKategori: "Rebar", satuan: "kg", hargaSatuan: 13200 },
  { nama: "Steel Plate 12mm", kategori: "Baja Plat", subKategori: "Plate", satuan: "m²", hargaSatuan: 22000 },
  { nama: "Wide Flange 300x150", kategori: "Baja Struktural", subKategori: "WF", satuan: "kg", hargaSatuan: 19000 },
  { nama: "H-Beam 150x150", kategori: "Baja Struktural", subKategori: "H-Beam", satuan: "kg", hargaSatuan: 17500 },
  { nama: "Beton Ready Mix K-350", kategori: "Beton", subKategori: "Ready Mix", satuan: "m³", hargaSatuan: 0 },
  { nama: "Cement Bag 50kg", kategori: "Semen", subKategori: "Portland", satuan: "sak", hargaSatuan: 0 },
  { nama: "Paving Block 20x20", kategori: "Paving", subKategori: "Paving Block", satuan: "m²", hargaSatuan: 0 },
  { nama: "Steel Reinforcement Bar 12mm", kategori: "Baja Tulangan", subKategori: "Rebar", satuan: "kg", hargaSatuan: 0 },
  { nama: "Roofing Sheet Galvalume", kategori: "Atap", subKategori: "Galvalume", satuan: "m²", hargaSatuan: 0 },
];

export async function seedMaterials() {
  const created = await Material.insertMany(MATERIALS, { ordered: true });
  console.log(`  ✓ materials: ${created.length}`);
  return created;
}
