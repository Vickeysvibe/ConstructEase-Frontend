import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { List, MovementType, StockItem, StockMovement } from "@/lib/api/types";
import { date, money } from "@/lib/format";
import { useListParams } from "@/lib/hooks";
import { useSite, type SiteContextValue } from "@/app/site";
import { Badge, DataTable, EmptyState, PageHeader, Select, type ColumnDef, type Tone, DateRangeFilter } from "@/ui";

import { keys } from "@/features/purchasing/lib";
import { SignedQty } from "./StockForms";
import "./stock.css";

const TYPES: Record<MovementType, { label: string; tone: Tone }> = {
  receipt: { label: "Received", tone: "ok" },
  return: { label: "Returned", tone: "warn" },
  consumption: { label: "Used", tone: "info" },
  adjustment: { label: "Adjusted", tone: "neutral" },
};

/** Where a movement came from, linked when it has a document page. */
function sourceLink(m: StockMovement, site: SiteContextValue) {
  if (m.sourceId && m.sourceType === "goods_receipt") return site.to(`purchasing/receipts/${m.sourceId}`);
  if (m.sourceId && m.sourceType === "purchase_return") return site.to(`purchasing/returns/${m.sourceId}`);
  return null;
}

/** Every change to stock on this site, newest first. */
export default function MovementsPage() {
  const site = useSite();
  const [params, setParams] = useListParams<{ productId: string; type: string; from: string; to: string }>({ pageSize: 50 });
  const showCost = site.can("finance:read");
  const query = useQuery({
    queryKey: [...keys.movements(site), params],
    queryFn: () => api.get<List<StockMovement>>(`${site.base}/stock/movements`, params),
    placeholderData: keepPreviousData,
  });
  const products = useQuery({
    queryKey: [...keys.stock(site), { q: undefined }],
    queryFn: () => api.get<{ items: StockItem[] }>(`${site.base}/stock`),
  });
  const filtered = Boolean(params.productId || params.type || params.from || params.to);

  const columns: ColumnDef<StockMovement, unknown>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => date(row.original.date) },
    { accessorKey: "productName", header: "Material", cell: ({ row }) => <strong>{row.original.productName}</strong> },
    {
      accessorKey: "type",
      header: "Type",
      meta: { hideBelow: 600 },
      cell: ({ row }) => <Badge tone={TYPES[row.original.type]?.tone ?? "neutral"}>{TYPES[row.original.type]?.label ?? row.original.type}</Badge>,
    },
    { accessorKey: "qty", header: "Qty", meta: { numeric: true }, cell: ({ row }) => <SignedQty value={row.original.qty} unit={row.original.unit} /> },
    ...(showCost
      ? ([
          { accessorKey: "unitCostPaise", header: "Unit cost", meta: { numeric: true, hideBelow: 900 }, cell: ({ row }) => money(row.original.unitCostPaise) },
        ] satisfies ColumnDef<StockMovement, unknown>[])
      : []),
    {
      accessorKey: "reference",
      header: "Reference",
      meta: { hideBelow: 700 },
      cell: ({ row }) => {
        const m = row.original;
        const to = sourceLink(m, site);
        const ref = to ? (
          <Link to={to} className="ce-num">
            {m.reference}
          </Link>
        ) : (
          m.reference || "—"
        );
        return (
          <div>
            {ref}
            {m.notes && <div className="ce-muted pur-hint">{m.notes}</div>}
          </div>
        );
      },
    },
    { id: "by", header: "By", meta: { hideBelow: 1000 }, cell: ({ row }) => row.original.createdBy.name || "—" },
  ];

  return (
    <div className="ce-page">
      <PageHeader title="Stock movements" description="Every receipt, return, use and adjustment, newest first." />
      <DataTable
        columns={columns}
        data={query.data?.items}
        rowKey={(m) => m.id}
        loading={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        page={params.page}
        pageSize={params.pageSize}
        total={query.data?.total}
        onPageChange={(page) => setParams({ page })}
        onPageSizeChange={(pageSize) => setParams({ pageSize })}
        filtersActive={Boolean(params.productId || params.type || params.from || params.to)}
        onClearFilters={() => setParams({ productId: undefined, type: undefined, from: undefined, to: undefined })}
        filters={
          <>
            <Select
              aria-label="Material"
              value={params.productId ?? ""}
              onChange={(e) => setParams({ productId: e.target.value })}
              placeholder="All materials"
              options={(products.data?.items ?? []).map((p) => ({ value: p.productId, label: p.productName }))}
            />
            <Select
              aria-label="Movement type"
              value={params.type ?? ""}
              onChange={(e) => setParams({ type: e.target.value })}
              placeholder="All types"
              options={(Object.entries(TYPES) as [MovementType, { label: string }][]).map(([value, t]) => ({ value, label: t.label }))}
            />
            <DateRangeFilter from={params.from} to={params.to} onChange={setParams} />
          </>
        }
        empty={
          filtered ? (
            <EmptyState plain title="No movements match these filters" description="Widen the dates or clear the filters." />
          ) : (
            <EmptyState plain title="No stock movements yet" description="Receipts, returns, usage and adjustments will be listed here." />
          )
        }
      />
    </div>
  );
}
