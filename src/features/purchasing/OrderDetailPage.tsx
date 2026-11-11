import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, PackageCheck, Pencil, Send, Undo2 } from "lucide-react";
import { api } from "@/lib/api/client";
import type { DocRef, JobRef, POLine, PurchaseOrder } from "@/lib/api/types";
import { date, money, percentFromBp, qty } from "@/lib/format";
import { useSite } from "@/app/site";
import {
  Button,
  ButtonLink,
  Card,
  DataTable,
  DescriptionList,
  ErrorState,
  Field,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  Textarea,
  notify,
  useConfirm,
  type ColumnDef,
} from "@/ui";
import { PdfButton, Totals } from "./components";
import { PO_STATUS_LABELS, keys } from "./lib";
import { ReceiveGoodsDrawer } from "./ReceiveGoodsDrawer";
import { ReturnGoodsDrawer } from "./ReturnGoodsDrawer";

/** One purchase order: header, lines with received/pending, receipts and returns, and the actions its status allows. */
export default function OrderDetailPage() {
  const { poId } = useParams();
  const site = useSite();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const reasonRef = useRef("");
  const [drawer, setDrawer] = useState<"receive" | "return" | null>(null);
  const query = useQuery({
    queryKey: [...keys.orders(site), poId],
    queryFn: () => api.get<PurchaseOrder>(`${site.base}/purchase-orders/${poId}`),
  });
  const po = query.data;
  const invalidate = () => qc.invalidateQueries({ queryKey: keys.orders(site) });

  const send = useMutation({
    mutationFn: () => api.post<PurchaseOrder>(`${site.base}/purchase-orders/${poId}/send`),
    onSuccess: (p) => {
      notify.success(`${p.number} sent.`);
      void invalidate();
    },
    onError: notify.error,
  });
  const cancel = useMutation({
    mutationFn: (reason: string) => api.post<PurchaseOrder>(`${site.base}/purchase-orders/${poId}/cancel`, { reason: reason.trim() || undefined }),
    onSuccess: (p) => {
      notify.success(`${p.number} cancelled.`);
      void invalidate();
    },
    onError: notify.error,
  });

  const crumbs = <Link to={site.to("purchasing/orders")}>Purchase orders</Link>;
  if (query.isPending) return <LoadingBlock rows={8} />;
  if (query.error || !po)
    return (
      <div className="ce-page">
        <PageHeader title="Purchase order" crumbs={crumbs} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );

  const canPurchase = site.can("purchasing:write");
  const nothingReceived = po.lines.every((l) => l.receivedQty === 0);
  const hasReturnable = po.lines.some((l) => l.receivedQty > l.returnedQty);
  const isDraft = po.status === "draft";
  const receivable = (po.status === "sent" || po.status === "partially_received") && po.lines.some((l) => l.pendingQty > 0);

  const onCancel = async () => {
    reasonRef.current = "";
    const ok = await confirm({
      title: `Cancel ${po.number}?`,
      message: (
        <div className="ce-stack">
          <p>The vendor should not deliver against it any more. This can't be undone.</p>
          <Field label="Reason (optional)">
            <Textarea rows={2} maxLength={500} onChange={(e) => (reasonRef.current = e.target.value)} />
          </Field>
        </div>
      ),
      confirmLabel: "Cancel order",
      cancelLabel: "Keep order",
      tone: "danger",
    });
    if (ok) cancel.mutate(reasonRef.current);
  };

  const actions = (
    <>
      {canPurchase && isDraft && (
        <ButtonLink icon={<Pencil />} to={site.to(`purchasing/orders/${po.id}/edit`)}>
          Edit
        </ButtonLink>
      )}
      {canPurchase && (isDraft || po.status === "sent") && nothingReceived && (
        <Button icon={<Ban />} loading={cancel.isPending} onClick={() => void onCancel()}>
          Cancel order
        </Button>
      )}
      {canPurchase && hasReturnable && po.status !== "draft" && po.status !== "cancelled" && (
        <Button icon={<Undo2 />} onClick={() => setDrawer("return")}>
          Return goods
        </Button>
      )}
      {po.status !== "draft" && (
        <PdfButton label={`${po.number} PDF`} templates={["classic", "compact", "detailed"]} start={(template) => api.post<JobRef>(`${site.base}/purchase-orders/${po.id}/pdf`, { template })} />
      )}
      {canPurchase && isDraft && (
        <Button variant="primary" icon={<Send />} loading={send.isPending} onClick={() => send.mutate()}>
          Send to vendor
        </Button>
      )}
      {site.can("receiving:write") && receivable && (
        <Button variant="primary" icon={<PackageCheck />} onClick={() => setDrawer("receive")}>
          Receive goods
        </Button>
      )}
    </>
  );

  const columns: ColumnDef<POLine, unknown>[] = [
    { accessorKey: "productName", header: "Product", meta: { footer: "Total" }, cell: ({ row }) => <strong>{row.original.productName}</strong> },
    { accessorKey: "qty", header: "Ordered", meta: { numeric: true }, cell: ({ row }) => qty(row.original.qty, row.original.unit) },
    { accessorKey: "receivedQty", header: "Received", meta: { numeric: true, hideBelow: 600 }, cell: ({ row }) => qty(row.original.receivedQty, row.original.unit) },
    { accessorKey: "returnedQty", header: "Returned", meta: { numeric: true, hideBelow: 900 }, cell: ({ row }) => qty(row.original.returnedQty, row.original.unit) },
    { accessorKey: "pendingQty", header: "Pending", meta: { numeric: true }, cell: ({ row }) => qty(row.original.pendingQty, row.original.unit) },
    { accessorKey: "unitPricePaise", header: "Rate", meta: { numeric: true, hideBelow: 700 }, cell: ({ row }) => money(row.original.unitPricePaise) },
    { accessorKey: "taxRateBp", header: "GST", meta: { numeric: true, hideBelow: 1000 }, cell: ({ row }) => percentFromBp(row.original.taxRateBp) },
    { accessorKey: "totalPaise", header: "Total", meta: { numeric: true, footer: money(po.totalPaise) }, cell: ({ row }) => money(row.original.totalPaise) },
  ];

  return (
    <div className="ce-page">
      <PageHeader
        title={
          <span className="ce-row">
            <span className="ce-num">{po.number}</span>
            <StatusBadge status={po.status} label={PO_STATUS_LABELS[po.status]} />
          </span>
        }
        crumbs={crumbs}
        actions={actions}
      />
      {site.archived && <p className="ce-muted">This site is archived — the order is read-only.</p>}
      <Card>
        <DescriptionList
          items={[
            { label: "Vendor", value: po.vendor.name },
            { label: "Vendor GSTIN", value: po.vendor.gstIn ? <span className="ce-num">{po.vendor.gstIn}</span> : "—" },
            { label: "PO date", value: date(po.date) },
            { label: "Expected delivery", value: date(po.expectedDate) },
            { label: "Transport", value: po.transport || "—" },
            { label: "Received value", value: money(po.receivedValuePaise) },
            ...(po.notes ? [{ label: "Notes", value: po.notes }] : []),
            ...(po.status === "cancelled" ? [{ label: "Cancel reason", value: po.cancelReason || "—" }] : []),
          ]}
        />
      </Card>
      <DataTable columns={columns} data={po.lines} rowKey={(l) => l.id} showFooter caption="Order lines" />
      <Totals subtotalPaise={po.subtotalPaise} taxPaise={po.taxPaise} totalPaise={po.totalPaise} label="PO total" />
      <div className="ce-grid-2">
        <DocList title="Goods receipts" docs={po.receipts} link={(d) => site.to(`purchasing/receipts/${d.id}`)} empty="Nothing received yet." />
        <DocList title="Returns" docs={po.returns} link={(d) => site.to(`purchasing/returns/${d.id}`)} empty="No returns." />
      </div>
      {drawer === "receive" && <ReceiveGoodsDrawer po={po} onClose={() => setDrawer(null)} />}
      {drawer === "return" && <ReturnGoodsDrawer po={po} onClose={() => setDrawer(null)} />}
    </div>
  );
}

function DocList({ title, docs, link, empty }: { title: string; docs: DocRef[]; link: (d: DocRef) => string; empty: string }) {
  return (
    <Card title={title}>
      {docs.length === 0 ? (
        <p className="ce-muted">{empty}</p>
      ) : (
        <ul className="pur-doclist">
          {docs.map((d) => (
            <li key={d.id}>
              <Link to={link(d)} className="ce-num">
                {d.number}
              </Link>
              <span className="ce-muted">{date(d.date)}</span>
              <span className="ce-num">{money(d.totalPaise)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
