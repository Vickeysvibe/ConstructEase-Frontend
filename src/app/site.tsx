import { createContext, useContext, type ReactNode } from "react";
import type { MeSite, SiteRole } from "@/lib/api/types";

/**
 * Client-side mirror of the API permission matrix (Constructease-Backend/src/core/access.ts).
 * It only hides UI the user can't use; the API enforces every rule regardless.
 */
export const SITE_PERMISSIONS = {
  "site:read": ["engineer", "supervisor"],
  "site:manage": ["engineer"],
  "masters:write": ["engineer"],
  "labour:write": ["engineer", "supervisor"],
  "purchasing:write": ["engineer"],
  "receiving:write": ["engineer", "supervisor"],
  "stock:adjust": ["engineer"],
  "attendance:write": ["engineer", "supervisor"],
  "attendance:backdate": ["engineer"],
  "finance:read": ["engineer"],
  "finance:write": ["engineer"],
  "reports:read": ["engineer"],
  "worklog:write": ["engineer", "supervisor"],
  "notes:write": ["engineer", "supervisor"],
  "checkins:viewAll": ["engineer"],
} as const satisfies Record<string, readonly SiteRole[]>;
export type SitePermission = keyof typeof SITE_PERMISSIONS;

export interface SiteContextValue {
  site: MeSite;
  /** API path prefix for this site, e.g. `/sites/abc123` */
  base: string;
  /** app route prefix, e.g. `/sites/abc123` */
  to: (path?: string) => string;
  can: (perm: SitePermission) => boolean;
  archived: boolean;
}

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({ site, children }: { site: MeSite; children: ReactNode }) {
  const base = `/sites/${site.id}`;
  const archived = site.status === "archived";
  const value: SiteContextValue = {
    site,
    base,
    to: (path = "") => `${base}${path ? (path.startsWith("/") ? path : `/${path}`) : ""}`,
    can: (perm) => {
      const allowed = (SITE_PERMISSIONS[perm] as readonly SiteRole[]).includes(site.role);
      const readOnly = perm === "site:read" || perm === "finance:read" || perm === "reports:read";
      return allowed && (readOnly || !archived);
    },
    archived,
  };
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

/** Current site, role and permission check. Only available under /sites/:siteId. */
export function useSite() {
  const v = useContext(SiteContext);
  if (!v) throw new Error("useSite must be used under a site route");
  return v;
}
