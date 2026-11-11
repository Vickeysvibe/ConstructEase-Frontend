import { ApiError } from "@/lib/api/client";
import { money } from "@/lib/format";
import { priceLine, qtyGreater, remapLineErrors, sumLines } from "./lib";

describe("priceLine", () => {
  it("prices 12.5 bag × ₹412.50 @ 28% with integer paise maths", () => {
    const l = priceLine(12.5, 41250, 2800);
    expect(l).toEqual({ amountPaise: 515625, taxPaise: 144375, totalPaise: 660000 });
    expect(money(l.amountPaise)).toBe("₹5,156.25");
    expect(money(l.taxPaise)).toBe("₹1,443.75");
    expect(money(l.totalPaise)).toBe("₹6,600.00");
  });

  it("rounds half-up to the paisa like the API", () => {
    // 0.333 tonne × ₹61,234.57 = 20391.11181 → ₹20,391.11; 18% of 2039111 = 367039.98 → 367040
    expect(priceLine(0.333, 6123457, 1800)).toEqual({ amountPaise: 2039111, taxPaise: 367040, totalPaise: 2406151 });
    // 1.005 × 1 paisa = 1.005 → 1
    expect(priceLine(1.005, 1, 0).amountPaise).toBe(1);
  });

  it("avoids float drift (0.1 + 0.2 cu.m style quantities)", () => {
    expect(priceLine(0.3, 150000, 500)).toEqual({ amountPaise: 45000, taxPaise: 2250, totalPaise: 47250 });
  });

  it("treats empty inputs as zero", () => {
    expect(priceLine(null, undefined, 1800)).toEqual({ amountPaise: 0, taxPaise: 0, totalPaise: 0 });
  });

  it("sums lines into PO totals in lakh grouping", () => {
    const t = sumLines([priceLine(400, 41250, 2800), priceLine(2.5, 6200000, 1800)]);
    expect(t).toEqual({ subtotalPaise: 16500000 + 15500000, taxPaise: 4620000 + 2790000, totalPaise: 39410000 });
    expect(money(t.totalPaise)).toBe("₹3,94,100.00");
  });
});

describe("qtyGreater", () => {
  it("compares in thousandths", () => {
    expect(qtyGreater(0.1 + 0.2, 0.3)).toBe(false);
    expect(qtyGreater(10.001, 10)).toBe(true);
  });
});

describe("remapLineErrors", () => {
  it("maps the API's line index back to the form row", () => {
    const err = new ApiError(409, "INSUFFICIENT_STOCK", "Not enough stock", undefined, [
      { path: "lines.0.qty", message: "Only 3 in stock" },
      { path: "date", message: "Bad date" },
    ]);
    const out = remapLineErrors(err, [2]) as ApiError;
    expect(out.errors).toEqual([
      { path: "lines.2.qty", message: "Only 3 in stock" },
      { path: "date", message: "Bad date" },
    ]);
    expect(out.code).toBe("INSUFFICIENT_STOCK");
  });
});
