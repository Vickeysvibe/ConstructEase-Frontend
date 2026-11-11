import type { ColumnDef } from "@/ui";
import { DataTable, EmptyState, Field, Select, Tabs } from "@/ui";
import type { LabourWagesReport as Report, LabourWagesRow } from "@/lib/api/types";
import { money, qty } from "@/lib/format";
import { DownloadButton, RangeFilter } from "./RangeFilter";
import { sumQty, useReport, useSiteParties } from "./reportHooks";

type View = "summary" | "matrix";

export default function LabourWagesReport() {
  const labour = useSiteParties("labour");
  const { range, query, exportJob: job } = useReport<Report>("labour-wages", "Labour wages report", ["category"]);
  const { data, isFetching, error, refetch } = query;
  const category = range.params.get("category") ?? "";
  const view: View = range.params.get("view") === "matrix" ? "matrix" : "summary";

  // The API reports labour without a trade as "Uncategorised" and accepts it as a filter value.
  const trades = [...new Set((labour.data?.items ?? []).map((p) => p.category?.trim() || "Uncategorised"))].sort();
  const totals = data?.totals;

  const summaryColumns: ColumnDef<LabourWagesRow, unknown>[] = [
    { accessorKey: "name", header: "Name", cell: ({ row }) => <strong>{row.original.name}</strong>, meta: { footer: <strong>Total</strong> } },
    { accessorKey: "category", header: "Trade", meta: { hideBelow: 700 }, cell: ({ row }) => row.original.category ?? "—" },
    { accessorKey: "days", header: "Days", meta: { numeric: true, hideBelow: 600 } },
    { accessorKey: "shifts", header: "Shifts", meta: { numeric: true, footer: totals && qty(totals.shifts) }, cell: ({ row }) => qty(row.original.shifts) },
    { accessorKey: "wagesPaise", header: "Wages", meta: { numeric: true, footer: totals && money(totals.wagesPaise) }, cell: ({ row }) => money(row.original.wagesPaise) },
    { accessorKey: "paidPaise", header: "Paid", meta: { numeric: true, hideBelow: 800, footer: totals && money(totals.paidPaise) }, cell: ({ row }) => money(row.original.paidPaise) },
    { accessorKey: "balancePaise", header: "Balance", meta: { numeric: true, footer: totals && <strong>{money(totals.balancePaise)}</strong> }, cell: ({ row }) => money(row.original.balancePaise) },
  ];

  const days = data?.days ?? [];
  const matrixColumns: ColumnDef<LabourWagesRow, unknown>[] = [
    { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="report-matrix__name">{row.original.name}</span>, meta: { footer: <strong>Total</strong> } },
    ...days.map(
      (d): ColumnDef<LabourWagesRow, unknown> => ({
        id: d,
        header: () => <abbr title={d}>{Number(d.slice(8, 10))}</abbr>,
        meta: { numeric: true, footer: qty(sumQty(data?.rows, (r) => r.shiftsByDate[d] ?? 0)) || "" },
        cell: ({ row }) => {
          const s = row.original.shiftsByDate[d];
          return s ? qty(s) : <span className="ce-muted" aria-label="none">·</span>;
        },
      }),
    ),
    { id: "shifts", header: "Shifts", meta: { numeric: true, footer: totals && <strong>{qty(totals.shifts)}</strong> }, cell: ({ row }) => <strong>{qty(row.original.shifts)}</strong> },
  ];

  return (
    <div className="ce-stack">
      <RangeFilter range={range}>
        <Field label="Trade">
          <Select
            value={category}
            placeholder="All trades"
            options={trades.map((t) => ({ value: t, label: t }))}
            onChange={(e) => range.update({ category: e.target.value || undefined })}
          />
        </Field>
      </RangeFilter>
      <div className="ce-row">
        <Tabs<View>
          label="Report layout"
          value={view}
          onChange={(v) => range.update({ view: v === "matrix" ? "matrix" : undefined })}
          tabs={[
            { value: "summary", label: "Summary" },
            { value: "matrix", label: "Day by day" },
          ]}
        />
        <span className="ce-spacer" />
        <DownloadButton job={job} disabled={!range.valid} />
      </div>
      <div className={view === "matrix" ? "report-matrix" : undefined}>
        <DataTable<LabourWagesRow>
          caption={view === "matrix" ? "Shifts per labourer per day" : "Labour wages"}
          data={range.valid ? data?.rows : []}
          rowKey={(r) => r.labourId}
          loading={isFetching}
          error={error}
          onRetry={() => void refetch()}
          showFooter
          columns={view === "matrix" ? matrixColumns : summaryColumns}
          empty={<EmptyState plain title="No attendance in this period" description="Wages appear here once attendance is marked for these dates." />}
        />
      </div>
    </div>
  );
}
