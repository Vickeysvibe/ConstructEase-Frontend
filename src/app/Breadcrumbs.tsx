import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useAuth } from "./auth";
import { PAGES, type PageMeta } from "./pageMeta";

/** Runtime labels for detail pages (e.g. "PO-2026-0001" instead of "Order"), keyed by pathname. */
const CrumbContext = createContext<{ labels: Record<string, string>; set: (path: string, label: string | null) => void } | null>(null);

export function CrumbProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});
  const value = useMemo(
    () => ({
      labels,
      set: (path: string, label: string | null) =>
        setLabels((prev) => {
          if ((label ?? undefined) === prev[path]) return prev;
          const next = { ...prev };
          if (label) next[path] = label;
          else delete next[path];
          return next;
        }),
    }),
    [labels],
  );
  return <CrumbContext.Provider value={value}>{children}</CrumbContext.Provider>;
}

/**
 * Call from a detail page to name its breadcrumb, e.g. useCrumbLabel(po?.number).
 * `levelsUp` names an ancestor instead (the PO edit page names its parent "PO-2026-0001").
 */
export function useCrumbLabel(label: string | undefined | null, levelsUp = 0) {
  const ctx = useContext(CrumbContext);
  const { pathname } = useLocation();
  const path = levelsUp ? pathname.replace(/\/+$/, "").split("/").slice(0, -levelsUp).join("/") : pathname.replace(/\/+$/, "");
  useEffect(() => {
    if (!ctx || !label) return;
    ctx.set(path, label);
    return () => ctx.set(path, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ctx.set is stable in behaviour; re-run on path/label only
  }, [path, label]);
}

function metaFor(path: string): PageMeta | undefined {
  return PAGES.find((p) => matchPath({ path: p.pattern, end: true }, path));
}

/** Help for the current page: the most specific matching entry that has help. */
export function useCurrentPageHelp() {
  const { pathname } = useLocation();
  return useMemo(() => {
    const segments = pathname.replace(/\/+$/, "").split("/");
    for (let i = segments.length; i >= 1; i--) {
      const prefix = segments.slice(0, i).join("/") || "/";
      const m = metaFor(prefix);
      if (m?.help) return m.help;
    }
    return undefined;
  }, [pathname]);
}

interface Crumb {
  label: string;
  to: string;
}

function useCrumbs(): Crumb[] {
  const { pathname } = useLocation();
  const { me } = useAuth();
  const ctx = useContext(CrumbContext);
  return useMemo(() => {
    const clean = pathname.replace(/\/+$/, "") || "/";
    const segments = clean.split("/");
    const out: Crumb[] = [];
    for (let i = 1; i <= segments.length; i++) {
      const path = segments.slice(0, i).join("/") || "/";
      const meta = metaFor(path);
      if (!meta || meta.crumb === null) continue;
      let label = ctx?.labels[path] ?? meta.crumb;
      if (label === "{site}") {
        const siteId = matchPath({ path: meta.pattern, end: true }, path)?.params.siteId;
        label = me?.sites.find((s) => s.id === siteId)?.name ?? "Site";
      }
      out.push({ label, to: meta.to ? `${path}/${meta.to}` : path });
    }
    return out;
  }, [pathname, me, ctx?.labels]);
}

/** Trail of links from "Sites" to the current page, with a back button to the parent page. */
export function Breadcrumbs() {
  const crumbs = useCrumbs();
  const { pathname } = useLocation();
  if (crumbs.length < 2) return null;
  // the last crumb may point at a redirect target of the current page (e.g. /reports → /reports/labour-wages)
  const parents = crumbs.slice(0, -1).filter((c) => c.to !== pathname);
  const parent = parents[parents.length - 1];
  return (
    <div className="crumbbar">
      {parent && (
        <Link to={parent.to} className="crumbbar__back" aria-label={`Back to ${parent.label}`}>
          <ArrowLeft aria-hidden />
          <span>Back</span>
        </Link>
      )}
      <nav aria-label="Breadcrumb">
        <ol>
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={`${i}-${c.to}`}>
                {i > 0 && <ChevronRight aria-hidden className="crumbbar__sep" />}
                {last ? <span aria-current="page">{c.label}</span> : <Link to={c.to}>{c.label}</Link>}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
