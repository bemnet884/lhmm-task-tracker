export const APP_TZ = "Africa/Addis_Ababa";
export const APP_OFFSET = "+03:00"; // Ethiopia has no daylight saving

const dayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" of a moment, in the church's timezone */
export const dayKey = (d: Date) => dayFmt.format(d);

/** Value for <input type="datetime-local">, in the church's timezone */
export function toInputValue(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}

/** Turns a datetime-local string into a real Date, using the church's timezone */
export const parseInputValue = (v: string) => new Date(`${v}:00${APP_OFFSET}`);

export const timeLabel = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(d);

export function addDays(key: string, n: number) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing the given day key */
export function mondayOf(key: string) {
  const dow = (new Date(`${key}T00:00:00Z`).getUTCDay() + 6) % 7; // Mon = 0
  return addDays(key, -dow);
}

export const weekDays = (monday: string) =>
  Array.from({ length: 7 }, (_, i) => addDays(monday, i));

export const startOfDay = (key: string) =>
  new Date(`${key}T00:00:00${APP_OFFSET}`);

export const dayLabel = (key: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${key}T00:00:00Z`));

export function relativeTime(d: Date) {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return timeLabel(d);
}
