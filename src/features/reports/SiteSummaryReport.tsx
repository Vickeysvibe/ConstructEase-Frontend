import type { SiteSummaryReport as Report } from "@/lib/api/types";
import { money, moneyShort, qty } from "@/lib/format";
import { DataTable, EmptyState, ErrorState, LoadingBlock, StatCard, type ColumnDef } from "@/ui";
import { monthLabel } from "@/features/dashboard/chartScale";
import { DownloadButton, RangeFilter } from "./RangeFilter";
import { sum, useReport } from "./reportHooks";

type Month = Report["byMonth"][number];

export default function SiteSummaryReport() {
  const { range, query, exportJob } = useReport<Report>("site-summary", "Site summary");
  const d = query.data;
  const months = d?.byMonth;

  const columns: ColumnDef<Month, unknown>[] = [
    { accessorKey: "month", header: "Month", cell: ({ row }) => monthLabel(row.original.month, true), meta: { footer: <strong>Total</strong> } },
    { accessorKey: "materialsPaise", header: "Materials", meta: { numeric: true, footer: months && money(sum(months, (m) => m.materialsPaise)) }, cell: ({ row }) => money(row.original.materialsPaise) },
    { accessorKey: "wagesPaise", header: "Wages", meta: { numeric: true, footer: months && money(sum(months, (m) => m.wagesPaise)) }, cell: ({ row }) => money(row.original.wagesPaise) },
    { accessorKey: "paymentsOutPaise", header: "Paid out", meta: { numeric: true, hideBelow: 600, footer: months && money(sum(months, (m) => m.paymentsOutPaise)) }, cell: ({ row }) => money(row.original.paymentsOutPaise) },
    { accessorKey: "paymentsInPaise", header: "Received", meta: { numeric: true, hideBelow: 700, footer: months && money(sum(months, (m) => m.paymentsInPaise)) }, cell: ({ row }) => money(row.original.paymentsInPaise) },
  ];

  return (
    <div className="ce-stack">
      <RangeFilter range={range} />
      <div className="ce-row">
        <span className="ce-spacer" />
        <DownloadButton job={exportJob} disabled={!range.valid} />
      </div>
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : !d ? (
        range.valid && <LoadingBlock rows={4} />
      ) : (
        <>
          <div className="ce-stats">
            <StatCard label="Materials (net)" value={<span className="ce-num">{moneyShort(d.materials.netPaise)}</span>} sub={`${moneyShort(d.materials.receivedPaise)} received − ${moneyShort(d.materials.returnedPaise)} returned`} />
            <StatCard label="Wages" value={<span className="ce-num">{moneyShort(d.labour.wagesPaise)}</span>} sub={`${qty(d.labour.shifts)} shifts`} />
            <StatCard label="Paid out" value={<span className="ce-num">{moneyShort(d.payments.outPaise)}</span>} />
            <StatCard label="Received" value={<span className="ce-num">{moneyShort(d.payments.inPaise)}</span>} />
          </div>
          <DataTable<Month>
            caption="Site summary by month"
            data={months}
            rowKey={(m) => m.month}
            loading={query.isFetching}
            showFooter
            columns={columns}
            empty={<EmptyState plain title="Nothing recorded in this period" description="Materials, wages and payments are totalled here month by month." />}
          />
        </>
      )}
    </div>
  );
}
