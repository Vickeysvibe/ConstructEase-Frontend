import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { List, POStatus, PurchaseOrderSummary } from "@/lib/api/types";
import { date, money } from "@/lib/format";
import { useListParams } from "@/lib/hooks";
import { useSite } from "@/app/site";
import { ButtonLink, DataTable, EmptyState, PageHeader, Select, StatusBadge, Tabs, type ColumnDef, DateRangeFilter } from "@/ui";

import { PO_STATUS_LABELS, keys, useSiteVendors } from "./lib";

type StatusTab = POStatus | "all";
const TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "All" },
  ...(Object.entries(PO_STATUS_LABELS) as [POStatus, string][]).map(([value, label]) => ({ value, label })),
];

/** Purchase orders of this site with status / vendor / date filters. */
export default function OrdersPage() {
  const site = useSite();
  const navigate = useNavigate();
  const [params, setParams] = useListParams<{ status: string; vendorId: string; from: string; to: string }>();
  const vendors = useSiteVendors(site);
  const canWrite = site.can("purchasing:write");
  const query = useQuery({
    queryKey: [...keys.orders(site), params],
    queryFn: () => api.get<List<PurchaseOrderSummary>>(`${site.base}/purchase-orders`, params),
    placeholderData: keepPreviousData,
  });
  const filtered = Boolean(params.q || params.status || params.vendorId || params.from || params.to);

  const columns: ColumnDef<PurchaseOrderSummary, unknown>[] = [
    { accessorKey: "number", header: "PO", meta: { sortKey: "number" }, cell: ({ row }) => <strong className="ce-num">{row.original.number}</strong> },
    { id: "vendor", header: "Vendor", cell: ({ row }) => row.original.vendor.name },
    { accessorKey: "date", header: "Date", meta: { sortKey: "date", hideBelow: 600 }, cell: ({ row }) => date(row.original.date) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} label={PO_STATUS_LABELS[row.original.status]} /> },
    { accessorKey: "lineCount", header: "Lines", meta: { numeric: true, hideBelow: 900 } },
    { accessorKey: "totalPaise", header: "Total", meta: { numeric: true, sortKey: "totalPaise" }, cell: ({ row }) => money(row.original.totalPaise) },
  ];

  const newButton = canWrite && (
    <ButtonLink variant="primary" icon={<Plus />} to={site.to("purchasing/orders/new")}>
      New purchase order
    </ButtonLink>
  );

  return (
    <div className="ce-page">
      <PageHeader title="Purchase orders" description="Orders raised with your vendors, and how much has arrived." actions={newButton} />
      <Tabs<StatusTab> label="Order status" value={(params.status as StatusTab | undefined) ?? "all"} onChange={(v) => setParams({ status: v === "all" ? undefined : v })} tabs={TABS} />
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
        onRowClick={(r) => navigate(site.to(`purchasing/orders/${r.id}`))}
        search={{ value: params.q ?? "", onChange: (q) => setParams({ q }), placeholder: "PO number or vendor…", label: "Search purchase orders" }}
        onPageSizeChange={(pageSize) => setParams({ pageSize })}
        filtersActive={Boolean(params.vendorId || params.from || params.to)}
        onClearFilters={() => setParams({ vendorId: undefined, from: undefined, to: undefined })}
        filters={
          <>
            <Select
              aria-label="Vendor"
              value={params.vendorId ?? ""}
              onChange={(e) => setParams({ vendorId: e.target.value })}
              placeholder="All vendors"
              options={(vendors.data?.items ?? []).map((v) => ({ value: v.id, label: v.name }))}
            />
            <DateRangeFilter from={params.from} to={params.to} onChange={setParams} />
          </>
        }
        empty={
          filtered ? (
            <EmptyState plain title="No purchase orders match these filters" description="Clear the search or widen the dates." />
          ) : (
            <EmptyState plain title="No purchase orders yet" description="Raise a PO with a vendor; supervisors receive the goods against it." action={newButton || undefined} />
          )
        }
      />
    </div>
  );
}
