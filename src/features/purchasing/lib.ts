/**
 * Purchasing helpers shared by the order, receipt and return screens.
 * Totals here are previews only — the server computes the numbers that are saved.
 */
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api/client";
import type { List, Party, POStatus, Product } from "@/lib/api/types";
import type { SiteContextValue } from "@/app/site";

export const GST_RATES_BP = [0, 500, 1200, 1800, 2800] as const;
export const GST_OPTIONS = GST_RATES_BP.map((bp) => ({ value: String(bp), label: `${bp / 100}%` }));

export const PO_STATUS_LABELS: Record<POStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  partially_received: "Partially received",
  received: "Received",
  cancelled: "Cancelled",
};

/** Quantity (≤ 3 dp) → integer thousandths. */
export const toMilli = (q: number) => Math.round(q * 1000);
/** Integer thousandths → quantity. */
export const fromMilli = (m: number) => m / 1000;

export interface LineMoney {
  amountPaise: number;
  taxPaise: number;
  totalPaise: number;
}

/**
 * Same integer maths as the API: amount = round(qtyMilli × pricePaise / 1000), tax = round(amount × bp / 10000).
 * Missing inputs count as 0.
 */
export function priceLine(qtyValue: number | null | undefined, unitPricePaise: number | null | undefined, taxRateBp: number | null | undefined): LineMoney {
  const amountPaise = Math.round((toMilli(qtyValue ?? 0) * (unitPricePaise ?? 0)) / 1000);
  const taxPaise = Math.round((amountPaise * (taxRateBp ?? 0)) / 10_000);
  return { amountPaise, taxPaise, totalPaise: amountPaise + taxPaise };
}

export function sumLines(lines: LineMoney[]) {
  return lines.reduce(
    (s, l) => ({ subtotalPaise: s.subtotalPaise + l.amountPaise, taxPaise: s.taxPaise + l.taxPaise, totalPaise: s.totalPaise + l.totalPaise }),
    { subtotalPaise: 0, taxPaise: 0, totalPaise: 0 },
  );
}

/** Compares quantities exactly (in thousandths) so 0.1 + 0.2 style float noise never fails a check. */
export const qtyGreater = (a: number, b: number) => toMilli(a) > toMilli(b);

/**
 * The API reports line errors by the index of the line it received (`lines.N.qty`).
 * When the form skipped some rows, translate those indexes back to the form's rows.
 */
export function remapLineErrors(err: unknown, sentToForm: number[]): unknown {
  if (!(err instanceof ApiError) || !err.errors.length) return err;
  const errors = err.errors.map((e) => {
    const m = /^lines\.(\d+)\.(.+)$/.exec(e.path);
    const formIndex = m ? sentToForm[Number(m[1])] : undefined;
    return m && formIndex !== undefined ? { ...e, path: `lines.${formIndex}.${m[2]}` } : e;
  });
  return new ApiError(err.status, err.code, err.title, err.detail, errors, err.body);
}

/** Known per-line paths for applyFieldErrors. */
export const linePaths = (count: number, fields: string[]) =>
  Array.from({ length: count }, (_, i) => fields.map((f) => `lines.${i}.${f}`)).flat();

/** Removes empty strings so the API treats them as "not provided". */
export const blankToUndefined = (s: string | undefined) => (s?.trim() ? s.trim() : undefined);

// ---------- query keys ----------
export const keys = {
  orders: (s: SiteContextValue) => ["purchase-orders", s.site.id] as const,
  receipts: (s: SiteContextValue) => ["goods-receipts", s.site.id] as const,
  returns: (s: SiteContextValue) => ["purchase-returns", s.site.id] as const,
  stock: (s: SiteContextValue) => ["stock", s.site.id] as const,
  movements: (s: SiteContextValue) => ["stock-movements", s.site.id] as const,
};

/** Active vendors attached to this site (first 100, by name) for pickers and filters. */
export function useSiteVendors(site: SiteContextValue) {
  return useQuery({
    queryKey: ["parties", site.site.id, "vendor", { picker: true }],
    queryFn: () => api.get<List<Party>>(`${site.base}/parties`, { kind: "vendor", status: "active", pageSize: 100, sort: "name" }),
    staleTime: 60_000,
  });
}

/** Active products matching `q` (server search) for the product picker. */
export function useProductSearch(q: string) {
  return useQuery({
    queryKey: ["products", { picker: true, q }],
    queryFn: () => api.get<List<Product>>("/products", { q: q || undefined, status: "active", pageSize: 50, sort: "name" }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}
