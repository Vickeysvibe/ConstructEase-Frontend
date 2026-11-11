import { z } from "zod";
import type { Payment, PaymentCategory, PaymentInput, PaymentMethod, PaymentPatch, PartyKind } from "@/lib/api/types";

export const CATEGORY_OPTIONS: { value: PaymentCategory; label: string }[] = [
  { value: "vendor", label: "Vendor" },
  { value: "client", label: "Client" },
  { value: "labour", label: "Labour" },
  { value: "other", label: "Other expense / income" },
];
export const DIRECTION_OPTIONS = [
  { value: "out", label: "Paid out" },
  { value: "in", label: "Received" },
];
export const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];
export const labelOf = (opts: { value: string; label: string }[], v?: string | null) => opts.find((o) => o.value === v)?.label ?? v ?? "—";

/** vendor → out, client → in: the usual direction for each category. */
export const defaultDirection = (c: PaymentCategory): "in" | "out" => (c === "client" ? "in" : "out");
export const partyKindFor = (c: PaymentCategory): PartyKind | null => (c === "other" ? null : c);

const text = (max: number) => z.string().trim().max(max, `At most ${max} characters`);

const paymentBase = z.object({
    direction: z.enum(["in", "out"]),
    category: z.enum(["vendor", "client", "labour", "other"]),
    partyId: z.string(),
    amountPaise: z.number({ invalid_type_error: "Enter the amount" }).int().positive("Amount must be more than ₹0").nullable(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
    method: z.union([z.enum(["cash", "bank", "upi", "cheque", "other"]), z.literal("")]),
    reference: text(120),
    description: text(1000),
    quantity: z.number().positive("Must be more than 0").nullable(),
    unit: text(30),
    unitCostPaise: z.number().int().min(0).nullable(),
});
export const paymentSchema = paymentBase.superRefine((v, ctx) => {
    if (v.amountPaise == null) ctx.addIssue({ code: "custom", path: ["amountPaise"], message: "Enter the amount" });
    if (v.category !== "other" && !v.partyId) ctx.addIssue({ code: "custom", path: ["partyId"], message: `Choose the ${v.category} this payment is for` });
  });
export type PaymentForm = z.infer<typeof paymentSchema>;
export const PAYMENT_FIELDS = Object.keys(paymentBase.shape);

export function blankPayment(date: string, preset?: { category?: PaymentCategory; partyId?: string }): PaymentForm {
  const category = preset?.category ?? "vendor";
  return {
    direction: defaultDirection(category),
    category,
    partyId: preset?.partyId ?? "",
    amountPaise: null,
    date,
    method: "",
    reference: "",
    description: "",
    quantity: null,
    unit: "",
    unitCostPaise: null,
  };
}

export const paymentToForm = (p: Payment): PaymentForm => ({
  direction: p.direction,
  category: p.category,
  partyId: p.partyId ?? p.party?.id ?? "",
  amountPaise: p.amountPaise,
  date: p.date,
  method: p.method ?? "",
  reference: p.reference ?? "",
  description: p.description ?? "",
  quantity: p.quantity ?? null,
  unit: p.unit ?? "",
  unitCostPaise: p.unitCostPaise ?? null,
});

/** POST body: no party for `other`, quantity details only for vendor payments, empty fields left out. */
export function toPaymentInput(v: PaymentForm): PaymentInput {
  const vendor = v.category === "vendor";
  const body: PaymentInput = { date: v.date, direction: v.direction, category: v.category, amountPaise: v.amountPaise ?? 0 };
  if (v.category !== "other" && v.partyId) body.partyId = v.partyId;
  if (v.method) body.method = v.method;
  if (v.reference.trim()) body.reference = v.reference.trim();
  if (v.description.trim()) body.description = v.description.trim();
  if (vendor && v.quantity != null) body.quantity = v.quantity;
  if (vendor && v.unit.trim()) body.unit = v.unit.trim();
  if (vendor && v.unitCostPaise != null) body.unitCostPaise = v.unitCostPaise;
  return body;
}

/** PATCH body: every field sent, empty optional ones as null so they are cleared. */
export function toPaymentPatch(v: PaymentForm): PaymentPatch {
  const b = toPaymentInput(v);
  return {
    date: b.date,
    direction: b.direction,
    category: b.category,
    amountPaise: b.amountPaise,
    partyId: b.partyId ?? null,
    method: b.method ?? null,
    reference: b.reference ?? null,
    description: b.description ?? null,
    quantity: b.quantity ?? null,
    unit: b.unit ?? null,
    unitCostPaise: b.unitCostPaise ?? null,
  };
}

/** Start of the Indian financial year (1 April) containing `d`. */
export function financialYearStart(d: string) {
  const y = Number(d.slice(0, 4));
  const m = Number(d.slice(5, 7));
  return `${m >= 4 ? y : y - 1}-04-01`;
}
