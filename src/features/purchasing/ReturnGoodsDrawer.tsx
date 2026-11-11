import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, newIdempotencyKey } from "@/lib/api/client";
import type { PRInput, PurchaseOrder, PurchaseReturn } from "@/lib/api/types";
import { qty as fmtQty, today } from "@/lib/format";
import { applyFieldErrors } from "@/lib/hooks";
import { useAuth } from "@/app/auth";
import { useSite } from "@/app/site";
import { Button, Drawer, Field, FormError, Input, QtyInput, Textarea, notify } from "@/ui";
import { blankToUndefined, fromMilli, keys, linePaths, qtyGreater, remapLineErrors, toMilli } from "./lib";

const returnSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the return date"),
    reason: z.string().max(500),
    lines: z.array(
      z.object({
        poLineId: z.string(),
        unit: z.string(),
        returnableQty: z.number(),
        qty: z.number().nullable(),
      }),
    ),
  })
  .superRefine((v, ctx) => {
    v.lines.forEach((l, i) => {
      if (l.qty != null && qtyGreater(l.qty, l.returnableQty)) {
        ctx.addIssue({ code: "custom", path: ["lines", i, "qty"], message: `You can return at most ${fmtQty(l.returnableQty, l.unit)}` });
      }
    });
    if (!v.lines.some((l) => (l.qty ?? 0) > 0)) {
      ctx.addIssue({ code: "custom", path: ["lines", "root"], message: "Enter the quantity to return for at least one line." });
    }
  });
type ReturnForm = z.infer<typeof returnSchema>;

/** Sends received goods back to the vendor. The API prices it at the average receipt rate of each line. */
export function ReturnGoodsDrawer({ po, onClose }: { po: PurchaseOrder; onClose: () => void }) {
  const site = useSite();
  const { session } = useAuth();
  const qc = useQueryClient();
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [formError, setFormError] = useState<string | null>(null);
  const returnable = po.lines
    .map((l) => ({ line: l, returnableQty: fromMilli(toMilli(l.receivedQty) - toMilli(l.returnedQty)) }))
    .filter((r) => r.returnableQty > 0);
  const form = useForm<ReturnForm>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      date: today(session?.org.timezone),
      reason: "",
      lines: returnable.map((r) => ({ poLineId: r.line.id, unit: r.line.unit, returnableQty: r.returnableQty, qty: null })),
    },
  });

  const save = useMutation({
    mutationFn: ({ body }: { body: PRInput; sentToForm: number[] }) => api.post<PurchaseReturn>(`${site.base}/purchase-returns`, body, { idempotencyKey }),
    onSuccess: (pr) => {
      notify.success(`${pr.number} recorded.`);
      void qc.invalidateQueries({ queryKey: keys.orders(site) });
      void qc.invalidateQueries({ queryKey: keys.returns(site) });
      void qc.invalidateQueries({ queryKey: keys.stock(site) });
      void qc.invalidateQueries({ queryKey: keys.movements(site) });
      onClose();
    },
    onError: (err, { sentToForm }) =>
      setFormError(applyFieldErrors(remapLineErrors(err, sentToForm), form.setError, ["date", "reason", ...linePaths(returnable.length, ["qty"])])),
  });

  const onSubmit = form.handleSubmit((v) => {
    setFormError(null);
    const sentToForm: number[] = [];
    const lines: PRInput["lines"] = [];
    v.lines.forEach((l, i) => {
      if (!l.qty || l.qty <= 0) return;
      sentToForm.push(i);
      lines.push({ poLineId: l.poLineId, qty: l.qty });
    });
    save.mutate({ body: { poId: po.id, date: v.date, reason: blankToUndefined(v.reason), lines }, sentToForm });
  });

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Return goods · ${po.number}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" form="return-form" loading={save.isPending}>
            Record return
          </Button>
        </>
      }
    >
      <form id="return-form" className="ce-stack" noValidate onSubmit={(e) => void onSubmit(e)}>
        <FormError message={formError ?? form.formState.errors.lines?.root?.message} />
        <p className="ce-muted pur-hint">
          Goods go back to {po.vendor.name}. The value is worked out from the rates you received them at, and the vendor&apos;s balance is reduced.
        </p>
        <Controller
          control={form.control}
          name="date"
          render={({ field, fieldState }) => (
            <Field label="Return date" required error={fieldState.error?.message}>
              <Input {...field} type="date" />
            </Field>
          )}
        />
        <div className="pur-rows">
          {returnable.map((r, i) => (
            <div key={r.line.id} className="pur-row" role="group" aria-label={r.line.productName}>
              <div className="pur-row__head">
                <strong>{r.line.productName}</strong>
                <span className="pur-row__meta">Returnable {fmtQty(r.returnableQty, r.line.unit)}</span>
              </div>
              <Controller
                control={form.control}
                name={`lines.${i}.qty`}
                render={({ field, fieldState }) => (
                  <Field label="Qty to return" error={fieldState.error?.message}>
                    <QtyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} unit={r.line.unit} />
                  </Field>
                )}
              />
            </div>
          ))}
        </div>
        <Controller
          control={form.control}
          name="reason"
          render={({ field, fieldState }) => (
            <Field label="Reason" error={fieldState.error?.message}>
              <Textarea {...field} rows={2} placeholder="Damaged bags, wrong grade, excess…" />
            </Field>
          )}
        />
      </form>
    </Drawer>
  );
}
