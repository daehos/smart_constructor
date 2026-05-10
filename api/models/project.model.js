import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: true,
      trim: true,
    },
    lokasi: {
      type: String,
      trim: true,
      default: "",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

projectSchema.index({ nama: "text" });
projectSchema.index({ deletedAt: 1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
