import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { api, newIdempotencyKey } from "@/lib/api/client";
import type { ConsumptionInput, StockAdjustmentInput, StockItem, StockMovement } from "@/lib/api/types";
import { qty as fmtQty, today } from "@/lib/format";
import { applyFieldErrors } from "@/lib/hooks";
import { useAuth } from "@/app/auth";
import { useSite } from "@/app/site";
import { Button, Field, FormError, IconButton, Input, Modal, QtyInput, Select, Textarea, notify } from "@/ui";
import { blankToUndefined, fromMilli, keys, linePaths, toMilli } from "@/features/purchasing/lib";
import "@/features/purchasing/purchasing.css";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date");

function useInvalidateStock() {
  const site = useSite();
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: keys.stock(site) });
    void qc.invalidateQueries({ queryKey: keys.movements(site) });
  };
}

// ---------- Record usage (consumption) ----------
const usageSchema = (available: Map<string, StockItem>) =>
  z
    .object({
      date: isoDate,
      notes: z.string().max(500),
      lines: z
        .array(
          z.object({
            productId: z.string().min(1, "Choose a material"),
            qty: z.number({ invalid_type_error: "Enter a quantity" }).positive("Enter a quantity"),
            usedFor: z.string().max(200),
          }),
        )
        .min(1, "Add at least one line"),
    })
    .superRefine((v, ctx) => {
      // several lines for one product are checked against stock together, like the API
      const need = new Map<string, number>();
      for (const l of v.lines) if (l.productId && l.qty) need.set(l.productId, (need.get(l.productId) ?? 0) + toMilli(l.qty));
      v.lines.forEach((l, i) => {
        const item = available.get(l.productId);
        if (!item || !l.qty) return;
        if ((need.get(l.productId) ?? 0) > toMilli(item.onHandQty)) {
          ctx.addIssue({ code: "custom", path: ["lines", i, "qty"], message: `Only ${fmtQty(item.onHandQty, item.unit)} in stock` });
        }
      });
    });
type UsageForm = z.infer<ReturnType<typeof usageSchema>>;

