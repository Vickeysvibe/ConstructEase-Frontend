import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { List, Party, PartyKind } from "@/lib/api/types";
import { useSite } from "@/app/site";

/** Active parties of one kind attached to the current site (first 100 by name) for pickers. */
export function useSiteParties(kind: PartyKind | null) {
  const site = useSite();
  return useQuery({
    queryKey: ["parties", site.site.id, kind, "picker"],
    queryFn: () => api.get<List<Party>>(`${site.base}/parties`, { kind: kind!, status: "active", pageSize: 100, sort: "name" }),
    enabled: !!kind,
    staleTime: 60_000,
  });
}
