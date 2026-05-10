import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const materialPriceHistorySchema = new Schema(
  {
    material: {
      type: Types.ObjectId,
      ref: "Material",
      default: null,
    },
    namaMaterial: {
      type: String,
      required: true,
      trim: true,
    },
    hargaTerakhir: {
      type: Number,
      required: true,
      min: 0,
    },
    satuanHarga: {
      type: String,
      default: "/kg",
      trim: true,
    },
    proyek: {
      type: Types.ObjectId,
      ref: "Project",
      default: null,
    },
    namaProyek: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true },
);

const vendorSchema = new Schema(
  {
    vendorCode: {
      type: String,
      unique: true,
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
      default: null,
    },
    /** Display name — auto-derived from namaPerusahaan if not supplied */
    namaBrand: {
      type: String,
      trim: true,
      default: null,
    },
    telepon: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    /** Nama resmi (contoh: "PT Pilar Baja Nusantara") */
    namaPerusahaan: {
      type: String,
      required: true,
      trim: true,
    },
    alamatPerusahaan: {
      type: String,
      required: true,
      trim: true,
    },
    kategoriSpesialisasi: {
      type: String,
      required: true,
      trim: true,
    },
    subKategori: {
      type: [String],
      default: [],
    },
    riwayatHargaMaterial: {
      type: [materialPriceHistorySchema],
      default: [],
    },
    /** URL dokumen profil untuk aksi "Unduh" */
    profilDokumenUrl: {
      type: String,
      trim: true,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

/** Derive namaBrand from namaPerusahaan by stripping leading "PT " / "CV " prefixes */
function deriveBrandName(namaPerusahaan) {
  return namaPerusahaan.replace(/^(PT|CV|UD|PD)\s+/i, "").trim();
}

vendorSchema.pre("save", function () {
  if (!this.namaBrand && this.namaPerusahaan) {
    this.namaBrand = deriveBrandName(this.namaPerusahaan);
  }
});

vendorSchema.index({ email: 1 });
vendorSchema.index({ namaPerusahaan: 1 });
vendorSchema.index({ kategoriSpesialisasi: 1 });
vendorSchema.index({ deletedAt: 1 });

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
