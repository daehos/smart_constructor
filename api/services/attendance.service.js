import { z } from "zod";
import { SITE } from "../constants/site.constant.js";
import { BadRequestError, ValidationError } from "../errors/index.js";
import Attendance from "../models/attendance.model.js";
import { isWithinRadius } from "../utils/geo.util.js";
import {
  calendarValidation,
  clockEventValidation,
  listAttendanceValidation,
} from "../validations/attendance.validation.js";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default class AttendanceService {
  static async clockIn(body, userId) {
    const parsed = clockEventValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { lat, lng } = parsed.data;
    const date = todayString();

    const existing = await Attendance.findOne({ user: userId, date });
    if (existing?.clockIn?.at) {
      throw new BadRequestError({ details: "Sudah clock-in hari ini" });
    }

    const withinRadius = isWithinRadius(lat, lng, SITE.lat, SITE.lng, SITE.radiusMeters);

    if (!withinRadius) {
      throw new BadRequestError({ details: "Anda berada di luar radius" });
    }

    const attendance = existing
      ? existing
      : new Attendance({ user: userId, date, location: SITE.name });

    attendance.clockIn = { at: new Date(), lat, lng, withinRadius };
    attendance.status = "present";
    await attendance.save();

    return { withinRadius, attendance };
  }

  static async clockOut(body, userId) {
    const parsed = clockEventValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { lat, lng } = parsed.data;
    const date = todayString();

    const attendance = await Attendance.findOne({ user: userId, date });
    if (!attendance?.clockIn?.at) {
      throw new BadRequestError({ details: "Belum clock-in hari ini" });
    }
    if (attendance.clockOut?.at) {
      throw new BadRequestError({ details: "Sudah clock-out hari ini" });
    }

    const withinRadius = isWithinRadius(lat, lng, SITE.lat, SITE.lng, SITE.radiusMeters);

    attendance.clockOut = { at: new Date(), lat, lng, withinRadius };
    await attendance.save();

    return { withinRadius, attendance };
  }

  static async getToday(userId) {
    const date = todayString();
    const attendance = await Attendance.findOne({ user: userId, date });
    return attendance ?? { user: userId, date, clockIn: null, clockOut: null, status: "absent" };
  }

  static async listMine(query, userId) {
    const parsed = listAttendanceValidation.safeParse(query);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { from, to, page, limit } = parsed.data;
    const filter = { user: userId };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Attendance.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  /**
   * Returns the weekly calendar grid shown in the dashboard.
   * Shape: { month, weeks: [[{ date, dayLabel, status, clockIn, clockOut }]] }
   */
  static async monthCalendar(query, userId) {
    const parsed = calendarValidation.safeParse(query);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const month = parsed.data.month ?? new Date().toISOString().slice(0, 7);
    const [year, mon] = month.split("-").map(Number);
    const firstDay = new Date(year, mon - 1, 1);
    const lastDay = new Date(year, mon, 0);

    const fromStr = firstDay.toISOString().slice(0, 10);
    const toStr = lastDay.toISOString().slice(0, 10);

    const records = await Attendance.find({
      user: userId,
      date: { $gte: fromStr, $lte: toStr },
    }).lean();

    const byDate = Object.fromEntries(records.map((r) => [r.date, r]));

    const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const days = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const rec = byDate[dateStr];
      days.push({
        date: dateStr,
        day: d.getDate(),
        dayLabel: dayLabels[d.getDay()],
        status: rec?.status ?? "absent",
        clockIn: rec?.clockIn?.at ?? null,
        clockOut: rec?.clockOut?.at ?? null,
      });
    }

    return { month, days };
  }
}
