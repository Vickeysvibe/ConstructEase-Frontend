import { Link } from "react-router-dom";
import type { Ledger, LedgerRow, VendorLedgerSummary, VendorLedgerSummaryRow } from "@/lib/api/types";
import { date, money, titleCase } from "@/lib/format";
import { useSite } from "@/app/site";
import { DataTable, EmptyState, Field, Select, StatCard, type ColumnDef } from "@/ui";
import { DownloadButton, RangeFilter } from "./RangeFilter";
import { sum, useReport, useSiteParties } from "./reportHooks";

type Response = Ledger | VendorLedgerSummary;
const isLedger = (r: Response | undefined): r is Ledger => !!r && "entries" in r;

export default function VendorLedgerReport() {
  const vendors = useSiteParties("vendor");
  const { range, query, exportJob } = useReport<Response>("vendor-ledger", "Vendor ledger", ["vendorId"]);
  const vendorId = range.params.get("vendorId") ?? "";

  return (
    <div className="ce-stack">
      <RangeFilter range={range}>
        <Field label="Vendor">
          <Select
            value={vendorId}
            placeholder="All vendors (summary)"
            options={(vendors.data?.items ?? []).map((v) => ({ value: v.id, label: v.name }))}
            onChange={(e) => range.update({ vendorId: e.target.value || undefined })}
          />
        </Field>
      </RangeFilter>
      <div className="ce-row">
        <span className="ce-spacer" />
        <DownloadButton job={exportJob} disabled={!range.valid} />
      </div>
      {vendorId ? (
        <LedgerView data={isLedger(query.data) ? query.data : undefined} loading={query.isFetching} error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <SummaryView
          data={query.data && !isLedger(query.data) ? query.data : undefined}
          loading={query.isFetching}
          error={query.error}
          onRetry={() => void query.refetch()}
          onPick={(id) => range.update({ vendorId: id })}
        />
      )}
    </div>
  );
}

interface ViewProps<T> {
  data: T | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}

function LedgerView({ data, loading, error, onRetry }: ViewProps<Ledger>) {
  const site = useSite();
  const columns: ColumnDef<LedgerRow, unknown>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => date(row.original.date), meta: { footer: <strong>Total</strong> } },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => {
        const r = row.original;
        const to =
          r.sourceType === "goods_receipt" ? `purchasing/receipts/${r.sourceId}` : r.sourceType === "purchase_return" ? `purchasing/returns/${r.sourceId}` : null;
        return to ? <Link to={site.to(to)}>{r.reference}</Link> : r.reference;
      },
    },
    { accessorKey: "description", header: "Details", meta: { hideBelow: 800 }, cell: ({ row }) => row.original.description || titleCase(row.original.sourceType) },
    { accessorKey: "debitPaise", header: "Debit", meta: { numeric: true, footer: data && money(sum(data.entries, (e) => e.debitPaise)) }, cell: ({ row }) => (row.original.debitPaise ? money(row.original.debitPaise) : "") },
    { accessorKey: "creditPaise", header: "Credit", meta: { numeric: true, footer: data && money(sum(data.entries, (e) => e.creditPaise)) }, cell: ({ row }) => (row.original.creditPaise ? money(row.original.creditPaise) : "") },
    { accessorKey: "balancePaise", header: "Balance", meta: { numeric: true, hideBelow: 600, footer: data && <strong>{money(data.closingBalancePaise)}</strong> }, cell: ({ row }) => money(row.original.balancePaise) },
  ];
  return (
    <>
      {data && (
        <div className="ce-stats">
          <StatCard label={`Opening (${date(data.from)})`} value={<span className="ce-num">{money(data.openingBalancePaise)}</span>} />
          <StatCard label={`Closing (${date(data.to)})`} value={<span className="ce-num">{money(data.closingBalancePaise)}</span>} sub="What we still owe this vendor" />
        </div>
      )}
      <DataTable<LedgerRow>
        caption={data ? `Ledger for ${data.party.name}` : "Vendor ledger"}
        data={data?.entries}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        onRetry={onRetry}
        showFooter
        columns={columns}
        empty={<EmptyState plain title="No entries in this period" description="Goods received, returns and payments to this vendor appear here." />}
      />
    </>
  );
}

function SummaryView({ data, loading, error, onRetry, onPick }: ViewProps<VendorLedgerSummary> & { onPick: (id: string) => void }) {
  const t = data?.totals;
  const columns: ColumnDef<VendorLedgerSummaryRow, unknown>[] = [
    {
      accessorKey: "name",
      header: "Vendor",
      meta: { footer: <strong>Total</strong> },
      cell: ({ row }) => (
        <button type="button" className="report-link" onClick={() => onPick(row.original.vendorId)}>
          {row.original.name}
        </button>
      ),
    },
    { accessorKey: "openingBalancePaise", header: "Opening", meta: { numeric: true, hideBelow: 900, footer: t && money(t.openingBalancePaise) }, cell: ({ row }) => money(row.original.openingBalancePaise) },
    { accessorKey: "receivedPaise", header: "Received", meta: { numeric: true, footer: t && money(t.receivedPaise) }, cell: ({ row }) => money(row.original.receivedPaise) },
    { accessorKey: "returnedPaise", header: "Returned", meta: { numeric: true, hideBelow: 700, footer: t && money(t.returnedPaise) }, cell: ({ row }) => money(row.original.returnedPaise) },
    { accessorKey: "paidPaise", header: "Paid", meta: { numeric: true, hideBelow: 600, footer: t && money(t.paidPaise) }, cell: ({ row }) => money(row.original.paidPaise) },
    { accessorKey: "closingBalancePaise", header: "Closing", meta: { numeric: true, footer: t && <strong>{money(t.closingBalancePaise)}</strong> }, cell: ({ row }) => <strong>{money(row.original.closingBalancePaise)}</strong> },
  ];
  return (
    <DataTable<VendorLedgerSummaryRow>
      caption="Vendor balances"
      data={data?.rows}
      rowKey={(r) => r.vendorId}
      loading={loading}
      error={error}
      onRetry={onRetry}
      showFooter
      columns={columns}
      empty={<EmptyState plain title="No vendor activity in this period" description="Vendors you receive goods from or pay on this site appear here." />}
    />
  );
}
