import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const vendorAuditSchema = new Schema(
  {
    vendor: {
      type: Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE"],
      required: true,
    },
    changes: {
      before: { type: Schema.Types.Mixed, default: null },
      after: { type: Schema.Types.Mixed, default: null },
    },
    changedBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false },
);

vendorAuditSchema.index({ vendor: 1, changedAt: -1 });

const VendorAudit = mongoose.model("VendorAudit", vendorAuditSchema);

export default VendorAudit;
