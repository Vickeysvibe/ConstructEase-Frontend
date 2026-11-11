import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Ledger, LedgerRow } from "@/lib/api/types";
import { date as fmtDate, money, today as todayIn } from "@/lib/format";
import { useAuth } from "@/app/auth";
import { useSite } from "@/app/site";
import { useCrumbLabel } from "@/app/Breadcrumbs";
import { Badge, Button, Card, DataTable, EmptyState, ErrorState, Field, Input, LoadingBlock, PageHeader, StatCard, type ColumnDef } from "@/ui";
import { PaymentDrawer } from "./PaymentDrawer";
import { financialYearStart } from "./paymentForm";
import "./finance.css";

const SOURCE_LABEL: Record<LedgerRow["sourceType"], string> = {
  goods_receipt: "Goods receipt",
  purchase_return: "Purchase return",
  payment: "Payment",
  legacy: "Opening / imported",
};

/** Running account with one vendor or client on this site. */
export default function LedgerPage() {
  const site = useSite();
  const { session } = useAuth();
  const { partyId = "" } = useParams();
  const todayStr = todayIn(session?.org.timezone);
  const [sp, setSp] = useSearchParams();
  const to = sp.get("to") || todayStr;
  const from = sp.get("from") || financialYearStart(to);
  const [paying, setPaying] = useState(false);
  const setRange = (patch: { from?: string; to?: string }) =>
    setSp(
      (prev) => {
        const n = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v) n.set(k, v);
          else n.delete(k);
        }
        return n;
      },
      { replace: true },
    );

  const query = useQuery({
    queryKey: ["ledger", site.site.id, partyId, from, to],
    queryFn: () => api.get<Ledger>(`${site.base}/parties/${partyId}/ledger`, { from, to }),
    placeholderData: keepPreviousData,
  });
  const ledger = query.data;
  useCrumbLabel(ledger?.party.name);
  const totals = useMemo(
    () => (ledger?.entries ?? []).reduce((t, e) => ({ debit: t.debit + e.debitPaise, credit: t.credit + e.creditPaise }), { debit: 0, credit: 0 }),
    [ledger],
  );

  const columns = useMemo<ColumnDef<LedgerRow, unknown>[]>(
    () => [
      { id: "date", header: "Date", cell: ({ row }) => <span className="ce-num">{fmtDate(row.original.date)}</span> },
      {
        id: "ref",
        header: "Entry",
        cell: ({ row }) => {
          const e = row.original;
          const href =
            e.sourceType === "goods_receipt"
              ? site.to(`purchasing/receipts/${e.sourceId}`)
              : e.sourceType === "purchase_return"
                ? site.to(`purchasing/returns/${e.sourceId}`)
                : null;
          return (
            <div className="ce-stack" style={{ gap: 2 }}>
              <span>
                {SOURCE_LABEL[e.sourceType]}
                {e.reference && " · "}
                {e.reference && (href ? <Link to={href}>{e.reference}</Link> : e.reference)}
              </span>
              {e.description && <span className="ce-muted fin-desc">{e.description}</span>}
            </div>
          );
        },
      },
      { id: "debit", header: "Debit", meta: { numeric: true, hideBelow: 560 }, cell: ({ row }) => (row.original.debitPaise ? money(row.original.debitPaise) : "") },
      { id: "credit", header: "Credit", meta: { numeric: true, hideBelow: 560 }, cell: ({ row }) => (row.original.creditPaise ? money(row.original.creditPaise) : "") },
      {
        id: "balance",
        header: "Balance",
        meta: { numeric: true },
        cell: ({ row }) => <strong>{money(row.original.balancePaise)}</strong>,
      },
    ],
    [site],
  );

  if (query.isLoading) return <LoadingBlock rows={6} />;
  if (!ledger) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const vendor = ledger.party.kind === "vendor";
  const meaning = vendor
    ? "Balance is what you still owe this vendor: goods received add to it (credit); returns and payments to them reduce it (debit). A negative balance means you have paid in advance."
    : "Balance is the total received from this client in the period, after any refunds (payments out are debits).";

  return (
    <div className="ce-page">
      <PageHeader
        title={ledger.party.name}
        description={
          <span className="ce-row">
            <Badge tone="info">{vendor ? "Vendor" : "Client"}</Badge>
            {ledger.party.phone && <span className="ce-num">{ledger.party.phone}</span>}
            {ledger.party.gstIn && <span className="ce-num">GSTIN {ledger.party.gstIn}</span>}
          </span>
        }
        actions={
          site.can("finance:write") && (
            <Button variant="primary" icon={<Plus />} onClick={() => setPaying(true)}>
              {vendor ? "Pay vendor" : "Record receipt"}
            </Button>
          )
        }
      />
      <div className="fin-filters" role="group" aria-label="Ledger period">
        <Field label="From">
          <Input type="date" value={from} max={to} onChange={(e) => setRange({ from: e.target.value })} />
        </Field>
        <Field label="To">
          <Input type="date" value={to} min={from} onChange={(e) => setRange({ to: e.target.value })} />
        </Field>
      </div>
      {query.error && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
      <div className="ce-stats">
        <StatCard label={`Opening balance (${fmtDate(ledger.from)})`} value={money(ledger.openingBalancePaise)} />
        <StatCard label="Credits" value={money(totals.credit)} sub={vendor ? "goods received" : "received"} />
        <StatCard label="Debits" value={money(totals.debit)} sub={vendor ? "paid + returned" : "refunded"} />
        <StatCard label={`Closing balance (${fmtDate(ledger.to)})`} value={money(ledger.closingBalancePaise)} sub={vendor ? (ledger.closingBalancePaise >= 0 ? "you owe" : "paid in advance") : "total received"} />
      </div>
      <Card>
        <p className="ce-muted">{meaning}</p>
      </Card>
      <DataTable
        columns={columns}
        data={ledger.entries}
        rowKey={(e) => e.id}
        loading={query.isFetching}
        caption={`Ledger for ${ledger.party.name}`}
        empty={
          <EmptyState
            plain
            title="No entries in this period"
            description={vendor ? "Goods receipts, returns and payments to this vendor will appear here." : "Payments received from this client will appear here."}
          />
        }
      />
      {paying && (
        <PaymentDrawer
          payment={null}
          today={todayStr}
          preset={{ category: vendor ? "vendor" : "client", partyId: ledger.party.id }}
          onClose={() => setPaying(false)}
        />
      )}
    </div>
  );
}
