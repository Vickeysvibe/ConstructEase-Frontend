import type { ReactNode } from "react";
import { Download } from "lucide-react";
import type { useExportJob } from "@/lib/hooks";
import { Button, Field, FormError, Input, Select } from "@/ui";
import { PRESETS, type RangePreset } from "./dateRange";
import type { ReportRangeState } from "./useReportRange";

/** Shared filter bar: preset + from/to, plus any report-specific filters passed as children. */
export function RangeFilter({ range, children }: { range: ReportRangeState; children?: ReactNode }) {
  return (
    <div className="ce-stack">
      <div className="report-filters">
        <Field label="Period">
          <Select value={range.preset} options={PRESETS} onChange={(e) => range.setPreset(e.target.value as RangePreset)} />
        </Field>
        <Field label="From">
          <Input type="date" value={range.from} max={range.to} onChange={(e) => range.setDates(e.target.value, range.to)} />
        </Field>
        <Field label="To">
          <Input type="date" value={range.to} min={range.from} onChange={(e) => range.setDates(range.from, e.target.value)} />
        </Field>
        {children}
      </div>
      <FormError message={range.error} />
    </div>
  );
}

export function DownloadButton({ job, disabled }: { job: ReturnType<typeof useExportJob>; disabled?: boolean }) {
  return (
    <Button icon={<Download />} loading={job.isPending} disabled={disabled} onClick={() => job.mutate()}>
      Download Excel
    </Button>
  );
}
