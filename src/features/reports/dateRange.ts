import { addDays, startOfMonth } from "@/lib/format";

/** Date-range presets for reports. All dates are business dates (YYYY-MM-DD strings). */
export type RangePreset = "this-month" | "last-month" | "this-fy" | "custom";

export const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "this-fy", label: "This financial year" },
  { value: "custom", label: "Custom" },
];

export const MAX_RANGE_DAYS = 366;

/** Indian financial year starts on 1 April: Jan 2027 → 2026-04-01, Apr 2027 → 2027-04-01. */
export function financialYearStart(day: string) {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  return `${month >= 4 ? year : year - 1}-04-01`;
}

/** The range a preset covers, ending today (last month ends on its last day). `custom` returns null. */
export function presetRange(preset: RangePreset, todayStr: string): { from: string; to: string } | null {
  switch (preset) {
    case "this-month":
      return { from: startOfMonth(todayStr), to: todayStr };
    case "last-month": {
      const to = addDays(startOfMonth(todayStr), -1);
      return { from: startOfMonth(to), to };
    }
    case "this-fy":
      return { from: financialYearStart(todayStr), to: todayStr };
    default:
      return null;
  }
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const utc = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));

/** Inclusive day count between two business dates. */
export const daysInRange = (from: string, to: string) => Math.round((utc(to) - utc(from)) / 86_400_000) + 1;

/** Mirrors the API rule (inclusive, at most 366 days). Returns a message, or null when the range is fine. */
export function validateRange(from: string | undefined, to: string | undefined): string | null {
  if (!from || !to || !DATE.test(from) || !DATE.test(to)) return "Choose both a start and an end date.";
  if (from > to) return "The start date must be on or before the end date.";
  if (daysInRange(from, to) > MAX_RANGE_DAYS) return `Choose a range of ${MAX_RANGE_DAYS} days or less.`;
  return null;
}
