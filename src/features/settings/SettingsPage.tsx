import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { EmptyState, LoadingBlock, NavTabs, PageHeader } from "@/ui";
import "./settings.css";

const OrgSettings = lazy(() => import("./OrgSettings"));
const UsersSettings = lazy(() => import("./UsersSettings"));

/** Organisation settings (owner/admin only — the route is wrapped in RequireOrgAdmin). */
export default function SettingsPage() {
  return (
    <div className="ce-page">
      <PageHeader title="Organisation settings" />
      <NavTabs
        label="Settings"
        tabs={[
          { to: "/settings", label: "Organisation", end: true },
          { to: "/settings/users", label: "Users" },
        ]}
      />
      <Suspense fallback={<LoadingBlock rows={5} />}>
        <Routes>
          <Route index element={<OrgSettings />} />
          <Route path="users" element={<UsersSettings />} />
          <Route path="*" element={<EmptyState title="Page not found" description="Pick Organisation or Users above." />} />
        </Routes>
      </Suspense>
    </div>
  );
}
