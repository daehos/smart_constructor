import Attendance from "../models/attendance.model.js";

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function isWeekend(d) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export async function seedAttendance({ userIds }) {
  const docs = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let presentCount = 0;

  for (let i = 29; i >= 0; i--) {
    const d = addDays(today, -i);
    const ds = dateStr(d);
    const weekend = isWeekend(d);

    for (const uid of userIds) {
      if (weekend) {
        docs.push({ user: uid, date: ds, status: "absent" });
      } else if (presentCount < 6) {
        const clockInAt = new Date(d);
        clockInAt.setHours(8, 0, 0, 0);
        const clockOutAt = new Date(d);
        clockOutAt.setHours(17, 0, 0, 0);

        docs.push({
          user: uid,
          date: ds,
          status: "present",
          location: "Klapa Village",
          clockIn: { at: clockInAt, lat: -6.2615, lng: 106.9335, withinRadius: true },
          clockOut: { at: clockOutAt, lat: -6.2615, lng: 106.9335, withinRadius: true },
        });
        if (uid === userIds[0]) presentCount++;
      } else {
        docs.push({ user: uid, date: ds, status: "absent" });
      }
    }
  }

  const created = await Attendance.insertMany(docs, { ordered: true });
  console.log(`  ✓ attendance: ${created.length}`);
  return created;
}
