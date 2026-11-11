import type { AttendanceRow } from "@/lib/api/types";
import {
  changedEntries,
  liveSummary,
  refreshPayload,
  rowErrors,
  savePayload,
  stepShifts,
  withAllPresent,
  withShiftStep,
  withStatus,
  type Edits,
} from "./attendanceModel";

const row = (labourId: string, entry: AttendanceRow["entry"] = null, wageRatePaise = 80000): AttendanceRow => ({
  labourId,
  name: labourId,
  phone: "9840000000",
  category: "Mason",
  wageRatePaise,
  entry,
});
const present = (shifts: number, rate = 80000) => ({ id: "e", status: "present" as const, shifts, wageRatePaise: rate, wagePaise: Math.round(shifts * rate) });
const absent = () => ({ id: "e", status: "absent" as const, shifts: 0, wageRatePaise: 80000, wagePaise: 0 });

describe("stepShifts", () => {
  it("moves in 0.5 steps and stays within 0.5–3", () => {
    expect(stepShifts(1, 1)).toBe(1.5);
    expect(stepShifts(1, -1)).toBe(0.5);
    expect(stepShifts(0.5, -1)).toBe(0.5);
    expect(stepShifts(3, 1)).toBe(3);
    expect(stepShifts(2.5, 1)).toBe(3);
  });
});

describe("local changes", () => {
  const rows = [row("a", present(1)), row("b", absent()), row("c")];

  it("tracks only rows that differ from what is saved", () => {
    let e: Edits = {};
    e = withStatus(e, rows[2]!, "present"); // unmarked → present
    e = withStatus(e, rows[0]!, "present"); // already present: no change
    expect(changedEntries(rows, e)).toEqual([{ labourId: "c", status: "present", shifts: 1 }]);
  });

  it("drops a change when the row is set back to its saved mark", () => {
    let e = withShiftStep({}, rows[0]!, 1);
    expect(changedEntries(rows, e)).toEqual([{ labourId: "a", status: "present", shifts: 1.5 }]);
    e = withShiftStep(e, rows[0]!, -1);
    expect(e).toEqual({});
    expect(changedEntries(rows, e)).toEqual([]);
  });

  it("sends absent with 0 shifts and only changed rows in the PUT body", () => {
    let e: Edits = {};
    e = withShiftStep(withShiftStep(e, rows[0]!, 1), rows[0]!, 1); // a: 1 → 2
    e = withStatus(e, rows[0]!, "absent"); // a: absent
    e = withStatus(e, rows[1]!, "absent"); // b: already absent → no change
    e = withStatus(e, rows[2]!, "present");
    e = withShiftStep(e, rows[2]!, -1); // c: 0.5
    expect(savePayload("2026-11-11", rows, e)).toEqual({
      date: "2026-11-11",
      entries: [
        { labourId: "a", status: "absent", shifts: 0 },
        { labourId: "c", status: "present", shifts: 0.5 },
      ],
    });
  });

  it("keeps shifts when switching an already-present row to present, and ignores steps on absent rows", () => {
    const e = withShiftStep({}, rows[1]!, 1);
    expect(e).toEqual({});
  });

  it("marks everyone in the list present without touching rows already present", () => {
    const e = withAllPresent(withShiftStep({}, rows[0]!, 1), rows);
    expect(changedEntries(rows, e)).toEqual([
      { labourId: "a", status: "present", shifts: 1.5 },
      { labourId: "b", status: "present", shifts: 1 },
      { labourId: "c", status: "present", shifts: 1 },
    ]);
  });

  it("re-saves every marked row when refreshing rates", () => {
    expect(refreshPayload("2026-11-11", rows, {})).toEqual({
      date: "2026-11-11",
      refreshRates: true,
      entries: [
        { labourId: "a", status: "present", shifts: 1 },
        { labourId: "b", status: "absent", shifts: 0 },
      ],
    });
  });

  it("summarises live marks with the saved rate snapshot or the current rate", () => {
    const rs = [row("a", present(1, 70000), 90000), row("b", null, 60000), row("c")];
    const s = liveSummary(rs, withShiftStep(withStatus({}, rs[1]!, "present"), rs[1]!, 1));
    expect(s).toEqual({ present: 2, absent: 0, unmarked: 1, shifts: 2.5, wagesPaise: 70000 + 90000 });
  });

  it("maps per-entry API errors back to labourers", () => {
    const sent = [
      { labourId: "a", status: "present" as const, shifts: 1 },
      { labourId: "c", status: "present" as const, shifts: 1 },
    ];
    expect(rowErrors([{ path: "entries.1.labourId", message: "Present on another site" }, { path: "date", message: "x" }], sent)).toEqual({
      c: "Present on another site",
    });
  });
});
