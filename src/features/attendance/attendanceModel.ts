/**
 * Pure logic for the attendance sheet: local (unsaved) marks on top of the server sheet,
 * the shift stepper, the live summary and the PUT payload. Kept out of the component so it is easy to test.
 */
import type { AttendanceRow, AttendanceSaveInput } from "@/lib/api/types";

export type Status = "present" | "absent";
export interface Mark {
  status: Status;
  shifts: number;
}
/** labourId → mark the user has set locally (may equal the saved one; `changedEntries` filters those out). */
export type Edits = Record<string, Mark>;

export const SHIFT_MIN = 0.5;
export const SHIFT_MAX = 3;
export const SHIFT_STEP = 0.5;

/** One step up (+1) or down (−1), kept within 0.5–3 in 0.5 steps. */
export function stepShifts(shifts: number, dir: 1 | -1): number {
  const halves = Math.round(shifts * 2) + dir;
  return Math.min(SHIFT_MAX * 2, Math.max(SHIFT_MIN * 2, halves)) / 2;
}

const saved = (row: AttendanceRow): Mark | null => (row.entry ? { status: row.entry.status, shifts: row.entry.shifts } : null);

/** What the row shows: the local mark if any, else what is saved, else unmarked (null). */
export const effectiveMark = (row: AttendanceRow, edits: Edits): Mark | null => edits[row.labourId] ?? saved(row);

const sameMark = (a: Mark | null, b: Mark | null) =>
  !!a && !!b && a.status === b.status && (a.status === "absent" || a.shifts === b.shifts);

/** Mark one labourer present / absent. Present keeps their shifts if already present, else 1. */
export function withStatus(edits: Edits, row: AttendanceRow, status: Status): Edits {
  const current = effectiveMark(row, edits);
  const shifts = status === "absent" ? 0 : current?.status === "present" ? current.shifts : 1;
  return withMark(edits, row, { status, shifts });
}

export function withShiftStep(edits: Edits, row: AttendanceRow, dir: 1 | -1): Edits {
  const current = effectiveMark(row, edits);
  if (current?.status !== "present") return edits;
  return withMark(edits, row, { status: "present", shifts: stepShifts(current.shifts, dir) });
}

/** Sets a mark; a mark equal to what is saved removes the local change. */
export function withMark(edits: Edits, row: AttendanceRow, mark: Mark): Edits {
  const next = { ...edits };
  if (sameMark(mark, saved(row))) delete next[row.labourId];
  else next[row.labourId] = mark;
  return next;
}

/** Marks every given row present (rows already present keep their shifts). */
export function withAllPresent(edits: Edits, rows: AttendanceRow[]): Edits {
  return rows.reduce((acc, row) => (effectiveMark(row, acc)?.status === "present" ? acc : withStatus(acc, row, "present")), edits);
}

/** Rows whose local mark differs from what is saved, in sheet order. */
export function changedEntries(rows: AttendanceRow[], edits: Edits): AttendanceSaveInput["entries"] {
  const out: AttendanceSaveInput["entries"] = [];
  for (const row of rows) {
    const mark = edits[row.labourId];
    if (!mark || sameMark(mark, saved(row))) continue;
    out.push({ labourId: row.labourId, status: mark.status, shifts: mark.status === "absent" ? 0 : mark.shifts });
  }
  return out;
}

/** PUT body for the changed rows only. */
export const savePayload = (date: string, rows: AttendanceRow[], edits: Edits): AttendanceSaveInput => ({
  date,
  entries: changedEntries(rows, edits),
});

/** PUT body that re-saves every marked row (saved + local) with refreshed wage rates. */
export function refreshPayload(date: string, rows: AttendanceRow[], edits: Edits): AttendanceSaveInput {
  const entries: AttendanceSaveInput["entries"] = [];
  for (const row of rows) {
    const m = effectiveMark(row, edits);
    if (m) entries.push({ labourId: row.labourId, status: m.status, shifts: m.status === "absent" ? 0 : m.shifts });
  }
  return { date, entries, refreshRates: true };
}

export interface LiveSummary {
  present: number;
  absent: number;
  unmarked: number;
  shifts: number;
  /** preview in paise: saved entries use their rate snapshot, new marks the labourer's current rate */
  wagesPaise: number;
}

export function liveSummary(rows: AttendanceRow[], edits: Edits): LiveSummary {
  const s: LiveSummary = { present: 0, absent: 0, unmarked: 0, shifts: 0, wagesPaise: 0 };
  for (const row of rows) {
    const m = effectiveMark(row, edits);
    if (!m) s.unmarked++;
    else if (m.status === "absent") s.absent++;
    else {
      s.present++;
      s.shifts += m.shifts;
      s.wagesPaise += Math.round(m.shifts * (row.entry?.wageRatePaise ?? row.wageRatePaise));
    }
  }
  return s;
}

/**
 * Maps per-entry API errors (`entries.N.labourId` / `entries.N.shifts`) back to labourers.
 * `sent` is the entries array of the request that failed.
 */
export function rowErrors(errors: { path: string; message: string }[], sent: AttendanceSaveInput["entries"]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of errors) {
    const m = /^entries\.(\d+)(?:\.|$)/.exec(e.path);
    const id = m ? sent[Number(m[1])]?.labourId : undefined;
    if (id) out[id] = out[id] ? `${out[id]} ${e.message}` : e.message;
  }
  return out;
}

/** Search (name / phone / trade) + trade filter. */
export function filterRows(rows: AttendanceRow[], q: string, trade: string): AttendanceRow[] {
  const needle = q.trim().toLowerCase();
  return rows.filter((r) => {
    if (trade && (r.category ?? "Uncategorised") !== trade) return false;
    if (!needle) return true;
    return [r.name, r.phone, r.category, r.subCategory].some((v) => v?.toLowerCase().includes(needle));
  });
}

export const trades = (rows: AttendanceRow[]) => [...new Set(rows.map((r) => r.category ?? "Uncategorised"))].sort((a, b) => a.localeCompare(b));

export const formatShifts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
