import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Pencil, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { List, Payment, PaymentCategory } from "@/lib/api/types";
import { date as fmtDate, money, today as todayIn } from "@/lib/format";
import { useListParams } from "@/lib/hooks";
import { useAuth } from "@/app/auth";
import { useSite } from "@/app/site";
import {
  Button,
  DataTable,
  EmptyState,
  Field,
  FormError,
  IconButton,
  Modal,
  PageHeader,
  DateRangeFilter,
  Select,
  StatusBadge,
  Textarea,
  errorMessage,
  notify,
  type ColumnDef,
} from "@/ui";
import { PaymentDrawer } from "./PaymentDrawer";
import { CATEGORY_OPTIONS, DIRECTION_OPTIONS, METHOD_OPTIONS, labelOf, partyKindFor } from "./paymentForm";
import { useSiteParties } from "./useSiteParties";
import "./finance.css";

type Filters = { category: string; direction: string; partyId: string; from: string; to: string; status: string };

function Amount({ p }: { p: Pick<Payment, "direction" | "amountPaise" | "status"> }) {
  return (
    <span className={`fin-amount fin-amount--${p.direction}`} data-void={p.status === "void" || undefined}>
      {p.direction === "in" ? "+" : "−"}
      {money(p.amountPaise)}
      <span className="ce-visually-hidden">{p.direction === "in" ? " received" : " paid out"}</span>
    </span>
  );
}

