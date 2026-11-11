import { Controller, useFieldArray, type UseFormReturn } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { TrackerColumn } from "@/lib/api/types";
import { Button, Checkbox, Field, FormError, IconButton, Input, Select } from "@/ui";
import { COLUMN_TYPES, MAX_COLUMNS, blankColumn, type TrackerForm } from "./trackerForm";

/** Name + column list builder shared by "New tracker" and "Edit columns". */
export function ColumnsEditor({ form, saved = [] }: { form: UseFormReturn<TrackerForm>; saved?: TrackerColumn[] }) {
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "columns" });
  const { errors } = form.formState;
  const columns = form.watch("columns");
  const listError = errors.columns?.root?.message ?? errors.columns?.message;

  return (
    <div className="ce-stack">
      <Field label="Tracker name" required error={errors.name?.message}>
        <Input placeholder="Snag list, Curing log…" autoComplete="off" {...form.register("name")} />
      </Field>
      <h3 className="wl-subhead">Columns</h3>
      <FormError message={listError} />
      <ol className="wl-cols">
        {fields.map((f, i) => {
          const savedCol = saved.find((c) => c.key === columns[i]?.key);
          const type = columns[i]?.type;
          const typeChanged = savedCol && type && savedCol.type !== type;
          const err = errors.columns?.[i];
          return (
            <li key={f.id} className="wl-col">
              <div className="wl-col__head">
                <span className="ce-muted">
                  Column {i + 1}
                  {savedCol ? "" : saved.length ? " · new" : ""}
                </span>
                <div className="ce-row" style={{ flexWrap: "nowrap" }}>
                  <IconButton size="sm" label={`Move column ${i + 1} up`} icon={<ArrowUp />} disabled={i === 0} onClick={() => move(i, i - 1)} />
                  <IconButton size="sm" label={`Move column ${i + 1} down`} icon={<ArrowDown />} disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} />
                  <IconButton size="sm" label={`Remove column ${i + 1}`} icon={<Trash2 />} disabled={fields.length === 1} onClick={() => remove(i)} />
                </div>
              </div>
              <div className="ce-form-grid">
                <Field label="Label" required error={err?.label?.message}>
                  <Input autoComplete="off" {...form.register(`columns.${i}.label`)} />
                </Field>
                <Field
                  label="Type"
                  error={err?.type?.message}
                  hint={typeChanged ? "Every saved value must fit the new type, or saving will fail." : undefined}
                >
                  <Select {...form.register(`columns.${i}.type`)} options={COLUMN_TYPES} />
                </Field>
              </div>
              {type === "status" && (
                <Field label="Options" required hint="Separate with commas, e.g. Open, In progress, Done" error={err?.options?.message}>
                  <Input autoComplete="off" {...form.register(`columns.${i}.options`)} />
                </Field>
              )}
              <Controller
                control={form.control}
                name={`columns.${i}.required`}
                render={({ field }) => (
                  <Checkbox label="Required" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} onBlur={field.onBlur} name={field.name} />
                )}
              />
            </li>
          );
        })}
      </ol>
      <Button icon={<Plus />} disabled={fields.length >= MAX_COLUMNS} onClick={() => append(blankColumn())} style={{ alignSelf: "flex-start" }}>
        Add column
      </Button>
    </div>
  );
}
