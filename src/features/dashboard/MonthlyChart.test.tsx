import { render, screen } from "@testing-library/react";
import { MonthlyChart, type ChartSeries } from "./MonthlyChart";
import { niceMax } from "./chartScale";

const series: ChartSeries[] = [
  { key: "a", label: "Material spend", tone: "brand" },
  { key: "b", label: "Wages", tone: "interactive" },
];
const fmt = (v: number) => String(v);

describe("niceMax", () => {
  it("rounds the axis top up to a nice step", () => {
    expect(niceMax(0)).toBe(0);
    expect(niceMax(87)).toBe(100);
    expect(niceMax(1_234_567)).toBe(2_000_000);
    expect(niceMax(400)).toBe(400);
  });
});

describe("MonthlyChart", () => {
  it("scales bars to the max value", () => {
    const { container } = render(
      <MonthlyChart
        title="Spend"
        series={series}
        format={fmt}
        groups={[
          { month: "2026-10", values: { a: 400, b: 100 } },
          { month: "2026-11", values: { a: 200, b: 0 } },
        ]}
      />,
    );
    const bars = Array.from(container.querySelectorAll<SVGGElement>("[data-value]"));
    // zero-value bars are not drawn
    expect(bars).toHaveLength(3);
    const h = (v: number) => Number(bars.find((b) => b.dataset.value === String(v))!.dataset.height);
    // axis top is 400 (nice), so the 400 bar fills the plot and the others are proportional
    expect(h(400) / h(200)).toBeCloseTo(2);
    expect(h(400) / h(100)).toBeCloseTo(4);
    expect(h(400)).toBeCloseTo(220 - 12 - 28);
    expect(container.querySelector("path")!.getAttribute("d")).not.toMatch(/NaN|Infinity/);
    expect(screen.getByRole("img", { name: /spend/i })).toBeInTheDocument();
    expect(container.querySelector('[data-value="100"] title')?.textContent).toBe("Wages, October 2026: 100");
  });

  it("renders a clean empty chart for all-zero data", () => {
    const { container } = render(
      <MonthlyChart
        title="Spend"
        series={series}
        format={fmt}
        emptyText="No spending yet."
        groups={[
          { month: "2026-10", values: { a: 0, b: 0 } },
          { month: "2026-11", values: { a: 0, b: 0 } },
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-value]")).toHaveLength(0);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(screen.getAllByText("No spending yet.").length).toBeGreaterThan(0);
    // legend still names each series in text
    expect(screen.getAllByText("Material spend").length).toBeGreaterThan(0);
  });
});
