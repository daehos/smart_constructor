import { z } from "zod";
import { config } from "../configs/env.js";
import { SITE } from "../constants/site.constant.js";
import { BadRequestError, ValidationError } from "../errors/index.js";
import Attendance from "../models/attendance.model.js";
import { haversineDistance, isWithinRadius } from "../utils/geo.util.js";
import {
  addCalendarDaysYmd,
  attendanceTodayYmd,
  formatTimeHmInTimeZone,
  mondayOfWeekContaining,
  weekdayMondayFirstFromYmd,
} from "../utils/attendance-date.util.js";
import {
  calendarValidation,
  clockEventValidation,
  listAttendanceValidation,
  weekSummaryValidation,
} from "../validations/attendance.validation.js";

const DAY_LABELS_SUN0 = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const WEEK_STRIP_LABELS_MON0 = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function sunIndexFromYmd(ymd, timeZone) {
  const mon0 = weekdayMondayFirstFromYmd(ymd, timeZone);
  return (mon0 + 1) % 7;
}

function dayCell(ymd, timeZone, rec) {
  const sun0 = sunIndexFromYmd(ymd, timeZone);
  const [y, m, d] = ymd.split("-").map(Number);
  return {
    date: ymd,
    day: d,
    dayLabel: DAY_LABELS_SUN0[sun0],
    status: rec?.status ?? "absent",
    clockIn: rec?.clockIn?.at ?? null,
    clockOut: rec?.clockOut?.at ?? null,
  };
}

export default class AttendanceService {
  static _tz() {
    return config.attendance.timeZone;
  }

  /** Site + zone for map / clock UI (no coordinates required to read). */
  static getSiteMeta() {
    const tz = AttendanceService._tz();
    return {
      name: SITE.name,
      area: SITE.area,
      lat: SITE.lat,
      lng: SITE.lng,
      radiusMeters: SITE.radiusMeters,
      timeZone: tz,
    };
  }

  /**
   * Same geofence check as clock-in, without writing DB (reload map / "Lanjut" gate).
   */
  static async checkLocation(body) {
    const parsed = clockEventValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { lat, lng } = parsed.data;
    const withinRadius = isWithinRadius(lat, lng, SITE.lat, SITE.lng, SITE.radiusMeters);
    const distanceMeters = haversineDistance(lat, lng, SITE.lat, SITE.lng);

    return {
      withinRadius,
      distanceMeters: Math.round(distanceMeters * 100) / 100,
      site: {
        name: SITE.name,
        area: SITE.area,
        lat: SITE.lat,
        lng: SITE.lng,
        radiusMeters: SITE.radiusMeters,
      },
    };
  }

  static async clockIn(body, userId) {
    const parsed = clockEventValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const tz = AttendanceService._tz();
    const { lat, lng } = parsed.data;
    const date = attendanceTodayYmd(tz);

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

    const tz = AttendanceService._tz();
    const { lat, lng } = parsed.data;
    const date = attendanceTodayYmd(tz);

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
    const tz = AttendanceService._tz();
    const date = attendanceTodayYmd(tz);
    const attendance = await Attendance.findOne({ user: userId, date }).lean();
    if (!attendance) {
      return {
        user: userId,
        date,
        location: "",
        clockIn: null,
        clockOut: null,
        clockInTime: null,
        clockOutTime: null,
        status: "absent",
        timeZone: tz,
      };
    }

    return {
      ...attendance,
      clockInTime: formatTimeHmInTimeZone(attendance.clockIn?.at, tz),
      clockOutTime: formatTimeHmInTimeZone(attendance.clockOut?.at, tz),
      timeZone: tz,
    };
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
   * Strip like "Presensi Saya": Mon–Sun with presence + times for one week (anchor defaults to today in attendance TZ).
   */
  static async weekSummary(query, userId) {
    const parsed = weekSummaryValidation.safeParse(query);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const tz = AttendanceService._tz();
    const anchorYmd = parsed.data.anchor ?? attendanceTodayYmd(tz);
    const mondayYmd = mondayOfWeekContaining(anchorYmd, tz);
    const sundayYmd = addCalendarDaysYmd(mondayYmd, 6);

    const records = await Attendance.find({
      user: userId,
      date: { $gte: mondayYmd, $lte: sundayYmd },
    }).lean();

    const byDate = Object.fromEntries(records.map((r) => [r.date, r]));
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = addCalendarDaysYmd(mondayYmd, i);
      const rec = byDate[date];
      const present = Boolean(rec?.clockIn?.at);
      days.push({
        date,
        dayLabel: WEEK_STRIP_LABELS_MON0[i],
        present,
        status: rec?.status ?? "absent",
        clockInTime: formatTimeHmInTimeZone(rec?.clockIn?.at, tz),
        clockOutTime: formatTimeHmInTimeZone(rec?.clockOut?.at, tz),
      });
    }

    return {
      weekStart: mondayYmd,
      weekEnd: sundayYmd,
      timeZone: tz,
      days,
    };
  }

  /**
   * Month grid + `weeks` rows (Mon–Sun) with null padding, matching dashboard calendar UX.
   */
  static async monthCalendar(query, userId) {
    const parsed = calendarValidation.safeParse(query);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const tz = AttendanceService._tz();
    const month = parsed.data.month ?? attendanceTodayYmd(tz).slice(0, 7);
    const [year, mon] = month.split("-").map(Number);
    const dim = new Date(year, mon, 0).getDate();

    const fromStr = `${month}-01`;
    const toStr = `${year}-${String(mon).padStart(2, "0")}-${String(dim).padStart(2, "0")}`;

    const records = await Attendance.find({
      user: userId,
      date: { $gte: fromStr, $lte: toStr },
    }).lean();

    const byDate = Object.fromEntries(records.map((r) => [r.date, r]));

    const days = [];
    for (let day = 1; day <= dim; day++) {
      const dateStr = `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push(dayCell(dateStr, tz, byDate[dateStr]));
    }

    const lead = weekdayMondayFirstFromYmd(fromStr, tz);
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (const cell of days) cells.push(cell);
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    return { month, days, weeks, timeZone: tz };
  }
}
