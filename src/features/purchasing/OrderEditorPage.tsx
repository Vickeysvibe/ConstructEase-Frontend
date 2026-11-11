import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useFieldArray, useForm, useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Send, Trash2 } from "lucide-react";
import { api, newIdempotencyKey } from "@/lib/api/client";
import type { POInput, PurchaseOrder } from "@/lib/api/types";
import { money, today } from "@/lib/format";
import { applyFieldErrors } from "@/lib/hooks";
import { useAuth } from "@/app/auth";
import { useSite } from "@/app/site";
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Field,
  FormError,
  IconButton,
  Input,
  LoadingBlock,
  MoneyInput,
  PageHeader,
  QtyInput,
  Select,
  Textarea,
  notify,
} from "@/ui";
import { ProductPicker, Totals } from "./components";
import { GST_OPTIONS, blankToUndefined, keys, linePaths, priceLine, sumLines, useSiteVendors } from "./lib";

const lineSchema = z.object({
  productId: z.string().min(1, "Choose a product from the list"),
  productName: z.string(),
  unit: z.string(),
  qty: z.number({ invalid_type_error: "Enter a quantity" }).positive("Enter a quantity"),
  unitPricePaise: z.number({ invalid_type_error: "Enter a rate" }).int().min(0, "Rate can't be negative"),
  taxRateBp: z.string(),
});
const orderSchema = z
  .object({
    vendorId: z.string().min(1, "Choose a vendor"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the PO date"),
    expectedDate: z.string(),
    transport: z.string().max(200),
    notes: z.string().max(1000),
    lines: z.array(lineSchema).min(1, "Add at least one line"),
  })
  .refine((v) => !v.expectedDate || v.expectedDate >= v.date, { path: ["expectedDate"], message: "Expected date can't be before the PO date" });
type OrderForm = z.input<typeof orderSchema>;
type LineForm = OrderForm["lines"][number];

const emptyLine = (): LineForm => ({ productId: "", productName: "", unit: "", qty: null as unknown as number, unitPricePaise: null as unknown as number, taxRateBp: "1800" });
const FIELDS = ["vendorId", "date", "expectedDate", "transport", "notes", "lines"];
const LINE_FIELDS = ["productId", "qty", "unitPricePaise", "taxRateBp"];

function toBody(v: OrderForm, forPatch: boolean): POInput {
  return {
    vendorId: v.vendorId,
    date: v.date,
    expectedDate: blankToUndefined(v.expectedDate),
    // on PATCH, "" clears a field; on create, leave it out
    transport: forPatch ? v.transport.trim() : blankToUndefined(v.transport),
    notes: forPatch ? v.notes.trim() : blankToUndefined(v.notes),
    lines: v.lines.map((l) => ({ productId: l.productId, qty: l.qty, unitPricePaise: l.unitPricePaise, taxRateBp: Number(l.taxRateBp) })),
  };
}

const fromPO = (po: PurchaseOrder): OrderForm => ({
  vendorId: po.vendor.id,
  date: po.date,
  expectedDate: po.expectedDate ?? "",
  transport: po.transport ?? "",
  notes: po.notes ?? "",
  lines: po.lines.map((l) => ({
    productId: l.productId,
    productName: l.productName,
    unit: l.unit,
    qty: l.qty,
    unitPricePaise: l.unitPricePaise,
    taxRateBp: String(l.taxRateBp),
  })),
});

/** New purchase order, or edit of a draft (`orders/:poId/edit`). */
export default function OrderEditorPage() {
  const { poId } = useParams();
  const site = useSite();
  const existing = useQuery({
    queryKey: [...keys.orders(site), poId],
    queryFn: () => api.get<PurchaseOrder>(`${site.base}/purchase-orders/${poId}`),
    enabled: Boolean(poId),
  });
  const vendors = useSiteVendors(site);
  const title = poId ? `Edit ${existing.data?.number ?? "purchase order"}` : "New purchase order";
  const crumbs = <Link to={site.to("purchasing/orders")}>Purchase orders</Link>;

  let body;
  if (!site.can("purchasing:write")) {
    body = <EmptyState title="You can't raise purchase orders on this site" description="Engineers create and edit purchase orders." />;
  } else if ((poId && existing.isPending) || vendors.isPending) {
    body = <LoadingBlock rows={6} />;
  } else if (existing.error || vendors.error) {
    body = <ErrorState error={existing.error ?? vendors.error} onRetry={() => void (existing.error ? existing.refetch() : vendors.refetch())} />;
  } else if (existing.data && existing.data.status !== "draft") {
    body = (
      <EmptyState
        title={`${existing.data.number} has been sent`}
        description="Only draft orders can be edited. Cancel it and raise a new one if the order has changed."
        action={<ButtonLink to={site.to(`purchasing/orders/${existing.data.id}`)}>Back to the order</ButtonLink>}
      />
    );
  } else if (!vendors.data?.items.length) {
    body = (
      <EmptyState
        title="Add a vendor first"
        description="Purchase orders are raised with vendors attached to this site."
        action={
          site.can("masters:write") ? (
            <ButtonLink variant="primary" to={site.to("masters/vendors")}>
              Go to vendors
            </ButtonLink>
          ) : undefined
        }
      />
    );
  } else {
    body = <OrderForm po={existing.data} vendorOptions={vendors.data.items.map((v) => ({ value: v.id, label: v.name }))} />;
  }
  return (
    <div className="ce-page">
      <PageHeader title={title} crumbs={crumbs} />
      {body}
    </div>
  );
}

function OrderForm({ po, vendorOptions }: { po?: PurchaseOrder; vendorOptions: { value: string; label: string }[] }) {
  const site = useSite();
  const { session } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: po
      ? fromPO(po)
      : { vendorId: "", date: today(session?.org.timezone), expectedDate: "", transport: "", notes: "", lines: [emptyLine()] },
  });
  const lines = useFieldArray({ control: form.control, name: "lines" });

  const save = useMutation({
    mutationFn: async ({ values, send }: { values: OrderForm; send: boolean }) => {
      const saved = po
        ? await api.patch<PurchaseOrder>(`${site.base}/purchase-orders/${po.id}`, toBody(values, true))
        : await api.post<PurchaseOrder>(`${site.base}/purchase-orders`, toBody(values, false), { idempotencyKey });
      if (!send) return { po: saved, sent: false as const };
      try {
        return { po: await api.post<PurchaseOrder>(`${site.base}/purchase-orders/${saved.id}/send`), sent: true as const };
      } catch (err) {
        return { po: saved, sent: false as const, sendError: err };
      }
    },
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: keys.orders(site) });
      if ("sendError" in r) notify.error(r.sendError);
      notify.success(r.sent ? `${r.po.number} sent.` : `${r.po.number} saved as draft.`);
      navigate(site.to(`purchasing/orders/${r.po.id}`), { replace: true });
    },
    onError: (err) => setFormError(applyFieldErrors(err, form.setError, [...FIELDS, ...linePaths(form.getValues("lines").length, LINE_FIELDS)])),
  });

  const submit = (send: boolean) =>
    form.handleSubmit((values) => {
      setFormError(null);
      save.mutate({ values, send });
    });
  const linesError = form.formState.errors.lines?.root?.message ?? form.formState.errors.lines?.message;

  return (
    <form className="ce-stack" noValidate onSubmit={(e) => void submit(false)(e)}>
      <FormError message={formError} />
      <Card title="Order">
        <div className="ce-form-grid">
          <Controller
            control={form.control}
            name="vendorId"
            render={({ field, fieldState }) => (
              <Field label="Vendor" required error={fieldState.error?.message}>
                <Select {...field} options={vendorOptions} placeholder="Choose vendor…" />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="date"
            render={({ field, fieldState }) => (
              <Field label="PO date" required error={fieldState.error?.message}>
                <Input {...field} type="date" />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="expectedDate"
            render={({ field, fieldState }) => (
              <Field label="Expected delivery" error={fieldState.error?.message}>
                <Input {...field} type="date" />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="transport"
            render={({ field, fieldState }) => (
              <Field label="Transport" hint="e.g. Vendor's lorry, freight extra" error={fieldState.error?.message}>
                <Input {...field} autoComplete="off" />
              </Field>
            )}
          />
        </div>
      </Card>

      <Card
        title="Lines"
        actions={
          <Button size="sm" icon={<Plus />} onClick={() => lines.append(emptyLine())}>
            Add line
          </Button>
        }
      >
        <div className="pur-lines">
          {linesError && <FormError message={linesError} />}
          {lines.fields.map((f, i) => (
            <LineRow key={f.id} index={i} control={form.control} canRemove={lines.fields.length > 1} onRemove={() => lines.remove(i)} setValue={form.setValue} />
          ))}
          <p className="ce-muted pur-hint">
            Product not in the list?{" "}
            {site.can("masters:write") ? <Link to={site.to("masters/products")}>Add it under Masters → Products</Link> : "Ask an engineer to add it under Masters → Products."}
          </p>
          <GrandTotals control={form.control} />
        </div>
      </Card>

      <Card title="Notes">
        <Controller
          control={form.control}
          name="notes"
          render={({ field, fieldState }) => (
            <Field label="Notes for the vendor" hint="Printed on the PO" error={fieldState.error?.message}>
              <Textarea {...field} rows={3} />
            </Field>
          )}
        />
      </Card>

      <div className="pur-sticky-actions">
        <ButtonLink variant="ghost" to={po ? site.to(`purchasing/orders/${po.id}`) : site.to("purchasing/orders")}>
          Cancel
        </ButtonLink>
        <Button type="submit" loading={save.isPending && !save.variables?.send}>
          Save as draft
        </Button>
        <Button variant="primary" icon={<Send />} loading={save.isPending && save.variables?.send} onClick={(e) => void submit(true)(e)}>
          Save &amp; send
        </Button>
      </div>
    </form>
  );
}

function LineRow({
  index,
  control,
  canRemove,
  onRemove,
  setValue,
}: {
  index: number;
  control: Control<OrderForm>;
  canRemove: boolean;
  onRemove: () => void;
  setValue: UseFormSetValue<OrderForm>;
}) {
  const line = useWatch({ control, name: `lines.${index}` });
  const m = priceLine(line?.qty, line?.unitPricePaise, Number(line?.taxRateBp ?? 0));
  const n = index + 1;
  return (
    <div className="pur-line" role="group" aria-label={`Line ${n}`}>
      <Controller
        control={control}
        name={`lines.${index}.productId`}
        render={({ field, fieldState }) => (
          <Field label="Product" required error={fieldState.error?.message}>
            <ProductPicker
              productId={field.value}
              productName={line?.productName ?? ""}
              onBlur={field.onBlur}
              onPick={(p) => {
                field.onChange(p?.id ?? "");
                if (p) {
                  setValue(`lines.${index}.productName`, p.name);
                  setValue(`lines.${index}.unit`, p.unit);
                  setValue(`lines.${index}.taxRateBp`, String(p.defaultTaxRateBp));
                }
              }}
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name={`lines.${index}.qty`}
        render={({ field, fieldState }) => (
          <Field label="Qty" required error={fieldState.error?.message}>
            <QtyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} unit={line?.unit || undefined} />
          </Field>
        )}
      />
      <Controller
        control={control}
        name={`lines.${index}.unitPricePaise`}
        render={({ field, fieldState }) => (
          <Field label={line?.unit ? `Rate / ${line.unit}` : "Rate"} required error={fieldState.error?.message}>
            <MoneyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
          </Field>
        )}
      />
      <Controller
        control={control}
        name={`lines.${index}.taxRateBp`}
        render={({ field, fieldState }) => (
          <Field label="GST" error={fieldState.error?.message}>
            <Select {...field} options={GST_OPTIONS} />
          </Field>
        )}
      />
      <div className="pur-line__amount" aria-live="polite">
        <span>{money(m.totalPaise)}</span>
        <small>
          {money(m.amountPaise)} + {money(m.taxPaise)} GST
        </small>
      </div>
      <div className="pur-line__remove">
        <IconButton label={`Remove line ${n}`} icon={<Trash2 />} disabled={!canRemove} onClick={onRemove} />
      </div>
    </div>
  );
}

function GrandTotals({ control }: { control: Control<OrderForm> }) {
  const lines = useWatch({ control, name: "lines" });
  const totals = useMemo(() => sumLines((lines ?? []).map((l) => priceLine(l.qty, l.unitPricePaise, Number(l.taxRateBp)))), [lines]);
  return <Totals {...totals} label="PO total" />;
}