/** Records material used on site (cement for a slab, steel for columns…). Supervisors can do this. */
export function RecordUsageModal({ items, onClose }: { items: StockItem[]; onClose: () => void }) {
  const site = useSite();
  const { session } = useAuth();
  const invalidate = useInvalidateStock();
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [formError, setFormError] = useState<string | null>(null);
  const inStock = items.filter((i) => i.onHandQty > 0);
  const [available] = useState(() => new Map(inStock.map((i) => [i.productId, i])));
  const form = useForm<UsageForm>({
    resolver: zodResolver(usageSchema(available)),
    defaultValues: { date: today(session?.org.timezone), notes: "", lines: [{ productId: "", qty: null as unknown as number, usedFor: "" }] },
  });
  const lines = useFieldArray({ control: form.control, name: "lines" });
  const watched = form.watch("lines");
  const options = inStock.map((i) => ({ value: i.productId, label: `${i.productName} (${fmtQty(i.onHandQty, i.unit)} available)` }));

  const save = useMutation({
    mutationFn: (body: ConsumptionInput) => api.post<{ movements: StockMovement[] }>(`${site.base}/consumptions`, body, { idempotencyKey }),
    onSuccess: (r) => {
      notify.success(`Usage recorded for ${r.movements.length} ${r.movements.length === 1 ? "material" : "materials"}.`);
      invalidate();
      onClose();
    },
    onError: (err) =>
      setFormError(applyFieldErrors(err, form.setError, ["date", "notes", ...linePaths(form.getValues("lines").length, ["productId", "qty", "usedFor"])])),
  });

  const onSubmit = form.handleSubmit((v) => {
    setFormError(null);
    save.mutate({
      date: v.date,
      notes: blankToUndefined(v.notes),
      lines: v.lines.map((l) => ({ productId: l.productId, qty: l.qty, usedFor: blankToUndefined(l.usedFor) })),
    });
  });

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="Record usage"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="usage-form" loading={save.isPending} disabled={!inStock.length}>
            Record usage
          </Button>
        </>
      }
    >
      <form id="usage-form" className="ce-stack" noValidate onSubmit={(e) => void onSubmit(e)}>
        <FormError message={formError} />
        {!inStock.length && <FormError message="Nothing is in stock on this site yet. Receive goods against a purchase order first." />}
        <Controller
          control={form.control}
          name="date"
          render={({ field, fieldState }) => (
            <Field label="Date used" required error={fieldState.error?.message}>
              <Input {...field} type="date" />
            </Field>
          )}
        />
        <div className="pur-rows">
          {lines.fields.map((f, i) => {
            const unit = available.get(watched[i]?.productId ?? "")?.unit;
            return (
              <div key={f.id} className="pur-row" role="group" aria-label={`Line ${i + 1}`}>
                <div className="pur-row__grid">
                  <Controller
                    control={form.control}
                    name={`lines.${i}.productId`}
                    render={({ field, fieldState }) => (
                      <Field label="Material" required error={fieldState.error?.message}>
                        <Select {...field} options={options} placeholder="Choose…" />
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name={`lines.${i}.qty`}
                    render={({ field, fieldState }) => (
                      <Field label="Qty used" required error={fieldState.error?.message}>
                        <QtyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} unit={unit} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name={`lines.${i}.usedFor`}
                    render={({ field, fieldState }) => (
                      <Field label="Used for" error={fieldState.error?.message}>
                        <Input {...field} placeholder="1st floor slab" autoComplete="off" />
                      </Field>
                    )}
                  />
                </div>
                {lines.fields.length > 1 && (
                  <div className="ce-row">
                    <IconButton size="sm" label={`Remove line ${i + 1}`} icon={<Trash2 />} onClick={() => lines.remove(i)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div>
          <Button size="sm" icon={<Plus />} onClick={() => lines.append({ productId: "", qty: null as unknown as number, usedFor: "" })}>
            Add material
          </Button>
        </div>
        <Controller
          control={form.control}
          name="notes"
          render={({ field, fieldState }) => (
            <Field label="Notes" error={fieldState.error?.message}>
              <Textarea {...field} rows={2} />
            </Field>
          )}
        />
      </form>
    </Modal>
  );
}

// ---------- Adjust stock ----------
const adjustSchema = (items: Map<string, StockItem>) =>
  z
    .object({
      date: isoDate,
      productId: z.string().min(1, "Choose a material"),
      direction: z.enum(["add", "remove"]),
      qty: z.number({ invalid_type_error: "Enter a quantity" }).positive("Enter a quantity"),
      reason: z.string().trim().min(1, "Say why stock is being corrected").max(500),
    })
    .superRefine((v, ctx) => {
      const item = items.get(v.productId);
      if (v.direction === "remove" && item && v.qty && toMilli(v.qty) > toMilli(Math.max(item.onHandQty, 0))) {
        ctx.addIssue({ code: "custom", path: ["qty"], message: `Only ${fmtQty(item.onHandQty, item.unit)} in stock` });
      }
    });
type AdjustForm = z.infer<ReturnType<typeof adjustSchema>>;

/** Corrects stock after a physical count (breakage, theft, counting error). Engineers only. */
export function AdjustStockModal({ items, onClose }: { items: StockItem[]; onClose: () => void }) {
  const site = useSite();
  const { session } = useAuth();
  const invalidate = useInvalidateStock();
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [formError, setFormError] = useState<string | null>(null);
  const [byId] = useState(() => new Map(items.map((i) => [i.productId, i])));
  const form = useForm<AdjustForm>({
    resolver: zodResolver(adjustSchema(byId)),
    defaultValues: { date: today(session?.org.timezone), productId: "", direction: "remove", qty: null as unknown as number, reason: "" },
  });
  const product = byId.get(form.watch("productId"));

  const save = useMutation({
    mutationFn: (body: StockAdjustmentInput) => api.post<StockMovement>(`${site.base}/stock-adjustments`, body, { idempotencyKey }),
    onSuccess: (m) => {
      notify.success(`${m.productName} adjusted by ${m.qty > 0 ? "+" : "−"}${fmtQty(Math.abs(m.qty), m.unit)}.`);
      invalidate();
      onClose();
    },
    onError: (err) => setFormError(applyFieldErrors(err, form.setError, ["date", "productId", "qty", "reason"])),
  });

  const onSubmit = form.handleSubmit((v) => {
    setFormError(null);
    save.mutate({ date: v.date, productId: v.productId, qty: v.direction === "remove" ? -v.qty : v.qty, reason: v.reason.trim() });
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Adjust stock"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="adjust-form" loading={save.isPending}>
            Save adjustment
          </Button>
        </>
      }
    >
      <form id="adjust-form" className="ce-stack" noValidate onSubmit={(e) => void onSubmit(e)}>
        <FormError message={formError} />
        <Controller
          control={form.control}
          name="productId"
          render={({ field, fieldState }) => (
            <Field label="Material" required error={fieldState.error?.message} hint={product ? `On hand: ${fmtQty(product.onHandQty, product.unit)}` : undefined}>
              <Select {...field} options={items.map((i) => ({ value: i.productId, label: i.productName }))} placeholder="Choose…" />
            </Field>
          )}
        />
        <div className="ce-form-grid">
          <Controller
            control={form.control}
            name="direction"
            render={({ field }) => (
              <Field label="Change">
                <Select
                  {...field}
                  options={[
                    { value: "remove", label: "Remove from stock (−)" },
                    { value: "add", label: "Add to stock (+)" },
                  ]}
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="qty"
            render={({ field, fieldState }) => (
              <Field label="Quantity" required error={fieldState.error?.message}>
                <QtyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} unit={product?.unit} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="date"
            render={({ field, fieldState }) => (
              <Field label="Date" required error={fieldState.error?.message}>
                <Input {...field} type="date" />
              </Field>
            )}
          />
        </div>
        <Controller
          control={form.control}
          name="reason"
          render={({ field, fieldState }) => (
            <Field label="Reason" required error={fieldState.error?.message}>
              <Textarea {...field} rows={2} placeholder="Physical count on 10 Nov, 3 bags set hard" />
            </Field>
          )}
        />
      </form>
    </Modal>
  );
}

/** "+12.5" / "−3" with the unit — sign in text so colour is never the only signal. */
export function SignedQty({ value, unit }: { value: number; unit?: string }) {
  const abs = fromMilli(Math.abs(toMilli(value)));
  return <span className={value >= 0 ? "stk-in" : "stk-out"}>{`${value >= 0 ? "+" : "−"}${fmtQty(abs, unit)}`}</span>;
}
