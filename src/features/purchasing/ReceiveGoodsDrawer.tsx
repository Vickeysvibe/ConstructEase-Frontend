import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, newIdempotencyKey } from "@/lib/api/client";
import type { GoodsReceipt, GRInput, PurchaseOrder } from "@/lib/api/types";
import { qty as fmtQty, today } from "@/lib/format";
import { applyFieldErrors } from "@/lib/hooks";
import { useAuth } from "@/app/auth";
import { useSite } from "@/app/site";
import { Button, Drawer, Field, FormError, Input, MoneyInput, QtyInput, Select, Textarea, notify } from "@/ui";
import { Totals } from "./components";
import { GST_OPTIONS, blankToUndefined, keys, linePaths, priceLine, qtyGreater, remapLineErrors, sumLines } from "./lib";

const receiveSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the receipt date"),
    challanNo: z.string().max(60),
    vehicleNo: z.string().max(30),
    notes: z.string().max(1000),
    lines: z.array(
      z.object({
        poLineId: z.string(),
        productName: z.string(),
        unit: z.string(),
        pendingQty: z.number(),
        qty: z.number().nullable(),
        unitPricePaise: z.number().int().min(0).nullable(),
        taxRateBp: z.string(),
      }),
    ),
  })
  .superRefine((v, ctx) => {
    v.lines.forEach((l, i) => {
      if (l.qty != null && qtyGreater(l.qty, l.pendingQty)) {
        ctx.addIssue({ code: "custom", path: ["lines", i, "qty"], message: `Only ${fmtQty(l.pendingQty, l.unit)} pending` });
      }
    });
    if (!v.lines.some((l) => (l.qty ?? 0) > 0)) {
      ctx.addIssue({ code: "custom", path: ["lines", "root"], message: "Enter the quantity received for at least one line." });
    }
  });
type ReceiveForm = z.infer<typeof receiveSchema>;

/** Records goods arriving at site against a sent PO. Prefills every pending line with its pending quantity. */
export function ReceiveGoodsDrawer({ po, onClose }: { po: PurchaseOrder; onClose: () => void }) {
  const site = useSite();
  const { session } = useAuth();
  const qc = useQueryClient();
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [formError, setFormError] = useState<string | null>(null);
  const pending = po.lines.filter((l) => l.pendingQty > 0);
  const form = useForm<ReceiveForm>({
    resolver: zodResolver(receiveSchema),
    defaultValues: {
      date: today(session?.org.timezone),
      challanNo: "",
      vehicleNo: "",
      notes: "",
      lines: pending.map((l) => ({
        poLineId: l.id,
        productName: l.productName,
        unit: l.unit,
        pendingQty: l.pendingQty,
        qty: l.pendingQty,
        unitPricePaise: l.unitPricePaise,
        taxRateBp: String(l.taxRateBp),
      })),
    },
  });

  const save = useMutation({
    mutationFn: ({ body }: { body: GRInput; sentToForm: number[] }) => api.post<GoodsReceipt>(`${site.base}/goods-receipts`, body, { idempotencyKey }),
    onSuccess: (gr) => {
      notify.success(`${gr.number} recorded.`);
      void qc.invalidateQueries({ queryKey: keys.orders(site) });
      void qc.invalidateQueries({ queryKey: keys.receipts(site) });
      void qc.invalidateQueries({ queryKey: keys.stock(site) });
      void qc.invalidateQueries({ queryKey: keys.movements(site) });
      onClose();
    },
    onError: (err, { sentToForm }) =>
      setFormError(
        applyFieldErrors(remapLineErrors(err, sentToForm), form.setError, [
          "date",
          "challanNo",
          "vehicleNo",
          "notes",
          ...linePaths(pending.length, ["qty", "unitPricePaise", "taxRateBp"]),
        ]),
      ),
  });

  const onSubmit = form.handleSubmit((v) => {
    setFormError(null);
    const sentToForm: number[] = [];
    const lines: GRInput["lines"] = [];
    v.lines.forEach((l, i) => {
      if (!l.qty || l.qty <= 0) return;
      sentToForm.push(i);
      lines.push({ poLineId: l.poLineId, qty: l.qty, unitPricePaise: l.unitPricePaise ?? undefined, taxRateBp: Number(l.taxRateBp) });
    });
    save.mutate({
      body: {
        poId: po.id,
        date: v.date,
        challanNo: blankToUndefined(v.challanNo),
        vehicleNo: blankToUndefined(v.vehicleNo),
        notes: blankToUndefined(v.notes),
        lines,
      },
      sentToForm,
    });
  });
  const linesError = form.formState.errors.lines?.root?.message;

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Receive goods · ${po.number}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="receive-form" loading={save.isPending}>
            Record receipt
          </Button>
        </>
      }
    >
      <form id="receive-form" className="ce-stack" noValidate onSubmit={(e) => void onSubmit(e)}>
        <FormError message={formError ?? linesError} />
        <p className="ce-muted pur-hint">From {po.vendor.name}. Leave a line empty if it didn't arrive.</p>
        <div className="ce-form-grid">
          <Controller
            control={form.control}
            name="date"
            render={({ field, fieldState }) => (
              <Field label="Date received" required error={fieldState.error?.message}>
                <Input {...field} type="date" />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="challanNo"
            render={({ field, fieldState }) => (
              <Field label="Challan / DC no." error={fieldState.error?.message}>
                <Input {...field} autoComplete="off" />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="vehicleNo"
            render={({ field, fieldState }) => (
              <Field label="Vehicle no." error={fieldState.error?.message}>
                <Input {...field} autoComplete="off" placeholder="TN 09 AB 1234" />
              </Field>
            )}
          />
        </div>
        <div className="pur-rows">
          {pending.map((l, i) => (
            <div key={l.id} className="pur-row" role="group" aria-label={l.productName}>
              <div className="pur-row__head">
                <strong>{l.productName}</strong>
                <span className="pur-row__meta">Pending {fmtQty(l.pendingQty, l.unit)}</span>
              </div>
              <div className="pur-row__grid">
                <Controller
                  control={form.control}
                  name={`lines.${i}.qty`}
                  render={({ field, fieldState }) => (
                    <Field label="Qty received" error={fieldState.error?.message}>
                      <QtyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} unit={l.unit} />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name={`lines.${i}.unitPricePaise`}
                  render={({ field, fieldState }) => (
                    <Field label={`Rate / ${l.unit}`} error={fieldState.error?.message}>
                      <MoneyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name={`lines.${i}.taxRateBp`}
                  render={({ field, fieldState }) => (
                    <Field label="GST" error={fieldState.error?.message}>
                      <Select {...field} options={GST_OPTIONS} />
                    </Field>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
        <ReceiveTotals control={form.control} />
        <Controller
          control={form.control}
          name="notes"
          render={({ field, fieldState }) => (
            <Field label="Notes" error={fieldState.error?.message}>
              <Textarea {...field} rows={2} placeholder="Shortage, damage, quality…" />
            </Field>
          )}
        />
      </form>
    </Drawer>
  );
}

function ReceiveTotals({ control }: { control: Control<ReceiveForm> }) {
  const lines = useWatch({ control, name: "lines" });
  const totals = useMemo(() => sumLines((lines ?? []).map((l) => priceLine(l.qty, l.unitPricePaise, Number(l.taxRateBp)))), [lines]);
  return <Totals {...totals} label="Receipt total" />;
}
