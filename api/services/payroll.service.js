import { z } from "zod";
import { BadRequestError, NotFoundError, ValidationError } from "../errors/index.js";
import Payroll from "../models/payroll.model.js";
import {
  createPayrollValidation,
  listPayrollValidation,
  updatePayrollValidation,
} from "../validations/payroll.validation.js";

export default class PayrollService {
  static async list(query) {
    const parsed = listPayrollValidation.safeParse(query);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { user, period, page, limit } = parsed.data;
    const filter = { deletedAt: null };

    if (user) filter.user = user;
    if (period) {
      const [year, month] = period.split("-").map(Number);
      filter["period.year"] = year;
      filter["period.month"] = month;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Payroll.find(filter)
        .populate("user", "nama email")
        .sort({ "period.year": -1, "period.month": -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payroll.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  static async getById(id) {
    const payroll = await Payroll.findOne({ _id: id, deletedAt: null })
      .populate("user", "nama email")
      .populate("paidBy", "nama email");

    if (!payroll) throw new NotFoundError({ details: "Data payroll tidak ditemukan" });
    return payroll;
  }

  static async getMyPayroll(query, userId) {
    const period = query.period;
    const filter = { user: userId, deletedAt: null };

    if (period) {
      if (!/^\d{4}-\d{2}$/.test(period)) {
        throw new BadRequestError({ details: "Format period harus YYYY-MM" });
      }
      const [year, month] = period.split("-").map(Number);
      filter["period.year"] = year;
      filter["period.month"] = month;
    }

    const data = await Payroll.find(filter)
      .sort({ "period.year": -1, "period.month": -1 })
      .lean();

    return data;
  }

  static async create(body) {
    const parsed = createPayrollValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { user, period, gajiPokok, components } = parsed.data;

    const existing = await Payroll.findOne({
      user,
      "period.year": period.year,
      "period.month": period.month,
      deletedAt: null,
    });
    if (existing) {
      throw new BadRequestError({
        details: `Payroll untuk periode ${period.year}-${String(period.month).padStart(2, "0")} sudah ada`,
      });
    }

    return Payroll.create({ user, period, gajiPokok, components });
  }

  static async update(id, body) {
    const parsed = updatePayrollValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const payroll = await Payroll.findOne({ _id: id, deletedAt: null });
    if (!payroll) throw new NotFoundError({ details: "Data payroll tidak ditemukan" });
    if (payroll.status === "paid") {
      throw new BadRequestError({ details: "Payroll yang sudah dibayar tidak dapat diubah" });
    }

    Object.assign(payroll, parsed.data);
    return payroll.save();
  }

  static async delete(id) {
    const payroll = await Payroll.findOne({ _id: id, deletedAt: null });
    if (!payroll) throw new NotFoundError({ details: "Data payroll tidak ditemukan" });

    payroll.deletedAt = new Date();
    await payroll.save();
    return { message: "Data payroll berhasil dihapus" };
  }

  static async markPaid(id, actorId) {
    const payroll = await Payroll.findOne({ _id: id, deletedAt: null });
    if (!payroll) throw new NotFoundError({ details: "Data payroll tidak ditemukan" });
    if (payroll.status === "paid") {
      throw new BadRequestError({ details: "Payroll sudah ditandai sebagai dibayar" });
    }

    payroll.status = "paid";
    payroll.paidAt = new Date();
    payroll.paidBy = actorId;
    return payroll.save();
  }
}
