import Material from "../models/material.model.js";

const MATERIALS = [
  { nama: "H-Beam 200x200", kategori: "Baja Struktural", subKategori: "H-Beam", satuan: "kg" },
  { nama: "Rebar D16 BJTS 420", kategori: "Baja Tulangan", subKategori: "Rebar", satuan: "kg" },
  { nama: "Steel Plate 12mm", kategori: "Baja Plat", subKategori: "Plate", satuan: "m²" },
  { nama: "Wide Flange 300x150", kategori: "Baja Struktural", subKategori: "WF", satuan: "kg" },
  { nama: "H-Beam 150x150", kategori: "Baja Struktural", subKategori: "H-Beam", satuan: "kg" },
  { nama: "Beton Ready Mix K-350", kategori: "Beton", subKategori: "Ready Mix", satuan: "m³" },
  { nama: "Cement Bag 50kg", kategori: "Semen", subKategori: "Portland", satuan: "sak" },
  { nama: "Paving Block 20x20", kategori: "Paving", subKategori: "Paving Block", satuan: "m²" },
  { nama: "Steel Reinforcement Bar 12mm", kategori: "Baja Tulangan", subKategori: "Rebar", satuan: "kg" },
  { nama: "Roofing Sheet Galvalume", kategori: "Atap", subKategori: "Galvalume", satuan: "m²" },
];

export async function seedMaterials() {
  const created = await Material.insertMany(MATERIALS, { ordered: true });
  console.log(`  ✓ materials: ${created.length}`);
  return created;
}
