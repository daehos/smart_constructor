import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: true,
      trim: true,
    },
    nik: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["hr", "admin_finance", "admin_pengadaan", "owner", "pekerja"],
      required: true,
    },
    noHandphone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
