import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays } from "@/lib/format";
import { Tooltip } from "./Tooltip";

/** ◀ [date] ▶ joined into one control, with a "Today" shortcut. Business dates (YYYY-MM-DD). */
export function DateStepper({
  value,
  onChange,
  max,
  today,
  label = "Date",
}: {
  value: string;
  onChange: (date: string) => void;
  max?: string;
  /** shows a "Today" button when value differs */
  today?: string;
  label?: string;
}) {
  const atMax = Boolean(max && value >= max);
  return (
    <div className="ce-datestep" role="group" aria-label={label}>
      <div className="ce-datestep__joined">
        <Tooltip content="Previous day" describe={false}>
          <button type="button" className="ce-datestep__btn" aria-label="Previous day" onClick={() => onChange(addDays(value, -1))}>
            <ChevronLeft aria-hidden />
          </button>
        </Tooltip>
        <input
          className="ce-datestep__input"
          type="date"
          aria-label={label}
          value={value}
          max={max}
          onChange={(e) => e.target.value && onChange(e.target.value)}
        />
        <Tooltip content="Next day" describe={false}>
          <button type="button" className="ce-datestep__btn" aria-label="Next day" disabled={atMax} onClick={() => onChange(addDays(value, 1))}>
            <ChevronRight aria-hidden />
          </button>
        </Tooltip>
      </div>
      {today && value !== today && (
        <button type="button" className="ce-datestep__today" onClick={() => onChange(today)}>
          Back to today
        </button>
      )}
    </div>
  );
}
