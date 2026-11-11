import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { JobRef, List, Party, PartyKind } from "@/lib/api/types";
import { useExportJob } from "@/lib/hooks";
import { useSite } from "@/app/site";
import { useReportRange } from "./useReportRange";

export type ReportName = "labour-wages" | "vendor-ledger" | "payments" | "stock" | "site-summary";

/** Loads a report for the URL date range plus the named extra URL filters, and offers its Excel export (202 → job → download). */
export function useReport<T>(name: ReportName, label: string, filters: string[] = []) {
  const site = useSite();
  const range = useReportRange();
  const params: Record<string, string | undefined> = { from: range.from, to: range.to };
  for (const f of filters) params[f] = range.params.get(f) || undefined;
  const path = `${site.base}/reports/${name}`;
  const query = useQuery({
    queryKey: ["reports", site.site.id, name, params],
    queryFn: ({ signal }) => api.get<T>(path, params, signal),
    enabled: range.valid,
    placeholderData: keepPreviousData,
  });
  const exportJob = useExportJob(() => api.get<JobRef>(path, { ...params, format: "xlsx" }), label);
  return { range, query, exportJob, params };
}

/** Parties of one kind attached to this site, for report filters. */
export function useSiteParties(kind: PartyKind) {
  const site = useSite();
  return useQuery({
    queryKey: ["parties", site.site.id, kind, "options"],
    queryFn: () => api.get<List<Party>>(`${site.base}/parties`, { kind, pageSize: 100, sort: "name" }),
    staleTime: 60_000,
  });
}

/** Sums integer values (paise / counts) for display footers. */
export const sum = <T>(rows: T[] | undefined, pick: (r: T) => number) => (rows ?? []).reduce((acc, r) => acc + pick(r), 0);
/** Sums decimal quantities without float drift (≤ 3 dp). */
export const sumQty = <T>(rows: T[] | undefined, pick: (r: T) => number) => sum(rows, (r) => Math.round(pick(r) * 1000)) / 1000;
