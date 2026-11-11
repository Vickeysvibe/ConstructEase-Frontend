import { daysInRange, financialYearStart, presetRange, validateRange } from "./dateRange";

describe("report date presets", () => {
  it("this month runs from the 1st to today", () => {
    expect(presetRange("this-month", "2026-11-11")).toEqual({ from: "2026-11-01", to: "2026-11-11" });
  });

  it("last month covers the whole previous month, across a year boundary", () => {
    expect(presetRange("last-month", "2026-11-11")).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(presetRange("last-month", "2027-01-05")).toEqual({ from: "2026-12-01", to: "2026-12-31" });
    expect(presetRange("last-month", "2028-03-15")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  });

  it("the financial year starts on 1 April", () => {
    expect(financialYearStart("2027-01-15")).toBe("2026-04-01");
    expect(financialYearStart("2027-03-31")).toBe("2026-04-01");
    expect(financialYearStart("2027-04-01")).toBe("2027-04-01");
    expect(presetRange("this-fy", "2027-01-15")).toEqual({ from: "2026-04-01", to: "2027-01-15" });
    expect(presetRange("this-fy", "2026-11-11")).toEqual({ from: "2026-04-01", to: "2026-11-11" });
  });

  it("custom has no preset range", () => {
    expect(presetRange("custom", "2026-11-11")).toBeNull();
  });
});

describe("validateRange", () => {
  it("accepts up to 366 days inclusive", () => {
    expect(daysInRange("2026-04-01", "2027-03-31")).toBe(365);
    expect(validateRange("2027-04-01", "2028-03-31")).toBeNull(); // leap year: 366 days
    expect(validateRange("2026-11-11", "2026-11-11")).toBeNull();
  });

  it("blocks ranges over 366 days", () => {
    expect(daysInRange("2026-01-01", "2027-01-02")).toBe(367);
    expect(validateRange("2026-01-01", "2027-01-02")).toMatch(/366 days or less/);
  });

  it("blocks reversed and missing dates", () => {
    expect(validateRange("2026-11-12", "2026-11-11")).toMatch(/on or before/);
    expect(validateRange("", "2026-11-11")).toMatch(/both/);
    expect(validateRange("2026-11-01", undefined)).toMatch(/both/);
  });
});
