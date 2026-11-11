import { addDays, date, money, moneyShort, qty, toPaise, percentFromBp } from "./format";

describe("format", () => {
  it("formats paise as rupees with Indian grouping", () => {
    expect(money(48230000)).toBe("₹4,82,300.00");
    expect(money(41250)).toBe("₹412.50");
    expect(money(null)).toBe("—");
  });
  it("abbreviates lakhs and crores", () => {
    expect(moneyShort(162_000_000)).toBe("₹16.2 L");
    expect(moneyShort(1_620_000_000)).toBe("₹1.62 Cr");
    expect(moneyShort(9_900_000)).toBe("₹99,000");
  });
  it("parses rupee input to integer paise without float drift", () => {
    expect(toPaise("412.50")).toBe(41250);
    expect(toPaise("1,00,000")).toBe(10_000_000);
    expect(toPaise("0.1")).toBe(10);
    expect(Number.isNaN(toPaise("abc"))).toBe(true);
  });
  it("formats quantities, GST and calendar dates without timezone shifts", () => {
    expect(qty(12.5, "bag")).toBe("12.5 bag");
    expect(percentFromBp(1800)).toBe("18%");
    expect(date("2026-03-01")).toMatch(/1 Mar 2026/);
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
});
