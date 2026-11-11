/** Formatting for Indian builders: ₹ with lakh/crore grouping, quantities, dates. */

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
const inrWhole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const qtyFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 });

/** 41250 → "₹412.50" */
export const money = (paise: number | null | undefined) => (paise == null ? "—" : inr.format(paise / 100));
/** 1620000000 → "₹1.62 Cr", 162000000 → "₹16.2 L" — for headline figures */
export function moneyShort(paise: number | null | undefined) {
  if (paise == null) return "—";
  const r = paise / 100;
  const abs = Math.abs(r);
  if (abs >= 1e7) return `₹${(r / 1e7).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  if (abs >= 1e5) return `₹${(r / 1e5).toFixed(1).replace(/\.0$/, "")} L`;
  return inrWhole.format(r);
}
export const qty = (q: number | null | undefined, unit?: string) =>
  q == null ? "—" : `${qtyFmt.format(q)}${unit ? ` ${unit}` : ""}`;
export const percentFromBp = (bp: number) => `${(bp / 100).toFixed(bp % 100 ? 2 : 0)}%`;

/** rupees text/number → integer paise (rounded). Returns NaN for junk. */
export const toPaise = (rupees: string | number) => {
  const n = typeof rupees === "number" ? rupees : Number(String(rupees).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};
export const toRupees = (paise: number) => paise / 100;

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });

/** "2026-11-11" → "11 Nov 2026" (parsed as a calendar date, no timezone shift) */
export function date(d: string | null | undefined) {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return dateFmt.format(new Date(y!, (m ?? 1) - 1, day ?? 1));
}
export const dateTime = (iso: string | null | undefined) => (iso ? dateTimeFmt.format(new Date(iso)) : "—");
export const time = (iso: string | null | undefined) => (iso ? timeFmt.format(new Date(iso)) : "—");

/** Today's calendar date in the given IANA timezone as YYYY-MM-DD. */
export function today(tz = "Asia/Kolkata") {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return parts; // en-CA formats as YYYY-MM-DD
}
export function addDays(d: string, n: number) {
  const [y, m, day] = d.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, day! + n));
  return dt.toISOString().slice(0, 10);
}
export const startOfMonth = (d: string) => `${d.slice(0, 7)}-01`;

export const minutes = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
export const titleCase = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
