const SCHEDULE_CHANNELS = ["whatsapp"];
const SCHEDULE_KINDS = ["oneshot", "recurring"];
const SCHEDULE_STATUSES = ["pending", "active", "sent", "cancelled", "failed"];

/**
 * Returns a Mongoose Schema for the `schedules` collection.
 * Call with the service's own mongoose instance to avoid cross-package singleton issues.
 *
 * @param {import("mongoose")} mongoose
 * @returns {import("mongoose").Schema}
 */
export function createScheduleSchema(mongoose) {
  const { Schema, Types } = mongoose;

  const schema = new Schema(
    {
      user: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
      channel: {
        type: String,
        enum: SCHEDULE_CHANNELS,
        default: "whatsapp",
      },
      kind: {
        type: String,
        enum: SCHEDULE_KINDS,
        required: true,
      },
      to: {
        type: String,
        required: true,
      },
      body: {
        type: String,
        required: true,
      },
      timezone: {
        type: String,
        required: true,
      },
      // oneshot only
      scheduledAt: {
        type: Date,
        default: null,
      },
      // recurring only
      cron: {
        type: String,
        default: null,
      },
      // computed for display purposes
      nextRunAt: {
        type: Date,
        default: null,
      },
      status: {
        type: String,
        enum: SCHEDULE_STATUSES,
        default: "pending",
      },
      // BullMQ job id for oneshot delayed jobs (used for removal/reschedule)
      bullJobId: {
        type: String,
        default: null,
      },
      // BullMQ repeat job key for recurring jobs (used for removal/reschedule)
      bullRepeatKey: {
        type: String,
        default: null,
      },
      lastSentAt: {
        type: Date,
        default: null,
      },
      lastError: {
        type: String,
        default: null,
      },
      attempts: {
        type: Number,
        default: 0,
      },
    },
    { timestamps: true },
  );

  schema.index({ user: 1, createdAt: -1 });
  schema.index({ status: 1, nextRunAt: 1 });

  return schema;
}

export { SCHEDULE_CHANNELS, SCHEDULE_KINDS, SCHEDULE_STATUSES };
