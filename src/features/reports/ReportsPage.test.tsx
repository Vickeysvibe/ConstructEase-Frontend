import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SiteProvider } from "@/app/site";
import { api } from "@/lib/api/client";
import ReportsPage from "./ReportsPage";

vi.mock("@/lib/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn() },
  ApiError: class extends Error {},
}));
vi.mock("@/app/auth", () => ({
  useAuth: () => ({ session: { org: { timezone: "Asia/Kolkata" } } }),
}));

const get = vi.mocked(api.get);

function renderAt(url: string) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SiteProvider site={{ id: "s1", name: "Lakshmi Residency", status: "active", role: "engineer" }}>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path="/sites/s1/reports/*" element={<ReportsPage />} />
          </Routes>
        </MemoryRouter>
      </SiteProvider>
    </QueryClientProvider>,
  );
}

describe("ReportsPage", () => {
  beforeEach(() => {
    get.mockReset();
    get.mockImplementation(async (path: string) => {
      if (path.endsWith("/reports/site-summary"))
        return {
          materials: { receivedPaise: 500000, returnedPaise: 0, netPaise: 500000 },
          labour: { shifts: 10, wagesPaise: 800000 },
          payments: { inPaise: 0, outPaise: 300000 },
          byMonth: [{ month: "2026-11", materialsPaise: 500000, wagesPaise: 800000, paymentsOutPaise: 300000, paymentsInPaise: 0 }],
        };
      return { items: [] };
    });
  });

  it("does not request a report when the custom range is over 366 days", async () => {
    renderAt("/sites/s1/reports/site-summary?range=custom&from=2025-01-01&to=2026-11-11");
    expect(await screen.findByText(/366 days or less/)).toBeInTheDocument();
    expect(get.mock.calls.some(([p]) => String(p).includes("/reports/"))).toBe(false);
    expect(screen.getByRole("button", { name: /download excel/i })).toBeDisabled();
  });

  it("requests the report with the range from the URL", async () => {
    renderAt("/sites/s1/reports/site-summary?range=custom&from=2026-04-01&to=2026-11-11");
    expect(await screen.findByText("Materials (net)")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith(
      "/sites/s1/reports/site-summary",
      { from: "2026-04-01", to: "2026-11-11" },
      expect.anything(),
    );
  });
});
