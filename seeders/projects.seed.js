import Project from "../models/project.model.js";

const PROJECTS = [
  { nama: "Ciracas Residence", lokasi: "Jl. Raya Ciracas, Jakarta Timur" },
  { nama: "Sudirman Tower", lokasi: "Jl. Jenderal Sudirman Kav. 52, Jakarta Selatan" },
  { nama: "TB Simatupang Office Park", lokasi: "Jl. TB Simatupang, Jakarta Selatan" },
  { nama: "Cipayung Cluster", lokasi: "Jl. Raya Cipayung, Depok" },
  { nama: "Klapa Village", lokasi: "Jl. Klapa Dua Raya, Jakarta Barat" },
];

export async function seedProjects() {
  const created = await Project.insertMany(PROJECTS, { ordered: true });
  console.log(`  ✓ projects: ${created.length}`);
  return created;
}
