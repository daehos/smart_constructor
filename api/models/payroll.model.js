import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const componentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["earning", "deduction"], required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const payrollSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    period: {
      year: { type: Number, required: true },
      month: { type: Number, required: true, min: 1, max: 12 },
    },
    gajiPokok: {
      type: Number,
      required: true,
      min: 0,
    },
    components: {
      type: [componentSchema],
      default: [],
    },
    /** Computed on save */
    totalEarning: { type: Number, default: 0 },
    totalDeduction: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "paid"],
      default: "draft",
    },
    paidAt: { type: Date, default: null },
    paidBy: { type: Types.ObjectId, ref: "User", default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

payrollSchema.index({ user: 1, "period.year": 1, "period.month": 1 }, { unique: true });

payrollSchema.pre("save", function () {
  const extraEarnings = this.components
    .filter((c) => c.type === "earning")
    .reduce((s, c) => s + c.amount, 0);
  const deductions = this.components
    .filter((c) => c.type === "deduction")
    .reduce((s, c) => s + c.amount, 0);

  this.totalEarning = this.gajiPokok + extraEarnings;
  this.totalDeduction = deductions;
  this.netSalary = this.totalEarning - this.totalDeduction;
});

const Payroll = mongoose.model("Payroll", payrollSchema);

export default Payroll;
