import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { createBrowserRouter, Navigate, useRouteError } from "react-router-dom";
import { ButtonLink, EmptyState, ErrorState, LoadingBlock } from "@/ui";
import { AppShell, PlainLayout, SiteLayout } from "./AppShell";
import { RequireAuth, RequireOrgAdmin, RequireSitePermission, SiteScope } from "./guards";

const page = (load: () => Promise<{ default: ComponentType }>) => {
  const C: LazyExoticComponent<ComponentType> = lazy(load);
  return (
    <Suspense fallback={<LoadingBlock rows={5} />}>
      <C />
    </Suspense>
  );
};
const named = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  page(() => load().then((m) => ({ default: m[name] })));

const masters = () => import("@/features/masters/pages");

function RouteError() {
  const error = useRouteError();
  return (
    <div style={{ padding: 32 }}>
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    </div>
  );
}

function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The link may be old, or the page has moved."
      action={<ButtonLink to="/">Back to your sites</ButtonLink>}
    />
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: page(() => import("@/features/auth/LoginPage")), errorElement: <RouteError /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            element: <PlainLayout />,
            children: [
              { index: true, element: page(() => import("@/features/home/HomePage")) },
              { path: "account", element: page(() => import("@/features/auth/AccountPage")) },
              {
                path: "settings/*",
                element: <RequireOrgAdmin>{page(() => import("@/features/settings/SettingsPage"))}</RequireOrgAdmin>,
              },
              { path: "*", element: <NotFound /> },
            ],
          },
          {
            path: "sites/:siteId",
            element: <SiteScope />,
            children: [
              {
                element: <SiteLayout />,
                children: [
                  { index: true, element: page(() => import("@/features/dashboard/SiteDashboardPage")) },
                  {
                    path: "purchasing",
                    children: [
                      { index: true, element: <Navigate to="orders" replace /> },
                      { path: "orders", element: page(() => import("@/features/purchasing/OrdersPage")) },
                      { path: "orders/new", element: page(() => import("@/features/purchasing/OrderEditorPage")) },
                      { path: "orders/:poId/edit", element: page(() => import("@/features/purchasing/OrderEditorPage")) },
                      { path: "orders/:poId", element: page(() => import("@/features/purchasing/OrderDetailPage")) },
                      { path: "receipts", element: page(() => import("@/features/purchasing/ReceiptsPage")) },
                      { path: "receipts/:receiptId", element: page(() => import("@/features/purchasing/ReceiptDetailPage")) },
                      { path: "returns", element: page(() => import("@/features/purchasing/ReturnsPage")) },
                      { path: "returns/:returnId", element: page(() => import("@/features/purchasing/ReturnDetailPage")) },
                    ],
                  },
                  {
                    path: "stock",
                    children: [
                      { index: true, element: page(() => import("@/features/stock/StockPage")) },
                      { path: "movements", element: page(() => import("@/features/stock/MovementsPage")) },
                    ],
                  },
                  {
                    path: "attendance",
                    children: [
                      { index: true, element: page(() => import("@/features/attendance/AttendancePage")) },
                      { path: "checkins", element: page(() => import("@/features/attendance/CheckinsPage")) },
                    ],
                  },
                  {
                    path: "finance",
                    element: <RequireSitePermission perm="finance:read" />,
                    children: [
                      { index: true, element: <Navigate to="payments" replace /> },
                      { path: "payments", element: page(() => import("@/features/finance/PaymentsPage")) },
                      { path: "ledger/:partyId", element: page(() => import("@/features/finance/LedgerPage")) },
                    ],
                  },
                  {
                    path: "worklog",
                    children: [
                      { index: true, element: page(() => import("@/features/worklog/TrackersPage")) },
                      { path: ":trackerId", element: page(() => import("@/features/worklog/TrackerPage")) },
                    ],
                  },
                  { path: "notes", element: page(() => import("@/features/notes/NotesPage")) },
                  {
                    path: "masters",
                    children: [
                      { index: true, element: <Navigate to="vendors" replace /> },
                      { path: "vendors", element: named(masters, "VendorsPage") },
                      { path: "clients", element: named(masters, "ClientsPage") },
                      { path: "labour", element: named(masters, "LabourPage") },
                      { path: "products", element: named(masters, "ProductsPage") },
                      { path: "team", element: named(masters, "TeamPage") },
                    ],
                  },
                  {
                    path: "reports/*",
                    element: (
                      <RequireSitePermission perm="reports:read">
                        {page(() => import("@/features/reports/ReportsPage"))}
                      </RequireSitePermission>
                    ),
                  },
                  { path: "*", element: <NotFound /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
