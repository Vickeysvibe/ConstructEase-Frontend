import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, newIdempotencyKey } from "@/lib/api/client";
import type { Payment, PaymentCategory } from "@/lib/api/types";
import { money } from "@/lib/format";
import { applyFieldErrors } from "@/lib/hooks";
import { useSite } from "@/app/site";
import { Button, Drawer, Field, FormError, Input, MoneyInput, QtyInput, Select, Textarea, notify } from "@/ui";
import {
  CATEGORY_OPTIONS,
  DIRECTION_OPTIONS,
  METHOD_OPTIONS,
  PAYMENT_FIELDS,
  blankPayment,
  defaultDirection,
  partyKindFor,
  paymentSchema,
  paymentToForm,
  toPaymentInput,
  toPaymentPatch,
  type PaymentForm,
} from "./paymentForm";
import { useSiteParties } from "./useSiteParties";

/** Record (POST) or edit (PATCH) a site payment. Mount it only while open: the idempotency key is made once per open. */
export function PaymentDrawer({
  payment,
  today,
  preset,
  onClose,
}: {
  payment: Payment | null;
  today: string;
  preset?: { category?: PaymentCategory; partyId?: string };
  onClose: () => void;
}) {
  const site = useSite();
  const qc = useQueryClient();
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: payment ? paymentToForm(payment) : blankPayment(today, preset),
  });
  const { errors } = form.formState;
  const category = form.watch("category");
  const kind = partyKindFor(category);
  const parties = useSiteParties(kind);
  const qtyVal = form.watch("quantity");
  const unitCost = form.watch("unitCostPaise");

  const save = useMutation({
    mutationFn: (v: PaymentForm) =>
      payment
        ? api.patch<Payment>(`${site.base}/payments/${payment.id}`, toPaymentPatch(v))
        : api.post<Payment>(`${site.base}/payments`, toPaymentInput(v), { idempotencyKey }),
    onSuccess: (p) => {
      notify.success(`${payment ? "Payment updated" : "Payment recorded"}: ${money(p.amountPaise)}${p.party ? ` ${p.direction === "in" ? "from" : "to"} ${p.party.name}` : ""}.`);
      void qc.invalidateQueries({ queryKey: ["payments", site.site.id] });
      void qc.invalidateQueries({ queryKey: ["ledger", site.site.id] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    },
    onError: (err) => setFormError(applyFieldErrors(err, form.setError, PAYMENT_FIELDS)),
  });

  const partyOptions = (parties.data?.items ?? []).map((p) => ({ value: p.id, label: p.name }));
  // Editing a payment whose party was since detached: keep it selectable.
  if (payment?.party && payment.party.kind === kind && !partyOptions.some((o) => o.value === payment.party!.id)) {
    partyOptions.unshift({ value: payment.party.id, label: payment.party.name });
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={payment ? "Edit payment" : "Record payment"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="payment-form" loading={save.isPending}>
            {payment ? "Save changes" : "Record payment"}
          </Button>
        </>
      }
    >
      <form
        id="payment-form"
        className="ce-stack"
        noValidate
        onSubmit={form.handleSubmit((v) => {
          setFormError(null);
          save.mutate(v);
        })}
      >
        <FormError message={formError} />
        <div className="ce-form-grid">
          <Field label="Category" required error={errors.category?.message}>
            <Select
              {...form.register("category", {
                onChange: (e) => {
                  const c = e.target.value as PaymentCategory;
                  form.setValue("direction", defaultDirection(c));
                  form.setValue("partyId", "");
                  form.clearErrors("partyId");
                },
              })}
              options={CATEGORY_OPTIONS}
            />
          </Field>
          <Field label="Direction" required error={errors.direction?.message}>
            <Select {...form.register("direction")} options={DIRECTION_OPTIONS} />
          </Field>
        </div>
        {kind && (
          <Field
            label={kind === "vendor" ? "Vendor" : kind === "client" ? "Client" : "Labourer"}
            required
            error={errors.partyId?.message}
            hint={parties.isSuccess && partyOptions.length === 0 ? `No ${kind}s on this site yet. Add them in Masters.` : undefined}
          >
            <Select {...form.register("partyId")} options={partyOptions} placeholder={parties.isLoading ? "Loading…" : `Choose ${kind}…`} />
          </Field>
        )}
        <div className="ce-form-grid">
          <Controller
            control={form.control}
            name="amountPaise"
            render={({ field, fieldState }) => (
              <Field label="Amount" required error={fieldState.error?.message}>
                <MoneyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
              </Field>
            )}
          />
          <Field label="Date" required error={errors.date?.message}>
            <Input type="date" {...form.register("date")} />
          </Field>
          <Field label="Method" error={errors.method?.message}>
            <Select {...form.register("method")} options={METHOD_OPTIONS} placeholder="Not specified" />
          </Field>
          <Field label="Reference" hint="UTR, cheque or bill number" error={errors.reference?.message}>
            <Input {...form.register("reference")} autoComplete="off" />
          </Field>
        </div>
        <Field label="Description" error={errors.description?.message}>
          <Textarea rows={2} {...form.register("description")} />
        </Field>
        {category === "vendor" && (
          <fieldset className="ce-stack fin-fieldset">
            <legend className="ce-muted">Material details (optional)</legend>
            <div className="ce-form-grid">
              <Controller
                control={form.control}
                name="quantity"
                render={({ field, fieldState }) => (
                  <Field label="Quantity" error={fieldState.error?.message}>
                    <QtyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                  </Field>
                )}
              />
              <Field label="Unit" error={errors.unit?.message}>
                <Input placeholder="bags, MT, loads…" {...form.register("unit")} />
              </Field>
              <Controller
                control={form.control}
                name="unitCostPaise"
                render={({ field, fieldState }) => (
                  <Field
                    label="Unit cost"
                    error={fieldState.error?.message}
                    hint={qtyVal != null && unitCost != null ? `= ${money(Math.round((Math.round(qtyVal * 1000) * unitCost) / 1000))}` : undefined}
                  >
                    <MoneyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                  </Field>
                )}
              />
            </div>
          </fieldset>
        )}
      </form>
    </Drawer>
  );
}
