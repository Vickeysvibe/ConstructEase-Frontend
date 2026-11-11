import { screen } from "@testing-library/react";
import { api } from "@/lib/api/client";
import OrdersPage from "./OrdersPage";
import OrderDetailPage from "./OrderDetailPage";
import { renderInSite } from "./testUtils";
import { samplePO } from "./fixtures";

vi.mock("@/app/auth", () => ({ useAuth: () => ({ session: { org: { timezone: "Asia/Kolkata" } } }) }));
vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return { ...actual, api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } };
});

const emptyList = { items: [], page: 1, pageSize: 25, total: 0 };

describe("purchase orders list", () => {
  beforeEach(() => vi.mocked(api.get).mockResolvedValue(emptyList));

  it("engineers can create a PO", async () => {
    renderInSite(<OrdersPage />, { role: "engineer", path: "purchasing/orders" });
    expect(await screen.findByText("No purchase orders yet")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "New purchase order" }).length).toBeGreaterThan(0);
  });

  it("supervisors don't see Create PO", async () => {
    renderInSite(<OrdersPage />, { role: "supervisor", path: "purchasing/orders" });
    expect(await screen.findByText("No purchase orders yet")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "New purchase order" })).not.toBeInTheDocument();
  });
});

describe("purchase order detail", () => {
  const renderDetail = (opts: Parameters<typeof renderInSite>[1]) => {
    vi.mocked(api.get).mockImplementation(async (path: string) => (path.endsWith("/purchase-orders/po1") ? samplePO() : emptyList));
    return renderInSite(<OrderDetailPage />, { path: "purchasing/orders/po1", route: "purchasing/orders/:poId", ...opts });
  };

  it("engineers can receive and return goods", async () => {
    renderDetail({ role: "engineer" });
    expect(await screen.findByRole("button", { name: "Receive goods" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Return goods" })).toBeInTheDocument();
    // something was received, so it can't be cancelled
    expect(screen.queryByRole("button", { name: "Cancel order" })).not.toBeInTheDocument();
  });

  it("supervisors can receive goods but not return them", async () => {
    renderDetail({ role: "supervisor" });
    expect(await screen.findByRole("button", { name: "Receive goods" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Return goods" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel order" })).not.toBeInTheDocument();
  });

  it("an archived site hides every write action", async () => {
    renderDetail({ role: "engineer", archived: true });
    expect(await screen.findByText("PO-2026-0007")).toBeInTheDocument();
    for (const name of ["Receive goods", "Return goods", "Cancel order", "Send to vendor"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument();
  });
});
