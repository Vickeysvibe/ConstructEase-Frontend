import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ClipboardMinus, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api/client";
import type { StockItem } from "@/lib/api/types";
import { money, qty } from "@/lib/format";
import { useListParams } from "@/lib/hooks";
import { useSite } from "@/app/site";
import { Button, ButtonLink, DataTable, EmptyState, PageHeader, Select, type ColumnDef } from "@/ui";
import { keys } from "@/features/purchasing/lib";
import { AdjustStockModal, RecordUsageModal } from "./StockForms";
import "@/features/purchasing/purchasing.css";
import "./stock.css";

/** What is on site now, per material: received − returned − used ± adjustments. */
export default function StockPage() {
  const site = useSite();
  const navigate = useNavigate();
  const [params, setParams] = useListParams<{ category: string }>();
  const [open, setOpen] = useState<"usage" | "adjust" | null>(null);
  const showCost = site.can("finance:read");
  const canUse = site.can("receiving:write");
  const canAdjust = site.can("stock:adjust");

  const query = useQuery({
    queryKey: [...keys.stock(site), { q: params.q }],
    queryFn: () => api.get<{ items: StockItem[] }>(`${site.base}/stock`, { q: params.q }),
    placeholderData: keepPreviousData,
  });
  const all = query.data?.items;
  const categories = useMemo(() => [...new Set((all ?? []).map((i) => i.category).filter((c): c is string => Boolean(c)))].sort(), [all]);
  const items = useMemo(() => (params.category ? all?.filter((i) => i.category === params.category) : all), [all, params.category]);
  const totalValue = (items ?? []).reduce((s, i) => s + i.valuePaise, 0);

  const columns: ColumnDef<StockItem, unknown>[] = [
    { accessorKey: "productName", header: "Material", meta: { footer: showCost ? "Total" : undefined }, cell: ({ row }) => <strong>{row.original.productName}</strong> },
    { accessorKey: "category", header: "Category", meta: { hideBelow: 900 }, cell: ({ row }) => row.original.category ?? "—" },
    { accessorKey: "receivedQty", header: "Received", meta: { numeric: true, hideBelow: 700 }, cell: ({ row }) => qty(row.original.receivedQty) },
    { accessorKey: "returnedQty", header: "Returned", meta: { numeric: true, hideBelow: 1100 }, cell: ({ row }) => qty(row.original.returnedQty) },
    { accessorKey: "consumedQty", header: "Used", meta: { numeric: true, hideBelow: 700 }, cell: ({ row }) => qty(row.original.consumedQty) },
    { accessorKey: "adjustedQty", header: "Adjusted", meta: { numeric: true, hideBelow: 1100 }, cell: ({ row }) => qty(row.original.adjustedQty) },
    {
      accessorKey: "onHandQty",
      header: "On hand",
      meta: { numeric: true },
      cell: ({ row }) => {
        const i = row.original;
        return i.onHandQty <= 0 ? (
          <span className="stk-low">
            {qty(i.onHandQty, i.unit)} <span className="ce-visually-hidden">(out of stock)</span>
          </span>
        ) : (
          qty(i.onHandQty, i.unit)
        );
      },
    },
    ...(showCost
      ? ([
          { accessorKey: "avgCostPaise", header: "Avg cost", meta: { numeric: true, hideBelow: 900 }, cell: ({ row }) => money(row.original.avgCostPaise) },
          { accessorKey: "valuePaise", header: "Value", meta: { numeric: true, footer: money(totalValue) }, cell: ({ row }) => money(row.original.valuePaise) },
        ] satisfies ColumnDef<StockItem, unknown>[])
      : []),
  ];

  return (
    <div className="ce-page">
      <PageHeader
        title="Stock on hand"
        description="Worked out from goods received, returned, used and adjusted on this site."
        actions={
          <>
            <ButtonLink to={site.to("stock/movements")}>Movements</ButtonLink>
            {canAdjust && (
              <Button icon={<SlidersHorizontal />} disabled={!all?.length} onClick={() => setOpen("adjust")}>
                Adjust stock
              </Button>
            )}
            {canUse && (
              <Button variant="primary" icon={<ClipboardMinus />} disabled={!all?.length} onClick={() => setOpen("usage")}>
                Record usage
              </Button>
            )}
          </>
        }
      />
      <DataTable
        columns={columns}
        data={items}
        rowKey={(i) => i.productId}
        loading={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        showFooter={showCost}
        onRowClick={(i) => navigate(`${site.to("stock/movements")}?productId=${i.productId}`)}
        search={{ value: params.q ?? "", onChange: (q) => setParams({ q }), placeholder: "Material or category…", label: "Search stock" }}
        filters={
          <>
            {categories.length > 0 && (
              <Select aria-label="Category" value={params.category ?? ""} onChange={(e) => setParams({ category: e.target.value })} placeholder="All categories" options={categories.map((c) => ({ value: c, label: c }))} />
            )}
          </>
        }
        empty={
          params.q || params.category ? (
            <EmptyState plain title="No materials match" description="Try a shorter search or another category." />
          ) : (
            <EmptyState
              plain
              title="No stock on this site yet"
              description="Stock appears here once goods are received against a purchase order."
              action={<ButtonLink to={site.to("purchasing/orders")}>Open purchase orders</ButtonLink>}
            />
          )
        }
      />
      {open === "usage" && all && <RecordUsageModal items={all} onClose={() => setOpen(null)} />}
      {open === "adjust" && all && <AdjustStockModal items={all} onClose={() => setOpen(null)} />}
    </div>
  );
}
