import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api/client";
import type { Tracker, TrackerRow } from "@/lib/api/types";
import { applyFieldErrors } from "@/lib/hooks";
import { useSite } from "@/app/site";
import { Button, Checkbox, Drawer, Field, FormError, Input, Select, Textarea, notify } from "@/ui";
import { rowSchema, rowToForm, rowValuesBody, type RowForm } from "./trackerForm";

/** Add / edit a tracker row with a form generated from the tracker's columns. */
export function RowDrawer({ tracker, row, onClose, onSaved }: { tracker: Tracker; row: TrackerRow | null; onClose: () => void; onSaved: () => void }) {
  const site = useSite();
  const [formError, setFormError] = useState<string | null>(null);
  const [initial] = useState(() => rowToForm(tracker.columns, row));
  const form = useForm<RowForm>({ resolver: zodResolver(rowSchema(tracker.columns, row ? initial : undefined)), defaultValues: initial });
  const rowsBase = `${site.base}/trackers/${tracker.id}/rows`;
  const save = useMutation({
    mutationFn: (v: RowForm) => {
      const values = rowValuesBody(tracker.columns, v, row ? initial : undefined);
      return row ? api.patch<TrackerRow>(`${rowsBase}/${row.id}`, { values, done: v.done }) : api.post<TrackerRow>(rowsBase, { values, done: v.done });
    },
    onSuccess: () => {
      notify.success(row ? "Row updated." : "Row added.");
      onSaved();
    },
    onError: (err) =>
      setFormError(
        applyFieldErrors(
          err,
          form.setError,
          tracker.columns.map((c) => `values.${c.key}`),
        ),
      ),
  });
  const { errors } = form.formState;
  return (
    <Drawer
      open
      onClose={onClose}
      title={row ? "Edit row" : `Add to ${tracker.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="row-form" loading={save.isPending}>
            {row ? "Save changes" : "Add row"}
          </Button>
        </>
      }
    >
      <form
        id="row-form"
        className="ce-stack"
        noValidate
        onSubmit={form.handleSubmit((v) => {
          setFormError(null);
          save.mutate(v);
        })}
      >
        <FormError message={formError} />
        {tracker.columns.map((c) => {
          const name = `values.${c.key}` as const;
          const error = errors.values?.[c.key]?.message;
          return (
            <Field key={c.key} label={c.label} required={c.required} error={error}>
              {c.type === "status" ? (
                <Select {...form.register(name)} options={c.options.map((o) => ({ value: o, label: o }))} placeholder="—" />
              ) : c.type === "date" ? (
                <Input type="date" {...form.register(name)} />
              ) : c.type === "number" ? (
                <Input inputMode="decimal" numeric autoComplete="off" {...form.register(name)} />
              ) : (
                <Textarea rows={2} {...form.register(name)} />
              )}
            </Field>
          );
        })}
        <Controller
          control={form.control}
          name="done"
          render={({ field }) => <Checkbox label="Done" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} name={field.name} />}
        />
      </form>
    </Drawer>
  );
}
