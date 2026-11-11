import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SiteRole } from "@/lib/api/types";
import { SiteProvider } from "@/app/site";
import { ConfirmProvider } from "@/ui";

/** Renders `ui` under /sites/s1/<path> with the real SiteProvider for the given role. */
export function renderInSite(
  ui: ReactElement,
  { role = "engineer", path = "", route = "*", archived = false }: { role?: SiteRole; path?: string; route?: string; archived?: boolean } = {},
) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const site = { id: "s1", name: "Anna Nagar villa", status: archived ? ("archived" as const) : ("active" as const), role };
  return render(
    <QueryClientProvider client={qc}>
      <ConfirmProvider>
        <MemoryRouter initialEntries={[`/sites/s1/${path}`]}>
          <SiteProvider site={site}>
            <Routes>
              <Route path={`/sites/s1/${route}`} element={ui} />
            </Routes>
          </SiteProvider>
        </MemoryRouter>
      </ConfirmProvider>
    </QueryClientProvider>,
  );
}