/** Site payments: filters in the URL, record / edit / void. */
export default function PaymentsPage() {
  const site = useSite();
  const { session } = useAuth();
  const todayStr = todayIn(session?.org.timezone);
  const qc = useQueryClient();
  const [params, setParams] = useListParams<Filters>({ sort: "-date" });
  // `?new=1` (from the dashboard's "Record payment") opens the form straight away.
  const [editing, setEditing] = useState<Payment | "new" | null>(() =>
    new URLSearchParams(window.location.search).get("new") === "1" && site.can("finance:write") ? "new" : null,
  );
  const [voiding, setVoiding] = useState<Payment | null>(null);
  const canWrite = site.can("finance:write");

  const query = useQuery({
    queryKey: ["payments", site.site.id, params],
    queryFn: () => api.get<List<Payment>>(`${site.base}/payments`, params),
    placeholderData: keepPreviousData,
  });
  const filterKind = partyKindFor((params.category as PaymentCategory) || "other");
  const parties = useSiteParties(filterKind);

  const items = query.data?.items;
  const totals = useMemo(() => {
    const t = { in: 0, out: 0 };
    for (const p of items ?? []) if (p.status === "posted") t[p.direction] += p.amountPaise;
    return t;
  }, [items]);
  const filtered = !!(params.q || params.category || params.direction || params.partyId || params.from || params.to || params.status);

  const columns = useMemo<ColumnDef<Payment, unknown>[]>(() => {
    const cols: ColumnDef<Payment, unknown>[] = [
      { id: "date", header: "Date", meta: { sortKey: "date" }, cell: ({ row }) => <span className="ce-num">{fmtDate(row.original.date)}</span> },
      {
        id: "party",
        header: "Party / description",
        cell: ({ row }) => {
          const p = row.original;
          const ledger = p.party && (p.party.kind === "vendor" || p.party.kind === "client");
          return (
            <div className="ce-stack" style={{ gap: 2 }}>
              {p.party ? (
                ledger ? (
                  <Link to={site.to(`finance/ledger/${p.party.id}`)}>
                    <strong>{p.party.name}</strong>
                  </Link>
                ) : (
                  <strong>{p.party.name}</strong>
                )
              ) : (
                <strong>{p.description || "Other"}</strong>
              )}
              {p.party && p.description && <span className="ce-muted fin-desc">{p.description}</span>}
              {p.reference && <span className="ce-muted fin-desc">Ref {p.reference}</span>}
              {p.status === "void" && p.voidReason && <span className="ce-muted fin-desc">Voided: {p.voidReason}</span>}
            </div>
          );
        },
      },
      { id: "category", header: "Category", meta: { hideBelow: 700 }, cell: ({ row }) => labelOf(CATEGORY_OPTIONS, row.original.category).replace(/ expense.*$/, "") },
      { id: "method", header: "Method", meta: { hideBelow: 900 }, cell: ({ row }) => (row.original.method ? labelOf(METHOD_OPTIONS, row.original.method) : "—") },
      { id: "amount", header: "Amount", meta: { numeric: true, sortKey: "amountPaise" }, cell: ({ row }) => <Amount p={row.original} /> },
      { id: "status", header: "Status", meta: { hideBelow: 560 }, cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    ];
    if (canWrite)
      cols.push({
        id: "actions",
        header: () => <span className="ce-visually-hidden">Actions</span>,
        size: 88,
        cell: ({ row }) =>
          row.original.status === "posted" ? (
            <div className="ce-row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
              <IconButton size="sm" label="Edit payment" icon={<Pencil />} onClick={() => setEditing(row.original)} />
              <IconButton size="sm" label="Void payment" icon={<Ban />} onClick={() => setVoiding(row.original)} />
            </div>
          ) : null,
      });
    return cols;
  }, [canWrite, site]);

  return (
    <div className="ce-page">
      <PageHeader
        title="Payments"
        description="Money paid to vendors and labour, received from clients, and other site expenses."
        actions={
          canWrite && (
            <Button variant="primary" icon={<Plus />} onClick={() => setEditing("new")}>
              Record payment
            </Button>
          )
        }
      />
      <DataTable
        columns={columns}
        data={items}
        rowKey={(p) => p.id}
        loading={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        page={params.page}
        pageSize={params.pageSize}
        total={query.data?.total}
        onPageChange={(page) => setParams({ page })}
        sort={params.sort}
        onSortChange={(sort) => setParams({ sort })}
        caption="Payments"
        search={{ value: params.q ?? "", onChange: (q) => setParams({ q }), placeholder: "Reference or description…", label: "Search payments" }}
        onPageSizeChange={(pageSize) => setParams({ pageSize })}
        filtersActive={filtered}
        onClearFilters={() => setParams({ q: undefined, category: undefined, direction: undefined, partyId: undefined, from: undefined, to: undefined, status: undefined })}
        filters={
          <>
            <Select
              aria-label="Category"
              value={params.category ?? ""}
              onChange={(e) => setParams({ category: e.target.value || undefined, partyId: undefined })}
              options={CATEGORY_OPTIONS}
              placeholder="All categories"
            />
            <Select
              aria-label="Direction"
              value={params.direction ?? ""}
              onChange={(e) => setParams({ direction: e.target.value || undefined })}
              options={DIRECTION_OPTIONS}
              placeholder="In and out"
            />
            {filterKind && (
              <Select
                aria-label={filterKind === "vendor" ? "Vendor" : filterKind === "client" ? "Client" : "Labourer"}
                value={params.partyId ?? ""}
                onChange={(e) => setParams({ partyId: e.target.value || undefined })}
                options={(parties.data?.items ?? []).map((p) => ({ value: p.id, label: p.name }))}
                placeholder={filterKind === "vendor" ? "All vendors" : filterKind === "client" ? "All clients" : "All labour"}
              />
            )}
            <Select
              aria-label="Status"
              value={params.status ?? ""}
              onChange={(e) => setParams({ status: e.target.value || undefined })}
              options={[
                { value: "posted", label: "Posted" },
                { value: "void", label: "Void" },
              ]}
              placeholder="Any status"
            />
            <DateRangeFilter from={params.from} to={params.to} onChange={setParams} />
          </>
        }
        summary={
          !!items?.length && (
            <>
              <span>
                In <strong className="fin-amount fin-amount--in">{money(totals.in)}</strong>
              </span>
              <span>
                Out <strong className="fin-amount fin-amount--out">{money(totals.out)}</strong>
              </span>
            </>
          )
        }
        empty={
          filtered ? (
            <EmptyState plain title="No payments match these filters" description="Widen the date range or clear the filters." />
          ) : (
            <EmptyState
              plain
              title="No payments yet"
              description="Vendor payments, client receipts, wages paid and other expenses for this site will appear here."
              action={
                canWrite ? (
                  <Button variant="primary" icon={<Plus />} onClick={() => setEditing("new")}>
                    Record payment
                  </Button>
                ) : undefined
              }
            />
          )
        }
      />
      {editing && <PaymentDrawer payment={editing === "new" ? null : editing} today={todayStr} onClose={() => setEditing(null)} />}
      {voiding && (
        <VoidDialog
          payment={voiding}
          onClose={() => setVoiding(null)}
          onDone={() => {
            setVoiding(null);
            void qc.invalidateQueries({ queryKey: ["payments", site.site.id] });
            void qc.invalidateQueries({ queryKey: ["ledger", site.site.id] });
            void qc.invalidateQueries({ queryKey: ["dashboard"] });
          }}
        />
      )}
    </div>
  );
}

/** Voiding needs a reason, so it's a small confirm dialog with one field. */
function VoidDialog({ payment, onClose, onDone }: { payment: Payment; onClose: () => void; onDone: () => void }) {
  const site = useSite();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const run = useMutation({
    mutationFn: () => api.post<Payment>(`${site.base}/payments/${payment.id}/void`, { reason: reason.trim() }),
    onSuccess: () => {
      notify.success(`Payment of ${money(payment.amountPaise)} voided.`);
      onDone();
    },
    onError: (e) => setError(errorMessage(e)),
  });
  return (
    <Modal
      open
      onClose={onClose}
      title="Void this payment?"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Keep payment
          </Button>
          <Button
            variant="danger"
            loading={run.isPending}
            onClick={() => (reason.trim() ? run.mutate() : setError("Give a reason for voiding."))}
          >
            Void payment
          </Button>
        </>
      }
    >
      <div className="ce-stack">
        <p>
          {money(payment.amountPaise)} {payment.party ? `${payment.direction === "in" ? "from" : "to"} ${payment.party.name}` : ""} on {fmtDate(payment.date)}.
          {payment.category === "vendor" || payment.category === "client" ? " Its ledger entry will be reversed." : ""} A voided payment can't be edited or
          restored.
        </p>
        <FormError message={error && reason.trim() ? error : null} />
        <Field label="Reason" required error={!reason.trim() && error ? error : undefined}>
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} data-autofocus />
        </Field>
      </div>
    </Modal>
  );
}
