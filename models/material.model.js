import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: true,
      trim: true,
    },
    kategori: {
      type: String,
      required: true,
      trim: true,
    },
    subKategori: {
      type: String,
      trim: true,
      default: "",
    },
    satuan: {
      type: String,
      trim: true,
      default: "kg",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

materialSchema.index({ nama: "text", kategori: "text" });
materialSchema.index({ kategori: 1 });
materialSchema.index({ deletedAt: 1 });

const Material = mongoose.model("Material", materialSchema);

export default Material;
