import { useEffect, useId, useRef, useState } from "react";
import { DataTable, type ColumnDef } from "@/ui";
import { monthLabel, niceMax } from "./chartScale";
import "./dashboard.css";

export type SeriesTone = "brand" | "interactive" | "ok";
export interface ChartSeries {
  key: string;
  label: string;
  tone: SeriesTone;
  /** diagonal hatch as a second, non-colour cue */
  hatched?: boolean;
}
export interface ChartGroup {
  /** YYYY-MM */
  month: string;
  values: Record<string, number>;
}

const HEIGHT = 220;
const M = { top: 12, right: 8, bottom: 28, left: 64 };
const RADIUS = 4;
const TICKS = 4;

/** Bar with rounded top corners, anchored to the baseline. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(RADIUS, w / 2, h);
  const b = y + h;
  return `M${x},${b}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${b}Z`;
}

function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => entry && setWidth(Math.max(280, Math.floor(entry.contentRect.width))));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Grouped bar chart of monthly amounts, drawn as inline SVG.
 * One y-scale (starting at 0), token colours, a text legend, per-bar titles and a table view.
 */
export function MonthlyChart({
  title,
  groups,
  series,
  format,
  emptyText = "Nothing recorded in these months yet.",
}: {
  title: string;
  groups: ChartGroup[];
  series: ChartSeries[];
  format: (v: number) => string;
  emptyText?: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>(640);
  const uid = useId().replace(/:/g, "");
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;
  const hatchId = `${uid}-hatch`;

  const max = Math.max(0, ...groups.flatMap((g) => series.map((s) => g.values[s.key] ?? 0)));
  const top = niceMax(max, TICKS);
  const plotW = Math.max(1, width - M.left - M.right);
  const plotH = HEIGHT - M.top - M.bottom;
  const groupW = groups.length ? plotW / groups.length : plotW;
  const gap = 2;
  const barW = Math.max(2, Math.min(20, (groupW * 0.72 - gap * (series.length - 1)) / series.length));
  const clusterW = barW * series.length + gap * (series.length - 1);
  const y = (v: number) => (top ? (Math.max(0, v) / top) * plotH : 0);
  const baseline = M.top + plotH;

  const desc =
    top === 0
      ? `${emptyText}`
      : `${series.map((s) => s.label).join(", ")} by month, ${groups.length ? `${monthLabel(groups[0]!.month, true)} to ${monthLabel(groups[groups.length - 1]!.month, true)}` : ""}. Highest ${format(max)}.`;

  const tableColumns: ColumnDef<ChartGroup, unknown>[] = [
    { id: "month", header: "Month", cell: ({ row }) => monthLabel(row.original.month, true) },
    ...series.map(
      (s): ColumnDef<ChartGroup, unknown> => ({
        id: s.key,
        header: s.label,
        meta: { numeric: true },
        cell: ({ row }) => format(row.original.values[s.key] ?? 0),
      }),
    ),
  ];

  return (
    <div className="mchart">
      <ul className="mchart__legend" aria-label="Legend">
        {series.map((s) => (
          <li key={s.key}>
            <svg width="12" height="12" aria-hidden className="mchart__swatch">
              <rect width="12" height="12" rx="2" className={`mchart__bar--${s.tone}`} />
              {s.hatched && <rect width="12" height="12" rx="2" fill={`url(#${hatchId})`} />}
            </svg>
            {s.label}
          </li>
        ))}
      </ul>
      <div ref={ref} className="mchart__plot">
        <svg width={width} height={HEIGHT} role="img" aria-labelledby={`${titleId} ${descId}`} data-testid="monthly-chart">
          <title id={titleId}>{title}</title>
          <desc id={descId}>{desc}</desc>
          <defs>
            <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" className="mchart__hatch" />
            </pattern>
          </defs>
          {/* y grid + labels (recessive) */}
          {top > 0 &&
            Array.from({ length: TICKS + 1 }, (_, i) => {
              const v = (top / TICKS) * i;
              const ty = baseline - y(v);
              return (
                <g key={i} aria-hidden>
                  {i > 0 && <line x1={M.left} x2={M.left + plotW} y1={ty} y2={ty} className="mchart__grid" />}
                  <text x={M.left - 8} y={ty} dy="0.32em" textAnchor="end" className="mchart__axis">
                    {format(v)}
                  </text>
                </g>
              );
            })}
          <line x1={M.left} x2={M.left + plotW} y1={baseline} y2={baseline} className="mchart__baseline" aria-hidden />
          {groups.map((g, gi) => {
            const x0 = M.left + gi * groupW + (groupW - clusterW) / 2;
            return (
              <g key={g.month}>
                {series.map((s, si) => {
                  const v = g.values[s.key] ?? 0;
                  const h = y(v);
                  if (h <= 0) return null;
                  const x = x0 + si * (barW + gap);
                  const d = barPath(x, baseline - h, barW, h);
                  return (
                    <g key={s.key} data-series={s.key} data-value={v} data-height={h.toFixed(2)}>
                      <title>{`${s.label}, ${monthLabel(g.month, true)}: ${format(v)}`}</title>
                      <path d={d} className={`mchart__bar--${s.tone}`} />
                      {s.hatched && <path d={d} fill={`url(#${hatchId})`} />}
                    </g>
                  );
                })}
                <text x={M.left + gi * groupW + groupW / 2} y={baseline + 18} textAnchor="middle" className="mchart__axis" aria-hidden>
                  {monthLabel(g.month)}
                </text>
              </g>
            );
          })}
          {top === 0 && (
            <text x={M.left + plotW / 2} y={M.top + plotH / 2} textAnchor="middle" className="mchart__empty">
              {emptyText}
            </text>
          )}
        </svg>
      </div>
      <details className="mchart__table">
        <summary>Show as table</summary>
        <DataTable<ChartGroup> data={groups} rowKey={(g) => g.month} columns={tableColumns} caption={title} />
      </details>
    </div>
  );
}
