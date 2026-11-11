import { useEffect, useMemo, useState, type InputHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { FileDown } from "lucide-react";
import type { JobRef, Product, ReceiptLine } from "@/lib/api/types";
import { money, percentFromBp, qty } from "@/lib/format";
import { useExportJob } from "@/lib/hooks";
import { Button, Combobox, DataTable, Field, Input, Modal, Select, type ColumnDef } from "@/ui";
import { useProductSearch } from "./lib";
import "./purchasing.css";

/** From / to date filters for list toolbars (inclusive range, YYYY-MM-DD). */
export function DateRangeFilter({
  from,
  to,
  onChange,
}: {
  from?: string;
  to?: string;
  onChange: (patch: { from?: string; to?: string }) => void;
}) {
  return (
    <div className="pur-daterange">
      <Input type="date" aria-label="From date" value={from ?? ""} max={to} onChange={(e) => onChange({ from: e.target.value || undefined })} />
      <span aria-hidden>–</span>
      <Input type="date" aria-label="To date" value={to ?? ""} min={from} onChange={(e) => onChange({ to: e.target.value || undefined })} />
    </div>
  );
}

/**
 * Searchable product picker over the org catalogue (server search + native suggestions).
 * Calls `onPick` with the product once the text matches one exactly, or `null` while it doesn't.
 */
export function ProductPicker({
  productId,
  productName,
  onPick,
  ...inputProps
}: {
  productId: string;
  productName: string;
  onPick: (p: Product | null) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "list">) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  const search = useProductSearch(debounced);
  // The selected product may not be in the current result page; keep a minimal stand-in so its label shows.
  const selected = useMemo<Product | null>(
    () =>
      productId
        ? (search.data?.items.find((p) => p.id === productId) ??
          ({ id: productId, name: productName, unit: "", defaultTaxRateBp: 0, status: "active" } as Product))
        : null,
    [productId, productName, search.data],
  );
  return (
    <Combobox<Product>
      {...inputProps}
      value={selected}
      onChange={onPick}
      items={search.data?.items}
      loading={search.isFetching}
      onSearch={setQ}
      itemKey={(p) => p.id}
      itemLabel={(p) => p.name}
      itemHint={(p) => `${p.unit}${p.category ? ` · ${p.category}` : ""}`}
      placeholder={inputProps.placeholder ?? "Search products…"}
      emptyText="No products match. Add it in Masters › Products."
    />
  );
}

/** Subtotal / GST / total block shown under line editors and detail tables. */
export function Totals({ subtotalPaise, taxPaise, totalPaise, label = "Total" }: { subtotalPaise: number; taxPaise: number; totalPaise: number; label?: string }) {
  return (
    <dl className="pur-totals" aria-label="Totals">
      <div>
        <dt>Subtotal</dt>
        <dd>{money(subtotalPaise)}</dd>
      </div>
      <div>
        <dt>GST</dt>
        <dd>{money(taxPaise)}</dd>
      </div>
      <div className="pur-totals__grand">
        <dt>{label}</dt>
        <dd>{money(totalPaise)}</dd>
      </div>
    </dl>
  );
}

/** Lines of a goods receipt or purchase return. */
export function DocLinesTable({ lines, totals }: { lines: ReceiptLine[]; totals: { subtotalPaise: number; taxPaise: number; totalPaise: number } }) {
  const columns: ColumnDef<ReceiptLine, unknown>[] = [
    { accessorKey: "productName", header: "Product", meta: { footer: "Total" }, cell: ({ row }) => <strong>{row.original.productName}</strong> },
    { accessorKey: "qty", header: "Qty", meta: { numeric: true }, cell: ({ row }) => qty(row.original.qty, row.original.unit) },
    { accessorKey: "unitPricePaise", header: "Rate", meta: { numeric: true, hideBelow: 600 }, cell: ({ row }) => money(row.original.unitPricePaise) },
    { accessorKey: "taxRateBp", header: "GST", meta: { numeric: true, hideBelow: 700 }, cell: ({ row }) => percentFromBp(row.original.taxRateBp) },
    { accessorKey: "amountPaise", header: "Amount", meta: { numeric: true, hideBelow: 800, footer: money(totals.subtotalPaise) }, cell: ({ row }) => money(row.original.amountPaise) },
    { accessorKey: "taxPaise", header: "Tax", meta: { numeric: true, hideBelow: 800, footer: money(totals.taxPaise) }, cell: ({ row }) => money(row.original.taxPaise) },
    { accessorKey: "totalPaise", header: "Total", meta: { numeric: true, footer: money(totals.totalPaise) }, cell: ({ row }) => money(row.original.totalPaise) },
  ];
  return <DataTable columns={columns} data={lines} rowKey={(l) => l.id} showFooter caption="Lines" />;
}

const TEMPLATE_LABELS: Record<string, string> = {
  classic: "Classic",
  compact: "Compact",
  detailed: "Detailed (with receipts)",
};

/** "Download PDF" — asks for a template when there's a choice, then runs the export job. */
export function PdfButton({ start, label, templates }: { start: (template: string) => Promise<JobRef>; label: string; templates: string[] }) {
  const [choosing, setChoosing] = useState(false);
  const [template, setTemplate] = useState(templates[0] ?? "classic");
  const job = useExportJob(() => start(template), label);
  const run = () => {
    setChoosing(false);
    job.mutate();
  };
  return (
    <>
      <Button icon={<FileDown />} loading={job.isPending} onClick={() => (templates.length > 1 ? setChoosing(true) : job.mutate())}>
        Download PDF
      </Button>
      <Modal
        open={choosing}
        onClose={() => setChoosing(false)}
        title="Download PDF"
        footer={
          <>
            <Button variant="ghost" onClick={() => setChoosing(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={run}>
              Download
            </Button>
          </>
        }
      >
        <Field label="Layout">
          <Select value={template} onChange={(e) => setTemplate(e.target.value)} options={templates.map((t) => ({ value: t, label: TEMPLATE_LABELS[t] ?? t }))} />
        </Field>
      </Modal>
    </>
  );
}

/** Link to a PO from receipt/return screens. */
export function PoLink({ to, number }: { to: string; number: string }) {
  return (
    <Link to={to} className="ce-num">
      {number}
    </Link>
  );
}
