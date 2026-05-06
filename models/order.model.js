import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const orderItemSchema = new Schema(
  {
    material: {
      type: Types.ObjectId,
      ref: "Material",
      default: null,
    },
    namaProduk: {
      type: String,
      required: true,
      trim: true,
    },
    kategoriMaterial: {
      type: String,
      trim: true,
      default: "",
    },
    subKategoriMaterial: {
      type: String,
      trim: true,
      default: "",
    },
    jumlah: {
      type: Number,
      required: true,
      min: 1,
    },
    hargaSatuan: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true },
);

const shippingSchema = new Schema(
  {
    kurir: { type: String, trim: true, default: "" },
    noResi: { type: String, trim: true, default: "" },
    alamatTujuan: { type: String, trim: true, default: "" },
    subtotalPengiriman: { type: Number, default: 0 },
    diskonPengiriman: { type: Number, default: 0 },
  },
  { _id: false },
);

const paymentSchema = new Schema(
  {
    metode: { type: String, trim: true, default: "" },
    voucherDiskon: { type: Number, default: 0 },
    biayaLayanan: { type: Number, default: 0 },
    totalDibayar: { type: Number, default: 0 },
    invoiceUrl: { type: String, trim: true, default: null },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    vendor: {
      type: Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    buyer: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    pesan: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["dikirim", "selesai", "dibatalkan", "pengembalian"],
      default: "dikirim",
    },
    shipping: {
      type: shippingSchema,
      default: () => ({}),
    },
    payment: {
      type: paymentSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ vendor: 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
