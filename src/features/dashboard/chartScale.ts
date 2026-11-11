/** Pure helpers for the monthly chart (kept apart so components stay fast-refresh friendly). */

/** Smallest "nice" axis top (1/2/2.5/5 × 10ⁿ per tick) that fits `max`. 0 when there is nothing to draw. */
export function niceMax(max: number, ticks = 4) {
  if (!(max > 0)) return 0;
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= raw) ?? 10 * mag;
  return step * ticks;
}

const monthDate = (m: string) => new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1);
const shortMonth = new Intl.DateTimeFormat("en-IN", { month: "short" });
const longMonth = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });
export const monthLabel = (m: string, long = false) => (long ? longMonth : shortMonth).format(monthDate(m));

