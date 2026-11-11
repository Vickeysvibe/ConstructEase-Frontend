import type { Payment, PaymentsReport as Report } from "@/lib/api/types";
import { date, money, titleCase } from "@/lib/format";
import { Badge, Card, DataTable, EmptyState, Field, Select, StatCard, type ColumnDef } from "@/ui";
import { DownloadButton, RangeFilter } from "./RangeFilter";
import { useReport } from "./reportHooks";

const CATEGORY_OPTIONS = ["vendor", "client", "labour", "other"].map((c) => ({ value: c, label: titleCase(c) }));
const DIRECTION_OPTIONS = [
  { value: "out", label: "Paid out" },
  { value: "in", label: "Received" },
];
type ByCategory = Report["totals"]["byCategory"][number];

export default function PaymentsReport() {
  const { range, query, exportJob } = useReport<Report>("payments", "Payments report", ["category", "direction"]);
  const { data } = query;
  const t = data?.totals;

  const columns: ColumnDef<Payment, unknown>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => date(row.original.date), meta: { footer: <strong>Total</strong> } },
    {
      id: "party",
      header: "Paid to / from",
      cell: ({ row }) => row.original.party?.name ?? row.original.description ?? "—",
    },
    { accessorKey: "category", header: "Category", meta: { hideBelow: 700 }, cell: ({ row }) => titleCase(row.original.category) },
    { accessorKey: "method", header: "Method", meta: { hideBelow: 900 }, cell: ({ row }) => (row.original.method ? titleCase(row.original.method) : "—") },
    { accessorKey: "reference", header: "Reference", meta: { hideBelow: 1000 }, cell: ({ row }) => row.original.reference ?? "—" },
    {
      id: "in",
      header: "In",
      meta: { numeric: true, footer: t && money(t.inPaise) },
      cell: ({ row }) => (row.original.direction === "in" ? money(row.original.amountPaise) : ""),
    },
    {
      id: "out",
      header: "Out",
      meta: { numeric: true, footer: t && money(t.outPaise) },
      cell: ({ row }) => (
        <>
          {row.original.direction === "out" ? money(row.original.amountPaise) : ""}
          {row.original.status === "void" && (
            <>
              {" "}
              <Badge tone="danger">Void</Badge>
            </>
          )}
        </>
      ),
    },
  ];

  const categoryColumns: ColumnDef<ByCategory, unknown>[] = [
    { accessorKey: "category", header: "Category", cell: ({ row }) => titleCase(row.original.category) },
    { accessorKey: "inPaise", header: "In", meta: { numeric: true }, cell: ({ row }) => money(row.original.inPaise) },
    { accessorKey: "outPaise", header: "Out", meta: { numeric: true }, cell: ({ row }) => money(row.original.outPaise) },
  ];

  return (
    <div className="ce-stack">
      <RangeFilter range={range}>
        <Field label="Category">
          <Select
            value={range.params.get("category") ?? ""}
            placeholder="All categories"
            options={CATEGORY_OPTIONS}
            onChange={(e) => range.update({ category: e.target.value || undefined })}
          />
        </Field>
        <Field label="Direction">
          <Select
            value={range.params.get("direction") ?? ""}
            placeholder="In and out"
            options={DIRECTION_OPTIONS}
            onChange={(e) => range.update({ direction: e.target.value || undefined })}
          />
        </Field>
      </RangeFilter>
      <div className="ce-row">
        <span className="ce-spacer" />
        <DownloadButton job={exportJob} disabled={!range.valid} />
      </div>
      {t && (
        <div className="ce-grid-2">
          <div className="ce-stats">
            <StatCard label="Received" value={<span className="ce-num">{money(t.inPaise)}</span>} />
            <StatCard label="Paid out" value={<span className="ce-num">{money(t.outPaise)}</span>} />
          </div>
          <Card title="By category" flush>
            <DataTable<ByCategory>
              caption="Totals by category"
              data={t.byCategory}
              rowKey={(r) => r.category}
              columns={categoryColumns}
              empty={<EmptyState plain title="No payments" />}
            />
          </Card>
        </div>
      )}
      <DataTable<Payment>
        caption="Payments"
        data={data?.rows}
        rowKey={(r) => r.id}
        loading={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        showFooter
        columns={columns}
        empty={<EmptyState plain title="No payments in this period" description="Payments recorded under Finance → Payments appear here." />}
      />
    </div>
  );
}
