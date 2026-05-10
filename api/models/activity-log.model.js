import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const activityLogSchema = new Schema(
  {
    actor: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    resource: {
      type: String,
      trim: true,
      default: null,
    },
    resourceId: {
      type: Types.ObjectId,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      trim: true,
      default: null,
    },
    userAgent: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ resource: 1, resourceId: 1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
