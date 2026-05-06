import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const clockEventSchema = new Schema(
  {
    at: { type: Date, default: null },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    withinRadius: { type: Boolean, default: null },
  },
  { _id: false },
);

const attendanceSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    /** ISO date string YYYY-MM-DD, stored as date only (no time) */
    date: {
      type: String,
      required: true,
    },
    clockIn: {
      type: clockEventSchema,
      default: () => ({}),
    },
    clockOut: {
      type: clockEventSchema,
      default: () => ({}),
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["present", "absent", "leave"],
      default: "absent",
    },
  },
  { timestamps: true },
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
