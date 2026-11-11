import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useSite } from "@/app/site";
import { EmptyState, LoadingBlock, NavTabs, PageHeader } from "@/ui";
import { useReportRange } from "./useReportRange";
import "./reports.css";

const LabourWages = lazy(() => import("./LabourWagesReport"));
const VendorLedger = lazy(() => import("./VendorLedgerReport"));
const Payments = lazy(() => import("./PaymentsReport"));
const Stock = lazy(() => import("./StockReport"));
const SiteSummary = lazy(() => import("./SiteSummaryReport"));

const TABS = [
  { path: "labour-wages", label: "Labour wages" },
  { path: "vendor-ledger", label: "Vendor ledger" },
  { path: "payments", label: "Payments" },
  { path: "stock", label: "Stock" },
  { path: "site-summary", label: "Site summary" },
];

/** Site reports. Each tab is its own URL; the date range travels with the tab links. */
export default function ReportsPage() {
  const site = useSite();
  const { search } = useReportRange();
  return (
    <div className="ce-page">
      <PageHeader title="Reports" description="Pick a period, check the figures, then download the Excel copy." />
      <NavTabs label="Reports" tabs={TABS.map((t) => ({ to: `${site.to(`reports/${t.path}`)}${search}`, label: t.label }))} />
      <Suspense fallback={<LoadingBlock rows={5} />}>
        <Routes>
          <Route index element={<Navigate to={`labour-wages${search}`} replace />} />
          <Route path="labour-wages" element={<LabourWages />} />
          <Route path="vendor-ledger" element={<VendorLedger />} />
          <Route path="payments" element={<Payments />} />
          <Route path="stock" element={<Stock />} />
          <Route path="site-summary" element={<SiteSummary />} />
          <Route path="*" element={<EmptyState title="Report not found" description="Pick a report from the tabs above." />} />
        </Routes>
      </Suspense>
    </div>
  );
}
