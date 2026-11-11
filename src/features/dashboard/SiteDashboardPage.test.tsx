import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SiteProvider } from "@/app/site";
import { api } from "@/lib/api/client";
import type { SiteDashboard, SiteRole } from "@/lib/api/types";
import SiteDashboardPage from "./SiteDashboardPage";

vi.mock("@/lib/api/client", () => ({
  api: { get: vi.fn() },
  ApiError: class extends Error {},
}));

const base: SiteDashboard = {
  today: { date: "2026-11-11", labourPresent: 12, labourAbsent: 2, shifts: 12.5, checkedIn: [{ userId: "u1", name: "Ravi", at: "2026-11-11T03:30:00Z" }] },
  purchasing: { openPOs: 3, partiallyReceived: 1, awaitingDelivery: [{ id: "po1", number: "PO-2026-0007", vendorName: "Sri Balaji Traders", pendingLines: 2 }] },
  stock: { items: 14 },
  series: [
    { month: "2026-10", materialSpendPaise: 0, wagesPaise: 0, paymentsOutPaise: 0, paymentsInPaise: 0 },
    { month: "2026-11", materialSpendPaise: 1000, wagesPaise: 500, paymentsOutPaise: 0, paymentsInPaise: 0 },
  ],
};

function renderAs(role: SiteRole, data: SiteDashboard) {
  vi.mocked(api.get).mockResolvedValue(data);
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SiteProvider site={{ id: "s1", name: "Lakshmi Residency", status: "active", role }}>
        <MemoryRouter>
          <SiteDashboardPage />
        </MemoryRouter>
      </SiteProvider>
    </QueryClientProvider>,
  );
}

describe("SiteDashboardPage", () => {
  it("hides the finance section and chart when `finance` is absent", async () => {
    renderAs("supervisor", base);
    expect(await screen.findByText("PO-2026-0007")).toBeInTheDocument();
    expect(screen.queryByText("Finance")).not.toBeInTheDocument();
    expect(screen.queryByText("Vendor payable")).not.toBeInTheDocument();
    expect(screen.queryByTestId("monthly-chart")).not.toBeInTheDocument();
    // supervisors get attendance but no money actions
    expect(screen.getByRole("link", { name: /mark attendance/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /record payment/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /new po/i })).not.toBeInTheDocument();
  });

  it("shows finance figures and the chart when `finance` is present", async () => {
    renderAs("engineer", {
      ...base,
      today: { ...base.today, wagesPaise: 840000 },
      stock: { items: 14, valuePaise: 12_500_000 },
      finance: { vendorPayablePaise: 16_200_000, clientReceivedPaise: 500_000_000, monthPaymentsOutPaise: 2_500_000 },
    });
    expect(await screen.findByText("Vendor payable")).toBeInTheDocument();
    expect(screen.getByText("₹1.6 L")).toBeInTheDocument();
    expect(screen.getByTestId("monthly-chart")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /record payment/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "PO-2026-0007" })).toHaveAttribute("href", "/sites/s1/purchasing/orders/po1");
  });

  it("shows an error with retry when the dashboard fails", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("Server unavailable"));
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <SiteProvider site={{ id: "s1", name: "Lakshmi Residency", status: "active", role: "engineer" }}>
          <MemoryRouter>
            <SiteDashboardPage />
          </MemoryRouter>
        </SiteProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Server unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
