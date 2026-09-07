const pad = (n: number) => String(n).padStart(2, "0");

/** Local date as YYYY-MM-DD */
export function toDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function daysBetween(from: string, to: string): number {
  const a = parseDateKey(from).getTime();
  const b = parseDateKey(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function formatDateJa(key: string): string {
  const d = parseDateKey(key);
  const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${w}）`;
}

export function formatShort(key: string): string {
  const d = parseDateKey(key);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** Local date key (YYYY-MM-DD) of an ISO timestamp. Never slice ISO strings: they are UTC. */
export function dateKeyOf(iso: string): string {
  return toDateKey(new Date(iso));
}
