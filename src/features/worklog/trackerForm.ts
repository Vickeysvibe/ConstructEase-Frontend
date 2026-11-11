/**
 * Forms generated from tracker columns, mirroring the API's validation (the API stays the authority).
 * Row form values are strings keyed by column key under `values.<key>` so API errors map 1:1.
 */
import { z } from "zod";
import type { UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import type { ColumnInput, ColumnType, TrackerColumn, TrackerRow } from "@/lib/api/types";

export const MAX_TEXT = 2000;
export const MAX_COLUMNS = 30;
export const COLUMN_TYPES: { value: ColumnType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "status", label: "Status (pick from a list)" },
];

// ---------- rows ----------
export interface RowForm {
  values: Record<string, string>;
  done: boolean;
}

const isIsoDate = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m! - 1 && dt.getUTCDate() === d;
};

/** Message for one cell, or null when valid. `initial` is the saved value when editing. */
export function cellError(col: TrackerColumn, raw: string, initial?: string): string | null {
  const v = raw.trim();
  if (!v) {
    // A required column added after the row was created may stay empty until someone fills it.
    if (col.required && !(initial !== undefined && initial.trim() === "")) return `${col.label} is required`;
    return null;
  }
  switch (col.type) {
    case "text":
      return v.length > MAX_TEXT ? `At most ${MAX_TEXT} characters` : null;
    case "number":
      return Number.isFinite(Number(v.replace(/,/g, ""))) ? null : "Must be a number";
    case "date":
      return isIsoDate(v) ? null : "Enter a valid date";
    case "status":
      return col.options.includes(v) ? null : `Must be one of: ${col.options.join(", ")}`;
  }
}

/** zod schema for the row form; `initial` (edit mode) relaxes required columns that were already empty. */
export function rowSchema(columns: TrackerColumn[], initial?: RowForm) {
  return z.object({
    done: z.boolean(),
    values: z.record(z.string(), z.string()).superRefine((values, ctx) => {
      for (const col of columns) {
        const msg = cellError(col, values[col.key] ?? "", initial ? (initial.values[col.key] ?? "") : undefined);
        if (msg) ctx.addIssue({ code: "custom", path: [col.key], message: msg });
      }
    }),
  });
}

const toText = (v: string | number | null | undefined) => (v == null ? "" : String(v));

export const rowToForm = (columns: TrackerColumn[], row: TrackerRow | null): RowForm => ({
  done: row?.done ?? false,
  values: Object.fromEntries(columns.map((c) => [c.key, toText(row?.values[c.key])])),
});

function toApiValue(col: TrackerColumn, raw: string): string | number | null {
  const v = raw.trim();
  if (!v) return null;
  return col.type === "number" ? Number(v.replace(/,/g, "")) : v;
}

/**
 * API `values`: on create only filled cells; on edit only cells that changed (cleared → null),
 * so rows that predate a required column stay editable.
 */
export function rowValuesBody(columns: TrackerColumn[], form: RowForm, initial?: RowForm): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {};
  for (const col of columns) {
    const raw = form.values[col.key] ?? "";
    if (initial) {
      if (raw.trim() === (initial.values[col.key] ?? "").trim()) continue;
      out[col.key] = toApiValue(col, raw);
    } else if (raw.trim()) out[col.key] = toApiValue(col, raw);
  }
  return out;
}

// ---------- columns builder ----------
export interface ColumnDraft {
  key?: string;
  label: string;
  type: ColumnType;
  required: boolean;
  /** comma-separated, status only */
  options: string;
}
export interface TrackerForm {
  name: string;
  columns: ColumnDraft[];
}

export const splitOptions = (s: string) =>
  s
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

export const trackerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "At most 80 characters"),
  columns: z
    .array(
      z
        .object({
          key: z.string().optional(),
          label: z.string().trim().min(1, "Label is required").max(60, "At most 60 characters"),
          type: z.enum(["text", "number", "date", "status"]),
          required: z.boolean(),
          options: z.string(),
        })
        .superRefine((c, ctx) => {
          if (c.type !== "status") return;
          const opts = splitOptions(c.options);
          if (!opts.length) ctx.addIssue({ code: "custom", path: ["options"], message: "Add at least one option, separated by commas" });
          else if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) ctx.addIssue({ code: "custom", path: ["options"], message: "Options must be unique" });
          else if (opts.some((o) => o.length > 60)) ctx.addIssue({ code: "custom", path: ["options"], message: "Each option can be at most 60 characters" });
        }),
    )
    .min(1, "Add at least one column")
    .max(MAX_COLUMNS, `A tracker can have at most ${MAX_COLUMNS} columns`)
    .superRefine((cols, ctx) => {
      const seen = new Set<string>();
      cols.forEach((c, i) => {
        const l = c.label.trim().toLowerCase();
        if (l && seen.has(l)) ctx.addIssue({ code: "custom", path: [i, "label"], message: "Column labels must be unique" });
        seen.add(l);
      });
    }),
});

export const columnToDraft = (c: TrackerColumn): ColumnDraft => ({ key: c.key, label: c.label, type: c.type, required: c.required, options: c.options.join(", ") });
export const blankColumn = (): ColumnDraft => ({ label: "", type: "text", required: false, options: "" });

export const draftToColumn = (c: ColumnDraft): ColumnInput => ({
  ...(c.key ? { key: c.key } : {}),
  label: c.label.trim(),
  type: c.type,
  required: c.required,
  options: c.type === "status" ? splitOptions(c.options) : [],
});

/** Saved columns that the edited list no longer contains (their values get deleted). */
export const removedColumns = (saved: TrackerColumn[], drafts: ColumnDraft[]) => saved.filter((c) => !drafts.some((d) => d.key === c.key));

/** API column error paths: `columns.<i>` (409) or `columns.<i>.<field>` (422) → form field name. */
export function columnErrorField(path: string): `columns.${number}.${"label" | "type" | "options"}` | null {
  const m = /^columns\.(\d+)(?:\.(label|type|options|required|key))?/.exec(path);
  if (!m) return null;
  const field = m[2] === "label" || m[2] === "options" ? m[2] : "type";
  return `columns.${Number(m[1])}.${field}`;
}

/**
 * Puts tracker API errors on the form: `name`, `columns.<i>[.<field>]`. Returns a message for the top of the form
 * when something couldn't be placed, or for 409s (saved values that no longer fit) so the reason is visible.
 */
export function applyTrackerErrors(err: unknown, setError: UseFormSetError<TrackerForm>): string | null {
  if (!(err instanceof ApiError)) return err instanceof Error ? err.message : "Something went wrong.";
  let unplaced = err.errors.length === 0;
  for (const e of err.errors) {
    const field = e.path === "name" ? "name" : columnErrorField(e.path);
    if (field) setError(field, { message: e.message });
    else unplaced = true;
  }
  if (err.status === 409 && !unplaced) return "Some saved values don't fit the changed columns. See the highlighted columns.";
  return unplaced ? err.userMessage : null;
}
