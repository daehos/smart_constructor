/**
 * Calendar helpers for attendance using a fixed IANA zone (default Asia/Jakarta).
 */

const WD_SHORT_TO_MON0 = Object.freeze({
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
});

/** Parse YYYY-MM-DD as UTC noon to avoid DST edge issues when stepping days. */
export function utcNoonFromYmd(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function formatYmdInTimeZone(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function attendanceTodayYmd(timeZone, now = new Date()) {
  return formatYmdInTimeZone(now, timeZone);
}

export function formatTimeHmInTimeZone(isoDate, timeZone) {
  if (!isoDate) return null;
  const d = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function weekdayMondayFirstFromYmd(ymd, timeZone) {
  const d = utcNoonFromYmd(ymd);
  if (!d) return 0;
  const short = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(d);
  return WD_SHORT_TO_MON0[short] ?? 0;
}

export function addCalendarDaysYmd(ymd, deltaDays) {
  const d = utcNoonFromYmd(ymd);
  if (!d) return ymd;
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

/** Monday (inclusive) of the ISO-style week that contains `anchorYmd`, using weekday in `timeZone`. */
export function mondayOfWeekContaining(anchorYmd, timeZone) {
  const mon0 = weekdayMondayFirstFromYmd(anchorYmd, timeZone);
  return addCalendarDaysYmd(anchorYmd, -mon0);
}
