import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Tracker } from "@/lib/api/types";
import { useSite } from "@/app/site";

export const trackersKey = (siteId: string) => ["trackers", siteId] as const;

/** All trackers of the site (there's no single-tracker GET; the tracker page picks from this list). */
export function useTrackers() {
  const site = useSite();
  return useQuery({
    queryKey: trackersKey(site.site.id),
    queryFn: () => api.get<{ items: Tracker[] }>(`${site.base}/trackers`),
  });
}
