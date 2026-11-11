import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { LoadingBlock, EmptyState, ButtonLink } from "@/ui";
import { useAuth } from "./auth";
import { SiteProvider, useSite, type SitePermission } from "./site";

function FullPageLoading() {
  return (
    <div style={{ maxWidth: 480, margin: "20vh auto", padding: 16 }}>
      <LoadingBlock rows={3} />
    </div>
  );
}

/** Every app route sits behind this. Unknown session → spinner; none → /login?next=… */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <FullPageLoading />;
  if (status === "anonymous") {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
}

export function RequireOrgAdmin({ children }: { children?: ReactNode }) {
  const { isOrgAdmin } = useAuth();
  if (!isOrgAdmin) return <Forbidden />;
  return children ? <>{children}</> : <Outlet />;
}

/** Resolves :siteId against the sites the user can see and provides useSite(). */
export function SiteScope() {
  const { siteId } = useParams();
  const { me } = useAuth();
  if (!me) return <FullPageLoading />;
  const site = me.sites.find((s) => s.id === siteId);
  if (!site) {
    return (
      <div style={{ padding: 32 }}>
        <EmptyState
          title="Site not found"
          description="It doesn't exist or you haven't been added to it. Ask your engineer or admin to add you."
          action={<ButtonLink to="/">Back to your sites</ButtonLink>}
        />
      </div>
    );
  }
  return (
    <SiteProvider site={site}>
      <Outlet />
    </SiteProvider>
  );
}

/** Hides a route from roles without the permission (the API also refuses). */
export function RequireSitePermission({ perm, children }: { perm: SitePermission; children?: ReactNode }) {
  const { can } = useSite();
  if (!can(perm)) return <Forbidden />;
  return children ? <>{children}</> : <Outlet />;
}

export function Forbidden() {
  return (
    <EmptyState
      title="You don't have access to this page"
      description="Your role on this site doesn't include it. Ask an engineer or admin if you need it."
      action={<ButtonLink to="/">Back to your sites</ButtonLink>}
    />
  );
}
