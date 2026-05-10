import Order from "../models/order.model.js";

function orderNum(n) {
  return `IVR/${String(n).padStart(10, "0")}`;
}

export async function seedOrders({ vendor, buyerId, materials }) {
  const rebar = materials.find((m) => m.nama === "Rebar D16 BJTS 420");
  const hBeam = materials.find((m) => m.nama === "H-Beam 200x200");
  const wf = materials.find((m) => m.nama === "Wide Flange 300x150");

  const items1 = [
    { material: hBeam?._id, namaProduk: "H-Beam 200x200", kategoriMaterial: "Baja Struktural", subKategoriMaterial: "H-Beam", jumlah: 500, hargaSatuan: 18500, subtotal: 500 * 18500 },
    { material: rebar?._id, namaProduk: "Rebar D16 BJTS 420", kategoriMaterial: "Baja Tulangan", subKategoriMaterial: "Rebar", jumlah: 1000, hargaSatuan: 13200, subtotal: 1000 * 13200 },
  ];

  const orders = [
    {
      orderNumber: orderNum(1001),
      vendor: vendor._id,
      buyer: buyerId,
      items: items1,
      status: "dikirim",
      payment: { totalDibayar: items1.reduce((s, i) => s + i.subtotal, 0) },
      createdAt: new Date("2025-02-01"),
    },
    {
      orderNumber: orderNum(1002),
      vendor: vendor._id,
      buyer: buyerId,
      items: [{ material: wf?._id, namaProduk: "Wide Flange 300x150", kategoriMaterial: "Baja Struktural", subKategoriMaterial: "WF", jumlah: 200, hargaSatuan: 19000, subtotal: 200 * 19000 }],
      status: "selesai",
      payment: { totalDibayar: 200 * 19000 },
      createdAt: new Date("2025-01-15"),
    },
    {
      orderNumber: orderNum(1003),
      vendor: vendor._id,
      buyer: buyerId,
      items: [{ material: rebar?._id, namaProduk: "Rebar D16 BJTS 420", kategoriMaterial: "Baja Tulangan", subKategoriMaterial: "Rebar", jumlah: 300, hargaSatuan: 13200, subtotal: 300 * 13200 }],
      status: "dibatalkan",
      payment: { totalDibayar: 300 * 13200 },
      createdAt: new Date("2024-12-20"),
    },
    {
      orderNumber: orderNum(1004),
      vendor: vendor._id,
      buyer: buyerId,
      items: [{ material: hBeam?._id, namaProduk: "H-Beam 200x200", kategoriMaterial: "Baja Struktural", subKategoriMaterial: "H-Beam", jumlah: 100, hargaSatuan: 18500, subtotal: 100 * 18500 }],
      status: "pengembalian",
      payment: { totalDibayar: 100 * 18500 },
      createdAt: new Date("2024-11-05"),
    },
    {
      orderNumber: orderNum(1005),
      vendor: vendor._id,
      buyer: buyerId,
      items: [{ material: wf?._id, namaProduk: "Wide Flange 300x150", kategoriMaterial: "Baja Struktural", subKategoriMaterial: "WF", jumlah: 400, hargaSatuan: 19000, subtotal: 400 * 19000 }],
      status: "selesai",
      payment: { totalDibayar: 400 * 19000 },
      createdAt: new Date("2024-10-10"),
    },
  ];

  const created = await Order.insertMany(orders, { ordered: true });
  console.log(`  ✓ orders: ${created.length}`);
  return created;
}
