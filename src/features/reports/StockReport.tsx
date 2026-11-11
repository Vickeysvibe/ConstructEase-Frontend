import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { StockItem, StockReport as Report, StockReportRow } from "@/lib/api/types";
import { money, qty } from "@/lib/format";
import { useSite } from "@/app/site";
import { DataTable, EmptyState, Field, Select, type ColumnDef } from "@/ui";
import { DownloadButton, RangeFilter } from "./RangeFilter";
import { sum, useReport } from "./reportHooks";

export default function StockReport() {
  const site = useSite();
  const products = useQuery({
    queryKey: ["stock", site.site.id, "options"],
    queryFn: () => api.get<{ items: StockItem[] }>(`${site.base}/stock`),
    staleTime: 60_000,
  });
  const { range, query, exportJob } = useReport<Report>("stock", "Stock report", ["productId"]);
  const rows = query.data?.rows;
  const q = (pick: (r: StockReportRow) => number) => ({ row }: { row: { original: StockReportRow } }) => qty(pick(row.original), row.original.unit);

  const columns: ColumnDef<StockReportRow, unknown>[] = [
    { accessorKey: "productName", header: "Material", cell: ({ row }) => <strong>{row.original.productName}</strong>, meta: { footer: <strong>Total</strong> } },
    { accessorKey: "openingQty", header: "Opening", meta: { numeric: true, hideBelow: 800 }, cell: q((r) => r.openingQty) },
    { accessorKey: "receivedQty", header: "Received", meta: { numeric: true, hideBelow: 600 }, cell: q((r) => r.receivedQty) },
    { accessorKey: "returnedQty", header: "Returned", meta: { numeric: true, hideBelow: 1000 }, cell: q((r) => r.returnedQty) },
    { accessorKey: "consumedQty", header: "Consumed", meta: { numeric: true, hideBelow: 700 }, cell: q((r) => r.consumedQty) },
    { accessorKey: "adjustedQty", header: "Adjusted", meta: { numeric: true, hideBelow: 1000 }, cell: q((r) => r.adjustedQty) },
    { accessorKey: "closingQty", header: "Closing", meta: { numeric: true }, cell: q((r) => r.closingQty) },
    { accessorKey: "avgCostPaise", header: "Avg cost", meta: { numeric: true, hideBelow: 1100 }, cell: ({ row }) => money(row.original.avgCostPaise) },
    {
      accessorKey: "closingValuePaise",
      header: "Value",
      meta: { numeric: true, footer: query.data && <strong>{money(query.data.totals?.closingValuePaise ?? sum(rows, (r) => r.closingValuePaise))}</strong> },
      cell: ({ row }) => money(row.original.closingValuePaise),
    },
  ];

  return (
    <div className="ce-stack">
      <RangeFilter range={range}>
        <Field label="Material">
          <Select
            value={range.params.get("productId") ?? ""}
            placeholder="All materials"
            options={(products.data?.items ?? []).map((p) => ({ value: p.productId, label: p.productName }))}
            onChange={(e) => range.update({ productId: e.target.value || undefined })}
          />
        </Field>
      </RangeFilter>
      <div className="ce-row">
        <span className="ce-spacer" />
        <DownloadButton job={exportJob} disabled={!range.valid} />
      </div>
      <DataTable<StockReportRow>
        caption="Stock movement by material"
        data={rows}
        rowKey={(r) => r.productId}
        loading={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        showFooter
        columns={columns}
        empty={<EmptyState plain title="No stock movement in this period" description="Materials received, returned, consumed or adjusted on this site appear here." />}
      />
    </div>
  );
}
