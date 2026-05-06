import Payroll from "../models/payroll.model.js";

export async function seedPayroll({ userIds, paidById }) {
  const docs = [];

  const [uid1, uid2] = userIds;

  const periods = [
    { year: 2025, month: 1 },
    { year: 2025, month: 2 },
    { year: 2025, month: 3 },
  ];

  for (const period of periods) {
    if (uid1) {
      docs.push({
        user: uid1,
        period,
        gajiPokok: 5_000_000,
        components: [
          { name: "Tunjangan Makan", type: "earning", amount: 500_000 },
          { name: "Tunjangan Transport", type: "earning", amount: 300_000 },
          { name: "BPJS Kesehatan", type: "deduction", amount: 150_000 },
        ],
        status: period.month < 3 ? "paid" : "draft",
        paidAt: period.month < 3 ? new Date(period.year, period.month, 5) : null,
        paidBy: period.month < 3 ? (paidById ?? null) : null,
      });
    }

    if (uid2) {
      docs.push({
        user: uid2,
        period,
        gajiPokok: 4_500_000,
        components: [
          { name: "Tunjangan Makan", type: "earning", amount: 500_000 },
          { name: "BPJS Kesehatan", type: "deduction", amount: 135_000 },
          { name: "Potongan Absensi", type: "deduction", amount: 200_000 },
        ],
        status: period.month < 3 ? "paid" : "draft",
        paidAt: period.month < 3 ? new Date(period.year, period.month, 5) : null,
        paidBy: period.month < 3 ? (paidById ?? null) : null,
      });
    }
  }

  const created = await Payroll.insertMany(docs, { ordered: true });
  console.log(`  ✓ payroll: ${created.length}`);
  return created;
}
