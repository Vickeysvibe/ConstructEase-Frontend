import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/app/auth";
import { today } from "@/lib/format";
import { PRESETS, presetRange, validateRange, type RangePreset } from "./dateRange";

const isPreset = (v: string | null): v is RangePreset => PRESETS.some((p) => p.value === v);

/**
 * Report date range kept in the URL (`range`, `from`, `to`) so a report is linkable.
 * Presets are recomputed from today in the org timezone; `custom` uses the URL dates.
 */
export function useReportRange() {
  const { session } = useAuth();
  const [sp, setSp] = useSearchParams();
  const todayStr = today(session?.org.timezone);
  const preset: RangePreset = isPreset(sp.get("range")) ? (sp.get("range") as RangePreset) : "this-month";
  const fallback = presetRange("this-month", todayStr)!;
  const range = preset === "custom" ? { from: sp.get("from") ?? fallback.from, to: sp.get("to") ?? fallback.to } : presetRange(preset, todayStr)!;
  const error = validateRange(range.from, range.to);

  const update = useCallback(
    (patch: Record<string, string | undefined>) =>
      setSp(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v) next.set(k, v);
            else next.delete(k);
          }
          return next;
        },
        { replace: true },
      ),
    [setSp],
  );

  const setPreset = (p: RangePreset) =>
    update(p === "custom" ? { range: "custom", from: range.from, to: range.to } : { range: p === "this-month" ? undefined : p, from: undefined, to: undefined });
  const setDates = (from: string, to: string) => update({ range: "custom", from, to });

  /** Query string carrying the range, for links between report tabs. */
  const search = useMemo(() => {
    const q = new URLSearchParams();
    for (const k of ["range", "from", "to"]) {
      const v = sp.get(k);
      if (v) q.set(k, v);
    }
    const s = q.toString();
    return s ? `?${s}` : "";
  }, [sp]);

  return { preset, from: range.from, to: range.to, error, valid: !error, setPreset, setDates, update, params: sp, search };
}
export type ReportRangeState = ReturnType<typeof useReportRange>;

