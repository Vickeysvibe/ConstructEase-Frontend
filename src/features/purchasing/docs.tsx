/** Goods receipts and purchase returns share their list and detail layouts. */
import { Link, useNavigate, useParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { GoodsReceipt, GoodsReceiptSummary, JobRef, List, PurchaseReturn, PurchaseReturnSummary } from "@/lib/api/types";
import { date, dateTime, money } from "@/lib/format";
import { useListParams } from "@/lib/hooks";
import { useSite } from "@/app/site";
import { ButtonLink, Card, DataTable, DescriptionList, EmptyState, ErrorState, LoadingBlock, PageHeader, SearchInput, type ColumnDef } from "@/ui";
import { DateRangeFilter, DocLinesTable, PdfButton } from "./components";
import { keys } from "./lib";

type Kind = "receipt" | "return";
type Summary = GoodsReceiptSummary | PurchaseReturnSummary;

const CONFIG = {
  receipt: {
    title: "Goods receipts",
    singular: "Goods receipt",
    description: "Material that arrived at site against purchase orders.",
    api: "goods-receipts",
    route: "purchasing/receipts",
    key: keys.receipts,
    search: "GR, PO, vendor or challan…",
    empty: "When goods arrive, open the purchase order and choose Receive goods.",
  },
  return: {
    title: "Returns",
    singular: "Purchase return",
    description: "Material sent back to vendors.",
    api: "purchase-returns",
    route: "purchasing/returns",
    key: keys.returns,
    search: "Return, PO or vendor…",
    empty: "To send goods back, open the purchase order and choose Return goods.",
  },
} as const;

export function DocsListPage({ kind }: { kind: Kind }) {
  const c = CONFIG[kind];
  const site = useSite();
  const navigate = useNavigate();
  const [params, setParams] = useListParams<{ from: string; to: string }>();
  const query = useQuery({
    queryKey: [...c.key(site), params],
    queryFn: () => api.get<List<Summary>>(`${site.base}/${c.api}`, params),
    placeholderData: keepPreviousData,
  });
  const filtered = Boolean(params.q || params.from || params.to);
  const columns: ColumnDef<Summary, unknown>[] = [
    { accessorKey: "number", header: "Number", meta: { sortKey: "number" }, cell: ({ row }) => <strong className="ce-num">{row.original.number}</strong> },
    { accessorKey: "date", header: "Date", meta: { sortKey: "date" }, cell: ({ row }) => date(row.original.date) },
    {
      accessorKey: "poNumber",
      header: "PO",
      meta: { hideBelow: 700 },
      cell: ({ row }) => (
        <Link to={site.to(`purchasing/orders/${row.original.poId}`)} className="ce-num">
          {row.original.poNumber}
        </Link>
      ),
    },
    { id: "vendor", header: "Vendor", meta: { hideBelow: 500 }, cell: ({ row }) => row.original.vendor.name },
    ...(kind === "receipt"
      ? [{ id: "challan", header: "Challan", meta: { hideBelow: 1000 }, cell: ({ row }: { row: { original: Summary } }) => ("challanNo" in row.original && row.original.challanNo) || "—" }]
      : [{ id: "reason", header: "Reason", meta: { hideBelow: 1000 }, cell: ({ row }: { row: { original: Summary } }) => ("reason" in row.original && row.original.reason) || "—" }]),
    { accessorKey: "lineCount", header: "Lines", meta: { numeric: true, hideBelow: 900 } },
    { accessorKey: "totalPaise", header: "Total", meta: { numeric: true, sortKey: "totalPaise" }, cell: ({ row }) => money(row.original.totalPaise) },
  ];
  return (
    <div className="ce-page">
      <PageHeader title={c.title} description={c.description} />
      <DataTable
        columns={columns}
        data={query.data?.items}
        rowKey={(r) => r.id}
        loading={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        page={params.page}
        pageSize={params.pageSize}
        total={query.data?.total}
        onPageChange={(page) => setParams({ page })}
        sort={params.sort}
        onSortChange={(sort) => setParams({ sort })}
        onRowClick={(r) => navigate(site.to(`${c.route}/${r.id}`))}
        toolbar={
          <div className="pur-filters">
            <SearchInput value={params.q ?? ""} onChange={(q) => setParams({ q })} placeholder={c.search} label={`Search ${c.title.toLowerCase()}`} />
            <DateRangeFilter from={params.from} to={params.to} onChange={setParams} />
          </div>
        }
        empty={
          filtered ? (
            <EmptyState plain title={`No ${c.title.toLowerCase()} match these filters`} description="Clear the search or widen the dates." />
          ) : (
            <EmptyState
              plain
              title={`No ${c.title.toLowerCase()} yet`}
              description={c.empty}
              action={<ButtonLink to={site.to("purchasing/orders")}>Open purchase orders</ButtonLink>}
            />
          )
        }
      />
    </div>
  );
}

export function DocDetailPage({ kind }: { kind: Kind }) {
  const c = CONFIG[kind];
  const site = useSite();
  const params = useParams();
  const id = kind === "receipt" ? params.receiptId : params.returnId;
  const query = useQuery({
    queryKey: [...c.key(site), id],
    queryFn: () => api.get<GoodsReceipt | PurchaseReturn>(`${site.base}/${c.api}/${id}`),
  });
  const doc = query.data;
  const crumbs = <Link to={site.to(c.route)}>{c.title}</Link>;
  if (query.isPending) return <LoadingBlock rows={6} />;
  if (query.error || !doc)
    return (
      <div className="ce-page">
        <PageHeader title={c.singular} crumbs={crumbs} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  const items = [
    {
      label: "Purchase order",
      value: (
        <Link to={site.to(`purchasing/orders/${doc.poId}`)} className="ce-num">
          {doc.poNumber}
        </Link>
      ),
    },
    { label: "Vendor", value: doc.vendor.name },
    { label: "Date", value: date(doc.date) },
    ...("challanNo" in doc || kind === "receipt"
      ? [
          { label: "Challan / DC no.", value: ("challanNo" in doc && doc.challanNo) || "—" },
          { label: "Vehicle no.", value: ("vehicleNo" in doc && doc.vehicleNo) || "—" },
        ]
      : [{ label: "Reason", value: ("reason" in doc && doc.reason) || "—" }]),
    { label: kind === "receipt" ? "Received by" : "Recorded by", value: `${doc.createdBy.name || "—"} · ${dateTime(doc.createdAt)}` },
    ...(doc.notes ? [{ label: "Notes", value: doc.notes }] : []),
  ];
  return (
    <div className="ce-page">
      <PageHeader
        title={<span className="ce-num">{doc.number}</span>}
        crumbs={crumbs}
        actions={
          kind === "return" ? (
            <PdfButton label={`${doc.number} PDF`} templates={["classic"]} start={(template) => api.post<JobRef>(`${site.base}/${c.api}/${doc.id}/pdf`, { template })} />
          ) : undefined
        }
      />
      <Card>
        <DescriptionList items={items} />
      </Card>
      <DocLinesTable lines={doc.lines} totals={doc} />
    </div>
  );
}
