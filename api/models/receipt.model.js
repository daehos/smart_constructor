import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const RECEIPT_STATUS = ["queued", "processing", "done", "failed"];

const bboxPointSchema = new Schema([Number], { _id: false });

const ocrLineSchema = new Schema(
  {
    text: { type: String, required: true },
    confidence: { type: Number },
    bbox: { type: [[Number]] },
  },
  { _id: false },
);

const parsedItemSchema = new Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
  },
  { _id: true },
);

const rawOcrSchema = new Schema(
  {
    text: { type: String, default: "" },
    lines: { type: [ocrLineSchema], default: [] },
  },
  { _id: false },
);

const parsedSchema = new Schema(
  {
    merchant: { type: String, default: null },
    date: { type: String, default: null },
    items: { type: [parsedItemSchema], default: [] },
    subtotal: { type: Number, default: null },
    tax: { type: Number, default: null },
    total: { type: Number, default: null },
    currency: { type: String, default: "IDR" },
  },
  { _id: false },
);

const receiptSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    objectKey: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: RECEIPT_STATUS,
      default: "queued",
    },
    error: {
      type: String,
      default: null,
    },
    rawOcr: {
      type: rawOcrSchema,
      default: null,
    },
    parsed: {
      type: parsedSchema,
      default: null,
    },
    linkedOrder: {
      type: Types.ObjectId,
      ref: "Order",
      default: null,
    },
    parserVersion: {
      type: String,
      default: "v1",
    },
  },
  { timestamps: true },
);

receiptSchema.index({ user: 1, createdAt: -1 });
receiptSchema.index({ status: 1 });

const Receipt = mongoose.model("Receipt", receiptSchema);

export default Receipt;
