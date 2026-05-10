import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    kodeWorker: {
      type: String,
      unique: true,
      trim: true,
    },
    nama: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    telepon: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    tanggalLahir: {
      type: Date,
      default: null,
    },
    keahlian: {
      type: [String],
      default: [],
    },
    alamat: {
      type: String,
      trim: true,
      default: "",
    },
    photoUrl: {
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

workerSchema.index({ nama: "text" });
workerSchema.index({ keahlian: 1 });
workerSchema.index({ deletedAt: 1 });

const Worker = mongoose.model("Worker", workerSchema);

export default Worker;
